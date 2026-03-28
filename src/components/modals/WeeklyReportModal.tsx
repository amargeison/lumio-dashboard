'use client'

import { X } from 'lucide-react'

const BARS = [
  { label: 'Mon', value: 3200, color: '#0D9488' },
  { label: 'Tue', value: 5100, color: '#0D9488' },
  { label: 'Wed', value: 4400, color: '#0D9488' },
  { label: 'Thu', value: 6800, color: '#22C55E' },
  { label: 'Fri', value: 5300, color: '#0D9488' },
]

export default function WeeklyReportModal({ onClose, onToast }: { onClose: () => void; onToast: (msg: string) => void }) {
  const max = Math.max(...BARS.map(b => b.value))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full rounded-2xl" style={{ maxWidth: 480, backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Weekly Financial Summary</h2>
          <button onClick={onClose} style={{ color: '#6B7280' }}><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs" style={{ color: '#6B7280' }}>Week ending {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Revenue', value: '£24,800', color: '#22C55E' },
              { label: 'Expenses', value: '£8,200', color: '#EF4444' },
              { label: 'Outstanding Invoices', value: '£12,400 (3)', color: '#F59E0B' },
              { label: 'Cash Flow', value: '+£16,600', color: '#0D9488' },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.label}</p>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Mini bar chart */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Daily Revenue</p>
            <div className="flex items-end gap-2" style={{ height: 80 }}>
              {BARS.map(b => (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm" style={{ height: Math.max(8, (b.value / max) * 64), backgroundColor: b.color }} />
                  <span className="text-xs" style={{ color: '#6B7280' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { onToast('Downloading...'); setTimeout(onClose, 800) }}
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}
