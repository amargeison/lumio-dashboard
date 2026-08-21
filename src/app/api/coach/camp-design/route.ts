import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId } from '@/lib/coach/oauth'
import { COACH_METHODOLOGY } from '@/lib/coach/agent-persona'
import { runCoachAgent } from '@/lib/coach/agent'

export const maxDuration = 120

// Camp design, by Lumio Coach.
//
// This route used to run its own "Lumio Master Coach" system prompt — a second,
// divergent persona with none of the methodology or diagnostic standard the rest
// of the product uses. A camp plan written by a different coach from the one who
// writes the lesson summaries is a product that contradicts itself, so the
// persona is now imported from the single source of truth.
//
// It also used to return one paragraph per day. It now returns a TIMETABLE —
// AM/PM/EVE sessions with times, types and locations — because that is what makes
// a camp plan usable on the ground rather than merely readable.

const CAMP_STANDARD = `How you design a camp — this is an operational plan a coaching team will run from, not a brochure.

1. SEQUENCE, DO NOT SPRINKLE. Each day must earn the next. Assessment before technical change; technical before tactical; tactical before competition. A camp that does "serve day, volley day, fitness day" in any order is a timetable, not a plan — say WHY the order is what it is in the daily rhythm.
2. AGE AND STAGE DECIDE EVERYTHING. A 9-12 red/orange group and a 15-18 county group get different session lengths, different ball types, different language and different evening content. Never write a plan that would suit both.
3. BE OPERATIONALLY REAL. Respect the court count and group size given: sixteen players on two courts cannot all be doing live-ball drills. Say how the group splits. Include rest, food and travel where a real day needs them.
4. RESIDENTIAL AND DAY CAMPS ARE DIFFERENT PRODUCTS. A residential camp has evenings, transfers, downtime and social content that build the group. A day camp does not — never invent evening sessions for players who go home at 4pm.
5. MEASURABLE OUTCOMES. Objectives must be things a coach could tick or count at the end of the week — "every player adds a kick second serve they will use under pressure", not "improve serving".
6. A REST OR LIGHTER DAY on anything 6 days or longer. Coaches who plan seven full days produce tired players and injuries, and you have seen it.`

const SHAPE = `Return ONLY valid JSON (no markdown, no commentary) in EXACTLY this shape:
{
  "daily_rhythm": "one line describing the shape of a typical day AND why it is ordered that way",
  "objectives": ["3-5 measurable camp outcomes"],
  "equipment": ["6-12 specific kit items needed across the camp"],
  "itinerary": [
    {
      "day": 1,
      "theme": "short title for the day",
      "rest": false,
      "coachFocus": "one sentence to the COACHING TEAM — what today is really for, and what to watch for",
      "sessions": [
        { "slot": "AM", "time": "09:30", "title": "short session title", "type": "Technical", "where": "Courts 1-2", "detail": "what actually happens, one sentence", "cue": "a coaching cue to use" }
      ]
    }
  ],
  "parent_brief": {
    "intro": "2-3 sentences to a parent about what this camp is and who it suits",
    "whatTheyWorkOn": ["4-6 plain-English points, no coaching jargon"],
    "whatToBring": ["6-8 practical items"],
    "dailyShape": "one line a parent can picture",
    "whatTheyLeaveWith": ["3-4 concrete things the player takes home"]
  }
}
RULES
- itinerary MUST contain exactly one entry per camp day, numbered 1..N.
- session "type" must be one of: Technical, Tactical, Physical, Match play, Video, Recovery, Social, Briefing, Logistics.
- session "slot" must be one of: AM, PM, EVE. A DAY CAMP must have NO "EVE" sessions at all.
- 2-4 sessions per day for a day camp; 3-4 for a residential.
- parent_brief is written FOR A PARENT — warm, plain, no jargon, no drill names.
- British English throughout.`

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as {
    name?: string; days?: number; startDate?: string; theme?: string; intent?: string
    level?: string; ages?: string; region?: string; surface?: string; courts?: number
    board?: string; groupSize?: number
  }
  const days = Math.max(1, Math.min(28, Number(b.days) || 5))
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI not configured (ANTHROPIC_API_KEY missing).' }, { status: 500 })

  const residential = /resid|full|half|board|b&b|hotel/i.test(b.board || '') && !/day/i.test(b.board || '')

  try {
    // Shared agent: persona + methodology come from one place.
    const { text: txt } = await runCoachAgent({
      apiKey,
      extraSystem: `${COACH_METHODOLOGY}\n\n${CAMP_STANDARD}\n\n${SHAPE}`,
      maxTokens: 8000,
      temperature: 0.4,
      task: [
          `Design this camp.`,
          `Camp name: ${b.name || 'Training camp'}`,
          `Length: ${days} day${days === 1 ? '' : 's'}${b.startDate ? ` starting ${b.startDate}` : ''}`,
          `Type: ${residential ? 'RESIDENTIAL — players stay overnight, so evenings are yours' : 'DAY CAMP — players go home each afternoon, so there are NO evening sessions'}${b.board ? ` (${b.board})` : ''}`,
          `Who it is for: ${[b.ages ? `ages ${b.ages}` : null, b.level].filter(Boolean).join(', ') || 'developing juniors'}`,
          `Group size: ${b.groupSize || 'unspecified'}${b.courts ? ` across ${b.courts} court${b.courts === 1 ? '' : 's'}` : ''}`,
          `Surface: ${b.surface || 'hard'}`,
          b.region ? `Location: ${b.region}` : '',
          `What the coach wants them to leave with: ${b.intent || b.theme || 'measurable improvement and a reason to come back'}`,
          ``,
          `Return the JSON with exactly ${days} itinerary day${days === 1 ? '' : 's'}.`,
        ].filter(Boolean).join('\n'),
    })

    const m = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim().match(/\{[\s\S]*\}/)
    if (!m) return NextResponse.json({ error: 'The AI could not design this camp.' }, { status: 502 })
    const plan = JSON.parse(m[0])

    // Trust but verify: a day camp with evening sessions is the failure mode most
    // likely to embarrass a coach in front of a parent, so strip them server-side
    // rather than relying on the prompt alone.
    if (!residential && Array.isArray(plan.itinerary)) {
      for (const d of plan.itinerary) {
        if (Array.isArray(d.sessions)) d.sessions = d.sessions.filter((s: any) => String(s.slot).toUpperCase() !== 'EVE')
      }
    }
    // Guarantee the day count the coach asked for, whatever the model returned.
    if (Array.isArray(plan.itinerary)) plan.itinerary = plan.itinerary.slice(0, days)

    return NextResponse.json(plan)
  } catch (e) {
    console.error('[coach/camp-design]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Design failed' }, { status: 500 })
  }
}
