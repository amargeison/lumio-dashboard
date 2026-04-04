import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

const PROVIDERS = ['gcal', 'google_cal']

export async function POST(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, PROVIDERS)
  if (!tokenData) return NextResponse.json({ error: 'Google Calendar not connected', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })

  const { title, start, end, attendees, location, isOnlineMeeting, notes } = await req.json()
  if (!title || !start || !end) return NextResponse.json({ error: 'title, start, and end required' }, { status: 400 })

  const event: Record<string, unknown> = {
    summary: title,
    start: { dateTime: start, timeZone: 'UTC' },
    end: { dateTime: end, timeZone: 'UTC' },
    description: notes || undefined,
    location: location || undefined,
    attendees: (attendees || []).map((email: string) => ({ email })),
  }
  if (isOnlineMeeting) {
    event.conferenceData = { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } }
  }

  try {
    const url = isOnlineMeeting
      ? 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1'
      : 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
    const res = await fetch(url, {
      method: 'POST', headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    if (res.status === 401) { await flagTokenExpired(businessId, PROVIDERS); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 }) }
    if (!res.ok) { console.error('[google/cal/create]', res.status, await res.text()); return NextResponse.json({ error: 'Failed to create event' }, { status: 502 }) }
    const created = await res.json()
    return NextResponse.json({
      success: true,
      event: { id: created.id, title: created.summary, start: created.start?.dateTime, end: created.end?.dateTime, joinUrl: created.hangoutLink || null },
    })
  } catch (err) { console.error('[google/cal/create]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
