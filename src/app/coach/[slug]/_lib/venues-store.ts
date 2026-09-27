// Client-side store for venues added via "Add venue" in the Court Planner.
// Persists to localStorage and notifies subscribers (mirrors roster-store.ts).

import type { Venue } from './coach-data'
import { ls } from './storage-scope'

const KEY = 'lumio_coach_venues'
const EVT = 'lumio-coach-venues-changed'

function read(): Venue[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = ls.getItem(KEY)
    const list = raw ? JSON.parse(raw) as Venue[] : []
    // Collapse duplicates already saved by earlier versions.
    const seen = new Set<string>()
    return list.filter(x => { const n = (x.name || '').trim().toLowerCase(); if (!n) return true; if (seen.has(n)) return false; seen.add(n); return true })
  } catch { return [] }
}
function write(list: Venue[]) {
  if (typeof window === 'undefined') return
  try { ls.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedVenues(): Venue[] {
  return read()
}
// One venue per name. Onboarding adds the home court every time it runs, and a
// coach who went through it more than once ended up with the same club listed
// again and again.
export function addVenue(v: Venue) {
  const name = (v.name || '').trim().toLowerCase()
  const list = read()
  if (name && list.some(x => (x.name || '').trim().toLowerCase() === name)) return
  write([...list, v])
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
