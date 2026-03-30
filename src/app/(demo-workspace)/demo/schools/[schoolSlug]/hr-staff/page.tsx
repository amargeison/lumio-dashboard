'use client'
import React, { useState } from 'react'
import { Sparkles, UserX, Calendar, UserPlus, Shield, FileText, BarChart3 } from 'lucide-react'
import SchoolEmptyState from '@/components/dashboard/SchoolEmptyState'
import { useHasSchoolData } from '@/components/dashboard/EmptyState'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'

const HIGHLIGHTS = [
  'M. Taylor DBS expired 10 March — urgent renewal needed before next classroom contact',
  'Mrs Clarke absent today — cover arranged by Mrs Andrews for Class 4C',
  '3 performance reviews due this half term — none yet scheduled',
  'CPD day scheduled 28 March — 6 staff members have not yet confirmed attendance',
]

const ACTIONS = [
  { label: 'Log Absence', icon: <UserX size={14} /> },
  { label: 'Book Cover', icon: <Calendar size={14} /> },
  { label: 'New Staff Member', icon: <UserPlus size={14} /> },
  { label: 'DBS Check', icon: <Shield size={14} /> },
  { label: 'Performance Review', icon: <FileText size={14} /> },
  { label: 'Dept Insights', icon: <BarChart3 size={14} /> },
]

const STATS = [
  { label: 'Total Staff', value: '41', sub: 'Teaching & support' },
  { label: 'Absent Today', value: '2', sub: 'Cover arranged' },
  { label: 'On Cover', value: '1', sub: 'Classroom cover' },
  { label: 'DBS Renewals Due', value: '1', sub: 'Urgent action', color: '#EF4444' },
]

const STAFF = [
  { id: 1, name: 'Mrs K. Collins', role: 'Year 3 Teacher', status: 'Present' },
  { id: 2, name: 'Mr T. Rashid', role: 'Year 5 Teacher', status: 'Present' },
  { id: 3, name: 'Mrs R. Clarke', role: 'Year 4 Teacher', status: 'Absent' },
  { id: 4, name: 'Mr D. Whitmore', role: 'Year 6 Teacher', status: 'Cover' },
  { id: 5, name: 'Miss R. Khan', role: 'Year 1 Teacher', status: 'Present' },
  { id: 6, name: 'Mrs J. Andrews', role: 'Office Manager', status: 'Present' },
  { id: 7, name: 'Mr M. Taylor', role: 'Teaching Assistant', status: 'Present' },
  { id: 8, name: 'Mrs S. Okafor', role: 'SENCO', status: 'Present' },
  { id: 9, name: 'Miss L. Green', role: 'Year 2 Teacher', status: 'Present' },
  { id: 10, name: 'Mr A. Singh', role: 'PE Teacher', status: 'Present' },
]

const DBS = [
  { id: 1, name: 'Mr M. Taylor', role: 'TA', expiry: 'Expired 10 Mar 2026', status: 'Expired', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 2, name: 'Mrs K. Collins', role: 'Y3 Teacher', expiry: '15 Sep 2026', status: 'Current', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 3, name: 'Mr T. Rashid', role: 'Y5 Teacher', expiry: '3 Dec 2026', status: 'Current', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 4, name: 'Miss R. Khan', role: 'Y1 Teacher', expiry: '30 Jun 2026', status: 'Current', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 5, name: 'Mrs R. Clarke', role: 'Y4 Teacher', expiry: '22 Aug 2026', status: 'Current', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
]

const COVER = [
  { id: 1, day: 'Mon 24 Mar', absent: 'Mrs R. Clarke', class: 'Year 4 (Rm 4C)', cover: 'Mr D. Whitmore', period: 'All day' },
  { id: 2, day: 'Wed 26 Mar', absent: 'Miss L. Green', class: 'Year 2 (Rm 2B)', cover: 'Mrs J. Andrews', period: 'AM only' },
]

const CPD = [
  { id: 1, type: 'Performance Review', who: 'Mrs K. Collins', date: 'Due 28 Mar', status: 'Not scheduled', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 2, type: 'Performance Review', who: 'Mr T. Rashid', date: 'Due 28 Mar', status: 'Not scheduled', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 3, type: 'Performance Review', who: 'Miss R. Khan', date: 'Due 28 Mar', status: 'Not scheduled', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 4, type: 'CPD Day', who: 'All staff', date: '28 Mar', status: '35/41 confirmed', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 5, type: 'First Aid Renewal', who: 'Mr A. Singh', date: 'Due 15 Apr', status: 'Booked', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
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

function statusBadge(status: string) {
  if (status === 'Present') return <Badge label="Present" color="#22C55E" bg="rgba(34,197,94,0.12)" />
  if (status === 'Absent') return <Badge label="Absent" color="#EF4444" bg="rgba(239,68,68,0.12)" />
  if (status === 'Cover') return <Badge label="Cover" color="#F59E0B" bg="rgba(245,158,11,0.12)" />
  return <Badge label={status} color="#9CA3AF" bg="rgba(156,163,175,0.12)" />
}

export default function DemoHRStaffPage() {
  const hasData = useHasSchoolData('hr-staff')
  const [toast, setToast] = useState('')
  const [showInsights, setShowInsights] = useState(false)
  if (hasData === null) return null
  if (!hasData) return <SchoolEmptyState pageKey="hr-staff" title="No HR & staff data yet" description="Upload your staff roster, contracts and absence records to activate HR & Staff." uploads={[{ key: 'hr-staff', label: 'Upload Staff Roster (CSV)' }]} />
  function fireToast(action: string) {
    if (action === 'Dept Insights') { setShowInsights(true); return }
    setToast(`${action} — demo data only, no changes saved`)
    setTimeout(() => setToast(''), 3000)
  }
  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>HR & Staff</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Staff attendance, cover, DBS compliance and professional development</p>
      </div>

      <DeptAISummary dept="hr-staff" portal="schools" />

      {/* AI Highlights */}
      <AIHighlights items={HIGHLIGHTS} />

      {/* Quick actions */}
      <QuickActions actions={ACTIONS} onAction={fireToast} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Staff list */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Staff Today</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View all 41 →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-3 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Name</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Role</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {STAFF.map(row => (
            <div key={row.id} className="grid grid-cols-3 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.role}</p>
              {statusBadge(row.status)}
            </div>
          ))}
        </div>
      </div>

      {/* DBS tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>DBS Tracker</p>
            <Badge label="1 expired" color="#EF4444" bg="rgba(239,68,68,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Manage all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Name</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Role</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Expiry</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {DBS.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.role}</p>
              <p className="text-sm" style={{ color: row.status === 'Expired' ? '#EF4444' : '#D1D5DB' }}>{row.expiry}</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Cover bookings */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Cover Bookings This Week</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Book cover →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-5 gap-3 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Day</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Absent</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Class</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Cover</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Period</p>
          </div>
          {COVER.map(row => (
            <div key={row.id} className="grid grid-cols-5 gap-3 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.day}</p>
              <p className="text-sm" style={{ color: '#EF4444' }}>{row.absent}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.class}</p>
              <p className="text-sm" style={{ color: '#0D9488' }}>{row.cover}</p>
              <Badge label={row.period} color="#F59E0B" bg="rgba(245,158,11,0.12)" />
            </div>
          ))}
        </div>
      </div>

      {/* CPD & Reviews */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>CPD & Performance Reviews</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Schedule all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Type</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Staff Member</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Date</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {CPD.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.type}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.who}</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{row.date}</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <AIInsightsReport dept="hr-staff" portal="schools" isOpen={showInsights} onClose={() => setShowInsights(false)} />
    </div>
  )
}
