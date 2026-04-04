'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, Check, Loader2 } from 'lucide-react'

// ─── Shared ──────────────────────────────────────────────────────────────────

type WizardStep = number
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

function genRef(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CLASSES = ['1A — Mrs Johnson', '2B — Mr Smith', '3C — Miss Taylor', '4D — Ms Brown', '5E — Mr Wilson', '6F — Mrs Davies']
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6']
const YEAR_GROUPS = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13']
const SUBJECTS = ['Maths', 'English', 'Science', 'History', 'Geography', 'Art', 'PE', 'Music', 'RE', 'Computing', 'MFL', 'DT']

const DEMO_PUPILS = [
  'Oliver Thompson', 'Amelia Clarke', 'Jack Williams', 'Isla Patel',
  'Harry Singh', 'Mia Roberts', 'George Baker', 'Sophie Evans',
]

const COVER_SUPERVISORS = [
  { name: 'Mrs K. Andrews', role: 'Cover Supervisor' },
  { name: 'Mr T. Hughes', role: 'Cover Supervisor' },
  { name: 'Ms L. Carter', role: 'HLTA' },
  { name: 'Mr D. Mitchell', role: 'Supply Teacher' },
  { name: 'Mrs R. Foster', role: 'Cover Supervisor' },
]

const BUDGET_CODES = ['GEN-001 General Supplies', 'CUR-002 Curriculum Resources', 'ICT-003 IT Equipment', 'SEN-004 SEND Resources', 'SPO-005 Sports Equipment', 'ART-006 Art Materials']

const DEPARTMENTS = ['English', 'Maths', 'Science', 'Humanities', 'Creative Arts', 'PE', 'SEND', 'Admin', 'Leadership', 'IT']

const today = () => new Date().toISOString().slice(0, 10)

// ─── 1. Mark Register ────────────────────────────────────────────────────────

type AttendanceMark = 'present' | 'absent' | 'late'

export function MarkRegisterModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [cls, setCls] = useState(CLASSES[0])
  const [date, setDate] = useState(today())
  const [period, setPeriod] = useState(PERIODS[0])
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>(
    () => Object.fromEntries(DEMO_PUPILS.map(p => [p, 'present' as AttendanceMark]))
  )

  const toggle = (pupil: string) => {
    setMarks(prev => {
      const order: AttendanceMark[] = ['present', 'absent', 'late']
      const cur = order.indexOf(prev[pupil])
      return { ...prev, [pupil]: order[(cur + 1) % 3] }
    })
  }

  const counts = {
    present: Object.values(marks).filter(m => m === 'present').length,
    absent: Object.values(marks).filter(m => m === 'absent').length,
    late: Object.values(marks).filter(m => m === 'late').length,
  }

  const markColor = (m: AttendanceMark) =>
    m === 'present' ? '#10B981' : m === 'absent' ? '#EF4444' : '#F59E0B'

  return (
    <WizardShell onClose={onClose} title="Mark Register" subtitle="Record attendance for a class" icon="\u{1F4CB}" step={step} totalSteps={3} stepLabels={['Select', 'Register', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Class</Label><select value={cls} onChange={e => setCls(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{CLASSES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Period</Label><select value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{PERIODS.map(p => <option key={p}>{p}</option>)}</select></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2">
          <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Tap each pupil to cycle: Present → Absent → Late</p>
          {DEMO_PUPILS.map(pupil => (
            <button key={pupil} onClick={() => toggle(pupil)} className="flex items-center justify-between w-full rounded-xl px-4 py-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{pupil}</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${markColor(marks[pupil])}20`, color: markColor(marks[pupil]) }}>
                {marks[pupil].charAt(0).toUpperCase() + marks[pupil].slice(1)}
              </span>
            </button>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Register Submitted</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{cls} &middot; {date} &middot; {period}</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div><p className="text-2xl font-bold" style={{ color: '#10B981' }}>{counts.present}</p><p className="text-xs" style={{ color: '#6B7280' }}>Present</p></div>
              <div><p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{counts.absent}</p><p className="text-xs" style={{ color: '#6B7280' }}>Absent</p></div>
              <div><p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{counts.late}</p><p className="text-xs" style={{ color: '#6B7280' }}>Late</p></div>
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="This register will be synced to your MIS immediately." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 2. Book Cover ───────────────────────────────────────────────────────────

export function BookCoverModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [teacher, setTeacher] = useState('')
  const [cls, setCls] = useState(CLASSES[0])
  const [date, setDate] = useState(today())
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([PERIODS[0]])
  const [prepared, setPrepared] = useState(true)
  const [notes, setNotes] = useState('')
  const [supervisor, setSupervisor] = useState('')

  const togglePeriod = (p: string) => {
    setSelectedPeriods(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  return (
    <WizardShell onClose={onClose} title="Book Cover" subtitle="Arrange cover for an absent teacher" icon="\u{1F504}" step={step} totalSteps={4} stepLabels={['Configure', 'Cover Work', 'Assign', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Absent Teacher</Label><input value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="e.g. Mrs Johnson" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Class</Label><select value={cls} onChange={e => setCls(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{CLASSES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div>
            <Label req>Periods</Label>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(p => (
                <button key={p} onClick={() => togglePeriod(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: selectedPeriods.includes(p) ? '#0D9488' : '#1F2937', color: selectedPeriods.includes(p) ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Cover Work Prepared?</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setPrepared(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: prepared === v ? '#0D9488' : '#1F2937', color: prepared === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Cover Notes / Instructions</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe the work to be covered..." rows={5} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-2">
          <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Select an available cover supervisor</p>
          {COVER_SUPERVISORS.map(cs => (
            <button key={cs.name} onClick={() => setSupervisor(cs.name)} className="flex items-center justify-between w-full rounded-xl px-4 py-3" style={{ backgroundColor: supervisor === cs.name ? 'rgba(13,148,136,0.1)' : '#1F2937', border: supervisor === cs.name ? '1px solid #0D9488' : '1px solid #374151' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{cs.name}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{cs.role}</p>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ border: supervisor === cs.name ? '2px solid #0D9488' : '2px solid #374151' }}>
                {supervisor === cs.name && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0D9488' }} />}
              </div>
            </button>
          ))}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Cover Booked</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}><strong style={{ color: '#0D9488' }}>{supervisor || 'No supervisor selected'}</strong> assigned to <strong>{cls}</strong></p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{date} &middot; {selectedPeriods.join(', ')}</p>
            {notes && <p className="text-xs mt-2 italic" style={{ color: '#9CA3AF' }}>Notes: {notes.slice(0, 80)}{notes.length > 80 ? '...' : ''}</p>}
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Cover notification will be sent to the assigned supervisor." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 3. New Admission ────────────────────────────────────────────────────────

export function NewAdmissionWizardModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('Female')
  const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[1])
  const [startDate, setStartDate] = useState(today())
  const [prevSchool, setPrevSchool] = useState('')
  const [send, setSend] = useState(false)
  const [medical, setMedical] = useState('')
  const [eal, setEal] = useState(false)
  const [ref] = useState(() => genRef('ADM'))

  return (
    <WizardShell onClose={onClose} title="New Admission" subtitle="Register a new pupil admission" icon="\u{1F393}" step={step} totalSteps={4} stepLabels={['Pupil Details', 'School Details', 'Additional Needs', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Full Name</Label><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Emily Watson" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Date of Birth</Label><input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div>
            <Label req>Gender</Label>
            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Female', 'Male', 'Other', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div>
          <div><Label req>Proposed Start Date</Label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label>Previous School</Label><input value={prevSchool} onChange={e => setPrevSchool(e.target.value)} placeholder="e.g. Oakwood Primary" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label>SEND</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setSend(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: send === v ? '#0D9488' : '#1F2937', color: send === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Medical Needs</Label><textarea value={medical} onChange={e => setMedical(e.target.value)} placeholder="Any medical needs, allergies, or conditions..." rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div>
            <Label>EAL (English as an Additional Language)</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setEal(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: eal === v ? '#0D9488' : '#1F2937', color: eal === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Admission Request Submitted</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{fullName || 'New Pupil'} &middot; {yearGroup} &middot; Starting {startDate}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="This admission will be added to the school roll and synced to your MIS." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 4. Submit Risk Assessment ───────────────────────────────────────────────

type Hazard = { name: string; likelihood: string; severity: string; mitigation: string }

export function SubmitRiskAssessmentModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [activity, setActivity] = useState('')
  const [date, setDate] = useState(today())
  const [location, setLocation] = useState('')
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [newHazard, setNewHazard] = useState('')
  const [newLikelihood, setNewLikelihood] = useState('Low')
  const [newSeverity, setNewSeverity] = useState('Low')
  const [assessor, setAssessor] = useState('')
  const [reviewer, setReviewer] = useState('')
  const [ref] = useState(() => genRef('RA'))

  const addHazard = () => {
    if (!newHazard.trim()) return
    setHazards(prev => [...prev, { name: newHazard, likelihood: newLikelihood, severity: newSeverity, mitigation: '' }])
    setNewHazard('')
    setNewLikelihood('Low')
    setNewSeverity('Low')
  }

  const updateMitigation = (idx: number, val: string) => {
    setHazards(prev => prev.map((h, i) => i === idx ? { ...h, mitigation: val } : h))
  }

  const LEVELS = ['Low', 'Medium', 'High']

  return (
    <WizardShell onClose={onClose} title="Risk Assessment" subtitle="Submit a risk assessment for review" icon="\u{26A0}\uFE0F" step={step} totalSteps={4} stepLabels={['Details', 'Hazards', 'Controls', 'Sign Off']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Activity / Trip Name</Label><input value={activity} onChange={e => setActivity(e.target.value)} placeholder="e.g. Year 5 Residential Trip" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Location</Label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. PGL Liddington" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="space-y-3">
              <div><Label req>Hazard</Label><input value={newHazard} onChange={e => setNewHazard(e.target.value)} placeholder="e.g. Uneven terrain" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Likelihood</Label><select value={newLikelihood} onChange={e => setNewLikelihood(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{LEVELS.map(l => <option key={l}>{l}</option>)}</select></div>
                <div><Label>Severity</Label><select value={newSeverity} onChange={e => setNewSeverity(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{LEVELS.map(l => <option key={l}>{l}</option>)}</select></div>
              </div>
              <button onClick={addHazard} className="w-full py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>+ Add Hazard</button>
            </div>
          </div>
          {hazards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Added Hazards ({hazards.length})</p>
              {hazards.map((h, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-4 py-2" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <span className="text-sm" style={{ color: '#F9FAFB' }}>{h.name}</span>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#374151', color: '#9CA3AF' }}>L: {h.likelihood}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#374151', color: '#9CA3AF' }}>S: {h.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hazards.length === 0 && <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>No hazards added yet. Add at least one hazard above.</p>}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          {hazards.length === 0
            ? <p className="text-xs text-center py-6" style={{ color: '#6B7280' }}>No hazards to show. Go back and add hazards first.</p>
            : hazards.map((h, i) => (
              <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>{h.name}</p>
                <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Likelihood: {h.likelihood} &middot; Severity: {h.severity}</p>
                <Label>Mitigation / Control Measures</Label>
                <textarea value={h.mitigation} onChange={e => updateMitigation(i, e.target.value)} placeholder="How will this risk be controlled?" rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
              </div>
            ))}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div><Label req>Assessor Name</Label><input value={assessor} onChange={e => setAssessor(e.target.value)} placeholder="Your full name" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Reviewer Name</Label><input value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="e.g. Head of Year" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Risk Assessment Ready</p>
            <p className="text-sm mt-1" style={{ color: '#D1D5DB' }}>{activity || 'Untitled Activity'} &middot; {hazards.length} hazard{hazards.length !== 1 ? 's' : ''} identified</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="This risk assessment will be sent to the reviewer for sign-off." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 5. Create Lesson Plan (Overview) ────────────────────────────────────────

export function CreateLessonPlanModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [year, setYear] = useState(YEAR_GROUPS[5])
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState('60 mins')
  const [objectives, setObjectives] = useState('')
  const [sendDiff, setSendDiff] = useState(false)
  const [sendNotes, setSendNotes] = useState('')
  const [format, setFormat] = useState('Standard')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    if (step === 3 && !generated) {
      setLoading(true)
      const t = setTimeout(() => { setLoading(false); setGenerated(true) }, 2200)
      return () => clearTimeout(t)
    }
  }, [step, generated])

  const DURATIONS = ['30 mins', '45 mins', '60 mins', '90 mins']
  const FORMATS = ['Standard', 'Differentiated', 'Enquiry-Based', 'Flipped']

  const samplePlan = `Lesson: ${topic || subject} — ${year}
Duration: ${duration}

Learning Objectives:
${objectives || '- Pupils will understand key concepts\n- Pupils will apply knowledge to problems'}

Starter (10 mins):
Retrieval quiz on prior learning. Discuss key vocabulary as a class.

Main Activity (${duration === '30 mins' ? '15' : duration === '45 mins' ? '25' : duration === '90 mins' ? '60' : '35'} mins):
Teacher-led explanation with worked examples. Pupils complete differentiated tasks${sendDiff ? ' with SEND-adapted resources' : ''}.

Plenary (10 mins):
Exit ticket to assess understanding. Peer discussion on key takeaways.

${sendDiff ? `\nSEND Adaptations:\n${sendNotes || 'Modified resources, additional scaffolding, visual aids provided.'}` : ''}
Assessment: Mini whiteboard checks, exit tickets, verbal Q&A.`

  return (
    <WizardShell onClose={onClose} title="Create Lesson Plan" subtitle="AI-assisted lesson planning" icon="\u{1F4DD}" step={step} totalSteps={4} stepLabels={['Configure', 'Options', 'Generate', 'Export']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Subject</Label><select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><Label req>Year Group</Label><select value={year} onChange={e => setYear(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div>
          <div><Label req>Topic</Label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions and Decimals" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Duration</Label><select value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{DURATIONS.map(d => <option key={d}>{d}</option>)}</select></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label>Learning Objectives</Label><textarea value={objectives} onChange={e => setObjectives(e.target.value)} placeholder="What should pupils know or be able to do by the end?" rows={4} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div>
            <Label>SEND Differentiation</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setSendDiff(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: sendDiff === v ? '#0D9488' : '#1F2937', color: sendDiff === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          {sendDiff && <div><Label>SEND Notes</Label><textarea value={sendNotes} onChange={e => setSendNotes(e.target.value)} placeholder="Specific adaptations needed..." rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>}
          <div><Label>Format</Label><select value={format} onChange={e => setFormat(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{FORMATS.map(f => <option key={f}>{f}</option>)}</select></div>
        </div>
      )}
      {step === 3 && (
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin" style={{ color: '#0D9488' }} />
              <p className="text-sm mt-3" style={{ color: '#9CA3AF' }}>Generating your lesson plan...</p>
            </div>
          ) : (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <pre className="text-xs whitespace-pre-wrap" style={{ color: '#D1D5DB', fontFamily: 'inherit', lineHeight: 1.7 }}>{samplePlan}</pre>
            </div>
          )}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Save to Library', color: '#0D9488' },
              { label: 'Print', color: '#F59E0B' },
              { label: 'Copy to Clipboard', color: '#8B5CF6' },
            ].map(b => (
              <button key={b.label} className="flex flex-col items-center gap-2 rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${b.color}20` }}>
                  <Check size={14} style={{ color: b.color }} />
                </div>
                <span className="text-xs font-medium text-center" style={{ color: '#D1D5DB' }}>{b.label}</span>
              </button>
            ))}
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Lesson plan saved to your teaching resource library." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 6. Send Parent Email ────────────────────────────────────────────────────

export function SendParentEmailModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [tone, setTone] = useState('Professional')

  const TONES = ['Professional', 'Friendly', 'Firm', 'Brief']

  return (
    <WizardShell onClose={onClose} title="Send Parent Email" subtitle="Compose and send an email to parents" icon="\u{2709}\uFE0F" step={step} totalSteps={3} stepLabels={['Compose', 'Preview', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>To</Label><input value={to} onChange={e => setTo(e.target.value)} placeholder="e.g. parent@email.com or 'Year 5 Parents'" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Subject</Label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Year 5 Trip Reminder" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Body</Label><textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message here..." rows={6} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div>
            <Label>AI Tone</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: tone === t ? '#0D9488' : '#1F2937', color: tone === t ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><span className="text-xs font-semibold" style={{ color: '#6B7280' }}>To:</span><span className="text-sm" style={{ color: '#F9FAFB' }}>{to || '(no recipient)'}</span></div>
              <div className="flex items-center gap-2"><span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Subject:</span><span className="text-sm" style={{ color: '#F9FAFB' }}>{subject || '(no subject)'}</span></div>
              <div className="flex items-center gap-2"><span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Tone:</span><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#0D948820', color: '#0D9488' }}>{tone}</span></div>
              <div style={{ borderTop: '1px solid #374151', paddingTop: 12 }}>
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#D1D5DB', lineHeight: 1.7 }}>{body || '(no content)'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Email Sent</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>Sent to <strong style={{ color: '#0D9488' }}>{to || '(no recipient)'}</strong></p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Subject: {subject || '(no subject)'}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Email will be delivered via the school mail system." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 7. Pupil Progress Note ──────────────────────────────────────────────────

export function PupilProgressNoteModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupil, setPupil] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const TAG_OPTIONS = ['Academic', 'Behaviour', 'SEND', 'Pastoral']

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  return (
    <WizardShell onClose={onClose} title="Pupil Progress Note" subtitle="Log a progress note against a pupil record" icon="\u{1F4C8}" step={step} totalSteps={3} stepLabels={['Select', 'Note', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupil} onChange={e => setPupil(e.target.value)} placeholder="e.g. Oliver Thompson" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Subject</Label><select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Progress Note</Label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Describe the pupil's progress, areas of strength, and areas for development..." rows={6} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TAG_OPTIONS.map(t => (
                <button key={t} onClick={() => toggleTag(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: tags.includes(t) ? '#0D9488' : '#1F2937', color: tags.includes(t) ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Progress Note Saved</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>Saved to <strong style={{ color: '#0D9488' }}>{pupil || 'pupil'}</strong>&apos;s record</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{subject} &middot; {date}{tags.length > 0 ? ` \u00B7 ${tags.join(', ')}` : ''}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="This note will be visible on the pupil's profile in your MIS." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 8. Request Resources ────────────────────────────────────────────────────

export function RequestResourcesModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [resource, setResource] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [supplier, setSupplier] = useState('')
  const [cost, setCost] = useState('')
  const [budgetCode, setBudgetCode] = useState(BUDGET_CODES[0])

  return (
    <WizardShell onClose={onClose} title="Request Resources" subtitle="Submit a resource purchase request" icon="\u{1F4E6}" step={step} totalSteps={3} stepLabels={['Item', 'Cost', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Resource Name</Label><input value={resource} onChange={e => setResource(e.target.value)} placeholder="e.g. Whiteboard markers (pack of 10)" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Quantity</Label><input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label>Supplier (optional)</Label><input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. YPO, TTS Group" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Estimated Cost</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>&pound;</span><input value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" className="w-full rounded-lg pl-7 pr-3 py-2 text-sm" style={iS} /></div></div>
          <div><Label req>Budget Code</Label><select value={budgetCode} onChange={e => setBudgetCode(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{BUDGET_CODES.map(b => <option key={b}>{b}</option>)}</select></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Resource Request Submitted</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{quantity}x {resource || 'item'}{cost ? ` \u00B7 \u00A3${cost}` : ''}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Sent to budget holder for approval</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Resource request submitted to the budget holder for approval." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 9. IT Support ───────────────────────────────────────────────────────────

export function ITSupportModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [issueType, setIssueType] = useState('Hardware')
  const [location, setLocation] = useState('')
  const [urgency, setUrgency] = useState('Medium')
  const [detail, setDetail] = useState('')
  const [assetTag, setAssetTag] = useState('')
  const [ref] = useState(() => genRef('IT'))

  const ISSUE_TYPES = ['Hardware', 'Software', 'Network', 'Account', 'Printer', 'Other']
  const URGENCIES = ['Low', 'Medium', 'High']

  return (
    <WizardShell onClose={onClose} title="IT Support Ticket" subtitle="Raise a support ticket for IT" icon="\u{1F4BB}" step={step} totalSteps={3} stepLabels={['Details', 'Description', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Issue Type</Label><select value={issueType} onChange={e => setIssueType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><Label req>Location</Label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room 14, Main Building" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div>
            <Label req>Urgency</Label>
            <div className="flex gap-3 mt-1">
              {URGENCIES.map(u => (
                <button key={u} onClick={() => setUrgency(u)} className="px-4 py-2 rounded-lg text-sm font-medium flex-1" style={{ backgroundColor: urgency === u ? (u === 'High' ? '#EF4444' : u === 'Medium' ? '#F59E0B' : '#0D9488') : '#1F2937', color: urgency === u ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Description</Label><textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder="Describe the issue in detail..." rows={6} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div><Label>Asset Tag (optional)</Label><input value={assetTag} onChange={e => setAssetTag(e.target.value)} placeholder="e.g. IT-LAP-0412" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>IT Support Ticket Raised</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{issueType} issue &middot; {location || 'No location'}</p>
            <p className="text-xs mt-1" style={{ color: urgency === 'High' ? '#EF4444' : urgency === 'Medium' ? '#F59E0B' : '#6B7280' }}>Urgency: {urgency}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="The IT team has been notified and will respond based on urgency." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 10. Book CPD ────────────────────────────────────────────────────────────

export function BookCPDModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [course, setCourse] = useState('')
  const [provider, setProvider] = useState('')
  const [date, setDate] = useState(today())
  const [cost, setCost] = useState('')
  const [coverNeeded, setCoverNeeded] = useState(false)
  const [manager, setManager] = useState('')
  const [justification, setJustification] = useState('')

  const MANAGERS = ['Mrs S. Headley (Headteacher)', 'Mr J. Allen (Deputy Head)', 'Mrs P. Kaur (Assistant Head)', 'Mr R. Bennett (Phase Lead)']

  return (
    <WizardShell onClose={onClose} title="Book CPD" subtitle="Submit a CPD booking for approval" icon="\u{1F4DA}" step={step} totalSteps={3} stepLabels={['Course', 'Approval', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Course Name</Label><input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. NPQSL Module 3" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Provider</Label><input value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g. Ambition Institute" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label>Cost</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>&pound;</span><input value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" className="w-full rounded-lg pl-7 pr-3 py-2 text-sm" style={iS} /></div></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Cover Needed?</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setCoverNeeded(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: coverNeeded === v ? '#0D9488' : '#1F2937', color: coverNeeded === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div><Label req>Approving Manager</Label><select value={manager} onChange={e => setManager(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}><option value="">Select manager...</option>{MANAGERS.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><Label req>Justification</Label><textarea value={justification} onChange={e => setJustification(e.target.value)} placeholder="Why is this CPD relevant to your role and the school development plan?" rows={4} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>CPD Booking Submitted</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{course || 'Untitled Course'} &middot; {provider || 'No provider'}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{date}{cost ? ` \u00B7 \u00A3${cost}` : ''}{coverNeeded ? ' \u00B7 Cover required' : ''}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Awaiting approval from {manager || 'line manager'}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your CPD request will be sent to your line manager for approval." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 11. Claim Expenses ──────────────────────────────────────────────────────

export function ClaimExpensesWizardModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [expenseType, setExpenseType] = useState('Travel')
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [mileage, setMileage] = useState('')
  const [ref] = useState(() => genRef('EXP'))

  const EXPENSE_TYPES = ['Travel', 'Accommodation', 'Meals', 'Resources', 'Training', 'Equipment', 'Other']

  return (
    <WizardShell onClose={onClose} title="Claim Expenses" subtitle="Submit an expense claim for reimbursement" icon="\u{1F4B7}" step={step} totalSteps={3} stepLabels={['Details', 'Evidence', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Expense Type</Label><select value={expenseType} onChange={e => setExpenseType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Amount</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>&pound;</span><input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-lg pl-7 pr-3 py-2 text-sm" style={iS} /></div></div>
          <div><Label req>Description</Label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Train fare to London for INSET day" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Receipt Upload</Label>
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#1F2937', border: '2px dashed #374151' }}>
              <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Drag and drop receipt here</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>or click to browse (PNG, JPG, PDF)</p>
              <button className="mt-3 px-4 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: '#374151', color: '#D1D5DB' }}>Choose File</button>
            </div>
          </div>
          {expenseType === 'Travel' && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <Label>Mileage Calculator (if applicable)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div><label className="text-xs" style={{ color: '#6B7280' }}>Miles</label><input value={mileage} onChange={e => setMileage(e.target.value)} placeholder="0" type="number" className="w-full rounded-lg px-3 py-2 text-sm mt-1" style={iS} /></div>
                <div><label className="text-xs" style={{ color: '#6B7280' }}>Rate</label><input value="0.45" readOnly className="w-full rounded-lg px-3 py-2 text-sm mt-1" style={{ ...iS, opacity: 0.6 }} /></div>
              </div>
              {mileage && <p className="text-xs mt-2" style={{ color: '#0D9488' }}>Mileage claim: &pound;{(parseFloat(mileage) * 0.45).toFixed(2)}</p>}
            </div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Expense Claim Submitted</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{expenseType} &middot; &pound;{amount || '0.00'}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{description || 'No description'} &middot; {date}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your expense claim has been submitted for processing." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 12. Request Leave ───────────────────────────────────────────────────────

export function RequestLeaveModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [leaveType, setLeaveType] = useState('Annual')
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(today())
  const [halfDayStart, setHalfDayStart] = useState(false)
  const [halfDayEnd, setHalfDayEnd] = useState(false)
  const [reason, setReason] = useState('')
  const [coverArrangements, setCoverArrangements] = useState('')

  const LEAVE_TYPES = ['Annual', 'Sick', 'Compassionate', 'TOIL', 'Other']

  return (
    <WizardShell onClose={onClose} title="Request Leave" subtitle="Submit a leave request for approval" icon="\u{1F4C5}" step={step} totalSteps={3} stepLabels={['Details', 'Justification', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Leave Type</Label><select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label req>Start Date</Label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={halfDayStart} onChange={e => setHalfDayStart(e.target.checked)} className="rounded" />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Half day (PM only)</span>
              </label>
            </div>
            <div>
              <Label req>End Date</Label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={halfDayEnd} onChange={e => setHalfDayEnd(e.target.checked)} className="rounded" />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Half day (AM only)</span>
              </label>
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Reason</Label><textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide a reason for your leave request..." rows={4} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div><Label>Cover Arrangements</Label><textarea value={coverArrangements} onChange={e => setCoverArrangements(e.target.value)} placeholder="What cover arrangements have been made for your classes/duties?" rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Leave Request Submitted</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{leaveType} Leave &middot; {startDate}{startDate !== endDate ? ` to ${endDate}` : ''}</p>
            {(halfDayStart || halfDayEnd) && <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{halfDayStart ? 'Starts PM' : ''}{halfDayStart && halfDayEnd ? ' \u00B7 ' : ''}{halfDayEnd ? 'Ends AM' : ''}</p>}
            <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Awaiting line manager approval</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Your leave request has been sent to your line manager for approval." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 13. Report Staff Absence ────────────────────────────────────────────────

export function ReportStaffAbsenceModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [date, setDate] = useState(today())
  const [absenceType, setAbsenceType] = useState('Illness')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [coverNeeded, setCoverNeeded] = useState(true)

  const ABSENCE_TYPES = ['Illness', 'Emergency', 'Personal']

  return (
    <WizardShell onClose={onClose} title="Report Staff Absence" subtitle="Log a staff absence and arrange cover" icon="\u{1F6A8}" step={step} totalSteps={3} stepLabels={['Staff Member', 'Absence', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Staff Name</Label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mr T. Hughes" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Role</Label><input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Class Teacher" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Department</Label><select value={department} onChange={e => setDepartment(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Date of Absence</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Type</Label><select value={absenceType} onChange={e => setAbsenceType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{ABSENCE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><Label>Expected Return</Label><input type="date" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div>
            <Label>Cover Needed?</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setCoverNeeded(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: coverNeeded === v ? '#0D9488' : '#1F2937', color: coverNeeded === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Staff Absence Logged</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{name || 'Staff member'} &middot; {role || 'No role'} &middot; {department}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{absenceType} &middot; {date}{expectedReturn ? ` \u00B7 Return: ${expectedReturn}` : ''}</p>
            {coverNeeded && <p className="text-xs mt-2 font-semibold" style={{ color: '#F59E0B' }}>Cover team has been notified</p>}
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="The absence has been recorded and the cover team notified." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 14. Refer to SENCo ──────────────────────────────────────────────────────

export function ReferToSencoModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[7])
  const [formClass, setFormClass] = useState('')
  const [concerns, setConcerns] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [supportTried, setSupportTried] = useState<string[]>([])
  const [parentAware, setParentAware] = useState('')
  const [notes, setNotes] = useState('')
  const [ref] = useState(() => genRef('SEND'))

  const CONCERN_AREAS = ['\u{1F9E0} Learning difficulty', '\u{1F4AC} Communication / speech', '\u{1F465} Social interaction', '\u{1F61F} Emotional / mental health', '\u{1F3C3} Physical / medical', '\u{1F4DA} Academic progress', '\u{1F30D} EAL / language barrier', '\u26A1 Behaviour / SEMH']
  const SUPPORT_OPTIONS = ['Differentiated work in class', 'Seating adjustments', 'Extra time on tasks', 'Verbal check-ins', 'Parental contact made', 'Discussed with form tutor', 'Referred to pastoral team', 'None yet']
  const DURATION_OPTIONS = ['Less than 4 weeks', '4\u20138 weeks', '1\u20132 terms', 'More than 2 terms', 'Since start of year']

  const toggleConcern = (c: string) => setConcerns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  const toggleSupport = (s: string) => setSupportTried(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  return (
    <WizardShell onClose={onClose} title="Refer to SENCo" subtitle="Submit a SEND referral for a pupil" icon="\u{1F9E9}" step={step} totalSteps={4} stepLabels={['Pupil', 'Concern', 'Support Tried', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="e.g. Oliver Thompson" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div>
          <div><Label req>Form / Class</Label><input value={formClass} onChange={e => setFormClass(e.target.value)} placeholder="e.g. 9T" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Areas of Concern</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CONCERN_AREAS.map(c => (
                <button key={c} onClick={() => toggleConcern(c)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: concerns.includes(c) ? '#0D9488' : '#1F2937', color: concerns.includes(c) ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div><Label req>Description of Concerns</Label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the concerns you have observed..." rows={4} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div><Label req>How Long Has This Been a Concern?</Label><select value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}><option value="">Select duration...</option>{DURATION_OPTIONS.map(d => <option key={d}>{d}</option>)}</select></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label req>Support Already Tried</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SUPPORT_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleSupport(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: supportTried.includes(s) ? '#0D9488' : '#1F2937', color: supportTried.includes(s) ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label req>Is the Parent / Carer Aware?</Label>
            <div className="flex gap-3 mt-1">
              {['Yes', 'No', 'Unsure'].map(v => (
                <button key={v} onClick={() => setParentAware(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: parentAware === v ? '#0D9488' : '#1F2937', color: parentAware === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Additional Notes</Label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any other relevant information..." rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{'\u2705'} SEND Referral Submitted</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{pupilName || 'Pupil'} &middot; {yearGroup}{formClass ? ` &middot; ${formClass}` : ''}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{concerns.length} concern area{concerns.length !== 1 ? 's' : ''} &middot; {supportTried.length} support{supportTried.length !== 1 ? 's' : ''} tried &middot; Parent aware: {parentAware || 'N/A'}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="On a live plan this would be logged to the pupil's record and relevant staff notified." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 15. New Concern ────────────────────────────────────────────────────────

export function NewConcernModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[7])
  const [formClass, setFormClass] = useState('')
  const [nature, setNature] = useState('')
  const [description, setDescription] = useState('')
  const [physicalSigns, setPhysicalSigns] = useState(false)
  const [physicalNotes, setPhysicalNotes] = useState('')
  const [urgency, setUrgency] = useState('')
  const [ref] = useState(() => genRef('CON'))

  const NATURE_OPTIONS = ['Academic', 'Pastoral', 'Safeguarding', 'Attendance', 'Behaviour', 'SEND', 'Wellbeing', 'Other']
  const URGENCY_LEVELS: { label: string; color: string }[] = [
    { label: 'Low', color: '#10B981' },
    { label: 'Medium', color: '#F59E0B' },
    { label: 'High', color: '#EF4444' },
    { label: 'Urgent', color: '#EF4444' },
  ]

  return (
    <WizardShell onClose={onClose} title="New Concern" subtitle="Log a concern about a pupil" icon="\u{1F6A9}" step={step} totalSteps={4} stepLabels={['Pupil', 'Concern', 'Urgency', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="e.g. Oliver Thompson" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div>
          <div><Label req>Form / Class</Label><input value={formClass} onChange={e => setFormClass(e.target.value)} placeholder="e.g. 9T" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Nature of Concern</Label><select value={nature} onChange={e => setNature(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}><option value="">Select...</option>{NATURE_OPTIONS.map(n => <option key={n}>{n}</option>)}</select></div>
          <div><Label req>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you have observed or been told..." rows={5} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div>
            <Label>Physical Signs Observed?</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setPhysicalSigns(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: physicalSigns === v ? '#0D9488' : '#1F2937', color: physicalSigns === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          {physicalSigns && <div><Label>Physical Signs Notes</Label><textarea value={physicalNotes} onChange={e => setPhysicalNotes(e.target.value)} placeholder="Describe what was observed..." rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label req>Urgency Level</Label>
            <div className="flex flex-wrap gap-3 mt-1">
              {URGENCY_LEVELS.map(u => (
                <button key={u.label} onClick={() => setUrgency(u.label)} className="px-4 py-2 rounded-lg text-sm font-medium flex-1" style={{ backgroundColor: urgency === u.label ? u.color : '#1F2937', color: urgency === u.label ? '#fff' : '#9CA3AF', border: '1px solid #374151', animation: urgency === 'Urgent' && u.label === 'Urgent' ? 'pulse 1.5s infinite' : undefined }}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
          {urgency === 'Urgent' && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{'\u{1F6A8}'} This will notify the DSL immediately</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>The Designated Safeguarding Lead will be alerted as soon as this concern is submitted.</p>
            </div>
          )}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{'\u2705'} Concern Logged</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{pupilName || 'Pupil'} &middot; {yearGroup}{formClass ? ` &middot; ${formClass}` : ''}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{nature || 'No category'}{physicalSigns ? ' &middot; Physical signs noted' : ''}</p>
            <p className="text-xs mt-1" style={{ color: urgency === 'Urgent' || urgency === 'High' ? '#EF4444' : urgency === 'Medium' ? '#F59E0B' : '#6B7280' }}>Urgency: {urgency || 'Not set'}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="On a live plan this would be logged to the pupil's record and relevant staff notified." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 16. Behaviour Incident ─────────────────────────────────────────────────

export function BehaviourIncidentModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[7])
  const [formClass, setFormClass] = useState('')
  const [date, setDate] = useState(today())
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [incidentType, setIncidentType] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [witnesses, setWitnesses] = useState('')
  const [sanction, setSanction] = useState('')
  const [parentContact, setParentContact] = useState(false)
  const [contactMethod, setContactMethod] = useState('')
  const [ref] = useState(() => genRef('BEH'))

  const INCIDENT_TYPES = ['Defiance', 'Disruption', 'Verbal abuse', 'Physical aggression', 'Bullying', 'Vandalism', 'Truancy', 'Late to lesson', 'Phone misuse', 'Uniform violation', 'Smoking / vaping', 'Other']
  const SANCTION_OPTIONS = ['Verbal warning', 'Written warning', 'Break detention', 'Lunch detention', 'After-school detention', 'Internal exclusion', 'Fixed-term exclusion', 'Referral to HoY', 'Referral to SLT']
  const CONTACT_METHODS = ['Phone call', 'Email', 'Letter', 'In person', 'Text message']

  const toggleIncident = (t: string) => setIncidentType(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  return (
    <WizardShell onClose={onClose} title="Behaviour Incident" subtitle="Log a behaviour incident for a pupil" icon="\u{26A0}\uFE0F" step={step} totalSteps={4} stepLabels={['Pupil', 'Incident', 'Sanction', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="e.g. Oliver Thompson" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div>
          <div><Label req>Form / Class</Label><input value={formClass} onChange={e => setFormClass(e.target.value)} placeholder="e.g. 9T" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
            <div><Label req>Time</Label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          </div>
          <div><Label req>Location</Label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Room 14, Playground" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Incident Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {INCIDENT_TYPES.map(t => (
                <button key={t} onClick={() => toggleIncident(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-left" style={{ backgroundColor: incidentType.includes(t) ? '#0D9488' : '#1F2937', color: incidentType.includes(t) ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div><Label req>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what happened..." rows={4} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div><Label>Witnesses</Label><input value={witnesses} onChange={e => setWitnesses(e.target.value)} placeholder="e.g. Mrs Johnson, Jack Williams" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div><Label req>Sanction Applied</Label><select value={sanction} onChange={e => setSanction(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}><option value="">Select sanction...</option>{SANCTION_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div>
            <Label>Parent / Carer Contacted?</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setParentContact(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: parentContact === v ? '#0D9488' : '#1F2937', color: parentContact === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          {parentContact && (
            <div><Label>Contact Method</Label><select value={contactMethod} onChange={e => setContactMethod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}><option value="">Select method...</option>{CONTACT_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
          )}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{'\u2705'} Behaviour Incident Logged</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{pupilName || 'Pupil'} &middot; {yearGroup}{formClass ? ` &middot; ${formClass}` : ''}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{incidentType.join(', ') || 'No type'} &middot; {date}{time ? ` ${time}` : ''} &middot; {location || 'No location'}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Sanction: {sanction || 'None'}{parentContact ? ` &middot; Parent contacted (${contactMethod || 'method not set'})` : ''}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="On a live plan this would be logged to the pupil's record and relevant staff notified." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 17. Log Absence ────────────────────────────────────────────────────────

export function LogAbsenceModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[7])
  const [formClass, setFormClass] = useState('')
  const [date, setDate] = useState(today())
  const [session, setSession] = useState('')
  const [reason, setReason] = useState('')
  const [parentContacted, setParentContacted] = useState(false)
  const [contactMethod, setContactMethod] = useState('')
  const [firstDayCall, setFirstDayCall] = useState(false)
  const [ref] = useState(() => genRef('ABS'))

  const SESSION_OPTIONS = ['AM', 'PM', 'Full day', 'Multiple days']
  const REASON_OPTIONS = ['Illness', 'Medical appointment', 'Family holiday', 'Religious observance', 'Bereavement', 'Excluded', 'Traveller absence', 'Unexplained', 'Other']
  const CONTACT_METHODS = ['Phone call', 'Email', 'Letter', 'In person', 'Text message']

  return (
    <WizardShell onClose={onClose} title="Log Absence" subtitle="Record a pupil absence" icon="\u{1F4C5}" step={step} totalSteps={3} stepLabels={['Pupil', 'Absence', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="e.g. Oliver Thompson" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div>
          <div><Label req>Form / Class</Label><input value={formClass} onChange={e => setFormClass(e.target.value)} placeholder="e.g. 9T" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div>
            <Label req>Session</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SESSION_OPTIONS.map(s => (
                <button key={s} onClick={() => setSession(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: session === s ? '#0D9488' : '#1F2937', color: session === s ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div><Label req>Reason</Label><select value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}><option value="">Select reason...</option>{REASON_OPTIONS.map(r => <option key={r}>{r}</option>)}</select></div>
          <div>
            <Label>Parent / Carer Contacted?</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setParentContacted(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: parentContacted === v ? '#0D9488' : '#1F2937', color: parentContacted === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          {parentContacted && (
            <div><Label>Contact Method</Label><select value={contactMethod} onChange={e => setContactMethod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}><option value="">Select method...</option>{CONTACT_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
          )}
          <div>
            <Label>First Day Call Completed?</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setFirstDayCall(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: firstDayCall === v ? '#0D9488' : '#1F2937', color: firstDayCall === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{'\u2705'} Absence Logged</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{pupilName || 'Pupil'} &middot; {yearGroup}{formClass ? ` &middot; ${formClass}` : ''}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{date} &middot; {session || 'No session'} &middot; {reason || 'No reason'}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{parentContacted ? `Parent contacted (${contactMethod || 'method not set'})` : 'Parent not yet contacted'}{firstDayCall ? ' &middot; First day call done' : ''}</p>
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="On a live plan this would be logged to the pupil's record and relevant staff notified." />
        </div>
      )}
    </WizardShell>
  )
}

// ─── 18. Parent Contact ─────────────────────────────────────────────────────

export function ParentContactModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [yearGroup, setYearGroup] = useState(YEAR_GROUPS[7])
  const [contactType, setContactType] = useState('')
  const [subject, setSubject] = useState('')
  const [contactName, setContactName] = useState('')
  const [outcome, setOutcome] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followAction, setFollowAction] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [ref] = useState(() => genRef('PC'))

  const CONTACT_TYPES = ['Phone call', 'Email', 'In-person meeting', 'Parents evening', 'Home visit', 'Letter sent', 'Text message', 'Video call']

  return (
    <WizardShell onClose={onClose} title="Parent Contact" subtitle="Log a parent or carer contact" icon="\u{1F4DE}" step={step} totalSteps={3} stepLabels={['Pupil', 'Contact', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="e.g. Oliver Thompson" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Year Group</Label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>{YEAR_GROUPS.map(y => <option key={y}>{y}</option>)}</select></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Contact Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {CONTACT_TYPES.map(t => (
                <button key={t} onClick={() => setContactType(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-left" style={{ backgroundColor: contactType === t ? '#0D9488' : '#1F2937', color: contactType === t ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div><Label req>Subject</Label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Attendance concern, progress update" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Contact Name</Label><input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Mrs Thompson (Mother)" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
          <div><Label req>Outcome / Notes</Label><textarea value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="Summarise the conversation and any agreed actions..." rows={4} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} /></div>
          <div>
            <Label>Follow-Up Required?</Label>
            <div className="flex gap-3 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setFollowUp(v)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: followUp === v ? '#0D9488' : '#1F2937', color: followUp === v ? '#fff' : '#9CA3AF', border: '1px solid #374151' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          {followUp && (
            <div className="space-y-4">
              <div><Label req>Follow-Up Action</Label><input value={followAction} onChange={e => setFollowAction(e.target.value)} placeholder="e.g. Call again in 2 weeks" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
              <div><Label req>Due Date</Label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} /></div>
            </div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{'\u2705'} Parent Contact Logged</p>
            <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>{pupilName || 'Pupil'} &middot; {yearGroup}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{contactType || 'No type'} &middot; {contactName || 'No contact'} &middot; {subject || 'No subject'}</p>
            {followUp && <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>Follow-up: {followAction || 'Action pending'}{dueDate ? ` &middot; Due: ${dueDate}` : ''}</p>}
            <p className="text-xs mt-2 font-mono" style={{ color: '#0D9488' }}>Reference: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="On a live plan this would be logged to the pupil's record and relevant staff notified." />
        </div>
      )}
    </WizardShell>
  )
}
