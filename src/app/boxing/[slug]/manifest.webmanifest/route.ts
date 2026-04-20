import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const startUrl = `/boxing/${slug}`

  return NextResponse.json(
    {
      name:              `Lumio Boxing — ${slug}`,
      short_name:        'Boxing',
      description:       'Your fight OS — fight camp, weigh-in, corner sheet, sparring log.',
      start_url:         startUrl,
      scope:             startUrl,
      display:           'standalone',
      orientation:       'portrait',
      background_color:  '#0D0820',
      theme_color:       '#A855F7',
      icons: [
        { src: '/boxing_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/boxing_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/boxing_logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
}
