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
//
// THE PART BEFORE THE @ MUST BE 64 CHARACTERS OR FEWER. That is the limit in the
// email standard, and the sending service enforces it: an address that breaks
// it is refused outright ("Invalid `reply_to` field") and the message is not
// sent at all. The first version packed the ids in as text (a 36-character id,
// a bar, then a name or a second id) and came out at 77 to 134 characters, so on
// the live site every message a coach emailed through Lumio's own address was
// refused.
//
// So the ids are packed as raw bytes: one type byte, the academy's id (16
// bytes) and either the player's id (16 bytes) or a short conversation name.
// With a 12-character signature the whole thing is 63 characters for a player.
// A conversation name too long to fit gets NO reply address rather than a
// broken one — the email still goes, and a reply simply cannot be threaded.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const idBytes = (u: string) => Buffer.from(u.replace(/-/g, ''), 'hex')
const idText = (b: Buffer) => { const h = b.toString('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` }
const signShort = (b: string) => crypto.createHmac('sha256', secret()).update('v2:' + b).digest('base64url').slice(0, 12)
const LOCAL_MAX = 64

export function inboundReplyTo(coachId: string, recipientName: string): string | null {
  if (!UUID.test(coachId)) return null
  const player = /^player:(.+)$/i.exec(recipientName || '')
  let payload: Buffer
  if (player && UUID.test(player[1])) payload = Buffer.concat([Buffer.from([1]), idBytes(coachId), idBytes(player[1])])
  else payload = Buffer.concat([Buffer.from([2]), idBytes(coachId), Buffer.from(recipientName || '', 'utf8')])
  const b = payload.toString('base64url')
  const local = `reply+${b}.${signShort(b)}`
  if (local.length > LOCAL_MAX) return null
  return `${local}@${DOMAIN}`
}

// Accept a full address or just the local part; verify the signature, then pull
// {coachId, recipientName}. Returns null if the token is missing, malformed, or
// its signature doesn't verify (→ the webhook ignores it).
export function parseInboundToken(addressOrLocal: string): { coachId: string; recipientName: string } | null {
  const m = String(addressOrLocal || '').match(/reply\+([^@\s.]+)\.([^@\s.]+)/i)
  if (!m) return null
  const [, b, sig] = m
  // The short form (see inboundReplyTo). Told apart from the first form by the
  // length of its signature; each is checked against its own.
  if (sig.length === 12) {
    const want = signShort(b)
    try { if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null } catch { return null }
    try {
      const raw = Buffer.from(b, 'base64url')
      if (raw.length < 17) return null
      const coachId = idText(raw.subarray(1, 17))
      if (raw[0] === 1 && raw.length === 33) return { coachId, recipientName: `player:${idText(raw.subarray(17, 33))}` }
      if (raw[0] === 2) return { coachId, recipientName: raw.subarray(17).toString('utf8') }
      return null
    } catch { return null }
  }
  const expected = sign(b)
  try {
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch { return null }
  try {
    const [coachId, recipientName = ''] = dec(b).split('|')
    return coachId ? { coachId, recipientName } : null
  } catch { return null }
}
