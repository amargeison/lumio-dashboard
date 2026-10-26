// What a client can do from their own page (or the link in their day-before
// reminder): say they will be there, cancel a lesson, and book a free slot.
//
// The caller has already decided who this is (familyAccess for the player app,
// the booking's own token for the reminder link). Every write here is scoped to
// that ONE academy and ONE player again, so a booking id from anywhere else is
// simply "not found".

import type { SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { academyMoney, type AcademyMoney } from '@/app/api/coach/pay/_saved'
import { planCover } from '@/lib/coach/monthly-server'
import { packCover } from '@/lib/coach/packs-server'
import { planCovering } from '@/lib/coach/memberships'
import { unsyncBooking, syncBooking } from '@/lib/coach/calendar'
import { bookingState, bookingPlace, type BookingRow } from '@/lib/coach/booking-email'
import { matchVenue, type VenueRow } from '@/lib/coach/booking-venue'
import { notifyBooked } from '@/lib/coach/booking-notify'
import { sendBookingConfirmation } from '@/lib/coach/booking-confirm'
import { familyAddress, sendFamilyEmail, type FamilyPlayer } from '@/lib/coach/family-mail'
import { freeSlots } from '@/lib/coach/booking-slots'
import { cancelTerms, started, whenWords, type Cover } from './my-account'

type Db = SupabaseClient
type Row = Record<string, any>   // eslint-disable-line @typescript-eslint/no-explicit-any
const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''
const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function myBooking(db: Db, academyId: string, playerId: string, bookingId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return null
  const { data } = await db.from('coach_bookings').select('*').eq('id', bookingId).eq('coach_id', academyId).eq('player_id', playerId).maybeSingle()
  return (data || null) as Row | null
}

async function coverOf(db: Db, academyId: string, playerId: string, b: Row, m: AcademyMoney): Promise<Cover> {
  try {
    if (planCovering(await planCover(db, academyId, [playerId]), { playerId, type: b.type })) return 'plan'
    if ((await packCover(db, academyId, [playerId], m.policy)).cover.has(b.id)) return 'pack'
  } catch { /* words without the cover are still true */ }
  return null
}

/** A line in the coach's inbox, in the player's conversation, so the coach sees it where they read everything else. */
async function tellCoach(db: Db, academyId: string, player: Row, body: string) {
  await db.from('coach_messages').insert({
    coach_id: academyId, player_id: player.id, direction: 'in', from_name: player.name, recipients: player.name, thread_key: player.name,
    body, channels: 'portal', status: 'received', read: false, created_at: new Date().toISOString(),
  }).then(({ error }) => { if (error) console.error('[lesson-actions] coach message', error.message) })
}

/** Who pressed it, in words the coach recognises: the parent for a junior, the player for themselves. */
export async function actorName(db: Db, academyId: string, playerId: string, role: 'parent' | 'student', email: string) {
  const { data: p } = await db.from('coach_players').select('name, parent_name').eq('id', playerId).eq('coach_id', academyId).maybeSingle()
  if (role === 'parent') return String(p?.parent_name || '').trim() || `${String(p?.name || '').trim().split(/\s+/)[0] || 'Their'}’s parent` || email
  return String(p?.name || '').trim() || email
}

export type LessonView = {
  academy: string; logoUrl: string | null; player: string
  lesson: { date: string; time: string | null; mins: number; type: string | null; court: string | null; when: string }
  status: 'upcoming' | 'cancelled' | 'started'
  confirmed: { at: string; by: string | null } | null
  cancel: { free: boolean; words: string; confirm: string }
}

export async function lessonView(db: Db, academyId: string, playerId: string, bookingId: string): Promise<LessonView | null> {
  const b = await myBooking(db, academyId, playerId, bookingId)
  if (!b) return null
  const m = await academyMoney(db, academyId)
  const { data: p } = await db.from('coach_players').select('id, name').eq('id', playerId).eq('coach_id', academyId).maybeSingle()
  const time = b.start_time ? String(b.start_time).slice(0, 5) : null
  const cover = await coverOf(db, academyId, playerId, b, m)
  return {
    academy: m.academy, logoUrl: m.logoUrl, player: first(p?.name),
    lesson: { date: b.booking_date, time, mins: Number(b.duration_min) || 60, type: b.type || null, court: b.court || null, when: whenWords(b.booking_date, time) },
    status: String(b.status || '').toLowerCase() === 'cancelled' ? 'cancelled' : started(b.booking_date, time) ? 'started' : 'upcoming',
    confirmed: b.client_confirmed_at ? { at: b.client_confirmed_at, by: b.client_confirmed_by || null } : null,
    cancel: cancelTerms({ date: b.booking_date, time }, m.policy, cover, m.academy),
  }
}

export async function confirmLesson(db: Db, academyId: string, playerId: string, bookingId: string, by: string): Promise<{ ok: boolean; error?: string }> {
  const b = await myBooking(db, academyId, playerId, bookingId)
  if (!b) return { ok: false, error: 'That lesson could not be found.' }
  if (String(b.status || '').toLowerCase() === 'cancelled') return { ok: false, error: 'That lesson has been cancelled.' }
  if (started(b.booking_date, b.start_time)) return { ok: false, error: 'That lesson has already started.' }
  const { error } = await db.from('coach_bookings').update({ client_confirmed_at: new Date().toISOString(), client_confirmed_by: by.slice(0, 80) || null })
    .eq('id', b.id).eq('coach_id', academyId).eq('player_id', playerId)
  return error ? { ok: false, error: 'That could not be saved. Please try again.' } : { ok: true }
}

export async function cancelLesson(db: Db, academyId: string, playerId: string, bookingId: string, by: string): Promise<{ ok: boolean; words?: string; error?: string }> {
  const b = await myBooking(db, academyId, playerId, bookingId)
  if (!b) return { ok: false, error: 'That lesson could not be found.' }
  if (String(b.status || '').toLowerCase() === 'cancelled') return { ok: true, words: 'It was already cancelled.' }
  const time = b.start_time ? String(b.start_time).slice(0, 5) : null
  if (started(b.booking_date, time)) return { ok: false, error: 'That lesson has already started. Message your coach instead.' }
  const m = await academyMoney(db, academyId)
  const cover = await coverOf(db, academyId, playerId, b, m)
  const terms = cancelTerms({ date: b.booking_date, time }, m.policy, cover, m.academy)

  // Only a lesson still booked moves to cancelled: two taps cancel it once.
  const { data: done, error } = await db.from('coach_bookings').update({ status: 'cancelled', cancelled_by: 'client' })
    .eq('id', b.id).eq('coach_id', academyId).eq('player_id', playerId).neq('status', 'cancelled').select('*')
  if (error) return { ok: false, error: 'That could not be cancelled. Please try again, or message your coach.' }
  if (!done?.length) return { ok: true, words: 'It was already cancelled.' }
  const nb = done[0] as Row

  try { await unsyncBooking(academyId, b.id) } catch (e) { console.error('[lesson-actions] calendar', e) }

  const { data: player } = await db.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email').eq('id', playerId).eq('coach_id', academyId).maybeSingle()
  const when = whenWords(b.booking_date, time)
  const lesson = b.type && !/^private$/i.test(b.type) ? `${String(b.type).toLowerCase()} session` : 'lesson'

  // The family has been told, here and now: record that, so the coach's own
  // confirmation step does not send them a second "cancelled" email.
  try {
    const [{ data: venueRows }, { data: courtRows }] = await Promise.all([
      db.from('coach_venues').select('id,name,is_home').eq('coach_id', academyId),
      db.from('coach_courts').select('name,venue_id').eq('coach_id', academyId),
    ])
    const place = bookingPlace(nb as BookingRow, matchVenue((venueRows ?? []) as VenueRow[], nb.court, { venueId: nb.venue_id, courts: courtRows ?? [] }))
    await db.from('coach_bookings').update({ told_state: bookingState(nb as BookingRow, place) }).eq('id', b.id).eq('coach_id', academyId)
  } catch (e) { console.error('[lesson-actions] told_state', e) }

  if (player) {
    await notifyBooked(db, { academyId, playerId, playerName: player.name, kind: 'lesson', title: `${b.type || 'Lesson'} with ${m.coachName || m.academy}`, date: b.booking_date, time, durationMin: b.duration_min, dedupeKey: b.id, change: 'cancelled' })
    await tellCoach(db, academyId, player, `Cancelled from their page by ${by || player.name}: ${lesson} on ${when}. ${terms.words}`)
    const addr = familyAddress(player as FamilyPlayer)
    if (addr) {
      const childFirst = addr.toParent ? first(player.name) : null
      const subject = `${childFirst ? `${childFirst}’s ${lesson}` : `Your ${lesson}`} on ${when} is cancelled`
      const html = `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"><div style="max-width:520px;margin:0 auto;padding:26px 18px"><div style="background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 2px 12px rgba(20,25,40,.07)"><p style="font-size:16px;color:#1a1d29;margin:0 0 10px">${esc(addr.hello)}</p><p style="font-size:15.5px;color:#374151;margin:0 0 10px;line-height:1.6">${esc(`${childFirst ? `${childFirst}’s` : 'Your'} ${lesson} on ${when} is cancelled, as you asked.`)}</p><p style="font-size:15.5px;color:#374151;margin:0;line-height:1.6">${esc(terms.free ? 'There is nothing to pay.' : terms.words)}</p><p style="font-size:14px;color:#6b7280;margin:16px 0 0">${esc(m.coachName || m.academy)}</p></div><p style="font-size:12px;color:#9aa1ad;text-align:center;margin:14px 0 0">${esc(m.academy)} · sent through Lumio · reply to this email to reach your coach</p></div></body></html>`
      await sendFamilyEmail(academyId, { to: addr.to, subject, html, replyTo: m.contactEmail, context: 'player app cancel' }).catch(() => false)
    }
  }
  return { ok: true, words: terms.free ? 'Cancelled. There is nothing to pay.' : `Cancelled. ${terms.words}` }
}

/** The coach's free slots for a lesson of this length, by day. */
export async function bookingSlots(db: Db, academyId: string, mins: number) {
  return freeSlots(db, academyId, { durationMin: mins, days: 21 })
}

export async function bookLesson(db: Db, academyId: string, playerId: string, o: { date: string; time: string; mins: number; by: string; origin: string }): Promise<{ ok: boolean; error?: string; taken?: boolean; when?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date) || !/^\d{2}:\d{2}$/.test(o.time)) return { ok: false, error: 'Choose a day and a time.' }
  const mins = Math.max(15, Math.min(240, Math.round(o.mins) || 60))
  // Only a time the coach actually has free: the same list the page showed.
  const days = await bookingSlots(db, academyId, mins)
  const offered = days.some(d => d.date === o.date && d.slots.includes(o.time))
  if (!offered) return { ok: false, taken: true, error: 'That time is no longer free. Please pick another.' }
  const { data: set } = await db.from('coach_settings').select('data').eq('coach_id', academyId).maybeSingle()
  const cfg = (set?.data || {}) as Row
  const buffer = Math.max(0, Math.min(60, Number(cfg?.booking?.buffer) || 0))
  const { data: made, error } = await db.rpc('lumio_portal_book', {
    p_coach: academyId, p_player: playerId, p_date: o.date, p_time: o.time, p_mins: mins, p_buffer: buffer, p_type: 'Private',
    p_notes: `Booked from their own page by ${o.by}.`,
  })
  if (error) { console.error('[lesson-actions] book', error.message); return { ok: false, error: 'That could not be booked. Please try again.' } }
  const res = (made || {}) as { result?: string; booking_id?: string }
  if (res.result === 'taken') return { ok: false, taken: true, error: 'That time has just gone. Please pick another.' }
  if (res.result !== 'ok' || !res.booking_id) return { ok: false, error: 'That could not be booked. Please try again.' }
  const { data: booking } = await db.from('coach_bookings').select('*').eq('id', res.booking_id).maybeSingle()
  if (!booking) return { ok: false, error: 'That could not be booked. Please try again.' }

  try {
    const [h, mm] = o.time.split(':').map(Number)
    const end = h * 60 + mm + mins
    const pad = (n: number) => String(n).padStart(2, '0')
    await syncBooking(academyId, { bookingId: booking.id, title: String(booking.title || 'Lesson'), start: `${o.date}T${pad(h)}:${pad(mm)}:00`, end: `${o.date}T${pad(Math.floor(end / 60) % 24)}:${pad(end % 60)}:00` })
  } catch (e) { console.error('[lesson-actions] calendar', e) }

  // The usual confirmation, exactly as if the coach had booked it.
  try {
    const [{ data: venueRows }, { data: courtRows }] = await Promise.all([
      db.from('coach_venues').select('id,name,is_home').eq('coach_id', academyId),
      db.from('coach_courts').select('name,venue_id').eq('coach_id', academyId),
    ])
    const place = bookingPlace(booking as BookingRow, matchVenue((venueRows ?? []) as VenueRow[], booking.court, { venueId: booking.venue_id, courts: courtRows ?? [] }))
    await db.from('coach_bookings').update({ told_state: bookingState(booking as BookingRow, place) }).eq('id', booking.id)
    if (cfg.bookingEmails !== false) await sendBookingConfirmation({ coachId: academyId, booking: booking as BookingRow, origin: o.origin, db })
  } catch (e) { console.error('[lesson-actions] confirmation', e) }

  const { data: player } = await db.from('coach_players').select('id, name').eq('id', playerId).eq('coach_id', academyId).maybeSingle()
  if (player) await tellCoach(db, academyId, player, `Booked from their page by ${o.by}: lesson on ${whenWords(o.date, o.time)} (${mins} min). It is in your calendar.`)
  return { ok: true, when: whenWords(o.date, o.time) }
}

/** The reminder email's link: one per lesson, made when the reminder goes. */
export async function lessonToken(db: Db, b: Row): Promise<string> {
  if (b.client_token) return b.client_token
  const token = randomBytes(18).toString('base64url')
  const { data } = await db.from('coach_bookings').update({ client_token: token }).eq('id', b.id).is('client_token', null).select('client_token')
  if (data?.length) return token
  const { data: again } = await db.from('coach_bookings').select('client_token').eq('id', b.id).maybeSingle()
  return (again?.client_token as string) || token
}
