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

/* ------------------------------------------------------------------ */
/*  1. Risk Assessment Modal                                          */
/* ------------------------------------------------------------------ */

type Hazard = { id: number; description: string; likelihood: string; severity: string }

export function RiskAssessmentModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [activity, setActivity] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')

  const [hazards, setHazards] = useState<Hazard[]>([])
  const [hDesc, setHDesc] = useState('')
  const [hLikelihood, setHLikelihood] = useState('Low')
  const [hSeverity, setHSeverity] = useState('Low')
  const [nextId, setNextId] = useState(1)

  const [mitigations, setMitigations] = useState<Record<number, string>>({})

  const [assessor, setAssessor] = useState('')
  const [reviewer, setReviewer] = useState('')
  const [signDate, setSignDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const [ref] = useState(() => genRef('RA'))

  const addHazard = () => {
    if (!hDesc.trim()) return
    setHazards(prev => [...prev, { id: nextId, description: hDesc, likelihood: hLikelihood, severity: hSeverity }])
    setNextId(n => n + 1)
    setHDesc('')
    setHLikelihood('Low')
    setHSeverity('Low')
  }

  const removeHazard = (id: number) => {
    setHazards(prev => prev.filter(h => h.id !== id))
    setMitigations(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  return (
    <WizardShell onClose={onClose} title="Risk Assessment" subtitle="Document hazards and control measures" icon="\u26A0\uFE0F" step={step} totalSteps={4} stepLabels={['Details', 'Hazards', 'Controls', 'Sign Off']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Activity / Trip Name</Label><input value={activity} onChange={e => setActivity(e.target.value)} placeholder="e.g. Year 6 Residential Trip" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label req>Location</Label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. PGL Liddington" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div><Label>Hazard Description</Label><input value={hDesc} onChange={e => setHDesc(e.target.value)} placeholder="Describe the hazard..." className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Likelihood</Label>
                <select value={hLikelihood} onChange={e => setHLikelihood(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
              <div>
                <Label>Severity</Label>
                <select value={hSeverity} onChange={e => setHSeverity(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
              </div>
            </div>
            <button onClick={addHazard} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Add Hazard</button>
          </div>

          {hazards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Added Hazards ({hazards.length})</p>
              {hazards.map(h => (
                <div key={h.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{h.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Likelihood: {h.likelihood} &middot; Severity: {h.severity}</p>
                  </div>
                  <button onClick={() => removeHazard(h.id)} className="rounded-lg p-1 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {hazards.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>No hazards added yet. Add at least one hazard above.</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {hazards.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>No hazards to assign controls to. Go back and add hazards first.</p>
          ) : (
            hazards.map(h => (
              <div key={h.id} className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{h.description}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Likelihood: {h.likelihood} &middot; Severity: {h.severity}</p>
                <Label>Mitigation Measures</Label>
                <textarea
                  value={mitigations[h.id] || ''}
                  onChange={e => setMitigations(prev => ({ ...prev, [h.id]: e.target.value }))}
                  placeholder="Describe the control measures to reduce this risk..."
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={iS}
                />
              </div>
            ))
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div><Label req>Assessor Name</Label><input value={assessor} onChange={e => setAssessor(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label req>Reviewer Name</Label><input value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label req>Date</Label><input type="date" value={signDate} onChange={e => setSignDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="rounded" />
            <span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>I confirm this assessment is accurate</span>
          </label>

          <div className="rounded-xl p-4 mt-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Risk assessment submitted. Ref: {ref}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Risk assessment will be saved and available for review." />
        </div>
      )}
    </WizardShell>
  )
}

/* ------------------------------------------------------------------ */
/*  2. Generate SEND Report Modal                                     */
/* ------------------------------------------------------------------ */

export function GenerateSENDReportModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupil, setPupil] = useState('')
  const [reportType, setReportType] = useState('Annual Review')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (step === 2) {
      setLoading(true)
      const t = setTimeout(() => setLoading(false), 2000)
      return () => clearTimeout(t)
    }
  }, [step])

  const sections = [
    { title: 'Overview', text: `${pupil || 'Pupil'} is currently on the SEND register at SEN Support level. Their primary need is categorised as Communication and Interaction. They receive targeted support through small group interventions and 1:1 sessions with the SENCO three times per week.` },
    { title: 'Progress Against Outcomes', text: 'Outcome 1: Improve reading comprehension to age-related expectations - On track. Pupil has moved from P-Scale 8 to working within Year 4 expectations. Outcome 2: Develop social communication skills - Partially met. Pupil now initiates conversation with familiar adults but continues to find group settings challenging.' },
    { title: 'Current Provision', text: 'Speech and language therapy (weekly, 30 mins). Social skills group (twice weekly). Modified curriculum with visual scaffolding. Sensory breaks scheduled throughout the day. Teaching assistant support during literacy and numeracy.' },
    { title: 'Recommendations', text: 'Continue current provision map with minor adjustments. Increase social skills group to three sessions per week. Request updated assessment from Educational Psychologist. Consider application for EHCP if progress plateaus in the next review period.' },
  ]

  return (
    <WizardShell onClose={onClose} title="Generate SEND Report" subtitle="AI-assisted report generation" icon="📋" step={step} totalSteps={3} stepLabels={['Select', 'Generate', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupil} onChange={e => setPupil(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div>
            <Label req>Report Type</Label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option>Annual Review</option><option>Progress Update</option><option>Transition Report</option><option>Provision Map</option><option>SEND Register Export</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label req>Start Date</Label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
            <div><Label req>End Date</Label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin" style={{ color: '#0D9488' }} />
              <p className="text-sm mt-4 font-medium" style={{ color: '#F9FAFB' }}>Generating {reportType} for {pupil || 'pupil'}...</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Analysing progress data, provision records, and outcomes</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Check size={14} style={{ color: '#0D9488' }} />
                <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Report generated successfully</p>
              </div>
              <p className="text-xs mb-4" style={{ color: '#6B7280' }}>{reportType} &middot; {pupil || 'Pupil'} &middot; {startDate} to {endDate}</p>
              {sections.map(s => (
                <div key={s.title} className="rounded-xl p-4 space-y-1" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{s.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{s.text}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>SEND report generated and saved</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{reportType} for {pupil || 'Pupil'}</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Report will be saved to the pupil's SEND file and available for download." />
        </div>
      )}
    </WizardShell>
  )
}

/* ------------------------------------------------------------------ */
/*  3. External Agency Referral Modal                                 */
/* ------------------------------------------------------------------ */

export function ExternalAgencyReferralModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [yearGroup, setYearGroup] = useState('Year 1')
  const [presentingNeeds, setPresentingNeeds] = useState('')

  const [agency, setAgency] = useState('CAMHS')
  const [urgency, setUrgency] = useState('Routine')

  const [triedSoFar, setTriedSoFar] = useState('')
  const [supportInPlace, setSupportInPlace] = useState('')
  const [parentalConsent, setParentalConsent] = useState(false)

  const [ref] = useState(() => genRef('REF'))

  return (
    <WizardShell onClose={onClose} title="External Agency Referral" subtitle="Refer a pupil to an external service" icon="📤" step={step} totalSteps={4} stepLabels={['Pupil', 'Agency', 'Evidence', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div>
            <Label req>Year Group</Label>
            <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option>Reception</option><option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option><option>Year 5</option><option>Year 6</option><option>Year 7</option><option>Year 8</option><option>Year 9</option><option>Year 10</option><option>Year 11</option><option>Year 12</option><option>Year 13</option>
            </select>
          </div>
          <div><Label req>Presenting Needs</Label><textarea value={presentingNeeds} onChange={e => setPresentingNeeds(e.target.value)} placeholder="Describe the pupil's presenting needs..." rows={4} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Agency</Label>
            <select value={agency} onChange={e => setAgency(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option>CAMHS</option><option>Social Services</option><option>Speech &amp; Language</option><option>Occupational Therapy</option><option>MASH</option><option>Educational Psychologist</option><option>School Nurse</option><option>Other</option>
            </select>
          </div>
          <div>
            <Label req>Urgency</Label>
            <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option>Routine</option><option>Urgent</option><option>Emergency</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div><Label req>What Has Been Tried</Label><textarea value={triedSoFar} onChange={e => setTriedSoFar(e.target.value)} placeholder="Describe interventions and strategies already attempted..." rows={4} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
          <div><Label req>School-Based Support Already in Place</Label><textarea value={supportInPlace} onChange={e => setSupportInPlace(e.target.value)} placeholder="Detail the current school-based support provision..." rows={4} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
          <label className="flex items-center gap-3 cursor-pointer mt-2 rounded-lg p-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div
              onClick={() => setParentalConsent(!parentalConsent)}
              className="flex items-center justify-center rounded-full shrink-0 cursor-pointer"
              style={{ width: 36, height: 20, backgroundColor: parentalConsent ? '#0D9488' : '#374151', transition: 'background-color 0.2s', borderRadius: 10 }}
            >
              <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transform: parentalConsent ? 'translateX(8px)' : 'translateX(-8px)', transition: 'transform 0.2s' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>Parental consent obtained</span>
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Referral submitted. Tracking reference: {ref}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{pupilName || 'Pupil'} &rarr; {agency} ({urgency})</p>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Referral will be submitted to the selected agency and tracked in the SEND register." />
        </div>
      )}
    </WizardShell>
  )
}

/* ------------------------------------------------------------------ */
/*  4. Review Meeting Modal                                           */
/* ------------------------------------------------------------------ */

const ATTENDEE_OPTIONS = ['Class Teacher', 'SENCO', 'Parent/Carer', 'Educational Psychologist', 'Social Worker', 'Speech Therapist', 'Other'] as const

export function ReviewMeetingModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [meetingType, setMeetingType] = useState('EHCP Annual Review')
  const [attendees, setAttendees] = useState<string[]>([])

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [locationVal, setLocationVal] = useState('SENCO Room')

  const toggleAttendee = (a: string) => {
    setAttendees(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  return (
    <WizardShell onClose={onClose} title="Review Meeting" subtitle="Schedule and invite attendees" icon="📅" step={step} totalSteps={3} stepLabels={['Details', 'Schedule', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div>
            <Label req>Meeting Type</Label>
            <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option>EHCP Annual Review</option><option>SEND Review</option><option>TAC Meeting</option><option>PEP Review</option><option>Transition Planning</option>
            </select>
          </div>
          <div>
            <Label req>Attendees</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ATTENDEE_OPTIONS.map(a => {
                const selected = attendees.includes(a)
                return (
                  <button
                    key={a}
                    onClick={() => toggleAttendee(a)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: selected ? 'rgba(13,148,136,0.2)' : '#1F2937',
                      color: selected ? '#0D9488' : '#9CA3AF',
                      border: `1px solid ${selected ? '#0D9488' : '#374151'}`,
                    }}
                  >
                    {selected && <span className="mr-1">&#10003;</span>}{a}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label req>Time</Label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div>
            <Label req>Location</Label>
            <select value={locationVal} onChange={e => setLocationVal(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option>SENCO Room</option><option>Meeting Room 1</option><option>Meeting Room 2</option><option>Head&apos;s Office</option><option>Virtual</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>Review meeting scheduled &mdash; all attendees notified</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs" style={{ color: '#6B7280' }}>{meetingType} for {pupilName || 'Pupil'}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{date} at {time} &middot; {locationVal}</p>
              {attendees.length > 0 && <p className="text-xs" style={{ color: '#6B7280' }}>Attendees: {attendees.join(', ')}</p>}
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Calendar invites will be sent to all attendees and the meeting will appear in the SEND calendar." />
        </div>
      )}
    </WizardShell>
  )
}

/* ------------------------------------------------------------------ */
/*  5. LAC / CiC Update Modal                                        */
/* ------------------------------------------------------------------ */

export function LACUpdateModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [pupilName, setPupilName] = useState('')
  const [localAuthority, setLocalAuthority] = useState('')
  const [socialWorker, setSocialWorker] = useState('')
  const [virtualSchoolHead, setVirtualSchoolHead] = useState('')

  const [pepDate, setPepDate] = useState('')
  const [progress, setProgress] = useState('Expected')
  const [attendance, setAttendance] = useState('')
  const [ppSpend, setPpSpend] = useState('')

  return (
    <WizardShell onClose={onClose} title="LAC / CiC Update" subtitle="Update looked-after child records" icon="👤" step={step} totalSteps={3} stepLabels={['Pupil', 'Update', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div><Label req>Pupil Name</Label><input value={pupilName} onChange={e => setPupilName(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label req>Local Authority</Label><input value={localAuthority} onChange={e => setLocalAuthority(e.target.value)} placeholder="e.g. Birmingham City Council" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label req>Social Worker Name</Label><input value={socialWorker} onChange={e => setSocialWorker(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label req>Virtual School Head</Label><input value={virtualSchoolHead} onChange={e => setVirtualSchoolHead(e.target.value)} placeholder="Full name" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div><Label req>PEP Review Date</Label><input type="date" value={pepDate} onChange={e => setPepDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div>
            <Label req>Educational Progress</Label>
            <select value={progress} onChange={e => setProgress(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>
              <option>Above Expected</option><option>Expected</option><option>Below Expected</option>
            </select>
          </div>
          <div><Label req>Attendance Percentage</Label><input type="number" min="0" max="100" value={attendance} onChange={e => setAttendance(e.target.value)} placeholder="e.g. 94.5" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
          <div><Label>Pupil Premium Spend</Label><textarea value={ppSpend} onChange={e => setPpSpend(e.target.value)} placeholder="Detail how pupil premium plus funding has been allocated..." rows={4} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>LAC record updated. Copy sent to virtual school head.</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs" style={{ color: '#6B7280' }}>{pupilName || 'Pupil'} &middot; {localAuthority || 'LA'}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Progress: {progress} &middot; Attendance: {attendance || '—'}%</p>
            </div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="The update will be recorded and a copy sent to the virtual school head." />
        </div>
      )}
    </WizardShell>
  )
}
