'use client'

import { Fragment, useState } from 'react'
import {
  Brain, AlertTriangle, ShieldCheck, FileText, Users, GraduationCap,
  CheckCircle2, XCircle, Clock, ExternalLink,
} from 'lucide-react'

const C = {
  bg: '#07080F', card: '#0D1017', cardAlt: '#111318',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', muted: '#9CA3AF', dim: '#6B7280',
  primary: '#003DA5', gold: '#F1C40F',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6',
} as const

type Tab = 'active' | 'history' | 'grtp' | 'baseline' | 'compliance' | 'education'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'active',     label: 'Active Cases',         icon: AlertTriangle },
  { id: 'history',    label: 'Player History',       icon: Users },
  { id: 'grtp',       label: 'GRTP Protocol',        icon: Clock },
  { id: 'baseline',   label: 'Baseline Testing',     icon: FileText },
  { id: 'compliance', label: 'Compliance & Audit',   icon: ShieldCheck },
  { id: 'education',  label: 'Education & Training', icon: GraduationCap },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>{children}</h3>
}

function Pill({ children, color = C.muted }: { children: React.ReactNode; color?: string }) {
  return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}>{children}</span>
}

// ─── ACTIVE CASES ────────────────────────────────────────────────────────────

const ACTIVE_CASES = [
  {
    player: 'Brodi Chen',  injury: '14 Apr 2026', day: 6, pathway: 'Standard Care', stage: 2,
    stageLabel: 'Light aerobic',  symptoms: 'Mild headache resolving · cleared by Day 5',
    nextAction: 'SCAT5 review tomorrow before Stage 3', clearedBy: '—',
    color: C.amber,
  },
  {
    player: 'Isaac Kemp',     injury: '08 Apr 2026', day: 12, pathway: 'Enhanced Care', stage: 4,
    stageLabel: 'Non-contact training', symptoms: 'Asymptomatic · 5 days clear',
    nextAction: 'Independent doctor review pre-Stage 5', clearedBy: 'Dr S. Hendricks',
    color: C.blue,
  },
  {
    player: 'Connor Walsh',         injury: '02 Apr 2026', day: 18, pathway: 'Enhanced Care', stage: 5,
    stageLabel: 'Full contact (pending review)', symptoms: 'Asymptomatic · 11 days clear',
    nextAction: 'Awaiting independent neurology sign-off', clearedBy: 'Dr S. Hendricks',
    color: C.amber,
  },
]

const STAGE_NAMES = [
  '1 · Symptom-limited rest',
  '2 · Light aerobic',
  '3 · Sport-specific exercise',
  '4 · Non-contact training',
  '5 · Full contact practice',
  '6 · Return to play',
]

function ActiveCasesTab({ onAction }: { onAction: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Brain size={18} style={{ color: C.amber }} />
            <div>
              <div className="text-sm font-bold" style={{ color: C.text }}>3 players in active GRTP protocol</div>
              <div className="text-xs mt-0.5" style={{ color: C.muted }}>1 Standard Care · 2 Enhanced Care</div>
            </div>
          </div>
          <button onClick={() => onAction('log-concussion')}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: C.amber, color: '#000' }}>
            + Log New Concussion
          </button>
        </div>
      </div>

      <Card>
        <SectionTitle>Active Cases</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Player</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Injury</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Day</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Pathway</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Stage</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Symptoms</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Next Action</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Cleared By</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVE_CASES.map((c, i) => (
              <Fragment key={c.player}>
                <tr onClick={() => setExpanded(expanded === c.player ? null : c.player)}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
                  <td className="px-2 py-2.5 font-semibold" style={{ color: C.text }}>{c.player}</td>
                  <td className="px-2 py-2.5 font-mono" style={{ color: C.gold }}>{c.injury}</td>
                  <td className="px-2 py-2.5 font-mono" style={{ color: C.muted }}>D{c.day}</td>
                  <td className="px-2 py-2.5"><Pill color={c.pathway === 'Enhanced Care' ? C.blue : C.amber}>{c.pathway}</Pill></td>
                  <td className="px-2 py-2.5"><Pill color={c.color}>S{c.stage} · {c.stageLabel}</Pill></td>
                  <td className="px-2 py-2.5" style={{ color: C.muted }}>{c.symptoms}</td>
                  <td className="px-2 py-2.5" style={{ color: C.muted }}>{c.nextAction}</td>
                  <td className="px-2 py-2.5" style={{ color: C.muted }}>{c.clearedBy}</td>
                </tr>
                {expanded === c.player && (
                  <tr>
                    <td colSpan={8} style={{ backgroundColor: C.cardAlt, padding: 16 }}>
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: C.gold }}>GRTP Timeline · 24-hour minimum gates (48h for U19)</div>
                      <div className="grid grid-cols-6 gap-2">
                        {STAGE_NAMES.map((s, si) => {
                          const idx = si + 1
                          const done = idx < c.stage
                          const current = idx === c.stage
                          const fg = done ? C.green : current ? c.color : C.dim
                          return (
                            <div key={si} className="rounded-lg p-2.5" style={{ backgroundColor: '#0a0c14', border: `1px solid ${current ? fg : C.border}` }}>
                              <div className="flex items-center gap-1 mb-1">
                                {done ? <CheckCircle2 size={11} style={{ color: fg }} /> : current ? <Clock size={11} style={{ color: fg }} /> : <span className="w-[11px] h-[11px] rounded-full" style={{ border: `1.5px solid ${fg}` }} />}
                                <span className="text-[10px] font-bold" style={{ color: fg }}>STAGE {idx}</span>
                              </div>
                              <div className="text-[10px]" style={{ color: done || current ? C.text : C.dim }}>{s.split('· ')[1]}</div>
                              {done && <div className="text-[9px] mt-1 font-mono" style={{ color: C.muted }}>SCAT5 ✓</div>}
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] mt-3" style={{ color: C.dim }}>Click a row to expand the GRTP timeline.</p>
      </Card>
    </div>
  )
}

// ─── PLAYER HISTORY ──────────────────────────────────────────────────────────

const SQUAD_HISTORY = [
  { player: 'Jordan Hayes',     pos: 'GK',  count: 0, last: '—',          daysLost: 0,  flag: false },
  { player: 'Tom Fletcher',      pos: 'LB',  count: 1, last: '12 Sep 2024', daysLost: 14, flag: false },
  { player: 'Daniel Webb',       pos: 'CB',  count: 0, last: '—',          daysLost: 0,  flag: false },
  { player: 'Marcus Reid',      pos: 'CB',  count: 2, last: '08 Apr 2026', daysLost: 32, flag: false },
  { player: 'Isaac Kemp',     pos: 'CB',  count: 1, last: '08 Apr 2026', daysLost: 18, flag: false },
  { player: 'Brodi Chen',      pos: 'CB',  count: 2, last: '14 Apr 2026', daysLost: 24, flag: true  },
  { player: 'Liam Barker',     pos: 'CM',  count: 0, last: '—',          daysLost: 0,  flag: false },
  { player: 'Connor Walsh',         pos: 'CM',  count: 1, last: '02 Apr 2026', daysLost: 21, flag: false },
  { player: 'Myles Okafor',    pos: 'LW',  count: 0, last: '—',          daysLost: 0,  flag: false },
  { player: 'Sam Porter',     pos: 'ST',  count: 0, last: '—',          daysLost: 0,  flag: false },
]

function PlayerHistoryTab() {
  const [search, setSearch] = useState('')
  const filtered = SQUAD_HISTORY.filter(p => p.player.toLowerCase().includes(search.toLowerCase()))
  const flagged = SQUAD_HISTORY.filter(p => p.flag).length

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <SectionTitle>Squad Concussion History</SectionTitle>
          <div className="flex items-center gap-3">
            {flagged > 0 && <Pill color={C.red}>{flagged} flagged · multiple concussions in 12mo</Pill>}
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search player..."
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: C.cardAlt, color: C.text, border: `1px solid ${C.border}`, outline: 'none' }} />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Player</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Pos</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Count (career)</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Most Recent</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Cumulative Days Lost</th>
              <th className="text-left px-3 py-2 font-semibold uppercase tracking-wider text-[10px]">Flag</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.player} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : undefined }}>
                <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{p.player}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{p.pos}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: p.count > 1 ? C.amber : C.muted }}>{p.count}</td>
                <td className="px-3 py-2.5" style={{ color: C.muted }}>{p.last}</td>
                <td className="px-3 py-2.5 font-mono" style={{ color: p.daysLost > 20 ? C.amber : C.muted }}>{p.daysLost}</td>
                <td className="px-3 py-2.5">{p.flag ? <Pill color={C.red}>2x in 12mo</Pill> : <Pill color={C.green}>OK</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] mt-3" style={{ color: C.dim }}>Click a player to view full event timeline (SCAT5 scores, stage progressions, return dates).</p>
      </Card>
    </div>
  )
}

// ─── GRTP PROTOCOL ───────────────────────────────────────────────────────────

function GRTPTab() {
  const [pathway, setPathway] = useState<'standard' | 'enhanced'>('standard')

  const stages = [
    { n: 1, name: 'Symptom-limited activity', desc: 'Daily activities that do not provoke symptoms · stationary bike OK · walking OK', minHours: 24 },
    { n: 2, name: 'Light aerobic exercise',   desc: 'Walking, stationary bike at low-moderate intensity. No resistance training.',   minHours: 24 },
    { n: 3, name: 'Sport-specific exercise',  desc: 'Running drills, no head impact. Building intensity.',                          minHours: 24 },
    { n: 4, name: 'Non-contact training',     desc: 'Passing drills, complex training. Resistance training may be added.',          minHours: 24 },
    { n: 5, name: 'Full contact practice',    desc: 'Following medical clearance, normal training activities. Restore confidence.', minHours: 24 },
    { n: 6, name: 'Return to sport',          desc: 'Match play. Independent doctor sign-off required.',                            minHours: 0  },
  ]
  const minDaysStandard = '14 days initial rest + 6 stages × 24h = ~20 days minimum'
  const minDaysEnhanced = '24-48hr initial rest + 6 stages × 24h = ~9 days minimum (only available with full ATMMiF compliance)'

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Pathway Selection</SectionTitle>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setPathway('standard')}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: pathway === 'standard' ? C.amber : C.cardAlt, color: pathway === 'standard' ? '#000' : C.muted, border: `1px solid ${pathway === 'standard' ? C.amber : C.border}` }}>
            Standard Care (default)
          </button>
          <button onClick={() => setPathway('enhanced')}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: pathway === 'enhanced' ? C.blue : C.cardAlt, color: pathway === 'enhanced' ? '#fff' : C.muted, border: `1px solid ${pathway === 'enhanced' ? C.blue : C.border}` }}>
            Enhanced Care
          </button>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
          <div className="text-[11px] font-semibold mb-1" style={{ color: pathway === 'enhanced' ? C.blue : C.amber }}>
            Minimum days to RTP
          </div>
          <div className="text-xs" style={{ color: C.text }}>
            {pathway === 'standard' ? minDaysStandard : minDaysEnhanced}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>6-Stage GRTP Protocol</SectionTitle>
        <div className="space-y-2">
          {stages.map((s, i) => (
            <div key={s.n} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-center font-black text-sm shrink-0"
                style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${C.primary}33`, color: C.primary, border: `1px solid ${C.primary}` }}>
                {s.n}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: C.text }}>{s.name}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>{s.desc}</div>
              </div>
              <div className="text-[11px] font-mono shrink-0 self-center" style={{ color: C.gold }}>
                {s.minHours > 0 ? `≥ ${s.minHours}h gate` : 'Doctor sign-off'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Active Case Walkthrough — Connor Walsh (Enhanced Care · D18)</SectionTitle>
        <div className="space-y-2">
          {[
            { stage: 1, dt: '02 Apr 09:30', note: 'Initial rest period · 48h', scat5: '23/22 baseline', sign: 'Dr S. Hendricks' },
            { stage: 2, dt: '04 Apr 09:30', note: 'Light aerobic — bike 20min @ 60% HRmax', scat5: '21/22 (-2)', sign: 'Physio L. Carter' },
            { stage: 3, dt: '06 Apr 10:00', note: 'Sport-specific running drills · symptom-free', scat5: '22/22', sign: 'Physio L. Carter' },
            { stage: 4, dt: '09 Apr 10:00', note: 'Non-contact passing · resistance reintroduced', scat5: '22/22', sign: 'Dr S. Hendricks' },
            { stage: 5, dt: 'PENDING', note: 'Awaiting independent neurology sign-off (Dr R. Patel)', scat5: '22/22', sign: '—' },
          ].map((p, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: i < 4 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-[10px] font-bold uppercase tracking-wider w-12 shrink-0" style={{ color: C.gold }}>S{p.stage}</span>
              <span className="text-[11px] font-mono w-28 shrink-0" style={{ color: C.muted }}>{p.dt}</span>
              <span className="text-xs flex-1" style={{ color: C.text }}>{p.note}</span>
              <span className="text-[11px] font-mono w-20 shrink-0" style={{ color: C.muted }}>{p.scat5}</span>
              <span className="text-[11px] w-32 shrink-0" style={{ color: C.dim }}>{p.sign}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── BASELINE TESTING ────────────────────────────────────────────────────────

const BASELINES = [
  ...['Jordan Hayes','Joe McDonnell','Tom Fletcher','Daniel Webb','Marcus Reid','Isaac Kemp','Joe Lewis','Kyle Osei','Liam Barker','Connor Walsh','Ryan Cole','Paul Granger','Myles Okafor','Zack Bright','Delano Ashton','James Tilley','Dean Morris','Sam Porter','Antwoine Rowe','Brodi Chen','Lucas Ferrari','Owen Hartley','Cameron Bull'].map(n => ({ player: n, last: '12 Aug 2025', months: 8, status: 'green' as const })),
  { player: 'Levi Adeyemi', last: '02 Mar 2025', months: 14, status: 'amber' as const },
  { player: 'Marcos Pereira (recent signing)', last: '—', months: 99, status: 'red' as const },
]

function BaselineTab({ onAction }: { onAction: (id: string) => void }) {
  const green = BASELINES.filter(b => b.status === 'green').length
  const amber = BASELINES.filter(b => b.status === 'amber').length
  const red   = BASELINES.filter(b => b.status === 'red').length

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
        <div>
          <div className="text-sm font-bold" style={{ color: C.text }}>{green} / {BASELINES.length} squad members have valid baseline SCAT5 (within 12 months)</div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>{amber} approaching expiry · {red} require new baseline</div>
        </div>
        <button onClick={() => onAction('schedule-baseline')}
          className="px-4 py-2 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: C.green, color: '#000' }}>
          + Schedule Baseline Test
        </button>
      </div>

      <Card>
        <SectionTitle>SCAT5 Baseline Records</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {BASELINES.map(b => {
            const c = b.status === 'green' ? C.green : b.status === 'amber' ? C.amber : C.red
            return (
              <div key={b.player} className="rounded-lg p-2.5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${c}55` }}>
                <div className="text-[11px] font-semibold truncate" style={{ color: C.text }}>{b.player}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-mono" style={{ color: C.muted }}>{b.last}</span>
                  <Pill color={c}>{b.status === 'green' ? 'Valid' : b.status === 'amber' ? `${b.months}mo` : 'Required'}</Pill>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle>SCAT5 Domain Breakdown — Sample (Marcus Reid · last test 12 Aug 2025)</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { domain: 'Symptoms total',     score: '22/22', sub: 'No baseline symptoms' },
            { domain: 'Symptom severity',   score: '0/132', sub: 'Asymptomatic' },
            { domain: 'Orientation',        score: '5/5',   sub: 'Full' },
            { domain: 'Immediate memory',   score: '15/15', sub: '5 of 5 across 3 trials' },
            { domain: 'Concentration',      score: '5/5',   sub: 'Digits + months reverse' },
            { domain: 'Delayed recall',     score: '5/5',   sub: '10-min delay' },
            { domain: 'Total SAC',          score: '30/30', sub: 'Standardised Assessment of Concussion' },
            { domain: 'mBESS (modified)',   score: '2 errors', sub: 'Modified Balance Error Scoring' },
          ].map((d, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>{d.domain}</div>
              <div className="text-base font-bold mt-1" style={{ color: C.text }}>{d.score}</div>
              <div className="text-[10px] mt-1" style={{ color: C.muted }}>{d.sub}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── COMPLIANCE & AUDIT ──────────────────────────────────────────────────────

function ComplianceTab({ onAction }: { onAction: (id: string) => void }) {
  const cards = [
    {
      title: '1. Qualified Medical Lead',
      icon: ShieldCheck,
      status: 'pass',
      lines: [
        { l: 'Doctor', v: 'Dr Sarah Hendricks' },
        { l: 'GMC Number', v: '7204881' },
        { l: 'ATMMiF qualification', v: 'Valid · expires 14 Mar 2027' },
        { l: 'Concussion management training', v: 'Current · refresher Sep 2025' },
      ],
    },
    {
      title: '2. Structured Concussion Programme',
      icon: FileText,
      status: 'pass',
      lines: [
        { l: 'Programme document', v: 'v3.2' },
        { l: 'Adopted', v: '14 Sep 2025' },
        { l: 'Last clinical multimodal review', v: '02 Apr 2026' },
        { l: 'Next scheduled review', v: '02 Oct 2026' },
      ],
    },
    {
      title: '3. Multi-Disciplinary Team Access',
      icon: Users,
      status: 'pass',
      lines: [
        { l: 'Neuropsychology', v: 'Dr A. Khan · last consult 18 Mar 2026' },
        { l: 'Neurology', v: 'Dr R. Patel · last consult 22 Feb 2026' },
        { l: 'Neurosurgery (on-call)', v: "St Hartwell's NHS Trust partnership" },
      ],
    },
    {
      title: '4. Education Programme',
      icon: GraduationCap,
      status: 'partial',
      lines: [
        { l: 'Coaches completed (12mo)', v: '11 / 12' },
        { l: 'Players completed (12mo)', v: '23 / 25' },
        { l: 'Last refresher', v: '08 Sep 2025' },
        { l: 'Next refresher due', v: '08 Sep 2026' },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: 'rgba(0,61,165,0.08)', border: '1px solid rgba(0,61,165,0.3)' }}>
        <div>
          <div className="text-sm font-bold" style={{ color: C.text }}>Enhanced Care Pathway: ELIGIBLE</div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>3 of 4 prerequisites fully met · 1 pending refresher (Education)</div>
        </div>
        <button onClick={() => onAction('fa-compliance-report')}
          className="px-4 py-2 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: C.primary, color: C.gold }}>
          Generate FA Compliance Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(c => {
          const colour = c.status === 'pass' ? C.green : c.status === 'partial' ? C.amber : C.red
          const Icon = c.icon
          return (
            <div key={c.title} className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: colour }} />
                  <div className="text-sm font-bold" style={{ color: C.text }}>{c.title}</div>
                </div>
                <Pill color={colour}>{c.status === 'pass' ? '✓ Pass' : c.status === 'partial' ? 'Partial' : 'Fail'}</Pill>
              </div>
              <div className="space-y-1.5">
                {c.lines.map(l => (
                  <div key={l.l} className="flex justify-between text-[11px]">
                    <span style={{ color: C.dim }}>{l.l}</span>
                    <span style={{ color: C.text }}>{l.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── EDUCATION & TRAINING ────────────────────────────────────────────────────

const PLAYER_EDU = [
  { name: 'Jordan Hayes',     last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Tom Fletcher',      last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Daniel Webb',       last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Marcus Reid',      last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Isaac Kemp',     last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Brodi Chen',      last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Liam Barker',     last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Connor Walsh',         last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Myles Okafor',    last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Sam Porter',     last: '08 Sep 2025', due: '08 Sep 2026', status: 'current' as const },
  { name: 'Owen Hartley (U21)', last: '02 Mar 2025', due: '02 Mar 2026', status: 'overdue' as const },
  { name: 'Marcos Pereira (signing)', last: '—',   due: '—',           status: 'pending' as const },
]
const STAFF_EDU = [
  { name: 'Johnnie Jackson',  role: 'Manager',                   last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'M. Halligan',       role: 'Assistant Manager',         last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'Dr S. Hendricks',   role: 'Head of Medical',           last: '14 Mar 2026', due: '14 Mar 2027', status: 'current' as const },
  { name: 'L. Carter',         role: 'First Team Physio',         last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'F. Bonnet',         role: 'Head of Performance',       last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'P. Granger',         role: 'GK Coach',                  last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'A. Bonnet',         role: 'S&C Coach',                 last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'D. Mendez',         role: 'Academy Coach',             last: '02 Mar 2025', due: '02 Mar 2026', status: 'overdue' as const },
  { name: 'R. Singh',          role: 'Set-Piece Coach',           last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'J. Tate',           role: 'Sports Therapist',          last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'O. Park',           role: 'U21 Coach',                 last: '12 Sep 2025', due: '12 Sep 2026', status: 'current' as const },
  { name: 'New Hire (TBC)',    role: 'Performance Analyst',       last: '—',           due: '—',           status: 'pending' as const },
]

function EducationTab({ onAction }: { onAction: (id: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div>
          <div className="text-sm font-bold" style={{ color: C.text }}>Concussion Education — Players & Staff</div>
          <div className="text-xs mt-0.5" style={{ color: C.muted }}>Annual refresher · FA recognised module</div>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://learning.thefa.com" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{ backgroundColor: C.cardAlt, color: C.gold, border: `1px solid ${C.border}` }}>
            FA Concussion Course <ExternalLink size={11} />
          </a>
          <button onClick={() => onAction('refresher-reminder')}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{ backgroundColor: C.primary, color: C.gold }}>
            Send Refresher Reminder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Players ({PLAYER_EDU.filter(p => p.status === 'current').length} / {PLAYER_EDU.length} current)</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
                <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Name</th>
                <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Last</th>
                <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Due</th>
                <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {PLAYER_EDU.map(p => {
                const c = p.status === 'current' ? C.green : p.status === 'overdue' ? C.red : C.amber
                return (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="px-2 py-2" style={{ color: C.text }}>{p.name}</td>
                    <td className="px-2 py-2 font-mono" style={{ color: C.muted }}>{p.last}</td>
                    <td className="px-2 py-2 font-mono" style={{ color: C.muted }}>{p.due}</td>
                    <td className="px-2 py-2"><Pill color={c}>{p.status}</Pill></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Coaches & Staff ({STAFF_EDU.filter(s => s.status === 'current').length} / {STAFF_EDU.length} current)</SectionTitle>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
                <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Name</th>
                <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Role</th>
                <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Due</th>
                <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_EDU.map(s => {
                const c = s.status === 'current' ? C.green : s.status === 'overdue' ? C.red : C.amber
                return (
                  <tr key={s.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="px-2 py-2" style={{ color: C.text }}>{s.name}</td>
                    <td className="px-2 py-2" style={{ color: C.muted }}>{s.role}</td>
                    <td className="px-2 py-2 font-mono" style={{ color: C.muted }}>{s.due}</td>
                    <td className="px-2 py-2"><Pill color={c}>{s.status}</Pill></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function ConcussionTrackerView({ club }: { club?: { name?: string } | null }) {
  const [tab, setTab] = useState<Tab>('active')
  const [toast, setToast] = useState<string | null>(null)
  const fire = (id: string) => { setToast(`${id} — coming next sprint`); setTimeout(() => setToast(null), 2400) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}>
          <Brain size={20} style={{ color: C.primary }} /> Concussion Tracker — {club?.name || 'Oakridge FC'}
        </h2>
        <p className="text-sm mt-1" style={{ color: C.muted }}>FA Concussion Guidelines · CISG Amsterdam 2022 consensus · 6-stage GRTP protocol</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            style={{ backgroundColor: tab === t.id ? C.gold : C.cardAlt, color: tab === t.id ? '#000' : C.muted, border: tab === t.id ? 'none' : `1px solid ${C.border}` }}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'active'     && <ActiveCasesTab onAction={fire} />}
      {tab === 'history'    && <PlayerHistoryTab />}
      {tab === 'grtp'       && <GRTPTab />}
      {tab === 'baseline'   && <BaselineTab onAction={fire} />}
      {tab === 'compliance' && <ComplianceTab onAction={fire} />}
      {tab === 'education'  && <EducationTab onAction={fire} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-xl"
          style={{ backgroundColor: C.primary, color: C.gold }}>{toast}</div>
      )}
    </div>
  )
}
