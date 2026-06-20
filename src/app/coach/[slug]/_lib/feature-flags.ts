'use client'

// Coach product feature flags + plan tiers (demo — localStorage only).
// Four toggleable features gate whole modules and their linked data across the
// portal (coach views + the student/parent app):
//   effort → Effort & Rewards (smartwatch XP/levels) + student effort rewards
//   video  → Video half of Video & Audio + student highlight clips
//   audio  → Audio half of Video & Audio + student coach voice notes
//   racket → Racket Progression module + dashboard reward block + student racket
//
// Tiers are presets over those flags. The admin/dev panel (Settings) can apply a
// tier or flip individual features. Default = Elite so the demo shows everything.

export type FeatureKey = 'effort' | 'video' | 'audio' | 'racket'
export type FeatureFlags = Record<FeatureKey, boolean>
export type TierKey = 'essential' | 'prolite' | 'pro' | 'elite'

export const TIERS: { key: TierKey; name: string; price: number; tagline: string; kit: boolean; features: FeatureFlags }[] = [
  { key: 'essential', name: 'Essential', price: 19, tagline: 'Run your academy — sessions, players, bookings & payments. No kit to buy.', kit: false, features: { effort: false, video: false, audio: false, racket: false } },
  { key: 'prolite',   name: 'Pro Lite',  price: 29, tagline: 'Everything in Essential plus the Racket Progression reward system.',          kit: true,  features: { effort: false, video: false, audio: false, racket: true } },
  { key: 'pro',       name: 'Pro',       price: 39, tagline: 'Adds video, audio, AI session reviews and smartwatch Effort & Rewards.',      kit: true,  features: { effort: true,  video: true,  audio: true,  racket: true } },
  { key: 'elite',     name: 'Elite',     price: 59, tagline: 'The full system — plus the squad effort leaderboard, XP analytics & priority support.', kit: true, features: { effort: true, video: true, audio: true, racket: true } },
]

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  effort: 'Effort & Rewards',
  video: 'Video',
  audio: 'Audio',
  racket: 'Racket Progression reward system',
}

const KEY = 'lumio_coach_features'
const EVT = 'lumio-coach-features-changed'
const DEFAULT: FeatureFlags = { ...TIERS[3].features } // Elite

function read(): FeatureFlags {
  if (typeof window === 'undefined') return { ...DEFAULT }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const v = JSON.parse(raw) as Partial<FeatureFlags>
    // `gps` was renamed to `effort`. Effort & Rewards is a NEW feature, so anyone
    // without an explicit effort flag defaults to ON — we don't inherit the old
    // GPS on/off state (a coach who had GPS off shouldn't lose Effort & Rewards).
    return { effort: v.effort ?? true, video: !!v.video, audio: !!v.audio, racket: !!v.racket }
  } catch { return { ...DEFAULT } }
}
function write(flags: FeatureFlags) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(flags)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getFlags(): FeatureFlags { return read() }
export function setFlag(key: FeatureKey, on: boolean) { write({ ...read(), [key]: on }) }
export function applyTier(key: TierKey) {
  const tier = TIERS.find(t => t.key === key)
  if (tier) write({ ...tier.features })
}
// The tier whose feature set exactly matches the current flags (else null = custom).
// Searched highest-first so an all-on set resolves to Elite (Pro & Elite share the
// same module flags; Elite's extras are non-module).
export function tierForFlags(flags: FeatureFlags): TierKey | null {
  const match = [...TIERS].reverse().find(t => (Object.keys(t.features) as FeatureKey[]).every(k => t.features[k] === flags[k]))
  return match?.key ?? null
}
export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
