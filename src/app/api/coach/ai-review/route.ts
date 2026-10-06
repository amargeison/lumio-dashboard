import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
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
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(user.id)) return notAnAcademy()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })

  const { player_name, player_id, session_date, focus, rating, summary } = await req.json().catch(() => ({}))

  try {
    // By the player's id when the caller has one — two players can share a name.
    const context = await buildPlayerContext(supabase, player_name, typeof player_id === 'string' && /^[0-9a-f-]{36}$/i.test(player_id) ? player_id : null)
    const task = lessonReviewTask({ player_name, session_date, focus, rating, summary, context })
    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 900 })
    // An empty answer is not a review, and the caller saves whatever comes back
    // onto the lesson — so say it failed rather than hand back nothing.
    if (!String(text || '').trim()) return NextResponse.json({ error: 'Lumio Coach could not write that review just now. Please try again.' }, { status: 502 })
    return NextResponse.json({ review: text })
  } catch (err) {
    console.error('[coach/ai-review]', err)
    return NextResponse.json({ error: 'Review generation failed' }, { status: 500 })
  }
}
