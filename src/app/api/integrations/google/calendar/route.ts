import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['gcal', 'google_cal'])
  if (!tokenData) return NextResponse.json({ error: 'Google Calendar not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })

  const { access_token } = tokenData
  const providers = ['gcal', 'google_cal']
  const now = new Date()
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=20`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    )
    if (res.status === 401) { await flagTokenExpired(businessId, providers); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 }) }
    if (!res.ok) { console.error('[google/calendar]', res.status, await res.text()); return NextResponse.json({ error: 'Failed to fetch' }, { status: 502 }) }

    const data = await res.json()
    const events = (data.items || []).map((evt: Record<string, unknown>) => {
      const start = evt.start as Record<string, string> | undefined
      const end = evt.end as Record<string, string> | undefined
      const attendees = evt.attendees as unknown[] | undefined
      return {
        id: evt.id, title: evt.summary || 'No title',
        start: start?.dateTime || start?.date || '',
        end: end?.dateTime || end?.date || '',
        attendeesCount: attendees?.length || 0,
        location: (evt.location as string) || null,
        isOnline: !!(evt.hangoutLink || evt.conferenceData),
        joinUrl: (evt.hangoutLink as string) || null,
        webLink: evt.htmlLink || null, source: 'google' as const,
      }
    })
    return NextResponse.json({ events })
  } catch (err) { console.error('[google/calendar]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
