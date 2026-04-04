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

/* ──────────────────────────────────────────────
   Shared small components
   ────────────────────────────────────────────── */

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors" style={{
      backgroundColor: selected ? 'rgba(13,148,136,0.2)' : '#1F2937',
      color: selected ? '#0D9488' : '#9CA3AF',
      border: selected ? '1px solid #0D9488' : '1px solid #374151',
    }}>{label}</button>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{label}</span>
      <div onClick={() => onChange(!checked)} className="relative w-9 h-5 rounded-full transition-colors" style={{ backgroundColor: checked ? '#0D9488' : '#374151' }}>
        <div className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-transform" style={{ left: checked ? 18 : 2 }} />
      </div>
    </label>
  )
}

function DarkCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-4 ${className}`} style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>{children}</div>
}

function FakeLoader({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 size={28} className="animate-spin" style={{ color: '#0D9488' }} />
      <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Analysing data with AI...</p>
    </div>
  )
  return <>{children}</>
}

function useAILoading(step: number, triggerStep: number) {
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (step === triggerStep && !loaded) {
      setLoading(true)
      const t = setTimeout(() => { setLoading(false); setLoaded(true) }, 2000)
      return () => clearTimeout(t)
    }
  }, [step, triggerStep, loaded])
  return loading
}

/* ──────────────────────────────────────────────
   1. SchoolDashboardModal
   ────────────────────────────────────────────── */

export function SchoolDashboardModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [focus, setFocus] = useState('Whole School')
  const [metrics, setMetrics] = useState<string[]>(['Attendance', 'Progress'])
  const loading = useAILoading(step, 2)
  const allMetrics = ['Attendance', 'Progress', 'Behaviour', 'SEND', 'Safeguarding', 'Finance']
  const toggleMetric = (m: string) => setMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const kpis = [
    { label: 'Attendance', value: '94.2%', color: '#22C55E' },
    { label: 'Behaviour Incidents', value: '12', color: '#F59E0B' },
    { label: 'Progress On Track', value: '78%', color: '#22C55E' },
    { label: 'Budget Remaining', value: '\u00A342k', color: '#3B82F6' },
  ]

  return (
    <WizardShell onClose={onClose} title="School Dashboard" subtitle="Generate an AI overview dashboard" icon="📊" step={step} totalSteps={3} stepLabels={['Configure', 'Generate', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <Label req>Focus area</Label>
            <select value={focus} onChange={e => setFocus(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Whole School', 'Key Stage 1', 'Key Stage 2', 'EYFS', 'Specific Year'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label req>Metric priorities</Label>
            <div className="flex flex-wrap gap-2">{allMetrics.map(m => <Chip key={m} label={m} selected={metrics.includes(m)} onClick={() => toggleMetric(m)} />)}</div>
          </div>
        </div>
      )}
      {step === 2 && (
        <FakeLoader loading={loading}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Dashboard Summary &mdash; {focus}</p>
          <div className="grid grid-cols-2 gap-3">
            {kpis.map(k => (
              <DarkCard key={k.label}>
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{k.label}</p>
                <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
              </DarkCard>
            ))}
          </div>
        </FakeLoader>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Dashboard snapshot saved</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Focus: {focus} &bull; Metrics: {metrics.join(', ')}</p>
          </DarkCard>
          <DemoConfirm isDemoMode={isDemoMode} text="Your dashboard has been saved and is accessible from the SLT suite." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   2. OfstedPrepModal
   ────────────────────────────────────────────── */

export function OfstedPrepModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [area, setArea] = useState('Overall Effectiveness')
  const [inPlace, setInPlace] = useState('')
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const loading = useAILoading(step, 3)
  const ref = genRef('OFS')

  const areas = ['Overall Effectiveness', 'Quality of Education', 'Behaviour & Attitudes', 'Personal Development', 'Leadership & Management', 'SEND', 'Safeguarding']
  const gaps = [
    'Deep dive evidence folders incomplete for foundation subjects',
    'SEND provision mapping not updated since last term',
    'Governor monitoring visit records missing for Autumn 2',
  ]
  const actions = [
    { text: 'Schedule foundation subject deep dives with middle leaders', priority: 'High' },
    { text: 'Update SEND provision map and cross-reference with EHCPs', priority: 'High' },
    { text: 'Arrange governor monitoring visits for Spring 2', priority: 'Medium' },
    { text: 'Collate pupil voice evidence across all year groups', priority: 'Low' },
  ]

  return (
    <WizardShell onClose={onClose} title="Ofsted Preparation" subtitle="AI-powered inspection readiness audit" icon="🔍" step={step} totalSteps={4} stepLabels={['Focus', 'Evidence', 'AI Analysis', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div>
          <Label req>Inspection area</Label>
          <select value={area} onChange={e => setArea(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
            {areas.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>What&apos;s currently in place?</Label>
            <textarea value={inPlace} onChange={e => setInPlace(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="Describe current provision..." />
          </div>
          <div>
            <Label>Key strengths</Label>
            <textarea value={strengths} onChange={e => setStrengths(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="List key strengths..." />
          </div>
          <div>
            <Label>Known weaknesses</Label>
            <textarea value={weaknesses} onChange={e => setWeaknesses(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="List known weaknesses..." />
          </div>
        </div>
      )}
      {step === 3 && (
        <FakeLoader loading={loading}>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: '#F59E0B' }}>Gaps Identified (3)</p>
              <div className="space-y-2">
                {gaps.map((g, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <p className="text-xs" style={{ color: '#F59E0B' }}>{g}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Suggested Actions (4)</p>
              <div className="space-y-2">
                {actions.map((a, i) => (
                  <DarkCard key={i}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs" style={{ color: '#D1D5DB' }}>{a.text}</p>
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold" style={{
                        backgroundColor: a.priority === 'High' ? 'rgba(239,68,68,0.15)' : a.priority === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                        color: a.priority === 'High' ? '#EF4444' : a.priority === 'Medium' ? '#F59E0B' : '#22C55E',
                      }}>{a.priority}</span>
                    </div>
                  </DarkCard>
                ))}
              </div>
            </div>
          </div>
        </FakeLoader>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Ofsted prep report saved</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Area: {area} &bull; Ref: {ref}</p>
          </DarkCard>
          <DemoConfirm isDemoMode={isDemoMode} text="Your Ofsted preparation report has been saved to your document store." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   3. SLTMeetingAgendaModal
   ────────────────────────────────────────────── */

export function SLTMeetingAgendaModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState('1hr')
  const [attendees, setAttendees] = useState<string[]>(['Headteacher', 'Deputy Head'])
  const [items, setItems] = useState<Record<string, boolean>>({
    'Attendance update': true, 'Behaviour summary': true, 'Safeguarding briefing': true,
    'Finance update': false, 'Staff wellbeing': false, 'SEND update': false, 'Curriculum review': false,
  })
  const [additional, setAdditional] = useState('')
  const loading = useAILoading(step, 3)

  const allAttendees = ['Headteacher', 'Deputy Head', 'Assistant Head', 'SENCO', 'DSL', 'Business Manager']
  const toggleAttendee = (a: string) => setAttendees(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])

  const enabledItems = Object.entries(items).filter(([, v]) => v).map(([k]) => k)
  const totalMins = duration === '30min' ? 30 : duration === '45min' ? 45 : duration === '1hr' ? 60 : duration === '1.5hr' ? 90 : 120
  const perItem = enabledItems.length > 0 ? Math.floor(totalMins / (enabledItems.length + (additional ? 1 : 0) + 1)) : 10

  return (
    <WizardShell onClose={onClose} title="SLT Meeting Agenda" subtitle="AI-generated meeting agenda" icon="📅" step={step} totalSteps={3} stepLabels={['Meeting', 'Standing Items', 'AI Generate']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Meeting date</Label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
          <div>
            <Label req>Duration</Label>
            <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['30min', '45min', '1hr', '1.5hr', '2hr'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <Label req>Attendees</Label>
            <div className="flex flex-wrap gap-2">{allAttendees.map(a => <Chip key={a} label={a} selected={attendees.includes(a)} onClick={() => toggleAttendee(a)} />)}</div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-1">
          {Object.keys(items).map(k => (
            <Toggle key={k} label={k} checked={items[k]} onChange={v => setItems(prev => ({ ...prev, [k]: v }))} />
          ))}
          <div className="mt-4">
            <Label>Additional items</Label>
            <textarea value={additional} onChange={e => setAdditional(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="Any extra agenda items..." />
          </div>
        </div>
      )}
      {step === 3 && (
        <FakeLoader loading={loading}>
          <div className="space-y-3">
            <DarkCard>
              <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>SLT Meeting Agenda &mdash; {date || 'TBC'}</p>
              <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Duration: {duration} &bull; Attendees: {attendees.join(', ')}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #374151' }}>
                  <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>Welcome &amp; apologies</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{perItem} min</span>
                </div>
                {enabledItems.map(item => (
                  <div key={item} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #374151' }}>
                    <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{item}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{perItem} min</span>
                  </div>
                ))}
                {additional && (
                  <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #374151' }}>
                    <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{additional}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{perItem} min</span>
                  </div>
                )}
              </div>
            </DarkCard>
            <DarkCard>
              <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Agenda created &mdash; sent to all attendees</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{attendees.length} attendees will receive this agenda via email.</p>
            </DarkCard>
            <DemoConfirm isDemoMode={isDemoMode} text="Agenda has been created and distributed to all selected attendees." />
          </div>
        </FakeLoader>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   4. WholeSchoolInsightsModal
   ────────────────────────────────────────────── */

export function WholeSchoolInsightsModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [period, setPeriod] = useState('This Term')
  const [compare, setCompare] = useState('Previous Period')
  const loading = useAILoading(step, 2)

  const insights = [
    { label: 'Attendance Trend', value: '94.2%', delta: '+1.3%', up: true },
    { label: 'Behaviour Trend', value: '87 incidents', delta: '-14%', up: false },
    { label: 'Progress Summary', value: '78% on track', delta: '+4%', up: true },
    { label: 'SEND Provision', value: '32 pupils', delta: '+2 new EHCPs', up: true },
    { label: 'Staff Absence', value: '3.1 days avg', delta: '-0.4 days', up: false },
  ]

  return (
    <WizardShell onClose={onClose} title="Whole School Insights" subtitle="Cross-domain performance overview" icon="🏫" step={step} totalSteps={3} stepLabels={['Configure', 'Generate', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Period</Label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['This Week', 'This Term', 'This Year'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <Label req>Compare with</Label>
            <select value={compare} onChange={e => setCompare(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Previous Period', 'Same Period Last Year', 'National Average'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <FakeLoader loading={loading}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Insights &mdash; {period} vs {compare}</p>
          <div className="space-y-3">
            {insights.map(ins => (
              <DarkCard key={ins.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{ins.label}</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: '#F9FAFB' }}>{ins.value}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span style={{ color: ins.label === 'Behaviour Trend' || ins.label === 'Staff Absence' ? (ins.up ? '#EF4444' : '#22C55E') : (ins.up ? '#22C55E' : '#EF4444') }}>
                      {ins.up ? '\u2191' : '\u2193'}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: ins.label === 'Behaviour Trend' || ins.label === 'Staff Absence' ? (ins.up ? '#EF4444' : '#22C55E') : (ins.up ? '#22C55E' : '#EF4444') }}>
                      {ins.delta}
                    </span>
                  </div>
                </div>
              </DarkCard>
            ))}
          </div>
        </FakeLoader>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Insights report exported</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{period} compared with {compare} &bull; 5 insight areas</p>
          </DarkCard>
          <DemoConfirm isDemoMode={isDemoMode} text="Report has been exported and is available in your documents." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   5. GovernorReportModal
   ────────────────────────────────────────────── */

export function GovernorReportModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [term, setTerm] = useState('Spring')
  const [academicYear, setAcademicYear] = useState('2025/26')
  const allSections = ["Headteacher's Report", 'Attendance', 'Behaviour', 'Curriculum', 'SEND', 'Safeguarding', 'Finance', 'Staffing', 'Premises', 'Parent Engagement']
  const [sections, setSections] = useState<string[]>(["Headteacher's Report", 'Attendance', 'Behaviour', 'SEND', 'Safeguarding', 'Finance'])
  const [expanded, setExpanded] = useState<string | null>(null)
  const loading = useAILoading(step, 3)

  const toggleSection = (s: string) => setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const sectionData: Record<string, string> = {
    "Headteacher's Report": "This term has seen continued improvement across all key areas. Our focus on quality-first teaching has resulted in improved progress data, particularly in KS2 writing. Staff morale remains high following the successful restructuring of PPA time. We welcomed 3 new pupils and said goodbye to 1 family relocating. Our Ofsted preparation work is progressing well.",
    'Attendance': 'Whole school attendance stands at 94.2%, above the national average of 93.8%. Persistent absence has reduced from 14.2% to 12.8% following targeted intervention with 8 families. Authorised absence accounts for 4.1% and unauthorised for 1.7%.',
    'Behaviour': 'Behaviour incidents have decreased by 14% compared to the same period last year. 87 incidents were logged this term, with 12 resulting in internal exclusion. Zero fixed-term exclusions this term. The new restorative approach is showing positive impact.',
    'Curriculum': 'All subject leaders have completed their curriculum reviews. Foundation subjects are now fully sequenced with knowledge organisers in place. Reading for pleasure initiative launched across KS2 with positive uptake.',
    'SEND': '32 pupils currently on the SEND register (14.8%). 8 pupils have EHCPs, with 2 new plans approved this term. Annual reviews are up to date. SENCO has completed the NASENCO qualification.',
    'Safeguarding': 'All staff safeguarding training is up to date. 14 active cases managed through CPOMS. 3 referrals made to MASH this term. Single Central Record audited and compliant. DSL supervision is in place fortnightly.',
    'Finance': 'Budget is on track with \u00A342k remaining. Staffing costs account for 82% of total expenditure. Sports premium and pupil premium spending is aligned with published plans. No unexpected costs this term.',
    'Staffing': '89 staff members (42 teaching, 47 support). 2 vacancies currently being recruited. Staff absence averages 3.1 days this term, down from 3.5 last term. 4 staff currently on phased returns.',
    'Premises': 'Roof repair completed on Block B. Fire safety inspection passed with no actions. New outdoor learning area construction begins next half term. H&S audit scheduled for March.',
    'Parent Engagement': 'Parent survey response rate 68% (up from 52%). 92% would recommend the school. Parents evenings attendance 87%. PTA raised \u00A34,200 this term.',
  }

  return (
    <WizardShell onClose={onClose} title="Governor Report" subtitle="Generate a comprehensive governor report" icon="📋" step={step} totalSteps={4} stepLabels={['Period', 'Sections', 'AI Generate', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Term</Label>
            <select value={term} onChange={e => setTerm(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Autumn', 'Spring', 'Summer'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Academic year</Label>
            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-1">
          {allSections.map(s => (
            <label key={s} className="flex items-center gap-3 py-2 cursor-pointer">
              <input type="checkbox" checked={sections.includes(s)} onChange={() => toggleSection(s)} className="rounded" style={{ accentColor: '#0D9488' }} />
              <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{s}</span>
            </label>
          ))}
        </div>
      )}
      {step === 3 && (
        <FakeLoader loading={loading}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Governor Report &mdash; {term} Term {academicYear}</p>
          <div className="space-y-2">
            {sections.map(s => (
              <DarkCard key={s}>
                <button onClick={() => setExpanded(expanded === s ? null : s)} className="w-full flex items-center justify-between text-left">
                  <span className="text-xs font-semibold" style={{ color: '#D1D5DB' }}>{s}</span>
                  <ChevronRight size={14} style={{ color: '#6B7280', transform: expanded === s ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {expanded === s && (
                  <p className="text-xs mt-3 leading-relaxed" style={{ color: '#9CA3AF' }}>{sectionData[s] || 'Report data will be generated from your MIS.'}</p>
                )}
              </DarkCard>
            ))}
          </div>
        </FakeLoader>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Governor report saved</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Share with clerk. {sections.length} sections included.</p>
          </DarkCard>
          <DemoConfirm isDemoMode={isDemoMode} text="The governor report has been saved and is ready to share with the clerk." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   6. ImprovementPlanModal
   ────────────────────────────────────────────── */

export function ImprovementPlanModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [area, setArea] = useState('Teaching & Learning')
  const [rag, setRag] = useState('Amber')
  const [targets, setTargets] = useState([
    { target: '', criteria: '' },
    { target: '', criteria: '' },
    { target: '', criteria: '' },
  ])
  const [actions, setActions] = useState([
    { action: '', person: '', timeline: '', cost: '' },
    { action: '', person: '', timeline: '', cost: '' },
    { action: '', person: '', timeline: '', cost: '' },
  ])
  const ref = genRef('SIP')

  const updateTarget = (i: number, field: string, val: string) => setTargets(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  const updateAction = (i: number, field: string, val: string) => setActions(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a))

  const areas = ['Teaching & Learning', 'Behaviour', 'Attendance', 'SEND', 'Leadership', 'Curriculum', 'Assessment']

  return (
    <WizardShell onClose={onClose} title="School Improvement Plan" subtitle="Set targets, actions, and accountability" icon="🎯" step={step} totalSteps={4} stepLabels={['Priority', 'Targets', 'Actions', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Priority area</Label>
            <select value={area} onChange={e => setArea(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {areas.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <Label req>Current RAG rating</Label>
            <div className="flex gap-3">
              {['Red', 'Amber', 'Green'].map(r => (
                <button key={r} onClick={() => setRag(r)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold" style={{
                  backgroundColor: rag === r ? (r === 'Red' ? 'rgba(239,68,68,0.15)' : r === 'Amber' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)') : '#1F2937',
                  color: r === 'Red' ? '#EF4444' : r === 'Amber' ? '#F59E0B' : '#22C55E',
                  border: rag === r ? `1px solid ${r === 'Red' ? '#EF4444' : r === 'Amber' ? '#F59E0B' : '#22C55E'}` : '1px solid #374151',
                }}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-5">
          {targets.map((t, i) => (
            <DarkCard key={i}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#0D9488' }}>Target {i + 1}</p>
              <div className="space-y-3">
                <div>
                  <Label req>Target</Label>
                  <input type="text" value={t.target} onChange={e => updateTarget(i, 'target', e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="What needs to be achieved?" />
                </div>
                <div>
                  <Label>Success criteria</Label>
                  <textarea value={t.criteria} onChange={e => updateTarget(i, 'criteria', e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="How will success be measured?" />
                </div>
              </div>
            </DarkCard>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-5">
          {actions.map((a, i) => (
            <DarkCard key={i}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#0D9488' }}>Target {i + 1} Actions</p>
              <div className="space-y-3">
                <div>
                  <Label req>Action</Label>
                  <textarea value={a.action} onChange={e => updateAction(i, 'action', e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="What action will be taken?" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Responsible person</Label>
                    <input type="text" value={a.person} onChange={e => updateAction(i, 'person', e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="Who?" />
                  </div>
                  <div>
                    <Label>Timeline</Label>
                    <input type="text" value={a.timeline} onChange={e => updateAction(i, 'timeline', e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="By when?" />
                  </div>
                  <div>
                    <Label>Cost (\u00A3)</Label>
                    <input type="text" value={a.cost} onChange={e => updateAction(i, 'cost', e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="\u00A30" />
                  </div>
                </div>
              </div>
            </DarkCard>
          ))}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>School improvement plan updated</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Area: {area} &bull; RAG: {rag} &bull; Ref: {ref}</p>
          </DarkCard>
          <DemoConfirm isDemoMode={isDemoMode} text="The improvement plan has been saved and linked to your school development plan." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   7. StaffAppraisalModal
   ────────────────────────────────────────────── */

export function StaffAppraisalModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [staffName, setStaffName] = useState('')
  const [appraiser, setAppraiser] = useState('')
  const [reviewPeriod, setReviewPeriod] = useState('Annual')
  const [prevObjectives] = useState([
    { text: 'Improve KS2 writing attainment by 5%', rating: '', evidence: '' },
    { text: 'Complete NPQML qualification', rating: '', evidence: '' },
    { text: 'Lead whole-school reading initiative', rating: '', evidence: '' },
  ])
  const [objectiveRatings, setObjectiveRatings] = useState<{ rating: string; evidence: string }[]>([
    { rating: '', evidence: '' },
    { rating: '', evidence: '' },
    { rating: '', evidence: '' },
  ])
  const [newObjectives, setNewObjectives] = useState([
    { objective: '', target: '', support: '' },
    { objective: '', target: '', support: '' },
    { objective: '', target: '', support: '' },
  ])

  const updateRating = (i: number, field: string, val: string) => setObjectiveRatings(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: val } : o))
  const updateNew = (i: number, field: string, val: string) => setNewObjectives(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: val } : o))

  return (
    <WizardShell onClose={onClose} title="Staff Appraisal" subtitle="Performance review and objective setting" icon="👤" step={step} totalSteps={4} stepLabels={['Select', 'Objectives', 'New Objectives', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Staff member</Label>
            <input type="text" value={staffName} onChange={e => setStaffName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="Full name" />
          </div>
          <div>
            <Label req>Appraiser</Label>
            <input type="text" value={appraiser} onChange={e => setAppraiser(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="Appraiser name" />
          </div>
          <div>
            <Label req>Review period</Label>
            <select value={reviewPeriod} onChange={e => setReviewPeriod(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Autumn', 'Spring', 'Summer', 'Annual'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Review Previous Objectives</p>
          {prevObjectives.map((obj, i) => (
            <DarkCard key={i}>
              <p className="text-xs font-medium mb-3" style={{ color: '#D1D5DB' }}>{obj.text}</p>
              <div className="space-y-3">
                <div>
                  <Label req>Rating</Label>
                  <div className="flex gap-2">
                    {['Met', 'Partially Met', 'Not Met'].map(r => (
                      <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name={`rating-${i}`} checked={objectiveRatings[i].rating === r} onChange={() => updateRating(i, 'rating', r)} style={{ accentColor: '#0D9488' }} />
                        <span className="text-xs" style={{ color: r === 'Met' ? '#22C55E' : r === 'Partially Met' ? '#F59E0B' : '#EF4444' }}>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Evidence</Label>
                  <textarea value={objectiveRatings[i].evidence} onChange={e => updateRating(i, 'evidence', e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="Supporting evidence..." />
                </div>
              </div>
            </DarkCard>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Set New Objectives</p>
          {newObjectives.map((obj, i) => (
            <DarkCard key={i}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#0D9488' }}>Objective {i + 1}</p>
              <div className="space-y-3">
                <div>
                  <Label req>Objective</Label>
                  <input type="text" value={obj.objective} onChange={e => updateNew(i, 'objective', e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="What is the objective?" />
                </div>
                <div>
                  <Label>Measurable target</Label>
                  <textarea value={obj.target} onChange={e => updateNew(i, 'target', e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="How will this be measured?" />
                </div>
                <div>
                  <Label>Support needed</Label>
                  <textarea value={obj.support} onChange={e => updateNew(i, 'support', e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="CPD, coaching, resources..." />
                </div>
              </div>
            </DarkCard>
          ))}
        </div>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Appraisal record saved</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Copy sent to staff member and HR.</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Staff: {staffName || 'TBC'} &bull; Appraiser: {appraiser || 'TBC'} &bull; Period: {reviewPeriod}</p>
          </DarkCard>
          <DemoConfirm isDemoMode={isDemoMode} text="The appraisal record has been saved. A copy has been sent to the staff member and HR." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   8. ExclusionSignOffModal
   ────────────────────────────────────────────── */

export function ExclusionSignOffModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [decision, setDecision] = useState('')
  const [rationale, setRationale] = useState('')
  const [conditions, setConditions] = useState('')

  return (
    <WizardShell onClose={onClose} title="Exclusion Sign-Off" subtitle="Review and authorise exclusion decisions" icon="\u26A0\uFE0F" step={step} totalSteps={3} stepLabels={['Review', 'Decision', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Exclusion Request Summary</p>
          <DarkCard>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>Pupil name</span>
                <span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>James Patterson (Year 5)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>Type</span>
                <span className="text-xs font-medium" style={{ color: '#F59E0B' }}>Fixed-term (3 days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>Reason</span>
                <span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>Persistent disruptive behaviour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>Proposed dates</span>
                <span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>7 Apr &ndash; 9 Apr 2026</span>
              </div>
              <div style={{ borderTop: '1px solid #374151', paddingTop: 12 }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Prior sanctions this term</p>
                <div className="space-y-1">
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>&bull; 3x behaviour reports (Jan, Feb, Mar)</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>&bull; 2x internal exclusions (Feb, Mar)</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>&bull; Parent meeting held 15 Mar</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>&bull; Pastoral support plan in place since Feb</p>
                </div>
              </div>
            </div>
          </DarkCard>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label req>Decision</Label>
            <select value={decision} onChange={e => setDecision(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="">Select decision...</option>
              <option>Approve</option>
              <option>Reject</option>
              <option>Request More Info</option>
            </select>
          </div>
          <div>
            <Label req>Rationale</Label>
            <textarea value={rationale} onChange={e => setRationale(e.target.value)} rows={4} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="Provide rationale for this decision..." />
          </div>
          {decision === 'Approve' && (
            <div>
              <Label>Conditions on return</Label>
              <textarea value={conditions} onChange={e => setConditions(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="Any conditions for the pupil's return..." />
            </div>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Decision recorded</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Parent letter generated. Class teacher notified.</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Decision: {decision || 'TBC'}</p>
          </DarkCard>
          <DemoConfirm isDemoMode={isDemoMode} text="The exclusion decision has been recorded. Parent letter has been generated and the class teacher has been notified." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   9. CalendarPlannerModal
   ────────────────────────────────────────────── */

export function CalendarPlannerModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [term, setTerm] = useState('Summer')
  const [year, setYear] = useState('current')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventType, setEventType] = useState('INSET')
  const [events, setEvents] = useState<{ name: string; date: string; type: string }[]>([])

  const addEvent = () => {
    if (eventName && eventDate) {
      setEvents(prev => [...prev, { name: eventName, date: eventDate, type: eventType }])
      setEventName('')
      setEventDate('')
      setEventType('INSET')
    }
  }

  const removeEvent = (i: number) => setEvents(prev => prev.filter((_, idx) => idx !== i))

  const typeColors: Record<string, string> = {
    INSET: '#3B82F6', 'Parents Evening': '#8B5CF6', Trip: '#22C55E', Assessment: '#F59E0B', 'Sports Day': '#EF4444', Other: '#6B7280',
  }

  return (
    <WizardShell onClose={onClose} title="Calendar Planner" subtitle="Plan and publish school calendar events" icon="🗓️" step={step} totalSteps={3} stepLabels={['Configure', 'Events', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Term</Label>
            <select value={term} onChange={e => setTerm(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              {['Autumn', 'Spring', 'Summer'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label req>Academic year</Label>
            <select value={year} onChange={e => setYear(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
              <option value="current">Current (2025/26)</option>
              <option value="next">Next (2026/27)</option>
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <DarkCard>
            <p className="text-xs font-semibold mb-3" style={{ color: '#0D9488' }}>Add Event</p>
            <div className="space-y-3">
              <div>
                <Label req>Event name</Label>
                <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="e.g. Year 6 SATs Week" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label req>Date</Label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} />
                </div>
                <div>
                  <Label req>Type</Label>
                  <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS}>
                    {['INSET', 'Parents Evening', 'Trip', 'Assessment', 'Sports Day', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={addEvent} className="w-full px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>+ Add Event</button>
            </div>
          </DarkCard>
          {events.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Added Events ({events.length})</p>
              {events.map((ev, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[ev.type] || '#6B7280' }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{ev.name}</p>
                      <p className="text-[10px]" style={{ color: '#6B7280' }}>{ev.date} &bull; {ev.type}</p>
                    </div>
                  </div>
                  <button onClick={() => removeEvent(i)} className="text-xs" style={{ color: '#EF4444' }}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {events.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>No events added yet. Use the form above to add events.</p>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Calendar updated &mdash; all staff notified</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{term} Term ({year === 'current' ? '2025/26' : '2026/27'}) &bull; {events.length} events added</p>
          </DarkCard>
          {events.length > 0 && (
            <DarkCard>
              <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Events Summary</p>
              {events.map((ev, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeColors[ev.type] || '#6B7280' }} />
                  <span className="text-xs" style={{ color: '#D1D5DB' }}>{ev.name} &mdash; {ev.date}</span>
                </div>
              ))}
            </DarkCard>
          )}
          <DemoConfirm isDemoMode={isDemoMode} text="Calendar has been updated and all staff have been notified of the changes." />
        </div>
      )}
    </WizardShell>
  )
}

/* ──────────────────────────────────────────────
   10. SendAllStaffMessageModal
   ────────────────────────────────────────────── */

export function SendAllStaffMessageModal({ onClose, isDemoMode }: ModalProps) {
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal')
  const [channels, setChannels] = useState<Record<string, boolean>>({
    Email: true, 'Staff App Notification': true, SMS: false, 'Display on Staff Room Screen': false,
  })

  const aiDraft = () => {
    setSubject('Staff Briefing: Key Updates for Week Commencing 7th April')
    setBody(`Dear colleagues,

I hope you all had a restful weekend. Here are the key updates for this week:

1. INSET Day Reminder — Friday 11th April is a scheduled INSET day. Please ensure all planning is submitted by Thursday.

2. Year 6 SATs Preparation — Mock SATs will take place Monday to Wednesday. Please ensure your classes are aware of adjusted break times.

3. Parent Consultations — Booking is now open for Spring term parent consultations (w/c 14th April). Please ensure your availability is up to date on the system.

4. Safeguarding Update — A reminder that all staff must complete the updated online safeguarding module by end of this term. Contact the DSL if you have any questions.

5. Wellbeing — The staff wellbeing committee has arranged a social event on Thursday after school. All welcome!

Thank you for your continued hard work and dedication.

Best wishes,
The Senior Leadership Team`)
  }

  const selectedChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k)

  return (
    <WizardShell onClose={onClose} title="Send All-Staff Message" subtitle="Compose and distribute a message to all staff" icon="📨" step={step} totalSteps={3} stepLabels={['Compose', 'Channels', 'Confirm']} setStep={setStep}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label req>Subject</Label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={iS} placeholder="Message subject..." />
          </div>
          <div>
            <Label req>Message body</Label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="w-full rounded-lg px-3 py-2 text-sm resize-none" style={iS} placeholder="Write your message..." />
          </div>
          <button onClick={aiDraft} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            AI Draft &mdash; Generate sample message
          </button>
          <div>
            <Label>Priority</Label>
            <div className="flex gap-3">
              {(['Normal', 'Urgent'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{
                  backgroundColor: priority === p ? (p === 'Urgent' ? 'rgba(239,68,68,0.15)' : 'rgba(13,148,136,0.15)') : '#1F2937',
                  color: p === 'Urgent' ? '#EF4444' : '#0D9488',
                  border: priority === p ? `1px solid ${p === 'Urgent' ? '#EF4444' : '#0D9488'}` : '1px solid #374151',
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Delivery channels</Label>
            <div className="space-y-1">
              {Object.keys(channels).map(ch => (
                <label key={ch} className="flex items-center gap-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={channels[ch]} onChange={() => setChannels(prev => ({ ...prev, [ch]: !prev[ch] }))} style={{ accentColor: '#0D9488' }} />
                  <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{ch}</span>
                </label>
              ))}
            </div>
          </div>
          {subject && (
            <DarkCard>
              <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Message Preview</p>
              <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{subject}</p>
              {priority === 'Urgent' && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>URGENT</span>}
              <p className="text-xs mt-2 whitespace-pre-wrap leading-relaxed" style={{ color: '#9CA3AF', maxHeight: 200, overflow: 'auto' }}>{body}</p>
            </DarkCard>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <DarkCard>
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Message sent to all 89 staff via {selectedChannels.join(', ')}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Subject: {subject || 'No subject'} &bull; Priority: {priority}</p>
          </DarkCard>
          <DemoConfirm isDemoMode={isDemoMode} text="The message has been sent to all 89 staff members via the selected channels." />
        </div>
      )}
    </WizardShell>
  )
}
