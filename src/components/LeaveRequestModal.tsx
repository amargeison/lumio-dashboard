'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Loader2 } from 'lucide-react'

export interface LeaveRequestData {
  employeeName:       string
  leaveType:          string
  startDate:          string
  endDate:            string
  totalDays:          number
  coveringColleague:  string
  notes:              string
}

const LEAVE_TYPES = [
  'Annual Leave', 'Sick Leave', 'Parental Leave',
  'Compassionate Leave', 'Unpaid Leave', 'Other',
]

/** Count weekdays (Mon–Fri) between two ISO date strings, inclusive. */
function countWeekdays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (e < s) return 0
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

interface Props {
  onClose:  () => void
  onSubmit: (data: LeaveRequestData) => Promise<void>
}

export default function LeaveRequestModal({ onClose, onSubmit }: Props) {
  const [employeeName,      setEmployeeName]      = useState('')
  const [leaveType,         setLeaveType]         = useState(LEAVE_TYPES[0])
  const [startDate,         setStartDate]         = useState('')
  const [endDate,           setEndDate]           = useState('')
  const [coveringColleague, setCoveringColleague] = useState('')
  const [notes,             setNotes]             = useState('')
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState<string | null>(null)

  const totalDays = countWeekdays(startDate, endDate)

  // Auto-set end date to start date when start is picked and end is empty
  useEffect(() => {
    if (startDate && !endDate) setEndDate(startDate)
  }, [startDate, endDate])

  async function handleSubmit() {
    if (!employeeName.trim()) { setError('Employee name is required.');  return }
    if (!startDate)            { setError('Start date is required.');    return }
    if (!endDate)              { setError('End date is required.');      return }
    if (endDate < startDate)   { setError('End date must be after start date.'); return }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({ employeeName, leaveType, startDate, endDate, totalDays, coveringColleague, notes })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  const inputStyle = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }
  const labelStyle = { color: '#9CA3AF' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="w-full max-w-lg flex flex-col max-h-[92vh] rounded-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(108,63,197,0.15)' }}>
              <FileText size={15} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Leave Request</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Submit for approval</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Employee name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
              Employee Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input value={employeeName} onChange={e => setEmployeeName(e.target.value)}
              placeholder="Sophie Williams" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle} />
          </div>

          {/* Leave type */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Leave Type</label>
            <select value={leaveType} onChange={e => setLeaveType(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                Start Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                End Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Total days — auto-calculated */}
          {startDate && endDate && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
              style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
              <span style={{ color: '#9CA3AF' }}>Total working days:</span>
              <span className="font-bold" style={{ color: '#0D9488' }}>
                {totalDays} day{totalDays !== 1 ? 's' : ''}
              </span>
              <span className="text-xs" style={{ color: '#4B5563' }}>(weekdays only)</span>
            </div>
          )}

          {/* Covering colleague */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Covering Colleague</label>
            <input value={coveringColleague} onChange={e => setCoveringColleague(e.target.value)}
              placeholder="Dan Marsh" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Notes / Reason (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="Any additional context..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={inputStyle} />
          </div>

          {error && (
            <p className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
              : <><FileText size={14} /> Submit Request →</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
