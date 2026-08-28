import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { runCoachAgent, extractJson } from '@/lib/coach/agent'
import { rateLimit } from '@/lib/rate-limit'
import { publicSiteOrigin } from '@/lib/public-origin'
import { STAGE_BY_ID, type StageId } from '@/lib/coach/camp-lifecycle'
import { parentHtml } from '@/lib/coach/camp-signup-email'
import {
  recipientFor, buildTask, renderCampEmail,
  type Camp, type Attendee, type Player, type Draft,
} from '@/lib/coach/camp-email-build'

export const runtime = 'nodejs'
export const maxDuration = 120

// Preview one camp countdown email, as a real attendee will receive it.
//
// Two modes, and the difference matters:
//
//   • no `draft` in the body → Lumio Coach writes one now. This is the "show me
//     what you'd send" button, and it costs a model call.
//   • a `draft` in the body → render only. This is what the editor calls as the
//     coach types, so editing is free and instant.
//
// Either way the HTML comes from renderCampEmail, the same function the cron
// uses. A preview built by different code from the thing that sends is how a
// coach ends up trusting an email that never existed.

type Body = { campId?: string; stage?: string; attendeeId?: string; draft?: Draft }

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { campId, stage: stageId, attendeeId, draft: given } = (await req.json().catch(() => ({}))) as Body
  if (!campId || !stageId) return NextResponse.json({ error: 'campId and stage are required' }, { status: 400 })

  const stage = STAGE_BY_ID[stageId as StageId]
  if (!stage) return NextResponse.json({ error: 'Unknown email' }, { status: 400 })

  const db = serviceClient()

  // Re-read scoped to the coach. The client passes ids, never camp content —
  // otherwise a coach could preview an email built from someone else's camp.
  const { data: camp } = await db.from('coach_camps').select('*')
    .eq('id', campId).eq('coach_id', coachId).maybeSingle<Camp>()
  if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

  // A preview needs somebody to be about. The named attendee if one was asked
  // for, otherwise whoever is first on the list.
  let attendee: Attendee | null = null
  if (attendeeId) {
    const { data } = await db.from('coach_camp_attendees').select('*')
      .eq('id', attendeeId).eq('camp_id', camp.id).maybeSingle<Attendee>()
    attendee = data ?? null
  }
  if (!attendee) {
    const { data } = await db.from('coach_camp_attendees').select('*')
      .eq('camp_id', camp.id).order('created_at', { ascending: true }).limit(1)
    attendee = (data?.[0] as Attendee) ?? null
  }
  if (!attendee) {
    return NextResponse.json({
      error: 'Nobody is on this camp yet, so there is no email to preview. Add an attendee, or share the sign-up link.',
    }, { status: 409 })
  }

  let player: Player | null = null
  if (attendee.player_id) {
    const { data } = await db.from('coach_players')
      .select('id, name, age, parent_name, email, contact_email, parent_email')
      .eq('id', attendee.player_id).maybeSingle<Player>()
    player = data ?? null
  }

  const { data: profile } = await db.from('sports_profiles')
    .select('brand_name, brand_logo_url, display_name, contact_email').eq('id', coachId).maybeSingle()

  const rec = recipientFor(camp, attendee, player)

  // The confirmation is the one email Lumio Coach does not write. It is a
  // receipt — fixed fields, an exact amount, a place held — and it is built and
  // sent by the sign-up route the instant somebody books. Previewing it means
  // rendering that same function, not generating anything.
  if (stage.id === 'signup') {
    const when = attendee.amount_pennies || 0
    const html = parentHtml({
      academy: profile?.brand_name || 'Tennis camp', logoUrl: profile?.brand_logo_url,
      coachName: profile?.display_name, coachEmail: profile?.contact_email,
      campName: camp.name, startDate: camp.start_date, endDate: camp.end_date,
      location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
      playerName: attendee.player_name || 'your player',
      parentName: attendee.parent_name, parentEmail: rec.to || '',
      parentPhone: attendee.parent_phone, playerAge: attendee.player_age,
      medicalNotes: attendee.medical_notes, emergencyContact: attendee.emergency_contact,
      consentPhoto: !!attendee.consent_photo, consentMedical: !!attendee.consent_medical,
      amountPennies: when, paymentMode: camp.payment_mode || 'none', paid: !!attendee.paid,
      // So the preview flips to the direct, adult version exactly as the real
      // confirmation does.
      audience: camp.audience, toParent: rec.toParent,
    })
    return NextResponse.json({
      ok: true, fixed: true, html,
      draft: { subject: attendee && rec.toParent === false ? `You're in — ${camp.name}` : `${attendee.player_name} is signed up — ${camp.name}` },
      recipient: { name: attendee.player_name || 'an attendee', to: rec.to, toParent: rec.toParent },
    })
  }

  try {
    let draft: Draft

    if (given && Array.isArray(given.paragraphs)) {
      // Rendering the coach's own text. No model call, so no rate limit — a
      // coach editing a paragraph should not be gated for typing.
      draft = given
    } else {
      // Authenticated, so this is not about abuse — it is about spend. Every
      // generate is a paid model request and the button is one click.
      const gate = rateLimit(`camp-email-preview:${coachId}`, 20, 10 * 60_000)
      if (!gate.ok) {
        return NextResponse.json(
          { error: 'Give Lumio Coach a moment — try again in a few minutes.' },
          { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
        )
      }
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

      const overrides = (camp.email_overrides || {}) as Record<string, { note?: string }>
      const task = buildTask({
        camp, attendee, stage, profile: profile ?? null,
        greeting: rec.greeting, toParent: rec.toParent,
        // A preview is of THIS email on its own. Feeding it the other stages'
        // jobs would make Boris avoid ground he has not actually covered yet
        // for this particular family.
        alreadySaid: [],
        note: overrides[stage.id]?.note,
      })
      const { text } = await runCoachAgent({ apiKey, task, maxTokens: 1200 })
      draft = extractJson<Draft>(text, {})
      if (!(draft.paragraphs || []).filter(Boolean).length) {
        return NextResponse.json({ error: 'Lumio Coach came back empty. Try again.' }, { status: 502 })
      }
    }

    const { subject, html } = renderCampEmail({
      camp, attendee, profile: profile ?? null,
      stageId: stage.id, draft, greeting: rec.greeting,
      origin: publicSiteOrigin(new URL(req.url).origin),
    })

    return NextResponse.json({
      ok: true,
      draft: { ...draft, subject },
      html,
      // So the coach knows whose version of the email he is looking at, and can
      // see immediately when somebody has no address at all.
      recipient: { name: attendee.player_name || 'an attendee', to: rec.to, toParent: rec.toParent },
    })
  } catch (e) {
    console.error('[camp-email-preview]', e)
    return NextResponse.json({ error: 'Could not build that preview.' }, { status: 500 })
  }
}
