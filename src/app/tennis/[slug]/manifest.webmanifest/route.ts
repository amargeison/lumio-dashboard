import { NextResponse } from 'next/server'

// Dynamic per-slug manifest. Each installed PWA gets its own identity scoped
// to the specific sport + slug so "Add to Home Screen" launches straight
// back into /tennis/<slug>, standalone, with no browser chrome.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const startUrl = `/tennis/${slug}`

  return NextResponse.json(
    {
      name:              `Lumio Tennis — ${slug}`,
      short_name:        'Tennis',
      description:       'Your tennis OS — morning briefings, match prep, GPS, sponsors.',
      start_url:         startUrl,
      scope:             startUrl,
      display:           'standalone',
      orientation:       'portrait',
      background_color:  '#0D0820',
      theme_color:       '#A855F7',
      icons: [
        { src: '/tennis_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/tennis_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/tennis_logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
}
