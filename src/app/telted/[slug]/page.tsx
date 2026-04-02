'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  LayoutDashboard, TrendingUp, Building2, Users, UserCheck, Shield, Clock,
  ClipboardList, Calendar, Database, Network, GitBranch, FileText, Settings,
  LogOut, Bell, Menu, X, Pin, ChevronRight, ChevronUp, ChevronDown,
  Sparkles, Volume2, Mic, Search, GraduationCap, BookOpen, FolderOpen,
  CalendarCheck, Download, Loader2, Printer,
} from 'lucide-react'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { useVoiceCommands } from '@/hooks/useVoiceCommands'
import { T, PUPILS, ALERTS, TRUST, STAFF, neliPupils, neliAvgGain, classAvgI, classAvgE, getLight, lc, lb, ll } from '@/components/neli/neliData'
import {
  Dashboard, NELITracker, LanguageScreenPage, ClassesPage, ClassDetail, PupilDetail,
  Insights, TrustView, Training, TrainingCourses, TELTedTraining, Resources,
} from '@/components/neli/NELIComponents'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ReferenceLine, ReferenceArea,
  ZAxis, AreaChart, Area,
} from 'recharts'
import DistrictDashboard from '@/components/neli/DistrictDashboard'
import {
  StaffManagementPage, SendDslPage, SafeguardingPage, WraparoundPage,
  InspectionModePage, RosteringPage, MisSyncPage, WorkflowsPage, ReportsToolPage,
} from '@/components/neli/SidebarPages'

const LanguageScreenApp = dynamic(() => import('@/components/neli/LanguageScreenApp'), { ssr: false })

// ─── TEL TED Voice Command Processor ─────────────────────────────────────────

interface VoiceToastData {
  text: string
  isAndrew?: boolean
}

function processTelTedCommand(transcript: string): { handled: boolean; response: string; isAndrew?: boolean } | null {
  const t = transcript.toLowerCase()

  // COMMAND 1 — TEL TED sessions today
  if (/sessions?\s*today|do i have sessions|tel\s*ted sessions|any sessions/i.test(t)) {
    const response = "Yes, you have 6 TEL TED sessions today. Starting with Group Session 1A at 8:30 with Amara, Leon, Fatima, Kai and Zahra. Then individual sessions with Amara Johnson at 9:15 and Leon Carter at 10. Group Session 1B at 11:30, a LanguageScreen assessment with Ruby Taylor at 2pm, and a parent call with the Johnson family at 3."
    return { handled: true, response }
  }

  // COMMAND 2 — Students needing LanguageScreen
  if (/language\s*screen|assessment\s*due|need\s*assess|who\s*needs?\s*assessment/i.test(t)) {
    const behind = PUPILS.filter((p: any) => p.neli && p.neliSessions < (p.neliExpected || 85) * 0.85)
    const dueCount = behind.length || neliPupils.length
    const names = (behind.length > 0 ? behind : neliPupils).slice(0, 3).map((p: any) => p.name.split(' ')[0])
    const amara = PUPILS.find((p: any) => p.name === 'Amara Johnson') as any
    const sessionsBehind = amara ? (amara.neliExpected || 85) - amara.neliSessions : 7
    const response = `${dueCount} students are due for LanguageScreen reassessment this term. ${names.join(', ')}. Amara Johnson is most overdue — her last assessment was at week ${amara?.neliWeek || 17} and she's ${sessionsBehind} sessions behind expected progress.`
    return { handled: true, response }
  }

  // COMMAND 3 — What week of TEL TED
  if (/what\s*week|which\s*week|week\s*are\s*we|tel\s*ted\s*week|programme\s*week|program\s*week/i.test(t)) {
    const avgWeek = Math.round(neliPupils.reduce((s: number, p: any) => s + (p.neliWeek || 17), 0) / neliPupils.length)
    const avgSessions = Math.round(neliPupils.reduce((s: number, p: any) => s + (p.neliSessions || 80), 0) / neliPupils.length)
    const avgExpected = Math.round(neliPupils.reduce((s: number, p: any) => s + (p.neliExpected || 85), 0) / neliPupils.length)
    const amara = PUPILS.find((p: any) => p.name === 'Amara Johnson') as any
    const response = `You're currently on Week ${avgWeek} of the 20-week TEL TED programme. Your ${neliPupils.length} TEL TED students have completed an average of ${avgSessions} sessions out of ${avgExpected} expected at this point. Amara is slightly behind at ${amara?.neliSessions || 78} sessions — you might want to schedule an extra individual session this week.`
    return { handled: true, response }
  }

  // COMMAND 4 — Andrew Mendoza easter egg
  if (/andrew\s*mendoza|what\s*do\s*you\s*think\s*of\s*andrew|tell\s*me\s*about\s*andrew|who\s*is\s*andrew/i.test(t)) {
    const response = "Andrew Mendoza... hmm, let me think. I know a few Andrews. If you mean Andrew Mendoza, then I only have good words. Top man. Knows his stuff. Good looking too — I probably should stop there in case he's listening. I'm starting to blush."
    return { handled: true, response, isAndrew: true }
  }

  return null
}

// Chunked speech — avoids Chrome's ~200 char cutoff bug by splitting into short lines
function speakChunked(lines: string[], index: number = 0, delays?: number[]) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  if (index >= lines.length) return
  const voices = window.speechSynthesis.getVoices()
  const preferred = ['Google UK English Female', 'Microsoft Sonia Online (Natural) - en-GB']
  const voice = preferred.reduce<SpeechSynthesisVoice | null>((found, name) => found || voices.find(v => v.name === name) || null, null)
    || voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en')) || null
  const utterance = new SpeechSynthesisUtterance(lines[index])
  if (voice) utterance.voice = voice
  utterance.rate = 0.9
  utterance.pitch = 1.0
  utterance.lang = 'en-GB'
  utterance.onend = () => {
    const delay = delays?.[index] ?? 150
    setTimeout(() => speakChunked(lines, index + 1, delays), delay)
  }
  window.speechSynthesis.speak(utterance)
}

// Split long text into sentence-sized chunks for reliable playback
function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const lines = text.split(/(?<=\.)\s+/).filter(l => l.trim())
  setTimeout(() => speakChunked(lines), 100)
}

// ─── Voice Toast Component ───────────────────────────────────────────────────

function VoiceToast({ toast, onDismiss }: { toast: VoiceToastData | null; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (toast) {
      setExiting(false)
      // Small delay so the animation triggers
      requestAnimationFrame(() => setVisible(true))
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => dismiss(), 8000)
    } else {
      setVisible(false)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast])

  function dismiss() {
    setExiting(true)
    setTimeout(() => { setVisible(false); onDismiss() }, 300)
  }

  if (!toast || !visible) return null

  const isAndrew = toast.isAndrew
  const borderColor = isAndrew ? '#C8960C' : '#C8960C'
  const bgColor = isAndrew ? 'linear-gradient(135deg, #1B3060 0%, #0C1A2E 100%)' : '#0C1A2E'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9998,
        maxWidth: 420,
        width: '100%',
        borderRadius: 16,
        borderLeft: `4px solid ${borderColor}`,
        background: bgColor,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        padding: '16px 20px',
        transform: exiting ? 'translateX(120%)' : (visible ? 'translateX(0)' : 'translateX(120%)'),
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{isAndrew ? '😊' : '🎙️'}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#C8960C', letterSpacing: '0.04em' }}>Lumio</span>
          {isAndrew && <span style={{ fontSize: 10, color: '#FBBF24', fontStyle: 'italic' }}>special response</span>}
        </div>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
          <X size={14} />
        </button>
      </div>
      <p style={{ fontSize: 14, color: 'white', margin: 0, lineHeight: 1.7, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {toast.text}
      </p>
    </div>
  )
}

// ─── US Market text replacements ──────────────────────────────────────────────
function usify(text: string): string {
  return text
    .replace(/\bReception\b/g, 'Kindergarten')
    .replace(/\bYear 1\b/g, '1st Grade')
    .replace(/\bTeaching Assistant\b/g, 'Paraprofessional')
    .replace(/\bSENCO\b/g, 'Special Education Coordinator')
    .replace(/\bOfsted\b/g, 'State Inspection')
    .replace(/\bELG\b/g, 'Early Learning Standards')
    .replace(/\bParkside Primary\b/g, 'Parkside Elementary')
    .replace(/\bOak Valley MAT\b/g, 'Oak Valley District')
    .replace(/\bMrs S\. Mitchell\b/g, 'Ms S. Mitchell')
    .replace(/\bNELI Lead\b/g, 'TEL TED Coordinator')
    .replace(/\bNELI Pupil/g, 'TEL TED Student')
    .replace(/\bNELI Tracker\b/g, 'TEL TED Tracker')
    .replace(/\bNELI Programme\b/g, 'TEL TED: NELI Intervention')
    .replace(/\bNuffield Early Language Intervention\b/g, 'TEL TED: NELI Intervention')
    .replace(/\bDfE Funded\b/g, 'EEF 5/5 Evidence Rating')
    .replace(/\bFSM\b/g, 'FRL')
    .replace(/\bFree School Meals\b/g, 'Free & Reduced Lunch')
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLAPSED_W = 48
const EXPANDED_W = 200

const BG_GRADIENTS = [
  'from-teal-950/80 via-emerald-950/90 to-cyan-950',
  'from-emerald-950 via-teal-950/80 to-cyan-950/90',
  'from-cyan-950 via-emerald-950/80 to-teal-950/90',
  'from-teal-950/90 via-cyan-950 to-emerald-950/80',
  'from-emerald-950/80 via-cyan-950/90 to-teal-950',
  'from-cyan-950/90 via-teal-950 to-emerald-950/80',
  'from-teal-950 via-emerald-950/90 to-cyan-950/80',
]

const QUOTES = [
  { text: "Every child deserves a champion.", author: "Rita Pierson" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Children must be taught how to think, not what to think.", author: "Margaret Mead" },
  { text: "A good teacher can inspire hope and ignite the imagination.", author: "Brad Henry" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
]

const OPENING_LINES = [
  "Today is going to be a great day — here's your morning roundup.",
  "Rise and shine! Let's see what today has in store for you.",
  "Good things are coming today — let's get into it.",
  "You've got this. Here's everything you need to hit the ground running.",
]

const CLOSING_LINES = [
  "Have a brilliant day — you're making a difference to every child in that building.",
  "Go get 'em. Today's going to be a great one.",
  "Make today count — the kids are lucky to have you.",
]

// ─── Sidebar nav items ───────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  { section: null,     id: 'overview',     label: 'Overview',           icon: LayoutDashboard },
  { section: null,     id: 'insights',     label: 'Insights',           icon: TrendingUp },
  { section: null,     id: 'district',     label: 'District Overview',  icon: Building2 },
  { section: null,     id: 'staff',        label: 'Staff Management',   icon: Users },
  { section: null,     id: 'send-dsl',     label: 'SEND & DSL',        icon: UserCheck },
  { section: null,     id: 'safeguarding', label: 'Safeguarding',       icon: Shield },
  { section: null,     id: 'wraparound',   label: 'Pre & After School', icon: Clock },
  { section: null,     id: 'inspection',   label: 'Inspection Mode',    icon: ClipboardList },
  { section: null,     id: 'rostering',    label: 'Rostering',          icon: Calendar },
  { section: null,     id: 'missync',      label: 'MIS Sync',           icon: Database },
  { section: 'Tools',  id: 'workflows',    label: 'Workflows',          icon: GitBranch },
  { section: null,     id: 'reports',      label: 'Reports',            icon: FileText },
  { section: null,     id: 'settings',     label: 'Settings',           icon: Settings },
]

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'today',         label: 'Today',                   icon: '📅' },
  { id: 'languagescreen', label: 'LanguageScreen & TEL TED', icon: '🔍' },
  { id: 'insights',      label: 'Insights',                icon: '📊' },
  { id: 'reports',       label: 'Reports',                 icon: '📋' },
  { id: 'classes',       label: 'Classes',                 icon: '👥' },
  { id: 'training',      label: 'TEL TED Training',        icon: '🎓' },
  { id: 'telted',        label: 'TEL TED Learning',        icon: '📖' },
  { id: 'resources',     label: 'Resources',               icon: '📁' },
  { id: 'attendance',    label: 'Attendance',               icon: '✅' },
  { id: 'dont-miss',     label: "Don't Miss",              icon: '🔴' },
  { id: 'staff-tab',     label: 'Staff',                   icon: '👥' },
]

// ─── Quick actions ───────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Assess Student',      icon: '📝', color: '#D97706', action: 'assess' },
  { label: 'Student Report',      icon: '📄', color: '#0D9488', action: 'report' },
  { label: 'Class Report',        icon: '📊', color: '#0D9488', action: 'report' },
  { label: 'School Report',       icon: '🏫', color: '#0D9488', action: 'report' },
  { label: 'Add Teacher',         icon: '👤', color: '#3B82F6', action: 'add' },
  { label: 'Add Student',         icon: '➕', color: '#3B82F6', action: 'add' },
  { label: 'Test LanguageScreen', icon: '🧪', color: '#B45309', action: 'test' },
]

// ─── TEL TED Schedule data ───────────────────────────────────────────────────

const TELTED_SCHEDULE = [
  { id: '1', title: 'Group Session 1A',                 time: '08:30', duration: '30 min', type: '5 students: Amara, Leon, Fatima, Kai, Zahra', status: 'done' },
  { id: '2', title: 'Individual Session — Amara Johnson', time: '09:15', duration: '15 min', type: '1:1', status: 'now' },
  { id: '3', title: 'Individual Session — Leon Carter',  time: '10:00', duration: '15 min', type: '1:1', status: 'upcoming' },
  { id: '4', title: 'Group Session 1B',                 time: '11:30', duration: '30 min', type: '4 students', status: 'upcoming' },
  { id: '5', title: 'LanguageScreen Assessment — Ruby Taylor', time: '14:00', duration: '10 min', type: 'assessment', status: 'upcoming' },
  { id: '6', title: 'Parent Call — Johnson family',     time: '15:00', duration: '20 min', type: 'parent', status: 'upcoming' },
]

// ─── TEL TED Overview items ──────────────────────────────────────────────────

const OVERVIEW_ITEMS = [
  { id: 'assessments', icon: '📋', label: 'LanguageScreen Assessments', count: 4, urgent: true, color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)',
    messages: [{ id: 'a1', from: 'Assessment System', avatar: 'AS', subject: '4 students not yet assessed this term', preview: 'Students due for LanguageScreen reassessment: Ruby Taylor, Oscar Nguyen, Lily Green, Oliver Park.', time: 'Today', urgent: true, read: false }] },
  { id: 'sessions', icon: '📖', label: 'TEL TED Sessions', count: 12, urgent: false, color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)',
    messages: [{ id: 's1', from: 'Session Tracker', avatar: 'ST', subject: '12 of 15 expected sessions completed this week', preview: 'Group 1A: 4/5 sessions done. Group 1B: 3/5 done. Individual catch-ups: 5/5 done.', time: 'This week', urgent: false, read: false }] },
  { id: 'atrisk', icon: '⚠️', label: 'At-Risk Students', count: 2, urgent: true, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
    messages: [{ id: 'r1', from: 'Progress Monitoring', avatar: 'PM', subject: '2 students scoring below threshold', preview: 'Amara Johnson (80) and Leon Carter (85) — both below age-expected standard of 90. Review intervention plan recommended.', time: 'Today', urgent: true, read: false }] },
  { id: 'progress', icon: '📈', label: 'TEL TED Progress', count: 17, urgent: false, color: '#15803D', bg: 'rgba(21,128,61,0.08)', border: 'rgba(21,128,61,0.2)',
    messages: [{ id: 'p1', from: 'TEL TED Tracker', avatar: 'TT', subject: 'Week 17 — 80% on track', preview: '4 out of 5 TEL TED students are on track for expected progress. Amara Johnson needs additional support.', time: 'This week', urgent: false, read: false }] },
  { id: 'comms', icon: '✉️', label: 'Parent Comms', count: 3, urgent: false, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)',
    messages: [{ id: 'c1', from: 'Parent System', avatar: 'PS', subject: '3 outstanding parent updates', preview: 'Johnson family (overdue), Carter family (due this week), Al-Hassan family (due this week).', time: 'This week', urgent: false, read: false }] },
]

// ─── AI Highlights ───────────────────────────────────────────────────────────

const AI_HIGHLIGHTS = [
  '5 students have group sessions today — Amara is due for her week 17 individual session',
  'Amara Johnson scored below threshold last assessment — review recommended',
  'Leon Carter has completed 82% of expected TEL TED sessions this term',
  '3 students have not been assessed with LanguageScreen this term',
  'Group Session 1A materials: Week 17 Special Words — journey, explore, discover',
]

// ─── Demo photos ─────────────────────────────────────────────────────────────

const DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop',
]

// ─── World Clock ─────────────────────────────────────────────────────────────

function WorldClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  const zones = [
    { label: 'New York', tz: 'America/New_York' },
    { label: 'London', tz: 'Europe/London' },
    { label: 'Chicago', tz: 'America/Chicago' },
    { label: 'LA', tz: 'America/Los_Angeles' },
  ]
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3" style={{ minWidth: 160 }}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {zones.map(z => (
          <div key={z.label} className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-black text-white">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: z.tz, hour12: false })}</span>
            <span className="text-xs" style={{ color: 'rgba(94,234,212,0.6)' }}>{z.label}</span>
          </div>
        ))}
      </div>
      <div className="text-xs mt-1" style={{ color: '#FBBF24' }}>World Clock</div>
    </div>
  )
}

// ─── Photo Frame ─────────────────────────────────────────────────────────────

function PhotoFrame() {
  const [photos] = useState<string[]>(DEMO_PHOTOS)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [intervalSecs, setIntervalSecs] = useState(5)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && photos.length > 1) intervalRef.current = setInterval(() => setCurrentIdx(i => (i + 1) % photos.length), intervalSecs * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, photos.length, intervalSecs])
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', minHeight: 240 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2"><span className="text-base">🖼️</span><span className="font-bold text-sm" style={{ color: '#F9FAFB' }}>Photo Frame</span></div>
        {photos.length > 1 && <button onClick={() => setIsPlaying(p => !p)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isPlaying ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: isPlaying ? '#0D9488' : '#6B7280' }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>}
      </div>
      <div className="flex-1 relative mx-4 mb-2 rounded-xl overflow-hidden" style={{ minHeight: 150 }}>
        <img src={photos[currentIdx]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        {photos.length > 1 && (<>
          <button onClick={() => setCurrentIdx(i => (i - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'‹'}</button>
          <button onClick={() => setCurrentIdx(i => (i + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center" style={{ width: 24, height: 24, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>{'›'}</button>
        </>)}
        <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#D1D5DB' }}>{currentIdx + 1} / {photos.length}</div>
      </div>
      {photos.length > 1 && <div className="px-4 pb-3 flex items-center gap-2"><span className="text-xs" style={{ color: '#6B7280' }}>Speed:</span>{[3,5,10,30].map(s => <button key={s} onClick={() => setIntervalSecs(s)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: intervalSecs === s ? 'rgba(13,148,136,0.15)' : 'rgba(255,255,255,0.05)', color: intervalSecs === s ? '#0D9488' : '#6B7280' }}>{s}s</button>)}</div>}
    </div>
  )
}

// ─── TEL TED AI Summary ──────────────────────────────────────────────────────

function TelTedAIPanel() {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dayLabel = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #0D9488' }}>
      <button className="flex w-full items-center justify-between px-5 py-4" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: open ? '1px solid rgba(13,148,136,0.3)' : undefined }} onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>TEL TED AI Summary</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#2DD4BF' }}>{dayLabel}</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#0D9488' }} /> : <ChevronDown size={14} style={{ color: '#0D9488' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ backgroundColor: '#0f0e17', maxHeight: '12rem' }}>
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

// ─── TEL TED Schedule ────────────────────────────────────────────────────────

function TelTedSchedule() {
  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>📅 TEL TED Schedule</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{TELTED_SCHEDULE.length} items</span>
      </div>
      <div className="space-y-1">
        {TELTED_SCHEDULE.map(m => (
          <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ opacity: m.status === 'done' ? 0.4 : 1 }}>
            <div className="text-center flex-shrink-0 w-12">
              <div className="text-sm font-bold" style={{ color: '#E5E7EB' }}>{m.time}</div>
              <div className="text-xs" style={{ color: '#6B7280' }}>{m.duration}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: m.status === 'done' ? '#6B7280' : '#F9FAFB', textDecoration: m.status === 'done' ? 'line-through' : 'none' }}>{m.title}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{m.type}</p>
            </div>
            {m.status === 'now' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TEL TED Overview (accordion) ────────────────────────────────────────────

function TelTedOverview() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="rounded-2xl p-5 h-full" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>🦉 TEL TED Overview</h3>
        <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
      </div>
      <div className="space-y-2">
        {OVERVIEW_ITEMS.map(item => {
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
              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {item.messages.map(msg => (
                    <div key={msg.id} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', opacity: msg.read ? 0.7 : 1 }}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: item.color + '22', color: item.color }}>{msg.avatar}</div>
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
                      <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{msg.preview}</p>
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

// ─── Greeting Banner ─────────────────────────────────────────────────────────

function GreetingBanner({ onVoiceToast }: { onVoiceToast?: (toast: VoiceToastData) => void }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const [bg] = useState(() => BG_GRADIENTS[new Date().getDay()])
  const { speak, stop, isPlaying } = useElevenLabsTTS()
  const { isListening, lastCommand, startListening, stopListening } = useVoiceCommands()
  const [quote, setQuote] = useState(QUOTES[0])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })

  useEffect(() => { const start = new Date(new Date().getFullYear(), 0, 1).getTime(); const dayOfYear = Math.floor((Date.now() - start) / 86400000); setQuote(QUOTES[dayOfYear % QUOTES.length]) }, [])
  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  function handleBriefing() {
    if (isPlaying) { stop(); return }
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const openingLine = OPENING_LINES[dayOfYear % OPENING_LINES.length]
    const closingLine = CLOSING_LINES[dayOfYear % CLOSING_LINES.length]
    const script = `${greeting}, Sarah. ${openingLine} You have 6 TEL TED sessions today. 2 students need attention. Amara Johnson is due for her week 17 individual session. ${closingLine}`
    speak(script)
  }

  useEffect(() => {
    if (!lastCommand) return
    const { command, action, response } = lastCommand

    // Try TEL TED-specific commands first
    const telted = processTelTedCommand(command)
    if (telted?.handled) {
      // Show toast
      onVoiceToast?.({ text: telted.response, isAndrew: telted.isAndrew })

      // Speak — Andrew gets the chunked pause effect
      if (telted.isAndrew) {
        const andrewLines = [
          "Andrew Mendoza...",
          "Hmm, let me think. I know a few Andrews.",
          "If you mean Andrew Mendoza, then I only have good words.",
          "Top man.",
          "Knows his stuff.",
          "Good looking too —",
          "I probably should stop there in case he is listening.",
          "I am starting to blush.",
        ]
        // 600ms pause before "If you mean Andrew Mendoza" (index 2), 150ms elsewhere
        const delays = [150, 150, 600, 150, 150, 150, 150, 150]
        window.speechSynthesis.cancel()
        setTimeout(() => speakChunked(andrewLines, 0, delays), 100)
      } else {
        speakText(telted.response)
      }
      return
    }

    // Fall back to generic commands
    if (action === 'UNKNOWN') {
      const catchAll = `I heard you say "${command}". I'm not sure how to help with that yet, but I'm learning. Try asking me about your TEL TED sessions, student assessments, or programme progress.`
      onVoiceToast?.({ text: catchAll })
      speakText(catchAll)
      return
    }

    speakText(response)
    if (action === 'PLAY_BRIEFING') setTimeout(() => handleBriefing(), 1500)
    else if (action === 'STOP_AUDIO') stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand])

  return (
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', pointerEvents: 'none', borderRadius: 'inherit' }} />
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-600 rounded-full opacity-10 blur-3xl" />
      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, Sarah Mitchell 👋</h1>
              <button onClick={handleBriefing} title="Text-to-Speech" className="flex items-center justify-center rounded-lg transition-all"
                style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: isPlaying ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.08)', border: isPlaying ? '1px solid rgba(13,148,136,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isPlaying ? '#2DD4BF' : '#9CA3AF', animation: isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
                <Volume2 size={15} strokeWidth={1.75} />
              </button>
              <button onClick={() => isListening ? stopListening() : startListening()} title={isListening ? 'Listening...' : "Voice Commands"}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer', backgroundColor: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', border: isListening ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: isListening ? '#EF4444' : '#F9FAFB', animation: isListening ? 'pulse 1.5s infinite' : 'none' }}>
                <Mic size={14} strokeWidth={1.75} />
              </button>
            </div>
            <p className="text-teal-300 text-sm mb-2">{date}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>● EEF 5/5 Evidence Rating</span>
            </div>
            <p style={{ color: '#FBBF24' }} className="text-sm italic">&ldquo;{quote.text}&rdquo; &mdash; {quote.author}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Students', value: 423, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '👨‍🎓' },
              { label: 'Staff', value: 41, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👥' },
              { label: 'Alerts', value: 3, color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🔴' },
              { label: 'Reports', value: 2, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '📋' },
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
                <div className="text-xs text-teal-300">{weather.condition}</div>
              </div>
            </div>
            <WorldClock />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TEL TED Digital Resource Library + Resources Wrapper ────────────────────

const NELI_INTERVENTION_RESOURCES = [
  { icon: '🃏', title: 'Part 1 Flashcards', desc: 'Vocabulary flashcard set for TEL TED Part 1 sessions — 10 topic areas including My Body, Things We Wear, People Who Help Us', badge: 'Digital Resource', badgeColor: '#0D9488', date: '23/09/2024', accent: '#F97316' },
  { icon: '📖', title: 'Part 1 Teacher Guide', desc: 'Complete delivery guide for TEL TED Part 1 (Weeks 1–10). Includes session plans, vocabulary lists, activity instructions and assessment guidance', badge: 'Teacher Guide', badgeColor: '#1B3060', date: '23/09/2024', accent: '#F97316' },
  { icon: '🃏', title: 'Part 2 Flashcards', desc: 'Vocabulary flashcard set for TEL TED Part 2 sessions — builds on Part 1 with advanced vocabulary and narrative content', badge: 'Digital Resource', badgeColor: '#0D9488', date: '23/09/2024', accent: '#DC2626' },
  { icon: '📖', title: 'Part 2 Teacher Guide', desc: 'Complete delivery guide for TEL TED Part 2 (Weeks 11–20). Covers phonological awareness, letter sounds, and advanced narrative activities', badge: 'Teacher Guide', badgeColor: '#1B3060', date: '23/09/2024', accent: '#DC2626' },
]

const WHOLE_CLASS_RESOURCES = [
  { icon: '📝', title: 'Activity Sheets', desc: 'Printable activity sheets for whole-class TEL TED sessions. Student-facing worksheets for vocabulary and narrative activities', badge: 'Student Resources', badgeColor: '#15803D' },
  { icon: '💻', title: 'Digital Slides', desc: 'Presentation slides covering all 6 topic areas: My Body, Things We Wear, People Who Help Us, Growing, Journey, Time. Ready to display on your classroom screen', badge: 'Digital Slides', badgeColor: '#2563EB' },
  { icon: '🎴', title: 'Narrative Sequence Cards', desc: 'Visual story sequence cards for developing narrative skills. Children arrange cards to tell and retell stories', badge: 'Teaching Aid', badgeColor: '#C8960C' },
  { icon: '🎵', title: 'Song Files', desc: 'Audio song files for TEL TED whole-class sessions. Vocabulary songs for each topic area. MP3 format, ready to play', badge: 'Audio Resource', badgeColor: '#7C3AED', actionLabel: 'Play / Download' },
  { icon: '📚', title: 'Story Files', desc: "Digital story books including 'The Dinosaur Park' and other whole-class story titles. Full colour illustrations featuring Ted the Bear", badge: 'Story Books', badgeColor: '#B45309' },
  { icon: '📖', title: 'Teacher Guide', desc: 'Complete whole-class programme delivery guide. Session structure, differentiation strategies, assessment guidance and programme overview', badge: 'Teacher Guide', badgeColor: '#1B3060' },
  { icon: '📋', title: 'Template Planning & Record Sheet', desc: 'Blank planning and record templates. TEL TED Whole Class planning and record sheet — print and complete for each session', badge: 'Planning Template', badgeColor: '#0E7490' },
]

function TelTedResourcesWrapper() {
  const [previewResource, setPreviewResource] = useState<{ title: string; accent: string } | null>(null)

  function ResourceCard({ icon, title, desc, badge: badgeText, badgeColor, date, accent, actionLabel, accentBorder }: {
    icon: string; title: string; desc: string; badge: string; badgeColor: string; date?: string; accent?: string; actionLabel?: string; accentBorder: string
  }) {
    return (
      <div className="rounded-xl overflow-hidden transition-all hover:-translate-y-0.5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderTop: `3px solid ${accentBorder}` }}>
        <div className="p-5">
          <div className="text-3xl mb-3 text-center">{icon}</div>
          <h4 className="text-sm font-bold mb-1.5" style={{ color: '#F9FAFB' }}>{title}</h4>
          <p className="text-xs leading-relaxed mb-3" style={{ color: '#9CA3AF' }}>{desc}</p>
          <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full mb-2" style={{ backgroundColor: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40` }}>{badgeText}</span>
          {date && <p className="text-[10px]" style={{ color: '#4B5563' }}>Created: {date}</p>}
        </div>
        <button onClick={() => setPreviewResource({ title, accent: accent || accentBorder })} className="w-full py-2.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: 'none', borderTop: '1px solid #1F2937', cursor: 'pointer' }}>
          {actionLabel || 'View Resource'}
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* TEL TED Digital Resource Library */}
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xl">📚</span>
          <h2 className="text-lg font-bold" style={{ color: '#F9FAFB', fontFamily: 'Georgia,serif' }}>TEL TED Digital Resource Library</h2>
        </div>
        <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>Official digital resources from OxEd & Assessment · University of Oxford · CPD Certified</p>

        {/* Sub-section 1: NELI Intervention */}
        <div className="rounded-xl p-5 mb-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderLeft: '4px solid #0D9488' }}>
          <div className="flex items-center gap-2 mb-1">
            <span>📁</span>
            <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>TEL TED: NELI Intervention</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Targeted small-group intervention resources for students with language difficulties</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {NELI_INTERVENTION_RESOURCES.map(r => <ResourceCard key={r.title} {...r} accentBorder="#0D9488" />)}
          </div>
        </div>

        {/* Sub-section 2: Whole Class */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', borderLeft: '4px solid #15803D' }}>
          <div className="flex items-center gap-2 mb-1">
            <span>📁</span>
            <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>TEL TED: Whole Class</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Whole-class language enrichment resources for all students</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {WHOLE_CLASS_RESOURCES.map(r => <ResourceCard key={r.title} {...r} accentBorder="#15803D" />)}
          </div>
        </div>
      </div>

      {/* Original Resources component with TEL TED branding */}
      <Resources isTelTed />

      {/* Resource preview modal */}
      {previewResource && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPreviewResource(null)}>
          <div className="rounded-2xl overflow-hidden" style={{ width: 520, maxWidth: '90vw', backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            {/* Branded header bar */}
            <div style={{ background: `linear-gradient(135deg, #15803D, ${previewResource.accent})`, padding: '20px 24px', position: 'relative' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>🐻</div>
                  <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>TEL TED</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>OxEd & Assessment</span>
                  <button onClick={() => setPreviewResource(null)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold" style={{ color: '#fff', fontFamily: 'Georgia,serif' }}>{previewResource.title}</h3>
            </div>
            {/* Content */}
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-sm mb-1" style={{ color: '#F9FAFB' }}>This resource is available to download from your TEL TED resource portal</p>
              <p className="text-xs mb-6" style={{ color: '#6B7280' }}>Full-colour, print-ready PDF with TEL TED and OxEd & Assessment branding</p>
              <div className="flex justify-center gap-3">
                <a href="https://resource.oxedandassessment.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff', textDecoration: 'none' }}>Open in Resource Portal</a>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1F2937', color: '#F9FAFB', border: 'none', cursor: 'pointer' }}>Download PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Coming Soon ─────────────────────────────────────────────────────────────

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.1)' }}>
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{title}</h2>
      <p className="text-sm text-center max-w-md" style={{ color: '#6B7280' }}>This section is coming soon as part of the TEL TED platform.</p>
    </div>
  )
}

// ─── TEL TED Settings ───────────────────────────────────────────────────────

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']

const SETTINGS_TABS = [
  { id: 'profile', label: 'School Profile', icon: '🏫' },
  { id: 'sso', label: 'Single Sign-On (SSO)', icon: '🔐' },
  { id: 'rostering', label: 'Rostering', icon: '📋' },
  { id: 'voice', label: 'Voice & Audio', icon: '🎙️' },
  { id: 'users', label: 'Staff & Users', icon: '👤' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'integrations', label: 'Integrations', icon: '🔗' },
  { id: 'privacy', label: 'Data & Privacy', icon: '🛡️' },
] as const

const VOICE_OPTIONS = [
  { id: 'browser', name: 'Default Browser Voice', desc: 'Free — uses your browser\'s built-in speech synthesis', premium: false, voiceId: '' },
  { id: 'rachel', name: 'Rachel', desc: 'Warm, professional female voice', premium: true, voiceId: 'rachel' },
  { id: 'josh', name: 'Josh', desc: 'Clear, authoritative male voice', premium: true, voiceId: 'josh' },
  { id: 'bella', name: 'Bella', desc: 'Friendly, approachable female voice', premium: true, voiceId: 'bella' },
  { id: 'dallin', name: 'Dallin', desc: 'Confident male voice, great for summaries', premium: true, voiceId: 'alFofuDn3cOwyoz1i44T' },
  { id: 'vincent', name: 'Vincent', desc: 'Deep, calm male voice', premium: true, voiceId: 'Qe9WSybioZxssVEwlBSo' },
  { id: 'jessica', name: 'Jessica', desc: 'Energetic, warm female voice', premium: true, voiceId: 'flHkNRp1BlvT73UL6gyz' },
]

const SETTINGS_STAFF = [
  { name: 'Sarah Mitchell', role: 'TEL TED Coordinator', email: 'sarah@parkside.edu', access: 'Admin' },
  { name: 'James Okafor', role: 'Paraprofessional', email: 'james@parkside.edu', access: 'Staff' },
  { name: 'Hannah Brooks', role: 'Kindergarten Teacher', email: 'hannah@parkside.edu', access: 'Teacher' },
  { name: 'David Chen', role: 'Special Ed Coordinator', email: 'david@parkside.edu', access: 'SENCO' },
]

function TelTedSettings() {
  const [activeTab, setActiveTab] = useState<string>('profile')
  const [toast, setToast] = useState('')

  // Profile state
  const [schoolName, setSchoolName] = useState('Parkside Elementary')
  const [district, setDistrict] = useState('Oak Valley District')
  const [state, setState] = useState('Texas')
  const [grades, setGrades] = useState<string[]>(['Pre-K', 'K', '1', '2'])
  const [principal, setPrincipal] = useState('')
  const [coordinator, setCoordinator] = useState('Sarah Mitchell')
  const [academicYear, setAcademicYear] = useState('2025-26')

  // SSO state
  const [googleExpanded, setGoogleExpanded] = useState(false)
  const [msExpanded, setMsExpanded] = useState(false)
  const [googleDomain, setGoogleDomain] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleSecret, setGoogleSecret] = useState('')
  const [showGoogleSecret, setShowGoogleSecret] = useState(false)
  const [azureTenant, setAzureTenant] = useState('')
  const [azureClientId, setAzureClientId] = useState('')
  const [azureSecret, setAzureSecret] = useState('')
  const [showAzureSecret, setShowAzureSecret] = useState(false)
  const [ssoTesting, setSsoTesting] = useState(false)
  const [ssoSuccess, setSsoSuccess] = useState(false)

  // Rostering state
  const [rosterUrl, setRosterUrl] = useState('')
  const [rosterClientId, setRosterClientId] = useState('')
  const [rosterSecret, setRosterSecret] = useState('')
  const [rosterFreq, setRosterFreq] = useState('Daily')
  const [cleverConnecting, setCleverConnecting] = useState(false)
  const [cleverConnected, setCleverConnected] = useState(false)

  // Voice state
  const [selectedVoice, setSelectedVoice] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('telted-voice-preference') || 'browser' : 'browser')
  const [speakRate, setSpeakRate] = useState(0.9)
  const [speakPitch, setSpeakPitch] = useState(1.0)
  const [speakVolume, setSpeakVolume] = useState(1.0)
  const [wakeWord, setWakeWord] = useState('Lumio')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [audioResponses, setAudioResponses] = useState(true)
  const [showTextCard, setShowTextCard] = useState(true)
  const [autoListen, setAutoListen] = useState(false)

  // Notifications state
  const [dailySummary, setDailySummary] = useState(true)
  const [atRiskAlerts, setAtRiskAlerts] = useState(true)
  const [sessionReminders, setSessionReminders] = useState(true)
  const [assessmentReminders, setAssessmentReminders] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [parentReminders, setParentReminders] = useState(false)
  const [notifEmail, setNotifEmail] = useState('sarah@parkside.edu')
  const [quietFrom, setQuietFrom] = useState('19:00')
  const [quietTo, setQuietTo] = useState('07:00')

  // Integrations state
  const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, boolean>>({ languagescreen: true })
  const [connectingIntegration, setConnectingIntegration] = useState<string | null>(null)

  // Invite state
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Teacher')
  const [inviteAccess, setInviteAccess] = useState('Teacher')
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function fireToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function handleSelectVoice(id: string) {
    setSelectedVoice(id)
    localStorage.setItem('telted-voice-preference', id)
    fireToast(`Voice set to ${VOICE_OPTIONS.find(v => v.id === id)?.name}`)
  }

  function previewVoice(id: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance("Hello, I'm your TEL TED assistant. I'm here to help you track student progress.")
    u.rate = speakRate; u.pitch = speakPitch; u.volume = speakVolume; u.lang = 'en-GB'
    if (id !== 'browser') {
      const voices = window.speechSynthesis.getVoices()
      const preferred = ['Google UK English Female', 'Microsoft Sonia Online (Natural) - en-GB']
      const voice = preferred.reduce<SpeechSynthesisVoice | null>((f, n) => f || voices.find(v => v.name === n) || null, null)
        || voices.find(v => v.lang === 'en-GB') || null
      if (voice) u.voice = voice
    }
    window.speechSynthesis.speak(u)
  }

  function testCurrentSettings() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance("Top man. Knows his stuff.")
    u.rate = speakRate; u.pitch = speakPitch; u.volume = speakVolume; u.lang = 'en-GB'
    window.speechSynthesis.speak(u)
  }

  function mockConnectIntegration(key: string) {
    setConnectingIntegration(key)
    setTimeout(() => {
      setConnectedIntegrations(prev => ({ ...prev, [key]: true }))
      setConnectingIntegration(null)
      fireToast(`${key} connected successfully`)
    }, 2000)
  }

  // ── Shared styles ──
  const cardStyle: React.CSSProperties = { backgroundColor: '#111318', border: '1px solid #1F2937', borderRadius: 16, padding: '24px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#F9FAFB', fontSize: 14, outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }
  const goldBtn: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, backgroundColor: '#C8960C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
  const tealBtn: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, backgroundColor: '#0D9488', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
  const blueBtn: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, backgroundColor: '#2563EB', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
  const badge = (color: string, text: string) => <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>{text}</span>

  function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
    return (
      <label className="flex items-center gap-3 cursor-pointer py-2">
        <div onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? '#0D9488' : '#374151', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s' }} />
        </div>
        <span style={{ color: '#D1D5DB', fontSize: 14 }}>{label}</span>
      </label>
    )
  }

  // ── Tab: School Profile ──
  function ProfileTab() {
    const allGrades = ['Pre-K', 'K', '1', '2', '3', '4', '5']
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>School Profile</h2><p className="text-sm" style={{ color: '#6B7280' }}>Basic information about your school</p></div>
        <div style={cardStyle} className="space-y-5">
          <div><label style={labelStyle}>School Name</label><input style={inputStyle} value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label style={labelStyle}>District</label><input style={inputStyle} value={district} onChange={e => setDistrict(e.target.value)} /></div>
            <div><label style={labelStyle}>State</label><select style={{ ...inputStyle, appearance: 'auto' as any }} value={state} onChange={e => setState(e.target.value)}>{US_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div>
            <label style={labelStyle}>Grade Levels Served</label>
            <div className="flex flex-wrap gap-2">{allGrades.map(g => (
              <label key={g} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-sm" style={{ backgroundColor: grades.includes(g) ? 'rgba(13,148,136,0.15)' : '#0A0B10', border: `1px solid ${grades.includes(g) ? '#0D9488' : '#1F2937'}`, color: grades.includes(g) ? '#2DD4BF' : '#9CA3AF' }}>
                <input type="checkbox" className="hidden" checked={grades.includes(g)} onChange={() => setGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])} />{g}
              </label>
            ))}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label style={labelStyle}>Principal Name</label><input style={inputStyle} value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="Enter principal name" /></div>
            <div><label style={labelStyle}>TEL TED Coordinator</label><input style={inputStyle} value={coordinator} onChange={e => setCoordinator(e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Academic Year</label><select style={{ ...inputStyle, appearance: 'auto' as any, maxWidth: 200 }} value={academicYear} onChange={e => setAcademicYear(e.target.value)}><option>2025-26</option><option>2026-27</option></select></div>
        </div>
        <button style={goldBtn} onClick={() => fireToast('School profile saved')}>Save Profile</button>
      </div>
    )
  }

  // ── Tab: SSO ──
  function SsoTab() {
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Single Sign-On</h2><p className="text-sm" style={{ color: '#6B7280' }}>Allow staff to log in with their existing school accounts. No separate passwords needed.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Google */}
          <div style={cardStyle}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335)', color: '#fff' }}>G</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Google Workspace for Education</h3>
                <p className="text-xs" style={{ color: '#6B7280' }}>Staff sign in with their school Google accounts</p>
              </div>
              {badge('#F59E0B', 'Not configured')}
            </div>
            <button onClick={() => setGoogleExpanded(!googleExpanded)} className="text-xs font-medium mb-3" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{googleExpanded ? '▾ Hide fields' : '▸ Configure'}</button>
            {googleExpanded && (
              <div className="space-y-3 mt-2">
                <div><label style={labelStyle}>Google Workspace Domain</label><input style={inputStyle} value={googleDomain} onChange={e => setGoogleDomain(e.target.value)} placeholder="oakvalley.edu" /></div>
                <div><label style={labelStyle}>Client ID</label><input style={inputStyle} value={googleClientId} onChange={e => setGoogleClientId(e.target.value)} placeholder="Enter Client ID" /></div>
                <div><label style={labelStyle}>Client Secret</label><div className="relative"><input type={showGoogleSecret ? 'text' : 'password'} style={inputStyle} value={googleSecret} onChange={e => setGoogleSecret(e.target.value)} placeholder="Enter Client Secret" /><button onClick={() => setShowGoogleSecret(!showGoogleSecret)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>{showGoogleSecret ? 'Hide' : 'Show'}</button></div></div>
                <button style={blueBtn} onClick={() => fireToast('Google SSO configuration saved')}>Configure Google SSO</button>
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: '#4B5563' }}>Requires Google Workspace for Education account</p>
          </div>
          {/* Microsoft */}
          <div style={cardStyle}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(0,120,212,0.15)', border: '1px solid rgba(0,120,212,0.3)' }}>
                <div className="grid grid-cols-2 gap-0.5" style={{ width: 18, height: 18 }}><div style={{ backgroundColor: '#F25022', borderRadius: 1 }} /><div style={{ backgroundColor: '#7FBA00', borderRadius: 1 }} /><div style={{ backgroundColor: '#00A4EF', borderRadius: 1 }} /><div style={{ backgroundColor: '#FFB900', borderRadius: 1 }} /></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Microsoft 365 / Azure AD</h3>
                <p className="text-xs" style={{ color: '#6B7280' }}>Staff sign in with their Microsoft school accounts</p>
              </div>
              {badge('#F59E0B', 'Not configured')}
            </div>
            <button onClick={() => setMsExpanded(!msExpanded)} className="text-xs font-medium mb-3" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{msExpanded ? '▾ Hide fields' : '▸ Configure'}</button>
            {msExpanded && (
              <div className="space-y-3 mt-2">
                <div><label style={labelStyle}>Azure Tenant ID</label><input style={inputStyle} value={azureTenant} onChange={e => setAzureTenant(e.target.value)} placeholder="Enter Tenant ID" /></div>
                <div><label style={labelStyle}>Application (Client) ID</label><input style={inputStyle} value={azureClientId} onChange={e => setAzureClientId(e.target.value)} placeholder="Enter Client ID" /></div>
                <div><label style={labelStyle}>Client Secret</label><div className="relative"><input type={showAzureSecret ? 'text' : 'password'} style={inputStyle} value={azureSecret} onChange={e => setAzureSecret(e.target.value)} placeholder="Enter Client Secret" /><button onClick={() => setShowAzureSecret(!showAzureSecret)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>{showAzureSecret ? 'Hide' : 'Show'}</button></div></div>
                <button style={blueBtn} onClick={() => fireToast('Microsoft SSO configuration saved')}>Configure Microsoft SSO</button>
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: '#4B5563' }}>Requires Microsoft 365 Education subscription</p>
          </div>
        </div>
        {/* SSO benefits */}
        <div style={{ ...cardStyle, borderColor: '#C8960C40', background: 'linear-gradient(135deg, rgba(200,150,12,0.06), rgba(200,150,12,0.02))' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#C8960C' }}>SSO Benefits</p>
          <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>When SSO is enabled: Staff log in with one click using their existing school account. No forgotten passwords. No separate Lumio credentials. Works with Google Classroom and Microsoft Teams integrations.</p>
        </div>
        <button style={tealBtn} onClick={() => { setSsoTesting(true); setTimeout(() => { setSsoTesting(false); setSsoSuccess(true); setTimeout(() => setSsoSuccess(false), 3000) }, 2000) }}>{ssoTesting ? 'Testing...' : 'Test SSO Connection'}</button>
        {ssoSuccess && <p className="text-sm font-medium" style={{ color: '#22C55E' }}>✓ SSO connection successful. Staff can now log in with their Google/Microsoft accounts.</p>}
      </div>
    )
  }

  // ── Tab: Rostering ──
  function RosteringTab() {
    const compatibleSystems = ['Infinite Campus', 'PowerSchool', 'Skyward', 'Clever', 'ClassLink']
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Rostering</h2><p className="text-sm" style={{ color: '#6B7280' }}>Automatically sync your student and staff rosters from your district&apos;s systems.</p></div>
        <div className="space-y-4">
          {/* OneRoster */}
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-2"><h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>OneRoster (IMS Global Standard)</h3>{badge('#22C55E', 'Recommended')}</div>
            <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Automatically sync students, teachers, classes, and enrollments using the OneRoster 1.1 standard.</p>
            <div className="space-y-3">
              <div><label style={labelStyle}>OneRoster API URL</label><input style={inputStyle} value={rosterUrl} onChange={e => setRosterUrl(e.target.value)} placeholder="https://your-district.oneroster.com/api" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={labelStyle}>Client ID</label><input style={inputStyle} value={rosterClientId} onChange={e => setRosterClientId(e.target.value)} /></div>
                <div><label style={labelStyle}>Client Secret</label><input type="password" style={inputStyle} value={rosterSecret} onChange={e => setRosterSecret(e.target.value)} /></div>
              </div>
              <div><label style={labelStyle}>Sync Frequency</label><select style={{ ...inputStyle, appearance: 'auto' as any, maxWidth: 200 }} value={rosterFreq} onChange={e => setRosterFreq(e.target.value)}><option>Daily</option><option>Weekly</option><option>Manual</option></select></div>
              <button style={tealBtn} onClick={() => fireToast('OneRoster connection saved')}>Connect OneRoster</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">{compatibleSystems.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{s}</span>)}</div>
          </div>
          {/* Clever */}
          <div style={cardStyle}>
            <h3 className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>Clever</h3>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Sync via Clever&apos;s rostering platform. Common in US districts.</p>
            {cleverConnected ? badge('#22C55E', 'Connected') : <button style={{ ...tealBtn, backgroundColor: '#F26B21' }} onClick={() => { setCleverConnecting(true); setTimeout(() => { setCleverConnecting(false); setCleverConnected(true) }, 2000) }}>{cleverConnecting ? 'Connecting...' : 'Connect with Clever'}</button>}
            <p className="text-xs mt-2" style={{ color: '#4B5563' }}>Requires your district to have Clever configured</p>
          </div>
          {/* CSV */}
          <div style={cardStyle}>
            <h3 className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>CSV Import</h3>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Upload a CSV file of students and staff. Use this if your district doesn&apos;t support OneRoster or Clever.</p>
            <div className="flex gap-2">
              <button style={tealBtn} onClick={() => fireToast('Template downloaded')}>Download CSV Template</button>
              <button style={{ ...tealBtn, backgroundColor: '#374151' }} onClick={() => fireToast('Upload coming soon')}>Upload CSV</button>
            </div>
            <p className="text-xs mt-2" style={{ color: '#4B5563' }}>Accepted: .csv files with headers: name, grade, class, dob, ell_status, frl_status</p>
          </div>
        </div>
        {/* Sync status */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Sync Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><p className="text-xs" style={{ color: '#6B7280' }}>Last synced</p><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Never</p></div>
            <div><p className="text-xs" style={{ color: '#6B7280' }}>Next scheduled</p><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Not configured</p></div>
            <div><p className="text-xs" style={{ color: '#6B7280' }}>Students</p><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>28</p></div>
            <div><p className="text-xs" style={{ color: '#6B7280' }}>Staff</p><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>4</p></div>
          </div>
          <button style={{ ...tealBtn, marginTop: 16 }} onClick={() => fireToast('Sync initiated')}>Sync Now</button>
        </div>
      </div>
    )
  }

  // ── Tab: Voice & Audio ──
  function VoiceTab() {
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Voice & Audio Settings</h2><p className="text-sm" style={{ color: '#6B7280' }}>Customise how Lumio speaks to you. All voices use ElevenLabs or Web Speech API.</p></div>
        {/* Wake word */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Wake Word</h3>
          <div className="flex items-center gap-3">
            <input style={{ ...inputStyle, maxWidth: 200 }} value={wakeWord} onChange={e => setWakeWord(e.target.value)} />
            <button style={goldBtn} onClick={() => fireToast('Wake word saved')}>Save</button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#4B5563' }}>Say &quot;{wakeWord}&quot; followed by your question</p>
        </div>
        {/* Voice selection */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Choose Your Preferred Voice</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VOICE_OPTIONS.map(v => (
              <div key={v.id} className="rounded-xl p-4 cursor-pointer transition-all" onClick={() => handleSelectVoice(v.id)}
                style={{ backgroundColor: selectedVoice === v.id ? 'rgba(200,150,12,0.08)' : '#0A0B10', border: `1px solid ${selectedVoice === v.id ? '#C8960C' : '#1F2937'}` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{v.name}</span>
                    {v.premium && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: 'rgba(200,150,12,0.15)', color: '#C8960C' }}>Premium</span>}
                  </div>
                  {selectedVoice === v.id && <span style={{ color: '#C8960C', fontSize: 16 }}>✓</span>}
                </div>
                <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{v.desc}</p>
                <button onClick={(e) => { e.stopPropagation(); previewVoice(v.id) }} className="text-xs font-medium" style={{ color: '#0D9488', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>▶ Preview</button>
              </div>
            ))}
          </div>
        </div>
        {/* Speech settings */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Speech Settings</h3>
          <div className="space-y-4">
            <div><label style={labelStyle}>Speaking Rate: {speakRate.toFixed(1)}</label><input type="range" min="0.7" max="1.3" step="0.1" value={speakRate} onChange={e => setSpeakRate(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#0D9488' }} /></div>
            <div><label style={labelStyle}>Pitch: {speakPitch.toFixed(1)}</label><input type="range" min="0.8" max="1.2" step="0.1" value={speakPitch} onChange={e => setSpeakPitch(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#0D9488' }} /></div>
            <div><label style={labelStyle}>Volume: {speakVolume.toFixed(1)}</label><input type="range" min="0" max="1" step="0.1" value={speakVolume} onChange={e => setSpeakVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#0D9488' }} /></div>
            <button style={tealBtn} onClick={testCurrentSettings}>Test Current Settings</button>
          </div>
        </div>
        {/* Voice commands */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Voice Commands</h3>
          <div className="space-y-1">
            <Toggle on={voiceEnabled} onToggle={() => setVoiceEnabled(!voiceEnabled)} label="Voice commands enabled" />
            <Toggle on={audioResponses} onToggle={() => setAudioResponses(!audioResponses)} label="Play audio responses" />
            <Toggle on={showTextCard} onToggle={() => setShowTextCard(!showTextCard)} label="Show text response card alongside audio" />
            <Toggle on={autoListen} onToggle={() => setAutoListen(!autoListen)} label="Auto-listen after wake word detected" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>RECOGNISED COMMANDS</p>
            <div className="space-y-1">
              {[
                { cmd: '"TEL TED sessions today"', desc: 'Lists today\'s scheduled sessions' },
                { cmd: '"Language Screen / who needs assessing"', desc: 'Students due for LanguageScreen' },
                { cmd: '"What week are we on"', desc: 'Current programme week & progress' },
                { cmd: '"What do you think of Andrew" 😄', desc: 'Easter egg' },
              ].map(c => (
                <div key={c.cmd} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ backgroundColor: '#0A0B10' }}>
                  <code className="text-xs" style={{ color: '#2DD4BF' }}>{c.cmd}</code>
                  <span className="text-xs" style={{ color: '#4B5563' }}>— {c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Tab: Staff & Users ──
  function UsersTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Staff & Users</h2><p className="text-sm" style={{ color: '#6B7280' }}>Manage who has access to the TEL TED portal</p></div>
          <button style={tealBtn} onClick={() => setShowInviteModal(true)}>+ Invite Staff Member</button>
        </div>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Name', 'Role', 'Email', 'SSO Status', 'Access Level', 'Actions'].map(h => <th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{ color: '#6B7280' }}>{h}</th>)}
            </tr></thead>
            <tbody>{SETTINGS_STAFF.map((s, i) => (
              <tr key={i} style={{ borderBottom: i < SETTINGS_STAFF.length - 1 ? '1px solid #1F2937' : 'none' }}>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#F9FAFB' }}>{s.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{s.role}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{s.email}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#4B5563' }}>—</td>
                <td className="px-4 py-3">{badge(s.access === 'Admin' ? '#C8960C' : '#0D9488', s.access)}</td>
                <td className="px-4 py-3"><button className="text-xs" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}>Edit</button><button className="text-xs" style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ ...cardStyle, borderColor: '#1F293780' }}>
          <p className="text-xs" style={{ color: '#6B7280' }}><strong style={{ color: '#9CA3AF' }}>Admin:</strong> full access&ensp;|&ensp;<strong style={{ color: '#9CA3AF' }}>Teacher:</strong> classes + reports&ensp;|&ensp;<strong style={{ color: '#9CA3AF' }}>Staff:</strong> assessment + sessions only&ensp;|&ensp;<strong style={{ color: '#9CA3AF' }}>View only:</strong> reports only</p>
        </div>
        {/* Invite modal */}
        {showInviteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowInviteModal(false)}>
            <div style={{ ...cardStyle, width: 420, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold mb-4" style={{ color: '#F9FAFB' }}>Invite Staff Member</h3>
              <div className="space-y-3">
                <div><label style={labelStyle}>Name</label><input style={inputStyle} value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name" /></div>
                <div><label style={labelStyle}>Email</label><input style={inputStyle} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@school.edu" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label style={labelStyle}>Role</label><select style={{ ...inputStyle, appearance: 'auto' as any }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}><option>Teacher</option><option>TA</option><option>SENCO</option><option>Admin</option></select></div>
                  <div><label style={labelStyle}>Access Level</label><select style={{ ...inputStyle, appearance: 'auto' as any }} value={inviteAccess} onChange={e => setInviteAccess(e.target.value)}><option>Admin</option><option>Teacher</option><option>Staff</option><option>View only</option></select></div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button style={{ ...tealBtn, backgroundColor: '#374151' }} onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button style={tealBtn} onClick={() => { setShowInviteModal(false); fireToast(`Invite sent to ${inviteEmail || 'staff member'}`) }}>Send Invite</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Tab: Notifications ──
  function NotificationsTab() {
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Notifications</h2><p className="text-sm" style={{ color: '#6B7280' }}>Control when and how you receive alerts</p></div>
        <div style={cardStyle}>
          <Toggle on={dailySummary} onToggle={() => setDailySummary(!dailySummary)} label="Daily TEL TED AI Summary (morning briefing)" />
          <Toggle on={atRiskAlerts} onToggle={() => setAtRiskAlerts(!atRiskAlerts)} label="Student at-risk alerts (score below threshold)" />
          <Toggle on={sessionReminders} onToggle={() => setSessionReminders(!sessionReminders)} label="Session reminders (30 min before scheduled session)" />
          <Toggle on={assessmentReminders} onToggle={() => setAssessmentReminders(!assessmentReminders)} label="Assessment due reminders" />
          <Toggle on={weeklyDigest} onToggle={() => setWeeklyDigest(!weeklyDigest)} label="Weekly progress digest email" />
          <Toggle on={parentReminders} onToggle={() => setParentReminders(!parentReminders)} label="Parent communication reminders" />
        </div>
        <div style={cardStyle} className="space-y-4">
          <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Notification Delivery</h3>
          <div><label style={labelStyle}>Email</label><input style={{ ...inputStyle, maxWidth: 300 }} value={notifEmail} onChange={e => setNotifEmail(e.target.value)} /></div>
          <p className="text-xs" style={{ color: '#6B7280' }}>In-app notifications: always on</p>
        </div>
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Quiet Hours</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#6B7280' }}>From</span>
            <input type="time" style={{ ...inputStyle, maxWidth: 130 }} value={quietFrom} onChange={e => setQuietFrom(e.target.value)} />
            <span className="text-xs" style={{ color: '#6B7280' }}>to</span>
            <input type="time" style={{ ...inputStyle, maxWidth: 130 }} value={quietTo} onChange={e => setQuietTo(e.target.value)} />
          </div>
        </div>
        <button style={goldBtn} onClick={() => fireToast('Notification settings saved')}>Save Preferences</button>
      </div>
    )
  }

  // ── Tab: Integrations ──
  function IntegrationsTab() {
    const integrations = [
      { key: 'languagescreen', name: 'OxEd LanguageScreen', desc: 'Assessment data syncs automatically', icon: '📊' },
      { key: 'gclassroom', name: 'Google Classroom', desc: 'Sync class lists and assignments', icon: '📚' },
      { key: 'teams', name: 'Microsoft Teams', desc: 'Share session reports via Teams', icon: '💬' },
      { key: 'infinitecampus', name: 'Infinite Campus', desc: 'Sync student roster from SIS', icon: '🏫' },
      { key: 'powerschool', name: 'PowerSchool', desc: 'Sync grades and attendance', icon: '📝' },
      { key: 'skyward', name: 'Skyward', desc: 'Student information sync', icon: '☁️' },
    ]
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Integrations</h2><p className="text-sm" style={{ color: '#6B7280' }}>Connect your tools and platforms</p></div>
        <div className="space-y-3">
          {integrations.map(ig => {
            const connected = connectedIntegrations[ig.key]
            const connecting = connectingIntegration === ig.key
            return (
              <div key={ig.key} style={cardStyle} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: connected ? 'rgba(13,148,136,0.1)' : '#1F2937' }}>{ig.icon}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{ig.name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{ig.desc}</p>
                  </div>
                </div>
                {connected ? badge('#22C55E', 'Connected') : (
                  <button style={tealBtn} onClick={() => mockConnectIntegration(ig.key)} disabled={!!connecting}>
                    {connecting ? <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Connecting...</span> : 'Connect'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Tab: Data & Privacy ──
  function PrivacyTab() {
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Data & Privacy</h2><p className="text-sm" style={{ color: '#6B7280' }}>Data residency, compliance, and export controls</p></div>
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Data Residency</h3>
          <p className="text-sm" style={{ color: '#D1D5DB' }}>Current: <span className="font-semibold">European Union (eu-west-2)</span> 🇪🇺</p>
          <p className="text-xs mt-1" style={{ color: '#4B5563' }}>To request US data residency, contact support.</p>
        </div>
        <div style={cardStyle} className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Compliance</h3>
          <div className="flex items-center gap-2"><span style={{ color: '#22C55E' }}>✓</span><span className="text-sm" style={{ color: '#D1D5DB' }}>FERPA Compliant</span></div>
          <p className="text-xs" style={{ color: '#6B7280' }}>Student data is never sold or shared with third parties. All data encrypted at rest and in transit.</p>
          <div className="flex items-center gap-2"><span style={{ color: '#22C55E' }}>✓</span><span className="text-sm" style={{ color: '#D1D5DB' }}>COPPA Compliant for students under 13</span></div>
        </div>
        <div style={cardStyle} className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Data Export</h3>
          <div className="flex gap-2">
            <button style={tealBtn} onClick={() => fireToast('Export initiated — you will receive a download link by email')}>Export All School Data</button>
            <button style={{ ...tealBtn, backgroundColor: '#374151' }} onClick={() => fireToast('Student records CSV downloading...')}>Export Student Records</button>
          </div>
        </div>
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>Data Deletion</h3>
          {!showDeleteConfirm ? (
            <button style={{ ...tealBtn, backgroundColor: '#374151' }} onClick={() => setShowDeleteConfirm(true)}>Request Data Deletion</button>
          ) : (
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#EF4444' }}>Are you sure?</p>
              <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>This will permanently delete all school data including student records, assessment history, and session data. This action cannot be undone.</p>
              <div className="flex gap-2">
                <button style={{ ...tealBtn, backgroundColor: '#EF4444' }} onClick={() => { setShowDeleteConfirm(false); fireToast('Deletion request submitted — support will be in touch') }}>Confirm Deletion</button>
                <button style={{ ...tealBtn, backgroundColor: '#374151' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs" style={{ color: '#4B5563' }}>Support contact: support@lumiocms.com</p>
      </div>
    )
  }

  // ── Render ──
  function renderTab() {
    switch (activeTab) {
      case 'profile': return <ProfileTab />
      case 'sso': return <SsoTab />
      case 'rostering': return <RosteringTab />
      case 'voice': return <VoiceTab />
      case 'users': return <UsersTab />
      case 'notifications': return <NotificationsTab />
      case 'integrations': return <IntegrationsTab />
      case 'privacy': return <PrivacyTab />
      default: return <ProfileTab />
    }
  }

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Left tab list */}
      <div className="shrink-0 w-52 space-y-1 py-2">
        {SETTINGS_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={{ backgroundColor: activeTab === tab.id ? 'rgba(200,150,12,0.1)' : 'transparent', color: activeTab === tab.id ? '#C8960C' : '#9CA3AF', fontWeight: activeTab === tab.id ? 600 : 400, border: activeTab === tab.id ? '1px solid rgba(200,150,12,0.2)' : '1px solid transparent' }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>
      {/* Right content */}
      <div className="flex-1 min-w-0 py-2 max-w-3xl">
        {renderTab()}
      </div>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 12, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#22C55E', fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>{toast}</div>}
    </div>
  )
}

// ─── District Overview (now in DistrictDashboard component) ──────────────────

// ─── Inspection Mode ─────────────────────────────────────────────────────────

function InspectionModeSection() {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
            <Shield size={24} style={{ color: '#0D9488' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Inspection Mode</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>Prepare evidence for district or state inspection. All TEL TED data organised into inspection-ready packs.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Language & Literacy Evidence', icon: '📖' },
            { label: 'Intervention Impact Report', icon: '📊' },
            { label: 'Student Progress Pack', icon: '📈' },
            { label: 'Staff Training Records', icon: '🎓' },
          ].map(pack => (
            <button key={pack.label} className="flex items-center gap-3 rounded-xl p-4 text-left transition-all hover:scale-[1.02]" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
              <span className="text-2xl">{pack.icon}</span>
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{pack.label}</span>
            </button>
          ))}
        </div>
        <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-xs font-semibold" style={{ color: '#FBBF24' }}>Full inspection support — coming Q3 2026</p>
        </div>
      </div>
    </div>
  )
}

// ─── Rostering ───────────────────────────────────────────────────────────────

function RosteringSection() {
  const groupA = PUPILS.filter((p: any) => p.class === 'A' && p.neli)
  const groupB = PUPILS.filter((p: any) => p.class !== 'A' && p.neli)
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>Rostering</h2>
        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Manage student groups, session schedules and TEL TED assignments</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#0D9488' }}>Group A</h3>
            <div className="space-y-1">
              {groupA.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 text-xs py-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{p.name.split(' ').map((w: string) => w[0]).join('')}</div>
                  <span style={{ color: '#F9FAFB' }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#B45309' }}>Group B</h3>
            <div className="space-y-1">
              {groupB.length > 0 ? groupB.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 text-xs py-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: 'rgba(180,83,9,0.15)', color: '#B45309' }}>{p.name.split(' ').map((w: string) => w[0]).join('')}</div>
                  <span style={{ color: '#F9FAFB' }}>{p.name}</span>
                </div>
              )) : <p className="text-xs" style={{ color: '#6B7280' }}>No students in Group B yet</p>}
            </div>
          </div>
        </div>
        {/* Weekly Grid */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Weekly Schedule</h3>
          <div className="grid grid-cols-5 gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <div key={day} className="text-center">
                <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>{day}</p>
                <div className="space-y-1">
                  <div className="rounded-lg px-2 py-1.5 text-xs" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>Group A</div>
                  {day !== 'Wednesday' && <div className="rounded-lg px-2 py-1.5 text-xs" style={{ backgroundColor: 'rgba(180,83,9,0.1)', color: '#B45309' }}>1:1 Session</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-xs font-semibold" style={{ color: '#FBBF24' }}>Full rostering functionality — coming soon</p>
        </div>
      </div>
    </div>
  )
}

// ─── Reports Panel (copied from NELI, rebranded) ────────────────────────────

const REPORT_TYPES = [
  { id: 'term-summary', name: 'End of Term TEL TED Summary', desc: 'Full cohort overview with band distribution and progress since September.', lastGen: '18 Mar 2026' },
  { id: 'pupil-progress', name: 'Student Progress Report', desc: 'Individual student language journey with score trajectory and next steps.', lastGen: '14 Mar 2026' },
  { id: 'at-risk', name: 'Cohort At-Risk Report', desc: 'All students below threshold with recommended actions and intervention status.', lastGen: '20 Mar 2026' },
  { id: 'subtest', name: 'Subtest Analysis Report', desc: 'School-wide breakdown across all 4 LanguageScreen subtests with comparisons.', lastGen: '12 Mar 2026' },
  { id: 'inspection', name: 'State Inspection Evidence Pack', desc: 'Structured evidence of language intervention impact for inspection readiness.', lastGen: '10 Mar 2026' },
  { id: 'parent', name: 'Parent Communication Report', desc: 'Plain-English progress summaries for parent meetings and updates.', lastGen: '22 Mar 2026' },
  { id: 'svor', name: 'Simple View of Reading', desc: 'Two-dimensional view of language comprehension vs word decoding for all assessed students.', lastGen: '' },
  { id: 'class-dashboard', name: 'Class Dashboard', desc: 'LanguageScreen results for all students showing first and last assessment scores with progress arrows.', lastGen: '' },
]

function ReportsPanel() {
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  function handleGenerate(report: any) {
    setSelectedReport(report); setGenerating(true); setPreview(null)
    setTimeout(() => { setGenerating(false); setPreview(report) }, 2000)
  }

  return (
    <div style={{ display: 'flex', minHeight: 500, overflow: 'hidden' }}>
      <div style={{ width: 360, flexShrink: 0, borderRight: '1px solid #1F2937', overflowY: 'auto', padding: 20, background: '#0A0B10' }}>
        <h2 className="text-base font-bold mb-1" style={{ color: '#F9FAFB' }}>Report Library</h2>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Generate and download professional reports</p>
        <div className="flex flex-col gap-3">
          {REPORT_TYPES.map(r => (
            <div key={r.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${selectedReport?.id === r.id ? '#0D9488' : '#1F2937'}` }}>
              <h4 className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{r.name}</h4>
              <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{r.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#4B5563' }}>Last: {r.lastGen || '—'}</span>
                <button onClick={() => handleGenerate(r)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Generate</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#07080F' }}>
        {!preview && !generating && (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: '#6B7280' }}>
            <FileText size={48} style={{ color: '#1F2937', marginBottom: 16 }} />
            <p className="text-sm font-semibold">Select a report to generate</p>
          </div>
        )}
        {generating && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={36} style={{ color: '#0D9488', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p className="text-sm font-semibold mt-4" style={{ color: '#0D9488' }}>Generating report with AI...</p>
          </div>
        )}
        {preview && !generating && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="mb-6 pb-4" style={{ borderBottom: '2px solid #1F2937' }}>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{preview.name}</h2>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Parkside Elementary · Oak Valley District · TEL TED: NELI Intervention · EEF 5/5 Evidence Rating</p>
            </div>
            <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
                {preview.id === 'term-summary' && `The Kindergarten cohort at Parkside Elementary has made strong progress in language development. The average LanguageScreen score has risen from ${classAvgI} to ${classAvgE}, representing a gain of +${Math.round((classAvgE - classAvgI) * 10) / 10} points. Five students are enrolled on the TEL TED: NELI Intervention programme. TEL TED students have made accelerated progress with an average gain of +${neliAvgGain} points.`}
                {preview.id === 'pupil-progress' && 'Individual student tracking shows that all students have made measurable progress since their initial assessment. Five TEL TED students have shown the most significant gains, with Amara Johnson progressing from 62 to 80 (+18 points).'}
                {preview.id === 'at-risk' && 'Two students are currently identified as at-risk with LanguageScreen scores below 85. Both are enrolled on the TEL TED programme and receiving additional speech and language support.'}
                {preview.id === 'subtest' && 'Subtest analysis reveals that Receptive Vocabulary is the weakest area across the cohort, whilst Listening Comprehension is the strongest.'}
                {preview.id === 'inspection' && "This evidence pack demonstrates the school's systematic approach to early language intervention. Impact data shows the programme is closing the gap between disadvantaged and non-disadvantaged students."}
                {preview.id === 'parent' && "Your child has been assessed using LanguageScreen, a tool developed by Oxford University researchers. The assessment looks at four areas: understanding words, using words, grammar, and listening."}
                {(preview.id === 'svor' || preview.id === 'class-dashboard') && 'Full interactive report view available — select Generate to view the complete analysis.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Staff Tab ───────────────────────────────────────────────────────────────

function StaffTabContent() {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <h3 className="font-bold text-sm mb-4" style={{ color: '#F9FAFB' }}>👥 Staff Overview</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Staff in today', value: '4 / 6', color: '#0D9488' },
          { label: 'On cover', value: '1', color: '#F59E0B' },
          { label: 'CPD due this term', value: '3 staff', color: '#A78BFA' },
          { label: 'Reviews this week', value: '2', color: '#60A5FA' },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Don't Miss Tab ──────────────────────────────────────────────────────────

function DontMissTab() {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <h3 className="font-bold text-sm mb-4" style={{ color: '#F9FAFB' }}>🔴 Don&apos;t Miss</h3>
      <div className="space-y-2">
        {[
          { text: 'LanguageScreen reassessment overdue — 3 students', level: 'critical' },
          { text: 'Amara Johnson below threshold — review intervention plan', level: 'critical' },
          { text: 'TEL TED Week 17 materials not uploaded', level: 'warning' },
          { text: 'Parent updates due for 3 families this week', level: 'warning' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: item.level === 'critical' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${item.level === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`, borderLeft: `3px solid ${item.level === 'critical' ? '#EF4444' : '#F59E0B'}` }}>
            <span className="text-sm flex-1" style={{ color: '#F9FAFB' }}>{item.text}</span>
            <span className="text-xs px-1.5 py-0.5 rounded ml-auto flex-shrink-0" style={{ backgroundColor: item.level === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: item.level === 'critical' ? '#F87171' : '#FBBF24' }}>
              {item.level === 'critical' ? 'Critical' : 'Warning'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

// ─── Dark theme override for NELI components ────────────────────────────────
// Save original NELI theme values so we can restore on unmount
const _originalT = {
  bg: T.bg, card: T.card, border: T.border, text: T.text,
  muted: T.muted, light: T.light, goldLight: T.goldLight,
  greenBg: T.greenBg, amberBg: T.amberBg, redBg: T.redBg,
  blueBg: T.blueBg, purpleBg: T.purpleBg,
}

export default function TelTedPortal({ params }: { params: Promise<{ slug: string }> }) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('today')
  const [sidebarPage, setSidebarPage] = useState('overview')
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // NELI portal state
  const [selectedPupil, setSelectedPupil] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [assessingPupil, setAssessingPupil] = useState<any>(null)
  const [assessingDemo, setAssessingDemo] = useState(false)
  const [neliSubTab, setNeliSubTab] = useState<'dashboard' | 'languagescreen' | 'tracker'>('dashboard')
  const [insightsSubTab, setInsightsSubTab] = useState<'school' | 'network'>('school')
  const [voiceToast, setVoiceToast] = useState<VoiceToastData | null>(null)

  // Override NELI theme for dark mode — mutate T before render so NELI components pick up dark values
  T.bg = '#07080F'; T.card = '#111318'; T.border = '#1F2937'
  T.text = '#F9FAFB'; T.muted = '#9CA3AF'; T.light = '#1A1B23'
  T.goldLight = 'rgba(200,150,12,0.15)'
  T.greenBg = 'rgba(21,128,61,0.12)'; T.amberBg = 'rgba(180,83,9,0.12)'
  T.redBg = 'rgba(185,28,28,0.12)'; T.blueBg = 'rgba(29,78,216,0.12)'
  T.purpleBg = 'rgba(124,58,237,0.12)'

  const expanded = pinned || hovered
  const sidebarW = expanded ? EXPANDED_W : COLLAPSED_W

  useEffect(() => {
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')

    // CSS injection for hardcoded "white" backgrounds in NELI components
    const styleId = 'telted-dark-override'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .telted-neli-dark [style*="background: white"],
        .telted-neli-dark [style*="background:white"] {
          background: #111318 !important;
        }
        .telted-neli-dark .recharts-cartesian-grid line { stroke: #1F2937 !important; }
        .telted-neli-dark .recharts-tooltip-wrapper .recharts-default-tooltip {
          background: #111318 !important; border-color: #1F2937 !important;
        }
        .telted-neli-dark .recharts-default-tooltip .recharts-tooltip-label { color: #F9FAFB !important; }
      `
      document.head.appendChild(style)
    }

    // Restore original theme on unmount (in case user navigates to NELI portal)
    return () => {
      Object.assign(T, _originalT)
      document.getElementById(styleId)?.remove()
    }
  }, [])

  function togglePin() {
    const next = !pinned
    setPinned(next)
    localStorage.setItem('lumio_sidebar_pinned', String(next))
  }

  function handleMouseEnter() { if (leaveTimer.current) clearTimeout(leaveTimer.current); setHovered(true) }
  function handleMouseLeave() { leaveTimer.current = setTimeout(() => setHovered(false), 200) }

  function handleSidebarNav(id: string) {
    setSidebarPage(id)
    setSelectedClass(null)
    setSelectedPupil(null)
    if (id === 'overview') setActiveTab('today')
  }

  function handleQuickAction(action: string, label: string) {
    if (action === 'assess') {
      setAssessingPupil(PUPILS[0])
    } else if (action === 'test') {
      setAssessingDemo(true)
    } else if (action === 'resources') {
      setSidebarPage('overview')
      setActiveTab('resources')
    } else if (action === 'report') {
      setSidebarPage('overview')
      setActiveTab('reports')
    }
  }

  const handleSelectPupil = (p: any) => { setSelectedPupil(p); setSidebarPage('pupil') }
  const handleSelectClass = (c: any) => { setSelectedClass(c); setSidebarPage('classdetail') }

  // ─── Render tab content ──────────────────────────────────────────────────

  function renderTabContent() {
    switch (activeTab) {
      case 'today':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-1 flex flex-col"><TelTedOverview /></div>
            <div className="lg:col-span-1 flex flex-col"><TelTedSchedule /></div>
            <div className="lg:col-span-1 flex flex-col gap-4">
              <PhotoFrame />
              <TelTedAIPanel />
            </div>
          </div>
        )
      case 'languagescreen':
        return (
          <div>
            <div className="flex gap-2 mb-4 px-1">
              {([['dashboard', 'Dashboard'], ['languagescreen', 'LanguageScreen'], ['tracker', 'TEL TED Tracker']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setNeliSubTab(id)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: neliSubTab === id ? '#0D9488' : '#111318', color: neliSubTab === id ? '#F9FAFB' : '#6B7280', border: `1px solid ${neliSubTab === id ? '#0D9488' : '#1F2937'}` }}>{label}</button>
              ))}
            </div>
            {neliSubTab === 'dashboard' && <Dashboard onSelectPupil={handleSelectPupil} />}
            {neliSubTab === 'languagescreen' && <LanguageScreenPage onSelectPupil={handleSelectPupil} />}
            {neliSubTab === 'tracker' && <NELITracker />}
          </div>
        )
      case 'insights':
        return (
          <div>
            <div className="flex gap-2 mb-4 px-1">
              {([['school', 'School View'], ['network', 'Network View']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setInsightsSubTab(id)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: insightsSubTab === id ? '#0D9488' : '#111318', color: insightsSubTab === id ? '#F9FAFB' : '#6B7280', border: `1px solid ${insightsSubTab === id ? '#0D9488' : '#1F2937'}` }}>{label}</button>
              ))}
            </div>
            {insightsSubTab === 'school' ? <Insights /> : <TrustView />}
          </div>
        )
      case 'reports':
        return <ReportsPanel />
      case 'classes':
        return <ClassesPage onSelectClass={handleSelectClass} onSelectPupil={handleSelectPupil} />
      case 'training':
        return <Training onStartTraining={() => setSidebarPage('trainingcourses')} isTelTed />
      case 'telted':
        return <TELTedTraining onBack={() => setActiveTab('training')} />
      case 'resources':
        return <TelTedResourcesWrapper />
      case 'attendance':
        return <ComingSoonPage title="Attendance" />
      case 'dont-miss':
        return <DontMissTab />
      case 'staff-tab':
        return <StaffTabContent />
      default:
        return null
    }
  }

  // ─── Render sidebar page content ─────────────────────────────────────────

  function renderContent() {
    // Handle deep navigation states
    if (sidebarPage === 'pupil' && selectedPupil) {
      return <PupilDetail pupil={selectedPupil} onBack={() => { setSidebarPage(selectedClass ? 'classdetail' : 'overview'); setSelectedPupil(null); setActiveTab('languagescreen') }} />
    }
    if (sidebarPage === 'classdetail' && selectedClass) {
      return <ClassDetail cls={selectedClass} onBack={() => { setSidebarPage('overview'); setSelectedClass(null); setActiveTab('classes') }} onSelectPupil={handleSelectPupil} />
    }
    if (sidebarPage === 'trainingcourses') {
      return <TrainingCourses onBack={() => { setSidebarPage('overview'); setActiveTab('training') }} staffName="Sarah Mitchell" isTelTed />
    }

    // Sidebar nav pages
    switch (sidebarPage) {
      case 'overview':
        return (
          <div className="space-y-4">
            <GreetingBanner onVoiceToast={setVoiceToast} />

            {/* Quick actions */}
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937', borderRadius: 12 }}>
              <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={() => handleQuickAction(a.action, a.label)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: a.color, color: '#F9FAFB' }}>
                  <span>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>

            {/* Tab bar */}
            <div className="border-b overflow-x-auto scrollbar-none -mx-4 sm:-mx-5" style={{ backgroundColor: '#0D0E14', borderColor: '#1F2937' }}>
              <div className="flex items-center gap-0 min-w-max px-2">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
                    style={{ borderBottomColor: activeTab === t.id ? '#0D9488' : 'transparent', color: activeTab === t.id ? '#2DD4BF' : '#6B7280', backgroundColor: activeTab === t.id ? 'rgba(13,148,136,0.05)' : 'transparent' }}>
                    <span className="text-base">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {renderTabContent()}
          </div>
        )
      case 'insights':
        return <div><Insights /></div>
      case 'district':
        return <DistrictDashboard />
      case 'staff':
        return <StaffManagementPage />
      case 'send-dsl':
        return <SendDslPage />
      case 'safeguarding':
        return <SafeguardingPage />
      case 'wraparound':
        return <WraparoundPage />
      case 'inspection':
        return <InspectionModePage />
      case 'rostering':
        return <RosteringPage />
      case 'missync':
        return <MisSyncPage />
      case 'workflows':
        return <WorkflowsPage />
      case 'reports':
        return <ReportsToolPage />
      case 'settings':
        return <TelTedSettings />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#07080F' }}>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* LanguageScreen Assessment Overlay */}
      {(assessingPupil || assessingDemo) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white' }}>
          <LanguageScreenApp
            studentName={assessingPupil ? assessingPupil.name : 'Demo Student'}
            studentDob={assessingPupil ? (assessingPupil.dob?.split('/').reverse().join('-') || '2020-01-01') : '2020-06-15'}
            schoolName="Parkside Elementary"
            assessorName="Sarah Mitchell"
            onClose={() => { setAssessingPupil(null); setAssessingDemo(false) }}
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden md:flex flex-col transition-[width] duration-200"
        style={{ width: sidebarW, backgroundColor: '#07080F', borderRight: '1px solid #1F2937', overflow: 'hidden' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo area */}
        {!expanded && (
          <div className="shrink-0 flex items-center justify-center py-3" style={{ borderBottom: '1px solid #1E2E45', minHeight: 56 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E87722', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: 'white' }}>HE</div>
          </div>
        )}
        {expanded && (
          <div className="shrink-0 flex items-center gap-2" style={{ padding: '12px 16px', borderBottom: '1px solid #1E2E45' }}>
            <div className="flex-1 min-w-0">
              <img src="/telted_rgb_logo.jpg" alt="TEL TED" style={{ width: '100%', maxWidth: 140, height: 'auto', maxHeight: 52, objectFit: 'contain', display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <p style={{ fontSize: 10, color: '#8BA4C7', margin: '4px 0 0', letterSpacing: '0.04em' }}>OxEd &amp; Assessment</p>
            </div>
            <button onClick={togglePin} className="flex items-center justify-center rounded p-1 shrink-0"
              style={{ color: pinned ? '#0D9488' : '#4B5563', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)' }}
              title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
              <Pin size={14} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* School info */}
        {expanded && (
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Current School</p>
            <p className="text-xs font-bold mt-1" style={{ color: '#F9FAFB' }}>🏫 Parkside Elementary</p>
            <p className="text-[10px]" style={{ color: '#6B7280' }}>Oak Valley District · Kindergarten</p>
          </div>
        )}

        {/* Gold divider */}
        {expanded && <div style={{ margin: '0 16px', height: 1, background: 'linear-gradient(90deg, transparent, #C8960C40, transparent)' }} />}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-1.5 py-3 space-y-0.5">
          {SIDEBAR_NAV.map((item, i) => {
            const prev = SIDEBAR_NAV[i - 1]
            const showSection = expanded && item.section && item.section !== prev?.section
            const isActive = sidebarPage === item.id
            const Icon = item.icon
            return (
              <div key={item.id}>
                {showSection && <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{item.section}</p>}
                <button onClick={() => handleSidebarNav(item.id)}
                  className="flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-colors w-full"
                  style={{ backgroundColor: isActive ? '#0D9488' : 'transparent', color: isActive ? '#F9FAFB' : '#9CA3AF', paddingLeft: expanded ? 12 : 0, paddingRight: expanded ? 12 : 0, justifyContent: expanded ? 'flex-start' : 'center' }}
                  title={expanded ? undefined : item.label}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = '#111318'; e.currentTarget.style.color = '#F9FAFB' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' } }}>
                  <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  {expanded && <span className="flex-1 truncate text-xs">{item.label}</span>}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid #1F2937' }}>
          <div className="px-1.5 py-2">
            <button className="flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium w-full" style={{ color: '#9CA3AF', paddingLeft: expanded ? 12 : 0, justifyContent: expanded ? 'flex-start' : 'center' }}>
              <LogOut size={15} strokeWidth={1.75} className="shrink-0" />
              {expanded && <span className="text-xs">Sign Out</span>}
            </button>
          </div>
          {expanded && (
            <div className="pb-3">
              <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-40 hover:opacity-70 transition-opacity" style={{ width: 'fit-content' }}>
                <img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden" style={{ width: EXPANDED_W, backgroundColor: '#07080F', borderRight: '1px solid #1F2937' }}>
          <div className="flex shrink-0 items-center gap-2.5" style={{ padding: '12px 16px', borderBottom: '1px solid #1E2E45' }}>
            <div className="flex-1 min-w-0">
              <img src="/telted_rgb_logo.jpg" alt="TEL TED" style={{ width: '100%', maxWidth: 140, height: 'auto', maxHeight: 52, objectFit: 'contain', display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <p style={{ fontSize: 10, color: '#8BA4C7', margin: '4px 0 0', letterSpacing: '0.04em' }}>OxEd &amp; Assessment</p>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ color: '#9CA3AF' }}><X size={16} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {SIDEBAR_NAV.map((item, i) => {
              const prev = SIDEBAR_NAV[i - 1]
              const showSection = item.section && item.section !== prev?.section
              const isActive = sidebarPage === item.id
              const Icon = item.icon
              return (
                <div key={item.id}>
                  {showSection && <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>{item.section}</p>}
                  <button onClick={() => { handleSidebarNav(item.id); setMobileOpen(false) }}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium w-full"
                    style={{ backgroundColor: isActive ? '#0D9488' : 'transparent', color: isActive ? '#F9FAFB' : '#9CA3AF' }}>
                    <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                    <span className="flex-1 truncate text-xs">{item.label}</span>
                  </button>
                </div>
              )
            })}
          </nav>
        </aside>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden transition-[padding] duration-200" style={{ paddingLeft: sidebarW }}>
        {/* Top-right header: notification + avatar */}
        <div className="fixed hidden md:flex items-center gap-2" style={{ top: 12, right: 20, zIndex: 60 }}>
          <div className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>● EEF 5/5 Evidence Rating</div>
          <button className="relative flex items-center justify-center rounded-full" style={{ width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF', cursor: 'pointer' }}>
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute flex items-center justify-center rounded-full" style={{ top: 4, right: 4, width: 10, height: 10, backgroundColor: '#EF4444', fontSize: 6, color: '#fff', fontWeight: 700 }}>3</span>
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#F9FAFB' }}>SM</div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>Sarah Mitchell</p>
              <p className="text-[10px]" style={{ color: '#6B7280' }}>TEL TED Coordinator</p>
            </div>
          </div>
        </div>

        {/* Mobile menu bar */}
        <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1F2937' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: '#9CA3AF' }}><Menu size={18} /></button>
          <span className="text-sm font-semibold ml-2 truncate" style={{ color: '#F9FAFB' }}>TEL TED Portal</span>
        </div>

        {/* Main content */}
        <main className="telted-neli-dark flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </div>

      {/* Voice command response toast */}
      <VoiceToast toast={voiceToast} onDismiss={() => setVoiceToast(null)} />
    </div>
  )
}
