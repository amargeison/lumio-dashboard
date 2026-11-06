// Registers outstanding: a session that has happened recently with no marks at all.
// One session with even one mark counts as taken. The Overview tile, its list and
// Needs attention all read this.

import { longDate } from './compliance'
import type { LiveRows } from './live-context'

export const REGISTER_WINDOW_DAYS = 14
export interface OutstandingRegister { id: string; school: string; date: string; dateLabel: string; coach: string; text: string }

const DAY_MS = 86400000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const daysBefore = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) - n * DAY_MS).toISOString().slice(0, 10)

/** "Tue 3 Nov". */
export function dayLabel(iso: string) {
  const weekday = WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()]
  return `${weekday} ${longDate(iso).split(' ').slice(0, 2).join(' ')}`
}

type Rows = Pick<LiveRows, 'schools' | 'programmes' | 'sessions' | 'attendance' | 'venues' | 'staff' | 'programmeLinks'>

/** Newest first, so the one most likely to be remembered is at the top. */
export function outstandingRegisters(rows: Rows, today: string): OutstandingRegister[] {
  const taken = new Set((rows.attendance ?? []).map(a => a.session_id))
  const from = daysBefore(today, REGISTER_WINDOW_DAYS)
  const staffName = new Map((rows.staff ?? []).map(s => [s.id, s.name]))
  const programmeLead = new Map((rows.programmeLinks ?? []).map(p => [p.id, p.lead_staff_id]))
  const whereIs = (s: NonNullable<Rows['sessions']>[number]) => {
    const schoolId = rows.programmes.find(p => p.id === s.programme_id)?.school_id
    return rows.schools.find(x => x.id === schoolId)?.name ?? (rows.venues ?? []).find(v => v.id === s.venue_id)?.name ?? 'Unknown location'
  }
  return (rows.sessions ?? [])
    .filter(s => s.session_date >= from && s.session_date <= today && !taken.has(s.id))
    .sort((a, b) => b.session_date.localeCompare(a.session_date))
    .map(s => {
      const school = whereIs(s), dateLabel = dayLabel(s.session_date)
      const lead = s.lead_staff_id ?? programmeLead.get(s.programme_id ?? '') ?? ''
      return { id: s.id, school, date: s.session_date, dateLabel, coach: staffName.get(lead) ?? '—', text: `Register missing — ${school}, ${dateLabel}` }
    })
}
