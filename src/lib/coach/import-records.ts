// ─────────────────────────────────────────────────────────────────────────────
// Tennis Coach's import schema — the shape of an imported record, and the
// tennis-specific rules for how a raw spreadsheet value becomes one. The
// generic machinery (cleaning, row-mapping, de-duplication) lives in the
// product-agnostic engine, src/lib/import-engine/records.ts; this file only
// describes Coach's own record types and keeps Coach's existing exports.
//
// Shared by the browser (which turns every row of a mapped tab into records
// itself, so a 5,000-row workbook never has to be retyped by the AI) and the
// save route (which checks every record again before it touches the database).
//
// The database is strict — age and quantity are integers, dates are dates —
// and one "U10" in an integer column used to fail the whole batch. A value that
// will not fit its column is not thrown away: it moves into the notes, so the
// coach still sees it and nothing they typed is lost.
// ─────────────────────────────────────────────────────────────────────────────

import {
  cleanRecord as engineClean, applyPlan as engineApply, dedupeRecords as engineDedupe,
  convertRecord as engineConvert, whyNotRecord as engineWhyNot,
  toIsoDate, toNumber, tidyPersonName, foldText, personKey,
  type ImportSchema, type SheetPlan as EngineSheetPlan,
} from '@/lib/import-engine/records'

export { toIsoDate, toNumber, tidyPersonName, foldText, personKey }

export type ImportCategory = 'players' | 'staff' | 'courts' | 'camps' | 'equipment' | 'payments' | 'resources'

export const IMPORT_FIELDS: Record<ImportCategory, string[]> = {
  players: ['name', 'category', 'age', 'parent_name', 'racket_stage', 'goal', 'level', 'email', 'phone', 'notes'],
  staff: ['name', 'role', 'email', 'phone', 'qualifications', 'notes'],
  courts: ['name', 'surface', 'location', 'hours', 'status', 'notes'],
  camps: ['name', 'start_date', 'end_date', 'capacity', 'price', 'location', 'notes'],
  equipment: ['item', 'category', 'quantity', 'status', 'notes'],
  payments: ['player_name', 'item', 'amount', 'status', 'due_date', 'notes'],
  resources: ['title', 'type', 'url', 'category', 'notes'],
}

/** The field a record cannot exist without — a player with no name is a blank row. */
export const LABEL_FIELD: Record<ImportCategory, string> = {
  players: 'name', staff: 'name', courts: 'name', camps: 'name', equipment: 'item', payments: 'player_name', resources: 'title',
}

export const IMPORT_CATEGORIES = Object.keys(IMPORT_FIELDS) as ImportCategory[]

const INT = new Set(['players.age', 'camps.capacity', 'equipment.quantity'])
const NUM = new Set(['camps.price', 'payments.amount'])
const DATE = new Set(['camps.start_date', 'camps.end_date', 'payments.due_date'])

export const ENUMS: Record<string, string[]> = {
  'players.category': ['Junior', 'Performance', 'Adult'],
  'players.racket_stage': ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black'],
  'payments.status': ['paid', 'due', 'overdue'],
  'equipment.status': ['in_stock', 'low', 'order'],
  'courts.status': ['available', 'maintenance', 'booked'],
}

// Common ways people write the enumerated values, so a sheet that says
// "Outstanding" or "In stock" lands without needing the AI to spell it out.
const SYNONYMS: Record<string, Record<string, string>> = {
  'payments.status': { paid: 'paid', yes: 'paid', 'paid in full': 'paid', received: 'paid', complete: 'paid', completed: 'paid', settled: 'paid', due: 'due', unpaid: 'due', outstanding: 'due', owed: 'due', owing: 'due', pending: 'due', invoiced: 'due', no: 'due', overdue: 'overdue', late: 'overdue', 'past due': 'overdue', arrears: 'overdue' },
  'equipment.status': { 'in stock': 'in_stock', in_stock: 'in_stock', instock: 'in_stock', ok: 'in_stock', good: 'in_stock', available: 'in_stock', yes: 'in_stock', low: 'low', 'low stock': 'low', 'running low': 'low', order: 'order', 'to order': 'order', reorder: 'order', 're-order': 'order', 'out of stock': 'order', none: 'order', needed: 'order' },
  'courts.status': { available: 'available', open: 'available', ok: 'available', 'in use': 'booked', booked: 'booked', maintenance: 'maintenance', closed: 'maintenance', repair: 'maintenance', 'under repair': 'maintenance' },
  'players.category': { junior: 'Junior', juniors: 'Junior', child: 'Junior', kids: 'Junior', youth: 'Junior', performance: 'Performance', perf: 'Performance', squad: 'Performance', elite: 'Performance', adult: 'Adult', adults: 'Adult', senior: 'Adult', seniors: 'Adult' },
}

/** "12", "12 yrs", "U12" → 12. An age is a whole number between 2 and 99. */
function toAge(v: unknown): number | null {
  const direct = toNumber(v)
  if (direct !== null) return direct >= 2 && direct < 100 ? Math.round(direct) : null
  const m = String(v ?? '').match(/^\s*(?:u|under\s*)?(\d{1,2})\s*(?:y|yr|yrs|years?)?(?:\s*old)?\s*$/i)
  return m ? +m[1] : null
}

// Coach's own enum readings — a status cell is rarely the bare word.
function enumFallback(key: string, s: string): string | null {
  const allowed = ENUMS[key] ?? []
  if (key === 'payments.status') {
    // "Paid ✓", "PAID in full", "Owes £40" — a status cell is rarely the bare
    // word. "Part paid" and "Refunded" are left for the notes: neither is
    // simply paid or simply owed, and the coach should see the original.
    if (/overdue|arrears|past due|\blate\b/i.test(s)) return 'overdue'
    if (/part|refund|cancel|void|written off/i.test(s)) return null
    if (saysPaid(s)) return 'paid'
    if (/owe|owing|unpaid|outstanding|pending|invoiced|\bdue\b/i.test(s)) return 'due'
  }
  if (key === 'players.racket_stage') {
    // "Orange racket", "Stage 3 – Orange", "orange ball"
    const found = allowed.find(a => new RegExp(`\\b${a}\\b`, 'i').test(s))
    if (found) return found
  }
  return null
}

/**
 * Is this plausibly a person? A totals line ("TOTAL BOOKED: 37 / 48"), a group
 * on a timetable ("Orange Squad – Priya (Ct 3)", "COURTS CLOSED") and a section
 * heading ("▼ RED STAGE") all land in a name column sooner or later. None of
 * them is a player, and a roster with "Average age" on it is worse than one
 * that is a row short.
 */
export function isPersonName(name: string): boolean {
  const s = name.trim()
  if (s.length < 2 || s.length > 60 || s.split(' ').length > 5) return false
  // A bracketed aside is fine on a real name — "Sam Lee (U12)", "Alison Hannah (Taylor)".
  const bare = s.replace(/\([^)]*\)/g, ' ')
  if (/\d|[:/@▼►■•]| [–—-] /.test(bare)) return false
  if (/\b(total|totals|average|avg|booked|squad|group|sessions?|tennis|cardio|closed|maintenance|improvers|beginners|lessons?|timetable|various|tbc|tba|register|n\/a|unknown)\b/i.test(s)) return false
  return /\p{L}{2}/u.test(s)
}

/**
 * Are these two the same person? The same name, and nothing that says
 * otherwise: where both have an email they must share one, and where neither
 * comparison can be made on email, ages more than a year apart mean two people.
 * Two children called Amy Clark with different parents are two players; Amy
 * Clark on a camp sheet with only her name is the Amy Clark on the roster.
 *
 * Shared by the tidy-up of what a file holds and by the save, which checks
 * every record against what the academy already has.
 */
export function samePerson(
  a: { name?: unknown; age?: unknown; email?: unknown; parent_email?: unknown; contact_email?: unknown },
  b: { name?: unknown; age?: unknown; email?: unknown; parent_email?: unknown; contact_email?: unknown },
): boolean {
  const key = personKey
  if (!key(a.name) || key(a.name) !== key(b.name)) return false
  const emails = (p: typeof a) => [p.email, p.parent_email, p.contact_email].map(e => String(e ?? '').trim().toLowerCase()).filter(Boolean)
  const ea = emails(a), eb = emails(b)
  if (ea.length && eb.length) return ea.some(e => eb.includes(e))
  const has = (v: unknown) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))
  if (has(a.age) && has(b.age)) return Math.abs(Number(a.age) - Number(b.age)) <= 1
  return true
}

const LABELS: Record<string, string> = {
  age: 'Age', category: 'Category', racket_stage: 'Racket stage', status: 'Status', capacity: 'Capacity', price: 'Price',
  amount: 'Amount', quantity: 'Quantity', start_date: 'Start', end_date: 'End', due_date: 'Due',
}

// ── Tidying what was found ───────────────────────────────────────────────────

const CAMP_MONTH: Record<string, string> = { jan: 'january', feb: 'february', mar: 'march', apr: 'april', jun: 'june', jul: 'july', aug: 'august', sep: 'september', sept: 'september', oct: 'october', nov: 'november', dec: 'december', xmas: 'christmas' }
const campWords = (name: unknown) => new Set(String(name ?? '').trim().toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\bht\b/g, 'half term').split(' ')
  .filter(w => w && !/^(the|a|of|and|camp|camps|tennis|to|mon|tue|wed|thu|fri|sat|sun|\d{4})$/.test(w)).map(w => CAMP_MONTH[w] || w))

/**
 * Are these the same camp? The same name; or the same start date with names
 * that overlap; or — when one has no date — one name wholly inside the other.
 * Shared by the importer's de-duplication and by the step that puts attendees
 * onto a camp, so both agree on which camp a tab is about.
 */
export function campsMatch(a: { name?: unknown; start_date?: unknown }, b: { name?: unknown; start_date?: unknown }): boolean {
  const na = String(a.name ?? '').trim().toLowerCase().replace(/\s+/g, ' '), nb = String(b.name ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (na && na === nb) return true
  const wa = campWords(a.name), wb = campWords(b.name)
  const shared = [...wa].filter(w => wb.has(w)).length
  const inside = shared >= 2 && (shared === wa.size || shared === wb.size)
  const sameStart = !!a.start_date && String(a.start_date) === String(b.start_date)
  const oneUndated = !a.start_date || !b.start_date
  return (sameStart && shared >= 2) || (oneUndated && inside)
}

/**
 * Is this camp already in the academy? campsMatch, except that two camps which
 * both have a start date must start on the same day: "Summer Camp" in 2025 and
 * "Summer Camp" in 2026 are two camps, and the second must still be imported.
 */
export function sameCamp(a: { name?: unknown; start_date?: unknown }, b: { name?: unknown; start_date?: unknown }): boolean {
  if (a.start_date && b.start_date && String(a.start_date).slice(0, 10) !== String(b.start_date).slice(0, 10)) return false
  return campsMatch(a, b)
}

/** "✓", "Paid", "Yes", "PAID" → true; "Owes", "part (£75)", "BACS pending", "" → false. */
export function saysPaid(v: unknown): boolean {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s || /owe|part|pending|unpaid|due|no\b|chase|deposit only|✗|x$/.test(s)) return false
  return /✓|✔|paid|yes|^y$|received|settled|full/.test(s)
}

// ── The schema ───────────────────────────────────────────────────────────────
export const COACH_IMPORT_SCHEMA: ImportSchema<ImportCategory> = {
  categories: IMPORT_CATEGORIES,
  fields: IMPORT_FIELDS,
  labelField: LABEL_FIELD,
  intFields: INT,
  numFields: NUM,
  dateFields: DATE,
  enums: ENUMS,
  synonyms: SYNONYMS,
  fieldLabels: LABELS,
  personCategories: ['players', 'staff'],
  isPersonName,
  headingExact: /^(total|totals|sub-?total|grand total|name|player|player name|item|title|court|camp|traveller|child)$/i,
  headingPrefix: /^(total|totals|sub-?total|grand total|average|avg)\b/i,
  headingWhy: /^(total|totals|sub-?total|grand total|average|avg|name|player|player name|item|title|court|camp|traveller|child)\b/i,
  parseField: (category, field, v) => {
    if (field !== 'age' || category !== 'players') return undefined
    const n = toAge(v)
    return n !== null ? { value: n } : { spill: true }
  },
  enumFallback,
  afterClean: (category, out) => {
    if (category === 'players' && !out.category && typeof out.age === 'number') out.category = out.age < 18 ? 'Junior' : 'Adult'
  },
  whyNot: (category, label) => {
    if ((category === 'players' || category === 'staff') && !isPersonName(tidyPersonName(label))) {
      return `“${label.slice(0, 60)}” does not look like a person’s name (a name cannot have numbers, slashes or symbols in it)`
    }
    return null
  },
  // Which venue a court is at is, in a block layout, only ever said by the banner.
  sectionField: { courts: 'location' },
  // Not a column of any table — carried alongside so an attendee list knows
  // who has paid. The save route only writes known columns, so it never lands.
  rowExtras: (plan, row, clean) => {
    const paid = (plan as SheetPlan).paid_column
    if (typeof paid === 'number') clean._paid = saysPaid(row[paid])
  },
  dedupeKey: (category, r, norm) => {
    // Payments and kit: only an identical line is a duplicate. Two £30 lessons
    // for one child are two payments; "Junior rackets" in 23", 25" and 26" are
    // three lines of stock.
    if (category === 'payments' || category === 'equipment') return JSON.stringify(IMPORT_FIELDS[category].map(f => norm(r[f])))
    // "Court 1" exists at every venue.
    if (category === 'courts') return `${norm(r[LABEL_FIELD[category]])}|${norm(r.location)}`
    return undefined
  },
  // One name, two families: two players (samePerson). One name, two sets of
  // dates: two camps (sameCamp).
  sameThing: category => category === 'players' ? samePerson : category === 'camps' ? sameCamp : undefined,
  afterDedupe: (category, byKey, merge) => {
    // Staff written by first name only on another tab ("Jess" on the timetable)
    // are the same person as the one full name that starts with it.
    if (category === 'staff') {
      for (const [key, rec] of [...byKey]) {
        if (key.includes(' ')) continue
        const full = [...byKey.keys()].filter(k => k.startsWith(key + ' '))
        if (full.length === 1) { merge(byKey.get(full[0])!, { ...rec, name: undefined }); byKey.delete(key) }
      }
    }
    // A camp named slightly differently on its own tab ("OCTOBER HALF-TERM CAMP —
    // Mon 26 to Fri 30 October 2026") is the camp on the planner. Same start
    // date and overlapping names, or — when one has no date — one name wholly
    // inside the other. Two weeks of the same summer camp have different dates
    // and different week numbers, so they stay two camps.
    if (category === 'camps') {
      const entries = [...byKey]
      for (let i = 0; i < entries.length; i++) {
        const [ka, a] = entries[i]
        if (!byKey.has(ka)) continue
        for (let j = i + 1; j < entries.length; j++) {
          const [kb, b] = entries[j]
          if (!byKey.has(kb)) continue
          if (sameCamp(a, b)) { merge(a, { ...b, name: undefined }); byKey.delete(kb) }
        }
      }
    }
  },
}

// ── Coach's existing API, now backed by the engine ──────────────────────────
export type SheetPlan = EngineSheetPlan<ImportCategory> & {
  /** A record for the tab as a whole: a tab per camp holds its attendees in the
   *  rows and the camp itself in the tab name and title lines. */
  tab_record?: { category: ImportCategory } & Record<string, unknown>
  /** On a camp's attendee tab: the column saying whether each child has paid for the camp. */
  paid_column?: number
}

/** Why a row with something in its name column was left out (null = say nothing). */
export function whyNotRecord(category: ImportCategory, raw: Record<string, unknown>): string | null {
  return engineWhyNot(COACH_IMPORT_SCHEMA, category, raw)
}
/** One record, made safe for its table (see the engine). */
export function cleanRecord(category: ImportCategory, raw: Record<string, unknown>): Record<string, unknown> | null {
  return engineClean(COACH_IMPORT_SCHEMA, category, raw)
}
/** Every row of a mapped tab as records. */
export function applyPlan(plan: SheetPlan, rows: string[][], banners: number[] = [], skipped?: string[]): Record<string, unknown>[] {
  return engineApply(COACH_IMPORT_SCHEMA, plan, rows, banners, skipped)
}
/** One record per real thing. */
export function dedupeRecords(category: ImportCategory, recs: Record<string, unknown>[]): Record<string, unknown>[] {
  return engineDedupe(COACH_IMPORT_SCHEMA, category, recs)
}
/** Move a record to another category when the coach says "no, these are camps". */
export function convertRecord(from: ImportCategory, to: ImportCategory, rec: Record<string, unknown>): Record<string, unknown> | null {
  return engineConvert(COACH_IMPORT_SCHEMA, from, to, rec)
}

export const CATEGORY_LABEL: Record<ImportCategory, string> = {
  players: 'Players', staff: 'Coaches & staff', courts: 'Courts & venues', camps: 'Training camps',
  equipment: 'Equipment', payments: 'Payments', resources: 'Resources',
}
