// Shared Effort & Rewards helpers — the smartwatch reward system's OWN ladder.
// Deliberately separate from Racket Progression (coach-assessed, LTA Youth
// mapped). XP here is a motivation currency and never advances a racket.

import type { GpsSession } from './gps-video-data'

export type EffortScore = {
  effort: number; movement: number; consistency: number; xp: number
  avgHr: number | null; distKm: number; dur: number
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// Derive the three scores + XP from a session's effort metrics. Used for demo
// data (GpsSession); the live ingest route computes the same fields server-side.
export function scoreGpsSession(s: GpsSession, age: number): EffortScore {
  const distM = s.distance * 1000
  const dur = s.duration
  const hrs = (s.hrBySet ?? []).map(h => h.avg).filter(Boolean)
  const avgHr = hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null
  const estMax = age ? 220 - age : 200
  const hrInt = avgHr ? clamp01((avgHr / estMax - 0.5) / 0.4) : null
  const loadComp = clamp01(s.load / 100)
  const effort = Math.round(100 * (hrInt != null ? 0.6 * hrInt + 0.4 * loadComp : loadComp))
  const mPerMin = dur ? distM / dur : 0
  const movement = Math.round(100 * clamp01((Math.min(mPerMin, 90) - 15) / 60))
  const consistency = Math.round(100 * clamp01(dur / 60))
  const xp = Math.min(120, Math.round(0.5 * effort + 0.3 * movement + 0.2 * consistency))
  return { effort, movement, consistency, xp, avgHr, distKm: s.distance, dur }
}

export const EFFORT_LEVELS = [
  { name: 'Rookie', min: 0 },
  { name: 'Mover', min: 300 },
  { name: 'Grinder', min: 800 },
  { name: 'Competitor', min: 1500 },
  { name: 'Athlete', min: 2500 },
  { name: 'Elite', min: 4000 },
]

export function levelFor(xp: number) {
  let idx = 0
  for (let i = 0; i < EFFORT_LEVELS.length; i++) if (xp >= EFFORT_LEVELS[i].min) idx = i
  const cur = EFFORT_LEVELS[idx], next = EFFORT_LEVELS[idx + 1]
  const pct = next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100
  return { idx, cur, next, pct }
}

export type Band = 'high' | 'medium' | 'low'
export const band = (n: number): Band => (n >= 70 ? 'high' : n >= 40 ? 'medium' : 'low')
export const bandLabel = (n: number) => (n >= 70 ? 'High' : n >= 40 ? 'Medium' : 'Low')
