import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { serviceClient } from '@/lib/coach/oauth'
import { coachGate } from '@/lib/coach/membership'
import { rateLimit } from '@/lib/rate-limit'
import { publicSiteOrigin } from '@/lib/public-origin'
import { STAGE_BY_ID, type StageId } from '@/lib/coach/camp-lifecycle'
import type { Camp, Attendee, Player } from '@/lib/coach/camp-email-build'
import { sendCampStage, claimRetry, releaseStuck, recordRetry, PLAYER_COLUMNS } from '@/lib/coach/camp-email-send'

export const runtime = 'nodejs'
export const maxDuration = 120

// "Send again" on the Emails tab: one countdown email, to one attendee, that
// the hourly job tried and could not send.
//
// Only ever a row that is logged as FAILED for this coach's own camp — this is
// not a way to send an email a second time, or one that was skipped on purpose.
// It goes through the same builder and the same log row as the hourly job, so
// what arrives is the email the coach previewed and the tab then shows it sent.

type Body = { campId?: string; attendeeId?: string; stage?: string }

export async function POST(req: NextRequest) {
  // The academy in the portal's address, and only its head coach (see coachGate):
  // a coach who also helps at another academy must not act on their own club
  // from inside the other one's portal.
  const seat = await coachGate({ headOnly: true })
  if (!seat.ok) return NextResponse.json({ error: seat.error }, { status: seat.status })
  const coachId = seat.seat.academyId
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(coachId)) return notAnAcademy()

  const { campId, attendeeId, stage: stageId } = (await req.json().catch(() => ({}))) as Body
  const stage = STAGE_BY_ID[stageId as StageId]
  // The confirmation is not written by Lumio Coach; it has its own route.
  if (!campId || !attendeeId || !stage || stage.id === 'signup') {
    return NextResponse.json({ error: 'That email cannot be sent again from here.' }, { status: 400 })
  }

  // Every one of these is a paid model request and a real email.
  const gate = rateLimit(`camp-email-resend:${coachId}`, 40, 10 * 60_000)
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'That is a lot of emails in a few minutes — try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } },
    )
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured on this server.' }, { status: 503 })

  try {
    const db = serviceClient()
    // Re-read scoped to the coach. The browser passes ids, never content.
    const { data: camp } = await db.from('coach_camps').select('*')
      .eq('id', campId).eq('coach_id', coachId).maybeSingle<Camp>()
    if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })
    const { data: attendee } = await db.from('coach_camp_attendees').select('*')
      .eq('id', attendeeId).eq('camp_id', camp.id).eq('coach_id', coachId).maybeSingle<Attendee>()
    if (!attendee) return NextResponse.json({ error: 'That person is no longer on this camp.' }, { status: 404 })
    if ((attendee.status || '') === 'cancelled') {
      return NextResponse.json({ error: 'Their place was cancelled, so nothing was sent.' }, { status: 409 })
    }

    await releaseStuck(db, camp.id)
    const { data: log } = await db.from('coach_camp_emails').select('id, status, attempts')
      .eq('attendee_id', attendee.id).eq('stage', stage.id).eq('coach_id', coachId).maybeSingle()
    if (!log || log.status !== 'failed' || !await claimRetry(db, log)) {
      return NextResponse.json({ error: 'That email has already been dealt with. Refresh the page to see where it stands.' }, { status: 409 })
    }

    let player: Player | null = null
    if (attendee.player_id) {
      const { data } = await db.from('coach_players').select(PLAYER_COLUMNS)
        // This academy's player only (an attendee row can point at any id).
        .eq('id', attendee.player_id).eq('coach_id', coachId).maybeSingle()
      player = (data as unknown as Player) ?? null
    }
    const { data: profile } = await db.from('sports_profiles')
      .select('brand_name, brand_logo_url, display_name, contact_email').eq('id', coachId).maybeSingle()

    const r = await sendCampStage({
      apiKey, camp, attendee, player, profile: profile ?? null, stage,
      origin: publicSiteOrigin(new URL(req.url).origin),
    })
    await recordRetry(db, log.id, r)

    if (!r.ok) {
      return NextResponse.json({
        error: r.noAddress
          ? `There is no email address on file for ${attendee.player_name || 'this person'}. Add one on the Players page, then send it again.`
          : `That did not send: ${r.error}. Try again in a minute.`,
      }, { status: 502 })
    }
    return NextResponse.json({ ok: true, to: r.to })
  } catch (e) {
    console.error('[camp-email-resend]', e)
    return NextResponse.json({ error: 'That did not send. Try again in a minute.' }, { status: 500 })
  }
}
