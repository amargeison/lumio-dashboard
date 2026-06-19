import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { portalUrlFor } from '@/lib/sports-admin/portal-url'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

// Superadmin impersonation. Opened in a new tab from the sports-admin Impersonate
// buttons. Mints a real Supabase session for the target account (same Path C
// magic-link mint the demo OTP verify uses) by writing the sb-*-auth-token cookie
// onto a 302 response that redirects into the account's live portal. The admin
// then lands inside the real portal (authenticated as that account) rather than
// the public demo sign-in gate — so they can troubleshoot the account directly.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const userId = req.nextUrl.searchParams.get('userId')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || !anonKey) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // Resolve the account's email + portal destination.
  const { data: profile } = await admin
    .from('sports_profiles')
    .select('sport, portal_slug, brand_name, display_name')
    .eq('id', userId)
    .maybeSingle()
  const { data: authData } = await admin.auth.admin.getUserById(userId)
  const email = authData?.user?.email
  if (!profile || !email) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const dest = portalUrlFor({
    sport: profile.sport,
    portal_slug: profile.portal_slug,
    brand_name: profile.brand_name,
    display_name: profile.display_name,
  })

  // Build the redirect response up-front so the SSR cookie writer can attach the
  // session cookie directly to it (the documented @supabase/ssr App Router pattern).
  //
  // Use a RELATIVE Location header rather than NextResponse.redirect(new URL(dest,
  // req.url)): behind the nginx → PM2 proxy, req.url reflects the internal host
  // (0.0.0.0:3000), so an absolute redirect points at an invalid address. A
  // relative path is resolved by the browser against the real public origin.
  const cookieStore = await cookies()
  const response = new NextResponse(null, { status: 302, headers: { Location: dest } })
  const ssr = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const c of toSet) {
          response.cookies.set(c.name, c.value, { ...(c.options ?? {}), secure: true, sameSite: 'lax', path: '/' })
        }
      },
    },
  })

  try {
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    if (linkErr || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: 'Could not generate session link' }, { status: 500 })
    }
    const { error: verifyErr } = await ssr.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    })
    if (verifyErr) return NextResponse.json({ error: 'Could not mint session' }, { status: 500 })
  } catch (err) {
    console.error('[sports-admin/impersonate]', err)
    return NextResponse.json({ error: 'Impersonation failed' }, { status: 500 })
  }

  return response
}
