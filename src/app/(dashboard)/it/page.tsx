'use client'

import { useState } from 'react'
import { Server, Clock, Monitor, Key, Plus, UserPlus, Package, RefreshCw, FileText, Shield, AlertTriangle, Sparkles } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import NewITTicketModal from '@/components/modals/NewITTicketModal'
import { useToast } from '@/components/modals/useToast'

const stats = [
  { label: 'Open IT Requests',       value: '12',  trend: '+3',  trendDir: 'up'   as const, trendGood: false, icon: Server,  sub: 'vs last week'   },
  { label: 'Pending Provisioning',   value: '5',   trend: '0',   trendDir: 'up'   as const, trendGood: true,  icon: Clock,   sub: 'stable'         },
  { label: 'Assets Registered',      value: '284', trend: '+8',  trendDir: 'up'   as const, trendGood: true,  icon: Monitor, sub: 'this quarter'   },
  { label: 'Licences Due Renewal',   value: '7',   trend: '+2',  trendDir: 'up'   as const, trendGood: false, icon: Key,     sub: 'within 60 days' },
]

const requests = [
  { id: 'IT-0088', type: 'Account Setup',   employee: 'Sophie Williams',  priority: 'High',   status: 'Pending',     age: '2h'  },
  { id: 'IT-0087', type: 'Laptop Request',  employee: 'Liam Brennan',     priority: 'Medium', status: 'Pending',     age: '4h'  },
  { id: 'IT-0086', type: 'Software Install',employee: 'Tom Ashworth',     priority: 'Low',    status: 'Open',        age: '1d'  },
  { id: 'IT-0085', type: 'VPN Access',      employee: 'Priya Kapoor',     priority: 'High',   status: 'Pending',     age: '1d'  },
  { id: 'IT-0084', type: 'Password Reset',  employee: 'Marcus Reid',      priority: 'Low',    status: 'Provisioned', age: '2d'  },
  { id: 'IT-0083', type: 'New Monitor',     employee: 'Nadia Petrov',     priority: 'Low',    status: 'Open',        age: '2d'  },
  { id: 'IT-0082', type: 'Account Setup',   employee: 'Fatima Al-Hassan', priority: 'High',   status: 'Pending',     age: '3d'  },
  { id: 'IT-0081', type: 'Slack Access',    employee: 'Oliver Chen',      priority: 'Medium', status: 'Provisioned', age: '4d'  },
  { id: 'IT-0080', type: 'License Request', employee: 'James Okafor',     priority: 'Medium', status: 'Open',        age: '5d'  },
  { id: 'IT-0079', type: 'Email Setup',     employee: 'Yuki Tanaka',      priority: 'High',   status: 'Provisioned', age: '6d'  },
  { id: 'IT-0078', type: 'MFA Enrollment',  employee: 'Chris Ogunleye',   priority: 'Medium', status: 'Complete',    age: '1w'  },
  { id: 'IT-0077', type: 'Asset Disposal',  employee: 'HR Team',          priority: 'Low',    status: 'Complete',    age: '1w'  },
]

const provisioning = [
  { name: 'Sophie Williams',  items: 'Slack, Google Workspace, Notion',  badge: 'Pending' },
  { name: 'Liam Brennan',     items: 'MacBook Pro, Slack, GitHub',        badge: 'Pending' },
  { name: 'Priya Kapoor',     items: 'VPN, Figma, Linear, Vercel',        badge: 'Pending' },
  { name: 'Fatima Al-Hassan', items: 'Google Workspace, Notion, Xero',    badge: 'Pending' },
  { name: 'Tom Ashworth',     items: 'Canva Pro, HubSpot, Mailchimp',     badge: 'Pending' },
]

const licences = [
  { product: 'GitHub Teams',     renew: '1 Apr 2026',  seats: '24',  cost: '£840/mo'  },
  { product: 'Figma Organisation',renew: '15 Apr 2026', seats: '8',   cost: '£360/mo' },
  { product: 'Linear',           renew: '1 May 2026',  seats: '32',  cost: '£480/mo'  },
  { product: 'Notion Teams',     renew: '12 May 2026', seats: '50',  cost: '£400/mo'  },
]

export default function ITPage() {
  const [showTicket, setShowTicket] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'New IT Request',    icon: Plus,           onClick: () => setShowTicket(true) },
    { label: 'Provision Account', icon: UserPlus,       onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Asset Register',    icon: Package,        onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Licence Renewal',   icon: RefreshCw,      onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'IT Report',         icon: FileText,       onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Access Review',     icon: Shield,         onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Security Alert',    icon: AlertTriangle,  onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Dept Insights',    icon: Sparkles,       onClick: () => setShowAIInsights(true) },
  ]

  const hasData = useHasDashboardData('it')
  if (hasData === null) return null
  if (!hasData) return <DashboardEmptyState pageKey="it"
    title="No IT data yet"
    description="Upload your systems inventory, SaaS stack and IT asset data to activate IT & Systems tracking."
    uploads={[
      { key: 'systems', label: 'Upload Systems Inventory (CSV)' },
      { key: 'assets', label: 'Upload Asset Register (CSV)' },
    ]}
  />

  return (
    <PageShell title="IT & Systems" subtitle="Infrastructure, security and system management">
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>
      <DeptAISummary dept="it" portal="business" />

      <QuickActions items={actions} />

      <TwoCol
        main={
          <SectionCard title="IT Request Queue" action="View all">
            <Table
              cols={['Request #', 'Type', 'Employee', 'Priority', 'Status', 'Age']}
              rows={requests.map((r) => [
                <span key={r.id} className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{r.id}</span>,
                r.type, r.employee,
                <Badge key={r.id + 'p'} status={r.priority} />,
                <Badge key={r.id + 's'} status={r.status} />,
                r.age,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Pending Provisioning">
              {provisioning.map((p) => (
                <PanelItem key={p.name} title={p.name} sub={p.items} badge={p.badge} />
              ))}
            </SectionCard>
            <SectionCard title="Upcoming Licence Renewals">
              {licences.map((l) => (
                <PanelItem key={l.product} title={l.product} sub={`Renews ${l.renew} · ${l.seats} seats`} extra={l.cost} badge="Pending" />
              ))}
            </SectionCard>
          </>
        }
      />
      {showTicket && <NewITTicketModal onClose={() => setShowTicket(false)} onSubmit={() => { setShowTicket(false); showToast('IT request created') }} />}
      <AIInsightsReport dept="it" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
    </PageShell>
  )
}
