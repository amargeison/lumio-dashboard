import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const startUrl = `/darts/${slug}`

  return NextResponse.json(
    {
      name:              `Lumio Darts — ${slug}`,
      short_name:        'Darts',
      description:       'Your darts OS — walk-on cue, opponent intel, practice log, prize money.',
      start_url:         startUrl,
      scope:             startUrl,
      display:           'standalone',
      orientation:       'portrait',
      background_color:  '#0D0820',
      theme_color:       '#A855F7',
      icons: [
        { src: '/darts_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/darts_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/darts_logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
}
