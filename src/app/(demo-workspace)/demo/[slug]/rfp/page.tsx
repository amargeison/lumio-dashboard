'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Check, Loader2, Sparkles, Mail, Send, FileText, ChevronRight,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const OPP_TYPES = [
  { id: 'new_business',    label: 'New Business',       emoji: '\u{1F4BC}' },
  { id: 'renewal',         label: 'Contract Renewal',   emoji: '\u{1F504}' },
  { id: 'upsell',          label: 'Upsell / Expansion', emoji: '\u{1F199}' },
  { id: 'partnership',     label: 'Partnership',        emoji: '\u{1F91D}' },
  { id: 'education',       label: 'Education Sector',   emoji: '\u{1F3EB}' },
  { id: 'healthcare',      label: 'Healthcare',         emoji: '\u{1F3E5}' },
  { id: 'enterprise',      label: 'Enterprise',         emoji: '\u{1F3E2}' },
  { id: 'sme',             label: 'SME / Mid-Market',   emoji: '\u{1F3D7}\u{FE0F}' },
  { id: 'public_sector',   label: 'Public Sector',      emoji: '\u{1F30D}' },
  { id: 'high_value',      label: 'High Value (\u{00A3}50k+)', emoji: '\u{1F4B0}' },
  { id: 'fast_track',      label: 'Fast Track (urgent)',emoji: '\u{26A1}' },
  { id: 're_engagement',   label: 'Re-engagement',      emoji: '\u{1F501}' },
]

const SOURCES = ['Referral', 'Inbound', 'Outbound', 'Event', 'Website', 'Partner']

const REQ_OPTIONS = [
  { id: 'pricing',      label: 'Pricing breakdown required' },
  { id: 'case_studies', label: 'Case studies requested' },
  { id: 'tech_spec',    label: 'Technical specification needed' },
  { id: 'security',     label: 'Security/compliance questionnaire' },
  { id: 'timeline',     label: 'Implementation timeline required' },
  { id: 'references',   label: 'References requested' },
  { id: 'custom_terms', label: 'Custom contract terms' },
  { id: 'exec_summary', label: 'Executive summary only' },
]

const TONES = ['Formal', 'Consultative', 'Challenger', 'Partnership']

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Configure', 'Research', 'Build', 'Send']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current; const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done ? 'bg-teal-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-[#1F2937] text-[#6B7280]'
              }`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? 'text-[#F9FAFB]' : 'text-[#6B7280]'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-16 mx-2 mb-5 transition-colors ${i < current ? 'bg-teal-500' : 'bg-[#1F2937]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoRFPPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [step, setStep] = useState(0)

  // Step 0 — Configure
  const [oppType, setOppType] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [deadline, setDeadline] = useState('')
  const [source, setSource] = useState('')
  const [requirements, setRequirements] = useState<string[]>([])
  const [tone, setTone] = useState('Consultative')

  // Step 1 — Research
  const [researchLog, setResearchLog] = useState<string[]>([])
  const [researchDone, setResearchDone] = useState(false)
  const [intelligence, setIntelligence] = useState<any>(null)

  // Step 2 — Build
  const [document, setDocument] = useState<any>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [approved, setApproved] = useState(false)

  // Step 3 — Send
  const [sent, setSent] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logged, setLogged] = useState(false)

  function toggleReq(id: string) {
    setRequirements(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const oppLabel = OPP_TYPES.find(o => o.id === oppType)?.label || ''
  const reqLabels = requirements.map(r => REQ_OPTIONS.find(o => o.id === r)?.label || r)
  const canProceed = oppType && companyName && contactEmail

  // ── Research (Step 1) ──────────────────────────────────────────────────────

  async function startResearch() {
    setStep(1); setResearchLog([]); setResearchDone(false); setIntelligence(null)

    const logs = [
      'Analysing company profile\u2026',
      'Checking existing relationship history\u2026',
      'Reviewing similar won/lost deals\u2026',
      'Pulling competitor intelligence\u2026',
      'Building pricing recommendation\u2026',
    ]

    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 600))
      setResearchLog(prev => [...prev, logs[i]])
    }

    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'player',
          query: `SALES INTELLIGENCE: Research RFP opportunity for ${companyName} (${oppLabel}). Deal value: \u00A3${dealValue || 'TBC'}. Deadline: ${deadline || 'TBC'}. Source: ${source || 'Unknown'}. Requirements: ${reqLabels.join(', ') || 'None specified'}. Tone: ${tone}. Return ONLY JSON: {"companySnapshot":"2-sentence company profile","buyingSignals":["signal 1","signal 2","signal 3"],"risks":["risk 1","risk 2"],"competitorWatch":"Who they might also be talking to","pricingGuidance":"Recommended pricing approach","keyMessages":["msg 1","msg 2","msg 3"],"winProbability":"68%","recommendedApproach":"One paragraph approach"}`
        })
      })
      const data = await res.json()
      if (data.result) setIntelligence(data.result)
    } catch { /* fallback below */ }

    if (!intelligence) {
      setIntelligence({
        companySnapshot: `${companyName} is a ${oppLabel.toLowerCase()} opportunity in the ${source || 'inbound'} pipeline. Based on the deal profile, this represents a strong fit for Lumio\u2019s platform capabilities.`,
        buyingSignals: ['Active evaluation phase \u2014 deadline set', 'Requested detailed pricing breakdown', 'Multiple stakeholders engaged'],
        risks: ['Competitor may already be embedded', 'Budget not yet formally approved'],
        competitorWatch: 'Likely evaluating 2\u20133 alternatives. Lumio wins on depth of integration, AI capabilities, and speed of deployment.',
        pricingGuidance: `For a \u00A3${dealValue || '15,000'} deal, recommend tiered pricing with a clear ROI narrative. Lead with annual commitment discount.`,
        keyMessages: ['End-to-end platform \u2014 no stitching tools together', 'Live in 2 weeks, not 6 months', 'AI-powered insights from day one'],
        winProbability: '65%',
        recommendedApproach: `Lead with a consultative approach for ${companyName}. Focus on understanding their current pain points before presenting the solution. Use case studies from similar ${oppLabel.toLowerCase()} wins to build credibility. Propose a pilot period to reduce perceived risk.`
      })
    }

    await new Promise(r => setTimeout(r, 400))
    setResearchLog(prev => [...prev, 'Intelligence report ready.'])
    setResearchDone(true)
  }

  // ── Build Document (Step 2) ────────────────────────────────────────────────

  async function buildDocument() {
    setStep(2); setDocLoading(true); setDocument(null)

    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'player',
          query: `RFP DOCUMENT: Generate a professional RFP response for ${companyName}. Opportunity: ${oppLabel}. Value: \u00A3${dealValue || 'TBC'}. Requirements: ${reqLabels.join(', ') || 'Standard'}. Tone: ${tone}. Return ONLY JSON: {"subject":"Email subject line","executiveSummary":"2 paragraph executive summary","ourUnderstanding":"What we understand about their needs","proposedSolution":"Our proposed solution (2 paragraphs)","whyLumio":["Reason 1","Reason 2","Reason 3","Reason 4"],"pricing":"Pricing section text","timeline":"Implementation timeline","nextSteps":"Clear call to action","closingLine":"Strong closing sentence"}`
        })
      })
      const data = await res.json()
      if (data.result) { setDocument(data.result); setDocLoading(false); return }
    } catch { /* fallback */ }

    setDocument({
      subject: `Proposal: Lumio Platform for ${companyName}`,
      executiveSummary: `Thank you for the opportunity to present Lumio as your preferred platform partner. Following our initial discussions, we have prepared this proposal to demonstrate how Lumio can transform your operations with an integrated, AI-powered platform.\n\nThis document outlines our understanding of your requirements, our proposed solution, pricing, and implementation timeline. We are confident that Lumio represents the strongest fit for ${companyName}\u2019s needs.`,
      ourUnderstanding: `${companyName} is seeking a comprehensive platform solution to streamline operations, improve visibility across departments, and drive data-informed decision making. Key requirements include ${reqLabels.slice(0, 3).join(', ').toLowerCase() || 'a robust, scalable solution with strong reporting capabilities'}.`,
      proposedSolution: `We propose deploying the full Lumio platform with customised onboarding tailored to your team structure. This includes all core modules (CRM, Operations, Finance, HR, and Analytics) with AI-powered insights enabled from day one.\n\nImplementation follows our proven 3-phase approach: Discovery & Setup (Week 1\u20132), Data Migration & Training (Week 3\u20134), and Go-Live & Optimisation (Week 5+). Your dedicated account manager will guide every step.`,
      whyLumio: ['All-in-one platform \u2014 no integration headaches', 'AI insights built in, not bolted on', 'Live in weeks, not months', 'UK-based support team with named account manager'],
      pricing: `Based on ${dealValue ? '\u00A3' + dealValue + ' budget' : 'your requirements'}, we recommend the Professional tier at \u00A3${dealValue ? Math.round(Number(dealValue) * 0.8).toLocaleString() : '12,000'}/year (annual commitment). This includes unlimited users, all modules, and priority support. Volume discounts available for multi-year agreements.`,
      timeline: 'Phase 1: Discovery & Setup (2 weeks) \u2192 Phase 2: Migration & Training (2 weeks) \u2192 Phase 3: Go-Live (1 week). Total: 5 weeks to full deployment.',
      nextSteps: `We\u2019d love to schedule a 30-minute call to walk through this proposal and answer any questions. Available slots this week: Tuesday 2pm or Thursday 10am. Alternatively, book directly via our scheduling link.`,
      closingLine: `We\u2019re excited about the opportunity to partner with ${companyName} and confident that Lumio will deliver measurable value from month one.`
    })
    setDocLoading(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const winPct = intelligence ? parseInt(intelligence.winProbability) || 50 : 50
  const winColor = winPct >= 70 ? '#22C55E' : winPct >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="min-h-screen text-[#F9FAFB] px-6 py-8 max-w-5xl mx-auto" style={{ backgroundColor: '#07080F' }}>

      {/* Demo badge */}
      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
        Demo workspace &mdash; no real proposal will be sent
      </div>

      {/* Header */}
      <div className="mb-6">
        <Link href={`/demo/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Sales
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded">SALES-RFP-01</span>
            <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded">AI Agent</span>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Claude</span>
          </div>
          <h1 className="text-2xl font-bold">Request for Proposal &mdash; RFP Builder</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Describe the opportunity &mdash; get a structured RFP document, pricing guidance, and a ready-to-send proposal email.
          </p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 0: Configure ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Opportunity type */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-1">What type of opportunity?</h2>
            <p className="text-sm text-[#9CA3AF] mb-4">Pick the closest match.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {OPP_TYPES.map(ot => (
                <button key={ot.id} onClick={() => setOppType(ot.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    oppType === ot.id
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  <span>{ot.emoji}</span> {ot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunity details */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Opportunity Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Company name *</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Greenfield Group"
                  className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 text-[#F9FAFB]" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Contact name</label>
                <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Sarah Chen"
                  className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 text-[#F9FAFB]" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Contact email *</label>
                <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="sarah@greenfield.com" type="email"
                  className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 text-[#F9FAFB]" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Estimated deal value &pound;</label>
                <input value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="e.g. 24000" type="number"
                  className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 text-[#F9FAFB]" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">Decision deadline</label>
                <input value={deadline} onChange={e => setDeadline(e.target.value)} type="date"
                  className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 text-[#F9FAFB]" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] block mb-1">How did they find us?</label>
                <select value={source} onChange={e => setSource(e.target.value)}
                  className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 text-[#F9FAFB]">
                  <option value="">Select...</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Requirements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REQ_OPTIONS.map(req => (
                <button key={req.id} onClick={() => toggleReq(req.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                    requirements.includes(req.id)
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    requirements.includes(req.id) ? 'bg-purple-600 border-purple-600' : 'border-[#4B5563]'
                  }`}>
                    {requirements.includes(req.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {req.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Tone &amp; Style</h2>
            <div className="flex gap-2 flex-wrap">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    tone === t
                      ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                      : 'border-[#1F2937] text-[#9CA3AF] hover:border-[#374151]'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button onClick={startResearch} disabled={!canProceed}
            className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              canProceed ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-[#1F2937] text-[#4B5563] cursor-not-allowed'
            }`}>
            <Sparkles className="w-4 h-4" /> Research &amp; Build Proposal
          </button>
        </div>
      )}

      {/* ── Step 1: Research ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold">AI Research Agent</h2>
              {!researchDone && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
            </div>
            <div className="space-y-2 font-mono text-sm">
              {researchLog.map((log, i) => {
                const isDone = i < researchLog.length - 1 || researchDone
                return (
                  <div key={i} className="flex items-start gap-2">
                    {isDone ? <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" /> : <Loader2 className="w-4 h-4 text-purple-400 animate-spin mt-0.5 flex-shrink-0" />}
                    <span style={{ color: isDone ? '#9CA3AF' : '#F9FAFB' }}>{log}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {researchDone && intelligence && (
            <>
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Intelligence Report</h2>
                  <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${winColor}20`, color: winColor }}>
                    {intelligence.winProbability} win probability
                  </span>
                </div>
                <p className="text-sm text-[#9CA3AF] mb-4">{intelligence.companySnapshot}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Buying Signals</h3>
                    {intelligence.buyingSignals?.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 mb-1"><span className="text-teal-400 text-xs mt-0.5">+</span><span className="text-sm text-[#D1D5DB]">{s}</span></div>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Risks</h3>
                    {intelligence.risks?.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 mb-1"><span className="text-red-400 text-xs mt-0.5">!</span><span className="text-sm text-[#D1D5DB]">{r}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={buildDocument}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white transition-colors">
                <FileText className="w-4 h-4" /> Build Proposal Document
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Step 2: Build ─────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {docLoading && (
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
              <p className="text-sm text-[#9CA3AF]">Building your proposal document...</p>
            </div>
          )}

          {!docLoading && document && (
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Left — Intelligence */}
              <div className="lg:w-[320px] space-y-4 flex-shrink-0">
                <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold">Intelligence Summary</h3>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-3xl font-black" style={{ color: winColor }}>{intelligence?.winProbability}</span>
                    <p className="text-xs text-[#6B7280] mt-1">Win probability</p>
                  </div>
                  {intelligence?.keyMessages && (
                    <div>
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Key Messages</h4>
                      {intelligence.keyMessages.map((m: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 mb-1.5"><ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" /><span className="text-xs text-[#D1D5DB]">{m}</span></div>
                      ))}
                    </div>
                  )}
                  {intelligence?.pricingGuidance && (
                    <div>
                      <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Pricing Guidance</h4>
                      <p className="text-xs text-[#9CA3AF]">{intelligence.pricingGuidance}</p>
                    </div>
                  )}
                  {intelligence?.competitorWatch && (
                    <div>
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Competitor Watch</h4>
                      <p className="text-xs text-[#9CA3AF]">{intelligence.competitorWatch}</p>
                    </div>
                  )}
                  {intelligence?.recommendedApproach && (
                    <div>
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Recommended Approach</h4>
                      <p className="text-xs text-[#9CA3AF]">{intelligence.recommendedApproach}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Document preview */}
              <div className="flex-1 min-w-0">
                <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <h3 className="text-sm font-bold">Proposal Document</h3>
                  </div>

                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-bold">Subject</div>
                  <p className="text-sm font-semibold text-[#F9FAFB] -mt-3">{document.subject}</p>

                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-bold">Executive Summary</div>
                  <p className="text-sm text-[#D1D5DB] whitespace-pre-line -mt-3">{document.executiveSummary}</p>

                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-bold">Our Understanding</div>
                  <p className="text-sm text-[#D1D5DB] -mt-3">{document.ourUnderstanding}</p>

                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-bold">Proposed Solution</div>
                  <p className="text-sm text-[#D1D5DB] whitespace-pre-line -mt-3">{document.proposedSolution}</p>

                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-bold">Why Lumio</div>
                  <div className="-mt-3 space-y-1">
                    {document.whyLumio?.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" /><span className="text-sm text-[#D1D5DB]">{r}</span></div>
                    ))}
                  </div>

                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-bold">Pricing</div>
                  <p className="text-sm text-[#D1D5DB] -mt-3">{document.pricing}</p>

                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-bold">Timeline</div>
                  <p className="text-sm text-[#D1D5DB] -mt-3">{document.timeline}</p>

                  <div className="text-xs text-[#6B7280] uppercase tracking-wider font-bold">Next Steps</div>
                  <p className="text-sm text-[#D1D5DB] -mt-3">{document.nextSteps}</p>

                  <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>{document.closingLine}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-[#1F2937] text-[#9CA3AF] hover:text-white transition-colors">
                    &#x270F;&#xFE0F; Edit Document
                  </button>
                  <button onClick={() => { setApproved(true); setStep(3) }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white transition-colors">
                    <Check className="w-4 h-4" /> Approve &amp; Continue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Send ──────────────────────────────────────────────────────── */}
      {step === 3 && document && (
        <div className="space-y-6">
          {!sent ? (
            <>
              <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold">Ready to Send</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6B7280] w-16">To:</span>
                    <span className="text-sm text-[#F9FAFB]">{contactName ? `${contactName} <${contactEmail}>` : contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6B7280] w-16">Subject:</span>
                    <span className="text-sm text-[#F9FAFB]">{document.subject}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6B7280] w-16">Attach:</span>
                    <span className="text-sm text-purple-400">{'\u{1F4CE}'} Lumio_Proposal_{companyName.replace(/\s+/g, '_')}.pdf</span>
                  </div>
                </div>
                <div className="rounded-lg p-4 text-sm text-[#D1D5DB] whitespace-pre-line" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', maxHeight: 300, overflowY: 'auto' }}>
                  {document.executiveSummary}{'\n\n'}{document.proposedSolution}{'\n\n'}{document.nextSteps}{'\n\n'}{document.closingLine}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSent(true)}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white transition-colors">
                  <Send className="w-4 h-4" /> Send Proposal
                </button>
                <button onClick={() => setSaved(true)}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-[#1F2937] text-[#9CA3AF] hover:text-white transition-colors">
                  {'\u{1F4BE}'} {saved ? 'Saved to CRM' : 'Save as Draft'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-8 text-center">
              <div className="text-5xl mb-3">&#x2709;&#xFE0F;</div>
              <h2 className="text-xl font-bold text-[#F9FAFB] mb-2">Proposal Sent!</h2>
              <p className="text-sm text-[#9CA3AF] mb-6">
                Proposal sent to {contactName || contactEmail} at {companyName}
              </p>
              {!logged ? (
                <button onClick={() => setLogged(true)}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors">
                  {'\u{1F4CB}'} Log in CRM
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>
                  <Check className="w-4 h-4" /> Opportunity logged &mdash; {companyName} &middot; &pound;{dealValue || 'TBC'} &middot; {deadline || 'No deadline'}
                </div>
              )}
              <div className="mt-6">
                <Link href={`/demo/${slug}`}
                  className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
                  &larr; Back to Sales dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
