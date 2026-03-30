'use client'
import React, { useState } from 'react'
import { Sparkles, UserMinus, UserPlus, MessageSquare, LogOut, Map } from 'lucide-react'
import SchoolEmptyState from '@/components/dashboard/SchoolEmptyState'
import { useHasSchoolData } from '@/components/dashboard/EmptyState'

const HIGHLIGHTS = [
  '14 pupils marked absent today — 3 with no parent contact yet',
  'New admission form received for Jamie Hassan — starts 7 April, Year 3',
  'Trip permission deadline for Year 5 London trip is Friday — 12 of 28 still outstanding',
  'FSM review due for 6 pupils — eligibility check needed before end of term',
]

const ACTIONS = [
  { label: 'Log Absence', icon: <UserMinus size={14} /> },
  { label: 'New Admission', icon: <UserPlus size={14} /> },
  { label: 'Send Communication', icon: <MessageSquare size={14} /> },
  { label: 'New Leaver', icon: <LogOut size={14} /> },
  { label: 'Trip Permission', icon: <Map size={14} /> },
]

const STATS = [
  { label: 'Total Pupils', value: '423', sub: 'Oakridge Primary' },
  { label: 'New Admissions', value: '3', sub: 'This term' },
  { label: 'Leavers', value: '2', sub: 'End of term' },
  { label: 'Messages Today', value: '12', sub: 'Sent today' },
]

const ABSENCES = [
  { id: 1, name: 'Aisha Patel', year: 'Year 2', reason: 'Illness', contact: true },
  { id: 2, name: 'Liam Chen', year: 'Year 4', reason: 'Illness', contact: false },
  { id: 3, name: 'Priya Williams', year: 'Year 1', reason: 'Dental', contact: true },
  { id: 4, name: 'Marcus Brown', year: 'Year 5', reason: 'Illness', contact: false },
  { id: 5, name: 'Sophie Clarke', year: 'Year 3', reason: 'Holiday', contact: true },
  { id: 6, name: 'James Ford', year: 'Year 3', reason: 'Unknown', contact: false },
  { id: 7, name: 'Chloe Osei', year: 'Year 6', reason: 'Illness', contact: true },
]

const ADMISSIONS = [
  { id: 1, name: 'Jamie Hassan', year: 'Year 3', start: '7 Apr 2026', status: 'Confirmed', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 2, name: 'Ella Wright', year: 'Year 1', start: '14 Apr 2026', status: 'Paperwork pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 3, name: 'Noah Garcia', year: 'Reception', start: '19 Apr 2026', status: 'Awaiting DFE ref', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
]

const COMMUNICATIONS = [
  { id: 1, subject: 'Year 5 London Trip reminder', audience: '28 families', scheduled: 'Scheduled Thu 9am', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 2, subject: 'FSM eligibility letters', audience: '6 families', scheduled: 'Draft', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  { id: 3, subject: 'End of term newsletter', audience: 'All', scheduled: 'Awaiting sign-off', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
]

const TRIPS = [
  { id: 1, name: 'Year 5 London (Science Museum)', date: '2 May', pupils: 28, returned: 16, total: 28 },
  { id: 2, name: 'Reception Farm Trip', date: '28 Mar', pupils: 22, returned: 22, total: 22 },
]

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
      style={{ backgroundColor: '#0D9488', color: '#F9FAFB', maxWidth: 320 }}>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  )
}

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

function QuickActions({ actions, onAction }: { actions: { label: string; icon: React.ReactNode }[]; onAction?: (label: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.label}
          onClick={() => onAction?.(a.label)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
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

export default function DemoSchoolOfficePage() {
  const hasData = useHasSchoolData('school-office')
  const [toast, setToast] = useState('')
  if (hasData === null) return null
  if (!hasData) return <SchoolEmptyState pageKey="school-office" title="No school office data yet" description="Upload your admin, cover and communications data to activate School Office." uploads={[{ key: 'school-office', label: 'Upload School Office Data (CSV)' }]} />
  function fireToast(action: string) {
    setToast(`${action} — demo data only, no changes saved`)
    setTimeout(() => setToast(''), 3000)
  }
  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>School Office</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Absences, admissions, communications and trips — Oakridge Primary</p>
      </div>

      {/* AI Highlights */}
      <AIHighlights items={HIGHLIGHTS} />

      {/* Quick actions */}
      <QuickActions actions={ACTIONS} onAction={fireToast} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Absences today */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Absences Today</p>
            <Badge label="14 absent" color="#EF4444" bg="rgba(239,68,68,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View all 14 →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Pupil</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Year Group</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Reason</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Contact Made</p>
          </div>
          {ABSENCES.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.year}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.reason}</p>
              <div>
                {row.contact ? (
                  <Badge label="Yes" color="#22C55E" bg="rgba(34,197,94,0.12)" />
                ) : row.reason === 'Unknown' ? (
                  <Badge label="No contact" color="#EF4444" bg="rgba(239,68,68,0.12)" />
                ) : (
                  <Badge label="No" color="#EF4444" bg="rgba(239,68,68,0.12)" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent admissions */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Admissions</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Manage all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Pupil</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Year Group</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Start Date</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {ADMISSIONS.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.year}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.start}</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Pending communications */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Pending Communications</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-3 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Subject</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Audience</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {COMMUNICATIONS.map(row => (
            <div key={row.id} className="grid grid-cols-3 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.subject}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.audience}</p>
              <Badge label={row.scheduled} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming trips */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Upcoming Trips</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Manage trips →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {TRIPS.map(trip => {
            const pct = Math.round((trip.returned / trip.total) * 100)
            const complete = trip.returned === trip.total
            return (
              <div key={trip.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{trip.name}</p>
                    <Badge
                      label={complete ? 'All forms returned' : `${trip.returned}/${trip.total} forms returned`}
                      color={complete ? '#22C55E' : '#F59E0B'}
                      bg={complete ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xs" style={{ color: '#6B7280' }}>{trip.date} · {trip.pupils} pupils</p>
                  </div>
                  <div className="mt-2" style={{ backgroundColor: '#1F2937' }}>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                      <div style={{ width: `${pct}%`, backgroundColor: complete ? '#22C55E' : '#0D9488' }} className="h-full rounded-full" />
                    </div>
                  </div>
                </div>
                <p className="text-sm font-bold shrink-0" style={{ color: complete ? '#22C55E' : '#F59E0B' }}>{pct}%</p>
              </div>
            )
          })}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
