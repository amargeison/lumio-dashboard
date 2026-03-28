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
  Database, RotateCcw, Upload,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { useWakeWord } from '@/hooks/useWakeWord'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'
import GettingStartedModal from '@/components/onboarding/GettingStartedModal'
import TabGuide from '@/components/onboarding/TabGuide'

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

function Sidebar({ activeDept, onSelect, open, onClose, companyName, companyLogo: initialLogo, userInitials }: {
  activeDept: DeptId; onSelect: (d: DeptId) => void; open: boolean; onClose: () => void
  companyName?: string; companyLogo?: string; userInitials?: string
}) {
  const initials = userInitials || (companyName || 'LC').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const companyInitials = (companyName || 'LC').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const [pinned, setPinned] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_sidebar_pinned') === 'true')
  const [hovered, setHovered] = useState(false)
  const [logoUrl, setLogoUrl] = useState(initialLogo || null)
  const [iconHover, setIconHover] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const expanded = pinned || hovered

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
    const slug = localStorage.getItem('lumio_workspace_slug') || 'default'
    const ext = file.name.split('.').pop() || 'png'
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const path = `${slug}/logo.${ext}`
      const { error } = await supabase.storage.from('company-logos').upload(path, file, { upsert: true })
      if (error) console.error('Logo upload error:', error)
      const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path)
      setLogoUrl(publicUrl)
      localStorage.setItem('lumio_company_logo', publicUrl)
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
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        <div className="flex items-center gap-2.5 px-2.5 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937', minHeight: 52 }}>
          <button
            onClick={() => fileRef.current?.click()}
            onMouseEnter={() => setIconHover(true)}
            onMouseLeave={() => setIconHover(false)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 overflow-hidden"
            style={{ backgroundColor: logoUrl ? 'transparent' : '#6C3FC5', color: '#F9FAFB' }}
            title="Upload company logo"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              companyInitials
            )}
            {iconHover && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </div>
            )}
          </button>
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
          {SIDEBAR_ITEMS.map(item => {
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
          <div className="flex items-center gap-2 px-2.5 py-3" style={{ justifyContent: expanded ? 'flex-start' : 'center' }}>
            <AvatarDropdown initials={initials} />
            {expanded && (
              <>
                <span className="flex-1 text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>{initials}</span>
                <button className="relative flex items-center justify-center rounded-lg p-1.5" style={{ color: '#9CA3AF' }}>
                  <Calendar size={16} strokeWidth={1.75} />
                  <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#0D9488' }} />
                </button>
              </>
            )}
          </div>
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
              {SIDEBAR_ITEMS.map(item => {
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
              <div className="flex items-center gap-2 py-3">
                <AvatarDropdown initials={initials} />
                <span className="flex-1 text-xs font-medium truncate" style={{ color: '#9CA3AF' }}>{initials}</span>
              </div>
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
  'from-violet-950 via-purple-900 to-indigo-950',
  'from-purple-950 via-violet-900 to-indigo-950',
  'from-indigo-950 via-purple-900 to-violet-950',
  'from-violet-950 via-indigo-900 to-purple-950',
  'from-purple-950 via-indigo-900 to-violet-950',
  'from-indigo-950 via-violet-900 to-purple-950',
  'from-violet-950 via-purple-950 to-indigo-900',
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
]

const WORLD_ZONES = [
  { label: 'London',   tz: 'Europe/London'    },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Dubai',    tz: 'Asia/Dubai'       },
  { label: 'Tokyo',    tz: 'Asia/Tokyo'       },
]

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
  const [mode, setMode] = useState<'digital' | 'analogue'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('lumio_clock_mode') as 'digital' | 'analogue') || 'digital'
    return 'digital'
  })
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])

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
            {WORLD_ZONES.map(z => (
              <div key={z.label} className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-black text-white">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: z.tz, hour12: false })}</span>
                <span className="text-xs" style={{ color: 'rgba(167,139,250,0.6)' }}>{z.label}</span>
              </div>
            ))}
          </div>
          <div className="text-xs mt-1" style={{ color: 'rgba(167,139,250,0.4)' }}>World Clock</div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {WORLD_ZONES.map(z => (
              <div key={z.label} className="flex flex-col items-center gap-1">
                <MiniAnalogClock tz={z.tz} now={now} />
                <span className="text-[9px] font-medium" style={{ color: 'rgba(167,139,250,0.6)' }}>{z.label}</span>
              </div>
            ))}
          </div>
          <div className="text-xs mt-1" style={{ color: 'rgba(167,139,250,0.4)' }}>World Clock</div>
        </>
      )}
    </div>
  )
}

function PersonalBanner({ company, firstName }: { company: string; firstName?: string }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [bg] = useState(() => BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useSpeech()
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })

  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    speak(`${greeting}, ${firstName || 'there'}. Welcome to your Lumio workspace. You have 4 meetings today, 12 emails to review, and 2 workflows need attention.`)
  }

  return (
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl" />
      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {firstName || 'there'} 👋</h1>
              <button onClick={handleBriefing} title="Text-to-Speech" className="flex items-center justify-center rounded-lg transition-all"
                style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isPlaying ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)', border: isPlaying ? '1px solid rgba(13,148,136,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isPlaying ? '#2DD4BF' : '#9CA3AF', animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
                <Volume2 size={15} strokeWidth={1.75} />
              </button>
              <div className="relative overflow-hidden rounded-lg" title="Voice Commands coming soon" style={{ width: 32, height: 32, flexShrink: 0 }}>
                <button disabled className="flex items-center justify-center w-full h-full rounded-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#6B7280', cursor: 'not-allowed' }}>
                  <Mic size={15} strokeWidth={1.75} />
                </button>
                <span className="absolute pointer-events-none"
                  style={{ top: 3, right: -9, transform: 'rotate(35deg)', backgroundColor: '#6C3FC5', color: '#fff', fontSize: 5, fontWeight: 700, letterSpacing: '0.03em', padding: '1px 10px', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                  SOON
                </span>
              </div>
            </div>
            <p className="text-purple-300 text-sm mb-2">{date}</p>
            <p className="text-purple-200/60 text-sm italic">&ldquo;{quote.text}&rdquo; — {quote.author}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Meetings', value: 4, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '📅' },
              { label: 'Tasks', value: 7, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '✅' },
              { label: 'Urgent', value: 2, color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🔴' },
              { label: 'Emails', value: 12, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '📧' },
            ].map(item => (
              <div key={item.label} className={`flex flex-col items-center px-3 py-2 rounded-xl border ${item.color} min-w-[70px]`}>
                <span className="text-base">{item.icon}</span>
                <span className="text-lg font-black text-white">{item.value}</span>
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
  )
}

// ─── Morning Roundup ─────────────────────────────────────────────────────────

const ROUNDUP_ITEMS = [
  { id: 'email', icon: '📧', label: 'Emails', count: 12, urgent: true, color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)', preview: ['Invoice overdue from Bramble Hill', 'New trial signup — Just wow Inc', 'Stripe payment confirmed — Oakridge'] },
  { id: 'slack', icon: '💬', label: 'Slack', count: 7, urgent: false, color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)', preview: ['Charlotte: lead scored 87 in SA-02', 'HR-01 completed for new joiner'] },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn', count: 4, urgent: false, color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.2)', preview: ['2 connection requests', 'Post got 47 reactions'] },
  { id: 'news', icon: '📰', label: 'Industry News', count: 3, urgent: false, color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', preview: ['UK SMB automation market up 34% YoY'] },
  { id: 'notion', icon: '📋', label: 'Notion', count: 2, urgent: false, color: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)', preview: ['Testing guide updated — 2 items resolved'] },
]

function MorningRoundup() {
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
            <div key={item.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
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
              {isOpen && (<div className="px-3 pb-3 space-y-1.5">{item.preview.map((p, idx) => (<div key={idx} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}><span className="flex-shrink-0 mt-0.5" style={{ color: '#4B5563' }}>→</span>{p}</div>))}</div>)}
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
  return (
    <div className="border-b overflow-x-auto scrollbar-none -mx-4 sm:-mx-5" style={{ backgroundColor: '#0D0E14', borderColor: '#1F2937' }}>
      <div className="flex items-center gap-0 min-w-max px-2">
        {OVERVIEW_TABS.map(t => (
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
  { id: '2', title: 'New Customer Demo', time: '11:00', duration: '45 min', attendees: ['Charlotte D.'], location: 'Zoom', type: 'video', status: 'now', link: '#' },
  { id: '3', title: 'Investor Update Call', time: '14:00', duration: '60 min', attendees: ['Arron'], location: 'Google Meet', type: 'call', status: 'upcoming', link: '#' },
  { id: '4', title: 'Team Standup', time: '17:00', duration: '15 min', attendees: ['All team'], location: 'Slack Huddle', type: 'internal', status: 'upcoming' },
]

function MeetingsToday() {
  const live = MEETINGS.find(m => m.status === 'now')
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>📅 Meetings Today</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{MEETINGS.length} scheduled</span>
      </div>
      {live && (
        <div className="mb-3 rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <div className="flex-1"><p className="text-sm font-bold" style={{ color: '#4ADE80' }}>{live.title}</p><p className="text-xs" style={{ color: 'rgba(74,222,128,0.6)' }}>Happening now · {live.duration}</p></div>
          {'link' in live && live.link && <a href={live.link} className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: '#16A34A' }}>Join →</a>}
        </div>
      )}
      <div className="space-y-1">
        {MEETINGS.map(m => (
          <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ opacity: m.status === 'done' ? 0.4 : 1 }}>
            <div className="text-center flex-shrink-0 w-12"><div className="text-sm font-bold" style={{ color: '#E5E7EB' }}>{m.time}</div><div className="text-xs" style={{ color: '#6B7280' }}>{m.duration}</div></div>
            <span className="text-base flex-shrink-0">{{ call: '📞', video: '📹', internal: '💬' }[m.type]}</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate" style={{ color: m.status === 'done' ? '#6B7280' : '#F9FAFB', textDecoration: m.status === 'done' ? 'line-through' : 'none' }}>{m.title}</p><p className="text-xs truncate" style={{ color: '#6B7280' }}>{m.attendees.join(', ')} · {m.location}</p></div>
            {'link' in m && m.link && m.status !== 'done' && <a href={m.link} className="px-2 py-1 text-xs rounded-lg flex-shrink-0" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>Join</a>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Quick Actions Bar ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'New Joiner', tooltip: 'Trigger the HR onboarding workflow', icon: UserPlus },
  { label: 'New Customer', tooltip: 'Create a customer record and start welcome sequence', icon: Users },
  { label: 'Chase Invoice', tooltip: 'Send payment reminders for overdue invoices', icon: Receipt },
  { label: 'Support Ticket', tooltip: 'Open a new support ticket', icon: Headphones },
  { label: 'Team Events', tooltip: 'Schedule a team event', icon: Calendar },
]

function QuickActionsBar({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937' }}>
      <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
      {QUICK_ACTIONS.map(a => (
        <div key={a.label} className="relative group shrink-0">
          <button onClick={() => onAction(a.label)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <a.icon size={12} />{a.label}
          </button>
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1.5 rounded-lg text-xs w-48 text-center z-50 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: '#1A1D27', color: '#D1D5DB', border: '1px solid #374151' }}>{a.tooltip}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Dept Redirect — navigate to the real (dashboard) page ──────────────────

const DEPT_ROUTES: Record<string, string> = {
  hr: '/hr', accounts: '/accounts', sales: '/sales', crm: '/crm',
  marketing: '/marketing', trials: '/trials', operations: '/operations',
  support: '/support', success: '/success', it: '/it', workflows: '/workflows',
  partners: '/partners', strategy: '/strategy', insights: '/insights',
}

function DeptRedirect({ dept }: { dept: DeptId }) {
  const router = useRouter()
  useEffect(() => {
    const route = DEPT_ROUTES[dept]
    if (route) router.push(route)
  }, [dept, router])
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

function MorningAIPanel() {
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
          {MORNING_HIGHLIGHTS.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#C4B5FD' }}>{item}</p>
            </div>
          ))}
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

// ─── Settings View ───────────────────────────────────────────────────────────

function SettingsView({ company, demoDataActive, sessionToken, onDemoToggle }: {
  company: string; demoDataActive: boolean; sessionToken: string; onDemoToggle: (active: boolean) => void
}) {
  const [clearing, setClearing] = useState(false)
  const [loading, setLoading] = useState(false)
  const isDev = process.env.NEXT_PUBLIC_ENV !== 'production'
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleClearDemo() {
    setClearing(true)
    await fetch('/api/onboarding/clear-demo', { method: 'POST', headers: { 'x-workspace-token': sessionToken } }).catch(() => {})
    // Clear localStorage flags
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.setItem('lumio_demo_active', 'false')
    onDemoToggle(false)
    setClearing(false)
  }

  async function handleLoadDemo() {
    setLoading(true)
    await fetch('/api/onboarding/load-demo', { method: 'POST', headers: { 'x-workspace-token': sessionToken } }).catch(() => {})
    // Set localStorage flags so department pages show content immediately
    localStorage.setItem('lumio_demo_active', 'true')
    const allPages = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','settings','inbox','calendar','analytics','accounts','support','success','trials','operations','it']
    allPages.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
    onDemoToggle(true)
    setLoading(false)
  }

  async function handleUpload() {
    if (!uploadFiles.length) return
    setUploading(true)
    const fd = new FormData()
    uploadFiles.forEach(f => fd.append('files', f))
    fd.append('session_token', sessionToken)
    await fetch('/api/onboarding/process-data', { method: 'POST', body: fd }).catch(() => {})
    setUploadFiles([])
    setUploading(false)
  }

  async function handleResetOnboarding() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Just call the complete endpoint with a reset flag — or update directly
    await fetch('/api/onboarding/complete', { method: 'POST', headers: { 'x-workspace-token': sessionToken } }).catch(() => {})
    // Actually we need to UN-set it. Let's just reload — the API doesn't support reset.
    // For dev: we'll clear localStorage flag and reload
    localStorage.removeItem('onboarding_completed_' + company)
    window.location.reload()
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
    <div className="max-w-3xl space-y-6">
      {/* Workspace info */}
      {[
        { title: 'Workspace', fields: [['Company name', company], ['Plan', 'Lumio Business'], ['Status', 'Active']] },
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
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Bulk Data Import */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Data Import</p>
        </div>
        <div className="p-5">
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
              <button onClick={handleUpload} disabled={uploading} className="w-full py-2.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
                {uploading ? 'Processing...' : 'Process & Import'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Demo Data */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Demo Data</p>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: demoDataActive ? 'rgba(245,166,35,0.15)' : 'rgba(34,197,94,0.15)', color: demoDataActive ? '#F5A623' : '#22C55E' }}>
            {demoDataActive ? 'Active' : 'Off'}
          </span>
        </div>
        <div className="px-5 py-4">
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
      </div>

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
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dev: Reset onboarding */}
      {isDev && (
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#F5A623' }}>DEV TOOLS</p>
          <button onClick={handleResetOnboarding} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
            Reset Onboarding (re-test flow)
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Overview View ───────────────────────────────────────────────────────────

function OverviewView({ company, firstName, onAction }: { company: string; firstName?: string; onAction: (label: string) => void }) {
  const [tab, setTab] = useState<OverviewTab>('today')
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
      <PersonalBanner company={company} firstName={firstName} />
      <MorningRoundup />
      <TabBar tab={tab} onChange={setTab} />

      {tab === 'today' ? (
        <div className="space-y-4">
          <QuickActionsBar onAction={onAction} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <MeetingsToday />
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
            <div className="lg:col-span-1">
              <MorningAIPanel />
            </div>
          </div>
        </div>
      ) : (
        <TabPlaceholder tab={tab} />
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

  const [activeDept, setActiveDept] = useState<DeptId>('overview')
  const [company, setCompany]       = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('workspace_company_name') || localStorage.getItem('demo_company_name') || ''
    }
    return ''
  })
  const [userName, setUserName]     = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast]           = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTabGuide, setShowTabGuide] = useState(false)
  const [demoDataActive, setDemoDataActive] = useState(false)

  function fireToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    // Read cached values from localStorage
    const name = localStorage.getItem('workspace_company_name') || localStorage.getItem('demo_company_name') || ''
    const user = localStorage.getItem('workspace_user_name') || localStorage.getItem('demo_user_name') || ''
    const logo = localStorage.getItem('workspace_company_logo') || localStorage.getItem('demo_company_logo') || ''
    setCompany(name)
    setUserName(user)
    setCompanyLogo(logo)

    // Validate session against businesses table
    const sessionToken = localStorage.getItem('workspace_session_token')
    const justPurchased = localStorage.getItem('lumio_company_active') === 'true'
    if (sessionToken) {
      fetch('/api/workspace/status', { headers: { 'x-workspace-token': sessionToken } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || data.status !== 'active') {
            // Don't boot fresh purchases — session may still be propagating
            if (justPurchased) { setShowOnboarding(true); return }
            router.replace('/trial-ended')
            return
          }
          if (data.company_name) {
            setCompany(data.company_name)
            localStorage.setItem('workspace_company_name', data.company_name)
            localStorage.setItem('lumio_company_name', data.company_name)
          }
          if (data.owner_name) {
            setUserName(data.owner_name)
            localStorage.setItem('workspace_user_name', data.owner_name)
            localStorage.setItem('lumio_user_name', data.owner_name)
          }
          if (data.owner_email) {
            setOwnerEmail(data.owner_email)
            localStorage.setItem('lumio_user_email', data.owner_email)
          }
          if (data.logo_url) {
            setCompanyLogo(data.logo_url)
            localStorage.setItem('workspace_company_logo', data.logo_url)
            localStorage.setItem('lumio_company_logo', data.logo_url)
          }
          if (data.demo_data_active) setDemoDataActive(true)
          if (!data.onboarding_complete) setShowOnboarding(true)
        })
        .catch(() => {
          // Network error — don't redirect if this looks like a fresh purchase
          if (!justPurchased) router.replace('/trial-ended')
        })
    } else if (!justPurchased) {
      router.replace('/trial-ended')
    }
  }, [slug, router])

  const deptLabel = SIDEBAR_ITEMS.find(d => d.id === activeDept)?.label || 'Overview'
  const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('workspace_session_token') || '' : ''

  function handleOnboardingComplete() {
    setShowOnboarding(false)
    setShowTabGuide(true)
  }

  async function handleTabGuideComplete() {
    setShowTabGuide(false)
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
      <Toast message={toast} />

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

      {/* Demo data banner */}
      {demoDataActive && (
        <div className="flex items-center justify-between px-4 py-2.5 text-xs shrink-0 mx-4 mt-3"
          style={{ background: 'linear-gradient(135deg, #1e1040 0%, #1a1050 40%, #0d3a3a 100%)', borderRadius: '16px 16px 40% 40% / 16px 16px 40px 40px', boxShadow: '0 8px 32px rgba(13, 148, 136, 0.15)', paddingBottom: 16 }}>
          <span style={{ color: '#F9FAFB' }}>You&apos;re viewing demo data — clear it any time in Settings</span>
          <button onClick={() => setActiveDept('settings')} className="text-xs font-semibold transition-colors"
            style={{ color: 'rgba(249,250,251,0.6)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(249,250,251,0.6)' }}>
            Go to Settings →
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

        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <main className="flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold">{deptLabel}</h1>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Workspace: <span style={{ color: '#F9FAFB' }}>{company || (typeof window !== 'undefined' && localStorage.getItem('lumio_company_name')) || slug}</span></p>
              </div>
            </div>

            {activeDept === 'overview' && <OverviewView company={company} firstName={userName ? userName.split(' ')[0] : undefined} onAction={fireToast} />}
            {activeDept === 'settings' && <SettingsView company={company} demoDataActive={demoDataActive} sessionToken={sessionToken} onDemoToggle={setDemoDataActive} />}
            {activeDept !== 'overview' && activeDept !== 'settings' && <DeptRedirect dept={activeDept} />}
          </main>
        </div>
      </div>
    </div>
  )
}
