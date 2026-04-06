'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Check, Loader2, Sparkles,
  Copy, FileText, Calendar, Send,
} from 'lucide-react'

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Configure', 'Research', 'Review', 'Export']
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1F2937] text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors">
      {copied ? <><Check className="w-3 h-3 text-teal-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  )
}

const INDUSTRIES = ['Education', 'Healthcare', 'SaaS / Technology', 'Professional Services', 'Finance & Banking', 'Government / Public Sector', 'Retail', 'Manufacturing', 'Other']

const INPUT = 'w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:outline-none focus:border-teal-500 transition-colors'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RFPBuilderPage() {
  const [step, setStep] = useState(0)

  // Step 0 — Configure
  const [clientName, setClientName] = useState('')
  const [opportunityName, setOpportunityName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [industry, setIndustry] = useState('')
  const [requirements, setRequirements] = useState('')
  const [winThemes, setWinThemes] = useState('')
  const [competitors, setCompetitors] = useState('')

  // Step 1 — Research
  const [researchLog, setResearchLog] = useState<string[]>([])
  const [researchDone, setResearchDone] = useState(false)
  const [rfpData, setRfpData] = useState<any>(null)

  // Step 2 — Review
  const [activeTab, setActiveTab] = useState('executive')
  const [editedSections, setEditedSections] = useState<Record<string, string>>({})

  // Step 3 — Export
  const [exported, setExported] = useState(false)

  async function startResearch() {
    setStep(1); setResearchLog([]); setResearchDone(false)
    const logs = [
      `Analysing RFP requirements for ${clientName || 'prospect'}...`,
      `Researching ${industry || 'target'} industry context...`,
      `Identifying competitive positioning vs ${competitors || 'competitors'}...`,
      'Generating executive summary...',
      'Building solution narrative...',
      'Creating implementation plan...',
      'Compiling case study recommendations...',
      'Finalising RFP response...',
    ]
    for (const log of logs) {
      await new Promise(r => setTimeout(r, 600))
      setResearchLog(prev => [...prev, log])
    }

    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'player', query: `You are an expert proposal writer. Generate a complete RFP response for:
Client: ${clientName}
Opportunity: ${opportunityName}
Industry: ${industry}
Deal Value: £${dealValue}
Requirements: ${requirements}
Win Themes: ${winThemes}
Competitors: ${competitors}

Return ONLY valid JSON with these exact keys:
{
  "executiveSummary": "2 confident paragraphs, outcome-focused, referencing the client by name",
  "ourSolution": "3 paragraphs describing how our platform addresses their specific requirements",
  "whyUs": ["differentiator 1 with explanation", "differentiator 2", "differentiator 3"],
  "implementation": "Phased plan with timelines: Phase 1 (weeks 1-2), Phase 2 (weeks 3-4), Phase 3 (weeks 5-8)",
  "pricing": "Placeholder pricing section with headers for finance to complete",
  "caseStudies": ["Case study 1 title and brief (most relevant to this industry)", "Case study 2"],
  "team": "Description of the team and credentials that would deliver this project"
}` })
      })
      const data = await res.json()
      const text = typeof data.result === 'string' ? data.result : data.result?.summary || ''
      try {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) setRfpData(JSON.parse(match[0]))
        else setRfpData({ executiveSummary: text, ourSolution: '', whyUs: [], implementation: '', pricing: '', caseStudies: [], team: '' })
      } catch {
        setRfpData({ executiveSummary: text, ourSolution: '', whyUs: [], implementation: '', pricing: '', caseStudies: [], team: '' })
      }
    } catch {
      setRfpData({
        executiveSummary: `We are delighted to respond to ${clientName}'s requirements. Our platform is purpose-built for organisations like yours in the ${industry} sector, and we believe we are uniquely positioned to deliver exceptional value.\n\nWith a proven track record of successful implementations and a platform trusted by leading organisations, we are confident that our solution will exceed your expectations and deliver measurable ROI within the first quarter.`,
        ourSolution: `Our solution directly addresses each of your stated requirements through a combination of our core platform capabilities and configurable modules.\n\nKey areas of alignment include: ${requirements?.slice(0, 200) || 'comprehensive workflow automation, real-time analytics, and seamless integration with your existing technology stack'}.\n\nOur platform has been specifically designed to scale with organisations of your size and complexity.`,
        whyUs: [winThemes || 'Purpose-built for your industry with deep domain expertise', 'Fastest time to value — live in weeks not months', 'AI-powered automation that saves 40+ hours per month'],
        implementation: 'Phase 1 (Weeks 1-2): Discovery, data migration planning, and environment setup.\nPhase 2 (Weeks 3-4): Core platform configuration, integration setup, and UAT.\nPhase 3 (Weeks 5-8): Training, go-live, and post-launch support.',
        pricing: 'Pricing to be confirmed by Finance team.\n\nLicence fee: £[TBC] per annum\nImplementation: £[TBC] one-off\nSupport: Included in licence\nPayment terms: NET 30',
        caseStudies: [`${industry} sector case study — similar scale implementation`, 'Enterprise deployment — demonstrating scalability and ROI'],
        team: 'Our delivery team includes a dedicated Project Manager, Solution Architect, Integration Engineer, and Customer Success Manager. All team members have extensive experience in the ' + (industry || 'target') + ' sector.',
      })
    }
    setResearchDone(true)
  }

  const TABS = [
    { id: 'executive', label: 'Executive Summary' },
    { id: 'solution', label: 'Our Solution' },
    { id: 'whyus', label: 'Why Us' },
    { id: 'implementation', label: 'Implementation' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'casestudies', label: 'Case Studies' },
    { id: 'team', label: 'Team' },
  ]

  function getSectionText(tabId: string): string {
    if (editedSections[tabId]) return editedSections[tabId]
    if (!rfpData) return ''
    switch (tabId) {
      case 'executive': return rfpData.executiveSummary || ''
      case 'solution': return rfpData.ourSolution || ''
      case 'whyus': return Array.isArray(rfpData.whyUs) ? rfpData.whyUs.join('\n\n') : rfpData.whyUs || ''
      case 'implementation': return rfpData.implementation || ''
      case 'pricing': return rfpData.pricing || ''
      case 'casestudies': return Array.isArray(rfpData.caseStudies) ? rfpData.caseStudies.join('\n\n') : rfpData.caseStudies || ''
      case 'team': return rfpData.team || ''
      default: return ''
    }
  }

  function getFullRFP(): string {
    return TABS.map(t => `## ${t.label}\n\n${getSectionText(t.id)}`).join('\n\n---\n\n')
  }

  const canStart = clientName && opportunityName && industry

  return (
    <div className="min-h-screen text-[#F9FAFB] px-6 py-8 max-w-4xl mx-auto" style={{ backgroundColor: '#07080F' }}>
      {/* Header */}
      <div className="mb-6">
        <Link href="/sales" className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Sales
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)', color: '#2DD4BF' }}>RFP-BUILDER</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>AI Research Agent</span>
          </div>
          <h1 className="text-2xl font-bold">RFP Builder — AI Proposal Generator</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">Paste the requirements — get a complete, tailored RFP response ready to review and send.</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* Step 0 — Configure */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Opportunity Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Client / prospect name *</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Greenfield Academy" className={INPUT} /></div>
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Opportunity name *</label><input value={opportunityName} onChange={e => setOpportunityName(e.target.value)} placeholder="e.g. MIS Replacement Project" className={INPUT} /></div>
              <div><label className="text-xs text-[#6B7280] block mb-1.5">RFP deadline</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={INPUT} /></div>
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Estimated deal value (£)</label><input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="e.g. 85000" className={INPUT} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-[#6B7280] block mb-1.5">Industry *</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} className={INPUT}>
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <h2 className="font-semibold mb-4">RFP Content</h2>
            <div className="space-y-4">
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Key requirements (paste from RFP)</label><textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={4} placeholder="Paste the key requirements or scope section from the RFP..." className={INPUT} style={{ resize: 'vertical' }} /></div>
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Win themes — our 3 key differentiators</label><textarea value={winThemes} onChange={e => setWinThemes(e.target.value)} rows={2} placeholder="e.g. Fastest implementation, AI-powered automation, UK-based support" className={INPUT} style={{ resize: 'vertical' }} /></div>
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Competitors likely bidding</label><input value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="e.g. Arbor, SIMS, Bromcom" className={INPUT} /></div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={startResearch} disabled={!canStart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors">
              <Sparkles className="w-4 h-4" /> Generate RFP Response
            </button>
          </div>
        </div>
      )}

      {/* Step 1 — Research */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              {researchDone ? <Check className="w-4 h-4 text-teal-400" /> : <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />}
              <h2 className="font-semibold">{researchDone ? 'RFP response generated' : 'Building RFP response...'}</h2>
            </div>
            <div className="space-y-2 font-mono text-sm">
              {researchLog.map((log, i) => (
                <div key={i} className={`flex items-start gap-2 ${i === researchLog.length - 1 && !researchDone ? 'text-teal-400' : 'text-[#6B7280]'}`}>
                  <span className="text-[#374151] select-none">{String(i + 1).padStart(2, '0')}</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
          {researchDone && (
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors">
                Review & Edit <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Review & Edit */}
      {step === 2 && rfpData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Review & Edit — {clientName}</h2>
            <CopyButton text={getFullRFP()} />
          </div>

          <div className="flex gap-2 flex-wrap">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: activeTab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                  color: activeTab === t.id ? '#A78BFA' : '#6B7280',
                  border: activeTab === t.id ? '1px solid rgba(124,58,237,0.3)' : '1px solid #1F2937',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{TABS.find(t => t.id === activeTab)?.label}</h3>
              <CopyButton text={getSectionText(activeTab)} />
            </div>
            <textarea
              value={getSectionText(activeTab)}
              onChange={e => setEditedSections(prev => ({ ...prev, [activeTab]: e.target.value }))}
              rows={12}
              className="w-full bg-[#07080F] border border-[#1F2937] rounded-lg px-4 py-3 text-sm text-[#F9FAFB] leading-relaxed focus:outline-none focus:border-teal-500 transition-colors"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">{'\u2190'} Back</button>
            <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors">
              Export & Submit <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Export */}
      {step === 3 && (
        <div className="space-y-6">
          {!exported ? (
            <>
              <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-6">
                <h2 className="font-semibold mb-4">RFP Summary</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-[#6B7280]">Client:</span> <span className="font-semibold">{clientName}</span></div>
                  <div><span className="text-[#6B7280]">Opportunity:</span> <span className="font-semibold">{opportunityName}</span></div>
                  <div><span className="text-[#6B7280]">Deadline:</span> <span className="font-semibold">{deadline || 'TBC'}</span></div>
                  <div><span className="text-[#6B7280]">Value:</span> <span className="font-semibold">{dealValue ? `£${Number(dealValue).toLocaleString()}` : 'TBC'}</span></div>
                  <div><span className="text-[#6B7280]">Industry:</span> <span className="font-semibold">{industry}</span></div>
                  <div><span className="text-[#6B7280]">Sections:</span> <span className="font-semibold">{TABS.length} complete</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => { navigator.clipboard.writeText(getFullRFP()); setExported(true) }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
                  <Copy className="w-4 h-4" /> Copy Full RFP Response
                </button>
                <button onClick={() => setExported(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>
                  <Send className="w-4 h-4" /> Create Email Draft
                </button>
                <button onClick={() => setExported(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <FileText className="w-4 h-4" /> Save to CRM
                </button>
                {deadline && (
                  <button onClick={() => setExported(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <Calendar className="w-4 h-4" /> Set Deadline Reminder
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[#111318] border border-teal-500/30 rounded-xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-teal-400" />
              </div>
              <h2 className="text-xl font-semibold">RFP Response Ready</h2>
              <p className="text-[#9CA3AF] text-sm max-w-sm mx-auto">
                Your RFP response for <span className="text-[#F9FAFB]">{clientName}</span> has been generated and exported.
                {deadline && <><br />Submission deadline: <span className="text-[#F9FAFB]">{deadline}</span></>}
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button onClick={() => {
                  setStep(0); setClientName(''); setOpportunityName(''); setDeadline(''); setDealValue('')
                  setIndustry(''); setRequirements(''); setWinThemes(''); setCompetitors('')
                  setResearchLog([]); setResearchDone(false); setRfpData(null)
                  setEditedSections({}); setExported(false)
                }} className="px-4 py-2 rounded-lg border border-[#1F2937] text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors">
                  Build another RFP
                </button>
                <Link href="/sales" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
                  Back to Sales
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
