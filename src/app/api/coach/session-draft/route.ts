import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

// Drafts a session's focus points + drills for the Tennis Coach planner.
// Auth = the coach's own Supabase session.
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
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `You are an LTA tennis coach planning a session. Draft the focus points and drills.

Session: ${type || 'lesson'}${player ? ` for ${player}` : ''}${duration ? `, ${duration} mins` : ''}
Racket stage / standard: ${[racket, standard].filter(Boolean).join(' · ') || 'unspecified'}
Session focus: ${focus || 'general technical work'}
${note ? `Coach note: ${note}` : ''}

Return ONLY valid JSON (no markdown): {"focus_points": ["...", "..."], "drills": ["...", "..."]}
- 3–4 concise coaching focus points appropriate to the stage.
- 3–4 specific, named drills with a clear instruction each.`,
      }],
    })
    let txt = ''
    for (const b of res.content) if (b.type === 'text') txt += b.text
    const m = txt.match(/\{[\s\S]*\}/)
    const parsed = m ? JSON.parse(m[0]) : { focus_points: [], drills: [] }
    return NextResponse.json({ focus_points: parsed.focus_points || [], drills: parsed.drills || [] })
  } catch (err) {
    console.error('[coach/session-draft]', err)
    return NextResponse.json({ error: 'Draft failed' }, { status: 500 })
  }
}
