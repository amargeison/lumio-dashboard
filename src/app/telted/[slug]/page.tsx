'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Public_Sans } from 'next/font/google'
import Link from 'next/link'
import {
  LayoutDashboard, TrendingUp, Building2, Users, UserCheck, Shield, Clock,
  ClipboardList, Calendar, Database, Network, GitBranch, FileText, Settings,
  LogOut, Bell, Menu, X, Pin, ChevronRight, ChevronUp, ChevronDown, Sun, Moon,
  Sparkles, Volume2, Mic, Search, GraduationCap, BookOpen, FolderOpen,
  CalendarCheck, Download, Loader2, Printer, Briefcase,
  PenLine, BarChart3, School, UserPlus, Plus, FlaskConical, TriangleAlert, ChartLine, Mail, Image as ImageIcon, SlidersHorizontal,
} from 'lucide-react'
import { partnerForSlug } from '@/lib/partners/tenant-partner'
import { TelTedWelcomePage, buildWelcomeCards, type WelcomeTarget, type WelcomeNotice, type WelcomeLast } from '@/components/telted/TelTedWelcome'
import { TELTED_FILE_COUNT } from '@/data/telted/resources'
import { RGRDashboard } from '@/components/telted/rgr/RGRDashboard'
import TelTedResourceLibrary from '@/components/telted/TelTedResources'
import TelTedReportsPanel from '@/components/telted/TelTedReports'
import TelTedInspectionPage from '@/components/telted/TelTedInspection'
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
  RosteringPage, MisSyncPage, WorkflowsPage, ReportsToolPage,
} from '@/components/neli/SidebarPages'

const publicSans = Public_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' })

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

  // COMMAND 4 — James Hartley easter egg
  if (/james\s*hartley|what\s*do\s*you\s*think\s*of\s*james|tell\s*me\s*about\s*james|who\s*is\s*james/i.test(t)) {
    const response = "James Hartley... hmm, let me think. I know a few Andrews. If you mean James Hartley, then I only have good words. Top man. Knows his stuff. Good looking too — I probably should stop there in case he's listening. I'm starting to blush."
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
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'var(--tt-dim)', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
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
    .replace(/\bNELI Programme Status\b/g, 'TEL TED Program Status')
    .replace(/\bNELI Programme\b/g, 'TEL TED: NELI Intervention')
    .replace(/\bNuffield Early Language Intervention\b/g, 'TEL TED: NELI Intervention')
    .replace(/\bNELI Lead\b/g, 'TEL TED Coordinator')
    .replace(/\bNELI Pupils\b/g, 'TEL TED Students')
    .replace(/\bNELI Pupil\b/g, 'TEL TED Student')
    .replace(/\bNELI Tracker\b/g, 'TEL TED Tracker')
    .replace(/\bNELI (Intervention|sessions?|group|students?|programme|program)\b/gi, (m: string) => m.replace(/NELI/, 'TEL TED'))
    .replace(/\bEYFS Profile Update\b/g, 'Early Learning Profile Update')
    .replace(/\bEYFS Profile\b/g, 'Early Learning Profile')
    .replace(/\bEYFS\b/g, 'Early Learning')
    .replace(/\bEarly Learning Goals?\b/g, 'Early Learning Standards')
    .replace(/\bELGs? Expected\b/g, 'Standards Expected')
    .replace(/\bELGs\b/g, 'Standards')
    .replace(/\bELG\b/g, 'Standard')
    .replace(/\bGLD Projection\b/g, 'Readiness Projection')
    .replace(/\bGLD\b/g, 'Readiness')
    .replace(/\bSEN & SEND Overview\b/g, 'Special Education Overview')
    .replace(/\bSEN & SEND\b/g, 'Special Education')
    .replace(/\bSEN & Support Needs\b/g, 'Special Education & Support Needs')
    .replace(/\bSEN Support\b/g, 'Special Ed Support')
    .replace(/\bSEN Status\b/gi, (m: string) => m.replace(/SEN/, 'Support'))
    .replace(/\bSEND\b/g, 'Special Education')
    .replace(/\bSENCO\b/g, 'Special Education Coordinator')
    .replace(/\bEHCP\b/g, 'IEP')
    .replace(/\bRefer to SALT\b/g, 'Refer to SLP')
    .replace(/\bSALT referral\b/gi, (m: string) => m.replace(/SALT/, 'SLP'))
    .replace(/\bSALT\b/g, 'Speech-Language Pathologist')
    .replace(/\bReception A & B\b/g, 'Kindergarten A & B')
    .replace(/\bReception\b/g, 'Kindergarten')
    .replace(/\bYear 1\b/g, '1st Grade')
    .replace(/\bYear 2\b/g, '2nd Grade')
    .replace(/\bTeaching Assistant\b/g, 'Paraprofessional')
    .replace(/\bHeadteacher\b/g, 'Principal')
    .replace(/\bOfsted\b/g, 'State Inspection')
    .replace(/\bParkside Primary\b/g, 'Parkside Elementary')
    .replace(/\bOak Valley MAT\b/g, 'Oak Valley District')
    .replace(/\bMrs S\. Mitchell\b/g, 'Ms S. Mitchell')
    .replace(/\bDfE Funded\b/g, 'EEF 5/5 Evidence Rating')
    .replace(/\bFree School Meals\b/g, 'Free & Reduced Lunch')
    .replace(/\bFSM\b/g, 'FRL')
    .replace(/\bPupils\b/g, 'Students')
    .replace(/\bpupils\b/g, 'students')
    .replace(/\bPupil\b/g, 'Student')
    .replace(/\bpupil\b/g, 'student')
    .replace(/\bProgramme\b/g, 'Program')
    .replace(/\bprogramme\b/g, 'program')
    .replace(/\bAutumn term\b/gi, 'Fall semester')
    .replace(/\bSummer term\b/gi, 'Spring semester')
}

/** Apply usify() to every text node under `root` and keep doing so as the tree changes
 *  (the shared NELI components render UK terminology; this keeps the US demo consistent). */
function useUsTerminology(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const SKIP = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION'])
    const fix = (node: Node) => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && SKIP.has(n.parentElement.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT })
      let t: Node | null
      while ((t = walker.nextNode())) { const v = t.nodeValue || ''; if (v.length > 2) { const u = usify(v); if (u !== v) t.nodeValue = u } }
    }
    fix(el)
    let scheduled = false
    const mo = new MutationObserver(() => { if (scheduled) return; scheduled = true; requestAnimationFrame(() => { scheduled = false; mo.disconnect(); fix(el); mo.observe(el, { childList: true, subtree: true, characterData: true }) }) })
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    return () => mo.disconnect()
  }, [root])
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
  { section: 'Tools',  id: 'workflows',    label: 'Workflows',          icon: GitBranch },
  { section: null,     id: 'reports',      label: 'Reports',            icon: FileText },
  { section: null,     id: 'rostering',    label: 'Rostering',          icon: Calendar },
  { section: null,     id: 'missync',      label: 'MIS Sync',           icon: Database },
  { section: null,     id: 'settings',     label: 'Settings',           icon: Settings },
]

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'today',         label: 'Today' },
  { id: 'languagescreen', label: 'LanguageScreen & TEL TED' },
  { id: 'insights',      label: 'Insights' },
  { id: 'reports',       label: 'Reports' },
  { id: 'classes',       label: 'Classes' },
  { id: 'training',      label: 'TEL TED Training' },
  { id: 'telted',        label: 'TEL TED Learning' },
  { id: 'resources',     label: 'Resources' },
  { id: 'attendance',    label: 'Attendance' },
  { id: 'dont-miss',     label: "Don't Miss" },
  { id: 'staff-tab',     label: 'Staff' },
]

// ─── Dashboard preferences (persisted; photo frame is opt-in) ────────────────
type DashPrefs = { photoFrame: boolean; welcomePage: boolean }
const DASH_KEY = 'telted_dash_prefs'
const DASH_DEFAULTS: DashPrefs = { photoFrame: false, welcomePage: true }
let dashPrefs: DashPrefs = { ...DASH_DEFAULTS }
if (typeof window !== 'undefined') { try { dashPrefs = { ...dashPrefs, ...JSON.parse(localStorage.getItem(DASH_KEY) || '{}') } } catch {} }
const dashListeners = new Set<() => void>()
function setDashPrefs(patch: Partial<DashPrefs>) { dashPrefs = { ...dashPrefs, ...patch }; try { localStorage.setItem(DASH_KEY, JSON.stringify(dashPrefs)) } catch {}; dashListeners.forEach(l => l()) }
function useDashPrefs() { return useSyncExternalStore(cb => { dashListeners.add(cb); return () => { dashListeners.delete(cb) } }, () => dashPrefs, () => DASH_DEFAULTS) }

// ─── Quick actions ───────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Assess Student',      Icon: PenLine,      kind: 'primary',  action: 'assess' },
  { label: 'Student Report',      Icon: FileText,     kind: 'outline',  action: 'report' },
  { label: 'Class Report',        Icon: BarChart3,    kind: 'outline',  action: 'report' },
  { label: 'School Report',       Icon: School,       kind: 'outline',  action: 'report' },
  { label: 'Add Teacher',         Icon: UserPlus,     kind: 'outline2', action: 'add' },
  { label: 'Add Student',         Icon: Plus,         kind: 'outline2', action: 'add' },
  { label: 'Test LanguageScreen', Icon: FlaskConical, kind: 'primary2', action: 'test' },
]
const QA_STYLES: Record<string, React.CSSProperties> = {
  primary:  { backgroundColor: 'var(--tt-accent)', color: '#fff', border: '1px solid var(--tt-accent)' },
  primary2: { backgroundColor: 'var(--tt-accent2)', color: '#fff', border: '1px solid var(--tt-accent2)' },
  outline:  { backgroundColor: 'var(--tt-card)', color: 'var(--tt-accent)', border: '1px solid var(--tt-accent-border)' },
  outline2: { backgroundColor: 'var(--tt-card)', color: 'var(--tt-accent2-deep)', border: '1px solid var(--tt-accent2-border)' },
}

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
  { id: 'assessments', Icon: ClipboardList, label: 'LanguageScreen Assessments', count: 4, urgent: true, color: 'var(--tt-accent)', bg: 'var(--tt-accent-soft)', border: 'var(--tt-accent-border)',
    messages: [{ id: 'a1', from: 'Assessment System', avatar: 'AS', subject: '4 students not yet assessed this term', preview: 'Students due for LanguageScreen reassessment: Ruby Taylor, Oliver Barnes, Lily Thompson, Samuel Green.', time: 'Today', urgent: true, read: false }] },
  { id: 'sessions', Icon: BookOpen, label: 'TEL TED Sessions', count: 12, urgent: false, color: 'var(--tt-accent2-deep)', bg: 'var(--tt-accent2-soft)', border: 'var(--tt-accent2-border)',
    messages: [{ id: 's1', from: 'Session Tracker', avatar: 'ST', subject: '12 of 15 expected sessions completed this week', preview: 'Group 1A: 4/5 sessions done. Group 1B: 3/5 done. Individual catch-ups: 5/5 done.', time: 'This week', urgent: false, read: false }] },
  { id: 'atrisk', Icon: TriangleAlert, label: 'At-Risk Students', count: 2, urgent: true, color: 'var(--tt-red)', bg: 'var(--tt-red-soft)', border: 'var(--tt-red-soft)',
    messages: [{ id: 'r1', from: 'Progress Monitoring', avatar: 'PM', subject: '2 students scoring below threshold', preview: 'Amara Johnson (80) and Leon Carter (85) — both below age-expected standard of 90. Review intervention plan recommended.', time: 'Today', urgent: true, read: false }] },
  { id: 'progress', Icon: ChartLine, label: 'TEL TED Progress', count: 17, urgent: false, color: 'var(--tt-green-deep)', bg: 'var(--tt-green-soft)', border: 'var(--tt-green-border)',
    messages: [{ id: 'p1', from: 'TEL TED Tracker', avatar: 'TT', subject: 'Week 17 — 80% on track', preview: '4 out of 5 TEL TED students are on track for expected progress. Amara Johnson needs additional support.', time: 'This week', urgent: false, read: false }] },
  { id: 'comms', Icon: Mail, label: 'Parent Comms', count: 3, urgent: false, color: 'var(--tt-accent)', bg: 'var(--tt-accent-soft)', border: 'var(--tt-accent-border)',
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
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&q=80',
]

// ─── World Clock ─────────────────────────────────────────────────────────────

function PortalCard({ title, right, headerColor = 'var(--tt-accent)', children, className = '' }: { title: string; right?: React.ReactNode; headerColor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 8 }}>
      <div style={{ backgroundColor: headerColor, padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{title}</span>
        {right}
      </div>
      <div style={{ padding: '8px 16px 12px' }}>{children}</div>
    </div>
  )
}

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
    <div style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 8, padding: '8px 14px', minWidth: 170 }}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {zones.map(z => (
          <div key={z.label} className="flex items-center gap-1.5">
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--tt-text)', fontVariantNumeric: 'tabular-nums' }}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: z.tz, hour12: false })}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--tt-muted)' }}>{z.label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, marginTop: 4, color: 'var(--tt-accent2-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>World Clock</div>
    </div>
  )
}

// ─── Photo Frame ─────────────────────────────────────────────────────────────

function PhotoFrame() {
  const [photos, setPhotos] = useState<string[]>(() => { try { const s = typeof window !== 'undefined' ? localStorage.getItem('lumio-photo-frame') : null; if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length > 0) return p.map((x: any) => typeof x === 'string' ? x : x.src) } } catch {} return typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true' ? DEMO_PHOTOS : [] })
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

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying && photos.length > 1) intervalRef.current = setInterval(() => setCurrentIdx(i => (i + 1) % photos.length), intervalSecs * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, photos.length, intervalSecs])
  useEffect(() => { localStorage.setItem('lumio-photo-frame', JSON.stringify(photos)) }, [photos])
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
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', minHeight: 240 }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2"><span className="text-base">🖼️</span><span className="font-bold text-sm" style={{ color: 'var(--tt-text)' }}>Photo Frame</span></div>
        <div className="flex items-center gap-2">
          {photos.length > 1 && <button onClick={() => setIsPlaying(p => !p)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isPlaying ? 'var(--tt-accent-soft)' : 'var(--tt-hover)', color: isPlaying ? 'var(--tt-accent)' : 'var(--tt-dim)' }}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>}
          {photos.length > 1 && <button onClick={handleRemovePhoto} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--tt-border)', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }} title="Remove this photo">✕ Remove</button>}
          <button onClick={() => fileInputRef.current?.click()} disabled={photos.length >= 5} title={photos.length >= 5 ? 'Maximum 5 photos' : 'Add a photo'} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--tt-border)', background: 'transparent', color: photos.length >= 5 ? 'var(--tt-dim)' : 'var(--tt-accent)', cursor: photos.length >= 5 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>+ Add</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAddPhoto} style={{ display: 'none' }} />
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 mx-4 mb-4 rounded-xl cursor-pointer" style={{ border: '2px dashed var(--tt-border2)' }} onClick={() => fileInputRef.current?.click()}>
          <div className="text-3xl">📷</div><div className="text-xs" style={{ color: 'var(--tt-muted)' }}>Add your photos</div>
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
        <div className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--tt-body)' }}>{currentIdx + 1} / {photos.length}</div>
        {(pos.x !== 50 || pos.y !== 50) && hoveringFrame && <button onClick={e => { e.stopPropagation(); resetPosition() }} className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>Reset</button>}
        {!hasEverDragged && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', whiteSpace: 'nowrap' }}>✥ Drag to reposition</div>}
      </div>
      )}
      {photos.length > 1 && <div className="px-4 pb-3 flex items-center gap-2"><span className="text-xs" style={{ color: 'var(--tt-dim)' }}>Speed:</span>{[3,5,10,30].map(s => <button key={s} onClick={() => setIntervalSecs(s)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: intervalSecs === s ? 'var(--tt-accent-soft)' : 'var(--tt-hover)', color: intervalSecs === s ? 'var(--tt-accent)' : 'var(--tt-dim)' }}>{s}s</button>)}</div>}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--tt-border)', background: 'var(--tt-panel)', borderRadius: '0 0 16px 16px' }}>
        <p style={{ fontSize: 10, color: 'var(--tt-dim)', margin: '0 0 6px', textAlign: 'center' }}>Import from</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowCloudModal('google')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--tt-border)', background: 'var(--tt-card)', color: 'var(--tt-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--tt-border)'; e.currentTarget.style.color = 'var(--tt-text)' }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--tt-card)'; e.currentTarget.style.color = 'var(--tt-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/><path d="M12 7c-2.76 0-5 2.24-5 5h5V7z" fill="#EA4335"/><path d="M7 12c0 2.76 2.24 5 5 5v-5H7z" fill="#FBBC04"/><path d="M12 17c2.76 0 5-2.24 5-5h-5v5z" fill="#34A853"/><path d="M17 12c0-2.76-2.24-5-5-5v5h5z" fill="#4285F4"/></svg>
            Google Photos ✦
          </button>
          <button onClick={() => setShowCloudModal('icloud')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--tt-border)', background: 'var(--tt-card)', color: 'var(--tt-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--tt-border)'; e.currentTarget.style.color = 'var(--tt-text)' }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--tt-card)'; e.currentTarget.style.color = 'var(--tt-muted)' }}>
            <svg width="14" height="10" viewBox="0 0 24 16"><path d="M19.35 6.04A7.49 7.49 0 0 0 12 0C9.11 0 6.6 1.64 5.35 4.04A5.994 5.994 0 0 0 0 10c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#3B82F6"/></svg>
            iCloud ✦
          </button>
        </div>
      </div>
      {showCloudModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowCloudModal(null)}>
          <div style={{ background: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{showCloudModal === 'google' ? '📸' : '☁️'}</div>
            <h3 style={{ color: 'var(--tt-text)', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{showCloudModal === 'google' ? 'Google Photos' : 'iCloud Photos'}</h3>
            <p style={{ color: 'var(--tt-muted)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>Connect your {showCloudModal === 'google' ? 'Google Photos' : 'iCloud'} to import photos directly into your frame. Available in the next update — for now, upload photos directly using the + Add button above.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#1A1B23', borderRadius: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--tt-muted)' }}>Notify me when available</span>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: 'var(--tt-accent)', position: 'relative', cursor: 'pointer' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, right: 2 }} /></div>
            </div>
            <button onClick={() => setShowCloudModal(null)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--tt-accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>Got it</button>
          </div>
        </div>
      )}
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
    <div className="overflow-hidden" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 8 }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2" style={{ backgroundColor: 'var(--tt-accent2)', padding: '11px 16px', border: 'none', cursor: 'pointer' }}>
        <Sparkles size={15} color="#fff" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>TEL TED AI Summary</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tt-accent2-deep)', backgroundColor: '#fff', borderRadius: 4, padding: '2px 8px' }}>{dayLabel}</span>
        {open ? <ChevronUp size={14} color="#fff" style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} color="#fff" style={{ marginLeft: 'auto' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-2.5" style={{ padding: '14px 16px' }}>
          {AI_HIGHLIGHTS.map((item, i) => (
            <div key={i} className="flex gap-2.5">
              <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'var(--tt-accent2)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <p style={{ fontSize: 12, color: 'var(--tt-body)', lineHeight: 1.55, margin: 0 }}>{item}</p>
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
    <PortalCard title="TEL TED Schedule" className="h-full" right={<span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tt-accent)', backgroundColor: '#fff', borderRadius: 4, padding: '2px 8px' }}>{TELTED_SCHEDULE.length} items</span>}>
      {TELTED_SCHEDULE.map(m => {
        const done = m.status === 'done', nowRow = m.status === 'now'
        return (
          <div key={m.id} className="flex items-center gap-3" style={nowRow ? { padding: '9px 8px', backgroundColor: 'var(--tt-accent-soft)', borderRadius: 6, margin: '2px 0' } : { padding: '9px 0', borderBottom: '1px solid var(--tt-rule)', opacity: done ? 0.45 : 1 }}>
            <div style={{ width: 44, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tt-text)' }}>{m.time}</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--tt-muted)' }}>{m.duration}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--tt-muted)' : 'var(--tt-text)', textDecoration: done ? 'line-through' : 'none', margin: 0 }}>{m.title}</p>
              <p style={{ fontSize: 11, color: 'var(--tt-muted)', margin: 0 }}>{m.type}</p>
            </div>
            {nowRow && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: 'var(--tt-brand)', borderRadius: 4, padding: '3px 7px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Now</span>}
          </div>
        )
      })}
    </PortalCard>
  )
}

// ─── TEL TED Overview (accordion) ────────────────────────────────────────────

function TelTedOverview() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <PortalCard title="TEL TED Overview" className="h-full" right={<span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>Since you were last here</span>}>
      {OVERVIEW_ITEMS.map(item => {
        const isOpen = expanded === item.id
        const Icon = item.Icon
        return (
          <div key={item.id} style={{ borderBottom: '1px solid var(--tt-rule)' }}>
            <button onClick={() => setExpanded(isOpen ? null : item.id)} className="w-full flex items-center gap-2.5 text-left" style={{ padding: '11px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} style={{ color: item.color }} />
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--tt-text)' }}>{item.label}</span>
              {item.urgent && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tt-red)', backgroundColor: 'var(--tt-red-soft)', borderRadius: 4, padding: '2px 7px' }}>Urgent</span>}
              <span style={{ fontSize: 15, fontWeight: 800, color: item.color, minWidth: 22, textAlign: 'right' }}>{item.count}</span>
              {isOpen ? <ChevronUp size={14} style={{ color: 'var(--tt-faint)' }} /> : <ChevronDown size={14} style={{ color: 'var(--tt-faint)' }} />}
            </button>
            {isOpen && item.messages.map(msg => (
              <div key={msg.id} style={{ backgroundColor: 'var(--tt-panel)', border: '1px solid var(--tt-rule)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: item.bg, color: item.color, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{msg.avatar}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tt-text)' }}>{msg.from}</span>
                  {msg.urgent && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--tt-red)', backgroundColor: 'var(--tt-red-soft)', borderRadius: 4, padding: '1px 6px' }}>Urgent</span>}
                  <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--tt-faint)', marginLeft: 'auto' }}>{msg.time}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tt-body)', marginBottom: 4 }}>{msg.subject}</div>
                <p style={{ fontSize: 12, color: 'var(--tt-muted)', lineHeight: 1.55, margin: 0 }}>{msg.preview}</p>
              </div>
            ))}
          </div>
        )
      })}
    </PortalCard>
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

  useEffect(() => { const start = new Date(new Date().getFullYear(), 0, 1).getTime(); const dayOfYear = Math.floor((Date.now() - start) / 86400000); setQuote(QUOTES[dayOfYear % QUOTES.length]) }, [])

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
          "James Hartley...",
          "Hmm, let me think.",
          "If you mean James Hartley, then I only have good words.",
          "Top man.",
          "Knows his stuff.",
          "Good looking too —",
          "I probably should stop there in case he is listening.",
          "I am starting to blush.",
        ]
        // 600ms pause before "If you mean James Hartley" (index 2), 150ms elsewhere
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
    <div style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 8, padding: '18px 22px' }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--tt-text)', letterSpacing: '-0.01em', margin: 0 }}>{greeting}, Sarah Mitchell</h1>
            <button onClick={handleBriefing} title="Read today's briefing" className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, backgroundColor: isPlaying ? 'var(--tt-accent-soft)' : 'var(--tt-card)', border: '1px solid var(--tt-border)', color: 'var(--tt-accent)', cursor: 'pointer' }}>
              <Volume2 size={15} strokeWidth={1.75} />
            </button>
            <button onClick={() => isListening ? stopListening() : startListening()} title={isListening ? 'Listening...' : 'Voice commands'} className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, cursor: 'pointer', backgroundColor: isListening ? 'var(--tt-red-soft)' : 'var(--tt-card)', border: '1px solid var(--tt-border)', color: isListening ? 'var(--tt-red)' : 'var(--tt-accent)' }}>
              <Mic size={14} strokeWidth={1.75} />
            </button>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--tt-muted)', margin: '0 0 8px' }}>{date} · Parkside Elementary · Oak Valley District</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600, color: 'var(--tt-green-deep)', backgroundColor: 'var(--tt-green-soft)', border: '1px solid var(--tt-green-border)', borderRadius: 6, padding: '2px 8px' }}><span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--tt-brand)' }} />EEF 5/5 Evidence Rating</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, fontStyle: 'italic', color: 'var(--tt-accent2-deep)', margin: 0 }}>&ldquo;{quote.text}&rdquo; &mdash; {quote.author}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {[
            { label: 'Children Assessed', value: 87, color: 'var(--tt-accent)' },
            { label: 'Schools Active', value: 6, color: 'var(--tt-accent2-deep)' },
            { label: 'Concerns Flagged', value: 14, color: 'var(--tt-red)' },
            { label: 'Reports Due', value: 3, color: 'var(--tt-brand)' },
          ].map(item => (
            <div key={item.label} style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 8, padding: '12px 16px', minWidth: 96, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: item.color, lineHeight: 1.1 }}>{item.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tt-muted)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TEL TED Resources (catalogue in src/data/telted/resources.ts) ──────────

function TelTedResourcesWrapper() {
  return (
    <div>
      <TelTedResourceLibrary />
      {/* Original Resources component with TEL TED branding */}
      <Resources isTelTed />
    </div>
  )
}

// ─── Coming Soon ─────────────────────────────────────────────────────────────

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--tt-accent-soft)' }}>
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--tt-text)' }}>{title}</h2>
      <p className="text-sm text-center max-w-md" style={{ color: 'var(--tt-dim)' }}>This section is coming soon as part of the TEL TED platform.</p>
    </div>
  )
}

// ─── TEL TED Settings ───────────────────────────────────────────────────────

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']

const SETTINGS_TABS = [
  { id: 'profile', label: 'School Profile', icon: '🏫' },
  { id: 'dashboard', label: 'Dashboard', icon: '🖥️' },
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
  const cardStyle: React.CSSProperties = { backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 16, padding: '24px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, backgroundColor: 'var(--tt-panel)', border: '1px solid var(--tt-border)', color: 'var(--tt-text)', fontSize: 14, outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--tt-muted)', marginBottom: 6 }
  const goldBtn: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, backgroundColor: '#C8960C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
  const tealBtn: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, backgroundColor: 'var(--tt-accent)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
  const blueBtn: React.CSSProperties = { padding: '10px 24px', borderRadius: 10, backgroundColor: '#2563EB', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
  const badge = (color: string, text: string) => <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>{text}</span>

  function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
    return (
      <label className="flex items-center gap-3 cursor-pointer py-2">
        <div onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: on ? 'var(--tt-accent)' : 'var(--tt-border2)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s' }} />
        </div>
        <span style={{ color: 'var(--tt-body)', fontSize: 14 }}>{label}</span>
      </label>
    )
  }

  // ── Tab: School Profile ──
  function ProfileTab() {
    const allGrades = ['Pre-K', 'K', '1', '2', '3', '4', '5']
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>School Profile</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Basic information about your school</p></div>
        <div style={cardStyle} className="space-y-5">
          <div><label style={labelStyle}>School Name</label><input style={inputStyle} value={schoolName} onChange={e => setSchoolName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label style={labelStyle}>District</label><input style={inputStyle} value={district} onChange={e => setDistrict(e.target.value)} /></div>
            <div><label style={labelStyle}>State</label><select style={{ ...inputStyle, appearance: 'auto' as any }} value={state} onChange={e => setState(e.target.value)}>{US_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div>
            <label style={labelStyle}>Grade Levels Served</label>
            <div className="flex flex-wrap gap-2">{allGrades.map(g => (
              <label key={g} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-sm" style={{ backgroundColor: grades.includes(g) ? 'var(--tt-accent-soft)' : 'var(--tt-panel)', border: `1px solid ${grades.includes(g) ? 'var(--tt-accent)' : 'var(--tt-border)'}`, color: grades.includes(g) ? 'var(--tt-accent-lt)' : 'var(--tt-muted)' }}>
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
        <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Single Sign-On</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Allow staff to log in with their existing school accounts. No separate passwords needed.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Google */}
          <div style={cardStyle}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335)', color: '#fff' }}>G</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold" style={{ color: 'var(--tt-text)' }}>Google Workspace for Education</h3>
                <p className="text-xs" style={{ color: 'var(--tt-dim)' }}>Staff sign in with their school Google accounts</p>
              </div>
              {badge('#F59E0B', 'Not configured')}
            </div>
            <button onClick={() => setGoogleExpanded(!googleExpanded)} className="text-xs font-medium mb-3" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{googleExpanded ? '▾ Hide fields' : '▸ Configure'}</button>
            {googleExpanded && (
              <div className="space-y-3 mt-2">
                <div><label style={labelStyle}>Google Workspace Domain</label><input style={inputStyle} value={googleDomain} onChange={e => setGoogleDomain(e.target.value)} placeholder="oakvalley.edu" /></div>
                <div><label style={labelStyle}>Client ID</label><input style={inputStyle} value={googleClientId} onChange={e => setGoogleClientId(e.target.value)} placeholder="Enter Client ID" /></div>
                <div><label style={labelStyle}>Client Secret</label><div className="relative"><input type={showGoogleSecret ? 'text' : 'password'} style={inputStyle} value={googleSecret} onChange={e => setGoogleSecret(e.target.value)} placeholder="Enter Client Secret" /><button onClick={() => setShowGoogleSecret(!showGoogleSecret)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--tt-dim)', fontSize: 12, cursor: 'pointer' }}>{showGoogleSecret ? 'Hide' : 'Show'}</button></div></div>
                <button style={blueBtn} onClick={() => fireToast('Google SSO configuration saved')}>Configure Google SSO</button>
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: 'var(--tt-faint)' }}>Requires Google Workspace for Education account</p>
          </div>
          {/* Microsoft */}
          <div style={cardStyle}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(0,120,212,0.15)', border: '1px solid rgba(0,120,212,0.3)' }}>
                <div className="grid grid-cols-2 gap-0.5" style={{ width: 18, height: 18 }}><div style={{ backgroundColor: '#F25022', borderRadius: 1 }} /><div style={{ backgroundColor: '#7FBA00', borderRadius: 1 }} /><div style={{ backgroundColor: '#00A4EF', borderRadius: 1 }} /><div style={{ backgroundColor: '#FFB900', borderRadius: 1 }} /></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold" style={{ color: 'var(--tt-text)' }}>Microsoft 365 / Azure AD</h3>
                <p className="text-xs" style={{ color: 'var(--tt-dim)' }}>Staff sign in with their Microsoft school accounts</p>
              </div>
              {badge('#F59E0B', 'Not configured')}
            </div>
            <button onClick={() => setMsExpanded(!msExpanded)} className="text-xs font-medium mb-3" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{msExpanded ? '▾ Hide fields' : '▸ Configure'}</button>
            {msExpanded && (
              <div className="space-y-3 mt-2">
                <div><label style={labelStyle}>Azure Tenant ID</label><input style={inputStyle} value={azureTenant} onChange={e => setAzureTenant(e.target.value)} placeholder="Enter Tenant ID" /></div>
                <div><label style={labelStyle}>Application (Client) ID</label><input style={inputStyle} value={azureClientId} onChange={e => setAzureClientId(e.target.value)} placeholder="Enter Client ID" /></div>
                <div><label style={labelStyle}>Client Secret</label><div className="relative"><input type={showAzureSecret ? 'text' : 'password'} style={inputStyle} value={azureSecret} onChange={e => setAzureSecret(e.target.value)} placeholder="Enter Client Secret" /><button onClick={() => setShowAzureSecret(!showAzureSecret)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--tt-dim)', fontSize: 12, cursor: 'pointer' }}>{showAzureSecret ? 'Hide' : 'Show'}</button></div></div>
                <button style={blueBtn} onClick={() => fireToast('Microsoft SSO configuration saved')}>Configure Microsoft SSO</button>
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: 'var(--tt-faint)' }}>Requires Microsoft 365 Education subscription</p>
          </div>
        </div>
        {/* SSO benefits */}
        <div style={{ ...cardStyle, borderColor: '#C8960C40', background: 'linear-gradient(135deg, rgba(200,150,12,0.06), rgba(200,150,12,0.02))' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: '#C8960C' }}>SSO Benefits</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--tt-muted)' }}>When SSO is enabled: Staff log in with one click using their existing school account. No forgotten passwords. No separate Lumio credentials. Works with Google Classroom and Microsoft Teams integrations.</p>
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
        <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Rostering</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Automatically sync your student and staff rosters from your district&apos;s systems.</p></div>
        <div className="space-y-4">
          {/* OneRoster */}
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-2"><h3 className="text-sm font-bold" style={{ color: 'var(--tt-text)' }}>OneRoster (IMS Global Standard)</h3>{badge('#22C55E', 'Recommended')}</div>
            <p className="text-xs mb-4" style={{ color: 'var(--tt-dim)' }}>Automatically sync students, teachers, classes, and enrollments using the OneRoster 1.1 standard.</p>
            <div className="space-y-3">
              <div><label style={labelStyle}>OneRoster API URL</label><input style={inputStyle} value={rosterUrl} onChange={e => setRosterUrl(e.target.value)} placeholder="https://your-district.oneroster.com/api" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={labelStyle}>Client ID</label><input style={inputStyle} value={rosterClientId} onChange={e => setRosterClientId(e.target.value)} /></div>
                <div><label style={labelStyle}>Client Secret</label><input type="password" style={inputStyle} value={rosterSecret} onChange={e => setRosterSecret(e.target.value)} /></div>
              </div>
              <div><label style={labelStyle}>Sync Frequency</label><select style={{ ...inputStyle, appearance: 'auto' as any, maxWidth: 200 }} value={rosterFreq} onChange={e => setRosterFreq(e.target.value)}><option>Daily</option><option>Weekly</option><option>Manual</option></select></div>
              <button style={tealBtn} onClick={() => fireToast('OneRoster connection saved')}>Connect OneRoster</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">{compatibleSystems.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--tt-border)', color: 'var(--tt-muted)' }}>{s}</span>)}</div>
          </div>
          {/* Clever */}
          <div style={cardStyle}>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--tt-text)' }}>Clever</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--tt-dim)' }}>Sync via Clever&apos;s rostering platform. Common in US districts.</p>
            {cleverConnected ? badge('#22C55E', 'Connected') : <button style={{ ...tealBtn, backgroundColor: '#F26B21' }} onClick={() => { setCleverConnecting(true); setTimeout(() => { setCleverConnecting(false); setCleverConnected(true) }, 2000) }}>{cleverConnecting ? 'Connecting...' : 'Connect with Clever'}</button>}
            <p className="text-xs mt-2" style={{ color: 'var(--tt-faint)' }}>Requires your district to have Clever configured</p>
          </div>
          {/* CSV */}
          <div style={cardStyle}>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--tt-text)' }}>CSV Import</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--tt-dim)' }}>Upload a CSV file of students and staff. Use this if your district doesn&apos;t support OneRoster or Clever.</p>
            <div className="flex gap-2">
              <button style={tealBtn} onClick={() => fireToast('Template downloaded')}>Download CSV Template</button>
              <button style={{ ...tealBtn, backgroundColor: 'var(--tt-border2)' }} onClick={() => fireToast('Upload coming soon')}>Upload CSV</button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--tt-faint)' }}>Accepted: .csv files with headers: name, grade, class, dob, ell_status, frl_status</p>
          </div>
        </div>
        {/* Sync status */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--tt-text)' }}>Sync Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><p className="text-xs" style={{ color: 'var(--tt-dim)' }}>Last synced</p><p className="text-sm font-semibold" style={{ color: 'var(--tt-text)' }}>Never</p></div>
            <div><p className="text-xs" style={{ color: 'var(--tt-dim)' }}>Next scheduled</p><p className="text-sm font-semibold" style={{ color: 'var(--tt-text)' }}>Not configured</p></div>
            <div><p className="text-xs" style={{ color: 'var(--tt-dim)' }}>Students</p><p className="text-sm font-semibold" style={{ color: 'var(--tt-text)' }}>28</p></div>
            <div><p className="text-xs" style={{ color: 'var(--tt-dim)' }}>Staff</p><p className="text-sm font-semibold" style={{ color: 'var(--tt-text)' }}>4</p></div>
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
        <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Voice & Audio Settings</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Customise how Lumio speaks to you. All voices use ElevenLabs or Web Speech API.</p></div>
        {/* Wake word */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--tt-text)' }}>Wake Word</h3>
          <div className="flex items-center gap-3">
            <input style={{ ...inputStyle, maxWidth: 200 }} value={wakeWord} onChange={e => setWakeWord(e.target.value)} />
            <button style={goldBtn} onClick={() => fireToast('Wake word saved')}>Save</button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--tt-faint)' }}>Say &quot;{wakeWord}&quot; followed by your question</p>
        </div>
        {/* Voice selection */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--tt-text)' }}>Choose Your Preferred Voice</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VOICE_OPTIONS.map(v => (
              <div key={v.id} className="rounded-xl p-4 cursor-pointer transition-all" onClick={() => handleSelectVoice(v.id)}
                style={{ backgroundColor: selectedVoice === v.id ? 'rgba(200,150,12,0.08)' : 'var(--tt-panel)', border: `1px solid ${selectedVoice === v.id ? '#C8960C' : 'var(--tt-border)'}` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--tt-text)' }}>{v.name}</span>
                    {v.premium && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: 'rgba(200,150,12,0.15)', color: '#C8960C' }}>Premium</span>}
                  </div>
                  {selectedVoice === v.id && <span style={{ color: '#C8960C', fontSize: 16 }}>✓</span>}
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--tt-dim)' }}>{v.desc}</p>
                <button onClick={(e) => { e.stopPropagation(); previewVoice(v.id) }} className="text-xs font-medium" style={{ color: 'var(--tt-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>▶ Preview</button>
              </div>
            ))}
          </div>
        </div>
        {/* Speech settings */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--tt-text)' }}>Speech Settings</h3>
          <div className="space-y-4">
            <div><label style={labelStyle}>Speaking Rate: {speakRate.toFixed(1)}</label><input type="range" min="0.7" max="1.3" step="0.1" value={speakRate} onChange={e => setSpeakRate(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--tt-accent)' }} /></div>
            <div><label style={labelStyle}>Pitch: {speakPitch.toFixed(1)}</label><input type="range" min="0.8" max="1.2" step="0.1" value={speakPitch} onChange={e => setSpeakPitch(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--tt-accent)' }} /></div>
            <div><label style={labelStyle}>Volume: {speakVolume.toFixed(1)}</label><input type="range" min="0" max="1" step="0.1" value={speakVolume} onChange={e => setSpeakVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--tt-accent)' }} /></div>
            <button style={tealBtn} onClick={testCurrentSettings}>Test Current Settings</button>
          </div>
        </div>
        {/* Voice commands */}
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--tt-text)' }}>Voice Commands</h3>
          <div className="space-y-1">
            <Toggle on={voiceEnabled} onToggle={() => setVoiceEnabled(!voiceEnabled)} label="Voice commands enabled" />
            <Toggle on={audioResponses} onToggle={() => setAudioResponses(!audioResponses)} label="Play audio responses" />
            <Toggle on={showTextCard} onToggle={() => setShowTextCard(!showTextCard)} label="Show text response card alongside audio" />
            <Toggle on={autoListen} onToggle={() => setAutoListen(!autoListen)} label="Auto-listen after wake word detected" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--tt-dim)' }}>RECOGNISED COMMANDS</p>
            <div className="space-y-1">
              {[
                { cmd: '"TEL TED sessions today"', desc: 'Lists today\'s scheduled sessions' },
                { cmd: '"Language Screen / who needs assessing"', desc: 'Students due for LanguageScreen' },
                { cmd: '"What week are we on"', desc: 'Current programme week & progress' },
                { cmd: '"What do you think of Andrew" 😄', desc: 'Easter egg' },
              ].map(c => (
                <div key={c.cmd} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ backgroundColor: 'var(--tt-panel)' }}>
                  <code className="text-xs" style={{ color: 'var(--tt-accent-lt)' }}>{c.cmd}</code>
                  <span className="text-xs" style={{ color: 'var(--tt-faint)' }}>— {c.desc}</span>
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
          <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Staff & Users</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Manage who has access to the TEL TED portal</p></div>
          <button style={tealBtn} onClick={() => setShowInviteModal(true)}>+ Invite Staff Member</button>
        </div>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--tt-border)' }}>
              {['Name', 'Role', 'Email', 'SSO Status', 'Access Level', 'Actions'].map(h => <th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{ color: 'var(--tt-dim)' }}>{h}</th>)}
            </tr></thead>
            <tbody>{SETTINGS_STAFF.map((s, i) => (
              <tr key={i} style={{ borderBottom: i < SETTINGS_STAFF.length - 1 ? '1px solid var(--tt-border)' : 'none' }}>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--tt-text)' }}>{s.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--tt-muted)' }}>{s.role}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--tt-muted)' }}>{s.email}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--tt-faint)' }}>—</td>
                <td className="px-4 py-3">{badge(s.access === 'Admin' ? '#C8960C' : 'var(--tt-accent)', s.access)}</td>
                <td className="px-4 py-3"><button className="text-xs" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}>Edit</button><button className="text-xs" style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ ...cardStyle, borderColor: 'var(--tt-border)80' }}>
          <p className="text-xs" style={{ color: 'var(--tt-dim)' }}><strong style={{ color: 'var(--tt-muted)' }}>Admin:</strong> full access&ensp;|&ensp;<strong style={{ color: 'var(--tt-muted)' }}>Teacher:</strong> classes + reports&ensp;|&ensp;<strong style={{ color: 'var(--tt-muted)' }}>Staff:</strong> assessment + sessions only&ensp;|&ensp;<strong style={{ color: 'var(--tt-muted)' }}>View only:</strong> reports only</p>
        </div>
        {/* Invite modal */}
        {showInviteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowInviteModal(false)}>
            <div style={{ ...cardStyle, width: 420, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--tt-text)' }}>Invite Staff Member</h3>
              <div className="space-y-3">
                <div><label style={labelStyle}>Name</label><input style={inputStyle} value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name" /></div>
                <div><label style={labelStyle}>Email</label><input style={inputStyle} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@school.edu" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label style={labelStyle}>Role</label><select style={{ ...inputStyle, appearance: 'auto' as any }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}><option>Teacher</option><option>TA</option><option>SENCO</option><option>Admin</option></select></div>
                  <div><label style={labelStyle}>Access Level</label><select style={{ ...inputStyle, appearance: 'auto' as any }} value={inviteAccess} onChange={e => setInviteAccess(e.target.value)}><option>Admin</option><option>Teacher</option><option>Staff</option><option>View only</option></select></div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button style={{ ...tealBtn, backgroundColor: 'var(--tt-border2)' }} onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button style={tealBtn} onClick={() => { setShowInviteModal(false); fireToast(`Invite sent to ${inviteEmail || 'staff member'}`) }}>Send Invite</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Tab: Notifications ──
  function DashboardTab() {
    const prefs = useDashPrefs()
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Dashboard</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Choose what appears on the Today page</p></div>
        <div style={cardStyle}>
          <Toggle on={prefs.welcomePage} onToggle={() => setDashPrefs({ welcomePage: !prefs.welcomePage })} label="Welcome page — show the portal landing page when you sign in" />
          <p className="text-xs mt-2 mb-4" style={{ color: 'var(--tt-dim)' }}>On by default. Shows the five portal areas with live counts and today’s notices; “Go to my dashboard” skips it for the rest of the session. You can reopen it any time by clicking the school name in the sidebar.</p>
          <Toggle on={prefs.photoFrame} onToggle={() => setDashPrefs({ photoFrame: !prefs.photoFrame })} label="Photo Frame — show a classroom photo slideshow on the Today page" />
          <p className="text-xs mt-2" style={{ color: 'var(--tt-dim)' }}>Off by default. When on, it sits below the AI Summary and supports uploads, Google Photos and iCloud.</p>
        </div>
      </div>
    )
  }

  function NotificationsTab() {
    return (
      <div className="space-y-6">
        <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Notifications</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Control when and how you receive alerts</p></div>
        <div style={cardStyle}>
          <Toggle on={dailySummary} onToggle={() => setDailySummary(!dailySummary)} label="Daily TEL TED AI Summary (morning briefing)" />
          <Toggle on={atRiskAlerts} onToggle={() => setAtRiskAlerts(!atRiskAlerts)} label="Student at-risk alerts (score below threshold)" />
          <Toggle on={sessionReminders} onToggle={() => setSessionReminders(!sessionReminders)} label="Session reminders (30 min before scheduled session)" />
          <Toggle on={assessmentReminders} onToggle={() => setAssessmentReminders(!assessmentReminders)} label="Assessment due reminders" />
          <Toggle on={weeklyDigest} onToggle={() => setWeeklyDigest(!weeklyDigest)} label="Weekly progress digest email" />
          <Toggle on={parentReminders} onToggle={() => setParentReminders(!parentReminders)} label="Parent communication reminders" />
        </div>
        <div style={cardStyle} className="space-y-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--tt-text)' }}>Notification Delivery</h3>
          <div><label style={labelStyle}>Email</label><input style={{ ...inputStyle, maxWidth: 300 }} value={notifEmail} onChange={e => setNotifEmail(e.target.value)} /></div>
          <p className="text-xs" style={{ color: 'var(--tt-dim)' }}>In-app notifications: always on</p>
        </div>
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--tt-text)' }}>Quiet Hours</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--tt-dim)' }}>From</span>
            <input type="time" style={{ ...inputStyle, maxWidth: 130 }} value={quietFrom} onChange={e => setQuietFrom(e.target.value)} />
            <span className="text-xs" style={{ color: 'var(--tt-dim)' }}>to</span>
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
        <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Integrations</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Connect your tools and platforms</p></div>
        <div className="space-y-3">
          {integrations.map(ig => {
            const connected = connectedIntegrations[ig.key]
            const connecting = connectingIntegration === ig.key
            return (
              <div key={ig.key} style={cardStyle} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: connected ? 'var(--tt-accent-soft)' : 'var(--tt-border)' }}>{ig.icon}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--tt-text)' }}>{ig.name}</p>
                    <p className="text-xs" style={{ color: 'var(--tt-dim)' }}>{ig.desc}</p>
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
        <div><h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Data & Privacy</h2><p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Data residency, compliance, and export controls</p></div>
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--tt-text)' }}>Data Residency</h3>
          <p className="text-sm" style={{ color: 'var(--tt-body)' }}>Current: <span className="font-semibold">European Union (eu-west-2)</span> 🇪🇺</p>
          <p className="text-xs mt-1" style={{ color: 'var(--tt-faint)' }}>To request US data residency, contact support.</p>
        </div>
        <div style={cardStyle} className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--tt-text)' }}>Compliance</h3>
          <div className="flex items-center gap-2"><span style={{ color: '#22C55E' }}>✓</span><span className="text-sm" style={{ color: 'var(--tt-body)' }}>FERPA Compliant</span></div>
          <p className="text-xs" style={{ color: 'var(--tt-dim)' }}>Student data is never sold or shared with third parties. All data encrypted at rest and in transit.</p>
          <div className="flex items-center gap-2"><span style={{ color: '#22C55E' }}>✓</span><span className="text-sm" style={{ color: 'var(--tt-body)' }}>COPPA Compliant for students under 13</span></div>
        </div>
        <div style={cardStyle} className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--tt-text)' }}>Data Export</h3>
          <div className="flex gap-2">
            <button style={tealBtn} onClick={() => fireToast('Export initiated — you will receive a download link by email')}>Export All School Data</button>
            <button style={{ ...tealBtn, backgroundColor: 'var(--tt-border2)' }} onClick={() => fireToast('Student records CSV downloading...')}>Export Student Records</button>
          </div>
        </div>
        <div style={cardStyle}>
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--tt-text)' }}>Data Deletion</h3>
          {!showDeleteConfirm ? (
            <button style={{ ...tealBtn, backgroundColor: 'var(--tt-border2)' }} onClick={() => setShowDeleteConfirm(true)}>Request Data Deletion</button>
          ) : (
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#EF4444' }}>Are you sure?</p>
              <p className="text-xs mb-3" style={{ color: 'var(--tt-muted)' }}>This will permanently delete all school data including student records, assessment history, and session data. This action cannot be undone.</p>
              <div className="flex gap-2">
                <button style={{ ...tealBtn, backgroundColor: '#EF4444' }} onClick={() => { setShowDeleteConfirm(false); fireToast('Deletion request submitted — support will be in touch') }}>Confirm Deletion</button>
                <button style={{ ...tealBtn, backgroundColor: 'var(--tt-border2)' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--tt-faint)' }}>Support contact: support@lumiocms.com</p>
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
      case 'dashboard': return <DashboardTab />
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
            style={{ backgroundColor: activeTab === tab.id ? 'var(--tt-accent-soft)' : 'transparent', color: activeTab === tab.id ? 'var(--tt-accent)' : 'var(--tt-muted)', fontWeight: activeTab === tab.id ? 600 : 400, border: activeTab === tab.id ? '1px solid var(--tt-accent-border)' : '1px solid transparent' }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>
      {/* Right content */}
      <div className="flex-1 min-w-0 py-2 max-w-3xl">
        {renderTab()}
      </div>
      {/* Toast */}
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: 12, backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', color: '#22C55E', fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>{toast}</div>}
    </div>
  )
}

// ─── District Overview (now in DistrictDashboard component) ──────────────────

// ─── Inspection Mode ─────────────────────────────────────────────────────────

function InspectionModeSection() {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--tt-accent-soft)' }}>
            <Shield size={24} style={{ color: 'var(--tt-accent)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--tt-text)' }}>Inspection Mode</h2>
            <p className="text-sm" style={{ color: 'var(--tt-dim)' }}>Prepare evidence for district or state inspection. All TEL TED data organised into inspection-ready packs.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Language & Literacy Evidence', icon: '📖' },
            { label: 'Intervention Impact Report', icon: '📊' },
            { label: 'Student Progress Pack', icon: '📈' },
            { label: 'Staff Training Records', icon: '🎓' },
          ].map(pack => (
            <button key={pack.label} className="flex items-center gap-3 rounded-xl p-4 text-left transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--tt-panel)', border: '1px solid var(--tt-border)' }}>
              <span className="text-2xl">{pack.icon}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--tt-text)' }}>{pack.label}</span>
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
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)' }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--tt-text)' }}>Rostering</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--tt-dim)' }}>Manage student groups, session schedules and TEL TED assignments</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--tt-panel)', border: '1px solid var(--tt-border)' }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--tt-accent)' }}>Group A</h3>
            <div className="space-y-1">
              {groupA.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 text-xs py-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: 'var(--tt-accent-soft)', color: 'var(--tt-accent)' }}>{p.name.split(' ').map((w: string) => w[0]).join('')}</div>
                  <span style={{ color: 'var(--tt-text)' }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--tt-panel)', border: '1px solid var(--tt-border)' }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: '#B45309' }}>Group B</h3>
            <div className="space-y-1">
              {groupB.length > 0 ? groupB.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 text-xs py-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: 'rgba(180,83,9,0.15)', color: '#B45309' }}>{p.name.split(' ').map((w: string) => w[0]).join('')}</div>
                  <span style={{ color: 'var(--tt-text)' }}>{p.name}</span>
                </div>
              )) : <p className="text-xs" style={{ color: 'var(--tt-dim)' }}>No students in Group B yet</p>}
            </div>
          </div>
        </div>
        {/* Weekly Grid */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--tt-panel)', border: '1px solid var(--tt-border)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--tt-text)' }}>Weekly Schedule</h3>
          <div className="grid grid-cols-5 gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <div key={day} className="text-center">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--tt-dim)' }}>{day}</p>
                <div className="space-y-1">
                  <div className="rounded-lg px-2 py-1.5 text-xs" style={{ backgroundColor: 'var(--tt-accent-soft)', color: 'var(--tt-accent)' }}>Group A</div>
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

// ─── Reports Panel (full renderer in src/components/telted/TelTedReports.tsx) ─

function ReportsPanel({ initialReportId }: { initialReportId?: string | null }) {
  return <TelTedReportsPanel initialReportId={initialReportId} />
}

// ─── Staff Tab ───────────────────────────────────────────────────────────────

function StaffTabContent() {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)' }}>
      <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--tt-text)' }}>👥 Staff Overview</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Staff in today', value: '4 / 6', color: 'var(--tt-accent)' },
          { label: 'On cover', value: '1', color: '#F59E0B' },
          { label: 'CPD due this term', value: '3 staff', color: '#A78BFA' },
          { label: 'Reviews this week', value: '2', color: '#60A5FA' },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: 'var(--tt-panel)', border: '1px solid var(--tt-border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--tt-dim)' }}>{s.label}</p>
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
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)' }}>
      <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--tt-text)' }}>🔴 Don&apos;t Miss</h3>
      <div className="space-y-2">
        {[
          { text: 'LanguageScreen reassessment overdue — 3 students', level: 'critical' },
          { text: 'Amara Johnson below threshold — review intervention plan', level: 'critical' },
          { text: 'TEL TED Week 17 materials not uploaded', level: 'warning' },
          { text: 'Parent updates due for 3 families this week', level: 'warning' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: item.level === 'critical' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${item.level === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`, borderLeft: `3px solid ${item.level === 'critical' ? '#EF4444' : '#F59E0B'}` }}>
            <span className="text-sm flex-1" style={{ color: 'var(--tt-text)' }}>{item.text}</span>
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

// ─── Theme palettes (CSS variables consumed by every TEL TED component) ────
// 'light' matches the OxEd & Assessment admin portal: white ground, one blue accent, grey borders.
// 'dark' is the original TEL TED look, kept for contrast in demos.
export const TT_THEMES = {
  light: {
    '--tt-bg': '#F1F3F6', '--tt-panel': '#F8F9FB', '--tt-card': '#FFFFFF', '--tt-border': '#DEE2E6', '--tt-border2': '#CDD3DB',
    '--tt-text': '#212529', '--tt-body': '#343A40', '--tt-muted': '#5A6478', '--tt-dim': '#6C757D', '--tt-faint': '#ADB5BD',
    '--tt-accent': '#1778F2', '--tt-accent-lt': '#0B5ED7', '--tt-accent-soft': '#E7F1FE', '--tt-hover': '#F1F3F6',
    '--tt-green': '#2E9E5B', '--tt-amber': '#D97706', '--tt-red': '#DC3545', '--tt-blue': '#1778F2', '--tt-purple': '#7048E8', '--tt-gold': '#128091',
    '--tt-green-soft': '#E6F5EC', '--tt-amber-soft': '#FFF4E0', '--tt-red-soft': '#FDECEE', '--tt-blue-soft': '#E7F1FE',
    '--tt-brand': '#5CA131', '--tt-shadow': '0 1px 3px rgba(33,37,41,0.06), 0 6px 20px rgba(33,37,41,0.05)',
    '--tt-accent2': '#17A2B5', '--tt-accent2-deep': '#128091', '--tt-accent2-soft': '#E2F3F5', '--tt-accent2-border': '#A9DDE3', '--tt-accent-border': '#B6D4FB',
    '--tt-rule': '#EDF0F3', '--tt-green-deep': '#3D7517', '--tt-green-border': '#CBE3B4',
    '--tt-sidebar': '#1778F2', '--tt-sidebar-text': 'rgba(255,255,255,0.82)', '--tt-sidebar-muted': 'rgba(255,255,255,0.6)', '--tt-sidebar-active': '#FFFFFF', '--tt-sidebar-active-bg': 'rgba(255,255,255,0.18)', '--tt-sidebar-border': 'rgba(255,255,255,0.18)', '--tt-sidebar-hover': 'rgba(255,255,255,0.10)',
  },
  dark: {
    '--tt-bg': '#07080F', '--tt-panel': '#0A0B10', '--tt-card': '#111318', '--tt-border': '#1F2937', '--tt-border2': '#374151',
    '--tt-text': '#F9FAFB', '--tt-body': '#D1D5DB', '--tt-muted': '#9CA3AF', '--tt-dim': '#6B7280', '--tt-faint': '#4B5563',
    '--tt-accent': '#0D9488', '--tt-accent-lt': '#2DD4BF', '--tt-accent-soft': 'rgba(13,148,136,0.12)', '--tt-hover': 'rgba(255,255,255,0.04)',
    '--tt-green': '#22C55E', '--tt-amber': '#F59E0B', '--tt-red': '#EF4444', '--tt-blue': '#60A5FA', '--tt-purple': '#A78BFA', '--tt-gold': '#FBBF24',
    '--tt-green-soft': 'rgba(34,197,94,0.12)', '--tt-amber-soft': 'rgba(245,158,11,0.12)', '--tt-red-soft': 'rgba(239,68,68,0.12)', '--tt-blue-soft': 'rgba(96,165,250,0.12)',
    '--tt-brand': '#0D9488', '--tt-shadow': 'none',
    '--tt-accent2': '#C8960C', '--tt-accent2-deep': '#C8960C', '--tt-accent2-soft': 'rgba(200,150,12,0.15)', '--tt-accent2-border': 'rgba(200,150,12,0.3)', '--tt-accent-border': 'rgba(13,148,136,0.4)',
    '--tt-rule': '#1F2937', '--tt-green-deep': '#22C55E', '--tt-green-border': 'rgba(34,197,94,0.3)',
    '--tt-sidebar': '#07080F', '--tt-sidebar-text': '#9CA3AF', '--tt-sidebar-muted': '#6B7280', '--tt-sidebar-active': '#F9FAFB', '--tt-sidebar-active-bg': '#0D9488', '--tt-sidebar-border': '#1E2E45', '--tt-sidebar-hover': '#111318',
  },
} as const
export type TTTheme = keyof typeof TT_THEMES

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
  const [pendingReport, setPendingReport] = useState<string | null>(null)
  const [theme, setTheme] = useState<TTTheme>('light')
  const dash = useDashPrefs()
  // Last non-partner page the user was on, so "Back to School View" restores context
  const [lastSchoolPage, setLastSchoolPage] = useState('overview')
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  useUsTerminology(mainRef)

  // NELI portal state
  const [selectedPupil, setSelectedPupil] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [assessingPupil, setAssessingPupil] = useState<any>(null)
  const [assessingDemo, setAssessingDemo] = useState(false)
  // Recorded LanguageScreen results — applied onto the demo PUPILS data and persisted per tenant
  const [dataVersion, setDataVersion] = useState(0)
  const storageKey = `telted-assessments:${pathname?.split('/')[2] || 'demo'}`
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      let touched = false
      for (const p of PUPILS as any[]) { const r = saved[p.id]; if (r) { applyResult(p, r); touched = true } }
      if (touched) setDataVersion(v => v + 1)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])
  function applyResult(p: any, r: any) {
    p.es = r.standardScore
    if (r.subscores) p.subscores = { ...p.subscores, ...r.subscores }
    p.lastAssessed = r.date
    p.assessments = [...(p.assessments || []).filter((a: any) => a.date !== r.date), r]
  }
  function recordAssessment(report: any) {
    if (!assessingPupil) return
    const pct = (id: string) => { const st = (report.subtestScores || []).find((x: any) => x.id === id); return st ? st.pctRaw : null }
    // Map subtest % correct onto a standard-score scale around the overall score
    const toSS = (v: number | null) => v == null ? null : Math.round(report.standardScore + (v - 50) * 0.3)
    const subscores: Record<string, number> = {}
    const map: Record<string, string> = { rv: 'recVocab', ev: 'expVocab', sr: 'grammar', narr: 'listening' }
    for (const [id, key] of Object.entries(map)) { const v = toSS(pct(id)); if (v != null) subscores[key] = v }
    const r = { date: report.date || new Date().toISOString().slice(0, 10), standardScore: report.standardScore, percentile: report.percentile, band: report.band, totalRaw: report.totalRaw, assessor: report.assessor, subscores }
    const p = (PUPILS as any[]).find(x => x.id === assessingPupil.id)
    if (p) applyResult(p, r)
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); saved[assessingPupil.id] = r; localStorage.setItem(storageKey, JSON.stringify(saved)) } catch {}
    setDataVersion(v => v + 1)
    setVoiceToast({ text: `LanguageScreen recorded for ${assessingPupil.name}: standard score ${report.standardScore} (${report.percentile}th percentile, ${report.band}). Profile, class dashboard and reports updated.` })
  }
  const [neliSubTab, setNeliSubTab] = useState<'dashboard' | 'languagescreen' | 'tracker'>('dashboard')
  const [insightsSubTab, setInsightsSubTab] = useState<'school' | 'network'>('school')
  const [voiceToast, setVoiceToast] = useState<VoiceToastData | null>(null)

  // ── Welcome / landing page ──
  // Shown once per browser session when the Settings → Dashboard toggle is on. Decided in an
  // effect (not initial state) so the server and first client render agree.
  const [welcomeLast, setWelcomeLast] = useState<WelcomeLast>(null)
  useEffect(() => {
    try {
      if (dashPrefs.welcomePage && !sessionStorage.getItem('telted_welcome_seen')) {
        setWelcomeLast(JSON.parse(localStorage.getItem('telted_last_page') || 'null'))
        setSidebarPage('welcome')
      }
    } catch {}
  }, [])
  // Remember the last place the user worked so the welcome page can offer "continue where you left off"
  useEffect(() => {
    if (sidebarPage === 'welcome') return
    const navLabel = SIDEBAR_NAV.find(n => n.id === sidebarPage)?.label
    const tabLabel = TABS.find(t => t.id === activeTab)?.label
    const entry: WelcomeLast = sidebarPage === 'overview'
      ? (activeTab === 'today' ? null : { label: tabLabel || activeTab, target: { kind: 'tab', tab: activeTab }, at: Date.now() })
      : navLabel ? { label: navLabel, target: { kind: 'page', page: sidebarPage }, at: Date.now() } : null
    try { if (entry) localStorage.setItem('telted_last_page', JSON.stringify(entry)) } catch {}
  }, [sidebarPage, activeTab])
  function openWelcome() {
    try { setWelcomeLast(JSON.parse(localStorage.getItem('telted_last_page') || 'null')) } catch {}
    setSidebarPage('welcome')
  }
  function leaveWelcome() { try { sessionStorage.setItem('telted_welcome_seen', '1') } catch {} }
  function handleWelcomeOpen(t: WelcomeTarget) {
    leaveWelcome()
    if (t.kind === 'assess') { setSidebarPage('overview'); setActiveTab('today'); setAssessingPupil(PUPILS[0]) }
    else if (t.kind === 'tab') { setSidebarPage('overview'); setActiveTab(t.tab) }
    else if (t.kind === 'page') { setSidebarPage(t.page) }
    else if (t.kind === 'report') { setPendingReport(t.report); setSidebarPage('overview'); setActiveTab('reports') }
  }
  // Students flagged in the Overview as not yet assessed this term, minus any assessed live in this portal
  const welcomeUnassessed = (PUPILS as any[]).filter(p => ['Ruby Taylor', 'Oliver Barnes', 'Lily Thompson', 'Samuel Green'].includes(p.name) && !(p.assessments || []).some((a: any) => String(a.date) >= '2026-08-01'))
  const welcomeNotices: WelcomeNotice[] = (() => {
    const unassessed = welcomeUnassessed
    const atRisk = (PUPILS as any[]).filter(p => p.neli && p.es < 90)
    const n: WelcomeNotice[] = []
    if (unassessed.length) n.push({ tone: 'alert', text: `${unassessed.length} TEL TED students have not been assessed with LanguageScreen this term — ${unassessed.slice(0, 3).map(p => p.name.split(' ')[0]).join(', ')}${unassessed.length > 3 ? ' and more' : ''}.`, target: { kind: 'tab', tab: 'languagescreen' }, cta: 'See who' })
    if (atRisk.length) n.push({ tone: 'due', text: `${atRisk.length} students are scoring below the age-expected standard (90). Progress reports for the district are due Friday, September 19.`, target: { kind: 'report', report: 'at-risk' }, cta: 'At-risk report' })
    n.push({ tone: 'info', text: 'New this term: Sentence Repetition now listens to the student and scores automatically, and the assessor voice can be switched between Ms. Matilda and Mr. Brian.', target: { kind: 'tab', tab: 'languagescreen' }, cta: 'Try it' })
    return n
  })()
  const welcomeCards = buildWelcomeCards({
    assessmentsDue: welcomeUnassessed.length,
    reportsDue: 3,
    trainingPct: 68,
    resources: TELTED_FILE_COUNT,
  })

  // Shared NELI components read the mutable `T` theme object — point it at the theme variables
  T.bg = 'var(--tt-bg)'; T.card = 'var(--tt-card)'; T.border = 'var(--tt-border)'
  T.text = 'var(--tt-text)'; T.muted = 'var(--tt-muted)'; T.light = 'var(--tt-panel)'
  T.goldLight = theme === 'dark' ? 'rgba(200,150,12,0.15)' : '#FBF3DA'
  T.greenBg = 'var(--tt-green-soft)'; T.amberBg = 'var(--tt-amber-soft)'
  T.redBg = 'var(--tt-red-soft)'; T.blueBg = 'var(--tt-blue-soft)'
  T.purpleBg = theme === 'dark' ? 'rgba(124,58,237,0.12)' : '#F1ECFF'

  const expanded = pinned || hovered
  const sidebarW = expanded ? EXPANDED_W : COLLAPSED_W

  // Partner-scoped nav (RGR portfolio) was removed from the school sidebar — the page still renders
  // it if navigated to directly, but there is no partner section for a school user.
  const partner = partnerForSlug(pathname?.split('/')[2])
  const availableNav = SIDEBAR_NAV
  const activeNavItem = SIDEBAR_NAV.find(n => n.id === sidebarPage)
  const isPartnerMode = sidebarPage === 'rgr'
  const partnerName: string | null = isPartnerMode ? partner : null
  const visibleNav = availableNav

  useEffect(() => {
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')
    const savedTheme = localStorage.getItem('telted_theme'); if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme)

    // CSS injection for hardcoded "white" backgrounds in NELI components
    const styleId = 'telted-dark-override'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .telted-neli-dark [style*="background: white"],
        .telted-neli-dark [style*="background:white"] {
          background: var(--tt-card) !important;
        }
        .telted-neli-dark .recharts-cartesian-grid line { stroke: var(--tt-border) !important; }
        .telted-neli-dark .recharts-tooltip-wrapper .recharts-default-tooltip {
          background: var(--tt-card) !important; border-color: var(--tt-border) !important;
        }
        .telted-neli-dark .recharts-default-tooltip .recharts-tooltip-label { color: var(--tt-text) !important; }
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
    // When leaving school view for a partner page, remember where we were
    // so the Back button can restore context.
    const target = SIDEBAR_NAV.find(n => n.id === id)
    const targetIsPartner = !!(target && 'partner' in target)
    if (targetIsPartner && !isPartnerMode) setLastSchoolPage(sidebarPage)

    setSidebarPage(id)
    setSelectedClass(null)
    setSelectedPupil(null)
    if (id === 'overview') setActiveTab('today')
  }

  function handleBackToSchoolView() {
    setSidebarPage(lastSchoolPage || 'overview')
    setSelectedClass(null)
    setSelectedPupil(null)
    if ((lastSchoolPage || 'overview') === 'overview') setActiveTab('today')
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
      const map: Record<string, string> = { 'Student Report': 'pupil-progress', 'Class Report': 'class-dashboard', 'School Report': 'term-summary' }
      setPendingReport(map[label] || null)
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
              <TelTedAIPanel />
              {dash.photoFrame && <PhotoFrame />}
            </div>
          </div>
        )
      case 'languagescreen':
        return (
          <div>
            <div className="flex gap-2 mb-4 px-1">
              {([['dashboard', 'Dashboard'], ['languagescreen', 'LanguageScreen'], ['tracker', 'TEL TED Tracker']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setNeliSubTab(id)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: neliSubTab === id ? 'var(--tt-accent)' : 'var(--tt-card)', color: neliSubTab === id ? '#fff' : 'var(--tt-dim)', border: `1px solid ${neliSubTab === id ? 'var(--tt-accent)' : 'var(--tt-border)'}` }}>{label}</button>
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
                <button key={id} onClick={() => setInsightsSubTab(id)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: insightsSubTab === id ? 'var(--tt-accent)' : 'var(--tt-card)', color: insightsSubTab === id ? '#fff' : 'var(--tt-dim)', border: `1px solid ${insightsSubTab === id ? 'var(--tt-accent)' : 'var(--tt-border)'}` }}>{label}</button>
              ))}
            </div>
            {insightsSubTab === 'school' ? <Insights /> : <TrustView />}
          </div>
        )
      case 'reports':
        return <ReportsPanel initialReportId={pendingReport} />
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
    if (sidebarPage === 'welcome') {
      return (
        <TelTedWelcomePage
          userName="Sarah Mitchell" school="Parkside Elementary" district="Oak Valley District"
          cards={welcomeCards} notices={welcomeNotices} last={welcomeLast}
          onOpen={handleWelcomeOpen}
          onContinue={() => { leaveWelcome(); setSidebarPage('overview'); setActiveTab('today') }}
          onDisable={() => { setDashPrefs({ welcomePage: false }); leaveWelcome(); setSidebarPage('overview'); setActiveTab('today') }}
        />
      )
    }
    // Handle deep navigation states
    if (sidebarPage === 'pupil' && selectedPupil) {
      return <PupilDetail key={`${selectedPupil.id}-${dataVersion}`} pupil={selectedPupil} onBack={() => { setSidebarPage(selectedClass ? 'classdetail' : 'overview'); setSelectedPupil(null); setActiveTab('languagescreen') }} onAssess={(p) => setAssessingPupil(p)} />
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
            <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderRadius: 8 }}>
              <span className="text-xs font-semibold shrink-0 mr-1 uppercase" style={{ color: 'var(--tt-muted)', letterSpacing: '0.06em' }}>Quick actions</span>
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={() => handleQuickAction(a.action, a.label)} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold whitespace-nowrap" style={{ ...QA_STYLES[a.kind], borderRadius: 8, cursor: 'pointer' }}>
                  <a.Icon size={13} strokeWidth={2.25} />{a.label}
                </button>
              ))}
            </div>

            {/* Tab bar */}
            <div className="overflow-x-auto scrollbar-none" style={{ backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', borderBottom: '2px solid var(--tt-border)', borderRadius: '8px 8px 0 0' }}>
              <div className="flex items-center min-w-max px-2">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className="px-3.5 py-2.5 text-sm whitespace-nowrap"
                    style={{ fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? 'var(--tt-accent)' : 'var(--tt-muted)', borderBottom: `3px solid ${activeTab === t.id ? 'var(--tt-accent)' : 'transparent'}`, marginBottom: -2, background: 'none', border: 'none', borderBottomWidth: 3, borderBottomStyle: 'solid', cursor: 'pointer' }}>
                    {t.label}
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
        return <TelTedInspectionPage />
      case 'rostering':
        return <RosteringPage />
      case 'missync':
        return <MisSyncPage />
      case 'workflows':
        return <WorkflowsPage />
      case 'reports':
        return <ReportsToolPage onGenerate={id => { setPendingReport(id); setSidebarPage('overview'); setActiveTab('reports') }} />
      case 'settings':
        return <TelTedSettings />
      case 'rgr':
        return <RGRDashboard />
      default:
        return null
    }
  }

  return (
    <div className={`flex h-screen overflow-hidden ${publicSans.className}`} data-tt-theme={theme} style={{ ...(TT_THEMES[theme] as any), backgroundColor: 'var(--tt-bg)', colorScheme: theme }}>
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
            onComplete={recordAssessment}
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden md:flex flex-col transition-[width] duration-200"
        style={{ width: sidebarW, backgroundColor: 'var(--tt-sidebar)', borderRight: '1px solid var(--tt-sidebar-border)', overflow: 'hidden' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo area */}
        {!expanded && (
          <div className="shrink-0 flex items-center justify-center py-3" style={{ borderBottom: '1px solid var(--tt-sidebar-border)', minHeight: 56 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--tt-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: 'white' }}>HE</div>
          </div>
        )}
        {expanded && (
          <div className="shrink-0" style={{ padding: '12px 16px', borderBottom: '1px solid var(--tt-sidebar-border)', textAlign: 'center', backgroundColor: '#fff', borderRadius: 8, margin: '10px 10px 0' }}>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <img src="/telted_rgb_logo.jpg" alt="TEL TED" style={{ width: '100%', maxWidth: 140, maxHeight: 52, height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <p style={{ fontSize: 10, color: '#6C757D', margin: '4px 0 0', textAlign: 'center', width: '100%', letterSpacing: '0.04em' }}>OxEd &amp; Assessment</p>
              </div>
              <button onClick={togglePin} className="flex items-center justify-center rounded p-1 shrink-0"
                style={{ color: pinned ? 'var(--tt-accent)' : '#ADB5BD', transform: pinned ? 'rotate(0deg)' : 'rotate(45deg)' }}
                title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}>
                <Pin size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Tenant context card — School info in school mode, Partner portfolio in partner mode */}
        {expanded && !isPartnerMode && (
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--tt-sidebar-border)', cursor: 'pointer' }} onClick={openWelcome} title="Open the portal welcome page" role="button">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tt-sidebar-muted)' }}>Current School</p>
            <p className="text-xs font-bold mt-1" style={{ color: 'var(--tt-sidebar-active)' }}>Parkside Elementary</p>
            <p className="text-[10px]" style={{ color: 'var(--tt-sidebar-text)' }}>Oak Valley District · Kindergarten</p>
          </div>
        )}
        {expanded && isPartnerMode && (
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--tt-sidebar-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--tt-sidebar-muted)' }}>Partner Portfolio</p>
            <p className="text-xs font-bold mt-1" style={{ color: 'var(--tt-sidebar-active)' }}>{partnerName === 'RGR' ? 'Really Great Reading' : partnerName}</p>
            <p className="text-[10px]" style={{ color: 'var(--tt-sidebar-text)' }}>{partner === 'RGR' ? '68 schools · US portfolio' : '—'}</p>
          </div>
        )}

        {/* Gold divider */}
        

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-1.5 py-3 space-y-0.5">
          {expanded && isPartnerMode && (
            <button
              onClick={handleBackToSchoolView}
              className="flex items-center gap-2 rounded-lg px-3 py-2 mb-2 text-xs font-semibold transition-colors w-full"
              style={{ backgroundColor: 'var(--tt-sidebar-active-bg)', color: 'var(--tt-sidebar-active)', border: '1px solid var(--tt-sidebar-border)' }}
            >
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
              Back to School View
            </button>
          )}
          {visibleNav.map((item, i) => {
            const prev = visibleNav[i - 1]
            const showSection = expanded && item.section && item.section !== prev?.section
            const isActive = sidebarPage === item.id
            const Icon = item.icon
            return (
              <div key={item.id}>
                {showSection && <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--tt-sidebar-muted)' }}>{item.section}</p>}
                <button onClick={() => handleSidebarNav(item.id)}
                  className="flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-colors w-full"
                  style={{ backgroundColor: isActive ? 'var(--tt-sidebar-active-bg)' : 'transparent', color: isActive ? 'var(--tt-sidebar-active)' : 'var(--tt-sidebar-text)', fontWeight: isActive ? 700 : 500, paddingLeft: expanded ? 12 : 0, paddingRight: expanded ? 12 : 0, justifyContent: expanded ? 'flex-start' : 'center' }}
                  title={expanded ? undefined : item.label}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--tt-sidebar-hover)'; e.currentTarget.style.color = 'var(--tt-sidebar-active)' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--tt-sidebar-text)' } }}>
                  <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  {expanded && <span className="flex-1 truncate text-xs">{item.label}</span>}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="mt-auto shrink-0" style={{ borderTop: '1px solid var(--tt-sidebar-border)' }}>
          <div className="px-1.5 py-2">
            <button className="flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium w-full" style={{ color: 'var(--tt-sidebar-text)', paddingLeft: expanded ? 12 : 0, justifyContent: expanded ? 'flex-start' : 'center' }}>
              <LogOut size={15} strokeWidth={1.75} className="shrink-0" />
              {expanded && <span className="text-xs">Sign Out</span>}
            </button>
          </div>
          {expanded && (
            <div className="pb-3">
              <a href="https://lumiocms.com" target="_blank" rel="noreferrer" className="block mx-auto opacity-70 hover:opacity-100 transition-opacity" style={{ width: 'fit-content' }}>
                <img src="/lumio-transparent-new.png" alt="Lumio" style={{ width: 120, height: 'auto', objectFit: 'contain' }} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden" style={{ width: EXPANDED_W, backgroundColor: 'var(--tt-sidebar)', borderRight: '1px solid var(--tt-sidebar-border)' }}>
          <div className="flex shrink-0 items-center gap-2.5" style={{ padding: '12px 16px', borderBottom: '1px solid var(--tt-border)' }}>
            <div className="flex-1 min-w-0">
              <img src="/telted_rgb_logo.jpg" alt="TEL TED" style={{ width: '100%', maxWidth: 140, maxHeight: 52, height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <p style={{ fontSize: 10, color: 'var(--tt-dim)', margin: '4px 0 0', textAlign: 'center', width: '100%', letterSpacing: '0.04em' }}>OxEd &amp; Assessment</p>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--tt-muted)' }}><X size={16} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {isPartnerMode && (
              <button
                onClick={() => { handleBackToSchoolView(); setMobileOpen(false) }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 mb-2 text-xs font-semibold w-full"
                style={{ backgroundColor: 'var(--tt-accent-soft)', color: 'var(--tt-accent)', border: '1px solid var(--tt-accent-soft)' }}
              >
                <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                Back to School View
              </button>
            )}
            {visibleNav.map((item, i) => {
              const prev = visibleNav[i - 1]
              const showSection = item.section && item.section !== prev?.section
              const isActive = sidebarPage === item.id
              const Icon = item.icon
              return (
                <div key={item.id}>
                  {showSection && <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--tt-faint)' }}>{item.section}</p>}
                  <button onClick={() => { handleSidebarNav(item.id); setMobileOpen(false) }}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium w-full"
                    style={{ backgroundColor: isActive ? 'var(--tt-sidebar-active-bg)' : 'transparent', color: isActive ? 'var(--tt-sidebar-active)' : 'var(--tt-sidebar-text)' }}>
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
          <button title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); localStorage.setItem('telted_theme', next) }} className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', color: 'var(--tt-muted)', cursor: 'pointer' }}>
            {theme === 'dark' ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
          </button>
          <button className="relative flex items-center justify-center rounded-full" style={{ width: 36, height: 36, backgroundColor: 'var(--tt-card)', border: '1px solid var(--tt-border)', color: 'var(--tt-muted)', cursor: 'pointer' }}>
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute flex items-center justify-center rounded-full" style={{ top: 4, right: 4, width: 10, height: 10, backgroundColor: '#EF4444', fontSize: 6, color: '#fff', fontWeight: 700 }}>3</span>
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--tt-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>SM</div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold" style={{ color: 'var(--tt-text)' }}>Sarah Mitchell</p>
              <p className="text-[10px]" style={{ color: 'var(--tt-dim)' }}>TEL TED Coordinator</p>
            </div>
          </div>
        </div>

        {/* Mobile menu bar */}
        <div className="md:hidden flex items-center px-4 py-2 shrink-0" style={{ borderBottom: '1px solid var(--tt-border)' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--tt-muted)' }}><Menu size={18} /></button>
          <span className="text-sm font-semibold ml-2 truncate" style={{ color: 'var(--tt-text)' }}>TEL TED Portal</span>
        </div>

        {/* Main content */}
        <main ref={mainRef} className={`${theme === 'dark' ? 'telted-neli-dark' : 'telted-neli-light'} flex-1 overflow-y-auto p-4 md:p-6`}>
          {renderContent()}
        </main>
      </div>

      {/* Voice command response toast */}
      <VoiceToast toast={voiceToast} onDismiss={() => setVoiceToast(null)} />
    </div>
  )
}
