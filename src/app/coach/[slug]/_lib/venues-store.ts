// Client-side store for venues added via "Add venue" in the Court Planner.
// Persists to localStorage and notifies subscribers (mirrors roster-store.ts).

import type { Venue } from './coach-data'

const KEY = 'lumio_coach_venues'
const EVT = 'lumio-coach-venues-changed'

function read(): Venue[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Venue[] : [] } catch { return [] }
}
function write(list: Venue[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedVenues(): Venue[] {
  return read()
}
export function addVenue(v: Venue) {
  write([...read(), v])
}
export function removeVenue(id: string) {
  write(read().filter(v => v.id !== id))
}
export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
