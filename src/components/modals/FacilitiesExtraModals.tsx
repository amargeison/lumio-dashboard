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

/* ═══════════════════════════════════════════════════════════════
   1. H&S Incident Modal
   ═══════════════════════════════════════════════════════════════ */

export function HSIncidentModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [incidentType, setIncidentType] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [personsInvolved, setPersonsInvolved] = useState('')
  const [injuries, setInjuries] = useState('')
  const [firstAid, setFirstAid] = useState(false)
  const [ambulanceCalled, setAmbulanceCalled] = useState(false)
  const [immediateActions, setImmediateActions] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [riddor, setRiddor] = useState(false)
  const ref = genRef('HS')

  return (
    <WizardShell onClose={onClose} title="Log H&S Incident" subtitle="Health & Safety incident report" icon="🛡️" step={step} totalSteps={4} stepLabels={['Details', 'Persons', 'Actions', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Incident Type</Label>
            <select value={incidentType} onChange={e => setIncidentType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select type...</option>
              {['Slip/trip/fall', 'Cut/laceration', 'Burns', 'Chemical exposure', 'Near miss', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label req>Date</Label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
            <div>
              <Label req>Time</Label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
          </div>
          <div>
            <Label req>Location</Label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Main Hall, Science Lab 2" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Who was involved?</Label>
            <textarea value={personsInvolved} onChange={e => setPersonsInvolved(e.target.value)} rows={3} placeholder="Names and roles of all persons involved" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div>
            <Label>Any injuries?</Label>
            <textarea value={injuries} onChange={e => setInjuries(e.target.value)} rows={3} placeholder="Describe any injuries sustained" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#D1D5DB' }}>First aid given?</span>
            <button onClick={() => setFirstAid(!firstAid)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: firstAid ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: firstAid ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#D1D5DB' }}>Ambulance called?</span>
            <button onClick={() => setAmbulanceCalled(!ambulanceCalled)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: ambulanceCalled ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: ambulanceCalled ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label req>Immediate actions taken</Label>
            <textarea value={immediateActions} onChange={e => setImmediateActions(e.target.value)} rows={3} placeholder="What actions were taken at the time?" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div>
            <Label>Follow-up required</Label>
            <textarea value={followUp} onChange={e => setFollowUp(e.target.value)} rows={3} placeholder="Any follow-up actions or investigations needed" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#D1D5DB' }}>RIDDOR reportable?</span>
            <button onClick={() => setRiddor(!riddor)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: riddor ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: riddor ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
          {riddor && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>RIDDOR Notice</p>
              <p className="text-xs mt-1" style={{ color: '#F87171' }}>This incident must be reported to HSE within 15 days.</p>
            </div>
          )}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-3">🛡️</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>H&S incident logged</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Ref: {ref}</p>
            {riddor && <p className="text-xs mt-1 font-semibold" style={{ color: '#F87171' }}>RIDDOR check prompted &mdash; injury flagged.</p>}
          </div>
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Type</span><span style={{ color: '#D1D5DB' }}>{incidentType || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Date/Time</span><span style={{ color: '#D1D5DB' }}>{date} {time}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Location</span><span style={{ color: '#D1D5DB' }}>{location || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>First Aid</span><span style={{ color: '#D1D5DB' }}>{firstAid ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Ambulance</span><span style={{ color: '#D1D5DB' }}>{ambulanceCalled ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>RIDDOR</span><span style={{ color: riddor ? '#F87171' : '#D1D5DB' }}>{riddor ? 'Yes' : 'No'}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Incident report will be filed and relevant staff notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════════════
   2. Visitor Sign-In Modal
   ═══════════════════════════════════════════════════════════════ */

export function VisitorSignInModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [visitingStaff, setVisitingStaff] = useState('')
  const [dbsChecked, setDbsChecked] = useState(false)
  const [photoIdVerified, setPhotoIdVerified] = useState(false)
  const [safeguardingBriefing, setSafeguardingBriefing] = useState(false)
  const [badgeNumber, setBadgeNumber] = useState('')
  const badge = `V-${String(Math.floor(Math.random() * 900) + 100)}`
  const expectedSignOut = new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <WizardShell onClose={onClose} title="Visitor Sign-In" subtitle="Log a visitor on-site" icon="🪪" step={step} totalSteps={3} stepLabels={['Visitor', 'Safeguarding', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Full Name</Label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Visitor's full name" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label>Organisation</Label>
            <input type="text" value={organisation} onChange={e => setOrganisation(e.target.value)} placeholder="Company or organisation" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Purpose of Visit</Label>
            <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select purpose...</option>
              {['Meeting', 'Delivery', 'Contractor', 'Parent', 'Governor', 'Inspector', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <Label req>Visiting Staff Member</Label>
            <input type="text" value={visitingStaff} onChange={e => setVisitingStaff(e.target.value)} placeholder="Who are they visiting?" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#D1D5DB' }}>DBS checked?</span>
            <button onClick={() => setDbsChecked(!dbsChecked)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: dbsChecked ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: dbsChecked ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#D1D5DB' }}>Photo ID verified?</span>
            <button onClick={() => setPhotoIdVerified(!photoIdVerified)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: photoIdVerified ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: photoIdVerified ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#D1D5DB' }}>Safeguarding briefing given?</span>
            <button onClick={() => setSafeguardingBriefing(!safeguardingBriefing)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: safeguardingBriefing ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: safeguardingBriefing ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
          <div>
            <Label>Badge Number</Label>
            <input type="text" value={badgeNumber} onChange={e => setBadgeNumber(e.target.value)} placeholder="Assign badge number" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-3">🪪</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Visitor signed in</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Badge: {badge}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Expected sign-out: {expectedSignOut}</p>
          </div>
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Name</span><span style={{ color: '#D1D5DB' }}>{fullName || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Organisation</span><span style={{ color: '#D1D5DB' }}>{organisation || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Purpose</span><span style={{ color: '#D1D5DB' }}>{purpose || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Visiting</span><span style={{ color: '#D1D5DB' }}>{visitingStaff || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>DBS</span><span style={{ color: '#D1D5DB' }}>{dbsChecked ? 'Checked' : 'Not checked'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Photo ID</span><span style={{ color: '#D1D5DB' }}>{photoIdVerified ? 'Verified' : 'Not verified'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Safeguarding</span><span style={{ color: '#D1D5DB' }}>{safeguardingBriefing ? 'Briefed' : 'Not briefed'}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Visitor will appear in the live sign-in register." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════════════
   3. Contractor Request Modal
   ═══════════════════════════════════════════════════════════════ */

export function ContractorRequestModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [workType, setWorkType] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('')
  const [slot1Date, setSlot1Date] = useState('')
  const [slot1Time, setSlot1Time] = useState('')
  const [slot2Date, setSlot2Date] = useState('')
  const [slot2Time, setSlot2Time] = useState('')
  const [slot3Date, setSlot3Date] = useState('')
  const [slot3Time, setSlot3Time] = useState('')
  const ref = genRef('CON')

  return (
    <WizardShell onClose={onClose} title="Contractor Request" subtitle="Request an external contractor" icon="🔧" step={step} totalSteps={3} stepLabels={['Details', 'Preferred Dates', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Work Type</Label>
            <select value={workType} onChange={e => setWorkType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select type...</option>
              {['Plumbing', 'Electrical', 'Building', 'Roofing', 'Grounds', 'IT Infrastructure', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Location</Label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Where is the work needed?" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Description</Label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the work required in detail" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div>
            <Label req>Urgency</Label>
            <div className="grid grid-cols-4 gap-2">
              {['Low', 'Medium', 'High', 'Emergency'].map(u => (
                <button key={u} onClick={() => setUrgency(u)} className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors" style={{
                  backgroundColor: urgency === u ? (u === 'Emergency' ? 'rgba(239,68,68,0.15)' : u === 'High' ? 'rgba(245,158,11,0.15)' : 'rgba(13,148,136,0.15)') : '#1F2937',
                  color: urgency === u ? (u === 'Emergency' ? '#EF4444' : u === 'High' ? '#F59E0B' : '#0D9488') : '#6B7280',
                  border: `1px solid ${urgency === u ? (u === 'Emergency' ? 'rgba(239,68,68,0.3)' : u === 'High' ? 'rgba(245,158,11,0.3)' : 'rgba(13,148,136,0.3)') : '#374151'}`
                }}>{u}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs" style={{ color: '#6B7280' }}>Provide up to 3 preferred date/time windows for the contractor visit.</p>
          {[
            { label: 'Slot 1', d: slot1Date, sd: setSlot1Date, t: slot1Time, st: setSlot1Time },
            { label: 'Slot 2', d: slot2Date, sd: setSlot2Date, t: slot2Time, st: setSlot2Time },
            { label: 'Slot 3', d: slot3Date, sd: setSlot3Date, t: slot3Time, st: setSlot3Time },
          ].map(slot => (
            <div key={slot.label} className="rounded-lg p-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>{slot.label}</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={slot.d} onChange={e => slot.sd(e.target.value)} className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#111318', border: '1px solid #374151', color: '#F9FAFB' }} />
                <input type="time" value={slot.t} onChange={e => slot.st(e.target.value)} className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#111318', border: '1px solid #374151', color: '#F9FAFB' }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-3">🔧</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Contractor request submitted to facilities manager</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Ref: {ref}</p>
          </div>
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Work Type</span><span style={{ color: '#D1D5DB' }}>{workType || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Location</span><span style={{ color: '#D1D5DB' }}>{location || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Urgency</span><span style={{ color: urgency === 'Emergency' ? '#EF4444' : urgency === 'High' ? '#F59E0B' : '#D1D5DB' }}>{urgency || '—'}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Request will be sent to the facilities manager for approval and contractor booking." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════════════
   4. Asset Check Modal
   ═══════════════════════════════════════════════════════════════ */

export function AssetCheckModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [assetType, setAssetType] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [location, setLocation] = useState('')
  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <WizardShell onClose={onClose} title="Asset Check" subtitle="Log an asset condition check" icon="📦" step={step} totalSteps={3} stepLabels={['Asset', 'Status', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Asset Type</Label>
            <select value={assetType} onChange={e => setAssetType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select type...</option>
              {['IT Equipment', 'Furniture', 'Sports Equipment', 'Science Equipment', 'AV Equipment', 'Vehicle', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Serial Number / Asset Tag</Label>
            <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="e.g. IT-2024-0412" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Location</Label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Where is the asset located?" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Condition</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {['Good', 'Fair', 'Damaged', 'Missing', 'Decommissioned'].map(c => (
                <button key={c} onClick={() => setCondition(c)} className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors" style={{
                  backgroundColor: condition === c ? (c === 'Damaged' || c === 'Missing' ? 'rgba(239,68,68,0.15)' : c === 'Fair' ? 'rgba(245,158,11,0.15)' : c === 'Decommissioned' ? 'rgba(107,114,128,0.15)' : 'rgba(13,148,136,0.15)') : '#1F2937',
                  color: condition === c ? (c === 'Damaged' || c === 'Missing' ? '#EF4444' : c === 'Fair' ? '#F59E0B' : c === 'Decommissioned' ? '#9CA3AF' : '#0D9488') : '#6B7280',
                  border: `1px solid ${condition === c ? (c === 'Damaged' || c === 'Missing' ? 'rgba(239,68,68,0.3)' : c === 'Fair' ? 'rgba(245,158,11,0.3)' : c === 'Decommissioned' ? 'rgba(107,114,128,0.3)' : 'rgba(13,148,136,0.3)') : '#374151'}`
                }}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Any additional notes about the asset condition" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div>
            <Label>Photo</Label>
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed py-8" style={{ borderColor: '#374151', backgroundColor: '#1F2937' }}>
              <div className="text-center">
                <p className="text-sm" style={{ color: '#6B7280' }}>Drag & drop or click to upload</p>
                <p className="text-xs mt-1" style={{ color: '#4B5563' }}>PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-3">📦</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Asset check logged</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Record updated.</p>
          </div>
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Type</span><span style={{ color: '#D1D5DB' }}>{assetType || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Serial / Tag</span><span style={{ color: '#D1D5DB' }}>{serialNumber || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Location</span><span style={{ color: '#D1D5DB' }}>{location || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Condition</span><span style={{ color: condition === 'Good' ? '#0D9488' : condition === 'Fair' ? '#F59E0B' : condition === 'Damaged' || condition === 'Missing' ? '#EF4444' : '#9CA3AF' }}>{condition || '—'}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Asset register will be updated with this check." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════════════
   5. Compliance Report Modal
   ═══════════════════════════════════════════════════════════════ */

const complianceChecklists: Record<string, string[]> = {
  'Fire Safety': ['Fire extinguishers inspected', 'Emergency lighting tested', 'Fire doors operational', 'Evacuation routes clear', 'Fire alarm panel tested', 'Fire risk assessment current', 'Staff training up to date'],
  'Legionella': ['Water temperature checks', 'Dead-leg flushing completed', 'TMV servicing current', 'Risk assessment reviewed', 'Shower head descaling', 'Storage tank inspection', 'Water sampling results clear', 'Logbook up to date'],
  'Asbestos': ['Management plan reviewed', 'Condition survey completed', 'Labelling in place', 'Staff awareness training', 'Re-inspection schedule current', 'Removal works certified', 'Air monitoring results clear'],
  'PAT Testing': ['Portable appliances tested', 'Test certificates current', 'Failed items removed', 'Asset register updated', 'Testing schedule maintained', 'Visual inspections completed', 'Labels attached to all items'],
  'Gas Safety': ['Gas safety certificate current', 'Boiler serviced', 'Carbon monoxide detectors tested', 'Gas meter area clear', 'Emergency shut-off accessible', 'Pipework inspection complete', 'Ventilation adequate'],
  'Electrical': ['EICR certificate current', 'RCD testing completed', 'Distribution boards inspected', 'Emergency lighting circuits tested', 'Earthing and bonding verified', 'Socket outlets inspected', 'External lighting checked', 'Lightning protection tested'],
  'Food Hygiene': ['Kitchen deep clean completed', 'Food temperature logs current', 'Staff hygiene training valid', 'Pest control inspection done', 'Allergen information displayed', 'Equipment calibration checked', 'HACCP plan reviewed', 'Fridge/freezer temps logged'],
}

export function ComplianceReportModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [reportType, setReportType] = useState('')
  const [period, setPeriod] = useState('This Term')
  const [results, setResults] = useState<Record<string, 'Pass' | 'Fail' | 'N/A'>>({})
  const ref = genRef('CR')

  const items = reportType ? (complianceChecklists[reportType] || []) : []
  const passed = Object.values(results).filter(v => v === 'Pass').length
  const failed = Object.values(results).filter(v => v === 'Fail').length
  const na = Object.values(results).filter(v => v === 'N/A').length

  return (
    <WizardShell onClose={onClose} title="Compliance Report" subtitle="Generate a compliance checklist report" icon="📋" step={step} totalSteps={3} stepLabels={['Configure', 'Checklist', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Report Type</Label>
            <select value={reportType} onChange={e => { setReportType(e.target.value); setResults({}) }} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select type...</option>
              {['Fire Safety', 'Legionella', 'Asbestos', 'PAT Testing', 'Gas Safety', 'Electrical', 'Food Hygiene'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Period</Label>
            <div className="grid grid-cols-3 gap-2">
              {['This Term', 'This Year', 'Custom'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors" style={{
                  backgroundColor: period === p ? 'rgba(13,148,136,0.15)' : '#1F2937',
                  color: period === p ? '#0D9488' : '#6B7280',
                  border: `1px solid ${period === p ? 'rgba(13,148,136,0.3)' : '#374151'}`
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-xs" style={{ color: '#6B7280' }}>Select a report type in the previous step to generate a checklist.</p>
          ) : (
            <>
              {items.map(item => (
                <div key={item} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <span className="text-xs" style={{ color: '#D1D5DB' }}>{item}</span>
                  <div className="flex gap-1">
                    {(['Pass', 'Fail', 'N/A'] as const).map(status => (
                      <button key={status} onClick={() => setResults(prev => ({ ...prev, [item]: status }))} className="px-2.5 py-1 rounded text-xs font-semibold transition-colors" style={{
                        backgroundColor: results[item] === status ? (status === 'Pass' ? 'rgba(13,148,136,0.2)' : status === 'Fail' ? 'rgba(239,68,68,0.2)' : 'rgba(107,114,128,0.2)') : 'transparent',
                        color: results[item] === status ? (status === 'Pass' ? '#0D9488' : status === 'Fail' ? '#EF4444' : '#9CA3AF') : '#4B5563',
                        border: `1px solid ${results[item] === status ? (status === 'Pass' ? 'rgba(13,148,136,0.3)' : status === 'Fail' ? 'rgba(239,68,68,0.3)' : 'rgba(107,114,128,0.3)') : 'transparent'}`
                      }}>{status}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-lg p-3 mt-2 flex items-center gap-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>{passed} passed</span>
                <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>{failed} failed</span>
                <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{na} N/A</span>
              </div>
            </>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-3">📋</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Compliance report generated</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Ref: {ref}</p>
          </div>
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Type</span><span style={{ color: '#D1D5DB' }}>{reportType || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Period</span><span style={{ color: '#D1D5DB' }}>{period}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Results</span><span style={{ color: '#D1D5DB' }}>{passed}P / {failed}F / {na}N/A</span></div>
          </div>
          {failed > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>Action Required</p>
              <p className="text-xs mt-1" style={{ color: '#F87171' }}>{failed} item{failed > 1 ? 's' : ''} failed. Remediation tasks will be generated.</p>
            </div>
          )}
          <DemoConfirm isDemoMode={isDemoMode} text="Report will be saved and any failed items flagged for follow-up." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════════════
   6. Key Request Modal
   ═══════════════════════════════════════════════════════════════ */

export function KeyRequestModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [requestorName, setRequestorName] = useState('')
  const [keyType, setKeyType] = useState('')
  const [reason, setReason] = useState('')
  const [authorisedBy, setAuthorisedBy] = useState('')
  const [temporary, setTemporary] = useState(false)
  const [returnDate, setReturnDate] = useState('')
  const ref = genRef('KEY')

  return (
    <WizardShell onClose={onClose} title="Key Request" subtitle="Request a key issue or transfer" icon="🔑" step={step} totalSteps={3} stepLabels={['Details', 'Approval', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Requestor Name</Label>
            <input type="text" value={requestorName} onChange={e => setRequestorName(e.target.value)} placeholder="Who is requesting the key?" className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Key Type</Label>
            <select value={keyType} onChange={e => setKeyType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select key type...</option>
              {['Classroom', 'Office', 'Store Room', 'External Gate', 'Plant Room', 'Master'].map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <Label req>Reason</Label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Why is the key needed?" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Authorised By</Label>
            <select value={authorisedBy} onChange={e => setAuthorisedBy(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select authoriser...</option>
              {['Sarah Mitchell', 'Mark Davis', 'Tom Bradley'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#D1D5DB' }}>Temporary issue?</span>
            <button onClick={() => setTemporary(!temporary)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: temporary ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: temporary ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
          {temporary && (
            <div>
              <Label req>Return Date</Label>
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-3">🔑</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Key issued</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Log reference: {ref}</p>
          </div>
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Requestor</span><span style={{ color: '#D1D5DB' }}>{requestorName || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Key Type</span><span style={{ color: '#D1D5DB' }}>{keyType || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Authorised By</span><span style={{ color: '#D1D5DB' }}>{authorisedBy || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Type</span><span style={{ color: '#D1D5DB' }}>{temporary ? `Temporary (return: ${returnDate || 'TBD'})` : 'Permanent'}</span></div>
          </div>
          <DemoConfirm isDemoMode={isDemoMode} text="Key log will be updated and the authoriser notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ═══════════════════════════════════════════════════════════════
   7. Fire Drill Log Modal
   ═══════════════════════════════════════════════════════════════ */

export function FireDrillLogModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [drillType, setDrillType] = useState('')
  const [weather, setWeather] = useState('')
  const [evacMinutes, setEvacMinutes] = useState('')
  const [evacSeconds, setEvacSeconds] = useState('')
  const [issues, setIssues] = useState('')
  const [allAccounted, setAllAccounted] = useState(true)
  const [missingDetails, setMissingDetails] = useState('')
  const [assemblyPoints, setAssemblyPoints] = useState<string[]>([])
  const ref = genRef('FD')

  const toggleAssembly = (point: string) => {
    setAssemblyPoints(prev => prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point])
  }

  return (
    <WizardShell onClose={onClose} title="Fire Drill Log" subtitle="Record a fire drill or evacuation" icon="🔥" step={step} totalSteps={3} stepLabels={['Details', 'Results', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label req>Date</Label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
            <div>
              <Label req>Time</Label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
            </div>
          </div>
          <div>
            <Label req>Drill Type</Label>
            <select value={drillType} onChange={e => setDrillType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select type...</option>
              {['Full evacuation', 'Partial', 'Lockdown'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label>Weather Conditions</Label>
            <div className="grid grid-cols-4 gap-2">
              {['Clear', 'Rain', 'Wind', 'Snow'].map(w => (
                <button key={w} onClick={() => setWeather(w)} className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors" style={{
                  backgroundColor: weather === w ? 'rgba(13,148,136,0.15)' : '#1F2937',
                  color: weather === w ? '#0D9488' : '#6B7280',
                  border: `1px solid ${weather === w ? 'rgba(13,148,136,0.3)' : '#374151'}`
                }}>{w}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Evacuation Time</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="number" value={evacMinutes} onChange={e => setEvacMinutes(e.target.value)} placeholder="Minutes" min={0} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
              </div>
              <div>
                <input type="number" value={evacSeconds} onChange={e => setEvacSeconds(e.target.value)} placeholder="Seconds" min={0} max={59} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: '#4B5563' }}>Minutes : Seconds</p>
          </div>
          <div>
            <Label>Any Issues?</Label>
            <textarea value={issues} onChange={e => setIssues(e.target.value)} rows={3} placeholder="Blocked exits, slow response, etc." className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <span className="text-sm" style={{ color: '#D1D5DB' }}>All persons accounted for?</span>
            <button onClick={() => setAllAccounted(!allAccounted)} className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: allAccounted ? '#0D9488' : '#374151' }}>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: allAccounted ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
          {!allAccounted && (
            <div>
              <Label req>Missing Persons Details</Label>
              <textarea value={missingDetails} onChange={e => setMissingDetails(e.target.value)} rows={2} placeholder="Who was unaccounted for and why?" className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} />
            </div>
          )}
          <div>
            <Label>Assembly Points Used</Label>
            <div className="space-y-2">
              {['Front Playground', 'Rear Field', 'Car Park'].map(point => (
                <button key={point} onClick={() => toggleAssembly(point)} className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-left" style={{ backgroundColor: '#1F2937', border: `1px solid ${assemblyPoints.includes(point) ? 'rgba(13,148,136,0.4)' : '#374151'}` }}>
                  <div className="flex items-center justify-center rounded w-4 h-4" style={{ backgroundColor: assemblyPoints.includes(point) ? '#0D9488' : '#374151' }}>
                    {assemblyPoints.includes(point) && <Check size={10} style={{ color: '#fff' }} />}
                  </div>
                  <span className="text-xs" style={{ color: assemblyPoints.includes(point) ? '#F9FAFB' : '#6B7280' }}>{point}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="text-3xl mb-3">🔥</div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Fire drill logged</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Ref: {ref}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Next drill reminder set for 6 months.</p>
          </div>
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#1F2937' }}>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Date/Time</span><span style={{ color: '#D1D5DB' }}>{date} {time}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Type</span><span style={{ color: '#D1D5DB' }}>{drillType || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Weather</span><span style={{ color: '#D1D5DB' }}>{weather || '—'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Evacuation Time</span><span style={{ color: '#D1D5DB' }}>{evacMinutes || '0'}m {evacSeconds || '0'}s</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>All Accounted</span><span style={{ color: allAccounted ? '#0D9488' : '#EF4444' }}>{allAccounted ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Assembly Points</span><span style={{ color: '#D1D5DB' }}>{assemblyPoints.length > 0 ? assemblyPoints.join(', ') : '—'}</span></div>
          </div>
          {!allAccounted && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>Persons Unaccounted</p>
              <p className="text-xs mt-1" style={{ color: '#F87171' }}>Review required. Not all persons were accounted for during drill.</p>
            </div>
          )}
          <DemoConfirm isDemoMode={isDemoMode} text="Drill record saved. Reminder for next drill will be scheduled." />
        </div>
      )}
    </WizardShell>
  )
}
