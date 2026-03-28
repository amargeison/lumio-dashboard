'use client'
import { useState } from 'react'
import { Send } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const TONES = ['Friendly Reminder', 'Firm Notice', 'Final Notice'] as const
const PREVIEWS: Record<string, string> = {
  'Friendly Reminder': 'Hi [Client],\n\nJust a gentle reminder that invoice [Ref] for £[Amount] was due on [Date]. If you\'ve already arranged payment, please disregard this.\n\nOtherwise, could you let us know when we can expect settlement?\n\nMany thanks,\nThe Lumio Team',
  'Firm Notice': 'Dear [Client],\n\nThis is a follow-up regarding invoice [Ref] for £[Amount], which is now [Days] days overdue.\n\nWe would appreciate prompt payment to avoid any disruption to your services. Please arrange settlement at your earliest convenience.\n\nRegards,\nThe Lumio Team',
  'Final Notice': 'Dear [Client],\n\nDespite previous reminders, invoice [Ref] for £[Amount] remains unpaid and is now [Days] days overdue.\n\nThis is a final notice before we escalate the matter to our collections process. Please arrange immediate payment or contact us to discuss.\n\nRegards,\nThe Lumio Team',
}

export default function ChasePaymentModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [client, setClient] = useState('')
  const [ref, setRef] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tone, setTone] = useState<typeof TONES[number]>('Friendly Reminder')

  const daysOverdue = dueDate ? Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)) : 0
  const preview = PREVIEWS[tone]
    .replace('[Client]', client || 'Client')
    .replace('[Ref]', ref || 'INV-XXX')
    .replace('[Amount]', amount || '0')
    .replace('[Date]', dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : 'N/A')
    .replace('[Days]', String(daysOverdue))

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!client || !ref || !amount) throw new Error('Fill required fields'); onSubmit() }}
      title="Chase Payment" subtitle="Send a payment reminder" icon={Send} iconColor="#F59E0B" submitLabel="Send Chase Email →" submitIcon={Send}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Client Name</Label><input value={client} onChange={e => setClient(e.target.value)} placeholder="Meridian Group" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Invoice Reference</Label><input value={ref} onChange={e => setRef(e.target.value)} placeholder="INV-2026-042" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Amount Outstanding (£)</Label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="3500" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div>
          <Label required>Original Due Date</Label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
        </div>
      </div>
      {daysOverdue > 0 && (
        <div className="rounded-lg px-3 py-2 text-xs font-bold" style={{ backgroundColor: daysOverdue > 30 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: daysOverdue > 30 ? '#EF4444' : '#F59E0B' }}>
          {daysOverdue} days overdue
        </div>
      )}
      <div><Label required>Chase Type</Label><PillSelector options={[...TONES]} value={tone} onChange={setTone} colors={{ 'Friendly Reminder': '#0D9488', 'Firm Notice': '#F59E0B', 'Final Notice': '#EF4444' }} /></div>
      <div>
        <Label>Email Preview</Label>
        <div className="rounded-lg px-4 py-3 text-xs leading-relaxed whitespace-pre-line" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#9CA3AF', maxHeight: 160, overflowY: 'auto' }}>
          {preview}
        </div>
      </div>
    </ModalShell>
  )
}
