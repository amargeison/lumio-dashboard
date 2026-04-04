import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

interface Meeting { title: string; time: string; startTime: Date; hasJoinUrl: boolean }
interface Email { sender: string; subject: string }
interface SlackSummary { unread: number; channels: number }

async function fetchMeetings(token: string, businessId: string, supabase: ReturnType<typeof getSupabase>): Promise<Meeting[]> {
  const meetings: Meeting[] = []

  // Microsoft Calendar
  const { data: msCreds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', businessId).in('provider', ['microsoft_outlook_cal', 'microsoft_all']).limit(1).maybeSingle()
  if (msCreds?.access_token) {
    try {
      const now = new Date()
      const eod = new Date(now); eod.setHours(23, 59, 59, 999)
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/calendarview?startdatetime=${now.toISOString()}&enddatetime=${eod.toISOString()}&$select=subject,start,isOnlineMeeting,onlineMeetingUrl&$orderby=start/dateTime&$top=10`, {
        headers: { Authorization: `Bearer ${msCreds.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        for (const e of (data.value || [])) {
          const start = new Date(e.start?.dateTime + 'Z')
          meetings.push({ title: e.subject || 'Meeting', time: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), startTime: start, hasJoinUrl: !!e.onlineMeetingUrl })
        }
      }
    } catch { /* skip */ }
  }

  // Google Calendar
  const { data: gCreds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', businessId).eq('provider', 'gcal').maybeSingle()
  if (gCreds?.access_token) {
    try {
      const now = new Date()
      const eod = new Date(now); eod.setHours(23, 59, 59, 999)
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${eod.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=10`, {
        headers: { Authorization: `Bearer ${gCreds.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        for (const e of (data.items || [])) {
          const start = new Date(e.start?.dateTime || e.start?.date)
          meetings.push({ title: e.summary || 'Meeting', time: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), startTime: start, hasJoinUrl: !!e.hangoutLink || !!e.conferenceData })
        }
      }
    } catch { /* skip */ }
  }

  meetings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  return meetings
}

async function fetchEmails(businessId: string, supabase: ReturnType<typeof getSupabase>): Promise<Email[]> {
  const emails: Email[] = []

  // Microsoft Mail
  const { data: msCreds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', businessId).in('provider', ['microsoft_outlook', 'microsoft_all']).limit(1).maybeSingle()
  if (msCreds?.access_token) {
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$filter=isRead eq false&$select=from,subject&$top=5&$orderby=receivedDateTime desc', {
        headers: { Authorization: `Bearer ${msCreds.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        for (const m of (data.value || [])) {
          emails.push({ sender: m.from?.emailAddress?.name || m.from?.emailAddress?.address || 'Unknown', subject: m.subject || '(no subject)' })
        }
      }
    } catch { /* skip */ }
  }

  // Google Mail
  const { data: gCreds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', businessId).eq('provider', 'gmail').maybeSingle()
  if (gCreds?.access_token) {
    try {
      const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5', {
        headers: { Authorization: `Bearer ${gCreds.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        for (const msg of (data.messages || []).slice(0, 3)) {
          const detailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, {
            headers: { Authorization: `Bearer ${gCreds.access_token}` },
          })
          if (detailRes.ok) {
            const detail = await detailRes.json()
            const headers = detail.payload?.headers || []
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown'
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(no subject)'
            const senderName = from.includes('<') ? from.split('<')[0].trim().replace(/"/g, '') : from
            emails.push({ sender: senderName, subject })
          }
        }
      }
    } catch { /* skip */ }
  }

  return emails
}

async function fetchSlack(businessId: string, supabase: ReturnType<typeof getSupabase>): Promise<SlackSummary | null> {
  const { data: creds } = await supabase.from('integration_tokens').select('access_token').eq('business_id', businessId).eq('provider', 'slack').maybeSingle()
  if (!creds?.access_token) return null

  try {
    const res = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=20', {
      headers: { Authorization: `Bearer ${creds.access_token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.ok) return null

    const channels = data.channels || []
    const totalUnread = channels.reduce((s: number, c: any) => s + (c.unread_count_display || 0), 0)
    const channelsWithUnread = channels.filter((c: any) => (c.unread_count_display || 0) > 0).length

    return { unread: totalUnread, channels: channelsWithUnread }
  } catch { return null }
}

function buildMeetingsScript(meetings: Meeting[]): string {
  const now = new Date()
  const urgentThreshold = 15 * 60 * 1000

  if (meetings.length === 0) return 'You have no meetings scheduled today.'

  const parts: string[] = []
  const first = meetings[0]
  const isUrgent = first.startTime.getTime() - now.getTime() < urgentThreshold && first.startTime.getTime() > now.getTime()

  if (meetings.length === 1) {
    parts.push(`${isUrgent ? 'Heads up — ' : ''}You have 1 meeting today — ${first.title} at ${first.time}.`)
    if (first.hasJoinUrl) parts.push('It has an online link ready to join.')
  } else if (meetings.length === 2) {
    parts.push(`${isUrgent ? 'Heads up — your first meeting is soon. ' : ''}You have 2 meetings today. First, ${first.title} at ${first.time}. Then ${meetings[1].title} at ${meetings[1].time}.`)
  } else {
    parts.push(`${isUrgent ? 'Heads up — your first meeting is soon. ' : ''}You have ${meetings.length} meetings today. Your first is ${first.title} at ${first.time}, followed by ${meetings[1].title} at ${meetings[1].time}, and ${meetings.length - 2} more.`)
  }

  return parts.join(' ')
}

function buildEmailsScript(emails: Email[]): string {
  if (emails.length === 0) return 'You have no new messages since your last visit.'

  if (emails.length <= 3) {
    const list = emails.map(e => `From ${e.sender}, subject: ${e.subject}`).join('. ')
    return `You have ${emails.length} unread email${emails.length > 1 ? 's' : ''}. ${list}.`
  }

  return `You have ${emails.length} unread emails. The most recent is from ${emails[0].sender} — ${emails[0].subject}.`
}

function buildSlackScript(slack: SlackSummary | null): string {
  if (!slack || slack.unread === 0) return ''
  return `You have ${slack.unread} unread Slack message${slack.unread > 1 ? 's' : ''} across ${slack.channels} channel${slack.channels > 1 ? 's' : ''}.`
}

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const supabase = getSupabase()
  const { data: session } = await supabase.from('business_sessions').select('business_id, email').eq('token', wsToken).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data: business } = await supabase.from('businesses').select('owner_name').eq('id', session.business_id).single()
  const userName = business?.owner_name?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Fetch all data in parallel
  const [meetings, emails, slack] = await Promise.all([
    fetchMeetings(wsToken, session.business_id, supabase),
    fetchEmails(session.business_id, supabase),
    fetchSlack(session.business_id, supabase),
  ])

  // Assemble script
  const sections: string[] = []
  sections.push(`${greeting}, ${userName}. Here's your morning roundup.`)
  sections.push(buildMeetingsScript(meetings))
  sections.push(buildEmailsScript(emails))

  const slackScript = buildSlackScript(slack)
  if (slackScript) sections.push(slackScript)

  sections.push("That's your roundup. Have a great day.")

  const script = sections.join(' ')

  return NextResponse.json({ script, meetings: meetings.length, emails: emails.length, slackUnread: slack?.unread || 0 })
}
