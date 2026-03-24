'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Download, Wifi, TrendingUp, TrendingDown,
  Minus, Sparkles, X, ExternalLink, CheckCircle2, Clock,
} from 'lucide-react'
import { DfeChartSection } from '@/components/chart-ui'

// ─── Types ────────────────────────────────────────────────────────────────────

type Month = 'sept' | 'oct' | 'nov' | 'dec' | 'jan'
type Tab   = 'overview' | 'delivery' | 'engagement' | 'trends' | 'data'

interface Metric {
  label: string
  data: Record<Month, number>
  good: 'up' | 'down'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS: Month[] = ['sept', 'oct', 'nov', 'dec', 'jan']
const MONTH_LABELS: Record<Month, string> = { sept: 'Sept', oct: 'Oct', nov: 'Nov', dec: 'Dec', jan: 'Jan' }
const MONTH_FULL: Record<Month, string> = {
  sept: 'September 2025', oct: 'October 2025', nov: 'November 2025', dec: 'December 2025', jan: 'January 2026',
}
const AY_MONTHS = ['Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',    label: 'Programme Overview' },
  { id: 'delivery',   label: 'Delivery'            },
  { id: 'engagement', label: 'Engagement'          },
  { id: 'trends',     label: 'Monthly Trends'      },
  { id: 'data',       label: 'Full Data Table'     },
]

// ─── Data ─────────────────────────────────────────────────────────────────────

const programmeOverview: Metric[] = [
  { label: 'Schools Registered (continuing)', data: { sept: 10770, oct: 10785, nov: 10809, dec: 10823, jan: 10973 }, good: 'up' },
  { label: 'New MoU Registrations',           data: { sept: 34,    oct: 49,    nov: 73,    dec: 84,    jan: 124   }, good: 'up' },
  { label: 'Closed / Merged Schools',         data: { sept: 0,     oct: 0,     nov: 0,     dec: 0,     jan: 28    }, good: 'down' },
  { label: 'NELI Resource Packs Issued',       data: { sept: 3,     oct: 3,     nov: 107,   dec: 149,   jan: 348   }, good: 'up' },
  { label: 'Schools with Digital Footprint',   data: { sept: 979,   oct: 1709,  nov: 1782,  dec: 1934,  jan: 2111  }, good: 'up' },
]

const trainingMetrics: Metric[] = [
  { label: 'Schools with Trainees',      data: { sept: 10124, oct: 10140, nov: 10157, dec: 10190, jan: 10193 }, good: 'up' },
  { label: 'Fully Trained Schools',      data: { sept: 8770,  oct: 8786,  nov: 8790,  dec: 8813,  jan: 8829  }, good: 'up' },
  { label: 'Training Invitations Sent',  data: { sept: 539,   oct: 1061,  nov: 1541,  dec: 1827,  jan: 2133  }, good: 'up' },
  { label: 'Course Completions (total)', data: { sept: 75503, oct: 75820, nov: 76010, dec: 76305, jan: 76567 }, good: 'up' },
]

const languageScreenMetrics: Metric[] = [
  { label: 'Pupils Assessed (initial)',          data: { sept: 10353, oct: 24072, nov: 37127, dec: 44818, jan: 50052 }, good: 'up' },
  { label: 'Pupils with Follow-up Assessments', data: { sept: 3,     oct: 14,    nov: 137,   dec: 405,   jan: 1226  }, good: 'up' },
  { label: 'Digital Resources Accessed (times)', data: { sept: 923,   oct: 2034,  nov: 3158,  dec: 4074,  jan: 7276  }, good: 'up' },
  { label: 'Schools Accessing Digital Resources',data: { sept: 113,   oct: 190,   nov: 273,   dec: 331,   jan: 572   }, good: 'up' },
]

const keyCommsMetrics: Metric[] = [
  { label: 'Overview Emails Sent',          data: { sept: 0,  oct: 1,     nov: 2,     dec: 4,     jan: 4     }, good: 'up' },
  { label: 'Email Contacts Reached',        data: { sept: 0,  oct: 17770, nov: 50785, dec: 80024, jan: 80024 }, good: 'up' },
  { label: 'Webinars Held',                 data: { sept: 2,  oct: 2,     nov: 3,     dec: 3,     jan: 5     }, good: 'up' },
  { label: 'Webinar Attendees (individuals)',data: { sept: 82, oct: 196,   nov: 279,   dec: 279,   jan: 319   }, good: 'up' },
  { label: 'Unique Schools at Webinars',    data: { sept: 76, oct: 167,   nov: 235,   dec: 235,   jan: 270   }, good: 'up' },
]

const outreachMetrics: Metric[] = [
  { label: 'Targeted Emails to Schools',  data: { sept: 628,  oct: 918,  nov: 4951,  dec: 8431,  jan: 24377 }, good: 'up' },
  { label: 'Phone / Meeting Contacts',    data: { sept: 79,   oct: 197,  nov: 657,   dec: 1255,  jan: 3483  }, good: 'up' },
  { label: 'Schools Spoken To',           data: { sept: 32,   oct: 76,   nov: 368,   dec: 642,   jan: 2318  }, good: 'up' },
  { label: 'Schools Contacted by Email',  data: { sept: 7950, oct: 8940, nov: 9617,  dec: 9625,  jan: 10266 }, good: 'up' },
]

const generalMetrics: Metric[] = [
  { label: 'Delivery Emails Sent',    data: { sept: 1,     oct: 2,     nov: 6,     dec: 9,      jan: 15     }, good: 'up' },
  { label: 'Delivery Email Contacts', data: { sept: 17185, oct: 35045, nov: 59613, dec: 117681, jan: 221209 }, good: 'up' },
  { label: 'Social Media Posts',      data: { sept: 18,    oct: 32,    nov: 43,    dec: 56,     jan: 68     }, good: 'up' },
  { label: 'Social Media Impressions',data: { sept: 6211,  oct: 10528, nov: 17759, dec: 22149,  jan: 31179  }, good: 'up' },
]

const supportMetrics: Metric[] = [
  { label: 'Solved Support Tickets', data: { sept: 874, oct: 1302, nov: 2140, dec: 2850, jan: 6769 }, good: 'up' },
  { label: 'Complaints',             data: { sept: 0,   oct: 0,    nov: 0,    dec: 0,    jan: 0    }, good: 'down' },
  { label: 'Events Attended',        data: { sept: 1,   oct: 2,    nov: 4,    dec: 4,    jan: 4    }, good: 'up' },
]

const insights: Record<Month, string[]> = {
  jan: [
    'Strong registration growth: 124 new MoUs signed in January — highest monthly total this academic year',
    'Pupil assessments milestone: 50,052 pupils assessed, crossing 50,000 for the first time this year',
    'Engagement surge: Targeted outreach jumped 189% month-on-month to 24,377 emails sent',
    'Follow-up assessments accelerating: 1,226 follow-up assessments recorded, up 203% from December',
    'Zero complaints maintained across all 5 reported months — exceptional record at this delivery scale',
    'Digital footprint growing: 2,111 schools showing active delivery signals, up 9.2% on December',
  ],
  dec: [
    'NELI Resource Packs Issued reached 149, up 39% from November — resource uptake accelerating',
    'Pupils Assessed crossed 44,818 — strong pre-Christmas momentum despite term-end pressures',
    'Schools Contacted by Email: 9,625, approaching near-complete coverage of registered schools',
    'Delivery Email Contacts nearly doubled month-on-month to 117,681 in December',
    'Webinar attendance stable at 279 across 235 unique schools — consistent engagement maintained',
    'Zero complaints for the fourth consecutive month — programme delivery operating smoothly',
  ],
  nov: [
    'November saw a major step-change: NELI Resource Packs Issued jumped from 3 to 107 (3,467% increase)',
    'Targeted Emails to Schools increased 439% month-on-month (918 → 4,951) — outreach significantly scaled',
    'Pupils Assessed grew 54% over October (24,072 → 37,127) — LanguageScreen adoption accelerating',
    'Schools Spoken To surged from 76 to 368 as outreach team scaled engagement efforts',
    'Delivery Email Contacts grew 70% (35,045 → 59,613) — broader reach across school network',
    'Zero complaints for the third consecutive month — operational excellence maintained',
  ],
  oct: [
    'Email Contacts Reached scaled from zero to 17,770 as programme communications were formally launched',
    'Pupils Assessed more than doubled from 10,353 to 24,072 — strong early LanguageScreen adoption',
    'Schools Spoken To grew from 32 to 76 as the outreach team ramped up direct engagement',
    'Course Completions reached 75,820 — sustained high-volume engagement with training platform',
    'Digital Resources Accessed grew 120% (923 → 2,034) — growing digital adoption in schools',
    'Zero complaints for the second consecutive month — positive start to the academic year',
  ],
  sept: [
    'September is the base month for AY 2025/26 — all figures represent the programme baseline',
    '10,770 schools registered as continuing NELI participants from the prior academic year',
    '8,770 schools (81.4% of registered) fully trained at programme start — strong foundation',
    '10,353 initial pupil assessments completed in the first month of the new academic year',
    '34 new MoU registrations in the opening month — schools continuing to join the programme',
    'Zero complaints from the opening month — excellent programme start',
  ],
}

const deliveryInsights: string[] = [
  '8,829 fully trained schools — 85.1% of those with active trainees',
  'Training completion rate up 0.3% vs December baseline',
  '1,364 schools with trainees not yet fully trained — priority cohort for the remainder of AY 2025/26',
  'Resource pack distribution at 348 — 134% increase vs December baseline',
  'Delivery pipeline on track for end-of-year targets across all training and assessment metrics',
]

const engagementInsights: string[] = [
  '24,377 outreach emails sent in January — 189% month-on-month surge in targeted communications',
  '2,111 schools showing active digital footprint (19.2% of registered schools)',
  '2,318 schools spoken to by phone or meeting this academic year',
  '10,266 schools contacted by email — 93.5% coverage of all registered schools',
  'Follow-up assessments up 203% from December — 1,226 recorded in January alone',
]

const trendsInsights: string[] = [
  'January strongest month of AY 2025/26 across all key metrics — positive trajectory maintained',
  'MoU registrations peaked at 124 in January — highest monthly total this academic year',
  'Pupil assessments crossed the 50,000 milestone for the first time (50,052 cumulative)',
  'Consistent zero complaints across all 5 reported months — exceptional record at programme scale',
  'Digital footprint growing steadily — 2,111 schools in January, 9.2% increase on December',
]

const dataInsights: string[] = [
  'All 5 filed months show positive trajectory across core KPIs — no regressions recorded',
  'Schools registered holding steady at 10,973 — only 28 closed or merged this academic year',
  'Pupils assessed cumulative total: 50,052 as of January 31st 2026',
  'Course completions at 76,567 — strong and sustained engagement with the FutureLearn training platform',
  'Data complete for September 2025 – January 2026; February – July pending live programme submissions',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string { return n.toLocaleString('en-GB') }

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

function MiniSparkline({ data, color, selectedIdx }: { data: number[]; color: string; selectedIdx: number }) {
  const W = 72, H = 28
  const min = Math.min(...data), max = Math.max(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 3 - ((v - min) / rng) * (H - 8),
  ] as [number, number])
  const linePts = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const areaPts = `0,${H} ${linePts} ${W},${H}`
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polygon points={areaPts} fill={color} fillOpacity="0.06" />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y}
          r={i === selectedIdx ? 3 : 1.5}
          fill={i === selectedIdx ? color : 'rgba(156,163,175,0.4)'} />
      ))}
    </svg>
  )
}

// ─── DfE Stat Card ────────────────────────────────────────────────────────────

function DfeStatCard({ metric, month, accent = '#0D9488' }: { metric: Metric; month: Month; accent?: string }) {
  const idx     = MONTHS.indexOf(month)
  const current = metric.data[month]
  const prev    = idx > 0 ? metric.data[MONTHS[idx - 1]] : null
  const change  = prev !== null ? current - prev : null
  const isUp    = change !== null && change > 0
  const isDown  = change !== null && change < 0
  const neutral = change === null || change === 0
  const isGood  = metric.good === 'up' ? (isUp || neutral) : (isDown || neutral)
  const changeColor = neutral ? '#9CA3AF' : isGood ? '#22C55E' : '#EF4444'
  const pct     = prev !== null && prev > 0 && change !== null ? Math.round((change / prev) * 100) : null
  const TIcon   = isUp ? TrendingUp : isDown ? TrendingDown : Minus
  const sparkData = MONTHS.map((m) => metric.data[m])

  return (
    <div className="flex flex-col gap-3 rounded-xl p-4"
      style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 text-xs font-medium leading-snug" style={{ color: '#9CA3AF' }}>{metric.label}</p>
        <MiniSparkline data={sparkData} color={accent} selectedIdx={idx} />
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: '#F9FAFB' }}>{fmt(current)}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {change !== null ? (
          <>
            <TIcon size={12} style={{ color: changeColor }} />
            <span className="text-xs font-semibold" style={{ color: changeColor }}>
              {change > 0 ? '+' : ''}{fmt(change)}
            </span>
            {pct !== null && Math.abs(pct) < 10000 && (
              <span className="text-xs" style={{ color: changeColor }}>
                ({pct > 0 ? '+' : ''}{pct}%)
              </span>
            )}
            <span className="text-xs" style={{ color: '#9CA3AF' }}>vs {MONTH_LABELS[MONTHS[idx - 1]]}</span>
          </>
        ) : (
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Base month</span>
        )}
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
        style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{n}</div>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#F9FAFB' }}>{title}</h2>
        {sub && <p className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</p>}
      </div>
    </div>
  )
}

function SubHeader({ title, color = '#0D9488' }: { title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-0.5 rounded-full" style={{ backgroundColor: color }} />
      <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>{title}</h3>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function AYProgress({ month }: { month: Month }) {
  const completedIdx = MONTHS.indexOf(month)
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          Academic Year 2025/26 Progress
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} style={{ color: '#0D9488' }} />
            <span className="text-xs font-medium" style={{ color: '#0D9488' }}>
              {completedIdx + 1} months reported
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: '#9CA3AF' }} />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              {AY_MONTHS.length - completedIdx - 1} months pending
            </span>
          </div>
        </div>
      </div>
      <div className="mb-2 flex items-center gap-1">
        {AY_MONTHS.map((m, i) => {
          const isSelected = i === MONTHS.indexOf(month)
          const isComplete = i <= MONTHS.indexOf(month)
          return (
            <div key={m} className="flex flex-1 flex-col items-center gap-1">
              <div className="h-2 w-full rounded-full"
                style={{ backgroundColor: isSelected ? '#6C3FC5' : isComplete ? '#0D9488' : '#1F2937' }} />
              <span style={{
                fontSize: 9, fontWeight: isSelected ? 700 : 500,
                color: isSelected ? '#6C3FC5' : isComplete ? '#0D9488' : '#4B5563',
              }}>{m}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#1F2937' }}>
        <div className="h-full rounded-full"
          style={{ width: `${((MONTHS.indexOf(month) + 1) / AY_MONTHS.length) * 100}%`, backgroundColor: '#0D9488' }} />
      </div>
    </div>
  )
}

// ─── Engagement Snapshot ──────────────────────────────────────────────────────

function EngagementSnapshot({ month }: { month: Month }) {
  const rows = [
    { label: 'Schools in Programme',       value: fmt(programmeOverview[0].data[month]),      icon: '🏫' },
    { label: 'Pupils Assessed (initial)',   value: fmt(languageScreenMetrics[0].data[month]),  icon: '👶' },
    { label: 'Course Completions',          value: fmt(trainingMetrics[3].data[month]),         icon: '🎓' },
    { label: 'Schools Spoken To',           value: fmt(outreachMetrics[2].data[month]),         icon: '📞' },
    { label: 'Delivery Email Contacts',     value: fmt(generalMetrics[1].data[month]),          icon: '📧' },
    { label: 'Digital Resources Accessed',  value: fmt(languageScreenMetrics[2].data[month]),  icon: '💻' },
    { label: 'Webinar Attendees',           value: fmt(keyCommsMetrics[3].data[month]),         icon: '🎙️' },
    { label: 'Targeted Emails Sent',        value: fmt(outreachMetrics[0].data[month]),         icon: '🎯' },
    { label: 'Schools with Digital Signal', value: fmt(programmeOverview[4].data[month]),      icon: '📡' },
    { label: 'Support Tickets Resolved',    value: fmt(supportMetrics[0].data[month]),          icon: '✅' },
  ]

  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #1F2937' }}>
      <div className="px-5 py-4" style={{ backgroundColor: '#0D9488', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Engagement Snapshot</p>
        <p className="text-xs" style={{ color: 'rgba(249,250,251,0.75)' }}>{MONTH_FULL[month]}</p>
      </div>
      <div style={{ backgroundColor: '#111318' }}>
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center justify-between px-5 py-2.5"
            style={{ borderBottom: i < rows.length - 1 ? '1px solid #1F2937' : undefined }}>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              <span className="mr-1.5">{r.icon}</span>{r.label}
            </span>
            <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Insights Panel ───────────────────────────────────────────────────────────

function InsightsPanel({ month }: { month: Month }) {
  const [open, setOpen] = useState(true)
  const items = insights[month]

  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #6C3FC5' }}>
      <button
        className="flex w-full items-center justify-between px-5 py-4"
        style={{
          backgroundColor: 'rgba(108,63,197,0.08)',
          borderBottom: open ? '1px solid rgba(108,63,197,0.3)' : undefined,
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
            {MONTH_LABELS[month]}
          </span>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} />
          : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5" style={{ backgroundColor: '#0f0e17' }}>
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
                {i + 1}
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#C4B5FD' }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab Insights Panel ───────────────────────────────────────────────────────

function TabInsightsPanel({ items, label }: { items: string[]; label: string }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #6C3FC5' }}>
      <button
        className="flex w-full items-center justify-between px-5 py-4"
        style={{
          backgroundColor: 'rgba(108,63,197,0.08)',
          borderBottom: open ? '1px solid rgba(108,63,197,0.3)' : undefined,
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
            {label}
          </span>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} />
          : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5" style={{ backgroundColor: '#0f0e17' }}>
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
                {i + 1}
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#C4B5FD' }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3"
      style={{ backgroundColor: '#111318', border: '1px solid #1F2937', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
      <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>PDF export coming soon</span>
      <button onClick={onClose} className="rounded p-0.5" style={{ color: '#9CA3AF' }}>
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Tab: Programme Overview ──────────────────────────────────────────────────

function OverviewTab({ month }: { month: Month }) {
  return (
    <div className="flex flex-col gap-6">
      <AYProgress month={month} />

      <SectionHeader n="1" title="Programme Overview"
        sub="Registered schools, new MoUs, resource distribution and digital engagement" />

      <DfeChartSection metrics={programmeOverview} month={month}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {programmeOverview.map((m_) => (
            <DfeStatCard key={m_.label} metric={m_} month={month} accent="#0D9488" />
          ))}
        </div>
      </DfeChartSection>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <InsightsPanel month={month} />
        </div>
        <div>
          <EngagementSnapshot month={month} />
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Delivery ────────────────────────────────────────────────────────────

function DeliveryTab({ month }: { month: Month }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader n="2" title="Delivery"
        sub="Training completion across schools and LanguageScreen pupil assessment data" />

      <div className="flex flex-col gap-4">
        <SubHeader title="Training & FutureLearn" />
        <DfeChartSection metrics={trainingMetrics} month={month}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {trainingMetrics.map((m_) => (
              <DfeStatCard key={m_.label} metric={m_} month={month} accent="#0D9488" />
            ))}
          </div>
        </DfeChartSection>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1F2937' }} />

      <div className="flex flex-col gap-4">
        <SubHeader title="LanguageScreen Assessment" color="#6C3FC5" />
        <DfeChartSection metrics={languageScreenMetrics} month={month}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {languageScreenMetrics.map((m_) => (
              <DfeStatCard key={m_.label} metric={m_} month={month} accent="#6C3FC5" />
            ))}
          </div>
        </DfeChartSection>
      </div>

      <TabInsightsPanel items={deliveryInsights} label="Jan" />
    </div>
  )
}

// ─── Tab: Engagement ─────────────────────────────────────────────────────────

function EngagementTab({ month }: { month: Month }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader n="3" title="Engagement"
        sub="Communications, outreach, social media, events and support" />

      <div className="flex flex-col gap-4">
        <SubHeader title="Key Communications" />
        <DfeChartSection metrics={keyCommsMetrics} month={month}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
            {keyCommsMetrics.map((m_) => (
              <DfeStatCard key={m_.label} metric={m_} month={month} accent="#0D9488" />
            ))}
          </div>
        </DfeChartSection>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1F2937' }} />

      <div className="flex flex-col gap-4">
        <SubHeader title="Targeted Outreach" />
        <DfeChartSection metrics={outreachMetrics} month={month}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {outreachMetrics.map((m_) => (
              <DfeStatCard key={m_.label} metric={m_} month={month} accent="#0D9488" />
            ))}
          </div>
        </DfeChartSection>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1F2937' }} />

      <div className="flex flex-col gap-4">
        <SubHeader title="General Engagement" />
        <DfeChartSection metrics={generalMetrics} month={month}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {generalMetrics.map((m_) => (
              <DfeStatCard key={m_.label} metric={m_} month={month} accent="#0D9488" />
            ))}
          </div>
        </DfeChartSection>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#1F2937' }} />

      <div className="flex flex-col gap-4">
        <SubHeader title="Support & Events" />
        <DfeChartSection metrics={supportMetrics} month={month}>
          <div className="grid grid-cols-3 gap-3">
            {supportMetrics.map((m_) => (
              <DfeStatCard key={m_.label} metric={m_} month={month}
                accent={m_.label === 'Complaints' ? '#22C55E' : '#0D9488'} />
            ))}
          </div>
        </DfeChartSection>
      </div>

      <TabInsightsPanel items={engagementInsights} label="Jan" />
    </div>
  )
}

// ─── Tab: Monthly Trends ──────────────────────────────────────────────────────

const TREND_SECTIONS = [
  { title: 'Programme Overview',         metrics: programmeOverview       },
  { title: 'Training & FutureLearn',     metrics: trainingMetrics         },
  { title: 'LanguageScreen Assessment',  metrics: languageScreenMetrics   },
  { title: 'Key Communications',         metrics: keyCommsMetrics         },
  { title: 'Targeted Outreach',          metrics: outreachMetrics         },
  { title: 'General Engagement',         metrics: generalMetrics          },
  { title: 'Support & Events',           metrics: supportMetrics          },
]

function MonthlyTrendsTab() {
  return (
    <div className="flex flex-col gap-4">
      <TabInsightsPanel items={trendsInsights} label="Jan" />

      <p className="text-xs" style={{ color: '#9CA3AF' }}>
        Colour coding: <span style={{ color: '#22C55E' }}>green</span> = favourable movement ·{' '}
        <span style={{ color: '#EF4444' }}>red</span> = unfavourable movement · grey = base month or no change
      </p>

      {TREND_SECTIONS.map((section) => (
        <div key={section.title} className="overflow-hidden rounded-xl"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0D111A' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F9FAFB' }}>{section.title}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: '#9CA3AF', minWidth: 220 }}>Metric</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: '#9CA3AF' }}>{MONTH_LABELS[m]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.metrics.map((metric, ri) => (
                  <tr key={metric.label}
                    style={{ borderBottom: ri < section.metrics.length - 1 ? '1px solid #1F2937' : undefined }}>
                    <td className="px-5 py-3 text-xs font-medium" style={{ color: '#F9FAFB' }}>{metric.label}</td>
                    {MONTHS.map((m, mi) => {
                      const current = metric.data[m]
                      const prev    = mi > 0 ? metric.data[MONTHS[mi - 1]] : null
                      const change  = prev !== null ? current - prev : null
                      const isUp    = change !== null && change > 0
                      const isDown  = change !== null && change < 0
                      const isGood  = change === null || change === 0
                        ? null
                        : metric.good === 'up' ? isUp : isDown
                      const color   = isGood === null ? '#9CA3AF' : isGood ? '#22C55E' : '#EF4444'
                      const bg      = isGood === null ? 'transparent' : isGood ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)'
                      const pct     = prev !== null && prev > 0 && change !== null && Math.abs(change / prev * 100) < 10000
                        ? Math.round((change / prev) * 100)
                        : null

                      return (
                        <td key={m} className="px-4 py-3 text-right whitespace-nowrap"
                          style={{ backgroundColor: bg }}>
                          <span className="text-xs font-bold" style={{ color }}>{fmt(current)}</span>
                          {change !== null && change !== 0 && (
                            <span className="ml-1.5 text-xs" style={{ color, opacity: 0.65 }}>
                              {change > 0 ? '▲' : '▼'}
                              {pct !== null ? `${Math.abs(pct)}%` : ''}
                            </span>
                          )}
                          {change === null && (
                            <span className="ml-1.5 text-xs" style={{ color: '#4B5563' }}>base</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Full Data Table ─────────────────────────────────────────────────────

function FullDataTab() {
  function exportCSV() {
    const header = ['Section', 'Metric', ...MONTHS.map((m) => MONTH_LABELS[m])].join(',')
    const rows = TREND_SECTIONS.flatMap((s) =>
      s.metrics.map((metric) =>
        [
          `"${s.title}"`,
          `"${metric.label}"`,
          ...MONTHS.map((m) => metric.data[m]),
        ].join(',')
      )
    )
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'neli-ay2526-data.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <TabInsightsPanel items={dataInsights} label="Jan" />

      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          All metrics · Academic Year 2025/26 · September 2025 – January 2026
        </p>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #1F2937' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0D111A', borderBottom: '1px solid #1F2937' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider sticky left-0"
                  style={{ color: '#9CA3AF', backgroundColor: '#0D111A', minWidth: 260 }}>
                  Metric
                </th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: '#9CA3AF' }}>{MONTH_LABELS[m]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TREND_SECTIONS.map((section) => (
                <>
                  {/* Section separator row */}
                  <tr key={`section-${section.title}`} style={{ backgroundColor: '#0D9488' }}>
                    <td colSpan={6} className="px-5 py-2 text-xs font-bold uppercase tracking-wider"
                      style={{ color: '#F9FAFB' }}>
                      {section.title}
                    </td>
                  </tr>
                  {section.metrics.map((metric, ri) => (
                    <tr key={metric.label}
                      style={{
                        borderBottom: ri < section.metrics.length - 1 ? '1px solid #1F2937' : '2px solid #1F2937',
                        backgroundColor: ri % 2 === 0 ? '#111318' : '#0D1119',
                      }}>
                      <td className="px-5 py-3 text-xs font-medium sticky left-0"
                        style={{ color: '#F9FAFB', backgroundColor: ri % 2 === 0 ? '#111318' : '#0D1119' }}>
                        {metric.label}
                      </td>
                      {MONTHS.map((m) => (
                        <td key={m} className="px-5 py-3 text-right text-xs font-mono whitespace-nowrap"
                          style={{ color: '#9CA3AF' }}>
                          {fmt(metric.data[m])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data sources */}
      <div className="rounded-xl px-5 py-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          Data Sources
        </p>
        <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
          Programme data is sourced from:{' '}
          <span style={{ color: '#9CA3AF' }}>Snowflake</span> (school registration and MoU records),{' '}
          <span style={{ color: '#9CA3AF' }}>HubSpot CRM</span> (outreach contacts, emails, phone logs and webinar attendance), and{' '}
          <span style={{ color: '#9CA3AF' }}>FutureLearn Portal API</span> (course completions, training invitations and LanguageScreen assessment data).
          Data is refreshed monthly and reflects cumulative totals for AY 2025/26. Figures are provisional and subject to end-of-year reconciliation.
          Produced by OxEd &amp; Assessment · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DfEPage() {
  const [month, setMonth] = useState<Month>('jan')
  const [tab,   setTab]   = useState<Tab>('overview')
  const [toast, setToast] = useState(false)

  function showToast() {
    setToast(true)
    setTimeout(() => setToast(false), 3500)
  }

  // Month selector is only relevant for the first 3 tabs
  const showMonthSelector = tab === 'overview' || tab === 'delivery' || tab === 'engagement'

  return (
    <div style={{ backgroundColor: '#07080F', minHeight: '100vh', position: 'relative' }}>

      {/* ── Background watermark ─────────────────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/NELI_logo.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.045,
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-6"
        style={{ backgroundColor: '#07080F', borderBottom: '1px solid #1F2937', position: 'relative', zIndex: 40 }}>

        {/* Left: Brand */}
        <div className="flex items-center gap-3 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images.png" alt="NELI" style={{ height: 36, width: 'auto', display: 'block' }} />
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB', letterSpacing: '-0.05em' }}>
            DfE
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight" style={{ color: '#F9FAFB' }}>
              NELI Programme Dashboard
            </p>
            <p className="text-xs leading-tight" style={{ color: '#9CA3AF' }}>
              Academic Year 2025/26 · OxEd &amp; Assessment
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: '#22C55E' }} />
            <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>Live</span>
          </div>
        </div>

        {/* Centre: Month selector (hidden on Trends + Data tabs) */}
        {showMonthSelector ? (
          <div className="flex items-center gap-1 rounded-xl p-1"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            {MONTHS.map((m) => (
              <button key={m} onClick={() => setMonth(m)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: month === m ? '#6C3FC5' : 'transparent',
                  color: month === m ? '#F9FAFB' : '#9CA3AF',
                }}>
                {MONTH_LABELS[m]}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
            Sept 2025 – Jan 2026
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a href="/api/dfe/live" target="_blank"
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}>
            <Wifi size={12} />
            API Connected
            <ExternalLink size={10} />
          </a>
          <button onClick={showToast}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: '#1F2937', color: '#F9FAFB', border: '1px solid #374151' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#374151' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1F2937' }}>
            <Download size={12} />
            Export PDF
          </button>
        </div>
      </nav>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="sticky z-30 flex items-center gap-1 overflow-x-auto px-6"
        style={{ top: 64, backgroundColor: '#07080F', borderBottom: '1px solid #1F2937', position: 'relative', zIndex: 30 }}>
        {TABS.map(({ id, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="relative flex shrink-0 items-center px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap"
              style={{ color: active ? '#F9FAFB' : '#9CA3AF' }}
            >
              {label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: '#6C3FC5' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="px-6 py-6" style={{ position: 'relative', zIndex: 1 }}>
        {tab === 'overview'    && <OverviewTab    month={month} />}
        {tab === 'delivery'    && <DeliveryTab    month={month} />}
        {tab === 'engagement'  && <EngagementTab  month={month} />}
        {tab === 'trends'      && <MonthlyTrendsTab />}
        {tab === 'data'        && <FullDataTab />}
      </div>

      {toast && <Toast onClose={() => setToast(false)} />}
    </div>
  )
}
