'use client'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const SOURCES = ['Referral', 'Inbound', 'Outbound', 'Event', 'Other']
const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation'] as const

export default function NewLeadModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [value, setValue] = useState('')
  const [source, setSource] = useState(SOURCES[0])
  const [stage, setStage] = useState<typeof STAGES[number]>('New')
  const [notes, setNotes] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!company || !contact || !email || !value || !source) throw new Error('Fill required fields'); onSubmit() }}
      title="Add Lead" subtitle="Add a new sales lead" icon={UserPlus} iconColor="#22D3EE" submitLabel="Add Lead →" submitIcon={UserPlus}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Company</Label><input value={company} onChange={e => setCompany(e.target.value)} placeholder="Vertex Systems" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Contact Name</Label><input value={contact} onChange={e => setContact(e.target.value)} placeholder="James Harlow" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="james@vertexsys.com" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Phone</Label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 900000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Job Title</Label><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="CTO" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Deal Value (£)</Label><input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="75000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Source</Label><select value={source} onChange={e => setSource(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
      <div><Label>Stage</Label><PillSelector options={[...STAGES]} value={stage} onChange={setStage} /></div>
      <div><Label>Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Met at London SaaS meetup..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
