import { ls } from './storage-scope'
// Coach portal — which sidebar nav items the coach has hidden from the menu.
// Persists to localStorage and notifies subscribers via a window event so the
// sidebar (both shells) and the Settings toggles update the moment one changes.
// Mirrors session-plan.ts's pub/sub pattern.

const KEY = 'lumio_coach_menu_hidden'
const EVT = 'lumio-coach-menu-changed'

// Never hideable — Dashboard and Settings (so a coach can never lock themselves
// out) plus Coaches (always shown; a solo coach just sees themselves).
export const ALWAYS_VISIBLE = ['dashboard', 'settings', 'staff']

function read(): string[] {
  if (typeof window === 'undefined') return []
  try { const raw = ls.getItem(KEY); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v as string[] : [] } catch { return [] }
}
function write(list: string[]) {
  if (typeof window === 'undefined') return
  try { ls.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
  try { persist?.(list) } catch { /* a failed mirror must not block the toggle */ }
}

// ── Following the account ───────────────────────────────────────────────────
// The hidden list lived only in this browser, so a coach who tidied their menu
// on the desktop found every item back on their phone — and the coaches they
// invited never saw the tidy version at all. settings-sync registers a hook
// here that saves the list with the rest of the academy's settings, and primes
// it back on load. Same arrangement as the feature flags.
type Persist = (hidden: string[]) => void
let persist: Persist | null = null
export function setMenuPersist(fn: Persist | null) { persist = fn }

/** Load the account's copy into the cache WITHOUT saving it straight back. */
export function primeHidden(list: unknown) {
  if (typeof window === 'undefined') return
  const clean = Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []
  try { ls.setItem(KEY, JSON.stringify(clean)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

// Hidden ids, with the always-visible ones defensively stripped out.
export function getHidden(): string[] {
  return read().filter(id => !ALWAYS_VISIBLE.includes(id))
}

export function isHidden(id: string): boolean {
  return getHidden().includes(id)
}

// Hide/show a single nav item. Always-visible ids are ignored.
export function setHidden(id: string, hidden: boolean) {
  if (ALWAYS_VISIBLE.includes(id)) return
  const cur = read().filter(x => !ALWAYS_VISIBLE.includes(x))
  const next = hidden
    ? (cur.includes(id) ? cur : [...cur, id])
    : cur.filter(x => x !== id)
  write(next)
}

export function toggleHidden(id: string) {
  setHidden(id, !isHidden(id))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
