'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, Check, Loader2, Sparkles, FileText, Copy, Mail, Globe, Briefcase } from 'lucide-react'

const CASE_STUDY_TYPES = [
  { id: 'revenue',       label: 'Revenue Growth',           emoji: '📈' },
  { id: 'leads',         label: 'Lead Generation',          emoji: '🎯' },
  { id: 'efficiency',    label: 'Efficiency Gains',         emoji: '⚡' },
  { id: 'transformation',label: 'Digital Transformation',   emoji: '🔄' },
  { id: 'success',       label: 'Customer Success',         emoji: '🏆' },
  { id: 'partnership',   label: 'Partnership Win',          emoji: '🤝' },
  { id: 'launch',        label: 'Product Launch',           emoji: '🚀' },
  { id: 'problem',       label: 'Problem Solved',           emoji: '💡' },
  { id: 'expansion',     label: 'Market Expansion',         emoji: '🌍' },
  { id: 'risk',          label: 'Risk Reduction',           emoji: '🛡️' },
  { id: 'scaling',       label: 'Team Scaling',             emoji: '👥' },
  { id: 'training',      label: 'Training & Adoption',      emoji: '🎓' },
]

const INDUSTRIES = ['Education', 'Finance', 'Healthcare', 'Retail', 'Tech', 'Manufacturing', 'Professional Services', 'Other']
const TIMEFRAMES = ['30 days', '90 days', '6 months', '1 year', '2+ years']
const AUDIENCES = ['Prospects', 'Existing Customers', 'Investors', 'Press', 'All']

const RESEARCH_STEPS = [
  'Gathering customer data...',
  'Analysing key metrics...',
  'Identifying story arc...',
]

type Step = 1 | 2 | 3 | 4

function generateDraft(type: string, company: string, industry: string, timeframe: string, result: string) {
  const typeLabel = CASE_STUDY_TYPES.find(t => t.id === type)?.label || 'Success Story'
  const headline = `How ${company || 'Our Client'} Achieved ${result || 'Transformative Results'} with Lumio`
  const subheading = `A ${typeLabel.toLowerCase()} case study from the ${industry || 'technology'} sector`

  return {
    headline,
    subheading,
    challenge: `${company || 'The company'} was struggling with fragmented business operations across multiple disconnected tools. Their ${industry?.toLowerCase() || 'industry'} team was spending hours each week on manual data entry, report generation, and cross-departmental communication. With growing complexity, they needed a unified platform that could scale with their ambitions.`,
    solution: `After evaluating several platforms, ${company || 'they'} chose Lumio for its all-in-one approach to business operations. The implementation was completed in under a week, with automated workflows replacing manual processes across HR, Sales, Operations, and Marketing. The AI-powered morning briefing became an instant favourite with the leadership team.`,
    results: [
      `${result || '40% reduction in admin time'} within ${timeframe || '90 days'}`,
      `Team productivity increased by 35% through automated workflows`,
      `ROI achieved within the first ${timeframe === '30 days' ? 'month' : timeframe === '90 days' ? 'quarter' : '6 months'} of deployment`,
    ],
    quote: `"Lumio changed the way we operate. What used to take our team half a day now happens automatically before we've finished our morning coffee."`,
    quotee: `— Operations Director, ${company || 'Client'}`,
  }
}

export default function CaseStudyModal({ onClose, onSubmit }: { onClose: () => void; onSubmit?: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [selectedType, setSelectedType] = useState('')
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1])
  const [result, setResult] = useState('')
  const [audience, setAudience] = useState(AUDIENCES[0])
  const [researchIdx, setResearchIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')

  // Step 2 auto-advance
  useEffect(() => {
    if (step !== 2) return
    const timers = [
      setTimeout(() => setResearchIdx(1), 700),
      setTimeout(() => setResearchIdx(2), 1400),
      setTimeout(() => setStep(3), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [step])

  const draft = generateDraft(selectedType, company, industry, timeframe, result)

  const inputStyle = { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function handleCopy() {
    const text = `${draft.headline}\n${draft.subheading}\n\nThe Challenge\n${draft.challenge}\n\nThe Solution\n${draft.solution}\n\nThe Results\n${draft.results.join('\n')}\n\n${draft.quote}\n${draft.quotee}`
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl flex flex-col max-h-[92vh] rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
              <Sparkles size={15} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Case Study Researcher</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>AI-powered case study builder</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {['Configure', 'Research', 'Draft', 'Publish'].map((label, i) => {
            const s = i + 1
            const active = step === s
            const done = step > s
            return (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{
                  width: 24, height: 24,
                  backgroundColor: done ? '#0D9488' : active ? 'rgba(139,92,246,0.2)' : '#1F2937',
                  color: done ? '#fff' : active ? '#A78BFA' : '#6B7280',
                }}>
                  {done ? <Check size={12} /> : s}
                </div>
                <span className="text-xs font-medium hidden sm:inline" style={{ color: active ? '#F9FAFB' : '#6B7280' }}>{label}</span>
                {i < 3 && <ChevronRight size={12} style={{ color: '#374151' }} />}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">

          {/* Step 1 — Configure */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>What type of case study?</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {CASE_STUDY_TYPES.map(t => (
                    <button key={t.id} onClick={() => setSelectedType(t.id)}
                      className="rounded-xl p-3 text-center transition-all"
                      style={{
                        backgroundColor: selectedType === t.id ? 'rgba(139,92,246,0.15)' : '#1F2937',
                        border: selectedType === t.id ? '1px solid #8B5CF6' : '1px solid #374151',
                      }}>
                      <span className="text-xl block mb-1">{t.emoji}</span>
                      <span className="text-xs font-medium" style={{ color: selectedType === t.id ? '#A78BFA' : '#9CA3AF' }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Customer / Company Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Axon Technologies" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Timeframe of Results</label>
                  <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                    {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Key Result Achieved <span style={{ color: '#EF4444' }}>*</span></label>
                  <input value={result} onChange={e => setResult(e.target.value)} placeholder="40% reduction in admin time" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Audience</label>
                  <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                    {AUDIENCES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Research */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin mb-6" style={{ color: '#8B5CF6' }} />
              <div className="space-y-3 w-full max-w-xs">
                {RESEARCH_STEPS.map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {i <= researchIdx
                      ? <Check size={14} style={{ color: '#0D9488' }} />
                      : <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: '#1F2937' }} />}
                    <span className="text-sm" style={{ color: i <= researchIdx ? '#D1D5DB' : '#4B5563' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Draft */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-xl p-5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                <h2 className="text-lg font-black mb-1" style={{ color: '#F9FAFB' }}>{draft.headline}</h2>
                <p className="text-xs italic mb-5" style={{ color: '#9CA3AF' }}>{draft.subheading}</p>

                <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>The Challenge</h3>
                <p className="text-sm mb-5" style={{ color: '#D1D5DB', lineHeight: 1.7 }}>{draft.challenge}</p>

                <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>The Solution</h3>
                <p className="text-sm mb-5" style={{ color: '#D1D5DB', lineHeight: 1.7 }}>{draft.solution}</p>

                <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>The Results</h3>
                <ul className="space-y-2 mb-5">
                  {draft.results.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                      <Check size={14} className="mt-0.5 shrink-0" style={{ color: '#0D9488' }} />
                      {r}
                    </li>
                  ))}
                </ul>

                {/* Pull quote */}
                <div className="rounded-xl p-4 my-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderLeft: '3px solid #0D9488' }}>
                  <p className="text-sm italic" style={{ color: '#2DD4BF', lineHeight: 1.7 }}>{draft.quote}</p>
                  <p className="text-xs mt-2" style={{ color: '#6B7280' }}>{draft.quotee}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Publish */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Mini preview */}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{draft.headline}</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{draft.subheading} · {audience} · {timeframe}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: FileText, label: 'Download as PDF', color: '#0D9488', action: () => showToast('PDF downloaded') },
                  { icon: Copy, label: 'Copy to Clipboard', color: '#8B5CF6', action: handleCopy },
                  { icon: Mail, label: 'Email to Team', color: '#22D3EE', action: () => showToast('Emailed to team') },
                  { icon: Globe, label: 'Publish to Website', color: '#22C55E', action: () => showToast('Published to website') },
                  { icon: Briefcase, label: 'Add to Sales Deck', color: '#F59E0B', action: () => showToast('Added to sales deck') },
                ].map(({ icon: Icon, label, color, action }) => (
                  <button key={label} onClick={action}
                    className="flex flex-col items-center gap-2 rounded-xl p-4 transition-colors"
                    style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = color }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151' }}>
                    <Icon size={18} style={{ color }} />
                    <span className="text-xs font-medium text-center" style={{ color: '#D1D5DB' }}>{label}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-lg px-4 py-3 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: '#22C55E' }}>✓ Saved to Marketing Library</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <button onClick={() => step > 1 ? setStep((step - 1) as Step) : onClose()}
            className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 4 && (
            <button onClick={() => {
              if (step === 1 && (!selectedType || !company || !result)) return
              setStep((step + 1) as Step)
            }}
              disabled={step === 1 && (!selectedType || !company || !result)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
              style={{ backgroundColor: step === 2 ? '#374151' : '#8B5CF6', color: '#F9FAFB' }}>
              {step === 2 ? <><Loader2 size={14} className="animate-spin" /> Researching...</> : <>Next <ChevronRight size={14} /></>}
            </button>
          )}
          {step === 4 && (
            <button onClick={() => { onSubmit?.(); onClose() }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              <Check size={14} /> Done
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          {toast}
        </div>
      )}
      {copied && (
        <div className="fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-xl"
          style={{ backgroundColor: '#8B5CF6', color: '#F9FAFB' }}>
          Copied to clipboard
        </div>
      )}
    </div>
  )
}
