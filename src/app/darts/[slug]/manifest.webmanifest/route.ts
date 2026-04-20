import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { signInstallToken } from '@/lib/pwa-install-token'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const portalPath = `/darts/${slug}`
  let startUrl = portalPath

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id && user.email) {
      const token = signInstallToken({ sub: user.id, eml: user.email, sport: 'darts', slug })
      // Token rides on the portal path; middleware redeems it transparently.
      startUrl = `${portalPath}?install_token=${encodeURIComponent(token)}`
    }
  } catch { /* anonymous fall-through */ }

  return NextResponse.json(
    {
      name:              `Lumio Darts — ${slug}`,
      short_name:        'Darts',
      description:       'Your darts OS — walk-on cue, opponent intel, practice log, prize money.',
      start_url:         startUrl,
      scope:             portalPath,
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
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store, must-revalidate' } },
  )
}
