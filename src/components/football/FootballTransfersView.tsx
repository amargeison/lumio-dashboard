'use client'

// Men's Pro — Transfers. Mirrors the women's transfer tracker: PSR-gated
// headroom + window KPIs, incoming-targets table, outgoing-risk (contract
// expiries) and a window timeline. Blue, men's EFL data. Demo only.

const C = {
  card: '#0D1117', cardAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', muted: '#6B7280',
  blue: '#003DA5', blueLt: '#60A5FA', good: '#22C55E', amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
}

type Pr = 'High' | 'Medium' | 'Low'
const prTone = (p: Pr) => p === 'High' ? C.blueLt : p === 'Medium' ? C.amber : C.muted
type Risk = 'High' | 'Medium' | 'Low'
const riskTone = (r: Risk) => r === 'High' ? C.red : r === 'Medium' ? C.amber : C.good

const TARGETS: { player: string; club: string; pos: string; fee: string; psr: string; priority: Pr; status: string; statusTone: string }[] = [
  { player: 'Tariq Benali',   club: 'Northgate City',     pos: 'LB', fee: '£2.4m', psr: '£1.0m left',  priority: 'High',   status: 'Approach made',  statusTone: C.blueLt },
  { player: 'Marco Bianchi',  club: 'Valdoria SC (overseas)', pos: 'FW', fee: '£3.2m', psr: '£0.6m left', priority: 'High', status: 'Scouting',     statusTone: C.purple },
  { player: 'Owen Drake',     club: 'Free agent',         pos: 'CM', fee: 'Free',   psr: '£1.35m left', priority: 'High',   status: 'Contract talks', statusTone: C.good },
  { player: 'Erik Lindholm',  club: 'Nordvik FK (overseas)',  pos: 'CB', fee: '£1.8m', psr: '£0.9m left', priority: 'Medium', status: 'Watchlist',  statusTone: C.muted },
  { player: 'Kenji Watanabe', club: 'Sakura United (overseas)', pos: 'AM', fee: '£2.0m', psr: '£0.7m left', priority: 'Medium', status: 'Watchlist', statusTone: C.muted },
  { player: 'Sol Adeyemi',    club: 'Brindleford Town',   pos: 'FW', fee: '£1.2m', psr: '£1.1m left',  priority: 'Low',    status: 'Monitor',       statusTone: C.muted },
]

const OUTGOING: { player: string; pos: string; ends: string; wage: string; status: string; risk: Risk }[] = [
  { player: 'Sam Porter',  pos: 'ST', ends: 'Jun 2026', wage: '£40k/wk', status: 'Offer sent — awaiting',     risk: 'Medium' },
  { player: 'Kyle Osei',   pos: 'RB', ends: 'Jun 2026', wage: '£28k/wk', status: 'Negotiating — agent involved', risk: 'High' },
  { player: 'Marcus Reid', pos: 'CB', ends: 'Jun 2026', wage: '£24k/wk', status: 'Renewal under review',      risk: 'Low' },
]

const TIMELINE: { label: string; date: string; done: boolean }[] = [
  { label: 'Summer window opens', date: '1 Jun 2026', done: true },
  { label: 'Pre-season tour — final targets', date: '8 Jul 2026', done: false },
  { label: 'EFL registration deadline', date: '1 Sep 2026', done: false },
  { label: 'Window closes', date: '1 Sep 2026', done: false },
]

const Kpi = ({ value, label, sub, color }: { value: string; label: string; sub: string; color: string }) => (
  <div className="rounded-xl p-5" style={{ background: `linear-gradient(135deg, ${color}1f, ${C.card})`, border: `1px solid ${color}40` }}>
    <div className="text-2xl font-black" style={{ color: C.text }}>{value}</div>
    <div className="text-sm font-semibold mt-0.5" style={{ color }}>{label}</div>
    <div className="text-[11px] mt-1" style={{ color: C.muted }}>{sub}</div>
  </div>
)

export default function FootballTransfersView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}>🔁 Transfers</h2>
        <p className="text-sm mt-1" style={{ color: C.text3 }}>EFL market · PSR-gated transfer tracker</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi value="£1.5m" label="PSR Headroom" sub="Available for new signings" color={C.good} />
        <Kpi value="Open" label="Window Status" sub="Summer — closes 1 Sep" color={C.blueLt} />
        <Kpi value="6" label="Targets Identified" sub="3 priority · 3 watchlist" color={C.purple} />
        <Kpi value="2" label="Outgoing Risk" sub="Contract expires this window" color={C.amber} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Incoming Targets</h3>
          <span className="text-xs" style={{ color: C.muted }}>Summer 2026</span>
        </div>
        <table className="w-full text-xs">
          <thead><tr style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}>
            {['Player', 'Club', 'Pos', 'Est. Fee', 'PSR Impact', 'Priority', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>{TARGETS.map(t => (
            <tr key={t.player} style={{ borderBottom: `1px solid ${C.border}80` }}>
              <td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{t.player}</td>
              <td className="px-4 py-2.5" style={{ color: C.text3 }}>{t.club}</td>
              <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${C.blue}33`, color: C.blueLt }}>{t.pos}</span></td>
              <td className="px-4 py-2.5 font-mono" style={{ color: C.text2 }}>{t.fee}</td>
              <td className="px-4 py-2.5 font-mono" style={{ color: C.amber }}>{t.psr}</td>
              <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${prTone(t.priority)}1f`, color: prTone(t.priority) }}>{t.priority}</span></td>
              <td className="px-4 py-2.5"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${t.statusTone}1f`, color: t.statusTone }}>{t.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>Outgoing Risk — Contract Expiries</h3></div>
        <table className="w-full text-xs">
          <thead><tr style={{ color: C.muted, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}>
            {['Player', 'Pos', 'Ends', 'Wage', 'Status', 'Risk'].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>{OUTGOING.map(o => (
            <tr key={o.player} style={{ borderBottom: `1px solid ${C.border}80` }}>
              <td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{o.player}</td>
              <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${C.blue}33`, color: C.blueLt }}>{o.pos}</span></td>
              <td className="px-4 py-2.5" style={{ color: C.text3 }}>{o.ends}</td>
              <td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{o.wage}</td>
              <td className="px-4 py-2.5" style={{ color: C.text3 }}>{o.status}</td>
              <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${riskTone(o.risk)}1f`, color: riskTone(o.risk) }}>{o.risk}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Window Timeline</h3>
        <div className="space-y-0">{TIMELINE.map((t, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ background: t.done ? C.good : C.border, border: `2px solid ${t.done ? C.good : C.muted}` }} />
              {i < TIMELINE.length - 1 && <div className="w-px flex-1 my-1" style={{ background: C.border }} />}
            </div>
            <div className="pb-4"><div className="text-sm font-semibold" style={{ color: t.done ? C.text3 : C.text }}>{t.label}</div><div className="text-[11px]" style={{ color: C.muted }}>{t.date}</div></div>
          </div>
        ))}</div>
      </div>

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${C.blue}12`, borderLeft: `3px solid ${C.blue}`, color: C.text2 }}>
        Demo — illustrative only. Targets, fees and PSR impacts are invented demo values; club names are fictional.
      </div>
    </div>
  )
}
