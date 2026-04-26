import { NextResponse } from 'next/server'
import { verifyInstallToken } from '@/lib/pwa-install-token'

// Fresh each request — install tokens are time-bound and must not be
// served from a CDN cache to different users.
export const dynamic = 'force-dynamic'

// Dynamic per-slug manifest. Each installed PWA gets its own identity
// scoped to /tennis/<slug> so "Add to Home Screen" launches straight
// back into the portal, standalone, no browser chrome.
//
// The install token (when present) arrives as ?install_token=<JWT> on
// THIS route's URL, not via cookies. The portal page's layout.tsx
// embeds the token on the manifest LINK href when the user is logged
// in — see the comment in src/app/tennis/[slug]/layout.tsx for the
// full rationale (Safari/Chrome strip cookies from manifest fetches).
//
// scope is fixed to the portal path so the PWA doesn't accidentally
// carry the token into post-install internal requests.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const portalPath = `/tennis/${slug}`
  let startUrl = portalPath

  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('install_token')
  console.log('[manifest]', { sport: 'tennis', slug, hasInstallToken: !!token, queryRaw: requestUrl.searchParams.toString() })
  if (token) {
    const payload = verifyInstallToken(token)
    if (payload && payload.sport === 'tennis' && payload.slug === slug) {
      // Token rides on the portal path; middleware redeems it
      // transparently via /api/pwa/consume-token.
      startUrl = `${portalPath}?install_token=${encodeURIComponent(token)}`
    } else {
      console.warn('[manifest] tennis install_token verify failed', { hasPayload: !!payload, payloadSport: payload?.sport, payloadSlug: payload?.slug })
    }
  }

  // scope is widened to /<sport> (not /<sport>/<slug>) so iOS Safari
  // accepts this manifest from any sub-route under /tennis. Tighter
  // scope was triggering a fallback to the global /manifest.json when
  // the page where Add-to-Home-Screen was triggered didn't exactly
  // match /<sport>/<slug>. start_url stays precise so the installed
  // PWA still launches into the user's specific portal.
  const manifest = {
    name:              `Lumio Tennis — ${slug}`,
    short_name:        'Tennis',
    description:       'Your tennis OS — morning briefings, match prep, GPS, sponsors.',
    start_url:         startUrl,
    scope:             '/tennis',
    display:           'standalone',
    orientation:       'portrait',
    background_color:  '#0D0820',
    theme_color:       '#A855F7',
    icons: [
      { src: '/tennis_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/tennis_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/tennis_logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  // Use new NextResponse(string) rather than NextResponse.json so the
  // framework's RSC-aware Vary list (rsc, next-router-state-tree, …)
  // doesn't get appended. iOS WebKit treats those as a hint that the
  // resource is per-request-variant and can re-fetch with a different
  // result, which has historically triggered manifest fallback.
  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type':  'application/manifest+json',
      'Cache-Control': 'no-store, must-revalidate',
      'Vary':          'Accept-Encoding',
    },
  })
}
