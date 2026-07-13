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

// Coaching accreditations for the Settings dropdowns (head coach + sub-coaches).
// Edit this list to match the qualifications your governing body issues.
export const ACCREDITATIONS: string[] = [
  'LTA Accredited+ Coach – Performance',
  'LTA Accredited+ Coach',
  'LTA Accredited Coach',
  'Senior Performance Coach',
  'Performance Coach',
  'Senior Club Coach',
  'Qualified Coach',
  'Coaching Assistant',
  'Coaching apprentice (in training)',
]

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
  // ── Per-area settings (the expanded Settings cards) ──
  profile: { role: string; email: string; phone: string; dbsNumber: string; dbsExpiry: string; safeguardingDate: string }
  conn: { emailProvider: string; calendarSync: boolean }
  booking: { google: boolean; outlook: boolean; ical: string; defaultDuration: number; buffer: number; autoConfirm: boolean }
  gdpr: { data: boolean; photo: boolean; medical: boolean; wearable: boolean; retentionYears: number; dpaAccepted: boolean }
  staff: { dsl: string; reminderDays: number; policyOn: boolean }
  messaging: { senderEmail: string; senderPhone: string; email: boolean; text: boolean; inapp: boolean }
  rewards: { leaderboard: boolean; levelsVisible: boolean; watchConsentDefault: boolean }
  primaryVenueId: string         // home / main site (overrides the data default)
  syncedVenues: string[]         // venue ids with calendar sync connected
  resourcesPreloaded: boolean    // Resource Centre starts with Lumio's library (true) or empty so the coach adds their own (false)
  packagesSeeded: boolean         // Payments price list auto-loaded the Lumio default packages once
  equipmentSeeded: boolean        // Equipment & Kit auto-loaded the Lumio default kit + inventory once
  ccCoachOnEmail: boolean         // CC the coach's own inbox on emails sent to players/parents
  audioOnly: boolean              // Video & Audio module: hide the video half, show audio only (menu label → "Audio only")
  brandLogo: string               // Club/academy logo (data URL) shown top-left instead of the Lumio mark
  // The head coach's own contact + DBS / safeguarding record (the account owner).
  // Empty by default so a new head is correctly flagged until they record it.
  head: { phone: string; email: string; contractedHours: number | null; dbsNumber: string; dbsIssued: string; dbsExpiry: string; safeguardingTrained: boolean; safeguardingDate: string; avatarUrl: string }
}

export const DEFAULT_SETTINGS: CoachSettings = {
  theme: 'dark',
  accentKey: 'blue',
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
  profile: { role: 'Head Coach', email: 'hello@riversidetennis.example', phone: '+44 7700 900123', dbsNumber: '0012 3456 7890', dbsExpiry: '2027-09-02', safeguardingDate: '2025-10-14' },
  conn: { emailProvider: 'google', calendarSync: true },
  booking: { google: true, outlook: false, ical: '', defaultDuration: 60, buffer: 10, autoConfirm: true },
  gdpr: { data: true, photo: false, medical: false, wearable: false, retentionYears: 3, dpaAccepted: true },
  staff: { dsl: COACH_ORG.coach, reminderDays: 90, policyOn: true },
  messaging: { senderEmail: 'hello@riversidetennis.example', senderPhone: '+44 7863 765950', email: true, text: true, inapp: true },
  rewards: { leaderboard: true, levelsVisible: true, watchConsentDefault: false },
  primaryVenueId: '',
  syncedVenues: ['riverside'],
  resourcesPreloaded: true,
  packagesSeeded: false,
  equipmentSeeded: false,
  ccCoachOnEmail: true,
  audioOnly: false,
  brandLogo: '',
  head: { phone: '', email: '', contractedHours: null, dbsNumber: '', dbsIssued: '', dbsExpiry: '', safeguardingTrained: false, safeguardingDate: '', avatarUrl: '' },
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

// ── Canonical head-coach record ─────────────────────────────────────────────
// Settings → "Head coach profile" and the Coaches module previously kept two
// separate copies of the head coach's record (`coach`/`cert`/`profile.*` vs
// `head.*`) which drifted apart (e.g. Settings showing a DBS number while the
// Coaches page said "No DBS on file"). Both surfaces now read and write through
// getHeadProfile / setHeadProfile so they can never disagree.
//
// Legacy `profile.*` values are honoured as a fallback ONLY when they differ
// from the demo defaults — so a brand-new academy is correctly flagged (no
// fake demo DBS number) until the coach records their own details.
export type HeadProfile = {
  name: string
  role: string
  accreditation: string
  email: string
  phone: string
  dbsNumber: string
  dbsIssued: string
  dbsExpiry: string
  safeguardingTrained: boolean
  safeguardingDate: string
  contractedHours: number | null
  avatarUrl: string
}

const realOrEmpty = (v: string | undefined, demoDefault: string) => (v && v !== demoDefault ? v : '')

export function getHeadProfile(): HeadProfile {
  const s = getSettings()
  const p = { ...DEFAULT_SETTINGS.profile, ...(s.profile || {}) }
  const h = { ...DEFAULT_SETTINGS.head, ...(s.head || {}) }
  const dp = DEFAULT_SETTINGS.profile
  const safeguardingDate = h.safeguardingDate || realOrEmpty(p.safeguardingDate, dp.safeguardingDate)
  return {
    name: s.coach,
    role: p.role || 'Head Coach',
    accreditation: s.cert,
    email: h.email || realOrEmpty(p.email, dp.email),
    phone: h.phone || realOrEmpty(p.phone, dp.phone),
    dbsNumber: h.dbsNumber || realOrEmpty(p.dbsNumber, dp.dbsNumber),
    dbsIssued: h.dbsIssued,
    dbsExpiry: h.dbsExpiry || realOrEmpty(p.dbsExpiry, dp.dbsExpiry),
    safeguardingTrained: h.safeguardingTrained || !!safeguardingDate,
    safeguardingDate,
    contractedHours: h.contractedHours,
    avatarUrl: h.avatarUrl,
  }
}

export function setHeadProfile(patch: Partial<HeadProfile>) {
  const n = { ...getHeadProfile(), ...patch }
  const s = getSettings()
  setSettings({
    coach: n.name,
    cert: n.accreditation,
    // Keep the legacy `profile` card in step so any older readers stay correct.
    profile: { ...DEFAULT_SETTINGS.profile, ...(s.profile || {}), role: n.role, email: n.email, phone: n.phone, dbsNumber: n.dbsNumber, dbsExpiry: n.dbsExpiry, safeguardingDate: n.safeguardingDate },
    head: { phone: n.phone, email: n.email, contractedHours: n.contractedHours, dbsNumber: n.dbsNumber, dbsIssued: n.dbsIssued, dbsExpiry: n.dbsExpiry, safeguardingTrained: n.safeguardingTrained, safeguardingDate: n.safeguardingDate, avatarUrl: n.avatarUrl },
  })
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
