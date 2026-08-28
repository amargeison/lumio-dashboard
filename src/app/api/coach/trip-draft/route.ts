import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { runCoachAgent, extractJson } from '@/lib/coach/agent'
import { fileToContent, UnreadableFile } from '@/lib/coach/file-to-content'
import { campAudience, audienceBrief } from '@/lib/coach/camp-audience'
import { cleanTrip, type Trip } from '@/lib/coach/trip'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 120

// Draft a camp's trip hub.
//
// Two ways in, and the difference is the whole point:
//
//   • WITH a file — a coach's existing joining instructions, hotel booking, or
//     the PDF they send every year. This is transcription. Everything on the
//     page came from their document, so the hotel address is the right hotel
//     address.
//
//   • WITHOUT a file — nothing is invented. It writes the intro from what the
//     camp record actually holds and leaves every factual field empty for the
//     coach to fill. A trip hub that guesses a check-in time is worse than a
//     blank one, because a parent will act on it.
//
// That second rule is the one that matters. This page tells somebody where to be
// with a child, or with £1,500 of their own holiday committed.

const SHAPE = `Return ONLY valid JSON (no markdown, no commentary). OMIT any field you were not told — do not write "TBC", do not write an empty string, just leave the key out.

{
  "intro": "2-3 sentences to the people coming. What the week is and what to expect when they arrive.",
  "stay":     { "name", "address", "url", "checkIn", "rooms", "meals", "wifi", "notes" },
  "venue":    { "name", "address", "url", "courts", "facilities", "notes" },
  "travel":   { "airport", "flights", "transfers", "arrival", "departure", "notes" },
  "transport":[ { "name", "kind", "phone", "url", "note" } ],
  "eating":   [ { "name", "kind", "address", "phone", "url", "note" } ],
  "contacts": [ { "name", "role", "phone", "note" } ],
  "bring":    ["kit and paperwork — practical items only"],
  "practical":{ "currency", "weather", "timeDifference", "plugs", "health", "notes" },
  "sections": [ { "title", "body", "items": [] } ]
}`

const RULES = `How you write a trip hub.

1. NEVER INVENT A FACT. This is the single rule that matters. No hotel name you were not given, no check-in time, no transfer that might not have been booked, no phone number. A person reads this page and then drives to an airport. An omitted field is a coach's job to fill in; an invented one is a family in the wrong place.
2. ONLY WHAT YOU WERE TOLD, IN THEIR WORDS. Where a document is supplied you are transcribing it, not improving it. Keep the coach's own phrasing for anything operational.
3. THE INTRO IS THE ONE THING YOU WRITE. Warm, short, and only from facts you have. If all you know is the camp name, the dates and the location, write about that and nothing else.
4. "bring" IS PRACTICAL, NOT COACHING KIT. Passports, insurance, sun cream, a refillable bottle, court shoes for the surface given. The camp already has its own equipment list and this is not it.
5. "transport" IS GETTING AROUND ONCE THEY ARE THERE — the taxi firm the coach uses, car hire, the local bus. "travel" is the journey out and home. Never put a taxi number in that you were not given.
6. "eating" IS ONLY PLACES THE COACH NAMED. Never suggest a restaurant from general knowledge of the area — a coach's recommendation carries their reputation, and one you invented would be trading on it. The "note" is the valuable part: why THIS place, when to go, what to order, whether to book.
7. "sections" IS FOR REAL EXTRAS ONLY. A rest-day plan, a parents' evening, a tournament. Never invent one to pad the page.
8. WEATHER AND CURRENCY ARE FACTS ABOUT A PLACE, not forecasts. "Euros" and "typically 24-30°C in September" are fine for a named country and month. A specific forecast is not.
9. BRITISH ENGLISH. Plain and calm. Nobody wants marketing copy on the page they open at the airport.`

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

  const gate = rateLimit(`trip-draft:${coachId}`, 10, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  // Accepts either a form (with a file) or plain JSON (without one).
  let campId = ''
  let file: File | null = null
  const ct = req.headers.get('content-type') || ''
  try {
    if (ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      campId = String(fd.get('campId') || '')
      file = fd.get('file') as File | null
    } else {
      const b = await req.json()
      campId = String(b?.campId || '')
    }
  } catch { /* handled below */ }
  if (!campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })

  const db = serviceClient()
  const { data: camp } = await db.from('coach_camps').select('*')
    .eq('id', campId).eq('coach_id', coachId).maybeSingle()
  if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

  const { data: profile } = await db.from('sports_profiles')
    .select('brand_name, display_name, contact_email, phone').eq('id', coachId).maybeSingle()

  let fileBlocks: unknown[] = []
  if (file) {
    try {
      const { blocks } = await fileToContent(file)
      fileBlocks = blocks
    } catch (e) {
      if (e instanceof UnreadableFile) return NextResponse.json({ error: e.message }, { status: 400 })
      console.error('[coach/trip-draft] parse', e)
      return NextResponse.json({ error: 'Could not read that file. Try exporting it as a PDF.' }, { status: 400 })
    }
  }

  // Only what the camp record actually holds. An absent field is an absent line
  // — the same discipline as the countdown emails.
  const facts = [
    `Camp: ${camp.name}`,
    camp.start_date ? `Starts: ${camp.start_date}` : '',
    camp.end_date ? `Ends: ${camp.end_date}` : '',
    [camp.location, camp.region].filter(Boolean).length ? `Where: ${[camp.location, camp.region].filter(Boolean).join(', ')}` : '',
    camp.surface ? `Surface: ${camp.surface}` : '',
    camp.courts ? `Courts: ${camp.courts}` : '',
    camp.board ? `Board: ${camp.board}` : '',
    camp.overseas ? 'This camp is ABROAD — passports and travel insurance are relevant.' : 'This camp is NOT abroad.',
    camp.daily_rhythm ? `Shape of a day: ${camp.daily_rhythm}` : '',
    Array.isArray(camp.itinerary) && camp.itinerary.length
      ? `Day themes: ${camp.itinerary.map((d: any) => `D${d.day} ${d.theme || d.focus || ''}`.trim()).join(' · ')}`
      : '',
    camp.signup_note ? `The coach's own note: ${camp.signup_note}` : '',
    profile?.brand_name ? `Academy: ${profile.brand_name}` : '',
    profile?.display_name ? `Lead coach: ${profile.display_name}` : '',
    profile?.contact_email ? `Coach email: ${profile.contact_email}` : '',
  ].filter(Boolean).join('\n')

  const instruction = file
    ? `A document the coach already uses is attached. TRANSCRIBE the trip details out of it. The camp record below is context — where the document and the record disagree, the document wins, because the coach wrote it more recently.`
    : `There is NO document. You have only the camp record below. Write the intro from it, fill in anything that genuinely follows from the location and dates, and LEAVE EVERYTHING ELSE OUT for the coach to complete. Do not invent a hotel, a transfer, a time or a phone number.`

  try {
    const { text } = await runCoachAgent({
      apiKey,
      extraSystem: `${RULES}\n\n${SHAPE}`,
      maxTokens: 3000,
      temperature: 0.25,
      content: [
        ...fileBlocks,
        { type: 'text', text: `Draft the trip hub for this camp.\n\n${instruction}\n\n${audienceBrief(camp)}\n\n${facts}` },
      ],
    })

    const raw = extractJson<Trip>(text, {})
    const trip = cleanTrip(raw || {})

    return NextResponse.json({
      ok: true,
      trip,
      // So the UI can say "from your document" rather than implying Lumio Coach
      // knew the hotel's wifi password by magic.
      from: file ? 'file' : 'camp',
      adult: campAudience(camp) === 'adult',
    })
  } catch (e) {
    console.error('[coach/trip-draft]', e)
    return NextResponse.json({ error: 'Could not draft the trip.' }, { status: 500 })
  }
}
