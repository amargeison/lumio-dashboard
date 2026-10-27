// Sign-in for the native iPhone app (server only).
//
// The website keeps its session in a cookie. The Swift app keeps the same
// Supabase session in the iPhone's Keychain instead and sends the access token
// as `Authorization: Bearer …` (see the bridge in middleware.ts). These helpers
// turn a freshly minted cookie session into the tokens the app stores, and
// sign short-lived links that open a web page inside the app already signed in.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export type NativeSession = {
  accessToken: string
  refreshToken: string
  /** Seconds since 1970 when the access token stops working. */
  expiresAt: number
  user: { id: string; email: string | null }
}

type RawSession = {
  access_token?: string; refresh_token?: string; expires_at?: number; expires_in?: number
  user?: { id?: string; email?: string | null }
}

/** The Supabase auth cookie's name for this project: sb-<project ref>-auth-token. */
export function authCookieName(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''): string {
  let ref = 'local'
  try { ref = new URL(supabaseUrl).hostname.split('.')[0] } catch { /* keep default */ }
  return `sb-${ref}-auth-token`
}

const fromBase64Url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')

/**
 * The session inside the auth cookie(s) a response set. The cookie may be split
 * into numbered chunks (name.0, name.1 …) and is usually "base64-" encoded.
 */
export function sessionFromCookies(cookies: { name: string; value: string }[], name = authCookieName()): NativeSession | null {
  const whole = cookies.find(c => c.name === name)?.value
  const chunks = cookies.filter(c => c.name.startsWith(`${name}.`))
    .sort((a, b) => Number(a.name.slice(name.length + 1)) - Number(b.name.slice(name.length + 1)))
    .map(c => c.value).join('')
  let raw = whole || chunks
  if (!raw) return null
  try {
    if (raw.startsWith('base64-')) raw = fromBase64Url(raw.slice(7))
    return toNative(JSON.parse(raw) as RawSession)
  } catch { return null }
}

export function toNative(s: RawSession | null | undefined): NativeSession | null {
  if (!s?.access_token || !s.refresh_token || !s.user?.id) return null
  const expiresAt = Number(s.expires_at) || Math.floor(Date.now() / 1000) + (Number(s.expires_in) || 3600)
  return { accessToken: s.access_token, refreshToken: s.refresh_token, expiresAt, user: { id: s.user.id, email: s.user.email ?? null } }
}

// ── Opening a web page inside the app, already signed in ──────────────────
// A link that lasts one minute and works once: it names the account and the
// page, signed with the server's own secret, so it cannot be made up or pointed
// at another account or another site.

export type WebTicket = { sub: string; path: string; exp: number; jti: string }

function ticketSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PWA_INSTALL_SECRET
  if (!s) throw new Error('No secret for app web tickets')
  return createHmac('sha256', s).update('lumio-app-web-ticket-v1').digest('hex')
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url')

/** A path on this site and nothing else. */
export function safeSitePath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 300) return null
  if (!raw.startsWith('/') || raw.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(raw)) return null
  try { return new URL(raw, 'https://www.lumiosports.com').host === 'www.lumiosports.com' ? raw : null } catch { return null }
}

export function signWebTicket(sub: string, path: string, now = Date.now()): string {
  const body: WebTicket = { sub, path, exp: Math.floor(now / 1000) + 60, jti: randomBytes(12).toString('base64url') }
  const data = b64url(JSON.stringify(body))
  const sig = createHmac('sha256', ticketSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyWebTicket(ticket: string, now = Date.now()): WebTicket | null {
  const [data, sig] = String(ticket || '').split('.')
  if (!data || !sig) return null
  const want = createHmac('sha256', ticketSecret()).update(data).digest()
  let got: Buffer
  try { got = Buffer.from(sig, 'base64url') } catch { return null }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null
  try {
    const t = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as WebTicket
    if (!t?.sub || !t.jti || !safeSitePath(t.path) || !(t.exp > Math.floor(now / 1000))) return null
    return t
  } catch { return null }
}
