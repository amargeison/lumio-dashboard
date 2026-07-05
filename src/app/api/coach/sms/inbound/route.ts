import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Twilio inbound SMS webhook (set as the Messaging webhook on the Lumio number).
// Matches the sender's phone to a player to find the coach, then stores the reply
// as an inbound row. Responds with empty TwiML so Twilio sends no auto-reply.
//
// SECURITY: every request is verified with Twilio's X-Twilio-Signature (HMAC-SHA1
// over the request URL + sorted POST params, keyed by the auth token) before we
// touch the database — otherwise anyone could POST a spoofed reply from a known
// number. Fails closed: no auth token configured, or a bad signature → rejected.
const twiml = () => new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { 'Content-Type': 'text/xml' } })
const last10 = (s: string) => (s || '').replace(/\D/g, '').slice(-10)

// Reconstruct the exact public URL Twilio signed. Behind a proxy, trust the
// forwarded headers; a TWILIO_WEBHOOK_URL env override wins if the reconstruction
// ever drifts from the URL configured in the Twilio console.
function requestUrl(req: NextRequest): string {
  if (process.env.TWILIO_WEBHOOK_URL) return process.env.TWILIO_WEBHOOK_URL
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(/:$/, '')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host
  return `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`
}

// Twilio's request-validation scheme: url + each POST param (sorted by key) as
// key+value, HMAC-SHA1 with the auth token, base64.
function validTwilioSignature(req: NextRequest, params: Record<string, string>, authToken: string): boolean {
  const sig = req.headers.get('x-twilio-signature')
  if (!sig) return false
  let data = requestUrl(req)
  for (const k of Object.keys(params).sort()) data += k + params[k]
  const expected = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64')
  try {
    const a = Buffer.from(sig), b = Buffer.from(expected)
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch { return false }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const params: Record<string, string> = {}
    form.forEach((v, k) => { params[k] = typeof v === 'string' ? v : '' })

    // Verify the request really came from Twilio before doing anything.
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!authToken || !validTwilioSignature(req, params, authToken)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const from = params.From || ''
    const body = params.Body || ''
    const sid = params.MessageSid || ''
    if (!from || !body) return twiml()

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { data: players } = await admin.from('coach_players').select('coach_id, name, phone, contact_phone, parent_phone')
    const fp = last10(from)
    const match = (players ?? []).find((p: any) => [p.phone, p.contact_phone, p.parent_phone].filter(Boolean).some((x: string) => last10(x) === fp))
    if (!match) return twiml() // unknown sender — nothing to thread to

    // Dedupe on the Twilio message SID.
    if (sid) {
      const { data: dupe } = await admin.from('coach_messages').select('id').eq('coach_id', match.coach_id).eq('external_id', sid).maybeSingle()
      if (dupe) return twiml()
    }
    await admin.from('coach_messages').insert({
      coach_id: match.coach_id, direction: 'in', from_name: match.name, recipients: match.name, thread_key: match.name,
      body, channels: 'sms', status: 'received', external_id: sid || null, read: false, created_at: new Date().toISOString(),
    })
    return twiml()
  } catch {
    return twiml()
  }
}
