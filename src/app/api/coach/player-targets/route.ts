import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
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
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(user.id)) return notAnAcademy()

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
      // `level` — NOT `standard`, which has never existed on this table. Asking
      // for a column that is not there makes PostgREST return an error and no
      // rows, so every single request answered "Player not found" for a player
      // sitting right there on the roster. The targets button has never worked.
      .select('id, name, age, racket_stage, level, category, goal')
      .eq('id', playerId).maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    // The skills matrix is the evidence. Without it the targets are guesswork
    // dressed up as coaching, so the weakest skills go in explicitly rather than
    // relying on the narrative context to surface them.
    const { data: skills } = await supabase
      .from('coach_player_skills')
      .select('skill, score')
      .eq('player_id', playerId)
    // Grades run 1 to 4 and 4 means mastered. Only graded skills count as
    // evidence, a mastered skill is not a weakness, and a skill is never listed
    // as both weakest and strongest (with four skills graded, it used to be).
    const scored = (skills ?? [])
      .filter(s => s.skill && (Number(s.score) || 0) > 0)
      .sort((a, b) => (Number(a.score) || 0) - (Number(b.score) || 0))
    const weakest = scored.filter(s => Number(s.score) < 4).slice(0, 6)
    const strongest = scored.filter(s => Number(s.score) >= 3 && !weakest.includes(s)).slice(-3).reverse()
    const grade = (s: { skill: string; score: number | null }) => `${s.skill}: ${s.score}/4`

    const context = await buildPlayerContext(supabase, player.name, playerId)

    const task = playerTargetsTask({
      playerName: player.name,
      age: player.age ?? null,
      stage: player.racket_stage ?? null,
      standard: player.level ?? player.category ?? null,
      goal: player.goal ?? null,
      // The coach's private roster note is never sent: the family reads these targets.
      notes: null,
      weakest: weakest.map(grade),
      strongest: strongest.map(grade),
      context,
    })

    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 1200 })
    const out = extractJson<Out>(text, {})

    // Three is what is asked for, so three is the most that is kept. Only plain
    // text counts: a reply with a list or an object where a sentence should be
    // used to be saved as "[object Object]", replacing three good targets. Such
    // a target is dropped; if none are usable the request fails below and the
    // targets the player already has are left alone.
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
    const targets = (Array.isArray(out.targets) ? out.targets : [])
      .filter(t => t && str(t.target, 200))
      .slice(0, 3)
      .map(t => ({
        target: str(t.target, 200),
        why: str(t.why, 300),
        measure: str(t.measure, 200),
        by: str(t.by, 60),
      }))
    if (targets.length === 0) throw new Error('no targets returned')

    const note = str(out.note, 400)

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
