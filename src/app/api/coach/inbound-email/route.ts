import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySvix } from '@/lib/svix-verify'
import { SIG_HEADERS } from '@/lib/inbound/signature'
import { fileCoachReply } from '@/lib/coach/inbound-file'
import { htmlToText } from '@/lib/impact/inbound'
import { extractAddress, lowerAddress, type InboundMessage } from '@/lib/inbound/message'
import { POST as dispatch } from '@/app/api/inbound/email/route'

export const runtime = 'nodejs'

// Coach's inbound-email endpoint. Inbound mail now arrives through Cloudflare Email
// Routing → the Email Worker → /api/inbound/email, which dispatches Coach replies to
// fileCoachReply (lib/coach/inbound-file.ts). This route stays for two callers:
//   • a request signed by the Worker (x-lumio-signature) → handed to that dispatcher;
//   • Resend inbound (event `email.received`, Svix-signed with RESEND_WEBHOOK_SECRET),
//     kept so we can switch back to Resend; or a provider posting full email JSON with
//     ?token=<RESEND_INBOUND_SECRET>. The body is read from the payload, or fetched from
//     Resend's Received Emails API.
// Anything else is refused (401). It no longer answers 503 when Resend isn't set up.

const toList = (v: unknown): unknown[] => Array.isArray(v) ? v : (v ? [v] : [])
const nameOf = (v: unknown): string => {
  if (typeof v === 'string') { const m = v.match(/^\s*"?([^"<]*?)"?\s*<[^>]+>/); return (m?.[1] || v.split('@')[0]).trim() }
  const o = (v ?? {}) as { name?: string }
  return (o.name || lowerAddress(v).split('@')[0] || '').trim()
}

export async function POST(req: NextRequest) {
  if (req.headers.get(SIG_HEADERS.sig)) return dispatch(req)

  const raw = await req.text()
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  const legacy = process.env.RESEND_INBOUND_SECRET
  const okResend = !!webhookSecret && verifySvix(raw, req.headers, webhookSecret)
  const okLegacy = !webhookSecret && !!legacy && new URL(req.url).searchParams.get('token') === legacy
  if (!okResend && !okLegacy) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let payload: Record<string, unknown>
  try { payload = JSON.parse(raw) } catch { return NextResponse.json({ ok: true }) }
  if (payload?.type && payload.type !== 'email.received') return NextResponse.json({ ok: true, ignored: 'type' })
  const d = ((payload?.data ?? payload) ?? {}) as Record<string, unknown>

  let text = String(d.text || d.body || '') || (d.html ? htmlToText(String(d.html)) : '')
  let subject = (d.subject as string | undefined) ?? null
  let fromRaw: unknown = d.from
  const emailId = (d.email_id || d.id || d.messageId || null) as string | null
  const apiKey = process.env.RESEND_API_KEY
  if (!text && emailId && apiKey) {
    try {
      const r = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, { headers: { Authorization: `Bearer ${apiKey}` } })
      if (r.ok) {
        const full = await r.json() as { text?: string; html?: string; subject?: string; from?: unknown; headers?: { from?: unknown } }
        text = full.text || (full.html ? htmlToText(full.html) : '')
        subject = subject ?? full.subject ?? null
        fromRaw = full.headers?.from || full.from || fromRaw
      }
    } catch { /* leave the body empty → ignored */ }
  }
  const message: InboundMessage = {
    recipients: [...toList(d.to), ...toList(d.received_for), ...toList(d.cc)].map(extractAddress).filter(Boolean),
    from: lowerAddress(fromRaw) || null,
    fromName: nameOf(fromRaw),
    subject,
    text,
    attachments: [],
    messageId: ((d.message_id || emailId || null) as string | null),
    verified: null,
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const r = await fileCoachReply(admin, message)
  if (r.status === 'error') return NextResponse.json({ ok: true, error: r.error })
  return NextResponse.json({ ok: true, ...(r.status === 'filed' ? { added: 1 } : r.status === 'dedup' ? { dedup: true } : { ignored: r.why }) })
}
