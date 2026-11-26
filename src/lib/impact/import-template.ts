// ─── LUMIO IMPACT — IMPORT TEMPLATE (no-AI fast path) ───────────────────────
// A downloadable workbook with one tab per record type and fixed headings,
// built from the import schema itself so it can never drift from what the
// importer accepts. When an uploaded tab's headings all match a template tab,
// it is mapped deterministically — no AI call, no AI cost. Only files that
// aren't template-shaped go to the AI.
//
// Every tab has, under its headings, a Notes row (what each column is) and one
// example row. Both are ignored on import while they are left exactly as the
// template wrote them, so a file sent back untouched imports nothing.

import type { SheetData } from '@/lib/import-engine/read-workbook'
import type { SheetPlan } from '@/lib/import-engine/records'
import { IMPACT_FIELD_SPELLINGS, IMPACT_IMPORT_FIELDS, IMPACT_SAVE_ORDER, IMPACT_CATEGORY_LABEL, IMPACT_ENUMS, type ImpactImportCategory } from './import-schema'

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
const cell = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim()

/** "date_of_birth" → "Date of birth" — the template's heading for a field. */
export const headingFor = (field: string) => field === 'fsm' ? 'FSM' : field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')

type TemplateCategory = Exclude<ImpactImportCategory, 'contacts'>
/** The template's tabs, in order: the saved categories, with Community after Children. */
export const TEMPLATE_SHEETS: TemplateCategory[] = IMPACT_SAVE_ORDER.flatMap(c => (c === 'children' ? ['children', 'community'] as const : [c]))

const YESNO = new Set(['inclusive', 'inducted', 'consent_data', 'consent_photo', 'unsubscribed', 'photo_consent', 'send', 'fsm', 'pupil_premium', 'present', 'gift_aid', 'would_recommend', 'consent_publish'])
const isDate = (f: string) => /date|_on$|expiry|since|pack_issued|first_visit/.test(f)

// What a column is, where the heading alone doesn't say. Allowed values and date/Yes-No
// formats are added from the schema.
const SAY: Record<string, string> = {
  name: 'Full name', guardian_name: 'Parent or carer’s full name', guardian2_name: 'Second parent or carer',
  email: 'Matched to people already in Lumio by email', guardian_email: 'Parent or carer’s email — matches the family',
  phone: 'UK phone, any format', guardian_phone: 'Parent or carer’s phone', contact_phone: 'UK phone, any format',
  school_name: 'Exactly as on the Schools tab', venue_name: 'Exactly as on the Venues tab', child_name: 'Child’s full name',
  postcode: 'Schools are matched on name and postcode', term_label: 'e.g. Autumn 2026', programme_term: 'The programme’s term, as on the Programmes tab',
  year_groups: 'e.g. Y3–Y4', cost: 'Pounds, e.g. 1200', fee_amount: 'Pounds', target: 'Pounds', amount: 'Pounds, e.g. 25',
  current_week: '0–10', week_number: '1–10', satisfaction: '1–5', specialisms: 'Separate with ;', areas_helped: 'Separate with ;',
  medical_notes: 'Allergies, conditions, SEND notes', notes: 'Anything else', pack_size: 'One of your pack’s sizes',
  paid_item_amount: 'Pounds', first_visit: 'Date of their first weekend session — recorded as attended',
  consent_data: 'Agreed to their data being held', child_date_of_birth: 'Only needed when two children share a name',
  tags: 'parent / volunteer / coach', kind: 'school or weekend',
  weekend_venue: 'The weekend venue they come to, exactly as on the Venues tab',
}

export function columnNote(c: TemplateCategory, f: string): string {
  const allowed = IMPACT_ENUMS[`${c}.${f}`]
  const parts = [SAY[f]]
  if (allowed) parts.push(allowed.join(' / '))
  else if (YESNO.has(f)) parts.push('Yes / No — blank means not recorded')
  else if (isDate(f)) parts.push('YYYY-MM-DD or DD/MM/YYYY')
  if (c === 'children' && f === 'name') parts.push('one row per child')
  if (c === 'community' && f === 'child_name') parts.push('one row per child; no school needed')
  return `Notes: ${parts.filter(Boolean).join(' — ') || headingFor(f)}`
}

// One fictional example row per tab (left as is, it is not imported).
const EXAMPLE: Record<TemplateCategory, Record<string, string>> = {
  schools: { name: 'Example Primary', borough: 'Northvale', address: '1 School Lane', postcode: 'EX1 1AA', head_name: 'Mrs A. Example', contact_email: 'office@example.sch.uk', contact_phone: '01632 960000', status: 'running' },
  programmes: { school_name: 'Example Primary', term_label: 'Autumn 2026', start_date: '2026-09-14', end_date: '2026-12-11', year_groups: 'Y3–Y4', current_week: '0', status: 'planned' },
  venues: { name: 'Example Rec Ground', address: 'Park Road', postcode: 'EX1 2BB', courts: '4', session_day: 'Saturday', session_time: '10:00', inclusive: 'Yes' },
  coaches: { name: 'Alex Example', role: 'coach', email: 'alex@example.org', phone: '07700 900000', dbs_status: 'valid', dbs_expiry: '2027-06-30' },
  volunteers: { name: 'Sam Example', email: 'sam@example.org', phone: '07700 900001', venue_name: 'Example Rec Ground', inducted: 'Yes' },
  families: { guardian_name: 'Jo Example', email: 'jo@example.com', phone: '07700 900002', consent_data: 'Yes', consent_photo: 'No' },
  children: { name: 'Amy Example', date_of_birth: '2018-03-12', year_group: 'Y3', school_name: 'Example Primary', programme_term: 'Autumn 2026', guardian_name: 'Jo Example', guardian_email: 'jo@example.com', photo_consent: 'No' },
  community: { guardian_name: 'Chris Example', email: 'chris@example.com', phone: '07700 900003', child_name: 'Ben Example', date_of_birth: '2017-05-02', venue_name: 'Example Rec Ground', first_visit: '2026-10-03', consent_data: 'Yes', consent_photo: 'No' },
  events: { name: 'Example Cake Sale', event_type: 'cake_sale', event_date: '2026-11-20', target: '300', status: 'planned' },
  donations: { donor_name: 'A. Example', amount: '25', donated_on: '2026-10-05', purpose: 'Example Cake Sale', gift_aid: 'Yes', method: 'cash' },
  registers: { child_name: 'Amy Example', session_date: '2026-09-15', present: 'Yes', kind: 'school', school_name: 'Example Primary', week_number: '1' },
  responses: { respondent_name: 'Jo Example', child_name: 'Amy Example', respondent: 'parent', would_recommend: 'Yes', satisfaction: '5', comment: 'Example comment', consent_publish: 'No' },
  cpd: { school_name: 'Example Primary', staff_name: 'Mr B. Example', course: 'Example CPD course', date: '2026-10-12', provider: 'Example provider' },
}

const sheetName = (c: TemplateCategory) => IMPACT_CATEGORY_LABEL[c].slice(0, 31)

/** The template's tabs as rows: headings, Notes, example. */
export function templateSheets(): { name: string; rows: string[][] }[] {
  return TEMPLATE_SHEETS.map(c => {
    const fields = IMPACT_IMPORT_FIELDS[c]
    return { name: sheetName(c), rows: [fields.map(headingFor), fields.map(f => columnNote(c, f)), fields.map(f => EXAMPLE[c][f] ?? '')] }
  })
}

/** A tab that is exactly a template tab → its plan; anything else → null (AI maps it). */
export function templatePlan(sheet: SheetData): SheetPlan<ImpactImportCategory> | null {
  const cat = TEMPLATE_SHEETS.find(c => norm(c) === norm(sheet.name) || norm(IMPACT_CATEGORY_LABEL[c]) === norm(sheet.name))
  if (!cat) return null
  const header = sheet.rows[0] ?? []
  const fields = IMPACT_IMPORT_FIELDS[cat]
  const columns: Record<string, number> = {}
  for (let i = 0; i < header.length; i++) {
    if (!String(header[i] ?? '').trim()) continue
    const f = fields.find(x => norm(x) === norm(header[i]) || norm(headingFor(x)) === norm(header[i]) || IMPACT_FIELD_SPELLINGS[`${cat}.${x}`]?.includes(norm(header[i])))
    if (!f) return null          // an unknown heading — not a template tab
    columns[f] = i
  }
  if (!Object.keys(columns).length) return null
  return { sheet: sheet.name, category: cat, header_row: 0, columns, confidence: 'high', reason: 'Lumio import template' }
}

/** The template's own Notes or example row, still as written (in any column order). */
export function isTemplateRow(cat: TemplateCategory, columns: Record<string, number | number[]>, row: string[]): boolean {
  const mapped = Object.entries(columns).filter((e): e is [string, number] => typeof e[1] === 'number')
  if (!mapped.length) return false
  const same = (want: (f: string) => string) => mapped.every(([f, i]) => cell(row[i]) === cell(want(f)))
  return same(f => columnNote(cat, f)) || same(f => EXAMPLE[cat][f] ?? '')
}

/** A template tab, ready to map: its plan, and its rows without the Notes and example rows. */
export function readTemplateSheet(sheet: SheetData): { plan: SheetPlan<ImpactImportCategory>; sheet: SheetData; ignored: number } | null {
  const plan = templatePlan(sheet)
  if (!plan || plan.category === 'skip' || plan.category === 'contacts') return null
  const cat = plan.category
  const keep = sheet.rows.filter((r, i) => i === 0 || !isTemplateRow(cat, plan.columns, r))
  // Banner indexes would point at the wrong rows once rows are removed; a template tab has none.
  return { plan, sheet: { name: sheet.name, rows: keep, banners: [] }, ignored: sheet.rows.length - keep.length }
}

const README: string[][] = [
  ['Lumio Impact — import template'],
  [''],
  ['1. Fill in the tabs you have data for. Leave the rest empty, or delete them.'],
  ['2. Keep the headings exactly as they are: a tab that matches this template is read directly, with no AI.'],
  ['3. Under each heading row there is a Notes row and one example row. They are ignored while left as they are — type your own rows below them, or delete them.'],
  ['4. Upload the file in Settings → Import data. You see exactly what will happen before anything is saved, and every import can be undone from the import history.'],
  [''],
  ['Matching: families by email, children by name and date of birth, schools by name and postcode. A record that is already in Lumio is updated, not added twice.'],
  ['Children: one row per child. Families are made from the guardian columns.'],
  ['Community: families who come to the weekend sessions and have no school with you — one row per child. A first visit date records that visit as attended at the venue.'],
  ['Programmes and children link to schools by the school name; registers link to children by name (add the date of birth if two children share a name).'],
  ['Gender, FSM and Pupil premium are optional. Blank means “not recorded”, never “No”.'],
  ['Pack size, Pack issued, Paid item date and Paid item amount are optional, and need your pack set up first (Settings → Welcome pack).'],
  ['Up to 5,000 rows and 10 MB per file.'],
]

/** Builds and downloads the template workbook (browser only). */
export async function downloadTemplate() {
  const mod = await import('xlsx')
  const XLSX = (mod.utils ? mod : (mod as unknown as { default: typeof mod }).default)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(README), 'Read me')
  for (const s of templateSheets()) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.rows), s.name)
  XLSX.writeFile(wb, 'lumio-impact-import-template.xlsx')
}
