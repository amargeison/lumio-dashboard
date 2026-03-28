'use client'
import { useState } from 'react'
import { Receipt } from 'lucide-react'
import ModalShell, { Label, inputStyle, PillSelector } from './ModalShell'

const VAT_OPTIONS = ['20%', 'Exempt', 'Zero-rated'] as const
const STATUS_OPTIONS = ['Draft', 'Send Immediately'] as const

export default function NewInvoiceModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [client, setClient] = useState('')
  const [invoiceNo] = useState(`INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`)
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [vat, setVat] = useState<typeof VAT_OPTIONS[number]>('20%')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]>('Draft')

  const numAmount = parseFloat(amount) || 0
  const vatRate = vat === '20%' ? 0.2 : 0
  const vatAmount = numAmount * vatRate
  const total = numAmount + vatAmount

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!client || !amount || !dueDate) throw new Error('Fill required fields'); onSubmit() }}
      title="Create Invoice" subtitle="Generate and send a new invoice" icon={Receipt} submitLabel="Create Invoice →" submitIcon={Receipt}>
      <div><Label required>Client Name</Label><input value={client} onChange={e => setClient(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div><Label>Invoice Number</Label><input value={invoiceNo} readOnly className="w-full rounded-lg px-3 py-2 text-sm outline-none opacity-60 cursor-not-allowed" style={inputStyle} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Amount (£)</Label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
        <div><Label required>Due Date</Label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label>VAT</Label><PillSelector options={[...VAT_OPTIONS]} value={vat} onChange={setVat} /></div>
      {numAmount > 0 && (
        <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
          <div className="flex justify-between text-xs mb-1"><span style={{ color: '#9CA3AF' }}>Subtotal</span><span style={{ color: '#D1D5DB' }}>£{numAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span></div>
          {vatRate > 0 && <div className="flex justify-between text-xs mb-1"><span style={{ color: '#9CA3AF' }}>VAT (20%)</span><span style={{ color: '#D1D5DB' }}>£{vatAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span></div>}
          <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid rgba(13,148,136,0.2)' }}><span style={{ color: '#F9FAFB' }}>Total</span><span style={{ color: '#0D9488' }}>£{total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span></div>
        </div>
      )}
      <div><Label>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Consulting services — March 2026" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></div>
      <div><Label>Status</Label><PillSelector options={[...STATUS_OPTIONS]} value={status} onChange={setStatus} colors={{ Draft: '#F59E0B', 'Send Immediately': '#0D9488' }} /></div>
    </ModalShell>
  )
}
