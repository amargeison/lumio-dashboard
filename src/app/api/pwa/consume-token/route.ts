import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { verifyInstallToken } from '@/lib/pwa-install-token'

export const dynamic = 'force-dynamic'

// GET /api/pwa/consume-token?t=<JWT>&next=/tennis/demo
//
// First-open redemption endpoint for the PWA install token embedded in
// the start_url of a per-sport manifest.
//
// We do the entire magic-link verify SERVER-SIDE so the browser never
// leaves our origin. iOS Safari partitions cookies per origin for an
// installed PWA — if we redirect the PWA browser through the Supabase
// verify URL (cross-origin) and back, the auth cookie ends up in the
// wrong jar and the user sees the OTP screen on cold launch.
//
// Flow:
//   1. Verify the install token (HMAC + expiry + slug match)
//   2. Short-circuit if the request already carries an sb-* auth cookie
//   3. admin.auth.admin.generateLink({ type:'magiclink' })
//   4. fetch(action_link, { redirect:'manual' }) — pull `code` from Location
//   5. exchangeCodeForSession(code) with cookies wired to outgoing response
//   6. Single same-origin 307 with Set-Cookie attached
//
// Silent fall-through (clean redirect to `next`, OTP screen at worst):
//   - token missing / expired / forged
//   - generateLink failure
//   - verify hop returns non-303 / no Location / no code
//   - exchangeCodeForSession failure
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Behind nginx + PM2 the raw request origin is 0.0.0.0:3000 — useless
  // for a redirect the client follows. Prefer the forwarded host/proto
  // headers nginx sets, fall back to the request origin otherwise.
  const fwdHost  = request.headers.get('x-forwarded-host')  || request.headers.get('host')
  const fwdProto = request.headers.get('x-forwarded-proto') || 'https'
  const publicOrigin = fwdHost ? `${fwdProto}://${fwdHost}` : new URL(request.url).origin

  const token = searchParams.get('t') || ''
  const nextRaw = searchParams.get('next') || '/'
  // Only allow relative same-origin `next` to prevent open-redirect.
  const nextPath = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/'
  const cleanTarget = new URL(nextPath, publicOrigin)

  if (!token) return NextResponse.redirect(cleanTarget)

  const payload = verifyInstallToken(token)
  if (!payload) {
    console.warn('[pwa/consume-token] invalid token')
    return NextResponse.redirect(cleanTarget)
  }

  // Belt-and-braces: the bound slug in the token should match the route
  // we're about to hand off to. Stops a token minted for /tennis/demo
  // being reused against /tennis/some-other-slug.
  const expectedPrefix = `/${payload.sport}/${payload.slug}`
  if (!nextPath.startsWith(expectedPrefix)) return NextResponse.redirect(cleanTarget)

  // Already-authed short-circuit: if the PWA already carries a Supabase
  // session cookie, don't burn a magic-link — just hand off to the page.
  // (Subsequent cold launches re-fetch the manifest with a stale token
  // baked in; this stops us minting an unused link every time.)
  const hasAuthCookie = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'),
  )
  if (hasAuthCookie) return NextResponse.redirect(cleanTarget)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.warn('[pwa/consume-token] missing supabase env')
    return NextResponse.redirect(cleanTarget)
  }

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // redirectTo points the verify hop at our /auth/callback so the `code`
  // lands on a same-origin URL in the Location header. We fetch this
  // server-side and never let the browser see the supabase.co URL.
  const callback = new URL('/auth/callback', publicOrigin)
  callback.searchParams.set('redirectTo', cleanTarget.pathname + cleanTarget.search + cleanTarget.hash)

  const linkRes = await admin.auth.admin.generateLink({
    type:  'magiclink',
    email: payload.eml,
    options: { redirectTo: callback.toString() },
  })

  if (linkRes.error || !linkRes.data?.properties?.action_link) {
    console.warn('[pwa/consume-token] generateLink failed')
    return NextResponse.redirect(cleanTarget)
  }

  // Server-side verify hop. action_link is supabase.co/auth/v1/verify?...
  // — Supabase responds with 303 and a Location pointing back to our
  // callback URL with ?code=… appended. We pull the code out of Location
  // and exchange it ourselves so the browser stays inside our origin.
  let code: string | null = null
  try {
    const verifyRes = await fetch(linkRes.data.properties.action_link, { redirect: 'manual' })
    const location = verifyRes.headers.get('location')
    if (!location) {
      console.warn('[pwa/consume-token] verify hop returned no location')
      return NextResponse.redirect(cleanTarget)
    }
    code = new URL(location, publicOrigin).searchParams.get('code')
  } catch {
    console.warn('[pwa/consume-token] verify fetch threw')
    return NextResponse.redirect(cleanTarget)
  }

  if (!code) {
    console.warn('[pwa/consume-token] missing code in verify location')
    return NextResponse.redirect(cleanTarget)
  }

  // Exchange the code for a session. Wire @supabase/ssr's cookie writer
  // to the outgoing redirect response so Set-Cookie lands on the 307 we
  // return — same-origin, same PWA cookie jar, no cross-origin hop.
  const cookieStore = await cookies()
  const outResponse = NextResponse.redirect(cleanTarget)

  const supabase = createServerClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) =>
            outResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code)
  if (exchErr) {
    console.warn('[pwa/consume-token] exchange failed')
    return NextResponse.redirect(cleanTarget)
  }

  return outResponse
}
