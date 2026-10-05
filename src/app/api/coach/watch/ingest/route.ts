import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkEffortInput, EFFORT_LIMITS } from '@/lib/coach/effort-score'

// ─── Lumio Tennis Coach — smartwatch effort ingest ──────────────────────────
// A player's own watch posts a per-session EFFORT summary here (via an Apple
// Shortcut, or a future companion app). We authenticate by an opaque per-player
// `watch_token`, gate on wearable/biometric consent, turn the summary into
// effort / movement / consistency scores and XP, store the session and bump the
// player's XP total. There is deliberately NO court-position / heatmap data —
// consumer watch GPS can't produce it, so we don't pretend to.
//
// This route uses the service role (bypasses RLS) and must therefore do its own
// authorisation: a valid token → exactly one player → that player's coach.

type Payload = {
  token?: string
  source?: string
  started_at?: string
  duration_min?: number
  avg_hr?: number
  max_hr?: number
  active_kcal?: number
  distance_m?: number
}

const MIN_DURATION_MIN = 10   // anti-gaming: ignore trivially short "sessions"
const XP_CAP = 120            // anti-gaming: cap XP per session
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : null
}

// Map a value within [lo, hi] onto 0-100 (clamped).
function band(value: number, lo: number, hi: number) {
  if (hi <= lo) return 0
  return clamp(Math.round(((value - lo) / (hi - lo)) * 100))
}

function score(p: { duration: number; avgHr: number | null; maxHr: number | null; kcal: number | null; distance: number | null; age: number | null }) {
  const { duration, avgHr, kcal, distance, age } = p
  let estimated = false

  // ── Effort: HR intensity (vs estimated max HR) blended with calorie burn rate.
  const estMaxHr = age && age > 0 ? 220 - age : 195
  const kcalPerMin = kcal && duration ? kcal / duration : null
  const kcalComponent = kcalPerMin != null ? band(kcalPerMin, 4, 11) : null // 4/min low → 11/min high
  let hrComponent: number | null = null
  if (avgHr != null && avgHr >= 40 && avgHr <= 220) {
    const intensity = avgHr / estMaxHr           // ~0.5 easy → ~0.9 hard
    hrComponent = band(intensity, 0.5, 0.9)
  } else {
    estimated = true                              // no usable HR → estimated effort
  }
  let effort: number
  if (hrComponent != null && kcalComponent != null) effort = Math.round(0.6 * hrComponent + 0.4 * kcalComponent)
  else if (hrComponent != null) effort = hrComponent
  else if (kcalComponent != null) effort = kcalComponent
  else { effort = 40; estimated = true }          // nothing usable → neutral floor

  // ── Movement: distance per minute (outdoor). Indoors → fall back to calories.
  let movement: number
  if (distance != null && distance > 0 && duration) {
    const mPerMin = distance / duration
    // Sanity cap: sustained >60 m/min for a whole tennis session is implausible.
    movement = band(Math.min(mPerMin, 60), 10, 35) // 10/min low → 35/min high
  } else {
    movement = kcalComponent != null ? Math.round(kcalComponent * 0.8) : 35
    estimated = true
  }

  // ── Consistency: session length (attendance streaks added in Phase 1).
  const consistency = band(duration, 0, 60)

  // ── XP: weighted blend, capped. (Leaderboard age-normalisation is Phase 1.)
  const base = 0.5 * effort + 0.3 * movement + 0.2 * consistency
  const xp = Math.min(XP_CAP, Math.round(base))

  return { effort: clamp(effort), movement: clamp(movement), consistency: clamp(consistency), xp, estimated }
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// GET — Shortcut/app setup check: validate a token, return who it belongs to.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  const db = admin()
  if (!db) return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  const { data } = await db.from('coach_players')
    .select('id, name, consent_wearable').eq('watch_token', token).maybeSingle()
  if (!data) return NextResponse.json({ valid: false }, { status: 404 })
  const first = String((data as any).name || '').trim().split(/\s+/)[0] || 'Player'
  return NextResponse.json({ valid: true, player: first, consent: !!(data as any).consent_wearable })
}

// POST — ingest one watch session.
export async function POST(req: NextRequest) {
  const db = admin()
  if (!db) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const body = (await req.json().catch(() => ({}))) as Payload
  const token = String(body.token || '').trim()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  // Resolve the player (and therefore the coach) from the token.
  const { data: player } = await db.from('coach_players')
    .select('id, coach_id, name, age, consent_wearable')
    .eq('watch_token', token).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  // Consent gate — biometric data for a (possibly minor) player needs consent.
  if (!(player as any).consent_wearable) {
    return NextResponse.json({ error: 'Wearable consent not recorded for this player' }, { status: 403 })
  }

  // Believable values only (the shared limits in effort-score.ts): a session of
  // 999,999 minutes dated 2099 used to be stored and scored as it came.
  const input = checkEffortInput(body, MIN_DURATION_MIN)
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 })
  const duration = input.duration
  const distance = input.distance

  // A watch with no reading sends 0 or nothing: that is "no reading", not an
  // error. Anything else outside what a body can do is refused.
  const reading = (v: unknown, lo: number, hi: number): number | null | 'bad' => {
    const n = num(v)
    if (n == null || n === 0) return null
    return n < lo || n > hi ? 'bad' : Math.round(n)
  }
  const avgHr = reading(body.avg_hr, 30, 250)
  const maxHr = reading(body.max_hr, 30, 250)
  const kcal = reading(body.active_kcal, 1, 10_000)
  if (avgHr === 'bad' || maxHr === 'bad') return NextResponse.json({ error: 'Heart rate should be between 30 and 250.' }, { status: 422 })
  if (kcal === 'bad') return NextResponse.json({ error: 'Calories should be between 0 and 10,000.' }, { status: 422 })
  const age = num((player as any).age)

  const s = score({ duration, avgHr, maxHr, kcal, distance, age })

  // 'manual' is the typed-in kind and has its own daily limit; a watch cannot
  // claim to be one.
  const source = String(body.source || '').trim().slice(0, 40)
  // The token is the secret that lets a watch post for this player. It is not
  // kept with the session.
  const { token: _token, ...raw } = body
  void _token

  // Saved and counted in one step in the database (migration 195): the same
  // workout (same player, same start time) is counted once however many times
  // the watch sends it, the daily limit holds, and the XP total is added to
  // rather than read and written back.
  const { data, error } = await db.rpc('lumio_log_effort', {
    p_coach: (player as any).coach_id, p_player: (player as any).id,
    p_source: !source || source === 'manual' ? 'apple_watch' : source, p_started: input.startedAt,
    p_duration: duration, p_avg_hr: avgHr, p_max_hr: maxHr, p_kcal: kcal, p_distance: distance,
    p_effort: s.effort, p_movement: s.movement, p_consistency: s.consistency, p_xp: s.xp, p_estimated: s.estimated,
    p_raw: raw, p_daily_cap: EFFORT_LIMITS.watchPerDay,
  })
  const out = (data || {}) as { status?: string; xp_total?: number }
  if (error || !out.status || out.status === 'no_player') { console.error('[coach/watch/ingest]', error?.message || out.status); return NextResponse.json({ error: 'Could not save session' }, { status: 500 }) }
  if (out.status === 'cap') return NextResponse.json({ error: `${EFFORT_LIMITS.watchPerDay} watch sessions are already recorded for that day, which is the most that count.` }, { status: 429 })
  // Already recorded: answer 200 so a watch that retries does not keep trying,
  // but award nothing.
  const duplicate = out.status === 'duplicate'

  return NextResponse.json({
    ok: true,
    duplicate,
    player: String((player as any).name || '').trim().split(/\s+/)[0] || 'Player',
    scores: { effort: s.effort, movement: s.movement, consistency: s.consistency },
    xp_awarded: duplicate ? 0 : s.xp,
    xp_total: out.xp_total ?? null,
    estimated: s.estimated,
  })
}
