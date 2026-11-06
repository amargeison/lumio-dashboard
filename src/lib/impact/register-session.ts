// Which session a coach's register opens on, and how its date reads. No database here,
// so it runs the same in the browser and the tests. Dates are read as written, never
// through a time zone, so a session can't slip a day.

export interface RegisterSession { id: string; date: string; week: number | null }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']

const parts = (iso: string) => iso.slice(0, 10).split('-').map(Number)

/** "3 Dec" */
export function sessionShort(iso: string): string {
  const [, m, d] = parts(iso)
  return `${d} ${MONTHS[m - 1]}`
}

/** "Tue 22 Sept" */
export function sessionDay(iso: string): string {
  const [y, m, d] = parts(iso)
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${sessionShort(iso)}`
}

/** Today's session, otherwise the latest past one, otherwise the first still to come. */
export function pickRegisterSession<T extends { session_date: string }>(sessions: T[], today: string): T | undefined {
  const dated = [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date))
  return dated.filter(s => s.session_date <= today).pop() ?? dated[0]
}

/**
 * "Harborne Fields Primary — Autumn 2026". A term label can carry the school as well
 * ("Autumn 2026 — Harborne Fields"), so that part is dropped rather than printed twice.
 */
export function cohortLabel(school: string, term: string): string {
  const name = school.trim().toLowerCase()
  const parts = term.split(' — ').map(p => p.trim()).filter(Boolean)
  const isSchool = (p: string) => { const x = p.toLowerCase(); return x === name || name.startsWith(`${x} `) || x.startsWith(`${name} `) }
  const kept = parts.filter(p => !isSchool(p))
  return kept.length ? `${school} — ${kept.join(' — ')}` : school
}

/** How far a cohort has got, never "Week 0". */
export function cohortStage(week: number, held: number, long = false): string {
  if (week) return long ? `Week ${week} of 10` : `Week ${week}`
  return held ? `${held} session${held === 1 ? '' : 's'} so far` : 'Not started'
}

/** The sessions from today to six days on, soonest first. */
export function nextSevenDays<T extends { session_date: string }>(sessions: T[], today: string): T[] {
  const [y, m, d] = today.slice(0, 10).split('-').map(Number)
  const last = new Date(Date.UTC(y, m - 1, d + 6)).toISOString().slice(0, 10)
  return sessions.filter(s => s.session_date >= today && s.session_date <= last).sort((a, b) => a.session_date.localeCompare(b.session_date))
}
