'use client'
import React, { useState } from 'react'
import { Sparkles, ClipboardList, UserPlus, Eye, Calendar } from 'lucide-react'
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
  const [showRegister, setShowRegister] = useState(false)
  const [showAddPupil, setShowAddPupil] = useState(false)
  const [showTimetable, setShowTimetable] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  function handleAction(label: string) {
    if (label === 'Register Class') setShowRegister(true)
    else if (label === 'Add Pupil to Class') setShowAddPupil(true)
    else if (label === 'Timetable Change') setShowTimetable(true)
    else showToast('Feature coming soon')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Classes</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Manage timetables, registers and class groups</p>
      </div>

      {/* AI Highlights */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
          <Sparkles size={13} style={{ color: '#0D9488' }} />
          <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>AI Key Highlights</span>
        </div>
        <div className="px-5 py-3 space-y-2">
          {HIGHLIGHTS.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
              <span className="flex-shrink-0 mt-0.5" style={{ color: '#0D9488' }}>\u2022</span>{h}
            </div>
          ))}
        </div>
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
    </div>
  )
}
