'use client'

import { useState } from 'react'
import { X, UserPlus, Loader2 } from 'lucide-react'

export interface NewJoinerData {
  firstName:   string
  lastName:    string
  jobTitle:    string
  department:  string
  startDate:   string
  manager:     string
  equipment:   string[]
  software:    string[]
  notes:       string
}

const DEPARTMENTS = [
  'HR & People', 'Sales & CRM', 'Marketing', 'Operations',
  'Support', 'Success', 'IT & Systems', 'Finance', 'Accounts',
  'Product', 'Engineering', 'Leadership',
]

const EQUIPMENT_OPTIONS = ['Laptop', 'Phone', 'Access Card', 'Parking Pass', 'Other']
const SOFTWARE_OPTIONS  = ['Slack', 'Google Workspace', 'Notion', 'CRM', 'HR System', 'Other']

interface Props {
  onClose:   () => void
  onSubmit:  (data: NewJoinerData) => Promise<void>
}

export default function NewJoinerModal({ onClose, onSubmit }: Props) {
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [jobTitle,   setJobTitle]   = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [startDate,  setStartDate]  = useState('')
  const [manager,    setManager]    = useState('')
  const [equipment,  setEquipment]  = useState<string[]>([])
  const [software,   setSoftware]   = useState<string[]>([])
  const [notes,      setNotes]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  function toggle(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val])
  }

  async function handleSubmit() {
    if (!firstName.trim()) { setError('First name is required.'); return }
    if (!lastName.trim())  { setError('Last name is required.');  return }
    if (!jobTitle.trim())  { setError('Job title is required.');  return }
    if (!startDate)        { setError('Start date is required.'); return }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({ firstName, lastName, jobTitle, department, startDate, manager, equipment, software, notes })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: '#1F2937',
    border: '1px solid #374151',
    color: '#F9FAFB',
  }

  const labelStyle = { color: '#9CA3AF' }

  function CheckGroup({
    options, selected, onToggle,
  }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => onToggle(opt)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: active ? 'rgba(13,148,136,0.2)' : '#1F2937',
                border: `1px solid ${active ? '#0D9488' : '#374151'}`,
                color: active ? '#0D9488' : '#9CA3AF',
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
              style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
              <UserPlus size={15} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>New Joiner Onboarding</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Start the onboarding workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                First Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Sophie" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                Last Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Williams" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle} />
            </div>
          </div>

          {/* Job title */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
              Job Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
              placeholder="Customer Success Manager" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle} />
          </div>

          {/* Department + Start date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                Start Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Manager */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Manager Name</label>
            <input value={manager} onChange={e => setManager(e.target.value)}
              placeholder="Dan Marsh" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle} />
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={labelStyle}>Equipment Needed</label>
            <CheckGroup options={EQUIPMENT_OPTIONS} selected={equipment}
              onToggle={v => toggle(equipment, setEquipment, v)} />
          </div>

          {/* Software */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={labelStyle}>Software Access</label>
            <CheckGroup options={SOFTWARE_OPTIONS} selected={software}
              onToggle={v => toggle(software, setSoftware, v)} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="Any additional context for the onboarding team..."
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
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Starting…</>
              : <><UserPlus size={14} /> Start Onboarding →</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
