import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

const PROVIDERS = ['gmail', 'google_gmail']

export async function PATCH(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, PROVIDERS)
  if (!tokenData) return NextResponse.json({ error: 'Gmail not connected', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })

  const { messageId, isRead } = await req.json()
  if (!messageId || typeof isRead !== 'boolean') return NextResponse.json({ error: 'messageId and isRead required' }, { status: 400 })

  try {
    const body = isRead
      ? { removeLabelIds: ['UNREAD'] }
      : { addLabelIds: ['UNREAD'] }

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.status === 401) { await flagTokenExpired(businessId, PROVIDERS); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 }) }
    if (!res.ok) { console.error('[gmail/mark-read]', res.status, await res.text()); return NextResponse.json({ error: 'Failed' }, { status: 502 }) }
    return NextResponse.json({ success: true })
  } catch (err) { console.error('[gmail/mark-read]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
