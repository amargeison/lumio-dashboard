'use client'

import { useState } from 'react'
import {
  Trophy, DollarSign, Tv, Users, Clock, Filter, Award,
} from 'lucide-react'

// Women's Cup Manager — Women's FA Cup + WSL Cup brackets, prize money
// modelling, TV broadcast forecasting, ticketing surge management.
// New build (no source anywhere). Pink-themed, women's-game-specific
// content (Women's FA Cup prize structure, WSL Cup format).

const C = {
  bg: '#0F172A',
  card: '#0D1017',
  cardAlt: '#111318',
  border: '#1F2937',
  text: '#F9FAFB',
  textSec: '#9CA3AF',
  muted: '#6B7280',
  primary: '#EC4899',
  gold: '#BE185D',
  good: '#22C55E',
  warn: '#F59E0B',
  bad: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
} as const

type Cup = 'fa-cup' | 'wsl-cup'

type Round = {
  id: string
  name: string
  status: 'pending' | 'drawn' | 'in-progress' | 'complete'
  opp?: string
  ha?: 'H' | 'A'
  result?: 'W' | 'L' | 'D'
  score?: string
  date?: string
  prizeIfWin: number
  prizeIfReach: number
  tvFee?: number
}

const FA_CUP_RUN: Round[] = [
  { id: 'fa-r2', name: 'Round 2',            status: 'complete',    opp: 'Castleton Women',     ha: 'A', result: 'W', score: '4-1', date: '05 Apr', prizeIfReach: 12500,  prizeIfWin: 18000 },
  { id: 'fa-r3', name: 'Round 3',            status: 'complete',    opp: 'Brindleford Town W',  ha: 'H', result: 'W', score: '3-0', date: '19 Apr', prizeIfReach: 18000,  prizeIfWin: 30000 },
  { id: 'fa-qf', name: 'Quarter-Final',      status: 'in-progress', opp: 'Marlow Bridge W',     ha: 'A',                              date: '03 Jun', prizeIfReach: 30000,  prizeIfWin: 50000,  tvFee: 25000 },
  { id: 'fa-sf', name: 'Semi-Final',         status: 'pending',                                                                                       prizeIfReach: 50000,  prizeIfWin: 90000,  tvFee: 60000 },
  { id: 'fa-f',  name: 'Final (Wembley)',    status: 'pending',                                                                                       prizeIfReach: 90000,  prizeIfWin: 250000, tvFee: 250000 },
]

const WSL_CUP_RUN: Round[] = [
  { id: 'wc-g1', name: 'Group Stage M1',     status: 'complete',    opp: 'Thornvale Ladies',     ha: 'H', result: 'W', score: '2-0', date: '14 Mar', prizeIfReach: 8000,   prizeIfWin: 10000 },
  { id: 'wc-g2', name: 'Group Stage M2',     status: 'complete',    opp: 'Hartwell Women',       ha: 'A', result: 'D', score: '1-1', date: '28 Mar', prizeIfReach: 8000,   prizeIfWin: 10000 },
  { id: 'wc-g3', name: 'Group Stage M3',     status: 'complete',    opp: 'Ridgefield Ath W',     ha: 'H', result: 'W', score: '3-1', date: '11 Apr', prizeIfReach: 8000,   prizeIfWin: 10000 },
  { id: 'wc-qf', name: 'Quarter-Final',      status: 'complete',    opp: 'Glenmoor Wanderers W', ha: 'A', result: 'W', score: '2-1', date: '02 May', prizeIfReach: 15000,  prizeIfWin: 25000 },
  { id: 'wc-sf', name: 'Semi-Final',         status: 'drawn',       opp: 'Ridgefield Athletic Women', ha: 'A',                       date: '20 May', prizeIfReach: 25000,  prizeIfWin: 50000,  tvFee: 35000 },
  { id: 'wc-f',  name: 'Final (Neutral)',    status: 'pending',                                                                                       prizeIfReach: 50000,  prizeIfWin: 120000, tvFee: 100000 },
]

const PROJECTED_REVENUE = {
  fa_cup: { confirmed: 18000 + 30000, projected_best: 250000 + 90000 + 50000 + 30000 + 18000 },
  wsl_cup: { confirmed: 10000 + 10000 + 10000 + 25000, projected_best: 120000 + 50000 + 25000 + 30000 },
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color: C.textSec }}>{sub}</p>}
    </div>
  )
}

function fmtGBP(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
}

function CupBracket({ rounds }: { rounds: Round[] }) {
  return (
    <div className="space-y-2">
      {rounds.map((r, i) => {
        const statusColor = r.status === 'complete' ? C.good : r.status === 'drawn' || r.status === 'in-progress' ? C.warn : C.muted
        const isLastRound = r.name.toLowerCase().includes('final') && !r.name.toLowerCase().includes('semi')
        return (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#0A0B10', border: `1px solid ${isLastRound ? C.gold : C.border}` }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: isLastRound ? `${C.gold}1A` : `${statusColor}1A` }}>
              {isLastRound ? <Trophy size={16} style={{ color: C.gold }} /> : <Award size={14} style={{ color: statusColor }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold" style={{ color: C.text }}>{r.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: `${statusColor}1A`, color: statusColor }}>
                  {r.status === 'complete' && r.result ? `${r.result} ${r.score}` : r.status.replace('-', ' ')}
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: C.textSec }}>
                {r.opp ? `${r.ha === 'H' ? 'vs' : '@'} ${r.opp}` : '— TBD —'} {r.date && `· ${r.date}`}
              </p>
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

export default function WomensCupManagerView() {
  const [activeCup, setActiveCup] = useState<Cup>('fa-cup')
  const rounds = activeCup === 'fa-cup' ? FA_CUP_RUN : WSL_CUP_RUN
  const proj = activeCup === 'fa-cup' ? PROJECTED_REVENUE.fa_cup : PROJECTED_REVENUE.wsl_cup
  const completed = rounds.filter(r => r.status === 'complete')
  const winRecord = completed.filter(r => r.result === 'W').length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Cup Manager</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>Women&apos;s FA Cup · WSL Cup — bracket tracking, prize money modelling, TV broadcast forecasting.</p>
      </div>

      {/* Cup selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.muted }}>
          <Filter size={12} /> Competition
        </span>
        <button onClick={() => setActiveCup('fa-cup')} className="px-3 py-1.5 rounded-md text-xs font-semibold"
          style={{ backgroundColor: activeCup === 'fa-cup' ? C.primary : '#111318', color: activeCup === 'fa-cup' ? '#fff' : C.muted, border: `1px solid ${activeCup === 'fa-cup' ? C.primary : C.border}` }}>
          Women&apos;s FA Cup
        </button>
        <button onClick={() => setActiveCup('wsl-cup')} className="px-3 py-1.5 rounded-md text-xs font-semibold"
          style={{ backgroundColor: activeCup === 'wsl-cup' ? C.primary : '#111318', color: activeCup === 'wsl-cup' ? '#fff' : C.muted, border: `1px solid ${activeCup === 'wsl-cup' ? C.primary : C.border}` }}>
          WSL Cup
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Rounds Played"       value={`${completed.length}`}              sub={`${winRecord}W from ${completed.length}`} icon={Trophy}     color={C.primary} />
        <StatCard label="Prize Money Banked"  value={fmtGBP(proj.confirmed)}             sub="confirmed YTD"                            icon={DollarSign} color={C.good} />
        <StatCard label="Best-Case Run"       value={fmtGBP(proj.projected_best)}        sub="all remaining wins"                       icon={Award}      color={C.gold} />
        <StatCard label="Next Match"          value={rounds.find(r => r.status === 'drawn' || r.status === 'in-progress')?.date ?? '—'}
                  sub={rounds.find(r => r.status === 'drawn' || r.status === 'in-progress')?.opp ?? 'no draw yet'}
                  icon={Clock}      color={C.warn} />
      </div>

      {/* Bracket */}
      <div className="rounded-xl p-5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <p className="text-sm font-bold mb-4" style={{ color: C.text }}>
          {activeCup === 'fa-cup' ? "Women's FA Cup — Oakridge Women Run" : 'WSL Cup — Oakridge Women Run'}
        </p>
        <CupBracket rounds={rounds} />
      </div>

      {/* Ticketing surge */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Users size={14} style={{ color: C.primary }} />
            <p className="text-sm font-semibold" style={{ color: C.text }}>Ticketing Surge Forecast</p>
          </div>
          <span className="text-xs" style={{ color: C.muted }}>Capacity 4,500</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { round: 'WSL Cup Semi-Final · 20 May (away)',         tickets: 'Travel allocation — 800 away tickets',    revenue: 18000,  status: 'on-sale' },
            { round: "Women's FA Cup QF · 03 Jun (away)",          tickets: 'Travel allocation — 1,200 away tickets',  revenue: 30000,  status: 'on-sale' },
            { round: "Women's FA Cup SF (if reached)",              tickets: 'Wembley allocation — ~12,000 tickets',    revenue: 220000, status: 'pending' },
            { round: "Women's FA Cup Final (if reached)",           tickets: 'Wembley allocation — ~20,000 tickets',    revenue: 480000, status: 'pending' },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: C.text }}>{t.round}</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.textSec }}>{t.tickets}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-bold" style={{ color: C.good }}>{fmtGBP(t.revenue)}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase" style={{ backgroundColor: t.status === 'on-sale' ? `${C.good}1A` : `${C.warn}1A`, color: t.status === 'on-sale' ? C.good : C.warn }}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
