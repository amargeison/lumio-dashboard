// ─────────────────────────────────────────────────────────────────────────────
// The shape of an imported record, and how a raw spreadsheet value becomes one.
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

const pad = (n: number) => String(n).padStart(2, '0')
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** A date as YYYY-MM-DD, reading it the British way (day first) when it is ambiguous. */
export function toIsoDate(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date && !isNaN(v.getTime())) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`
  const s = String(v).trim()
  // An Excel serial that arrived as a plain number (1 Jan 1955 – 2119).
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const n = Math.floor(Number(s))
    if (n > 20000 && n < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000)
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    }
  }
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return valid(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  if (m) {
    let y = +m[3]; if (y < 100) y += y < 70 ? 2000 : 1900
    // Day first unless that is impossible (13/25 can only be month/day).
    return +m[1] > 12 || +m[2] <= 12 ? valid(y, +m[2], +m[1]) : valid(y, +m[1], +m[2])
  }
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,})\.?,?\s+(\d{4})$/i)
  if (m) { const mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()); if (mo >= 0) return valid(+m[3], mo + 1, +m[1]) }
  m = s.match(/^([a-z]{3,})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i)
  if (m) { const mo = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()); if (mo >= 0) return valid(+m[3], mo + 1, +m[2]) }
  return null
}
function valid(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return dt.getUTCMonth() === mo - 1 ? `${y}-${pad(mo)}-${pad(d)}` : null
}

/** "£1,200.50", "45 GBP", "(30)" → a number. */
export function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return isFinite(v) ? v : null
  if (v === null || v === undefined) return null
  let s = String(v).trim()
  if (!s) return null
  const neg = /^\(.*\)$/.test(s) || /^-/.test(s)
  s = s.replace(/[£$€,\s()]|gbp|usd|eur/gi, '').replace(/^-/, '')
  if (!/^\d*\.?\d+$/.test(s)) return null
  const n = Number(s)
  return isFinite(n) ? (neg ? -n : n) : null
}

/** "12", "12 yrs", "U12" → 12. An age is a whole number between 2 and 99. */
function toAge(v: unknown): number | null {
  const direct = toNumber(v)
  if (direct !== null) return direct >= 2 && direct < 100 ? Math.round(direct) : null
  const m = String(v ?? '').match(/^\s*(?:u|under\s*)?(\d{1,2})\s*(?:y|yr|yrs|years?)?(?:\s*old)?\s*$/i)
  return m ? +m[1] : null
}

function toEnum(key: string, v: unknown): string | null {
  const allowed = ENUMS[key]
  const s = String(v ?? '').trim()
  if (!s) return null
  const hit = allowed.find(a => a.toLowerCase() === s.toLowerCase())
  if (hit) return hit
  const syn = SYNONYMS[key]?.[s.toLowerCase()]
  if (syn) return syn
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
 * "SMITH, Sarah" → "Sarah Smith"; "Matilda CAMPBELL" → "Matilda Campbell".
 * Registers are typed by many hands; the roster should not show three styles,
 * and the same child written two ways must still be recognised as one child.
 */
export function tidyPersonName(raw: string): string {
  let s = raw.replace(/\s+/g, ' ').trim()
  const m = s.match(/^([^,]{1,40}),\s*([^,]{1,40})$/)
  if (m && m[1].split(' ').length <= 3 && m[2].split(' ').length <= 3) s = `${m[2].trim()} ${m[1].trim()}`
  return s.split(' ').map(w => (w.length > 2 && /^[A-Z][A-Z'’-]+$/.test(w)
    ? w.toLowerCase().replace(/(^|[-'’])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase())
    : w)).join(' ')
}

/**
 * Text as it is COMPARED, never as it is saved. Differences in typing are not
 * differences in meaning: Word and Excel turn O'Neill into O’Neill (a curly
 * apostrophe), a hyphen into a long dash and a space into a no-break space, and
 * the same child then looked like a second child. Capitals, doubled spaces and
 * invisible characters are folded away too.
 */
export function foldText(v: unknown): string {
  return String(v ?? '').normalize('NFKC')
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\u02B9\u0060\u00B4\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
    .replace(/\s+/g, ' ').trim().toLowerCase()
}
/** A person's name, for telling whether two rows are the same person. */
export const personKey = (n: unknown): string => foldText(tidyPersonName(String(n ?? '')))

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

/**
 * Why a row that has something in its name column was left out — or null when
 * it is only a blank line, a repeated heading or a totals row, which nobody
 * needs telling about. A row dropped without a word looked like the importer
 * losing a child.
 */
export function whyNotRecord(category: ImportCategory, raw: Record<string, unknown>): string | null {
  const label = String(raw[LABEL_FIELD[category]] ?? '').replace(/\s+/g, ' ').trim()
  if (!label) return null
  if (/^(total|totals|sub-?total|grand total|average|avg|name|player|player name|item|title|court|camp|traveller|child)\b/i.test(label)) return null
  if ((category === 'players' || category === 'staff') && !isPersonName(tidyPersonName(label))) {
    return `“${label.slice(0, 60)}” does not look like a person’s name (a name cannot have numbers, slashes or symbols in it)`
  }
  return null
}

const LABELS: Record<string, string> = {
  age: 'Age', category: 'Category', racket_stage: 'Racket stage', status: 'Status', capacity: 'Capacity', price: 'Price',
  amount: 'Amount', quantity: 'Quantity', start_date: 'Start', end_date: 'End', due_date: 'Due',
}

/**
 * One record, made safe for its table: unknown keys dropped, text trimmed, typed
 * columns converted, and anything that will not convert kept in the notes.
 * Returns null when the record has no label (a blank or total row).
 */
export function cleanRecord(category: ImportCategory, raw: Record<string, unknown>): Record<string, unknown> | null {
  const out: Record<string, unknown> = {}
  const spill: string[] = []
  for (const f of IMPORT_FIELDS[category]) {
    const v = raw[f]
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && !v.trim()) continue
    const key = `${category}.${f}`
    if (f === 'age' && category === 'players') {
      const n = toAge(v); if (n !== null) out[f] = n; else spill.push(`${LABELS[f]}: ${v}`)
    } else if (INT.has(key)) {
      // "20 places", "12 cans" — the number is what the column wants.
      const n = toNumber(v) ?? (String(v).match(/^\s*(\d+)\b/) ? Number(String(v).match(/^\s*(\d+)\b/)![1]) : null)
      if (n !== null && n >= 0) out[f] = Math.round(n); else spill.push(`${LABELS[f] || f}: ${v}`)
    } else if (NUM.has(key)) {
      const n = toNumber(v); if (n !== null) out[f] = Math.round(n * 100) / 100; else spill.push(`${LABELS[f] || f}: ${v}`)
    } else if (DATE.has(key)) {
      const d = toIsoDate(v); if (d) out[f] = d; else spill.push(`${LABELS[f] || f}: ${v}`)
    } else if (ENUMS[key]) {
      const e = toEnum(key, v); if (e) out[f] = e; else spill.push(`${LABELS[f] || f}: ${v}`)
    } else {
      out[f] = String(v).trim().slice(0, 4000)
    }
  }
  if (category === 'players' || category === 'staff') {
    if (typeof out.name === 'string') out.name = tidyPersonName(out.name)
    if (typeof out.name !== 'string' || !isPersonName(out.name)) return null
  }
  const label = out[LABEL_FIELD[category]]
  if (!label || typeof label !== 'string' || !label.trim()) return null
  // A repeated heading row or a totals line is not a record.
  if (/^(total|totals|sub-?total|grand total|name|player|player name|item|title|court|camp|traveller|child)$/i.test(label.trim())) return null
  if (/^(total|totals|sub-?total|grand total|average|avg)\b/i.test(label.trim())) return null
  if (category === 'players' && !out.category && typeof out.age === 'number') out.category = out.age < 18 ? 'Junior' : 'Adult'
  if (spill.length) out.notes = [out.notes, spill.join(' · ')].filter(Boolean).join(' · ').slice(0, 4000)
  return out
}

// ── Applying a tab's mapping to every row ────────────────────────────────────

export type SheetPlan = {
  sheet: string
  category: ImportCategory | 'skip'
  header_row: number
  first_data_row?: number
  last_data_row?: number
  columns: Record<string, number | number[]>
  notes_columns?: number[]
  values?: Record<string, Record<string, string>>
  default?: Record<string, string>
  irregular?: boolean
  /** How sure the AI is about the category. Anything but "high" is shown to the coach to confirm. */
  confidence?: 'high' | 'medium' | 'low'
  /** One plain-English line on why — shown with the question. */
  reason?: string
  /** A record for the tab as a whole: a tab per camp holds its attendees in the
   *  rows and the camp itself in the tab name and title lines. */
  tab_record?: { category: ImportCategory } & Record<string, unknown>
  /** On a camp's attendee tab: the column saying whether each child has paid for the camp. */
  paid_column?: number
}

/** Every row of a mapped tab as records. Pure, so a 20,000-row tab costs nothing but a loop. */
export function applyPlan(plan: SheetPlan, rows: string[][], banners: number[] = [], skipped?: string[]): Record<string, unknown>[] {
  if (plan.category === 'skip' || plan.irregular) return []
  const cat = plan.category
  const allowed = new Set(IMPORT_FIELDS[cat])
  const header = plan.header_row >= 0 ? rows[plan.header_row] || [] : []
  const start = typeof plan.first_data_row === 'number' ? plan.first_data_row : plan.header_row + 1
  const end = typeof plan.last_data_row === 'number' ? Math.min(plan.last_data_row, rows.length - 1) : rows.length - 1
  const lower = (m?: Record<string, string>) => m ? Object.fromEntries(Object.entries(m).map(([k, v]) => [k.trim().toLowerCase(), v])) : undefined
  const maps: Record<string, Record<string, string> | undefined> = {}
  for (const [f, m] of Object.entries(plan.values || {})) maps[f] = lower(m)
  // Section rows. A sheet laid out in blocks — a banner per venue with its
  // courts underneath, a "▼ RED STAGE" divider between groups — has rows that
  // are headings, not records. A banner is a merged row (the reader marks
  // those) or a row whose only cell is not in the column the name comes from.
  // Each one is skipped, and remembered as the block the rows below belong to.
  const labelCol = plan.columns?.[LABEL_FIELD[cat]]
  const labelCols = new Set((Array.isArray(labelCol) ? labelCol : [labelCol]).filter((c): c is number => typeof c === 'number'))
  const merged = new Set(banners)
  const mappedCols = Object.keys(plan.columns || {}).length
  const sectionOf = (r: number): string | null => {
    const row = rows[r]; if (!row) return null
    const filled = row.map((c, i) => (c && String(c).trim() ? i : -1)).filter(i => i !== -1)
    if (filled.length !== 1) return null
    if (!merged.has(r) && (labelCols.has(filled[0]) || mappedCols < 2)) return null
    return String(row[filled[0]]).split('|')[0].replace(/^[\s▼►■•–—-]+/, '').trim().slice(0, 120) || null
  }
  let section: string | null = null
  let blocks = 0
  for (let r = Math.max(0, start); r <= end; r++) if (sectionOf(r)) blocks++
  // The banner for the FIRST block sits above the headings, so it is only a
  // section (and not the sheet's title) when there are more blocks below.
  if (blocks && plan.header_row > 0) section = sectionOf(plan.header_row - 1)
  const headLabel = [...labelCols].map(c => String(header[c] ?? '').trim().toLowerCase()).filter(Boolean)

  const out: Record<string, unknown>[] = []
  for (let r = Math.max(0, start); r <= end; r++) {
    const row = rows[r]
    if (!row || !row.some(c => c && String(c).trim())) continue
    const sec = sectionOf(r)
    if (sec) { section = sec; continue }
    // The headings again, repeated at the top of each block.
    if (headLabel.length && [...labelCols].every(c => String(row[c] ?? '').trim().toLowerCase() === String(header[c] ?? '').trim().toLowerCase())) continue
    const rec: Record<string, unknown> = {}
    for (const [field, col] of Object.entries(plan.columns || {})) {
      if (!allowed.has(field)) continue
      const cols = Array.isArray(col) ? col : [col]
      const parts = cols.map(c => (typeof c === 'number' ? row[c] : '') ?? '').map(s => String(s).trim()).filter(Boolean)
      if (!parts.length) continue
      let v = field === 'notes' ? parts.join(' · ') : parts.join(' ')
      const m = maps[field]?.[v.toLowerCase()]
      if (m !== undefined) v = m
      rec[field] = v
    }
    for (const [field, v] of Object.entries(plan.default || {})) if (allowed.has(field) && rec[field] === undefined && v) rec[field] = v
    const extra = (plan.notes_columns || [])
      .filter(c => typeof c === 'number' && row[c] && String(row[c]).trim())
      .map(c => `${header[c] ? String(header[c]).trim() + ': ' : ''}${String(row[c]).trim()}`)
    if (extra.length) rec.notes = [rec.notes, ...extra].filter(Boolean).join(' · ')
    // Which venue a court is at is, in a block layout, only ever said by the banner.
    if (cat === 'courts' && section && !rec.location) rec.location = section
    const clean = cleanRecord(cat, rec)
    if (!clean) {
      // Left out — and said so, when the row plainly held something.
      const why = skipped ? whyNotRecord(cat, rec) : null
      if (why) skipped!.push(why)
      continue
    }
    // Not a column of any table — carried alongside so an attendee list knows
    // who has paid. The save route only writes known columns, so it never lands.
    if (typeof plan.paid_column === 'number') clean._paid = saysPaid(row[plan.paid_column])
    out.push(clean)
  }
  return out
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

/**
 * One record per real thing. A camp listed on every attendee's row, or a venue
 * on every lesson, arrives hundreds of times; it is one camp and one venue.
 * Records with the same label are merged: the first value of each field wins
 * and notes are combined. Payments are only merged when every field matches —
 * two £30 lessons for the same child are two payments.
 */
export function dedupeRecords(category: ImportCategory, recs: Record<string, unknown>[]): Record<string, unknown>[] {
  const label = LABEL_FIELD[category]
  const norm = foldText
  const keyOf = (r: Record<string, unknown>): string => {
    // Payments and kit: only an identical line is a duplicate. Two £30 lessons
    // for one child are two payments; "Junior rackets" in 23", 25" and 26" are
    // three lines of stock.
    if (category === 'payments' || category === 'equipment') return JSON.stringify(IMPORT_FIELDS[category].map(f => norm(r[f])))
    // "Court 1" exists at every venue.
    if (category === 'courts') return `${norm(r[label])}|${norm(r.location)}`
    return norm(r[label])
  }
  const merge = (have: Record<string, unknown>, r: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(r)) {
      if (v === undefined || v === null || v === '') continue
      if (k === 'notes' && have.notes && have.notes !== v) {
        const parts = new Set([...String(have.notes).split(' · '), ...String(v).split(' · ')])
        have.notes = [...parts].join(' · ').slice(0, 4000)
      } else if (have[k] === undefined || have[k] === null || have[k] === '') {
        have[k] = v
      }
    }
  }
  const byKey = new Map<string, Record<string, unknown>>()
  for (const r0 of recs) {
    let r = r0
    if (category === 'players' || category === 'staff') {
      // Applied here as well as when a row is first read, so records the AI
      // read for itself (a PDF, a photo, an untidy tab) get the same checks.
      const name = typeof r.name === 'string' ? tidyPersonName(r.name) : ''
      if (!isPersonName(name)) continue
      r = { ...r, name }
    }
    let key = keyOf(r)
    if (!key || key === '|') continue
    if (category === 'players') {
      // One name, two families: kept as two players (see samePerson).
      for (let n = 1; byKey.has(key) && !samePerson(byKey.get(key)!, r); n++) key = `${keyOf(r)}#${n}`
    }
    if (category === 'camps') {
      // One name, two sets of dates: two camps (see sameCamp).
      for (let n = 1; byKey.has(key) && !sameCamp(byKey.get(key)!, r); n++) key = `${keyOf(r)}#${n}`
    }
    const have = byKey.get(key)
    if (!have) { byKey.set(key, { ...r }); continue }
    merge(have, r)
  }

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
  return [...byKey.values()]
}

/**
 * Move a record to another category when the coach says "no, these are camps".
 * The label carries across (a resource's title becomes the camp's name), any
 * field both categories share comes too, and the rest goes into the notes so
 * nothing the sheet held is dropped.
 */
export function convertRecord(from: ImportCategory, to: ImportCategory, rec: Record<string, unknown>): Record<string, unknown> | null {
  if (from === to) return rec
  const out: Record<string, unknown> = { [LABEL_FIELD[to]]: rec[LABEL_FIELD[from]] }
  const spill: string[] = []
  for (const [k, v] of Object.entries(rec)) {
    if (k === LABEL_FIELD[from] || k === 'notes' || v === undefined || v === null || v === '') continue
    if (IMPORT_FIELDS[to].includes(k)) out[k] = v
    else spill.push(`${k.replace(/_/g, ' ')}: ${v}`)
  }
  out.notes = [rec.notes, ...spill].filter(Boolean).join(' · ') || undefined
  return cleanRecord(to, out)
}

export const CATEGORY_LABEL: Record<ImportCategory, string> = {
  players: 'Players', staff: 'Coaches & staff', courts: 'Courts & venues', camps: 'Training camps',
  equipment: 'Equipment', payments: 'Payments', resources: 'Resources',
}
