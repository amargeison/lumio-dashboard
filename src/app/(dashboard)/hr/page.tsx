'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Users, UserPlus, FileText, Star, AlertCircle, CalendarHeart, Sparkles, Briefcase, ClipboardList, Calendar } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import NewJoinerModal,        { type NewJoinerData }        from '@/components/NewJoinerModal'
import LeaveRequestModal,     { type LeaveRequestData }     from '@/components/LeaveRequestModal'
import OffboardingModal,      { type OffboardingData }      from '@/components/OffboardingModal'
import RecruitmentModal,      { type RecruitmentData }      from '@/components/RecruitmentModal'
import PerformanceReviewModal, { type PerformanceReviewData } from '@/components/PerformanceReviewModal'

// ─── Static data ──────────────────────────────────────────────────────────────

const stats = [
  { label: 'Total Employees',    value: '187', trend: '+3',  trendDir: 'up' as const, trendGood: true,  icon: Users,       sub: 'vs last month' },
  { label: 'Active Onboardings', value: '8',   trend: '+2',  trendDir: 'up' as const, trendGood: true,  icon: UserPlus,    sub: 'this month'    },
  { label: 'Leave Requests',     value: '14',  trend: '+4',  trendDir: 'up' as const, trendGood: false, icon: FileText,    sub: 'pending'       },
  { label: 'Overdue Reviews',    value: '3',   trend: '+1',  trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'vs last week'  },
]

interface Starter {
  name: string; role: string; start: string; day: string; progress: number; status: string
}

const INITIAL_STARTERS: Starter[] = [
  { name: 'Sophie Williams',  role: 'Customer Success Manager', start: '10 Mar 2026', day: 'Day 11', progress: 75,  status: 'Onboarding' },
  { name: 'James Okafor',     role: 'Sales Development Rep',    start: '03 Mar 2026', day: 'Day 18', progress: 90,  status: 'Onboarding' },
  { name: 'Priya Kapoor',     role: 'Frontend Developer',       start: '17 Mar 2026', day: 'Day 4',  progress: 30,  status: 'Onboarding' },
  { name: 'Tom Ashworth',     role: 'Marketing Executive',      start: '17 Mar 2026', day: 'Day 4',  progress: 25,  status: 'Onboarding' },
  { name: 'Amara Diallo',     role: 'Support Specialist',       start: '24 Feb 2026', day: 'Day 25', progress: 100, status: 'Complete'   },
  { name: 'Oliver Chen',      role: 'Account Executive',        start: '24 Feb 2026', day: 'Day 25', progress: 100, status: 'Complete'   },
  { name: 'Fatima Al-Hassan', role: 'Data Analyst',             start: '21 Apr 2026', day: 'Pending',progress: 0,   status: 'Pending'    },
  { name: 'Liam Brennan',     role: 'Head of Partnerships',     start: '07 Apr 2026', day: 'Pending',progress: 0,   status: 'Pending'    },
]

interface LeaveRow { name: string; type: string; dates: string; days: string }

const INITIAL_LEAVE: LeaveRow[] = [
  { name: 'Marcus Reid',    type: 'Annual Leave', dates: '28 Mar – 1 Apr', days: '5 days'   },
  { name: 'Nadia Petrov',   type: 'Sick Leave',   dates: '21 Mar',          days: '1 day'    },
  { name: 'Chris Ogunleye', type: 'Annual Leave', dates: '7–11 Apr',        days: '5 days'   },
  { name: 'Yuki Tanaka',    type: 'Parental',     dates: '1 May – 31 Jul',  days: '3 months' },
]

interface ProbationRow { name: string; date: string; manager: string }

const INITIAL_PROBATIONS: ProbationRow[] = [
  { name: 'Amara Diallo', date: '24 Mar 2026', manager: 'Laura Simmons' },
  { name: 'Oliver Chen',  date: '24 Mar 2026', manager: 'Dan Marsh'     },
  { name: 'James Okafor', date: '3 Apr 2026',  manager: 'Dan Marsh'     },
]

interface OffboardingRow { name: string; role: string; lastDay: string; reason: string }
interface RoleRow        { title: string; department: string; type: string; positions: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? '#22C55E' : pct >= 50 ? '#0D9488' : '#F59E0B'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: '#1F2937' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs" style={{ color: '#9CA3AF' }}>{pct}%</span>
    </div>
  )
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl"
      style={{ backgroundColor: '#0D9488', color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.1)' }}>
      {message}
    </div>
  )
}

function formatStartDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HRPage() {
  const router = useRouter()

  const [showModal,       setShowModal]       = useState(false)
  const [showLeaveModal,  setShowLeaveModal]  = useState(false)
  const [showOffboarding, setShowOffboarding] = useState(false)
  const [showRecruitment, setShowRecruitment] = useState(false)
  const [showPerfReview,  setShowPerfReview]  = useState(false)

  const [starters,      setStarters]      = useState<Starter[]>(INITIAL_STARTERS)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRow[]>(INITIAL_LEAVE)
  const [probations,    setProbations]    = useState<ProbationRow[]>(INITIAL_PROBATIONS)
  const [offboardings,  setOffboardings]  = useState<OffboardingRow[]>([])
  const [roles,         setRoles]         = useState<RoleRow[]>([])
  const [toast,         setToast]         = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function handleNewJoiner(data: NewJoinerData) {
    const fullName = `${data.firstName} ${data.lastName}`
    await fetch('/api/workflows/new-joiner', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    try {
      await supabase.from('hr_onboardings').insert({
        first_name: data.firstName, last_name: data.lastName, job_title: data.jobTitle,
        department: data.department, start_date: data.startDate, manager: data.manager,
        equipment: data.equipment, software: data.software, notes: data.notes, status: 'In Progress',
      })
    } catch { /* non-blocking */ }
    setStarters(prev => [{ name: fullName, role: data.jobTitle, start: formatStartDate(data.startDate), day: 'Pending', progress: 0, status: 'In Progress' }, ...prev])
    setShowModal(false)
    showToast(`Onboarding started for ${fullName}`)
  }

  function formatDateRange(start: string, end: string): string {
    const fmt = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
  }

  async function handleLeaveRequest(data: LeaveRequestData) {
    await fetch('/api/workflows/leave-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    try {
      await supabase.from('hr_leave_requests').insert({
        employee_name: data.employeeName, leave_type: data.leaveType,
        start_date: data.startDate, end_date: data.endDate,
        total_days: data.totalDays, covering_colleague: data.coveringColleague,
        notes: data.notes, status: 'Pending',
      })
    } catch { /* non-blocking */ }
    setLeaveRequests(prev => [{
      name: data.employeeName, type: data.leaveType,
      dates: formatDateRange(data.startDate, data.endDate),
      days: `${data.totalDays} day${data.totalDays !== 1 ? 's' : ''}`,
    }, ...prev])
    setShowLeaveModal(false)
    showToast(`Leave request submitted for ${data.employeeName}`)
  }

  async function handleOffboarding(data: OffboardingData) {
    await fetch('/api/workflows/offboarding', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    try {
      await supabase.from('hr_offboardings').insert({
        employee_name: data.employeeName, job_title: data.jobTitle, department: data.department,
        last_working_day: data.lastWorkingDay, reason: data.reason,
        exit_interview: data.exitInterview, equipment_return: data.equipmentReturn,
        systems_revoke: data.systemsRevoke, handover_to: data.handoverTo,
        notes: data.notes, status: 'In Progress',
      })
    } catch { /* non-blocking */ }
    setOffboardings(prev => [{
      name: data.employeeName, role: data.jobTitle,
      lastDay: formatStartDate(data.lastWorkingDay), reason: data.reason,
    }, ...prev])
    setShowOffboarding(false)
    showToast(`Offboarding started for ${data.employeeName}`)
  }

  async function handleRecruitment(data: RecruitmentData) {
    await fetch('/api/workflows/recruitment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    try {
      await supabase.from('hr_recruitment').insert({
        job_title: data.jobTitle, department: data.department, employment_type: data.employmentType,
        location: data.location, office_location: data.officeLocation,
        salary_min: data.salaryMin, salary_max: data.salaryMax,
        target_start_date: data.targetStartDate || null, hiring_manager: data.hiringManager,
        positions: data.positions, responsibilities: data.responsibilities,
        requirements: data.requirements, desirable: data.desirable,
        job_boards: data.jobBoards, notes: data.notes, status: 'Recruiting',
      })
    } catch { /* non-blocking */ }
    setRoles(prev => [{
      title: data.jobTitle, department: data.department,
      type: data.employmentType, positions: data.positions,
    }, ...prev])
    setShowRecruitment(false)
    showToast(`Recruitment started for ${data.jobTitle}`)
  }

  async function handlePerfReview(data: PerformanceReviewData) {
    await fetch('/api/workflows/performance-review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    try {
      await supabase.from('hr_performance_reviews').insert({
        employee_name: data.employeeName, job_title: data.jobTitle, department: data.department,
        manager: data.manager, review_type: data.reviewType, due_date: data.dueDate,
        review_period: data.reviewPeriod, self_assessment: data.selfAssessment,
        peer_feedback: data.peerFeedback, peer_reviewers: data.peerReviewers,
        goals: data.goals, notes: data.notes, status: 'In Progress',
      })
    } catch { /* non-blocking */ }
    setProbations(prev => [{ name: data.employeeName, date: formatStartDate(data.dueDate), manager: data.manager || '—' }, ...prev])
    setShowPerfReview(false)
    showToast(`Performance review started for ${data.employeeName}`)
  }

  const actions = [
    { label: 'New Starter',        icon: UserPlus,       onClick: () => setShowModal(true)       },
    { label: 'Leave Request',      icon: FileText,        onClick: () => setShowLeaveModal(true)  },
    { label: 'Offboarding',        icon: Users,           onClick: () => setShowOffboarding(true) },
    { label: 'Recruitment',        icon: Briefcase,       onClick: () => setShowRecruitment(true) },
    { label: 'Performance Review', icon: ClipboardList,   onClick: () => setShowPerfReview(true)  },
    { label: 'Company Events',     icon: CalendarHeart,   onClick: () => router.push('/hr/events')},
    { label: 'Send Contract',      icon: FileText  },
    { label: 'Dept Insights',      icon: Star      },
  ]

  return (
    <PageShell>
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      {/* AI Workflow Launchers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/hr/events"
          className="group flex flex-col gap-3 rounded-xl border border-[#1F2937] bg-[#111318] p-5 hover:border-[#374151] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(13,148,136,0.08)' }}>
              <CalendarHeart className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-mono text-teal-400">HR-EVENTS-01</span>
            </div>
          </div>
          <div>
            <div className="font-semibold text-[#F9FAFB] group-hover:text-white transition-colors">Company Events — Team Events Researcher</div>
            <div className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Describe your event, headcount, and budget — get ranked venue recommendations with ratings, prices, and a ready-to-send enquiry email.
            </div>
          </div>
          <div className="text-xs font-medium mt-auto text-teal-400">Launch workflow →</div>
        </Link>
      </div>

      <TwoCol
        main={
          <SectionCard title="New Starter Onboarding Tracker" action="View all">
            <Table
              cols={['Name', 'Role', 'Start Date', 'Day', 'Progress', 'Status']}
              rows={starters.map((s) => [
                s.name, s.role, s.start, s.day,
                <ProgressBar key={s.name} pct={s.progress} />,
                <Badge key={s.name} status={s.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Leave Requests — Pending Approval">
              {leaveRequests.map((r) => (
                <PanelItem key={r.name} title={r.name} sub={`${r.type} · ${r.dates}`} extra={r.days} badge="Pending" />
              ))}
            </SectionCard>
            <SectionCard title="Upcoming Probation Reviews">
              {probations.map((p) => (
                <PanelItem key={p.name} title={p.name} sub={p.date} extra={`Manager: ${p.manager}`} badge="In Review" />
              ))}
            </SectionCard>
          </>
        }
      />

      {/* Active Offboardings — only shown when there are entries */}
      {offboardings.length > 0 && (
        <SectionCard title="Active Offboardings">
          <Table
            cols={['Name', 'Role', 'Last Day', 'Reason', 'Status']}
            rows={offboardings.map((o) => [
              o.name, o.role, o.lastDay, o.reason,
              <Badge key={o.name} status="In Progress" />,
            ])}
          />
        </SectionCard>
      )}

      {/* Active Roles — only shown when there are entries */}
      {roles.length > 0 && (
        <SectionCard title="Active Roles">
          <Table
            cols={['Job Title', 'Department', 'Type', 'Positions', 'Status']}
            rows={roles.map((r) => [
              r.title, r.department, r.type, String(r.positions),
              <Badge key={r.title} status="Recruiting" />,
            ])}
          />
        </SectionCard>
      )}

      {showModal && (
        <NewJoinerModal onClose={() => setShowModal(false)} onSubmit={handleNewJoiner} />
      )}
      {showLeaveModal && (
        <LeaveRequestModal onClose={() => setShowLeaveModal(false)} onSubmit={handleLeaveRequest} />
      )}
      {showOffboarding && (
        <OffboardingModal onClose={() => setShowOffboarding(false)} onSubmit={handleOffboarding} />
      )}
      {showRecruitment && (
        <RecruitmentModal onClose={() => setShowRecruitment(false)} onSubmit={handleRecruitment} />
      )}
      {showPerfReview && (
        <PerformanceReviewModal onClose={() => setShowPerfReview(false)} onSubmit={handlePerfReview} />
      )}
      <Toast message={toast} />
    </PageShell>
  )
}
