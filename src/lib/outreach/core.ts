// Server-only core of admin Outreach: who may be emailed, what the email looks
// like, and the one function that actually sends.
//
// Everything that decides "is it all right to email this address" lives here,
// so the admin page, the cron runner and the manual "send now" button cannot
// disagree about it. See supabase/migrations/189_outreach.sql for the rules.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { sendMailSmtp } from '@/lib/coach/smtp'
import { publicSiteOrigin } from '@/lib/public-origin'
import { readInbox, type InboxMessage } from '@/lib/outreach/imap'

export const SEGMENTS = ['academy', 'venue', 'coach'] as const
export type Segment = typeof SEGMENTS[number]

export type Contact = {
  id: string; email: string; org_name: string | null; contact_name: string | null; role: string | null
  segment: Segment; legal_form: string | null; corporate_ok: boolean; basis: 'b2b' | 'opt_in'
  website: string | null; source: string | null; notes: string | null
  status: 'active' | 'replied' | 'unsubscribed' | 'bounced'; unsub_token: string; created_at: string
}
export type Campaign = {
  id: string; name: string; segment: Segment; subject: string; body: string; status: 'draft' | 'active' | 'paused'; created_at: string
  style: 'plain' | 'designed'; headline: string | null; image_url: string | null; button_text: string | null; button_url: string | null
}
export type EmailContent = Pick<Campaign, 'subject' | 'body'> & Partial<Pick<Campaign, 'style' | 'headline' | 'image_url' | 'button_text' | 'button_url'>>
export type Settings = { company_line: string; daily_limit: number; paused: boolean; warmup: boolean }
export const MAX_DAILY = 500

export function db(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

/** The signed-in Lumio admin (a real, expiring session — not a shared token), or null. */
export async function adminFor(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const token = req.headers.get('x-admin-token')
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return null
  const { data } = await db().from('admin_sessions').select('admin_id, email')
    .eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  return data ? { id: data.admin_id as string, email: data.email as string } : null
}

// ── The mailbox ──────────────────────────────────────────────────────────────
// Outreach goes out through an ordinary mailbox of ours over SMTP, never through
// the app's transactional mail service (which forbids it, and which sign-in
// codes and booking confirmations depend on). The password is an environment
// variable on the server and is never sent to the browser.
export function mailbox() {
  const host = process.env.OUTREACH_SMTP_HOST || ''
  const user = process.env.OUTREACH_SMTP_USER || ''
  const pass = process.env.OUTREACH_SMTP_PASS || ''
  const from = process.env.OUTREACH_FROM_EMAIL || user
  return {
    ready: !!(host && user && pass && from),
    host, user, pass, from,
    port: Number(process.env.OUTREACH_SMTP_PORT) || 587,
    // Reading the answers uses the same mailbox and the same app password;
    // smtp.gmail.com → imap.gmail.com unless the server says otherwise.
    imapHost: process.env.OUTREACH_IMAP_HOST || host.replace(/^smtp\./i, 'imap.'),
    fromName: process.env.OUTREACH_FROM_NAME || 'Lumio',
  }
}

export function linkBase(reqOrigin: string) {
  return (process.env.OUTREACH_LINK_BASE || '').trim().replace(/\/+$/, '') || publicSiteOrigin(reqOrigin)
}

export async function getSettings(): Promise<Settings> {
  const { data } = await db().from('outreach_settings').select('company_line, daily_limit, paused, warmup').eq('id', 1).maybeSingle()
  return {
    company_line: data?.company_line || '', paused: !!data?.paused, warmup: data?.warmup !== false,
    daily_limit: Math.max(0, Math.min(MAX_DAILY, data?.daily_limit ?? 250)),
  }
}

/**
 * How many may go out today.
 *
 * With warm-up on, a new mailbox starts at 30 a day and adds 15 for each day
 * since its first send, until it reaches the limit set in Settings (250 takes
 * about three weeks). A mailbox that has never sent anything and suddenly sends
 * hundreds of near-identical emails is exactly what spam filters and mailbox
 * providers look for; one that has been busy for a fortnight is not.
 */
export async function todaysLimit(settings: Settings): Promise<number> {
  if (!settings.warmup) return settings.daily_limit
  const { data } = await db().from('outreach_sends').select('sent_at').eq('status', 'sent').order('sent_at').limit(1).maybeSingle()
  const days = data?.sent_at ? Math.floor((Date.now() - new Date(data.sent_at as string).getTime()) / 86_400_000) : 0
  return Math.min(settings.daily_limit, 30 + 15 * Math.max(0, days))
}

// ── Who may be emailed ───────────────────────────────────────────────────────
/** Legal forms that are corporate bodies. Anything else waits for a person to confirm it. */
export function looksCorporate(legalForm: string | null | undefined): boolean {
  return /\b(ltd|limited|llp|plc|cic|c\.i\.c|cio|charit|trust|council|company|community interest)\b/i.test(String(legalForm || ''))
}
export function eligible(c: Pick<Contact, 'status' | 'corporate_ok' | 'basis' | 'email'>): boolean {
  return c.status === 'active' && (c.corporate_ok || c.basis === 'opt_in') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)
}
export function whyHeld(c: Pick<Contact, 'status' | 'corporate_ok' | 'basis'>): string {
  if (c.status !== 'active') return c.status
  if (!c.corporate_ok && c.basis !== 'opt_in') return 'not confirmed as a company or organisation'
  return ''
}

// ── The email ────────────────────────────────────────────────────────────────
const esc = (s: string) => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string))

/**
 * A first name we are confident enough to open an email with — otherwise empty,
 * so the template's fallback ("Hi there") is used. Contact cells are research
 * notes, not clean data: "Josh Whiteman; Liam Kelleher", "'Metro' Mustafa",
 * "Unknown", "Head coach". "Hi Unknown," is worse than "Hi there,".
 */
export function firstName(contact: string): string {
  const one = contact.split(/[;,&/(–—|]| - | and /i)[0].trim()
  if (!one || /['"‘’“”]/.test(one)) return ''
  const word = one.split(/\s+/)[0]
  if (!/^\p{Lu}[\p{L}-]+$/u.test(word)) return ''
  if (/^(unknown|tbc|tba|none|team|head|coach|coaches|admin|info|office|club|the|mr|mrs|ms|miss|dr)$/i.test(word)) return ''
  return word
}

/** {{org}}, {{name}}, {{first_name}} — and {{first_name|there}} for when we do not know it. */
export function fill(template: string, c: Pick<Contact, 'org_name' | 'contact_name'>): string {
  const name = (c.contact_name || '').trim()
  const values: Record<string, string> = { org: (c.org_name || '').trim(), name, first_name: firstName(name) }
  return template.replace(/\{\{\s*(\w+)\s*(?:\|([^}]*))?\}\}/g, (_, key: string, fallback?: string) => values[key.toLowerCase()] || (fallback ?? '').trim())
}

const SEGMENT_WORD: Record<Segment, string> = { academy: 'tennis academy', venue: 'tennis venue', coach: 'tennis coach' }

/**
 * Who the email is from, for the footer. Optional sender details from Settings
 * if there are any (a registered name and address, once there is a company);
 * otherwise the sender's own name and reply address. Never blank: an email that
 * does not say who sent it is not allowed, registered company or not.
 */
export function senderLine(settings: Settings): string {
  const set = settings.company_line.trim()
  if (set) return set
  const box = mailbox()
  return [box.fromName && box.fromName !== 'Lumio' ? box.fromName : '', 'Lumio Tennis Coach', box.from].filter(Boolean).join(' · ')
}

export function render(c: Contact, camp: EmailContent, settings: Settings, base: string) {
  const sender = senderLine(settings)
  const unsub = `${base}/api/outreach/unsubscribe?t=${c.unsub_token}`
  const subject = fill(camp.subject, c).replace(/\s+/g, ' ').trim()
  const body = fill(camp.body, c).replace(/\r\n/g, '\n').trim()
  const why = c.basis === 'opt_in'
    ? 'You are receiving this because you asked to hear from Lumio.'
    : `I am writing to ${c.org_name ? esc(c.org_name) : 'you'} at this address because it is published as the business contact for a ${SEGMENT_WORD[c.segment] || 'tennis organisation'}.`
  const whyText = why.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')

  const designed = camp.style === 'designed'
  const headline = designed ? fill(camp.headline || '', c).replace(/\s+/g, ' ').trim() : ''
  const abs = (u: string | null | undefined) => { const v = (u || '').trim(); return !v ? '' : /^https?:\/\//i.test(v) ? v : v.startsWith('/') ? `${base}${v}` : '' }
  const image = designed ? abs(camp.image_url) : ''
  // The button's link to our own site carries a plain source tag, so admin
  // Analytics can tell "came from an outreach email" from "typed the address".
  // It names the channel, never the person: no id, no per-contact token.
  const tagged = (u: string) => {
    try {
      const x = new URL(u)
      if (!/(^|\.)lumiosports\.com$/i.test(x.hostname) || x.pathname.startsWith('/api/') || x.searchParams.has('utm_source')) return u
      x.searchParams.set('utm_source', 'email'); x.searchParams.set('utm_medium', 'outreach'); x.searchParams.set('utm_campaign', c.segment)
      return x.toString()
    } catch { return u }
  }
  const buttonUrl = designed ? tagged(abs(camp.button_url)) : ''
  const buttonText = (camp.button_text || '').replace(/\s+/g, ' ').trim()

  const text = `${headline ? `${headline}\n\n` : ''}${body}${buttonUrl ? `\n\n${buttonText || 'Find out more'}: ${buttonUrl}` : ''}\n\n--\n${sender}\n${whyText}\nIf you would rather not hear from me again: ${unsub}\n`
  const paras = body.split(/\n{2,}/).map(p =>
    `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" style="color:#1d4ed8">$1</a>')}</p>`).join('\n')
  // Deliberately plain: an ordinary person-to-person email, no images, no
  // tracking pixel, no click-tracking redirects.
  // Line breaks between the pieces matter: mail servers reject or re-wrap any
  // line longer than 998 characters.
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111827">\n${paras}\n` +
    `<p style="margin:26px 0 0;padding-top:12px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:#6b7280">\n` +
    `${esc(sender)}<br>\n${why}<br>\n` +
    `<a href="${unsub}" style="color:#6b7280">Unsubscribe</a> — one click, and I will not email again.</p></div>`
  if (!designed) return { subject, text, html, unsub }

  // The designed layout. Tables and inline styles throughout, a fixed 600px
  // column, PNG/JPG pictures by absolute URL and a "bulletproof" button — the
  // only things that survive Outlook, Gmail and Apple Mail alike. No web fonts,
  // no background images, no tracking pixel.
  const dParas = body.split(/\n{2,}/).map(p =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151">${esc(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" style="color:#2563EB">$1</a>')}</p>`).join('\n')
  const rich = [
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>`,
    `<body style="margin:0;padding:0;background:#EEF1F6">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF1F6"><tr><td align="center" style="padding:24px 12px">`,
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">`,
    `<tr><td align="left" style="background:#0B0F1A;padding:18px 28px">`,
    `<img src="${base}/opt/email-logo-tennis-coach.png" width="166" height="72" alt="Lumio Tennis Coach" style="display:block;border:0;outline:none;height:72px;width:166px">`,
    `</td></tr>`,
    image ? `<tr><td style="padding:0"><img src="${esc(image)}" width="600" alt="" style="display:block;border:0;outline:none;width:100%;max-width:600px;height:auto"></td></tr>` : '',
    `<tr><td style="padding:30px 28px 8px">`,
    headline ? `<h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;font-weight:700;color:#0B0F1A">${esc(headline)}</h1>` : '',
    dParas,
    buttonUrl ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 18px"><tr><td align="center" bgcolor="#3A8EE0" style="border-radius:10px">` +
      `\n<a href="${esc(buttonUrl)}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">${esc(buttonText || 'Find out more')}</a>\n</td></tr></table>` : '',
    `</td></tr>`,
    `<tr><td style="padding:18px 28px 26px;border-top:1px solid #E5E7EB;font-size:12px;line-height:1.55;color:#6B7280">`,
    `${esc(sender)}<br>`,
    `${why}<br>`,
    `<a href="${unsub}" style="color:#6B7280">Unsubscribe</a> — one click, and I will not email again.`,
    `</td></tr></table>`,
    `</td></tr></table></body></html>`,
  ].filter(Boolean).join('\n')
  return { subject, text, html: rich, unsub }
}

export async function deliver(to: string, m: { subject: string; text: string; html: string; unsub?: string }) {
  const box = mailbox()
  if (!box.ready) return { ok: false, error: 'The outreach mailbox is not set up on the server.' }
  const domain = box.from.split('@')[1] || 'lumiosports.com'
  const headers: Record<string, string> = { 'Message-ID': `<${crypto.randomUUID()}@${domain}>` }
  if (m.unsub) {
    headers['List-Unsubscribe'] = `<${m.unsub}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }
  return sendMailSmtp({
    host: box.host, port: box.port, user: box.user, pass: box.pass,
    from: box.from, fromName: box.fromName, to, subject: m.subject, html: m.html, text: m.text, headers,
  })
}

// ── Sending ──────────────────────────────────────────────────────────────────
/** Monday–Friday, 09:00–16:59 UK time. Nobody's club secretary wants this at 11pm. */
export function inSendingHours(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(now)
  const day = parts.find(p => p.type === 'weekday')?.value || ''
  const hour = Number(parts.find(p => p.type === 'hour')?.value)
  return !['Sat', 'Sun'].includes(day) && hour >= 9 && hour < 17
}

/** Midnight today in UK time, as an ISO instant. */
function ukDayStart(now = new Date()): string {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(now)
  const n = (t: string) => Number(f.find(p => p.type === t)?.value) || 0
  return new Date(now.getTime() - ((n('hour') % 24) * 3600 + n('minute') * 60 + n('second')) * 1000 - now.getMilliseconds()).toISOString()
}

export async function sentToday(): Promise<number> {
  const { count } = await db().from('outreach_sends').select('id', { count: 'exact', head: true })
    .eq('status', 'sent').gte('sent_at', ukDayStart())
  return count ?? 0
}

/** Contacts a campaign could still be sent to. */
export async function pending(camp: Pick<Campaign, 'id' | 'segment'>): Promise<Contact[]> {
  const sb = db()
  const [{ data: contacts }, { data: sends }] = await Promise.all([
    sb.from('outreach_contacts').select('*').eq('segment', camp.segment).eq('status', 'active').order('created_at').limit(5000),
    sb.from('outreach_sends').select('contact_id').eq('campaign_id', camp.id).limit(20000),
  ])
  const done = new Set((sends || []).map(s => s.contact_id as string))
  return ((contacts || []) as Contact[]).filter(c => eligible(c) && !done.has(c.id))
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Send the next few emails across the active campaigns.
 * `max` is a ceiling for this run; the daily limit and the pause switch always apply.
 */
export async function runBatch(o: { max: number; reqOrigin: string; respectHours: boolean }) {
  const sb = db()
  const settings = await getSettings()
  if (settings.paused) return { sent: 0, failed: 0, note: 'Outreach is paused.' }
  if (!mailbox().ready) return { sent: 0, failed: 0, note: 'The outreach mailbox is not set up on the server.' }
  if (o.respectHours && !inSendingHours()) return { sent: 0, failed: 0, note: 'Outside sending hours (Mon–Fri, 9am–5pm UK).' }

  const limit = await todaysLimit(settings)
  const room = limit - await sentToday()
  if (room <= 0) return { sent: 0, failed: 0, note: `Today's limit of ${limit} has been reached${limit < settings.daily_limit ? ' (warming up towards ' + settings.daily_limit + ')' : ''}.` }
  let budget = Math.min(room, o.max)

  const { data: camps } = await sb.from('outreach_campaigns').select('*').eq('status', 'active').order('created_at')
  const base = linkBase(o.reqOrigin)
  let sent = 0, failed = 0, streak = 0
  for (const camp of (camps || []) as Campaign[]) {
    if (budget <= 0) break
    if (!camp.subject.trim() || !camp.body.trim()) continue
    for (const c of await pending(camp)) {
      if (budget <= 0) break
      const email = c.email.trim().toLowerCase()
      const { data: blocked } = await sb.from('outreach_suppressions').select('email').eq('email', email).maybeSingle()
      if (blocked) { await sb.from('outreach_contacts').update({ status: 'unsubscribed' }).eq('id', c.id); continue }
      // Claim it first. The unique index makes this the one place a second,
      // overlapping run finds out the contact is already being handled.
      const { data: claim, error: claimErr } = await sb.from('outreach_sends')
        .insert({ campaign_id: camp.id, contact_id: c.id, email, status: 'sending' }).select('id').maybeSingle()
      if (claimErr || !claim) continue
      if (sent + failed > 0) await sleep(4000 + Math.random() * 5000)
      // Counted again at the last moment: the ten-minute run and a press of
      // "Send now" can overlap, and each had room when it started.
      if (await sentToday() >= limit) { await sb.from('outreach_sends').delete().eq('id', claim.id); budget = 0; break }
      const res = await deliver(email, render(c, camp, settings, base))
      budget--
      if (res.ok) {
        sent++; streak = 0
        await sb.from('outreach_sends').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', claim.id)
      } else {
        failed++; streak++
        await sb.from('outreach_sends').update({ status: 'failed', error: String(res.error || 'send failed').slice(0, 300) }).eq('id', claim.id)
        // Three in a row is the mailbox refusing us, not three bad addresses.
        // Stop and say so rather than burn through the list.
        if (streak >= 3) {
          await sb.from('outreach_settings').update({ paused: true, updated_at: new Date().toISOString() }).eq('id', 1)
          return { sent, failed, note: 'Three sends failed in a row, so outreach has been paused. Check the mailbox settings.' }
        }
      }
    }
  }
  return { sent, failed, note: sent + failed === 0 ? 'Nothing waiting to be sent.' : '' }
}

/** Unsubscribe by token. Permanent, and survives the contact being deleted. */
export async function unsubscribe(token: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false
  const sb = db()
  const { data: c } = await sb.from('outreach_contacts').select('id, email').eq('unsub_token', token).maybeSingle()
  if (!c) return false
  const email = String(c.email).trim().toLowerCase()
  await sb.from('outreach_suppressions').upsert({ email, reason: 'unsubscribed' }, { onConflict: 'email' })
  await sb.from('outreach_contacts').update({ status: 'unsubscribed', updated_at: new Date().toISOString() }).eq('id', c.id)
  return true
}

// ── Reading the answers ──────────────────────────────────────────────────────
// Replies, out-of-office notes and bounces all land in the outreach mailbox.
// This reads the last fortnight of the inbox (read-only — nothing is marked as
// read) and files each one against the contact it is about:
//
//   bounce         "address not found" from the mail system → contact bounced,
//                  and the address is suppressed so it is never tried again
//   reply          a person wrote back → contact replied (no further campaigns)
//   asks to stop   a reply saying "unsubscribe" / "remove me" → unsubscribed,
//                  permanently, exactly as if they had pressed the link
//   auto-reply     out of office, "thanks, we'll be in touch" → counted and
//                  otherwise ignored: nobody has actually answered yet
//
// A contact is only ever moved off "active", and only by a message newer than
// the last time the contact was changed — so putting someone back to active by
// hand sticks, and running this twice changes nothing the second time.
const FREEMAIL = /^(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|mac|aol|btinternet|btopenworld|sky|talktalk|virginmedia|ntlworld|blueyonder|protonmail|proton|gmx|mail|zoho)\./i
const STOP_WORDS = /\b(unsubscribe|remove (me|us)\b|take (me|us) off|stop (emailing|e-mailing|contacting|sending|mailing)|do not (email|e-mail|contact|send)|don'?t (email|e-mail|contact) (me|us)|no (more|further) (emails?|e-mails?|contact|messages))/i

export function isBounce(m: Pick<InboxMessage, 'from' | 'subject'>): boolean {
  return /mailer-daemon|postmaster@/i.test(m.from)
    || /^(delivery status notification|undeliver|mail delivery (failed|failure|subsystem)|returned mail|failure notice|delivery (has )?failed|message not delivered|address not found)/i.test(m.subject.trim())
}
/** "Still trying" notices are not failures. */
export function isSoftBounce(m: Pick<InboxMessage, 'subject' | 'text'>): boolean {
  return /\((delay|warning)\)|delayed|delivery incomplete|still (trying|being retried)/i.test(m.subject) && !/fail/i.test(m.subject)
}
export function bouncedAddresses(m: Pick<InboxMessage, 'headers' | 'text'>): string[] {
  const out = new Set<string>()
  for (const a of (m.headers['x-failed-recipients'] || '').split(/[,;\s]+/)) if (/@/.test(a)) out.add(a.trim().toLowerCase())
  for (const x of m.text.matchAll(/(?:Final|Original)-Recipient:\s*rfc822;\s*<?([^\s<>;]+@[^\s<>;]+)>?/gi)) out.add(x[1].toLowerCase())
  if (!out.size) for (const x of m.text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) out.add(x[0].toLowerCase().replace(/\.$/, ''))
  return [...out]
}
export function isAutoReply(m: Pick<InboxMessage, 'headers' | 'subject'>): boolean {
  const h = m.headers
  if (h['auto-submitted'] && !/^no\b/i.test(h['auto-submitted'])) return true
  if (h['x-autoreply'] || h['x-autorespond']) return true
  if (/auto[_-]?reply|bulk|junk/i.test(h.precedence || '')) return true
  return /^\s*(auto(matic)?[ -]?(reply|response)|autoreply|out of (the )?office|ooo\b|away from|on (annual )?leave|thank(s| you) for (your )?(e-?mail|message|enquiry|inquiry|contacting|getting in touch)|we('ve| have) received your)/i.test(m.subject)
}
/** What the person themselves wrote: everything above the quoted original. */
export function ownWords(text: string): string {
  const cut = text.search(/\n\s*>|\nOn [^\n]{0,200}wrote:|\n-{2,} ?(Original|Forwarded) Message|\nFrom: [^\n]*\n(Sent|Date): |\n_{10,}/i)
  return (cut >= 0 ? text.slice(0, cut) : text).slice(0, 1500)
}

export type InboxSync = { ok: boolean; error?: string; checked: number; replies: string[]; stops: string[]; bounces: string[]; auto: number }

export async function syncInbox(): Promise<InboxSync> {
  const empty: InboxSync = { ok: false, checked: 0, replies: [], stops: [], bounces: [], auto: 0 }
  const box = mailbox()
  if (!box.ready || !box.imapHost) return { ...empty, error: 'The outreach mailbox is not set up on the server.' }
  const read = await readInbox({ host: box.imapHost, port: Number(process.env.OUTREACH_IMAP_PORT) || 993, user: box.user, pass: box.pass, sinceDays: 14, max: 300 })
  if (!read.ok) return { ...empty, error: read.error }

  const sb = db()
  const [{ data: cs }, { data: ss }] = await Promise.all([
    sb.from('outreach_contacts').select('id, email, org_name, status, updated_at').limit(20000),
    sb.from('outreach_sends').select('contact_id, sent_at').eq('status', 'sent').order('sent_at', { ascending: false }).limit(20000),
  ])
  type Row = { id: string; email: string; org_name: string | null; status: string; updated_at: string }
  const contacts = (cs || []) as Row[]
  const byEmail = new Map(contacts.map(c => [c.email.trim().toLowerCase(), c]))
  const sentAt = new Map<string, number[]>()
  for (const s of (ss || []) as { contact_id: string; sent_at: string | null }[]) {
    if (s.sent_at) sentAt.set(s.contact_id, [...(sentAt.get(s.contact_id) || []), new Date(s.sent_at).getTime()])
  }
  // Someone answering from a colleague's address: same organisation domain,
  // as long as it is the organisation's own domain and not gmail.com.
  const byDomain = new Map<string, Row[]>()
  for (const c of contacts) {
    const d = c.email.split('@')[1]?.toLowerCase()
    if (d && !FREEMAIL.test(d) && sentAt.has(c.id)) byDomain.set(d, [...(byDomain.get(d) || []), c])
  }

  const out: InboxSync = { ok: true, checked: read.messages.length, replies: [], stops: [], bounces: [], auto: 0 }
  const us = new Set([box.user.toLowerCase(), box.from.toLowerCase()])
  const label = (c: Row) => c.org_name || c.email
  const move = async (c: Row, status: 'replied' | 'unsubscribed' | 'bounced', when: Date | null): Promise<boolean> => {
    if (c.status !== 'active') return false
    if (when && new Date(c.updated_at).getTime() > when.getTime() + 60_000) return false     // changed by hand since
    const { error } = await sb.from('outreach_contacts').update({ status, updated_at: new Date().toISOString() }).eq('id', c.id).eq('status', 'active')
    if (error) return false
    c.status = status
    if (status !== 'replied') {
      await sb.from('outreach_suppressions').upsert({ email: c.email.trim().toLowerCase(), reason: status === 'bounced' ? 'bounced' : 'unsubscribed' }, { onConflict: 'email' })
    }
    return true
  }

  for (const m of read.messages) {
    if (isBounce(m)) {
      if (isSoftBounce(m)) continue
      for (const a of bouncedAddresses(m)) {
        const c = byEmail.get(a)
        if (c && sentAt.has(c.id) && await move(c, 'bounced', m.date)) out.bounces.push(label(c))
      }
      continue
    }
    if (!m.from || us.has(m.from)) continue
    const dom = m.from.split('@')[1] || ''
    const c = byEmail.get(m.from) || ((byDomain.get(dom) || []).length === 1 ? byDomain.get(dom)![0] : undefined)
    if (!c) continue
    const sends = sentAt.get(c.id) || []
    const at = m.date ? m.date.getTime() : Date.now()
    if (!sends.some(t => t <= at + 60_000)) continue                 // nothing of ours for this to be an answer to
    // An answer inside two minutes of our email is a machine, whatever its headers say.
    const instant = sends.some(t => at - t >= -60_000 && at - t < 120_000)
    if (isAutoReply(m) || instant) { if (c.status === 'active') out.auto++; continue }
    if (STOP_WORDS.test(ownWords(m.text))) { if (await move(c, 'unsubscribed', m.date)) out.stops.push(label(c)) }
    else if (await move(c, 'replied', m.date)) out.replies.push(label(c))
  }
  return out
}
