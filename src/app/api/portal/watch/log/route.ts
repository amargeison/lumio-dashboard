import { NextRequest, NextResponse } from 'next/server'
import { familyAccess, scopedDb } from '@/lib/coach/membership'
import { scoreManualSession, checkEffortInput, EFFORT_LIMITS, MANUAL_MIN_DURATION_MIN } from '@/lib/coach/effort-score'

export const runtime = 'nodejs'

// ─── Manual session log (student/parent portal) ─────────────────────────────
// The universal, all-device, all-ages path into Effort & Rewards: the player (or
// parent) self-reports a finished session — how long, and how hard it felt
// (RPE 1–10) — and optionally a rough distance. We turn that into the SAME
// effort / movement / consistency + XP shape the smartwatch ingest produces, so
// the coach and student dashboards render it identically. Always flagged
// `estimated` and source `manual`.
//
// SECURITY: bound to the caller's membership for the player named in the
// request. A parent can only ever log for their own child, within their own
// academy.
//
// NOTE: this collects NO biometric data (no heart rate) — it's self-reported
// effort — so it is deliberately NOT gated on `consent_wearable` (which governs
// processing watch HR data). That keeps the reward loop open for every family.

// The whole value has to be a number: "8abc" used to be read as 8.
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : null
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    duration_min?: number; perceived_effort?: number; distance_m?: number; note?: string; started_at?: string; playerId?: string
  }
  // Which child: the one picked at the top of the page, checked against the
  // caller's own memberships.
  const access = await familyAccess(body.playerId)
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m

  // A family may date a session up to a week back — enough for "I forgot to
  // log Saturday", not enough to fill a month in one go.
  const input = checkEffortInput(body, MANUAL_MIN_DURATION_MIN, EFFORT_LIMITS.familyMaxAgeDays)
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 })
  const rpe = num(body.perceived_effort)
  if (rpe == null || rpe < 1 || rpe > 10) {
    return NextResponse.json({ error: 'Tell us how hard it felt (1–10)' }, { status: 422 })
  }

  const s = scoreManualSession({ duration: input.duration, rpe, distance: input.distance })

  // Saved and counted in one step in the database (migration 195): the session
  // row, the daily limit, the "same session sent twice" check and the XP total
  // all happen under one lock, so two logs landing together cannot lose XP or
  // both squeeze under the limit. It also checks the player belongs to this
  // academy. The family's weekly limit is counted under the same lock
  // (lumio_log_family_effort, migration 207): the daily limit alone let
  // somebody back-date three sessions a day, every day.
  const db = scopedDb()
  const { data, error } = await db.rpc('lumio_log_family_effort', {
    p_coach: m.academyId, p_player: m.scopePlayerId, p_source: 'manual', p_started: input.startedAt,
    p_duration: input.duration, p_avg_hr: null, p_max_hr: null, p_kcal: null, p_distance: input.distance,
    p_effort: s.effort, p_movement: s.movement, p_consistency: s.consistency, p_xp: s.xp, p_estimated: true,
    p_raw: { manual: true, perceived_effort: rpe, note: String(body.note || '').slice(0, 280) || null },
    p_daily_cap: EFFORT_LIMITS.manualPerDay, p_weekly_cap: EFFORT_LIMITS.familyPerWeek,
  })
  const out = (data || {}) as { status?: string; xp_total?: number }
  if (error || !out.status) { console.error('[portal/watch/log]', error?.message); return NextResponse.json({ error: 'The session could not be saved. Please try again.' }, { status: 500 }) }
  if (out.status === 'no_player') return NextResponse.json({ error: 'This player is no longer on the academy\u2019s roster.' }, { status: 404 })
  if (out.status === 'cap') {
    return NextResponse.json({ error: `${EFFORT_LIMITS.manualPerDay} sessions are already logged for that day, which is the most that count. If one is wrong, ask your coach to remove it.` }, { status: 429 })
  }
  if (out.status === 'week_cap') {
    return NextResponse.json({ error: `${EFFORT_LIMITS.familyPerWeek} sessions have been logged in the last 7 days, which is the most that count. If there were more, ask your coach to add them.` }, { status: 429 })
  }
  // The same session sent twice (a double tap): it is already saved, so say so
  // rather than count it again.
  const duplicate = out.status === 'duplicate'

  return NextResponse.json({
    ok: true,
    duplicate,
    scores: { effort: s.effort, movement: s.movement, consistency: s.consistency },
    xp_awarded: duplicate ? 0 : s.xp,
    xp_total: out.xp_total ?? null,
  })
}
