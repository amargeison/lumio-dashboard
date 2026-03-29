'use client'

import { useState } from 'react'
import { Headphones, Clock, Star, CheckCircle2, Plus, MessageSquare, Building2, UserPlus, Send, FileText, Phone, CalendarPlus, BookOpen, HelpCircle, Shield } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import NewSupportTicketModal from '@/components/modals/NewSupportTicketModal'
import CreateWikiModal from '@/components/modals/CreateWikiModal'
import CreateFAQModal from '@/components/modals/CreateFAQModal'
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
    { label: 'Admin Portal',  icon: Shield,        onClick: () => window.location.href = '/admin' },
  ]

  const hasData = useHasDashboardData('support')
  if (hasData === null) return null
  if (!hasData) return <DashboardEmptyState pageKey="support"
    title="No support data yet"
    description="Upload your support tickets, customer contacts and SLA data to activate the Support module with ticket management and response tracking."
    uploads={[
      { key: 'tickets', label: 'Upload Support Tickets (CSV)' },
      { key: 'contacts', label: 'Upload Customer Contacts (CSV)' },
    ]}
  />

  return (
    <PageShell>
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

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
      {showCreateWiki && <CreateWikiModal onClose={() => setShowCreateWiki(false)} onToast={showToast} />}
      {showCreateFAQ && <CreateFAQModal onClose={() => setShowCreateFAQ(false)} onToast={showToast} />}
      <Toast />
    </PageShell>
  )
}
