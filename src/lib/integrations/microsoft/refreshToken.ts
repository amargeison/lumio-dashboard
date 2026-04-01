import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * Ensures the Microsoft access token is fresh. If it's within 5 minutes of
 * expiry (or already expired), uses the refresh_token to get a new one.
 *
 * Returns the valid access_token, or null if refresh failed (meaning the
 * user needs to re-authenticate).
 */
export async function ensureFreshMicrosoftToken(
  businessId: string,
  providerVariants: string[],
): Promise<{ access_token: string; refreshed: boolean } | null> {
  const supabase = getSupabase()

  const { data: tokenRow } = await supabase
    .from('integration_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('business_id', businessId)
    .in('provider', providerVariants)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!tokenRow?.access_token) return null

  // Check if token is still valid (with 5-minute buffer)
  const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() : 0
  const fiveMinFromNow = Date.now() + 5 * 60 * 1000

  if (expiresAt > fiveMinFromNow) {
    // Token is still fresh
    return { access_token: tokenRow.access_token, refreshed: false }
  }

  // Token is expired or about to expire — attempt refresh
  if (!tokenRow.refresh_token) {
    console.warn('[microsoft/refresh] No refresh_token available for', providerVariants)
    return null
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[microsoft/refresh] Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET')
    return null
  }

  try {
    console.log('[microsoft/refresh] Refreshing token for providers:', providerVariants)

    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenRow.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[microsoft/refresh] Refresh failed:', res.status, errBody)
      // Mark as expired so UI shows reconnection needed
      await supabase
        .from('integration_tokens')
        .update({ expires_at: new Date(0).toISOString() })
        .eq('business_id', businessId)
        .in('provider', providerVariants)
      return null
    }

    const tokens = await res.json()
    const newAccessToken = tokens.access_token
    const newRefreshToken = tokens.refresh_token || tokenRow.refresh_token // Microsoft may or may not return a new refresh token
    const expiresIn = tokens.expires_in || 3600

    // Update the stored tokens
    await supabase
      .from('integration_tokens')
      .update({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)
      .in('provider', providerVariants)

    console.log('[microsoft/refresh] Token refreshed successfully, expires in', expiresIn, 'seconds')

    return { access_token: newAccessToken, refreshed: true }
  } catch (err) {
    console.error('[microsoft/refresh] Error during refresh:', err)
    return null
  }
}
