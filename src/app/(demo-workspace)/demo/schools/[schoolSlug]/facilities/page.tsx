'use client'

import React, { useState } from 'react'
import { Wrench, Calendar, UserCheck, Shield, Package, Sparkles } from 'lucide-react'
import SchoolEmptyState from '@/components/dashboard/SchoolEmptyState'
import { useHasSchoolData } from '@/components/dashboard/EmptyState'

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
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
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
  return <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>{label}</span>
}

const maintenanceJobs = [
  { ref: 'MNT-041', area: 'Year 1 Corridor', description: 'Heating not working', priority: 'HIGH', days: 2, status: 'In progress', statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)' },
  { ref: 'MNT-040', area: 'Main Hall', description: 'Stage lighting fault', priority: 'MEDIUM', days: 5, status: 'Awaiting contractor', statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)' },
  { ref: 'MNT-039', area: 'Reception Class', description: 'Door lock stiff', priority: 'LOW', days: 8, status: 'Reported', statusColor: '#9CA3AF', statusBg: 'rgba(156,163,175,0.12)' },
  { ref: 'MNT-038', area: 'Staff Toilets', description: 'Tap leaking', priority: 'LOW', days: 12, status: 'Awaiting parts', statusColor: '#9CA3AF', statusBg: 'rgba(156,163,175,0.12)' },
]

const complianceCerts = [
  { item: 'Gas Safety', lastDate: '30 Apr 2025', expiry: '30 Apr 2026', status: 'Due in 37 days', statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)' },
  { item: 'Electrical Installation', lastDate: '15 Jan 2024', expiry: '15 Jan 2029', status: 'Current', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { item: 'Fire Risk Assessment', lastDate: '1 Sep 2025', expiry: '1 Sep 2026', status: 'Current', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { item: 'Asbestos Management Review', lastDate: '20 Mar 2025', expiry: '20 Mar 2026', status: 'Overdue', statusColor: '#EF4444', statusBg: 'rgba(239,68,68,0.12)' },
  { item: 'Legionella Risk Assessment', lastDate: '10 Nov 2024', expiry: '10 Nov 2025', status: 'Overdue', statusColor: '#EF4444', statusBg: 'rgba(239,68,68,0.12)' },
  { item: 'PAT Testing', lastDate: '5 Sep 2025', expiry: '5 Sep 2026', status: 'Current', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { item: 'Lift Inspection (not applicable)', lastDate: 'N/A', expiry: 'N/A', status: 'N/A', statusColor: '#6B7280', statusBg: 'rgba(107,114,128,0.12)' },
]

const roomBookings = [
  { time: '8:45–9:30', room: 'Hall', group: 'Year 6 PE', bookedBy: 'Mr Whitmore' },
  { time: '9:30–10:30', room: 'Hall', group: 'SATs assembly', bookedBy: 'Mrs Henderson' },
  { time: '10:45–12:00', room: 'IT Suite', group: 'Year 4 computing', bookedBy: 'Mrs Clarke' },
  { time: '1:00–3:00', room: 'Hall', group: 'Year 3 & 4 Dance', bookedBy: 'Miss Khan' },
  { time: '1:00–2:00', room: 'Library', group: 'SEND small group', bookedBy: 'Mrs Okafor' },
  { time: '2:00–3:00', room: 'IT Suite', group: 'Year 6 SATs prep', bookedBy: 'Mr Whitmore' },
  { time: '3:15–5:00', room: 'Hall', group: 'Football club', bookedBy: 'Mr Singh' },
  { time: '4:00–6:00', room: 'Main Hall', group: 'Governors meeting', bookedBy: 'Admin' },
]

const contractorLog = [
  { company: 'Sparks Electrical', purpose: 'Stage lighting', arrival: '8:30am', departure: '10:15am', onSite: false },
  { company: 'MK Plumbing Services', purpose: 'Staff toilet repair', arrival: '11:00am', departure: 'Still on site', onSite: true },
]

const aiHighlights = [
  'Gas safety certificate expires 30 April — contractor not yet booked, urgent',
  'Heating fault in Year 1 corridor — logged 2 days ago, no update from contractor',
  'Asbestos management plan annual review due — schedule with site manager this week',
  'Hall booked for 6 events this week — confirm setup requirements with caretaker',
]

export default function DemoFacilitiesPage() {
  const hasData = useHasSchoolData('facilities')
  const [toast, setToast] = useState('')
  if (hasData === null) return null
  if (!hasData) return <SchoolEmptyState pageKey="facilities" title="No facilities data yet" description="Upload your asset register and maintenance records to activate Facilities." uploads={[{ key: 'facilities', label: 'Upload Facilities Data (CSV)' }]} />

  function fireToast(action: string) {
    setToast(`${action} — demo data only, no changes saved`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#F9FAFB' }}>Facilities & Site Management</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Maintenance jobs, compliance certificates, room bookings and contractor access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Jobs" value="4" sub="Maintenance" color="#F59E0B" />
        <StatCard label="Compliance Due" value="2" sub="Certs expiring" color="#EF4444" />
        <StatCard label="Room Bookings Today" value="8" sub="Hall & classrooms" />
        <StatCard label="Last Fire Drill" value="✓" sub="14 Mar 2026" color="#22C55E" />
      </div>

      {/* Quick Actions */}
      <QuickActions
        onAction={fireToast}
        actions={[
          { label: 'Log Maintenance', icon: <Wrench size={14} /> },
          { label: 'Book Room', icon: <Calendar size={14} /> },
          { label: 'Contractor Sign-in', icon: <UserCheck size={14} /> },
          { label: 'H&S Check', icon: <Shield size={14} /> },
          { label: 'Asset Register', icon: <Package size={14} /> },
        ]}
      />

      {/* AI Highlights */}
      <AIHighlights items={aiHighlights} />

      {/* Open Maintenance Jobs */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Open Maintenance Jobs</p>
          <Badge label="4 open" color="#F59E0B" bg="rgba(245,158,11,0.12)" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Ref', 'Area', 'Description', 'Priority', 'Days Open', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {maintenanceJobs.map(job => (
                <tr key={job.ref} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-mono font-semibold" style={{ color: '#2DD4BF' }}>{job.ref}</td>
                  <td className="px-5 py-3" style={{ color: '#D1D5DB' }}>{job.area}</td>
                  <td className="px-5 py-3" style={{ color: '#D1D5DB' }}>{job.description}</td>
                  <td className="px-5 py-3">
                    <Badge
                      label={job.priority}
                      color={job.priority === 'HIGH' ? '#EF4444' : job.priority === 'MEDIUM' ? '#F59E0B' : '#9CA3AF'}
                      bg={job.priority === 'HIGH' ? 'rgba(239,68,68,0.12)' : job.priority === 'MEDIUM' ? 'rgba(245,158,11,0.12)' : 'rgba(156,163,175,0.12)'}
                    />
                  </td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{job.days} days</td>
                  <td className="px-5 py-3">
                    <Badge label={job.status} color={job.statusColor} bg={job.statusBg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Certificate Tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Compliance Certificate Tracker</p>
          <div className="flex gap-2">
            <Badge label="2 overdue" color="#EF4444" bg="rgba(239,68,68,0.12)" />
            <Badge label="1 due soon" color="#F59E0B" bg="rgba(245,158,11,0.12)" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Certificate', 'Last Issued', 'Expiry', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {complianceCerts.map(cert => (
                <tr key={cert.item} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{cert.item}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{cert.lastDate}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{cert.expiry}</td>
                  <td className="px-5 py-3">
                    <Badge label={cert.status} color={cert.statusColor} bg={cert.statusBg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room Bookings Today */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Room Bookings Today</p>
          <Badge label="8 bookings" color="#0D9488" bg="rgba(13,148,136,0.12)" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Time', 'Room', 'Group', 'Booked By'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {roomBookings.map((booking, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-mono font-medium" style={{ color: '#2DD4BF' }}>{booking.time}</td>
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{booking.room}</td>
                  <td className="px-5 py-3" style={{ color: '#D1D5DB' }}>{booking.group}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{booking.bookedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contractor Visitor Log */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Contractor Visitor Log — Today</p>
          <Badge label="1 on site" color="#22C55E" bg="rgba(34,197,94,0.12)" />
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {contractorLog.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{c.company}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{c.purpose}</p>
              </div>
              <div className="flex items-center gap-6 text-xs" style={{ color: '#9CA3AF' }}>
                <span>Arrived: <span className="font-medium" style={{ color: '#D1D5DB' }}>{c.arrival}</span></span>
                <span>Departed: <span className="font-medium" style={{ color: c.onSite ? '#F59E0B' : '#D1D5DB' }}>{c.departure}</span></span>
                {c.onSite && <Badge label="On site" color="#F59E0B" bg="rgba(245,158,11,0.12)" />}
                {!c.onSite && <Badge label="Signed out" color="#22C55E" bg="rgba(34,197,94,0.12)" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
