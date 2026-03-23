'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Target, RefreshCw, Clock, Flame, AlertTriangle, ArrowUpRight,
  ExternalLink, Filter, Briefcase, Globe, ChevronRight,
  TrendingUp, TrendingDown, Sparkles, BarChart3, Eye,
} from 'lucide-react'

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
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null)
  const [expandedJob, setExpandedJob]       = useState<string | null>(null)

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
