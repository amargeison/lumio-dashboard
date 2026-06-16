import type { Metadata, Viewport } from 'next'
import { PwaInstallRedeemer } from '@/components/pwa/PwaInstallRedeemer'

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
  return {
    title:    `Lumio Coach — ${slug}`,
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
