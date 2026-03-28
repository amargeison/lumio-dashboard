'use client'
import { useState } from 'react'
import { FileText } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const TEMPLATES = ['Standard', 'Enterprise', 'Custom'] as const

export default function SendProposalModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [client, setClient] = useState('')
  const [email, setEmail] = useState('')
  const [deal, setDeal] = useState('')
  const [value, setValue] = useState('')
  const [template, setTemplate] = useState<typeof TEMPLATES[number]>('Standard')
  const [expiry, setExpiry] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0] })
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
      <div><Label required>Template</Label><PillSelector options={[...TEMPLATES]} value={template} onChange={setTemplate} colors={{ Standard: '#0D9488', Enterprise: '#8B5CF6', Custom: '#F59E0B' }} /></div>
      <div><Label>Valid Until</Label><input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      {/* Preview card */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, #6C3FC5, #0D9488)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Proposal</p>
          <p className="text-sm font-bold text-white">{deal || 'Deal Name'}</p>
        </div>
        <div className="px-4 py-3" style={{ backgroundColor: '#0A0B10' }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#9CA3AF' }}>For: {client || 'Client'}</span>
            <span className="font-bold" style={{ color: '#0D9488' }}>£{value ? parseFloat(value).toLocaleString() : '0'}</span>
          </div>
          <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>Valid until {expiry} · {template} template</p>
        </div>
      </div>
      <div><Label>Personal Note</Label><textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Add a personal message to the proposal..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
    </ModalShell>
  )
}
