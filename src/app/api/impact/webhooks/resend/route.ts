import { NextRequest, NextResponse } from 'next/server'
import { verifySvix } from '@/lib/svix-verify'
import { serviceDb } from '@/lib/impact/invite-send'
import { advances } from '@/lib/impact/campaign-send'
import { familyForSender, htmlToText, replyText, senderAddress, slugFromRecipients, threadKeyFor } from '@/lib/impact/inbound'

export const runtime = 'nodejs'

// Resend → Lumio Impact. One endpoint, one signing secret (RESEND_IMPACT_WEBHOOK_SECRET),
// verified with Svix before anything is read; each event is handled once
// (impact_provider_events keyed on the svix-id).
//
//   email.delivered / email.opened   move the newsletter recipient forward (never back)
//   email.bounced                    recipient → bounced; the family's email is marked bad
//                                    ("needs a new email" in Families) until it is changed
//   email.complained                 recipient → complained; the family is unsubscribed
//   email.received                   a reply to reply+<org>@inbound.lumiosports.com: filed
//                                    in that family's thread (found by the sender's email
//                                    only), or as an unknown sender
//
// Resend sends every event on the account here, Coach's and other products' included.
// Anything that isn't an Impact email or an Impact reply address is ignored.

const ok = (extra: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...extra })

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const secret = process.env.RESEND_IMPACT_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  if (!verifySvix(raw, req.headers, secret)) return NextResponse.json({ error: 'Bad signature' }, { status: 401 })

  let payload: { type?: string; created_at?: string; data?: Record<string, unknown> }
  try { payload = JSON.parse(raw) } catch { return ok({ ignored: 'not json' }) }
  const type = String(payload.type ?? '')
  const d = (payload.data ?? {}) as Record<string, unknown>
  const db = serviceDb()

  const eventId = `resend:${req.headers.get('svix-id')}`
  const { error: dupe } = await db.from('impact_provider_events').insert({ id: eventId.slice(0, 200) })
  if (dupe) return ok({ dedup: true })

  if (type === 'email.received') {
    const res = await inbound(db, d)
    // Not filed: forget the event, so Resend's retry is handled rather than dropped as a repeat.
    if (res.status >= 500) await db.from('impact_provider_events').delete().eq('id', eventId.slice(0, 200))
    return res
  }

  const map: Record<string, string> = { 'email.delivered': 'delivered', 'email.opened': 'opened', 'email.bounced': 'bounced', 'email.complained': 'complained' }
  const status = map[type]
  const emailId = typeof d.email_id === 'string' ? d.email_id : null
  if (!status || !emailId) return ok({ ignored: type || 'type' })
  const at = typeof payload.created_at === 'string' ? payload.created_at : new Date().toISOString()

  // A newsletter recipient, or a single message (a reply, an automation).
  const { data: r } = await db.from('impact_campaign_recipients').select('id, hq_id, family_id, status').eq('provider_id', emailId).maybeSingle()
  let hqId = r?.hq_id as string | undefined, familyId = r?.family_id as string | null | undefined
  if (r && advances(r.status as string, status)) {
    const stamp = status === 'delivered' ? { delivered_at: at } : status === 'opened' ? { opened_at: at } : status === 'bounced' ? { bounced_at: at } : {}
    await db.from('impact_campaign_recipients').update({ status, ...stamp, updated_at: new Date().toISOString() }).eq('id', r.id).eq('hq_id', r.hq_id)
  }
  if (!r) {
    const { data: m } = await db.from('impact_messages').select('hq_id, family_id').eq('provider_id', emailId).eq('channel', 'email').limit(1)
    if (!m?.[0]) return ok({ ignored: 'not an Impact email' })
    hqId = m[0].hq_id as string; familyId = m[0].family_id as string | null
  }
  if (!hqId || !familyId) return ok({ handled: status })

  if (status === 'bounced') {
    // Only the address that bounced: if the family's email has changed since, it stays good.
    const to = (Array.isArray(d.to) ? d.to : [d.to]).map(x => String(x ?? '').trim().toLowerCase())
    const bounce = (d.bounce ?? {}) as { message?: string; type?: string; subType?: string }
    const reason = [bounce.type, bounce.subType, bounce.message].filter(Boolean).join(' — ').slice(0, 300) || 'The email bounced'
    const { data: f } = await db.from('tp_families').select('email').eq('id', familyId).eq('hq_id', hqId).maybeSingle()
    if (f && to.includes(String(f.email ?? '').trim().toLowerCase())) {
      await db.from('tp_families').update({ email_bounced_at: at, email_bounce_reason: reason }).eq('id', familyId).eq('hq_id', hqId)
    }
  }
  if (status === 'complained') {
    await db.from('tp_families').update({ unsubscribed_at: at }).eq('id', familyId).eq('hq_id', hqId).is('unsubscribed_at', null)
  }
  console.log('[impact/webhooks/resend]', JSON.stringify({ type, hq: hqId, newsletter: !!r }))
  return ok({ handled: status })
}

async function inbound(db: ReturnType<typeof serviceDb>, d: Record<string, unknown>) {
  const slug = slugFromRecipients(d.to, d.received_for, d.cc)
  if (!slug) return ok({ ignored: 'not an Impact reply address' })
  const { data: org } = await db.from('impact_orgs').select('hq_id').eq('slug', slug).maybeSingle()
  if (!org) return ok({ ignored: 'no such org' })
  const hqId = org.hq_id as string

  let text = String(d.text ?? '') || (d.html ? htmlToText(String(d.html)) : '')
  let subject = typeof d.subject === 'string' ? d.subject : null
  let from: unknown = d.from
  const emailId = typeof d.email_id === 'string' ? d.email_id : typeof d.id === 'string' ? d.id : null
  // Resend's webhook carries no body: fetch it from the Received Emails API.
  if (!text && emailId && process.env.RESEND_API_KEY) {
    try {
      const r = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } })
      if (r.ok) {
        const full = await r.json() as { text?: string; html?: string; subject?: string; from?: unknown }
        text = full.text || (full.html ? htmlToText(full.html) : '')
        subject = subject ?? full.subject ?? null
        from = from ?? full.from
      }
    } catch { /* an empty body is filed as such below */ }
  }
  const body = replyText(text) || '(no text — the reply may have been a picture or an attachment)'
  const sender = senderAddress(from)
  const externalId = String(d.message_id ?? emailId ?? '').slice(0, 300) || null

  const { data: families } = sender
    ? await db.from('tp_families').select('id, email').eq('hq_id', hqId).ilike('email', sender.replace(/[%_\\]/g, c => `\\${c}`)).limit(5)
    : { data: [] }
  const family = familyForSender(sender, (families ?? []) as { id: string; email: string | null }[])
  const threadKey = threadKeyFor(family?.id ?? null, sender)
  const { error } = await db.from('impact_messages').insert({
    hq_id: hqId, thread_key: threadKey, family_id: family?.id ?? null, channel: 'email', direction: 'in',
    subject: subject?.slice(0, 300) ?? null, body, status: 'received', external_id: externalId, from_address: sender,
  })
  if (error) {
    if (error.code === '23505') return ok({ dedup: true })
    console.error('[impact/webhooks/resend] inbound not filed', error.message)
    return NextResponse.json({ error: 'not filed' }, { status: 500 })
  }
  if (family) {
    await db.from('impact_threads').upsert({ hq_id: hqId, thread_key: threadKey, family_id: family.id, closed_at: null, updated_at: new Date().toISOString() }, { onConflict: 'hq_id,thread_key' })
  }
  console.log('[impact/webhooks/resend] reply filed', JSON.stringify({ hq: hqId, known: !!family }))
  return ok({ filed: true, known: !!family })
}
