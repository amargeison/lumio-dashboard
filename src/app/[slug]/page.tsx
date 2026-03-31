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
  Database, RotateCcw, Upload, Mail, MessageSquare, Phone, FolderKanban,
} from 'lucide-react'
import { useElevenLabsTTS as useSpeech } from '@/hooks/useElevenLabsTTS'
import { useWakeWord } from '@/hooks/useWakeWord'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import ClearDemoBar from '@/components/dashboard/ClearDemoBar'
import { ClaimExpenseModal, BookHolidayModal, ReportSicknessModal } from '@/components/modals/StaffModals'
import { useVoiceCommands, type VoiceCommandResult } from '@/hooks/useVoiceCommands'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'
import QuickWins from '@/app/(dashboard)/overview/components/QuickWins'
import DailyTasks from '@/app/(dashboard)/overview/components/DailyTasks'
import Insights from '@/app/(dashboard)/overview/components/Insights'
import NotToMiss from '@/app/(dashboard)/overview/components/NotToMiss'
import TeamPanel from '@/app/(dashboard)/overview/components/TeamPanel'
import GettingStartedModal from '@/components/onboarding/GettingStartedModal'
import TabGuide from '@/components/onboarding/TabGuide'

// ─── Types ───────────────────────────────────────────────────────────────────

type DeptId = 'overview' | 'insights' | 'hr' | 'accounts' | 'sales' | 'crm' | 'marketing' | 'trials' | 'operations' | 'support' | 'success' | 'it' | 'workflows' | 'settings' | 'partners' | 'strategy' | 'projects'

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

function PersonalBanner({ company, firstName, onVoiceCommand, ttsEnabled = true, voiceCommandsEnabled = true }: { company: string; firstName?: string; onVoiceCommand?: (cmd: VoiceCommandResult) => void; ttsEnabled?: boolean; voiceCommandsEnabled?: boolean }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [bg] = useState(() => BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useSpeech()
  const [quote, setQuote] = useState(QUOTES[0])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })

  useEffect(() => {
    const start = new Date(new Date().getFullYear(), 0, 1).getTime()
    const dayOfYear = Math.floor((Date.now() - start) / 86400000)
    setQuote(QUOTES[dayOfYear % QUOTES.length])
  }, [])

  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  const { isListening, lastCommand, startListening, stopListening, pendingAction, setPendingAction } = useVoiceCommands()

  function handleBriefing() {
    if (!ttsEnabled) return
    if (isPlaying) { stop(); return }
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const openingLine = OPENING_LINES[dayOfYear % OPENING_LINES.length]
    const closingLine = CLOSING_LINES[dayOfYear % CLOSING_LINES.length]
    const script = `${greeting}, ${firstName || 'there'}. ${openingLine} You have 4 meetings today, 12 emails to review, and 2 workflows need attention. ${closingLine}`
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script]
    let chunk = ''
    const chunks: string[] = []
    for (const s of sentences) {
      if ((chunk + s).length > 480) {
        if (chunk) chunks.push(chunk.trim())
        chunk = s
      } else {
        chunk += s
      }
    }
    if (chunk) chunks.push(chunk.trim())
    if (chunks.length > 0) speak(chunks[0])
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
  </>
  )
}

// ─── Photo Frame ────────────────────────────────────────────────────────────

const DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop',
]

// Photos stored in localStorage only — never persisted to server or committed to repo
function PhotoFrame() {
  const [photos, setPhotos] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('lumio_photo_frame') : null
      if (saved) { const parsed = JSON.parse(saved); if (parsed.length > 0) return parsed }
      return DEMO_PHOTOS
    } catch { return [] }
  })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [intervalSecs, setIntervalSecs] = useState(5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx(i => (i + 1) % photos.length)
      }, intervalSecs * 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, photos.length, intervalSecs])

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const url = ev.target?.result as string
        setPhotos(prev => {
          const next = [...prev, url].slice(-20)
          localStorage.setItem('lumio_photo_frame', JSON.stringify(next))
          return next
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    setPhotos(prev => {
      const next = prev.filter((_, i) => i !== idx)
      localStorage.setItem('lumio_photo_frame', JSON.stringify(next))
      if (currentIdx >= next.length) setCurrentIdx(Math.max(0, next.length - 1))
      return next
    })
  }

  function prev() { setCurrentIdx(i => (i - 1 + photos.length) % photos.length) }
  function next() { setCurrentIdx(i => (i + 1) % photos.length) }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 280 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🖼️</span>
          <span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span>
        </div>
        <div className="flex items-center gap-2">
          {photos.length > 1 && (
            <button onClick={() => setIsPlaying(p => !p)} className="text-xs px-2 py-1 rounded-lg"
              style={{ backgroundColor: isPlaying ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: isPlaying ? '#0D9488' : '#6B7280', border: `1px solid ${isPlaying ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="text-xs px-2 py-1 rounded-lg"
            style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
            + Add Photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 mx-4 mb-4 rounded-xl cursor-pointer"
          style={{ border: '2px dashed #374151', backgroundColor: 'rgba(255,255,255,0.02)' }}
          onClick={() => fileInputRef.current?.click()}>
          <div className="text-4xl">📷</div>
          <div className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Add your photos</div>
          <div className="text-xs text-center px-4" style={{ color: '#6B7280' }}>Upload from device, or connect Google Photos or iCloud below</div>
          <div className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
            + Upload Photos
          </div>
        </div>
      ) : (
        <div className="flex-1 relative mx-4 mb-2 rounded-xl overflow-hidden" style={{ minHeight: 180 }}>
          <img src={photos[currentIdx]} alt="Photo frame" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, transition: 'opacity 0.5s ease' }} />
          {photos.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 14 }}>‹</button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 14 }}>›</button>
            </>
          )}
          {photos.length > 1 && photos.length <= 10 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setCurrentIdx(i)}
                  style={{ width: i === currentIdx ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === currentIdx ? '#0D9488' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
              ))}
            </div>
          )}
          <button onClick={() => removePhoto(currentIdx)} className="absolute top-2 right-2 flex items-center justify-center rounded-full text-xs"
            style={{ width: 22, height: 22, backgroundColor: 'rgba(0,0,0,0.6)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.2)' }}>×</button>
          <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#D1D5DB' }}>
            {currentIdx + 1} / {photos.length}
          </div>
        </div>
      )}

      <div className="px-4 pb-3 flex-shrink-0">
        {photos.length > 1 && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs" style={{ color: '#6B7280' }}>Speed:</span>
            {[3, 5, 10, 30].map(s => (
              <button key={s} onClick={() => setIntervalSecs(s)} className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: intervalSecs === s ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: intervalSecs === s ? '#0D9488' : '#6B7280', border: `1px solid ${intervalSecs === s ? 'rgba(13,148,136,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                {s}s
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button className="flex-1 text-xs py-1.5 rounded-lg flex items-center justify-center gap-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid #1F2937' }}
            onClick={() => alert('Google Photos integration coming soon \u2014 connect in Settings \u2192 Integrations')}>
            <span>📷</span> Google Photos
          </button>
          <button className="flex-1 text-xs py-1.5 rounded-lg flex items-center justify-center gap-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid #1F2937' }}
            onClick={() => alert('iCloud integration coming soon \u2014 connect in Settings \u2192 Integrations')}>
            <span>☁️</span> iCloud
          </button>
        </div>
      </div>
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
      { id: 'w1', from: 'Sarah Mitchell', avatar: 'SM', subject: 'Re: Lumio demo follow-up', preview: 'Hi, just following up on our call yesterday. When can we schedule the full team demo?', time: '9:15am', urgent: false, read: false },
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
      { id: 'e3', from: 'Stripe', avatar: 'ST', subject: 'Payment confirmed — \u00A34,800 from Oakridge', preview: 'Your payment of \u00A34,800.00 from Oakridge Schools Ltd has been processed successfully.', time: '7:31am', urgent: false, read: false },
      { id: 'e4', from: 'Helen Park', avatar: 'HP', subject: 'Re: Lumio Pro demo — follow-up questions', preview: 'Thanks for the demo yesterday. We have a few questions about the safeguarding module...', time: 'Yesterday', urgent: false, read: true },
      { id: 'e5', from: 'Dan Marsh', avatar: 'DM', subject: 'Q2 board pack — action needed', preview: 'Please review the attached slides before Friday\u2019s board meeting and send your comments.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'slack', icon: '💬', label: 'Slack', count: 7, urgent: false,
    color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)',
    messages: [
      { id: 's1', from: 'Charlotte Davies', avatar: 'CD', subject: '#sales-pipeline', preview: 'Lead scored 87 in SA-02 — Arron, want me to move this to Proposal stage?', time: '9:02am', urgent: false, read: false, channel: '#sales-pipeline' },
      { id: 's2', from: 'HR Bot', avatar: 'HR', subject: '#hr-alerts', preview: 'HR-01 workflow completed for new joiner Sophie Williams. Onboarding pack sent \u2713', time: '8:45am', urgent: false, read: false, channel: '#hr-alerts' },
      { id: 's3', from: 'James Harlow', avatar: 'JH', subject: '#general', preview: 'Morning all — heads up, the Wimbledon client is pushing for a demo this Friday. Anyone free?', time: '8:30am', urgent: false, read: false, channel: '#general' },
      { id: 's4', from: 'Rachel Davies', avatar: 'RD', subject: '#management', preview: 'Board pack is ready for review. Can someone sense-check the financial slides?', time: 'Yesterday', urgent: false, read: true, channel: '#management' },
    ]
  },
  {
    id: 'teams', icon: '🟣', label: 'Microsoft Teams', count: 3, urgent: false,
    color: '#7B83EB', bg: 'rgba(123,131,235,0.08)', border: 'rgba(123,131,235,0.2)',
    messages: [
      { id: 'tm1', from: 'Charlotte Davies', avatar: 'CD', subject: 'Sales Standup', preview: 'Quick update \u2014 the Apex deal is moving to proposal stage. Can we review pricing before EOD?', time: '9:30am', urgent: false, read: false },
      { id: 'tm2', from: 'Sophie Williams', avatar: 'SW', subject: 'Onboarding checklist', preview: 'Hi Arron, I\u2019ve completed the first 3 items on my onboarding checklist. Where do I find the IT setup guide?', time: '8:50am', urgent: false, read: false },
      { id: 'tm3', from: 'James Okafor', avatar: 'JO', subject: 'Client feedback', preview: 'Just got off a call with Oakridge \u2014 they love the new safeguarding module. Might be worth a case study.', time: 'Yesterday', urgent: false, read: true },
    ]
  },
  {
    id: 'hubspot', icon: '🟠', label: 'HubSpot', count: 5, urgent: false,
    color: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)',
    messages: [
      { id: 'h1', from: 'HubSpot CRM', avatar: 'HS', subject: 'Deal update — Apex Consulting moved to Negotiation', preview: 'The deal with Apex Consulting (\u00A324,000 ARR) has been moved to Negotiation stage by Charlotte Davies.', time: '9:45am', urgent: false, read: false },
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
      { id: 'l1', from: 'Sarah Mitchell', avatar: 'SM', subject: 'Connection request', preview: 'Hi, I came across Lumio and would love to connect. We\u2019re looking for a school management solution.', time: '10:15am', urgent: false, read: false },
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

function MorningRoundup() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replied, setReplied] = useState<string[]>([])
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [showReply, setShowReply] = useState<string | null>(null)

  function handleReply(msgId: string) {
    if (replyText[msgId]?.trim()) {
      setReplied(r => [...r, msgId])
      setShowReply(null)
      setReplyText(t => ({ ...t, [msgId]: '' }))
    }
  }

  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>🌅 Morning Roundup</h3>
        <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
      </div>
      <div className="space-y-2">
        {ROUNDUP_ITEMS.map(item => {
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
                  {item.id === 'whatsapp' && (
                    <div className="mx-0 mb-1 px-3 py-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
                      <span className="text-xs" style={{ color: '#25D366' }}>💬 Showing demo data — connect WhatsApp Business to see real messages</span>
                      <button className="text-xs px-2 py-1 rounded-lg ml-2 flex-shrink-0" style={{ backgroundColor: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
                        onClick={() => window.location.href = '/settings'}>Connect →</button>
                    </div>
                  )}
                  {item.id === 'sms' && (
                    <div className="mx-0 mb-1 px-3 py-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <span className="text-xs" style={{ color: '#3B82F6' }}>📱 Showing demo data — connect Twilio SMS to see real messages</span>
                      <button className="text-xs px-2 py-1 rounded-lg ml-2 flex-shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}
                        onClick={() => window.location.href = '/settings'}>Connect →</button>
                    </div>
                  )}
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
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
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
  { label: 'Send Email', tooltip: 'Open the email composer', icon: Mail },
  { label: 'Send Slack', tooltip: 'Send a message on Slack', icon: MessageSquare },
  { label: 'Phone Call', tooltip: 'Log a phone call', icon: Phone },
  { label: 'Book Meeting', tooltip: 'Schedule a meeting or demo', icon: Calendar },
  { label: 'Team Events', tooltip: 'Schedule a team event', icon: Users },
  { label: 'Claim Expenses', tooltip: 'Submit an expense claim', icon: Receipt },
  { label: 'Book Holiday', tooltip: 'Request annual leave', icon: Calendar },
  { label: 'Report Sickness', tooltip: 'Report an absence', icon: AlertCircle },
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

// ─── Briefing Settings ──────────────────────────────────────────────────────

function BriefingSettings() {
  const [enabled, setEnabled] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_briefing_enabled') !== 'false' : true)
  const [weather, setWeather] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_briefing_weather') !== 'false' : true)
  const [meetings, setMeetings] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_briefing_meetings') !== 'false' : true)
  const [urgent, setUrgent] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_briefing_urgent') !== 'false' : true)
  const [time, setTime] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_briefing_time') || '8am' : '8am')

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
  const [activeVoice, setActiveVoice] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('lumio_tts_voice') || '21m00Tcm4TlvDq8ikWAM'
    return '21m00Tcm4TlvDq8ikWAM'
  })
  const [previewing, setPreviewing] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [ttsOn, setTtsOn] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_enabled') !== 'false' : true)
  const [vcOn, setVcOn] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_voice_commands_enabled') !== 'false' : true)

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
  const [zones, setZones] = useState(getStoredZones)
  const [search, setSearch] = useState('')
  const localTz = getUserLocalTz()

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

      {/* AI Morning Briefing */}
      <BriefingSettings />

      {/* Voice Assistant */}
      <VoiceSelector />

      {/* World Clock Timezones */}
      <TimezoneSelector />

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

function OverviewView({ company, firstName, onAction, ttsEnabled = true, voiceCommandsEnabled = true }: { company: string; firstName?: string; onAction: (msg: string) => void; ttsEnabled?: boolean; voiceCommandsEnabled?: boolean }) {
  const [showExpense, setShowExpense] = useState(false)
  const [showHoliday, setShowHoliday] = useState(false)
  const [showSickness, setShowSickness] = useState(false)

  const quickActionToasts: Record<string, string> = {
    'Send Email': 'Opening email composer...',
    'Send Slack': 'Opening Slack...',
    'Phone Call': 'Logging a call...',
    'Book Meeting': 'Opening calendar...',
    'Team Events': 'Opening team events...',
  }

  const quickActionModals: Record<string, () => void> = {
    'Claim Expenses': () => setShowExpense(true),
    'Book Holiday': () => setShowHoliday(true),
    'Report Sickness': () => setShowSickness(true),
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
      <PersonalBanner company={company} firstName={firstName} onVoiceCommand={handleVoiceCommand} ttsEnabled={ttsEnabled} voiceCommandsEnabled={voiceCommandsEnabled} />
      <TabBar tab={tab} onChange={setTab} />

      {tab === 'today' ? (
        <div className="space-y-4">
          <QuickActionsBar onAction={handleQuickAction} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-1 flex flex-col">
              <MorningRoundup />
            </div>
            <div className="lg:col-span-1 flex flex-col">
              <MeetingsToday />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
              <PhotoFrame />
              <MorningAIPanel />
            </div>
          </div>

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
        </div>
      ) : tab === 'quick-wins' ? (
        <QuickWins />
      ) : tab === 'tasks' ? (
        <DailyTasks />
      ) : tab === 'insights' ? (
        <Insights />
      ) : tab === 'not-to-miss' ? (
        <NotToMiss />
      ) : tab === 'team' ? (
        <TeamPanel selectedDepts={typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('lumio_selected_departments') || '[]') : []} />
      ) : (
        <TabPlaceholder tab={tab} />
      )}

      {showExpense && <ClaimExpenseModal onClose={() => setShowExpense(false)} onToast={onAction} />}
      {showHoliday && <BookHolidayModal onClose={() => setShowHoliday(false)} onToast={onAction} />}
      {showSickness && <ReportSicknessModal onClose={() => setShowSickness(false)} onToast={onAction} />}
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
  const [showWelcome, setShowWelcome] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTabGuide, setShowTabGuide] = useState(false)
  const [demoDataActive, setDemoDataActive] = useState(false)
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_tts_enabled') !== 'false' : true)
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('lumio_voice_commands_enabled') !== 'false' : true)

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
            if (justPurchased) {
              if (!localStorage.getItem(`lumio_welcomed_${slug}`)) {
                setShowWelcome(true)
              } else {
                setShowOnboarding(true)
              }
              return
            }
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
          if (!data.onboarding_complete) {
            if (!localStorage.getItem(`lumio_welcomed_${slug}`)) {
              setShowWelcome(true)
            } else {
              setShowOnboarding(true)
            }
          }
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

      {/* Top-right: bell + avatar */}
      <div style={{ position: 'fixed', top: 12, right: 20, zIndex: 60, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setNotificationsOpen(o => !o)}
          title="Notifications"
          style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <Bell size={16} strokeWidth={1.75} />
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', fontSize: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
        </button>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAvatarDropdownOpen(o => !o)}
            style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#6C3FC5', border: 'none', color: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            {userName ? userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'AM'}
          </button>
          {avatarDropdownOpen && (
            <div className="rounded-xl py-2 shadow-xl" style={{ position: 'absolute', top: 44, right: 0, minWidth: 160, backgroundColor: '#111318', border: '1px solid #1F2937', zIndex: 70 }}>
              <button onClick={() => { setAvatarDropdownOpen(false); fireToast('Profile settings coming soon') }} className="flex w-full items-center gap-2 px-4 py-2 text-sm" style={{ color: '#9CA3AF' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}>
                👤 Profile
              </button>
              <button onClick={() => { setAvatarDropdownOpen(false); setActiveDept('settings') }} className="flex w-full items-center gap-2 px-4 py-2 text-sm" style={{ color: '#9CA3AF' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}>
                ⚙️ Settings
              </button>
              <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('workspace_') || k.startsWith('demo_')).forEach(k => localStorage.removeItem(k)); router.replace('/login') }} className="flex w-full items-center gap-2 px-4 py-2 text-sm" style={{ color: '#EF4444' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                🚪 Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}

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
      {demoDataActive && <ClearDemoBar />}

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

            {activeDept === 'overview' && <OverviewView company={company} firstName={userName ? userName.split(' ')[0] : undefined} onAction={fireToast} ttsEnabled={ttsEnabled} voiceCommandsEnabled={voiceCommandsEnabled} />}
            {activeDept === 'settings' && <SettingsView company={company} demoDataActive={demoDataActive} sessionToken={sessionToken} onDemoToggle={setDemoDataActive} />}
            {activeDept !== 'overview' && activeDept !== 'settings' && <DeptRedirect dept={activeDept} />}
          </main>
        </div>
      </div>
    </div>
  )
}
