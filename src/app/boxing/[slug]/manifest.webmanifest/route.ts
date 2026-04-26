import { NextResponse } from 'next/server'
import { verifyInstallToken } from '@/lib/pwa-install-token'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const portalPath = `/boxing/${slug}`
  let startUrl = portalPath

  // See src/app/tennis/[slug]/layout.tsx for why the install token
  // arrives via query string instead of cookies.
  const token = new URL(request.url).searchParams.get('install_token')
  if (token) {
    const payload = verifyInstallToken(token)
    if (payload && payload.sport === 'boxing' && payload.slug === slug) {
      startUrl = `${portalPath}?install_token=${encodeURIComponent(token)}`
    }
  }

  // scope widened to /<sport> + Vary overridden to drop Next's RSC
  // header list — see tennis route for full rationale.
  const manifest = {
    name:              `Lumio Boxing — ${slug}`,
    short_name:        'Boxing',
    description:       'Your fight OS — fight camp, weigh-in, corner sheet, sparring log.',
    start_url:         startUrl,
    scope:             '/boxing',
    display:           'standalone',
    orientation:       'portrait',
    background_color:  '#0D0820',
    theme_color:       '#DC2626',
    icons: [
      { src: '/boxing_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/boxing_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/boxing_logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
