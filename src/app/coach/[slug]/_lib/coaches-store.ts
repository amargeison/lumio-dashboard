// Client-side store for coaches added via "Add coach" in the Staff view.
// Persists to localStorage and notifies subscribers (mirrors roster-store.ts).

import type { Coach } from './coaches-data'

const KEY = 'lumio_coach_coaches'
const EVT = 'lumio-coach-coaches-changed'

function read(): Coach[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Coach[] : [] } catch { return [] }
}
function write(list: Coach[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedCoaches(): Coach[] {
  return read()
}
export function addCoach(c: Coach) {
  write([...read(), c])
}
export function removeCoach(id: string) {
  write(read().filter(c => c.id !== id))
}
export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
