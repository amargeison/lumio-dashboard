import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publicSiteOrigin } from '@/lib/public-origin'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { freeSlots } from '@/lib/coach/booking-slots'
import { sendBookingConfirmation } from '@/lib/coach/booking-confirm'
import { syncBooking } from '@/lib/coach/calendar'
import type { BookingRow } from '@/lib/coach/booking-email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUBLIC booking link. No session — a player following a link their coach sent.
//
// GET  → what the page needs: the coach's name, what is being booked, and the
//        real free slots for the next three weeks.
// POST → takes the slot, writes the booking, sends the confirmations.
//
// This runs on the service-role key with no authentication, so the same
// discipline as the camp sign-up route applies, plus one more that is specific
// to a diary:
//
//   • It never returns a booking, a player, a contact detail or a note. The only
//     thing that leaves is a list of times the coach is FREE — which is exactly
//     what the coach chose to publish by sending the link, and reveals nothing
//     about who the busy hours belong to.
//   • The slot is re-checked against live availability at the moment of booking.
//     A time posted from a stale page, or typed by hand, is refused — that check
//     is the only thing standing between a public endpoint and a double booking.
//   • Duration, session type, court and which coach it is with come from the LINK
//     ROW, never from the request body. Nothing about the shape of the session is
//     decided in somebody else's browser.
//   • A personal link is single-use; a general one is reusable but still rate
//     limited per IP and per link.

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}
const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max)
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

type LinkRow = {
  id: string; coach_id: string; staff_id: string | null; player_id: string | null
  token: string; name: string | null; email: string | null
  duration_min: number; session_type: string | null; venue_id: string | null
  court: string | null; note: string | null
  reusable: boolean; uses: number; booking_id: string | null
  revoked_at: string | null; expires_at: string
}

/** Why this link cannot be used, or null if it can. Deliberately vague to the
    outside world about which case it is — "ask your coach" is the useful answer
    either way, and precision here is free information to somebody guessing. */
function linkProblem(l: LinkRow | null): string | null {
  if (!l) return 'This booking link isn’t valid any more.'
  if (l.revoked_at) return 'This booking link has been turned off by your coach.'
  if (new Date(l.expires_at).getTime() < Date.now()) return 'This booking link has expired.'
  if (!l.reusable && (l.uses > 0 || l.booking_id)) return 'This link has already been used to book a session.'
  return null
}

async function loadLink(sb: ReturnType<typeof db>, token: string) {
  const { data } = await sb.from('coach_booking_links').select('*').eq('token', token).maybeSingle()
  return (data || null) as LinkRow | null
}

// ── GET: the page ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const t = clean(token, 80)
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ip = clientIp(req.headers)
  const gate = rateLimit(`book-get:${ip}`, 60, 60_000)
  if (!gate.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const sb = db()
  const link = await loadLink(sb, t)
  const problem = linkProblem(link)
  if (!link) return NextResponse.json({ error: problem }, { status: 404 })

  const [{ data: profile }, { data: venue }, { data: staff }] = await Promise.all([
    sb.from('sports_profiles').select('brand_name, display_name, brand_logo_url, contact_email').eq('id', link.coach_id).maybeSingle(),
    link.venue_id
      ? sb.from('coach_venues').select('name, address').eq('id', link.venue_id).maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
    link.staff_id
      ? sb.from('coach_staff').select('name').eq('id', link.staff_id).maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
  ])

  const head = {
    academy: profile?.brand_name || 'Your coach',
    coachName: staff?.name || profile?.display_name || '',
    logoUrl: profile?.brand_logo_url || null,
    durationMin: link.duration_min,
    sessionType: link.session_type || 'Private',
    venue: venue ? { name: venue.name as string, address: (venue.address as string) || null } : null,
    note: link.note || null,
    invitedName: link.name || '',
    invitedEmail: link.email || '',
    /** A link sent to a player on the roster already knows who they are. */
    known: !!link.player_id,
  }

  if (problem) return NextResponse.json({ ...head, closed: problem, days: [] })

  const days = await freeSlots(sb, link.coach_id, { durationMin: link.duration_min, days: 21 })
  return NextResponse.json({ ...head, days })
}

// ── POST: take the slot ─────────────────────────────────────────────────────
export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const t = clean(token, 80)
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const date = clean(b.date, 10)
  const time = clean(b.time, 5)
  const forChild = !!b.for_child
  const who = clean(b.player_name, 80)          // the player — the child, or the adult themselves
  const contactName = clean(b.contact_name, 80) // whoever is filling the form in
  const email = clean(b.email, 120).toLowerCase()
  const phone = clean(b.phone, 40)
  const note = clean(b.note, 400)

  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: 'Please choose a date and time.' }, { status: 400 })
  }
  if (!who) return NextResponse.json({ error: forChild ? 'Please give your child’s name.' : 'Please give your name.' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 })

  const ip = clientIp(req.headers)
  if (!rateLimit(`book-post:${ip}`, 6, 10 * 60_000).ok || !rateLimit(`book-post-link:${t}`, 10, 60 * 60_000).ok) {
    return NextResponse.json({ error: 'Too many booking attempts. Please try again shortly.' }, { status: 429 })
  }

  const sb = db()
  const link = await loadLink(sb, t)
  const problem = linkProblem(link)
  if (!link || problem) return NextResponse.json({ error: problem || 'This booking link isn’t valid any more.' }, { status: 410 })

  try {
    // ── The slot must still be free, right now ────────────────────────────
    // Not "was free when the page loaded". Two people can hold the same page.
    const days = await freeSlots(sb, link.coach_id, { durationMin: link.duration_min, days: 21 })
    const day = days.find(d => d.date === date)
    if (!day || !day.slots.includes(time)) {
      return NextResponse.json({
        error: 'That time has just gone — please pick another.',
        days,
      }, { status: 409 })
    }

    // ── Who this is ───────────────────────────────────────────────────────
    // A link sent to somebody on the roster already knows. Otherwise match on
    // the email they typed before creating anybody: a parent who books twice
    // should not become two players.
    let playerId = link.player_id
    let playerName = who
    if (playerId) {
      const { data: p } = await sb.from('coach_players').select('name').eq('id', playerId).maybeSingle()
      if (p?.name) playerName = p.name
    } else {
      // PostgREST's `or` filter is a comma-separated string, so an address
      // carrying a comma, quote or bracket would not be a filter any more — it
      // would be extra filters. Anything outside the ordinary email characters
      // simply skips the lookup and creates a new player, which is the safe half
      // of the wrong answer.
      if (/^[A-Za-z0-9._%+@-]+$/.test(email)) {
        const { data: match } = await sb.from('coach_players')
          .select('id, name')
          .eq('coach_id', link.coach_id)
          .or(`email.ilike.${email},contact_email.ilike.${email},parent_email.ilike.${email}`)
          .limit(1).maybeSingle()
        if (match?.id) { playerId = match.id; playerName = match.name || who }
      }
    }
    if (!playerId) {
      // New to the academy. They go on the roster, because a session in the
      // diary for somebody who does not exist is how a coach ends up with a
      // booking they cannot email, chase or write a summary for.
      //
      // The email goes where the person put it: a parent booking for a child is
      // the parent's address (and the child has no address on file at all), an
      // adult booking for themselves is their own.
      const { data: created } = await sb.from('coach_players').insert({
        coach_id: link.coach_id,
        staff_id: link.staff_id,
        name: who,
        email: forChild ? null : email,
        parent_name: forChild ? (contactName || null) : null,
        parent_email: forChild ? email : null,
        phone: phone || null,
        category: forChild ? 'Junior' : 'Adult',
        notes: 'Added from a booking link.',
      }).select('id').single()
      playerId = created?.id || null
    }

    // ── The booking ───────────────────────────────────────────────────────
    // Everything about the session comes from the link, not the request.
    const title = `${link.session_type || 'Private'} — ${playerName}`
    const { data: booking, error: bookErr } = await sb.from('coach_bookings').insert({
      coach_id: link.coach_id,
      staff_id: link.staff_id,
      player_id: playerId,
      player_name: playerName,
      title,
      type: link.session_type || 'Private',
      court: link.court || null,
      booking_date: date,
      start_time: time,
      duration_min: link.duration_min,
      status: 'confirmed',
      notes: [note, phone ? `Phone: ${phone}` : '', `Booked online by ${contactName || who} (${email}).`]
        .filter(Boolean).join('\n'),
    }).select('*').single()
    if (bookErr || !booking) {
      console.error('[book] could not write the booking', bookErr)
      return NextResponse.json({ error: 'Could not save that booking — please try again.' }, { status: 500 })
    }

    // The link has been used. Written before the emails so a mail failure cannot
    // leave a single-use link open for a second booking.
    await sb.from('coach_booking_links').update({
      uses: (link.uses || 0) + 1,
      used_at: new Date().toISOString(),
      booking_id: link.booking_id || booking.id,
      // Remember who used a link that was sent blind, so the coach's list says
      // more than "somebody".
      name: link.name || (contactName || who),
      email: link.email || email,
      player_id: link.player_id || playerId,
    }).eq('id', link.id)

    const origin = publicSiteOrigin(new URL(req.url).origin)

    // Into the coach's own calendar, the same push a coach-made booking gets.
    try {
      const [h, m] = time.split(':').map(Number)
      const total = h * 60 + m + link.duration_min
      const pad = (n: number) => String(n).padStart(2, '0')
      await syncBooking(link.coach_id, {
        bookingId: booking.id,
        title,
        start: `${date}T${pad(h)}:${pad(m)}:00`,
        end: `${date}T${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}:00`,
        location: link.court || undefined,
        description: note || undefined,
      })
    } catch (e) { console.error('[book] calendar sync', e) }

    // Confirmations — the same ones a coach-made booking sends. The recipient is
    // the adult who filled the form in; see lib/coach/booking-confirm.ts.
    let sent: Record<string, unknown> = {}
    try {
      sent = await sendBookingConfirmation({
        coachId: link.coach_id,
        booking: booking as BookingRow,
        origin,
        db: sb,
        override: {
          to: email,
          toParent: forChild,
          reason: forChild ? 'booked online by the parent — sent to them' : 'booked online — sent to the person who booked',
        },
      })
    } catch (e) { console.error('[book] confirmation', e) }

    return NextResponse.json({
      ok: true,
      date, time,
      durationMin: link.duration_min,
      emailed: !!sent.playerSent,
    })
  } catch (err) {
    console.error('[book]', err)
    return NextResponse.json({ error: 'Something went wrong booking that — please try again.' }, { status: 500 })
  }
}
