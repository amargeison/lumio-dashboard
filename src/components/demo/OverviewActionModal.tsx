'use client'

import { useState } from 'react'
import { X, Check, Loader2 } from 'lucide-react'

const S: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' }
const TEAL = '#0D9488'
const PURPLE = '#6C3FC5'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>{label}</label>{children}</div>
}

function Input({ label, placeholder, defaultValue, type = 'text', value, onChange }: { label: string; placeholder?: string; defaultValue?: string; type?: string; value?: string; onChange?: (v: string) => void }) {
  return <Field label={label}><input type={type} defaultValue={!onChange ? defaultValue : undefined} value={onChange ? value : undefined} onChange={onChange ? e => onChange(e.target.value) : undefined} placeholder={placeholder} style={S} /></Field>
}

function Select({ label, options, value, onChange }: { label: string; options: string[]; value?: string; onChange?: (v: string) => void }) {
  return <Field label={label}><select style={S} value={value} onChange={onChange ? e => onChange(e.target.value) : undefined}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></Field>
}

function Textarea({ label, placeholder, rows = 3, value, onChange }: { label: string; placeholder?: string; rows?: number; value?: string; onChange?: (v: string) => void }) {
  return <Field label={label}><textarea placeholder={placeholder} rows={rows} className="resize-none" style={S} value={onChange ? value : undefined} onChange={onChange ? e => onChange(e.target.value) : undefined} /></Field>
}

function DateInput({ label, value, onChange }: { label: string; value?: string; onChange?: (v: string) => void }) {
  return <Field label={label}><input type="date" style={{ ...S, colorScheme: 'dark' }} value={onChange ? value : undefined} onChange={onChange ? e => onChange(e.target.value) : undefined} /></Field>
}

// All supported actions
const ALL_ACTIONS = [
  'Send Email', 'Send Slack', 'Phone Call', 'Book Meeting', 'Team Events',
  'Claim Expenses', 'Book Holiday', 'Report Sickness',
  'Submit Timesheet', 'Log Remote Day', 'IT Support', 'Request Sign-off',
  'Book Training', 'Request 1-1', 'Raise Issue', 'Post Announcement',
  'Onboard Starter', 'Purchase Request', 'Request Access', 'Log Overtime', 'Run Report',
] as const

type ActionId = typeof ALL_ACTIONS[number]

const TITLES: Record<string, { emoji: string; title: string }> = {
  'Send Email':       { emoji: '\u{1F4E7}', title: 'Send Email' },
  'Send Slack':       { emoji: '\u{1F4AC}', title: 'Send Slack Message' },
  'Phone Call':       { emoji: '\u{1F4DE}', title: 'Log Phone Call' },
  'Book Meeting':     { emoji: '\u{1F4C5}', title: 'Book Meeting' },
  'Team Events':      { emoji: '\u{1F389}', title: 'Create Team Event' },
  'Claim Expenses':   { emoji: '\u{1F4B7}', title: 'Claim Expenses' },
  'Book Holiday':     { emoji: '\u{1F3D6}\u{FE0F}', title: 'Book Holiday' },
  'Report Sickness':  { emoji: '\u{1F912}', title: 'Report Sickness' },
  'Submit Timesheet': { emoji: '\u{1F4DD}', title: 'Submit Timesheet' },
  'Log Remote Day':   { emoji: '\u{1F3E0}', title: 'Log Remote Day' },
  'IT Support':       { emoji: '\u{1F5A8}\u{FE0F}', title: 'IT Support Ticket' },
  'Request Sign-off': { emoji: '\u{1F4C4}', title: 'Request Sign-off' },
  'Book Training':    { emoji: '\u{1F393}', title: 'Book Training' },
  'Request 1-1':      { emoji: '\u{1F91D}', title: 'Request 1-1 Meeting' },
  'Raise Issue':      { emoji: '\u{1F6A8}', title: 'Raise Issue' },
  'Post Announcement':{ emoji: '\u{1F4E2}', title: 'Post Announcement' },
  'Onboard Starter':  { emoji: '\u{1F44B}', title: 'Onboard New Starter' },
  'Purchase Request': { emoji: '\u{1F4E6}', title: 'Purchase Request' },
  'Request Access':   { emoji: '\u{1F511}', title: 'Request Access' },
  'Log Overtime':     { emoji: '\u{23F0}', title: 'Log Overtime' },
  'Run Report':       { emoji: '\u{1F4CA}', title: 'Run Report' },
}

// ─── Book Meeting Wizard ─────────────────────────────────────────────────────

function BookMeetingWizard({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [duration, setDuration] = useState(30)
  const [meetType, setMeetType] = useState('google-meet')
  const [location, setLocation] = useState('')
  const [attendees, setAttendees] = useState<string[]>([])
  const [attendeeInput, setAttendeeInput] = useState('')
  const [slots, setSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(false)

  function addAttendee() {
    if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
      setAttendees([...attendees, attendeeInput.trim()])
      setAttendeeInput('')
    }
  }

  async function findSlots() {
    setStep(3); setLoading(true)
    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'player', query: `CALENDAR: Find ${duration} minute meeting slots for the next 5 business days. Return ONLY a JSON array of 6 slot objects: [{"date":"Monday 7 April","day":"Mon","dateNum":"7","month":"Apr","startTime":"10:00","endTime":"10:30","startISO":"2026-04-07T10:00:00","endISO":"2026-04-07T10:30:00"}]` })
      })
      const data = await res.json()
      if (data.result && Array.isArray(data.result)) { setSlots(data.result); setLoading(false); return }
    } catch { /* fallback */ }
    const now = new Date()
    const fallback = []
    for (let d = 1; d <= 5; d++) {
      const date = new Date(now); date.setDate(date.getDate() + d)
      if (date.getDay() === 0 || date.getDay() === 6) continue
      const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' })
      const day = date.toLocaleDateString('en-GB', { weekday: 'short' })
      const dateNum = String(date.getDate())
      const month = date.toLocaleDateString('en-GB', { month: 'short' })
      const iso = date.toISOString().split('T')[0]
      for (const h of ['09:00', '11:00', '14:30']) {
        const endMin = parseInt(h.split(':')[1]) + duration
        const endH = parseInt(h.split(':')[0]) + Math.floor(endMin / 60)
        const endM = endMin % 60
        const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
        fallback.push({ date: `${dayName} ${dateNum} ${month}`, day, dateNum, month, startTime: h, endTime: end, startISO: `${iso}T${h}:00`, endISO: `${iso}T${end}:00` })
      }
    }
    setSlots(fallback.slice(0, 9))
    setLoading(false)
  }

  function confirmBooking() {
    setBooked(true)
    setTimeout(() => { onToast(`\u2705 Meeting booked \u2014 ${title || 'Meeting'} \u00B7 ${selectedSlot?.date} ${selectedSlot?.startTime}`); onClose() }, 2500)
  }

  const slotsByDate = slots.reduce((acc: Record<string, any[]>, s: any) => { if (!acc[s.date]) acc[s.date] = []; acc[s.date].push(s); return acc }, {})
  const typeIcons: Record<string, string> = { 'google-meet': '\u{1F3A5}', 'teams': '\u{1F499}', 'zoom': '\u{1F7E6}', 'in-person': '\u{1F3E2}' }
  const typeLabels: Record<string, string> = { 'google-meet': 'Google Meet', 'teams': 'Microsoft Teams', 'zoom': 'Zoom', 'in-person': 'In Person' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full rounded-2xl" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#0D0E17', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{'\u{1F4C5}'}</span>
            <h2 className="text-base font-bold" style={{ color: '#F9FAFB' }}>Book Meeting</h2>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: TEAL }}>Step {step}/4</span>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-2">
          {['Details', 'Attendees', 'Find Time', 'Confirm'].map((l, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i + 1 < step ? 'bg-teal-500 text-white' : i + 1 === step ? 'bg-purple-600 text-white' : 'bg-[#1F2937] text-[#6B7280]'}`}>
                  {i + 1 < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-[10px] whitespace-nowrap ${i + 1 === step ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>{l}</span>
              </div>
              {i < 3 && <div className={`h-px w-10 mx-1.5 mb-4 ${i + 1 < step ? 'bg-teal-500' : 'bg-[#1F2937]'}`} />}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Step 1: Details */}
          {step === 1 && <>
            <Input label="Meeting Title" placeholder="Q1 Review with Apex Consulting" value={title} onChange={setTitle} />
            <Textarea label="Description (optional)" placeholder="Agenda items..." value={desc} onChange={setDesc} rows={2} />
            <Field label="Duration">
              <div className="flex gap-2 flex-wrap">
                {[15, 30, 45, 60, 90].map(d => (
                  <button key={d} onClick={() => setDuration(d)} className="px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={{ backgroundColor: duration === d ? TEAL : '#1F2937', color: duration === d ? '#fff' : '#9CA3AF', border: `1px solid ${duration === d ? TEAL : '#374151'}` }}>{d} min</button>
                ))}
              </div>
            </Field>
            <Field label="Meeting Type">
              <div className="grid grid-cols-2 gap-2">
                {(['google-meet', 'teams', 'zoom', 'in-person'] as const).map(t => (
                  <button key={t} onClick={() => setMeetType(t)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all" style={{ backgroundColor: meetType === t ? 'rgba(13,148,136,0.12)' : '#0A0B10', border: `1px solid ${meetType === t ? TEAL : '#374151'}`, color: meetType === t ? '#F9FAFB' : '#9CA3AF' }}>
                    <span>{typeIcons[t]}</span> {typeLabels[t]}
                  </button>
                ))}
              </div>
            </Field>
            {meetType === 'in-person' && <Input label="Location" placeholder="Meeting Room 3, 2nd Floor" value={location} onChange={setLocation} />}
            <button onClick={() => setStep(2)} disabled={!title} className="w-full py-3 rounded-xl text-sm font-bold transition-colors" style={{ backgroundColor: title ? TEAL : '#1F2937', color: title ? '#fff' : '#6B7280' }}>Next &mdash; Add Attendees</button>
          </>}

          {/* Step 2: Attendees */}
          {step === 2 && <>
            <Field label="Add Attendees">
              <div className="flex gap-2">
                <input value={attendeeInput} onChange={e => setAttendeeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAttendee()} placeholder="email@company.com" style={{ ...S, flex: 1 }} />
                <button onClick={addAttendee} className="px-4 rounded-lg text-sm font-bold" style={{ backgroundColor: TEAL, color: '#fff' }}>+</button>
              </div>
            </Field>
            {attendees.length > 0 && (
              <div className="space-y-1">
                {attendees.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <span className="text-sm" style={{ color: '#F9FAFB' }}>{a}</span>
                    <button onClick={() => setAttendees(attendees.filter((_, j) => j !== i))} className="text-xs" style={{ color: '#6B7280' }}>&times;</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs" style={{ color: '#6B7280' }}>Your calendar will be checked automatically</p>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Back</button>
              <button onClick={findSlots} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: TEAL, color: '#fff' }}>Find Available Times</button>
            </div>
            <button onClick={findSlots} className="w-full text-center text-xs" style={{ color: '#6B7280' }}>Skip &mdash; just book for me</button>
          </>}

          {/* Step 3: Available Times */}
          {step === 3 && <>
            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: PURPLE }} /><p className="text-sm" style={{ color: '#9CA3AF' }}>Checking calendars...</p></div>
            ) : (
              <>
                <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Select a time slot:</p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                    <div key={date} className="rounded-xl p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                      <div className="text-center mb-2">
                        <div className="text-xs" style={{ color: '#6B7280' }}>{(dateSlots as any[])[0]?.day}</div>
                        <div className="text-xl font-bold" style={{ color: '#F9FAFB' }}>{(dateSlots as any[])[0]?.dateNum}</div>
                        <div className="text-xs" style={{ color: '#6B7280' }}>{(dateSlots as any[])[0]?.month}</div>
                      </div>
                      <div className="space-y-1.5">
                        {(dateSlots as any[]).map((slot: any, i: number) => (
                          <button key={i} onClick={() => setSelectedSlot(slot)} className="w-full py-1.5 px-2 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: selectedSlot?.startISO === slot.startISO ? TEAL : '#1F2937', color: selectedSlot?.startISO === slot.startISO ? '#fff' : '#9CA3AF' }}>
                            {slot.startTime} &ndash; {slot.endTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setStep(2); setSlots([]); setSelectedSlot(null) }} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Back</button>
                  <button onClick={() => setStep(4)} disabled={!selectedSlot} className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors" style={{ backgroundColor: selectedSlot ? TEAL : '#1F2937', color: selectedSlot ? '#fff' : '#6B7280' }}>Confirm Selection</button>
                </div>
              </>
            )}
          </>}

          {/* Step 4: Confirm */}
          {step === 4 && !booked && <>
            <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2 mb-1"><span className="text-lg">{typeIcons[meetType]}</span><h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{title}</h3></div>
              {[
                { l: 'When', v: `${selectedSlot?.date} \u00B7 ${selectedSlot?.startTime} \u2013 ${selectedSlot?.endTime}` },
                { l: 'Duration', v: `${duration} minutes` },
                { l: 'Type', v: typeLabels[meetType] },
                ...(attendees.length > 0 ? [{ l: 'Attendees', v: attendees.join(', ') }] : []),
              ].map(r => (
                <div key={r.l} className="flex justify-between text-sm" style={{ borderBottom: '1px solid #1F2937', paddingBottom: 8 }}>
                  <span style={{ color: '#6B7280' }}>{r.l}</span><span className="font-medium" style={{ color: '#F9FAFB' }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Back</button>
              <button onClick={confirmBooking} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: TEAL, color: '#fff' }}>{'\u{1F4C5}'} Confirm &amp; Create Event</button>
            </div>
          </>}

          {step === 4 && booked && (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">{'\u2705'}</div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>Meeting Booked!</h3>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{title} &middot; {selectedSlot?.date} {selectedSlot?.startTime} &middot; {duration}min</p>
              {attendees.length > 0 && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Invites sent to {attendees.join(', ')}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function OverviewActionModal({ action, onClose, onToast }: { action: string; onClose: () => void; onToast: (msg: string) => void }) {
  // Book Meeting gets its own wizard
  if (action === 'Book Meeting') return <BookMeetingWizard onClose={onClose} onToast={onToast} />

  const config = TITLES[action]
  if (!config) return null

  function submit(msg: string) { onToast(`\u2713 ${msg}`); onClose() }

  const btnStyle = (color: string): React.CSSProperties => ({ backgroundColor: color, color: '#F9FAFB', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' })
  const cancelStyle: React.CSSProperties = { backgroundColor: 'transparent', color: '#6B7280', padding: '10px 20px', borderRadius: 10, border: '1px solid #374151', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
  const rand4 = () => String(Math.floor(1000 + Math.random() * 9000))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full rounded-2xl" style={{ maxWidth: 480, backgroundColor: '#0D0E17', border: '1px solid #1F2937' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <h2 className="text-base font-bold" style={{ color: '#F9FAFB' }}>{config.title}</h2>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {action === 'Send Email' && <>
            <Input label="To" placeholder="sophie.williams@apexconsulting.com" />
            <Input label="Subject" placeholder="Re: Q1 contract renewal" />
            <Textarea label="Message" placeholder="Hi Sophie,&#10;&#10;Just following up on our conversation..." />
          </>}

          {action === 'Send Slack' && <>
            <Select label="Channel / Person" options={['#general', '#sales', '#support', '#marketing', '#hr', 'Sophie Williams', 'James Okafor', 'Marcus Webb']} />
            <Textarea label="Message" placeholder="Hey team, quick update on..." />
          </>}

          {action === 'Phone Call' && <>
            <Input label="Contact" defaultValue="James Okafor" />
            <Input label="Number" defaultValue="+44 7700 900123" type="tel" />
            <Textarea label="Log Notes" placeholder="Discussed contract terms..." />
            <Select label="Duration" options={['5 min', '10 min', '15 min', '30 min', '45 min', '60 min']} />
          </>}

          {action === 'Team Events' && <>
            <Input label="Event Name" placeholder="Q1 Team Lunch" />
            <div className="grid grid-cols-2 gap-3"><DateInput label="Date" /><Input label="Headcount" placeholder="12" type="number" /></div>
            <Field label="Budget"><div className="flex"><span className="px-3 py-2 rounded-l-lg text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', borderRight: 'none' }}>&pound;</span><input placeholder="500" style={{ ...S, borderRadius: '0 8px 8px 0' }} /></div></Field>
            <Textarea label="Notes" placeholder="Dietary requirements, venue preferences..." />
          </>}

          {action === 'Claim Expenses' && <>
            <Input label="Description" placeholder="Client lunch \u2014 Apex Consulting" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount"><div className="flex"><span className="px-3 py-2 rounded-l-lg text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', borderRight: 'none' }}>&pound;</span><input type="number" placeholder="45.00" style={{ ...S, borderRadius: '0 8px 8px 0' }} /></div></Field>
              <Select label="Category" options={['Travel', 'Meals', 'Equipment', 'Software', 'Entertainment', 'Other']} />
            </div>
            <DateInput label="Date" />
            <Field label="Receipt"><button className="w-full py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/5" style={{ border: '1px dashed #374151', color: '#6B7280' }}>{'\u{1F4CE}'} Click to upload receipt</button></Field>
          </>}

          {action === 'Book Holiday' && <>
            <div className="grid grid-cols-2 gap-3"><DateInput label="From" /><DateInput label="To" /></div>
            <Select label="Type" options={['Annual Leave', 'Emergency Leave', 'Unpaid Leave', 'Other']} />
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}><p className="text-xs" style={{ color: TEAL }}>You have 18 days remaining annual leave</p></div>
            <Textarea label="Note to Manager (optional)" placeholder="Handover details..." rows={2} />
          </>}

          {action === 'Report Sickness' && <>
            <div className="grid grid-cols-2 gap-3"><DateInput label="First Day of Absence" /><DateInput label="Expected Return" /></div>
            <Select label="Reason" options={['Illness', 'Medical Appointment', 'Family Emergency', 'Other']} />
            <Textarea label="Notes (optional)" placeholder="Any details for your manager..." rows={2} />
          </>}

          {action === 'Submit Timesheet' && <>
            <p className="text-xs" style={{ color: '#6B7280' }}>Week of {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <div className="space-y-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                <div key={d} className="flex items-center gap-3"><span className="text-xs w-20" style={{ color: '#9CA3AF' }}>{d}</span><input type="number" defaultValue="8" placeholder="0" className="flex-1" style={{ ...S, textAlign: 'center' }} /><input placeholder="Project code" className="flex-1" style={S} /></div>
              ))}
            </div>
            <div className="rounded-lg px-4 py-2 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}><span className="text-sm font-bold" style={{ color: TEAL }}>Total: 40 hours</span></div>
          </>}

          {action === 'Log Remote Day' && <>
            <DateInput label="Date" />
            <Select label="Location" options={['Home', 'Coffee Shop', 'Co-working Space', 'Other']} />
            <Textarea label="Notes (optional)" placeholder="Available on Slack all day" rows={2} />
          </>}

          {action === 'IT Support' && <>
            <Select label="Category" options={['My Laptop', 'Software', 'Access / Permissions', 'Network', 'Hardware', 'Other']} />
            <Textarea label="Description" placeholder="Describe the issue..." />
            <Select label="Priority" options={['Low', 'Medium', 'High', 'Critical']} />
          </>}

          {action === 'Request Sign-off' && <>
            <Input label="Document Name" placeholder="Q2 Budget Proposal" />
            <Input label="Who Needs to Sign" placeholder="james.okafor@company.com" />
            <DateInput label="Due Date" />
            <Textarea label="Notes" placeholder="Please review section 3..." rows={2} />
          </>}

          {action === 'Book Training' && <>
            <Select label="Training Type" options={['Internal Course', 'External Course', 'Conference', 'Online Learning', 'Other']} />
            <Input label="Course Name" placeholder="Advanced Leadership Programme" />
            <DateInput label="Date (or leave blank for flexible)" />
            <Field label="Cost Estimate"><div className="flex"><span className="px-3 py-2 rounded-l-lg text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', borderRight: 'none' }}>&pound;</span><input type="number" placeholder="500" style={{ ...S, borderRadius: '0 8px 8px 0' }} /></div></Field>
          </>}

          {action === 'Request 1-1' && <>
            <Select label="With" options={['James Okafor (Manager)', 'Sophie Williams', 'Marcus Webb', 'Charlotte Davies', 'Other...']} />
            <Select label="Preferred Time" options={['This week', 'Next week', 'Flexible']} />
            <Textarea label="Topic / Agenda (optional)" placeholder="Career development, project update..." rows={2} />
          </>}

          {action === 'Raise Issue' && <>
            <Select label="Issue Type" options={['Bug', 'Process', 'People', 'Safety', 'Legal', 'Compliance', 'Other']} />
            <Textarea label="Description" placeholder="Describe the issue in detail..." />
            <Select label="Priority" options={['Low', 'Medium', 'High', 'Urgent']} />
            <Field label="Options"><label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#9CA3AF' }}><input type="checkbox" style={{ accentColor: TEAL }} /> Submit anonymously</label></Field>
          </>}

          {action === 'Post Announcement' && <>
            <Input label="Title" placeholder="Office closure \u2014 Friday 11 April" />
            <Textarea label="Message" placeholder="Hi team,\n\nPlease note that..." />
            <Select label="Audience" options={['Whole Company', 'My Team', 'Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations']} />
            <Field label="Options"><label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#9CA3AF' }}><input type="checkbox" style={{ accentColor: TEAL }} /> Pin to top of feed</label></Field>
          </>}

          {action === 'Onboard Starter' && <>
            <div className="grid grid-cols-2 gap-3"><Input label="First Name" placeholder="Sarah" /><Input label="Last Name" placeholder="Mitchell" /></div>
            <DateInput label="Start Date" />
            <div className="grid grid-cols-2 gap-3"><Input label="Role" placeholder="Marketing Manager" /><Select label="Department" options={['Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations', 'Support', 'Other']} /></div>
            <Input label="Line Manager" placeholder="James Okafor" />
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(108,63,197,0.06)', border: '1px solid rgba(108,63,197,0.15)' }}><p className="text-xs" style={{ color: '#A78BFA' }}>Auto-generates: IT setup, desk, email, Slack, calendar invite, buddy assignment</p></div>
          </>}

          {action === 'Purchase Request' && <>
            <Input label="Item Description" placeholder="Ergonomic standing desk" />
            <Input label="Supplier (optional)" placeholder="Amazon Business" />
            <Field label="Cost"><div className="flex"><span className="px-3 py-2 rounded-l-lg text-sm font-medium" style={{ backgroundColor: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', borderRight: 'none' }}>&pound;</span><input type="number" placeholder="349.99" style={{ ...S, borderRadius: '0 8px 8px 0' }} /></div></Field>
            <Select label="Urgency" options={['Routine', 'Urgent', 'Critical']} />
            <Textarea label="Business Justification" placeholder="Required for..." rows={2} />
          </>}

          {action === 'Request Access' && <>
            <Input label="System / Tool" placeholder="Salesforce, AWS Console, Jira..." />
            <Select label="Access Level" options={['Read Only', 'Read/Write', 'Admin']} />
            <Textarea label="Business Reason" placeholder="Need access to..." rows={2} />
            <Field label="Options"><label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#9CA3AF' }}><input type="checkbox" defaultChecked style={{ accentColor: TEAL }} /> Requires manager approval</label></Field>
          </>}

          {action === 'Log Overtime' && <>
            <DateInput label="Date" />
            <Input label="Hours" placeholder="2.5" type="number" />
            <Input label="Project / Reason" placeholder="Q1 reporting deadline" />
            <Select label="Type" options={['Time in Lieu (TOIL)', 'Paid Overtime']} />
          </>}

          {action === 'Run Report' && <>
            <Select label="Report Type" options={['Sales Pipeline', 'Revenue', 'HR Summary', 'Operations', 'Finance', 'Marketing', 'Custom']} />
            <div className="grid grid-cols-2 gap-3"><DateInput label="From" /><DateInput label="To" /></div>
            <Select label="Format" options={['PDF', 'Excel (.xlsx)', 'CSV']} />
            <Input label="Email To (optional)" placeholder="board@company.com" />
          </>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={onClose} style={cancelStyle}>Cancel</button>
          <button onClick={() => {
            const msgs: Record<string, string> = {
              'Send Email': 'Email sent',
              'Send Slack': 'Slack message sent',
              'Phone Call': 'Call logged',
              'Team Events': 'Team event created',
              'Claim Expenses': 'Expense claim submitted \u2014 awaiting manager approval',
              'Book Holiday': 'Holiday request submitted \u2014 pending manager approval',
              'Report Sickness': 'Sickness reported \u2014 HR and manager notified',
              'Submit Timesheet': 'Timesheet submitted \u2014 40 hours',
              'Log Remote Day': 'Remote day logged',
              'IT Support': `IT ticket raised \u2014 #IT-${rand4()}`,
              'Request Sign-off': 'Sign-off request sent',
              'Book Training': 'Training request submitted \u2014 awaiting manager approval',
              'Request 1-1': '1-1 requested \u2014 calendar invite sent',
              'Raise Issue': `Issue raised \u2014 Ref #ISS-${rand4()}`,
              'Post Announcement': 'Announcement posted',
              'Onboard Starter': 'Onboarding started \u2014 IT and HR notified \u00B7 Checklist created',
              'Purchase Request': `Purchase request submitted \u2014 #PO-${rand4()} \u00B7 Awaiting finance`,
              'Request Access': 'Access request submitted \u2014 IT will provision',
              'Log Overtime': 'Overtime logged \u2014 pending manager approval',
              'Run Report': 'Report generating \u2014 will be emailed within 2 minutes',
            }
            submit(msgs[action] || `${config.title} completed`)
          }} style={btnStyle(action === 'Report Sickness' || action === 'Raise Issue' ? '#EF4444' : action === 'Send Slack' || action === 'Team Events' || action === 'Post Announcement' ? PURPLE : TEAL)}>
            {config.title}
          </button>
        </div>
      </div>
    </div>
  )
}
