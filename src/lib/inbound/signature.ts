// The signature on a message the Cloudflare Email Worker (workers/inbound-email) posts to
// /api/inbound/email. HMAC-SHA256 with a secret shared by the Worker (a Worker secret) and
// the app (INBOUND_EMAIL_SECRET in .env.production), over:
//
//   <unix seconds>\n<envelope to>\n<envelope from>\n<Authentication-Results>\n<sha256 hex of the raw MIME>
//
// so the envelope and the auth verdict can't be swapped on a genuine body. Five-minute
// window either side. The Worker computes the same thing with Web Crypto.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const SIG_HEADERS = {
  ts: 'x-lumio-timestamp', sig: 'x-lumio-signature', to: 'x-lumio-envelope-to', from: 'x-lumio-envelope-from', auth: 'x-lumio-auth-results',
} as const

export const signedString = (ts: string, to: string, from: string, auth: string, raw: Uint8Array) =>
  [ts, to, from, auth, createHash('sha256').update(raw).digest('hex')].join('\n')

export function signInbound(secret: string, ts: string, to: string, from: string, auth: string, raw: Uint8Array): string {
  return createHmac('sha256', secret).update(signedString(ts, to, from, auth, raw)).digest('hex')
}

export function verifyInbound(secret: string | undefined, headers: Headers, raw: Uint8Array, now = Date.now()): boolean {
  if (!secret) return false
  const ts = headers.get(SIG_HEADERS.ts) ?? '', sig = headers.get(SIG_HEADERS.sig) ?? ''
  const t = Number(ts)
  if (!/^\d{9,11}$/.test(ts) || Math.abs(Math.floor(now / 1000) - t) > 300 || !/^[0-9a-f]{64}$/.test(sig)) return false
  const want = Buffer.from(signInbound(secret, ts, headers.get(SIG_HEADERS.to) ?? '', headers.get(SIG_HEADERS.from) ?? '', headers.get(SIG_HEADERS.auth) ?? '', raw), 'hex')
  const got = Buffer.from(sig, 'hex')
  return want.length === got.length && timingSafeEqual(want, got)
}
