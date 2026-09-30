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
  if (key === 'players.racket_stage') {
    // "Orange racket", "Stage 3 – Orange", "orange ball"
    const found = allowed.find(a => new RegExp(`\\b${a}\\b`, 'i').test(s))
    if (found) return found
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
  const label = out[LABEL_FIELD[category]]
  if (!label || typeof label !== 'string' || !label.trim()) return null
  // A repeated heading row or a totals line is not a record.
  if (/^(total|totals|sub-?total|grand total|name|player|player name|item|title)$/i.test(label.trim())) return null
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
}

/** Every row of a mapped tab as records. Pure, so a 20,000-row tab costs nothing but a loop. */
export function applyPlan(plan: SheetPlan, rows: string[][]): Record<string, unknown>[] {
  if (plan.category === 'skip' || plan.irregular) return []
  const cat = plan.category
  const allowed = new Set(IMPORT_FIELDS[cat])
  const header = plan.header_row >= 0 ? rows[plan.header_row] || [] : []
  const start = typeof plan.first_data_row === 'number' ? plan.first_data_row : plan.header_row + 1
  const end = typeof plan.last_data_row === 'number' ? Math.min(plan.last_data_row, rows.length - 1) : rows.length - 1
  const lower = (m?: Record<string, string>) => m ? Object.fromEntries(Object.entries(m).map(([k, v]) => [k.trim().toLowerCase(), v])) : undefined
  const maps: Record<string, Record<string, string> | undefined> = {}
  for (const [f, m] of Object.entries(plan.values || {})) maps[f] = lower(m)
  const out: Record<string, unknown>[] = []
  for (let r = Math.max(0, start); r <= end; r++) {
    const row = rows[r]
    if (!row || !row.some(c => c && String(c).trim())) continue
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
    const clean = cleanRecord(cat, rec)
    if (clean) out.push(clean)
  }
  return out
}

// ── Tidying what was found ───────────────────────────────────────────────────

/**
 * One record per real thing. A camp listed on every attendee's row, or a venue
 * on every lesson, arrives hundreds of times; it is one camp and one venue.
 * Records with the same label are merged: the first value of each field wins
 * and notes are combined. Payments are only merged when every field matches —
 * two £30 lessons for the same child are two payments.
 */
export function dedupeRecords(category: ImportCategory, recs: Record<string, unknown>[]): Record<string, unknown>[] {
  const label = LABEL_FIELD[category]
  const byKey = new Map<string, Record<string, unknown>>()
  for (const r of recs) {
    const key = category === 'payments'
      ? JSON.stringify(IMPORT_FIELDS.payments.map(f => String(r[f] ?? '').trim().toLowerCase()))
      : String(r[label] ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
    if (!key) continue
    const have = byKey.get(key)
    if (!have) { byKey.set(key, { ...r }); continue }
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
