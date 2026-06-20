import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const duration = num(body.duration_min) ?? 0
  if (duration < MIN_DURATION_MIN) {
    return NextResponse.json({ error: `Session too short (min ${MIN_DURATION_MIN} min)` }, { status: 422 })
  }

  const avgHr = num(body.avg_hr)
  const maxHr = num(body.max_hr)
  const kcal = num(body.active_kcal)
  const distance = num(body.distance_m)
  const age = num((player as any).age)

  const s = score({ duration, avgHr, maxHr, kcal, distance, age })

  const { error: insErr } = await db.from('coach_watch_sessions').insert({
    coach_id: (player as any).coach_id,
    player_id: (player as any).id,
    source: body.source || 'apple_watch',
    started_at: body.started_at || new Date().toISOString(),
    duration_min: duration,
    avg_hr: avgHr,
    max_hr: maxHr,
    active_kcal: kcal,
    distance_m: distance,
    effort_score: s.effort,
    movement_score: s.movement,
    consistency_score: s.consistency,
    xp_awarded: s.xp,
    estimated: s.estimated,
    raw: body,
  })
  if (insErr) { console.error('[coach/watch/ingest]', insErr.message); return NextResponse.json({ error: 'Could not save session' }, { status: 500 }) }

  // Bump the player's running XP total (atomic-ish read-modify-write; fine for
  // the pilot volume — move to an RPC/trigger if contention ever matters).
  const { data: cur } = await db.from('coach_players').select('xp_total').eq('id', (player as any).id).maybeSingle()
  const newTotal = (Number((cur as any)?.xp_total) || 0) + s.xp
  await db.from('coach_players').update({ xp_total: newTotal }).eq('id', (player as any).id)

  return NextResponse.json({
    ok: true,
    player: String((player as any).name || '').trim().split(/\s+/)[0] || 'Player',
    scores: { effort: s.effort, movement: s.movement, consistency: s.consistency },
    xp_awarded: s.xp,
    xp_total: newTotal,
    estimated: s.estimated,
  })
}
