import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

const PROVIDERS = ['gmail', 'google_gmail']

export async function POST(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, PROVIDERS)
  if (!tokenData) return NextResponse.json({ error: 'Gmail not connected', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })

  const { to, subject, body } = await req.json()
  if (!to || !subject) return NextResponse.json({ error: 'to and subject required' }, { status: 400 })

  // Build RFC 2822 email and base64url encode
  const rawEmail = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body || '',
  ].join('\r\n')

  const encoded = Buffer.from(rawEmail).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST', headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    })
    if (res.status === 401) { await flagTokenExpired(businessId, PROVIDERS); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 }) }
    if (!res.ok) { console.error('[gmail/send]', res.status, await res.text()); return NextResponse.json({ error: 'Failed to send' }, { status: 502 }) }
    return NextResponse.json({ success: true })
  } catch (err) { console.error('[gmail/send]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
