import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { publicSiteOrigin } from '@/lib/public-origin'
import { familyAddress, sendFamilyEmail } from '@/lib/coach/family-mail'
import { offerClosesAt, offerMessage, overlaps } from '@/lib/coach/slot-offer'

export const runtime = 'nodejs'

// Free-slot pings, from the coach's side.
//
//   GET     recent offers and how each went
//   POST    offer a slot: { date, time, durMin, type, venueId?, courtId?, court?, note?, playerIds[] }
//   DELETE  ?id= take an open offer back
//
// Only clients who said yes to hearing about free slots (coach_players.
// free_slot_pings) can be sent one — checked here, whatever the screen sent.
// An invited coach offers their own slots to their own players.

const MAX_RECIPIENTS = 60
const clean = (v: unknown, n = 200) => String(v ?? '').trim().slice(0, n)

async function gate() {
  const who = await coachGate()
  if (!who.ok) return { res: NextResponse.json({ error: who.error }, { status: who.status }) }
  if (!await isAcademyUser(who.userId)) return { res: notAnAcademy() }
  return { who, academyId: who.seat.academyId, mine: who.seat.isHead ? null : who.seat.staffId }
}

export async function GET() {
  const g = await gate(); if ('res' in g) return g.res
  const db = serviceClient()
  let q = db.from('coach_slot_offers').select('*').eq('coach_id', g.academyId).order('created_at', { ascending: false }).limit(20)
  if (g.mine) q = q.eq('staff_id', g.mine)
  const { data: offers } = await q
  const ids = (offers || []).map(o => o.id)
  const { data: recips } = ids.length ? await db.from('coach_slot_offer_recipients').select('offer_id, player_id, response, sent_at, opened_at').in('offer_id', ids) : { data: [] }
  const takers = (offers || []).map(o => o.taken_by).filter(Boolean)
  const { data: names } = takers.length ? await db.from('coach_players').select('id, name').in('id', takers) : { data: [] }
  const now = Date.now()
  return NextResponse.json({
    offers: (offers || []).map(o => {
      const rs = (recips || []).filter(r => r.offer_id === o.id)
      return {
        id: o.id, date: o.booking_date, time: o.start_time, durMin: o.duration_min, type: o.type, note: o.note,
        status: o.status === 'open' && Date.parse(o.expires_at) <= now ? 'expired' : o.status,
        takenBy: (names || []).find(n => n.id === o.taken_by)?.name || null, bookingId: o.booking_id,
        sent: rs.filter(r => r.sent_at).length, opened: rs.filter(r => r.opened_at).length, declined: rs.filter(r => r.response === 'declined').length,
        createdAt: o.created_at,
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  const g = await gate(); if ('res' in g) return g.res
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const date = clean(b.date, 10), time = clean(b.time, 5)
  const durMin = Math.round(Number(b.durMin))
  const type = clean(b.type, 40) || 'Private'
  const note = clean(b.note, 500) || null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: 'Choose the day and time of the free slot.' }, { status: 400 })
  if (!(durMin >= 15 && durMin <= 240)) return NextResponse.json({ error: 'Choose how long the slot is, between 15 minutes and 4 hours.' }, { status: 400 })
  const closes = offerClosesAt(date, time)
  if (!(closes > Date.now())) return NextResponse.json({ error: 'That slot is too soon to offer. Offers close two hours before the start.' }, { status: 400 })
  const playerIds = Array.isArray(b.playerIds) ? Array.from(new Set(b.playerIds.filter(isUuid))).slice(0, MAX_RECIPIENTS) : []
  if (!playerIds.length) return NextResponse.json({ error: 'Choose who to offer it to.' }, { status: 400 })

  const db = serviceClient()
  // Everything referenced must be this academy's.
  const venueId = isUuid(b.venueId) ? b.venueId : null
  const courtId = isUuid(b.courtId) ? b.courtId : null
  let venueName: string | null = null
  if (venueId) {
    const { data: v } = await db.from('coach_venues').select('name').eq('id', venueId).eq('coach_id', g.academyId).maybeSingle()
    if (!v) return NextResponse.json({ error: 'That venue is not on your account.' }, { status: 400 })
    venueName = v.name
  }
  let court = clean(b.court, 80) || null
  if (courtId) {
    const { data: c } = await db.from('coach_courts').select('name').eq('id', courtId).eq('coach_id', g.academyId).maybeSingle()
    if (!c) return NextResponse.json({ error: 'That court is not on your account.' }, { status: 400 })
    court = c.name
  }
  // Is it actually free? A slot that clashes with one of the coach's own bookings is not a free slot.
  // "The coach's own" bookings: an invited coach's carry their record; the head
  // coach's carry none, or the head's own coach record.
  const { data: heads } = g.mine ? { data: [] } : await db.from('coach_staff').select('id').eq('coach_id', g.academyId).eq('is_head', true)
  const headIds = new Set((heads || []).map(h => h.id as string))
  const sameCoach = (staffId: string | null) => (g.mine ? staffId === g.mine : !staffId || headIds.has(staffId))
  const { data: dayRows } = await db.from('coach_bookings').select('start_time, duration_min, staff_id').eq('coach_id', g.academyId).eq('booking_date', date).neq('status', 'cancelled')
  const sameDay = (dayRows || []).filter(x => sameCoach(x.staff_id))
  if (sameDay.some(x => overlaps(time, durMin, String(x.start_time || '').slice(0, 5), Number(x.duration_min) || 60))) {
    return NextResponse.json({ error: 'You already have a booking at that time. Choose a time that is free.' }, { status: 400 })
  }

  let pq = db.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email, free_slot_pings, staff_id').eq('coach_id', g.academyId).in('id', playerIds)
  if (g.mine) pq = pq.eq('staff_id', g.mine)
  const { data: players } = await pq
  const willing = (players || []).filter(p => p.free_slot_pings)
  if (!willing.length) return NextResponse.json({ error: 'None of those clients have asked to hear about free slots. Tick “Happy to hear about free slots” on their profile first.' }, { status: 400 })

  const [{ data: prof }, { data: staff }] = await Promise.all([
    db.from('sports_profiles').select('brand_name, display_name, brand_logo_url, contact_email').eq('id', g.academyId).maybeSingle(),
    g.mine ? db.from('coach_staff').select('name').eq('id', g.mine).maybeSingle() : Promise.resolve({ data: null } as { data: null }),
  ])
  const { data: offer, error } = await db.from('coach_slot_offers').insert({
    coach_id: g.academyId, staff_id: g.mine, assigned_coach: (staff?.name as string) || null,
    booking_date: date, start_time: time, duration_min: durMin, type, venue_id: venueId, court_id: courtId, court, note,
    expires_at: new Date(closes).toISOString(),
  }).select('*').single()
  if (error || !offer) return NextResponse.json({ error: 'The offer could not be made. Please try again.' }, { status: 500 })

  const origin = publicSiteOrigin(new URL(req.url).origin)
  const academy = (prof?.brand_name as string) || 'Your coach'
  const coachName = (staff?.name as string) || (prof?.display_name as string) || null
  let sent = 0
  const noEmail: string[] = []
  for (const p of willing) {
    const addr = familyAddress(p)
    if (!addr) { noEmail.push(p.name); continue }
    const token = randomBytes(15).toString('base64url')
    const { error: rErr } = await db.from('coach_slot_offer_recipients').insert({ offer_id: offer.id, coach_id: g.academyId, player_id: p.id, token, sent_to: addr.to })
    if (rErr) continue
    const msg = offerMessage({
      hello: addr.hello, childFirst: addr.toParent ? String(p.name).split(/\s+/)[0] : null, coachName, academy,
      logoUrl: (prof?.brand_logo_url as string) || null, date, time, durMin, type, venue: venueName, note, url: `${origin}/slot/${token}`,
    })
    const ok = await sendFamilyEmail(g.who.userId, { to: addr.to, subject: msg.subject, html: msg.html, replyTo: (prof?.contact_email as string) || null, context: 'coach/free slot offer', push: { url: `${origin}/slot/${token}` } })
    if (ok) { sent++; await db.from('coach_slot_offer_recipients').update({ sent_at: new Date().toISOString() }).eq('token', token) }
  }
  if (!sent) await db.from('coach_slot_offers').update({ status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', offer.id)
  return NextResponse.json({ ok: sent > 0, offerId: offer.id, sent, noEmail, notWilling: playerIds.length - willing.length, ...(sent ? {} : { error: 'No emails could be sent, so the offer was not made.' }) }, { status: sent ? 200 : 400 })
}

export async function DELETE(req: NextRequest) {
  const g = await gate(); if ('res' in g) return g.res
  const id = req.nextUrl.searchParams.get('id')
  if (!isUuid(id)) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const db = serviceClient()
  let q = db.from('coach_slot_offers').update({ status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', id).eq('coach_id', g.academyId).eq('status', 'open')
  if (g.mine) q = q.eq('staff_id', g.mine)
  const { data } = await q.select('id')
  return NextResponse.json({ ok: !!data?.length, ...(data?.length ? {} : { error: 'That offer has already been taken or closed.' }) })
}
