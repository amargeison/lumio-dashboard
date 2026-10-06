import type { Metadata, Viewport } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { signInstallToken } from '@/lib/pwa-install-token'
import { PwaInstallRedeemer } from '@/components/pwa/PwaInstallRedeemer'
import { partnerBrandBySlug } from '@/lib/coach/partner-login'
import { shareMeta, ogImageUrl } from '@/lib/share-meta'

// Server component wrapping the client coach [slug]/page.tsx so we can export
// generateMetadata: a per-slug PWA manifest + iOS standalone tags so an
// "Add to Home Screen" install opens directly into the coach portal in
// standalone mode (overriding the root layout's global manifest).
//
// Sign-in hand-off for "Add to Home Screen" (same mechanism as the player
// portals' layouts — see src/app/tennis/[slug]/layout.tsx for the long story):
// an iPhone gives a home-screen app its own empty storage, so the installed
// app would open signed out and ask for a code again. A browser fetches the
// manifest without cookies, so the manifest route cannot know who is signed
// in; this render can. For a signed-in coach on an iPhone or iPad it puts a
// short-lived, single-use install token on the manifest's address, the
// manifest carries it into start_url, and the first launch redeems it.
// Everyone else — the demo, signed-out visitors, Android and desktop (where
// the installed app shares the browser's sign-in) — gets the stable anon path.
//
// PwaInstallRedeemer is mounted for parity with the player portals: it is a
// no-op unless a ?pwa_install token is present in the URL, so it cannot
// disturb the page render or the SportsDemoGate.

// An install-token manifest link for this request, or null for the anon one.
async function installManifestHref(slug: string): Promise<string | null> {
  try {
    const ua = (await headers()).get('user-agent') || ''
    // iPadOS Safari calls itself a Mac, so desktop Safari is let through too;
    // the token only ever signs in the person it was minted for.
    const appleSafari = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua))
    if (!appleSafari) return null
    const cookieStore = await cookies()
    // No sign-in cookie → nobody to hand over; skip the round trip.
    if (!cookieStore.getAll().some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))) return null
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const token = signInstallToken({ sub: user.id, sport: 'coach', slug })
    // Per-render path segment: iOS caches manifests by path and ignores
    // Cache-Control, so a fresh path is the only way it re-reads start_url.
    return `/coach/${slug}/m/${Date.now().toString(36)}/manifest.webmanifest?install_token=${encodeURIComponent(token)}`
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  // What a pasted link shows in WhatsApp, Slack, Trello and the rest. Without
  // its own description a portal link inherited the root layout's — which is the
  // business product's ("B2B workflow automation for EdTech companies") — so a
  // coach sharing their portal was captioned as somebody else's software.
  const brand = slug === 'demo' ? null : await partnerBrandBySlug(slug)
  const share = brand
    ? shareMeta({
        title: `${brand.name} portal — running on Lumio Tennis Coach`,
        description: `${brand.name}'s coaching portal: bookings, session plans, lesson summaries, player progress, camps and messages.`,
        image: ogImageUrl({ slug: brand.slug, v: 'portal' }),
      })
    : shareMeta({
        title: slug === 'demo' ? 'Lumio Tennis Coach — demo academy' : 'Lumio Tennis Coach',
        description: 'The coaching portal for tennis coaches and academies: bookings, session plans, lesson summaries, player progress, camps and parent messaging.',
        image: ogImageUrl({ page: 'tennis-coach' }),
      })
  // An academy that has switched its partner sign-in page on and uploaded a
  // logo gets its own badge in the browser tab and on the home screen — the
  // same switch that puts its brand on the sign-in page. Everyone else, and the
  // demo, keeps Lumio's.
  const icon = brand?.iconUrl
  // Only a real academy has an account to hand over.
  const tokenHref = brand ? await installManifestHref(brand.slug) : null
  return {
    ...share,
    manifest: tokenHref || `/coach/${slug}/m/anon/manifest.webmanifest`,
    appleWebApp: {
      capable:        true,
      // The name under the iPhone home-screen icon: the academy's own, and the
      // demo says it is the demo. Matches the manifest.
      title:          brand ? brand.name : slug === 'demo' ? 'Coach demo' : 'Lumio Coach',
      // 'black' keeps the page BELOW the clock and battery. 'black-translucent'
      // draws the page underneath them, which only works when the page pads
      // itself with the safe-area inset — and that inset is zero here because
      // the viewport is not declared viewport-fit=cover.
      statusBarStyle: 'black',
    },
    icons: icon
      ? {
          icon: [
            { url: `${icon}&size=32`, sizes: '32x32', type: 'image/png' },
            { url: `${icon}&size=64`, sizes: '64x64', type: 'image/png' },
          ],
          apple: `${icon}&size=180`,
        }
      : {
          icon: [
            { url: '/lumio-favicon-32.png', sizes: '32x32', type: 'image/png' },
            { url: '/lumio-favicon-64.png', sizes: '64x64', type: 'image/png' },
          ],
          // A real 192px file. This used to be the 2160px, 670 KB artwork.
          apple: '/icons/tennis-coach-192.png',
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
