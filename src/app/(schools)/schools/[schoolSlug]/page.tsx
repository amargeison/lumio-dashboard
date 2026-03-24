'use client'

import { use } from 'react'
import {
  Users, Shield, Calendar, FileText, Phone, UserPlus,
  AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles,
  TrendingUp, Activity,
} from 'lucide-react'

// ─── Seed data ────────────────────────────────────────────────────────────────

const SCHOOL = {
  name:        'Oakridge Primary School',
  headteacher: 'Sarah Henderson',
  ofsted:      'Good',
  pupils:      423,
  staff:       41,
  town:        'Milton Keynes',
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
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
      {action}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolDashboard({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug: _slug } = use(params)
  const attendanceAvg = Math.round(ATTENDANCE_BY_YEAR.reduce((s, y) => s + y.pct, 0) / ATTENDANCE_BY_YEAR.length * 10) / 10
  const staffIn = STAFF_TODAY.filter(s => s.status === 'in').length

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">

      {/* ── Greeting banner ─────────────────────────────────────── */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D9488 0%,#0F766E 50%,#134E4A 100%)' }}>
        <div className="relative z-10">
          <p className="text-sm font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{today}</p>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F9FAFB' }}>Good morning, {SCHOOL.headteacher.split(' ')[0]}.</h1>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Term 4, Week 9 · 7 weeks to SATs · {SCHOOL.name}</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: `Attendance ${attendanceAvg}%`,    color: 'rgba(255,255,255,0.2)' },
              { label: `${staffIn}/${STAFF_TODAY.length} staff in`,      color: 'rgba(255,255,255,0.2)' },
              { label: '1 open concern',                  color: 'rgba(239,68,68,0.4)'   },
              { label: '23 active workflows',             color: 'rgba(255,255,255,0.2)' },
            ].map(c => (
              <span key={c.label} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: c.color, color: '#F9FAFB', backdropFilter: 'blur(4px)' }}>
                {c.label}
              </span>
            ))}
          </div>
        </div>
        {/* decorative circle */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute -right-4 -bottom-8 h-32 w-32 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* ── Safeguarding alert ──────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Shield size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>1 open safeguarding concern</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Requires DSL review — logged 2 days ago</p>
        </div>
        <button className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Review now</button>
      </div>

      {/* ── AI Morning Briefing ─────────────────────────────────── */}
      <Card>
        <CardHeader title="AI Morning Briefing" action={<span className="flex items-center gap-1 text-xs" style={{ color: '#0D9488' }}><Sparkles size={12} /> Updated 7:30am</span>} />
        <div className="px-5 py-4 space-y-3">
          {[
            { icon: Activity,      color: '#0D9488', text: `Overall attendance today is ${attendanceAvg}% — Year 6 is lowest at 91.8%. Two pupils flagged for persistent absence review.` },
            { icon: Shield,        color: '#EF4444', text: '1 open safeguarding concern logged 2 days ago has not been reviewed. DSL sign-off required today.' },
            { icon: Users,         color: '#F59E0B', text: 'Mrs S. Okafor (SENCO) is absent today. Cover has been arranged. EHCP review meeting at 11:30am still scheduled.' },
            { icon: FileText,      color: '#A78BFA', text: 'M. Taylor DBS check expired on 10 March. Renewal must be initiated before end of week or staff member cannot work unsupervised.' },
            { icon: TrendingUp,    color: '#22C55E', text: 'Year 6 SATs prep session running at 10am. All 28 registered pupils confirmed. Resources prepared and uploaded.' },
          ].map(({ icon: Icon, color, text }, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #1F2937' }}>
                <Icon size={12} style={{ color }} />
              </div>
              <p className="text-sm pt-0.5" style={{ color: '#D1D5DB' }}>{text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      {/* ── Quick actions ───────────────────────────────────────── */}
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

      {/* ── Two column: Attendance + Workflows ──────────────────── */}
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
          <div className="divide-y" style={{ borderColor: '#0D0E14' }}>
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

      {/* ── Three column: Staff / Schedule / Compliance ──────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Staff today */}
        <Card>
          <CardHeader title="Staff Today" />
          <div className="divide-y" style={{ borderColor: '#0D0E14' }}>
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

        {/* Today's schedule */}
        <Card>
          <CardHeader title="Today's Schedule" />
          <div className="divide-y" style={{ borderColor: '#0D0E14' }}>
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

        {/* Compliance tracker */}
        <Card>
          <CardHeader title="Compliance Tracker" />
          <div className="divide-y" style={{ borderColor: '#0D0E14' }}>
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
    </div>
  )
}

// keep import used
function GitBranch({ size, style }: { size: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
}

function Phone({ size, style }: { size: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
}
