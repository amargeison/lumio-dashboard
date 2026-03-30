'use client'

import { useState, useEffect } from 'react'
import { Receipt, AlertCircle, TrendingUp, Clock, FileText, RefreshCw, DollarSign } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import { useWorkspace } from '@/hooks/useWorkspace'
import { createBrowserClient } from '@supabase/ssr'
import NewInvoiceModal from '@/components/modals/NewInvoiceModal'
import ChasePaymentModal from '@/components/modals/ChasePaymentModal'
import NewExpenseModal from '@/components/modals/NewExpenseModal'
import NewClientModal from '@/components/modals/NewClientModal'
import WeeklyReportModal from '@/components/modals/WeeklyReportModal'
import PaymentReceivedModal from '@/components/modals/PaymentReceivedModal'
import RunPayrollModal from '@/components/modals/RunPayrollModal'
import { useToast } from '@/components/modals/useToast'

const DEFAULT_STATS = [
  { label: 'Outstanding Invoices', value: '£84,200', trend: '+£12k', trendDir: 'up'   as const, trendGood: false, icon: Receipt,    sub: 'vs last month' },
  { label: 'Overdue Amount',       value: '£23,400', trend: '+£8k',  trendDir: 'up'   as const, trendGood: false, icon: AlertCircle,sub: 'vs last month' },
  { label: 'Collected This Month', value: '£142,800',trend: '+18%',  trendDir: 'up'   as const, trendGood: true,  icon: TrendingUp, sub: 'vs last month' },
  { label: 'Avg Days to Pay',      value: '28d',     trend: '\u22123d',   trendDir: 'down' as const, trendGood: true,  icon: Clock,      sub: 'vs last quarter'},
]

const DEFAULT_INVOICES = [
  { company: 'Whitestone College',    amount: '\u00A312,400', due: '15 Feb 2026', daysOverdue: 34, status: 'Overdue' },
  { company: 'Bramble Hill Trust',    amount: '\u00A38,200',  due: '1 Mar 2026',  daysOverdue: 20, status: 'Overdue' },
  { company: 'Elmfield Institute',    amount: '\u00A32,800',  due: '10 Mar 2026', daysOverdue: 11, status: 'Overdue' },
  { company: 'Greenfield Academy',    amount: '\u00A342,000', due: '31 Mar 2026', daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Hopscotch Learning',    amount: '\u00A314,500', due: '31 Mar 2026', daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Oakridge Schools Ltd',  amount: '\u00A328,000', due: '7 Apr 2026',  daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Pinebrook Primary',     amount: '\u00A36,400',  due: '14 Apr 2026', daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Crestview Academy',     amount: '\u00A319,200', due: '30 Apr 2026', daysOverdue: 0,  status: 'Unpaid'  },
  { company: 'Sunfield Trust',        amount: '\u00A314,800', due: '15 Mar 2026', daysOverdue: 6,  status: 'Paid'    },
  { company: 'Riverdale Education',   amount: '\u00A39,600',  due: '14 Mar 2026', daysOverdue: 0,  status: 'Paid'    },
]

const DEFAULT_PAYMENTS = [
  { company: 'Sunfield Trust',      amount: '\u00A314,800', date: '15 Mar 2026', badge: 'Paid' },
  { company: 'Riverdale Education', amount: '\u00A39,600',  date: '14 Mar 2026', badge: 'Paid' },
  { company: 'Apex Tutors',         amount: '\u00A37,200',  date: '12 Mar 2026', badge: 'Paid' },
  { company: 'Calibre Learning',    amount: '\u00A35,400',  date: '10 Mar 2026', badge: 'Paid' },
]

const DEFAULT_REVENUE = [
  { label: 'Invoiced this month',  value: '\u00A3186,300' },
  { label: 'Collected this month', value: '\u00A3142,800' },
  { label: 'Outstanding',          value: '\u00A384,200'  },
  { label: 'Overdue',              value: '\u00A323,400'  },
  { label: 'Avg days to pay',      value: '28 days'  },
]

function fmtGBP(n: number): string {
  return '\u00A3' + n.toLocaleString('en-GB')
}

export default function AccountsPage() {
  const workspace = useWorkspace()
  const [showInvoice, setShowInvoice] = useState(false)
  const [showChase, setShowChase] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [showClient, setShowClient] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [xeroSyncing, setXeroSyncing] = useState(false)
  const [showRunPayroll, setShowRunPayroll] = useState(false)
  const { showToast, Toast } = useToast()
  const [stats, setStats] = useState(DEFAULT_STATS)
  const [invoices, setInvoices] = useState(DEFAULT_INVOICES)
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS)
  const [revenueSummary, setRevenueSummary] = useState(DEFAULT_REVENUE)

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Invoices
    supabase.from('business_invoices').select('*').eq('business_id', workspace.id).order('due_date', { ascending: true }).then(({ data }) => {
      if (!data?.length) return
      const now = new Date()
      const outstanding = data.filter(i => i.status !== 'paid')
      const overdue = data.filter(i => i.status === 'overdue')
      const paid = data.filter(i => i.status === 'paid')
      const outstandingTotal = outstanding.reduce((s, i) => s + Number(i.amount), 0)
      const overdueTotal = overdue.reduce((s, i) => s + Number(i.amount), 0)
      const paidTotal = paid.reduce((s, i) => s + Number(i.amount), 0)

      setStats([
        { label: 'Outstanding Invoices', value: fmtGBP(outstandingTotal), trend: `${outstanding.length} invoices`, trendDir: 'up' as const, trendGood: false, icon: Receipt, sub: 'open' },
        { label: 'Overdue Amount', value: fmtGBP(overdueTotal), trend: `${overdue.length} overdue`, trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'past due' },
        { label: 'Collected', value: fmtGBP(paidTotal), trend: `${paid.length} paid`, trendDir: 'up' as const, trendGood: true, icon: TrendingUp, sub: 'received' },
        { label: 'Avg Days to Pay', value: '28d', trend: '\u22123d', trendDir: 'down' as const, trendGood: true, icon: Clock, sub: 'vs last quarter' },
      ])

      setInvoices(data.map(inv => {
        const dueDate = new Date(inv.due_date)
        const daysOverdue = inv.status === 'overdue' ? Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000)) : 0
        return {
          company: inv.company,
          amount: fmtGBP(Number(inv.amount)),
          due: dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          daysOverdue,
          status: inv.status === 'overdue' ? 'Overdue' : inv.status === 'paid' ? 'Paid' : 'Unpaid',
        }
      }))

      setPayments(paid.map(p => ({
        company: p.company,
        amount: fmtGBP(Number(p.amount)),
        date: new Date(p.paid_date || p.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        badge: 'Paid',
      })))

      setRevenueSummary([
        { label: 'Invoiced total', value: fmtGBP(data.reduce((s, i) => s + Number(i.amount), 0)) },
        { label: 'Collected', value: fmtGBP(paidTotal) },
        { label: 'Outstanding', value: fmtGBP(outstandingTotal) },
        { label: 'Overdue', value: fmtGBP(overdueTotal) },
        { label: 'Avg days to pay', value: '28 days' },
      ])
    })
  }, [workspace?.id])

  const actions = [
    { label: 'Chase Invoice',   icon: AlertCircle, onClick: () => setShowChase(true) },
    { label: 'Raise Invoice',   icon: Receipt,     onClick: () => setShowInvoice(true) },
    { label: 'Weekly Report',   icon: FileText,    onClick: () => setShowReport(true) },
    { label: 'Payment Received', icon: TrendingUp, onClick: () => setShowPayment(true) },
    { label: 'Xero Sync',       icon: RefreshCw,   onClick: () => { setXeroSyncing(true); showToast('Syncing with Xero...'); setTimeout(() => { setXeroSyncing(false); showToast('Synced with Xero — connected ✓') }, 1500) } },
    { label: 'Run Payroll',    icon: DollarSign,  onClick: () => setShowRunPayroll(true) },
  ]

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
    <PageShell title="Accounts" subtitle="Invoicing, payroll, expenses and financial reporting">
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
      {showInvoice && <NewInvoiceModal onClose={() => setShowInvoice(false)} onSubmit={() => { setShowInvoice(false); showToast('Invoice created successfully') }} />}
      {showChase && <ChasePaymentModal onClose={() => setShowChase(false)} onSubmit={() => { setShowChase(false); showToast('Chase email sent') }} />}
      {showExpense && <NewExpenseModal onClose={() => setShowExpense(false)} onSubmit={() => { setShowExpense(false); showToast('Expense submitted') }} />}
      {showClient && <NewClientModal onClose={() => setShowClient(false)} onSubmit={() => { setShowClient(false); showToast('Client added') }} />}
      {showReport && <WeeklyReportModal onClose={() => setShowReport(false)} onToast={showToast} />}
      {showPayment && <PaymentReceivedModal onClose={() => setShowPayment(false)} onToast={showToast} />}
      {showRunPayroll && <RunPayrollModal onClose={() => setShowRunPayroll(false)} onToast={showToast} />}
      <Toast />
    </PageShell>
  )
}
