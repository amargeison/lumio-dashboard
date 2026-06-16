'use client'

import { useState } from 'react'
import { Trophy, DollarSign, Tv, Users, Clock, Filter, Award } from 'lucide-react'

// Men's Pro — Cup Manager. FA Cup + EFL Cup brackets, prize-money modelling,
// TV broadcast forecasting, ticketing surge. Blue-themed. Mirrors women's.

const C = {
  card: '#0D1017', cardAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', textSec: '#9CA3AF', muted: '#6B7280',
  primary: '#003DA5', accent: '#60A5FA', gold: '#2563EB',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', purple: '#8B5CF6', blue: '#3B82F6',
} as const

type Cup = 'fa-cup' | 'efl-cup'
type Round = { id: string; name: string; status: 'pending' | 'drawn' | 'in-progress' | 'complete'; opp?: string; ha?: 'H' | 'A'; result?: 'W' | 'L' | 'D'; score?: string; date?: string; prizeIfWin: number; prizeIfReach: number; tvFee?: number }

const FA_CUP_RUN: Round[] = [
  { id: 'fa-r3', name: 'Round 3',         status: 'complete',    opp: 'Brookvale Town',     ha: 'A', result: 'W', score: '3-1', date: '05 Apr', prizeIfReach: 105000, prizeIfWin: 115000 },
  { id: 'fa-r4', name: 'Round 4',         status: 'complete',    opp: 'Ashbourne FC',       ha: 'H', result: 'W', score: '2-0', date: '19 Apr', prizeIfReach: 120000, prizeIfWin: 140000 },
  { id: 'fa-r5', name: 'Round 5',         status: 'in-progress', opp: 'Kingsmere City',     ha: 'A',                              date: '03 Jun', prizeIfReach: 225000, prizeIfWin: 360000,  tvFee: 200000 },
  { id: 'fa-qf', name: 'Quarter-Final',   status: 'pending',                                                                     prizeIfReach: 450000, prizeIfWin: 720000,  tvFee: 350000 },
  { id: 'fa-sf', name: 'Semi-Final (Wembley)', status: 'pending',                                                                prizeIfReach: 1000000, prizeIfWin: 2000000, tvFee: 600000 },
]

const EFL_CUP_RUN: Round[] = [
  { id: 'ec-r1', name: 'Round 1',         status: 'complete',    opp: 'Thornvale United',   ha: 'H', result: 'W', score: '2-0', date: '12 Aug', prizeIfReach: 40000,  prizeIfWin: 50000 },
  { id: 'ec-r2', name: 'Round 2',         status: 'complete',    opp: 'Hartwell Athletic',  ha: 'A', result: 'W', score: '1-0', date: '28 Aug', prizeIfReach: 50000,  prizeIfWin: 60000 },
  { id: 'ec-r3', name: 'Round 3',         status: 'complete',    opp: 'Ridgefield Athletic',ha: 'H', result: 'W', score: '3-1', date: '24 Sep', prizeIfReach: 60000,  prizeIfWin: 90000 },
  { id: 'ec-r4', name: 'Round 4',         status: 'complete',    opp: 'Glenmoor Wanderers', ha: 'A', result: 'W', score: '2-1', date: '29 Oct', prizeIfReach: 90000,  prizeIfWin: 140000 },
  { id: 'ec-qf', name: 'Quarter-Final',   status: 'drawn',       opp: 'Penmarric Rovers',   ha: 'A',                              date: '20 May', prizeIfReach: 140000, prizeIfWin: 250000,  tvFee: 150000 },
  { id: 'ec-sf', name: 'Semi-Final (2 legs)', status: 'pending',                                                                 prizeIfReach: 250000, prizeIfWin: 500000,  tvFee: 300000 },
]

const PROJECTED_REVENUE = {
  fa_cup: { confirmed: 115000 + 140000, projected_best: 2000000 + 720000 + 360000 + 140000 + 115000 },
  efl_cup: { confirmed: 50000 + 60000 + 90000 + 140000, projected_best: 500000 + 250000 + 140000 + 90000 },
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}><Icon size={14} style={{ color }} /></div></div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color: C.textSec }}>{sub}</p>}
    </div>
  )
}
function fmtGBP(n: number): string { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n) }

function CupBracket({ rounds }: { rounds: Round[] }) {
  return (
    <div className="space-y-2">
      {rounds.map(r => {
        const statusColor = r.status === 'complete' ? C.good : r.status === 'drawn' || r.status === 'in-progress' ? C.warn : C.muted
        const isLastRound = r.name.toLowerCase().includes('final') && !r.name.toLowerCase().includes('semi')
        return (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#0A0B10', border: `1px solid ${isLastRound ? C.gold : C.border}` }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: isLastRound ? `${C.gold}1A` : `${statusColor}1A` }}>{isLastRound ? <Trophy size={16} style={{ color: C.gold }} /> : <Award size={14} style={{ color: statusColor }} />}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-bold" style={{ color: C.text }}>{r.name}</p><span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: `${statusColor}1A`, color: statusColor }}>{r.status === 'complete' && r.result ? `${r.result} ${r.score}` : r.status.replace('-', ' ')}</span></div>
              <p className="text-[11px] mt-0.5" style={{ color: C.textSec }}>{r.opp ? `${r.ha === 'H' ? 'vs' : '@'} ${r.opp}` : '— TBD —'} {r.date && `· ${r.date}`}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold" style={{ color: C.good }}>{fmtGBP(r.status === 'complete' ? r.prizeIfWin : r.prizeIfReach)}</p>
              <p className="text-[10px]" style={{ color: C.muted }}>{r.status === 'complete' ? 'banked' : 'to reach'}</p>
              {r.tvFee && <p className="text-[10px] mt-1" style={{ color: C.blue }}><Tv size={9} className="inline mr-0.5" />TV £{(r.tvFee / 1000).toFixed(0)}k</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FootballCupManagerView() {
  const [activeCup, setActiveCup] = useState<Cup>('fa-cup')
  const rounds = activeCup === 'fa-cup' ? FA_CUP_RUN : EFL_CUP_RUN
  const proj = activeCup === 'fa-cup' ? PROJECTED_REVENUE.fa_cup : PROJECTED_REVENUE.efl_cup
  const completed = rounds.filter(r => r.status === 'complete')
  const winRecord = completed.filter(r => r.result === 'W').length
  const nextR = rounds.find(r => r.status === 'drawn' || r.status === 'in-progress')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Cup Manager</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>FA Cup · EFL Cup — bracket tracking, prize-money modelling, TV broadcast forecasting.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.muted }}><Filter size={12} /> Competition</span>
        <button onClick={() => setActiveCup('fa-cup')} className="px-3 py-1.5 rounded-md text-xs font-semibold" style={{ backgroundColor: activeCup === 'fa-cup' ? C.primary : '#111318', color: activeCup === 'fa-cup' ? '#fff' : C.muted, border: `1px solid ${activeCup === 'fa-cup' ? C.primary : C.border}` }}>FA Cup</button>
        <button onClick={() => setActiveCup('efl-cup')} className="px-3 py-1.5 rounded-md text-xs font-semibold" style={{ backgroundColor: activeCup === 'efl-cup' ? C.primary : '#111318', color: activeCup === 'efl-cup' ? '#fff' : C.muted, border: `1px solid ${activeCup === 'efl-cup' ? C.primary : C.border}` }}>EFL Cup</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Rounds Played"      value={`${completed.length}`}       sub={`${winRecord}W from ${completed.length}`} icon={Trophy}     color={C.accent} />
        <StatCard label="Prize Money Banked" value={fmtGBP(proj.confirmed)}      sub="confirmed YTD"                            icon={DollarSign} color={C.good} />
        <StatCard label="Best-Case Run"      value={fmtGBP(proj.projected_best)} sub="all remaining wins"                       icon={Award}      color={C.gold} />
        <StatCard label="Next Match"         value={nextR?.date ?? '—'}          sub={nextR?.opp ?? 'no draw yet'}              icon={Clock}      color={C.warn} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <p className="text-sm font-bold mb-4" style={{ color: C.text }}>{activeCup === 'fa-cup' ? 'FA Cup — Oakridge FC Run' : 'EFL Cup — Oakridge FC Run'}</p>
        <CupBracket rounds={rounds} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><div className="flex items-center gap-2"><Users size={14} style={{ color: C.accent }} /><p className="text-sm font-semibold" style={{ color: C.text }}>Ticketing Surge Forecast</p></div><span className="text-xs" style={{ color: C.muted }}>Capacity 24,000</span></div>
        <div className="p-5 space-y-3">
          {[
            { round: 'EFL Cup QF · 20 May (away)',        tickets: 'Travel allocation — 3,000 away tickets',  revenue: 90000,  status: 'on-sale' },
            { round: 'FA Cup R5 · 03 Jun (away)',          tickets: 'Travel allocation — 4,500 away tickets',  revenue: 135000, status: 'on-sale' },
            { round: 'FA Cup QF (if reached, home)',       tickets: 'Full house — 24,000 + segregation',       revenue: 620000, status: 'pending' },
            { round: 'FA Cup Semi-Final (if reached)',     tickets: 'Wembley allocation — ~33,000 tickets',    revenue: 1450000, status: 'pending' },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold" style={{ color: C.text }}>{t.round}</p><p className="text-[11px] mt-0.5" style={{ color: C.textSec }}>{t.tickets}</p></div>
              <div className="text-right shrink-0 ml-3"><p className="text-sm font-bold" style={{ color: C.good }}>{fmtGBP(t.revenue)}</p><span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: t.status === 'on-sale' ? `${C.good}1A` : `${C.warn}1A`, color: t.status === 'on-sale' ? C.good : C.warn }}>{t.status}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
