// "You're booked in" — the whole of it, in one place.
//
// A booking confirmation is four things, and they used to live inside one API
// route: the in-app message, the player-or-parent email, the coach's copy, and
// the safeguarding decision about which of those two people gets told. That was
// fine while the only way to make a booking was for the coach to type it in.
//
// A booking link means a booking can now be made by somebody with no account at
// all, and they must get exactly the same confirmation — same wording, same
// calendar buttons, same copy to the coach. So the route keeps the session check
// and hands the work here; the public route does the same with no session.
//
// THE OVERRIDE, and why it is not a hole in the safeguarding rule. Normally the
// recipient is derived from the player record: under 16, or age unknown, and the
// email goes to the parent — never to the child. A public booking has no player
// record to reason about, so the address comes from the form the human in front
// of it filled in: an adult booking for themselves gives their own, a parent
// booking for their child gives theirs. In both cases the message goes to the
// adult who typed it, which is the same answer the rule is protecting.

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAsCoach } from './mail'
import { sendEmail } from '@/lib/emails/send'
import {
  gatherBookingContext, resolveRecipient, buildConfirmationHtml,
  type BookingRow, type Recipients,
} from './booking-email'
import { calendarButtonsHtml, googleCalendarUrl, icsUrl, type CalendarEvent } from './calendar-links'
import { notifyBooked } from './booking-notify'

export type ConfirmInput = {
  coachId: string
  booking: BookingRow
  /** Public origin for calendar links — never the internal bind address. */
  origin: string
  db: SupabaseClient
  /** Who to email instead of the player record's answer. See above. */
  override?: Recipients | null
}

export async function sendBookingConfirmation(
  { coachId, booking: b, origin, db, override }: ConfirmInput,
): Promise<Record<string, unknown>> {
  const { player, last, venue, profile } = await gatherBookingContext(coachId, b)
  const academy = profile?.brand_name || 'Your academy'
  const coachName = profile?.display_name || ''
  const playerName = player?.name || b.player_name || b.title || 'your player'

  const rec = override && override.to ? override : resolveRecipient(player)
  const results: Record<string, unknown> = { to: rec.to, toParent: rec.toParent, reason: rec.reason }

  const place = [venue?.name, b.court].filter(Boolean).join(' · ') || b.court || null
  const event: CalendarEvent = {
    title: `${b.type || 'Lesson'} — ${playerName} · ${academy}`,
    date: String(b.booking_date || ''),
    time: b.start_time ? String(b.start_time).slice(0, 5) : null,
    durationMin: b.duration_min,
    location: [place, venue?.address].filter(Boolean).join(', ') || undefined,
    description: `Booked with ${academy}.`,
    uid: `booking-${b.id}`,
  }
  const calendarHtml = b.booking_date ? calendarButtonsHtml(event, origin, 'booking', b.id) : null

  // ── 0. In the portal ────────────────────────────────────────────────────
  // First, because this is the one that cannot bounce, cannot be filtered into
  // Promotions, and is still there next week.
  results.inApp = await notifyBooked(db, {
    academyId: coachId,
    playerName,
    kind: 'lesson',
    title: `${b.type || 'Lesson'} with ${coachName || academy}`,
    date: b.booking_date,
    time: b.start_time ? String(b.start_time).slice(0, 5) : null,
    durationMin: b.duration_min,
    location: [place, venue?.address].filter(Boolean).join(', ') || null,
    detail: b.notes || null,
    googleUrl: b.booking_date ? googleCalendarUrl(event) : null,
    icsUrl: b.booking_date ? icsUrl(origin, 'booking', b.id) : null,
    dedupeKey: b.id,
  })

  // ── 1. Player / parent ──────────────────────────────────────────────────
  if (rec.to) {
    const html = buildConfirmationHtml({
      academy, coachName, logoUrl: profile?.brand_logo_url, playerName,
      greetingName: rec.toParent ? (player?.parent_name || 'there') : playerName.split(' ')[0],
      toParent: rec.toParent, booking: b, venue, last, calendarHtml,
    })
    const subject = `Session booked — ${playerName} · ${b.booking_date || ''}`.trim()
    const sent = await sendAsCoach(coachId, { to: rec.to, subject, html })
    if (!sent.ok) {
      // Lumio's own transport as a fallback, with reply-to set to the coach so a
      // parent replying still reaches a human. sendEmail RESOLVES with an error
      // rather than throwing, so the error has to be read — testing truthiness
      // once reported a successful send for one that never left.
      const fb = await sendEmail({
        from: 'Lumio Tennis <noreply@lumiosports.com>', to: [rec.to], subject, html,
        replyTo: profile?.contact_email || undefined,
        context: 'coach booking confirmation player-fallback',
      }).catch(() => null)
      results.playerSent = !!fb && !fb.error; results.via = 'lumio-fallback'
    } else { results.playerSent = true; results.via = sent.provider }
  } else {
    results.playerSent = false
  }

  // ── 2. Coach copy ───────────────────────────────────────────────────────
  const coachTo = profile?.contact_email || null
  if (coachTo) {
    const html = buildConfirmationHtml({
      academy, coachName, logoUrl: profile?.brand_logo_url, playerName,
      greetingName: coachName || 'Coach', toParent: false, booking: b, venue, last, forCoach: true, calendarHtml,
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
    if (!sent.ok) {
      const fb = await sendEmail({
        from: 'Lumio Tennis <noreply@lumiosports.com>', to: [coachTo],
        subject: `New booking — ${playerName} · ${b.booking_date || ''}`.trim(), html,
        context: 'coach booking confirmation coach-fallback',
      }).catch(() => null)
      results.coachSent = !!fb && !fb.error
    }
  } else {
    results.coachSent = false
    results.coachReason = 'no contact email on the coach profile (Settings → contact details)'
  }

  return results
}
