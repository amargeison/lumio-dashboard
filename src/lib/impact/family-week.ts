// What a family's This Week tab shows: this week's session if they have one, otherwise
// their next, with the booklet week it falls in. A past week is never shown as this one.
// A session's own week number wins; otherwise its place in the child's school sessions.
// No database here, so it runs the same in the browser and the tests.

import type { Booklet, BookletWeek } from './packs'

export interface FamilySession { id: string; kind: string; session_date: string; week_number?: number | null; venue: string | null }
export interface FamilyWeek { next: FamilySession | null; week: number | null; booklet: BookletWeek | null; sessionThisWeek: boolean }

const byDate = (a: FamilySession, b: FamilySession) => a.session_date.localeCompare(b.session_date)

function weekOf(sessions: FamilySession[], at: FamilySession): number | null {
  const school = sessions.filter(s => s.kind === 'school')
  // A weekend session sits in the week of the school session before it.
  const ref = at.kind === 'school' ? at : school.filter(s => s.session_date <= at.session_date).pop()
  if (!ref) return null
  return ref.week_number ?? school.indexOf(ref) + 1
}

/** The Monday and Sunday of the week a date falls in. */
export function weekRange(today: string): [string, string] {
  const [y, m, d] = today.slice(0, 10).split('-').map(Number)
  const day = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
  const at = (n: number) => new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
  return [at(-day), at(6 - day)]
}

/** One list per child. The child with the soonest session decides the week. */
export function familyWeek(perChild: FamilySession[][], booklet: Booklet | null, today: string): FamilyWeek {
  const lists = perChild.map(l => [...l].sort(byDate)).filter(l => l.length)
  const nextOf = (l: FamilySession[]) => l.find(s => s.session_date >= today) ?? null
  const coming = lists.filter(nextOf).sort((a, b) => byDate(nextOf(a)!, nextOf(b)!))[0]
  const next = coming ? nextOf(coming) : null
  const [monday, sunday] = weekRange(today)
  const inWeek = (s: FamilySession) => s.session_date >= monday && s.session_date <= sunday
  const earlier = lists.find(l => l.some(inWeek))
  const sessionThisWeek = !!earlier
  // The next session if it's this week or there's none this week; otherwise this week's, already held.
  const useNext = !!next && (inWeek(next) || !earlier)
  const list = useNext ? coming : earlier
  if (!list) return { next: null, week: null, booklet: null, sessionThisWeek: false }
  const week = weekOf(list, useNext ? next : list.filter(inWeek).pop()!)
  const entry = booklet?.weeks.find(w => w.week === week && (w.title || w.focus || w.home_task)) ?? null
  return { next, week, booklet: entry, sessionThisWeek }
}
