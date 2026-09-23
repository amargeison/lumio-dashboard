// Server-only helpers for the Tennis Coach email & calendar integrations.
// Provider config + token storage. Never import this from a client component —
// it reads the service-role key and OAuth secrets.

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publicSiteOrigin } from '@/lib/public-origin'

export type Provider = 'google' | 'microsoft' | 'icloud'

// The signed-in coach's id from their Supabase session cookie, or null.
export async function sessionCoachId(): Promise<string | null> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
export const OAUTH_PROVIDERS: Provider[] = ['google', 'microsoft']

type ProviderConfig = {
  authUrl: string
  tokenUrl: string
  scopes: string
  clientId?: string
  clientSecret?: string
  extraAuthParams?: Record<string, string>
}

export function providerConfig(provider: Provider): ProviderConfig | null {
  if (provider === 'google') {
    return {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      // Calendar read/write (we currently only write bookings out — importing
      // events into Lumio isn't built) + send-as. Inbox read (gmail.readonly) is
      // deliberately NOT requested yet — a Google "restricted" scope needing CASA review.
      scopes: [
        'openid', 'email', 'profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.send',
      ].join(' '),
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      extraAuthParams: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
    }
  }
  if (provider === 'microsoft') {
    const tenant = process.env.MICROSOFT_OAUTH_TENANT || 'common'
    return {
      authUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      scopes: ['openid', 'email', 'profile', 'offline_access', 'Calendars.ReadWrite', 'Mail.Send', 'User.Read'].join(' '),
      // Defaults to the dedicated "Lumio Tennis Coach" Azure app registration.
      // The client secret must still be supplied via env (secrets never live in code).
      clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID || '60f7ad0b-978c-4bde-9ae5-36b88f7134a8',
      clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET,
      // Without this, Microsoft silently reuses whichever account the browser is
      // already signed into — so a coach with a personal Outlook and a club
      // account connects the wrong one and only finds out when a parent replies
      // to an address nobody reads.
      extraAuthParams: { prompt: 'select_account' },
    }
  }
  return null // iCloud is not OAuth — see the iCloud connect route
}

// Which providers are switched on, and whether their credentials exist.
//
// COACH_OAUTH_LIVE is a switch per provider, not one switch for both:
//
//   COACH_OAUTH_LIVE=google              → Gmail live, Outlook still parked
//   COACH_OAUTH_LIVE=google,microsoft    → both
//   COACH_OAUTH_LIVE=true                → both (the old spelling still works)
//   unset / anything else                → neither
//
// It is a switch rather than "credentials present" because the credentials have
// been in the environment all along, and the thing that decides whether a coach
// should see a Connect button is the state of the app in Google's / Microsoft's
// console — which no code here can detect. Google in "Testing" publishing status
// kills every refresh token after 7 days; an app in Production shows one
// unverified-app screen and then stays connected. Flipping this variable is the
// deploy step that follows the console change, so the two never disagree.
//
// iCloud is unaffected — it is not OAuth and never passes through here.
export function providerLive(provider: Provider): boolean {
  const raw = (process.env.COACH_OAUTH_LIVE || '').trim().toLowerCase()
  if (!raw) return false
  if (raw === 'true' || raw === 'all') return true
  return raw.split(/[,\s]+/).filter(Boolean).includes(provider)
}

export function providerConfigured(provider: Provider): boolean {
  if (!providerLive(provider)) return false
  const c = providerConfig(provider)
  return !!(c && c.clientId && c.clientSecret)
}

// What the coach actually granted, read from the token response's scope string.
//
// Google's consent screen lets a coach untick individual permissions — calendar
// yes, Gmail no — and still return a perfectly valid token. Assuming both were
// granted meant the portal promised "sends from your address", then quietly fell
// back to the Lumio sender with nothing on screen to explain it.
//
// An empty scope string means the provider did not tell us (Microsoft omits it
// on some tenants), so assume the full set rather than crippling a good
// connection: the first real send will correct the record via markReauth.
export function capabilitiesFromScopes(provider: Provider, scope?: string | null): string[] {
  const s = (scope || '').toLowerCase()
  if (!s) return ['calendar', 'send_email']
  const caps: string[] = []
  if (provider === 'google') {
    if (s.includes('auth/calendar')) caps.push('calendar')
    if (s.includes('gmail.send')) caps.push('send_email')
    if (s.includes('gmail.readonly') || s.includes('gmail.modify')) caps.push('read_inbox')
  } else {
    if (s.includes('calendars.readwrite') || s.includes('calendars.read')) caps.push('calendar')
    if (s.includes('mail.send')) caps.push('send_email')
    if (s.includes('mail.read')) caps.push('read_inbox')
  }
  return caps
}

// The canonical PUBLIC origin for coach-facing redirects.
//
// In production Next runs in standalone mode behind nginx, so `req.nextUrl.origin`
// resolves from the Host header the Node process actually receives — which is the
// internal bind address, http://0.0.0.0:3000, not the public domain. Redirecting a
// coach there drops them on ERR_CONNECTION_REFUSED, and it does so on the SUCCESS
// path too: a Google account that connected perfectly still looked broken because
// the final bounce went to a dead URL.
//
// OAuth redirects use the same public origin as every other outbound link, so
// this is now one helper rather than two near-identical ones.
//
// It used to read OAUTH_REDIRECT_BASE and nothing else. That made the .env
// documentation a trap: follow its advice — set PUBLIC_SITE_URL, drop
// OAUTH_REDIRECT_BASE — and Stripe links keep working while OAuth silently falls
// back to the request origin, reinstating the 0.0.0.0:3000 bug on the very path
// it was first found on. Delegating means both read the same two variables in
// the same order, and the shared helper also logs loudly before it ever emits an
// internal origin in production.
//
// NOTE for local dev: with the public base pointing at production, an OAuth
// round-trip started locally comes back to production — different origin, so the
// CSRF-state cookie and the coach's session are both missing and the callback
// correctly answers `status=signin`. To run the flow locally, unset both
// PUBLIC_SITE_URL and OAUTH_REDIRECT_BASE and register the loopback callback
// with the provider.
export const publicOrigin = publicSiteOrigin

export function redirectUri(origin: string, provider: Provider): string {
  return `${publicOrigin(origin)}/api/coach/oauth/${provider}/callback`
}

export function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

export type SafeConnection = {
  provider: Provider
  email_address: string | null
  capabilities: string[]
  status: string
  last_synced: string | null
  updated_at: string
}

// Non-secret fields only — safe to return to the browser.
export async function listConnections(coachId: string): Promise<SafeConnection[]> {
  const { data } = await serviceClient()
    .from('coach_oauth_connections')
    .select('provider, email_address, capabilities, status, last_synced, updated_at')
    .eq('coach_id', coachId)
  return (data ?? []) as SafeConnection[]
}

export async function upsertConnection(coachId: string, row: Record<string, unknown>) {
  return serviceClient()
    .from('coach_oauth_connections')
    .upsert({ coach_id: coachId, ...row, updated_at: new Date().toISOString() }, { onConflict: 'coach_id,provider' })
}

export async function deleteConnection(coachId: string, provider: Provider) {
  return serviceClient().from('coach_oauth_connections').delete().eq('coach_id', coachId).eq('provider', provider)
}

// Full connection row including secrets — server-side use only (calendar sync etc.).
export type FullConnection = {
  provider: Provider
  email_address: string | null
  access_token: string | null
  refresh_token: string | null
  token_expiry: string | null
  app_password: string | null
  caldav_url: string | null
  capabilities: string[]
  status: string
}
export async function getConnection(coachId: string, provider: Provider): Promise<FullConnection | null> {
  const { data } = await serviceClient()
    .from('coach_oauth_connections').select('*')
    .eq('coach_id', coachId).eq('provider', provider).maybeSingle()
  return (data as FullConnection | null) ?? null
}

// Flag a connection the coach has to reconnect by hand.
//
// Three things land here: a refresh token Google expired (its 7-day life while
// the app sits in "Testing"), one the coach revoked from their Google account,
// and a mailbox/calendar call that came back 401. The portal shows a Reconnect
// button off the back of this, which is the whole point — before it existed a
// dead connection looked identical to a working one and emails simply arrived
// from the wrong address.
//
// The access token is cleared at the same time so nothing keeps retrying with a
// credential that is known to be dead.
export async function markReauth(coachId: string, provider: Provider): Promise<void> {
  await serviceClient()
    .from('coach_oauth_connections')
    .update({ status: 'reauth', access_token: null, updated_at: new Date().toISOString() })
    .eq('coach_id', coachId).eq('provider', provider)
}

// A valid access token for google/microsoft, refreshed via the refresh_token when the
// stored one is within 60s of expiry. Returns null when the coach hasn't connected,
// or when the connection is dead and needs reconnecting (flagged as it goes).
export async function getFreshAccessToken(coachId: string, provider: Provider): Promise<string | null> {
  const conn = await getConnection(coachId, provider)
  if (!conn?.access_token) return null
  const expMs = conn.token_expiry ? new Date(conn.token_expiry).getTime() : 0
  if (expMs - Date.now() > 60_000) return conn.access_token

  const cfg = providerConfig(provider)
  if (!conn.refresh_token || !cfg?.clientId || !cfg.clientSecret) {
    // Nothing to refresh with. Handing back a token we know has expired only
    // buys a 401 somewhere further down, reported as a mystery send failure.
    if (expMs && expMs < Date.now()) { await markReauth(coachId, provider); return null }
    return conn.access_token
  }

  const body = new URLSearchParams({
    client_id: cfg.clientId, client_secret: cfg.clientSecret,
    refresh_token: conn.refresh_token, grant_type: 'refresh_token',
    // Google infers the scopes from the refresh token; Microsoft's personal-account
    // endpoint wants them restated, and rejects the refresh without them.
    ...(provider === 'microsoft' ? { scope: cfg.scopes } : {}),
  })
  const res = await fetch(cfg.tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.access_token) {
    // invalid_grant is the one that matters: the refresh token is gone for good.
    if (json?.error === 'invalid_grant' || res.status === 400 || res.status === 401) {
      await markReauth(coachId, provider)
      return null
    }
    return null   // a transient provider error — try again next time, don't flag
  }
  await upsertConnection(coachId, {
    provider,
    access_token: json.access_token,
    token_expiry: json.expires_in ? new Date(Date.now() + json.expires_in * 1000).toISOString() : null,
    ...(json.refresh_token ? { refresh_token: json.refresh_token } : {}),
    // A successful refresh clears any earlier Reconnect flag.
    status: 'connected',
  })
  return json.access_token
}

// Exchange an authorization code for tokens (google / microsoft).
export async function exchangeCode(provider: Provider, code: string, redirect: string): Promise<{
  access_token?: string; refresh_token?: string; expires_in?: number; id_token?: string; scope?: string; error?: string
}> {
  const cfg = providerConfig(provider)
  if (!cfg?.clientId || !cfg.clientSecret) return { error: 'not_configured' }
  const body = new URLSearchParams({
    code, client_id: cfg.clientId, client_secret: cfg.clientSecret,
    redirect_uri: redirect, grant_type: 'authorization_code',
  })
  const res = await fetch(cfg.tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { error: json.error_description || json.error || `token_error_${res.status}` }
  return json
}

// Pull the account email out of an OpenID id_token without verifying the
// signature (it came straight from the provider's token endpoint over TLS).
export function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null
  try {
    const payload = idToken.split('.')[1]
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'))
    return json.email || json.preferred_username || json.upn || null
  } catch { return null }
}
