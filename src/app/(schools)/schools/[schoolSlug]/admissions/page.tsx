'use client'

import React from 'react'
import { MessageSquare, Calendar, Mail, Users, Share2, Sparkles } from 'lucide-react'

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
        <button key={a.label} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
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

const aiHighlights = [
  'Open day next Saturday — 34 registered, 12 confirmed attendance, 22 no response yet',
  '3 new enquiries this week — all via lumiocms.com/schools referral page',
  'Nursery applications for September now open — 14 received, 20 places available',
  'Ofsted report should be shared on social media — draft post ready for your approval',
]

const pipeline = [
  { stage: 'Enquiry', count: 5, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  { stage: 'Visit Booked', count: 8, color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  { stage: 'Offer Made', count: 38, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { stage: 'Accepted', count: 34, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
]

const applications = [
  { name: 'Jamie Hassan', yearGroup: 'Year 3', dateReceived: '20 Mar 2026', stage: 'Accepted', status: 'Starting 7 Apr', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { name: 'Ella Wright', yearGroup: 'Year 1', dateReceived: '18 Mar 2026', stage: 'Offer Made', status: 'Paperwork pending', statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)' },
  { name: 'Noah Garcia', yearGroup: 'Reception', dateReceived: '15 Mar 2026', stage: 'Accepted', status: 'Starting Sep 2026', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { name: 'Amara Obi', yearGroup: 'Nursery', dateReceived: '14 Mar 2026', stage: 'Enquiry', status: 'Tour booked 28 Mar', statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)' },
  { name: 'Finn Murray', yearGroup: 'Reception', dateReceived: '12 Mar 2026', stage: 'Waiting List', status: 'Position 3', statusColor: '#9CA3AF', statusBg: 'rgba(156,163,175,0.12)' },
  { name: 'Isla Davis', yearGroup: 'Year 2', dateReceived: '10 Mar 2026', stage: 'Offer Made', status: 'Awaiting response', statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)' },
  { name: 'Leo Thompson', yearGroup: 'Nursery', dateReceived: '8 Mar 2026', stage: 'Accepted', status: 'Starting Sep 2026', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
]

const waitingList = [
  { name: 'Finn Murray', yearGroup: 'Reception', position: 1, applied: '12 Mar' },
  { name: 'Grace Patel', yearGroup: 'Reception', position: 2, applied: '9 Mar' },
  { name: 'Harry Lee', yearGroup: 'Nursery', position: 3, applied: '5 Mar' },
]

const commsHistory = [
  { subject: 'Open day invitation sent', recipient: 'All registered', date: '15 Mar', count: '34 sent' },
  { subject: 'Offer letter — Jamie Hassan', recipient: '1:1', date: '21 Mar', count: 'Sent' },
  { subject: 'Tour confirmation — Amara Obi', recipient: '1:1', date: '22 Mar', count: 'Sent' },
  { subject: 'Waiting list update', recipient: '9 families', date: '20 Mar', count: 'Sent' },
]

export default function AdmissionsPage() {
  return (
    <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: '#07080F' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#F9FAFB' }}>Admissions</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Applications pipeline, open days, waiting list and parent communications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications" value="47" sub="2026 entry" />
        <StatCard label="Offers Made" value="38" sub="81% of applications" />
        <StatCard label="Waiting List" value="9" sub="Remaining" />
        <StatCard label="Open Day Registrations" value="34" sub="Next Sat 29 Mar" />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={[
        { label: 'New Enquiry', icon: <MessageSquare size={14} /> },
        { label: 'Book Tour', icon: <Calendar size={14} /> },
        { label: 'Send Newsletter', icon: <Mail size={14} /> },
        { label: 'Open Day', icon: <Users size={14} /> },
        { label: 'Social Post', icon: <Share2 size={14} /> },
      ]} />

      {/* AI Highlights */}
      <AIHighlights items={aiHighlights} />

      {/* Pipeline Summary */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Applications Pipeline</p>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>2026 entry — all year groups</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ backgroundColor: '#1F2937' }}>
          {pipeline.map((stage, i) => (
            <div key={stage.stage} className="p-5 flex flex-col gap-2" style={{ backgroundColor: '#111318' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{stage.stage}</span>
                {i < pipeline.length - 1 && (
                  <span className="ml-auto text-xs" style={{ color: '#1F2937' }}>→</span>
                )}
              </div>
              <p className="text-3xl font-black" style={{ color: stage.color }}>{stage.count}</p>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                <div className="h-full rounded-full" style={{ width: `${(stage.count / 47) * 100}%`, backgroundColor: stage.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Recent Applications</p>
          <Badge label="7 shown" color="#0D9488" bg="rgba(13,148,136,0.12)" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Name', 'Year Group', 'Date Received', 'Stage', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {applications.map((app, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{app.name}</td>
                  <td className="px-5 py-3" style={{ color: '#D1D5DB' }}>{app.yearGroup}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{app.dateReceived}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{app.stage}</td>
                  <td className="px-5 py-3">
                    <Badge label={app.status} color={app.statusColor} bg={app.statusBg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Day Management */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Open Day Management</p>
            <Badge label="29 Mar 2026" color="#0D9488" bg="rgba(13,148,136,0.12)" />
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg p-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                <p style={{ color: '#6B7280' }}>Date</p>
                <p className="font-semibold mt-0.5" style={{ color: '#F9FAFB' }}>Saturday 29 March 2026</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                <p style={{ color: '#6B7280' }}>Time</p>
                <p className="font-semibold mt-0.5" style={{ color: '#F9FAFB' }}>10:00am – 12:00pm</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                <p style={{ color: '#6B7280' }}>Host</p>
                <p className="font-semibold mt-0.5" style={{ color: '#F9FAFB' }}>Mrs Henderson</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
                <p style={{ color: '#6B7280' }}>Reminder due</p>
                <p className="font-semibold mt-0.5" style={{ color: '#F59E0B' }}>Wed 26 March</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Registrations (34)</p>
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <p className="text-2xl font-black" style={{ color: '#22C55E' }}>12</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Confirmed</p>
                </div>
                <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>22</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>No response</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Tour guides</p>
              <div className="flex flex-wrap gap-2">
                {['Mrs Collins', 'Mr Rashid', 'Miss Khan'].map(name => (
                  <span key={name} className="rounded-md px-2 py-1 text-xs" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#2DD4BF', border: '1px solid rgba(13,148,136,0.2)' }}>{name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Waiting List */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Waiting List</p>
            <Badge label="9 total" color="#9CA3AF" bg="rgba(156,163,175,0.12)" />
          </div>
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {waitingList.map(entry => (
              <div key={entry.name} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                    style={{ backgroundColor: 'rgba(156,163,175,0.12)', color: '#9CA3AF' }}>
                    {entry.position}
                  </span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{entry.name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{entry.yearGroup}</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Applied {entry.applied}</p>
              </div>
            ))}
            <div className="px-5 py-4">
              <p className="text-xs text-center" style={{ color: '#6B7280' }}>+ 6 more on waiting list</p>
            </div>
          </div>
        </div>
      </div>

      {/* Communication History */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Communication History</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Subject', 'Recipient', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {commsHistory.map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{c.subject}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{c.recipient}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{c.date}</td>
                  <td className="px-5 py-3">
                    <Badge label={c.count} color="#22C55E" bg="rgba(34,197,94,0.12)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
