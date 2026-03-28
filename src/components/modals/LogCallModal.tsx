'use client'
import { useState } from 'react'
import { Phone } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const OUTCOMES = ['Positive', 'Neutral', 'Follow-up Needed', 'No Answer', 'Voicemail']
const CALL_TYPES = ['Inbound', 'Outbound'] as const

export default function LogCallModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [contact, setContact] = useState('')
  const [company, setCompany] = useState('')
  const [callType, setCallType] = useState<typeof CALL_TYPES[number]>('Outbound')
  const [duration, setDuration] = useState('')
  const [outcome, setOutcome] = useState(OUTCOMES[0])
  const [nextAction, setNextAction] = useState('')
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!contact || !duration || !outcome) throw new Error('Fill required fields'); onSubmit() }}
      title="Log Call" subtitle="Record a sales call" icon={Phone} iconColor="#22D3EE" submitLabel="Log Call →" submitIcon={Phone}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Contact Name</Label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="Sarah Chen" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Company</Label><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Call Type</Label><PillSelector options={[...CALL_TYPES]} value={callType} onChange={setCallType} /></div>
        <div><Label required>Duration (mins)</Label><input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="15" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Outcome</Label><select value={outcome} onChange={e => setOutcome(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{OUTCOMES.map(o => <option key={o}>{o}</option>)}</select></div>
      <div><Label>Next Action</Label><input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="Send proposal by Friday" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div><Label>Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Discussed enterprise requirements..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
      <div><Label>Follow-up Date</Label><input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
