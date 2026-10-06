import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { parseInboundToken } from '@/lib/coach/inbound'

export const runtime = 'nodejs'

// Inbound-email webhook. Primary provider is Resend inbound (event `email.received`):
//   • Auth   = Svix signature (svix-id/timestamp/signature) verified with RESEND_WEBHOOK_SECRET.
//   • Body   = NOT in the webhook (metadata only) — fetched from the Received Emails API.
// A parent reply to reply+<token>@inbound.lumiosports.com lands here; the token
// identifies the coach + conversation, so it threads into the in-app inbox.
//
// Also tolerates any provider that POSTs a full email JSON with a ?token=<secret>
// (RESEND_INBOUND_SECRET) — the body is then read straight from the payload.

const toList = (v: any): any[] => Array.isArray(v) ? v : (v ? [v] : [])
const str = (v: any): string => typeof v === 'string' ? v : (v?.address || v?.email || v?.value || '')
const name = (v: any): string => {
  if (typeof v === 'string') { const m = v.match(/^\s*"?([^"<]*?)"?\s*<[^>]+>/); return (m?.[1] || v.split('@')[0]).trim() }
  return (v?.name || str(v).split('@')[0] || '').trim()
}
// Strip the most common quoted-reply tail so we store just the new text.
const clean = (t: string): string => String(t || '').split(/\n\s*On .+wrote:|\n-----Original|\n________/)[0].trim()
// Minimal HTML → text (Resend may return html-only when there's no text part).
const htmlToText = (h: string): string => String(h || '')
  .replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|h[1-6])>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\n{3,}/g, '\n\n').trim()

// Verify a Svix-signed webhook (Resend's scheme) against the raw request body.
function verifySvix(rawBody: string, headers: Headers, secret: string): boolean {
  try {
    const id = headers.get('svix-id'), ts = headers.get('svix-timestamp'), sigHeader = headers.get('svix-signature')
    if (!id || !ts || !sigHeader) return false
    const now = Math.floor(Date.now() / 1000), t = parseInt(ts, 10)
    if (!t || Math.abs(now - t) > 300) return false // 5-min replay window
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
    const expected = crypto.createHmac('sha256', secretBytes).update(`${id}.${ts}.${rawBody}`).digest('base64')
    const exp = Buffer.from(expected)
    return sigHeader.split(' ').some(part => {
      const sig = Buffer.from(part.split(',')[1] || part)
      return sig.length === exp.length && crypto.timingSafeEqual(sig, exp)
    })
  } catch { return false }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()

  // ── Auth (fails closed) ─────────────────────────────────────────────────────
  // If Resend/Svix is configured, EVERY request must carry a valid signature — a
  // missing svix-id header can't downgrade to the legacy path. Only when no Svix
  // secret is set do we accept the legacy ?token=<secret>. No auth configured at
  // all → refuse, so the endpoint is never open.
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  const legacy = process.env.RESEND_INBOUND_SECRET
  if (webhookSecret) {
    if (!verifySvix(raw, req.headers, webhookSecret)) return NextResponse.json({ error: 'Bad signature' }, { status: 401 })
  } else if (legacy) {
    if (new URL(req.url).searchParams.get('token') !== legacy) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  } else {
    return NextResponse.json({ error: 'Inbound email not configured' }, { status: 503 })
  }

  let payload: any
  try { payload = JSON.parse(raw) } catch { return NextResponse.json({ ok: true }) }
  // Resend wraps the email in { type, data }; flat providers put fields at the top.
  if (payload?.type && payload.type !== 'email.received') return NextResponse.json({ ok: true, ignored: 'type' })
  const d = payload?.data ?? payload ?? {}

  // Recipient(s) — find the reply+ token across to / received_for / cc.
  const candidates = [...toList(d.to), ...toList(d.received_for), ...toList(d.cc)]
  const tokenStr = candidates.map(str).find(a => /reply\+/i.test(a)) || str(d.to)
  const parsed = parseInboundToken(tokenStr || '')
  if (!parsed) return NextResponse.json({ ok: true, ignored: 'no token' })

  // Body — inline if the provider sent it, else fetch from Resend's Received Emails API.
  let body = clean(d.text || d.body || (d.html ? htmlToText(d.html) : ''))
  let subject = d.subject ?? null
  let fromRaw: any = d.from
  const emailId = d.email_id || d.id || d.messageId || null
  const apiKey = process.env.RESEND_API_KEY
  if (!body && emailId && apiKey) {
    try {
      const r = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, { headers: { Authorization: `Bearer ${apiKey}` } })
      if (r.ok) {
        const full = await r.json()
        body = clean(full.text || (full.html ? htmlToText(full.html) : ''))
        subject = subject ?? full.subject ?? null
        fromRaw = full.headers?.from || full.from || fromRaw
      }
    } catch { /* leave body empty → ignored below */ }
  }

  const fromName = name(fromRaw) || str(fromRaw)
  const externalId = d.message_id || emailId || null
  if (!body) return NextResponse.json({ ok: true, ignored: 'empty' })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  if (externalId) {
    const { data: dupe } = await admin.from('coach_messages').select('id').eq('coach_id', parsed.coachId).eq('external_id', externalId).maybeSingle()
    if (dupe) return NextResponse.json({ ok: true, dedup: true })
  }
  // ── Which conversation ──────────────────────────────────────────────────────
  // The token says who the coach's email was to. Since messages moved to player
  // ids it carries `player:<id>`; an email sent before that carries the name.
  //
  // A name is only trusted when exactly one player in the academy has it. Two
  // players called "Sam Twin" → the reply is kept for the coach but linked to
  // neither child, so it cannot appear in the wrong family's app.
  const key = parsed.recipientName || ''
  let playerId: string | null = null
  let conv = fromName
  let threadKey = `contact:${(str(fromRaw).match(/[^\s<>"]+@[^\s<>"]+/)?.[0] || fromName).toLowerCase()}`
  if (key.startsWith('player:')) {
    const { data: p } = await admin.from('coach_players')
      .select('id, name').eq('id', key.slice(7)).eq('coach_id', parsed.coachId).maybeSingle()
    if (p) { playerId = p.id as string; conv = (p.name || '').trim() || fromName; threadKey = conv }
  } else if (/^(contact|staff|attendee):/.test(key)) {
    // Somebody who is not a player. Their conversation keeps the name the coach
    // wrote to them under.
    const { data: prior } = await admin.from('coach_messages')
      .select('recipients').eq('coach_id', parsed.coachId).eq('thread_key', key)
      .order('created_at', { ascending: false }).limit(1)
    conv = (prior?.[0]?.recipients as string | undefined) || fromName
    threadKey = key
  } else if (key) {
    const { data: named } = await admin.from('coach_players')
      .select('id, name').eq('coach_id', parsed.coachId).ilike('name', key.replace(/[\\%_]/g, m => `\\${m}`)).limit(20)
    const hits = (named ?? []).filter(p => String(p.name || '').trim().toLowerCase() === key.trim().toLowerCase())
    conv = key
    if (hits.length === 1) { playerId = hits[0].id as string; threadKey = key }
    // Shared by two players: kept under the name, linked to nobody.
    else if (hits.length > 1) threadKey = key
    // Nobody on the roster has it — a contact. Keyed so that it can never be
    // mistaken for a player who joins later with the same name.
    else threadKey = `contact:${key.trim().toLowerCase()}`
  }

  const { error } = await admin.from('coach_messages').insert({
    coach_id: parsed.coachId, player_id: playerId, direction: 'in', from_name: fromName, recipients: conv, thread_key: threadKey,
    subject, body, channels: 'email', status: 'received', external_id: externalId, read: false, created_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ ok: true, error: error.message })
  return NextResponse.json({ ok: true, added: 1 })
}
