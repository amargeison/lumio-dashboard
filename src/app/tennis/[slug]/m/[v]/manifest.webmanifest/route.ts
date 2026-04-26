import { NextResponse } from 'next/server'
import { verifyInstallToken } from '@/lib/pwa-install-token'

// Per-slug PWA manifest with a cache-buster `[v]` segment in the path.
//
// Why the `[v]` segment exists
// ────────────────────────────
// iOS Safari caches manifests by URL PATH and ignores Cache-Control on the
// manifest response. Without a varying path, an anon visit to /<sport>/<slug>
// captures /<sport>/<slug>/manifest.webmanifest into Safari's manifest cache;
// when the user later signs in and the page emits the same manifest URL with
// a fresh `?install_token=…` query string, Safari reuses the cached anon
// manifest (start_url has no token) and the install token never reaches the
// installed PWA. Verified empirically — manifest fetches kept landing here
// with `queryRaw=""` even after the page rendered with the token in the link
// href.
//
// Fix: the layout's <link rel="manifest"> href now includes a fresh
// per-render value in the path (`/m/<random>/manifest.webmanifest…`).
// Anonymous renders use the stable `/m/anon/...` path, so iOS keeps a single
// happy cache entry for the email-gate persona; authed renders use a
// per-render cache-buster so iOS sees a brand-new URL → forced refetch →
// gets the manifest with the install_token in start_url.
//
// The route handler ignores `v` for content; it only branches on the
// `?install_token=…` query (existing logic, unchanged from the pre-move
// route).

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; v: string }> },
) {
  const { slug, v } = await params
  const portalPath = `/tennis/${slug}`
  let startUrl = portalPath

  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('install_token')
  console.log('[manifest] ' + JSON.stringify({ sport: 'tennis', slug, v, hasInstallToken: !!token, queryRaw: requestUrl.searchParams.toString() }))

  if (token) {
    const payload = verifyInstallToken(token)
    if (payload && payload.sport === 'tennis' && payload.slug === slug) {
      startUrl = `${portalPath}?install_token=${encodeURIComponent(token)}`
    } else {
      console.warn('[manifest] tennis install_token verify failed', { hasPayload: !!payload, payloadSport: payload?.sport, payloadSlug: payload?.slug })
    }
  }

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

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type':  'application/manifest+json',
      'Cache-Control': 'no-store, must-revalidate',
      'Vary':          'Accept-Encoding',
    },
  })
}
