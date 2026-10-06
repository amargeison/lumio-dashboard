// ─────────────────────────────────────────────────────────────────────────────
// "Today", "this week" and "this month" for the coach portal — in UK time.
//
// The dashboard used the browser's clock for today and UTC for "a week ago",
// and counted three different things under the words "this week". These are
// the one definition of each, so the tile, the right-hand rail and the page a
// tile opens all agree:
//
//   today       the date in London right now
//   this week   Monday to Sunday, the week that contains today
//   this month  the calendar month that contains today
//
// Dates are 'YYYY-MM-DD' strings, which compare correctly as text.
// ─────────────────────────────────────────────────────────────────────────────

const TZ = 'Europe/London'

function parts(d: Date): Record<string, string> {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  return Object.fromEntries(f.formatToParts(d).map(x => [x.type, x.value])) as Record<string, string>
}

/** The London date of an instant (default: now), as 'YYYY-MM-DD'. */
export function ukDate(at: Date | string | number = new Date()): string {
  const d = at instanceof Date ? at : new Date(at)
  if (Number.isNaN(d.getTime())) return ''
  const p = parts(d)
  return `${p.year}-${p.month}-${p.day}`
}

/** The London time of day right now, as 'HH:MM'. */
export function ukTime(at: Date = new Date()): string {
  const p = parts(at)
  return `${p.hour === '24' ? '00' : p.hour}:${p.minute}`
}

/** Move a 'YYYY-MM-DD' date by whole days. */
export function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`)   // midday, so a clock change cannot move the date
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Whole days from one date to another (negative when `to` is earlier). */
export function daysBetweenIso(from: string, to: string): number {
  return Math.round((new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / 86400000)
}

/** Monday and Sunday of the week containing `day` (default: today in London). */
export function ukWeek(day: string = ukDate()): { start: string; end: string } {
  const wd = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7   // Monday = 0
  const start = addDaysIso(day, -wd)
  return { start, end: addDaysIso(start, 6) }
}

/** 'YYYY-MM' of the month containing an instant, as London sees it. */
export function ukMonth(at: Date | string | number = new Date()): string {
  return ukDate(at).slice(0, 7)
}
