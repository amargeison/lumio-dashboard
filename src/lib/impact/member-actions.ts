// What a signed-in coach or parent reads and writes. Each takes a Supabase client,
// so the same code runs in the browser and the tests. The database decides what each
// role may see; nothing here widens it.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LiveRows } from './live-context'
import type { PackPayment } from './packs'

export interface CoachChild {
  id: string; family_id: string | null; programme_id: string | null; school_id: string | null
  name: string; year_group: string | null; school: string | null; medical_notes: string | null
  send: boolean | null; consent_photo: boolean; stickers: number
}
export interface CoachFamily { id: string; guardian_name: string; phone: string | null; emergency_contact: string | null }
export interface CoachHome {
  hq_id: string | null
  schools: { id: string; name: string; borough: string | null; address: string | null; status: string }[]
  programmes: { id: string; school_id: string; term_label: string; year_groups: string | null; current_week: number | null; status: string; lead_staff_id: string | null; venue_id: string | null }[]
  venues: { id: string; name: string; address: string | null; postcode: string | null; courts: string | null; surface: string | null; access_notes: string | null; storage_notes: string | null; session_day: string | null; session_time: string | null }[]
  children: CoachChild[]
  families: CoachFamily[]
  sessions: { id: string; kind: string; programme_id: string | null; session_date: string; week_number: number | null; lead_staff_id: string | null; venue_id: string | null; venue: string | null }[]
  attendance: { session_id: string; child_id: string; present: boolean; via: string }[]
  /** Paid yes/no: a row means paid. No amounts. */
  paid: { child_id: string; item_id: string }[]
  /** The coach's own certificates. Nothing else from their staff row. */
  me?: { dbs_status: string; dbs_expiry: string | null; first_aid_expiry: string | null; safeguarding_date: string | null } | null
}

export async function loadCoachHome(db: SupabaseClient, hqId: string): Promise<CoachHome> {
  const { data, error } = await db.rpc('impact_coach_home', { p_hq: hqId })
  if (error) throw new Error('Your sessions could not be loaded.')
  return data as CoachHome
}

/** The rows the shared views build from, out of what a coach is allowed to read. */
export function coachRows(home: CoachHome): LiveRows {
  return {
    schools: home.schools as unknown as LiveRows['schools'],
    programmes: home.programmes.map(p => ({ id: p.id, school_id: p.school_id, term_label: p.term_label, year_groups: p.year_groups, current_week: p.current_week, status: p.status, cost_pence: null })),
    programmeLinks: home.programmes.map(p => ({ id: p.id, lead_staff_id: p.lead_staff_id, venue_id: p.venue_id })),
    venues: home.venues.map(v => ({ ...v, inclusive: false, external_partner: null, external_url: null, notes: null })),
    campaigns: [], events: [], donations: [], checkins: [],
    children: home.children.map(c => ({
      id: c.id, family_id: c.family_id, name: c.name, date_of_birth: null, year_group: c.year_group, school_id: c.school_id,
      programme_id: c.programme_id, medical_notes: c.medical_notes, photo_consent: c.consent_photo, fee_status: 'unknown', stickers: c.stickers, send: c.send,
    })),
    sessions: home.sessions.map(s => ({ id: s.id, kind: s.kind, programme_id: s.programme_id, venue_id: s.venue_id, session_date: s.session_date, week_number: s.week_number, lead_staff_id: s.lead_staff_id })),
    attendance: home.attendance,
  }
}

/** What the issue dialog needs to know a coach's child has paid. It carries no amount. */
export const coachPayments = (home: CoachHome): PackPayment[] =>
  home.paid.map(p => ({ id: `${p.child_id}:${p.item_id}`, child_id: p.child_id, item_id: p.item_id, amount_pence: 0, paid_at: '', method: '', reference: null }))

/** One tap on the register. */
/** Every family with an app message filed for them, read in pages so a long log isn't cut short. */
export async function appMessagedFamilies(db: SupabaseClient, hqId: string): Promise<string[]> {
  const out = new Set<string>()
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('impact_messages').select('family_id').eq('hq_id', hqId).eq('channel', 'app').eq('status', 'filed').eq('direction', 'out').not('family_id', 'is', null).order('id').range(from, from + 999)
    if (error) return []
    const rows = (data ?? []) as { family_id: string }[]
    rows.forEach(r => out.add(r.family_id))
    if (rows.length < 1000) return [...out]
  }
}

export async function markAttendance(db: SupabaseClient, hqId: string, sessionId: string, childId: string, present: boolean) {
  const { error } = await db.from('tp_attendance').upsert({ hq_id: hqId, session_id: sessionId, child_id: childId, present, via: 'register', recorded_at: new Date().toISOString() }, { onConflict: 'session_id,child_id' })
  if (error) throw new Error('That register change didn’t save.')
}

export interface ParentChild {
  id: string; name: string; date_of_birth: string | null; year_group: string | null; stickers: number; photo_consent: boolean | null; school: string | null
  sessions: { id: string; kind: string; session_date: string; week_number: number | null; venue: string | null }[]
}
export interface ParentHome {
  id: string; hq_id: string; guardian_name: string; guardian2_name: string | null; email: string | null; phone: string | null
  emergency_contact: string | null; consent_data: boolean | null; consent_photo: boolean | null
  opt_in_email: boolean; opt_in_sms: boolean; opt_in_app: boolean; unsubscribed_at: string | null
  children: ParentChild[]
}
export type ParentDetails = Pick<ParentHome, 'email' | 'phone' | 'emergency_contact' | 'consent_data' | 'consent_photo' | 'opt_in_email' | 'opt_in_sms' | 'opt_in_app'> & { resubscribe?: boolean }

export async function loadParentHome(db: SupabaseClient, familyId: string): Promise<ParentHome | null> {
  const { data, error } = await db.rpc('impact_parent_home')
  if (error) throw new Error('Your family could not be loaded.')
  return ((data ?? []) as ParentHome[]).find(f => f.id === familyId) ?? null
}

export async function saveParentDetails(db: SupabaseClient, familyId: string, d: ParentDetails) {
  const { error } = await db.rpc('impact_parent_update_family', {
    p_family: familyId, p_email: d.email, p_phone: d.phone, p_emergency_contact: d.emergency_contact,
    p_consent_data: d.consent_data, p_consent_photo: d.consent_photo, p_opt_in_email: d.opt_in_email, p_opt_in_sms: d.opt_in_sms, p_opt_in_app: d.opt_in_app, p_resubscribe: d.resubscribe === true,
  })
  if (error) throw new Error('Your details could not be saved.')
}

export const ageFrom = (dob: string | null, today = new Date()) => {
  if (!dob) return 0
  const d = new Date(dob)
  return today.getFullYear() - d.getFullYear() - (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)
}
