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

export function touchDemoSessionTs(sport: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`lumio_${sport}_session_ts`, String(Date.now()))
  } catch { /* ignore */ }
}

export const DEMO_SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000
