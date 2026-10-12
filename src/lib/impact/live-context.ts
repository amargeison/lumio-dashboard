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
import type { ImpactCopy, ImpactDataset, ImpactPortalContext } from '@/app/tenproject/[slug]/_components/ImpactDataContext'

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
  campaigns: { id: string; school_id: string; target_pence: number; status: string; match_partner: string | null; match_note: string | null; public_slug: string | null }[]
  events: { id: string; campaign_id: string; name: string; event_type: string; event_date: string | null; status: string; target_pence: number | null }[]
  donations: { campaign_id: string; event_id: string | null; amount_pence: number }[]
  checkins: { children_count: number | null }[]
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
      school: rows.schools.find(s => s.id === camp.school_id)?.name ?? '',
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
  return data
}
