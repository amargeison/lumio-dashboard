'use client'

import { Receipt, AlertCircle, TrendingUp, Clock, FileText, RefreshCw } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'

const stats = [
  { label: 'Outstanding Invoices', value: '£84,200', trend: '+£12k', trendDir: 'up'   as const, trendGood: false, icon: Receipt,    sub: 'vs last month' },
  { label: 'Overdue Amount',       value: '£23,400', trend: '+£8k',  trendDir: 'up'   as const, trendGood: false, icon: AlertCircle,sub: 'vs last month' },
  { label: 'Collected This Month', value: '£142,800',trend: '+18%',  trendDir: 'up'   as const, trendGood: true,  icon: TrendingUp, sub: 'vs last month' },
  { label: 'Avg Days to Pay',      value: '28d',     trend: '−3d',   trendDir: 'down' as const, trendGood: true,  icon: Clock,      sub: 'vs last quarter'},
]

const actions = [
  { label: 'Chase Invoice',  icon: AlertCircle },
  { label: 'Raise Invoice',  icon: Receipt     },
  { label: 'Weekly Report',  icon: FileText    },
  { label: 'Payment Received',icon: TrendingUp },
  { label: 'Xero Sync',      icon: RefreshCw   },
]

const invoices = [
  { company: 'Whitestone College',    amount: '£12,400', due: '15 Feb 2026', daysOverdue: 34, status: 'Overdue' },
  { company: 'Bramble Hill Trust',    amount: '£8,200',  due: '1 Mar 2026',  daysOverdue: 20, status: 'Overdue' },
  { company: 'Elmfield Institute',    amount: '£2,800',  due: '10 Mar 2026', daysOverdue: 11, status: 'Overdue' },
  { company: 'Greenfield Academy',    amount: '£42,000', due: '31 Mar 2026', daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Hopscotch Learning',    amount: '£14,500', due: '31 Mar 2026', daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Oakridge Schools Ltd',  amount: '£28,000', due: '7 Apr 2026',  daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Pinebrook Primary',     amount: '£6,400',  due: '14 Apr 2026', daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Crestview Academy',     amount: '£19,200', due: '30 Apr 2026', daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Sunfield Trust',        amount: '£14,800', due: '15 Mar 2026', daysOverdue: 6,  status: 'Paid'    },
  { company: 'Riverdale Education',   amount: '£9,600',  due: '14 Mar 2026', daysOverdue: 0,  status: 'Paid'    },
]

const payments = [
  { company: 'Sunfield Trust',      amount: '£14,800', date: '15 Mar 2026', badge: 'Paid' },
  { company: 'Riverdale Education', amount: '£9,600',  date: '14 Mar 2026', badge: 'Paid' },
  { company: 'Apex Tutors',         amount: '£7,200',  date: '12 Mar 2026', badge: 'Paid' },
  { company: 'Calibre Learning',    amount: '£5,400',  date: '10 Mar 2026', badge: 'Paid' },
]

const revenueSummary = [
  { label: 'Invoiced this month',  value: '£186,300' },
  { label: 'Collected this month', value: '£142,800' },
  { label: 'Outstanding',          value: '£84,200'  },
  { label: 'Overdue',              value: '£23,400'  },
  { label: 'Avg days to pay',      value: '28 days'  },
]

export default function AccountsPage() {
  const hasData = useHasDashboardData('accounts')
  if (hasData === null) return null
  if (!hasData) return <DashboardEmptyState pageKey="accounts"
    title="No accounts data yet"
    description="Upload your customer accounts, ARR data and contract information to activate the Accounts module."
    uploads={[
      { key: 'accounts', label: 'Upload Customer Accounts (CSV)' },
      { key: 'revenue', label: 'Upload ARR / Revenue Data (CSV/XLSX)', accept: '.csv,.xlsx' },
      { key: 'contracts', label: 'Upload Contracts (CSV)' },
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
          <SectionCard title="Invoice Queue" action="View all">
            <Table
              cols={['Company', 'Amount', 'Due Date', 'Days Overdue', 'Status']}
              rows={invoices.map((inv) => [
                inv.company, inv.amount, inv.due,
                inv.daysOverdue > 0
                  ? <span key={inv.company} style={{ color: '#EF4444' }}>{inv.daysOverdue}d</span>
                  : <span key={inv.company} style={{ color: '#9CA3AF' }}>—</span>,
                <Badge key={inv.company} status={inv.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Recent Payments">
              {payments.map((p) => (
                <PanelItem key={p.company} title={p.company} sub={p.date} extra={p.amount} badge={p.badge} />
              ))}
            </SectionCard>
            <SectionCard title="Weekly Revenue Summary">
              <div className="flex flex-col">
                {revenueSummary.map((r) => (
                  <div key={r.label} className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid #1F2937' }}>
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>{r.label}</span>
                    <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        }
      />
    </PageShell>
  )
}
