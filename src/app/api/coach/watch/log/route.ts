import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { scoreManualSession, checkEffortInput, EFFORT_LIMITS } from '@/lib/coach/effort-score'

export const runtime = 'nodejs'

// ─── Coach-side manual session log ──────────────────────────────────────────
// Lets the COACH record a session's effort for one of their own players from the
// Effort & Rewards page — no watch, no player app needed. The coach ran the
// session, so they can log how long it was and how hard the player worked
// (RPE 1–10). Scored the same way as the player-app log and the smartwatch
// ingest, so it lands in the same coach_watch_sessions / XP flow.
//
// Auth = the coach's own Supabase session; the player is read through row level
// security, so a coach can only log for a player they are allowed to see.
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

  const input = checkEffortInput(body)
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 })
  const rpe = num(body.perceived_effort)
  if (rpe == null || rpe < 1 || rpe > 10) {
    return NextResponse.json({ error: 'Set how hard it felt (1–10)' }, { status: 422 })
  }

  // The player must be one this coach may see: read with THEIR session, so row
  // level security decides (the head coach sees the roster, an assistant sees
  // their own players). The row also says which academy the player belongs to —
  // the session is filed under that, never under the caller's own user id.
  const { data: player } = await supabase
    .from('coach_players')
    .select('id, coach_id')
    .eq('id', playerId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const s = scoreManualSession({ duration: input.duration, rpe, distance: input.distance })

  // Saved and counted in one step in the database (migration 195) — see the
  // family's route for why. The read-then-write this replaces lost XP whenever
  // two logs for one player landed together.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data, error } = await admin.rpc('lumio_log_effort', {
    p_coach: player.coach_id, p_player: player.id, p_source: 'manual', p_started: input.startedAt,
    p_duration: input.duration, p_avg_hr: null, p_max_hr: null, p_kcal: null, p_distance: input.distance,
    p_effort: s.effort, p_movement: s.movement, p_consistency: s.consistency, p_xp: s.xp, p_estimated: true,
    p_raw: { manual: true, logged_by: 'coach', perceived_effort: rpe, note: String(body.note || '').slice(0, 280) || null },
    p_daily_cap: EFFORT_LIMITS.manualPerDay,
  })
  const out = (data || {}) as { status?: string; xp_total?: number }
  if (error || !out.status) { console.error('[coach/watch/log]', error?.message); return NextResponse.json({ error: 'The session could not be saved. Please try again.' }, { status: 500 }) }
  if (out.status === 'no_player') return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  if (out.status === 'cap') {
    return NextResponse.json({ error: `This player already has ${EFFORT_LIMITS.manualPerDay} sessions logged for that day, which is the most that count.` }, { status: 429 })
  }
  const duplicate = out.status === 'duplicate'

  return NextResponse.json({
    ok: true,
    duplicate,
    scores: { effort: s.effort, movement: s.movement, consistency: s.consistency },
    xp_awarded: duplicate ? 0 : s.xp,
    xp_total: out.xp_total ?? null,
  })
}
