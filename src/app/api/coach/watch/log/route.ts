import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { scoreManualSession, MANUAL_MIN_DURATION_MIN } from '@/lib/coach/effort-score'

export const runtime = 'nodejs'

// ─── Coach-side manual session log ──────────────────────────────────────────
// Lets the COACH record a session's effort for one of their own players from the
// Effort & Rewards page — no watch, no player app needed. The coach ran the
// session, so they can log how long it was and how hard the player worked
// (RPE 1–10). Scored the same way as the player-app log and the smartwatch
// ingest, so it lands in the same coach_watch_sessions / XP flow.
//
// Auth = the coach's own Supabase session; RLS scopes to coach_id = auth.uid().
// No biometric (HR) data → no wearable-consent gate (that's only for watch sync).

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : null
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    player_id?: string; duration_min?: number; perceived_effort?: number; distance_m?: number; note?: string; started_at?: string
  }

  const playerId = String(body.player_id || '').trim()
  if (!playerId) return NextResponse.json({ error: 'Pick a player' }, { status: 422 })

  const duration = num(body.duration_min) ?? 0
  if (duration < MANUAL_MIN_DURATION_MIN) {
    return NextResponse.json({ error: `Session too short (min ${MANUAL_MIN_DURATION_MIN} min)` }, { status: 422 })
  }
  const rpe = num(body.perceived_effort)
  if (rpe == null || rpe < 1 || rpe > 10) {
    return NextResponse.json({ error: 'Set how hard it felt (1–10)' }, { status: 422 })
  }
  const distance = num(body.distance_m)

  // The player must belong to this coach (RLS enforces coach_id = auth.uid()).
  const { data: player } = await supabase
    .from('coach_players')
    .select('id, xp_total')
    .eq('id', playerId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const s = scoreManualSession({ duration, rpe, distance })

  const { error: insErr } = await supabase.from('coach_watch_sessions').insert({
    coach_id: user.id,
    player_id: playerId,
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
    raw: { manual: true, logged_by: 'coach', perceived_effort: rpe, note: (body.note || '').slice(0, 280) || null },
  })
  if (insErr) { console.error('[coach/watch/log]', insErr.message); return NextResponse.json({ error: 'Could not save session' }, { status: 500 }) }

  const newTotal = (Number((player as any).xp_total) || 0) + s.xp
  await supabase.from('coach_players').update({ xp_total: newTotal }).eq('id', playerId)

  return NextResponse.json({
    ok: true,
    scores: { effort: s.effort, movement: s.movement, consistency: s.consistency },
    xp_awarded: s.xp,
    xp_total: newTotal,
  })
}
