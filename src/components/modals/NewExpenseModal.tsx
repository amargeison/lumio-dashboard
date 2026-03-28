'use client'
import { useState } from 'react'
import { Receipt, Upload } from 'lucide-react'
import ModalShell, { Label, inputStyle } from './ModalShell'

const CATEGORIES = ['Travel', 'Meals', 'Software', 'Equipment', 'Office', 'Other']

export default function NewExpenseModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [billable, setBillable] = useState(false)

  return (
    <ModalShell onClose={onClose} onSubmit={() => { if (!amount || !date || !description) throw new Error('Fill required fields'); onSubmit() }}
      title="Submit Expense" subtitle="Log a new expense claim" icon={Receipt} iconColor="#8B5CF6" submitLabel="Submit Expense →" submitIcon={Receipt}>
      <div className="grid grid-cols-2 gap-3">
        <div><Label required>Category</Label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><Label required>Amount (£)</Label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="125.50" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      </div>
      <div><Label required>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div><Label required>Description</Label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="Client lunch — Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></div>
      <div>
        <Label>Receipt</Label>
        <div className="flex items-center justify-center gap-2 rounded-lg py-4 cursor-pointer" style={{ border: '2px dashed #374151' }}>
          <Upload size={14} style={{ color: '#6B7280' }} /><span className="text-xs" style={{ color: '#6B7280' }}>Upload receipt image</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Label>Billable to client</Label>
        <button type="button" onClick={() => setBillable(!billable)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: billable ? '#0D9488' : '#374151' }}>
          <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: billable ? 22 : 2 }} />
        </button>
      </div>
    </ModalShell>
  )
}
