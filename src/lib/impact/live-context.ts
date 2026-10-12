// ─── LUMIO IMPACT — LIVE PORTAL DATA (/impact/<live slug>) ───────────────────
// The live portal renders the same views as /impact/demo, fed from Supabase
// instead of curated demo data. Day one there is nothing to show, so every
// surface starts from EMPTY_IMPACT_DATA and its empty states; whatever tp_*
// rows the signed-in HQ owns (RLS: hq_id = auth.uid()) are mapped on top by
// mapLiveRows(). Demo copy is blanked so no demo narrative can leak through.
//
// Kept as real reference data (not demo content): Ten Project's own impact
// taxonomy and curriculum/booklet structure, the product's comms templates,
// and the factual DfE / PESSPN criteria, dates and guidance links.

import * as TP from '@/data/tenproject/demo-data'
import type { DemoSchool, FundraisingEvent, SchoolStatus, TpSchoolDetail } from '@/data/tenproject/demo-data'
import { TEN_PROJECT_COPY } from '@/data/tenproject/portal-copy'
import { GENERIC_BRAND } from './org'
import type { ImpactCopy, ImpactDataset, ImpactPortalContext, ImpactPeople, ImpactChild } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import type { DemoVenue, DemoChild, TpCoach, TpTenor, TpPersonDetail, TpVenueDetail } from '@/data/tenproject/demo-data'

const KEEP: (keyof ImpactDataset)[] = [
  'CURRICULUM', 'STICKER_AREAS', 'IMPACT_AREAS', 'COMMS_TEMPLATES',
  'PESSPN_CRITERIA', 'PESSPN_TIMELINE', 'PESSPN_GUIDANCE',
]
// Lookup tables keyed by id — empty means "no entries", not "entries with blanks".
const RECORDS: (keyof ImpactDataset)[] = [
  'SCHOOL_DETAILS', 'VENUE_DETAILS', 'COACH_DETAILS', 'TENOR_DETAILS', 'SCHOOL_READINESS', 'SOCIAL_BEST_TIMES',
]

// Same shape, no content: strings '', numbers 0, booleans false, arrays [].
function blank<T>(v: T): T {
  if (Array.isArray(v)) return [] as unknown as T
  if (typeof v === 'string') return '' as unknown as T
  if (typeof v === 'number') return 0 as unknown as T
  if (typeof v === 'boolean') return false as unknown as T
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)])) as T
  }
  return v
}

function emptyDataset(): ImpactDataset {
  const { TP_RED: _r, TP_BLACK: _b, TP_DARK: _d, TP_PAPER: _p, ...data } = TP
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(data)) {
    const key = k as keyof ImpactDataset
    out[k] = KEEP.includes(key) ? v : RECORDS.includes(key) ? {} : blank(v)
  }
  // Calendars stay keyed by role so the week grid still renders.
  out.CAL_EVENTS = { school: [], coach: [], tenor: [] }
  return out as ImpactDataset
}

export const EMPTY_IMPACT_DATA: ImpactDataset = emptyDataset()
export const EMPTY_IMPACT_COPY: ImpactCopy = blank(TEN_PROJECT_COPY)

/** Live portal with nothing connected yet — a fresh org, generic brand. */
export const IMPACT_LIVE_EMPTY_CONTEXT: ImpactPortalContext = {
  mode: 'live',
  brand: GENERIC_BRAND,
  copy: EMPTY_IMPACT_COPY,
  data: EMPTY_IMPACT_DATA,
}

// ─── Supabase rows → the views' dataset ─────────────────────────────────────
export interface LiveRows {
  schools: { id: string; name: string; borough: string | null; address: string | null; head_name: string | null; pe_lead_name: string | null; safeguarding_lead: string | null; contact_email: string | null; contact_phone: string | null; funding_source: string | null; status: string; notes: string | null }[]
  programmes: { id: string; school_id: string; term_label: string; year_groups: string | null; current_week: number | null; status: string; cost_pence: number | null }[]
  campaigns: { id: string; school_id: string | null; target_pence: number; status: string; match_partner: string | null; match_note: string | null; public_slug: string | null }[]
  events: { id: string; campaign_id: string; name: string; event_type: string; event_date: string | null; status: string; target_pence: number | null }[]
  donations: { campaign_id: string; event_id: string | null; amount_pence: number }[]
  checkins: { children_count: number | null }[]
  // Impact-owned people & places (drafts 213/214) — empty until applied.
  venues?: { id: string; name: string; address: string | null; postcode: string | null; courts: string | null; surface: string | null; access_notes: string | null; storage_notes: string | null; session_day: string | null; session_time: string | null; inclusive: boolean; external_partner: string | null; external_url: string | null; notes: string | null }[]
  staff?: { id: string; name: string; role: string; qualification: string | null; email: string | null; phone: string | null; availability: string | null; specialisms: string[] | null; dbs_status: string; dbs_number: string | null; dbs_expiry: string | null; safeguarding_date: string | null; first_aid_expiry: string | null; insurance: string | null; notes: string | null }[]
  volunteers?: { id: string; name: string; email: string | null; phone: string | null; venue_id: string | null; inducted: boolean; induction_date: string | null; dbs_status: string; since: string | null; notes: string | null }[]
  families?: { id: string; guardian_name: string; email: string | null; phone: string | null; emergency_contact: string | null; consent_data: boolean | null; consent_photo: boolean | null; unsubscribed_at: string | null }[]
  children?: { id: string; family_id: string | null; name: string; date_of_birth: string | null; year_group: string | null; school_id: string | null; programme_id: string | null; medical_notes: string | null; photo_consent: boolean | null; fee_status: string; stickers: number }[]
  sessions?: { id: string; kind: string; programme_id: string | null; venue_id: string | null; session_date: string; lead_staff_id: string | null }[]
  attendance?: { session_id: string; child_id: string; present: boolean; via: string }[]
  programmeLinks?: { id: string; lead_staff_id: string | null; venue_id: string | null }[]
}

const EVENT_TYPE: Record<string, string> = {
  fair_stall: 'School fair', cake_sale: 'Cake sale', sponsored_ball_hit: 'Sponsored ball hit', quiz_night: 'Quiz night', other: 'Other',
}
const SCHOOL_STATUS: Record<string, SchoolStatus> = {
  enquiry: 'enquiry', fundraising: 'fundraising', confirmed: 'confirmed', running: 'running', complete: 'complete', renewal: 'complete',
}
const pounds = (pence: number | null | undefined) => Math.round((pence ?? 0) / 100)
const shortDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'

export function mapLiveRows(rows: LiveRows): ImpactDataset {
  const data: { -readonly [K in keyof ImpactDataset]: ImpactDataset[K] } = { ...EMPTY_IMPACT_DATA }
  const raisedFor = (campaignId: string) => pounds(rows.donations.filter(d => d.campaign_id === campaignId).reduce((n, d) => n + d.amount_pence, 0))

  data.SCHOOLS = rows.schools.map((s): DemoSchool => {
    const progs = rows.programmes.filter(p => p.school_id === s.id)
    const live = progs.find(p => p.status === 'running') ?? progs[0]
    return {
      id: s.id,
      name: s.name,
      borough: s.borough ?? '',
      status: SCHOOL_STATUS[s.status] ?? 'enquiry',
      week: live?.current_week ?? undefined,
      cohorts: progs.length || undefined,
      headTeacher: s.head_name ?? '—',
      note: s.notes ?? undefined,
    }
  })

  data.SCHOOL_DETAILS = Object.fromEntries(rows.schools.map(s => {
    const camp = rows.campaigns.find(c => c.school_id === s.id)
    const detail: TpSchoolDetail = {
      contacts: [
        ...(s.head_name ? [{ name: s.head_name, role: 'Headteacher', email: s.contact_email ?? '', phone: s.contact_phone ?? '' }] : []),
        ...(s.pe_lead_name ? [{ name: s.pe_lead_name, role: 'PE lead', email: '', phone: '' }] : []),
      ],
      safeguardingLead: s.safeguarding_lead ?? '—',
      funding: s.funding_source ?? '—',
      address: s.address ?? '',
      cohorts: rows.programmes.filter(p => p.school_id === s.id).map(p => ({ name: `${p.term_label}${p.year_groups ? ` · ${p.year_groups}` : ''}`, children: 0, coach: '—', week: p.current_week ?? 0 })),
      attendanceTrend: [],
      activationPct: 0,
      conversionPct: 0,
      kit: '—',
      fundraising: camp ? { raised: raisedFor(camp.id), target: pounds(camp.target_pence), supporters: rows.donations.filter(d => d.campaign_id === camp.id).length } : undefined,
      notes: s.notes ? [s.notes] : [],
      nextActions: [],
    }
    return [s.id, detail]
  }))

  const camp = rows.campaigns.find(c => c.status === 'live') ?? rows.campaigns[0]
  if (camp) {
    data.CAMPAIGN = {
      school: rows.schools.find(s => s.id === camp.school_id)?.name ?? 'Organisation-wide fundraising',
      target: pounds(camp.target_pence),
      raised: raisedFor(camp.id),
      matchPartner: camp.match_partner ?? '',
      matchNote: camp.match_note ?? '',
      supporters: rows.donations.filter(d => d.campaign_id === camp.id).length,
    }
    data.FUND_EVENTS = rows.events.filter(e => e.campaign_id === camp.id).map((e): FundraisingEvent => ({
      id: e.id,
      name: e.name,
      type: EVENT_TYPE[e.event_type] ?? 'Other',
      date: shortDate(e.event_date),
      status: e.status === 'complete' ? 'complete' : e.status === 'live' ? 'live' : 'planned',
      raised: pounds(rows.donations.filter(d => d.event_id === e.id).reduce((n, d) => n + d.amount_pence, 0)),
      target: pounds(e.target_pence),
    }))
  }

  data.HQ_STATS = {
    ...EMPTY_IMPACT_DATA.HQ_STATS,
    schoolsRunning: rows.programmes.filter(p => p.status === 'running').length,
    schoolsPipeline: rows.schools.filter(s => ['enquiry', 'fundraising', 'confirmed'].includes(s.status)).length,
    weekendVisitsThisTerm: rows.checkins.reduce((n, c) => n + (c.children_count ?? 1), 0),
  }
  mapPeople(rows, data)
  return data
}

// ─── People & places (tp_venues, tp_staff, tp_volunteers, tp_families,
// tp_children, tp_sessions, tp_attendance) → the views' shapes ──────────────
const DAY_MS = 86400000
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const monthYear = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'
const ageOf = (dob: string | null, now = new Date()) => {
  if (!dob) return null
  const d = new Date(dob); if (isNaN(d.getTime())) return null
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)
}
const roleLabel = (r: string): TpCoach['role'] => (r === 'lead' ? 'Lead' : r === 'assistant' ? 'Assistant' : r === 'apprentice' ? 'Apprentice' : 'Coach')
/** Staff DBS state, refreshed against today's date. */
function dbsNow(status: string, expiry: string | null): TpCoach['dbs'] {
  if (expiry) {
    const days = (new Date(expiry).getTime() - Date.now()) / DAY_MS
    if (days < 0) return 'expired'
    if (days < 60) return 'due-soon'
    return 'valid'
  }
  return status === 'valid' || status === 'due-soon' || status === 'expired' ? status : 'missing'
}
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0)

function mapPeople(rows: LiveRows, data: { -readonly [K in keyof ImpactDataset]: ImpactDataset[K] }) {
  const venues = rows.venues ?? [], staff = rows.staff ?? [], vols = rows.volunteers ?? []
  const fams = rows.families ?? [], kids = rows.children ?? [], sessions = rows.sessions ?? [], att = rows.attendance ?? []
  const links = new Map((rows.programmeLinks ?? []).map(p => [p.id, p]))
  const schoolName = (id: string | null) => rows.schools.find(s => s.id === id)?.name ?? null
  const progLabel = (id: string | null) => {
    const p = rows.programmes.find(x => x.id === id)
    return p ? `${schoolName(p.school_id) ?? 'School'} — ${p.term_label}` : null
  }
  const presentIn = (sessionIds: string[]) => att.filter(a => sessionIds.includes(a.session_id))
  const now = Date.now()

  // Venues
  const weekend = sessions.filter(s => s.kind === 'weekend').sort((a, b) => a.session_date.localeCompare(b.session_date))
  data.VENUES = venues.map((v): DemoVenue => {
    const mine = weekend.filter(s => s.venue_id === v.id)
    const last = mine[mine.length - 1]
    return { id: v.id, name: v.name, day: v.session_day ?? '', time: v.session_time ?? '', tenors: vols.filter(x => x.venue_id === v.id).length,
      external: !!v.external_partner, lastCount: last ? presentIn([last.id]).filter(a => a.present).length : undefined }
  })
  data.VENUE_DETAILS = Object.fromEntries(venues.map(v => {
    const mine = weekend.filter(s => s.venue_id === v.id)
    const detail: TpVenueDetail = {
      address: v.address ?? '', postcode: v.postcode ?? '', courts: v.courts ?? '—', surface: v.surface ?? '—',
      access: v.access_notes ?? '—', storage: v.storage_notes ?? '—',
      sessions: v.session_day ? [{ day: v.session_day, time: v.session_time ?? '', type: `Free Community Family Session${v.inclusive ? ' (inclusive)' : ''}` }] : [],
      leadCoach: staff.find(s => (rows.programmeLinks ?? []).some(p => p.venue_id === v.id && p.lead_staff_id === s.id))?.name ?? '—',
      tenorTeam: vols.filter(x => x.venue_id === v.id).map(x => x.name), inclusive: v.inclusive,
      ...(v.external_partner ? { external: { partner: v.external_partner, url: v.external_url ?? '#' } } : {}),
      familiesRegistered: new Set(presentIn(mine.map(s => s.id)).map(a => kids.find(k => k.id === a.child_id)?.family_id).filter(Boolean)).size,
      attendanceTrend: mine.slice(-5).map(s => presentIn([s.id]).filter(a => a.present).length),
      feederSchools: [], kit: '—', notes: v.notes ? [v.notes] : [], nextActions: [],
    }
    return [v.id, detail]
  }))

  // Coaches
  data.TP_COACHES = staff.map((s): TpCoach => {
    const progIds = (rows.programmeLinks ?? []).filter(p => p.lead_staff_id === s.id).map(p => p.id)
    const dbs = dbsNow(s.dbs_status, s.dbs_expiry)
    return { id: s.id, name: s.name, role: roleLabel(s.role), qual: s.qualification ?? '—', dbs,
      dbsNote: s.dbs_expiry ? `to ${monthYear(s.dbs_expiry)}` : 'no DBS on file', firstAid: s.first_aid_expiry ? `to ${monthYear(s.first_aid_expiry)}` : 'not recorded',
      specialisms: s.specialisms ?? [], schools: progIds.map(progLabel).filter(Boolean).join(' · ') || 'Unassigned',
      sessionsWeek: sessions.filter(x => x.lead_staff_id === s.id && now - new Date(x.session_date).getTime() < 7 * DAY_MS && new Date(x.session_date).getTime() <= now).length,
      childrenCovered: kids.filter(k => k.programme_id && progIds.includes(k.programme_id)).length }
  })
  data.COACH_DETAILS = Object.fromEntries(staff.map(s => {
    const d: TpPersonDetail = { email: s.email ?? '', phone: s.phone ?? '', availability: s.availability ?? '—', dbsNumber: s.dbs_number ?? '—',
      dbsIssued: '—', dbsExpiry: fmt(s.dbs_expiry), safeguardingDate: fmt(s.safeguarding_date), firstAid: fmt(s.first_aid_expiry), insurance: s.insurance ?? '—',
      assignments: (rows.programmeLinks ?? []).filter(p => p.lead_staff_id === s.id).map(p => ({ name: progLabel(p.id) ?? 'Programme', kind: 'school' as const, detail: 'Lead coach' })),
      cal: [] }
    return [s.id, d]
  }))
  const flagged = data.TP_COACHES.filter(c => c.dbs !== 'valid')
  data.TP_COACH_STATS_ROW = staff.length ? [
    { label: 'COACHES', value: String(staff.length) },
    { label: 'DBS VALID', value: `${data.TP_COACHES.filter(c => c.dbs === 'valid').length}/${staff.length}` },
    { label: 'NEED ATTENTION', value: String(flagged.length) },
  ] : []
  data.TP_COACH_ATTENTION = flagged.map(c => `${c.name} (${c.dbs === 'missing' ? 'no DBS on file' : c.dbs === 'expired' ? 'DBS expired' : `DBS ${c.dbsNote}`})`).join(', ')

  // Volunteers
  data.TP_TENORS = vols.map((v): TpTenor => ({ id: v.id, name: v.name, venue: venues.find(x => x.id === v.venue_id)?.name ?? 'No venue yet', inducted: v.inducted,
    dbs: v.dbs_status === 'valid' ? 'valid' : v.dbs_status === 'pending' || v.dbs_status === 'expired' ? 'pending' : 'n/a',
    sessionsCovered: 0, since: monthYear(v.since), note: v.notes ?? undefined }))
  data.TENOR_DETAILS = Object.fromEntries(vols.map(v => [v.id, {
    email: v.email ?? '', phone: v.phone ?? '', availability: '—', dbsNumber: '—', dbsIssued: '—', dbsExpiry: '—',
    safeguardingDate: v.induction_date ? `Induction ${fmt(v.induction_date)}` : 'Induction not recorded',
    assignments: v.venue_id ? [{ name: venues.find(x => x.id === v.venue_id)?.name ?? 'Venue', kind: 'venue' as const, detail: 'Volunteer' }] : [], cal: [],
  } satisfies TpPersonDetail]))
  data.TP_TENOR_STATS_ROW = vols.length ? [
    { label: 'VOLUNTEERS', value: String(vols.length) },
    { label: 'INDUCTED', value: `${vols.filter(v => v.inducted).length}/${vols.length}` },
    { label: 'VENUES COVERED', value: String(new Set(vols.map(v => v.venue_id).filter(Boolean)).size) },
  ] : []
  data.TP_VENUE_READINESS = venues.map(v => {
    const n = vols.filter(x => x.venue_id === v.id && x.inducted).length
    return { venue: v.name, tenors: n, min: 2, ready: n >= 2, ...(n < 2 ? { note: `Needs ${2 - n} more inducted` } : {}) }
  })

  // Cohorts + the coach register (read-only in the live portal)
  const school = sessions.filter(s => s.kind === 'school')
  const cohorts = rows.programmes.filter(p => kids.some(k => k.programme_id === p.id))
  const rate = (sessionIds: string[]) => { const a = presentIn(sessionIds); return pct(a.filter(x => x.present).length, a.length) }
  data.COACH_STATS = {
    ...EMPTY_IMPACT_DATA.COACH_STATS,
    headline: kids.length ? [
      { label: 'Children', value: kids.length },
      { label: 'Sessions delivered', value: school.length },
      { label: 'Avg attendance', value: `${rate(school.map(s => s.id))}%` },
      { label: 'Stickers awarded', value: kids.reduce((n, k) => n + k.stickers, 0) },
      { label: 'Cohorts', value: cohorts.length },
    ] : [],
    cohortProgress: cohorts.map(p => ({ cohort: progLabel(p.id) ?? p.term_label, week: p.current_week ?? 0,
      attendance: rate(school.filter(s => s.programme_id === p.id).map(s => s.id)), stickers: kids.filter(k => k.programme_id === p.id).reduce((n, k) => n + k.stickers, 0) })),
    attendanceTrend: school.slice(-10).map(s => rate([s.id])),
  }
  const first = cohorts[0]
  const firstLast = first ? school.filter(s => s.programme_id === first.id).sort((a, b) => a.session_date.localeCompare(b.session_date)).pop() : undefined
  data.COHORT_CHILDREN = first ? kids.filter(k => k.programme_id === first.id).map((k): DemoChild => ({
    id: k.id, name: k.name, year: k.year_group ?? '—', stickers: k.stickers,
    present: firstLast ? !!att.find(a => a.session_id === firstLast.id && a.child_id === k.id && a.present) : false,
  })) : []

  // Weekend register: families seen at the latest weekend session
  const lastWeekend = weekend[weekend.length - 1]
  const byFamily = new Map<string, { names: string[]; checked: boolean; via: string }>()
  for (const k of kids) {
    if (!k.family_id) continue
    const a = lastWeekend ? att.find(x => x.session_id === lastWeekend.id && x.child_id === k.id) : undefined
    if (lastWeekend && !a) continue
    const e = byFamily.get(k.family_id) ?? { names: [], checked: false, via: '—' }
    e.names.push(k.name.split(' ')[0]); if (a?.present) { e.checked = true; e.via = a.via === 'qr' ? 'QR' : 'TENOR' }
    byFamily.set(k.family_id, e)
  }
  data.WEEKEND_FAMILIES = [...byFamily].map(([fid, e]) => ({ id: fid, family: (fams.find(f => f.id === fid)?.guardian_name ?? 'Family').split(' ').slice(-1)[0], children: e.names.join(' + '), checkedIn: e.checked, via: e.via }))

  // Headline numbers
  const recent = new Set(att.filter(a => a.present && sessions.some(s => s.id === a.session_id && now - new Date(s.session_date).getTime() < 7 * DAY_MS && new Date(s.session_date).getTime() <= now)).map(a => a.child_id))
  data.HQ_STATS = {
    ...data.HQ_STATS,
    childrenThisWeek: recent.size,
    weekendVisitsThisTerm: data.HQ_STATS.weekendVisitsThisTerm + att.filter(a => a.present && weekend.some(s => s.id === a.session_id)).length,
    dbsExpiring: data.TP_COACHES.filter(c => c.dbs === 'due-soon' || c.dbs === 'expired').length,
  }
  if (kids.length || fams.length) {
    data.INSIGHTS = {
      ...data.INSIGHTS,
      headline: [
        { label: 'Children registered', value: String(kids.length) },
        { label: 'Families', value: String(fams.length) },
        { label: 'Sessions delivered', value: String(sessions.length) },
        { label: 'Attendance rate', value: att.length ? `${pct(att.filter(a => a.present).length, att.length)}%` : '—' },
        { label: 'Schools', value: String(rows.schools.length) },
        { label: 'Volunteers', value: String(vols.length) },
      ],
    }
  }
}

/** Households and their children, for the Families module and the parent preview. */
export function buildPeople(rows: LiveRows): ImpactPeople {
  const kids = rows.children ?? []
  const child = (k: typeof kids[number]): ImpactChild => ({
    id: k.id, name: k.name, age: ageOf(k.date_of_birth), yearGroup: k.year_group, school: rows.schools.find(s => s.id === k.school_id)?.name ?? null,
    medical: k.medical_notes, photoConsent: k.photo_consent, feeStatus: k.fee_status, stickers: k.stickers,
  })
  return {
    families: (rows.families ?? []).map(f => ({
      id: f.id, guardian: f.guardian_name, email: f.email, phone: f.phone, consentData: f.consent_data, consentPhoto: f.consent_photo,
      unsubscribed: !!f.unsubscribed_at, children: kids.filter(k => k.family_id === f.id).map(child),
    })),
    unlinkedChildren: kids.filter(k => !k.family_id).map(child),
  }
}
