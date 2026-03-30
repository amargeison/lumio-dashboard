'use client'
import { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Loader2, Copy, FileText, Mail, Calendar, Plus } from 'lucide-react'

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
function ScoreBadge({ score }: { score: number }) { const c = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'; return <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${c}20`, color: c }}>{score}%</span> }

function useAI(step: Step, delay = 3000) {
  const [done, setDone] = useState(false)
  useEffect(() => { setDone(false); if (step === 1) { const t = setTimeout(() => setDone(true), delay); return () => clearTimeout(t) } }, [step, delay])
  return done
}

// ─── 1. NewDealModal ────────────────────────────────────────────────────────

const DEAL_FB = { score: 87, actions: ['Schedule discovery call within 48 hours', 'Send company brochure and case study', 'Connect on LinkedIn and engage with recent posts'], risks: ['Budget cycle may not align — confirm fiscal year', 'Multiple stakeholders — identify decision maker early'], similar: 'Axon Technologies — £182k — Won in 4 weeks' }

export function NewDealModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [company, setCompany] = useState(''); const [contact, setContact] = useState(''); const [value, setValue] = useState(''); const [dealType, setDealType] = useState('New Business'); const [stage, setStage] = useState('Awareness'); const [closeDate, setCloseDate] = useState(''); const [source, setSource] = useState('Website'); const [notes, setNotes] = useState('')
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="New Deal" labels={['Details', 'Research', 'Insights', 'Actions']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Company</Lbl><input style={INPUT} value={company} onChange={e => setCompany(e.target.value)} /></div><div><Lbl>Contact Name</Lbl><input style={INPUT} value={contact} onChange={e => setContact(e.target.value)} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Deal Value £</Lbl><input style={INPUT} value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 50000" /></div><div><Lbl>Deal Type</Lbl><Sel value={dealType} onChange={setDealType} options={['New Business','Upsell','Renewal','Partnership','Referral']} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Stage</Lbl><Sel value={stage} onChange={setStage} options={['Awareness','Discovery','Proposal','Negotiation','Verbal Yes','Closed Won']} /></div><div><Lbl>Expected Close</Lbl><input type="date" style={INPUT} value={closeDate} onChange={e => setCloseDate(e.target.value)} /></div></div>
        <div><Lbl>Source</Lbl><Sel value={source} onChange={setSource} options={['Website','Referral','LinkedIn','Cold Outreach','Event','Partner','Other']} /></div>
        <div><Lbl>Notes</Lbl><textarea style={{ ...INPUT, minHeight: 60 }} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <Btn label="Set Up Deal →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Researching company…', 'Identifying contacts…', 'Suggesting actions…']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <Card><div className="flex items-center justify-between"><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Deal Score</span><ScoreBadge score={DEAL_FB.score} /></div></Card>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Recommended Actions</p>{DEAL_FB.actions.map(a => <div key={a} className="flex items-center gap-2 mb-2"><Check size={14} style={{ color: TEAL }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{a}</span></div>)}</div>
        {DEAL_FB.risks.map(r => <Card key={r} amber><p className="text-sm" style={{ color: '#F59E0B' }}>{r}</p></Card>)}
        <Card><p className="text-xs" style={{ color: '#9CA3AF' }}>Similar Deal</p><p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{DEAL_FB.similar}</p></Card>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={Plus} label="Add to pipeline" onClick={() => { onToast('Deal created ✅'); onClose() }} />
        <Act icon={Calendar} label="Assign to team" onClick={() => onToast('Assigned')} />
        <Act icon={Calendar} label="Set follow-up" onClick={() => onToast('Follow-up set')} />
        <Act icon={FileText} label="Create proposal draft" onClick={() => onToast('Proposal draft created')} />
      </div>}
    </Shell>
  )
}

// ─── 2. BookDemoModal ───────────────────────────────────────────────────────

const DEMO_FB = { agenda: ['0:00 — Welcome & context setting', '0:05 — Discovery questions', '0:15 — Tailored platform demo', '0:30 — Q&A and next steps'], talkingPoints: ['ROI: Average 10+ hours saved per week', 'Integrations: 50+ native connectors', 'Security: SOC 2, GDPR compliant, UK data centres'], objections: ["'Too expensive' → Show ROI calculator, break down cost per user per day", "'We already have tools' → Show consolidation benefit, single source of truth", "'Need IT approval' → Offer technical deep dive session with their IT team"] }

export function BookDemoModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [company, setCompany] = useState(''); const [contact, setContact] = useState(''); const [email, setEmail] = useState(''); const [demoType, setDemoType] = useState('Discovery'); const [datetime, setDatetime] = useState(''); const [platform, setPlatform] = useState('Zoom'); const [duration, setDuration] = useState('30'); const [priorities, setPriorities] = useState<string[]>([])
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])
  const togglePri = (p: string) => setPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Book Demo" labels={['Setup', 'Prepare', 'Review', 'Confirm']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Prospect Company</Lbl><input style={INPUT} value={company} onChange={e => setCompany(e.target.value)} /></div><div><Lbl>Contact Name</Lbl><input style={INPUT} value={contact} onChange={e => setContact(e.target.value)} /></div></div>
        <div><Lbl>Contact Email</Lbl><input style={INPUT} value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Demo Type</Lbl><Sel value={demoType} onChange={setDemoType} options={['Discovery','Full Demo','Technical','Executive','POC']} /></div><div><Lbl>Platform</Lbl><Sel value={platform} onChange={setPlatform} options={['Zoom','Teams','Meet','In Person']} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Date & Time</Lbl><input type="datetime-local" style={INPUT} value={datetime} onChange={e => setDatetime(e.target.value)} /></div><div><Lbl>Duration</Lbl><Sel value={duration} onChange={setDuration} options={['30','45','60','90']} /></div></div>
        <div><Lbl>Priorities</Lbl><div className="flex flex-wrap gap-2">{['ROI','Ease of use','Integrations','Security','Support','Pricing'].map(p => <button key={p} onClick={() => togglePri(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: priorities.includes(p) ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${priorities.includes(p) ? TEAL : '#374151'}`, color: priorities.includes(p) ? TEAL : '#9CA3AF' }}>{p}</button>)}</div></div>
        <Btn label="Prepare Demo →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Building agenda…', 'Identifying talking points…', 'Preparing objection handlers…']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Agenda</p>{DEMO_FB.agenda.map(a => <div key={a} className="flex items-center gap-2 mb-2"><ArrowRight size={12} style={{ color: TEAL }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{a}</span></div>)}</div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Talking Points</p>{DEMO_FB.talkingPoints.map(t => <div key={t} className="flex items-center gap-2 mb-2"><Check size={14} style={{ color: TEAL }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{t}</span></div>)}</div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Objection Handlers</p>{DEMO_FB.objections.map(o => <Card key={o}><p className="text-sm" style={{ color: '#D1D5DB' }}>{o}</p></Card>)}</div>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={Calendar} label="Send calendar invite" onClick={() => { onToast('Demo booked ✅'); onClose() }} />
        <Act icon={Mail} label="Send confirmation email" onClick={() => onToast('Email sent')} />
        <Act icon={Plus} label="Add to CRM" onClick={() => onToast('Added to CRM')} />
        <Act icon={Copy} label="Share prep with team" onClick={() => onToast('Shared')} />
      </div>}
    </Shell>
  )
}

// ─── 3. SendProposalModal ───────────────────────────────────────────────────

const PROP_FB = { summary: 'Lumio will consolidate your 6 existing tools into one platform, saving your team an estimated 12 hours per week and reducing operational costs by 34%.', challenge: 'Manual processes across disconnected systems are costing time and creating data silos.', pricing: 'Growth Plan — £1,199/month (annual billing)', roi: { timeSaved: '12 hrs/week', costSaved: '£28,800/year', payback: '3.2 months' } }

export function SendProposalModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [company, setCompany] = useState(''); const [contact, setContact] = useState(''); const [title, setTitle] = useState(''); const [value, setValue] = useState(''); const [plan, setPlan] = useState('Growth £1,199/mo'); const [contract, setContract] = useState('Annual'); const [pains, setPains] = useState(''); const [special, setSpecial] = useState(false); const [specialText, setSpecialText] = useState(''); const [caseStudies, setCaseStudies] = useState(false)
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Send Proposal" labels={['Details', 'Generate', 'Review', 'Send']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Company</Lbl><input style={INPUT} value={company} onChange={e => setCompany(e.target.value)} /></div><div><Lbl>Contact + Title</Lbl><input style={INPUT} value={contact} onChange={e => setContact(e.target.value)} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Deal Value £</Lbl><input style={INPUT} value={value} onChange={e => setValue(e.target.value)} /></div><div><Lbl>Plan</Lbl><Sel value={plan} onChange={setPlan} options={['Starter £599/mo','Growth £1,199/mo','Enterprise £2,499/mo','Custom']} /></div></div>
        <div><Lbl>Contract Length</Lbl><Sel value={contract} onChange={setContract} options={['Monthly','Annual','2 Year']} /></div>
        <div><Lbl>Pain Points</Lbl><textarea style={{ ...INPUT, minHeight: 60 }} value={pains} onChange={e => setPains(e.target.value)} /></div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}><input type="checkbox" checked={special} onChange={e => setSpecial(e.target.checked)} /> Special terms</label>
          <label className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}><input type="checkbox" checked={caseStudies} onChange={e => setCaseStudies(e.target.checked)} /> Include case studies</label>
        </div>
        {special && <div><Lbl>Special Terms</Lbl><textarea style={{ ...INPUT, minHeight: 50 }} value={specialText} onChange={e => setSpecialText(e.target.value)} /></div>}
        <Btn label="Generate Proposal →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Personalising summary…', 'Building business case…', 'Calculating ROI…']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <Card><p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Executive Summary</p><p className="text-sm" style={{ color: '#D1D5DB' }}>{PROP_FB.summary}</p></Card>
        <Card><p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Challenge</p><p className="text-sm" style={{ color: '#D1D5DB' }}>{PROP_FB.challenge}</p></Card>
        <Card><p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Pricing</p><p className="text-sm font-bold" style={{ color: TEAL }}>{PROP_FB.pricing}</p></Card>
        <div className="grid grid-cols-3 gap-3"><Stat label="Time Saved" value={PROP_FB.roi.timeSaved} /><Stat label="Cost Saved" value={PROP_FB.roi.costSaved} /><Stat label="Payback" value={PROP_FB.roi.payback} /></div>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={FileText} label="Download PDF" onClick={() => { onToast('Proposal sent ✅'); onClose() }} />
        <Act icon={Mail} label="Send via email" onClick={() => onToast('Email sent')} />
        <Act icon={Copy} label="Share link" onClick={() => onToast('Link copied')} />
        <Act icon={Calendar} label="Set 3-day follow-up" onClick={() => onToast('Follow-up set')} />
      </div>}
    </Shell>
  )
}

// ─── 4. LogCallModal ────────────────────────────────────────────────────────

const CALL_FB = { summary: 'Positive discovery call with strong interest in the Growth plan. Main concern is integration with existing Xero setup. Agreed to send technical specs and schedule a follow-up demo next Tuesday.', sentiment: 'Positive', actions: ['Send Xero integration guide by EOD', 'Schedule follow-up demo for Tuesday', 'Loop in technical lead for integration questions'], followUpEmail: 'Hi [Name],\n\nGreat speaking with you today. As discussed, I\'m sending over our Xero integration guide and will set up the follow-up demo for next Tuesday.\n\nIn the meantime, please don\'t hesitate to reach out with any questions.\n\nBest,\n[Your name]' }

export function LogCallModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [contact, setContact] = useState(''); const [callType, setCallType] = useState('Discovery'); const [duration, setDuration] = useState('15 mins'); const [outcome, setOutcome] = useState('Positive'); const [datetime, setDatetime] = useState('')
  const [discussed, setDiscussed] = useState(''); const [objections, setObjections] = useState(''); const [commitments, setCommitments] = useState(''); const [nextStep, setNextStep] = useState(''); const [nextDate, setNextDate] = useState('')
  const [emailDraft, setEmailDraft] = useState(CALL_FB.followUpEmail)
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Log Call" labels={['Details', 'Notes', 'Summary', 'Actions']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div><Lbl>Company / Contact</Lbl><input style={INPUT} value={contact} onChange={e => setContact(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Call Type</Lbl><Sel value={callType} onChange={setCallType} options={['Discovery','Follow-up','Demo','Negotiation','Objection','Closing','Check-in']} /></div><div><Lbl>Duration</Lbl><Sel value={duration} onChange={setDuration} options={['5 mins','10 mins','15 mins','30 mins','45 mins','60 mins']} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Outcome</Lbl><Sel value={outcome} onChange={setOutcome} options={['Positive','Neutral','Negative','No answer','Voicemail']} /></div><div><Lbl>Date & Time</Lbl><input type="datetime-local" style={INPUT} value={datetime} onChange={e => setDatetime(e.target.value)} /></div></div>
        <Btn label="Log Notes →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <div className="flex flex-col gap-3">
        <div><Lbl>What was discussed?</Lbl><textarea style={{ ...INPUT, minHeight: 80 }} value={discussed} onChange={e => setDiscussed(e.target.value)} /></div>
        <div><Lbl>Key Objections (optional)</Lbl><textarea style={{ ...INPUT, minHeight: 50 }} value={objections} onChange={e => setObjections(e.target.value)} /></div>
        <div><Lbl>Commitments Made</Lbl><textarea style={{ ...INPUT, minHeight: 50 }} value={commitments} onChange={e => setCommitments(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Next Step</Lbl><input style={INPUT} value={nextStep} onChange={e => setNextStep(e.target.value)} /></div><div><Lbl>Next Step Date</Lbl><input type="date" style={INPUT} value={nextDate} onChange={e => setNextDate(e.target.value)} /></div></div>
        <Btn label="Generate Summary →" onClick={() => { setStep(2) }} />
      </div>}
      {step === 2 && <div className="flex flex-col gap-4">
        <Card><p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>AI Summary</p><p className="text-sm" style={{ color: '#D1D5DB' }}>{CALL_FB.summary}</p></Card>
        <div className="flex items-center gap-2"><span className="text-xs" style={{ color: '#9CA3AF' }}>Sentiment:</span><span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>{CALL_FB.sentiment}</span></div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Next Actions</p>{CALL_FB.actions.map(a => <div key={a} className="flex items-center gap-2 mb-2"><Check size={14} style={{ color: TEAL }} /><span className="text-sm" style={{ color: '#D1D5DB' }}>{a}</span></div>)}</div>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={Check} label="Save call log" onClick={() => { onToast('Call logged ✅'); onClose() }} />
        <div><Lbl>Follow-up Email Draft</Lbl><textarea style={{ ...INPUT, minHeight: 100 }} value={emailDraft} onChange={e => setEmailDraft(e.target.value)} /></div>
        <Act icon={Mail} label="Send follow-up email" onClick={() => onToast('Email sent')} />
        <Act icon={Calendar} label="Set reminder" onClick={() => onToast('Reminder set')} />
        <Act icon={ArrowRight} label="Update deal stage" onClick={() => onToast('Stage updated')} />
      </div>}
    </Shell>
  )
}

// ─── 5. NewLeadModal ────────────────────────────────────────────────────────

const LEAD_FB = { score: 78, approach: 'Warm outreach — company shows active hiring and recently posted about automation challenges', firstMessage: "Hi [Name],\n\nI noticed [Company] is scaling rapidly — congratulations! Many teams at your stage find that manual processes start breaking down around the 50-person mark.\n\nWe built Lumio specifically for this moment. Would you be open to a quick 15-minute call to see if it could help?\n\nBest,\n[Your name]", similarWins: ['Similar to Meridian Group (£94k, Won)'] }

export function NewLeadModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState(''); const [jobTitle, setJobTitle] = useState(''); const [company, setCompany] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState(''); const [linkedin, setLinkedin] = useState(''); const [source, setSource] = useState('Website'); const [industry, setIndustry] = useState('Education'); const [size, setSize] = useState('11-50'); const [budget, setBudget] = useState('Unknown')
  const [msg, setMsg] = useState(LEAD_FB.firstMessage)
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="New Lead" labels={['Details', 'Research', 'Profile', 'Actions']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Full Name</Lbl><input style={INPUT} value={name} onChange={e => setName(e.target.value)} /></div><div><Lbl>Job Title</Lbl><input style={INPUT} value={jobTitle} onChange={e => setJobTitle(e.target.value)} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Company</Lbl><input style={INPUT} value={company} onChange={e => setCompany(e.target.value)} /></div><div><Lbl>Email</Lbl><input style={INPUT} value={email} onChange={e => setEmail(e.target.value)} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Phone (optional)</Lbl><input style={INPUT} value={phone} onChange={e => setPhone(e.target.value)} /></div><div><Lbl>LinkedIn URL (optional)</Lbl><input style={INPUT} value={linkedin} onChange={e => setLinkedin(e.target.value)} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Source</Lbl><Sel value={source} onChange={setSource} options={['Website','Referral','LinkedIn','Cold Outreach','Event','Partner','Other']} /></div><div><Lbl>Industry</Lbl><Sel value={industry} onChange={setIndustry} options={['Education','Finance','Healthcare','Tech','Professional Services','Retail','Manufacturing','Other']} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>Company Size</Lbl><Sel value={size} onChange={setSize} options={['1-10','11-50','51-200','201-500','500+']} /></div><div><Lbl>Budget</Lbl><Sel value={budget} onChange={setBudget} options={['Under £500/mo','£500-1k','£1k-2.5k','£2.5k+','Unknown']} /></div></div>
        <Btn label="Research Lead →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Looking up company…', 'Checking buying signals…', 'Scoring lead…']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3"><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Lead Score</span><ScoreBadge score={LEAD_FB.score} /></div>
        <Card><p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Approach</p><p className="text-sm" style={{ color: '#D1D5DB' }}>{LEAD_FB.approach}</p></Card>
        <div><Lbl>Suggested First Message</Lbl><textarea style={{ ...INPUT, minHeight: 120 }} value={msg} onChange={e => setMsg(e.target.value)} /></div>
        {LEAD_FB.similarWins.map(w => <Card key={w}><p className="text-sm" style={{ color: '#D1D5DB' }}>{w}</p></Card>)}
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={Plus} label="Add to CRM" onClick={() => { onToast('Lead added ✅'); onClose() }} />
        <Act icon={Calendar} label="Assign owner" onClick={() => onToast('Owner assigned')} />
        <Act icon={Calendar} label="Set outreach reminder" onClick={() => onToast('Reminder set')} />
        <Act icon={Mail} label="Send first message" onClick={() => onToast('Message sent')} />
      </div>}
    </Shell>
  )
}

// ─── 6. DeptInsightsModal ───────────────────────────────────────────────────

const INSIGHTS_FB = { summary: 'Pipeline is healthy with £775k in active deals. Win rate improved 3% this month. 2 deals at risk of slipping — Crestline Capital (31 days stalled) and FluxCore (low engagement).', metrics: [{ label: 'Pipeline Value', value: '£775k' }, { label: 'Win Rate', value: '34%' }, { label: 'Avg Deal Size', value: '£94k' }, { label: 'Deals at Risk', value: '2' }] }

export function DeptInsightsModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [reportType, setReportType] = useState('Pipeline Health'); const [dateFrom, setDateFrom] = useState(''); const [dateTo, setDateTo] = useState(''); const [member, setMember] = useState('All')
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Department Insights" labels={['Configure', 'Analyse', 'Results', 'Export']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div><Lbl>Report Type</Lbl><Sel value={reportType} onChange={setReportType} options={['Pipeline Health','Win/Loss Analysis','Team Performance','Forecast','Activity Summary']} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Lbl>From</Lbl><input type="date" style={INPUT} value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div><div><Lbl>To</Lbl><input type="date" style={INPUT} value={dateTo} onChange={e => setDateTo(e.target.value)} /></div></div>
        <div><Lbl>Team Member</Lbl><Sel value={member} onChange={setMember} options={['All','Sarah Chen','Marcus Webb','Tom Wright','Priya Nair']} /></div>
        <Btn label="Generate Insights →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Analysing pipeline…', 'Calculating metrics…', 'Writing insights…']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-4">
        <Card><p className="text-sm" style={{ color: '#D1D5DB' }}>{INSIGHTS_FB.summary}</p></Card>
        <div className="grid grid-cols-2 gap-3">{INSIGHTS_FB.metrics.map(m => <Stat key={m.label} label={m.label} value={m.value} />)}</div>
        <Card amber><p className="text-sm" style={{ color: '#F59E0B' }}>At Risk: Crestline Capital (31 days stalled)</p></Card>
        <Card amber><p className="text-sm" style={{ color: '#F59E0B' }}>At Risk: FluxCore (low engagement)</p></Card>
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={FileText} label="Download PDF" onClick={() => { onToast('Insights exported'); onClose() }} />
        <Act icon={Mail} label="Email to team" onClick={() => onToast('Email sent')} />
        <Act icon={Copy} label="Save to reports" onClick={() => onToast('Saved')} />
      </div>}
    </Shell>
  )
}

// ─── 7. GenerateLeadsModal ──────────────────────────────────────────────────

const DEMO_LEADS = [
  { company: 'Meridian Trust', contact: 'Sarah Chen', title: 'VP Operations', industry: 'Education', size: '51-200', score: 92, reason: 'Recently posted about needing better reporting tools' },
  { company: 'Apex Consulting', contact: 'Marcus Webb', title: 'CEO', industry: 'Professional Services', size: '11-50', score: 88, reason: 'Active hiring suggests rapid growth phase' },
  { company: 'Greenfield Academy', contact: 'Tom Wright', title: 'Operations Director', industry: 'Education', size: '201-500', score: 85, reason: 'Multiple job posts mention process improvement' },
  { company: 'FluxCore Ltd', contact: 'Priya Nair', title: 'Head of Ops', industry: 'Tech', size: '51-200', score: 82, reason: 'Engaged with automation content on LinkedIn' },
  { company: 'Bramble Hill Trust', contact: 'Helen Park', title: 'Business Manager', industry: 'Education', size: '201-500', score: 79, reason: 'Current tools contract expiring Q2' },
  { company: 'Crestview Solutions', contact: 'Dan Marsh', title: 'CTO', industry: 'Tech', size: '11-50', score: 76, reason: 'Posted about consolidating tech stack' },
  { company: 'Sunfield Group', contact: 'Rachel Davies', title: 'COO', industry: 'Finance', size: '51-200', score: 74, reason: 'Compliance requirements driving platform search' },
  { company: 'Oakridge Schools', contact: 'James Harlow', title: 'Deputy Head', industry: 'Education', size: '201-500', score: 71, reason: 'Attended webinar on school automation' },
  { company: 'Whitestone Consulting', contact: 'Oliver Bennett', title: 'Managing Partner', industry: 'Professional Services', size: '11-50', score: 68, reason: 'Competitor customer with contract renewal due' },
  { company: 'Riverside Education', contact: 'Amara Diallo', title: 'Head of IT', industry: 'Education', size: '51-200', score: 65, reason: 'IT modernisation initiative announced' },
]

export function GenerateLeadsModal({ onClose, onToast }: P) {
  const [step, setStep] = useState<Step>(0)
  const [industries, setIndustries] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [geo, setGeo] = useState('UK only'); const [titles, setTitles] = useState(''); const [pains, setPains] = useState<string[]>([]); const [count, setCount] = useState('25')
  const [added, setAdded] = useState<Set<number>>(new Set())
  const ai = useAI(step)
  useEffect(() => { if (ai && step === 1) setStep(2) }, [ai, step])
  const toggleArr = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  const ChkGroup = ({ items, selected, toggle }: { items: string[]; selected: string[]; toggle: (v: string) => void }) => <div className="flex flex-wrap gap-2">{items.map(i => <button key={i} onClick={() => toggle(i)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: selected.includes(i) ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${selected.includes(i) ? TEAL : '#374151'}`, color: selected.includes(i) ? TEAL : '#9CA3AF' }}>{i}</button>)}</div>

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Generate Leads" labels={['Criteria', 'Search', 'Results', 'Actions']}>
      {step === 0 && <div className="flex flex-col gap-3">
        <div><Lbl>Industry</Lbl><ChkGroup items={['Education','Finance','Healthcare','Tech','Professional Services','Retail','Manufacturing','Other']} selected={industries} toggle={v => toggleArr(industries, setIndustries, v)} /></div>
        <div><Lbl>Company Size</Lbl><ChkGroup items={['1-10','11-50','51-200','201-500','500+']} selected={sizes} toggle={v => toggleArr(sizes, setSizes, v)} /></div>
        <div><Lbl>Geography</Lbl><Sel value={geo} onChange={setGeo} options={['UK only','London','UK+Ireland','All English speaking']} /></div>
        <div><Lbl>Job Titles</Lbl><textarea style={{ ...INPUT, minHeight: 50 }} value={titles} onChange={e => setTitles(e.target.value)} placeholder="e.g. CEO, COO, Head of Ops" /></div>
        <div><Lbl>Pain Points</Lbl><ChkGroup items={['Too much admin','No unified platform','Poor reporting','Manual processes','Compliance']} selected={pains} toggle={v => toggleArr(pains, setPains, v)} /></div>
        <div><Lbl>How Many</Lbl><Sel value={count} onChange={setCount} options={['10','25','50','100']} /></div>
        <Btn label="Find Leads →" onClick={() => setStep(1)} />
      </div>}
      {step === 1 && <Gen items={['Matching your ICP…', 'Identifying intent signals…', 'Building prospect list…']} done={false} />}
      {step === 2 && <div className="flex flex-col gap-3">
        {DEMO_LEADS.map((l, i) => (
          <div key={l.company} className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{l.company}</span><ScoreBadge score={l.score} /></div>
            <p className="text-xs" style={{ color: '#D1D5DB' }}>{l.contact} · {l.title}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>{l.industry} · {l.size} employees</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{l.reason}</p>
            <button onClick={() => { setAdded(prev => new Set(prev).add(i)); onToast(`${l.company} added`) }} className="mt-2 px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: added.has(i) ? '#1F2937' : 'rgba(13,148,136,0.15)', border: `1px solid ${TEAL}`, color: TEAL }}>{added.has(i) ? 'Added ✓' : 'Add to pipeline'}</button>
          </div>
        ))}
        <Btn label="Continue →" onClick={() => setStep(3)} />
      </div>}
      {step === 3 && <div className="flex flex-col gap-3">
        <Act icon={Plus} label="Add all to CRM" onClick={() => { onToast(`${DEMO_LEADS.length} leads added to pipeline ✅`); onClose() }} />
        <Act icon={FileText} label="Download CSV" onClick={() => onToast('CSV downloaded')} />
        <Act icon={Mail} label="Start outreach sequence" onClick={() => onToast('Outreach started')} />
      </div>}
    </Shell>
  )
}
