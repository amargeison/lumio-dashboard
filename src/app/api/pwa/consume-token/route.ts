import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { verifyInstallToken, installTokenPath } from '@/lib/pwa-install-token'

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
//   1. Verify the install token (HMAC + expiry + exact portal match)
//   2. Short-circuit if the request already carries an sb-* auth cookie
//   3. Refuse a token that has been used before (see "Single use" below)
//   4. admin.auth.admin.generateLink({ type:'magiclink' })
//   5. verifyOtp({ token_hash }) with cookies wired to outgoing response —
//      the same server-side session mint the sign-in route
//      (/api/sports-demo/verify-otp) uses
//   6. Single same-origin 307 with Set-Cookie attached
//
// Silent fall-through (clean redirect to `next`, OTP screen at worst):
//   - token missing / expired / forged / already used / for another portal
//   - the token's owner no longer exists
//   - generateLink or verifyOtp failure

// Single use, part one: the tokens THIS server process has redeemed. Checked
// and recorded in one synchronous step, so two requests arriving together
// cannot both pass. Entries are dropped once the token would have expired
// anyway, so this never grows. (Part two, further down, covers a restart or a
// second server process, which this memory does not.)
const redeemed = new Map<string, number>()

// How far the sign-in service's clock may run ahead of ours before a token
// minted straight after sign-in would look "already used".
const CLOCK_SKEW_SECONDS = 5

// `next` must be a path on this site and nothing else. Browsers read a
// backslash as a forward slash and silently drop tabs and newlines, so
// "/\example.com" and "/<tab>/example.com" both mean "//example.com" — another
// website. Anything that is not a plain single-slash path goes to the home page.
function safeNextPath(raw: string, origin: string): string {
  if (!raw.startsWith('/') || raw.includes('//')) return '/'
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return '/'
  try {
    // Last word goes to the same parser the redirect itself uses.
    if (new URL(raw, origin).origin !== new URL(origin).origin) return '/'
  } catch { return '/' }
  return raw
}

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
  const nextPath = safeNextPath(nextRaw, publicOrigin)
  const cleanTarget = new URL(nextPath, publicOrigin)

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                ?? request.headers.get('x-real-ip')
                ?? 'unknown'
  console.log('[pwa-consume] hit ' + JSON.stringify({ hasToken: !!token, hasNext: !!nextRaw && nextRaw !== '/', ip: clientIp }))

  if (!token) return NextResponse.redirect(cleanTarget)

  const payload = verifyInstallToken(token)
  console.log('[pwa-consume] verify ' + JSON.stringify({ ok: !!payload, sport: payload?.sport, slug: payload?.slug }))
  if (!payload) {
    console.warn('[pwa/consume-token] invalid token')
    return NextResponse.redirect(cleanTarget)
  }

  // The token opens its own portal and nothing else: that exact page, or a
  // page beneath it. (A plain "starts with" let a token for /tennis/demo
  // through for /tennis/demo-anything.)
  const portalPath = installTokenPath(payload)
  if (cleanTarget.pathname !== portalPath && !cleanTarget.pathname.startsWith(portalPath + '/')) {
    return NextResponse.redirect(cleanTarget)
  }

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

  // Single use, part one (see `redeemed` above). No `await` between the check
  // and the record.
  const nowSec = Math.floor(Date.now() / 1000)
  for (const [jti, exp] of redeemed) if (exp < nowSec) redeemed.delete(jti)
  if (redeemed.has(payload.jti)) {
    console.warn('[pwa/consume-token] token already used')
    return NextResponse.redirect(cleanTarget)
  }
  redeemed.set(payload.jti, payload.exp)

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // The token names its owner by id only; fetch the account for the email the
  // magic link needs. No account → nothing to sign in.
  const { data: owner, error: ownerErr } = await admin.auth.admin.getUserById(payload.sub)
  const email = owner?.user?.email
  if (ownerErr || !owner?.user || !email) {
    console.warn('[pwa/consume-token] token owner not found')
    return NextResponse.redirect(cleanTarget)
  }

  // Single use, part two — holds across restarts and server processes without
  // a table. Redeeming a token signs its owner in, which moves the account's
  // "last signed in" time past the moment the token was issued. So a token
  // whose owner has signed in since it was issued has either been used
  // already, or has been overtaken by a newer sign-in; refuse both.
  const lastSignIn = owner.user.last_sign_in_at ? Date.parse(owner.user.last_sign_in_at) / 1000 : 0
  if (lastSignIn > payload.iat + CLOCK_SKEW_SECONDS) {
    console.warn('[pwa/consume-token] token already used (owner has signed in since it was issued)')
    return NextResponse.redirect(cleanTarget)
  }

  const linkRes = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = linkRes.data?.properties?.hashed_token
  console.log('[pwa-consume] generateLink ' + JSON.stringify({ ok: !linkRes.error && !!tokenHash }))

  // The link must be for the very account the token names.
  if (linkRes.error || !tokenHash || linkRes.data?.user?.id !== payload.sub) {
    console.warn('[pwa/consume-token] generateLink failed')
    return NextResponse.redirect(cleanTarget)
  }

  // Mint the session here, on the server, by verifying the link's hashed
  // token. Wire @supabase/ssr's cookie writer to the outgoing redirect
  // response so Set-Cookie lands on the 307 we return — same-origin, same PWA
  // cookie jar, no cross-origin hop, and the browser never sees supabase.co.
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

  const { error: verifyErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  console.log('[pwa-consume] verifyOtp ' + JSON.stringify({ ok: !verifyErr }))
  if (verifyErr) {
    console.warn('[pwa/consume-token] session mint failed')
    return NextResponse.redirect(cleanTarget)
  }

  console.log('[pwa-consume] redirect ' + JSON.stringify({ to: cleanTarget.pathname + cleanTarget.search }))
  return outResponse
}
