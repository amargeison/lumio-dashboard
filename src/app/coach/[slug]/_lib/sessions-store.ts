// Client-side store for sessions created via "New session" on the Session
// Planner. Persists to localStorage and notifies subscribers.

import type { TodaySession } from './coach-data'

const KEY = 'lumio_coach_sessions'
const STATUS_KEY = 'lumio_coach_session_status'   // { [id]: 'done' } overrides
const HIDDEN_KEY = 'lumio_coach_session_hidden'    // deleted session ids
const EVT = 'lumio-coach-sessions-changed'

function read(): TodaySession[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as TodaySession[] : [] } catch { return [] }
}
function write(list: TodaySession[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}
function readMap<T>(key: string): T {
  if (typeof window === 'undefined') return ({} as T)
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : ({} as T) } catch { return ({} as T) }
}
function writeRaw(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedSessions(): TodaySession[] {
  return read()
}

// The built session (if any) created from a given booking. Phase 1 sets no
// bookingId on created sessions, so this returns undefined until Phase 2 wires
// the "build session from booking" flow.
export function getSessionForBooking(bookingId: string): TodaySession | undefined {
  return read().find(s => s.bookingId === bookingId)
}

export function addSession(s: TodaySession) {
  write([s, ...read()])
}

export function removeSession(id: string) {
  write(read().filter(s => s.id !== id))
}

// Status overrides — works for built-in and added sessions alike.
export function getStatusOverrides(): Record<string, TodaySession['status']> {
  return readMap<Record<string, TodaySession['status']>>(STATUS_KEY)
}
export function setStatus(id: string, status: TodaySession['status']) {
  const m = getStatusOverrides(); m[id] = status; writeRaw(STATUS_KEY, m)
}
export function clearStatus(id: string) {
  const m = getStatusOverrides(); delete m[id]; writeRaw(STATUS_KEY, m)
}

// Deletion — added sessions are removed outright; built-in demo sessions are
// hidden via an id list (we can't mutate the static constant).
export function getHiddenSessions(): string[] {
  const v = readMap<string[]>(HIDDEN_KEY)
  return Array.isArray(v) ? v : []
}
export function deleteSession(id: string) {
  // Remove if it's an added session…
  const added = read()
  if (added.some(s => s.id === id)) { write(added.filter(s => s.id !== id)) }
  // …and always record it as hidden so built-ins disappear too.
  const hidden = getHiddenSessions()
  if (!hidden.includes(id)) writeRaw(HIDDEN_KEY, [...hidden, id])
  clearStatus(id)
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
