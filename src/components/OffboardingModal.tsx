'use client'

import { useState } from 'react'
import { X, Users, Loader2 } from 'lucide-react'

export interface OffboardingData {
  employeeName:    string
  jobTitle:        string
  department:      string
  lastWorkingDay:  string
  reason:          string
  exitInterview:   boolean
  equipmentReturn: string[]
  systemsRevoke:   string[]
  handoverTo:      string
  notes:           string
}

const DEPARTMENTS = [
  'HR & People', 'Sales & CRM', 'Marketing', 'Operations',
  'Support', 'Success', 'IT & Systems', 'Finance', 'Accounts',
  'Product', 'Engineering', 'Leadership',
]

const REASONS = [
  'Resignation', 'Redundancy', 'End of Contract',
  'Retirement', 'Dismissal', 'Other',
]

const EQUIPMENT_OPTIONS = ['Laptop', 'Phone', 'Access Card', 'Parking Pass', 'Other']
const SYSTEMS_OPTIONS   = ['Slack', 'Google Workspace', 'Notion', 'CRM', 'HR System', 'All Access']

interface Props {
  onClose:  () => void
  onSubmit: (data: OffboardingData) => Promise<void>
}

export default function OffboardingModal({ onClose, onSubmit }: Props) {
  const [employeeName,    setEmployeeName]    = useState('')
  const [jobTitle,        setJobTitle]        = useState('')
  const [department,      setDepartment]      = useState(DEPARTMENTS[0])
  const [lastWorkingDay,  setLastWorkingDay]  = useState('')
  const [reason,          setReason]          = useState(REASONS[0])
  const [exitInterview,   setExitInterview]   = useState(true)
  const [equipmentReturn, setEquipmentReturn] = useState<string[]>([])
  const [systemsRevoke,   setSystemsRevoke]   = useState<string[]>([])
  const [handoverTo,      setHandoverTo]      = useState('')
  const [notes,           setNotes]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  function toggle(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val])
  }

  async function handleSubmit() {
    if (!employeeName.trim()) { setError('Employee name is required.');  return }
    if (!jobTitle.trim())      { setError('Job title is required.');     return }
    if (!lastWorkingDay)       { setError('Last working day is required.'); return }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({ employeeName, jobTitle, department, lastWorkingDay, reason, exitInterview, equipmentReturn, systemsRevoke, handoverTo, notes })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  const inputStyle = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }
  const labelStyle = { color: '#9CA3AF' }

  function CheckGroup({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => onToggle(opt)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: active ? 'rgba(239,68,68,0.15)' : '#1F2937',
                border: `1px solid ${active ? '#EF4444' : '#374151'}`,
                color: active ? '#FCA5A5' : '#9CA3AF',
              }}>
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="w-full max-w-xl flex flex-col max-h-[92vh] rounded-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
              <Users size={15} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Offboarding</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Start the offboarding checklist</p>
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
              placeholder="James Okafor" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle} />
          </div>

          {/* Job title + department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                Job Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="Sales Development Rep" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Last working day + reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                Last Working Day <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input type="date" value={lastWorkingDay} onChange={e => setLastWorkingDay(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Reason for Leaving</label>
              <select value={reason} onChange={e => setReason(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Exit interview toggle */}
          <div className="flex items-center justify-between rounded-lg px-4 py-3"
            style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Exit Interview Required</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Schedule an exit conversation with HR</p>
            </div>
            <button
              type="button"
              onClick={() => setExitInterview(v => !v)}
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: exitInterview ? '#0D9488' : '#374151' }}>
              <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white"
                style={{ left: exitInterview ? '22px' : '2px' }} />
            </button>
          </div>

          {/* Equipment to return */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={labelStyle}>Equipment to Return</label>
            <CheckGroup options={EQUIPMENT_OPTIONS} selected={equipmentReturn}
              onToggle={v => toggle(equipmentReturn, setEquipmentReturn, v)} />
          </div>

          {/* Systems to revoke */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={labelStyle}>Systems Access to Revoke</label>
            <CheckGroup options={SYSTEMS_OPTIONS} selected={systemsRevoke}
              onToggle={v => toggle(systemsRevoke, setSystemsRevoke, v)} />
          </div>

          {/* Handover */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Handover Assigned To</label>
            <input value={handoverTo} onChange={e => setHandoverTo(e.target.value)}
              placeholder="Dan Marsh" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="Any additional context for the HR team..."
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
            style={{ backgroundColor: '#EF4444', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Starting…</>
              : <><Users size={14} /> Start Offboarding →</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
