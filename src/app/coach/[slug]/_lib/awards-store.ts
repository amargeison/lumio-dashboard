'use client'

// Racket Reward System — which (player, racket-level) trophy+certificate awards
// the coach has made. DEMO ONLY: this records the award workflow so the matrix
// shows an "Awarded ✓" state that survives reload — there is NO real fulfilment,
// ordering or billing behind it (the physical trophy rackets are reordered from
// Settings → Lumio Coach Kit & rackets). Mirrors menu-visibility.ts's pub/sub.

const KEY = 'lumio_coach_racket_awards'
const EVT = 'lumio-coach-awards-changed'

// An award is keyed by player + the racket LEVEL it was awarded at, so a player
// can hold awards for each level they've completed.
export function awardKey(playerId: string, beltIndex: number): string {
  return `${playerId}:${beltIndex}`
}

function read(): string[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v as string[] : [] } catch { return [] }
}
function write(list: string[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAwards(): string[] {
  return read()
}

export function isAwarded(playerId: string, beltIndex: number): boolean {
  return read().includes(awardKey(playerId, beltIndex))
}

// Record the trophy-racket + certificate award (demo). Idempotent.
export function award(playerId: string, beltIndex: number) {
  const k = awardKey(playerId, beltIndex)
  const cur = read()
  if (!cur.includes(k)) write([...cur, k])
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
