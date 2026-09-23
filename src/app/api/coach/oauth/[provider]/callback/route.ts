import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCode, emailFromIdToken, redirectUri, publicOrigin, upsertConnection, capabilitiesFromScopes, sessionCoachId, OAUTH_PROVIDERS, type Provider } from '@/lib/coach/oauth'

// OAuth redirect target. Verifies CSRF state, swaps the code for tokens, stores
// the connection, and bounces the coach back to where they started with a status.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: raw } = await params
  const provider = raw as Provider
  const cookieStore = await cookies()
  const savedState = cookieStore.get(`lumio_oauth_state_${provider}`)?.value
  const ret = cookieStore.get(`lumio_oauth_return_${provider}`)?.value || '/'

  const done = (status: string) => {
    const sep = ret.includes('?') ? '&' : '?'
    // publicOrigin, not req.nextUrl.origin — see publicOrigin() in lib/coach/oauth.
    const res = NextResponse.redirect(new URL(`${ret}${sep}integration=${provider}&status=${status}`, publicOrigin(req.nextUrl.origin)))
    res.cookies.delete(`lumio_oauth_state_${provider}`)
    res.cookies.delete(`lumio_oauth_return_${provider}`)
    return res
  }

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  if (req.nextUrl.searchParams.get('error')) return done('denied')
  if (!OAUTH_PROVIDERS.includes(provider)) return done('unsupported')

  const coachId = await sessionCoachId()
  if (!coachId) return done('signin')
  if (!code || !state || !savedState || state !== savedState) return done('state')

  const tok = await exchangeCode(provider, code, redirectUri(req.nextUrl.origin, provider))
  if (tok.error || !tok.access_token) return done('exchange')

  const expiry = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null
  // What the coach ticked, not what we asked for — Google's consent screen lets
  // them grant the calendar and refuse Gmail, and the portal has to say which.
  const capabilities = capabilitiesFromScopes(provider, tok.scope)

  // A reconnect can come back WITHOUT a refresh token: Google only issues one on
  // the first consent for an account, and returns none on later approvals unless
  // it is forced. Writing null over the good one we already hold would kill the
  // connection at the next refresh, so only overwrite when we were given one.
  const { error } = await upsertConnection(coachId, {
    provider,
    email_address: emailFromIdToken(tok.id_token),
    access_token: tok.access_token,
    ...(tok.refresh_token ? { refresh_token: tok.refresh_token } : {}),
    token_expiry: expiry,
    scopes: tok.scope ?? null,
    capabilities,
    status: 'connected',
  })
  if (error) return done('store_error')
  // Connected, but without the permission the coach came for. Saying so now
  // beats a week of email quietly going out from the Lumio address.
  if (!capabilities.includes('send_email')) return done('partial_no_mail')
  if (!capabilities.includes('calendar')) return done('partial_no_cal')
  return done('connected')
}
