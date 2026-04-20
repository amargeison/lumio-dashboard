import { NextResponse } from 'next/server'
import { verifyInstallToken } from '@/lib/pwa-install-token'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const portalPath = `/golf/${slug}`
  let startUrl = portalPath

  // See src/app/tennis/[slug]/layout.tsx for why the install token
  // arrives via query string instead of cookies.
  const token = new URL(request.url).searchParams.get('install_token')
  if (token) {
    const payload = verifyInstallToken(token)
    if (payload && payload.sport === 'golf' && payload.slug === slug) {
      startUrl = `${portalPath}?install_token=${encodeURIComponent(token)}`
    }
  }

  return NextResponse.json(
    {
      name:              `Lumio Golf — ${slug}`,
      short_name:        'Golf',
      description:       'Your golf OS — caddie workflow, OWGR, SG dashboard, sponsors.',
      start_url:         startUrl,
      scope:             portalPath,
      display:           'standalone',
      orientation:       'portrait',
      background_color:  '#0D0820',
      theme_color:       '#A855F7',
      icons: [
        { src: '/golf_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/golf_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/golf_logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store, must-revalidate' } },
  )
}
