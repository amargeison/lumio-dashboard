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
  // A tab that is no longer its coach's (see stillOwner below) writes nothing:
  // the cache now belongs to somebody else, and their own tab would save
  // whatever landed in it into their account.
  setItem: (key: string, value: string) => { if (stillOwner()) localStorage.setItem(scopedKey(key), value) },
  removeItem: (key: string) => { if (stillOwner()) localStorage.removeItem(scopedKey(key)) },
}

// ── Whose cache is this? ────────────────────────────────────────────────────
// The lumio_coach_* keys are one bucket per BROWSER, not per account. On a
// shared club laptop that meant the next coach to sign in opened their portal
// on the last coach's academy name, logo, DBS number and hidden menu — and the
// settings sync then saved that blob into the new coach's account.
//
// So the cache carries the id of the person it was written for. The portal
// claims it for whoever is signed in BEFORE anything reads it, and a cache
// that belongs to somebody else — or to nobody we can name — is thrown away.
// What is left afterwards provably belongs to this account, which is what
// makes it safe for the settings sync to send it to the server.
const OWNER_KEY = 'lumio_coach_owner'

// Not account data: how this browser likes the sidebar, and whether the
// install prompt was dismissed here.
const DEVICE_KEYS = new Set(['lumio_coach_sidebar_pinned', 'lumio_coach_pwa_dismissed'])

// The demo gate's own keys for its 'coach' visitor (see lib/demo-session/clear).
// They share the prefix but belong to the demo, so a real sign-in leaves them
// alone; signing out of a real portal removes them through wipeDemoSurvivors.
const GATE_KEYS = new Set(['name', 'nickname', 'profile_photo', 'brand_name', 'brand_logo', 'onboarded', 'demo_active', 'session_ts', 'signed_out']
  .map(suffix => `lumio_coach_${suffix}`))

/** Remove everything a real coach account cached in this browser. */
export function clearCoachStorage() {
  if (typeof window === 'undefined') return
  // This tab is giving the cache up on purpose (signing out, or about to claim
  // it afresh), so it is not "lost" — see stillOwner.
  tabOwner = null
  try {
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      // lumio.brief.* is the dashboard briefing — written from one academy's data.
      if (k.startsWith('lumio.brief.')) { doomed.push(k); continue }
      if (k.startsWith('lumio_coach_') && !DEVICE_KEYS.has(k) && !GATE_KEYS.has(k)) doomed.push(k)
    }
    for (const k of doomed) localStorage.removeItem(k)
  } catch { /* storage unavailable — then there is nothing cached to leak */ }
}

/**
 * Make the cache belong to `ownerId` (the signed-in user). Anything cached for
 * a different person, or with no owner recorded, is discarded first.
 * Returns true when the existing cache was already theirs.
 */
export function claimCoachStorage(ownerId: string): boolean {
  if (typeof window === 'undefined' || !ownerId || isDemoPath()) return false
  // A tab opened for one person never re-claims the cache for another. Without
  // this, a save from coach A's still-open tab — after coach B had signed in
  // in a second tab — claimed the cache as B and wrote to B's account.
  if (tabLost) return false
  if (tabOwner && (tabOwner !== ownerId || !stillOwner())) { loseTab(); return false }
  watchOwner()
  try {
    if (localStorage.getItem(OWNER_KEY) === ownerId) { tabOwner = ownerId; return true }
    clearCoachStorage()
    localStorage.setItem(OWNER_KEY, ownerId)
    tabOwner = ownerId
  } catch { /* storage unavailable */ }
  return false
}

// ── Is this tab still the person it was opened for? ─────────────────────────
// The sign-in and this cache belong to the BROWSER, not to a tab. So with coach
// A's portal open in one tab and coach B signing in in another, A's tab went on
// showing A's address while everything typed in it was saved to B's account.
//
// A tab remembers who it claimed the cache for. Once the cache has been claimed
// by somebody else, or emptied by a sign-out in another tab, this tab is "lost":
// it writes nothing more, and the portal asks for a reload (TAB_LOST).
export const TAB_LOST = 'lumio-coach-tab-lost'
let tabOwner: string | null = null
let tabLost = false

export function tabIsLost(): boolean { return tabLost }

export function loseTab() {
  if (tabLost || typeof window === 'undefined') return
  tabLost = true
  window.dispatchEvent(new Event(TAB_LOST))
}

/** False once the browser's coach cache no longer belongs to this tab's coach. */
export function stillOwner(): boolean {
  if (tabLost) return false
  if (typeof window === 'undefined' || !tabOwner || isDemoPath()) return true
  try {
    if (localStorage.getItem(OWNER_KEY) !== tabOwner) { loseTab(); return false }
  } catch { /* storage unavailable — nothing shared to lose */ }
  return true
}

// Notice straight away, not at the next save: the other tab's claim arrives
// here as a storage event.
let watching = false
function watchOwner() {
  if (watching || typeof window === 'undefined') return
  watching = true
  window.addEventListener('storage', e => { if (e.key === OWNER_KEY || e.key === null) stillOwner() })
}
