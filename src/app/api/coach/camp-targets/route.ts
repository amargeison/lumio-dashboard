import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { runCoachAgent, extractJson } from '@/lib/coach/agent'
import { campTargetsTask } from '@/lib/coach/agent-persona'
import { campAudience, audienceBrief } from '@/lib/coach/camp-audience'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

// The camp's targets and outcomes, worked out by Lumio Coach.
//
// Same argument as the kit list: the camp record already holds the length, the
// standard, the surface, what the coach said they should leave with, and the
// theme of every day. A blank textarea headed "One objective per line" asks a
// coach to restate what the product already knows.
//
// Two lists, because they are two different promises:
//   targets  — what the PLAYERS are working towards, and must be countable.
//   outcomes — what the COACH will produce by the end. A report, a re-assessment.

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

  const { campId } = (await req.json().catch(() => ({}))) as { campId?: string }
  if (!campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })

  const gate = rateLimit(`camp-targets:${coachId}`, 12, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  try {
    const db = serviceClient()
    const { data: camp } = await db.from('coach_camps').select('*')
      .eq('id', campId).eq('coach_id', coachId).maybeSingle()
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

    const days = Array.isArray(camp.itinerary) && camp.itinerary.length
      ? camp.itinerary.length
      : (camp.start_date && camp.end_date
          ? Math.max(1, Math.round((Date.parse(camp.end_date) - Date.parse(camp.start_date)) / 86_400_000) + 1)
          : 0)

    const task = campTargetsTask({
      campName: camp.name || 'the camp',
      days,
      surface: camp.surface || null,
      ages: camp.ages || null,
      intent: camp.intent || camp.description || null,
      themes: Array.isArray(camp.itinerary)
        ? camp.itinerary.map((d: any) => String(d?.theme || d?.focus || '').trim()).filter(Boolean)
        : [],
      dailyRhythm: camp.daily_rhythm || null,
      audience: audienceBrief(camp),
      adult: campAudience(camp) === 'adult',
    })

    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 900, temperature: 0.35 })
    const out = extractJson<{ targets?: string[]; outcomes?: string[] }>(text, {})
    const targets = (out.targets || []).map(x => String(x || '').trim()).filter(Boolean).slice(0, 8)
    const outcomes = (out.outcomes || []).map(x => String(x || '').trim()).filter(Boolean).slice(0, 6)

    if (!targets.length) {
      return NextResponse.json({ error: 'Lumio Coach came back empty. Try again.' }, { status: 502 })
    }
    // Suggested, not saved. The coach accepts or edits first.
    return NextResponse.json({ ok: true, targets, outcomes })
  } catch (e) {
    console.error('[coach/camp-targets]', e)
    return NextResponse.json({ error: 'Could not work out the targets.' }, { status: 500 })
  }
}
