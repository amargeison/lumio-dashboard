import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publicSiteOrigin } from '@/lib/public-origin'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { sendBookingConfirmation } from '@/lib/coach/booking-confirm'
import { syncBooking } from '@/lib/coach/calendar'
import { bookingState, bookingPlace, type BookingRow } from '@/lib/coach/booking-email'
import { matchVenue, type VenueRow } from '@/lib/coach/booking-venue'
import { sendEmail } from '@/lib/emails/send'
import { overlaps, slotWords } from '@/lib/coach/slot-offer'

export const runtime = 'nodejs'

// A client's own free-slot link — /slot/<token>, no account needed.
//
//   GET   the slot, and whether it is still there
//   POST  { action: 'accept' | 'decline' | 'stop' }
//
// "First to say yes" is the database's decision: the offer is moved from open
// to taken in one statement that only succeeds while it is still open, so two
// people pressing Yes at the same moment cannot both get it. Only then is the
// lesson written into the diary, confirmed to the family, put in the coach's
// calendar, and the coach told.

const TOKEN_RE = /^[A-Za-z0-9_-]{12,64}$/
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''
const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function load(token: string) {
  if (!TOKEN_RE.test(token)) return null
  const sb = db()
  const { data: r } = await sb.from('coach_slot_offer_recipients').select('*').eq('token', token).maybeSingle()
  if (!r) return null
  const [{ data: offer }, { data: player }, { data: prof }] = await Promise.all([
    sb.from('coach_slot_offers').select('*').eq('id', r.offer_id).maybeSingle(),
    sb.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email, free_slot_pings').eq('id', r.player_id).maybeSingle(),
    sb.from('sports_profiles').select('brand_name, display_name, brand_logo_url, contact_email').eq('id', r.coach_id).maybeSingle(),
  ])
  if (!offer || !player) return null
  const { data: venue } = offer.venue_id ? await sb.from('coach_venues').select('name, address').eq('id', offer.venue_id).maybeSingle() : { data: null }
  return { sb, r, offer, player, prof, venue }
}

function stateOf(g: NonNullable<Awaited<ReturnType<typeof load>>>): 'open' | 'yours' | 'gone' | 'closed' {
  if (g.offer.status === 'taken') return g.offer.taken_by === g.player.id ? 'yours' : 'gone'
  if (g.offer.status !== 'open' || Date.parse(g.offer.expires_at) <= Date.now()) return 'closed'
  return 'open'
}

function view(g: NonNullable<Awaited<ReturnType<typeof load>>>) {
  return {
    academy: g.prof?.brand_name || 'Your coach', coachName: g.offer.assigned_coach || g.prof?.display_name || null,
    logoUrl: g.prof?.brand_logo_url || null, playerFirst: first(g.player.name),
    date: g.offer.booking_date, time: g.offer.start_time, durMin: g.offer.duration_min, type: g.offer.type,
    venue: g.venue ? { name: g.venue.name, address: g.venue.address || null } : null, court: g.offer.court || null, note: g.offer.note || null,
    when: slotWords(g.offer.booking_date, g.offer.start_time), state: stateOf(g), response: g.r.response || null,
    subscribed: !!g.player.free_slot_pings,
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const g = await load(token)
  if (!g) return NextResponse.json({ error: 'This link is not valid.' }, { status: 404 })
  if (!g.r.opened_at) await g.sb.from('coach_slot_offer_recipients').update({ opened_at: new Date().toISOString() }).eq('id', g.r.id)
  return NextResponse.json(view(g))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const limit = rateLimit(`slot:${clientIp(req.headers)}`, 20, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  const g = await load(token)
  if (!g) return NextResponse.json({ error: 'This link is not valid.' }, { status: 404 })
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }
  const now = new Date().toISOString()

  if (action === 'stop') {
    await g.sb.from('coach_players').update({ free_slot_pings: false }).eq('id', g.player.id)
    if (!g.r.response) await g.sb.from('coach_slot_offer_recipients').update({ response: 'declined', responded_at: now }).eq('id', g.r.id)
    return NextResponse.json({ ...view({ ...g, player: { ...g.player, free_slot_pings: false } }), stopped: true })
  }
  if (action === 'decline') {
    if (!g.r.response) await g.sb.from('coach_slot_offer_recipients').update({ response: 'declined', responded_at: now }).eq('id', g.r.id)
    return NextResponse.json({ ...view(g), response: 'declined' })
  }
  if (action !== 'accept') return NextResponse.json({ error: 'Choose yes or no.' }, { status: 400 })
  const st = stateOf(g)
  if (st === 'yours') return NextResponse.json(view(g))
  if (st !== 'open') {
    await g.sb.from('coach_slot_offer_recipients').update({ response: 'too_late', responded_at: now }).eq('id', g.r.id)
    return NextResponse.json({ ...view(g), state: st }, { status: 409 })
  }

  const o = g.offer
  // Still free in the coach's diary? They may have filled it another way since.
  const { data: heads } = o.staff_id ? { data: [] } : await g.sb.from('coach_staff').select('id').eq('coach_id', o.coach_id).eq('is_head', true)
  const headIds = new Set((heads || []).map(h => h.id as string))
  const { data: dayRows } = await g.sb.from('coach_bookings').select('start_time, duration_min, staff_id').eq('coach_id', o.coach_id).eq('booking_date', o.booking_date).neq('status', 'cancelled')
  const clash = (dayRows || []).some(x => (o.staff_id ? x.staff_id === o.staff_id : !x.staff_id || headIds.has(x.staff_id))
    && overlaps(o.start_time, o.duration_min, String(x.start_time || '').slice(0, 5), Number(x.duration_min) || 60))
  if (clash) {
    await g.sb.from('coach_slot_offers').update({ status: 'withdrawn', updated_at: now }).eq('id', o.id).eq('status', 'open')
    return NextResponse.json({ ...view(g), state: 'gone' }, { status: 409 })
  }

  // The claim: only one person can move it from open to taken.
  const { data: won } = await g.sb.from('coach_slot_offers').update({ status: 'taken', taken_by: g.player.id, updated_at: now })
    .eq('id', o.id).eq('status', 'open').gt('expires_at', now).select('id')
  if (!won?.length) {
    await g.sb.from('coach_slot_offer_recipients').update({ response: 'too_late', responded_at: now }).eq('id', g.r.id)
    return NextResponse.json({ ...view(g), state: 'gone' }, { status: 409 })
  }

  const { data: booking, error: bErr } = await g.sb.from('coach_bookings').insert({
    coach_id: o.coach_id, title: g.player.name, player_id: g.player.id, player_name: g.player.name,
    booking_date: o.booking_date, start_time: o.start_time, duration_min: o.duration_min, type: o.type, status: 'confirmed',
    venue_id: o.venue_id, court_id: o.court_id, court: o.court, staff_id: o.staff_id, assigned_coach: o.assigned_coach,
    notes: 'Took a free-slot offer.',
  }).select('*').single()
  if (bErr || !booking) {
    // Put the offer back so somebody else can have it.
    await g.sb.from('coach_slot_offers').update({ status: 'open', taken_by: null, updated_at: new Date().toISOString() }).eq('id', o.id)
    console.error('[slot] booking', bErr)
    return NextResponse.json({ error: 'We could not book that just now. Please try again.' }, { status: 500 })
  }
  await g.sb.from('coach_slot_offers').update({ booking_id: booking.id }).eq('id', o.id)
  await g.sb.from('coach_slot_offer_recipients').update({ response: 'accepted', responded_at: now }).eq('id', g.r.id)

  const origin = publicSiteOrigin(new URL(req.url).origin)
  // Into the coach's calendar, and the usual confirmation to the family.
  try {
    const [h, m] = String(o.start_time).split(':').map(Number)
    const end = h * 60 + m + o.duration_min
    const pad = (n: number) => String(n).padStart(2, '0')
    await syncBooking(o.coach_id, { bookingId: booking.id, title: g.player.name, start: `${o.booking_date}T${pad(h)}:${pad(m)}:00`, end: `${o.booking_date}T${pad(Math.floor(end / 60) % 24)}:${pad(end % 60)}:00`, location: o.court || undefined })
  } catch (e) { console.error('[slot] calendar sync', e) }
  try {
    const { data: settings } = await g.sb.from('coach_settings').select('data').eq('coach_id', o.coach_id).maybeSingle()
    const [{ data: venueRows }, { data: courtRows }] = await Promise.all([
      g.sb.from('coach_venues').select('id,name,is_home').eq('coach_id', o.coach_id),
      g.sb.from('coach_courts').select('name,venue_id').eq('coach_id', o.coach_id),
    ])
    const place = bookingPlace(booking as BookingRow, matchVenue((venueRows ?? []) as VenueRow[], (booking as BookingRow).court, { venueId: (booking as BookingRow).venue_id, courts: courtRows ?? [] }))
    const to = g.r.sent_to || g.player.parent_email || g.player.email || null
    await g.sb.from('coach_bookings').update({ told_state: bookingState(booking as BookingRow, place), told_to: to }).eq('id', booking.id)
    if ((settings?.data as Record<string, unknown> | null)?.bookingEmails !== false && to) {
      await sendBookingConfirmation({ coachId: o.coach_id, booking: booking as BookingRow, origin, db: g.sb, override: { to, toParent: !!g.player.parent_email && to === g.player.parent_email, reason: 'took a free-slot offer' } })
    }
  } catch (e) { console.error('[slot] confirmation', e) }

  // Tell the coach.
  const coachTo = g.prof?.contact_email as string | undefined
  if (coachTo) {
    const when = slotWords(o.booking_date, o.start_time)
    await sendEmail({
      from: 'Lumio Tennis <noreply@lumiosports.com>', to: [coachTo], subject: `${g.player.name} took your free slot: ${when}`,
      html: `<p style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;color:#1a1d29">${esc(g.player.name)} said yes to your free slot on ${esc(when)}. It is in your Lumio diary${o.court ? ` (${esc(o.court)})` : ''}, and everyone else you offered it to will be told it has gone if they open their link.</p>`,
      context: 'coach/free slot taken',
    }).catch(() => null)
  }
  return NextResponse.json({ ...view({ ...g, offer: { ...o, status: 'taken', taken_by: g.player.id } }), booked: true })
}
