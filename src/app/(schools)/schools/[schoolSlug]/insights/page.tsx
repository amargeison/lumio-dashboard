'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { EmptyState } from '@/app/(schools)/components/EmptyState'

// ─── Types ───────────────────────────────────────────────────────────────────

type Role =
  | 'trust'
  | 'headteacher'
  | 'head-of-year'
  | 'teacher'
  | 'sen'
  | 'safeguarding'
  | 'pupil-premium'
  | 'inspections'

// ─── Mock data ───────────────────────────────────────────────────────────────

const SCHOOL_NAME = 'Oakridge Primary School'

const mockData = {
  attendance: {
    today: 94.2,
    thisWeek: 93.8,
    ytd: 94.7,
    national: 94.5,
    persistentAbsent: 12,
    persistentAbsentPct: 8.3,
    byYear: [
      { year: 'Rec', pct: 95.1 },
      { year: 'Y1', pct: 94.8 },
      { year: 'Y2', pct: 93.2 },
      { year: 'Y3', pct: 95.6 },
      { year: 'Y4', pct: 94.1 },
      { year: 'Y5', pct: 93.7 },
      { year: 'Y6', pct: 94.9 },
    ],
  },
  sen: {
    totalOnRegister: 38,
    pctOfSchool: 26.2,
    nationalAvg: 20.0,
    ehcp: 14,
    ehcpInAssessment: 3,
    annualReviewsDue: 5,
    annualReviewsOverdue: 1,
    ispActive: 24,
    ispDraft: 4,
    byNeed: [
      { type: 'SEMH', count: 11, color: '#f97316' },
      { type: 'SpLD', count: 9, color: '#8b5cf6' },
      { type: 'SLCN', count: 7, color: '#06b6d4' },
      { type: 'ASD', count: 5, color: '#10b981' },
      { type: 'MLD', count: 3, color: '#f59e0b' },
      { type: 'Physical', count: 2, color: '#ec4899' },
      { type: 'HI/VI', count: 1, color: '#6366f1' },
    ],
    tierBreakdown: { universal: 62, targeted: 28, specialist: 10 },
    externalAgencies: [
      { agency: 'CAMHS', referrals: 4, awaiting: 2, active: 2 },
      { agency: 'Educational Psychologist', referrals: 6, awaiting: 3, active: 3 },
      { agency: 'SALT', referrals: 5, awaiting: 1, active: 4 },
      { agency: 'Occupational Therapy', referrals: 3, awaiting: 2, active: 1 },
    ],
    budget: { allocated: 48500, spent: 31200, committed: 9800 },
    staffTraining: { completed: 18, outstanding: 4, dueThisterm: 2 },
    whitepaperPhase1: [
      { task: 'Inclusion Strategy drafted', done: true },
      { task: 'Universal offer baseline set', done: true },
      { task: 'ISP templates created', done: false },
      { task: 'Staff SEND CPD scheduled', done: true },
      { task: 'Three-tier framework mapped', done: false },
      { task: 'Parent comms updated', done: true },
    ],
    recentAlerts: [
      { pupil: 'Pupil A', year: 'Y4', issue: 'EHCP annual review overdue', urgency: 'high' },
      { pupil: 'Pupil B', year: 'Y2', issue: 'CAMHS referral awaiting 8 weeks', urgency: 'medium' },
      { pupil: 'Pupil C', year: 'Y6', issue: 'Transition plan not yet started', urgency: 'high' },
      { pupil: 'Pupil D', year: 'Y5', issue: 'ISP review overdue 2 weeks', urgency: 'medium' },
    ],
  },
  academic: {
    phonics: { pass: 78, national: 79, change: -1 },
    ks1Reading: { gte: 73, national: 74 },
    ks2Reading: { gte: 71, national: 73 },
    ks2Maths: { gte: 68, national: 71 },
    ks2Writing: { gte: 69, national: 70 },
    ks2Combined: { gte: 62, national: 65 },
    attainment8: null,
    progress8: null,
    disadvantagedGap: 14,
    senGap: 22,
    bySubject: [
      { subject: 'Reading', above: 38, expected: 33, below: 29 },
      { subject: 'Writing', above: 32, expected: 37, below: 31 },
      { subject: 'Maths', above: 35, expected: 33, below: 32 },
      { subject: 'Science', above: 41, expected: 35, below: 24 },
    ],
  },
  behaviour: {
    incidentsThisTerm: 23,
    incidentsLastTerm: 31,
    fixedExclusions: 2,
    suspensions: 2,
    permanentExclusions: 0,
    byYear: [
      { year: 'Y3', count: 3 },
      { year: 'Y4', count: 7 },
      { year: 'Y5', count: 8 },
      { year: 'Y6', count: 5 },
    ],
  },
  safeguarding: {
    openCases: 4,
    cpRegistered: 2,
    cin: 2,
    lac: 3,
    referralsThisTerm: 6,
    staffTrainingCurrent: 96,
    dslTrainingDate: '2024-11-12',
    saferRecruitmentCompliance: 100,
    lastAuditDate: '2025-01-20',
    auditOutcome: 'Met',
    nextAuditDue: '2025-07-01',
    recentConcerns: [
      { date: '2025-03-10', category: 'Neglect', status: 'Open', priority: 'high' },
      { date: '2025-03-14', category: 'Emotional abuse', status: 'Referred to LA', priority: 'medium' },
      { date: '2025-03-18', category: 'Online safety concern', status: 'Monitored', priority: 'low' },
    ],
  },
  pupilPremium: {
    eligible: 31,
    pctOfSchool: 21.4,
    funding: 12800,
    spentToDate: 7640,
    attainmentGap: 14,
    gapLastYear: 17,
    gapNational: 18,
    interventions: [
      { name: 'Reading Recovery groups', pupils: 12, cost: 2400, impact: 'High' },
      { name: 'Breakfast Club', pupils: 18, cost: 1800, impact: 'Medium' },
      { name: 'Homework Club', pupils: 9, cost: 600, impact: 'Medium' },
      { name: '1:1 Tutoring (English)', pupils: 6, cost: 1800, impact: 'High' },
      { name: 'SEMH Support (Thrive)', pupils: 8, cost: 1040, impact: 'High' },
    ],
  },
  staffing: {
    fte: 18.6,
    vacancies: 1,
    supplyToday: 2,
    absenceRate: 4.2,
    nationalAbsence: 5.1,
    turnoverThisYear: 2,
    cpd: { completedThisTerm: 24, outstanding: 6 },
  },
  trust: {
    schools: [
      { name: 'Oakridge Primary', attendance: 94.2, sen: 26, phonics: 78, budget: 'On track', ofsted: 'Good', flag: false },
      { name: 'Maple Grove Primary', attendance: 92.1, sen: 21, phonics: 81, budget: 'Underspend', ofsted: 'Outstanding', flag: false },
      { name: 'Riverside Academy', attendance: 91.4, sen: 24, phonics: 74, budget: 'Overspend', ofsted: 'Requires Improvement', flag: true },
      { name: 'Hillside Infant School', attendance: 95.3, sen: 18, phonics: 83, budget: 'On track', ofsted: 'Good', flag: false },
    ],
  },
  ofsted: {
    lastInspection: '2023-05-14',
    overallGrade: 'Good',
    nextExpected: '2026-09',
    areas: [
      { area: 'Inclusion', grade: 'Strong Standard', color: 'green', score: 4 },
      { area: 'Curriculum & Teaching', grade: 'Expected Standard', color: 'blue', score: 3 },
      { area: 'Achievement', grade: 'Expected Standard', color: 'blue', score: 3 },
      { area: 'Attendance & Behaviour', grade: 'Strong Standard', color: 'green', score: 4 },
      { area: 'Personal Dev & Wellbeing', grade: 'Strong Standard', color: 'green', score: 4 },
      { area: 'Leadership & Governance', grade: 'Expected Standard', color: 'blue', score: 3 },
      { area: 'Safeguarding', grade: 'Met', color: 'green', score: 5 },
    ],
    evidenceReadiness: [
      { area: 'SEND Inclusion Strategy', ready: true },
      { area: 'Curriculum Intent docs', ready: true },
      { area: 'Pupil Progress data (3yr)', ready: true },
      { area: 'Attendance improvement plan', ready: false },
      { area: 'Disadvantage gap action plan', ready: false },
      { area: 'Safeguarding policy (current year)', ready: true },
      { area: 'Staff wellbeing survey', ready: true },
      { area: 'Governor visit records', ready: true },
    ],
  },
}

// ─── Helper components ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  trend,
  color = 'blue',
  alert = false,
}: {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'teal'
  alert?: boolean
}) {
  const colorMap: Record<string, React.CSSProperties> = {
    blue: { backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#93C5FD' },
    green: { backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#86EFAC' },
    amber: { backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D' },
    red: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' },
    purple: { backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#C4B5FD' },
    teal: { backgroundColor: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', color: '#5EEAD4' },
  }
  return (
    <div
      className={`rounded-xl p-4 ${alert ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
      style={colorMap[color]}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && (
        <p className="mt-0.5 text-xs opacity-60">
          {trend === 'up' && '↑ '}
          {trend === 'down' && '↓ '}
          {sub}
        </p>
      )}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#D1D5DB' }}>{title}</h3>
    </div>
  )
}

function ProgressBar({
  value,
  max = 100,
  color = '#3b82f6',
  label,
  showPct = true,
}: {
  value: number
  max?: number
  color?: string
  label?: string
  showPct?: boolean
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
          <span>{label}</span>
          {showPct && <span>{value}{max !== 100 ? `/${max}` : '%'}</span>}
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function AIInsightBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border p-4 mb-6" style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(139,92,246,0.25)' }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
          AI
        </div>
        <div>
          <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#C4B5FD' }}>AI Summary</p>
          <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{text}</p>
        </div>
      </div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: 'green' | 'amber' | 'red' | 'blue' | 'purple' }) {
  const map: Record<string, React.CSSProperties> = {
    green: { backgroundColor: 'rgba(34,197,94,0.15)', color: '#86EFAC' },
    amber: { backgroundColor: 'rgba(245,158,11,0.15)', color: '#FCD34D' },
    red: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#FCA5A5' },
    blue: { backgroundColor: 'rgba(96,165,250,0.15)', color: '#93C5FD' },
    purple: { backgroundColor: 'rgba(167,139,250,0.15)', color: '#C4B5FD' },
  }
  return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={map[color]}>{label}</span>
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0" style={{ borderColor: '#1F2937' }}>
      <span className={done ? 'text-emerald-500' : 'text-gray-300'}>
        {done ? '✓' : '○'}
      </span>
      <span style={{ color: done ? '#D1D5DB' : '#6B7280' }}>{label}</span>
      {!done && <Badge label="Pending" color="amber" />}
    </div>
  )
}

function AlertRow({
  level,
  text,
  sub,
}: {
  level: 'high' | 'medium' | 'low'
  text: string
  sub?: string
}) {
  const map = {
    high: { bgStyle: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }, dotStyle: { backgroundColor: '#EF4444' }, textColor: '#FCA5A5' },
    medium: { bgStyle: { backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }, dotStyle: { backgroundColor: '#FBBF24' }, textColor: '#FCD34D' },
    low: { bgStyle: { backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)' }, dotStyle: { backgroundColor: '#60A5FA' }, textColor: '#93C5FD' },
  }
  const s = map[level]
  return (
    <div className="flex items-start gap-3 rounded-lg p-3" style={s.bgStyle}>
      <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={s.dotStyle} />
      <div>
        <p className="text-sm font-medium" style={{ color: s.textColor }}>{text}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Role Views ───────────────────────────────────────────────────────────────

function TrustView() {
  return (
    <div className="space-y-6">
      <AIInsightBox
        text={`Across the trust's 4 schools, average attendance is 93.3% — marginally below the national average of 94.5%. Riverside Academy is flagged for performance concerns: attendance at 91.4%, a 'Requires Improvement' Ofsted rating, and a budget overspend. Oakridge and Hillside are performing well. Trust-wide SEND cohort averages 22.3%, above the national 20% — aligned with the 2026 SEND White Paper which notes rising demand. Recommend a trust-level SEND strategy review ahead of Phase 1 compliance deadlines.`}
      />

      <div>
        <SectionTitle icon="🏫" title="School-by-School Overview" />
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #1F2937' }}>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide" style={{ backgroundColor: '#0D0E14', color: '#9CA3AF' }}>
              <tr>
                <th className="px-4 py-3 text-left">School</th>
                <th className="px-4 py-3 text-center">Attendance</th>
                <th className="px-4 py-3 text-center">SEN %</th>
                <th className="px-4 py-3 text-center">Phonics Pass</th>
                <th className="px-4 py-3 text-center">Budget</th>
                <th className="px-4 py-3 text-center">Ofsted</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {mockData.trust.schools.map((s) => (
                <tr key={s.name} style={s.flag ? { backgroundColor: 'rgba(239,68,68,0.1)' } : undefined}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>
                    {s.flag && <span className="mr-1">🚩</span>}
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold" style={{ color: s.attendance < 93 ? '#FCA5A5' : '#D1D5DB' }}>
                    {s.attendance}%
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: '#9CA3AF' }}>{s.sen}%</td>
                  <td className="px-4 py-3 text-center" style={{ color: '#9CA3AF' }}>{s.phonics}%</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      label={s.budget}
                      color={s.budget === 'Overspend' ? 'red' : s.budget === 'Underspend' ? 'amber' : 'green'}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      label={s.ofsted}
                      color={
                        s.ofsted === 'Outstanding'
                          ? 'green'
                          : s.ofsted === 'Good'
                          ? 'blue'
                          : 'red'
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.flag ? <Badge label="Action needed" color="red" /> : <Badge label="On track" color="green" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Trust Avg Attendance" value="93.3%" sub="National: 94.5%" color="amber" trend="down" />
        <StatCard label="Schools with Concerns" value="1" sub="Riverside Academy" color="red" alert />
        <StatCard label="Total Pupils on SEND" value="22.3%" sub="Avg across trust" color="purple" />
        <StatCard label="Trust Budget Status" value="2/4" sub="Schools on track" color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="⚠️" title="Trust Alerts" />
          <div className="space-y-2">
            <AlertRow level="high" text="Riverside Academy — Budget overspend requires review" sub="Finance team notified 12 Mar 2025" />
            <AlertRow level="high" text="Riverside Academy — Ofsted 'Requires Improvement' in 2023" sub="Next inspection expected Autumn 2025" />
            <AlertRow level="medium" text="Trust-wide average attendance below national" sub="3 of 4 schools under 94.5%" />
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="📋" title="SEND White Paper — Trust Readiness" />
          <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Phase 1 compliance (2025/26)</p>
          <div className="space-y-1">
            <CheckItem label="Trust SEND strategy document updated" done={true} />
            <CheckItem label="All schools have named SENCO on SLT" done={true} />
            <CheckItem label="ISP templates shared across trust" done={false} />
            <CheckItem label="Trust-wide SEND CPD plan agreed" done={false} />
            <CheckItem label="Inclusive Mainstream Fund applied for" done={true} />
          </div>
        </div>
      </div>
    </div>
  )
}

function HeadteacherView() {
  return (
    <div className="space-y-6">
      <AIInsightBox
        text={`School attendance today is 94.2%, in line with the national average. 12 pupils (8.3%) are classified as persistent absentees — this is an area to watch. KS2 combined results are 3 percentage points below national, driven by a 14-point disadvantage gap. The SEND cohort (26.2% of roll) is above national average and warrants attention given the incoming 2026 SEND White Paper ISP requirements. Behaviour incidents have dropped 26% this term — a positive trend. 2 staff are on supply cover today. Budget is currently on track.`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Attendance Today" value="94.2%" sub="National: 94.5%" color="blue" />
        <StatCard label="Persistent Absentees" value="12 pupils" sub="8.3% of roll" color="amber" alert />
        <StatCard label="Behaviour Incidents" value="23" sub="↓ 26% vs last term" color="green" trend="down" />
        <StatCard label="Open Safeguarding Cases" value="4" sub="2 CP + 2 CiN" color="red" alert />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="📈" title="Attendance by Year Group" />
          <div className="space-y-2 mt-2">
            {mockData.attendance.byYear.map((y) => (
              <ProgressBar
                key={y.year}
                label={`Year ${y.year}`}
                value={y.pct}
                color={y.pct < 93 ? '#ef4444' : y.pct < 94.5 ? '#f59e0b' : '#10b981'}
              />
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: '#6B7280' }}>National average: 94.5%</p>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="🎓" title="Academic Performance vs National" />
          <div className="space-y-3">
            {[
              { label: 'Phonics Pass Rate', school: 78, national: 79 },
              { label: 'KS1 Reading (GDS+)', school: 73, national: 74 },
              { label: 'KS2 Reading', school: 71, national: 73 },
              { label: 'KS2 Maths', school: 68, national: 71 },
              { label: 'KS2 Combined', school: 62, national: 65 },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                  <span>{m.label}</span>
                  <span style={{ color: m.school < m.national ? '#FCA5A5' : '#86EFAC' }}>
                    {m.school}% <span style={{ color: '#6B7280' }}>(nat: {m.national}%)</span>
                  </span>
                </div>
                <div className="relative h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.school}%`, backgroundColor: '#60A5FA' }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5"
                    style={{ backgroundColor: '#6B7280', left: `${m.national}%` }}
                    title={`National: ${m.national}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Disadvantage Gap" value="14 pts" sub="National gap: 18pts" color="amber" />
        <StatCard label="SEND % on Roll" value="26.2%" sub="National: 20%" color="purple" />
        <StatCard label="Supply Staff Today" value="2" sub={`FTE: ${mockData.staffing.fte}`} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="🚨" title="Headteacher Alerts" />
          <div className="space-y-2">
            <AlertRow level="high" text="1 EHCP annual review overdue" sub="Action required within 5 working days" />
            <AlertRow level="high" text="4 open safeguarding cases" sub="Review scheduled Mon 25 Mar" />
            <AlertRow level="medium" text="3 EHCP needs assessments in progress" sub="20-week statutory deadline tracked" />
            <AlertRow level="medium" text="KS2 combined 3pts below national" sub="Improvement plan being drafted" />
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="📅" title="Upcoming This Term" />
          <div className="space-y-2 text-sm">
            {[
              { date: '26 Mar', event: 'Pupil Progress Meetings — Y3/Y4', type: 'academic' },
              { date: '28 Mar', event: 'EHCP Annual Review — Pupil A (Y4)', type: 'sen' },
              { date: '2 Apr', event: "Parents' Evening", type: 'engagement' },
              { date: '7 Apr', event: 'SLT Performance Appraisals', type: 'staff' },
              { date: '11 Apr', event: 'End of Term — Budget reconciliation due', type: 'finance' },
            ].map((e) => (
              <div key={e.event} className="flex items-center gap-3 py-1.5 border-b last:border-0" style={{ borderColor: '#1F2937' }}>
                <span className="text-xs w-12 flex-shrink-0" style={{ color: '#6B7280' }}>{e.date}</span>
                <span style={{ color: '#D1D5DB' }}>{e.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HeadOfYearView() {
  const [selectedYear, setSelectedYear] = useState('Y5')
  const yearData = mockData.attendance.byYear.find((y) => y.year === selectedYear) || mockData.attendance.byYear[4]

  return (
    <div className="space-y-6">
      <AIInsightBox
        text={`Year ${selectedYear} attendance is ${yearData.pct}% — ${yearData.pct < 94.5 ? 'below' : 'above'} the national average of 94.5%. Behaviour incidents in this year group account for 8 of 23 this term. 3 pupils in Y${selectedYear} are on the SEND register with active ISPs. 2 pupils are flagged as requiring pastoral intervention. Early communication with families of persistent absentees is recommended before the Easter break.`}
      />

      <div className="flex flex-wrap gap-2 mb-2">
        <p className="text-sm mr-2 self-center" style={{ color: '#9CA3AF' }}>Viewing year group:</p>
        {['Y3', 'Y4', 'Y5', 'Y6'].map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className="px-3 py-1 rounded-lg text-sm font-medium border transition"
            style={selectedYear === y
              ? { backgroundColor: '#0D9488', color: '#F9FAFB', borderColor: '#0D9488' }
              : { backgroundColor: '#111318', color: '#9CA3AF', borderColor: '#1F2937' }}
          >
            Year {y}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Attendance This Week" value={`${yearData.pct}%`} sub="National: 94.5%" color={yearData.pct < 94.5 ? 'amber' : 'green'} />
        <StatCard label="Persistent Absentees" value="3 pupils" sub="in this year group" color="amber" />
        <StatCard label="Behaviour Incidents" value="8" sub="This term" color="blue" />
        <StatCard label="SEND Pupils" value="7" sub="3 EHCP, 4 SEN support" color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="👦" title="Pupils Requiring Attention" />
          <div className="space-y-2">
            <AlertRow level="high" text="Pupil C — Attendance dropped to 72% this month" sub="Parent meeting requested — not yet responded" />
            <AlertRow level="high" text="Pupil F — Safeguarding concern open" sub="Referred to DSL 14 Mar. Monitor closely." />
            <AlertRow level="medium" text="Pupil G — 4 behaviour incidents this term" sub="Pastoral support plan in place" />
            <AlertRow level="low" text="Pupil H — Parent reports anxiety around SATs" sub="Referred to school counsellor" />
          </div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="📚" title="Academic Progress — Year Group" />
          <div className="space-y-3">
            {mockData.academic.bySubject.map((s) => (
              <div key={s.subject}>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{s.subject}</p>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  <div className="bg-emerald-400 rounded-l" style={{ width: `${s.above}%` }} title={`Above: ${s.above}%`} />
                  <div className="bg-blue-300" style={{ width: `${s.expected}%` }} title={`Expected: ${s.expected}%`} />
                  <div className="bg-red-300 rounded-r" style={{ width: `${s.below}%` }} title={`Below: ${s.below}%`} />
                </div>
                <div className="flex gap-4 text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  <span>Above: {s.above}%</span>
                  <span>Expected: {s.expected}%</span>
                  <span>Below: {s.below}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <SectionTitle icon="🤝" title="Interventions Active in Year Group" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase border-b" style={{ color: '#6B7280', borderColor: '#1F2937' }}>
              <tr>
                <th className="py-2 text-left">Intervention</th>
                <th className="py-2 text-center">Pupils</th>
                <th className="py-2 text-center">Provider</th>
                <th className="py-2 text-center">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {[
                { name: 'Reading Recovery', pupils: 4, provider: 'Mrs. Ahmed', impact: 'High' },
                { name: 'SEMH Thrive Programme', pupils: 3, provider: 'School counsellor', impact: 'High' },
                { name: 'Maths Catch-up', pupils: 5, provider: 'TA - Mr. Clarke', impact: 'Medium' },
                { name: 'Speech & Language', pupils: 2, provider: 'External SALT', impact: 'Medium' },
              ].map((i) => (
                <tr key={i.name}>
                  <td className="py-2 font-medium" style={{ color: '#D1D5DB' }}>{i.name}</td>
                  <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{i.pupils}</td>
                  <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{i.provider}</td>
                  <td className="py-2 text-center">
                    <Badge label={i.impact} color={i.impact === 'High' ? 'green' : 'blue'} />
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

function TeacherView() {
  return (
    <div className="space-y-6">
      <AIInsightBox
        text={`Your class has 94.1% attendance today — 1 pupil absent. Of your 28 pupils, 6 are on the SEND register (2 with EHCPs). Maths progress data shows 31% of your class are working below expected — consider targeted small-group support. 2 assessments are due this week. Reading recovery group sessions are showing strong impact for the 3 pupils involved. A reminder: SEND reviews for Pupil A and Pupil B are due before end of term.`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Class Attendance Today" value="94.1%" sub="1 pupil absent" color="blue" />
        <StatCard label="SEND Pupils in Class" value="6" sub="2 EHCP, 4 SEN Support" color="purple" />
        <StatCard label="Assessments Due" value="2" sub="This week" color="amber" />
        <StatCard label="Marking Outstanding" value="3" sub="Books to review" color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="📊" title="Class Progress Breakdown" />
          <div className="space-y-3">
            {mockData.academic.bySubject.map((s) => (
              <div key={s.subject}>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{s.subject}</p>
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  <div className="bg-emerald-400 rounded-l" style={{ width: `${s.above}%` }} />
                  <div className="bg-blue-300" style={{ width: `${s.expected}%` }} />
                  <div className="bg-red-300 rounded-r" style={{ width: `${s.below}%` }} />
                </div>
                <div className="flex gap-4 text-xs mt-0.5">
                  <span style={{ color: '#86EFAC' }}>Above: {s.above}%</span>
                  <span style={{ color: '#93C5FD' }}>Expected: {s.expected}%</span>
                  <span style={{ color: '#FCA5A5' }}>Below: {s.below}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="🧩" title="SEND Pupils — My Class" />
          <div className="space-y-2">
            {[
              { pupil: 'Pupil A', need: 'ASD', plan: 'EHCP', review: '28 Mar', status: 'Due soon' },
              { pupil: 'Pupil B', need: 'SEMH', plan: 'EHCP', review: '14 Apr', status: 'On track' },
              { pupil: 'Pupil C', need: 'SpLD (Dyslexia)', plan: 'ISP', review: '2 May', status: 'On track' },
              { pupil: 'Pupil D', need: 'SLCN', plan: 'ISP', review: '15 Apr', status: 'On track' },
              { pupil: 'Pupil E', need: 'MLD', plan: 'SEN Support', review: '—', status: 'Monitoring' },
              { pupil: 'Pupil F', need: 'SEMH', plan: 'SEN Support', review: '—', status: 'Monitoring' },
            ].map((p) => (
              <div key={p.pupil} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: '#1F2937' }}>
                <div>
                  <span className="font-medium" style={{ color: '#D1D5DB' }}>{p.pupil}</span>
                  <span className="ml-2" style={{ color: '#6B7280' }}>· {p.need}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={p.plan} color="purple" />
                  <Badge
                    label={p.status}
                    color={p.status === 'Due soon' ? 'amber' : p.status === 'On track' ? 'green' : 'blue'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <SectionTitle icon="✅" title="This Week's Task List" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {[
            { task: 'Return Year 5 Maths assessments', done: true },
            { task: 'Review ISP for Pupil C with SENCO', done: false },
            { task: 'Update reading records — Group 2', done: true },
            { task: 'Submit pupil progress data to HoY', done: false },
            { task: 'Prepare differentiated worksheets — Y5 SPaG', done: false },
            { task: 'Attend SEND update briefing — Thursday 3:30pm', done: false },
          ].map((t) => (
            <CheckItem key={t.task} label={t.task} done={t.done} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SENView() {
  const [senTab, setSenTab] = useState<'overview' | 'ehcp' | 'isp' | 'interventions' | 'agencies' | 'whitepaper' | 'staffing'>('overview')

  const senTabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'ehcp', label: '📄 EHCP Pipeline' },
    { id: 'isp', label: '🗂 ISP Tracker' },
    { id: 'interventions', label: '🎯 Interventions' },
    { id: 'agencies', label: '🔗 Agencies' },
    { id: 'whitepaper', label: '📋 White Paper' },
    { id: 'staffing', label: '👥 TA & Staffing' },
  ]

  return (
    <div className="space-y-6">
      <AIInsightBox
        text={`SEND register: 38 pupils (26.2% of roll) — above the national average of 20%. EHCPs have risen nationally by 67% since 2019; this school reflects that trend. URGENT: 1 annual review is overdue and Pupil C (Y6) has no transition plan — secondary placement must be confirmed before July. 3 EHCP assessments are approaching their 20-week statutory deadline. The 2026 SEND White Paper introduces Individual Support Plans as a statutory requirement from September 2029 — ISP templates are not yet created. Experts at Hand funding (£1.8bn nationally) and the Inclusive Mainstream Fund (£1.6bn) are now available to apply for. SEN budget on track. Recommend: create ISP templates this half-term, book Y6 transition review, and submit Inclusive Mainstream Fund application.`}
      />

      {/* White Paper callout banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-900 to-blue-800 text-white p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-1">📄 2026 SEND White Paper — "Every Child Achieving and Thriving"</p>
            <p className="text-sm opacity-90">Published 23 Feb 2026 · Consultation closes 18 May 2026 · Legislation expected Sept 2029</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white/20 rounded-lg px-3 py-1.5">
              <span className="font-bold block">Phase 1</span>Now – 2026/27: Align to best practice
            </span>
            <span className="bg-white/20 rounded-lg px-3 py-1.5">
              <span className="font-bold block">Phase 2</span>2026/27–2028: Inclusion Standards
            </span>
            <span className="bg-white/20 rounded-lg px-3 py-1.5">
              <span className="font-bold block">Phase 3</span>2029+: ISPs statutory + Digital EHCPs
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: '3-Tier System', desc: 'Universal → Targeted → Specialist' },
            { label: 'ISPs for all SEND', desc: 'Statutory from Sept 2029' },
            { label: 'Inclusion Strategy', desc: 'Annual duty — Ofsted will inspect' },
            { label: '£1.6bn IMF + £1.8bn EaH', desc: 'New funding available now' },
          ].map((i) => (
            <div key={i.label} className="bg-white/10 rounded-lg p-2">
              <p className="font-semibold">{i.label}</p>
              <p className="opacity-70 mt-0.5">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="On SEND Register" value="38" sub="26.2% of roll (Nat: 20%)" color="purple" />
        <StatCard label="Active EHCPs" value="14" sub="3 in assessment pipeline" color="blue" />
        <StatCard label="Annual Reviews Overdue" value="1" sub="5 due this term" color="red" alert />
        <StatCard label="ISPs Active / Draft" value="24 / 4" sub="Templates not yet created" color="amber" />
      </div>

      {/* Sub-tab navigation */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex flex-wrap border-b px-4 pt-3 gap-1" style={{ borderColor: '#1F2937', backgroundColor: '#0D0E14' }}>
          {senTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSenTab(t.id as any)}
              className="px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 transition"
              style={senTab === t.id
                ? { borderColor: '#0D9488', color: '#2DD4BF', backgroundColor: '#111318' }
                : { borderColor: 'transparent', color: '#9CA3AF' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── OVERVIEW TAB ── */}
          {senTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* By primary need */}
                <div>
                  <SectionTitle icon="📊" title="SEND Register by Primary Need" />
                  <div className="space-y-2">
                    {mockData.sen.byNeed.map((n) => (
                      <div key={n.type} className="flex items-center gap-3">
                        <span className="text-xs w-24 flex-shrink-0" style={{ color: '#9CA3AF' }}>{n.type}</span>
                        <div className="flex-1 h-2.5 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                          <div className="h-full rounded-full" style={{ width: `${(n.count / 38) * 100}%`, backgroundColor: n.color }} />
                        </div>
                        <span className="text-xs font-bold w-5 text-right" style={{ color: '#9CA3AF' }}>{n.count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Total: 38 pupils · SEMH and SpLD are the dominant needs</p>
                </div>

                {/* Three-tier model */}
                <div>
                  <SectionTitle icon="🏗️" title="Three-Tier Support Model" />
                  <p className="text-xs mb-3" style={{ color: '#6B7280' }}>As required by the 2026 White Paper</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Universal', sub: 'Quality-first teaching for all', value: 62, color: '#10b981', desc: 'Whole-class differentiation, reasonable adjustments, trained staff' },
                      { label: 'Targeted / Targeted+', sub: 'SALT groups, EP support, sensory needs', value: 28, color: '#6366f1', desc: 'ISP required · Experts at Hand eligible' },
                      { label: 'Specialist', sub: 'EHCP + Specialist Provision Package', value: 10, color: '#ef4444', desc: 'Most complex needs · Digital EHCP incoming 2030' },
                    ].map((t) => (
                      <div key={t.label} className="rounded-lg p-3" style={{ border: '1px solid #1F2937' }}>
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <span className="text-sm font-semibold" style={{ color: '#D1D5DB' }}>{t.label}</span>
                            <span className="text-xs ml-2" style={{ color: '#6B7280' }}>{t.sub}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: t.color }}>{t.value}%</span>
                        </div>
                        <div className="h-2 rounded-full mb-1" style={{ backgroundColor: '#1F2937' }}>
                          <div className="h-full rounded-full" style={{ width: `${t.value}%`, backgroundColor: t.color }} />
                        </div>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Urgent alerts */}
              <div>
                <SectionTitle icon="🚨" title="Urgent Actions" />
                <div className="space-y-2">
                  {mockData.sen.recentAlerts.map((a) => (
                    <AlertRow key={a.pupil} level={a.urgency as any} text={`${a.pupil} (${a.year}) — ${a.issue}`} />
                  ))}
                  <AlertRow level="high" text="Y6 Transition: 3 pupils require secondary EHCP transfer letters" sub="Must be sent to receiving schools by 31 March" />
                  <AlertRow level="medium" text="Inclusive Mainstream Fund application not yet submitted" sub="New £1.6bn fund — deadline approaching" />
                  <AlertRow level="medium" text="ISP templates not yet created" sub="Required for Phase 1 White Paper compliance — statutory Sept 2029" />
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SectionTitle icon="💰" title="SEN Budget" />
                  <div className="rounded-lg p-4 space-y-2" style={{ border: '1px solid #1F2937' }}>
                    {[
                      { label: 'Allocated', value: mockData.sen.budget.allocated, color: '#D1D5DB' },
                      { label: 'Spent', value: mockData.sen.budget.spent, color: '#93C5FD' },
                      { label: 'Committed', value: mockData.sen.budget.committed, color: '#FCD34D' },
                      { label: 'Available', value: mockData.sen.budget.allocated - mockData.sen.budget.spent - mockData.sen.budget.committed, color: '#86EFAC' },
                    ].map((b) => (
                      <div key={b.label} className="flex justify-between text-sm">
                        <span style={{ color: '#9CA3AF' }}>{b.label}</span>
                        <span className="font-semibold" style={{ color: b.color }}>£{b.value.toLocaleString()}</span>
                      </div>
                    ))}
                    <ProgressBar value={(mockData.sen.budget.spent / mockData.sen.budget.allocated) * 100} color="#3b82f6" />
                    <p className="text-xs" style={{ color: '#6B7280' }}>64% of budget spent at end of spring term — on track</p>
                  </div>
                  <div className="mt-3 rounded-lg p-3 text-xs" style={{ backgroundColor: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', color: '#A5B4FC' }}>
                    <p className="font-semibold mb-1">New funding available:</p>
                    <p>• Inclusive Mainstream Fund — £1.6bn nationally (apply via LA)</p>
                    <p>• Experts at Hand — £1.8bn for SALT, EP, OT (apply via ICB)</p>
                  </div>
                </div>
                <div>
                  <SectionTitle icon="📅" title="Key Deadlines This Term" />
                  <div className="space-y-2">
                    {[
                      { date: '28 Mar', task: 'EHCP Annual Review — Pupil A (overdue)', urgency: 'high' },
                      { date: '31 Mar', task: 'Y6 EHCP transfer letters to secondary', urgency: 'high' },
                      { date: '5 Apr', task: '20-week deadline — 2 EHCP assessments', urgency: 'high' },
                      { date: '7 Apr', task: 'EHCP Annual Review — Pupils D, E, F', urgency: 'medium' },
                      { date: '11 Apr', task: 'ISP reviews due — 4 pupils on SEN support', urgency: 'medium' },
                      { date: '14 Apr', task: 'Inclusive Mainstream Fund application', urgency: 'medium' },
                    ].map((d) => (
                      <div key={d.task} className="flex gap-3 p-2 rounded-lg text-sm" style={d.urgency === 'high' ? { backgroundColor: 'rgba(239,68,68,0.1)' } : { backgroundColor: 'rgba(245,158,11,0.1)' }}>
                        <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: d.urgency === 'high' ? '#FCA5A5' : '#FCD34D' }}>{d.date}</span>
                        <span style={{ color: '#D1D5DB' }}>{d.task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── EHCP PIPELINE TAB ── */}
          {senTab === 'ehcp' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                {[
                  { stage: 'Request Received', count: 2, bgStyle: { backgroundColor: '#1F2937', color: '#9CA3AF' } },
                  { stage: 'Assessment Agreed', count: 3, bgStyle: { backgroundColor: 'rgba(96,165,250,0.15)', color: '#93C5FD' } },
                  { stage: 'Evidence Gathering', count: 2, bgStyle: { backgroundColor: 'rgba(129,140,248,0.15)', color: '#A5B4FC' } },
                  { stage: 'Draft Plan', count: 1, bgStyle: { backgroundColor: 'rgba(245,158,11,0.15)', color: '#FCD34D' } },
                  { stage: 'Final Issued', count: 14, bgStyle: { backgroundColor: 'rgba(34,197,94,0.15)', color: '#86EFAC' } },
                ].map((s) => (
                  <div key={s.stage} className="rounded-xl p-3" style={s.bgStyle}>
                    <p className="text-2xl font-bold">{s.count}</p>
                    <p className="text-xs mt-1 font-medium">{s.stage}</p>
                  </div>
                ))}
              </div>

              <div>
                <SectionTitle icon="⏱️" title="20-Week Statutory Deadline Tracker" />
                <p className="text-xs mb-3" style={{ color: '#6B7280' }}>From date of request to final EHCP — LA must comply within 20 weeks</p>
                <div className="space-y-3">
                  {[
                    { pupil: 'Pupil J', year: 'Y2', requestDate: '3 Nov 2024', weeksPassed: 19, weeksLeft: 1, stage: 'Draft Plan', urgency: 'high' },
                    { pupil: 'Pupil K', year: 'Y4', requestDate: '17 Nov 2024', weeksPassed: 17, weeksLeft: 3, stage: 'Evidence Gathering', urgency: 'high' },
                    { pupil: 'Pupil L', year: 'Y1', requestDate: '8 Dec 2024', weeksPassed: 14, weeksLeft: 6, stage: 'Assessment Agreed', urgency: 'medium' },
                    { pupil: 'Pupil M', year: 'Y5', requestDate: '12 Jan 2025', weeksPassed: 10, weeksLeft: 10, stage: 'Request Received', urgency: 'low' },
                    { pupil: 'Pupil N', year: 'Y3', requestDate: '3 Feb 2025', weeksPassed: 7, weeksLeft: 13, stage: 'Request Received', urgency: 'low' },
                  ].map((e) => (
                    <div key={e.pupil} className="rounded-lg p-3" style={{ border: '1px solid #1F2937' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm" style={{ color: '#D1D5DB' }}>{e.pupil} ({e.year})</span>
                          <Badge label={e.stage} color={e.urgency === 'high' ? 'red' : e.urgency === 'medium' ? 'amber' : 'blue'} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: e.urgency === 'high' ? '#FCA5A5' : e.urgency === 'medium' ? '#FCD34D' : '#6B7280' }}>
                          {e.weeksLeft} wk{e.weeksLeft !== 1 ? 's' : ''} left
                        </span>
                      </div>
                      <div className="h-2 rounded-full" style={{ backgroundColor: '#1F2937' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(e.weeksPassed / 20) * 100}%`, backgroundColor: e.urgency === 'high' ? '#F87171' : e.urgency === 'medium' ? '#FBBF24' : '#60A5FA' }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Requested: {e.requestDate} · Week {e.weeksPassed} of 20</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon="📅" title="Annual Review Schedule" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase border-b" style={{ color: '#6B7280', borderColor: '#1F2937' }}>
                      <tr>
                        <th className="py-2 text-left">Pupil</th>
                        <th className="py-2 text-center">Year</th>
                        <th className="py-2 text-center">Due Date</th>
                        <th className="py-2 text-center">Status</th>
                        <th className="py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                      {[
                        { pupil: 'Pupil A', year: 'Y4', due: '14 Mar 2025', status: 'Overdue', notes: 'Parent did not attend. Reschedule urgently.' },
                        { pupil: 'Pupil B', year: 'Y6', due: '28 Mar 2025', status: 'Due soon', notes: 'Transition to secondary — include transfer letter' },
                        { pupil: 'Pupil C', year: 'Y6', due: '1 Apr 2025', status: 'Due soon', notes: 'No secondary placement confirmed yet' },
                        { pupil: 'Pupil D', year: 'Y3', due: '7 Apr 2025', status: 'Scheduled', notes: 'EP report requested 8 weeks ago' },
                        { pupil: 'Pupil E', year: 'Y1', due: '11 May 2025', status: 'On track', notes: '' },
                        { pupil: 'Pupil F', year: 'Y5', due: '2 Jun 2025', status: 'On track', notes: '' },
                      ].map((r) => (
                        <tr key={r.pupil} style={r.status === 'Overdue' ? { backgroundColor: 'rgba(239,68,68,0.1)' } : undefined}>
                          <td className="py-2 font-medium" style={{ color: '#D1D5DB' }}>{r.pupil}</td>
                          <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{r.year}</td>
                          <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{r.due}</td>
                          <td className="py-2 text-center">
                            <Badge
                              label={r.status}
                              color={r.status === 'Overdue' ? 'red' : r.status === 'Due soon' ? 'amber' : r.status === 'Scheduled' ? 'blue' : 'green'}
                            />
                          </td>
                          <td className="py-2 text-xs" style={{ color: '#6B7280' }}>{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <SectionTitle icon="🏫" title="Y6 Transition Tracker" />
                <p className="text-xs mb-3" style={{ color: '#6B7280' }}>All pupils with EHCPs must have transition plans in place before leaving primary — secondary schools must receive EHCP files before the summer.</p>
                <div className="space-y-2">
                  {[
                    { pupil: 'Pupil B', secondary: 'Hillside Academy', ehcpTransferred: true, planInPlace: true, parentConsulted: true },
                    { pupil: 'Pupil C', secondary: 'TBC', ehcpTransferred: false, planInPlace: false, parentConsulted: true },
                    { pupil: 'Pupil O', secondary: 'Riverside Academy', ehcpTransferred: false, planInPlace: true, parentConsulted: false },
                  ].map((t) => (
                    <div key={t.pupil} className="flex items-center justify-between p-3 rounded-lg" style={{ border: '1px solid #1F2937' }}>
                      <div>
                        <span className="font-semibold text-sm" style={{ color: '#D1D5DB' }}>{t.pupil}</span>
                        <span className="text-xs ml-2" style={{ color: '#6B7280' }}>→ {t.secondary}</span>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className={t.ehcpTransferred ? 'text-emerald-500' : 'text-red-400'}>
                          {t.ehcpTransferred ? '✓' : '✗'} EHCP transferred
                        </span>
                        <span className={t.planInPlace ? 'text-emerald-500' : 'text-red-400'}>
                          {t.planInPlace ? '✓' : '✗'} Transition plan
                        </span>
                        <span className={t.parentConsulted ? 'text-emerald-500' : 'text-amber-500'}>
                          {t.parentConsulted ? '✓' : '○'} Parent consulted
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ISP TRACKER TAB ── */}
          {senTab === 'isp' && (
            <div className="space-y-5">
              <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <p className="font-semibold" style={{ color: '#FCD34D' }}>⚠️ Individual Support Plans — New Statutory Requirement (Sept 2029)</p>
                <p className="mt-1 text-xs" style={{ color: '#FCD34D' }}>
                  Under the 2026 White Paper, every child with SEND will require a digital ISP from September 2029. ISPs replace SEN Information Reports and sit alongside EHCPs for complex cases.
                  Schools must start preparing now — the DfE recommends piloting ISP templates in Phase 1 (2025/26).
                  Current status: <strong>templates not yet created.</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="ISPs Active" value="24" sub="Fully signed off" color="green" />
                <StatCard label="ISPs in Draft" value="4" sub="Awaiting sign-off" color="amber" />
                <StatCard label="ISPs Overdue Review" value="4" sub="Past review date" color="red" alert />
                <StatCard label="No ISP Yet" value="10" sub="SEN support only — to action" color="purple" />
              </div>

              <div>
                <SectionTitle icon="📋" title="ISP Status by Pupil" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase border-b" style={{ color: '#6B7280', borderColor: '#1F2937' }}>
                      <tr>
                        <th className="py-2 text-left">Pupil</th>
                        <th className="py-2 text-center">Year</th>
                        <th className="py-2 text-center">Need</th>
                        <th className="py-2 text-center">Tier</th>
                        <th className="py-2 text-center">ISP Status</th>
                        <th className="py-2 text-center">Last Review</th>
                        <th className="py-2 text-center">Next Review</th>
                        <th className="py-2 text-center">Parent Sign-off</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs" style={{ borderColor: '#1F2937' }}>
                      {[
                        { pupil: 'Pupil A', year: 'Y4', need: 'ASD', tier: 'Specialist', status: 'Active', last: 'Sep 2024', next: '28 Mar', parentOk: true },
                        { pupil: 'Pupil B', year: 'Y6', need: 'SEMH', tier: 'Specialist', status: 'Active', last: 'Oct 2024', next: '28 Mar', parentOk: true },
                        { pupil: 'Pupil C', year: 'Y5', need: 'SpLD', tier: 'Targeted', status: 'Active', last: 'Nov 2024', next: '2 May', parentOk: true },
                        { pupil: 'Pupil D', year: 'Y2', need: 'SLCN', tier: 'Targeted+', status: 'Active', last: 'Jan 2025', next: '14 Apr', parentOk: false },
                        { pupil: 'Pupil E', year: 'Y3', need: 'MLD', tier: 'Targeted', status: 'Overdue', last: 'Jul 2024', next: '⚠ Overdue', parentOk: false },
                        { pupil: 'Pupil F', year: 'Y1', need: 'SEMH', tier: 'Targeted', status: 'Draft', last: '—', next: 'Awaiting', parentOk: false },
                        { pupil: 'Pupil G', year: 'Y5', need: 'SpLD', tier: 'Targeted', status: 'Draft', last: '—', next: 'Awaiting', parentOk: false },
                        { pupil: 'Pupil H', year: 'Y6', need: 'ASD', tier: 'Targeted', status: 'None', last: '—', next: '— Create', parentOk: false },
                      ].map((p) => (
                        <tr key={p.pupil} style={p.status === 'None' ? { backgroundColor: 'rgba(167,139,250,0.1)' } : p.status === 'Overdue' ? { backgroundColor: 'rgba(239,68,68,0.1)' } : undefined}>
                          <td className="py-2 font-semibold" style={{ color: '#D1D5DB' }}>{p.pupil}</td>
                          <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{p.year}</td>
                          <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{p.need}</td>
                          <td className="py-2 text-center">
                            <Badge label={p.tier} color={p.tier === 'Specialist' ? 'red' : p.tier === 'Targeted+' ? 'purple' : 'blue'} />
                          </td>
                          <td className="py-2 text-center">
                            <Badge label={p.status} color={p.status === 'Active' ? 'green' : p.status === 'Draft' ? 'amber' : p.status === 'Overdue' ? 'red' : 'purple'} />
                          </td>
                          <td className="py-2 text-center" style={{ color: '#6B7280' }}>{p.last}</td>
                          <td className="py-2 text-center font-medium" style={{ color: p.next.includes('⚠') ? '#FCA5A5' : '#9CA3AF' }}>{p.next}</td>
                          <td className="py-2 text-center">
                            <span className={p.parentOk ? 'text-emerald-500' : 'text-red-400'}>{p.parentOk ? '✓' : '✗'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>
                <SectionTitle icon="📝" title="ISP Template Preparation Status" />
                <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Required for White Paper Phase 1 compliance. DfE recommends digital ISPs aligned to EHCP structure.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { section: 'Barriers to learning', ready: false },
                    { section: 'Provision & adjustments', ready: false },
                    { section: 'Outcomes & targets', ready: false },
                    { section: 'Parent / carer input section', ready: false },
                    { section: 'Pupil voice section', ready: false },
                    { section: 'Review cycle & dates', ready: false },
                    { section: 'Three-tier classification field', ready: false },
                    { section: 'External agency involvement', ready: false },
                  ].map((s) => <CheckItem key={s.section} label={s.section} done={s.ready} />)}
                </div>
                <AlertRow level="high" text="ISP template has not yet been created" sub="Recommend creating before end of summer term to pilot in Sept 2025" />
              </div>
            </div>
          )}

          {/* ── INTERVENTIONS TAB ── */}
          {senTab === 'interventions' && (
            <div className="space-y-5">
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #1F2937' }}>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase" style={{ backgroundColor: '#0D0E14', color: '#6B7280' }}>
                    <tr>
                      <th className="px-4 py-3 text-left">Intervention</th>
                      <th className="px-4 py-3 text-center">Pupils</th>
                      <th className="px-4 py-3 text-center">SEND Pupils</th>
                      <th className="px-4 py-3 text-center">Provider</th>
                      <th className="px-4 py-3 text-center">Frequency</th>
                      <th className="px-4 py-3 text-center">Cost</th>
                      <th className="px-4 py-3 text-center">Impact (EEF)</th>
                      <th className="px-4 py-3 text-center">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                    {[
                      { name: 'Reading Recovery', pupils: 12, send: 8, provider: 'Mrs. Ahmed (trained)', freq: 'Daily 30min', cost: 2400, impact: 'High', evidence: 'Good' },
                      { name: 'SEMH Thrive Programme', pupils: 10, send: 9, provider: 'School Counsellor', freq: '2x weekly', cost: 3200, impact: 'High', evidence: 'Strong' },
                      { name: 'Speech & Language (SALT)', pupils: 7, send: 7, provider: 'External — NHS/LA', freq: 'Weekly', cost: 0, impact: 'High', evidence: 'Strong' },
                      { name: 'Maths Catch-up Groups', pupils: 14, send: 6, provider: 'TA — Mr. Clarke', freq: 'Daily 20min', cost: 1200, impact: 'Medium', evidence: 'Moderate' },
                      { name: 'Sensory Circuits', pupils: 5, send: 5, provider: 'SENCO', freq: '3x weekly AM', cost: 200, impact: 'Medium', evidence: 'Limited' },
                      { name: 'Social Skills Group', pupils: 6, send: 5, provider: 'TA — Ms. Perry', freq: 'Weekly', cost: 800, impact: 'Medium', evidence: 'Moderate' },
                      { name: 'OT Fine Motor', pupils: 3, send: 3, provider: 'External — OT', freq: 'Fortnightly', cost: 0, impact: 'High', evidence: 'Strong' },
                      { name: '1:1 Literacy (SpLD)', pupils: 4, send: 4, provider: 'HLTA', freq: '3x weekly', cost: 1600, impact: 'High', evidence: 'Good' },
                    ].map((i) => (
                      <tr key={i.name}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: '#D1D5DB' }}>{i.name}</td>
                        <td className="px-4 py-2.5 text-center" style={{ color: '#9CA3AF' }}>{i.pupils}</td>
                        <td className="px-4 py-2.5 text-center font-semibold" style={{ color: '#C4B5FD' }}>{i.send}</td>
                        <td className="px-4 py-2.5 text-center text-xs" style={{ color: '#9CA3AF' }}>{i.provider}</td>
                        <td className="px-4 py-2.5 text-center text-xs" style={{ color: '#9CA3AF' }}>{i.freq}</td>
                        <td className="px-4 py-2.5 text-center" style={{ color: '#9CA3AF' }}>
                          {i.cost === 0 ? <span className="text-xs" style={{ color: '#86EFAC' }}>Free</span> : `£${i.cost.toLocaleString()}`}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge label={i.impact} color={i.impact === 'High' ? 'green' : 'blue'} />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge label={i.evidence} color={i.evidence === 'Strong' ? 'green' : i.evidence === 'Good' ? 'blue' : 'amber'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs" style={{ color: '#6B7280' }}>EEF = Education Endowment Foundation evidence rating. Impact and evidence ratings are based on SENCO assessment and EEF Toolkit.</p>
            </div>
          )}

          {/* ── AGENCIES TAB ── */}
          {senTab === 'agencies' && (
            <div className="space-y-5">
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #1F2937' }}>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase" style={{ backgroundColor: '#0D0E14', color: '#6B7280' }}>
                    <tr>
                      <th className="px-4 py-3 text-left">Agency</th>
                      <th className="px-4 py-3 text-center">Referrals Total</th>
                      <th className="px-4 py-3 text-center">Awaiting (wks)</th>
                      <th className="px-4 py-3 text-center">Active</th>
                      <th className="px-4 py-3 text-center">Next Contact</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                    {[
                      { agency: 'CAMHS', total: 4, waiting: '8 wks', active: 2, next: '2 Apr', status: 'Delayed' },
                      { agency: 'Educational Psychologist', total: 6, waiting: '12 wks', active: 3, next: '15 Apr', status: 'Long wait' },
                      { agency: 'SALT (NHS)', total: 5, waiting: '4 wks', active: 4, next: '28 Mar', status: 'Active' },
                      { agency: 'Occupational Therapy', total: 3, waiting: '6 wks', active: 1, next: '10 Apr', status: 'Moderate' },
                      { agency: 'Early Help / Family Support', total: 2, waiting: '0 wks', active: 2, next: '26 Mar', status: 'Active' },
                      { agency: "Children's Social Care", total: 2, waiting: '—', active: 2, next: '26 Mar', status: 'Active' },
                      { agency: 'Specialist SEND Teacher (LA)', total: 3, waiting: '3 wks', active: 2, next: '3 Apr', status: 'Active' },
                    ].map((a) => (
                      <tr key={a.agency}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: '#D1D5DB' }}>{a.agency}</td>
                        <td className="px-4 py-2.5 text-center" style={{ color: '#9CA3AF' }}>{a.total}</td>
                        <td className="px-4 py-2.5 text-center font-semibold" style={{ color: a.status === 'Delayed' || a.status === 'Long wait' ? '#FCA5A5' : '#FCD34D' }}>{a.waiting}</td>
                        <td className="px-4 py-2.5 text-center font-semibold" style={{ color: '#86EFAC' }}>{a.active}</td>
                        <td className="px-4 py-2.5 text-center text-xs" style={{ color: '#6B7280' }}>{a.next}</td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge label={a.status} color={a.status === 'Active' ? 'green' : a.status === 'Moderate' ? 'blue' : 'red'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', color: '#A5B4FC' }}>
                <p className="font-semibold mb-1">📌 Experts at Hand Programme (2026 White Paper)</p>
                <p className="text-xs">
                  The £1.8bn Experts at Hand offer will bring SALT, EP and OT closer to schools — reducing dependency on long CAMHS and NHS waits.
                  Schools can now apply via their Integrated Care Board. Application status: <strong>Not yet submitted.</strong>
                </p>
              </div>
            </div>
          )}

          {/* ── WHITE PAPER TAB ── */}
          {senTab === 'whitepaper' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    phase: 'Phase 1', dates: '2025/26 – 2026/27', bgStyle: { background: 'linear-gradient(to bottom right, rgba(96,165,250,0.1), rgba(129,140,248,0.1))', border: '1px solid rgba(96,165,250,0.25)' },
                    tasks: [
                      { task: 'Inclusion Strategy drafted and published', done: true },
                      { task: 'Universal offer baseline defined for all staff', done: true },
                      { task: 'Three-tier support model mapped to register', done: false },
                      { task: 'ISP template designed and piloted', done: false },
                      { task: 'Staff SEND CPD plan agreed and scheduled', done: true },
                      { task: 'National Inclusion Standards reviewed', done: false },
                      { task: 'Inclusive Mainstream Fund applied for', done: false },
                      { task: 'Experts at Hand application submitted', done: false },
                      { task: 'Parent comms updated re: new system', done: true },
                      { task: 'SENCO on SLT / protected time agreed', done: true },
                    ]
                  },
                  {
                    phase: 'Phase 2', dates: '2026/27 – 2028/29', bgStyle: { background: 'linear-gradient(to bottom right, rgba(245,158,11,0.1), rgba(249,115,22,0.1))', border: '1px solid rgba(245,158,11,0.25)' },
                    tasks: [
                      { task: 'National Inclusion Standards embedded', done: false },
                      { task: 'ISPs fully piloted school-wide', done: false },
                      { task: 'Staff SEND CPD programme (DfE funded) completed', done: false },
                      { task: 'New SEND Code of Practice reviewed', done: false },
                      { task: 'Specialist Provision Package process understood', done: false },
                      { task: 'Local SEND group joined / established', done: false },
                      { task: 'Inclusion funding conditions documented', done: false },
                    ]
                  },
                  {
                    phase: 'Phase 3', dates: '2028/29 onward', bgStyle: { background: 'linear-gradient(to bottom right, rgba(167,139,250,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(167,139,250,0.25)' },
                    tasks: [
                      { task: 'ISPs become statutory (Sept 2029)', done: false },
                      { task: 'Digital EHCPs live', done: false },
                      { task: 'EHCP reassessment at phase transitions begins (Sept 2030)', done: false },
                      { task: 'Updated SEND Code of Practice in force', done: false },
                      { task: 'Complaints panel includes independent SEND expert', done: false },
                    ]
                  },
                ].map((ph) => (
                  <div key={ph.phase} className="rounded-xl p-4" style={ph.bgStyle}>
                    <p className="font-bold text-sm" style={{ color: '#F9FAFB' }}>{ph.phase}</p>
                    <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>{ph.dates}</p>
                    <div className="space-y-0.5">
                      {ph.tasks.map((t) => <CheckItem key={t.task} label={t.task} done={t.done} />)}
                    </div>
                    <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                      {ph.tasks.filter((t) => t.done).length}/{ph.tasks.length} complete
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: '#0D0E14', border: '1px solid #1F2937' }}>
                <SectionTitle icon="🔍" title="Ofsted — What They'll Look For on SEND (2025 Framework)" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {[
                    { area: 'Inclusion (new standalone area)', detail: 'How well school meets needs of SEND, disadvantaged and vulnerable pupils. SENCO empowered as whole-school leader.' },
                    { area: 'Inclusion Strategy', detail: 'Annual strategy published and embedded in practice. Ofsted will assess how leaders ensure it is delivered.' },
                    { area: 'Staff training & knowledge', detail: 'All staff must have SEND training. New duty to clearly signpost DfE-funded CPD.' },
                    { area: 'EHCP & ISP quality', detail: 'Inspectors review how needs are identified, planned for and reviewed. Annual reviews must happen on time.' },
                    { area: 'Progress of SEND pupils', detail: 'Evidence of progress for SEND pupils specifically — Ofsted takes particular care with this group.' },
                    { area: 'Parent engagement', detail: 'Evidence of co-production with parents in ISPs and annual reviews. Parent complaints and mediation process.' },
                  ].map((o) => (
                    <div key={o.area} className="rounded-lg p-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <p className="font-semibold text-xs mb-1" style={{ color: '#D1D5DB' }}>{o.area}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{o.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TA & STAFFING TAB ── */}
          {senTab === 'staffing' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="TAs Deployed for SEND" value="6" sub="Full-time equivalents" color="blue" />
                <StatCard label="1:1 Support Hours/wk" value="42 hrs" sub="Across EHCP pupils" color="purple" />
                <StatCard label="Staff SEND CPD Done" value="18/22" sub="4 outstanding" color="amber" />
                <StatCard label="SENCO Protected Time" value="2.5 days" sub="Recommended: 3+ days" color="red" alert />
              </div>

              <div>
                <SectionTitle icon="👩‍🏫" title="TA Deployment — SEND Pupils" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase border-b" style={{ color: '#6B7280', borderColor: '#1F2937' }}>
                      <tr>
                        <th className="py-2 text-left">TA Name</th>
                        <th className="py-2 text-center">Assigned SEND Pupils</th>
                        <th className="py-2 text-center">Hours/wk</th>
                        <th className="py-2 text-center">1:1 or Group</th>
                        <th className="py-2 text-center">SEND Training</th>
                        <th className="py-2 text-center">Review Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                      {[
                        { name: 'Ms. Perry', pupils: 3, hours: 10, type: '1:1', trained: true, due: 'Jul 2025' },
                        { name: 'Mr. Clarke', pupils: 5, hours: 12, type: 'Group', trained: true, due: 'Apr 2025' },
                        { name: 'Mrs. Okafor', pupils: 2, hours: 8, type: '1:1', trained: false, due: 'Overdue' },
                        { name: 'Mr. Singh', pupils: 4, hours: 9, type: 'Group', trained: true, due: 'Sep 2025' },
                        { name: 'Ms. Thomas', pupils: 2, hours: 6, type: '1:1', trained: false, due: 'Pending' },
                      ].map((ta) => (
                        <tr key={ta.name} style={!ta.trained ? { backgroundColor: 'rgba(245,158,11,0.1)' } : undefined}>
                          <td className="py-2 font-medium" style={{ color: '#D1D5DB' }}>{ta.name}</td>
                          <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{ta.pupils}</td>
                          <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{ta.hours}</td>
                          <td className="py-2 text-center"><Badge label={ta.type} color="blue" /></td>
                          <td className="py-2 text-center"><span className={ta.trained ? 'text-emerald-500' : 'text-red-400'}>{ta.trained ? '✓ Current' : '✗ Outstanding'}</span></td>
                          <td className="py-2 text-center text-xs font-medium" style={{ color: ta.due === 'Overdue' ? '#FCA5A5' : '#9CA3AF' }}>{ta.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <SectionTitle icon="🎓" title="Staff SEND CPD Training Matrix" />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="uppercase border-b" style={{ color: '#6B7280', borderColor: '#1F2937' }}>
                      <tr>
                        <th className="py-2 text-left">Staff Member</th>
                        <th className="py-2 text-center">SEND Awareness</th>
                        <th className="py-2 text-center">SEMH</th>
                        <th className="py-2 text-center">Autism</th>
                        <th className="py-2 text-center">Dyslexia/SpLD</th>
                        <th className="py-2 text-center">Safeguarding + SEND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm" style={{ borderColor: '#1F2937' }}>
                      {[
                        { name: 'SENCO', s: true, e: true, a: true, d: true, sg: true },
                        { name: 'Head', s: true, e: true, a: true, d: false, sg: true },
                        { name: 'Year 5 Teacher', s: true, e: true, a: false, d: true, sg: true },
                        { name: 'Year 6 Teacher', s: true, e: false, a: true, d: false, sg: true },
                        { name: 'Year 4 Teacher', s: true, e: false, a: false, d: false, sg: false },
                        { name: 'Ms. Perry (TA)', s: true, e: true, a: true, d: true, sg: true },
                        { name: 'Mr. Clarke (TA)', s: true, e: true, a: false, d: true, sg: true },
                        { name: 'Mrs. Okafor (TA)', s: false, e: false, a: false, d: false, sg: false },
                      ].map((s) => (
                        <tr key={s.name}>
                          <td className="py-2 font-medium" style={{ color: '#D1D5DB' }}>{s.name}</td>
                          {[s.s, s.e, s.a, s.d, s.sg].map((v, i) => (
                            <td key={i} className="py-2 text-center">
                              <span className={v ? 'text-emerald-500' : 'text-red-300'}>{v ? '✓' : '✗'}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}


function SafeguardingView() {
  const [dslTab, setDslTab] = useState<'overview' | 'cases' | 'compliance' | 'online' | 'training' | 'records'>('overview')

  const dslTabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'cases', label: '🔴 Case Management' },
    { id: 'compliance', label: '✅ Compliance' },
    { id: 'online', label: '💻 Online Safety' },
    { id: 'training', label: '🎓 Training' },
    { id: 'records', label: '📁 Records & Transfers' },
  ]

  return (
    <div className="space-y-6">
      <AIInsightBox
        text={`4 open safeguarding cases: 2 Child Protection (one is a high-risk domestic abuse situation), 2 Children in Need. 3 Looked After Children enrolled. KCSIE 2024 compliance is 87% — key gaps: staff training (4 outstanding), online safety risk assessment not yet reviewed, and filtering/monitoring audit overdue. Under KCSIE 2024, the DSL holds responsibility for online safety and understanding filtering/monitoring systems — this must not be delegated. Prevent duty compliance is Met. Next TAF review is 26 March. Single Central Record is up to date. Safer recruitment compliance: 100%.`}
      />

      {/* KCSIE 2024 callout */}
      <div className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🛡️</span>
          <div className="flex-1">
            <p className="font-bold text-sm">Keeping Children Safe in Education (KCSIE) 2024</p>
            <p className="text-xs text-slate-300 mt-1">In force from 1 September 2024 · DSL holds statutory responsibility — cannot be delegated</p>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                { area: 'Online Safety', sub: 'DSL responsible — including filtering & monitoring' },
                { area: 'Early Help', sub: 'Expanded definition — act before escalation' },
                { area: 'Child-on-Child Abuse', sub: 'Updated guidance and recording requirements' },
                { area: 'Records', sub: 'Chronology + secure transfer when pupils leave' },
              ].map((k) => (
                <div key={k.area} className="bg-white/10 rounded-lg p-2">
                  <p className="font-semibold">{k.area}</p>
                  <p className="text-slate-300 mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open Cases" value="4" sub="2 CP · 2 CiN" color="red" alert />
        <StatCard label="Looked After Children" value="3" sub="2 primary school age" color="purple" />
        <StatCard label="Referrals This Term" value="6" sub="vs 7 last term" color="blue" />
        <StatCard label="KCSIE Compliance" value="87%" sub="3 gaps identified" color="amber" alert />
      </div>

      {/* Sub-tab navigation */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex flex-wrap border-b px-4 pt-3 gap-1" style={{ borderColor: '#1F2937', backgroundColor: '#0D0E14' }}>
          {dslTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setDslTab(t.id as any)}
              className="px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 transition"
              style={dslTab === t.id
                ? { borderColor: '#EF4444', color: '#FCA5A5', backgroundColor: '#111318' }
                : { borderColor: 'transparent', color: '#9CA3AF' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── OVERVIEW TAB ── */}
          {dslTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <SectionTitle icon="🚨" title="Active Concerns — Priority Summary" />
                  <div className="space-y-2">
                    <AlertRow level="high" text="CP Case — Pupil R (Y3): Domestic abuse in household" sub="TAF meeting 26 Mar · Social worker: Priya Shah" />
                    <AlertRow level="high" text="CP Case — Pupil S (Y5): Physical abuse allegation — under investigation" sub="Strategy meeting held 14 Mar · Police involved" />
                    <AlertRow level="medium" text="CiN Case — Pupil T (Y2): Neglect concerns, family support in place" sub="Next CiN review: 7 Apr" />
                    <AlertRow level="medium" text="CiN Case — Pupil U (Y4): Parent MH issues affecting care" sub="Early help team involved — next review 2 Apr" />
                    <AlertRow level="low" text="Concern logged — Pupil V (Y6): Online contact from unknown adult" sub="Logged 18 Mar · DSL monitoring — no referral yet" />
                  </div>
                </div>
                <div>
                  <SectionTitle icon="📅" title="Key Upcoming Dates" />
                  <div className="space-y-2">
                    {[
                      { date: '26 Mar', event: 'TAF Meeting — Pupil R', type: 'cp', urgent: true },
                      { date: '2 Apr', event: 'CiN Review — Pupil U', type: 'cin', urgent: false },
                      { date: '7 Apr', event: 'CiN Review — Pupil T', type: 'cin', urgent: false },
                      { date: '7 Apr', event: 'LAC Review — Pupil W', type: 'lac', urgent: false },
                      { date: '11 Apr', event: 'Safer recruitment audit — 2 new staff', type: 'compliance', urgent: false },
                      { date: '1 May', event: 'DSL Supervision session', type: 'staff', urgent: false },
                      { date: '1 Jul', event: 'Annual safeguarding audit due', type: 'compliance', urgent: false },
                    ].map((e) => (
                      <div key={e.event} className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm" style={e.urgent ? { backgroundColor: 'rgba(239,68,68,0.1)' } : { backgroundColor: '#0D0E14' }}>
                        <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: '#6B7280' }}>{e.date}</span>
                        <span className="flex-1" style={{ color: e.urgent ? '#FCA5A5' : '#D1D5DB', fontWeight: e.urgent ? 500 : undefined }}>{e.event}</span>
                        <Badge
                          label={e.type.toUpperCase()}
                          color={e.type === 'cp' ? 'red' : e.type === 'cin' ? 'amber' : e.type === 'lac' ? 'purple' : 'blue'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Safer Recruitment" value="100%" sub="All staff checks complete" color="green" />
                <StatCard label="Last Audit" value="Met" sub="Conducted Jan 2025" color="green" />
                <StatCard label="Next Audit Due" value="Jul 2025" sub="Schedule now — before term ends" color="amber" />
              </div>
            </div>
          )}

          {/* ── CASE MANAGEMENT TAB ── */}
          {dslTab === 'cases' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                {[
                  { label: 'Child Protection', count: 2, bgStyle: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#FCA5A5' } },
                  { label: 'Children in Need', count: 2, bgStyle: { backgroundColor: 'rgba(249,115,22,0.15)', color: '#FDBA74' } },
                  { label: 'Looked After', count: 3, bgStyle: { backgroundColor: 'rgba(167,139,250,0.15)', color: '#C4B5FD' } },
                  { label: 'Early Help', count: 4, bgStyle: { backgroundColor: 'rgba(96,165,250,0.15)', color: '#93C5FD' } },
                  { label: 'Monitored/Logged', count: 6, bgStyle: { backgroundColor: '#1F2937', color: '#9CA3AF' } },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3" style={s.bgStyle}>
                    <p className="text-2xl font-bold">{s.count}</p>
                    <p className="text-xs mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <SectionTitle icon="🔴" title="Active CP / CiN Cases" />
                <div className="space-y-3">
                  {[
                    {
                      pupil: 'Pupil R', year: 'Y3', type: 'CP', category: 'Neglect / Domestic Abuse',
                      sw: 'Priya Shah (LA)', nextMeeting: '26 Mar — TAF', dateOpened: '12 Jan 2025',
                      status: 'On CP Register', notes: 'Father removed from household. Mum engaging with support.',
                    },
                    {
                      pupil: 'Pupil S', year: 'Y5', type: 'CP', category: 'Physical Abuse',
                      sw: 'James Obi (LA)', nextMeeting: '3 Apr — CPC Review', dateOpened: '5 Mar 2025',
                      status: 'Under investigation', notes: 'Allegation made by pupil to class teacher. Strategy meeting held.',
                    },
                    {
                      pupil: 'Pupil T', year: 'Y2', type: 'CiN', category: 'Neglect',
                      sw: 'Family Support Worker', nextMeeting: '7 Apr — CiN Review', dateOpened: '14 Oct 2024',
                      status: 'CiN Plan active', notes: 'Attendance improved. Breakfast club supporting.',
                    },
                    {
                      pupil: 'Pupil U', year: 'Y4', type: 'CiN', category: 'Parent mental health',
                      sw: 'Early Help Team', nextMeeting: '2 Apr — Review', dateOpened: '3 Feb 2025',
                      status: 'CiN Plan active', notes: 'Mum receiving community mental health support.',
                    },
                  ].map((c) => (
                    <div key={c.pupil} className="rounded-xl p-4" style={c.type === 'CP' ? { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' } : { backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold" style={{ color: '#F9FAFB' }}>{c.pupil} ({c.year})</span>
                          <Badge label={c.type} color={c.type === 'CP' ? 'red' : 'amber'} />
                          <Badge label={c.category} color="blue" />
                        </div>
                        <span className="text-xs" style={{ color: '#6B7280' }}>Opened: {c.dateOpened}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                        <p><span className="font-semibold">Social Worker:</span> {c.sw}</p>
                        <p><span className="font-semibold">Next Meeting:</span> {c.nextMeeting}</p>
                        <p><span className="font-semibold">Status:</span> {c.status}</p>
                      </div>
                      <p className="text-xs mt-2 italic" style={{ color: '#9CA3AF' }}>{c.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle icon="💜" title="Looked After Children" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase border-b" style={{ color: '#6B7280', borderColor: '#1F2937' }}>
                      <tr>
                        <th className="py-2 text-left">Pupil</th>
                        <th className="py-2 text-center">Year</th>
                        <th className="py-2 text-center">PEP Up to Date</th>
                        <th className="py-2 text-center">LAC Review</th>
                        <th className="py-2 text-center">Attendance</th>
                        <th className="py-2 text-center">SEND</th>
                        <th className="py-2 text-center">PP+ Claimed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                      {[
                        { pupil: 'Pupil W', year: 'Y4', pep: true, review: '7 Apr', att: '91%', send: true, pp: true },
                        { pupil: 'Pupil X', year: 'Y2', pep: true, review: '14 May', att: '95%', send: false, pp: true },
                        { pupil: 'Pupil Y', year: 'Y6', pep: false, review: '28 Apr', att: '88%', send: true, pp: true },
                      ].map((l) => (
                        <tr key={l.pupil} style={!l.pep ? { backgroundColor: 'rgba(245,158,11,0.1)' } : undefined}>
                          <td className="py-2 font-medium" style={{ color: '#D1D5DB' }}>{l.pupil}</td>
                          <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{l.year}</td>
                          <td className="py-2 text-center"><span className={l.pep ? 'text-emerald-500' : 'text-red-400'}>{l.pep ? '✓ Current' : '✗ Overdue'}</span></td>
                          <td className="py-2 text-center text-xs" style={{ color: '#9CA3AF' }}>{l.review}</td>
                          <td className="py-2 text-center font-semibold" style={{ color: parseFloat(l.att) < 90 ? '#FCA5A5' : '#9CA3AF' }}>{l.att}</td>
                          <td className="py-2 text-center"><span className={l.send ? 'text-purple-500' : 'text-gray-300'}>{l.send ? '✓' : '—'}</span></td>
                          <td className="py-2 text-center"><span className={l.pp ? 'text-emerald-500' : 'text-red-400'}>{l.pp ? '✓' : '✗'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── COMPLIANCE TAB ── */}
          {dslTab === 'compliance' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <SectionTitle icon="✅" title="KCSIE 2024 Compliance Checklist" />
                  <div className="space-y-0.5">
                    {[
                      { label: 'Child protection policy — current academic year', done: true },
                      { label: 'Safeguarding policy publicly available', done: true },
                      { label: 'Single Central Record up to date', done: true },
                      { label: 'DBS checks current — all staff & volunteers', done: true },
                      { label: 'Safer recruitment trained governor on panel', done: true },
                      { label: 'DSL appointed and in job description', done: true },
                      { label: 'Deputy DSL trained to same standard as DSL', done: true },
                      { label: 'DSL training renewed within 2 years', done: true },
                      { label: 'All staff received KCSIE induction', done: true },
                      { label: 'Annual staff safeguarding update delivered', done: true },
                      { label: 'Online safety in safeguarding policy (KCSIE 2024)', done: false },
                      { label: 'Filtering & monitoring annual review completed', done: false },
                      { label: 'Online safety risk assessment (annual)', done: false },
                      { label: 'Staff training includes filtering & monitoring (KCSIE 2024)', done: false },
                      { label: 'Prevent duty policy reviewed', done: true },
                      { label: 'Peer-on-peer / child-on-child abuse policy updated', done: true },
                      { label: 'Governor named for safeguarding oversight', done: true },
                      { label: 'Safeguarding audit within last 12 months', done: true },
                    ].map((i) => <CheckItem key={i.label} label={i.label} done={i.done} />)}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <SectionTitle icon="🔒" title="Prevent Duty Compliance" />
                    <div className="space-y-0.5">
                      {[
                        { label: 'Prevent risk assessment completed', done: true },
                        { label: 'Channel referral process known to all staff', done: true },
                        { label: 'WRAP training — DSL and SLT', done: true },
                        { label: 'British values embedded in curriculum', done: true },
                        { label: 'Online radicalisation included in online safety', done: true },
                        { label: 'Prevent reviewed in safeguarding audit', done: true },
                      ].map((i) => <CheckItem key={i.label} label={i.label} done={i.done} />)}
                    </div>
                    <Badge label="Prevent: Compliant" color="green" />
                  </div>

                  <div>
                    <SectionTitle icon="📊" title="Safer Recruitment" />
                    <div className="space-y-0.5">
                      {[
                        { label: 'All staff DBS checked before start', done: true },
                        { label: 'References checked prior to appointment', done: true },
                        { label: 'Identity verification completed', done: true },
                        { label: 'Prohibition from teaching check (Teachers)', done: true },
                        { label: 'Right to work in UK verified', done: true },
                        { label: 'Disqualification by association checks', done: true },
                        { label: 'Overseas checks where applicable', done: true },
                      ].map((i) => <CheckItem key={i.label} label={i.label} done={i.done} />)}
                    </div>
                    <Badge label="Safer Recruitment: 100%" color="green" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ONLINE SAFETY TAB ── */}
          {dslTab === 'online' && (
            <div className="space-y-5">
              <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#93C5FD' }}>
                <p className="font-semibold">💻 KCSIE 2024: Online Safety is a DSL Statutory Responsibility</p>
                <p className="text-xs mt-1" style={{ color: '#93C5FD' }}>
                  The DSL has overall responsibility for online safety and must personally understand the filtering and monitoring systems in place. This responsibility cannot be delegated.
                  Schools must conduct an annual risk assessment and review filtering/monitoring at least yearly.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Filtering System" value="Active" sub="Smoothwall — reviewed Nov 2024" color="green" />
                <StatCard label="Monitoring System" value="Active" sub="Safeguard — weekly reports" color="green" />
                <StatCard label="Annual Review" value="Overdue" sub="Due Jan 2025 — not completed" color="red" alert />
                <StatCard label="Online Incidents YTD" value="3" sub="2 resolved · 1 open" color="amber" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <SectionTitle icon="⚙️" title="Filtering & Monitoring Compliance" />
                  <div className="space-y-0.5">
                    {[
                      { label: 'Filtering system in place on all school devices', done: true },
                      { label: 'Filtering covers all school networks (including wifi)', done: true },
                      { label: 'DSL understands filtering system capability', done: true },
                      { label: 'Monitoring system active and reviewed', done: true },
                      { label: 'Monitoring alerts reviewed by DSL regularly', done: true },
                      { label: 'Annual filtering & monitoring review completed', done: false },
                      { label: 'Online safety risk assessment (this academic year)', done: false },
                      { label: 'CP policy includes online safety section', done: false },
                      { label: 'Staff acceptable use policy — includes personal devices', done: true },
                      { label: 'Pupil acceptable use agreement in place', done: true },
                      { label: 'Staff training includes filtering & monitoring', done: false },
                    ].map((i) => <CheckItem key={i.label} label={i.label} done={i.done} />)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <SectionTitle icon="🚨" title="Online Incidents This Year" />
                    <div className="space-y-2">
                      {[
                        { date: '5 Nov', type: 'Cyberbullying', pupil: 'Pupil Z (Y6)', status: 'Resolved', urgency: 'medium' },
                        { date: '18 Jan', type: 'Inappropriate content accessed', pupil: 'Pupil AA (Y5)', status: 'Resolved', urgency: 'low' },
                        { date: '18 Mar', type: 'Contact from unknown adult online', pupil: 'Pupil V (Y6)', status: 'Open — monitoring', urgency: 'high' },
                      ].map((i) => (
                        <AlertRow key={i.date} level={i.urgency as any} text={`${i.type} — ${i.pupil}`} sub={`${i.date} · ${i.status}`} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionTitle icon="📚" title="Online Safety Curriculum" />
                    <div className="space-y-0.5">
                      {[
                        { label: 'Online safety taught in RSE/PSHE (all year groups)', done: true },
                        { label: 'Sharing nudes / sexting guidance delivered (Y5/Y6)', done: true },
                        { label: 'Online harmful challenges guidance delivered', done: true },
                        { label: 'Safe use of AI discussed with older pupils', done: false },
                        { label: 'Safer Internet Day programme delivered', done: true },
                        { label: 'Parent online safety workshop this year', done: false },
                      ].map((i) => <CheckItem key={i.label} label={i.label} done={i.done} />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TRAINING TAB ── */}
          {dslTab === 'training' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Staff Training Current" value="18/22" sub="4 outstanding" color="amber" />
                <StatCard label="DSL Training Valid" value="Yes" sub="Renewed Nov 2024" color="green" />
                <StatCard label="Deputy DSL Training" value="Yes" sub="Renewed Nov 2024" color="green" />
                <StatCard label="Governor Training" value="2/3" sub="1 governor outstanding" color="amber" />
              </div>

              <div>
                <SectionTitle icon="🎓" title="Whole-School Safeguarding Training Matrix" />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-xs uppercase" style={{ color: '#6B7280', borderBottom: '1px solid #1F2937' }}>
                      <tr>
                        <th className="py-2 text-left">Staff Member</th>
                        <th className="py-2 text-center">KCSIE Induction</th>
                        <th className="py-2 text-center">Annual Update</th>
                        <th className="py-2 text-center">Online Safety</th>
                        <th className="py-2 text-center">Prevent WRAP</th>
                        <th className="py-2 text-center">Peer-on-Peer</th>
                        <th className="py-2 text-center">Next Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm" style={{ borderColor: '#1F2937' }}>
                      {[
                        { name: 'DSL (Mrs. Hall)', kcsie: true, annual: true, online: true, prevent: true, pop: true, due: 'Nov 2025' },
                        { name: 'Deputy DSL', kcsie: true, annual: true, online: true, prevent: true, pop: true, due: 'Nov 2025' },
                        { name: 'Head', kcsie: true, annual: true, online: true, prevent: true, pop: true, due: 'Sep 2025' },
                        { name: 'Year 5 Teacher', kcsie: true, annual: true, online: false, prevent: true, pop: true, due: 'Sep 2025' },
                        { name: 'Year 6 Teacher', kcsie: true, annual: true, online: true, prevent: false, pop: true, due: 'Sep 2025' },
                        { name: 'Year 4 Teacher', kcsie: true, annual: false, online: false, prevent: false, pop: false, due: '⚠ Overdue' },
                        { name: 'Year 3 Teacher', kcsie: true, annual: true, online: true, prevent: true, pop: true, due: 'Sep 2025' },
                        { name: 'Ms. Perry (TA)', kcsie: true, annual: true, online: false, prevent: true, pop: true, due: 'Sep 2025' },
                        { name: 'Mr. Clarke (TA)', kcsie: true, annual: false, online: false, prevent: false, pop: false, due: '⚠ Overdue' },
                        { name: 'Mrs. Okafor (TA)', kcsie: false, annual: false, online: false, prevent: false, pop: false, due: '⚠ Overdue' },
                        { name: 'Lunchtime supervisor', kcsie: true, annual: false, online: false, prevent: false, pop: false, due: '⚠ Overdue' },
                      ].map((s) => (
                        <tr key={s.name} style={!s.kcsie || !s.annual ? { backgroundColor: 'rgba(239,68,68,0.1)' } : undefined}>
                          <td className="py-2 font-medium" style={{ color: '#D1D5DB' }}>{s.name}</td>
                          {[s.kcsie, s.annual, s.online, s.prevent, s.pop].map((v, i) => (
                            <td key={i} className="py-2 text-center">
                              <span className={v ? 'text-emerald-500' : 'text-red-300'}>{v ? '✓' : '✗'}</span>
                            </td>
                          ))}
                          <td className="py-2 text-center text-xs font-medium" style={{ color: s.due.includes('⚠') ? '#FCA5A5' : '#6B7280' }}>{s.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SectionTitle icon="⏰" title="DSL & Deputy Training Renewal" />
                  <div className="space-y-3">
                    {[
                      { role: 'DSL — Mrs. Hall', date: '14 Nov 2024', expires: '14 Nov 2026', valid: true },
                      { role: 'Deputy DSL — Mr. Wilson', date: '14 Nov 2024', expires: '14 Nov 2026', valid: true },
                    ].map((d) => (
                      <div key={d.role} className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <p className="font-semibold" style={{ color: '#6EE7B7' }}>{d.role}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6EE7B7' }}>Trained: {d.date} · Expires: {d.expires}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionTitle icon="📋" title="DSL Supervision Log" />
                  <div className="space-y-2 text-sm">
                    {[
                      { date: '3 Feb 2025', with: 'External Safeguarding Lead', notes: 'Reviewed CP cases, discussed CP case strategy' },
                      { date: '2 Dec 2024', with: 'Head / External supervisor', notes: 'End-of-term case review and wellbeing check' },
                      { date: '1 Oct 2024', with: 'External Safeguarding Lead', notes: 'New academic year case overview' },
                    ].map((s) => (
                      <div key={s.date} className="p-3 rounded-lg" style={{ backgroundColor: '#0D0E14', border: '1px solid #1F2937' }}>
                        <p className="font-medium text-xs" style={{ color: '#D1D5DB' }}>{s.date} — {s.with}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{s.notes}</p>
                      </div>
                    ))}
                    <p className="text-xs" style={{ color: '#6B7280' }}>Next supervision: 1 May 2025</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RECORDS & TRANSFERS TAB ── */}
          {dslTab === 'records' && (
            <div className="space-y-5">
              <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#0D0E14', border: '1px solid #1F2937', color: '#D1D5DB' }}>
                <p className="font-semibold">📁 KCSIE 2024: Record-Keeping Requirements</p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  The DSL must keep detailed, accurate, written records including a chronology of concerns, referrals, meetings, phone calls and emails.
                  Records must be kept separately from pupil records, held securely, and transferred to the new school immediately when pupils leave — with confirmation of receipt obtained.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <SectionTitle icon="📤" title="Records Transfer — Leavers" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase" style={{ color: '#6B7280', borderBottom: '1px solid #1F2937' }}>
                        <tr>
                          <th className="py-2 text-left">Pupil</th>
                          <th className="py-2 text-center">Left</th>
                          <th className="py-2 text-center">New School</th>
                          <th className="py-2 text-center">File Transferred</th>
                          <th className="py-2 text-center">Receipt Confirmed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
                        {[
                          { pupil: 'Former Pupil A', left: 'Jan 2025', school: 'Riverside Academy', transferred: true, receipt: true },
                          { pupil: 'Former Pupil B', left: 'Feb 2025', school: 'St. Mary\'s Primary', transferred: true, receipt: false },
                          { pupil: 'Former Pupil C', left: 'Mar 2025', school: 'TBC', transferred: false, receipt: false },
                        ].map((r) => (
                          <tr key={r.pupil} style={!r.transferred ? { backgroundColor: 'rgba(239,68,68,0.1)' } : !r.receipt ? { backgroundColor: 'rgba(245,158,11,0.1)' } : undefined}>
                            <td className="py-2 font-medium" style={{ color: '#D1D5DB' }}>{r.pupil}</td>
                            <td className="py-2 text-center text-xs" style={{ color: '#6B7280' }}>{r.left}</td>
                            <td className="py-2 text-center text-xs" style={{ color: '#9CA3AF' }}>{r.school}</td>
                            <td className="py-2 text-center"><span className={r.transferred ? 'text-emerald-500' : 'text-red-400'}>{r.transferred ? '✓' : '✗ Pending'}</span></td>
                            <td className="py-2 text-center"><span className={r.receipt ? 'text-emerald-500' : 'text-amber-500'}>{r.receipt ? '✓' : '○ Awaited'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <AlertRow level="high" text="Former Pupil C — file not yet transferred (school unknown)" sub="Pupil left 3 weeks ago — new placement not confirmed" />
                </div>

                <div>
                  <SectionTitle icon="📥" title="Incoming Pupils — Records Requested" />
                  <div className="space-y-2">
                    {[
                      { pupil: 'New Pupil AA', year: 'Y3', from: 'Maple Grove Primary', received: true, concerns: false },
                      { pupil: 'New Pupil BB', year: 'Y5', from: 'Out of LA (Birmingham)', received: false, concerns: true },
                    ].map((r) => (
                      <div key={r.pupil} className="rounded-lg border p-3 text-sm" style={!r.received ? { backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' } : { backgroundColor: '#0D0E14', border: '1px solid #1F2937' }}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium" style={{ color: '#D1D5DB' }}>{r.pupil} ({r.year})</span>
                          {r.concerns && <Badge label="Safeguarding concern flagged" color="red" />}
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>From: {r.from}</p>
                        <p className={`text-xs mt-0.5 font-medium ${r.received ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {r.received ? '✓ Records received' : '○ Records requested — awaiting'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <SectionTitle icon="🔒" title="Single Central Record" />
                    <div className="space-y-0.5">
                      {[
                        { label: 'All teaching staff on SCR', done: true },
                        { label: 'All support staff on SCR', done: true },
                        { label: 'All volunteers on SCR', done: true },
                        { label: 'Contractors with unsupervised access on SCR', done: true },
                        { label: 'SCR reviewed this academic year', done: true },
                        { label: 'SCR accessible to Ofsted on inspection', done: true },
                      ].map((i) => <CheckItem key={i.label} label={i.label} done={i.done} />)}
                    </div>
                    <Badge label="SCR: Fully compliant" color="green" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}


function PupilPremiumView() {
  return (
    <div className="space-y-6">
      <AIInsightBox
        text={`31 pupils (21.4% of roll) are Pupil Premium eligible — above the national average of ~18%. The attainment gap has closed from 17 points last year to 14 points this year, and sits below the national gap of 18 points — a positive trajectory. PP funding is on track: £7,640 spent of £12,800 allocated. Reading Recovery and 1:1 tutoring are showing high impact. Breakfast Club and Homework Club are delivering medium impact. Recommend reviewing whether SEMH support spend can be extended, given its high-impact classification.`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="PP Eligible Pupils" value="31" sub="21.4% of school" color="blue" />
        <StatCard label="Attainment Gap" value="14 pts" sub="↓ from 17 last year" color="green" trend="down" />
        <StatCard label="National Gap" value="18 pts" sub="School is below national" color="teal" />
        <StatCard label="PP Funding" value="£12,800" sub={`£${mockData.pupilPremium.spentToDate.toLocaleString()} spent`} color="purple" />
      </div>

      <div className="rounded-xl border p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <SectionTitle icon="🎯" title="Intervention Impact Tracker" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase" style={{ color: '#6B7280', borderBottom: '1px solid #1F2937' }}>
              <tr>
                <th className="py-2 text-left">Intervention</th>
                <th className="py-2 text-center">PP Pupils</th>
                <th className="py-2 text-center">Cost</th>
                <th className="py-2 text-center">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1F2937' }}>
              {mockData.pupilPremium.interventions.map((i) => (
                <tr key={i.name}>
                  <td className="py-2 font-medium" style={{ color: '#D1D5DB' }}>{i.name}</td>
                  <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>{i.pupils}</td>
                  <td className="py-2 text-center" style={{ color: '#9CA3AF' }}>£{i.cost.toLocaleString()}</td>
                  <td className="py-2 text-center">
                    <Badge label={i.impact} color={i.impact === 'High' ? 'green' : 'blue'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="💰" title="Budget Tracking" />
          <ProgressBar
            label={`Spent: £${mockData.pupilPremium.spentToDate.toLocaleString()} of £${mockData.pupilPremium.funding.toLocaleString()}`}
            value={(mockData.pupilPremium.spentToDate / mockData.pupilPremium.funding) * 100}
            color="#6366f1"
          />
          <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
            Remaining: £{(mockData.pupilPremium.funding - mockData.pupilPremium.spentToDate).toLocaleString()} — 2 terms remaining
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="📉" title="Attainment Gap Trend" />
          <div className="flex items-end gap-4 h-20 mt-2">
            {[
              { year: '22/23', gap: 21 },
              { year: '23/24', gap: 17 },
              { year: '24/25', gap: 14 },
            ].map((d) => (
              <div key={d.year} className="flex flex-col items-center flex-1">
                <span className="text-xs font-bold mb-1" style={{ color: '#D1D5DB' }}>{d.gap}pts</span>
                <div
                  className="w-full rounded-t bg-blue-400"
                  style={{ height: `${(d.gap / 25) * 70}px` }}
                />
                <span className="text-xs mt-1" style={{ color: '#6B7280' }}>{d.year}</span>
              </div>
            ))}
            <div className="flex flex-col items-center flex-1">
              <span className="text-xs font-bold mb-1" style={{ color: '#6B7280' }}>18pts</span>
              <div className="w-full rounded-t" style={{ height: `${(18 / 25) * 70}px`, backgroundColor: '#374151' }} />
              <span className="text-xs mt-1" style={{ color: '#6B7280' }}>National</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InspectionsView() {
  return (
    <div className="space-y-6">
      <AIInsightBox
        text={`Under the new 2025 Ofsted framework (in effect Nov 2025), schools receive report cards across 6 areas — no single overall grade. Based on current data, Oakridge is performing at Strong Standard in Inclusion, Attendance & Behaviour, and Personal Development. Curriculum & Teaching, Achievement and Leadership & Governance are at Expected Standard. Next inspection is expected Autumn 2026. 2 evidence gaps are flagged: the Attendance Improvement Plan and the Disadvantage Gap Action Plan are not yet complete — these should be prioritised before summer. Safeguarding is fully compliant.`}
      />

      {/* New framework explainer */}
      <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <p className="font-semibold" style={{ color: '#FCD34D' }}>📌 New Ofsted Framework — November 2025</p>
        <p className="mt-1 text-xs" style={{ color: '#FCD34D' }}>
          The familiar single Overall Effectiveness grade (Outstanding/Good/RI/Inadequate) has been replaced by a detailed <strong>Report Card</strong> across 6 evaluation areas, graded on a 5-point scale:
          Exceptional → Strong Standard → Expected Standard → Needs Attention → Urgent Improvement.
          Safeguarding is judged separately as Met / Not Met.
        </p>
      </div>

      <div>
        <SectionTitle icon="🧾" title="Ofsted Report Card — Current Readiness" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockData.ofsted.areas.map((a) => {
            const gradeStyle: React.CSSProperties = ({
              green: { backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' },
              blue: { backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)' },
              amber: { backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' },
              red: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' },
            } as Record<string, React.CSSProperties>)[a.color] || { backgroundColor: '#0D0E14', border: '1px solid #1F2937' }
            const badgeColor = { green: 'green', blue: 'blue', amber: 'amber', red: 'red' }[a.color] as any
            return (
              <div key={a.area} className="rounded-xl p-4" style={gradeStyle}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: '#D1D5DB' }}>{a.area}</p>
                  <Badge label={a.grade} color={badgeColor} />
                </div>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="flex-1 h-1.5 rounded-full"
                      style={{ backgroundColor: n <= a.score ? (a.color === 'green' ? '#34D399' : '#60A5FA') : '#1F2937' }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="📂" title="Evidence Readiness Tracker" />
          <div className="space-y-0.5">
            {mockData.ofsted.evidenceReadiness.map((e) => (
              <CheckItem key={e.area} label={e.area} done={e.ready} />
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
            {mockData.ofsted.evidenceReadiness.filter((e) => e.ready).length}/{mockData.ofsted.evidenceReadiness.length} items ready
          </p>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <SectionTitle icon="📅" title="Inspection Timeline" />
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <div>
                <p className="font-medium" style={{ color: '#D1D5DB' }}>Last Inspection: May 2023</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Graded 'Good' under previous framework</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-500 mt-0.5">→</span>
              <div>
                <p className="font-medium" style={{ color: '#D1D5DB' }}>Next Expected: Autumn 2026</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Under new 2025 EIF framework (report cards)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-amber-400 mt-0.5">⚠</span>
              <div>
                <p className="font-medium" style={{ color: '#D1D5DB' }}>Pre-inspection: 2 evidence gaps</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Attendance plan + Disadvantage gap plan outstanding</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1F2937' }}>
            <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#9CA3AF' }}>11 Ofsted Evaluation Areas (2025)</p>
            <div className="flex flex-wrap gap-1">
              {[
                'Inclusion', 'Curriculum & Teaching', 'Achievement',
                'Attendance & Behaviour', 'Personal Dev & Wellbeing',
                'Leadership & Governance', 'Safeguarding',
                'Early Years (if applicable)', 'Post-16 (if applicable)',
              ].map((a) => (
                <span key={a} className="text-xs rounded px-1.5 py-0.5" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLES: { id: Role; label: string; icon: string; description: string }[] = [
  { id: 'trust', label: 'Trust Lead', icon: '🏛️', description: 'Cross-school overview' },
  { id: 'headteacher', label: 'Headteacher', icon: '👩‍💼', description: 'Whole-school dashboard' },
  { id: 'head-of-year', label: 'Head of Year', icon: '📚', description: 'Year group data' },
  { id: 'teacher', label: 'Teacher', icon: '🧑‍🏫', description: 'Class-level insights' },
  { id: 'sen', label: 'SEN / SENCO', icon: '🧩', description: 'SEND register & white paper' },
  { id: 'safeguarding', label: 'Safeguarding', icon: '🛡️', description: 'DSL dashboard' },
  { id: 'pupil-premium', label: 'Pupil Premium', icon: '⭐', description: 'Disadvantage & PP spend' },
  { id: 'inspections', label: 'Inspections', icon: '🔍', description: 'Ofsted readiness (2025)' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [hasData, setHasData] = useState<boolean | null>(null)
  const params = useParams()
  const slug = params?.slug as string
  const [activeRole, setActiveRole] = useState<Role>('headteacher')

  useEffect(() => {
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/schools\/([^/]+)/)
    const slug = slugMatch?.[1] ?? 'school'
    setHasData(
      localStorage.getItem(`lumio_${slug}_insights_hasData`) === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  if (hasData === null) return null
  if (!hasData) return (
    <EmptyState
      pageName="insights"
      title="Set up your data to unlock Insights"
      description="Lumio Insights gives every role a tailored live view of your school. Upload your data or connect your MIS to get started."
      uploads={[
        { key: 'attendance', label: 'Upload Attendance Data (CSV)' },
        { key: 'assessment', label: 'Upload Assessment Results (CSV)' },
        { key: 'pupils', label: 'Upload Pupil Data (CSV)' },
        { key: 'mis', label: 'Connect MIS (Arbor / SIMS / Bromcom)' },
      ]}
    />
  )

  const roleView: Record<Role, React.ReactNode> = {
    trust: <TrustView />,
    headteacher: <HeadteacherView />,
    'head-of-year': <HeadOfYearView />,
    teacher: <TeacherView />,
    sen: <SENView />,
    safeguarding: <SafeguardingView />,
    'pupil-premium': <PupilPremiumView />,
    inspections: <InspectionsView />,
  }

  const activeRoleMeta = ROLES.find((r) => r.id === activeRole)!

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Insights</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{SCHOOL_NAME} · Select a role to view tailored insights</p>
      </div>

      {/* Role selector */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7280' }}>View insights as</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all"
              style={
                activeRole === role.id
                  ? { backgroundColor: '#0D9488', color: '#ffffff', borderColor: '#0D9488' }
                  : { backgroundColor: '#111318', color: '#9CA3AF', borderColor: '#1F2937' }
              }
            >
              <span>{role.icon}</span>
              <span>{role.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active role header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#0D9488' }}>
          {activeRoleMeta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white">{activeRoleMeta.label} View</h2>
          <p className="text-xs" style={{ color: '#6B7280' }}>{activeRoleMeta.description}</p>
        </div>
        <div className="text-xs shrink-0" style={{ color: '#6B7280' }}>
          Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Role content */}
      <div>{roleView[activeRole]}</div>
    </div>
  )
}
