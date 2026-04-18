const SPORT_SURVIVOR_SUFFIXES = [
  '_name',
  '_nickname',
  '_profile_photo',
  '_brand_name',
  '_brand_logo',
  '_onboarded',
  '_demo_active',
] as const

export function clearDemoSession(sport: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`lumio_sports_demo_${sport}`)
    for (const suffix of SPORT_SURVIVOR_SUFFIXES) {
      localStorage.removeItem(`lumio_${sport}${suffix}`)
    }
    // Brand colours and hidden-items state are non-PII and fine to keep,
    // but clear if the user requested a clean slate. Keep for now; revisit
    // if parity with founder sign-out is needed.
  } catch { /* ignore */ }
}
