'use client'
import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const PLANS = [
  { id: 'starter', name: 'Starter', price: '£299/mo', color: '#0D9488' },
  { id: 'growth', name: 'Growth', price: '£599/mo', color: '#8B5CF6' },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', color: '#F59E0B' },
] as const
const LENGTHS = ['14 days', '21 days', '30 days'] as const
const SOURCES = ['Inbound', 'Referral', 'Outbound', 'Event', 'Partner']

export default function NewTrialModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [plan, setPlan] = useState('growth')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [length, setLength] = useState<typeof LENGTHS[number]>('14 days')
  const [source, setSource] = useState(SOURCES[0])
  const [notes, setNotes] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!company || !contact || !email || !startDate) throw new Error('Fill required fields'); onSubmit() }}
      title="Start Trial" subtitle="Create a new trial workspace" icon={FlaskConical} iconColor="#F59E0B" submitLabel="Start Trial →" submitIcon={FlaskConical}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Company Name</Label><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Helix Digital" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Contact Name</Label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="Tom Rashid" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tom@helixdigital.co" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Phone</Label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div>
        <Label required>Plan</Label>
        <div className="grid grid-cols-3 gap-2">
          {PLANS.map(p => (
            <button key={p.id} type="button" onClick={() => setPlan(p.id)}
              className="rounded-xl p-3 text-center transition-all"
              style={{
                backgroundColor: plan === p.id ? `${p.color}15` : '#1F2937',
                border: plan === p.id ? `2px solid ${p.color}` : '2px solid #374151',
              }}>
              <p className="text-sm font-bold" style={{ color: plan === p.id ? p.color : '#9CA3AF' }}>{p.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{p.price}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Trial Start Date</Label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Trial Length</Label><PillSelector options={[...LENGTHS]} value={length} onChange={setLength} /></div>
      </div>
      <div><Label>Source</Label><select value={source} onChange={e => setSource(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
      <div><Label>Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Trial context, requirements..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
