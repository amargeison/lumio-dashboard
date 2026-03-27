'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Sparkles, Building2, Users, BookOpen, Heart,
  DollarSign, Wrench, UserPlus, Shield, GitBranch, FileText,
  Settings, Bell, Menu, X, GraduationCap, Sunrise, Network,
  ChevronUp, ChevronDown, ArrowRight, Zap, Clock,
  Phone, Calendar, CheckCircle2, AlertTriangle, Activity,
  TrendingUp, Loader2, Volume2,
} from 'lucide-react'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'

// ─── Types ───────────────────────────────────────────────────────────────────

type DeptId = 'overview' | 'insights' | 'school-office' | 'hr-staff' | 'curriculum' | 'students' | 'send-dsl' | 'finance' | 'facilities' | 'admissions' | 'safeguarding' | 'wraparound' | 'trust' | 'workflows' | 'reports' | 'settings'

const NAV: { section: string | null; id: DeptId; label: string; icon: React.ElementType }[] = [
  { section: null,          id: 'overview',      label: 'Overview',               icon: LayoutDashboard },
  { section: null,          id: 'insights',      label: 'Insights',               icon: Sparkles        },
  { section: 'Departments', id: 'school-office', label: 'School Office',          icon: Building2       },
  { section: null,          id: 'hr-staff',      label: 'HR & Staff',             icon: Users           },
  { section: null,          id: 'curriculum',    label: 'Curriculum',             icon: BookOpen        },
  { section: null,          id: 'students',      label: 'Students',               icon: GraduationCap   },
  { section: null,          id: 'send-dsl',      label: 'SEND & DSL',             icon: Heart           },
  { section: null,          id: 'finance',       label: 'Finance',                icon: DollarSign      },
  { section: null,          id: 'facilities',    label: 'Facilities',             icon: Wrench          },
  { section: null,          id: 'admissions',    label: 'Admissions & Marketing', icon: UserPlus        },
  { section: null,          id: 'safeguarding',  label: 'Safeguarding',           icon: Shield          },
  { section: null,          id: 'wraparound',    label: 'Pre & After School',     icon: Sunrise         },
  { section: 'Tools',       id: 'trust',         label: 'Trust Overview',         icon: Network         },
  { section: null,          id: 'workflows',     label: 'Workflows',              icon: GitBranch       },
  { section: null,          id: 'reports',       label: 'Reports',                icon: FileText        },
  { section: null,          id: 'settings',      label: 'Settings',               icon: Settings        },
]

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeDept, onSelect, open, onClose, schoolName }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void; schoolName: string
}) {
  const inner = (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
      {NAV.map((item, i) => {
        const prev = NAV[i - 1]
        const showSection = item.section && item.section !== prev?.section
        const active = activeDept === item.id
        const Icon = item.icon
        return (
          <div key={item.id}>
            {showSection && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{item.section}</p>
            )}
            <button
              onClick={() => { onSelect(item.id); onClose() }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium w-full text-left transition-colors"
              style={{ backgroundColor: active ? '#0D9488' : 'transparent', color: active ? '#F9FAFB' : '#9CA3AF' }}
            >
              <Icon size={15} strokeWidth={1.75} className="shrink-0" />
              <span className="flex-1 truncate text-xs">{item.label}</span>
            </button>
          </div>
        )
      })}
    </nav>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col shrink-0 overflow-y-auto" style={{ width: 200, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}>
        <div className="flex shrink-0 items-center gap-1.5 px-4 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)' }}>
            <Building2 size={12} color="white" />
          </div>
          <span className="text-xs font-bold" style={{ color: '#F9FAFB' }}>Lumio <span style={{ color: '#0D9488' }}>Schools</span></span>
        </div>
        {inner}
        <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid #1F2937' }}>
          <p className="text-xs font-semibold truncate" style={{ color: '#9CA3AF' }}>{schoolName}</p>
          <p className="text-xs" style={{ color: '#0D9488' }}>Live workspace</p>
        </div>
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative z-50 flex flex-col overflow-y-auto" style={{ width: 200, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>NAVIGATION</span>
              <button onClick={onClose} style={{ color: '#6B7280' }}><X size={16} /></button>
            </div>
            {inner}
          </aside>
        </div>
      )}
    </>
  )
}

// ─── AI Summary Panel ────────────────────────────────────────────────────────

const SCHOOL_AI_HIGHLIGHTS = [
  'Welcome to your live school workspace. Connect your MIS and tools in Settings to see real data here.',
  'Your Morning Briefing will populate once SIMS, Arbor, or Bromcom integrations are connected.',
  'Invite your staff under Settings > Team to start collaborating.',
  'Visit the Workflows section to activate school-specific automations.',
]

function SchoolAIPanel() {
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
          {SCHOOL_AI_HIGHLIGHTS.map((item, i) => (
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

// ─── Greeting Banner ─────────────────────────────────────────────────────────

const SCHOOL_QUOTES = [
  { text: "Every child deserves a champion.", author: "Rita Pierson" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Children must be taught how to think, not what to think.", author: "Margaret Mead" },
  { text: "A good teacher can inspire hope and ignite the imagination.", author: "Brad Henry" },
]

function SchoolBanner({ firstName, schoolName }: { firstName?: string; schoolName?: string }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [quote] = useState(() => SCHOOL_QUOTES[Math.floor(Math.random() * SCHOOL_QUOTES.length)])
  const { speak, stop, isPlaying } = useElevenLabsTTS()

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    const name = firstName || 'there'
    const school = schoolName || 'your school'
    speak(`${greeting}, ${name}. Welcome to ${school} on Lumio. Connect your school systems in Settings to see live attendance, safeguarding, and staff data here.`)
  }

  return (
    <div className="relative bg-gradient-to-r from-teal-950 via-emerald-900 to-green-950 overflow-hidden rounded-xl">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative z-10 px-6 py-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {greeting}, {firstName || 'there'} 👋
          </h1>
          <button
            onClick={handleBriefing}
            title="Lumio will read your morning briefing aloud"
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
        </div>
        <p className="text-teal-300 text-sm mb-2">{date}</p>
        <p className="text-teal-200/60 text-sm italic">&ldquo;{quote.text}&rdquo; — {quote.author}</p>
      </div>
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
      <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>Connect your school systems</h3>
      <p className="text-sm mb-5 mx-auto max-w-sm" style={{ color: '#9CA3AF' }}>
        Link your MIS (SIMS, Arbor, Bromcom), staff systems, and safeguarding tools to see live data in your workspace.
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
  const item = NAV.find(s => s.id === dept)
  if (!item) return null
  const Icon = item.icon
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
        <Icon size={28} style={{ color: '#0D9488' }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>{item.label}</h2>
      <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>This section is being built for your school workspace.</p>
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#2DD4BF', border: '1px solid rgba(13,148,136,0.25)' }}>
        <Sparkles size={10} /> Coming soon
      </span>
    </div>
  )
}

// ─── Settings View ───────────────────────────────────────────────────────────

function SettingsView({ schoolName }: { schoolName: string }) {
  return (
    <div className="max-w-2xl space-y-6">
      {[
        { title: 'School', fields: [['School name', schoolName], ['Plan', 'Lumio Schools'], ['Status', 'Active']] },
        { title: 'Integrations', fields: [['MIS (SIMS/Arbor)', 'Not connected'], ['Safeguarding (CPOMS/MyConcern)', 'Not connected'], ['HR/Staff', 'Not connected'], ['Finance', 'Not connected']] },
        { title: 'Team', fields: [['Staff members', '1 (you)'], ['Pending invites', '0']] },
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

function OverviewView({ schoolName, firstName, onGoToSettings }: { schoolName: string; firstName?: string; onGoToSettings: () => void }) {
  return (
    <div className="space-y-4">
      <SchoolBanner firstName={firstName} schoolName={schoolName} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ConnectDataPrompt onGoToSettings={onGoToSettings} />

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Attendance', value: '—', icon: Activity, color: '#0D9488' },
              { label: 'Staff', value: '—', icon: Users, color: '#6C3FC5' },
              { label: 'Workflows', value: '0', icon: GitBranch, color: '#22C55E' },
              { label: 'Concerns', value: '0', icon: Shield, color: '#EF4444' },
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
          <SchoolAIPanel />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SchoolWorkspaceDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [schoolName, setSchoolName] = useState('Your School')
  const [userName, setUserName]     = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Read from localStorage
    const name = localStorage.getItem(`lumio_school_${slug}_name`) || 'Your School'
    const owner = localStorage.getItem(`lumio_school_${slug}_owner`) || ''
    setSchoolName(name)
    setUserName(owner)

    // Validate from Supabase
    fetch(`/api/schools/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (data.workspace_type !== 'live' && data.active === false) {
          router.replace('/school/trial-ended')
          return
        }
        if (data.name) setSchoolName(data.name)
      })
      .catch(() => {})
  }, [slug, router])

  const deptLabel = NAV.find(d => d.id === activeDept)?.label || 'Overview'
  const initials = userName ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : schoolName.slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <Sidebar activeDept={activeDept} onSelect={setActiveDept} open={sidebarOpen} onClose={() => setSidebarOpen(false)} schoolName={schoolName} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-6" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#07080F' }}>
          <button className="md:hidden" onClick={() => setSidebarOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={20} /></button>
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <span className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{schoolName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>Live</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative" style={{ color: '#9CA3AF' }}>
              <Bell size={18} />
            </button>
            <AvatarDropdown initials={initials} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold">{deptLabel}</h1>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Workspace: <span style={{ color: '#F9FAFB' }}>{schoolName}</span></p>
            </div>
          </div>

          {activeDept === 'overview' && <OverviewView schoolName={schoolName} firstName={userName ? userName.split(' ')[0] : undefined} onGoToSettings={() => setActiveDept('settings')} />}
          {activeDept === 'settings' && <SettingsView schoolName={schoolName} />}
          {activeDept !== 'overview' && activeDept !== 'settings' && <ComingSoonView dept={activeDept} />}
        </main>
      </div>
    </div>
  )
}
