import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyInstallToken } from '@/lib/pwa-install-token'

export const dynamic = 'force-dynamic'

// GET /api/pwa/consume-token?t=<JWT>&next=/tennis/tennis-demo
//
// First-open redemption endpoint for the PWA install token embedded in
// the start_url of a per-sport manifest. On valid token we ask Supabase
// for a single-use magic-link for the bound email and redirect the PWA
// browser into Supabase's verify URL — which ultimately lands back on
// /auth/callback and sets a fresh session in the PWA's cookie jar.
//
// Silent no-op paths (fall through to `next` without sign-in):
//   - token missing / expired / forged
//   - magic-link generation fails
//   - user already has a session (subsequent opens with a stale token;
//     we don't have a cheap way to detect the session here without
//     plumbing cookies, so we just let the downstream page short-circuit
//     if already auth'd — worst case we burn one extra magic-link).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('t') || ''
  const nextRaw = searchParams.get('next') || '/'
  // Only allow relative same-origin `next` to prevent open-redirect.
  const nextPath = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/'
  const cleanTarget = new URL(nextPath, origin)

  if (!token) return NextResponse.redirect(cleanTarget)

  const payload = verifyInstallToken(token)
  if (!payload) return NextResponse.redirect(cleanTarget)

  // Extra belt-and-braces: the bound slug in the token should match the
  // route we're about to hand off to. Prevents a token minted for
  // /tennis/tennis-demo being reused against /tennis/some-other-slug.
  const expectedPrefix = `/${payload.sport}/${payload.slug}`
  if (!nextPath.startsWith(expectedPrefix)) return NextResponse.redirect(cleanTarget)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.redirect(cleanTarget)

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // redirectTo is the post-verify landing — Supabase ships a `code` to
  // /auth/callback which exchanges it for a session. After that, the
  // callback redirects to the clean portal URL (no install_token).
  const callback = new URL('/auth/callback', origin)
  callback.searchParams.set('redirectTo', cleanTarget.pathname + cleanTarget.search + cleanTarget.hash)

  const { data, error } = await admin.auth.admin.generateLink({
    type:  'magiclink',
    email: payload.eml,
    options: { redirectTo: callback.toString() },
  })

  if (error || !data?.properties?.action_link) {
    return NextResponse.redirect(cleanTarget)
  }
  return NextResponse.redirect(data.properties.action_link)
}
