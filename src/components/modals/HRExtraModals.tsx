'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, Check, Loader2 } from 'lucide-react'

type ModalProps = { onClose: () => void; isDemoMode?: boolean }
const iS: React.CSSProperties = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }

function WizardShell({ onClose, title, subtitle, icon, step, totalSteps, stepLabels, setStep, children, onFinish }: {
  onClose: () => void; title: string; subtitle: string; icon: string
  step: number; totalSteps: number; stepLabels: string[]; setStep: (s: number) => void; children: React.ReactNode; onFinish?: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl flex flex-col max-h-[92vh] rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-base" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>{icon}</div>
            <div><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p><p className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {stepLabels.map((l, i) => {
            const s = i + 1; const active = step === s; const done = step > s
            return (<div key={l} className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, backgroundColor: done ? '#0D9488' : active ? 'rgba(13,148,136,0.2)' : '#1F2937', color: done ? '#fff' : active ? '#0D9488' : '#6B7280' }}>{done ? <Check size={12} /> : s}</div>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: active ? '#F9FAFB' : '#6B7280' }}>{l}</span>
              {i < stepLabels.length - 1 && <ChevronRight size={12} style={{ color: '#374151' }} />}
            </div>)
          })}
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>{step === 1 ? 'Cancel' : '\u2190 Back'}</button>
          {step === totalSteps
            ? <button onClick={() => { onFinish?.(); onClose() }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}><Check size={14} /> Done</button>
            : <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Next <ChevronRight size={14} /></button>}
        </div>
      </div>
    </div>
  )
}
function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{children}{req && <span style={{ color: '#EF4444' }}> *</span>}</label>
}
function DemoConfirm({ isDemoMode, text }: { isDemoMode?: boolean; text: string }) {
  return isDemoMode ? (
    <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
      <p className="text-xs font-semibold" style={{ color: '#0D9488' }}>Demo mode</p>
      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>On a live plan this would be actioned instantly and synced to your MIS.</p>
    </div>
  ) : <p className="text-xs mt-2" style={{ color: '#6B7280' }}>{text}</p>
}
function genRef(prefix: string) { return `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}` }

/* ────────────────────────────────────────────────────────────
   1. Book CPD Modal
   ──────────────────────────────────────────────────────────── */

export function BookCPDModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [courseName, setCourseName] = useState('')
  const [provider, setProvider] = useState('')
  const [courseDate, setCourseDate] = useState('')
  const [cost, setCost] = useState('')
  const [coverNeeded, setCoverNeeded] = useState(false)
  const [lineManager, setLineManager] = useState('')
  const [justification, setJustification] = useState('')

  const managers = ['Sarah Mitchell', 'James Okafor', 'Emma Clarke', 'Priya Patel']

  return (
    <WizardShell onClose={onClose} title="Book CPD" subtitle="Submit a CPD course booking for approval" icon="📚"
      step={step} totalSteps={3} stepLabels={['Course', 'Approval', 'Confirm']} setStep={setStep}>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Course Name</Label>
            <input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="e.g. Safeguarding Level 3" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Provider</Label>
            <input value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g. National College" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label req>Date</Label>
              <input type="date" value={courseDate} onChange={e => setCourseDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
            </div>
            <div>
              <Label req>Cost (&pound;)</Label>
              <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Cover Needed?</Label>
            <div className="flex items-center gap-3 mt-1">
              <button onClick={() => setCoverNeeded(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: !coverNeeded ? '#0D9488' : '#1F2937', color: !coverNeeded ? '#F9FAFB' : '#9CA3AF', border: '1px solid #374151' }}>No</button>
              <button onClick={() => setCoverNeeded(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: coverNeeded ? '#0D9488' : '#1F2937', color: coverNeeded ? '#F9FAFB' : '#9CA3AF', border: '1px solid #374151' }}>Yes</button>
            </div>
          </div>
          <div>
            <Label req>Line Manager</Label>
            <select value={lineManager} onChange={e => setLineManager(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option value="">Select manager...</option>
              {managers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <Label req>Justification</Label>
            <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={4} placeholder="How will this CPD benefit your practice and the school?" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center justify-center mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#0D9488' }}><Check size={20} style={{ color: '#F9FAFB' }} /></div>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>CPD booking submitted for approval</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{courseName} &middot; {provider} &middot; &pound;{cost || '0'}</p>
            {lineManager && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Approver: {lineManager}</p>}
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your CPD booking has been submitted and your line manager will be notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ────────────────────────────────────────────────────────────
   2. Contract Change Modal
   ──────────────────────────────────────────────────────────── */

export function ContractChangeModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [staffMember, setStaffMember] = useState('')
  const [changeType, setChangeType] = useState('')
  const [newTerms, setNewTerms] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [reason, setReason] = useState('')
  const [ref] = useState(() => genRef('HR'))

  const changeTypes = ['Hours', 'Role', 'Salary', 'Term', 'Other']

  return (
    <WizardShell onClose={onClose} title="Contract Change" subtitle="Request a change to a staff member's contract" icon="📝"
      step={step} totalSteps={3} stepLabels={['Select', 'Details', 'Confirm']} setStep={setStep}>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Staff Member</Label>
            <input value={staffMember} onChange={e => setStaffMember(e.target.value)} placeholder="Full name of the staff member" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Change Type</Label>
            <select value={changeType} onChange={e => setChangeType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option value="">Select change type...</option>
              {changeTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>New Terms</Label>
            <textarea value={newTerms} onChange={e => setNewTerms(e.target.value)} rows={4} placeholder="Describe the new contract terms in detail..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
          <div>
            <Label req>Effective Date</Label>
            <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Reason for Change</Label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Why is this contract change being requested?" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center justify-center mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#0D9488' }}><Check size={20} style={{ color: '#F9FAFB' }} /></div>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Contract change request submitted to HR</p>
            <p className="text-xs mt-1 font-mono" style={{ color: '#0D9488' }}>Ref: {ref}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{staffMember} &middot; {changeType} change &middot; Effective {effectiveDate || 'TBC'}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your contract change request has been submitted and HR will review it." />
        </div>
      )}
    </WizardShell>
  )
}

/* ────────────────────────────────────────────────────────────
   3. Request Leave Modal
   ──────────────────────────────────────────────────────────── */

export function RequestLeaveModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [leaveType, setLeaveType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [amOnly, setAmOnly] = useState(false)
  const [pmOnly, setPmOnly] = useState(false)
  const [reason, setReason] = useState('')
  const [coverArrangements, setCoverArrangements] = useState('')

  const leaveTypes = ['Annual Leave', 'Sick Leave', 'Compassionate', 'TOIL', 'Unpaid', 'Other']

  return (
    <WizardShell onClose={onClose} title="Request Leave" subtitle="Submit a leave request for approval" icon="🏖️"
      step={step} totalSteps={3} stepLabels={['Details', 'Justification', 'Confirm']} setStep={setStep}>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Leave Type</Label>
            <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option value="">Select leave type...</option>
              {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label req>Start Date</Label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
            </div>
            <div>
              <Label req>End Date</Label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
            </div>
          </div>
          <div>
            <Label>Half-day Options</Label>
            <div className="flex items-center gap-3 mt-1">
              <button onClick={() => { setAmOnly(!amOnly); if (!amOnly) setPmOnly(false) }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: amOnly ? '#0D9488' : '#1F2937', color: amOnly ? '#F9FAFB' : '#9CA3AF', border: '1px solid #374151' }}>AM Only</button>
              <button onClick={() => { setPmOnly(!pmOnly); if (!pmOnly) setAmOnly(false) }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: pmOnly ? '#0D9488' : '#1F2937', color: pmOnly ? '#F9FAFB' : '#9CA3AF', border: '1px solid #374151' }}>PM Only</button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Reason</Label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for leave request..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
          <div>
            <Label>Cover Arrangements</Label>
            <textarea value={coverArrangements} onChange={e => setCoverArrangements(e.target.value)} rows={3} placeholder="Who will cover your duties while you are away?" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center justify-center mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#0D9488' }}><Check size={20} style={{ color: '#F9FAFB' }} /></div>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Leave request submitted to line manager</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              {leaveType || 'Leave'} &middot; {startDate || 'TBC'} to {endDate || 'TBC'}
              {amOnly && ' (AM only)'}
              {pmOnly && ' (PM only)'}
            </p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your leave request has been submitted and your line manager will be notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ────────────────────────────────────────────────────────────
   4. Raise HR Concern Modal
   ──────────────────────────────────────────────────────────── */

export function RaiseHRConcernModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [concernType, setConcernType] = useState('')
  const [confidential, setConfidential] = useState(true)
  const [detail, setDetail] = useState('')
  const [witnesses, setWitnesses] = useState('')
  const [ref] = useState(() => genRef('HRC'))

  const concernTypes = ['Grievance', 'Bullying', 'Harassment', 'Discrimination', 'Workload', 'Other']

  return (
    <WizardShell onClose={onClose} title="Raise HR Concern" subtitle="Log a confidential concern with HR" icon="🛡️"
      step={step} totalSteps={3} stepLabels={['Details', 'Description', 'Confirm']} setStep={setStep}>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Concern Type</Label>
            <select value={concernType} onChange={e => setConcernType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option value="">Select concern type...</option>
              {concernTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label>Confidential?</Label>
            <div className="flex items-center gap-3 mt-1">
              <button onClick={() => setConfidential(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: confidential ? '#0D9488' : '#1F2937', color: confidential ? '#F9FAFB' : '#9CA3AF', border: '1px solid #374151' }}>Yes &mdash; Confidential</button>
              <button onClick={() => setConfidential(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: !confidential ? '#0D9488' : '#1F2937', color: !confidential ? '#F9FAFB' : '#9CA3AF', border: '1px solid #374151' }}>No</button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>Confidential concerns are only visible to senior HR staff.</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Detail</Label>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={5} placeholder="Describe the concern in as much detail as possible..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
          <div>
            <Label>Witnesses (optional)</Label>
            <textarea value={witnesses} onChange={e => setWitnesses(e.target.value)} rows={2} placeholder="Names of any witnesses, if applicable..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
          <div>
            <Label>Supporting Evidence</Label>
            <div className="rounded-lg px-4 py-6 text-center cursor-pointer" style={{ backgroundColor: '#1F2937', border: '2px dashed #374151' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Drag &amp; drop files here or click to upload</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>PDF, images, or documents up to 10MB</p>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex items-center justify-center mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#0D9488' }}><Check size={20} style={{ color: '#F9FAFB' }} /></div>
            </div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>HR concern logged confidentially</p>
            <p className="text-xs mt-1 font-mono" style={{ color: '#0D9488' }}>Ref: {ref}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{concernType || 'Concern'} &middot; {confidential ? 'Confidential' : 'Standard'}</p>
            <p className="text-xs mt-2 font-medium" style={{ color: '#F59E0B' }}>HR will respond within 48 hours.</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your concern has been securely logged and the HR team has been notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ────────────────────────────────────────────────────────────
   5. Staff Wellbeing Check Modal
   ──────────────────────────────────────────────────────────── */

const wellbeingQuestions = [
  'How are you feeling overall?',
  'Workload manageable?',
  'Supported by colleagues?',
  'Work-life balance?',
  'Professional development?',
]

function getRagStatus(score: number): { label: string; color: string; bg: string } {
  if (score >= 20) return { label: 'Green', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' }
  if (score >= 13) return { label: 'Amber', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
  return { label: 'Red', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
}

function getSupportActions(score: number): string[] {
  if (score >= 20) return [
    'Continue regular 1:1 check-ins',
    'Consider peer mentoring opportunities',
    'Celebrate positive wellbeing with the team',
  ]
  if (score >= 13) return [
    'Schedule a private wellbeing conversation',
    'Review workload and deadlines together',
    'Offer access to Employee Assistance Programme',
  ]
  return [
    'Arrange urgent 1:1 with line manager',
    'Refer to occupational health service',
    'Review workload and provide immediate support',
  ]
}

export function StaffWellbeingCheckModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [staffMember, setStaffMember] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0, 0])
  const [loading, setLoading] = useState(false)
  const [analysed, setAnalysed] = useState(false)

  const totalScore = scores.reduce((a, b) => a + b, 0)
  const rag = getRagStatus(totalScore)
  const actions = getSupportActions(totalScore)

  const handleSetStep = (s: number) => {
    if (s === 3 && !analysed) {
      setStep(3)
      setLoading(true)
      setTimeout(() => { setLoading(false); setAnalysed(true) }, 1800)
    } else {
      setStep(s)
    }
  }

  const setScore = (qi: number, val: number) => {
    setScores(prev => { const n = [...prev]; n[qi] = val; return n })
  }

  return (
    <WizardShell onClose={onClose} title="Staff Wellbeing Check" subtitle="Record a wellbeing check-in" icon="💚"
      step={step} totalSteps={3} stepLabels={['Select', 'Survey', 'AI Summary']} setStep={handleSetStep}>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Anonymous Team Check?</Label>
            <div className="flex items-center gap-3 mt-1">
              <button onClick={() => { setAnonymous(false) }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: !anonymous ? '#0D9488' : '#1F2937', color: !anonymous ? '#F9FAFB' : '#9CA3AF', border: '1px solid #374151' }}>Individual</button>
              <button onClick={() => { setAnonymous(true); setStaffMember('') }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: anonymous ? '#0D9488' : '#1F2937', color: anonymous ? '#F9FAFB' : '#9CA3AF', border: '1px solid #374151' }}>Anonymous Team Check</button>
            </div>
          </div>
          {!anonymous && (
            <div>
              <Label req>Staff Member</Label>
              <input value={staffMember} onChange={e => setStaffMember(e.target.value)} placeholder="Full name of the staff member" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          {wellbeingQuestions.map((q, qi) => (
            <div key={q}>
              <Label>{q}</Label>
              <div className="flex items-center gap-2 mt-1.5">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => setScore(qi, v)}
                    className="flex items-center justify-center rounded-lg text-sm font-bold transition-colors"
                    style={{
                      width: 40, height: 40,
                      backgroundColor: scores[qi] === v ? '#0D9488' : '#1F2937',
                      color: scores[qi] === v ? '#F9FAFB' : '#9CA3AF',
                      border: scores[qi] === v ? '1px solid #0D9488' : '1px solid #374151',
                    }}>
                    {v}
                  </button>
                ))}
                <span className="text-xs ml-2" style={{ color: '#6B7280' }}>
                  {scores[qi] === 0 ? '' : scores[qi] <= 2 ? 'Low' : scores[qi] <= 3 ? 'Moderate' : 'Good'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin" style={{ color: '#0D9488' }} />
              <p className="text-sm mt-3" style={{ color: '#9CA3AF' }}>Analysing wellbeing responses...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Wellbeing Score</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#F9FAFB' }}>{totalScore}<span className="text-sm font-normal" style={{ color: '#6B7280' }}> / 25</span></p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: rag.bg, border: `1px solid ${rag.color}33` }}>
                  <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>RAG Status</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: rag.color }}>{rag.label}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Suggested Support Actions</p>
                <div className="space-y-2">
                  {actions.map((action, i) => (
                    <div key={i} className="rounded-lg px-4 py-3 flex items-start gap-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#0D9488' }}>{i + 1}</div>
                      <p className="text-sm" style={{ color: '#D1D5DB' }}>{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Wellbeing check recorded</p>
                {!anonymous && staffMember && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{staffMember}</p>}
                {anonymous && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Anonymous team check</p>}
              </div>

              <DemoConfirm isDemoMode={isDemoMode} text="The wellbeing check has been recorded and any follow-up actions will be tracked." />
            </>
          )}
        </div>
      )}
    </WizardShell>
  )
}
