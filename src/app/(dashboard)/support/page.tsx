'use client'

import { useState } from 'react'
import { Headphones, Clock, Star, CheckCircle2, Plus, MessageSquare, Building2, UserPlus, Send, FileText, Phone, CalendarPlus, BookOpen, HelpCircle, Shield, Sparkles } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import NewSupportTicketModal from '@/components/modals/NewSupportTicketModal'
import WikiBuilderModal from '@/components/modals/WikiBuilderModal'
import FAQBuilderModal from '@/components/modals/FAQBuilderModal'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Open Tickets',      value: '18',   trend: '+5%',  trendDir: 'up'   as const, trendGood: false, icon: Headphones,   sub: 'vs last week'   },
  { label: 'Avg Response Time', value: '2.4h', trend: '+0.3h',trendDir: 'up'   as const, trendGood: false, icon: Clock,        sub: 'vs last week'   },
  { label: 'CSAT Score',        value: '94%',  trend: '+2%',  trendDir: 'up'   as const, trendGood: true,  icon: Star,         sub: 'vs last month'  },
  { label: 'Resolved Today',    value: '12',   trend: '+4',   trendDir: 'up'   as const, trendGood: true,  icon: CheckCircle2, sub: 'vs yesterday'   },
]

const tickets = [
  { id: 'SUP-0312', subject: 'Cannot login — SSO issue',         customer: 'Greenfield Academy',   priority: 'High',   assigned: 'Amara D.',   age: '4h',   status: 'Open'     },
  { id: 'SUP-0311', subject: 'Missing student data after import', customer: 'Bramble Hill Trust',   priority: 'High',   assigned: 'Chris O.',   age: '6h',   status: 'Open'     },
  { id: 'SUP-0310', subject: 'Reports not loading',               customer: 'Hopscotch Learning',   priority: 'Medium', assigned: 'Amara D.',   age: '1d',   status: 'Pending'  },
  { id: 'SUP-0309', subject: 'Feature request — bulk upload',     customer: 'Oakridge Schools Ltd', priority: 'Low',    assigned: 'Yuki T.',    age: '2d',   status: 'Open'     },
  { id: 'SUP-0308', subject: 'Password reset not sending email',  customer: 'Crestview Academy',    priority: 'Medium', assigned: 'Chris O.',   age: '2d',   status: 'Pending'  },
  { id: 'SUP-0307', subject: 'Dashboard slow to load',            customer: 'Elmfield Institute',   priority: 'Low',    assigned: 'Yuki T.',    age: '3d',   status: 'Open'     },
  { id: 'SUP-0306', subject: 'API integration error 403',         customer: 'Sunfield Trust',       priority: 'High',   assigned: 'Chris O.',   age: '3d',   status: 'Overdue'  },
  { id: 'SUP-0305', subject: 'Notification emails going to spam', customer: 'Pinebrook Primary',    priority: 'Medium', assigned: 'Amara D.',   age: '4d',   status: 'Pending'  },
  { id: 'SUP-0304', subject: 'User permissions not saving',       customer: 'Whitestone College',   priority: 'High',   assigned: 'Yuki T.',    age: '5d',   status: 'Overdue'  },
  { id: 'SUP-0303', subject: 'Training materials link broken',    customer: 'Riverdale Education',  priority: 'Low',    assigned: 'Amara D.',   age: '6d',   status: 'Resolved' },
]

const chats = [
  { customer: 'Greenfield Academy',  user: 'Helen Park',     wait: '3 min',  status: 'Active' },
  { customer: 'Bramble Hill Trust',  user: 'Tom Wright',     wait: '1 min',  status: 'Active' },
  { customer: 'Sunfield Trust',      user: 'Lisa Chen',      wait: '8 min',  status: 'Active' },
]

const ops = [
  { label: 'New tickets today',     value: '7'  },
  { label: 'Resolved today',        value: '12' },
  { label: 'Escalated today',       value: '2'  },
  { label: 'Avg first response',    value: '1.8h'},
  { label: 'SLA breaches today',    value: '1'  },
]

export default function SupportPage() {
  const [showTicket, setShowTicket] = useState(false)
  const [showCreateWiki, setShowCreateWiki] = useState(false)
  const [showCreateFAQ, setShowCreateFAQ] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'New Ticket',     icon: Plus,          onClick: () => setShowTicket(true) },
    { label: 'Open Chat',      icon: MessageSquare, onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Create School',  icon: Building2,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Add User',       icon: UserPlus,      onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Send Update',    icon: Send,          onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Support Report', icon: FileText,      onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Call a School',  icon: Phone,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Book Meeting',   icon: CalendarPlus,  onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Create Wiki',   icon: BookOpen,      onClick: () => setShowCreateWiki(true) },
    { label: 'Create FAQ',    icon: HelpCircle,    onClick: () => setShowCreateFAQ(true) },
    { label: 'Admin Portal',  icon: Shield,        onClick: () => window.open('/admin', '_blank') },
    { label: 'Dept Insights', icon: Star,         onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',    icon: Building2,    onClick: () => setShowDeptInfo(true) },
  ]

  const hasData = useHasDashboardData('support')

  const deptStaff = getDeptStaff('support')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="support" />}
      <DashboardEmptyState pageKey="support"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your support data` : 'No support data yet'}
        description={deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Support Lead'}. Upload your support tickets, customer contacts and SLA data to activate the Support module with ticket management and response tracking.` : 'Upload your support tickets, customer contacts and SLA data to activate the Support module with ticket management and response tracking.'}
        uploads={[
          { key: 'tickets', label: 'Upload Support Tickets (CSV)' },
          { key: 'contacts', label: 'Upload Customer Contacts (CSV)' },
        ]}
      />
    </>
  )

  const supportHighlights = ['23 open tickets — 3 exceed SLA (48hr threshold)', 'Avg response time: 2.4 hours — within target', 'CSAT: 4.3/5 — stable month-on-month', 'Top category: Login & Access issues (31%)', 'Agent of the month: highest resolution rate']

  return (
    <PageShell title="Support" subtitle="Helpdesk, tickets, wiki and customer success">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <DeptAISummary dept="support" portal="business" />
        <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} style={{ color: '#6C3FC5' }} />
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Support</span>
          </div>
          <ul className="space-y-2.5">
            {supportHighlights.map((h: string, i: number) => (
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
          <SectionCard title="Helpdesk Queue" action="View all">
            <Table
              cols={['Ticket #', 'Subject', 'Customer', 'Priority', 'Assigned', 'Age', 'Status']}
              rows={tickets.map((t) => [
                <span key={t.id} className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{t.id}</span>,
                t.subject, t.customer,
                <Badge key={t.id + 'p'} status={t.priority} />,
                t.assigned, t.age,
                <Badge key={t.id + 's'} status={t.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Live Chat — Active Sessions">
              {chats.map((c) => (
                <PanelItem key={c.customer} title={c.customer} sub={c.user} extra={`Waiting ${c.wait}`} badge="Active" />
              ))}
            </SectionCard>
            <SectionCard title="Operations Today">
              <div className="flex flex-col">
                {ops.map((o) => (
                  <div key={o.label} className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid #1F2937' }}>
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>{o.label}</span>
                    <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{o.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        }
      />
      {showTicket && <NewSupportTicketModal onClose={() => setShowTicket(false)} onSubmit={() => { setShowTicket(false); showToast('Support ticket created') }} />}
      {showCreateWiki && <WikiBuilderModal onClose={() => setShowCreateWiki(false)} onToast={showToast} />}
      {showCreateFAQ && <FAQBuilderModal onClose={() => setShowCreateFAQ(false)} onToast={showToast} />}
      <AIInsightsReport dept="support" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="support" onClose={() => setShowDeptInfo(false)} />}
    </PageShell>
  )
}
