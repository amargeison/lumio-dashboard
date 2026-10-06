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

    // Everybody whose number this is. Read a page at a time: one unbounded
    // select stops at the first thousand rows, so on a busy database most
    // numbers were never looked at.
    //
    // SCHEMA: this expects coach_players.phone, .contact_phone and .parent_phone.
    // If the read fails it is logged — it used to be ignored, which turned every
    // reply into "unknown sender" and threw it away without a word.
    type P = { id: string; coach_id: string; name: string | null; phone: string | null; contact_phone: string | null; parent_phone: string | null }
    const fp = last10(from)
    const matches: P[] = []
    for (let at = 0; ; at += 1000) {
      const { data, error } = await admin.from('coach_players')
        .select('id, coach_id, name, phone, contact_phone, parent_phone').order('id').range(at, at + 999)
      if (error) { console.error('[coach/sms/inbound] cannot read roster phone numbers', error.message); return twiml() }
      const page = (data ?? []) as P[]
      matches.push(...page.filter(p => [p.phone, p.contact_phone, p.parent_phone].some(x => !!x && last10(x) === fp)))
      if (page.length < 1000) break
    }
    if (fp.length < 10 || !matches.length) return twiml() // unknown sender — nothing to thread to

    // Which academy is this a reply TO? Lumio texts from one number for every
    // academy, so the number alone does not say. A family at two clubs has the
    // same number on two rosters, and "first row wins" put their reply in
    // whichever academy happened to come back first.
    //
    // The reply answers a text, so look for the text: the academy that most
    // recently texted one of these players. Only when that points at ONE
    // academy is the reply filed. Two academies texting the same number inside
    // the window cannot be told apart, and a parent's reply landing in the
    // wrong club's inbox is worse than it not landing — so it is not guessed.
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data: texted } = await admin.from('coach_messages')
      .select('coach_id, player_id, created_at')
      .in('player_id', matches.map(p => p.id).slice(0, 200))
      .eq('direction', 'out').ilike('channels', '%sms%').gte('created_at', since)
      .order('created_at', { ascending: false }).limit(200)
    const answered = (texted ?? []).filter(t => matches.some(p => p.id === t.player_id && p.coach_id === t.coach_id))
    const academies = Array.from(new Set((answered.length ? answered.map(t => t.coach_id as string) : matches.map(p => p.coach_id))))
    if (academies.length !== 1) {
      console.warn('[coach/sms/inbound] reply not filed: the number is on %d academies and it is not clear which one it answers', academies.length)
      return twiml()
    }
    const academyId = academies[0]

    // Which player, inside that academy. One number on two siblings is common
    // (it is the parent's): the one last texted if there is one, otherwise it
    // is kept for the coach under the number and linked to neither child.
    const here = matches.filter(p => p.coach_id === academyId)
    const lastTexted = answered.find(t => t.coach_id === academyId)?.player_id
    const match = here.length === 1 ? here[0] : here.find(p => p.id === lastTexted) ?? null
    const conv = match ? (match.name || '').trim() || from : from

    // Dedupe on the Twilio message SID.
    if (sid) {
      const { data: dupe } = await admin.from('coach_messages').select('id').eq('coach_id', academyId).eq('external_id', sid).maybeSingle()
      if (dupe) return twiml()
    }
    await admin.from('coach_messages').insert({
      coach_id: academyId, player_id: match?.id ?? null, direction: 'in', from_name: conv, recipients: conv,
      // A player's thread is named after them; an unplaced reply gets a key that
      // can never equal a player's name.
      thread_key: match ? conv : `contact:${fp}`,
      body, channels: 'sms', status: 'received', external_id: sid || null, read: false, created_at: new Date().toISOString(),
    })
    return twiml()
  } catch {
    return twiml()
  }
}
