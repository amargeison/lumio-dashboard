'use client'

import { useState, useEffect } from 'react'
import {
  GraduationCap, FileText, Calendar, Target, Users, Shield, Plus, Save, X,
  RefreshCw, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown,
  DollarSign, Award, Eye, BookOpen, Heart, BarChart2, Loader2, Download,
  Database, Upload,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,
} from 'recharts'

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & THEME
// ═══════════════════════════════════════════════════════════════════════════════

const TEAL = '#0D9488'
const CARD = '#111318'
const BORDER = '#1F2937'
const DARK = '#0A0B10'
const tipStyle = { backgroundColor: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }

function rag(value: number, green: number, amber: number): string {
  return value >= green ? '#22C55E' : value >= amber ? '#F59E0B' : '#EF4444'
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════════════════════

const ATTENDANCE_YEAR = [
  { name: 'Nursery', pct: 95.4 }, { name: 'Reception', pct: 96.1 }, { name: 'Y1', pct: 97.2 },
  { name: 'Y2', pct: 95.7 }, { name: 'Y3', pct: 96.8 }, { name: 'Y4', pct: 95.1 },
  { name: 'Y5', pct: 96.5 }, { name: 'Y6', pct: 91.8 },
]

const MONTHLY_ATT = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, pct: 93 + Math.random() * 5 }))
const MONTHLY_BEHAVIOUR = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, incidents: Math.floor(Math.random() * 4) }))
const MONTHLY_STAFF_ABS = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, days: Math.floor(Math.random() * 3) }))
const MONTHLY_PROGRESS = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, pct: 68 + Math.random() * 8 }))

const WELLBEING_MONTHLY = [
  { month: 'Sep', score: 6.8 }, { month: 'Oct', score: 7.0 }, { month: 'Nov', score: 6.9 },
  { month: 'Dec', score: 7.1 }, { month: 'Jan', score: 7.0 }, { month: 'Feb', score: 7.2 },
  { month: 'Mar', score: 7.4 },
]

const SUBJECT_PROGRESS = [
  { subject: 'Reading', thisYear: 82, lastYear: 78 },
  { subject: 'Writing', thisYear: 74, lastYear: 71 },
  { subject: 'Maths', thisYear: 80, lastYear: 76 },
  { subject: 'Science', thisYear: 77, lastYear: 74 },
  { subject: 'PSHE', thisYear: 90, lastYear: 88 },
]

const BUDGET_MONTHLY = [
  { month: 'Apr', budget: 237, actual: 225 }, { month: 'May', budget: 475, actual: 462 },
  { month: 'Jun', budget: 712, actual: 698 }, { month: 'Jul', budget: 950, actual: 941 },
  { month: 'Aug', budget: 1045, actual: 1038 }, { month: 'Sep', budget: 1282, actual: 1290 },
  { month: 'Oct', budget: 1520, actual: 1545 }, { month: 'Nov', budget: 1757, actual: 1780 },
  { month: 'Dec', budget: 1900, actual: 1923 }, { month: 'Jan', budget: 2137, actual: null },
  { month: 'Feb', budget: 2375, actual: null }, { month: 'Mar', budget: 2847, actual: null },
]

const COST_CENTRES = [
  { name: 'Teaching', value: 1420, color: '#0D9488' },
  { name: 'Support', value: 612, color: '#3B82F6' },
  { name: 'Premises', value: 287, color: '#8B5CF6' },
  { name: 'Resources', value: 142, color: '#F59E0B' },
  { name: 'Other', value: 382, color: '#6B7280' },
]

const PP_SPEND = [
  { name: 'Academic', value: 34200, color: '#0D9488' },
  { name: 'Pastoral', value: 18400, color: '#3B82F6' },
  { name: 'Enrichment', value: 12600, color: '#8B5CF6' },
  { name: 'Mental Health', value: 9800, color: '#EF4444' },
  { name: 'Attendance', value: 7200, color: '#F59E0B' },
  { name: 'Other', value: 5000, color: '#6B7280' },
]

const SEND_CATEGORIES = [
  { name: 'SEMH', value: 12, color: '#EF4444' },
  { name: 'Comm & Interaction', value: 18, color: '#3B82F6' },
  { name: 'Cognition & Learning', value: 11, color: '#F59E0B' },
  { name: 'Physical/Sensory', value: 6, color: '#8B5CF6' },
]

const EAL_LANGUAGES = [
  { lang: 'Urdu', count: 14 }, { lang: 'Polish', count: 11 }, { lang: 'Punjabi', count: 8 },
  { lang: 'Bengali', count: 6 }, { lang: 'Arabic', count: 5 }, { lang: 'Somali', count: 4 },
  { lang: 'Romanian', count: 3 }, { lang: 'Tamil', count: 2 }, { lang: 'French', count: 2 }, { lang: 'Other', count: 7 },
]

const SIP_PRIORITIES = [
  { name: 'Improve attendance', target: '96.5%', current: '96.2%', pct: 72, rag: 'amber' },
  { name: 'Close PP gap', target: '<3 months', current: '4.2 months', pct: 58, rag: 'amber' },
  { name: 'Strengthen EYFS', target: '75% GLD', current: '72%', pct: 65, rag: 'amber' },
  { name: 'Staff wellbeing', target: '8.0/10', current: '7.4', pct: 85, rag: 'green' },
]

const GOVERNORS = [
  { name: 'Margaret Collins', role: 'Chair', committee: 'Full Board', termEnd: 'Sep 2027', attendance: 100 },
  { name: 'David Okafor', role: 'Vice-Chair', committee: 'Finance', termEnd: 'Mar 2028', attendance: 92 },
  { name: 'Priya Patel', role: 'Parent Governor', committee: 'Curriculum', termEnd: 'Jan 2027', attendance: 83 },
  { name: 'James Wright', role: 'Staff Governor', committee: 'HR & Pay', termEnd: 'Sep 2026', attendance: 100 },
  { name: 'Sarah Khan', role: 'Co-opted', committee: 'Safeguarding', termEnd: 'Jun 2028', attendance: 75 },
  { name: 'Robert Chen', role: 'LA Governor', committee: 'Finance', termEnd: 'Dec 2026', attendance: 67 },
]

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════════════════════

const cs: React.CSSProperties = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }
const ds: React.CSSProperties = { backgroundColor: DARK, border: `1px solid ${BORDER}`, borderRadius: 12 }
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left' as const, fontWeight: 600, color: '#6B7280', fontSize: 12 }
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #1F293740' }

function Stat({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon?: string }) {
  return (
    <div className="rounded-xl p-4" style={ds}>
      <div className="flex items-center gap-2 mb-1">{icon && <span className="text-lg">{icon}</span>}<p className="text-[10px] font-semibold uppercase" style={{ color: '#6B7280' }}>{label}</p></div>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color: '#4B5563' }}>{sub}</p>}
    </div>
  )
}

function SubTabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
          style={{ backgroundColor: active === t.id ? TEAL : '#111318', color: active === t.id ? '#fff' : '#6B7280', border: active === t.id ? `1px solid ${TEAL}` : '1px solid #1F2937' }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function RagPill({ label, color }: { label: string; color: string }) {
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20', color }}>{label}</span>
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

type MainTab = 'executive' | 'pupils' | 'attendance' | 'safeguarding' | 'staff' | 'finance' | 'improvement' | 'governance'

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'executive', label: 'Executive Summary', icon: '📊' },
  { id: 'pupils', label: 'Pupils & Outcomes', icon: '👥' },
  { id: 'attendance', label: 'Attendance', icon: '📋' },
  { id: 'safeguarding', label: 'Safeguarding & SEND', icon: '🛡️' },
  { id: 'staff', label: 'Staff & HR', icon: '👩‍🏫' },
  { id: 'finance', label: 'Finance & Resources', icon: '💰' },
  { id: 'improvement', label: 'School Improvement', icon: '🏆' },
  { id: 'governance', label: 'Governance', icon: '📅' },
]

export default function SLTSuite() {
  const [tab, setTab] = useState<MainTab>('executive')
  const [isSchoolDemo, setIsSchoolDemo] = useState(false)

  useEffect(() => {
    const check = () => {
      const demo = localStorage.getItem('lumio_schools_demo_loaded') === 'true' || localStorage.getItem('lumio_demo_active') === 'true'
      setIsSchoolDemo(demo)
    }
    check()
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (!isSchoolDemo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(13,148,136,0.06) 0%, transparent 70%)' }} />
        <div className="relative flex flex-col items-center text-center max-w-lg w-full">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.2), rgba(13,148,136,0.05))', border: '1px solid rgba(13,148,136,0.3)' }}>
            <Database size={36} style={{ color: '#0D9488' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>No SLT data yet</h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: '#9CA3AF' }}>Connect your MIS or upload school data to unlock your executive dashboard with attendance, safeguarding, SEND and Ofsted intelligence.</p>
          <div className="flex flex-col gap-3 w-full mb-4">
            <button className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#111318' }}>
              <Upload size={15} /> Upload Attendance Data (CSV)
            </button>
            <button className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#111318' }}>
              <Upload size={15} /> Upload Assessment Results (CSV)
            </button>
            <button className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#D1D5DB' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#111318' }}>
              <Upload size={15} /> Upload Pupil Data (CSV)
            </button>
            <button className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition-all" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.color = '#0D9488' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#9CA3AF' }}>
              <Database size={15} /> Connect MIS (Arbor / SIMS / Bromcom)
            </button>
          </div>
          <div className="flex items-center gap-3 w-full mb-4">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
            <span className="text-xs" style={{ color: '#4B5563' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
          </div>
          <button onClick={() => { localStorage.setItem('lumio_schools_demo_loaded', 'true'); window.location.reload() }}
            className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            ✨ Explore with Demo Data
          </button>
          <p className="text-xs mt-3" style={{ color: '#4B5563' }}>Demo data is pre-filled sample data so you can explore all features</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #0C1A2E 0%, #111827 50%, #0C1A2E 100%)', border: `1px solid ${BORDER}` }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-black" style={{ color: '#F9FAFB' }}>{greeting}, Gemma. Here&apos;s your school at a glance.</h1>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <RagPill label="Attendance: 96.2%" color="#22C55E" />
            <RagPill label="Safeguarding: 1 open" color="#EF4444" />
            <RagPill label="SEND: 2 reviews due" color="#F59E0B" />
            <RagPill label="Ofsted: 87%" color="#22C55E" />
            <RagPill label="PP gap: closing" color="#22C55E" />
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#4B5563' }}><RefreshCw size={10} /> Updated 2 min ago</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: tab === t.id ? TEAL : '#111318', color: tab === t.id ? '#fff' : '#6B7280', border: tab === t.id ? `1px solid ${TEAL}` : '1px solid #1F2937' }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'executive' && <ExecutiveSummary />}
      {tab === 'pupils' && <PupilsOutcomes />}
      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'safeguarding' && <SafeguardingSend />}
      {tab === 'staff' && <StaffHR />}
      {tab === 'finance' && <FinanceTab />}
      {tab === 'improvement' && <SchoolImprovementTab />}
      {tab === 'governance' && <GovernanceTab />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

function ExecutiveSummary() {
  return (
    <div className="space-y-4">
      {/* ROW 1 — KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat label="Attendance Today" value="96.2%" sub="National avg: 94.5% · Year 6: 91.8% ⚠" color={rag(96.2, 96, 94)} icon="📊" />
        <Stat label="Open Safeguarding" value="1" sub="Requires DSL review today" color="#EF4444" icon="🛡️" />
        <Stat label="SEND Updates" value="2" sub="2 reviews due this week" color="#F59E0B" icon="📋" />
        <Stat label="Staff Absent" value="2" sub="Cover arranged for both" color="#F59E0B" icon="👥" />
        <Stat label="Ofsted Readiness" value="87%" sub="+3% vs last month" color="#22C55E" icon="⭐" />
        <Stat label="Pupil Premium Impact" value="+4.2mo" sub="Above national benchmark" color="#22C55E" icon="🎯" />
      </div>

      {/* ROW 2 — Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT — School Day Overview */}
        <div style={cs}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>School Day Overview</h3>
          {[
            { label: 'Attendance', status: 'On Track', color: '#22C55E', detail: '96.2% — above 96% target' },
            { label: 'Safeguarding', status: 'Action Required', color: '#EF4444', detail: '1 concern open — DSL sign-off today' },
            { label: 'SEND Updates', status: 'Monitor', color: '#F59E0B', detail: '2 annual reviews due this week' },
            { label: 'Staff Updates', status: 'Monitor', color: '#F59E0B', detail: '2 absent — cover in place' },
            { label: 'Ofsted Readiness', status: 'On Track', color: '#22C55E', detail: '87% — improving monthly' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 py-2" style={{ borderBottom: i < 4 ? `1px solid ${BORDER}40` : 'none' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{item.label}</span>
                  <RagPill label={item.status} color={item.color} />
                </div>
                <p className="text-[10px]" style={{ color: '#6B7280' }}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CENTRE — Priority Actions */}
        <div style={cs}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Today&apos;s Priority Actions</h3>
          {[
            { dot: '#EF4444', action: 'Review open safeguarding concern', owner: 'Gemma Reddick', due: 'TODAY', detail: 'DSL sign-off required' },
            { dot: '#F59E0B', action: 'Year 6 SATs prep meeting', owner: 'Academic lead', due: 'TODAY 10:00', detail: '' },
            { dot: '#F59E0B', action: 'M. Taylor DBS expired — chase renewal', owner: 'HR', due: 'OVERDUE', detail: '' },
            { dot: '#F97316', action: 'Year 4 trip permission — 12/28 outstanding', owner: 'Admin', due: 'Friday', detail: '' },
            { dot: '#22C55E', action: 'Governor visit — Term 3 Review', owner: 'Headteacher', due: 'Next Tuesday', detail: '' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2" style={{ borderBottom: i < 4 ? `1px solid ${BORDER}40` : 'none' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: item.dot }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{item.action}</p>
                <p className="text-[10px]" style={{ color: '#6B7280' }}>{item.owner} — <span style={{ color: item.due === 'OVERDUE' ? '#EF4444' : item.due === 'TODAY' ? '#F59E0B' : '#6B7280', fontWeight: 600 }}>{item.due}</span></p>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — 30-Day Sparklines */}
        <div style={cs}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>30-Day Trends</h3>
          {[
            { label: 'Attendance %', data: MONTHLY_ATT as any[], key: 'pct', color: '#22C55E', trend: '↑', current: '96.2%' },
            { label: 'Behaviour incidents', data: MONTHLY_BEHAVIOUR as any[], key: 'incidents', color: '#F59E0B', trend: '↓', current: '1.8/day' },
            { label: 'Staff absence days', data: MONTHLY_STAFF_ABS as any[], key: 'days', color: '#3B82F6', trend: '↓', current: '0.8/day' },
            { label: '% Pupils on track', data: MONTHLY_PROGRESS as any[], key: 'pct', color: '#8B5CF6', trend: '↑', current: '73%' },
          ].map((s, i) => (
            <div key={i} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold" style={{ color: '#9CA3AF' }}>{s.label}</span>
                <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.current} <span style={{ color: s.trend === '↑' ? '#22C55E' : '#EF4444' }}>{s.trend}</span></span>
              </div>
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={s.data}><Line type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={1.5} dot={false} /></LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3 — Performance Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance by Year Group */}
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Attendance by Year Group</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ATTENDANCE_YEAR} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis domain={[88, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip contentStyle={tipStyle} />
              <ReferenceLine y={96} stroke="#22C55E" strokeDasharray="5 5" />
              <Bar dataKey="pct" name="Attendance %" radius={[4, 4, 0, 0]}>
                {ATTENDANCE_YEAR.map((d, i) => <Cell key={i} fill={rag(d.pct, 96, 94)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pupil Progress by Subject */}
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Pupil Progress by Subject</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={SUBJECT_PROGRESS}>
              <PolarGrid stroke="#1F2937" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} tick={{ fill: '#6B7280', fontSize: 9 }} />
              <Radar name="This Year" dataKey="thisYear" stroke={TEAL} fill={TEAL} fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Last Year" dataKey="lastYear" stroke="#1B3060" fill="#1B3060" fillOpacity={0.15} strokeWidth={1.5} />
              <Tooltip contentStyle={tipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Staff Wellbeing */}
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Staff Wellbeing Index</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={WELLBEING_MONTHLY} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis domain={[5, 10]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip contentStyle={tipStyle} />
              <ReferenceLine y={7} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: 'Benchmark', fill: '#F59E0B', fontSize: 9 }} />
              <Line type="monotone" dataKey="score" stroke={TEAL} strokeWidth={2} dot={{ r: 3, fill: TEAL }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 4 — AI Briefing */}
      <div className="rounded-xl p-5" style={{ backgroundColor: CARD, border: '2px solid rgba(200,150,12,0.3)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🤖</span>
          <h3 className="text-sm font-bold" style={{ color: '#C8960C' }}>SLT AI Briefing — Wednesday 2 April</h3>
        </div>
        <div className="space-y-2">
          {[
            'Attendance today is 96.2% — Year 6 at 91.8%, below the 94% target for 3 consecutive days',
            '1 open safeguarding concern — DSL sign-off required before end of day',
            'Mrs S. Okafor (SENCO) is absent — cover arranged for morning sessions',
            'M. Taylor DBS expired 10 March — renewal now 23 days overdue, action needed',
            'Year 4 trip permission deadline is Friday — 12 of 28 still outstanding',
            'Pupil premium gap is closing — PP pupils are 4.2 months behind non-PP vs 5.1 months last year. Intervention is working.',
            'Staff wellbeing score: 7.4/10 — highest recorded this academic year',
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(200,150,12,0.15)', color: '#C8960C' }}>{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — PUPILS & OUTCOMES
// ═══════════════════════════════════════════════════════════════════════════════

function PupilsOutcomes() {
  const [sub, setSub] = useState('progress')
  const subs = [{ id: 'progress', label: 'Progress' }, { id: 'attainment', label: 'Attainment' }, { id: 'groups', label: 'Groups' }, { id: 'pp', label: 'Pupil Premium' }, { id: 'eal', label: 'EAL' }, { id: 'transitions', label: 'Transitions' }]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total Pupils" value={423} color={TEAL} />
        <Stat label="% Expected Standard" value="76%" color="#22C55E" />
        <Stat label="PP Pupils" value={87} sub="20.6% of cohort" color="#F59E0B" />
        <Stat label="EAL Pupils" value={62} sub="14.7%" color="#3B82F6" />
        <Stat label="SEND" value={47} sub="11.1%" color="#8B5CF6" />
      </div>
      <SubTabs tabs={subs} active={sub} onChange={setSub} />

      {sub === 'progress' && (
        <div className="space-y-4">
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Progress by Subject — School vs National vs Similar Schools</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { subject: 'Reading', school: 82, national: 75, similar: 78 },
                { subject: 'Writing', school: 74, national: 70, similar: 72 },
                { subject: 'Maths', school: 80, national: 74, similar: 77 },
              ]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip contentStyle={tipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="school" name="School" fill={TEAL} radius={[4, 4, 0, 0]} />
                <Bar dataKey="national" name="National" fill="#1B3060" radius={[4, 4, 0, 0]} />
                <Bar dataKey="similar" name="Similar" fill="#6B7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Year', 'Target %', 'Current %', 'Gap', 'Trajectory'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[
                { yr: 'EYFS (GLD)', target: 75, current: 72, traj: 'Improving' },
                { yr: 'Year 1 Phonics', target: 85, current: 82, traj: 'On track' },
                { yr: 'KS1 Combined', target: 68, current: 66, traj: 'Stable' },
                { yr: 'KS2 Combined', target: 72, current: 70, traj: 'Improving' },
              ].map((r, i) => (
                <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.yr}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.target}%</td><td style={{ ...td, color: r.current >= r.target ? '#22C55E' : '#F59E0B', fontWeight: 600 }}>{r.current}%</td><td style={{ ...td, color: r.current >= r.target ? '#22C55E' : '#EF4444', fontWeight: 600 }}>{r.current - r.target > 0 ? '+' : ''}{r.current - r.target}%</td><td style={td}><RagPill label={r.traj} color={r.traj === 'Improving' ? '#22C55E' : r.traj === 'On track' ? '#3B82F6' : '#F59E0B'} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {sub === 'attainment' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Attainment — Historical 3-Year Trend</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={[
              { year: '2024', reading: 78, writing: 71, maths: 76 },
              { year: '2025', year2: true, reading: 80, writing: 73, maths: 78 },
              { year: '2026', reading: 82, writing: 74, maths: 80 },
            ]} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip contentStyle={tipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="reading" name="Reading" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="writing" name="Writing" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="maths" name="Maths" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {sub === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'PP vs Non-PP', a: 'PP', b: 'Non-PP', aVal: 68, bVal: 82, gap: '-4.2 months' },
            { title: 'SEN vs Non-SEN', a: 'SEN', b: 'Non-SEN', aVal: 52, bVal: 80, gap: '-6.1 months' },
            { title: 'EAL vs Non-EAL', a: 'EAL', b: 'Non-EAL', aVal: 71, bVal: 78, gap: '-2.3 months' },
            { title: 'Boys vs Girls', a: 'Boys', b: 'Girls', aVal: 73, bVal: 79, gap: '-2.0 months' },
          ].map((g, i) => (
            <div key={i} style={cs}>
              <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>{g.title}</h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={[{ name: g.a, value: g.aVal }, { name: g.b, value: g.bVal }]} layout="vertical" margin={{ left: 60, right: 10 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#F9FAFB', fontSize: 11 }} />
                  <Tooltip contentStyle={tipStyle} />
                  <Bar dataKey="value" fill={TEAL} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-center mt-1" style={{ color: '#F59E0B' }}>Gap: {g.gap}</p>
            </div>
          ))}
        </div>
      )}

      {sub === 'pp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="PP Students" value={87} color="#F59E0B" />
            <Stat label="% of School" value="20.6%" color="#3B82F6" />
            <Stat label="Funding" value="£87,200" color="#22C55E" />
            <Stat label="PP Gap" value="-4.2mo" sub="Closing (was -5.1)" color="#F59E0B" />
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>PP Spending Breakdown</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={PP_SPEND} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name}: £${(value / 1000).toFixed(1)}k`}>
                  {PP_SPEND.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tipStyle} formatter={(v: any) => `£${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sub === 'eal' && (
        <div className="space-y-4">
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>EAL Languages (Top 10)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={EAL_LANGUAGES} margin={{ top: 5, right: 5, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="lang" tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="count" name="Students" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['EAL Stage', 'Count', '%', 'Avg Progress'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[
                { stage: 'New to English', count: 8, pct: '12.9%', progress: 'Below expected' },
                { stage: 'Early Acquisition', count: 14, pct: '22.6%', progress: 'Expected' },
                { stage: 'Developing', count: 18, pct: '29.0%', progress: 'Expected' },
                { stage: 'Competent', count: 12, pct: '19.4%', progress: 'Above expected' },
                { stage: 'Fluent', count: 10, pct: '16.1%', progress: 'Above expected' },
              ].map((r, i) => (
                <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.stage}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.count}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.pct}</td><td style={td}><RagPill label={r.progress} color={r.progress.includes('Above') ? '#22C55E' : r.progress === 'Expected' ? '#3B82F6' : '#F59E0B'} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {sub === 'transitions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'EYFS → Year 1', stats: [{ l: 'GLD Achieved', v: '72%' }, { l: 'Y1 Phonics Readiness', v: '84%' }] },
            { title: 'KS1 → KS2', stats: [{ l: 'Expected Standard (R/W/M)', v: '66%' }, { l: 'Greater Depth', v: '12%' }] },
            { title: 'Year 6 → Secondary', stats: [{ l: 'First Choice School', v: '89%' }, { l: 'Secondary Schools', v: '6 different' }] },
            { title: 'In-Year Movement', stats: [{ l: 'Admissions This Year', v: '8' }, { l: 'Leavers This Year', v: '5' }] },
          ].map((t, i) => (
            <div key={i} style={cs}>
              <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>{t.title}</h4>
              {t.stats.map((s, si) => (
                <div key={si} className="flex items-center justify-between py-2" style={{ borderBottom: si < t.stats.length - 1 ? `1px solid ${BORDER}40` : 'none' }}>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{s.l}</span>
                  <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════

function AttendanceTab() {
  const [sub, setSub] = useState('today')
  const subs = [{ id: 'today', label: 'Today' }, { id: 'weekly', label: 'Weekly' }, { id: 'pa', label: 'Persistent Absence' }, { id: 'punctuality', label: 'Punctuality' }, { id: 'actions', label: 'Actions' }]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Present Today" value="401" sub="94.6%" color="#22C55E" />
        <Stat label="Absent" value="22" color="#EF4444" />
        <Stat label="Late" value="8" color="#F59E0B" />
        <Stat label="Persistent Absence" value="18" sub="4.3% of cohort" color="#EF4444" />
        <Stat label="Year Average" value="96.2%" color={TEAL} />
      </div>
      <SubTabs tabs={subs} active={sub} onChange={setSub} />

      {sub === 'today' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Year Group', 'Present', 'Absent', 'Late', '%', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{ATTENDANCE_YEAR.map((y, i) => {
                const total = Math.round(423 / 8)
                const absent = Math.round(total * (100 - y.pct) / 100)
                const late = Math.floor(Math.random() * 3)
                return (
                  <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{y.name}</td><td style={{ ...td, color: '#D1D5DB' }}>{total - absent}</td><td style={{ ...td, color: '#EF4444' }}>{absent}</td><td style={{ ...td, color: '#F59E0B' }}>{late}</td><td style={{ ...td, color: rag(y.pct, 96, 94), fontWeight: 700 }}>{y.pct}%</td><td style={td}><RagPill label={y.pct >= 96 ? 'On Track' : y.pct >= 94 ? 'Monitor' : 'Concern'} color={rag(y.pct, 96, 94)} /></td></tr>
                )
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {sub === 'weekly' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Attendance Trend — Full Year</h4>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={Array.from({ length: 28 }, (_, i) => ({ week: `W${i + 1}`, pct: 93 + Math.random() * 5 }))} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 9 }} />
              <YAxis domain={[90, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip contentStyle={tipStyle} />
              <ReferenceLine y={96} stroke="#22C55E" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="pct" stroke={TEAL} fill={TEAL} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {sub === 'pa' && (
        <div className="space-y-4">
          <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>18 pupils below 90% attendance (persistent absence threshold)</p>
          </div>
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Pupil', 'Year', 'Attendance %', 'Days Absent', 'Status', 'Intervention'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[
                { name: 'A. Williams', yr: 'Y6', pct: 84.2, days: 18, intervention: 'EWO referral' },
                { name: 'K. Singh', yr: 'Y4', pct: 86.1, days: 15, intervention: 'Parent meeting scheduled' },
                { name: 'D. Murphy', yr: 'Y3', pct: 87.5, days: 14, intervention: 'Day 10 letter sent' },
                { name: 'S. Ahmed', yr: 'Y6', pct: 88.0, days: 13, intervention: 'Attendance officer monitoring' },
                { name: 'J. Brown', yr: 'Y1', pct: 89.2, days: 12, intervention: 'Parent call completed' },
              ].map((r, i) => (
                <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.name}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.yr}</td><td style={{ ...td, color: '#EF4444', fontWeight: 700 }}>{r.pct}%</td><td style={{ ...td, color: '#D1D5DB' }}>{r.days}</td><td style={td}><RagPill label="PA" color="#EF4444" /></td><td style={{ ...td, color: '#9CA3AF' }}>{r.intervention}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {sub === 'punctuality' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Late Arrivals This Week</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ day: 'Mon', late: 6 }, { day: 'Tue', late: 8 }, { day: 'Wed', late: 4 }, { day: 'Thu', late: 7 }, { day: 'Fri', late: 3 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="late" name="Late arrivals" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-2" style={{ color: '#F59E0B' }}>28 late arrivals this week = approximately 9.3 hours of learning time lost</p>
        </div>
      )}

      {sub === 'actions' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Attendance Actions Dashboard</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Day 3 Letters Sent', value: 4, color: '#22C55E' },
              { label: 'Day 10 Letters Pending', value: 2, color: '#F59E0B' },
              { label: 'PA Warning Letters', value: 1, color: '#EF4444' },
              { label: 'Meetings Scheduled', value: 3, color: '#3B82F6' },
            ].map((a, i) => (
              <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: DARK }}>
                <p className="text-xl font-black" style={{ color: a.color }}>{a.value}</p>
                <p className="text-[10px]" style={{ color: '#6B7280' }}>{a.label}</p>
              </div>
            ))}
          </div>
          <button className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ backgroundColor: TEAL, color: '#fff' }}>Mark all Day 3 letters as sent</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — SAFEGUARDING & SEND
// ═══════════════════════════════════════════════════════════════════════════════

function SafeguardingSend() {
  const [sub, setSub] = useState('safeguarding')
  const subs = [{ id: 'safeguarding', label: 'Safeguarding' }, { id: 'send', label: 'SEND' }, { id: 'semh', label: 'SEMH' }, { id: 'lac', label: 'Looked After' }, { id: 'compliance', label: 'Compliance' }]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Open Concerns" value={1} color="#EF4444" icon="🛡️" />
        <Stat label="Total SEND" value={47} color="#3B82F6" />
        <Stat label="EHCPs" value={9} sub="2 pending" color="#8B5CF6" />
        <Stat label="SEMH" value={12} color="#F59E0B" />
        <Stat label="LAC Pupils" value={3} color={TEAL} />
      </div>
      <SubTabs tabs={subs} active={sub} onChange={setSub} />

      {sub === 'safeguarding' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ ...ds, borderLeft: '3px solid #EF4444' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Open Concern — Requires DSL Sign-Off</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Category: Neglect concern · Logged: 28 Mar 2026 · Logged by: Class teacher</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Action required: DSL review and decision on next steps</p>
              </div>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: '#EF4444', color: '#fff' }}>DSL Sign-Off</button>
            </div>
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Concerns This Year by Month</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[{ m: 'Sep', c: 2 }, { m: 'Oct', c: 1 }, { m: 'Nov', c: 3 }, { m: 'Dec', c: 0 }, { m: 'Jan', c: 2 }, { m: 'Feb', c: 1 }, { m: 'Mar', c: 1 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="m" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="c" name="Concerns" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sub === 'send' && (
        <div className="space-y-4">
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>SEND Category Breakdown</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={SEND_CATEGORIES} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                  {SEND_CATEGORIES.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl overflow-hidden" style={ds}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>EHCP Annual Review Tracker</h4></div>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Pupil', 'Year', 'Last Review', 'Next Due', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[
                { name: 'J. Patel', yr: 'Y3', last: 'Oct 2025', next: 'Oct 2026', status: 'Up to date' },
                { name: 'S. Williams', yr: 'Y5', last: 'Nov 2025', next: 'Nov 2026', status: 'Up to date' },
                { name: 'M. Ali', yr: 'Y2', last: 'Mar 2025', next: 'Mar 2026', status: 'Overdue' },
                { name: 'K. Brown', yr: 'Y6', last: 'Jan 2026', next: 'Jan 2027', status: 'Up to date' },
              ].map((r, i) => (
                <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.name}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.yr}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.last}</td><td style={{ ...td, color: r.status === 'Overdue' ? '#EF4444' : '#D1D5DB', fontWeight: r.status === 'Overdue' ? 700 : 400 }}>{r.next}</td><td style={td}><RagPill label={r.status} color={r.status === 'Up to date' ? '#22C55E' : '#EF4444'} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {sub === 'semh' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="SEMH on Register" value={12} color="#EF4444" />
            <Stat label="CAMHS Referrals" value={3} sub="Avg wait: 18 wks" color="#F59E0B" />
            <Stat label="School Counsellor" value={8} sub="pupils" color="#3B82F6" />
            <Stat label="Nurture Group" value={6} sub="pupils" color="#8B5CF6" />
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Wellbeing Score Distribution (Leuven Scale)</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[{ score: '1 (Very Low)', count: 2 }, { score: '2 (Low)', count: 5 }, { score: '3 (Moderate)', count: 8 }, { score: '4 (High)', count: 14 }, { score: '5 (Very High)', count: 18 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="score" tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="count" name="Pupils" radius={[4, 4, 0, 0]}>
                  {['#EF4444', '#F59E0B', '#F59E0B', '#22C55E', '#22C55E'].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>School average: 3.8/5</p>
          </div>
        </div>
      )}

      {sub === 'lac' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Looked After Children</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Stat label="LAC Pupils" value={3} color={TEAL} />
            <Stat label="PEPs Up to Date" value="3/3" color="#22C55E" />
            <Stat label="PP Plus Funding" value="£5,760" color="#F59E0B" />
          </div>
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Pupil', 'Year', 'PEP Review', 'Progress', 'Virtual Head Contact'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[
                { name: 'Child A', yr: 'Y2', pep: 'Jan 2026', progress: 'On track', contact: 'M. Davies' },
                { name: 'Child B', yr: 'Y4', pep: 'Feb 2026', progress: 'On track', contact: 'M. Davies' },
                { name: 'Child C', yr: 'Y5', pep: 'Mar 2026', progress: 'Below expected', contact: 'S. Patel' },
              ].map((r, i) => (
                <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.name}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.yr}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.pep}</td><td style={td}><RagPill label={r.progress} color={r.progress === 'On track' ? '#22C55E' : '#F59E0B'} /></td><td style={{ ...td, color: '#9CA3AF' }}>{r.contact}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {sub === 'compliance' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Safeguarding Compliance Checklist</h4>
          <div className="space-y-2">
            {[
              { item: 'SCR (Single Central Record) — up to date', ok: true },
              { item: 'Child Protection Policy — current', ok: true },
              { item: 'SEND Policy — current', ok: true },
              { item: 'DBS renewal overdue — M. Taylor', ok: false },
              { item: 'Safer recruitment training — all SLT', ok: true },
              { item: 'Online safety policy — current', ok: true },
              { item: 'Annual safeguarding training refresh — 3 staff overdue', ok: false },
              { item: 'Governor safeguarding training — current', ok: true },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: DARK }}>
                <span style={{ color: c.ok ? '#22C55E' : '#F59E0B', fontSize: 14 }}>{c.ok ? '✅' : '⚠️'}</span>
                <span className="text-xs" style={{ color: '#F9FAFB' }}>{c.item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — STAFF & HR
// ═══════════════════════════════════════════════════════════════════════════════

function StaffHR() {
  const [sub, setSub] = useState('overview')
  const subs = [{ id: 'overview', label: 'Overview' }, { id: 'absence', label: 'Absence' }, { id: 'performance', label: 'Performance' }, { id: 'wellbeing', label: 'Wellbeing' }, { id: 'recruitment', label: 'Recruitment' }, { id: 'cpd', label: 'CPD' }]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total Staff" value={41} color={TEAL} />
        <Stat label="Teaching" value={24} color="#3B82F6" />
        <Stat label="Support" value={17} color="#8B5CF6" />
        <Stat label="Absent Today" value={2} color="#F59E0B" />
        <Stat label="Vacancies" value={0} color="#22C55E" />
      </div>
      <SubTabs tabs={subs} active={sub} onChange={setSub} />

      {sub === 'overview' && (
        <div className="rounded-xl overflow-hidden" style={ds}>
          <table className="w-full text-xs">
            <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Name', 'Role', 'Contract', 'Absence Days YTD', 'DBS Status', 'Review Date'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{[
              { name: 'Gemma Reddick', role: 'Headteacher', contract: 'Permanent', abs: 1, dbs: 'Current', review: 'Jul 2026' },
              { name: 'Mark Johnson', role: 'Deputy Head', contract: 'Permanent', abs: 0, dbs: 'Current', review: 'Jul 2026' },
              { name: 'Sarah Okafor', role: 'SENCO', contract: 'Permanent', abs: 4, dbs: 'Current', review: 'Mar 2026' },
              { name: 'Michael Taylor', role: 'Year 6 Teacher', contract: 'Permanent', abs: 2, dbs: 'EXPIRED', review: 'Jul 2026' },
              { name: 'Lisa Chen', role: 'Year 5 Teacher', contract: 'Permanent', abs: 1, dbs: 'Current', review: 'Jul 2026' },
              { name: 'James Wright', role: 'Year 4 Teacher', contract: 'Permanent', abs: 0, dbs: 'Current', review: 'Jul 2026' },
            ].map((r, i) => (
              <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.name}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.role}</td><td style={{ ...td, color: '#9CA3AF' }}>{r.contract}</td><td style={{ ...td, color: r.abs > 3 ? '#F59E0B' : '#D1D5DB' }}>{r.abs}</td><td style={td}><RagPill label={r.dbs} color={r.dbs === 'Current' ? '#22C55E' : '#EF4444'} /></td><td style={{ ...td, color: '#9CA3AF' }}>{r.review}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {sub === 'absence' && (
        <div className="space-y-4">
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Absence Reasons Breakdown</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={[{ name: 'Illness', value: 42 }, { name: 'Family', value: 12 }, { name: 'Authorised', value: 8 }, { name: 'CPD/Training', value: 14 }]} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                  {['#EF4444', '#F59E0B', '#3B82F6', '#22C55E'].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Supply/cover costs YTD: £18,420</p>
          </div>
        </div>
      )}

      {sub === 'wellbeing' && (
        <div className="space-y-4">
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Staff Wellbeing Survey — Monthly Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={WELLBEING_MONTHLY} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis domain={[5, 10]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip contentStyle={tipStyle} />
                <ReferenceLine y={7} stroke="#F59E0B" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="score" stroke={TEAL} strokeWidth={2} dot={{ r: 4, fill: TEAL }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Wellbeing Profile</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={[{ area: 'Workload', score: 6.2 }, { area: 'Relationships', score: 8.1 }, { area: 'Recognition', score: 7.0 }, { area: 'Autonomy', score: 7.8 }, { area: 'Support', score: 7.5 }]}>
                <PolarGrid stroke="#1F2937" />
                <PolarAngleAxis dataKey="area" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} tick={{ fill: '#6B7280', fontSize: 9 }} domain={[0, 10]} />
                <Radar dataKey="score" stroke={TEAL} fill={TEAL} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sub === 'performance' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Performance Management Cycle</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[{ l: 'Objectives Set', v: '100%', c: '#22C55E' }, { l: 'Mid-Year Review', v: '92%', c: '#22C55E' }, { l: 'End of Year', v: 'Jun 2026', c: '#3B82F6' }, { l: 'Capability Cases', v: '0', c: '#22C55E' }].map((s, i) => (
              <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: DARK }}>
                <p className="text-lg font-black" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[10px]" style={{ color: '#6B7280' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sub === 'recruitment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Recruitment Summary</h4>
            {[{ l: 'Current Vacancies', v: 'None' }, { l: 'Retention Rate', v: '87%' }, { l: 'Time to Hire (avg)', v: '6.2 weeks' }, { l: 'Cost per Hire (avg)', v: '£1,840' }].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 3 ? `1px solid ${BORDER}40` : 'none' }}>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{r.l}</span>
                <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Staff Turnover — 3 Year</h4>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[{ yr: '2024', left: 4 }, { yr: '2025', left: 6 }, { yr: '2026', left: 2 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="yr" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="left" name="Staff departed" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sub === 'cpd' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="CPD Budget" value="£18,500" color={TEAL} />
            <Stat label="Spent" value="£12,200" sub="65.9%" color="#F59E0B" />
            <Stat label="Remaining" value="£6,300" color="#22C55E" />
          </div>
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Training', '% Complete', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[
                { t: 'Safeguarding', pct: 93, s: 'On Track' }, { t: 'First Aid', pct: 85, s: 'On Track' },
                { t: 'Fire Safety', pct: 100, s: 'Complete' }, { t: 'Online Safety', pct: 78, s: 'In Progress' },
                { t: 'Prevent', pct: 90, s: 'On Track' },
              ].map((r, i) => (
                <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.t}</td><td style={td}><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.pct === 100 ? '#22C55E' : TEAL }} /></div><span className="text-[10px]" style={{ color: '#9CA3AF' }}>{r.pct}%</span></div></td><td style={td}><RagPill label={r.s} color={r.s === 'Complete' ? '#22C55E' : r.s === 'On Track' ? '#3B82F6' : '#F59E0B'} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — FINANCE & RESOURCES
// ═══════════════════════════════════════════════════════════════════════════════

function FinanceTab() {
  const [sub, setSub] = useState('budget')
  const subs = [{ id: 'budget', label: 'Budget Overview' }, { id: 'spend', label: 'Spend' }, { id: 'grants', label: 'Grant Tracker' }]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Budget" value="£2.85M" color={TEAL} />
        <Stat label="Spent to Date" value="£1.92M" sub="67.5%" color="#3B82F6" />
        <Stat label="Forecast Year-End" value="£2.89M" sub="Overspend risk" color="#F59E0B" />
        <Stat label="Cash Reserve" value="£124K" color="#22C55E" />
      </div>
      <SubTabs tabs={subs} active={sub} onChange={setSub} />

      {sub === 'budget' && (
        <div className="space-y-4">
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Budget vs Actual Spend (£000s)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={BUDGET_MONTHLY} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip contentStyle={tipStyle} formatter={(v: any) => v ? `£${v}k` : 'Forecast'} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="budget" name="Budget" stroke="#1B3060" fill="#1B3060" fillOpacity={0.15} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke={TEAL} fill={TEAL} fillOpacity={0.2} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Cost Centres</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={COST_CENTRES} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }: any) => `${name}: £${value}k`}>
                  {COST_CENTRES.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tipStyle} formatter={(v: any) => `£${Number(v).toLocaleString()}k`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sub === 'spend' && (
        <div className="rounded-xl overflow-hidden" style={ds}>
          <table className="w-full text-xs">
            <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Month', 'Planned', 'Actual', 'Variance'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{BUDGET_MONTHLY.filter(m => m.actual != null).map((m, i) => {
              const variance = m.actual! - m.budget
              return (
                <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{m.month}</td><td style={{ ...td, color: '#D1D5DB' }}>£{m.budget}k</td><td style={{ ...td, color: '#D1D5DB' }}>£{m.actual}k</td><td style={{ ...td, color: variance > 0 ? '#EF4444' : '#22C55E', fontWeight: 600 }}>{variance > 0 ? '+' : ''}£{variance}k</td></tr>
              )
            })}</tbody>
          </table>
        </div>
      )}

      {sub === 'grants' && (
        <div className="rounded-xl overflow-hidden" style={ds}>
          <table className="w-full text-xs">
            <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Grant', 'Amount', 'Spent', 'Remaining', 'Deadline'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{[
              { grant: 'Pupil Premium', amount: 87200, spent: 62400, deadline: 'Jul 2026' },
              { grant: 'Sports Premium', amount: 18320, spent: 14200, deadline: 'Jul 2026' },
              { grant: 'Recovery Premium', amount: 14560, spent: 10800, deadline: 'Mar 2026' },
              { grant: 'SEND Funding', amount: 62400, spent: 48600, deadline: 'Mar 2027' },
              { grant: 'Other Grants', amount: 8900, spent: 4200, deadline: 'Various' },
            ].map((r, i) => (
              <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.grant}</td><td style={{ ...td, color: '#D1D5DB' }}>£{r.amount.toLocaleString()}</td><td style={{ ...td, color: '#D1D5DB' }}>£{r.spent.toLocaleString()}</td><td style={{ ...td, color: '#22C55E', fontWeight: 600 }}>£{(r.amount - r.spent).toLocaleString()}</td><td style={{ ...td, color: '#9CA3AF' }}>{r.deadline}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 7 — SCHOOL IMPROVEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function SchoolImprovementTab() {
  const [sub, setSub] = useState('sip')
  const [ratings, setRatings] = useState<Record<string, number>>({ 'Overall effectiveness': 2, 'Quality of Education': 2, 'Behaviour & Attitudes': 1, 'Personal Development': 2, 'Leadership & Management': 1, 'EYFS': 2 })
  const subs = [{ id: 'sip', label: 'SIP Overview' }, { id: 'priorities', label: 'Priorities' }, { id: 'sef', label: 'Self Evaluation' }, { id: 'ofsted', label: 'Ofsted Prep' }, { id: 'actions', label: 'Actions Log' }]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="SIP Progress" value="68%" color={TEAL} />
        <Stat label="Priorities On Track" value="2/4" color="#F59E0B" />
        <Stat label="Ofsted Readiness" value="87%" color="#22C55E" />
        <Stat label="Last Inspection" value="Mar 2022" sub="Outstanding" color="#8B5CF6" />
      </div>
      <SubTabs tabs={subs} active={sub} onChange={setSub} />

      {sub === 'sip' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SIP_PRIORITIES.map((p, i) => (
              <div key={i} style={cs}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Priority {i + 1}: {p.name}</h4>
                  <RagPill label={p.rag === 'green' ? 'On Track' : 'Monitor'} color={p.rag === 'green' ? '#22C55E' : '#F59E0B'} />
                </div>
                <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#9CA3AF' }}>
                  <span>Target: {p.target}</span><span>Current: {p.current}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.rag === 'green' ? '#22C55E' : '#F59E0B' }} />
                </div>
                <p className="text-[10px] text-right mt-1" style={{ color: '#6B7280' }}>{p.pct}% complete</p>
              </div>
            ))}
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>SIP Priority Completion</h4>
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={SIP_PRIORITIES.map((p, i) => ({ name: `P${i + 1}`, value: p.pct, fill: p.rag === 'green' ? '#22C55E' : '#F59E0B' }))} startAngle={180} endAngle={0}>
                <RadialBar background dataKey="value" label={{ fill: '#F9FAFB', fontSize: 10, position: 'insideStart' }} />
                <Tooltip contentStyle={tipStyle} formatter={(v: any) => `${v}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sub === 'priorities' && (
        <div className="rounded-xl overflow-hidden" style={ds}>
          <table className="w-full text-xs">
            <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Priority', 'Success Criteria', 'Lead', 'Timescale', 'Progress', 'RAG'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{[
              { p: 'Improve attendance', criteria: 'Achieve 96.5% overall', lead: 'Deputy Head', time: 'Jul 2026', pct: 72, r: 'amber' },
              { p: 'Close PP gap', criteria: 'Gap <3 months', lead: 'PP Lead', time: 'Jul 2026', pct: 58, r: 'amber' },
              { p: 'Strengthen EYFS', criteria: '75% GLD', lead: 'EYFS Lead', time: 'Jul 2026', pct: 65, r: 'amber' },
              { p: 'Staff wellbeing', criteria: 'Score ≥8.0', lead: 'Headteacher', time: 'Jul 2026', pct: 85, r: 'green' },
            ].map((r, i) => (
              <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.p}</td><td style={{ ...td, color: '#D1D5DB' }}>{r.criteria}</td><td style={{ ...td, color: '#9CA3AF' }}>{r.lead}</td><td style={{ ...td, color: '#9CA3AF' }}>{r.time}</td><td style={td}><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.r === 'green' ? '#22C55E' : '#F59E0B' }} /></div><span className="text-[10px]" style={{ color: '#9CA3AF' }}>{r.pct}%</span></div></td><td style={td}><RagPill label={r.r === 'green' ? 'On Track' : 'Monitor'} color={r.r === 'green' ? '#22C55E' : '#F59E0B'} /></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {sub === 'sef' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Self Evaluation — Ofsted Framework</h4>
          {Object.entries(ratings).map(([area, grade]) => (
            <div key={area} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${BORDER}40` }}>
              <span className="text-xs font-semibold w-48" style={{ color: '#F9FAFB' }}>{area}</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(g => (
                  <button key={g} onClick={() => setRatings(p => ({ ...p, [area]: g }))}
                    className="w-7 h-7 rounded-lg text-[10px] font-bold"
                    style={{ backgroundColor: grade === g ? (g <= 2 ? '#22C55E' : g === 3 ? '#F59E0B' : '#EF4444') : '#1F2937', color: grade === g ? '#fff' : '#6B7280', border: grade === g ? 'none' : `1px solid ${BORDER}` }}>
                    {g}
                  </button>
                ))}
              </div>
              <span className="text-[10px] ml-2" style={{ color: '#6B7280' }}>
                {grade === 1 ? 'Outstanding' : grade === 2 ? 'Good' : grade === 3 ? 'Requires Improvement' : 'Inadequate'}
              </span>
            </div>
          ))}
        </div>
      )}

      {sub === 'ofsted' && (
        <div className="space-y-4">
          <div style={cs}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Ofsted Readiness Score: 87%</h4>
              <RagPill label="Inspection likely within 12 months" color="#F59E0B" />
            </div>
            <div className="space-y-2">
              {[
                { risk: 'Year 6 attendance below 94% target', level: 'warn' },
                { risk: 'PP gap still above national average', level: 'warn' },
                { risk: 'Safeguarding — strong processes in place', level: 'ok' },
                { risk: 'Curriculum intent — well-documented', level: 'ok' },
                { risk: 'Staff development — robust CPD programme', level: 'ok' },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: DARK }}>
                  <span style={{ fontSize: 14 }}>{r.level === 'ok' ? '✅' : '⚠️'}</span>
                  <span className="text-xs" style={{ color: '#F9FAFB' }}>{r.risk}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="text-xs font-semibold px-4 py-2.5 rounded-lg" style={{ backgroundColor: '#C8960C', color: '#fff' }}>Generate Ofsted Evidence Pack</button>
        </div>
      )}

      {sub === 'actions' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: TEAL, color: '#fff' }}><Plus size={12} /> Add Action</button></div>
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Date', 'Action', 'Owner', 'Due', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[
                { date: '28 Mar', action: 'Chase M. Taylor DBS renewal', owner: 'HR', due: '31 Mar', status: 'Overdue' },
                { date: '25 Mar', action: 'Year 6 attendance intervention plan', owner: 'Deputy', due: '4 Apr', status: 'In Progress' },
                { date: '20 Mar', action: 'PP strategy review', owner: 'PP Lead', due: '10 Apr', status: 'In Progress' },
                { date: '15 Mar', action: 'EYFS moderation preparation', owner: 'EYFS Lead', due: '30 Apr', status: 'Not Started' },
                { date: '10 Mar', action: 'Governor visit preparation', owner: 'Head', due: '8 Apr', status: 'Complete' },
              ].map((r, i) => (
                <tr key={i}><td style={{ ...td, color: '#D1D5DB' }}>{r.date}</td><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{r.action}</td><td style={{ ...td, color: '#9CA3AF' }}>{r.owner}</td><td style={{ ...td, color: r.status === 'Overdue' ? '#EF4444' : '#D1D5DB' }}>{r.due}</td><td style={td}><RagPill label={r.status} color={r.status === 'Complete' ? '#22C55E' : r.status === 'Overdue' ? '#EF4444' : r.status === 'In Progress' ? '#3B82F6' : '#6B7280'} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 8 — GOVERNANCE
// ═══════════════════════════════════════════════════════════════════════════════

function GovernanceTab() {
  const [sub, setSub] = useState('board')
  const subs = [{ id: 'board', label: 'Board Overview' }, { id: 'meetings', label: 'Meetings' }, { id: 'compliance', label: 'Compliance' }, { id: 'visits', label: 'Visits' }]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Governors" value={GOVERNORS.length} color={TEAL} />
        <Stat label="Avg Attendance" value={`${Math.round(GOVERNORS.reduce((s, g) => s + g.attendance, 0) / GOVERNORS.length)}%`} color="#22C55E" />
        <Stat label="Terms Expiring" value="2" sub="This year" color="#F59E0B" />
        <Stat label="Next Meeting" value="15 Apr" color="#3B82F6" />
      </div>
      <SubTabs tabs={subs} active={sub} onChange={setSub} />

      {sub === 'board' && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Name', 'Role', 'Committee', 'Term End', 'Attendance'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{GOVERNORS.map((g, i) => (
                <tr key={i}><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{g.name}</td><td style={{ ...td, color: '#D1D5DB' }}>{g.role}</td><td style={{ ...td, color: '#9CA3AF' }}>{g.committee}</td><td style={{ ...td, color: new Date(g.termEnd) < new Date('2027-01-01') ? '#F59E0B' : '#D1D5DB' }}>{g.termEnd}</td><td style={{ ...td, color: rag(g.attendance, 80, 60), fontWeight: 600 }}>{g.attendance}%</td></tr>
              ))}</tbody>
            </table>
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Governor Skills Audit</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={[{ skill: 'Finance', score: 8 }, { skill: 'Education', score: 7 }, { skill: 'HR', score: 6 }, { skill: 'Legal', score: 5 }, { skill: 'Safeguarding', score: 9 }, { skill: 'Data', score: 7 }]}>
                <PolarGrid stroke="#1F2937" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} tick={{ fill: '#6B7280', fontSize: 9 }} domain={[0, 10]} />
                <Radar dataKey="score" stroke={TEAL} fill={TEAL} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sub === 'meetings' && (
        <div className="space-y-4">
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Upcoming Meetings</h4>
            {[
              { date: '15 Apr 2026', title: 'Full Governing Body', type: 'Full Board', quorum: '4/6 confirmed' },
              { date: '22 Apr 2026', title: 'Finance Committee', type: 'Committee', quorum: '3/3 confirmed' },
              { date: '6 May 2026', title: 'Curriculum Committee', type: 'Committee', quorum: '2/3 confirmed' },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? `1px solid ${BORDER}40` : 'none' }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{m.title}</p>
                  <p className="text-[10px]" style={{ color: '#6B7280' }}>{m.date} · {m.type}</p>
                </div>
                <RagPill label={m.quorum} color="#22C55E" />
              </div>
            ))}
          </div>
          <div style={cs}>
            <h4 className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Outstanding Actions from Last Meeting</h4>
            {[
              { action: 'Review PP strategy document', owner: 'PP Link Governor', status: 'In Progress' },
              { action: 'Approve updated safeguarding policy', owner: 'Chair', status: 'Complete' },
              { action: 'Arrange Y6 learning walk', owner: 'Curriculum Link', status: 'Scheduled' },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 2 ? `1px solid ${BORDER}40` : 'none' }}>
                <div><p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{a.action}</p><p className="text-[10px]" style={{ color: '#6B7280' }}>{a.owner}</p></div>
                <RagPill label={a.status} color={a.status === 'Complete' ? '#22C55E' : a.status === 'Scheduled' ? '#3B82F6' : '#F59E0B'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {sub === 'compliance' && (
        <div style={cs}>
          <h4 className="text-sm font-bold mb-4" style={{ color: '#F9FAFB' }}>Governance Compliance</h4>
          <div className="space-y-2">
            {[
              { item: 'Governor training — all current', ok: true },
              { item: 'Declarations of interest — all filed', ok: true },
              { item: 'Website compliance — checked Jan 2026', ok: true },
              { item: 'Policies reviewed — 2 due this term', ok: false },
              { item: 'Governor skills audit — completed', ok: true },
              { item: 'Annual governance statement — published', ok: true },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: DARK }}>
                <span style={{ fontSize: 14 }}>{c.ok ? '✅' : '⚠️'}</span>
                <span className="text-xs" style={{ color: '#F9FAFB' }}>{c.item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: '#22C55E' }}>Overall compliance: 92%</p>
        </div>
      )}

      {sub === 'visits' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: TEAL, color: '#fff' }}><Plus size={12} /> Book Governor Visit</button></div>
          <div className="rounded-xl overflow-hidden" style={ds}>
            <table className="w-full text-xs">
              <thead><tr style={{ backgroundColor: '#0D0E14' }}>{['Date', 'Governor', 'Focus Area', 'Report Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{[
                { date: '8 Apr 2026', gov: 'Margaret Collins', focus: 'Term 3 School Improvement Review', report: 'Scheduled' },
                { date: '12 Mar 2026', gov: 'Priya Patel', focus: 'EYFS Learning Walk', report: 'Submitted' },
                { date: '28 Feb 2026', gov: 'David Okafor', focus: 'Finance & Budget Review', report: 'Submitted' },
                { date: '15 Jan 2026', gov: 'Sarah Khan', focus: 'Safeguarding Audit', report: 'Submitted' },
              ].map((v, i) => (
                <tr key={i}><td style={{ ...td, color: '#D1D5DB' }}>{v.date}</td><td style={{ ...td, color: '#F9FAFB', fontWeight: 600 }}>{v.gov}</td><td style={{ ...td, color: '#9CA3AF' }}>{v.focus}</td><td style={td}><RagPill label={v.report} color={v.report === 'Submitted' ? '#22C55E' : '#3B82F6'} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
