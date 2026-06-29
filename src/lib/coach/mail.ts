// Server-only "send as the coach" helper. Routes an outbound email through the
// coach's connected Gmail / Microsoft mailbox so it arrives from their own
// address. Returns { ok:false } when no connected mailbox can send — the caller
// then falls back to Resend.

import { getConnection, getFreshAccessToken, type Provider } from './oauth'

export type OutboundMail = { to: string; subject: string; html: string }

// Build a base64url-encoded RFC 822 message for the Gmail send API.
function buildRawMessage(from: string | undefined, msg: OutboundMail): string {
  const headers = [
    from ? `From: ${from}` : '',
    `To: ${msg.to}`,
    `Subject: ${msg.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
  ].filter(Boolean).join('\r\n')
  const raw = `${headers}\r\n\r\n${msg.html}`
  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sendGoogle(token: string, from: string | undefined, msg: OutboundMail): Promise<boolean> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: buildRawMessage(from, msg) }),
  })
  return res.ok
}

async function sendMicrosoft(token: string, msg: OutboundMail): Promise<boolean> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: msg.subject,
        body: { contentType: 'HTML', content: msg.html },
        toRecipients: [{ emailAddress: { address: msg.to } }],
      },
      saveToSentItems: true,
    }),
  })
  return res.ok || res.status === 202
}

// Try Google first, then Microsoft. Returns the provider that sent, or ok:false.
export async function sendAsCoach(coachId: string, msg: OutboundMail): Promise<{ ok: boolean; provider?: Provider; from?: string }> {
  for (const provider of ['google', 'microsoft'] as Provider[]) {
    const conn = await getConnection(coachId, provider)
    if (!conn || !conn.capabilities?.includes('send_email')) continue
    const token = await getFreshAccessToken(coachId, provider)
    if (!token) continue
    const from = conn.email_address || undefined
    try {
      const ok = provider === 'google' ? await sendGoogle(token, from, msg) : await sendMicrosoft(token, msg)
      if (ok) return { ok: true, provider, from: from || undefined }
    } catch { /* try the next connected mailbox */ }
  }
  return { ok: false }
}

// ── Inbound (v2) — pull recent Gmail replies for the coach ───────────────────
export type InboundMail = { externalId: string; fromName: string; fromEmail: string; subject: string; body: string; date: string; threadId: string }

const decodeHeader = (h: string) => h
const parseFrom = (raw: string): { name: string; email: string } => {
  // "Jane Doe <jane@x.com>" or "jane@x.com"
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/)
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() }
  return { name: raw.trim(), email: raw.trim().toLowerCase() }
}

// Pull recent inbox messages (last ~2 days) from the coach's connected Gmail.
// Returns [] (never throws) if Gmail isn't connected or lacks read scope.
export async function fetchInboundGmail(coachId: string): Promise<InboundMail[]> {
  try {
    const conn = await getConnection(coachId, 'google' as Provider)
    if (!conn) return []
    const token = await getFreshAccessToken(coachId, 'google' as Provider)
    if (!token) return []
    const auth = { Authorization: `Bearer ${token}` }
    const list = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=' + encodeURIComponent('in:inbox newer_than:2d -from:me'), { headers: auth })
    if (!list.ok) return [] // 403 = read scope not granted; caller surfaces "reconnect Gmail"
    const ids: { id: string }[] = (await list.json()).messages || []
    const out: InboundMail[] = []
    for (const { id } of ids.slice(0, 25)) {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers: auth })
      if (!r.ok) continue
      const j = await r.json()
      const hdr = (n: string) => decodeHeader((j.payload?.headers || []).find((h: any) => h.name === n)?.value || '')
      const { name, email } = parseFrom(hdr('From'))
      out.push({ externalId: j.id, fromName: name || email, fromEmail: email, subject: hdr('Subject'), body: j.snippet || '', date: new Date(Number(j.internalDate) || Date.now()).toISOString(), threadId: j.threadId })
    }
    return out
  } catch { return [] }
}

// Whether the coach has any mailbox capable of send-as (cheap pre-check).
export async function hasConnectedMailbox(coachId: string): Promise<boolean> {
  for (const provider of ['google', 'microsoft'] as Provider[]) {
    const conn = await getConnection(coachId, provider)
    if (conn?.capabilities?.includes('send_email')) return true
  }
  return false
}
