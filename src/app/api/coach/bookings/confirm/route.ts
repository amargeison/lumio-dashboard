import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { publicSiteOrigin } from '@/lib/public-origin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  gatherBookingContext, resolveRecipient, buildConfirmationHtml, bookingState, bookingStatusClass, bookingPlace, toldSame,
  type BookingRow,
} from '@/lib/coach/booking-email'
import { matchVenue, type VenueRow } from '@/lib/coach/booking-venue'
import { notifyBooked } from '@/lib/coach/booking-notify'
import { googleCalendarUrl, icsUrl } from '@/lib/coach/calendar-links'
import { sendBookingConfirmation } from '@/lib/coach/booking-confirm'
import { calendarButtonsHtml } from '@/lib/coach/calendar-links'
import { partnerBrandByCoach } from '@/lib/coach/partner-login'
import { londonToday } from '@/lib/coach/booking-slots'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'

// Telling the family about a booking. Called (fire-and-forget) by the portal
// whenever a booking is created OR changed; the client passes an id and nothing
// else.
//
// THE SERVER DECIDES what, if anything, there is to say. Each booking remembers
// what the family was last told (coach_bookings.told_state — day, time, length,
// status). Comparing that with the row as it now stands gives one of:
//
//   • never told, and now confirmed  → the full "Booking confirmed" email
//     (lib/coach/booking-confirm.ts, shared with the public booking link).
//     This is also what a Pending booking gets on the day it is confirmed.
//   • told, and the day or time has changed → a short "Session moved"
//   • told, and only the venue or court has changed → the same note, worded
//     as a change of place
//   • told, and now cancelled               → a short "Session cancelled"
//   • told, and about to be DELETED         → the same "Session cancelled".
//     The portal calls this with `removing: true` just before it deletes the
//     row, because afterwards there is nothing left to say who to tell.
//
// The "Session booked" message in the family's portal is brought up to date at
// the same time, so it never goes on claiming a session that has since moved,
// been cancelled or been deleted.
//   • pending, or nothing they were told has changed → nothing
//
// So a Pending booking is never announced as confirmed, saving a note on a
// booking never re-thanks anybody, and calling this twice sends once.
//
// The academy's "Email a confirmation when a booking is made" switch is read
// HERE, from the database. It used to be honoured only by the browser that
// made the booking, so any other caller sent regardless.
//
// Auth is the caller's own session, and the booking is first read AS THEM, so
// row level security decides whether it is theirs: the head coach sees every
// booking in the academy, an assistant only their own. Everything after that
// is scoped to the academy the booking belongs to.

// `place` is missing on states written before the venue was part of them.
type Told = { date: string; time: string; mins: string; cls: string; place: string | null }
const parseTold = (s?: string | null): Told | null => {
  const p = String(s || '').split('|')
  return p.length >= 4 ? { date: p[0], time: p[1], mins: p[2], cls: p[3], place: p.length > 4 ? p.slice(4).join('|') : null } : null
}

export async function POST(req: NextRequest) {
  const userId = await sessionCoachId()
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(userId)) return notAnAcademy()

  const { bookingId, removing: removingRaw } = (await req.json().catch(() => ({}))) as { bookingId?: string; removing?: boolean }
  const removing = removingRaw === true
  if (!bookingId || !/^[0-9a-f-]{36}$/i.test(String(bookingId))) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })

  try {
    const cookieStore = await cookies()
    const asUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    )
    const { data: mine } = await asUser.from('coach_bookings').select('id, coach_id').eq('id', bookingId).maybeSingle()
    if (!mine?.coach_id) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    const coachId = mine.coach_id as string

    const db = serviceClient()
    const { data: booking } = await db.from('coach_bookings').select('*')
      .eq('id', bookingId).eq('coach_id', coachId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const b = booking as BookingRow
    // Where it is, by the same rule the email and the family's page use.
    const [{ data: venueRows }, { data: courtRows }] = await Promise.all([
      db.from('coach_venues').select('id,name,is_home').eq('coach_id', coachId),
      db.from('coach_courts').select('name,venue_id').eq('coach_id', coachId),
    ])
    const placeKey = bookingPlace(b, matchVenue((venueRows ?? []) as VenueRow[], b.court, { venueId: b.venue_id, courts: courtRows ?? [] }))
    // A booking about to be deleted is, to the family, a cancelled one.
    const cls = removing ? 'cancelled' : bookingStatusClass(b.status)
    const now = bookingState(removing ? { ...b, status: 'cancelled' } : b, placeKey)
    const told = parseTold(b.told_state)
    const placeOnly = !!told && told.place != null && told.place !== placeKey.replace(/\|/g, ' ')
      && now.split('|').slice(0, 3).join('|') === [told.date, told.time, told.mins].join('|')

    let kind: 'booked' | 'moved' | 'cancelled' | null = null
    let reason = ''
    if (toldSame(b.told_state, now)) reason = 'nothing has changed since the family was last told'
    else if (cls === 'pending') reason = 'booking is pending — the family is told when it is confirmed'
    else if (cls === 'cancelled') {
      if (told?.cls === 'booked') kind = 'cancelled'
      else reason = 'booking is cancelled and the family was never told about it'
    }
    else if (told?.cls !== 'booked') kind = 'booked'
    else kind = 'moved'

    // A lesson that has already been and gone is being tidied up, not rearranged.
    if ((kind === 'moved' || kind === 'cancelled') && String(b.booking_date || '').slice(0, 10) < londonToday()) {
      kind = null; reason = 'the session is in the past'
    }

    // Claim it before sending anything: of two calls for the same change, only
    // the one that moves told_state on gets to send.
    if (b.told_state !== now) {
      const claim = db.from('coach_bookings').update({ told_state: now }).eq('id', b.id).eq('coach_id', coachId)
      const { data: won, error: claimErr } = await (b.told_state == null ? claim.is('told_state', null) : claim.eq('told_state', b.told_state)).select('id')
      if (claimErr) {
        console.error('[coach/bookings/confirm] claim', claimErr.message)
        return NextResponse.json({ error: 'Could not send the confirmation' }, { status: 500 })
      }
      if (!won?.length) return NextResponse.json({ ok: true, sent: false, reason: 'already handled' })
    }
    if (!kind) return NextResponse.json({ ok: true, sent: false, reason })

    const origin = publicSiteOrigin(new URL(req.url).origin)

    // The portal's own message about this lesson, whatever the email switch
    // says: the switch is about email, and a message the family can already read
    // must not be left saying something that is no longer true.
    const ctx = kind === 'booked' ? null : await gatherBookingContext(coachId, b)
    if (ctx && kind !== 'booked') {
      const academyName = ctx.profile?.brand_name || 'Your academy'
      const who = ctx.player?.name || b.player_name || b.title || 'your player'
      const where = [ctx.venue?.name, b.court].filter(Boolean).join(' · ') || b.court || null
      const event = {
        title: `${b.type || 'Lesson'} — ${who} · ${academyName}`,
        date: String(b.booking_date || ''),
        time: b.start_time ? String(b.start_time).slice(0, 5) : null,
        durationMin: b.duration_min,
        location: [where, ctx.venue?.address].filter(Boolean).join(', ') || undefined,
        description: `Booked with ${academyName}.`,
        uid: `booking-${b.id}`,
      }
      await notifyBooked(db, {
        academyId: coachId, playerId: b.player_id || null, playerName: who, kind: 'lesson',
        title: `${b.type || 'Lesson'} with ${ctx.coach.name || academyName}`,
        date: b.booking_date, time: event.time, durationMin: b.duration_min,
        location: event.location || null,
        googleUrl: b.booking_date ? googleCalendarUrl(event) : null,
        icsUrl: b.booking_date ? icsUrl(origin, 'booking', b.id) : null,
        dedupeKey: b.id,
        change: kind === 'cancelled' ? 'cancelled' : placeOnly ? 'place' : 'moved',
      })
    }

    // The academy's own switch, read from the database rather than trusted
    // from whichever browser made the booking.
    const { data: settings, error: setErr } = await db.from('coach_settings').select('data').eq('coach_id', coachId).maybeSingle()
    if (setErr) {
      console.error('[coach/bookings/confirm] settings', setErr.message)
      return NextResponse.json({ error: 'Could not send the confirmation' }, { status: 500 })
    }
    if ((settings?.data as Record<string, unknown> | null)?.bookingEmails === false) {
      return NextResponse.json({ ok: true, sent: false, reason: 'booking emails are switched off in Settings' })
    }

    if (kind === 'booked' || !ctx) {
      const results = await sendBookingConfirmation({ coachId, booking: b, origin, db })
      if (results.to) await db.from('coach_bookings').update({ told_to: String(results.to) }).eq('id', b.id).eq('coach_id', coachId)
      return NextResponse.json({ ok: true, kind, ...results })
    }

    // ── Moved or cancelled ────────────────────────────────────────────────
    // To the address on the player's record AS IT IS NOW, by the usual rule (a
    // parent for an under-16, never the child). The address the confirmation
    // went to is used instead only when it is still one of this player's, when
    // the record gives no address at all, or when it was typed by the person who
    // booked online (the booking's notes name them) — they asked for this
    // session and are not necessarily on the record. It used to be used always,
    // so a parent's address corrected on the roster went on being ignored.
    const { player, venue, profile } = ctx
    const rule = resolveRecipient(player)
    const toldTo = (b.told_to || '').trim()
    const onRecord = !!toldTo && [player?.email, player?.contact_email, player?.parent_email]
      .some(a => String(a || '').trim().toLowerCase() === toldTo.toLowerCase())
    const bookedOnline = !!toldTo && String(b.notes || '').toLowerCase().includes(`(${toldTo.toLowerCase()})`)
    const to = (toldTo && (onRecord || bookedOnline || !rule.to)) ? toldTo : rule.to
    if (!to) return NextResponse.json({ ok: true, kind, sent: false, playerSent: false, reason: rule.reason })
    const toParent = to === rule.to ? rule.toParent : (!!player?.parent_email && player.parent_email.trim().toLowerCase() === to.toLowerCase())

    const brand = await partnerBrandByCoach(coachId)
    const academy = profile?.brand_name || 'Your academy'
    // The coach taking this session (see gatherBookingContext); replies reach the academy's mailbox.
    const coachName = ctx.coach.name
    const replyName = ctx.coach.isHead ? undefined : academy
    const playerName = player?.name || b.player_name || b.title || 'your player'
    const place = [venue?.name, b.court].filter(Boolean).join(' · ') || null
    const html = buildConfirmationHtml({
      kind, placeOnly: kind === 'moved' && placeOnly, academy, coachName, replyName, playerName,
      logoUrl: brand?.emailLogoUrl || profile?.brand_logo_url, accent: brand?.accent,
      greetingName: toParent ? (player?.parent_name || 'there') : playerName.split(' ')[0],
      toParent, booking: b, venue,
      // A moved session gets fresh calendar buttons — the entry carries the
      // booking's own id, so adding it again updates the old one.
      calendarHtml: kind === 'moved' && b.booking_date ? calendarButtonsHtml({
        title: `${b.type || 'Lesson'} — ${playerName} · ${academy}`,
        date: String(b.booking_date),
        time: b.start_time ? String(b.start_time).slice(0, 5) : null,
        durationMin: b.duration_min,
        location: [place, venue?.address].filter(Boolean).join(', ') || undefined,
        description: `Booked with ${academy}.`,
        uid: `booking-${b.id}`,
      }, origin, 'booking', b.id) : null,
    })
    // The day as people write it ("Mon 5 Oct 2026"), not the stored "2026-10-05".
    const dayAt = b.booking_date ? new Date(`${String(b.booking_date).slice(0, 10)}T12:00:00Z`) : null
    const subjectDay = dayAt && !Number.isNaN(dayAt.getTime())
      ? dayAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
      : ''
    const subject = [`${kind === 'moved' ? (placeOnly ? 'Session venue changed' : 'Session moved') : 'Session cancelled'} — ${playerName}`, subjectDay].filter(Boolean).join(' · ')
    const sent = await sendAsCoach(coachId, { to, subject, html })
    let playerSent = sent.ok
    if (!sent.ok) {
      // Lumio's own transport as a fallback, reply-to the coach. sendEmail
      // resolves with an error rather than throwing, so the error is read.
      const fb = await sendEmail({
        from: 'Lumio Tennis <noreply@lumiosports.com>', to: [to], subject, html,
        replyTo: profile?.contact_email || undefined,
        context: `coach booking ${kind}`,
      }).catch(() => null)
      playerSent = !!fb && !fb.error
    }
    if (playerSent && to !== toldTo) await db.from('coach_bookings').update({ told_to: to }).eq('id', b.id).eq('coach_id', coachId)
    return NextResponse.json({ ok: true, kind, to, toParent, playerSent })
  } catch (err) {
    console.error('[coach/bookings/confirm]', err)
    return NextResponse.json({ error: 'Could not send the confirmation' }, { status: 500 })
  }
}
