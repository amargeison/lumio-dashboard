'use client'
import { useState, useEffect } from 'react'
import { Plus, Calendar, Search, Printer, FileText, AlertTriangle, X, BarChart3 } from 'lucide-react'
import { EmptyState } from '@/app/(schools)/components/EmptyState'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'

const SUBJECTS = [
  { name: 'Maths', color: '#3B82F6' },
  { name: 'English', color: '#22C55E' },
  { name: 'Science', color: '#8B5CF6' },
  { name: 'History', color: '#F59E0B' },
  { name: 'Geography', color: '#0D9488' },
  { name: 'PE', color: '#EF4444' },
  { name: 'Art', color: '#EC4899' },
  { name: 'Music', color: '#F97316' },
]

const TEACHERS = ['Mrs Collins','Mr Rashid','Mrs Chen','Mr Thompson','Miss Khan','Mrs Okafor','Mr Singh','Miss Roberts','Mr Patel','Mrs Davies','Mr Whitmore','Miss Green','Mrs Andrews','Mr Taylor','Miss Brown']
const ROOMS = ['Room 1','Room 2','Room 3','Room 4','Room 5','Room 6','Room 7','Room 8','Room 9','Room 10','Main Hall','Science Lab 1','Science Lab 2','IT Suite','Art Studio','Music Room','Sports Hall','Library','Room 11','Room 12']
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
const YEARS = ['Year 7','Year 8','Year 9','Year 10','Year 11','Year 12']

const PERIODS = [
  { id: 'reg', label: 'Registration', time: '08:50-09:00', isBreak: false },
  { id: 'p1', label: 'Period 1', time: '09:00-10:00', isBreak: false },
  { id: 'p2', label: 'Period 2', time: '10:00-11:00', isBreak: false },
  { id: 'break', label: 'Break', time: '11:00-11:20', isBreak: true },
  { id: 'p3', label: 'Period 3', time: '11:20-12:20', isBreak: false },
  { id: 'lunch', label: 'Lunch', time: '12:20-13:10', isBreak: true },
  { id: 'p4', label: 'Period 4', time: '13:10-14:10', isBreak: false },
  { id: 'p5', label: 'Period 5', time: '14:10-15:10', isBreak: false },
]

type Lesson = { day: string; periodId: string; className: string; subject: string; teacher: string; room: string }

function generateTimetable(): Lesson[] {
  const lessons: Lesson[] = []
  const teachingPeriods = PERIODS.filter(p => !p.isBreak && p.id !== 'reg')
  for (const year of YEARS) {
    for (const day of DAYS) {
      for (const period of teachingPeriods) {
        const seed = (year.charCodeAt(5) * 7 + day.charCodeAt(0) * 13 + period.id.charCodeAt(1) * 3) % SUBJECTS.length
        const tSeed = (seed + day.length + period.id.length) % TEACHERS.length
        const rSeed = (seed * 3 + tSeed) % ROOMS.length
        lessons.push({ day, periodId: period.id, className: year, subject: SUBJECTS[seed].name, teacher: TEACHERS[tSeed], room: ROOMS[rSeed] })
      }
    }
  }
  // Add 2 deliberate clashes
  if (lessons.length > 10) {
    lessons.push({ day: 'Monday', periodId: 'p3', className: 'Year 11', subject: 'Physics', teacher: lessons[5].teacher, room: 'Science Lab 1' })
    lessons.push({ day: 'Wednesday', periodId: 'p4', className: 'Year 10', subject: 'Chemistry', teacher: 'Mr Singh', room: lessons[20].room })
  }
  return lessons
}

const TIMETABLE = generateTimetable()

function getSubjectColor(subject: string): string {
  return SUBJECTS.find(s => s.name === subject)?.color || '#6B7280'
}

function findClashes(lessons: Lesson[]): { type: string; detail: string; lessons: Lesson[] }[] {
  const clashes: { type: string; detail: string; lessons: Lesson[] }[] = []
  for (let i = 0; i < lessons.length; i++) {
    for (let j = i + 1; j < lessons.length; j++) {
      if (lessons[i].day === lessons[j].day && lessons[i].periodId === lessons[j].periodId) {
        if (lessons[i].teacher === lessons[j].teacher) {
          clashes.push({ type: 'teacher', detail: `${lessons[i].teacher}: Double-booked ${lessons[i].periodId} ${lessons[i].day} (${lessons[i].className} ${lessons[i].subject} / ${lessons[j].className} ${lessons[j].subject})`, lessons: [lessons[i], lessons[j]] })
        }
        if (lessons[i].room === lessons[j].room && lessons[i].className !== lessons[j].className) {
          clashes.push({ type: 'room', detail: `${lessons[i].room}: Double-booked ${lessons[i].periodId} ${lessons[i].day} (${lessons[i].className} / ${lessons[j].className})`, lessons: [lessons[i], lessons[j]] })
        }
      }
    }
  }
  return clashes
}

const INPUT_S: React.CSSProperties = { backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%' }

export default function TimetablePage() {
  const [hasData, setHasData] = useState<boolean | null>(null)

  useEffect(() => {
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/schools\/([^/]+)/)
    const slug = slugMatch?.[1] ?? 'school'
    setHasData(
      localStorage.getItem(`lumio_${slug}_timetable_hasData`) === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  const [view, setView] = useState<'week' | 'teacher' | 'room' | 'class'>('week')
  const [selectedYear, setSelectedYear] = useState('Year 7')
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[0])
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0])
  const [showNewLesson, setShowNewLesson] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [newLesson, setNewLesson] = useState({ className: '', subject: SUBJECTS[0].name, teacher: TEACHERS[0], room: ROOMS[0], day: DAYS[0], periodId: 'p1' })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const clashes = findClashes(TIMETABLE)

  function getFilteredLessons(): Lesson[] {
    if (view === 'week' || view === 'class') return TIMETABLE.filter(l => l.className === selectedYear)
    if (view === 'teacher') return TIMETABLE.filter(l => l.teacher === selectedTeacher)
    if (view === 'room') return TIMETABLE.filter(l => l.room === selectedRoom)
    return []
  }

  function isClash(day: string, periodId: string, lessons: Lesson[]): boolean {
    const matching = lessons.filter(l => l.day === day && l.periodId === periodId)
    return matching.length > 1
  }

  const filtered = getFilteredLessons()

  function renderGrid(lessons: Lesson[], emptyLabel = '') {
    return (
      <div className="rounded-xl overflow-x-auto" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <table className="w-full text-xs" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280', width: 120, borderBottom: '1px solid #1F2937' }}>Period</th>
              {DAYS.map(d => <th key={d} className="px-2 py-2.5 text-center font-semibold" style={{ color: '#6B7280', borderBottom: '1px solid #1F2937' }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period.id}>
                <td className="px-3 py-2 font-medium" style={{ color: period.isBreak ? '#4B5563' : '#F9FAFB', borderBottom: '1px solid #1F2937', backgroundColor: period.isBreak ? '#0A0B10' : 'transparent' }}>
                  <div>{period.label}</div>
                  <div className="text-xs" style={{ color: '#4B5563' }}>{period.time}</div>
                </td>
                {DAYS.map(day => {
                  if (period.isBreak) return <td key={day} className="px-2 py-2 text-center" style={{ backgroundColor: '#0A0B10', borderBottom: '1px solid #1F2937', color: '#4B5563' }}>{period.label}</td>
                  const dayLessons = lessons.filter(l => l.day === day && l.periodId === period.id)
                  const lesson = dayLessons[0]
                  const clash = dayLessons.length > 1
                  return (
                    <td key={day} className="px-1.5 py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
                      {lesson ? (
                        <div className="rounded-lg px-2 py-1.5 relative" style={{ backgroundColor: getSubjectColor(lesson.subject) + '18', border: clash ? '2px solid #EF4444' : `1px solid ${getSubjectColor(lesson.subject)}33` }}>
                          <div className="font-bold" style={{ color: getSubjectColor(lesson.subject) }}>{lesson.subject}</div>
                          <div style={{ color: '#D1D5DB' }}>{lesson.teacher}</div>
                          <div style={{ color: '#6B7280' }}>{lesson.room}</div>
                          {clash && <span className="absolute top-1 right-1 text-xs px-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#F87171', fontSize: 9 }}>⚠ Clash</span>}
                        </div>
                      ) : (
                        <div className="rounded-lg px-2 py-3 text-center" style={{ color: '#374151' }}>{emptyLabel || ''}</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (hasData === null) return null
  if (!hasData) return (
    <EmptyState
      pageName="timetable"
      title="No timetable data yet"
      description="Sync your timetable from your MIS or upload manually to see lessons, rooms and teacher allocations here."
      uploads={[
        { key: 'timetable', label: 'Upload Timetable (CSV)' },
        { key: 'mis', label: 'Connect MIS (Arbor / SIMS / Bromcom)' },
      ]}
    />
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Timetable</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Manage lessons, rooms and teacher schedules</p>
        </div>
        <div className="flex gap-1">
          {[
            { id: 'week' as const, icon: '📅', label: 'Week' },
            { id: 'teacher' as const, icon: '👤', label: 'Teacher' },
            { id: 'room' as const, icon: '🏫', label: 'Room' },
            { id: 'class' as const, icon: '👥', label: 'Class' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: view === v.id ? '#0D9488' : '#111318', color: view === v.id ? '#F9FAFB' : '#9CA3AF', border: view === v.id ? '1px solid #0D9488' : '1px solid #1F2937' }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      <DeptAISummary dept="timetable" portal="schools" />

      {/* Quick Actions */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {[
          { label: 'New Lesson', icon: Plus, onClick: () => setShowNewLesson(true) },
          { label: 'Cover Lesson', icon: Calendar, onClick: () => showToast('Opening cover booking...') },
          { label: 'Room Finder', icon: Search, onClick: () => showToast('Room finder coming soon') },
          { label: 'Print Timetable', icon: Printer, onClick: () => showToast('Preparing print view...') },
          { label: 'Export to PDF', icon: FileText, onClick: () => showToast('Exporting PDF...') },
          { label: 'Dept Insights', icon: BarChart3, onClick: () => setShowInsights(true) },
        ].map(a => (
          <button key={a.label} onClick={a.onClick} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      {/* View selectors */}
      {(view === 'week' || view === 'class') && (
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {YEARS.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)} className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: selectedYear === y ? 'rgba(13,148,136,0.15)' : '#111318', color: selectedYear === y ? '#0D9488' : '#6B7280', border: selectedYear === y ? '1px solid rgba(13,148,136,0.3)' : '1px solid #1F2937' }}>
              {y}
            </button>
          ))}
        </div>
      )}
      {view === 'teacher' && (
        <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={{ ...INPUT_S, maxWidth: 300 }}>
          {TEACHERS.map(t => <option key={t}>{t}</option>)}
        </select>
      )}
      {view === 'room' && (
        <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={{ ...INPUT_S, maxWidth: 300 }}>
          {ROOMS.map(r => <option key={r}>{r}</option>)}
        </select>
      )}

      {/* Grid */}
      {renderGrid(filtered, view === 'teacher' ? 'Free' : view === 'room' ? 'Available' : '')}

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timetable Health */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Timetable Health</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Coverage', value: '94%', color: '#0D9488' },
              { label: 'Teacher Workload', value: 'Balanced', color: '#22C55E' },
              { label: 'Room Utilisation', value: '78%', color: '#F59E0B' },
              { label: 'Clashes', value: String(clashes.length), color: clashes.length > 0 ? '#EF4444' : '#22C55E' },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.label}</p>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Clash Detection */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: clashes.length > 0 ? '#EF4444' : '#22C55E' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{clashes.length} clashes detected</h3>
          </div>
          {clashes.length === 0 ? (
            <p className="text-xs" style={{ color: '#22C55E' }}>No scheduling conflicts found</p>
          ) : (
            <div className="space-y-2">
              {clashes.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-xs" style={{ color: '#F87171' }}>{c.detail}</p>
                  <button onClick={() => showToast('Clash resolution coming soon')} className="text-xs px-2 py-1 rounded flex-shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171' }}>Resolve</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Lesson Modal */}
      {showNewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full rounded-2xl" style={{ maxWidth: 440, backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>New Lesson</h2>
              <button onClick={() => setShowNewLesson(false)} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Class</label><input value={newLesson.className} onChange={e => setNewLesson(l => ({ ...l, className: e.target.value }))} style={INPUT_S} placeholder="Year 7A" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Subject</label><select value={newLesson.subject} onChange={e => setNewLesson(l => ({ ...l, subject: e.target.value }))} style={INPUT_S}>{SUBJECTS.map(s => <option key={s.name}>{s.name}</option>)}</select></div>
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Teacher</label><select value={newLesson.teacher} onChange={e => setNewLesson(l => ({ ...l, teacher: e.target.value }))} style={INPUT_S}>{TEACHERS.map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Room</label><select value={newLesson.room} onChange={e => setNewLesson(l => ({ ...l, room: e.target.value }))} style={INPUT_S}>{ROOMS.map(r => <option key={r}>{r}</option>)}</select></div>
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Day</label><select value={newLesson.day} onChange={e => setNewLesson(l => ({ ...l, day: e.target.value }))} style={INPUT_S}>{DAYS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label className="text-xs font-medium block mb-1" style={{ color: '#9CA3AF' }}>Period</label><select value={newLesson.periodId} onChange={e => setNewLesson(l => ({ ...l, periodId: e.target.value }))} style={INPUT_S}>{PERIODS.filter(p => !p.isBreak).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
              </div>
              <button onClick={() => { showToast('Lesson added to timetable'); setShowNewLesson(false) }} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Add Lesson</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, backgroundColor: '#0D9488', color: '#F9FAFB', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{toast}</div>}
      <AIInsightsReport dept="timetable" portal="schools" isOpen={showInsights} onClose={() => setShowInsights(false)} />
    </div>
  )
}
