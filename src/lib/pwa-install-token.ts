// ─── PWA INSTALL TOKEN ────────────────────────────────────────────────────
// Stateless, HMAC-signed token embedded in a per-sport PWA manifest's
// start_url when the Safari session is authenticated. First open of the
// installed PWA redeems the token (via a magic-link) to mint a fresh
// session inside the PWA's cookie jar — zero OTP for the user.
//
// Tokens are short-lived (5 min) and single-use. Single use is enforced by
// the redeem route (/api/pwa/consume-token), not here: it refuses a token
// whose owner has signed in since the token was issued — and redeeming a
// token IS a sign-in, so the first use kills it — and it also remembers the
// tokens this server process has already redeemed. That is why the token
// carries `iat` and `jti`.
//
// The token is readable by anyone who sees the URL (it is signed, not
// encrypted), so it carries no more identity than the redeem route needs:
// the user id, and no email address. The route looks the email up itself.
//
// Storage: none. No new table, no Redis. The HMAC secret lives in the
// service-role key (fallback to a dedicated PWA_INSTALL_SECRET env if
// the operator prefers to separate concerns).

import crypto from 'node:crypto'

export type InstallTokenPayload = {
  sub:  string           // user_id
  // 'coach' is the Tennis Coach portal, which lives at /tennis/coach/<slug>
  // rather than /<sport>/<slug> — see installTokenPath below.
  sport: 'tennis' | 'golf' | 'darts' | 'boxing' | 'coach'
  slug:  string
  iat:   number          // unix seconds, when it was issued (replay defence)
  exp:   number          // unix seconds
  jti:   string          // random nonce (replay defence)
}

// The one page a token may open. Everything that checks "is this token for
// this portal" must compare against this, exactly.
export function installTokenPath(p: Pick<InstallTokenPayload, 'sport' | 'slug'>): string {
  return p.sport === 'coach' ? `/tennis/coach/${p.slug}` : `/${p.sport}/${p.slug}`
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

// Callers still pass `eml` (the portals' layouts and the sign-in route do); it
// is accepted and deliberately NOT written into the token.
export function signInstallToken(
  input: Omit<InstallTokenPayload, 'iat' | 'exp' | 'jti'> & { eml?: string },
): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: InstallTokenPayload = {
    sub:   input.sub,
    sport: input.sport,
    slug:  input.slug,
    iat:   now,
    exp:   now + TOKEN_TTL_SECONDS,
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
  if (!payload.sub || !payload.sport || !payload.slug || !payload.exp || !payload.iat || !payload.jti) return null
  if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') return null
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}
