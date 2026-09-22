import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { runCoachAgent } from '@/lib/coach/agent'
import { dailyBriefingTask } from '@/lib/coach/agent-persona'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

// The morning briefing on the coach's dashboard, written by Lumio Coach.
//
// It used to be five sentences assembled from string templates and row counts,
// badged "Coach AI briefing" — the first thing a coach saw every morning, and
// the least true claim in the product. The numbers were real; the coaching was
// not. Nothing decided what mattered most, so a £40 balance and a child who has
// stopped turning up were given equal billing in a fixed order.
//
// The SIGNALS still come from the browser, which already computes them from the
// coach's own RLS-scoped data. That is safe here in a way it was not for message
// drafting: this output goes back to the same coach who supplied the numbers, so
// there is no one to mislead but themselves. What the server owns is the voice.

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

  // A dashboard mounts often. The client caches per day, but the cap is what
  // stops a navigation loop quietly spending money.
  const gate = rateLimit(`briefing:${user.id}`, 12, 60 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Briefing already refreshed recently.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  const b = (await req.json().catch(() => ({}))) as {
    signals?: { tag?: string; fact?: string }[]
    todayCount?: number
    role?: string
  }
  // A head coach and one of their assistants get different briefings, because
  // they are looking at different jobs. The client sends the signals it is
  // allowed to see; this just tells the agent which chair it is talking to.
  const role: 'head' | 'coach' = b.role === 'coach' ? 'coach' : 'head'
  const signals = (Array.isArray(b.signals) ? b.signals : [])
    .slice(0, 12)
    .map(s => ({ tag: String(s.tag ?? '').slice(0, 40), fact: String(s.fact ?? '').slice(0, 400) }))
    .filter(s => s.fact)

  if (signals.length === 0) {
    return NextResponse.json({ error: 'Nothing to brief on yet.' }, { status: 400 })
  }

  try {
    const { data: profile } = await supabase
      .from('sports_profiles').select('display_name').eq('id', user.id).maybeSingle()

    const task = dailyBriefingTask({
      coachName: (profile?.display_name || '').split(' ')[0] || '',
      role,
      signals,
      todayCount: Number(b.todayCount) || 0,
    })
    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 700 })

    // `tag|priority|sentence` per line, most important first.
    //
    // The ORDER is the briefing. The signals arrive in a fixed order every
    // morning — payments, rackets, retention, schedule, progress — and a fixed
    // order has decided nothing. What comes back here is the same facts sorted
    // by what they cost if ignored, and shortened to the few worth saying.
    const items = text.trim().split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [tag, pri, ...rest] = line.split('|')
        const txt = rest.join('|').trim()
        if (!txt) return null
        const p = (pri || '').trim().toLowerCase()
        return {
          tag: (tag || '').trim().toLowerCase().replace(/[^a-z ]/g, '').slice(0, 16) || 'today',
          pri: (p === 'high' || p === 'med' || p === 'low' ? p : 'med') as 'high' | 'med' | 'low',
          text: txt.replace(/^[-•*\s]+/, ''),
        }
      })
      .filter(Boolean)
      .slice(0, 5) as { tag: string; pri: 'high' | 'med' | 'low'; text: string }[]

    // A model that ignored the format leaves us with prose and no items. That
    // is still a usable briefing, so it is returned as one unprioritised block
    // rather than thrown away — the client renders whichever it gets.
    if (!items.length) {
      const briefing = text.trim()
      if (!briefing) throw new Error('empty briefing')
      return NextResponse.json({ briefing, at: new Date().toISOString() })
    }
    return NextResponse.json({ items, at: new Date().toISOString() })
  } catch (err) {
    console.error('[coach/briefing]', err)
    return NextResponse.json({ error: 'Lumio Coach could not write your briefing just now.' }, { status: 500 })
  }
}
