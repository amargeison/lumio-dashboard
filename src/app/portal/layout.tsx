import type { Metadata, Viewport } from 'next'
import { shareMeta, ogImageUrl } from '@/lib/share-meta'

// The player and parent app. Its page is a client component, so the link
// preview copy lives here rather than falling back to the root layout's.
//
// It also needs its own app manifest. Without one, "Add to Home Screen" picked
// up the root layout's — the business product's "Lumio" app, which opens the
// marketing home page instead of the family's own page.
export const metadata: Metadata = {
  ...shareMeta({
    title: 'Your coaching — Lumio Tennis Coach',
    description: 'Sessions, lesson summaries, progress and messages from your coach.',
    image: ogImageUrl({ page: 'player' }),
    siteName: 'Lumio Tennis Coach',
  }),
  manifest: '/portal/manifest.json',
  appleWebApp: { capable: true, title: 'My coaching', statusBarStyle: 'black' },
  icons: {
    icon: [
      { url: '/lumio-favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/lumio-favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: '/icons/tennis-coach-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B0F17',
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children
}
