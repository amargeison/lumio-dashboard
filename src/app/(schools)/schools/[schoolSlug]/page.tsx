'use client'

import { use, useState, useEffect } from 'react'
import {
  Users, Shield, Calendar, FileText, Phone, UserPlus,
  AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles,
  TrendingUp, Activity, X, ChevronRight, Mail, Plus,
  ChevronUp, ChevronDown, GitBranch, Volume2,
} from 'lucide-react'
import SchoolBanner from '@/app/demo/schools/[schoolSlug]/components/SchoolBanner'

// ─── Seed data ────────────────────────────────────────────────────────────────

interface SchoolData {
  name: string
  headteacher: string | null
  town: string | null
  ofsted_rating: string | null
  pupil_count: number | null
  staff_count: number | null
}

const ATTENDANCE_BY_YEAR = [
  { year: 'Reception', pct: 96.1 },
  { year: 'Year 1',    pct: 94.8 },
  { year: 'Year 2',    pct: 93.2 },
  { year: 'Year 3',    pct: 95.7 },
  { year: 'Year 4',    pct: 92.4 },
  { year: 'Year 5',    pct: 94.1 },
  { year: 'Year 6',    pct: 91.8 },
]

const WORKFLOWS = [
  { name: 'Daily Absence Alert',      status: 'COMPLETE', time: '7:32am'  },
  { name: 'DBS Reminder — M. Taylor', status: 'ACTION',   time: '8:00am'  },
  { name: 'Cover Booking — Mrs Jones',status: 'COMPLETE', time: '8:14am'  },
  { name: 'Safeguarding Log Sync',    status: 'RUNNING',  time: '8:30am'  },
  { name: 'Parent Comms — Yr 4 Trip', status: 'COMPLETE', time: 'Yesterday' },
  { name: 'Ofsted Readiness Check',   status: 'COMPLETE', time: 'Monday'  },
]

const STAFF_TODAY = [
  { name: 'Mrs K. Collins',  role: 'Year 3',      status: 'in'    },
  { name: 'Mr T. Rashid',    role: 'Year 5',      status: 'in'    },
  { name: 'Mrs S. Okafor',   role: 'SENCO',       status: 'absent'},
  { name: 'Mr D. Whitmore',  role: 'Year 6',      status: 'cover' },
  { name: 'Miss R. Khan',    role: 'Year 1',      status: 'in'    },
  { name: 'Mrs J. Andrews',  role: 'Office',      status: 'in'    },
]

const SCHEDULE = [
  { time: '8:50am', event: 'Register period',             type: 'admin'   },
  { time: '10:00am',event: 'Year 6 SATs prep — Hall',     type: 'academic'},
  { time: '11:30am',event: 'SENCO review meeting',        type: 'meeting' },
  { time: '2:00pm', event: 'Parent consultation — J. Morris', type: 'parent' },
]

const COMPLIANCE = [
  { item: 'DBS checks current',       status: 'ok',      detail: '38/41 current'         },
  { item: 'M. Taylor DBS overdue',    status: 'urgent',  detail: 'Expired 10 Mar 2026'   },
  { item: 'Fire drill completed',     status: 'ok',      detail: 'Completed 14 Mar'      },
  { item: 'Safeguarding training',    status: 'pending', detail: '2 staff due by Apr 30' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ragColor(pct: number) {
  if (pct >= 96) return '#22C55E'
  if (pct >= 92) return '#0D9488'
  if (pct >= 88) return '#F59E0B'
  return '#EF4444'
}

function WFBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    COMPLETE: { bg: 'rgba(34,197,94,0.1)',   text: '#22C55E', label: 'Complete'  },
    RUNNING:  { bg: 'rgba(96,165,250,0.12)', text: '#60A5FA', label: 'Running'   },
    ACTION:   { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: 'Action'    },
  }
  const s = map[status] ?? map.RUNNING
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
      {status === 'RUNNING' ? <Loader2 size={10} className="animate-spin" /> : status === 'COMPLETE' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
      {s.label}
    </span>
  )
}

function StaffBadge({ status }: { status: string }) {
  if (status === 'in')     return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>In</span>
  if (status === 'absent') return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Absent</span>
  return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>Cover</span>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      {children}
    </div>
  )
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
      {action}
    </div>
  )
}

// ─── Greeting banner ─────────────────────────────────────────────────────────

const SCHOOL_BG_GRADIENTS = [
  'from-teal-950/80 via-emerald-950/90 to-cyan-950',
  'from-emerald-950 via-teal-950/80 to-cyan-950/90',
  'from-cyan-950 via-emerald-950/80 to-teal-950/90',
  'from-teal-950/90 via-cyan-950 to-emerald-950/80',
  'from-emerald-950/80 via-cyan-950/90 to-teal-950',
  'from-cyan-950/90 via-teal-950 to-emerald-950/80',
  'from-teal-950 via-emerald-950/90 to-cyan-950/80',
]

const SCHOOL_QUOTES = [
  { text: "Every child deserves a champion.", author: "Rita Pierson" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Children must be taught how to think, not what to think.", author: "Margaret Mead" },
  { text: "A good teacher can inspire hope and ignite the imagination.", author: "Brad Henry" },
]

function SchoolGreetingBanner({ schoolName, firstName, pupils, staff }: { schoolName: string; firstName?: string; pupils?: number; staff?: number }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [bg] = useState(() => SCHOOL_BG_GRADIENTS[new Date().getDay()])
  const [quote] = useState(() => SCHOOL_QUOTES[Math.floor(Math.random() * SCHOOL_QUOTES.length)])
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: '🌤️' })

  useEffect(() => { fetch('/api/home/weather').then(r => r.json()).then(setWeather).catch(() => {}) }, [])

  return (
    <div className={`relative bg-gradient-to-r ${bg} overflow-hidden rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] mx-1`}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', pointerEvents: 'none', borderRadius: 'inherit' }} />
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-600 rounded-full opacity-10 blur-3xl" />
      <div className="relative z-10 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">
              {greeting}, {firstName || 'there'} 👋
            </h1>
            <p className="text-teal-300 text-sm mb-2">{date}</p>
            <p className="text-teal-200/60 text-sm italic">&ldquo;{quote.text}&rdquo; — {quote.author}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {[
              { label: 'Pupils', value: pupils || 423, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '👨‍🎓' },
              { label: 'Staff', value: staff || 41, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '👥' },
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
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex-shrink-0">
            <span className="text-3xl">{weather.icon}</span>
            <div>
              <div className="text-xl font-black text-white">{weather.temp}</div>
              <div className="text-xs text-teal-300">{weather.condition}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── School Morning Roundup ──────────────────────────────────────────────────

const SCHOOL_DAY_ITEMS = [
  { id: 'attendance', icon: '✅', label: 'Attendance', count: 3, urgent: true, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
    messages: [
      { id: 'a1', from: 'Year 7', avatar: 'Y7', subject: '3 unexplained absences', preview: 'Students: Jamie Wilson, Priya Patel, Marcus Lee \u2014 no contact from parents yet.', time: '8:45am', urgent: true, read: false },
    ]},
  { id: 'safeguarding', icon: '🛡️', label: 'Safeguarding', count: 1, urgent: true, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
    messages: [
      { id: 's1', from: 'Mrs Davies (SENCO)', avatar: 'MD', subject: 'CP Case review due today', preview: 'Child Protection case for Student A requires review before end of day. TAC meeting scheduled 3pm.', time: '8:30am', urgent: true, read: false },
    ]},
  { id: 'send', icon: '📋', label: 'SEND Updates', count: 2, urgent: false, color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)',
    messages: [
      { id: 'se1', from: 'SEND Team', avatar: 'ST', subject: 'EHC Plan review \u2014 deadline in 3 days', preview: 'Annual review for Student B EHC Plan is due Friday. Draft outcomes need sign-off from SENCO.', time: '9:00am', urgent: false, read: false },
      { id: 'se2', from: 'SEND Team', avatar: 'ST', subject: 'New SEND referral received', preview: 'Class teacher has referred Year 5 student for assessment. Initial meeting to be scheduled.', time: 'Yesterday', urgent: false, read: true },
    ]},
  { id: 'staff', icon: '👥', label: 'Staff Updates', count: 2, urgent: false, color: '#C084FC', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.2)',
    messages: [
      { id: 'st1', from: 'HR System', avatar: 'HR', subject: 'Supply cover needed \u2014 Period 3 & 4', preview: 'Mr Thompson (Science) called in sick. Cover needed for Year 9 and Year 11 classes this afternoon.', time: '7:58am', urgent: false, read: false },
      { id: 'st2', from: 'HR System', avatar: 'HR', subject: 'DBS renewal reminder', preview: '2 staff members have DBS checks expiring within 30 days. Action required before compliance deadline.', time: 'Yesterday', urgent: false, read: true },
    ]},
  { id: 'ofsted', icon: '🏫', label: 'Ofsted Readiness', count: 1, urgent: false, color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)',
    messages: [
      { id: 'o1', from: 'Compliance System', avatar: 'CS', subject: 'Online Safety audit due this week', preview: 'Annual online safety review must be completed and signed off by the headteacher before Friday.', time: '8:00am', urgent: false, read: false },
    ]},
]

function SchoolMorningRoundup() {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: '#F9FAFB' }}>🌅 School Day Overview</h3>
        <span className="text-xs" style={{ color: '#6B7280' }}>Since you were last here</span>
      </div>
      <div className="space-y-2">
        {SCHOOL_DAY_ITEMS.map(item => {
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

// ─── School AI Summary Panel ─────────────────────────────────────────────────

const SCHOOL_AI_HIGHLIGHTS = [
  'Overall attendance today is 94.3% — Year 6 is lowest at 91.8%. Two pupils flagged for persistent absence review.',
  '1 open safeguarding concern logged 2 days ago. DSL sign-off required before end of day.',
  'Mrs S. Okafor (SENCO) absent — cover arranged. EHCP review at 11:30am still scheduled.',
  'M. Taylor DBS expired 10 Mar. Renewal must be initiated this week.',
  'Year 6 SATs prep session at 10am — all 28 registered pupils confirmed.',
  'Parent consultation with J. Morris at 2pm. Behaviour log attached.',
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
        <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ backgroundColor: '#0f0e17', maxHeight: '16rem' }}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'School Office',
  'HR & Staff',
  'Curriculum',
  'SEND & DSL',
  'Finance',
  'Facilities',
  'Admissions',
  'Safeguarding',
]

// ─── Onboarding Modal ─────────────────────────────────────────────────────────

interface InviteRow {
  email: string
  role: string
}

function OnboardingModal({
  slug,
  school,
  onComplete,
}: {
  slug: string
  school: SchoolData
  onComplete: () => void
}) {
  const [step, setStep] = useState(1)
  const [invites, setInvites] = useState<InviteRow[]>([{ email: '', role: 'teacher' }])
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  function addInviteRow() {
    if (invites.length >= 5) return
    setInvites(prev => [...prev, { email: '', role: 'teacher' }])
  }

  function updateInvite(index: number, field: keyof InviteRow, value: string) {
    setInvites(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  async function handleSendInvites() {
    const validInvites = invites.filter(r => r.email.trim())
    setSending(true)
    try {
      if (validInvites.length > 0) {
        // Fire-and-forget; if the invite endpoint doesn't exist yet we skip silently
        await fetch('/api/schools/auth/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, invites: validInvites }),
        }).catch(() => {/* endpoint may not exist yet */})
      }
    } finally {
      setSending(false)
      setStep(3)
    }
  }

  function handleFinish() {
    if (!selectedDept) return
    onComplete()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#111318',
          border: '1px solid #1F2937',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Modal header bar */}
        <div style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.05em', color: 'white' }}>Lumio for Schools</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              Step {step} of 3 — {step === 1 ? 'Your school' : step === 2 ? 'Invite team' : 'First department'}
            </div>
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map(n => (
              <div
                key={n}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: n <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Step 1: School details ── */}
        {step === 1 && (
          <div style={{ padding: '32px 28px' }}>
            <h2 style={{ color: '#F9FAFB', margin: '0 0 6px', fontSize: '22px', fontWeight: 700 }}>
              Welcome to Lumio, {school.name}! 👋
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 28px', lineHeight: 1.6 }}>
              Let&apos;s get your school set up in 3 steps.
            </p>

            {/* Pre-filled school info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {[
                { label: 'School name', value: school.name },
                { label: 'Town', value: school.town ?? '—' },
                { label: 'Headteacher', value: school.headteacher ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937', borderRadius: '10px', padding: '12px 16px' }}>
                  <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', margin: '0 0 2px', textTransform: 'uppercase' }}>{label}</p>
                  <p style={{ color: '#F9FAFB', fontSize: '14px', margin: 0, fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg,#0D9488,#0F766E)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 2: Invite team ── */}
        {step === 2 && (
          <div style={{ padding: '32px 28px' }}>
            <h2 style={{ color: '#F9FAFB', margin: '0 0 6px', fontSize: '22px', fontWeight: 700 }}>
              Invite your team
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
              Add colleagues who should have access to your school workspace.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {invites.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      placeholder="colleague@school.edu"
                      value={row.email}
                      onChange={e => updateInvite(i, 'email', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #1F2937',
                        borderRadius: '10px',
                        padding: '10px 12px 10px 36px',
                        color: '#F9FAFB',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <select
                    value={row.role}
                    onChange={e => updateInvite(i, 'role', e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid #1F2937',
                      borderRadius: '10px',
                      padding: '10px 10px',
                      color: '#F9FAFB',
                      fontSize: '12px',
                      outline: 'none',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="headteacher">Headteacher</option>
                    <option value="deputy">Deputy</option>
                    <option value="business_manager">Business Mgr</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              ))}
            </div>

            {invites.length < 5 && (
              <button
                onClick={addInviteRow}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#0D9488',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0 0 20px',
                }}
              >
                <Plus size={14} /> Add another
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleSendInvites}
                disabled={sending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 20px',
                  background: sending ? 'rgba(13,148,136,0.4)' : 'linear-gradient(135deg,#0D9488,#0F766E)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : null}
                Send invites &amp; continue →
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '6px',
                  textDecoration: 'underline',
                }}
              >
                Skip for now →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: First department ── */}
        {step === 3 && (
          <div style={{ padding: '32px 28px' }}>
            <h2 style={{ color: '#F9FAFB', margin: '0 0 6px', fontSize: '22px', fontWeight: 700 }}>
              Which department do you want to set up first?
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
              You can always come back and configure others later.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  style={{
                    padding: '14px 12px',
                    background: selectedDept === dept
                      ? 'rgba(13,148,136,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    border: selectedDept === dept
                      ? '1px solid #0D9488'
                      : '1px solid #1F2937',
                    borderRadius: '10px',
                    color: selectedDept === dept ? '#0D9488' : '#D1D5DB',
                    fontSize: '13px',
                    fontWeight: selectedDept === dept ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={!selectedDept}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 20px',
                background: selectedDept ? 'linear-gradient(135deg,#0D9488,#0F766E)' : 'rgba(255,255,255,0.06)',
                color: selectedDept ? 'white' : '#6B7280',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: selectedDept ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              Let&apos;s go →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolDashboard({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug: _slug } = use(params)
  const attendanceAvg = Math.round(ATTENDANCE_BY_YEAR.reduce((s, y) => s + y.pct, 0) / ATTENDANCE_BY_YEAR.length * 10) / 10
  const staffIn = STAFF_TODAY.filter(s => s.status === 'in').length

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null)

  useEffect(() => {
    fetch(`/api/schools/${_slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSchoolData(data) })
      .catch(() => {})
      .finally(() => {
        // If API didn't return data, build from localStorage (set during checkout)
        setSchoolData(prev => {
          if (prev) return prev
          const storedName = localStorage.getItem(`lumio_school_${_slug}_name`)
          if (!storedName) return prev
          return {
            name: storedName,
            headteacher: null,
            town: null,
            ofsted_rating: null,
            pupil_count: null,
            staff_count: null,
          }
        })
      })

    const key = `lumio_onboarded_${_slug}`
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true)
    }
  }, [_slug])

  function completeOnboarding() {
    localStorage.setItem(`lumio_onboarded_${_slug}`, 'true')
    setShowOnboarding(false)
  }

  const ownerName = localStorage.getItem(`lumio_school_${_slug}_owner`) || ''
  const firstName = ownerName ? ownerName.split(' ')[0] : undefined
  const schoolName = schoolData?.name || localStorage.getItem(`lumio_school_${_slug}_name`) || ''

  return (
    <div className="space-y-4">

      {/* 1. Greeting banner */}
      <SchoolGreetingBanner schoolName={schoolName} firstName={ownerName || 'there'} pupils={schoolData?.pupil_count || undefined} staff={schoolData?.staff_count || undefined} />

      {/* 2. Quick actions */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none" style={{ backgroundColor: '#0D0E14', borderBottom: '1px solid #1F2937', borderRadius: 12 }}>
        <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: '#4B5563' }}>Quick actions</span>
        {[
          { label: 'New Concern', icon: '⚠️' },
          { label: 'Register Class', icon: '✅' },
          { label: 'Add Student', icon: '➕' },
          { label: 'Staff Alert', icon: '🔔' },
          { label: 'Ofsted Check', icon: '🏫' },
        ].map(a => (
          <button key={a.label} onClick={() => {}} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>

      {/* 3. Morning Roundup */}
      <SchoolMorningRoundup />

      {/* 3. Safeguarding alert */}
      <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Shield size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>1 open safeguarding concern</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Requires DSL review — logged 2 days ago</p>
        </div>
        <button className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Review now</button>
      </div>

      {/* 4. Quick actions — above main content */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Log Absence',     icon: Users,         color: '#0D9488' },
          { label: 'New Concern',     icon: Shield,        color: '#EF4444' },
          { label: 'Parent Contact',  icon: Phone,         color: '#6C3FC5' },
          { label: 'Book Cover',      icon: Calendar,      color: '#F59E0B' },
          { label: 'New Admission',   icon: UserPlus,      color: '#0D9488' },
          { label: 'Run Report',      icon: FileText,      color: '#9CA3AF' },
        ].map(({ label, icon: Icon, color }) => (
          <button key={label} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>
            <Icon size={14} style={{ color }} />{label}
          </button>
        ))}
      </div>

      {/* 5. Three-col grid: left (stats + cards) / right (AI panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT — col-span-2 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Attendance today',  value: `${attendanceAvg}%`,         sub: '7-year group avg',      color: ragColor(attendanceAvg), icon: Activity   },
              { label: 'Active workflows',  value: '23',                         sub: '3 need attention',      color: '#6C3FC5',               icon: GitBranch  },
              { label: 'Open concerns',     value: '1',                          sub: 'Safeguarding',          color: '#EF4444',               icon: Shield     },
              { label: 'Staff in today',    value: `${staffIn}/${STAFF_TODAY.length}`, sub: '1 on cover',       color: '#0D9488',               icon: Users      },
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
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Attendance + Workflows — two col */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Attendance by year */}
        <Card>
          <CardHeader title="Attendance by Year Group" action={<span className="text-xs" style={{ color: '#9CA3AF' }}>Today</span>} />
          <div className="px-5 py-4 space-y-3">
            {ATTENDANCE_BY_YEAR.map(y => (
              <div key={y.year} className="flex items-center gap-3">
                <p className="text-xs w-20 shrink-0" style={{ color: '#9CA3AF' }}>{y.year}</p>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${y.pct}%`, backgroundColor: ragColor(y.pct) }} />
                </div>
                <p className="text-xs w-12 text-right font-medium shrink-0" style={{ color: ragColor(y.pct) }}>{y.pct}%</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Active workflows */}
        <Card>
          <CardHeader title="Today's Workflows" />
          <div className="flex flex-col gap-1">
            {WORKFLOWS.map((wf, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{wf.name}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}><Clock size={10} />{wf.time}</p>
                </div>
                <WFBadge status={wf.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

          {/* Three row: Staff / Schedule / Compliance */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Staff Today" />
              <div className="flex flex-col gap-1">
                {STAFF_TODAY.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                      {s.name.split(' ').slice(-1)[0][0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#F9FAFB' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{s.role}</p>
                    </div>
                    <StaffBadge status={s.status} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Today's Schedule" />
              <div className="flex flex-col gap-1">
                {SCHEDULE.map((s, i) => {
                  const colors: Record<string, string> = { admin: '#9CA3AF', academic: '#0D9488', meeting: '#6C3FC5', parent: '#F59E0B' }
                  return (
                    <div key={i} className="flex gap-3 px-4 py-3">
                      <span className="text-xs shrink-0 mt-0.5 w-14" style={{ color: '#6B7280' }}>{s.time}</span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{s.event}</p>
                        <div className="h-1 w-12 rounded-full mt-1.5" style={{ backgroundColor: colors[s.type] ?? '#9CA3AF' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
            <Card>
              <CardHeader title="Compliance Tracker" />
              <div className="flex flex-col gap-1">
                {COMPLIANCE.map((c, i) => {
                  const icon = c.status === 'ok' ? <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                             : c.status === 'urgent' ? <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                             : <Clock size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
                  return (
                    <div key={i} className="flex gap-3 px-4 py-3">
                      {icon}
                      <div className="min-w-0">
                        <p className="text-xs font-medium" style={{ color: c.status === 'urgent' ? '#F9FAFB' : '#D1D5DB' }}>{c.item}</p>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{c.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

        </div>{/* end LEFT col-span-2 */}

        {/* RIGHT — AI Morning Summary */}
        <div className="lg:col-span-1">
          <SchoolAIPanel />
        </div>
      </div>{/* end 3-col grid */}

      {/* ── Onboarding modal ────────────────────────────────────── */}
      {showOnboarding && schoolData && (
        <OnboardingModal slug={_slug} school={schoolData} onComplete={completeOnboarding} />
      )}

    </div>
  )
}
