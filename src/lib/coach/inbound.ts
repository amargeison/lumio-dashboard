// Inbound email addressing for two-way messaging. Outbound coach emails set a
// Reply-To at the Lumio inbound domain carrying a SIGNED token (coach id +
// conversation key). When the parent replies, the inbound webhook verifies the
// signature and decodes the token to thread the reply to the right coach.
//
// SECURITY: the token is HMAC-signed so a sender can't forge another coach's id.
// Without the signature, anyone could email reply+<forged-coachId>@… and inject a
// message into an arbitrary coach's inbox (cross-tenant). The webhook rejects any
// token whose signature doesn't verify.

import crypto from 'crypto'

const DOMAIN = process.env.LUMIO_INBOUND_DOMAIN || 'inbound.lumiosports.com'
const enc = (s: string) => Buffer.from(s, 'utf8').toString('base64url')
const dec = (s: string) => Buffer.from(s, 'base64url').toString('utf8')
// Server-side secret for the token HMAC. Falls back to the service-role key (also
// server-only, high entropy) so signing works without extra config.
const secret = () => process.env.LUMIO_INBOUND_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const sign = (b: string) => crypto.createHmac('sha256', secret()).update(b).digest('base64url').slice(0, 20)

// reply+<payload>.<sig>@inbound.lumiosports.com
export function inboundReplyTo(coachId: string, recipientName: string): string {
  const b = enc(`${coachId}|${recipientName || ''}`)
  return `reply+${b}.${sign(b)}@${DOMAIN}`
}

// Accept a full address or just the local part; verify the signature, then pull
// {coachId, recipientName}. Returns null if the token is missing, malformed, or
// its signature doesn't verify (→ the webhook ignores it).
export function parseInboundToken(addressOrLocal: string): { coachId: string; recipientName: string } | null {
  const m = String(addressOrLocal || '').match(/reply\+([^@\s.]+)\.([^@\s.]+)/i)
  if (!m) return null
  const [, b, sig] = m
  const expected = sign(b)
  try {
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch { return null }
  try {
    const [coachId, recipientName = ''] = dec(b).split('|')
    return coachId ? { coachId, recipientName } : null
  } catch { return null }
}
