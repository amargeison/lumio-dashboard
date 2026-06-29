// Inbound email addressing for two-way messaging. Outbound coach emails set a
// Reply-To at the Lumio inbound domain carrying an opaque token (coach id +
// conversation key). When the parent replies, the inbound webhook decodes the
// token to thread the reply back to the right coach + conversation.

const DOMAIN = process.env.LUMIO_INBOUND_DOMAIN || 'inbound.lumiosports.com'
const enc = (s: string) => Buffer.from(s, 'utf8').toString('base64url')
const dec = (s: string) => Buffer.from(s, 'base64url').toString('utf8')

// reply+<token>@inbound.lumiosports.com
export function inboundReplyTo(coachId: string, recipientName: string): string {
  return `reply+${enc(`${coachId}|${recipientName || ''}`)}@${DOMAIN}`
}

// Accept a full address or just the local part; pull {coachId, recipientName}.
export function parseInboundToken(addressOrLocal: string): { coachId: string; recipientName: string } | null {
  const m = String(addressOrLocal || '').match(/reply\+([^@\s]+)/i)
  if (!m) return null
  try {
    const [coachId, recipientName = ''] = dec(m[1]).split('|')
    return coachId ? { coachId, recipientName } : null
  } catch { return null }
}
