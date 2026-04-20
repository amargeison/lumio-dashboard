import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInstallToken } from '@/lib/pwa-install-token'

export const dynamic = 'force-dynamic'

const SPORTS = new Set(['tennis', 'golf', 'darts', 'boxing'])

// POST body: { sport: 'tennis'|'golf'|'darts'|'boxing', slug: string }
// Requires an authenticated Supabase session. Returns a short-lived
// install token + the portal start_url embedding it. Intended to be
// called by an "Install App" CTA inside the already-authenticated
// portal — warms a fresh token so that when the user then taps Share
// → Add to Home Screen, Safari re-fetches the manifest and picks up
// start_url with this token. First open of the installed PWA redeems
// the token and mints a session in the PWA's own cookie jar.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const sport = String(body?.sport || '').toLowerCase()
    const slug  = String(body?.slug  || '').trim()
    if (!SPORTS.has(sport) || !slug || !/^[a-z0-9-]{1,64}$/i.test(slug)) {
      return NextResponse.json({ error: 'invalid sport or slug' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          // This route only reads the session — don't mutate cookies.
          setAll() {},
        },
      },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
    }

    const token = signInstallToken({
      sub:   user.id,
      eml:   user.email,
      sport: sport as 'tennis' | 'golf' | 'darts' | 'boxing',
      slug,
    })
    return NextResponse.json({
      token,
      start_url: `/${sport}/${slug}?install_token=${encodeURIComponent(token)}`,
    })
  } catch (e) {
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
