import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { impactHq } from '@/lib/impact/import-auth'
import { appFiledDetail, contactBlock, familyAppLive, namedWithoutConsent, photoGreen, toE164, unsubscribeToken, verifiedSender, type CommsChannel, type ConsentChild, type ConsentFamily } from '@/lib/impact/comms-rules'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Sends an Impact message and logs every attempt to impact_messages. The same
// three rules as /api/coach/message/send:
//
//   WHO IT IS FROM: the HQ's own Supabase session. Reads and writes run as that
//   user, not the service role, so the tp_* RLS applies on top of the filters.
//
//   WHO IT GOES TO: family ids, looked up here in this HQ's own tp_families. An
//   address in the request is never read, so this cannot be an open mail relay.
//
//   WHOSE IT IS: every row is filed under hq_id = the signed-in HQ.
//
// Channels:
//   • email → Resend, only from the org's address in IMPACT_EMAIL_SENDERS. Every
//             email carries that family's unsubscribe link, or it is not sent.
//   • app   → the impact_messages row itself. Only a family with an accepted parent
//             login can read it, and only once FAMILY_APP_LIVE=on, so anyone else's
//             result says "saved", never "delivered".
//   • sms   → Twilio, only when IMPACT_SMS_LIVE=on; otherwise reported per family.

const CHANNELS: readonly CommsChannel[] = ['email', 'app', 'sms']
const MAX_RECIPIENTS = 300
const MAX_BODY = 10_000
// The www address: a browser treats the bare domain as a different site.
const SITE = 'https://www.lumiosports.com'

const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
const looksLikeEmail = (s: string) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s)
const oneLine = (s: unknown, max: number) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max)
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

type Family = ConsentFamily & { guardian_name: string; email: string | null; phone: string | null }
type Target = { i: number; label: string; family: Family | null; child: ConsentChild | null; refused?: string; note?: string }
type Outcome = 'sent' | 'filed' | 'failed' | 'refused'
type Result = { i: number; name: string; channel: CommsChannel; ok: boolean; outcome: Outcome; detail: string; providerId?: string; inviteFamilyId?: string }

const FAMILY_COLS = 'id, guardian_name, email, phone, consent_data, consent_photo, opt_in_email, opt_in_sms, opt_in_app, unsubscribed_at'

// Both reads throw rather than come back short: a consent check run against
// half the records would pass messages it should stop.
async function familiesByIds(db: SupabaseClient, hqId: string, ids: string[]): Promise<Family[]> {
  const out: Family[] = []
  for (let n = 0; n < ids.length; n += 100) {
    const { data, error } = await db.from('tp_families').select(FAMILY_COLS).eq('hq_id', hqId).in('id', ids.slice(n, n + 100))
    if (error) throw new Error(`tp_families: ${error.message}`)
    out.push(...((data ?? []) as unknown as Family[]))
  }
  return out
}

async function allFamilyConsents(db: SupabaseClient, hqId: string): Promise<Map<string, ConsentFamily>> {
  const out = new Map<string, ConsentFamily>()
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('tp_families').select(FAMILY_COLS).eq('hq_id', hqId).order('id').range(from, from + 999)
    if (error) throw new Error(`tp_families: ${error.message}`)
    const rows = (data ?? []) as unknown as Family[]
    rows.forEach(f => out.set(f.id, f))
    if (rows.length < 1000) return out
  }
}

async function allChildren(db: SupabaseClient, hqId: string): Promise<ConsentChild[]> {
  const out: ConsentChild[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('tp_children').select('id, family_id, name, photo_consent').eq('hq_id', hqId).order('id').range(from, from + 999)
    if (error) throw new Error(`tp_children: ${error.message}`)
    const rows = (data ?? []) as ConsentChild[]
    out.push(...rows)
    if (rows.length < 1000) return out
  }
}

export async function POST(req: NextRequest) {
  const auth = await impactHq('send messages')
  if (auth instanceof NextResponse) return auth
  const { user, db } = auth
  const hqId = user.id

  const { data: org } = await db.from('impact_orgs').select('slug, settings').eq('hq_id', hqId).maybeSingle()
  if (!org) return NextResponse.json({ error: 'This login isn’t linked to an organisation yet.' }, { status: 403 })
  const settings = (org.settings ?? {}) as { org?: string; email?: string }
  const orgName = oneLine(settings.org, 80) || 'Lumio Impact'

  const raw = (await req.json().catch(() => ({}))) as { recipients?: unknown; channels?: unknown; body?: unknown }
  const recipients = (Array.isArray(raw.recipients) ? raw.recipients : []).filter(r => r && typeof r === 'object') as { familyId?: unknown; childId?: unknown }[]
  const channels = CHANNELS.filter(c => Array.isArray(raw.channels) && (raw.channels as unknown[]).includes(c))
  const body = typeof raw.body === 'string' ? raw.body : ''

  if (!body.trim()) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 })
  if (body.length > MAX_BODY) return NextResponse.json({ error: `That message is too long to send (${MAX_BODY.toLocaleString('en-GB')} characters at most).` }, { status: 400 })
  if (!recipients.length) return NextResponse.json({ error: 'Choose who this is for first.' }, { status: 400 })
  if (recipients.length > MAX_RECIPIENTS) return NextResponse.json({ error: `One message can go to ${MAX_RECIPIENTS} families at most. Send it to smaller groups.` }, { status: 400 })
  if (!channels.length) return NextResponse.json({ error: 'Choose how to send it first.' }, { status: 400 })

  // Counted per org, so signing in twice does not double it.
  const gate = rateLimit(`impact-message-send:${hqId}`, 30, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'That is a lot of messages in a few minutes. Wait a few minutes, then send again.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  // Nothing goes out unless it can be logged, and consent is only as good as
  // the records it was checked against, so either failure stops the whole send.
  const logReady = await db.from('impact_messages').select('id').limit(1)
  if (logReady.error) {
    console.error('[impact/message/send] log table unavailable', logReady.error.message)
    return NextResponse.json({ error: 'Messaging isn’t switched on for this portal yet. Nothing was sent.' }, { status: 503 })
  }
  let requested: Family[]
  let consents: Map<string, ConsentFamily>
  let children: ConsentChild[]
  try {
    const ids = Array.from(new Set(recipients.map(r => r.familyId).filter(isUuid)))
    ;[requested, consents, children] = await Promise.all([familiesByIds(db, hqId, ids), allFamilyConsents(db, hqId), allChildren(db, hqId)])
  } catch (e) {
    console.error('[impact/message/send] consent lookup failed', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Couldn’t check your family records, so nothing was sent. Please try again.' }, { status: 503 })
  }

  // ── Who, checked against this HQ's own records ─────────────────────────────
  const seen = new Set<string>()
  const targets: Target[] = []
  recipients.forEach((r, i) => {
    const family = requested.find(f => f.id === r.familyId) ?? null
    if (!family) { targets.push({ i, label: 'Unknown', family: null, child: null, refused: 'Not one of your families' }); return }
    if (seen.has(family.id)) return     // one message per family; the first mention is kept
    seen.add(family.id)
    const label = oneLine(family.guardian_name, 80) || 'Family'
    if (r.childId === undefined || r.childId === null) { targets.push({ i, label, family, child: null }); return }
    const child = children.find(c => c.id === r.childId && c.family_id === family.id) ?? null
    if (!child) { targets.push({ i, label, family, child: null, refused: 'That child isn’t in this family' }); return }
    // Without green consent it goes out with no child attached.
    if (photoGreen(family, child)) targets.push({ i, label, family, child })
    else targets.push({ i, label, family, child: null, note: 'child’s name left out: photo consent isn’t green' })
  })

  const subject = `Message from ${orgName}`
  const results: Result[] = []
  const push = (t: Target, channel: CommsChannel, outcome: Outcome, detail: string, providerId?: string) =>
    results.push({ i: t.i, name: t.label, channel, ok: outcome === 'sent' || outcome === 'filed', outcome, detail: t.note && (outcome === 'sent' || outcome === 'filed') ? `${detail} (${t.note})` : detail, providerId })

  // ── Consent, per family and per channel ────────────────────────────────────
  const open: { t: Target; f: Family; channels: CommsChannel[] }[] = []
  for (const t of targets) {
    if (t.refused || !t.family) { channels.forEach(c => push(t, c, 'refused', t.refused ?? 'Not one of your families')); continue }
    const f = t.family
    const named = namedWithoutConsent(body, f, consents, children)
    if (named) { channels.forEach(c => push(t, c, 'refused', `The message names ${named}, who doesn’t have green photo consent`)); continue }
    const allowed: CommsChannel[] = []
    for (const c of channels) {
      const block = contactBlock(f, c)
      if (block) push(t, c, 'refused', block)
      else allowed.push(c)
    }
    if (allowed.length) open.push({ t, f, channels: allowed })
  }
  const on = (c: CommsChannel) => open.filter(o => o.channels.includes(c))

  // ── App ────────────────────────────────────────────────────────────────────
  // A failed read leaves the set empty: the result then says "saved", which is the safe side.
  const appFamilies = on('app').map(o => o.f.id)
  const { data: logins } = appFamilies.length
    ? await db.from('impact_members').select('family_id').eq('hq_id', hqId).eq('role', 'parent').in('family_id', appFamilies).not('accepted_at', 'is', null).is('revoked_at', null)
    : { data: [] }
  const withLogin = new Set((logins ?? []).map(l => l.family_id as string))
  for (const { t, f } of on('app')) {
    const hasLogin = withLogin.has(f.id)
    push(t, 'app', 'filed', appFiledDetail(hasLogin))
    if (familyAppLive() && !hasLogin) results[results.length - 1].inviteFamilyId = f.id
  }

  // ── Email ──────────────────────────────────────────────────────────────────
  if (on('email').length) {
    const address = verifiedSender(org.slug as string, process.env.IMPACT_EMAIL_SENDERS)
    const resend = process.env.RESEND_API_KEY ? new (await import('resend')).Resend(process.env.RESEND_API_KEY) : null
    const unsubscribeSecret = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!address) {
      on('email').forEach(({ t }) => push(t, 'email', 'failed', 'No verified sending address for this organisation yet'))
    } else if (!unsubscribeSecret) {
      on('email').forEach(({ t }) => push(t, 'email', 'failed', 'Unsubscribe links aren’t set up on this server, so no email was sent'))
    } else if (!resend) {
      on('email').forEach(({ t }) => push(t, 'email', 'failed', 'Email is not set up on this server'))
    } else {
      const from = `${orgName.replace(/["<>\\]/g, '')} <${address}>`
      // Impact has no inbound route yet, so replies go to a person. The org's
      // public address when it has one, otherwise the HQ login's.
      const orgEmail = oneLine(settings.email, 200)
      const replyTo = looksLikeEmail(orgEmail) ? orgEmail : (user.email ?? undefined)
      for (const { t, f } of on('email')) {
        const to = (f.email ?? '').trim()
        if (!to) { push(t, 'email', 'failed', 'No email address on file'); continue }
        if (!looksLikeEmail(to)) { push(t, 'email', 'failed', 'The address on file is not an email address'); continue }
        // Counted per email: one message to every family is hundreds of emails.
        if (!rateLimit(`impact-message-email:${hqId}`, 600, 60 * 60_000).ok) { push(t, 'email', 'failed', 'Hourly email limit reached, send this one again later'); continue }
        const unsubscribe = `${SITE}/api/impact/unsubscribe?t=${encodeURIComponent(unsubscribeToken(f.id, unsubscribeSecret))}`
        const html =
          `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111;white-space:pre-wrap;">${escapeHtml(body)}</div>`
          + `<div style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;margin-top:18px;padding-top:10px;border-top:1px solid #e5e7eb;">`
          + `Sent by ${escapeHtml(orgName)}.${t.child ? ` This message is about ${escapeHtml(t.child.name.trim())}.` : ''} <a href="${unsubscribe}" style="color:#6b7280;">Unsubscribe</a></div>`
        try {
          const { data, error } = await resend.emails.send({
            from, to, subject, html, replyTo,
            headers: { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
          })
          if (error) push(t, 'email', 'failed', error.message)
          else push(t, 'email', 'sent', 'Sent', data?.id)
        } catch (e) {
          push(t, 'email', 'failed', e instanceof Error ? e.message : 'Send failed')
        }
      }
    }
  }

  // ── SMS (Twilio REST) ──────────────────────────────────────────────────────
  if (on('sms').length) {
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER
    if (process.env.IMPACT_SMS_LIVE !== 'on') {
      on('sms').forEach(({ t }) => push(t, 'sms', 'failed', 'Texting isn’t switched on, so no text was sent'))
    } else if (!sid || !token || !from) {
      on('sms').forEach(({ t }) => push(t, 'sms', 'failed', 'Text is not configured on this server'))
    } else {
      const basic = Buffer.from(`${sid}:${token}`).toString('base64')
      for (const { t, f } of on('sms')) {
        if (!(f.phone ?? '').trim()) { push(t, 'sms', 'failed', 'No phone number on file'); continue }
        const to = toE164(f.phone ?? '')
        if (!to) { push(t, 'sms', 'failed', 'The number on file isn’t a mobile number that can take a text'); continue }
        // Texts cost money per message, so this allowance is much smaller.
        if (!rateLimit(`impact-message-sms:${hqId}`, 200, 60 * 60_000).ok) { push(t, 'sms', 'failed', 'Hourly text limit reached, send this one again later'); continue }
        try {
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: 'POST',
            headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ To: to, From: from, Body: body }),
          })
          const j = (await res.json().catch(() => ({}))) as { sid?: string; message?: string }
          if (res.ok) push(t, 'sms', 'sent', 'Sent', j.sid)
          else push(t, 'sms', 'failed', j.message || `Twilio error ${res.status}`)
        } catch (e) {
          push(t, 'sms', 'failed', e instanceof Error ? e.message : 'Send failed')
        }
      }
    }
  }

  // ── Log: one row per family per channel ────────────────────────────────────
  // An unknown id has no family to file under, so it appears only in the
  // response and the count below. A refused row keeps no body, because the body
  // may be the very thing that named a child.
  const rows = results.flatMap(r => {
    const t = targets.find(x => x.i === r.i)
    if (!t?.family) return []
    return [{
      hq_id: hqId,
      thread_key: `family:${t.family.id}`,
      family_id: t.family.id,
      child_id: t.child?.id ?? null,
      channel: r.channel,
      direction: 'out',
      subject,
      body: r.outcome === 'refused' ? '' : body,
      status: r.outcome,
      detail: r.detail.slice(0, 500),
      provider_id: r.providerId ?? null,
    }]
  })
  let logged = true
  if (rows.length) {
    const { error } = await db.from('impact_messages').insert(rows)
    if (error) {
      logged = false
      console.error('[impact/message/send] log failed', error.message)
      // The row IS the app message, so without it nothing was saved.
      for (const r of results) if (r.outcome === 'filed') Object.assign(r, { ok: false, outcome: 'failed', detail: 'Couldn’t be saved, please try again' })
    }
  }

  const count = (o: Outcome) => results.filter(r => r.outcome === o).length
  const okCount = results.filter(r => r.ok).length
  const status = okCount === 0 ? 'failed' : okCount === results.length ? 'sent' : 'partial'
  // Counts and ids only: no addresses, names or message text in the server log.
  console.log('[impact/message/send]', JSON.stringify({ hq: hqId, org: org.slug, status, channels, families: targets.length, sent: count('sent'), filed: count('filed'), refused: count('refused'), failed: count('failed'), logged }))

  return NextResponse.json({ status, logged, results: results.map(({ providerId: _providerId, ...r }) => r) })
}
