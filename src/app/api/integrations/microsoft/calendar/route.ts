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
    return NextResponse.json({ connected: false, events: [] })
  }

  const { access_token } = tokenResult
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  try {
    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startOfDay}&endDateTime=${endOfDay}&$select=subject,start,end,attendees,location,isOnlineMeeting,onlineMeeting,onlineMeetingUrl,bodyPreview,webLink&$orderby=start/dateTime&$top=20`,
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
      const onlineMeeting = evt.onlineMeeting as { joinUrl?: string } | null | undefined
      const location = evt.location as { displayName?: string; uri?: string } | null | undefined
      const bodyPreview = (evt.bodyPreview as string) || ''

      // Extract join URL from multiple sources
      let joinUrl: string | null =
        onlineMeeting?.joinUrl ||
        (evt.onlineMeetingUrl as string) ||
        null

      // Fallback: location URI if it's a meeting URL
      if (!joinUrl && location?.uri && /^https?:\/\//.test(location.uri)) {
        joinUrl = location.uri
      }

      // Fallback: parse bodyPreview for Teams/Meet/Zoom URLs
      if (!joinUrl && bodyPreview) {
        const urlMatch = bodyPreview.match(/https:\/\/(?:teams\.microsoft\.com\/l\/meetup-join|teams\.live\.com|meet\.google\.com|zoom\.us\/j|whereby\.com)\/[^\s)]+/)
        if (urlMatch) joinUrl = urlMatch[0]
      }

      return {
        id: evt.id,
        title: evt.subject || 'No title',
        start: (evt.start as Record<string, string>)?.dateTime,
        end: (evt.end as Record<string, string>)?.dateTime,
        attendeesCount: attendees?.length || 0,
        location: location?.displayName || null,
        isOnline: evt.isOnlineMeeting || !!joinUrl,
        joinUrl,
        webLink: evt.webLink || null,
      }
    })

    return NextResponse.json({ events })
  } catch (err) {
    console.error('[microsoft/calendar] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
