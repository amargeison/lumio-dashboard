import { NextRequest, NextResponse } from 'next/server'
import { providerConfig, providerConfigured, redirectUri, sessionCoachId, OAUTH_PROVIDERS, type Provider } from '@/lib/coach/oauth'

// Kicks off the OAuth consent flow for Google / Microsoft. The coach hits this
// from Settings → Connected accounts; we stash a CSRF state + return path in
// short-lived cookies and redirect to the provider. iCloud is not OAuth — it
// uses /api/coach/integrations/icloud instead.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: raw } = await params
  const provider = raw as Provider
  const ret = req.nextUrl.searchParams.get('return') || '/'
  const back = (status: string) => {
    const sep = ret.includes('?') ? '&' : '?'
    return NextResponse.redirect(new URL(`${ret}${sep}integration=${provider}&status=${status}`, req.nextUrl.origin))
  }

  const coachId = await sessionCoachId()
  if (!coachId) return back('signin')
  if (!OAUTH_PROVIDERS.includes(provider)) return back('unsupported')
  if (!providerConfigured(provider)) return back('not_configured')

  const cfg = providerConfig(provider)!
  const state = crypto.randomUUID()
  const authUrl = new URL(cfg.authUrl)
  authUrl.searchParams.set('client_id', cfg.clientId!)
  authUrl.searchParams.set('redirect_uri', redirectUri(req.nextUrl.origin, provider))
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', cfg.scopes)
  authUrl.searchParams.set('state', state)
  for (const [k, v] of Object.entries(cfg.extraAuthParams ?? {})) authUrl.searchParams.set(k, v)

  const res = NextResponse.redirect(authUrl.toString())
  const opts = { httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge: 600, path: '/' }
  res.cookies.set(`lumio_oauth_state_${provider}`, state, opts)
  res.cookies.set(`lumio_oauth_return_${provider}`, ret, opts)
  return res
}
