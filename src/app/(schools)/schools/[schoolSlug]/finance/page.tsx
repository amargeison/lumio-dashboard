'use client'
import React, { useState, useEffect } from 'react'
import { EmptyState } from '@/app/(schools)/components/EmptyState'
import { Sparkles, CheckCircle, PieChart, FileText, TrendingUp, Users } from 'lucide-react'
import { RaiseInvoiceModal, SubmitExpenseModal, BudgetReviewModal } from '@/components/modals/SchoolModals'

const HIGHLIGHTS = [
  '7 invoices awaiting approval — 2 are over 30 days old and require urgent action',
  'Pupil Premium spend at 68% — impact review due in May before year-end',
  'Trip income outstanding: £1,240 from Year 5 London Science Museum trip',
  'Budget on track — projected underspend of £18k by year end (July 2026)',
]

const ACTIONS_BASE = [
  { label: 'Approve Invoice', icon: <CheckCircle size={14} /> },
  { label: 'Budget Check', icon: <PieChart size={14} /> },
  { label: 'Raise PO', icon: <FileText size={14} /> },
  { label: 'Grant Update', icon: <TrendingUp size={14} /> },
  { label: 'Payroll Change', icon: <Users size={14} /> },
]

const STATS = [
  { label: 'Annual Budget', value: '£1.2M', sub: '2025/26' },
  { label: 'Spent to Date', value: '£847k', sub: '71% of budget', color: '#F59E0B' },
  { label: 'Invoices Pending', value: '7', sub: '2 over 30 days', color: '#EF4444' },
  { label: 'Pupil Premium', value: '£42,000', sub: '68% spent' },
]

const BUDGET = [
  { id: 1, label: 'Teaching Staff', budget: '£680,000', spent: '£498,000', pct: 73 },
  { id: 2, label: 'Support Staff', budget: '£210,000', spent: '£147,000', pct: 70 },
  { id: 3, label: 'Premises & Facilities', budget: '£85,000', spent: '£62,000', pct: 73 },
  { id: 4, label: 'Curriculum Resources', budget: '£42,000', spent: '£28,000', pct: 67 },
  { id: 5, label: 'IT & Technology', budget: '£35,000', spent: '£19,000', pct: 54 },
  { id: 6, label: 'Pupil Premium', budget: '£42,000', spent: '£28,500', pct: 68 },
  { id: 7, label: 'Sports Premium', budget: '£18,000', spent: '£14,200', pct: 79 },
  { id: 8, label: 'Other/Admin', budget: '£88,000', spent: '£50,300', pct: 57 },
]

const INVOICES = [
  { id: 1, ref: 'INV-2026-041', supplier: 'Bramble Supplies Ltd', amount: '£4,800', date: '15 Mar', age: 9, status: 'Awaiting approval', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 2, ref: 'INV-2026-038', supplier: 'Milton Keynes Council', amount: '£12,400', date: '28 Feb', age: 24, status: 'Awaiting approval', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 3, ref: 'INV-2026-035', supplier: 'Sparks Electrical', amount: '£890', date: '18 Feb', age: 34, status: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 4, ref: 'INV-2026-033', supplier: 'School Meals Co.', amount: '£6,200', date: '14 Feb', age: 38, status: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 5, ref: 'INV-2026-031', supplier: 'Grounds & Gardens', amount: '£1,150', date: '10 Feb', age: 42, status: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 6, ref: 'INV-2026-029', supplier: 'IT Support Services', amount: '£3,400', date: '5 Feb', age: 47, status: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 7, ref: 'INV-2026-028', supplier: 'Educational Publishers', amount: '£760', date: '2 Feb', age: 50, status: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
]

const GRANTS = [
  { id: 1, name: 'Pupil Premium', total: '£42,000', spent: '£28,500', pct: 68, note: 'Impact review due May 2026' },
  { id: 2, name: 'Sports Premium', total: '£18,000', spent: '£14,200', pct: 79, note: 'Annual report due Jul 2026' },
  { id: 3, name: 'UIFSM (KS1 meals)', total: '£9,800', spent: '£7,350', pct: 75, note: 'On track' },
  { id: 4, name: 'EYPP', total: '£3,200', spent: '£2,100', pct: 66, note: 'On track' },
]

const DEADLINES = [
  { id: 1, task: 'School resource management self-assessment', date: '31 Mar 2026', status: 'Due soon', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 2, task: 'Pupil Premium impact review', date: '31 May 2026', status: 'Upcoming', color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  { id: 3, task: 'Year-end accounts closure', date: '31 Jul 2026', status: 'Upcoming', color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  { id: 4, task: 'Budget setting 2026/27', date: '30 Apr 2026', status: 'Not started', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
]

function StatCard({ label, value, sub, color = '#0D9488' }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>
    </div>
  )
}

function AIHighlights({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.4)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
        <Sparkles size={14} style={{ color: '#0D9488' }} />
        <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
        <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Updated just now</span>
      </div>
      <div className="flex flex-col gap-3 p-4" style={{ backgroundColor: '#07080F' }}>
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{i + 1}</span>
            <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActions({ actions }: { actions: { label: string; icon: React.ReactNode; onClick?: () => void }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.label} onClick={a.onClick} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0F766E')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0D9488')}>
          {a.icon}{a.label}
        </button>
      ))}
    </div>
  )
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>{label}</span>
  )
}

function budgetBarColor(pct: number) {
  if (pct >= 85) return '#EF4444'
  if (pct >= 70) return '#F59E0B'
  return '#0D9488'
}

export default function FinancePage() {
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [showBudget, setShowBudget] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/schools\/([^/]+)/)
    const slug = slugMatch?.[1] ?? 'school'
    setHasData(
      localStorage.getItem(`lumio_${slug}_finance_hasData`) === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  if (hasData === null) return null
  if (!hasData) return (
    <EmptyState
      pageName="finance"
      title="No financial data yet"
      description="Upload your budget data, payment records and expenditure to activate Finance."
      uploads={[
        { key: 'budget', label: 'Upload Budget Data (CSV/XLSX)', accept: '.csv,.xlsx' },
        { key: 'payments', label: 'Upload Payment Records (CSV)' },
        { key: 'mis', label: 'Connect ParentPay / SchoolMoney' },
      ]}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Finance</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Budget overview, invoice approval, grants and financial deadlines</p>
      </div>

      {/* AI Highlights */}
      <AIHighlights items={HIGHLIGHTS} />

      {/* Quick actions */}
      <QuickActions actions={ACTIONS_BASE.map(a => ({
        ...a,
        onClick: a.label === 'Approve Invoice' ? () => setShowInvoice(true)
          : a.label === 'Raise PO' ? () => setShowExpense(true)
          : a.label === 'Budget Check' ? () => setShowBudget(true)
          : () => showToast('Feature coming soon'),
      }))} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Budget by cost centre */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Budget by Cost Centre</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Full budget →</span>
        </div>
        <div className="flex flex-col gap-4 p-5">
          {BUDGET.map(row => (
            <div key={row.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium w-44" style={{ color: '#F9FAFB' }}>{row.label}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.spent} of {row.budget}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: budgetBarColor(row.pct) }}>{row.pct}%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                <div style={{ width: `${row.pct}%`, backgroundColor: budgetBarColor(row.pct) }} className="h-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice approval queue */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Invoice Approval Queue</p>
            <Badge label="5 overdue" color="#EF4444" bg="rgba(239,68,68,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Approve all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-6 gap-3 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Reference</p>
            <p className="text-xs font-medium col-span-2" style={{ color: '#6B7280' }}>Supplier</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Amount</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Age</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {INVOICES.map(row => (
            <div key={row.id} className="grid grid-cols-6 gap-3 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#2DD4BF' }}>{row.ref}</p>
              <p className="text-sm col-span-2" style={{ color: '#F9FAFB' }}>{row.supplier}</p>
              <p className="text-sm font-semibold" style={{ color: '#D1D5DB' }}>{row.amount}</p>
              <p className="text-sm" style={{ color: row.age >= 30 ? '#EF4444' : '#F59E0B' }}>{row.age} days</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Grant tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Grant Tracker</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View reports →</span>
        </div>
        <div className="flex flex-col gap-5 p-5">
          {GRANTS.map(row => (
            <div key={row.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.spent} of {row.total}</p>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{row.note}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: budgetBarColor(row.pct) }}>{row.pct}%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                <div style={{ width: `${row.pct}%`, backgroundColor: '#0D9488' }} className="h-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial deadlines */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Financial Deadlines</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View calendar →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-3 gap-4 px-5 py-2">
            <p className="text-xs font-medium col-span-2" style={{ color: '#6B7280' }}>Task</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Deadline</p>
          </div>
          {DEADLINES.map(row => (
            <div key={row.id} className="grid grid-cols-3 gap-4 px-5 py-3 items-center">
              <div className="col-span-2 flex items-center gap-3">
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.task}</p>
                <Badge label={row.status} color={row.color} bg={row.bg} />
              </div>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{row.date}</p>
            </div>
          ))}
        </div>
      </div>

      {showInvoice && <RaiseInvoiceModal onClose={() => setShowInvoice(false)} onToast={showToast} />}
      {showExpense && <SubmitExpenseModal onClose={() => setShowExpense(false)} onToast={showToast} />}
      {showBudget && <BudgetReviewModal onClose={() => setShowBudget(false)} onToast={showToast} />}
      {toast && <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, backgroundColor: '#0D9488', color: '#F9FAFB', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{toast}</div>}
    </div>
  )
}
