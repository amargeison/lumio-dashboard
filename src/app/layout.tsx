import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { shareMeta, ogImageUrl } from '@/lib/share-meta'
import { Geist, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/gdpr/CookieBanner'
import PageViewTracker from '@/components/analytics/PageViewTracker'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
})

// Root metadata feeds <link rel="manifest">, theme-color, apple-web-app and
// icon tags into every page's <head>. Per-sport layouts (e.g.
// src/app/tennis/[slug]/layout.tsx) override manifest + themeColor with
// their own generateMetadata so portal installs are scoped to the sport
// route, not the marketing root.
// Host-aware so a lumiosports.com page with no copy of its own never previews
// as the business product. The EdTech line is lumiocms.com's; on the sports
// domain it captioned coaches' links as somebody else's software.
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') ?? ''
  const sports = host.includes('lumiosports')
  const base: Metadata = {
    manifest: '/manifest.json',
    appleWebApp: {
      capable:        true,
      title:          'Lumio',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon:  '/lumio-favicon-32.png',
      apple: '/lumio-favicon-256.png',
    },
  }
  if (!sports) return { ...base, title: 'Lumio', description: 'B2B workflow automation for EdTech companies' }
  return {
    ...base,
    ...shareMeta({
      title: 'Lumio Sports',
      description: 'Software for coaches, clubs, academies and athletes: bookings, player development, camps, messaging and more. Home of Lumio Tennis Coach.',
      image: ogImageUrl({ page: 'sports' }),
      siteName: 'Lumio Sports',
    }),
  }
}

// themeColor lives on `viewport` in Next 16. Per-sport [slug]/layout.tsx
// files override this via their own viewport export.
export const viewport: Viewport = {
  themeColor: '#0D9488',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" translate="no" className={`${geist.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <head>
        {/* Raw tags for fields Next's metadata API doesn't emit. Next's
            appleWebApp.capable: true emits `mobile-web-app-capable` but
            not the legacy `apple-mobile-web-app-capable` older iOS needs. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="google" content="notranslate" />
      </head>
      <body className="h-full" style={{ backgroundColor: '#07080F' }}>
        {children}
        <CookieBanner />
        <PageViewTracker />
      </body>
    </html>
  )
}
