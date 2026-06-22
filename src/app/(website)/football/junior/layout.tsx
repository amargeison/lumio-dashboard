import type { Metadata } from 'next'

// Junior had no layout, so a shared /football/junior link inherited the parent
// /football (Pro) metadata and previewed as Pro. This gives it its own
// canonical + og:url so it shares as the Junior product.
export const metadata: Metadata = {
  title: 'Lumio Football for Junior clubs — U7–U16, FA Charter Standard',
  description: 'Sessions, selection, matchday, travel and a safeguarding-first Consent Hub for volunteer-led U7–U16 junior football. Per-child consent, DBS register, FA Charter Standard evidence pack.',
  alternates: { canonical: '/football/junior' },
  openGraph: {
    title: 'Lumio Football for Junior clubs — U7–U16, FA Charter Standard',
    description: 'Safeguarding-first football for volunteer-led junior clubs. Per-child consent, DBS register, matchday and travel in one place.',
    type: 'website',
    url: 'https://lumiosports.com/football/junior',
    siteName: 'Lumio Sports',
    images: [{ url: '/football_logo.png', alt: 'Lumio Football for Junior clubs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Football for Junior clubs — U7–U16, FA Charter Standard',
    description: 'Safeguarding-first football for volunteer-led junior clubs. Per-child consent, DBS register, matchday and travel in one place.',
    images: ['/football_logo.png'],
  },
}

export default function FootballJuniorLayout({ children }: { children: React.ReactNode }) {
  return children
}
