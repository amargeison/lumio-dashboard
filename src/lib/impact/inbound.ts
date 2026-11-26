// Replies from families, by email. Impact emails carry Reply-To
//   reply+<org slug>@inbound.lumiosports.com
// (From stays the org's verified sender). Resend receives it and calls
// /api/impact/webhooks/resend with email.received; these pure helpers decide which org it
// is for and which family's thread it goes in.
//
// The family is found by the sender's email address only, never by name. A sender who
// isn't exactly one family in that org is filed as an unknown sender (its own thread,
// keyed by the address), so a reply can never land in the wrong family's thread.
//
// Coach uses the same inbound domain with a signed reply+<token>.<sig> address; a slug
// has no dot, so the two never match each other's addresses.

export const INBOUND_DOMAIN = process.env.LUMIO_INBOUND_DOMAIN || 'inbound.lumiosports.com'

export const impactReplyTo = (slug: string) => (/^[a-z0-9][a-z0-9-]{0,57}$/.test(slug) ? `reply+${slug}@${INBOUND_DOMAIN}` : null)

const addr = (v: unknown): string => {
  const s = typeof v === 'string' ? v : (v as { address?: string; email?: string } | null)?.address ?? (v as { email?: string } | null)?.email ?? ''
  return (s.match(/[^\s<>"',;]+@[^\s<>"',;]+/)?.[0] ?? '').toLowerCase()
}
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v ? [v] : [])

/** The org slug an inbound email was sent to, from any of its recipient fields. */
export function slugFromRecipients(...fields: unknown[]): string | null {
  const domain = INBOUND_DOMAIN.toLowerCase().replace(/[.]/g, '\\.')
  const re = new RegExp(`^reply\\+([a-z0-9][a-z0-9-]{0,57})@${domain}$`)
  for (const a of fields.flatMap(list).map(addr)) {
    const m = re.exec(a)
    if (m) return m[1]
  }
  return null
}

export const senderAddress = (from: unknown) => addr(from) || null

/** The one family in this org with that email, or null (none, or more than one). */
export function familyForSender<F extends { id: string; email: string | null }>(sender: string | null, families: F[]): F | null {
  if (!sender) return null
  const hits = families.filter(f => (f.email ?? '').trim().toLowerCase() === sender)
  return hits.length === 1 ? hits[0] : null
}

export const threadKeyFor = (familyId: string | null, sender: string | null) => (familyId ? `family:${familyId}` : `email:${sender ?? 'unknown'}`)

/** Just the new text: the quoted earlier message and the usual reply markers are cut off. */
export function replyText(t: string): string {
  return String(t || '').replace(/\r/g, '')
    .split(/\n\s*On .{3,200}wrote:\s*\n|\n-{2,}\s*Original Message|\n_{5,}|\n\s*From: .+\n\s*Sent: /i)[0]
    .split('\n').filter(l => !/^\s*>/.test(l)).join('\n').trim().slice(0, 10_000)
}

export const htmlToText = (h: string): string => String(h || '')
  .replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|h[1-6]|blockquote)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\n{3,}/g, '\n\n').trim()
