// Client-side store for lesson summaries created via "New summary" and via
// marking a session done in the Session Planner. Persists to localStorage and
// notifies subscribers so the Lesson Summaries list updates live. Demo only.

import { LESSONS, BELTS, ALL_SKILLS, type Lesson, type TodaySession } from './coach-data'
import type { DemoReview } from './session-review-data'

const KEY = 'lumio_coach_lessons'
const EVT = 'lumio-coach-lessons-changed'

function read(): Lesson[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Lesson[] : [] } catch { return [] }
}
function write(list: Lesson[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedLessons(): Lesson[] {
  return read()
}

// Store entries first (newest), then the static demo lessons.
export function getAllLessons(): Lesson[] {
  return [...read(), ...LESSONS]
}

export function addLesson(l: Lesson) {
  write([l, ...read()]) // newest first
}

// Insert or replace by id — used when a session is marked done (and again if its
// AI review completes later) so the entry updates rather than duplicating.
export function upsertLesson(l: Lesson) {
  write([l, ...read().filter(x => x.id !== l.id)])
}

export function removeLesson(id: string) {
  write(read().filter(l => l.id !== id))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}

// ─── Cross-view open signal ──────────────────────────────────────────────────
// In-memory (not persisted): the player-card lesson history calls
// requestOpenLesson(id) then navigates to the Lesson Summaries page, which
// consumes it on mount to auto-select that lesson's full summary.
let _pendingOpenLesson: string | null = null
export function requestOpenLesson(id: string) { _pendingOpenLesson = id }
export function consumeOpenLesson(): string | null { const v = _pendingOpenLesson; _pendingOpenLesson = null; return v }

// ─── Building a Lesson from a marked-done session ────────────────────────────
// Deterministic id so the entry can be upserted (review completes later) and
// removed (un-marking done) by session id. Cannot collide with demo ids (l1…)
// or "New summary" ids (new-lesson-…).
export const sessionLessonId = (sessionId: string) => `session-done-${sessionId}`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function todayLabel(): string {
  const d = new Date()
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// TodaySession has a 'Mini / red ball' type the Lesson shape doesn't — fold it
// into 'Group' for the summary.
function lessonType(t: TodaySession['type']): Lesson['type'] {
  if (t === 'Mini / red ball') return 'Group'
  return t
}

// First sentence (or first ~max chars) of a longer note, for tidy list lines.
function firstSentence(s: string, max = 90): string {
  const m = s.match(/^[^.!?]*[.!?]?/)
  const cut = (m ? m[0] : s).trim()
  return cut.length > max ? cut.slice(0, max - 1).trimEnd() + '…' : cut
}

// Map session focus + coaching cues onto belt-system skill ids, in priority
// order. Only emits ids that actually exist in the belt ladder.
const SKILL_KEYWORDS: [RegExp, string][] = [
  [/second serve|kick/i, 'second'],
  [/serve\+1|plus-one|pattern/i, 'patterns'],
  [/first serve/i, 'serve-flat'],
  [/toss/i, 'toss'],
  [/grip/i, 'grips'],
  [/placement|wide|target/i, 'placement'],
  [/return/i, 'return'],
  [/rally|tolerance/i, 'rally-10'],
  [/topspin/i, 'topspin-fh'],
  [/backhand/i, 'bh-drive'],
  [/volley|net/i, 'net-pos'],
  [/slice/i, 'slice'],
  [/footwork|recovery|movement|split|agility/i, 'footwork'],
  [/depth|height|heavy/i, 'depth'],
  [/forehand/i, 'fh-drive'],
  [/match|compete|competitive|\bset\b/i, 'construction'],
  [/reset|routine|pressure|mental/i, 'mental'],
  [/serve/i, 'serve-flat'],
]
const VALID_SKILLS = new Set(ALL_SKILLS.map(s => s.id))
function deriveSkills(text: string, cap = 4): string[] {
  const out: string[] = []
  for (const [re, id] of SKILL_KEYWORDS) {
    if (out.length >= cap) break
    if (re.test(text) && VALID_SKILLS.has(id) && !out.includes(id)) out.push(id)
  }
  return out
}

function homeworkText(review: DemoReview): string {
  if (!review.coachingNotes.homeworkSet) return 'Not set'
  const hw = review.transcriptExcerpts.find(e => /^\s*homework/i.test(e.text))
  if (hw) return hw.text.replace(/^\s*homework[:\s-]*/i, '')
  return 'Homework set during the session.'
}

// Build a Lesson Summary from a session, auto-populated from its AI Session
// Review when one exists; otherwise a skeleton from the plan.
export function lessonFromSession(session: TodaySession, review?: DemoReview | null): Lesson {
  const base = {
    id: sessionLessonId(session.id),
    playerId: session.playerId ?? '',
    player: session.player,
    date: todayLabel(),
    time: session.time,
    duration: session.mins,
    type: lessonType(session.type),
    court: session.court,
    focus: session.focus,
  }

  if (!review) {
    return {
      ...base,
      covered: [],
      takeaways: [],
      drills: session.drills ?? [],
      skillsWorked: deriveSkills(session.focus),
      homework: 'Not set',
      nextFocus: `Continue: ${session.focus}`,
      coachNote: 'No AI review recorded.',
      rating: 3,
    }
  }

  const covered = review.focusPointResults
    .filter(f => f.status === 'covered' || f.status === 'partial')
    .map(f => f.status === 'partial'
      ? `${f.point} (partial — ${firstSentence(f.note, 60).replace(/[.!?]+$/, '')})`
      : f.point)

  const takeaways = [
    ...review.focusPointResults
      .filter(f => f.status === 'partial' || f.status === 'missed')
      .map(f => f.note),
    firstSentence(review.coachingNotes.summary, 120),
  ]

  const drills = review.drillResults.filter(d => d.ran).map(d => d.drill)
  const cues = review.coachingNotes.cuesUsed.join(' ')
  const skillsWorked = deriveSkills(`${session.focus} ${cues}`)

  const total = review.focusPointResults.length || 1
  const score = review.focusPointResults.reduce(
    (a, f) => a + (f.status === 'covered' ? 1 : f.status === 'partial' ? 0.5 : 0), 0) / total
  const rating = Math.round((3.5 + score * 1.5) * 2) / 2

  return {
    ...base,
    covered,
    takeaways,
    drills,
    skillsWorked,
    homework: homeworkText(review),
    nextFocus: review.nextPlanDraft.focus,
    coachNote: review.coachingNotes.summary,
    rating,
  }
}
