// ─── LUMIO IMPACT — IMPORT SCHEMA ────────────────────────────────────────────
// Impact's own record types for the product-agnostic import engine
// (src/lib/import-engine). Every saved category maps to an Impact-owned tp_*
// table (supabase/drafts/213–214) — nothing here touches Tennis Coach's tables:
//   schools → tp_schools          programmes → tp_programmes
//   venues → tp_venues            coaches → tp_staff
//   volunteers → tp_volunteers    families → tp_families
//   children → tp_children        registers → tp_sessions + tp_attendance
//   events → tp_fundraising_events   donations → tp_donations
//   responses → tp_impact_responses
// "contacts" is read but never saved as-is: a contacts list is routed by its
// tags into families / volunteers / coaches (src/lib/impact/import-tidy.ts).
//
// Opts in to the engine's review flags: anything that doesn't read cleanly
// (an impossible date, an email with no @, "fifty" as an amount, "maybe" for
// consent) is listed for the user to check before saving — never guessed.

import type { ImportSchema, Rec } from '@/lib/import-engine/records'
import { toNumber } from '@/lib/import-engine/records'

export type ImpactImportCategory =
  | 'schools' | 'programmes' | 'venues' | 'coaches' | 'volunteers' | 'families'
  | 'children' | 'registers' | 'events' | 'donations' | 'responses' | 'contacts'

export const IMPACT_IMPORT_FIELDS: Record<ImpactImportCategory, string[]> = {
  schools: ['name', 'borough', 'address', 'head_name', 'pe_lead_name', 'safeguarding_lead', 'contact_email', 'contact_phone', 'funding_source', 'status', 'notes'],
  programmes: ['school_name', 'term_label', 'start_date', 'end_date', 'year_groups', 'current_week', 'status', 'cost', 'notes'],
  venues: ['name', 'address', 'postcode', 'courts', 'surface', 'access_notes', 'storage_notes', 'session_day', 'session_time', 'inclusive', 'notes'],
  coaches: ['name', 'role', 'qualification', 'email', 'phone', 'availability', 'specialisms', 'dbs_status', 'dbs_number', 'dbs_expiry', 'safeguarding_date', 'first_aid_expiry', 'notes'],
  volunteers: ['name', 'email', 'phone', 'venue_name', 'inducted', 'induction_date', 'dbs_status', 'since', 'notes'],
  families: ['guardian_name', 'guardian2_name', 'email', 'phone', 'emergency_contact', 'consent_data', 'consent_photo', 'unsubscribed', 'notes'],
  children: ['name', 'date_of_birth', 'year_group', 'school_name', 'programme_term', 'class_name', 'guardian_name', 'guardian_email', 'guardian_phone', 'photo_consent', 'medical_notes', 'send', 'fee_status', 'fee_amount', 'notes'],
  registers: ['child_name', 'session_date', 'present', 'kind', 'school_name', 'venue_name', 'week_number', 'notes'],
  events: ['name', 'event_type', 'event_date', 'target', 'status', 'notes'],
  donations: ['donor_name', 'amount', 'donated_on', 'purpose', 'gift_aid', 'method', 'notes'],
  responses: ['respondent_name', 'child_name', 'respondent', 'areas_helped', 'would_recommend', 'satisfaction', 'comment', 'consent_publish', 'notes'],
  contacts: ['name', 'email', 'phone', 'tags', 'notes'],
}

export const IMPACT_IMPORT_CATEGORIES = Object.keys(IMPACT_IMPORT_FIELDS) as ImpactImportCategory[]
/** Categories that are saved (in this order — later ones link to earlier). */
export const IMPACT_SAVE_ORDER: Exclude<ImpactImportCategory, 'contacts'>[] = [
  'schools', 'programmes', 'venues', 'coaches', 'families', 'volunteers', 'children', 'events', 'donations', 'registers', 'responses',
]

const LABEL: Record<ImpactImportCategory, string> = {
  schools: 'name', programmes: 'school_name', venues: 'name', coaches: 'name', volunteers: 'name', families: 'guardian_name',
  children: 'name', registers: 'child_name', events: 'name', donations: 'donor_name', responses: 'respondent_name', contacts: 'name',
}

export const IMPACT_ENUMS: Record<string, string[]> = {
  'schools.status': ['enquiry', 'fundraising', 'confirmed', 'running', 'complete', 'renewal'],
  'programmes.status': ['planned', 'fundraising', 'confirmed', 'running', 'complete'],
  'coaches.role': ['lead', 'coach', 'assistant', 'apprentice'],
  'coaches.dbs_status': ['valid', 'due-soon', 'expired', 'missing', 'pending'],
  'volunteers.dbs_status': ['valid', 'pending', 'expired', 'n/a'],
  'children.fee_status': ['paid', 'deposit', 'due', 'waived', 'unknown'],
  'registers.kind': ['school', 'weekend'],
  'events.event_type': ['fair_stall', 'cake_sale', 'sponsored_ball_hit', 'quiz_night', 'other'],
  'events.status': ['planned', 'live', 'complete', 'cancelled'],
  'donations.method': ['stripe', 'cash', 'bank'],
  'responses.respondent': ['parent', 'school', 'tenor', 'coach'],
}

export const IMPACT_CATEGORY_LABEL: Record<ImpactImportCategory, string> = {
  schools: 'Schools', programmes: 'Programmes', venues: 'Venues', coaches: 'Coaches', volunteers: 'Volunteers',
  families: 'Families', children: 'Children', registers: 'Register entries', events: 'Fundraising events',
  donations: 'Donations', responses: 'Feedback responses', contacts: 'Contacts',
}

// ── Value readers ────────────────────────────────────────────────────────────
const BOOL = new Set([
  'venues.inclusive', 'volunteers.inducted', 'families.consent_data', 'families.consent_photo', 'families.unsubscribed',
  'children.photo_consent', 'children.send', 'registers.present', 'donations.gift_aid', 'responses.would_recommend', 'responses.consent_publish',
])

/** Y, yes, TRUE, ✓, 1 → true; N, no, FALSE, 0, ✗ → false; anything else → unreadable. */
export function readYesNo(v: unknown): boolean | null {
  const s = String(v ?? '').trim().toLowerCase().replace(/[.!]+$/, '')
  if (/^(y|yes|yeah|yep|true|t|1|✓|✔|x|ok|given|agreed|consented|present|here)$/.test(s)) return true
  if (/^(n|no|nope|false|f|0|✗|✘|refused|declined|not given|absent|away)$/.test(s)) return false
  return null
}

/** Y3 / 3 / Year 4 / yr2 / year3 / R / rec / reception / nursery → R, Y1–Y13, N. */
export function readYearGroup(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase()
  if (/^(r|rec|recep|reception|yr ?r|year ?r|fs2|foundation)$/.test(s)) return 'R'
  if (/^(n|nursery|fs1|pre-?school)$/.test(s)) return 'N'
  const m = s.match(/^(?:y|yr|yrs|year|grade)?\s*\.?\s*(\d{1,2})$/)
  if (m && +m[1] >= 1 && +m[1] <= 13) return `Y${+m[1]}`
  return null
}

/** UK phone tidy: "7700900456" → "07700 900456", "+44 7700 900789" → "07700 900789". */
export function readPhone(v: unknown): string | null {
  const raw = String(v ?? '').trim()
  if (!raw) return null
  if (/[a-z]{3,}/i.test(raw.replace(/^(tel|mob|m|t)[:.]?\s*/i, ''))) return null   // "call mum", "n/a"
  let d = raw.replace(/[^\d+]/g, '')
  if (d.startsWith('+44')) d = '0' + d.slice(3)
  else if (d.startsWith('0044')) d = '0' + d.slice(4)
  else if (d.startsWith('44') && d.length === 12) d = '0' + d.slice(2)
  if (/^7\d{9}$/.test(d)) d = '0' + d
  // Mobiles are 11 digits; landlines 10 or 11.
  if (d.startsWith('07') ? !/^07\d{9}$/.test(d) : !/^0[1-9]\d{8,9}$/.test(d)) return null
  if (d.startsWith('07')) return `${d.slice(0, 5)} ${d.slice(5)}`
  if (d.startsWith('02')) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`
  return `${d.slice(0, 5)} ${d.slice(5)}`
}

/** Lower-cased, trimmed, and plausibly deliverable — or null. */
export function readEmail(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(s) || s.includes('..') || /^\.|\.@|@\./.test(s)) return null
  return s
}
// England's school year: the year group for a date of birth in the current
// academic year (Sept–Aug). R = 4–5 at 1 September.
export function expectedYearGroup(dob: string, today = new Date()): string | null {
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const acYear = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1   // Sept start
  const ageAtSept = acYear - d.getFullYear() - (d.getMonth() >= 8 ? 1 : 0)
  const idx = ageAtSept - 5                     // R = 0 at age 4 → idx -1 … keep simple below
  if (ageAtSept === 4) return 'R'
  if (ageAtSept === 3) return 'N'
  if (idx >= 0 && idx <= 12) return `Y${idx + 1}`
  return null
}
const yearIndex = (y: string | null) => y === 'N' ? -1 : y === 'R' ? 0 : y && /^Y\d+$/.test(y) ? Number(y.slice(1)) : NaN

const BLANKISH = /^(none|no ?email|n\/?a|na|-|—|unknown|tbc|tba|nil|\?)$/i

const EMAIL_FIELDS = new Set(['schools.contact_email', 'coaches.email', 'volunteers.email', 'families.email', 'children.guardian_email', 'contacts.email'])
const PHONE_FIELDS = new Set(['schools.contact_phone', 'coaches.phone', 'volunteers.phone', 'families.phone', 'children.guardian_phone', 'contacts.phone'])

const isPersonName = (name: string) => {
  const s = name.trim()
  if (s.length < 2 || s.length > 80 || s.split(' ').length > 7) return false
  if (/\d|[:/@▼►■•]/.test(s.replace(/\([^)]*\)/g, ' '))) return false
  if (/^(total|totals|average|notes?|name|names|child|children|kids?|parent|guardian)\b/i.test(s)) return false
  return /\p{L}{2}/u.test(s)
}
/** "lucy harper" → "Lucy Harper" (all-lower names only; mixed case is left alone). */
const titleCase = (s: string) => s === s.toLowerCase()
  ? s.replace(/(^|[\s'’-])(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase())
  : s

export const IMPACT_IMPORT_SCHEMA: ImportSchema<ImpactImportCategory> = {
  categories: IMPACT_IMPORT_CATEGORIES,
  fields: IMPACT_IMPORT_FIELDS,
  labelField: LABEL,
  intFields: new Set(['programmes.current_week', 'registers.week_number', 'responses.satisfaction']),
  numFields: new Set(['programmes.cost', 'children.fee_amount', 'events.target', 'donations.amount']),
  dateFields: new Set(['programmes.start_date', 'programmes.end_date', 'coaches.dbs_expiry', 'coaches.safeguarding_date', 'coaches.first_aid_expiry',
    'volunteers.induction_date', 'volunteers.since', 'children.date_of_birth', 'registers.session_date', 'events.event_date', 'donations.donated_on']),
  enums: IMPACT_ENUMS,
  synonyms: {
    'schools.status': { interested: 'enquiry', lead: 'enquiry', prospect: 'enquiry', unfunded: 'fundraising', booked: 'confirmed', active: 'running', live: 'running', completed: 'complete', finished: 'complete', renewing: 'renewal' },
    'programmes.status': { proposed: 'planned', booked: 'confirmed', active: 'running', live: 'running', 'in progress': 'running', completed: 'complete', finished: 'complete' },
    'coaches.role': { 'head coach': 'lead', 'lead coach': 'lead', head: 'lead', senior: 'lead', 'assistant coach': 'assistant', helper: 'assistant', trainee: 'apprentice', apprentice: 'apprentice' },
    'coaches.dbs_status': { yes: 'valid', ok: 'valid', current: 'valid', 'in date': 'valid', expiring: 'due-soon', 'due soon': 'due-soon', 'out of date': 'expired', applied: 'pending', none: 'missing', no: 'missing' },
    'volunteers.dbs_status': { yes: 'valid', ok: 'valid', current: 'valid', applied: 'pending', 'not needed': 'n/a', no: 'n/a', none: 'n/a' },
    'registers.kind': { 'in school': 'school', class: 'school', weekend: 'weekend', saturday: 'weekend', sunday: 'weekend', family: 'weekend', community: 'weekend' },
    'events.event_type': { 'ball hit': 'sponsored_ball_hit', 'sponsored ball hit': 'sponsored_ball_hit', 'cake sale': 'cake_sale', bake: 'cake_sale', fair: 'fair_stall', 'fair stall': 'fair_stall', 'summer fair': 'fair_stall', quiz: 'quiz_night', 'quiz night': 'quiz_night' },
    'events.status': { upcoming: 'planned', future: 'planned', open: 'live', running: 'live', done: 'complete', finished: 'complete', completed: 'complete', cancelled: 'cancelled', canceled: 'cancelled' },
    'donations.method': { card: 'stripe', online: 'stripe', stripe: 'stripe', cash: 'cash', 'cash tin': 'cash', cheque: 'bank', transfer: 'bank', bacs: 'bank', bank: 'bank' },
    'responses.respondent': { mum: 'parent', dad: 'parent', carer: 'parent', guardian: 'parent', family: 'parent', teacher: 'school', head: 'school', volunteer: 'tenor', helper: 'tenor' },
  },
  fieldLabels: {
    status: 'Status', current_week: 'Week', cost: 'Cost', start_date: 'Start', end_date: 'End', date_of_birth: 'Date of birth',
    year_group: 'Year group', photo_consent: 'Photo consent', consent_photo: 'Photo consent', consent_data: 'Data consent',
    fee_status: 'Paid?', fee_amount: 'Fee', amount: 'Amount', donated_on: 'Date', event_date: 'Date', session_date: 'Date',
    email: 'Email', contact_email: 'Email', guardian_email: 'Email', phone: 'Phone', contact_phone: 'Phone', guardian_phone: 'Phone',
    present: 'Present', gift_aid: 'Gift Aid', inducted: 'Inducted', inclusive: 'Inclusive', send: 'SEND', unsubscribed: 'Unsubscribed',
    would_recommend: 'Would recommend', consent_publish: 'OK to publish', satisfaction: 'Satisfaction', week_number: 'Week',
    dbs_expiry: 'DBS expiry', safeguarding_date: 'Safeguarding', first_aid_expiry: 'First aid', induction_date: 'Induction', since: 'Since',
    target: 'Target', role: 'Role', dbs_status: 'DBS', kind: 'Session type', event_type: 'Event type', method: 'Method', respondent: 'Respondent',
  },
  personCategories: ['children', 'coaches', 'volunteers', 'contacts'],
  isPersonName,
  headingExact: /^(total|totals|sub-?total|grand total|name|names|school|school name|programme|child|child name|donor|venue|coach|volunteer|guardian|parent)$/i,
  headingPrefix: /^(total|totals|sub-?total|grand total|average|avg|notes?\s*:)/i,
  headingWhy: /^(total|totals|sub-?total|grand total|average|avg|notes?\b|name|names|school|programme|child|donor|venue|coach|volunteer|guardian|parent)\b/i,
  collectIssues: true,
  parseField: (category, field, v) => {
    const key = `${category}.${field}`
    if (BOOL.has(key)) {
      const b = readYesNo(v)
      return b === null ? { spill: true } : { value: b }
    }
    if (key === 'children.year_group') {
      const y = readYearGroup(v)
      return y ? { value: y } : { spill: true }
    }
    if (EMAIL_FIELDS.has(key)) {
      if (BLANKISH.test(String(v).trim())) return { value: undefined }
      const e = readEmail(v)
      return e ? { value: e } : { spill: true }
    }
    if (PHONE_FIELDS.has(key)) {
      if (BLANKISH.test(String(v).trim())) return { value: undefined }
      const p = readPhone(v)
      return p ? { value: p } : { spill: true }
    }
    if (key === 'programmes.current_week' || key === 'registers.week_number') {
      const m = String(v).match(/(\d{1,2})/)
      const n = m ? Number(m[1]) : NaN
      return Number.isFinite(n) && n >= 0 && n <= 10 ? { value: n } : { spill: true }
    }
    if (key === 'responses.satisfaction') {
      const n = toNumber(String(v).replace(/\/\s*5$/, ''))
      return n !== null && n >= 1 && n <= 5 ? { value: Math.round(n) } : { spill: true }
    }
    if (key === 'coaches.specialisms' || key === 'responses.areas_helped') {
      return { value: String(v).split(/[;,/]| and /).map(s => s.trim()).filter(Boolean).join('; ') }
    }
    return undefined
  },
  enumFallback: (key, s) => {
    if (key === 'children.fee_status') {
      // The "paid?" column: £10 / paid / 10 / yes / deposit / tbc / 0 / "paid cash".
      if (/deposit|part/i.test(s)) return 'deposit'
      if (/waiv|free|bursary|funded/i.test(s)) return 'waived'
      if (/^(£\s*)?0+(\.0+)?$|^(no|n|unpaid|owes?|owing|due|outstanding)\b/i.test(s)) return 'due'
      if (/^(tbc|tba|unknown|\?|maybe)$/i.test(s)) return 'unknown'
      if (/paid|^(yes|y|✓|✔)$|^£?\s*\d+(\.\d+)?$/i.test(s)) return 'paid'
      return null
    }
    if (key === 'events.event_type') return 'other'
    return null
  },
  afterClean: (category, out) => {
    for (const f of ['name', 'guardian_name', 'guardian2_name', 'donor_name', 'respondent_name', 'child_name']) {
      if (typeof out[f] === 'string') out[f] = titleCase((out[f] as string).replace(/\s+/g, ' ').trim())
    }
    if (category === 'children' && typeof out.fee_status !== 'string') out.fee_status = undefined
  },
  validate: (category, out) => {
    const issues: string[] = []
    const name = String(out.name ?? '')
    if ((category === 'children' || category === 'coaches' || category === 'volunteers') && name && !name.includes(' ')) {
      issues.push(`Only a first name (“${name}”) — add a surname so they can be told apart`)
    }
    if (category === 'children' && !out.date_of_birth && !out.year_group) issues.push('No date of birth or year group')
    if (category === 'children' && typeof out.date_of_birth === 'string' && typeof out.year_group === 'string') {
      const expected = expectedYearGroup(out.date_of_birth)
      const gap = Math.abs(yearIndex(expected) - yearIndex(out.year_group))
      if (expected && Number.isFinite(gap) && gap > 1) issues.push(`Year group ${out.year_group} doesn’t match date of birth ${out.date_of_birth} (that’s ${expected} this year) — check both`)
    }
    if (category === 'children' && typeof out.guardian_name === 'string' && /^(mum|mom|mummy|dad|daddy|mother|father|gran|grandma|grandad|nan|nanna|carer)$|['’]s (mum|dad|mother|father)$/i.test(out.guardian_name)) {
      issues.push(`Guardian is a relationship (“${out.guardian_name}”), not a name`)
    }
    if (category === 'children' && out.photo_consent === undefined) issues.push('Photo consent not recorded — treated as NO photos until confirmed')
    if (category === 'donations' && typeof out.amount !== 'number') issues.push('No amount that can be read — won’t be saved without one')
    if (category === 'registers' && !out.session_date) issues.push('No session date — won’t be saved without one')
    return issues
  },
  // De-duplication: people by name (+ DOB for children); households by email,
  // then phone, then name — so "Dawn Harper" and "harper d" with the same
  // email are one family; donations only when every field matches.
  dedupeKey: (category, r, norm) => {
    if (category === 'programmes') return `${norm(r.school_name)}|${norm(r.term_label)}`
    if (category === 'families' || category === 'contacts') {
      if (r.email) return `e:${norm(r.email)}`
      if (r.phone) return `p:${String(r.phone).replace(/\D/g, '')}`
      return `n:${norm(r[category === 'families' ? 'guardian_name' : 'name'])}`
    }
    if (category === 'registers') return `${norm(r.child_name)}|${norm(r.session_date)}|${norm(r.kind)}`
    if (category === 'donations') return JSON.stringify(['donor_name', 'amount', 'donated_on', 'purpose'].map(f => norm(r[f])))
    if (category === 'responses') return JSON.stringify(['respondent_name', 'child_name', 'comment'].map(f => norm(r[f])))
    return undefined
  },
  // Households that share an email OR a phone are one household (Mo's guardian
  // phone is K. Okafor's). A real name beats a "Parent/carer of …" placeholder,
  // and a placeholder's "no guardian name" flag goes once a real name is known.
  afterDedupe: (category, byKey, merge) => {
    if (category !== 'families') return
    const recs = [...byKey.entries()]
    const contact = (r: Rec) => [r.email ? `e:${String(r.email).toLowerCase()}` : '', r.phone ? `p:${String(r.phone).replace(/\D/g, '')}` : ''].filter(Boolean)
    for (let i = 0; i < recs.length; i++) {
      const [ka, a] = recs[i]
      if (!byKey.has(ka)) continue
      for (let j = i + 1; j < recs.length; j++) {
        const [kb, b] = recs[j]
        if (!byKey.has(kb) || !contact(a).some(x => contact(b).includes(x))) continue
        const aPlaceholder = /^Parent\/carer of /.test(String(a.guardian_name))
        const bPlaceholder = /^Parent\/carer of /.test(String(b.guardian_name))
        if (aPlaceholder && !bPlaceholder) a.guardian_name = b.guardian_name
        merge(a, { ...b, guardian_name: undefined, _review: undefined })
        const reviews = [...((a._review as string[]) ?? []), ...((b._review as string[]) ?? [])]
        const named = !/^Parent\/carer of /.test(String(a.guardian_name))
        const kept = [...new Set(reviews.filter(m => !(named && /^No guardian name for /.test(m))))]
        if (aPlaceholder !== bPlaceholder || a.email !== b.email) kept.push(`Matched by ${a.email && a.email === b.email ? 'email' : 'phone'} — ${String(a.guardian_name)} looks after more than one child here; check`)
        a._review = kept.length ? [...new Set(kept)] : undefined
        if (!a._review) delete a._review
        byKey.delete(kb)
      }
    }
    // A household merged (by email) into a named one no longer lacks a name.
    for (const r of byKey.values()) {
      if (/^Parent\/carer of /.test(String(r.guardian_name)) || !Array.isArray(r._review)) continue
      const kept = (r._review as string[]).filter(m => !/^No guardian name for /.test(m))
      if (kept.length) r._review = kept; else delete r._review
    }
  },
  sameThing: category => category === 'children'
    ? (a: Rec, b: Rec) => !a.date_of_birth || !b.date_of_birth || a.date_of_birth === b.date_of_birth
    : undefined,
}

/** What the model is told each category IS (shared by the map and read routes). */
export const IMPACT_MEANINGS = `What each category means:
- schools: primary or secondary schools the organisation works with. One per school.
- programmes: a block of sessions run at a school in a term (e.g. a 10-week programme) — one per school per term.
- venues: community or weekend venues where family sessions run (parks, rec grounds, courts).
- coaches: paid coaches and staff who deliver sessions.
- volunteers: parent volunteers and session helpers (also called TENORs, Court Captains, helpers).
- families: parents, guardians and carers — one per household, with contact details and consents.
- children: the children taking part. ONE RECORD PER CHILD — a row naming two children ("Jack & Mia Okafor (twins)") is still mapped as children; it is split later. guardian_name/email/phone are that child's parent or carer.
- registers: attendance — one row per child per session (child, date, present).
- events: fundraising events (fairs, cake sales, sponsored ball hits, quiz nights).
- donations: money given — donor, amount, date, what for.
- responses: feedback or survey answers from parents, schools or volunteers.
- contacts: a general contacts list mixing parents, volunteers and coaches (name, email, phone, tags/roles) — use this when one tab holds different kinds of people.
- skip: anything else — timetables, budgets, summaries, instructions, totals.`
