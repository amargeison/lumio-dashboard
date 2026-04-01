'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  LayoutDashboard, Search, TrendingUp, FileText, Users,
  GraduationCap, BookOpen, FolderOpen, CalendarCheck, UserCheck,
  Shield, Database, Bell, ChevronRight, Settings, LogOut,
  Download, Loader2, Printer,
} from 'lucide-react'
import { T, PUPILS, ALERTS, neliPupils, neliAvgGain, classAvgI, classAvgE, getLight, lc, lb, ll } from '@/components/neli/neliData'
import {
  Dashboard, NELITracker, LanguageScreenPage, ClassesPage, ClassDetail, PupilDetail,
  Insights, TrustView, Training, TrainingCourses, TELTedTraining, Resources,
} from '@/components/neli/NELIComponents'

const LanguageScreenApp = dynamic(() => import('@/components/neli/LanguageScreenApp'), { ssr: false })

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Cell, ScatterChart, Scatter, ReferenceLine, ReferenceArea,
  ZAxis, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

// ─── Navigation ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview',       icon: LayoutDashboard, label: 'Overview' },
  { id: 'languagescreen', icon: Search,          label: 'LanguageScreen & NELI' },
  { id: 'insights',       icon: TrendingUp,      label: 'Insights' },
  { id: 'reports',        icon: FileText,         label: 'Reports' },
  { id: 'classes',        icon: Users,            label: 'Classes' },
  { id: 'training',       icon: GraduationCap,   label: 'Training' },
  { id: 'telted',         icon: BookOpen,         label: 'TEL TED Training' },
  { id: 'resources',      icon: FolderOpen,       label: 'Resources' },
  { id: 'attendance',     icon: CalendarCheck,    label: 'Attendance' },
  { id: 'staff',          icon: UserCheck,        label: 'Staff Management' },
  { id: 'safeguarding',   icon: Shield,           label: 'Safeguarding' },
  { id: 'missync',        icon: Database,         label: 'MIS Sync' },
]

// ─── Coming Soon ────────────────────────────────────────────────────────────

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: 40 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: T.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>🚧</span>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: T.navy, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>{title}</h2>
      <p style={{ fontSize: 14, color: T.muted, margin: 0, textAlign: 'center', maxWidth: 400 }}>
        This section is coming soon as part of the Lumio Schools platform.
      </p>
    </div>
  )
}

// ─── Reports Tab ────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { id: 'term-summary', name: 'End of Term NELI Summary', desc: 'Full cohort overview with band distribution and progress since September.', lastGen: '18 Mar 2026' },
  { id: 'pupil-progress', name: 'Pupil Progress Report', desc: 'Individual pupil language journey with score trajectory and next steps.', lastGen: '14 Mar 2026' },
  { id: 'at-risk', name: 'Cohort At-Risk Report', desc: 'All pupils below threshold with recommended actions and intervention status.', lastGen: '20 Mar 2026' },
  { id: 'subtest', name: 'Subtest Analysis Report', desc: 'School-wide breakdown across all 4 LanguageScreen subtests with comparisons.', lastGen: '12 Mar 2026' },
  { id: 'ofsted', name: 'Ofsted Evidence Pack', desc: 'Structured evidence of language intervention impact for inspection readiness.', lastGen: '10 Mar 2026' },
  { id: 'parent', name: 'Parent Communication Report', desc: 'Plain-English progress summaries for parent meetings and updates.', lastGen: '22 Mar 2026' },
  { id: 'svor', name: 'Simple View of Reading', desc: 'Two-dimensional view of language comprehension vs word decoding for all assessed pupils. Identifies pupils at risk across four quadrants.', lastGen: '' },
  { id: 'class-dashboard', name: 'Class Dashboard', desc: 'LanguageScreen results for all pupils showing first and last assessment scores with progress arrows. Identifies movement across the standard score range.', lastGen: '' },
]

const NARRATIVES: Record<string, string> = {
  'term-summary': `The Reception cohort at Parkside Primary has made strong progress in language development. The average LanguageScreen score has risen from ${classAvgI} to ${classAvgE}, representing a gain of +${Math.round((classAvgE - classAvgI) * 10) / 10} points — significantly above the national average gain of +4.2. Five pupils are enrolled on the NELI programme. NELI pupils have made accelerated progress with an average gain of +${neliAvgGain} points.`,
  'pupil-progress': 'Individual pupil tracking shows that all pupils have made measurable progress since their initial assessment in September. Five NELI pupils have shown the most significant gains, with Amara Johnson progressing from 62 to 80 (+18 points) — the highest individual gain in the cohort.',
  'at-risk': 'Two pupils are currently identified as at-risk with LanguageScreen scores below 85. Both are enrolled on the NELI programme and receiving additional speech and language support. Recommended actions include continuation of NELI sessions and increased 1:1 reading time.',
  'subtest': 'Subtest analysis reveals that Receptive Vocabulary is the weakest area across the cohort, whilst Listening Comprehension is the strongest. NELI pupils show a larger gap in Expressive Vocabulary.',
  'ofsted': "This evidence pack demonstrates the school's systematic approach to early language intervention. Impact data shows the programme is closing the gap between disadvantaged and non-disadvantaged pupils. This aligns with the EIF inspection framework's focus on cultural capital and curriculum intent.",
  'parent': "Your child has been assessed using LanguageScreen, a tool developed by Oxford University researchers. The assessment looks at four areas: understanding words, using words, grammar, and listening. Your child's teacher will share their individual results at the next parent meeting.",
  'svor': '',
  'class-dashboard': '',
}

/* ── SVoR scatter data ───────────────────────────────────────────────────── */
function buildSvorData() {
  return PUPILS.map((p: any) => {
    const x = Math.round((p.subscores.grammar + p.subscores.listening) / 2)
    const y = Math.round((p.subscores.recVocab + p.subscores.expVocab) / 2)
    const concern = x < 85 && y < 85 ? 'clear' : (x < 90 || y < 90) ? 'slight' : 'none'
    return { x, y, name: p.name, concern }
  })
}
const SVOR_COLORS: Record<string, string> = { none: '#15803D', slight: '#B45309', clear: '#B91C1C' }
function SvorDot(props: any) {
  const { cx, cy, payload } = props
  return <circle cx={cx} cy={cy} r={7} fill={SVOR_COLORS[payload.concern]} stroke="white" strokeWidth={1.5} />
}
function SvorTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: 'white', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, margin: '0 0 4px', color: T.navy }}>{d.name}</p>
      <p style={{ margin: '0 0 2px', color: T.text }}>Decoding: {d.x}</p>
      <p style={{ margin: '0 0 2px', color: T.text }}>Comprehension: {d.y}</p>
      <p style={{ margin: 0, color: SVOR_COLORS[d.concern], fontWeight: 600 }}>{d.concern === 'none' ? 'No concerns' : d.concern === 'slight' ? 'Slight concerns' : 'Clear concerns'}</p>
    </div>
  )
}

function SvorReport() {
  const data = buildSvorData()
  const typical = data.filter((d: any) => d.x >= 90 && d.y >= 90).length
  const langRisk = data.filter((d: any) => d.y < 90 && d.x >= 90).length
  const decRisk = data.filter((d: any) => d.x < 90 && d.y >= 90).length
  const dualRisk = data.filter((d: any) => d.x < 90 && d.y < 90).length
  const avgX = Math.round(data.reduce((s: number, d: any) => s + d.x, 0) / data.length * 10) / 10
  const avgY = Math.round(data.reduce((s: number, d: any) => s + d.y, 0) / data.length * 10) / 10
  const neliOnProg = PUPILS.filter((p: any) => p.neli).length

  const quadrant = (d: any) => d.x >= 90 && d.y >= 90 ? 'Typical' : d.x < 90 && d.y < 90 ? 'Dual Risk' : d.y < 90 ? 'Language Risk' : 'Decoding Risk'
  const sortOrder: Record<string, number> = { 'Dual Risk': 0, 'Language Risk': 1, 'Decoding Risk': 2, 'Typical': 3 }
  const sortedPupils = [...data].sort((a: any, b: any) => sortOrder[quadrant(a)] - sortOrder[quadrant(b)])
  const quadrantColor: Record<string, string> = { 'Typical': T.green, 'Language Risk': T.amber, 'Decoding Risk': T.amber, 'Dual Risk': T.red }
  const quadrantBg: Record<string, string> = { 'Typical': '#F0FDF4', 'Language Risk': '#FFFBEB', 'Decoding Risk': '#FFFBEB', 'Dual Risk': '#FEF2F2' }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Typical Skills', v: typical, c: T.green },
          { l: 'Language Risk', v: langRisk, c: T.amber },
          { l: 'Decoding Risk', v: decRisk, c: T.amber },
          { l: 'Dual Risk', v: dualRisk, c: T.red },
        ].map(k => (
          <div key={k.l} style={{ background: '#FAFAF8', borderRadius: 10, padding: 14, textAlign: 'center', borderTop: `3px solid ${k.c}` }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase', margin: '0 0 4px' }}>{k.l}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: k.c, margin: 0, fontFamily: 'Georgia, serif' }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{ background: '#FAFAF8', borderLeft: `4px solid ${T.navy}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
          The Simple View of Reading (SVoR) is a framework for assessing the reading ability of children. To become a fluent reader who understands what they read, two sets of skills are needed: language comprehension and word decoding. Together, these are the foundation for reading comprehension.
        </p>
        <p style={{ fontSize: 13, color: T.text, margin: '12px 0 0', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
          The SVoR graph below provides a two-dimensional view of combined Standard Scores for all pupils assessed with LanguageScreen (language comprehension) and ReadingScreen (word decoding). See individual pupil profiles for detailed results.
        </p>
      </div>

      {/* Scatter chart */}
      <div style={{ background: '#FAFAF8', borderRadius: 12, padding: 20, marginBottom: 24, position: 'relative' }}>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 30, right: 30, bottom: 40, left: 40 }}>
            {/* Quadrant fills */}
            <ReferenceArea x1={90} x2={135} y1={90} y2={135} fill="rgba(21,128,61,0.06)" />
            <ReferenceArea x1={65} x2={90} y1={90} y2={135} fill="rgba(29,78,216,0.06)" />
            <ReferenceArea x1={90} x2={135} y1={65} y2={90} fill="rgba(180,83,9,0.06)" />
            <ReferenceArea x1={65} x2={90} y1={65} y2={90} fill="rgba(185,28,28,0.06)" />
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD4" />
            <XAxis type="number" dataKey="x" domain={[65, 135]} ticks={[65,70,75,80,85,90,95,100,105,110,115,120,125,130,135]} tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Word Reading (Decoding)', position: 'bottom', offset: 10, style: { fontSize: 12, fill: T.navy, fontWeight: 600 } }} />
            <YAxis type="number" dataKey="y" domain={[65, 135]} ticks={[65,70,75,80,85,90,95,100,105,110,115,120,125,130,135]} tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Language Comprehension', angle: -90, position: 'left', offset: 10, style: { fontSize: 12, fill: T.navy, fontWeight: 600 } }} />
            <ZAxis range={[200, 200]} />
            <ReferenceLine x={90} stroke="#1D4ED8" strokeDasharray="6 3" strokeWidth={1.5} />
            <ReferenceLine y={90} stroke="#1D4ED8" strokeDasharray="6 3" strokeWidth={1.5} />
            <ReferenceLine x={100} stroke="#D1D5DB" strokeDasharray="3 3" />
            <ReferenceLine y={100} stroke="#D1D5DB" strokeDasharray="3 3" />
            <Tooltip content={<SvorTooltip />} />
            <Scatter data={data} shape={(props: any) => {
              const { cx, cy, payload } = props
              const initials = payload.name.split(' ').map((w: string) => w[0]).join('')
              return (
                <g>
                  <circle cx={cx} cy={cy} r={10} fill={SVOR_COLORS[payload.concern]} stroke="white" strokeWidth={2} />
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={7} fontWeight={700}>{initials}</text>
                </g>
              )
            }} />
          </ScatterChart>
        </ResponsiveContainer>
        {/* Quadrant labels */}
        <div style={{ position: 'absolute', top: 42, left: 70, fontSize: 11, color: '#1D4ED8', fontStyle: 'italic', textAlign: 'center', width: 130 }}>Poor reading skills</div>
        <div style={{ position: 'absolute', top: 42, right: 50, fontSize: 11, color: '#1D4ED8', fontStyle: 'italic', textAlign: 'center', width: 170 }}>Typical reading and<br/>language skills</div>
        <div style={{ position: 'absolute', bottom: 65, left: 70, fontSize: 11, color: '#1D4ED8', fontStyle: 'italic', textAlign: 'center', width: 170 }}>Poor reading and<br/>poor language skills</div>
        <div style={{ position: 'absolute', bottom: 65, right: 50, fontSize: 11, color: '#1D4ED8', fontStyle: 'italic', textAlign: 'center', width: 130 }}>Poor language skills</div>
        <div style={{ position: 'absolute', bottom: 48, left: 55, fontSize: 9, color: T.muted, fontWeight: 600 }}>Weak</div>
        <div style={{ position: 'absolute', bottom: 48, right: 38, fontSize: 9, color: T.muted, fontWeight: 600 }}>Strong</div>
        <div style={{ position: 'absolute', top: 28, left: 12, fontSize: 9, color: T.muted, fontWeight: 600 }}>Strong</div>
        <div style={{ position: 'absolute', bottom: 65, left: 16, fontSize: 9, color: T.muted, fontWeight: 600 }}>Weak</div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#15803D', display: 'inline-block' }} /> No concerns</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#B45309', display: 'inline-block' }} /> Slight concerns</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#B91C1C', display: 'inline-block' }} /> Clear concerns</span>
      </div>
      <p style={{ fontSize: 10, color: T.muted, textAlign: 'center', marginBottom: 24 }}>Age-expected threshold shown at 90. Grey lines indicate population mean (100).</p>

      {/* Pupil table */}
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: '#FAFAF8' }}>
            {['Pupil', 'Language', 'Decoding', 'Quadrant', 'Band', 'TEL TED', 'Trend'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', borderBottom: `2px solid ${T.border}` }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {sortedPupils.map((d: any) => {
              const q = quadrant(d)
              const p = PUPILS.find((pp: any) => pp.name === d.name) as any
              const band = getLight(p?.es || 0)
              return (
                <tr key={d.name} style={{ borderBottom: `1px solid ${T.border}`, background: quadrantBg[q] }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: T.text }}>{d.name}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: d.y < 90 ? T.red : T.green }}>{d.y}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: d.x < 90 ? T.red : T.green }}>{d.x}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: `${quadrantColor[q]}18`, color: quadrantColor[q] }}>{q}</span></td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: lb(band), color: lc(band) }}>{ll(band)}</span></td>
                  <td style={{ padding: '10px 12px' }}>{p?.neli ? <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: T.goldLight, color: T.gold }}>TEL TED</span> : <span style={{ color: T.muted }}>—</span>}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: p && p.es > p.is ? T.green : p && p.es < p.is ? T.red : T.muted }}>{p && p.es > p.is ? '↑' : p && p.es < p.is ? '↓' : '→'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Interpretation panel */}
      <div style={{ background: T.navy, borderRadius: 12, padding: 24, color: 'white' }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em', color: T.goldLight }}>Interpretation</h4>
        <p style={{ fontSize: 13, margin: 0, lineHeight: 1.8, opacity: 0.9 }}>
          {typical} pupils are performing in the typical range for both language comprehension and word decoding. {dualRisk} pupil{dualRisk !== 1 ? 's' : ''} show{dualRisk === 1 ? 's' : ''} dual risk across both areas and {dualRisk === 1 ? 'is a' : 'are'} priority candidate{dualRisk !== 1 ? 's' : ''} for TEL TED intervention. {neliOnProg} pupils are currently receiving TEL TED support this term. Average language comprehension score: {avgY}. Average decoding score: {avgX}.
        </p>
      </div>

      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <button onClick={() => window.print()} style={{ fontSize: 12, fontWeight: 600, padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'white', cursor: 'pointer', color: T.text }}>Download PDF</button>
      </div>
    </div>
  )
}

/* ── Class Dashboard ────────────────────────────────────────────────────── */
function ClassDashboardReport() {
  const [orderBy, setOrderBy] = useState('name')
  const [filter, setFilter] = useState('all')
  const [showInitial, setShowInitial] = useState(true)

  let filtered = [...PUPILS] as any[]
  if (filter === 'neli') filtered = filtered.filter((p: any) => p.neli)
  if (filter === 'atrisk') filtered = filtered.filter((p: any) => p.es < 90)

  const sorted = filtered.sort((a: any, b: any) => {
    if (orderBy === 'score-asc') return a.es - b.es
    if (orderBy === 'score-desc') return b.es - a.es
    if (orderBy === 'gain') return (b.es - b.is) - (a.es - a.is)
    return a.name.localeCompare(b.name)
  })

  const classAvg = Math.round(PUPILS.reduce((s: number, p: any) => s + p.es, 0) / PUPILS.length)
  const neliAvgI = Math.round(neliPupils.reduce((s: number, p: any) => s + p.is, 0) / neliPupils.length * 10) / 10
  const neliAvgE = Math.round(neliPupils.reduce((s: number, p: any) => s + p.es, 0) / neliPupils.length * 10) / 10
  const minScore = 65, maxScore = 135, range = maxScore - minScore
  const pct = (v: number) => ((v - minScore) / range) * 100
  const ticks = [65,70,75,80,85,90,95,100,105,110,115,120,125,130,135]
  const markerColor = (score: number) => score < 85 ? T.red : score < 90 ? T.amber : T.green

  // Zone bands
  const zones = [
    { from: 65, to: 75, bg: 'rgba(185,28,28,0.18)', label: 'Well Below' },
    { from: 75, to: 85, bg: 'rgba(185,28,28,0.10)', label: 'Below' },
    { from: 85, to: 90, bg: 'rgba(180,83,9,0.10)', label: 'Average' },
    { from: 90, to: 115, bg: 'rgba(21,128,61,0.06)', label: 'Above' },
    { from: 115, to: 135, bg: 'rgba(21,128,61,0.12)', label: 'Well Above' },
  ]

  // Subtest data
  const subtests = [
    { name: 'Receptive Vocabulary', key: 'recVocab' },
    { name: 'Expressive Vocabulary', key: 'expVocab' },
    { name: 'Grammar', key: 'grammar' },
    { name: 'Listening', key: 'listening' },
  ]

  // Priority lists
  const immediate = PUPILS.filter((p: any) => p.es < 85)
  const monitor = PUPILS.filter((p: any) => p.es >= 85 && p.es < 90)
  const neliThisWeek = PUPILS.filter((p: any) => p.neli)
  const onTrack = PUPILS.filter((p: any) => p.es >= 90 && !p.neli)

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'Total Assessed', v: PUPILS.length, c: T.navy },
          { l: 'Avg Initial', v: classAvgI.toFixed(1), c: T.muted },
          { l: 'Avg Current', v: classAvgE.toFixed(1), c: T.navy },
          { l: 'Avg Gain', v: `+${(classAvgE - classAvgI).toFixed(1)}`, c: T.green },
          { l: 'TEL TED Students', v: neliPupils.length, c: T.gold },
        ].map(k => (
          <div key={k.l} style={{ background: '#FAFAF8', borderRadius: 10, padding: 12, textAlign: 'center', borderTop: `3px solid ${k.c}` }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase', margin: '0 0 3px' }}>{k.l}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.c, margin: 0, fontFamily: 'Georgia, serif' }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={orderBy} onChange={e => setOrderBy(e.target.value)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'white', color: T.text }}>
          <option value="name">By first name</option>
          <option value="score-asc">By score (low→high)</option>
          <option value="score-desc">By score (high→low)</option>
          <option value="gain">By gain</option>
        </select>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'white', color: T.text }}>
          <option value="all">All pupils</option>
          <option value="neli">TEL TED only</option>
          <option value="atrisk">At risk only (&lt;90)</option>
        </select>
        <button onClick={() => setShowInitial(v => !v)} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: showInitial ? T.navy : 'white', color: showInitial ? 'white' : T.text, cursor: 'pointer', fontWeight: 600 }}>
          {showInitial ? 'Show initial & current' : 'Current only'}
        </button>
      </div>

      {/* Zone chart */}
      <div style={{ background: '#FAFAF8', borderRadius: 12, padding: '16px 20px', marginBottom: 8 }}>
        {sorted.map((p: any) => {
          const improved = p.es > p.is
          const same = p.es === p.is
          const gain = p.es - p.is
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, height: 28, transition: 'all 0.15s' }}
              onMouseEnter={(e: any) => { e.currentTarget.style.borderLeft = `3px solid ${T.gold}` }}
              onMouseLeave={(e: any) => { e.currentTarget.style.borderLeft = '3px solid transparent' }}>
              <div style={{ width: 180, flexShrink: 0, fontSize: 12, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                {p.name}
                {p.neli && <span style={{ fontSize: 9, fontWeight: 700, color: 'white', background: T.gold, borderRadius: 3, padding: '1px 4px', lineHeight: 1 }}>N</span>}
              </div>
              <div style={{ flex: 1, position: 'relative', height: 24 }}>
                {/* Zone backgrounds */}
                {zones.map(z => (
                  <div key={z.from} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(z.from)}%`, width: `${pct(z.to) - pct(z.from)}%`, background: z.bg }} />
                ))}
                <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 2, background: '#E2DDD4', borderRadius: 1, zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(90)}%`, width: 0, borderLeft: '1px dashed #B91C1C', zIndex: 2 }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(classAvg)}%`, width: 0, borderLeft: '1px dashed ${T.navy}', zIndex: 2 }} />
                {showInitial && !same && (
                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}>
                    <line x1={`${pct(p.is)}%`} y1="12" x2={`${pct(p.es)}%`} y2="12" stroke={improved ? T.green : '#9CA3AF'} strokeWidth={1.5} />
                  </svg>
                )}
                {showInitial && <div title={`${p.name}: Initial ${p.is}`} style={{ position: 'absolute', top: 7, left: `${pct(p.is)}%`, width: 10, height: 10, transform: 'translateX(-5px)', background: markerColor(p.is), borderRadius: 2, zIndex: 4 }} />}
                <div title={`${p.name}: Current ${p.es}`} style={{ position: 'absolute', top: 6, left: `${pct(p.es)}%`, width: 12, height: 12, transform: 'translateX(-6px)', background: markerColor(p.es), borderRadius: '50%', border: '2px solid white', zIndex: 5 }} />
                {gain > 2 && <span style={{ position: 'absolute', top: -2, left: `${pct(p.es)}%`, transform: 'translateX(-50%)', fontSize: 9, fontWeight: 700, color: T.green, zIndex: 6 }}>+{gain}</span>}
              </div>
            </div>
          )
        })}
        {/* Zone labels */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 4 }}>
          <div style={{ width: 180, flexShrink: 0 }} />
          <div style={{ flex: 1, position: 'relative', height: 14 }}>
            {zones.map(z => (
              <div key={z.label} style={{ position: 'absolute', left: `${pct(z.from)}%`, width: `${pct(z.to) - pct(z.from)}%`, textAlign: 'center', fontSize: 8, color: T.muted, fontWeight: 600 }}>{z.label}</div>
            ))}
          </div>
        </div>
        {/* X axis */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 2 }}>
          <div style={{ width: 180, flexShrink: 0 }} />
          <div style={{ flex: 1, position: 'relative', height: 24 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: '#9CA3AF' }} />
            {ticks.map(t => (
              <div key={t} style={{ position: 'absolute', left: `${pct(t)}%`, top: 0, transform: 'translateX(-50%)', textAlign: 'center' }}>
                <div style={{ width: 1, height: 4, background: '#9CA3AF', margin: '0 auto' }} />
                <span style={{ fontSize: 9, color: T.muted, display: 'block', marginTop: 1 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap', fontSize: 11, color: T.muted }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#9CA3AF', display: 'inline-block' }} /> Initial</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block' }} /> Current</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: T.red, display: 'inline-block' }} /> &lt;85</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: T.amber, display: 'inline-block' }} /> 85–89</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: T.green, display: 'inline-block' }} /> ≥90</span>
      </div>

      {/* Subtest breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {subtests.map(st => {
          const avg = Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores[st.key], 0) / PUPILS.length)
          const band = getLight(avg)
          const weakest = [...PUPILS].sort((a: any, b: any) => a.subscores[st.key] - b.subscores[st.key]).slice(0, 3)
          const redCount = PUPILS.filter((p: any) => getLight(p.subscores[st.key]) === 'red').length
          const amberCount = PUPILS.filter((p: any) => getLight(p.subscores[st.key]) === 'amber').length
          const greenCount = PUPILS.filter((p: any) => getLight(p.subscores[st.key]) === 'green').length
          const total = PUPILS.length
          return (
            <div key={st.key} style={{ background: 'white', borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.navy, margin: '0 0 6px' }}>{st.name}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: lc(band), margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>{avg}</p>
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${redCount / total * 100}%`, background: T.red }} />
                <div style={{ width: `${amberCount / total * 100}%`, background: T.amber }} />
                <div style={{ width: `${greenCount / total * 100}%`, background: T.green }} />
              </div>
              <p style={{ fontSize: 9, fontWeight: 700, color: T.muted, margin: '0 0 4px', textTransform: 'uppercase' }}>Weakest 3:</p>
              {weakest.map((w: any) => (
                <p key={w.id} style={{ fontSize: 10, color: T.red, margin: '0 0 1px' }}>{w.name.split(' ')[0]} ({w.subscores[st.key]})</p>
              ))}
            </div>
          )
        })}
      </div>

      {/* Cohort trend chart */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, marginBottom: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, margin: '0 0 12px' }}>Cohort Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={['Sep','Oct','Nov','Dec','Jan','Feb','Mar'].map((m, i) => ({
            month: m,
            all: Math.round((classAvgI + (classAvgE - classAvgI) * (i / 6)) * 10) / 10,
            neli: Math.round((neliAvgI + (neliAvgE - neliAvgI) * (i / 6)) * 10) / 10,
          }))} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD4" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.muted }} />
            <YAxis domain={[60, 110]} tick={{ fontSize: 10, fill: T.muted }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <ReferenceLine y={90} stroke={T.red} strokeDasharray="6 3" label={{ value: 'Threshold', position: 'right', fontSize: 9, fill: T.red }} />
            <ReferenceLine y={100} stroke={T.green} strokeDasharray="6 3" label={{ value: 'Age Expected', position: 'right', fontSize: 9, fill: T.green }} />
            <Area type="monotone" dataKey="all" stroke={T.navy} fill={T.navy} fillOpacity={0.08} strokeWidth={2} name="All Pupils" />
            <Area type="monotone" dataKey="neli" stroke={T.gold} fill={T.gold} fillOpacity={0.12} strokeWidth={2} name="TEL TED Students" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Priority action list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {immediate.length > 0 && (
          <div style={{ borderLeft: `4px solid ${T.red}`, borderRadius: 8, padding: '12px 16px', background: '#FEF2F2' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.red, margin: '0 0 6px' }}>🔴 Immediate attention (score &lt; 85)</p>
            {immediate.map((p: any) => <p key={p.id} style={{ fontSize: 12, color: T.text, margin: '0 0 2px' }}>{p.name} — <strong style={{ color: T.red }}>{p.es}</strong></p>)}
          </div>
        )}
        {monitor.length > 0 && (
          <div style={{ borderLeft: `4px solid ${T.amber}`, borderRadius: 8, padding: '12px 16px', background: '#FFFBEB' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.amber, margin: '0 0 6px' }}>🟡 Monitor closely (score 85–89)</p>
            {monitor.map((p: any) => <p key={p.id} style={{ fontSize: 12, color: T.text, margin: '0 0 2px' }}>{p.name} — <strong style={{ color: T.amber }}>{p.es}</strong></p>)}
          </div>
        )}
        <div style={{ borderLeft: `4px solid ${T.gold}`, borderRadius: 8, padding: '12px 16px', background: T.goldLight }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.gold, margin: '0 0 6px' }}>🌟 TEL TED students this week</p>
          {neliThisWeek.map((p: any) => <p key={p.id} style={{ fontSize: 12, color: T.text, margin: '0 0 2px' }}>{p.name} — Week {p.neliWeek || '—'} · {p.interventionist || '—'}</p>)}
        </div>
        <div style={{ borderLeft: `4px solid ${T.green}`, borderRadius: 8, padding: '12px 16px', background: T.greenBg }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.green, margin: '0 0 6px' }}>✅ On track (score ≥ 90, not on TEL TED)</p>
          <p style={{ fontSize: 12, color: T.text, margin: 0 }}>{onTrack.length} pupils meeting age-expected outcomes</p>
        </div>
      </div>

      {/* Print footer */}
      <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 16 }}>
        <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>Generated by <strong>Lumio Schools</strong> · OxEd & Assessment · TEL TED Programme · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  )
}

function ReportsPanel() {
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [filterTerm, setFilterTerm] = useState('full')
  const [filterClass, setFilterClass] = useState('all')

  function handleGenerate(report: any) {
    setSelectedReport(report); setGenerating(true); setPreview(null)
    setTimeout(() => { setGenerating(false); setPreview(report) }, 2000)
  }
  function handlePrint() {
    const s = document.createElement('style'); s.id = 'neli-print'
    s.textContent = '@media print{.neli-sidebar,.neli-report-left,.neli-header{display:none!important}.neli-report-preview{position:absolute!important;inset:0!important}select,button:not([data-print]){display:none!important}}'
    document.head.appendChild(s); window.print()
    setTimeout(() => document.getElementById('neli-print')?.remove(), 1000)
  }

  const kpis: Record<string, { l: string; v: string | number; c: string }[]> = {
    'term-summary': [{ l: 'Cohort Size', v: PUPILS.length, c: T.navy }, { l: 'Avg Score', v: classAvgE, c: T.green }, { l: 'NELI Pupils', v: neliPupils.length, c: T.gold }, { l: 'On Track', v: `${Math.round(PUPILS.filter((p: any) => p.es >= 85).length / PUPILS.length * 100)}%`, c: T.green }],
    'at-risk': [{ l: 'At Risk', v: PUPILS.filter((p: any) => p.es < 85).length, c: T.red }, { l: 'Monitor', v: PUPILS.filter((p: any) => p.es >= 85 && p.es < 96).length, c: T.amber }, { l: 'On NELI', v: PUPILS.filter((p: any) => p.es < 85 && p.neli).length, c: T.navy }, { l: 'Not on NELI', v: PUPILS.filter((p: any) => p.es < 85 && !p.neli).length, c: T.red }],
    'subtest': [{ l: 'Rec. Vocab', v: Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores.recVocab, 0) / PUPILS.length), c: T.navy }, { l: 'Exp. Vocab', v: Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores.expVocab, 0) / PUPILS.length), c: '#1D4ED8' }, { l: 'Grammar', v: Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores.grammar, 0) / PUPILS.length), c: T.green }, { l: 'Listening', v: Math.round(PUPILS.reduce((s: number, p: any) => s + p.subscores.listening, 0) / PUPILS.length), c: T.gold }],
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <div className="neli-report-left" style={{ width: 400, flexShrink: 0, borderRight: `1px solid ${T.border}`, overflowY: 'auto', padding: 20, background: '#FAFAF8' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>Report Library</h2>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Generate and download professional reports</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'white', color: T.text }}><option value="full">Full Year</option><option value="t1">Term 1</option><option value="t2">Term 2</option></select>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'white', color: T.text }}><option value="all">All Classes</option><option value="A">Class A</option><option value="B">Class B</option></select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REPORT_TYPES.map(r => (
            <div key={r.id} style={{ background: 'white', borderRadius: 10, padding: 16, border: `1px solid ${selectedReport?.id === r.id ? T.navy : T.border}` }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>{r.name}</h4>
              <p style={{ fontSize: 11, color: T.muted, margin: '0 0 8px', lineHeight: 1.5 }}>{r.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: T.muted }}>Last: {r.lastGen}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleGenerate(r)} style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: T.navy, color: 'white' }}>Generate</button>
                  <button onClick={handlePrint} style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border}`, cursor: 'pointer', background: 'white', color: T.text, display: 'flex', alignItems: 'center', gap: 4 }}><Download size={11} /> PDF</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="neli-report-preview" style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'white' }}>
        {!preview && !generating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.muted }}>
            <FileText size={48} style={{ color: T.border, marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Select a report to generate</p>
          </div>
        )}
        {generating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={36} style={{ color: T.navy, animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginTop: 16 }}>Generating report with AI...</p>
          </div>
        )}
        {preview && !generating && preview.id === 'svor' && (
          <SvorReport />
        )}
        {preview && !generating && preview.id === 'class-dashboard' && (
          <ClassDashboardReport />
        )}
        {preview && !generating && preview.id !== 'svor' && preview.id !== 'class-dashboard' && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ borderBottom: `3px solid ${T.navy}`, paddingBottom: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: T.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: T.gold }}>PP</div>
                  <div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: T.navy, margin: 0, fontFamily: 'Georgia, serif' }}>Parkside Primary</h1>
                    <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Oak Valley MAT</p>
                  </div>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '12px 0 4px', fontFamily: 'Georgia, serif' }}>{preview.name}</h2>
                <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.text, height: 'fit-content' }}><Printer size={14} /> Print</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {(kpis[preview.id] || kpis['term-summary']).map((k: any) => (
                <div key={k.l} style={{ background: '#FAFAF8', borderRadius: 10, padding: 14, textAlign: 'center', borderTop: `3px solid ${k.c}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase', margin: '0 0 4px' }}>{k.l}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: k.c, margin: 0, fontFamily: 'Georgia, serif' }}>{k.v}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#FAFAF8', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={['Sep','Oct','Nov','Dec','Jan','Feb','Mar'].map((m, i) => ({ month: m, school: Math.round((classAvgI + (classAvgE - classAvgI) * (i / 6)) * 10) / 10, national: Math.round((88 + i * 0.5) * 10) / 10 }))} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD4" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: T.muted }} /><YAxis domain={[78, 100]} tick={{ fontSize: 10, fill: T.muted }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="school" stroke={T.navy} strokeWidth={2.5} dot={{ r: 3 }} name="Parkside" />
                  <Line type="monotone" dataKey="national" stroke={T.muted} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="National" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#FAFAF8', borderRadius: 12, padding: 24, marginBottom: 24, borderLeft: `4px solid ${T.navy}` }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: T.navy, margin: '0 0 8px', textTransform: 'uppercase' }}>Analysis</h4>
              <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>{NARRATIVES[preview.id] || NARRATIVES['term-summary']}</p>
            </div>
            <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 16 }}>
              <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>Generated by <strong>Lumio Schools</strong> · Powered by <strong>OxEd & Assessment</strong> · NELI Programme · DfE Funded 2024–2029</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Portal ────────────────────────────────────────────────────────────

export default function NELIPortalPage() {
  const [page, setPage] = useState('overview')
  const [selectedPupil, setSelectedPupil] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => typeof window !== 'undefined' ? !sessionStorage.getItem('neli-welcomed') : false)
  const [assessingPupil, setAssessingPupil] = useState<any>(null)
  const [neliSubTab, setNeliSubTab] = useState<'dashboard' | 'languagescreen' | 'tracker'>('dashboard')
  const [insightsSubTab, setInsightsSubTab] = useState<'school' | 'network'>('school')
  const notifRef = useRef<HTMLDivElement>(null)

  // CSS animations are injected by the IIFE in NELIComponents on import
  useEffect(() => {
    if (showWelcome) {
      const t = setTimeout(() => { setShowWelcome(false); sessionStorage.setItem('neli-welcomed', '1') }, 6000)
      return () => clearTimeout(t)
    }
  }, [showWelcome])
  useEffect(() => {
    function handleClick(e: MouseEvent) { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNav(id: string) { setPage(id); setSelectedClass(null); setSelectedPupil(null); setNotifOpen(false) }
  const handleSelectPupil = (p: any) => { setSelectedPupil(p); setPage('pupil') }
  const handleSelectClass = (c: any) => { setSelectedClass(c); setPage('classdetail') }
  const pageLabel = NAV_ITEMS.find(n => n.id === page)?.label || 'Overview'

  function renderPage() {
    if (page === 'pupil' && selectedPupil) return <PupilDetail pupil={selectedPupil} onBack={() => { setPage(selectedClass ? 'classdetail' : 'languagescreen'); setSelectedPupil(null) }} />
    if (page === 'classdetail' && selectedClass) return <ClassDetail cls={selectedClass} onBack={() => { setPage('classes'); setSelectedClass(null) }} onSelectPupil={handleSelectPupil} />
    if (page === 'trainingcourses') return <TrainingCourses onBack={() => setPage('training')} staffName="Sarah Mitchell" />
    switch (page) {
      case 'overview': return <Dashboard onSelectPupil={handleSelectPupil} />
      case 'languagescreen': return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: '0 24px' }}>
            {([['dashboard', 'Dashboard'], ['languagescreen', 'LanguageScreen'], ['tracker', 'NELI Tracker']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setNeliSubTab(id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: neliSubTab === id ? T.navy : '#F3F0EA', color: neliSubTab === id ? 'white' : T.muted }}>{label}</button>
            ))}
          </div>
          {neliSubTab === 'dashboard' && <Dashboard onSelectPupil={handleSelectPupil} />}
          {neliSubTab === 'languagescreen' && <LanguageScreenPage onSelectPupil={handleSelectPupil} />}
          {neliSubTab === 'tracker' && <NELITracker />}
        </div>
      )
      case 'insights': return (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: '0 24px' }}>
            {([['school', 'School View'], ['network', 'Network View']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setInsightsSubTab(id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: insightsSubTab === id ? T.navy : '#F3F0EA', color: insightsSubTab === id ? 'white' : T.muted }}>{label}</button>
            ))}
          </div>
          {insightsSubTab === 'school' ? <Insights /> : <TrustView />}
        </div>
      )
      case 'reports': return <ReportsPanel />
      case 'classes': return <ClassesPage onSelectClass={handleSelectClass} onSelectPupil={handleSelectPupil} />
      case 'training': return <Training onStartTraining={() => setPage('trainingcourses')} />
      case 'telted': return <TELTedTraining onBack={() => setPage('training')} />
      case 'resources': return <Resources />
      case 'attendance': return <ComingSoonPage title="Attendance" />
      case 'staff': return <ComingSoonPage title="Staff Management" />
      case 'safeguarding': return <ComingSoonPage title="Safeguarding" />
      case 'missync': return <ComingSoonPage title="MIS Sync" />
      default: return <Dashboard onSelectPupil={handleSelectPupil} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', background: T.bg, overflow: 'hidden' }}>
      {/* Welcome Overlay */}
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'linear-gradient(135deg, #0C1A2E 0%, #1B3060 50%, #0C1A2E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, maxWidth: 700, padding: '0 24px' }}>
            <div className="neli-owlSlideIn" style={{ flexShrink: 0 }}>
              <svg width="140" height="140" viewBox="0 0 200 200">
                <ellipse cx="100" cy="130" rx="60" ry="50" fill="#8B5E3C" stroke="#4A3220" strokeWidth="2.5"/>
                <ellipse cx="100" cy="135" rx="45" ry="36" fill="#D4A574"/>
                <circle cx="100" cy="75" r="44" fill="#A0714F" stroke="#4A3220" strokeWidth="2.5"/>
                <ellipse cx="100" cy="80" rx="35" ry="32" fill="#F5DEB3"/>
                <circle cx="84" cy="72" r="14" fill="white" stroke="#4A3220" strokeWidth="1.5"/>
                <circle cx="116" cy="72" r="14" fill="white" stroke="#4A3220" strokeWidth="1.5"/>
                <circle cx="86" cy="72" r="7" fill="#2D1B0E"/><circle cx="118" cy="72" r="7" fill="#2D1B0E"/>
                <circle cx="88" cy="69" r="2.5" fill="white"/><circle cx="120" cy="69" r="2.5" fill="white"/>
                <path d="M93 86 L100 96 L107 86 Z" fill="#E8960C" stroke="#B87608" strokeWidth="1"/>
                <rect x="70" y="30" width="60" height="7" rx="2" fill="#1B3060"/>
                <polygon points="100,20 128,33 100,38 72,33" fill="#1B3060"/>
                <line x1="128" y1="33" x2="135" y2="46" stroke="#C8960C" strokeWidth="2"/>
                <circle cx="135" cy="48" r="3.5" fill="#C8960C"/>
                <circle cx="84" cy="72" r="17" fill="none" stroke="#333" strokeWidth="1.5"/>
                <circle cx="116" cy="72" r="17" fill="none" stroke="#333" strokeWidth="1.5"/>
                <line x1="101" y1="72" x2="99" y2="72" stroke="#333" strokeWidth="1.5"/>
                <rect x="60" y="115" width="28" height="35" rx="3" fill="#D4A574" stroke="#8B5E3C" strokeWidth="1.5"/>
                <rect x="64" y="122" width="20" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <rect x="64" y="127" width="16" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <rect x="64" y="132" width="18" height="2" rx="1" fill="#8B5E3C" opacity="0.5"/>
                <path d="M90 95 Q100 103 110 95" fill="none" stroke="#4A3220" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="neli-fadeIn" style={{ animationDelay: '0.3s' }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 12px', fontFamily: 'Georgia, serif' }}>Welcome back, Sarah! 👋</h1>
              <p style={{ fontSize: 15, color: '#8BA4C7', margin: '0 0 8px', lineHeight: 1.6 }}>You have <strong style={{ color: '#C8960C' }}>{PUPILS.filter((p: any) => p.attendance < 90 || p.es < 85).length} pupils</strong> who need attention today.</p>
              <p style={{ fontSize: 15, color: '#8BA4C7', margin: '0 0 24px', lineHeight: 1.6 }}>Amara Johnson is due for her LanguageScreen assessment.</p>
              <button onClick={() => { setShowWelcome(false); sessionStorage.setItem('neli-welcomed', '1') }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${T.gold}, #D4A020)`, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(200,150,12,0.4)' }}>
                Go to Dashboard <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LanguageScreen overlay */}
      {assessingPupil && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white' }}>
          <LanguageScreenApp studentName={assessingPupil.name} studentDob={assessingPupil.dob?.split('/').reverse().join('-') || '2020-01-01'} schoolName="Parkside Primary" assessorName="Sarah Mitchell" onClose={() => setAssessingPupil(null)} />
        </div>
      )}

      {/* Sidebar */}
      <aside className="neli-sidebar" style={{ width: 220, background: 'linear-gradient(180deg, #0C1A2E 0%, #0A1628 100%)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E2E45', background: '#0A1628' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <img src="/NELI_logo.png" alt="NELI" style={{ width: '100%', maxWidth: 172, height: 'auto', objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex' }} />
            <div style={{ display: 'none', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: 'white' }}>N</div>
              <div><p style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: 0 }}>NELI Portal</p><p style={{ fontSize: 10, color: '#8BA4C7', margin: 0 }}>OxEd & Assessment</p></div>
            </div>
            <p style={{ fontSize: 10, color: '#8BA4C7', margin: 0, letterSpacing: '0.04em' }}>School Portal</p>
          </div>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E2E45' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#8BA4C7', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Current School</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 2px' }}>🏫 Parkside Primary</p>
          <p style={{ fontSize: 11, color: '#8BA4C7', margin: 0 }}>Oak Valley MAT · Reception</p>
        </div>
        <div style={{ margin: '0 16px', height: 1, background: 'linear-gradient(90deg, transparent, #C8960C40, transparent)' }} />
        <nav style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const active = page === id || (page === 'classdetail' && id === 'classes') || (page === 'pupil' && id === 'languagescreen') || (page === 'trainingcourses' && id === 'training')
            return (
              <button key={id} onClick={() => handleNav(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: active ? '#1E3561' : 'transparent', color: active ? T.gold : '#8BA4C7', borderLeft: active ? `4px solid ${T.gold}` : '4px solid transparent', transition: 'all 0.15s ease' }}>
                <Icon size={16} style={{ flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{label}</span>
              </button>
            )
          })}
        </nav>
        <div style={{ margin: '0 16px', height: 1, background: 'linear-gradient(90deg, transparent, #C8960C40, transparent)' }} />
        <div style={{ padding: '12px 10px' }}>
          {[{ icon: Settings, label: 'Settings' }, { icon: LogOut, label: 'Sign Out' }].map(({ icon: Icon, label }) => (
            <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#8BA4C7', marginBottom: 2, fontSize: 12 }}><Icon size={15} /><span>{label}</span></button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="neli-header" style={{ height: 56, background: 'linear-gradient(180deg, white 0%, #FAFAF8 100%)', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}><h1 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>{page === 'pupil' && selectedPupil ? selectedPupil.name : page === 'classdetail' && selectedClass ? selectedClass.name : page === 'trainingcourses' ? 'FutureLearn Courses' : pageLabel}</h1></div>
          <div className="neli-pulseGlow" style={{ fontSize: 12, color: T.green, fontWeight: 700, background: T.greenBg, padding: '4px 12px', borderRadius: 20 }}>● DfE Funded 2024–2029</div>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={16} color={T.muted} className="neli-bellBounce" />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: T.red, border: '2px solid white' }} />
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', top: 42, right: 0, width: 300, background: 'white', border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Alerts</span>
                  <span style={{ fontSize: 11, color: T.muted }}>{ALERTS.length} active</span>
                </div>
                {ALERTS.map((a: any, i: number) => (
                  <div key={i} style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: a.type === 'red' ? T.red : T.amber }} />
                    <span style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{a.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>SM</div>
            <div><p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>Sarah Mitchell</p><p style={{ fontSize: 10, color: T.muted, margin: 0 }}>NELI Lead</p></div>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto' }}>{renderPage()}</main>
      </div>
    </div>
  )
}
