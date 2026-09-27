import type { Metadata, Viewport } from 'next'
import { PwaInstallRedeemer } from '@/components/pwa/PwaInstallRedeemer'
import { partnerBrandBySlug } from '@/lib/coach/partner-login'

// Server component wrapping the client coach [slug]/page.tsx so we can export
// generateMetadata: a per-slug PWA manifest + iOS standalone tags so an
// "Add to Home Screen" install opens directly into the coach portal in
// standalone mode (overriding the root layout's global manifest).
//
// Coach is demo-only (no per-slug Supabase session) and the shared
// InstallTokenPayload.sport union excludes 'coach', so — unlike the player
// portals' layouts — there is no install-token mint here; the manifest link
// uses the stable anon path. PwaInstallRedeemer is mounted for parity with the
// player portals: it is a no-op unless a ?pwa_install token is present in the
// URL (which the coach demo never sets), so it cannot disturb the page render
// or the SportsDemoGate.

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  // What a pasted link shows in WhatsApp, Slack, Trello and the rest. Without
  // its own description a portal link inherited the root layout's — which is the
  // business product's ("B2B workflow automation for EdTech companies") — so a
  // coach sharing their portal was captioned as somebody else's software.
  const brand = slug === 'demo' ? null : await partnerBrandBySlug(slug)
  const name = brand?.name || (slug === 'demo' ? 'Demo academy' : slug)
  const title = `${name} — Lumio Tennis Coach`
  const description = brand
    ? `${brand.name}'s coaching portal: bookings, session plans, lesson summaries, player progress, camps and messages. Running on Lumio Tennis Coach.`
    : 'The coaching portal for tennis coaches and academies: bookings, session plans, lesson summaries, player progress, camps and parent messaging.'
  return {
    title,
    description,
    openGraph: {
      title, description, siteName: 'Lumio Tennis Coach', type: 'website',
      images: [{ url: brand?.emailLogoUrl || 'https://www.lumiosports.com/tennis_coach_logo.png' }],
    },
    twitter: { card: 'summary', title, description },
    manifest: `/coach/${slug}/m/anon/manifest.webmanifest`,
    appleWebApp: {
      capable:        true,
      title:          'Lumio Coach',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      icon: [
        { url: '/lumio-favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/lumio-favicon-64.png', sizes: '64x64', type: 'image/png' },
      ],
      apple: '/tennis_coach_logo.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#3A8EE0',
}

export default function CoachSlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaInstallRedeemer />
      {children}
    </>
  )
}
