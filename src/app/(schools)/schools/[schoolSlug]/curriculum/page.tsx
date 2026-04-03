'use client'
import React, { useState, useEffect } from 'react'
import { EmptyState } from '@/app/(schools)/components/EmptyState'
import { Sparkles, BookOpen, FileText, Users, ClipboardList, PenLine, BarChart3 } from 'lucide-react'
import { LessonPlanModal, CoverWorkModal, ParentsEveningModal, AssessmentTrackerModal, ReportWriterModal } from '@/components/modals/CurriculumModals'
import DeptAISummary from '@/components/DeptAISummary'
import AIInsightsReport from '@/components/AIInsightsReport'

const HIGHLIGHTS = [
  'Parents evening 67% booked — 139 families still to respond, deadline is Friday',
  'Year 2 phonics assessments overdue — Mrs Brown\'s class, 2 weeks behind schedule',
  'SATs prep resources updated for Year 6 — 28 pupils enrolled in intervention group',
  'Book scrutiny scheduled next Tuesday — Year 3 and 4 teachers to prepare marked books',
]

const ACTIONS_BASE = [
  { label: 'Generate Lesson Plan', icon: <BookOpen size={14} /> },
  { label: 'Cover Work', icon: <FileText size={14} /> },
  { label: 'Parents Evening', icon: <Users size={14} /> },
  { label: 'Assessment Tracker', icon: <ClipboardList size={14} /> },
  { label: 'Report Writer', icon: <PenLine size={14} /> },
]

const STATS = [
  { label: 'Lesson Plans This Week', value: '47', sub: 'Across all year groups' },
  { label: 'Cover Work Generated', value: '3', sub: 'This week' },
  { label: 'Parents Evening Booked', value: '284', sub: 'of 423 families' },
  { label: 'Overdue Assessments', value: '2', sub: 'Need attention', color: '#EF4444' },
]

const LESSON_PLANS = [
  { id: 1, year: 'Reception', teacher: 'Mrs O. Bell', submitted: '5/5', status: 'Complete', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 2, year: 'Year 1', teacher: 'Miss R. Khan', submitted: '5/5', status: 'Complete', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 3, year: 'Year 2', teacher: 'Mrs T. Brown', submitted: '4/5', status: '1 missing', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 4, year: 'Year 3', teacher: 'Mrs K. Collins', submitted: '5/5', status: 'Complete', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 5, year: 'Year 4', teacher: 'Mrs R. Clarke', submitted: '5/5', status: 'Complete', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 6, year: 'Year 5', teacher: 'Mr T. Rashid', submitted: '5/5', status: 'Complete', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 7, year: 'Year 6', teacher: 'Mr D. Whitmore', submitted: '5/5', status: 'Complete', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
]

const ASSESSMENTS = [
  { id: 1, name: 'Year 2 Phonics Check', due: 'Due 10 Mar (overdue)', teacher: 'Mrs T. Brown', status: 'Not complete', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { id: 2, name: 'Year 6 SATs Mock', due: 'Due 28 Mar', teacher: 'Mr D. Whitmore', status: 'Scheduled', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 3, name: 'KS1 Reading Assessment', due: 'Due 4 Apr', teacher: 'Miss R. Khan', status: 'Scheduled', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { id: 4, name: 'Year 4 Times Tables Check', due: 'Due 11 Apr', teacher: 'Mrs R. Clarke', status: 'Not started', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { id: 5, name: 'Foundation Stage Profile', due: 'Due 30 Jun', teacher: 'Mrs O. Bell', status: 'In progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
]

const PARENTS_EVENING = [
  { id: 1, year: 'Reception', total: 22, booked: 18 },
  { id: 2, year: 'Year 1', total: 28, booked: 21 },
  { id: 3, year: 'Year 2', total: 27, booked: 16 },
  { id: 4, year: 'Year 3', total: 31, booked: 24 },
  { id: 5, year: 'Year 4', total: 29, booked: 18 },
  { id: 6, year: 'Year 5', total: 28, booked: 19 },
  { id: 7, year: 'Year 6', total: 30, booked: 22 },
]

const EVENTS = [
  { id: 1, event: 'Book scrutiny', date: 'Tue 25 Mar', scope: 'Y3 & Y4', who: 'All year group teachers' },
  { id: 2, event: 'SATs parents briefing', date: 'Thu 27 Mar', scope: 'Year 6', who: 'Mr Whitmore' },
  { id: 3, event: 'CPD — Assessment for Learning', date: '28 Mar', scope: 'All year groups', who: 'All teaching staff' },
  { id: 4, event: 'Parents Evening', date: 'Tue/Wed 1–2 Apr', scope: 'All year groups', who: 'All teachers' },
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

function QuickActions({ actions }: { actions: { label: string; icon: React.ReactNode; onClick?: () => void }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.label} onClick={a.onClick} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
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

export default function CurriculumPage() {
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [showLessonPlan, setShowLessonPlan] = useState(false)
  const [showCoverWork, setShowCoverWork] = useState(false)
  const [showParentsEvening, setShowParentsEvening] = useState(false)
  const [showAssessment, setShowAssessment] = useState(false)
  const [showReportWriter, setShowReportWriter] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showAIInsights, setShowAIInsights] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/schools\/([^/]+)/)
    const slug = slugMatch?.[1] ?? 'school'
    setHasData(
      localStorage.getItem(`lumio_${slug}_curriculum_hasData`) === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  if (hasData === null) return null
  if (!hasData) return (
    <EmptyState
      pageName="curriculum"
      title="No curriculum data yet"
      description="Upload your assessment data, subject plans and timetable to activate Curriculum."
      uploads={[
        { key: 'assessment', label: 'Upload Assessment Data (CSV)' },
        { key: 'timetable', label: 'Upload Timetable (CSV)' },
        { key: 'mis', label: 'Connect MIS' },
      ]}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Curriculum</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Lesson plans, assessments, parents evening and curriculum events</p>
      </div>

      {/* AI Summary + Highlights side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <DeptAISummary dept="curriculum" portal="schools" />
        <AIHighlights items={HIGHLIGHTS} />
      </div>

      {/* Quick actions */}
      <QuickActions actions={[...ACTIONS_BASE.map(a => ({
        ...a,
        onClick: a.label === 'Generate Lesson Plan' ? () => setShowLessonPlan(true)
          : a.label === 'Cover Work' ? () => setShowCoverWork(true)
          : a.label === 'Parents Evening' ? () => setShowParentsEvening(true)
          : a.label === 'Assessment Tracker' ? () => setShowAssessment(true)
          : a.label === 'Report Writer' ? () => setShowReportWriter(true)
          : () => showToast('Feature coming soon'),
      })), { label: 'Dept Insights', icon: <BarChart3 size={14} />, onClick: () => setShowAIInsights(true) }]} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Lesson plan tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Lesson Plan Tracker</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View all →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Year Group</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Teacher</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Plans Submitted</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {LESSON_PLANS.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.year}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.teacher}</p>
              <p className="text-sm font-medium" style={{ color: '#D1D5DB' }}>{row.submitted}</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Assessment schedule */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Assessment Schedule</p>
            <Badge label="1 overdue" color="#EF4444" bg="rgba(239,68,68,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Manage →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Assessment</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Due Date</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Teacher</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
          </div>
          {ASSESSMENTS.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.name}</p>
              <p className="text-sm" style={{ color: row.color === '#EF4444' ? '#EF4444' : '#9CA3AF' }}>{row.due}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.teacher}</p>
              <Badge label={row.status} color={row.color} bg={row.bg} />
            </div>
          ))}
        </div>
      </div>

      {/* Parents evening booking */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Parents Evening Booking</p>
            <Badge label="284/423 booked" color="#0D9488" bg="rgba(13,148,136,0.12)" />
          </div>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>Send reminders →</span>
        </div>
        <div className="flex flex-col gap-4 p-5">
          {PARENTS_EVENING.map(row => {
            const pct = Math.round((row.booked / row.total) * 100)
            const isLow = pct < 65
            const barColor = isLow ? '#F59E0B' : '#0D9488'
            return (
              <div key={row.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.year}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{row.booked}/{row.total} families</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: isLow ? '#F59E0B' : '#2DD4BF' }}>{pct}%</p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  <div style={{ width: `${pct}%`, backgroundColor: barColor }} className="h-full rounded-full" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming curriculum events */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Upcoming Curriculum Events</p>
          <span className="text-xs cursor-pointer" style={{ color: '#0D9488' }}>View calendar →</span>
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          <div className="grid grid-cols-4 gap-4 px-5 py-2">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Event</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Date</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Scope</p>
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Staff</p>
          </div>
          {EVENTS.map(row => (
            <div key={row.id} className="grid grid-cols-4 gap-4 px-5 py-3 items-center">
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{row.event}</p>
              <p className="text-sm" style={{ color: '#2DD4BF' }}>{row.date}</p>
              <p className="text-sm" style={{ color: '#D1D5DB' }}>{row.scope}</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{row.who}</p>
            </div>
          ))}
        </div>
      </div>

      {showLessonPlan && <LessonPlanModal onClose={() => setShowLessonPlan(false)} />}
      {showCoverWork && <CoverWorkModal onClose={() => setShowCoverWork(false)} />}
      {showParentsEvening && <ParentsEveningModal onClose={() => setShowParentsEvening(false)} />}
      {showAssessment && <AssessmentTrackerModal onClose={() => setShowAssessment(false)} />}
      {showReportWriter && <ReportWriterModal onClose={() => setShowReportWriter(false)} />}
      {toast && <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100, backgroundColor: '#0D9488', color: '#F9FAFB', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{toast}</div>}
      <AIInsightsReport dept="curriculum" portal="schools" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
    </div>
  )
}
