'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Check, X, Minus, Trophy } from 'lucide-react'
import ExportPdfButton from '@/components/ExportPdfButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Criterion {
  id: string
  label: string
  scores: Record<string, number>
  details: Record<string, string>
}

interface Category {
  id: string
  label: string
  emoji: string
  weight: number
  criteria: Criterion[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const COMPETITORS_LIST = ['Lumio', 'HubSpot', 'Pipedrive', 'monday.com', 'Zapier']

const CATEGORIES: Category[] = [
  {
    id: 'automation',
    label: 'Automation Depth',
    emoji: '⚡',
    weight: 30,
    criteria: [
      {
        id: 'workflow_complexity',
        label: 'Workflow complexity & branching',
        scores: { Lumio: 92, HubSpot: 74, Pipedrive: 42, 'monday.com': 67, Zapier: 88 },
        details: {
          Lumio: '150 pre-built workflows with multi-branch logic, conditional routing, retry handling, and AI steps built in. Every workflow is editable.',
          HubSpot: 'Workflows support basic branching with if/then logic. Complex sequences require workarounds. AI steps limited to enterprise tier.',
          Pipedrive: 'Automation is surface-level — trigger-action pairs with limited branching. No multi-step conditional logic. Better than nothing, far from powerful.',
          'monday.com': 'Automations support basic recipes (when X, do Y) with limited conditions. Custom automations possible but require technical setup.',
          Zapier: 'Paths (branching) available but limited to 2 branches without hacks. Filter steps add complexity. Multi-step is possible but unwieldy.',
        },
      },
      {
        id: 'template_library',
        label: 'Industry-specific template library',
        scores: { Lumio: 95, HubSpot: 52, Pipedrive: 38, 'monday.com': 61, Zapier: 69 },
        details: {
          Lumio: '150 workflows across 14 SMB departments. Pre-built for the exact use cases SMBs run — not generic patterns that need heavy customisation.',
          HubSpot: 'Workflow templates exist but are marketing-heavy. Operations, HR, and Finance are thin. Most templates need significant configuration.',
          Pipedrive: 'Very limited template library. Basic sales automation only. Everything else is build-from-scratch.',
          'monday.com': 'Board templates are strong but workflow automation templates are sparse. Better for project management patterns than business process automation.',
          Zapier: 'Zap templates are broad (5,000+) but generic — not SMB-specific. Finding the right one requires significant search time.',
        },
      },
      {
        id: 'cross_dept',
        label: 'Cross-department automation',
        scores: { Lumio: 91, HubSpot: 65, Pipedrive: 30, 'monday.com': 72, Zapier: 85 },
        details: {
          Lumio: 'Built specifically for cross-department workflows. New hire triggers HR, IT, Payroll, and Slack simultaneously. This is the core product vision.',
          HubSpot: 'Strong within marketing/sales stack. Operations Hub helps with cross-department but requires additional licences.',
          Pipedrive: 'Firmly a sales tool. Cross-department automation requires third-party glue (Zapier/Make on top of Pipedrive).',
          'monday.com': 'Boards can span departments. Automations can cross boards. Better than most for project-based cross-team work.',
          Zapier: 'Built for cross-app automation — this is its strength. Limited by task count and complexity of multi-step chains.',
        },
      },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Sales',
    emoji: '🤝',
    weight: 20,
    criteria: [
      {
        id: 'crm_depth',
        label: 'CRM functionality',
        scores: { Lumio: 78, HubSpot: 94, Pipedrive: 89, 'monday.com': 71, Zapier: 8 },
        details: {
          Lumio: 'Twenty CRM embedded — open source, Y Combinator-backed, v1.0 shipped 2025. Full contact, deal, company management. £0 licence. Connected to all 150 workflows natively.',
          HubSpot: 'Best-in-class CRM. Contact, deal, pipeline, forecasting, meeting scheduling, email tracking — all excellent. The benchmark everything else is measured against.',
          Pipedrive: 'Excellent pipeline management. Visual deal board is best-in-class. Less strong on contacts and company data enrichment vs HubSpot.',
          'monday.com': 'monday CRM is a good enough CRM. Improving rapidly. Lacks deal forecasting depth and email tracking quality of HubSpot/Pipedrive.',
          Zapier: 'Not a CRM. Zapier connects CRMs but has no native CRM functionality.',
        },
      },
      {
        id: 'pipeline_automation',
        label: 'Pipeline & deal automation',
        scores: { Lumio: 85, HubSpot: 88, Pipedrive: 79, 'monday.com': 68, Zapier: 55 },
        details: {
          Lumio: 'Deal stage changes trigger cross-department workflows automatically. Proposal generation, contract creation, customer provisioning — all wired to pipeline movement.',
          HubSpot: 'Deal-based workflows are powerful and well-integrated. Stage-based automation, task creation, email sequences all native.',
          Pipedrive: 'Pipeline automation is good for sales-only workflows. Email automation sequences solid. Cross-department limited.',
          'monday.com': 'Deal status automations work but feel bolted on vs native CRM integrations.',
          Zapier: 'Can trigger on CRM changes via integration but requires significant setup. No native deal intelligence.',
        },
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing & Value',
    emoji: '💰',
    weight: 20,
    criteria: [
      {
        id: 'smb_affordability',
        label: 'SMB affordability (10–50 people)',
        scores: { Lumio: 88, HubSpot: 22, Pipedrive: 68, 'monday.com': 61, Zapier: 54 },
        details: {
          Lumio: 'Starter from £299/mo including 20 workflows. Growth £599/mo for 35 workflows. No per-task pricing. No surprise bills. Predictable.',
          HubSpot: 'Professional tier is £378/mo after Jan 2026 price increase. Operations Hub adds another £39/mo. Total cost of ownership for a 20-person company easily exceeds £800/mo.',
          Pipedrive: 'Essential from £14.90/seat/mo is affordable. Advanced £27.90/seat adds automations. Reasonable for pure CRM but add-ons stack up.',
          'monday.com': 'Pro plan £19/seat/mo (min 3 seats). Adds up for larger teams. CRM bolt-on pricing unclear.',
          Zapier: 'Free tier is useless for real automation. Professional starts at ~£55/mo but task limits mean real usage costs much more. Scaling is expensive.',
        },
      },
      {
        id: 'pricing_transparency',
        label: 'Pricing transparency & predictability',
        scores: { Lumio: 91, HubSpot: 38, Pipedrive: 74, 'monday.com': 68, Zapier: 42 },
        details: {
          Lumio: 'Three tiers, fixed price, clear feature gating. No tasks, no contact limits, no surprise overages.',
          HubSpot: 'Notoriously complex pricing. Contact-based pricing means costs scale unpredictably with database growth. Multiple product hubs each priced separately.',
          Pipedrive: 'Per-seat pricing is predictable. Some add-ons (LeadBooster, Campaigns) are separate. Generally more transparent than HubSpot.',
          'monday.com': 'Seat-based pricing is clear but minimum seat counts and annual billing requirements create friction.',
          Zapier: 'Task-based pricing is confusing. A "task" is not always intuitive. Customers regularly hit limits unexpectedly.',
        },
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Intelligence',
    emoji: '🤖',
    weight: 15,
    criteria: [
      {
        id: 'ai_native',
        label: 'AI-native workflow capabilities',
        scores: { Lumio: 88, HubSpot: 61, Pipedrive: 28, 'monday.com': 54, Zapier: 72 },
        details: {
          Lumio: 'Claude integrated into workflows natively — proposal writing, email drafting, sentiment analysis, FAQ generation, wiki building. AI is a step in any workflow, not an add-on.',
          HubSpot: 'AI Copilot in beta. Content assistant for emails/blog is useful. Deal scoring is rule-based. True AI automation still enterprise-gated.',
          Pipedrive: 'AI features are minimal — some email suggestion AI. No workflow intelligence. Roadmap unclear.',
          'monday.com': 'AI features in development (hiring ML engineers). Basic text generation available. Not yet a meaningful AI platform.',
          Zapier: 'AI actions allow Claude/GPT calls in Zaps. Formatter AI helps with data transformation. More AI-capable than most competitors for automation use cases.',
        },
      },
      {
        id: 'ai_insights',
        label: 'Business intelligence & reporting AI',
        scores: { Lumio: 82, HubSpot: 74, Pipedrive: 55, 'monday.com': 69, Zapier: 18 },
        details: {
          Lumio: 'Insights module analyses data across all departments. CEO briefing, cash flow forecasting, trial scoring — all AI-powered with natural language summaries.',
          HubSpot: 'Strong reporting and attribution. Revenue intelligence is good at enterprise tier. SMB reporting is solid.',
          Pipedrive: 'Standard pipeline reporting. Insights add-on improves this. No AI-powered analysis.',
          'monday.com': 'Dashboards and reporting are good. Workdocs starting to include AI summaries. Limited cross-department intelligence.',
          Zapier: 'No business intelligence. Pure automation — not designed for reporting or analysis.',
        },
      },
    ],
  },
  {
    id: 'ux',
    label: 'Ease of Use',
    emoji: '🎨',
    weight: 10,
    criteria: [
      {
        id: 'setup_time',
        label: 'Time to first workflow running',
        scores: { Lumio: 90, HubSpot: 38, Pipedrive: 72, 'monday.com': 65, Zapier: 68 },
        details: {
          Lumio: 'Activate a pre-built workflow in under 5 minutes. Connect tools, configure basics, turn on. No implementation project. No consultant.',
          HubSpot: 'Typical SMB HubSpot implementation takes 4–8 weeks and often requires a Solutions Partner. Complex for first-time buyers.',
          Pipedrive: 'Much faster than HubSpot to get started. CRM setup in hours. Automations take more time.',
          'monday.com': 'Reasonable onboarding for project management. CRM and automation setup add complexity.',
          Zapier: 'Basic Zaps are quick to set up. Multi-step automation requires trial and error. No industry-specific starting points.',
        },
      },
      {
        id: 'non_technical',
        label: 'Non-technical user experience',
        scores: { Lumio: 86, HubSpot: 51, Pipedrive: 78, 'monday.com': 74, Zapier: 59 },
        details: {
          Lumio: 'Built for operations managers and HR leads, not developers. Every workflow is described in plain English. No JSON, no code, no webhooks to configure.',
          HubSpot: 'Marketing-facing features are accessible. Workflow builder requires training. Operations Hub is technical.',
          Pipedrive: 'Clean, sales-focused UI. Non-technical users can manage their pipeline confidently. Automation is harder.',
          'monday.com': 'Generally accessible. Board-based thinking is intuitive. Automation recipes are non-technical.',
          Zapier: 'Zap builder is reasonably accessible but the underlying concepts (triggers, actions, paths) require technical thinking.',
        },
      },
    ],
  },
  {
    id: 'security',
    label: 'Security & Compliance',
    emoji: '🔒',
    weight: 5,
    criteria: [
      {
        id: 'data_residency',
        label: 'EU data residency & compliance',
        scores: { Lumio: 90, HubSpot: 82, Pipedrive: 85, 'monday.com': 78, Zapier: 71 },
        details: {
          Lumio: 'All data stored in AWS eu-west-1 by default. SOC 2 Type II certified. GDPR-compliant data processing. EU region included on all plans.',
          HubSpot: 'EU data centre available. GDPR tools built in. Business Associate Agreements available for regulated industries.',
          Pipedrive: 'EU data hosting available. GDPR compliant. Security documentation is comprehensive.',
          'monday.com': 'EU data centre available on select plans. ISO 27001, SOC 2, GDPR compliant.',
          Zapier: 'SOC 2 Type II. GDPR compliant. Data passes through US servers by default — EU region on Business+ plans.',
        },
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeightedScore(compName: string) {
  let total = 0
  let weightSum = 0
  CATEGORIES.forEach(cat => {
    const catAvg = cat.criteria.reduce((s, c) => s + (c.scores[compName] ?? 0), 0) / cat.criteria.length
    total += catAvg * cat.weight
    weightSum += cat.weight
  })
  return Math.round(total / weightSum)
}

function ScoreBar({ score, isLumio }: { score: number; isLumio: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#1F2937] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{
          width: `${score}%`,
          backgroundColor: isLumio ? '#6C3FC5' : score >= 80 ? '#EF4444' : score >= 60 ? '#F59E0B' : '#374151'
        }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${isLumio ? 'text-purple-400' : score >= 80 ? 'text-red-400' : score >= 60 ? 'text-amber-400' : 'text-[#6B7280]'}`}>
        {score}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComparisonPage() {
  const [visibleCompetitors, setVisibleCompetitors] = useState<string[]>(['HubSpot', 'Pipedrive', 'monday.com', 'Zapier'])
  const [expandedCategory, setExpandedCategory]     = useState<string | null>(null)
  const [expandedCriterion, setExpandedCriterion]   = useState<string | null>(null)

  const allCols = ['Lumio', ...visibleCompetitors]

  function toggleCompetitor(name: string) {
    setVisibleCompetitors(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  return (
    <div className="min-h-screen bg-[#07080F] text-[#F9FAFB]">
      {/* Header */}
      <div className="border-b border-[#1F2937] px-6 py-5">
        <Link href="/strategy/competitor-watch" className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Competitor Watch
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Deep Comparison Matrix</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">Weighted like-for-like across 6 categories. Click any category or criterion to expand.</p>
          </div>
          <ExportPdfButton />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Competitor toggle */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#6B7280]">Comparing against:</span>
          {['HubSpot', 'Pipedrive', 'monday.com', 'Zapier'].map(c => (
            <button key={c} onClick={() => toggleCompetitor(c)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                visibleCompetitors.includes(c)
                  ? 'border-[#374151] bg-[#1F2937] text-[#F9FAFB]'
                  : 'border-[#1F2937] text-[#6B7280]'
              }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Overall scores */}
        <div className="bg-[#111318] border border-[#1F2937] rounded-xl p-5">
          <h2 className="font-semibold mb-4">Overall Weighted Score</h2>
          <div className="space-y-3">
            {allCols.map(name => {
              const score = getWeightedScore(name)
              return (
                <div key={name} className="flex items-center gap-3">
                  <div className={`w-24 text-sm font-medium flex-shrink-0 ${name === 'Lumio' ? 'text-purple-400' : 'text-[#9CA3AF]'}`}>
                    {name === 'Lumio' && <Trophy className="w-3.5 h-3.5 inline mr-1 text-purple-400" />}
                    {name}
                  </div>
                  <ScoreBar score={score} isLumio={name === 'Lumio'} />
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-[#1F2937]">
            <p className="text-xs text-[#6B7280]">
              Weights: Automation 30% · CRM & Sales 20% · Pricing & Value 20% · AI & Intelligence 15% · Ease of Use 10% · Security 5%
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        {CATEGORIES.map(cat => {
          const isExpanded = expandedCategory === cat.id
          return (
            <div key={cat.id} className="bg-[#111318] border border-[#1F2937] rounded-xl overflow-hidden">
              {/* Category header */}
              <button
                className="w-full text-left p-5 flex items-center gap-3"
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
              >
                <span className="text-xl">{cat.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{cat.label}</span>
                    <span className="text-xs text-[#6B7280] bg-[#1F2937] px-2 py-0.5 rounded">
                      {cat.weight}% weight
                    </span>
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5">{cat.criteria.length} criteria</div>
                </div>

                {/* Category scores — mini bars */}
                <div className="hidden lg:flex items-center gap-4">
                  {allCols.map(name => {
                    const avg = Math.round(cat.criteria.reduce((s, c) => s + (c.scores[name] ?? 0), 0) / cat.criteria.length)
                    return (
                      <div key={name} className="text-center">
                        <div className="text-[10px] text-[#6B7280] mb-0.5">{name === 'monday.com' ? 'monday' : name}</div>
                        <div className={`text-sm font-bold ${name === 'Lumio' ? 'text-purple-400' : avg >= 80 ? 'text-red-400' : avg >= 60 ? 'text-amber-400' : 'text-[#6B7280]'}`}>
                          {avg}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6B7280] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#6B7280] flex-shrink-0" />}
              </button>

              {/* Expanded criteria */}
              {isExpanded && (
                <div className="border-t border-[#1F2937]">
                  {cat.criteria.map((crit, ci) => {
                    const critKey = `${cat.id}-${crit.id}`
                    const isCritExpanded = expandedCriterion === critKey
                    return (
                      <div key={crit.id} className={`${ci < cat.criteria.length - 1 ? 'border-b border-[#1F2937]' : ''}`}>
                        <button
                          className="w-full text-left p-4"
                          onClick={() => setExpandedCriterion(isCritExpanded ? null : critKey)}
                        >
                          <div className="text-sm font-medium text-[#F9FAFB] mb-3">{crit.label}</div>
                          <div className="space-y-2">
                            {allCols.map(name => (
                              <div key={name} className="flex items-center gap-3">
                                <div className={`w-20 text-xs flex-shrink-0 ${name === 'Lumio' ? 'text-purple-400 font-semibold' : 'text-[#9CA3AF]'}`}>
                                  {name === 'monday.com' ? 'monday' : name}
                                </div>
                                <ScoreBar score={crit.scores[name] ?? 0} isLumio={name === 'Lumio'} />
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-xs text-[#6B7280]">
                            {isCritExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isCritExpanded ? 'Hide detail' : 'See detail for each competitor'}
                          </div>
                        </button>

                        {isCritExpanded && (
                          <div className="px-4 pb-4 space-y-2 border-t border-[#111318] pt-4">
                            {allCols.map(name => (
                              <div key={name} className={`rounded-lg p-3 ${name === 'Lumio' ? 'border border-purple-500/30' : 'border border-[#1F2937]'}`}
                                style={{ backgroundColor: name === 'Lumio' ? 'rgba(108,63,197,0.06)' : '#07080F' }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold ${name === 'Lumio' ? 'text-purple-400' : 'text-[#9CA3AF]'}`}>
                                    {name}
                                  </span>
                                  <span className={`text-xs font-bold ml-auto ${
                                    crit.scores[name] >= 80 && name !== 'Lumio' ? 'text-red-400' :
                                    crit.scores[name] >= 60 && name !== 'Lumio' ? 'text-amber-400' :
                                    name === 'Lumio' ? 'text-purple-400' : 'text-[#6B7280]'
                                  }`}>
                                    {crit.scores[name]}
                                  </span>
                                </div>
                                <p className="text-xs text-[#9CA3AF] leading-relaxed">{crit.details[name]}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Strongest advantages summary */}
        <div className="bg-[#111318] border border-purple-500/30 rounded-xl p-6" style={{ backgroundColor: 'rgba(108,63,197,0.04)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-purple-300">Lumio&apos;s Strongest Advantages</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Industry-specific template library', detail: 'Score 95 vs nearest competitor 69. 150 pre-built workflows is the clearest moat — it takes years to build and validate.' },
              { label: 'SMB affordability', detail: 'Score 88 vs HubSpot 22. Pricing transparency is a major buying signal at SMB. HubSpot\'s Jan 2026 increase makes the gap wider.' },
              { label: 'Time to first workflow', detail: 'Score 90 vs HubSpot 38. "Working in a day, not a quarter" is a genuine differentiator for time-poor SMB operators.' },
              { label: 'Cross-department automation', detail: 'Score 91 — the most complete cross-department automation story at SMB price points. No one else bundles CRM + 14 departments.' },
              { label: 'AI-native at SMB price', detail: 'Claude in every workflow at Growth pricing. HubSpot gates this to enterprise. This is a window that will close — use it now.' },
              { label: 'Pricing predictability', detail: 'Score 91 vs Zapier 42. No task limits, no contact overages. Growing SMBs hate surprise bills — this is a real conversion driver.' },
            ].map(a => (
              <div key={a.label} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-[#F9FAFB]">{a.label}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
