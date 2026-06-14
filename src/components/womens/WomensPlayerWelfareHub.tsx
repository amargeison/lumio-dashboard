'use client'

// Women's Player Welfare Hub — the flagship welfare command centre.
// Merges the old "Player Welfare" + "Player Welfare Hub" entry points and
// pulls data/charts from every welfare domain: injury/ACL, menstrual cycle &
// load, maternity & return-to-play, mental health, concussion and
// safeguarding (Karen Carney Review standards). DEMO data, aligned with the
// canonical Oakridge Women squad. Inline SVG charts (no external lib).

import { useState } from 'react'
import {
  Heart, Activity, ShieldCheck, Brain, Baby, Flower2, Stethoscope,
  AlertTriangle, CheckCircle2, ClipboardCheck, TrendingUp, Lock, Users, Calendar,
} from 'lucide-react'

const C = {
  card: '#0D1017', cardAlt: '#111318', panel2: '#0B0D12',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', muted: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6', pink: '#EC4899', accent: '#BE185D',
} as const

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'muted'
const tc = (t: Tone) => t === 'good' ? C.good : t === 'warn' ? C.warn : t === 'bad' ? C.bad : t === 'info' ? C.blue : C.muted

function Pill({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${tc(tone)}1e`, color: tc(tone), whiteSpace: 'nowrap' }}>{children}</span>
}
function Bar({ pct, color }: { pct: number; color: string }) {
  return <div className="h-1.5 rounded-full" style={{ background: C.panel2 }}><div className="h-1.5 rounded-full" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} /></div>
}
function Kpi({ label, value, sub, icon: Icon, color, tone }: { label: string; value: string; sub: string; icon: React.ElementType; color: string; tone?: Tone }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-2" style={{ backgroundColor: `${color}18` }}><Icon size={14} style={{ color }} /></div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs" style={{ color: C.muted }}>{label}</p>
      <p className="text-[10px] mt-0.5" style={{ color: tone ? tc(tone) : C.muted }}>{sub}</p>
    </div>
  )
}
function Panel({ title, icon: Icon, right, children }: { title: string; icon?: React.ElementType; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>{Icon && <Icon size={14} style={{ color: C.pink }} />}{title}</span>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
function Donut({ data, centerLabel, centerSub, size = 150 }: { data: { label: string; value: number; color: string }[]; centerLabel: string; centerSub: string; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const th = 22, r = (size - th) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={th} />
        {data.map((d, i) => { const len = d.value / total * circ, off = -acc * circ; acc += d.value / total; return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={th} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} /> })}
        <text x={cx} y={cy - 2} textAnchor="middle" style={{ fill: C.text, fontSize: 22, fontWeight: 800 }}>{centerLabel}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" style={{ fill: C.muted, fontSize: 9 }}>{centerSub}</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} /><span style={{ color: C.text2 }}>{d.label}</span><span className="font-bold ml-1" style={{ color: C.text }}>{d.value}</span></div>
        ))}
      </div>
    </div>
  )
}
function DualLine({ months, a, b, aMax, bMax, aLabel, bLabel, aColor, bColor }: { months: string[]; a: number[]; b: number[]; aMax: number; bMax: number; aLabel: string; bLabel: string; aColor: string; bColor: string }) {
  const W = 600, H = 170, pL = 8, pR = 8, pT = 12, pB = 22
  const iw = W - pL - pR, ih = H - pT - pB, sx = iw / (months.length - 1)
  const pa = a.map((v, i) => `${i ? 'L' : 'M'} ${pL + i * sx} ${pT + ih - (v / aMax) * ih}`).join(' ')
  const pb = b.map((v, i) => `${i ? 'L' : 'M'} ${pL + i * sx} ${pT + ih - (v / bMax) * ih}`).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={pL} x2={W - pR} y1={pT + ih - t * ih} y2={pT + ih - t * ih} stroke="rgba(255,255,255,0.06)" />)}
        <path d={pa} fill="none" stroke={aColor} strokeWidth="2.5" />
        <path d={pb} fill="none" stroke={bColor} strokeWidth="2.5" />
        {months.map((m, i) => <text key={m} x={pL + i * sx} y={H - 6} fontSize="9" fill="#6B7280" textAnchor="middle">{m}</text>)}
      </svg>
      <div className="flex items-center gap-4 mt-1 text-[10px]">
        <span className="flex items-center gap-1.5" style={{ color: C.muted }}><span style={{ width: 10, height: 3, background: aColor, display: 'inline-block', borderRadius: 2 }} />{aLabel}</span>
        <span className="flex items-center gap-1.5" style={{ color: C.muted }}><span style={{ width: 10, height: 3, background: bColor, display: 'inline-block', borderRadius: 2 }} />{bLabel}</span>
      </div>
    </div>
  )
}

// ─── Data (harvested from the welfare sub-sections, canonical squad) ────────
type CaseT = { player: string; cat: string; tone: Tone; sev: string; detail: string; actions: string }
const CASES: CaseT[] = [
  { player: 'Emily Zhang', cat: 'ACL Risk', tone: 'bad', sev: 'High', detail: 'Previous bilateral ACL (2023, 2024). 6-month screening protocol active. Cycle × GPS composite red today.', actions: 'Lumio Health monitoring · reduced sprint load · quarterly MRI · prehab flagged' },
  { player: 'Charlotte Reed', cat: 'Mental Health', tone: 'warn', sev: 'Medium', detail: 'Weekly sessions with Dr Anna Reid (performance psychologist). Pre-match performance anxiety. Progress positive.', actions: 'Weekly check-in · welfare lead notified · PFA support offered' },
  { player: 'Sophie Lawson', cat: 'Maternity', tone: 'info', sev: 'Info', detail: 'Maternity leave commencing May 2026. Return plan January 2027. Contract & salary protected (WSL 26-week policy).', actions: 'Leave plan filed · salary protected · return-to-play programme scheduled' },
  { player: 'Sophie Turner', cat: 'ACL · RTP', tone: 'warn', sev: 'Medium', detail: 'ACL reconstruction Dec 2024. Final return-to-play phase (Phase 3 of 10). No competitive match until clearance.', actions: 'Graduated return protocol · modified prehab · medical sign-off pending' },
]

const AVAILABILITY = [
  { label: 'Available', value: 17, color: C.good },
  { label: 'Load-managed', value: 2, color: C.warn },
  { label: 'Return-to-play', value: 2, color: C.blue },
  { label: 'Maternity leave', value: 1, color: C.purple },
]

const ALERTS = [
  { tone: 'bad' as Tone, text: 'ACL screening overdue for 4 players (Clarke, Nair, Osei, Walsh) — book this week.' },
  { tone: 'bad' as Tone, text: 'Emily Zhang cycle × ACL composite 98/100 — reduce to 60% load, no cutting drills today.' },
  { tone: 'warn' as Tone, text: '2 mental-health follow-ups open (Reed, Davies) — welfare lead actioning.' },
  { tone: 'warn' as Tone, text: 'Tilly Brooks concussion graded-return — symptom-free 48h, contact cleared.' },
  { tone: 'good' as Tone, text: 'Karen Carney Review minimum standards: all criteria met this quarter.' },
]

const ACL_RISK = [
  { label: 'High', value: 3, color: C.bad },
  { label: 'Medium', value: 4, color: C.warn },
  { label: 'Low', value: 15, color: C.good },
]
const ACL_WATCH = [
  { name: 'Emily Zhang', pos: 'CM', history: 'Previous ACL (left, 2023)', risk: 'High', tone: 'bad' as Tone, next: 'Jun 2026' },
  { name: 'Abbi Walsh', pos: 'RW', history: 'Previous ACL (left, 2021)', risk: 'High', tone: 'bad' as Tone, next: 'Overdue · Feb' },
  { name: 'Emma Clarke', pos: 'CB', history: 'Previous ACL (right, 2022)', risk: 'High', tone: 'bad' as Tone, next: 'Overdue · Jan' },
  { name: 'Sophie Turner', pos: 'LB', history: 'ACL reconstruction Dec 2024', risk: 'RTP', tone: 'warn' as Tone, next: 'Phase 3 / 10' },
  { name: 'Sasha Davies', pos: 'CM', history: 'Meniscus repair (2025)', risk: 'Medium', tone: 'warn' as Tone, next: 'Jul 2026' },
  { name: 'Priya Nair', pos: 'CM', history: 'None · cycle laxity', risk: 'Medium', tone: 'warn' as Tone, next: 'Overdue · Apr' },
]
const PREVENTION = [
  { name: 'Emily Zhang', pct: 42, tone: 'bad' as Tone, note: 'Missed Mon + Wed prehab — flagged with Head Physio' },
  { name: 'Abbi Walsh', pct: 83, tone: 'good' as Tone, note: 'One miss (illness, GP note)' },
  { name: 'Tilly Brooks', pct: 83, tone: 'good' as Tone, note: 'Concussion clearance gap' },
  { name: 'Squad average', pct: 86, tone: 'good' as Tone, note: 'FIFA 11+ block adherence (12 sessions / 6 weeks)' },
]

const PHASES = [
  { label: 'Follicular', value: 4, color: C.good },
  { label: 'Ovulatory', value: 3, color: C.warn },
  { label: 'Luteal', value: 3, color: C.pink },
  { label: 'Menstrual', value: 2, color: C.bad },
]
const COMPOSITE = [
  { name: 'Emily Zhang', total: 98, tone: 'bad' as Tone, parts: [['Prev ACL', 40], ['Cycle', 30], ['GPS', 20], ['Biomech', 8]], action: 'Reduce to 60% load today. No cutting drills.' },
  { name: 'Priya Nair', total: 53, tone: 'warn' as Tone, parts: [['Prev ACL', 0], ['Cycle', 30], ['GPS', 15], ['Biomech', 8]], action: 'Avoid sharp pivots. Monitor closely.' },
]
const ADJUSTMENTS = [
  { name: 'Emily Zhang', detail: 'Luteal · Day 21', adj: '-25% load cap' },
  { name: 'Priya Nair', detail: 'Ovulatory · Day 14', adj: '-5% intensity' },
  { name: 'Abbi Walsh', detail: 'Luteal · Day 19', adj: '-20% intensity' },
  { name: 'Tilly Brooks', detail: 'Luteal · Day 22', adj: '-15% intensity' },
  { name: 'Charlotte Reed', detail: 'Menstrual · Day 2', adj: 'Rest day recommended' },
]

const RTP_PHASES = ['Rest / protect', 'Range of motion', 'Strength base', 'Running prep', 'Linear running', 'Change of direction', 'Sport-specific', 'Contact / team training', 'Graded match minutes', 'Full clearance']
const RTP_PLAYERS = [
  { name: 'Sophie Turner', injury: 'ACL reconstruction', phase: 7, eta: 'May 2026' },
  { name: 'Sasha Davies', injury: 'Meniscus rehab', phase: 4, eta: 'Jun 2026' },
]

const MH_MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
const MH_WORKLOAD = [40, 55, 65, 70, 60, 50, 65, 78, 85, 75]
const MH_WELLBEING = [8.4, 8.1, 7.8, 7.5, 7.9, 8.2, 7.6, 7.0, 6.6, 6.9]
const MH_FLAGS = [
  { player: 'Charlotte Reed', score: 6, flag: 'Performance anxiety — pre-match', followup: 'Weekly sessions' },
  { player: 'Sasha Davies', score: 6, flag: 'Adjusting to rehab — welfare check', followup: 'Welfare lead check-in' },
]
const SUPPORT = [
  { name: 'Dr Anna Reid', role: 'Performance Psychologist', type: 'In-house' },
  { name: 'PFA Wellbeing Service', role: 'Player support line', type: 'External' },
  { name: 'Mind', role: 'Referral pathway', type: 'External' },
  { name: 'Players Together', role: 'Peer support network', type: 'External' },
]

const CARNEY = [
  { label: 'Independent welfare officer appointed', tone: 'good' as Tone, status: 'In place' },
  { label: 'Mandatory minimum medical standards', tone: 'good' as Tone, status: 'Met' },
  { label: 'Menstrual health support & education', tone: 'good' as Tone, status: 'Opt-in live' },
  { label: 'Maternity & pregnancy policy (26-week)', tone: 'good' as Tone, status: 'Adopted' },
  { label: 'Mental health provision & PFA pathway', tone: 'good' as Tone, status: 'Active' },
  { label: 'Anti-discrimination & safe-to-report', tone: 'good' as Tone, status: 'Trained' },
  { label: 'ACL injury-reduction programme', tone: 'warn' as Tone, status: '86% adherence' },
  { label: 'Safeguarding / DBS (all staff)', tone: 'good' as Tone, status: '23/23 current' },
]

const TABS = [
  { id: 'overview',  label: 'Overview',            icon: Heart },
  { id: 'acl',       label: 'Injury & ACL',        icon: Activity },
  { id: 'cycle',     label: 'Cycle & Load',        icon: Flower2 },
  { id: 'maternity', label: 'Maternity & RTP',     icon: Baby },
  { id: 'mental',    label: 'Mental Health',       icon: Brain },
  { id: 'safe',      label: 'Safeguarding',        icon: ShieldCheck },
] as const

export default function WomensPlayerWelfareHub({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const [tab, setTab] = useState<string>('overview')
  const sevToneCls = (t: Tone) => ({ background: `${tc(t)}0d`, border: `1px solid ${tc(t)}40` })

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Heart size={22} style={{ color: C.pink }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: C.text }}>Player Welfare Hub</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Injury &amp; ACL · menstrual cycle &amp; load · maternity &amp; return-to-play · mental health · safeguarding — aligned to Karen Carney Review standards</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.id; const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ appearance: 'none', border: 0, background: 'transparent', padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? '#fff' : C.text3, borderBottom: `2px solid ${active ? C.pink : 'transparent'}`, marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon size={13} strokeWidth={1.75} />{t.label}
            </button>
          )
        })}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <Kpi label="Active welfare cases" value="4" sub="1 high · 2 medium" icon={Heart} color={C.pink} tone="warn" />
            <Kpi label="ACL screening current" value="18/22" sub="4 overdue" icon={Activity} color={C.bad} tone="bad" />
            <Kpi label="Squad wellbeing" value="7.5/10" sub="17/22 checked in" icon={Brain} color={C.blue} tone="good" />
            <Kpi label="Cycle opt-in" value="14/22" sub="private · role-gated" icon={Flower2} color={C.pink} />
            <Kpi label="Maternity / RTP" value="3" sub="1 leave · 2 RTP" icon={Baby} color={C.purple} tone="info" />
            <Kpi label="Carney standards" value="100%" sub="minimum standards met" icon={ShieldCheck} color={C.good} tone="good" />
          </div>

          <Panel title="Active welfare cases" icon={Heart} right={<span className="text-xs" style={{ color: C.muted }}>{CASES.length} open</span>}>
            <div className="space-y-2.5">
              {CASES.map(c => (
                <div key={c.player} className="rounded-lg p-3" style={sevToneCls(c.tone)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2"><span className="text-sm font-semibold" style={{ color: C.text }}>{c.player}</span><Pill tone={c.tone}>{c.cat}</Pill></span>
                    <span className="text-xs font-bold" style={{ color: tc(c.tone) }}>{c.sev}</span>
                  </div>
                  <p className="text-xs" style={{ color: C.text3 }}>{c.detail}</p>
                  <p className="text-[10px] mt-1" style={{ color: C.muted }}>Actions: {c.actions}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Squad availability" icon={Users}><Donut data={AVAILABILITY} centerLabel="22" centerSub="squad" /></Panel>
            <Panel title="Welfare alerts" icon={AlertTriangle}>
              <div className="space-y-2">
                {ALERTS.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs rounded-lg p-2" style={{ background: C.panel2 }}>
                    {a.tone === 'good' ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: tc(a.tone) }} /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: tc(a.tone) }} />}
                    <span style={{ color: C.text2 }}>{a.text}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Seasonal workload vs squad wellbeing" icon={TrendingUp} right={<span className="text-[10px]" style={{ color: C.muted }}>load rising into run-in · wellbeing dipping</span>}>
            <DualLine months={MH_MONTHS} a={MH_WORKLOAD} b={MH_WELLBEING.map(v => v * 10)} aMax={100} bMax={100} aLabel="Workload" bLabel="Wellbeing" aColor={C.pink} bColor={C.good} />
          </Panel>
        </div>
      )}

      {/* INJURY & ACL */}
      {tab === 'acl' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Screenings overdue" value="4" sub="book this week" icon={Calendar} color={C.bad} tone="bad" />
            <Kpi label="High-risk players" value="3" sub="prior ACL history" icon={AlertTriangle} color={C.bad} tone="bad" />
            <Kpi label="Prevention adherence" value="86%" sub="FIFA 11+ block" icon={ClipboardCheck} color={C.good} tone="good" />
            <Kpi label="In return-to-play" value="2" sub="Turner · Davies" icon={Activity} color={C.blue} tone="info" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="ACL risk distribution" icon={Activity}><Donut data={ACL_RISK} centerLabel="22" centerSub="screened" /></Panel>
            <Panel title="FIFA 11+ prevention adherence" icon={ClipboardCheck}>
              <div className="space-y-3">
                {PREVENTION.map(p => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-xs mb-1"><span style={{ color: p.name === 'Squad average' ? C.text : C.text2, fontWeight: p.name === 'Squad average' ? 700 : 400 }}>{p.name}</span><span className="font-bold" style={{ color: tc(p.tone) }}>{p.pct}%</span></div>
                    <Bar pct={p.pct} color={tc(p.tone)} />
                    <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{p.note}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <Panel title="ACL watchlist & screening" icon={Activity} right={onNavigate && <button onClick={() => onNavigate('acl')} className="text-[11px] font-semibold" style={{ color: C.pink }}>Open ACL Risk Monitor →</button>}>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Pos', 'History', 'Risk', 'Next screening'].map(h => <th key={h} className="text-left py-2 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
              <tbody>
                {ACL_WATCH.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: i < ACL_WATCH.length - 1 ? `1px solid ${C.border}` : undefined }}>
                    <td className="py-2 font-semibold" style={{ color: C.text }}>{p.name}</td>
                    <td className="py-2" style={{ color: C.muted }}>{p.pos}</td>
                    <td className="py-2" style={{ color: C.text3 }}>{p.history}</td>
                    <td className="py-2"><Pill tone={p.tone}>{p.risk}</Pill></td>
                    <td className="py-2" style={{ color: p.next.includes('Overdue') ? C.bad : C.text3 }}>{p.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* CYCLE & LOAD */}
      {tab === 'cycle' && (
        <div className="space-y-4">
          <div className="rounded-xl p-3 flex items-start gap-2 text-xs" style={{ background: `${C.pink}10`, border: `1px solid ${C.pink}30`, color: C.pink }}>
            <Lock size={14} className="mt-0.5 shrink-0" /><span>Opt-in, encrypted and accessible only to the player, Club Doctor and Welfare Lead — never visible to coaching staff without consent. Players may revoke at any time and data is purged immediately.</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Opt-in rate" value="14/22" sub="consented" icon={Flower2} color={C.pink} />
            <Kpi label="High-risk phase today" value="3" sub="luteal — reduced load" icon={AlertTriangle} color={C.warn} tone="warn" />
            <Kpi label="ACL × cycle flags" value="2" sub="composite score" icon={Activity} color={C.bad} tone="bad" />
            <Kpi label="Auto adjustments" value="7" sub="applied today" icon={ClipboardCheck} color={C.blue} tone="info" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Phase distribution (consented)" icon={Flower2}><Donut data={PHASES} centerLabel="14" centerSub="tracked" /></Panel>
            <Panel title="Cycle × ACL composite" icon={Activity}>
              <div className="space-y-3">
                {COMPOSITE.map(c => (
                  <div key={c.name} className="rounded-lg p-3" style={sevToneCls(c.tone)}>
                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold" style={{ color: C.text }}>{c.name}</span><span className="text-sm font-black" style={{ color: tc(c.tone) }}>{c.total}/100</span></div>
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {c.parts.map(([l, v]) => <div key={l} className="rounded p-1.5 text-center" style={{ background: C.panel2 }}><div className="text-[9px]" style={{ color: C.muted }}>{l}</div><div className="text-xs font-bold" style={{ color: C.text }}>{v}</div></div>)}
                    </div>
                    <p className="text-xs" style={{ color: C.text2 }}>{c.action}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <Panel title="Today's auto-generated training adjustments" icon={ClipboardCheck} right={onNavigate && <button onClick={() => onNavigate('cycle')} className="text-[11px] font-semibold" style={{ color: C.pink }}>Open Cycle Tracking →</button>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ADJUSTMENTS.map(a => (
                <div key={a.name} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                  <div><div className="text-xs font-semibold" style={{ color: C.text }}>{a.name}</div><div className="text-[10px]" style={{ color: C.muted }}>{a.detail}</div></div>
                  <span className="text-xs font-bold" style={{ color: C.warn }}>{a.adj}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* MATERNITY & RTP */}
      {tab === 'maternity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="On maternity leave" value="1" sub="Sophie Lawson" icon={Baby} color={C.purple} tone="info" />
            <Kpi label="In return-to-play" value="2" sub="Turner · Davies" icon={Activity} color={C.blue} tone="info" />
            <Kpi label="Contract protection" value="100%" sub="salary safeguarded" icon={ShieldCheck} color={C.good} tone="good" />
            <Kpi label="RTP pathway" value="10-stage" sub="medically governed" icon={ClipboardCheck} color={C.pink} />
          </div>
          <Panel title="Maternity case" icon={Baby}>
            <div className="rounded-lg p-3" style={{ background: `${C.purple}10`, border: `1px solid ${C.purple}40` }}>
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold" style={{ color: C.text }}>Sophie Lawson — RB</span><Pill tone="info">Maternity</Pill></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {[['Leave starts', 'May 2026'], ['Expected return', 'Jan 2027'], ['Contract', 'Protected'], ['Policy', 'WSL 26-week + FIFA Art. 18quater']].map(([k, v]) => <div key={k} className="rounded p-2" style={{ background: C.panel2 }}><div className="text-[10px]" style={{ color: C.muted }}>{k}</div><div className="font-semibold" style={{ color: C.text }}>{v}</div></div>)}
              </div>
            </div>
          </Panel>
          <Panel title="Return-to-play tracker" icon={Activity} right={onNavigate && <button onClick={() => onNavigate('maternity')} className="text-[11px] font-semibold" style={{ color: C.pink }}>Open Pregnancy & RTP →</button>}>
            <div className="space-y-4">
              {RTP_PLAYERS.map(p => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5 text-xs"><span className="font-semibold" style={{ color: C.text }}>{p.name} · <span style={{ color: C.muted }}>{p.injury}</span></span><span style={{ color: C.blue }}>Phase {p.phase}/10 · ETA {p.eta}</span></div>
                  <div className="flex gap-1">
                    {RTP_PHASES.map((ph, i) => (
                      <div key={i} title={ph} className="flex-1 h-2 rounded-full" style={{ background: i < p.phase ? C.good : i === p.phase ? C.warn : C.panel2 }} />
                    ))}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: C.muted }}>Current: {RTP_PHASES[p.phase - 1]} → next: {RTP_PHASES[p.phase] ?? 'Full clearance'}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* MENTAL HEALTH */}
      {tab === 'mental' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Check-ins this month" value="17/22" sub="monthly cadence" icon={Brain} color={C.blue} tone="good" />
            <Kpi label="Average wellbeing" value="7.5/10" sub="dipping into run-in" icon={TrendingUp} color={C.warn} tone="warn" />
            <Kpi label="Active flags" value="2" sub="anxiety · rehab" icon={AlertTriangle} color={C.warn} tone="warn" />
            <Kpi label="PFA referrals" value="0" sub="this season" icon={CheckCircle2} color={C.good} tone="good" />
          </div>
          <Panel title="Wellbeing vs workload trend" icon={TrendingUp}>
            <DualLine months={MH_MONTHS} a={MH_WELLBEING.map(v => v * 10)} b={MH_WORKLOAD} aMax={100} bMax={100} aLabel="Wellbeing" bLabel="Workload" aColor={C.good} bColor={C.pink} />
            <p className="text-[10px] mt-2" style={{ color: C.muted }}>Inverse correlation flagged — proactive check-ins scheduled for the high-load run-in (Apr–May).</p>
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Open follow-ups" icon={AlertTriangle} right={onNavigate && <button onClick={() => onNavigate('mental')} className="text-[11px] font-semibold" style={{ color: C.pink }}>Open Mental Health →</button>}>
              <div className="space-y-2">
                {MH_FLAGS.map(f => (
                  <div key={f.player} className="rounded-lg p-2.5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between"><span className="text-xs font-semibold" style={{ color: C.text }}>{f.player}</span><span className="text-xs font-bold" style={{ color: C.warn }}>{f.score}/10</span></div>
                    <div className="text-[11px]" style={{ color: C.text3 }}>{f.flag}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>Plan: {f.followup}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Support services" icon={Stethoscope}>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORT.map(s => (
                  <div key={s.name} className="rounded-lg p-2.5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                    <div className="text-xs font-semibold" style={{ color: C.text }}>{s.name}</div>
                    <div className="text-[10px]" style={{ color: C.muted }}>{s.role} · {s.type}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* SAFEGUARDING */}
      {tab === 'safe' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${C.good}14, ${C.cardAlt})`, border: `1px solid ${C.good}40` }}>
            <div className="flex items-center gap-2"><ShieldCheck size={18} style={{ color: C.good }} /><span className="text-sm font-bold" style={{ color: C.text }}>Karen Carney Review — minimum standards met</span></div>
            <p className="text-xs mt-1" style={{ color: C.muted }}>Independent review of women&apos;s football: mandatory welfare, medical, maternity and safeguarding standards for a professional women&apos;s club.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {CARNEY.map(c => (
              <div key={c.label} className="flex items-center justify-between rounded-lg p-3" style={{ background: C.cardAlt, border: `1px solid ${C.border}` }}>
                <span className="flex items-center gap-2 text-xs" style={{ color: C.text2 }}>{c.tone === 'good' ? <CheckCircle2 size={14} style={{ color: C.good }} /> : <AlertTriangle size={14} style={{ color: C.warn }} />}{c.label}</span>
                <Pill tone={c.tone}>{c.status}</Pill>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Player care & integration" icon={Users}>
              <ul className="space-y-1.5 text-xs" style={{ color: C.text2 }}>
                {['New-signing onboarding: housing, banking, GP registration, club liaison', 'Overseas players: visa, language support and family relocation tracked', 'PFA wellbeing line shared with every player at signing', 'Exit & de-registration welfare check on every departure'].map(t => <li key={t} className="flex items-start gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: C.good }} />{t}</li>)}
              </ul>
            </Panel>
            <Panel title="Reporting & contacts" icon={ShieldCheck}>
              <div className="space-y-2 text-xs">
                {[['Welfare Lead', 'Nina Walsh'], ['Player Care & Safeguarding Officer', 'Megan Doyle'], ['Club Doctor', 'Dr Anna Reid'], ['Independent reporting line', 'NSPCC / FA safeguarding']].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg p-2" style={{ background: C.panel2 }}><span style={{ color: C.muted }}>{k}</span><span className="font-semibold" style={{ color: C.text }}>{v}</span></div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}
