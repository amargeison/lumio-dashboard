import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId } from '@/lib/integrations/tokenHelper'
import { ensureFreshMicrosoftToken } from '@/lib/integrations/microsoft/refreshToken'

const PROVIDERS = ['microsoft_outlook', 'outlook']

export async function POST(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenResult = await ensureFreshMicrosoftToken(businessId, PROVIDERS)
  if (!tokenResult) return NextResponse.json({ error: 'Outlook not connected', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })

  const { to, subject, body, replyToId } = await req.json()
  if (!to || !subject) return NextResponse.json({ error: 'to and subject required' }, { status: 400 })

  try {
    let res: Response
    if (replyToId) {
      // Reply to existing message
      res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${replyToId}/reply`, {
        method: 'POST', headers: { Authorization: `Bearer ${tokenResult.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: body || '' }),
      })
    } else {
      // Send new message
      res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST', headers: { Authorization: `Bearer ${tokenResult.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'Text', content: body || '' },
            toRecipients: [{ emailAddress: { address: to } }],
          },
        }),
      })
    }

    if (res.status === 401) return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })
    if (!res.ok && res.status !== 202) {
      console.error('[ms/mail/send]', res.status, await res.text())
      return NextResponse.json({ error: 'Failed to send' }, { status: 502 })
    }
    return NextResponse.json({ success: true })
  } catch (err) { console.error('[ms/mail/send]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
