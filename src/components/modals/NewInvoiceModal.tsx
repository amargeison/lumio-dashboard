'use client'
import { useState } from 'react'
import { Receipt } from 'lucide-react'
import ModalShell, { Label, inputStyle } from './ModalShell'

export default function NewInvoiceModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [client, setClient] = useState('')
  const [invoiceNo] = useState(`INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`)
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [vat, setVat] = useState(true)

  const numAmount = parseFloat(amount) || 0
  const total = vat ? numAmount * 1.2 : numAmount

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!client || !amount || !dueDate) throw new Error('Fill required fields'); onSubmit() }}
      title="Create Invoice" subtitle="Generate and send a new invoice" icon={Receipt} submitLabel="Create Invoice →" submitIcon={Receipt}>
      <div>
        <Label required>Client Name</Label>
        <input value={client} onChange={e => setClient(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
      </div>
      <div>
        <Label>Invoice Number</Label>
        <input value={invoiceNo} readOnly className="w-full rounded-lg px-3 py-2 text-sm outline-none opacity-60" style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label required>Amount (£)</Label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <Label required>Due Date</Label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Consulting services — March 2026" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label>VAT (20%)</Label>
          <button type="button" onClick={() => setVat(!vat)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: vat ? '#0D9488' : '#374151' }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: vat ? 22 : 2 }} />
          </button>
        </div>
        {numAmount > 0 && (
          <p className="text-sm font-bold" style={{ color: '#0D9488' }}>Total: £{total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
        )}
      </div>
    </ModalShell>
  )
}
