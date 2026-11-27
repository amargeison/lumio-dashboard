// Communications audiences, worked out from the org's own records. Pure: the routes load
// the rows (lib/impact/comms-server.ts) and call these, so the wizard's count, the
// scheduler's send and the tests all use the same rules.
//
// An audience is who the message is FOR. Whether each of them can be REACHED on a
// channel is a second step (reachability), in this order, each family counted once,
// under the first reason that applies:
//   unsubscribed → no consent (consent_data not true) → opted out of the channel →
//   no email / no mobile → email bounced ("needs a new email")
// Unknown is never yes: only consent_data === true and an opt-in === true pass.

import { contactBlock, toE164, type CommsChannel } from './comms-consent'
import { termOf } from './term'

export type AudienceKind =
  | 'all' | 'school' | 'venue' | 'community' | 'school_families'
  | 'new_this_term' | 'lapsed' | 'no_login' | 'opened_last'

export interface Audience { kind: AudienceKind; id?: string | null }

export interface AudienceFamily {
  id: string; guardian_name: string; email: string | null; phone: string | null
  consent_data: boolean | null; opt_in_email: boolean; opt_in_sms: boolean; opt_in_app: boolean
  unsubscribed_at: string | null; email_bounced_at?: string | null
  source?: string | null; community_venue_id?: string | null
  created_at?: string | null; signed_up_at?: string | null; lapsed_at?: string | null; waitlisted_at?: string | null
}

export interface AudienceData {
  families: AudienceFamily[]
  children: { family_id: string | null; school_id: string | null }[]
  /** Families with an accepted, unrevoked parent login. */
  loggedIn: Set<string>
  /** Families who opened the last sent newsletter (empty when none was sent). */
  openedLast: Set<string>
  schools?: { id: string; name: string }[]
  venues?: { id: string; name: string }[]
  /** The org's own term dates (settings.termDates), for "joined this term". */
  termDates?: unknown
}

export const AUDIENCE_LABELS: Record<AudienceKind, string> = {
  all: 'All families',
  school: 'Families at a school',
  venue: 'Families at a venue',
  community: 'Community (weekend) families',
  school_families: 'School families',
  new_this_term: 'New this term',
  lapsed: 'Lapsed',
  no_login: 'No family-app login yet',
  opened_last: 'Opened the last newsletter',
}

export const NEEDS_ID: AudienceKind[] = ['school', 'venue']
/** Not offered while open tracking is off on every sending domain (Resend, 26 Nov 2026): there would never be anyone in it. */
export const HIDDEN_AUDIENCES: AudienceKind[] = ['opened_last']

export function parseAudience(raw: unknown): Audience | null {
  const a = (raw ?? {}) as { kind?: unknown; id?: unknown }
  const kind = String(a.kind ?? '') as AudienceKind
  if (!(kind in AUDIENCE_LABELS)) return null
  const id = typeof a.id === 'string' && /^[0-9a-f-]{36}$/i.test(a.id) ? a.id : null
  if (NEEDS_ID.includes(kind) && !id) return null
  return { kind, id: NEEDS_ID.includes(kind) ? id : null }
}

export function audienceName(a: Audience, data: Pick<AudienceData, 'schools' | 'venues'>): string {
  if (a.kind === 'school') return `Families at ${data.schools?.find(s => s.id === a.id)?.name ?? 'a school'}`
  if (a.kind === 'venue') return `Families at ${data.venues?.find(v => v.id === a.id)?.name ?? 'a venue'}`
  return AUDIENCE_LABELS[a.kind]
}

/** Who the audience is for, before consent: the families, in name order. */
export function audienceMembers(a: Audience, data: AudienceData, today: string): AudienceFamily[] {
  const schoolOf = new Map<string, Set<string>>()
  for (const c of data.children) {
    if (!c.family_id || !c.school_id) continue
    if (!schoolOf.has(c.family_id)) schoolOf.set(c.family_id, new Set())
    schoolOf.get(c.family_id)!.add(c.school_id)
  }
  const term = termOf(today, data.termDates)
  const joined = (f: AudienceFamily) => (f.signed_up_at ?? f.created_at ?? '').slice(0, 10)
  const test: (f: AudienceFamily) => boolean = {
    all: () => true,
    school: (f: AudienceFamily) => !!schoolOf.get(f.id)?.has(a.id ?? ''),
    venue: (f: AudienceFamily) => f.community_venue_id === a.id && !f.waitlisted_at,
    community: (f: AudienceFamily) => (f.source === 'community' || f.source === 'both') && !f.waitlisted_at,
    school_families: (f: AudienceFamily) => (schoolOf.get(f.id)?.size ?? 0) > 0,
    new_this_term: (f: AudienceFamily) => { const d = joined(f); return !!d && d >= term.start && d <= today },
    lapsed: (f: AudienceFamily) => !!f.lapsed_at,
    no_login: (f: AudienceFamily) => !data.loggedIn.has(f.id),
    opened_last: (f: AudienceFamily) => data.openedLast.has(f.id),
  }[a.kind]
  return data.families.filter(test).sort((x, y) => x.guardian_name.localeCompare(y.guardian_name))
}

export type SkipReason = 'unsubscribed' | 'no consent' | 'opted out' | 'no email' | 'no mobile' | 'email bounced'

/** Why this family can't be reached on this channel, or null when it can. */
export function skipReason(f: AudienceFamily, channel: CommsChannel): SkipReason | null {
  const block = contactBlock({ ...f, consent_photo: null }, channel)
  if (block === 'Unsubscribed') return 'unsubscribed'
  if (block === 'No contact consent on record') return 'no consent'
  if (block) return 'opted out'
  if (channel === 'email') {
    if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test((f.email ?? '').trim())) return 'no email'
    if (f.email_bounced_at) return 'email bounced'
  }
  if (channel === 'sms' && !toE164(f.phone ?? '')) return 'no mobile'
  return null
}

export interface Reach {
  total: number; reachable: number
  noConsent: number; unsubscribed: number; optedOut: number; noAddress: number; bounced: number
  reachableIds: string[]
}

export function reachability(families: AudienceFamily[], channel: CommsChannel): Reach {
  const r: Reach = { total: families.length, reachable: 0, noConsent: 0, unsubscribed: 0, optedOut: 0, noAddress: 0, bounced: 0, reachableIds: [] }
  for (const f of families) {
    const why = skipReason(f, channel)
    if (!why) { r.reachable++; r.reachableIds.push(f.id) }
    else if (why === 'unsubscribed') r.unsubscribed++
    else if (why === 'no consent') r.noConsent++
    else if (why === 'opted out') r.optedOut++
    else if (why === 'email bounced') r.bounced++
    else r.noAddress++
  }
  return r
}

/** "18 of 24 reachable — 3 have no consent, 2 unsubscribed, 1 no email" (the parts that are 0 are left out). */
export function reachLine(r: Reach, channel: CommsChannel = 'email'): string {
  const parts = [
    r.noConsent && `${r.noConsent} ${r.noConsent === 1 ? 'has' : 'have'} no consent`,
    r.unsubscribed && `${r.unsubscribed} unsubscribed`,
    r.optedOut && `${r.optedOut} opted out of ${channel === 'sms' ? 'texts' : channel === 'app' ? 'the app' : 'email'}`,
    r.noAddress && `${r.noAddress} no ${channel === 'sms' ? 'mobile' : 'email'}`,
    r.bounced && `${r.bounced} need${r.bounced === 1 ? 's' : ''} a new email`,
  ].filter(Boolean)
  return `${r.reachable} of ${r.total} reachable${parts.length ? ` — ${parts.join(', ')}` : ''}`
}
