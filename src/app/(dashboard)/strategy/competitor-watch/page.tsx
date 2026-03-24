'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Target, RefreshCw, Clock, Flame, AlertTriangle, ArrowUpRight,
  ExternalLink, Filter, Briefcase, Globe, ChevronRight,
  TrendingUp, TrendingDown, Sparkles, BarChart3, Eye,
} from 'lucide-react'
import ExportPdfButton from '@/components/ExportPdfButton'

// ─── Types ────────────────────────────────────────────────────────────────────

type Strength = 'Critical' | 'High' | 'Medium' | 'Low'
type SignalType = 'pricing' | 'hiring' | 'launch' | 'review' | 'funding' | 'blog' | 'conference' | 'patent'

interface Competitor {
  id: string
  name: string
  emoji: string
  category: string
  threatScore: number
  overlapScore: number
  momentumScore: number
  pricingScore: number
  summary: string
  lastSignal: string
  lastSignalDate: string
  signalCount: number
}

interface Signal {
  id: string
  competitor: string
  type: SignalType
  strength: Strength
  title: string
  detail: string
  opportunityScore: number
  threatScore: number
  date: string
  source: string
  action: string
}

interface JobSignal {
  competitor: string
  emoji: string
  roles: { title: string; count: number; signal: string; timeline: string }[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const COMPETITORS: Competitor[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    emoji: '🟠',
    category: 'CRM + Marketing Automation',
    threatScore: 78,
    overlapScore: 85,
    momentumScore: 62,
    pricingScore: 24,
    summary: 'Raised Professional tier 18% in Jan 2026. AI copilot still enterprise-gated. Losing SMB reviews to simpler tools.',
    lastSignal: 'Pricing page changed — Professional tier up 18%',
    lastSignalDate: '2 days ago',
    signalCount: 14,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    emoji: '🟢',
    category: 'Sales CRM',
    threatScore: 61,
    overlapScore: 72,
    momentumScore: 74,
    pricingScore: 58,
    summary: 'Aggressively targeting Zendesk customers with a migration guide. Launched Campaigns module — entering marketing automation.',
    lastSignal: 'Published "Switch from Zendesk" migration guide',
    lastSignalDate: '5 days ago',
    signalCount: 9,
  },
  {
    id: 'monday',
    name: 'monday.com',
    emoji: '🔴',
    category: 'Work OS + CRM',
    threatScore: 55,
    overlapScore: 68,
    momentumScore: 81,
    pricingScore: 46,
    summary: 'Monday CRM growing fast — 3 ML engineers hired in 6 weeks. Strong G2 momentum. No SMB-specific automation library.',
    lastSignal: '3 ML engineer hires posted in 6 weeks',
    lastSignalDate: '1 week ago',
    signalCount: 11,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    emoji: '⚡',
    category: 'Automation Platform',
    threatScore: 47,
    overlapScore: 91,
    momentumScore: 53,
    pricingScore: 42,
    summary: 'Task-based pricing is a growing complaint on G2. "Too expensive for small teams" appearing in 34% of negative reviews.',
    lastSignal: 'G2 review surge — 11 new "too expensive" reviews',
    lastSignalDate: '3 days ago',
    signalCount: 7,
  },
]

const SIGNALS: Signal[] = [
  {
    id: 's1',
    competitor: 'HubSpot',
    type: 'pricing',
    strength: 'Critical',
    title: 'HubSpot Professional tier raised 18% — £320/mo → £378/mo',
    detail: 'Pricing page hash changed on 14 Mar 2026. Professional (5 seats) now £378/mo. No announcement. Existing customers grandfathered for 90 days. This is the second increase in 12 months.',
    opportunityScore: 91,
    threatScore: 12,
    date: '14 Mar 2026',
    source: 'Pricing page monitor',
    action: 'Update positioning to call out the gap. Add a "Lumio vs HubSpot pricing" page. Run targeted ads to HubSpot customers around renewal time.',
  },
  {
    id: 's2',
    competitor: 'Zapier',
    type: 'review',
    strength: 'Critical',
    title: 'G2 review surge — 11 "too expensive for small teams" reviews in 10 days',
    detail: 'Trustpilot and G2 both showing a spike. Common themes: task limits, confusing pricing, no industry-specific templates. 34% of negative reviews now mention cost vs value.',
    opportunityScore: 88,
    threatScore: 8,
    date: '11 Mar 2026',
    source: 'G2 + Trustpilot monitor',
    action: 'Create a "Switch from Zapier" landing page. Run retargeting to Zapier\'s G2 profile visitors. Offer free migration of their existing Zaps.',
  },
  {
    id: 's3',
    competitor: 'Pipedrive',
    type: 'blog',
    strength: 'High',
    title: 'Pipedrive published "How to switch from Zendesk in 48 hours"',
    detail: 'Full migration guide targeting Zendesk customers — CSV import, workflow mapping, agent setup. This is a deliberate land-grab on Zendesk\'s struggling SMB segment. Their support module is now feature-complete enough to compete directly.',
    opportunityScore: 74,
    threatScore: 41,
    date: '9 Mar 2026',
    source: 'RSS blog monitor',
    action: 'Publish a counter-guide. Position Lumio\'s 150 workflows as what Pipedrive still can\'t offer — pre-built SMB automation alongside CRM.',
  },
  {
    id: 's4',
    competitor: 'monday.com',
    type: 'hiring',
    strength: 'High',
    title: '3 ML Engineers hired — natural language workflow builder inbound',
    detail: 'Three ML Engineer roles posted Jan–Feb 2026, all citing "automation intelligence" and "natural language task creation". Combined with a Sr. PM post for "Automation Products", this signals a major push into AI-native workflows — likely 9–12 months out.',
    opportunityScore: 45,
    threatScore: 72,
    date: '5 Mar 2026',
    source: 'LinkedIn job monitor',
    action: 'Accelerate your own AI workflow builder. Establish the "AI-native automation for SMBs" narrative now before monday.com can claim it.',
  },
  {
    id: 's5',
    competitor: 'HubSpot',
    type: 'conference',
    strength: 'High',
    title: 'INBOUND 2026 talk abstract: "The AI CRM — what\'s next for HubSpot"',
    detail: 'Session abstract published on INBOUND website. Speaker is HubSpot VP Product. Keywords: "conversational automation", "AI deal scoring", "revenue intelligence". These are previews of 2026 H2 roadmap — they won\'t announce without shipping 60–90 days later.',
    opportunityScore: 38,
    threatScore: 68,
    date: '3 Mar 2026',
    source: 'Conference abstract monitor',
    action: 'Monitor INBOUND session for specifics. Prepare counter-positioning for AI deal scoring — Lumio can ship faster with fewer enterprise constraints.',
  },
  {
    id: 's6',
    competitor: 'Pipedrive',
    type: 'launch',
    strength: 'High',
    title: 'Pipedrive Campaigns GA — now a direct email marketing competitor',
    detail: 'Campaigns module exited beta and is now GA across all plans. Includes email sequences, list segmentation, and basic A/B testing. This brings Pipedrive into direct competition with Mailchimp and ActiveCampaign — and indirectly with Lumio\'s Marketing department.',
    opportunityScore: 42,
    threatScore: 58,
    date: '28 Feb 2026',
    source: 'ProductHunt + RSS monitor',
    action: 'Position Lumio Marketing workflows as more powerful (150 cross-department automations vs single-channel email). Update competitive comparison to call this out.',
  },
  {
    id: 's7',
    competitor: 'HubSpot',
    type: 'review',
    strength: 'Medium',
    title: 'Capterra: "too complex for a 20-person company" theme increasing',
    detail: 'Capterra review analysis shows "complex" and "overwhelming" appearing in 28% of 2-3 star reviews in the last 90 days — up from 19% in the prior period. Onboarding and setup time are the top frustrations.',
    opportunityScore: 79,
    threatScore: 5,
    date: '25 Feb 2026',
    source: 'Capterra review monitor',
    action: 'Lean into simplicity messaging. "Set up in a day, not a quarter" is a direct wedge. Run comparison content targeting HubSpot\'s Capterra profile.',
  },
  {
    id: 's8',
    competitor: 'monday.com',
    type: 'funding',
    strength: 'Medium',
    title: 'monday.com secondary offering — $400M raised to fund AI expansion',
    detail: 'Filed with SEC on 20 Feb. CFO statement explicitly mentions "doubling down on AI automation capabilities" and "expanding into new verticals". More money = faster execution. Monday CRM is the likely beneficiary.',
    opportunityScore: 22,
    threatScore: 61,
    date: '21 Feb 2026',
    source: 'SEC filing monitor',
    action: 'No immediate action needed — this is 12–18 month signal. But it confirms monday.com is a long-term threat to watch closely.',
  },
  {
    id: 's9',
    competitor: 'Zapier',
    type: 'patent',
    strength: 'Medium',
    title: 'Patent filed: "Dynamic workflow orchestration with context-aware AI routing"',
    detail: 'USPTO application 20260234187 filed Feb 2026. Claims cover AI-driven step routing based on historical execution data. If granted, could affect how other automation platforms implement similar features — though enforcement against SMB tools is unlikely.',
    opportunityScore: 15,
    threatScore: 34,
    date: '18 Feb 2026',
    source: 'USPTO patent monitor',
    action: 'Flag to legal team. Low risk for now but worth monitoring if Zapier starts enforcing aggressively.',
  },
  {
    id: 's10',
    competitor: 'Pipedrive',
    type: 'hiring',
    strength: 'Medium',
    title: 'VP of Partnerships hired — channel program expansion incoming',
    detail: 'LinkedIn shows a VP Partnerships start date of 1 Mar 2026. Previous role: head of channel at Salesforce SMB. This is a classic signal that a partner/reseller program is being built — expect a marketplace or referral push in Q3 2026.',
    opportunityScore: 31,
    threatScore: 42,
    date: '14 Feb 2026',
    source: 'LinkedIn job monitor',
    action: 'Accelerate Lumio\'s own partner program before Pipedrive locks in the key agency relationships.',
  },
  {
    id: 's11',
    competitor: 'HubSpot',
    type: 'blog',
    strength: 'Low',
    title: 'HubSpot blog: "How SMBs can use AI without a data team"',
    detail: 'Content targeting the SMB segment directly — unusual for HubSpot who typically produces enterprise content. They\'re pushing down-market. The post is thin on detail but the intent is clear.',
    opportunityScore: 55,
    threatScore: 18,
    date: '10 Feb 2026',
    source: 'RSS blog monitor',
    action: 'Publish a better version. Own the "AI automation for SMBs" content category. HubSpot can\'t be as specific or SMB-native as Lumio can.',
  },
  {
    id: 's12',
    competitor: 'monday.com',
    type: 'launch',
    strength: 'Low',
    title: 'monday.com App Store: 12 new integrations published',
    detail: 'Xero, QuickBooks, Sage, Freshdesk, Intercom, Zendesk, and 6 others added to monday\'s integration marketplace. These are all Lumio integration targets — the battleground for SMB tool connectivity is widening.',
    opportunityScore: 28,
    threatScore: 25,
    date: '5 Feb 2026',
    source: 'ProductHunt + changelog monitor',
    action: 'Ensure Lumio\'s native integrations for these tools are positioned clearly. "Native" vs "App Store bolt-on" is a meaningful distinction.',
  },
]

const JOB_SIGNALS: JobSignal[] = [
  {
    competitor: 'HubSpot',
    emoji: '🟠',
    roles: [
      {
        title: 'Staff ML Engineer — Automation Intelligence',
        count: 2,
        signal: 'Building AI-powered workflow suggestions and auto-configuration. Direct competitor to Lumio\'s AI workflow engine.',
        timeline: '9–12 months to ship',
      },
      {
        title: 'Sr. Product Manager — AI Copilot',
        count: 1,
        signal: 'AI copilot is moving beyond beta. Enterprise-only today — this PM will push it into Professional tier, which is Lumio\'s direct market.',
        timeline: '6–9 months',
      },
      {
        title: 'Growth Lead — SMB Segment',
        count: 1,
        signal: 'HubSpot explicitly targeting SMBs with a dedicated growth hire. They\'ve traditionally ignored sub-50 employee companies. Something has changed.',
        timeline: 'Immediate — already running campaigns',
      },
    ],
  },
  {
    competitor: 'Pipedrive',
    emoji: '🟢',
    roles: [
      {
        title: 'VP of Partnerships',
        count: 1,
        signal: 'Channel program building. Expect Pipedrive-certified agencies and resellers by Q3 2026. Will lock in agency relationships that could otherwise choose Lumio.',
        timeline: 'Q3 2026 launch',
      },
      {
        title: 'Email Marketing Engineer',
        count: 2,
        signal: 'Campaigns module is live but incomplete. Two engineers here = sequence builder, A/B testing, and deliverability tooling incoming.',
        timeline: '4–6 months',
      },
      {
        title: 'Customer Success Manager (SMB)',
        count: 3,
        signal: 'Scaling customer success for SMBs post-Campaigns launch. They\'re betting this moves up-tier and need retention support.',
        timeline: 'Immediate',
      },
    ],
  },
  {
    competitor: 'monday.com',
    emoji: '🔴',
    roles: [
      {
        title: 'ML Engineer — NLP Automation',
        count: 3,
        signal: 'Natural language workflow creation. "Describe what you want to automate" → monday builds the workflow. If executed well, this is a genuine threat to every automation tool including Lumio.',
        timeline: '9–15 months to ship',
      },
      {
        title: 'Sr. PM — monday CRM',
        count: 1,
        signal: 'CRM module is being treated as a first-class product, not a bolt-on. A dedicated PM here accelerates the feature roadmap significantly.',
        timeline: '6–9 months for major features',
      },
      {
        title: 'Enterprise Account Executive',
        count: 8,
        signal: 'Moving upmarket. Enterprise AE hiring at this volume typically precedes a repackaged Enterprise tier. Not a direct SMB threat but reduces their SMB focus.',
        timeline: 'Happening now',
      },
    ],
  },
  {
    competitor: 'Zapier',
    emoji: '⚡',
    roles: [
      {
        title: 'Head of Pricing Strategy',
        count: 1,
        signal: 'New Head of Pricing = pricing model change coming. The task-based model is under pressure. Expect a seat-based or usage-tier restructure in 6–9 months. This could be good or bad for Lumio.',
        timeline: '6–9 months',
      },
      {
        title: 'Template Library PM',
        count: 1,
        signal: 'Zapier knows its template library is weak vs Lumio\'s 150 workflows. This PM will close the gap. Ship more templates faster.',
        timeline: '3–6 months',
      },
    ],
  },
]

// ─── Product Comparison Data ──────────────────────────────────────────────────

interface ProductComparison {
  closestProduct: string
  table: { feature: string; competitor: string; lumio: string; edge: string }[]
  pricing: string[]
  pros: string[]
  cons: string[]
}

const PRODUCT_COMPARISONS: Record<string, ProductComparison> = {
  hubspot: {
    closestProduct: 'HubSpot Operations Hub + Marketing Hub',
    table: [
      { feature: 'Workflow automation', competitor: 'Yes — complex builder',          lumio: 'Yes — no-code, faster setup',  edge: 'Lumio'   },
      { feature: 'Department coverage', competitor: 'Sales/Marketing focus',           lumio: 'All 14 departments',           edge: 'Lumio'   },
      { feature: 'CRM built-in',        competitor: 'Yes — market leading',            lumio: 'Basic (via Twenty OSS)',        edge: 'HubSpot' },
      { feature: 'AI features',         competitor: 'AI copilot (enterprise only)',     lumio: 'AI insights, voice, briefings', edge: 'Lumio'   },
      { feature: 'Reporting',           competitor: 'Advanced, customisable',           lumio: 'Good, growing',                edge: 'HubSpot' },
      { feature: 'Setup time',          competitor: 'Weeks–months',                    lumio: 'Days',                         edge: 'Lumio'   },
      { feature: 'UK SME fit',          competitor: 'Poor — enterprise pricing',        lumio: 'Built for UK SMEs',            edge: 'Lumio'   },
    ],
    pricing: [
      'Starter: $20/user/month',
      'Professional: $890/month (up 18% Jan 2026)',
      'Enterprise: $3,600/month',
      'vs Lumio: significantly cheaper, no per-user penalty',
    ],
    pros: [
      'Covers every department, not just sales/marketing',
      'No-code workflow builder — faster to implement',
      'Fraction of the cost — no surprise add-ons',
      'Built for UK SMEs — GDPR-first, GBP pricing',
      'AI features available at all tiers',
    ],
    cons: [
      'HubSpot CRM is more mature and feature-rich',
      'Larger ecosystem of integrations',
      'Better brand recognition — easier internal sell',
    ],
  },
  pipedrive: {
    closestProduct: 'Pipedrive + Campaigns add-on',
    table: [
      { feature: 'Sales pipeline',       competitor: 'Excellent — core product', lumio: 'Good via Sales & CRM',         edge: 'Pipedrive' },
      { feature: 'Marketing automation', competitor: 'New Campaigns module',      lumio: 'Built-in marketing dept',      edge: 'Lumio'     },
      { feature: 'Department coverage',  competitor: 'Sales only',                lumio: 'All 14 departments',           edge: 'Lumio'     },
      { feature: 'Workflow automation',  competitor: 'Limited',                   lumio: 'Full no-code builder',         edge: 'Lumio'     },
      { feature: 'AI features',          competitor: 'Basic',                     lumio: 'AI insights + voice',          edge: 'Lumio'     },
      { feature: 'Reporting',            competitor: 'Good',                      lumio: 'Growing',                      edge: 'Pipedrive' },
      { feature: 'Setup time',           competitor: 'Days',                      lumio: 'Days',                         edge: 'Draw'      },
    ],
    pricing: [
      'Essential: $14/user/month',
      'Advanced: $34/user/month',
      'Professional: $49/user/month',
      'Power: $64/user/month',
      'vs Lumio: comparable entry price but Lumio covers more',
    ],
    pros: [
      'Full business platform vs sales-only tool',
      'Workflow automation across all departments',
      'No per-user pricing trap as team grows',
      'AI insights built in at all tiers',
      'Better for operations-heavy businesses',
    ],
    cons: [
      'Pipedrive pipeline UX is best-in-class',
      'More third-party integrations available',
      'Larger sales-focused community and resources',
    ],
  },
  monday: {
    closestProduct: 'monday Work OS + monday CRM',
    table: [
      { feature: 'Project management',  competitor: 'Excellent',                    lumio: 'Basic',                        edge: 'monday.com' },
      { feature: 'CRM',                 competitor: 'Good — growing fast',           lumio: 'Basic (via Twenty)',            edge: 'monday.com' },
      { feature: 'Workflow automation', competitor: 'Yes — board-based',             lumio: 'Yes — department-based',       edge: 'Draw'       },
      { feature: 'Department coverage', competitor: 'Flexible boards',               lumio: '14 dedicated depts',           edge: 'Lumio'      },
      { feature: 'AI features',         competitor: '3 ML engineers hired — growing',lumio: 'AI insights + voice',          edge: 'Draw'       },
      { feature: 'SME pricing',         competitor: 'Gets expensive fast',            lumio: 'Flat rate',                   edge: 'Lumio'      },
      { feature: 'UK focus',            competitor: 'Global',                         lumio: 'UK-first',                    edge: 'Lumio'      },
    ],
    pricing: [
      'Basic: $12/user/month (min 3 seats)',
      'Standard: $14/user/month',
      'Pro: $24/user/month',
      'Enterprise: custom',
      'vs Lumio: similar entry but scales poorly for larger teams',
    ],
    pros: [
      'Purpose-built departments vs generic boards',
      'Automated workflows built in — no manual setup',
      'Better value as team grows — no seat penalties',
      'UK SME focus — better fit for target market',
      'Unified platform — no need for CRM add-on',
    ],
    cons: [
      'monday.com project management is superior',
      'Much larger marketplace and template library',
      'Better known — easier board approval',
    ],
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STRENGTH_CONFIG: Record<Strength, { color: string; bg: string; border: string }> = {
  Critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
  High:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  Medium:   { color: '#6C3FC5', bg: 'rgba(108,63,197,0.08)', border: 'rgba(108,63,197,0.25)' },
  Low:      { color: '#6B7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)' },
}

const TYPE_ICON: Record<SignalType, string> = {
  pricing:    '💰',
  hiring:     '👥',
  launch:     '🚀',
  review:     '⭐',
  funding:    '💵',
  blog:       '📝',
  conference: '🎤',
  patent:     '📜',
}

function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={52} height={52} className="-rotate-90">
          <circle cx={26} cy={26} r={r} fill="none" stroke="#1F2937" strokeWidth={4} />
          <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <span className="text-[10px] text-center leading-tight" style={{ color: '#6B7280' }}>{label}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompetitorWatchPage() {
  const [tab, setTab]                       = useState<'overview' | 'signals' | 'jobs'>('overview')
  const [scanning, setScanning]             = useState(false)
  const [lastScanned]                       = useState('Today at 06:00')
  const [strengthFilter, setStrengthFilter] = useState<string>('All')
  const [competitorFilter, setCompetitorFilter] = useState<string>('All')
  const [expandedSignal, setExpandedSignal]           = useState<string | null>(null)
  const [expandedJob, setExpandedJob]                 = useState<string | null>(null)
  const [expandedComparison, setExpandedComparison]   = useState<string | null>(null)

  const filteredSignals = SIGNALS.filter(s => {
    if (strengthFilter !== 'All' && s.strength !== strengthFilter) return false
    if (competitorFilter !== 'All' && s.competitor !== competitorFilter) return false
    return true
  })

  async function runScan() {
    setScanning(true)
    await new Promise(r => setTimeout(r, 3200))
    setScanning(false)
  }

  return (
    <div className="min-h-screen bg-[#07080F] text-[#F9FAFB]">
      {/* Header */}
      <div className="border-b border-[#1F2937] px-6 py-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Competitor Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold">Competitor Watch</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <Clock className="w-3.5 h-3.5" /> Last scan: {lastScanned}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <Flame className="w-3.5 h-3.5 text-red-400" /> {SIGNALS.filter(s => s.strength === 'Critical').length} critical signals
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ExportPdfButton />
            <Link href="/strategy/competitor-watch/comparison"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1F2937] text-sm text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors">
              <BarChart3 className="w-4 h-4" /> Comparison Matrix
            </Link>
            <Link href="/strategy/competitor-watch/intelligence"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1F2937] text-sm text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors">
              <Sparkles className="w-4 h-4" /> Intelligence Brief
            </Link>
            <button
              onClick={runScan}
              disabled={scanning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning…' : 'Run Full Scan'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mt-5 border-b border-[#1F2937] -mb-px">
          {([
            { id: 'overview', label: 'Competitor Overview' },
            { id: 'signals',  label: `Signal Feed (${SIGNALS.length})` },
            { id: 'jobs',     label: 'Job Intelligence' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-red-400 text-[#F9FAFB]'
                  : 'border-transparent text-[#6B7280] hover:text-[#9CA3AF]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">

        {/* ── Overview tab ──────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">

            {/* Product Comparison */}
            <div className="bg-[#111318] border border-[#1F2937] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#F9FAFB]">Product Comparison</h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">How Lumio stacks up against key competitors across core feature areas</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1F2937]">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#4B5563] w-44">Feature</th>
                      {[
                        { name: 'Lumio', color: '#0D9488', bg: 'rgba(13,148,136,0.1)' },
                        { name: 'HubSpot', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
                        { name: 'Pipedrive', color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
                        { name: 'monday.com', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                      ].map(c => (
                        <th key={c.name} className="px-4 py-3 text-xs font-semibold text-center"
                          style={{ color: c.color }}>
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'All-in-one platform',       lumio: '✅', hubspot: '✅', pipedrive: '⚠️', monday: '✅' },
                      { feature: 'Built-in workflow automation', lumio: '✅', hubspot: '⚠️', pipedrive: '❌', monday: '⚠️' },
                      { feature: 'CRM & Sales pipeline',       lumio: '✅', hubspot: '✅', pipedrive: '✅', monday: '✅' },
                      { feature: 'HR & People management',     lumio: '✅', hubspot: '❌', pipedrive: '❌', monday: '⚠️' },
                      { feature: 'Partner management',         lumio: '✅', hubspot: '⚠️', pipedrive: '❌', monday: '❌' },
                      { feature: 'AI Insights dashboard',      lumio: '✅', hubspot: '⚠️', pipedrive: '❌', monday: '⚠️' },
                      { feature: 'SMB pricing (<£200/mo)',     lumio: '✅', hubspot: '❌', pipedrive: '✅', monday: '⚠️' },
                      { feature: 'Setup in under 30 min',      lumio: '✅', hubspot: '❌', pipedrive: '⚠️', monday: '⚠️' },
                    ].map((row, i) => (
                      <tr key={row.feature}
                        className="border-b border-[#1F2937] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-xs text-[#9CA3AF]">{row.feature}</td>
                        <td className="px-4 py-3 text-center text-sm">{row.lumio}</td>
                        <td className="px-4 py-3 text-center text-sm">{row.hubspot}</td>
                        <td className="px-4 py-3 text-center text-sm">{row.pipedrive}</td>
                        <td className="px-4 py-3 text-center text-sm">{row.monday}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-4 px-5 py-3 border-t border-[#1F2937]">
                <span className="text-xs text-[#4B5563]">✅ Full support</span>
                <span className="text-xs text-[#4B5563]">⚠️ Partial / add-on</span>
                <span className="text-xs text-[#4B5563]">❌ Not available</span>
              </div>
            </div>

            {/* Competitor summary cards */}
            <div className="space-y-4">
            {COMPETITORS.map(comp => (
              <div key={comp.id} className="bg-[#111318] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#374151] transition-colors">
                <div className="p-5">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Identity */}
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                      <div className="text-3xl">{comp.emoji}</div>
                      <div>
                        <div className="font-bold text-[#F9FAFB]">{comp.name}</div>
                        <div className="text-xs text-[#6B7280]">{comp.category}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-[#6B7280]">{comp.signalCount} signals</span>
                          <span className="text-[10px] text-[#374151]">·</span>
                          <span className="text-[10px] text-[#6B7280]">Last: {comp.lastSignalDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score rings */}
                    <div className="flex items-center gap-5 flex-wrap">
                      <ScoreRing score={comp.threatScore}   color="#EF4444" label="Threat" />
                      <ScoreRing score={comp.overlapScore}  color="#F59E0B" label="Overlap" />
                      <ScoreRing score={comp.momentumScore} color="#6C3FC5" label="Momentum" />
                      <ScoreRing score={comp.pricingScore}  color="#0D9488" label="Price Comp." />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => { setTab('signals'); setCompetitorFilter(comp.name) }}
                        className="px-3 py-1.5 rounded-lg border border-[#1F2937] text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-[#374151] transition-colors"
                      >
                        View signals
                      </button>
                    </div>
                  </div>

                  {/* Summary + last signal */}
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-[#07080F] rounded-lg p-3">
                      <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Summary</div>
                      <p className="text-xs text-[#9CA3AF] leading-relaxed">{comp.summary}</p>
                    </div>
                    <div className="bg-[#07080F] rounded-lg p-3">
                      <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Latest signal</div>
                      <p className="text-xs text-[#F9FAFB]">{comp.lastSignal}</p>
                      <p className="text-[10px] text-[#6B7280] mt-1">{comp.lastSignalDate}</p>
                    </div>
                  </div>

                  {/* Product comparison expandable */}
                  {PRODUCT_COMPARISONS[comp.id] && (() => {
                    const cmp = PRODUCT_COMPARISONS[comp.id]
                    const isOpen = expandedComparison === comp.id
                    return (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedComparison(isOpen ? null : comp.id)}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                          style={{ color: isOpen ? '#A78BFA' : '#6B7280' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#A78BFA' }}
                          onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLButtonElement).style.color = '#6B7280' }}
                        >
                          {isOpen ? 'Hide product comparison ↑' : 'View product comparison →'}
                        </button>
                        {isOpen && (
                          <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid #2D2057' }}>
                            {/* Header */}
                            <div className="px-4 py-3" style={{ backgroundColor: 'rgba(108,63,197,0.06)', borderBottom: '1px solid #2D2057' }}>
                              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#6B7280' }}>Closest product match: </span>
                              <span className="text-xs font-semibold" style={{ color: '#A78BFA' }}>{cmp.closestProduct}</span>
                            </div>
                            {/* Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0f0e17' }}>
                                    <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: '#4B5563', width: '28%' }}>Feature</th>
                                    <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: '#F97316' }}>{comp.name}</th>
                                    <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: '#0D9488' }}>Lumio</th>
                                    <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-wider" style={{ color: '#6B7280', width: '12%' }}>Edge</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cmp.table.map((row, i) => (
                                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#07080F' : '#0d0c13', borderBottom: '1px solid #1A1F2E' }}>
                                      <td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{row.feature}</td>
                                      <td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{row.competitor}</td>
                                      <td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{row.lumio}</td>
                                      <td className="px-4 py-2.5 font-semibold" style={{ color: row.edge === 'Lumio' ? '#0D9488' : row.edge === 'Draw' ? '#6B7280' : '#F97316' }}>{row.edge}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {/* Pricing */}
                            <div className="px-4 py-3" style={{ backgroundColor: '#0d0c13', borderTop: '1px solid #1F2937' }}>
                              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#6B7280' }}>Pricing</div>
                              <div className="flex flex-wrap gap-2">
                                {cmp.pricing.map((p, i) => (
                                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                                    style={{ backgroundColor: '#1F2937', color: i === cmp.pricing.length - 1 ? '#0D9488' : '#9CA3AF' }}>
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {/* Pros / Cons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ borderTop: '1px solid #1F2937' }}>
                              <div className="px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.04)', borderRight: '1px solid #1F2937' }}>
                                <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#0D9488' }}>Lumio advantages</div>
                                <ul className="space-y-1.5">
                                  {cmp.pros.map((p, i) => (
                                    <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                                      <span className="flex-shrink-0" style={{ color: '#0D9488' }}>✅</span>{p}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="px-4 py-3" style={{ backgroundColor: 'rgba(239,68,68,0.03)' }}>
                                <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: '#EF4444' }}>Where {comp.name} leads</div>
                                <ul className="space-y-1.5">
                                  {cmp.cons.map((c, i) => (
                                    <li key={i} className="flex gap-2 text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                                      <span className="flex-shrink-0" style={{ color: '#EF4444' }}>❌</span>{c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex flex-wrap gap-6 px-2 pt-2">
              {[
                { label: 'Threat — how much damage they could do if they execute', color: '#EF4444' },
                { label: 'Overlap — how much of your market they address', color: '#F59E0B' },
                { label: 'Momentum — how fast they\'re moving right now', color: '#6C3FC5' },
                { label: 'Price Comp. — how price-competitive vs Lumio (higher = cheaper)', color: '#0D9488' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-[11px] text-[#6B7280]">{l.label}</span>
                </div>
              ))}
            </div>
            </div>{/* end competitor summary cards */}
          </div>
        )}

        {/* ── Signal Feed tab ───────────────────────────────────────────────── */}
        {tab === 'signals' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">Filter:</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {['All', 'Critical', 'High', 'Medium', 'Low'].map(s => (
                  <button key={s} onClick={() => setStrengthFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      strengthFilter === s
                        ? s === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : s === 'High'     ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : s === 'Medium'   ? 'bg-purple-600/20 text-purple-400 border border-purple-600/40'
                        : s === 'Low'      ? 'bg-[#374151] text-[#9CA3AF] border border-[#4B5563]'
                        : 'bg-[#1F2937] text-[#F9FAFB] border border-[#374151]'
                        : 'bg-transparent text-[#6B7280] border border-[#1F2937] hover:border-[#374151]'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap ml-2">
                {['All', ...COMPETITORS.map(c => c.name)].map(c => (
                  <button key={c} onClick={() => setCompetitorFilter(c)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      competitorFilter === c
                        ? 'bg-[#1F2937] text-[#F9FAFB] border border-[#374151]'
                        : 'bg-transparent text-[#6B7280] border border-[#1F2937] hover:border-[#374151]'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-[#6B7280]">{filteredSignals.length} signals</span>
            </div>

            {/* Signal cards */}
            {filteredSignals.map(signal => {
              const cfg = STRENGTH_CONFIG[signal.strength]
              const isExpanded = expandedSignal === signal.id
              return (
                <div key={signal.id}
                  className="rounded-xl border overflow-hidden transition-all"
                  style={{ backgroundColor: '#111318', borderColor: isExpanded ? cfg.border : '#1F2937' }}>
                  <button
                    className="w-full text-left p-4"
                    onClick={() => setExpandedSignal(isExpanded ? null : signal.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-lg">{TYPE_ICON[signal.type]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                            style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
                            {signal.strength}
                          </span>
                          <span className="text-xs text-[#6B7280]">{signal.competitor}</span>
                          <span className="text-xs text-[#374151]">·</span>
                          <span className="text-xs text-[#6B7280]">{signal.date}</span>
                          <span className="text-xs text-[#374151]">·</span>
                          <span className="text-xs text-[#6B7280]">{signal.source}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#F9FAFB]">{signal.title}</p>
                        {!isExpanded && (
                          <p className="text-xs text-[#6B7280] mt-1 line-clamp-1">{signal.detail}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-[#6B7280]">Opportunity</div>
                          <div className="text-sm font-bold" style={{ color: '#0D9488' }}>{signal.opportunityScore}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[#6B7280]">Threat</div>
                          <div className="text-sm font-bold" style={{ color: '#EF4444' }}>{signal.threatScore}</div>
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[#1F2937] pt-4">
                      <p className="text-sm text-[#9CA3AF] leading-relaxed">{signal.detail}</p>
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#07080F', borderLeft: `3px solid ${cfg.color}` }}>
                        <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Recommended action</div>
                        <p className="text-sm text-[#F9FAFB] leading-relaxed">{signal.action}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Job Intelligence tab ──────────────────────────────────────────── */}
        {tab === 'jobs' && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Job postings are the #1 leading indicator of what a competitor is building next. Here&apos;s what each hiring pattern signals.
            </p>
            {JOB_SIGNALS.map(comp => {
              const isExpanded = expandedJob === comp.competitor
              return (
                <div key={comp.competitor} className="bg-[#111318] border border-[#1F2937] rounded-xl overflow-hidden">
                  <button
                    className="w-full text-left p-5 flex items-center gap-3"
                    onClick={() => setExpandedJob(isExpanded ? null : comp.competitor)}
                  >
                    <span className="text-2xl">{comp.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-[#F9FAFB]">{comp.competitor}</div>
                      <div className="text-xs text-[#6B7280]">{comp.roles.length} active hiring signals</div>
                    </div>
                    <div className="flex gap-1.5">
                      {comp.roles.map((r, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-amber-500 opacity-70" />
                      ))}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-[#6B7280] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#1F2937]">
                      {comp.roles.map((role, i) => (
                        <div key={i} className={`p-5 ${i < comp.roles.length - 1 ? 'border-b border-[#1F2937]' : ''}`}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-start gap-2">
                              <Briefcase className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-semibold text-[#F9FAFB]">{role.title}</div>
                                {role.count > 1 && (
                                  <div className="text-xs text-amber-400">{role.count} open roles</div>
                                )}
                              </div>
                            </div>
                            <span className="text-xs bg-[#1F2937] text-[#9CA3AF] px-2 py-0.5 rounded flex-shrink-0">
                              {role.timeline}
                            </span>
                          </div>
                          <p className="text-sm text-[#9CA3AF] leading-relaxed pl-6">{role.signal}</p>
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
    </div>
  )
}
