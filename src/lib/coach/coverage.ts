// What each client has, and has not, covered recently — and what they told the
// coach they want, from their welcome questionnaire (pure — no database, no
// browser).
//
// Lessons are written in words, not tagged, so each lesson is read for the
// eight parts of the game the questionnaire asks clients to rate: forehand,
// backhand, serve, return, the net, movement, fitness, and match play. The
// planner, the lesson log and the client's profile all show the same picture,
// and the session planner gives it to Lumio Coach when it builds a plan.

import { SCALE_PARTS, type Answers } from './questionnaire'

export type AreaId = 'forehand' | 'backhand' | 'serve' | 'return' | 'net' | 'movement' | 'fitness' | 'match'
export type Area = { id: AreaId; name: string; part: (typeof SCALE_PARTS)[number]; test: RegExp }

export const AREAS: Area[] = [
  { id: 'forehand', name: 'Forehand', part: 'Forehand', test: /\bforehands?\b|\bfh\b|inside[- ]out/i },
  { id: 'backhand', name: 'Backhand', part: 'Backhand', test: /\bbackhands?\b|\bbh\b|\bslices?\b|(two|one|double|single)[- ]hand(ed|er)/i },
  { id: 'serve', name: 'Serve', part: 'Serve', test: /\bserv(e|es|ing)\b|\btoss\b|\bservice\b/i },
  { id: 'return', name: 'Return', part: 'Return', test: /\breturn(s|ing)?\b/i },
  { id: 'net', name: 'Net play', part: 'Volleys and net play', test: /\bvolley|\bnet\b|\bnet play|\bapproach(es|ing)?\b|\boverheads?\b|\bsmash/i },
  { id: 'movement', name: 'Movement', part: 'Movement', test: /footwork|movement|split[- ]?step|\brecover(y|ing)?\b|ready position|court coverage|\bbalance\b/i },
  { id: 'fitness', name: 'Fitness', part: 'Fitness', test: /\bfitness|conditioning|\bcardio|endurance|agility|stamina/i },
  { id: 'match', name: 'Match play', part: 'Match nerves', test: /\bmatch(es|play)?\b|tie[- ]?breaks?|\bnerves?\b|tactic|\bpatterns?\b|\bdoubles\b|\bsingles\b|\bscoring\b|competitive|\bplay(ing)? points\b|\bpoint play\b|mental/i },
]

/** Which parts of the game a piece of writing is about. */
export function areasIn(text: string): AreaId[] {
  // "Return of serve" is the return, not the serve. "Return to the middle" is
  // recovering, not returning.
  const t = ` ${String(text || '')} `
  const noReturnOfServe = t.replace(/\breturn(s|ing)?\s+(of\s+)?(the\s+)?serv(e|es|ice)\b/gi, ' return ')
  const noRecover = noReturnOfServe.replace(/\breturn(s|ing)?\s+(to|back)\b/gi, ' recover ')
  return AREAS.filter(a => a.test.test(noRecover)).map(a => a.id)
}

export type LessonLike = { session_date?: string | null; focus?: string | null; review_json?: Record<string, unknown> | null }

/** Everything a lesson says it worked on, as one piece of text. Never the coach's private note. */
export function lessonText(s: LessonLike): string {
  const r = (s.review_json || {}) as Record<string, unknown>
  const bits: string[] = [String(s.focus || ''), String(r.focus || '')]
  for (const k of ['covered', 'skillsWorked', 'drills', 'technique', 'takeaways']) {
    const v = r[k]
    if (Array.isArray(v)) for (const x of v) bits.push(typeof x === 'string' ? x : x && typeof x === 'object' ? Object.values(x as Record<string, unknown>).filter(y => typeof y === 'string').join(' ') : '')
  }
  if (typeof r.assessment === 'string') bits.push(r.assessment)
  return bits.filter(Boolean).join(' · ')
}

const DAY = 86400000
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to.slice(0, 10)}T12:00:00Z`) - Date.parse(`${from.slice(0, 10)}T12:00:00Z`)) / DAY)

/** Lessons count as "recent" for this many days; after that an area is "not lately". */
export const RECENT_DAYS = 42

export type AreaStat = {
  id: AreaId; name: string
  last: string | null          // date of the last lesson that worked on it
  daysAgo: number | null
  lessons: number              // lessons in the last RECENT_DAYS that worked on it
  state: 'recent' | 'while' | 'gap'   // up to 14 days · 15–42 days · longer or never
  rating: number | null        // their own rating, 1–5, from the long questionnaire
  wants: string[]              // why it matters to them, in words
}

/** Goals in the questionnaire that point at parts of the game. */
const GOAL_AREAS: Record<string, AreaId[]> = {
  'Rally more consistently': ['forehand', 'backhand'],
  'A better serve': ['serve'],
  'Win more matches': ['match'],
  'Play doubles better': ['net', 'match'],
  'Compete in tournaments': ['match'],
  'Enjoy it and keep fit': ['fitness'],
}

/** The picture for one client: each part of the game, what they said, and when it was last worked on. */
export function coverage(lessons: LessonLike[], answers: Answers | null | undefined, today: string): AreaStat[] {
  const dated = lessons
    .filter(l => l.session_date && String(l.session_date).slice(0, 10) <= today)
    .map(l => ({ date: String(l.session_date).slice(0, 10), areas: new Set(areasIn(lessonText(l))) }))
    .sort((a, b) => b.date.localeCompare(a.date))
  const a = answers || {}
  const ratings = (a.ratings && typeof a.ratings === 'object' && !Array.isArray(a.ratings) ? a.ratings : {}) as Record<string, number>
  const goals = Array.isArray(a.goals) ? (a.goals as string[]) : []
  const wrote = (k: string) => (typeof a[k] === 'string' ? areasIn(a[k] as string) : [])
  const goal3 = wrote('goal_3m'), goal12 = wrote('goal_12m'), frustrates = wrote('frustrates'), gameNow = wrote('game_now')

  return AREAS.map(area => {
    const hits = dated.filter(d => d.areas.has(area.id))
    const last = hits[0]?.date || null
    const ago = last ? daysBetween(last, today) : null
    const rating = Number(ratings[area.part]) >= 1 ? Number(ratings[area.part]) : null
    const wants: string[] = []
    if (rating != null && rating <= 2) wants.push(`rated ${rating}/5`)
    if (goals.some(g => GOAL_AREAS[g]?.includes(area.id))) wants.push('one of their goals')
    if (goal3.includes(area.id)) wants.push('their 3-month goal')
    else if (goal12.includes(area.id)) wants.push('their goal for the year')
    if (frustrates.includes(area.id)) wants.push('frustrates them')
    else if (!wants.length && gameNow.includes(area.id)) wants.push('mentioned in how they see their game')
    return {
      id: area.id, name: area.name, last, daysAgo: ago,
      lessons: hits.filter(h => daysBetween(h.date, today) <= RECENT_DAYS).length,
      state: ago == null || ago > RECENT_DAYS ? 'gap' : ago > 14 ? 'while' : 'recent',
      rating, wants,
    }
  })
}

/** What to work on next: the parts they care about that have not had a lesson lately. At most three. */
export function nextUp(stats: AreaStat[]): AreaStat[] {
  const score = (s: AreaStat) => (s.state === 'gap' ? 100 : s.state === 'while' ? 40 : 0) + s.wants.length * 25 + (s.rating != null ? (6 - s.rating) * 8 : 0)
  return stats.filter(s => s.wants.length > 0 && s.state !== 'recent').sort((x, y) => score(y) - score(x)).slice(0, 3)
}

export const whenWords = (s: AreaStat) =>
  s.daysAgo == null ? 'not yet' : s.daysAgo === 0 ? 'today' : s.daysAgo === 1 ? 'yesterday' : s.daysAgo < 14 ? `${s.daysAgo} days ago` : `${Math.round(s.daysAgo / 7)} weeks ago`

const list = (v: unknown) => (Array.isArray(v) ? (v as string[]).join(', ') : typeof v === 'string' ? v : '')

/** What they told the coach, in short lines, for the screen. Never health notes. */
export function whatTheySaid(answers: Answers | null | undefined): { label: string; text: string }[] {
  const a = answers || {}
  const out: { label: string; text: string }[] = []
  const add = (label: string, v: unknown) => { const t = list(v).trim(); if (t) out.push({ label, text: t.slice(0, 300) }) }
  add('Level', [a.level, a.often].filter(Boolean).join(' · '))
  add('Wants', a.goals)
  add('In 3 months', a.goal_3m)
  add('In a year', a.goal_12m)
  add('Their game', a.game_now)
  add('Frustrates them', a.frustrates)
  add('Best part', a.best)
  add('Likes in lessons', a.likes)
  add('Less of', a.less_of)
  add('Likes to be coached', a.coached)
  add('Matches', a.matches)
  return out
}

/** The same, plus what has and has not been covered, as a block for Lumio Coach's plan. */
export function plannerBrief(answers: Answers | null | undefined, stats: AreaStat[]): string {
  const said = whatTheySaid(answers)
  const covered = stats.filter(s => s.state !== 'gap').sort((x, y) => (x.daysAgo ?? 999) - (y.daysAgo ?? 999))
  const gaps = stats.filter(s => s.state === 'gap')
  const rated = stats.filter(s => s.rating != null).sort((x, y) => (x.rating ?? 0) - (y.rating ?? 0))
  const up = nextUp(stats)
  const lines: string[] = []
  if (said.length) lines.push(`What they told you in their welcome questionnaire:\n${said.map(s => `- ${s.label}: ${s.text}`).join('\n')}`)
  if (rated.length) lines.push(`Their own ratings (1 needs work, 5 a strength): ${rated.map(s => `${s.name} ${s.rating}`).join(', ')}.`)
  if (covered.length || gaps.length) {
    lines.push(`Covered in the last ${RECENT_DAYS / 7} weeks: ${covered.length ? covered.map(s => `${s.name} (${s.lessons} lesson${s.lessons === 1 ? '' : 's'}, last ${whenWords(s)})`).join('; ') : 'nothing recorded'}.`)
    if (gaps.length) lines.push(`Not covered in the last ${RECENT_DAYS / 7} weeks: ${gaps.map(s => s.name).join(', ')}.`)
  }
  if (up.length) lines.push(`Worth bringing in soon: ${up.map(s => `${s.name} (${s.wants.join(', ')}; last ${whenWords(s)})`).join('; ')}.`)
  return lines.join('\n')
}
