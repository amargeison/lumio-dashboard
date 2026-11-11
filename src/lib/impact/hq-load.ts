// The live HQ load for one org, outside React so the tests run the same path as
// the browser (tests/impact/hq-load.test.mjs).
//
// Each step runs on its own. A step that fails is logged with its name and
// reported in `errors`; the steps that worked still return what they mapped, so
// the portal shows what loaded with a banner instead of a page of zeros.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ImpactCpd, ImpactDataset, ImpactPeople, ImpactPortalContext } from '@/app/tenproject/[slug]/_components/ImpactDataContext'
import { EMPTY_IMPACT_DATA, mapLiveRows, buildCohorts, buildPeople, sessionsByChild, type LiveRows } from './live-context'
import { loadPacks } from './pack-actions'
import { appMessagedFamilies } from './member-actions'
import type { PackData } from './packs'
import { buildInsights, type LiveInsights } from './insights'
import { isoToday } from './compliance'

export interface LoadError { step: string; message: string }

export interface HqLoad {
  rows: LiveRows
  data: ImpactDataset
  people?: ImpactPeople
  insights?: LiveInsights
  cohorts?: ImpactPortalContext['cohorts']
  familySessions?: ImpactPortalContext['sessionsByChild']
  packs?: PackData
  cpd: ImpactCpd[]
  errors: LoadError[]
}

const messageOf = (e: unknown) =>
  e instanceof Error ? e.message : e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e)

// A table from a draft migration that isn't applied yet reads as empty, on purpose.
const MISSING_TABLE = new Set(['42P01', 'PGRST205'])

/** One line for the banner: the first failure, plus how many more. */
export function loadErrorLine(errors: LoadError[]): string | null {
  if (!errors.length) return null
  const [first] = errors
  return `${first.message} (${first.step})${errors.length > 1 ? ` and ${errors.length - 1} more` : ''}`
}

export async function loadHqData(db: SupabaseClient, hqId: string, today = isoToday(), onStage?: (stage: string) => void): Promise<HqLoad> {
  const errors: LoadError[] = []
  const fail = (step: string, e: unknown) => {
    const message = messageOf(e)
    console.error(`[impact] HQ load failed at ${step}:`, e)
    errors.push({ step, message })
  }
  async function run<T>(step: string, f: () => T | Promise<T>, fallback: T): Promise<T> {
    try { return await f() } catch (e) { fail(step, e); return fallback }
  }
  type Res<T> = { data: T[] | null; error: { code?: string; message: string } | null }
  // Every read: a query error is reported unless the table just isn't there yet.
  const rowsOf = <T,>(step: string, q: PromiseLike<Res<T>>) => run(step, async () => {
    const r = await q
    if (r.error) {
      if (r.error.code && MISSING_TABLE.has(r.error.code)) return [] as T[]
      throw new Error(r.error.message)
    }
    return r.data ?? []
  }, [] as T[])
  const t = (table: string, cols: string) => db.from(table).select(cols).eq('hq_id', hqId)

  const [schools, programmes, campaigns, events, donations, checkins, venues, staff, volunteers, families, children, sessions, attendance, programmeLinks, responses, cpdRows, members, appMessaged] = await Promise.all([
    rowsOf('schools', t('tp_schools', 'id, name, borough, address, head_name, pe_lead_name, safeguarding_lead, contact_email, contact_phone, funding_source, status, notes').order('name')),
    rowsOf('programmes', t('tp_programmes', 'id, school_id, term_label, year_groups, current_week, status, cost_pence')),
    rowsOf('campaigns', t('tp_fundraising_campaigns', 'id, school_id, target_pence, status, match_partner, match_note, public_slug')),
    rowsOf('events', t('tp_fundraising_events', 'id, campaign_id, name, event_type, event_date, status, target_pence').order('event_date')),
    rowsOf('donations', t('tp_donations', 'campaign_id, event_id, amount_pence')),
    rowsOf('check-ins', t('tp_qr_checkins', 'children_count, session_date')),
    rowsOf('venues', t('tp_venues', 'id, name, address, postcode, courts, surface, access_notes, storage_notes, session_day, session_time, inclusive, external_partner, external_url, notes').order('name')),
    rowsOf('staff', t('tp_staff', 'id, name, role, qualification, email, phone, availability, specialisms, dbs_status, dbs_number, dbs_expiry, safeguarding_date, first_aid_expiry, insurance, notes').order('name')),
    rowsOf('volunteers', t('tp_volunteers', 'id, name, email, phone, venue_id, inducted, induction_date, dbs_status, dbs_expiry, first_aid_expiry, since, notes').order('name')),
    rowsOf('families', t('tp_families', 'id, guardian_name, email, phone, emergency_contact, consent_data, consent_photo, unsubscribed_at, resubscribed_at').order('guardian_name')),
    rowsOf('children', t('tp_children', 'id, family_id, name, date_of_birth, year_group, school_id, programme_id, medical_notes, photo_consent, fee_status, stickers, send, gender, fsm, pupil_premium').order('name')),
    rowsOf('sessions', t('tp_sessions', 'id, kind, programme_id, venue_id, session_date, week_number, lead_staff_id').order('session_date')),
    rowsOf('attendance', t('tp_attendance', 'session_id, child_id, present, via')),
    rowsOf('programme links', t('tp_programmes', 'id, lead_staff_id, venue_id')),
    rowsOf('impact responses', t('tp_impact_responses', 'school_id, would_recommend, satisfaction')),
    rowsOf('CPD', t('tp_cpd', 'id, school_id, staff_name, course, cpd_date, provider, notes').order('cpd_date', { ascending: false })),
    rowsOf('members', t('impact_members', 'role, family_id, accepted_at, revoked_at')),
    run('app messages', () => appMessagedFamilies(db, hqId), [] as string[]),
  ])
  onStage?.('fetches done')
  const rows = {
    schools, programmes, campaigns, events, donations, checkins,
    venues, staff, volunteers, families, children, sessions, attendance, programmeLinks, responses, cpd: cpdRows, members, appMessaged,
  } as unknown as LiveRows

  const [data, people, insights, cohorts, familySessions, packs] = [
    await run('tiles', () => mapLiveRows(rows, today), EMPTY_IMPACT_DATA),
    await run('people', () => buildPeople(rows), undefined),
    await run('insights', () => buildInsights(rows, today), undefined),
    await run('cohorts', () => buildCohorts(rows, today), undefined),
    await run('family sessions', () => sessionsByChild(rows), undefined),
    await run('welcome packs', () => loadPacks(db, hqId), undefined),
  ]
  onStage?.('mapped')
  return { rows, data, people, insights, cohorts, familySessions, packs, cpd: (rows.cpd ?? []) as ImpactCpd[], errors }
}
