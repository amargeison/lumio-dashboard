'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Users, Shield, UserPlus, GitBranch, FileText,
  Activity, Phone, Calendar, AlertTriangle, CheckCircle2,
  Clock, Loader2, TrendingUp, Zap, X,
} from 'lucide-react'

import SchoolBanner from './components/SchoolBanner'
import ClearDemoBar from '@/components/dashboard/ClearDemoBar'

// ─── Demo seed data ───────────────────────────────────────────────────────────

const SCHOOL = { name: 'Oakridge Primary School', headteacher: 'Sarah Henderson', ofsted: 'Good', pupils: 423, staff: 41, town: 'Milton Keynes' }

const ATTENDANCE_BY_YEAR = [
  { year: 'Reception', pct: 96.1 }, { year: 'Year 1', pct: 94.8 },
  { year: 'Year 2',    pct: 93.2 }, { year: 'Year 3', pct: 95.7 },
  { year: 'Year 4',    pct: 92.4 }, { year: 'Year 5', pct: 94.1 },
  { year: 'Year 6',    pct: 91.8 },
]

const WORKFLOWS = [
  { name: 'Daily Absence Alert',       status: 'COMPLETE', time: '7:32am'    },
  { name: 'DBS Reminder — M. Taylor',  status: 'ACTION',   time: '8:00am'    },
  { name: 'Cover Booking — Mrs Jones', status: 'COMPLETE', time: '8:14am'    },
  { name: 'Safeguarding Log Sync',     status: 'RUNNING',  time: '8:30am'    },
  { name: 'Parent Comms — Yr 4 Trip',  status: 'COMPLETE', time: 'Yesterday' },
  { name: 'Ofsted Readiness Check',    status: 'COMPLETE', time: 'Monday'    },
]

const STAFF_TODAY = [
  { name: 'Mrs K. Collins', role: 'Year 3', status: 'in'     },
  { name: 'Mr T. Rashid',   role: 'Year 5', status: 'in'     },
  { name: 'Mrs S. Okafor',  role: 'SENCO',  status: 'absent' },
  { name: 'Mr D. Whitmore', role: 'Year 6', status: 'cover'  },
  { name: 'Miss R. Khan',   role: 'Year 1', status: 'in'     },
  { name: 'Mrs J. Andrews', role: 'Office', status: 'in'     },
]

const SCHEDULE = [
  { time: '8:50am',  event: 'Register period',                 type: 'admin'    },
  { time: '10:00am', event: 'Year 6 SATs prep — Hall',         type: 'academic' },
  { time: '11:30am', event: 'SENCO review meeting',            type: 'meeting'  },
  { time: '2:00pm',  event: "Parent consultation — J. Morris", type: 'parent'   },
]

const COMPLIANCE = [
  { item: 'DBS checks current',    status: 'ok',      detail: '38/41 current'          },
  { item: 'M. Taylor DBS overdue', status: 'urgent',  detail: 'Expired 10 Mar 2026'    },
  { item: 'Fire drill completed',  status: 'ok',      detail: 'Completed 14 Mar'       },
  { item: 'Safeguarding training', status: 'pending', detail: '2 staff due by Apr 30'  },
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
    COMPLETE: { bg: 'rgba(34,197,94,0.1)',   text: '#22C55E', label: 'Complete' },
    RUNNING:  { bg: 'rgba(96,165,250,0.12)', text: '#60A5FA', label: 'Running'  },
    ACTION:   { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: 'Action'   },
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
  if (status === 'in')     return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(13,148,136,0.1)',  color: '#0D9488' }}>In</span>
  if (status === 'absent') return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)',   color: '#EF4444' }}>Absent</span>
  return                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)',  color: '#F59E0B' }}>Cover</span>
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-2xl" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxWidth: 420 }}>
      <Zap size={14} style={{ color: '#0D9488', flexShrink: 0 }} />
      <p className="text-sm" style={{ color: '#D1D5DB' }}>{message}</p>
      <button onClick={onClose} style={{ color: '#6B7280' }}><X size={14} /></button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoSchoolOverviewPage() {
  const [toast, setToast] = useState('')

  const attendanceAvg = Math.round(ATTENDANCE_BY_YEAR.reduce((s, y) => s + y.pct, 0) / ATTENDANCE_BY_YEAR.length * 10) / 10
  const staffIn = STAFF_TODAY.filter(s => s.status === 'in').length
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  function fireToast(action: string) {
    setToast(`In your live workspace, this would: ${action}`)
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="space-y-6">

      <ClearDemoBar />
      <SchoolBanner
        schoolName={SCHOOL.name}
        headteacher={SCHOOL.headteacher}
        town={SCHOOL.town}
        attendance={94}
        staffIn="4/6"
        openConcerns={1}
        activeWorkflows={23}
        weeksToSATs={7}
      />

      {/* Safeguarding alert */}
      <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Shield size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>1 open safeguarding concern</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Requires DSL review — logged 2 days ago</p>
        </div>
        <button onClick={() => fireToast('open safeguarding concern detail and DSL review panel')}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>
          Review now
        </button>
      </div>

      {/* AI Briefing */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Morning Briefing</p>
          <span className="flex items-center gap-1 text-xs" style={{ color: '#0D9488' }}><Sparkles size={12} /> Updated 7:30am</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { icon: Activity,   color: '#0D9488', text: `Overall attendance today is ${attendanceAvg}% — Year 6 is lowest at 91.8%. Two pupils flagged for persistent absence review.` },
            { icon: Shield,     color: '#EF4444', text: '1 open safeguarding concern logged 2 days ago has not been reviewed. DSL sign-off required today.' },
            { icon: Users,      color: '#F59E0B', text: 'Mrs S. Okafor (SENCO) is absent today. Cover has been arranged. EHCP review meeting at 11:30am still scheduled.' },
            { icon: FileText,   color: '#A78BFA', text: 'M. Taylor DBS check expired on 10 March. Renewal must be initiated before end of week.' },
            { icon: TrendingUp, color: '#22C55E', text: 'Year 6 SATs prep session running at 10am. All 28 registered pupils confirmed.' },
          ].map(({ icon: Icon, color, text }, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #1F2937' }}>
                <Icon size={12} style={{ color }} />
              </div>
              <p className="text-sm pt-0.5" style={{ color: '#D1D5DB' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Attendance today',  value: `${attendanceAvg}%`,               sub: '7-year group avg',  color: ragColor(attendanceAvg), icon: Activity  },
          { label: 'Active workflows',  value: '23',                               sub: '3 need attention',  color: '#6C3FC5',               icon: GitBranch },
          { label: 'Open concerns',     value: '1',                                sub: 'Safeguarding',      color: '#EF4444',               icon: Shield    },
          { label: 'Staff in today',    value: `${staffIn}/${STAFF_TODAY.length}`, sub: '1 on cover',        color: '#0D9488',               icon: Users     },
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

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Log Absence',    action: 'log a pupil absence and trigger the attendance workflow',     icon: Users,    color: '#0D9488' },
          { label: 'New Concern',    action: 'open a new safeguarding concern form for DSL review',         icon: Shield,   color: '#EF4444' },
          { label: 'Parent Contact', action: 'compose and send a parent communication via email or SMS',    icon: Phone,    color: '#6C3FC5' },
          { label: 'Book Cover',     action: 'create a new supply cover booking and notify the cover pool', icon: Calendar, color: '#F59E0B' },
          { label: 'New Admission',  action: 'start the new pupil admission workflow with 3-step form',     icon: UserPlus, color: '#0D9488' },
          { label: 'Run Report',     action: 'generate an AI-powered report for governors or Ofsted',       icon: FileText, color: '#9CA3AF' },
        ].map(({ label, action, icon: Icon, color }) => (
          <button key={label} onClick={() => fireToast(action)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>
            <Icon size={14} style={{ color }} />{label}
          </button>
        ))}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Attendance */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Attendance by Year Group</p>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Today</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            {ATTENDANCE_BY_YEAR.map(y => (
              <div key={y.year} className="flex items-center gap-3">
                <p className="text-xs w-20 shrink-0" style={{ color: '#9CA3AF' }}>{y.year}</p>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full" style={{ width: `${y.pct}%`, backgroundColor: ragColor(y.pct) }} />
                </div>
                <p className="text-xs w-12 text-right font-medium shrink-0" style={{ color: ragColor(y.pct) }}>{y.pct}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Workflows */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Today&apos;s Workflows</p>
          </div>
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
        </div>
      </div>

      {/* Three column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Staff */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Staff Today</p></div>
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
        </div>

        {/* Schedule */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Today&apos;s Schedule</p></div>
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
        </div>

        {/* Compliance */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Compliance Tracker</p></div>
          <div className="divide-y" style={{ borderColor: '#0D0E14' }}>
            {COMPLIANCE.map((c, i) => {
              const icon = c.status === 'ok'     ? <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                         : c.status === 'urgent' ? <AlertTriangle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                         :                         <Clock         size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
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
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.3)' }}>
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}>
          <Zap size={12} /> Ready to go live?
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#F9FAFB' }}>This is your real dashboard. Without the demo data.</h2>
        <p className="text-sm mb-6 mx-auto max-w-md" style={{ color: '#9CA3AF' }}>Connect {SCHOOL.name} to Lumio for Schools and your team starts saving hours from day one.</p>
        <Link href="/schools" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          Set up your school workspace →
        </Link>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
