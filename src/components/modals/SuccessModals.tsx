'use client'
import { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Loader2, Copy, FileText, Mail, Calendar, AlertTriangle } from 'lucide-react'

type P = { onClose: () => void; onToast: (msg: string) => void }
type Step = 0 | 1 | 2 | 3

const INPUT: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' }
const TEAL = '#0D9488'

function StepBar({ step, labels }: { step: Step; labels: string[] }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, backgroundColor: step > i ? TEAL : step === i ? 'rgba(13,148,136,0.2)' : '#1F2937', color: step > i ? '#fff' : step === i ? TEAL : '#6B7280' }}>{step > i ? <Check size={12} /> : i + 1}</div>
          <span className="text-xs font-medium hidden sm:inline" style={{ color: step === i ? '#F9FAFB' : '#6B7280' }}>{l}</span>
          {i < labels.length - 1 && <ArrowRight size={12} style={{ color: '#374151' }} />}
        </div>
      ))}
    </div>
  )
}

function Shell({ onClose, step, setStep, title, labels, children }: { onClose: () => void; step: Step; setStep: (s: Step) => void; title: string; labels: string[]; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full flex flex-col rounded-2xl" style={{ maxWidth: 640, maxHeight: '90vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        <StepBar step={step} labels={labels} />
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={() => step > 0 ? setStep((step - 1) as Step) : onClose()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}><ArrowLeft size={14} />{step === 0 ? 'Cancel' : 'Back'}</button>
          {step === 1 && <span className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}><Loader2 size={14} className="animate-spin" /> Generating…</span>}
        </div>
      </div>
    </div>
  )
}

function Lbl({ children }: { children: React.ReactNode }) { return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{children}</label> }
function Btn({ label, onClick }: { label: string; onClick: () => void }) { return <button onClick={onClick} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: TEAL, color: '#F9FAFB' }}>{label}</button> }
function Act({ icon: Icon, label, onClick }: { icon: typeof Copy; label: string; onClick: () => void }) { return <button onClick={onClick} className="flex items-center gap-3 w-full rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}><Icon size={18} style={{ color: TEAL }} /><span className="text-sm font-medium">{label}</span></button> }
function Gen({ items, done }: { items: string[]; done: boolean }) { return <div className="flex flex-col gap-3 py-6">{items.map((t, i) => <div key={t} className="flex items-center gap-3">{done || i < items.length - 1 ? <Check size={16} style={{ color: TEAL }} /> : <Loader2 size={16} className="animate-spin" style={{ color: TEAL }} />}<span className="text-sm" style={{ color: '#D1D5DB' }}>{t}</span></div>)}</div> }
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) { return <select style={INPUT} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o}>{o}</option>)}</select> }
function Card({ children, amber }: { children: React.ReactNode; amber?: boolean }) { return <div className="rounded-xl p-4" style={{ backgroundColor: amber ? 'rgba(245,158,11,0.1)' : '#1F2937', border: `1px solid ${amber ? 'rgba(245,158,11,0.3)' : '#374151'}` }}>{children}</div> }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}><p className="text-lg font-bold" style={{ color: TEAL }}>{value}</p><p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{label}</p></div> }
function ScoreBadge({ score }: { score: number }) { const c = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'; return <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${c}20`, color: c }}>{score}</span> }
function RAGBadge({ rag }: { rag: string }) { const c = rag === 'green' ? '#10B981' : rag === 'amber' ? '#F59E0B' : '#EF4444'; return <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase" style={{ backgroundColor: `${c}20`, color: c }}>{rag}</span> }

function useAI(step: Step, delay = 3000) {
  const [done, setDone] = useState(false)
  useEffect(() => { setDone(false); if (step === 1) { const t = setTimeout(() => setDone(true), delay); return () => clearTimeout(t) } }, [step, delay])
  return done
}

function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>
}

// ─── 1. RAGCheckModal ──────────────────────────────────────────────────────

const RAG_FB = {
  green: [{ name: 'Oakridge Schools', score: 92, risk: 'None', renewal: '120 days', action: 'Maintain regular touchpoints' }, { name: 'Greenfield Academy', score: 88, risk: 'None', renewal: '90 days', action: 'Discuss expansion' }],
  amber: [{ name: 'Bramble Hill Trust', score: 62, risk: 'Declining usage', renewal: '45 days', action: 'Schedule check-in call' }],
  red: [{ name: 'Crestline Capital', score: 31, risk: 'No login 31 days', renewal: '15 days', action: 'Executive escalation' }, { name: 'Whitestone College', score: 38, risk: '3 open support tickets', renewal: '30 days', action: 'Technical review meeting' }]
}

export function RAGCheckModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [checkType, setCheckType] = useState('Full portfolio'); const [customer, setCustomer] = useState('')
  const [criteria, setCriteria] = useState({ login: true, feature: true, support: true, nps: true, renewal: true, stakeholder: true })
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  const allAccounts = [...RAG_FB.green.map(a => ({ ...a, rag: 'green' })), ...RAG_FB.amber.map(a => ({ ...a, rag: 'amber' })), ...RAG_FB.red.map(a => ({ ...a, rag: 'red' }))]

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="RAG Health Check" labels={['Setup', 'Analyse', 'Results', 'Actions']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div><Lbl>Check Type</Lbl><Sel value={checkType} onChange={setCheckType} options={['Full portfolio', 'Specific customer', 'Segment', 'Pre-renewal']} /></div>
        {checkType === 'Specific customer' && <div><Lbl>Customer Name</Lbl><input style={INPUT} value={customer} onChange={e => setCustomer(e.target.value)} /></div>}
        <div><Lbl>Scoring Criteria</Lbl>
          <div className="flex flex-col gap-2 mt-1">
            <Chk label="Login frequency (25%)" checked={criteria.login} onChange={v => setCriteria(p => ({ ...p, login: v }))} />
            <Chk label="Feature adoption (20%)" checked={criteria.feature} onChange={v => setCriteria(p => ({ ...p, feature: v }))} />
            <Chk label="Support tickets (15%)" checked={criteria.support} onChange={v => setCriteria(p => ({ ...p, support: v }))} />
            <Chk label="NPS (15%)" checked={criteria.nps} onChange={v => setCriteria(p => ({ ...p, nps: v }))} />
            <Chk label="Renewal date (15%)" checked={criteria.renewal} onChange={v => setCriteria(p => ({ ...p, renewal: v }))} />
            <Chk label="Stakeholder engagement (10%)" checked={criteria.stakeholder} onChange={v => setCriteria(p => ({ ...p, stakeholder: v }))} />
          </div>
        </div>
        <Btn label="Run Health Check →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Analysing usage data...', 'Scoring accounts...', 'Flagging risks...']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Green" value={String(RAG_FB.green.length)} />
          <Stat label="Amber" value={String(RAG_FB.amber.length)} />
          <Stat label="Red" value={String(RAG_FB.red.length)} />
        </div>
        {allAccounts.map(a => (
          <Card key={a.name} amber={a.rag === 'amber'}>
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{a.name}</span><div className="flex items-center gap-2"><ScoreBadge score={a.score} /><RAGBadge rag={a.rag} /></div></div>
            {a.risk !== 'None' && <p className="text-xs mb-1" style={{ color: '#EF4444' }}><AlertTriangle size={12} className="inline mr-1" />{a.risk}</p>}
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Renewal: {a.renewal} | Action: {a.action}</p>
          </Card>
        ))}
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={FileText} label="Export PDF report" onClick={() => onToast('PDF exported')} />
        <Act icon={Check} label="Assign tasks for amber/red" onClick={() => onToast('Tasks assigned')} />
        <Act icon={Calendar} label="Schedule calls for amber/red" onClick={() => onToast('Calls scheduled')} />
        <Act icon={Mail} label="Share with leadership" onClick={() => onToast('Shared with leadership')} />
        <Act icon={Calendar} label="Set next review date" onClick={() => { onToast('Health check complete'); onClose() }} />
      </div>}
    </Shell>
  )
}

// ─── 2. StartRecoveryModal ─────────────────────────────────────────────────

const REC_FB = {
  summary: 'High-risk account with declining usage and upcoming renewal. Champion has left the company — new stakeholder engagement required urgently.',
  rootCause: 'Primary champion Sarah Chen left the company 3 weeks ago. New VP Operations has no relationship with Lumio. Usage dropped 40% since her departure.',
  plan: { day1: 'Executive call — introduce to new VP, reaffirm value', day3: 'Send personalised ROI report showing £28k saved to date', day7: 'Product training session for new team members', day14: 'Executive business review with leadership' },
  talkingPoints: ['£28,800 ROI delivered in the last 12 months', '3 workflows saving 8 hours per week', '98% uptime SLA commitment'],
  followUpEmail: 'Hi [Name],\n\nI understand there have been some changes in your team recently. I wanted to reach out personally to ensure your Lumio experience continues to deliver value.\n\nI\'d love to schedule a brief call to introduce myself and discuss how we can best support your team going forward.\n\nBest regards'
}

export function StartRecoveryModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [customer, setCustomer] = useState(''); const [rag, setRag] = useState('Red'); const [risk, setRisk] = useState('Low usage'); const [renewalDate, setRenewalDate] = useState(''); const [arr, setArr] = useState(''); const [lastContact, setLastContact] = useState(''); const [champion, setChampion] = useState(''); const [execSponsor, setExecSponsor] = useState(false); const [execName, setExecName] = useState('')
  const [emailDraft, setEmailDraft] = useState(REC_FB.followUpEmail)
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Start Recovery Plan" labels={['Details', 'Analyse', 'Plan', 'Actions']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Customer Name</Lbl><input style={INPUT} value={customer} onChange={e => setCustomer(e.target.value)} /></div><div><Lbl>RAG Status</Lbl><Sel value={rag} onChange={setRag} options={['Red', 'Amber']} /></div></div>
        <div><Lbl>Primary Risk</Lbl><Sel value={risk} onChange={setRisk} options={['Low usage', 'Support issues', 'Budget', 'Competitor', 'Champion left', 'Product gaps', 'Pricing']} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Renewal Date</Lbl><input type="date" style={INPUT} value={renewalDate} onChange={e => setRenewalDate(e.target.value)} /></div><div><Lbl>ARR at Risk £</Lbl><input style={INPUT} value={arr} onChange={e => setArr(e.target.value)} placeholder="e.g. 48000" /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Last Contact Date</Lbl><input type="date" style={INPUT} value={lastContact} onChange={e => setLastContact(e.target.value)} /></div><div><Lbl>Champion Name</Lbl><input style={INPUT} value={champion} onChange={e => setChampion(e.target.value)} /></div></div>
        <div className="flex items-center gap-4">
          <Chk label="Executive Sponsor" checked={execSponsor} onChange={setExecSponsor} />
          {execSponsor && <input style={{ ...INPUT, maxWidth: 200 }} placeholder="Sponsor name" value={execName} onChange={e => setExecName(e.target.value)} />}
        </div>
        <Btn label="Build Recovery Plan →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Analysing risk factors...', 'Identifying win-back opportunities...', 'Drafting outreach strategy...']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <Card><p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Risk Summary</p><p className="text-sm" style={{ color: '#D1D5DB' }}>{REC_FB.summary}</p></Card>
        <Card amber><p className="text-xs font-semibold mb-1" style={{ color: '#F59E0B' }}>Root Cause</p><p className="text-sm" style={{ color: '#D1D5DB' }}>{REC_FB.rootCause}</p></Card>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>30/60/90 Day Plan</p>
          {Object.entries(REC_FB.plan).map(([k, v]) => <div key={k} className="flex items-center gap-3 mb-2"><span className="text-xs font-bold shrink-0 w-14" style={{ color: TEAL }}>{k.toUpperCase()}</span><span className="text-sm" style={{ color: '#D1D5DB' }}>{v}</span></div>)}
        </div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Talking Points</p>{REC_FB.talkingPoints.map(t => <div key={t} className="flex items-center gap-2 mb-2"><Check size={14} style={{ color: TEAL }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{t}</span></div>)}</div>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={Check} label="Create recovery tasks" onClick={() => onToast('Tasks created')} />
        <div><Lbl>Outreach Email Draft</Lbl><textarea style={{ ...INPUT, minHeight: 100 }} value={emailDraft} onChange={e => setEmailDraft(e.target.value)} /></div>
        <Act icon={Mail} label="Send outreach email" onClick={() => onToast('Email sent')} />
        <Act icon={Calendar} label="Book executive call" onClick={() => onToast('Call booked')} />
        <Act icon={Calendar} label="Set reminders" onClick={() => onToast('Reminders set')} />
        <Act icon={AlertTriangle} label="Flag to leadership" onClick={() => { onToast('Recovery plan activated'); onClose() }} />
      </div>}
    </Shell>
  )
}

// ─── 3. SendCheckInModal ───────────────────────────────────────────────────

const CHECKIN_FB = {
  subject: 'Your monthly Lumio check-in — here\'s what we\'ve seen',
  body: 'Hi [Name],\n\nHope you\'re having a great week! Just wanted to check in and share some highlights from your team\'s usage this month:\n\n- Your team logged in 142 times this month (up 18% from last month)\n- The HR onboarding workflow saved an estimated 6 hours\n- 3 new team members completed their setup\n\nIs there anything we can help with? I\'m always happy to jump on a quick call.\n\nBest,\n[Your name]'
}

export function SendCheckInModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [customer, setCustomer] = useState(''); const [type, setType] = useState('Monthly'); const [channel, setChannel] = useState('Email'); const [tone, setTone] = useState('Friendly'); const [points, setPoints] = useState('')
  const [subject, setSubject] = useState(CHECKIN_FB.subject); const [body, setBody] = useState(CHECKIN_FB.body)
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Send Check-in" labels={['Setup', 'Generate', 'Review', 'Send']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div><Lbl>Customer</Lbl><input style={INPUT} value={customer} onChange={e => setCustomer(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Check-in Type</Lbl><Sel value={type} onChange={setType} options={['Monthly', 'QBR', 'Health check', 'Feature update', 'Just checking in']} /></div><div><Lbl>Channel</Lbl><Sel value={channel} onChange={setChannel} options={['Email', 'Slack', 'Teams', 'Phone', 'In person']} /></div></div>
        <div><Lbl>Tone</Lbl><Sel value={tone} onChange={setTone} options={['Formal', 'Friendly', 'Urgent']} /></div>
        <div><Lbl>Key Points</Lbl><textarea style={{ ...INPUT, minHeight: 60 }} value={points} onChange={e => setPoints(e.target.value)} /></div>
        <Btn label="Generate Check-in →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Personalising message...', 'Adding product updates...', 'Including usage highlights...']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <div><Lbl>Subject</Lbl><input style={INPUT} value={subject} onChange={e => setSubject(e.target.value)} /></div>
        <div><Lbl>Body</Lbl><textarea style={{ ...INPUT, minHeight: 180 }} value={body} onChange={e => setBody(e.target.value)} /></div>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={Mail} label="Send now" onClick={() => { onToast('Check-in sent'); onClose() }} />
        <Act icon={Calendar} label="Schedule send" onClick={() => onToast('Scheduled')} />
        <Act icon={Check} label="Track opens" onClick={() => onToast('Tracking enabled')} />
        <Act icon={FileText} label="Log in CRM" onClick={() => onToast('Logged in CRM')} />
      </div>}
    </Shell>
  )
}

// ─── 4. UsageReportModal ───────────────────────────────────────────────────

const USAGE_FB = {
  topCustomers: ['Oakridge Schools — 142 logins', 'Greenfield Academy — 128 logins', 'Apex Consulting — 96 logins'],
  bottomCustomers: ['Crestline Capital — 3 logins', 'Whitestone College — 8 logins'],
  topFeatures: ['Morning Briefing — 89% adoption', 'Quick Actions — 76% adoption', 'CRM Pipeline — 71% adoption'],
  recommendations: ['Increase Crestline engagement — schedule product training', 'Promote voice commands — only 23% adoption rate', 'Launch feature spotlight email for underused modules']
}

export function UsageReportModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [scope, setScope] = useState('All'); const [dateFrom, setDateFrom] = useState(''); const [dateTo, setDateTo] = useState(''); const [format, setFormat] = useState('Executive'); const [audience, setAudience] = useState('Internal')
  const [metrics, setMetrics] = useState({ login: true, feature: true, voice: false, briefing: true, quick: true, time: true })
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Usage Report" labels={['Setup', 'Generate', 'Review', 'Export']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div><Lbl>Scope</Lbl><Sel value={scope} onChange={setScope} options={['All', 'Single', 'By plan', 'By cohort']} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Date From</Lbl><input type="date" style={INPUT} value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div><div><Lbl>Date To</Lbl><input type="date" style={INPUT} value={dateTo} onChange={e => setDateTo(e.target.value)} /></div></div>
        <div><Lbl>Metrics</Lbl>
          <div className="flex flex-col gap-2 mt-1">
            <Chk label="Login frequency" checked={metrics.login} onChange={v => setMetrics(p => ({ ...p, login: v }))} />
            <Chk label="Feature adoption" checked={metrics.feature} onChange={v => setMetrics(p => ({ ...p, feature: v }))} />
            <Chk label="Voice commands" checked={metrics.voice} onChange={v => setMetrics(p => ({ ...p, voice: v }))} />
            <Chk label="Briefing plays" checked={metrics.briefing} onChange={v => setMetrics(p => ({ ...p, briefing: v }))} />
            <Chk label="Quick actions" checked={metrics.quick} onChange={v => setMetrics(p => ({ ...p, quick: v }))} />
            <Chk label="Time saved" checked={metrics.time} onChange={v => setMetrics(p => ({ ...p, time: v }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Format</Lbl><Sel value={format} onChange={setFormat} options={['Executive', 'Detailed', 'CSV']} /></div><div><Lbl>Audience</Lbl><Sel value={audience} onChange={setAudience} options={['Internal', 'Customer', 'Board']} /></div></div>
        <Btn label="Generate Report →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Aggregating data...', 'Calculating scores...', 'Writing insights...']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Top Customers</p>{USAGE_FB.topCustomers.map(c => <div key={c} className="flex items-center gap-2 mb-2"><Check size={14} style={{ color: '#10B981' }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{c}</span></div>)}</div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>At-Risk Usage</p>{USAGE_FB.bottomCustomers.map(c => <div key={c} className="flex items-center gap-2 mb-2"><AlertTriangle size={14} style={{ color: '#EF4444' }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{c}</span></div>)}</div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Feature Adoption</p>{USAGE_FB.topFeatures.map(f => <div key={f} className="flex items-center gap-2 mb-2"><ArrowRight size={12} style={{ color: TEAL }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{f}</span></div>)}</div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Recommendations</p>{USAGE_FB.recommendations.map(r => <Card key={r}><p className="text-sm" style={{ color: '#D1D5DB' }}>{r}</p></Card>)}</div>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={FileText} label="Download PDF" onClick={() => onToast('PDF downloaded')} />
        <Act icon={FileText} label="Download CSV" onClick={() => onToast('CSV downloaded')} />
        <Act icon={Mail} label="Email to leadership" onClick={() => onToast('Emailed')} />
        <Act icon={Check} label="Share with customers" onClick={() => onToast('Shared')} />
        <Act icon={Calendar} label="Schedule recurring" onClick={() => { onToast('Report exported'); onClose() }} />
      </div>}
    </Shell>
  )
}

// ─── 5. HealthReportModal ──────────────────────────────────────────────────

const HEALTH_FB = {
  score: 78, npsAvg: 42, renewalRisk: '2 accounts in next 30 days',
  expansionOpps: ['Oakridge — ready for Enterprise upgrade', 'Greenfield — interested in Schools add-on'],
  atRisk: ['Crestline Capital', 'Whitestone College'],
  successStories: ['Apex saved £42k in first year', 'Bramble Hill automated 23 workflows']
}

export function HealthReportModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [customer, setCustomer] = useState('All'); const [reportType, setReportType] = useState('Portfolio health'); const [dateFrom, setDateFrom] = useState(''); const [dateTo, setDateTo] = useState('')
  const [inc, setInc] = useState({ nps: true, usage: true, support: true, renewal: true, expansion: true, roi: true })
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Health Report" labels={['Setup', 'Generate', 'Review', 'Export']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Customer</Lbl><Sel value={customer} onChange={setCustomer} options={['All', 'Specific']} /></div><div><Lbl>Report Type</Lbl><Sel value={reportType} onChange={setReportType} options={['Portfolio health', 'Individual scorecard', 'Pre-renewal', 'Board update']} /></div></div>
        <div><Lbl>Include</Lbl>
          <div className="flex flex-col gap-2 mt-1">
            <Chk label="NPS" checked={inc.nps} onChange={v => setInc(p => ({ ...p, nps: v }))} />
            <Chk label="Usage" checked={inc.usage} onChange={v => setInc(p => ({ ...p, usage: v }))} />
            <Chk label="Support" checked={inc.support} onChange={v => setInc(p => ({ ...p, support: v }))} />
            <Chk label="Renewal risk" checked={inc.renewal} onChange={v => setInc(p => ({ ...p, renewal: v }))} />
            <Chk label="Expansion" checked={inc.expansion} onChange={v => setInc(p => ({ ...p, expansion: v }))} />
            <Chk label="ROI" checked={inc.roi} onChange={v => setInc(p => ({ ...p, roi: v }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Date From</Lbl><input type="date" style={INPUT} value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div><div><Lbl>Date To</Lbl><input type="date" style={INPUT} value={dateTo} onChange={e => setDateTo(e.target.value)} /></div></div>
        <Btn label="Generate Report →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Scoring dimensions...', 'Writing narrative...', 'Identifying opportunities...']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3"><Stat label="Health Score" value={`${HEALTH_FB.score}/100`} /><Stat label="NPS Avg" value={String(HEALTH_FB.npsAvg)} /><Stat label="Renewal Risk" value="2" /></div>
        <Card><p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Renewal Risk</p><p className="text-sm" style={{ color: '#F59E0B' }}>{HEALTH_FB.renewalRisk}</p></Card>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Expansion Opportunities</p>{HEALTH_FB.expansionOpps.map(o => <div key={o} className="flex items-center gap-2 mb-2"><ArrowRight size={12} style={{ color: TEAL }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{o}</span></div>)}</div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>At-Risk Accounts</p>{HEALTH_FB.atRisk.map(a => <div key={a} className="flex items-center gap-2 mb-2"><AlertTriangle size={14} style={{ color: '#EF4444' }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{a}</span></div>)}</div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Success Stories</p>{HEALTH_FB.successStories.map(s => <div key={s} className="flex items-center gap-2 mb-2"><Check size={14} style={{ color: '#10B981' }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{s}</span></div>)}</div>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={FileText} label="Download PDF" onClick={() => onToast('PDF downloaded')} />
        <Act icon={Mail} label="Email leadership" onClick={() => onToast('Emailed')} />
        <Act icon={Mail} label="Share with board" onClick={() => onToast('Shared with board')} />
        <Act icon={Copy} label="Customer-facing version" onClick={() => { onToast('Health report generated'); onClose() }} />
      </div>}
    </Shell>
  )
}

// ─── 6. AtRiskReportModal ──────────────────────────────────────────────────

const ATRISK_FB = {
  totalARR: 148000, redCount: 2, amberCount: 3, renewals30: 1, avgScore: 42,
  accounts: [
    { company: 'Crestline Capital', arr: 148000, rag: 'red', score: 31, risk: 'No login 31 days', renewal: '15 days', lastContact: '28 days ago', owner: 'Charlotte D.', urgency: 'Act today', actions: ['Book executive call this week', 'Send personalised ROI report', 'Escalate to leadership if no response in 5 days'] },
    { company: 'Whitestone College', arr: 42000, rag: 'red', score: 38, risk: '3 open support tickets', renewal: '30 days', lastContact: '14 days ago', owner: 'Tom R.', urgency: 'Act today', actions: ['Resolve open tickets within 48 hours', 'Schedule technical review', 'Offer extended support package'] },
    { company: 'Bramble Hill Trust', arr: 84000, rag: 'amber', score: 62, risk: 'Declining usage', renewal: '45 days', lastContact: '7 days ago', owner: 'Charlotte D.', urgency: 'Act this week', actions: ['Schedule product training session', 'Share new feature highlights', 'Discuss renewal terms early'] }
  ]
}

export function AtRiskReportModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [threshold, setThreshold] = useState('All amber+red'); const [sortBy, setSortBy] = useState('ARR highest')
  const [inc, setInc] = useState({ summary: true, risk: true, usage: true, support: true, nps: true, renewal: true, actions: true, owner: true })
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="At-Risk Report" labels={['Setup', 'Analyse', 'Review', 'Actions']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Risk Threshold</Lbl><Sel value={threshold} onChange={setThreshold} options={['All amber+red', 'Red only', 'Renewal within 60 days', 'All']} /></div><div><Lbl>Sort By</Lbl><Sel value={sortBy} onChange={setSortBy} options={['ARR highest', 'Renewal soonest', 'Days since contact', 'Score lowest']} /></div></div>
        <div><Lbl>Include</Lbl>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Chk label="Account summary" checked={inc.summary} onChange={v => setInc(p => ({ ...p, summary: v }))} />
            <Chk label="Risk breakdown" checked={inc.risk} onChange={v => setInc(p => ({ ...p, risk: v }))} />
            <Chk label="Usage trends" checked={inc.usage} onChange={v => setInc(p => ({ ...p, usage: v }))} />
            <Chk label="Support tickets" checked={inc.support} onChange={v => setInc(p => ({ ...p, support: v }))} />
            <Chk label="NPS" checked={inc.nps} onChange={v => setInc(p => ({ ...p, nps: v }))} />
            <Chk label="Renewal timeline" checked={inc.renewal} onChange={v => setInc(p => ({ ...p, renewal: v }))} />
            <Chk label="Recommended actions" checked={inc.actions} onChange={v => setInc(p => ({ ...p, actions: v }))} />
            <Chk label="Owner" checked={inc.owner} onChange={v => setInc(p => ({ ...p, owner: v }))} />
          </div>
        </div>
        <Btn label="Generate At-Risk Report →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Scoring risk levels...', 'Analysing patterns...', 'Writing action plans...']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <div className="grid grid-cols-5 gap-2">
          <Stat label="Total ARR" value={`£${(ATRISK_FB.totalARR / 1000).toFixed(0)}k`} />
          <Stat label="Red" value={String(ATRISK_FB.redCount)} />
          <Stat label="Amber" value={String(ATRISK_FB.amberCount)} />
          <Stat label="Renew 30d" value={String(ATRISK_FB.renewals30)} />
          <Stat label="Avg Score" value={String(ATRISK_FB.avgScore)} />
        </div>
        {ATRISK_FB.accounts.map(a => (
          <Card key={a.company} amber={a.rag === 'amber'}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{a.company}</span>
              <div className="flex items-center gap-2"><RAGBadge rag={a.rag} /><ScoreBadge score={a.score} /></div>
            </div>
            <div className="grid grid-cols-2 gap-1 mb-2">
              <p className="text-xs" style={{ color: '#9CA3AF' }}>ARR: <span style={{ color: '#F9FAFB' }}>£{(a.arr / 1000).toFixed(0)}k</span></p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Renewal: <span style={{ color: '#F9FAFB' }}>{a.renewal}</span></p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Last contact: <span style={{ color: '#F9FAFB' }}>{a.lastContact}</span></p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Owner: <span style={{ color: '#F9FAFB' }}>{a.owner}</span></p>
            </div>
            <p className="text-xs mb-2" style={{ color: '#EF4444' }}><AlertTriangle size={12} className="inline mr-1" />{a.risk}</p>
            <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: a.urgency === 'Act today' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: a.urgency === 'Act today' ? '#EF4444' : '#F59E0B' }}>{a.urgency}</span></div>
            {a.actions.map(act => <div key={act} className="flex items-center gap-2 mb-1"><ArrowRight size={10} style={{ color: TEAL }} /><span className="text-xs" style={{ color: '#D1D5DB' }}>{act}</span></div>)}
          </Card>
        ))}
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={FileText} label="Export PDF" onClick={() => onToast('PDF exported')} />
        <Act icon={Mail} label="Email leadership + CS team" onClick={() => onToast('Emailed')} />
        <Act icon={Check} label="Create tasks per account" onClick={() => onToast('Tasks created')} />
        <Act icon={Check} label="Assign owners" onClick={() => onToast('Owners assigned')} />
        <Act icon={Calendar} label="Set SLA reminders" onClick={() => onToast('SLA reminders set')} />
        <Act icon={Calendar} label="Schedule review meeting" onClick={() => { onToast('At-risk plan activated'); onClose() }} />
      </div>}
    </Shell>
  )
}
