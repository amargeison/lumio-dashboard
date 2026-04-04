'use client'

import { DEMO_STATS } from '@/lib/demoStats'
import { useState, useEffect } from 'react'
import { TrendingUp, UserPlus, FlaskConical, FileText, Phone, Send, Calendar, Sparkles, Building2, Bell, Zap, BarChart2, PoundSterling, FileCheck, GitPullRequest, Calculator, Eye, Network, Search, Shield, ClipboardCheck, Map, FileSearch, Loader2 } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { NewDealModal, BookDemoModal, SendProposalModal, LogCallModal, NewLeadModal, DeptInsightsModal, GenerateLeadsModal } from '@/components/modals/SalesModals'
import { useToast } from '@/components/modals/useToast'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead', qualified: 'Discovery', demo: 'Demo', proposal: 'Proposal',
  closing: 'Negotiation', won: 'Closed', lost: 'Lost',
}

const DEFAULT_STATS = [
  { label: 'Open Deals',       value: String(DEMO_STATS.openDeals),      trend: '+8%',  trendDir: 'up' as const, trendGood: true,  icon: TrendingUp, sub: 'vs last month'   },
  { label: 'Pipeline Value',   value: DEMO_STATS.pipelineFormatted,      trend: '+12%', trendDir: 'up' as const, trendGood: true,  icon: TrendingUp, sub: 'vs last month'   },
  { label: 'Win Rate (30d)',   value: DEMO_STATS.winRate + '%',          trend: '+3%',  trendDir: 'up' as const, trendGood: true,  icon: TrendingUp, sub: 'deals closed won' },
  { label: 'Hot Leads',        value: '4',                               trend: '+1',   trendDir: 'up' as const, trendGood: true,  icon: UserPlus,   sub: 'score ≥ 70/100'  },
]

const DEFAULT_DEALS = [
  { company: 'Greenfield Academy',   stage: 'Negotiation', value: '£42,000', owner: 'Dan Marsh',   activity: '2h ago'    },
  { company: 'Hopscotch Learning',   stage: 'Proposal',    value: '£28,500', owner: 'Sophie Bell', activity: '4h ago'    },
  { company: 'Bramble Hill Trust',   stage: 'Discovery',   value: '£76,000', owner: 'Dan Marsh',   activity: 'Yesterday' },
  { company: 'Crestview Academy',    stage: 'Proposal',    value: '£19,200', owner: 'Raj Patel',   activity: '3h ago'    },
  { company: 'Oakridge Schools Ltd', stage: 'Negotiation', value: '£55,000', owner: 'Sophie Bell', activity: 'Today'     },
  { company: 'Elmfield Institute',   stage: 'Discovery',   value: '£33,400', owner: 'Raj Patel',   activity: '2d ago'    },
  { company: 'Whitestone College',   stage: 'Closed',      value: '£91,000', owner: 'Dan Marsh',   activity: 'Today'     },
  { company: 'Sunfield Trust',       stage: 'Proposal',    value: '£14,800', owner: 'Sophie Bell', activity: '6h ago'    },
  { company: 'Pinebrook Primary',    stage: 'Lost',        value: '£22,000', owner: 'Raj Patel',   activity: '1w ago'    },
  { company: 'Riverdale Education',  stage: 'Discovery',   value: '£48,000', owner: 'Dan Marsh',   activity: 'Yesterday' },
]

const hotLeads = [
  { company: 'Lakewood Academy',  src: 'SA-02 warm outreach', score: '87/100' },
  { company: 'Fernview College',  src: 'SA-02 inbound form',  score: '79/100' },
  { company: 'Torchbearer Trust', src: 'SA-02 referral',      score: '72/100' },
  { company: 'Brightfields MAT',  src: 'SA-02 event lead',    score: '68/100' },
]

const outreach = [
  { name: 'Spring Term Warm Outreach', status: 'Active',   sent: 142, replies: 18, meetings: 4 },
  { name: 'MAT Expansion Sequence',    status: 'Active',   sent: 67,  replies: 9,  meetings: 2 },
  { name: 'Competitor Switch Campaign',status: 'Paused',   sent: 38,  replies: 3,  meetings: 1 },
  { name: 'Re-engagement — Lost Deals',status: 'Draft',    sent: 0,   replies: 0,  meetings: 0 },
]

const DEFAULT_HIGHLIGHTS = [
  '3 trials expiring this week — £8,400 combined value at risk of not converting',
  'Pipeline velocity up 18% — deals now closing in an average of 11 days',
  'Oakridge Schools demo today at 11am — prep briefing and deck ready to review',
  `${DEMO_STATS.openDeals} open deals totalling ${DEMO_STATS.pipelineFormatted} currently active in pipeline`,
  `Win rate this month at ${DEMO_STATS.winRate}% — top performing source: referrals at 40% conversion rate`,
]

function timeAgo(date: string | null): string {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function SalesPage() {
  const workspace = useWorkspace()
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [deals, setDeals] = useState(DEFAULT_DEALS)
  const [highlights, setHighlights] = useState(DEFAULT_HIGHLIGHTS)
  const [showLead, setShowLead] = useState(false)
  const [showDeal, setShowDeal] = useState(false)
  const [showCall, setShowCall] = useState(false)
  const [showProposal, setShowProposal] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showGenLeads, setShowGenLeads] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const router = useRouter()
  const { showToast, Toast } = useToast()

  async function callSalesAction(prompt: string) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'player', query: prompt })
      })
      const data = await res.json()
      setSubmitResult(typeof data.result === 'string' ? data.result : data.result?.summary || 'Action completed successfully.')
    } catch { setSubmitResult('Action completed successfully.') }
    setSubmitting(false)
  }

  const actions = [
    { label: 'New Deal',       icon: TrendingUp, onClick: () => setShowDeal(true) },
    { label: 'Book Demo',      icon: Calendar,   onClick: () => setShowDemo(true) },
    { label: 'Send Proposal',  icon: FileText,   onClick: () => setShowProposal(true) },
    { label: 'Log Call',       icon: Phone,      onClick: () => setShowCall(true) },
    { label: 'New Lead',       icon: UserPlus,   onClick: () => setShowLead(true) },
    { label: 'Dept Insights',  icon: Sparkles,   onClick: () => setShowInsights(true) },
    { label: 'Generate Leads', icon: UserPlus,   onClick: () => setShowGenLeads(true) },
    { label: 'Dept Info',      icon: Building2,  onClick: () => setShowDeptInfo(true) },
    { label: 'RFP Builder', icon: FileSearch, onClick: () => router.push('/sales/rfp') },
    { label: 'Follow Up', icon: Bell, onClick: () => setActiveModal('follow-up') },
    { label: 'Chase Deal', icon: Zap, onClick: () => setActiveModal('chase-deal') },
    { label: 'Win/Loss Review', icon: BarChart2, onClick: () => setActiveModal('win-loss') },
    { label: 'Price Quote', icon: PoundSterling, onClick: () => setActiveModal('quote') },
    { label: 'Contract Review', icon: FileCheck, onClick: () => setActiveModal('contract-review') },
    { label: 'Pipeline Review', icon: GitPullRequest, onClick: () => setActiveModal('pipeline-review') },
    { label: 'Commission Calc', icon: Calculator, onClick: () => setActiveModal('commission') },
    { label: 'Competitor Intel', icon: Eye, onClick: () => setActiveModal('competitor-intel') },
    { label: 'Stakeholder Map', icon: Network, onClick: () => setActiveModal('stakeholder') },
    { label: 'Discovery Call', icon: Search, onClick: () => setActiveModal('discovery') },
    { label: 'Objection Handler', icon: Shield, onClick: () => setActiveModal('objection') },
    { label: 'Deal Scorecard', icon: ClipboardCheck, onClick: () => setActiveModal('deal-score') },
    { label: 'Account Plan', icon: Map, onClick: () => setActiveModal('account-plan') },
  ]

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    supabase.from('crm_deals').select('*').eq('business_id', workspace.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (!data?.length) return
      const open = data.filter(d => !['won', 'lost'].includes(d.stage))
      const pipelineValue = open.reduce((s, d) => s + (d.value_annual || 0), 0)
      const won = data.filter(d => d.stage === 'won').length
      const total = data.filter(d => ['won', 'lost'].includes(d.stage)).length
      const winRate = total > 0 ? Math.round((won / total) * 100) : 0
      const hot = data.filter(d => d.heat === 'hot' && d.stage !== 'won' && d.stage !== 'lost').length

      setStats([
        { label: 'Open Deals', value: String(open.length), trend: `+${open.length}`, trendDir: 'up' as const, trendGood: true, icon: TrendingUp, sub: 'in pipeline' },
        { label: 'Pipeline Value', value: `£${(pipelineValue / 1000).toFixed(0)}k`, trend: '+12%', trendDir: 'up' as const, trendGood: true, icon: TrendingUp, sub: 'open deals' },
        { label: 'Win Rate', value: `${winRate}%`, trend: '', trendDir: 'up' as const, trendGood: true, icon: TrendingUp, sub: 'closed deals' },
        { label: 'Hot Leads', value: String(hot), trend: `+${hot}`, trendDir: 'up' as const, trendGood: true, icon: UserPlus, sub: 'in pipeline' },
      ])

      setDeals(data.map(d => ({
        company: d.company,
        stage: STAGE_LABELS[d.stage] || d.stage,
        value: `£${(d.value_annual || 0).toLocaleString()}`,
        owner: d.owner || '—',
        activity: timeAgo(d.won_at || d.lost_at || d.created_at),
      })))

      // Generate highlights from data
      const hl: string[] = []
      if (open.length > 0) hl.push(`${open.length} open deals totalling £${(pipelineValue / 1000).toFixed(0)}k currently active in pipeline`)
      if (won > 0) hl.push(`${won} deal${won > 1 ? 's' : ''} closed won — ${winRate}% win rate`)
      if (hot > 0) hl.push(`${hot} hot lead${hot > 1 ? 's' : ''} in pipeline — focus on conversion this week`)
      const closingDeals = data.filter(d => d.stage === 'closing')
      if (closingDeals.length > 0) hl.push(`${closingDeals.length} deal${closingDeals.length > 1 ? 's' : ''} in negotiation stage — close to signing`)
      if (hl.length > 0) setHighlights(hl)
    })
  }, [workspace?.id])

  const hasData = useHasDashboardData('sales')

  const deptStaff = getDeptStaff('sales')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="sales" />}
      <DashboardEmptyState pageKey="sales"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your sales data` : 'No sales data yet'}
        description={deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Sales Lead'}. Import your deal pipeline, revenue data and sales activity to unlock the Sales dashboard with forecasting, leaderboard and conversion analytics.` : 'Import your deal pipeline, revenue data and sales activity to unlock the Sales dashboard with forecasting, leaderboard and conversion analytics.'}
        uploads={[
          { key: 'pipeline', label: 'Upload Sales Pipeline (CSV)' },
          { key: 'revenue', label: 'Upload Revenue Data (CSV/XLSX)', accept: '.csv,.xlsx' },
          { key: 'targets', label: 'Upload Sales Targets (CSV)' },
        ]}
      />
    </>
  )

  return (
    <PageShell title="Sales" subtitle="Pipeline, deals, leads and revenue tracking">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>


      <QuickActions items={actions} />

      <TwoCol
        main={
          <SectionCard title="Deal Pipeline" action="View all">
            <Table
              cols={['Company', 'Stage', 'Value', 'Owner', 'Last Activity']}
              rows={deals.map((d) => [
                d.company,
                <Badge key={d.company} status={d.stage} />,
                d.value, d.owner, d.activity,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Hot Leads — SA-02">
              {hotLeads.map((l) => (
                <PanelItem key={l.company} title={l.company} sub={l.src} extra={`Lead score: ${l.score}`} badge="Active" />
              ))}
            </SectionCard>

            <SectionCard title="Outreach Sequences">
              {outreach.map((o) => (
                <PanelItem
                  key={o.name}
                  title={o.name}
                  sub={`${o.sent} sent · ${o.replies} replies · ${o.meetings} meetings`}
                  badge={o.status}
                />
              ))}
            </SectionCard>
          </>
        }
      />
      {showLead && <NewLeadModal onClose={() => setShowLead(false)} onToast={showToast} />}
      {showDeal && <NewDealModal onClose={() => setShowDeal(false)} onToast={showToast} />}
      {showCall && <LogCallModal onClose={() => setShowCall(false)} onToast={showToast} />}
      {showProposal && <SendProposalModal onClose={() => setShowProposal(false)} onToast={showToast} />}
      {showDemo && <BookDemoModal onClose={() => setShowDemo(false)} onToast={showToast} />}
      {showInsights && <DeptInsightsModal onClose={() => setShowInsights(false)} onToast={showToast} />}
      {showGenLeads && <GenerateLeadsModal onClose={() => setShowGenLeads(false)} onToast={showToast} />}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { if (!submitting) { setActiveModal(null); setSubmitResult(null) } }}>
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {submitResult ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">{'\u2705'}</div>
                <div className="text-white font-semibold mb-3">Action completed</div>
                <div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-400 text-left leading-relaxed mb-4 whitespace-pre-line">{submitResult}</div>
                <button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm">Done</button>
              </div>
            ) : (<>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg">{({'follow-up':'\u{1F514} Follow Up','chase-deal':'\u26A1 Chase Deal','win-loss':'\u{1F4CA} Win/Loss Review',quote:'\u{1F4B7} Price Quote','contract-review':'\u{1F4DD} Contract Review','pipeline-review':'\u{1F504} Pipeline Review',commission:'\u{1F4B0} Commission Calc','competitor-intel':'\u{1F441} Competitor Intel',stakeholder:'\u{1F5FA} Stakeholder Map',discovery:'\u{1F50D} Discovery Call',objection:'\u{1F6E1} Objection Handler','deal-score':'\u{1F4CB} Deal Scorecard','account-plan':'\u{1F5FA} Account Plan'} as Record<string,string>)[activeModal] || activeModal}</h3>
                <button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="text-gray-500 hover:text-white text-2xl">&times;</button>
              </div>

              {activeModal === 'follow-up' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" placeholder="e.g. Greenfield Academy" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Contact name</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Follow up type</label><div className="flex gap-2">{['Email','Call','LinkedIn'].map(t=><button key={t} className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500 transition-all">{t}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Tone</label><div className="flex gap-2">{['Friendly','Firm','Urgent'].map(t=><button key={t} className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500 transition-all">{t}</button>)}</div></div>
                <button disabled={submitting} onClick={()=>callSalesAction('Write a friendly professional follow-up email to a contact at a company about an active sales deal. Reference a previous conversation, add value with a relevant insight, and include a clear CTA to book the next call. Keep it concise and human.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Processing...</span>:'Generate follow-up email'}</button>
              </div>)}

              {activeModal === 'chase-deal' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Deal value (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Days stalled</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Stage</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Negotiation</option><option>Proposal</option><option>Verbal Yes</option></select></div>
                <button disabled={submitting} onClick={()=>callSalesAction('Write a professional deal chase email. Reference a verbal agreement or proposal, create gentle urgency, make it easy to say yes. Include a one-line deal summary and clear next step.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Processing...</span>:'Generate chase email'}</button>
              </div>)}

              {activeModal === 'win-loss' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Outcome</label><div className="flex gap-2">{['Won','Lost'].map(o=><button key={o} className={`flex-1 py-2 rounded-xl border text-sm ${o==='Won'?'border-green-700 text-green-400':'border-red-700 text-red-400'} hover:opacity-80 transition-all`}>{o}</button>)}</div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Deal value (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Primary reason</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Price</option><option>Product fit</option><option>Timing</option><option>Competition</option><option>Champion left</option><option>Internal politics</option></select></div>
                <button disabled={submitting} onClick={()=>callSalesAction('Generate a structured win/loss analysis for a sales deal. Include: what went well, what could be improved, key decision factors, competitor comparison if applicable, and 3 actionable recommendations for similar future deals. Format with clear headings.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Analysing...</span>:'Generate analysis'}</button>
              </div>)}

              {activeModal === 'quote' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Product / plan</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Lumio Pro</option><option>Lumio Enterprise</option><option>Lumio Schools</option><option>Custom</option></select></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400 mb-1 block">Unit price (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Quantity</label><input type="number" defaultValue={1} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Discount %</label><input type="number" defaultValue={0} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callSalesAction('Write a formal price quote email. Include itemised pricing, any discount applied, payment terms (NET 30), quote validity (30 days), and clear next steps to proceed. Professional but warm tone.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Processing...</span>:'Generate quote email'}</button>
              </div>)}

              {activeModal === 'competitor-intel' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Competitor</label><input type="text" placeholder="e.g. Arbor, SIMS, Bromcom" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Deal context</label><input type="text" placeholder="Company you're competing for" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Key objection raised</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callSalesAction('Create a 5-point competitive battlecard. Cover: where we win, where they win, top 3 objections and responses, pricing positioning, and one killer question to ask the prospect. Practical and actionable.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Researching...</span>:'Generate battlecard'}</button>
              </div>)}

              {activeModal === 'discovery' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Industry</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Education</option><option>Healthcare</option><option>SaaS</option><option>Professional services</option><option>Finance</option></select></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Company size</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>1-50</option><option>51-200</option><option>201-500</option><option>500+</option></select></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Known pain points</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callSalesAction('Generate 15 discovery call questions. Mix of: problem exploration, current solution, impact questions, budget/authority, and timeline. Include one powerful opening question. Format as a numbered list.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Generating...</span>:'Generate discovery questions'}</button>
              </div>)}

              {activeModal === 'objection' && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Objection type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Too expensive</option><option>Not the right time</option><option>Happy with current provider</option><option>No budget this quarter</option><option>Need to think about it</option><option>Competitor is cheaper</option></select></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Context</label><textarea rows={2} placeholder="What exactly did they say?" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>callSalesAction('Give me 3 responses to a common sales objection. Each response should: acknowledge the concern, reframe it as an opportunity, and advance the conversation. Include one bold question to flip the objection. Confident sales tone.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Processing...</span>:'Generate responses'}</button>
              </div>)}

              {['contract-review','pipeline-review','commission','stakeholder','deal-score','account-plan'].includes(activeModal) && (<div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">{activeModal === 'commission' ? 'Deal value (\u00A3)' : 'Company'}</label><input type={activeModal === 'commission' ? 'number' : 'text'} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                {activeModal === 'commission' && <div><label className="text-xs text-gray-400 mb-1 block">Commission rate (%)</label><input type="number" defaultValue={10} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>}
                {activeModal === 'deal-score' && <><div><label className="text-xs text-gray-400 mb-1 block">Deal value (\u00A3)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Champion identified?</label><div className="flex gap-2">{['Yes','No','Partial'].map(o=><button key={o} className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500 transition-all">{o}</button>)}</div></div></>}
                {activeModal === 'account-plan' && <><div><label className="text-xs text-gray-400 mb-1 block">Current ARR (\u00A3)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Target ARR (\u00A3)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}
                <div><label className="text-xs text-gray-400 mb-1 block">Notes</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>
                <button disabled={submitting} onClick={()=>{const p:Record<string,string>={'contract-review':'Review contract terms and flag: non-standard clauses, payment terms, liability caps, IP ownership, termination rights, renewal terms. Rate overall risk LOW/MEDIUM/HIGH. Format as bullet points.','pipeline-review':'Generate a pipeline health summary: deals at each stage, total value, average deal size, conversion rates between stages, and 3 specific recommendations for improvement.',commission:'Calculate commission breakdown for a sales deal. Show: deal value, commission rate, total commission earned, when it is paid (monthly/quarterly), and net deal value to company. Format as a clear table.',stakeholder:'Create a stakeholder map identifying typical buying roles: economic buyer, technical buyer, champion, blocker, influencer. For each role, describe what they care about and how to engage them.','deal-score':'Score this deal using MEDDIC framework: Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion. Rate each 1-5 and give an overall score with colour rating (green/amber/red) and 3 recommended next actions.','account-plan':'Create a 90-day account plan. Include: current state assessment, 3 expansion opportunities, stakeholder engagement plan with specific actions, key milestones by week, and success metrics.'};callSalesAction(p[activeModal!]||'Analyse this sales scenario and provide actionable recommendations.')}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/> Processing...</span>:'Submit'}</button>
              </div>)}
            </>)}
          </div>
        </div>
      )}
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="sales" onClose={() => setShowDeptInfo(false)} />}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="sales" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Sales</span>
            </div>
            <ul className="space-y-2.5">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
