'use client'

// NOTE: The (website)/layout.tsx renders a site-wide nav + footer.
// This page also renders a schools-specific footer as the final section.

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2, Users, Heart, Shield, BookOpen, GraduationCap,
  Sunrise, BarChart2, Check, AlertTriangle, Sparkles, FileText,
  ArrowRight, Twitter, Linkedin, Network, Layers,
} from 'lucide-react'

// ─── Hero Section ─────────────────────────────────────────────────────────────

type RoleDataEntry = {
  kpis: { label: string; value: string; color: string; trend?: string }[]
  chart: React.ReactNode
  feed: { icon: string; text: string; color: string }[]
  badges: { label: string; status: 'green' | 'amber' | 'info' }[]
}

/* ── SVG Chart helpers ─────────────────────────────────────────────────── */

function VerticalBarChart({ bars, maxVal }: { bars: { label: string; value: number; color?: string }[]; maxVal: number }) {
  const h = 90, barW = 20, gap = 6
  const totalW = bars.length * (barW + gap) - gap
  return (
    <svg viewBox={`0 0 ${totalW + 16} ${h + 22}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {bars.map((b, i) => {
        const barH = (b.value / maxVal) * h
        return (
          <g key={i}>
            <rect x={8 + i * (barW + gap)} y={h - barH} width={barW} height={barH} rx={3}
              fill={b.color || '#0D9488'} opacity={0.85} />
            <text x={8 + i * (barW + gap) + barW / 2} y={h + 14} textAnchor="middle"
              fill="#6B7280" fontSize="8" fontFamily="inherit">{b.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function HorizontalBarChart({ bars, maxVal }: { bars: { label: string; value: number; color: string; suffix?: string }[]; maxVal: number }) {
  const rowH = 22, labelW = 72, barMaxW = 100, totalH = bars.length * rowH + 4
  return (
    <svg viewBox={`0 0 ${labelW + barMaxW + 50} ${totalH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {bars.map((b, i) => {
        const barW = (b.value / maxVal) * barMaxW
        return (
          <g key={i}>
            <text x={labelW - 4} y={i * rowH + 15} textAnchor="end" fill="#9CA3AF" fontSize="9" fontFamily="inherit">{b.label}</text>
            <rect x={labelW} y={i * rowH + 4} width={barW} height={14} rx={3} fill={b.color} opacity={0.85} />
            <text x={labelW + barW + 4} y={i * rowH + 15} fill="#9CA3AF" fontSize="8" fontFamily="inherit">{b.suffix || b.value}</text>
          </g>
        )
      })}
    </svg>
  )
}

function DualBarChart({ groups }: { groups: { label: string; v1: number; v2: number }[]; maxVal?: number }) {
  const maxV = 12, top = 14, h = 56, barW = 14, gap = 36
  const totalW = Math.max(groups.length * gap + 60, 140)
  const totalH = top + h + 34
  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {/* target line */}
      <line x1={8} y1={top + h - (11 / maxV) * h} x2={totalW - 8} y2={top + h - (11 / maxV) * h}
        stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 2" opacity={0.5} />
      <text x={totalW - 6} y={top + h - (11 / maxV) * h - 3} fill="#F59E0B" fontSize="7" textAnchor="end">Target 11.0</text>
      {groups.map((g, i) => {
        const h1 = (g.v1 / maxV) * h, h2 = (g.v2 / maxV) * h
        const x = 16 + i * gap
        return (
          <g key={i}>
            <rect x={x} y={top + h - h1} width={barW} height={h1} rx={2} fill="#0D9488" opacity={0.85} />
            <text x={x + barW / 2} y={top + h - h1 - 3} textAnchor="middle" fill="#0D9488" fontSize="7">{g.v1}</text>
            <rect x={x + barW + 3} y={top + h - h2} width={barW} height={h2} rx={2} fill="#6366F1" opacity={0.7} />
            <text x={x + barW + 3 + barW / 2} y={top + h - h2 - 3} textAnchor="middle" fill="#6366F1" fontSize="7">{g.v2}</text>
            <text x={x + barW + 1} y={top + h + 12} textAnchor="middle" fill="#6B7280" fontSize="8">{g.label}</text>
          </g>
        )
      })}
      <g transform={`translate(8, ${top + h + 20})`}>
        <rect width={8} height={6} rx={1} fill="#0D9488" /><text x={12} y={6} fill="#6B7280" fontSize="7">Reading</text>
        <rect x={52} width={8} height={6} rx={1} fill="#6366F1" /><text x={64} y={6} fill="#6B7280" fontSize="7">Writing</text>
      </g>
    </svg>
  )
}

/* ── Role data ─────────────────────────────────────────────────────────── */

const ROLE_DATA: Record<string, RoleDataEntry> = {
  Headteacher: {
    kpis: [
      { label: 'Attendance', value: '93.9%', color: '#22C55E', trend: '↑0.4%' },
      { label: 'PP Gap', value: '−3.2', color: '#F59E0B' },
      { label: 'Open SG Cases', value: '1', color: '#EF4444' },
      { label: 'SATs Ready', value: '82%', color: '#22C55E' },
    ],
    chart: <VerticalBarChart bars={[
      { label: 'Yr1', value: 92 }, { label: 'Yr2', value: 94 }, { label: 'Yr3', value: 91 },
      { label: 'Yr4', value: 95 }, { label: 'Yr5', value: 96 }, { label: 'Yr6', value: 93 },
    ]} maxVal={100} />,
    feed: [
      { icon: '⚠️', text: 'DSL review overdue 2 days', color: '#EF4444' },
      { icon: '📋', text: 'EHCP review T.Morris due 15 Apr', color: '#F59E0B' },
      { icon: '✅', text: 'Y6 SATs 82% on track', color: '#22C55E' },
      { icon: '🍳', text: 'Breakfast club 47 booked', color: '#0D9488' },
    ],
    badges: [
      { label: 'Ofsted Ready ✓', status: 'green' },
      { label: 'SEND White Paper ✓', status: 'green' },
      { label: 'KCSIE 2024 ✓', status: 'green' },
    ],
  },
  SENCO: {
    kpis: [
      { label: 'Active EHCPs', value: '12', color: '#0D9488' },
      { label: 'Reviews Due', value: '4', color: '#F59E0B' },
      { label: 'ISPs Unsigned', value: '3', color: '#F59E0B' },
      { label: 'CAMHS Referrals', value: '3', color: '#EF4444' },
    ],
    chart: <HorizontalBarChart bars={[
      { label: 'T.Morris', value: 18, color: '#0D9488', suffix: '18wks' },
      { label: 'J.Ahmed', value: 12, color: '#F59E0B', suffix: '12wks' },
      { label: 'S.Patel', value: 6, color: '#EF4444', suffix: '6wks' },
    ]} maxVal={20} />,
    feed: [
      { icon: '🔴', text: 'S.Patel EHCP — 6 weeks remaining', color: '#EF4444' },
      { icon: '🟡', text: 'ISP sign-off pending × 3', color: '#F59E0B' },
      { icon: '🟢', text: 'White Paper Phase 1 complete', color: '#22C55E' },
      { icon: '📋', text: 'EP review booked 22 Apr', color: '#0D9488' },
    ],
    badges: [
      { label: 'White Paper Phase 1 ✓', status: 'green' },
      { label: 'Phase 2 In Progress', status: 'amber' },
      { label: 'ISP Tracker Live', status: 'info' },
    ],
  },
  DSL: {
    kpis: [
      { label: 'CP Cases', value: '2', color: '#EF4444' },
      { label: 'CiN', value: '1', color: '#F59E0B' },
      { label: 'Early Help', value: '3', color: '#0D9488' },
      { label: 'KCSIE Compliance', value: '94%', color: '#22C55E' },
    ],
    chart: <VerticalBarChart bars={[
      { label: 'Oct', value: 1 }, { label: 'Nov', value: 2 }, { label: 'Dec', value: 1 },
      { label: 'Jan', value: 3 }, { label: 'Feb', value: 2 }, { label: 'Mar', value: 1 },
    ]} maxVal={4} />,
    feed: [
      { icon: '🔴', text: 'CP Case — review due today', color: '#EF4444' },
      { icon: '🟡', text: 'Online safety audit due 12 May', color: '#F59E0B' },
      { icon: '🟡', text: 'SCR reviewed 3 days ago', color: '#F59E0B' },
      { icon: '🟢', text: '2 staff training renewals due', color: '#22C55E' },
    ],
    badges: [
      { label: 'KCSIE 2024 ✓', status: 'green' },
      { label: 'SCR Current ✓', status: 'green' },
      { label: 'Online Safety Audit Due', status: 'amber' },
    ],
  },
  Teacher: {
    kpis: [
      { label: 'Class Size', value: '28', color: '#0D9488' },
      { label: 'SEND Pupils', value: '3', color: '#F59E0B' },
      { label: 'Below Expected', value: '4', color: '#EF4444' },
      { label: 'Tasks Due', value: '3', color: '#F59E0B' },
    ],
    chart: <DualBarChart groups={[
      { label: 'Class', v1: 10.2, v2: 9.8 },
    ]} />,
    feed: [
      { icon: '🟡', text: '4 pupils below expected progress', color: '#F59E0B' },
      { icon: '📋', text: 'Assessment due 14 Apr', color: '#0D9488' },
      { icon: '🟢', text: 'EHCP strategy updated — L.Khan', color: '#22C55E' },
      { icon: '🟡', text: '3 tasks outstanding', color: '#F59E0B' },
    ],
    badges: [
      { label: 'SEND Support Plans ✓', status: 'green' },
      { label: 'Assessment Due 14 Apr', status: 'amber' },
      { label: 'Pupil Passport Ready', status: 'info' },
    ],
  },
  'Trust / MAT': {
    kpis: [
      { label: 'Schools', value: '6', color: '#0D9488' },
      { label: 'Trust Attendance', value: '94.1%', color: '#0D9488', trend: '↓0.2%' },
      { label: 'Amber RAG', value: '2', color: '#F59E0B' },
      { label: 'Budget Var.', value: '−£42k', color: '#EF4444' },
    ],
    chart: <HorizontalBarChart bars={[
      { label: 'Oakridge', value: 93.9, color: '#0D9488', suffix: '93.9%' },
      { label: 'Maple', value: 95.1, color: '#0D9488', suffix: '95.1%' },
      { label: 'Birchwood', value: 91.2, color: '#EF4444', suffix: '91.2%' },
      { label: 'Westfield', value: 94.7, color: '#0D9488', suffix: '94.7%' },
      { label: 'Crestview', value: 96.0, color: '#22C55E', suffix: '96.0%' },
      { label: 'Hillside', value: 92.8, color: '#F59E0B', suffix: '92.8%' },
    ]} maxVal={100} />,
    feed: [
      { icon: '🔴', text: 'Birchwood — 91.2%, intervention needed', color: '#EF4444' },
      { icon: '🟡', text: 'Hillside — SEND Phase 2 behind', color: '#F59E0B' },
      { icon: '🟢', text: '3/6 schools Ofsted Ready', color: '#22C55E' },
      { icon: '📊', text: 'Trust board report due 30 Apr', color: '#0D9488' },
    ],
    badges: [
      { label: '3/6 Ofsted Ready', status: 'green' },
      { label: 'SEND Phase 1 4/6', status: 'amber' },
      { label: 'Finance Dashboard Live', status: 'info' },
    ],
  },
  Governance: {
    kpis: [
      { label: 'Next Meeting', value: '24 Apr', color: '#0D9488' },
      { label: 'For Approval', value: '3', color: '#F59E0B' },
      { label: 'SIP On Track', value: '4/6', color: '#22C55E' },
      { label: 'Policies Overdue', value: '2', color: '#F59E0B' },
    ],
    chart: (() => {
      const items = [
        { label: 'Quality of Ed', pct: 90, color: '#22C55E' },
        { label: 'Behaviour', pct: 85, color: '#22C55E' },
        { label: 'SEND', pct: 55, color: '#F59E0B' },
        { label: 'Attendance', pct: 80, color: '#22C55E' },
        { label: 'Wellbeing', pct: 30, color: '#EF4444' },
        { label: 'Finance', pct: 75, color: '#22C55E' },
      ]
      const rowH = 20, labelW = 72, barMaxW = 90
      return (
        <svg viewBox={`0 0 ${labelW + barMaxW + 12} ${items.length * rowH + 4}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          {items.map((it, i) => (
            <g key={i}>
              <text x={labelW - 4} y={i * rowH + 14} textAnchor="end" fill="#9CA3AF" fontSize="8" fontFamily="inherit">{it.label}</text>
              <rect x={labelW} y={i * rowH + 4} width={barMaxW} height={12} rx={3} fill="#1F2937" />
              <rect x={labelW} y={i * rowH + 4} width={it.pct / 100 * barMaxW} height={12} rx={3} fill={it.color} opacity={0.85} />
            </g>
          ))}
        </svg>
      )
    })(),
    feed: [
      { icon: '📋', text: '3 agenda items pending approval', color: '#0D9488' },
      { icon: '🟡', text: '2 policies overdue review', color: '#F59E0B' },
      { icon: '🟢', text: 'Ofsted Nov 2023 — Good', color: '#22C55E' },
      { icon: '📊', text: 'Budget 98.2% spent to date', color: '#0D9488' },
    ],
    badges: [
      { label: 'Governor Portal ✓', status: 'green' },
      { label: 'SIP Tracker Live', status: 'info' },
      { label: 'Clerk Support Tools', status: 'info' },
    ],
  },
}

const ROLES = Object.keys(ROLE_DATA)

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  green:  { bg: 'rgba(34,197,94,0.1)',  text: '#22C55E', border: 'rgba(34,197,94,0.25)' },
  amber:  { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
  info:   { bg: 'rgba(13,148,136,0.1)', text: '#0D9488', border: 'rgba(13,148,136,0.25)' },
}

function HeroSection() {
  const [activeRole, setActiveRole] = useState('Headteacher')
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const data = ROLE_DATA[activeRole]

  const advance = useCallback(() => {
    setActiveRole(prev => {
      const idx = ROLES.indexOf(prev)
      return ROLES[(idx + 1) % ROLES.length]
    })
  }, [])

  useEffect(() => {
    if (paused) { intervalRef.current && clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(advance, 4000)
    return () => { intervalRef.current && clearInterval(intervalRef.current) }
  }, [paused, advance])

  const handleRoleClick = (role: string) => {
    setActiveRole(role)
    setPaused(true)
  }

  return (
    <section style={{ backgroundColor: '#07080F' }} className="pt-32 pb-24">
      <style>{`
        @keyframes heroFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes livePulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-12 items-center">

          {/* Left — copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}
            >
              <Building2 size={15} />
              Lumio for Schools
            </div>

            <h1
              className="font-black leading-tight mb-5"
              style={{ color: '#F9FAFB', fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}
            >
              The School Platform Built for Every Role
            </h1>

            <p className="text-xl leading-relaxed mb-8" style={{ color: '#9CA3AF' }}>
              From the headteacher&apos;s office to the SENCO&apos;s desk — Lumio gives every member of your team the data, tools and time-saving workflows they need. All in one place.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-5">
              <Link
                href="/schools/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', color: '#F9FAFB' }}
              >
                Start Free 14-Day Trial <ArrowRight size={15} />
              </Link>
              <a
                href="https://calendly.com/lumiocms/lumio-schools"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}
              >
                Book a Demo
              </a>
            </div>

            <p className="text-sm" style={{ color: '#6B7280' }}>
              ✓ 14-day free trial &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ GDPR compliant &nbsp;·&nbsp; ✓ UK data centres
            </p>
          </div>

          {/* Right — full mini-dashboard */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: '1px solid rgba(13,148,136,0.3)',
                boxShadow: '0 0 100px rgba(13,148,136,0.18), 0 0 40px rgba(13,148,136,0.08)',
                backgroundColor: '#111318',
                minHeight: 520,
              }}
            >
              {/* Title bar */}
              <div
                className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0D1117' }}
              >
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EF4444', opacity: 0.7 }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F59E0B', opacity: 0.7 }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22C55E', opacity: 0.7 }} />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md" style={{ backgroundColor: 'rgba(13,148,136,0.2)' }}>
                    <Building2 size={12} style={{ color: '#0D9488' }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Oakridge Primary · Insights</span>
                </div>
                <span
                  className="ml-auto text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#0D9488', animation: 'livePulse 2s ease-in-out infinite' }} />
                  Live
                </span>
              </div>

              {/* Content area */}
              <div className="p-4 flex flex-col gap-3">
                {/* Role tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                  {ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => handleRoleClick(role)}
                      className="text-[11px] px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all duration-200"
                      style={{
                        backgroundColor: activeRole === role ? '#0D9488' : 'transparent',
                        color: activeRole === role ? '#F9FAFB' : '#6B7280',
                        border: activeRole === role ? '1px solid #0D9488' : '1px solid #1F2937',
                        cursor: 'pointer',
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                {/* Animated content — fixed height so all tabs are identical */}
                <div key={activeRole} style={{ animation: 'heroFadeIn 0.15s ease-out', height: 320 }} className="flex flex-col gap-3">

                  {/* ZONE A — KPI cards */}
                  <div className="grid grid-cols-4 gap-2 shrink-0">
                    {data.kpis.map(kpi => (
                      <div key={kpi.label} className="rounded-lg p-2.5" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black leading-none" style={{ color: kpi.color }}>{kpi.value}</span>
                          {kpi.trend && (
                            <span className="text-[10px] font-semibold" style={{ color: kpi.trend.startsWith('↑') ? '#22C55E' : '#EF4444' }}>
                              {kpi.trend}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] mt-1 leading-tight" style={{ color: '#6B7280' }}>{kpi.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* ZONE B — Chart + Feed (fills remaining space, clipped) */}
                  <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
                    {/* Left — chart */}
                    <div className="rounded-lg p-3 flex flex-col overflow-hidden" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                      <p className="text-[10px] font-semibold mb-2 shrink-0" style={{ color: '#6B7280' }}>
                        {activeRole === 'Headteacher' && 'Attendance by Year Group'}
                        {activeRole === 'SENCO' && 'EHCP 20-Week Timeline'}
                        {activeRole === 'DSL' && 'Concern Log (Oct–Mar)'}
                        {activeRole === 'Teacher' && 'Reading vs Writing Attainment'}
                        {activeRole === 'Trust / MAT' && 'Cross-School Attendance'}
                        {activeRole === 'Governance' && 'SIP Priority Progress'}
                      </p>
                      <div className="flex-1 flex items-end min-h-0">{data.chart}</div>
                    </div>

                    {/* Right — feed */}
                    <div className="rounded-lg p-3 flex flex-col gap-2 overflow-hidden" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                      <p className="text-[10px] font-semibold shrink-0" style={{ color: '#6B7280' }}>Live Feed</p>
                      {data.feed.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs leading-none shrink-0 mt-0.5" style={{ fontSize: 11 }}>{item.icon}</span>
                          <span className="text-[11px] leading-snug" style={{ color: '#D1D5DB' }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ZONE C — Compliance badges (always at bottom) */}
                  <div className="flex gap-2 flex-wrap shrink-0 mt-auto pt-1">
                    {data.badges.map(badge => {
                      const c = BADGE_COLORS[badge.status]
                      return (
                        <span
                          key={badge.label}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                        >
                          {badge.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12" style={{ borderTop: '1px solid #1F2937' }}>
          {[
            { number: '8+ Hours', label: 'Saved per staff member, per week' },
            { number: '20 Roles', label: 'From admin to trust CEO, all covered' },
            { number: '2026 Ready', label: 'SEND White Paper & Ofsted 2025 compliant' },
            { number: '8am–6pm', label: 'Full wraparound childcare management' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black leading-none mb-2" style={{ color: '#0D9488' }}>{stat.number}</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features Section ─────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#0D9488' }}>What Lumio Does</p>
          <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Everything Your School Needs. Nothing You Don&apos;t.</h2>
        </div>

        {/* Feature 1 — Insights (Hero — full width) */}
        <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.4)', boxShadow: '0 0 40px rgba(13,148,136,0.08)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
              <Sparkles size={20} style={{ color: '#0D9488' }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0D9488' }}>Headline Feature</span>
          </div>
          <h3 className="text-2xl font-black mb-3" style={{ color: '#F9FAFB' }}>Role-Based Insights — One Dashboard, Every Perspective</h3>
          <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: '#9CA3AF' }}>
            Stop building spreadsheets. Lumio&apos;s Insights page gives every role in your school a tailored, live view of what matters to them — at the click of a button. No more chasing data. No more out-of-date reports. Just the right information, for the right person, right now.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { emoji: '🏛️', role: 'Trust Lead', detail: 'Cross-school performance table, flagged schools, SEND strategy compliance' },
              { emoji: '👩‍💼', role: 'Headteacher', detail: 'Attendance by year group, KS2 vs national, safeguarding cases, behaviour trends, budget status' },
              { emoji: '📚', role: 'Head of Year', detail: 'Year group attendance, at-risk pupils, intervention tracker, parent contact log' },
              { emoji: '🧑‍🏫', role: 'Teacher', detail: 'Class progress, SEND pupil strategies, assessment data, weekly task list' },
              { emoji: '🧩', role: 'SENCO', detail: 'EHCP pipeline with 20-week statutory countdown, ISP tracker, three-tier model, external agencies, White Paper compliance' },
              { emoji: '🛡️', role: 'DSL', detail: 'CP/CiN/LAC case management, KCSIE 2024 compliance, online safety audit, training matrix' },
              { emoji: '⭐', role: 'Pupil Premium', detail: 'Attainment gap trend, intervention impact, budget tracker' },
              { emoji: '🔍', role: 'Inspections', detail: 'Ofsted 2025 report card readiness across all 6 evaluation areas' },
            ].map(item => (
              <div key={item.role} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.15)' }}>
                <p className="text-lg mb-1">{item.emoji}</p>
                <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{item.role}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm italic" style={{ color: '#6B7280' }}>
              &ldquo;Headteachers report saving 3–4 hours per week on data gathering and report preparation alone.&rdquo;
            </p>
            <Link href="/demo/schools/oakridge-primary/insights"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              See it live <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Features 2–6 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Feature 2 — SEND & DSL */}
          <div className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
              <Heart size={20} style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>The Most Comprehensive SEND & Safeguarding Tool in Schools</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              Built around the 2026 SEND White Paper and KCSIE 2024 — Lumio is the only schools platform that turns the most complex compliance obligations into simple, actionable dashboards. From the 20-week EHCP statutory deadline to online safety filtering compliance — nothing falls through the cracks.
            </p>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {[
                '📄 EHCP Pipeline — 20-week statutory countdown per pupil, annual review scheduler',
                '🗂 ISP Tracker — Individual Support Plans, tier classification, parent sign-off (statutory Sept 2029)',
                '🏗️ Three-Tier Model — Universal, Targeted and Specialist aligned to the 2026 White Paper',
                '🔗 External Agencies — CAMHS, EP, SALT, OT referral tracker with wait times',
                '🛡️ DSL Case Management — CP, CiN, LAC, Early Help with social worker contacts',
                '💻 Online Safety — KCSIE 2024 filtering/monitoring review, incident log, curriculum tracker',
                '🎓 Training Matrix — whole-school safeguarding training with renewal alerts',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 mt-auto" style={{ backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>
                <span className="font-bold">1 in 5 pupils in England has SEND.</span> 74% of SENCOs say they don&apos;t have enough time. Lumio gives it back.
              </p>
            </div>
          </div>

          {/* Feature 3 — Students */}
          <div className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(108,63,197,0.15)' }}>
              <GraduationCap size={20} style={{ color: '#A78BFA' }} />
            </div>
            <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>Every Pupil. Every Detail. Every Role Can See What They Need.</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              Lumio&apos;s Students page is the single source of truth for every child in your school. From the pupil passport a supply teacher needs in 30 seconds, to the safeguarding chronology only the DSL can access — the right information reaches the right person, with the right permissions.
            </p>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {[
                '👤 Pupil Passport — strengths, support strategies, de-escalation notes in one shareable profile',
                '📊 Role-Based Table Views — switch between Teacher, SENCO, DSL, Pastoral and Admin instantly',
                '📈 Academic Tracking — reading age, book band, attainment by subject, assessment history',
                '🛡️ Safeguarding Flags — CP/CiN/LAC status visible to authorised staff only',
                '❤️ Medical & Dietary — medication schedules, allergies (EpiPen alerts), dietary requirements',
                '🏷️ Smart Flags — PP, SEND, LAC, FSM, EAL, Young Carer — filter and search instantly',
                '📅 Attendance — monthly bar chart, persistent absentee flag, authorised vs unauthorised split',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs italic mt-auto" style={{ color: '#6B7280' }}>
              &ldquo;No more emailing the SENCO for a pupil&apos;s strategies before a lesson. No more searching three systems for emergency contacts.&rdquo;
            </p>
          </div>

          {/* Feature 4 — Pre & After School */}
          <div className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
              <Sunrise size={20} style={{ color: '#F59E0B' }} />
            </div>
            <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>Wraparound Childcare Management — From Breakfast Register to HAF Holiday Club</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              Free breakfast clubs are now statutory for every primary school from April 2026 (Children&apos;s Wellbeing &amp; Schools Bill). Lumio makes you ready — with DfE grant tracking, live registers, staff:child ratio compliance, payment management and HAF programme tools all in one place.
            </p>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {[
                '🥣 Breakfast Club Register — live daily register, FSM tracking, DfE data return preparation',
                '🌅 After School Register — live collection log, who is in club, who has been collected and by whom',
                '💰 Payment Management — Tax-Free Childcare, Universal Credit, childcare vouchers, ParentPay',
                '📅 Bookings — regular and ad-hoc bookings, waiting list with SEND/FSM priority',
                '👥 Staff & Ratios — Ofsted compliance dashboard, 1:8 ratio checker, DBS tracking',
                '📋 DfE Grant Tracker — breakfast club grant allocation, termly data return checklist',
                '🏖️ Holiday Club & HAF — Easter and summer sessions, FSM-eligible pupils, LA HAF referrals',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 mt-auto" style={{ backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#FCD34D' }}>
                <span className="font-bold">The national rollout of free breakfast clubs begins April 2026.</span> Every primary school needs to be ready. Lumio makes it simple.
              </p>
            </div>
          </div>

          {/* Feature 5 — School Office */}
          <div className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
              <Building2 size={20} style={{ color: '#0D9488' }} />
            </div>
            <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>Cut Admin Time in Half. Give Your Office Team Their Day Back.</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              The average school office team spends 40% of their day on tasks that could be automated. Lumio handles the follow-up, the chasing, the letters and the data — so your team can focus on the people in front of them.
            </p>
            <div className="flex flex-col gap-2 flex-1">
              {[
                { text: 'Automated first-day absence alerts — texts triggered at 9:15am, no manual chasing' },
                { text: 'Bulk communications with read receipts — newsletters, letters, trip forms in one place' },
                { text: 'School census preparation — data validation, anomaly flagging, submission tracking' },
                { text: 'GDPR compliance — processing register, data requests, breach log' },
                { text: 'Governor meeting management — agendas, minutes, action tracker' },
                { text: 'Policy register with automated review reminders' },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <Check size={13} style={{ color: '#0D9488', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Feature 6 — Trust — full width */}
        <div className="rounded-2xl p-8 mt-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(96,165,250,0.12)' }}>
                <Network size={20} style={{ color: '#60A5FA' }} />
              </div>
              <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>Multi-Academy Trust? See Every School in One View.</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>
                Trust leads and CEOs get a cross-school dashboard showing attendance, attainment, SEND, safeguarding and budget — for every academy in the trust, side by side. Spot the school that needs support before it becomes a crisis.
              </p>
              <Link href="/schools/register" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#60A5FA' }}>
                Talk to us about trusts <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: BarChart2, color: '#60A5FA', text: 'Cross-school performance table with RAG flags' },
                { icon: Heart, color: '#EF4444', text: 'Trust-wide SEND compliance — White Paper Phase 1/2/3 readiness across all schools' },
                { icon: Shield, color: '#F59E0B', text: 'Ofsted readiness per school — mapped to the 2025 framework' },
                { icon: FileText, color: '#22C55E', text: 'Trust finance overview — budget vs actuals, overspend alerts' },
                { icon: Users, color: '#A78BFA', text: 'HR dashboard — vacancies, absence, SCR compliance across all schools' },
                { icon: Layers, color: '#6C3FC5', text: 'Trust project management — school improvement projects, capital works and policy rollouts tracked across every academy' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.text} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937' }}>
                    <Icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Social Proof Section ─────────────────────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Lumio has transformed how our SENCO works. The EHCP tracker alone saves her 4 hours a week — and we're actually confident we won't miss an annual review deadline.",
      title: 'Headteacher',
      school: 'Milton Keynes',
      initials: 'SH',
    },
    {
      quote: "The insights page is the first thing I open every morning. My attendance data, safeguarding cases and Pupil Premium gap — all on one screen. I used to spend an hour pulling this together.",
      title: 'Deputy Headteacher',
      school: 'Northamptonshire',
      initials: 'JW',
    },
    {
      quote: "The wraparound management tools are incredible. Our breakfast club register, DfE grant tracker and after school payments — all automated. Our admin team can't believe how much time it saves.",
      title: 'School Business Manager',
      school: 'Bedfordshire',
      initials: 'PS',
    },
  ]

  return (
    <section style={{ backgroundColor: '#07080F' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#0D9488' }}>Social Proof</p>
          <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>Trusted by Schools and Trusts Across England</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.initials} className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xl mb-3" style={{ color: '#F59E0B' }}>★★★★★</p>
              <p className="text-sm leading-relaxed italic mb-6 flex-1" style={{ color: '#D1D5DB' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full font-bold text-sm shrink-0"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{t.title}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{t.school}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Compliance Section ───────────────────────────────────────────────────────

function ComplianceSection() {
  const cards = [
    {
      title: 'Ofsted 2025',
      color: '#60A5FA',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.2)',
      points: ['New report card framework', '6 evaluation areas', '5-point scale', 'Evidence portfolio builder'],
    },
    {
      title: 'SEND White Paper 2026',
      color: '#A78BFA',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.2)',
      points: ['ISP templates', 'Three-tier model', 'Phase 1/2/3 checklists', 'Inclusion Strategy builder'],
    },
    {
      title: 'KCSIE 2024',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
      points: ['Online safety compliance', 'Filtering & monitoring', 'Training matrix', 'Records transfer tracker'],
    },
    {
      title: 'Free Breakfast Clubs',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
      points: ["Children's Wellbeing Bill", 'DfE grant tracker', 'Ofsted childcare register', 'HAF programme'],
    },
  ]

  return (
    <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#0D9488' }}>Compliance</p>
          <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Built for 2025 and 2026 Compliance</h2>
          <p style={{ color: '#9CA3AF' }}>Every major framework change in the next two years. Already in Lumio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map(card => (
            <div key={card.title} className="rounded-2xl p-7"
              style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}>
              <p className="text-base font-black mb-5" style={{ color: card.color }}>{card.title}</p>
              <ul className="flex flex-col gap-3">
                {card.points.map(pt => (
                  <li key={pt} className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                    <Check size={13} style={{ color: card.color, flexShrink: 0 }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Ofsted Section ───────────────────────────────────────────────────────────

function OfstedSection() {
  const areas = [
    { n: 1, title: 'Quality of Education', body: 'Curriculum intent, implementation and impact. Is your curriculum ambitious? Does it actually work?', color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)' },
    { n: 2, title: 'Behaviour & Attitudes', body: 'Conduct, attendance, attitudes to learning. Your attendance data, behaviour log and exclusions — all in one place.', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
    { n: 3, title: 'Personal Development', body: 'Character education, enrichment, wider opportunities. Evidence your PSHE, trips, clubs and extra-curricular offer.', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
    { n: 4, title: 'Leadership & Management', body: 'Vision, strategy, governance, staff wellbeing. Your SIP, SEF, governor minutes and budget — auto-populated.', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    { n: 5, title: 'Inclusion (NEW)', body: 'SEND provision, disadvantaged pupils, EAL, vulnerable groups. The new standalone area. The one schools are least prepared for.', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.35)' },
    { n: 6, title: 'Safeguarding', body: "Culture, records, training, DSL compliance. One failing here stops everything else. Lumio makes it watertight.", color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  ]

  const features = [
    'SEF Evidence Hub — auto-populated from your live Lumio data, mapped to all 6 evaluation areas',
    'Inspection-Ready Dashboard — everything an inspector asks for, available in one click on the day',
    'Attendance Data — year group breakdown, PA rate, trend over time, vs national — formatted for Ofsted',
    'Inclusion Evidence Pack — ISPs, EHCP reviews, three-tier model, TA deployment — all in one export',
    'Safeguarding Audit Trail — every concern logged, every action recorded, DSL training, SCR current',
    'Governor Minutes & SIP — live School Improvement Plan with RAG ratings and evidence per priority',
    'Behaviour & Exclusions Log — full chronological record with patterns analysis and intervention evidence',
    'Pre-Inspection Checklist — 47-point Lumio inspection readiness checker with live RAG status',
  ]

  return (
    <section className="py-24" style={{ backgroundColor: '#08090F', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#60A5FA' }}>Ofsted 2025</p>
          <h2 className="text-4xl font-black mb-5" style={{ color: '#F9FAFB' }}>
            Ofsted Ready. Every Time.<br />Not Just Inspection Time.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: '#9CA3AF' }}>
            The 2025 Education Inspection Framework changed everything. No more single overall grade. Six evaluation areas. A new 5-point scale. An Inclusion area scored separately for the first time. Schools that are data-ready will thrive. Schools that aren&apos;t will struggle. Lumio makes sure you&apos;re always ready.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Left — 6 evaluation areas */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#4B5563' }}>The New Ofsted 2025 Framework</p>
            <div className="grid grid-cols-1 gap-3">
              {areas.map(a => (
                <div key={a.title} className="rounded-xl p-4 flex gap-4" style={{ backgroundColor: a.bg, border: `1px solid ${a.border}` }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: a.color }}>
                    {a.n}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold mb-0.5" style={{ color: a.title.includes('NEW') ? a.color : '#F9FAFB' }}>{a.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{a.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Lumio features */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#4B5563' }}>What Lumio Does for Ofsted</p>
            <div className="flex flex-col gap-3">
              {features.map(f => (
                <div key={f} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 2 }} />
                  <p className="text-sm" style={{ color: '#D1D5DB' }}>{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Callout box */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: 'linear-gradient(135deg,rgba(13,148,136,0.18),rgba(15,118,110,0.1))', border: '1px solid rgba(13,148,136,0.35)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <p className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>The Inspection Window Is 48 Hours</p>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                Ofsted gives schools just one working day&apos;s notice. That&apos;s not enough time to gather evidence, brief staff, pull attendance data, compile safeguarding records and prepare your SEF. Unless it&apos;s all already live in Lumio. Schools using Lumio report spending less than 2 hours preparing for inspection — because every piece of evidence inspectors ask for is already there, current, and a click away.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '47', label: 'Point inspection readiness checklist' },
                { value: '2 hours', label: 'Average Lumio school prep time vs 2+ days' },
                { value: '6/6', label: 'Evaluation areas covered by Lumio evidence tools' },
              ].map(s => (
                <div key={s.label} className="text-center rounded-xl p-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <p className="text-2xl font-black mb-1" style={{ color: '#0D9488' }}>{s.value}</p>
                  <p className="text-xs leading-tight" style={{ color: '#9CA3AF' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/demo/schools/oakridge-primary/insights"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            See the Ofsted Readiness Dashboard <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </section>
  )
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Does Lumio replace our MIS (SIMS/Arbor/Bromcom)?',
      a: 'No — Lumio sits alongside your MIS as the workflow and automation layer. It automates the processes around your data, not the data itself.',
    },
    {
      q: 'Is Lumio GDPR compliant?',
      a: 'Yes. All data is stored in UK data centres, processed under GDPR, and we never share your data with third parties.',
    },
    {
      q: 'How quickly are you updating for SEND White Paper and Ofsted 2025?',
      a: 'We track every consultation and statutory change in real time. SEND White Paper Phase 1 features are already live. Ofsted 2025 report card readiness tools are in the app now.',
    },
    {
      q: 'How long does setup take?',
      a: 'Most schools are up and running within a week. We provide guided onboarding and all workflows are pre-built — no technical knowledge needed.',
    },
    {
      q: 'Can we add more staff users?',
      a: 'Yes — add as many staff as you need. Lumio is priced per school, not per user.',
    },
    {
      q: 'What happens after the free trial?',
      a: "We'll remind you 3 days before your trial ends. You can upgrade, downgrade or cancel at any time. No contracts, no lock-in.",
    },
  ]

  return (
    <section style={{ backgroundColor: '#07080F' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>Common questions.</h2>
        </div>

        <div className="max-w-3xl">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl mb-3 overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                style={{ cursor: 'pointer' }}
              >
                <span className="text-sm font-semibold pr-4" style={{ color: '#F9FAFB' }}>{faq.q}</span>
                <span className="text-lg shrink-0" style={{ color: '#0D9488' }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA Section ────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section
      className="py-24"
      style={{
        background: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(15,118,110,0.1))',
        borderTop: '1px solid rgba(13,148,136,0.2)',
        borderBottom: '1px solid rgba(13,148,136,0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-black mb-5" style={{ color: '#F9FAFB' }}>
          Ready to See What Lumio Can Do for Your School?
        </h2>
        <p className="text-lg mb-4 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
          Join schools across England using Lumio to save time, improve outcomes and stay ahead of compliance. Free 14-day trial. No credit card. Full demo data included — see every feature before you commit.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
          <Link
            href="/schools/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
            style={{ backgroundColor: '#F9FAFB', color: '#07080F' }}
          >
            Start Free Trial <ArrowRight size={16} />
          </Link>
          <a
            href="https://calendly.com/lumiocms/lumio-schools"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
            style={{ border: '1px solid #0D9488', color: '#0D9488' }}
          >
            Book a Demo
          </a>
        </div>
        <p className="text-xs" style={{ color: '#4B5563' }}>
          Used by primary schools, secondary schools and multi-academy trusts · GDPR compliant · UK-based support
        </p>
      </div>
    </section>
  )
}

// ─── Schools Footer ───────────────────────────────────────────────────────────

function SchoolsFooter() {
  const productLinks = [
    { label: 'Features', href: '#' },
    { label: 'Insights', href: '#' },
    { label: 'SEND & DSL', href: '#' },
    { label: 'Pricing', href: '/pricing' },
  ]
  const schoolLinks = [
    { label: 'Primary Schools', href: '#' },
    { label: 'Secondary Schools', href: '#' },
    { label: 'MAT & Trusts', href: '#' },
    { label: 'SEND', href: '#' },
  ]
  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'GDPR Statement', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
  ]

  return (
    <footer style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937' }} className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
                <Building2 size={16} style={{ color: '#0D9488' }} />
              </div>
              <span className="font-bold text-base" style={{ color: '#F9FAFB' }}>Lumio for Schools</span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6B7280' }}>
              Empowering school teams across England.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: '#111318', color: '#6B7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Product</p>
            {productLinks.map(l => (
              <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Schools</p>
            {schoolLinks.map(l => (
              <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Legal</p>
            {legalLinks.map(l => (
              <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                {l.label}
              </Link>
            ))}
          </div>

        </div>

        <div className="pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" style={{ borderTop: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#4B5563' }}>© Lumio 2025. All rights reserved. Lumio for Schools is a product of Lumio CMS Ltd.</p>
          <p className="text-xs" style={{ color: '#4B5563' }}>UK data centres · GDPR compliant · ICO registered</p>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <ComplianceSection />
      <OfstedSection />
      <FAQSection />
      <FinalCTASection />
      <SchoolsFooter />
    </>
  )
}
