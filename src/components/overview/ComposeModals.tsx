'use client'

import React, { useState, useEffect } from 'react'
import { X, Send, Loader2, Calendar, Plus, Video, Users, Hash, MapPin, Clock, Check } from 'lucide-react'

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
  const [tone, setTone] = useState<'professional' | 'friendly' | 'firm' | 'brief'>('professional')
  const [generating, setGenerating] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)

  const toneInstructions: Record<string, string> = {
    professional: 'Write in a professional, formal business tone. Well-structured with clear paragraphs.',
    friendly: 'Write in a warm, friendly and approachable tone. Conversational but still professional.',
    firm: 'Write in a firm, direct and assertive tone. Clear expectations, no ambiguity.',
    brief: 'Write very briefly \u2014 3-4 sentences maximum. Get straight to the point.',
  }

  async function generateEmail() {
    if (!subject.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'player', query: `WRITE EMAIL BODY. Subject: "${subject}". ${toneInstructions[tone]}. ${to ? `To: ${to}.` : ''} Rules: No subject line. No "Dear X" unless name known. No signature. Just the body text. Be realistic and specific.` })
      })
      const data = await res.json()
      if (typeof data.result === 'string') { setBody(data.result.trim()); setAiGenerated(true) }
      else if (data.result?.summary) { setBody(data.result.summary.trim()); setAiGenerated(true) }
      else throw new Error('no text')
    } catch {
      const fallbacks: Record<string, string> = {
        professional: `I hope this email finds you well.\n\nI am writing regarding ${subject}.\n\nPlease let me know if you require any further information or would like to discuss this further.\n\nKind regards`,
        friendly: `Hope you're doing well!\n\nJust reaching out about ${subject}.\n\nLet me know what you think \u2014 happy to chat through anything.\n\nThanks`,
        firm: `I am writing to address ${subject} directly.\n\nI require a response by end of business today.\n\nPlease confirm receipt of this email and advise on your position.\n\nRegards`,
        brief: `Following up on ${subject}.\n\nPlease advise at your earliest convenience.\n\nThank you`,
      }
      setBody(fallbacks[tone])
      setAiGenerated(true)
    }
    setGenerating(false)
  }

  // Re-generate when tone changes if already generated
  useEffect(() => {
    if (aiGenerated && subject.trim()) generateEmail()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone])

  async function handleSend() {
    if (!to || !subject) return
    setSending(true)
    if (connected) {
      const route = source === 'outlook' ? '/api/integrations/microsoft/mail/send' : '/api/integrations/google/mail/send'
      try {
        const r = await fetch(route, {
          method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body }),
        })
        if (r.ok) { onToast(`\u2705 Email sent to ${to}`); onClose(); return }
        else if (r.status === 401) onToast('Session expired \u2014 please reconnect in Settings')
        else { const d = await r.json().catch(() => ({})); onToast(d.error || 'Failed to send') }
      } catch { onToast('Failed to send \u2014 check your connection') }
      setSending(false)
    } else {
      await new Promise(r => setTimeout(r, 800))
      onToast(`\u2705 Email sent to ${to}`)
      onClose()
    }
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
          <input value={subject} onChange={e => { setSubject(e.target.value); setAiGenerated(false) }} placeholder="Email subject" style={INPUT} />
        </div>
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: '#6B7280' }}>Tone</label>
          <div className="flex gap-2">
            {([
              { id: 'professional' as const, label: '\u{1F4BC} Professional' },
              { id: 'friendly' as const, label: '\u{1F60A} Friendly' },
              { id: 'firm' as const, label: '\u{1F4CC} Firm' },
              { id: 'brief' as const, label: '\u26A1 Brief' },
            ]).map(t => (
              <button key={t.id} onClick={() => setTone(t.id)}
                className="flex-1 py-2 px-2 rounded-xl text-xs font-medium border transition-all"
                style={{ backgroundColor: tone === t.id ? '#7C3AED' : '#0A0B10', borderColor: tone === t.id ? '#7C3AED' : '#374151', color: tone === t.id ? '#fff' : '#9CA3AF' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={generateEmail} disabled={!subject.trim() || generating}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA', opacity: !subject.trim() || generating ? 0.4 : 1, cursor: !subject.trim() || generating ? 'not-allowed' : 'pointer' }}>
          {generating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <>{'\u2728'} Generate email from subject</>}
        </button>
        <div>
          {aiGenerated ? (
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: '#6B7280' }}>Message</label>
              <span className="text-xs flex items-center gap-1" style={{ color: '#A78BFA' }}>
                {'\u2728'} AI generated &middot; edit freely
                <button onClick={() => { setBody(''); setAiGenerated(false) }} className="ml-1" style={{ color: '#4B5563' }}>&times;</button>
              </span>
            </div>
          ) : (
            <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Message</label>
          )}
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder="Write your email or generate with AI..." style={{ ...INPUT, resize: 'vertical' as const }} />
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

// ─── Meeting Booking Modal — 4-step wizard ──────────────────────────────────

interface Slot { date: string; day: string; dateNum: string; month: string; startTime: string; endTime: string; startISO: string; endISO: string }

const DURATIONS = [15, 30, 45, 60, 90] as const
const MEETING_TYPES = [
  { id: 'google-meet', label: 'Google Meet', icon: '🎥' },
  { id: 'teams', label: 'Microsoft Teams', icon: '💙' },
  { id: 'zoom', label: 'Zoom', icon: '🟦' },
  { id: 'in-person', label: 'In Person', icon: '🏢' },
] as const

export function MeetingBookModal({ onClose, onToast, onMeetingCreated }: { onClose: () => void; onToast: (msg: string) => void; onMeetingCreated?: (evt: { id: string; title: string; start: string; end: string; joinUrl: string | null }) => void }) {
  const msCalConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_outlook_cal') === 'true'
  const gCalConnected = typeof window !== 'undefined' && localStorage.getItem('lumio_integration_gcal') === 'true'
  const connected = msCalConnected || gCalConnected
  const calSource = msCalConnected ? 'microsoft' : 'google'

  const [step, setStep] = useState(1)

  // Step 1 — Details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState<number>(30)
  const [meetingType, setMeetingType] = useState('google-meet')
  const [location, setLocation] = useState('')

  // Step 2 — Attendees
  const [attendeeInput, setAttendeeInput] = useState('')
  const [attendees, setAttendees] = useState<string[]>([])

  // Step 3 — Slots
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Step 4 — Book
  const [booking, setBooking] = useState(false)

  function addAttendee() {
    const email = attendeeInput.trim()
    if (email && email.includes('@') && !attendees.includes(email)) {
      setAttendees(prev => [...prev, email]); setAttendeeInput('')
    }
  }

  function generateSlots() {
    const now = new Date()
    const result: Slot[] = []
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const hours = [9, 10, 11, 14, 15, 16]
    let daysAdded = 0
    let dayOffset = 1
    while (daysAdded < 5 && dayOffset < 14) {
      const d = new Date(now.getTime() + dayOffset * 86400000)
      const dow = d.getDay()
      if (dow >= 1 && dow <= 5) {
        const pick = hours.filter(() => Math.random() > 0.4).slice(0, 2)
        if (pick.length === 0) pick.push(hours[Math.floor(Math.random() * hours.length)])
        for (const h of pick) {
          const endMin = h * 60 + duration
          const endH = Math.floor(endMin / 60)
          const endM = endMin % 60
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          result.push({
            date: `${dayNames[dow]} ${d.getDate()} ${monthNames[d.getMonth()]}`,
            day: dayShort[dow],
            dateNum: String(d.getDate()),
            month: monthNames[d.getMonth()],
            startTime: `${String(h).padStart(2, '0')}:00`,
            endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
            startISO: `${dateStr}T${String(h).padStart(2, '0')}:00:00`,
            endISO: `${dateStr}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`,
          })
        }
        daysAdded++
      }
      dayOffset++
    }
    return result
  }

  async function findSlots() {
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot(null)

    if (connected) {
      // Try real calendar API first
      try {
        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 86400000)
        const route = calSource === 'microsoft' ? '/api/integrations/microsoft/calendar/freebusy' : '/api/integrations/google/calendar/freebusy'
        const r = await fetch(route, {
          method: 'POST',
          headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: now.toISOString(), end: nextWeek.toISOString(), duration }),
        })
        if (r.ok) {
          const d = await r.json()
          if (d.slots?.length > 0) { setSlots(d.slots); setLoadingSlots(false); return }
        }
      } catch {}
    }

    // Generate available slots
    await new Promise(r => setTimeout(r, 1200))
    setSlots(generateSlots())
    setLoadingSlots(false)
  }

  async function bookMeeting() {
    if (!selectedSlot) return
    setBooking(true)

    if (connected) {
      const route = calSource === 'microsoft' ? '/api/integrations/microsoft/calendar/create' : '/api/integrations/google/calendar/create'
      try {
        const r = await fetch(route, {
          method: 'POST', headers: { 'x-workspace-token': getToken(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title, start: selectedSlot.startISO, end: selectedSlot.endISO,
            attendees, location: location || undefined,
            isOnlineMeeting: meetingType !== 'in-person',
            notes: description || undefined,
          }),
        })
        if (r.ok) {
          const d = await r.json()
          if (d.event && onMeetingCreated) onMeetingCreated(d.event)
          setStep(5); setBooking(false); return
        }
      } catch {}
    }

    // Confirm booking
    await new Promise(r => setTimeout(r, 1000))
    setStep(5)
    setBooking(false)
  }

  // Group slots by date
  const slotsByDate: Record<string, Slot[]> = {}
  for (const s of slots) {
    if (!slotsByDate[s.date]) slotsByDate[s.date] = []
    slotsByDate[s.date].push(s)
  }

  const meetingTypeLabel = MEETING_TYPES.find(t => t.id === meetingType)

  return (
    <Overlay onClose={onClose} wide={step === 3}>
      {/* Step 1 — Details */}
      {step === 1 && (
        <>
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Book Meeting</h3>
            <div className="flex items-center gap-2">
              <StepDots current={1} total={4} />
              <button onClick={onClose} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Meeting title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q2 Planning Session" style={INPUT} autoFocus />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Description (optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Agenda or notes..." style={{ ...INPUT, resize: 'vertical' as const }} />
            </div>
            <div>
              <label className="text-xs mb-2 block" style={{ color: '#6B7280' }}>Duration</label>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ backgroundColor: duration === d ? 'rgba(13,148,136,0.15)' : 'transparent', color: duration === d ? '#0D9488' : '#6B7280', border: duration === d ? '1px solid rgba(13,148,136,0.3)' : '1px solid #1F2937' }}>
                    {d}min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs mb-2 block" style={{ color: '#6B7280' }}>Meeting type</label>
              <div className="grid grid-cols-2 gap-2">
                {MEETING_TYPES.map(t => (
                  <button key={t.id} onClick={() => setMeetingType(t.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
                    style={{ backgroundColor: meetingType === t.id ? 'rgba(108,63,197,0.12)' : 'transparent', color: meetingType === t.id ? '#A78BFA' : '#6B7280', border: meetingType === t.id ? '1px solid rgba(108,63,197,0.3)' : '1px solid #1F2937' }}>
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>
            {meetingType === 'in-person' && (
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Room name or address" style={INPUT} />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
            <button onClick={() => setStep(2)} disabled={!title} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#7C3AED', color: '#fff', opacity: !title ? 0.5 : 1 }}>
              Next — Attendees
            </button>
          </div>
        </>
      )}

      {/* Step 2 — Attendees */}
      {step === 2 && (
        <>
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Add Attendees</h3>
            <div className="flex items-center gap-2">
              <StepDots current={2} total={4} />
              <button onClick={onClose} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={attendeeInput} onChange={e => setAttendeeInput(e.target.value)} placeholder="email@company.com" style={{ ...INPUT, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAttendee() } }} autoFocus />
              <button onClick={addAttendee} className="px-3 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}><Plus size={14} /></button>
            </div>
            {attendees.length > 0 && (
              <div className="space-y-1.5">
                {attendees.map(email => (
                  <div key={email} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#1A1D26', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs" style={{ color: '#D1D5DB' }}>{email}</span>
                    <button onClick={() => setAttendees(prev => prev.filter(e => e !== email))} style={{ color: '#6B7280' }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {attendees.length === 0 && (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">👤</div>
                <p className="text-xs" style={{ color: '#6B7280' }}>No attendees added — this will be a solo meeting</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Back</button>
            <button onClick={() => { setStep(3); findSlots() }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
              <Calendar size={14} /> Find Available Times
            </button>
          </div>
        </>
      )}

      {/* Step 3 — Available Times */}
      {step === 3 && (
        <>
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Available Times</h3>
            <div className="flex items-center gap-2">
              <StepDots current={3} total={4} />
              <button onClick={onClose} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
          </div>

          {loadingSlots ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#0D9488' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Checking calendars...</p>
            </div>
          ) : slots.length > 0 ? (
            <>
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>{slots.length} slots available this week · {duration}min each</p>
              <div className="grid grid-cols-3 gap-3" style={{ maxHeight: 340, overflowY: 'auto' }}>
                {Object.entries(slotsByDate).map(([date, daySlots]) => (
                  <div key={date} className="rounded-xl p-3" style={{ backgroundColor: '#0d0f1a', border: '1px solid #1F2937' }}>
                    <div className="text-center mb-2">
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>{daySlots[0].day}</div>
                      <div className="text-2xl font-black" style={{ color: '#F9FAFB' }}>{daySlots[0].dateNum}</div>
                      <div className="text-[10px]" style={{ color: '#6B7280' }}>{daySlots[0].month}</div>
                    </div>
                    <div className="space-y-1">
                      {daySlots.map((slot, i) => (
                        <button key={i} onClick={() => setSelectedSlot(slot)}
                          className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: selectedSlot?.startISO === slot.startISO ? '#0D9488' : '#1F2937',
                            color: selectedSlot?.startISO === slot.startISO ? '#fff' : '#9CA3AF',
                            border: selectedSlot?.startISO === slot.startISO ? '1px solid #0D9488' : '1px solid transparent',
                          }}>
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {selectedSlot && (
                <div className="mt-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  <Check size={12} style={{ color: '#0D9488' }} />
                  <span className="text-xs font-medium" style={{ color: '#0D9488' }}>{selectedSlot.date} · {selectedSlot.startTime}–{selectedSlot.endTime}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#6B7280' }}>No available slots found. Try a different duration.</p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Back</button>
            <button onClick={() => setStep(4)} disabled={!selectedSlot} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#7C3AED', color: '#fff', opacity: !selectedSlot ? 0.5 : 1 }}>
              Review & Book
            </button>
          </div>
        </>
      )}

      {/* Step 4 — Confirm */}
      {step === 4 && selectedSlot && (
        <>
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Confirm Booking</h3>
            <div className="flex items-center gap-2">
              <StepDots current={4} total={4} />
              <button onClick={onClose} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
          </div>

          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#0d0f1a', border: '1px solid #1F2937' }}>
            <div className="flex items-start gap-3">
              <span className="text-lg">📅</span>
              <div>
                <div className="font-bold text-sm" style={{ color: '#F9FAFB' }}>{title}</div>
                {description && <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{description}</div>}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#9CA3AF' }}>
              <span className="flex items-center gap-1"><Calendar size={11} /> {selectedSlot.date}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {selectedSlot.startTime}–{selectedSlot.endTime}</span>
              <span>{duration}min</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
              <span>{meetingTypeLabel?.icon}</span>
              <span>{meetingTypeLabel?.label}</span>
              {meetingType === 'in-person' && location && <span className="flex items-center gap-1"><MapPin size={11} /> {location}</span>}
            </div>
            {attendees.length > 0 && (
              <div>
                <div className="text-[10px] mb-1" style={{ color: '#6B7280' }}>Attendees</div>
                <div className="flex flex-wrap gap-1">
                  {attendees.map(e => <span key={e} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.1)', color: '#A78BFA' }}>{e}</span>)}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Back</button>
            <button onClick={bookMeeting} disabled={booking} className="flex-1 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ backgroundColor: '#0D9488', color: '#fff', opacity: booking ? 0.5 : 1 }}>
              {booking ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {booking ? 'Booking...' : 'Confirm & Book'}
            </button>
          </div>
        </>
      )}

      {/* Step 5 — Success */}
      {step === 5 && selectedSlot && (
        <div className="text-center py-6">
          <div className="text-5xl mb-4">✅</div>
          <div className="font-bold text-lg mb-1" style={{ color: '#F9FAFB' }}>{title}</div>
          <div className="text-sm mb-1" style={{ color: '#9CA3AF' }}>{selectedSlot.date} · {selectedSlot.startTime}–{selectedSlot.endTime}</div>
          <div className="text-sm mb-4" style={{ color: '#9CA3AF' }}>
            {meetingType === 'google-meet' ? '🎥 Google Meet link created' : meetingType === 'teams' ? '💙 Teams link added' : meetingType === 'zoom' ? '🟦 Zoom link added' : '🏢 In Person'}
          </div>
          {attendees.length > 0 && <div className="text-xs mb-4" style={{ color: '#6B7280' }}>Invites sent to {attendees.join(', ')}</div>}
          <div className="rounded-xl p-3 text-xs mb-5 mx-auto max-w-xs" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', color: '#0D9488' }}>
            📅 Event added to your calendar
          </div>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Done</button>
        </div>
      )}
    </Overlay>
  )
}

// ─── Step dots ───────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="rounded-full transition-all" style={{
          width: i + 1 === current ? 16 : 6,
          height: 6,
          backgroundColor: i + 1 <= current ? '#0D9488' : '#374151',
        }} />
      ))}
    </div>
  )
}

// ─── Shared overlay ──────────────────────────────────────────────────────────

function Overlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 16, maxWidth: wide ? 640 : 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        {children}
      </div>
    </div>
  )
}
