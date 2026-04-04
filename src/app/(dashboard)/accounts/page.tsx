'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt, AlertCircle, TrendingUp, Clock, FileText, RefreshCw, DollarSign, Star, Building2, Sparkles, FileX, PiggyBank, Percent, ArrowLeftRight, ShoppingCart, CalendarCheck, BookOpen, Trash2, Landmark, Coins, ClipboardList } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import { AccountsPayroll } from '@/components/dashboard/LiveStaffPanels'
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
  const router = useRouter()
  const [showInvoice, setShowInvoice] = useState(false)
  const [showChase, setShowChase] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [showClient, setShowClient] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [xeroSyncing, setXeroSyncing] = useState(false)
  const [showRunPayroll, setShowRunPayroll] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const [activeModal, setActiveModal] = useState<string | null>(null)
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
    { label: 'Credit Note',       icon: FileX,           onClick: () => setActiveModal('credit-note') },
    { label: 'Expense Approval',  icon: Receipt,         onClick: () => setActiveModal('expense-approval') },
    { label: 'Budget Request',    icon: PiggyBank,       onClick: () => setActiveModal('budget-request') },
    { label: 'VAT Return',        icon: Percent,         onClick: () => setActiveModal('vat-return') },
    { label: 'Bank Reconciliation', icon: ArrowLeftRight, onClick: () => setActiveModal('bank-recon') },
    { label: 'Purchase Order',    icon: ShoppingCart,     onClick: () => setActiveModal('purchase-order') },
    { label: 'Supplier Payment',  icon: Building2,       onClick: () => setActiveModal('supplier-payment') },
    { label: 'Month End Close',   icon: CalendarCheck,    onClick: () => router.push('/accounts/month-end') },
    { label: 'Aged Debtors',      icon: AlertCircle,      onClick: () => setActiveModal('aged-debtors') },
    { label: 'Forecast Update',   icon: TrendingUp,       onClick: () => setActiveModal('forecast') },
    { label: 'Journal Entry',     icon: BookOpen,         onClick: () => setActiveModal('journal') },
    { label: 'Write Off',         icon: Trash2,           onClick: () => setActiveModal('write-off') },
    { label: 'Director Loan',     icon: Landmark,         onClick: () => setActiveModal('director-loan') },
    { label: 'Dividend',          icon: Coins,            onClick: () => setActiveModal('dividend') },
    { label: 'Audit Prep',        icon: ClipboardList,    onClick: () => router.push('/accounts/audit') },
    { label: 'Dept Insights', icon: Star,        onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',     icon: Building2,   onClick: () => setShowDeptInfo(true) },
  ]

  const hasData = useHasDashboardData('accounts')
  const isDemoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
  const hasImportedStaff = false // Staff now from Supabase only

  const deptStaff = getDeptStaff('accounts')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="accounts" />}
      <DashboardEmptyState pageKey="accounts"
        title="No accounts data yet"
        description="Import payroll and invoicing data to unlock financial dashboards, reporting and expense tracking."
        uploads={[
          { key: 'revenue', label: 'Upload Payroll Data (CSV)' },
          { key: 'accounts', label: 'Upload Invoice Data (CSV)' },
        ]}
      />
    </>
  )

  if (hasImportedStaff && !isDemoActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Accounts</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Payroll, invoicing and financial management</p>
        </div>
        <AccountsPayroll />
      </div>
    )
  }

  const accountsHighlights = ['7 overdue invoices totalling £12,400 — chase sequence active', 'MRR up 18% month-on-month to £42,800', 'Average contract value increased to £4,200', 'Forecast: £44,500 MRR next month based on pipeline', 'Expenses this month: £8,200 — within budget']

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
      <AIInsightsReport dept="accounts" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="accounts" onClose={() => setShowDeptInfo(false)} />}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="accounts" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Accounts</span>
            </div>
            <ul className="space-y-2.5">
              {accountsHighlights.map((h: string, i: number) => (
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{({'credit-note':'\u{1F4CB} Credit Note','expense-approval':'\u{1F9FE} Expense Approval','budget-request':'\u{1F437} Budget Request','vat-return':'% VAT Return','bank-recon':'\u{1F504} Bank Reconciliation','purchase-order':'\u{1F6D2} Purchase Order','supplier-payment':'\u{1F3E2} Supplier Payment','month-end':'\u{1F4C5} Month End Close','aged-debtors':'\u26A0\uFE0F Aged Debtors','forecast':'\u{1F4C8} Forecast Update','journal':'\u{1F4D6} Journal Entry','write-off':'\u{1F5D1}\uFE0F Write Off','director-loan':'\u{1F3E6} Director Loan','dividend':'\u{1FA99} Dividend','audit':'\u{1F4CB} Audit Prep'} as Record<string,string>)[activeModal] || activeModal}</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-white text-2xl">&times;</button>
            </div>
            {activeModal === 'credit-note' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Original invoice</label><input type="text" placeholder="INV-XXXX" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Customer</label><input type="text" placeholder="Company name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Amount (&pound;)</label><input type="number" placeholder="0.00" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Reason</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Billing error</option><option>Returned goods</option><option>Service not delivered</option><option>Goodwill</option></select></div><button onClick={()=>{setActiveModal(null);showToast(`Credit note issued — CN-${Math.floor(Math.random()*9000)+1000}`)}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">Issue Credit Note</button></div>)}
            {activeModal === 'expense-approval' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Submitted by</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Amount (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Category</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Travel</option><option>Meals</option><option>Software</option><option>Equipment</option><option>Training</option></select></div><div className="flex gap-2"><button onClick={()=>{setActiveModal(null);showToast('Expense approved')}} className="flex-1 bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2705'} Approve</button><button onClick={()=>{setActiveModal(null);showToast('Expense rejected')}} className="flex-1 bg-red-800 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u274C'} Reject</button></div></div>)}
            {activeModal === 'purchase-order' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Supplier</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400 mb-1 block">Qty</label><input type="number" placeholder="1" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Unit cost (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div><div><label className="text-xs text-gray-400 mb-1 block">Budget code</label><input type="text" placeholder="MKT-2026-Q2" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setActiveModal(null);showToast(`PO raised — #PO-${Math.floor(Math.random()*9000)+1000}`)}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">Raise PO</button></div>)}
            {activeModal === 'supplier-payment' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Supplier</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Amount (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Method</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>BACS</option><option>CHAPS</option><option>Faster Payment</option><option>Direct Debit</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" style={{ colorScheme: 'dark' }} /></div><button onClick={()=>{setActiveModal(null);showToast('Supplier payment scheduled')}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">Schedule Payment</button></div>)}
            {activeModal === 'journal' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Description</label><input type="text" placeholder="e.g. Accrual — Dec software" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400 mb-1 block">Debit account</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Credit account</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div><div><label className="text-xs text-gray-400 mb-1 block">Amount (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button onClick={()=>{setActiveModal(null);showToast('Journal entry posted')}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">Post Journal</button></div>)}
            {activeModal === 'dividend' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Type</label><div className="flex gap-2">{['Interim','Final'].map(o=><button key={o} className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500 transition-all">{o}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Amount per share (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Payment date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" style={{ colorScheme: 'dark' }} /></div><div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3 text-xs text-amber-400">{'\u26A0\uFE0F'} Dividend vouchers and board minutes required. Ensure retained profits are sufficient.</div><button onClick={()=>{setActiveModal(null);showToast('Dividend processed')}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">Process Dividend</button></div>)}
            {activeModal === 'director-loan' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Director</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Direction</label><div className="flex gap-2">{['Company \u2192 Director','Director \u2192 Company'].map(o=><button key={o} className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500 transition-all">{o}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Amount (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 text-xs text-red-400">{'\u26A0\uFE0F'} Loans over &pound;10,000 may attract s455 tax (33.75%). Repay within 9 months of year end.</div><button onClick={()=>{setActiveModal(null);showToast('Director loan recorded')}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">Record Loan</button></div>)}
            {['budget-request','vat-return','bank-recon','month-end','aged-debtors','forecast','write-off','audit'].includes(activeModal) && (<div className="space-y-3">{activeModal==='budget-request'&&<><div><label className="text-xs text-gray-400 mb-1 block">Department</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Marketing</option><option>Sales</option><option>Engineering</option><option>Operations</option><option>HR</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Amount (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Purpose</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}{activeModal==='vat-return'&&<><div><label className="text-xs text-gray-400 mb-1 block">Period</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Q1 2026</option><option>Q2 2026</option><option>Q4 2025</option></select></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400 mb-1 block">VAT on sales (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">VAT on purchases (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div></>}{activeModal==='bank-recon'&&<><div><label className="text-xs text-gray-400 mb-1 block">Account</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Main current</option><option>Savings</option><option>Client account</option><option>Payroll</option></select></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400 mb-1 block">Bank bal (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Book bal (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div></>}{activeModal==='month-end'&&<><div><label className="text-xs text-gray-400 mb-1 block">Month</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>March 2026</option><option>February 2026</option></select></div><div className="space-y-2">{['Invoices posted','Bank reconciled','Payroll posted','Accruals posted','Depreciation run','Accounts reviewed'].map(t=><label key={t} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" />{t}</label>)}</div></>}{activeModal==='aged-debtors'&&<><div className="space-y-2 bg-gray-900 rounded-xl p-3">{[['0-30d','\u00A324,800','\u2705'],['31-60d','\u00A38,400','\u26A0\uFE0F'],['61-90d','\u00A33,200','\u{1F534}'],['90d+','\u00A31,100','\u{1F534}']].map(([p,a,i])=><div key={p} className="flex justify-between text-sm"><span className="text-gray-400">{p}</span><span className="text-white">{i} {a}</span></div>)}</div><div><label className="text-xs text-gray-400 mb-1 block">Action for overdue</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Chase email</option><option>Phone call</option><option>Formal letter</option><option>Collections</option></select></div></>}{activeModal==='forecast'&&<><div><label className="text-xs text-gray-400 mb-1 block">Period</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Q2 2026</option><option>Q3 2026</option><option>FY 2026</option></select></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400 mb-1 block">Revenue (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Costs (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div></>}{activeModal==='write-off'&&<><div><label className="text-xs text-gray-400 mb-1 block">Type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Bad debt</option><option>Stock</option><option>Asset disposal</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Amount (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Justification</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></>}{activeModal==='audit'&&<><div><label className="text-xs text-gray-400 mb-1 block">Audit type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Statutory</option><option>Internal</option><option>VAT inspection</option><option>HMRC enquiry</option></select></div><div className="space-y-2">{['Bank statements','Signed accounts','VAT returns','Payroll records','Asset register','Board minutes','Key contracts'].map(i=><label key={i} className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" />{i}</label>)}</div></>}<button onClick={()=>{const m:Record<string,string>={'budget-request':'Budget request submitted','vat-return':'VAT return submitted','bank-recon':'Reconciliation completed','month-end':'Month end closed','aged-debtors':'Debtors action logged',forecast:'Forecast updated','write-off':'Write-off approved',audit:'Audit pack ready'};setActiveModal(null);showToast(m[activeModal]||'Done')}} className="w-full mt-2 bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm">{'\u2705'} Submit</button></div>)}
          </div>
        </div>
      )}
    </PageShell>
  )
}
