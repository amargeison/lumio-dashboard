import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'
import {
  gatherBookingContext, resolveRecipient, buildConfirmationHtml, type BookingRow,
} from '@/lib/coach/booking-email'

// Booking confirmation. Called (fire-and-forget) when a booking is CREATED.
//
// Two emails go out: one to the player or their parent, and one to the coach so a
// new booking never goes unseen. They are sent AS THE COACH via their connected
// mailbox — iCloud SMTP, Gmail or Outlook — because a parent should recognise the
// sender. Lumio's own transport (Resend) is only a fallback for a coach with no
// mailbox connected, and it is clearly a different from-address.
//
// Auth is the coach's own session, and the booking is re-read server-side scoped
// to their coach_id — the client passes an id, never the content of the email.

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { bookingId } = (await req.json().catch(() => ({}))) as { bookingId?: string }
  if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })

  try {
    const db = serviceClient()
    const { data: booking } = await db.from('coach_bookings').select('*')
      .eq('id', bookingId).eq('coach_id', coachId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const b = booking as BookingRow
    // A cancelled booking is not something to send a "thanks for booking" about.
    if ((b.status || '').toLowerCase() === 'cancelled') {
      return NextResponse.json({ sent: false, reason: 'booking is cancelled' })
    }

    const { player, last, venue, profile } = await gatherBookingContext(coachId, b)
    const academy = profile?.brand_name || 'Your academy'
    const coachName = profile?.display_name || ''
    const playerName = player?.name || b.player_name || b.title || 'your player'

    const rec = resolveRecipient(player)
    const results: Record<string, unknown> = { to: rec.to, toParent: rec.toParent, reason: rec.reason }

    // ── 1. Player / parent ────────────────────────────────────────────────
    if (rec.to) {
      const html = buildConfirmationHtml({
        academy, coachName, logoUrl: profile?.brand_logo_url, playerName,
        greetingName: rec.toParent ? (player?.parent_name || 'there') : playerName.split(' ')[0],
        toParent: rec.toParent, booking: b, venue, last,
      })
      const subject = `Session booked — ${playerName} · ${b.booking_date || ''}`.trim()
      const sent = await sendAsCoach(coachId, { to: rec.to, subject, html })
      if (!sent.ok) {
        // Fallback: Lumio's transport. Reply-to is the coach so a parent replying
        // still reaches a human, even though the from-address is not theirs.
        const fb = await sendEmail({
          from: 'Lumio Tennis <noreply@lumiosports.com>', to: [rec.to], subject, html,
          replyTo: profile?.contact_email || undefined,
        }).catch(() => null)
        results.playerSent = !!fb; results.via = 'lumio-fallback'
      } else { results.playerSent = true; results.via = sent.provider }
    } else {
      results.playerSent = false
    }

    // ── 2. Coach copy ─────────────────────────────────────────────────────
    const coachTo = profile?.contact_email || null
    if (coachTo) {
      const html = buildConfirmationHtml({
        academy, coachName, logoUrl: profile?.brand_logo_url, playerName,
        greetingName: coachName || 'Coach', toParent: false, booking: b, venue, last, forCoach: true,
      })
      const note = rec.to ? `Confirmation sent to ${rec.to} (${rec.reason}).` : `NOT sent to the player — ${rec.reason}.`
      const sent = await sendAsCoach(coachId, {
        to: coachTo,
        subject: `New booking — ${playerName} · ${b.booking_date || ''}`.trim(),
        // The coach's copy states where the player's copy went and why, so the
        // safeguarding decision is visible rather than buried in a log.
        html: html.replace('</body>', `<div style="max-width:560px;margin:0 auto 22px;font-size:12px;color:#6b7280;text-align:center">${note}</div></body>`),
      })
      results.coachSent = sent.ok
    } else {
      results.coachSent = false
      results.coachReason = 'no contact email on the coach profile (Settings → contact details)'
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (err) {
    console.error('[coach/bookings/confirm]', err)
    return NextResponse.json({ error: 'Could not send the confirmation' }, { status: 500 })
  }
}
