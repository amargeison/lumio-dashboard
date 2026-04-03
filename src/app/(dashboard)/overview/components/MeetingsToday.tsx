'use client'

import { useState, useEffect } from 'react'

interface Meeting {
  id: string
  title: string
  time: string
  duration: string
  attendees: string[]
  location: string
  type: 'call' | 'in-person' | 'video' | 'internal'
  status: 'upcoming' | 'now' | 'done'
  link?: string
  source: 'google' | 'outlook' | 'manual'
}

const TYPE_ICON = { call: '📞', 'in-person': '🤝', video: '📹', internal: '💬' }
const SOURCE_BADGE = { google: 'Google Cal', outlook: 'Outlook', manual: 'Lumio' }

const MOCK_MEETINGS: Meeting[] = [
  { id: '1', title: 'The Feed Network — Weekly Check-in', time: '09:00', duration: '30 min', attendees: ['Sarah M.', 'James T.'], location: 'Google Meet', type: 'video', status: 'done', source: 'google', link: 'https://meet.google.com' },
  { id: '2', title: 'New Customer Demo — Oakridge Schools', time: '11:00', duration: '45 min', attendees: ['Charlotte D.', 'Oliver B.'], location: 'Zoom', type: 'video', status: 'upcoming', source: 'google', link: 'https://zoom.us' },
  { id: '3', title: 'Investor Update Call', time: '14:00', duration: '60 min', attendees: ['James Hartley'], location: 'Google Meet', type: 'call', status: 'upcoming', source: 'outlook', link: 'https://meet.google.com' },
  { id: '4', title: 'Team Standup', time: '17:00', duration: '15 min', attendees: ['All team'], location: 'Slack Huddle', type: 'internal', status: 'upcoming', source: 'google' },
]

export default function MeetingsToday() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    fetch('/api/home/meetings', {
      headers: token ? { 'x-workspace-token': token } : {},
    })
      .then(r => r.json())
      .then(d => setMeetings(d.meetings || MOCK_MEETINGS))
      .catch(() => setMeetings(MOCK_MEETINGS))
      .finally(() => setLoading(false))
  }, [])

  const live = meetings.find(m => m.status === 'now')

  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#F9FAFB' }}>
          📅 Meetings Today
        </h3>
        <span className="text-xs" style={{ color: '#6B7280' }}>{meetings.length} scheduled</span>
      </div>

      {live && (
        <div className="mb-3 rounded-xl p-3 flex items-center gap-3"
          style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#4ADE80' }}>{live.title}</p>
            <p className="text-xs" style={{ color: 'rgba(74,222,128,0.6)' }}>Happening now · {live.duration}</p>
          </div>
          {live.link && (
            <a href={live.link} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors"
              style={{ backgroundColor: '#16A34A' }}>
              Join →
            </a>
          )}
        </div>
      )}

      <div className="space-y-1">
        {meetings.map(m => (
          <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors"
            style={{ opacity: m.status === 'done' ? 0.4 : 1 }}>
            <div className="text-center flex-shrink-0 w-12">
              <div className="text-sm font-bold" style={{ color: '#E5E7EB' }}>{m.time}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>{m.duration}</div>
            </div>
            <span className="text-base flex-shrink-0">{TYPE_ICON[m.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{
                color: m.status === 'done' ? '#6B7280' : '#F9FAFB',
                textDecoration: m.status === 'done' ? 'line-through' : 'none',
              }}>
                {m.title}
              </p>
              <p className="text-xs truncate" style={{ color: '#6B7280' }}>
                {m.attendees.join(', ')} · {m.location}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs" style={{ color: '#374151' }}>{SOURCE_BADGE[m.source]}</span>
              {m.link && m.status !== 'done' && (
                <a href={m.link} target="_blank" rel="noopener noreferrer"
                  className="px-2 py-1 text-xs rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>
                  Join
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {meetings.length === 0 && !loading && (
        <div className="text-center py-6" style={{ color: '#6B7280' }}>
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm">No meetings today — deep work time!</p>
        </div>
      )}
    </div>
  )
}
