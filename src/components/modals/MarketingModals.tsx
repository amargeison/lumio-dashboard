'use client'
import { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, Check, Loader2, Copy, FileText, Share2, Mail, Calendar } from 'lucide-react'

type ModalProps = { onClose: () => void; onToast: (msg: string) => void }
type Step = 0 | 1 | 2 | 3

const INPUT_STYLE: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' }
const TEAL = '#0D9488'

// ─── Shared helpers ─────────────────────────────────────────────────────────

function StepIndicator({ step, labels }: { step: Step; labels: string[] }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
      {labels.map((l, i) => {
        const active = step === i; const done = step > i
        return (
          <div key={l} className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 24, height: 24, backgroundColor: done ? TEAL : active ? 'rgba(13,148,136,0.2)' : '#1F2937', color: done ? '#fff' : active ? TEAL : '#6B7280' }}>{done ? <Check size={12} /> : i + 1}</div>
            <span className="text-xs font-medium hidden sm:inline" style={{ color: active ? '#F9FAFB' : '#6B7280' }}>{l}</span>
            {i < labels.length - 1 && <ArrowRight size={12} style={{ color: '#374151' }} />}
          </div>
        )
      })}
    </div>
  )
}

function Shell({ onClose, step, setStep, title, stepLabels, children }: { onClose: () => void; step: Step; setStep: (s: Step) => void; title: string; stepLabels: string[]; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full flex flex-col rounded-2xl" style={{ maxWidth: 640, maxHeight: '90vh', backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>
        <StepIndicator step={step} labels={stepLabels} />
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={() => step > 0 ? setStep((step - 1) as Step) : onClose()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}><ArrowLeft size={14} />{step === 0 ? 'Cancel' : 'Back'}</button>
          {step === 1 && <span className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}><Loader2 size={14} className="animate-spin" /> Generating…</span>}
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{children}</label>
}

function TypeGrid({ items, selected, onSelect, cols = 4 }: { items: { label: string; icon: string }[]; selected: string; onSelect: (v: string) => void; cols?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {items.map(t => (
        <button key={t.label} onClick={() => onSelect(t.label)} className="flex flex-col items-center gap-1 rounded-xl p-3 text-center" style={{ backgroundColor: selected === t.label ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${selected === t.label ? TEAL : '#374151'}`, color: selected === t.label ? '#F9FAFB' : '#9CA3AF' }}>
          <span className="text-lg">{t.icon}</span>
          <span className="text-[11px] font-medium leading-tight">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick }: { icon: typeof Copy; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}>
      <Icon size={18} style={{ color: TEAL }} /><span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function GenChecklist({ items, done }: { items: string[]; done: boolean }) {
  return (
    <div className="flex flex-col gap-3 py-6">
      {items.map((t, i) => (
        <div key={t} className="flex items-center gap-3">
          {done || i < items.length - 1 ? <Check size={16} style={{ color: TEAL }} /> : <Loader2 size={16} className="animate-spin" style={{ color: TEAL }} />}
          <span className="text-sm" style={{ color: '#D1D5DB' }}>{t}</span>
        </div>
      ))}
    </div>
  )
}

function TealBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: TEAL, color: '#F9FAFB' }}>{label}</button>
}

function Badge({ text }: { text: string }) {
  return <span className="inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: TEAL }}>{text}</span>
}

// ─── 1. CreatePostModal ─────────────────────────────────────────────────────

const POST_TYPES = [
  { label: 'Social Media Post', icon: '📱' }, { label: 'Blog Article', icon: '📝' }, { label: 'Email Newsletter', icon: '📧' },
  { label: 'Twitter Thread', icon: '🐦' }, { label: 'LinkedIn Article', icon: '💼' }, { label: 'Instagram Caption', icon: '📸' },
  { label: 'Video Script', icon: '🎬' }, { label: 'Press Release', icon: '📰' }, { label: 'Other', icon: '✏️' },
]

const POST_FALLBACK = {
  headline: 'How Lumio is transforming UK business automation',
  body: "In a world where every minute counts, smart businesses are turning to AI-powered platforms to streamline their operations. Lumio connects your entire business — from HR and finance to sales and customer success — in one intelligent workspace.\n\nWith 150+ pre-built workflows, real-time dashboards, and an AI assistant that learns your business, Lumio helps teams save 10+ hours per week.\n\nReady to see it in action?",
  hashtags: '#AI #Automation #BusinessGrowth #Lumio',
  cta: 'Start your free trial today →',
}

export function CreatePostModal({ onClose, onToast }: ModalProps) {
  const [step, setStep] = useState<Step>(0)
  const [postType, setPostType] = useState('')
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('Prospects')
  const [tone, setTone] = useState('Professional')
  const [keyMsg, setKeyMsg] = useState('')
  const [includeCta, setIncludeCta] = useState(false)
  const [ctaText, setCtaText] = useState('')
  const [wordCount, setWordCount] = useState('Medium 150-300')
  const [content, setContent] = useState(POST_FALLBACK)
  const [editing, setEditing] = useState(false)

  useEffect(() => { if (step === 1) { const t = setTimeout(() => { setContent(POST_FALLBACK); setStep(2) }, 3000); return () => clearTimeout(t) } }, [step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Create Post" stepLabels={['Configure', 'Generate', 'Review', 'Publish']}>
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div><Label>Post Type</Label><TypeGrid items={POST_TYPES} selected={postType} onSelect={setPostType} cols={3} /></div>
          <div><Label>Topic</Label><input style={INPUT_STYLE} value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. AI in business" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Target Audience</Label><select style={INPUT_STYLE} value={audience} onChange={e => setAudience(e.target.value)}>{['Prospects','Customers','Partners','General','Developers'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div><Label>Tone</Label><select style={INPUT_STYLE} value={tone} onChange={e => setTone(e.target.value)}>{['Professional','Casual','Inspiring','Educational','Urgent'].map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div><Label>Key Message</Label><textarea style={{ ...INPUT_STYLE, minHeight: 60 }} value={keyMsg} onChange={e => setKeyMsg(e.target.value)} /></div>
          <div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}><input type="checkbox" checked={includeCta} onChange={e => setIncludeCta(e.target.checked)} /> Include CTA</label></div>
          {includeCta && <div><Label>CTA Text</Label><input style={INPUT_STYLE} value={ctaText} onChange={e => setCtaText(e.target.value)} /></div>}
          <div><Label>Word Count</Label><select style={INPUT_STYLE} value={wordCount} onChange={e => setWordCount(e.target.value)}>{['Short 50-100','Medium 150-300','Long 400-600'].map(o => <option key={o}>{o}</option>)}</select></div>
          <TealBtn label="Generate Content →" onClick={() => setStep(1)} />
        </div>
      )}
      {step === 1 && <GenChecklist items={['Crafting your content…', 'Writing headline…', 'Optimising for engagement…', 'Adding hashtags…']} done={false} />}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          {editing ? <textarea style={{ ...INPUT_STYLE, minHeight: 160 }} value={content.body} onChange={e => setContent({ ...content, body: e.target.value })} /> : (
            <>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{content.headline}</h2>
              <p className="text-sm whitespace-pre-line" style={{ color: '#D1D5DB' }}>{content.body}</p>
            </>
          )}
          <div className="flex flex-wrap gap-2">{content.hashtags.split(' ').map(h => <Badge key={h} text={h} />)}</div>
          <button className="self-start rounded-lg px-5 py-2 text-sm font-semibold" style={{ backgroundColor: TEAL, color: '#F9FAFB' }}>{content.cta}</button>
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ border: '1px solid #374151', color: '#9CA3AF' }}>{editing ? 'Done' : 'Edit'}</button>
            <button onClick={() => { setStep(1) }} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ border: '1px solid #374151', color: '#9CA3AF' }}>Regenerate</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          <ActionButton icon={Copy} label="Copy to clipboard" onClick={() => onToast('Copied to clipboard')} />
          <ActionButton icon={Calendar} label="Schedule for later" onClick={() => onToast('Scheduled')} />
          <ActionButton icon={Share2} label="Post to Slack" onClick={() => onToast('Posted to Slack')} />
          <ActionButton icon={FileText} label="Save to Content Library" onClick={() => onToast('Saved to Content Library')} />
          <ActionButton icon={Mail} label="Download as text" onClick={() => onToast('Downloaded')} />
          <p className="text-xs text-center mt-2" style={{ color: '#6B7280' }}>Content saved to Marketing Library ✓</p>
        </div>
      )}
    </Shell>
  )
}

// ─── 2. NewCampaignModal ────────────────────────────────────────────────────

const CAMPAIGN_TYPES = [
  { label: 'Email Campaign', icon: '📧' }, { label: 'Social Campaign', icon: '📱' }, { label: 'PPC/Paid', icon: '💰' }, { label: 'Partner Campaign', icon: '🤝' },
  { label: 'ABM Campaign', icon: '🎯' }, { label: 'Product Launch', icon: '🚀' }, { label: 'Promotional', icon: '🏷️' }, { label: 'Nurture Sequence', icon: '🌱' },
]

const CAMPAIGN_FALLBACK = {
  summary: 'A 4-week lead generation campaign targeting UK SMBs through LinkedIn and email, driving trial signups with educational content and case studies.',
  channels: ['LinkedIn Ads', 'Email Nurture', 'Blog Content', 'Retargeting'],
  weekPlan: ['Week 1: Awareness — blog post + LinkedIn ad launch', 'Week 2: Engagement — email sequence begins + webinar invite', 'Week 3: Conversion — case study push + free trial CTA', 'Week 4: Retention — follow-up emails + demo booking'],
  kpis: ['500 new leads', '15% email open rate', '3% conversion to trial', '£12 cost per lead'],
}

export function NewCampaignModal({ onClose, onToast }: ModalProps) {
  const [step, setStep] = useState<Step>(0)
  const [campType, setCampType] = useState('')
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('Lead Generation')
  const [audience, setAudience] = useState('')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [keyMsg, setKeyMsg] = useState('')
  const [data, setData] = useState(CAMPAIGN_FALLBACK)

  useEffect(() => { if (step === 1) { const t = setTimeout(() => { setData(CAMPAIGN_FALLBACK); setStep(2) }, 3000); return () => clearTimeout(t) } }, [step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="New Campaign" stepLabels={['Configure', 'Generate', 'Review', 'Launch']}>
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div><Label>Campaign Type</Label><TypeGrid items={CAMPAIGN_TYPES} selected={campType} onSelect={setCampType} /></div>
          <div><Label>Campaign Name</Label><input style={INPUT_STYLE} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q2 Lead Gen Push" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Goal</Label><select style={INPUT_STYLE} value={goal} onChange={e => setGoal(e.target.value)}>{['Brand Awareness','Lead Generation','Conversion','Retention','Upsell'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div><Label>Budget £ (optional)</Label><input style={INPUT_STYLE} type="number" value={budget} onChange={e => setBudget(e.target.value)} /></div>
          </div>
          <div><Label>Target Audience</Label><input style={INPUT_STYLE} value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. UK SMBs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><input style={INPUT_STYLE} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><Label>End Date</Label><input style={INPUT_STYLE} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <div><Label>Key Message</Label><textarea style={{ ...INPUT_STYLE, minHeight: 60 }} value={keyMsg} onChange={e => setKeyMsg(e.target.value)} /></div>
          <TealBtn label="Build Campaign →" onClick={() => setStep(1)} />
        </div>
      )}
      {step === 1 && <GenChecklist items={['Building your campaign plan…', 'Analysing target audience…', 'Planning content calendar…', 'Setting KPIs…']} done={false} />}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: '#D1D5DB' }}>{data.summary}</p>
          <div><Label>Channels</Label><div className="flex flex-wrap gap-2">{data.channels.map(c => <Badge key={c} text={c} />)}</div></div>
          <div><Label>Week Plan</Label><div className="flex flex-col gap-2">{data.weekPlan.map((w, i) => <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: '#1F2937' }}><div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: TEAL, color: '#fff' }}>{i + 1}</div><span className="text-sm" style={{ color: '#D1D5DB' }}>{w}</span></div>)}</div></div>
          <div><Label>KPIs</Label><div className="grid grid-cols-2 gap-2">{data.kpis.map(k => <div key={k} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}><span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{k}</span></div>)}</div></div>
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          <ActionButton icon={FileText} label="Download brief PDF" onClick={() => onToast('Brief downloaded')} />
          <ActionButton icon={Check} label="Create workflow tasks" onClick={() => onToast('Tasks created')} />
          <ActionButton icon={Share2} label="Share with team" onClick={() => onToast('Shared with team')} />
          <ActionButton icon={Copy} label="Save to Campaign Library" onClick={() => onToast('Saved to Campaign Library')} />
        </div>
      )}
    </Shell>
  )
}

// ─── 3. WebinarSetupModal ───────────────────────────────────────────────────

const WEBINAR_TYPES = [
  { label: 'Educational', icon: '📚' }, { label: 'Product Demo', icon: '💻' }, { label: 'Thought Leadership', icon: '💡' }, { label: 'Partner Webinar', icon: '🤝' },
  { label: 'Data & Research', icon: '📊' }, { label: 'Q&A Session', icon: '❓' }, { label: 'Customer Success', icon: '🏆' }, { label: 'Live Event', icon: '🎙️' },
]

const WEBINAR_FALLBACK = {
  runOfShow: ['0:00 — Welcome & introductions', '0:05 — Keynote presentation', '0:20 — Live demo', '0:35 — Q&A session', '0:45 — Wrap-up & CTA'],
  promoEmail: 'Join us for an exclusive webinar on how AI is transforming business operations. Our expert speakers will share real-world case studies and live demos. Reserve your spot today — limited to 100 attendees.',
  socialCopy: '🎙️ WEBINAR: How AI is changing the game for UK businesses. Live demo + Q&A. Register now →',
  speakerNotes: 'Key talking points: 1) Current state of UK business automation 2) Live Lumio demo 3) Customer success stories 4) Q&A',
}

export function WebinarSetupModal({ onClose, onToast }: ModalProps) {
  const [step, setStep] = useState<Step>(0)
  const [wType, setWType] = useState('')
  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [duration, setDuration] = useState('45')
  const [platform, setPlatform] = useState('Zoom')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [speakers, setSpeakers] = useState('')
  const [topics, setTopics] = useState('')
  const [data, setData] = useState(WEBINAR_FALLBACK)

  useEffect(() => { if (step === 1) { const t = setTimeout(() => { setData(WEBINAR_FALLBACK); setStep(2) }, 3000); return () => clearTimeout(t) } }, [step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Webinar Setup" stepLabels={['Configure', 'Generate', 'Review', 'Launch']}>
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div><Label>Type</Label><TypeGrid items={WEBINAR_TYPES} selected={wType} onSelect={setWType} /></div>
          <div><Label>Title</Label><input style={INPUT_STYLE} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AI for UK Businesses" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date & Time</Label><input style={INPUT_STYLE} type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} /></div>
            <div><Label>Duration</Label><select style={INPUT_STYLE} value={duration} onChange={e => setDuration(e.target.value)}>{['30','45','60','90'].map(o => <option key={o} value={o}>{o} mins</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Platform</Label><select style={INPUT_STYLE} value={platform} onChange={e => setPlatform(e.target.value)}>{['Zoom','Teams','Google Meet','Hopin','StreamYard'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div><Label>Max Attendees</Label><input style={INPUT_STYLE} type="number" value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} /></div>
          </div>
          <div><Label>Speakers</Label><textarea style={{ ...INPUT_STYLE, minHeight: 50 }} value={speakers} onChange={e => setSpeakers(e.target.value)} placeholder="Speaker names, one per line" /></div>
          <div><Label>Key Topics</Label><textarea style={{ ...INPUT_STYLE, minHeight: 50 }} value={topics} onChange={e => setTopics(e.target.value)} /></div>
          <TealBtn label="Prepare Webinar →" onClick={() => setStep(1)} />
        </div>
      )}
      {step === 1 && <GenChecklist items={['Preparing your webinar…', 'Building run of show…', 'Writing promo copy…', 'Creating email sequence…']} done={false} />}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div><Label>Run of Show</Label><div className="flex flex-col gap-2">{data.runOfShow.map((r, i) => <div key={i} className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: '#1F2937' }}><div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: TEAL, color: '#fff' }}>{i + 1}</div><span className="text-sm" style={{ color: '#D1D5DB' }}>{r}</span></div>)}</div></div>
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}><Label>Promo Email</Label><p className="text-sm" style={{ color: '#D1D5DB' }}>{data.promoEmail}</p></div>
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}><Label>Social Copy</Label><p className="text-sm" style={{ color: '#D1D5DB' }}>{data.socialCopy}</p></div>
          <div className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}><Label>Speaker Notes</Label><p className="text-sm" style={{ color: '#D1D5DB' }}>{data.speakerNotes}</p></div>
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          <ActionButton icon={Copy} label="Copy registration copy" onClick={() => onToast('Copied registration copy')} />
          <ActionButton icon={FileText} label="Export run of show" onClick={() => onToast('Run of show exported')} />
          <ActionButton icon={Mail} label="Schedule promo emails" onClick={() => onToast('Promo emails scheduled')} />
          <ActionButton icon={Calendar} label="Add to calendar" onClick={() => onToast('Added to calendar')} />
          <ActionButton icon={Share2} label="Share with speakers" onClick={() => onToast('Shared with speakers')} />
        </div>
      )}
    </Shell>
  )
}

// ─── 4. LeadReportModal ─────────────────────────────────────────────────────

const REPORT_TYPES = [
  { label: 'Weekly Lead Summary', icon: '📋' }, { label: 'Monthly Pipeline', icon: '📈' }, { label: 'Campaign Performance', icon: '🎯' },
  { label: 'Source Analysis', icon: '🔍' }, { label: 'Revenue Attribution', icon: '💷' }, { label: 'Top Leads', icon: '⭐' },
]
const INCLUDE_OPTS = ['New leads', 'Qualified', 'Conversions', 'Lost', 'Pipeline value']

const REPORT_FALLBACK = {
  summary: 'This period saw 47 new leads with a 34% qualification rate. Pipeline value grew 12% to £142,800. Top source was LinkedIn (38%), followed by direct traffic (28%).',
  metrics: [{ label: 'New Leads', value: '47', trend: '+12%' }, { label: 'Conversion Rate', value: '34%', trend: '+3%' }, { label: 'Pipeline Value', value: '£142,800', trend: '+12%' }, { label: 'Top Source', value: 'LinkedIn', trend: '38%' }],
  topLeads: ['Sarah Chen — Axon Technologies — £182k', 'Marcus Webb — Meridian Group — £94k', 'James Harlow — Vertex Systems — £231k'],
  recommendations: ['Increase LinkedIn ad spend — highest converting channel', 'Follow up on 3 stale leads in Negotiation stage', 'Launch nurture sequence for 12 unqualified leads'],
}

export function LeadReportModal({ onClose, onToast }: ModalProps) {
  const [step, setStep] = useState<Step>(0)
  const [reportType, setReportType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includes, setIncludes] = useState<string[]>(['New leads', 'Qualified', 'Conversions'])
  const [groupBy, setGroupBy] = useState('Source')
  const [audience, setAudience] = useState('Marketing')
  const [format, setFormat] = useState('Executive Summary')
  const [data, setData] = useState(REPORT_FALLBACK)

  const toggleInclude = (v: string) => setIncludes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  useEffect(() => { if (step === 1) { const t = setTimeout(() => { setData(REPORT_FALLBACK); setStep(2) }, 3000); return () => clearTimeout(t) } }, [step])

  return (
    <Shell onClose={onClose} step={step} setStep={setStep} title="Lead Report" stepLabels={['Configure', 'Generate', 'Review', 'Export']}>
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div><Label>Report Type</Label><TypeGrid items={REPORT_TYPES} selected={reportType} onSelect={setReportType} cols={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>From</Label><input style={INPUT_STYLE} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label>To</Label><input style={INPUT_STYLE} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </div>
          <div><Label>Include</Label><div className="flex flex-wrap gap-2">{INCLUDE_OPTS.map(o => <button key={o} onClick={() => toggleInclude(o)} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: includes.includes(o) ? 'rgba(13,148,136,0.15)' : '#1F2937', border: `1px solid ${includes.includes(o) ? TEAL : '#374151'}`, color: includes.includes(o) ? TEAL : '#9CA3AF' }}>{o}</button>)}</div></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Group By</Label><select style={INPUT_STYLE} value={groupBy} onChange={e => setGroupBy(e.target.value)}>{['Source','Campaign','Channel','Region'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div><Label>Audience</Label><select style={INPUT_STYLE} value={audience} onChange={e => setAudience(e.target.value)}>{['Sales','Leadership','Board','Marketing'].map(o => <option key={o}>{o}</option>)}</select></div>
            <div><Label>Format</Label><select style={INPUT_STYLE} value={format} onChange={e => setFormat(e.target.value)}>{['Executive Summary','Detailed','Visual'].map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <TealBtn label="Generate Report →" onClick={() => setStep(1)} />
        </div>
      )}
      {step === 1 && <GenChecklist items={['Compiling your report…', 'Pulling lead data…', 'Analysing trends…', 'Writing insights…']} done={false} />}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: '#D1D5DB' }}>{data.summary}</p>
          <div className="grid grid-cols-2 gap-2">{data.metrics.map(m => <div key={m.label} className="rounded-xl p-4" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}><p className="text-xs" style={{ color: '#6B7280' }}>{m.label}</p><p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{m.value}</p><p className="text-xs font-medium" style={{ color: TEAL }}>{m.trend}</p></div>)}</div>
          <div><Label>Top Leads</Label><div className="flex flex-col gap-1">{data.topLeads.map(l => <p key={l} className="text-sm" style={{ color: '#D1D5DB' }}>• {l}</p>)}</div></div>
          <div><Label>Recommendations</Label><div className="flex flex-col gap-1">{data.recommendations.map(r => <p key={r} className="text-sm" style={{ color: '#D1D5DB' }}>• {r}</p>)}</div></div>
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          <ActionButton icon={FileText} label="Download PDF" onClick={() => onToast('PDF downloaded')} />
          <ActionButton icon={Copy} label="Copy to clipboard" onClick={() => onToast('Copied to clipboard')} />
          <ActionButton icon={Mail} label="Email to team" onClick={() => onToast('Emailed to team')} />
          <ActionButton icon={Share2} label="Save to Reports" onClick={() => onToast('Saved to Reports')} />
          <ActionButton icon={Calendar} label="Schedule recurring" onClick={() => onToast('Recurring report scheduled')} />
        </div>
      )}
    </Shell>
  )
}
