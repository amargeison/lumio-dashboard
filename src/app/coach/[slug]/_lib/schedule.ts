// Schedule helpers for the Session Planner multi-view (Phase 2). Bookings are the
// canonical schedule (Phase 1); these helpers project them — plus any sessions
// built/added in the stores — into the dated shapes the planner's tabs consume.
// Pure functions over a passed-in `added` list so callers stay reactive to the
// sessions-store without this module importing it (avoids a store ↔ data cycle).

import {
  BOOKINGS, TODAY_SESSIONS, TODAY, dateForDay, PLAYERS,
  type Booking, type TodaySession, type Player,
} from './coach-data'
import { ALL_BOOKINGS } from './coaches-data'

// One calendar block — a booking and/or a built session, positioned by date+time.
export type CalItem = {
  key: string
  date: string                 // 'YYYY-MM-DD'
  start: string                // 'HH:MM'
  end: string
  player: string
  court: string
  type: string                 // Private | Group | Cardio | Match play | Block | …
  status: 'confirmed' | 'pending' | 'cancelled'
  sessionId?: string           // the session this slot resolves to (click → select)
  bookingId?: string           // the booking behind this slot (click → build wizard)
  coachId?: string             // the coach this slot belongs to (Phase B filtering)
}

// Booking source for a view: a specific coach's slice of the whole club, or — by
// default (no coachId) — Pete's own BOOKINGS, so existing callers are unchanged.
// `addedBookings` are the locally-added bookings from bookings-store, passed in
// by the caller (kept out of this pure module to avoid a store↔data cycle AND to
// stay SSR-safe — callers load them via useEffect, never during render).
function bookingsSource(coachId?: string, addedBookings: Booking[] = []): Booking[] {
  const base = coachId ? ALL_BOOKINGS.filter(b => b.coachId === coachId) : BOOKINGS
  const added = coachId ? addedBookings.filter(b => b.coachId === coachId) : addedBookings
  return [...base, ...added]
}

// Index 0=Mon … 6=Sun of a date within the demo week, or -1 if outside it.
export function dayIndexForDate(date: string): number {
  for (let i = 0; i < 7; i++) if (dateForDay(i) === date) return i
  return -1
}

// Booking type → session type. Block is not a coachable session → null.
const BUILDABLE: Partial<Record<Booking['type'], TodaySession['type']>> = {
  Private: 'Private', Group: 'Group', Cardio: 'Cardio', 'Match play': 'Match play',
}
export function mapBookingType(t: Booking['type']): TodaySession['type'] | null {
  return BUILDABLE[t] ?? null
}

// Roster player behind a booking's name, if any (squad/cardio bookings have none).
export function playerForBookingName(name: string): Player | undefined {
  return PLAYERS.find(p => p.name === name)
}

// Every session the planner knows about: built-in (today) + anything added.
export function allKnownSessions(added: TodaySession[]): TodaySession[] {
  return [...added, ...TODAY_SESSIONS]
}

// The session built for a booking, if one exists (built-in or added).
export function sessionForBooking(bookingId: string, added: TodaySession[]): TodaySession | undefined {
  return allKnownSessions(added).find(s => s.bookingId === bookingId)
}

// Confirmed, today-or-future, coachable bookings that have no session yet —
// the "needs a plan" list and the booking→wizard candidates.
export function getNeedsPlan(added: TodaySession[], coachId?: string, addedBookings: Booking[] = []): Booking[] {
  return bookingsSource(coachId, addedBookings)
    .filter(b => b.status === 'confirmed' && b.date >= TODAY && mapBookingType(b.type) !== null && !sessionForBooking(b.id, added))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
}

// Calendar items for the static Booking Calendar page (every booking, as-is).
// Defaults to Pete's bookings; pass a coachId for a coach-scoped calendar (Phase B).
export function bookingCalItems(coachId?: string, addedBookings: Booking[] = []): CalItem[] {
  return bookingsSource(coachId, addedBookings).map(b => ({
    key: b.id, date: b.date, start: b.start, end: b.end,
    player: b.player, court: b.court, type: b.type, status: b.status, bookingId: b.id, coachId: b.coachId,
  }))
}

// Calendar items for the planner: every booking (so it mirrors the Booking
// Calendar exactly), each resolved to its built session where one exists, plus
// any manually-added sessions that aren't tied to a booking. Defaults to Pete;
// pass a coachId for a coach-scoped list (Phase B).
export function getCalendarItems(added: TodaySession[], coachId?: string, addedBookings: Booking[] = []): CalItem[] {
  const fromBookings: CalItem[] = bookingsSource(coachId, addedBookings).map(b => ({
    key: b.id, date: b.date, start: b.start, end: b.end,
    player: b.player, court: b.court, type: b.type, status: b.status,
    bookingId: b.id, sessionId: sessionForBooking(b.id, added)?.id, coachId: b.coachId,
  }))
  const manual: CalItem[] = added.filter(s => !s.bookingId && (!coachId || s.coachId === coachId)).map(s => ({
    key: s.id, date: s.date, start: s.time, end: s.end,
    player: s.player, court: s.court, type: s.type, status: 'confirmed' as const, sessionId: s.id, coachId: s.coachId,
  }))
  return [...fromBookings, ...manual]
}
