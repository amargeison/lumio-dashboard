import type { Metadata, Viewport } from 'next'

// Minimal layout for the Ten Project demo portal (first slice).
// No PWA manifest minting yet — follow the darts/tennis layout pattern
// (per-render manifest path + install token) when the parent PWA lands.

export const metadata: Metadata = {
  title: 'Ten Project Portal — demo',
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

export default function TenProjectSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
