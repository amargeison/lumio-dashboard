// ─── LUMIO IMPACT — PER-ORG SETTINGS ─────────────────────────────────────────
// Each live portal (/impact/<slug>) is an org with its own saved settings in
// impact_orgs (supabase/drafts/211_impact_orgs.sql): name, contact email,
// logo, volunteer term and which modules are on. Nothing org-specific is
// hard-coded here — a fresh org gets GENERIC_BRAND and all modules on.
//
// The one exception is a safety net: 'ten-project' (a founder-member portal)
// falls back to Ten Project's brand if its settings row is ever missing, so
// that portal can never render blank.

import { TEN_PROJECT_BRAND } from '@/data/tenproject/portal-copy'
import type { ImpactBrand } from '@/app/tenproject/[slug]/_components/ImpactDataContext'

/** What an org saves. Every field optional — blank means "not set yet". */
export interface ImpactOrgSettings {
  org?: string
  legal?: string
  hq?: string
  email?: string
  address?: string
  town?: string
  domain?: string
  logo?: string
  logoDark?: string
  favicon?: string
  /** Small (32px) favicon for generated documents; defaults to `favicon`. */
  favicon32?: string
  volunteer?: string
  volunteers?: string
  tagline?: string
  hashtag?: string
  socialHandle?: string
  /** Module id → false when switched off. Missing = on. */
  modules?: Record<string, boolean>
}

export const FOUNDER_FALLBACK: Record<string, ImpactBrand> = {
  'ten-project': TEN_PROJECT_BRAND,
}

// A fresh org: Lumio Impact chrome, neutral wording, no contact details.
export const GENERIC_BRAND: ImpactBrand = {
  org: 'Your organisation',
  orgUpper: 'YOUR ORGANISATION',
  legal: 'Your organisation',
  portal: 'Lumio Impact portal',
  hq: 'HQ',
  volunteer: 'Volunteer',
  volunteers: 'Volunteers',
  volunteerUpper: 'VOLUNTEER',
  volunteersUpper: 'VOLUNTEERS',
  logo: '/lumio-impact-logo-web.png',
  logoDark: '/lumio-impact-logo-web.png',
  logoAlt: 'Lumio Impact',
  favicon32: '/lumio-impact-icon-64.png',
  favicon64: '/lumio-impact-icon-64.png',
  faviconAlt: 'LI',
  domain: '',
  emailDomain: '',
  town: '',
  address: '',
  tagline: '',
  hashtag: '',
  socialHandle: '',
}

const set = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined)
const initials = (s: string) => s.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

/** The brand a live portal renders: saved settings over the generic base. */
export function brandFor(slug: string, settings: ImpactOrgSettings | null): ImpactBrand {
  if (!settings) return FOUNDER_FALLBACK[slug] ?? GENERIC_BRAND
  const s = settings
  const org = set(s.org)
  const volunteer = set(s.volunteer)
  const volunteers = set(s.volunteers) ?? (volunteer ? `${volunteer}s` : undefined)
  const email = set(s.email)
  const logo = set(s.logo)
  return {
    ...GENERIC_BRAND,
    ...(org ? { org, orgUpper: org.toUpperCase(), logoAlt: org, faviconAlt: initials(org) } : {}),
    ...(set(s.legal) ?? org ? { legal: set(s.legal) ?? org! } : {}),
    ...(set(s.hq) ?? org ? { hq: set(s.hq) ?? `${org} HQ` } : {}),
    ...(org ? { portal: `${org} Portal` } : {}),
    ...(volunteer ? { volunteer, volunteerUpper: volunteer.toUpperCase() } : {}),
    ...(volunteers ? { volunteers, volunteersUpper: volunteers.toUpperCase() } : {}),
    ...(logo ? { logo, logoDark: set(s.logoDark) ?? logo } : {}),
    ...(set(s.favicon) ? { favicon32: set(s.favicon32) ?? set(s.favicon)!, favicon64: set(s.favicon)! } : {}),
    ...(set(s.domain) ? { domain: set(s.domain)! } : {}),
    ...(email ? { emailDomain: email.split('@')[1] ?? '' } : set(s.domain) ? { emailDomain: set(s.domain)! } : {}),
    ...(set(s.town) ? { town: set(s.town)! } : {}),
    ...(set(s.address) ? { address: set(s.address)! } : {}),
    ...(set(s.tagline) ? { tagline: set(s.tagline)! } : {}),
    ...(set(s.hashtag) ? { hashtag: set(s.hashtag)! } : {}),
    ...(set(s.socialHandle) ? { socialHandle: set(s.socialHandle)! } : {}),
  }
}

// ─── Modules (mirrors Tennis Coach's sidebar show/hide) ─────────────────────
export interface ImpactModule { id: string; label: string; locked?: boolean; desc: string }

export function impactModules(brand: ImpactBrand): ImpactModule[] {
  return [
    { id: 'overview', label: 'Overview', locked: true, desc: 'Programme health, needs-attention and the snapshot' },
    { id: 'insights', label: 'Insights', desc: 'Participation, conversion, impact and social value' },
    { id: 'schools', label: 'Schools', desc: 'Partner schools — and the School view' },
    { id: 'venues', label: 'Venues', desc: 'Weekend community venues' },
    { id: 'coaches', label: 'Coaches', desc: 'Coaching team, compliance — and the Coach view' },
    { id: 'tenors', label: brand.volunteers, desc: `Volunteer ${brand.volunteers.toLowerCase()} — and the ${brand.volunteer} view` },
    { id: 'comms', label: 'Communications', desc: 'Inbox, newsletters, automations, audiences' },
    { id: 'social', label: 'Social', desc: 'Scheduling, publishing and analytics' },
    { id: 'equipment', label: 'Equipment & Kit', desc: 'Inventory, restock and kit lists' },
    { id: 'network', label: 'Sport Network', desc: 'PE & School Sport Partnerships Network readiness' },
    { id: 'settings', label: 'Settings', locked: true, desc: 'Organisation, modules, integrations and data' },
  ]
}

export const ALWAYS_ON = ['overview', 'settings']

export function moduleOn(settings: ImpactOrgSettings | null | undefined, id: string): boolean {
  if (ALWAYS_ON.includes(id)) return true
  return settings?.modules?.[id] !== false
}
