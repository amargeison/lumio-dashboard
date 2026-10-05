import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publicSiteOrigin } from '@/lib/public-origin'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { freeSlots } from '@/lib/coach/booking-slots'
import { sendBookingConfirmation } from '@/lib/coach/booking-confirm'
import { syncBooking } from '@/lib/coach/calendar'
import { bookingState, bookingPlace, type BookingRow } from '@/lib/coach/booking-email'
import { matchVenue, type VenueRow } from '@/lib/coach/booking-venue'

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
//   • The check that the slot is free and the write of the booking are ONE step
//     in the database (lumio_book_link_slot, migration 197), behind a lock. Two
//     people pressing Book on the same time at the same moment get one booking
//     and one "that time has just gone"; a single-use link is used once.
//   • A shareable link never learns who used it. Nothing a visitor types is
//     written on the link row or shown to the next visitor — each booking
//     records the person who made it and the player THEY named.

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}
const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max)
/** An address that could actually receive the confirmation: an ordinary local
    part, and a domain made of letters, digits, dots and hyphens. */
const EMAIL_RE = /^[a-z0-9._%+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i
/** A name as people type it: any capitals, stray spaces. */
const sameName = (a: unknown, b: unknown) => {
  const n = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
  return !!n(a) && n(a) === n(b)
}
/** A real calendar day, not just ten characters shaped like one. */
const realDate = (d: string) => {
  const t = new Date(`${d}T12:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d
}

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

  const [{ data: profile }, { data: venue }, { data: staff }, { data: settings }] = await Promise.all([
    sb.from('sports_profiles').select('brand_name, display_name, brand_logo_url, contact_email').eq('id', link.coach_id).maybeSingle(),
    link.venue_id
      ? sb.from('coach_venues').select('name, address').eq('id', link.venue_id).maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
    link.staff_id
      ? sb.from('coach_staff').select('name').eq('id', link.staff_id).maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
    sb.from('coach_settings').select('data').eq('coach_id', link.coach_id).maybeSingle(),
  ])

  // Only a link the coach sent to ONE named family fills the form in, and only
  // with what the coach addressed it to — and not once it is closed. A shareable
  // link is opened by anybody, so it never has anything to fill in.
  const personal = !link.reusable && !problem

  const head = {
    academy: profile?.brand_name || 'Your coach',
    coachName: staff?.name || profile?.display_name || '',
    logoUrl: profile?.brand_logo_url || null,
    durationMin: link.duration_min,
    sessionType: link.session_type || 'Private',
    venue: venue ? { name: venue.name as string, address: (venue.address as string) || null } : null,
    note: link.note || null,
    invitedName: personal ? link.name || '' : '',
    invitedEmail: personal ? link.email || '' : '',
    /** A link sent to a player on the roster already knows who they are. */
    known: personal && !!link.player_id,
    /** False when the academy has switched booking emails off, so the page
        does not promise an email that will not come. */
    emails: (settings?.data as Record<string, unknown> | null)?.bookingEmails !== false,
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
  // Names are stored tidy — one space between words — so "jenny  junior" finds
  // Jenny Junior rather than becoming a second player.
  const who = clean(b.player_name, 80).replace(/\s+/g, ' ')          // the player — the child, or the adult themselves
  const contactName = clean(b.contact_name, 80).replace(/\s+/g, ' ') // whoever is filling the form in
  const email = clean(b.email, 120).toLowerCase()
  const phone = clean(b.phone, 40)
  const note = clean(b.note, 400)

  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !realDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return NextResponse.json({ error: 'Please choose a date and time.' }, { status: 400 })
  }
  // A name has letters in it. "%" or "_" on their own are not somebody's name.
  if (!who || !/\p{L}/u.test(who)) return NextResponse.json({ error: forChild ? 'Please give your child’s name.' : 'Please give your name.' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 })

  const ip = clientIp(req.headers)
  if (!rateLimit(`book-post:${ip}`, 6, 10 * 60_000).ok) {
    return NextResponse.json({ error: 'Too many booking attempts. Please try again shortly.' }, { status: 429 })
  }

  const sb = db()
  const link = await loadLink(sb, t)
  const problem = linkProblem(link)
  if (!link || problem) return NextResponse.json({ error: problem || 'This booking link isn’t valid any more.' }, { status: 410 })

  // Per link as well as per visitor. A link sent to one family needs a handful
  // of tries; one pinned to a club noticeboard is used by many different people
  // in an evening, and ten an hour locked the eleventh family out.
  if (!rateLimit(`book-post-link:${link.id}`, link.reusable ? 40 : 10, 60 * 60_000).ok) {
    return NextResponse.json({ error: 'This link is very busy right now. Please try again in a little while.' }, { status: 429 })
  }

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
    // The booking is for the person named on the form. It is filed under an
    // existing player only when the evidence is strong:
    //
    //   • a link sent to ONE family, used for the player it was sent about; or
    //   • a player of that name whose record already holds the email typed.
    //
    // An email on its own is not enough. A parent with one child on the roster
    // who books for a second child was having it filed under the first.
    // Anybody else is new to the academy and goes on the roster as themselves.
    let playerId: string | null = null
    let playerName = who
    if (!link.reusable && link.player_id) {
      const { data: p, error } = await sb.from('coach_players').select('id, name')
        .eq('id', link.player_id).eq('coach_id', link.coach_id).maybeSingle()
      if (error) throw new Error(`player lookup: ${error.message}`)
      if (p?.id && sameName(p.name, who)) { playerId = p.id; playerName = p.name }
    }
    if (!playerId) {
      // `ilike` reads % _ and * as "anything", so it is only used for a name
      // with none of those in it; the result is compared again here either way.
      const q = sb.from('coach_players').select('id, name, email, contact_email, parent_email').eq('coach_id', link.coach_id)
      const { data: named, error } = await (/[%_*\\]/.test(who) ? q.eq('name', who) : q.ilike('name', who)).limit(50)
      if (error) throw new Error(`player lookup: ${error.message}`)
      const mine = (named || []).filter(p => sameName(p.name, who)
        && [p.email, p.contact_email, p.parent_email].some(e => String(e ?? '').trim().toLowerCase() === email))
      if (mine.length === 1) { playerId = mine[0].id; playerName = mine[0].name || who }
    }
    // New to the academy. They go on the roster, because a session in the
    // diary for somebody who does not exist is how a coach ends up with a
    // booking they cannot email, chase or write a summary for.
    //
    // The email goes where the person put it: a parent booking for a child is
    // the parent's address (and the child has no address on file at all), an
    // adult booking for themselves is their own.
    const newPlayer = playerId ? null : {
      name: who,
      email: forChild ? '' : email,
      parent_name: forChild ? contactName : '',
      parent_email: forChild ? email : '',
      phone,
      category: forChild ? 'Junior' : 'Adult',
    }

    // The coach's own settings: the gap they keep between lessons, and whether
    // bookings are emailed at all.
    const { data: settings, error: setErr } = await sb.from('coach_settings').select('data').eq('coach_id', link.coach_id).maybeSingle()
    if (setErr) throw new Error(`settings: ${setErr.message}`)
    const cfg = (settings?.data || {}) as Record<string, any>
    const buffer = Math.max(0, Math.min(60, Number(cfg?.booking?.buffer) || 0))

    // ── The booking ───────────────────────────────────────────────────────
    // Check-and-write in one locked step. Everything about the session comes
    // from the link row inside the database; the request supplies the day, the
    // time and the person.
    const { data: made, error: bookErr } = await sb.rpc('lumio_book_link_slot', {
      p_token: link.token,
      p_date: date,
      p_time: time,
      p_buffer: buffer,
      p_player_id: playerId,
      p_new_player: newPlayer,
      p_player_name: playerName,
      p_notes: [note, phone ? `Phone: ${phone}` : '', `Booked online by ${contactName || who} (${email}).`]
        .filter(Boolean).join('\n'),
    })
    if (bookErr) {
      console.error('[book] could not write the booking', bookErr)
      return NextResponse.json({ error: 'We could not save that booking. Please try again.' }, { status: 500 })
    }
    const result = (made as { result?: string; booking_id?: string } | null)?.result
    if (result === 'taken') {
      // Somebody else took it between the check above and the write.
      const fresh = await freeSlots(sb, link.coach_id, { durationMin: link.duration_min, days: 21 })
      return NextResponse.json({ error: 'That time has just gone — please pick another.', days: fresh }, { status: 409 })
    }
    if (result === 'link') {
      return NextResponse.json({ error: linkProblem(await loadLink(sb, t)) || 'This booking link isn’t valid any more.' }, { status: 410 })
    }
    const bookingId = result === 'ok' ? (made as { booking_id?: string }).booking_id : null
    const { data: booking, error: readErr } = bookingId
      ? await sb.from('coach_bookings').select('*').eq('id', bookingId).maybeSingle()
      : { data: null, error: null }
    if (readErr || !booking) {
      console.error('[book] could not write the booking', readErr || made)
      return NextResponse.json({ error: 'We could not save that booking. Please try again.' }, { status: 500 })
    }
    const title = String(booking.title || '')

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
    // the adult who filled the form in; see lib/coach/booking-confirm.ts. Not
    // sent when the academy has switched booking emails off: that switch is the
    // coach's, and it covers bookings made here as much as ones they type in.
    //
    // Either way the booking records what was said and to whom, so that if the
    // coach later moves or cancels it the same person hears about it.
    // Including WHERE, so a later change of venue or court alone is noticed.
    const [{ data: venueRows }, { data: courtRows }] = await Promise.all([
      sb.from('coach_venues').select('id,name,is_home').eq('coach_id', link.coach_id),
      sb.from('coach_courts').select('name,venue_id').eq('coach_id', link.coach_id),
    ])
    const toldPlace = bookingPlace(booking as BookingRow, matchVenue((venueRows ?? []) as VenueRow[], (booking as BookingRow).court, { venueId: (booking as BookingRow).venue_id, courts: courtRows ?? [] }))
    await sb.from('coach_bookings')
      .update({ told_state: bookingState(booking as BookingRow, toldPlace), told_to: email })
      .eq('id', booking.id)
      .then(({ error }) => { if (error) console.error('[book] told_state', error.message) })
    let sent: Record<string, unknown> = {}
    if (cfg.bookingEmails !== false) try {
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
