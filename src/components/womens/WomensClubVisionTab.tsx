'use client'

// Women's Club Vision — multi-horizon strategy, mirrors the Pro Strategy
// (ClubPlannerTab) structure, themed pink, with Oakridge Women WSL 2 -> WSL
// promotion ambitions. DEMO data; FSR/PSR kept as factual governing-body refs.
// Financials are coherent with the Club Finance view (~£2.0m revenue base).

import { useState } from 'react'

const C = {
  card: '#0D1017', border: '#1F2937', text: '#F9FAFB', muted: '#6B7280', text2: '#D1D5DB',
  primary: '#EC4899', gold: '#F1C40F', green: '#22C55E', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6',
} as const

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>{children}</div>
}
function SH({ text }: { text: string }) {
  return <div style={{ borderLeft: `3px solid ${C.primary}`, paddingLeft: 12, marginBottom: 16 }}><h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{text}</h3></div>
}
function Bar({ pct, color = C.primary }: { pct: number; color?: string }) {
  return <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} /></div>
}

type PlanTab = '1yr' | '3yr' | '5yr' | '10yr'

// ─── 1 Year ────────────────────────────────────────────────────────────────
function OneYear() {
  return (
    <div className="space-y-5">
      <SH text="Season Objectives (2025/26)" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[
          { icon: '🏆', title: 'Finish top 2 in WSL 2 (promotion push)', current: 'Current: 2nd', pct: 78, status: 'On Track', sc: C.green },
          { icon: '💰', title: 'Keep wage/revenue below 75%', current: 'Current: 70%', pct: 70, status: 'On Track', sc: C.green },
          { icon: '✍️', title: 'Renew 2 key contracts (Porter, Granger)', current: '0 of 2 signed', pct: 25, status: 'In Progress', sc: C.amber },
          { icon: '🎟️', title: 'Grow average attendance to 3,200', current: 'Current: 2,847', pct: 60, status: 'On Track', sc: C.green },
        ].map(g => (
          <Card key={g.title}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-lg">{g.icon}</span>
              <div className="flex-1"><p className="text-xs font-bold" style={{ color: C.text }}>{g.title}</p><p className="text-[10px]" style={{ color: C.muted }}>{g.current}</p></div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${g.sc}15`, color: g.sc }}>{g.status}</span>
            </div>
            <Bar pct={g.pct} color={g.sc} />
            <p className="text-[10px] text-right mt-1" style={{ color: C.muted }}>{g.pct}%</p>
          </Card>
        ))}
      </div>

      <SH text="Summer Transfer Window Plan" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Role', 'Target Profile', 'Budget', 'Priority', 'Status'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              { r: 'Striker', t: 'Clinical finisher, U25, proven WSL 2 / strong WSL Academy', b: '£140k', p: '🔴 High', s: 'Shortlist of 3' },
              { r: 'CM', t: 'Box-to-box, press-resistant, U24', b: '£95k', p: '🔴 High', s: 'Shortlist of 3' },
              { r: 'CB', t: 'Aerially dominant, left-sided, U24', b: '£55k', p: '🟡 Med', s: 'Scouting' },
              { r: 'GK (backup)', t: 'Experienced, 26-31, solid WSL 2', b: 'Loan / £20k', p: '🟢 Low', s: 'Monitoring' },
            ].map(row => (
              <tr key={row.r} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3 font-bold" style={{ color: C.text }}>{row.r}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{row.t}</td>
                <td className="py-2 px-3 font-bold" style={{ color: C.text }}>{row.b}</td>
                <td className="py-2 px-3">{row.p}</td>
                <td className="py-2 px-3" style={{ color: C.primary }}>{row.s}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] mt-3 px-3" style={{ color: C.muted }}>Budget available: £190k · Max spend: £480k (FSR-compliant headroom)</p>
      </Card>

      <SH text="Key Milestones Timeline" />
      <Card>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ backgroundColor: C.border }} />
          {[
            'Apr 2025 — East terrace feasibility study submitted',
            'May 2025 — End of season review + contract decisions',
            'Jun 2025 — Summer window opens (budget: £480k)',
            'Jul 2025 — Pre-season begins (Spain camp · 3 signings target)',
            'Aug 2025 — 2025/26 WSL 2 season kicks off',
            'Sep 2025 — Q1 financial review · FSR self-assessment',
            'Oct 2025 — Regional Talent Club audit',
            'Nov 2025 — Mid-season board review',
            'Dec 2025 — Winter window planning',
            'Jan 2026 — Winter window (budget: £160k)',
            'Mar 2026 — Financial year-end',
            'Apr 2026 — Season run-in, promotion push',
          ].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-3">
              <div className="absolute left-[-18px] w-3 h-3 rounded-full" style={{ backgroundColor: i < 2 ? C.primary : C.border, border: `2px solid ${C.card}`, top: 3 }} />
              <p className="text-xs" style={{ color: i < 2 ? C.text : C.muted }}>{m}</p>
            </div>
          ))}
        </div>
      </Card>

      <SH text="Financial Targets" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Metric', '2024/25 Actual', '2025/26 Target', 'Change'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              { m: 'Total Revenue', a: '£1.70m', t: '£2.00m', ch: '▲+18%' },
              { m: 'Wage Bill', a: '£1.25m', t: '£1.40m', ch: '▲+12%' },
              { m: 'Wage/Revenue', a: '74%', t: '70%', ch: '▼-4pts' },
              { m: 'Matchday Revenue', a: '£0.29m', t: '£0.36m', ch: '▲+24%' },
              { m: 'Commercial Income', a: '£0.46m', t: '£0.52m', ch: '▲+13%' },
              { m: 'Net Transfer Spend', a: '-£0.14m', t: '-£0.23m', ch: 'Reinvested' },
              { m: 'Operating Result', a: '-£0.24m', t: '-£0.18m', ch: '▲ narrowing' },
            ].map(r => (
              <tr key={r.m} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3" style={{ color: C.text }}>{r.m}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{r.a}</td>
                <td className="py-2 px-3 font-bold" style={{ color: C.text }}>{r.t}</td>
                <td className="py-2 px-3 font-bold" style={{ color: C.green }}>{r.ch}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] mt-3 px-3" style={{ color: C.muted }}>Operating deficit owner-funded within FSR limits; narrowing year-on-year toward a self-sustaining model.</p>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ l: 'Retain', v: '18 players', i: '✅' }, { l: 'Release', v: '3 (out of contract)', i: '🔄' }, { l: 'Sign', v: '3 targets', i: '🎯' }, { l: 'Promote', v: '2 (Hartley, Owusu)', i: '🎓' }].map(s => (
          <Card key={s.l}><span className="text-lg">{s.i}</span><p className="text-lg font-black mt-1" style={{ color: C.text }}>{s.v}</p><p className="text-[10px]" style={{ color: C.muted }}>{s.l}</p></Card>
        ))}
      </div>
    </div>
  )
}

// ─── 3 Year ────────────────────────────────────────────────────────────────
function ThreeYear() {
  return (
    <div className="space-y-5">
      <Card className="text-center">
        <p className="text-sm italic leading-relaxed" style={{ color: C.gold }}>&ldquo;To win promotion to the Women&rsquo;s Super League by 2027-28, with a squad, Regional Talent Club and commercial base built to establish Oakridge Women in the top flight.&rdquo;</p>
      </Card>

      <SH text="3-Year KPI Roadmap" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['KPI', '2025/26', '2026/27', '2027/28'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              ['League Target', 'Top 2 (promotion push)', 'Promotion play-off', 'Promoted to WSL'],
              ['Revenue Target', '£2.0m', '£2.6m', '£3.6m'],
              ['Wage/Revenue', '70%', '72%', '75% (promotion spike)'],
              ['Avg Attendance', '2,847', '3,400', '4,200'],
              ['Season Tickets', '1,150', '1,600', '2,300'],
              ['Squad Value', '£3.8m', '£5.5m', '£9.0m'],
              ['Academy grads in XI', '2', '3', '4'],
              ['Stadium capacity', '6,500 (current)', '7,500 (East terrace)', '9,000 (promotion build)'],
            ].map(row => (
              <tr key={row[0]} style={{ borderBottom: `1px solid ${C.border}` }}>
                {row.map((cell, i) => <td key={i} className="py-2 px-3" style={{ color: i === 0 ? C.text : i === 3 ? C.primary : C.muted, fontWeight: i === 3 ? 700 : 400 }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SH text="Investment Priorities" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { t: 'Playing Squad', items: ['Year 1: £480k (3 quality signings)', 'Year 2: £620k (4 signings + youth bonuses)', 'Year 3: £900k (promotion-window additions)'], total: '£2.0m' },
          { t: 'Infrastructure', items: ['Year 1: £90k (East terrace feasibility)', 'Year 2: £650k (terrace + hospitality build)', 'Year 3: £1.1m (promotion-year seating)'], total: '£1.84m' },
          { t: 'Commercial & Academy', items: ['Year 1: £120k (kit + sponsor renewals)', 'Year 2: £260k (sponsors, streaming, RTC upgrade)', 'Year 3: £380k (hospitality + Tier 1 RTC push)'], total: '£760k + RTC' },
        ].map(col => (
          <Card key={col.t}>
            <p className="text-xs font-bold mb-3" style={{ color: C.text }}>{col.t}</p>
            <div className="space-y-1.5 mb-3">{col.items.map(i => <p key={i} className="text-[10px]" style={{ color: C.muted }}>{i}</p>)}</div>
            <p className="text-xs font-bold" style={{ color: C.primary }}>Total: {col.total}</p>
          </Card>
        ))}
      </div>

      <SH text="Risk Assessment" />
      <div className="space-y-2">
        {[
          { t: 'Promotion not achieved by Year 3', m: 'Revenue model depends on WSL central distribution', c: C.red, l: 'HIGH' },
          { t: 'Key players poached by WSL clubs', m: 'Early renewals + competitive WSL 2 wage structure', c: C.red, l: 'HIGH' },
          { t: 'East terrace planning delayed', m: 'Early council engagement and phased build', c: C.amber, l: 'MED' },
          { t: 'Owner funding appetite reduces', m: 'Accelerate self-generated revenue (matchday + commercial)', c: C.amber, l: 'MED' },
          { t: 'Regional Talent Club output lags', m: 'Strengthen schools + scholarship network', c: C.green, l: 'LOW' },
          { t: 'Commercial partner exits', m: 'Diversified, non-bundled sponsor portfolio', c: C.green, l: 'LOW' },
        ].map(r => (
          <div key={r.t} className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: `${r.c}15`, color: r.c }}>{r.l}</span>
            <div><p className="text-xs font-bold" style={{ color: C.text }}>{r.t}</p><p className="text-[10px]" style={{ color: C.muted }}>{r.m}</p></div>
          </div>
        ))}
      </div>

      <SH text="Promotion Pathway" />
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { y: '2024/25', s: 'Top 4 (WSL 2)', st: '✅', c: C.green },
          { y: '2025/26', s: 'Top 2 / promotion push', st: '🎯', c: C.amber },
          { y: '2026/27', s: 'Promotion play-off', st: '🎯', c: C.amber },
          { y: '2027/28', s: 'PROMOTED to WSL', st: '🏆', c: C.gold },
        ].map((step, i) => (
          <div key={step.y} className="flex items-center gap-2">
            <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: `${step.c}10`, border: `1px solid ${step.c}40`, minWidth: 120 }}>
              <p className="text-[10px] font-bold" style={{ color: step.c }}>{step.y}</p>
              <p className="text-xs font-black" style={{ color: C.text }}>{step.s} {step.st}</p>
            </div>
            {i < 3 && <span style={{ color: C.muted }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 5 Year ────────────────────────────────────────────────────────────────
function FiveYear() {
  const revData = [{ y: '25/26', v: 2.0 }, { y: '26/27', v: 2.6 }, { y: '27/28', v: 3.6 }, { y: '28/29', v: 6.5 }, { y: '29/30', v: 8.5 }]
  const max = 9
  return (
    <div className="space-y-5">
      <Card className="text-center">
        <p className="text-lg font-black" style={{ color: C.gold }}>Oakridge Women &mdash; From WSL 2 to established Women&rsquo;s Super League club by 2030</p>
      </Card>

      <SH text="5-Year Revenue Forecast" />
      <Card>
        <div className="flex items-end gap-4 justify-center" style={{ height: 200 }}>
          {revData.map((d, i) => (
            <div key={d.y} className="flex flex-col items-center flex-1">
              <span className="text-xs font-bold mb-1" style={{ color: C.text }}>£{d.v.toFixed(1)}m</span>
              <div className="w-full rounded-t" style={{ height: (d.v / max) * 170, backgroundColor: i >= 3 ? C.gold : C.primary, maxWidth: 60 }} />
              <span className="text-[10px] mt-2" style={{ color: C.muted }}>{d.y}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-3 text-center" style={{ color: C.muted }}>27/28 → 28/29 step is the WSL central-distribution + broadcast jump on promotion.</p>
      </Card>

      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['', '25/26', '26/27', '27/28', '28/29', '29/30'].map(h => <th key={h} className="text-left py-2 px-2 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
          <tbody>
            {[['Revenue', '£2.0m', '£2.6m', '£3.6m', '£6.5m', '£8.5m'], ['Costs', '£2.2m', '£2.7m', '£3.5m', '£6.0m', '£7.8m'], ['Net', '-£0.2m', '-£0.1m', '+£0.1m', '+£0.5m', '+£0.7m']].map(row => (
              <tr key={row[0]} style={{ borderBottom: `1px solid ${C.border}` }}>
                {row.map((c, i) => {
                  const isNet = row[0] === 'Net'
                  const col = i === 0 ? C.text : isNet ? (c.startsWith('+') ? C.green : C.red) : C.muted
                  return <td key={i} className="py-2 px-2" style={{ color: col, fontWeight: isNet ? 700 : 400 }}>{c}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] mt-3 px-2" style={{ color: C.muted }}>Owner-funded deficits in WSL 2; model turns self-sustaining from the promotion season.</p>
      </Card>

      <SH text="Stadium Development Plan" />
      <Card>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ backgroundColor: C.border }} />
          {['2025: 6,500 capacity (Oakridge Stadium) — current ✅', '2026: East terrace redevelopment prep — planning submitted', '2027: East terrace opens, +1,000 incl. hospitality → 7,500', '2028: South stand seating during promotion year, +1,000 → 8,500', '2029: Facilities + concourse upgrade; women’s training base design', '2030: 9,000 capacity + dedicated women’s training base 🏆'].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-3">
              <div className="absolute left-[-18px] w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? C.green : i < 3 ? C.amber : C.muted, border: `2px solid ${C.card}`, top: 3 }} />
              <p className="text-xs" style={{ color: C.text }}>{m}</p>
            </div>
          ))}
        </div>
      </Card>

      <SH text="Academy / RTC 5-Year Pipeline" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Age Now', 'Pos', '5-Yr Projection'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
          <tbody>
            {[['Mia Hartley', '17', 'ST', 'First-team regular by 2027'], ['Grace Owusu', '18', 'CM', 'Pro contract 2026'], ['Lena Vasquez', '16', 'RB', 'Loan → first team 2027'], ['Faye Donnelly', '17', 'LW', 'Breakthrough by 2028'], ['Sophie Mensah', '18', 'GK', 'Backup GK by 2026']].map(r => (
              <tr key={r[0]} style={{ borderBottom: `1px solid ${C.border}` }}>{r.map((c, i) => <td key={i} className="py-2 px-3" style={{ color: i === 3 ? C.primary : i === 0 ? C.text : C.muted }}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs mt-3 px-3 font-bold" style={{ color: C.primary }}>Projected academy value by 2030: £2.5m (Tier 1 RTC sales pipeline)</p>
      </Card>

      <SH text="Commercial Growth Strategy" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ t: 'Kit deal renewal 2026', v: '£300k/yr target', s: '🎯 Planned' }, { t: 'Hospitality + matchday 2028', v: '£420k/yr target', s: '🎯 Planned' }, { t: 'Streaming / digital 2027', v: '£180k/yr target', s: '🔄 Exploring' }, { t: 'Community foundation', v: '£120k/yr target', s: '✅ Active' }].map(g => (
          <Card key={g.t}><p className="text-xs font-bold" style={{ color: C.text }}>{g.t}</p><p className="text-[10px] mt-1" style={{ color: C.muted }}>{g.v}</p><p className="text-[10px] mt-1" style={{ color: C.primary }}>{g.s}</p></Card>
        ))}
      </div>

      <SH text="5-Year Headcount Plan" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Area', 'Now', '2027', '2030'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
          <tbody>
            {[['Playing staff', '22', '24', '28'], ['Coaching & performance', '12', '16', '22'], ['Commercial/Admin', '6', '10', '16'], ['Academy / RTC staff', '8', '11', '15'], ['Total', '48', '61', '81']].map(r => (
              <tr key={r[0]} style={{ borderBottom: `1px solid ${C.border}` }}>{r.map((c, i) => <td key={i} className="py-2 px-3" style={{ color: r[0] === 'Total' ? C.text : i === 0 ? C.text : C.muted, fontWeight: r[0] === 'Total' ? 700 : 400 }}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── 10 Year ───────────────────────────────────────────────────────────────
function TenYear() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-6 text-center" style={{ background: `linear-gradient(135deg, ${C.primary}15, ${C.purple}15)`, border: `1px solid ${C.primary}40` }}>
        <p className="text-base font-black leading-relaxed" style={{ color: C.gold }}>&ldquo;By 2035, Oakridge Women will be an established Women&rsquo;s Super League club with a 9,000-capacity home, a Tier 1 Regional Talent Club, and sustained Women&rsquo;s Champions League ambition.&rdquo;</p>
      </div>

      <SH text="10-Year Ambitions" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { i: '🏆', t: 'On-Pitch', d: 'Promotion to the WSL by 2027-28. Established top-half WSL club by 2032. First Women’s Champions League qualification by 2035.' },
          { i: '🏟️', t: 'Stadium', d: '9,000 capacity by 2030. Dedicated women’s training base by 2033, co-located with the men’s setup.' },
          { i: '🎓', t: 'Academy / RTC', d: 'Tier 1 Regional Talent Club status by 2031. 15+ first-team graduates by 2035.' },
          { i: '💰', t: 'Finance', d: '£12m revenue by 2035. Wage/revenue <70%. Self-sustaining within FSR headroom.' },
          { i: '🌍', t: 'Community', d: '25,000 registered supporters. Charity arm. Girls’ schools programme across the region.' },
          { i: '📱', t: 'Commercial', d: 'National brand recognition. Own streaming + content platform. Replica-kit growth.' },
        ].map(a => (
          <Card key={a.t}>
            <div className="flex items-center gap-2 mb-2"><span className="text-lg">{a.i}</span><p className="text-xs font-bold" style={{ color: C.text }}>{a.t}</p></div>
            <p className="text-[10px] leading-relaxed" style={{ color: C.muted }}>{a.d}</p>
          </Card>
        ))}
      </div>

      <SH text="Decade Financial Projection" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Year', 'Revenue', 'Op. Cost', 'Net', 'Cumulative'].map(h => <th key={h} className="text-left py-2 px-2 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['2025/26', '£2.0m',  '£2.2m',  '-£0.2m', '-£0.2m'], ['2026/27', '£2.6m',  '£2.7m',  '-£0.1m', '-£0.3m'],
                ['2027/28', '£3.6m',  '£3.5m',  '+£0.1m', '-£0.2m'], ['2028/29', '£6.5m',  '£6.0m',  '+£0.5m', '+£0.3m'],
                ['2029/30', '£8.5m',  '£7.8m',  '+£0.7m', '+£1.0m'], ['2030/31', '£9.4m',  '£8.6m',  '+£0.8m', '+£1.8m'],
                ['2031/32', '£10.2m', '£9.3m',  '+£0.9m', '+£2.7m'], ['2032/33', '£10.9m', '£9.9m',  '+£1.0m', '+£3.7m'],
                ['2033/34', '£11.5m', '£10.4m', '+£1.1m', '+£4.8m'], ['2034/35', '£12.2m', '£11.0m', '+£1.2m', '+£6.0m'],
              ].map(r => (
                <tr key={r[0]} style={{ borderBottom: `1px solid ${C.border}` }}>
                  {r.map((c, i) => {
                    const col = i === 0 ? C.text : i === 3 ? (c.startsWith('+') ? C.green : C.red) : i === 4 ? (c.startsWith('+') ? C.primary : C.red) : C.muted
                    return <td key={i} className="py-1.5 px-2" style={{ color: col, fontWeight: i >= 3 ? 700 : 400 }}>{c}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] mt-3 px-2" style={{ color: C.muted }}>Owner-funded while in WSL 2; cumulative position turns positive from the 2028/29 WSL season.</p>
      </Card>

      <SH text="Legacy Milestones" />
      <Card>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ backgroundColor: C.border }} />
          {[
            { y: '2025', t: 'Top-4 WSL 2 season. 9,000-seat masterplan submitted.', s: '🔄' },
            { y: '2026', t: 'Promotion contention; top-2 WSL 2 push.', s: '🎯' },
            { y: '2027', t: 'East terrace planning permission secured. Promotion play-off.', s: '🎯' },
            { y: '2028', t: 'PROMOTED to the Women’s Super League.', s: '🏆' },
            { y: '2029', t: 'First full WSL season. Stadium expansion breaks ground.', s: '🎯' },
            { y: '2030', t: '9,000-capacity redevelopment complete.', s: '🎯' },
            { y: '2031', t: 'Tier 1 Regional Talent Club status awarded.', s: '🎯' },
            { y: '2032', t: 'First top-half WSL finish. Commercial revenue doubles vs 2025.', s: '🎯' },
            { y: '2033', t: 'Dedicated women’s training base opens.', s: '🎯' },
            { y: '2034', t: 'Oakridge Foundation reaches 8,000 weekly community participants.', s: '🎯' },
            { y: '2035', t: 'First Women’s Champions League qualification.', s: '🏆' },
          ].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-3">
              <div className="absolute left-[-18px] w-3 h-3 rounded-full" style={{ backgroundColor: m.s === '🏆' ? C.gold : m.s === '🔄' ? C.primary : C.border, border: `2px solid ${C.card}`, top: 3 }} />
              <p className="text-xs"><span className="font-bold" style={{ color: m.s === '🏆' ? C.gold : C.text }}>{m.y}</span> <span style={{ color: C.muted }}>— {m.t} {m.s}</span></p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="text-center">
        <p className="text-sm italic leading-relaxed" style={{ color: C.text2 }}>&ldquo;The decisions we make today — on infrastructure, the talent pathway, and financial discipline — will define what Oakridge Women becomes for the next generation of players and this community.&rdquo;</p>
        <p className="text-xs mt-2" style={{ color: C.gold }}>— Diane Hartley, Chair</p>
      </Card>
    </div>
  )
}

// ─── Export ────────────────────────────────────────────────────────────────
export default function WomensClubVisionTab() {
  const [plan, setPlan] = useState<PlanTab>('1yr')
  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {([{ id: '1yr' as PlanTab, label: '1 Year' }, { id: '3yr' as PlanTab, label: '3 Year' }, { id: '5yr' as PlanTab, label: '5 Year' }, { id: '10yr' as PlanTab, label: '10 Year' }]).map(t => (
          <button key={t.id} onClick={() => setPlan(t.id)} className="px-4 py-1.5 rounded-full text-[13px] font-semibold"
            style={{ backgroundColor: plan === t.id ? C.primary : '#111318', color: plan === t.id ? '#fff' : C.muted, border: plan === t.id ? 'none' : `1px solid ${C.border}` }}>
            {t.label}
          </button>
        ))}
      </div>
      {plan === '1yr' && <OneYear />}
      {plan === '3yr' && <ThreeYear />}
      {plan === '5yr' && <FiveYear />}
      {plan === '10yr' && <TenYear />}
    </div>
  )
}
