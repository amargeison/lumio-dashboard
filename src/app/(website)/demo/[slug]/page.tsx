'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { use } from 'react'
import {
  Users, TrendingUp, Headphones, GitBranch, AlertCircle,
  CheckCircle2, Loader2, Circle, Clock, ArrowRight,
  Zap, Package, BarChart3, Star, ChevronDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'ceo' | 'sales' | 'ops' | 'hr'
type RAG  = 'green' | 'amber' | 'red'
type WFStatus = 'COMPLETE' | 'RUNNING' | 'ACTION'

// ─── Fake data seeder ─────────────────────────────────────────────────────────
// Deterministic: same company name always produces the same fake data

function seed(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i)
  return Math.abs(h)
}

function pickN<T>(arr: T[], n: number, salt: string): T[] {
  const out: T[] = []
  let s = seed(salt)
  const pool = [...arr]
  for (let i = 0; i < Math.min(n, pool.length); i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const idx = Math.abs(s) % pool.length
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

function fakeNum(base: number, co: string, salt: string): number {
  const s = seed(co + salt)
  return base + (s % 20) - 10
}

const FIRST_NAMES = ['Sophie', 'James', 'Priya', 'Tom', 'Amara', 'Oliver', 'Fatima', 'Liam', 'Rachel', 'Marcus', 'Nadia', 'Chris']
const LAST_NAMES  = ['Williams', 'Okafor', 'Kapoor', 'Ashworth', 'Diallo', 'Chen', 'Al-Hassan', 'Brennan', 'Singh', 'Reid', 'Petrov', 'Lee']
const COMPANIES   = ['Greenfield Academy', 'Hopscotch Learning', 'Bramble Hill Trust', 'Whitestone College', 'Oakridge Schools Ltd', 'Crestview Academy', 'Pinebrook Primary', 'Sunfield Trust', 'Nova Group', 'Apex Consulting', 'Meridian Ltd']

function fakeName(co: string, i: number): string {
  const fn = FIRST_NAMES[seed(co + 'fn' + i) % FIRST_NAMES.length]
  const ln = LAST_NAMES[seed(co + 'ln' + i) % LAST_NAMES.length]
  return `${fn} ${ln}`
}
function fakeCompany(co: string, i: number): string {
  return COMPANIES[seed(co + 'c' + i) % COMPANIES.length]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WFStatus }) {
  const cfg = {
    COMPLETE: { label: 'COMPLETE', color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  Icon: CheckCircle2 },
    RUNNING:  { label: 'RUNNING',  color: '#0D9488', bg: 'rgba(13,148,136,0.12)', Icon: Loader2      },
    ACTION:   { label: 'ACTION',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  Icon: AlertCircle  },
  }[status]
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <cfg.Icon size={11} strokeWidth={2} />
      {cfg.label}
    </span>
  )
}

function RAGDot({ status }: { status: RAG }) {
  const color = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }[status]
  return <Circle size={10} fill={color} strokeWidth={0} style={{ color }} />
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#9CA3AF' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{value}</div>
    </div>
  )
}

// ─── Role content ─────────────────────────────────────────────────────────────

function CEOView({ company }: { company: string }) {
  const workflows = fakeNum(47, company, 'wf')
  const customers = fakeNum(181, company, 'cu')
  const mrr       = fakeNum(42000, company, 'mrr')
  const churn     = Math.round(fakeNum(4, company, 'ch') / 10 * 10) / 10
  const wfRuns    = fakeNum(1840, company, 'runs')

  const wfStatuses: WFStatus[] = ['COMPLETE', 'RUNNING', 'ACTION', 'COMPLETE', 'COMPLETE', 'ACTION', 'RUNNING', 'COMPLETE']
  const feed = Array.from({ length: 8 }, (_, i) => ({
    name: ['New joiner — IT provisioning', 'Invoice chase — 30d overdue', 'Proposal generated', 'Health score alert', 'Trial conversion', 'Support SLA breach — P1', 'Renewal reminder', 'Marketing drip sent'][i],
    customer: i < 4 ? 'Internal' : fakeCompany(company, i),
    status: wfStatuses[i],
    ts: ['Just now', '3 min ago', '8 min ago', '15 min ago', '24 min ago', '1 hr ago', '2 hr ago', '3 hr ago'][i],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Workflows" value={String(workflows)} icon={GitBranch} color="#0D9488" />
        <StatCard label="Total Customers" value={String(customers)} icon={Users} color="#6C3FC5" />
        <StatCard label="Monthly MRR" value={`£${mrr.toLocaleString()}`} icon={TrendingUp} color="#22C55E" />
        <StatCard label="Workflow Runs (30d)" value={String(wfRuns)} icon={Zap} color="#F59E0B" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Workflow Activity</p>
            <span className="text-xs" style={{ color: '#0D9488' }}>Live</span>
          </div>
          {feed.map((run, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3"
              style={{ borderBottom: i < feed.length - 1 ? '1px solid #1F2937' : undefined }}>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: '#F9FAFB' }}>{run.name}</p>
                <p className="truncate text-xs" style={{ color: '#9CA3AF' }}>{run.customer}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={run.status} />
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{run.ts}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Customer Health</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{customers} accounts</p>
          </div>
          <div className="p-5 space-y-4">
            {([
              { status: 'green' as RAG, count: Math.round(customers * 0.77), label: 'Healthy' },
              { status: 'amber' as RAG, count: Math.round(customers * 0.17), label: 'At Risk' },
              { status: 'red'   as RAG, count: Math.round(customers * 0.06), label: 'Critical' },
            ]).map(r => {
              const pct = Math.round((r.count / customers) * 100)
              const col = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }[r.status]
              return (
                <div key={r.status} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RAGDot status={r.status} />
                      <span className="text-sm" style={{ color: '#F9FAFB' }}>{r.label}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{r.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: col }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SalesView({ company }: { company: string }) {
  const leads   = fakeNum(34, company, 'leads')
  const pipeline = fakeNum(128000, company, 'pipe')
  const winRate = fakeNum(28, company, 'wr')
  const deals   = Array.from({ length: 6 }, (_, i) => ({
    name: fakeCompany(company, i + 10),
    value: `£${(fakeNum(12000, company, 'd' + i) * (i + 1) / 2).toLocaleString()}`,
    stage: ['Discovery', 'Proposal', 'Negotiation', 'Verbal Yes', 'Discovery', 'Closed Won'][i],
    score: [72, 88, 91, 94, 45, 100][i],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Active Leads" value={String(leads)} icon={Users} color="#6C3FC5" />
        <StatCard label="Pipeline Value" value={`£${pipeline.toLocaleString()}`} icon={TrendingUp} color="#0D9488" />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Star} color="#F59E0B" />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Active Pipeline</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Company', 'Value', 'Stage', 'AI Score'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deals.map((d, i) => (
              <tr key={i} style={{ borderBottom: i < deals.length - 1 ? '1px solid #111318' : undefined }}>
                <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{d.name}</td>
                <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{d.value}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: d.stage === 'Closed Won' ? 'rgba(34,197,94,0.12)' : 'rgba(13,148,136,0.1)',
                      color: d.stage === 'Closed Won' ? '#22C55E' : '#0D9488',
                    }}>
                    {d.stage}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${d.score}%`, backgroundColor: d.score >= 80 ? '#22C55E' : d.score >= 60 ? '#F59E0B' : '#EF4444' }} />
                    </div>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{d.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OpsView({ company }: { company: string }) {
  const orders   = fakeNum(14, company, 'po')
  const lowStock = fakeNum(6, company, 'ls')
  const invoices = fakeNum(28400, company, 'inv')

  const poList = Array.from({ length: 5 }, (_, i) => ({
    po: `PO-2026-${88 - i}`,
    supplier: ['Acme Office Supplies', 'TechPro Direct', 'PrintWave Ltd', 'CloudLicence Group', 'Ergonomics Now'][i],
    value: `£${fakeNum(3000, company, 'pov' + i).toLocaleString()}`,
    status: ['In Transit', 'Delivered', 'Pending', 'Delivered', 'Overdue'][i],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Open Purchase Orders" value={String(orders)} icon={Package} color="#F59E0B" />
        <StatCard label="Low Stock Items" value={String(lowStock)} icon={AlertCircle} color="#EF4444" />
        <StatCard label="Supplier Invoices Due" value={`£${invoices.toLocaleString()}`} icon={BarChart3} color="#6C3FC5" />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Purchase Orders</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['PO #', 'Supplier', 'Value', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {poList.map((po, i) => (
              <tr key={i} style={{ borderBottom: i < poList.length - 1 ? '1px solid #111318' : undefined }}>
                <td className="px-5 py-3 font-mono text-xs" style={{ color: '#9CA3AF' }}>{po.po}</td>
                <td className="px-5 py-3" style={{ color: '#F9FAFB' }}>{po.supplier}</td>
                <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{po.value}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{
                    backgroundColor: po.status === 'Delivered' ? 'rgba(34,197,94,0.1)' : po.status === 'Overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: po.status === 'Delivered' ? '#22C55E' : po.status === 'Overdue' ? '#EF4444' : '#F59E0B',
                  }}>
                    {po.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HRView({ company }: { company: string }) {
  const employees  = fakeNum(187, company, 'emp')
  const onboarding = fakeNum(8, company, 'ob')
  const leave      = fakeNum(14, company, 'lv')

  const starters = Array.from({ length: 5 }, (_, i) => ({
    name: fakeName(company, i),
    role: ['Customer Success Manager', 'Sales Development Rep', 'Frontend Developer', 'Marketing Executive', 'Support Specialist'][i],
    progress: [75, 90, 30, 25, 100][i],
    status: [i === 4 ? 'Complete' : 'Onboarding'][0],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Employees" value={String(employees)} icon={Users} color="#0D9488" />
        <StatCard label="Active Onboardings" value={String(onboarding)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Leave Requests" value={String(leave)} icon={Clock} color="#F59E0B" />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>New Starter Tracker</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Name', 'Role', 'Progress', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {starters.map((s, i) => (
              <tr key={i} style={{ borderBottom: i < starters.length - 1 ? '1px solid #111318' : undefined }}>
                <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{s.name}</td>
                <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{s.role}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${s.progress}%`, backgroundColor: s.progress === 100 ? '#22C55E' : s.progress > 50 ? '#0D9488' : '#F59E0B' }} />
                    </div>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{s.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{
                    backgroundColor: s.progress === 100 ? 'rgba(34,197,94,0.1)' : 'rgba(13,148,136,0.1)',
                    color: s.progress === 100 ? '#22C55E' : '#0D9488',
                  }}>
                    {s.progress === 100 ? 'Complete' : 'Onboarding'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [role, setRole]               = useState<Role>('ceo')
  const [company, setCompany]         = useState('Your Company')
  const [daysLeft, setDaysLeft]       = useState(14)
  const [showUpgrade, setShowUpgrade] = useState(true)

  useEffect(() => {
    const name = localStorage.getItem('demo_company_name') || 'Your Company'
    const created = localStorage.getItem('demo_created_at')
    setCompany(name)
    if (created) {
      const msElapsed = Date.now() - parseInt(created)
      const daysElapsed = Math.floor(msElapsed / 86400000)
      setDaysLeft(Math.max(0, 14 - daysElapsed))
    }
  }, [])

  const roleConfig: { id: Role; label: string }[] = [
    { id: 'ceo',   label: 'CEO / Founder' },
    { id: 'sales', label: 'Sales Lead'    },
    { id: 'ops',   label: 'Operations'   },
    { id: 'hr',    label: 'HR'           },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>

      {/* Demo banner */}
      {showUpgrade && (
        <div className="px-4 py-2.5 flex items-center justify-between text-sm"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span className="font-medium">Trial workspace — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
            <span className="hidden sm:inline opacity-75">· All data is demo only · Auto-deleted after 14 days</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing"
              className="font-semibold text-xs px-3 py-1 rounded-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              Upgrade now <ArrowRight size={11} className="inline" />
            </Link>
            <button onClick={() => setShowUpgrade(false)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header style={{ backgroundColor: '#07080F', borderBottom: '1px solid #1F2937' }}>
        {/* Main row */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Company identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>
              {company[0]?.toUpperCase() || 'L'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{company}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>Demo workspace</div>
            </div>
          </div>

          {/* Role switcher — desktop only (md+) */}
          <div className="hidden md:flex items-center gap-1 rounded-lg p-1 shrink-0"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            {roleConfig.map(r => (
              <button key={r.id} onClick={() => setRole(r.id)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: role === r.id ? '#0D9488' : 'transparent',
                  color: role === r.id ? '#F9FAFB' : '#9CA3AF',
                }}>
                {r.label}
              </button>
            ))}
          </div>

          <Link href="/pricing"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold sm:text-sm sm:px-4"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
            <Zap size={12} /> <span className="hidden xs:inline">Upgrade</span><span className="hidden sm:inline"> to Lumio</span>
          </Link>
        </div>

        {/* Role switcher — mobile (below md) */}
        <div className="md:hidden px-4 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {roleConfig.map(r => (
            <button key={r.id} onClick={() => setRole(r.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={{
                backgroundColor: role === r.id ? '#0D9488' : '#111318',
                color: role === r.id ? '#F9FAFB' : '#9CA3AF',
                border: `1px solid ${role === r.id ? '#0D9488' : '#1F2937'}`,
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-5 max-w-7xl mx-auto space-y-2">
        {/* Role label */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">{roleConfig.find(r => r.id === role)?.label} Dashboard</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Showing demo data for <span style={{ color: '#F9FAFB' }}>{company}</span>
            </p>
          </div>
        </div>

        {role === 'ceo'   && <CEOView   company={company} />}
        {role === 'sales' && <SalesView company={company} />}
        {role === 'ops'   && <OpsView   company={company} />}
        {role === 'hr'    && <HRView    company={company} />}
      </main>

      {/* Upgrade CTA */}
      <div className="mx-5 my-8 rounded-2xl p-8 text-center"
        style={{ backgroundColor: '#111318', border: '1px solid rgba(108,63,197,0.35)' }}>
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4"
          style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.25)' }}>
          <Zap size={12} /> Ready to go live?
        </div>
        <h2 className="text-2xl font-bold mb-2">This is your real dashboard. Without the demo data.</h2>
        <p className="text-sm mb-6 mx-auto max-w-md" style={{ color: '#9CA3AF' }}>
          Connect your real tools, activate your workflows, and your team starts saving hours from day one.
          Everything you&apos;ve seen — but with your actual customers, your actual data.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
            See pricing <ArrowRight size={15} />
          </Link>
          <Link href="/demo"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: 'transparent', border: '1px solid #1F2937', color: '#9CA3AF' }}>
            Book a walkthrough
          </Link>
        </div>
      </div>
    </div>
  )
}
