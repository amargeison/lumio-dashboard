// ─── LUMIO IMPACT — COMMUNITY ────────────────────────────────────────────────
// Families at the weekend community sessions, whether they came from a school or
// signed up directly (migration 237). Pure: the /join form's checks, each family's
// status, the Community tiles and the lapse preview. Used by the join route, the
// Community tab and the tests.
//
// Status, for a family in Community:
//   lapsed  marked lapsed by HQ, or at least one visit and none in the last 6 weeks
//   active  a visit in the last 6 weeks
//   new     no visit yet, or signed up within the last 30 days
// A "visit" is a weekend session where at least one of the family's children was
// present.

import { readEmail, readPhone } from './import-schema'

export const LAPSE_DAYS = 42
export const NEW_DAYS = 30
export const MAX_CHILDREN = 6

/** Shown on /join and stored with each sign-up (tp_community_signups.consent_text_version). */
export const JOIN_CONSENT_VERSION = 'join-2026-11'
export const joinConsentText = (org: string) =>
  `I agree to ${org} keeping my family’s details (names, contact details and children’s dates of birth) to run the weekend sessions, ` +
  `keep a register and contact me about them. I can ask for them to be deleted at any time.`

export type CommunitySource = 'school' | 'community' | 'both'
export type CommunityStatus = 'new' | 'active' | 'lapsed'

// ── The /join form ──────────────────────────────────────────────────────────
export interface JoinInput {
  guardian: string; email: string; phone: string | null
  children: { name: string; dob: string }[]
  venueId: string; consentData: true; consentPhoto: boolean; optInEmail: boolean; optInSms: boolean
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const isName = (s: string) => s.length >= 2 && /\p{L}/u.test(s) && !/[<>@\d]/.test(s)

/** A child's age in whole years on a date. */
export function ageOn(dob: string, today: string): number {
  const [y, m, d] = dob.split('-').map(Number), [ty, tm, td] = today.split('-').map(Number)
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0)
}

/** The form's fields → a sign-up, or the first thing to fix, in words a parent understands. */
export function parseJoin(body: Record<string, unknown>, venueIds: string[], today: string): { ok: true; value: JoinInput } | { ok: false; error: string; field?: string } {
  const guardian = clean(body.guardian, 120)
  if (!isName(guardian)) return { ok: false, field: 'guardian', error: 'Please give your full name.' }
  const email = readEmail(body.email)
  if (!email) return { ok: false, field: 'email', error: 'Please check your email address.' }
  const rawPhone = clean(body.phone, 40)
  const phone = rawPhone ? readPhone(rawPhone) : null
  if (rawPhone && !phone) return { ok: false, field: 'phone', error: 'Please check your phone number, or leave it blank.' }
  const list = Array.isArray(body.children) ? body.children as Record<string, unknown>[] : []
  const children = list.map(c => ({ name: clean(c?.name, 120), dob: clean(c?.dob, 10) })).filter(c => c.name || c.dob)
  if (!children.length) return { ok: false, field: 'children', error: 'Please add at least one child.' }
  if (children.length > MAX_CHILDREN) return { ok: false, field: 'children', error: `Please add up to ${MAX_CHILDREN} children — get in touch for more.` }
  for (const c of children) {
    if (!isName(c.name)) return { ok: false, field: 'children', error: 'Please give each child’s name.' }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.dob) || isNaN(Date.parse(c.dob))) return { ok: false, field: 'children', error: `Please give ${c.name}’s date of birth.` }
    const age = ageOn(c.dob, today)
    if (age < 2 || age > 18) return { ok: false, field: 'children', error: `${c.name}’s date of birth doesn’t look right — please check it.` }
  }
  const venueId = clean(body.venueId, 40)
  if (!UUID.test(venueId) || !venueIds.includes(venueId)) return { ok: false, field: 'venueId', error: 'Please choose a venue.' }
  if (body.consentData !== true) return { ok: false, field: 'consentData', error: 'We need your agreement to keep your details before you can join.' }
  return { ok: true, value: { guardian, email, phone, children, venueId, consentData: true, consentPhoto: body.consentPhoto === true, optInEmail: body.optInEmail === true, optInSms: body.optInSms === true && !!phone } }
}

/** A bot fills the hidden field, or submits faster than a person could. */
export const looksLikeABot = (body: Record<string, unknown>, now: number) =>
  !!clean(body.website, 200) || !(Number(body.startedAt) > 0) || now - Number(body.startedAt) < 3000

/** Is the venue full? Capacity counts families placed there (not those waiting). */
export const venueFull = (capacity: number | null | undefined, placed: number) => !!capacity && placed >= capacity

// ── Families, visits, tiles ─────────────────────────────────────────────────
export interface CommunityFamily {
  id: string; source: CommunitySource | null; community_venue_id: string | null
  signed_up_at: string | null; lapsed_at: string | null; waitlisted_at: string | null; created_at?: string | null
  /** Has a child at a school (decides school / both). */
  hasSchoolChild: boolean
}
/** One family at one weekend session (any child present). */
export interface Visit { familyId: string; date: string; venueId: string | null }

const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5)

export function visitsBy(visits: Visit[]): Map<string, string[]> {
  const out = new Map<string, Set<string>>()
  for (const v of visits) (out.get(v.familyId) ?? out.set(v.familyId, new Set()).get(v.familyId)!).add(v.date)
  return new Map([...out].map(([k, s]) => [k, [...s].sort()]))
}

/** In Community: signed up for it, given a weekend venue, or been to a weekend session. */
export const inCommunity = (f: CommunityFamily, dates: string[] | undefined) =>
  f.source === 'community' || f.source === 'both' || !!f.community_venue_id || !!f.signed_up_at || !!dates?.length

/** Where the family came from: a school, directly, or a school family who now comes at weekends. */
export function sourceOf(f: CommunityFamily, dates: string[] | undefined): CommunitySource {
  if (f.source === 'both') return 'both'
  const school = f.source === 'school' || f.hasSchoolChild
  if (school) return dates?.length || f.community_venue_id || f.signed_up_at ? 'both' : 'school'
  return 'community'
}

export function statusOf(f: CommunityFamily, dates: string[] | undefined, today: string): CommunityStatus {
  if (f.lapsed_at) return 'lapsed'
  const last = dates?.[dates.length - 1]
  if (last && days(last, today) > LAPSE_DAYS) return 'lapsed'
  const joined = f.signed_up_at ?? dates?.[0] ?? f.created_at ?? null
  if (!last || (joined && days(joined.slice(0, 10), today) <= NEW_DAYS)) return 'new'
  return 'active'
}

/** Families the "Mark lapsed" action would mark: a visit, none in 6 weeks, not already marked. */
export function lapsePreview<F extends CommunityFamily>(families: F[], byFamily: Map<string, string[]>, today: string): F[] {
  return families.filter(f => {
    const d = byFamily.get(f.id)
    return !f.lapsed_at && !!d?.length && days(d[d.length - 1], today) > LAPSE_DAYS
  })
}

export interface CommunityTiles { signedUp: number; activeThisTerm: number; newThisMonth: number; visitsThisTerm: number; lapsed: number; conversionsThisTerm: number }

export function communityTiles(families: CommunityFamily[], visits: Visit[], term: { start: string; end: string }, today: string): CommunityTiles {
  const by = visitsBy(visits)
  // Families on a waiting list aren't counted until they have a place.
  const fam = families.filter(f => inCommunity(f, by.get(f.id)) && !f.waitlisted_at)
  const inTerm = (d: string) => d >= term.start && d <= term.end
  const month = today.slice(0, 7)
  return {
    signedUp: fam.length,
    activeThisTerm: fam.filter(f => (by.get(f.id) ?? []).some(inTerm)).length,
    newThisMonth: fam.filter(f => (f.signed_up_at ?? by.get(f.id)?.[0] ?? '').slice(0, 7) === month).length,
    visitsThisTerm: [...by.values()].reduce((n, d) => n + d.filter(inTerm).length, 0),
    lapsed: fam.filter(f => statusOf(f, by.get(f.id), today) === 'lapsed').length,
    // A school family whose FIRST weekend visit was this term.
    conversionsThisTerm: families.filter(f => (f.hasSchoolChild || f.source === 'school' || f.source === 'both') && inTerm(by.get(f.id)?.[0] ?? '')).length,
  }
}
