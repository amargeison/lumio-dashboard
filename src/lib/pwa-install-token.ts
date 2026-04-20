// ─── PWA INSTALL TOKEN ────────────────────────────────────────────────────
// Stateless, HMAC-signed token embedded in a per-sport PWA manifest's
// start_url when the Safari session is authenticated. First open of the
// installed PWA redeems the token (via a magic-link) to mint a fresh
// session inside the PWA's cookie jar — zero OTP for the user.
//
// Tokens are short-lived (5 min) and single-use in practice: on
// redemption we generate a fresh Supabase magic-link which can only be
// consumed once by Supabase's own /verify endpoint. After that the JWT
// payload is still verifiable but has no effect — the redeem route
// short-circuits cleanly when the session already exists.
//
// Storage: none. No new table, no Redis. The HMAC secret lives in the
// service-role key (fallback to a dedicated PWA_INSTALL_SECRET env if
// the operator prefers to separate concerns).

import crypto from 'node:crypto'

export type InstallTokenPayload = {
  sub:  string           // user_id
  eml:  string           // email (needed for generateLink magiclink)
  sport: 'tennis' | 'golf' | 'darts' | 'boxing'
  slug:  string
  exp:   number          // unix seconds
  jti:   string          // random nonce (future: replay defence via a consumed-set)
}

const TOKEN_TTL_SECONDS = 5 * 60

function secret(): string {
  const s = process.env.PWA_INSTALL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('PWA_INSTALL_SECRET (or SUPABASE_SERVICE_ROLE_KEY fallback) must be set')
  return s
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  return Buffer.from(b64, 'base64')
}

export function signInstallToken(
  input: Omit<InstallTokenPayload, 'exp' | 'jti'>,
): string {
  const payload: InstallTokenPayload = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    jti: crypto.randomBytes(12).toString('hex'),
  }
  const body = b64url(JSON.stringify(payload))
  const sig = b64url(crypto.createHmac('sha256', secret()).update(body).digest())
  return `${body}.${sig}`
}

export function verifyInstallToken(token: string): InstallTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = b64url(crypto.createHmac('sha256', secret()).update(body).digest())
  if (expected.length !== sig.length) return null
  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null
  } catch {
    return null
  }
  let payload: InstallTokenPayload
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8')) as InstallTokenPayload
  } catch {
    return null
  }
  if (!payload.sub || !payload.eml || !payload.sport || !payload.slug || !payload.exp) return null
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}
