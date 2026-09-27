import { createClient } from '@supabase/supabase-js'
import { ACCENT_PRESETS, type AccentKey } from '@/app/coach/[slug]/_lib/settings-store'

// An academy's own sign-in page — /login/<portal-slug> — and everything that has
// to agree with it: the page itself, the welcome emails that link to it, and the
// logo those emails show.
//
// It is a switch the head coach turns on (onboarding, or Settings → Partner
// sign-in page). Off means the academy has not asked for it, so every link goes
// to the standard Lumio sign-in instead. One function answers "is it on, and
// what does it look like", so the page and the emails can never disagree about
// where a family should sign in.

export const SITE = 'https://www.lumiosports.com'
export const STANDARD_SIGN_IN = `${SITE}/sports-login`

export type PartnerBrand = {
  coachId: string
  slug: string
  name: string
  /** As stored: a data URL straight from the uploader, or a hosted URL. */
  logoUrl: string | null
  /** The same logo at a real https address, for email clients that refuse data URLs. */
  emailLogoUrl: string | null
  accent: string
  theme: 'dark' | 'light' | 'white'
  enabled: boolean
  /** Their page when it is switched on, the standard sign-in when it is not. */
  signInUrl: string
}

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

type Profile = { id: string; brand_name: string | null; display_name: string | null; brand_logo_url: string | null; portal_slug: string | null }
type Stored = { accentKey?: string; theme?: string; brandLogo?: string; partnerLogin?: boolean }

async function build(profile: Profile): Promise<PartnerBrand> {
  let s: Stored = {}
  try {
    const { data: cfg } = await db().from('coach_settings').select('data').eq('coach_id', profile.id).maybeSingle()
    s = (cfg?.data || {}) as Stored
  } catch { /* no settings row yet — Lumio defaults, switched off */ }
  const key = (s.accentKey && s.accentKey in ACCENT_PRESETS ? s.accentKey : 'blue') as AccentKey
  const theme = s.theme === 'light' || s.theme === 'white' ? s.theme : 'dark'
  const slug = (profile.portal_slug || '').trim()
  const logoUrl = s.brandLogo || profile.brand_logo_url || null
  const enabled = s.partnerLogin === true && !!slug
  return {
    coachId: profile.id,
    slug,
    name: (profile.brand_name || profile.display_name || 'Your academy').toString().trim(),
    logoUrl,
    emailLogoUrl: logoUrl
      ? (/^https?:\/\//.test(logoUrl) ? logoUrl : `${SITE}/api/coach/brand-logo?slug=${encodeURIComponent(slug)}`)
      : null,
    accent: ACCENT_PRESETS[key].hex,
    theme,
    enabled,
    signInUrl: enabled ? `${SITE}/login/${slug}` : STANDARD_SIGN_IN,
  }
}

const COLS = 'id, brand_name, display_name, brand_logo_url, portal_slug'

/** By the academy's web address, e.g. "pg-tennis". Null when no academy has it. */
export async function partnerBrandBySlug(slug: string): Promise<PartnerBrand | null> {
  const clean = slug.trim().toLowerCase()
  if (!/^[a-z0-9-]{2,60}$/.test(clean)) return null
  try {
    const { data } = await db().from('sports_profiles').select(COLS).eq('sport', 'coach').ilike('portal_slug', clean).maybeSingle()
    return data ? build(data as Profile) : null
  } catch { return null }
}

/** By the head coach's id — the academy_id on every membership. */
export async function partnerBrandByCoach(coachId: string): Promise<PartnerBrand | null> {
  try {
    const { data } = await db().from('sports_profiles').select(COLS).eq('id', coachId).maybeSingle()
    return data ? build(data as Profile) : null
  } catch { return null }
}
