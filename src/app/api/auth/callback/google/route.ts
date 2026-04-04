import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const REDIRECT_URI = 'https://lumiocms.com/api/auth/callback/google'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const error = searchParams.get('error')

  let key = 'gcal', slug = ''
  try { const p = JSON.parse(stateRaw || '{}'); key = p.key || 'gcal'; slug = p.slug || '' } catch {}
  const redirectBase = slug ? `/${slug}` : ''

  if (error || !code) {
    const url = req.nextUrl.clone(); url.pathname = redirectBase || '/home'; url.search = `?integration_error=${encodeURIComponent(error || 'No code')}`
    return NextResponse.redirect(url)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    const url = req.nextUrl.clone(); url.pathname = redirectBase || '/home'; url.search = '?integration_error=Google+OAuth+not+configured'
    return NextResponse.redirect(url)
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code' }),
    })
    if (!tokenRes.ok) { console.error('[google/callback]', tokenRes.status, await tokenRes.text()); const url = req.nextUrl.clone(); url.pathname = redirectBase || '/home'; url.search = '?integration_error=Token+exchange+failed'; return NextResponse.redirect(url) }

    const tokens = await tokenRes.json()
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } })
    const profile = profileRes.ok ? await profileRes.json() : {}

    const supabase = getSupabase()
    const { data: business } = await supabase.from('businesses').select('id').eq('slug', slug).maybeSingle()
    if (business) {
      await supabase.from('integration_tokens').upsert({
        business_id: business.id, provider: `google_${key}`, access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null, expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        profile_email: profile.email || null, profile_name: profile.name || null, updated_at: new Date().toISOString(),
      }, { onConflict: 'business_id,provider' })
    }

    const url = req.nextUrl.clone(); url.pathname = redirectBase || '/home'; url.search = `?integration_connected=${key}`
    return NextResponse.redirect(url)
  } catch (err) { console.error('[google/callback]', err); const url = req.nextUrl.clone(); url.pathname = redirectBase || '/home'; url.search = '?integration_error=Something+went+wrong'; return NextResponse.redirect(url) }
}
