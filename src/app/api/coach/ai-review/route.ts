import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

// Generates an AI lesson review for the Tennis Coach portal. Auth is the coach's
// own Supabase session cookie — no admin token. The review text is returned to
// the client, which saves it onto the coach_sessions row (RLS-protected).
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
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `You are an experienced tennis coach writing a short session review that will be shared with the player and (for juniors) their parent.

Session details:
- Player: ${player_name || 'the player'}
- Date: ${session_date || 'recent session'}
- Focus: ${focus || 'general technical work'}
- Coach rating (1-5): ${rating ?? 'n/a'}
- Coach's notes: ${summary || '(none provided)'}

Write a warm, specific review of 2-3 short paragraphs that covers: what went well, the main area to work on, and one clear focus for the next session. Be encouraging but honest. Return plain text only — no markdown headers.`,
      }],
    })

    let review = ''
    for (const block of response.content) if (block.type === 'text') review += block.text
    return NextResponse.json({ review: review.trim() })
  } catch (err) {
    console.error('[coach/ai-review]', err)
    return NextResponse.json({ error: 'Review generation failed' }, { status: 500 })
  }
}
