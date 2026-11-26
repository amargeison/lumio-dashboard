// ─── LUMIO IMPACT — IMPORT PLAN ──────────────────────────────────────────────
// Works out, without writing anything, what an import will do: for every record
// in the file, whether it is new, updates an existing record, is skipped, or needs
// review — and the exact writes that follow. Pure: it is given the org's current
// rows and returns a plan, so "What will happen" and the import itself run the
// same code (the import plans again against fresh rows and refuses if the
// answer changed in between).
//
// Matching (a re-import updates instead of duplicating):
//   families  email, then phone, then the same name with no email on file
//   children  name + date of birth. Same name with a date missing on one side is
//             the same child only when the school or family agrees; otherwise it
//             is left for review, never guessed
//   schools   name + postcode (a school with no postcode yet matches on name)
//   others    as before: programme by school + term, venue/volunteer/event by
//             name, coach by email then name, donation by donor + amount + date
// An update only fills in or changes columns the file has a value for; it never
// clears one, never rewrites a name or notes, never re-opts anyone in to
// messages, and only fills an empty link (a child is never moved to another
// family by an import). Register entries already recorded are left alone.
//
// New rows get their ids here, so later records link to earlier ones in memory.

import { cleanRecord, dedupeRecords, foldText, type Rec } from '@/lib/import-engine/records'
import { IMPACT_IMPORT_SCHEMA, IMPACT_SAVE_ORDER, IMPACT_CATEGORY_LABEL, type ImpactSaveCategory } from './import-schema'
import { readPackColumns, type PackItem } from './packs'

export const MAX_IMPORT_ROWS = 5000
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024

export type Row = Rec & { id: string }
export type Existing = {
  schools: Row[]; programmes: Row[]; venues: Row[]; staff: Row[]; families: Row[]; volunteers: Row[]; children: Row[]
  events: Row[]; donations: Rec[]; sessions: Row[]; attendance: Rec[]; responses: Rec[]; cpd: Rec[]
  packItems: PackItem[]; packSizes: Rec[]; packIssues: Rec[]; packPayments: Rec[]; campaignId: string | null
}
export const emptyExisting = (): Existing => ({
  schools: [], programmes: [], venues: [], staff: [], families: [], volunteers: [], children: [], events: [], donations: [], sessions: [],
  attendance: [], responses: [], cpd: [], packItems: [], packSizes: [], packIssues: [], packPayments: [], campaignId: null,
})

export type Op =
  | { kind: 'insert'; table: string; row: Rec }
  | { kind: 'update'; table: string; id: string; patch: Rec }
  | { kind: 'size'; childId: string; itemId: string; size: string }
  | { kind: 'issue'; childId: string; itemId: string; size: string | null; issuedAt: string }

export type Action = 'new' | 'updated' | 'skipped' | 'review'
export const ACTIONS: Action[] = ['new', 'updated', 'skipped', 'review']
export type PlanRow = { label: string; action: Action; match?: string; changes?: string[]; notes?: string[]; writes: boolean }
export type PlanTable = { key: string; label: string; counts: Record<Action, number>; rows: Record<Action, PlanRow[]> }
export type ImportPlan = { tables: PlanTable[]; ops: Op[]; writes: number; records: number }

/** The tables an import writes, in the order the rows are created (later ones link to earlier). */
export const INSERT_ORDER = [
  'tp_schools', 'tp_programmes', 'tp_venues', 'tp_staff', 'tp_families', 'tp_volunteers', 'tp_children', 'tp_pack_sizes', 'tp_pack_payments',
  'tp_fundraising_campaigns', 'tp_fundraising_events', 'tp_donations', 'tp_sessions', 'tp_attendance', 'tp_impact_responses', 'tp_cpd',
] as const

const SHOWN = 5
const fold = foldText
const str = (v: unknown, max = 500) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : typeof v === 'number' ? String(v) : null)
const pence = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) : null)
const bool = (v: unknown) => (typeof v === 'boolean' ? v : null)
const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const list = (v: unknown) => (v == null ? null : String(v).split(';').map(s => s.trim()).filter(Boolean))
const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')
const postcode = (v: unknown) => String(v ?? '').toUpperCase().replace(/\s+/g, '')
/** "bk14pl" → "BK1 4PL"; anything that isn't a UK postcode is kept as written. */
export const tidyPostcode = (v: unknown) => {
  const s = str(v, 20)
  if (!s) return null
  const p = s.toUpperCase().replace(/\s+/g, '')
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(p) ? `${p.slice(0, -3)} ${p.slice(-3)}` : s
}
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

type Col = [col: string, field: string, read: (v: unknown) => unknown]
const T = (max = 500) => (v: unknown) => str(v, max)
const SPEC: Record<Exclude<ImpactSaveCategory, 'registers' | 'donations' | 'responses' | 'cpd'>, { table: string; cols: Col[]; defaults: Rec }> = {
  schools: { table: 'tp_schools', defaults: { status: 'enquiry' }, cols: [
    ['name', 'name', T(200)], ['borough', 'borough', T()], ['address', 'address', T()], ['postcode', 'postcode', tidyPostcode], ['head_name', 'head_name', T()],
    ['pe_lead_name', 'pe_lead_name', T()], ['safeguarding_lead', 'safeguarding_lead', T()], ['contact_email', 'contact_email', T()],
    ['contact_phone', 'contact_phone', T()], ['funding_source', 'funding_source', T()], ['status', 'status', T()], ['notes', 'notes', T(4000)]] },
  programmes: { table: 'tp_programmes', defaults: { term_label: 'Programme', current_week: 0, status: 'planned' }, cols: [
    ['term_label', 'term_label', T(120)], ['start_date', 'start_date', date], ['end_date', 'end_date', date], ['year_groups', 'year_groups', T()],
    ['current_week', 'current_week', num], ['status', 'status', T()], ['cost_pence', 'cost', pence], ['notes', 'notes', T(4000)]] },
  venues: { table: 'tp_venues', defaults: { inclusive: false }, cols: [
    ['name', 'name', T(200)], ['address', 'address', T()], ['postcode', 'postcode', tidyPostcode], ['courts', 'courts', T()], ['surface', 'surface', T()],
    ['access_notes', 'access_notes', T()], ['storage_notes', 'storage_notes', T()], ['session_day', 'session_day', T(40)],
    ['session_time', 'session_time', T(40)], ['inclusive', 'inclusive', bool], ['notes', 'notes', T(4000)]] },
  coaches: { table: 'tp_staff', defaults: { role: 'coach', dbs_status: 'missing', specialisms: [] }, cols: [
    ['name', 'name', T(200)], ['role', 'role', T()], ['qualification', 'qualification', T()], ['email', 'email', T()], ['phone', 'phone', T()],
    ['availability', 'availability', T()], ['specialisms', 'specialisms', list], ['dbs_status', 'dbs_status', T()], ['dbs_number', 'dbs_number', T(60)],
    ['dbs_expiry', 'dbs_expiry', date], ['safeguarding_date', 'safeguarding_date', date], ['first_aid_expiry', 'first_aid_expiry', date], ['notes', 'notes', T(4000)]] },
  families: { table: 'tp_families', defaults: {}, cols: [
    ['guardian_name', 'guardian_name', T(200)], ['guardian2_name', 'guardian2_name', T(200)], ['email', 'email', T()], ['phone', 'phone', T()],
    ['emergency_contact', 'emergency_contact', T()], ['consent_data', 'consent_data', bool], ['consent_photo', 'consent_photo', bool], ['notes', 'notes', T(4000)]] },
  volunteers: { table: 'tp_volunteers', defaults: { inducted: false, dbs_status: 'n/a' }, cols: [
    ['name', 'name', T(200)], ['email', 'email', T()], ['phone', 'phone', T()], ['inducted', 'inducted', bool], ['induction_date', 'induction_date', date],
    ['dbs_status', 'dbs_status', T()], ['first_aid_expiry', 'first_aid_expiry', date], ['since', 'since', date], ['notes', 'notes', T(4000)]] },
  children: { table: 'tp_children', defaults: { fee_status: 'unknown' }, cols: [
    ['name', 'name', T(200)], ['date_of_birth', 'date_of_birth', date], ['year_group', 'year_group', T(4)], ['class_name', 'class_name', T(80)],
    ['photo_consent', 'photo_consent', bool], ['medical_notes', 'medical_notes', T(2000)], ['send', 'send', bool], ['gender', 'gender', T(20)],
    ['fsm', 'fsm', bool], ['pupil_premium', 'pupil_premium', bool], ['fee_status', 'fee_status', T()], ['fee_pence', 'fee_amount', pence], ['notes', 'notes', T(4000)]] },
  events: { table: 'tp_fundraising_events', defaults: { event_type: 'other', status: 'planned' }, cols: [
    ['name', 'name', T(200)], ['event_type', 'event_type', T()], ['event_date', 'event_date', date], ['status', 'status', T()], ['target_pence', 'target', pence]] },
}
// Never rewritten by an update: what the record was matched on, and free text someone may have edited.
const KEEP = new Set(['name', 'guardian_name', 'term_label', 'notes'])

const COL_LABEL: Record<string, string> = {
  contact_email: 'email', contact_phone: 'phone', cost_pence: 'cost', fee_pence: 'fee', target_pence: 'target', consent_data: 'data consent',
  consent_photo: 'photo consent', photo_consent: 'photo consent', date_of_birth: 'date of birth', school_id: 'school', programme_id: 'programme',
  family_id: 'family', venue_id: 'venue', unsubscribed_at: 'unsubscribed', fsm: 'FSM', send: 'SEND',
}
const colLabel = (c: string) => COL_LABEL[c] ?? c.replace(/_/g, ' ')

/** How a record is named on screen. */
export function recordLabel(c: string, r: Rec): string {
  if (c === 'programmes') return `${r.school_name ?? ''} · ${r.term_label ?? 'Programme'}`
  if (c === 'registers') return `${r.child_name} · ${r.session_date ?? 'no date'}`
  if (c === 'donations') return `${r.donor_name ?? 'Anonymous'} · ${typeof r.amount === 'number' ? `£${r.amount}` : 'no amount'}`
  const f = (IMPACT_IMPORT_SCHEMA.labelField as Record<string, string>)[c]
  return String(r[f] ?? '(no name)')
}

/** The file's records, cleaned and de-duplicated again (never trusted as sent). */
export function cleanForPlan(records: Partial<Record<ImpactSaveCategory, Rec[]>>): Record<ImpactSaveCategory, Rec[]> {
  const out = {} as Record<ImpactSaveCategory, Rec[]>
  for (const c of IMPACT_SAVE_ORDER) {
    const rows = Array.isArray(records[c]) ? records[c]! : []
    const clean = rows.filter(r => r && typeof r === 'object').map(r => cleanRecord(IMPACT_IMPORT_SCHEMA, c, r)).filter((r): r is Rec => !!r)
    out[c] = dedupeRecords(IMPACT_IMPORT_SCHEMA, c, clean)
  }
  return out
}

export const countRecords = (records: Partial<Record<string, unknown[]>>) =>
  Object.values(records).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0)

type Ctx = { hqId: string; userId: string; newId: () => string; now: string; today: string }

export function planImport(records: Record<ImpactSaveCategory, Rec[]>, existing: Existing, ctx: Ctx): ImportPlan {
  // Working copies: rows created by this plan join them, so later records link to them.
  const pool = {
    schools: [...existing.schools], programmes: [...existing.programmes], venues: [...existing.venues], staff: [...existing.staff],
    families: [...existing.families], volunteers: [...existing.volunteers], children: [...existing.children], events: [...existing.events],
    sessions: [...existing.sessions], attendance: new Set(existing.attendance.map(a => `${a.session_id}|${a.child_id}`)),
    sizes: new Map(existing.packSizes.map(s => [`${s.child_id}|${s.item_id}`, String(s.size ?? '')])),
    issues: new Set(existing.packIssues.map(s => `${s.child_id}|${s.item_id}`)), paid: new Set(existing.packPayments.map(s => `${s.child_id}|${s.item_id}`)),
  }
  const ops: Op[] = []
  const tables = new Map<string, PlanTable>()
  const table = (key: string, label: string) => {
    if (!tables.has(key)) tables.set(key, { key, label, counts: { new: 0, updated: 0, skipped: 0, review: 0 }, rows: { new: [], updated: [], skipped: [], review: [] } })
    return tables.get(key)!
  }
  let writes = 0
  // Every row written counts towards "Import N records", sessions and pack records included.
  const record = (key: string, label: string, row: PlanRow) => {
    const t = table(key, label)
    t.counts[row.action]++
    if (t.rows[row.action].length < SHOWN) t.rows[row.action].push(row)
    if (row.writes) writes++
  }
  const catRow = (c: ImpactSaveCategory, row: PlanRow) => record(c, IMPACT_CATEGORY_LABEL[c], row)
  const flagsOf = (r: Rec) => (Array.isArray(r._review) ? (r._review as string[]) : [])

  // ── Linking, over existing rows and the ones this import makes ──
  const unique = <R extends Rec>(rows: R[]) => (rows.length === 1 ? rows[0] : null)
  const byName = (rows: Row[], name: unknown, field = 'name') => rows.filter(x => fold(x[field]) === fold(name))
  const schoolFor = (name: unknown, notes: string[]): string | null => {
    if (!name) return null
    const hits = byName(pool.schools, name)
    if (hits.length === 1) return hits[0].id
    notes.push(hits.length ? `More than one school called “${name}” — linked to none` : `No school called “${name}” — saved without a school`)
    return null
  }
  const venueFor = (name: unknown, notes: string[]): string | null => {
    if (!name) return null
    const hits = byName(pool.venues, name)
    if (hits.length === 1) return hits[0].id
    notes.push(hits.length ? `More than one venue called “${name}” — linked to none` : `No venue called “${name}” — saved without a venue`)
    return null
  }
  const familyMatch = (email: unknown, phone: unknown, name: unknown): { row: Row; how: string } | null => {
    const e = String(email ?? '').toLowerCase()
    if (e) { const f = pool.families.find(x => String(x.email ?? '').toLowerCase() === e); if (f) return { row: f, how: 'email' } }
    const p = digits(phone)
    if (p) { const f = pool.families.find(x => digits(x.phone) === p); if (f) return { row: f, how: 'phone' } }
    // A name alone only matches a family that has no email of its own to disagree with.
    if (name && !e) { const f = unique(byName(pool.families, name, 'guardian_name').filter(x => !x.email)); if (f) return { row: f, how: 'name' } }
    return null
  }

  // ── Write one record: update the match, or create it ──
  function put(c: keyof typeof SPEC, r: Rec, match: Row | null, how: string, links: Rec, pick: Row[], notes: string[]): string {
    const spec = SPEC[c]
    const vals: Rec = {}
    for (const [col, field, read] of spec.cols) { const v = read(r[field]); if (v !== null && v !== undefined) vals[col] = v }
    const flags = flagsOf(r)
    const label = recordLabel(c, r)
    if (match) {
      const patch: Rec = {}
      for (const [col, v] of Object.entries(vals)) if (!KEEP.has(col) && !same(v, match[col])) patch[col] = v
      // Links only fill a gap: an import never moves a record to another school or family.
      for (const [col, v] of Object.entries(links)) if (v && !match[col]) patch[col] = v
      if (c === 'families') {
        if ('consent_data' in patch || 'consent_photo' in patch) patch.consent_at = ctx.now
        // An unsubscribe in the file is honoured; an import never opts anyone back in.
        if (r.unsubscribed === true && !match.unsubscribed_at) Object.assign(patch, { unsubscribed_at: ctx.now, opt_in_email: false, opt_in_sms: false, opt_in_app: false })
        // A placeholder name gives way to a real one.
        if (/^Parent\/carer of /.test(String(match.guardian_name)) && vals.guardian_name && !/^Parent\/carer of /.test(String(vals.guardian_name))) patch.guardian_name = vals.guardian_name
      }
      const changes = Object.keys(patch).filter(k => k !== 'consent_at' && !k.startsWith('opt_in_')).map(colLabel)
      const writesNow = Object.keys(patch).length > 0
      if (writesNow) { ops.push({ kind: 'update', table: spec.table, id: match.id, patch }); Object.assign(match, patch) }
      catRow(c, { label, action: flags.length ? 'review' : writesNow ? 'updated' : 'skipped', match: `Matches an existing record (${how})`,
        changes: changes.length ? changes : undefined, notes: [...flags, ...notes, ...(writesNow ? [] : ['Nothing to change'])], writes: writesNow })
      return match.id
    }
    const id = ctx.newId()
    const row: Rec = { id, hq_id: ctx.hqId, ...spec.defaults, ...vals, ...Object.fromEntries(Object.entries(links).filter(([, v]) => v)) }
    if (c === 'families') {
      const unsub = r.unsubscribed === true
      Object.assign(row, { opt_in_email: !unsub, opt_in_sms: !unsub, opt_in_app: !unsub, unsubscribed_at: unsub ? ctx.now : null,
        consent_at: vals.consent_data !== undefined || vals.consent_photo !== undefined ? ctx.now : null })
    }
    ops.push({ kind: 'insert', table: spec.table, row })
    pick.push(row as Row)
    catRow(c, { label, action: flags.length ? 'review' : 'new', notes: [...flags, ...notes], writes: true })
    return id
  }
  const leave = (c: ImpactSaveCategory, r: Rec, action: 'skipped' | 'review', why: string, match?: string) =>
    catRow(c, { label: recordLabel(c, r), action, match, notes: [why, ...flagsOf(r)], writes: false })

  for (const r of records.schools) {
    const names = byName(pool.schools, r.name)
    const pc = postcode(r.postcode)
    if (pc) {
      const exact = names.filter(s => postcode(s.postcode) === pc)
      const open = names.filter(s => !s.postcode)
      if (exact.length === 1) { put('schools', r, exact[0], 'name and postcode', {}, pool.schools, []); continue }
      if (!exact.length && open.length === 1) { put('schools', r, open[0], 'name — postcode added', {}, pool.schools, []); continue }
      if (exact.length > 1 || open.length > 1) { leave('schools', r, 'review', 'More than one school with this name in Lumio — not imported'); continue }
      if (names.length) { put('schools', { ...r, _review: [...flagsOf(r), `A school with this name is already in Lumio at ${names.map(s => s.postcode).join(', ')} — added as a different school; check`] }, null, '', {}, pool.schools, []); continue }
      put('schools', r, null, '', {}, pool.schools, []); continue
    }
    if (names.length === 1) { put('schools', r, names[0], 'name', {}, pool.schools, []); continue }
    if (names.length > 1) { leave('schools', r, 'review', 'More than one school with this name — add the postcode to say which'); continue }
    put('schools', r, null, '', {}, pool.schools, [])
  }

  for (const r of records.programmes) {
    const notes: string[] = []
    const sid = r.school_name ? schoolFor(r.school_name, notes) : null
    if (!sid) { leave('programmes', r, 'skipped', notes[0] ?? 'No school given — a programme needs one'); continue }
    const term = str(r.term_label, 120) ?? 'Programme'
    const match = pool.programmes.find(p => p.school_id === sid && fold(p.term_label) === fold(term)) ?? null
    put('programmes', { ...r, term_label: term }, match, 'school and term', { school_id: sid }, pool.programmes, [])
  }

  for (const r of records.venues) {
    const hits = byName(pool.venues, r.name)
    if (hits.length > 1) { leave('venues', r, 'review', 'More than one venue with this name in Lumio — not imported'); continue }
    put('venues', r, hits[0] ?? null, 'name', {}, pool.venues, [])
  }

  for (const r of records.coaches) {
    const e = String(r.email ?? '').toLowerCase()
    const byEmail = e ? pool.staff.find(s => String(s.email ?? '').toLowerCase() === e) : undefined
    const hits = byEmail ? [byEmail] : byName(pool.staff, r.name)
    if (hits.length > 1) { leave('coaches', r, 'review', 'More than one coach with this name — add their email'); continue }
    put('coaches', r, hits[0] ?? null, byEmail ? 'email' : 'name', {}, pool.staff, [])
  }

  for (const r of records.families) {
    const m = familyMatch(r.email, r.phone, r.guardian_name)
    put('families', r, m?.row ?? null, m?.how ?? '', {}, pool.families, [])
  }

  for (const r of records.volunteers) {
    const hits = byName(pool.volunteers, r.name)
    if (hits.length > 1) { leave('volunteers', r, 'review', 'More than one volunteer with this name — not imported'); continue }
    const notes: string[] = []
    const links = { venue_id: venueFor(r.venue_name, notes), family_id: familyMatch(r.email, r.phone, r.name)?.row.id ?? null }
    put('volunteers', r, hits[0] ?? null, 'name', links, pool.volunteers, notes)
  }

  // Children, and the pack columns on their rows.
  const packKey = 'pack', packLabel = 'Welcome pack records'
  for (const r of records.children) {
    const notes: string[] = []
    const sid = r.school_name ? schoolFor(r.school_name, notes) : null
    let pid: string | null = null
    if (sid && r.programme_term) {
      pid = pool.programmes.find(p => p.school_id === sid && fold(p.term_label) === fold(r.programme_term))?.id ?? null
      if (!pid) notes.push(`No ${r.programme_term} programme at that school — saved without a programme`)
    }
    const fam = familyMatch(r.guardian_email, r.guardian_phone, r.guardian_name ?? `Parent/carer of ${r.name}`)
    if (!fam && (r.guardian_name || r.guardian_email || r.guardian_phone)) notes.push('Guardian not found — saved without a family')
    const fid = fam?.row.id ?? null
    const named = byName(pool.children, r.name)
    const dob = date(r.date_of_birth)
    const exact = dob ? named.filter(k => k.date_of_birth === dob) : []
    const loose = named.filter(k => !k.date_of_birth || !dob)
    let match: Row | null = null, how = ''
    if (exact.length === 1) { match = exact[0]; how = 'name and date of birth' }
    else if (exact.length > 1) { leave('children', r, 'review', 'More than one child with this name and date of birth in Lumio — not imported'); continue }
    else if (loose.length) {
      const agree = loose.filter(k => (sid && k.school_id === sid) || (fid && k.family_id === fid))
      if (agree.length === 1) { match = agree[0]; how = sid && agree[0].school_id === sid ? 'name and school' : 'name and family' }
      else { leave('children', r, 'review', 'A child with this name is already in Lumio, with no date of birth to tell whether it’s the same child — not imported', 'Possible match'); continue }
    }
    const childId = put('children', r, match, how, { school_id: sid, programme_id: pid, family_id: fid }, pool.children, notes)

    if (!(r.pack_size || r.pack_issued || r.paid_item_date || r.paid_item_amount)) continue
    const pack = readPackColumns(r, existing.packItems)
    const who = String(r.name)
    for (const why of pack.issues) record(packKey, packLabel, { label: who, action: 'skipped', notes: [why], writes: false })
    if (pack.sizeItem && pack.size) {
      const k = `${childId}|${pack.sizeItem.id}`, had = pool.sizes.get(k)
      if (had === undefined) { ops.push({ kind: 'insert', table: 'tp_pack_sizes', row: { hq_id: ctx.hqId, child_id: childId, item_id: pack.sizeItem.id, size: pack.size } }); record(packKey, packLabel, { label: `${who} · ${pack.sizeItem.name} size ${pack.size}`, action: 'new', writes: true }) }
      else if (had !== pack.size) { ops.push({ kind: 'size', childId, itemId: pack.sizeItem.id, size: pack.size }); record(packKey, packLabel, { label: `${who} · ${pack.sizeItem.name} size ${pack.size}`, action: 'updated', match: 'Matches an existing record', changes: ['size'], writes: true }) }
      pool.sizes.set(k, pack.size)
    }
    if (pack.issuedItems.length && pack.issuedOn) {
      if (pack.issuedOn > ctx.today) record(packKey, packLabel, { label: who, action: 'skipped', notes: [`Pack issued date ${pack.issuedOn} is in the future — not recorded`], writes: false })
      else for (const item of pack.issuedItems) {
        const k = `${childId}|${item.id}`
        if (pool.issues.has(k)) { record(packKey, packLabel, { label: `${who} · ${item.name} issued`, action: 'skipped', match: 'Matches an existing record', notes: ['Already recorded as issued'], writes: false }); continue }
        pool.issues.add(k)
        ops.push({ kind: 'issue', childId, itemId: item.id, size: item.id === pack.sizeItem?.id ? pack.size : null, issuedAt: pack.issuedOn })
        record(packKey, packLabel, { label: `${who} · ${item.name} issued ${pack.issuedOn}`, action: 'new', writes: true })
      }
    }
    if (pack.paidItem && pack.paidPence && pack.paidOn) {
      const k = `${childId}|${pack.paidItem.id}`
      if (pool.paid.has(k)) record(packKey, packLabel, { label: `${who} · ${pack.paidItem.name} paid`, action: 'skipped', match: 'Matches an existing record', notes: ['A payment is already recorded'], writes: false })
      else {
        pool.paid.add(k)
        ops.push({ kind: 'insert', table: 'tp_pack_payments', row: { id: ctx.newId(), hq_id: ctx.hqId, child_id: childId, item_id: pack.paidItem.id, amount_pence: pack.paidPence, paid_at: pack.paidOn, method: 'other', reference: 'Imported', recorded_by: ctx.userId } })
        record(packKey, packLabel, { label: `${who} · ${pack.paidItem.name} paid £${(pack.paidPence / 100).toFixed(2)}`, action: 'new', writes: true })
      }
    }
  }

  // Fundraising: events and donations belong to the org's campaign, made if there is none.
  let campaignId = existing.campaignId
  const campaign = (totalPence: number) => {
    if (campaignId) return campaignId
    campaignId = ctx.newId()
    ops.push({ kind: 'insert', table: 'tp_fundraising_campaigns', row: { id: campaignId, hq_id: ctx.hqId, school_id: null, target_pence: Math.max(totalPence, 100), status: 'live', receiving_entity: 'tbc' } })
    record('campaign', 'Fundraising campaign', { label: 'Your organisation’s fundraising campaign (there wasn’t one yet)', action: 'new', writes: true })
    return campaignId
  }
  if (records.events.length) {
    const cid = campaign(records.events.reduce((n, r) => n + (pence(r.target) ?? 0), 0))
    for (const r of records.events) {
      const hits = byName(pool.events, r.name)
      if (hits.length > 1) { leave('events', r, 'review', 'More than one event with this name — not imported'); continue }
      put('events', r, hits[0] ?? null, 'name', hits[0] ? {} : { campaign_id: cid }, pool.events, [])
    }
  }
  const donationKeys = new Set(existing.donations.map(d => `${fold(d.donor_name)}|${d.amount_pence}|${d.donated_on ?? ''}`))
  const withAmount = records.donations.filter(r => typeof r.amount === 'number' && r.amount > 0)
  for (const r of records.donations) if (!withAmount.includes(r)) leave('donations', r, 'skipped', 'No amount that can be read — not saved')
  if (withAmount.length) {
    const cid = campaign(withAmount.reduce((n, r) => n + (pence(r.amount) ?? 0), 0))
    for (const r of withAmount) {
      const p = pence(r.amount)!, key = `${fold(r.donor_name)}|${p}|${date(r.donated_on) ?? ''}`
      if (donationKeys.has(key)) { leave('donations', r, 'skipped', 'Already recorded (same donor, amount and date)', 'Matches an existing record'); continue }
      donationKeys.add(key)
      const ev = r.purpose ? pool.events.find(e => fold(e.name) === fold(r.purpose) || fold(String(e.event_type ?? '').replace(/_/g, ' ')) === fold(r.purpose)) : undefined
      ops.push({ kind: 'insert', table: 'tp_donations', row: { id: ctx.newId(), hq_id: ctx.hqId, campaign_id: cid, event_id: ev?.id ?? null, amount_pence: p,
        method: str(r.method) ?? (/cash/i.test(String(r.donor_name ?? '')) ? 'cash' : 'bank'), gift_aid: bool(r.gift_aid) ?? false,
        donor_name: str(r.donor_name, 200), donated_on: date(r.donated_on), purpose: str(r.purpose, 200), message: str(r.notes, 1000) } })
      catRow('donations', { label: recordLabel('donations', r), action: flagsOf(r).length ? 'review' : 'new', notes: flagsOf(r), writes: true })
    }
  }

  // Registers: a session per date (and programme or venue), then one entry per child.
  for (const r of records.registers) {
    const sessionDate = date(r.session_date)
    if (!sessionDate) { leave('registers', r, 'skipped', 'No session date — not saved'); continue }
    let kids = byName(pool.children, r.child_name)
    const dob = date(r.child_date_of_birth)
    if (dob) kids = kids.filter(k => k.date_of_birth === dob)
    if (kids.length !== 1) { leave('registers', r, 'skipped', kids.length ? `More than one child called “${r.child_name}” — add the child’s date of birth` : `No child called “${r.child_name}” — not saved`); continue }
    const child = kids[0]
    const notes: string[] = []
    const kind = str(r.kind) ?? (r.venue_name ? 'weekend' : 'school')
    const venueId = venueFor(r.venue_name, notes)
    const progId = kind === 'school' ? ((child.programme_id as string | null) ?? null) : null
    let s = pool.sessions.find(x => x.kind === kind && x.session_date === sessionDate && (x.programme_id ?? null) === progId && (x.venue_id ?? null) === venueId)
    if (!s) {
      s = { id: ctx.newId(), hq_id: ctx.hqId, kind, session_date: sessionDate, programme_id: progId, venue_id: venueId, week_number: num(r.week_number) }
      ops.push({ kind: 'insert', table: 'tp_sessions', row: s })
      pool.sessions.push(s)
      record('sessions', 'Sessions (from the registers)', { label: `${kind === 'weekend' ? 'Weekend' : 'School'} session · ${sessionDate}`, action: 'new', writes: true })
    }
    const k = `${s.id}|${child.id}`
    if (pool.attendance.has(k)) { leave('registers', r, 'skipped', 'Already on that session’s register — left as it is', 'Matches an existing record'); continue }
    pool.attendance.add(k)
    ops.push({ kind: 'insert', table: 'tp_attendance', row: { id: ctx.newId(), hq_id: ctx.hqId, session_id: s.id, child_id: child.id, present: bool(r.present) ?? true, via: 'import' } })
    catRow('registers', { label: recordLabel('registers', r), action: flagsOf(r).length ? 'review' : 'new', notes: [...flagsOf(r), ...notes], writes: true })
  }

  const responseKeys = new Set(existing.responses.map(x => `${x.child_id ?? ''}|${fold(x.comment)}`))
  for (const r of records.responses) {
    const kids = r.child_name ? byName(pool.children, r.child_name) : []
    const child = kids.length === 1 ? kids[0] : null
    const notes = r.child_name && !child ? [`No single child called “${r.child_name}” — saved without a child`] : []
    const comment = [str(r.comment, 2000), str(r.notes, 1000)].filter(Boolean).join(' · ') || null
    const key = `${child?.id ?? ''}|${fold(comment)}`
    if (comment && responseKeys.has(key)) { leave('responses', r, 'skipped', 'The same response is already recorded', 'Matches an existing record'); continue }
    responseKeys.add(key)
    ops.push({ kind: 'insert', table: 'tp_impact_responses', row: { id: ctx.newId(), hq_id: ctx.hqId, respondent: str(r.respondent) ?? 'parent', child_id: child?.id ?? null,
      school_id: (child?.school_id as string | null) ?? null, family_id: (child?.family_id as string | null) ?? familyMatch(null, null, r.respondent_name)?.row.id ?? null,
      areas_helped: list(r.areas_helped) ?? [], would_recommend: bool(r.would_recommend), satisfaction: num(r.satisfaction), comment, consent_publish: bool(r.consent_publish) ?? false } })
    catRow('responses', { label: recordLabel('responses', r), action: flagsOf(r).length ? 'review' : 'new', notes: [...flagsOf(r), ...notes], writes: true })
  }

  const cpdKeys = new Set(existing.cpd.map(x => `${x.school_id}|${fold(x.staff_name)}|${fold(x.course)}|${x.cpd_date ?? ''}`))
  for (const r of records.cpd) {
    const notes: string[] = []
    const sid = schoolFor(r.school_name, notes)
    if (!sid) { leave('cpd', r, 'skipped', notes[0] ?? 'No school given — not saved'); continue }
    const key = `${sid}|${fold(r.staff_name)}|${fold(r.course)}|${date(r.date) ?? ''}`
    if (cpdKeys.has(key)) { leave('cpd', r, 'skipped', 'Already recorded', 'Matches an existing record'); continue }
    cpdKeys.add(key)
    ops.push({ kind: 'insert', table: 'tp_cpd', row: { id: ctx.newId(), hq_id: ctx.hqId, school_id: sid, staff_name: str(r.staff_name, 200), course: str(r.course, 300), cpd_date: date(r.date), provider: str(r.provider, 200), notes: str(r.notes, 4000) } })
    catRow('cpd', { label: recordLabel('cpd', r), action: flagsOf(r).length ? 'review' : 'new', notes: flagsOf(r), writes: true })
  }

  const order = [...IMPACT_SAVE_ORDER.flatMap(c => (c === 'children' ? ['children', 'pack'] : c === 'events' ? ['campaign', 'events'] : c === 'registers' ? ['sessions', 'registers'] : [c]))]
  return {
    tables: order.map(k => tables.get(k)).filter((t): t is PlanTable => !!t),
    ops, writes, records: IMPACT_SAVE_ORDER.reduce((n, c) => n + records[c].length, 0),
  }
}

/** A short summary of a plan, stored with the import and shown in the history. */
export function planCounts(plan: ImportPlan): Record<string, Record<Action, number> & { label: string }> {
  return Object.fromEntries(plan.tables.map(t => [t.key, { label: t.label, ...t.counts }]))
}
