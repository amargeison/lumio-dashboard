import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, flagTokenExpired } from '@/lib/integrations/tokenHelper'
import { ensureFreshMicrosoftToken } from '@/lib/integrations/microsoft/refreshToken'

const PROVIDERS = ['microsoft_outlook_cal', 'outlook_cal']

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  // Get a fresh token (auto-refreshes if near expiry)
  const tokenResult = await ensureFreshMicrosoftToken(businessId, PROVIDERS)
  if (!tokenResult) {
    return NextResponse.json({ error: 'Calendar not connected or token refresh failed', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })
  }

  const { access_token } = tokenResult
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  try {
    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startOfDay}&endDateTime=${endOfDay}&$select=subject,start,end,attendees,location,isOnlineMeeting,onlineMeetingUrl,webLink&$orderby=start/dateTime&$top=20`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    )

    if (graphRes.status === 401) {
      // Token was supposedly fresh but MS rejected it — flag as expired
      await flagTokenExpired(businessId, PROVIDERS)
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })
    }

    if (!graphRes.ok) {
      console.error('[microsoft/calendar] Graph API error:', graphRes.status, await graphRes.text())
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 502 })
    }

    const data = await graphRes.json()
    const events = (data.value || []).map((evt: Record<string, unknown>) => {
      const attendees = evt.attendees as { emailAddress?: { name?: string } }[] | undefined
      return {
        id: evt.id,
        title: evt.subject || 'No title',
        start: (evt.start as Record<string, string>)?.dateTime,
        end: (evt.end as Record<string, string>)?.dateTime,
        attendeesCount: attendees?.length || 0,
        location: (evt.location as Record<string, string>)?.displayName || null,
        isOnline: evt.isOnlineMeeting || false,
        joinUrl: evt.onlineMeetingUrl || null,
        webLink: evt.webLink || null,
      }
    })

    return NextResponse.json({ events })
  } catch (err) {
    console.error('[microsoft/calendar] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
