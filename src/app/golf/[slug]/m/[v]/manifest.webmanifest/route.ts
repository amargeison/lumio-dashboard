import { NextResponse } from 'next/server'
import { verifyInstallToken } from '@/lib/pwa-install-token'

// Per-slug PWA manifest with cache-buster path segment.
// See src/app/tennis/[slug]/m/[v]/manifest.webmanifest/route.ts for the
// full rationale on why `[v]` exists.

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; v: string }> },
) {
  const { slug, v } = await params
  const portalPath = `/golf/${slug}`
  let startUrl = portalPath

  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('install_token')
  console.log('[manifest] ' + JSON.stringify({ sport: 'golf', slug, v, hasInstallToken: !!token, queryRaw: requestUrl.searchParams.toString() }))

  if (token) {
    const payload = verifyInstallToken(token)
    if (payload && payload.sport === 'golf' && payload.slug === slug) {
      startUrl = `${portalPath}?install_token=${encodeURIComponent(token)}`
    } else {
      console.warn('[manifest] golf install_token verify failed', { hasPayload: !!payload, payloadSport: payload?.sport, payloadSlug: payload?.slug })
    }
  }

  const manifest = {
    name:              `Lumio Golf — ${slug}`,
    short_name:        'Golf',
    description:       'Your golf OS — caddie workflow, OWGR, SG dashboard, sponsors.',
    start_url:         startUrl,
    scope:             '/golf',
    display:           'standalone',
    orientation:       'portrait',
    background_color:  '#0D0820',
    theme_color:       '#16A34A',
    icons: [
      { src: '/golf_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/golf_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/golf_logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
