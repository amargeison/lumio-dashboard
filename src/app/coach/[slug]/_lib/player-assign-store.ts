// Client-side player → coach assignment overrides (demo). Lets the head coach
// reassign a player to a different coach, or assign players to a newly added
// coach. localStorage + a window event, mirroring the other coach demo stores.

const KEY = 'lumio_coach_player_assign'
const EVT = 'lumio-coach-player-assign-changed'

function read(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Record<string, string> : {} } catch { return {} }
}
function write(map: Record<string, string>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(map)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAssignments(): Record<string, string> { return read() }

// Resolve a player's effective coach: an override wins over the static coachId.
export function effectiveCoachId(playerId: string, staticCoachId: string): string {
  return read()[playerId] ?? staticCoachId
}

export function assignPlayer(playerId: string, coachId: string) {
  write({ ...read(), [playerId]: coachId })
}
export function assignPlayers(playerIds: string[], coachId: string) {
  const map = read()
  for (const id of playerIds) map[id] = coachId
  write(map)
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
