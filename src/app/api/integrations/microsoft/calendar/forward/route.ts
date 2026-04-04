import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId } from '@/lib/integrations/tokenHelper'
import { ensureFreshMicrosoftToken } from '@/lib/integrations/microsoft/refreshToken'

const PROVIDERS = ['microsoft_outlook_cal', 'outlook_cal']

export async function POST(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenResult = await ensureFreshMicrosoftToken(businessId, PROVIDERS)
  if (!tokenResult) return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })

  const { eventId, toEmail, comment } = await req.json()
  if (!eventId || !toEmail) return NextResponse.json({ error: 'eventId and toEmail required' }, { status: 400 })

  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}/forward`, {
      method: 'POST', headers: { Authorization: `Bearer ${tokenResult.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toRecipients: [{ emailAddress: { address: toEmail } }],
        comment: comment || '',
      }),
    })
    if (res.status === 401) return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })
    if (!res.ok && res.status !== 202) { console.error('[ms/cal/forward]', res.status, await res.text()); return NextResponse.json({ error: 'Failed to forward' }, { status: 502 }) }
    return NextResponse.json({ success: true })
  } catch (err) { console.error('[ms/cal/forward]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
