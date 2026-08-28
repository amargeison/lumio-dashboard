import { NextRequest, NextResponse } from 'next/server'
import { campAudience, audienceBrief } from '@/lib/coach/camp-audience'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { runCoachAgent } from '@/lib/coach/agent'
import { publicSiteOrigin } from '@/lib/public-origin'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 120

// Announcement copy for a camp, written by Lumio Coach.
//
// This is the honest version of "social media automation". Nothing is posted
// anywhere: real auto-posting needs Instagram Content Publishing, Meta app
// review, a paid X tier and a WhatsApp Business number, which is platform
// paperwork rather than product. What a coach actually lacks at 9pm on a Sunday
// is the WORDS. So Boris writes them, per channel, and the coach pastes them —
// or sends the email straight to the roster from the next route along.
//
// Nothing here is saved. The coach reads it, edits it, and decides.

const promoStandard = (adult: boolean) => `How you write camp announcements.

1. WRITE TO ONE PERSON, NOT AN AUDIENCE. ${adult ? '"You" beats "our players". No "we are delighted to announce".' : '"Your daughter" beats "your children". No "we are delighted to announce".'}
2. LEAD WITH THE CHANGE IN THE PLAYER, NOT THE LOGISTICS. ${adult ? 'Somebody books a week of their own holiday because of the player they will be on the Friday afternoon, not because the courts are clay.' : 'A parent books because of who their child will be on Friday afternoon, not because the camp runs 9-3.'} Dates and price are the second thing they read, never the first.
3. NO HYPE, NO EXCLAMATION STACKS, NO "AMAZING". You have coached for thirty years; you sound like it. Warm, specific, plainly confident.
4. SPECIFIC BEATS SUPERLATIVE. "Four days on the second serve, and they leave with one they will actually use at 4-4" is worth more than "elite coaching".
5. CHANNEL CHANGES THE LENGTH, NOT THE VOICE. The email can breathe. The WhatsApp message is what ${adult ? 'one player forwards to their doubles partner' : 'a parent forwards to another parent'} — short enough to read on a lock screen. The social caption is written for someone scrolling, and the first line has to survive being truncated.
6. ONE CLEAR ACTION. If there is a sign-up link, every channel ends pointing at it. If there is not, the action is "reply to this" — never invent a booking process.
7. NEVER INVENT FACTS. Use only the camp details given. If there is no price, do not mention money. If there is no age range, do not guess one. Missing information is left out, not filled in.
8. BRITISH ENGLISH. No em-dash-heavy American marketing rhythm, no "reach out".
${adult ? '9. THESE ARE ADULTS SPENDING THEIR OWN MONEY ON THEIR OWN HOLIDAY. Never mention parents, guardians, children or drop-off. Nothing that would read as patronising to a 45-year-old club player who has been playing for thirty years.' : '9. A PARENT IS DECIDING AND PAYING. Write to them about their child.'}`

const shapeFor = (adult: boolean) => `Return ONLY valid JSON (no markdown, no commentary) in EXACTLY this shape:
{
  "email": {
    "subject": "under 60 characters, no emoji, no ALL CAPS",
    "preheader": "one line that shows after the subject in an inbox",
    "paragraphs": ["3-5 short paragraphs, plain text, no HTML, no greeting line and no sign-off — those are added around you"],
    "cta": "the sentence that carries the link, e.g. ${adult ? "'Places are limited — you can book yours here.'" : "'Places are limited — you can sign your child up here.'"}"
  },
  "whatsapp": "60-80 words ${adult ? 'one player could forward to another' : 'a parent could forward to another parent'}. Line breaks allowed. At most one emoji, and only if it earns its place.",
  "social": {
    "caption": "80-120 words. The FIRST line must work alone as a hook, because the rest gets truncated.",
    "hashtags": ["4-7 lowercase hashtags, no # symbol, no spaces"]
  },
  "poster": {
    "headline": "4-7 words for the top of a printed poster or a story graphic",
    "sub": "one supporting line under it"
  }
}`

type Body = { campId?: string }

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })
  }

  const { campId } = (await req.json().catch(() => ({}))) as Body
  if (!campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })

  // Authenticated, so this is not about abuse — it is about spend. Every call is
  // a paid model request, and the Re-write button is one click. Twelve in ten
  // minutes is more re-writes than anyone needs and caps a stuck finger.
  const gate = rateLimit(`camp-promo:${coachId}`, 12, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }

  try {
    const db = serviceClient()
    // Re-read scoped to the coach. The client passes an id, never camp content —
    // otherwise a coach could have Boris write copy from someone else's camp.
    const { data: camp } = await db.from('coach_camps').select('*')
      .eq('id', campId).eq('coach_id', coachId).maybeSingle()
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

    const { data: profile } = await db.from('sports_profiles')
      .select('brand_name, display_name, contact_email').eq('id', coachId).maybeSingle()

    const origin = publicSiteOrigin(new URL(req.url).origin)
    const signupUrl = camp.signup_slug && camp.signup_open ? `${origin}/camp/${camp.signup_slug}` : null

    const adult = campAudience(camp) === 'adult'
    const brief = camp.parent_brief || {}
    const dates = [camp.start_date, camp.end_date].filter(Boolean).join(' to ')
    // Only facts that exist get sent. Rule 7 above is enforced here as well as
    // asked for — an absent field is an absent line, not an empty label Boris
    // might feel obliged to fill.
    const facts = [
      ['Academy', profile?.brand_name],
      ['Coach', profile?.display_name],
      ['Camp', camp.name],
      ['Dates', dates],
      ['Location', [camp.location, camp.region].filter(Boolean).join(', ')],
      ['Ages', camp.ages],
      ['Price per player', camp.price ? `£${camp.price}` : ''],
      ['Deposit', camp.payment_mode === 'deposit' && camp.deposit_amount ? `£${camp.deposit_amount}` : ''],
      ['Places', camp.capacity ? String(camp.capacity) : ''],
      ['Courts / surface', [camp.courts, camp.surface].filter(Boolean).join(' · ')],
      ['Sign-up link', signupUrl],
      ['What it is (from the camp brief)', brief.intro],
      ['What they work on', Array.isArray(brief.whatTheyWorkOn) ? brief.whatTheyWorkOn.join('; ') : ''],
      ['What they leave with', Array.isArray(brief.whatTheyLeaveWith) ? brief.whatTheyLeaveWith.join('; ') : ''],
      ['A typical day', brief.dailyShape],
      ['Day themes', Array.isArray(camp.itinerary) ? camp.itinerary.map((d: any) => `D${d.day} ${d.theme || d.focus || ''}`.trim()).join(' · ') : ''],
      ['Camp objectives', Array.isArray(camp.objectives) ? camp.objectives.join('; ') : ''],
      ["Coach's own note on the sign-up page", camp.signup_note],
    ].filter(([, v]) => !!v).map(([l, v]) => `${l}: ${v}`).join('\n')

    // Through the shared agent, so the persona AND the methodology are always
    // present. This route used to build its own client with only the persona —
    // the announcement was written by a coach with no coaching standards behind
    // him, which is exactly the drift a single entry point exists to prevent.
    const { text } = await runCoachAgent({
      apiKey: process.env.ANTHROPIC_API_KEY,
      extraSystem: `${promoStandard(adult)}\n\n${shapeFor(adult)}`,
      maxTokens: 2000,
      temperature: 0.6,
      task: `Write the announcement copy for this camp.\n\n${audienceBrief(camp)}\n\n${facts}\n\n${
        signupUrl
          ? 'There IS a sign-up link. Every channel should end pointing at it. Do NOT paste the URL into the text yourself — write the sentence that carries it, and the link is appended.'
          : 'There is NO sign-up link yet. The action is replying to the coach. Do not invent a booking page or a phone number.'
      }`,
    })
    // Models occasionally wrap JSON in a fence despite being told not to.
    const json = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    let plan: any
    try { plan = JSON.parse(json) } catch {
      const s = json.indexOf('{'), e = json.lastIndexOf('}')
      if (s < 0 || e <= s) throw new Error('unparseable')
      plan = JSON.parse(json.slice(s, e + 1))
    }

    return NextResponse.json({ ok: true, promo: plan, signupUrl, campName: camp.name })
  } catch (err) {
    console.error('[coach/camp-promo]', err)
    return NextResponse.json({ error: 'Lumio Coach could not write the copy just now. Try again.' }, { status: 500 })
  }
}
