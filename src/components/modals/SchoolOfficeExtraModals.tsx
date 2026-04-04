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

/* ─────────────────────────────────────────────
   1. Visitor Sign-In Modal
   ───────────────────────────────────────────── */
export function VisitorSignInModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [purpose, setPurpose] = useState('Meeting')
  const [hostStaff, setHostStaff] = useState('')
  const [dbsChecked, setDbsChecked] = useState(false)
  const [photoIdVerified, setPhotoIdVerified] = useState(false)
  const [safeguardingLeaflet, setSafeguardingLeaflet] = useState(false)
  const [badgeNumber] = useState(`V-${String(Math.floor(Math.random() * 900) + 100)}`)

  return (
    <WizardShell onClose={onClose} title="Visitor Sign-In" subtitle="Register a visitor on site" icon="🪪" step={step} totalSteps={3} stepLabels={['Visitor', 'Safeguarding', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Full Name</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. John Smith" /></div>
          <div><Label>Organisation</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="e.g. Acme Ltd" /></div>
          <div><Label req>Purpose of Visit</Label>
            <select style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={purpose} onChange={e => setPurpose(e.target.value)}>
              {['Meeting', 'Delivery', 'Contractor', 'Parent', 'Governor', 'Inspector', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><Label req>Host Staff Member</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={hostStaff} onChange={e => setHostStaff(e.target.value)} placeholder="e.g. Mrs Jones" /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1F2937' }}>
            <span className="text-sm" style={{ color: '#F9FAFB' }}>DBS Checked</span>
            <button onClick={() => setDbsChecked(!dbsChecked)} className="w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: dbsChecked ? '#0D9488' : '#374151' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: dbsChecked ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1F2937' }}>
            <span className="text-sm" style={{ color: '#F9FAFB' }}>Photo ID Verified</span>
            <button onClick={() => setPhotoIdVerified(!photoIdVerified)} className="w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: photoIdVerified ? '#0D9488' : '#374151' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: photoIdVerified ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1F2937' }}>
            <span className="text-sm" style={{ color: '#F9FAFB' }}>Safeguarding Leaflet Provided</span>
            <button onClick={() => setSafeguardingLeaflet(!safeguardingLeaflet)} className="w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: safeguardingLeaflet ? '#0D9488' : '#374151' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: safeguardingLeaflet ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Badge Number:</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{badgeNumber}</span>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}><Check size={20} style={{ color: '#0D9488' }} /></div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Visitor signed in successfully. Badge {badgeNumber} issued.</p>
          </div>
          <div className="rounded-lg p-4 mt-3 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Name</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{fullName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Organisation</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{organisation || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Purpose</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{purpose}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Host</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{hostStaff || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>DBS</span><span className="text-xs font-medium" style={{ color: dbsChecked ? '#0D9488' : '#EF4444' }}>{dbsChecked ? 'Verified' : 'Not checked'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Photo ID</span><span className="text-xs font-medium" style={{ color: photoIdVerified ? '#0D9488' : '#EF4444' }}>{photoIdVerified ? 'Verified' : 'Not checked'}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Visitor record saved to the sign-in register." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   2. First Aid Log Modal
   ───────────────────────────────────────────── */
export function FirstAidLogModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [patientName, setPatientName] = useState('')
  const [yearGroupDept, setYearGroupDept] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [injuryType, setInjuryType] = useState('Cut')
  const [treatment, setTreatment] = useState('')
  const [administeredBy, setAdministeredBy] = useState('')
  const [parentContacted, setParentContacted] = useState(false)
  const [contactTime, setContactTime] = useState('')
  const [ref] = useState(genRef('FA'))

  return (
    <WizardShell onClose={onClose} title="First Aid Log" subtitle="Record a first aid incident" icon="🩹" step={step} totalSteps={3} stepLabels={['Patient', 'Treatment', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil / Staff Name</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Emily Carter" /></div>
          <div><Label req>Year Group / Department</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={yearGroupDept} onChange={e => setYearGroupDept(e.target.value)} placeholder="e.g. Year 4 or Admin" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label req>Date</Label><input type="date" style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><Label req>Time</Label><input type="time" style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Injury Type</Label>
            <select style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={injuryType} onChange={e => setInjuryType(e.target.value)}>
              {['Cut', 'Bruise', 'Head bump', 'Sprain', 'Burn', 'Illness', 'Allergic reaction', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><Label req>Treatment Given</Label><textarea style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={3} value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="Describe treatment administered..." /></div>
          <div><Label req>Administered By</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={administeredBy} onChange={e => setAdministeredBy(e.target.value)} placeholder="Staff name" /></div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1F2937' }}>
            <span className="text-sm" style={{ color: '#F9FAFB' }}>Parent Contacted</span>
            <button onClick={() => setParentContacted(!parentContacted)} className="w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: parentContacted ? '#0D9488' : '#374151' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: parentContacted ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
          </div>
          {parentContacted && (
            <div><Label>Time Contacted</Label><input type="time" style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={contactTime} onChange={e => setContactTime(e.target.value)} /></div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}><Check size={20} style={{ color: '#0D9488' }} /></div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>First aid log saved. Ref: {ref}. Parent notification {parentContacted ? 'sent' : 'pending'}.</p>
          </div>
          <div className="rounded-lg p-4 mt-3 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Patient</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{patientName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Year / Dept</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{yearGroupDept || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Date & Time</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{date} at {time}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Injury</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{injuryType}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Administered By</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{administeredBy || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Parent Contacted</span><span className="text-xs font-medium" style={{ color: parentContacted ? '#0D9488' : '#EF4444' }}>{parentContacted ? `Yes at ${contactTime}` : 'Pending'}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="First aid record saved and filed." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   3. Letter Generator Modal
   ───────────────────────────────────────────── */
export function LetterGeneratorModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [letterType, setLetterType] = useState('Absence follow-up')
  const [tone, setTone] = useState('Formal')
  const [pupilName, setPupilName] = useState('')
  const [parentName, setParentName] = useState('')
  const [details, setDetails] = useState('')
  const [generating, setGenerating] = useState(false)
  const [letterBody, setLetterBody] = useState('')

  useEffect(() => {
    if (step === 3 && !letterBody && !generating) {
      setGenerating(true)
      const timer = setTimeout(() => {
        setLetterBody(
`Lumio Academy
123 School Lane, London, SW1A 1AA
Tel: 020 7946 0958

${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

Dear ${parentName || 'Parent/Guardian'},

Re: ${letterType} — ${pupilName || 'Pupil'}

${tone === 'Formal'
  ? `I am writing to you regarding ${pupilName || 'your child'}'s ${letterType.toLowerCase()}. ${details ? details : 'We would appreciate the opportunity to discuss this matter with you at your earliest convenience.'}\n\nPlease do not hesitate to contact the school office should you wish to arrange a meeting or require any further information.`
  : tone === 'Friendly'
  ? `I hope this letter finds you well. I wanted to get in touch regarding ${pupilName || 'your child'}'s ${letterType.toLowerCase()}. ${details ? details : 'We would love to have a quick chat about how things are going and how we can best support your child.'}\n\nPlease feel free to pop into the office or give us a ring whenever suits you.`
  : `I am writing to formally address the matter of ${pupilName || 'your child'}'s ${letterType.toLowerCase()}. ${details ? details : 'It is important that this matter is addressed promptly.'}\n\nWe expect a response within 5 working days. Failure to respond may result in further action being taken in line with school policy.`
}

Yours ${tone === 'Friendly' ? 'sincerely' : 'faithfully'},

Mrs A. Thompson
Headteacher
Lumio Academy`
        )
        setGenerating(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [step, letterBody, generating, parentName, pupilName, letterType, tone, details])

  return (
    <WizardShell onClose={onClose} title="Letter Generator" subtitle="AI-assisted letter drafting" icon="✉️" step={step} totalSteps={4} stepLabels={['Type', 'Details', 'Generate', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Letter Type</Label>
            <select style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={letterType} onChange={e => setLetterType(e.target.value)}>
              {['Absence follow-up', 'Behaviour concern', 'Admissions', 'General', 'Event invitation', 'Trip permission', 'Attendance warning'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><Label req>Tone</Label>
            <div className="flex gap-2">
              {['Formal', 'Friendly', 'Firm'].map(t => (
                <button key={t} onClick={() => setTone(t)} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: tone === t ? 'rgba(13,148,136,0.2)' : '#1F2937', color: tone === t ? '#0D9488' : '#9CA3AF', border: tone === t ? '1px solid #0D9488' : '1px solid #374151' }}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="e.g. Oliver Brown" /></div>
          <div><Label req>Parent / Guardian Name</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={parentName} onChange={e => setParentName(e.target.value)} placeholder="e.g. Mr & Mrs Brown" /></div>
          <div><Label>Specific Details</Label><textarea style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={4} value={details} onChange={e => setDetails(e.target.value)} placeholder="Any additional context or details to include in the letter..." /></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: '#0D9488' }} />
              <p className="text-sm" style={{ color: '#6B7280' }}>Generating letter with AI...</p>
            </div>
          ) : (
            <div>
              <Label>Generated Letter (editable)</Label>
              <textarea style={{ ...iS, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }} className="w-full rounded-lg px-4 py-3 outline-none resize-none" rows={18} value={letterBody} onChange={e => setLetterBody(e.target.value)} />
            </div>
          )}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}><Check size={20} style={{ color: '#0D9488' }} /></div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Letter saved. Choose how to send:</p>
          </div>
          <div className="flex gap-2 mt-4">
            {['Print', 'Email', 'Post'].map(action => (
              <button key={action} onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors" style={{ backgroundColor: '#1F2937', color: '#F9FAFB', border: '1px solid #374151' }}>{action === 'Print' ? '🖨️' : action === 'Email' ? '📧' : '📮'} {action}</button>
            ))}
          </div>
          <div className="rounded-lg p-4 mt-3 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Type</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{letterType}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Tone</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{tone}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Pupil</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{pupilName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Recipient</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{parentName || '—'}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Letter generated and ready to send." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   4. Data Request Modal
   ───────────────────────────────────────────── */
export function DataRequestModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [requesterName, setRequesterName] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [email, setEmail] = useState('')
  const [purpose, setPurpose] = useState('')
  const [dataRequested, setDataRequested] = useState('')
  const [legalBasis, setLegalBasis] = useState('Consent')
  const [dataSubjects, setDataSubjects] = useState<string[]>([])
  const [ref] = useState(genRef('DSAR'))

  const toggleSubject = (s: string) => setDataSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  return (
    <WizardShell onClose={onClose} title="Data Request" subtitle="Log a data subject access request" icon="🔒" step={step} totalSteps={3} stepLabels={['Requester', 'Data', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Name</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={requesterName} onChange={e => setRequesterName(e.target.value)} placeholder="e.g. Jane Doe" /></div>
          <div><Label>Organisation</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="e.g. Local Authority" /></div>
          <div><Label req>Email</Label><input type="email" style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. jane@example.com" /></div>
          <div><Label req>Purpose</Label><textarea style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={3} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Reason for the data request..." /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>What Data Is Requested</Label><textarea style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={3} value={dataRequested} onChange={e => setDataRequested(e.target.value)} placeholder="Describe the specific data being requested..." /></div>
          <div><Label req>Legal Basis</Label>
            <select style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={legalBasis} onChange={e => setLegalBasis(e.target.value)}>
              {['Consent', 'Contract', 'Legal obligation', 'Vital interest', 'Public task', 'Legitimate interest'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label req>Data Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {['Staff', 'Pupils', 'Parents', 'Governors'].map(s => (
                <button key={s} onClick={() => toggleSubject(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ backgroundColor: dataSubjects.includes(s) ? 'rgba(13,148,136,0.2)' : '#1F2937', color: dataSubjects.includes(s) ? '#0D9488' : '#9CA3AF', border: dataSubjects.includes(s) ? '1px solid #0D9488' : '1px solid #374151' }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}><Check size={20} style={{ color: '#0D9488' }} /></div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Data request logged. DPO notified.</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Response due within 30 calendar days. Ref: {ref}</p>
            </div>
          </div>
          <div className="rounded-lg p-4 mt-3 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Requester</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{requesterName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Organisation</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{organisation || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Email</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Legal Basis</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{legalBasis}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Subjects</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{dataSubjects.join(', ') || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Deadline</span><span className="text-xs font-medium" style={{ color: '#EF4444' }}>{new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="DSAR logged and DPO notification sent." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   5. Medication Log Modal
   ───────────────────────────────────────────── */
export function MedicationLogModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [medicationName, setMedicationName] = useState('')
  const [dose, setDose] = useState('')
  const [prescriber, setPrescriber] = useState('')
  const [timeGiven, setTimeGiven] = useState(new Date().toTimeString().slice(0, 5))
  const [givenBy, setGivenBy] = useState('')
  const [witnessedBy, setWitnessedBy] = useState('')
  const [anyReaction, setAnyReaction] = useState(false)
  const [reactionDetails, setReactionDetails] = useState('')

  return (
    <WizardShell onClose={onClose} title="Medication Log" subtitle="Record medication administration" icon="💊" step={step} totalSteps={3} stepLabels={['Pupil', 'Administration', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="e.g. Sophie Williams" /></div>
          <div><Label req>Medication Name</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={medicationName} onChange={e => setMedicationName(e.target.value)} placeholder="e.g. Salbutamol Inhaler" /></div>
          <div><Label req>Dose</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 2 puffs" /></div>
          <div><Label req>Prescriber</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={prescriber} onChange={e => setPrescriber(e.target.value)} placeholder="e.g. Dr. Patel" /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Time Given</Label><input type="time" style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={timeGiven} onChange={e => setTimeGiven(e.target.value)} /></div>
          <div><Label req>Given By (Staff Name)</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={givenBy} onChange={e => setGivenBy(e.target.value)} placeholder="e.g. Mrs Hughes" /></div>
          <div><Label req>Witnessed By</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={witnessedBy} onChange={e => setWitnessedBy(e.target.value)} placeholder="e.g. Mr Davies" /></div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1F2937' }}>
            <span className="text-sm" style={{ color: '#F9FAFB' }}>Any Reaction</span>
            <button onClick={() => setAnyReaction(!anyReaction)} className="w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: anyReaction ? '#EF4444' : '#374151' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: anyReaction ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
          </div>
          {anyReaction && (
            <div><Label req>Reaction Details</Label><textarea style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={3} value={reactionDetails} onChange={e => setReactionDetails(e.target.value)} placeholder="Describe the reaction observed..." /></div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}><Check size={20} style={{ color: '#0D9488' }} /></div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Medication log entry saved. Parent notified.</p>
          </div>
          <div className="rounded-lg p-4 mt-3 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Pupil</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{pupilName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Medication</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{medicationName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Dose</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{dose || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Time</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{timeGiven}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Given By</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{givenBy || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Witnessed By</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{witnessedBy || '—'}</span></div>
            {anyReaction && <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Reaction</span><span className="text-xs font-medium" style={{ color: '#EF4444' }}>{reactionDetails || 'Yes — details pending'}</span></div>}
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Medication administration recorded and parent notification sent." />
        </div>
      )}
    </WizardShell>
  )
}

/* ─────────────────────────────────────────────
   6. Send Announcement Modal
   ───────────────────────────────────────────── */
export function SendAnnouncementModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('All Staff')
  const [priority, setPriority] = useState('Normal')

  const audienceCounts: Record<string, string> = {
    'All Staff': '~89 staff',
    'All Parents': '~1,147 parents',
    'All Pupils': '~632 pupils',
    'Year Group specific': '~128 recipients',
    'Custom': '~34 recipients',
  }

  const fillSampleText = () => {
    setBody(`Dear colleagues,

I hope this message finds you well. Please be reminded that the upcoming staff training day on Friday will focus on safeguarding updates and curriculum planning for the summer term.

All staff are expected to attend the briefing at 8:30am in the Main Hall. Please bring your laptops and any departmental action plans.

Tea and coffee will be provided. If you have any dietary requirements for the working lunch, please let the office know by Wednesday.

Thank you for your continued hard work and dedication.

Kind regards,
Senior Leadership Team`)
  }

  return (
    <WizardShell onClose={onClose} title="Send Announcement" subtitle="Broadcast to staff, parents or pupils" icon="📢" step={step} totalSteps={3} stepLabels={['Compose', 'Preview', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Subject</Label><input style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Staff Training Day Reminder" /></div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label req>Body</Label>
              <button onClick={fillSampleText} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>✨ AI Draft</button>
            </div>
            <textarea style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Type your announcement..." />
          </div>
          <div><Label req>Audience</Label>
            <select style={iS} className="w-full rounded-lg px-3 py-2 text-sm outline-none" value={audience} onChange={e => setAudience(e.target.value)}>
              {['All Staff', 'All Parents', 'All Pupils', 'Year Group specific', 'Custom'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><Label>Priority</Label>
            <div className="flex gap-2">
              {['Normal', 'Urgent'].map(p => (
                <button key={p} onClick={() => setPriority(p)} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: priority === p ? (p === 'Urgent' ? 'rgba(239,68,68,0.15)' : 'rgba(13,148,136,0.2)') : '#1F2937', color: priority === p ? (p === 'Urgent' ? '#EF4444' : '#0D9488') : '#9CA3AF', border: priority === p ? (p === 'Urgent' ? '1px solid #EF4444' : '1px solid #0D9488') : '1px solid #374151' }}>{p === 'Urgent' ? '🔴 ' : ''}{p}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>ANNOUNCEMENT PREVIEW</p>
              {priority === 'Urgent' && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>URGENT</span>}
            </div>
            <p className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>{subject || 'No subject'}</p>
            <div className="text-sm whitespace-pre-wrap" style={{ color: '#D1D5DB', lineHeight: '1.6' }}>{body || 'No content'}</div>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid #374151' }}>
              <p className="text-xs" style={{ color: '#6B7280' }}>Audience: <span style={{ color: '#0D9488' }}>{audience}</span></p>
            </div>
          </div>
          <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <span className="text-sm" style={{ color: '#0D9488' }}>📬</span>
            <p className="text-xs" style={{ color: '#6B7280' }}>This will be sent to <span className="font-semibold" style={{ color: '#F9FAFB' }}>{audienceCounts[audience] || '~89 staff'}</span></p>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}><Check size={20} style={{ color: '#0D9488' }} /></div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Announcement sent to {audience}.</p>
          </div>
          <div className="rounded-lg p-4 mt-3 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Subject</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{subject || '—'}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Audience</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{audience}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Recipients</span><span className="text-xs font-medium" style={{ color: '#0D9488' }}>{audienceCounts[audience]}</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Priority</span><span className="text-xs font-medium" style={{ color: priority === 'Urgent' ? '#EF4444' : '#F9FAFB' }}>{priority}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Announcement delivered to all selected recipients." />
        </div>
      )}
    </WizardShell>
  )
}
