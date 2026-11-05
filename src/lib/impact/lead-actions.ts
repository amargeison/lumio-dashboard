// What happens when a lead is won, and writing leads in bulk. The plans are pure;
// the writes take a Supabase client, so a browser session (RLS), the import route
// and the tests all run the same code.

import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanImportRow, ukDate, type Lead, type Pipeline } from './leads'

export type SchoolRef = { id: string; name: string }
export type CampaignRef = { id: string; school_id: string | null; status: string; target_pence?: number }
export type SchoolContact = { status: string; head_name?: string | null; pe_lead_name?: string | null; contact_email?: string | null; contact_phone?: string | null }

/** The schools to offer: the portal's list plus any just created, which it won't have until it reloads. */
export const withSchools = (schools: SchoolRef[], added: SchoolRef[]) => [...schools, ...added.filter(a => !schools.some(s => s.id === a.id))]

// ── Partnered ───────────────────────────────────────────────────────────────
const NOISE = /\b(the|primary|junior|infants?|school|academy|c of e|ce|church of england)\b/g
const plainName = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, ' and ').replace(NOISE, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/** An existing school with the same name, ignoring words like "Primary". Only ever offered, never linked by itself. */
export function matchSchool(name: string | null | undefined, schools: SchoolRef[]): SchoolRef | null {
  const want = plainName(name ?? '')
  return (want && schools.find(s => plainName(s.name) === want)) || null
}

// A lead with no contact yet carries the organisation's name in `name`, which isn't a person.
const contactName = (l: Pick<Lead, 'name' | 'org_name'>) => l.name.trim() && l.name !== l.org_name ? l.name.trim() : null
/** A role containing "head" goes to head_name, anything else to pe_lead_name. */
const nameField = (l: Pick<Lead, 'for_name'>) => /head/i.test(l.for_name ?? '') ? 'head_name' as const : 'pe_lead_name' as const

export function newSchoolRow(lead: Pick<Lead, 'name' | 'org_name' | 'for_name' | 'email' | 'phone'>, hqId: string) {
  return {
    hq_id: hqId, name: (lead.org_name || lead.name).trim(), status: 'confirmed',
    [nameField(lead)]: contactName(lead),
    contact_email: lead.email ?? null, contact_phone: lead.phone ?? null,
  }
}

/**
 * What linking a lead changes on an existing school. Only blanks are filled, so a
 * lead can't overwrite a contact already on file, and status only moves forward:
 * a school already confirmed, running or finished stays as it is.
 */
export function linkSchoolPatch(lead: Pick<Lead, 'name' | 'org_name' | 'for_name' | 'email' | 'phone'>, school: SchoolContact) {
  const field = nameField(lead), person = contactName(lead)
  return {
    ...(['enquiry', 'fundraising'].includes(school.status) ? { status: 'confirmed' } : {}),
    ...(person && !school[field] ? { [field]: person } : {}),
    ...(lead.email && !school.contact_email ? { contact_email: lead.email } : {}),
    ...(lead.phone && !school.contact_phone ? { contact_phone: lead.phone } : {}),
  }
}

export async function partnerWithNewSchool(db: SupabaseClient, hqId: string, lead: Lead): Promise<string> {
  const { data, error } = await db.from('tp_schools').insert(newSchoolRow(lead, hqId)).select('id').single()
  if (error || !data) throw new Error('The school could not be created.')
  return data.id as string
}

export async function partnerWithSchool(db: SupabaseClient, hqId: string, lead: Lead, schoolId: string): Promise<string> {
  const { data: school, error } = await db.from('tp_schools').select('status, head_name, pe_lead_name, contact_email, contact_phone').eq('id', schoolId).eq('hq_id', hqId).single()
  if (error || !school) throw new Error('That school could not be found.')
  const patch = linkSchoolPatch(lead, school as SchoolContact)
  if (Object.keys(patch).length) {
    const { error: failed } = await db.from('tp_schools').update(patch).eq('id', schoolId).eq('hq_id', hqId)
    if (failed) throw new Error('The school could not be updated.')
  }
  return schoolId
}

// ── Funded ──────────────────────────────────────────────────────────────────
export type FundedPlan =
  | { kind: 'close' }                                             // nothing to record: the amount stays on the lead
  | { kind: 'donate'; campaignId: string }
  | { kind: 'offer-campaign'; schoolId: string; targetPence: number }

const CAMPAIGN_ORDER = ['live', 'draft', 'paused', 'unlocked', 'complete']
const rank = (status: string) => { const i = CAMPAIGN_ORDER.indexOf(status); return i < 0 ? CAMPAIGN_ORDER.length : i }

/** A lead that already has a campaign has had its donation recorded, so closing it again records nothing. */
export function fundedPlan(lead: Pick<Lead, 'amount_pence' | 'school_id' | 'campaign_id'>, campaigns: CampaignRef[]): FundedPlan {
  if (!lead.amount_pence || !lead.school_id || lead.campaign_id) return { kind: 'close' }
  const own = campaigns.filter(c => c.school_id === lead.school_id).sort((a, b) => rank(a.status) - rank(b.status))
  return own.length ? { kind: 'donate', campaignId: own[0].id } : { kind: 'offer-campaign', schoolId: lead.school_id, targetPence: lead.amount_pence }
}

export function donationRow(lead: Pick<Lead, 'name' | 'org_name' | 'email' | 'amount_pence'>, campaignId: string, hqId: string, today: string) {
  return {
    hq_id: hqId, campaign_id: campaignId, amount_pence: lead.amount_pence as number,
    method: 'bank', donor_name: lead.org_name || lead.name, donor_email: lead.email ?? null, donated_on: today,
  }
}

/** Runs a donate or offer-campaign plan, and returns the campaign the money went to. */
export async function recordFunding(db: SupabaseClient, hqId: string, lead: Lead, plan: Exclude<FundedPlan, { kind: 'close' }>, today = ukDate(new Date())): Promise<string> {
  let campaignId: string
  if (plan.kind === 'donate') campaignId = plan.campaignId
  else {
    // Fully raised the moment it's made, so it's complete: it mustn't replace a live campaign on the Overview.
    const { data, error } = await db.from('tp_fundraising_campaigns').insert({ hq_id: hqId, school_id: plan.schoolId, target_pence: plan.targetPence, status: 'complete' }).select('id').single()
    if (error || !data) throw new Error('The campaign could not be created.')
    campaignId = data.id as string
  }
  const { error } = await db.from('tp_donations').insert(donationRow(lead, campaignId, hqId, today))
  if (error) throw new Error('The donation could not be recorded.')
  return campaignId
}

/**
 * Whether this donation funds the school. Null unless the school is fundraising,
 * because nothing else moves. A campaign made here has target = amount, so it
 * always qualifies.
 */
export function fundingOutcome(
  plan: Exclude<FundedPlan, { kind: 'close' }>, amountPence: number, school: { status: string },
  campaign?: { target_pence?: number }, raisedPence = 0,
): { total: number; target: number; meetsTarget: boolean } | null {
  if (school.status !== 'fundraising') return null
  const total = plan.kind === 'donate' ? raisedPence + amountPence : amountPence
  const target = plan.kind === 'donate' ? campaign?.target_pence ?? 0 : plan.targetPence
  return { total, target, meetsTarget: target > 0 && total >= target }
}

/** Confirmed, and funded by this funder unless a source is already recorded. */
export function fundedSchoolPatch(school: { status: string; funding_source?: string | null }, funder: string) {
  return {
    ...(school.status === 'fundraising' ? { status: 'confirmed' } : {}),
    ...(!school.funding_source?.trim() && funder.trim() ? { funding_source: funder.trim() } : {}),
  }
}

export async function markSchoolFunded(db: SupabaseClient, hqId: string, schoolId: string, funder: string) {
  const { data: school, error } = await db.from('tp_schools').select('status, funding_source').eq('id', schoolId).eq('hq_id', hqId).single()
  if (error || !school) throw new Error('The donation was recorded, but that school could not be found.')
  const patch = fundedSchoolPatch(school as { status: string; funding_source: string | null }, funder)
  if (!Object.keys(patch).length) return
  const { error: failed } = await db.from('tp_schools').update(patch).eq('id', schoolId).eq('hq_id', hqId)
  if (failed) throw new Error('The donation was recorded, but the school could not be updated.')
}

// ── Bulk ────────────────────────────────────────────────────────────────────
/** Writes spreadsheet rows, 200 at a time. Used by the import route. */
export async function insertLeads(db: SupabaseClient, hqId: string, pipeline: Pipeline, rows: Record<string, unknown>[]) {
  const clean = rows.map(r => cleanImportRow(pipeline, r)).filter(r => r !== null).map(r => ({ ...r, hq_id: hqId }))
  let added = 0
  for (let i = 0; i < clean.length; i += 200) {
    const { error, count } = await db.from('impact_leads').insert(clean.slice(i, i + 200), { count: 'exact' })
    if (error) return { added, skipped: rows.length - clean.length, error: error.message }
    added += count ?? 0
  }
  return { added, skipped: rows.length - clean.length, error: null }
}
