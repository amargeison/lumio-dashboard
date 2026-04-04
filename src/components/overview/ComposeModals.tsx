'use client'

import React, { useState, useEffect } from 'react'
import { X, Send, Loader2, Calendar, Plus, Video, Users, Hash } from 'lucide-react'

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
    if (!connected) {
      await new Promise(r => setTimeout(r, 600))
      onToast('Email sent (demo mode)'); onClose(); setSending(false); return
    }
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

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>New Email</h3>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: source === 'outlook' ? 'rgba(96,165,250,0.15)' : 'rgba(239,68,68,0.15)', color: source === 'outlook' ? '#60A5FA' : '#EF4444' }}>
              via {source === 'outlook' ? 'Outlook' : 'Gmail'}
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>Demo</span>
          )}
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

const DEPARTMENTS = ['HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'IT', 'Support', 'Success', 'Partners', 'Strategy', 'Projects']

export function MeetingBookModal({ onClose, onToast, onMeetingCreated }: { onClose: () => void; onToast: (msg: string) => void; onMeetingCreated?: (evt: { id: string; title: string; start: string; end: string; joinUrl: string | null }) => void }) {
  const msCalConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_outlook_cal') === 'true'
  const gCalConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_gcal') === 'true'
  const slackConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_slack') === 'true'
  const teamsConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_teams') === 'true'
  const connected = msCalConnected || gCalConnected
  const source = msCalConnected ? 'microsoft' : 'google'

  const today = new Date().toISOString().split('T')[0]
  const nowHour = new Date().getHours()
  const defaultStart = `${String(nowHour + 1).padStart(2, '0')}:00`
  const defaultEnd = `${String(nowHour + 1).padStart(2, '0')}:30`

  const [meetingType, setMeetingType] = useState<'personal' | 'team'>('personal')
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

  // Team event fields
  const [inviteAll, setInviteAll] = useState(false)
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [postToSlack, setPostToSlack] = useState(false)
  const [postToTeams, setPostToTeams] = useState(false)
  const [staffEmails, setStaffEmails] = useState<string[]>([])

  useEffect(() => {
    if (meetingType !== 'team') return
    try {
      const staff: { email?: string; department?: string }[] = [] // Staff now comes from Supabase, not localStorage
      if (inviteAll) {
        setStaffEmails(staff.filter(s => s.email).map(s => s.email!))
      } else if (selectedDepts.length > 0) {
        const deptLower = selectedDepts.map(d => d.toLowerCase())
        setStaffEmails(staff.filter(s => s.email && deptLower.some(d => (s.department || '').toLowerCase().includes(d))).map(s => s.email!))
      } else {
        setStaffEmails([])
      }
    } catch { setStaffEmails([]) }
  }, [meetingType, inviteAll, selectedDepts])

  function addAttendee() {
    const email = attendeeInput.trim()
    if (email && email.includes('@') && !attendees.includes(email)) {
      setAttendees(prev => [...prev, email]); setAttendeeInput('')
    }
  }

  function toggleDept(dept: string) {
    setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])
    setInviteAll(false)
  }

  async function handleBook() {
    if (!title || !date || !startTime || !endTime) return
    setBooking(true)
    if (!connected) {
      await new Promise(r => setTimeout(r, 600))
      onToast('Meeting booked (demo mode)'); onClose(); setBooking(false); return
    }
    const start = `${date}T${startTime}:00`
    const end = `${date}T${endTime}:00`
    const allAttendees = meetingType === 'team' ? staffEmails : attendees
    const route = source === 'microsoft' ? '/api/integrations/microsoft/calendar/create' : '/api/integrations/google/calendar/create'

    try {
      const r = await fetch(route, {
        method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, start, end, attendees: allAttendees, location: location || undefined, isOnlineMeeting: onlineMeeting, notes: notes || undefined }),
      })

      if (r.ok) {
        const d = await r.json()
        const inviteCount = allAttendees.length

        // Post to Slack if toggled
        if (postToSlack && slackConnected) {
          fetch('/api/integrations/slack/post', {
            method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: 'general', text: `📅 *Team Event: ${title}*\n${date} ${startTime}–${endTime}\n${notes || ''}${d.event?.joinUrl ? `\nJoin: ${d.event.joinUrl}` : ''}` }),
          }).catch(() => {})
        }

        // Post to Teams if toggled
        if (postToTeams && teamsConnected) {
          fetch('/api/integrations/microsoft/teams/post', {
            method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `📅 Team Event: ${title}\n${date} ${startTime}–${endTime}\n${notes || ''}${d.event?.joinUrl ? `\nJoin: ${d.event.joinUrl}` : ''}` }),
          }).catch(() => {})
        }

        onToast(meetingType === 'team' ? `Team event created and ${inviteCount} invite${inviteCount !== 1 ? 's' : ''} sent` : 'Meeting booked! Invites sent to attendees')
        if (d.event && onMeetingCreated) onMeetingCreated(d.event)
        onClose()
      } else if (r.status === 401) { onToast(`Reconnect ${source === 'microsoft' ? 'Outlook Calendar' : 'Google Calendar'} in Settings`) }
      else { const d = await r.json().catch(() => ({})); onToast(d.error || 'Failed to book meeting') }
    } catch { onToast('Failed to book meeting') }
    setBooking(false)
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Book Meeting</h3>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: source === 'microsoft' ? 'rgba(0,164,239,0.15)' : 'rgba(66,133,244,0.15)', color: source === 'microsoft' ? '#00A4EF' : '#4285F4' }}>
              via {source === 'microsoft' ? 'Outlook' : 'Google'}
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>Demo</span>
          )}
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={16} /></button>
        </div>
      </div>

      {/* Meeting type toggle */}
      <div className="flex gap-2 mb-4">
        {(['personal', 'team'] as const).map(t => (
          <button key={t} onClick={() => setMeetingType(t)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: meetingType === t ? 'rgba(108,63,197,0.15)' : 'transparent', color: meetingType === t ? '#A78BFA' : '#6B7280', border: meetingType === t ? '1px solid rgba(108,63,197,0.3)' : '1px solid #1F2937' }}>
            {t === 'personal' ? <Calendar size={12} /> : <Users size={12} />}
            {t === 'personal' ? 'Personal Meeting' : 'Team Event'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={meetingType === 'team' ? 'e.g. Team Standup, All-Hands' : 'Meeting title'} style={INPUT} autoFocus />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={INPUT} /></div>
          <div><label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Start</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={INPUT} /></div>
          <div><label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>End</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={INPUT} /></div>
        </div>

        {meetingType === 'personal' ? (
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
        ) : (
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Who to invite</label>
            <div className="flex items-center justify-between mb-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>All Staff</span>
              <button onClick={() => { setInviteAll(!inviteAll); if (!inviteAll) setSelectedDepts([]) }} className="flex-shrink-0" style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: inviteAll ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 2, left: inviteAll ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
            {!inviteAll && (
              <div className="flex flex-wrap gap-1.5">
                {DEPARTMENTS.map(d => (
                  <button key={d} onClick={() => toggleDept(d)} className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: selectedDepts.includes(d) ? 'rgba(108,63,197,0.15)' : 'transparent', color: selectedDepts.includes(d) ? '#A78BFA' : '#6B7280', border: selectedDepts.includes(d) ? '1px solid rgba(108,63,197,0.3)' : '1px solid #1F2937' }}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            {staffEmails.length > 0 && <p className="text-[10px] mt-1.5" style={{ color: '#0D9488' }}>{staffEmails.length} staff will be invited</p>}
          </div>
        )}

        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Location (optional)</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Room / address / link" style={INPUT} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Video size={14} style={{ color: '#9CA3AF' }} /><span className="text-xs" style={{ color: '#9CA3AF' }}>Online meeting ({source === 'microsoft' ? 'Teams' : 'Google Meet'})</span></div>
          <button onClick={() => setOnlineMeeting(!onlineMeeting)} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: onlineMeeting ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: onlineMeeting ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>

        {/* Team event: post to channels */}
        {meetingType === 'team' && (
          <div className="space-y-2">
            {slackConnected && (
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2"><Hash size={12} style={{ color: '#9CA3AF' }} /><span className="text-xs" style={{ color: '#9CA3AF' }}>Post to Slack</span></div>
                <button onClick={() => setPostToSlack(!postToSlack)} className="flex-shrink-0" style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: postToSlack ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 2, left: postToSlack ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
            )}
            {teamsConnected && (
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2"><Users size={12} style={{ color: '#9CA3AF' }} /><span className="text-xs" style={{ color: '#9CA3AF' }}>Post to Teams</span></div>
                <button onClick={() => setPostToTeams(!postToTeams)} className="flex-shrink-0" style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: postToTeams ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 2, left: postToTeams ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                </button>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>{meetingType === 'team' ? 'Agenda' : 'Notes'} (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={meetingType === 'team' ? 'Event agenda or description...' : 'Meeting agenda or notes...'} style={{ ...INPUT, resize: 'vertical' as const }} />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
        <button onClick={handleBook} disabled={booking || !title || (meetingType === 'team' && staffEmails.length === 0)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ backgroundColor: '#7C3AED', color: '#fff', opacity: booking || !title ? 0.5 : 1 }}>
          {booking ? <Loader2 size={14} className="animate-spin" /> : meetingType === 'team' ? <Users size={14} /> : <Calendar size={14} />}
          {booking ? 'Booking...' : meetingType === 'team' ? 'Create Team Event' : 'Book Meeting'}
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
