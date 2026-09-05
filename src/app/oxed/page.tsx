import type { Metadata, Viewport } from 'next'
import OxEdSite from './_site/OxEdSite'

// ─── OXED & ASSESSMENT — NEW WEBSITE PREVIEW ────────────────────────────────
// URL: /oxed
// Redesign concept for oxedandassessment.com/uk. Copy, product names, statistics
// and testimonials are taken from the current public site; photography is
// placeholder stock to be swapped for OxEd's own imagery. Follows the same
// pattern as /tenproject (page.tsx + _site/SiteHome.tsx).

export const metadata: Metadata = {
  title: 'OxEd & Assessment — Give every child the oral language skills to succeed',
  description:
    'University of Oxford spinout turning world-leading research into practical tools: LanguageScreen, ReadingScreen, MathsScreen and the Nuffield Early Language Intervention (NELI).',
  icons: { icon: '/oxed-site-logo.png', apple: '/oxed-site-logo.png' },
}

export const viewport: Viewport = { themeColor: '#1E6B2E' }

export default function OxEdSitePage() {
  return <OxEdSite />
}
