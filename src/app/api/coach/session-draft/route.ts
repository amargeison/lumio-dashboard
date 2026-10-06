import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent, extractJson, buildPlayerContext } from '@/lib/coach/agent'
import { sessionPlanTask } from '@/lib/coach/agent-persona'
import { sharedLessonText } from '@/lib/coach/lesson-recap'

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
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(user.id)) return notAnAcademy()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

  const { type, focus, racket, standard, duration, note, player, playerId } = await req.json().catch(() => ({}))
  const mins = Math.max(15, Math.min(240, Number(duration) || 60))

  try {
    // What actually happened last time. Scoped by RLS to this coach's rows.
    let lastCovered = '', lastHomework = '', lastNextFocus = ''
    // By the player's id when the planner knows it. A name alone is used only
    // when it belongs to at most one player on the roster — with two players
    // called the same, the last lesson of one must not be planned for the other.
    const byId = typeof playerId === 'string' && /^[0-9a-f-]{36}$/i.test(playerId)
    let nameOk = false
    if (!byId && player) {
      const typed = String(player).trim()
      const { data: same } = await supabase.from('coach_players').select('name').ilike('name', typed.replace(/[\\%_]/g, m => `\\${m}`)).limit(20)
      nameOk = !!typed && (same || []).filter(r => String(r.name || '').trim().toLowerCase() === typed.toLowerCase()).length <= 1
    }
    if (byId || nameOk) {
      const q = supabase.from('coach_sessions').select('focus, summary, review_json, session_date')
      const { data: prev } = await (byId ? q.eq('player_id', playerId) : q.ilike('player_name', String(player).trim().replace(/[\\%_]/g, m => `\\${m}`)))
        .order('session_date', { ascending: false })
        .limit(1)
      const r = prev?.[0] as { focus?: string; summary?: string; review_json?: { coachNote?: string } & Record<string, unknown> } | undefined
      if (r) {
        const rj = (r.review_json || {}) as { covered?: string[]; homework?: string; nextFocus?: string }
        // The plan is shown to the family, so the last lesson is described
        // without the coach's private note (old rows hold it in `summary`).
        lastCovered = (rj.covered || []).join('; ') || r.focus || sharedLessonText(r).summary.slice(0, 300)
        lastHomework = rj.homework || ''
        lastNextFocus = rj.nextFocus || ''
      }
    }

    const context = await buildPlayerContext(supabase, player, byId ? playerId : null)
    const task = sessionPlanTask({
      type, focus, racket, standard, duration: mins, note, player, context,
      lastCovered, lastHomework, lastNextFocus,
    })
    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 2000 })
    const parsed = extractJson<Plan>(text, {})

    const runSheet = fitToClock(Array.isArray(parsed.run_sheet) ? parsed.run_sheet : [], mins)
    const lines = (v: unknown, n: number) =>
      (Array.isArray(v) ? v : []).map(x => String(x ?? '').trim().slice(0, 300)).filter(Boolean).slice(0, n)

    // No run-sheet is no plan. An answer that was not JSON, or JSON of the wrong
    // shape, used to come back as a 200 with empty lists — which the planner
    // showed as "Built by Lumio Coach" and let the coach save. The same rule as
    // lesson-summary: an unusable answer is an error the coach is told about.
    if (runSheet.length === 0) {
      console.error('[coach/session-draft] unusable answer', text.slice(0, 200))
      return NextResponse.json(
        { error: 'Lumio Coach could not build a plan from that. Try again, or choose “Write it myself”.' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      focus_points: lines(parsed.focus_points, 6),
      drills: lines(parsed.drills, 6),
      run_sheet: runSheet,
      kit: lines(parsed.kit, 8),
      coach_note: typeof parsed.coach_note === 'string' ? parsed.coach_note.slice(0, 600) : '',
      // So the UI can say honestly whether the plan is built on real history or
      // is Lumio Coach's best guess for a player it has never seen.
      built_on_history: !!(lastCovered || lastHomework || lastNextFocus),
    })
  } catch (err) {
    console.error('[coach/session-draft]', err)
    return NextResponse.json({ error: 'Lumio Coach could not build the plan just now. Try again.' }, { status: 500 })
  }
}
