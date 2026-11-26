// Raw MIME (from the Cloudflare Email Worker) → InboundMessage, with postal-mime
// (MIT-0, the parser Cloudflare's own Email Workers docs use). Text body only: an HTML-only
// email is turned into plain text; attachments are listed by name, never kept.

import PostalMime from 'postal-mime'
import { htmlToText } from '@/lib/impact/inbound'
import { authVerdict, extractAddress, lowerAddress, type InboundMessage } from './message'

export async function parseMime(raw: Uint8Array, envelope: { to: string; from: string; authResults: string }): Promise<InboundMessage> {
  const email = await PostalMime.parse(raw, { attachmentEncoding: 'base64' })
  const flat = (xs: typeof email.to) => (xs ?? []).flatMap(a => ('group' in a && a.group ? a.group : [a])).map(extractAddress).filter(Boolean)
  const from = email.from && !('group' in email.from && email.from.group) ? email.from as { name: string; address: string } : null
  const fromAddress = lowerAddress(from?.address ?? '') || lowerAddress(envelope.from) || null
  const recipients = [...new Set([extractAddress(envelope.to), ...flat(email.to), ...flat(email.cc)].filter(Boolean))]
  const authHeader = envelope.authResults || email.headers.find(h => h.key === 'authentication-results')?.value || ''
  return {
    recipients,
    from: fromAddress,
    fromName: (from?.name || '').trim() || (fromAddress ?? '').split('@')[0] || 'Unknown sender',
    subject: email.subject?.slice(0, 300) ?? null,
    text: (email.text ?? '').trim() || (email.html ? htmlToText(email.html) : ''),
    attachments: email.attachments.filter(a => a.disposition !== 'inline' || a.filename).map(a => a.filename || a.mimeType || 'unnamed'),
    messageId: email.messageId?.slice(0, 300) ?? null,
    verified: authVerdict(authHeader),
  }
}
