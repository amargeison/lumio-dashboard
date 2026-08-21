import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent } from '@/lib/coach/agent'
import { parentMessageTask } from '@/lib/coach/agent-persona'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

// Drafts a message to players and parents, in Lumio Coach's voice.
//
// This replaces a call the browser used to make to /api/ai/tennis — an
// unauthenticated passthrough that forwarded a client-supplied `system` prompt
// straight to Anthropic. Two things were wrong with that. Anyone could spend the
// API key on any prompt they liked; and the persona that writes to a parent was
// whatever the browser said it was, which is not a guarantee you can make about
// safeguarding-sensitive messages.
//
// Here the server owns the persona, the coach's own name and club are read from
// their profile rather than posted in, and the caller must hold a coach session.

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

  // Spend cap. Authenticated, so this is not abuse — it is a stuck finger on a
  // button that costs money every press.
  const gate = rateLimit(`message-draft:${user.id}`, 20, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  const body = (await req.json().catch(() => ({}))) as {
    intent?: string; recipients?: string[]; channels?: string[]; urgent?: boolean
  }
  const intent = String(body.intent ?? '').trim().slice(0, 2000)
  if (!intent) return NextResponse.json({ error: 'Write what you want to say first.' }, { status: 400 })

  try {
    // The coach's identity comes from their profile, never from the request —
    // a message signed by someone else is not a thing the client gets to ask for.
    const { data: profile } = await supabase
      .from('sports_profiles').select('display_name, brand_name').eq('id', user.id).maybeSingle()

    const task = parentMessageTask({
      coachName: profile?.display_name || 'your coach',
      clubName: profile?.brand_name || 'the academy',
      recipients: (body.recipients || []).slice(0, 40).map(r => String(r).slice(0, 80)),
      channels: (body.channels || []).slice(0, 6).map(c => String(c).slice(0, 30)),
      urgent: !!body.urgent,
      intent,
    })

    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 600 })
    const draft = text.trim()
    if (!draft) throw new Error('empty draft')
    return NextResponse.json({ text: draft })
  } catch (err) {
    console.error('[coach/message-draft]', err)
    // Deliberately NOT falling back to the coach's raw text. The old code did,
    // which meant a failed call looked identical to a successful one and the
    // coach sent their own untidied note believing it had been drafted.
    return NextResponse.json({ error: 'Lumio Coach could not draft that just now. Try again, or send your own wording.' }, { status: 500 })
  }
}
