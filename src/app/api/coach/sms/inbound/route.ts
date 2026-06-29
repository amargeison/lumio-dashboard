import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Twilio inbound SMS webhook (set as the Messaging webhook on the Lumio number).
// Matches the sender's phone to a player to find the coach, then stores the reply
// as an inbound row. Responds with empty TwiML so Twilio sends no auto-reply.
const twiml = () => new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { 'Content-Type': 'text/xml' } })
const last10 = (s: string) => (s || '').replace(/\D/g, '').slice(-10)

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const from = String(form.get('From') || '')
    const body = String(form.get('Body') || '')
    const sid = String(form.get('MessageSid') || '')
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
