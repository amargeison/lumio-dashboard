// Live racket grading for the demo. Lets a coach grade a player's skills and
// advance their working racket; everything (progress %, skills earned, racket
// distribution, the roster card and the Racket Progression module) reads through
// the resolvers here so a grade change ripples across the whole demo.
// localStorage + a window event, like the other coach demo stores.

import { BELTS, skillScore, type Player } from './coach-data'

const GKEY = 'lumio_coach_grades'         // { "playerId:beltIndex:skillIdx": score 0-4 }
const BKEY = 'lumio_coach_belt_override'  // { "playerId": beltIndex }
const EVT = 'lumio-coach-grades-changed'

function read(key: string): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as Record<string, number> : {} } catch { return {} }
}
function write(key: string, obj: Record<string, number>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(obj)) } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

const gKey = (pid: string, bi: number, si: number) => `${pid}:${bi}:${si}`

// A player's working racket — an override (from advancing) wins over the static index.
export function currentBeltOf(p: Player): number {
  const o = read(BKEY)[p.id]
  return typeof o === 'number' ? o : p.beltIndex
}

// A single skill's score — a coach-set grade wins over the procedural default.
export function skillScoreFor(p: Player, beltIndex: number, skillIdx: number): number {
  const g = read(GKEY)[gKey(p.id, beltIndex, skillIdx)]
  if (typeof g === 'number') return g
  return skillScore(p.seed, beltIndex, skillIdx, currentBeltOf(p))
}

export function setGrade(p: Player, beltIndex: number, skillIdx: number, score: number) {
  write(GKEY, { ...read(GKEY), [gKey(p.id, beltIndex, skillIdx)]: Math.max(0, Math.min(4, score)) })
}
export function setBelt(p: Player, beltIndex: number) {
  write(BKEY, { ...read(BKEY), [p.id]: Math.max(0, Math.min(BELTS.length - 1, beltIndex)) })
}

// % of the working racket's skills at Consistent (3) or higher.
export function beltProgressFor(p: Player, beltIndex: number = currentBeltOf(p)): number {
  const belt = BELTS[beltIndex]
  if (!belt || !belt.skills.length) return 0
  const done = belt.skills.filter((_s, si) => skillScoreFor(p, beltIndex, si) >= 3).length
  return Math.round((done / belt.skills.length) * 100)
}

// Total skills mastered (>=3) across earned rackets + the working racket.
export function skillsEarnedFor(p: Player): number {
  const cur = currentBeltOf(p)
  let n = 0
  for (let bi = 0; bi <= cur; bi++) {
    const belt = BELTS[bi]; if (!belt) continue
    n += belt.skills.filter((_s, si) => bi < cur ? true : skillScoreFor(p, bi, si) >= 3).length
  }
  return n
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
