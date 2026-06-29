import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseInboundToken } from '@/lib/coach/inbound'

export const runtime = 'nodejs'

// Inbound-email webhook (Resend inbound, or any provider that POSTs JSON).
// Set the destination to: https://lumiosports.com/api/coach/inbound-email?token=<RESEND_INBOUND_SECRET>
// A parent reply to reply+<token>@inbound.lumiosports.com lands here; the token
// identifies the coach + conversation, so it threads into the in-app inbox.

const str = (v: any): string => typeof v === 'string' ? v : (v?.address || v?.email || v?.value || '')
const name = (v: any): string => {
  if (typeof v === 'string') { const m = v.match(/^\s*"?([^"<]*?)"?\s*<[^>]+>/); return (m?.[1] || v.split('@')[0]).trim() }
  return (v?.name || str(v).split('@')[0] || '').trim()
}
// Strip the most common quoted-reply tail so we store just the new text.
const clean = (t: string): string => String(t || '').split(/\n\s*On .+wrote:|\n-----Original|\n________/)[0].trim()

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_INBOUND_SECRET
  if (secret && new URL(req.url).searchParams.get('token') !== secret) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let payload: any
  try { payload = await req.json() } catch { return NextResponse.json({ ok: true }) }
  const d = payload?.data ?? payload ?? {}

  // Recipient(s) — find the reply+ token address.
  const toList: any[] = Array.isArray(d.to) ? d.to : (d.to ? [d.to] : [])
  const tokenStr = toList.map(str).find(a => /reply\+/i.test(a)) || str(d.to)
  const parsed = parseInboundToken(tokenStr || '')
  if (!parsed) return NextResponse.json({ ok: true, ignored: 'no token' })

  const fromName = name(d.from) || str(d.from)
  const body = clean(d.text || d.body || d.html || '')
  const subject = d.subject || null
  const externalId = d.message_id || d.messageId || d.id || d.email_id || null
  if (!body) return NextResponse.json({ ok: true, ignored: 'empty' })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  if (externalId) {
    const { data: dupe } = await admin.from('coach_messages').select('id').eq('coach_id', parsed.coachId).eq('external_id', externalId).maybeSingle()
    if (dupe) return NextResponse.json({ ok: true, dedup: true })
  }
  const conv = parsed.recipientName || fromName
  const { error } = await admin.from('coach_messages').insert({
    coach_id: parsed.coachId, direction: 'in', from_name: fromName, recipients: conv, thread_key: conv,
    subject, body, channels: 'email', status: 'received', external_id: externalId, read: false, created_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ ok: true, error: error.message })
  return NextResponse.json({ ok: true, added: 1 })
}
