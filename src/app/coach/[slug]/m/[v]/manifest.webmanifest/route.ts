import { NextResponse } from 'next/server'

// Per-slug PWA manifest for the COACH portal. Mirrors the tennis player
// portal's manifest route (display: standalone, portrait, icons) but
// coach-branded. The `[v]` path segment matches tennis's structure — iOS
// Safari caches manifests by URL path and ignores Cache-Control, so the
// layout points at a stable `/m/anon/...` path; `v` is ignored for content.
//
// NOTE — no install-token handoff (deliberate). Unlike the player portals,
// the coach portal is demo-only (no per-slug Supabase session) AND the shared
// InstallTokenPayload.sport union (src/lib/pwa-install-token.ts) does not
// include 'coach'. Wiring the token mint/verify would require editing shared
// PWA infra, which is out of scope. So this serves a static standalone
// manifest — exactly the player portals' anonymous path.

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; v: string }> },
) {
  const { slug } = await params

  const manifest = {
    name:             `Lumio Coach — ${slug}`,
    short_name:       'Lumio Coach',
    description:      'Your coaching OS — sessions, players, camps, GPS & video.',
    start_url:        `/coach/${slug}`,
    scope:            '/coach',
    display:          'standalone',
    orientation:      'portrait',
    background_color: '#07080F',
    theme_color:      '#A855F7',
    icons: [
      { src: '/tennis_coach_logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/tennis_coach_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/tennis_coach_logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
