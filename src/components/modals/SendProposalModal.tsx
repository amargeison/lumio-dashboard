'use client'
import { useState } from 'react'
import { FileText } from 'lucide-react'
import ModalShell, { Label, inputStyle } from './ModalShell'

const TEMPLATES = ['Standard', 'Enterprise', 'Custom']

export default function SendProposalModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [client, setClient] = useState('')
  const [email, setEmail] = useState('')
  const [deal, setDeal] = useState('')
  const [value, setValue] = useState('')
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [expiry, setExpiry] = useState('')
  const [note, setNote] = useState('')

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!client || !email || !deal || !value) throw new Error('Fill required fields'); onSubmit() }}
      title="Send Proposal" subtitle="Generate and send a proposal" icon={FileText} iconColor="#8B5CF6" submitLabel="Send Proposal →" submitIcon={FileText}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Client Name</Label><input value={client} onChange={e => setClient(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Email</Label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@axontech.io" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Deal Name</Label><input value={deal} onChange={e => setDeal(e.target.value)} placeholder="Enterprise Suite" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Value (£)</Label><input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="182000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Template</Label><select value={template} onChange={e => setTemplate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{TEMPLATES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><Label>Expires</Label><input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      {/* Preview card */}
      <div className="rounded-lg p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
        <p className="text-xs font-bold" style={{ color: '#8B5CF6' }}>PROPOSAL PREVIEW</p>
        <p className="text-sm font-semibold mt-2" style={{ color: '#F9FAFB' }}>{deal || 'Deal Name'} — {template} Template</p>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>For {client || 'Client'} · £{value ? parseFloat(value).toLocaleString() : '0'}</p>
      </div>
      <div><Label>Personal Note</Label><textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Looking forward to working together..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
