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
  Calendar, FileText, Target, DollarSign, Volume2, Mic, Handshake, Upload, Bell,
  Database, RotateCcw, Mail, MessageSquare, Phone, FolderKanban,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { useWakeWord } from '@/hooks/useWakeWord'
import { useVoiceCommands, type VoiceCommandResult } from '@/hooks/useVoiceCommands'
import { buildDemoBriefingScript } from '@/lib/buildDemoBriefingScript'
import DeptAISummary from '@/components/DeptAISummary'
import CRMViewV2 from '@/components/demo/CRMView'
import OverviewActionModal from '@/components/demo/OverviewActionModal'
import ProjectsView from '@/components/demo/ProjectsView'
import NewJoinerModal,        { type NewJoinerData }        from '@/components/NewJoinerModal'
import LeaveRequestModal,     { type LeaveRequestData }     from '@/components/LeaveRequestModal'
import OffboardingModal,      { type OffboardingData }      from '@/components/OffboardingModal'
import RecruitmentModal,      { type RecruitmentData }      from '@/components/RecruitmentModal'
import PerformanceReviewModal, { type PerformanceReviewData } from '@/components/PerformanceReviewModal'
import ConvertModal from '@/app/(demo-workspace)/components/ConvertModal'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'
import GettingStartedModal from '@/components/onboarding/GettingStartedModal'

// ─── Types ────────────────────────────────────────────────────────────────────

type WFStatus = 'COMPLETE' | 'RUNNING' | 'ACTION'
type RAG      = 'green' | 'amber' | 'red'
type ChartMode = 'number' | 'bar' | 'pie'
type DeptId   = 'overview' | 'insights' | 'hr' | 'accounts' | 'sales' | 'crm' | 'marketing' | 'trials' | 'operations' | 'support' | 'success' | 'it' | 'workflows' | 'settings' | 'partners' | 'strategy' | 'projects'

interface ChartDatum { label: string; value: number; color: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Overview', 'Insights', 'Partners', 'HR & People', 'Accounts', 'Strategy',
  'Trials', 'Sales', 'CRM', 'Marketing', 'Projects', 'Operations', 'Support',
  'Success', 'IT & Systems', 'Workflows Library',
]

const SIDEBAR_ITEMS: { id: DeptId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',    label: 'Overview',          icon: Home        },
  { id: 'insights',   label: 'Insights',           icon: BarChart3   },
  { id: 'partners',   label: 'Partners',           icon: Handshake   },
  { id: 'hr',         label: 'HR & People',        icon: Users       },
  { id: 'accounts',   label: 'Accounts',           icon: Receipt     },
  { id: 'strategy',   label: 'Strategy',           icon: Target      },
  { id: 'trials',     label: 'Trials',             icon: FlaskConical},
  { id: 'sales',      label: 'Sales',              icon: TrendingUp  },
  { id: 'crm',        label: 'CRM',                icon: Database    },
  { id: 'marketing',  label: 'Marketing',          icon: Megaphone   },
  { id: 'projects',   label: 'Projects',           icon: FolderKanban},
  { id: 'operations', label: 'Operations',         icon: Package     },
  { id: 'support',    label: 'Support',            icon: Headphones  },
  { id: 'success',    label: 'Success',            icon: Award       },
  { id: 'it',         label: 'IT & Systems',       icon: Monitor     },
  { id: 'workflows',  label: 'Workflows Library',  icon: GitBranch   },
  { id: 'settings',   label: 'Settings',           icon: Settings    },
]

const DEPT_ACTIONS: Record<DeptId, { label: string; tooltip: string; icon: React.ElementType }[]> = {
  overview:   [
    { label: 'Send Email',        tooltip: 'Open the email composer',                                      icon: Mail        },
    { label: 'Send Slack',        tooltip: 'Send a message on Slack',                                      icon: MessageSquare },
    { label: 'Phone Call',        tooltip: 'Log a phone call',                                             icon: Phone       },
    { label: 'Book Meeting',      tooltip: 'Schedule a meeting or demo',                                   icon: Calendar    },
    { label: 'Team Events',       tooltip: 'Schedule a team event',                                        icon: Users       },
    { label: 'Claim Expenses',    tooltip: 'Submit an expense claim',                                      icon: Receipt     },
    { label: 'Book Holiday',      tooltip: 'Request annual leave',                                         icon: Calendar    },
    { label: 'Report Sickness',   tooltip: 'Report an absence',                                            icon: AlertCircle },
  ],
  insights:   [
    { label: 'Export Report',    tooltip: 'Download the current view as a PDF or CSV',                     icon: FileText  },
    { label: 'Schedule Report',  tooltip: 'Set up a recurring email report to stakeholders',               icon: Calendar  },
    { label: 'Set Alert',        tooltip: 'Create a metric alert — notify when a threshold is hit',        icon: AlertCircle },
    { label: 'Share Dashboard',  tooltip: 'Generate a shareable link to this dashboard view',              icon: Users     },
    { label: 'Dept Insights',    tooltip: 'View AI-generated insights for Insights',                       icon: BarChart3 },
  ],
  hr:         [
    { label: 'New Starter',        tooltip: 'Trigger the full onboarding workflow for a new hire',         icon: UserPlus  },
    { label: 'Leave Request',      tooltip: 'Submit or approve a leave request for a team member',         icon: Calendar  },
    { label: 'Offboarding',        tooltip: 'Start the offboarding process for a departing employee',      icon: Users     },
    { label: 'Recruitment',        tooltip: 'Post a new role and trigger the recruitment workflow',         icon: Users     },
    { label: 'Performance Review', tooltip: 'Initiate a performance review cycle for selected employees',  icon: Star      },
    { label: 'Company Events',     tooltip: 'Plan and notify team of an upcoming company event',           icon: Megaphone },
    { label: 'Send Contract',      tooltip: 'Generate and send an employment contract via DocuSign',       icon: FileText  },
    { label: 'Book Contractor',    tooltip: 'Book a contractor or temp worker for a project',              icon: Users     },
    { label: 'Dept Insights',      tooltip: 'View AI-generated insights for HR & People',                  icon: BarChart3 },
  ],
  accounts:   [
    { label: 'Chase Invoice',     tooltip: 'Send payment reminders for all overdue invoices',              icon: Receipt     },
    { label: 'Raise Invoice',     tooltip: 'Create and send a new invoice to a customer',                 icon: DollarSign  },
    { label: 'Weekly Report',     tooltip: 'Generate the weekly finance summary report',                   icon: FileText    },
    { label: 'Payment Received',  tooltip: 'Log a payment received against an invoice',                   icon: DollarSign  },
    { label: 'Xero Sync',         tooltip: 'Trigger a manual sync with Xero accounting',                  icon: RotateCcw   },
    { label: 'Run Payroll',       tooltip: 'Process this month\'s payroll run',                            icon: Zap         },
    { label: 'Dept Insights',     tooltip: 'View AI-generated insights for Accounts',                     icon: BarChart3   },
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
    { label: 'Case Study',     tooltip: 'AI-powered case study builder — configure, research, draft, publish', icon: FileText },
    { label: 'Schedule Post',  tooltip: 'Queue a social post across LinkedIn, Twitter, and Instagram',     icon: Calendar  },
    { label: 'A/B Test',       tooltip: 'Set up an A/B test on email subject lines or ad copy',            icon: BarChart2 },
    { label: 'Email Blast',    tooltip: 'Send a one-off broadcast to a selected audience segment',         icon: Send      },
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Marketing',                       icon: BarChart3 },
  ],
  trials:     [
    { label: 'Admin Portal',        tooltip: 'Open the admin portal to manage trial workspaces',              icon: Users       },
    { label: 'New Trial',           tooltip: 'Provision a new 14-day trial workspace for a prospect',         icon: FlaskConical},
    { label: 'Extend Trial',        tooltip: 'Add 7 more days to an active trial workspace',                  icon: Clock       },
    { label: 'Convert to Customer', tooltip: 'Trigger the upgrade workflow and remove trial restrictions',     icon: UserPlus    },
    { label: 'End Trial',           tooltip: 'Safely expire and delete a trial workspace and all its data',   icon: AlertCircle },
    { label: 'Send Day 3 Email',    tooltip: 'Send the Day 3 check-in email to active trials',                icon: Send        },
    { label: 'Send Day 7 Email',    tooltip: 'Send the Day 7 engagement email to active trials',              icon: Send        },
    { label: 'Dept Insights',       tooltip: 'View AI-generated insights for Trials',                         icon: BarChart3   },
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
  projects:   [
    { label: 'Dept Insights',  tooltip: 'View AI-generated insights for Projects',                        icon: BarChart3 },
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
        {/* Lumio logo — bottom of sidebar */}
        <div className="mt-auto shrink-0 pb-3" style={{ borderTop: '1px solid #1F2937' }}>
          <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity pt-3" style={{ width: 'fit-content' }}>
            <Image src="/lumio-transparent-new.png" alt="Lumio" width={180} height={90} style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
          </a>
        </div>
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

const OPENING_LINES = [
  "Today is going to be a great day — here's your morning roundup.",
  "Rise and shine! Let's see what today has in store for you.",
  "Good things are coming today — let's get into it.",
  "You've got this. Here's everything you need to hit the ground running.",
  "Big things happen to people who start their day right — let's go.",
  "Today's your day. Here's your morning roundup.",
  "The best time to make things happen is right now — let's get started.",
  "Another day, another opportunity. Here's what's on the agenda.",
  "Morning! The world is ready for you — here's your briefing.",
  "Let's make today count. Here's your roundup.",
  "Great days start with great mornings — here's yours.",
  "You showed up. That's already half the battle. Here's the rest.",
  "Today has potential written all over it. Let's dig in.",
  "Good morning! Here's your world for the day.",
  "Every great day starts somewhere — let's start here.",
  "The momentum starts now. Here's your morning briefing.",
  "Today is full of possibility — let's see what we can do with it.",
  "Morning energy activated. Here's your roundup.",
  "Something good is going to happen today — here's your briefing.",
  "Let's make this one count. Here's your morning roundup.",
  "The day is yours — here's how it's shaping up.",
  "Ready? Because today is ready for you. Here's your briefing.",
  "A fresh day, a fresh start — here's your morning roundup.",
  "Onwards and upwards. Here's what's waiting for you today.",
  "Today is a blank page — let's write something good. Here's your roundup.",
  "Good morning! Big things start with mornings like this.",
  "You're already ahead just by starting. Here's your briefing.",
  "The day is looking good — here's the rundown.",
  "Morning! Let's make something happen today.",
  "One day at a time, one great morning at a time — here's yours.",
  "Today's going to be one of the good ones. Here's your roundup.",
  "Fuel up and focus — here's your morning briefing.",
  "The best version of today starts right now. Let's go.",
  "Morning! Here's everything you need to own the day.",
  "Good days are built one morning at a time — here's yours.",
  "Today has your name on it. Here's the briefing.",
  "Let's get into it — here's your morning roundup.",
  "New day, new wins waiting to happen. Here's your briefing.",
  "The day is already looking up — here's your roundup.",
  "Morning! You've got everything you need to make today great.",
  "Today is full of good things — here's where they start.",
  "Eyes up, chin up, here's your morning roundup.",
  "Today is ready when you are. Here's your briefing.",
  "Good morning! Let's see what today is made of.",
  "The best part of the day is right now — it's all uphill from here.",
  "Today is going to surprise you in the best way. Here's your roundup.",
  "Morning! Let's stack some wins today.",
  "You've got a great day ahead — here's the proof.",
  "Start strong, finish stronger — here's your morning briefing.",
  "Good morning! Here's your launchpad for the day.",
  "Today is one of those days — the good kind. Here's your roundup.",
  "The momentum is yours — here's your morning briefing.",
  "Morning! Everything you need is right here — let's go.",
  "Today's going to be a good one — here's your roundup.",
  "Let's build something great today — starting with this briefing.",
  "Good morning! Here's your daily dose of let's get it.",
  "The day ahead looks good from here — here's your roundup.",
  "Morning! Here's your daily briefing — make it count.",
  "Today is yours to shape — here's your morning roundup.",
  "Good morning! The best moments of today are still ahead.",
]

const CLOSING_LINES = [
  "Have an absolutely brilliant day \u2014 go make it count.",
  "Now go get 'em. Today is yours.",
  "That's your briefing \u2014 go be brilliant today.",
  "Have a great day. You've already started it right.",
  "Go make today one to remember.",
  "Off you go \u2014 today has your name on it.",
  "Have a fantastic day. The momentum starts now.",
  "Go get 'em. Everything you need is right there.",
  "Have a brilliant one. Big things happen to people who start their day like this.",
  "That's everything \u2014 now go make it happen.",
  "Have an amazing day. The best part is still ahead.",
  "Go show them what you're made of today.",
  "Have a great day \u2014 you're already ahead of the game.",
  "Off you go. Make today brilliant.",
  "That's your morning sorted \u2014 now go be outstanding.",
  "Have a wonderful day. Every decision you make today matters.",
  "Go get 'em \u2014 today is full of opportunity.",
  "Have a brilliant day. The work you do makes a real difference.",
  "That's the briefing done \u2014 now go do what you do best.",
  "Have an incredible day. Make every hour count.",
  "Go make today outstanding. You've already done the hard part.",
  "Have a fantastic day \u2014 the best moments are still to come.",
  "That's your briefing \u2014 go make today brilliant.",
  "Off you go. Make today count.",
  "Have a great one. You've got everything you need to crush it today.",
  "Go get 'em. Today is going to be a good one.",
  "Have a brilliant day \u2014 big things are coming.",
  "That's everything \u2014 now go have the day you deserve.",
  "Go be brilliant. Today is waiting for you.",
  "Have an amazing day \u2014 every hour is an opportunity.",
  "You're set. Go make today one to be proud of.",
  "Have a great day \u2014 the work you're doing here genuinely matters.",
  "Go get 'em. Make today brilliant.",
  "That's your morning briefing \u2014 now go make today outstanding.",
  "Have a wonderful day. You're exactly where you're supposed to be.",
  "Go make today brilliant. The opportunities are there \u2014 go find them.",
  "Have a fantastic day \u2014 you're already ahead just by being prepared.",
  "Off you go. Today is going to be great.",
  "Have a brilliant day \u2014 go show them what great looks like.",
  "That's everything \u2014 go make today incredible.",
  "Go get 'em. You've got this and then some.",
  "Have a great day \u2014 the difference you make is real.",
  "Go be outstanding. Today is waiting for you.",
  "Have a brilliant one \u2014 the best work of your day is still ahead.",
  "That's your briefing. Now go make today matter.",
  "Have an amazing day \u2014 you're doing something truly important.",
  "Go get 'em. Make every moment count today.",
  "Have a fantastic day \u2014 you're ready and the world needs you.",
  "Off you go \u2014 go make today one to remember.",
  "Have a brilliant day. The impact you have is greater than you realise.",
  "That's everything \u2014 now go be brilliant.",
  "Go make today outstanding. You've got everything you need.",
  "Have a great day \u2014 go show them what you're made of.",
  "That's your morning briefing done. Now go have an absolutely brilliant day.",
  "Go get 'em. Today's got your name written all over it.",
  "Have a brilliant day \u2014 something good is going to happen today.",
  "Off you go. Make it count.",
  "Have a great day \u2014 the best version of today starts right now.",
  "Go make something brilliant happen today. You've got this.",
  "That's your briefing \u2014 now go out there and own the day.",
]

const DEFAULT_WORLD_ZONES = [
  { label: 'London',   tz: 'Europe/London'    },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Dubai',    tz: 'Asia/Dubai'       },
  { label: 'Tokyo',    tz: 'Asia/Tokyo'       },
]

const ALL_TIMEZONES = [
  { label: 'London', tz: 'Europe/London' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Sydney', tz: 'Australia/Sydney' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'Chicago', tz: 'America/Chicago' },
  { label: 'Toronto', tz: 'America/Toronto' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'Berlin', tz: 'Europe/Berlin' },
  { label: 'Amsterdam', tz: 'Europe/Amsterdam' },
  { label: 'Singapore', tz: 'Asia/Singapore' },
  { label: 'Hong Kong', tz: 'Asia/Hong_Kong' },
  { label: 'Mumbai', tz: 'Asia/Kolkata' },
  { label: 'S\u00e3o Paulo', tz: 'America/Sao_Paulo' },
  { label: 'Mexico City', tz: 'America/Mexico_City' },
  { label: 'Johannesburg', tz: 'Africa/Johannesburg' },
  { label: 'Cairo', tz: 'Africa/Cairo' },
  { label: 'Auckland', tz: 'Pacific/Auckland' },
  { label: 'Riyadh', tz: 'Asia/Riyadh' },
]

function getStoredZones(): { label: string; tz: string }[] {
  if (typeof window === 'undefined') return DEFAULT_WORLD_ZONES
  try {
    const stored = localStorage.getItem('lumio_world_zones')
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_WORLD_ZONES
}

function getUserLocalTz(): { label: string; tz: string } {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const match = ALL_TIMEZONES.find(z => z.tz === tz)
  return match || { label: tz.split('/').pop()?.replace(/_/g, ' ') || 'Local', tz }
}

function MiniAnalogClock({ tz, now }: { tz: string; now: Date }) {
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz, hour12: false })
  const [h, m] = timeStr.split(':').map(Number)
  const hourAngle = ((h % 12) + m / 60) * 30
  const minuteAngle = m * 6
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
        <line key={deg} x1="18" y1="4" x2="18" y2={deg % 90 === 0 ? '6' : '5'} stroke="rgba(255,255,255,0.3)" strokeWidth={deg % 90 === 0 ? '1.5' : '0.75'} transform={`rotate(${deg} 18 18)`} />
      ))}
      <line x1="18" y1="18" x2="18" y2="8" stroke="#F9FAFB" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${hourAngle} 18 18)`} />
      <line x1="18" y1="18" x2="18" y2="5.5" stroke="#0D9488" strokeWidth="1" strokeLinecap="round" transform={`rotate(${minuteAngle} 18 18)`} />
      <circle cx="18" cy="18" r="1.5" fill="#F9FAFB" />
    </svg>
  )
}

function WorldClock() {
  const [now, setNow] = useState(() => new Date())
  const [zones, setZones] = useState(getStoredZones)
  const localTz = getUserLocalTz()
  const [mode, setMode] = useState<'digital' | 'analogue'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('lumio_clock_mode') as 'digital' | 'analogue') || 'digital'
    return 'digital'
  })
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => {
    function onStorage(e: StorageEvent) { if (e.key === 'lumio_world_zones') setZones(getStoredZones()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function toggleMode() {
    const next = mode === 'digital' ? 'analogue' : 'digital'
    setMode(next)
    localStorage.setItem('lumio_clock_mode', next)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 relative" style={{ minWidth: 160 }}>
      <button onClick={toggleMode} className="absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[9px] font-semibold transition-colors"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
        title={`Switch to ${mode === 'digital' ? 'analogue' : 'digital'}`}>
        {mode === 'digital' ? '\u25f7' : '123'}
      </button>
      {mode === 'digital' ? (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {zones.map(z => {
              const isLocal = z.tz === localTz.tz
              return (
                <div key={z.label} className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-black text-white">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: z.tz, hour12: false })}</span>
                  <span className="text-xs" style={{ color: isLocal ? '#FBBF24' : 'rgba(167,139,250,0.6)' }}>{z.label}</span>
                </div>
              )
            })}
          </div>
          <div className="text-xs mt-1" style={{ color: '#FBBF24' }}>World Clock</div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {zones.map(z => {
              const isLocal = z.tz === localTz.tz
              return (
                <div key={z.label} className="flex flex-col items-center gap-1">
                  <MiniAnalogClock tz={z.tz} now={now} />
                  <span className="text-[9px] font-medium" style={{ color: isLocal ? '#FBBF24' : 'rgba(167,139,250,0.6)' }}>{z.label}</span>
                </div>
              )
            })}
          </div>
          <div className="text-xs mt-1" style={{ color: '#FBBF24' }}>World Clock</div>
        </>
      )}
    </div>
  )
}

function DemoPersonalBanner({ company, firstName, dept = 'overview', onToast, wakeWordEnabled = true, voiceCommandsEnabled = true }: { company: string; firstName?: string; dept?: string; onToast?: (msg: string) => void; wakeWordEnabled?: boolean; voiceCommandsEnabled?: boolean }) {
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

  const { isListening, lastCommand, startListening, stopListening, pendingAction, setPendingAction } = useVoiceCommands()

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const openingLine = OPENING_LINES[dayOfYear % OPENING_LINES.length]
    const closingLine = CLOSING_LINES[dayOfYear % CLOSING_LINES.length]
    const script = buildDemoBriefingScript({
      companyName: company,
      meetings: DEMO_MEETINGS as unknown as { title: string; time: string; status: string }[],
      emailCount: 12,
      urgentCount: 2,
      workflowActionCount: 3,
      openingLine,
      closingLine,
    })
    speak(script)
  }

  // Handle voice command actions
  useEffect(() => {
    if (!lastCommand) return
    const { action, response, payload } = lastCommand as any
    speak(response)

    if (action === 'PLAY_BRIEFING') {
      setTimeout(() => handleBriefing(), 1800)
    } else if (action === 'STOP_AUDIO') {
      stop()
    } else if (action === 'NAVIGATE') {
      const dept = payload?.dept?.toLowerCase()
      if (dept) setTimeout(() => window.location.href = `/demo/${dept}`, 1500)
    } else if (action === 'CANCEL_NEXT_MEETING') {
      const nextMeeting = DEMO_MEETINGS.find(m => m.status === 'upcoming')
      if (nextMeeting) {
        setTimeout(() => {
          setPendingAction({ type: 'AWAITING_CANCEL_CONFIRMATION', data: { meeting: nextMeeting } })
          speak(`You have a ${nextMeeting.title} at ${nextMeeting.time}. Would you like me to cancel it? Say yes to cancel, or no to keep it.`)
        }, 1500)
      } else {
        speak("I couldn't find any upcoming meetings today.")
      }
    } else if (action === 'CANCEL_NAMED_MEETING') {
      const name = payload?.meetingName?.toLowerCase() || ''
      const found = DEMO_MEETINGS.find(m => m.title.toLowerCase().includes(name))
      if (found) {
        setTimeout(() => {
          setPendingAction({ type: 'AWAITING_CANCEL_CONFIRMATION', data: { meeting: found } })
          speak(`I found ${found.title} at ${found.time}. Would you like me to cancel it? Say yes to cancel, or no to keep it.`)
        }, 1500)
      } else {
        const upcoming = DEMO_MEETINGS.filter(m => m.status === 'upcoming').map(m => m.title).join(', ')
        speak(`I couldn't find a meeting called ${payload?.meetingName}. Your upcoming meetings are: ${upcoming}`)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand])

  return (
    <>
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
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
            <p style={{ color: '#FBBF24' }} className="text-sm italic">&ldquo;{quote.text}&rdquo; — {quote.author}</p>
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

          {/* RIGHT: weather + world clock */}
          <div className="flex items-start gap-3 flex-shrink-0">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <span className="text-3xl">⛅</span>
              <div>
                <div className="text-xl font-black text-white">11°C</div>
                <div className="text-xs text-purple-300">Partly cloudy</div>
                <div className="text-xs text-purple-300/60">Demo City</div>
              </div>
            </div>
            <WorldClock />
          </div>

        </div>

      </div>
    </div>

    {isListening && (
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#111318', border: '1px solid #EF4444',
        borderRadius: 999, padding: '8px 20px', zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 8, color: '#F9FAFB', fontSize: 14,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1s infinite' }} />
        Listening... say a command
      </div>
    )}

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
  { id: 'sms',      icon: '📱', label: 'SMS / Text',          count: 3,  urgent: true,  color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.2)',   preview: ['Urgent: Payment query from Tom at Bramble Hill', 'Demo confirmation for 11am today', 'GDPR compliance question from prospect'] },
  { id: 'whatsapp', icon: '💬', label: 'WhatsApp Business',   count: 4,  urgent: false, color: '#25D366', bg: 'rgba(37,211,102,0.08)',  border: 'rgba(37,211,102,0.2)',  preview: ['Sarah Mitchell: follow-up on demo call', 'James Harlow: contract query', 'Apex Consulting: renewal reminder', 'Dan Marsh: invoice question'] },
  { id: 'email',    icon: '📧', label: 'Emails',              count: 12, urgent: true,  color: '#60A5FA', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)',   preview: ['Invoice overdue — INV-2026-041', 'Renewal discussion — Apex contract ends Apr 30', 'Stripe payment confirmed — £4,800 from Oakridge'] },
  { id: 'slack',    icon: '💬', label: 'Slack',               count: 7,  urgent: false, color: '#C084FC', bg: 'rgba(192,132,252,0.08)',  border: 'rgba(192,132,252,0.2)',  preview: ['Charlotte: lead scored 87 in SA-02', 'HR-01 completed for new joiner Sophie Williams', 'James: Wimbledon client wants a demo Friday'] },
  { id: 'teams',    icon: '🟣', label: 'Microsoft Teams',     count: 3,  urgent: false, color: '#7B83EB', bg: 'rgba(123,131,235,0.08)', border: 'rgba(123,131,235,0.2)', preview: ['Sales Standup — Apex moving to proposal', 'Sophie: onboarding checklist progress', 'James: Oakridge loves the safeguarding module'] },
  { id: 'hubspot',  icon: '🟠', label: 'HubSpot',             count: 5,  urgent: false, color: '#FB923C', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.2)',   preview: ['Deal update — Apex moved to Negotiation', 'New contact — Marcus Chen, Meridian Trust', 'Email sequence: 3 opens, 1 click-through'] },
  { id: 'notion',   icon: '📋', label: 'Notion',              count: 2,  urgent: false, color: '#FB923C', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.2)',   preview: ['Testing guide updated — 2 items resolved', 'Q2 Roadmap — 3 items need review'] },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn',            count: 4,  urgent: false, color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)',   border: 'rgba(45,212,191,0.2)',   preview: ['2 connection requests', 'Post got 47 reactions and 12 comments'] },
  { id: 'news',     icon: '📰', label: 'Industry News',       count: 3,  urgent: false, color: '#FBBF24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)',   preview: ['UK SMB automation market up 34% YoY', 'SEND White Paper implementation update', 'Google Workspace — new admin controls'] },
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

const DEMO_DEFAULT_PHOTOS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop',
]

function DemoPhotoFrame() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<string[]>(() => {
    try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio_photo_frame') : null; if (s) { const p = JSON.parse(s); if (p.length > 0) return p }; return DEMO_DEFAULT_PHOTOS } catch { return DEMO_DEFAULT_PHOTOS }
  })
  const [idx, setIdx] = useState(0)
  useEffect(() => { if (photos.length > 1) { const t = setInterval(() => setIdx(i => (i + 1) % photos.length), 5000); return () => clearInterval(t) } }, [photos.length])
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files || []).forEach(f => { const r = new FileReader(); r.onload = ev => { setPhotos(p => { const n = [...p, ev.target?.result as string].slice(-20); localStorage.setItem('lumio_photo_frame', JSON.stringify(n)); return n }) }; r.readAsDataURL(f) }); e.target.value = ''
  }
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 200 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2"><span className="text-base">🖼️</span><span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span></div>
        <button onClick={() => fileInputRef.current?.click()} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>+ Add Photo</button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
      </div>
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 mx-4 mb-4 rounded-xl cursor-pointer" style={{ border: '2px dashed #374151', backgroundColor: 'rgba(255,255,255,0.02)' }} onClick={() => fileInputRef.current?.click()}>
          <div className="text-3xl">📷</div>
          <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Upload your photos</div>
        </div>
      ) : (
        <div className="flex-1 relative mx-4 mb-4 rounded-xl overflow-hidden" style={{ minHeight: 140 }}>
          <img src={photos[idx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#D1D5DB' }}>{idx + 1}/{photos.length}</div>
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

      {/* 2. Tab bar */}
      <DemoTabBar tab={tab} onChange={setTab} />

      {tab === 'today' ? (
        <div className="space-y-4">
          {/* 4. Quick Actions — above the main grid */}
          <div ref={actionsRef}><QuickActionsBar dept="overview" onAction={onAction ?? (() => {})} /></div>

          {/* 5. Three-col grid: left (roundup) / middle (meetings) / right (photo + AI) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            {/* LEFT — Morning Roundup */}
            <DemoMorningRoundup />
            {/* MIDDLE — Meetings Today */}
            <DemoMeetingsToday />
            {/* RIGHT — Photo Frame + AI Panel */}
            <div className="space-y-4">
              <DemoPhotoFrame />
              <DemoMorningAIPanel />
            </div>
          </div>

          {/* 6. Stats + Workflow Activity */}
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
      ) : tab === 'team' ? (
        <DemoTeamPanel />
      ) : (
        <DemoTabPlaceholder tab={tab} />
      )}
    </div>
  )
}

/* ─── Demo Team Panel (matches TeamPanel.tsx with 3 sub-tabs) ──────────────── */
function DemoTeamPanel() {
  type SubTab = 'today' | 'orgchart' | 'company'
  const [subTab, setSubTab] = useState<SubTab>('today')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null)
  const [filter, setFilter] = useState('all')

  const SC: Record<string, { dot: string; label: string; color: string }> = {
    active:  { dot: '#22C55E', label: 'Active',  color: '#4ADE80' },
    away:    { dot: '#F59E0B', label: 'Away',    color: '#FBBF24' },
    holiday: { dot: '#3B82F6', label: 'Holiday', color: '#60A5FA' },
    wfh:     { dot: '#A855F7', label: 'WFH',     color: '#C084FC' },
    sick:    { dot: '#EF4444', label: 'Sick',    color: '#F87171' },
  }
  const DEPT_COLORS: Record<string, string> = { Executive: '#0D9488', Sales: '#8B5CF6', Marketing: '#F59E0B', Finance: '#3B82F6', HR: '#22C55E', IT: '#EF4444' }

  const TEAM = [
    { id: '0', name: 'Demo User', role: 'CEO & Founder', department: 'Executive', avatar: 'DU', status: 'active', todayFocus: 'Board prep, investor call at 2pm', openTasks: 4, alerts: 0, recentActivity: 'Reviewed Q1 financials', relationship: 'You', email: 'demo@company.com', level: 1 },
    { id: '1', name: 'Sarah Mitchell', role: 'Head of HR', department: 'HR', avatar: 'SM', status: 'active', todayFocus: 'New joiner onboarding × 2', openTasks: 3, alerts: 0, recentActivity: 'HR-01 ran 9 min ago', relationship: 'Direct report', email: 'sarah@company.com', managerId: '0', level: 2 },
    { id: '2', name: 'Oliver Bennett', role: 'Head of Sales', department: 'Sales', avatar: 'OB', status: 'active', todayFocus: 'Demo calls × 2', openTasks: 5, alerts: 1, recentActivity: 'SA-02 scored 4 leads', relationship: 'Direct report', email: 'oliver@company.com', managerId: '0', level: 2 },
    { id: '3', name: 'George Harrison', role: 'Head of Finance', department: 'Finance', avatar: 'GH', status: 'active', todayFocus: 'Invoice review + payroll', openTasks: 6, alerts: 2, recentActivity: 'AC-03 chased 3 invoices', relationship: 'Direct report', email: 'george@company.com', managerId: '0', level: 2 },
    { id: '4', name: 'Alexander Jones', role: 'Head of IT', department: 'IT', avatar: 'AJ', status: 'active', todayFocus: 'IT provisioning backlog', openTasks: 2, alerts: 0, recentActivity: 'IT-01 complete', relationship: 'Direct report', email: 'alex@company.com', managerId: '0', level: 2 },
    { id: '5', name: 'Charlotte Davies', role: 'Senior AE', department: 'Sales', avatar: 'CD', status: 'wfh', todayFocus: 'Client demo prep', openTasks: 4, alerts: 0, recentActivity: 'Proposal sent', relationship: 'Same department', email: 'charlotte@company.com', managerId: '2', level: 3 },
    { id: '6', name: 'James Okafor', role: 'Sales Dev Rep', department: 'Sales', avatar: 'JO', status: 'active', todayFocus: 'Cold outreach sequence', openTasks: 3, alerts: 0, recentActivity: '8 calls made', relationship: 'Same department', email: 'james@company.com', managerId: '2', level: 3 },
    { id: '7', name: 'Sophia Brown', role: 'Head of Marketing', department: 'Marketing', avatar: 'SB', status: 'holiday', openTasks: 0, alerts: 0, recentActivity: 'Back Thursday', relationship: 'Other department', email: 'sophia@company.com', managerId: '0', level: 2 },
    { id: '8', name: 'Tom Ashworth', role: 'Content Lead', department: 'Marketing', avatar: 'TA', status: 'active', todayFocus: 'Blog post + social calendar', openTasks: 2, alerts: 0, recentActivity: 'Published blog post', relationship: 'Other department', email: 'tom@company.com', managerId: '7', level: 3 },
    { id: '9', name: 'Priya Kapoor', role: 'HR Coordinator', department: 'HR', avatar: 'PK', status: 'active', todayFocus: 'Contract templates', openTasks: 1, alerts: 0, recentActivity: 'Updated handbook', relationship: 'Same department', email: 'priya@company.com', managerId: '1', level: 3 },
  ]

  const POLICIES = [
    { icon: '📋', title: 'Staff Handbook', desc: 'Employment policies, conduct, benefits', content: 'This Staff Handbook sets out the policies and procedures for all employees. It covers employment terms, code of conduct, disciplinary procedures, grievance processes and employee benefits.\n\nKey points:\n• Standard working hours: 9am-5:30pm\n• Annual leave: 25 days + bank holidays\n• Probation period: 3 months\n• Notice period: 1 month' },
    { icon: '🏖️', title: 'Leave & Holiday Policy', desc: 'Annual leave, booking, blackout dates', content: 'Annual leave allowance is 25 days per year plus 8 bank holidays. Leave must be booked at least 2 weeks in advance for periods over 3 days.' },
    { icon: '🏥', title: 'Health & Wellbeing', desc: 'Mental health, EAP, sick leave', content: 'We provide an Employee Assistance Programme (EAP) available 24/7. All employees have access to 6 free counselling sessions per year.' },
    { icon: '🔒', title: 'Data & Security', desc: 'GDPR, data handling, passwords', content: 'All company data must be handled in accordance with UK GDPR. Passwords must be minimum 12 characters. Two-factor authentication is mandatory.' },
    { icon: '💰', title: 'Expenses Policy', desc: 'Claims, limits, deadlines', content: 'Expenses must be submitted within 30 days. Receipts required for all claims over £10. Meals £25pp, hotels £150/night, mileage 45p/mile.' },
    { icon: '🎓', title: 'Learning & Development', desc: 'Training budget, study leave', content: 'Each employee has a £1,000 annual L&D budget for courses, conferences, books or certifications. Study leave: up to 5 days per year.' },
  ]

  const BIRTHDAYS = [
    { name: 'James Okafor', event: 'Birthday', date: '4 Apr', emoji: '🎂' },
    { name: 'Charlotte Davies', event: '2 year anniversary', date: '7 Apr', emoji: '🎉' },
    { name: 'Tom Ashworth', event: 'Birthday', date: '18 Apr', emoji: '🎂' },
  ]

  const filtered = TEAM.filter(m => {
    if (filter === 'all') return true
    if (filter === 'alerts') return m.alerts > 0
    if (filter === 'away') return m.status !== 'active' && m.status !== 'wfh'
    if (filter === 'myteam') return m.relationship === 'Direct report' || m.relationship === 'You'
    return true
  })

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex gap-2">
        {([{ id: 'today' as SubTab, label: '👥 Team Today' }, { id: 'orgchart' as SubTab, label: '🏢 Org Chart' }, { id: 'company' as SubTab, label: '📋 Company Info' }]).map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: subTab === t.id ? '#7C3AED' : '#111318', color: subTab === t.id ? '#F9FAFB' : '#6B7280', border: subTab === t.id ? 'none' : '1px solid #1F2937' }}>{t.label}</button>
        ))}
      </div>

      {subTab === 'today' && <>
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Team Today</h2><p className="text-xs" style={{ color: '#6B7280' }}>{TEAM.length} people · {TEAM.filter(m => m.status === 'holiday' || m.status === 'sick').length} out · {TEAM.filter(m => m.alerts > 0).length} with alerts</p></div>
          <div className="flex gap-1 flex-wrap">
            {['all', 'alerts', 'away', 'myteam'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 text-xs font-bold rounded-xl" style={{ backgroundColor: filter === f ? '#7C3AED' : 'rgba(255,255,255,0.05)', color: filter === f ? '#fff' : '#6B7280' }}>
                {f === 'all' ? 'All' : f === 'alerts' ? 'Alerts' : f === 'away' ? 'Out' : 'My Team'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(m => {
            const sc = SC[m.status]
            return (
              <div key={m.id} onClick={() => setSelectedMember(m)} className="rounded-2xl p-4 cursor-pointer transition-all hover:border-[#374151]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${DEPT_COLORS[m.department] || '#6B7280'}20`, color: DEPT_COLORS[m.department] || '#6B7280' }}>{m.avatar}</div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: sc.dot, borderColor: '#111318' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-bold text-sm truncate" style={{ color: '#E5E7EB' }}>{m.name}</span>{m.alerts > 0 && <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: '#DC2626' }}>{m.alerts}</span>}</div>
                    <p className="text-xs truncate" style={{ color: '#6B7280' }}>{m.role} · {m.department}</p>
                    <div className="flex gap-1 mt-1"><span className="text-xs font-medium" style={{ color: sc.color }}>{sc.label}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{m.relationship}</span></div>
                    {m.todayFocus && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Today: {m.todayFocus}</p>}
                  </div>
                  {m.openTasks > 0 && <div className="text-center shrink-0"><div className="text-lg font-black" style={{ color: '#9CA3AF' }}>{m.openTasks}</div><div className="text-[10px]" style={{ color: '#374151' }}>tasks</div></div>}
                </div>
              </div>
            )
          })}
        </div>
      </>}

      {subTab === 'orgchart' && (
        <div>
          <h2 className="text-xl font-black mb-6" style={{ color: '#F9FAFB' }}>Organisation Chart</h2>
          <div className="flex justify-center mb-8">
            <div onClick={() => setSelectedMember(TEAM[0])} className="rounded-xl p-4 text-center cursor-pointer w-48" style={{ backgroundColor: '#111318', border: '2px solid #0D9488' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#0D9488' }}>{TEAM[0].avatar}</div>
              <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{TEAM[0].name}</p>
              <p className="text-[10px]" style={{ color: '#0D9488' }}>{TEAM[0].role}</p>
            </div>
          </div>
          <div className="flex justify-center mb-2"><div className="w-px h-8" style={{ backgroundColor: '#374151' }} /></div>
          <div className="flex justify-center mb-2"><div className="h-px" style={{ backgroundColor: '#374151', width: '80%' }} /></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {TEAM.filter(m => m.level === 2).map(m => (
              <div key={m.id} className="flex flex-col items-center">
                <div className="w-px h-6 mb-2" style={{ backgroundColor: '#374151' }} />
                <div onClick={() => setSelectedMember(m)} className="rounded-xl p-3 text-center cursor-pointer w-full" style={{ backgroundColor: '#111318', border: `1px solid ${DEPT_COLORS[m.department] || '#1F2937'}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mx-auto mb-1" style={{ backgroundColor: `${DEPT_COLORS[m.department] || '#6B7280'}20`, color: DEPT_COLORS[m.department] || '#6B7280' }}>{m.avatar}</div>
                  <p className="text-xs font-bold truncate" style={{ color: '#F9FAFB' }}>{m.name}</p>
                  <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{m.role}</p>
                  <span className="text-[10px]" style={{ color: SC[m.status].color }}>{SC[m.status].label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-8">
            {TEAM.filter(m => m.level === 3).map(m => {
              const manager = TEAM.find(t => t.id === m.managerId)
              return (
                <div key={m.id} onClick={() => setSelectedMember(m)} className="rounded-xl p-3 text-center cursor-pointer" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] mx-auto mb-1" style={{ backgroundColor: `${DEPT_COLORS[m.department] || '#6B7280'}15`, color: DEPT_COLORS[m.department] || '#6B7280' }}>{m.avatar}</div>
                  <p className="text-xs font-medium truncate" style={{ color: '#D1D5DB' }}>{m.name}</p>
                  <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{m.role}</p>
                  {manager && <p className="text-[10px]" style={{ color: '#374151' }}>→ {manager.name.split(' ')[0]}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {subTab === 'company' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Company Info</h2>
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Company Documents</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {POLICIES.map(p => (
                <div key={p.title} onClick={() => setSelectedPolicy(p)} className="rounded-xl p-4 cursor-pointer transition-all hover:border-[#374151]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <span className="text-2xl block mb-2">{p.icon}</span>
                  <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{p.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Company Details</p>
              {[['Founded', '2021'], ['Industry', 'SaaS / Technology'], ['Size', '10-50 employees'], ['HQ', 'London, UK'], ['Website', 'company.com']].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{v}</span></div>
              ))}
            </div>
            <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Contacts</p>
              {[['CEO', 'Demo User'], ['HR', 'Sarah Mitchell'], ['IT Support', 'Alexander Jones'], ['Finance', 'George Harrison']].map(([r, n]) => (
                <div key={r} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{r}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{n}</span></div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Useful Links</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Slack workspace', 'Google Drive', 'HR system', 'Payroll portal', 'Benefits portal', 'IT helpdesk', 'Company calendar', 'Training platform'].map(l => (
                <div key={l} className="flex items-center gap-2 rounded-lg p-3 cursor-pointer" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <ArrowRight size={12} style={{ color: '#6B7280' }} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Birthdays & Anniversaries This Month</p>
            {BIRTHDAYS.map(b => <p key={b.name} className="text-xs py-1" style={{ color: '#D1D5DB' }}>{b.emoji} {b.name} — {b.event} {b.date}</p>)}
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedMember(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: `${DEPT_COLORS[selectedMember.department] || '#6B7280'}20`, color: DEPT_COLORS[selectedMember.department] || '#6B7280' }}>{selectedMember.avatar}</div>
                <div><p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{selectedMember.name}</p><p className="text-xs" style={{ color: '#6B7280' }}>{selectedMember.role} · {selectedMember.department}</p></div>
              </div>
              <button onClick={() => setSelectedMember(null)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2"><span className="text-xs" style={{ color: SC[selectedMember.status]?.color }}>{SC[selectedMember.status]?.label}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{selectedMember.relationship}</span></div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>📧 {selectedMember.email}</p>
              {selectedMember.todayFocus && <p className="text-xs" style={{ color: '#9CA3AF' }}>📌 {selectedMember.todayFocus}</p>}
              {selectedMember.recentActivity && <p className="text-xs" style={{ color: '#A78BFA' }}>⚡ {selectedMember.recentActivity}</p>}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Message</button>
              <button className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>Book meeting</button>
            </div>
          </div>
        </div>
      )}

      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedPolicy(null)}>
          <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><span className="text-2xl">{selectedPolicy.icon}</span><p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{selectedPolicy.title}</p></div>
              <button onClick={() => setSelectedPolicy(null)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>
            <div className="text-sm whitespace-pre-line" style={{ color: '#D1D5DB', lineHeight: 1.8 }}>{selectedPolicy.content}</div>
          </div>
        </div>
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
  const starters = [{name:fakeName(company,0),role:'Customer Success Manager',start:'10 Mar 2026',day:'Day 11',progress:75},{name:fakeName(company,1),role:'Sales Development Rep',start:'03 Mar 2026',day:'Day 18',progress:90},{name:fakeName(company,2),role:'Frontend Developer',start:'17 Mar 2026',day:'Day 4',progress:30},{name:fakeName(company,3),role:'Marketing Executive',start:'17 Mar 2026',day:'Day 4',progress:25},{name:fakeName(company,4),role:'Support Specialist',start:'24 Feb 2026',day:'Day 25',progress:100},{name:fakeName(company,5),role:'Account Executive',start:'24 Feb 2026',day:'Day 25',progress:100},{name:fakeName(company,6),role:'Data Analyst',start:'21 Apr 2026',day:'Pending',progress:0},{name:fakeName(company,7),role:'Head of Partnerships',start:'07 Apr 2026',day:'Pending',progress:0}]
  const leaveReqs = [{name:fakeName(company,8),type:'Annual Leave',dates:'28 Mar – 1 Apr',days:'5 days'},{name:fakeName(company,9),type:'Sick Leave',dates:'21 Mar',days:'1 day'},{name:fakeName(company,10),type:'Annual Leave',dates:'7–11 Apr',days:'5 days'},{name:fakeName(company,11),type:'Parental',dates:'1 May – 31 Jul',days:'3 months'}]
  const probations = [{name:fakeName(company,4),date:'24 Mar 2026',manager:fakeName(company,12)},{name:fakeName(company,5),date:'24 Mar 2026',manager:fakeName(company,13)},{name:fakeName(company,1),date:'3 Apr 2026',manager:fakeName(company,13)}]
  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Employees" value={String(emp)} icon={Users} color="#0D9488"
          pieData={[{label:'Full-time',value:Math.round(emp*.8),color:'#0D9488'},{label:'Part-time',value:Math.round(emp*.12),color:'#6C3FC5'},{label:'Contractor',value:Math.round(emp*.08),color:'#374151'}]}
          barData={[{label:'Eng',value:42,color:'#0D9488'},{label:'Sales',value:38,color:'#6C3FC5'},{label:'CS',value:35,color:'#22C55E'},{label:'Mktg',value:28,color:'#F59E0B'},{label:'Ops',value:44,color:'#EF4444'}]} />
        <StatCard label="Active Onboardings" value={String(ob)} icon={CheckCircle2} color="#22C55E"
          pieData={[{label:'On track',value:6,color:'#22C55E'},{label:'Behind',value:2,color:'#EF4444'}]}
          barData={[{label:'Wk1',value:3,color:'#22C55E'},{label:'Wk2',value:5,color:'#22C55E'},{label:'Wk3',value:7,color:'#22C55E'},{label:'Wk4',value:ob,color:'#0D9488'}]} />
        <StatCard label="Leave Requests" value={String(lv)} icon={Calendar} color="#F59E0B"
          pieData={[{label:'Annual',value:8,color:'#F59E0B'},{label:'Sick',value:4,color:'#EF4444'},{label:'Other',value:2,color:'#374151'}]}
          barData={[{label:'Mon',value:2,color:'#F59E0B'},{label:'Tue',value:3,color:'#F59E0B'},{label:'Wed',value:4,color:'#F59E0B'},{label:'Thu',value:3,color:'#F59E0B'},{label:'Fri',value:2,color:'#F59E0B'}]} />
        <StatCard label="Overdue Reviews" value="3" icon={AlertCircle} color="#EF4444"
          pieData={[{label:'Overdue',value:3,color:'#EF4444'},{label:'On time',value:12,color:'#22C55E'}]}
          barData={[{label:'Jan',value:0,color:'#22C55E'},{label:'Feb',value:1,color:'#F59E0B'},{label:'Mar',value:3,color:'#EF4444'}]} />
      </div>

      {/* AI Summary */}
      <DeptAISummary dept="hr" portal="business" />

      {/* Quick Actions label — actions are in the QuickActionsBar above */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4B5563' }}>Quick Actions</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'New Starter', icon: UserPlus },
            { label: 'Leave Request', icon: FileText },
            { label: 'Offboarding', icon: Users },
            { label: 'Recruitment', icon: Handshake },
            { label: 'Performance Review', icon: Star },
            { label: 'Company Events', icon: Calendar },
            { label: 'Send Contract', icon: FileText },
            { label: 'Book Contractor', icon: Handshake },
            { label: 'Dept Insights', icon: BarChart3 },
          ].map(a => (
            <button key={a.label} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              <a.icon size={12} />{a.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Workflow Launcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="group flex flex-col gap-3 rounded-xl p-5 transition-all hover:border-[#374151]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)' }}>
              <Megaphone className="w-4 h-4" style={{ color: '#2DD4BF' }} />
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#2DD4BF' }} />
              <span className="text-xs font-mono" style={{ color: '#2DD4BF' }}>HR-EVENTS-01</span>
            </div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: '#F9FAFB' }}>Company Events — Team Events Researcher</div>
            <div className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>Describe your event, headcount, and budget — get ranked venue recommendations with ratings, prices, and a ready-to-send enquiry email.</div>
          </div>
          <div className="text-xs font-medium mt-auto" style={{ color: '#2DD4BF' }}>Launch workflow →</div>
        </div>
      </div>

      {/* Onboarding Tracker + Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>New Starter Onboarding Tracker</p></div>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Name','Role','Start Date','Day','Progress','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
            <tbody>{starters.map((s,i)=>{const sl=s.progress===100?'Complete':s.progress===0?'Pending':'Onboarding';const sc=s.progress===100?'#22C55E':s.progress===0?'#6B7280':'#0D9488';return(
              <tr key={i} style={{borderBottom:i<starters.length-1?'1px solid #111318':undefined}}>
                <td className="px-5 py-3 font-medium" style={{color:'#F9FAFB'}}>{s.name}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{s.role}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{s.start}</td>
                <td className="px-5 py-3 text-xs" style={{color:s.day==='Pending'?'#6B7280':'#F9FAFB'}}>{s.day}</td>
                <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'#1F2937'}}><div className="h-full rounded-full" style={{width:`${s.progress}%`,backgroundColor:s.progress===100?'#22C55E':s.progress>50?'#0D9488':'#F59E0B'}} /></div><span className="text-xs" style={{color:'#9CA3AF'}}>{s.progress}%</span></div></td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:`${sc}1a`,color:sc}}>{sl}</span></td>
              </tr>)})}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Leave Requests — Pending Approval</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>{leaveReqs.map((r,i)=>(<div key={i} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{r.name}</p><p className="text-xs" style={{color:'#6B7280'}}>{r.type} · {r.dates}</p></div><div className="flex items-center gap-2 shrink-0"><span className="text-xs" style={{color:'#9CA3AF'}}>{r.days}</span><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:'rgba(245,158,11,0.1)',color:'#F59E0B'}}>Pending</span></div></div>))}</div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Upcoming Probation Reviews</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>{probations.map((p,i)=>(<div key={i} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{p.name}</p><p className="text-xs" style={{color:'#6B7280'}}>{p.date}</p></div><div className="flex items-center gap-2 shrink-0"><span className="text-xs" style={{color:'#6B7280'}}>Manager: {p.manager}</span><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:'rgba(59,130,246,0.1)',color:'#3B82F6'}}>In Review</span></div></div>))}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountsView({ company }: { company: string }) {
  const overdue = fakeNum(7,company,'ov'), arr = fakeNum(504000,company,'arr'), cost = fakeNum(82000,company,'cost')
  const invoices = Array.from({length:6},(_,i)=>({company:fakeCompany(company,i+20),amount:`£${fakeNum(3200,company,'inv'+i).toLocaleString()}`,due:['14 Mar','22 Mar','31 Mar','07 Apr','15 Apr','28 Apr'][i],daysOverdue:['14d overdue','Due today','','','',''][i],status:['Overdue','Due today','Due in 8d','Sent','Sent','Draft'][i]}))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Outstanding Invoices" value={String(overdue)} icon={AlertCircle} color="#EF4444"
          pieData={[{label:'0-30d',value:3,color:'#F59E0B'},{label:'30-60d',value:2,color:'#EF4444'},{label:'60d+',value:2,color:'#7F1D1D'}]}
          barData={[{label:'Jan',value:5,color:'#EF4444'},{label:'Feb',value:6,color:'#EF4444'},{label:'Mar',value:overdue,color:'#DC2626'}]} />
        <StatCard label="Overdue Amount" value="£18,400" icon={DollarSign} color="#EF4444"
          pieData={[{label:'0-30d',value:8400,color:'#F59E0B'},{label:'30-60d',value:6200,color:'#EF4444'},{label:'60d+',value:3800,color:'#7F1D1D'}]}
          barData={[{label:'Jan',value:12000,color:'#EF4444'},{label:'Feb',value:15000,color:'#EF4444'},{label:'Mar',value:18400,color:'#DC2626'}]} />
        <StatCard label="Collected This Month" value="£42,800" icon={TrendingUp} color="#22C55E"
          pieData={[{label:'Subscriptions',value:85,color:'#22C55E'},{label:'Services',value:10,color:'#0D9488'},{label:'One-off',value:5,color:'#374151'}]}
          barData={[{label:'Jan',value:38000,color:'#22C55E'},{label:'Feb',value:41000,color:'#22C55E'},{label:'Mar',value:42800,color:'#0D9488'}]} />
        <StatCard label="Avg Days to Pay" value="18" icon={Clock} color="#F59E0B"
          pieData={[{label:'<14d',value:45,color:'#22C55E'},{label:'14-30d',value:35,color:'#F59E0B'},{label:'>30d',value:20,color:'#EF4444'}]}
          barData={[{label:'Jan',value:22,color:'#F59E0B'},{label:'Feb',value:20,color:'#F59E0B'},{label:'Mar',value:18,color:'#D97706'}]} />
      </div>
      <DeptAISummary dept="accounts" portal="business" />
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{l:'Chase Invoice',i:Receipt},{l:'Raise Invoice',i:DollarSign},{l:'Weekly Report',i:FileText},{l:'Payment Received',i:DollarSign},{l:'Xero Sync',i:RotateCcw},{l:'Run Payroll',i:Zap},{l:'Dept Insights',i:BarChart3}].map(a=>(
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Invoice Queue</p></div>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Company','Amount','Due Date','Days Overdue','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
            <tbody>{invoices.map((inv,i)=>(
              <tr key={i} style={{borderBottom:i<invoices.length-1?'1px solid #111318':undefined}}>
                <td className="px-5 py-3 font-medium" style={{color:'#F9FAFB'}}>{inv.company}</td>
                <td className="px-5 py-3" style={{color:'#9CA3AF'}}>{inv.amount}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#6B7280'}}>{inv.due}</td>
                <td className="px-5 py-3 text-xs" style={{color:inv.daysOverdue?'#EF4444':'#6B7280'}}>{inv.daysOverdue||'—'}</td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:inv.status==='Overdue'?'rgba(239,68,68,0.1)':inv.status==='Due today'?'rgba(245,158,11,0.1)':'rgba(13,148,136,0.1)',color:inv.status==='Overdue'?'#EF4444':inv.status==='Due today'?'#F59E0B':'#0D9488'}}>{inv.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Payments</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:fakeCompany(company,30),amount:'£4,200',date:'Today'},{name:fakeCompany(company,31),amount:'£8,900',date:'Yesterday'},{name:fakeCompany(company,32),amount:'£2,100',date:'2 days ago'}].map((p,i)=>(
                <div key={i} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{p.name}</p><p className="text-xs" style={{color:'#6B7280'}}>{p.date}</p></div><span className="text-xs font-bold" style={{color:'#22C55E'}}>{p.amount}</span></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Weekly Revenue</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{week:'This week',amount:'£12,400',vs:'+8%'},{week:'Last week',amount:'£11,500',vs:'+3%'},{week:'2 weeks ago',amount:'£11,200',vs:'+1%'}].map((w,i)=>(
                <div key={i} className="px-5 py-3 flex items-center justify-between"><span className="text-sm" style={{color:'#F9FAFB'}}>{w.week}</span><div className="flex items-center gap-2"><span className="text-xs font-bold" style={{color:'#F9FAFB'}}>{w.amount}</span><span className="text-xs" style={{color:'#22C55E'}}>{w.vs}</span></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SalesView({ company }: { company: string }) {
  const leads = fakeNum(34,company,'leads'), pipe = fakeNum(128000,company,'pipe'), wr = fakeNum(28,company,'wr')
  const deals = Array.from({length:8},(_,i)=>({name:fakeCompany(company,i+10),value:`£${(fakeNum(12000,company,'d'+i)*(i+1)/2).toLocaleString()}`,stage:['Discovery','Proposal','Negotiation','Verbal Yes','Discovery','Closed Won','Proposal','Discovery'][i],owner:fakeName(company,20+i),lastActivity:['Today','Yesterday','2 days ago','Today','3 days ago','1 week ago','Today','Yesterday'][i],score:[72,88,91,94,45,100,67,55][i]}))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open Deals" value={String(leads)} icon={Users} color="#6C3FC5"
          pieData={[{label:'Hot',value:8,color:'#EF4444'},{label:'Warm',value:16,color:'#F59E0B'},{label:'Cold',value:10,color:'#374151'}]}
          barData={[{label:'Inbound',value:18,color:'#6C3FC5'},{label:'Outbound',value:10,color:'#A78BFA'},{label:'Referral',value:6,color:'#7C3AED'}]} />
        <StatCard label="Pipeline Value" value={`£${pipe.toLocaleString()}`} icon={TrendingUp} color="#0D9488"
          pieData={[{label:'Discovery',value:25,color:'#374151'},{label:'Proposal',value:35,color:'#F59E0B'},{label:'Negotiation',value:25,color:'#0D9488'},{label:'Close',value:15,color:'#22C55E'}]}
          barData={[{label:'Jan',value:110000,color:'#0D9488'},{label:'Feb',value:118000,color:'#0D9488'},{label:'Mar',value:pipe,color:'#0F766E'}]} />
        <StatCard label="Win Rate" value={`${wr}%`} icon={Star} color="#F59E0B"
          pieData={[{label:'Won',value:wr,color:'#22C55E'},{label:'Lost',value:100-wr,color:'#374151'}]}
          barData={[{label:'Q3\'25',value:24,color:'#F59E0B'},{label:'Q4\'25',value:26,color:'#F59E0B'},{label:'Q1\'26',value:wr,color:'#D97706'}]} />
        <StatCard label="Hot Leads" value="8" icon={Target} color="#EF4444"
          pieData={[{label:'Hot',value:8,color:'#EF4444'},{label:'Warm',value:16,color:'#F59E0B'}]}
          barData={[{label:'Jan',value:5,color:'#EF4444'},{label:'Feb',value:6,color:'#EF4444'},{label:'Mar',value:8,color:'#DC2626'}]} />
      </div>
      <DeptAISummary dept="sales" portal="business" />
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{l:'New Deal',i:TrendingUp},{l:'Book Demo',i:Calendar},{l:'Send Proposal',i:Send},{l:'Log Call',i:FileText},{l:'New Lead',i:UserPlus},{l:'Dept Insights',i:BarChart3},{l:'Generate Leads',i:Zap}].map(a=>(
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Deal Pipeline</p></div>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Company','Stage','Value','Owner','Last Activity'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
            <tbody>{deals.map((d,i)=>(
              <tr key={i} style={{borderBottom:i<deals.length-1?'1px solid #111318':undefined}}>
                <td className="px-5 py-3 font-medium" style={{color:'#F9FAFB'}}>{d.name}</td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:d.stage==='Closed Won'?'rgba(34,197,94,0.12)':'rgba(13,148,136,0.1)',color:d.stage==='Closed Won'?'#22C55E':'#0D9488'}}>{d.stage}</span></td>
                <td className="px-5 py-3" style={{color:'#9CA3AF'}}>{d.value}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{d.owner}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#6B7280'}}>{d.lastActivity}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Hot Leads</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:fakeCompany(company,60),score:94,source:'Inbound — website demo'},{name:fakeCompany(company,61),score:88,source:'Referral — partner intro'},{name:fakeCompany(company,62),score:82,source:'Outbound — LinkedIn'}].map((l,i)=>(
                <div key={i} className="px-5 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{l.name}</p><span className="text-xs font-bold" style={{color:'#EF4444'}}>{l.score}%</span></div><p className="text-xs" style={{color:'#6B7280'}}>{l.source}</p></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Outreach Sequences</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:'Cold Outbound — Q1',sent:245,replied:18,meetings:4},{name:'Referral Follow-up',sent:32,replied:12,meetings:6},{name:'Lapsed Trial Win-back',sent:89,replied:7,meetings:2}].map((s,i)=>(
                <div key={i} className="px-5 py-3"><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{s.name}</p><p className="text-xs" style={{color:'#6B7280'}}>{s.sent} sent · {s.replied} replied · {s.meetings} meetings</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CRMView({ company }: { company: string }) { return <CRMViewV2 company={company} /> }

function _OldCRMView({ company }: { company: string }) {
  const [crmTab, setCrmTab] = useState<'dashboard'|'pipeline'|'contacts'|'intelligence'|'reports'>('dashboard')
  const customers = fakeNum(171, company, 'crmtotal')
  const mrr = fakeNum(28400, company, 'crmrr')
  const nps = fakeNum(67, company, 'crmnps')
  const pipelineValue = fakeNum(128000, company, 'crmPipe')
  const openDeals = fakeNum(18, company, 'crmDeals')
  const winRate = fakeNum(34, company, 'crmWr')

  const deals = Array.from({length:8},(_,i)=>({name:fakeCompany(company,i+30),contact:fakeName(company,i+30),value:fakeNum(8000,company,'cd'+i)*(i+1),stage:['Discovery','Qualified','Proposal','Negotiation','Verbal Yes','Discovery','Proposal','Closed Won'][i],score:[82,74,91,68,94,55,87,100][i],days:[3,7,12,18,2,5,22,0][i]}))

  const contacts = Array.from({length:6},(_,i)=>({name:fakeName(company,i+40),email:`${fakeName(company,i+40).toLowerCase().replace(' ','.')}@${fakeCompany(company,i+40).toLowerCase().replace(/\s/g,'')}.com`,company:fakeCompany(company,i+40),role:['CEO','Head of Sales','CTO','Marketing Director','COO','VP Engineering'][i],status:(['live','live','bounced','live','unknown','live'] as const)[i],score:[92,88,45,76,0,81][i]}))

  const churnRiskAccounts = [{name:fakeCompany(company,20),reason:'No login in 42 days',risk:91},{name:fakeCompany(company,21),reason:'Support tickets × 4',risk:78},{name:fakeCompany(company,22),reason:'Downgrade request sent',risk:65}]
  const renewals = [{name:fakeCompany(company,23),due:'Apr 12',arr:`£${fakeNum(14800,company,'ren1').toLocaleString()}`,health:'Critical'},{name:fakeCompany(company,24),due:'Apr 18',arr:`£${fakeNum(33400,company,'ren2').toLocaleString()}`,health:'At Risk'},{name:fakeCompany(company,25),due:'May 2',arr:`£${fakeNum(76000,company,'ren3').toLocaleString()}`,health:'Healthy'}]

  const STAGES = [{name:'Discovery',color:'#6B7280',count:4,value:24000},{name:'Qualified',color:'#3B82F6',count:3,value:32000},{name:'Proposal',color:'#8B5CF6',count:4,value:38000},{name:'Negotiation',color:'#F59E0B',count:2,value:22000},{name:'Verbal Yes',color:'#22C55E',count:1,value:12000}]

  return (
    <div className="space-y-4">
      {/* CRM Sub-navigation */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none" style={{borderBottom:'1px solid #1F2937'}}>
        {([['dashboard','Dashboard'],['pipeline','Pipeline'],['contacts','Contacts'],['intelligence','ARIA Intelligence'],['reports','Reports']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>setCrmTab(id)} className="px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap" style={{borderBottomColor:crmTab===id?'#8B5CF6':'transparent',color:crmTab===id?'#A78BFA':'#6B7280',backgroundColor:crmTab===id?'rgba(139,92,246,0.05)':'transparent'}}>{label}</button>
        ))}
      </div>

      {/* ──── DASHBOARD TAB ──── */}
      {crmTab==='dashboard'&&<div className="space-y-4">
        {/* ARIA Brief */}
        <div className="rounded-xl p-5" style={{background:'linear-gradient(135deg,#0F1019,#1a1035)',border:'1px solid #1E2035'}}>
          <div className="flex items-center gap-2 mb-2"><Sparkles size={14} style={{color:'#A78BFA'}}/><span className="text-xs font-semibold" style={{color:'#A78BFA'}}>ARIA Daily Brief</span></div>
          <p className="text-sm leading-relaxed" style={{color:'#D1D5DB'}}>Your pipeline is strong this week — £{pipelineValue.toLocaleString()} across {openDeals} open deals. {fakeCompany(company,30)} is your highest-scoring opportunity at 94%. Two deals have been in Negotiation for 18+ days — consider scheduling follow-ups. Win rate is trending up at {winRate}%.</p>
        </div>
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{l:'Pipeline Value',v:`£${pipelineValue.toLocaleString()}`,c:'#8B5CF6'},{l:'Open Deals',v:String(openDeals),c:'#3B82F6'},{l:'Win Rate',v:`${winRate}%`,c:'#22C55E'},{l:'ARIA Accuracy',v:'91%',c:'#F59E0B'}].map(k=>(
            <div key={k.l} className="rounded-xl p-4" style={{background:'#0F1019',border:'1px solid #1E2035'}}>
              <p className="text-xs mb-1" style={{color:'#6B7299'}}>{k.l}</p>
              <p className="text-xl font-black" style={{background:`linear-gradient(135deg,${k.c},#22D3EE)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{k.v}</p>
            </div>
          ))}
        </div>
        {/* Pipeline Health + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{background:'#0F1019',border:'1px solid #1E2035'}}>
            <p className="text-sm font-semibold mb-4" style={{color:'#F1F3FA'}}>Pipeline Health</p>
            <div className="space-y-3">{STAGES.map(s=>(<div key={s.name} className="flex items-center gap-3"><span className="text-xs w-20 shrink-0" style={{color:'#6B7299'}}>{s.name}</span><div className="flex-1 h-6 rounded-lg overflow-hidden" style={{backgroundColor:'#1E2035'}}><div className="h-full rounded-lg flex items-center px-2" style={{width:`${Math.min(100,(s.value/40000)*100)}%`,backgroundColor:s.color}}><span className="text-[10px] font-bold text-white">{s.count} · £{(s.value/1000).toFixed(0)}k</span></div></div></div>))}</div>
          </div>
          <div className="rounded-xl p-5" style={{background:'#0F1019',border:'1px solid #1E2035'}}>
            <p className="text-sm font-semibold mb-4" style={{color:'#F1F3FA'}}>Top Deals by ARIA Score</p>
            <div className="space-y-2">{deals.filter(d=>d.stage!=='Closed Won').sort((a,b)=>b.score-a.score).slice(0,5).map(d=>(
              <div key={d.name} className="flex items-center gap-3 p-2.5 rounded-lg" style={{background:'#121320'}}>
                <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="none" stroke="#1E2035" strokeWidth="3"/><circle cx="18" cy="18" r="14" fill="none" stroke={d.score>=80?'#10B981':d.score>=60?'#8B5CF6':'#EF4444'} strokeWidth="3" strokeDasharray={`${(d.score/100)*87.96} 87.96`} strokeLinecap="round" transform="rotate(-90 18 18)"/><text x="18" y="18" textAnchor="middle" dominantBaseline="central" fill="#F1F3FA" fontSize="10" fontWeight="600">{d.score}</text></svg>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{color:'#F1F3FA'}}>{d.name}</p><p className="text-xs" style={{color:'#6B7299'}}>{d.contact}</p></div>
                <span className="text-sm font-semibold shrink-0" style={{background:'linear-gradient(135deg,#8B5CF6,#22D3EE)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>£{d.value.toLocaleString()}</span>
              </div>
            ))}</div>
          </div>
        </div>
        {/* Churn + Renewals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl overflow-hidden" style={{backgroundColor:'#0F1019',border:'1px solid #1E2035'}}>
            <div className="px-5 py-4" style={{borderBottom:'1px solid #1E2035'}}><p className="text-sm font-semibold" style={{color:'#F1F3FA'}}>Churn Risk Alerts</p></div>
            {churnRiskAccounts.map((r,i)=>(<div key={i} className="flex items-center gap-3 px-5 py-3" style={{borderBottom:i<churnRiskAccounts.length-1?'1px solid #1E2035':undefined}}><AlertCircle size={14} style={{color:'#EF4444',flexShrink:0}}/><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{color:'#F1F3FA'}}>{r.name}</p><p className="text-xs" style={{color:'#6B7299'}}>{r.reason}</p></div><span className="text-xs font-bold shrink-0" style={{color:r.risk>=80?'#EF4444':'#F59E0B'}}>{r.risk}%</span></div>))}
          </div>
          <div className="rounded-xl overflow-hidden" style={{backgroundColor:'#0F1019',border:'1px solid #1E2035'}}>
            <div className="px-5 py-4" style={{borderBottom:'1px solid #1E2035'}}><p className="text-sm font-semibold" style={{color:'#F1F3FA'}}>Upcoming Renewals</p></div>
            {renewals.map((r,i)=>(<div key={i} className="flex items-center gap-3 px-5 py-3" style={{borderBottom:i<renewals.length-1?'1px solid #1E2035':undefined}}><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{color:'#F1F3FA'}}>{r.name}</p><p className="text-xs" style={{color:'#6B7299'}}>Due {r.due} · {r.arr}</p></div><span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{backgroundColor:r.health==='Healthy'?'rgba(34,197,94,0.1)':r.health==='At Risk'?'rgba(245,158,11,0.12)':'rgba(239,68,68,0.12)',color:r.health==='Healthy'?'#22C55E':r.health==='At Risk'?'#F59E0B':'#EF4444'}}>{r.health}</span></div>))}
          </div>
        </div>
      </div>}

      {/* ──── PIPELINE TAB ──── */}
      {crmTab==='pipeline'&&<div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{color:'#6B7299'}}>{deals.filter(d=>d.stage!=='Closed Won').length} active deals · £{deals.filter(d=>d.stage!=='Closed Won').reduce((s,d)=>s+d.value,0).toLocaleString()} in pipeline</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map(stage=>(
            <div key={stage.name} className="rounded-xl p-4 shrink-0" style={{width:240,background:'#0F1019',border:'1px solid #1E2035'}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:stage.color}}/><span className="text-xs font-semibold" style={{color:'#F1F3FA'}}>{stage.name}</span></div>
                <span className="text-xs" style={{color:'#6B7299'}}>£{(stage.value/1000).toFixed(0)}k</span>
              </div>
              <div className="space-y-2">{deals.filter(d=>d.stage===stage.name).map(d=>(
                <div key={d.name} className="rounded-lg p-3" style={{background:'#121320',border:'1px solid #1E2035'}}>
                  <p className="text-xs font-semibold truncate" style={{color:'#F1F3FA'}}>{d.name}</p>
                  <p className="text-[10px]" style={{color:'#6B7299'}}>{d.contact} · £{d.value.toLocaleString()}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px]" style={{color:'#6B7299'}}>{d.days}d in stage</span>
                    <span className="text-[10px] font-bold" style={{color:d.score>=80?'#10B981':d.score>=60?'#8B5CF6':'#EF4444'}}>ARIA {d.score}</span>
                  </div>
                </div>
              ))}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* ──── CONTACTS TAB ──── */}
      {crmTab==='contacts'&&<div className="space-y-4">
        <p className="text-sm" style={{color:'#6B7299'}}>{contacts.length} contacts · {contacts.filter(c=>c.status==='live').length} verified</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map(c=>{const sc=c.status==='live'?'#10B981':c.status==='bounced'?'#EF4444':'#6B7299';return(
            <div key={c.name} className="rounded-xl p-4" style={{background:'#0F1019',border:'1px solid #1E2035'}}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{background:'#1E2035',color:'#A78BFA'}}>{c.name.split(' ').map(w=>w[0]).join('')}</div>
                <div className="min-w-0"><p className="text-sm font-semibold truncate" style={{color:'#F1F3FA'}}>{c.name}</p><p className="text-xs truncate" style={{color:'#6B7299'}}>{c.role}</p></div>
              </div>
              <p className="text-xs truncate mb-1" style={{color:'#6B7299'}}>{c.company}</p>
              <p className="text-xs truncate mb-2" style={{color:'#6B7299'}}>{c.email}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:sc}}/><span className="text-[10px]" style={{color:sc}}>{c.status}</span></div>
                {c.score>0&&<span className="text-[10px] font-bold" style={{color:'#A78BFA'}}>ARIA {c.score}</span>}
              </div>
            </div>
          )})}
        </div>
      </div>}

      {/* ──── INTELLIGENCE TAB ──── */}
      {crmTab==='intelligence'&&<div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4" style={{minHeight:400}}>
          {/* Insights panel */}
          <div className="rounded-xl p-5" style={{background:'#0F1019',border:'1px solid #1E2035'}}>
            <div className="flex items-center gap-2 mb-4"><Sparkles size={14} style={{color:'#A78BFA'}}/><span className="text-sm font-semibold" style={{color:'#F1F3FA'}}>ARIA Insights</span></div>
            <div className="space-y-3">
              {[{icon:'🎯',title:'Pipeline at risk',desc:`£${Math.round(pipelineValue*0.15).toLocaleString()} at risk — 2 deals stalled in Negotiation`,color:'#EF4444'},{icon:'📈',title:'Win rate improving',desc:`${winRate}% this quarter, up from ${winRate-4}% last quarter`,color:'#22C55E'},{icon:'⚡',title:'Quick win available',desc:`${fakeCompany(company,30)} (ARIA 94) — ready for close call`,color:'#8B5CF6'},{icon:'⏰',title:'Follow-up needed',desc:`${fakeCompany(company,33)} — 18 days with no activity`,color:'#F59E0B'}].map(insight=>(
                <div key={insight.title} className="rounded-lg p-3" style={{background:'#121320',borderLeft:`3px solid ${insight.color}`}}>
                  <p className="text-xs font-semibold" style={{color:'#F1F3FA'}}>{insight.icon} {insight.title}</p>
                  <p className="text-[10px] mt-1" style={{color:'#6B7299'}}>{insight.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4" style={{borderTop:'1px solid #1E2035'}}>
              <p className="text-xs font-semibold mb-2" style={{color:'#6B7299'}}>Pipeline Stats</p>
              {[{l:'Win Rate',v:`${winRate}%`},{l:'At Risk Value',v:`£${Math.round(pipelineValue*0.15).toLocaleString()}`},{l:'Forecast',v:`£${Math.round(pipelineValue*0.35).toLocaleString()}`}].map(s=>(
                <div key={s.l} className="flex justify-between py-1"><span className="text-xs" style={{color:'#6B7299'}}>{s.l}</span><span className="text-xs font-bold" style={{color:'#F1F3FA'}}>{s.v}</span></div>
              ))}
            </div>
          </div>
          {/* ARIA Chat */}
          <div className="rounded-xl flex flex-col" style={{background:'#0F1019',border:'1px solid #1E2035'}}>
            <div className="flex items-center gap-2 px-5 py-4" style={{borderBottom:'1px solid #1E2035'}}><Sparkles size={14} style={{color:'#A78BFA'}}/><span className="text-sm font-semibold" style={{color:'#F1F3FA'}}>ARIA Assistant</span><span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:'rgba(139,92,246,0.15)',color:'#A78BFA'}}>AI</span></div>
            <div className="flex-1 p-5 space-y-4">
              <div className="flex gap-3"><div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{background:'linear-gradient(135deg,#8B5CF6,#22D3EE)'}}><Sparkles size={12} color="#fff"/></div><div className="rounded-xl p-3 max-w-[80%]" style={{background:'#121320'}}><p className="text-xs" style={{color:'#D1D5DB'}}>Hi! I&apos;m ARIA, your AI pipeline assistant. I can analyse deals, suggest next actions, forecast revenue, and identify risks. What would you like to know?</p></div></div>
              <div className="flex gap-3 justify-end"><div className="rounded-xl p-3 max-w-[80%]" style={{background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.25)'}}><p className="text-xs" style={{color:'#E0D4FC'}}>Which deals are most likely to close this month?</p></div></div>
              <div className="flex gap-3"><div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{background:'linear-gradient(135deg,#8B5CF6,#22D3EE)'}}><Sparkles size={12} color="#fff"/></div><div className="rounded-xl p-3 max-w-[80%]" style={{background:'#121320'}}><p className="text-xs" style={{color:'#D1D5DB'}}>Based on ARIA scores, your top 3 most likely to close are: <strong>{fakeCompany(company,34)}</strong> (94%), <strong>{fakeCompany(company,30)}</strong> (91%), and <strong>{fakeCompany(company,36)}</strong> (87%). Combined value: £{(fakeNum(8000,company,'cd4')*5+fakeNum(8000,company,'cd0')+fakeNum(8000,company,'cd6')*7).toLocaleString()}. I recommend scheduling close calls for all three this week.</p></div></div>
            </div>
            <div className="px-5 py-3 flex gap-2" style={{borderTop:'1px solid #1E2035'}}><input className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{background:'#121320',border:'1px solid #1E2035',color:'#F1F3FA'}} placeholder="Ask ARIA about your pipeline..." disabled/><button className="px-4 py-2 rounded-lg text-xs font-semibold" style={{background:'#8B5CF6',color:'#fff'}}>Send</button></div>
          </div>
        </div>
      </div>}

      {/* ──── REPORTS TAB ──── */}
      {crmTab==='reports'&&<div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{l:'Win Rate',v:`${winRate}%`,d:'vs 30% last quarter',c:'#22C55E'},{l:'Revenue Forecast',v:`£${Math.round(pipelineValue*0.35).toLocaleString()}`,d:'weighted pipeline',c:'#8B5CF6'},{l:'Avg Deal Velocity',v:'14 days',d:'avg time in pipeline',c:'#3B82F6'},{l:'Value Saved by ARIA',v:'£381k',d:'ghost deals flagged',c:'#F59E0B'}].map(s=>(
            <div key={s.l} className="rounded-xl p-4" style={{background:'#0F1019',border:'1px solid #1E2035'}}>
              <p className="text-xs mb-1" style={{color:'#6B7299'}}>{s.l}</p>
              <p className="text-xl font-black" style={{color:s.c}}>{s.v}</p>
              <p className="text-[10px] mt-0.5" style={{color:'#6B7299'}}>{s.d}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{background:'#0F1019',border:'1px solid #1E2035'}}>
          <p className="text-sm font-semibold mb-4" style={{color:'#F1F3FA'}}>Competitor Scorecard</p>
          <table className="w-full text-xs"><thead><tr style={{borderBottom:'1px solid #1E2035'}}>{['Feature','Lumio CRM','HubSpot','Pipedrive','Salesforce'].map(h=><th key={h} className="text-left px-3 py-2 font-semibold" style={{color:'#6B7299'}}>{h}</th>)}</tr></thead>
            <tbody>{[{f:'AI Deal Scoring',l:'✅ ARIA',h:'❌',p:'❌',s:'⚠️ Einstein $$'},{f:'Auto-enrichment',l:'✅ Built-in',h:'⚠️ Add-on',p:'❌',s:'⚠️ Add-on'},{f:'Pipeline AI Chat',l:'✅ ARIA Chat',h:'❌',p:'❌',s:'❌'},{f:'Ghost Deal Detection',l:'✅',h:'❌',p:'❌',s:'❌'},{f:'Price (per seat)',l:'✅ Included',h:'⚠️ £45+',p:'⚠️ £15+',s:'⚠️ £60+'}].map(r=>(
              <tr key={r.f} style={{borderBottom:'1px solid #1E2035'}}><td className="px-3 py-2 font-medium" style={{color:'#F1F3FA'}}>{r.f}</td><td className="px-3 py-2" style={{color:'#22C55E'}}>{r.l}</td><td className="px-3 py-2" style={{color:'#6B7299'}}>{r.h}</td><td className="px-3 py-2" style={{color:'#6B7299'}}>{r.p}</td><td className="px-3 py-2" style={{color:'#6B7299'}}>{r.s}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>}
    </div>
  )
}

function MarketingView({ company }: { company: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Social Posts This Month', value: '24', trend: '+6% vs last month', icon: Send },
          { label: 'Email Open Rate', value: '34.2%', trend: '+2.1% vs last campaign', icon: Megaphone },
          { label: 'New Leads', value: '47', trend: '+12% vs last month', icon: Target },
          { label: 'MQL Count', value: '18', trend: '+5 this month', icon: TrendingUp },
        ].map(s => {
          const SIcon = s.icon
          return (
            <div key={s.label} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</span>
                  <span className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{s.value}</span>
                  <span className="text-xs mt-1" style={{ color: '#10B981' }}>{s.trend}</span>
                </div>
                <SIcon size={18} style={{ color: '#6B7299' }} />
              </div>
            </div>
          )
        })}
      </div>
      <DeptAISummary dept="marketing" portal="business" />
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{l:'Create Post',i:Send},{l:'Book Event',i:Calendar},{l:'New Campaign',i:Megaphone},{l:'Case Study',i:FileText},{l:'Webinar Setup',i:Calendar},{l:'Lead Report',i:Target},{l:'Dept Insights',i:BarChart3}].map(a=>(
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
          ))}
        </div>
      </div>
      {/* Marketing Events Workflow Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="group flex flex-col gap-3 rounded-xl p-5 transition-all hover:border-[#374151]" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)' }}><Megaphone className="w-4 h-4" style={{ color: '#2DD4BF' }} /></div>
            <div className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" style={{ color: '#2DD4BF' }} /><span className="text-xs font-mono" style={{ color: '#2DD4BF' }}>MKT-EVENTS-01</span></div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: '#F9FAFB' }}>Marketing Events — Event Planner & Promoter</div>
            <div className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>Describe your event type, audience, and goals — get a full event plan with venue options, promotional copy, and a ready-to-send invite sequence.</div>
          </div>
          <div className="text-xs font-medium mt-auto" style={{ color: '#2DD4BF' }}>Launch workflow →</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Content Queue</p></div>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Campaign','Sent','Open Rate','Clicks','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
            <tbody>{[
              ['Q1 Product Launch Email','2,840','44%','312','Active'],
              ['LinkedIn Lead Gen — Edu','—','—','891 impressions','Active'],
              ['Trial Nurture Sequence','456','38%','89','Active'],
              ['Webinar Follow-up','1,240','52%','208','Completed'],
              ['Competitor Win-back','312','29%','44','Paused'],
            ].map((r,i)=>(
              <tr key={i} style={{borderBottom:i<4?'1px solid #111318':undefined}}>
                {r.map((c,j)=>(<td key={j} className="px-5 py-3" style={{color:j===0?'#F9FAFB':'#9CA3AF'}}>{j===4?<span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:c==='Active'?'rgba(13,148,136,0.1)':c==='Completed'?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)',color:c==='Active'?'#0D9488':c==='Completed'?'#22C55E':'#F59E0B'}}>{c}</span>:c}</td>))}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Campaign Performance</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:'Q1 EdTech Nurture',sent:'3,240',open:'36.4%',ctr:'8.2%',status:'Complete',sc:'#22C55E'},{name:'Trial Follow-up Flow',sent:'412',open:'44.1%',ctr:'12.8%',status:'Active',sc:'#0D9488'},{name:'Renewal Reminder',sent:'87',open:'61.2%',ctr:'28.4%',status:'Active',sc:'#0D9488'},{name:'March Product Update',sent:'—',open:'—',ctr:'—',status:'Scheduled',sc:'#F59E0B'}].map((c,i)=>(
                <div key={i} className="px-5 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{c.name}</p><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:`${c.sc}1a`,color:c.sc}}>{c.status}</span></div><p className="text-xs" style={{color:'#6B7280'}}>Sent: {c.sent} · Open: {c.open} · CTR: {c.ctr}</p></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Top Leads by Score</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:'Rachel Fox',company:'Lakewood Academy',score:94,source:'Webinar'},{name:'James Harlow',company:'Fernview College',score:88,source:'Inbound'},{name:'Sarah Mitchell',company:'Torchbearer Trust',score:82,source:'LinkedIn'},{name:'Dan Marsh',company:'Brightfields MAT',score:76,source:'Referral'},{name:'Marcus Chen',company:'Starling Schools',score:71,source:'Cold'}].map((l,i)=>(
                <div key={i} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{l.name}</p><p className="text-xs" style={{color:'#6B7280'}}>{l.company} · {l.source}</p></div><span className="text-xs font-bold px-2 py-0.5 rounded" style={{backgroundColor:'rgba(13,148,136,0.1)',color:'#0D9488'}}>{l.score}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrialsView({ company }: { company: string }) {
  const active = fakeNum(23,company,'tr'), converting = fakeNum(8,company,'cv')
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Trials', value: String(active), trend: '+3 this week', icon: FlaskConical, color: '#6C3FC5' },
          { label: 'Trials Ending This Week', value: '5', trend: '+2 vs last week', icon: AlertCircle, color: '#EF4444' },
          { label: 'Conversion Rate', value: '62%', trend: '+4% vs last quarter', icon: TrendingUp, color: '#22C55E' },
          { label: 'Avg Trial Length', value: '14d', trend: '-2d vs last quarter', icon: Clock, color: '#0D9488' },
        ].map(s => {
          const SIcon = s.icon
          return (
            <div key={s.label} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</span>
                  <span className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{s.value}</span>
                  <span className="text-xs mt-1" style={{ color: '#10B981' }}>{s.trend}</span>
                </div>
                <SIcon size={18} style={{ color: '#6B7299' }} />
              </div>
            </div>
          )
        })}
      </div>
      <DeptAISummary dept="trials" portal="business" />
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{l:'Admin Portal',i:Users},{l:'New Trial',i:FlaskConical},{l:'Extend Trial',i:Clock},{l:'Convert to Customer',i:UserPlus},{l:'End Trial',i:AlertCircle},{l:'Send Day 3 Email',i:Send},{l:'Send Day 7 Email',i:Send},{l:'Dept Insights',i:BarChart3}].map(a=>(
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Active Trial Workspaces</p></div>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Company','Started','Days Left','Dept Focus','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
            <tbody>{Array.from({length:6},(_,i)=>[fakeCompany(company,i+30),['14 Mar','10 Mar','8 Mar','5 Mar','2 Mar','28 Feb'][i],['12','8','6','3','1','Expiring today'][i],['HR, Sales','All','Finance, Ops','Sales','HR','All'][i],['Active','Active','Active','Active','Expiring','Expiring'][i]]).map((r,i)=>(
              <tr key={i} style={{borderBottom:i<5?'1px solid #111318':undefined}}>
                {r.map((c,j)=>(<td key={j} className="px-5 py-3" style={{color:j===0?'#F9FAFB':'#9CA3AF'}}>{j===4?<span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:c==='Active'?'rgba(13,148,136,0.1)':'rgba(239,68,68,0.1)',color:c==='Active'?'#0D9488':'#EF4444'}}>{c}</span>:c}</td>))}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Trials Ending Soon</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:'Starling Schools',contact:'Maria Olsen',days:'2 days',eng:'High'},{name:'Northpoint Primary',contact:'Jake Burns',days:'4 days',eng:'Medium'},{name:'Helix Education',contact:'Priya Shah',days:'4 days',eng:'Low'},{name:'Calibre Learning',contact:'Owen James',days:'1 day',eng:'High'}].map((t,i)=>(
                <div key={i} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{t.name}</p><p className="text-xs" style={{color:'#6B7280'}}>{t.contact} · Ends in {t.days}</p><p className="text-xs" style={{color:'#6B7280'}}>Engagement: {t.eng}</p></div><span className="text-xs px-2 py-0.5 rounded shrink-0" style={{backgroundColor:'rgba(239,68,68,0.1)',color:'#EF4444'}}>Ending</span></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Conversion Opportunities</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:'Lakewood Academy',reason:'High engagement, Day 13',badge:'Active',bc:'rgba(13,148,136,0.1)',c:'#0D9488'},{name:'Torchbearer Trust',reason:'Demo attended, Day 6',badge:'Active',bc:'rgba(13,148,136,0.1)',c:'#0D9488'},{name:'Calibre Learning',reason:'Day 29 — ready to convert',badge:'Ending',bc:'rgba(239,68,68,0.1)',c:'#EF4444'},{name:'Apex Tutors',reason:'Convert call booked',badge:'Converted',bc:'rgba(13,148,136,0.1)',c:'#0D9488'}].map((o,i)=>(
                <div key={i} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{o.name}</p><p className="text-xs" style={{color:'#6B7280'}}>{o.reason}</p></div><span className="text-xs px-2 py-0.5 rounded shrink-0" style={{backgroundColor:o.bc,color:o.c}}>{o.badge}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OpsView({ company }: { company: string }) {
  const orders = fakeNum(14,company,'po'), ls = fakeNum(6,company,'ls'), inv = fakeNum(28400,company,'inv')
  const poList = Array.from({length:5},(_,i)=>({po:`PO-2026-${88-i}`,supplier:['Acme Office Supplies','TechPro Direct','PrintWave Ltd','CloudLicence Group','Ergonomics Now'][i],value:`£${fakeNum(3000,company,'pov'+i).toLocaleString()}`,status:['In Transit','Delivered','Pending','Delivered','Overdue'][i]}))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open Purchase Orders" value={String(orders)} icon={Package} color="#F59E0B"
          pieData={[{label:'In Transit',value:5,color:'#0D9488'},{label:'Pending',value:6,color:'#F59E0B'},{label:'Overdue',value:3,color:'#EF4444'}]}
          barData={[{label:'Jan',value:10,color:'#F59E0B'},{label:'Feb',value:12,color:'#F59E0B'},{label:'Mar',value:orders,color:'#D97706'}]} />
        <StatCard label="Low Stock Items" value={String(ls)} icon={AlertCircle} color="#EF4444"
          pieData={[{label:'Critical',value:2,color:'#EF4444'},{label:'Low',value:4,color:'#F59E0B'}]}
          barData={[{label:'Week 1',value:3,color:'#EF4444'},{label:'Week 2',value:4,color:'#EF4444'},{label:'Week 3',value:5,color:'#EF4444'},{label:'Week 4',value:ls,color:'#DC2626'}]} />
        <StatCard label="Pending Deliveries" value="4" icon={Clock} color="#0D9488"
          pieData={[{label:'Today',value:1,color:'#0D9488'},{label:'This week',value:2,color:'#22C55E'},{label:'Next week',value:1,color:'#374151'}]}
          barData={[{label:'Jan',value:6,color:'#0D9488'},{label:'Feb',value:5,color:'#0D9488'},{label:'Mar',value:4,color:'#0F766E'}]} />
        <StatCard label="Supplier Invoices Due" value={`£${inv.toLocaleString()}`} icon={Receipt} color="#6C3FC5"
          pieData={[{label:'This week',value:60,color:'#EF4444'},{label:'This month',value:30,color:'#F59E0B'},{label:'Next month',value:10,color:'#22C55E'}]}
          barData={[{label:'Jan',value:24000,color:'#6C3FC5'},{label:'Feb',value:26000,color:'#6C3FC5'},{label:'Mar',value:inv,color:'#7C3AED'}]} />
      </div>
      <DeptAISummary dept="operations" portal="business" />
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{l:'Raise PO',i:Package},{l:'Update Stock',i:BarChart3},{l:'Supplier Invoice',i:Receipt},{l:'New Order',i:Plus},{l:'Restock Alert',i:AlertCircle},{l:'Supplier Contact',i:Handshake},{l:'Delivery Log',i:FileText},{l:'Stock Report',i:FileText},{l:'Book Stock',i:Package},{l:'Admin Portal',i:Monitor},{l:'Dept Insights',i:BarChart3}].map(a=>(
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
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
      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Low Stock Alerts</p></div>
          <div className="divide-y" style={{borderColor:'#1F2937'}}>
            {[{item:'A4 Paper (White)',stock:'2 boxes',level:'Critical'},{item:'Printer Toner (Black)',stock:'1 unit',level:'Critical'},{item:'Hand Sanitiser',stock:'4 bottles',level:'Low'},{item:'USB-C Chargers',stock:'1 unit',level:'Low'}].map((s,i)=>(
              <div key={i} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{s.item}</p><p className="text-xs" style={{color:'#6B7280'}}>{s.stock} remaining</p></div><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:s.level==='Critical'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)',color:s.level==='Critical'?'#EF4444':'#F59E0B'}}>{s.level}</span></div>
            ))}
          </div>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Upcoming Deliveries</p></div>
          <div className="divide-y" style={{borderColor:'#1F2937'}}>
            {[{supplier:'TechPro Direct',date:'Tomorrow',items:'3 items'},{supplier:'Acme Office Supplies',date:'Fri 21 Mar',items:'5 items'},{supplier:'CloudLicence Group',date:'Mon 24 Mar',items:'1 licence renewal'}].map((d,i)=>(
              <div key={i} className="px-5 py-3"><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{d.supplier}</p><p className="text-xs" style={{color:'#6B7280'}}>{d.date} · {d.items}</p></div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

function SupportView({ company }: { company: string }) {
  const tk = fakeNum(18,company,'tk')
  const tickets = [
    {id:'TKT-2891',subject:'Login issue',customer:fakeCompany(company,40),priority:'P1',assigned:'Alex T.',age:'2h',status:'Open'},
    {id:'TKT-2889',subject:'Export fails',customer:fakeCompany(company,41),priority:'P2',assigned:'Priya K.',age:'6h',status:'In Progress'},
    {id:'TKT-2884',subject:'Data import',customer:fakeCompany(company,42),priority:'P2',assigned:'James W.',age:'1d',status:'Waiting'},
    {id:'TKT-2881',subject:'Billing query',customer:fakeCompany(company,43),priority:'P3',assigned:'Rachel S.',age:'2d',status:'Open'},
    {id:'TKT-2878',subject:'SSO config',customer:fakeCompany(company,44),priority:'P2',assigned:'Oliver B.',age:'3d',status:'In Progress'},
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open Tickets" value={String(tk)} icon={Headphones} color="#EF4444"
          pieData={[{label:'P1',value:2,color:'#EF4444'},{label:'P2',value:6,color:'#F59E0B'},{label:'P3',value:10,color:'#374151'}]}
          barData={[{label:'Mon',value:4,color:'#EF4444'},{label:'Tue',value:6,color:'#EF4444'},{label:'Wed',value:5,color:'#EF4444'},{label:'Thu',value:7,color:'#EF4444'},{label:'Fri',value:3,color:'#EF4444'}]} />
        <StatCard label="Avg Response Time" value="4h" icon={Clock} color="#F59E0B"
          pieData={[{label:'<2h',value:30,color:'#22C55E'},{label:'2-8h',value:50,color:'#F59E0B'},{label:'>8h',value:20,color:'#EF4444'}]}
          barData={[{label:'Jan',value:5,color:'#F59E0B'},{label:'Feb',value:4,color:'#F59E0B'},{label:'Mar',value:4,color:'#D97706'}]} />
        <StatCard label="CSAT Score" value="91%" icon={Star} color="#22C55E"
          pieData={[{label:'Happy',value:91,color:'#22C55E'},{label:'Neutral',value:6,color:'#F59E0B'},{label:'Unhappy',value:3,color:'#EF4444'}]}
          barData={[{label:'Q3',value:88,color:'#22C55E'},{label:'Q4',value:90,color:'#22C55E'},{label:'Q1',value:91,color:'#0D9488'}]} />
        <StatCard label="Resolved Today" value="6" icon={CheckCircle2} color="#0D9488"
          pieData={[{label:'P1',value:1,color:'#EF4444'},{label:'P2',value:3,color:'#F59E0B'},{label:'P3',value:2,color:'#374151'}]}
          barData={[{label:'Mon',value:5,color:'#0D9488'},{label:'Tue',value:7,color:'#0D9488'},{label:'Wed',value:6,color:'#0F766E'}]} />
      </div>
      <DeptAISummary dept="support" portal="business" />
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{l:'New Ticket',i:Headphones},{l:'Assign Agent',i:Users},{l:'Escalate',i:AlertCircle},{l:'SLA Report',i:FileText},{l:'Canned Response',i:Send},{l:'Dept Insights',i:BarChart3}].map(a=>(
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Helpdesk Queue</p></div>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Ticket #','Subject','Customer','Priority','Assigned','Age','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
            <tbody>{tickets.map((t,i)=>(
              <tr key={i} style={{borderBottom:i<tickets.length-1?'1px solid #111318':undefined}}>
                <td className="px-5 py-3 font-mono text-xs" style={{color:'#9CA3AF'}}>{t.id}</td>
                <td className="px-5 py-3 font-medium" style={{color:'#F9FAFB'}}>{t.subject}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{t.customer}</td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:t.priority==='P1'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)',color:t.priority==='P1'?'#EF4444':'#F59E0B'}}>{t.priority}</span></td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{t.assigned}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#6B7280'}}>{t.age}</td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:'rgba(13,148,136,0.1)',color:'#0D9488'}}>{t.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Live Chat — Active</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:fakeName(company,30),topic:'Billing question',wait:'2 min',agent:'Rachel S.'},{name:fakeName(company,31),topic:'Feature request',wait:'5 min',agent:'Alex T.'}].map((c,i)=>(
                <div key={i} className="px-5 py-3"><div className="flex items-center justify-between mb-1"><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{c.name}</p><span className="text-xs" style={{color:'#22C55E'}}>Live</span></div><p className="text-xs" style={{color:'#6B7280'}}>{c.topic} · {c.agent} · {c.wait}</p></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Operations Today</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{label:'Tickets created',value:'8'},{label:'Resolved',value:'6'},{label:'Avg first response',value:'12 min'},{label:'Escalations',value:'1'}].map((s,i)=>(
                <div key={i} className="px-5 py-2.5 flex items-center justify-between"><span className="text-xs" style={{color:'#9CA3AF'}}>{s.label}</span><span className="text-xs font-bold" style={{color:'#F9FAFB'}}>{s.value}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SuccessView({ company }: { company: string }) {
  const cu = fakeNum(181,company,'cu')
  const accounts = Array.from({length:6},(_,i)=>({name:fakeCompany(company,i+50),score:[42,78,91,34,88,62][i],qbr:['Apr 2','Apr 15','May 1','Mar 28','Apr 8','May 12'][i],renewal:['Jun','Aug','Oct','May','Sep','Jul'][i],csm:fakeName(company,i+8).split(' ')[0],rag:(['red','amber','green','red','green','amber'] as const)[i]}))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Customers" value={String(cu)} icon={Users} color="#0D9488"
          pieData={[{label:'Green',value:Math.round(cu*.65),color:'#22C55E'},{label:'Amber',value:Math.round(cu*.22),color:'#F59E0B'},{label:'Red',value:Math.round(cu*.13),color:'#EF4444'}]}
          barData={[{label:'Jan',value:168,color:'#0D9488'},{label:'Feb',value:174,color:'#0D9488'},{label:'Mar',value:cu,color:'#0F766E'}]} />
        <StatCard label="Green RAG" value={String(Math.round(cu*.65))} icon={CheckCircle2} color="#22C55E"
          pieData={[{label:'Green',value:65,color:'#22C55E'},{label:'Other',value:35,color:'#374151'}]}
          barData={[{label:'Jan',value:108,color:'#22C55E'},{label:'Feb',value:112,color:'#22C55E'},{label:'Mar',value:Math.round(cu*.65),color:'#0D9488'}]} />
        <StatCard label="Amber RAG" value={String(Math.round(cu*.22))} icon={AlertCircle} color="#F59E0B"
          pieData={[{label:'Declining usage',value:15,color:'#F59E0B'},{label:'Overdue renewal',value:8,color:'#EF4444'},{label:'Low NPS',value:8,color:'#374151'}]}
          barData={[{label:'Jan',value:28,color:'#F59E0B'},{label:'Feb',value:31,color:'#F59E0B'},{label:'Mar',value:Math.round(cu*.22),color:'#D97706'}]} />
        <StatCard label="Red RAG" value={String(Math.round(cu*.13))} icon={AlertCircle} color="#EF4444"
          pieData={[{label:'Churn risk',value:12,color:'#EF4444'},{label:'No contact',value:11,color:'#7F1D1D'}]}
          barData={[{label:'Jan',value:20,color:'#EF4444'},{label:'Feb',value:22,color:'#EF4444'},{label:'Mar',value:Math.round(cu*.13),color:'#DC2626'}]} />
      </div>
      <DeptAISummary dept="success" portal="business" />
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{l:'Health Check',i:Star},{l:'QBR Prep',i:Calendar},{l:'Churn Alert',i:AlertCircle},{l:'NPS Survey',i:Send},{l:'Expansion Opp',i:TrendingUp},{l:'Dept Insights',i:BarChart3}].map(a=>(
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Account Health Overview</p></div>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Account','Health','Next QBR','Renewal','CSM','RAG'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
            <tbody>{accounts.map((a,i)=>{const rc=a.rag==='green'?'#22C55E':a.rag==='amber'?'#F59E0B':'#EF4444';return(
              <tr key={i} style={{borderBottom:i<accounts.length-1?'1px solid #111318':undefined}}>
                <td className="px-5 py-3 font-medium" style={{color:'#F9FAFB'}}>{a.name}</td>
                <td className="px-5 py-3 text-xs font-bold" style={{color:a.score>=70?'#22C55E':a.score>=50?'#F59E0B':'#EF4444'}}>{a.score}/100</td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{a.qbr}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{a.renewal}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{a.csm}</td>
                <td className="px-5 py-3"><div className="w-3 h-3 rounded-full" style={{backgroundColor:rc}} /></td>
              </tr>)})}</tbody>
          </table>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Immediate Action Required</p></div>
          <div className="divide-y" style={{borderColor:'#1F2937'}}>
            {accounts.filter(a=>a.rag==='red').map((a,i)=>(
              <div key={i} className="px-5 py-3"><div className="flex items-center gap-2 mb-1"><AlertCircle size={12} style={{color:'#EF4444'}} /><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{a.name}</p></div><p className="text-xs" style={{color:'#9CA3AF'}}>Health {a.score}/100 · Renewal {a.renewal} · Needs QBR by {a.qbr}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ITView({ company }: { company: string }) {
  const ir = fakeNum(12,company,'ir')
  const requests = [
    {id:'IT-0412',type:'Software',employee:fakeName(company,15),priority:'P2',status:'Open',age:'2h'},
    {id:'IT-0410',type:'Access',employee:fakeName(company,16),priority:'P1',status:'In Progress',age:'4h'},
    {id:'IT-0408',type:'Hardware',employee:fakeName(company,17),priority:'P3',status:'Open',age:'1d'},
    {id:'IT-0405',type:'Software',employee:fakeName(company,18),priority:'P2',status:'Waiting',age:'2d'},
    {id:'IT-0402',type:'Access',employee:fakeName(company,19),priority:'P3',status:'Open',age:'3d'},
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open IT Requests" value={String(ir)} icon={Headphones} color="#F59E0B"
          pieData={[{label:'Software',value:6,color:'#F59E0B'},{label:'Hardware',value:3,color:'#EF4444'},{label:'Access',value:3,color:'#374151'}]}
          barData={[{label:'Mon',value:3,color:'#F59E0B'},{label:'Tue',value:4,color:'#F59E0B'},{label:'Wed',value:5,color:'#F59E0B'},{label:'Thu',value:4,color:'#F59E0B'}]} />
        <StatCard label="Pending Provisioning" value="3" icon={Package} color="#6C3FC5"
          pieData={[{label:'Laptop',value:2,color:'#6C3FC5'},{label:'Software',value:1,color:'#A78BFA'}]}
          barData={[{label:'Jan',value:5,color:'#6C3FC5'},{label:'Feb',value:4,color:'#6C3FC5'},{label:'Mar',value:3,color:'#7C3AED'}]} />
        <StatCard label="Assets Registered" value="184" icon={Monitor} color="#0D9488"
          pieData={[{label:'MacOS',value:60,color:'#0D9488'},{label:'Windows',value:30,color:'#6C3FC5'},{label:'Linux',value:10,color:'#374151'}]}
          barData={[{label:'Q3',value:160,color:'#0D9488'},{label:'Q4',value:172,color:'#0D9488'},{label:'Q1',value:184,color:'#0F766E'}]} />
        <StatCard label="Licences Due Renewal" value="4" icon={AlertCircle} color="#EF4444"
          pieData={[{label:'This month',value:2,color:'#EF4444'},{label:'Next month',value:2,color:'#F59E0B'}]}
          barData={[{label:'Jan',value:1,color:'#EF4444'},{label:'Feb',value:3,color:'#EF4444'},{label:'Mar',value:4,color:'#DC2626'}]} />
      </div>
      <DeptAISummary dept="it" portal="business" />
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{l:'New Device',i:Monitor},{l:'Software Request',i:Package},{l:'Access Review',i:CheckCircle2},{l:'Security Alert',i:AlertCircle},{l:'System Update',i:ArrowRight},{l:'Dept Insights',i:BarChart3}].map(a=>(
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>IT Request Queue</p></div>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:'1px solid #1F2937'}}>{['Request #','Type','Employee','Priority','Status','Age'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{color:'#6B7280'}}>{h}</th>)}</tr></thead>
            <tbody>{requests.map((r,i)=>(
              <tr key={i} style={{borderBottom:i<requests.length-1?'1px solid #111318':undefined}}>
                <td className="px-5 py-3 font-mono text-xs" style={{color:'#9CA3AF'}}>{r.id}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#F9FAFB'}}>{r.type}</td>
                <td className="px-5 py-3 text-xs" style={{color:'#9CA3AF'}}>{r.employee}</td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:r.priority==='P1'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)',color:r.priority==='P1'?'#EF4444':'#F59E0B'}}>{r.priority}</span></td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:'rgba(13,148,136,0.1)',color:'#0D9488'}}>{r.status}</span></td>
                <td className="px-5 py-3 text-xs" style={{color:'#6B7280'}}>{r.age}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Pending Provisioning</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{name:fakeName(company,6),item:'MacBook Pro 14"',start:'07 Apr'},{name:fakeName(company,7),item:'Dell Monitor 27"',start:'07 Apr'},{name:fakeName(company,2),item:'Adobe Creative Suite',start:'17 Mar'}].map((p,i)=>(
                <div key={i} className="px-5 py-3"><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{p.name}</p><p className="text-xs" style={{color:'#6B7280'}}>{p.item} · Start: {p.start}</p></div>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Licence Renewals Due</p></div>
            <div className="divide-y" style={{borderColor:'#1F2937'}}>
              {[{licence:'Slack Business+',due:'31 Mar',cost:'£3,200/yr'},{licence:'Figma Organisation',due:'15 Apr',cost:'£1,800/yr'},{licence:'GitHub Enterprise',due:'30 Apr',cost:'£4,500/yr'}].map((l,i)=>(
                <div key={i} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium" style={{color:'#F9FAFB'}}>{l.licence}</p><p className="text-xs" style={{color:'#6B7280'}}>Due: {l.due}</p></div><span className="text-xs font-bold" style={{color:'#F59E0B'}}>{l.cost}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
  const isDev = typeof window !== 'undefined' && localStorage.getItem('NEXT_PUBLIC_ENV') === 'dev'

  const [briefingEnabled, setBriefingEnabled] = React.useState(() => localStorage.getItem('lumio_demo_biz_briefing') !== 'false')
  const [includeRevenue, setIncludeRevenue] = React.useState(() => localStorage.getItem('lumio_demo_biz_inc_revenue') !== 'false')
  const [includePipeline, setIncludePipeline] = React.useState(() => localStorage.getItem('lumio_demo_biz_inc_pipeline') !== 'false')
  const [includeTeam, setIncludeTeam] = React.useState(() => localStorage.getItem('lumio_demo_biz_inc_team') !== 'false')
  const [includeCalendar, setIncludeCalendar] = React.useState(() => localStorage.getItem('lumio_demo_biz_inc_calendar') !== 'false')
  const [briefingTime, setBriefingTime] = React.useState(() => localStorage.getItem('lumio_demo_biz_briefing_time') || '8:00am')
  const [demoDataActive, setDemoDataActive] = React.useState(() => localStorage.getItem('lumio_demo_active') === 'true')
  const [showClearConfirm, setShowClearConfirm] = React.useState(false)
  const [showDataConnections, setShowDataConnections] = React.useState(false)
  const [demoCleared, setDemoCleared] = React.useState(false)
  const [toastMsg, setToastMsg] = React.useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  function demoToggle(key: string, val: boolean, setter: (v: boolean) => void) {
    setter(val)
    localStorage.setItem(key, String(val))
  }

  const INTEGRATIONS = [
    { name: 'Gmail / Outlook', desc: 'Connect your email' },
    { name: 'Slack', desc: 'Team messaging' },
    { name: 'Microsoft Teams', desc: 'Meetings & chat' },
    { name: 'Xero', desc: 'Accounting & finance' },
    { name: 'QuickBooks', desc: 'Bookkeeping' },
    { name: 'Google Calendar', desc: 'Calendar sync' },
    { name: 'Outlook Calendar', desc: 'Calendar sync' },
    { name: 'BambooHR / Sage HR', desc: 'HR management' },
  ]

  return (
    <div className="max-w-2xl space-y-6">

      {/* Demo mode banner */}
      <div className="flex items-center gap-3 rounded-xl px-5 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)' }}>
        <span style={{ color: '#0D9488', flexShrink: 0, fontSize: 14 }}>&#x26A1;</span>
        <p className="text-sm" style={{ color: '#D1D5DB' }}>
          You're in demo mode — upgrade to save settings permanently
        </p>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg" style={{ backgroundColor: '#1F2937', color: '#F9FAFB', border: '1px solid #374151' }}>
          {toastMsg}
        </div>
      )}

      {/* Workspace info card */}
      {[
        { title: 'Workspace', fields: [['Company name', company], ['Workspace slug', company.toLowerCase().replace(/\s+/g,'-')], ['Plan', '14-day Trial'], ['Status', 'Active']] },
      ].map(section => (
        <div key={section.title} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{section.title}</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {section.fields.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: label === 'Status' ? '#22C55E' : '#F9FAFB' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Team card */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Team</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Members</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>1 (you)</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Pending invites</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>0</span>
          </div>
        </div>
      </div>

      {/* Data Import (drag & drop) */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Data Import</p>
        </div>
        <div className="p-5">
          <div
            className="rounded-xl p-6 text-center cursor-pointer"
            style={{ backgroundColor: '#0A0B10', border: '2px dashed #1F2937' }}
            onClick={() => alert('Available in your live workspace')}
          >
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Drop any files here — Lumio will sort them automatically</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>CSV, XLSX, DOCX, PDF, images</p>
            <p className="text-xs mt-3 font-semibold" style={{ color: '#0D9488' }}>Available in your live workspace</p>
          </div>
        </div>
      </div>

      {/* Demo Data (demo-specific) */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Demo Data</p>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: demoDataActive ? 'rgba(245,166,35,0.15)' : 'rgba(34,197,94,0.15)', color: demoDataActive ? '#F5A623' : '#22C55E' }}>
            {demoDataActive ? 'Active' : 'Off'}
          </span>
        </div>
        <div className="px-5 py-4 space-y-2">
          {demoDataActive ? (
            <button onClick={() => setShowClearConfirm(true)} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              Clear Demo Data
            </button>
          ) : (
            <button onClick={() => { setDemoDataActive(true); setDemoCleared(false); localStorage.setItem('lumio_demo_active', 'true'); localStorage.removeItem(`lumio_demo_cleared`); const ALL = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','accounts','support','success','trials','operations','it']; ALL.forEach(p => localStorage.setItem(`lumio_dashboard_${p}_hasData`, 'true')); showToast('Demo data loaded') }} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
              Load Demo Data
            </button>
          )}
        </div>
      </div>

      {/* AI Morning Briefing */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Morning Briefing</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Enable Morning Briefing</p><p className="text-xs" style={{ color: '#6B7280' }}>AI-generated daily summary read aloud</p></div>
            <div className="relative h-5 w-9 rounded-full cursor-pointer transition-colors" style={{ backgroundColor: briefingEnabled ? '#0D9488' : '#1F2937' }} onClick={() => demoToggle('lumio_demo_biz_briefing', !briefingEnabled, setBriefingEnabled)}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full transition-transform" style={{ backgroundColor: '#F9FAFB', transform: briefingEnabled ? 'translateX(16px)' : 'translateX(2px)' }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Include revenue summary</span>
            <div className="relative h-5 w-9 rounded-full cursor-pointer transition-colors" style={{ backgroundColor: includeRevenue ? '#0D9488' : '#1F2937' }} onClick={() => demoToggle('lumio_demo_biz_inc_revenue', !includeRevenue, setIncludeRevenue)}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full transition-transform" style={{ backgroundColor: '#F9FAFB', transform: includeRevenue ? 'translateX(16px)' : 'translateX(2px)' }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Include pipeline updates</span>
            <div className="relative h-5 w-9 rounded-full cursor-pointer transition-colors" style={{ backgroundColor: includePipeline ? '#0D9488' : '#1F2937' }} onClick={() => demoToggle('lumio_demo_biz_inc_pipeline', !includePipeline, setIncludePipeline)}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full transition-transform" style={{ backgroundColor: '#F9FAFB', transform: includePipeline ? 'translateX(16px)' : 'translateX(2px)' }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Include team updates</span>
            <div className="relative h-5 w-9 rounded-full cursor-pointer transition-colors" style={{ backgroundColor: includeTeam ? '#0D9488' : '#1F2937' }} onClick={() => demoToggle('lumio_demo_biz_inc_team', !includeTeam, setIncludeTeam)}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full transition-transform" style={{ backgroundColor: '#F9FAFB', transform: includeTeam ? 'translateX(16px)' : 'translateX(2px)' }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Include today's calendar</span>
            <div className="relative h-5 w-9 rounded-full cursor-pointer transition-colors" style={{ backgroundColor: includeCalendar ? '#0D9488' : '#1F2937' }} onClick={() => demoToggle('lumio_demo_biz_inc_calendar', !includeCalendar, setIncludeCalendar)}>
              <div className="absolute top-0.5 h-4 w-4 rounded-full transition-transform" style={{ backgroundColor: '#F9FAFB', transform: includeCalendar ? 'translateX(16px)' : 'translateX(2px)' }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Briefing time</span>
            <select value={briefingTime} onChange={e => { setBriefingTime(e.target.value); localStorage.setItem('lumio_demo_biz_briefing_time', e.target.value) }} style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}>
              <option>7:00am</option><option>7:30am</option><option>8:00am</option><option>8:30am</option><option>9:00am</option>
            </select>
          </div>
        </div>
      </div>

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

      {/* Integrations */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Integrations</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
          {INTEGRATIONS.map(integ => (
            <div key={integ.name} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{integ.name}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{integ.desc}</p>
              </div>
              <button onClick={() => alert('Available in your live workspace')} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Login & Security */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Login &amp; Security</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Email</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>demo@{company.toLowerCase().replace(/\s+/g,'')}.com</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Password</span>
            <button onClick={() => alert('Available in your live workspace')} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
              Change
            </button>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Two-factor authentication</span>
            <button onClick={() => alert('Available in your live workspace')} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Dev Tools */}
      {isDev && (
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#F5A623' }}>DEV TOOLS</p>
          <div className="flex gap-2">
            <button onClick={() => { localStorage.clear(); window.location.reload() }} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
              Reset Onboarding
            </button>
            <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('lumio_demo_')).forEach(k => localStorage.removeItem(k)); showToast('Demo localStorage cleared') }} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              Clear Demo Keys
            </button>
          </div>
        </div>
      )}

      {/* Go Live CTA */}
      <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.25)' }}>
        <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>Ready to go live?</p>
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Upgrade to Lumio to keep your settings, connect integrations, and unlock the full platform.</p>
        <a href="https://lumio.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>
          Go Live
        </a>
      </div>
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
  const [tab, setTab] = useState<'overview'|'signals'|'jobs'>('overview')
  const [strengthFilter, setStrengthFilter] = useState('All')
  const [competitorFilter, setCompetitorFilter] = useState('All')
  const [expandedSignal, setExpandedSignal] = useState<string|null>(null)
  const [expandedJob, setExpandedJob] = useState<string|null>(null)
  const [scanning, setScanning] = useState(false)

  const COMP_ROWS = [
    { feature: 'All-in-one platform',          lumio: '✅', hubspot: '✅', pipedrive: '⚠️', monday: '✅' },
    { feature: 'Built-in workflow automation', lumio: '✅', hubspot: '⚠️', pipedrive: '❌', monday: '⚠️' },
    { feature: 'CRM & Sales pipeline',         lumio: '✅', hubspot: '✅', pipedrive: '✅', monday: '✅' },
    { feature: 'HR & People management',       lumio: '✅', hubspot: '❌', pipedrive: '❌', monday: '⚠️' },
    { feature: 'Partner management',           lumio: '✅', hubspot: '⚠️', pipedrive: '❌', monday: '❌' },
    { feature: 'AI Insights dashboard',        lumio: '✅', hubspot: '⚠️', pipedrive: '❌', monday: '⚠️' },
    { feature: 'SMB pricing (<£200/mo)',       lumio: '✅', hubspot: '❌', pipedrive: '✅', monday: '⚠️' },
    { feature: 'Setup in under 30 min',        lumio: '✅', hubspot: '❌', pipedrive: '⚠️', monday: '⚠️' },
  ]

  const COMPETITORS = [
    { id:'hubspot',   name:'HubSpot',    emoji:'🟠', category:'CRM + Marketing Automation', threat:78, overlap:85, momentum:62, pricing:24, signalCount:14, lastDate:'2 days ago', summary:'Raised Professional tier 18% in Jan 2026. AI copilot still enterprise-gated. Losing SMB reviews to simpler tools.', lastSignal:'Pricing page changed — Professional tier up 18%' },
    { id:'pipedrive', name:'Pipedrive',   emoji:'🟢', category:'Sales CRM',                 threat:61, overlap:72, momentum:74, pricing:58, signalCount:9,  lastDate:'5 days ago', summary:'Aggressively targeting Zendesk customers with a migration guide. Launched Campaigns module — entering marketing automation.', lastSignal:'Published "Switch from Zendesk" migration guide' },
    { id:'monday',    name:'monday.com',  emoji:'🔴', category:'Work OS + CRM',              threat:55, overlap:68, momentum:81, pricing:46, signalCount:11, lastDate:'1 week ago', summary:'Monday CRM growing fast — 3 ML engineers hired in 6 weeks. Strong G2 momentum. No SMB-specific automation library.', lastSignal:'3 ML engineer hires posted in 6 weeks' },
    { id:'zapier',    name:'Zapier',      emoji:'⚡', category:'Automation Platform',         threat:47, overlap:91, momentum:53, pricing:42, signalCount:7,  lastDate:'3 days ago', summary:'Task-based pricing is a growing complaint on G2. "Too expensive for small teams" appearing in 34% of negative reviews.', lastSignal:'G2 review surge — 11 new "too expensive" reviews' },
  ]

  const SIGNALS = [
    { id:'s1',  comp:'HubSpot',    type:'💰', strength:'Critical' as const, title:'HubSpot Professional tier raised 18% — £320/mo → £378/mo',                     detail:'Pricing page hash changed on 14 Mar 2026. Professional (5 seats) now £378/mo. No announcement. Existing customers grandfathered for 90 days.', opp:91, threat:12, date:'14 Mar 2026', source:'Pricing page monitor',   action:'Update positioning to call out the gap. Add a "Lumio vs HubSpot pricing" page.' },
    { id:'s2',  comp:'Zapier',     type:'⭐', strength:'Critical' as const, title:'G2 review surge — 11 "too expensive for small teams" reviews in 10 days',        detail:'Trustpilot and G2 both showing a spike. Common themes: task limits, confusing pricing, no industry-specific templates.',                       opp:88, threat:8,  date:'11 Mar 2026', source:'G2 + Trustpilot monitor', action:'Create a "Switch from Zapier" landing page. Offer free migration of existing Zaps.' },
    { id:'s3',  comp:'Pipedrive',  type:'📝', strength:'High' as const,     title:'Pipedrive published "How to switch from Zendesk in 48 hours"',                   detail:'Full migration guide targeting Zendesk customers — CSV import, workflow mapping, agent setup.',                                                   opp:74, threat:41, date:'9 Mar 2026',  source:'RSS blog monitor',       action:'Publish a counter-guide. Position Lumio\'s 150 workflows as what Pipedrive can\'t offer.' },
    { id:'s4',  comp:'monday.com', type:'👥', strength:'High' as const,     title:'3 ML Engineers hired — natural language workflow builder inbound',                detail:'Three ML Engineer roles posted Jan–Feb 2026, all citing "automation intelligence" and "natural language task creation".',                         opp:45, threat:72, date:'5 Mar 2026',  source:'LinkedIn job monitor',   action:'Accelerate your own AI workflow builder. Establish the "AI-native automation for SMBs" narrative now.' },
    { id:'s5',  comp:'HubSpot',    type:'🎤', strength:'High' as const,     title:'INBOUND 2026 talk: "The AI CRM — what\'s next for HubSpot"',                     detail:'Session abstract published. Speaker is HubSpot VP Product. Keywords: conversational automation, AI deal scoring.',                                opp:38, threat:68, date:'3 Mar 2026',  source:'Conference monitor',     action:'Monitor INBOUND session for specifics. Prepare counter-positioning for AI deal scoring.' },
    { id:'s6',  comp:'Pipedrive',  type:'🚀', strength:'High' as const,     title:'Pipedrive Campaigns GA — now a direct email marketing competitor',               detail:'Campaigns module exited beta. Includes email sequences, list segmentation, and basic A/B testing.',                                              opp:42, threat:58, date:'28 Feb 2026', source:'ProductHunt + RSS',      action:'Position Lumio Marketing workflows as more powerful — 150 cross-department automations vs single-channel email.' },
    { id:'s7',  comp:'HubSpot',    type:'⭐', strength:'Medium' as const,   title:'Capterra: "too complex for a 20-person company" theme increasing',               detail:'Capterra review analysis shows "complex" appearing in 28% of 2-3 star reviews — up from 19%.',                                                  opp:79, threat:5,  date:'25 Feb 2026', source:'Capterra monitor',       action:'Lean into simplicity messaging. "Set up in a day, not a quarter" is a direct wedge.' },
    { id:'s8',  comp:'monday.com', type:'💵', strength:'Medium' as const,   title:'monday.com secondary offering — $400M raised to fund AI expansion',              detail:'Filed with SEC on 20 Feb. CFO mentions "doubling down on AI automation capabilities".',                                                        opp:22, threat:61, date:'21 Feb 2026', source:'SEC filing monitor',     action:'No immediate action — 12–18 month signal. Confirms monday.com is a long-term threat.' },
    { id:'s9',  comp:'Zapier',     type:'📜', strength:'Medium' as const,   title:'Patent filed: "Dynamic workflow orchestration with context-aware AI routing"',   detail:'USPTO application filed Feb 2026. Claims cover AI-driven step routing based on historical execution data.',                                     opp:15, threat:34, date:'18 Feb 2026', source:'USPTO patent monitor',   action:'Flag to legal team. Low risk but worth monitoring.' },
    { id:'s10', comp:'Pipedrive',  type:'👥', strength:'Medium' as const,   title:'VP of Partnerships hired — channel program expansion incoming',                  detail:'LinkedIn shows VP Partnerships start date 1 Mar 2026. Previous role: head of channel at Salesforce SMB.',                                        opp:31, threat:42, date:'14 Feb 2026', source:'LinkedIn job monitor',   action:'Accelerate Lumio\'s own partner program before Pipedrive locks in key agency relationships.' },
    { id:'s11', comp:'HubSpot',    type:'📝', strength:'Low' as const,      title:'HubSpot blog: "How SMBs can use AI without a data team"',                        detail:'Content targeting SMB segment directly — unusual for HubSpot who typically produces enterprise content.',                                        opp:55, threat:18, date:'10 Feb 2026', source:'RSS blog monitor',       action:'Publish a better version. Own the "AI automation for SMBs" content category.' },
    { id:'s12', comp:'monday.com', type:'🚀', strength:'Low' as const,      title:'monday.com App Store: 12 new integrations published',                            detail:'Xero, QuickBooks, Sage, Freshdesk, Intercom, Zendesk and 6 others added to monday\'s integration marketplace.',                                 opp:28, threat:25, date:'5 Feb 2026',  source:'Changelog monitor',      action:'Ensure Lumio\'s native integrations are positioned clearly. "Native" vs "App Store bolt-on".' },
  ]

  const JOBS = [
    { comp:'HubSpot',    emoji:'🟠', roles:[{title:'Staff ML Engineer — Automation Intelligence',count:2,signal:'Building AI-powered workflow suggestions. Direct competitor to Lumio\'s AI workflow engine.',timeline:'9–12 months'},{title:'Sr. PM — AI Copilot',count:1,signal:'AI copilot moving beyond beta — will push into Professional tier, Lumio\'s direct market.',timeline:'6–9 months'},{title:'Growth Lead — SMB Segment',count:1,signal:'HubSpot explicitly targeting SMBs with a dedicated growth hire.',timeline:'Immediate'}] },
    { comp:'Pipedrive',  emoji:'🟢', roles:[{title:'VP of Partnerships',count:1,signal:'Channel program building. Expect Pipedrive-certified agencies by Q3 2026.',timeline:'Q3 2026'},{title:'Email Marketing Engineer',count:2,signal:'Campaigns module incomplete. Two engineers = sequence builder, A/B testing incoming.',timeline:'4–6 months'},{title:'CSM (SMB)',count:3,signal:'Scaling customer success for SMBs post-Campaigns launch.',timeline:'Immediate'}] },
    { comp:'monday.com', emoji:'🔴', roles:[{title:'ML Engineer — NLP Automation',count:3,signal:'Natural language workflow creation. "Describe what you want" → monday builds the workflow.',timeline:'9–15 months'},{title:'Sr. PM — monday CRM',count:1,signal:'CRM module treated as first-class product. Dedicated PM accelerates roadmap significantly.',timeline:'6–9 months'},{title:'Enterprise AE',count:8,signal:'Moving upmarket. Enterprise AE hiring at this volume = repackaged Enterprise tier incoming.',timeline:'Happening now'}] },
    { comp:'Zapier',     emoji:'⚡', roles:[{title:'Head of Pricing Strategy',count:1,signal:'New Head of Pricing = pricing model change coming. Task-based model under pressure.',timeline:'6–9 months'},{title:'Template Library PM',count:1,signal:'Zapier knows its template library is weak vs Lumio\'s 150 workflows. This PM will close the gap.',timeline:'3–6 months'}] },
  ]

  const STR_CFG: Record<string, { color: string; bg: string; border: string }> = {
    Critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
    High:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
    Medium:   { color: '#6C3FC5', bg: 'rgba(108,63,197,0.08)', border: 'rgba(108,63,197,0.25)' },
    Low:      { color: '#6B7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)' },
  }

  const filteredSignals = SIGNALS.filter(s => {
    if (strengthFilter !== 'All' && s.strength !== strengthFilter) return false
    if (competitorFilter !== 'All' && s.comp !== competitorFilter) return false
    return true
  })

  function ScoreRing({ score, color, label: lbl }: { score: number; color: string; label: string }) {
    const r = 20, circ = 2 * Math.PI * r, dash = (score / 100) * circ
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <svg width={52} height={52} className="-rotate-90"><circle cx={26} cy={26} r={r} fill="none" stroke="#1F2937" strokeWidth={4} /><circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" /></svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{score}</span>
        </div>
        <span className="text-[10px] text-center leading-tight" style={{ color: '#6B7280' }}>{lbl}</span>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1F2937' }} className="px-1 py-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><Target size={16} style={{ color: '#F87171' }} /><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Competitor Intelligence</span></div>
            <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>Competitor Watch</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}><Clock size={14} /> Last scan: Today at 06:00</span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>🔴 {SIGNALS.filter(s => s.strength === 'Critical').length} critical signals</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors" style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>Export PDF</button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors" style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}><BarChart3 size={16} /> Comparison Matrix</button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors" style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}><Sparkles size={16} /> Intelligence Brief</button>
            <button onClick={() => { setScanning(true); setTimeout(() => setScanning(false), 3200) }} disabled={scanning} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors" style={{ backgroundColor: '#EF4444', color: '#fff', opacity: scanning ? 0.6 : 1 }}><RotateCcw size={16} className={scanning ? 'animate-spin' : ''} />{scanning ? 'Scanning…' : 'Run Full Scan'}</button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-0 mt-5" style={{ borderBottom: '1px solid #1F2937', marginBottom: '-1px' }}>
          {([{ id: 'overview' as const, label: 'Competitor Overview' }, { id: 'signals' as const, label: `Signal Feed (${SIGNALS.length})` }, { id: 'jobs' as const, label: 'Job Intelligence' }]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors" style={{ borderBottomColor: tab === t.id ? '#F87171' : 'transparent', color: tab === t.id ? '#F9FAFB' : '#6B7280' }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="py-6">
        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Product Comparison */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-base font-semibold" style={{ color: '#F9FAFB' }}>Product Comparison</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>How Lumio stacks up against key competitors across core feature areas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: '1px solid #1F2937' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest w-44" style={{ color: '#4B5563' }}>Feature</th>
                    {[{n:'Lumio',c:'#0D9488'},{n:'HubSpot',c:'#F97316'},{n:'Pipedrive',c:'#22C55E'},{n:'monday.com',c:'#EF4444'}].map(h => <th key={h.n} className="px-4 py-3 text-xs font-semibold text-center" style={{ color: h.c }}>{h.n}</th>)}
                  </tr></thead>
                  <tbody>{COMP_ROWS.map(row => (
                    <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid #1F2937' }}>
                      <td className="px-5 py-3 text-xs" style={{ color: '#9CA3AF' }}>{row.feature}</td>
                      <td className="px-4 py-3 text-center text-sm">{row.lumio}</td>
                      <td className="px-4 py-3 text-center text-sm">{row.hubspot}</td>
                      <td className="px-4 py-3 text-center text-sm">{row.pipedrive}</td>
                      <td className="px-4 py-3 text-center text-sm">{row.monday}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="flex items-center gap-4 px-5 py-3" style={{ borderTop: '1px solid #1F2937' }}>
                <span className="text-xs" style={{ color: '#4B5563' }}>✅ Full support</span>
                <span className="text-xs" style={{ color: '#4B5563' }}>⚠️ Partial / add-on</span>
                <span className="text-xs" style={{ color: '#4B5563' }}>❌ Not available</span>
              </div>
            </div>

            {/* Competitor cards */}
            <div className="space-y-4">
              {COMPETITORS.map(comp => (
                <div key={comp.id} className="rounded-xl overflow-hidden hover:border-[#374151] transition-colors" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="p-5">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                        <span className="text-3xl">{comp.emoji}</span>
                        <div>
                          <p className="font-bold" style={{ color: '#F9FAFB' }}>{comp.name}</p>
                          <p className="text-xs" style={{ color: '#6B7280' }}>{comp.category}</p>
                          <div className="flex items-center gap-1.5 mt-1"><span className="text-[10px]" style={{ color: '#6B7280' }}>{comp.signalCount} signals</span><span className="text-[10px]" style={{ color: '#374151' }}>·</span><span className="text-[10px]" style={{ color: '#6B7280' }}>Last: {comp.lastDate}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 flex-wrap">
                        <ScoreRing score={comp.threat}   color="#EF4444" label="Threat" />
                        <ScoreRing score={comp.overlap}  color="#F59E0B" label="Overlap" />
                        <ScoreRing score={comp.momentum} color="#6C3FC5" label="Momentum" />
                        <ScoreRing score={comp.pricing}  color="#0D9488" label="Price Comp." />
                      </div>
                      <button onClick={() => { setTab('signals'); setCompetitorFilter(comp.name) }} className="px-3 py-1.5 rounded-lg text-xs transition-colors ml-auto" style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>View signals →</button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#07080F' }}><div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Summary</div><p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{comp.summary}</p></div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#07080F' }}><div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Latest signal</div><p className="text-xs" style={{ color: '#F9FAFB' }}>{comp.lastSignal}</p><p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{comp.lastDate}</p></div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex flex-wrap gap-6 px-2 pt-2">
                {[{l:'Threat — how much damage they could do if they execute',c:'#EF4444'},{l:'Overlap — how much of your market they address',c:'#F59E0B'},{l:'Momentum — how fast they\'re moving right now',c:'#6C3FC5'},{l:'Price Comp. — how price-competitive vs Lumio (higher = cheaper)',c:'#0D9488'}].map(x => (
                  <div key={x.l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: x.c }} /><span className="text-[11px]" style={{ color: '#6B7280' }}>{x.l}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Signal Feed ── */}
        {tab === 'signals' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs" style={{ color: '#6B7280' }}>Filter:</span>
              <div className="flex gap-1.5 flex-wrap">
                {['All','Critical','High','Medium','Low'].map(s => (
                  <button key={s} onClick={() => setStrengthFilter(s)} className="px-3 py-1 rounded-full text-xs font-medium transition-colors" style={{ backgroundColor: strengthFilter === s ? (STR_CFG[s]?.bg || '#1F2937') : 'transparent', color: strengthFilter === s ? (STR_CFG[s]?.color || '#F9FAFB') : '#6B7280', border: `1px solid ${strengthFilter === s ? (STR_CFG[s]?.border || '#374151') : '#1F2937'}` }}>{s}</button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap ml-2">
                {['All',...COMPETITORS.map(c => c.name)].map(c => (
                  <button key={c} onClick={() => setCompetitorFilter(c)} className="px-3 py-1 rounded-full text-xs transition-colors" style={{ backgroundColor: competitorFilter === c ? '#1F2937' : 'transparent', color: competitorFilter === c ? '#F9FAFB' : '#6B7280', border: `1px solid ${competitorFilter === c ? '#374151' : '#1F2937'}` }}>{c}</button>
                ))}
              </div>
              <span className="ml-auto text-xs" style={{ color: '#6B7280' }}>{filteredSignals.length} signals</span>
            </div>
            {filteredSignals.map(sig => {
              const cfg = STR_CFG[sig.strength]; const isOpen = expandedSignal === sig.id
              return (
                <div key={sig.id} className="rounded-xl overflow-hidden transition-all" style={{ backgroundColor: '#111318', border: `1px solid ${isOpen ? cfg.border : '#1F2937'}` }}>
                  <button className="w-full text-left p-4" onClick={() => setExpandedSignal(isOpen ? null : sig.id)}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{sig.type}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>{sig.strength}</span>
                          <span className="text-xs" style={{ color: '#6B7280' }}>{sig.comp}</span><span className="text-xs" style={{ color: '#374151' }}>·</span><span className="text-xs" style={{ color: '#6B7280' }}>{sig.date}</span><span className="text-xs" style={{ color: '#374151' }}>·</span><span className="text-xs" style={{ color: '#6B7280' }}>{sig.source}</span>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{sig.title}</p>
                        {!isOpen && <p className="text-xs mt-1 line-clamp-1" style={{ color: '#6B7280' }}>{sig.detail}</p>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right"><div className="text-[10px]" style={{ color: '#6B7280' }}>Opportunity</div><div className="text-sm font-bold" style={{ color: '#0D9488' }}>{sig.opp}</div></div>
                        <div className="text-right"><div className="text-[10px]" style={{ color: '#6B7280' }}>Threat</div><div className="text-sm font-bold" style={{ color: '#EF4444' }}>{sig.threat}</div></div>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 pt-4" style={{ borderTop: '1px solid #1F2937' }}>
                      <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{sig.detail}</p>
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#07080F', borderLeft: `3px solid ${cfg.color}` }}>
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Recommended action</div>
                        <p className="text-sm leading-relaxed" style={{ color: '#F9FAFB' }}>{sig.action}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Job Intelligence ── */}
        {tab === 'jobs' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#6B7280' }}>Job postings are the #1 leading indicator of what a competitor is building next. Here&apos;s what each hiring pattern signals.</p>
            {JOBS.map(j => {
              const isOpen = expandedJob === j.comp
              return (
                <div key={j.comp} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <button className="w-full text-left p-5 flex items-center gap-3" onClick={() => setExpandedJob(isOpen ? null : j.comp)}>
                    <span className="text-2xl">{j.emoji}</span>
                    <div className="flex-1"><p className="font-semibold" style={{ color: '#F9FAFB' }}>{j.comp}</p><p className="text-xs" style={{ color: '#6B7280' }}>{j.roles.length} active hiring signals</p></div>
                    <div className="flex gap-1.5">{j.roles.map((_,i) => <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B', opacity: 0.7 }} />)}</div>
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#6B7280' }} />
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #1F2937' }}>
                      {j.roles.map((role, i) => (
                        <div key={i} className={`p-5 ${i < j.roles.length - 1 ? 'border-b' : ''}`} style={{ borderColor: '#1F2937' }}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{role.title}</p>{role.count > 1 && <p className="text-xs" style={{ color: '#F59E0B' }}>{role.count} open roles</p>}</div>
                            <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{role.timeline}</span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{role.signal}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
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

// ─── Welcome Screen ──────────────────────────────────────────────────────────

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
  projects:   [
    { metric: 'Active projects',      value: '12',    trend: '+2',    insight: 'Two new projects kicked off this month. Resource allocation looks healthy across all active workstreams.' },
    { metric: 'On-track rate',        value: '83%',   trend: '+5%',   insight: 'Project health improved after weekly stand-up automation was rolled out. Two previously amber projects now green.' },
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
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDataConnections, setShowDataConnections] = useState(false)
  const [demoCleared, setDemoCleared] = useState(() => typeof window !== 'undefined' && localStorage.getItem(`lumio_demo_cleared`) === 'true')
  const [demoDataActive, setDemoDataActive] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true')
  const [showCoachMarks, setShowCoachMarks]   = useState(false)
  const [showDeptInsights, setShowDeptInsights] = useState(false)
  const [overviewAction, setOverviewAction] = useState<string | null>(null)
  const [showNewJoiner,    setShowNewJoiner]    = useState(false)
  const [showLeaveRequest, setShowLeaveRequest] = useState(false)
  const [showOffboarding,  setShowOffboarding]  = useState(false)
  const [showRecruitment,  setShowRecruitment]  = useState(false)
  const [showPerfReview,   setShowPerfReview]   = useState(false)
  const [focusDepts, setFocusDepts]           = useState<string[]>([])
  const [toast, setToast]                     = useState<string | null>(null)
  const [showConvert, setShowConvert]         = useState(false)
  const [showWelcome, setShowWelcome]         = useState(false)
  const [showGettingStarted, setShowGettingStarted] = useState(false)
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
    const name           = localStorage.getItem('demo_company_name') || localStorage.getItem('lumio_company_name') || (isPreview ? 'Preview' : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    const user           = localStorage.getItem('demo_user_name') || localStorage.getItem('lumio_user_name') || ''
    const logo           = localStorage.getItem('demo_company_logo') || ''
    const created        = localStorage.getItem('demo_created_at')
    const onboarded      = localStorage.getItem('demo_onboarded')
    const tipsCompleted  = localStorage.getItem('demo_tips_completed')
    const depts          = JSON.parse(localStorage.getItem('demo_focus_depts') || '[]') as string[]
    setCompany(name); setUserName(user); setCompanyLogo(logo); setFocusDepts(depts)
    if (created) setDaysLeft(Math.max(0, 14 - Math.floor((Date.now() - parseInt(created)) / 86400000)))

    // First visit: set demo data active and show onboarding
    if (!localStorage.getItem('lumio_demo_active')) {
      localStorage.setItem('lumio_demo_active', 'true')
      const ALL = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','inbox','calendar','analytics','accounts','support','success','trials','operations','it']
      ALL.forEach(p => localStorage.setItem(`lumio_dashboard_${p}_hasData`, 'true'))
    }

    // Show welcome overlay on first visit (replaces old DeptPickerModal)
    if (!isPreview && !localStorage.getItem(`lumio_demo_welcomed_${slug}`)) {
      setShowWelcome(true)
    } else if (!isPreview && !tipsCompleted) {
      setShowCoachMarks(true)
    }

    // Sync company name to lumio_ keys for sidebar
    if (name && name !== 'Your Company') {
      localStorage.setItem('lumio_company_name', name)
      localStorage.setItem('workspace_company_name', name)
    }

    // Legacy slug redirect
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
          if (!data) { setWorkspaceStatus('trial'); return }
          if (data.status === 'converted') {
            if (data.live_slug) { router.replace(`/${data.live_slug}`); return }
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
        .catch(() => { setWorkspaceStatus('trial') })
    } else {
      // No session token — still show the portal with demo data (preview mode)
      setWorkspaceStatus('trial')
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

  const OVERVIEW_ACTIONS = ['Send Email','Send Slack','Phone Call','Book Meeting','Team Events','Claim Expenses','Book Holiday','Report Sickness']

  function fireToast(label: string = '') {
    if (OVERVIEW_ACTIONS.includes(label)) { setOverviewAction(label);                        return }
    if (label === 'Dept Insights')     { setShowDeptInsights(true);                         return }
    if (label === 'New Joiner' || label === 'New Starter') { setShowNewJoiner(true);        return }
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
      {showCoachMarks && <CoachMarks bannerRef={bannerRef} navRef={navRef} actionsRef={actionsRef} statsRef={statsRef} onComplete={handleTipsComplete} />}
      {showDeptInsights && <DeptInsightsModal dept={activeDept} onClose={() => setShowDeptInsights(false)} />}
      {showNewJoiner    && <NewJoinerModal          onClose={() => setShowNewJoiner(false)}    onSubmit={handleDemoNewJoiner}    />}
      {showLeaveRequest && <LeaveRequestModal      onClose={() => setShowLeaveRequest(false)} onSubmit={handleDemoLeaveRequest} />}
      {showOffboarding  && <OffboardingModal        onClose={() => setShowOffboarding(false)}  onSubmit={handleDemoOffboarding}  />}
      {showRecruitment  && <RecruitmentModal        onClose={() => setShowRecruitment(false)}  onSubmit={handleDemoRecruitment}  />}
      {showPerfReview   && <PerformanceReviewModal  onClose={() => setShowPerfReview(false)}   onSubmit={handleDemoPerfReview}   />}
      {showInvite && <InviteModal slug={slug} company={company} userName={userName} onClose={() => setShowInvite(false)} />}
      {overviewAction && <OverviewActionModal action={overviewAction} onClose={() => setOverviewAction(null)} onToast={(msg) => { setOverviewAction(null); setToast(msg); setTimeout(() => setToast(null), 3000) }} />}

      {/* Welcome overlay */}
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 520, padding: '2rem', width: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
            <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome to Lumio</h1>
            <p style={{ color: '#aaa', marginBottom: '2.5rem', fontSize: '1rem' }}>Let&apos;s get your workspace set up in 2 minutes</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '2rem 1.5rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }} onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.4rem' }}>▶</div>
                <div style={{ color: 'white', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>Getting Started with Lumio</div>
                <div style={{ color: '#F59E0B', fontSize: '0.8rem' }}>2 min intro</div>
              </div>
              <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '2rem 1.5rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }} onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.4rem' }}>▶</div>
                <div style={{ color: 'white', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>Getting the Most Out of Lumio</div>
                <div style={{ color: '#F59E0B', fontSize: '0.8rem' }}>2 min tips & tricks</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #2a2a3e', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ color: '#555', fontSize: '0.9rem' }}>Ready to set up your workspace?</p>
            </div>
            <button onClick={() => {
              localStorage.setItem(`lumio_demo_welcomed_${slug}`, 'true')
              localStorage.setItem('demo_onboarded', 'true')
              localStorage.setItem('demo_focus_depts', JSON.stringify([]))
              setShowWelcome(false)
              setShowCoachMarks(true)
            }}
              style={{ width: '100%', background: '#F59E0B', color: '#000', border: 'none', padding: '1rem 2rem', borderRadius: 10, fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em' }}>
              Get Started →
            </button>
          </div>
        </div>
      )}

      {/* Getting Started Tour */}
      {showGettingStarted && (
        <GettingStartedModal
          companyName={company}
          ownerEmail={localStorage.getItem('demo_user_email') || ''}
          sessionToken={localStorage.getItem('demo_session_token') || ''}
          onComplete={() => { setShowGettingStarted(false); localStorage.setItem('demo_getting_started_done', 'true') }}
        />
      )}

      {/* Trial banner — hidden for converted/paid workspaces */}
      {showUpgrade && isTrial && (
        <div className="flex items-center justify-between px-4 py-2 text-sm shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          <div className="flex items-center gap-2">
            <Clock size={13} />
            <span className="font-medium">Trial workspace — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
            <span className="hidden sm:inline opacity-75">· Demo data only · Auto-deleted after 14 days</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowInvite(true)} className="hidden sm:inline-flex items-center gap-1.5 font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#F9FAFB' }}>
              <UserPlus size={11} /> Invite team
            </button>
            <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_')).forEach(k => localStorage.removeItem(k)); localStorage.setItem('lumio_demo_active', 'false'); window.location.reload() }} className="hidden sm:inline font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
              Clear Demo Data
            </button>
            <Link href="/pricing" className="font-semibold text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>Buy <ArrowRight size={11} className="inline" /></Link>
            <button onClick={() => setShowUpgrade(false)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* Mobile hamburger (no top header bar) */}
      <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
        <button className="p-1.5 rounded-lg" style={{ color: '#9CA3AF' }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
        <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>{company}</span>
      </div>

      {/* Top-right: view toggle + bell + avatar (fixed, matching live portal) */}
      <div style={{ position: 'fixed', top: showUpgrade && isTrial ? 52 : 12, right: 16, zIndex: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { icon: '▤', title: 'Table view', active: true },
            { icon: '📊', title: 'Chart view', active: false },
            { icon: '📈', title: 'Timeline view', active: false },
          ].map(v => (
            <button key={v.title} title={v.title} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', opacity: v.active ? 1 : 0.5, color: v.active ? '#0D9488' : '#6B7280', fontSize: 13, borderRadius: 4 }}>
              {v.icon}
            </button>
          ))}
        </div>
        <button style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', backgroundColor: '#0D9488' }} />
        </button>
        <AvatarDropdown
          initials={userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : company.slice(0, 2).toUpperCase()}
          onConvert={() => setShowConvert(true)}
        />
      </div>
      {showConvert && <ConvertModal onClose={() => setShowConvert(false)} />}

      {/* Clear Demo Data confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxWidth: 400 }}>
            <p className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Clear all demo data?</p>
            <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>This will remove all sample data and reset the workspace. Your account details will be kept.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
              <button onClick={() => {
                setDemoDataActive(false); setDemoCleared(true); setShowClearConfirm(false)
                localStorage.setItem('lumio_demo_active', 'false')
                localStorage.setItem(`lumio_demo_cleared`, 'true')
                Object.keys(localStorage).filter(k => k.startsWith('lumio_dashboard_')).forEach(k => localStorage.removeItem(k))
                setShowDataConnections(true)
              }} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Yes, clear all data</button>
            </div>
          </div>
        </div>
      )}

      {/* Data Connections Modal */}
      {showDataConnections && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937', zIndex: 10 }}>
              <div><p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Set up your workspace</p><p className="text-xs" style={{ color: '#9CA3AF' }}>Connect your tools and import your data to get started</p></div>
              <button onClick={() => setShowDataConnections(false)} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Connect integrations</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: '📧', name: 'Google Workspace', desc: 'Email, Calendar, Drive' },
                    { emoji: '💬', name: 'Slack', desc: 'Messages & notifications' },
                    { emoji: '📊', name: 'HubSpot', desc: 'CRM and contacts' },
                    { emoji: '📱', name: 'WhatsApp Business', desc: 'Customer messages' },
                    { emoji: '💼', name: 'LinkedIn', desc: 'Professional network' },
                    { emoji: '📝', name: 'Notion', desc: 'Docs and wikis' },
                    { emoji: '🎯', name: 'Microsoft Teams', desc: 'Communications' },
                    { emoji: '📈', name: 'Xero / QuickBooks', desc: 'Accounts & finance' },
                    { emoji: '🛒', name: 'Shopify', desc: 'E-commerce data' },
                    { emoji: '📅', name: 'Outlook', desc: 'Email and calendar' },
                  ].map(i => (
                    <div key={i.name} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}>
                      <span className="text-xl">{i.emoji}</span>
                      <div className="flex-1 min-w-0"><p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{i.name}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{i.desc}</p></div>
                      <button className="px-2.5 py-1 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }} onClick={() => fireToast(`${i.name} — available in your live workspace`)}>Connect</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Import your data</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Upload CSV (contacts, customers)', 'Upload spreadsheet (finances)', 'Import from URL', 'Add manually'].map(l => (
                    <div key={l} className="flex items-center justify-center gap-2 rounded-xl p-4 cursor-pointer" style={{ border: '2px dashed #374151' }} onClick={() => fireToast('Data import — available in your live workspace')}>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#F5A623' }}>Or start with demo data</p>
                <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Want to explore with sample data first?</p>
                <button onClick={() => {
                  setDemoDataActive(true); setDemoCleared(false); setShowDataConnections(false)
                  localStorage.setItem('lumio_demo_active', 'true'); localStorage.removeItem(`lumio_demo_cleared`)
                  const ALL = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','accounts','support','success','trials','operations','it']
                  ALL.forEach(p => localStorage.setItem(`lumio_dashboard_${p}_hasData`, 'true'))
                  fireToast('Demo data reloaded')
                }} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
                  Reload Demo Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {activeDept !== 'overview' && activeDept !== 'hr' && activeDept !== 'accounts' && activeDept !== 'sales' && activeDept !== 'crm' && activeDept !== 'marketing' && activeDept !== 'trials' && activeDept !== 'operations' && activeDept !== 'support' && activeDept !== 'success' && activeDept !== 'it' && activeDept !== 'projects' && !demoCleared && <div className="mb-4"><QuickActionsBar dept={activeDept} onAction={fireToast} /></div>}

            {/* Empty state when demo data is cleared */}
            {demoCleared && activeDept !== 'settings' && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>📊</div>
                <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>No data yet</h2>
                <p className="text-sm mb-6 max-w-sm" style={{ color: '#9CA3AF' }}>Connect your integrations or import your data to see your {activeDept === 'overview' ? 'dashboard' : activeDept} come to life.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDataConnections(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Connect your tools →</button>
                  <button onClick={() => { setDemoDataActive(true); setDemoCleared(false); localStorage.setItem('lumio_demo_active', 'true'); localStorage.removeItem(`lumio_demo_cleared`); const ALL = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','accounts','support','success','trials','operations','it']; ALL.forEach(p => localStorage.setItem(`lumio_dashboard_${p}_hasData`, 'true')); fireToast('Demo data loaded') }} className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>Load demo data</button>
                </div>
              </div>
            )}

            {!demoCleared && activeDept === 'overview' && <OverviewView company={company} firstName={userName ? userName.split(' ')[0] : undefined} bannerRef={bannerRef} statsRef={statsRef} actionsRef={actionsRef} onAction={fireToast} wakeWordEnabled={wakeWordEnabled} />}
            {!demoCleared && activeDept === 'insights'   && <InsightsView   company={company} />}
            {!demoCleared && activeDept === 'hr'         && <HRView         company={company} />}
            {!demoCleared && activeDept === 'accounts'   && <AccountsView   company={company} />}
            {!demoCleared && activeDept === 'sales'      && <SalesView      company={company} />}
            {!demoCleared && activeDept === 'crm'        && <CRMView        company={company} />}
            {!demoCleared && activeDept === 'marketing'  && <MarketingView  company={company} />}
            {!demoCleared && activeDept === 'trials'     && <TrialsView     company={company} />}
            {!demoCleared && activeDept === 'operations' && <OpsView        company={company} />}
            {!demoCleared && activeDept === 'support'    && <SupportView    company={company} />}
            {!demoCleared && activeDept === 'success'    && <SuccessView    company={company} />}
            {!demoCleared && activeDept === 'it'         && <ITView         company={company} />}
            {!demoCleared && activeDept === 'workflows'  && <WorkflowsView  company={company} />}
            {!demoCleared && activeDept === 'partners'   && <PartnersView   company={company} />}
            {!demoCleared && activeDept === 'strategy'   && <StrategyView   company={company} />}
            {!demoCleared && activeDept === 'projects'   && <ProjectsView />}
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
// force deploy Mon Mar 30 19:01:30 GMTST 2026
// force Mon Mar 30 19:27:25 GMTST 2026


