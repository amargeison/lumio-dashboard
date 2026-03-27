'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, TrendingUp, Headphones, GitBranch, AlertCircle,
  CheckCircle2, Loader2, Clock, ArrowRight,
  Zap, Package, Star, ChevronDown, ChevronUp, BarChart3, Sparkles,
  UserPlus, X, Plus, Check,
  Home, Receipt, Megaphone, FlaskConical, Award, Monitor,
  Settings, Hash, Menu, ChevronLeft,
  Calendar, FileText, Target, DollarSign, Volume2, Mic, Handshake,
  Database, RotateCcw,
} from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'
import { useWakeWord } from '@/hooks/useWakeWord'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'

// ─── Types ───────────────────────────────────────────────────────────────────

type DeptId = 'overview' | 'insights' | 'hr' | 'accounts' | 'sales' | 'crm' | 'marketing' | 'trials' | 'operations' | 'support' | 'success' | 'it' | 'workflows' | 'settings' | 'partners' | 'strategy'

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

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeDept, onSelect, open, onClose, companyName, companyLogo }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void
  companyName?: string; companyLogo?: string
}) {
  const inner = (
    <nav className="flex flex-col gap-0.5 p-3">
      {SIDEBAR_ITEMS.map(item => {
        const active = activeDept === item.id
        return (
          <button key={item.id}
            onClick={() => { onSelect(item.id); onClose() }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left w-full transition-all"
            style={{
              backgroundColor: active ? 'rgba(13,148,136,0.12)' : 'transparent',
              color: active ? '#0D9488' : '#9CA3AF',
              borderLeft: active ? '2px solid #0D9488' : '2px solid transparent',
            }}>
            <item.icon size={15} strokeWidth={active ? 2.5 : 2} />
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-52 shrink-0 overflow-y-auto"
        style={{ backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2.5 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          {companyLogo ? (
            <img src={companyLogo} alt={companyName || 'Company'} style={{ maxWidth: 120, maxHeight: 40, objectFit: 'contain' }} className="rounded-md" />
          ) : (
            <div className="flex items-center justify-center rounded-lg text-xs font-bold"
              style={{ width: 36, height: 36, backgroundColor: '#0D9488', color: '#F9FAFB', flexShrink: 0 }}>
              {(companyName || 'LC').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          {companyName && <span className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{companyName}</span>}
        </div>
        {inner}
      </aside>

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

// ─── Greeting Banner ─────────────────────────────────────────────────────────

const BG_GRADIENTS = [
  'from-teal-950 via-emerald-900 to-green-950',
  'from-slate-900 via-teal-950 to-emerald-900',
  'from-emerald-950 via-teal-900 to-slate-900',
  'from-gray-900 via-emerald-950 to-teal-900',
  'from-teal-900 via-slate-900 to-emerald-950',
  'from-emerald-900 via-gray-900 to-teal-950',
  'from-green-950 via-teal-900 to-emerald-900',
]

function PersonalBanner({ firstName }: { firstName?: string }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const bg = BG_GRADIENTS[new Date().getDay()]
  const { speak, stop, isPlaying } = useSpeech()

  return (
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-xl`}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative z-10 px-6 py-5">
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          {greeting}, {firstName || 'there'} 👋
        </h1>
        <p className="text-teal-300 text-sm">{date}</p>
      </div>
    </div>
  )
}

// ─── AI Summary Panel ────────────────────────────────────────────────────────

const AI_HIGHLIGHTS = [
  'Welcome to your live Lumio workspace. Connect your tools in Settings to see real data here.',
  'Your Morning Roundup will populate once email, calendar, and CRM integrations are connected.',
  'Invite your team under Settings > Team to start collaborating.',
  'Visit the Workflows Library to activate automations for your business.',
]

function AISummaryPanel() {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayLabel = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #0D9488' }}>
      <button
        className="flex w-full items-center justify-between px-5 py-4"
        style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: open ? '1px solid rgba(13,148,136,0.3)' : undefined }}
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#0D9488' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Morning Summary</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#2DD4BF' }}>{dayLabel}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#0D9488' }} /> : <ChevronDown size={14} style={{ color: '#0D9488' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5" style={{ backgroundColor: '#0f0e17' }}>
          {AI_HIGHLIGHTS.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#2DD4BF' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#99F6E4' }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Connect Data Prompt ─────────────────────────────────────────────────────

function ConnectDataPrompt({ onGoToSettings }: { onGoToSettings: () => void }) {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.25)' }}>
      <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#2DD4BF', border: '1px solid rgba(13,148,136,0.25)' }}>
        <Zap size={12} /> Get started
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Connect your tools to see real data</h3>
      <p className="text-sm mb-5 mx-auto max-w-sm" style={{ color: '#9CA3AF' }}>
        Link your email, CRM, calendar, and other tools to populate your dashboard with live data.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onGoToSettings} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          Go to Integrations <ArrowRight size={15} />
        </button>
        <Link href="/book-demo" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'transparent', border: '1px solid #1F2937', color: '#9CA3AF' }}>
          Book onboarding call
        </Link>
      </div>
    </div>
  )
}

// ─── Coming Soon View ────────────────────────────────────────────────────────

function ComingSoonView({ dept }: { dept: DeptId }) {
  const item = SIDEBAR_ITEMS.find(s => s.id === dept)
  if (!item) return null
  const Icon = item.icon
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
        <Icon size={28} style={{ color: '#0D9488' }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{item.label}</h2>
      <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>This section is being built for your live workspace.</p>
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.25)' }}>
        <Sparkles size={10} /> Coming soon
      </span>
    </div>
  )
}

// ─── Settings View ───────────────────────────────────────────────────────────

function SettingsView({ company }: { company: string }) {
  return (
    <div className="max-w-2xl space-y-6">
      {[
        { title: 'Workspace', fields: [['Company name', company], ['Plan', 'Lumio Business'], ['Status', 'Active']] },
        { title: 'Integrations', fields: [['Email', 'Not connected'], ['CRM', 'Not connected'], ['Calendar', 'Not connected'], ['Slack', 'Not connected']] },
        { title: 'Team', fields: [['Members', '1 (you)'], ['Pending invites', '0']] },
      ].map(section => (
        <div key={section.title} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{section.title}</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {section.fields.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: value === 'Not connected' ? '#6B7280' : '#F9FAFB' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Overview View ───────────────────────────────────────────────────────────

function OverviewView({ company, firstName, onGoToSettings }: { company: string; firstName?: string; onGoToSettings: () => void }) {
  return (
    <div className="space-y-4">
      <PersonalBanner firstName={firstName} />

      {/* 3-col grid: main content left, AI panel right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ConnectDataPrompt onGoToSettings={onGoToSettings} />

          {/* Placeholder stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Active Workflows', value: '0', icon: GitBranch, color: '#0D9488' },
              { label: 'Team Members', value: '1', icon: Users, color: '#6C3FC5' },
              { label: 'Integrations', value: '0', icon: Database, color: '#22C55E' },
              { label: 'Automations', value: '0', icon: Zap, color: '#F59E0B' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}18` }}>
                      <Icon size={14} style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{s.value}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <AISummaryPanel />
        </div>
      </div>
    </div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
      {message}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WorkspaceDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [company, setCompany]       = useState('Your Company')
  const [userName, setUserName]     = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast]           = useState<string | null>(null)

  function fireToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    // Read cached values from localStorage
    const name = localStorage.getItem('workspace_company_name') || localStorage.getItem('demo_company_name') || 'Your Company'
    const user = localStorage.getItem('workspace_user_name') || localStorage.getItem('demo_user_name') || ''
    const logo = localStorage.getItem('workspace_company_logo') || localStorage.getItem('demo_company_logo') || ''
    setCompany(name)
    setUserName(user)
    setCompanyLogo(logo)

    // Validate session against Supabase
    const sessionToken = localStorage.getItem('workspace_session_token') || localStorage.getItem('demo_session_token')
    if (sessionToken) {
      fetch('/api/demo/status', { headers: { 'x-demo-token': sessionToken } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) { router.replace('/trial-ended'); return }
          if (data.workspace_type !== 'live' && data.status !== 'converted') {
            // Not a paid workspace — redirect to demo or trial-ended
            if (data.status === 'active') router.replace(`/demo/${slug}`)
            else router.replace('/trial-ended')
            return
          }
          // Update from Supabase data
          if (data.company_name) setCompany(data.company_name)
          if (data.owner_name) setUserName(data.owner_name)
          if (data.logo_url) setCompanyLogo(data.logo_url)
        })
        .catch(() => {})
    }
  }, [slug, router])

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: '#F9FAFB', height: '100vh', overflow: 'hidden' }}>
      <Toast message={toast} />

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 gap-3 overflow-visible" style={{ backgroundColor: '#07080F', borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3 min-w-0">
          <button className="md:hidden p-1.5 rounded-lg" style={{ color: '#9CA3AF' }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/"><Image src="/lumio-logo-primary.png" alt="Lumio" width={120} height={60}
              style={{ width: 60, height: 'auto', flexShrink: 0 }} className="rounded-md" /></Link>
            <div className="hidden sm:block w-px h-5 shrink-0" style={{ backgroundColor: '#1F2937' }} />
            <div className="min-w-0 hidden sm:block">
              <div className="text-sm font-bold truncate">{company}</div>
              <div className="text-xs" style={{ color: '#0D9488' }}>Live workspace</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AvatarDropdown
            initials={userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : company.slice(0, 2).toUpperCase()}
          />
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeDept={activeDept} onSelect={setActiveDept} open={sidebarOpen} onClose={() => setSidebarOpen(false)} companyName={company} companyLogo={companyLogo} />

        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <main className="flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold">{deptLabel}</h1>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Workspace: <span style={{ color: '#F9FAFB' }}>{company}</span></p>
              </div>
            </div>

            {activeDept === 'overview' && <OverviewView company={company} firstName={userName ? userName.split(' ')[0] : undefined} onGoToSettings={() => setActiveDept('settings')} />}
            {activeDept === 'settings' && <SettingsView company={company} />}
            {activeDept !== 'overview' && activeDept !== 'settings' && <ComingSoonView dept={activeDept} />}
          </main>
        </div>
      </div>
    </div>
  )
}
