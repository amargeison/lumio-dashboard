import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInstallToken } from '@/lib/pwa-install-token'

// Fresh each request — install tokens are time-bound and must not be
// served from a CDN cache to different users.
export const dynamic = 'force-dynamic'

// Dynamic per-slug manifest. Each installed PWA gets its own identity
// scoped to the specific sport + slug so "Add to Home Screen" launches
// straight back into /tennis/<slug>, standalone, with no browser chrome.
//
// If the Safari session is authenticated, start_url embeds a short-lived
// install token. First open of the installed PWA redeems the token via
// /api/pwa/consume-token → Supabase magic-link → session minted in the
// PWA's cookie jar — no OTP required.
//
// scope deliberately omits the token so the PWA doesn't leak it into
// random internal requests after install.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const portalPath = `/tennis/${slug}`
  let startUrl = portalPath

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id && user.email) {
      const token = signInstallToken({
        sub:   user.id,
        eml:   user.email,
        sport: 'tennis',
        slug,
      })
      // Token is embedded on the portal path itself. Middleware
      // intercepts /<sport>/<slug>?install_token=... and routes through
      // /api/pwa/consume-token internally, so the user only ever sees
      // the portal URL — never the API endpoint.
      startUrl = `${portalPath}?install_token=${encodeURIComponent(token)}`
    }
  } catch {
    // Anonymous fall-through — startUrl stays as the bare portal path.
  }

  return NextResponse.json(
    {
      name:              `Lumio Tennis — ${slug}`,
      short_name:        'Tennis',
      description:       'Your tennis OS — morning briefings, match prep, GPS, sponsors.',
      start_url:         startUrl,
      scope:             portalPath,
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
    {
      headers: {
        'Content-Type':  'application/manifest+json',
        'Cache-Control': 'no-store, must-revalidate',
      },
    },
  )
}
