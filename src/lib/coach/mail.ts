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

// Whether the coach has any mailbox capable of send-as (cheap pre-check).
export async function hasConnectedMailbox(coachId: string): Promise<boolean> {
  for (const provider of ['google', 'microsoft'] as Provider[]) {
    const conn = await getConnection(coachId, provider)
    if (conn?.capabilities?.includes('send_email')) return true
  }
  return false
}
