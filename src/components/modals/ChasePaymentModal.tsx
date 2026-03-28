'use client'
import { useState } from 'react'
import { Send } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const TONES = ['Friendly', 'Firm', 'Final Notice'] as const
const PREVIEWS: Record<string, string> = {
  Friendly: 'Hi [Client], just a gentle reminder that invoice [Ref] for £[Amount] was due on [Date]. If you\'ve already arranged payment, please disregard this. Otherwise, could you let us know when we can expect settlement? Many thanks.',
  Firm: 'Dear [Client], this is a follow-up regarding invoice [Ref] for £[Amount] which is now [Days] days overdue. We would appreciate prompt payment to avoid any disruption to services. Please arrange settlement at your earliest convenience.',
  'Final Notice': 'Dear [Client], despite previous reminders, invoice [Ref] for £[Amount] remains unpaid and is now [Days] days overdue. This is a final notice before we escalate the matter. Please arrange immediate payment or contact us to discuss.',
}

export default function ChasePaymentModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [client, setClient] = useState('')
  const [ref, setRef] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tone, setTone] = useState<typeof TONES[number]>('Friendly')

  const daysOverdue = dueDate ? Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)) : 0

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!client || !ref || !amount) throw new Error('Fill required fields'); onSubmit() }}
      title="Chase Payment" subtitle="Send a payment reminder" icon={Send} iconColor="#F59E0B" submitLabel="Send Chase →" submitIcon={Send}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Client Name</Label><input value={client} onChange={e => setClient(e.target.value)} placeholder="Meridian Group" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Invoice Ref</Label><input value={ref} onChange={e => setRef(e.target.value)} placeholder="INV-2026-042" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Amount Outstanding (£)</Label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="3500" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label>Original Due Date</Label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      {daysOverdue > 0 && <p className="text-xs font-bold" style={{ color: daysOverdue > 30 ? '#EF4444' : '#F59E0B' }}>{daysOverdue} days overdue</p>}
      <div><Label>Tone</Label><PillSelector options={[...TONES]} value={tone} onChange={setTone} colors={{ Friendly: '#0D9488', Firm: '#F59E0B', 'Final Notice': '#EF4444' }} /></div>
      <div>
        <Label>Email Preview</Label>
        <div className="rounded-lg px-3 py-3 text-xs leading-relaxed" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}>
          {PREVIEWS[tone].replace('[Client]', client || 'Client').replace('[Ref]', ref || 'INV-XXX').replace('[Amount]', amount || '0').replace('[Date]', dueDate || 'N/A').replace('[Days]', String(daysOverdue))}
        </div>
      </div>
    </ModalShell>
  )
}
