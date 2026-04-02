'use client'

import { useState } from 'react'
import { Users, Activity, Send, FileText, AlertCircle, BarChart2, Star, Building2, Sparkles } from 'lucide-react'
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
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'RAG Check',       icon: Activity,    onClick: () => setShowRAG(true) },
    { label: 'Start Recovery',  icon: AlertCircle, onClick: () => setShowRecovery(true) },
    { label: 'Send Check-in',   icon: Send,        onClick: () => setShowCheckIn(true) },
    { label: 'Usage Report',    icon: FileText,    onClick: () => setShowUsage(true) },
    { label: 'Health Report',   icon: FileText,    onClick: () => setShowHealth(true) },
    { label: 'At-Risk Report',  icon: BarChart2,   onClick: () => setShowAtRisk(true) },
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
    </PageShell>
  )
}
