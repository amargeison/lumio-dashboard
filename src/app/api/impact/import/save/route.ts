import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanRecord, foldText, type Rec } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_SCHEMA, IMPACT_SAVE_ORDER, type ImpactImportCategory } from '@/lib/impact/import-schema'
import { impactHq } from '@/lib/impact/import-auth'

export const runtime = 'nodejs'

// Lumio Impact bulk import — save step. Writes ONLY Impact's own tp_* tables
// (supabase/drafts/213–214), never a coach_* table, and does it as the
// signed-in HQ — not the service role — so every insert carries hq_id = the
// user and is checked by the tp_* RLS (hq_id = auth.uid()). Every record is
// cleaned again here. Links are resolved against what the org already has
// (categories are saved in IMPACT_SAVE_ORDER, so earlier ones exist):
//   children → family (email, phone, then name), school, cohort/programme
//   volunteers → venue, family        donations → campaign, event
//   registers → child, session        responses → child, family
// Anything already present is left alone; anything that can't be linked is
// reported back, never silently dropped or guessed.

const MAX_ROWS = 1000
type Category = Exclude<ImpactImportCategory, 'contacts'>
type Result = { inserted: number; already: number; leftOut: number; updated?: number; unmatched?: Record<string, string[]> }

const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')
const str = (v: unknown, max = 500) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
const pence = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) : null)
const bool = (v: unknown) => (typeof v === 'boolean' ? v : null)

async function all<T>(db: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const { data, error } = await db.from(table).select(cols)
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as T[]
}

function unmatchedList(map: Map<string, Set<string>>) {
  return Object.fromEntries([...map].map(([k, v]) => [k, [...v].slice(0, 20)]))
}

async function familyResolver(db: SupabaseClient) {
  const fams = await all<{ id: string; guardian_name: string; email: string | null; phone: string | null }>(db, 'tp_families', 'id, guardian_name, email, phone')
  return (email: unknown, phone: unknown, name: unknown): string | null => {
    const e = String(email ?? '').toLowerCase()
    if (e) { const f = fams.find(x => (x.email ?? '').toLowerCase() === e); if (f) return f.id }
    const p = digits(phone)
    if (p) { const f = fams.find(x => digits(x.phone) === p); if (f) return f.id }
    const n = foldText(name)
    if (n) { const hits = fams.filter(x => foldText(x.guardian_name) === n); if (hits.length === 1) return hits[0].id }
    return null
  }
}

async function orgCampaign(db: SupabaseClient, userId: string, totalPence: number): Promise<string> {
  const { data } = await db.from('tp_fundraising_campaigns').select('id').is('school_id', null).order('created_at', { ascending: false }).limit(1)
  if (data?.[0]) return data[0].id as string
  const { data: made, error } = await db.from('tp_fundraising_campaigns')
    .insert({ hq_id: userId, school_id: null, target_pence: Math.max(totalPence, 100), status: 'live', receiving_entity: 'tbc' })
    .select('id').single()
  if (error) throw new Error(`Could not create the organisation's fundraising campaign (${error.message}) — is migration 214 applied?`)
  return made.id as string
}

async function save(db: SupabaseClient, userId: string, category: Category, rows: Rec[]): Promise<Result> {
  const unmatched = new Map<string, Set<string>>()
  const miss = (reason: string, label: unknown) => { if (!unmatched.has(reason)) unmatched.set(reason, new Set()); unmatched.get(reason)!.add(String(label ?? '(blank)')) }
  const insert = async (table: string, recs: Rec[]) => {
    if (!recs.length) return
    const { error } = await db.from(table).insert(recs)
    if (error) throw new Error(`${table}: ${error.message}`)
  }
  const out = (inserted: number, already: number, extra: Partial<Result> = {}): Result =>
    ({ inserted, already, leftOut: 0, ...extra, ...(unmatched.size ? { unmatched: unmatchedList(unmatched) } : {}) })

  const schools = await all<{ id: string; name: string }>(db, 'tp_schools', 'id, name')
  const schoolId = (n: unknown) => schools.find(s => foldText(s.name) === foldText(n))?.id ?? null

  switch (category) {
    case 'schools': {
      const fresh = rows.filter(r => !schoolId(r.name))
      await insert('tp_schools', fresh.map(r => ({
        hq_id: userId, name: str(r.name, 200), borough: str(r.borough), address: str(r.address), head_name: str(r.head_name),
        pe_lead_name: str(r.pe_lead_name), safeguarding_lead: str(r.safeguarding_lead), contact_email: str(r.contact_email),
        contact_phone: str(r.contact_phone), funding_source: str(r.funding_source), status: str(r.status) ?? 'enquiry', notes: str(r.notes, 4000),
      })))
      return out(fresh.length, rows.length - fresh.length)
    }
    case 'programmes': {
      const progs = await all<{ school_id: string; term_label: string }>(db, 'tp_programmes', 'school_id, term_label')
      const have = new Set(progs.map(p => `${p.school_id}|${foldText(p.term_label)}`))
      const toSave: Rec[] = []; let already = 0
      for (const r of rows) {
        const sid = schoolId(r.school_name)
        if (!sid) { miss('No school with that name', r.school_name); continue }
        const term = str(r.term_label, 120) ?? 'Programme'
        const key = `${sid}|${foldText(term)}`
        if (have.has(key)) { already++; continue }
        have.add(key)
        toSave.push({ hq_id: userId, school_id: sid, term_label: term, start_date: r.start_date ?? null, end_date: r.end_date ?? null,
          year_groups: str(r.year_groups), current_week: typeof r.current_week === 'number' ? r.current_week : 0,
          status: str(r.status) ?? 'planned', cost_pence: pence(r.cost), notes: str(r.notes, 4000) })
      }
      await insert('tp_programmes', toSave)
      return out(toSave.length, already)
    }
    case 'venues': {
      const venues = await all<{ name: string }>(db, 'tp_venues', 'name')
      const fresh = rows.filter(r => !venues.some(v => foldText(v.name) === foldText(r.name)))
      await insert('tp_venues', fresh.map(r => ({
        hq_id: userId, name: str(r.name, 200), address: str(r.address), postcode: str(r.postcode, 20), courts: str(r.courts), surface: str(r.surface),
        access_notes: str(r.access_notes), storage_notes: str(r.storage_notes), session_day: str(r.session_day, 40), session_time: str(r.session_time, 40),
        inclusive: bool(r.inclusive) ?? false, notes: str(r.notes, 4000),
      })))
      return out(fresh.length, rows.length - fresh.length)
    }
    case 'coaches': {
      const staff = await all<{ name: string; email: string | null }>(db, 'tp_staff', 'name, email')
      const fresh = rows.filter(r => !staff.some(s => foldText(s.name) === foldText(r.name) || (r.email && (s.email ?? '').toLowerCase() === r.email)))
      await insert('tp_staff', fresh.map(r => ({
        hq_id: userId, name: str(r.name, 200), role: str(r.role) ?? 'coach', qualification: str(r.qualification), email: str(r.email), phone: str(r.phone),
        availability: str(r.availability), specialisms: String(r.specialisms ?? '').split(';').map(s => s.trim()).filter(Boolean),
        dbs_status: str(r.dbs_status) ?? 'missing', dbs_number: str(r.dbs_number, 60), dbs_expiry: r.dbs_expiry ?? null,
        safeguarding_date: r.safeguarding_date ?? null, first_aid_expiry: r.first_aid_expiry ?? null, notes: str(r.notes, 4000),
      })))
      return out(fresh.length, rows.length - fresh.length)
    }
    case 'families': {
      const find = await familyResolver(db)
      const toSave: Rec[] = []; let already = 0, updated = 0
      for (const r of rows) {
        const id = find(r.email, r.phone, r.guardian_name)
        if (id) {
          already++
          // An unsubscribe in the source is honoured; an import never re-opts anyone in.
          if (r.unsubscribed === true) {
            await db.from('tp_families').update({ unsubscribed_at: new Date().toISOString(), opt_in_email: false, opt_in_sms: false, opt_in_app: false }).eq('id', id).is('unsubscribed_at', null)
            updated++
          }
          continue
        }
        const unsub = r.unsubscribed === true
        toSave.push({ hq_id: userId, guardian_name: str(r.guardian_name, 200), guardian2_name: str(r.guardian2_name, 200), email: str(r.email), phone: str(r.phone),
          emergency_contact: str(r.emergency_contact), consent_data: bool(r.consent_data), consent_photo: bool(r.consent_photo),
          consent_at: r.consent_data !== undefined || r.consent_photo !== undefined ? new Date().toISOString() : null,
          opt_in_email: !unsub, opt_in_sms: !unsub, opt_in_app: !unsub, unsubscribed_at: unsub ? new Date().toISOString() : null, notes: str(r.notes, 4000) })
      }
      await insert('tp_families', toSave)
      return out(toSave.length, already, { updated })
    }
    case 'volunteers': {
      const vols = await all<{ name: string }>(db, 'tp_volunteers', 'name')
      const venues = await all<{ id: string; name: string }>(db, 'tp_venues', 'id, name')
      const find = await familyResolver(db)
      const fresh = rows.filter(r => !vols.some(v => foldText(v.name) === foldText(r.name)))
      await insert('tp_volunteers', fresh.map(r => {
        const venueId = r.venue_name ? venues.find(v => foldText(v.name) === foldText(r.venue_name))?.id ?? null : null
        if (r.venue_name && !venueId) miss('No venue with that name (saved without a venue)', r.venue_name)
        return { hq_id: userId, name: str(r.name, 200), email: str(r.email), phone: str(r.phone), venue_id: venueId,
          family_id: find(r.email, r.phone, r.name), inducted: bool(r.inducted) ?? false, induction_date: r.induction_date ?? null,
          dbs_status: str(r.dbs_status) ?? 'n/a', since: r.since ?? null, notes: str(r.notes, 4000) }
      }))
      return out(fresh.length, rows.length - fresh.length)
    }
    case 'children': {
      const kids = await all<{ name: string; date_of_birth: string | null }>(db, 'tp_children', 'name, date_of_birth')
      const progs = await all<{ id: string; school_id: string; term_label: string }>(db, 'tp_programmes', 'id, school_id, term_label')
      const find = await familyResolver(db)
      const toSave: Rec[] = []; let already = 0
      for (const r of rows) {
        const dup = kids.some(k => foldText(k.name) === foldText(r.name) && (!k.date_of_birth || !r.date_of_birth || k.date_of_birth === r.date_of_birth))
        if (dup) { already++; continue }
        const sid = r.school_name ? schoolId(r.school_name) : null
        if (r.school_name && !sid) miss('No school with that name (saved without a school)', r.school_name)
        const pid = sid && r.programme_term ? progs.find(p => p.school_id === sid && foldText(p.term_label) === foldText(r.programme_term))?.id ?? null : null
        const fid = find(r.guardian_email, r.guardian_phone, r.guardian_name ?? `Parent/carer of ${r.name}`)
        if (!fid && (r.guardian_name || r.guardian_email || r.guardian_phone)) miss('Guardian not found (saved without a family)', r.name)
        toSave.push({ hq_id: userId, family_id: fid, name: str(r.name, 200), date_of_birth: r.date_of_birth ?? null, year_group: str(r.year_group, 4),
          school_id: sid, programme_id: pid, class_name: str(r.class_name, 80), photo_consent: bool(r.photo_consent), medical_notes: str(r.medical_notes, 2000),
          send: bool(r.send), fee_status: str(r.fee_status) ?? 'unknown', fee_pence: pence(r.fee_amount), notes: str(r.notes, 4000) })
        kids.push({ name: String(r.name), date_of_birth: (r.date_of_birth as string) ?? null })
      }
      await insert('tp_children', toSave)
      return out(toSave.length, already)
    }
    case 'events': {
      const total = rows.reduce((n, r) => n + (pence(r.target) ?? 0), 0)
      const campaignId = await orgCampaign(db, userId, total)
      const evs = await all<{ name: string }>(db, 'tp_fundraising_events', 'name')
      const fresh = rows.filter(r => !evs.some(e => foldText(e.name) === foldText(r.name)))
      await insert('tp_fundraising_events', fresh.map(r => ({ hq_id: userId, campaign_id: campaignId, name: str(r.name, 200),
        event_type: str(r.event_type) ?? 'other', event_date: r.event_date ?? null, status: str(r.status) ?? 'planned', target_pence: pence(r.target) })))
      return out(fresh.length, rows.length - fresh.length)
    }
    case 'donations': {
      const withAmount = rows.filter(r => typeof r.amount === 'number' && r.amount > 0)
      for (const r of rows) if (!withAmount.includes(r)) miss('No readable amount (not saved)', r.donor_name)
      if (!withAmount.length) return out(0, 0)
      const campaignId = await orgCampaign(db, userId, withAmount.reduce((n, r) => n + (pence(r.amount) ?? 0), 0))
      const evs = await all<{ id: string; name: string; event_type: string }>(db, 'tp_fundraising_events', 'id, name, event_type')
      const existing = await all<{ donor_name: string | null; amount_pence: number; donated_on: string | null }>(db, 'tp_donations', 'donor_name, amount_pence, donated_on')
      const toSave: Rec[] = []; let already = 0
      for (const r of withAmount) {
        const p = pence(r.amount)!
        if (existing.some(d => foldText(d.donor_name) === foldText(r.donor_name) && d.amount_pence === p && (d.donated_on ?? null) === (r.donated_on ?? null))) { already++; continue }
        const ev = r.purpose ? evs.find(e => foldText(e.name) === foldText(r.purpose) || foldText(e.event_type.replace(/_/g, ' ')) === foldText(r.purpose)) : undefined
        toSave.push({ hq_id: userId, campaign_id: campaignId, event_id: ev?.id ?? null, amount_pence: p,
          method: str(r.method) ?? (/cash/i.test(String(r.donor_name ?? '')) ? 'cash' : 'bank'), gift_aid: bool(r.gift_aid) ?? false,
          donor_name: str(r.donor_name, 200), donated_on: r.donated_on ?? null, purpose: str(r.purpose, 200), message: str(r.notes, 1000) })
      }
      await insert('tp_donations', toSave)
      return out(toSave.length, already)
    }
    case 'registers': {
      const kids = await all<{ id: string; name: string; programme_id: string | null }>(db, 'tp_children', 'id, name, programme_id')
      const venues = await all<{ id: string; name: string }>(db, 'tp_venues', 'id, name')
      const sessions = await all<{ id: string; kind: string; session_date: string; programme_id: string | null; venue_id: string | null }>(db, 'tp_sessions', 'id, kind, session_date, programme_id, venue_id')
      let inserted = 0
      for (const r of rows) {
        if (!r.session_date) { miss('No session date (not saved)', r.child_name); continue }
        const hits = kids.filter(k => foldText(k.name) === foldText(r.child_name))
        if (hits.length !== 1) { miss(hits.length ? 'More than one child with that name (not saved)' : 'No child with that name (not saved)', r.child_name); continue }
        const child = hits[0]
        const kind = str(r.kind) ?? (r.venue_name ? 'weekend' : 'school')
        const venueId = r.venue_name ? venues.find(v => foldText(v.name) === foldText(r.venue_name))?.id ?? null : null
        const progId = kind === 'school' ? child.programme_id : null
        let s = sessions.find(x => x.kind === kind && x.session_date === r.session_date && x.programme_id === progId && x.venue_id === venueId)
        if (!s) {
          const { data, error } = await db.from('tp_sessions').insert({ hq_id: userId, kind, session_date: r.session_date, programme_id: progId, venue_id: venueId,
            week_number: typeof r.week_number === 'number' ? r.week_number : null }).select('id, kind, session_date, programme_id, venue_id').single()
          if (error) throw new Error(`tp_sessions: ${error.message}`)
          s = data as typeof sessions[number]; sessions.push(s)
        }
        const { error } = await db.from('tp_attendance').upsert({ hq_id: userId, session_id: s.id, child_id: child.id, present: bool(r.present) ?? true, via: 'import' }, { onConflict: 'session_id,child_id' })
        if (error) throw new Error(`tp_attendance: ${error.message}`)
        inserted++
      }
      return out(inserted, 0)
    }
    case 'responses': {
      const kids = await all<{ id: string; name: string; family_id: string | null; school_id: string | null }>(db, 'tp_children', 'id, name, family_id, school_id')
      const find = await familyResolver(db)
      await insert('tp_impact_responses', rows.map(r => {
        const kid = r.child_name ? kids.filter(k => foldText(k.name) === foldText(r.child_name)) : []
        const child = kid.length === 1 ? kid[0] : null
        if (r.child_name && !child) miss('Child not found (saved without a child)', r.child_name)
        return { hq_id: userId, respondent: str(r.respondent) ?? 'parent', child_id: child?.id ?? null, school_id: child?.school_id ?? null,
          family_id: child?.family_id ?? find(null, null, r.respondent_name),
          areas_helped: String(r.areas_helped ?? '').split(';').map(s => s.trim()).filter(Boolean),
          would_recommend: bool(r.would_recommend), satisfaction: typeof r.satisfaction === 'number' ? r.satisfaction : null,
          comment: [str(r.comment, 2000), str(r.notes, 1000)].filter(Boolean).join(' · ') || null, consent_publish: bool(r.consent_publish) ?? false }
      }))
      return out(rows.length, 0)
    }
  }
}

export async function POST(req: NextRequest) {
  const hq = await impactHq()
  if (hq instanceof NextResponse) return hq
  const body = await req.json().catch(() => ({})) as { category?: string; rows?: Rec[] }
  const category = body.category as Category
  if (!IMPACT_SAVE_ORDER.includes(category)) return NextResponse.json({ error: 'Unknown category' }, { status: 400 })
  const rows = (Array.isArray(body.rows) ? body.rows : []).slice(0, MAX_ROWS)
  // Re-clean on the server; the review list (_review) is never a column.
  const clean = rows.map(r => cleanRecord(IMPACT_IMPORT_SCHEMA, category, r)).filter((r): r is Rec => !!r)
  for (const r of clean) delete r._review
  try {
    const result = await save(hq.db, hq.user.id, category, clean)
    return NextResponse.json({ ...result, leftOut: rows.length - clean.length })
  } catch (e) {
    return NextResponse.json({ error: `Could not save ${category}: ${e instanceof Error ? e.message : 'unknown error'}` }, { status: 500 })
  }
}
