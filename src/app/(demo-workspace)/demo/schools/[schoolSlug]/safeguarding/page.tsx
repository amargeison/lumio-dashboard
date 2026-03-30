'use client'

import React, { useState } from 'react'
import { AlertTriangle, FileSearch, Phone, GraduationCap, Shield, Sparkles, BarChart3 } from 'lucide-react'
import SchoolEmptyState from '@/components/dashboard/SchoolEmptyState'
import { useHasSchoolData } from '@/components/dashboard/EmptyState'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'

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

const aiHighlights = [
  'SG-2026-047 open and overdue for DSL review — raised 18 March, action required today',
  '2 staff members outstanding on annual safeguarding training — deadline 30 April',
  'Looked After Child review for P. Williams due 2 April — liaise with Virtual School Head',
  'Single Central Record last updated 3 weeks ago — monthly review recommended',
]

const scrItems = [
  { item: 'DBS checks current for all staff', status: '38/41 current', note: 'M. Taylor expired', statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)' },
  { item: 'Safeguarding policy reviewed', status: 'Current', note: 'Sep 2025', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { item: 'KCSIE sign-off — all staff', status: '39/41 complete', note: '', statusColor: '#F59E0B', statusBg: 'rgba(245,158,11,0.12)' },
  { item: 'DSL trained and certificated', status: 'Current', note: '', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { item: 'Safer recruitment training — HT', status: 'Current', note: '', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { item: 'Allegations policy in place', status: 'Current', note: '', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
  { item: 'Online safety policy reviewed', status: 'Current', note: 'Oct 2025', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)' },
]

const trainingRecords = [
  { name: 'Mrs S. Okafor (DSL)', role: 'SENCO', completed: 'Sep 2025', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)', status: 'Current' },
  { name: 'Mrs S. Henderson', role: 'Headteacher', completed: 'Sep 2025', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)', status: 'Current' },
  { name: 'Mrs K. Collins', role: 'Y3 Teacher', completed: 'Sep 2025', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)', status: 'Current' },
  { name: 'Mr T. Rashid', role: 'Y5 Teacher', completed: 'Sep 2025', statusColor: '#22C55E', statusBg: 'rgba(34,197,94,0.12)', status: 'Current' },
  { name: 'Mr M. Taylor', role: 'TA', completed: '—', statusColor: '#EF4444', statusBg: 'rgba(239,68,68,0.12)', status: 'Not completed' },
  { name: 'Miss L. Green', role: 'Y2 Teacher', completed: '—', statusColor: '#EF4444', statusBg: 'rgba(239,68,68,0.12)', status: 'Not completed' },
]

const caseTimeline = [
  { date: '18 Mar 2026 09:14', event: 'Concern raised by class teacher', overdue: false },
  { date: '18 Mar 2026 10:30', event: 'Logged in safeguarding system by DSL', overdue: false },
  { date: '18 Mar 2026 11:00', event: 'Initial assessment: monitor, no immediate risk', overdue: false },
  { date: '19 Mar 2026', event: 'Review due (not completed) — overdue', overdue: true },
  { date: '24 Mar 2026 — Today', event: 'Action required', overdue: true },
]

export default function DemoSafeguardingPage() {
  const hasData = useHasSchoolData('safeguarding')
  const [toast, setToast] = useState('')
  const [showInsights, setShowInsights] = useState(false)
  if (hasData === null) return null
  if (!hasData) return <SchoolEmptyState pageKey="safeguarding" title="No safeguarding data yet" description="Upload your safeguarding log and concern records to activate Safeguarding." uploads={[{ key: 'safeguarding', label: 'Upload Safeguarding Log (CSV)' }]} />

  function fireToast(action: string) {
    if (action === 'Dept Insights') { setShowInsights(true); return }
    setToast(`${action} — demo data only, no changes saved`)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#F9FAFB' }}>Safeguarding</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>DSL dashboard — cases, SCR compliance and staff training</p>
        </div>
        <div className="rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
          <AlertTriangle size={12} />
          Confidential — DSL access only
        </div>
      </div>

      <DeptAISummary dept="safeguarding" portal="schools" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Cases" value="1" sub="Review overdue" color="#EF4444" />
        <StatCard label="Closed This Term" value="4" sub="Resolved" />
        <StatCard label="Staff Trained" value="39" sub="of 41 staff" color="#F59E0B" />
        <StatCard label="Next Review" value="Apr" sub="April 2026" />
      </div>

      {/* Quick Actions */}
      <QuickActions
        onAction={fireToast}
        actions={[
          { label: 'Log Concern', icon: <AlertTriangle size={14} /> },
          { label: 'DSL Review', icon: <FileSearch size={14} /> },
          { label: 'MASH Referral', icon: <Phone size={14} /> },
          { label: 'Staff Training', icon: <GraduationCap size={14} /> },
          { label: 'KCSIE Compliance', icon: <Shield size={14} /> },
          { label: 'Dept Insights', icon: <BarChart3 size={14} /> },
        ]}
      />

      {/* AI Highlights */}
      <AIHighlights items={aiHighlights} />

      {/* Open Cases */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937', backgroundColor: 'rgba(239,68,68,0.05)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: '#EF4444' }} />
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Open Cases</p>
          </div>
          <Badge label="1 open — action required" color="#EF4444" bg="rgba(239,68,68,0.12)" />
        </div>
        <div className="p-5">
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold" style={{ color: '#EF4444' }}>SG-2026-047</span>
                <Badge label="DSL Review Overdue" color="#EF4444" bg="rgba(239,68,68,0.12)" />
              </div>
              <span className="text-xs" style={{ color: '#6B7280' }}>Raised 18 Mar 2026</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div>
                <span style={{ color: '#6B7280' }}>Category: </span>
                <span style={{ color: '#D1D5DB' }}>Welfare Concern</span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>Status: </span>
                <span style={{ color: '#EF4444' }}>Review overdue</span>
              </div>
            </div>
            {/* Case Timeline */}
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>Case Timeline</p>
              <div className="space-y-3">
                {caseTimeline.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: entry.overdue ? '#EF4444' : '#22C55E' }} />
                      {i < caseTimeline.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ backgroundColor: '#1F2937', minHeight: '16px' }} />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-xs font-semibold" style={{ color: entry.overdue ? '#EF4444' : '#9CA3AF' }}>{entry.date}</p>
                      <p className="text-xs mt-0.5" style={{ color: entry.overdue ? '#FCA5A5' : '#D1D5DB' }}>{entry.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: '#6B7280' }}>All historical cases are stored securely in the encrypted safeguarding record.</p>
        </div>
      </div>

      {/* SCR Compliance Checker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Single Central Record (SCR) Compliance</p>
          <Badge label="2 actions needed" color="#F59E0B" bg="rgba(245,158,11,0.12)" />
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {scrItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{item.item}</p>
                {item.note && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{item.note}</p>}
              </div>
              <Badge label={item.status} color={item.statusColor} bg={item.statusBg} />
            </div>
          ))}
        </div>
      </div>

      {/* Training Tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Safeguarding Training Tracker</p>
          <div className="flex items-center gap-3">
            <div className="h-2 w-24 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
              <div className="h-full rounded-full" style={{ width: '95%', backgroundColor: '#0D9488' }} />
            </div>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>39/41</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Name', 'Role', 'Completed', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {trainingRecords.map((record, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{record.name}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{record.role}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{record.completed}</td>
                  <td className="px-5 py-3">
                    <Badge label={record.status} color={record.statusColor} bg={record.statusBg} />
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="px-5 py-3 text-center" style={{ color: '#6B7280' }}>
                  + 35 more current staff — all training complete
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <AIInsightsReport dept="safeguarding" portal="schools" isOpen={showInsights} onClose={() => setShowInsights(false)} />
    </div>
  )
}
