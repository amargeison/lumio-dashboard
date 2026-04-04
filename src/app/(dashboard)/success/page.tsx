'use client'

import { useState } from 'react'
import { Users, Activity, Send, FileText, AlertCircle, BarChart2, Star, Building2, Sparkles, CalendarCheck, TrendingUp, RefreshCw, Monitor, Map, RotateCcw, Shield, ArrowRightLeft, Megaphone, ClipboardList } from 'lucide-react'
import { StatCard, QuickActions, SectionCard, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import { RAGCheckModal, StartRecoveryModal, SendCheckInModal, UsageReportModal, HealthReportModal, AtRiskReportModal } from '@/components/modals/SuccessModals'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Total Customers', value: '181', trend: '+3',  trendDir: 'up' as const, trendGood: true,  icon: Users,       sub: 'vs last month' },
  { label: 'Green RAG',       value: '142', trend: '+5',  trendDir: 'up' as const, trendGood: true,  icon: Activity,    sub: 'healthy'       },
  { label: 'Amber RAG',       value: '31',  trend: '+2',  trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'at risk'       },
  { label: 'Red RAG',         value: '8',   trend: '+1',  trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'critical'      },
]

type RAG = 'green' | 'amber' | 'red'

const customers: {
  company: string; score: number; rag: RAG; reason: string; lastLogin: string
}[] = [
  { company: 'Greenfield Academy',    score: 92, rag: 'green', reason: 'High engagement, on track',       lastLogin: 'Today'      },
  { company: 'Oakridge Schools Ltd',  score: 88, rag: 'green', reason: 'Renewal confirmed, NPS 9',        lastLogin: 'Today'      },
  { company: 'Hopscotch Learning',    score: 85, rag: 'green', reason: 'Active users, no issues',         lastLogin: 'Yesterday'  },
  { company: 'Crestview Academy',     score: 83, rag: 'green', reason: 'Training complete, using all mods',lastLogin: 'Today'     },
  { company: 'Riverdale Education',   score: 80, rag: 'green', reason: 'Healthy usage patterns',          lastLogin: 'Today'      },
  { company: 'Sunfield Trust',        score: 78, rag: 'green', reason: 'Good login rate, NPS 8',          lastLogin: '2d ago'     },
  { company: 'Pinebrook Primary',     score: 74, rag: 'green', reason: 'Low support tickets',             lastLogin: '3d ago'     },
  { company: 'Calibre Learning',      score: 71, rag: 'green', reason: 'Post-trial, settling in well',    lastLogin: 'Today'      },
  { company: 'Apex Tutors',           score: 68, rag: 'amber', reason: 'Login rate dropped 30%',          lastLogin: '5d ago'     },
  { company: 'Elmfield Institute',    score: 62, rag: 'amber', reason: 'Support ticket SLA breach',       lastLogin: '4d ago'     },
  { company: 'Fernview College',      score: 58, rag: 'amber', reason: 'Only 2 of 5 modules active',     lastLogin: '1w ago'     },
  { company: 'Torchbearer Trust',     score: 55, rag: 'amber', reason: 'No engagement last 2 weeks',      lastLogin: '2w ago'     },
  { company: 'Lakewood Academy',      score: 51, rag: 'amber', reason: 'QBR not yet scheduled',           lastLogin: '1w ago'     },
  { company: 'Brightfields MAT',      score: 48, rag: 'amber', reason: 'Poor onboarding completion',      lastLogin: '5d ago'     },
  { company: 'Whitestone College',    score: 34, rag: 'red',   reason: 'No login for 30+ days',           lastLogin: '34d ago'    },
  { company: 'Bramble Hill Trust',    score: 28, rag: 'red',   reason: 'Invoice overdue, at-risk flag',   lastLogin: '21d ago'    },
  { company: 'Helix Education',       score: 22, rag: 'red',   reason: 'Low trial engagement, churning',  lastLogin: '18d ago'    },
]

const ragConfig = {
  green: { border: '#22C55E', bg: 'rgba(34,197,94,0.06)',  label: 'Green', color: '#22C55E' },
  amber: { border: '#F59E0B', bg: 'rgba(245,158,11,0.06)', label: 'Amber', color: '#F59E0B' },
  red:   { border: '#EF4444', bg: 'rgba(239,68,68,0.06)',  label: 'Red',   color: '#EF4444' },
}

function HealthCard({ company, score, rag, reason, lastLogin }: typeof customers[number]) {
  const cfg = ragConfig[rag]
  return (
    <div className="flex flex-col gap-2 rounded-lg p-4" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight" style={{ color: '#F9FAFB' }}>{company}</p>
        <span className="shrink-0 text-lg font-bold" style={{ color: cfg.color }}>{score}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{reason}</p>
      <p className="text-xs" style={{ color: '#9CA3AF' }}>Last login: {lastLogin}</p>
    </div>
  )
}

const immediate = [
  { company: 'Whitestone College', reason: 'No login 34 days',          badge: 'Red'   },
  { company: 'Bramble Hill Trust', reason: 'Overdue invoice + at-risk',  badge: 'Red'   },
  { company: 'Helix Education',    reason: 'Low engagement, churning',   badge: 'Red'   },
  { company: 'Apex Tutors',        reason: 'Login rate dropped 30%',     badge: 'Amber' },
  { company: 'Elmfield Institute', reason: 'SLA breach — contact now',   badge: 'Amber' },
]

export default function SuccessPage() {
  const [showRAG, setShowRAG] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showUsage, setShowUsage] = useState(false)
  const [showHealth, setShowHealth] = useState(false)
  const [showAtRisk, setShowAtRisk] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'RAG Check',       icon: Activity,    onClick: () => setShowRAG(true) },
    { label: 'Start Recovery',  icon: AlertCircle, onClick: () => setShowRecovery(true) },
    { label: 'Send Check-in',   icon: Send,        onClick: () => setShowCheckIn(true) },
    { label: 'Usage Report',    icon: FileText,    onClick: () => setShowUsage(true) },
    { label: 'Health Report',   icon: FileText,    onClick: () => setShowHealth(true) },
    { label: 'At-Risk Report',  icon: BarChart2,   onClick: () => setShowAtRisk(true) },
    { label: 'Book QBR',         icon: CalendarCheck,  onClick: () => setActiveModal('qbr') },
    { label: 'Expansion Play',   icon: TrendingUp,     onClick: () => setActiveModal('expansion') },
    { label: 'Renewal Prep',     icon: RefreshCw,       onClick: () => setActiveModal('renewal') },
    { label: 'Exec Briefing',    icon: Monitor,         onClick: () => setActiveModal('exec-briefing') },
    { label: 'Success Plan',     icon: Map,             onClick: () => setActiveModal('success-plan') },
    { label: 'Escalation Path',  icon: AlertCircle,     onClick: () => setActiveModal('escalation') },
    { label: 'Win Back',         icon: RotateCcw,       onClick: () => setActiveModal('win-back') },
    { label: 'Champion Change',  icon: Users,           onClick: () => setActiveModal('champion') },
    { label: 'Value Review',     icon: Star,            onClick: () => setActiveModal('value-review') },
    { label: 'Usage Nudge',      icon: Activity,        onClick: () => setActiveModal('usage-nudge') },
    { label: 'Onboarding Plan',  icon: ClipboardList,   onClick: () => setActiveModal('onboarding-plan') },
    { label: 'Advocacy Ask',     icon: Megaphone,       onClick: () => setActiveModal('advocacy') },
    { label: 'Risk Mitigation',  icon: Shield,          onClick: () => setActiveModal('risk-mit') },
    { label: 'CS Handover',      icon: ArrowRightLeft,  onClick: () => setActiveModal('cs-handover') },
    { label: 'ROI Report',       icon: BarChart2,       onClick: () => setActiveModal('roi-report') },
    { label: 'Dept Insights',  icon: Star,        onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',      icon: Building2,   onClick: () => setShowDeptInfo(true) },
  ]

  const hasData = useHasDashboardData('success')

  const deptStaff = getDeptStaff('success')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="success" />}
      <DashboardEmptyState pageKey="success"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your success data` : 'No customer success data yet'}
        description={deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Success Lead'}. Upload your customer health data, renewal pipeline and success playbooks to activate the Customer Success module.` : 'Upload your customer health data, renewal pipeline and success playbooks to activate the Customer Success module.'}
        uploads={[
          { key: 'health', label: 'Upload Customer Health Data (CSV)' },
          { key: 'renewals', label: 'Upload Renewal Pipeline (CSV)' },
        ]}
      />
    </>
  )

  const grouped = (['green', 'amber', 'red'] as RAG[]).map((rag) => ({
    rag,
    items: customers.filter((c) => c.rag === rag),
  }))

  const successHighlights = ['Customer health: 132 healthy, 29 at risk, 10 critical', 'NPS score increased to 67 — up 8 points this quarter', '3 expansion opportunities identified this month', 'Onboarding completion rate: 94%', 'Churn risk: 4 accounts flagged for immediate outreach']

  return (
    <PageShell title="Success" subtitle="Customer health, renewals and expansion">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <div className="flex flex-col gap-4">
            {grouped.map(({ rag, items }) => {
              const cfg = ragConfig[rag]
              return (
                <SectionCard key={rag} title={`${cfg.label} — ${items.length} customers`}>
                  <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                    {items.map((c) => <HealthCard key={c.company} {...c} />)}
                  </div>
                </SectionCard>
              )
            })}
          </div>
        }
        side={
          <SectionCard title="Immediate Action Required">
            {immediate.map((i) => (
              <PanelItem key={i.company} title={i.company} sub={i.reason} badge={i.badge} />
            ))}
          </SectionCard>
        }
      />
      {showRAG && <RAGCheckModal onClose={() => setShowRAG(false)} onToast={showToast} />}
      {showRecovery && <StartRecoveryModal onClose={() => setShowRecovery(false)} onToast={showToast} />}
      {showCheckIn && <SendCheckInModal onClose={() => setShowCheckIn(false)} onToast={showToast} />}
      {showUsage && <UsageReportModal onClose={() => setShowUsage(false)} onToast={showToast} />}
      {showHealth && <HealthReportModal onClose={() => setShowHealth(false)} onToast={showToast} />}
      {showAtRisk && <AtRiskReportModal onClose={() => setShowAtRisk(false)} onToast={showToast} />}
      <AIInsightsReport dept="success" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="success" onClose={() => setShowDeptInfo(false)} />}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="success" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Success</span>
            </div>
            <ul className="space-y-2.5">
              {successHighlights.map((h: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setActiveModal(null); setSubmitResult(null) }}>
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {submitResult ? (
              <div className="text-center py-6"><div className="text-4xl mb-4">{'\u2705'}</div><div className="text-white font-semibold mb-3">Done</div><div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-400 text-left leading-relaxed mb-4 whitespace-pre-wrap">{submitResult}</div><button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium">Close</button></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold text-lg">{({qbr:'\u{1F4C5} Book QBR',expansion:'\u{1F4C8} Expansion Play',renewal:'\u{1F504} Renewal Prep','exec-briefing':'\u{1F3AF} Exec Briefing','success-plan':'\u{1F5FA}\uFE0F Success Plan',escalation:'\u{1F6A8} Escalation Path','win-back':'\u21A9\uFE0F Win Back',champion:'\u{1F464} Champion Change','value-review':'\u2B50 Value Review','usage-nudge':'\u{1F4CA} Usage Nudge','onboarding-plan':'\u{1F4CB} Onboarding Plan',advocacy:'\u{1F4E2} Advocacy Ask','risk-mit':'\u{1F6E1}\uFE0F Risk Mitigation','cs-handover':'\u2194\uFE0F CS Handover','roi-report':'\u{1F4B0} ROI Report'} as Record<string,string>)[activeModal] || activeModal}</h3>
                  <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-white text-2xl">&times;</button>
                </div>
                {activeModal === 'qbr' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">QBR type</label><div className="flex gap-2">{['Quarterly','Annual','Mid-year','Ad hoc'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Topics</label><div className="space-y-1">{['ROI & value','Usage review','Roadmap preview','Pain points','Expansion','Renewal','Goals'].map(t=><label key={t} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" defaultChecked />{t}</label>)}</div></div><button onClick={()=>{setSubmitResult('QBR booked for next Tuesday 10am (90 min). Google Meet link created. Agenda sent to customer with pre-read pack.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4C5}'} Book QBR</button></div>)}
                {activeModal === 'expansion' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Current ARR</label><input type="text" placeholder="\u00A3X,XXX/yr" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Opportunity</label><div className="flex gap-2 flex-wrap">{['Upgrade plan','Add seats','New dept','New portal','Add-on','Multi-year'].map(o=><button key={o} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{o}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Expansion value (\u00A3/yr)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Expansion play strategy generated. Non-salesy outreach email drafted. Internal opportunity brief created.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4C8}'} Generate Expansion Play</button></div>)}
                {activeModal === 'renewal' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Renewal date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" style={{ colorScheme: 'dark' }} /></div><div><label className="text-xs text-gray-400 mb-1 block">Current ARR</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Health</label><div className="flex gap-2">{['\u{1F7E2} Strong','\u{1F7E1} Uncertain','\u{1F534} At risk'].map(h=><button key={h} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{h}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Risks</label><div className="space-y-1">{['Low usage','Budget pressure','Champion left','Competitor eval','Unresolved issues','ROI unclear'].map(r=><label key={r} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" />{r}</label>)}</div></div><button onClick={()=>{setSubmitResult('Renewal pack generated:\n\u2022 Internal brief with health assessment\n\u2022 Customer value summary email drafted\n\u2022 Renewal conversation script with objection responses')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F504}'} Generate Renewal Pack</button></div>)}
                {activeModal === 'success-plan' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Period</label><div className="flex gap-2">{['30d','60d','90d','6mo','12mo'].map(p=><button key={p} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{p}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Customer goals</label><textarea rows={3} placeholder="What success looks like for them" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Pain points</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Success plan generated with milestones, KPIs, action plan, and expansion opportunities.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F5FA}\uFE0F'} Generate Success Plan</button></div>)}
                {activeModal === 'win-back' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Former customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Reason they left</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Price</option><option>Competitor</option><option>Feature gap</option><option>Low usage</option><option>Business closed</option><option>Champion left</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Months since left</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Win-back offer</label><input type="text" placeholder="e.g. 30% off 3 months" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Win-back email drafted. Acknowledges departure, highlights improvements, includes compelling offer.')}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u21A9\uFE0F'} Draft Win-Back Email</button></div>)}
                {activeModal === 'champion' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Previous champion</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Why</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Left company</option><option>Promoted</option><option>On leave</option><option>Restructure</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">New contact</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Risk</label><div className="flex gap-2">{['\u{1F7E2} Low','\u{1F7E1} Medium','\u{1F534} High'].map(r=><button key={r} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{r}</button>)}</div></div><button onClick={()=>{setSubmitResult('Introduction email drafted to new champion. Internal risk note created with 30-day action plan.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F464}'} Draft Introduction</button></div>)}
                {activeModal === 'value-review' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Months as customer</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Key outcomes</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Value review document generated with ROI, outcomes, usage highlights. Celebratory email drafted to customer.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2B50'} Generate Value Review</button></div>)}
                {activeModal === 'usage-nudge' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Concern</label><div className="flex gap-2 flex-wrap">{['Login dropped','Feature unused','1 user only','No workflows','Quick wins ignored','Integration missing'].map(c=><button key={c} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{c}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Days since active</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Usage nudge email drafted. Value-led, highlights one specific feature with concrete benefit.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4CA}'} Draft Usage Nudge</button></div>)}
                {activeModal === 'advocacy' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Health score</label><input type="number" min="0" max="100" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Ask type</label><div className="flex gap-2 flex-wrap">{['G2 review','Case study','Reference call','Video testimonial','LinkedIn post','Speaking event'].map(a=><button key={a} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{a}</button>)}</div></div><button onClick={()=>{setSubmitResult('Advocacy ask email drafted. Personal, genuine, references their success. Includes review link and incentive offer.')}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4E2}'} Draft Advocacy Ask</button></div>)}
                {activeModal === 'roi-report' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Contract value (\u00A3/yr)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Team size</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Hours saved/user/week</label><input type="number" placeholder="3" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Hourly cost (\u00A3)</label><input type="number" placeholder="28" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('ROI report generated:\n\u2022 Headline ROI figure with payback period\n\u2022 Time savings: users \u00D7 hours \u00D7 cost \u00D7 52 weeks\n\u2022 Cost vs value comparison\n\u2022 One-page executive summary for board\n\u2022 Year 2+ projection')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4B0}'} Generate ROI Report</button></div>)}
                {['exec-briefing','escalation','onboarding-plan','risk-mit','cs-handover'].includes(activeModal) && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>{activeModal==='exec-briefing'&&<><div><label className="text-xs text-gray-400 mb-1 block">Audience</label><input type="text" placeholder="CEO, CFO, Board" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Goal</label><div className="flex gap-2 flex-wrap">{['Secure renewal','Build relationship','Present ROI','Expand','Crisis'].map(g=><button key={g} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{g}</button>)}</div></div></>}{activeModal==='escalation'&&<><div><label className="text-xs text-gray-400 mb-1 block">Issue</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Escalate to</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>CS Manager</option><option>Head of Product</option><option>CTO</option><option>CEO</option></select></div></>}{activeModal==='onboarding-plan'&&<><div><label className="text-xs text-gray-400 mb-1 block">Period</label><div className="flex gap-2">{['30d','60d','90d'].map(p=><button key={p} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{p}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Team size</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Key use cases</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}{activeModal==='risk-mit'&&<div><label className="text-xs text-gray-400 mb-1 block">Risk factors</label><div className="space-y-1">{['NPS dropped','Usage down 30%','Tickets spiking','Renewal <90d','Champion left','Budget freeze','Competitor pitch'].map(r=><label key={r} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" />{r}</label>)}</div></div>}{activeModal==='cs-handover'&&<><div><label className="text-xs text-gray-400 mb-1 block">From / To</label><div className="flex gap-2"><input type="text" placeholder="From CSM" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /><input type="text" placeholder="To CSM" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div><div><label className="text-xs text-gray-400 mb-1 block">Key context</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}<button onClick={()=>{const m:Record<string,string>={'exec-briefing':'Exec briefing pack generated with talking points and Q&A prep.',escalation:'Escalation plan created with customer comms and resolution timeline.','onboarding-plan':'Onboarding plan generated with week-by-week milestones.','risk-mit':'Risk mitigation playbook created with immediate and 30-day actions.','cs-handover':'Handover document generated with full account context.'};setSubmitResult(m[activeModal]||'Done')}} disabled={submitting} className="w-full mt-2 bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2728'} {({['exec-briefing']:'Generate Briefing Pack',escalation:'Create Escalation Plan',['onboarding-plan']:'Generate Onboarding Plan',['risk-mit']:'Generate Mitigation Plan',['cs-handover']:'Create Handover Doc'} as Record<string,string>)[activeModal] || 'Generate'}</button></div>)}
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
