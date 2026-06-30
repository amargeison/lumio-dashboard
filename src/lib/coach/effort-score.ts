// Shared manual-session scoring — used by BOTH the player/parent portal log
// (/api/portal/watch/log) and the coach-side "Log a session" control
// (/api/coach/watch/log). Self-reported effort (RPE 1–10) + duration (+ optional
// distance) → the same effort / movement / consistency + XP shape the smartwatch
// ingest produces, so every Effort & Rewards surface renders it identically.

export const MANUAL_MIN_DURATION_MIN = 10   // anti-gaming: ignore trivially short sessions
const XP_CAP = 120                          // matches the watch ingest cap

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
function band(value: number, lo: number, hi: number) {
  if (hi <= lo) return 0
  return clamp(Math.round(((value - lo) / (hi - lo)) * 100))
}

export function scoreManualSession(p: { duration: number; rpe: number; distance: number | null }) {
  const effort = clamp(Math.round(p.rpe * 10))                 // RPE 1–10 → 10–100
  let movement: number
  if (p.distance != null && p.distance > 0 && p.duration) {
    const mPerMin = p.distance / p.duration
    movement = band(Math.min(mPerMin, 60), 10, 35)
  } else {
    movement = clamp(Math.round(effort * 0.8))
  }
  const consistency = band(p.duration, 0, 60)
  const xp = Math.min(XP_CAP, Math.round(0.5 * effort + 0.3 * movement + 0.2 * consistency))
  return { effort, movement, consistency, xp }
}
