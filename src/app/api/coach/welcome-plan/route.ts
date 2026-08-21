import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent, extractJson, buildPlayerContext } from '@/lib/coach/agent'
import { welcomePlanTask } from '@/lib/coach/agent-persona'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

// The starting plan inside a new player's Welcome Pack, written by Lumio Coach.
//
// It used to be a fixed four-row table: week 1 assessment, week 2 "foundations
// of <stage theme>", week 3 build and repeat, week 4 progress check. Identical
// for every player at a given racket, whatever their age, goal or history. This
// is the first document a family is handed, and it read like a form letter
// because it was one.
//
// The player is read server-side from the id, so the plan is built on the real
// record rather than whatever the browser felt like describing.

type Plan = {
  welcome?: string
  weeks?: { week?: string; focus?: string }[]
  first_session?: string
  parent_note?: string
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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

  const gate = rateLimit(`welcome-plan:${user.id}`, 30, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  const { playerId } = (await req.json().catch(() => ({}))) as { playerId?: string }
  if (!playerId) return NextResponse.json({ error: 'playerId is required' }, { status: 400 })

  try {
    // RLS scopes this to the coach's own roster.
    const { data: player } = await supabase
      .from('coach_players')
      .select('name, age, racket_stage, standard, goal, level, notes')
      .eq('id', playerId).maybeSingle()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('sports_profiles').select('display_name, brand_name').eq('id', user.id).maybeSingle()

    // A brand-new player has no history, and that is the normal case for a
    // welcome pack — buildPlayerContext returns '' and the plan is written from
    // the stage, age and goal alone. A player being handed one late (a transfer,
    // a returning junior) does have history, and it gets used.
    const context = await buildPlayerContext(supabase, player.name)

    const task = welcomePlanTask({
      playerName: player.name,
      age: player.age ?? null,
      stage: player.racket_stage ?? null,
      standard: player.standard ?? null,
      goal: player.goal ?? null,
      notes: player.notes ?? null,
      academy: profile?.brand_name || 'the academy',
      coachName: profile?.display_name || 'your coach',
      context,
    })

    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 1200 })
    const plan = extractJson<Plan>(text, {})

    const weeks = (plan.weeks || [])
      .filter(w => w && (w.week || w.focus))
      .slice(0, 6)
      .map((w, i) => ({ week: String(w.week || `Week ${i + 1}`).slice(0, 30), focus: String(w.focus || '').slice(0, 300) }))

    // A welcome pack with no plan in it is worse than the old template, so if
    // Lumio Coach came back empty the caller is told and keeps the template.
    if (weeks.length === 0) throw new Error('no weeks returned')

    return NextResponse.json({
      welcome: String(plan.welcome || '').slice(0, 800),
      weeks,
      first_session: String(plan.first_session || '').slice(0, 500),
      parent_note: String(plan.parent_note || '').slice(0, 600),
    })
  } catch (err) {
    console.error('[coach/welcome-plan]', err)
    return NextResponse.json({ error: 'Lumio Coach could not write the welcome plan just now.' }, { status: 500 })
  }
}
