'use client'
import { useState } from 'react'
import { Phone } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const DURATIONS = ['5 mins', '10 mins', '15 mins', '30 mins', '45 mins', '60 mins', '90 mins']
const OUTCOMES = ['Positive ✓', 'Neutral ~', 'Follow-up →', 'No Answer ✗', 'Voicemail 📩'] as const
const DIRECTIONS = ['Inbound', 'Outbound'] as const

export default function LogCallModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [contact, setContact] = useState('')
  const [company, setCompany] = useState('')
  const [direction, setDirection] = useState<typeof DIRECTIONS[number]>('Outbound')
  const [duration, setDuration] = useState(DURATIONS[2])
  const [outcome, setOutcome] = useState<typeof OUTCOMES[number]>('Positive ✓')
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16))
  const [nextAction, setNextAction] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!contact || !duration || !outcome) throw new Error('Fill required fields'); onSubmit() }}
      title="Log Call" subtitle="Record a sales call" icon={Phone} iconColor="#22D3EE" submitLabel="Log Call →" submitIcon={Phone}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Contact Name</Label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="Sarah Chen" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Company</Label><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Direction</Label><PillSelector options={[...DIRECTIONS]} value={direction} onChange={setDirection} colors={{ Inbound: '#22D3EE', Outbound: '#8B5CF6' }} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Duration</Label><select value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{DURATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
        <div><Label>Date & Time</Label><input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Outcome</Label><PillSelector options={[...OUTCOMES]} value={outcome} onChange={setOutcome} colors={{ 'Positive ✓': '#22C55E', 'Neutral ~': '#F59E0B', 'Follow-up →': '#0D9488', 'No Answer ✗': '#EF4444', 'Voicemail 📩': '#8B5CF6' }} /></div>
      <div><Label>Next Action</Label><input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="Send proposal by Friday" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div><Label>Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Discussed enterprise requirements..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
