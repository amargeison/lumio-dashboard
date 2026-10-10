// ─────────────────────────────────────────────────────────────────────────────
// Import engine — records. PRODUCT-AGNOSTIC: nothing here knows about tennis,
// coaches, schools or any table. A product describes its own record types in
// an ImportSchema (fields, typed columns, enums, and optional hooks for the
// rules only it has), and gets cleaning, row-mapping, de-duplication and
// category conversion from here. Coach: src/lib/coach/import-records.ts.
// Impact: src/lib/impact/import-schema.ts.
//
// The database is strict — integers are integers, dates are dates — and one
// "U10" in an integer column used to fail a whole batch. A value that will not
// fit its column is not thrown away: it moves into the notes, so nothing the
// user typed is lost.
// ─────────────────────────────────────────────────────────────────────────────

export type Rec = Record<string, unknown>

export interface ImportSchema<C extends string> {
  categories: readonly C[]
  /** The fields each category may hold (always include 'notes'). */
  fields: Record<C, string[]>
  /** The field a record cannot exist without — no label, no record. */
  labelField: Record<C, string>
  /** 'category.field' keys for typed columns. */
  intFields?: ReadonlySet<string>
  numFields?: ReadonlySet<string>
  dateFields?: ReadonlySet<string>
  enums?: Record<string, string[]>
  /** Common ways people write enumerated values: key → written → allowed. */
  synonyms?: Record<string, Record<string, string>>
  /** Human names for fields, used when a value spills into the notes. */
  fieldLabels?: Record<string, string>
  /** Categories whose label is a person's name (tidied, and must look like one). */
  personCategories?: readonly C[]
  isPersonName?: (name: string) => boolean
  /** A label that is exactly a heading word ("Name", "Total") is not a record. */
  headingExact: RegExp
  /** A label that starts like a totals line is not a record. */
  headingPrefix: RegExp
  /** Same, for the "why was this row left out" check (silent when matched). */
  headingWhy: RegExp
  // ── Hooks for rules only one product has ──
  /** Parse one field specially. Return undefined to use the normal rules. */
  parseField?: (category: C, field: string, value: unknown) => { value: unknown } | { spill: true } | undefined
  /** After exact + synonym matching fails for an enum. */
  enumFallback?: (key: string, text: string) => string | null
  /** Last touches to a clean record (e.g. a default inferred from another field). */
  afterClean?: (category: C, out: Rec) => void
  /** Explain a dropped row that plainly held something (null = say nothing). */
  whyNot?: (category: C, label: string) => string | null
  /** In a block layout, the field that takes the block's banner (e.g. a venue). */
  sectionField?: Partial<Record<C, string>>
  /** Extra per-row data carried alongside a record (never a table column). */
  rowExtras?: (plan: SheetPlan<C>, row: string[], clean: Rec) => void
  /** Override the de-duplication key. Return undefined for "label". */
  dedupeKey?: (category: C, r: Rec, fold: (v: unknown) => string) => string | undefined
  /** Two records with the same key that are nonetheless different things. */
  sameThing?: (category: C) => ((a: Rec, b: Rec) => boolean) | undefined
  /** Cross-record merging after de-duplication (e.g. first-name-only people). */
  afterDedupe?: (category: C, byKey: Map<string, Rec>, merge: (have: Rec, r: Rec) => void) => void
}

// ── Generic value conversion ─────────────────────────────────────────────────
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

/**
 * "SMITH, Sarah" → "Sarah Smith"; "Matilda CAMPBELL" → "Matilda Campbell".
 * Registers are typed by many hands; a list should not show three styles, and
 * the same person written two ways must still be recognised as one.
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
 * Text as it is COMPARED, never as it is saved. Word and Excel turn O'Neill
 * into O’Neill, a hyphen into a long dash and a space into a no-break space;
 * the same name must still match. Capitals, doubled spaces and invisible
 * characters are folded away too.
 */
export function foldText(v: unknown): string {
  return String(v ?? '').normalize('NFKC')
    .replace(/[‘’‚‛ʼʹ`´′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/[​-‍﻿­]/g, '')
    .replace(/\s+/g, ' ').trim().toLowerCase()
}
/** A person's name, for telling whether two rows are the same person. */
export const personKey = (n: unknown): string => foldText(tidyPersonName(String(n ?? '')))

// ── Cleaning one record ──────────────────────────────────────────────────────
function toEnum<C extends string>(schema: ImportSchema<C>, key: string, v: unknown): string | null {
  const allowed = schema.enums?.[key] ?? []
  const s = String(v ?? '').trim()
  if (!s) return null
  const hit = allowed.find(a => a.toLowerCase() === s.toLowerCase())
  if (hit) return hit
  const syn = schema.synonyms?.[key]?.[s.toLowerCase()]
  if (syn) return syn
  return schema.enumFallback ? schema.enumFallback(key, s) : null
}

const isPerson = <C extends string>(schema: ImportSchema<C>, c: C) => !!schema.personCategories?.includes(c)

/**
 * Why a row that has something in its label column was left out — or null when
 * it is only a blank line, a repeated heading or a totals row. A row dropped
 * without a word looks like the importer losing data.
 */
export function whyNotRecord<C extends string>(schema: ImportSchema<C>, category: C, raw: Rec): string | null {
  const label = String(raw[schema.labelField[category]] ?? '').replace(/\s+/g, ' ').trim()
  if (!label) return null
  if (schema.headingWhy.test(label)) return null
  return schema.whyNot ? schema.whyNot(category, label) : null
}

/**
 * One record, made safe for its table: unknown keys dropped, text trimmed, typed
 * columns converted, and anything that will not convert kept in the notes.
 * Returns null when the record has no label (a blank or total row).
 */
export function cleanRecord<C extends string>(schema: ImportSchema<C>, category: C, raw: Rec): Rec | null {
  const out: Rec = {}
  const spill: string[] = []
  const labelOf = (f: string) => schema.fieldLabels?.[f] || f
  for (const f of schema.fields[category]) {
    const v = raw[f]
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && !v.trim()) continue
    const key = `${category}.${f}`
    const special = schema.parseField?.(category, f, v)
    if (special) {
      if ('spill' in special) spill.push(`${schema.fieldLabels?.[f]}: ${v}`)
      else out[f] = special.value
    } else if (schema.intFields?.has(key)) {
      // "20 places", "12 cans" — the number is what the column wants.
      const n = toNumber(v) ?? (String(v).match(/^\s*(\d+)\b/) ? Number(String(v).match(/^\s*(\d+)\b/)![1]) : null)
      if (n !== null && n >= 0) out[f] = Math.round(n); else spill.push(`${labelOf(f)}: ${v}`)
    } else if (schema.numFields?.has(key)) {
      const n = toNumber(v); if (n !== null) out[f] = Math.round(n * 100) / 100; else spill.push(`${labelOf(f)}: ${v}`)
    } else if (schema.dateFields?.has(key)) {
      const d = toIsoDate(v); if (d) out[f] = d; else spill.push(`${labelOf(f)}: ${v}`)
    } else if (schema.enums?.[key]) {
      const e = toEnum(schema, key, v); if (e) out[f] = e; else spill.push(`${labelOf(f)}: ${v}`)
    } else {
      out[f] = String(v).trim().slice(0, 4000)
    }
  }
  if (isPerson(schema, category)) {
    if (typeof out.name === 'string') out.name = tidyPersonName(out.name)
    if (typeof out.name !== 'string' || !(schema.isPersonName ?? (() => true))(out.name)) return null
  }
  const label = out[schema.labelField[category]]
  if (!label || typeof label !== 'string' || !label.trim()) return null
  // A repeated heading row or a totals line is not a record.
  if (schema.headingExact.test(label.trim())) return null
  if (schema.headingPrefix.test(label.trim())) return null
  schema.afterClean?.(category, out)
  if (spill.length) out.notes = [out.notes, spill.join(' · ')].filter(Boolean).join(' · ').slice(0, 4000)
  return out
}

// ── Applying a tab's mapping to every row ────────────────────────────────────
export type SheetPlan<C extends string> = {
  sheet: string
  category: C | 'skip'
  header_row: number
  first_data_row?: number
  last_data_row?: number
  columns: Record<string, number | number[]>
  notes_columns?: number[]
  values?: Record<string, Record<string, string>>
  default?: Record<string, string>
  irregular?: boolean
  /** How sure the AI is about the category. Anything but "high" is shown to the user to confirm. */
  confidence?: 'high' | 'medium' | 'low'
  /** One plain-English line on why — shown with the question. */
  reason?: string
}

/** Every row of a mapped tab as records. Pure, so a 20,000-row tab costs nothing but a loop. */
export function applyPlan<C extends string>(schema: ImportSchema<C>, plan: SheetPlan<C>, rows: string[][], banners: number[] = [], skipped?: string[]): Rec[] {
  if (plan.category === 'skip' || plan.irregular) return []
  const cat = plan.category
  const allowed = new Set(schema.fields[cat])
  const header = plan.header_row >= 0 ? rows[plan.header_row] || [] : []
  const start = typeof plan.first_data_row === 'number' ? plan.first_data_row : plan.header_row + 1
  const end = typeof plan.last_data_row === 'number' ? Math.min(plan.last_data_row, rows.length - 1) : rows.length - 1
  const lower = (m?: Record<string, string>) => m ? Object.fromEntries(Object.entries(m).map(([k, v]) => [k.trim().toLowerCase(), v])) : undefined
  const maps: Record<string, Record<string, string> | undefined> = {}
  for (const [f, m] of Object.entries(plan.values || {})) maps[f] = lower(m)
  // Section rows. A sheet laid out in blocks — a banner per group with its rows
  // underneath — has rows that are headings, not records. A banner is a merged
  // row (the reader marks those) or a row whose only cell is not in the column
  // the label comes from. Each one is skipped, and remembered as the block the
  // rows below belong to.
  const labelCol = plan.columns?.[schema.labelField[cat]]
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
  const sectionField = schema.sectionField?.[cat]

  const out: Rec[] = []
  for (let r = Math.max(0, start); r <= end; r++) {
    const row = rows[r]
    if (!row || !row.some(c => c && String(c).trim())) continue
    const sec = sectionOf(r)
    if (sec) { section = sec; continue }
    // The headings again, repeated at the top of each block.
    if (headLabel.length && [...labelCols].every(c => String(row[c] ?? '').trim().toLowerCase() === String(header[c] ?? '').trim().toLowerCase())) continue
    const rec: Rec = {}
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
    // In a block layout, the banner is the only place some fields are said.
    if (sectionField && section && !rec[sectionField]) rec[sectionField] = section
    const clean = cleanRecord(schema, cat, rec)
    if (!clean) {
      // Left out — and said so, when the row plainly held something.
      const why = skipped ? whyNotRecord(schema, cat, rec) : null
      if (why) skipped!.push(why)
      continue
    }
    schema.rowExtras?.(plan, row, clean)
    out.push(clean)
  }
  return out
}

// ── Tidying what was found ───────────────────────────────────────────────────
/**
 * One record per real thing. A venue listed on every row arrives hundreds of
 * times; it is one venue. Records with the same key are merged: the first value
 * of each field wins and notes are combined.
 */
export function dedupeRecords<C extends string>(schema: ImportSchema<C>, category: C, recs: Rec[]): Rec[] {
  const label = schema.labelField[category]
  const norm = foldText
  const keyOf = (r: Rec): string => schema.dedupeKey?.(category, r, norm) ?? norm(r[label])
  const merge = (have: Rec, r: Rec) => {
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
  const same = schema.sameThing?.(category)
  const byKey = new Map<string, Rec>()
  for (const r0 of recs) {
    let r = r0
    if (isPerson(schema, category)) {
      // Applied here as well as when a row is first read, so records the AI
      // read for itself (a PDF, a photo, an untidy tab) get the same checks.
      const name = typeof r.name === 'string' ? tidyPersonName(r.name) : ''
      if (!(schema.isPersonName ?? (() => true))(name)) continue
      r = { ...r, name }
    }
    let key = keyOf(r)
    if (!key || key === '|') continue
    // Same key, different thing (one name, two families) — kept apart.
    if (same) for (let n = 1; byKey.has(key) && !same(byKey.get(key)!, r); n++) key = `${keyOf(r)}#${n}`
    const have = byKey.get(key)
    if (!have) { byKey.set(key, { ...r }); continue }
    merge(have, r)
  }
  schema.afterDedupe?.(category, byKey, merge)
  return [...byKey.values()]
}

/**
 * Move a record to another category when the user says "no, these are X".
 * The label carries across, any field both categories share comes too, and
 * the rest goes into the notes so nothing the sheet held is dropped.
 */
export function convertRecord<C extends string>(schema: ImportSchema<C>, from: C, to: C, rec: Rec): Rec | null {
  if (from === to) return rec
  const out: Rec = { [schema.labelField[to]]: rec[schema.labelField[from]] }
  const spill: string[] = []
  for (const [k, v] of Object.entries(rec)) {
    if (k === schema.labelField[from] || k === 'notes' || v === undefined || v === null || v === '') continue
    if (schema.fields[to].includes(k)) out[k] = v
    else spill.push(`${k.replace(/_/g, ' ')}: ${v}`)
  }
  out.notes = [rec.notes, ...spill].filter(Boolean).join(' · ') || undefined
  return cleanRecord(schema, to, out)
}

// ── Reading the model's answer ───────────────────────────────────────────────
/**
 * JSON Lines → records per category, each cleaned. JSON Lines rather than one
 * big object: if the answer is cut off, only the last half-written line is lost.
 * An older-style single object ({"<category>":[...]}) still works.
 */
export function parseRecordLines<C extends string>(schema: ImportSchema<C>, txt: string): Partial<Record<C, Rec[]>> {
  const out: Partial<Record<C, Rec[]>> = {}
  const add = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    const rec = value as Rec
    const type = String(rec.type || '') as C
    if (!schema.categories.includes(type)) return
    const clean = cleanRecord(schema, type, rec)
    if (clean) (out[type] ||= []).push(clean)
  }
  const body = txt.replace(/```(?:json|jsonl)?/gi, '')
  for (const line of body.split('\n')) {
    const l = line.trim().replace(/,$/, '')
    if (!l.startsWith('{')) continue
    try { add(JSON.parse(l)) } catch { /* half-written last line */ }
  }
  if (!Object.keys(out).length) {
    const m = body.match(/\{[\s\S]*\}/)
    if (m) { try { const o = JSON.parse(m[0]) as Rec; for (const c of schema.categories) for (const r of (Array.isArray(o[c]) ? o[c] as Rec[] : [])) add({ ...r, type: c }) } catch { /* ignore */ } }
  }
  return out
}
