// Academic terms. The one definition of "this term".
//
// An org can set its own term dates in Settings → Venues & sessions (settings.termDates).
// A date inside one of those terms belongs to it, and a holiday belongs to the term just
// finished: each term runs on to the day before the next one starts (when the next one
// starts within 120 days), so the org's terms leave no gaps. Any other date (no dates set,
// or outside the dates the org has entered) falls back to fixed calendar boundaries:
//
//   Autumn  1 Sept – 31 Dec
//   Spring  1 Jan – 31 Mar
//   Summer  1 Apr – 31 Aug
//
// Easter moves, so the real break can fall either side of 1 April; a fixed date keeps
// the fallback the same for every org. August sits in Summer so that every date has a
// term. Dates are YYYY-MM-DD strings, which compare correctly as text.

export type TermName = 'Autumn' | 'Spring' | 'Summer'
export interface Term { name: TermName; start: string; end: string }

const YMD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const NAMES: TermName[] = ['Autumn', 'Spring', 'Summer']
const realDate = (s: string) => YMD.test(s) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s

/** The org's saved term dates, cleaned: valid dates, start ≤ end, at most a year long, no overlaps, sorted. */
export function termDatesOf(raw: unknown): Term[] {
  if (!Array.isArray(raw)) return []
  const terms = raw.slice(0, 30).flatMap(t => {
    const o = (t ?? {}) as Record<string, unknown>
    const name = NAMES.find(n => n === o.name), start = String(o.start ?? ''), end = String(o.end ?? '')
    if (!name || !realDate(start) || !realDate(end) || start > end) return []
    if ((Date.parse(end) - Date.parse(start)) / 86_400_000 > 366) return []
    return [{ name, start, end }]
  }).sort((a, b) => a.start.localeCompare(b.start))
  return terms.filter((t, i) => i === 0 || t.start > terms[i - 1].end)
}

/** Why a set of term dates can't be saved, or null when they're fine. */
export function termDatesProblem(raw: { name: string; start: string; end: string }[]): string | null {
  for (const [i, t] of raw.entries()) {
    const n = `Term ${i + 1}`
    if (!NAMES.includes(t.name as TermName)) return `${n}: choose Autumn, Spring or Summer.`
    if (!realDate(t.start) || !realDate(t.end)) return `${n}: enter a start and an end date.`
    if (t.start > t.end) return `${n}: the end date is before the start.`
    if ((Date.parse(t.end) - Date.parse(t.start)) / 86_400_000 > 366) return `${n}: a term can’t be longer than a year.`
  }
  const sorted = [...raw].sort((a, b) => a.start.localeCompare(b.start))
  for (let i = 1; i < sorted.length; i++) if (sorted[i].start <= sorted[i - 1].end) return `${sorted[i - 1].name} ${sorted[i - 1].start.slice(0, 4)} and ${sorted[i].name} ${sorted[i].start.slice(0, 4)} overlap.`
  return null
}

function fixedTerm(date: string): Term {
  const year = date.slice(0, 4), month = Number(date.slice(5, 7))
  if (month >= 9) return { name: 'Autumn', start: `${year}-09-01`, end: `${year}-12-31` }
  if (month <= 3) return { name: 'Spring', start: `${year}-01-01`, end: `${year}-03-31` }
  return { name: 'Summer', start: `${year}-04-01`, end: `${year}-08-31` }
}

const dayBefore = (d: string) => new Date(Date.parse(`${d}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10)

/** The org's terms with each one running on to the day before the next (when that's within 120 days). */
export function orgTerms(termDates: unknown): Term[] {
  const t = termDatesOf(termDates)
  return t.map((x, i) => {
    const next = t[i + 1]
    return next && (Date.parse(next.start) - Date.parse(x.end)) / 86_400_000 <= 120 ? { ...x, end: dayBefore(next.start) } : x
  })
}

/** The term a date is in: the org's own (termDates from settings) when it falls inside one, else the fixed one. */
export function termOf(date: string, termDates?: unknown): Term {
  return orgTerms(termDates).find(t => date >= t.start && date <= t.end) ?? fixedTerm(date)
}

export const inTerm = (date: string, term: Term) => date >= term.start && date <= term.end
