'use client'

import { useState } from 'react'

const C = { card: '#0D1017', border: '#1F2937', text: '#F9FAFB', muted: '#6B7280', teal: '#0D9488', purple: '#6C3FC5', gold: '#F1C40F', green: '#10B981', amber: '#F59E0B', red: '#EF4444' } as const

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>{children}</div>
}
function SH({ text }: { text: string }) {
  return <div style={{ borderLeft: `3px solid ${C.purple}`, paddingLeft: 12, marginBottom: 16 }}><h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{text}</h3></div>
}
function Bar({ pct, color = C.teal }: { pct: number; color?: string }) {
  return <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} /></div>
}

type PlanTab = '1yr' | '3yr' | '5yr' | '10yr'

// ─── 1 Year ──────────────────────────────────────────────────────────────────

function OneYear() {
  return (
    <div className="space-y-5">
      <SH text="Season Objectives (2025/26)" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[
          { icon: '🏆', title: 'Finish top 4 in league', current: 'Current: 6th', pct: 60, status: 'On Track', sc: C.amber },
          { icon: '💰', title: 'Reduce wage ratio to <58%', current: 'Current: 62%', pct: 40, status: 'Behind', sc: C.red },
          { icon: '👥', title: 'Sign 3 quality additions', current: '1 of 3 signed', pct: 33, status: 'In Progress', sc: C.amber },
          { icon: '🏟️', title: 'Complete West Stand repairs', current: 'Works ongoing', pct: 80, status: 'On Track', sc: C.green },
        ].map(g => (
          <Card key={g.title}>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-lg">{g.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: C.text }}>{g.title}</p>
                <p className="text-[10px]" style={{ color: C.muted }}>{g.current}</p>
              </div>
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
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Role', 'Target Profile', 'Budget', 'Priority', 'Status'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              { r: 'Striker', t: 'Clinical finisher, U26, 15+ goals/season', b: '£150K', p: '🔴 High', s: 'Searching' },
              { r: 'CM', t: 'Box-to-box, high press, U24', b: '£95K', p: '🔴 High', s: 'Shortlist of 3' },
              { r: 'RB', t: 'Attack-minded, set piece delivery', b: '£65K', p: '🟡 Med', s: 'Scouting' },
              { r: 'GK (backup)', t: 'Experienced, 25-30, solid', b: '£40K', p: '🟢 Low', s: 'Monitoring' },
            ].map(row => (
              <tr key={row.r} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3 font-bold" style={{ color: C.text }}>{row.r}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{row.t}</td>
                <td className="py-2 px-3 font-bold" style={{ color: C.text }}>{row.b}</td>
                <td className="py-2 px-3">{row.p}</td>
                <td className="py-2 px-3" style={{ color: C.teal }}>{row.s}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] mt-3 px-3" style={{ color: C.muted }}>Budget remaining: £350K · Max spend: £500K</p>
      </Card>

      <SH text="Key Milestones Timeline" />
      <Card>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ backgroundColor: C.border }} />
          {[
            'Apr 2025 — West Stand inspection',
            'May 2025 — End of season review + contract decisions',
            'Jun 2025 — Summer window opens',
            'Jul 2025 — Pre-season begins (3 signings target)',
            'Aug 2025 — 2025/26 season kicks off',
            'Sep 2025 — Q1 financial review',
            'Oct 2025 — Academy EPPP re-assessment',
            'Nov 2025 — Mid-season board review',
            'Dec 2025 — Winter window planning',
            'Jan 2026 — Winter window (budget: £80K)',
            'Mar 2026 — Financial year-end',
            'Apr 2026 — Season run-in, top-4 push',
          ].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-3">
              <div className="absolute left-[-18px] w-3 h-3 rounded-full" style={{ backgroundColor: i < 2 ? C.teal : C.border, border: `2px solid ${C.card}`, top: 3 }} />
              <p className="text-xs" style={{ color: i < 2 ? C.text : C.muted }}>{m}</p>
            </div>
          ))}
        </div>
      </Card>

      <SH text="Financial Targets" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Metric', '2024/25 Actual', '2025/26 Target', 'Change'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              { m: 'Total Revenue', a: '£8.2M', t: '£9.1M', ch: '▲+11%', ok: true },
              { m: 'Wage Bill', a: '£2.52M', t: '£2.45M', ch: '▼-3%', ok: true },
              { m: 'Wage Ratio', a: '62%', t: '58%', ch: '▼-4pts', ok: true },
              { m: 'Matchday Revenue', a: '£480K', t: '£560K', ch: '▲+17%', ok: true },
              { m: 'Commercial Income', a: '£270K', t: '£340K', ch: '▲+26%', ok: true },
              { m: 'Net Transfer Spend', a: '-£2.1M', t: '-£500K', ch: 'Reduced', ok: true },
              { m: 'Operating Profit', a: '£160K', t: '£420K', ch: '▲+163%', ok: true },
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
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ l: 'Retain', v: '18 players', i: '✅' }, { l: 'Release', v: '4 (out of contract)', i: '🔄' }, { l: 'Sign', v: '3 targets', i: '🎯' }, { l: 'Promote', v: '2 (Adeyemi, Osei)', i: '🎓' }].map(s => (
          <Card key={s.l}><span className="text-lg">{s.i}</span><p className="text-lg font-black mt-1" style={{ color: C.text }}>{s.v}</p><p className="text-[10px]" style={{ color: C.muted }}>{s.l}</p></Card>
        ))}
      </div>
    </div>
  )
}

// ─── 3 Year ──────────────────────────────────────────────────────────────────

function ThreeYear() {
  return (
    <div className="space-y-5">
      <Card className="text-center">
        <p className="text-sm italic leading-relaxed" style={{ color: C.gold }}>&ldquo;To establish Oakridge FC as a consistently competitive force in the top tier of non-league football, with a self-sustaining model built on academy talent, commercial growth, and a stadium fit for promotion.&rdquo;</p>
      </Card>

      <SH text="3-Year KPI Roadmap" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['KPI', '2025/26', '2026/27', '2027/28'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              ['League Target', 'Top 4', 'Top 2 / Playoff', 'Promoted'],
              ['Revenue Target', '£9.1M', '£11.2M', '£14.8M'],
              ['Wage Ratio', '58%', '55%', '52%'],
              ['Avg Attendance', '4,600', '5,100', '5,800'],
              ['Season Tickets', '2,100', '2,600', '3,200'],
              ['Squad Value', '£26M', '£31M', '£38M'],
              ['Academy grads in XI', '3', '5', '7'],
              ['Stadium capacity', '6,000', '6,000', '7,500'],
            ].map(row => (
              <tr key={row[0]} style={{ borderBottom: `1px solid ${C.border}` }}>
                {row.map((cell, i) => <td key={i} className="py-2 px-3" style={{ color: i === 0 ? C.text : i === 3 ? C.teal : C.muted, fontWeight: i === 3 ? 700 : 400 }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SH text="Investment Priorities" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { t: 'Playing Squad', items: ['Year 1: £500K (3 signings)', 'Year 2: £750K (4 signings)', 'Year 3: £1.2M (marquee signing)'], total: '£2.45M' },
          { t: 'Infrastructure', items: ['Year 1: £88K (West Stand, CCTV)', 'Year 2: £320K (East Stand planning)', 'Year 3: £1.8M (East Stand build)'], total: '£2.2M' },
          { t: 'Commercial & Academy', items: ['Year 1: £45K (new kit deal)', 'Year 2: £120K (sponsors, streaming)', 'Year 3: £200K (hospitality expansion)'], total: '£365K + £320K/yr academy' },
        ].map(col => (
          <Card key={col.t}>
            <p className="text-xs font-bold mb-3" style={{ color: C.text }}>{col.t}</p>
            <div className="space-y-1.5 mb-3">{col.items.map(i => <p key={i} className="text-[10px]" style={{ color: C.muted }}>{i}</p>)}</div>
            <p className="text-xs font-bold" style={{ color: C.teal }}>Total: {col.total}</p>
          </Card>
        ))}
      </div>

      <SH text="Risk Assessment" />
      <div className="space-y-2">
        {[
          { t: 'Promotion not achieved by Year 3', m: 'Revenue model requires higher league income', c: C.red, l: 'HIGH' },
          { t: 'Key player sales forced due to wage pressure', m: 'Retain top talent within budget constraints', c: C.red, l: 'HIGH' },
          { t: 'East Stand planning permission delayed', m: 'Early engagement with council ongoing', c: C.amber, l: 'MED' },
          { t: 'Competitor clubs outspend in transfer market', m: 'Focus on academy and smart recruitment', c: C.amber, l: 'MED' },
          { t: 'Academy pipeline underperforms', m: 'Scholarship programme and loan network', c: C.green, l: 'LOW' },
          { t: 'Commercial partner pulls out', m: 'Diversified sponsor portfolio', c: C.green, l: 'LOW' },
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
          { y: '2024/25', s: 'Top 6', st: '✅', c: C.green },
          { y: '2025/26', s: 'Top 4', st: '🎯', c: C.amber },
          { y: '2026/27', s: 'Top 2 / Playoff', st: '🎯', c: C.amber },
          { y: '2027/28', s: 'PROMOTED', st: '🏆', c: C.gold },
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

// ─── 5 Year ──────────────────────────────────────────────────────────────────

function FiveYear() {
  const revData = [{ y: '25/26', v: 9.1 }, { y: '26/27', v: 11.2 }, { y: '27/28', v: 14.8 }, { y: '28/29', v: 18.4 }, { y: '29/30', v: 22.6 }]
  const max = 25
  return (
    <div className="space-y-5">
      <Card className="text-center">
        <p className="text-lg font-black" style={{ color: C.gold }}>Oakridge FC — From Non-League to Football League by 2030</p>
      </Card>

      <SH text="5-Year Revenue Forecast" />
      <Card>
        <div className="flex items-end gap-4 justify-center" style={{ height: 200 }}>
          {revData.map(d => (
            <div key={d.y} className="flex flex-col items-center flex-1">
              <span className="text-xs font-bold mb-1" style={{ color: C.text }}>£{d.v}M</span>
              <div className="w-full rounded-t" style={{ height: (d.v / max) * 170, backgroundColor: C.teal, maxWidth: 60 }} />
              <span className="text-[10px] mt-2" style={{ color: C.muted }}>{d.y}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['', '25/26', '26/27', '27/28', '28/29', '29/30'].map(h => <th key={h} className="text-left py-2 px-2 font-semibold" style={{ color: C.muted }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[['Revenue', '£9.1M', '£11.2M', '£14.8M', '£18.4M', '£22.6M'], ['Costs', '£8.7M', '£10.1M', '£12.9M', '£15.2M', '£18.1M'], ['Net', '+£0.4M', '+£1.1M', '+£1.9M', '+£3.2M', '+£4.5M']].map(row => (
              <tr key={row[0]} style={{ borderBottom: `1px solid ${C.border}` }}>
                {row.map((c, i) => <td key={i} className="py-2 px-2" style={{ color: row[0] === 'Net' ? C.green : i === 0 ? C.text : C.muted, fontWeight: row[0] === 'Net' ? 700 : 400 }}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SH text="Stadium Development Plan" />
      <Card>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ backgroundColor: C.border }} />
          {['2025: West Stand repairs (£88K) ✅ In progress', '2026: East Stand planning permission submitted', '2027: East Stand build begins (£1.8M, +1,500 → 7,500)', '2028: East Stand opens, 12 hospitality boxes launched', '2029: North Stand redevelopment feasibility study', '2030: Stadium capacity review — target 10,000'].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-3">
              <div className="absolute left-[-18px] w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? C.green : i < 3 ? C.amber : C.muted, border: `2px solid ${C.card}`, top: 3 }} />
              <p className="text-xs" style={{ color: C.text }}>{m}</p>
            </div>
          ))}
        </div>
      </Card>

      <SH text="Academy 5-Year Pipeline" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Age Now', 'Pos', '5-Yr Projection'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
          <tbody>
            {[['R. Adeyemi', '18', 'ST', 'First team regular by 2026'], ['C. Walsh', '17', 'CM', 'Pro contract 2027'], ['J. Nkosi', '19', 'RB', 'Loan → first team 2026'], ['P. Diallo', '16', 'LW', 'Breakthrough by 2028'], ['B. Osei', '18', 'GK', 'Backup GK by 2026']].map(r => (
              <tr key={r[0]} style={{ borderBottom: `1px solid ${C.border}` }}>{r.map((c, i) => <td key={i} className="py-2 px-3" style={{ color: i === 3 ? C.teal : i === 0 ? C.text : C.muted }}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs mt-3 px-3 font-bold" style={{ color: C.teal }}>Projected academy value by 2030: £4.2M</p>
      </Card>

      <SH text="Commercial Growth Strategy" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ t: 'Kit deal renewal 2026', v: '£180K/yr target', s: '🎯 Planned' }, { t: 'Hospitality boxes (12) 2028', v: '£240K/yr target', s: '🎯 Planned' }, { t: 'Streaming/digital 2027', v: '£60K/yr target', s: '🔄 Exploring' }, { t: 'Community grants', v: '£85K/yr target', s: '✅ Active' }].map(g => (
          <Card key={g.t}><p className="text-xs font-bold" style={{ color: C.text }}>{g.t}</p><p className="text-[10px] mt-1" style={{ color: C.muted }}>{g.v}</p><p className="text-[10px] mt-1" style={{ color: C.teal }}>{g.s}</p></Card>
        ))}
      </div>

      <SH text="5-Year Headcount Plan" />
      <Card>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Area', 'Now', '2027', '2030'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
          <tbody>
            {[['Playing staff', '23', '26', '30'], ['Coaching staff', '5', '7', '10'], ['Commercial/Admin', '8', '12', '18'], ['Academy staff', '6', '9', '12'], ['Total', '42', '54', '70']].map(r => (
              <tr key={r[0]} style={{ borderBottom: `1px solid ${C.border}` }}>{r.map((c, i) => <td key={i} className="py-2 px-3" style={{ color: r[0] === 'Total' ? C.text : i === 0 ? C.text : C.muted, fontWeight: r[0] === 'Total' ? 700 : 400 }}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── 10 Year ─────────────────────────────────────────────────────────────────

function TenYear() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-6 text-center" style={{ background: `linear-gradient(135deg, ${C.teal}15, ${C.purple}15)`, border: `1px solid ${C.teal}40` }}>
        <p className="text-base font-black leading-relaxed" style={{ color: C.gold }}>&ldquo;By 2035, Oakridge FC will be an established Football League club with a 10,000-capacity stadium, a nationally recognised academy, and a financially self-sustaining model generating £40M+ annual revenue.&rdquo;</p>
      </div>

      <SH text="10-Year Ambitions" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { i: '🏆', t: 'On-Pitch', d: 'Football League (League Two) by 2030. League One challenge by 2035.' },
          { i: '🏟️', t: 'Stadium', d: '10,000 capacity by 2033. Modern facilities. Naming rights deal.' },
          { i: '🎓', t: 'Academy', d: 'Category 2 status by 2030. 10+ first team graduates by 2035.' },
          { i: '💰', t: 'Finance', d: '£40M revenue by 2035. Wage ratio <50%. Zero net debt.' },
          { i: '🌍', t: 'Community', d: '50,000 registered supporters. Charity arm. Schools programme.' },
          { i: '📱', t: 'Commercial', d: 'National brand recognition. Own streaming platform. Kit sales 20K+/yr.' },
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
                ['2025/26', '£9.1M', '£8.7M', '+£0.4M', '+£0.4M'], ['2026/27', '£11.2M', '£10.1M', '+£1.1M', '+£1.5M'],
                ['2027/28', '£14.8M', '£12.9M', '+£1.9M', '+£3.4M'], ['2028/29', '£18.4M', '£15.2M', '+£3.2M', '+£6.6M'],
                ['2029/30', '£22.6M', '£18.1M', '+£4.5M', '+£11.1M'], ['2030/31', '£26.8M', '£21.0M', '+£5.8M', '+£16.9M'],
                ['2031/32', '£30.4M', '£23.5M', '+£6.9M', '+£23.8M'], ['2032/33', '£34.1M', '£26.0M', '+£8.1M', '+£31.9M'],
                ['2033/34', '£37.8M', '£28.8M', '+£9.0M', '+£40.9M'], ['2034/35', '£41.2M', '£31.0M', '+£10.2M', '+£51.1M'],
              ].map(r => (
                <tr key={r[0]} style={{ borderBottom: `1px solid ${C.border}` }}>
                  {r.map((c, i) => <td key={i} className="py-1.5 px-2" style={{ color: i === 3 ? C.green : i === 4 ? C.teal : i === 0 ? C.text : C.muted, fontWeight: i >= 3 ? 700 : 400 }}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SH text="Legacy Milestones" />
      <Card>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ backgroundColor: C.border }} />
          {[
            { y: '2025', t: 'West Stand repaired. Top 4 push.', s: '🔄' },
            { y: '2026', t: 'East Stand planning. Summer rebuild.', s: '🎯' },
            { y: '2027', t: 'Promotion playoff. East Stand build.', s: '🎯' },
            { y: '2028', t: 'PROMOTED to National League. Stadium 7,500.', s: '🏆' },
            { y: '2029', t: 'National League consolidation. Academy Cat 2 bid.', s: '🎯' },
            { y: '2030', t: 'Football League promotion. £22M revenue.', s: '🏆' },
            { y: '2031', t: 'League Two. New commercial deals. Naming rights.', s: '🎯' },
            { y: '2032', t: 'League Two mid-table. £30M revenue.', s: '🎯' },
            { y: '2033', t: 'Stadium 10,000. League One target.', s: '🎯' },
            { y: '2034', t: 'League One challenge. Academy producing regulars.', s: '🎯' },
            { y: '2035', t: 'Established Football League club. £40M+ revenue.', s: '🏆' },
          ].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-3">
              <div className="absolute left-[-18px] w-3 h-3 rounded-full" style={{ backgroundColor: m.s === '🏆' ? C.gold : m.s === '🔄' ? C.teal : C.border, border: `2px solid ${C.card}`, top: 3 }} />
              <p className="text-xs"><span className="font-bold" style={{ color: m.s === '🏆' ? C.gold : C.text }}>{m.y}</span> <span style={{ color: C.muted }}>— {m.t} {m.s}</span></p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="text-center">
        <p className="text-sm italic leading-relaxed" style={{ color: '#D1D5DB' }}>&ldquo;The decisions we make today — on infrastructure, youth, and financial discipline — will define what Oakridge FC becomes for the next generation of supporters, players, and this community.&rdquo;</p>
        <p className="text-xs mt-2" style={{ color: C.gold }}>— James Hartley, Chairman</p>
      </Card>
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

export default function ClubPlannerTab() {
  const [plan, setPlan] = useState<PlanTab>('1yr')
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {([{ id: '1yr' as PlanTab, label: '1 Year' }, { id: '3yr' as PlanTab, label: '3 Year' }, { id: '5yr' as PlanTab, label: '5 Year' }, { id: '10yr' as PlanTab, label: '10 Year' }]).map(t => (
          <button key={t.id} onClick={() => setPlan(t.id)} className="px-4 py-1.5 rounded-full text-[13px] font-semibold"
            style={{ backgroundColor: plan === t.id ? C.teal : '#111318', color: plan === t.id ? '#fff' : C.muted, border: plan === t.id ? 'none' : `1px solid ${C.border}` }}>
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
