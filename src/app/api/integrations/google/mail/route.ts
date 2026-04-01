import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

/**
 * GET /api/integrations/google/mail
 * Fetches latest 10 inbox emails from Gmail API using stored OAuth tokens.
 */
export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['gmail', 'google_gmail'])
  if (!tokenData) {
    return NextResponse.json({ error: 'Gmail not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })
  }

  const { access_token } = tokenData
  const providers = ['gmail', 'google_gmail']

  try {
    // List latest inbox messages from the last day
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${encodeURIComponent('is:inbox newer_than:1d')}`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    )

    if (listRes.status === 401) {
      await flagTokenExpired(businessId, providers)
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }
    if (!listRes.ok) {
      console.error('[google/mail] List error:', listRes.status, await listRes.text())
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 502 })
    }

    const listData = await listRes.json()
    const messageIds: string[] = (listData.messages || []).map((m: { id: string }) => m.id)

    if (!messageIds.length) {
      return NextResponse.json({ emails: [] })
    }

    // Fetch metadata for each message (in parallel, max 10)
    const emails = await Promise.all(
      messageIds.slice(0, 10).map(async (id) => {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${access_token}` } },
          )
          if (!msgRes.ok) return null
          const msg = await msgRes.json()

          const headers: { name: string; value: string }[] = msg.payload?.headers || []
          const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''

          const fromRaw = getHeader('From')
          const fromMatch = fromRaw.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/)
          const senderName = fromMatch?.[1]?.trim() || fromRaw
          const senderEmail = fromMatch?.[2]?.trim() || fromRaw

          return {
            id: msg.id,
            subject: getHeader('Subject') || '(No subject)',
            senderName,
            senderEmail,
            receivedAt: getHeader('Date'),
            isRead: !msg.labelIds?.includes('UNREAD'),
            preview: msg.snippet || '',
            webLink: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
          }
        } catch { return null }
      }),
    )

    return NextResponse.json({ emails: emails.filter(Boolean) })
  } catch (err) {
    console.error('[google/mail] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
