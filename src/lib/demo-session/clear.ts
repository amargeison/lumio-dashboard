// Keys that are cleared on an ordinary demo Sign out. Survivors (name,
// nickname, photo, brand, logo, onboarded, session_ts) are intentionally
// preserved so the user can sign back in via OTP and resume with their
// data intact. After FOURTEEN_DAYS_MS of inactivity on mount, the gate
// calls wipeDemoSurvivors() to fully forget the persona.
const SPORT_SURVIVOR_SUFFIXES = [
  '_demo_active',
] as const

export function clearDemoSession(sport: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`lumio_sports_demo_${sport}`)
    for (const suffix of SPORT_SURVIVOR_SUFFIXES) {
      localStorage.removeItem(`lumio_${sport}${suffix}`)
    }
  } catch { /* ignore */ }
}

const WIPE_SUFFIXES = [
  '_name',
  '_nickname',
  '_profile_photo',
  '_brand_name',
  '_brand_logo',
  '_onboarded',
  '_demo_active',
  '_session_ts',
  '_signed_out',
] as const

export function wipeDemoSurvivors(sport: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`lumio_sports_demo_${sport}`)
    for (const suffix of WIPE_SUFFIXES) {
      localStorage.removeItem(`lumio_${sport}${suffix}`)
    }
  } catch { /* ignore */ }
}

// ─── Deliberate sign-out marker ─────────────────────────────────────────────
// clearDemoSession() drops the session blob but deliberately KEEPS the
// survivors, and the gate rebuilds a session straight back out of them on the
// very next mount — both via its dev-host survivor rebuild and via the
// Supabase demo-session check, which clearDemoSession can't touch. That is the
// right behaviour for someone returning after a while, and exactly wrong the
// instant they press "Exit demo": they get looped back into the portal they
// just left.
//
// This marker records "the user deliberately ended THIS sport's demo". The
// gate honours it by skipping both rebuild paths, and clears it the moment
// they verify an OTP to come back in — so demo ENTRY is untouched, only the
// automatic re-entry is blocked. Sport-scoped, so only a portal that calls
// markDemoSignedOut is affected.
const signedOutKey = (sport: string) => `lumio_${sport}_signed_out`

export function markDemoSignedOut(sport: string) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(signedOutKey(sport), 'true') } catch { /* ignore */ }
}

export function isDemoSignedOut(sport: string): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(signedOutKey(sport)) === 'true' } catch { return false }
}

export function clearDemoSignedOut(sport: string) {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(signedOutKey(sport)) } catch { /* ignore */ }
}

export function touchDemoSessionTs(sport: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`lumio_${sport}_session_ts`, String(Date.now()))
  } catch { /* ignore */ }
}

export const DEMO_SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000
