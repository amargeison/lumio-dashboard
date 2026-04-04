// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING: dev.lumiocms.com/lumio-dev  →  THIS FILE
// DO NOT edit (demo-workspace)/demo/[slug]/page.tsx for changes visible at /lumio-dev
// The demo-workspace file serves /demo/lumio-dev (trial provisioning URL) — separate route.
// ═══════════════════════════════════════════════════════════════════════════════
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
  Calendar, FileText, Target, DollarSign, Volume2, Mic, Handshake, Bell,
  Database, RotateCcw, Upload, Mail, MessageSquare, Phone, FolderKanban, Crown,
  Laptop, ClipboardCheck, GraduationCap, ShoppingCart, Key, Timer,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { useWakeWord } from '@/hooks/useWakeWord'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import OverviewActionModal from '@/components/demo/OverviewActionModal'
// ClearDemoBar replaced by inline banner in the right column
import { ClaimExpenseModal, BookHolidayModal, ReportSicknessModal } from '@/components/modals/StaffModals'
import { useVoiceCommands, type VoiceCommandResult } from '@/hooks/useVoiceCommands'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'
import QuickWins from '@/app/(dashboard)/overview/components/QuickWins'
import DailyTasks from '@/app/(dashboard)/overview/components/DailyTasks'
import Insights from '@/app/(dashboard)/overview/components/Insights'
import NotToMiss from '@/app/(dashboard)/overview/components/NotToMiss'
import TeamPanel from '@/app/(dashboard)/overview/components/TeamPanel'
import VoiceSettings from '@/components/dashboard/VoiceSettings'
import GettingStartedModal from '@/components/onboarding/GettingStartedModal'
import TabGuide from '@/components/onboarding/TabGuide'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { AIQuickWins, AIDailyTasks, AIInsights, AIDontMiss, AITeam } from '@/components/overview/AIOverviewTabs'
import { EmailActions, MeetingActions } from '@/components/overview/MessageActions'
import { EmailComposeModal, MeetingBookModal } from '@/components/overview/ComposeModals'
import { RoleSwitcherPill, ImpersonationBanner } from '@/components/dashboard/RoleSwitcher'
import { getDeptStaff, getDeptLead, getStaffShortName } from '@/lib/staff/deptMatch'
import HRSnapshot from '@/components/overview/HRSnapshot'
import { getImpersonationContext } from '@/lib/impersonation'
import ProjectsSnapshot from '@/components/overview/ProjectsSnapshot'
import RecentFiles from '@/components/overview/RecentFiles'

// ─── Staff types & helpers ───────────────────────────────────────────────────

interface StaffMember {
  first_name?: string; last_name?: string; email?: string
  job_title?: string; department?: string; phone?: string; start_date?: string
}

// Staff is now fetched from Supabase only — no localStorage
function getImportedStaff(): StaffMember[] {
  return []
}

const DIRECTOR_TITLES = /\b(director|ceo|coo|cto|cfo|chief|founder|owner|president|vp|vice president|head of|managing director|md)\b/i
const DIRECTOR_DEPTS = /^(director|leadership|executive|board|c-suite)$/i

function isDirector(staff: StaffMember | null): boolean {
  if (!staff) {
    if (typeof window !== 'undefined' && localStorage.getItem('lumio_user_role') === 'Admin') return true
    return false
  }
  if (staff.job_title && DIRECTOR_TITLES.test(staff.job_title)) return true
  if (staff.department && DIRECTOR_DEPTS.test(staff.department)) return true
  if (typeof window !== 'undefined' && localStorage.getItem('lumio_user_role') === 'Admin') return true
  return false
}

const DEPT_MATCH: Record<string, RegExp> = {
  hr:         /\b(hr|human resources|people)\b/i,
  marketing:  /\b(marketing|comms|communications)\b/i,
  sales:      /\b(sales|business development)\b/i,
  accounts:   /\b(accounts|finance|accounting)\b/i,
  operations: /\b(operations|ops)\b/i,
  it:         /\b(it|tech|technology|systems|engineering)\b/i,
  success:    /\b(success|customer success)\b/i,
  support:    /\b(support|helpdesk|service desk)\b/i,
  strategy:   /\b(strategy|leadership)\b/i,
  crm:        /\b(crm|customer relationship)\b/i,
  trials:     /\b(trials|growth)\b/i,
  partners:   /\b(partner|partnerships)\b/i,
  projects:   /\b(project|pmo)\b/i,
  workflows:  /\b(workflow|automation)\b/i,
  insights:   /\b(data|analytics|insights)\b/i,
}

function matchDept(staff: StaffMember[], dept: string): StaffMember[] {
  const pattern = DEPT_MATCH[dept]
  if (!pattern) return staff
  return staff.filter(s => s.department && pattern.test(s.department))
}

function staffFullName(s: StaffMember): string {
  return [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown'
}

// ─── Types ───────────────────────────────────────────────────────────────────

type DeptId = 'overview' | 'insights' | 'hr' | 'accounts' | 'sales' | 'crm' | 'marketing' | 'trials' | 'operations' | 'support' | 'success' | 'it' | 'workflows' | 'settings' | 'partners' | 'strategy' | 'projects' | 'directors'

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
  { id: 'directors',  label: 'Directors Suite',    icon: Crown       },
  { id: 'settings',   label: 'Settings',           icon: Settings    },
]

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeDept, onSelect, open, onClose, companyName, companyLogo: initialLogo, userInitials }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void
  companyName?: string; companyLogo?: string; userInitials?: string
}) {
  const initials = userInitials || (companyName || 'LC').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const companyInitials = (companyName || 'LC').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [logoUrl, setLogoUrl] = useState(initialLogo || null)
  const [iconHover, setIconHover] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const expanded = pinned || hovered
  const [, forceUpdate] = useState(0)

  // Sync logo from prop (arrives after async fetch in parent)
  useEffect(() => {
    if (initialLogo) setLogoUrl(initialLogo)
  }, [initialLogo])

  // Read from localStorage as instant cache, then always refresh from Supabase
  useEffect(() => {
    if (!logoUrl) {
      const stored = localStorage.getItem('lumio_company_logo') || localStorage.getItem('workspace_company_logo') || null
      if (stored && (stored.startsWith('http') || stored.startsWith('blob') || stored.startsWith('/'))) {
        setLogoUrl(stored)
      }
    }
    // Always fetch from Supabase in background to confirm/update logo
    const token = localStorage.getItem('workspace_session_token')
    if (token) {
      fetch('/api/workspace/status', { headers: { 'x-workspace-token': token } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.logo_url) {
            setLogoUrl(data.logo_url)
            localStorage.setItem('lumio_company_logo', data.logo_url)
            localStorage.setItem('workspace_company_logo', data.logo_url)
          }
        })
        .catch(() => {})
    }
    // Listen for same-tab logo updates (e.g. from Settings page upload)
    function onLogoUpdated(e: Event) {
      const url = (e as CustomEvent).detail
      if (url) setLogoUrl(url)
    }
    window.addEventListener('lumio-logo-updated', onLogoUpdated)
    return () => window.removeEventListener('lumio-logo-updated', onLogoUpdated)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')
    const handler = () => forceUpdate(n => n + 1)
    window.addEventListener('lumio-settings-changed', handler)
    return () => window.removeEventListener('lumio-settings-changed', handler)
  }, [])

  function togglePin() {
    setPinned(p => { const next = !p; localStorage.setItem('lumio_sidebar_pinned', String(next)); return next })
  }
  function handleMouseEnter() { if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }; setHovered(true) }
  function handleMouseLeave() { leaveTimer.current = setTimeout(() => setHovered(false), 400) }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Optimistic update — show local blob URL immediately
    const blobUrl = URL.createObjectURL(file)
    setLogoUrl(blobUrl)
    const token = localStorage.getItem('workspace_session_token')
    if (!token) return
    const fd = new FormData()
    fd.append('logo', file)
    try {
      const res = await fetch('/api/workspace/logo', { method: 'POST', headers: { 'x-workspace-token': token }, body: fd })
      const data = await res.json()
      if (data.logo_url) {
        setLogoUrl(data.logo_url)
        localStorage.setItem('lumio_company_logo', data.logo_url)
        localStorage.setItem('workspace_company_logo', data.logo_url)
        window.dispatchEvent(new CustomEvent('lumio-logo-updated', { detail: data.logo_url }))
      }
      URL.revokeObjectURL(blobUrl)
    } catch (err) { console.error('Logo upload failed:', err) }
  }

  return (
    <>
      {/* Desktop — collapsible */}
      <aside
        className="hidden md:flex flex-col shrink-0 overflow-hidden"
        style={{ width: expanded ? 208 : 48, backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937', transition: 'width 250ms ease' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937', minHeight: 52 }}>
          <div
            className="relative flex items-center justify-center shrink-0 overflow-hidden"
            style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: logoUrl ? 'transparent' : '#6C3FC5', color: '#F9FAFB', border: '1px solid #1F2937', fontSize: 26, fontWeight: 700 }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setLogoUrl(null)} />
            ) : (
              companyInitials
            )}
          </div>
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                {companyName && <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{companyName}</p>}
                <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>Live workspace</p>
              </div>
              <button onClick={togglePin} className="shrink-0 p-1 rounded" style={{ color: pinned ? '#0D9488' : '#4B5563', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)' }} title={pinned ? 'Unpin' : 'Pin open'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z"/></svg>
              </button>
            </>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-1.5 py-3 overflow-y-auto">
          {SIDEBAR_ITEMS.filter(item => item.id === 'overview' || item.id === 'settings' || (typeof window !== 'undefined' ? localStorage.getItem(`lumio_nav_${item.id}_visible`) !== 'false' : true)).map(item => {
            const active = activeDept === item.id
            return (
              <button key={item.id}
                onClick={() => { onSelect(item.id); if (!pinned) setHovered(false) }}
                className="flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium text-left w-full transition-all"
                style={{
                  backgroundColor: active ? 'rgba(13,148,136,0.12)' : 'transparent',
                  color: active ? '#0D9488' : '#9CA3AF',
                  borderLeft: active ? '2px solid #0D9488' : '2px solid transparent',
                  paddingLeft: expanded ? 12 : 0,
                  justifyContent: expanded ? 'flex-start' : 'center',
                }}
                title={expanded ? undefined : item.label}>
                <item.icon size={15} strokeWidth={active ? 2.5 : 2} />
                {expanded && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>
        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          {expanded && (
            <div className="pb-3">
              <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
                <Image src="/lumio-transparent-new.png" alt="Lumio" width={180} height={90} style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile — full overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <aside className="relative z-50 w-56 flex flex-col"
            style={{ backgroundColor: '#0A0B10', borderRight: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>NAVIGATION</span>
              <button onClick={onClose} style={{ color: '#6B7280' }}><ChevronLeft size={16} /></button>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto">
              {SIDEBAR_ITEMS.filter(item => item.id === 'overview' || item.id === 'settings' || (typeof window !== 'undefined' ? localStorage.getItem(`lumio_nav_${item.id}_visible`) !== 'false' : true)).map(item => {
                const active = activeDept === item.id
                return (
                  <button key={item.id} onClick={() => { onSelect(item.id); onClose() }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left w-full"
                    style={{ backgroundColor: active ? 'rgba(13,148,136,0.12)' : 'transparent', color: active ? '#0D9488' : '#9CA3AF' }}>
                    <item.icon size={15} strokeWidth={active ? 2.5 : 2} />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
            <div className="mt-auto px-4 pb-3" style={{ borderTop: '1px solid #1F2937' }}>
              <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
                <Image src="/lumio-transparent-new.png" alt="Lumio" width={180} height={90} style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

// ─── Greeting Banner ─────────────────────────────────────────────────────────

const BG_GRADIENTS = [
  'from-violet-950/80 via-purple-950/90 to-indigo-950',
  'from-purple-950 via-violet-950/80 to-indigo-950/90',
  'from-indigo-950 via-purple-950/80 to-violet-950/90',
  'from-violet-950/90 via-indigo-950 to-purple-950/80',
  'from-purple-950/80 via-indigo-950/90 to-violet-950',
  'from-indigo-950/90 via-violet-950 to-purple-950/80',
  'from-violet-950 via-purple-950/90 to-indigo-950/80',
]

// ─── Fake data helpers (same as demo) ────────────────────────────────────────

function seed(str: string): number { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i); return Math.abs(h) }
function fakeNum(base: number, co: string, salt: string) { return base + (seed(co + salt) % 20) - 10 }
function fakeCompany(co: string, i: number) { return ['Greenfield Academy','Hopscotch Learning','Bramble Hill Trust','Whitestone College','Oakridge Schools','Crestview Academy'][seed(co+'c'+i)%6] }

type WFStatus = 'COMPLETE' | 'RUNNING' | 'ACTION'
type ChartMode = 'number' | 'bar' | 'pie'
interface ChartDatum { label: string; value: number; color: string }
type OverviewTab = 'today' | 'quick-wins' | 'tasks' | 'insights' | 'not-to-miss' | 'team'

// ─── Charts ──────────────────────────────────────────────────────────────────

function DonutChart({ segments }: { segments: ChartDatum[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0)
  let acc = 0
  const gradient = segments.map(d => { const pct = (d.value / total) * 100; const s = `${d.color} ${acc.toFixed(1)}% ${(acc + pct).toFixed(1)}%`; acc += pct; return s }).join(', ')
  return (<div className="relative" style={{ width: 64, height: 64, flexShrink: 0 }}><div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `conic-gradient(${gradient})` }} /><div style={{ position: 'absolute', inset: '22%', borderRadius: '50%', backgroundColor: '#111318' }} /></div>)
}

function MiniBarChart({ bars, color }: { bars: ChartDatum[]; color: string }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (<div className="flex items-end gap-1 w-full" style={{ height: 52 }}>{bars.map((b, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-0.5"><div className="w-full rounded-sm" style={{ height: Math.max(4, (b.value / max) * 44), backgroundColor: b.color || color }} /><span style={{ fontSize: 8, color: '#6B7280' }}>{b.label}</span></div>))}</div>)
}

function EnhancedStatCard({ label, value, icon: Icon, color, pieData, barData }: { label: string; value: string; icon: React.ElementType; color: string; pieData: ChartDatum[]; barData: ChartDatum[] }) {
  const [mode, setMode] = useState<ChartMode>('number')
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 110 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>{label}</span>
        <div className="flex items-center shrink-0">
          <button style={{ color: mode === 'number' ? color : '#374151', padding: 3, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMode('number')}><Hash size={11} /></button>
          <button style={{ color: mode === 'bar' ? color : '#374151', padding: 3, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMode('bar')}><BarChart3 size={11} /></button>
        </div>
      </div>
      <div className="flex-1 flex items-center">
        {mode === 'number' && <div className="flex items-center justify-between w-full"><div className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{value}</div><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}><Icon size={14} style={{ color }} /></div></div>}
        {mode === 'bar' && <MiniBarChart bars={barData} color={color} />}
      </div>
    </div>
  )
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function WFStatusBadge({ status }: { status: WFStatus }) {
  const cfg = { COMPLETE: { label: 'COMPLETE', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', Icon: CheckCircle2 }, RUNNING: { label: 'RUNNING', color: '#0D9488', bg: 'rgba(13,148,136,0.12)', Icon: Loader2 }, ACTION: { label: 'ACTION', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', Icon: AlertCircle } }[status]
  return <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}><cfg.Icon size={11} /> {cfg.label}</span>
}

// ─── Personal Banner (with TTS + weather + chips) ────────────────────────────

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "The harder I work, the luckier I get.", author: "Samuel Goldwyn" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { text: "Don't judge each day by the harvest you reap but by the seeds that you plant.", author: "Robert Louis Stevenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "Spread your wings and let the fairy in you fly.", author: "Anthony T. Hincks" },
  { text: "When one door of happiness closes, another opens.", author: "Helen Keller" },
  { text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.", author: "Maya Angelou" },
  { text: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt" },
  { text: "If you look at what you have in life, you'll always have more.", author: "Oprah Winfrey" },
  { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Money and success don't change people; they merely amplify what is already there.", author: "Will Smith" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Not how long, but how well you have lived is the main thing.", author: "Seneca" },
  { text: "If life were easy, it wouldn't be life. It would be something else.", author: "Idowu Koyenikan" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "Live in the sunshine, swim the sea, drink the wild air.", author: "Ralph Waldo Emerson" },
  { text: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
  { text: "When you cease to dream you cease to live.", author: "Malcolm Forbes" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "In this life we cannot do great things. We can only do small things with great love.", author: "Mother Teresa" },
  { text: "Only a life lived for others is a life worthwhile.", author: "Albert Einstein" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.", author: "Dr. Seuss" },
  { text: "Winning isn't everything, but wanting to win is.", author: "Vince Lombardi" },
  { text: "You become what you believe.", author: "Oprah Winfrey" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt" },
  { text: "If you tell the truth, you don't have to remember anything.", author: "Mark Twain" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "A successful man is one who can lay a firm foundation with the bricks others have thrown at him.", author: "David Brinkley" },
  { text: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Work hard in silence, let success make the noise.", author: "Frank Ocean" },
  { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you — you have to go out and get it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't stop when you're tired — stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination, go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It's going to be hard, but hard is not impossible.", author: "Unknown" },
  { text: "Don't wait for opportunity — create it.", author: "George Bernard Shaw" },
  { text: "Sometimes we're tested not to show our weaknesses but to discover our strengths.", author: "Unknown" },
  { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" },
  { text: "Don't limit your challenges — challenge your limits.", author: "Unknown" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
  { text: "Difficulties in life are intended to make us better, not bitter.", author: "Dan Reeves" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "Someday is not a day of the week — make it today.", author: "Unknown" },
  { text: "If you want to achieve greatness, stop asking for permission.", author: "Unknown" },
  { text: "Things work out best for those who make the best of how things work out.", author: "John Wooden" },
  { text: "To live a creative life, we must lose our fear of being wrong.", author: "Joseph Chilton Pearce" },
  { text: "If you are not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn" },
  { text: "Trust because you are willing to accept the risk, not because it's safe.", author: "Unknown" },
  { text: "Take up one idea, make that one idea your life — think of it, dream of it.", author: "Swami Vivekananda" },
  { text: "All our dreams can come true if we have the courage to pursue them.", author: "Walt Disney" },
  { text: "Good things come to people who wait, but better things come to those who go out and get them.", author: "Unknown" },
  { text: "If you do what you always did, you will get what you always got.", author: "Albert Einstein" },
  { text: "When you stop chasing the wrong things, you give the right things a chance to catch you.", author: "Lolly Daskal" },
  { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
  { text: "A successful man is one who can lay a firm foundation with the bricks others have thrown at him.", author: "David Brinkley" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.", author: "James Cameron" },
  { text: "The road to success and the road to failure are almost exactly the same.", author: "Colin R. Davis" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "I never dreamed about success. I worked for it.", author: "Est\u00e9e Lauder" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "What seems to us as bitter trials are often blessings in disguise.", author: "Oscar Wilde" },
  { text: "The distance between insanity and genius is measured only by success.", author: "Bruce Feirstein" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Everything comes to him who hustles while he waits.", author: "Thomas Edison" },
  { text: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
  { text: "The real test is not whether you avoid failure, because you won't.", author: "Barack Obama" },
  { text: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
  { text: "Only those who dare to fail greatly can ever achieve greatly.", author: "Robert F. Kennedy" },
  { text: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray" },
  { text: "Education costs money, but then so does ignorance.", author: "Claus Moser" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Without hustle, talent will only carry you so far.", author: "Gary Vaynerchuk" },
  { text: "The ones who are crazy enough to think they can change the world are the ones that do.", author: "Steve Jobs" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
]

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
  const [now, setNow] = useState(new Date(0)) // hydration-safe; updated in useEffect
  const [zones, setZones] = useState(DEFAULT_WORLD_ZONES)
  const localTz = getUserLocalTz()
  const [mode, setMode] = useState<'digital' | 'analogue'>('digital')
  useEffect(() => {
    setNow(new Date())
    setZones(getStoredZones())
    const stored = localStorage.getItem('lumio_clock_mode') as 'digital' | 'analogue' | null
    if (stored) setMode(stored)
    const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id)
  }, [])
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
        {mode === 'digital' ? '◷' : '123'}
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

function PersonalBanner({ company, firstName, onVoiceCommand, ttsEnabled = true, voiceCommandsEnabled = true, demoDataActive = false, onScrollTo, onBellClick, roleSwitcher, settingsHref, userNameProp }: { company: string; firstName?: string; onVoiceCommand?: (cmd: VoiceCommandResult) => void; ttsEnabled?: boolean; voiceCommandsEnabled?: boolean; demoDataActive?: boolean; onScrollTo?: (widget: string) => void; onBellClick?: () => void; roleSwitcher?: React.ReactNode; settingsHref?: string; userNameProp?: string }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [bg, setBg] = useState(BG_GRADIENTS[0])
  useEffect(() => { setBg(BG_GRADIENTS[new Date().getDay()]) }, [])
  const { speak, stop, isPlaying } = useSpeech()
  const [quote, setQuote] = useState(QUOTES[0])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })
  const [liveCounts, setLiveCounts] = useState<{ meetings: number | null; emails: number | null; urgent: number | null; tasks: number | null }>({ meetings: null, emails: null, urgent: null, tasks: null })
  useEffect(() => {
    if (demoDataActive) return
    // Skip integration fetches when impersonating — impersonated user has no tokens
    const bannerImpCtx = getImpersonationContext()
    if (bannerImpCtx.isImpersonating) { setLiveCounts({ meetings: 0, emails: 0, urgent: 0, tasks: 0 }); return }
    const token = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : ''
    if (!token) return
    const h = { 'x-workspace-token': token }
    const c = { meetings: 0, emails: 0, urgent: 0, tasks: 0 }
    const f: Promise<void>[] = []
    if (localStorage.getItem('lumio_integration_outlook_cal') === 'true') f.push(fetch('/api/integrations/microsoft/calendar', { headers: h }).then(r => r.ok ? r.json() : null).then(d => { if (d?.events) c.meetings += d.events.length }).catch(() => {}))
    if (localStorage.getItem('lumio_integration_gcal') === 'true') f.push(fetch('/api/integrations/google/calendar', { headers: h }).then(r => r.ok ? r.json() : null).then(d => { if (d?.events) c.meetings += d.events.length }).catch(() => {}))
    if (localStorage.getItem('lumio_integration_outlook') === 'true') f.push(fetch('/api/integrations/microsoft/mail', { headers: h }).then(r => r.ok ? r.json() : null).then(d => { if (d?.emails) { c.emails += d.emails.length; c.urgent += (d.emails as { isRead: boolean }[]).filter(e => !e.isRead).length } }).catch(() => {}))
    if (localStorage.getItem('lumio_integration_gmail') === 'true') f.push(fetch('/api/integrations/google/mail', { headers: h }).then(r => r.ok ? r.json() : null).then(d => { if (d?.emails) { c.emails += d.emails.length; c.urgent += (d.emails as { isRead: boolean }[]).filter(e => !e.isRead).length } }).catch(() => {}))
    if (f.length) Promise.all(f).then(() => setLiveCounts(c))
  }, [demoDataActive])

  useEffect(() => {
    const start = new Date(new Date().getFullYear(), 0, 1).getTime()
    const dayOfYear = Math.floor((Date.now() - start) / 86400000)
    setQuote(QUOTES[dayOfYear % QUOTES.length])
  }, [])

  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  const { isListening, lastCommand, startListening, stopListening, pendingAction, setPendingAction } = useVoiceCommands()

  // Post-briefing listening state
  const [briefingJustPlayed, setBriefingJustPlayed] = useState(false)
  const [postBriefingListening, setPostBriefingListening] = useState(false)
  const postBriefingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasPlayingRef = useRef(false)

  // Detect when TTS finishes after a briefing
  useEffect(() => {
    if (isPlaying) {
      wasPlayingRef.current = true
    } else if (wasPlayingRef.current && briefingJustPlayed) {
      wasPlayingRef.current = false
      setBriefingJustPlayed(false)
      // Auto-activate mic after briefing ends
      if (voiceCommandsEnabled) {
        setPostBriefingListening(true)
        startListening()
        postBriefingTimer.current = setTimeout(() => {
          setPostBriefingListening(false)
          stopListening()
        }, 15000)
      }
    }
  }, [isPlaying, briefingJustPlayed, voiceCommandsEnabled, startListening, stopListening])

  // Clear post-briefing state when a command is detected
  useEffect(() => {
    if (lastCommand && postBriefingListening) {
      setPostBriefingListening(false)
      if (postBriefingTimer.current) { clearTimeout(postBriefingTimer.current); postBriefingTimer.current = null }
    }
  }, [lastCommand, postBriefingListening])

  function isCacheFresh(tab: string): boolean {
    if (typeof window === 'undefined') return false
    const ts = localStorage.getItem(`lumio_ai_${tab}_timestamp`)
    if (!ts) return false
    return Date.now() - parseInt(ts) < 30 * 60 * 1000
  }

  function readFreshCache<T>(tab: string): T[] | null {
    if (!isCacheFresh(tab)) return null
    try {
      const raw = localStorage.getItem(`lumio_ai_${tab}_cache`)
      if (!raw) return null
      return JSON.parse(raw) as T[]
    } catch { return null }
  }

  function generateBriefing(): string {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const openingLine = OPENING_LINES[dayOfYear % OPENING_LINES.length]
    const closingLine = CLOSING_LINES[dayOfYear % CLOSING_LINES.length]

    const parts: string[] = []
    parts.push(`${greeting}, ${firstName || 'there'}. ${openingLine}`)

    const calConnected = typeof window !== 'undefined' && (localStorage.getItem('lumio_integration_gcal') === 'true' || localStorage.getItem('lumio_integration_outlook_cal') === 'true')
    const emailConnected = typeof window !== 'undefined' && (localStorage.getItem('lumio_integration_gmail') === 'true' || localStorage.getItem('lumio_integration_outlook') === 'true')

    // Meetings
    if (demoDataActive) {
      const nextMeeting = MEETINGS.find(m => m.status === 'upcoming' || m.status === 'now')
      parts.push(`You have ${MEETINGS.length} meetings today${nextMeeting ? `, starting with your ${nextMeeting.time} ${nextMeeting.title}` : ''}.`)
    } else if (calConnected) {
      parts.push('Your calendar is connected — check your meetings tab for today\'s schedule.')
    } else {
      parts.push('No meetings connected yet — connect Google Calendar or Outlook in Settings to sync your schedule.')
    }

    // Tasks — only from fresh cache when not in demo
    if (demoDataActive) {
      parts.push('You have tasks and quick wins waiting for you on the overview.')
    } else {
      const tasks = readFreshCache<{ id: string }>('daily-tasks')
      if (tasks && tasks.length > 0) {
        parts.push(`You have ${tasks.length} tasks on your list today.`)
      } else {
        parts.push('No tasks yet — switch to the Daily Tasks tab to generate your task list.')
      }

      const wins = readFreshCache<{ id: string }>('quick-wins')
      if (wins && wins.length > 0) {
        parts.push(`${wins.length} quick wins ready to action.`)
      }

      const missItems = readFreshCache<{ urgency: string }>('dont-miss')
      if (missItems) {
        const critical = missItems.filter(i => i.urgency === 'critical').length
        if (critical > 0) parts.push(`${critical} critical ${critical === 1 ? 'item needs' : 'items need'} your attention.`)
      }
    }

    // Messages
    if (demoDataActive) {
      parts.push('You have several new messages to review.')
    } else if (emailConnected) {
      parts.push('Your email is connected — check your inbox for new messages.')
    } else {
      parts.push('No messages connected yet — connect your email in Settings to see live updates.')
    }

    // Staff count — no longer read from localStorage

    // HR platform mention
    if (typeof window !== 'undefined' && ['bamboohr', 'sage_hr', 'breathe', 'worksmarter'].some(k => localStorage.getItem(`lumio_integration_${k}`) === 'true')) {
      parts.push('Your HR platform is connected — check the HR department for leave requests and team updates.')
    }

    // Integration tip
    const anyConnected = typeof window !== 'undefined' && Object.keys(localStorage).some(k => k.startsWith('lumio_integration_') && localStorage.getItem(k) === 'true')
    if (!anyConnected && !demoDataActive) {
      parts.push('Tip: connect your tools in Settings to get live, personalised data in your briefing.')
    }

    parts.push(closingLine)
    parts.push('Is there anything I can help you with to get you started? I can add items to your daily task list, send a message, book a meeting, or fire any of your quick actions. Just say Hi Lumio followed by what you need.')
    return parts.join(' ')
  }

  function speakScript(script: string) {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script]
    let chunk = ''
    const chunks: string[] = []
    for (const s of sentences) {
      if ((chunk + s).length > 480) { if (chunk) chunks.push(chunk.trim()); chunk = s } else { chunk += s }
    }
    if (chunk) chunks.push(chunk.trim())
    if (chunks.length > 0) { setBriefingJustPlayed(true); speak(chunks[0]) }
  }

  async function handleBriefing() {
    if (!ttsEnabled) return
    if (isPlaying) { stop(); setBriefingJustPlayed(false); return }

    // Try server-side dynamic script first (skip when impersonating — no owner data)
    const briefingImpCtx = getImpersonationContext()
    try {
      const wsToken = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : ''
      if (wsToken && !briefingImpCtx.isImpersonating) {
        const res = await fetch('/api/roundup/voice-script', { headers: { 'x-workspace-token': wsToken } })
        if (res.ok) {
          const data = await res.json()
          if (data.script) { speakScript(data.script); return }
        }
      }
    } catch { /* fall through to client-side */ }

    // Fallback: client-side generated script
    speakScript(generateBriefing())
  }

  // Handle voice command actions
  useEffect(() => {
    if (!lastCommand) return
    const { action, response, payload } = lastCommand
    speak(response)

    if (action === 'PLAY_BRIEFING') {
      setTimeout(() => handleBriefing(), 1800)
    } else if (action === 'STOP_AUDIO') {
      stop()
    } else if (action === 'NAVIGATE') {
      const dept = payload?.dept?.toLowerCase()
      if (dept) setTimeout(() => window.location.href = `/${dept}`, 1500)
    } else if (action === 'SWITCH_TAB' || action === 'EXPAND_ROUNDUP' || action === 'OPEN_MODAL' || action === 'EMAIL_TEAM') {
      // These are handled by OverviewView via onVoiceCommand callback
      if (onVoiceCommand) onVoiceCommand(lastCommand)
    } else if (action === 'CANCEL_MEETING_BY_TIME') {
      const timeQuery = payload?.time?.replace(/[^\d:]/g, '') || ''
      const found = MEETINGS.find(m => m.time.includes(timeQuery) && m.status !== 'done')
      if (found) {
        setTimeout(() => {
          setPendingAction({ type: 'AWAITING_CANCEL_CONFIRMATION', data: { meeting: found } })
          speak(`No problem \u2014 I've found your ${found.title} at ${found.time}${found.attendees?.[0] ? ' with ' + found.attendees[0] : ''}. Would you like me to send a cancellation email and suggest a new time?`)
        }, 1000)
      } else {
        const list = MEETINGS.filter(m => m.status !== 'done').map(m => `${m.title} at ${m.time}`).join(', ')
        speak(`I couldn't find a meeting at that time. Your meetings today are: ${list}. Which one?`)
        setPendingAction({ type: 'AWAITING_CANCEL_DETAILS', data: {} })
      }
    } else if (action === 'CANCEL_MEETING_BY_NAME') {
      const query = (payload?.query || '').toLowerCase()
      const found = MEETINGS.find(m => m.title.toLowerCase().includes(query) || m.attendees?.some((a: string) => a.toLowerCase().includes(query)))
      if (found) {
        setTimeout(() => {
          setPendingAction({ type: 'AWAITING_CANCEL_CONFIRMATION', data: { meeting: found } })
          speak(`No problem \u2014 I've found your ${found.title} at ${found.time}${found.attendees?.[0] ? ' with ' + found.attendees[0] : ''}. Would you like me to send a cancellation email and suggest a new time?`)
        }, 1000)
      } else {
        const list = MEETINGS.filter(m => m.status !== 'done').map(m => `${m.title} at ${m.time}`).join(', ')
        speak(`I couldn't find that meeting. Your meetings today are: ${list}. Which one?`)
        setPendingAction({ type: 'AWAITING_CANCEL_DETAILS', data: {} })
      }
    } else if (action === 'CANCEL_NEXT_MEETING') {
      const list = MEETINGS.filter(m => m.status === 'upcoming').map(m => `${m.title} at ${m.time}`).join(', ')
      if (list) {
        speak(`Which meeting would you like to cancel? You have: ${list}`)
        setPendingAction({ type: 'AWAITING_CANCEL_DETAILS', data: {} })
      } else {
        speak("I couldn't find any upcoming meetings today.")
      }
    } else if (action === 'CANCEL_MEETING_WITH_EMAIL' || action === 'CANCEL_MEETING_NO_EMAIL') {
      // Response already spoken
    } else if (action === 'SLACK_TEAM_MESSAGE') {
      setTimeout(() => setPendingAction({ type: 'AWAITING_SLACK_CHANNEL', data: { message: payload?.message || '' } }), 2000)
    } else if (action === 'EXECUTE_SLACK_SEND') {
      if (onVoiceCommand) onVoiceCommand(lastCommand)
    } else if (action === 'BOOK_MEETING') {
      if (onVoiceCommand) onVoiceCommand({ ...lastCommand, action: 'OPEN_MODAL', payload: { modal: 'ScheduleDemo' } })
    } else if (action === 'ADD_TASK') {
      const taskName = payload?.taskName || lastCommand.data?.taskName || 'New task'
      try {
        const cached = JSON.parse(localStorage.getItem('lumio_ai_daily-tasks_cache') || '[]')
        cached.unshift({ id: `voice-${Date.now()}`, title: taskName, description: 'Added via voice command', priority: 'normal', category: 'Personal', dueTime: null, estimatedMinutes: 15 })
        localStorage.setItem('lumio_ai_daily-tasks_cache', JSON.stringify(cached))
        localStorage.setItem('lumio_ai_daily-tasks_timestamp', String(Date.now()))
        window.dispatchEvent(new Event('lumio-settings-changed'))
      } catch { /* ignore */ }
    } else if (action === 'READ_TASKS') {
      try {
        const cached = JSON.parse(localStorage.getItem('lumio_ai_daily-tasks_cache') || '[]') as { title: string; priority: string }[]
        if (cached.length) {
          const taskList = cached.slice(0, 6).map((t, i) => `${i + 1}. ${t.title}`).join('. ')
          setTimeout(() => speak(`You have ${cached.length} tasks today. ${taskList}.`), 1500)
        } else {
          setTimeout(() => speak('You have no tasks on your list yet. Say "add task" followed by what you need to do.'), 1500)
        }
      } catch { setTimeout(() => speak('I couldn\'t read your tasks right now. Try switching to the Daily Tasks tab.'), 1500) }
    } else if (action === 'READ_QUICK_WINS') {
      try {
        const cached = JSON.parse(localStorage.getItem('lumio_ai_quick-wins_cache') || '[]') as { title: string; impact: string }[]
        if (cached.length) {
          const winList = cached.slice(0, 5).map((w, i) => `${i + 1}. ${w.title}`).join('. ')
          setTimeout(() => speak(`You have ${cached.length} quick wins available. ${winList}.`), 1500)
        } else {
          setTimeout(() => speak('No quick wins available yet. Switch to the Quick Wins tab to generate some.'), 1500)
        }
      } catch { setTimeout(() => speak('I couldn\'t read your quick wins right now.'), 1500) }
    } else if (action === 'READ_TODAY') {
      const todayParts: string[] = []
      if (demoDataActive) {
        const upcoming = MEETINGS.filter(m => m.status !== 'done')
        todayParts.push(`You have ${MEETINGS.length} meetings today${upcoming.length ? '. Next up: ' + upcoming[0].title + ' at ' + upcoming[0].time : ''}.`)
      } else {
        todayParts.push('No calendar connected, so I can\'t see your meetings.')
      }
      try {
        const tasks = JSON.parse(localStorage.getItem('lumio_ai_daily-tasks_cache') || '[]') as { title: string }[]
        if (tasks.length) todayParts.push(`${tasks.length} tasks on your list.`)
      } catch { /* ignore */ }
      try {
        const wins = JSON.parse(localStorage.getItem('lumio_ai_quick-wins_cache') || '[]') as { title: string }[]
        if (wins.length) todayParts.push(`${wins.length} quick wins available.`)
      } catch { /* ignore */ }
      setTimeout(() => speak(todayParts.join(' ')), 1500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand])

  return (
  <>
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', pointerEvents: 'none', borderRadius: 'inherit' }} />
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl" />
      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName || 'there'} 👋</h1>
              <button onClick={handleBriefing} title="Text-to-Speech — Lumio will read your morning headlines, meetings today and urgent items aloud" className="flex items-center justify-center rounded-lg transition-all"
                style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isPlaying ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)', border: isPlaying ? '1px solid rgba(13,148,136,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isPlaying ? '#2DD4BF' : '#9CA3AF', animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
                <Volume2 size={15} strokeWidth={1.75} />
              </button>
              {voiceCommandsEnabled && (
              <button
                onClick={() => isListening ? stopListening() : startListening()}
                title={isListening ? 'Listening...' : "Voice Commands — say 'Hi Lumio' or tap the mic"}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32, flexShrink: 0, cursor: 'pointer',
                  backgroundColor: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                  border: isListening ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  color: isListening ? '#EF4444' : '#F9FAFB',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none',
                }}>
                <Mic size={14} strokeWidth={1.75} />
              </button>
              )}
            </div>
            <p className="text-purple-300 text-sm mb-2">{date}</p>
            <p style={{ color: '#FBBF24' }} className="text-sm italic">&ldquo;{quote.text}&rdquo; — {quote.author}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Meetings', value: demoDataActive ? 4 : (liveCounts.meetings ?? 0), color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '📅', widget: 'meetings' },
              { label: 'Tasks', value: demoDataActive ? 7 : (liveCounts.tasks ?? 0), color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '✅', widget: 'tasks' },
              { label: 'Urgent', value: demoDataActive ? 2 : (liveCounts.urgent ?? 0), color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🔴', widget: 'urgent' },
              { label: 'Emails', value: demoDataActive ? 12 : (liveCounts.emails ?? 0), color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '📧', widget: 'emails' },
            ].map(item => (
              <div key={item.label} onClick={() => onScrollTo?.(item.widget)} className={`flex flex-col items-center px-3 py-2 rounded-xl border ${item.color} min-w-[70px] cursor-pointer transition-transform hover:scale-105`}>
                <span className="text-base">{item.icon}</span>
                {liveCounts.meetings === null && !demoDataActive ? (
                  <div className="w-6 h-5 rounded animate-pulse my-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                ) : (
                  <span className="text-lg font-black text-white">{item.value}</span>
                )}
                <span className="text-xs opacity-70">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 flex-shrink-0">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <span className="text-3xl">{weather.icon}</span>
              <div>
                <div className="text-xl font-black text-white">{weather.temp}</div>
                <div className="text-xs text-purple-300">{weather.condition}</div>
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
        backgroundColor: '#111318', border: postBriefingListening ? '1px solid #A78BFA' : '1px solid #EF4444',
        borderRadius: 999, padding: '8px 20px', zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 8, color: '#F9FAFB', fontSize: 14,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: postBriefingListening ? '#A78BFA' : '#EF4444', animation: 'pulse 1s infinite' }} />
        {postBriefingListening ? 'Listening... what can I help with?' : 'Listening... say a command'}
      </div>
    )}
  </>
  )
}

// ─── Photo Frame ────────────────────────────────────────────────────────────

const DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&q=80',
]

function PhotoFrame({ demoDataActive = false }: { demoDataActive?: boolean }) {
  const photoImpCtx = getImpersonationContext()
  const [photos, setPhotos] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [intervalSecs, setIntervalSecs] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [photoPositions, setPhotoPositions] = useState<Record<number, { x: number; y: number }>>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio-photo-positions') : null; return s ? JSON.parse(s) : {} } catch { return {} } })
  const [hasEverDragged, setHasEverDragged] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio-photo-dragged') === 'true')
  const [hoveringFrame, setHoveringFrame] = useState(false)
  const [showCloudModal, setShowCloudModal] = useState<'google' | 'icloud' | null>(null)
  const isDragging = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const posStartRef = useRef({ x: 50, y: 50 })

  // Sync photos to demoDataActive state
  useEffect(() => {
    if (photoImpCtx.isImpersonating) return
    setPhotos(demoDataActive ? DEMO_PHOTOS : [])
    if (!demoDataActive) localStorage.removeItem('lumio-photo-frame')
  }, [demoDataActive])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && photos.length > 1) intervalRef.current = setInterval(() => setCurrentIdx(i => (i + 1) % photos.length), intervalSecs * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, photos.length, intervalSecs])
  const photosInitRef = useRef(false)
  useEffect(() => { if (!photosInitRef.current) { photosInitRef.current = true; return }; localStorage.setItem('lumio-photo-frame', JSON.stringify(photos)) }, [photos])
  useEffect(() => { localStorage.setItem('lumio-photo-positions', JSON.stringify(photoPositions)) }, [photoPositions])
  function handleAddPhoto(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file || photos.length >= 5) return; const reader = new FileReader(); reader.onload = (ev) => { const src = ev.target?.result as string; setPhotos(prev => [...prev, src]); setCurrentIdx(photos.length) }; reader.readAsDataURL(file); e.target.value = '' }
  function handleRemovePhoto() { if (photos.length <= 1) return; setPhotos(prev => prev.filter((_, i) => i !== currentIdx)); setCurrentIdx(prev => Math.max(0, prev - 1)) }

  function onDragStart(cx: number, cy: number) {
    isDragging.current = true; dragStartRef.current = { x: cx, y: cy }
    posStartRef.current = photoPositions[currentIdx] || { x: 50, y: 50 }
    if (!hasEverDragged) { setHasEverDragged(true); localStorage.setItem('lumio-photo-dragged', 'true') }
  }
  function onDragMove(cx: number, cy: number, el: HTMLElement) {
    if (!isDragging.current) return
    const r = el.getBoundingClientRect()
    const dx = (cx - dragStartRef.current.x) / r.width * 100
    const dy = (cy - dragStartRef.current.y) / r.height * 100
    setPhotoPositions(p => ({ ...p, [currentIdx]: { x: Math.min(100, Math.max(0, posStartRef.current.x - dx)), y: Math.min(100, Math.max(0, posStartRef.current.y - dy)) } }))
  }
  function onDragEnd() { isDragging.current = false }
  function resetPosition() { setPhotoPositions(p => { const n = { ...p }; delete n[currentIdx]; return n }) }
  const pos = photoPositions[currentIdx] || { x: 50, y: 50 }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 240 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2"><span className="text-base">🖼️</span><span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span></div>
        <div className="flex items-center gap-2">
          {photos.length > 1 && <button onClick={() => setIsPlaying(p => !p)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isPlaying ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: isPlaying ? '#0D9488' : '#6B7280' }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>}
          {photos.length > 1 && <button onClick={handleRemovePhoto} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #1F2937', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }} title="Remove this photo">✕ Remove</button>}
          <button onClick={() => fileInputRef.current?.click()} disabled={photos.length >= 5} title={photos.length >= 5 ? 'Maximum 5 photos' : 'Add a photo'} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid #1F2937', background: 'transparent', color: photos.length >= 5 ? '#6B7280' : '#0D9488', cursor: photos.length >= 5 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>+ Add</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddPhoto} style={{ display: 'none' }} />
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 mx-4 mb-4 rounded-xl cursor-pointer" style={{ border: '2px dashed #374151' }} onClick={() => fileInputRef.current?.click()}>
          <div className="text-3xl">📷</div><div className="text-xs" style={{ color: '#9CA3AF' }}>Add your photos</div>
        </div>
      ) : (
      <div className="flex-1 relative mx-4 mb-2 rounded-xl overflow-hidden" style={{ minHeight: 150, cursor: isDragging.current ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseEnter={() => setHoveringFrame(true)} onMouseLeave={() => { setHoveringFrame(false); onDragEnd() }}
        onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX, e.clientY) }}
        onMouseMove={e => onDragMove(e.clientX, e.clientY, e.currentTarget)}
        onMouseUp={onDragEnd}
        onTouchStart={e => { const t = e.touches[0]; if (t) onDragStart(t.clientX, t.clientY) }}
        onTouchMove={e => { const t = e.touches[0]; if (t) onDragMove(t.clientX, t.clientY, e.currentTarget as HTMLElement) }}
        onTouchEnd={onDragEnd}>
        <img src={photos[currentIdx]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${pos.x}% ${pos.y}%`, position: 'absolute', inset: 0, pointerEvents: 'none', transition: isDragging.current ? 'none' : 'object-position 0.15s ease', userSelect: 'none' }} />
        {photos.length > 1 && (<>
          <button onClick={e => { e.stopPropagation(); setCurrentIdx(i => (i - 1 + photos.length) % photos.length) }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'‹'}</button>
          <button onClick={e => { e.stopPropagation(); setCurrentIdx(i => (i + 1) % photos.length) }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'›'}</button>
        </>)}
        <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#D1D5DB' }}>{currentIdx + 1} / {photos.length}</div>
        {(pos.x !== 50 || pos.y !== 50) && hoveringFrame && <button onClick={e => { e.stopPropagation(); resetPosition() }} className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>Reset</button>}
        {!hasEverDragged && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', whiteSpace: 'nowrap' }}>✥ Drag to reposition</div>}
      </div>
      )}
      {photos.length > 1 && <div className="px-4 pb-3 flex items-center gap-2"><span className="text-xs" style={{ color: '#6B7280' }}>Speed:</span>{[3,5,10,30].map(s => <button key={s} onClick={() => setIntervalSecs(s)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: intervalSecs === s ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: intervalSecs === s ? '#0D9488' : '#6B7280' }}>{s}s</button>)}</div>}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #1F2937', background: '#0A0B10', borderRadius: '0 0 16px 16px' }}>
        <p style={{ fontSize: 10, color: '#6B7280', margin: '0 0 6px', textAlign: 'center' }}>Import from</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowCloudModal('google')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid #1F2937', background: '#111318', color: '#9CA3AF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }} onMouseLeave={e => { e.currentTarget.style.background = '#111318'; e.currentTarget.style.color = '#9CA3AF' }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/><path d="M12 7c-2.76 0-5 2.24-5 5h5V7z" fill="#EA4335"/><path d="M7 12c0 2.76 2.24 5 5 5v-5H7z" fill="#FBBC04"/><path d="M12 17c2.76 0 5-2.24 5-5h-5v5z" fill="#34A853"/><path d="M17 12c0-2.76-2.24-5-5-5v5h5z" fill="#4285F4"/></svg>
            Google Photos ✦
          </button>
          <button onClick={() => setShowCloudModal('icloud')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid #1F2937', background: '#111318', color: '#9CA3AF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }} onMouseLeave={e => { e.currentTarget.style.background = '#111318'; e.currentTarget.style.color = '#9CA3AF' }}>
            <svg width="14" height="10" viewBox="0 0 24 16"><path d="M19.35 6.04A7.49 7.49 0 0 0 12 0C9.11 0 6.6 1.64 5.35 4.04A5.994 5.994 0 0 0 0 10c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#3B82F6"/></svg>
            iCloud ✦
          </button>
        </div>
      </div>
      {showCloudModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowCloudModal(null)}>
          <div style={{ background: '#111318', border: '1px solid #1F2937', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{showCloudModal === 'google' ? '📸' : '☁️'}</div>
            <h3 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{showCloudModal === 'google' ? 'Google Photos' : 'iCloud Photos'}</h3>
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>Connect your {showCloudModal === 'google' ? 'Google Photos' : 'iCloud'} to import photos directly into your frame. Available in the next update — for now, upload photos directly using the + Add button above.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#1A1B23', borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Notify me when available</span>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: '#0D9488', position: 'relative', cursor: 'pointer' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, right: 2 }} /></div>
            </div>
            <button onClick={() => setShowCloudModal(null)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0D9488', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Morning Roundup ─────────────────────────────────────────────────────────

const ROUNDUP_ITEMS = [
  {
    id: 'sms', icon: '📱', label: 'SMS / Text', count: 3, urgent: true,
    color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',
    messages: [
      { id: 't1', from: '+44 7700 900123', avatar: 'TW', subject: 'Urgent: Payment query', preview: 'Hi, this is Tom from Bramble Hill. Our payment bounced \u2014 can you call me urgently?', time: '8:05am', urgent: true, read: false },
      { id: 't2', from: '+44 7700 900456', avatar: 'HC', subject: 'Demo confirmation', preview: 'Confirming our demo at 11am today. Looking forward to it!', time: '7:30am', urgent: false, read: false },
      { id: 't3', from: '+44 7700 900789', avatar: 'RD', subject: 'Quick question', preview: 'Is Lumio GDPR compliant? Our IT team needs confirmation before sign-off.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'whatsapp', icon: '💬', label: 'WhatsApp Business', count: 4, urgent: false,
    color: '#25D366', bg: 'rgba(37,211,102,0.08)', border: 'rgba(37,211,102,0.2)',
    messages: [
      { id: 'w1', from: 'Sophie Brennan', avatar: 'SB', subject: 'Re: Lumio demo follow-up', preview: 'Hi, just following up on our call yesterday. When can we schedule the full team demo?', time: '9:15am', urgent: false, read: false },
      { id: 'w2', from: 'James Harlow', avatar: 'JH', subject: 'Contract query', preview: 'Quick question on the contract terms \u2014 can we jump on a call this afternoon?', time: '8:45am', urgent: false, read: false },
      { id: 'w3', from: 'Apex Consulting', avatar: 'AC', subject: 'Renewal reminder', preview: 'Our current contract ends next month. Looking forward to renewing with Lumio.', time: 'Yesterday', urgent: false, read: true },
      { id: 'w4', from: 'Dan Marsh', avatar: 'DM', subject: 'Invoice question', preview: 'Could you resend the latest invoice? Need it for our accounts team.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'email', icon: '📧', label: 'Emails', count: 12, urgent: true,
    color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)',
    messages: [
      { id: 'e1', from: 'Tom Wright', avatar: 'TW', subject: 'Invoice overdue — INV-2026-041', preview: 'Hi, just chasing the invoice from last month — can you confirm when this will be settled?', time: '8:14am', urgent: true, read: false },
      { id: 'e2', from: 'Apex Consulting', avatar: 'AC', subject: 'Renewal discussion — contract ends Apr 30', preview: 'We\u2019d like to discuss the terms for our renewal. Can we schedule a call this week?', time: '7:52am', urgent: true, read: false },
      { id: 'e3', from: 'Payments', avatar: 'PA', subject: 'Payment confirmed — \u00A34,800 from Oakridge', preview: 'Your payment of \u00A34,800.00 from Oakridge Schools Ltd has been processed successfully.', time: '7:31am', urgent: false, read: false },
      { id: 'e4', from: 'Helen Park', avatar: 'HP', subject: 'Re: Lumio Pro demo — follow-up questions', preview: 'Thanks for the demo yesterday. We have a few questions about the safeguarding module...', time: 'Yesterday', urgent: false, read: true },
      { id: 'e5', from: 'Dan Marsh', avatar: 'DM', subject: 'Q2 board pack — action needed', preview: 'Please review the attached slides before Friday\u2019s board meeting and send your comments.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'slack', icon: '💬', label: 'Slack', count: 7, urgent: false,
    color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)',
    messages: [
      { id: 's1', from: 'Rachel Osei', avatar: 'RO', subject: '#sales-pipeline', preview: 'Lead scored 87 in SA-02 — James, want me to move this to Proposal stage?', time: '9:02am', urgent: false, read: false, channel: '#sales-pipeline' },
      { id: 's2', from: 'HR Bot', avatar: 'HR', subject: '#hr-alerts', preview: 'HR-01 workflow completed for new joiner Sophie Williams. Onboarding pack sent \u2713', time: '8:45am', urgent: false, read: false, channel: '#hr-alerts' },
      { id: 's3', from: 'James Harlow', avatar: 'JH', subject: '#general', preview: 'Morning all — heads up, the Wimbledon client is pushing for a demo this Friday. Anyone free?', time: '8:30am', urgent: false, read: false, channel: '#general' },
      { id: 's4', from: 'Rachel Davies', avatar: 'RD', subject: '#management', preview: 'Board pack is ready for review. Can someone sense-check the financial slides?', time: 'Yesterday', urgent: false, read: true, channel: '#management' },
    ]
  },
  {
    id: 'teams', icon: '🟣', label: 'Microsoft Teams', count: 3, urgent: false,
    color: '#7B83EB', bg: 'rgba(123,131,235,0.08)', border: 'rgba(123,131,235,0.2)',
    messages: [
      { id: 'tm1', from: 'Rachel Osei', avatar: 'RO', subject: 'Sales Standup', preview: 'Quick update \u2014 the Apex deal is moving to proposal stage. Can we review pricing before EOD?', time: '9:30am', urgent: false, read: false },
      { id: 'tm2', from: 'Sophie Williams', avatar: 'SW', subject: 'Onboarding checklist', preview: 'Hi James, I\u2019ve completed the first 3 items on my onboarding checklist. Where do I find the IT setup guide?', time: '8:50am', urgent: false, read: false },
      { id: 'tm3', from: 'Ben Holloway', avatar: 'BH', subject: 'Client feedback', preview: 'Just got off a call with Oakridge \u2014 they love the new safeguarding module. Might be worth a case study.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'hubspot', icon: '🟠', label: 'HubSpot', count: 5, urgent: false,
    color: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)',
    messages: [
      { id: 'h1', from: 'HubSpot CRM', avatar: 'HS', subject: 'Deal update — Apex Consulting moved to Negotiation', preview: 'The deal with Apex Consulting (\u00A324,000 ARR) has been moved to Negotiation stage by Rachel Osei.', time: '9:45am', urgent: false, read: false },
      { id: 'h2', from: 'HubSpot CRM', avatar: 'HS', subject: 'New contact — Marcus Chen, Meridian Trust', preview: 'Marcus Chen (CTO, Meridian Trust) has been added as a new contact. Recommended action: schedule intro call.', time: '8:30am', urgent: false, read: false },
      { id: 'h3', from: 'HubSpot', avatar: 'HS', subject: 'Email sequence — 3 contacts opened your email', preview: 'Your "School Digital Transformation" sequence had 3 opens and 1 click-through in the last 24 hours.', time: 'Yesterday', urgent: false, read: true },
      { id: 'h4', from: 'HubSpot', avatar: 'HS', subject: 'Task reminder — follow up with Wimbledon High', preview: 'You have an overdue task: follow up with James Harlow at Wimbledon High regarding the enterprise proposal.', time: 'Yesterday', urgent: true, read: false },
      { id: 'h5', from: 'HubSpot', avatar: 'HS', subject: 'Monthly report ready — March 2026', preview: 'Your March CRM report is ready. Pipeline value: \u00A3775,100. Deals closed: 4. Win rate: 50%.', time: '2 days ago', urgent: false, read: true },
    ]
  },
  {
    id: 'notion', icon: '📋', label: 'Notion', count: 2, urgent: false,
    color: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)',
    messages: [
      { id: 'no1', from: 'Notion', avatar: 'NO', subject: 'Testing guide updated', preview: '2 items resolved in the QA testing guide. Sophie Williams marked "OTP flow" and "School registration" as complete.', time: '9:15am', urgent: false, read: false },
      { id: 'no2', from: 'Notion', avatar: 'NO', subject: 'Q2 Roadmap — 3 items need review', preview: 'The Q2 product roadmap has 3 items flagged for your review before the Friday planning session.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'linkedin', icon: '💼', label: 'LinkedIn', count: 4, urgent: false,
    color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.2)',
    messages: [
      { id: 'l1', from: 'Sophie Brennan', avatar: 'SB', subject: 'Connection request', preview: 'Hi, I came across Lumio and would love to connect. We\u2019re looking for a school management solution.', time: '10:15am', urgent: false, read: false },
      { id: 'l2', from: 'LinkedIn', avatar: 'LI', subject: 'Your post is gaining traction', preview: 'Your post about UK school automation got 47 reactions and 12 comments in the last 24 hours.', time: '9:30am', urgent: false, read: false },
      { id: 'l3', from: 'Marcus Chen', avatar: 'MC', subject: 'Connection request', preview: 'Hi — I\u2019m the CTO at Meridian Trust. Interested to learn more about your SSO capabilities.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'news', icon: '📰', label: 'Industry News', count: 3, urgent: false,
    color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)',
    messages: [
      { id: 'n1', from: 'TechCrunch', avatar: 'TC', subject: 'UK SMB automation market up 34% YoY', preview: 'New research shows UK small businesses are accelerating adoption of AI-powered workflow tools, with the market growing 34% year on year.', time: '8:00am', urgent: false, read: false },
      { id: 'n2', from: 'Schools Week', avatar: 'SW', subject: 'SEND White Paper implementation update', preview: 'DfE confirms timeline for SEND White Paper reforms. Schools must comply with new EHCP digital requirements by September 2026.', time: '7:45am', urgent: false, read: false },
      { id: 'n3', from: 'EdTech Magazine', avatar: 'EM', subject: 'Google Workspace for Education — new admin controls', preview: 'Google announces enhanced admin controls for Workspace for Education accounts, including new SSO policies.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
]

// ─── Roundup message types ──────────────────────────────────────────────────

interface RoundupMessage {
  id: string; source: string; icon: string; color: string; bg: string; border: string
  senderName: string; subject: string; preview: string; timestamp: string
  isRead: boolean; webLink: string | null
}

const ROUNDUP_SOURCES: { key: string; lsKey: string; icon: string; label: string; color: string; bg: string; border: string
  route: string; parse: (d: Record<string, unknown>) => RoundupMessage[]; viewLabel: string; viewUrl: string | null
  group: string; oauthType: 'microsoft' | 'google' | 'coming-soon'; order: number }[] = [
  { key: 'outlook', lsKey: 'lumio_integration_outlook', icon: '📧', label: 'Outlook', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)',
    route: '/api/integrations/microsoft/mail', viewLabel: 'View in Outlook', viewUrl: 'https://outlook.office.com/mail/',
    group: 'email', oauthType: 'microsoft', order: 1,
    parse: (d) => ((d.emails || []) as Record<string, unknown>[]).map(e => ({ id: e.id as string, source: 'outlook', icon: '📧', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)', senderName: (e.senderName as string) || '', subject: (e.subject as string) || '', preview: (e.preview as string) || '', timestamp: (e.receivedAt as string) || '', isRead: !!e.isRead, webLink: (e.webLink as string) || null })) },
  { key: 'gmail', lsKey: 'lumio_integration_gmail', icon: '📨', label: 'Gmail', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
    route: '/api/integrations/google/mail', viewLabel: 'View in Gmail', viewUrl: 'https://mail.google.com/',
    group: 'email', oauthType: 'google', order: 1,
    parse: (d) => ((d.emails || []) as Record<string, unknown>[]).map(e => ({ id: e.id as string, source: 'gmail', icon: '📨', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', senderName: (e.senderName as string) || '', subject: (e.subject as string) || '', preview: (e.preview as string) || '', timestamp: (e.receivedAt as string) || '', isRead: !!e.isRead, webLink: (e.webLink as string) || null })) },
  { key: 'slack', lsKey: 'lumio_integration_slack', icon: '💬', label: 'Slack', color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)',
    route: '/api/integrations/slack/messages', viewLabel: 'Open Slack', viewUrl: null,
    group: 'slack', oauthType: 'coming-soon', order: 2,
    parse: (d) => ((d.messages || []) as Record<string, unknown>[]).map(m => ({ id: m.id as string, source: 'slack', icon: '💬', color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)', senderName: (m.sender as string) || '', subject: (m.channel as string) || '', preview: (m.text as string) || '', timestamp: (m.timestamp as string) || '', isRead: false, webLink: null })) },
  { key: 'whatsapp', lsKey: 'lumio_integration_whatsapp', icon: '💬', label: 'WhatsApp', color: '#25D366', bg: 'rgba(37,211,102,0.08)', border: 'rgba(37,211,102,0.2)',
    route: '/api/integrations/whatsapp/messages', viewLabel: 'Open WhatsApp', viewUrl: null,
    group: 'whatsapp', oauthType: 'coming-soon', order: 3,
    parse: (d) => ((d.messages || []) as Record<string, unknown>[]).map(m => ({ id: m.id as string, source: 'whatsapp', icon: '💬', color: '#25D366', bg: 'rgba(37,211,102,0.08)', border: 'rgba(37,211,102,0.2)', senderName: (m.from as string) || '', subject: 'WhatsApp', preview: (m.preview as string) || '', timestamp: (m.timestamp as string) || '', isRead: !!m.isRead, webLink: null })) },
  { key: 'twilio', lsKey: 'lumio_integration_twilio', icon: '📱', label: 'SMS', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',
    route: '/api/integrations/twilio/messages', viewLabel: 'View SMS', viewUrl: null,
    group: 'sms', oauthType: 'coming-soon', order: 4,
    parse: (d) => ((d.messages || []) as Record<string, unknown>[]).map(m => ({ id: m.id as string, source: 'twilio', icon: '📱', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', senderName: (m.from as string) || '', subject: 'SMS', preview: (m.preview as string) || '', timestamp: (m.timestamp as string) || '', isRead: true, webLink: null })) },
]

function triggerOAuth(type: 'microsoft' | 'google' | 'coming-soon', key: string) {
  if (type === 'coming-soon') return false
  const slug = typeof window !== 'undefined' ? localStorage.getItem('lumio_workspace_slug') || '' : ''
  if (type === 'microsoft') {
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
    if (!clientId) return false
    const state = JSON.stringify({ key: 'microsoft_all', slug })
    const allScopes = 'openid email profile offline_access Mail.Read Mail.Send Calendars.Read Calendars.ReadWrite Team.ReadBasic.All Chat.Read'
    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: 'https://lumiocms.com/api/auth/callback/microsoft', scope: allScopes, state, response_mode: 'query', prompt: 'consent' })}`
    return true
  }
  if (type === 'google') {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return false
    const state = JSON.stringify({ key, slug })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: 'https://lumiocms.com/api/auth/callback/google', scope: `openid email profile https://www.googleapis.com/auth/gmail.readonly`, state, access_type: 'offline', prompt: 'consent' })}`
    return true
  }
  return false
}

function MorningRoundup({ demoDataActive = false }: { demoDataActive?: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replied, setReplied] = useState<string[]>([])
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [showReply, setShowReply] = useState<string | null>(null)
  const [liveMessages, setLiveMessages] = useState<Record<string, RoundupMessage[]>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [unreadFilter, setUnreadFilter] = useState<Record<string, boolean>>({})
  const items = demoDataActive ? ROUNDUP_ITEMS : []

  function handleToggleRead(sourceKey: string, msgId: string, newIsRead: boolean) {
    setLiveMessages(prev => ({
      ...prev,
      [sourceKey]: (prev[sourceKey] || []).map(m => m.id === msgId ? { ...m, isRead: newIsRead } : m),
    }))
  }

  // Check which sources are connected — skip all when impersonating
  const roundupImpCtx = getImpersonationContext()
  const connectedSources = roundupImpCtx.isImpersonating ? [] : ROUNDUP_SOURCES.filter(s => typeof window !== 'undefined' && localStorage.getItem(s.lsKey) === 'true')
  const anyConnected = connectedSources.length > 0

  useEffect(() => {
    if (demoDataActive || !anyConnected) { setLoaded(true); return }
    const token = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : ''
    if (!token) { setLoaded(true); return }

    Promise.all(
      connectedSources.map(async (src) => {
        try {
          const r = await fetch(src.route, { headers: { 'x-workspace-token': token } })
          if (r.status === 401) return { key: src.key, error: `${src.label} reconnection needed`, messages: [] }
          if (r.status === 404) return { key: src.key, error: null, messages: [], authRequired: true }
          if (!r.ok) return { key: src.key, error: null, messages: [] }
          const d = await r.json()
          return { key: src.key, error: null, messages: src.parse(d) }
        } catch { return { key: src.key, error: null, messages: [] } }
      })
    ).then(results => {
      const msgs: Record<string, RoundupMessage[]> = {}
      const errs: Record<string, string> = {}
      for (const r of results) {
        msgs[r.key] = r.messages
        if (r.error) errs[r.key] = r.error
      }
      setLiveMessages(msgs)
      setErrors(errs)
      setLoaded(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoDataActive])

  function handleReply(msgId: string) {
    if (replyText[msgId]?.trim()) {
      setReplied(r => [...r, msgId])
      setShowReply(null)
      setReplyText(t => ({ ...t, [msgId]: '' }))
    }
  }

  function fmtTime(iso: string) {
    try {
      const d = new Date(iso)
      const now = new Date()
      if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    } catch { return '' }
  }

  // Compute totals
  const allLiveMessages = Object.values(liveMessages).flat()
  const totalUnread = allLiveMessages.filter(m => !m.isRead).length
  const hasAnyLive = !demoDataActive && loaded && allLiveMessages.length > 0
  const noMessages = !demoDataActive && loaded && allLiveMessages.length === 0 && items.length === 0

  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>🌅 Morning Roundup</h3>
          {totalUnread > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>{totalUnread} unread</span>}
        </div>
        <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
      </div>

      {/* Errors */}
      {Object.entries(errors).map(([key, msg]) => (
        <div key={key} className="mb-2 rounded-xl p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p className="text-xs" style={{ color: '#F59E0B' }}>{msg}</p>
        </div>
      ))}

      {/* Live message sections by source — with dedup and ordering */}
      {!demoDataActive && (() => {
        // Determine which sources to show — email dedup logic
        const outlookConnected = connectedSources.some(c => c.key === 'outlook')
        const gmailConnected = connectedSources.some(c => c.key === 'gmail')

        const visibleSources = ROUNDUP_SOURCES.filter(src => {
          // Email dedup: if one is connected, hide the other's disconnect row
          if (src.group === 'email') {
            const thisConnected = connectedSources.some(c => c.key === src.key)
            if (thisConnected) return true // always show connected
            // If the OTHER email source is connected, hide this disconnect row
            if (src.key === 'outlook' && gmailConnected) return false
            if (src.key === 'gmail' && outlookConnected) return false
            return true // neither connected — show both
          }
          return true
        })

        // Sort: connected first within each order group, then by order
        const sorted = [...visibleSources].sort((a, b) => {
          const aConn = connectedSources.some(c => c.key === a.key) ? 0 : 1
          const bConn = connectedSources.some(c => c.key === b.key) ? 0 : 1
          if (a.order !== b.order) return a.order - b.order
          return aConn - bConn
        })

        return sorted.map(src => {
        const isConnected = connectedSources.some(c => c.key === src.key)
        const msgs = liveMessages[src.key] || []
        const unread = msgs.filter(m => !m.isRead).length
        const isOpen = expanded === `live-${src.key}`

        if (!isConnected) {
          return (
            <div key={src.key} className="mb-2 rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-40">{src.icon}</span>
                <span className="text-xs" style={{ color: '#4B5563' }}>{src.label}</span>
              </div>
              <button onClick={() => {
                if (!triggerOAuth(src.oauthType, src.key)) {
                  // coming-soon toast — use a temporary element since we don't have toast state here
                  const el = document.createElement('div')
                  el.className = 'fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 shadow-lg text-sm'
                  el.style.cssText = 'background:#111318;border:1px solid #1F2937;color:#F9FAFB'
                  el.textContent = `${src.label} integration coming soon`
                  document.body.appendChild(el)
                  setTimeout(() => el.remove(), 3000)
                }
              }} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
                Connect
              </button>
            </div>
          )
        }

        if (msgs.length === 0) return null

        const filtering = !!unreadFilter[src.key]
        const displayMsgs = filtering ? msgs.filter(m => !m.isRead) : msgs

        return (
          <div key={src.key} className="mb-2 rounded-xl overflow-hidden" style={{ backgroundColor: src.bg, border: `1px solid ${src.border}` }}>
            <button onClick={() => setExpanded(isOpen ? null : `live-${src.key}`)} className="w-full flex items-center justify-between p-3 text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{src.icon}</span>
                <span className="text-sm font-bold" style={{ color: src.color }}>{src.label}</span>
                {unread > 0 && (
                  <button onClick={e => { e.stopPropagation(); setUnreadFilter(prev => ({ ...prev, [src.key]: !prev[src.key] })) }}
                    className="text-xs px-1.5 py-0.5 rounded-full transition-colors" style={{ backgroundColor: filtering ? src.color : `${src.color}20`, color: filtering ? '#fff' : src.color }}>
                    {unread} unread
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#6B7280' }}>{displayMsgs.length}</span>
                <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-2">
                {filtering && (
                  <div className="flex items-center gap-2 px-2 py-1">
                    <span className="text-[10px]" style={{ color: src.color }}>Showing unread only</span>
                    <button onClick={() => setUnreadFilter(prev => ({ ...prev, [src.key]: false }))} className="text-[10px]" style={{ color: '#6B7280' }}>✕</button>
                  </div>
                )}
                {displayMsgs.map(msg => (
                  <div key={msg.id} className="rounded-lg p-3 relative" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', opacity: msg.isRead ? 0.75 : 1 }}>
                    {!msg.isRead && (
                      <span className="absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Unread</span>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold" style={{ backgroundColor: `${msg.color}25`, color: msg.color }}>
                          {msg.senderName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || msg.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs truncate ${msg.isRead ? 'font-normal' : 'font-bold'}`} style={{ color: '#F9FAFB' }}>{msg.senderName}</p>
                          <p className={`text-[10px] truncate ${msg.isRead ? 'font-normal' : 'font-semibold'}`} style={{ color: msg.isRead ? '#6B7280' : '#9CA3AF' }}>{msg.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!msg.isRead && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: msg.color }} />}
                        <span className="text-[10px]" style={{ color: '#6B7280' }}>{fmtTime(msg.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: '#9CA3AF' }}>{msg.preview}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {msg.webLink && (
                        <a href={msg.webLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold" style={{ color: msg.color }}>
                          {src.viewLabel} →
                        </a>
                      )}
                    </div>
                    {(src.key === 'outlook' || src.key === 'gmail') && (
                      <EmailActions msgId={msg.id} source={src.key} senderEmail={msg.senderName} subject={msg.subject} preview={msg.preview} isRead={msg.isRead} onToast={(_m: string) => {}} onToggleRead={(id, newRead) => handleToggleRead(src.key, id, newRead)} />
                    )}
                  </div>
                ))}
                {src.viewUrl && (
                  <a href={src.viewUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-[10px] font-semibold pt-1" style={{ color: src.color }}>
                    View all in {src.label} →
                  </a>
                )}
              </div>
            )}
          </div>
        )
      }) })()}

      {noMessages && anyConnected && (
        <p className="text-xs text-center py-3 mb-2" style={{ color: '#6B7280' }}>No new messages since your last visit.</p>
      )}

      {/* Demo items or empty state */}
      <div className="space-y-2">
        {!anyConnected && !demoDataActive && items.length === 0 && (
          <p className="text-xs text-center py-6" style={{ color: '#6B7280' }}>Connect your tools in Settings to see messages here.</p>
        )}
        {items.map(item => {
          const isOpen = expanded === item.id
          return (
            <div key={item.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
              {/* Header row */}
              <button onClick={() => setExpanded(isOpen ? null : item.id)} className="w-full flex items-center justify-between p-3 text-left">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.label}</span>
                  {item.urgent && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171' }}>Urgent</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black" style={{ color: item.color }}>{item.count}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Messages */}
              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {item.messages.map(msg => (
                    <div key={msg.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', opacity: msg.read ? 0.7 : 1 }}>
                      {/* Message header */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: item.color + '22', color: item.color }}>
                            {msg.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{msg.from}</span>
                              {!msg.read && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />}
                              {msg.urgent && <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171', fontSize: 10 }}>Urgent</span>}
                            </div>
                            <div className="text-xs font-medium" style={{ color: '#D1D5DB' }}>{msg.subject}</div>
                          </div>
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: '#6B7280' }}>{msg.time}</span>
                      </div>

                      {/* Preview text */}
                      <p className="text-xs mb-2 leading-relaxed" style={{ color: '#9CA3AF' }}>{msg.preview}</p>

                      {/* Action buttons */}
                      {replied.includes(msg.id) ? (
                        <span className="text-xs" style={{ color: '#0D9488' }}>✓ Replied</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setShowReply(showReply === msg.id ? null : msg.id)}
                            className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                            style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}
                          >↩ Reply</button>
                          <button
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}
                          >→ Forward</button>
                          {item.id === 'slack' && (
                            <button
                              className="text-xs px-2.5 py-1 rounded-lg"
                              style={{ backgroundColor: 'rgba(192,132,252,0.15)', color: '#C084FC', border: '1px solid rgba(192,132,252,0.3)' }}
                            >👍 Like</button>
                          )}
                          <button
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.1)' }}
                          >📁 Move</button>
                        </div>
                      )}

                      {/* Reply box */}
                      {showReply === msg.id && (
                        <div className="mt-2">
                          <textarea
                            value={replyText[msg.id] || ''}
                            onChange={e => setReplyText(t => ({ ...t, [msg.id]: e.target.value }))}
                            placeholder="Write your reply..."
                            rows={2}
                            className="w-full text-xs rounded-lg p-2 resize-none"
                            style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB', outline: 'none' }}
                          />
                          <div className="flex gap-2 mt-1.5">
                            <button
                              onClick={() => handleReply(msg.id)}
                              className="text-xs px-3 py-1 rounded-lg font-semibold"
                              style={{ backgroundColor: '#0D9488', color: '#fff' }}
                            >Send</button>
                            <button
                              onClick={() => setShowReply(null)}
                              className="text-xs px-3 py-1 rounded-lg"
                              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}
                            >Cancel</button>
                          </div>
                        </div>
                      )}
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

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

const OVERVIEW_TABS: { id: OverviewTab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '🏠' }, { id: 'quick-wins', label: 'Quick Wins', icon: '⚡' },
  { id: 'tasks', label: 'Daily Tasks', icon: '✅' }, { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'not-to-miss', label: "Don't Miss", icon: '🔴' }, { id: 'team', label: 'Team', icon: '👥' },
]

function TabBar({ tab, onChange }: { tab: OverviewTab; onChange: (t: OverviewTab) => void }) {
  const visibleTabs = OVERVIEW_TABS.filter(t => t.id === 'today' || (typeof window !== 'undefined' ? localStorage.getItem(`lumio_tab_${t.id}_visible`) !== 'false' : true))
  return (
    <div className="sticky top-0 z-50 border-b overflow-x-auto scrollbar-none -mx-4 sm:-mx-5" style={{ backgroundColor: '#0D0E14', borderColor: '#1F2937' }}>
      <div className="flex items-center gap-0 min-w-max px-2">
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{ borderBottomColor: tab === t.id ? '#7C3AED' : 'transparent', color: tab === t.id ? '#A78BFA' : '#6B7280', backgroundColor: tab === t.id ? 'rgba(124,58,237,0.05)' : 'transparent' }}>
            <span className="text-base">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Meetings Today ──────────────────────────────────────────────────────────

const MEETINGS: { id: string; title: string; time: string; duration: string; attendees: string[]; location: string; type: string; status: string; link?: string }[] = [
  { id: '1', title: 'Weekly Team Check-in', time: '09:00', duration: '30 min', attendees: ['Sarah M.'], location: 'Google Meet', type: 'video', status: 'done' },
  { id: '2', title: 'New Customer Demo', time: '11:00', duration: '45 min', attendees: ['Rachel O.'], location: 'Zoom', type: 'video', status: 'now', link: '#' },
  { id: '3', title: 'Investor Update Call', time: '14:00', duration: '60 min', attendees: ['James'], location: 'Google Meet', type: 'call', status: 'upcoming', link: '#' },
  { id: '4', title: 'Team Standup', time: '17:00', duration: '15 min', attendees: ['All team'], location: 'Slack Huddle', type: 'internal', status: 'upcoming' },
]

interface LiveCalEvent { id: string; title: string; start: string; end: string; attendeesCount: number; location: string | null; isOnline: boolean; joinUrl: string | null; source?: 'microsoft' | 'google' }

function MeetingsToday({ demoDataActive = false }: { demoDataActive?: boolean }) {
  const [liveEvents, setLiveEvents] = useState<LiveCalEvent[] | null>(null)
  const [calError, setCalError] = useState<string | null>(null)
  const [meetingToast, setMeetingToast] = useState<string | null>(null)
  useEffect(() => { if (meetingToast) { const t = setTimeout(() => setMeetingToast(null), 3000); return () => clearTimeout(t) } }, [meetingToast])
  const impCtx = getImpersonationContext()
  const msCalConnected = !impCtx.isImpersonating && typeof window !== 'undefined' && localStorage.getItem('lumio_integration_outlook_cal') === 'true'
  const gCalConnected = !impCtx.isImpersonating && typeof window !== 'undefined' && localStorage.getItem('lumio_integration_gcal') === 'true'
  const calConnected = msCalConnected || gCalConnected

  useEffect(() => {
    if (!calConnected || demoDataActive) return
    const token = localStorage.getItem('workspace_session_token') || ''
    if (!token) return
    const fetches: Promise<LiveCalEvent[]>[] = []
    if (msCalConnected) fetches.push(fetch('/api/integrations/microsoft/calendar', { headers: { 'x-workspace-token': token } }).then(r => { if (r.status === 401) { setCalError('Outlook Calendar reconnection needed'); return [] } return r.ok ? r.json().then((d: { events: LiveCalEvent[] }) => (d.events || []).map(e => ({ ...e, source: 'microsoft' as const }))) : [] }).catch(() => []))
    if (gCalConnected) fetches.push(fetch('/api/integrations/google/calendar', { headers: { 'x-workspace-token': token } }).then(r => { if (r.status === 401) { setCalError('Google Calendar reconnection needed'); return [] } return r.ok ? r.json().then((d: { events: LiveCalEvent[] }) => (d.events || []).map(e => ({ ...e, source: 'google' as const }))) : [] }).catch(() => []))
    Promise.all(fetches).then(results => {
      const all = results.flat(); const seen = new Set<string>()
      const deduped = all.filter(e => { const k = `${e.title}|${e.start}`; if (seen.has(k)) return false; seen.add(k); return true })
      setLiveEvents(deduped.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()))
    })
  }, [calConnected, msCalConnected, gCalConnected, demoDataActive])

  // Use live data if available, otherwise demo data
  const hasLive = calConnected && !demoDataActive && liveEvents !== null
  const demoMeetings = demoDataActive ? MEETINGS : []

  function formatTime(iso: string) {
    try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }

  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>📅 Meetings Today</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>
          {hasLive ? `${liveEvents!.length} scheduled` : `${demoMeetings.length} scheduled`}
        </span>
      </div>

      {calError && (
        <div className="mb-3 rounded-xl p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p className="text-xs" style={{ color: '#F59E0B' }}>{calError}</p>
        </div>
      )}

      {hasLive ? (
        liveEvents!.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: '#6B7280' }}>No meetings today.</p>
        ) : (
          <div className="space-y-1">
            {liveEvents!.map(evt => {
              const now = new Date()
              const start = new Date(evt.start)
              const end = new Date(evt.end)
              const isNow = now >= start && now <= end
              const isPast = now > end
              return (
                <div key={evt.id}>
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ opacity: isPast ? 0.4 : 1 }}>
                    <div className="text-center flex-shrink-0 w-12">
                      <div className="text-sm font-bold" style={{ color: isNow ? '#4ADE80' : '#E5E7EB' }}>{formatTime(evt.start)}</div>
                      <div className="text-xs" style={{ color: '#6B7280' }}>{formatTime(evt.end)}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-base">{evt.isOnline ? '📹' : '📅'}</span>
                      {evt.source && <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: evt.source === 'google' ? 'rgba(66,133,244,0.15)' : 'rgba(0,164,239,0.15)', color: evt.source === 'google' ? '#4285F4' : '#00A4EF' }}>{evt.source === 'google' ? 'G' : 'M'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: isPast ? '#6B7280' : '#F9FAFB', textDecoration: isPast ? 'line-through' : 'none' }}>{evt.title}</p>
                      <p className="text-xs truncate" style={{ color: '#6B7280' }}>
                        {evt.attendeesCount > 0 ? `${evt.attendeesCount} attendee${evt.attendeesCount > 1 ? 's' : ''}` : ''}
                        {evt.location ? ` · ${evt.location}` : ''}
                      </p>
                    </div>
                    {isNow && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
                  </div>
                  {!isPast && (
                    <div className="px-3 pb-1">
                      <MeetingActions eventId={evt.id} title={evt.title} startTime={formatTime(evt.start)} joinUrl={evt.joinUrl} source={evt.source} onToast={setMeetingToast} onCancel={() => setLiveEvents(prev => prev ? prev.filter(e => e.id !== evt.id) : prev)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
          {demoMeetings.length === 0 && !calConnected && (
            <div className="space-y-2 py-3">
              {(!msCalConnected || !impCtx.isImpersonating) && !gCalConnected && (
                <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-40">📅</span>
                    <span className="text-xs" style={{ color: '#4B5563' }}>Outlook Calendar</span>
                  </div>
                  <button onClick={() => triggerOAuth('microsoft', 'outlook_cal')} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>Connect</button>
                </div>
              )}
              {(!gCalConnected || !impCtx.isImpersonating) && !msCalConnected && (
                <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm opacity-40">📅</span>
                    <span className="text-xs" style={{ color: '#4B5563' }}>Google Calendar</span>
                  </div>
                  <button onClick={() => triggerOAuth('google', 'gcal')} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>Connect</button>
                </div>
              )}
              <p className="text-xs text-center pt-1" style={{ color: '#4B5563' }}>Connect your calendar to see today&apos;s meetings</p>
            </div>
          )}
          {demoMeetings.length === 0 && calConnected && liveEvents === null && (
            <p className="text-xs text-center py-6" style={{ color: '#6B7280' }}>Loading calendar...</p>
          )}
          {demoMeetings.map(m => {
            const live = m.status === 'now'
            return (
              <div key={m.id}>
                {live && (
                  <div className="mb-3 rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                    <div className="flex-1"><p className="text-sm font-bold" style={{ color: '#4ADE80' }}>{m.title}</p><p className="text-xs" style={{ color: 'rgba(74,222,128,0.6)' }}>Happening now · {m.duration}</p></div>
                    <button onClick={() => setMeetingToast(`Forwarded: ${m.title}`)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all flex-shrink-0">Forward</button>
                    <button onClick={() => setMeetingToast(`Declined: ${m.title}`)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-700/30 transition-all flex-shrink-0">Decline</button>
                    {m.link && <a href={m.link} className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: '#16A34A' }}>Join &rarr;</a>}
                  </div>
                )}
                {!live && (
                  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ opacity: m.status === 'done' ? 0.4 : 1 }}>
                    <div className="text-center flex-shrink-0 w-12"><div className="text-sm font-bold" style={{ color: '#E5E7EB' }}>{m.time}</div><div className="text-xs" style={{ color: '#6B7280' }}>{m.duration}</div></div>
                    <span className="text-base flex-shrink-0">{{ call: '📞', video: '📹', internal: '💬' }[m.type]}</span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate" style={{ color: m.status === 'done' ? '#6B7280' : '#F9FAFB', textDecoration: m.status === 'done' ? 'line-through' : 'none' }}>{m.title}</p><p className="text-xs truncate" style={{ color: '#6B7280' }}>{m.attendees.join(', ')} · {m.location}</p></div>
                    {m.status !== 'done' && <>
                      <button onClick={() => setMeetingToast(`Forwarded: ${m.title}`)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all flex-shrink-0">Forward</button>
                      <button onClick={() => setMeetingToast(`Declined: ${m.title}`)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-700/30 transition-all flex-shrink-0">Decline</button>
                    </>}
                    {m.link && m.status !== 'done' && <a href={m.link} className="px-2 py-1 text-xs rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>Join &rarr;</a>}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* Meeting action toast */}
      {meetingToast && (
        <div className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
          {meetingToast}
        </div>
      )}
    </div>
  )
}

// ─── Quick Actions Bar ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Send Email', tooltip: 'Open the email composer', icon: Mail, integrations: null, integrationLabel: '' },
  { label: 'Send Slack', tooltip: 'Send a message on Slack', icon: MessageSquare, integrations: null, integrationLabel: '' },
  { label: 'Phone Call', tooltip: 'Log a phone call', icon: Phone, integrations: null, integrationLabel: '' },
  { label: 'Book Meeting', tooltip: 'Schedule a meeting or team event', icon: Calendar, integrations: null, integrationLabel: '' },
  { label: 'Claim Expenses', tooltip: 'Submit an expense claim', icon: Receipt, integrations: null, integrationLabel: '' },
  { label: 'Book Holiday', tooltip: 'Request annual leave', icon: Calendar, integrations: null, integrationLabel: '' },
  { label: 'Report Sickness', tooltip: 'Report an absence', icon: AlertCircle, integrations: null, integrationLabel: '' },
  { label: 'Submit Timesheet', tooltip: 'Log your weekly hours', icon: FileText, integrations: null, integrationLabel: '' },
  { label: 'Log Remote Day', tooltip: 'Log a remote working day', icon: Home, integrations: null, integrationLabel: '' },
  { label: 'IT Support', tooltip: 'Raise an IT support ticket', icon: Laptop, integrations: null, integrationLabel: '' },
  { label: 'Request Sign-off', tooltip: 'Request document sign-off', icon: ClipboardCheck, integrations: null, integrationLabel: '' },
  { label: 'Book Training', tooltip: 'Request a training course', icon: GraduationCap, integrations: null, integrationLabel: '' },
  { label: 'Request 1-1', tooltip: 'Request a 1-1 meeting', icon: Handshake, integrations: null, integrationLabel: '' },
  { label: 'Raise Issue', tooltip: 'Raise an issue or concern', icon: AlertCircle, integrations: null, integrationLabel: '' },
  { label: 'Post Announcement', tooltip: 'Post a company announcement', icon: Megaphone, integrations: null, integrationLabel: '' },
  { label: 'Onboard Starter', tooltip: 'Start new joiner onboarding', icon: UserPlus, integrations: null, integrationLabel: '' },
  { label: 'Purchase Request', tooltip: 'Submit a purchase request', icon: ShoppingCart, integrations: null, integrationLabel: '' },
  { label: 'Request Access', tooltip: 'Request system access', icon: Key, integrations: null, integrationLabel: '' },
  { label: 'Log Overtime', tooltip: 'Log overtime hours', icon: Timer, integrations: null, integrationLabel: '' },
  { label: 'Run Report', tooltip: 'Generate a report', icon: BarChart3, integrations: null, integrationLabel: '' },
]

function isIntegrationConnected(keys: string[] | null): boolean {
  if (!keys) return true // null means always works (e.g. Phone Call)
  return keys.some(k => typeof window !== 'undefined' && localStorage.getItem(`lumio_integration_${k}`) === 'true')
}

function QuickActionsBar({ onAction, onGoSettings }: { onAction: (label: string) => void; onGoSettings: () => void }) {
  const visibleActions = QUICK_ACTIONS.filter(a => typeof window !== 'undefined' ? localStorage.getItem(`lumio_qa_${a.label.toLowerCase().replace(/\s+/g, '')}_visible`) !== 'false' : true)
  const [toast, setToast] = useState<{ label: string; integration: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  if (!visibleActions.length) return null

  function handleClick(a: typeof QUICK_ACTIONS[0]) {
    const connected = isIntegrationConnected(a.integrations)
    if (connected) {
      onAction(a.label)
    } else {
      setToast({ label: a.label, integration: a.integrationLabel })
    }
  }

  return (
    <>
      <div className="sticky top-[44px] z-40 flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937' }}>
        <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
        {visibleActions.map(a => {
          const connected = isIntegrationConnected(a.integrations)
          return (
            <div key={a.label} className="relative group shrink-0">
              <button onClick={() => handleClick(a)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                <a.icon size={12} />{a.label}
              </button>
              <div className="pointer-events-none absolute left-1/2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ bottom: '100%', transform: 'translateX(-50%)', marginBottom: 8, zIndex: 9999 }}>
                <div className="px-2.5 py-1.5 rounded-lg text-xs w-52 text-center" style={{ backgroundColor: '#1A1D27', color: '#D1D5DB', border: '1px solid #374151' }}>
                  {connected ? a.tooltip : 'Connect your tools in Settings to use this feature'}
                </div>
                <div style={{ width: 0, height: 0, margin: '0 auto', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #374151' }} />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── Dept Redirect — navigate to the real (dashboard) page ──────────────────

const DEPT_ROUTES: Record<string, string> = {
  hr: '/hr', accounts: '/accounts', sales: '/sales', crm: '/crm',
  marketing: '/marketing', trials: '/trials', operations: '/operations',
  support: '/support', success: '/success', it: '/it', workflows: '/workflows',
  partners: '/partners', strategy: '/strategy', insights: '/insights',
  directors: '/directors',
}

function DeptRedirect({ dept, slug }: { dept: DeptId; slug: string }) {
  const router = useRouter()
  useEffect(() => {
    const route = DEPT_ROUTES[dept]
    if (route) {
      router.push(slug ? `/${slug}${route}` : route)
    }
  }, [dept, slug, router])
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin" style={{ color: '#0D9488' }} />
    </div>
  )
}

// ─── AI Morning Summary Panel ────────────────────────────────────────────────

const MORNING_HIGHLIGHTS = [
  'You have 3 meetings today — first up: Weekly Check-in at 9am',
  '8 emails overnight — 1 marked urgent, re: upcoming contract renewal',
  '2 workflows need your attention — Invoice chase is highest priority',
  'Monthly MRR tracking ahead of target — 12% growth month-on-month',
  'New trial conversion this week — explore the Trials section for details',
  'Reminder: end-of-month reporting due Friday',
]

function MorningAIPanel({ demoDataActive = false }: { demoDataActive?: boolean }) {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayLabel = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #6C3FC5' }}>
      <button className="flex w-full items-center justify-between px-5 py-4" style={{ backgroundColor: 'rgba(108,63,197,0.08)', borderBottom: open ? '1px solid rgba(108,63,197,0.3)' : undefined }} onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Morning Summary</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{dayLabel}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#6C3FC5' }} /> : <ChevronDown size={14} style={{ color: '#6C3FC5' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ backgroundColor: '#0f0e17', maxHeight: '12rem' }}>
          {demoDataActive ? MORNING_HIGHLIGHTS.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#C4B5FD' }}>{item}</p>
            </div>
          )) : (
            <p className="text-xs text-center py-3" style={{ color: '#6B7280' }}>Connect your tools in Settings to generate your AI morning summary.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab Placeholder ─────────────────────────────────────────────────────────

function TabPlaceholder({ tab }: { tab: OverviewTab }) {
  const labels: Record<OverviewTab, { title: string; icon: string; desc: string }> = {
    'today': { title: 'Today', icon: '🏠', desc: '' },
    'quick-wins': { title: 'Quick Wins', icon: '⚡', desc: 'Your highest-impact actions for today, prioritised by AI.' },
    'tasks': { title: 'Daily Tasks', icon: '✅', desc: 'All your tasks in one place, synced from Notion and your calendar.' },
    'insights': { title: 'Insights', icon: '📊', desc: 'Key metrics and AI-generated observations across your business.' },
    'not-to-miss': { title: "Don't Miss", icon: '🔴', desc: 'Critical items that need your attention today.' },
    'team': { title: 'Team', icon: '👥', desc: 'See what your team is working on and who needs support.' },
  }
  const { title, icon, desc } = labels[tab]
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl" style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>{icon}</div>
      <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{title}</h3>
      <p className="text-sm max-w-xs" style={{ color: '#9CA3AF' }}>{desc || 'Coming soon to your live workspace.'}</p>
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

// ─── Briefing Settings ──────────────────────────────────────────────────────

function BriefingSettings() {
  const [enabled, setEnabled] = useState(true)
  const [weather, setWeather] = useState(true)
  const [meetings, setMeetings] = useState(true)
  const [urgent, setUrgent] = useState(true)
  const [time, setTime] = useState('8am')

  useEffect(() => {
    if (localStorage.getItem('lumio_briefing_enabled') === 'false') setEnabled(false)
    if (localStorage.getItem('lumio_briefing_weather') === 'false') setWeather(false)
    if (localStorage.getItem('lumio_briefing_meetings') === 'false') setMeetings(false)
    if (localStorage.getItem('lumio_briefing_urgent') === 'false') setUrgent(false)
    const t = localStorage.getItem('lumio_briefing_time'); if (t) setTime(t)
  }, [])

  function toggle(key: string, val: boolean, setter: (v: boolean) => void) {
    setter(!val)
    localStorage.setItem(key, String(!val))
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">🗣️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Morning Briefing</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Configure what's included in your daily voice summary</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Enable Morning Briefing</p><p className="text-xs" style={{ color: '#6B7280' }}>AI-generated daily summary read aloud</p></div>
          <button onClick={() => toggle('lumio_briefing_enabled', enabled, setEnabled)} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: enabled ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: enabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Include weather in briefing</span>
          <button onClick={() => toggle('lumio_briefing_weather', weather, setWeather)} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: weather ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: weather ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Include meetings in briefing</span>
          <button onClick={() => toggle('lumio_briefing_meetings', meetings, setMeetings)} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: meetings ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: meetings ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Include urgent items in briefing</span>
          <button onClick={() => toggle('lumio_briefing_urgent', urgent, setUrgent)} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: urgent ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: urgent ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Briefing time</span>
          <select value={time} onChange={e => { setTime(e.target.value); localStorage.setItem('lumio_briefing_time', e.target.value) }}
            style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '6px 10px', fontSize: 13, outline: 'none' }}>
            <option>6am</option><option>7am</option><option>8am</option><option>9am</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Voice Selector ─────────────────────────────────────────────────────────

const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', desc: 'Warm & clear — your daily motivator', sample: 'Good morning. Let\'s make today count.' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', desc: 'Calm & deep — reassuring and steady', sample: 'Good morning. Everything is under control.' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', desc: 'Bright & energetic — upbeat and clear', sample: 'Good morning. Your enemies won\'t know what\'s coming.' },
]

function VoiceSelector() {
  const [activeVoice, setActiveVoice] = useState('21m00Tcm4TlvDq8ikWAM')
  const [previewing, setPreviewing] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [ttsOn, setTtsOn] = useState(true)
  const [vcOn, setVcOn] = useState(true)

  useEffect(() => {
    const v = localStorage.getItem('lumio_tts_voice'); if (v) setActiveVoice(v)
    if (localStorage.getItem('lumio_tts_enabled') === 'false') setTtsOn(false)
    if (localStorage.getItem('lumio_voice_commands_enabled') === 'false') setVcOn(false)
  }, [])

  function selectVoice(id: string) {
    setActiveVoice(id)
    localStorage.setItem('lumio_tts_voice', id)
  }

  async function preview(voice: typeof VOICES[0]) {
    // Stop any current preview
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (previewing === voice.id) { setPreviewing(null); return }

    setPreviewing(voice.id)
    try {
      console.log('[TTS Preview] calling with voice_id:', voice.id, 'text:', voice.sample)
      const wsToken = localStorage.getItem('workspace_session_token') || ''
      const demoToken = localStorage.getItem('demo_session_token') || ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (wsToken) headers['x-workspace-token'] = wsToken
      if (demoToken) headers['x-demo-token'] = demoToken

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: voice.sample, voice_id: voice.id }),
      })
      console.log('[TTS Preview] response status:', res.status)
      if (!res.ok) throw new Error('TTS failed')

      const buf = await res.arrayBuffer()
      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setPreviewing(null); audioRef.current = null; URL.revokeObjectURL(url) }
      audio.onerror = (e) => { console.error('[TTS Preview] audio error:', e); setPreviewing(null); URL.revokeObjectURL(url) }
      await audio.play()
    } catch (err) {
      console.error('[TTS Preview] error:', err)
      setPreviewing(null)
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">🎙️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice Assistant</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Choose the voice for your AI morning briefing</p>
          </div>
        </div>
      </div>
      <div className="px-5 pt-4 space-y-3">
        {/* TTS Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>🔊 Text to Speech</div>
            <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>AI voice reads your morning briefing and responds to actions</div>
          </div>
          <button onClick={() => { const v = !ttsOn; setTtsOn(v); localStorage.setItem('lumio_tts_enabled', String(v)) }} className="flex-shrink-0"
            style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: ttsOn ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: ttsOn ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
        {/* Voice Commands Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#F9FAFB' }}>🎙️ Voice Commands</div>
            <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Say &ldquo;Hi Lumio&rdquo; to activate voice control — navigate, open forms, get briefings</div>
          </div>
          <button onClick={() => { const v = !vcOn; setVcOn(v); localStorage.setItem('lumio_voice_commands_enabled', String(v)) }} className="flex-shrink-0"
            style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: vcOn ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, left: vcOn ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
        {VOICES.map(voice => {
          const isActive = activeVoice === voice.id
          const isPreviewing = previewing === voice.id
          return (
            <div
              key={voice.id}
              className="rounded-xl p-4 transition-colors"
              style={{
                backgroundColor: '#0A0B10',
                border: isActive ? '1px solid #0D9488' : '1px solid #1F2937',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{voice.name}</p>
                {isActive && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>
                    ✓ Active
                  </span>
                )}
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6B7280' }}>{voice.desc}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => preview(voice)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: isPreviewing ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isPreviewing ? '#A78BFA' : '#9CA3AF',
                    border: isPreviewing ? '1px solid rgba(124,58,237,0.3)' : '1px solid #1F2937',
                  }}
                >
                  {isPreviewing ? '■ Stop' : '▶ Preview'}
                </button>
                {!isActive && (
                  <button
                    onClick={() => selectVoice(voice.id)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Timezone Selector ──────────────────────────────────────────────────────

function TimezoneSelector() {
  const [zones, setZones] = useState(DEFAULT_WORLD_ZONES)
  const [search, setSearch] = useState('')
  const localTz = getUserLocalTz()
  useEffect(() => { setZones(getStoredZones()) }, [])

  function toggleZone(zone: { label: string; tz: string }) {
    const exists = zones.some(z => z.tz === zone.tz)
    let next: { label: string; tz: string }[]
    if (exists) {
      next = zones.filter(z => z.tz !== zone.tz)
    } else {
      if (zones.length >= 4) return
      next = [...zones, zone]
    }
    setZones(next)
    localStorage.setItem('lumio_world_zones', JSON.stringify(next))
    window.dispatchEvent(new StorageEvent('storage', { key: 'lumio_world_zones', newValue: JSON.stringify(next) }))
  }

  const filtered = search
    ? ALL_TIMEZONES.filter(z => z.label.toLowerCase().includes(search.toLowerCase()))
    : ALL_TIMEZONES

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">🕐</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>World Clock Timezones</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Choose up to 4 timezones to display in your dashboard</p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <span style={{ color: '#6B7280' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search timezones..." className="text-sm bg-transparent outline-none flex-1" style={{ color: '#F9FAFB' }} />
        </div>

        {/* Local timezone */}
        <div className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#FBBF24' }}>📍</span>
            <span className="text-sm font-medium" style={{ color: '#FBBF24' }}>{localTz.label}</span>
            <span className="text-xs" style={{ color: 'rgba(251,191,36,0.6)' }}>Your timezone</span>
          </div>
        </div>

        {/* Timezone list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
          {filtered.map(zone => {
            const isSelected = zones.some(z => z.tz === zone.tz)
            return (
              <button
                key={zone.tz}
                onClick={() => toggleZone(zone)}
                disabled={!isSelected && zones.length >= 4}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors"
                style={{
                  backgroundColor: isSelected ? 'rgba(13,148,136,0.08)' : '#0A0B10',
                  border: isSelected ? '1px solid rgba(13,148,136,0.3)' : '1px solid #1F2937',
                  opacity: !isSelected && zones.length >= 4 ? 0.4 : 1,
                  cursor: !isSelected && zones.length >= 4 ? 'not-allowed' : 'pointer',
                }}
              >
                <span className="text-sm" style={{ color: isSelected ? '#0D9488' : '#9CA3AF' }}>{zone.label}</span>
                {isSelected && <span style={{ color: '#0D9488' }}>✓</span>}
              </button>
            )
          })}
        </div>

        <p className="text-xs" style={{ color: '#6B7280' }}>{zones.length}/4 selected</p>
      </div>
    </div>
  )
}

// ─── Integration Groups ─────────────────────────────────────────────────────

const INTEGRATION_GROUPS = [
  { label: 'Communication', items: [
    { key: 'gmail', name: 'Gmail', desc: 'Email sync & send' },
    { key: 'outlook', name: 'Outlook / Microsoft 365', desc: 'Email sync & send' },
    { key: 'slack', name: 'Slack', desc: 'Team messaging' },
    { key: 'teams', name: 'Microsoft Teams', desc: 'Meetings & chat' },
    { key: 'whatsapp', name: 'WhatsApp Business', desc: 'Customer messaging' },
    { key: 'twilio', name: 'Twilio SMS', desc: 'SMS & voice' },
  ]},
  { label: 'Calendar', items: [
    { key: 'gcal', name: 'Google Calendar', desc: 'Calendar sync' },
    { key: 'outlook_cal', name: 'Outlook Calendar', desc: 'Calendar sync' },
  ]},
  { label: 'Finance & Accounting', items: [
    { key: 'xero', name: 'Xero', desc: 'Accounting & invoicing' },
    { key: 'quickbooks', name: 'QuickBooks', desc: 'Bookkeeping' },
    { key: 'sage', name: 'Sage', desc: 'Accounting & payroll' },
    { key: 'freeagent', name: 'FreeAgent', desc: 'Small business accounting' },
  ]},
  { label: 'CRM & Sales', items: [
    { key: 'hubspot', name: 'HubSpot', desc: 'CRM & marketing' },
    { key: 'salesforce', name: 'Salesforce', desc: 'Enterprise CRM' },
    { key: 'pipedrive', name: 'Pipedrive', desc: 'Sales pipeline' },
    { key: 'zendesk', name: 'Zendesk', desc: 'Customer support & ticketing' },
  ]},
  { label: 'HR & People', items: [
    { key: 'bamboohr', name: 'BambooHR', desc: 'HR management' },
    { key: 'sage_hr', name: 'Sage HR', desc: 'HR & payroll' },
    { key: 'breathe', name: 'Breathe HR', desc: 'People management' },
    { key: 'worksmarter', name: 'WorkSmarter', desc: 'HR & workforce management' },
  ]},
  { label: 'Project Management', items: [
    { key: 'asana', name: 'Asana', desc: 'Task & project tracking' },
    { key: 'monday', name: 'Monday.com', desc: 'Work management' },
    { key: 'trello', name: 'Trello', desc: 'Kanban boards' },
    { key: 'notion', name: 'Notion', desc: 'Docs & wikis' },
    { key: 'clickup', name: 'ClickUp', desc: 'All-in-one productivity' },
  ]},
  { label: 'Storage & Files', items: [
    { key: 'gdrive', name: 'Google Drive', desc: 'Cloud storage' },
    { key: 'onedrive', name: 'OneDrive', desc: 'Cloud storage' },
    { key: 'dropbox', name: 'Dropbox', desc: 'File sharing' },
  ]},
]

// ─── Settings View ───────────────────────────────────────────────────────────

function SettingsView({ company, demoDataActive, sessionToken, onDemoToggle, onToast }: {
  company: string; demoDataActive: boolean; sessionToken: string; onDemoToggle: (active: boolean) => void; onToast: (msg: string) => void
}) {
  // ── State ────────────────────────────────────────────────────────────────
  const [clearing, setClearing] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [replaceOnImport, setReplaceOnImport] = useState(true)

  // Workspace
  const [editingName, setEditingName] = useState(false)
  const [companyNameDraft, setCompanyNameDraft] = useState(company)
  const [savingName, setSavingName] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')

  // Team invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  // Integrations
  const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, boolean>>({})

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [inAppNotifs, setInAppNotifs] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)

  // Customise re-render key
  const [customiseKey, setCustomiseKey] = useState(0)

  // Photo Frame management
  const settingsPhotoRef = useRef<HTMLInputElement>(null)
  const [framePhotos, setFramePhotos] = useState<string[]>([])
  const [confirmClearPhotos, setConfirmClearPhotos] = useState(false)

  // Security
  const [showPinModal, setShowPinModal] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')

  // Hydrate client-only state after mount
  useEffect(() => {
    setLogoUrl(localStorage.getItem('workspace_company_logo') || localStorage.getItem('lumio_company_logo') || '')
    const integ: Record<string, boolean> = {}
    INTEGRATION_GROUPS.forEach(g => g.items.forEach(i => {
      integ[i.key] = localStorage.getItem(`lumio_integration_${i.key}`) === 'true'
    }))
    setConnectedIntegrations(integ)
    if (localStorage.getItem('lumio_notif_email') === 'false') setEmailNotifs(false)
    if (localStorage.getItem('lumio_notif_inapp') === 'false') setInAppNotifs(false)
    if (localStorage.getItem('lumio_notif_weekly') === 'false') setWeeklyDigest(false)
    try { const p = JSON.parse(localStorage.getItem('lumio_photo_frame') || '[]'); setFramePhotos(p) } catch { /* */ }
  }, [])

  // ── Photo Frame handlers ────────────────────────────────────────────────

  function removeFramePhoto(idx: number) {
    setFramePhotos(prev => {
      const next = prev.filter((_, i) => i !== idx)
      localStorage.setItem('lumio_photo_frame', JSON.stringify(next))
      return next
    })
  }

  function addFramePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const url = ev.target?.result as string
        setFramePhotos(prev => {
          const next = [...prev, url].slice(-20)
          localStorage.setItem('lumio_photo_frame', JSON.stringify(next))
          return next
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function clearAllPhotos() {
    setFramePhotos([])
    localStorage.setItem('lumio_photo_frame', JSON.stringify([]))
    // Clean up transforms
    Object.keys(localStorage).filter(k => k.startsWith('lumio_photoframe_transform_')).forEach(k => localStorage.removeItem(k))
    setConfirmClearPhotos(false)
    onToast('All photos removed')
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleClearDemo() {
    setClearing(true)
    // Preserve identity fields before clearing
    const savedLogo = localStorage.getItem('lumio_company_logo')
    const savedWsLogo = localStorage.getItem('workspace_company_logo')
    const savedPhoto = localStorage.getItem('lumio_user_photo')
    const savedName = localStorage.getItem('lumio_user_name')
    const savedEmail = localStorage.getItem('lumio_user_email')
    await fetch('/api/onboarding/clear-demo', { method: 'POST', headers: { 'x-workspace-token': sessionToken } }).catch(() => {})
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.removeItem('lumio_staff_imported')
    localStorage.removeItem('lumio_staff_imported_source')
    localStorage.removeItem('lumio_staff_ids')
    localStorage.removeItem('lumio_staff_profiles')
    localStorage.removeItem('lumio_demo_active')
    localStorage.removeItem('lumio-photo-frame')
    // Restore identity fields
    if (savedLogo) localStorage.setItem('lumio_company_logo', savedLogo)
    if (savedWsLogo) localStorage.setItem('workspace_company_logo', savedWsLogo)
    if (savedPhoto) localStorage.setItem('lumio_user_photo', savedPhoto)
    if (savedName) localStorage.setItem('lumio_user_name', savedName)
    if (savedEmail) localStorage.setItem('lumio_user_email', savedEmail)
    // Clear all AI tab caches so briefing and tabs start fresh
    ;['quick-wins','daily-tasks','insights','dont-miss','team'].forEach(tab => {
      localStorage.removeItem('lumio_ai_' + tab + '_cache')
      localStorage.removeItem('lumio_ai_' + tab + '_timestamp')
    })
    // Clear CRM caches
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_crm_'))
      .forEach(k => localStorage.removeItem(k))
    try { sessionStorage.removeItem('lumio_crm_cache') } catch { /* ignore */ }
    // Prevent onboarding/welcome overlays from re-triggering after demo clear
    localStorage.setItem('lumio_onboarding_shown', 'true')
    localStorage.setItem(`lumio_onboarding_done_${localStorage.getItem('lumio_workspace_slug') || ''}`, 'true')
    onDemoToggle(false)
    setClearing(false)
  }

  async function handleLoadDemo() {
    setLoading(true)
    // Preserve identity fields before loading demo
    const savedLogo = localStorage.getItem('lumio_company_logo')
    const savedWsLogo = localStorage.getItem('workspace_company_logo')
    const savedPhoto = localStorage.getItem('lumio_user_photo')
    const demoRes = await fetch('/api/onboarding/load-demo', { method: 'POST', headers: sessionToken ? { 'x-workspace-token': sessionToken } : {} }).catch(() => null)
    if (!demoRes?.ok) { setLoading(false); return }
    localStorage.setItem('lumio_demo_active', 'true')
    localStorage.setItem('lumio-photo-frame', JSON.stringify([
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&q=80',
    ]))
    const allPages = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','inbox','calendar','analytics','accounts','support','success','trials','operations','it']
    allPages.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
    // Restore identity fields
    if (savedLogo) localStorage.setItem('lumio_company_logo', savedLogo)
    if (savedWsLogo) localStorage.setItem('workspace_company_logo', savedWsLogo)
    if (savedPhoto) localStorage.setItem('lumio_user_photo', savedPhoto)
    onDemoToggle(true)
    setLoading(false)
  }

  const [importStatus, setImportStatus] = useState('')

  async function handleUpload() {
    if (!uploadFiles.length) return
    setUploading(true)

    // Find the first CSV file
    const csvFile = uploadFiles.find(f => f.name.toLowerCase().endsWith('.csv'))
    if (!csvFile) {
      // Non-CSV files: send to generic processor
      const fd = new FormData()
      uploadFiles.forEach(f => fd.append('files', f))
      fd.append('session_token', sessionToken)
      await fetch('/api/onboarding/process-data', { method: 'POST', body: fd }).catch(() => {})
      onToast('Files uploaded successfully')
      setUploadFiles([])
      setUploading(false)
      return
    }

    // Parse CSV
    try {
      const text = await csvFile.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) { onToast('CSV file is empty or has no data rows'); setUploading(false); return }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_ ]/g, ''))
      const colMap: Record<string, string> = {}
      headers.forEach((h, i) => {
        if (h.includes('first') && h.includes('name')) colMap['first_name'] = String(i)
        else if (h.includes('last') && h.includes('name')) colMap['last_name'] = String(i)
        else if (h === 'name' || h === 'full name' || h === 'fullname') colMap['full_name'] = String(i)
        else if (h.includes('email')) colMap['email'] = String(i)
        else if (h.includes('company') || h.includes('organisation') || h.includes('organization')) colMap['company'] = String(i)
        else if (h.includes('job') || h.includes('title') || h.includes('role') || h.includes('position')) colMap['job_title'] = String(i)
        else if (h.includes('department') || h.includes('dept') || h.includes('team')) colMap['department'] = String(i)
        else if (h.includes('phone') || h.includes('mobile') || h.includes('tel')) colMap['phone'] = String(i)
        else if (h.includes('start') && h.includes('date')) colMap['start_date'] = String(i)
        else if (h.includes('tag')) colMap['tags'] = String(i)
      })

      // Detect if this is a contacts CSV (has company column) or staff CSV
      const isContactsCsv = colMap['company'] !== undefined

      const rows = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        const row: Record<string, string> = {}

        if (colMap['full_name'] !== undefined) {
          const parts = (cols[parseInt(colMap['full_name'])] || '').split(' ')
          row.first_name = parts[0] || ''
          row.last_name = parts.slice(1).join(' ') || ''
        }
        if (colMap['first_name'] !== undefined) row.first_name = cols[parseInt(colMap['first_name'])] || ''
        if (colMap['last_name'] !== undefined) row.last_name = cols[parseInt(colMap['last_name'])] || ''
        if (colMap['email'] !== undefined) row.email = cols[parseInt(colMap['email'])] || ''
        if (colMap['company'] !== undefined) row.company = cols[parseInt(colMap['company'])] || ''
        if (colMap['job_title'] !== undefined) row.job_title = cols[parseInt(colMap['job_title'])] || ''
        if (colMap['department'] !== undefined) row.department = cols[parseInt(colMap['department'])] || ''
        if (colMap['phone'] !== undefined) row.phone = cols[parseInt(colMap['phone'])] || ''
        if (colMap['start_date'] !== undefined) row.start_date = cols[parseInt(colMap['start_date'])] || ''
        if (colMap['tags'] !== undefined) row.tags = cols[parseInt(colMap['tags'])] || ''

        return row
      }).filter(s => s.first_name || s.email)

      if (!rows.length) { onToast('No valid rows found — need First Name or Email'); setUploading(false); return }

      const token = localStorage.getItem('workspace_session_token') || localStorage.getItem('session_token') || sessionToken || ''

      if (isContactsCsv) {
        // Import as CRM contacts
        setImportStatus(`Importing ${rows.length} contacts...`)
        const res = await fetch('/api/workspace/import-contacts', {
          method: 'POST',
          headers: { 'x-workspace-token': token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacts: rows }),
        })
        const data = await res.json()
        if (res.ok) {
          const existing = JSON.parse(localStorage.getItem('lumio_crm_contacts') || '[]')
          localStorage.setItem('lumio_crm_contacts', JSON.stringify([...existing, ...rows]))
          onToast(`${data.imported} contacts imported successfully`)
        } else {
          console.error('[handleUpload] Contacts import error:', data)
          onToast(`Import failed: ${data.error || 'check your CSV format'}`)
        }
      } else {
        // Import as staff
        setImportStatus(`Importing ${rows.length} staff...`)
        const res = await fetch('/api/workspace/import-staff', {
          method: 'POST',
          headers: { 'x-workspace-token': token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff: rows }),
        })
        const data = await res.json()
        if (res.ok) {
          // Re-fetch staff from Supabase after successful import
          window.dispatchEvent(new Event('lumio-staff-imported'))
          const parts: string[] = []
          if (data.added > 0) parts.push(`${data.added} added`)
          if (data.updated > 0) parts.push(`${data.updated} updated`)
          if (data.skipped > 0) parts.push(`${data.skipped} skipped`)
          const summary = parts.length ? parts.join(', ') : `${data.imported} imported`
          const deptMsg = data.departments_pending > 0
            ? ` — ${data.departments_assigned} dept assigned, ${data.departments_pending} need review`
            : ''
          onToast(`Import complete — ${summary}${deptMsg}`)
        } else {
          console.error('[handleUpload] Staff import error:', data)
          onToast(`Import failed: ${data.error || 'check your CSV format'}`)
        }
      }
    } catch (err) {
      console.error('[handleUpload] CSV parse error:', err)
      onToast(`Import failed: ${err instanceof Error ? err.message : 'check your CSV format'}`)
    }

    setUploadFiles([])
    setUploading(false)
    setImportStatus('')
  }

  async function handleSaveCompanyName() {
    if (!companyNameDraft.trim() || companyNameDraft === company) { setEditingName(false); return }
    setSavingName(true)
    await fetch('/api/workspace/status', {
      method: 'PATCH',
      headers: { 'x-workspace-token': sessionToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: companyNameDraft.trim() }),
    }).catch(() => {})
    localStorage.setItem('workspace_company_name', companyNameDraft.trim())
    localStorage.setItem('lumio_company_name', companyNameDraft.trim())
    setSavingName(false)
    setEditingName(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setLogoUrl(blobUrl)
    const token = localStorage.getItem('workspace_session_token')
    if (!token) return
    const fd = new FormData()
    fd.append('logo', file)
    try {
      const res = await fetch('/api/workspace/logo', { method: 'POST', headers: { 'x-workspace-token': token }, body: fd })
      const data = await res.json()
      if (data.logo_url) {
        setLogoUrl(data.logo_url)
        localStorage.setItem('workspace_company_logo', data.logo_url)
        localStorage.setItem('lumio_company_logo', data.logo_url)
      }
      URL.revokeObjectURL(blobUrl)
    } catch (err) { console.error('Logo upload failed:', err) }
  }

  async function handleLogoRemove() {
    setLogoUrl('')
    localStorage.removeItem('workspace_company_logo')
    localStorage.removeItem('lumio_company_logo')
    const token = localStorage.getItem('workspace_session_token')
    if (!token) return
    try {
      await fetch('/api/workspace/logo', { method: 'DELETE', headers: { 'x-workspace-token': token } })
      window.dispatchEvent(new CustomEvent('lumio-logo-updated', { detail: '' }))
    } catch (err) { console.error('Logo remove failed:', err) }
  }

  async function handleInvite() {
    if (!inviteEmail || !inviteEmail.includes('@')) return
    setInviteSending(true)
    await fetch('/api/workspace/invite', {
      method: 'POST',
      headers: { 'x-workspace-token': sessionToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    }).catch(() => {})
    setInviteSending(false)
    setInviteSent(true)
    setInviteEmail('')
    setTimeout(() => setInviteSent(false), 3000)
  }

  const [integrationToast, setIntegrationToast] = useState('')

  function handleConnectIntegration(key: string, name: string) {
    // If already connected, allow disconnect
    if (connectedIntegrations[key]) {
      setConnectedIntegrations(prev => ({ ...prev, [key]: false }))
      localStorage.setItem(`lumio_integration_${key}`, 'false')
      setIntegrationToast(`${name} disconnected`)
      setTimeout(() => setIntegrationToast(''), 3000)
      return
    }
    // Microsoft integrations — real OAuth flow
    const MS_KEYS = ['outlook', 'outlook_cal', 'teams']
    if (MS_KEYS.includes(key)) {
      const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
      if (!clientId) {
        setIntegrationToast(`${name} — Microsoft OAuth not configured yet. Add NEXT_PUBLIC_MICROSOFT_CLIENT_ID to environment.`)
        setTimeout(() => setIntegrationToast(''), 5000)
        return
      }
      const wsSlug = typeof window !== 'undefined' ? localStorage.getItem('lumio_workspace_slug') || '' : ''
      const redirectUri = 'https://lumiocms.com/api/auth/callback/microsoft'
      const allScopes = 'openid email profile offline_access Mail.Read Mail.Send Calendars.Read Calendars.ReadWrite Team.ReadBasic.All Chat.Read'
      const state = JSON.stringify({ key: 'microsoft_all', slug: wsSlug })
      const params = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri, scope: allScopes, state, response_mode: 'query', prompt: 'consent' })
      window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
      return
    }

    // Google integrations — real OAuth flow
    const GOOGLE_KEYS: Record<string, string> = {
      gmail: 'https://www.googleapis.com/auth/gmail.readonly',
      gcal: 'https://www.googleapis.com/auth/calendar.readonly',
      gdrive: 'https://www.googleapis.com/auth/drive.readonly',
    }
    if (GOOGLE_KEYS[key]) {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        setIntegrationToast(`${name} — Google OAuth not configured yet. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to environment.`)
        setTimeout(() => setIntegrationToast(''), 5000)
        return
      }
      const wsSlug = typeof window !== 'undefined' ? localStorage.getItem('lumio_workspace_slug') || '' : ''
      const state = JSON.stringify({ key, slug: wsSlug })
      const params = new URLSearchParams({
        client_id: clientId, response_type: 'code',
        redirect_uri: 'https://lumiocms.com/api/auth/callback/google',
        scope: `openid email profile ${GOOGLE_KEYS[key]}`,
        state, access_type: 'offline', prompt: 'consent',
      })
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      return
    }

    // Slack — real OAuth flow
    if (key === 'slack') {
      const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
      if (!clientId) {
        setIntegrationToast(`${name} — Slack OAuth not configured yet. Add NEXT_PUBLIC_SLACK_CLIENT_ID to environment.`)
        setTimeout(() => setIntegrationToast(''), 5000)
        return
      }
      const wsSlug = typeof window !== 'undefined' ? localStorage.getItem('lumio_workspace_slug') || '' : ''
      const state = JSON.stringify({ slug: wsSlug })
      const scopes = 'channels:history,channels:read,groups:read,groups:history,im:read,im:history,users:read,chat:write'
      const params = new URLSearchParams({
        client_id: clientId, scope: scopes, user_scope: 'identity.basic,identity.email',
        redirect_uri: 'https://lumiocms.com/api/auth/callback/slack', state,
      })
      window.location.href = `https://slack.com/oauth/v2/authorize?${params.toString()}`
      return
    }

    // All other integrations — coming soon
    setIntegrationToast(`${name} integration coming soon — OAuth is being configured`)
    setTimeout(() => setIntegrationToast(''), 4000)
  }

  function toggleNotif(key: string, val: boolean, setter: (v: boolean) => void) {
    setter(!val)
    localStorage.setItem(key, String(!val))
  }

  // ── Toggle helper ────────────────────────────────────────────────────────
  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} className="flex-shrink-0" style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? '#0D9488' : '#374151', transition: 'background 0.2s', border: 'none', cursor: 'pointer', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
      </button>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Section 1: Workspace ──────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Workspace</p>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {/* Company name — editable */}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Company name</span>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input value={companyNameDraft} onChange={e => setCompanyNameDraft(e.target.value)} className="text-sm rounded-lg px-3 py-1.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', width: 200 }} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveCompanyName()} />
                <button onClick={handleSaveCompanyName} disabled={savingName} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#0D9488', color: '#fff' }}>{savingName ? '...' : 'Save'}</button>
                <button onClick={() => { setEditingName(false); setCompanyNameDraft(company) }} className="text-xs px-2 py-1.5 rounded-lg" style={{ color: '#6B7280' }}>Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{company}</span>
                <button onClick={() => setEditingName(true)} className="text-xs px-2 py-1 rounded" style={{ color: '#0D9488' }}>Edit</button>
              </div>
            )}
          </div>
          {/* Company logo */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Company logo</div>
              <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Shown in your portal banner. Change it here.</div>
            </div>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover" style={{ border: '1px solid #374151' }} />
                  <label className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all" style={{ backgroundColor: '#1F2937', color: '#D1D5DB', border: '1px solid #374151' }}>
                    Change
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  <button onClick={handleLogoRemove} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: 'rgba(127,29,29,0.2)', color: '#F87171', border: '1px solid rgba(127,29,29,0.3)' }}>
                    Remove
                  </button>
                </>
              ) : (
                <label className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all" style={{ backgroundColor: '#7C3AED', color: '#fff' }}>
                  Upload logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>
          </div>
          {/* Read-only fields */}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Plan</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Lumio Business</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Status</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>Active</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Billing</span>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
              Manage billing
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: Team ───────────────────────────────────────────────── */}
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
          <div className="px-5 py-4">
            <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>INVITE TEAM MEMBER</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" className="flex-1 text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} onKeyDown={e => e.key === 'Enter' && handleInvite()} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              <button onClick={handleInvite} disabled={inviteSending || !inviteEmail} className="px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap" style={{ backgroundColor: inviteSent ? '#22C55E' : '#0D9488', color: '#fff', opacity: !inviteEmail ? 0.5 : 1 }}>
                {inviteSending ? 'Sending...' : inviteSent ? 'Sent!' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Voice & Speech Settings ────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Voice & Speech</p>
        </div>
        <div className="px-5 py-4">
          <VoiceSettings commands={[
            { phrase: 'Show my meetings today', description: 'Lists all meetings scheduled for today' },
            { phrase: "What's urgent", description: 'Pulls up all urgent items across departments' },
            { phrase: 'Pipeline summary', description: 'Current sales pipeline value and stage breakdown' },
            { phrase: 'Team availability', description: 'Shows team status and who is available' },
            { phrase: 'How many leads this week', description: 'New leads generated this week' },
            { phrase: 'Show overdue tasks', description: 'Lists all tasks past their due date' },
            { phrase: 'Revenue this month', description: 'Current month revenue vs target' },
            { phrase: 'Who is off today', description: 'Staff on leave or absent today' },
            { phrase: 'Show my emails', description: 'Opens email inbox summary' },
            { phrase: 'Any urgent emails', description: 'Filters urgent flagged emails' },
            { phrase: 'What tasks are due today', description: 'Tasks with today as deadline' },
            { phrase: 'Show the sales board', description: 'Opens CRM pipeline board view' },
            { phrase: 'Latest customer feedback', description: 'Most recent NPS or feedback entries' },
            { phrase: 'How is the team performing', description: 'Team KPI and performance summary' },
            { phrase: 'Show open support tickets', description: 'Lists unresolved support tickets' },
            { phrase: 'Who is my top performer', description: 'Highest rated team member this month' },
            { phrase: 'Upcoming contract renewals', description: 'Contracts due for renewal in 30 days' },
            { phrase: 'Show cashflow forecast', description: 'Rolling 90-day cashflow projection' },
            { phrase: 'Any compliance alerts', description: 'Outstanding compliance or regulatory items' },
            { phrase: 'Show the org chart', description: 'Opens company org chart view' },
            { phrase: 'What deals closed this week', description: 'Won deals in the current week' },
            { phrase: 'Show marketing performance', description: 'Campaign metrics and conversion rates' },
            { phrase: 'How many open deals', description: 'Total count of active pipeline deals' },
            { phrase: 'Show HR updates', description: 'Latest HR alerts and staff updates' },
            { phrase: 'Any new leads today', description: 'Leads added in the last 24 hours' },
            { phrase: 'Show customer churn rate', description: 'Current monthly churn percentage' },
            { phrase: 'What is our MRR', description: 'Current monthly recurring revenue figure' },
            { phrase: 'Show payroll summary', description: 'Current payroll cost breakdown' },
            { phrase: 'Any staff on probation', description: 'Staff currently in probation period' },
            { phrase: 'Show IT tickets', description: 'Open IT support and infrastructure tickets' },
            { phrase: 'What projects are at risk', description: 'Projects flagged as behind or at risk' },
            { phrase: 'Show competitor activity', description: 'Latest market intel and competitor news' },
            { phrase: 'Any invoices overdue', description: 'Outstanding invoices past payment date' },
            { phrase: 'Show my Slack messages', description: 'Unread Slack messages summary' },
            { phrase: 'What is our win rate', description: 'Sales win rate for current quarter' },
            { phrase: 'Show onboarding status', description: 'New starter onboarding progress' },
            { phrase: 'Any website alerts', description: 'Website uptime and performance alerts' },
            { phrase: 'Show social media summary', description: 'Latest social engagement metrics' },
            { phrase: 'What is our NPS score', description: 'Current net promoter score' },
            { phrase: 'Show expense claims', description: 'Pending expense claims awaiting approval' },
            { phrase: 'Any legal updates', description: 'Outstanding legal or contract items' },
            { phrase: 'Show board reports', description: 'Latest board pack and reports' },
            { phrase: 'What deals are stalling', description: 'Deals with no activity in 14 days' },
            { phrase: 'Show recruitment pipeline', description: 'Active job roles and candidate pipeline' },
            { phrase: 'Any training due', description: 'Staff training overdue or coming up' },
            { phrase: 'Show customer health scores', description: 'Account health ratings across customer base' },
            { phrase: 'What is our burn rate', description: 'Current monthly spend rate' },
            { phrase: 'Show the roadmap', description: 'Product or project roadmap overview' },
            { phrase: 'Any SLA breaches', description: 'Support tickets that have breached SLA' },
            { phrase: 'Show partnership updates', description: 'Latest partner activity and news' },
            { phrase: 'What is our conversion rate', description: 'Lead to customer conversion percentage' },
            { phrase: 'Show accounts receivable', description: 'Outstanding payments owed to us' },
            { phrase: 'Any security alerts', description: 'IT security flags or incidents' },
            { phrase: 'Show team workload', description: 'Task distribution across team members' },
            { phrase: 'What meetings do I have tomorrow', description: "Tomorrow's calendar summary" },
            { phrase: 'Show customer success updates', description: 'Latest CS touchpoints and health checks' },
            { phrase: 'Any product feedback', description: 'Recent product feedback and feature requests' },
            { phrase: 'Show weekly report', description: "This week's performance summary report" },
            { phrase: 'What is our headcount', description: 'Current total employee count' },
            { phrase: 'Show the budget tracker', description: 'Current spend vs budget by department' },
            { phrase: 'Any approval requests', description: 'Items waiting for your approval' },
            { phrase: 'Show supplier updates', description: 'Latest supplier and vendor communications' },
            { phrase: 'What campaigns are live', description: 'Currently active marketing campaigns' },
            { phrase: 'Show email open rates', description: 'Latest email marketing performance stats' },
            { phrase: 'Any customer escalations', description: 'Escalated support or account issues' },
            { phrase: 'Show the P&L', description: 'Profit and loss summary for current period' },
            { phrase: 'What are my priorities today', description: 'AI-suggested top priorities for today' },
            { phrase: 'Show team sentiment', description: 'Staff morale and engagement indicators' },
            { phrase: 'Any overdue invoices from us', description: 'Invoices we owe that are past due' },
            { phrase: 'Show growth metrics', description: 'Month on month growth across key metrics' },
            { phrase: 'What is our CAC', description: 'Current customer acquisition cost' },
            { phrase: 'Show the leaderboard', description: 'Top performing staff or departments' },
            { phrase: 'Any warranty claims', description: 'Outstanding warranty or returns claims' },
            { phrase: 'Show strategic goals', description: 'Progress against company OKRs and goals' },
            { phrase: 'What integrations are connected', description: 'Active tool integrations and status' },
            { phrase: 'Show my calendar this week', description: 'Full week calendar overview' },
            { phrase: 'Any deals closing this month', description: 'Deals with close date in current month' },
            { phrase: 'Show department updates', description: 'Latest activity across all departments' },
            { phrase: 'What is our ARR', description: 'Annual recurring revenue figure' },
            { phrase: 'Show the risk register', description: 'Business risks and mitigation status' },
            { phrase: 'Any media mentions', description: 'Recent press and media coverage' },
            { phrase: 'Show investor updates', description: 'Latest investor communications and deck' },
            { phrase: 'What is our LTV', description: 'Average customer lifetime value' },
            { phrase: 'Show the staff directory', description: 'Full team contact directory' },
            { phrase: 'Any contracts expiring', description: 'Supplier or customer contracts ending soon' },
            { phrase: 'Show product usage stats', description: 'Feature adoption and usage metrics' },
            { phrase: 'What is our gross margin', description: 'Current gross margin percentage' },
            { phrase: 'Show referral activity', description: 'Referral programme performance' },
            { phrase: 'Any outstanding quotes', description: 'Quotes sent but not yet accepted' },
            { phrase: 'Show the audit log', description: 'Recent system activity and changes' },
            { phrase: 'What is our average deal size', description: 'Mean deal value for current period' },
            { phrase: 'Show office utilisation', description: 'Current office space usage stats' },
            { phrase: 'Any incidents today', description: 'Operational incidents or outages' },
            { phrase: 'Show the satisfaction scores', description: 'Latest CSAT across support and sales' },
            { phrase: 'What is our sales velocity', description: 'Current deal progression speed' },
            { phrase: 'Show pending approvals', description: 'All items awaiting sign-off' },
            { phrase: 'Any new reviews', description: 'Latest online reviews and ratings' },
            { phrase: 'Show the forecast', description: 'Revenue forecast for current quarter' },
          ]} />
        </div>
      </div>

      {/* ── Section 3: Data & Display ─────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Data & Display</p>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: demoDataActive ? 'rgba(245,166,35,0.15)' : 'rgba(34,197,94,0.15)', color: demoDataActive ? '#F5A623' : '#22C55E' }}>
            Demo data: {demoDataActive ? 'Active' : 'Off'}
          </span>
        </div>
        <div className="p-5 space-y-5">
          {/* Demo data toggle */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>DEMO DATA</p>
            {demoDataActive ? (
              <button onClick={handleClearDemo} disabled={clearing} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {clearing ? 'Clearing...' : 'Clear Demo Data'}
              </button>
            ) : (
              <button onClick={handleLoadDemo} disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
                {loading ? 'Loading...' : 'Load Demo Data'}
              </button>
            )}
          </div>

          {/* Data import dropzone */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>DATA IMPORT</p>
            <div
              className="rounded-xl p-6 text-center cursor-pointer transition-colors"
              style={{ backgroundColor: dragOver ? 'rgba(245,166,35,0.06)' : '#0A0B10', border: `2px dashed ${dragOver ? '#F5A623' : '#1F2937'}` }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setUploadFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]) }}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={24} style={{ color: '#F5A623', margin: '0 auto 8px' }} />
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Drop any files here — Lumio will sort them automatically</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>CSV, XLSX, DOCX, PDF, images</p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={e => { if (e.target.files) setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
            </div>
            {uploadFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <span className="text-xs" style={{ color: '#F9FAFB' }}>{f.name}</span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
                <label className="flex items-center gap-2 py-2 cursor-pointer">
                  <input type="checkbox" checked={replaceOnImport} onChange={e => setReplaceOnImport(e.target.checked)} style={{ accentColor: '#0D9488' }} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>Replace existing staff (uncheck to add new staff only)</span>
                </label>
                <button onClick={handleUpload} disabled={uploading} className="w-full py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
                  {uploading ? (importStatus || 'Processing...') : 'Process & Import'}
                </button>
              </div>
            )}
          </div>

          {/* CSV templates */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>CSV TEMPLATES</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: 'Staff Template', file: '/templates/business_staff.csv' },
                { label: 'Contacts Template', file: '/templates/business_contacts.csv' },
                { label: 'Accounts Template', file: '/templates/business_accounts.csv' },
              ].map(t => (
                <a key={t.file} href={t.file} download className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#9CA3AF', textDecoration: 'none' }}>
                  <FileText size={12} /> {t.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Integrations ───────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Integrations</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{Object.values(connectedIntegrations).filter(Boolean).length} connected</p>
        </div>
        <div className="p-5 space-y-5">
          {INTEGRATION_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>{group.label.toUpperCase()}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map(integ => {
                  const connected = connectedIntegrations[integ.key]
                  return (
                    <div key={integ.key} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: '#0A0B10', border: connected ? '1px solid rgba(34,197,94,0.3)' : '1px solid #1F2937' }}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{integ.name}</p>
                        <p className="text-xs truncate" style={{ color: '#6B7280' }}>{integ.desc}</p>
                      </div>
                      {connected ? (
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>Connected</span>
                          <button onClick={() => handleConnectIntegration(integ.key, integ.name)} className="text-xs px-2.5 py-1 rounded-lg" style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleConnectIntegration(integ.key, integ.name)} className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
                          Connect
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration toast */}
      {integrationToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] rounded-xl px-5 py-3 shadow-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxWidth: 440 }}>
          <p className="text-sm" style={{ color: '#F9FAFB' }}>{integrationToast}</p>
        </div>
      )}

      {/* ── Section 5: AI Morning Briefing ────────────────────────────────── */}
      <BriefingSettings />

      {/* ── Section 6: Voice Assistant ─────────────────────────────────────── */}
      <VoiceSelector />

      {/* ── Section 7: World Clock ─────────────────────────────────────────── */}
      <TimezoneSelector />

      {/* ── Section 8: Notifications ──────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Notifications</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Email notifications</p><p className="text-xs" style={{ color: '#6B7280' }}>Receive important updates via email</p></div>
            <Toggle on={emailNotifs} onToggle={() => toggleNotif('lumio_notif_email', emailNotifs, setEmailNotifs)} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>In-app notifications</p><p className="text-xs" style={{ color: '#6B7280' }}>Show alerts inside your Lumio dashboard</p></div>
            <Toggle on={inAppNotifs} onToggle={() => toggleNotif('lumio_notif_inapp', inAppNotifs, setInAppNotifs)} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Weekly summary email</p><p className="text-xs" style={{ color: '#6B7280' }}>A digest of your workspace activity every Monday</p></div>
            <Toggle on={weeklyDigest} onToggle={() => toggleNotif('lumio_notif_weekly', weeklyDigest, setWeeklyDigest)} />
          </div>
        </div>
      </div>

      {/* ── Section: Photo Frame ────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🖼️</span>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Photo Frame</p>
          </div>
          <span className="text-xs" style={{ color: '#6B7280' }}>{framePhotos.length} photo{framePhotos.length !== 1 ? 's' : ''} in your frame</span>
        </div>
        <div className="p-5">
          {framePhotos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
              {framePhotos.map((photo, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden" style={{ aspectRatio: '1', border: '1px solid #1F2937' }}>
                  <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeFramePhoto(i)}
                    className="absolute top-1 right-1 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ width: 22, height: 22, backgroundColor: '#EF4444', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 mb-4 rounded-xl" style={{ border: '2px dashed #374151' }}>
              <p className="text-sm" style={{ color: '#6B7280' }}>No photos yet — add some to personalise your overview</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={() => settingsPhotoRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
              + Add Photos
            </button>
            <input ref={settingsPhotoRef} type="file" accept="image/*" multiple onChange={addFramePhotos} className="hidden" />
            {framePhotos.length > 0 && (
              <>
                {!confirmClearPhotos ? (
                  <button onClick={() => setConfirmClearPhotos(true)} className="text-xs font-semibold px-4 py-2 rounded-lg"
                    style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    Clear all photos
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#EF4444' }}>Remove all photos?</span>
                    <button onClick={clearAllPhotos} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#EF4444', color: '#fff' }}>Yes, clear all</button>
                    <button onClick={() => setConfirmClearPhotos(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 9: Security ───────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Security</p>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="flex items-center justify-between px-5 py-3">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>PIN code</p><p className="text-xs" style={{ color: '#6B7280' }}>Change your sign-in PIN</p></div>
            <button onClick={() => setShowPinModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
              Change PIN
            </button>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div><p className="text-sm" style={{ color: '#F9FAFB' }}>Active sessions</p><p className="text-xs" style={{ color: '#6B7280' }}>1 active session (this device)</p></div>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              Sign out all others
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 10: Customise Your Workspace ──────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🎨</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Customise Your Workspace</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Show or hide tabs, quick actions, and departments</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-6">

          {/* Dashboard Tabs */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>DASHBOARD TABS</p>
            <div className="space-y-2">
              {OVERVIEW_TABS.map(t => {
                const locked = t.id === 'today'
                const key = `lumio_tab_${t.id}_visible`
                const visible = locked || (typeof window !== 'undefined' ? localStorage.getItem(key) !== 'false' : true)
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-sm" style={{ color: '#F9FAFB' }}>{t.label}</span>
                      {locked && <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: '#6B7280', backgroundColor: '#1F2937' }}>Always on</span>}
                    </div>
                    <Toggle on={visible} onToggle={() => {
                      if (locked) return
                      const next = !visible
                      localStorage.setItem(key, String(next))
                      window.dispatchEvent(new Event('lumio-settings-changed'))
                      setCustomiseKey(k => k + 1)
                    }} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>QUICK ACTIONS</p>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(a => {
                const key = `lumio_qa_${a.label.toLowerCase().replace(/\s+/g, '')}_visible`
                const visible = typeof window !== 'undefined' ? localStorage.getItem(key) !== 'false' : true
                return (
                  <div key={a.label} className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <div className="flex items-center gap-2">
                      <a.icon size={14} style={{ color: '#9CA3AF' }} />
                      <span className="text-sm" style={{ color: '#F9FAFB' }}>{a.label}</span>
                    </div>
                    <Toggle on={visible} onToggle={() => {
                      const next = !visible
                      localStorage.setItem(key, String(next))
                      window.dispatchEvent(new Event('lumio-settings-changed'))
                      setCustomiseKey(k => k + 1)
                    }} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Navigation / Departments */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>NAVIGATION / DEPARTMENTS</p>
            <div className="space-y-2">
              {SIDEBAR_ITEMS.map(item => {
                const locked = item.id === 'overview' || item.id === 'settings'
                const key = `lumio_nav_${item.id}_visible`
                const visible = locked || (typeof window !== 'undefined' ? localStorage.getItem(key) !== 'false' : true)
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                    <div className="flex items-center gap-2">
                      <item.icon size={14} style={{ color: '#9CA3AF' }} />
                      <span className="text-sm" style={{ color: '#F9FAFB' }}>{item.label}</span>
                      {locked && <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: '#6B7280', backgroundColor: '#1F2937' }}>Always on</span>}
                    </div>
                    <Toggle on={visible} onToggle={() => {
                      if (locked) return
                      const next = !visible
                      localStorage.setItem(key, String(next))
                      window.dispatchEvent(new Event('lumio-settings-changed'))
                      setCustomiseKey(k => k + 1)
                    }} />
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── Dev Tools ─────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.2)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(245,166,35,0.15)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🛠️</span>
            <p className="text-sm font-semibold" style={{ color: '#F5A623' }}>Dev Tools</p>
          </div>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-2">
          <button onClick={() => { localStorage.removeItem('onboarding_completed_' + company); localStorage.removeItem('lumio_onboarding_shown'); localStorage.removeItem(`lumio_onboarding_done_${localStorage.getItem('lumio_workspace_slug') || ''}`); localStorage.removeItem('lumio_tour_completed'); localStorage.removeItem(`lumio_tour_done_${localStorage.getItem('lumio_workspace_slug') || ''}`); window.location.reload() }} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
            Reset Onboarding
          </button>
          <button onClick={() => { localStorage.removeItem(`lumio_welcomed_${typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : ''}`); window.location.reload() }} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
            Reset Welcome Screen
          </button>
          <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('lumio_integration_')).forEach(k => localStorage.removeItem(k)); window.location.reload() }} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
            Reset Integrations
          </button>
          <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('lumio_notif_')).forEach(k => localStorage.removeItem(k)); window.location.reload() }} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
            Reset Notifications
          </button>
          <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('lumio_') || k.startsWith('workspace_') || k.startsWith('demo_')).forEach(k => localStorage.removeItem(k)); window.location.reload() }} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            Nuke All localStorage
          </button>
          <button onClick={() => console.log(JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k]) => k.startsWith('lumio_') || k.startsWith('workspace_') || k.startsWith('demo_'))), null, 2))} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
            Dump State to Console
          </button>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPinModal(false)}>
          <div className="rounded-xl p-6 w-full max-w-sm" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Change PIN</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Current PIN</label>
                <input type="password" value={currentPin} onChange={e => setCurrentPin(e.target.value)} maxLength={6} className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB', letterSpacing: '0.3em' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>New PIN</label>
                <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={6} className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB', letterSpacing: '0.3em' }} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowPinModal(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
              <button onClick={() => { setShowPinModal(false); setCurrentPin(''); setNewPin('') }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Finance + CRM Snapshot Widgets ──────────────────────────────────────────

interface FinanceSnap { provider: string; outstanding: number; billsDue: number; overdueCount: number; invoiceCount: number; billCount: number }
interface CRMSnap { provider: string; openDeals: number; pipelineValue: number; newContactsThisWeek: number; overdueTasks: number }

const FINANCE_PROVIDERS = [
  { key: 'xero', label: 'Xero', route: '/api/integrations/xero/snapshot', color: '#13B5EA' },
  { key: 'quickbooks', label: 'QuickBooks', route: '/api/integrations/quickbooks/snapshot', color: '#2CA01C' },
  { key: 'sage', label: 'Sage', route: '/api/integrations/sage/snapshot', color: '#00DC00' },
  { key: 'freeagent', label: 'FreeAgent', route: '/api/integrations/freeagent/snapshot', color: '#3B7DDD' },
]

const CRM_PROVIDERS = [
  { key: 'hubspot', label: 'HubSpot', route: '/api/integrations/hubspot/snapshot', color: '#FF7A59' },
  { key: 'salesforce', label: 'Salesforce', route: '/api/integrations/salesforce/snapshot', color: '#00A1E0' },
  { key: 'pipedrive', label: 'Pipedrive', route: '/api/integrations/pipedrive/snapshot', color: '#007E3A' },
]

function SnapshotWidgets() {
  const [finance, setFinance] = useState<FinanceSnap[]>([])
  const [crm, setCrm] = useState<CRMSnap[]>([])
  const [financeErrors, setFinanceErrors] = useState<string[]>([])
  const [crmErrors, setCrmErrors] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  const connectedFinance = FINANCE_PROVIDERS.filter(p => typeof window !== 'undefined' && localStorage.getItem(`lumio_integration_${p.key}`) === 'true')
  const connectedCrm = CRM_PROVIDERS.filter(p => typeof window !== 'undefined' && localStorage.getItem(`lumio_integration_${p.key}`) === 'true')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : ''
    if (!token) { setLoaded(true); return }
    const headers = { 'x-workspace-token': token }

    Promise.all([
      ...connectedFinance.map(p => fetch(p.route, { headers }).then(r => r.ok ? r.json() : r.status === 401 ? { _error: `${p.label} reconnection needed` } : null).catch(() => null)),
      ...connectedCrm.map(p => fetch(p.route, { headers }).then(r => r.ok ? r.json() : r.status === 401 ? { _error: `${p.label} reconnection needed` } : null).catch(() => null)),
    ]).then(results => {
      const fResults = results.slice(0, connectedFinance.length)
      const cResults = results.slice(connectedFinance.length)
      const fSnaps: FinanceSnap[] = []; const fErrs: string[] = []
      fResults.forEach(r => { if (r?._error) fErrs.push(r._error); else if (r?.provider) fSnaps.push(r) })
      const cSnaps: CRMSnap[] = []; const cErrs: string[] = []
      cResults.forEach(r => { if (r?._error) cErrs.push(r._error); else if (r?.provider) cSnaps.push(r) })
      setFinance(fSnaps); setFinanceErrors(fErrs); setCrm(cSnaps); setCrmErrors(cErrs); setLoaded(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!loaded) return null
  const showFinance = connectedFinance.length > 0 || finance.length > 0
  const showCrm = connectedCrm.length > 0 || crm.length > 0
  if (!showFinance && !showCrm) return null

  const totalOutstanding = finance.reduce((s, f) => s + f.outstanding, 0)
  const totalBills = finance.reduce((s, f) => s + f.billsDue, 0)
  const totalOverdue = finance.reduce((s, f) => s + f.overdueCount, 0)
  const totalDeals = crm.reduce((s, c) => s + c.openDeals, 0)
  const totalPipeline = crm.reduce((s, c) => s + c.pipelineValue, 0)
  const totalCrmOverdue = crm.reduce((s, c) => s + c.overdueTasks, 0)

  function StatBox({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
    return (
      <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <p className="text-lg font-black" style={{ color }}>{value}</p>
        <p className="text-[10px]" style={{ color: '#6B7280' }}>{label}</p>
        {sub && <p className="text-[9px] mt-0.5" style={{ color: '#4B5563' }}>{sub}</p>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Finance Snapshot */}
      {showFinance && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>💰 Finance Snapshot</h3>
            <div className="flex gap-1">
              {finance.map(f => {
                const p = FINANCE_PROVIDERS.find(fp => fp.key === f.provider)
                return p ? <span key={p.key} className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${p.color}20`, color: p.color }}>{p.label}</span> : null
              })}
            </div>
          </div>
          {financeErrors.map(e => <p key={e} className="text-xs mb-2" style={{ color: '#F59E0B' }}>{e}</p>)}
          {finance.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Outstanding" value={`£${totalOutstanding.toLocaleString()}`} color="#22C55E" />
              <StatBox label="Bills Due" value={`£${totalBills.toLocaleString()}`} color="#F59E0B" />
              <StatBox label="Overdue" value={String(totalOverdue)} color={totalOverdue > 0 ? '#EF4444' : '#6B7280'} />
            </div>
          ) : (
            <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>Connect Xero, QuickBooks, Sage or FreeAgent in Settings</p>
          )}
        </div>
      )}

      {/* CRM Snapshot */}
      {showCrm && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>📊 CRM Snapshot</h3>
            <div className="flex gap-1">
              {crm.map(c => {
                const p = CRM_PROVIDERS.find(cp => cp.key === c.provider)
                return p ? <span key={p.key} className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${p.color}20`, color: p.color }}>{p.label}</span> : null
              })}
            </div>
          </div>
          {crmErrors.map(e => <p key={e} className="text-xs mb-2" style={{ color: '#F59E0B' }}>{e}</p>)}
          {crm.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Open Deals" value={String(totalDeals)} color="#7C3AED" />
              <StatBox label="Pipeline" value={`£${totalPipeline.toLocaleString()}`} color="#22C55E" />
              <StatBox label="Overdue Tasks" value={String(totalCrmOverdue)} color={totalCrmOverdue > 0 ? '#EF4444' : '#6B7280'} />
            </div>
          ) : (
            <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>Connect HubSpot, Salesforce or Pipedrive in Settings</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Overview View ───────────────────────────────────────────────────────────

function OverviewView({ company, firstName, onAction, ttsEnabled = true, voiceCommandsEnabled = true, demoDataActive = false, onGoSettings, supabaseStaff = [], onBellClick, roleSwitcher, settingsHref, userNameProp, dismissedWins = new Set(), onDismissWin }: { company: string; firstName?: string; onAction: (msg: string) => void; ttsEnabled?: boolean; voiceCommandsEnabled?: boolean; demoDataActive?: boolean; onGoSettings?: () => void; supabaseStaff?: StaffMember[]; onBellClick?: () => void; roleSwitcher?: React.ReactNode; settingsHref?: string; userNameProp?: string; dismissedWins?: Set<string>; onDismissWin?: (id: string) => void }) {
  const [showExpense, setShowExpense] = useState(false)
  const [showHoliday, setShowHoliday] = useState(false)
  const [showSickness, setShowSickness] = useState(false)
  const [showPhoneCall, setShowPhoneCall] = useState(false)
  const [showEmailCompose, setShowEmailCompose] = useState(false)
  const [showMeetingBook, setShowMeetingBook] = useState(false)
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callVia, setCallVia] = useState('Phone')
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1)
    window.addEventListener('lumio-settings-changed', handler)
    return () => window.removeEventListener('lumio-settings-changed', handler)
  }, [])

  const quickActionToasts: Record<string, string> = {
    'Send Email': 'Opening email composer...',
    'Send Slack': 'Opening Slack...',
    'Book Meeting': 'Opening calendar...',
  }

  const quickActionModals: Record<string, () => void> = {
    'Send Email': () => setShowEmailCompose(true),
    'Book Meeting': () => setShowMeetingBook(true),
    'Phone Call': () => setShowPhoneCall(true),
    'Claim Expenses': () => setShowExpense(true),
    'Book Holiday': () => setShowHoliday(true),
    'Report Sickness': () => setShowSickness(true),
    'Submit Timesheet': () => setActiveQuickAction('Submit Timesheet'),
    'Log Remote Day': () => setActiveQuickAction('Log Remote Day'),
    'IT Support': () => setActiveQuickAction('IT Support'),
    'Request Sign-off': () => setActiveQuickAction('Request Sign-off'),
    'Book Training': () => setActiveQuickAction('Book Training'),
    'Request 1-1': () => setActiveQuickAction('Request 1-1'),
    'Raise Issue': () => setActiveQuickAction('Raise Issue'),
    'Post Announcement': () => setActiveQuickAction('Post Announcement'),
    'Onboard Starter': () => setActiveQuickAction('Onboard Starter'),
    'Purchase Request': () => setActiveQuickAction('Purchase Request'),
    'Request Access': () => setActiveQuickAction('Request Access'),
    'Log Overtime': () => setActiveQuickAction('Log Overtime'),
    'Run Report': () => setActiveQuickAction('Run Report'),
    'Send Slack': () => setActiveQuickAction('Send Slack'),
  }

  function handleVoiceCommand(cmd: VoiceCommandResult) {
    if (cmd.action === 'SWITCH_TAB' && cmd.payload?.tab) setTab(cmd.payload.tab)
    else if (cmd.action === 'OPEN_MODAL') onAction(`Opening ${cmd.payload?.modal || 'form'}...`)
    else if (cmd.action === 'EXPAND_ROUNDUP') onAction(`Opening ${cmd.payload?.section || 'section'}...`)
    else if (cmd.action === 'EMAIL_TEAM') onAction('Opening team email...')
    else if (cmd.action === 'EXECUTE_SLACK_SEND') onAction(`Slack message sent to #${cmd.payload?.channel || 'general'} \u2713`)
  }

  function handleQuickAction(label: string) {
    if (quickActionModals[label]) { quickActionModals[label](); return }
    onAction(quickActionToasts[label] || label)
  }
  const [tab, setTab] = useState<OverviewTab>('today')

  // Staff data + director detection — from Supabase via prop
  const allStaff = supabaseStaff
  const currentUserStaff = React.useMemo(() => {
    const name = (firstName || '').toLowerCase()
    if (!name) return null
    return allStaff.find(s => {
      const full = staffFullName(s).toLowerCase()
      return full === name || full.startsWith(name) || (s.first_name && s.first_name.toLowerCase() === name)
    }) || null
  }, [firstName, allStaff])
  const isDirectorUser = React.useMemo(() => isDirector(currentUserStaff), [currentUserStaff])

  // Build AI context for overview tabs
  const aiCtx = React.useMemo(() => {
    const integrations: string[] = []
    if (typeof window !== 'undefined') {
      INTEGRATION_GROUPS.forEach(g => g.items.forEach(i => {
        if (localStorage.getItem(`lumio_integration_${i.key}`) === 'true') integrations.push(i.name)
      }))
    }
    const deptStaff = isDirectorUser ? allStaff : matchDept(allStaff, 'overview')
    return {
      userName: firstName || '',
      company,
      role: typeof window !== 'undefined' ? localStorage.getItem('lumio_user_role') || 'Manager' : 'Manager',
      department: 'General',
      activeDepartment: 'overview',
      isDirector: isDirectorUser,
      connectedIntegrations: integrations,
      importedData: {
        hasStaff: allStaff.length > 0,
        hasContacts: false,
        hasAccounts: false,
      },
      importedStaff: allStaff,
      departmentStaff: deptStaff,
    }
  }, [firstName, company, allStaff, isDirectorUser])

  const wf = fakeNum(47, company, 'wf')
  const cu = fakeNum(181, company, 'cu')
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
      <PersonalBanner company={company} firstName={firstName} onVoiceCommand={handleVoiceCommand} ttsEnabled={ttsEnabled} voiceCommandsEnabled={voiceCommandsEnabled} demoDataActive={demoDataActive} onBellClick={onBellClick} roleSwitcher={roleSwitcher} settingsHref={settingsHref} userNameProp={userNameProp} />
      <TabBar tab={tab} onChange={setTab} />

      {tab === 'today' ? (
        <div className="space-y-4">
          <QuickActionsBar onAction={handleQuickAction} onGoSettings={onGoSettings || (() => {})} />

          {!demoDataActive && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#F9FAFB' }}>Connect your tools to get started</h3>
              <p className="text-sm max-w-md mb-6" style={{ color: '#6B7280' }}>Your daily overview, AI insights and schedule will appear here once your data is connected. Load demo data to explore.</p>
              <button onClick={() => { localStorage.setItem('lumio_demo_active', 'true'); window.location.reload() }} className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#7C3AED', color: '#F9FAFB' }}>✨ Explore with Demo Data</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-1 flex flex-col">
              <MorningRoundup demoDataActive={demoDataActive} />
            </div>
            <div className="lg:col-span-1 flex flex-col">
              <MeetingsToday demoDataActive={demoDataActive} />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
              <PhotoFrame demoDataActive={demoDataActive} />
              <MorningAIPanel demoDataActive={demoDataActive} />
              {demoDataActive && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(108,63,197,0.3)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span>{'\u2728'}</span>
                    <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
                    <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Today</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { n: 1, text: 'Pipeline up 12% \u2014 strongest quarter since Q4 last year', color: '#0D9488' },
                      { n: 2, text: 'Greenfield Group proposal due today \u2014 highest value deal in pipeline', color: '#EF4444' },
                      { n: 3, text: '3 trials expiring this week \u2014 \u00A38,400 combined value at risk', color: '#F59E0B' },
                      { n: 4, text: 'Win rate 23% \u2014 below industry average of 27%, needs attention', color: '#F59E0B' },
                      { n: 5, text: 'Apex Learning partnership performing above target \u2014 68% win rate', color: '#0D9488' },
                    ].map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-bold w-4 flex-shrink-0 mt-0.5" style={{ color: h.color }}>{h.n}</span>
                        <span className="text-xs" style={{ color: '#D1D5DB' }}>{h.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Finance + CRM Snapshot widgets */}
          {!demoDataActive && <SnapshotWidgets />}

          {/* Active Departments — shows when staff imported and demo off */}
          {!demoDataActive && (() => {
            if (!supabaseStaff.length) return null
            const DEPTS = [
              { key: 'sales', icon: '💼', route: '/sales' }, { key: 'marketing', icon: '📊', route: '/marketing' },
              { key: 'hr', icon: '👥', route: '/hr' }, { key: 'accounts', icon: '💰', route: '/accounts' },
              { key: 'operations', icon: '⚙️', route: '/operations' }, { key: 'it', icon: '💻', route: '/it' },
              { key: 'support', icon: '🎧', route: '/support' }, { key: 'success', icon: '🏆', route: '/success' },
              { key: 'partners', icon: '🤝', route: '/partners' },
            ]
            const activeDepts = DEPTS.map(d => {
              const staff = getDeptStaff(d.key, supabaseStaff)
              if (!staff.length) return null
              const lead = getDeptLead(staff)
              return { ...d, lead, count: staff.length }
            }).filter(Boolean) as { key: string; icon: string; route: string; lead: ReturnType<typeof getDeptLead>; count: number }[]
            if (!activeDepts.length) return null
            return (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>ACTIVE DEPARTMENTS</p>
                <div className="flex flex-wrap gap-2">
                  {activeDepts.map(d => (
                    <a key={d.key} href={d.route} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB', textDecoration: 'none' }}>
                      <span>{d.icon}</span>
                      <span className="capitalize">{d.key}</span>
                      {d.lead && <span style={{ color: '#6B7280' }}>— {getStaffShortName(d.lead)}</span>}
                    </a>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Integration snapshots — show when connected */}
          {!demoDataActive && (
            <div className="space-y-4">
              <HRSnapshot />
              <ProjectsSnapshot />
              <RecentFiles />
            </div>
          )}

          {demoDataActive ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  <EnhancedStatCard label="Active Workflows" value={String(wf)} icon={GitBranch} color="#0D9488"
                    pieData={[{label:'Running',value:32,color:'#0D9488'},{label:'Paused',value:9,color:'#F59E0B'},{label:'Draft',value:6,color:'#374151'}]}
                    barData={[{label:'HR',value:12,color:'#0D9488'},{label:'Sales',value:8,color:'#6C3FC5'},{label:'Fin',value:9,color:'#22C55E'},{label:'Ops',value:11,color:'#F59E0B'},{label:'Sup',value:7,color:'#EF4444'}]} />
                  <EnhancedStatCard label="Total Customers" value={String(cu)} icon={Users} color="#6C3FC5"
                    pieData={[{label:'Healthy',value:Math.round(cu*.77),color:'#22C55E'},{label:'At Risk',value:Math.round(cu*.17),color:'#F59E0B'},{label:'Critical',value:Math.round(cu*.06),color:'#EF4444'}]}
                    barData={[{label:'Enterprise',value:45,color:'#6C3FC5'},{label:'Mid-Mkt',value:82,color:'#A78BFA'},{label:'SMB',value:54,color:'#7C3AED'}]} />
                  <EnhancedStatCard label="Monthly MRR" value={`£${mrr.toLocaleString()}`} icon={TrendingUp} color="#22C55E"
                    pieData={[{label:'Pro',value:60,color:'#22C55E'},{label:'Enterprise',value:30,color:'#0D9488'},{label:'Starter',value:10,color:'#374151'}]}
                    barData={[{label:'Oct',value:38000,color:'#22C55E'},{label:'Nov',value:39000,color:'#22C55E'},{label:'Dec',value:41000,color:'#22C55E'},{label:'Jan',value:42000,color:'#22C55E'},{label:'Feb',value:43000,color:'#22C55E'},{label:'Mar',value:mrr,color:'#0D9488'}]} />
                  <EnhancedStatCard label="Workflow Runs (30d)" value={String(runs)} icon={Zap} color="#F59E0B"
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
                        <WFStatusBadge status={run.status} />
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{run.ts}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : tab === 'quick-wins' ? (
        <QuickWins dismissedWins={dismissedWins} onDismiss={onDismissWin} />
      ) : tab === 'tasks' ? (
        <DailyTasks />
      ) : tab === 'insights' ? (
        <Insights />
      ) : tab === 'not-to-miss' ? (
        <NotToMiss />
      ) : tab === 'team' ? (
        demoDataActive ? <TeamPanel selectedDepts={typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('lumio_selected_departments') || '[]') : []} /> : <AITeam ctx={aiCtx} onAction={onAction} staffFromSupabase={allStaff} />
      ) : (
        <TabPlaceholder tab={tab} />
      )}

      {activeQuickAction && <OverviewActionModal action={activeQuickAction} onClose={() => setActiveQuickAction(null)} onToast={(msg) => { setActiveQuickAction(null); onAction(msg) }} />}
      {showExpense && <ClaimExpenseModal onClose={() => setShowExpense(false)} onToast={onAction} />}
      {showHoliday && <BookHolidayModal onClose={() => setShowHoliday(false)} onToast={onAction} userName={currentUserStaff ? staffFullName(currentUserStaff) : undefined} userDept={currentUserStaff?.department} userTitle={currentUserStaff?.job_title} />}
      {showSickness && <ReportSicknessModal onClose={() => setShowSickness(false)} onToast={onAction} userName={currentUserStaff ? staffFullName(currentUserStaff) : undefined} userDept={currentUserStaff?.department} userTitle={currentUserStaff?.job_title} />}
      {showEmailCompose && <EmailComposeModal onClose={() => setShowEmailCompose(false)} onToast={onAction} />}
      {showMeetingBook && <MeetingBookModal onClose={() => setShowMeetingBook(false)} onToast={onAction} />}

      {/* Phone Call modal */}
      {showPhoneCall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPhoneCall(false)}>
          <div className="rounded-xl p-6 w-full max-w-sm" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Make a Call</h3>
            <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Connect your phone system in Settings to enable calling from Lumio. Or dial manually:</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Phone number or name</label>
                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} placeholder="+44 7700 900000 or John Smith" className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }} autoFocus />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>Call via</label>
                <select value={callVia} onChange={e => setCallVia(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB' }}>
                  <option>Phone</option>
                  <option>Slack Huddle</option>
                  <option>Zoom</option>
                  <option>Teams</option>
                  <option>Google Meet</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowPhoneCall(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
              <button onClick={() => { setShowPhoneCall(false); setPhoneNumber(''); if (onGoSettings) onGoSettings() }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Connect Phone System →</button>
            </div>
          </div>
        </div>
      )}
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

  const [activeDept, setActiveDept] = useState<DeptId>(() => {
    if (typeof window === 'undefined') return 'overview'
    const stored = localStorage.getItem('lumio_active_dept')
    if (stored) { localStorage.removeItem('lumio_active_dept'); return (stored as DeptId) }
    return 'overview'
  })
  const [company, setCompany]       = useState('')
  const [userName, setUserName]     = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast]           = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTabGuide, setShowTabGuide] = useState(false)
  const [demoDataActive, setDemoDataActive] = useState(() => { if (typeof window === 'undefined') return false; return localStorage.getItem('lumio_demo_active') === 'true' })
  const [dismissedWins, setDismissedWins] = useState<Set<string>>(() => {
    try {
      if (typeof window === 'undefined') return new Set()
      const today = new Date().toDateString()
      const savedDate = localStorage.getItem('qw_date')
      if (savedDate !== today) { localStorage.removeItem('qw_dismissed'); localStorage.setItem('qw_date', today); return new Set() }
      const saved = localStorage.getItem('qw_dismissed')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  useEffect(() => { try { localStorage.setItem('qw_dismissed', JSON.stringify([...dismissedWins])) } catch {} }, [dismissedWins])
  const handleDismissWin = (id: string) => { setDismissedWins(prev => { const next = new Set(prev); next.add(id); return next }) }
  const [showLiveOnboarding, setShowLiveOnboarding] = useState(false)
  const [businessId, setBusinessId] = useState('')
  const [supabaseStaff, setSupabaseStaff] = useState<StaffMember[]>([])
  const [staffRefreshKey, setStaffRefreshKey] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true)
  const [ssoWelcome, setSsoWelcome] = useState<{ name: string; department: string | null; pending: boolean } | null>(null)
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const avatarFileRef = useRef<HTMLInputElement>(null)

  function fireToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    // Read cached values from localStorage — check admin impersonation first
    const name = localStorage.getItem('workspace_company_name') || ''
    const isAdminImpersonating = localStorage.getItem('lumio_impersonated_from_admin') === 'true'
    const user = isAdminImpersonating
      ? (localStorage.getItem('lumio_impersonated_user_name') || localStorage.getItem('workspace_user_name') || '')
      : (localStorage.getItem('workspace_user_name') || '')
    const logo = localStorage.getItem('workspace_company_logo') || localStorage.getItem('lumio_company_logo') || ''
    setCompany(name)
    setUserName(user)
    setCompanyLogo(logo)
    // Hydration-safe: read client-only settings after mount
    if (localStorage.getItem('lumio_tts_enabled') === 'false') setTtsEnabled(false)
    if (localStorage.getItem('lumio_voice_commands_enabled') === 'false') setVoiceCommandsEnabled(false)
    // Load profile photo (URL only — clean up any legacy base64)
    const userEmail = localStorage.getItem('lumio_user_email')
    if (userEmail) {
      const photo = localStorage.getItem(`lumio_staff_photo_${userEmail}`)
      if (photo && photo.startsWith('data:')) { localStorage.removeItem(`lumio_staff_photo_${userEmail}`) } // clean up base64
      else if (photo) setUserPhoto(photo)
      // Also check lumio_user_photo
      const userPhoto2 = localStorage.getItem('lumio_user_photo')
      if (userPhoto2 && !userPhoto2.startsWith('data:')) setUserPhoto(userPhoto2)
    }
    // Listen for photo updates (cross-tab via StorageEvent)
    function onPhotoUpdate() {
      const e = localStorage.getItem('lumio_user_email')
      if (e) {
        const p = localStorage.getItem(`lumio_staff_photo_${e}`)
        const p2 = localStorage.getItem('lumio_user_photo')
        const photo = (p && !p.startsWith('data:')) ? p : (p2 && !p2.startsWith('data:')) ? p2 : null
        setUserPhoto(photo)
      }
    }
    // Listen for same-tab avatar updates (e.g. from dropdown upload)
    function onAvatarUpdated(e: Event) {
      const url = (e as CustomEvent).detail
      setUserPhoto(url || null)
    }
    window.addEventListener('storage', onPhotoUpdate)
    window.addEventListener('lumio-avatar-updated', onAvatarUpdated)

    // Handle Microsoft SSO callback — store session from query params
    const urlParams = new URLSearchParams(window.location.search)
    const ssoSession = urlParams.get('sso_session')
    if (ssoSession) {
      localStorage.setItem('workspace_session_token', ssoSession)
      const ssoSlug = urlParams.get('sso_slug'); if (ssoSlug) { localStorage.setItem('lumio_workspace_slug', ssoSlug); localStorage.setItem('lumio_company_active', 'true') }
      const ssoCompany = urlParams.get('sso_company'); if (ssoCompany) { localStorage.setItem('workspace_company_name', ssoCompany); localStorage.setItem('lumio_company_name', ssoCompany); setCompany(ssoCompany) }
      const ssoName = urlParams.get('sso_name'); if (ssoName) { localStorage.setItem('workspace_user_name', ssoName); localStorage.setItem('lumio_user_name', ssoName); setUserName(ssoName) }
      const ssoEmail = urlParams.get('sso_email'); if (ssoEmail) localStorage.setItem('lumio_user_email', ssoEmail)
      const ssoLogo = urlParams.get('sso_logo'); if (ssoLogo) { localStorage.setItem('workspace_company_logo', ssoLogo); localStorage.setItem('lumio_company_logo', ssoLogo); setCompanyLogo(ssoLogo) }
      // Department assignment from SSO
      const ssoDept = urlParams.get('sso_department'); if (ssoDept) localStorage.setItem('lumio_user_department', ssoDept)
      const ssoJobTitle = urlParams.get('sso_job_title'); if (ssoJobTitle) localStorage.setItem('lumio_user_job_title', ssoJobTitle)
      const ssoDeptPending = urlParams.get('sso_dept_pending') === 'true'
      // Show SSO welcome modal on first login
      if (urlParams.get('sso_first_login') === 'true') {
        setSsoWelcome({ name: urlParams.get('sso_name') || '', department: ssoDept || null, pending: ssoDeptPending })
      }
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Handle OAuth callback redirect (e.g. ?integration_connected=outlook or microsoft_all)
    const connectedKey = urlParams.get('integration_connected')
    if (connectedKey) {
      if (connectedKey === 'microsoft_all') {
        localStorage.setItem('lumio_integration_outlook', 'true')
        localStorage.setItem('lumio_integration_outlook_cal', 'true')
        localStorage.setItem('lumio_integration_teams', 'true')
      } else {
        localStorage.setItem(`lumio_integration_${connectedKey}`, 'true')
      }
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Validate session against businesses table
    const sessionToken = localStorage.getItem('workspace_session_token')
    const justPurchased = localStorage.getItem('lumio_company_active') === 'true'
    if (sessionToken) {
      fetch('/api/workspace/status', { headers: { 'x-workspace-token': sessionToken } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || data.status !== 'active') {
            // Don't boot fresh purchases — session may still be propagating
            if (justPurchased) {
              const alreadySetUp = localStorage.getItem(`lumio_onboarding_done_${slug}`)
                || localStorage.getItem('lumio_onboarding_shown')
                || localStorage.getItem('workspace_company_name')
                || localStorage.getItem(`onboarding-dismissed-${slug}`)
                || localStorage.getItem('lumio_tour_completed')
              if (alreadySetUp) return
              // Extra guard: check if lumio_company_active was set more than 10 minutes ago
              const purchaseTs = parseInt(localStorage.getItem('lumio_purchase_timestamp') || '0', 10)
              if (purchaseTs > 0 && (Date.now() - purchaseTs) > 10 * 60 * 1000) {
                // Stale purchase flag — clear it and don't show onboarding
                localStorage.removeItem('lumio_company_active')
                return
              }
              if (!localStorage.getItem(`lumio_welcomed_${slug}`)) {
                setShowWelcome(true)
              } else {
                setShowOnboarding(true)
              }
              return
            }
            router.replace(`/login?redirectTo=/${slug}&message=${encodeURIComponent('Your session has expired. Please sign in again.')}`)
            return
          }
          // Lock slug to current URL — clear any stale values
          localStorage.setItem('lumio_workspace_slug', slug)
          localStorage.setItem('lumio_tenant_slug', slug)
          document.cookie = `lumio_tenant_slug=${slug}; max-age=2592000; path=/`

          if (data.company_name) {
            setCompany(data.company_name)
            localStorage.setItem('workspace_company_name', data.company_name)
            localStorage.setItem('lumio_company_name', data.company_name)
          }
          if (data.owner_name) {
            // Don't override impersonated user name
            if (localStorage.getItem('lumio_impersonated_from_admin') !== 'true') setUserName(data.owner_name)
            localStorage.setItem('workspace_user_name', data.owner_name)
            localStorage.setItem('lumio_user_name', data.owner_name)
          }
          if (data.owner_email) {
            setOwnerEmail(data.owner_email)
            localStorage.setItem('lumio_user_email', data.owner_email)
            // Owner is always a director — cache role for sidebar Directors Suite visibility
            localStorage.setItem('lumio_user_role_level', '1')
            localStorage.setItem('lumio_user_is_owner', 'true')
          }
          if (data.logo_url) {
            setCompanyLogo(data.logo_url)
            localStorage.setItem('workspace_company_logo', data.logo_url)
            localStorage.setItem('lumio_company_logo', data.logo_url)
          }
          // Restore avatar from Supabase (workspace_staff.profile_photo_url)
          if (data.user_avatar_url) {
            setUserPhoto(data.user_avatar_url)
            localStorage.setItem('lumio_user_photo', data.user_avatar_url)
            if (data.owner_email) localStorage.setItem(`lumio_staff_photo_${data.owner_email}`, data.user_avatar_url)
          }
          if (data.id) setBusinessId(data.id)
          if (data.demo_data_active) {
            setDemoDataActive(true)
            localStorage.setItem('lumio_demo_active', 'true')
          } else {
            // Force-clear stale demo flags for real businesses
            setDemoDataActive(false)
            localStorage.setItem('lumio_demo_active', 'false')
            Object.keys(localStorage).filter(k => k.startsWith('lumio_dashboard_') && k.endsWith('_hasData')).forEach(k => localStorage.removeItem(k))
          }
          // Staff is now fetched from Supabase only — no localStorage sync needed
          // Live tenant onboarding wizard — only show if NEVER completed AND recently created
          const alreadyOnboarded = data.onboarding_completed || data.onboarded || data.onboarding_complete
          const dismissed = localStorage.getItem(`onboarding-dismissed-${slug}`)
          if (alreadyOnboarded || dismissed) {
            localStorage.setItem(`lumio_onboarding_done_${slug}`, 'true')
            localStorage.setItem('lumio_onboarding_shown', 'true')
          } else if (!data.demo_data_active) {
            // Only show if created less than 10 minutes ago AND no local flags set
            const createdAt = data.created_at ? new Date(data.created_at).getTime() : 0
            const isNewTenant = createdAt > 0 && (Date.now() - createdAt) < 10 * 60 * 1000
            if (isNewTenant && !localStorage.getItem(`lumio_onboarding_done_${slug}`) && !localStorage.getItem('lumio_onboarding_shown') && !localStorage.getItem('lumio_tour_completed')) {
              setShowLiveOnboarding(true)
            }
          }
        })
        .catch(() => {
          // Network error — don't redirect if this looks like a fresh purchase
          if (!justPurchased) router.replace(`/login?redirectTo=/${slug}`)
        })
    } else if (!justPurchased) {
      // No workspace_session_token — try to create one from Supabase auth session
      import('@supabase/supabase-js').then(({ createClient }) => {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user?.email) { router.replace('/login?redirectTo=/' + slug); return }
          fetch('/api/workspace/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, slug }),
          })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (!data?.session_token) { console.log('[session] No token returned from /api/workspace/session'); router.replace('/login?redirectTo=/' + slug); return }
              console.log('[session] Token saved:', data.session_token ? 'yes' : 'NO TOKEN RETURNED')
              localStorage.setItem('workspace_session_token', data.session_token)
              if (data.business?.company_name) { setCompany(data.business.company_name); localStorage.setItem('workspace_company_name', data.business.company_name); localStorage.setItem('lumio_company_name', data.business.company_name) }
              if (data.business?.owner_name) { if (localStorage.getItem('lumio_impersonated_from_admin') !== 'true') setUserName(data.business.owner_name); localStorage.setItem('workspace_user_name', data.business.owner_name); localStorage.setItem('lumio_user_name', data.business.owner_name) }
              if (data.business?.owner_email) { setOwnerEmail(data.business.owner_email); localStorage.setItem('lumio_user_email', data.business.owner_email) }
              if (data.business?.logo_url) { setCompanyLogo(data.business.logo_url); localStorage.setItem('workspace_company_logo', data.business.logo_url); localStorage.setItem('lumio_company_logo', data.business.logo_url) }
              if (data.business?.user_avatar_url) { setUserPhoto(data.business.user_avatar_url); localStorage.setItem('lumio_user_photo', data.business.user_avatar_url); if (data.business.owner_email) localStorage.setItem(`lumio_staff_photo_${data.business.owner_email}`, data.business.user_avatar_url) }
              if (data.business?.id) setBusinessId(data.business.id)
              if (data.business?.demo_data_active) { setDemoDataActive(true); localStorage.setItem('lumio_demo_active', 'true') }
              const bizOnboarded = data.business?.onboarding_completed || data.business?.onboarded || data.business?.onboarding_complete
              const bizDismissed = localStorage.getItem(`onboarding-dismissed-${slug}`)
              if (bizOnboarded || bizDismissed) {
                localStorage.setItem(`lumio_onboarding_done_${slug}`, 'true')
                localStorage.setItem('lumio_onboarding_shown', 'true')
              } else if (!data.business?.demo_data_active) {
                const bizCreated = data.business?.created_at ? new Date(data.business.created_at).getTime() : 0
                const bizIsNew = bizCreated > 0 && (Date.now() - bizCreated) < 10 * 60 * 1000
                if (bizIsNew && !localStorage.getItem(`lumio_onboarding_done_${slug}`) && !localStorage.getItem('lumio_onboarding_shown') && !localStorage.getItem('lumio_tour_completed')) {
                  setShowLiveOnboarding(true)
                }
              }
            })
            .catch(() => router.replace('/login?redirectTo=/' + slug))
        }).catch(() => router.replace('/login?redirectTo=/' + slug))
      }).catch(() => router.replace(`/login?redirectTo=/${slug}`))
    }
  }, [slug, router])

  // Clear stale localStorage staff data — Supabase is now the only source
  useEffect(() => {
    localStorage.removeItem('lumio_staff_imported')
    localStorage.removeItem('lumio_staff_imported_source')
    localStorage.removeItem('lumio_staff_ids')
    localStorage.removeItem('lumio_staff_profiles')
  }, [])

  // Fetch staff from Supabase when session is ready or after import
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') : null
    if (!token) return
    fetch('/api/workspace/staff', { headers: { 'x-workspace-token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.staff) {
          setSupabaseStaff(data.staff)
        }
      })
      .catch(() => {})
  }, [businessId, staffRefreshKey])

  // Re-fetch staff when new staff is imported via CSV
  useEffect(() => {
    const handler = () => setStaffRefreshKey(k => k + 1)
    window.addEventListener('lumio-staff-imported', handler)
    return () => window.removeEventListener('lumio-staff-imported', handler)
  }, [])

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : ''

  function handleOnboardingComplete() {
    setShowOnboarding(false)
    // Mark onboarding as done so it never reappears
    localStorage.setItem(`lumio_onboarding_done_${slug}`, 'true')
    localStorage.setItem('lumio_onboarding_shown', 'true')
    setShowTabGuide(true)
  }

  async function handleTabGuideComplete() {
    setShowTabGuide(false)
    localStorage.setItem('lumio_tour_completed', 'true')
    localStorage.setItem(`lumio_tour_done_${slug}`, 'true')
    localStorage.setItem('lumio_onboarding_shown', 'true')
    localStorage.setItem(`lumio_onboarding_done_${slug}`, 'true')
    localStorage.setItem(`onboarding-dismissed-${slug}`, 'true')
    // Mark onboarding as complete in Supabase
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'x-workspace-token': sessionToken },
      })
    } catch {}
    fireToast('Welcome to Lumio! Your workspace is ready.')
  }

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#07080F', color: '#F9FAFB', height: '100vh', overflow: 'hidden' }}>
      {/* Bell + Avatar — fixed top-right */}
      <div className="hidden md:flex" style={{ position: 'fixed', top: 12, right: 20, zIndex: 9999, alignItems: 'center', gap: 8 }}>
        <button onClick={() => setNotificationsOpen(o => !o)} title="Notifications" style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }} />
        </button>
        <AvatarDropdown initials={userName ? userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'AM'} settingsHref={`/${slug}/settings`} />
      </div>

      <ImpersonationBanner />
      <Toast message={toast} />

      {/* Hidden file input for avatar upload */}
      <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) { fireToast('File too large (max 2MB)'); return }
        const validTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) { fireToast('Invalid file type'); return }
        const blobUrl = URL.createObjectURL(file)
        setUserPhoto(blobUrl)
        const token = localStorage.getItem('workspace_session_token')
        const userEmail = localStorage.getItem('lumio_user_email')
        if (!token || !userEmail) return
        const fd = new FormData()
        fd.append('file', file)
        fd.append('email', userEmail)
        try {
          const res = await fetch('/api/workspace/upload-profile-photo', { method: 'POST', headers: { 'x-workspace-token': token }, body: fd })
          const data = await res.json()
          if (data.url) {
            setUserPhoto(data.url)
            localStorage.setItem('lumio_user_photo', data.url)
            localStorage.setItem(`lumio_staff_photo_${userEmail}`, data.url)
            window.dispatchEvent(new CustomEvent('lumio-avatar-updated', { detail: data.url }))
            fireToast('Photo updated')
          }
          URL.revokeObjectURL(blobUrl)
        } catch { fireToast('Upload failed'); URL.revokeObjectURL(blobUrl) }
        e.target.value = ''
      }} />

      {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}

      {/* SSO Welcome Modal */}
      {ssoWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.95)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSsoWelcome(null)}>
          <div style={{ textAlign: 'center', maxWidth: 440, padding: '2.5rem', width: '100%', backgroundColor: '#111318', borderRadius: 20, border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{ssoWelcome.pending ? '👋' : '🎉'}</div>
            <h2 style={{ color: '#F9FAFB', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Welcome, {ssoWelcome.name.split(' ')[0] || 'there'}!</h2>
            {ssoWelcome.pending ? (
              <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Your department is being confirmed by HR — you have full access in the meantime.
              </p>
            ) : (
              <p style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                You&apos;ve been assigned to <span style={{ color: '#7C3AED', fontWeight: 600 }}>{ssoWelcome.department}</span>. Your workspace is ready to go.
              </p>
            )}
            <button onClick={() => setSsoWelcome(null)} style={{ width: '100%', padding: '12px 24px', borderRadius: 12, backgroundColor: '#7C3AED', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Live tenant onboarding wizard */}
      {showLiveOnboarding && businessId && (
        <OnboardingWizard
          type="business"
          tenantId={businessId}
          onComplete={() => {
            setShowLiveOnboarding(false)
            localStorage.setItem(`lumio_onboarding_done_${slug}`, 'true')
            localStorage.setItem('lumio_onboarding_shown', 'true')
            localStorage.setItem(`onboarding-dismissed-${slug}`, 'true')
          }}
        />
      )}

      {/* Welcome overlay — first visit */}
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
              localStorage.setItem(`lumio_welcomed_${slug}`, 'true')
              setShowWelcome(false)
              setShowOnboarding(true)
            }}
              style={{ width: '100%', background: '#F59E0B', color: '#000', border: 'none', padding: '1rem 2rem', borderRadius: 10, fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em' }}>
              Get Started →
            </button>
          </div>
        </div>
      )}

      {/* Onboarding */}
      {showOnboarding && (
        <GettingStartedModal
          companyName={company}
          ownerEmail={ownerEmail}
          sessionToken={sessionToken}
          onComplete={handleOnboardingComplete}
        />
      )}
      {showTabGuide && <TabGuide onComplete={handleTabGuideComplete} />}

      {/* Demo data bar — slim version with connections modal */}
      {/* Impersonation banner */}
      {typeof window !== 'undefined' && localStorage.getItem('lumio_impersonated_from_admin') === 'true' && (
        <div className="flex items-center justify-between px-4 py-2 rounded-none" style={{ backgroundColor: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.3)' }}>
          <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
            👁 Impersonating: {localStorage.getItem('lumio_impersonated_user_name') || 'User'} ({localStorage.getItem('lumio_impersonated_user_role') || 'user'})
          </p>
          <button onClick={() => {
            localStorage.removeItem('lumio_impersonated_user_email')
            localStorage.removeItem('lumio_impersonated_user_name')
            localStorage.removeItem('lumio_impersonated_user_role')
            localStorage.removeItem('lumio_impersonated_user_role_level')
            localStorage.removeItem('lumio_impersonated_from_admin')
            window.location.href = '/admin'
          }} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
            Exit Impersonation
          </button>
        </div>
      )}

      {/* Mobile menu button */}
      <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
        <button className="p-1.5 rounded-lg" style={{ color: '#9CA3AF' }} onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
        <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>{company}</span>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeDept={activeDept} onSelect={setActiveDept} open={sidebarOpen} onClose={() => setSidebarOpen(false)} companyName={company} companyLogo={companyLogo}
          userInitials={userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : undefined} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Demo banner — in flow, first child of right column */}
          {demoDataActive && (
            <div className="hidden md:flex items-center justify-between px-4 shrink-0" style={{ height: 40, minHeight: 40, background: '#0D9488', color: '#F9FAFB', paddingRight: 140 }}>
              <span className="text-xs font-medium">Demo workspace — exploring with sample data · Connect your real tools to see live insights</span>
              <div className="flex items-center gap-2">
                <button onClick={() => { setDemoDataActive(false); localStorage.setItem('lumio_demo_active', 'false') }} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', marginRight: 120 }}>Clear Demo Data</button>
              </div>
            </div>
          )}
          {/* Scrollable page content */}
          <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
            {activeDept !== 'overview' && (
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-bold">{deptLabel}</h1>
              </div>
            )}

            {activeDept === 'overview' && <OverviewView company={company} firstName={userName ? userName.split(' ')[0] : undefined} onAction={fireToast} ttsEnabled={ttsEnabled} voiceCommandsEnabled={voiceCommandsEnabled} demoDataActive={demoDataActive} onGoSettings={() => setActiveDept('settings')} supabaseStaff={supabaseStaff} onBellClick={() => setNotificationsOpen(o => !o)} roleSwitcher={<RoleSwitcherPill />} settingsHref={`/${slug}/settings`} userNameProp={userName} dismissedWins={dismissedWins} onDismissWin={handleDismissWin} />}
            {activeDept === 'settings' && <SettingsView company={company} demoDataActive={demoDataActive} sessionToken={sessionToken} onDemoToggle={setDemoDataActive} onToast={fireToast} />}
            {activeDept !== 'overview' && activeDept !== 'settings' && <DeptRedirect dept={activeDept} slug={slug} />}
          </main>
        </div>
      </div>
    </div>
  )
}

// Quick actions: 20 buttons, integration gate allows null integrations through (always enabled)
// New buttons use OverviewActionModal via activeQuickAction state
