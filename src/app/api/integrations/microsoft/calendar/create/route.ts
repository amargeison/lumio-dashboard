import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBusinessId } from '@/lib/integrations/tokenHelper'
import { ensureFreshMicrosoftToken } from '@/lib/integrations/microsoft/refreshToken'

const PROVIDERS = ['microsoft_outlook_cal', 'outlook_cal']
const PERSONAL_DOMAINS = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'outlook.co.uk', 'hotmail.co.uk']

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

function isPersonalAccount(email: string): boolean {
  const domain = (email || '').split('@')[1]?.toLowerCase() || ''
  return PERSONAL_DOMAINS.some(d => domain === d)
}

export async function POST(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenResult = await ensureFreshMicrosoftToken(businessId, PROVIDERS)
  if (!tokenResult) return NextResponse.json({ error: 'Calendar not connected', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })

  const { title, start, end, attendees, location, isOnlineMeeting, notes } = await req.json()
  if (!title || !start || !end) return NextResponse.json({ error: 'title, start, and end required' }, { status: 400 })

  const accessToken = tokenResult.access_token

  // Check if personal account
  const supabase = getSupabase()
  const { data: tokenRow } = await supabase
    .from('integration_tokens')
    .select('profile_email')
    .eq('business_id', businessId)
    .in('provider', PROVIDERS)
    .limit(1)
    .maybeSingle()
  const personal = isPersonalAccount(tokenRow?.profile_email || '')

  try {
    let joinUrl: string | null = null

    // For personal accounts with online meeting requested — create meeting separately
    if (isOnlineMeeting && personal) {
      console.log('[ms/cal/create] Personal account detected — creating online meeting via /onlineMeetings')
      try {
        const meetingRes = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDateTime: start, endDateTime: end, subject: title }),
        })
        if (meetingRes.ok) {
          const meetingData = await meetingRes.json()
          joinUrl = meetingData.joinWebUrl || meetingData.joinUrl || null
          console.log('[ms/cal/create] Online meeting created, joinUrl:', joinUrl)
        } else {
          console.warn('[ms/cal/create] Failed to create online meeting:', meetingRes.status, await meetingRes.text())
        }
      } catch (err) {
        console.warn('[ms/cal/create] Online meeting creation failed:', err)
      }
    }

    // Build the calendar event
    const eventBody: Record<string, unknown> = {
      subject: title,
      start: { dateTime: start, timeZone: 'UTC' },
      end: { dateTime: end, timeZone: 'UTC' },
      attendees: (attendees || []).map((email: string) => ({ emailAddress: { address: email }, type: 'required' })),
    }

    // Body content — include join URL for personal accounts
    const bodyParts: string[] = []
    if (notes) bodyParts.push(notes)
    if (joinUrl) bodyParts.push(`\n\nJoin online: ${joinUrl}`)
    if (bodyParts.length) eventBody.body = { contentType: 'Text', content: bodyParts.join('') }

    // Location — include join URL as location for personal accounts
    if (joinUrl && personal) {
      eventBody.location = { displayName: 'Online Meeting', locationUri: joinUrl }
    } else if (location) {
      eventBody.location = { displayName: location }
    }

    // For work accounts — use native Teams integration
    if (isOnlineMeeting && !personal) {
      eventBody.isOnlineMeeting = true
      eventBody.onlineMeetingProvider = 'teamsForBusiness'
    }

    const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody),
    })

    if (res.status === 401) {
      return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED', auth_required: true }, { status: 401 })
    }

    if (!res.ok) {
      const errText = await res.text()
      console.error('[ms/cal/create] Graph API error:', res.status, errText)

      // If teamsForBusiness fails (account doesn't support it), retry without it
      if (isOnlineMeeting && !personal && res.status === 400 && errText.includes('onlineMeetingProvider')) {
        console.log('[ms/cal/create] Retrying without teamsForBusiness...')
        delete eventBody.isOnlineMeeting
        delete eventBody.onlineMeetingProvider
        const retryRes = await fetch('https://graph.microsoft.com/v1.0/me/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        })
        if (retryRes.ok) {
          const created = await retryRes.json()
          return NextResponse.json({
            success: true,
            personal: true,
            event: { id: created.id, title: created.subject, start: created.start?.dateTime, end: created.end?.dateTime, joinUrl: null },
            warning: 'Teams link requires a Microsoft 365 work account. Event created without online meeting link.',
          })
        }
        return NextResponse.json({ error: 'Failed to create event' }, { status: 502 })
      }

      return NextResponse.json({ error: 'Failed to create event' }, { status: 502 })
    }

    const created = await res.json()
    const finalJoinUrl = created.onlineMeeting?.joinUrl || joinUrl || null

    return NextResponse.json({
      success: true,
      personal,
      event: {
        id: created.id,
        title: created.subject,
        start: created.start?.dateTime,
        end: created.end?.dateTime,
        joinUrl: finalJoinUrl,
      },
      ...(personal && isOnlineMeeting && !finalJoinUrl ? { warning: 'Teams link requires a Microsoft 365 work account.' } : {}),
    })
  } catch (err) {
    console.error('[ms/cal/create]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
