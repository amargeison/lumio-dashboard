'use client'

import { useState } from 'react'
import { FlaskConical, Clock, TrendingUp, Calendar, UserPlus, Send, FileText, AlertCircle, Shield, Star, Building2, Sparkles, Video, Mail, HeartPulse, CalendarCheck, PoundSterling, RefreshCw, Calculator, BarChart2, ClipboardCheck, UserCheck, GitCompare, AlertTriangle } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import NewTrialModal from '@/components/modals/NewTrialModal'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Active Trials',           value: '23',  trend: '0',    trendDir: 'up'   as const, trendGood: true,  icon: FlaskConical, sub: 'vs last week'  },
  { label: 'Trials Ending This Week', value: '5',   trend: '+2',   trendDir: 'up'   as const, trendGood: false, icon: AlertCircle,  sub: 'need follow-up'},
  { label: 'Conversion Rate',         value: '62%', trend: '+5%',  trendDir: 'up'   as const, trendGood: true,  icon: TrendingUp,   sub: 'vs last quarter'},
  { label: 'Avg Trial Length',        value: '14d', trend: '0',    trendDir: 'up'   as const, trendGood: true,  icon: Clock,        sub: 'stable'        },
]

const trials = [
  { company: 'Lakewood Academy',    contact: 'Rachel Fox',   start: '8 Mar 2026',  day: 'Day 13', engagement: 'High',   status: 'Active'  },
  { company: 'Fernview College',    contact: 'Gary Stone',   start: '12 Mar 2026', day: 'Day 9',  engagement: 'Medium', status: 'Active'  },
  { company: 'Torchbearer Trust',   contact: 'Ann Mehta',    start: '15 Mar 2026', day: 'Day 6',  engagement: 'High',   status: 'Active'  },
  { company: 'Brightfields MAT',    contact: 'Lee Dawson',   start: '17 Mar 2026', day: 'Day 4',  engagement: 'Low',    status: 'Active'  },
  { company: 'Starling Schools',    contact: 'Maria Olsen',  start: '5 Mar 2026',  day: 'Day 16', engagement: 'High',   status: 'Ending'  },
  { company: 'Northpoint Primary',  contact: 'Jake Burns',   start: '3 Mar 2026',  day: 'Day 18', engagement: 'Medium', status: 'Ending'  },
  { company: 'Helix Education',     contact: 'Priya Shah',   start: '1 Mar 2026',  day: 'Day 20', engagement: 'Low',    status: 'Ending'  },
  { company: 'Calibre Learning',    contact: 'Owen James',   start: '20 Feb 2026', day: 'Day 29', engagement: 'High',   status: 'Ending'  },
  { company: 'Apex Tutors',         contact: 'Nina Webb',    start: '18 Feb 2026', day: 'Day 31', engagement: 'High',   status: 'Converted'},
  { company: 'Meridian College',    contact: 'Adam Cole',    start: '15 Feb 2026', day: 'Day 34', engagement: 'Low',    status: 'Ended'   },
]

function EngagementDot({ level }: { level: string }) {
  const color = level === 'High' ? '#22C55E' : level === 'Medium' ? '#F59E0B' : '#EF4444'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span style={{ color: '#9CA3AF' }}>{level}</span>
    </span>
  )
}

const endingSoon = [
  { company: 'Starling Schools',   days: '2 days',  contact: 'Maria Olsen',  engagement: 'High'   },
  { company: 'Northpoint Primary', days: '4 days',  contact: 'Jake Burns',   engagement: 'Medium' },
  { company: 'Helix Education',    days: '4 days',  contact: 'Priya Shah',   engagement: 'Low'    },
  { company: 'Calibre Learning',   days: '1 day',   contact: 'Owen James',   engagement: 'High'   },
]

const opportunities = [
  { company: 'Lakewood Academy',  reason: 'High engagement, Day 13',    badge: 'Active'   },
  { company: 'Torchbearer Trust', reason: 'Demo attended, Day 6',       badge: 'Active'   },
  { company: 'Calibre Learning',  reason: 'Day 29 — ready to convert',  badge: 'Ending'   },
  { company: 'Apex Tutors',       reason: 'Convert call booked',        badge: 'Converted'},
]

export default function TrialsPage() {
  const [showTrial, setShowTrial] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'Admin Portal',        icon: Shield,       onClick: () => window.open('/admin', '_blank') },
    { label: 'New Trial',           icon: FlaskConical, onClick: () => setShowTrial(true) },
    { label: 'Extend Trial',        icon: Calendar,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Convert to Customer', icon: UserPlus,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'End Trial',           icon: AlertCircle,  onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Send Day 3 Email',    icon: Send,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Send Day 7 Email',    icon: Send,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Schedule Demo',      icon: Video,          onClick: () => setActiveModal('schedule-demo') },
    { label: 'Send Welcome',       icon: Mail,           onClick: () => setActiveModal('send-welcome') },
    { label: 'Health Check',       icon: HeartPulse,     onClick: () => setActiveModal('health-check') },
    { label: 'Send Day 14 Email',  icon: Send,           onClick: () => setActiveModal('day14') },
    { label: 'Upgrade Nudge',      icon: TrendingUp,     onClick: () => setActiveModal('upgrade-nudge') },
    { label: 'Book Onboarding',    icon: CalendarCheck,  onClick: () => setActiveModal('book-onboarding') },
    { label: 'Send Case Study',    icon: FileText,       onClick: () => setActiveModal('case-study') },
    { label: 'Send Pricing',       icon: PoundSterling,  onClick: () => setActiveModal('send-pricing') },
    { label: 'Risk Flag',          icon: AlertTriangle,  onClick: () => setActiveModal('risk-flag') },
    { label: 'Re-engage Trial',    icon: RefreshCw,      onClick: () => setActiveModal('re-engage') },
    { label: 'Send ROI Calc',      icon: Calculator,     onClick: () => setActiveModal('roi-calc') },
    { label: 'NPS Survey',         icon: BarChart2,      onClick: () => setActiveModal('nps') },
    { label: 'Trial Scorecard',    icon: ClipboardCheck, onClick: () => setActiveModal('scorecard') },
    { label: 'CS Handover',        icon: UserCheck,      onClick: () => setActiveModal('cs-handover') },
    { label: 'Competitor Compare', icon: GitCompare,     onClick: () => setActiveModal('competitor') },
    { label: 'Dept Insights',      icon: Star,         onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',          icon: Building2,    onClick: () => setShowDeptInfo(true) },
  ]

  const hasData = useHasDashboardData('trials')

  const deptStaff = getDeptStaff('trials')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="trials" />}
      <DashboardEmptyState pageKey="trials"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your trials data` : 'No trial data yet'}
        description="Track your trial signups, conversion rates, and time-to-value across your trial pipeline."
        uploads={[
          { key: 'trials', label: 'Upload Trial Signups (CSV)' },
          { key: 'onboarding', label: 'Upload Onboarding Data (CSV)' },
        ]}
      />
    </>
  )

  const trialsHighlights = ['23 active trials — 5 ending this week', 'Conversion rate: 62% — up 5% vs last quarter', 'Avg trial length: 14 days — stable', '3 trials with high engagement ready for conversion call', 'Day 3 email sequence: 78% open rate']

  return (
    <PageShell title="Trials" subtitle="Trial management, conversions and pipeline">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <SectionCard title="Active Trials" action="View all">
            <Table
              cols={['Company', 'Contact', 'Start Date', 'Day', 'Engagement', 'Status']}
              rows={trials.map((t) => [
                t.company, t.contact, t.start, t.day,
                <EngagementDot key={t.company} level={t.engagement} />,
                <Badge key={t.company + 's'} status={t.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Trials Ending Soon">
              {endingSoon.map((t) => (
                <PanelItem key={t.company} title={t.company} sub={`${t.contact} · Ends in ${t.days}`} extra={`Engagement: ${t.engagement}`} badge="Ending" />
              ))}
            </SectionCard>
            <SectionCard title="Conversion Opportunities">
              {opportunities.map((o) => (
                <PanelItem key={o.company} title={o.company} sub={o.reason} badge={o.badge} />
              ))}
            </SectionCard>
          </>
        }
      />
      {showTrial && <NewTrialModal onClose={() => setShowTrial(false)} onSubmit={() => { setShowTrial(false); showToast('Trial created') }} />}
      <AIInsightsReport dept="trials" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="trials" onClose={() => setShowDeptInfo(false)} />}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="trials" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Trials</span>
            </div>
            <ul className="space-y-2.5">
              {trialsHighlights.map((h: string, i: number) => (
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
              <div className="text-center py-6">
                <div className="text-4xl mb-4">{'\u2705'}</div>
                <div className="text-white font-semibold mb-3">Action completed</div>
                <div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-400 text-left leading-relaxed mb-4">{submitResult}</div>
                <button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold text-lg">{({'schedule-demo':'\u{1F3A5} Schedule Demo','send-welcome':'\u{1F4E7} Send Welcome','health-check':'\u{1F49A} Health Check','day14':'\u{1F4E7} Day 14 Email','upgrade-nudge':'\u{1F4C8} Upgrade Nudge','book-onboarding':'\u{1F4C5} Book Onboarding','case-study':'\u{1F4C4} Send Case Study','send-pricing':'\u{1F4B7} Send Pricing','risk-flag':'\u{1F6A8} Risk Flag','re-engage':'\u{1F504} Re-engage','roi-calc':'\u{1F4CA} ROI Calculator','nps':'\u2B50 NPS Survey','scorecard':'\u{1F4CB} Trial Scorecard','cs-handover':'\u{1F91D} CS Handover','competitor':'\u{1F94A} Competitor Compare'} as Record<string,string>)[activeModal] || activeModal}</h3>
                  <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-white text-2xl">&times;</button>
                </div>
                {activeModal === 'schedule-demo' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" placeholder="Company name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Contact</label><input type="text" placeholder="Name / email" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Demo type</label><div className="flex gap-2 flex-wrap">{['Full product','Feature-specific','Executive','Technical'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Duration</label><div className="flex gap-2">{['30 min','45 min','60 min'].map(d=><button key={d} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{d}</button>)}</div></div><button onClick={()=>{setSubmitResult('Demo scheduled for next Tuesday at 2pm. Google Meet link created. Calendar invite sent.')}} disabled={submitting} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4C5}'} Schedule Demo</button></div>)}
                {activeModal === 'send-welcome' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Contact name</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Goal</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Reduce admin</option><option>Better reporting</option><option>Team visibility</option><option>Replace tool</option></select></div><button onClick={()=>{setSubmitResult('Welcome email draft created in Gmail. Includes portal link, 3 quick wins, and onboarding booking link.')}} disabled={submitting} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4E7}'} Create Welcome Draft</button></div>)}
                {activeModal === 'health-check' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Days into trial</label><input type="number" placeholder="7" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Login activity</label><div className="flex gap-2">{['Daily','2-3x/wk','Once','Never'].map(a=><button key={a} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{a}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Signals</label><div className="space-y-1">{['Invited team','Connected integrations','Completed quick wins','Asked support Q','Attended demo'].map(s=><label key={s} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" />{s}</label>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Likelihood</label><div className="flex gap-2">{['Hot \u{1F525}','Warm \u26A1','Cold \u{1F9CA}','At risk \u26A0\uFE0F'].map(l=><button key={l} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{l}</button>)}</div></div><button onClick={()=>{setActiveModal(null);showToast('Health check logged')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2705'} Log Health Check</button></div>)}
                {activeModal === 'day14' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Features used</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Day 14 check-in email draft created. Highlights features not yet explored, trial end date reminder, and conversion CTA.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4E7}'} Create Day 14 Draft</button></div>)}
                {activeModal === 'upgrade-nudge' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Approach</label><div className="flex gap-2 flex-wrap">{['Urgency','Value','Incentive','Social proof','Personal'].map(a=><button key={a} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{a}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Offer</label><input type="text" placeholder="e.g. 20% off first 3 months" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Upgrade nudge email draft created. Includes urgency messaging, value proposition, and one-click upgrade link.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4E7}'} Create Nudge Draft</button></div>)}
                {activeModal === 'book-onboarding' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Contact email</label><input type="email" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Call type</label><div className="flex gap-2">{['30 min setup','60 min full','15 min quick'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><button onClick={()=>{setSubmitResult('Onboarding call booked for next Wednesday 10am. Google Meet link created. Invite sent to contact.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4C5}'} Book Onboarding</button></div>)}
                {activeModal === 'case-study' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Case study</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Bramble Hill \u2014 40% admin reduction</option><option>Whitestone \u2014 team visibility</option><option>Greenfield \u2014 pipeline growth</option></select></div><button onClick={()=>{setSubmitResult('Case study email draft created with personalised intro and CTA to book a call.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4E7}'} Send Case Study</button></div>)}
                {activeModal === 'send-pricing' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Plan</label><div className="flex gap-2">{['Starter \u00A399','Pro \u00A3299','Business \u00A3599','Enterprise'].map(p=><button key={p} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{p}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Offer</label><input type="text" placeholder="e.g. First month free" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('Pricing email draft created with plan details, comparison table, and special offer.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4B7}'} Send Pricing</button></div>)}
                {activeModal === 'risk-flag' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Risk reason</label><div className="flex gap-2 flex-wrap">{['No login 7d+','Ending in 48hrs','Support complaint','Competitor','Budget concern','Champion left'].map(r=><button key={r} className="py-1.5 px-2 rounded-xl border border-red-800 text-xs text-red-400 hover:bg-red-900/20 transition-all">{r}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Recovery action</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Personal call</option><option>Extend trial</option><option>Send case study</option><option>Escalate</option><option>Offer discount</option></select></div><button onClick={()=>{setActiveModal(null);showToast('Trial flagged as at risk')}} className="w-full bg-red-700 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F6A8}'} Flag as At Risk</button></div>)}
                {activeModal === 're-engage' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Days since login</label><input type="number" placeholder="10" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Angle</label><div className="flex gap-2 flex-wrap">{['New feature','Quick win','Check-in','Video walkthrough','Offer help'].map(a=><button key={a} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{a}</button>)}</div></div><button onClick={()=>{setSubmitResult('Re-engagement email draft created. Genuine, helpful tone with specific feature tip.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4E7}'} Send Re-engagement</button></div>)}
                {activeModal === 'roi-calc' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Team size</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Admin hours/week</label><input type="number" placeholder="10" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Hourly cost (&pound;)</label><input type="number" placeholder="25" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('ROI email draft created with personalised cost savings calculation and 3-line business case for CFO.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F4CA}'} Send ROI Calc</button></div>)}
                {activeModal === 'nps' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Timing</label><div className="flex gap-2">{['Day 7','Day 14','Day 21','Post conversion'].map(t=><button key={t} className="flex-1 py-1.5 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{t}</button>)}</div></div><button onClick={()=>{setSubmitResult('NPS survey email draft created. Asks 0-10 rating and one open improvement question.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2B50'} Send NPS Survey</button></div>)}
                {activeModal === 'scorecard' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div className="space-y-2 bg-gray-900 rounded-xl p-3">{[['Logged in 24hrs','10'],['Invited team','20'],['Connected integration','20'],['3+ quick wins','15'],['Attended demo','20'],['Responded to email','10'],['Viewed pricing','5']].map(([c,p])=><label key={c} className="flex items-center justify-between text-xs text-gray-300"><span className="flex items-center gap-2"><input type="checkbox" />{c}</span><span className="text-teal-400 font-medium">+{p}</span></label>)}</div><div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-3 text-xs text-purple-400">70+: Hot \u2014 convert now. 40-69: Warm \u2014 nurture. &lt;40: At risk.</div><button onClick={()=>{setActiveModal(null);showToast('Trial scorecard saved')}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2705'} Save Scorecard</button></div>)}
                {activeModal === 'cs-handover' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Plan</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Starter</option><option>Pro</option><option>Business</option><option>Enterprise</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">CSM assigned</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Key context</label><textarea rows={3} placeholder="Goals, promises, blockers..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setSubmitResult('CS handover note created and sent to cs@lumio.com with full context.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F91D}'} Create Handover</button></div>)}
                {activeModal === 'competitor' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Company</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Competitor</label><div className="flex gap-2 flex-wrap">{['Monday.com','Notion','Salesforce','HubSpot','Asana','Other'].map(c=><button key={c} className="py-1.5 px-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-teal-500 transition-all">{c}</button>)}</div></div><button onClick={()=>{setSubmitResult('Comparison email draft created. Covers 4 areas where Lumio wins, 1 honest trade-off, and why Lumio is the right fit.')}} className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u{1F94A}'} Send Comparison</button></div>)}
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
