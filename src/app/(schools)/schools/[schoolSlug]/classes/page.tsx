'use client'
import React, { useState, useEffect } from 'react'
import { Sparkles, ClipboardList, UserPlus, Eye, Calendar, BarChart3 } from 'lucide-react'

const CLASSES_HIGHLIGHTS = [
  '2 classes without updated cover plans',
  '1 set change pending — Year 3 Maths',
  '4 intervention groups currently active',
  'Year 6 exam group flagged for additional support',
  '3 new starters allocated to classes this term',
]

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
import { EmptyState } from '@/app/(schools)/components/EmptyState'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'
import { RegisterClassModal, AddPupilToClassModal, TimetableChangeModal } from '@/components/modals/SchoolModals'

const HIGHLIGHTS = [
  '32 classes registered this term \u2014 2 without an assigned teacher',
  'Year 4B register not taken this morning \u2014 follow up required',
  '3 timetable changes pending approval this week',
  'Set reviews due for Year 9 Maths and English by end of term',
]

const ACTIONS = [
  { label: 'Register Class', icon: <ClipboardList size={14} /> },
  { label: 'Add Pupil to Class', icon: <UserPlus size={14} /> },
  { label: 'Class Overview', icon: <Eye size={14} /> },
  { label: 'Timetable Change', icon: <Calendar size={14} /> },
  { label: 'Dept Insights', icon: <BarChart3 size={14} /> },
]

const CLASSES = [
  { name: 'Year 1A', year: 'Year 1', teacher: 'Miss Roberts', pupils: 28, register: 'taken' },
  { name: 'Year 2B', year: 'Year 2', teacher: 'Mr Patel', pupils: 30, register: 'taken' },
  { name: 'Year 4B', year: 'Year 4', teacher: 'Unassigned', pupils: 29, register: 'missing' },
  { name: 'Year 6A', year: 'Year 6', teacher: 'Mrs Chen', pupils: 31, register: 'taken' },
  { name: 'Year 9 Maths', year: 'Year 9', teacher: 'Mr Thompson', pupils: 25, register: 'taken' },
]

const STATS = [
  { label: 'Total Classes', value: '32', color: '#0D9488' },
  { label: 'Pupils Registered Today', value: '387 / 423', color: '#22C55E' },
  { label: 'Unassigned Classes', value: '2', color: '#F59E0B' },
  { label: 'Timetable Changes', value: '3', color: '#A78BFA' },
]

function QuickActions({ actions, onAction }: { actions: typeof ACTIONS; onAction: (label: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.label} onClick={() => onAction(a.label)} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0F766E')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0D9488')}>
          {a.icon}{a.label}
        </button>
      ))}
    </div>
  )
}

export default function ClassesPage() {
  const [hasData, setHasData] = useState<boolean | null>(null)

  useEffect(() => {
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/schools\/([^/]+)/)
    const slug = slugMatch?.[1] ?? 'school'
    setHasData(
      localStorage.getItem(`lumio_${slug}_classes_hasData`) === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  const [showRegister, setShowRegister] = useState(false)
  const [showAddPupil, setShowAddPupil] = useState(false)
  const [showTimetable, setShowTimetable] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  function handleAction(label: string) {
    if (label === 'Register Class') setShowRegister(true)
    else if (label === 'Add Pupil to Class') setShowAddPupil(true)
    else if (label === 'Timetable Change') setShowTimetable(true)
    else if (label === 'Dept Insights') setShowInsights(true)
    else showToast('Feature coming soon')
  }

  if (hasData === null) return null
  if (!hasData) return (
    <EmptyState
      pageName="classes"
      title="No classes set up yet"
      description="Import your class groups and pupil allocations via CSV or sync from your MIS to manage registers and timetables."
      uploads={[
        { key: 'classes', label: 'Upload Class Groups (CSV)' },
        { key: 'mis', label: 'Connect MIS (Arbor / SIMS / Bromcom)' },
      ]}
    />
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Classes</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Manage timetables, registers and class groups</p>
      </div>

      {/* AI Summary + Highlights side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <DeptAISummary dept="classes" portal="schools" />
        <AIHighlights items={CLASSES_HIGHLIGHTS} />
      </div>

      <QuickActions actions={ACTIONS} onAction={handleAction} />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-panel content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Class List */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Class List</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Class Name', 'Year Group', 'Teacher', 'Pupils', 'Register'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLASSES.map(c => (
                <tr key={c.name} style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{c.name}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{c.year}</td>
                  <td className="px-5 py-3" style={{ color: c.teacher === 'Unassigned' ? '#F59E0B' : '#9CA3AF' }}>{c.teacher}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{c.pupils}</td>
                  <td className="px-5 py-3">
                    {c.register === 'taken' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>\u2705 Taken</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>\u26A0\uFE0F Missing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Register Summary */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Today's Register Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Classes taken', value: '29 / 32', color: '#22C55E' },
              { label: 'Average class size', value: '28', color: '#0D9488' },
              { label: 'SEND pupils across all classes', value: '47', color: '#A78BFA' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#6B7280' }}>{s.label}</span>
                <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #1F2937', paddingTop: 12 }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#F59E0B' }}>Missing registers:</p>
              {['Year 4B', 'Year 7C', 'Year 10D'].map(c => (
                <div key={c} className="flex items-center gap-2 text-xs mb-1" style={{ color: '#F59E0B' }}>
                  <span>\u26A0\uFE0F</span>{c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRegister && <RegisterClassModal onClose={() => setShowRegister(false)} onToast={showToast} />}
      {showAddPupil && <AddPupilToClassModal onClose={() => setShowAddPupil(false)} onToast={showToast} />}
      {showTimetable && <TimetableChangeModal onClose={() => setShowTimetable(false)} onToast={showToast} />}
      {toast && <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, backgroundColor: '#0D9488', color: '#F9FAFB', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{toast}</div>}
      <AIInsightsReport dept="classes" portal="schools" isOpen={showInsights} onClose={() => setShowInsights(false)} />
    </div>
  )
}
