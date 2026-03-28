'use client'
import { useState } from 'react'
import { Activity } from 'lucide-react'
import ModalShell, { Label, inputStyle, CheckGroup } from './ModalShell'

const MANAGERS = ['Dan Marsh', 'Sophie Bell', 'Raj Patel', 'Laura Simmons', 'Alex Turner']
const TOPICS = ['Product', 'Support', 'Billing', 'Roadmap', 'Expansion']

export default function NewCheckInModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [client, setClient] = useState('')
  const [manager, setManager] = useState(MANAGERS[0])
  const [date, setDate] = useState('')
  const [health, setHealth] = useState(7)
  const [mrr, setMrr] = useState('')
  const [renewal, setRenewal] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [nextDate, setNextDate] = useState('')

  const healthColor = health <= 4 ? '#EF4444' : health <= 7 ? '#F59E0B' : '#22C55E'

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!client || !date || !notes) throw new Error('Fill required fields'); onSubmit() }}
      title="Log Check-in" subtitle="Record a customer check-in" icon={Activity} iconColor="#22C55E" submitLabel="Log Check-in →" submitIcon={Activity}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Client Name</Label><input value={client} onChange={e => setClient(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Account Manager</Label><select value={manager} onChange={e => setManager(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{MANAGERS.map(m => <option key={m}>{m}</option>)}</select></div>
      </div>
      <div><Label required>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label required>Health Score</Label>
          <span className="text-lg font-black" style={{ color: healthColor }}>{health}/10</span>
        </div>
        <input type="range" min={1} max={10} value={health} onChange={e => setHealth(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: healthColor, backgroundColor: '#1F2937' }} />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: '#4B5563' }}><span>At risk</span><span>Healthy</span><span>Thriving</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>MRR (£)</Label><input type="number" value={mrr} onChange={e => setMrr(e.target.value)} placeholder="2500" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Renewal Date</Label><input type="date" value={renewal} onChange={e => setRenewal(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label>Topics Discussed</Label><CheckGroup options={TOPICS} selected={topics} onToggle={v => setTopics(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} /></div>
      <div><Label required>Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Key takeaways from the call..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
      <div><Label>Next Check-in Date</Label><input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
