// Client-side store for bookings created via "Add booking" on the Booking
// Calendar. Persists to localStorage and notifies subscribers, mirroring
// camps-store.ts: the static BOOKINGS seed merged with locally-added bookings.
// Bookings are the schedule source of truth, so an added booking flows through
// schedule.ts into BOTH the calendar grid and the Session Planner.

import { BOOKINGS, type Booking } from './coach-data'

const KEY = 'lumio_coach_bookings'
const EVT = 'lumio-coach-bookings-changed'

function read(): Booking[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v as Booking[] : [] } catch { return [] }
}
function write(list: Booking[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedBookings(): Booking[] {
  return read()
}

// Seed bookings first, then anything the coach has added (newest last).
export function getBookings(): Booking[] {
  return [...BOOKINGS, ...read()]
}

export function addBooking(b: Booking) {
  write([...read(), b])
}

export function removeBooking(id: string) {
  write(read().filter(b => b.id !== id))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
