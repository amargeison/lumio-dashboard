import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { runCoachAgent, extractJson } from '@/lib/coach/agent'
import { campKitTask } from '@/lib/coach/agent-persona'
import { campAudience, audienceBrief } from '@/lib/coach/camp-audience'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

// The kit list for a camp, worked out rather than typed.
//
// Everything needed is already on the camp record — how many days, how many
// courts, what surface, how many players, residential or not, abroad or not, and
// the itinerary themes. A coach retyping "ball baskets x4" into a blank textarea
// is the product failing to use what it already knows.
//
// Short output, so no streaming: this comes back in a few seconds.

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

  const { campId } = (await req.json().catch(() => ({}))) as { campId?: string }
  if (!campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })

  // Authenticated, so this is about spend rather than abuse. Re-writing a kit
  // list is one click and a coach might reasonably do it a few times.
  const gate = rateLimit(`camp-kit:${coachId}`, 12, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  try {
    const db = serviceClient()
    // Scoped to the coach. The client passes an id, never camp content.
    const { data: camp } = await db.from('coach_camps').select('*')
      .eq('id', campId).eq('coach_id', coachId).maybeSingle()
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

    const { count } = await db.from('coach_camp_attendees')
      .select('id', { count: 'exact', head: true }).eq('camp_id', camp.id)

    const days = Array.isArray(camp.itinerary) && camp.itinerary.length
      ? camp.itinerary.length
      : (camp.start_date && camp.end_date
          ? Math.max(1, Math.round((Date.parse(camp.end_date) - Date.parse(camp.start_date)) / 86_400_000) + 1)
          : 0)

    const residential = /resid|full|half|board|b&b|hotel/i.test(camp.board || '') && !/day/i.test(camp.board || '')

    const task = campKitTask({
      campName: camp.name || 'the camp',
      days,
      courts: camp.courts ?? null,
      surface: camp.surface || null,
      players: camp.group_size || count || camp.capacity || null,
      residential,
      board: camp.board || null,
      overseas: !!camp.overseas,
      location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
      themes: Array.isArray(camp.itinerary)
        ? camp.itinerary.map((d: any) => String(d?.theme || d?.focus || '').trim()).filter(Boolean)
        : [],
      objectives: Array.isArray(camp.objectives) ? camp.objectives.map(String) : [],
      audience: audienceBrief(camp),
      adult: campAudience(camp) === 'adult',
    })

    const { text } = await runCoachAgent({ apiKey, task, maxTokens: 900, temperature: 0.3 })
    const out = extractJson<{ equipment?: string[] }>(text, {})
    const equipment = (out.equipment || [])
      .map(x => String(x || '').trim())
      .filter(Boolean)
      .slice(0, 20)

    if (!equipment.length) {
      return NextResponse.json({ error: 'Lumio Coach came back empty. Try again.' }, { status: 502 })
    }
    // Deliberately NOT saved here. The coach accepts or edits it first — this
    // route suggests, it does not overwrite a list somebody may have curated.
    return NextResponse.json({ ok: true, equipment })
  } catch (e) {
    console.error('[coach/camp-kit]', e)
    return NextResponse.json({ error: 'Could not work out the kit list.' }, { status: 500 })
  }
}
