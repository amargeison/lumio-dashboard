import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const error = searchParams.get('error')

  let slug = ''
  try { slug = JSON.parse(stateRaw || '{}').slug || '' } catch { /* ignore */ }
  const redirectBase = slug ? `/${slug}` : '/home'

  if (error) {
    console.error('[slack/callback] OAuth error:', error)
    const url = req.nextUrl.clone()
    url.pathname = redirectBase
    url.search = '?integration_error=Slack+connection+failed'
    return NextResponse.redirect(url)
  }

  if (!code) {
    const url = req.nextUrl.clone()
    url.pathname = redirectBase
    url.search = '?integration_error=No+authorization+code+received'
    return NextResponse.redirect(url)
  }

  const clientId = process.env.SLACK_CLIENT_ID || process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[slack/callback] Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET')
    const url = req.nextUrl.clone()
    url.pathname = redirectBase
    url.search = '?integration_error=Slack+OAuth+not+configured'
    return NextResponse.redirect(url)
  }

  try {
    // Exchange code for tokens
    console.log('[slack/callback] Exchanging code for tokens...')
    const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: 'https://lumiocms.com/api/auth/callback/slack',
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.ok) {
      console.error('[slack/callback] Token exchange failed:', tokenData.error)
      const url = req.nextUrl.clone()
      url.pathname = redirectBase
      url.search = `?integration_error=${encodeURIComponent(`Slack error: ${tokenData.error}`)}`
      return NextResponse.redirect(url)
    }

    const accessToken = tokenData.access_token
    const teamId = tokenData.team?.id || ''
    const teamName = tokenData.team?.name || ''
    const userId = tokenData.authed_user?.id || ''
    const userToken = tokenData.authed_user?.access_token || null

    // Get user profile
    let profileEmail = ''
    let profileName = ''
    if (userToken || accessToken) {
      try {
        const profileRes = await fetch('https://slack.com/api/users.identity', {
          headers: { Authorization: `Bearer ${userToken || accessToken}` },
        })
        const profile = await profileRes.json()
        if (profile.ok) {
          profileEmail = profile.user?.email || ''
          profileName = profile.user?.name || ''
        }
      } catch { /* profile fetch is non-critical */ }
    }

    console.log('[slack/callback] Connected:', { teamName, userId, profileEmail })

    // Store tokens in Supabase
    const supabase = getSupabase()
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (business) {
      const { error: upsertError } = await supabase.from('integration_tokens').upsert({
        business_id: business.id,
        provider: 'slack',
        access_token: accessToken,
        refresh_token: userToken || null,
        profile_email: profileEmail || null,
        profile_name: `${teamName} (${teamId})`,
        expires_at: null, // Slack tokens don't expire
        updated_at: new Date().toISOString(),
      }, { onConflict: 'business_id,provider' })

      if (upsertError) {
        console.error('[slack/callback] DB upsert failed:', upsertError)
      }
    } else {
      console.warn('[slack/callback] No business found for slug:', slug)
    }

    const url = req.nextUrl.clone()
    url.pathname = redirectBase
    url.search = '?integration_connected=slack'
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[slack/callback] Unhandled error:', err)
    const url = req.nextUrl.clone()
    url.pathname = redirectBase
    url.search = `?integration_error=${encodeURIComponent(err instanceof Error ? err.message : 'Slack connection failed')}`
    return NextResponse.redirect(url)
  }
}
