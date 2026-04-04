'use client'
import { useState } from 'react'
import { Headphones, Upload } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
const PRIORITY_COLORS: Record<string, string> = { Low: '#22C55E', Medium: '#F59E0B', High: '#F97316', Critical: '#EF4444' }
const CATEGORIES = ['Billing', 'Technical Issue', 'Account', 'Feature Request', 'Complaint', 'General Enquiry']

export default function NewSupportTicketModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [customer, setCustomer] = useState('')
  const [email, setEmail] = useState('')
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('Medium')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [affected, setAffected] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!customer || !email || !subject || !description) throw new Error('Fill required fields'); onSubmit() }}
      title="Create Support Ticket" subtitle="Log a customer support request" icon={Headphones} iconColor="#0D9488" submitLabel="Create Ticket →" submitIcon={Headphones}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Customer Name</Label><input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@axontech.io" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Priority</Label><PillSelector options={[...PRIORITIES]} value={priority} onChange={setPriority} colors={PRIORITY_COLORS} /></div>
      <div><Label required>Subject</Label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Unable to access CRM module" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div><Label required>Category</Label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
      <div><Label required>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Please describe the issue in detail..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
      <div><Label>Affected Feature</Label><input value={affected} onChange={e => setAffected(e.target.value)} placeholder="CRM Pipeline view" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div>
        <Label>Screenshot</Label>
        <div className="flex items-center justify-center gap-2 rounded-lg py-4 cursor-pointer transition-colors hover:border-[#374151]" style={{ border: '2px dashed #374151', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <Upload size={14} style={{ color: '#6B7280' }} /><span className="text-xs" style={{ color: '#6B7280' }}>📎 Attach Screenshot</span>
        </div>
      </div>
    </ModalShell>
  )
}
