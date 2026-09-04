'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2, Printer, Download, ChevronRight, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ReferenceLine, ReferenceArea, ZAxis, AreaChart, Area, Cell,
} from 'recharts'
import { PUPILS, CLASSES, STAFF, neliPupils, neliAvgGain, classAvgI, classAvgE, getLight, lc, ll } from '@/components/neli/neliData'

// ─── Theme (TEL TED dark) ────────────────────────────────────────────────────
const C = {
  bg: '#111318', panel: '#0A0B10', border: '#1F2937', text: '#F9FAFB', body: '#D1D5DB', muted: '#9CA3AF', dim: '#6B7280', faint: '#4B5563',
  teal: '#0D9488', tealSoft: 'rgba(13,148,136,0.12)', green: '#22C55E', amber: '#F59E0B', red: '#EF4444', blue: '#60A5FA', purple: '#A78BFA', gold: '#FBBF24',
  greenSoft: 'rgba(34,197,94,0.12)', amberSoft: 'rgba(245,158,11,0.12)', redSoft: 'rgba(239,68,68,0.12)', blueSoft: 'rgba(96,165,250,0.12)',
}
const bandColor = (s: number) => s < 85 ? C.red : s < 90 ? C.amber : C.green
const bandSoft = (s: number) => s < 85 ? C.redSoft : s < 90 ? C.amberSoft : C.greenSoft
const bandLabel = (s: number) => s < 85 ? 'Needs Support' : s < 90 ? 'Monitor' : 'On Track'
const SCHOOL = 'Parkside Elementary'
const DISTRICT = 'Oak Valley District'
const GRADE = 'Kindergarten'
const today = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const us = (s: string) => s.replace(/\bpupils?\b/gi, m => m[0] === 'P' ? (m.endsWith('s') ? 'Students' : 'Student') : (m.endsWith('s') ? 'students' : 'student'))
const gain = (p: any) => p.es - p.is
const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length * 10) / 10 : 0
// Subtest scores in the shared dataset are September baselines; re-centre each student's profile on their current overall score
const sub = (p: any, key: string) => { const vals = Object.values(p.subscores) as number[]; return Math.round(p.subscores[key] + (p.es - vals.reduce((a, b) => a + b, 0) / vals.length)) }
const SUBTESTS = [
  { key: 'recVocab', name: 'Receptive Vocabulary', short: 'Rec. Vocab', desc: 'Understanding word meanings' },
  { key: 'expVocab', name: 'Expressive Vocabulary', short: 'Exp. Vocab', desc: 'Naming and describing' },
  { key: 'grammar', name: 'Sentence Repetition', short: 'Grammar', desc: 'Grammar and sentence structure' },
  { key: 'listening', name: 'Listening Comprehension', short: 'Listening', desc: 'Understanding spoken passages' },
] as const

// ─── Report catalogue ────────────────────────────────────────────────────────
export const TELTED_REPORT_TYPES = [
  { id: 'term-summary', name: 'End of Term TEL Ted Summary', desc: 'Full cohort overview with band distribution, subgroup gaps and progress since September.', lastGen: '18 Mar 2026', cat: 'Leadership' },
  { id: 'pupil-progress', name: 'Student Progress Report', desc: 'Individual student language journey with score trajectory, subtests and next steps.', lastGen: '14 Mar 2026', cat: 'Teacher' },
  { id: 'at-risk', name: 'Cohort At-Risk Report', desc: 'All students below threshold with recommended actions and intervention status.', lastGen: '20 Mar 2026', cat: 'Intervention' },
  { id: 'subtest', name: 'Subtest Analysis Report', desc: 'School-wide breakdown across all 4 LanguageScreen subtests with class comparisons.', lastGen: '12 Mar 2026', cat: 'Assessment' },
  { id: 'inspection', name: 'State Inspection Evidence Pack', desc: 'Structured evidence of language intervention impact for accountability and inspection readiness.', lastGen: '10 Mar 2026', cat: 'Leadership' },
  { id: 'parent', name: 'Parent Communication Report', desc: 'Plain-English progress summaries for parent conferences and updates.', lastGen: '22 Mar 2026', cat: 'Family' },
  { id: 'svor', name: 'Simple View of Reading', desc: 'Two-dimensional view of language comprehension vs word decoding for all assessed students.', lastGen: '', cat: 'Assessment' },
  { id: 'class-dashboard', name: 'Class Dashboard', desc: 'LanguageScreen results for all students showing first and last assessment scores with progress arrows.', lastGen: '', cat: 'Teacher' },
]

// ─── Shared primitives ───────────────────────────────────────────────────────
function Card({ children, style, title, sub }: { children: React.ReactNode; style?: React.CSSProperties; title?: string; sub?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16, ...style }}>
      {title && <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, marginBottom: sub ? 2 : 12 }}>{title}</h4>}
      {sub && <p style={{ fontSize: 11, color: C.dim, margin: '0 0 12px' }}>{sub}</p>}
      {children}
    </div>
  )
}
function Stat({ l, v, c, s }: { l: string; v: string | number; c: string; s?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderTop: `3px solid ${c}`, borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>{l}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: c, margin: 0, fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>{v}</p>
      {s && <p style={{ fontSize: 10, color: C.dim, margin: '4px 0 0' }}>{s}</p>}
    </div>
  )
}
function Stats({ items, cols }: { items: { l: string; v: string | number; c: string; s?: string }[]; cols?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols || items.length}, 1fr)`, gap: 10, marginBottom: 16 }}>{items.map(k => <Stat key={k.l} {...k} />)}</div>
}
function Pill({ children, color, soft }: { children: React.ReactNode; color: string; soft?: string }) {
  return <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: soft || `${color}22`, color, whiteSpace: 'nowrap' }}>{children}</span>
}
function Narrative({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ background: C.bg, borderLeft: `4px solid ${accent || C.teal}`, border: `1px solid ${C.border}`, borderLeftWidth: 4, borderLeftColor: accent || C.teal, borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <p style={{ fontSize: 13, color: C.body, margin: 0, lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>{children}</p>
    </div>
  )
}
function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr>{head.map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>{r.map((c, j) => <td key={j} style={{ padding: '8px 10px', color: C.body, verticalAlign: 'middle' }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
function Actions({ items, title }: { items: string[]; title?: string }) {
  return (
    <Card title={title || 'Recommended actions'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: C.body }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, background: C.tealSoft, color: C.teal, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ lineHeight: 1.6 }}>{a}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0A0B10', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      {label !== undefined && <p style={{ margin: '0 0 4px', fontWeight: 700, color: C.text }}>{label}</p>}
      {payload.map((p: any, i: number) => <p key={i} style={{ margin: 0, color: p.color || p.fill || C.body }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  )
}
const axis = { fontSize: 10, fill: C.dim }
const trend = (from: number, to: number, months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']) => months.map((m, i) => ({ month: m, v: Math.round((from + (to - from) * (i / (months.length - 1))) * 10) / 10 }))

// ─── 1. End of Term Summary ──────────────────────────────────────────────────
function TermSummaryReport() {
  const P = PUPILS as any[]
  const red = P.filter(p => p.es < 85), amber = P.filter(p => p.es >= 85 && p.es < 90), green = P.filter(p => p.es >= 90)
  const redI = P.filter(p => p.is < 85).length, amberI = P.filter(p => p.is >= 85 && p.is < 90).length, greenI = P.filter(p => p.is >= 90).length
  const fsm = P.filter(p => p.fsm), nonFsm = P.filter(p => !p.fsm), eal = P.filter(p => p.eal), nonEal = P.filter(p => !p.eal)
  const gapI = avg(nonFsm.map(p => p.is)) - avg(fsm.map(p => p.is)), gapE = avg(nonFsm.map(p => p.es)) - avg(fsm.map(p => p.es))
  const nonNeli = P.filter(p => !p.neli)
  const nonNeliGain = avg(nonNeli.map(gain))
  const neliAvgI = avg(neliPupils.map((p: any) => p.is)), neliAvgE = avg(neliPupils.map((p: any) => p.es))
  const dist = [
    { band: '<70', i: P.filter(p => p.is < 70).length, e: P.filter(p => p.es < 70).length },
    { band: '70–84', i: P.filter(p => p.is >= 70 && p.is < 85).length, e: P.filter(p => p.es >= 70 && p.es < 85).length },
    { band: '85–89', i: amberI, e: amber.length },
    { band: '90–99', i: P.filter(p => p.is >= 90 && p.is < 100).length, e: P.filter(p => p.es >= 90 && p.es < 100).length },
    { band: '100–109', i: P.filter(p => p.is >= 100 && p.is < 110).length, e: P.filter(p => p.es >= 100 && p.es < 110).length },
    { band: '110+', i: P.filter(p => p.is >= 110).length, e: P.filter(p => p.es >= 110).length },
  ]
  const byClass = CLASSES.map(c => { const ps = P.filter(p => p.class === c.id); return { ...c, n: ps.length, i: avg(ps.map(p => p.is)), e: avg(ps.map(p => p.es)), below: ps.filter(p => p.es < 90).length, neli: ps.filter(p => p.neli).length } })
  const trendData = trend(classAvgI, classAvgE).map((d, i) => ({ ...d, neli: trend(neliAvgI, neliAvgE)[i].v }))
  return (
    <>
      <Stats items={[
        { l: 'Students assessed', v: P.length, c: C.blue, s: `${CLASSES.length} classes · 100% coverage` },
        { l: 'Avg score Sept', v: classAvgI.toFixed(1), c: C.muted },
        { l: 'Avg score now', v: classAvgE.toFixed(1), c: C.teal },
        { l: 'Cohort gain', v: `+${(classAvgE - classAvgI).toFixed(1)}`, c: C.green, s: 'Standard score points' },
        { l: 'TEL Ted gain', v: `+${neliAvgGain}`, c: C.gold, s: `${neliPupils.length} students · vs +${nonNeliGain} non-TEL Ted` },
      ]} />
      <Narrative>
        The {GRADE} cohort at {SCHOOL} has made strong progress in oral language this year. The average LanguageScreen standard score has risen from <strong style={{ color: C.text }}>{classAvgI}</strong> in September to <strong style={{ color: C.text }}>{classAvgE}</strong> — a gain of +{(classAvgE - classAvgI).toFixed(1)} points against an expected age-related drift of 0. The number of students below the 85 threshold has fallen from {redI} to {red.length}, and {green.length} of {P.length} students ({Math.round(green.length / P.length * 100)}%) now sit within or above the average range. The {neliPupils.length} students on the TEL Ted: NELI Intervention have made accelerated progress with an average gain of +{neliAvgGain} points — {(neliAvgGain / Math.max(nonNeliGain, 0.1)).toFixed(1)}× the rate of their peers — consistent with the programme’s EEF-rated evidence base (+3 months additional progress).
      </Narrative>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Band distribution" sub="Number of students by standard score band — September vs now">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dist} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="band" tick={axis} /><YAxis tick={axis} allowDecimals={false} />
              <Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="i" name="September" fill={C.faint} radius={[3, 3, 0, 0]} />
              <Bar dataKey="e" name="Now" fill={C.teal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Cohort trajectory" sub="Average standard score by month">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={axis} /><YAxis domain={[65, 105]} tick={axis} />
              <Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={90} stroke={C.red} strokeDasharray="5 3" />
              <ReferenceLine y={100} stroke={C.green} strokeDasharray="5 3" />
              <Area type="monotone" dataKey="v" name="All students" stroke={C.blue} fill={C.blue} fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="neli" name="TEL Ted students" stroke={C.gold} fill={C.gold} fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Traffic-light summary" sub="Movement between bands since September">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[{ l: 'Needs Support (<85)', a: redI, b: red.length, c: C.red }, { l: 'Monitor (85–89)', a: amberI, b: amber.length, c: C.amber }, { l: 'On Track (90+)', a: greenI, b: green.length, c: C.green }].map(k => (
            <div key={k.l} style={{ background: `${k.c}14`, borderRadius: 10, padding: 14, borderLeft: `4px solid ${k.c}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: k.c, margin: '0 0 6px', textTransform: 'uppercase' }}>{k.l}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, fontFamily: 'Georgia, serif' }}>{k.a} <span style={{ color: C.dim, fontSize: 14 }}>→</span> {k.b}</p>
              <p style={{ fontSize: 10, color: C.muted, margin: '4px 0 0' }}>{k.b - k.a > 0 ? '+' : ''}{k.b - k.a} students since September</p>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Class comparison">
          <Table head={['Class', 'Teacher', 'N', 'Sept', 'Now', 'Gain', '<90', 'TEL Ted']} rows={byClass.map(c => [
            <strong style={{ color: C.text }}>{c.name.replace('Reception', 'Kindergarten')}</strong>, c.teacher, c.n, c.i, <strong style={{ color: C.teal }}>{c.e}</strong>, <span style={{ color: C.green, fontWeight: 700 }}>+{(c.e - c.i).toFixed(1)}</span>, c.below, c.neli,
          ])} />
        </Card>
        <Card title="Subgroup gaps" sub="Average standard score by group">
          <Table head={['Group', 'N', 'Sept', 'Now', 'Gain']} rows={[
            ['Economically disadvantaged', fsm.length, avg(fsm.map(p => p.is)), avg(fsm.map(p => p.es)), <span style={{ color: C.green, fontWeight: 700 }}>+{(avg(fsm.map(p => p.es)) - avg(fsm.map(p => p.is))).toFixed(1)}</span>],
            ['Not disadvantaged', nonFsm.length, avg(nonFsm.map(p => p.is)), avg(nonFsm.map(p => p.es)), <span style={{ color: C.green, fontWeight: 700 }}>+{(avg(nonFsm.map(p => p.es)) - avg(nonFsm.map(p => p.is))).toFixed(1)}</span>],
            ['English learners (EL)', eal.length, avg(eal.map(p => p.is)), avg(eal.map(p => p.es)), <span style={{ color: C.green, fontWeight: 700 }}>+{(avg(eal.map(p => p.es)) - avg(eal.map(p => p.is))).toFixed(1)}</span>],
            ['Non-EL', nonEal.length, avg(nonEal.map(p => p.is)), avg(nonEal.map(p => p.es)), <span style={{ color: C.green, fontWeight: 700 }}>+{(avg(nonEal.map(p => p.es)) - avg(nonEal.map(p => p.is))).toFixed(1)}</span>],
          ]} />
          <p style={{ fontSize: 11, color: C.muted, margin: '10px 0 0', lineHeight: 1.6 }}>Disadvantage gap narrowed from <strong style={{ color: C.text }}>{gapI.toFixed(1)}</strong> to <strong style={{ color: C.text }}>{gapE.toFixed(1)}</strong> points ({Math.round((1 - gapE / gapI) * 100)}% reduction).</p>
        </Card>
      </div>

      <Card title="TEL Ted: NELI Intervention — student outcomes">
        <Table head={['Student', 'Class', 'Sept', 'Now', 'Gain', 'Band', 'Week', 'Sessions', 'Interventionist']} rows={neliPupils.map((p: any) => [
          <strong style={{ color: C.text }}>{p.name}</strong>, p.class, p.is, <strong style={{ color: bandColor(p.es) }}>{p.es}</strong>, <span style={{ color: C.green, fontWeight: 700 }}>+{gain(p)}</span>, <Pill color={bandColor(p.es)} soft={bandSoft(p.es)}>{bandLabel(p.es)}</Pill>, `${p.neliWeek}/20`, `${p.neliSessions}/${p.neliExpected}`, p.interventionist,
        ])} />
      </Card>
      <Actions items={[
        `Continue TEL Ted: NELI Intervention to Week 20 for all ${neliPupils.length} enrolled students; schedule end-of-programme LanguageScreen reassessment for May.`,
        `${red.length} student${red.length === 1 ? ' remains' : 's remain'} below 85 — review SALT referral status and consider extending the 1:1 session component.`,
        `Roll TEL Ted: Whole Class to ${byClass.sort((a, b) => a.e - b.e)[0].name.replace('Reception', 'Kindergarten')} first — lowest current average (${byClass.sort((a, b) => a.e - b.e)[0].e}).`,
        'Share subgroup gap data with district leadership: disadvantage gap reduction is a headline outcome for the school improvement plan.',
        `Reassess ${amber.length} “Monitor” students at the next window to confirm they are not sliding below threshold over the summer.`,
      ]} />
    </>
  )
}

// ─── 2. Student Progress Report ──────────────────────────────────────────────
function StudentProgressReport() {
  const P = PUPILS as any[]
  const [id, setId] = useState<number>(P[0].id)
  const p = P.find(x => x.id === id) || P[0]
  const g = gain(p)
  const cls = CLASSES.find(c => c.id === p.class)
  const rank = [...P].sort((a, b) => gain(b) - gain(a)).findIndex(x => x.id === p.id) + 1
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
  const traj = months.map((m, i) => ({ month: m, score: Math.round((p.is + g * (i / 6)) * 10) / 10, cohort: Math.round((classAvgI + (classAvgE - classAvgI) * (i / 6)) * 10) / 10 }))
  const subs = SUBTESTS.map(s => ({ name: s.short, score: sub(p, s.key), cohort: avg(P.map(x => sub(x, s.key))) }))
  const weakest = [...SUBTESTS].sort((a, b) => sub(p, a.key) - sub(p, b.key))[0]
  const strongest = [...SUBTESTS].sort((a, b) => sub(p, b.key) - sub(p, a.key))[0]
  return (
    <>
      <div className="telted-no-print" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: C.dim, fontWeight: 600 }}>Student</span>
        <select value={id} onChange={e => setId(Number(e.target.value))} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text }}>
          {[...P].sort((a, b) => a.name.localeCompare(b.name)).map(x => <option key={x.id} value={x.id}>{x.name}{x.neli ? ' · TEL Ted' : ''}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          {neliPupils.map((x: any) => <button key={x.id} onClick={() => setId(x.id)} style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: `1px solid ${x.id === id ? C.gold : C.border}`, background: x.id === id ? `${C.gold}22` : 'transparent', color: x.id === id ? C.gold : C.muted, cursor: 'pointer' }}>{x.name.split(' ')[0]}</button>)}
        </div>
      </div>

      <Card style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.teal}, ${bandColor(p.es)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{p.name.split(' ').map((w: string) => w[0]).join('')}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0, fontFamily: 'Georgia, serif' }}>{p.name}</h3>
          <p style={{ fontSize: 12, color: C.muted, margin: '3px 0 6px' }}>{cls?.name.replace('Reception', 'Kindergarten')} · {cls?.teacher} · DOB {p.dob} · Attendance {p.attendance}%</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill color={bandColor(p.es)} soft={bandSoft(p.es)}>{bandLabel(p.es)}</Pill>
            {p.neli && <Pill color={C.gold}>TEL Ted: NELI · Week {p.neliWeek}/20</Pill>}
            {p.fsm && <Pill color={C.blue}>Economically disadvantaged</Pill>}
            {p.eal && <Pill color={C.purple}>English learner</Pill>}
            {p.sen?.status && p.sen.status !== 'None' && <Pill color={C.amber}>{p.sen.status}</Pill>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: 'uppercase', margin: 0 }}>Current score</p>
          <p style={{ fontSize: 34, fontWeight: 800, color: bandColor(p.es), margin: 0, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{p.es}</p>
          <p style={{ fontSize: 11, color: C.green, fontWeight: 700, margin: '4px 0 0' }}>{g >= 0 ? '+' : ''}{g} since Sept · #{rank} gain in cohort</p>
        </div>
      </Card>

      <Narrative accent={bandColor(p.es)}>
        {p.name.split(' ')[0]} started the year with a LanguageScreen standard score of {p.is} ({bandLabel(p.is).toLowerCase()}) and now scores {p.es}, a gain of {g} points{g >= neliAvgGain ? ' — well above the cohort average' : g >= (classAvgE - classAvgI) ? ' — above the cohort average' : ''}. {strongest.name} is the strongest area ({sub(p, strongest.key)}); {weakest.name} is the priority for support ({sub(p, weakest.key)}). {us(p.notes).replace(/NELI/g, 'TEL Ted')}
      </Narrative>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Score trajectory" sub="Standard score vs cohort average">
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={traj} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={axis} /><YAxis domain={[Math.min(60, p.is - 5), Math.max(110, p.es + 5)]} tick={axis} />
              <Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={90} stroke={C.red} strokeDasharray="5 3" /><ReferenceLine y={100} stroke={C.green} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="cohort" name="Cohort avg" stroke={C.faint} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="score" name={p.name.split(' ')[0]} stroke={C.teal} strokeWidth={3} dot={{ r: 3, fill: C.teal }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Subtest profile" sub="Student vs cohort average">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={subs} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={axis} /><YAxis domain={[50, 120]} tick={axis} />
              <Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={90} stroke={C.red} strokeDasharray="5 3" />
              <Bar dataKey="cohort" name="Cohort" fill={C.faint} radius={[3, 3, 0, 0]} />
              <Bar dataKey="score" name={p.name.split(' ')[0]} radius={[3, 3, 0, 0]}>{subs.map((s, i) => <Cell key={i} fill={bandColor(s.score)} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Subtest detail">
          <Table head={['Subtest', 'Score', 'Band', 'vs cohort']} rows={SUBTESTS.map(s => { const v = sub(p, s.key); const d = v - avg(P.map(x => sub(x, s.key))); return [<div><strong style={{ color: C.text }}>{s.name}</strong><br /><span style={{ fontSize: 10, color: C.dim }}>{s.desc}</span></div>, <strong style={{ color: bandColor(v) }}>{v}</strong>, <Pill color={bandColor(v)} soft={bandSoft(v)}>{bandLabel(v)}</Pill>, <span style={{ color: d >= 0 ? C.green : C.red, fontWeight: 700 }}>{d >= 0 ? '+' : ''}{d.toFixed(1)}</span>] })} />
        </Card>
        <Card title="Wellbeing & support">
          <Table head={['Area', 'Status']} rows={[
            ['Attendance', <span style={{ color: p.attendance < 90 ? C.amber : C.green, fontWeight: 700 }}>{p.attendance}%{p.attendanceDetail?.missed ? ` · ${p.attendanceDetail.missed} days missed` : ''}</span>],
            ['Wellbeing (Leuven)', `${p.leuven.wellbeing}/5`], ['Involvement (Leuven)', `${p.leuven.involvement}/5`],
            ['Support status', p.sen?.status || 'None'], ...(p.sen?.plan ? [['Plan', p.sen.plan]] : []),
            ...(p.neli ? [['TEL Ted sessions', `${p.neliSessions} of ${p.neliExpected} expected (${Math.round(p.neliSessions / p.neliExpected * 100)}%)`], ['Interventionist', p.interventionist]] : []),
          ]} />
        </Card>
      </div>
      <Actions title="Next steps" items={p.nextSteps.map((s: string) => us(s).replace(/NELI programme/g, 'TEL Ted programme').replace(/parent newsletter/g, 'family newsletter'))} />
    </>
  )
}

// ─── 3. Cohort At-Risk ───────────────────────────────────────────────────────
function AtRiskReport() {
  const P = PUPILS as any[]
  const risk = P.filter(p => p.es < 90).sort((a, b) => a.es - b.es)
  const critical = risk.filter(p => p.es < 85), monitor = risk.filter(p => p.es >= 85)
  const subtestRisk = P.filter(p => p.es >= 90 && SUBTESTS.some(s => sub(p, s.key) < 85))
  const notOnNeli = risk.filter(p => !p.neli)
  const attendanceRisk = P.filter(p => p.attendance < 90)
  return (
    <>
      <Stats items={[
        { l: 'Below threshold', v: risk.length, c: C.red, s: 'Score < 90' },
        { l: 'Needs support', v: critical.length, c: C.red, s: 'Score < 85' },
        { l: 'Monitor', v: monitor.length, c: C.amber, s: '85–89' },
        { l: 'Hidden subtest risk', v: subtestRisk.length, c: C.blue, s: 'On track overall, one subtest < 85' },
        { l: 'Receiving TEL Ted', v: `${risk.filter(p => p.neli).length}/${risk.length}`, c: C.gold },
      ]} />
      <Narrative accent={C.red}>
        {risk.length} students currently score below the LanguageScreen threshold of 90. {critical.length} of these ({critical.map(p => p.name.split(' ')[0]).join(', ')}) are below 85 and classed as needing support; both are enrolled on TEL Ted: NELI and have made strong gains this year (+{avg(critical.map(gain))} average). {notOnNeli.length > 0 ? `${notOnNeli.length} at-risk student${notOnNeli.length === 1 ? ' is' : 's are'} not yet on an intervention (${notOnNeli.map(p => p.name.split(' ')[0]).join(', ')}) — these are the first candidates for the next TEL Ted group.` : 'Every at-risk student is already receiving intervention.'} A further {subtestRisk.length} students are on track overall but have a single subtest below 85 and should be monitored.
      </Narrative>
      <Card title="At-risk register" sub="All students below 90, lowest first">
        <Table head={['Student', 'Class', 'Sept', 'Now', 'Gain', 'Band', 'Weakest subtest', 'Attend.', 'Intervention', 'Recommended action']} rows={risk.map(p => {
          const w = [...SUBTESTS].sort((a, b) => sub(p, a.key) - sub(p, b.key))[0]
          const action = p.neli ? (p.es < 85 ? 'Continue to Week 20 + follow up SALT referral' : 'Continue to Week 20; reassess in May') : 'Enrol in next TEL Ted: NELI group'
          return [
            <strong style={{ color: C.text }}>{p.name}</strong>, p.class, p.is, <strong style={{ color: bandColor(p.es) }}>{p.es}</strong>, <span style={{ color: C.green, fontWeight: 700 }}>+{gain(p)}</span>, <Pill color={bandColor(p.es)} soft={bandSoft(p.es)}>{bandLabel(p.es)}</Pill>,
            <span>{w.short} <strong style={{ color: bandColor(sub(p, w.key)) }}>{sub(p, w.key)}</strong></span>, <span style={{ color: p.attendance < 90 ? C.amber : C.body }}>{p.attendance}%</span>,
            p.neli ? <Pill color={C.gold}>TEL Ted · Wk {p.neliWeek}</Pill> : <Pill color={C.dim}>None</Pill>, <span style={{ fontSize: 11 }}>{action}</span>,
          ]
        })} />
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Hidden subtest risk" sub="On track overall but a subtest below 85">
          {subtestRisk.length === 0 ? <p style={{ fontSize: 12, color: C.dim }}>None identified.</p> : <Table head={['Student', 'Overall', 'Subtest', 'Score']} rows={subtestRisk.map(p => { const w = SUBTESTS.filter(s => sub(p, s.key) < 85); return [<strong style={{ color: C.text }}>{p.name}</strong>, p.es, w.map(s => s.short).join(', '), <strong style={{ color: C.red }}>{w.map(s => sub(p, s.key)).join(', ')}</strong>] })} />}
        </Card>
        <Card title="Attendance watch" sub="Below 90% — sessions at risk">
          {attendanceRisk.length === 0 ? <p style={{ fontSize: 12, color: C.dim }}>None.</p> : <Table head={['Student', 'Attendance', 'Score', 'Note']} rows={attendanceRisk.map(p => [<strong style={{ color: C.text }}>{p.name}</strong>, <strong style={{ color: C.amber }}>{p.attendance}%</strong>, p.es, <span style={{ fontSize: 11, color: C.muted }}>{p.attendanceDetail?.notes || '—'}</span>])} />}
        </Card>
      </div>
      <Actions items={[
        `Priority 1 — ${critical.map(p => p.name).join(' and ')}: continue TEL Ted 1:1 and group sessions to Week 20; chase outstanding speech-language referral; weekly check-in with family.`,
        `Priority 2 — enrol ${notOnNeli.map(p => p.name).join(', ') || 'no additional students'} in the next TEL Ted: NELI group starting after spring break.`,
        `Priority 3 — targeted whole-class vocabulary work for the ${subtestRisk.length} students with a single weak subtest, using TEL Ted: Whole Class digital slides.`,
        'Reassess every at-risk student with LanguageScreen in the May window and regenerate this report.',
      ]} />
    </>
  )
}

// ─── 4. Subtest Analysis ─────────────────────────────────────────────────────
function SubtestReport() {
  const P = PUPILS as any[]
  const rows = SUBTESTS.map(s => {
    const all = P.map(p => sub(p, s.key))
    return { ...s, avgAll: avg(all), avgNeli: avg(neliPupils.map((p: any) => sub(p, s.key))), avgNon: avg(P.filter(p => !p.neli).map(p => sub(p, s.key))), avgEal: avg(P.filter(p => p.eal).map(p => sub(p, s.key))),
      red: all.filter(v => v < 85).length, amber: all.filter(v => v >= 85 && v < 90).length, green: all.filter(v => v >= 90).length,
      classA: avg(P.filter(p => p.class === 'A').map(p => sub(p, s.key))), classB: avg(P.filter(p => p.class === 'B').map(p => sub(p, s.key))),
      weakest: [...P].sort((a, b) => sub(a, s.key) - sub(b, s.key)).slice(0, 3) }
  })
  const weakest = [...rows].sort((a, b) => a.avgAll - b.avgAll)[0], strongest = [...rows].sort((a, b) => b.avgAll - a.avgAll)[0]
  const biggestGap = [...rows].sort((a, b) => (b.avgNon - b.avgNeli) - (a.avgNon - a.avgNeli))[0]
  return (
    <>
      <Stats items={rows.map(r => ({ l: r.short, v: r.avgAll, c: bandColor(r.avgAll), s: `${r.red} below 85` }))} />
      <Narrative>
        Across the {P.length} assessed students, <strong style={{ color: C.text }}>{weakest.name}</strong> is the weakest subtest (average {weakest.avgAll}) and <strong style={{ color: C.text }}>{strongest.name}</strong> the strongest ({strongest.avgAll}). The gap between TEL Ted students and their peers is widest in {biggestGap.name} ({(biggestGap.avgNon - biggestGap.avgNeli).toFixed(1)} points), which is the area the Part 2 narrative and vocabulary sessions target most directly. English learners score on average {avg(rows.map(r => r.avgEal))} across subtests, with the largest EL gap in {[...rows].sort((a, b) => (a.avgEal - a.avgAll) - (b.avgEal - b.avgAll))[0].name}.
      </Narrative>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Average by subtest" sub="All students vs TEL Ted students">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={rows.map(r => ({ name: r.short, All: r.avgAll, 'TEL Ted': r.avgNeli, 'Non-TEL Ted': r.avgNon }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={axis} /><YAxis domain={[60, 110]} tick={axis} />
              <Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} /><ReferenceLine y={90} stroke={C.red} strokeDasharray="5 3" />
              <Bar dataKey="All" fill={C.blue} radius={[3, 3, 0, 0]} /><Bar dataKey="TEL Ted" fill={C.gold} radius={[3, 3, 0, 0]} /><Bar dataKey="Non-TEL Ted" fill={C.faint} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Band split by subtest" sub="Students in each band">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={rows.map(r => ({ name: r.short, 'Needs support': r.red, Monitor: r.amber, 'On track': r.green }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={axis} /><YAxis tick={axis} allowDecimals={false} />
              <Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Needs support" stackId="a" fill={C.red} /><Bar dataKey="Monitor" stackId="a" fill={C.amber} /><Bar dataKey="On track" stackId="a" fill={C.green} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title="Subtest detail">
        <Table head={['Subtest', 'What it measures', 'All', 'Class A', 'Class B', 'TEL Ted', 'EL', '<85', '85–89', '90+', 'Weakest 3']} rows={rows.map(r => [
          <strong style={{ color: C.text }}>{r.name}</strong>, <span style={{ fontSize: 11, color: C.muted }}>{r.desc}</span>, <strong style={{ color: bandColor(r.avgAll) }}>{r.avgAll}</strong>, r.classA, r.classB, <span style={{ color: C.gold }}>{r.avgNeli}</span>, r.avgEal, <span style={{ color: C.red }}>{r.red}</span>, <span style={{ color: C.amber }}>{r.amber}</span>, <span style={{ color: C.green }}>{r.green}</span>,
          <span style={{ fontSize: 11 }}>{r.weakest.map(p => `${p.name.split(' ')[0]} (${sub(p, r.key)})`).join(', ')}</span>,
        ])} />
      </Card>
      <Card title="Student × subtest heatmap" sub="Every student, every subtest — colour = band">
        <Table head={['Student', ...SUBTESTS.map(s => s.short), 'Overall']} rows={[...P].sort((a, b) => a.es - b.es).map(p => [
          <span style={{ color: C.text, fontWeight: 600 }}>{p.name}{p.neli ? <span style={{ color: C.gold, fontSize: 9, marginLeft: 6 }}>TEL Ted</span> : null}</span>,
          ...SUBTESTS.map(s => <span style={{ display: 'inline-block', minWidth: 36, textAlign: 'center', padding: '3px 6px', borderRadius: 6, background: bandSoft(sub(p, s.key)), color: bandColor(sub(p, s.key)), fontWeight: 700 }}>{sub(p, s.key)}</span>),
          <strong style={{ color: bandColor(p.es) }}>{p.es}</strong>,
        ])} />
      </Card>
      <Actions items={[
        `Prioritise ${weakest.name.toLowerCase()} in whole-class teaching — use TEL Ted: Whole Class digital slides and song files for daily vocabulary exposure.`,
        `Use Part 2 narrative sequence cards with the TEL Ted group to close the ${biggestGap.name.toLowerCase()} gap.`,
        'Provide a pre-teaching vocabulary routine for English learners ahead of each new topic.',
        'Track subtest movement at the May reassessment to evidence which strand the intervention has shifted most.',
      ]} />
    </>
  )
}

// ─── 5. Inspection Evidence Pack ─────────────────────────────────────────────
function InspectionReport() {
  const P = PUPILS as any[]
  const fsm = P.filter(p => p.fsm), nonFsm = P.filter(p => !p.fsm)
  const gapI = avg(nonFsm.map(p => p.is)) - avg(fsm.map(p => p.is)), gapE = avg(nonFsm.map(p => p.es)) - avg(fsm.map(p => p.es))
  const trained = STAFF.filter(s => s.c1 && s.c2 && s.c3).length
  const fidelity = Math.round(neliPupils.reduce((s: number, p: any) => s + p.neliSessions / p.neliExpected, 0) / neliPupils.length * 100)
  const sections = [
    { h: '1. Identification', t: `Every ${GRADE} student (${P.length}/${P.length}) was screened with LanguageScreen within the first four weeks of the year. ${P.filter(p => p.is < 90).length} students were identified below threshold and ${neliPupils.length} were selected for the TEL Ted: NELI Intervention using the standardised selection protocol.`, ok: true },
    { h: '2. Evidence-based provision', t: 'TEL Ted: NELI Intervention is the US adaptation of the Nuffield Early Language Intervention (NELI), rated 5/5 for evidence strength by the Education Endowment Foundation with +3 months additional progress in two randomised controlled trials. Delivery follows the 20-week manualised programme of three group and two individual sessions per week.', ok: true },
    { h: '3. Staff training & fidelity', t: `${trained} of ${STAFF.length} delivery staff have completed all three OxEd CPD-certified training modules. Session fidelity this term is ${fidelity}% of expected sessions delivered, logged in the TEL Ted Tracker.`, ok: fidelity >= 85 },
    { h: '4. Impact', t: `Cohort average rose from ${classAvgI} to ${classAvgE} (+${(classAvgE - classAvgI).toFixed(1)}). TEL Ted students gained +${neliAvgGain} on average, ${(neliAvgGain / Math.max(avg(P.filter(p => !p.neli).map(gain)), 0.1)).toFixed(1)}× their peers. Students below 85 fell from ${P.filter(p => p.is < 85).length} to ${P.filter(p => p.es < 85).length}.`, ok: true },
    { h: '5. Closing the gap', t: `The gap between economically disadvantaged students and their peers narrowed from ${gapI.toFixed(1)} to ${gapE.toFixed(1)} standard score points, a ${Math.round((1 - gapE / gapI) * 100)}% reduction, evidencing targeted use of intervention funding.`, ok: true },
    { h: '6. Family engagement', t: 'Families of every TEL Ted student receive newsletters every two weeks and take-home cards (English and Spanish), with a certificate of achievement at programme completion. Parent Communication Reports are generated for every conference.', ok: true },
  ]
  return (
    <>
      <Stats items={[
        { l: 'Screening coverage', v: '100%', c: C.green }, { l: 'Evidence rating', v: 'EEF 5/5', c: C.teal }, { l: 'Delivery fidelity', v: `${fidelity}%`, c: fidelity >= 85 ? C.green : C.amber }, { l: 'Staff fully trained', v: `${trained}/${STAFF.length}`, c: C.blue }, { l: 'Gap reduction', v: `${Math.round((1 - gapE / gapI) * 100)}%`, c: C.gold },
      ]} />
      <Narrative>
        This evidence pack sets out {SCHOOL}’s systematic approach to early oral language: universal screening, evidence-based targeted intervention, trained staff delivering with fidelity, and measurable impact on outcomes and equity. Each section maps to the accountability framework domains of curriculum intent, implementation and impact, and is supported by exportable data from the TEL Ted dashboard.
      </Narrative>
      {sections.map(s => (
        <Card key={s.h}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: s.ok ? C.green : C.amber, marginTop: 2 }}>{s.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</span>
            <div><h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>{s.h}</h4><p style={{ fontSize: 12, color: C.body, margin: 0, lineHeight: 1.7 }}>{s.t}</p></div>
          </div>
        </Card>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title="Disadvantage gap" sub="Average score, disadvantaged vs not">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{ name: 'September', Disadvantaged: avg(fsm.map(p => p.is)), 'Not disadvantaged': avg(nonFsm.map(p => p.is)) }, { name: 'Now', Disadvantaged: avg(fsm.map(p => p.es)), 'Not disadvantaged': avg(nonFsm.map(p => p.es)) }]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={axis} /><YAxis domain={[60, 110]} tick={axis} /><Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Disadvantaged" fill={C.amber} radius={[3, 3, 0, 0]} /><Bar dataKey="Not disadvantaged" fill={C.blue} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Staff training record">
          <Table head={['Staff', 'Role', 'Module 1', 'Module 2', 'Module 3']} rows={STAFF.map(s => [<strong style={{ color: C.text }}>{s.name}</strong>, s.role.replace('NELI', 'TEL Ted'), ...[s.c1, s.c2, s.c3].map(v => <span style={{ color: v ? C.green : C.amber, fontWeight: 700 }}>{v ? '✓ Complete' : 'Outstanding'}</span>)])} />
        </Card>
      </div>
      <Actions title="Evidence appendix (exportable)" items={['A — LanguageScreen cohort results, September and current (Class Dashboard report)', 'B — TEL Ted Tracker session logs with fidelity by student', 'C — Subtest Analysis report', 'D — Sample family newsletters, take-home cards and Parent Communication Reports', 'E — OxEd & Assessment CPD certificates for delivery staff']} />
    </>
  )
}

// ─── 6. Parent Communication ─────────────────────────────────────────────────
function ParentReport() {
  const P = PUPILS as any[]
  const [id, setId] = useState<number>(P[0].id)
  const p = P.find(x => x.id === id) || P[0]
  const g = gain(p), first = p.name.split(' ')[0]
  const plain: Record<string, string> = { recVocab: 'understanding words', expVocab: 'using words', grammar: 'putting sentences together', listening: 'listening and understanding stories' }
  const strongest = [...SUBTESTS].sort((a, b) => sub(p, b.key) - sub(p, a.key))[0], weakest = [...SUBTESTS].sort((a, b) => sub(p, a.key) - sub(p, b.key))[0]
  const level = (v: number) => v < 85 ? 'needs some extra help' : v < 90 ? 'is developing' : v < 100 ? 'is doing well' : 'is doing very well'
  return (
    <>
      <div className="telted-no-print" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: C.dim, fontWeight: 600 }}>Student</span>
        <select value={id} onChange={e => setId(Number(e.target.value))} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text }}>
          {[...P].sort((a, b) => a.name.localeCompare(b.name)).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <span style={{ fontSize: 11, color: C.dim }}>· Language: English {p.eal ? '(Spanish version available)' : ''}</span>
      </div>
      <Card style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(249,115,22,0.10))' }}>
        <p style={{ fontSize: 11, color: C.muted, margin: '0 0 4px' }}>{SCHOOL} · {GRADE} · {today()}</p>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>🐻 {first}’s Language Update</h3>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>For the family of {p.name}</p>
      </Card>
      <Card>
        <p style={{ fontSize: 13, color: C.body, lineHeight: 1.85, margin: 0, fontFamily: 'Georgia, serif' }}>
          Dear family of {first},<br /><br />
          This year {first} has taken part in LanguageScreen, a short, game-like assessment developed by researchers at the University of Oxford. It looks at four areas of spoken language: understanding words, using words, putting sentences together, and listening to stories. Spoken language is the foundation for reading, writing and making friends, so we check it early and support it carefully.<br /><br />
          <strong style={{ color: C.text }}>How {first} is doing.</strong> {first}’s overall language score has moved from {p.is} in September to {p.es} now. {g >= 8 ? `That is a big jump — ${first} has made excellent progress and we are really proud.` : g >= 4 ? `That is good, steady progress.` : `${first} is making progress and we will keep a close eye on it.`} {first} {level(p.es)} overall. The strongest area is {plain[strongest.key]}, and the area we are focusing on most is {plain[weakest.key]}.
          {p.neli && <> <br /><br /><strong style={{ color: C.text }}>TEL Ted sessions.</strong> {first} has been part of our TEL Ted small-group language programme with {p.interventionist}, and is now in week {p.neliWeek} of 20. {first} has attended {p.neliSessions} sessions so far. The group meets three times a week and {first} also has two short one-to-one sessions with Ted the Bear’s stories, songs and vocabulary games.</>}
        </p>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {SUBTESTS.map(s => { const v = sub(p, s.key); return (
          <div key={s.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.text, margin: '0 0 4px', textTransform: 'capitalize' }}>{plain[s.key]}</p>
            <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: 'hidden', margin: '6px 0' }}><div style={{ width: `${Math.min(100, Math.max(5, (v - 55) / 65 * 100))}%`, height: '100%', background: bandColor(v) }} /></div>
            <p style={{ fontSize: 11, color: bandColor(v), fontWeight: 700, margin: 0, textTransform: 'capitalize' }}>{level(v)}</p>
          </div>) })}
      </div>
      <Card title="How you can help at home">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            `Talk together every day — describe what you are doing, and give ${first} time to answer.`,
            `Read a story together and ask “what happened next?” — this builds ${plain[weakest.key]}.`,
            p.neli ? 'Use the TEL Ted take-home cards we send home every two weeks; five minutes of the words and songs at home makes a real difference.' : 'Sing songs and play “I spy” with describing words (big, soft, shiny) to build vocabulary.',
            'Praise every attempt to use new words — confidence matters as much as accuracy.',
          ].map((t, i) => <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: C.body, lineHeight: 1.6 }}><span style={{ color: C.teal }}>●</span><span>{t}</span></div>)}
        </div>
      </Card>
      <Card>
        <p style={{ fontSize: 12, color: C.body, margin: 0, lineHeight: 1.7, fontFamily: 'Georgia, serif' }}>We would love to talk this through at the next parent conference. If you have any questions before then, please contact {CLASSES.find(c => c.id === p.class)?.teacher} at the school office.<br /><br />With best wishes,<br /><strong style={{ color: C.text }}>The {GRADE} team, {SCHOOL}</strong></p>
      </Card>
    </>
  )
}

// ─── 7. Simple View of Reading ───────────────────────────────────────────────
const SVOR_COLORS: Record<string, string> = { none: C.green, slight: C.amber, clear: C.red }
const SVOR_ORDER: Record<string, number> = { 'Dual Risk': 0, 'Language Risk': 1, 'Decoding Risk': 2, Typical: 3 }
const SVOR_QC: Record<string, string> = { Typical: C.green, 'Language Risk': C.amber, 'Decoding Risk': C.amber, 'Dual Risk': C.red }
const svorQuadrant = (d: { x: number; y: number }) => d.x >= 90 && d.y >= 90 ? 'Typical' : d.x < 90 && d.y < 90 ? 'Dual Risk' : d.y < 90 ? 'Language Risk' : 'Decoding Risk'
const SvorTip = ({ active, payload }: any) => { if (!active || !payload?.length) return null; const d = payload[0].payload; return (
  <div style={{ background: '#0A0B10', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
    <p style={{ fontWeight: 700, margin: '0 0 4px', color: C.text }}>{d.name}</p><p style={{ margin: 0, color: C.body }}>Language: {d.y} · Decoding: {d.x}</p><p style={{ margin: '4px 0 0', color: SVOR_QC[svorQuadrant(d)], fontWeight: 700 }}>{svorQuadrant(d)}</p>
  </div>) }
function SvorReport() {
  const P = PUPILS as any[]
  const data = P.map(p => { const x = Math.round((sub(p, 'grammar') + sub(p, 'listening')) / 2), y = Math.round((sub(p, 'recVocab') + sub(p, 'expVocab')) / 2); return { x, y, name: p.name, neli: p.neli, es: p.es, concern: x < 90 && y < 90 ? 'clear' : (x < 90 || y < 90) ? 'slight' : 'none' } })
  const quadrant = svorQuadrant
  const count = (q: string) => data.filter(d => quadrant(d) === q).length
  const order = SVOR_ORDER, qc = SVOR_QC
  return (
    <>
      <Stats items={[{ l: 'Typical skills', v: count('Typical'), c: C.green }, { l: 'Language risk', v: count('Language Risk'), c: C.amber }, { l: 'Decoding risk', v: count('Decoding Risk'), c: C.amber }, { l: 'Dual risk', v: count('Dual Risk'), c: C.red }]} />
      <Narrative>
        The Simple View of Reading (SVoR) frames reading comprehension as the product of two skill sets: language comprehension and word decoding. The chart plots every assessed student’s combined LanguageScreen standard score (language comprehension) against their word-decoding score, with the age-expected threshold at 90. Students in the lower-left quadrant show risk in both areas and are priority candidates for TEL Ted; those in the lower-right have language-specific needs that the intervention targets directly.
      </Narrative>
      <Card>
        <div style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={460}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
              <ReferenceArea x1={90} x2={135} y1={90} y2={135} fill="rgba(34,197,94,0.06)" /><ReferenceArea x1={65} x2={90} y1={90} y2={135} fill="rgba(96,165,250,0.06)" /><ReferenceArea x1={90} x2={135} y1={65} y2={90} fill="rgba(245,158,11,0.06)" /><ReferenceArea x1={65} x2={90} y1={65} y2={90} fill="rgba(239,68,68,0.08)" />
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" dataKey="x" domain={[65, 135]} ticks={[65, 75, 85, 90, 95, 105, 115, 125, 135]} tick={axis} label={{ value: 'Word Reading (Decoding) →', position: 'bottom', offset: 10, style: { fontSize: 11, fill: C.muted, fontWeight: 600 } }} />
              <YAxis type="number" dataKey="y" domain={[65, 135]} ticks={[65, 75, 85, 90, 95, 105, 115, 125, 135]} tick={axis} label={{ value: 'Language Comprehension →', angle: -90, position: 'left', offset: 0, style: { fontSize: 11, fill: C.muted, fontWeight: 600 } }} />
              <ZAxis range={[200, 200]} />
              <ReferenceLine x={90} stroke={C.blue} strokeDasharray="6 3" /><ReferenceLine y={90} stroke={C.blue} strokeDasharray="6 3" /><ReferenceLine x={100} stroke={C.border} /><ReferenceLine y={100} stroke={C.border} />
              <Tooltip content={<SvorTip />} />
              <Scatter data={data} shape={(props: any) => { const { cx, cy, payload } = props; const ini = payload.name.split(' ').map((w: string) => w[0]).join(''); return (<g><circle cx={cx} cy={cy} r={11} fill={SVOR_COLORS[payload.concern]} stroke={payload.neli ? C.gold : '#0A0B10'} strokeWidth={payload.neli ? 2.5 : 1.5} /><text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={8} fontWeight={700}>{ini}</text></g>) }} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: 26, left: 80, fontSize: 10, color: C.blue, fontStyle: 'italic' }}>Poor reading skills</div>
          <div style={{ position: 'absolute', top: 26, right: 40, fontSize: 10, color: C.blue, fontStyle: 'italic', textAlign: 'right' }}>Typical reading and language skills</div>
          <div style={{ position: 'absolute', bottom: 70, left: 100, fontSize: 10, color: C.blue, fontStyle: 'italic' }}>Poor reading and poor language skills</div>
          <div style={{ position: 'absolute', bottom: 70, right: 40, fontSize: 10, color: C.blue, fontStyle: 'italic', textAlign: 'right' }}>Poor language skills</div>
        </div>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 6, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: C.green, marginRight: 5 }} />No concerns</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: C.amber, marginRight: 5 }} />Slight concerns</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: C.red, marginRight: 5 }} />Clear concerns</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, border: `2px solid ${C.gold}`, marginRight: 5 }} />TEL Ted student</span>
        </div>
      </Card>
      <Card title="Student quadrant list">
        <Table head={['Student', 'Language', 'Decoding', 'Quadrant', 'Overall band', 'TEL Ted']} rows={[...data].sort((a, b) => order[quadrant(a)] - order[quadrant(b)] || a.y - b.y).map(d => [
          <strong style={{ color: C.text }}>{d.name}</strong>, <strong style={{ color: d.y < 90 ? C.red : C.green }}>{d.y}</strong>, <strong style={{ color: d.x < 90 ? C.red : C.green }}>{d.x}</strong>, <Pill color={qc[quadrant(d)]}>{quadrant(d)}</Pill>, <Pill color={bandColor(d.es)} soft={bandSoft(d.es)}>{bandLabel(d.es)}</Pill>, d.neli ? <Pill color={C.gold}>TEL Ted</Pill> : <span style={{ color: C.faint }}>—</span>,
        ])} />
      </Card>
      <Narrative accent={C.blue}>
        {count('Typical')} students are in the typical range for both language comprehension and decoding. {count('Dual Risk')} student{count('Dual Risk') === 1 ? ' shows' : 's show'} dual risk and {count('Language Risk')} language-specific risk — together these {count('Dual Risk') + count('Language Risk')} students are the core TEL Ted cohort. Average language comprehension: {avg(data.map(d => d.y))}. Average decoding: {avg(data.map(d => d.x))}.
      </Narrative>
    </>
  )
}

// ─── 8. Class Dashboard ──────────────────────────────────────────────────────
function ClassDashboardReport() {
  const P = PUPILS as any[]
  const [orderBy, setOrderBy] = useState('score-asc'), [filter, setFilter] = useState('all'), [showInitial, setShowInitial] = useState(true)
  let list = [...P]; if (filter === 'neli') list = list.filter(p => p.neli); if (filter === 'atrisk') list = list.filter(p => p.es < 90); if (filter === 'A' || filter === 'B') list = list.filter(p => p.class === filter)
  list.sort((a, b) => orderBy === 'score-asc' ? a.es - b.es : orderBy === 'score-desc' ? b.es - a.es : orderBy === 'gain' ? gain(b) - gain(a) : a.name.localeCompare(b.name))
  const min = 60, max = 130, pct = (v: number) => ((v - min) / (max - min)) * 100
  const zones = [{ from: 60, to: 85, bg: 'rgba(239,68,68,0.10)', l: 'Needs support' }, { from: 85, to: 90, bg: 'rgba(245,158,11,0.10)', l: 'Monitor' }, { from: 90, to: 110, bg: 'rgba(34,197,94,0.06)', l: 'Average range' }, { from: 110, to: 130, bg: 'rgba(34,197,94,0.12)', l: 'Above average' }]
  const ticks = [60, 70, 80, 85, 90, 100, 110, 120, 130]
  return (
    <>
      <Stats items={[{ l: 'Students', v: P.length, c: C.blue }, { l: 'Avg Sept', v: classAvgI.toFixed(1), c: C.muted }, { l: 'Avg now', v: classAvgE.toFixed(1), c: C.teal }, { l: 'Avg gain', v: `+${(classAvgE - classAvgI).toFixed(1)}`, c: C.green }, { l: 'Below 90', v: P.filter(p => p.es < 90).length, c: C.amber }, { l: 'TEL Ted', v: neliPupils.length, c: C.gold }]} />
      <div className="telted-no-print" style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={orderBy} onChange={e => setOrderBy(e.target.value)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text }}>
          <option value="score-asc">Score (low → high)</option><option value="score-desc">Score (high → low)</option><option value="gain">Biggest gain</option><option value="name">Name</option>
        </select>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text }}>
          <option value="all">All students</option><option value="A">Kindergarten A</option><option value="B">Kindergarten B</option><option value="neli">TEL Ted only</option><option value="atrisk">Below 90 only</option>
        </select>
        <button onClick={() => setShowInitial(v => !v)} style={{ fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: showInitial ? C.teal : C.bg, color: C.text, cursor: 'pointer' }}>{showInitial ? 'Showing Sept → Now' : 'Current only'}</button>
      </div>
      <Card>
        {list.map(p => { const g = gain(p); return (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', height: 26, marginBottom: 4 }}>
            <div style={{ width: 170, flexShrink: 0, fontSize: 11, color: C.body, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}{p.neli && <span style={{ fontSize: 8, fontWeight: 800, color: '#000', background: C.gold, borderRadius: 3, padding: '1px 4px', marginLeft: 6 }}>TT</span>}</div>
            <div style={{ flex: 1, position: 'relative', height: 22 }}>
              {zones.map(z => <div key={z.l} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(z.from)}%`, width: `${pct(z.to) - pct(z.from)}%`, background: z.bg }} />)}
              <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 1, background: C.border }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(90)}%`, borderLeft: `1px dashed ${C.red}` }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(100)}%`, borderLeft: `1px dashed ${C.faint}` }} />
              {showInitial && g !== 0 && <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}><line x1={`${pct(p.is)}%`} y1="11" x2={`${pct(p.es)}%`} y2="11" stroke={g > 0 ? C.green : C.red} strokeWidth={2} /></svg>}
              {showInitial && <div title={`Sept: ${p.is}`} style={{ position: 'absolute', top: 7, left: `${pct(p.is)}%`, width: 8, height: 8, transform: 'translateX(-4px)', background: C.faint, borderRadius: 2 }} />}
              <div title={`Now: ${p.es}`} style={{ position: 'absolute', top: 5, left: `${pct(p.es)}%`, width: 12, height: 12, transform: 'translateX(-6px)', background: bandColor(p.es), borderRadius: '50%', border: '2px solid #0A0B10' }} />
              <span style={{ position: 'absolute', top: 3, left: `calc(${pct(p.es)}% + 10px)`, fontSize: 9, fontWeight: 700, color: g > 0 ? C.green : C.red }}>{p.es} <span style={{ color: C.dim }}>({g > 0 ? '+' : ''}{g})</span></span>
            </div>
          </div>) })}
        <div style={{ display: 'flex', marginTop: 6 }}><div style={{ width: 170, flexShrink: 0 }} /><div style={{ flex: 1, position: 'relative', height: 16 }}>{ticks.map(t => <span key={t} style={{ position: 'absolute', left: `${pct(t)}%`, transform: 'translateX(-50%)', fontSize: 9, color: t === 90 ? C.red : C.dim, fontWeight: t === 90 ? 700 : 400 }}>{t}</span>)}</div></div>
        <div style={{ display: 'flex' }}><div style={{ width: 170, flexShrink: 0 }} /><div style={{ flex: 1, position: 'relative', height: 14 }}>{zones.map(z => <span key={z.l} style={{ position: 'absolute', left: `${pct(z.from)}%`, width: `${pct(z.to) - pct(z.from)}%`, textAlign: 'center', fontSize: 8, color: C.faint, fontWeight: 600, textTransform: 'uppercase' }}>{z.l}</span>)}</div></div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {SUBTESTS.map(s => { const a = avg(P.map(p => sub(p, s.key))); const r = P.filter(p => sub(p, s.key) < 85).length, am = P.filter(p => sub(p, s.key) >= 85 && sub(p, s.key) < 90).length, gr = P.length - r - am; const w = [...P].sort((x, y) => sub(x, s.key) - sub(y, s.key)).slice(0, 3); return (
          <div key={s.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{s.name}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: bandColor(a), margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>{a}</p>
            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}><div style={{ width: `${r / P.length * 100}%`, background: C.red }} /><div style={{ width: `${am / P.length * 100}%`, background: C.amber }} /><div style={{ width: `${gr / P.length * 100}%`, background: C.green }} /></div>
            <p style={{ fontSize: 9, color: C.dim, margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase' }}>Weakest</p>
            {w.map(p => <p key={p.id} style={{ fontSize: 10, color: C.muted, margin: 0 }}>{p.name.split(' ')[0]} <span style={{ color: C.red }}>{sub(p, s.key)}</span></p>)}
          </div>) })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[{ t: '🔴 Immediate attention (<85)', c: C.red, ps: P.filter(p => p.es < 85) }, { t: '🟡 Monitor closely (85–89)', c: C.amber, ps: P.filter(p => p.es >= 85 && p.es < 90) }, { t: '🌟 Biggest gains', c: C.green, ps: [...P].sort((a, b) => gain(b) - gain(a)).slice(0, 4) }].map(k => (
          <div key={k.t} style={{ borderLeft: `4px solid ${k.c}`, borderRadius: 8, padding: '12px 14px', background: `${k.c}12`, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: k.c, margin: '0 0 6px' }}>{k.t}</p>
            {k.ps.length === 0 ? <p style={{ fontSize: 11, color: C.dim, margin: 0 }}>None</p> : k.ps.map(p => <p key={p.id} style={{ fontSize: 11, color: C.body, margin: '0 0 2px' }}>{p.name} — <strong style={{ color: k.c }}>{p.es}</strong> <span style={{ color: C.dim }}>(+{gain(p)})</span></p>)}
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Panel ───────────────────────────────────────────────────────────────────
const RENDERERS: Record<string, () => React.ReactElement> = {
  'term-summary': TermSummaryReport, 'pupil-progress': StudentProgressReport, 'at-risk': AtRiskReport, 'subtest': SubtestReport,
  'inspection': InspectionReport, 'parent': ParentReport, 'svor': SvorReport, 'class-dashboard': ClassDashboardReport,
}

export default function TelTedReportsPanel({ initialReportId }: { initialReportId?: string | null } = {}) {
  const [selected, setSelected] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [step, setStep] = useState(0)
  const steps = ['Pulling LanguageScreen results…', 'Analysing TEL Ted Tracker sessions…', 'Building charts and narrative…']

  function generate(r: any) {
    setSelected(r); setGenerating(true); setPreview(null); setStep(0)
    setTimeout(() => setStep(1), 500); setTimeout(() => setStep(2), 1000)
    setTimeout(() => { setGenerating(false); setPreview(r) }, 1500)
  }
  useEffect(() => {
    if (!initialReportId) return
    const r = TELTED_REPORT_TYPES.find(x => x.id === initialReportId)
    if (r) generate(r)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReportId])
  const Renderer = preview ? RENDERERS[preview.id] : null

  return (
    <div style={{ display: 'flex', minHeight: 560, overflow: 'hidden', borderRadius: 12, border: `1px solid ${C.border}` }}>
      <style>{`@keyframes tt-spin{to{transform:rotate(360deg)}} @media print { .telted-no-print, .telted-report-sidebar { display:none !important } .telted-report-body { background:#fff !important; color:#000 !important; overflow:visible !important; } }`}</style>
      <div className="telted-report-sidebar" style={{ width: 330, flexShrink: 0, borderRight: `1px solid ${C.border}`, overflowY: 'auto', padding: 18, background: C.panel }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Report Library</h2>
        <p style={{ fontSize: 11, color: C.dim, margin: '0 0 14px' }}>{TELTED_REPORT_TYPES.length} report types · generated live from LanguageScreen and TEL Ted Tracker data</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TELTED_REPORT_TYPES.map(r => (
            <div key={r.id} onClick={() => generate(r)} style={{ background: C.bg, border: `1px solid ${selected?.id === r.id ? C.teal : C.border}`, borderRadius: 10, padding: 12, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>{r.name}</h4>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.dim, background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{r.cat}</span>
              </div>
              <p style={{ fontSize: 11, color: C.dim, margin: '4px 0 8px', lineHeight: 1.5 }}>{r.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: C.faint }}>Last: {r.lastGen || '—'}</span>
                <button onClick={e => { e.stopPropagation(); generate(r) }} style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 7, border: 'none', background: selected?.id === r.id ? C.teal : 'rgba(13,148,136,0.15)', color: selected?.id === r.id ? '#fff' : C.teal, cursor: 'pointer' }}>Generate</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="telted-report-body" style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#07080F', minWidth: 0 }}>
        {!preview && !generating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.dim, textAlign: 'center' }}>
            <FileText size={48} style={{ color: C.border, marginBottom: 14 }} />
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: C.muted }}>Select a report to generate</p>
            <p style={{ fontSize: 11, margin: '6px 0 0', maxWidth: 320, lineHeight: 1.6 }}>Every report is built from live LanguageScreen scores, TEL Ted Tracker sessions and attendance — with charts, tables, narrative and a print-ready PDF.</p>
          </div>
        )}
        {generating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={36} style={{ color: C.teal, animation: 'tt-spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, fontWeight: 700, marginTop: 16, color: C.teal }}>Generating {selected?.name}</p>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {steps.map((s, i) => <p key={s} style={{ fontSize: 11, margin: 0, color: i < step ? C.green : i === step ? C.text : C.faint, display: 'flex', alignItems: 'center', gap: 6 }}>{i < step ? <CheckCircle2 size={12} /> : <ChevronRight size={12} />}{s}</p>)}
            </div>
          </div>
        )}
        {preview && !generating && Renderer && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, paddingBottom: 14, borderBottom: `2px solid ${C.border}` }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>🐻 TEL Ted · {preview.cat} report</p>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, fontFamily: 'Georgia, serif' }}>{preview.name}</h2>
                <p style={{ fontSize: 11, color: C.dim, margin: '4px 0 0' }}>{SCHOOL} · {DISTRICT} · {GRADE} · Generated {today()} · EEF 5/5 evidence rating</p>
              </div>
              <div className="telted-no-print" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer' }}><Printer size={13} /> Print</button>
                <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 8, border: 'none', background: C.teal, color: '#fff', cursor: 'pointer' }}><Download size={13} /> Download PDF</button>
              </div>
            </div>
            <Renderer />
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 10, color: C.faint, margin: 0 }}>Generated by <strong style={{ color: C.dim }}>Lumio Schools</strong> · OxEd & Assessment · TEL Ted Program · LanguageScreen standard scores (mean 100, SD 15; threshold 90)</p>
              <span style={{ fontSize: 10, color: C.faint, display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrendingUp size={11} /> Data as of {today()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
