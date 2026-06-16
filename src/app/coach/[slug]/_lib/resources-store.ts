// Client-side store for resources added via "Add resource" in Resource Centre.
// Persists to localStorage and notifies subscribers (mirrors roster-store.ts).

import type { Resource } from './coach-data'

const KEY = 'lumio_coach_resources'
const EVT = 'lumio-coach-resources-changed'

function read(): Resource[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Resource[] : [] } catch { return [] }
}
function write(list: Resource[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedResources(): Resource[] {
  return read()
}
export function addResource(r: Resource) {
  write([...read(), r])
}
export function removeResource(id: string) {
  write(read().filter(r => r.id !== id))
}
export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
