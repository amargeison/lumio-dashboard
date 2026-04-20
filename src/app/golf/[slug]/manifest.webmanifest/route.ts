import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const startUrl = `/golf/${slug}`

  return NextResponse.json(
    {
      name:              `Lumio Golf — ${slug}`,
      short_name:        'Golf',
      description:       'Your golf OS — caddie workflow, OWGR, SG dashboard, sponsors.',
      start_url:         startUrl,
      scope:             startUrl,
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
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
}
