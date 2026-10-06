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
import { partnerBrandByCoach, STANDARD_SIGN_IN } from './partner-login'

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
  const { player, last, venue, profile, hasApp, coach } = await gatherBookingContext(coachId, b)
  // The academy's own look: its accent colour (the email used to be Lumio blue
  // whatever the academy had chosen) and its logo at a real web address (the
  // stored one is a data URL, which Gmail and Outlook refuse to show).
  const brand = await partnerBrandByCoach(coachId)
  const accent = brand?.accent
  const logoUrl = brand?.emailLogoUrl || profile?.brand_logo_url
  // The player app, via the academy's own sign-in page when it has one.
  const signIn = hasApp ? (brand?.signInUrl || STANDARD_SIGN_IN) : null
  const appUrl = signIn ? `${signIn}?redirectTo=${encodeURIComponent('/portal')}` : null
  const academy = profile?.brand_name || 'Your academy'
  // The coach taking THIS session — an assistant's booking names the assistant.
  // A reply still goes to the academy's mailbox, so that line names the academy.
  const coachName = coach.name
  const replyName = coach.isHead ? undefined : academy
  const playerName = player?.name || b.player_name || b.title || 'your player'

  // The day as it goes in a subject line: "Mon 5 Oct 2026", not "2026-10-05".
  // Named from the date alone (midday UTC, read back in UTC), so it is the same
  // calendar day on any server in any season.
  const dayRaw = String(b.booking_date || '').slice(0, 10)
  const dayAt = dayRaw ? new Date(`${dayRaw}T12:00:00Z`) : null
  const subjectDay = dayAt && !Number.isNaN(dayAt.getTime())
    ? dayAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : ''

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
    // Only the id the booking itself carries. Without one, notifyBooked works it
    // out from the name and declines when two players share it.
    playerId: b.player_id || null,
    playerName,
    kind: 'lesson',
    title: `${b.type || 'Lesson'} with ${coachName || academy}`,
    date: b.booking_date,
    time: b.start_time ? String(b.start_time).slice(0, 5) : null,
    durationMin: b.duration_min,
    location: [place, venue?.address].filter(Boolean).join(', ') || null,
    // No `detail`. It used to carry the booking's notes, which are the coach's
    // own ("check on the shoulder", "owes for last month") and, on a booking made
    // online, a phone number. The family reads this message; the email to them
    // already leaves the notes out for the same reason.
    googleUrl: b.booking_date ? googleCalendarUrl(event) : null,
    icsUrl: b.booking_date ? icsUrl(origin, 'booking', b.id) : null,
    dedupeKey: b.id,
  })

  // ── 1. Player / parent ──────────────────────────────────────────────────
  if (rec.to) {
    const html = buildConfirmationHtml({
      academy, coachName, replyName, logoUrl, accent, playerName,
      greetingName: rec.toParent ? (player?.parent_name || 'there') : playerName.split(' ')[0],
      toParent: rec.toParent, booking: b, venue, last, calendarHtml, appUrl,
    })
    const subject = [`Session booked — ${playerName}`, subjectDay].filter(Boolean).join(' · ')
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
  // To the head coach, and to the coach whose session it is when that is
  // somebody else — an online booking in an assistant's diary used to be
  // announced to the head coach only.
  const headTo = profile?.contact_email || null
  const sessionTo = !coach.isHead && coach.email && coach.email.toLowerCase() !== String(headTo || '').toLowerCase() ? coach.email : null
  const copies = [
    ...(headTo ? [{ to: headTo, greet: profile?.display_name || 'Coach', head: true }] : []),
    ...(sessionTo ? [{ to: sessionTo, greet: coach.name, head: false }] : []),
  ]
  for (const copy of copies) {
    const html = buildConfirmationHtml({
      academy, coachName, logoUrl, accent, playerName,
      greetingName: copy.greet || 'Coach', toParent: false, booking: b, venue, last, forCoach: true, calendarHtml,
    })
    const note = rec.to ? `Confirmation sent to ${rec.to} (${rec.reason}).` : `NOT sent to the player — ${rec.reason}.`
    // The coach's copy states where the player's copy went and why, so the
    // safeguarding decision is visible rather than buried in a log. Built once
    // and used for BOTH sends below — the fallback (no mailbox connected, which
    // is how every new academy starts) used to send the copy without this line.
    const coachHtml = html.replace('</body>', `<div style="max-width:560px;margin:0 auto 22px;font-size:12px;color:#6b7280;text-align:center">${note}</div></body>`)
    const coachSubject = [`New booking — ${playerName}`, subjectDay].filter(Boolean).join(' · ')
    const sent = await sendAsCoach(coachId, { to: copy.to, subject: coachSubject, html: coachHtml })
    let ok = sent.ok
    if (!sent.ok) {
      const fb = await sendEmail({
        from: 'Lumio Tennis <noreply@lumiosports.com>', to: [copy.to],
        subject: coachSubject, html: coachHtml,
        context: 'coach booking confirmation coach-fallback',
      }).catch(() => null)
      ok = !!fb && !fb.error
    }
    if (copy.head) results.coachSent = ok; else results.sessionCoachSent = ok
  }
  if (!headTo) {
    results.coachSent = false
    results.coachReason = 'no contact email on the coach profile (Settings → contact details)'
  }

  return results
}
