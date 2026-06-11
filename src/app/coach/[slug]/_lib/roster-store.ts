// Client-side store for players added via "Add player". Persists to
// localStorage and notifies subscribers so the roster updates immediately.

import type { Player } from './coach-data'

const KEY = 'lumio_coach_added_players'
const EVT = 'lumio-coach-roster-changed'

function read(): Player[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Player[] : [] } catch { return [] }
}
function write(list: Player[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedPlayers(): Player[] {
  return read()
}

export function addPlayer(p: Player) {
  write([...read(), p])
}

export function removePlayer(id: string) {
  write(read().filter(p => p.id !== id))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
