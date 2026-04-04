'use client'
import { useState } from 'react'
import { X, ChevronRight, Check } from 'lucide-react'

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

/* ─── Chip multi-select helper ─── */
function ChipSelect({ options, selected, toggle }: { options: string[]; selected: string[]; toggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = selected.includes(o)
        return (
          <button key={o} type="button" onClick={() => toggle(o)} className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{ backgroundColor: on ? 'rgba(13,148,136,0.2)' : '#1F2937', color: on ? '#0D9488' : '#9CA3AF', border: `1px solid ${on ? '#0D9488' : '#374151'}` }}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

function useChips(initial: string[] = []) {
  const [selected, setSelected] = useState<string[]>(initial)
  const toggle = (v: string) => setSelected(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  return { selected, toggle }
}

/* ════════════════════════════════════════════════════════════════
   1. Progress Note Modal
   ════════════════════════════════════════════════════════════════ */
const SUBJECTS = ['Maths', 'English', 'Science', 'History', 'Geography', 'Art', 'PE', 'Music', 'RE', 'Computing', 'MFL', 'Other']
const PROGRESS_TAGS = ['Academic', 'Behaviour', 'SEND', 'Pastoral', 'Attendance']

export function ProgressNoteModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const tags = useChips()

  return (
    <WizardShell onClose={onClose} title="Progress Note" subtitle="Record pupil progress" icon="📝" step={step} totalSteps={3} stepLabels={['Select', 'Note', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Pupil Name</Label>
            <input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Subject</Label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none" style={iS}>
              <option value="">Select subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label req>Date</Label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Progress Note</Label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Describe pupil's progress..." rows={5} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
          <div>
            <Label>Tags</Label>
            <ChipSelect options={PROGRESS_TAGS} selected={tags.selected} toggle={tags.toggle} />
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Progress note saved to pupil record</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Pupil:</strong> {pupilName || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Subject:</strong> {subject || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Date:</strong> {date || '—'}</p>
              {tags.selected.length > 0 && <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Tags:</strong> {tags.selected.join(', ')}</p>}
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="This note will be visible on the pupil's record." />
        </div>
      )}
    </WizardShell>
  )
}

/* ════════════════════════════════════════════════════════════════
   2. Exclusion Request Modal
   ════════════════════════════════════════════════════════════════ */
const YEAR_GROUPS = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13']
const EXCLUSION_TYPES = ['Fixed Term', 'Permanent']
const EXCLUSION_REASONS = ['Persistent disruptive behaviour', 'Physical assault', 'Verbal abuse', 'Drug-related', 'Weapons', 'Other']

export function ExclusionRequestModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [ref] = useState(() => genRef('EXC'))
  const [pupilName, setPupilName] = useState('')
  const [yearGroup, setYearGroup] = useState('')
  const [type, setType] = useState('')
  const [reason, setReason] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [priorWarnings, setPriorWarnings] = useState('')
  const [sanctions, setSanctions] = useState('')
  const [evidence, setEvidence] = useState('')

  return (
    <WizardShell onClose={onClose} title="Exclusion Request" subtitle="Submit for SLT approval" icon="🚫" step={step} totalSteps={4} stepLabels={['Pupil', 'Incident', 'Evidence', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Pupil Name</Label>
            <input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Year Group</Label>
            <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none" style={iS}>
              <option value="">Select year group...</option>
              {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Exclusion Type</Label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none" style={iS}>
              <option value="">Select type...</option>
              {EXCLUSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Reason</Label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none" style={iS}>
              <option value="">Select reason...</option>
              {EXCLUSION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label req>Start Date</Label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
            </div>
            <div>
              <Label>End Date</Label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label req>Prior Warnings (count)</Label>
            <input type="number" min={0} value={priorWarnings} onChange={e => setPriorWarnings(e.target.value)} placeholder="0" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label>Sanctions Already Applied</Label>
            <textarea value={sanctions} onChange={e => setSanctions(e.target.value)} placeholder="List any previous sanctions..." rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
          <div>
            <Label>Supporting Evidence</Label>
            <textarea value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="Attach or describe supporting evidence..." rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Exclusion request submitted to SLT for sign-off. Ref: {ref}</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Pupil:</strong> {pupilName || '—'} ({yearGroup || '—'})</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Type:</strong> {type || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Reason:</strong> {reason || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Dates:</strong> {startDate || '—'} to {endDate || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Prior Warnings:</strong> {priorWarnings || '0'}</p>
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="This request will be routed to the Senior Leadership Team for review." />
        </div>
      )}
    </WizardShell>
  )
}

/* ════════════════════════════════════════════════════════════════
   3. Pastoral Meeting Modal
   ════════════════════════════════════════════════════════════════ */
const MEETING_PURPOSES = ['Behaviour review', 'Attendance review', 'SEND review', 'Reintegration', 'Parental concern', 'Other']
const ATTENDEE_OPTIONS = ['Class Teacher', 'Head of Year', 'SENCO', 'DSL', 'Parent/Carer', 'Pupil', 'External Agency']
const LOCATIONS = ['Meeting Room 1', 'Meeting Room 2', "Head's Office", 'SENCO Room', 'Main Hall']

export function PastoralMeetingModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [purpose, setPurpose] = useState('')
  const attendees = useChips()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')

  return (
    <WizardShell onClose={onClose} title="Pastoral Meeting" subtitle="Schedule a pastoral meeting" icon="🤝" step={step} totalSteps={3} stepLabels={['Details', 'Schedule', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Pupil Name</Label>
            <input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Purpose</Label>
            <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none" style={iS}>
              <option value="">Select purpose...</option>
              {MEETING_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <Label req>Attendees</Label>
            <ChipSelect options={ATTENDEE_OPTIONS} selected={attendees.selected} toggle={attendees.toggle} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Date</Label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Time</Label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Location</Label>
            <select value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none" style={iS}>
              <option value="">Select location...</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Meeting scheduled — all attendees notified</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Pupil:</strong> {pupilName || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Purpose:</strong> {purpose || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Attendees:</strong> {attendees.selected.length > 0 ? attendees.selected.join(', ') : '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>When:</strong> {date || '—'} at {time || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Location:</strong> {location || '—'}</p>
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Calendar invites will be sent to all attendees." />
        </div>
      )}
    </WizardShell>
  )
}

/* ════════════════════════════════════════════════════════════════
   4. CAF Referral Modal
   ════════════════════════════════════════════════════════════════ */
const CAF_SERVICES = ['CAMHS', 'Social Services', 'Speech & Language', 'Educational Psychologist', 'School Nurse', 'None']

export function CAFReferralModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [ref] = useState(() => genRef('CAF'))
  const [pupilName, setPupilName] = useState('')
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')
  const [concerns, setConcerns] = useState('')
  const services = useChips()
  const [parentAware, setParentAware] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [parentName, setParentName] = useState('')
  const [parentContact, setParentContact] = useState('')

  return (
    <WizardShell onClose={onClose} title="CAF Referral" subtitle="Common Assessment Framework referral" icon="📋" step={step} totalSteps={4} stepLabels={['Pupil', 'Concerns', 'Family', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Pupil Name</Label>
            <input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Date of Birth</Label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label>Address</Label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Pupil's home address..." rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Nature of Concern</Label>
            <textarea value={concerns} onChange={e => setConcerns(e.target.value)} placeholder="Describe the nature of the concern..." rows={5} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} />
          </div>
          <div>
            <Label>Services Already Involved</Label>
            <ChipSelect options={CAF_SERVICES} selected={services.selected} toggle={services.toggle} />
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg px-3 py-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#F9FAFB' }}>Parent/Carer Aware</span>
            <button type="button" onClick={() => setParentAware(!parentAware)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ backgroundColor: parentAware ? '#0D9488' : '#374151' }}>
              <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: parentAware ? 'translateX(22px)' : 'translateX(4px)' }} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#F9FAFB' }}>Consent Given</span>
            <button type="button" onClick={() => setConsentGiven(!consentGiven)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ backgroundColor: consentGiven ? '#0D9488' : '#374151' }}>
              <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: consentGiven ? 'translateX(22px)' : 'translateX(4px)' }} />
            </button>
          </div>
          <div>
            <Label req>Parent/Carer Name</Label>
            <input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
          <div>
            <Label req>Parent/Carer Contact</Label>
            <input value={parentContact} onChange={e => setParentContact(e.target.value)} placeholder="Phone or email" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} />
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>CAF referral submitted. Ref: {ref}</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Pupil:</strong> {pupilName || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>DOB:</strong> {dob || '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Services Involved:</strong> {services.selected.length > 0 ? services.selected.join(', ') : '—'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Parent Aware:</strong> {parentAware ? 'Yes' : 'No'} | <strong>Consent:</strong> {consentGiven ? 'Yes' : 'No'}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}><strong>Parent/Carer:</strong> {parentName || '—'} ({parentContact || '—'})</p>
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="This referral will be processed by the safeguarding team." />
        </div>
      )}
    </WizardShell>
  )
}
