// Client-side store for bookings created/edited via the Booking Calendar.
// Persists to localStorage and notifies subscribers, mirroring camps-store.ts:
// the static BOOKINGS seed merged with locally-added bookings, plus per-booking
// edit overrides (so a seed booking can be edited too) and a hidden list (so any
// booking can be removed). Bookings are the schedule source of truth, so changes
// flow through schedule.ts into BOTH the calendar grid and the Session Planner.

import { BOOKINGS, type Booking } from './coach-data'

const KEY = 'lumio_coach_bookings'           // added bookings
const OKEY = 'lumio_coach_booking_overrides' // { [id]: Partial<Booking> } edits over seed/added
const HKEY = 'lumio_coach_booking_hidden'    // removed booking ids (incl. seed)
const EVT = 'lumio-coach-bookings-changed'

function readList(): Booking[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v as Booking[] : [] } catch { return [] }
}
function readMap(key: string): Record<string, Partial<Booking>> {
  if (typeof window === 'undefined') return {}
  try { const raw = localStorage.getItem(key); const v = raw ? JSON.parse(raw) : {}; return v && typeof v === 'object' ? v : {} } catch { return {} }
}
function readHidden(): string[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(HKEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v as string[] : [] } catch { return [] }
}
function writeRaw(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

const applyOverrides = (list: Booking[], ov: Record<string, Partial<Booking>>) =>
  list.map(b => ov[b.id] ? { ...b, ...ov[b.id] } : b)

export function getAddedBookings(): Booking[] {
  const hidden = readHidden()
  return applyOverrides(readList(), readMap(OKEY)).filter(b => !hidden.includes(b.id))
}

// Seed bookings first, then anything the coach has added (newest last), with edits
// applied and removed bookings filtered out.
export function getBookings(): Booking[] {
  const hidden = readHidden()
  return applyOverrides([...BOOKINGS, ...readList()], readMap(OKEY)).filter(b => !hidden.includes(b.id))
}

export function addBooking(b: Booking) {
  writeRaw(KEY, [...readList(), b])
}

// Edit a booking. An added booking is updated in place; a seed booking gets an
// override stored against its id and merged at read time.
export function updateBooking(id: string, patch: Partial<Booking>) {
  const added = readList()
  const idx = added.findIndex(b => b.id === id)
  if (idx >= 0) {
    added[idx] = { ...added[idx], ...patch }
    writeRaw(KEY, added)
    return
  }
  const ov = readMap(OKEY)
  ov[id] = { ...(ov[id] || {}), ...patch }
  writeRaw(OKEY, ov)
}

// Remove a booking. Added bookings are dropped; seed bookings are hidden.
export function removeBooking(id: string) {
  const added = readList()
  if (added.some(b => b.id === id)) { writeRaw(KEY, added.filter(b => b.id !== id)); return }
  const hidden = readHidden()
  if (!hidden.includes(id)) writeRaw(HKEY, [...hidden, id])
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
