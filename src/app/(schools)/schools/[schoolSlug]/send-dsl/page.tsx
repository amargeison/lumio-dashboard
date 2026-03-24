'use client'
import React from 'react'
import { Sparkles, AlertTriangle, FileText, User, ClipboardList, TrendingDown } from 'lucide-react'

const HIGHLIGHTS = [
  'Open safeguarding concern SG-2026-047 — DSL review is overdue by 2 days',
  'T. Morris EHCP annual review due 15 April — LA invite letter not yet sent',
  '3 pupils below 85% attendance — escalation letters due this week',
  'KCSIE annual sign-off — 2 staff members still outstanding',
]

const ACTIONS = [
  { label: 'Log Concern', icon: <AlertTriangle size={14} /> },
  { label: 'EHCP Review', icon: <FileText size={14} /> },
  { label: 'Pupil Passport', icon: <User size={14} /> },
  { label: 'Intervention Log', icon: <ClipboardList size={14} /> },
  { label: 'Attendance Concern', icon: <TrendingDown size={14} /> },
]

const STATS = [
  { label: 'SEND Register', value: '34', sub: 'Pupils on register' },
  { label: 'EHCPs Active', value: '8', sub: 'Current plans' },
  { label: 'Open Concerns', value: '1', sub: 'DSL review overdue', color: '#EF4444' },
  { label: 'Reviews Due', value: '3', sub: 'This term' },
]

const CONCERNS = [
  { id: 1, ref: 'SG-2026-047', opened: '18 Mar 2026', category: 'Welfare concern', status: 'DSL Review Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
]

const SEND_REGISTER = [
  { id: 1, name: 'T. Morris', year: 'Year 4', category: 'SEMH', support: 'SEN Support', ehcp: true },
  { id: 2, name: 'A. Patel', year: 'Year 2', category: 'SpLD (Dyslexia)', support: 'SEN Support', ehcp: false },
  { id: 3, name: 'L. Chen', year: 'Year 3', category: 'ASD', support: 'EHCP', ehcp: true },
  { id: 4, name: 'S. Williams', year: 'Year 5', category: 'Hearing Impairment', support: 'EHCP', ehcp: true },
  { id: 5, name: 'R. Brown', year: 'Year 1', category: 'Speech & Language', support: 'SEN Support', ehcp: false },
  { id: 6, name: 'O. Hassan', year: 'Year 4', category: 'ADHD', support: 'SEN Support', ehcp: false },
  { id: 7, name: 'P. Clarke', year: 'Year 6', category: 'Physical Disability', support: 'EHCP', ehcp: true },
  { id: 8, name: 'M. Osei', year: 'Reception', category: 'GLD', support: 'Monitoring', ehcp: false },
]

const EHCP_REVIEWS = [
  { id: 1, name: 'T. Morris', year: 'Year 4', last: 'Apr 2025', next: '15 Apr 2026', status: 'LA invite not sent', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 2, name: 'L. Chen', year: 'Year 3', last: 'Jun 2025', next: 'Jun 2026', status: 'On track', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 3, name: 'S. Williams', year: 'Year 5', last: 'Jan 2025', next: 'Jan 2026', status: 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 4, name: 'P. Clarke', year: 'Year 6', last: 'Mar 2025', next: 'Mar 2026', status: 'Review scheduled', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
]

const ATTENDANCE_CONCERNS = [
  { id: 1, name: 'J. Ford', year: 'Year 3', pct: 79, status: 'Letter due', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 2, name: 'C. Osei', year: 'Year 6', pct: 82, status: 'Monitoring', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 3, name: 'M. Brown', year: 'Year 5', pct: 84, status: 'First warning sent', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
]

function StatCard({ label, value, sub, color = '#0D9488' }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>
    </div>
  )
}

function AIHighlights({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.4)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
        <Sparkles size={14} style={{ color: '#0D9488' }} />
        <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
        <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Updated just now</span>
      </div>
      <div className="flex flex-col gap-3 p-4" style={{ backgroundColor: '#07080F' }}>
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{i + 1}</span>
            <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActions({ actions }: { actions: { label: string; icon: React.ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.label} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0F766E')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0D9488')}>
          {a.icon}{a.label}
        </button>
      ))}
    </div>
  )
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>{label}</span>
  )
}

export default function SendDslPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>SEND & DSL</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Safeguarding, SEND register, EHCP reviews and attendance concerns</p>
      </div>

      {/* AI Highlights */}
      <AIHighlights items={HIGHLIGHTS} />

      {/* Quick actions */}
      <QuickActions actions={ACTIONS} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Open safeguarding concerns */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Open Safeguarding Concerns</p>
            <Badge label="1 open" color="#EF4444" bg="rgba(239,68,68,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Reference</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Opened</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Category</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {CONCERNS.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#EF4444' }}>{row.ref}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.opened}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.category}</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* SEND Register */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>SEND Register</p>
            <Badge label="34 pupils" color="#0D9488" bg="rgba(13,148,136,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View all 34 →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-5 gap-3 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Name</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Year</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>SEND Category</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Support Level</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>EHCP</p>
          </div>
          {SEND_REGISTER.map(row => (
            <div key={row.id} className="grid grid-cols-5 gap-3 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.year}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.category}</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{row.support}</p>
              {row.ehcp ? (
                <Badge label="Yes" color="#2DD4BF" bg="rgba(13,148,136,0.12)" />
              ) : (
                <Badge label="No" color="#6B7280" bg="rgba(107,114,128,0.12)" />
              )}
            </div>
          ))}
        </div>
        <div className="px-5 py-3" style={{ borderTop: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#6B7280' }}>Showing 8 of 34 pupils — <span className="cursor-pointer" style={{ color: '#0D9488' }}>View all 34 →</span></p>
        </div>
      </div>

      {/* EHCP review tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>EHCP Review Tracker</p>
            <Badge label="1 overdue" color="#EF4444" bg="rgba(239,68,68,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Manage reviews →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-5 gap-3 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Name</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Year</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Last Review</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Next Due</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {EHCP_REVIEWS.map(row => (
            <div key={row.id} className="grid grid-cols-5 gap-3 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.year}</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{row.last}</p>
              <p className="text-sm" style={{ color: row.status === 'Overdue' ? '#EF4444' : '#D1D5DB' }}>{row.next}</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Attendance concerns */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Attendance Concerns (&lt;85%)</p>
            <Badge label="3 pupils" color="#F59E0B" bg="rgba(245,158,11,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Generate letters →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Name</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Year</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Attendance</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Action</p>
          </div>
          {ATTENDANCE_CONCERNS.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.year}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{row.pct}%</p>
                <div className="flex-1 max-w-[80px]">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                    <div style={{ width: `${row.pct}%`, backgroundColor: '#EF4444' }} className="h-full rounded-full" />
                  </div>
                </div>
              </div>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
