'use client'

import { useState } from 'react'
import { X, ClipboardList, Loader2 } from 'lucide-react'

export interface PerformanceReviewData {
  employeeName:    string
  jobTitle:        string
  department:      string
  manager:         string
  reviewType:      string
  dueDate:         string
  reviewPeriod:    string
  selfAssessment:  boolean
  peerFeedback:    boolean
  peerReviewers:   string
  goals:           string
  notes:           string
}

const DEPARTMENTS = [
  'HR & People', 'Sales & CRM', 'Marketing', 'Operations',
  'Support', 'Success', 'IT & Systems', 'Finance', 'Accounts',
  'Product', 'Engineering', 'Leadership',
]

const REVIEW_TYPES   = ['Probation Review', 'Annual Review', 'Mid-Year Check-in', 'PIP Review', 'Promotion Review']
const REVIEW_PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'Full Year', 'Custom']

interface Props {
  onClose:  () => void
  onSubmit: (data: PerformanceReviewData) => Promise<void>
}

export default function PerformanceReviewModal({ onClose, onSubmit }: Props) {
  const [employeeName,   setEmployeeName]   = useState('')
  const [jobTitle,       setJobTitle]       = useState('')
  const [department,     setDepartment]     = useState(DEPARTMENTS[0])
  const [manager,        setManager]        = useState('')
  const [reviewType,     setReviewType]     = useState(REVIEW_TYPES[0])
  const [dueDate,        setDueDate]        = useState('')
  const [reviewPeriod,   setReviewPeriod]   = useState(REVIEW_PERIODS[0])
  const [selfAssessment, setSelfAssessment] = useState(true)
  const [peerFeedback,   setPeerFeedback]   = useState(false)
  const [peerReviewers,  setPeerReviewers]  = useState('')
  const [goals,          setGoals]          = useState('')
  const [notes,          setNotes]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  async function handleSubmit() {
    if (!employeeName.trim()) { setError('Employee name is required.'); return }
    if (!jobTitle.trim())     { setError('Job title is required.');     return }
    if (!dueDate)             { setError('Review due date is required.'); return }
    if (!goals.trim())        { setError('Goals to review are required.'); return }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({
        employeeName, jobTitle, department, manager,
        reviewType, dueDate, reviewPeriod,
        selfAssessment, peerFeedback, peerReviewers, goals, notes,
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

      <div className="w-full max-w-xl flex flex-col max-h-[92vh] rounded-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(124,58,237,0.12)' }}>
              <ClipboardList size={15} style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Performance Review</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Start the review cycle</p>
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
              placeholder="Sophie Williams"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
          </div>

          {/* Job title + department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                Job Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                placeholder="Customer Success Manager"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Manager */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Manager Name</label>
            <input value={manager} onChange={e => setManager(e.target.value)}
              placeholder="Laura Simmons"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
          </div>

          {/* Review type + period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Review Type</label>
              <select value={reviewType} onChange={e => setReviewType(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {REVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Review Period</label>
              <select value={reviewPeriod} onChange={e => setReviewPeriod(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                {REVIEW_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
              Review Due Date <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
          </div>

          {/* Self assessment toggle */}
          <div className="flex items-center justify-between rounded-lg px-4 py-3"
            style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Self Assessment Required</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Employee completes a self-review form</p>
            </div>
            <button type="button" onClick={() => setSelfAssessment(v => !v)}
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: selfAssessment ? '#0D9488' : '#374151' }}>
              <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white"
                style={{ left: selfAssessment ? '22px' : '2px' }} />
            </button>
          </div>

          {/* Peer feedback toggle */}
          <div className="flex items-center justify-between rounded-lg px-4 py-3"
            style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Peer Feedback Required</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Collect feedback from nominated peers</p>
            </div>
            <button type="button" onClick={() => setPeerFeedback(v => !v)}
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: peerFeedback ? '#0D9488' : '#374151' }}>
              <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white"
                style={{ left: peerFeedback ? '22px' : '2px' }} />
            </button>
          </div>

          {/* Peer reviewers (conditional) */}
          {peerFeedback && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
                Peer Reviewers (comma separated)
              </label>
              <input value={peerReviewers} onChange={e => setPeerReviewers(e.target.value)}
                placeholder="Dan Marsh, Laura Simmons, Priya Kapoor"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            </div>
          )}

          {/* Goals */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>
              Goals to Review <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea value={goals} onChange={e => setGoals(e.target.value)}
              rows={4} placeholder="List key objectives and targets to be assessed in this review…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Notes for Reviewer (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Any context, sensitive areas or guidance for the reviewer…"
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
            style={{ backgroundColor: '#7C3AED', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Starting…</>
              : <><ClipboardList size={14} /> Start Review Cycle →</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
