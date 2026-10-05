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

// ── What counts as a believable session ─────────────────────────────────────
// One set of limits for all three ways a session arrives (the family's "Log a
// session", the coach's, and the smartwatch). Without them a 100,000-minute
// session dated 2099 was accepted and scored, and XP could be raised at will.
// The daily caps are enforced in the database (lumio_log_effort, migration
// 195), where two logs landing together cannot both slip under them.
export const EFFORT_LIMITS = {
  maxDurationMin: 300,      // five hours: longer than any one session
  maxDistanceM: 30_000,     // 30 km
  maxAgeDays: 30,           // how far back a session may be dated
  // A family logging for their own child gets a shorter reach: three a day for
  // thirty days back was still ninety sessions' XP in one sitting. The coach's
  // own logging keeps the limits above.
  familyMaxAgeDays: 7,      // how far back a family may date a session
  familyPerWeek: 14,        // sessions a family may log in any seven days
  manualPerDay: 3,          // typed-in sessions per player per day
  watchPerDay: 6,           // watch sessions per player per day
}

const asNumber = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : null
}

/** Checks duration, distance and date. Returns the cleaned values, or a
    sentence to show the person saying what to change. */
export function checkEffortInput(input: { duration_min?: unknown; distance_m?: unknown; started_at?: unknown }, minDuration = MANUAL_MIN_DURATION_MIN, maxAgeDays = EFFORT_LIMITS.maxAgeDays):
  { ok: true; duration: number; distance: number | null; startedAt: string } | { ok: false; error: string } {
  const duration = asNumber(input.duration_min)
  if (duration == null) return { ok: false, error: 'Enter how many minutes the session lasted.' }
  if (duration < minDuration) return { ok: false, error: `Sessions shorter than ${minDuration} minutes are not counted.` }
  if (duration > EFFORT_LIMITS.maxDurationMin) return { ok: false, error: `That is longer than ${EFFORT_LIMITS.maxDurationMin / 60} hours. Enter the minutes for one session.` }

  let distance: number | null = null
  if (input.distance_m !== undefined && input.distance_m !== null && input.distance_m !== '') {
    distance = asNumber(input.distance_m)
    if (distance == null || distance < 0 || distance > EFFORT_LIMITS.maxDistanceM) {
      return { ok: false, error: `Distance should be a number between 0 and ${EFFORT_LIMITS.maxDistanceM / 1000} km. Leave it empty if you are not sure.` }
    }
  }

  let started = new Date()
  if (input.started_at !== undefined && input.started_at !== null && input.started_at !== '') {
    started = new Date(String(input.started_at))
    if (Number.isNaN(started.getTime())) return { ok: false, error: 'That date does not look right.' }
    // Ten minutes of grace for a phone or watch whose clock runs fast.
    if (started.getTime() > Date.now() + 10 * 60_000) return { ok: false, error: 'A session cannot be logged for a time that has not happened yet.' }
    if (started.getTime() < Date.now() - maxAgeDays * 86_400_000) return { ok: false, error: `Sessions can be logged up to ${maxAgeDays} days back.` }
  }
  return { ok: true, duration: Math.round(duration * 10) / 10, distance: distance == null ? null : Math.round(distance), startedAt: started.toISOString() }
}
