'use client'
import { useState } from 'react'
import { X, ChevronRight, Check, AlertTriangle, Shield, Phone, Mail, Globe, Radio, Send, FileText, Download, Save } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type LockdownStep = 1 | 2 | 3 | 4
type StandDownStep = 1 | 2 | 3

interface LockdownData {
  type: 'genuine' | 'drill'
  incidentType: string
  description: string
  location: string
  initiatedBy: string
  initiatedAt: string
  timeline: Array<{ time: string; event: string }>
}

// ─── Shell (matches SchoolOfficeModals exactly) ──────────────────────────────

function Shell({ onClose, title, subtitle, icon, iconColor, step, totalSteps, children, footer }: {
  onClose: () => void; title: string; subtitle: string; icon: React.ReactNode; iconColor: string
  step: number; totalSteps: number; children: React.ReactNode; footer?: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl flex flex-col max-h-[92vh] rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${iconColor}26` }}>{icon}</div>
            <div><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p><p className="text-xs" style={{ color: '#6B7280' }}>{subtitle}</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => {
            const active = step === s; const done = step > s
            return (<div key={s} className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, backgroundColor: done ? '#0D9488' : active ? `${iconColor}33` : '#1F2937', color: done ? '#fff' : active ? iconColor : '#6B7280' }}>{done ? <Check size={12} /> : s}</div>
              {s < totalSteps && <ChevronRight size={12} style={{ color: '#374151' }} />}
            </div>)
          })}
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        {footer}
      </div>
    </div>
  )
}

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{children}{req && <span style={{ color: '#EF4444' }}> *</span>}</label>
}

const iS: React.CSSProperties = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }

// ─── Main Lockdown Modal ────────────────────────────────────────────────────

export function SchoolLockdownModal({ onClose, schoolName, isDemoMode = true }: { onClose: () => void; schoolName?: string; isDemoMode?: boolean }) {
  const school = schoolName || localStorage.getItem('lumio_school_name') || 'School'
  const userName = localStorage.getItem('lumio_user_name') || 'Staff Member'

  const [phase, setPhase] = useState<'initiate' | 'standdown' | 'report'>('initiate')
  const [step, setStep] = useState(1)

  // Initiate state
  const [lockdownType, setLockdownType] = useState<'genuine' | 'drill'>('drill')
  const [incidentType, setIncidentType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [lockdownActive, setLockdownActive] = useState(false)
  const [initiatedAt, setInitiatedAt] = useState('')

  // Stand down state
  const [outcome, setOutcome] = useState('')
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [standDownAt, setStandDownAt] = useState('')
  const [commsChecks, setCommsChecks] = useState({
    smsParents: true, emailParents: true, staffBroadcast: true,
    websiteRemove: true, localAuthority: true, emergencyServices: true,
  })

  // Demo toast
  const [toast, setToast] = useState<string | null>(null)
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const ref = `LOCK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}`

  // Build timeline
  const timeline = [
    { time: initiatedAt || now(), event: 'Lockdown initiated' },
    { time: initiatedAt ? addMins(initiatedAt, 1) : now(), event: 'Staff alerted via broadcast' },
    { time: initiatedAt ? addMins(initiatedAt, 2) : now(), event: 'Parent SMS sent (1,147 contacts)' },
    { time: initiatedAt ? addMins(initiatedAt, 3) : now(), event: 'Parent email sent' },
    { time: initiatedAt ? addMins(initiatedAt, 3) : now(), event: 'Website lockdown notice posted' },
    { time: initiatedAt ? addMins(initiatedAt, 4) : now(), event: 'Local authority notified' },
    ...(standDownAt ? [
      { time: standDownAt, event: 'Stand down issued' },
      { time: addMins(standDownAt, 1), event: 'All clear communications sent' },
    ] : []),
  ]

  function addMins(timeStr: string, mins: number) {
    const [h, m] = timeStr.split(':').map(Number)
    const d = new Date(); d.setHours(h, m + mins)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  function handleInitiate() {
    setInitiatedAt(now())
    setLockdownActive(true)
    if (isDemoMode) showToast('Demo: lockdown would be activated and all contacts notified instantly')
    setStep(4) // jump to confirmation
  }

  function handleStandDown() {
    setStandDownAt(now())
    setPhase('standdown')
    setStep(1)
  }

  function handleConfirmStandDown() {
    setPhase('report')
    if (isDemoMode) showToast('Demo: all clear would be sent to all parents, staff and local authority')
  }

  // ── PHASE: INITIATE ──────────────────────────────────────────────────────

  if (phase === 'initiate') {
    return (
      <Shell onClose={onClose} title="🚨 School Lockdown" subtitle="Emergency lockdown procedure" icon={<Shield size={16} style={{ color: '#EF4444' }} />} iconColor="#EF4444" step={step} totalSteps={4}
        footer={
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>{step === 1 ? 'Cancel' : '← Back'}</button>
            {step < 3 && <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#EF4444', color: '#fff' }}>Next <ChevronRight size={14} /></button>}
            {step === 3 && <button onClick={handleInitiate} disabled={!confirmed} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: confirmed ? '#DC2626' : '#374151', color: '#fff', animation: confirmed ? 'pulse 2s infinite' : 'none' }}>🚨 INITIATE LOCKDOWN</button>}
            {step === 4 && lockdownActive && <button onClick={handleStandDown} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#22C55E', color: '#fff' }}>🟢 Stand Down</button>}
          </div>
        }>

        {/* Step 1: Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-sm font-bold" style={{ color: '#EF4444' }}>⚠️ This will activate a full school lockdown</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>All staff will be alerted. Parents will be notified via SMS and email. The school website will display a lockdown notice.</p>
            </div>
            <div>
              <Label req>Lockdown type</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['genuine', 'drill'] as const).map(t => (
                  <button key={t} onClick={() => setLockdownType(t)} className="rounded-xl p-4 text-left" style={{ backgroundColor: lockdownType === t ? (t === 'genuine' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)') : '#1F2937', border: lockdownType === t ? `1px solid ${t === 'genuine' ? '#EF4444' : '#FBBF24'}` : '1px solid #374151' }}>
                    <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{t === 'genuine' ? '🚨 Genuine Emergency' : '🔔 Planned Drill'}</p>
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{t === 'genuine' ? 'Real threat — full emergency protocol' : 'Scheduled practice — all notifications marked as drill'}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label req>Incident type</Label>
              <select value={incidentType} onChange={e => setIncidentType(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={iS}>
                <option value="">Select type...</option>
                <option>Intruder on site</option><option>Violent incident nearby</option><option>Chemical / hazmat</option>
                <option>Suspicious package</option><option>Police instruction</option><option>Weather emergency</option>
                <option>Gas leak</option><option>Planned drill</option><option>Other</option>
              </select>
            </div>
            <div>
              <Label>Location (if known)</Label>
              <select value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={iS}>
                <option value="">Select area...</option>
                <option>Main building</option><option>Playground</option><option>Sports field</option>
                <option>Car park</option><option>Reception area</option><option>Surrounding streets</option>
                <option>Entire site</option><option>Other</option>
              </select>
            </div>
            <div>
              <Label>Brief description</Label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is happening? Include any details that will help staff respond." className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none" style={iS} />
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)' }}>
              <p className="text-3xl mb-2">🚨</p>
              <p className="text-lg font-bold" style={{ color: '#EF4444' }}>Confirm Lockdown</p>
              <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>
                You are about to initiate a <strong>{lockdownType === 'genuine' ? 'GENUINE EMERGENCY' : 'PLANNED DRILL'}</strong> lockdown at <strong>{school}</strong>.
              </p>
              <div className="mt-4 space-y-1.5 text-left max-w-xs mx-auto">
                {[
                  'All staff will receive an emergency broadcast',
                  `${lockdownType === 'genuine' ? 'All 1,147 parents will receive SMS & email' : 'SMS will be marked as DRILL'}`,
                  'School website will display lockdown notice',
                  'Local authority will be notified',
                  lockdownType === 'genuine' ? 'Emergency services will be contacted' : 'No emergency services will be called',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                    <span style={{ color: '#EF4444' }}>•</span>{item}
                  </div>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: confirmed ? '1px solid #EF4444' : '1px solid #374151' }}>
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="rounded" />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>I confirm I am authorised to initiate this lockdown</span>
            </label>
          </div>
        )}

        {/* Step 4: Active lockdown */}
        {step === 4 && lockdownActive && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)', animation: 'pulse 2s infinite' }}>
              <p className="text-3xl mb-2">🔴</p>
              <p className="text-lg font-bold" style={{ color: '#EF4444' }}>LOCKDOWN ACTIVE</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Initiated at {initiatedAt} by {userName}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{lockdownType === 'genuine' ? 'GENUINE EMERGENCY' : 'PLANNED DRILL'} — {incidentType || 'Unspecified'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>COMMUNICATIONS SENT</p>
              {[
                { icon: '📻', label: 'Staff emergency broadcast', status: 'Sent' },
                { icon: '📱', label: 'Parent SMS — 1,147 contacts', status: 'Sent' },
                { icon: '📧', label: 'Parent email — 1,147 contacts', status: 'Sent' },
                { icon: '🌐', label: 'Website lockdown notice', status: 'Posted' },
                { icon: '🏛️', label: 'Local authority notification', status: 'Sent' },
                ...(lockdownType === 'genuine' ? [{ icon: '🚔', label: 'Emergency services', status: 'Contacted' }] : []),
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#1F2937' }}>
                  <span className="text-xs" style={{ color: '#D1D5DB' }}>{c.icon} {c.label}</span>
                  <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>✓ {c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Shell>
    )
  }

  // ── PHASE: STAND DOWN ─────────────────────────────────────────────────────

  if (phase === 'standdown') {
    return (
      <Shell onClose={onClose} title="🟢 Stand Down — All Clear" subtitle="Issue all clear and generate incident report" icon={<Check size={16} style={{ color: '#22C55E' }} />} iconColor="#22C55E" step={step} totalSteps={3}
        footer={
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : setPhase('initiate')} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>← Back</button>
            {step < 3 && <button onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#22C55E', color: '#fff' }}>Next <ChevronRight size={14} /></button>}
            {step === 3 && <button onClick={handleConfirmStandDown} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#22C55E', color: '#fff' }}>✅ Confirm Stand Down & Generate Report</button>}
          </div>
        }>

        {/* Stand Down Step 1: Outcome */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-sm font-bold" style={{ color: '#22C55E' }}>🟢 You are issuing an All Clear</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>This will notify all staff and parents that the lockdown has ended.</p>
            </div>
            <div>
              <Label req>Outcome</Label>
              <select value={outcome} onChange={e => setOutcome(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={iS}>
                <option value="">Select outcome...</option>
                <option>Drill completed successfully</option>
                <option>Threat resolved — no injuries</option>
                <option>Threat resolved — medical attention required</option>
                <option>False alarm</option>
                <option>Handed to police — awaiting update</option>
              </select>
            </div>
            <div>
              <Label>Brief outcome notes</Label>
              <textarea value={outcomeNotes} onChange={e => setOutcomeNotes(e.target.value)} rows={3} placeholder="Any additional details about the resolution..." className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none" style={iS} />
            </div>
          </div>
        )}

        {/* Stand Down Step 2: All Clear Communications */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>ALL CLEAR COMMUNICATIONS</p>
            <div className="space-y-2">
              {Object.entries(commsChecks).map(([key, checked]) => {
                const labels: Record<string, string> = {
                  smsParents: 'Send all-clear SMS to all parents/carers',
                  emailParents: 'Send all-clear email to all parents/carers',
                  staffBroadcast: 'Broadcast all-clear to all staff',
                  websiteRemove: 'Remove lockdown notice from school website',
                  localAuthority: 'Notify local authority of resolution',
                  emergencyServices: 'Notify emergency services (if applicable)',
                }
                return (
                  <label key={key} className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer" style={{ backgroundColor: '#1F2937', border: checked ? '1px solid rgba(34,197,94,0.3)' : '1px solid #374151' }}>
                    <input type="checkbox" checked={checked} onChange={e => setCommsChecks(prev => ({ ...prev, [key]: e.target.checked }))} className="rounded" />
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>{labels[key]}</span>
                  </label>
                )
              })}
            </div>

            <div className="rounded-xl p-4 mt-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>SMS PREVIEW</p>
              <p className="text-xs" style={{ color: '#D1D5DB', lineHeight: 1.6 }}>
                UPDATE — {school}: The lockdown has ended. Your child is safe. Normal school operations have resumed. Thank you for your patience.
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>EMAIL PREVIEW</p>
              <p className="text-[10px] mb-2" style={{ color: '#6B7280' }}>Subject: UPDATE: All Clear — Lockdown Ended — {school}</p>
              <p className="text-xs" style={{ color: '#D1D5DB', lineHeight: 1.6 }}>
                Dear Parents and Carers,{'\n\n'}
                We are writing to confirm that the lockdown at {school} has now ended and all children are safe.{'\n\n'}
                {outcome || 'The situation has been resolved.'} Normal school operations have resumed and children can be collected at the usual time.{'\n\n'}
                We apologise for any concern caused and thank you for your patience and cooperation during this period. A full incident report will be shared with parents within 24 hours.{'\n\n'}
                If you have any questions, please contact the school office.{'\n\n'}
                Kind regards,{'\n'}
                {school} Leadership Team
              </p>
            </div>
          </div>
        )}

        {/* Stand Down Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.3)' }}>
              <p className="text-3xl mb-2">✅</p>
              <p className="text-lg font-bold" style={{ color: '#22C55E' }}>Ready to Stand Down</p>
              <p className="text-sm mt-2" style={{ color: '#D1D5DB' }}>
                All clear will be sent to <strong>1,147 parents</strong>, <strong>all staff</strong>, and the <strong>local authority</strong>.
              </p>
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                An incident report will be automatically generated.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>SUMMARY</p>
              {[
                ['Type', lockdownType === 'genuine' ? 'Genuine Emergency' : 'Planned Drill'],
                ['Incident', incidentType || '—'],
                ['Location', location || '—'],
                ['Initiated', `${initiatedAt} by ${userName}`],
                ['Outcome', outcome || '—'],
                ['Duration', initiatedAt && standDownAt ? `${initiatedAt} – ${standDownAt}` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#1F2937' }}>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
                  <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Shell>
    )
  }

  // ── PHASE: INCIDENT REPORT ────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl flex flex-col max-h-[92vh] rounded-2xl overflow-hidden" style={{ border: '1px solid #374151' }}>
        {/* Report header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <FileText size={16} style={{ color: '#22C55E' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Incident Report Generated</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>

        {/* Report body — light/formal document style */}
        <div className="overflow-y-auto flex-1 p-6" style={{ backgroundColor: '#FAFAFA' }}>
          <div className="max-w-lg mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
            <div className="text-center mb-6 pb-4" style={{ borderBottom: '2px solid #1F2937' }}>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#6B7280' }}>SCHOOL LOCKDOWN INCIDENT REPORT</p>
              <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Reference: {ref}</p>
            </div>

            <table className="w-full text-xs mb-6" style={{ color: '#374151' }}>
              <tbody>
                {[
                  ['School', school],
                  ['Date', today],
                  ['Initiated by', userName],
                  ['Type', lockdownType === 'genuine' ? 'Genuine Emergency' : 'Planned Drill'],
                  ['Reference', ref],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td className="py-2 font-semibold" style={{ width: '40%', color: '#6B7280' }}>{label}</td>
                    <td className="py-2" style={{ color: '#111827' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#374151' }}>TIMELINE</p>
            <div className="mb-6 space-y-1">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-3 text-xs" style={{ color: '#374151' }}>
                  <span className="font-mono shrink-0" style={{ color: '#6B7280', width: 40 }}>{t.time}</span>
                  <span>{t.event}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#374151' }}>INCIDENT DETAILS</p>
            <table className="w-full text-xs mb-6" style={{ color: '#374151' }}>
              <tbody>
                {[
                  ['Type', incidentType || '—'],
                  ['Description', description || '—'],
                  ['Location', location || '—'],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td className="py-2 font-semibold" style={{ width: '40%', color: '#6B7280' }}>{label}</td>
                    <td className="py-2" style={{ color: '#111827' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#374151' }}>OUTCOME</p>
            <p className="text-xs mb-1" style={{ color: '#111827' }}>{outcome || '—'}</p>
            <p className="text-xs mb-6" style={{ color: '#6B7280' }}>{outcomeNotes || ''}</p>

            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#374151' }}>COMMUNICATIONS SENT</p>
            <div className="mb-6 space-y-1">
              {[
                ['Staff broadcast', commsChecks.staffBroadcast],
                ['Parent SMS — 1,147 sent', commsChecks.smsParents],
                ['Parent email — 1,147 sent', commsChecks.emailParents],
                ['Website notice posted and removed', commsChecks.websiteRemove],
                ['Local authority notified', commsChecks.localAuthority],
              ].map(([label, sent]) => (
                <div key={label as string} className="flex items-center gap-2 text-xs">
                  <span style={{ color: sent ? '#22C55E' : '#9CA3AF' }}>{sent ? '✅' : '⬜'}</span>
                  <span style={{ color: '#374151' }}>{label as string}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#374151' }}>ACTIONS REQUIRED</p>
            <div className="mb-6 space-y-1">
              {[
                'Debrief with SLT within 24 hours',
                'Submit report to local authority within 5 days',
                'Review lockdown procedure effectiveness',
                'Update risk assessment if required',
                'Notify governors if genuine emergency',
                'RIDDOR report if any injuries',
              ].map(action => (
                <div key={action} className="flex items-center gap-2 text-xs">
                  <span style={{ color: '#9CA3AF' }}>☐</span>
                  <span style={{ color: '#374151' }}>{action}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 flex justify-between text-xs" style={{ borderTop: '1px solid #D1D5DB', color: '#6B7280' }}>
              <span>Signed: ___________________</span>
              <span>Date: ___________________</span>
            </div>
          </div>
        </div>

        {/* Report footer with export buttons */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: '#111318', borderTop: '1px solid #1F2937' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Close</button>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast(isDemoMode ? 'On a live plan this would generate a formatted PDF for your records and Ofsted evidence folder' : 'PDF generated')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
              <Download size={12} /> Export PDF
            </button>
            <button onClick={() => showToast(isDemoMode ? 'On a live plan this would email the full report to: Dr Sarah Mitchell, Mr James Okafor, Mr Tom Briggs (DSL)' : 'Report emailed to SLT')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>
              <Mail size={12} /> Email to SLT
            </button>
            <button onClick={() => showToast(isDemoMode ? 'On a live plan this would be saved to your Safeguarding & Incidents folder, timestamped and accessible for Ofsted inspection' : 'Report saved to records')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
              <Save size={12} /> Save to Records
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-xl px-5 py-3 shadow-2xl max-w-lg" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm" style={{ color: '#F9FAFB' }}>{toast}</p>
        </div>
      )}
    </div>
  )
}
