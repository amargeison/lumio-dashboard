'use client'

import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB',
  borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
}

export default function RunPayrollModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  const [period, setPeriod] = useState('monthly')
  const [payDate, setPayDate] = useState(lastDay.toISOString().split('T')[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onToast('Payroll processed — 14 employees notified')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl" style={{ maxWidth: 480, backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
              <DollarSign size={16} style={{ color: '#059669' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Run Payroll</h2>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Pay Period *</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={INPUT_STYLE}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Pay Date *</label>
              <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} required style={INPUT_STYLE} />
            </div>
          </div>

          {/* Summary card */}
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Employee Count</span>
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>14 employees</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Total Gross</span>
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>£52,400</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>Deductions (PAYE + NI)</span>
              <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>−£14,230</span>
            </div>
            <div style={{ borderTop: '1px solid #1F2937', paddingTop: 12 }} className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>Net Pay</span>
              <span className="text-lg font-bold" style={{ color: '#22C55E' }}>£38,170</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: '#F59E0B' }}>
            This will notify all employees and submit to HMRC.
          </p>

          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#059669', color: '#F9FAFB' }}>
            Process Payroll →
          </button>
        </form>
      </div>
    </div>
  )
}
