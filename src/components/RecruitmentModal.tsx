'use client'

import { useState } from 'react'
import { X, Briefcase, Loader2 } from 'lucide-react'

export interface RecruitmentData {
  jobTitle:         string
  department:       string
  employmentType:   string
  location:         string
  officeLocation:   string
  salaryMin:        string
  salaryMax:        string
  targetStartDate:  string
  hiringManager:    string
  positions:        number
  responsibilities: string
  requirements:     string
  desirable:        string
  jobBoards:        string[]
  notes:            string
}

const DEPARTMENTS = [
  'HR & People', 'Sales & CRM', 'Marketing', 'Operations',
  'Support', 'Success', 'IT & Systems', 'Finance', 'Accounts',
  'Product', 'Engineering', 'Leadership',
]

const EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Fixed Term', 'Freelance', 'Internship']
const LOCATIONS        = ['On-site', 'Remote', 'Hybrid']
const JOB_BOARDS       = ['LinkedIn', 'Indeed', 'Glassdoor', 'Company Website', 'Internal Only']

interface Props {
  onClose:  () => void
  onSubmit: (data: RecruitmentData) => Promise<void>
}

export default function RecruitmentModal({ onClose, onSubmit }: Props) {
  const [jobTitle,         setJobTitle]         = useState('')
  const [department,       setDepartment]       = useState(DEPARTMENTS[0])
  const [employmentType,   setEmploymentType]   = useState(EMPLOYMENT_TYPES[0])
  const [location,         setLocation]         = useState(LOCATIONS[0])
  const [officeLocation,   setOfficeLocation]   = useState('')
  const [salaryMin,        setSalaryMin]        = useState('')
  const [salaryMax,        setSalaryMax]        = useState('')
  const [targetStartDate,  setTargetStartDate]  = useState('')
  const [hiringManager,    setHiringManager]    = useState('')
  const [positions,        setPositions]        = useState(1)
  const [responsibilities, setResponsibilities] = useState('')
  const [requirements,     setRequirements]     = useState('')
  const [desirable,        setDesirable]        = useState('')
  const [jobBoards,        setJobBoards]        = useState<string[]>([])
  const [notes,            setNotes]            = useState('')
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  function toggleBoard(val: string) {
    setJobBoards(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  async function handleSubmit() {
    if (!jobTitle.trim())         { setError('Job title is required.');         return }
    if (!responsibilities.trim()) { setError('Responsibilities are required.');  return }
    if (!requirements.trim())     { setError('Requirements are required.');      return }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({
        jobTitle, department, employmentType, location,
        officeLocation, salaryMin, salaryMax, targetStartDate,
        hiringManager, positions, responsibilities, requirements,
        desirable, jobBoards, notes,
      })
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

      <div className="w-full max-w-2xl flex flex-col max-h-[92vh] rounded-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
              <Briefcase size={15} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Post a Role</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Start the recruitment workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
            style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Job title */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
              Job Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Account Executive"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
          </div>

          {/* Department + Employment type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Employment Type</label>
              <select value={employmentType} onChange={e => setEmploymentType(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Location + Office location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Location</label>
              <select value={location} onChange={e => setLocation(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {location !== 'Remote' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Office Location</label>
                <input value={officeLocation} onChange={e => setOfficeLocation(e.target.value)}
                  placeholder="e.g. London, Manchester"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
              </div>
            )}
          </div>

          {/* Salary + positions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Salary Min (£)</label>
              <input value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                placeholder="35,000"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Salary Max (£)</label>
              <input value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
                placeholder="45,000"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Positions</label>
              <input type="number" min={1} max={20} value={positions}
                onChange={e => setPositions(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Target start date + hiring manager */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Target Start Date</label>
              <input type="date" value={targetStartDate} onChange={e => setTargetStartDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Hiring Manager</label>
              <input value={hiringManager} onChange={e => setHiringManager(e.target.value)}
                placeholder="Dan Marsh"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
              Key Responsibilities <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea value={responsibilities} onChange={e => setResponsibilities(e.target.value)}
              rows={4} placeholder="List the main responsibilities of this role…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
          </div>

          {/* Essential requirements */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
              Essential Requirements <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea value={requirements} onChange={e => setRequirements(e.target.value)}
              rows={3} placeholder="Must-have skills, experience, qualifications…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
          </div>

          {/* Desirable */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Desirable (optional)</label>
            <textarea value={desirable} onChange={e => setDesirable(e.target.value)}
              rows={2} placeholder="Nice-to-have skills or experience…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
          </div>

          {/* Job boards */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={labelStyle}>Post to Job Boards</label>
            <div className="flex flex-wrap gap-2">
              {JOB_BOARDS.map(board => {
                const active = jobBoards.includes(board)
                return (
                  <button key={board} type="button" onClick={() => toggleBoard(board)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: active ? 'rgba(13,148,136,0.15)' : '#1F2937',
                      border: `1px solid ${active ? '#0D9488' : '#374151'}`,
                      color: active ? '#2DD4BF' : '#9CA3AF',
                    }}>
                    {board}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Any additional context for the hiring team…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
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
              ? <><Loader2 size={14} className="animate-spin" /> Posting…</>
              : <><Briefcase size={14} /> Post Role & Start Recruitment →</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
