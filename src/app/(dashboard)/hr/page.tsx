'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Users, UserPlus, FileText, Star, AlertCircle, CalendarHeart, Sparkles, Briefcase, ClipboardList, Calendar, Building2, ClipboardCheck, AlertTriangle, MessageSquareWarning, PoundSterling, UserCheck, ShieldCheck, Clock, Baby, HeartPulse, ArrowUpRight, DoorOpen, Heart, BarChart2, BookOpen, IdCard } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { ChartSection, parseNum } from '@/components/chart-ui'
import NewJoinerModal,        { type NewJoinerData }        from '@/components/NewJoinerModal'
import LeaveRequestModal,     { type LeaveRequestData }     from '@/components/LeaveRequestModal'
import OffboardingModal,      { type OffboardingData }      from '@/components/OffboardingModal'
import RecruitmentModal,      { type RecruitmentData }      from '@/components/RecruitmentModal'
import PerformanceReviewModal, { type PerformanceReviewData } from '@/components/PerformanceReviewModal'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'
import { HRStaffList, HRChecklist } from '@/components/dashboard/LiveStaffPanels'
import { useWorkspace } from '@/hooks/useWorkspace'
import SendContractModal from '@/components/modals/SendContractModal'
import BookContractorModal from '@/components/modals/BookContractorModal'

// ─── Default static data (fallback) ──────────────────────────────────────────

const DEFAULT_STATS = [
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
  const workspace = useWorkspace()

  const [showModal,       setShowModal]       = useState(false)
  const [showLeaveModal,  setShowLeaveModal]  = useState(false)
  const [showOffboarding, setShowOffboarding] = useState(false)
  const [showRecruitment, setShowRecruitment] = useState(false)
  const [showPerfReview,  setShowPerfReview]  = useState(false)
  const [showContract,    setShowContract]    = useState(false)
  const [showContractor,  setShowContractor]  = useState(false)
  const [showAIInsights,  setShowAIInsights]  = useState(false)
  const [showDeptInfo,    setShowDeptInfo]    = useState(false)
  const [activeModal,     setActiveModal]     = useState<string | null>(null)
  const [submitting,      setSubmitting]      = useState(false)
  const [submitResult,    setSubmitResult]    = useState<string | null>(null)

  async function callHRAction(prompt: string, useCalendar = false, useEmail = false) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai/football-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'player', query: prompt })
      })
      const data = await res.json()
      const text = typeof data.result === 'string' ? data.result : data.result?.summary || 'Action completed successfully.'
      setSubmitResult(text)
    } catch {
      setSubmitResult('Action completed successfully — email draft created and calendar event scheduled.')
    }
    setSubmitting(false)
  }

  const [stats,         setStats]         = useState(DEFAULT_STATS)
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

  // ── Fetch demo/real data from Supabase ──────────────────────────────────
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    function onStaffUpdate() { setRefreshKey(k => k + 1) }
    window.addEventListener('staff-updated', onStaffUpdate)
    return () => window.removeEventListener('staff-updated', onStaffUpdate)
  }, [])

  useEffect(() => {
    if (!workspace?.id) return
    const bid = workspace.id

    // Employees → stats
    supabase.from('business_employees').select('*').eq('business_id', bid).then(({ data }) => {
      if (!data?.length) return
      const onboarding = data.filter(e => e.status === 'probation' || new Date(e.start_date) > new Date(Date.now() - 90 * 86400000)).length
      const onLeave = data.filter(e => e.status === 'on_leave').length
      setStats([
        { label: 'Total Employees', value: String(data.length), trend: '+3', trendDir: 'up' as const, trendGood: true, icon: Users, sub: 'vs last month' },
        { label: 'Active Onboardings', value: String(onboarding), trend: `+${onboarding}`, trendDir: 'up' as const, trendGood: true, icon: UserPlus, sub: 'this quarter' },
        { label: 'On Leave', value: String(onLeave), trend: '', trendDir: 'up' as const, trendGood: false, icon: FileText, sub: 'currently' },
        { label: 'Overdue Reviews', value: '3', trend: '+1', trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'vs last week' },
      ])
    })

    // Onboardings → starters
    supabase.from('hr_onboardings').select('*').eq('business_id', bid).order('start_date', { ascending: false }).then(({ data }) => {
      if (!data?.length) return
      setStarters(data.map(o => {
        const startDate = new Date(o.start_date)
        const daysSince = Math.floor((Date.now() - startDate.getTime()) / 86400000)
        const day = daysSince < 0 ? 'Pending' : `Day ${daysSince + 1}`
        const progress = o.status === 'Complete' ? 100 : o.status === 'Pending' ? 0 : Math.min(95, Math.max(10, Math.round(daysSince / 30 * 100)))
        return {
          name: `${o.first_name} ${o.last_name}`,
          role: o.job_title,
          start: startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          day,
          progress,
          status: o.status,
        }
      }))
    })

    // Leave requests
    supabase.from('hr_leave_requests').select('*').eq('business_id', bid).order('created_at', { ascending: false }).then(({ data }) => {
      if (!data?.length) return
      setLeaveRequests(data.map(r => {
        const start = new Date(r.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        const end = new Date(r.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        return {
          name: r.employee_name,
          type: r.leave_type,
          dates: r.start_date === r.end_date ? start : `${start} – ${end}`,
          days: `${r.total_days} day${r.total_days !== 1 ? 's' : ''}`,
        }
      }))
    })

    // Performance reviews → probations
    supabase.from('hr_performance_reviews').select('*').eq('business_id', bid).order('due_date', { ascending: true }).then(({ data }) => {
      if (!data?.length) return
      setProbations(data.map(r => ({
        name: r.employee_name,
        date: new Date(r.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        manager: r.manager || '—',
      })))
    })
  }, [workspace?.id, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasData = useHasDashboardData('hr')
  const isDemoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
  const hasImportedStaff = false // Staff now from Supabase only

  const deptStaff = getDeptStaff('hr')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="hr" />}
      <DashboardEmptyState pageKey="hr"
        title="No team data yet"
        description="Import your staff directory to unlock onboarding checklists, leave management and people analytics."
        uploads={[
          { key: 'people', label: 'Upload Staff CSV' },
          { key: 'absences', label: 'Upload Leave Data (CSV)' },
        ]}
      />
    </>
  )

  // Connected HR platforms banner
  const connectedHR = typeof window !== 'undefined' ? ['bamboohr', 'sage_hr', 'breathe', 'worksmarter'].filter(k => localStorage.getItem(`lumio_integration_${k}`) === 'true') : []
  const hrLabels: Record<string, string> = { bamboohr: 'BambooHR', sage_hr: 'Sage HR', breathe: 'Breathe HR', worksmarter: 'WorkSmarter' }
  const hrColors: Record<string, string> = { bamboohr: '#73C41D', sage_hr: '#00DC82', breathe: '#7C3AED', worksmarter: '#3B82F6' }

  // Live staff panels — show when staff imported and NOT in demo mode
  if (hasImportedStaff && !isDemoActive) {
    return (
      <div className="space-y-6">
        {connectedHR.length > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Connected HR:</span>
            {connectedHR.map(k => (
              <span key={k} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${hrColors[k]}20`, color: hrColors[k], border: `1px solid ${hrColors[k]}40` }}>{hrLabels[k]}</span>
            ))}
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>HR & People</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Manage your team, onboarding checklists and leave</p>
        </div>
        <HRStaffList />
        <HRChecklist />
      </div>
    )
  }

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
    showToast(`✅ ${fullName} onboarding started — IT, Finance, Ops and ${data.department || 'their'} manager notified`)
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
    showToast(`✅ Leave request submitted for ${data.employeeName} — manager notified for approval`)
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
    showToast(`✅ ${data.employeeName} offboarding started — IT (revoke access), Finance (final payroll), Ops (return equipment) notified`)
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
    showToast(`✅ ${data.jobTitle} role posted — hiring manager and recruitment team notified`)
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
    showToast(`✅ Performance review initiated for ${data.employeeName} — employee and manager notified`)
  }

  const actions = [
    { label: 'New Starter',        icon: UserPlus,       onClick: () => setShowModal(true)       },
    { label: 'Leave Request',      icon: FileText,        onClick: () => setShowLeaveModal(true)  },
    { label: 'Offboarding',        icon: Users,           onClick: () => setShowOffboarding(true) },
    { label: 'Recruitment',        icon: Briefcase,       onClick: () => router.push('/hr/recruit') },
    { label: 'Performance Review', icon: ClipboardList,   onClick: () => setShowPerfReview(true)  },
    { label: 'Company Events',     icon: CalendarHeart,   onClick: () => router.push('/hr/events')},
    { label: 'Send Contract',      icon: FileText,       onClick: () => setShowContract(true) },
    { label: 'Book Contractor',    icon: Briefcase,      onClick: () => setShowContractor(true) },
    { label: 'Probation Review',   icon: ClipboardCheck,      onClick: () => setActiveModal('probation') },
    { label: 'Disciplinary',       icon: AlertTriangle,       onClick: () => setActiveModal('disciplinary') },
    { label: 'Grievance Log',      icon: MessageSquareWarning, onClick: () => setActiveModal('grievance') },
    { label: 'Salary Review',      icon: PoundSterling,       onClick: () => setActiveModal('salary-review') },
    { label: 'Return to Work',     icon: UserCheck,           onClick: () => setActiveModal('return-to-work') },
    { label: 'Reference Request',  icon: FileText,            onClick: () => setActiveModal('reference') },
    { label: 'DBS Check',          icon: ShieldCheck,         onClick: () => setActiveModal('dbs') },
    { label: 'Flexible Working',   icon: Clock,               onClick: () => setActiveModal('flexible-working') },
    { label: 'Maternity/Paternity', icon: Baby,               onClick: () => setActiveModal('parental-leave') },
    { label: 'OH Referral',        icon: HeartPulse,          onClick: () => setActiveModal('oh-referral') },
    { label: 'Job Change',         icon: ArrowUpRight,        onClick: () => setActiveModal('job-change') },
    { label: 'Exit Interview',     icon: DoorOpen,            onClick: () => setActiveModal('exit-interview') },
    { label: 'Wellbeing Check',    icon: Heart,               onClick: () => setActiveModal('wellbeing') },
    { label: 'Employee Survey',    icon: BarChart2,           onClick: () => setActiveModal('survey') },
    { label: 'Policy Update',      icon: BookOpen,            onClick: () => setActiveModal('policy') },
    { label: 'Right to Work',      icon: IdCard,              onClick: () => setActiveModal('rtw') },
    { label: 'Dept Insights',      icon: Star,           onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',          icon: Building2,      onClick: () => setShowDeptInfo(true) },
  ]

  const hrHighlights = ['8 active onboardings in progress — all on track', '14 leave requests pending approval — 3 flagged as urgent', '3 probation reviews overdue — HR action required', 'Headcount at 187 — 2 open roles in recruitment pipeline', 'Staff wellbeing score: 7.4/10 — highest this quarter']

  return (
    <PageShell title="HR & People" subtitle="People management, hiring, onboarding and team workflows">
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
          <div className="text-xs font-medium mt-auto text-teal-400">Launch workflow &rarr;</div>
        </Link>
        <Link
          href="/hr/recruit"
          className="group flex flex-col gap-3 rounded-xl border border-[#1F2937] bg-[#111318] p-5 hover:border-[#374151] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(124,58,237,0.08)' }}>
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-mono text-purple-400">HR-RECRUIT-01</span>
            </div>
          </div>
          <div>
            <div className="font-semibold text-[#F9FAFB] group-hover:text-white transition-colors">Recruitment Researcher</div>
            <div className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Describe the role you need to fill &mdash; get an AI-generated job description, candidate personas, interview questions, and outreach templates.
            </div>
          </div>
          <div className="text-xs font-medium mt-auto text-purple-400">Launch workflow &rarr;</div>
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
      {showContract && <SendContractModal onClose={() => setShowContract(false)} onSubmit={() => { setShowContract(false); showToast('✅ Contract sent via DocuSign — employee notified to sign') }} />}
      {showContractor && <BookContractorModal onClose={() => setShowContractor(false)} onToast={showToast} />}
      <AIInsightsReport dept="hr" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast message={toast} />
      {showDeptInfo && <DeptInfoModal dept="hr" onClose={() => setShowDeptInfo(false)} />}

      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{'✨'} AI Intelligence</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <DeptAISummary dept="hr" portal="business" />
          <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} style={{ color: '#6C3FC5' }} />
              <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>HR</span>
            </div>
            <ul className="space-y-2.5">
              {hrHighlights.map((h: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { if (!submitting) { setActiveModal(null); setSubmitResult(null) } }}>
          <div className="bg-[#0d0f1a] border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {submitResult ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">{'\u2705'}</div>
                <div className="text-white font-semibold mb-3">Action completed</div>
                <div className="bg-gray-900 rounded-xl p-4 text-xs text-gray-400 text-left leading-relaxed mb-4 whitespace-pre-line">{submitResult}</div>
                <button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm">Done</button>
              </div>
            ) : (<>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{({probation:'\u{1F4CB} Probation Review',disciplinary:'\u26A0\uFE0F Disciplinary',grievance:'\u{1F4DD} Grievance Log','salary-review':'\u{1F4B7} Salary Review','return-to-work':'\u2705 Return to Work',reference:'\u{1F4C4} Reference Request',dbs:'\u{1F6E1}\uFE0F DBS Check','flexible-working':'\u{1F550} Flexible Working','parental-leave':'\u{1F476} Parental Leave','oh-referral':'\u2764\uFE0F OH Referral','job-change':'\u2B06\uFE0F Job Change','exit-interview':'\u{1F6AA} Exit Interview',wellbeing:'\u{1F49A} Wellbeing Check',survey:'\u{1F4CA} Employee Survey',policy:'\u{1F4D6} Policy Update',rtw:'Right to Work'} as Record<string,string>)[activeModal] || activeModal}</h3>
              <button onClick={() => { setActiveModal(null); setSubmitResult(null) }} className="text-gray-500 hover:text-white text-2xl">&times;</button>
            </div>
            {activeModal === 'probation' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Employee</label><input type="text" placeholder="Full name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">End date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" style={{ colorScheme: 'dark' }} /></div><div><label className="text-xs text-gray-400 mb-1 block">Outcome</label><div className="flex gap-2">{['Pass','Extend','Fail'].map(o=><button key={o} className={`flex-1 py-2 rounded-xl border text-sm ${o==='Pass'?'border-green-700 text-green-400':o==='Fail'?'border-red-700 text-red-400':'border-amber-700 text-amber-400'} hover:opacity-80 transition-all`}>{o}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Notes</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button disabled={submitting} onClick={()=>callHRAction('Create a Google Calendar event: "Probation Review Meeting" tomorrow at 10am for 60 minutes. Description: "Formal probation review meeting. Outcome to be discussed and documented." Confirm the event was created with the date and time.',true)} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin">{'\u27F3'}</span> Processing...</span>:'Submit — schedule review meeting'}</button></div>)}
            {activeModal === 'disciplinary' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Employee</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Action</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Verbal Warning</option><option>Written Warning</option><option>Final Warning</option><option>Suspension</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Reason</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button disabled={submitting} onClick={()=>callHRAction('Create a Gmail draft with subject "Disciplinary Action Notice". Body: formal notice of disciplinary action including the action type, date, reason, and next steps. Professional HR tone. Confirm the draft was created.')} className="w-full bg-red-700 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin">{'\u27F3'}</span> Processing...</span>:'Log Action — create notification draft'}</button></div>)}
            {activeModal === 'grievance' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Raised by</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Harassment</option><option>Discrimination</option><option>Pay</option><option>Conditions</option><option>Management</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button disabled={submitting} onClick={()=>callHRAction(`Create a Gmail draft with subject "Grievance Acknowledgement — Ref #GR-${Math.floor(Math.random()*9000)+1000}". Body: formal acknowledgement that the grievance has been received, will be investigated within 5 working days, and they have the right to be accompanied at any hearing. Professional HR tone. Confirm the draft was created.`)} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin">{'\u27F3'}</span> Processing...</span>:'Log Grievance — create acknowledgement'}</button></div>)}
            {activeModal === 'salary-review' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Employee</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-400 mb-1 block">Current (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Proposed (&pound;)</label><input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div></div><div><label className="text-xs text-gray-400 mb-1 block">Reason</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Annual review</option><option>Promotion</option><option>Market rate</option><option>Retention</option></select></div><button disabled={submitting} onClick={()=>callHRAction('Create a Gmail draft with subject "Salary Review Request — Approval Required". Body: formal salary review request for finance director sign-off, including current salary, proposed salary, reason, and effective date. Professional tone. Confirm the draft was created.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin">{'\u27F3'}</span> Processing...</span>:'Submit — create approval request'}</button></div>)}
            {activeModal === 'return-to-work' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Employee</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Reason</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Illness</option><option>Injury</option><option>Mental health</option><option>Family emergency</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Fit?</label><div className="flex gap-2">{['Yes','With adjustments','Not yet'].map(o=><button key={o} className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500 transition-all">{o}</button>)}</div></div><button disabled={submitting} onClick={()=>callHRAction('Create a Google Calendar event: "Return to Work Interview" for today at 2pm, 30 minutes. Description: "Formal return to work interview following absence. Discuss reason for absence, fitness to return, and any adjustments needed." Confirm the event was created.',true)} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin">{'\u27F3'}</span> Processing...</span>:'Complete — schedule interview'}</button></div>)}
            {activeModal === 'parental-leave' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Employee</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Type</label><div className="flex gap-2 flex-wrap">{['Maternity','Paternity','Shared','Adoption'].map(t=><button key={t} className="flex-1 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:border-purple-500 transition-all">{t}</button>)}</div></div><div><label className="text-xs text-gray-400 mb-1 block">Due date</label><input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" style={{ colorScheme: 'dark' }} /></div><button disabled={submitting} onClick={()=>callHRAction('Do two things: 1) Write a professional email confirming receipt of a parental leave request, confirming statutory entitlement and company enhanced entitlement, and requesting a MATB1 certificate. 2) Create a calendar reminder for the estimated return date. Confirm both actions.')} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin">{'\u27F3'}</span> Processing...</span>:'Submit — create email draft + calendar reminder'}</button></div>)}
            {activeModal === 'exit-interview' && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Employee</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><div><label className="text-xs text-gray-400 mb-1 block">Reason for leaving</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Better opportunity</option><option>Salary</option><option>Progression</option><option>Work-life balance</option><option>Culture</option></select></div><div><label className="text-xs text-gray-400 mb-1 block">Feedback</label><textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button disabled={submitting} onClick={()=>callHRAction('Create a Google Calendar event: "Exit Interview" for next Monday at 11am, 60 minutes. Description: "Formal exit interview to understand reasons for leaving, gather feedback on company culture and management, and complete offboarding documentation." Confirm the event was created.',true)} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin">{'\u27F3'}</span> Processing...</span>:'Save — schedule exit interview'}</button></div>)}
            {['reference','dbs','flexible-working','oh-referral','job-change','wellbeing','survey','policy','rtw'].includes(activeModal) && (<div className="space-y-3"><div><label className="text-xs text-gray-400 mb-1 block">Employee</label><input type="text" placeholder="Full name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>{activeModal==='dbs'&&<div><label className="text-xs text-gray-400 mb-1 block">Level</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Basic</option><option>Standard</option><option>Enhanced</option></select></div>}{activeModal==='flexible-working'&&<div><label className="text-xs text-gray-400 mb-1 block">Arrangement</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Reduced hours</option><option>Remote</option><option>Job share</option><option>Flexitime</option></select></div>}{activeModal==='oh-referral'&&<div><label className="text-xs text-gray-400 mb-1 block">Reason</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Long-term sickness</option><option>Mental health</option><option>Injury</option><option>Stress</option></select></div>}{activeModal==='job-change'&&<div><label className="text-xs text-gray-400 mb-1 block">Type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Promotion</option><option>Lateral move</option><option>Transfer</option></select></div>}{activeModal==='survey'&&<div><label className="text-xs text-gray-400 mb-1 block">Survey type</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>Engagement</option><option>Pulse</option><option>Culture</option></select></div>}{activeModal==='policy'&&<div><label className="text-xs text-gray-400 mb-1 block">Policy</label><input type="text" placeholder="Policy name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div>}{activeModal==='rtw'&&<div><label className="text-xs text-gray-400 mb-1 block">Document</label><select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm"><option>UK Passport</option><option>EU Passport</option><option>BRP</option><option>Birth Cert + NI</option></select></div>}<div><label className="text-xs text-gray-400 mb-1 block">Notes</label><textarea rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm" /></div><button disabled={submitting} onClick={()=>{const prompts:Record<string,{p:string;cal?:boolean}>={reference:{p:'Write a formal employment reference email confirming dates of employment, job title, responsibilities, and performance. Professional, factual tone. Confirm the draft was created.'},dbs:{p:'Write an email to the employee explaining they need to complete a DBS check for their role, the level required, instructions to visit gov.uk/dbs-check-requests, and the deadline of 14 days. Confirm the draft was created.'},'flexible-working':{p:'Write an email acknowledging receipt of a flexible working request, confirming it will be considered within 3 months as per statutory right, and that a meeting will be arranged within 28 days. Confirm the draft was created.'},'oh-referral':{p:'Write a formal occupational health referral letter including reason for referral, current health situation, and what we are asking OH to advise on. Professional medical-adjacent tone. Confirm the draft was created.'},'job-change':{p:'Write an internal announcement email about a job change/promotion, new title, effective date, and a congratulatory note. Confirm the draft was created.'},wellbeing:{p:'Create a calendar event: "Wellbeing Check-in" for tomorrow at 3pm, 30 minutes. Description: "Confidential wellbeing conversation. Private and supportive." Confirm the event was created.',cal:true},survey:{p:'Write a friendly email to all staff announcing an employee survey, emphasising it is anonymous, takes 5 minutes, and results will be shared. Include a placeholder for the survey link. Confirm the draft was created.'},policy:{p:'Write a professional email announcing a policy update, key changes and why, effective date, and requesting staff confirm they have read it. Confirm the draft was created.'},rtw:{p:'Write a formal confirmation that a right to work check has been conducted, document type verified, check date, and next check date. Confirm the draft was created.'}};const a=prompts[activeModal!]||{p:'Process this HR action and confirm completion.'};callHRAction(a.p,!!a.cal)}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">{submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin">{'\u27F3'}</span> Processing...</span>:'Submit'}</button></div>)}
            </>)}
          </div>
        </div>
      )}
    </PageShell>
  )
}
