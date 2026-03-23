'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { use } from 'react'
import {
  Users, TrendingUp, Headphones, GitBranch, AlertCircle,
  CheckCircle2, Loader2, Circle, Clock, ArrowRight,
  Zap, Package, BarChart3, Star, ChevronDown,
  UserPlus, X, Plus, Send, Play, Check,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Overview', 'HR & People', 'Accounts', 'Sales & CRM',
  'Marketing', 'Trials', 'Operations', 'Support',
  'Success', 'IT & Systems',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'ceo' | 'sales' | 'ops' | 'hr'
type RAG  = 'green' | 'amber' | 'red'
type WFStatus = 'COMPLETE' | 'RUNNING' | 'ACTION'

// ─── Fake data seeder ─────────────────────────────────────────────────────────

function seed(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i)
  return Math.abs(h)
}

function fakeNum(base: number, co: string, salt: string): number {
  const s = seed(co + salt)
  return base + (s % 20) - 10
}

const FIRST_NAMES = ['Sophie', 'James', 'Priya', 'Tom', 'Amara', 'Oliver', 'Fatima', 'Liam', 'Rachel', 'Marcus', 'Nadia', 'Chris']
const LAST_NAMES  = ['Williams', 'Okafor', 'Kapoor', 'Ashworth', 'Diallo', 'Chen', 'Al-Hassan', 'Brennan', 'Singh', 'Reid', 'Petrov', 'Lee']
const COMPANIES   = ['Greenfield Academy', 'Hopscotch Learning', 'Bramble Hill Trust', 'Whitestone College', 'Oakridge Schools Ltd', 'Crestview Academy', 'Pinebrook Primary', 'Sunfield Trust', 'Nova Group', 'Apex Consulting', 'Meridian Ltd']

function fakeName(co: string, i: number): string {
  return `${FIRST_NAMES[seed(co + 'fn' + i) % FIRST_NAMES.length]} ${LAST_NAMES[seed(co + 'ln' + i) % LAST_NAMES.length]}`
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
    <div className="rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3"
      style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
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

// ─── Invite Modal ─────────────────────────────────────────────────────────────

interface InviteeRow { name: string; email: string; jobTitle: string; departments: string[] }

function InviteModal({ slug, company, userName, onClose }: {
  slug: string; company: string; userName: string; onClose: () => void
}) {
  const blank = (): InviteeRow => ({ name: '', email: '', jobTitle: '', departments: [] })
  const [rows, setRows]           = useState<InviteeRow[]>([blank()])
  const [openDeptIdx, setOpenDeptIdx] = useState<number | null>(null)
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState('')
  const dropdownRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDeptIdx(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function updateRow(i: number, field: keyof InviteeRow, val: string | string[]) {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  function toggleDept(rowIdx: number, dept: string) {
    const cur = rows[rowIdx].departments
    updateRow(rowIdx, 'departments', cur.includes(dept) ? cur.filter(d => d !== dept) : [...cur, dept])
  }

  async function handleSend() {
    const valid = rows.filter(r => r.name.trim() && r.email.trim())
    if (!valid.length) { setError('Add at least one name and email.'); return }
    setSending(true); setError('')
    const res = await fetch('/api/demo/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, invitees: valid, inviterName: userName || 'A teammate', companyName: company }),
    })
    setSending(false)
    if (res.ok) { setSent(true) } else { setError('Failed to send. Please try again.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Invite your team to this demo</h2>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Let them explore Lumio for themselves</p>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)' }}>
              <Check size={28} style={{ color: '#0D9488' }} />
            </div>
            <h3 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Invites sent!</h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Your team will receive a magic link to join this workspace.
            </p>
            <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Done</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={dropdownRef}>
              {rows.map((row, i) => (
                <div key={i} className="rounded-xl p-4 space-y-3"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>INVITEE {i + 1}</span>
                    {rows.length > 1 && (
                      <button onClick={() => setRows(r => r.filter((_, idx) => idx !== i))}
                        className="text-xs transition-colors" style={{ color: '#6B7280' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { field: 'name'     as const, placeholder: 'Full name',  type: 'text'  },
                      { field: 'email'    as const, placeholder: 'Work email', type: 'email' },
                      { field: 'jobTitle' as const, placeholder: 'Job title',  type: 'text'  },
                    ]).map(f => (
                      <input key={f.field} type={f.type} placeholder={f.placeholder}
                        value={row[f.field]}
                        onChange={e => updateRow(i, f.field, e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')}
                      />
                    ))}
                  </div>

                  {/* Department multi-select */}
                  <div className="relative">
                    <button onClick={() => setOpenDeptIdx(openDeptIdx === i ? null : i)}
                      className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-full text-left"
                      style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}>
                      <span className="flex-1 truncate">
                        {row.departments.length ? row.departments.join(', ') : 'Select departments (optional)'}
                      </span>
                      <ChevronDown size={12} className="shrink-0" />
                    </button>
                    {openDeptIdx === i && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-10 p-3"
                        style={{ backgroundColor: '#1A1D27', border: '1px solid #1F2937', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        <div className="flex flex-wrap gap-1.5">
                          {DEPARTMENTS.map(dept => {
                            const active = row.departments.includes(dept)
                            return (
                              <button key={dept} onClick={() => toggleDept(i, dept)}
                                className="text-xs px-2.5 py-1 rounded-lg transition-all"
                                style={{
                                  backgroundColor: active ? 'rgba(13,148,136,0.2)' : '#07080F',
                                  color: active ? '#0D9488' : '#6B7280',
                                  border: `1px solid ${active ? '#0D9488' : '#1F2937'}`,
                                }}>
                                {dept}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button onClick={() => setRows(r => [...r, blank()])}
                className="flex items-center gap-2 text-sm font-medium transition-opacity"
                style={{ color: '#0D9488' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                <Plus size={15} /> Add another person
              </button>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>

            <div className="p-6 shrink-0 flex justify-end gap-3" style={{ borderTop: '1px solid #1F2937' }}>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm"
                style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
              <button onClick={handleSend} disabled={sending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: sending ? 0.6 : 1 }}>
                <Send size={14} /> {sending ? 'Sending…' : 'Send invites'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Onboarding Modal ─────────────────────────────────────────────────────────

function OnboardingModal({ onComplete }: { onComplete: (depts: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(dept: string) {
    setSelected(s => s.includes(dept) ? s.filter(d => d !== dept) : [...s, dept])
  }

  function finish() {
    localStorage.setItem('demo_onboarded', 'true')
    localStorage.setItem('demo_focus_depts', JSON.stringify(selected))
    onComplete(selected)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}>
      <div className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxHeight: '92vh' }}>

        {/* Left — video */}
        <div className="md:w-1/2 flex flex-col p-8 gap-6"
          style={{ backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}>
          <div>
            <div className="text-xs font-semibold mb-3 tracking-widest" style={{ color: '#0D9488' }}>LUMIO DEMO</div>
            <h2 className="text-2xl font-black leading-tight" style={{ color: '#F9FAFB' }}>See Lumio<br />in 60 seconds</h2>
            <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>Watch how your team would use this every day.</p>
          </div>

          {/* Video placeholder */}
          <div className="flex-1 rounded-xl flex items-center justify-center relative"
            style={{ backgroundColor: '#0D0E14', border: '1px solid #1F2937', minHeight: 200 }}>
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', border: '2px solid rgba(108,63,197,0.4)' }}>
                <Play size={26} style={{ color: '#A78BFA' }} fill="#A78BFA" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Video coming soon</p>
                <p className="text-xs mt-1" style={{ color: '#4B5563' }}>
                  Dive straight in — everything is live and clickable.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs" style={{ color: '#4B5563' }}>
            All data is fictional · Auto-deleted after 14 days · No credit card required
          </p>
        </div>

        {/* Right — department selection */}
        <div className="md:w-1/2 flex flex-col p-8 overflow-y-auto">
          <div className="flex justify-end mb-4">
            <button onClick={finish} className="text-xs transition-colors" style={{ color: '#4B5563' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>
              Skip for now →
            </button>
          </div>

          <h3 className="text-xl font-bold mb-1" style={{ color: '#F9FAFB' }}>Choose your focus areas</h3>
          <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>
            We&apos;ll highlight the most relevant parts for you. Leave blank to explore everything.
          </p>

          <div className="flex flex-col gap-2">
            {DEPARTMENTS.map(dept => {
              const active = selected.includes(dept)
              return (
                <button key={dept} onClick={() => toggle(dept)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(13,148,136,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'rgba(13,148,136,0.5)' : '#1F2937'}`,
                  }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: active ? '#0D9488' : 'transparent',
                      border: `1.5px solid ${active ? '#0D9488' : '#374151'}`,
                    }}>
                    {active && <Check size={10} color="#fff" />}
                  </div>
                  <span className="text-sm font-medium" style={{ color: active ? '#F9FAFB' : '#9CA3AF' }}>
                    {dept}
                  </span>
                </button>
              )
            })}
          </div>

          <button onClick={finish}
            className="mt-6 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Start exploring <ArrowRight size={15} />
          </button>
          <p className="text-xs text-center mt-3" style={{ color: '#4B5563' }}>
            {selected.length === 0
              ? 'All departments shown at full brightness'
              : `${selected.length} department${selected.length !== 1 ? 's' : ''} selected`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Role views ───────────────────────────────────────────────────────────────

function CEOView({ company }: { company: string }) {
  const workflows = fakeNum(47, company, 'wf')
  const customers = fakeNum(181, company, 'cu')
  const mrr       = fakeNum(42000, company, 'mrr')
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
        <StatCard label="Total Customers"  value={String(customers)} icon={Users}     color="#6C3FC5" />
        <StatCard label="Monthly MRR"      value={`£${mrr.toLocaleString()}`} icon={TrendingUp} color="#22C55E" />
        <StatCard label="Workflow Runs (30d)" value={String(wfRuns)} icon={Zap}       color="#F59E0B" />
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
              { status: 'green' as RAG, count: Math.round(customers * 0.77), label: 'Healthy'  },
              { status: 'amber' as RAG, count: Math.round(customers * 0.17), label: 'At Risk'  },
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
  const leads    = fakeNum(34, company, 'leads')
  const pipeline = fakeNum(128000, company, 'pipe')
  const winRate  = fakeNum(28, company, 'wr')
  const deals    = Array.from({ length: 6 }, (_, i) => ({
    name:  fakeCompany(company, i + 10),
    value: `£${(fakeNum(12000, company, 'd' + i) * (i + 1) / 2).toLocaleString()}`,
    stage: ['Discovery', 'Proposal', 'Negotiation', 'Verbal Yes', 'Discovery', 'Closed Won'][i],
    score: [72, 88, 91, 94, 45, 100][i],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Active Leads"    value={String(leads)}              icon={Users}      color="#6C3FC5" />
        <StatCard label="Pipeline Value"  value={`£${pipeline.toLocaleString()}`} icon={TrendingUp} color="#0D9488" />
        <StatCard label="Win Rate"        value={`${winRate}%`}              icon={Star}       color="#F59E0B" />
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
                  <span className="text-xs px-2 py-0.5 rounded" style={{
                    backgroundColor: d.stage === 'Closed Won' ? 'rgba(34,197,94,0.12)' : 'rgba(13,148,136,0.1)',
                    color: d.stage === 'Closed Won' ? '#22C55E' : '#0D9488',
                  }}>{d.stage}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${d.score}%`,
                        backgroundColor: d.score >= 80 ? '#22C55E' : d.score >= 60 ? '#F59E0B' : '#EF4444',
                      }} />
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
  const poList   = Array.from({ length: 5 }, (_, i) => ({
    po:       `PO-2026-${88 - i}`,
    supplier: ['Acme Office Supplies', 'TechPro Direct', 'PrintWave Ltd', 'CloudLicence Group', 'Ergonomics Now'][i],
    value:    `£${fakeNum(3000, company, 'pov' + i).toLocaleString()}`,
    status:   ['In Transit', 'Delivered', 'Pending', 'Delivered', 'Overdue'][i],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Open Purchase Orders"   value={String(orders)}               icon={Package}   color="#F59E0B" />
        <StatCard label="Low Stock Items"         value={String(lowStock)}             icon={AlertCircle} color="#EF4444" />
        <StatCard label="Supplier Invoices Due"   value={`£${invoices.toLocaleString()}`} icon={BarChart3} color="#6C3FC5" />
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
                    color:           po.status === 'Delivered' ? '#22C55E'             : po.status === 'Overdue' ? '#EF4444'             : '#F59E0B',
                  }}>{po.status}</span>
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
  const starters   = Array.from({ length: 5 }, (_, i) => ({
    name:     fakeName(company, i),
    role:     ['Customer Success Manager', 'Sales Development Rep', 'Frontend Developer', 'Marketing Executive', 'Support Specialist'][i],
    progress: [75, 90, 30, 25, 100][i],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Employees"    value={String(employees)}  icon={Users}        color="#0D9488" />
        <StatCard label="Active Onboardings" value={String(onboarding)} icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Leave Requests"     value={String(leave)}      icon={Clock}        color="#F59E0B" />
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
                      <div className="h-full rounded-full" style={{
                        width: `${s.progress}%`,
                        backgroundColor: s.progress === 100 ? '#22C55E' : s.progress > 50 ? '#0D9488' : '#F59E0B',
                      }} />
                    </div>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{s.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{
                    backgroundColor: s.progress === 100 ? 'rgba(34,197,94,0.1)' : 'rgba(13,148,136,0.1)',
                    color:           s.progress === 100 ? '#22C55E'             : '#0D9488',
                  }}>{s.progress === 100 ? 'Complete' : 'Onboarding'}</span>
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
  const [userName, setUserName]       = useState('')
  const [daysLeft, setDaysLeft]       = useState(14)
  const [showUpgrade, setShowUpgrade] = useState(true)
  const [showInvite, setShowInvite]   = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [focusDepts, setFocusDepts]   = useState<string[]>([]) // eslint-disable-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    const name      = localStorage.getItem('demo_company_name') || 'Your Company'
    const user      = localStorage.getItem('demo_user_name') || ''
    const created   = localStorage.getItem('demo_created_at')
    const onboarded = localStorage.getItem('demo_onboarded')
    const savedDepts = localStorage.getItem('demo_focus_depts')

    setCompany(name)
    setUserName(user)
    if (savedDepts) { try { setFocusDepts(JSON.parse(savedDepts)) } catch { /* ignore */ } }
    if (created) {
      const daysElapsed = Math.floor((Date.now() - parseInt(created)) / 86400000)
      setDaysLeft(Math.max(0, 14 - daysElapsed))
    }
    if (!onboarded) setShowOnboarding(true)
  }, [])

  const roleConfig: { id: Role; label: string }[] = [
    { id: 'ceo',   label: 'CEO / Founder' },
    { id: 'sales', label: 'Sales Lead'    },
    { id: 'ops',   label: 'Operations'   },
    { id: 'hr',    label: 'HR'           },
  ]

  function handleOnboardingComplete(depts: string[]) {
    setFocusDepts(depts)
    setShowOnboarding(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>

      {/* Modals */}
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      {showInvite && (
        <InviteModal slug={slug} company={company} userName={userName} onClose={() => setShowInvite(false)} />
      )}

      {/* Trial banner */}
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

          {/* Role switcher — desktop */}
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowInvite(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1F2937' }}>
              <UserPlus size={13} /> Invite team
            </button>
            <Link href="/pricing"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold sm:text-sm sm:px-4"
              style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
              <Zap size={12} />
              <span className="hidden sm:inline">Upgrade to Lumio</span>
              <span className="sm:hidden">Upgrade</span>
            </Link>
          </div>
        </div>

        {/* Role switcher — mobile */}
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
          <button onClick={() => setShowInvite(true)}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
            style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
            <UserPlus size={11} /> Invite
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-5 max-w-7xl mx-auto">
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
