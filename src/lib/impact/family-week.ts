// What a family's This Week tab shows: their next session and the booklet week it
// falls in. A session's own week number wins; otherwise its place in the child's
// school sessions. No database here, so it runs the same in the browser and the tests.

import type { Booklet, BookletWeek } from './packs'

export interface FamilySession { id: string; kind: string; session_date: string; week_number?: number | null; venue: string | null }
export interface FamilyWeek { next: FamilySession | null; week: number | null; booklet: BookletWeek | null }

const byDate = (a: FamilySession, b: FamilySession) => a.session_date.localeCompare(b.session_date)

function weekOf(sessions: FamilySession[], at: FamilySession): number | null {
  const school = sessions.filter(s => s.kind === 'school')
  // A weekend session sits in the week of the school session before it.
  const ref = at.kind === 'school' ? at : school.filter(s => s.session_date <= at.session_date).pop()
  if (!ref) return null
  return ref.week_number ?? school.indexOf(ref) + 1
}

/** One list per child. The child with the soonest session decides the week. */
export function familyWeek(perChild: FamilySession[][], booklet: Booklet | null, today: string): FamilyWeek {
  const lists = perChild.map(l => [...l].sort(byDate)).filter(l => l.length)
  const nextOf = (l: FamilySession[]) => l.find(s => s.session_date >= today) ?? null
  const coming = lists.filter(nextOf).sort((a, b) => byDate(nextOf(a)!, nextOf(b)!))[0]
  const list = coming ?? [...lists].sort((a, b) => byDate(b[b.length - 1], a[a.length - 1]))[0]
  if (!list) return { next: null, week: null, booklet: null }
  const next = nextOf(list)
  const week = weekOf(list, next ?? list[list.length - 1])
  const entry = booklet?.weeks.find(w => w.week === week && (w.title || w.focus || w.home_task)) ?? null
  return { next, week, booklet: entry }
}
