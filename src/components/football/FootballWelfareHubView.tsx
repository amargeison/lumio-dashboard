'use client'

// Men's Pro — Player Welfare Hub. Welfare command centre mirroring the women's
// flagship: active welfare cases, squad availability, seasonal workload vs
// wellbeing, welfare alerts; with summary tabs that cross-link to the dedicated
// Injury Risk, Load & Recovery, Return-to-Play, Mental Health and Safeguarding
// modules. Men's data, blue accent. Demo only — illustrative.

import { useState } from 'react'
import {
  Heart, Activity, ShieldCheck, Brain, BatteryCharging, HeartPulse, Stethoscope,
  AlertTriangle, CheckCircle2, ClipboardCheck, TrendingUp, Users, Calendar,
} from 'lucide-react'

const C = {
  card: '#0D1017', cardAlt: '#111318', panel2: '#0B0D12',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', muted: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', blue: '#2563EB', blueDeep: '#003DA5', purple: '#8B5CF6', accent: '#003DA5',
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
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}>{Icon && <Icon size={14} style={{ color: C.blue }} />}{title}</span>
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

// ─── Data (men's squad) ─────────────────────────────────────────────────────
type CaseT = { player: string; cat: string; tone: Tone; sev: string; detail: string; actions: string }
const CASES: CaseT[] = [
  { player: 'Chris Nwosu', cat: 'Injury Risk', tone: 'bad', sev: 'High', detail: 'Hamstring grade 2 (Apr 2026) with recurrence history. Composite injury-risk red today. Sprint exposure capped.', actions: 'Reduced load · extended reconditioning · daily monitoring · prehab flagged' },
  { player: 'Joe McDonnell', cat: 'Injury · Shoulder', tone: 'warn', sev: 'Medium', detail: 'AC-joint injury (Mar 2026). Rehab behind protocol — specialist review booked.', actions: 'Rotator-cuff programme · specialist referral · GK-specific battery' },
  { player: 'Confidential', cat: 'Mental Health', tone: 'warn', sev: 'Medium', detail: 'Clinician-led support active following a recent bereavement. Progress monitored; engagement confidential.', actions: 'Weekly clinician sessions · welfare lead notified · PFA line shared' },
  { player: 'Isaac Kemp', cat: 'ACL · RTP', tone: 'warn', sev: 'Medium', detail: 'ACL reconstruction Dec 2025. Reconditioning phase (3 of 5). No competitive match until clearance.', actions: 'Graduated return protocol · modified prehab · medical sign-off pending' },
]

const AVAILABILITY = [
  { label: 'Available', value: 19, color: C.good },
  { label: 'Load-managed', value: 2, color: C.warn },
  { label: 'Return-to-play', value: 3, color: C.blue },
  { label: 'Suspended', value: 1, color: C.purple },
]

const ALERTS = [
  { tone: 'bad' as Tone, text: 'Injury screening overdue for 3 players (Nwosu, Kemp, Fletcher) — book this week.' },
  { tone: 'bad' as Tone, text: 'Chris Nwosu composite injury-risk 91/100 — cap at 60% load, no repeated-sprint drills today.' },
  { tone: 'warn' as Tone, text: '1 mental-health follow-up open — welfare lead actioning (confidential).' },
  { tone: 'warn' as Tone, text: 'Joe McDonnell shoulder rehab behind protocol — specialist review booked.' },
  { tone: 'good' as Tone, text: 'PL / EFL safeguarding & welfare minimum standards: all criteria met this quarter.' },
]

const RISK_DIST = [
  { label: 'High', value: 2, color: C.bad },
  { label: 'Medium', value: 3, color: C.warn },
  { label: 'Low', value: 20, color: C.good },
]
const WATCH = [
  { name: 'Chris Nwosu', pos: 'ST', history: 'Hamstring x2 (2024, 2025)', risk: 'High', tone: 'bad' as Tone, next: 'Overdue · Feb' },
  { name: 'Isaac Kemp', pos: 'CB', history: 'ACL reconstruction (2024)', risk: 'RTP', tone: 'warn' as Tone, next: 'Phase 3 / 5' },
  { name: 'Tom Fletcher', pos: 'LB', history: 'Calf strain (2025)', risk: 'Medium', tone: 'warn' as Tone, next: 'Overdue · Apr' },
  { name: 'Paul Granger', pos: 'CDM', history: 'Groin (2025)', risk: 'Medium', tone: 'warn' as Tone, next: 'May 2026' },
  { name: 'Joe McDonnell', pos: 'GK', history: 'Shoulder (2026)', risk: 'Medium', tone: 'warn' as Tone, next: 'Rehab review' },
]
const PREVENTION = [
  { name: 'Chris Nwosu', pct: 33, tone: 'bad' as Tone, note: 'Missed Nordic + hamstring prehab — flagged with Head Physio' },
  { name: 'Tom Fletcher', pct: 78, tone: 'warn' as Tone, note: 'One miss this week' },
  { name: 'Isaac Kemp', pct: 94, tone: 'good' as Tone, note: 'Modified prehab integrated with RTP' },
  { name: 'Squad average', pct: 88, tone: 'good' as Tone, note: 'Nordics / FIFA 11+ block (18 sessions)' },
]

const READINESS = [
  { name: 'Chris Nwosu', pos: 'ST', acwr: '1.62', sleep: '6.2h', readiness: 52, tone: 'bad' as Tone },
  { name: 'Tom Fletcher', pos: 'LB', acwr: '1.38', sleep: '6.8h', readiness: 64, tone: 'warn' as Tone },
  { name: 'Kyle Osei', pos: 'RB', acwr: '0.78', sleep: '7.2h', readiness: 66, tone: 'warn' as Tone },
  { name: 'Dean Morris', pos: 'LW', acwr: '1.10', sleep: '7.8h', readiness: 88, tone: 'good' as Tone },
  { name: 'Daniel Webb', pos: 'CB', acwr: '1.05', sleep: '8.0h', readiness: 90, tone: 'good' as Tone },
]

const RTP_PHASES = ['Acute / protect', 'Recovery', 'Reconditioning', 'Return to train', 'Return to play']
const RTP_PLAYERS = [
  { name: 'Isaac Kemp', injury: 'ACL reconstruction', phase: 3, eta: 'Jul 2026' },
  { name: 'Chris Nwosu', injury: 'Hamstring grade 2', phase: 2, eta: 'May 2026' },
  { name: 'Tom Fletcher', injury: 'Calf strain', phase: 4, eta: 'Apr 2026' },
]

const MH_MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
const MH_WORKLOAD = [42, 58, 66, 72, 62, 52, 66, 80, 86, 76]
const MH_WELLBEING = [8.3, 8.0, 7.8, 7.6, 7.9, 8.1, 7.7, 7.2, 6.8, 7.0]
const MH_FLAGS = [
  { player: 'Confidential (first team)', score: 5, flag: 'Bereavement — clinician-led support', followup: 'Weekly clinician sessions' },
  { player: 'Confidential (loanee)', score: 7, flag: 'Relocation / isolation', followup: 'Buddy + raised check-in cadence' },
]
const SUPPORT = [
  { name: 'Sporting Chance Clinic', role: 'Clinical partner', type: 'External' },
  { name: 'PFA Wellbeing line', role: 'Player support line', type: 'External' },
  { name: 'Dr R. Adeyemi', role: 'Club psychologist', type: 'In-house' },
  { name: 'Mind partnership', role: 'Education + MHFA training', type: 'External' },
]

const STANDARDS = [
  { label: 'Designated safeguarding officer in post', tone: 'good' as Tone, status: 'In place' },
  { label: 'EPPP academy welfare standards', tone: 'good' as Tone, status: 'Met' },
  { label: 'Mental-health provision & PFA pathway', tone: 'good' as Tone, status: 'Active' },
  { label: 'Injury-reduction (Nordics / FIFA 11+)', tone: 'warn' as Tone, status: '88% adherence' },
  { label: 'Concussion / HIA protocol (GRTP)', tone: 'good' as Tone, status: 'Live' },
  { label: 'Anti-discrimination & safe-to-report', tone: 'good' as Tone, status: 'Trained' },
  { label: 'Player-care & integration (foreign players)', tone: 'good' as Tone, status: 'Active' },
  { label: 'Safeguarding / DBS (all staff)', tone: 'good' as Tone, status: '98% current' },
]

const TABS = [
  { id: 'overview', label: 'Overview', icon: Heart },
  { id: 'injury', label: 'Injury & ACL', icon: Activity },
  { id: 'load', label: 'Load & Recovery', icon: BatteryCharging },
  { id: 'rtp', label: 'Return-to-Play', icon: HeartPulse },
  { id: 'mental', label: 'Mental Health', icon: Brain },
  { id: 'safe', label: 'Safeguarding', icon: ShieldCheck },
] as const

export default function FootballWelfareHubView({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const [tab, setTab] = useState<string>('overview')
  const sevToneCls = (t: Tone) => ({ background: `${tc(t)}0d`, border: `1px solid ${tc(t)}40` })

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Heart size={22} style={{ color: C.blue }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: C.text }}>Player Welfare Hub</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Injury &amp; ACL · load &amp; recovery · return-to-play · mental health · safeguarding — aligned to PL / EFL welfare standards</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.id; const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ appearance: 'none', border: 0, background: 'transparent', padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? '#fff' : C.text3, borderBottom: `2px solid ${active ? C.blue : 'transparent'}`, marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon size={13} strokeWidth={1.75} />{t.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <Kpi label="Active welfare cases" value="4" sub="1 high · 2 medium" icon={Heart} color={C.blue} tone="warn" />
            <Kpi label="Injury screening current" value="22/25" sub="3 overdue" icon={Activity} color={C.bad} tone="bad" />
            <Kpi label="Squad wellbeing" value="7.6/10" sub="23/25 checked in" icon={Brain} color={C.blue} tone="good" />
            <Kpi label="In rehab" value="5" sub="2 phase 4–5" icon={BatteryCharging} color={C.warn} tone="warn" />
            <Kpi label="Return-to-play" value="3" sub="Kemp · Nwosu · Fletcher" icon={HeartPulse} color={C.purple} tone="info" />
            <Kpi label="Standards met" value="100%" sub="PL / EFL minimum standards" icon={ShieldCheck} color={C.good} tone="good" />
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
            <Panel title="Squad availability" icon={Users}><Donut data={AVAILABILITY} centerLabel="25" centerSub="squad" /></Panel>
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
            <DualLine months={MH_MONTHS} a={MH_WORKLOAD} b={MH_WELLBEING.map(v => v * 10)} aMax={100} bMax={100} aLabel="Workload" bLabel="Wellbeing" aColor={C.blue} bColor={C.good} />
          </Panel>
        </div>
      )}

      {tab === 'injury' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Screenings overdue" value="3" sub="book this week" icon={Calendar} color={C.bad} tone="bad" />
            <Kpi label="High-risk players" value="2" sub="injury history + load" icon={AlertTriangle} color={C.bad} tone="bad" />
            <Kpi label="Prevention adherence" value="88%" sub="Nordics / FIFA 11+" icon={ClipboardCheck} color={C.good} tone="good" />
            <Kpi label="In return-to-play" value="3" sub="Kemp · Nwosu · Fletcher" icon={Activity} color={C.blue} tone="info" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Injury risk distribution" icon={Activity}><Donut data={RISK_DIST} centerLabel="25" centerSub="screened" /></Panel>
            <Panel title="Prevention adherence" icon={ClipboardCheck}>
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
          <Panel title="Injury watchlist & screening" icon={Activity} right={onNavigate && <button onClick={() => onNavigate('injury-risk')} className="text-[11px] font-semibold" style={{ color: C.blue }}>Open Injury Risk Monitor →</button>}>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Pos', 'History', 'Risk', 'Next screening'].map(h => <th key={h} className="text-left py-2 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
              <tbody>
                {WATCH.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: i < WATCH.length - 1 ? `1px solid ${C.border}` : undefined }}>
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

      {tab === 'load' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Avg readiness" value="72%" sub="squad, this morning" icon={BatteryCharging} color={C.warn} tone="warn" />
            <Kpi label="Red-zone players" value="1" sub="readiness < 60%" icon={AlertTriangle} color={C.bad} tone="bad" />
            <Kpi label="Avg ACWR" value="1.17" sub="sweet spot 0.8–1.3" icon={Activity} color={C.blue} tone="info" />
            <Kpi label="Avg sleep" value="7.3h" sub="last 7 nights" icon={ClipboardCheck} color={C.good} tone="good" />
          </div>
          <Panel title="Squad readiness" icon={BatteryCharging} right={onNavigate && <button onClick={() => onNavigate('load-recovery')} className="text-[11px] font-semibold" style={{ color: C.blue }}>Open Load &amp; Recovery →</button>}>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Pos', 'ACWR', 'Sleep', 'Readiness'].map(h => <th key={h} className="text-left py-2 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
              <tbody>
                {READINESS.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: i < READINESS.length - 1 ? `1px solid ${C.border}` : undefined }}>
                    <td className="py-2 font-semibold" style={{ color: C.text }}>{p.name}</td>
                    <td className="py-2" style={{ color: C.muted }}>{p.pos}</td>
                    <td className="py-2 font-mono" style={{ color: C.text3 }}>{p.acwr}</td>
                    <td className="py-2 font-mono" style={{ color: C.text3 }}>{p.sleep}</td>
                    <td className="py-2"><span className="flex items-center gap-2"><span style={{ width: 60 }}><Bar pct={p.readiness} color={tc(p.tone)} /></span><span className="font-bold" style={{ color: tc(p.tone) }}>{p.readiness}%</span></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {tab === 'rtp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Players in rehab" value="5" sub="active cases" icon={HeartPulse} color={C.blue} tone="info" />
            <Kpi label="On-track" value="80%" sub="vs RTP protocol" icon={CheckCircle2} color={C.good} tone="good" />
            <Kpi label="GRTP pending" value="2" sub="clearances outstanding" icon={ClipboardCheck} color={C.warn} tone="warn" />
            <Kpi label="RTP pathway" value="5-phase" sub="medically governed" icon={Activity} color={C.purple} />
          </div>
          <Panel title="Return-to-play tracker" icon={HeartPulse} right={onNavigate && <button onClick={() => onNavigate('return-to-play')} className="text-[11px] font-semibold" style={{ color: C.blue }}>Open Injury &amp; Return-to-Play →</button>}>
            <div className="space-y-4">
              {RTP_PLAYERS.map(p => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5 text-xs"><span className="font-semibold" style={{ color: C.text }}>{p.name} · <span style={{ color: C.muted }}>{p.injury}</span></span><span style={{ color: C.blue }}>Phase {p.phase}/5 · ETA {p.eta}</span></div>
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

      {tab === 'mental' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Check-in completion" value="91%" sub="squad coverage" icon={Brain} color={C.blue} tone="good" />
            <Kpi label="Average wellbeing" value="7.6/10" sub="dipping into run-in" icon={TrendingUp} color={C.warn} tone="warn" />
            <Kpi label="Open flags" value="2" sub="supported / monitored" icon={AlertTriangle} color={C.warn} tone="warn" />
            <Kpi label="Utilisation (12 mo)" value="18%" sub="anonymous" icon={CheckCircle2} color={C.good} tone="good" />
          </div>
          <Panel title="Wellbeing vs workload trend" icon={TrendingUp}>
            <DualLine months={MH_MONTHS} a={MH_WELLBEING.map(v => v * 10)} b={MH_WORKLOAD} aMax={100} bMax={100} aLabel="Wellbeing" bLabel="Workload" aColor={C.good} bColor={C.blue} />
            <p className="text-[10px] mt-2" style={{ color: C.muted }}>Inverse correlation flagged — proactive check-ins scheduled for the high-load run-in (Apr–May).</p>
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Open follow-ups" icon={AlertTriangle} right={onNavigate && <button onClick={() => onNavigate('mental-health')} className="text-[11px] font-semibold" style={{ color: C.blue }}>Open Mental Health →</button>}>
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

      {tab === 'safe' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${C.good}14, ${C.cardAlt})`, border: `1px solid ${C.good}40` }}>
            <div className="flex items-center gap-2"><ShieldCheck size={18} style={{ color: C.good }} /><span className="text-sm font-bold" style={{ color: C.text }}>PL / EFL welfare &amp; safeguarding — minimum standards met</span></div>
            <p className="text-xs mt-1" style={{ color: C.muted }}>Mandatory welfare, medical, academy (EPPP) and safeguarding standards for a professional men&apos;s club.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {STANDARDS.map(c => (
              <div key={c.label} className="flex items-center justify-between rounded-lg p-3" style={{ background: C.cardAlt, border: `1px solid ${C.border}` }}>
                <span className="flex items-center gap-2 text-xs" style={{ color: C.text2 }}>{c.tone === 'good' ? <CheckCircle2 size={14} style={{ color: C.good }} /> : <AlertTriangle size={14} style={{ color: C.warn }} />}{c.label}</span>
                <Pill tone={c.tone}>{c.status}</Pill>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Player care & integration" icon={Users} right={onNavigate && <button onClick={() => onNavigate('player-integration')} className="text-[11px] font-semibold" style={{ color: C.blue }}>Open Player Integration →</button>}>
              <ul className="space-y-1.5 text-xs" style={{ color: C.text2 }}>
                {['New-signing onboarding: housing, banking, GP registration, club liaison', 'Overseas players: visa / GBE, language support and family relocation tracked', 'PFA wellbeing line shared with every player at signing', 'Exit & de-registration welfare check on every departure'].map(t => <li key={t} className="flex items-start gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: C.good }} />{t}</li>)}
              </ul>
            </Panel>
            <Panel title="Reporting & contacts" icon={ShieldCheck} right={onNavigate && <button onClick={() => onNavigate('safeguarding-ops')} className="text-[11px] font-semibold" style={{ color: C.blue }}>Open Safeguarding Ops →</button>}>
              <div className="space-y-2 text-xs">
                {[['Designated Safeguarding Officer', 'Karen Hughes'], ['Academy Safeguarding Lead', 'Paul Reeves'], ['Club Doctor', 'Dr Sarah Phillips'], ['Independent reporting line', 'NSPCC / FA safeguarding']].map(([k, v]) => (
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
