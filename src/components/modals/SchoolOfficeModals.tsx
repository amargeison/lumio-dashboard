'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, Check, Loader2, AlertTriangle, Wrench, Shield, Users, Send, Save } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

function Shell({ onClose, title, subtitle, icon, iconColor, step, setStep, totalSteps, children, footer }: {
  onClose: () => void; title: string; subtitle: string; icon: React.ReactNode; iconColor: string
  step: Step; setStep: (s: Step) => void; totalSteps?: number; children: React.ReactNode; footer?: React.ReactNode
}) {
  const steps = totalSteps || 4
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
          {Array.from({ length: steps }, (_, i) => i + 1).map(s => {
            const active = step === s; const done = step > s
            return (<div key={s} className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, backgroundColor: done ? '#0D9488' : active ? `${iconColor}33` : '#1F2937', color: done ? '#fff' : active ? iconColor : '#6B7280' }}>{done ? <Check size={12} /> : s}</div>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: active ? '#F9FAFB' : '#6B7280' }}>Step {s}</span>
              {s < steps && <ChevronRight size={12} style={{ color: '#374151' }} />}
            </div>)
          })}
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        {footer || (
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
            <button onClick={() => step > 1 ? setStep((step - 1) as Step) : onClose()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>{step === 1 ? 'Cancel' : '← Back'}</button>
            {step < steps && <button onClick={() => setStep((step + 1) as Step)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Next <ChevronRight size={14} /></button>}
          </div>
        )}
      </div>
    </div>
  )
}

function Label({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{children}{req && <span style={{ color: '#EF4444' }}> *</span>}</label>
}
const iS = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }

function OptionCard({ emoji, label, desc, selected, onClick }: { emoji: string; label: string; desc?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-xl p-4 text-left transition-all" style={{ backgroundColor: selected ? 'rgba(13,148,136,0.12)' : '#1F2937', border: selected ? '1px solid #0D9488' : '1px solid #374151' }}>
      <span className="text-xl block mb-1">{emoji}</span>
      <p className="text-xs font-semibold" style={{ color: selected ? '#0D9488' : '#F9FAFB' }}>{label}</p>
      {desc && <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{desc}</p>}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LOG SCHOOL INCIDENT
// ═══════════════════════════════════════════════════════════════════════════════

const INVOLVED = ['🧒 Student', '👨‍🏫 Staff', '👨‍👩‍👧 Parent/Carer', '👤 Visitor', '🚗 Vehicle', '🏫 Property']
const INCIDENT_TYPES = ['Accident / Injury', 'Behavioural Incident', 'Safeguarding Concern', 'Physical Altercation', 'Verbal Abuse', 'Bullying', 'Medical Episode', 'Property Damage', 'Unauthorised Visitor', 'Fire / Evacuation', 'Near Miss', 'Other']
const LOCATIONS = ['Classroom', 'Corridor', 'Playground', 'Sports Field', 'Car Park', 'Canteen', 'Reception', 'Toilets', 'Off Site', 'Other']
const SEVERITIES = [
  { emoji: '🟢', label: 'Minor', desc: 'No injury, low impact', color: '#22C55E' },
  { emoji: '🟡', label: 'Moderate', desc: 'Injury or significant disruption', color: '#F59E0B' },
  { emoji: '🔴', label: 'Serious', desc: 'Emergency services or major safeguarding', color: '#EF4444' },
]

export function LogIncidentModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [involved, setInvolved] = useState<string[]>([])
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0])
  const [severity, setSeverity] = useState('')
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16))
  const [location, setLocation] = useState(LOCATIONS[0])
  const [names, setNames] = useState(''); const [witnesses, setWitnesses] = useState('')
  const [description, setDescription] = useState(''); const [actionTaken, setActionTaken] = useState('')
  const [firstAid, setFirstAid] = useState(false); const [firstAider, setFirstAider] = useState('')
  const [parentsContacted, setParentsContacted] = useState(false)
  const [emergencyServices, setEmergencyServices] = useState(false)
  const [areaSafe, setAreaSafe] = useState(false)
  const [notifyHead, setNotifyHead] = useState(true); const [notifyDSL, setNotifyDSL] = useState(false)
  const [notifySENCO, setNotifySENCO] = useState(false); const [notifySite, setNotifySite] = useState(false)
  const [notifyHR, setNotifyHR] = useState(false); const [notifyGov, setNotifyGov] = useState(false)
  const [notifyLA, setNotifyLA] = useState(false); const [notifyOfsted, setNotifyOfsted] = useState(false)
  const [toast, setToast] = useState('')

  const ref = `INC-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const sevData = SEVERITIES.find(s => s.label === severity)

  useEffect(() => {
    if (severity === 'Serious') { setNotifyDSL(true); setNotifyOfsted(true) }
    if (incidentType === 'Safeguarding Concern') setNotifyDSL(true)
    if (involved.includes('👨‍🏫 Staff')) setNotifyHR(true)
    if (involved.includes('🏫 Property')) setNotifySite(true)
  }, [severity, incidentType, involved])

  const notifyCount = [notifyHead, notifyDSL, notifySENCO, notifySite, notifyHR, notifyGov, notifyLA, notifyOfsted].filter(Boolean).length

  return (
    <Shell onClose={onClose} title="Log School Incident" subtitle="Record any incident on school grounds" icon={<AlertTriangle size={15} style={{ color: '#EF4444' }} />} iconColor="#EF4444" step={step} setStep={setStep}
      footer={step === 4 ? (
        <div className="px-6 py-4 space-y-3 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {severity === 'Serious' && <div className="rounded-lg px-4 py-3 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>For serious incidents, you may be required to report to Ofsted within 5 working days. Lumio will remind you.</div>}
          <div className="flex gap-3">
            <button onClick={() => { setToast('Incident logged & notifications sent'); setTimeout(() => { setToast(''); onClose() }, 2000) }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}><Check size={14} /> Log & Send Notifications</button>
            <button onClick={() => { setToast('Incident logged'); setTimeout(() => { setToast(''); onClose() }, 2000) }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}><Save size={14} /> Log Only</button>
          </div>
        </div>
      ) : undefined}>

      {/* Step 1 — Configure */}
      {step === 1 && <div className="space-y-5">
        <div><Label req>Who was involved?</Label><div className="grid grid-cols-3 gap-2">{INVOLVED.map(i => <OptionCard key={i} emoji={i.split(' ')[0]} label={i.split(' ').slice(1).join(' ')} selected={involved.includes(i)} onClick={() => setInvolved(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} />)}</div></div>
        <div><Label req>Incident Type</Label><select value={incidentType} onChange={e => setIncidentType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><Label req>Severity</Label><div className="grid grid-cols-3 gap-2">{SEVERITIES.map(s => <button key={s.label} onClick={() => setSeverity(s.label)} className="rounded-xl p-4 text-center transition-all" style={{ backgroundColor: severity === s.label ? `${s.color}18` : '#1F2937', border: severity === s.label ? `2px solid ${s.color}` : '1px solid #374151' }}><span className="text-2xl block mb-1">{s.emoji}</span><p className="text-xs font-bold" style={{ color: severity === s.label ? s.color : '#F9FAFB' }}>{s.label}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{s.desc}</p></button>)}</div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Date & Time</Label><input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div><div><Label>Location</Label><select value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select></div></div>
      </div>}

      {/* Step 2 — Details */}
      {step === 2 && <div className="space-y-4">
        <div><Label req>Names of people involved</Label><textarea value={names} onChange={e => setNames(e.target.value)} rows={2} placeholder="One name per line" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
        <div><Label>Witnesses</Label><textarea value={witnesses} onChange={e => setWitnesses(e.target.value)} rows={2} placeholder="Optional — list any witnesses" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
        <div><Label req>What happened?</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the incident in detail (min 50 characters)" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /><p className="text-[10px] text-right mt-1" style={{ color: description.length >= 50 ? '#22C55E' : '#6B7280' }}>{description.length}/50+ characters</p></div>
        <div><Label>Immediate action taken</Label><textarea value={actionTaken} onChange={e => setActionTaken(e.target.value)} rows={2} placeholder="What was done immediately?" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
        <div className="space-y-3">
          {[{ label: 'First aid given?', state: firstAid, set: setFirstAid }, { label: 'Parents/carers contacted?', state: parentsContacted, set: setParentsContacted }, { label: 'Emergency services called?', state: emergencyServices, set: setEmergencyServices }, { label: 'Area made safe?', state: areaSafe, set: setAreaSafe }].map(t => (
            <div key={t.label}>
              <div className="flex items-center justify-between"><Label>{t.label}</Label><button onClick={() => t.set(!t.state)} className="relative w-10 h-5 rounded-full" style={{ backgroundColor: t.state ? '#0D9488' : '#374151' }}><span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: t.state ? 22 : 2 }} /></button></div>
              {t.state && t.label.includes('First aid') && <input value={firstAider} onChange={e => setFirstAider(e.target.value)} placeholder="First aider name" className="w-full mt-2 rounded-lg px-3 py-2 text-sm outline-none" style={iS} />}
            </div>
          ))}
        </div>
      </div>}

      {/* Step 3 — Notifications */}
      {step === 3 && <div className="space-y-4">
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Who needs to know?</p>
        <div className="space-y-2">
          {[{ label: 'Headteacher', state: notifyHead, set: setNotifyHead }, { label: 'DSL (Designated Safeguarding Lead)', state: notifyDSL, set: setNotifyDSL }, { label: 'SENCO', state: notifySENCO, set: setNotifySENCO }, { label: 'Site Manager', state: notifySite, set: setNotifySite }, { label: 'HR', state: notifyHR, set: setNotifyHR }, { label: 'Governors', state: notifyGov, set: setNotifyGov }, { label: 'Local Authority', state: notifyLA, set: setNotifyLA }, { label: 'Ofsted', state: notifyOfsted, set: setNotifyOfsted }].map(n => (
            <div key={n.label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#1F2937' }}>
              <span className="text-xs" style={{ color: '#D1D5DB' }}>{n.label}</span>
              <button onClick={() => n.set(!n.state)} className="relative w-10 h-5 rounded-full" style={{ backgroundColor: n.state ? '#0D9488' : '#374151' }}><span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: n.state ? 22 : 2 }} /></button>
            </div>
          ))}
        </div>
      </div>}

      {/* Step 4 — Summary */}
      {step === 4 && <div className="space-y-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold font-mono" style={{ color: '#0D9488' }}>{ref}</span>
            {sevData && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${sevData.color}18`, color: sevData.color }}>{sevData.emoji} {sevData.label}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span style={{ color: '#6B7280' }}>Date/Time:</span> <span style={{ color: '#D1D5DB' }}>{dateTime.replace('T', ' ')}</span></div>
            <div><span style={{ color: '#6B7280' }}>Location:</span> <span style={{ color: '#D1D5DB' }}>{location}</span></div>
            <div><span style={{ color: '#6B7280' }}>Type:</span> <span style={{ color: '#D1D5DB' }}>{incidentType}</span></div>
            <div><span style={{ color: '#6B7280' }}>Involved:</span> <span style={{ color: '#D1D5DB' }}>{involved.length} {involved.length === 1 ? 'party' : 'parties'}</span></div>
            <div><span style={{ color: '#6B7280' }}>Notifications:</span> <span style={{ color: '#D1D5DB' }}>{notifyCount} recipients</span></div>
            <div><span style={{ color: '#6B7280' }}>First aid:</span> <span style={{ color: '#D1D5DB' }}>{firstAid ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      </div>}

      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{toast}</div>}
    </Shell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LOG MAINTENANCE ISSUE
// ═══════════════════════════════════════════════════════════════════════════════

const BUILDING_LOCATIONS = [
  { emoji: '🏫', label: 'Main Building' }, { emoji: '🏃', label: 'Playground' },
  { emoji: '⚽', label: 'Sports Field' }, { emoji: '🅿️', label: 'Car Park' },
  { emoji: '🚽', label: 'Toilets' }, { emoji: '🍽️', label: 'Canteen' },
  { emoji: '🔬', label: 'Science Block' }, { emoji: '💻', label: 'IT Suite' },
  { emoji: '🎨', label: 'Arts Block' }, { emoji: '🏋️', label: 'Sports Hall' },
  { emoji: '🌳', label: 'Grounds' }, { emoji: '🚪', label: 'Gates & Fencing' },
]

const ISSUE_TYPES = [
  { emoji: '🔧', label: 'Plumbing' }, { emoji: '⚡', label: 'Electrical' },
  { emoji: '🔥', label: 'Heating/HVAC' }, { emoji: '🏗️', label: 'Structural' },
  { emoji: '🎨', label: 'Decoration' }, { emoji: '🔒', label: 'Security' },
  { emoji: '🌿', label: 'Grounds' }, { emoji: '🪑', label: 'Furniture' },
  { emoji: '💻', label: 'IT/AV' }, { emoji: '📦', label: 'Other' },
]

const PRIORITIES_M = [
  { emoji: '🔴', label: 'Safety Risk', desc: 'Immediate action required', color: '#EF4444' },
  { emoji: '🟡', label: 'Urgent', desc: 'Affects teaching within 48h', color: '#F59E0B' },
  { emoji: '🟢', label: 'Routine', desc: 'Normal maintenance cycle', color: '#22C55E' },
]

const CONTRACTORS = [
  { name: 'MK Plumbing & Heating Ltd', rating: 4.8, distance: '2.3 miles', avail: 'Tomorrow AM', cost: '£85-£120/hr', accred: 'Gas Safe' },
  { name: 'Sparks Electrical Services', rating: 4.6, distance: '3.1 miles', avail: 'Today PM', cost: '£75-£95/hr', accred: 'NICEIC' },
  { name: 'ABC Building Solutions', rating: 4.9, distance: '4.7 miles', avail: 'Wednesday', cost: '£65-£110/hr', accred: 'CHAS, SafeContractor' },
]

export function LogMaintenanceModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [buildingLoc, setBuildingLoc] = useState('')
  const [specificLoc, setSpecificLoc] = useState('')
  const [issueType, setIssueType] = useState('')
  const [priority, setPriority] = useState('')
  const [description, setDescription] = useState('')
  const [areaSafe, setAreaSafe] = useState(false)
  const [cordoned, setCordoned] = useState(false)
  const [resolution, setResolution] = useState<'tradesman' | 'maintenance' | 'log'>('maintenance')
  const [selectedContractor, setSelectedContractor] = useState<number | null>(null)
  const [searchingContractors, setSearchingContractors] = useState(false)
  const [contactName, setContactName] = useState(''); const [contactPhone, setContactPhone] = useState('')
  const [accessNotes, setAccessNotes] = useState(''); const [visitTime, setVisitTime] = useState('Morning')
  const [toast, setToast] = useState('')

  const ref = `MNT-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const isSafety = priority === 'Safety Risk'

  useEffect(() => {
    if (step === 3 && resolution === 'tradesman' && !searchingContractors) {
      setSearchingContractors(true)
      setTimeout(() => setSearchingContractors(false), 2000)
    }
  }, [step, resolution])

  return (
    <Shell onClose={onClose} title="Log Maintenance Issue" subtitle="Report a problem on school grounds" icon={<Wrench size={15} style={{ color: '#F59E0B' }} />} iconColor="#F59E0B" step={step} setStep={setStep}
      footer={step === 4 ? (
        <div className="flex gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={() => { setToast('Issue logged'); setTimeout(() => { setToast(''); onClose() }, 2000) }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}><Check size={14} /> {resolution === 'tradesman' ? 'Confirm Booking' : resolution === 'maintenance' ? 'Send to Team' : 'Log Issue'}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Close</button>
        </div>
      ) : undefined}>

      {/* Step 1 — Describe */}
      {step === 1 && <div className="space-y-5">
        <div><Label req>Where is the issue?</Label><div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{BUILDING_LOCATIONS.map(l => <OptionCard key={l.label} emoji={l.emoji} label={l.label} selected={buildingLoc === l.label} onClick={() => setBuildingLoc(l.label)} />)}</div></div>
        <div><Label>Specific location</Label><input value={specificLoc} onChange={e => setSpecificLoc(e.target.value)} placeholder="e.g. Maths Block Room 7" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div>
        <div><Label req>Issue type</Label><div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{ISSUE_TYPES.map(t => <OptionCard key={t.label} emoji={t.emoji} label={t.label} selected={issueType === t.label} onClick={() => setIssueType(t.label)} />)}</div></div>
        <div><Label req>Priority</Label><div className="grid grid-cols-3 gap-2">{PRIORITIES_M.map(p => <button key={p.label} onClick={() => setPriority(p.label)} className="rounded-xl p-3 text-center transition-all" style={{ backgroundColor: priority === p.label ? `${p.color}18` : '#1F2937', border: priority === p.label ? `2px solid ${p.color}` : '1px solid #374151' }}><span className="text-xl block mb-1">{p.emoji}</span><p className="text-xs font-bold" style={{ color: priority === p.label ? p.color : '#F9FAFB' }}>{p.label}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{p.desc}</p></button>)}</div></div>
        <div><Label req>Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the issue..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
        {isSafety && <div className="space-y-2">
          <div className="flex items-center justify-between"><Label>Area made safe?</Label><button onClick={() => setAreaSafe(!areaSafe)} className="relative w-10 h-5 rounded-full" style={{ backgroundColor: areaSafe ? '#0D9488' : '#374151' }}><span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: areaSafe ? 22 : 2 }} /></button></div>
          <div className="flex items-center justify-between"><Label>Area cordoned off?</Label><button onClick={() => setCordoned(!cordoned)} className="relative w-10 h-5 rounded-full" style={{ backgroundColor: cordoned ? '#0D9488' : '#374151' }}><span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: cordoned ? 22 : 2 }} /></button></div>
        </div>}
      </div>}

      {/* Step 2 — Resolution */}
      {step === 2 && <div className="space-y-4">
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>How would you like this resolved?</p>
        {[
          { key: 'tradesman' as const, emoji: '🔧', title: 'Find a Local Tradesman', desc: 'Lumio will find available, accredited tradesmen near your school' },
          { key: 'maintenance' as const, emoji: '📋', title: 'Send to Maintenance Team', desc: 'Send directly to your site manager and maintenance team' },
          { key: 'log' as const, emoji: '📝', title: 'Log Only', desc: "Just record the issue — I'll handle this manually" },
        ].map(o => (
          <button key={o.key} onClick={() => setResolution(o.key)} className="w-full flex items-start gap-4 rounded-xl p-4 text-left transition-all" style={{ backgroundColor: resolution === o.key ? 'rgba(13,148,136,0.08)' : '#1F2937', border: resolution === o.key ? '1px solid #0D9488' : '1px solid #374151' }}>
            <span className="text-2xl mt-0.5">{o.emoji}</span>
            <div><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{o.title}</p><p className="text-xs" style={{ color: '#6B7280' }}>{o.desc}</p></div>
          </button>
        ))}
      </div>}

      {/* Step 3 — Action */}
      {step === 3 && <div className="space-y-4">
        {resolution === 'tradesman' && (searchingContractors ? (
          <div className="flex flex-col items-center py-8"><Loader2 size={28} className="animate-spin mb-4" style={{ color: '#F59E0B' }} /><p className="text-sm" style={{ color: '#D1D5DB' }}>Searching for {issueType || 'maintenance'} contractors...</p></div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Available contractors</p>
            {CONTRACTORS.map((c, i) => (
              <button key={i} onClick={() => setSelectedContractor(i)} className="w-full rounded-xl p-4 text-left transition-all" style={{ backgroundColor: selectedContractor === i ? 'rgba(13,148,136,0.08)' : '#0A0B10', border: selectedContractor === i ? '1px solid #0D9488' : '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{c.name}</p><span className="text-xs" style={{ color: '#F59E0B' }}>★ {c.rating}</span></div>
                <div className="flex gap-4 text-xs" style={{ color: '#6B7280' }}><span>{c.distance}</span><span>{c.avail}</span><span>{c.cost}</span><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>{c.accred}</span></div>
              </button>
            ))}
            {selectedContractor !== null && <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3"><div><Label>Site contact name</Label><input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div><div><Label>Contact phone</Label><input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS} /></div></div>
              <div><Label>Access instructions</Label><textarea value={accessNotes} onChange={e => setAccessNotes(e.target.value)} rows={2} placeholder="e.g. Report to reception, bring ID" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={iS} /></div>
              <div><Label>Best time for visit</Label><select value={visitTime} onChange={e => setVisitTime(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={iS}><option>Morning</option><option>Afternoon</option><option>Either</option></select></div>
            </div>}
          </div>
        ))}
        {resolution === 'maintenance' && <div className="rounded-xl p-5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <p className="text-xs font-bold mb-3" style={{ color: '#0D9488' }}>NOTIFICATION PREVIEW</p>
          <p className="text-sm" style={{ color: '#D1D5DB', lineHeight: 1.7 }}>New maintenance request logged: {issueType || 'Issue'} at {buildingLoc || 'school'}{specificLoc ? ` (${specificLoc})` : ''}. Priority: {priority || 'Routine'}. Please review and action.</p>
        </div>}
        {resolution === 'log' && <div className="text-center py-8"><p className="text-sm" style={{ color: '#9CA3AF' }}>Issue will be logged as <span className="font-mono font-bold" style={{ color: '#0D9488' }}>{ref}</span></p><p className="text-xs mt-2" style={{ color: '#6B7280' }}>No notifications will be sent.</p></div>}
      </div>}

      {/* Step 4 — Confirmation */}
      {step === 4 && <div className="space-y-4">
        <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <Check size={28} style={{ color: '#22C55E', margin: '0 auto 8px' }} />
          <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Issue logged as {ref}</p>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{buildingLoc}{specificLoc ? ` — ${specificLoc}` : ''} · {issueType} · {priority}</p>
        </div>
        <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#1F2937' }}>
          <p className="text-xs" style={{ color: '#6B7280' }}>We&apos;ll remind you in {priority === 'Safety Risk' ? '1 day' : priority === 'Urgent' ? '3 days' : '7 days'} if this issue hasn&apos;t been marked as resolved.</p>
        </div>
      </div>}

      {toast && <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{toast}</div>}
    </Shell>
  )
}
