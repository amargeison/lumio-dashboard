// One browser, two portals: the public demo (/tennis/coach/demo) and a coach's
// real academy. Every coach store used the same localStorage keys for both, so
// whatever a real academy saved on this browser leaked into the demo — its
// White theme and orange accent, "PG Tennis" and its head coach, its logo, and
// a "Penrith Tennis Club" venue added once per onboarding run (nine times, in
// the end) sitting in the demo's Court Planner.
//
// The demo now keeps its own copy of every lumio_coach_* key, so it always
// opens as the canned showcase and nothing a real academy does can reach it.
// Live portals keep the original keys, so no real coach loses anything.

export function isDemoPath(): boolean {
  if (typeof window === 'undefined') return false
  const parts = window.location.pathname.split('/').filter(Boolean)
  const i = parts.lastIndexOf('coach')
  return i >= 0 && parts[i + 1] === 'demo'
}

export function scopedKey(key: string): string {
  return key.startsWith('lumio_coach_') && isDemoPath() ? `lumio_coachdemo_${key.slice('lumio_coach_'.length)}` : key
}

// Drop-in for localStorage in the coach stores. Throws exactly as localStorage
// would (callers already wrap it in try/catch for private browsing and quota).
export const ls = {
  getItem: (key: string) => localStorage.getItem(scopedKey(key)),
  setItem: (key: string, value: string) => localStorage.setItem(scopedKey(key), value),
  removeItem: (key: string) => localStorage.removeItem(scopedKey(key)),
}
