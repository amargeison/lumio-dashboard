import { NextResponse } from 'next/server'
import { partnerBrandBySlug } from '@/lib/coach/partner-login'
import { verifyInstallToken } from '@/lib/pwa-install-token'

// Per-slug PWA manifest for the COACH portal. Mirrors the tennis player
// portal's manifest route (display: standalone, icons) but coach-branded. The
// `[v]` path segment matches tennis's structure — iOS Safari caches manifests
// by URL path and ignores Cache-Control, so signed-out renders point at the
// stable `/m/anon/...` path and signed-in iPhone renders at a fresh one; `v` is
// ignored for content.
//
// Sign-in hand-off: an iPhone gives a home-screen app its own empty storage,
// so without help the installed app opens signed out. When the layout knows
// who is signed in it puts a short-lived, single-use install token on this
// manifest's address; a valid one for THIS academy is carried into start_url,
// and the first launch redeems it (middleware → /api/pwa/consume-token).

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; v: string }> },
) {
  const { slug: rawSlug } = await params
  // The slug ends up in the app's identity and start address, so only a
  // well-formed one gets a manifest at all.
  const slug = rawSlug.toLowerCase()
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return new NextResponse('Not found', { status: 404 })
  const isDemo = slug === 'demo'
  const brand = isDemo ? null : await partnerBrandBySlug(slug)
  // Partner sign-in switched on + a logo uploaded → the installed app carries
  // the academy's badge, not Lumio's. Same rule as the tab favicon.
  const icon = brand?.iconUrl || null

  const portalPath = `/tennis/coach/${slug}`
  let startUrl = portalPath
  const token = new URL(request.url).searchParams.get('install_token')
  if (token && brand) {
    const payload = verifyInstallToken(token)
    if (payload && payload.sport === 'coach' && payload.slug === slug) {
      startUrl = `${portalPath}?install_token=${encodeURIComponent(token)}`
    }
  }

  // The name under the home-screen icon. An academy installs under its own
  // name; the demo says it is the demo; an address no academy owns gets the
  // plain product name (never the text somebody typed into the address).
  const name = brand ? brand.name : isDemo ? 'Lumio Tennis Coach demo' : 'Lumio Tennis Coach'
  const shortName = brand ? brand.name.slice(0, 24) : isDemo ? 'Coach demo' : 'Lumio Coach'

  const manifest = {
    name,
    short_name:       shortName,
    description:      'Your coaching OS — sessions, players, camps, GPS & video.',
    // One identity PER ACADEMY. With a single shared id every academy and the
    // demo were the same app to the phone, so a coach who had installed the
    // demo (or works at two academies) could not install a second one.
    // An app installed before this change keeps its old identity ("/tennis/coach")
    // and carries on working; it is simply not updated by this manifest.
    id:               portalPath,
    start_url:        startUrl,
    scope:            '/tennis/coach/',
    display:          'standalone',
    // No orientation lock: the portal has a tablet layout, and a locked app
    // cannot be turned on its side.
    background_color: brand && brand.theme !== 'dark' ? '#FFFFFF' : '#07080F',
    theme_color:      brand ? brand.accent : '#3A8EE0',
    // Sizes are the files' real sizes. The Lumio artwork runs close to the
    // edges, so it is not offered as "maskable" (a round mask would cut it).
    icons: icon ? [
      { src: `${icon}&size=192`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${icon}&size=512`, sizes: '512x512', type: 'image/png', purpose: 'any' },
    ] : [
      { src: '/icons/tennis-coach-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/tennis-coach-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
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
