import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const REDIRECT_URI = 'https://lumiocms.com/api/auth/callback/microsoft-sso'

/**
 * GET /api/auth/callback/microsoft-sso
 * Handles Microsoft SSO login for the business portal.
 * Exchanges code for tokens, looks up business by email, creates session.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  let redirectTo = '/'
  try {
    const parsed = JSON.parse(stateRaw || '{}')
    redirectTo = parsed.redirectTo || '/'
  } catch { /* ignore */ }

  if (error) {
    console.error('[microsoft-sso] OAuth error:', error, errorDesc)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDesc || error)}`, req.nextUrl.origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=No+authorization+code+received', req.nextUrl.origin))
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[microsoft-sso] Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET')
    return NextResponse.redirect(new URL('/login?error=SSO+not+configured', req.nextUrl.origin))
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('[microsoft-sso] Token exchange failed:', tokenRes.status, errBody)
      return NextResponse.redirect(new URL('/login?error=Microsoft+sign-in+failed', req.nextUrl.origin))
    }

    const tokens = await tokenRes.json()
    const { access_token } = tokens

    // Get user profile from Microsoft Graph
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!profileRes.ok) {
      console.error('[microsoft-sso] Failed to get Microsoft profile:', profileRes.status)
      return NextResponse.redirect(new URL('/login?error=Failed+to+get+Microsoft+profile', req.nextUrl.origin))
    }

    const profile = await profileRes.json()
    const email = (profile.mail || profile.userPrincipalName || '').toLowerCase().trim()

    if (!email) {
      console.error('[microsoft-sso] No email in Microsoft profile:', profile)
      return NextResponse.redirect(new URL('/login?error=No+email+found+in+Microsoft+account', req.nextUrl.origin))
    }

    console.log('[microsoft-sso] Microsoft profile:', { email, name: profile.displayName })

    // Look up business by owner_email
    const supabase = getSupabase()
    const { data: business } = await supabase
      .from('businesses')
      .select('id, slug, company_name, owner_name, owner_email, logo_url, status, plan')
      .eq('owner_email', email)
      .eq('status', 'active')
      .maybeSingle()

    if (!business) {
      console.log('[microsoft-sso] No business found for email:', email)
      return NextResponse.redirect(new URL(
        `/login?error=no_account&message=${encodeURIComponent('No Lumio account found for ' + email + '. Start a free trial or contact hello@lumiocms.com.')}`,
        req.nextUrl.origin,
      ))
    }

    // Create session token (30-day expiry)
    const sessionToken = crypto.randomUUID()
    const { error: sessionError } = await supabase.from('business_sessions').insert({
      token: sessionToken,
      business_id: business.id,
      email,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (sessionError) {
      console.error('[microsoft-sso] Failed to create session:', sessionError)
      return NextResponse.redirect(new URL('/login?error=Failed+to+create+session', req.nextUrl.origin))
    }

    console.log('[microsoft-sso] Session created for:', email, 'slug:', business.slug)

    // Redirect to portal — pass session data via query params for the client to store
    const dest = redirectTo !== '/' ? redirectTo : `/${business.slug}`
    const url = new URL(dest, req.nextUrl.origin)
    url.searchParams.set('sso_session', sessionToken)
    url.searchParams.set('sso_slug', business.slug)
    url.searchParams.set('sso_company', business.company_name || '')
    url.searchParams.set('sso_name', business.owner_name || profile.displayName || '')
    url.searchParams.set('sso_email', email)
    if (business.logo_url) url.searchParams.set('sso_logo', business.logo_url)

    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[microsoft-sso] Unhandled error:', err)
    return NextResponse.redirect(new URL(
      `/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'Something went wrong')}`,
      req.nextUrl.origin,
    ))
  }
}
