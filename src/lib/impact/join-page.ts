// What the public /impact/<slug>/join page may show: the org's name and logo, its
// privacy policy link, and its venues (name, day, time, where). Nothing about any
// family, child or member is ever read here. The demo is fully hand-written.

import { createClient } from '@supabase/supabase-js'
import { brandFor, moduleOn, privacyUrlOf, type ImpactOrgSettings } from './org'
export { privacyUrlOf }
import { VENUES as DEMO_VENUES } from '@/data/impact/demo-data'
import { IMPACT_DEMO_BRAND } from '@/data/impact/demo-copy'
import { joinConsentText, joinHealthConsentText, JOIN_CONSENT_VERSION, COACH_NOTE_MAX } from './community'

export interface JoinVenue { id: string; name: string; when: string | null; where: string | null; full: boolean }
export interface JoinPage {
  slug: string; demo: boolean; org: string; logo: string; privacyUrl: string | null
  /** Why the form is closed (no privacy policy yet, module off), or null when open. */
  closed: string | null
  venues: JoinVenue[]; consentText: string; consentVersion: string
  /** The separate tick shown once "anything the coach should know" has text in it. */
  healthConsentText: string; noteMax: number
}

const when = (day?: string | null, time?: string | null) => [day, time].filter(Boolean).join(' ') || null

export async function loadJoinPage(slug: string): Promise<JoinPage | null> {
  if (slug === 'demo') {
    return {
      slug, demo: true, org: IMPACT_DEMO_BRAND.org, logo: IMPACT_DEMO_BRAND.logo, privacyUrl: 'https://www.lumiosports.com/privacy', closed: null,
      venues: DEMO_VENUES.map(v => ({ id: v.id, name: v.name, when: when(v.day, v.time), where: null, full: false })),
      consentText: joinConsentText(IMPACT_DEMO_BRAND.org), consentVersion: JOIN_CONSENT_VERSION, healthConsentText: joinHealthConsentText(IMPACT_DEMO_BRAND.org), noteMax: COACH_NOTE_MAX,
    }
  }
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) return null
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data: org } = await db.from('impact_orgs').select('hq_id, settings').eq('slug', slug).maybeSingle()
  if (!org) return null
  const settings = (org.settings ?? {}) as ImpactOrgSettings
  const brand = brandFor(slug, settings)
  const privacyUrl = privacyUrlOf(settings)
  const { data: venues } = await db.from('tp_venues').select('id, name, address, postcode, session_day, session_time, capacity').eq('hq_id', org.hq_id).order('name')
  // Only whether a venue is full is shown, never how many families are there.
  const { data: placed } = await db.from('tp_families').select('community_venue_id').eq('hq_id', org.hq_id).not('community_venue_id', 'is', null).is('waitlisted_at', null)
  const count = (id: string) => (placed ?? []).filter(p => p.community_venue_id === id).length
  return {
    slug, demo: false, org: brand.org, logo: brand.logo, privacyUrl,
    closed: !moduleOn(settings, 'community') ? 'Sign-up isn’t open at the moment.' : !privacyUrl ? 'Sign-up opens soon — we’re just finishing our privacy policy.' : null,
    venues: (venues ?? []).map(v => ({ id: v.id, name: v.name, when: when(v.session_day, v.session_time), where: [v.address, v.postcode].filter(Boolean).join(', ') || null,
      full: !!v.capacity && count(v.id) >= v.capacity })),
    consentText: joinConsentText(brand.org), consentVersion: JOIN_CONSENT_VERSION,
    healthConsentText: joinHealthConsentText(brand.org), noteMax: COACH_NOTE_MAX,
  }
}
