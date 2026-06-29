import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { inboundReplyTo } from '@/lib/coach/inbound'

// Sends a coach message over the chosen channels and logs it to coach_messages.
//   • Email  → live now, via Resend (RESEND_API_KEY).
//   • Text   → live once Twilio platform creds are set
//              (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER);
//              otherwise reported as 'not_configured' (never silently faked).
//   • WhatsApp → not handled here yet (UI marks it coming soon).
//
// Auth is the coach's own Supabase session cookie.

type Recipient = { name?: string; email?: string; phone?: string }
type Result = { name: string; channel: string; ok: boolean; detail: string }

const EMAIL_FROM = 'Lumio Sports <hello@lumiocms.com>'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { recipients = [], channels = [], subject = '', body = '', ccCoach = true } =
    (await req.json().catch(() => ({}))) as { recipients: Recipient[]; channels: string[]; subject?: string; body?: string; ccCoach?: boolean }
  // BCC the coach's own inbox on outbound email when enabled (Settings toggle) —
  // a silent copy that doesn't expose their address or invite reply-all.
  const bccAddress = ccCoach !== false && user.email ? user.email : undefined

  if (!body.trim()) return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
  if (!recipients.length) return NextResponse.json({ error: 'Add at least one recipient' }, { status: 400 })
  if (!channels.length) return NextResponse.json({ error: 'Choose at least one channel' }, { status: 400 })

  const results: Result[] = []
  // Replies route to the Lumio inbound address (carrying a coach+conversation
  // token) so they thread back into the in-app inbox.
  const replyToFor = (name?: string) => inboundReplyTo(user.id, name || '')

  // ── In-app (Lumio message) ───────────────────────────────────────────────
  // Always available — recorded to the message log; no external send.
  if (channels.includes('inapp')) {
    recipients.forEach(r => results.push({ name: r.name || r.email || r.phone || '—', channel: 'inapp', ok: true, detail: 'Sent in-app' }))
  }

  // ── Email ──────────────────────────────────────────────────────────────────
  // Send as the coach's own address via their connected Gmail/Outlook mailbox when
  // available; otherwise fall back to Resend (Lumio's transactional sender).
  if (channels.includes('email')) {
    const { sendAsCoach, hasConnectedMailbox } = await import('@/lib/coach/mail')
    const subj = subject.trim() || 'A message from your coach'
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;white-space:pre-wrap;">${escapeHtml(body)}</div>`
    const mailboxConnected = await hasConnectedMailbox(user.id)
    const resend = process.env.RESEND_API_KEY ? new (await import('resend')).Resend(process.env.RESEND_API_KEY) : null

    if (!mailboxConnected && !resend) {
      recipients.forEach(r => results.push({ name: r.name || r.email || '—', channel: 'email', ok: false, detail: 'Email not configured' }))
    } else {
      for (const r of recipients) {
        if (!r.email) { results.push({ name: r.name || '—', channel: 'email', ok: false, detail: 'No email on file' }); continue }
        // 1) Connected mailbox (send-as the coach)
        if (mailboxConnected) {
          try {
            const sent = await sendAsCoach(user.id, { to: r.email, subject: subj, html, replyTo: replyToFor(r.name), bcc: bccAddress })
            if (sent.ok) { results.push({ name: r.name || r.email, channel: 'email', ok: true, detail: `Sent from ${sent.from || sent.provider}` }); continue }
          } catch { /* fall through to Resend */ }
        }
        // 2) Resend fallback
        if (resend) {
          try {
            const { error } = await resend.emails.send({ from: EMAIL_FROM, to: r.email, subject: subj, html, replyTo: replyToFor(r.name), bcc: bccAddress })
            results.push({ name: r.name || r.email, channel: 'email', ok: !error, detail: error ? error.message : 'Sent' })
          } catch (e) {
            results.push({ name: r.name || r.email, channel: 'email', ok: false, detail: e instanceof Error ? e.message : 'Send failed' })
          }
        } else {
          results.push({ name: r.name || r.email, channel: 'email', ok: false, detail: 'Mailbox send failed and no fallback configured' })
        }
      }
    }
  }

  // ── Text / SMS (Twilio REST) ───────────────────────────────────────────────
  if (channels.includes('sms')) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER
    if (!sid || !token || !from) {
      recipients.forEach(r => results.push({ name: r.name || r.phone || '—', channel: 'sms', ok: false, detail: 'Text not configured (add Twilio credentials)' }))
    } else {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64')
      for (const r of recipients) {
        if (!r.phone) { results.push({ name: r.name || '—', channel: 'sms', ok: false, detail: 'No phone on file' }); continue }
        try {
          const form = new URLSearchParams({ To: r.phone, From: from, Body: body })
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: 'POST',
            headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
          })
          if (res.ok) results.push({ name: r.name || r.phone, channel: 'sms', ok: true, detail: 'Sent' })
          else { const t = await res.json().catch(() => ({})); results.push({ name: r.name || r.phone, channel: 'sms', ok: false, detail: t?.message || `Twilio error ${res.status}` }) }
        } catch (e) {
          results.push({ name: r.name || r.phone, channel: 'sms', ok: false, detail: e instanceof Error ? e.message : 'Send failed' })
        }
      }
    }
  }

  const okCount = results.filter(r => r.ok).length
  const status = okCount === 0 ? 'failed' : okCount === results.length ? 'sent' : 'partial'

  // Log to coach_messages (service client; coach_id from the verified session).
  try {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    await admin.from('coach_messages').insert({
      coach_id: user.id,
      recipients: recipients.map(r => r.name || r.email || r.phone).filter(Boolean).join(', '),
      channels: channels.join(', '),
      subject: subject || null,
      body,
      status,
      results,
    })
  } catch (e) { console.error('[coach/message/send] log failed', e) }

  return NextResponse.json({ status, results })
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
