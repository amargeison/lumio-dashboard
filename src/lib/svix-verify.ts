// Verifies a Svix-signed webhook (Resend's scheme) against the raw request body:
// svix-id / svix-timestamp / svix-signature, a five-minute replay window, constant-time
// comparison. The same check as /api/coach/inbound-email.

import crypto from 'node:crypto'

export function verifySvix(rawBody: string, headers: Headers, secret: string, now = Date.now()): boolean {
  try {
    const id = headers.get('svix-id'), ts = headers.get('svix-timestamp'), sigHeader = headers.get('svix-signature')
    if (!id || !ts || !sigHeader || !secret) return false
    const t = parseInt(ts, 10)
    if (!t || Math.abs(Math.floor(now / 1000) - t) > 300) return false
    const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
    const expected = Buffer.from(crypto.createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest('base64'))
    return sigHeader.split(' ').some(part => {
      const sig = Buffer.from(part.split(',')[1] || part)
      return sig.length === expected.length && crypto.timingSafeEqual(sig, expected)
    })
  } catch { return false }
}

/** Signs a body the way Svix does — for tests. */
export function svixSign(rawBody: string, secret: string, id: string, ts: number): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  return `v1,${crypto.createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest('base64')}`
}
