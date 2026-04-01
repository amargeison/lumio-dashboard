import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, flagTokenExpired } from '@/lib/integrations/tokenHelper'
import { ensureFreshMicrosoftToken } from '@/lib/integrations/microsoft/refreshToken'

const PROVIDERS = ['microsoft_outlook', 'outlook']

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  // Get a fresh token (auto-refreshes if near expiry)
  const tokenResult = await ensureFreshMicrosoftToken(businessId, PROVIDERS)
  if (!tokenResult) {
    return NextResponse.json({ error: 'Outlook not connected or token refresh failed', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })
  }

  const { access_token } = tokenResult

  try {
    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,webLink&$orderby=receivedDateTime desc`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    )

    if (graphRes.status === 401) {
      await flagTokenExpired(businessId, PROVIDERS)
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })
    }

    if (!graphRes.ok) {
      console.error('[microsoft/mail] Graph API error:', graphRes.status, await graphRes.text())
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 502 })
    }

    const data = await graphRes.json()
    const emails = (data.value || []).map((msg: Record<string, unknown>) => {
      const from = msg.from as { emailAddress?: { name?: string; address?: string } } | undefined
      return {
        id: msg.id,
        subject: msg.subject || '(No subject)',
        senderName: from?.emailAddress?.name || from?.emailAddress?.address || 'Unknown',
        senderEmail: from?.emailAddress?.address || '',
        receivedAt: msg.receivedDateTime,
        isRead: msg.isRead || false,
        preview: msg.bodyPreview || '',
        webLink: msg.webLink || null,
      }
    })

    return NextResponse.json({ emails })
  } catch (err) {
    console.error('[microsoft/mail] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
