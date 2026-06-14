'use client'

// Men's Pro Club Operations — overview for the operations manager.
// Covers matchday readiness, facilities, suppliers, compliance/licensing,
// staffing/rota, the ops calendar and open action items. DEMO data.
// Rendered as the Club Operations "Overview" tab (overviewSlot on the hub).

import { useState } from 'react'
import {
  ClipboardCheck, Building2, Truck, ShieldCheck, Users, CalendarDays,
  AlertTriangle, CheckCircle2, Wrench, PoundSterling, Activity, ListChecks,
} from 'lucide-react'

const C = {
  card: '#0D1017', cardAlt: '#111318', panel2: '#0B0D12',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', muted: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', blue: '#3B82F6',
} as const

type Tone = 'good' | 'warn' | 'bad' | 'muted'
const tc = (t: Tone) => t === 'good' ? C.good : t === 'warn' ? C.warn : t === 'bad' ? C.bad : C.muted

function Pill({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${tc(tone)}1e`, color: tc(tone), whiteSpace: 'nowrap' }}>{children}</span>
}
function Bar({ pct, color }: { pct: number; color: string }) {
  return <div className="h-1.5 rounded-full" style={{ background: C.panel2 }}><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
}
function Panel({ title, icon: Icon, accent, right, children }: { title: string; icon: React.ElementType; accent: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.text }}><Icon size={14} style={{ color: accent }} />{title}</span>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
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

const READINESS = [
  { area: 'Stewards & Safety', pct: 75 },
  { area: 'Catering & Hospitality', pct: 60 },
  { area: 'Pitch & Facilities', pct: 67 },
  { area: 'Media', pct: 50 },
  { area: 'Officials', pct: 100 },
]
const FACILITIES: { label: string; value: string; tone: Tone }[] = [
  { label: 'Pitch condition', value: 'Good — mown, marked', tone: 'good' },
  { label: 'Floodlights', value: 'Operational', tone: 'good' },
  { label: 'Capacity (safety cert)', value: '6,500', tone: 'muted' },
  { label: 'Last safety inspection', value: 'Fri 02 May', tone: 'good' },
  { label: 'Open maintenance jobs', value: '3 (1 priority)', tone: 'warn' },
  { label: 'Changing rooms / hospitality', value: 'Ready', tone: 'good' },
]
const SUPPLIERS: { name: string; service: string; renew: string; tone: Tone; status: string }[] = [
  { name: 'Pinkertons', service: 'Catering & hospitality', renew: 'Aug 2026', tone: 'good', status: 'Active' },
  { name: 'Sentinel Security', service: 'Stewarding & security', renew: 'Jun 2026', tone: 'warn', status: 'Renew soon' },
  { name: 'BrightClean', service: 'Cleaning & waste', renew: 'Dec 2026', tone: 'good', status: 'Active' },
  { name: 'MedX Cover', service: 'Matchday medical / ambulance', renew: 'Active', tone: 'good', status: 'Active' },
  { name: 'GreenTurf', service: 'Grounds & pitch maintenance', renew: 'Mar 2027', tone: 'good', status: 'Active' },
  { name: 'Vanta Sports', service: 'Kit & equipment', renew: '2027', tone: 'good', status: 'Active' },
]
const COMPLIANCE: { label: string; value: string; tone: Tone }[] = [
  { label: 'FSR position', value: '82% — on track', tone: 'good' },
  { label: 'FA licence tier', value: 'Tier 2 — current', tone: 'good' },
  { label: 'Public liability insurance', value: 'Renew 31 May', tone: 'warn' },
  { label: 'Safeguarding / DBS', value: '23/23 staff current', tone: 'good' },
  { label: 'Ground safety certificate', value: 'Valid to 2027', tone: 'good' },
  { label: 'H&S risk assessments (RAMS)', value: 'Current', tone: 'good' },
]
const ROTA: { role: string; filled: string; tone: Tone }[] = [
  { role: 'Stewards', filled: '18 / 20', tone: 'warn' },
  { role: 'Safety officer', filled: 'Confirmed', tone: 'good' },
  { role: 'First aiders', filled: '4 / 4', tone: 'good' },
  { role: 'Hospitality team', filled: '6 / 6', tone: 'good' },
  { role: 'Ball crew', filled: '8 / 8', tone: 'good' },
  { role: 'PA / announcer', filled: '1 / 1', tone: 'good' },
]
const CALENDAR: { date: string; label: string; tone: Tone }[] = [
  { date: 'Sat 12 Apr', label: 'Matchday — vs Greyfield Town (H), KO 15:00', tone: 'bad' },
  { date: 'Wed 14 May', label: 'Quarterly facilities inspection', tone: 'muted' },
  { date: 'Fri 31 May', label: 'Public liability insurance renewal', tone: 'warn' },
  { date: 'Mon 10 Jun', label: 'FSR quarterly submission due', tone: 'warn' },
  { date: 'Fri 14 Jun', label: 'Safeguarding refresher training', tone: 'muted' },
  { date: 'Sat 21 Jun', label: 'Away day — Penmarric (coach + hotel)', tone: 'muted' },
]
const ACTIONS: { label: string; owner: string; tone: Tone; pill: string }[] = [
  { label: 'Confirm matchday ambulance & first-aid cover', owner: 'Ops · MedX', tone: 'bad', pill: 'Urgent' },
  { label: 'Hospitality menu — 3-course + dietary notes to file', owner: 'Catering', tone: 'warn', pill: 'Today' },
  { label: 'Reorder match balls (6) + corner flags check', owner: 'Kit', tone: 'warn', pill: 'This week' },
  { label: 'Confirm photographer + social media matchday plan', owner: 'Media', tone: 'warn', pill: 'This week' },
  { label: 'Chase 2 outstanding steward confirmations', owner: 'Safety', tone: 'warn', pill: 'This week' },
  { label: 'Renew public liability insurance before 31 May', owner: 'Compliance', tone: 'bad', pill: 'Deadline' },
]

export default function FootballClubOpsOverview({ accent = '#003DA5' }: { accent?: string }) {
  const [ackd, setAckd] = useState<Record<number, boolean>>({})
  const readinessAvg = Math.round(READINESS.reduce((s, r) => s + r.pct, 0) / READINESS.length)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Matchday readiness" value={`${readinessAvg}%`} sub="vs Greyfield · Sun" icon={ClipboardCheck} color={accent} tone="warn" />
        <Kpi label="Stadium utilisation" value="71%" sub="4,640 / 6,500" icon={Building2} color={C.blue} />
        <Kpi label="Open ops actions" value="7" sub="2 urgent" icon={ListChecks} color={C.warn} tone="warn" />
        <Kpi label="Compliance" value="82%" sub="on track" icon={ShieldCheck} color={C.good} tone="good" />
        <Kpi label="Monthly ops spend" value="£42k" sub="+4% MoM" icon={PoundSterling} color={accent} />
        <Kpi label="Incidents (90d)" value="1" sub="minor · closed" icon={Activity} color={C.good} tone="good" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Matchday readiness" icon={ClipboardCheck} accent={accent} right={<Pill tone="warn">{readinessAvg}% complete</Pill>}>
          <div className="space-y-2.5">
            {READINESS.map(r => (
              <div key={r.area}>
                <div className="flex items-center justify-between text-xs mb-1"><span style={{ color: C.text2 }}>{r.area}</span><span className="font-bold" style={{ color: r.pct === 100 ? C.good : C.text }}>{r.pct}%</span></div>
                <Bar pct={r.pct} color={r.pct === 100 ? C.good : r.pct >= 70 ? accent : C.warn} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Facilities & stadium" icon={Building2} accent={accent}>
          <div className="space-y-2">
            {FACILITIES.map(f => (
              <div key={f.label} className="flex items-center justify-between text-xs"><span style={{ color: C.text3 }}>{f.label}</span><span className="font-semibold flex items-center gap-2" style={{ color: C.text }}>{f.value}<span style={{ width: 7, height: 7, borderRadius: 9, background: tc(f.tone), display: 'inline-block' }} /></span></div>
            ))}
          </div>
        </Panel>

        <Panel title="Suppliers & contracts" icon={Truck} accent={accent} right={<span className="text-xs" style={{ color: C.muted }}>{SUPPLIERS.length} active</span>}>
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Supplier', 'Service', 'Renews', 'Status'].map(h => <th key={h} className="text-left py-1.5 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
            <tbody>
              {SUPPLIERS.map((s, i) => (
                <tr key={s.name} style={{ borderBottom: i < SUPPLIERS.length - 1 ? `1px solid ${C.border}` : undefined }}>
                  <td className="py-1.5 font-semibold" style={{ color: C.text }}>{s.name}</td>
                  <td className="py-1.5" style={{ color: C.text3 }}>{s.service}</td>
                  <td className="py-1.5" style={{ color: s.tone === 'warn' ? C.warn : C.muted }}>{s.renew}</td>
                  <td className="py-1.5"><Pill tone={s.tone}>{s.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Compliance & licensing" icon={ShieldCheck} accent={accent}>
          <div className="space-y-2">
            {COMPLIANCE.map(c => (
              <div key={c.label} className="flex items-center justify-between text-xs"><span style={{ color: C.text3 }}>{c.label}</span><Pill tone={c.tone}>{c.value}</Pill></div>
            ))}
          </div>
        </Panel>

        <Panel title="Staffing & matchday rota" icon={Users} accent={accent}>
          <div className="grid grid-cols-2 gap-2">
            {ROTA.map(r => (
              <div key={r.role} className="rounded-lg p-2.5 flex items-center justify-between" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                <span className="text-xs" style={{ color: C.text3 }}>{r.role}</span><span className="text-xs font-bold" style={{ color: tc(r.tone) }}>{r.filled}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Operations calendar" icon={CalendarDays} accent={accent}>
          <div className="space-y-2">
            {CALENDAR.map(c => (
              <div key={c.date} className="flex items-start gap-3 text-xs">
                <span className="font-mono shrink-0" style={{ color: tc(c.tone), width: 64 }}>{c.date}</span>
                <span style={{ color: C.text2 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Open action items" icon={ListChecks} accent={accent} right={<span className="text-xs" style={{ color: C.muted }}>{ACTIONS.filter((_, i) => !ackd[i]).length} open</span>}>
        <div className="space-y-2">
          {ACTIONS.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg p-2.5" style={{ background: C.panel2, border: `1px solid ${C.border}`, opacity: ackd[i] ? 0.5 : 1 }}>
              <div className="flex items-center gap-2.5 min-w-0">
                {a.tone === 'bad' ? <AlertTriangle size={14} className="shrink-0" style={{ color: C.bad }} /> : <Wrench size={14} className="shrink-0" style={{ color: C.warn }} />}
                <div className="min-w-0"><div className="text-xs font-medium" style={{ color: C.text, textDecoration: ackd[i] ? 'line-through' : 'none' }}>{a.label}</div><div className="text-[10px]" style={{ color: C.muted }}>{a.owner}</div></div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Pill tone={a.tone}>{a.pill}</Pill>
                <button onClick={() => setAckd(s => ({ ...s, [i]: !s[i] }))} className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: ackd[i] ? `${C.good}1e` : 'transparent', color: ackd[i] ? C.good : C.muted, border: `1px solid ${C.border}` }}>
                  {ackd[i] ? <CheckCircle2 size={11} className="inline" /> : 'Done'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
