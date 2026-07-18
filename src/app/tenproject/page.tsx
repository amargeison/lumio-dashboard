import type { Metadata, Viewport } from 'next'
import SiteHome from './_site/SiteHome'

// ─── TEN PROJECT — NEW WEBSITE PREVIEW ──────────────────────────────────────
// URL: /tenproject  (portal demo lives at /tenproject/demo)
// Preview of the Wix-replacement site per Ten_Project_Portal_Scoping_v2.docx §10:
// one front door for families, schools, coaches, TENORs and funders, with
// portal login built in. Venue/impact data here is demo data; live counters
// wire to registers when the portal ships.

export const metadata: Metadata = {
  title: 'Ten Project — Free School & Community Tennis | LEARN. PLAY. TOGETHER.',
  description:
    'Free, fun, game-based tennis for children aged 4–10 — 10 weeks in school plus free weekend family sessions on your local community courts.',
  icons: {
    icon: [
      { url: '/tenproject-favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/tenproject-favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: '/tenproject_logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#D7262C',
}

export default function TenProjectSitePage() {
  return <SiteHome />
}
