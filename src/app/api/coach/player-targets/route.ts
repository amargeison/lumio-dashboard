import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent, extractJson, buildPlayerContext } from '@/lib/coach/agent'
import { playerTargetsTask } from '@/lib/coach/agent-persona'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

// Development targets for one player, set by Lumio Coach.
//
// Camps have had per-player targets since the camps overhaul. Individual players
// had nowhere to record what they are working towards — so the skills matrix,
// the attendance and every lesson summary all existed without anything tying
// them to an outcome. This is the missing half: what this block is FOR.
//
// Persisted, because a target the coach cannot see next week is not a target.

type Target = { target?: string; why?: string; measure?: string; by?: string }
type Out = { targets?: Target[]; note?: string }

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

  const gate = rateLimit(`player-targets:${user.id}`, 20, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  const { playerId } = (await req.json().catch(() => ({}))) as { playerId?: string }
  if (!playerId) return NextResponse.json({ error: 'playerId is required' }, { status: 400 })

  try {
    // RLS keeps this to the coach's own roster.
    const { data: player } = await supabase
      .from('coach_players')
      .select('id, name, age, racket_stage, standard, goal, notes')
      .eq('id', playerId).maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    // The skills matrix is the evidence. Without it the targets are guesswork
    // dressed up as coaching, so the weakest skills go in explicitly rather than
    // relying on the narrative context to surface them.
    const { data: skills } = await supabase
      .from('coach_player_skills')
      .select('skill, score')
      .eq('player_id', playerId)
    const scored = (skills ?? [])
      .filter(s => s.skill)
      .sort((a, b) => (Number(a.score) || 0) - (Number(b.score) || 0))

    const context = await buildPlayerContext(supabase, player.name)

    const task = playerTargetsTask({
      playerName: player.name,
      age: player.age ?? null,
      stage: player.racket_stage ?? null,
      standard: player.standard ?? null,
      goal: player.goal ?? null,
      notes: player.notes ?? null,
      weakest: scored.slice(0, 6).map(s => `${s.skill}: ${s.score ?? 0}/5`),
      strongest: scored.slice(-3).reverse().map(s => `${s.skill}: ${s.score ?? 0}/5`),
      context,
    })

    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 1200 })
    const out = extractJson<Out>(text, {})

    const targets = (out.targets || [])
      .filter(t => t && t.target)
      .slice(0, 4)
      .map(t => ({
        target: String(t.target).slice(0, 200),
        why: String(t.why || '').slice(0, 300),
        measure: String(t.measure || '').slice(0, 200),
        by: String(t.by || '').slice(0, 60),
      }))
    if (targets.length === 0) throw new Error('no targets returned')

    const note = String(out.note || '').slice(0, 400)

    // Saved straight away. A target the coach has to remember to save is a target
    // that does not exist by Thursday. They can edit or clear them in the UI.
    await supabase.from('coach_players').update({
      targets, targets_note: note,
      targets_set_at: new Date().toISOString(),
      targets_by: 'lumio-coach',
    }).eq('id', playerId)

    return NextResponse.json({ targets, note })
  } catch (err) {
    console.error('[coach/player-targets]', err)
    return NextResponse.json({ error: 'Lumio Coach could not set targets just now.' }, { status: 500 })
  }
}
