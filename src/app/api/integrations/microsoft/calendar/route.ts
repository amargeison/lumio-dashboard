import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

async function getBusinessId(token: string) {
  const { data } = await getSupabase()
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return data?.business_id || null
}

/**
 * GET /api/integrations/microsoft/calendar
 * Fetches today's calendar events from Microsoft Graph using stored OAuth tokens.
 */
export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const supabase = getSupabase()

  // Look up Outlook Calendar token
  const { data: tokenRow } = await supabase
    .from('integration_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('business_id', businessId)
    .in('provider', ['microsoft_outlook_cal', 'outlook_cal'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!tokenRow?.access_token) {
    return NextResponse.json({ error: 'Calendar not connected', code: 'NOT_CONNECTED' }, { status: 404 })
  }

  // Build today's date range in UTC
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  try {
    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startOfDay}&endDateTime=${endOfDay}&$select=subject,start,end,attendees,location,isOnlineMeeting,onlineMeetingUrl,webLink&$orderby=start/dateTime&$top=20`,
      { headers: { Authorization: `Bearer ${tokenRow.access_token}` } },
    )

    if (graphRes.status === 401) {
      // Token expired — flag it
      await supabase
        .from('integration_tokens')
        .update({ expires_at: new Date(0).toISOString() })
        .eq('business_id', businessId)
        .in('provider', ['microsoft_outlook_cal', 'outlook_cal'])
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    if (!graphRes.ok) {
      const errBody = await graphRes.text()
      console.error('[microsoft/calendar] Graph API error:', graphRes.status, errBody)
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
