'use client'
import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const TYPES = ['Email', 'Social', 'Paid', 'Event', 'Content'] as const
const GOALS = ['Awareness', 'Leads', 'Retention', 'Upsell']

export default function NewCampaignModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<typeof TYPES[number]>('Email')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [audience, setAudience] = useState('')
  const [goal, setGoal] = useState(GOALS[0])
  const [description, setDescription] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!name || !budget || !startDate || !goal) throw new Error('Fill required fields'); onSubmit() }}
      title="Launch Campaign" subtitle="Create a new marketing campaign" icon={Megaphone} iconColor="#EC4899" submitLabel="Launch Campaign →" submitIcon={Megaphone}>
      <div><Label required>Campaign Name</Label><input value={name} onChange={e => setName(e.target.value)} placeholder="Spring Q2 Outreach" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div><Label required>Type</Label><PillSelector options={[...TYPES]} value={type} onChange={setType} colors={{ Email: '#0D9488', Social: '#8B5CF6', Paid: '#F59E0B', Event: '#EC4899', Content: '#22D3EE' }} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label required>Budget (£)</Label><input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="5000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Start Date</Label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>End Date</Label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label>Target Audience</Label><input value={audience} onChange={e => setAudience(e.target.value)} placeholder="UK SMBs, 20-200 employees" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div><Label required>Goal</Label><select value={goal} onChange={e => setGoal(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{GOALS.map(g => <option key={g}>{g}</option>)}</select></div>
      <div><Label>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Target new leads from SaaS sector..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
