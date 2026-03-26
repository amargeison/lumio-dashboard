'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Zap, ArrowRight, Clock } from 'lucide-react'
import ExportPdfButton from '@/components/ExportPdfButton'
import { useHasDashboardData, DashboardEmptyState } from '@/components/dashboard/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoadmapItem {
  prediction: string
  confidence: number
  timeline: string
  evidence: string[]
  counterStrategy: string
  threat: 'High' | 'Medium' | 'Low'
}

interface CompetitorRoadmap {
  competitor: string
  emoji: string
  items: RoadmapItem[]
}

interface StrategicAction {
  priority: number
  title: string
  rationale: string
  actions: string[]
  timeframe: string
  effort: 'Low' | 'Medium' | 'High'
  impact: 'Low' | 'Medium' | 'High'
  trigger: string
}

interface MarketMovement {
  trend: string
  emoji: string
  description: string
  forLumio: string
  urgency: 'Act now' | 'Monitor' | 'Prepare'
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROADMAPS: CompetitorRoadmap[] = [
  {
    competitor: 'HubSpot',
    emoji: '🟠',
    items: [
      {
        prediction: 'AI Copilot moves out of enterprise-only to Professional tier',
        confidence: 87,
        timeline: 'Q3 2026',
        threat: 'High',
        evidence: [
          '2× ML Engineer hires specifically citing "Professional tier AI rollout"',
          'INBOUND 2026 session: "The AI CRM — what\'s next for HubSpot" (VP Product speaking)',
          'HubSpot blog: "How SMBs can use AI without a data team" — pushing down-market messaging',
        ],
        counterStrategy: 'HubSpot\'s AI will still require configuration and won\'t have pre-built SMB workflows. Ship your own AI workflow builder now and establish "AI-native automation for SMBs" as your owned territory before Q3.',
      },
      {
        prediction: 'Contact-based pricing replaced with usage tier model',
        confidence: 71,
        timeline: 'H2 2026',
        threat: 'Medium',
        evidence: [
          'New Head of Pricing Strategy hired Feb 2026 (previously Salesforce)',
          'G2 and Capterra: "confusing pricing" in 31% of 3-star reviews — HubSpot is aware',
          'Competitor pricing restructures historically follow review pressure',
        ],
        counterStrategy: 'Maintain your pricing clarity advantage. If HubSpot reprices, update your comparison page immediately. "Lumio was always predictable" is a strong line if HubSpot makes a messy transition.',
      },
      {
        prediction: 'SMB-specific onboarding programme launched',
        confidence: 64,
        timeline: 'Q4 2026',
        threat: 'Medium',
        evidence: [
          'Dedicated Growth Lead — SMB Segment hired March 2026',
          'INBOUND session on "HubSpot for growing teams" submitted',
          'Capterra: "too complex" theme in reviews — they know it and are responding',
        ],
        counterStrategy: 'Own the "set up in a day" narrative now. Create content showing Lumio working end-to-end within 24 hours. Position HubSpot\'s new onboarding as evidence they\'re playing catch-up.',
      },
    ],
  },
  {
    competitor: 'Pipedrive',
    emoji: '🟢',
    items: [
      {
        prediction: 'Partner/reseller program launches with agency certification',
        confidence: 91,
        timeline: 'Q3 2026',
        threat: 'High',
        evidence: [
          'VP of Partnerships hired Mar 2026 (ex-Salesforce SMB channel head)',
          'This is an exact repeat of the playbook at Salesforce in 2019 before SMB partner explosion',
          '3× CSM hires alongside — they\'re building retention infrastructure for a volume push',
        ],
        counterStrategy: 'Move on agency partnerships before Pipedrive locks them in. Identify the 10 most active HubSpot/Pipedrive implementation agencies and approach them with a Lumio partner programme this quarter.',
      },
      {
        prediction: 'Campaigns module becomes the primary acquisition hook for SMBs',
        confidence: 78,
        timeline: 'Q2–Q3 2026',
        threat: 'Medium',
        evidence: [
          'Campaigns now GA — 2 email marketing engineers still hired post-launch',
          'Pipedrive marketing started repositioning from "CRM" to "sales and marketing platform"',
          '"Switch from Mailchimp" content appearing on their blog',
        ],
        counterStrategy: 'Call out the depth gap. Pipedrive Campaigns is email sequences — Lumio is 150 cross-department workflows. Create content explicitly comparing "what Pipedrive Campaigns can and can\'t do."',
      },
      {
        prediction: 'Support/helpdesk module launched (Zendesk replacement positioning)',
        confidence: 58,
        timeline: 'Q4 2026',
        threat: 'Low',
        evidence: [
          '"Switch from Zendesk" guide published — testing market demand before building',
          'No support-specific hires yet but this is consistent with their "full business platform" positioning',
        ],
        counterStrategy: 'Monitor but don\'t react yet. If Pipedrive ships a support module, Lumio\'s SU-01–SU-12 workflows become a key differentiator. Prepare "Lumio with any helpdesk" messaging.',
      },
    ],
  },
  {
    competitor: 'monday.com',
    emoji: '🔴',
    items: [
      {
        prediction: 'Natural language workflow creation ("describe it, we build it")',
        confidence: 82,
        timeline: 'Q4 2026 – Q1 2027',
        threat: 'High',
        evidence: [
          '3× ML Engineers hired Jan–Feb 2026, all citing "NLP automation" and "natural language task creation"',
          '$400M secondary offering: CFO explicitly mentioned "AI automation capabilities"',
          'Sr. PM hired specifically for "Automation Products" — this is a product-level priority',
        ],
        counterStrategy: 'This is the single biggest long-term threat. If monday.com ships "describe your workflow in plain English" before Lumio, the template library advantage shrinks. Build your own NLP workflow builder. The 150 workflows become training data for AI configuration suggestions.',
      },
      {
        prediction: 'monday CRM reaches feature parity with Pipedrive',
        confidence: 74,
        timeline: 'Q3 2026',
        threat: 'Medium',
        evidence: [
          'Dedicated Sr. PM hired for monday CRM',
          'G2 reviews: CRM scores improving quarter-on-quarter for 18 months',
          'Enterprise push (8 AE hires) suggests monday is building CRM credibility before going downmarket',
        ],
        counterStrategy: 'Lumio\'s Twenty CRM is already native and included at £0 licence. Position the "CRM + 150 workflows" bundle vs monday\'s CRM-only offering. Start collecting customer testimonials on the native integration advantage.',
      },
    ],
  },
  {
    competitor: 'Zapier',
    emoji: '⚡',
    items: [
      {
        prediction: 'Pricing model restructured — move away from task-based billing',
        confidence: 78,
        timeline: 'Q3–Q4 2026',
        threat: 'Medium',
        evidence: [
          'Head of Pricing Strategy hired Feb 2026',
          '34% of negative G2 reviews cite task pricing as a reason to leave',
          'Zapier leadership has publicly acknowledged pricing complexity in interviews',
        ],
        counterStrategy: 'If Zapier restructures to flat-rate pricing, their biggest SMB weakness disappears. Update competitive messaging to focus on template depth and SMB-specific workflows rather than pricing. Prepare for this scenario.',
      },
      {
        prediction: 'SMB-specific workflow template library launched',
        confidence: 65,
        timeline: 'Q2–Q3 2026',
        threat: 'Medium',
        evidence: [
          'Template Library PM hired — explicit remit to improve SMB template quality',
          'Zapier blog increasing "SMB automation" content output',
          '5,000+ Zap templates exist but are generic — PM is building department-specific collections',
        ],
        counterStrategy: 'Ship templates faster. 150 is good — 200 is a moat. The template library is the single most defensible asset. Add 5 new workflows per month across departments. Make depth the story.',
      },
    ],
  },
]

const STRATEGIC_ACTIONS: StrategicAction[] = [
  {
    priority: 1,
    title: 'Launch "Switch from HubSpot" and "Switch from Zapier" campaigns immediately',
    rationale: 'HubSpot raised prices 18% in Jan 2026. Zapier has 11 new "too expensive" reviews in 10 days. Both audiences are actively looking for alternatives right now.',
    actions: [
      'Build dedicated comparison landing pages: lumiocms.com/vs/hubspot and /vs/zapier',
      'Target G2 and Capterra visitors on those competitor pages with retargeting ads',
      'Offer free workflow migration — "we\'ll rebuild your top 5 Zaps/Workflows for you"',
      'Create "HubSpot vs Lumio pricing calculator" showing real TCO over 12 months',
      'Launch Google Ads on "HubSpot alternatives", "Zapier alternatives for small business"',
    ],
    timeframe: 'This week',
    effort: 'Medium',
    impact: 'High',
    trigger: 'HubSpot price increase + Zapier review surge',
  },
  {
    priority: 2,
    title: 'Lock in agency partnerships before Pipedrive\'s channel programme launches',
    rationale: 'Pipedrive hired a VP Partnerships from Salesforce in March 2026. Their channel programme will launch Q3 2026. Agency relationships are sticky — whoever owns them in Q2 will own them for 2–3 years.',
    actions: [
      'Identify the 15 most active HubSpot/Pipedrive implementation agencies on Clutch and G2',
      'Approach with a Lumio Partner Programme: revenue share, co-marketing, certified partner badge',
      'Build a partner portal: deal registration, co-branded proposals, training materials',
      'Run one partner webinar per month — "How to pitch Lumio to your SMB clients"',
      'Create a Lumio Agency Certification that agencies can display on their profile',
    ],
    timeframe: 'This month',
    effort: 'High',
    impact: 'High',
    trigger: 'Pipedrive VP Partnerships hire',
  },
  {
    priority: 3,
    title: 'Establish "AI-native automation for SMBs" content territory before Q3',
    rationale: 'HubSpot AI Copilot moves to Professional tier in Q3 2026. monday.com NLP automation ships Q4 2026+. The window to own the "AI automation without enterprise budget" narrative is now.',
    actions: [
      'Publish 4 long-form pieces: "How SMBs are using AI automation in 2026", case studies per department',
      'Create video walkthroughs of 5 AI-powered workflows (Wiki Builder, FAQ Builder, Proposal Gen, CEO Briefing, Trial Scoring)',
      'Submit to Hacker News: "We built 150 AI-powered SMB workflows — here\'s what we learned"',
      'Build SEO content targeting "AI workflow automation SMB", "automate [department] with AI"',
      'Announce monthly "new AI workflow" releases — make it a product ritual',
    ],
    timeframe: 'This quarter',
    effort: 'Medium',
    impact: 'High',
    trigger: 'HubSpot AI + monday.com NLP roadmap signals',
  },
  {
    priority: 4,
    title: 'Accelerate template library to 200 workflows before Zapier closes the gap',
    rationale: 'Zapier hired a Template Library PM specifically to improve SMB depth. They have distribution we don\'t. The template library is Lumio\'s most defensible moat — extend it before they arrive.',
    actions: [
      'Ship 5 new workflows per month (50 more = 200 total) — commit publicly',
      'Prioritise the departments with least coverage: Legal (2), Projects (3), Analytics (2)',
      'Create a "workflow request" page where customers vote on what to build next',
      'Open-source 10 workflows as a distribution play — "Lumio open workflow library"',
      'Write detailed "workflow build" blog posts — SEO for every automation use case',
    ],
    timeframe: 'This quarter',
    effort: 'High',
    impact: 'High',
    trigger: 'Zapier Template Library PM hire',
  },
  {
    priority: 5,
    title: 'Build NLP workflow configuration before monday.com ships it at scale',
    rationale: 'monday.com has 3 ML engineers building "describe your workflow in plain English" automation. This is an 18-month build for them. For Lumio — which already has Claude in every workflow — it\'s a 3-month product sprint.',
    actions: [
      'Build a "describe it" workflow configurator using Claude — user describes what they want, Claude maps it to the 150 templates or builds a custom one',
      'Launch as beta to Growth/Enterprise customers — collect feedback and case studies',
      'Announce publicly before monday.com can — "We shipped NLP automation in 3 months"',
      'Use the 150 workflows as training examples for the AI configurator',
      'Add to product page and demos as the hero feature from Q3 2026',
    ],
    timeframe: 'Q3 2026',
    effort: 'High',
    impact: 'High',
    trigger: 'monday.com NLP automation hiring signal',
  },
]

const MARKET_MOVEMENTS: MarketMovement[] = [
  {
    trend: 'AI automation is becoming table stakes — not a differentiator',
    emoji: '🤖',
    description: 'Every automation platform is adding "AI" to their feature list. By Q4 2026, having AI in your product is the entry bar, not the selling point. The question becomes: which AI automation, for whom, and at what price.',
    forLumio: 'Lumio\'s advantage is specificity — 150 workflows built for exactly the jobs SMBs need to automate. As AI becomes commoditised, the pre-built library becomes more valuable, not less. The depth and quality of templates is the moat, not the AI underneath them.',
    urgency: 'Act now',
  },
  {
    trend: 'Zendesk SMB customers are actively migrating — three platforms chasing them',
    emoji: '🎯',
    description: 'Zendesk raised prices and tightened feature access for SMB tiers in H2 2025. Pipedrive, Freshdesk, and monday.com are all publishing migration guides. There are an estimated 40,000+ SMBs on Zendesk that are in active evaluation mode.',
    forLumio: 'Lumio has SU-01 through SU-12 — 12 support workflows. Build a "Lumio + [any helpdesk]" positioning. You\'re not replacing Zendesk, you\'re making it 10× more powerful. Or you\'re making the cheaper alternative (Freshdesk, Intercom) good enough by automating around its gaps.',
    urgency: 'Act now',
  },
  {
    trend: 'Per-seat pricing backlash — customers want outcome-based or flat-rate models',
    emoji: '💰',
    description: 'B2B software buyers are fatigued by seat-based pricing that scales unpredictably. The tools growing fastest in 2025–2026 tend to have flat-rate or usage-included models. Zapier\'s task model is under pressure. HubSpot\'s contact model is under pressure.',
    forLumio: 'Lumio\'s flat-rate pricing is a genuine market advantage right now. Don\'t change it. Lean into it harder — make it a core part of every comparison page, every sales conversation, every pricing FAQ. "One price, no surprises, ever."',
    urgency: 'Act now',
  },
  {
    trend: 'SMB buyers demanding proof before purchase — trials and ROI calculators win',
    emoji: '📊',
    description: 'In a tighter economic environment, SMBs are doing more due diligence before committing. Free trials, ROI calculators, live demos, and case studies with specific numbers are the conversion drivers. Generic "book a demo" landing pages are losing.',
    forLumio: 'Build an ROI calculator. "At 30 people and 4 departments active, Lumio saves your team 18 hours per week." Add specific workflow ROI stats to each of the 150 workflow pages. Publish 10 case studies with real numbers by Q3 2026.',
    urgency: 'Prepare',
  },
  {
    trend: 'Vertical SaaS eating horizontal automation — industry-specific tools winning',
    emoji: '🏭',
    description: 'Tools built for specific industries (healthcare, legal, construction, recruitment) are growing faster than horizontal platforms. The workflow and compliance requirements are so different that generic automation can\'t serve them well.',
    forLumio: 'Lumio is SMB-horizontal today. Consider building two industry-specific packs in 2026 — "Lumio for Recruitment Agencies" and "Lumio for Professional Services". 15 tailored workflows for each vertical, positioned as a specific product.',
    urgency: 'Monitor',
  },
  {
    trend: 'Open source CRM disrupting the market — Twenty gaining momentum',
    emoji: '◻️',
    description: 'Twenty (the CRM embedded in Lumio) is growing fast on GitHub — 15,000+ stars, v1.0 shipped, Y Combinator-backed. More businesses are choosing open source CRM to avoid vendor lock-in. This is the same pattern that led to WordPress dominating CMSs.',
    forLumio: 'Lumio is uniquely positioned — you ship Twenty as the CRM, removing the £0 licence concern and future-proofing customers against lock-in. This is a major differentiator vs HubSpot and Pipedrive\'s closed-source models. Make it louder in marketing.',
    urgency: 'Act now',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THREAT_CONFIG = {
  High:   { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
  Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  Low:    { color: '#6B7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)' },
}

const EFFORT_COLOR: Record<string, string> = { Low: '#0D9488', Medium: '#F59E0B', High: '#EF4444' }
const IMPACT_COLOR: Record<string, string> = { Low: '#6B7280', Medium: '#F59E0B', High: '#0D9488' }
const URGENCY_CONFIG = {
  'Act now': { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  'Monitor': { color: '#6B7280', bg: 'rgba(107,114,128,0.06)' },
  'Prepare': { color: '#6C3FC5', bg: 'rgba(108,63,197,0.08)' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const hasData = useHasDashboardData('strategy')
  const [tab, setTab]                             = useState<'roadmap' | 'actions' | 'movements'>('roadmap')
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null)
  const [expandedRoadmapItem, setExpandedRoadmapItem] = useState<string | null>(null)
  const [expandedAction, setExpandedAction]       = useState<number | null>(null)

  if (hasData === null) return null
  if (!hasData) return <DashboardEmptyState pageKey="strategy" title="No strategy data yet" description="Upload your competitor research and market data to activate the Strategy module." uploads={[{ key: 'competitors', label: 'Upload Competitor Data (CSV)' }]} />

  return (
    <div className="min-h-screen bg-[#07080F] text-[#F9FAFB]">
      {/* Header */}
      <div className="border-b border-[#1F2937] px-6 py-5">
        <Link href="/strategy/competitor-watch" className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Competitor Watch
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Intelligence Brief</h1>
            <p className="text-[#9CA3AF] text-sm mt-1">What&apos;s coming, what to do about it, and where the market is going.</p>
          </div>
          <ExportPdfButton />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mt-5 border-b border-[#1F2937] -mb-px">
          {([
            { id: 'roadmap',   label: 'Competitor Roadmap' },
            { id: 'actions',   label: `Strategic Actions (${STRATEGIC_ACTIONS.length})` },
            { id: 'movements', label: 'Market Movements' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-purple-500 text-[#F9FAFB]'
                  : 'border-transparent text-[#6B7280] hover:text-[#9CA3AF]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">

        {/* ── Competitor Roadmap tab ────────────────────────────────────────── */}
        {tab === 'roadmap' && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Predictions based on hiring patterns, blog content, conference abstracts, and product signals. Confidence scores reflect strength of evidence.
            </p>
            {ROADMAPS.map(comp => {
              const isExpanded = expandedCompetitor === comp.competitor
              return (
                <div key={comp.competitor} className="bg-[#111318] border border-[#1F2937] rounded-xl overflow-hidden">
                  <button
                    className="w-full text-left p-5 flex items-center gap-3"
                    onClick={() => setExpandedCompetitor(isExpanded ? null : comp.competitor)}
                  >
                    <span className="text-2xl">{comp.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-[#F9FAFB]">{comp.competitor}</div>
                      <div className="text-xs text-[#6B7280]">{comp.items.length} predictions in pipeline</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {comp.items.map((item, i) => {
                        const cfg = THREAT_CONFIG[item.threat]
                        return (
                          <div key={i} className="text-[10px] px-1.5 py-0.5 rounded border font-semibold"
                            style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
                            {item.threat}
                          </div>
                        )
                      })}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6B7280] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#6B7280] flex-shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#1F2937]">
                      {comp.items.map((item, i) => {
                        const key = `${comp.competitor}-${i}`
                        const isItemExpanded = expandedRoadmapItem === key
                        const cfg = THREAT_CONFIG[item.threat]
                        return (
                          <div key={i} className={`${i < comp.items.length - 1 ? 'border-b border-[#1F2937]' : ''}`}>
                            <button
                              className="w-full text-left p-5"
                              onClick={() => setExpandedRoadmapItem(isItemExpanded ? null : key)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded border"
                                      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
                                      {item.threat} threat
                                    </span>
                                    <span className="text-xs text-[#6B7280] flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {item.timeline}
                                    </span>
                                    <span className="text-xs text-[#6B7280]">
                                      {item.confidence}% confidence
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-[#F9FAFB]">{item.prediction}</p>

                                  {/* Confidence bar */}
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-1 bg-[#1F2937] rounded-full overflow-hidden max-w-[120px]">
                                      <div className="h-full rounded-full" style={{
                                        width: `${item.confidence}%`,
                                        backgroundColor: item.confidence >= 80 ? '#EF4444' : item.confidence >= 65 ? '#F59E0B' : '#6B7280'
                                      }} />
                                    </div>
                                    <span className="text-xs text-[#6B7280]">{item.confidence}% confidence</span>
                                  </div>
                                </div>
                                {isItemExpanded ? <ChevronUp className="w-4 h-4 text-[#6B7280] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#6B7280] flex-shrink-0" />}
                              </div>
                            </button>

                            {isItemExpanded && (
                              <div className="px-5 pb-5 space-y-4 border-t border-[#111318] pt-4">
                                {/* Evidence */}
                                <div>
                                  <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">Evidence sources</div>
                                  <ul className="space-y-1.5">
                                    {item.evidence.map((e, ei) => (
                                      <li key={ei} className="flex items-start gap-2 text-sm text-[#9CA3AF]">
                                        <span className="text-[#374151] mt-0.5">·</span> {e}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {/* Counter-strategy */}
                                <div className="rounded-lg p-4 border-l-4 border-purple-500"
                                  style={{ backgroundColor: 'rgba(108,63,197,0.06)' }}>
                                  <div className="text-xs text-purple-400 uppercase tracking-wider mb-2 font-semibold">Counter-strategy</div>
                                  <p className="text-sm text-[#F9FAFB] leading-relaxed">{item.counterStrategy}</p>
                                </div>
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
          </div>
        )}

        {/* ── Strategic Actions tab ─────────────────────────────────────────── */}
        {tab === 'actions' && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Prioritised by urgency and impact. Each action is tied to a specific competitor signal.
            </p>
            {STRATEGIC_ACTIONS.map((action) => {
              const isExpanded = expandedAction === action.priority
              return (
                <div key={action.priority}
                  className={`bg-[#111318] border rounded-xl overflow-hidden transition-colors ${
                    isExpanded ? 'border-purple-500/40' : 'border-[#1F2937]'
                  }`}>
                  <button
                    className="w-full text-left p-5 flex items-start gap-4"
                    onClick={() => setExpandedAction(isExpanded ? null : action.priority)}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        backgroundColor: action.priority === 1 ? 'rgba(239,68,68,0.15)' : action.priority === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(108,63,197,0.1)',
                        color: action.priority === 1 ? '#EF4444' : action.priority === 2 ? '#F59E0B' : '#A78BFA',
                      }}>
                      {action.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-[#6B7280] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {action.timeframe}
                        </span>
                        <span className="text-xs" style={{ color: EFFORT_COLOR[action.effort] }}>
                          Effort: {action.effort}
                        </span>
                        <span className="text-xs" style={{ color: IMPACT_COLOR[action.impact] }}>
                          Impact: {action.impact}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#F9FAFB]">{action.title}</p>
                      {!isExpanded && (
                        <p className="text-xs text-[#6B7280] mt-1 line-clamp-1">{action.rationale}</p>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6B7280] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#6B7280] flex-shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[#1F2937] pt-4 space-y-4">
                      <div className="text-sm text-[#9CA3AF] leading-relaxed">{action.rationale}</div>
                      <div className="rounded-lg p-3 border border-[#1F2937]" style={{ backgroundColor: '#07080F' }}>
                        <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Triggered by</div>
                        <p className="text-xs text-[#9CA3AF]">{action.trigger}</p>
                      </div>
                      <div>
                        <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-3">Specific actions</div>
                        <ul className="space-y-2">
                          {action.actions.map((a, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded-full border border-[#374151] flex items-center justify-center text-[10px] text-[#6B7280] flex-shrink-0 mt-0.5">
                                {i + 1}
                              </div>
                              <span className="text-sm text-[#F9FAFB] leading-relaxed">{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Market Movements tab ──────────────────────────────────────────── */}
        {tab === 'movements' && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Macro trends shaping the SMB automation market. Each one has an implication for how Lumio should position, build, and sell.
            </p>
            {MARKET_MOVEMENTS.map((movement) => {
              const urgency = URGENCY_CONFIG[movement.urgency]
              return (
                <div key={movement.trend} className="bg-[#111318] border border-[#1F2937] rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{movement.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ color: urgency.color, backgroundColor: urgency.bg }}>
                          {movement.urgency}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#F9FAFB]">{movement.trend}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed mb-3">{movement.description}</p>
                  <div className="rounded-lg p-4 border-l-4 border-teal-500"
                    style={{ backgroundColor: 'rgba(13,148,136,0.06)' }}>
                    <div className="text-xs text-teal-400 uppercase tracking-wider mb-2 font-semibold">For Lumio</div>
                    <p className="text-sm text-[#F9FAFB] leading-relaxed">{movement.forLumio}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
