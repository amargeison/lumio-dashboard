import type { Metadata, Viewport } from 'next'
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
export const metadata: Metadata = {
  title: 'Lumio',
  description: 'B2B workflow automation for EdTech companies',
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
