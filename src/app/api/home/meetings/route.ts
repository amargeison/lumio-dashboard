import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')

  if (token) {
    try {
      const supabase = getSupabase()
      const { data: session } = await supabase
        .from('business_sessions')
        .select('business_id')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (session) {
        const { data: rows } = await supabase
          .from('business_meetings')
          .select('*')
          .eq('business_id', session.business_id)
          .order('starts_at', { ascending: true })

        if (rows && rows.length > 0) {
          const now = new Date()
          const meetings = rows.map(m => {
            const start = new Date(m.starts_at)
            const end = new Date(start.getTime() + m.duration_minutes * 60_000)
            const status = now > end ? 'done' : now >= start && now <= end ? 'now' : 'upcoming'
            return {
              id: m.id,
              title: m.title,
              time: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
              duration: `${m.duration_minutes} min`,
              attendees: m.attendees ?? [],
              location: m.location ?? '',
              type: m.type,
              status,
              source: m.source,
              link: m.link ?? undefined,
            }
          })
          return NextResponse.json({ meetings })
        }
      }
    } catch { /* fall through to hardcoded */ }
  }

  // Fallback: hardcoded meetings (original behaviour)
  const hour = new Date().getHours()
  const meetings = [
    { id: '1', title: 'The Feed Network — Weekly Check-in', time: '09:00', duration: '30 min', attendees: ['Sarah M.'], location: 'Google Meet', type: 'video', status: hour > 9 ? 'done' : hour === 9 ? 'now' : 'upcoming', source: 'google', link: 'https://meet.google.com' },
    { id: '2', title: 'New Customer Demo — Oakridge Schools', time: '11:00', duration: '45 min', attendees: ['Charlotte D.'], location: 'Zoom', type: 'video', status: hour > 11 ? 'done' : hour === 11 ? 'now' : 'upcoming', source: 'google', link: 'https://zoom.us' },
    { id: '3', title: 'Investor Update Call', time: '14:00', duration: '60 min', attendees: ['Arron'], location: 'Google Meet', type: 'call', status: hour > 14 ? 'done' : hour === 14 ? 'now' : 'upcoming', source: 'outlook', link: 'https://meet.google.com' },
    { id: '4', title: 'Team Standup', time: '17:00', duration: '15 min', attendees: ['All team'], location: 'Slack Huddle', type: 'internal', status: hour > 17 ? 'done' : hour === 17 ? 'now' : 'upcoming', source: 'google' },
  ]

  return NextResponse.json({ meetings })
}
