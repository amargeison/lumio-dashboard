import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

/**
 * GET /api/integrations/whatsapp/messages
 * Fetches recent WhatsApp Business messages via Meta Business API.
 */
export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['whatsapp', 'whatsapp_business'])
  if (!tokenData) {
    return NextResponse.json({ error: 'WhatsApp not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })
  }

  const { access_token, extras } = tokenData
  const providers = ['whatsapp', 'whatsapp_business']
  const phoneNumberId = (extras as Record<string, unknown>)?.phone_number_id as string || ''

  if (!phoneNumberId) {
    return NextResponse.json({ error: 'WhatsApp phone number ID not configured', code: 'CONFIG_MISSING' }, { status: 400 })
  }

  try {
    // Fetch recent conversations via Meta Cloud API
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages?fields=from,timestamp,type,text&limit=10`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    )

    if (res.status === 401 || res.status === 403) {
      await flagTokenExpired(businessId, providers)
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[whatsapp/messages] API error:', res.status, errBody)
      return NextResponse.json({ error: 'Failed to fetch WhatsApp messages' }, { status: 502 })
    }

    const data = await res.json()
    const messages = (data.data || []).map((msg: Record<string, unknown>) => ({
      id: msg.id || String(msg.timestamp),
      from: (msg.from as string) || 'Unknown',
      preview: ((msg.text as Record<string, string>)?.body || '').slice(0, 200),
      timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
      isRead: false,
    }))

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[whatsapp/messages] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
