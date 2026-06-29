import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent, buildPlayerContext } from '@/lib/coach/agent'
import { lessonReviewTask } from '@/lib/coach/agent-persona'

// Generates an AI lesson review for the Tennis Coach portal. Runs through the
// shared Lumio Coach agent (persona + the player's real history) so the review
// is consistent and builds on previous sessions. Auth is the coach's own
// Supabase session cookie — no admin token. The review text is returned to the
// client, which saves it onto the coach_sessions row (RLS-protected).
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

  const { player_name, session_date, focus, rating, summary } = await req.json().catch(() => ({}))

  try {
    const context = await buildPlayerContext(supabase, player_name)
    const task = lessonReviewTask({ player_name, session_date, focus, rating, summary, context })
    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 900 })
    return NextResponse.json({ review: text })
  } catch (err) {
    console.error('[coach/ai-review]', err)
    return NextResponse.json({ error: 'Review generation failed' }, { status: 500 })
  }
}
