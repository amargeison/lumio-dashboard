import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent, extractJson, buildPlayerContext } from '@/lib/coach/agent'
import { sessionPlanTask } from '@/lib/coach/agent-persona'

export const maxDuration = 120

// Builds a full session plan through Lumio Coach: focus points, drills, a timed
// run-sheet and a kit list.
//
// It used to return focus points and drills only, and the run-sheet the coach
// actually saw on court was a fixed percentage split of the duration rendered in
// the browser. That meant the one artefact a coach plans from was the one part
// no coach had written.
//
// The previous session is read HERE rather than passed in by the browser, so a
// plan always builds on what really happened and the client cannot rewrite the
// history the plan is reasoning from. Auth is the coach's own Supabase session,
// and RLS scopes every read to their own data.

type Phase = { phase?: string; mins?: number; detail?: string; cue?: string }
type Plan = {
  focus_points?: string[]; drills?: string[]
  run_sheet?: Phase[]; kit?: string[]; coach_note?: string
}

// Trust but verify — the same discipline as the camp designer stripping evening
// sessions from a day camp. A run-sheet whose phases do not add up to the lesson
// length is worse than no run-sheet: the coach finds out with eight minutes left
// and a drill still to run. Rounding errors land on the LAST phase, which is
// always the live/pressure block and the one with give in it.
function fitToClock(phases: Phase[], mins: number): Phase[] {
  const clean = phases
    .filter(p => p && (p.phase || p.detail))
    .map(p => ({
      phase: String(p.phase || 'Phase').slice(0, 60),
      mins: Math.max(1, Math.round(Number(p.mins) || 0)),
      detail: String(p.detail || '').slice(0, 400),
      cue: String(p.cue || '').slice(0, 200),
    }))
  if (clean.length === 0) return []

  const total = clean.reduce((n, p) => n + p.mins, 0)
  if (total === mins) return clean

  // Scale proportionally, then put whatever is left on the final phase.
  const scaled = clean.map(p => ({ ...p, mins: Math.max(1, Math.round(p.mins * mins / total)) }))
  const drift = mins - scaled.reduce((n, p) => n + p.mins, 0)
  const lastIdx = scaled.length - 1
  scaled[lastIdx].mins = Math.max(1, scaled[lastIdx].mins + drift)

  // If the drift was large enough to push the last phase to its floor, the plan
  // is unusable as a clock. Better to hand back nothing than a lying run-sheet.
  const final = scaled.reduce((n, p) => n + p.mins, 0)
  return final === mins ? scaled : []
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

  const { type, focus, racket, standard, duration, note, player } = await req.json().catch(() => ({}))
  const mins = Math.max(15, Math.min(240, Number(duration) || 60))

  try {
    // What actually happened last time. Scoped by RLS to this coach's rows.
    let lastCovered = '', lastHomework = '', lastNextFocus = ''
    if (player) {
      const { data: prev } = await supabase
        .from('coach_sessions')
        .select('focus, summary, review_json, session_date')
        .ilike('player_name', String(player))
        .order('session_date', { ascending: false })
        .limit(1)
      const r = prev?.[0] as { focus?: string; summary?: string; review_json?: Record<string, unknown> } | undefined
      if (r) {
        const rj = (r.review_json || {}) as { covered?: string[]; homework?: string; nextFocus?: string }
        lastCovered = (rj.covered || []).join('; ') || r.focus || String(r.summary || '').slice(0, 300)
        lastHomework = rj.homework || ''
        lastNextFocus = rj.nextFocus || ''
      }
    }

    const context = await buildPlayerContext(supabase, player)
    const task = sessionPlanTask({
      type, focus, racket, standard, duration: mins, note, player, context,
      lastCovered, lastHomework, lastNextFocus,
    })
    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 2000 })
    const parsed = extractJson<Plan>(text, {})

    const runSheet = fitToClock(parsed.run_sheet || [], mins)

    return NextResponse.json({
      focus_points: (parsed.focus_points || []).slice(0, 6),
      drills: (parsed.drills || []).slice(0, 6),
      run_sheet: runSheet,
      kit: (parsed.kit || []).slice(0, 8),
      coach_note: parsed.coach_note || '',
      // So the UI can say honestly whether the plan is built on real history or
      // is Lumio Coach's best guess for a player it has never seen.
      built_on_history: !!(lastCovered || lastHomework || lastNextFocus),
    })
  } catch (err) {
    console.error('[coach/session-draft]', err)
    return NextResponse.json({ error: 'Lumio Coach could not build the plan just now. Try again.' }, { status: 500 })
  }
}
