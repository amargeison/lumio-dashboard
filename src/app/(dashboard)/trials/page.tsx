'use client'

import { useState } from 'react'
import { FlaskConical, Clock, TrendingUp, Calendar, UserPlus, Send, FileText, AlertCircle, Shield, Star, Building2, Sparkles } from 'lucide-react'
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
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'Admin Portal',        icon: Shield,       onClick: () => window.open('/admin', '_blank') },
    { label: 'New Trial',           icon: FlaskConical, onClick: () => setShowTrial(true) },
    { label: 'Extend Trial',        icon: Calendar,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Convert to Customer', icon: UserPlus,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'End Trial',           icon: AlertCircle,  onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Send Day 3 Email',    icon: Send,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Send Day 7 Email',    icon: Send,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
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
    </PageShell>
  )
}
