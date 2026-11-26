// One inbound email, as both reply handlers (Lumio Impact and Lumio Coach) take it —
// whichever way it arrived: the Cloudflare Email Worker (/api/inbound/email, raw MIME) or
// a Resend inbound webhook. Pure helpers, no I/O.

export interface InboundMessage {
  /** Every address it was sent to: the envelope recipient first, then To / Cc. Case kept: Coach's tokens are case-sensitive. */
  recipients: string[]
  /** The sender's address (lower case), or null. */
  from: string | null
  /** The sender's display name, or the part before the @. */
  fromName: string
  subject: string | null
  /** The plain-text body as sent (handlers cut the quoted earlier message themselves). */
  text: string
  /** Attachment file names: never stored, only listed as "not shown". */
  attachments: string[]
  /** Message-ID, for de-duplication. */
  messageId: string | null
  /** SPF/DKIM/DMARC said the sender is genuine (true), failed or weren't checked (false), or unknown (null, e.g. Resend). */
  verified: boolean | null
}

export const NOT_VERIFIED = 'Sender not verified (SPF/DKIM didn’t pass)'

/**
 * Reads Cloudflare's Authentication-Results header (authserv-id mx.cloudflare.net — any
 * other is the sender's own and not trusted). Verified when DMARC passed, or (no DMARC
 * result) SPF or DKIM passed. A DMARC fail, nothing passing, or no Cloudflare header is
 * not verified: a message we can't check is flagged, not trusted.
 */
export function authVerdict(header: string | null | undefined): boolean {
  const h = String(header ?? '').toLowerCase().trim()
  if (!/^mx\.cloudflare\.net\s*;/.test(h)) return false
  const result = (k: string) => (h.match(new RegExp(`\\b${k}=([a-z]+)`))?.[1] ?? null)
  const dmarc = result('dmarc'), spf = result('spf'), dkim = result('dkim')
  if (dmarc === 'fail') return false
  if (dmarc === 'pass') return true
  return spf === 'pass' || dkim === 'pass'
}

/** The body as filed: the text, then one line per attachment that isn't shown. */
export function withAttachmentNotes(text: string, attachments: string[]): string {
  const notes = attachments.map(n => `[Attachment not shown: ${n.replace(/[\r\n]+/g, ' ').slice(0, 120) || 'unnamed'}]`)
  return [text.trim(), notes.join('\n')].filter(Boolean).join('\n\n')
}

/** The bare address in a header value or address object, case kept. */
export const extractAddress = (v: unknown): string => {
  const s = typeof v === 'string' ? v : (v as { address?: string; email?: string } | null)?.address ?? (v as { email?: string } | null)?.email ?? ''
  return s.match(/[^\s<>"',;]+@[^\s<>"',;]+/)?.[0] ?? ''
}
export const lowerAddress = (v: unknown): string => extractAddress(v).toLowerCase()

/** Which handler an address belongs to: Impact's reply+<org slug>@, Coach's signed reply+<token>.<sig>@, or nobody. */
export function inboundKind(address: string, domain: string): 'impact' | 'coach' | null {
  const a = address.toLowerCase(), d = domain.toLowerCase()
  if (!a.endsWith(`@${d}`)) return null
  const local = a.slice(0, -(d.length + 1))
  if (/^reply\+[a-z0-9][a-z0-9-]{0,57}$/.test(local)) return 'impact'
  if (/^reply\+[a-z0-9_-]+\.[a-z0-9_-]+$/.test(local)) return 'coach'
  return null
}
