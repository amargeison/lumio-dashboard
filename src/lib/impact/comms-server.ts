// Communications, server side: loading an org's audience data and newsletter facts, and
// sending a newsletter. Shared by the HQ routes (/api/impact/comms/*) and the scheduler
// (/api/cron/impact-comms) so a scheduled send is the same as "Send now".
//
// Every query matches hq_id, including those made with the service role.
//
// IMPACT_COMMS_DRY=on (local testing only, never set on the server) sends nothing to
// Resend: each email gets a made-up provider id instead, so statuses and webhooks can
// be tested end to end without mailing anyone.

import type { SupabaseClient } from '@supabase/supabase-js'
import { audienceMembers, parseAudience, type Audience, type AudienceData, type AudienceFamily } from './audiences'
import { planRecipients, runBatches, countStatuses, type OutEmail } from './campaign-send'
import { unsubscribeToken, verifiedSender } from './comms-rules'
import { impactReplyTo } from './inbound'
import { cleanSections, footerAddress, renderNewsletter, type NewsletterDraft } from './newsletter'
import { brandFor, type ImpactOrgSettings } from './org'
import { addDays } from './comms-settings'
import type { NewsletterFacts } from './ai-prompt'

export const SITE = 'https://www.lumiosports.com'
export const commsDry = () => process.env.IMPACT_COMMS_DRY === 'on'

export const FAMILY_COLS = 'id, guardian_name, email, phone, consent_data, opt_in_email, opt_in_sms, opt_in_app, unsubscribed_at, email_bounced_at, source, community_venue_id, created_at, signed_up_at, lapsed_at, waitlisted_at'

async function all<T>(q: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>, label: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q(from, from + 999)
    if (error) throw new Error(`${label}: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < 1000) return out
  }
}

export async function loadAudienceData(db: SupabaseClient, hqId: string): Promise<AudienceData> {
  const [families, children, members, schools, venues, last] = await Promise.all([
    all<AudienceFamily>((a, b) => db.from('tp_families').select(FAMILY_COLS).eq('hq_id', hqId).order('id').range(a, b), 'tp_families'),
    all<{ family_id: string | null; school_id: string | null }>((a, b) => db.from('tp_children').select('family_id, school_id').eq('hq_id', hqId).order('id').range(a, b), 'tp_children'),
    all<{ family_id: string | null }>((a, b) => db.from('impact_members').select('family_id').eq('hq_id', hqId).eq('role', 'parent').not('accepted_at', 'is', null).is('revoked_at', null).order('id').range(a, b), 'impact_members'),
    db.from('tp_schools').select('id, name').eq('hq_id', hqId).order('name'),
    db.from('tp_venues').select('id, name').eq('hq_id', hqId).order('name'),
    db.from('impact_campaigns').select('id').eq('hq_id', hqId).eq('kind', 'newsletter').eq('status', 'sent').order('sent_at', { ascending: false }).limit(1),
  ])
  let openedLast = new Set<string>()
  const lastId = last.data?.[0]?.id as string | undefined
  if (lastId) {
    const opened = await all<{ family_id: string | null }>((a, b) => db.from('impact_campaign_recipients').select('family_id').eq('hq_id', hqId).eq('campaign_id', lastId).in('status', ['opened', 'unsubscribed']).order('id').range(a, b), 'impact_campaign_recipients')
    openedLast = new Set(opened.map(r => r.family_id).filter((x): x is string => !!x))
  }
  return {
    families, children,
    loggedIn: new Set(members.map(m => m.family_id).filter((x): x is string => !!x)),
    openedLast,
    schools: (schools.data ?? []) as { id: string; name: string }[],
    venues: (venues.data ?? []) as { id: string; name: string }[],
  }
}

export const ukToday = (at = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(at)

/** The facts the newsletter AI may use: real sessions, venues, booklet week, pack, key dates. No people. */
export async function newsletterFacts(db: SupabaseClient, hqId: string, org: string, today = ukToday()): Promise<NewsletterFacts> {
  const [sessions, venues, schools, programmes, booklet, items, network] = await Promise.all([
    db.from('tp_sessions').select('session_date, kind, venue_id, programme_id').eq('hq_id', hqId).gte('session_date', addDays(today, -14)).lte('session_date', addDays(today, 21)).order('session_date').limit(200),
    db.from('tp_venues').select('id, name, address, postcode, session_day, session_time').eq('hq_id', hqId).order('name'),
    db.from('tp_schools').select('id, name').eq('hq_id', hqId),
    db.from('tp_programmes').select('id, school_id, venue_id, current_week, status').eq('hq_id', hqId),
    db.from('tp_booklet').select('weeks').eq('hq_id', hqId).maybeSingle(),
    db.from('tp_pack_items').select('name').eq('hq_id', hqId).eq('active', true).order('sort'),
    db.from('impact_reference_content').select('content').eq('key', 'sport_network').maybeSingle(),
  ])
  const vName = new Map((venues.data ?? []).map(v => [v.id as string, v.name as string]))
  const sName = new Map((schools.data ?? []).map(s => [s.id as string, s.name as string]))
  const progs = (programmes.data ?? []) as { id: string; school_id: string | null; venue_id: string | null; current_week: number | null; status: string | null }[]
  const line = (s: { session_date: string; kind: string; venue_id: string | null; programme_id: string | null }) => {
    const p = progs.find(x => x.id === s.programme_id)
    return { date: s.session_date, kind: (s.kind === 'weekend' ? 'weekend' : 'school') as 'school' | 'weekend', venue: vName.get(s.venue_id ?? p?.venue_id ?? '') ?? null, school: p?.school_id ? sName.get(p.school_id) ?? null : null }
  }
  const rows = (sessions.data ?? []) as { session_date: string; kind: string; venue_id: string | null; programme_id: string | null }[]
  const week = Math.max(0, ...progs.filter(p => p.status !== 'complete').map(p => p.current_week ?? 0))
  const weeks = ((booklet.data?.weeks ?? []) as { week?: number; title?: string; focus?: string; home_task?: string }[])
  const b = week ? weeks.find(w => w.week === week) : undefined
  const timeline = ((network.data?.content as { timeline?: { when?: unknown; label?: unknown }[] } | null)?.timeline ?? [])
  return {
    org, today,
    ran: rows.filter(s => s.session_date < today).map(line).slice(-12),
    coming: rows.filter(s => s.session_date >= today).map(line).slice(0, 12),
    venues: (venues.data ?? []).map(v => ({ name: v.name as string, when: [v.session_day, v.session_time].filter(Boolean).join(' ') || null, where: [v.address, v.postcode].filter(Boolean).join(', ') || null })),
    booklet: b ? { week, title: String(b.title ?? '').slice(0, 120), focus: String(b.focus ?? '').slice(0, 200), homeTask: String(b.home_task ?? '').slice(0, 300) } : null,
    pack: (items.data ?? []).map(i => String(i.name)).slice(0, 12),
    keyDates: timeline.filter(t => typeof t.when === 'string' && typeof t.label === 'string').map(t => ({ when: String(t.when).slice(0, 40), label: String(t.label).slice(0, 160) })).slice(0, 8),
  }
}

export interface OrgRow { hq_id: string; slug: string; settings: ImpactOrgSettings | null }

export interface Mailer {
  from: string
  replyTo: string | null
  /** One email per family: its own unsubscribe link. */
  build: (f: AudienceFamily, d: NewsletterDraft) => OutEmail
  send: (batch: OutEmail[]) => Promise<{ ids: (string | null)[] } | { error: string }>
}

/** How this org sends email from this server, or why it can't. */
export async function mailerFor(org: OrgRow): Promise<Mailer | { error: string }> {
  const brand = brandFor(org.slug, org.settings)
  const dry = commsDry()
  const address = verifiedSender(org.slug, process.env.IMPACT_EMAIL_SENDERS) ?? (dry ? 'dry-run@example.invalid' : null)
  if (!address) return { error: 'No verified sending address for this organisation yet.' }
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) return { error: 'Unsubscribe links aren’t set up on this server.' }
  const key = process.env.RESEND_API_KEY
  if (!key && !dry) return { error: 'Email is not set up on this server.' }
  const from = `${brand.org.replace(/["<>\\]/g, '')} <${address}>`
  const replyTo = impactReplyTo(org.slug)
  const footer = { org: brand.org, address: footerAddress(org.settings ?? {}), sender: address }
  const build = (f: AudienceFamily, d: NewsletterDraft): OutEmail => {
    const unsubscribe = `${SITE}/api/impact/unsubscribe?t=${encodeURIComponent(unsubscribeToken(f.id, secret))}`
    const { html, text } = renderNewsletter(d, footer, unsubscribe)
    return { to: (f.email ?? '').trim(), subject: d.subject, html, text, headers: { 'List-Unsubscribe': `<${unsubscribe}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } }
  }
  const resend = key && !dry ? new (await import('resend')).Resend(key) : null
  const send: Mailer['send'] = async batch => {
    if (!resend) return { ids: batch.map(() => `dry_${crypto.randomUUID()}`) }
    const { data, error } = await resend.batch.send(batch.map(m => ({ from, to: m.to, subject: m.subject, html: m.html, text: m.text, headers: m.headers, ...(replyTo ? { replyTo } : {}) })))
    if (error) return { error: error.message }
    const ids = ((data as { data?: { id?: string }[] } | null)?.data ?? []).map(x => x?.id ?? null)
    return { ids: batch.map((_, i) => ids[i] ?? null) }
  }
  return { from, replyTo, build, send }
}

export interface CampaignRow { id: string; hq_id: string; status: string; subject: string | null; preheader: string | null; sections: unknown; audience: unknown; scheduled_at: string | null }

/**
 * Sends (or carries on sending) one newsletter with the service role. The campaign must
 * already be 'sending' — the caller claimed it. First call: works out the audience and
 * writes the recipient rows. Every call: sends up to `max` of the queued rows. When none
 * are left: 'sent', with counts. Returns what it did.
 */
export async function continueSend(service: SupabaseClient, org: OrgRow, c: CampaignRow, max = 1000): Promise<{ sent: number; failed: number; skipped: number; left: number; done: boolean; error?: string }> {
  const fail = async (error: string) => {
    await service.from('impact_campaigns').update({ status: 'failed', error: error.slice(0, 500), updated_at: new Date().toISOString() }).eq('id', c.id).eq('hq_id', org.hq_id)
    return { sent: 0, failed: 0, skipped: 0, left: 0, done: true, error }
  }
  const audience = parseAudience(c.audience) as Audience | null
  if (!audience) return fail('The audience for this newsletter isn’t valid.')
  const mailer = await mailerFor(org)
  if ('error' in mailer) return fail(mailer.error)
  const draft: NewsletterDraft = { subject: (c.subject ?? '').trim(), preheader: (c.preheader ?? '').trim(), sections: cleanSections(c.sections) }
  if (!draft.subject || !draft.sections.length) return fail('This newsletter has no subject or no sections.')

  const data = await loadAudienceData(service, org.hq_id)
  const { count: existing } = await service.from('impact_campaign_recipients').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id).eq('hq_id', org.hq_id)
  if (!existing) {
    const plan = planRecipients(audienceMembers(audience, data, ukToday()))
    if (!plan.length) return fail('Nobody is in this audience.')
    for (let i = 0; i < plan.length; i += 500) {
      const { error } = await service.from('impact_campaign_recipients').upsert(plan.slice(i, i + 500).map(p => ({ ...p, hq_id: org.hq_id, campaign_id: c.id })), { onConflict: 'campaign_id,family_id,channel', ignoreDuplicates: true })
      if (error) return fail(`Recipients couldn’t be saved: ${error.message}`)
    }
  }
  const { data: queued, error: qErr } = await service.from('impact_campaign_recipients').select('id, family_id').eq('campaign_id', c.id).eq('hq_id', org.hq_id).eq('status', 'queued').order('id').limit(max + 1)
  if (qErr) return fail(qErr.message)
  const families = new Map(data.families.map(f => [f.id, f]))
  const run = await runBatches({ queued: (queued ?? []) as { id: string; family_id: string | null }[], families, render: f => mailer.build(f, draft), send: mailer.send, max })
  const now = new Date().toISOString()
  for (const u of run.updates) {
    await service.from('impact_campaign_recipients').update({ status: u.status, provider_id: u.provider_id ?? null, error: u.error ?? null, skip_reason: u.skip_reason ?? null, sent_at: u.sent_at ?? null, updated_at: now }).eq('id', u.id).eq('hq_id', org.hq_id)
  }
  const left = run.left
  if (!left) {
    const { data: rows } = await service.from('impact_campaign_recipients').select('status').eq('campaign_id', c.id).eq('hq_id', org.hq_id).limit(20000)
    const counts = countStatuses((rows ?? []) as { status: string }[])
    const status = counts.sent === 0 && counts.failed > 0 ? 'failed' : 'sent'
    await service.from('impact_campaigns').update({ status, sent_at: now, counts, error: status === 'failed' ? 'No emails could be sent.' : null, updated_at: now }).eq('id', c.id).eq('hq_id', org.hq_id)
  }
  const n = (s: string) => run.updates.filter(u => u.status === s).length
  return { sent: n('sent'), failed: n('failed'), skipped: n('skipped'), left, done: !left }
}

/** Claims a draft or scheduled newsletter for sending: one update, so only one caller wins. */
export async function claimCampaign(service: SupabaseClient, hqId: string, id: string, from: ('draft' | 'scheduled')[]): Promise<CampaignRow | null> {
  const { data } = await service.from('impact_campaigns').update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', id).eq('hq_id', hqId).in('status', from).select('id, hq_id, status, subject, preheader, sections, audience, scheduled_at').maybeSingle()
  return (data as CampaignRow | null) ?? null
}
