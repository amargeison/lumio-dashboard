import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SIG_HEADERS, verifyInbound } from '@/lib/inbound/signature'
import { parseMime } from '@/lib/inbound/parse'
import { inboundKind } from '@/lib/inbound/message'
import { INBOUND_DOMAIN } from '@/lib/impact/inbound'
import { fileImpactReply } from '@/lib/impact/inbound-file'
import { fileCoachReply } from '@/lib/coach/inbound-file'

export const runtime = 'nodejs'

// Inbound email for inbound.lumiosports.com. Cloudflare Email Routing hands every message
// for that subdomain to the Email Worker (workers/inbound-email), which posts the raw MIME
// here, signed (lib/inbound/signature.ts, INBOUND_EMAIL_SECRET), with the envelope
// recipient and sender and the Authentication-Results header.
//
// Dispatch by the envelope recipient:
//   reply+<org slug>@…          → Lumio Impact (the org's Inbox)
//   reply+<token>.<signature>@… → Lumio Coach (the token must verify)
//   anything else               → 200, dropped, one log line
// Anything but a 2xx makes the Worker forward the message to the fallback mailbox, so a
// message is never lost: a handler failure answers 500 on purpose.

const MAX_BYTES = 10 * 1024 * 1024
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES) return NextResponse.json({ error: 'Too large' }, { status: 413 })
  const raw = new Uint8Array(await req.arrayBuffer())
  if (raw.byteLength > MAX_BYTES) return NextResponse.json({ error: 'Too large' }, { status: 413 })
  if (!verifyInbound(process.env.INBOUND_EMAIL_SECRET, req.headers, raw)) return NextResponse.json({ error: 'Bad signature' }, { status: 401 })

  // Case kept: Coach's tokens are case-sensitive. inboundKind compares in lower case.
  const to = (req.headers.get(SIG_HEADERS.to) ?? '').trim()
  const kind = inboundKind(to, INBOUND_DOMAIN)
  if (!kind) {
    console.log('[inbound/email] dropped: not a reply address', JSON.stringify({ domain: to.split('@')[1]?.toLowerCase() ?? null }))
    return NextResponse.json({ ok: true, dropped: true })
  }
  let message
  try {
    message = await parseMime(raw, { to, from: req.headers.get(SIG_HEADERS.from) ?? '', authResults: req.headers.get(SIG_HEADERS.auth) ?? '' })
  } catch (e) {
    console.error('[inbound/email] unreadable message', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Unreadable message' }, { status: 422 })
  }
  // Only the envelope recipient decides who gets it; header To/Cc can be anything.
  message.recipients = [to]
  const r = kind === 'impact' ? await fileImpactReply(db(), message) : await fileCoachReply(db(), message)
  console.log('[inbound/email]', JSON.stringify({ kind, status: r.status, verified: message.verified }))
  if (r.status === 'error') return NextResponse.json({ error: 'Not filed' }, { status: 500 })
  return NextResponse.json({ ok: true, kind, ...r })
}
