import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sessionCoachId } from '@/lib/coach/oauth'

export const maxDuration = 120

// Lumio Master Coach — designs a training-camp plan (day-by-day itinerary,
// equipment, objectives, daily rhythm) from the camp's setup. Same expert persona
// + grounded, no-fluff discipline as the lesson-summary agent.
const SYSTEM = `You are Lumio's Master Coach — a world-class tennis coach who designs elite, age-appropriate training camps. You are specific, practical and realistic: every day builds on the last toward the camp's goals. No filler, no generic platitudes.

Return ONLY valid JSON (no markdown) in EXACTLY this shape:
{
  "daily_rhythm": "one short line, e.g. 'AM technical · PM tactical/match · EVE video/fitness'",
  "objectives": ["3-4 concrete, measurable camp goals"],
  "equipment": ["6-10 specific kit items needed across the camp"],
  "itinerary": [ { "day": 1, "focus": "short theme for the day", "did": "what they work on that day (one sentence)", "nextAction": "the evening/homework action" } ]
}
- itinerary MUST have exactly one entry per camp day (day 1..N), progressing logically (arrival/assessment → technical blocks → tactical/match-play → review/finals).
- Tailor to the level, surface and ages given. Keep each field concise.`

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as { name?: string; days?: number; theme?: string; level?: string; region?: string; surface?: string; board?: string }
  const days = Math.max(1, Math.min(28, Number(b.days) || 7))
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured (ANTHROPIC_API_KEY missing).' }, { status: 500 })

  try {
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      temperature: 0.3,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Design the camp plan.\nCamp: ${b.name || 'Training camp'}\nLength: ${days} days\nTheme / focus: ${b.theme || 'all-round performance'}\nLevel: ${b.level || 'developing juniors'}\nSurface: ${b.surface || 'hard'}\nBoard/setup: ${b.board || 'day camp'}\n\nReturn the JSON with exactly ${days} itinerary days.`,
      }],
    })
    let txt = ''
    for (const c of res.content) if (c.type === 'text') txt += c.text
    const m = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/)
    if (!m) return NextResponse.json({ error: 'The AI could not design this camp.' }, { status: 502 })
    const plan = JSON.parse(m[0])
    return NextResponse.json(plan)
  } catch (e) {
    console.error('[coach/camp-design]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Design failed' }, { status: 500 })
  }
}
