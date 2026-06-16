// Client-side store for training camps created via "New camp" on the Training
// Camps view. Persists to localStorage and notifies subscribers, mirroring
// sessions-store.ts: the static CAMPS seed merged with locally-added camps.

import { CAMPS, type Camp } from './coach-data'

const KEY = 'lumio_coach_camps'
const EVT = 'lumio-coach-camps-changed'

function read(): Camp[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v as Camp[] : [] } catch { return [] }
}
function write(list: Camp[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedCamps(): Camp[] {
  return read()
}

// Seed camps first, then anything the coach has added (newest last).
export function getCamps(): Camp[] {
  return [...CAMPS, ...read()]
}

export function addCamp(c: Camp) {
  write([...read(), c])
}

export function removeCamp(id: string) {
  write(read().filter(c => c.id !== id))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
