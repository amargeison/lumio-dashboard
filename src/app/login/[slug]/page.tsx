import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { SportsLoginForm, type PartnerBrand } from '@/components/auth/SportsLoginForm'
import { ACCENT_PRESETS, type AccentKey } from '@/app/coach/[slug]/_lib/settings-store'

// ─── PARTNER SIGN-IN ────────────────────────────────────────────────────────
// URL: /login/<portal-slug> — e.g. /login/pg-tennis. The link an academy puts on
// its own website: the same sign-in as /sports-login, dressed in the academy's
// name, logo, theme and accent, with "running on Lumio Tennis Coach" beneath.
//
// Read with the service role, and only the four brand fields leave the server —
// coach_settings also holds pricing, availability and sharing rules.

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

async function loadBrand(slug: string): Promise<PartnerBrand | null> {
  const clean = slug.trim().toLowerCase()
  if (!/^[a-z0-9-]{2,60}$/.test(clean)) return null
  try {
    const sb = db()
    const { data: profile } = await sb.from('sports_profiles')
      .select('id, brand_name, display_name, brand_logo_url, portal_slug')
      .eq('sport', 'coach').ilike('portal_slug', clean).maybeSingle()
    if (!profile) return null
    let s: { accentKey?: string; theme?: string; brandLogo?: string } = {}
    try {
      const { data: cfg } = await sb.from('coach_settings').select('data').eq('coach_id', profile.id).maybeSingle()
      s = (cfg?.data || {}) as typeof s
    } catch { /* no settings row yet — Lumio defaults */ }
    const key = (s.accentKey && s.accentKey in ACCENT_PRESETS ? s.accentKey : 'blue') as AccentKey
    const theme = s.theme === 'light' || s.theme === 'white' ? s.theme : 'dark'
    return {
      slug: profile.portal_slug || clean,
      name: (profile.brand_name || profile.display_name || 'Your academy').toString().trim(),
      logoUrl: s.brandLogo || profile.brand_logo_url || null,
      accent: ACCENT_PRESETS[key].hex,
      theme,
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = await loadBrand(slug)
  if (!brand) return { title: 'Sign in — Lumio Tennis Coach' }
  return {
    title: `Sign in — ${brand.name}`,
    description: `${brand.name} — running on Lumio Tennis Coach.`,
    robots: { index: false },
  }
}

export default async function PartnerLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brand = await loadBrand(slug)
  if (!brand) notFound()
  return <Suspense><SportsLoginForm brand={brand} /></Suspense>
}
