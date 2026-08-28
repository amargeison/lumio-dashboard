import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { runCoachAgent, extractJson } from '@/lib/coach/agent'
import { COACH_METHODOLOGY } from '@/lib/coach/agent-persona'
import { fileToContent, UnreadableFile } from '@/lib/coach/file-to-content'
import { campAudience, audienceBrief } from '@/lib/coach/camp-audience'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 120

// Read a camp out of a document the coach already has.
//
// Most coaches running a camp have already written it down — a PDF brochure, a
// spreadsheet timetable, a Word itinerary, or a photo of a whiteboard. Asking
// them to retype it into a form so the AI can "design" what they already
// designed is the product wasting their time.
//
// Two outcomes, and the difference matters to the coach:
//   found: 'plan'    — the document contained a real day-by-day schedule, so we
//                      have digitised THEIR plan. Nothing is invented.
//   found: 'details' — it was a brochure or a price list. We filled in the
//                      designer's questions and Lumio Coach plans the days.
//
// The file is read by the same extractor onboarding uses. This route only
// differs in what it asks for.

const EXTRACT = `You are reading a document a tennis coach already has, to set up a camp in their software. You are transcribing, not designing.

THE ONE RULE: never invent anything. If the document does not say the price, there is no price. If it has no day-by-day schedule, there is no itinerary — say so and leave it out. A field you guessed at is worse than a field left blank, because the coach will not know to check it.

Return ONLY valid JSON (no markdown, no commentary). Omit any field the document does not tell you:
{
  "found": "plan" | "details",
  "confidence": "high" | "medium" | "low",
  "notes": "one short sentence to the coach about anything ambiguous, or an empty string",

  "camp":   { "name", "location", "region", "start_date", "end_date", "capacity", "price", "surface", "courts", "board", "description" },
  "design": { "ages", "level", "groupSize", "intent" },

  "itinerary": [
    { "day": 1, "theme": "", "rest": false, "coachFocus": "",
      "sessions": [ { "slot": "AM|PM|EVE", "time": "09:30", "title": "", "type": "", "where": "", "detail": "" } ] }
  ],
  "equipment": ["only if the document actually lists kit"],
  "objectives": ["only if the document states aims or outcomes"],
  "parent_brief": { "intro": "", "whatTheyWorkOn": [], "whatToBring": [], "dailyShape": "", "whatTheyLeaveWith": [] }
}

Rules:
- "found" is "plan" ONLY if the document has a genuine day-by-day or session-by-session schedule you can transcribe. A list of dates and a price is "details".
- Dates as YYYY-MM-DD. If the document gives a date with no year, use the next occurrence of it.
- "price" and "capacity" as plain numbers. Price is PER PLAYER — if the document shows a total, work out the per-head figure only when it also gives the number of players, otherwise omit it.
- "level" must be one of: Beginner, Improver, Club / intermediate, County, Performance.
- session "type" must be one of: Technical, Tactical, Physical, Match play, Video, Recovery, Social, Briefing, Logistics.
- "slot" must be AM, PM or EVE. Use the times given; do not invent times.
- Transcribe the coach's own wording for themes and session titles. This is their camp.
- British English.`

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

  // Reading a PDF is one of the more expensive calls in the product, and the
  // button is a drop zone somebody could drag a folder onto.
  const gate = rateLimit(`camp-import:${coachId}`, 10, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'That is a lot of files at once. Give it a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  let file: File | null = null
  let campId = ''
  try {
    const fd = await req.formData()
    file = fd.get('file') as File | null
    campId = String(fd.get('campId') || '')
  } catch { /* handled below */ }
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  let blocks
  try {
    ({ blocks } = await fileToContent(file))
  } catch (e) {
    if (e instanceof UnreadableFile) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[coach/camp-import] parse', e)
    return NextResponse.json({ error: 'Could not read that file. Try exporting it as a PDF or CSV.' }, { status: 400 })
  }

  try {
    // The camp is optional context — it tells the model who the camp is for, so
    // an adult trip does not come back with junior language in the brief.
    let context = ''
    if (campId) {
      const db = serviceClient()
      const { data: camp } = await db.from('coach_camps')
        .select('name, start_date, end_date, location, region, audience, ages')
        .eq('id', campId).eq('coach_id', coachId).maybeSingle()
      if (camp) {
        context = [
          `This is being imported into an existing camp called "${camp.name}".`,
          audienceBrief(camp),
          campAudience(camp) === 'adult' ? 'The parent_brief is therefore written to the player, not to a parent.' : '',
        ].filter(Boolean).join('\n')
      }
    }

    const { text } = await runCoachAgent({
      apiKey,
      // Transcription, not coaching. The methodology is included so the model
      // recognises what it is looking at — session types, ball colours, the
      // shape of a training day — but the persona is deliberately not, because
      // Boris writing in his own voice over a coach's own itinerary would be
      // rewriting it rather than reading it.
      system: `${COACH_METHODOLOGY}\n\n${EXTRACT}`,
      content: [...blocks, { type: 'text', text: context || 'Read this document.' }],
      maxTokens: 8000,
      temperature: 0.1,
    })

    const out = extractJson<Record<string, any>>(text, {})
    if (!out || (!out.camp && !out.design && !out.itinerary)) {
      return NextResponse.json({ error: 'Nothing that looked like a camp was found in that file.' }, { status: 422 })
    }

    // Day numbering is ours, not the document's — a coach who wrote "Day 1,
    // Day 1 (cont), Day 2" should not produce two day ones.
    if (Array.isArray(out.itinerary)) {
      out.itinerary = out.itinerary.map((d: any, i: number) => ({ ...d, day: i + 1 }))
    }

    return NextResponse.json({ ok: true, ...out })
  } catch (e) {
    console.error('[coach/camp-import]', e)
    return NextResponse.json({ error: 'Could not read that document.' }, { status: 500 })
  }
}
