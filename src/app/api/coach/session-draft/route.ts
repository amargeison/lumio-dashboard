import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent, extractJson, buildPlayerContext } from '@/lib/coach/agent'
import { sessionPlanTask } from '@/lib/coach/agent-persona'

// Drafts a session's focus points + drills for the Tennis Coach planner.
// Runs through the shared Lumio Coach agent (persona + the player's real history)
// so every plan is consistent and builds on past sessions. Auth = the coach's
// own Supabase session.
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
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

  const { type, focus, racket, standard, duration, note, player } = await req.json().catch(() => ({}))

  try {
    const context = await buildPlayerContext(supabase, player)
    const task = sessionPlanTask({ type, focus, racket, standard, duration, note, player, context })
    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 900 })
    const parsed = extractJson<{ focus_points?: string[]; drills?: string[] }>(text, { focus_points: [], drills: [] })
    return NextResponse.json({ focus_points: parsed.focus_points || [], drills: parsed.drills || [] })
  } catch (err) {
    console.error('[coach/session-draft]', err)
    return NextResponse.json({ error: 'Draft failed' }, { status: 500 })
  }
}
