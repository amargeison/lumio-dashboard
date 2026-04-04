'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB',
  borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
}

export default function PaymentReceivedModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const [form, setForm] = useState({
    client: '', amount: '', method: 'bank_transfer', reference: '',
    date: new Date().toISOString().split('T')[0], notes: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onToast(`Payment of £${form.amount} from ${form.client} recorded`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl" style={{ maxWidth: 440, backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Record Payment</h2>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Client Name *</label>
            <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} required style={INPUT_STYLE} placeholder="Oakridge Schools Ltd" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Amount (£) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required style={INPUT_STYLE} placeholder="4800.00" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Payment Method *</label>
              <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} style={INPUT_STYLE}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Reference</label>
              <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} style={INPUT_STYLE} placeholder="INV-2026-041" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={INPUT_STYLE} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="resize-none" style={{ ...INPUT_STYLE }} placeholder="Optional notes..." />
          </div>

          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Record Payment →
          </button>
        </form>
      </div>
    </div>
  )
}
