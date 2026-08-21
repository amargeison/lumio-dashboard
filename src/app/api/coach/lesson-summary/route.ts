import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent, extractJson, buildPlayerContext } from '@/lib/coach/agent'
import { lessonSummaryTask } from '@/lib/coach/agent-persona'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

// Turns a coach's scribbled note into a structured lesson summary.
//
// The button said "AI assist". The code behind it was a local heuristic that
// split the note on punctuation and wrapped the focus in three fixed sentences —
// its own comment described it as "instant, offline". Every player at a given
// focus got the same takeaways and the same homework, and the summary is the
// thing that gets shared with the player and their parent.
//
// It also fills `recap`, the one-line version shown in the Summary modal. That
// field existed and nothing ever wrote to it, so the modal always fell back to
// stitching sentences out of the long summary.

type Sections = {
  assessment?: string; covered?: string[]; takeaways?: string[]; drills?: string[]
  homework?: string; nextFocus?: string; recap?: string
}

const arr = (v: unknown, n: number) =>
  (Array.isArray(v) ? v : []).map(x => String(x).slice(0, 300)).filter(Boolean).slice(0, n)

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

  const gate = rateLimit(`lesson-summary:${user.id}`, 30, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  const b = (await req.json().catch(() => ({}))) as {
    player?: string; focus?: string; note?: string; rating?: number | string; date?: string
  }
  const focus = String(b.focus ?? '').trim().slice(0, 300)
  const note = String(b.note ?? '').trim().slice(0, 4000)
  if (!focus && !note) {
    return NextResponse.json({ error: 'Add a focus or a note first.' }, { status: 400 })
  }

  try {
    // The player's record, so the summary can say "still the same thing we
    // talked about in March" rather than treating every lesson as the first.
    const context = await buildPlayerContext(supabase, b.player)

    const task = lessonSummaryTask({
      player: String(b.player ?? '').slice(0, 80),
      focus, note,
      rating: b.rating ?? null,
      date: String(b.date ?? '').slice(0, 20),
      context,
    })
    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 1400 })
    const s = extractJson<Sections>(text, {})

    const covered = arr(s.covered, 5)
    const takeaways = arr(s.takeaways, 4)
    if (covered.length === 0 && takeaways.length === 0) throw new Error('empty summary')

    return NextResponse.json({
      assessment: String(s.assessment || '').slice(0, 600),
      covered,
      takeaways,
      drills: arr(s.drills, 5),
      homework: String(s.homework || '').slice(0, 500),
      nextFocus: String(s.nextFocus || '').slice(0, 300),
      // The one-liner the Summary modal shows. Written deliberately, not stitched.
      recap: String(s.recap || '').slice(0, 500),
    })
  } catch (err) {
    console.error('[coach/lesson-summary]', err)
    return NextResponse.json({ error: 'Lumio Coach could not write that summary just now.' }, { status: 500 })
  }
}
