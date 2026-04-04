'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, X, Search, Check, Video, Users } from 'lucide-react'

const CARD = '#121320'
const BORDER = '#1E2035'
const PURPLE = '#8B5CF6'

interface Contact { first_name?: string; last_name?: string; email?: string; company?: string }
interface Slot { date: string; time: string; duration: string; label: string }

const MEETING_TYPES = ['Discovery Call', 'Demo', 'Follow-up', 'Proposal Review', 'Check-in', 'Onboarding', 'Custom']
const DURATIONS = ['15 min', '30 min', '45 min', '60 min', '90 min']
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const DEMO_MEETINGS = [
  { day: 1, hour: 9, title: 'Team Standup', duration: 0.5 },
  { day: 2, hour: 11, title: 'Client Demo — Apex', duration: 1 },
  { day: 3, hour: 14, title: 'Investor Call', duration: 1 },
  { day: 4, hour: 10, title: 'Pipeline Review', duration: 0.75 },
]

export default function CalendarPage() {
  const [showScheduler, setShowScheduler] = useState(false)
  const [step, setStep] = useState(1)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [manualName, setManualName] = useState('')
  const [meetingType, setMeetingType] = useState('')
  const [duration, setDuration] = useState('30 min')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const calConnected = typeof window !== 'undefined' && (localStorage.getItem('lumio_integration_gcal') === 'true' || localStorage.getItem('lumio_integration_outlook_cal') === 'true')
  const demoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'

  useEffect(() => {
    try { setContacts(JSON.parse(localStorage.getItem('lumio_crm_contacts') || '[]')) } catch { /* ignore */ }
  }, [])

  async function findSlots() {
    setLoadingSlots(true)
    try {
      const attendee = selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : manualName
      const res = await fetch('/api/ai/meeting-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration, meetingType, attendee }),
      })
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots || [])
        setStep(4)
      }
    } catch { /* ignore */ }
    setLoadingSlots(false)
  }

  function resetScheduler() { setStep(1); setSelectedContact(null); setManualName(''); setMeetingType(''); setDuration('30 min'); setSlots([]); setSelectedSlot(null); setConfirmed(false) }

  const attendeeName = selectedContact ? `${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim() : manualName
  const filteredContacts = contacts.filter(c => { const s = contactSearch.toLowerCase(); return !s || (c.first_name || '').toLowerCase().includes(s) || (c.last_name || '').toLowerCase().includes(s) })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Calendar</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7299' }}>AI-powered meeting scheduler</p>
        </div>
        <button onClick={() => { resetScheduler(); setShowScheduler(true) }} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB' }}>
          <Calendar size={16} /> Schedule Meeting
        </button>
      </div>

      {/* Weekly calendar grid */}
      <div className="rounded-xl overflow-hidden relative" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>This Week</p>
          {!calConnected && !demoActive && <span className="text-xs" style={{ color: '#6B7299' }}>No calendar connected</span>}
        </div>
        <div className="relative">
          <div className="grid" style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}>
            {/* Header */}
            <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '8px 0' }} />
            {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: '#6B7299', borderBottom: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}>{d}</div>)}
            {/* Hours */}
            {HOURS.map(h => (
              <div key={h} style={{ display: 'contents' }}>
                <div className="text-xs text-right pr-2 py-3" style={{ color: '#4B5563', borderBottom: `1px solid ${BORDER}` }}>{h}</div>
                {DAYS.map((_, di) => <div key={di} style={{ borderBottom: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}`, minHeight: 48, position: 'relative' }} />)}
              </div>
            ))}
          </div>
          {/* Demo meetings overlay */}
          {demoActive && DEMO_MEETINGS.map((m, i) => (
            <div key={i} className="absolute rounded-lg px-2 py-1 text-xs font-semibold" style={{
              left: `calc(60px + ${(m.day - 1) * 20}% + 4px)`, width: 'calc(20% - 8px)',
              top: `calc(33px + ${(m.hour - 9) * 48}px + 4px)`, height: `${m.duration * 48 - 8}px`,
              backgroundColor: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#A78BFA',
            }}>
              {m.title}
            </div>
          ))}
          {/* Empty overlay */}
          {!calConnected && !demoActive && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(15,16,25,0.85)' }}>
              <div className="text-center">
                <Calendar size={32} style={{ color: PURPLE, margin: '0 auto 12px' }} />
                <p className="text-sm font-semibold mb-1" style={{ color: '#F1F3FA' }}>Connect your calendar</p>
                <p className="text-xs" style={{ color: '#6B7299' }}>Connect Google Calendar or Outlook to see your meetings</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scheduler modal */}
      {showScheduler && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowScheduler(false)}>
          <div className="rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ backgroundColor: '#0F1019', border: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-bold" style={{ color: '#F1F3FA' }}>Schedule Meeting — Step {Math.min(step, 5)}/5</p>
              <button onClick={() => setShowScheduler(false)} style={{ color: '#6B7299' }}><X size={18} /></button>
            </div>
            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Who is this with?</p>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                    <Search size={14} style={{ color: '#6B7299' }} />
                    <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search contacts..." className="bg-transparent outline-none flex-1 text-sm" style={{ color: '#F1F3FA' }} />
                  </div>
                  {filteredContacts.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {filteredContacts.slice(0, 5).map((c, i) => (
                        <button key={i} onClick={() => { setSelectedContact(c); setStep(2) }} className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                          <span className="text-xs font-semibold" style={{ color: '#F1F3FA' }}>{c.first_name} {c.last_name}</span>
                          {c.company && <span className="text-xs" style={{ color: '#6B7299' }}>· {c.company}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Or type name/email..." className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#F1F3FA' }} />
                  <button onClick={() => setStep(2)} disabled={!selectedContact && !manualName} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB', opacity: !selectedContact && !manualName ? 0.4 : 1 }}>Next</button>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Meeting type</p>
                  <div className="flex flex-wrap gap-2">
                    {MEETING_TYPES.map(t => (
                      <button key={t} onClick={() => { setMeetingType(t); setStep(3) }} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: meetingType === t ? PURPLE : CARD, color: meetingType === t ? '#F9FAFB' : '#9CA3AF', border: `1px solid ${meetingType === t ? PURPLE : BORDER}` }}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Duration</p>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map(d => (
                      <button key={d} onClick={() => setDuration(d)} className="px-4 py-2 rounded-full text-xs font-semibold" style={{ backgroundColor: duration === d ? PURPLE : CARD, color: duration === d ? '#F9FAFB' : '#9CA3AF', border: `1px solid ${duration === d ? PURPLE : BORDER}` }}>{d}</button>
                    ))}
                  </div>
                  <button onClick={findSlots} disabled={loadingSlots} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: PURPLE, color: '#F9FAFB', opacity: loadingSlots ? 0.5 : 1 }}>
                    {loadingSlots ? 'Finding slots...' : 'Find Available Slots'}
                  </button>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Available slots</p>
                  <div className="space-y-2">
                    {slots.map((s, i) => (
                      <button key={i} onClick={() => { setSelectedSlot(s); setStep(5) }} className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-left" style={{ backgroundColor: selectedSlot === s ? 'rgba(139,92,246,0.12)' : CARD, border: `1px solid ${selectedSlot === s ? PURPLE : BORDER}` }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>{s.date}</p>
                          <p className="text-xs" style={{ color: '#6B7299' }}>{s.time} · {s.duration}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 5 && selectedSlot && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Confirm meeting</p>
                  <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center gap-2"><Users size={14} style={{ color: '#6B7299' }} /><span className="text-sm" style={{ color: '#F1F3FA' }}>{attendeeName}</span></div>
                    <div className="flex items-center gap-2"><Video size={14} style={{ color: '#6B7299' }} /><span className="text-sm" style={{ color: '#F1F3FA' }}>{meetingType}</span></div>
                    <div className="flex items-center gap-2"><Calendar size={14} style={{ color: '#6B7299' }} /><span className="text-sm" style={{ color: '#F1F3FA' }}>{selectedSlot.date} at {selectedSlot.time}</span></div>
                    <div className="flex items-center gap-2"><Clock size={14} style={{ color: '#6B7299' }} /><span className="text-sm" style={{ color: '#F1F3FA' }}>{selectedSlot.duration}</span></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setConfirmed(true); setToast(`Invite sent to ${attendeeName}`); setTimeout(() => { setToast(null); setShowScheduler(false) }, 2000) }} className="w-full py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2" style={{ backgroundColor: confirmed ? '#22C55E' : PURPLE, color: '#F9FAFB' }}>
                      {confirmed ? <><Check size={14} /> Sent!</> : 'Send invite'}
                    </button>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl text-xs" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#9CA3AF' }}>Copy meeting link</button>
                      <button className="flex-1 py-2 rounded-xl text-xs" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#9CA3AF' }}>Add to calendar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10000, backgroundColor: PURPLE, color: '#F9FAFB', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
