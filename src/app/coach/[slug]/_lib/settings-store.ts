// Client-side, persisted coach settings. Drives appearance (theme/accent/
// density), academy profile, belt award threshold, parent-sharing rules,
// pricing and availability — so the Settings page can actually change the
// portal. localStorage + a window event so changes propagate live.

import { COACH_ORG } from './coach-data'

export type AccentKey = 'purple' | 'blue' | 'green' | 'bronze' | 'claret'
export const ACCENT_PRESETS: Record<AccentKey, { hex: string; dim: string; border: string; label: string }> = {
  purple: { hex: '#a855f7', dim: 'rgba(168,85,247,0.16)', border: 'rgba(168,85,247,0.45)', label: 'Purple' },
  blue:   { hex: '#3A8EE0', dim: 'rgba(58,142,224,0.16)', border: 'rgba(58,142,224,0.45)', label: 'Ocean' },
  green:  { hex: '#3D9A6E', dim: 'rgba(61,154,110,0.16)', border: 'rgba(61,154,110,0.45)', label: 'Court green' },
  bronze: { hex: '#B07A36', dim: 'rgba(176,122,54,0.16)', border: 'rgba(176,122,54,0.45)', label: 'Bronze' },
  claret: { hex: '#B0455C', dim: 'rgba(176,69,92,0.16)', border: 'rgba(176,69,92,0.45)', label: 'Claret' },
}

export type CoachSettings = {
  theme: 'dark' | 'light'
  accentKey: AccentKey
  density: 'compact' | 'regular' | 'spacious'
  academy: string
  coach: string
  cert: string
  awardThreshold: 3 | 4          // 3 = Consistent, 4 = Mastered
  shareHomework: boolean
  shareNextFocus: boolean
  shareCoachNote: boolean
  privateRate: number            // £/hour for a private lesson
  lessonTypes: string[]
  bookableHours: string
}

export const DEFAULT_SETTINGS: CoachSettings = {
  theme: 'dark',
  accentKey: 'purple',
  density: 'regular',
  academy: COACH_ORG.academy,
  coach: COACH_ORG.coach,
  cert: COACH_ORG.cert,
  awardThreshold: 3,
  shareHomework: true,
  shareNextFocus: true,
  shareCoachNote: false,
  privateRate: 38,
  lessonTypes: ['Private', 'Group', 'Cardio', 'Match play'],
  bookableHours: '08:00 – 20:00',
}

const KEY = 'lumio_coach_settings'
const EVT = 'lumio-coach-settings-changed'

export function getSettings(): CoachSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS } catch { return DEFAULT_SETTINGS }
}

export function setSettings(patch: Partial<CoachSettings>) {
  if (typeof window === 'undefined') return
  const next = { ...getSettings(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function resetSettings() {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
