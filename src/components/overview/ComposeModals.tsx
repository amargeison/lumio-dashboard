'use client'

import React, { useState } from 'react'
import { X, Send, Loader2, Calendar, Plus, Video } from 'lucide-react'

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : '' }

const INPUT = { backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%' } as const

// ─── Email Compose Modal ─────────────────────────────────────────────────────

export function EmailComposeModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const outlookConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_outlook') === 'true'
  const gmailConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_gmail') === 'true'
  const connected = outlookConnected || gmailConnected
  const source = outlookConnected ? 'outlook' : 'gmail'

  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!to || !subject) return
    setSending(true)
    const route = source === 'outlook' ? '/api/integrations/microsoft/mail/send' : '/api/integrations/google/mail/send'
    try {
      const r = await fetch(route, {
        method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body }),
      })
      if (r.ok) { onToast('Email sent!'); onClose() }
      else if (r.status === 401) onToast(`Reconnect ${source === 'outlook' ? 'Outlook' : 'Gmail'} in Settings`)
      else { const d = await r.json().catch(() => ({})); onToast(d.error || 'Failed to send') }
    } catch { onToast('Failed to send') }
    setSending(false)
  }

  if (!connected) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-6">
          <div className="text-4xl mb-4">📧</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Connect your email</h3>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Connect Outlook or Gmail in Settings to send emails from Lumio.</p>
          <a href="/settings" className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#7C3AED', color: '#fff', textDecoration: 'none' }}>Go to Settings</a>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>New Email</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: source === 'outlook' ? 'rgba(96,165,250,0.15)' : 'rgba(239,68,68,0.15)', color: source === 'outlook' ? '#60A5FA' : '#EF4444' }}>
            via {source === 'outlook' ? 'Outlook' : 'Gmail'}
          </span>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={16} /></button>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>To</label>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@email.com" style={INPUT} autoFocus />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" style={INPUT} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder="Write your email..." style={{ ...INPUT, resize: 'vertical' as const }} />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
        <button onClick={handleSend} disabled={sending || !to || !subject} className="flex-1 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ backgroundColor: '#7C3AED', color: '#fff', opacity: sending || !to || !subject ? 0.5 : 1 }}>
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {sending ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </Overlay>
  )
}

// ─── Meeting Booking Modal ───────────────────────────────────────────────────

export function MeetingBookModal({ onClose, onToast, onMeetingCreated }: { onClose: () => void; onToast: (msg: string) => void; onMeetingCreated?: (evt: { id: string; title: string; start: string; end: string; joinUrl: string | null }) => void }) {
  const msCalConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_outlook_cal') === 'true'
  const gCalConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_gcal') === 'true'
  const connected = msCalConnected || gCalConnected
  const source = msCalConnected ? 'microsoft' : 'google'

  const today = new Date().toISOString().split('T')[0]
  const nowHour = new Date().getHours()
  const defaultStart = `${String(nowHour + 1).padStart(2, '0')}:00`
  const defaultEnd = `${String(nowHour + 1).padStart(2, '0')}:30`

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState(defaultStart)
  const [endTime, setEndTime] = useState(defaultEnd)
  const [attendeeInput, setAttendeeInput] = useState('')
  const [attendees, setAttendees] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [onlineMeeting, setOnlineMeeting] = useState(true)
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)

  function addAttendee() {
    const email = attendeeInput.trim()
    if (email && email.includes('@') && !attendees.includes(email)) {
      setAttendees(prev => [...prev, email]); setAttendeeInput('')
    }
  }

  async function handleBook() {
    if (!title || !date || !startTime || !endTime) return
    setBooking(true)
    const start = `${date}T${startTime}:00`
    const end = `${date}T${endTime}:00`
    const route = source === 'microsoft' ? '/api/integrations/microsoft/calendar/create' : '/api/integrations/google/calendar/create'
    try {
      const r = await fetch(route, {
        method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, start, end, attendees, location: location || undefined, isOnlineMeeting: onlineMeeting, notes: notes || undefined }),
      })
      if (r.ok) {
        const d = await r.json()
        onToast('Meeting booked! Invites sent to attendees')
        if (d.event && onMeetingCreated) onMeetingCreated(d.event)
        onClose()
      } else if (r.status === 401) { onToast(`Reconnect ${source === 'microsoft' ? 'Outlook Calendar' : 'Google Calendar'} in Settings`) }
      else { const d = await r.json().catch(() => ({})); onToast(d.error || 'Failed to book meeting') }
    } catch { onToast('Failed to book meeting') }
    setBooking(false)
  }

  if (!connected) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-6">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Connect your calendar</h3>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Connect Outlook Calendar or Google Calendar in Settings to book meetings from Lumio.</p>
          <a href="/settings" className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#7C3AED', color: '#fff', textDecoration: 'none' }}>Go to Settings</a>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Book Meeting</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: source === 'microsoft' ? 'rgba(0,164,239,0.15)' : 'rgba(66,133,244,0.15)', color: source === 'microsoft' ? '#00A4EF' : '#4285F4' }}>
            via {source === 'microsoft' ? 'Outlook' : 'Google'}
          </span>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={16} /></button>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting title" style={INPUT} autoFocus />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INPUT} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Start</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={INPUT} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>End</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={INPUT} />
          </div>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Attendees</label>
          <div className="flex gap-2">
            <input value={attendeeInput} onChange={e => setAttendeeInput(e.target.value)} placeholder="email@company.com" style={{ ...INPUT, flex: 1 }} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAttendee())} />
            <button onClick={addAttendee} className="px-3 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}><Plus size={14} /></button>
          </div>
          {attendees.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {attendees.map(email => (
                <span key={email} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.1)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.2)' }}>
                  {email} <button onClick={() => setAttendees(prev => prev.filter(e => e !== email))} style={{ color: '#6B7280' }}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Location (optional)</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Room / address" style={INPUT} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video size={14} style={{ color: '#9CA3AF' }} />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              Online meeting ({source === 'microsoft' ? 'Teams' : 'Google Meet'})
            </span>
          </div>
          <button onClick={() => setOnlineMeeting(!onlineMeeting)} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: onlineMeeting ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: onlineMeeting ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Meeting agenda or notes..." style={{ ...INPUT, resize: 'vertical' as const }} />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
        <button onClick={handleBook} disabled={booking || !title} className="flex-1 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ backgroundColor: '#7C3AED', color: '#fff', opacity: booking || !title ? 0.5 : 1 }}>
          {booking ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />} {booking ? 'Booking...' : 'Book Meeting'}
        </button>
      </div>
    </Overlay>
  )
}

// ─── Shared overlay ──────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 16, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        {children}
      </div>
    </div>
  )
}
