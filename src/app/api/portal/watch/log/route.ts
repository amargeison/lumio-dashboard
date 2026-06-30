import { NextRequest, NextResponse } from 'next/server'
import { getMembership, scopedDb } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// ─── Manual session log (student/parent portal) ─────────────────────────────
// The universal, all-device, all-ages path into Effort & Rewards: the player (or
// parent) self-reports a finished session — how long, and how hard it felt
// (RPE 1–10) — and optionally a rough distance. We turn that into the SAME
// effort / movement / consistency + XP shape the smartwatch ingest produces, so
// the coach and student dashboards render it identically. Always flagged
// `estimated` and source `manual`.
//
// SECURITY: bound to the caller's membership and its ONE scoped player. A parent
// can only ever log for their own child, within their own academy.
//
// NOTE: this collects NO biometric data (no heart rate) — it's self-reported
// effort — so it is deliberately NOT gated on `consent_wearable` (which governs
// processing watch HR data). That keeps the reward loop open for every family.

const MIN_DURATION_MIN = 10   // anti-gaming: ignore trivially short "sessions"
const XP_CAP = 120            // matches the watch ingest cap
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : null
}
function band(value: number, lo: number, hi: number) {
  if (hi <= lo) return 0
  return clamp(Math.round(((value - lo) / (hi - lo)) * 100))
}

// Score a self-reported session. RPE drives effort; distance (if given) drives
// movement, else it tracks effort; consistency is session length.
function score(p: { duration: number; rpe: number; distance: number | null }) {
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

export async function POST(req: NextRequest) {
  const m = await getMembership()
  if (!m) return NextResponse.json({ error: 'No access' }, { status: 403 })
  if (m.role !== 'parent' && m.role !== 'student') return NextResponse.json({ error: 'Wrong portal' }, { status: 403 })
  if (!m.scopePlayerId) return NextResponse.json({ error: 'No player assigned' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as {
    duration_min?: number; perceived_effort?: number; distance_m?: number; note?: string; started_at?: string
  }

  const duration = num(body.duration_min) ?? 0
  if (duration < MIN_DURATION_MIN) {
    return NextResponse.json({ error: `Session too short (min ${MIN_DURATION_MIN} min)` }, { status: 422 })
  }
  const rpe = num(body.perceived_effort)
  if (rpe == null || rpe < 1 || rpe > 10) {
    return NextResponse.json({ error: 'Tell us how hard it felt (1–10)' }, { status: 422 })
  }
  const distance = num(body.distance_m)

  const db = scopedDb()
  // The one player — must belong to this academy AND be the scoped player.
  const { data: player } = await db.from('coach_players')
    .select('id, coach_id, xp_total')
    .eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const s = score({ duration, rpe, distance })

  const { error: insErr } = await db.from('coach_watch_sessions').insert({
    coach_id: m.academyId,
    player_id: m.scopePlayerId,
    source: 'manual',
    started_at: body.started_at || new Date().toISOString(),
    duration_min: duration,
    avg_hr: null,
    max_hr: null,
    distance_m: distance,
    effort_score: s.effort,
    movement_score: s.movement,
    consistency_score: s.consistency,
    xp_awarded: s.xp,
    estimated: true,
    raw: { manual: true, perceived_effort: rpe, note: (body.note || '').slice(0, 280) || null },
  })
  if (insErr) { console.error('[portal/watch/log]', insErr.message); return NextResponse.json({ error: 'Could not save session' }, { status: 500 }) }

  // Bump the player's running XP total.
  const newTotal = (Number((player as any).xp_total) || 0) + s.xp
  await db.from('coach_players').update({ xp_total: newTotal }).eq('id', m.scopePlayerId)

  return NextResponse.json({
    ok: true,
    scores: { effort: s.effort, movement: s.movement, consistency: s.consistency },
    xp_awarded: s.xp,
    xp_total: newTotal,
  })
}
