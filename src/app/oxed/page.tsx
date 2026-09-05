import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import OxEdSite from './_site/OxEdSite'

// ─── OXED & ASSESSMENT — NEW WEBSITE PREVIEW ────────────────────────────────
// URL: /oxed
// Redesign concept for oxedandassessment.com/uk. Copy, product names, statistics
// and testimonials are taken from the current public site; photography is
// placeholder stock to be swapped for OxEd's own imagery. Follows the same
// pattern as /tenproject (page.tsx + _site/SiteHome.tsx).
//
// LOCAL ONLY: this concept is shown to OxEd on localhost (`npm run dev`) and is
// deliberately NOT served on the live site — production returns a 404 unless
// OXED_PREVIEW=1 is set in the server environment.

export const metadata: Metadata = {
  title: 'OxEd & Assessment — Give every child the oral language skills to succeed',
  description:
    'University of Oxford spinout turning world-leading research into practical tools: LanguageScreen, ReadingScreen, MathsScreen and the Nuffield Early Language Intervention (NELI).',
  icons: { icon: '/oxed-site-logo.png', apple: '/oxed-site-logo.png' },
}

export const viewport: Viewport = { themeColor: '#1E6B2E' }

export default function OxEdSitePage() {
  if (process.env.NODE_ENV === 'production' && process.env.OXED_PREVIEW !== '1') notFound()
  return <OxEdSite />
}
