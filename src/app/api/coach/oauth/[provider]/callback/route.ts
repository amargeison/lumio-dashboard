import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCode, emailFromIdToken, redirectUri, upsertConnection, sessionCoachId, OAUTH_PROVIDERS, type Provider } from '@/lib/coach/oauth'

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
    const res = NextResponse.redirect(new URL(`${ret}${sep}integration=${provider}&status=${status}`, req.nextUrl.origin))
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
  const { error } = await upsertConnection(coachId, {
    provider,
    email_address: emailFromIdToken(tok.id_token),
    access_token: tok.access_token,
    refresh_token: tok.refresh_token ?? null,
    token_expiry: expiry,
    scopes: tok.scope ?? null,
    capabilities: ['calendar', 'send_email'],
    status: 'connected',
  })
  return done(error ? 'store_error' : 'connected')
}
