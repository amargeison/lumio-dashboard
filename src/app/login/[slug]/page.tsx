import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { SportsLoginForm } from '@/components/auth/SportsLoginForm'
import { partnerBrandBySlug } from '@/lib/coach/partner-login'

// ─── PARTNER SIGN-IN ────────────────────────────────────────────────────────
// URL: /login/<portal-slug> — e.g. /login/pg-tennis. The link an academy puts on
// its own website: the same sign-in as /sports-login, dressed in the academy's
// name, logo, theme and accent, with "running on Lumio Tennis Coach" beneath.
//
// Only when the head coach has switched it on (onboarding, or Settings →
// Partner sign-in page). Otherwise the address forwards to the standard Lumio
// sign-in, so a link that went out before it was switched off still works.
//
// Signing in here and signing in at /sports-login are the same thing — one
// session, same destination. A family can use either and is never asked twice.

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = await partnerBrandBySlug(slug)
  if (!brand || !brand.enabled) return { title: 'Sign in — Lumio Tennis Coach' }
  const title = `Sign in — ${brand.name}`
  const description = `Sign in to ${brand.name}: sessions, lesson summaries, progress and messages. Running on Lumio Tennis Coach.`
  return {
    title,
    description,
    robots: { index: false },
    openGraph: {
      title, description, siteName: 'Lumio Tennis Coach', type: 'website',
      images: brand.emailLogoUrl ? [{ url: brand.emailLogoUrl }] : [{ url: 'https://www.lumiosports.com/tennis_coach_logo.png' }],
    },
    twitter: { card: 'summary', title, description },
  }
}

export default async function PartnerLoginPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const brand = await partnerBrandBySlug(slug)
  if (!brand) notFound()
  if (!brand.enabled) {
    // Keep whatever they arrived with (?email=…, ?redirectTo=…).
    const sp = await searchParams
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (typeof v === 'string') qs.set(k, v)
    redirect(`/sports-login${qs.size ? `?${qs}` : ''}`)
  }
  return (
    <Suspense>
      <SportsLoginForm brand={{ slug: brand.slug, name: brand.name, logoUrl: brand.logoUrl, accent: brand.accent, theme: brand.theme }} />
    </Suspense>
  )
}
