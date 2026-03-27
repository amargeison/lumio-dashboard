'use client'

import React, { useState, useEffect, useRef, useCallback, RefObject } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, TrendingUp, Headphones, GitBranch, AlertCircle,
  CheckCircle2, Loader2, Circle, Clock, ArrowRight,
  Zap, Package, Star, ChevronDown, ChevronUp, BarChart3, Sparkles,
  UserPlus, X, Plus, Send, Play, Check,
  Home, Receipt, Megaphone, FlaskConical, Award, Monitor,
  Settings, Hash, BarChart2, PieChart, Menu, ChevronLeft,
  Calendar, FileText, Target, DollarSign, Volume2, Mic, Handshake, Upload,
  Database, RotateCcw,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { useWakeWord } from '@/hooks/useWakeWord'
import { buildDemoBriefingScript } from '@/lib/buildDemoBriefingScript'
import NewJoinerModal,        { type NewJoinerData }        from '@/components/NewJoinerModal'
import LeaveRequestModal,     { type LeaveRequestData }     from '@/components/LeaveRequestModal'
import OffboardingModal,      { type OffboardingData }      from '@/components/OffboardingModal'
import RecruitmentModal,      { type RecruitmentData }      from '@/components/RecruitmentModal'
import PerformanceReviewModal, { type PerformanceReviewData } from '@/components/PerformanceReviewModal'
import ConvertModal from '@/app/(demo-workspace)/components/ConvertModal'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'

// ─── Types ────────────────────────────────────────────────────────────────────

type WFStatus = 'COMPLETE' | 'RUNNING' | 'ACTION'
type RAG      = 'green' | 'amber' | 'red'
type ChartMode = 'number' | 'bar' | 'pie'
type DeptId   = 'overview' | 'insights' | 'hr' | 'accounts' | 'sales' | 'crm' | 'marketing' | 'trials' | 'operations' | 'support' | 'success' | 'it' | 'workflows' | 'settings' | 'partners' | 'strategy'

interface ChartDatum { label: string; value: number; color: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Overview', 'Insights', 'HR & People', 'Accounts', 'Sales', 'CRM',
  'Marketing', 'Trials', 'Operations', 'Support',
  'Success', 'IT & Systems', 'Workflows Library',
]

const SIDEBAR_ITEMS: { id: DeptId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',    label: 'Overview',          icon: Home        },
  { id: 'insights',   label: 'Insights',           icon: BarChart3   },
  { id: 'hr',         label: 'HR & People',        icon: Users       },
  { id: 'accounts',   label: 'Accounts',           icon: Receipt     },
  { id: 'sales',      label: 'Sales',              icon: TrendingUp  },
  { id: 'crm',        label: 'CRM',                icon: Database    },
  { id: 'marketing',  label: 'Marketing',          icon: Megaphone   },
  { id: 'trials',     label: 'Trials',             icon: FlaskConical},
  { id: 'operations', label: 'Operations',         icon: Package     },
  { id: 'support',    label: 'Support',            icon: Headphones  },
  { id: 'success',    label: 'Success',            icon: Award       },
  { id: 'it',         label: 'IT & Systems',       icon: Monitor     },
  { id: 'workflows',  label: 'Workflows Library',  icon: GitBranch   },
  { id: 'partners',   label: 'Partners',           icon: Handshake   },
  { id: 'strategy',   label: 'Strategy',           icon: Target      },
  { id: 'settings',   label: 'Settings',           icon: Settings    },
]

const DEPT_ACTIONS: Record<DeptId, { label: string; tooltip: string; icon: React.ElementType }[]> = {
  overview:   [
    { label: 'New Joiner',        tooltip: 'Trigger the HR onboarding workflow for a new team member',     icon: UserPlus    },
    { label: 'New Customer',      tooltip: 'Create a customer record and start the welcome sequence',      icon: Users       },
    { label: 'New Trial',         tooltip: 'Provision a new 14-day demo workspace',                       icon: FlaskConical },
    { label: 'Chase Invoice',     tooltip: 'Send a payment reminder for all overdue invoices',             icon: Receipt     },
    { label: 'Support Ticket',    tooltip: 'Open a new support ticket and assign it to the queue',         icon: Headphones  },
    { label: 'Create Wiki',       tooltip: 'Create a new internal wiki page or knowledge base article',    icon: FileText    },
    { label: 'Team Events',       tooltip: 'Schedule a team event or all-hands meeting',                   icon: Calendar    },
    { label: 'Competitor Watch',  tooltip: 'Log a competitor update and notify the strategy team',         icon: BarChart3   },
  ],
  insights:   [
    { label: 'Export Report',    tooltip: 'Download the current view as a PDF or CSV',                     icon: FileText  },
    { label: 'Schedule Report',  tooltip: 'Set up a recurring email report to stakeholders',               icon: Calendar  },
    { label: 'Set Alert',        tooltip: 'Create a metric alert — notify when a threshold is hit',        icon: AlertCircle },
    { label: 'Share Dashboard',  tooltip: 'Generate a shareable link to this dashboard view',              icon: Users     },
    { label: 'Dept Insights',    tooltip: 'View AI-generated insights for Insights',                       icon: BarChart3 },
  ],
  hr:         [
    { label: 'New Joiner',         tooltip: 'Trigger the full onboarding workflow for a new hire',         icon: UserPlus  },
    { label: 'Leave Request',      tooltip: 'Submit or approve a leave request for a team member',         icon: Calendar  },
    { label: 'Send Contract',      tooltip: 'Generate and send an employment contract via DocuSign',        icon: FileText  },
    { label: 'Performance Review', tooltip: 'Initiate a performance review cycle for selected employees',  icon: Star      },
    { label: 'Update Org Chart',   tooltip: 'Sync the org chart with the latest team structure',           icon: GitBranch },
    { label: 'Recruitment',        tooltip: 'Post a new role and trigger the recruitment workflow',         icon: Users     },
    { label: 'Company Events',     tooltip: 'Plan and notify team of an upcoming company event',           icon: Megaphone },
    { label: 'Dept Insights',      tooltip: 'View AI-generated insights for HR & People',                  icon: BarChart3 },
  ],
  accounts:   [
    { label: 'Chase Invoice',   tooltip: 'Send payment reminders for all overdue invoices',                icon: Receipt   },
    { label: 'New Invoice',     tooltip: 'Create and send a new invoice to a customer',                    icon: DollarSign},
    { label: 'Credit Note',     tooltip: 'Issue a credit note against an existing invoice',                icon: FileText  },
    { label: 'Expense Report',  tooltip: 'Submit or approve an expense report',                            icon: BarChart2 },
    { label: 'Bank Reconcile',  tooltip: 'Trigger the automated bank reconciliation workflow',             icon: CheckCircle2 },
    { label: 'Dept Insights',   tooltip: 'View AI-generated insights for Accounts',                       icon: BarChart3 },
  ],
  sales:      [
    { label: 'New Deal',       tooltip: 'Add a new deal and start the qualification workflow',             icon: TrendingUp},
    { label: 'Book Demo',      tooltip: 'Send a Calendly invite for a product demo',                      icon: Calendar  },
    { label: 'Send Proposal',  tooltip: 'Generate a proposal from a template and send to a prospect',     icon: Send      },
    { label: 'Log Call',       tooltip: 'Log a call with a prospect or lead',                             icon: FileText  },
    { label: 'New Lead',       tooltip: 'Add a new lead and start the qualification workflow',             icon: UserPlus  },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Sales',                           icon: BarChart3 },
  ],
  crm:        [
    { label: 'Log Call',       tooltip: 'Log a call against a customer account',                          icon: FileText  },
    { label: 'Health Check',   tooltip: 'Run an account health check and update the RAG score',           icon: Star      },
    { label: 'Chase Renewal',  tooltip: 'Send a renewal reminder to an account',                          icon: RotateCcw },
    { label: 'Send NPS',       tooltip: 'Send an NPS survey to selected customers',                       icon: Send      },
    { label: 'Account Review', tooltip: 'Schedule an account review meeting',                             icon: Calendar  },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for CRM',                             icon: BarChart3 },
  ],
  marketing:  [
    { label: 'New Campaign',   tooltip: 'Create a multi-step email or ad campaign',                        icon: Megaphone },
    { label: 'Schedule Post',  tooltip: 'Queue a social post across LinkedIn, Twitter, and Instagram',     icon: Calendar  },
    { label: 'A/B Test',       tooltip: 'Set up an A/B test on email subject lines or ad copy',            icon: BarChart2 },
    { label: 'Email Blast',    tooltip: 'Send a one-off broadcast to a selected audience segment',         icon: Send      },
    { label: 'UTM Builder',    tooltip: 'Generate tracked UTM links for your latest campaign',             icon: Target    },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Marketing',                       icon: BarChart3 },
  ],
  trials:     [
    { label: 'New Trial',      tooltip: 'Provision a new 14-day trial workspace for a prospect',          icon: FlaskConical },
    { label: 'Send Demo',      tooltip: 'Send a personalised demo link to a lead',                        icon: Play      },
    { label: 'Extend Trial',   tooltip: 'Add 7 more days to an active trial workspace',                   icon: Clock     },
    { label: 'Convert to Paid',tooltip: 'Trigger the upgrade workflow and remove trial restrictions',      icon: DollarSign},
    { label: 'Offboard Trial', tooltip: 'Safely expire and delete a trial workspace and all its data',    icon: X         },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Trials',                          icon: BarChart3 },
  ],
  operations: [
    { label: 'New PO',         tooltip: 'Raise a new purchase order and send to a supplier',              icon: Package   },
    { label: 'Update Stock',   tooltip: 'Sync inventory levels from your warehouse system',               icon: BarChart3 },
    { label: 'Process Order',  tooltip: 'Trigger the order fulfilment and dispatch workflow',              icon: ArrowRight},
    { label: 'Supplier Invoice',tooltip: 'Log and approve an incoming supplier invoice',                  icon: Receipt   },
    { label: 'Stock Alert',    tooltip: 'Send a low-stock notification to the procurement team',          icon: AlertCircle },
    { label: 'Create Wiki',    tooltip: 'Start a new internal wiki page for your team',                   icon: FileText  },
    { label: 'Create FAQ',     tooltip: 'Build a new FAQ document for staff or customers',                icon: Hash      },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Operations',                      icon: BarChart3 },
  ],
  support:    [
    { label: 'New Ticket',     tooltip: 'Open a new support ticket and assign it to the queue',           icon: Plus      },
    { label: 'Escalate',       tooltip: 'Escalate a ticket to P1 and notify the on-call engineer',        icon: AlertCircle },
    { label: 'Close Ticket',   tooltip: 'Mark a resolved ticket as closed and trigger CSAT survey',       icon: CheckCircle2 },
    { label: 'SLA Report',     tooltip: 'Generate this week\'s SLA compliance report',                    icon: FileText  },
    { label: 'Knowledge Article', tooltip: 'Create a new article in the support knowledge base',          icon: FileText  },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Support',                         icon: BarChart3 },
  ],
  success:    [
    { label: 'Health Check',   tooltip: 'Run the automated health score calculation for all accounts',    icon: Star      },
    { label: 'QBR Deck',       tooltip: 'Generate a Quarterly Business Review deck for a customer',       icon: FileText  },
    { label: 'Renewal Alert',  tooltip: 'Send a renewal reminder to accounts expiring in 60 days',        icon: AlertCircle },
    { label: 'Expansion Proposal', tooltip: 'Create an upsell proposal based on usage data',             icon: TrendingUp},
    { label: 'NPS Survey',     tooltip: 'Send an NPS survey to a selected cohort of customers',           icon: Send      },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Customer Success',                icon: BarChart3 },
  ],
  it:         [
    { label: 'New Device',     tooltip: 'Start the device provisioning workflow for a new hire',          icon: Monitor   },
    { label: 'Software Request',tooltip: 'Raise a software licence request for approval',                 icon: Package   },
    { label: 'Access Review',  tooltip: 'Trigger a quarterly access and permission audit',                icon: CheckCircle2 },
    { label: 'Security Alert', tooltip: 'Log a security incident and notify the security team',           icon: AlertCircle },
    { label: 'System Update',  tooltip: 'Schedule and push a system update to managed devices',           icon: ArrowRight},
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for IT & Systems',                    icon: BarChart3 },
  ],
  workflows:  [
    { label: 'New Workflow',   tooltip: 'Start building a new automation workflow from a template',       icon: Plus      },
    { label: 'Import',         tooltip: 'Import a workflow from a JSON file or another workspace',        icon: FileText  },
    { label: 'Test Run',       tooltip: 'Run a selected workflow against test data',                      icon: Play      },
    { label: 'Schedule',       tooltip: 'Set or update the schedule for a workflow trigger',              icon: Calendar  },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Workflows Library',               icon: BarChart3 },
  ],
  settings:   [],
  partners:   [
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Partners',                        icon: BarChart3 },
  ],
  strategy:   [
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Strategy',                        icon: BarChart3 },
  ],
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
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

function Sidebar({ activeDept, onSelect, open, onClose, focusDepts, navRef, companyName, companyLogo }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void
  focusDepts: string[]
  navRef?: RefObject<HTMLElement | null>
  companyName?: string
  companyLogo?: string
}) {
  const isDimmed = (id: string) => focusDepts.length > 0 && !focusDepts.includes(id)

  const inner = (
    <nav ref={navRef} className="flex flex-col gap-0.5 p-3">
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
        <div className="flex items-center gap-2.5 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {companyLogo ? (
            <img src={companyLogo} alt={companyName || 'Company'} style={{ maxWidth: 120, maxHeight: 40, objectFit: 'contain' }} className="rounded-md" />
          ) : (
            <div className="flex items-center justify-center rounded-lg text-xs font-bold"
              style={{ width: 36, height: 36, backgroundColor: '#6C3FC5', color: '#F9FAFB', flexShrink: 0 }}>
              {(companyName || 'LC').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          {companyName && <span className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{companyName}</span>}
        </div>
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

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The harder I work, the luckier I get.", author: "Samuel Goldwyn" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "The only limit to our realisation of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "I never dreamed about success. I worked for it.", author: "Estée Lauder" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or think you can't, you're right.", author: "Henry Ford" },
  { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "The best teachers are those who show you where to look but don't tell you what to see.", author: "Alexandra K. Trenfor" },
]

function getRandomQuote() {
  const usedRaw = localStorage.getItem('lumio_used_quotes')
  let used: number[] = usedRaw ? JSON.parse(usedRaw) : []
  if (used.length >= QUOTES.length) used = []
  const available = QUOTES.map((_, i) => i).filter(i => !used.includes(i))
  const idx = available[Math.floor(Math.random() * available.length)]
  used.push(idx)
  localStorage.setItem('lumio_used_quotes', JSON.stringify(used))
  return QUOTES[idx]
}

// ─── Voice Input ──────────────────────────────────────────────────────────────

type VoiceResult = { response: string; actions: { label: string; requiresIntegration?: boolean; integrationNote?: string }[] }

function VoiceInput({ dept, company, onResult, onLoading, onError }: {
  dept: string
  company: string
  onResult: (r: VoiceResult) => void
  onLoading: () => void
  onError: (e: string) => void
}) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  async function sendToAPI(text: string) {
    onLoading()
    try {
      const res = await fetch('/api/demo/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, dept, company }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      onResult(data)
    } catch {
      onError('Something went wrong. Please try again.')
    }
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { onError('Speech recognition is not supported in this browser. Try Chrome.'); return }
    const recognition = new SR()
    recognition.lang = 'en-GB'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setListening(true)
    setTranscript('')
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      setListening(false)
      sendToAPI(text)
    }
    recognition.onerror = () => { setListening(false); onError('Could not hear you. Please try again.') }
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <button
        onClick={startListening}
        disabled={listening}
        className="flex items-center justify-center w-20 h-20 rounded-full transition-all"
        style={{ backgroundColor: listening ? 'rgba(108,63,197,0.3)' : 'rgba(108,63,197,0.15)', border: `2px solid ${listening ? '#A78BFA' : 'rgba(108,63,197,0.4)'}` }}>
        <Mic size={32} style={{ color: listening ? '#A78BFA' : '#6C3FC5' }} />
      </button>
      <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
        {listening ? '🎙 Listening...' : 'Tap the mic and speak your command'}
      </p>
      {transcript && <p className="text-xs text-center px-2" style={{ color: '#6B7280' }}>&ldquo;{transcript}&rdquo;</p>}
      <div className="text-xs text-center space-y-1" style={{ color: '#4B5563' }}>
        <p>Try: <span style={{ color: '#9CA3AF' }}>&ldquo;Cancel my 11am meeting&rdquo;</span></p>
        <p>Or: <span style={{ color: '#9CA3AF' }}>&ldquo;Email the team about the 2pm catch-up&rdquo;</span></p>
      </div>
    </div>
  )
}

function DemoPersonalBanner({ company, firstName, dept = 'overview', onToast, wakeWordEnabled = true }: { company: string; firstName?: string; dept?: string; onToast?: (msg: string) => void; wakeWordEnabled?: boolean }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const bg = BG_GRADIENTS[new Date().getDay()]
  const { speak, stop, isPlaying } = useSpeech()
  const [quote] = useState(() => { try { return getRandomQuote() } catch { return QUOTES[0] } })
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [voiceLoading, setVoiceLoading]     = useState(false)
  const [voiceError, setVoiceError]         = useState('')
  const [voiceResult, setVoiceResult]       = useState<{ response: string; actions: { label: string; requiresIntegration?: boolean; integrationNote?: string }[] } | null>(null)
  const [wakeFlash, setWakeFlash]           = useState(false)

  const openVoiceModal = useCallback(() => {
    setVoiceResult(null)
    setVoiceError('')
    setWakeFlash(true)
    setTimeout(() => setWakeFlash(false), 600)
    setShowVoiceModal(true)
  }, [])

  // Always-on wake word listener — pauses while voice modal is open or disabled in settings
  const wakeActive = wakeWordEnabled && !showVoiceModal
  useWakeWord(openVoiceModal, wakeActive)

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    const script = buildDemoBriefingScript({
      companyName: company,
      meetings: DEMO_MEETINGS as unknown as { title: string; time: string; status: string }[],
      emailCount: 12,
      urgentCount: 2,
      workflowActionCount: 3,
    })
    speak(script)
  }

  return (
    <>
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-xl`}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl" />
      <div className="absolute right-40 bottom-0 w-40 h-40 bg-teal-500 rounded-full opacity-10 blur-2xl" />

      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* LEFT: greeting */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {greeting}, {firstName || 'there'} 👋
              </h1>

              {/* Speaker 1: Active TTS */}
              <button
                onClick={handleBriefing}
                title="Text-to-Speech — Lumio will read your morning headlines, meetings today and urgent items aloud"
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  backgroundColor: isPlaying ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)',
                  border: isPlaying ? '1px solid rgba(13,148,136,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  color: isPlaying ? '#2DD4BF' : '#9CA3AF',
                  animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
              >
                <Volume2 size={15} strokeWidth={1.75} />
              </button>

              {/* Mic: Voice Commands */}
              <button
                onClick={openVoiceModal}
                className="flex items-center justify-center rounded-lg transition-all"
                title="Voice Commands — say 'Hi Lumio' or tap the mic"
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  backgroundColor: wakeFlash ? 'rgba(108,63,197,0.5)' : 'rgba(108,63,197,0.2)',
                  border: `1px solid ${wakeFlash ? '#A78BFA' : 'rgba(108,63,197,0.4)'}`,
                  color: '#A78BFA',
                  transition: 'background-color 0.3s, border-color 0.3s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(108,63,197,0.35)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(108,63,197,0.2)' }}
              >
                <Mic size={15} strokeWidth={1.75} />
              </button>

              {/* Wake word status pill */}
              {wakeWordEnabled && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium select-none"
                  style={{
                    backgroundColor: showVoiceModal ? 'rgba(34,197,94,0.15)' : 'rgba(108,63,197,0.12)',
                    color: showVoiceModal ? '#4ADE80' : '#A78BFA',
                    border: `1px solid ${showVoiceModal ? 'rgba(34,197,94,0.3)' : 'rgba(108,63,197,0.25)'}`,
                  }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: showVoiceModal ? '#4ADE80' : '#A78BFA',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                  {showVoiceModal ? 'Listening\u2026' : 'Wake word active'}
                </span>
              )}
            </div>
            <p className="text-purple-300 text-sm mb-2">{date}</p>
            <p className="text-purple-200/60 text-sm italic">&ldquo;{quote.text}&rdquo; — {quote.author}</p>
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

      {showVoiceModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #6C3FC5, #4F46E5)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Mic size={18} /> Voice Command</h2>
                <button onClick={() => setShowVoiceModal(false)} style={{ color: 'rgba(255,255,255,0.7)' }}><X size={18} /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {voiceLoading && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>Understanding your command...</p>
                </div>
              )}
              {voiceError && <p className="text-sm text-red-400">{voiceError}</p>}
              {voiceResult && !voiceLoading && (
                <>
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#1A1D27' }}>
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>&ldquo;{voiceResult.response}&rdquo;</p>
                  </div>
                  <div className="space-y-2">
                    {voiceResult.actions.map((action, i) => (
                      <div key={i} className="rounded-xl p-3 flex items-start justify-between gap-3" style={{ backgroundColor: '#1A1D27', border: '1px solid #1F2937' }}>
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{action.label}</p>
                          {action.requiresIntegration && (
                            <p className="text-xs mt-0.5" style={{ color: '#F59E0B' }}>⚡ Requires {action.integrationNote}</p>
                          )}
                        </div>
                        <button
                          onClick={() => { onToast?.(`✓ ${action.label}`); setShowVoiceModal(false) }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                          Confirm
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowVoiceModal(false)} className="w-full py-2.5 rounded-xl text-sm" style={{ color: '#6B7280', backgroundColor: '#1A1D27' }}>
                    Cancel
                  </button>
                </>
              )}
              {!voiceLoading && !voiceResult && !voiceError && (
                <VoiceInput
                  dept={dept}
                  company={company}
                  onResult={(result) => { setVoiceResult(result); setVoiceLoading(false) }}
                  onLoading={() => setVoiceLoading(true)}
                  onError={(err) => { setVoiceError(err); setVoiceLoading(false) }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
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

const DEMO_MORNING_HIGHLIGHTS = [
  'You have 3 meetings today — first up: Quarterly Review with your team at 10am',
  '8 emails overnight — 1 marked urgent, re: upcoming contract renewal',
  '2 workflows need your attention — Invoice chase overdue at one account is highest priority',
  'Monthly MRR tracking ahead of target — 12% growth month-on-month',
  'New trial conversion this week — explore the Trials section to see conversion details',
  'Reminder: end-of-month reporting due Friday — check the Accounts section for latest figures',
]

function DemoMorningAIPanel() {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayLabel = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #6C3FC5' }}>
      <button
        className="flex w-full items-center justify-between px-5 py-4"
        style={{ backgroundColor: 'rgba(108,63,197,0.08)', borderBottom: open ? '1px solid rgba(108,63,197,0.3)' : undefined }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Morning Summary</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{dayLabel}</span>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: '#6C3FC5' }} />
          : <ChevronDown size={14} style={{ color: '#6C3FC5' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ backgroundColor: '#0f0e17', maxHeight: '12rem' }}>
          {DEMO_MORNING_HIGHLIGHTS.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#C4B5FD' }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OverviewView({ company, firstName, bannerRef, statsRef, actionsRef, onAction, wakeWordEnabled }: {
  company: string
  firstName?: string
  bannerRef?: RefObject<HTMLDivElement | null>
  statsRef?: RefObject<HTMLDivElement | null>
  actionsRef?: RefObject<HTMLDivElement | null>
  onAction?: (label: string) => void
  wakeWordEnabled?: boolean
}) {
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
      {/* 1. Banner */}
      <div ref={bannerRef}><DemoPersonalBanner company={company} firstName={firstName} wakeWordEnabled={wakeWordEnabled} /></div>

      {/* 2. Morning Roundup — full width, below banner */}
      <DemoMorningRoundup />

      {/* 3. Tab bar */}
      <DemoTabBar tab={tab} onChange={setTab} />

      {tab === 'today' ? (
        <div className="space-y-4">
          {/* 4. Quick Actions — above the main grid */}
          <div ref={actionsRef}><QuickActionsBar dept="overview" onAction={onAction ?? (() => {})} /></div>

          {/* 5. Three-col grid: left (meetings + stats) / right (AI panel) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT — col-span-2 */}
            <div className="lg:col-span-2 space-y-4">
              <DemoMeetingsToday />
              <div ref={statsRef} className="grid grid-cols-2 xl:grid-cols-4 gap-3">
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
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
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
            </div>

            {/* RIGHT — AI Morning Summary */}
            <div className="lg:col-span-1">
              <DemoMorningAIPanel />
            </div>
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

interface ParsedStat { label: string; value: string }

function parseCSV(text: string): ParsedStat[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  const results: ParsedStat[] = []
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''))
    if (parts.length >= 2 && parts[0] && parts[1]) {
      results.push({ label: parts[0], value: parts[1] })
    }
  }
  return results.slice(0, 8) // max 8 extracted stats
}

function InsightsView({ company }: { company: string }) {
  const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'loaded'>('idle')
  const [fileName, setFileName]       = useState('')
  const [parsed, setParsed]           = useState<ParsedStat[]>([])
  const [dragging, setDragging]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function processFile(file: File) {
    setFileName(file.name)
    setUploadState('processing')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string ?? ''
      const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv'
      const stats: ParsedStat[] = isCSV ? parseCSV(text) : []
      // For non-CSV files we generate demo-style extracted stats
      if (stats.length === 0) {
        setParsed([
          { label: 'Total Records',       value: `${Math.floor(Math.random() * 9000 + 1000)}` },
          { label: 'Active Users',        value: `${Math.floor(Math.random() * 800 + 100)}` },
          { label: 'Avg Score',           value: `${(Math.random() * 30 + 60).toFixed(1)}%` },
          { label: 'Items Processed',     value: `${Math.floor(Math.random() * 5000 + 500)}` },
        ])
      } else {
        setParsed(stats)
      }
      setUploadState('loaded')
    }
    reader.onerror = () => setUploadState('idle')
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) processFile(f)
  }

  const demoContent = (
    <PlaceholderView
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
  )

  return (
    <div className="space-y-4">
      {/* Load your own data */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: uploadState !== 'idle' ? '1px solid #1F2937' : undefined }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Load your own data</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Upload a CSV, XLSX, PDF, or DOCX to replace the demo stats below</p>
          </div>
          {uploadState === 'loaded' && (
            <button onClick={() => { setUploadState('idle'); setParsed([]); setFileName('') }}
              className="text-xs transition-colors"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}>
              Reset to demo data
            </button>
          )}
        </div>

        {uploadState === 'idle' && (
          <div
            className="mx-5 my-4 flex flex-col items-center justify-center gap-2 rounded-xl py-8 cursor-pointer transition-colors"
            style={{ border: `2px dashed ${dragging ? '#6C3FC5' : '#374151'}`, backgroundColor: dragging ? 'rgba(108,63,197,0.06)' : 'transparent' }}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}>
            <Upload size={20} style={{ color: '#6B7280' }} />
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Drag & drop or <span style={{ color: '#A78BFA' }}>browse</span>
            </p>
            <p className="text-xs" style={{ color: '#4B5563' }}>CSV · XLSX · PDF · DOCX</p>
            <input ref={fileRef} type="file" className="hidden"
              accept=".csv,.xlsx,.xls,.pdf,.docx"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
          </div>
        )}

        {uploadState === 'processing' && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 size={16} className="animate-spin" style={{ color: '#6C3FC5' }} />
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Parsing {fileName}…</span>
          </div>
        )}

        {uploadState === 'loaded' && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} style={{ color: '#0D9488' }} />
              <span className="text-xs font-medium" style={{ color: '#0D9488' }}>{fileName}</span>
              <span className="text-xs" style={{ color: '#4B5563' }}>· {parsed.length} metrics extracted</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {parsed.map((s, i) => (
                <div key={i} className="rounded-lg px-3 py-3" style={{ backgroundColor: '#1F2937' }}>
                  <p className="text-xs mb-1 truncate" style={{ color: '#9CA3AF' }}>{s.label}</p>
                  <p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Demo data below — hidden when own data is loaded */}
      {uploadState !== 'loaded' && demoContent}
    </div>
  )
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

function CRMView({ company }: { company: string }) {
  const customers = fakeNum(171, company, 'crmtotal')
  const mrr = fakeNum(28400, company, 'crmrr')
  const nps = fakeNum(67, company, 'crmnps')
  const churnRiskAccounts = [
    { name: fakeCompany(company, 20), reason: 'No login in 42 days',    risk: 91 },
    { name: fakeCompany(company, 21), reason: 'Support tickets × 4',    risk: 78 },
    { name: fakeCompany(company, 22), reason: 'Downgrade request sent', risk: 65 },
  ]
  const renewals = [
    { name: fakeCompany(company, 23), due: 'Apr 12', arr: `£${fakeNum(14800, company, 'ren1').toLocaleString()}`, health: 'Critical' },
    { name: fakeCompany(company, 24), due: 'Apr 18', arr: `£${fakeNum(33400, company, 'ren2').toLocaleString()}`, health: 'At Risk'  },
    { name: fakeCompany(company, 25), due: 'May 2',  arr: `£${fakeNum(76000, company, 'ren3').toLocaleString()}`, health: 'Healthy'  },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Customers" value={String(customers)} icon={Database} color="#0D9488"
          pieData={[{label:'Healthy',value:132,color:'#22C55E'},{label:'At Risk',value:29,color:'#F59E0B'},{label:'Critical',value:10,color:'#EF4444'}]}
          barData={[{label:'Jan',value:155,color:'#0D9488'},{label:'Feb',value:163,color:'#0D9488'},{label:'Mar',value:customers,color:'#0F766E'}]} />
        <StatCard label="MRR" value={`£${mrr.toLocaleString()}`} icon={TrendingUp} color="#6C3FC5"
          pieData={[{label:'Core',value:45,color:'#6C3FC5'},{label:'Pro',value:38,color:'#A78BFA'},{label:'Lite',value:17,color:'#7C3AED'}]}
          barData={[{label:'Jan',value:26000,color:'#6C3FC5'},{label:'Feb',value:27200,color:'#6C3FC5'},{label:'Mar',value:mrr,color:'#7C3AED'}]} />
        <StatCard label="NPS Score" value={String(nps)} icon={Star} color="#F59E0B"
          pieData={[{label:'Promoters',value:nps,color:'#22C55E'},{label:'Passives',value:22,color:'#F59E0B'},{label:'Detractors',value:11,color:'#EF4444'}]}
          barData={[{label:'Q3\'25',value:55,color:'#F59E0B'},{label:'Q4\'25',value:63,color:'#F59E0B'},{label:'Q1\'26',value:nps,color:'#D97706'}]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Churn risk */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Churn Risk Alerts</p></div>
          {churnRiskAccounts.map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < churnRiskAccounts.length - 1 ? '1px solid #1F2937' : undefined }}>
              <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{r.name}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{r.reason}</p>
              </div>
              <span className="text-xs font-bold shrink-0" style={{ color: r.risk >= 80 ? '#EF4444' : '#F59E0B' }}>{r.risk}% risk</span>
            </div>
          ))}
        </div>

        {/* Renewals */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Upcoming Renewals</p></div>
          {renewals.map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < renewals.length - 1 ? '1px solid #1F2937' : undefined }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{r.name}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Due {r.due} · {r.arr} ARR</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: r.health === 'Healthy' ? 'rgba(34,197,94,0.1)' : r.health === 'At Risk' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: r.health === 'Healthy' ? '#22C55E' : r.health === 'At Risk' ? '#F59E0B' : '#EF4444' }}>{r.health}</span>
            </div>
          ))}
        </div>
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

function SettingsView({ company, wakeWordEnabled, onToggleWakeWord }: { company: string; wakeWordEnabled: boolean; onToggleWakeWord: (val: boolean) => void }) {
  const speechSupported = typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
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

      {/* Voice & Accessibility */}
      {speechSupported && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice &amp; Accessibility</p>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Wake word activation</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Say &ldquo;Hi Lumio&rdquo; to activate voice commands hands-free</p>
            </div>
            <div
              className="relative h-5 w-9 rounded-full cursor-pointer transition-colors"
              style={{ backgroundColor: wakeWordEnabled ? '#6C3FC5' : '#1F2937' }}
              onClick={() => onToggleWakeWord(!wakeWordEnabled)}
            >
              <div
                className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
                style={{ backgroundColor: '#F9FAFB', transform: wakeWordEnabled ? 'translateX(16px)' : 'translateX(2px)' }}
              />
            </div>
          </div>
        </div>
      )}

      <p className="text-xs" style={{ color: '#4B5563' }}>Settings are read-only in demo mode. Connect your live workspace to configure.</p>
    </div>
  )
}

function PartnersView({ company }: { company: string }) {
  const partners = [
    { initials: 'DFE', name: 'Department for Education', type: 'Government', status: 'Active', contact: 'Sarah Mitchell', color: '#003078' },
    { initials: 'RGR', name: 'Really Great Reading',     type: 'Academic',   status: 'Pending', contact: 'James Halford', color: '#374151' },
    { initials: 'PRS', name: 'Pearson',                  type: 'Distribution', status: 'Pending', contact: 'Clare Nguyen', color: '#374151' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Partners</h2>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Key partnerships for {company}</p>
        </div>
      </div>
      {partners.map(p => (
        <div key={p.name} className="flex items-center justify-between rounded-xl px-5 py-4"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold"
              style={{ backgroundColor: p.color, color: '#fff' }}>{p.initials}</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{p.type} · {p.contact}</p>
            </div>
          </div>
          <span className="rounded-md px-2.5 py-1 text-xs font-semibold"
            style={{
              backgroundColor: p.status === 'Active' ? 'rgba(13,148,136,0.12)' : 'rgba(245,158,11,0.12)',
              color: p.status === 'Active' ? '#0D9488' : '#F59E0B',
            }}>{p.status}</span>
        </div>
      ))}
      <p className="text-xs text-center pt-2" style={{ color: '#4B5563' }}>
        Partner data is read-only in demo mode. Upgrade to manage live partner records.
      </p>
    </div>
  )
}

function StrategyView({ company }: { company: string }) {
  const rows = [
    { feature: 'All-in-one platform',          lumio: '✅', hubspot: '✅', pipedrive: '⚠️', monday: '✅' },
    { feature: 'Built-in workflow automation', lumio: '✅', hubspot: '⚠️', pipedrive: '❌', monday: '⚠️' },
    { feature: 'CRM & Sales pipeline',         lumio: '✅', hubspot: '✅', pipedrive: '✅', monday: '✅' },
    { feature: 'HR & People management',       lumio: '✅', hubspot: '❌', pipedrive: '❌', monday: '⚠️' },
    { feature: 'SMB pricing (<£200/mo)',        lumio: '✅', hubspot: '❌', pipedrive: '✅', monday: '⚠️' },
    { feature: 'Setup in under 30 min',        lumio: '✅', hubspot: '❌', pipedrive: '⚠️', monday: '⚠️' },
  ]
  const competitors = [
    { name: 'HubSpot',    emoji: '🟠', threat: 92, overlap: 78, summary: 'Raised Professional tier 18% in March 2026. Targeting SMBs with a new growth hire.' },
    { name: 'Pipedrive',  emoji: '🟢', threat: 64, overlap: 61, summary: 'Campaigns module now GA. Published a Zendesk migration guide targeting SMB switchers.' },
    { name: 'monday.com', emoji: '🔴', threat: 71, overlap: 54, summary: 'Raised $400M, hiring 3 ML engineers for NLP automation. Long-term threat.' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Strategy — Competitor Watch</h2>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Demo competitive intelligence for {company}</p>
      </div>

      {/* Product Comparison */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Product Comparison</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest w-44" style={{ color: '#4B5563' }}>Feature</th>
                {[['Lumio','#0D9488'],['HubSpot','#F97316'],['Pipedrive','#22C55E'],['monday.com','#EF4444']].map(([n,c]) => (
                  <th key={n} className="px-4 py-3 text-xs font-semibold text-center" style={{ color: c }}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.feature} style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{row.feature}</td>
                  <td className="px-4 py-3 text-center text-sm">{row.lumio}</td>
                  <td className="px-4 py-3 text-center text-sm">{row.hubspot}</td>
                  <td className="px-4 py-3 text-center text-sm">{row.pipedrive}</td>
                  <td className="px-4 py-3 text-center text-sm">{row.monday}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competitor cards */}
      {competitors.map(c => (
        <div key={c.name} className="flex items-start gap-4 rounded-xl px-5 py-4"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <span className="text-2xl">{c.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{c.name}</p>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                Threat {c.threat}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{c.summary}</p>
          </div>
        </div>
      ))}
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

// ─── Department Insights Modal ────────────────────────────────────────────────

const DEPT_INSIGHTS: Record<DeptId, { metric: string; value: string; trend: string; insight: string }[]> = {
  overview:   [
    { metric: 'Workflow efficiency',  value: '94%',    trend: '+3%',  insight: 'Automation rate has improved over the last 30 days. New Joiner and Invoice Chase workflows are performing above baseline.' },
    { metric: 'Active automations',   value: '47',     trend: '+5',   insight: 'Five new workflows activated this month. Support and HR departments showing highest adoption.' },
    { metric: 'Time saved (est.)',    value: '182 hrs', trend: '+22h', insight: 'Based on average manual task time. Invoice chasing and onboarding save the most time per run.' },
  ],
  insights:   [
    { metric: 'Report accuracy',      value: '99.2%',  trend: '—',    insight: 'Data pipelines are healthy. No anomalies detected in the last 7 days.' },
    { metric: 'Dashboards active',    value: '12',     trend: '+2',   insight: 'Two new dashboards created this month by the Finance and Operations teams.' },
    { metric: 'Alerts triggered',     value: '4',      trend: '-1',   insight: 'One fewer alert than last month. Overdue invoice threshold was adjusted.' },
  ],
  hr:         [
    { metric: 'Onboarding time',      value: '4 hrs',  trend: '-6h',  insight: 'Automated provisioning cut average onboarding from 10 hours to 4. IT and payroll steps are now fully automated.' },
    { metric: 'Leave approval speed', value: '2.1 hrs', trend: '-1h', insight: 'Manager response rate improved after Slack notifications were added to the workflow.' },
    { metric: 'Compliance rate',      value: '100%',   trend: '—',    insight: 'All contracts and GDPR notices sent within policy SLA. No exceptions this quarter.' },
  ],
  accounts:   [
    { metric: 'Avg debtor days',      value: '22d',    trend: '-8d',  insight: 'Invoice chasing workflow reduced average collection time significantly. Day-30 escalations down 40%.' },
    { metric: 'Overdue invoices',     value: '3',      trend: '-11',  insight: 'Automated chase emails resolved most overdue accounts. Only 3 remain, all in manual escalation.' },
    { metric: 'Reconciliation time',  value: '15 min', trend: '-45m', insight: 'Bank reconciliation now automated on Monday mornings, replacing a weekly manual task.' },
  ],
  sales:      [
    { metric: 'Lead response time',   value: '4 min',  trend: '-52m', insight: 'Hot lead routing to senior reps now averages under 5 minutes. Pipeline growth rate up 18%.' },
    { metric: 'Proposal turnaround',  value: '23 min', trend: '-2h',  insight: 'Claude-generated proposals cut drafting time from hours to minutes. Win rate unchanged.' },
    { metric: 'Pipeline accuracy',    value: '91%',    trend: '+4%',  insight: 'Automated stage updates reduced human error in deal tracking. Deal value forecast improved.' },
  ],
  crm:        [
    { metric: 'Churn rate',           value: '2.1%',   trend: '-0.2%',insight: 'Below 3% target for the fourth consecutive month. Proactive health checks catching at-risk accounts earlier.' },
    { metric: 'NPS score',            value: '67',     trend: '+4',   insight: 'Three new positive reviews added this month. Onboarding improvements driving higher early satisfaction.' },
    { metric: 'Renewal conversion',   value: '94%',    trend: '+3%',  insight: '90-day renewal sequences reducing last-minute churn. Two enterprise accounts renewed early after check-ins.' },
  ],
  marketing:  [
    { metric: 'MQL response time',    value: '18 min', trend: '-4h',  insight: 'Marketing-to-sales handoff automation firing correctly on 97% of qualifying leads.' },
    { metric: 'Campaign open rate',   value: '31%',    trend: '+6%',  insight: 'Claude-personalised email sequences outperforming templates. Subject line A/B tests showing strong results.' },
    { metric: 'Content published',    value: '24',     trend: '+8',   insight: 'Scheduling automation enabled 33% more posts this month without additional headcount.' },
  ],
  trials:     [
    { metric: 'Trial activation time', value: '8s',   trend: '-52s',  insight: 'Workspace provisioning now fully automated. Prospects access their environment in under 10 seconds.' },
    { metric: 'Day-7 engagement',     value: '68%',   trend: '+12%',  insight: 'Check-in email sequence improved engagement rate. Personalised content showing 2x better CTR.' },
    { metric: 'Trial-to-paid rate',   value: '34%',   trend: '+5%',   insight: 'Conversion sequence improved. Early intervention for low-engagement trials increased conversions.' },
  ],
  operations: [
    { metric: 'PO processing time',   value: '6 min', trend: '-34m',  insight: 'Automated PO generation from stock alerts eliminated most manual purchase requests.' },
    { metric: 'Stock-out incidents',  value: '0',     trend: '-3',    insight: 'Reorder point alerts firing correctly. Three near-misses caught by automation last month.' },
    { metric: 'Supplier compliance',  value: '96%',   trend: '+2%',   insight: 'Automated invoice matching flagging discrepancies before approval. Dispute rate down.' },
  ],
  support:    [
    { metric: 'First response time',  value: '58s',   trend: '-3m',   insight: 'Triage automation routes tickets instantly. P1 tickets acknowledged in under 30 seconds.' },
    { metric: 'Auto-resolved rate',   value: '42%',   trend: '+7%',   insight: 'Knowledge base matching improving. AI auto-replies now handling 42% of routine tickets.' },
    { metric: 'SLA compliance',       value: '98.4%', trend: '+1.2%', insight: 'Escalation alerts firing earlier in the SLA window. Near-breach rate reduced significantly.' },
  ],
  success:    [
    { metric: 'At-risk accounts',     value: '4',     trend: '-7',    insight: 'RAG scoring caught 11 accounts trending red last month. 7 recovered after CS intervention.' },
    { metric: 'NPS score',            value: '61',    trend: '+8',    insight: 'Improved onboarding and proactive check-ins driving higher satisfaction scores.' },
    { metric: 'Renewal rate',         value: '94%',   trend: '+3%',   insight: '90-day renewal sequences reducing last-minute churn. Two enterprise renewals won back.' },
  ],
  it:         [
    { metric: 'Provisioning time',    value: '2 min', trend: '-43m',  insight: 'Account and access provisioning fully automated on new hire confirmation. Zero IT tickets for standard setups.' },
    { metric: 'Stale access items',   value: '0',     trend: '-14',   insight: 'Quarterly access review automation cleared 14 legacy permissions. Compliance audit passed.' },
    { metric: 'Security incidents',   value: '0',     trend: '—',     insight: 'No security incidents this quarter. Automated alerting and access reviews maintaining clean posture.' },
  ],
  workflows:  [
    { metric: 'Active workflows',     value: '47',    trend: '+5',    insight: 'Five new workflows activated this month. HR and Sales showing highest new adoption.' },
    { metric: 'Avg run time',         value: '1.2s',  trend: '-0.3s', insight: 'Performance optimisation pass completed. Slowest workflows were batch email sequences.' },
    { metric: 'Error rate',           value: '0.4%',  trend: '-0.2%', insight: 'Most errors from third-party API timeouts, not logic failures. Retry logic now handles these.' },
  ],
  settings:   [],
  partners:   [
    { metric: 'Active integrations',  value: '3',     trend: '+1',    insight: 'New partner integration activated this quarter. Data pipelines healthy across all active connections.' },
  ],
  strategy:   [
    { metric: 'Competitor signals',   value: '14',    trend: '+3',    insight: 'Three new signals detected this week. HubSpot pricing change and monday.com hiring activity flagged as high priority.' },
    { metric: 'Threat score avg',     value: '6.2',   trend: '+0.4',  insight: 'Slight increase in aggregate threat score. Monitor HubSpot SMB push closely over next 30 days.' },
  ],
}

function DeptInsightsModal({ dept, onClose }: { dept: DeptId; onClose: () => void }) {
  const label = SIDEBAR_ITEMS.find(s => s.id === dept)?.label ?? dept
  const items = DEPT_INSIGHTS[dept] ?? []
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} style={{ color: '#A78BFA' }} />
              <h2 className="text-base font-bold" style={{ color: '#F9FAFB' }}>Department Insights</h2>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{label} · AI-generated summary</p>
          </div>
          <button onClick={onClose} style={{ color: '#6B7280' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#6B7280' }}>No insights available for this department yet.</p>
          ) : items.map((item, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{item.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black" style={{ color: '#F9FAFB' }}>{item.value}</span>
                  {item.trend !== '—' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: item.trend.startsWith('-') ? 'rgba(34,197,94,0.1)' : 'rgba(13,148,136,0.1)', color: item.trend.startsWith('-') ? '#22C55E' : '#0D9488' }}>
                      {item.trend}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{item.insight}</p>
            </div>
          ))}
          <p className="text-xs text-center pt-2" style={{ color: '#4B5563' }}>
            Demo data only — connect your real tools to see live insights.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── CoachMarks ───────────────────────────────────────────────────────────────

const COACH_STEPS = [
  { key: 'banner',  title: 'Your command centre',    desc: 'This banner updates daily with your meetings, stats, and a morning roundup of everything that needs your attention.' },
  { key: 'nav',     title: 'Department navigation',  desc: 'Switch between departments you selected during setup. Dimmed items are outside your focus — click any to explore.' },
  { key: 'actions', title: 'Quick actions',          desc: 'Trigger workflows, send reports, or take action without leaving the page. These adapt to whichever department you\'re viewing.' },
  { key: 'stats',   title: 'Live stats at a glance', desc: 'Key metrics for your workspace — customers, revenue, workflow runs, and more. All powered by your connected tools.' },
] as const

interface CoachMarksProps {
  bannerRef:  RefObject<HTMLDivElement | null>
  navRef:     RefObject<HTMLElement | null>
  actionsRef: RefObject<HTMLDivElement | null>
  statsRef:   RefObject<HTMLDivElement | null>
  onComplete: () => void
}

function CoachMarks({ bannerRef, navRef, actionsRef, statsRef, onComplete }: CoachMarksProps) {
  const [step, setStep] = useState(0)
  const [rect, setRect]  = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const isDone = step >= COACH_STEPS.length

  const refs = [bannerRef, navRef, actionsRef, statsRef] as RefObject<HTMLElement | null>[]

  useEffect(() => {
    if (isDone) return
    const el = refs[step]?.current
    if (!el) { setRect(null); return }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    const measure = () => {
      const r = el.getBoundingClientRect()
      const pad = 8
      setRect({ x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 })
    }
    measure()
    const id = setTimeout(measure, 350)
    return () => clearTimeout(id)
  }, [step, isDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const advance = () => setStep(s => s + 1)

  const tipBelow = rect ? rect.y + rect.h + 180 < window.innerHeight : true
  const tipTop   = rect ? (tipBelow ? rect.y + rect.h + 16 : rect.y - 196) : window.innerHeight / 2 - 96

  return (
    <div className="fixed inset-0 z-50">
      {!isDone ? (
        <>
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <mask id="coach-mask">
                <rect width="100%" height="100%" fill="white" />
                {rect && <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="12" fill="black" />}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" mask="url(#coach-mask)" />
            {rect && <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx="12" fill="none" stroke="#7C3AED" strokeWidth="2" strokeDasharray="6 3" />}
          </svg>

          {/* Dismiss on backdrop click */}
          <div className="absolute inset-0" onClick={advance} style={{ pointerEvents: 'all' }} />

          {/* Tooltip card */}
          <div className="absolute left-1/2 -translate-x-1/2 w-80 rounded-2xl p-5 shadow-2xl"
            style={{ top: Math.max(8, tipTop), backgroundColor: '#111318', border: '1px solid rgba(124,58,237,0.45)', zIndex: 1, pointerEvents: 'all' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: '#A78BFA' }}>Step {step + 1} of {COACH_STEPS.length}</span>
              <button onClick={onComplete} className="text-xs hover:opacity-80" style={{ color: '#6B7280' }}>Skip tour</button>
            </div>
            <h3 className="text-base font-bold mb-1.5">{COACH_STEPS[step].title}</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#9CA3AF' }}>{COACH_STEPS[step].desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {COACH_STEPS.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: i === step ? '#7C3AED' : '#374151' }} />
                ))}
              </div>
              <button onClick={advance}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#7C3AED', color: '#F9FAFB' }}>
                {step === COACH_STEPS.length - 1 ? 'Finish' : 'Next →'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.82)' }}>
          <div className="w-80 rounded-2xl p-8 text-center shadow-2xl"
            style={{ backgroundColor: '#111318', border: '1px solid rgba(124,58,237,0.45)' }}>
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold mb-2">You&apos;re all set!</h3>
            <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Start exploring your demo workspace. Everything is ready to go.</p>
            <button onClick={onComplete}
              className="w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#7C3AED', color: '#F9FAFB' }}>
              Let&apos;s go →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router   = useRouter()

  const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true'

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [company, setCompany]       = useState('Your Company')
  const [userName, setUserName]     = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [daysLeft, setDaysLeft]     = useState(14)
  const [showUpgrade, setShowUpgrade] = useState(true)
  const [workspaceStatus, setWorkspaceStatus] = useState<'trial' | 'converted' | 'unknown'>('unknown')
  const isTrial = workspaceStatus !== 'converted'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showInvite, setShowInvite]   = useState(false)
  const [showOnboarding, setShowOnboarding]   = useState(false)
  const [showCoachMarks, setShowCoachMarks]   = useState(false)
  const [showDeptInsights, setShowDeptInsights] = useState(false)
  const [showNewJoiner,    setShowNewJoiner]    = useState(false)
  const [showLeaveRequest, setShowLeaveRequest] = useState(false)
  const [showOffboarding,  setShowOffboarding]  = useState(false)
  const [showRecruitment,  setShowRecruitment]  = useState(false)
  const [showPerfReview,   setShowPerfReview]   = useState(false)
  const [focusDepts, setFocusDepts]           = useState<string[]>([])
  const [toast, setToast]                     = useState<string | null>(null)
  const [showConvert, setShowConvert]         = useState(false)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('lumio_wake_word_enabled')
    return stored === null ? true : stored === 'true'
  })

  function toggleWakeWord(val: boolean) {
    setWakeWordEnabled(val)
    localStorage.setItem('lumio_wake_word_enabled', String(val))
  }

  const bannerRef  = useRef<HTMLDivElement>(null)
  const navRef     = useRef<HTMLElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const statsRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPreview) return
    const alreadyLoaded = localStorage.getItem('lumio_demo_active') === 'true'
    if (alreadyLoaded) return
    const ALL_PAGES = [
      'overview','crm','sales','marketing','projects','hr','partners',
      'finance','insights','workflows','strategy','reports','settings',
      'inbox','calendar','analytics','accounts','support','success',
      'trials','operations','it'
    ]
    ALL_PAGES.forEach(p => localStorage.setItem(`lumio_dashboard_${p}_hasData`, 'true'))
    localStorage.setItem('lumio_demo_active', 'true')
    localStorage.setItem('lumio_company_name', 'Preview Co')
    localStorage.setItem('lumio_company_initials', 'PR')
    localStorage.setItem('lumio_used_quotes', '[]')
    window.location.reload()
  }, [isPreview])

  useEffect(() => {
    const name           = localStorage.getItem('demo_company_name') || (isPreview ? 'Preview' : 'Your Company')
    const user           = localStorage.getItem('demo_user_name') || ''
    const logo           = localStorage.getItem('demo_company_logo') || ''
    const created        = localStorage.getItem('demo_created_at')
    const onboarded      = localStorage.getItem('demo_onboarded')
    const tipsCompleted  = localStorage.getItem('demo_tips_completed')
    const depts          = JSON.parse(localStorage.getItem('demo_focus_depts') || '[]') as string[]
    setCompany(name); setUserName(user); setCompanyLogo(logo); setFocusDepts(depts)
    if (created) setDaysLeft(Math.max(0, 14 - Math.floor((Date.now() - parseInt(created)) / 86400000)))
    if (!isPreview && !onboarded) setShowOnboarding(true)
    else if (!isPreview && !tipsCompleted) setShowCoachMarks(true)

    // Legacy slug redirect: if URL has an old random-suffix slug, redirect to the clean slug
    const storedSlug = localStorage.getItem('demo_company_slug')
    if (storedSlug && storedSlug !== slug && slug.startsWith(storedSlug.replace(/\d+$/, ''))) {
      router.replace(`/demo/${storedSlug}`)
    }

    // Fetch workspace status from Supabase
    const sessionToken = localStorage.getItem('demo_session_token')
    if (sessionToken) {
      fetch('/api/demo/status', { headers: { 'x-demo-token': sessionToken } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return
          if (data.status === 'converted') {
            // Redirect converted users to their live workspace
            if (data.live_slug) {
              router.replace(`/${data.live_slug}`)
              return
            }
            setWorkspaceStatus('converted')
            setShowUpgrade(false)
          } else if (data.status === 'deleted' || (data.expires_at && new Date(data.expires_at) < new Date())) {
            router.replace('/trial-ended')
            return
          } else {
            setWorkspaceStatus('trial')
            if (data.expires_at) {
              const remaining = Math.max(0, Math.ceil((new Date(data.expires_at).getTime() - Date.now()) / 86400000))
              setDaysLeft(remaining)
            }
          }
        })
        .catch(() => {})
    }
  }, [])

  function handleTipsComplete() {
    localStorage.setItem('demo_tips_completed', '1')
    setShowCoachMarks(false)
    const token = localStorage.getItem('demo_session_token')
    if (token) {
      fetch('/api/demo/complete-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token }),
      }).catch(() => {/* non-blocking */})
    }
  }

  function fireToast(label: string = '') {
    if (label === 'Dept Insights')     { setShowDeptInsights(true);                         return }
    if (label === 'New Joiner')        { setShowNewJoiner(true);                             return }
    if (label === 'Leave Request')     { setShowLeaveRequest(true);                          return }
    if (label === 'Offboarding')       { setShowOffboarding(true);                           return }
    if (label === 'Recruitment')       { setShowRecruitment(true);                           return }
    if (label === 'Performance Review'){ setShowPerfReview(true);                            return }
    if (label === 'Company Events')    { router.push(`/demo/${slug}/events`);                return }
    setToast('Demo mode — this would trigger in your live workspace')
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDemoNewJoiner(data: NewJoinerData) {
    const fullName = `${data.firstName} ${data.lastName}`
    setShowNewJoiner(false)
    setToast(`Onboarding started for ${fullName}`)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleDemoLeaveRequest(data: LeaveRequestData) {
    setShowLeaveRequest(false)
    setToast(`Leave request submitted for ${data.employeeName}`)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleDemoOffboarding(data: OffboardingData) {
    setShowOffboarding(false)
    setToast(`Offboarding started for ${data.employeeName}`)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleDemoRecruitment(data: RecruitmentData) {
    setShowRecruitment(false)
    setToast(`Recruitment started for ${data.jobTitle}`)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleDemoPerfReview(data: PerformanceReviewData) {
    setShowPerfReview(false)
    setToast(`Performance review started for ${data.employeeName}`)
    setTimeout(() => setToast(null), 4000)
  }

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: '#F9FAFB', height: '100vh', overflow: 'hidden' }}>

      <Toast message={toast} />
      {showOnboarding && <DeptPickerModal onComplete={(depts) => { setFocusDepts(depts); setShowOnboarding(false); setShowCoachMarks(true) }} />}
      {showCoachMarks && <CoachMarks bannerRef={bannerRef} navRef={navRef} actionsRef={actionsRef} statsRef={statsRef} onComplete={handleTipsComplete} />}
      {showDeptInsights && <DeptInsightsModal dept={activeDept} onClose={() => setShowDeptInsights(false)} />}
      {showNewJoiner    && <NewJoinerModal          onClose={() => setShowNewJoiner(false)}    onSubmit={handleDemoNewJoiner}    />}
      {showLeaveRequest && <LeaveRequestModal      onClose={() => setShowLeaveRequest(false)} onSubmit={handleDemoLeaveRequest} />}
      {showOffboarding  && <OffboardingModal        onClose={() => setShowOffboarding(false)}  onSubmit={handleDemoOffboarding}  />}
      {showRecruitment  && <RecruitmentModal        onClose={() => setShowRecruitment(false)}  onSubmit={handleDemoRecruitment}  />}
      {showPerfReview   && <PerformanceReviewModal  onClose={() => setShowPerfReview(false)}   onSubmit={handleDemoPerfReview}   />}
      {showInvite && <InviteModal slug={slug} company={company} userName={userName} onClose={() => setShowInvite(false)} />}

      {/* Trial banner — hidden for converted/paid workspaces */}
      {showUpgrade && isTrial && (
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
      <header className="flex items-center justify-between px-4 py-3 shrink-0 gap-3 overflow-visible" style={{ backgroundColor: '#07080F', borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button className="md:hidden p-1.5 rounded-lg" style={{ color: '#9CA3AF' }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
          {/* Logo + company name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/"><Image src="/lumio-logo-primary.png" alt="Lumio" width={120} height={60}
              style={{ width: 60, height: 'auto', flexShrink: 0 }} className="rounded-md" /></Link>
            <div className="hidden sm:block w-px h-5 shrink-0" style={{ backgroundColor: '#1F2937' }} />
            <div className="min-w-0 hidden sm:block">
              <div className="text-sm font-bold truncate">{company}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>{isTrial ? 'Trial workspace' : 'Live workspace'}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowInvite(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all" style={{ backgroundColor: 'transparent', color: '#0D9488', border: '1px solid rgba(13,148,136,0.5)' }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13,148,136,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#0D9488' }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(13,148,136,0.5)' }}>
            <UserPlus size={13} /> Invite team
          </button>
          {isTrial && (
            <button onClick={() => setShowConvert(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold sm:text-sm sm:px-4" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
              <Zap size={12} /><span className="hidden sm:inline">Go Live</span><span className="sm:hidden">Go Live</span>
            </button>
          )}
          <AvatarDropdown
            initials={userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : company.slice(0, 2).toUpperCase()}
            onConvert={() => setShowConvert(true)}
          />
        </div>
      </header>
      {showConvert && <ConvertModal onClose={() => setShowConvert(false)} />}

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeDept={activeDept} onSelect={setActiveDept} open={sidebarOpen} onClose={() => setSidebarOpen(false)} focusDepts={focusDepts} navRef={navRef} companyName={company} companyLogo={companyLogo} />

        {/* Main scrollable area */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <main className="flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold">{deptLabel}</h1>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{isTrial ? 'Demo data for' : 'Workspace:'} <span style={{ color: '#F9FAFB' }}>{company}</span></p>
              </div>
              {/* Mobile invite */}
              <button className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }} onClick={() => setShowInvite(true)}><UserPlus size={11} /> Invite</button>
            </div>

            {activeDept !== 'overview' && <div className="mb-4"><QuickActionsBar dept={activeDept} onAction={fireToast} /></div>}

            {activeDept === 'overview'    && <OverviewView   company={company} firstName={userName ? userName.split(' ')[0] : undefined} bannerRef={bannerRef} statsRef={statsRef} actionsRef={actionsRef} onAction={fireToast} wakeWordEnabled={wakeWordEnabled} />}
            {activeDept === 'insights'   && <InsightsView   company={company} />}
            {activeDept === 'hr'         && <HRView         company={company} />}
            {activeDept === 'accounts'   && <AccountsView   company={company} />}
            {activeDept === 'sales'      && <SalesView      company={company} />}
            {activeDept === 'crm'        && <CRMView        company={company} />}
            {activeDept === 'marketing'  && <MarketingView  company={company} />}
            {activeDept === 'trials'     && <TrialsView     company={company} />}
            {activeDept === 'operations' && <OpsView        company={company} />}
            {activeDept === 'support'    && <SupportView    company={company} />}
            {activeDept === 'success'    && <SuccessView    company={company} />}
            {activeDept === 'it'         && <ITView         company={company} />}
            {activeDept === 'workflows'  && <WorkflowsView  company={company} />}
            {activeDept === 'partners'   && <PartnersView   company={company} />}
            {activeDept === 'strategy'   && <StrategyView   company={company} />}
            {activeDept === 'settings'   && <SettingsView   company={company} wakeWordEnabled={wakeWordEnabled} onToggleWakeWord={toggleWakeWord} />}
          </main>

          {/* Upgrade CTA (trial) / Connect data prompt (paid) */}
          {isTrial ? (
            <div className="mx-4 sm:mx-5 my-8 rounded-2xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(108,63,197,0.35)' }}>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.25)' }}><Zap size={12} /> Ready to go live?</div>
              <h2 className="text-2xl font-bold mb-2">This is your real dashboard. Without the demo data.</h2>
              <p className="text-sm mb-6 mx-auto max-w-md" style={{ color: '#9CA3AF' }}>Connect your real tools, activate your workflows, and your team starts saving hours from day one.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>See pricing <ArrowRight size={15} /></Link>
                <Link href="/demo" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'transparent', border: '1px solid #1F2937', color: '#9CA3AF' }}>Book a walkthrough</Link>
              </div>
            </div>
          ) : (
            <div className="mx-4 sm:mx-5 my-8 rounded-2xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.35)' }}>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#2DD4BF', border: '1px solid rgba(13,148,136,0.25)' }}><CheckCircle2 size={12} /> You&apos;re live</div>
              <h2 className="text-2xl font-bold mb-2">Connect your real data</h2>
              <p className="text-sm mb-6 mx-auto max-w-md" style={{ color: '#9CA3AF' }}>Replace the demo data with your real tools — email, CRM, calendar, and more. Your workspace is ready for production.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setActiveDept('settings')} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Go to Settings <ArrowRight size={15} /></button>
                <Link href="/book-demo" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'transparent', border: '1px solid #1F2937', color: '#9CA3AF' }}>Book onboarding call</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
