'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { use } from 'react'
import {
  Users, TrendingUp, Headphones, GitBranch, AlertCircle,
  CheckCircle2, Loader2, Circle, Clock, ArrowRight,
  Zap, Package, Star, ChevronDown, BarChart3,
  UserPlus, X, Plus, Send, Play, Check,
  Home, Receipt, Megaphone, FlaskConical, Award, Monitor,
  Settings, Hash, BarChart2, PieChart, Menu, ChevronLeft,
  Calendar, FileText, Target, DollarSign,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type WFStatus = 'COMPLETE' | 'RUNNING' | 'ACTION'
type RAG      = 'green' | 'amber' | 'red'
type ChartMode = 'number' | 'bar' | 'pie'
type DeptId   = 'overview' | 'insights' | 'hr' | 'accounts' | 'sales' | 'marketing' | 'trials' | 'operations' | 'support' | 'success' | 'it' | 'workflows' | 'settings'

interface ChartDatum { label: string; value: number; color: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Overview', 'HR & People', 'Accounts', 'Sales & CRM',
  'Marketing', 'Trials', 'Operations', 'Support',
  'Success', 'IT & Systems',
]

const SIDEBAR_ITEMS: { id: DeptId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',    label: 'Overview',          icon: Home        },
  { id: 'insights',   label: 'Insights',           icon: BarChart3   },
  { id: 'hr',         label: 'HR & People',        icon: Users       },
  { id: 'accounts',   label: 'Accounts',           icon: Receipt     },
  { id: 'sales',      label: 'Sales & CRM',        icon: TrendingUp  },
  { id: 'marketing',  label: 'Marketing',          icon: Megaphone   },
  { id: 'trials',     label: 'Trials',             icon: FlaskConical},
  { id: 'operations', label: 'Operations',         icon: Package     },
  { id: 'support',    label: 'Support',            icon: Headphones  },
  { id: 'success',    label: 'Success',            icon: Award       },
  { id: 'it',         label: 'IT & Systems',       icon: Monitor     },
  { id: 'workflows',  label: 'Workflows Library',  icon: GitBranch   },
  { id: 'settings',   label: 'Settings',           icon: Settings    },
]

const DEPT_ACTIONS: Record<DeptId, { label: string; tooltip: string; icon: React.ElementType }[]> = {
  overview:   [
    { label: 'New Joiner',    tooltip: 'Trigger the HR onboarding workflow for a new team member',          icon: UserPlus  },
    { label: 'New Customer',  tooltip: 'Create a customer record and start the welcome sequence',           icon: Users     },
    { label: 'Chase Invoice', tooltip: 'Send a payment reminder for all overdue invoices',                  icon: Receipt   },
    { label: 'New Trial',     tooltip: 'Provision a new 14-day demo workspace',                            icon: FlaskConical },
    { label: 'Raise Ticket',  tooltip: 'Open a new support ticket and assign it to the queue',             icon: Headphones},
  ],
  insights:   [
    { label: 'Export Report',    tooltip: 'Download the current view as a PDF or CSV',                     icon: FileText  },
    { label: 'Schedule Report',  tooltip: 'Set up a recurring email report to stakeholders',               icon: Calendar  },
    { label: 'Set Alert',        tooltip: 'Create a metric alert — notify when a threshold is hit',        icon: AlertCircle },
    { label: 'Share Dashboard',  tooltip: 'Generate a shareable link to this dashboard view',              icon: Users     },
  ],
  hr:         [
    { label: 'New Joiner',         tooltip: 'Trigger the full onboarding workflow for a new hire',         icon: UserPlus  },
    { label: 'Leave Request',      tooltip: 'Submit or approve a leave request for a team member',         icon: Calendar  },
    { label: 'Send Contract',      tooltip: 'Generate and send an employment contract via DocuSign',        icon: FileText  },
    { label: 'Performance Review', tooltip: 'Initiate a performance review cycle for selected employees',  icon: Star      },
    { label: 'Update Org Chart',   tooltip: 'Sync the org chart with the latest team structure',           icon: GitBranch },
  ],
  accounts:   [
    { label: 'Chase Invoice',   tooltip: 'Send payment reminders for all overdue invoices',                icon: Receipt   },
    { label: 'New Invoice',     tooltip: 'Create and send a new invoice to a customer',                    icon: DollarSign},
    { label: 'Credit Note',     tooltip: 'Issue a credit note against an existing invoice',                icon: FileText  },
    { label: 'Expense Report',  tooltip: 'Submit or approve an expense report',                            icon: BarChart2 },
    { label: 'Bank Reconcile',  tooltip: 'Trigger the automated bank reconciliation workflow',             icon: CheckCircle2 },
  ],
  sales:      [
    { label: 'New Lead',       tooltip: 'Add a new lead and start the qualification workflow',             icon: UserPlus  },
    { label: 'Score Leads',    tooltip: 'Run AI lead scoring on all unscored leads in the pipeline',       icon: Star      },
    { label: 'Send Proposal',  tooltip: 'Generate a proposal from a template and send to a prospect',     icon: Send      },
    { label: 'Update Pipeline',tooltip: 'Sync CRM pipeline data and recalculate deal scores',             icon: TrendingUp},
    { label: 'Book Demo',      tooltip: 'Send a Calendly invite for a product demo',                      icon: Calendar  },
  ],
  marketing:  [
    { label: 'New Campaign',   tooltip: 'Create a multi-step email or ad campaign',                        icon: Megaphone },
    { label: 'Schedule Post',  tooltip: 'Queue a social post across LinkedIn, Twitter, and Instagram',     icon: Calendar  },
    { label: 'A/B Test',       tooltip: 'Set up an A/B test on email subject lines or ad copy',            icon: BarChart2 },
    { label: 'Email Blast',    tooltip: 'Send a one-off broadcast to a selected audience segment',         icon: Send      },
    { label: 'UTM Builder',    tooltip: 'Generate tracked UTM links for your latest campaign',             icon: Target    },
  ],
  trials:     [
    { label: 'New Trial',      tooltip: 'Provision a new 14-day trial workspace for a prospect',          icon: FlaskConical },
    { label: 'Send Demo',      tooltip: 'Send a personalised demo link to a lead',                        icon: Play      },
    { label: 'Extend Trial',   tooltip: 'Add 7 more days to an active trial workspace',                   icon: Clock     },
    { label: 'Convert to Paid',tooltip: 'Trigger the upgrade workflow and remove trial restrictions',      icon: DollarSign},
    { label: 'Offboard Trial', tooltip: 'Safely expire and delete a trial workspace and all its data',    icon: X         },
  ],
  operations: [
    { label: 'New PO',         tooltip: 'Raise a new purchase order and send to a supplier',              icon: Package   },
    { label: 'Update Stock',   tooltip: 'Sync inventory levels from your warehouse system',               icon: BarChart3 },
    { label: 'Process Order',  tooltip: 'Trigger the order fulfilment and dispatch workflow',              icon: ArrowRight},
    { label: 'Supplier Invoice',tooltip: 'Log and approve an incoming supplier invoice',                  icon: Receipt   },
    { label: 'Stock Alert',    tooltip: 'Send a low-stock notification to the procurement team',          icon: AlertCircle },
  ],
  support:    [
    { label: 'New Ticket',     tooltip: 'Open a new support ticket and assign it to the queue',           icon: Plus      },
    { label: 'Escalate',       tooltip: 'Escalate a ticket to P1 and notify the on-call engineer',        icon: AlertCircle },
    { label: 'Close Ticket',   tooltip: 'Mark a resolved ticket as closed and trigger CSAT survey',       icon: CheckCircle2 },
    { label: 'SLA Report',     tooltip: 'Generate this week\'s SLA compliance report',                    icon: FileText  },
    { label: 'Knowledge Article', tooltip: 'Create a new article in the support knowledge base',          icon: FileText  },
  ],
  success:    [
    { label: 'Health Check',   tooltip: 'Run the automated health score calculation for all accounts',    icon: Star      },
    { label: 'QBR Deck',       tooltip: 'Generate a Quarterly Business Review deck for a customer',       icon: FileText  },
    { label: 'Renewal Alert',  tooltip: 'Send a renewal reminder to accounts expiring in 60 days',        icon: AlertCircle },
    { label: 'Expansion Proposal', tooltip: 'Create an upsell proposal based on usage data',             icon: TrendingUp},
    { label: 'NPS Survey',     tooltip: 'Send an NPS survey to a selected cohort of customers',           icon: Send      },
  ],
  it:         [
    { label: 'New Device',     tooltip: 'Start the device provisioning workflow for a new hire',          icon: Monitor   },
    { label: 'Software Request',tooltip: 'Raise a software licence request for approval',                 icon: Package   },
    { label: 'Access Review',  tooltip: 'Trigger a quarterly access and permission audit',                icon: CheckCircle2 },
    { label: 'Security Alert', tooltip: 'Log a security incident and notify the security team',           icon: AlertCircle },
    { label: 'System Update',  tooltip: 'Schedule and push a system update to managed devices',           icon: ArrowRight},
  ],
  workflows:  [
    { label: 'New Workflow',   tooltip: 'Start building a new automation workflow from a template',       icon: Plus      },
    { label: 'Import',         tooltip: 'Import a workflow from a JSON file or another workspace',        icon: FileText  },
    { label: 'Test Run',       tooltip: 'Run a selected workflow against test data',                      icon: Play      },
    { label: 'Schedule',       tooltip: 'Set or update the schedule for a workflow trigger',              icon: Calendar  },
  ],
  settings:   [],
}

// ─── Fake data seeder ─────────────────────────────────────────────────────────

function seed(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i)
  return Math.abs(h)
}
function fakeNum(base: number, co: string, salt: string): number {
  return base + (seed(co + salt) % 20) - 10
}
const FIRST_NAMES = ['Sophie','James','Priya','Tom','Amara','Oliver','Fatima','Liam','Rachel','Marcus','Nadia','Chris']
const LAST_NAMES  = ['Williams','Okafor','Kapoor','Ashworth','Diallo','Chen','Al-Hassan','Brennan','Singh','Reid','Petrov','Lee']
const COMPANIES   = ['Greenfield Academy','Hopscotch Learning','Bramble Hill Trust','Whitestone College','Oakridge Schools','Crestview Academy','Pinebrook Primary','Sunfield Trust','Nova Group','Apex Consulting','Meridian Ltd']
function fakeName(co: string, i: number) { return `${FIRST_NAMES[seed(co+'fn'+i)%FIRST_NAMES.length]} ${LAST_NAMES[seed(co+'ln'+i)%LAST_NAMES.length]}` }
function fakeCompany(co: string, i: number) { return COMPANIES[seed(co+'c'+i)%COMPANIES.length] }

// ─── Mini chart components (no external library) ──────────────────────────────

function DonutChart({ segments }: { segments: ChartDatum[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0)
  let acc = 0
  const gradient = segments.map(d => {
    const pct = (d.value / total) * 100
    const s = `${d.color} ${acc.toFixed(1)}% ${(acc + pct).toFixed(1)}%`
    acc += pct
    return s
  }).join(', ')
  return (
    <div className="relative" style={{ width: 64, height: 64, flexShrink: 0 }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: `conic-gradient(${gradient})`,
      }} />
      <div style={{
        position: 'absolute', inset: '22%', borderRadius: '50%', backgroundColor: '#111318',
      }} />
    </div>
  )
}

function MiniBarChart({ bars, color }: { bars: ChartDatum[]; color: string }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="flex items-end gap-1 w-full" style={{ height: 52 }}>
      {bars.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-sm"
            style={{ height: Math.max(4, (b.value / max) * 44), backgroundColor: b.color || color }} />
          <span style={{ fontSize: 8, color: '#6B7280', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textAlign: 'center' }}>{b.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Enhanced StatCard ────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, pieData, barData }: {
  label: string; value: string; icon: React.ElementType; color: string
  pieData: ChartDatum[]; barData: ChartDatum[]
}) {
  const [mode, setMode] = useState<ChartMode>('number')
  const btnStyle = (m: ChartMode) => ({ color: mode === m ? color : '#374151', padding: 3, lineHeight: 0, cursor: 'pointer', background: 'none', border: 'none' })
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 110 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>{label}</span>
        <div className="flex items-center shrink-0">
          <button style={btnStyle('number')} title="Show value" onClick={() => setMode('number')}><Hash size={11} /></button>
          <button style={btnStyle('bar')}    title="Bar chart"  onClick={() => setMode('bar')}><BarChart2 size={11} /></button>
          <button style={btnStyle('pie')}    title="Pie chart"  onClick={() => setMode('pie')}><PieChart size={11} /></button>
        </div>
      </div>

      <div className="flex-1 flex items-center">
        {mode === 'number' && (
          <div className="flex items-center justify-between w-full">
            <div className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{value}</div>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
              <Icon size={14} style={{ color }} />
            </div>
          </div>
        )}
        {mode === 'pie' && (
          <div className="flex items-center gap-3 w-full">
            <DonutChart segments={pieData} />
            <div className="flex flex-col gap-1 min-w-0">
              {pieData.map(d => (
                <div key={d.label} className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate" style={{ fontSize: 10, color: '#9CA3AF' }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {mode === 'bar' && <MiniBarChart bars={barData} color={color} />}
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WFStatus }) {
  const cfg = {
    COMPLETE: { label: 'COMPLETE', color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  Icon: CheckCircle2 },
    RUNNING:  { label: 'RUNNING',  color: '#0D9488', bg: 'rgba(13,148,136,0.12)', Icon: Loader2      },
    ACTION:   { label: 'ACTION',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  Icon: AlertCircle  },
  }[status]
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <cfg.Icon size={11} strokeWidth={2} /> {cfg.label}
    </span>
  )
}

function RAGDot({ status }: { status: RAG }) {
  const color = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }[status]
  return <Circle size={10} fill={color} strokeWidth={0} style={{ color }} />
}

// ─── Quick Actions bar ────────────────────────────────────────────────────────

function QuickActionsBar({ dept, onAction }: { dept: DeptId; onAction: (label: string) => void }) {
  const actions = DEPT_ACTIONS[dept] || []
  if (!actions.length) return null
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none"
      style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937' }}>
      <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
      {actions.map(a => (
        <div key={a.label} className="relative group shrink-0">
          <button onClick={() => onAction(a.label)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1F2937' }}>
            <a.icon size={12} />
            {a.label}
          </button>
          {/* Tooltip */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1.5 rounded-lg text-xs w-48 text-center z-50 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: '#1A1D27', color: '#D1D5DB', border: '1px solid #374151', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
            {a.tooltip}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl"
      style={{ backgroundColor: '#1A1D27', border: '1px solid #374151', color: '#F9FAFB', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#A78BFA' }}>Demo mode</span> — this would trigger in your live workspace
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activeDept, onSelect, open, onClose, focusDepts }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void
  focusDepts: string[]
}) {
  const isDimmed = (id: string) => focusDepts.length > 0 && !focusDepts.includes(id)

  const inner = (
    <nav className="flex flex-col gap-0.5 p-3">
      {SIDEBAR_ITEMS.map(item => {
        const active = activeDept === item.id
        const dimmed = !active && isDimmed(item.id)
        const baseOpacity = dimmed ? 0.35 : (active ? 1 : 1)
        return (
          <button key={item.id}
            onClick={() => { onSelect(item.id); onClose() }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left w-full transition-all"
            style={{
              backgroundColor: active ? 'rgba(13,148,136,0.12)' : 'transparent',
              color: active ? '#0D9488' : '#9CA3AF',
              opacity: baseOpacity,
              borderLeft: active ? '2px solid #0D9488' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB' }}}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.opacity = String(baseOpacity); (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}}>
            <item.icon size={15} strokeWidth={active ? 2.5 : 2} />
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 overflow-y-auto"
        style={{ backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937' }}>
        {inner}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <aside className="relative z-50 w-56 flex flex-col overflow-y-auto"
            style={{ backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>NAVIGATION</span>
              <button onClick={onClose} style={{ color: '#6B7280' }}><ChevronLeft size={16} /></button>
            </div>
            {inner}
          </aside>
        </div>
      )}
    </>
  )
}

// ─── Demo greeting banner ─────────────────────────────────────────────────────

const BG_GRADIENTS = [
  'from-violet-950 via-purple-900 to-indigo-950',
  'from-slate-900 via-purple-950 to-violet-900',
  'from-indigo-950 via-violet-900 to-purple-950',
  'from-gray-900 via-violet-950 to-purple-900',
  'from-purple-950 via-indigo-950 to-slate-900',
  'from-violet-900 via-slate-900 to-purple-950',
  'from-indigo-900 via-purple-950 to-violet-950',
]

function DemoPersonalBanner({ company }: { company: string }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const bg = BG_GRADIENTS[new Date().getDay()]

  return (
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-xl`}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl" />
      <div className="absolute right-40 bottom-0 w-40 h-40 bg-teal-500 rounded-full opacity-10 blur-2xl" />

      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* LEFT: greeting */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">
              {greeting}, {company} 👋
            </h1>
            <p className="text-purple-300 text-sm mb-2">{date}</p>
            <p className="text-purple-200/60 text-sm italic">Your demo workspace is ready to explore.</p>
          </div>

          {/* CENTRE: summary chips */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Meetings', value: 4,  color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',     icon: '📅' },
              { label: 'Tasks',    value: 7,  color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '✅' },
              { label: 'Urgent',   value: 2,  color: 'bg-red-500/20 text-red-300 border-red-500/30',         icon: '🔴' },
              { label: 'Emails',   value: 12, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',      icon: '📧' },
            ].map(item => (
              <div key={item.label} className={`flex flex-col items-center px-3 py-2 rounded-xl border ${item.color} min-w-[70px]`}>
                <span className="text-base">{item.icon}</span>
                <span className="text-lg font-black text-white">{item.value}</span>
                <span className="text-xs opacity-70">{item.label}</span>
              </div>
            ))}
          </div>

          {/* RIGHT: weather */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <span className="text-3xl">⛅</span>
              <div>
                <div className="text-xl font-black text-white">11°C</div>
                <div className="text-xs text-purple-300">Partly cloudy</div>
                <div className="text-xs text-purple-300/60">Demo City</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Overview tab bar ─────────────────────────────────────────────────────────

type OverviewTab = 'today' | 'quick-wins' | 'tasks' | 'insights' | 'not-to-miss' | 'team'

const OVERVIEW_TABS: { id: OverviewTab; label: string; icon: string }[] = [
  { id: 'today',       label: 'Today',       icon: '🏠' },
  { id: 'quick-wins',  label: 'Quick Wins',  icon: '⚡' },
  { id: 'tasks',       label: 'Daily Tasks', icon: '✅' },
  { id: 'insights',    label: 'Insights',    icon: '📊' },
  { id: 'not-to-miss', label: "Don't Miss",  icon: '🔴' },
  { id: 'team',        label: 'Team',        icon: '👥' },
]

function DemoTabBar({ tab, onChange }: { tab: OverviewTab; onChange: (t: OverviewTab) => void }) {
  return (
    <div className="border-b overflow-x-auto scrollbar-none -mx-4 sm:-mx-5"
      style={{ backgroundColor: '#0D0E14', borderColor: '#1F2937' }}>
      <div className="flex items-center gap-0 min-w-max px-2">
        {OVERVIEW_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{
              borderBottomColor: tab === t.id ? '#7C3AED' : 'transparent',
              color: tab === t.id ? '#A78BFA' : '#6B7280',
              backgroundColor: tab === t.id ? 'rgba(124,58,237,0.05)' : 'transparent',
            }}
          >
            <span className="text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Meetings Today ───────────────────────────────────────────────────────────

const DEMO_MEETINGS = [
  { id: '1', title: 'The Feed Network — Weekly Check-in',   time: '09:00', duration: '30 min', attendees: ['Sarah M.'],     location: 'Google Meet',  type: 'video'    as const, status: 'done'     as const, link: '#' },
  { id: '2', title: 'New Customer Demo — Oakridge Schools', time: '11:00', duration: '45 min', attendees: ['Charlotte D.'], location: 'Zoom',         type: 'video'    as const, status: 'now'      as const, link: '#' },
  { id: '3', title: 'Investor Update Call',                  time: '14:00', duration: '60 min', attendees: ['Arron'],        location: 'Google Meet',  type: 'call'     as const, status: 'upcoming' as const, link: '#' },
  { id: '4', title: 'Team Standup',                          time: '17:00', duration: '15 min', attendees: ['All team'],     location: 'Slack Huddle', type: 'internal' as const, status: 'upcoming' as const },
] as const

const MEETING_TYPE_ICON = { call: '📞', 'in-person': '🤝', video: '📹', internal: '💬' }

function DemoMeetingsToday() {
  const live = DEMO_MEETINGS.find(m => m.status === 'now')
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>📅 Meetings Today</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>
          {DEMO_MEETINGS.length} scheduled
        </span>
      </div>

      {live && (
        <div className="mb-3 rounded-xl p-3 flex items-center gap-3"
          style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#4ADE80' }}>{live.title}</p>
            <p className="text-xs" style={{ color: 'rgba(74,222,128,0.6)' }}>Happening now · {live.duration}</p>
          </div>
          {'link' in live && live.link && (
            <a href={live.link}
              className="px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors"
              style={{ backgroundColor: '#16A34A' }}>
              Join →
            </a>
          )}
        </div>
      )}

      <div className="space-y-1">
        {DEMO_MEETINGS.map(m => (
          <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
            style={{ opacity: m.status === 'done' ? 0.4 : 1 }}>
            <div className="text-center flex-shrink-0 w-12">
              <div className="text-sm font-bold" style={{ color: '#E5E7EB' }}>{m.time}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>{m.duration}</div>
            </div>
            <span className="text-base flex-shrink-0">{MEETING_TYPE_ICON[m.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{
                color: m.status === 'done' ? '#6B7280' : '#F9FAFB',
                textDecoration: m.status === 'done' ? 'line-through' : 'none',
              }}>
                {m.title}
              </p>
              <p className="text-xs truncate" style={{ color: '#6B7280' }}>
                {m.attendees.join(', ')} · {m.location}
              </p>
            </div>
            {'link' in m && m.link && m.status !== 'done' && (
              <a href={m.link}
                className="px-2 py-1 text-xs rounded-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>
                Join
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Morning Roundup panel ────────────────────────────────────────────────────

const ROUNDUP_ITEMS = [
  { id: 'email',    icon: '📧', label: 'Emails',        count: 12, urgent: true,  color: '#60A5FA', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)',   preview: ['Invoice overdue from Bramble Hill', 'New trial signup — Just wow Inc', 'Stripe payment confirmed — Oakridge'] },
  { id: 'slack',    icon: '💬', label: 'Slack',         count: 7,  urgent: false, color: '#C084FC', bg: 'rgba(192,132,252,0.08)',  border: 'rgba(192,132,252,0.2)',  preview: ['Charlotte: lead scored 87 in SA-02', 'HR-01 completed for new joiner'] },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn',      count: 4,  urgent: false, color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)',   border: 'rgba(45,212,191,0.2)',   preview: ['2 connection requests', 'Post got 47 reactions'] },
  { id: 'news',     icon: '📰', label: 'Industry News', count: 3,  urgent: false, color: '#FBBF24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)',   preview: ['UK SMB automation market up 34% YoY'] },
  { id: 'notion',   icon: '📋', label: 'Notion',        count: 2,  urgent: false, color: '#FB923C', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.2)',   preview: ['Testing guide updated — 2 items resolved'] },
]

function DemoMorningRoundup() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>🌅 Morning Roundup</h3>
        <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
      </div>
      <div className="space-y-2">
        {ROUNDUP_ITEMS.map(item => {
          const isOpen = expanded === item.id
          return (
            <div key={item.id} className="rounded-xl overflow-hidden"
              style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
              <button
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.label}</span>
                  {item.urgent && (
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
                      Urgent
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black" style={{ color: item.color }}>{item.count}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-1.5">
                  {item.preview.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: '#4B5563' }}>→</span>
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DemoTabPlaceholder({ tab }: { tab: OverviewTab }) {
  const labels: Record<OverviewTab, { title: string; icon: string; desc: string }> = {
    'today':       { title: 'Today',       icon: '🏠', desc: '' },
    'quick-wins':  { title: 'Quick Wins',  icon: '⚡', desc: 'Your highest-impact actions for today, prioritised by AI.' },
    'tasks':       { title: 'Daily Tasks', icon: '✅', desc: 'All your tasks in one place, synced from Notion and your calendar.' },
    'insights':    { title: 'Insights',    icon: '📊', desc: 'Key metrics and AI-generated observations across your business.' },
    'not-to-miss': { title: "Don't Miss",  icon: '🔴', desc: 'Critical items that need your attention today.' },
    'team':        { title: 'Team',        icon: '👥', desc: 'See what your team is working on and who needs support.' },
  }
  const { title, icon, desc } = labels[tab]
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl"
        style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{title}</h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: '#9CA3AF' }}>
        {desc || 'This section is fully configured with real data in your live workspace.'}
      </p>
      <Link href="/pricing"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
        Start your workspace <ArrowRight size={14} />
      </Link>
    </div>
  )
}

// ─── Department views ─────────────────────────────────────────────────────────

function OverviewView({ company }: { company: string }) {
  const [tab, setTab] = useState<OverviewTab>('today')
  const wf  = fakeNum(47, company, 'wf')
  const cu  = fakeNum(181, company, 'cu')
  const mrr = fakeNum(42000, company, 'mrr')
  const runs = fakeNum(1840, company, 'runs')
  const wfStatuses: WFStatus[] = ['COMPLETE','RUNNING','ACTION','COMPLETE','COMPLETE','ACTION','RUNNING','COMPLETE']
  const feed = Array.from({ length: 8 }, (_, i) => ({
    name: ['New joiner — IT provisioning','Invoice chase — 30d overdue','Proposal generated','Health score alert','Trial conversion','Support SLA breach — P1','Renewal reminder','Marketing drip sent'][i],
    customer: i < 4 ? 'Internal' : fakeCompany(company, i),
    status: wfStatuses[i], ts: ['Just now','3 min ago','8 min ago','15 min ago','24 min ago','1 hr ago','2 hr ago','3 hr ago'][i],
  }))
  return (
    <div className="space-y-4">
      <DemoPersonalBanner company={company} />
      <DemoTabBar tab={tab} onChange={setTab} />
      {tab === 'today' ? (
        <div className="space-y-4">
          <DemoMeetingsToday />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label="Active Workflows" value={String(wf)} icon={GitBranch} color="#0D9488"
              pieData={[{label:'Running',value:32,color:'#0D9488'},{label:'Paused',value:9,color:'#F59E0B'},{label:'Draft',value:6,color:'#374151'}]}
              barData={[{label:'HR',value:12,color:'#0D9488'},{label:'Sales',value:8,color:'#6C3FC5'},{label:'Fin',value:9,color:'#22C55E'},{label:'Ops',value:11,color:'#F59E0B'},{label:'Sup',value:7,color:'#EF4444'}]} />
            <StatCard label="Total Customers" value={String(cu)} icon={Users} color="#6C3FC5"
              pieData={[{label:'Healthy',value:Math.round(cu*.77),color:'#22C55E'},{label:'At Risk',value:Math.round(cu*.17),color:'#F59E0B'},{label:'Critical',value:Math.round(cu*.06),color:'#EF4444'}]}
              barData={[{label:'Enterprise',value:45,color:'#6C3FC5'},{label:'Mid-Mkt',value:82,color:'#A78BFA'},{label:'SMB',value:54,color:'#7C3AED'}]} />
            <StatCard label="Monthly MRR" value={`£${mrr.toLocaleString()}`} icon={TrendingUp} color="#22C55E"
              pieData={[{label:'Pro',value:60,color:'#22C55E'},{label:'Enterprise',value:30,color:'#0D9488'},{label:'Starter',value:10,color:'#374151'}]}
              barData={[{label:'Oct',value:38000,color:'#22C55E'},{label:'Nov',value:39000,color:'#22C55E'},{label:'Dec',value:41000,color:'#22C55E'},{label:'Jan',value:42000,color:'#22C55E'},{label:'Feb',value:43000,color:'#22C55E'},{label:'Mar',value:mrr,color:'#0D9488'}]} />
            <StatCard label="Workflow Runs (30d)" value={String(runs)} icon={Zap} color="#F59E0B"
              pieData={[{label:'Success',value:92,color:'#22C55E'},{label:'Failed',value:5,color:'#EF4444'},{label:'Partial',value:3,color:'#F59E0B'}]}
              barData={[{label:'Mon',value:240,color:'#F59E0B'},{label:'Tue',value:280,color:'#F59E0B'},{label:'Wed',value:260,color:'#F59E0B'},{label:'Thu',value:310,color:'#F59E0B'},{label:'Fri',value:290,color:'#F59E0B'},{label:'Sat',value:180,color:'#F59E0B'},{label:'Sun',value:280,color:'#F59E0B'}]} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Workflow Activity</p>
                <span className="text-xs" style={{ color: '#0D9488' }}>Live</span>
              </div>
              {feed.map((run, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: i < feed.length-1 ? '1px solid #1F2937' : undefined }}>
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
            <DemoMorningRoundup />
          </div>
        </div>
      ) : (
        <DemoTabPlaceholder tab={tab} />
      )}
    </div>
  )
}

function PlaceholderView({ title, stats, rows, cols }: {
  title: string
  stats: { label: string; value: string; color: string; icon: React.ElementType; pieData: ChartDatum[]; barData: ChartDatum[] }[]
  rows: string[][]
  cols: string[]
}) {
  return (
    <div className="space-y-4">
      <div className={`grid gap-3 grid-cols-2 ${stats.length >= 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {stats.map(s => <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} pieData={s.pieData} barData={s.barData} />)}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {cols.map(c => <th key={c} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length-1 ? '1px solid #111318' : undefined }}>
                {row.map((cell, j) => (
                  <td key={j} className="px-5 py-3 text-sm" style={{ color: j === 0 ? '#F9FAFB' : '#9CA3AF' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InsightsView({ company }: { company: string }) {
  const cu = fakeNum(181,company,'cu')
  return <PlaceholderView
    title="Top Performing Workflows (Last 30 Days)"
    stats={[
      { label:'Automation Hours Saved', value:`${fakeNum(340,company,'ah')}h`, color:'#0D9488', icon:Zap,
        pieData:[{label:'HR',value:120,color:'#0D9488'},{label:'Sales',value:80,color:'#6C3FC5'},{label:'Finance',value:90,color:'#22C55E'},{label:'Ops',value:50,color:'#F59E0B'}],
        barData:[{label:'W1',value:80,color:'#0D9488'},{label:'W2',value:85,color:'#0D9488'},{label:'W3',value:90,color:'#0D9488'},{label:'W4',value:85,color:'#0D9488'}] },
      { label:'Tasks Completed by AI', value:`${fakeNum(1240,company,'ai')}`, color:'#6C3FC5', icon:CheckCircle2,
        pieData:[{label:'Emails',value:40,color:'#6C3FC5'},{label:'Reports',value:25,color:'#A78BFA'},{label:'Scheduling',value:20,color:'#7C3AED'},{label:'Other',value:15,color:'#374151'}],
        barData:[{label:'Mon',value:220,color:'#6C3FC5'},{label:'Tue',value:240,color:'#6C3FC5'},{label:'Wed',value:260,color:'#6C3FC5'},{label:'Thu',value:280,color:'#6C3FC5'},{label:'Fri',value:240,color:'#6C3FC5'}] },
      { label:'NPS Score', value:`${fakeNum(68,company,'nps')}`, color:'#22C55E', icon:Star,
        pieData:[{label:'Promoters',value:68,color:'#22C55E'},{label:'Passives',value:22,color:'#F59E0B'},{label:'Detractors',value:10,color:'#EF4444'}],
        barData:[{label:'Q3 \'25',value:62,color:'#22C55E'},{label:'Q4 \'25',value:65,color:'#22C55E'},{label:'Q1 \'26',value:68,color:'#0D9488'}] },
    ]}
    cols={['Workflow','Runs','Saved (hrs)','Success Rate']}
    rows={[
      ['New Joiner Onboarding','142','2.1h each','98%'],
      ['Invoice Chase — 30d','89','0.5h each','94%'],
      ['Lead Scoring — AI','312','0.2h each','99%'],
      ['Health Score Alert','67','1.4h each','91%'],
      ['Trial Conversion Flow','44','3.2h each','87%'],
    ]} />
}

function HRView({ company }: { company: string }) {
  const emp = fakeNum(187,company,'emp'), ob = fakeNum(8,company,'ob'), lv = fakeNum(14,company,'lv')
  const starters = Array.from({length:5},(_,i)=>({name:fakeName(company,i),role:['Customer Success Manager','Sales Development Rep','Frontend Developer','Marketing Executive','Support Specialist'][i],progress:[75,90,30,25,100][i]}))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Employees" value={String(emp)} icon={Users} color="#0D9488"
          pieData={[{label:'Full-time',value:Math.round(emp*.8),color:'#0D9488'},{label:'Part-time',value:Math.round(emp*.12),color:'#6C3FC5'},{label:'Contractor',value:Math.round(emp*.08),color:'#374151'}]}
          barData={[{label:'Eng',value:42,color:'#0D9488'},{label:'Sales',value:38,color:'#6C3FC5'},{label:'CS',value:35,color:'#22C55E'},{label:'Mktg',value:28,color:'#F59E0B'},{label:'Ops',value:44,color:'#EF4444'}]} />
        <StatCard label="Active Onboardings" value={String(ob)} icon={CheckCircle2} color="#22C55E"
          pieData={[{label:'On track',value:6,color:'#22C55E'},{label:'Behind',value:2,color:'#EF4444'}]}
          barData={[{label:'Wk1',value:3,color:'#22C55E'},{label:'Wk2',value:5,color:'#22C55E'},{label:'Wk3',value:7,color:'#22C55E'},{label:'Wk4',value:ob,color:'#0D9488'}]} />
        <StatCard label="Leave Requests" value={String(lv)} icon={Calendar} color="#F59E0B"
          pieData={[{label:'Annual',value:8,color:'#F59E0B'},{label:'Sick',value:4,color:'#EF4444'},{label:'Other',value:2,color:'#374151'}]}
          barData={[{label:'Mon',value:2,color:'#F59E0B'},{label:'Tue',value:3,color:'#F59E0B'},{label:'Wed',value:4,color:'#F59E0B'},{label:'Thu',value:3,color:'#F59E0B'},{label:'Fri',value:2,color:'#F59E0B'}]} />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>New Starter Tracker</p>
        </div>
        <table className="w-full text-sm">
          <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Name','Role','Progress','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
          <tbody>{starters.map((s,i)=>(
            <tr key={i} style={{borderBottom:i<starters.length-1?'1px solid #111318':undefined}}>
              <td className="px-5 py-3 font-medium" style={{color:'#F9FAFB'}}>{s.name}</td>
              <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{s.role}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'#1F2937'}}>
                    <div className="h-full rounded-full" style={{width:`${s.progress}%`,backgroundColor:s.progress===100?'#22C55E':s.progress>50?'#0D9488':'#F59E0B'}} />
                  </div>
                  <span className="text-xs" style={{color:'#9CA3AF'}}>{s.progress}%</span>
                </div>
              </td>
              <td className="px-5 py-3">
                <span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:s.progress===100?'rgba(34,197,94,0.1)':'rgba(13,148,136,0.1)',color:s.progress===100?'#22C55E':'#0D9488'}}>{s.progress===100?'Complete':'Onboarding'}</span>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

function AccountsView({ company }: { company: string }) {
  const overdue = fakeNum(7,company,'ov'), arr = fakeNum(504000,company,'arr'), cost = fakeNum(82000,company,'cost')
  return <PlaceholderView
    title="Outstanding Invoices"
    stats={[
      { label:'Overdue Invoices', value:String(overdue), color:'#EF4444', icon:AlertCircle,
        pieData:[{label:'0-30d',value:3,color:'#F59E0B'},{label:'30-60d',value:2,color:'#EF4444'},{label:'60d+',value:2,color:'#7F1D1D'}],
        barData:[{label:'Jan',value:5,color:'#EF4444'},{label:'Feb',value:6,color:'#EF4444'},{label:'Mar',value:overdue,color:'#DC2626'}] },
      { label:'Annual Revenue', value:`£${(arr/1000).toFixed(0)}k`, color:'#22C55E', icon:TrendingUp,
        pieData:[{label:'Subscriptions',value:85,color:'#22C55E'},{label:'Services',value:10,color:'#0D9488'},{label:'One-off',value:5,color:'#374151'}],
        barData:[{label:'Q2\'25',value:115000,color:'#22C55E'},{label:'Q3\'25',value:124000,color:'#22C55E'},{label:'Q4\'25',value:130000,color:'#22C55E'},{label:'Q1\'26',value:arr/4,color:'#0D9488'}] },
      { label:'Operating Costs', value:`£${(cost/1000).toFixed(0)}k`, color:'#F59E0B', icon:Receipt,
        pieData:[{label:'Staff',value:60,color:'#F59E0B'},{label:'Infra',value:20,color:'#EF4444'},{label:'Marketing',value:12,color:'#6C3FC5'},{label:'Other',value:8,color:'#374151'}],
        barData:[{label:'Jan',value:78000,color:'#F59E0B'},{label:'Feb',value:80000,color:'#F59E0B'},{label:'Mar',value:cost,color:'#D97706'}] },
    ]}
    cols={['Customer','Amount','Due Date','Status']}
    rows={Array.from({length:6},(_,i)=>[fakeCompany(company,i+20),`£${fakeNum(3200,company,'inv'+i).toLocaleString()}`,['14 Mar','22 Mar','31 Mar','07 Apr','15 Apr','28 Apr'][i],['Overdue 14d','Due today','Due in 8d','Sent','Sent','Draft'][i]])} />
}

function SalesView({ company }: { company: string }) {
  const leads = fakeNum(34,company,'leads'), pipe = fakeNum(128000,company,'pipe'), wr = fakeNum(28,company,'wr')
  const deals = Array.from({length:6},(_,i)=>({name:fakeCompany(company,i+10),value:`£${(fakeNum(12000,company,'d'+i)*(i+1)/2).toLocaleString()}`,stage:['Discovery','Proposal','Negotiation','Verbal Yes','Discovery','Closed Won'][i],score:[72,88,91,94,45,100][i]}))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Active Leads" value={String(leads)} icon={Users} color="#6C3FC5"
          pieData={[{label:'Hot',value:8,color:'#EF4444'},{label:'Warm',value:16,color:'#F59E0B'},{label:'Cold',value:10,color:'#374151'}]}
          barData={[{label:'Inbound',value:18,color:'#6C3FC5'},{label:'Outbound',value:10,color:'#A78BFA'},{label:'Referral',value:6,color:'#7C3AED'}]} />
        <StatCard label="Pipeline Value" value={`£${pipe.toLocaleString()}`} icon={TrendingUp} color="#0D9488"
          pieData={[{label:'Discovery',value:25,color:'#374151'},{label:'Proposal',value:35,color:'#F59E0B'},{label:'Negotiation',value:25,color:'#0D9488'},{label:'Close',value:15,color:'#22C55E'}]}
          barData={[{label:'Jan',value:110000,color:'#0D9488'},{label:'Feb',value:118000,color:'#0D9488'},{label:'Mar',value:pipe,color:'#0F766E'}]} />
        <StatCard label="Win Rate" value={`${wr}%`} icon={Star} color="#F59E0B"
          pieData={[{label:'Won',value:wr,color:'#22C55E'},{label:'Lost',value:100-wr,color:'#374151'}]}
          barData={[{label:'Q3\'25',value:24,color:'#F59E0B'},{label:'Q4\'25',value:26,color:'#F59E0B'},{label:'Q1\'26',value:wr,color:'#D97706'}]} />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Active Pipeline</p></div>
        <table className="w-full text-sm">
          <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Company','Value','Stage','AI Score'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
          <tbody>{deals.map((d,i)=>(
            <tr key={i} style={{borderBottom:i<deals.length-1?'1px solid #111318':undefined}}>
              <td className="px-5 py-3 font-medium" style={{color:'#F9FAFB'}}>{d.name}</td>
              <td className="px-5 py-3" style={{color:'#9CA3AF'}}>{d.value}</td>
              <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:d.stage==='Closed Won'?'rgba(34,197,94,0.12)':'rgba(13,148,136,0.1)',color:d.stage==='Closed Won'?'#22C55E':'#0D9488'}}>{d.stage}</span></td>
              <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'#1F2937'}}><div className="h-full rounded-full" style={{width:`${d.score}%`,backgroundColor:d.score>=80?'#22C55E':d.score>=60?'#F59E0B':'#EF4444'}} /></div><span className="text-xs" style={{color:'#9CA3AF'}}>{d.score}</span></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

function MarketingView({ company }: { company: string }) {
  return <PlaceholderView
    title="Active Campaigns"
    stats={[
      { label:'Email Open Rate', value:`${fakeNum(42,company,'or')}%`, color:'#0D9488', icon:Send,
        pieData:[{label:'Opened',value:42,color:'#0D9488'},{label:'Unopened',value:58,color:'#374151'}],
        barData:[{label:'Jan',value:38,color:'#0D9488'},{label:'Feb',value:40,color:'#0D9488'},{label:'Mar',value:42,color:'#0F766E'}] },
      { label:'Leads from Marketing', value:String(fakeNum(124,company,'ml')), color:'#6C3FC5', icon:Target,
        pieData:[{label:'Email',value:45,color:'#6C3FC5'},{label:'LinkedIn',value:30,color:'#A78BFA'},{label:'SEO',value:15,color:'#7C3AED'},{label:'Paid',value:10,color:'#374151'}],
        barData:[{label:'Jan',value:95,color:'#6C3FC5'},{label:'Feb',value:108,color:'#6C3FC5'},{label:'Mar',value:124,color:'#7C3AED'}] },
      { label:'Conversion Rate', value:`${fakeNum(8,company,'cr')}%`, color:'#F59E0B', icon:TrendingUp,
        pieData:[{label:'Converted',value:8,color:'#22C55E'},{label:'Dropped',value:92,color:'#374151'}],
        barData:[{label:'Q3',value:6,color:'#F59E0B'},{label:'Q4',value:7,color:'#F59E0B'},{label:'Q1',value:8,color:'#D97706'}] },
    ]}
    cols={['Campaign','Sent','Open Rate','Clicks','Status']}
    rows={[
      ['Q1 Product Launch Email','2,840','44%','312','Active'],
      ['LinkedIn Lead Gen — Edu','—','—','891 impressions','Active'],
      ['Trial Nurture Sequence','456','38%','89','Active'],
      ['Webinar Follow-up','1,240','52%','208','Completed'],
      ['Competitor Win-back','312','29%','44','Paused'],
    ]} />
}

function TrialsView({ company }: { company: string }) {
  const active = fakeNum(23,company,'tr'), converting = fakeNum(8,company,'cv')
  return <PlaceholderView
    title="Active Trial Workspaces"
    stats={[
      { label:'Active Trials', value:String(active), color:'#6C3FC5', icon:FlaskConical,
        pieData:[{label:'Week 1',value:8,color:'#6C3FC5'},{label:'Week 2',value:9,color:'#A78BFA'},{label:'Expiring',value:6,color:'#EF4444'}],
        barData:[{label:'Jan',value:18,color:'#6C3FC5'},{label:'Feb',value:20,color:'#6C3FC5'},{label:'Mar',value:active,color:'#7C3AED'}] },
      { label:'Converting Soon', value:String(converting), color:'#22C55E', icon:TrendingUp,
        pieData:[{label:'Hot',value:5,color:'#22C55E'},{label:'Warm',value:3,color:'#F59E0B'}],
        barData:[{label:'Wk1',value:2,color:'#22C55E'},{label:'Wk2',value:4,color:'#22C55E'},{label:'Wk3',value:6,color:'#22C55E'},{label:'Wk4',value:converting,color:'#0D9488'}] },
      { label:'Trial Conversion Rate', value:`${fakeNum(34,company,'tcr')}%`, color:'#0D9488', icon:Star,
        pieData:[{label:'Converted',value:34,color:'#0D9488'},{label:'Expired',value:66,color:'#374151'}],
        barData:[{label:'Q3',value:28,color:'#0D9488'},{label:'Q4',value:31,color:'#0D9488'},{label:'Q1',value:34,color:'#0F766E'}] },
    ]}
    cols={['Company','Started','Days Left','Dept Focus','Status']}
    rows={Array.from({length:6},(_,i)=>[fakeCompany(company,i+30),['14 Mar','10 Mar','8 Mar','5 Mar','2 Mar','28 Feb'][i],['12','8','6','3','1','Expiring today'][i],['HR, Sales','All','Finance, Ops','Sales','HR','All'][i],['Active','Active','Active','Active','Expiring','Expiring'][i]])} />
}

function OpsView({ company }: { company: string }) {
  const orders = fakeNum(14,company,'po'), ls = fakeNum(6,company,'ls'), inv = fakeNum(28400,company,'inv')
  const poList = Array.from({length:5},(_,i)=>({po:`PO-2026-${88-i}`,supplier:['Acme Office Supplies','TechPro Direct','PrintWave Ltd','CloudLicence Group','Ergonomics Now'][i],value:`£${fakeNum(3000,company,'pov'+i).toLocaleString()}`,status:['In Transit','Delivered','Pending','Delivered','Overdue'][i]}))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Open Purchase Orders" value={String(orders)} icon={Package} color="#F59E0B"
          pieData={[{label:'In Transit',value:5,color:'#0D9488'},{label:'Pending',value:6,color:'#F59E0B'},{label:'Overdue',value:3,color:'#EF4444'}]}
          barData={[{label:'Jan',value:10,color:'#F59E0B'},{label:'Feb',value:12,color:'#F59E0B'},{label:'Mar',value:orders,color:'#D97706'}]} />
        <StatCard label="Low Stock Items" value={String(ls)} icon={AlertCircle} color="#EF4444"
          pieData={[{label:'Critical',value:2,color:'#EF4444'},{label:'Low',value:4,color:'#F59E0B'}]}
          barData={[{label:'Week 1',value:3,color:'#EF4444'},{label:'Week 2',value:4,color:'#EF4444'},{label:'Week 3',value:5,color:'#EF4444'},{label:'Week 4',value:ls,color:'#DC2626'}]} />
        <StatCard label="Supplier Invoices Due" value={`£${inv.toLocaleString()}`} icon={Receipt} color="#6C3FC5"
          pieData={[{label:'This week',value:60,color:'#EF4444'},{label:'This month',value:30,color:'#F59E0B'},{label:'Next month',value:10,color:'#22C55E'}]}
          barData={[{label:'Jan',value:24000,color:'#6C3FC5'},{label:'Feb',value:26000,color:'#6C3FC5'},{label:'Mar',value:inv,color:'#7C3AED'}]} />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Purchase Orders</p></div>
        <table className="w-full text-sm">
          <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['PO #','Supplier','Value','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
          <tbody>{poList.map((po,i)=>(
            <tr key={i} style={{borderBottom:i<poList.length-1?'1px solid #111318':undefined}}>
              <td className="px-5 py-3 font-mono text-xs" style={{color:'#9CA3AF'}}>{po.po}</td>
              <td className="px-5 py-3" style={{color:'#F9FAFB'}}>{po.supplier}</td>
              <td className="px-5 py-3" style={{color:'#9CA3AF'}}>{po.value}</td>
              <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:po.status==='Delivered'?'rgba(34,197,94,0.1)':po.status==='Overdue'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)',color:po.status==='Delivered'?'#22C55E':po.status==='Overdue'?'#EF4444':'#F59E0B'}}>{po.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

function SupportView({ company }: { company: string }) {
  return <PlaceholderView
    title="Open Support Tickets"
    stats={[
      { label:'Open Tickets', value:String(fakeNum(18,company,'tk')), color:'#EF4444', icon:Headphones,
        pieData:[{label:'P1',value:2,color:'#EF4444'},{label:'P2',value:6,color:'#F59E0B'},{label:'P3',value:10,color:'#374151'}],
        barData:[{label:'Mon',value:4,color:'#EF4444'},{label:'Tue',value:6,color:'#EF4444'},{label:'Wed',value:5,color:'#EF4444'},{label:'Thu',value:7,color:'#EF4444'},{label:'Fri',value:3,color:'#EF4444'}] },
      { label:'Avg Resolution Time', value:`${fakeNum(4,company,'rt')}h`, color:'#F59E0B', icon:Clock,
        pieData:[{label:'<2h',value:30,color:'#22C55E'},{label:'2-8h',value:50,color:'#F59E0B'},{label:'>8h',value:20,color:'#EF4444'}],
        barData:[{label:'Jan',value:5,color:'#F59E0B'},{label:'Feb',value:4,color:'#F59E0B'},{label:'Mar',value:4,color:'#D97706'}] },
      { label:'CSAT Score', value:`${fakeNum(91,company,'cs')}%`, color:'#22C55E', icon:Star,
        pieData:[{label:'Happy',value:91,color:'#22C55E'},{label:'Neutral',value:6,color:'#F59E0B'},{label:'Unhappy',value:3,color:'#EF4444'}],
        barData:[{label:'Q3',value:88,color:'#22C55E'},{label:'Q4',value:90,color:'#22C55E'},{label:'Q1',value:91,color:'#0D9488'}] },
    ]}
    cols={['Ticket','Customer','Priority','Assigned To','Status']}
    rows={[
      ['TKT-2891 — Login issue',fakeCompany(company,40),'P1','Alex T.','Open — 2h'],
      ['TKT-2889 — Export fails',fakeCompany(company,41),'P2','Priya K.','In Progress'],
      ['TKT-2884 — Data import',fakeCompany(company,42),'P2','James W.','Waiting customer'],
      ['TKT-2881 — Billing query',fakeCompany(company,43),'P3','Rachel S.','Open'],
      ['TKT-2878 — SSO config',fakeCompany(company,44),'P2','Oliver B.','In Progress'],
    ]} />
}

function SuccessView({ company }: { company: string }) {
  const cu = fakeNum(181,company,'cu')
  return <PlaceholderView
    title="Account Health Overview"
    stats={[
      { label:'At-Risk Accounts', value:String(Math.round(cu*.17)), color:'#F59E0B', icon:AlertCircle,
        pieData:[{label:'Declining usage',value:15,color:'#F59E0B'},{label:'Overdue renewal',value:8,color:'#EF4444'},{label:'Low NPS',value:8,color:'#374151'}],
        barData:[{label:'Jan',value:28,color:'#F59E0B'},{label:'Feb',value:31,color:'#F59E0B'},{label:'Mar',value:Math.round(cu*.17),color:'#D97706'}] },
      { label:'Renewals This Month', value:String(fakeNum(14,company,'rn')), color:'#0D9488', icon:TrendingUp,
        pieData:[{label:'Renewing',value:11,color:'#0D9488'},{label:'At risk',value:3,color:'#EF4444'}],
        barData:[{label:'Jan',value:10,color:'#0D9488'},{label:'Feb',value:12,color:'#0D9488'},{label:'Mar',value:14,color:'#0F766E'}] },
      { label:'Expansion Revenue', value:`£${fakeNum(12000,company,'er').toLocaleString()}`, color:'#22C55E', icon:Award,
        pieData:[{label:'Upsells',value:70,color:'#22C55E'},{label:'Add-ons',value:30,color:'#0D9488'}],
        barData:[{label:'Q3',value:8000,color:'#22C55E'},{label:'Q4',value:10000,color:'#22C55E'},{label:'Q1',value:12000,color:'#0D9488'}] },
    ]}
    cols={['Account','Health Score','Next QBR','Renewal','CSM']}
    rows={Array.from({length:6},(_,i)=>[fakeCompany(company,i+50),`${[42,78,91,34,88,62][i]}/100`,['Apr 2','Apr 15','May 1','Mar 28','Apr 8','May 12'][i],['Jun','Aug','Oct','May','Sep','Jul'][i],fakeName(company,i+8).split(' ')[0]])} />
}

function ITView({ company }: { company: string }) {
  return <PlaceholderView
    title="Device & Access Inventory"
    stats={[
      { label:'Managed Devices', value:String(fakeNum(184,company,'dv')), color:'#0D9488', icon:Monitor,
        pieData:[{label:'MacOS',value:60,color:'#0D9488'},{label:'Windows',value:30,color:'#6C3FC5'},{label:'Linux',value:10,color:'#374151'}],
        barData:[{label:'Q3',value:160,color:'#0D9488'},{label:'Q4',value:172,color:'#0D9488'},{label:'Q1',value:184,color:'#0F766E'}] },
      { label:'Open IT Requests', value:String(fakeNum(12,company,'ir')), color:'#F59E0B', icon:Package,
        pieData:[{label:'Software',value:6,color:'#F59E0B'},{label:'Hardware',value:3,color:'#EF4444'},{label:'Access',value:3,color:'#374151'}],
        barData:[{label:'Mon',value:3,color:'#F59E0B'},{label:'Tue',value:4,color:'#F59E0B'},{label:'Wed',value:5,color:'#F59E0B'},{label:'Thu',value:4,color:'#F59E0B'}] },
      { label:'Security Alerts', value:String(fakeNum(3,company,'sa')), color:'#EF4444', icon:AlertCircle,
        pieData:[{label:'Critical',value:1,color:'#EF4444'},{label:'Warning',value:2,color:'#F59E0B'}],
        barData:[{label:'Jan',value:5,color:'#EF4444'},{label:'Feb',value:4,color:'#EF4444'},{label:'Mar',value:3,color:'#DC2626'}] },
    ]}
    cols={['Name','Device','OS','Last Seen','Status']}
    rows={Array.from({length:5},(_,i)=>[fakeName(company,i+15),['MacBook Pro 14"','MacBook Air M2','Dell XPS 15','MacBook Pro 16"','Lenovo ThinkPad'][i],['macOS 14','macOS 14','Windows 11','macOS 14','Ubuntu 22'][i],['5 min ago','12 min ago','1 hr ago','Just now','3 hr ago'][i],['Online','Online','Online','Online','Offline'][i]])} />
}

function WorkflowsView({ company }: { company: string }) {
  const wf = fakeNum(47,company,'wf'), runs = fakeNum(1840,company,'runs')
  return <PlaceholderView
    title="Workflow Library"
    stats={[
      { label:'Total Workflows', value:String(wf), color:'#0D9488', icon:GitBranch,
        pieData:[{label:'HR',value:12,color:'#0D9488'},{label:'Sales',value:8,color:'#6C3FC5'},{label:'Finance',value:9,color:'#22C55E'},{label:'Ops',value:11,color:'#F59E0B'},{label:'Other',value:7,color:'#374151'}],
        barData:[{label:'HR',value:12,color:'#0D9488'},{label:'Sales',value:8,color:'#6C3FC5'},{label:'Fin',value:9,color:'#22C55E'},{label:'Ops',value:11,color:'#F59E0B'},{label:'Sup',value:7,color:'#EF4444'}] },
      { label:'Runs This Month', value:String(runs), color:'#6C3FC5', icon:Zap,
        pieData:[{label:'Success',value:92,color:'#22C55E'},{label:'Failed',value:5,color:'#EF4444'},{label:'Partial',value:3,color:'#F59E0B'}],
        barData:[{label:'Wk1',value:420,color:'#6C3FC5'},{label:'Wk2',value:460,color:'#6C3FC5'},{label:'Wk3',value:490,color:'#6C3FC5'},{label:'Wk4',value:470,color:'#7C3AED'}] },
      { label:'Avg Success Rate', value:`${fakeNum(94,company,'sr')}%`, color:'#22C55E', icon:CheckCircle2,
        pieData:[{label:'Success',value:94,color:'#22C55E'},{label:'Failed',value:6,color:'#EF4444'}],
        barData:[{label:'Jan',value:91,color:'#22C55E'},{label:'Feb',value:93,color:'#22C55E'},{label:'Mar',value:94,color:'#0D9488'}] },
    ]}
    cols={['Workflow','Department','Trigger','Last Run','Runs (30d)']}
    rows={[
      ['New Joiner Onboarding','HR','Supabase webhook','2 min ago','142'],
      ['Invoice Chase — 30d','Finance','Cron — daily 9am','8 min ago','89'],
      ['Lead Scoring — AI','Sales','New lead created','Just now','312'],
      ['Health Score Alert','Success','Cron — weekly','15 min ago','67'],
      ['Trial Conversion Flow','Trials','Day 12 trigger','1 hr ago','44'],
      ['Support SLA Monitor','Support','Cron — hourly','22 min ago','720'],
    ]} />
}

function SettingsView({ company }: { company: string }) {
  return (
    <div className="max-w-2xl space-y-6">
      {[
        { title: 'Workspace', fields: [['Company name', company], ['Workspace slug', company.toLowerCase().replace(/\s+/g,'-')], ['Plan', '14-day Trial']] },
        { title: 'Notifications', fields: [['Slack channel', '#lumio-demo'], ['Email digests', 'Daily at 9am'], ['Alert threshold', 'P1 and P2 only']] },
        { title: 'Integrations', fields: [['CRM sync', 'Salesforce (demo)'], ['Accounting', 'Xero (demo)'], ['HRMS', 'BambooHR (demo)']] },
      ].map(section => (
        <div key={section.title} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{section.title}</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {section.fields.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs" style={{ color: '#4B5563' }}>Settings are read-only in demo mode. Connect your live workspace to configure.</p>
    </div>
  )
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

interface InviteeRow { name: string; email: string; jobTitle: string; departments: string[] }

function InviteModal({ slug, company, userName, onClose }: { slug: string; company: string; userName: string; onClose: () => void }) {
  const blank = (): InviteeRow => ({ name: '', email: '', jobTitle: '', departments: [] })
  const [rows, setRows]           = useState<InviteeRow[]>([blank()])
  const [openDeptIdx, setOpenDeptIdx] = useState<number | null>(null)
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpenDeptIdx(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function updateRow(i: number, field: keyof InviteeRow, val: string | string[]) { setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row)) }
  function toggleDept(ri: number, dept: string) { const c = rows[ri].departments; updateRow(ri, 'departments', c.includes(dept) ? c.filter(d => d !== dept) : [...c, dept]) }

  async function handleSend() {
    const valid = rows.filter(r => r.name.trim() && r.email.trim())
    if (!valid.length) { setError('Add at least one name and email.'); return }
    setSending(true); setError('')
    const res = await fetch('/api/demo/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, invitees: valid, inviterName: userName || 'A teammate', companyName: company }) })
    setSending(false)
    if (res.ok) setSent(true); else setError('Failed to send. Please try again.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxHeight: '90vh' }}>
        <div className="flex items-start justify-between p-6 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Invite your team to this demo</h2><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Let them explore Lumio for themselves</p></div>
          <button onClick={onClose} style={{ color: '#6B7280' }} onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')} onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}><X size={18} /></button>
        </div>
        {sent ? (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)' }}><Check size={28} style={{ color: '#0D9488' }} /></div>
            <h3 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Invites sent!</h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Your team will receive a link to join this workspace.</p>
            <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Done</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={dropRef}>
              {rows.map((row, i) => (
                <div key={i} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>INVITEE {i + 1}</span>
                    {rows.length > 1 && <button onClick={() => setRows(r => r.filter((_, idx) => idx !== i))} className="text-xs transition-colors" style={{ color: '#6B7280' }} onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')} onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>Remove</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([{field:'name'as const,placeholder:'Full name',type:'text'},{field:'email'as const,placeholder:'Work email',type:'email'},{field:'jobTitle'as const,placeholder:'Job title',type:'text'}]).map(f => (
                      <input key={f.field} type={f.type} placeholder={f.placeholder} value={row[f.field]} onChange={e => updateRow(i, f.field, e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')} onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')} />
                    ))}
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenDeptIdx(openDeptIdx === i ? null : i)} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-full text-left" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}>
                      <span className="flex-1 truncate">{row.departments.length ? row.departments.join(', ') : 'Select departments (optional)'}</span>
                      <ChevronDown size={12} className="shrink-0" />
                    </button>
                    {openDeptIdx === i && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-xl z-10 p-3" style={{ backgroundColor: '#1A1D27', border: '1px solid #1F2937', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                        <div className="flex flex-wrap gap-1.5">
                          {DEPARTMENTS.map(dept => { const active = row.departments.includes(dept); return <button key={dept} onClick={() => toggleDept(i, dept)} className="text-xs px-2.5 py-1 rounded-lg transition-all" style={{ backgroundColor: active ? 'rgba(13,148,136,0.2)' : '#07080F', color: active ? '#0D9488' : '#6B7280', border: `1px solid ${active ? '#0D9488' : '#1F2937'}` }}>{dept}</button> })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => setRows(r => [...r, blank()])} className="flex items-center gap-2 text-sm font-medium transition-opacity" style={{ color: '#0D9488' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}><Plus size={15} /> Add another person</button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
            <div className="p-6 shrink-0 flex justify-end gap-3" style={{ borderTop: '1px solid #1F2937' }}>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
              <button onClick={handleSend} disabled={sending} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: sending ? 0.6 : 1 }}><Send size={14} /> {sending ? 'Sending…' : 'Send invites'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Onboarding Modal ─────────────────────────────────────────────────────────

const PICKER_DEPTS = SIDEBAR_ITEMS.filter(d => d.id !== 'settings')

function DeptPickerModal({ onComplete }: { onComplete: (depts: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving]     = useState(false)

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleStart() {
    setSaving(true)
    localStorage.setItem('demo_onboarded', 'true')
    localStorage.setItem('demo_focus_depts', JSON.stringify(selected))
    // Non-blocking save to Supabase
    const token = localStorage.getItem('demo_session_token')
    if (token) {
      fetch('/api/demo/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, selected_departments: selected }),
      }).catch(() => {})
    }
    onComplete(selected)
  }

  function handleSkip() {
    localStorage.setItem('demo_onboarded', 'true')
    localStorage.setItem('demo_focus_depts', JSON.stringify([]))
    const token = localStorage.getItem('demo_session_token')
    if (token) {
      fetch('/api/demo/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, selected_departments: [] }),
      }).catch(() => {})
    }
    onComplete([])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <div className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#0D9488' }}>LUMIO DEMO</div>
            <h2 className="text-2xl font-black" style={{ color: '#F9FAFB' }}>What matters most to you?</h2>
            <p className="text-sm mt-2 max-w-sm" style={{ color: '#9CA3AF' }}>
              We&apos;ll highlight the most relevant parts of Lumio. Leave blank to explore everything.
            </p>
          </div>
          <button onClick={handleSkip} className="text-sm ml-6 mt-1 shrink-0 transition-colors"
            style={{ color: '#4B5563' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}>
            Skip
          </button>
        </div>

        {/* Department grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PICKER_DEPTS.map(dept => {
              const active = selected.includes(dept.id)
              const Icon = dept.icon
              return (
                <button key={dept.id} onClick={() => toggle(dept.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(13,148,136,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? 'rgba(13,148,136,0.5)' : '#1F2937'}`,
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: active ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.04)' }}>
                    <Icon size={16} style={{ color: active ? '#0D9488' : '#6B7280' }} />
                  </div>
                  <span className="text-sm font-medium leading-tight" style={{ color: active ? '#F9FAFB' : '#9CA3AF' }}>
                    {dept.label}
                  </span>
                  {active && (
                    <div className="ml-auto shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#0D9488' }}>
                      <Check size={10} color="#fff" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0"
          style={{ borderTop: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#4B5563' }}>
            {selected.length === 0
              ? 'All departments shown at full brightness'
              : `${selected.length} department${selected.length !== 1 ? 's' : ''} selected`}
          </p>
          <button onClick={handleStart} disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: saving ? 0.6 : 1 }}>
            Start exploring <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [company, setCompany]       = useState('Your Company')
  const [userName, setUserName]     = useState('')
  const [daysLeft, setDaysLeft]     = useState(14)
  const [showUpgrade, setShowUpgrade] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showInvite, setShowInvite]   = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [focusDepts, setFocusDepts]         = useState<string[]>([])
  const [toast, setToast]                   = useState<string | null>(null)

  useEffect(() => {
    const name      = localStorage.getItem('demo_company_name') || 'Your Company'
    const user      = localStorage.getItem('demo_user_name') || ''
    const created   = localStorage.getItem('demo_created_at')
    const onboarded = localStorage.getItem('demo_onboarded')
    const depts     = JSON.parse(localStorage.getItem('demo_focus_depts') || '[]') as string[]
    setCompany(name); setUserName(user); setFocusDepts(depts)
    if (created) setDaysLeft(Math.max(0, 14 - Math.floor((Date.now() - parseInt(created)) / 86400000)))
    if (!onboarded) setShowOnboarding(true)
  }, [])

  function fireToast() {
    setToast('Demo mode — this would trigger in your live workspace')
    setTimeout(() => setToast(null), 3000)
  }

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: '#F9FAFB', height: '100vh', overflow: 'hidden' }}>

      <Toast message={toast} />
      {showOnboarding && <DeptPickerModal onComplete={(depts) => { setFocusDepts(depts); setShowOnboarding(false) }} />}
      {showInvite && <InviteModal slug={slug} company={company} userName={userName} onClose={() => setShowInvite(false)} />}

      {/* Trial banner */}
      {showUpgrade && (
        <div className="flex items-center justify-between px-4 py-2 text-sm shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          <div className="flex items-center gap-2">
            <Clock size={13} />
            <span className="font-medium">Trial workspace — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
            <span className="hidden sm:inline opacity-75">· Demo data only · Auto-deleted after 14 days</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>Upgrade <ArrowRight size={11} className="inline" /></Link>
            <button onClick={() => setShowUpgrade(false)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 gap-3" style={{ backgroundColor: '#07080F', borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button className="md:hidden p-1.5 rounded-lg" style={{ color: '#9CA3AF' }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{company[0]?.toUpperCase() || 'L'}</div>
            <div className="min-w-0"><div className="text-sm font-bold truncate">{company}</div><div className="text-xs hidden sm:block" style={{ color: '#6B7280' }}>Demo workspace</div></div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowInvite(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151' }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1F2937' }}>
            <UserPlus size={13} /> Invite team
          </button>
          <Link href="/pricing" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold sm:text-sm sm:px-4" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
            <Zap size={12} /><span className="hidden sm:inline">Upgrade to Lumio</span><span className="sm:hidden">Upgrade</span>
          </Link>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeDept={activeDept} onSelect={setActiveDept} open={sidebarOpen} onClose={() => setSidebarOpen(false)} focusDepts={focusDepts} />

        {/* Main scrollable area */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <QuickActionsBar dept={activeDept} onAction={fireToast} />

          <main className="flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold">{deptLabel}</h1>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Demo data for <span style={{ color: '#F9FAFB' }}>{company}</span></p>
              </div>
              {/* Mobile invite */}
              <button className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }} onClick={() => setShowInvite(true)}><UserPlus size={11} /> Invite</button>
            </div>

            {activeDept === 'overview'    && <OverviewView   company={company} />}
            {activeDept === 'insights'   && <InsightsView   company={company} />}
            {activeDept === 'hr'         && <HRView         company={company} />}
            {activeDept === 'accounts'   && <AccountsView   company={company} />}
            {activeDept === 'sales'      && <SalesView      company={company} />}
            {activeDept === 'marketing'  && <MarketingView  company={company} />}
            {activeDept === 'trials'     && <TrialsView     company={company} />}
            {activeDept === 'operations' && <OpsView        company={company} />}
            {activeDept === 'support'    && <SupportView    company={company} />}
            {activeDept === 'success'    && <SuccessView    company={company} />}
            {activeDept === 'it'         && <ITView         company={company} />}
            {activeDept === 'workflows'  && <WorkflowsView  company={company} />}
            {activeDept === 'settings'   && <SettingsView   company={company} />}
          </main>

          {/* Upgrade CTA */}
          <div className="mx-4 sm:mx-5 my-8 rounded-2xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(108,63,197,0.35)' }}>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.25)' }}><Zap size={12} /> Ready to go live?</div>
            <h2 className="text-2xl font-bold mb-2">This is your real dashboard. Without the demo data.</h2>
            <p className="text-sm mb-6 mx-auto max-w-md" style={{ color: '#9CA3AF' }}>Connect your real tools, activate your workflows, and your team starts saving hours from day one.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>See pricing <ArrowRight size={15} /></Link>
              <Link href="/demo" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'transparent', border: '1px solid #1F2937', color: '#9CA3AF' }}>Book a walkthrough</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
