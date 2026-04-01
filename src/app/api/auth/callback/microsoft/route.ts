import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * GET /api/auth/callback/microsoft
 * Handles the OAuth callback from Microsoft after user consents.
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // Parse state to get integration key and workspace slug
  let integrationKey = 'outlook'
  let slug = ''
  try {
    const parsed = JSON.parse(stateRaw || '{}')
    integrationKey = parsed.key || 'outlook'
    slug = parsed.slug || ''
  } catch { /* ignore */ }

  const redirectBase = slug ? `/${slug}` : ''

  if (error) {
    console.error('[microsoft/callback] OAuth error:', error, errorDesc)
    const url = req.nextUrl.clone()
    url.pathname = redirectBase || '/home'
    url.search = `?integration_error=${encodeURIComponent(errorDesc || error)}`
    return NextResponse.redirect(url)
  }

  if (!code) {
    const url = req.nextUrl.clone()
    url.pathname = redirectBase || '/home'
    url.search = '?integration_error=No+authorization+code+received'
    return NextResponse.redirect(url)
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[microsoft/callback] Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET')
    const url = req.nextUrl.clone()
    url.pathname = redirectBase || '/home'
    url.search = '?integration_error=OAuth+not+configured'
    return NextResponse.redirect(url)
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
        redirect_uri: 'https://lumiocms.com/api/auth/callback/microsoft',
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('[microsoft/callback] Token exchange failed:', tokenRes.status, errBody)
      const url = req.nextUrl.clone()
      url.pathname = redirectBase || '/home'
      url.search = '?integration_error=Token+exchange+failed'
      return NextResponse.redirect(url)
    }

    const tokens = await tokenRes.json()
    const { access_token, refresh_token, expires_in } = tokens

    // Get user profile from Microsoft Graph
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const profile = profileRes.ok ? await profileRes.json() : {}

    // Store tokens in Supabase
    const supabase = getSupabase()

    // Find the business by slug
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (business) {
      await supabase.from('integration_tokens').upsert({
        business_id: business.id,
        provider: `microsoft_${integrationKey}`,
        access_token,
        refresh_token: refresh_token || null,
        expires_at: new Date(Date.now() + (expires_in || 3600) * 1000).toISOString(),
        profile_email: profile.mail || profile.userPrincipalName || null,
        profile_name: profile.displayName || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'business_id,provider' })
    }

    console.log('[microsoft/callback] Successfully connected:', integrationKey, 'for slug:', slug, 'email:', profile.mail || profile.userPrincipalName)

    // Redirect back to portal with success flag
    // The client will read this and set localStorage
    const url = req.nextUrl.clone()
    url.pathname = redirectBase || '/home'
    url.search = `?integration_connected=${integrationKey}`
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[microsoft/callback] Error:', err)
    const url = req.nextUrl.clone()
    url.pathname = redirectBase || '/home'
    url.search = '?integration_error=Something+went+wrong'
    return NextResponse.redirect(url)
  }
}
