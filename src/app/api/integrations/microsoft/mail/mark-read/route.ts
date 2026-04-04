import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId } from '@/lib/integrations/tokenHelper'
import { ensureFreshMicrosoftToken } from '@/lib/integrations/microsoft/refreshToken'

const PROVIDERS = ['microsoft_outlook', 'outlook']

export async function PATCH(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenResult = await ensureFreshMicrosoftToken(businessId, PROVIDERS)
  if (!tokenResult) return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })

  const { messageId, isRead } = await req.json()
  if (!messageId || typeof isRead !== 'boolean') return NextResponse.json({ error: 'messageId and isRead required' }, { status: 400 })

  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenResult.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead }),
    })
    if (res.status === 401) return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })
    if (!res.ok) { console.error('[ms/mail/mark-read]', res.status, await res.text()); return NextResponse.json({ error: 'Failed' }, { status: 502 }) }
    return NextResponse.json({ success: true })
  } catch (err) { console.error('[ms/mail/mark-read]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
