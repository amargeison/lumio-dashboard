import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

/**
 * GET /api/integrations/twilio/messages
 * Fetches recent SMS messages from Twilio using stored API credentials.
 * Twilio uses Basic auth (AccountSid:AuthToken), not OAuth.
 * access_token stores the AuthToken, profile_email stores the AccountSid.
 */
export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['twilio', 'twilio_sms'])
  if (!tokenData) {
    return NextResponse.json({ error: 'Twilio not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })
  }

  const authToken = tokenData.access_token
  const accountSid = (tokenData.extras as Record<string, unknown>)?.profile_email as string || ''

  if (!accountSid) {
    return NextResponse.json({ error: 'Twilio Account SID not configured', code: 'CONFIG_MISSING' }, { status: 400 })
  }

  const providers = ['twilio', 'twilio_sms']

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?DateSent%3E=${oneDayAgo}&PageSize=10`,
      { headers: { Authorization: `Basic ${auth}` } },
    )

    if (res.status === 401) {
      await flagTokenExpired(businessId, providers)
      return NextResponse.json({ error: 'Credentials expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[twilio/messages] API error:', res.status, errBody)
      return NextResponse.json({ error: 'Failed to fetch SMS messages' }, { status: 502 })
    }

    const data = await res.json()
    const messages = (data.messages || []).map((msg: Record<string, unknown>) => ({
      id: msg.sid || '',
      from: (msg.from as string) || 'Unknown',
      preview: ((msg.body as string) || '').slice(0, 200),
      timestamp: msg.date_sent ? new Date(msg.date_sent as string).toISOString() : new Date().toISOString(),
      direction: msg.direction || 'inbound',
    }))

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('[twilio/messages] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
