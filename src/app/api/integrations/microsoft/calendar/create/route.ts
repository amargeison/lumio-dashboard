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
  if (!tokenResult) return NextResponse.json({ error: 'Calendar not connected', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })

  const { title, start, end, attendees, location, isOnlineMeeting, notes } = await req.json()
  if (!title || !start || !end) return NextResponse.json({ error: 'title, start, and end required' }, { status: 400 })

  const event: Record<string, unknown> = {
    subject: title,
    start: { dateTime: start, timeZone: 'UTC' },
    end: { dateTime: end, timeZone: 'UTC' },
    body: notes ? { contentType: 'Text', content: notes } : undefined,
    location: location ? { displayName: location } : undefined,
    attendees: (attendees || []).map((email: string) => ({ emailAddress: { address: email }, type: 'required' })),
  }
  if (isOnlineMeeting) { event.isOnlineMeeting = true; event.onlineMeetingProvider = 'teamsForBusiness' }

  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST', headers: { Authorization: `Bearer ${tokenResult.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    if (res.status === 401) return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })
    if (!res.ok) { console.error('[ms/cal/create]', res.status, await res.text()); return NextResponse.json({ error: 'Failed to create event' }, { status: 502 }) }
    const created = await res.json()
    return NextResponse.json({
      success: true,
      event: { id: created.id, title: created.subject, start: created.start?.dateTime, end: created.end?.dateTime, joinUrl: created.onlineMeeting?.joinUrl || null },
    })
  } catch (err) { console.error('[ms/cal/create]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
