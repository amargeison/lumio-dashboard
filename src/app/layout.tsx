import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/gdpr/CookieBanner'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Lumio',
  description: 'B2B workflow automation for EdTech companies',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D9488" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Lumio" />
        <link rel="icon" type="image/png" sizes="32x32" href="/lumio-favicon-32.png" />
        <link rel="apple-touch-icon" href="/lumio-favicon-256.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="h-full" style={{ backgroundColor: '#07080F' }}>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
