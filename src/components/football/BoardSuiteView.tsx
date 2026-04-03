'use client'

import { useState } from 'react'
import { Crown, TrendingUp, TrendingDown, Users, DollarSign, Trophy, Calendar, Shield, MapPin, CheckCircle2, AlertCircle, FileText, Building2 } from 'lucide-react'

const C = { bg: '#07080F', card: '#0D1017', border: '#1F2937', text: '#F9FAFB', muted: '#6B7280', purple: '#6C3FC5', teal: '#0D9488', red: '#C0392B', gold: '#F1C40F' } as const

type Tab = 'overview' | 'finance' | 'squad' | 'governance' | 'facilities'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>{children}</div>
}

function KPI({ icon: Icon, label, value, trend, trendUp }: { icon: React.ElementType; label: string; value: string; trend: string; trendUp: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.gold}18` }}><Icon size={16} style={{ color: C.gold }} /></div>
        <span className="text-xs font-bold" style={{ color: trendUp ? '#22C55E' : '#EF4444' }}>{trendUp ? '▲' : '▼'} {trend}</span>
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
    </Card>
  )
}

function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{ backgroundColor: active ? C.gold : '#111318', color: active ? '#000' : C.muted, border: active ? 'none' : `1px solid ${C.border}` }}>
      {label}
    </button>
  )
}

function ProgressRing({ percent, size = 80 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.gold} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill={C.text} fontSize={size > 60 ? 16 : 12} fontWeight={900}>{percent}%</text>
    </svg>
  )
}

function CSSBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 shrink-0" style={{ color: C.muted }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color, transition: 'width 0.5s ease' }} />
      </div>
      <span className="text-xs w-14 text-right font-bold" style={{ color: C.text }}>£{value}K</span>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const form = ['W', 'W', 'D', 'L', 'W', 'W', 'L', 'D', 'W', 'W']
  const formColor: Record<string, string> = { W: '#22C55E', D: '#F59E0B', L: '#EF4444' }
  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>League Form (Last 10)</p>
          <div className="flex gap-1.5">
            {form.map((r, i) => (
              <span key={i} className="flex items-center justify-center rounded-lg text-xs font-black" style={{ width: 28, height: 28, backgroundColor: `${formColor[r]}20`, color: formColor[r], border: `1px solid ${formColor[r]}40` }}>{r}</span>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: C.muted }}>7W 2D 1L — 23 pts from last 30</p>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-2" style={{ color: C.text }}>Next Fixture</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-black" style={{ color: C.text }}>vs Riverside United</p>
              <p className="text-xs" style={{ color: C.muted }}>Sat 12 Apr · 15:00 · Home</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: C.gold }}>CHAMPIONSHIP</p>
              <p className="text-xs" style={{ color: C.muted }}>Matchday 38</p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-2" style={{ color: C.text }}>Top Performer</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${C.red}25`, color: C.red, border: `2px solid ${C.red}` }}>MO</div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.text }}>M. Okafor</p>
              <p className="text-xs" style={{ color: C.muted }}>ST · 16 goals · 4 assists · Rating 8.2</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Financial Snapshot</p>
          <div className="space-y-3">
            {[
              { l: 'Revenue YTD', v: '£1.14M', c: '#22C55E' },
              { l: 'Expenditure YTD', v: '£0.98M', c: '#EF4444' },
              { l: 'Net Position', v: '+£160K', c: '#22C55E' },
            ].map(r => (
              <div key={r.l} className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>{r.l}</span><span className="text-xs font-bold" style={{ color: r.c }}>{r.v}</span></div>
            ))}
            <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="flex justify-between mb-1"><span className="text-xs" style={{ color: C.muted }}>Wage-to-Revenue</span><span className="text-xs font-bold" style={{ color: C.text }}>55%</span></div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                <div className="h-full rounded-full" style={{ width: '55%', backgroundColor: '55' <= '60' ? '#22C55E' : '#F59E0B' }} />
              </div>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-xs" style={{ color: C.muted }}>Projected EOY Surplus</span>
              <span className="text-xs font-bold" style={{ color: '#22C55E' }}>£220K</span>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Attendance & Matchday</p>
          <div className="flex items-center gap-6">
            <ProgressRing percent={71} size={90} />
            <div className="space-y-2 flex-1">
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Avg Attendance</span><span className="text-xs font-bold" style={{ color: C.text }}>4,240 / 6,000</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Season Tickets</span><span className="text-xs font-bold" style={{ color: C.text }}>1,847</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Last Match</span><span className="text-xs font-bold" style={{ color: '#22C55E' }}>5,100 (▲12%)</span></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Board Action Items</p>
        <div className="space-y-2">
          {[
            { icon: '⚠️', text: 'Contract renewal due: James Hartley (expires Jun 2025)', urgency: 'amber' },
            { icon: '📋', text: 'Board meeting: 18 Apr — agenda not yet uploaded', urgency: 'amber' },
            { icon: '💰', text: 'Transfer window budget approval needed — £350K earmarked', urgency: 'amber' },
            { icon: '🏟️', text: 'Facilities inspection: West Stand — 22 Apr', urgency: 'normal' },
            { icon: '✅', text: 'Youth Academy partnership with Oakridge College — signed', urgency: 'done' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: item.urgency === 'done' ? 'rgba(34,197,94,0.06)' : item.urgency === 'amber' ? 'rgba(245,158,11,0.06)' : '#0A0B10', border: `1px solid ${item.urgency === 'done' ? 'rgba(34,197,94,0.2)' : item.urgency === 'amber' ? 'rgba(245,158,11,0.2)' : C.border}` }}>
              <span>{item.icon}</span>
              <span className="text-xs flex-1" style={{ color: item.urgency === 'done' ? '#6B7280' : C.text, textDecoration: item.urgency === 'done' ? 'line-through' : 'none' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────

function FinanceTab() {
  const months = [
    { month: 'Jan', matchday: 120, commercial: 95, broadcasting: 80, academy: 25 },
    { month: 'Feb', matchday: 140, commercial: 88, broadcasting: 80, academy: 30 },
    { month: 'Mar', matchday: 130, commercial: 102, broadcasting: 80, academy: 28 },
  ]
  const maxTotal = Math.max(...months.map(m => m.matchday + m.commercial + m.broadcasting + m.academy))
  const costs = [
    { cat: 'Wages', budget: 630, actual: 618, ok: true },
    { cat: 'Operations', budget: 180, actual: 195, ok: false },
    { cat: 'Academy', budget: 90, actual: 88, ok: true },
    { cat: 'Marketing', budget: 45, actual: 39, ok: true },
    { cat: 'Travel', budget: 35, actual: 41, ok: false },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Revenue Breakdown (Q1)</p>
        <div className="flex items-end gap-4 h-40">
          {months.map(m => {
            const total = m.matchday + m.commercial + m.broadcasting + m.academy
            const h = (total / maxTotal) * 100
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-lg overflow-hidden flex flex-col-reverse" style={{ height: `${h}%`, minHeight: 20 }}>
                  <div style={{ height: `${(m.matchday / total) * 100}%`, backgroundColor: C.teal }} />
                  <div style={{ height: `${(m.commercial / total) * 100}%`, backgroundColor: C.purple }} />
                  <div style={{ height: `${(m.broadcasting / total) * 100}%`, backgroundColor: '#F59E0B' }} />
                  <div style={{ height: `${(m.academy / total) * 100}%`, backgroundColor: '#3B82F6' }} />
                </div>
                <span className="text-xs mt-2 font-bold" style={{ color: C.muted }}>{m.month}</span>
                <span className="text-[10px]" style={{ color: C.muted }}>£{total}K</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          {[{ l: 'Matchday', c: C.teal }, { l: 'Commercial', c: C.purple }, { l: 'Broadcasting', c: '#F59E0B' }, { l: 'Academy', c: '#3B82F6' }].map(x => (
            <div key={x.l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: x.c }} /><span className="text-[10px]" style={{ color: C.muted }}>{x.l}</span></div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Cost Analysis (Q1 YTD)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Category', 'Budget', 'Actual', 'Variance'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {costs.map(c => (
                <tr key={c.cat} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2.5 px-3 font-medium" style={{ color: C.text }}>{c.cat}</td>
                  <td className="py-2.5 px-3" style={{ color: C.muted }}>£{c.budget}K</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>£{c.actual}K</td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: c.ok ? '#22C55E' : '#F59E0B' }}>
                    {c.ok ? '+' : '-'}£{Math.abs(c.budget - c.actual)}K {c.ok ? '✅' : '⚠️'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Wage-to-Revenue Tracker</p>
          <div className="flex items-center gap-2">
            {[{ q: 'Q1', v: 52 }, { q: 'Q2', v: 55 }, { q: 'Q3 (fcst)', v: 57 }].map(q => (
              <div key={q.q} className="flex-1 text-center">
                <div className="h-2 rounded-full mb-1" style={{ backgroundColor: C.border }}>
                  <div className="h-full rounded-full" style={{ width: `${q.v}%`, backgroundColor: q.v > 60 ? '#EF4444' : q.v > 55 ? '#F59E0B' : '#22C55E' }} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: C.muted }}>{q.q}: {q.v}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: C.muted }}>Target: below 60% · EFL limit: 70%</p>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Cash Flow Summary</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: 'Opening', v: '£840K', c: C.text },
              { l: 'In', v: '+£380K', c: '#22C55E' },
              { l: 'Out', v: '-£290K', c: '#EF4444' },
              { l: 'Closing', v: '£930K', c: '#22C55E' },
            ].map(x => (
              <div key={x.l} className="rounded-lg p-3 text-center" style={{ backgroundColor: x.l === 'Closing' ? 'rgba(34,197,94,0.08)' : '#0A0B10', border: `1px solid ${x.l === 'Closing' ? 'rgba(34,197,94,0.3)' : C.border}` }}>
                <p className="text-xs" style={{ color: C.muted }}>{x.l}</p>
                <p className="text-sm font-black" style={{ color: x.c }}>{x.v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Squad Tab ────────────────────────────────────────────────────────────────

function SquadTab() {
  const performers = [
    { name: 'M. Okafor', pos: 'ST', apps: 28, goals: 16, assists: 4, rating: 8.2 },
    { name: 'T. Brennan', pos: 'CM', apps: 30, goals: 5, assists: 11, rating: 7.9 },
    { name: 'L. Santos', pos: 'LW', apps: 26, goals: 9, assists: 7, rating: 7.8 },
    { name: 'K. Mensah', pos: 'CB', apps: 31, goals: 2, assists: 1, rating: 7.7 },
    { name: 'A. Park', pos: 'GK', apps: 32, goals: 0, assists: 0, rating: 7.6 },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ l: 'Squad Size', v: '23', i: Users, c: C.gold }, { l: 'Average Age', v: '24.8', i: Users, c: C.teal }, { l: 'Internationals', v: '4', i: Trophy, c: C.purple }, { l: 'Academy Grads', v: '6', i: Users, c: '#22C55E' }].map(s => (
          <Card key={s.l}>
            <div className="flex items-center gap-2 mb-1"><s.i size={14} style={{ color: s.c }} /><span className="text-xs" style={{ color: C.muted }}>{s.l}</span></div>
            <p className="text-2xl font-black" style={{ color: C.text }}>{s.v}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Top 5 Performers</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Player', 'Pos', 'Apps', 'Goals', 'Assists', 'Rating'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {performers.map(p => (
                <tr key={p.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2.5 px-3 font-bold" style={{ color: C.text }}>{p.name}</td>
                  <td className="py-2.5 px-3" style={{ color: C.muted }}>{p.pos}</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>{p.apps}</td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: '#22C55E' }}>{p.goals}</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>{p.assists}</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: p.rating >= 7.8 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: p.rating >= 7.8 ? '#22C55E' : '#F59E0B' }}>{p.rating}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Injury & Availability</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Available</span><span className="text-xs font-bold" style={{ color: '#22C55E' }}>19 ✅</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Suspended</span><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>1 🟡</span></div>
            <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#EF4444' }}>Injured (3) 🔴</p>
              {[{ n: 'J. Walsh', inj: 'Hamstring', ret: '2 weeks' }, { n: 'D. Cole', inj: 'Ankle', ret: '4 weeks' }, { n: 'P. Ryan', inj: 'Illness', ret: '3 days' }].map(p => (
                <div key={p.n} className="flex justify-between py-1"><span className="text-xs" style={{ color: C.text }}>{p.n} — {p.inj}</span><span className="text-[10px]" style={{ color: C.muted }}>{p.ret}</span></div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Contract Status</p>
          <div className="space-y-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#EF4444' }}>Expiring This Summer (3)</p>
              <p className="text-[10px]" style={{ color: C.muted }}>J. Hartley · T. Shaw · N. Ward</p>
            </div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Under contract 1yr+</span><span className="text-xs font-bold" style={{ color: C.text }}>15</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Under contract 2yr+</span><span className="text-xs font-bold" style={{ color: C.text }}>5</span></div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Governance Tab ───────────────────────────────────────────────────────────

function GovernanceTab() {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Board Meetings</p>
        <div className="space-y-0">
          {[
            { date: '18 Apr 2025', status: 'Upcoming', note: 'Agenda pending', color: '#F59E0B' },
            { date: '15 Mar 2025', status: 'Completed ✅', note: 'Minutes available', color: '#22C55E' },
            { date: '15 Feb 2025', status: 'Completed ✅', note: '', color: '#22C55E' },
            { date: '18 Jan 2025', status: 'Completed ✅', note: '', color: '#22C55E' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-4 py-3" style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : undefined }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
              <span className="text-xs font-bold w-24 shrink-0" style={{ color: C.text }}>{m.date}</span>
              <span className="text-xs" style={{ color: m.color }}>{m.status}</span>
              {m.note && <span className="text-[10px]" style={{ color: C.muted }}>— {m.note}</span>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Compliance Checklist</p>
        <div className="space-y-2">
          {[
            { text: 'FA Club Licence renewed', done: true },
            { text: 'Ground safety certificate valid', done: true },
            { text: 'Financial fair play submission (Mar 2025)', done: true },
            { text: 'DBS checks — all staff completed', done: true },
            { text: 'Companies House annual return — due 30 Apr', done: false },
            { text: 'Safeguarding audit — scheduled 25 Apr', done: false },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: c.done ? 'rgba(34,197,94,0.04)' : 'rgba(245,158,11,0.04)', border: `1px solid ${c.done ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
              {c.done ? <CheckCircle2 size={14} style={{ color: '#22C55E' }} /> : <AlertCircle size={14} style={{ color: '#F59E0B' }} />}
              <span className="text-xs" style={{ color: c.done ? C.muted : C.text }}>{c.text}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Key Contacts</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { role: 'Club Solicitor', name: 'Hartley & Co', contact: '020 7123 4567', icon: FileText },
            { role: 'Accountants', name: 'Meridian Financial', contact: '020 8234 5678', icon: DollarSign },
            { role: 'FA Liaison Officer', name: 'Sarah Booth', contact: 's.booth@thefa.com', icon: Shield },
          ].map(c => (
            <div key={c.role} className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-2"><c.icon size={12} style={{ color: C.gold }} /><span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{c.role}</span></div>
              <p className="text-xs font-bold" style={{ color: C.text }}>{c.name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: C.teal }}>{c.contact}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Facilities Tab ───────────────────────────────────────────────────────────

function FacilitiesTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { name: 'Main Pitch', status: 'Good', icon: '🏟️', ok: true },
          { name: 'Training Ground', status: 'Good', icon: '⚽', ok: true },
          { name: 'West Stand', status: 'Inspection due', icon: '🏗️', ok: false },
          { name: 'Changing Rooms', status: 'Recently refurbished', icon: '🚿', ok: true },
          { name: 'Floodlights', status: 'Operational', icon: '💡', ok: true },
          { name: 'Club Shop', status: 'Open', icon: '🛍️', ok: true },
        ].map(f => (
          <Card key={f.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{f.icon}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: f.ok ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: f.ok ? '#22C55E' : '#F59E0B' }}>
                {f.ok ? '✅' : '⚠️'} {f.status}
              </span>
            </div>
            <p className="text-xs font-bold" style={{ color: C.text }}>{f.name}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Upcoming Maintenance</p>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ backgroundColor: C.border }} />
          {[
            { date: '22 Apr', task: 'West Stand inspection' },
            { date: '5 May', task: 'Pitch aeration & overseeding' },
            { date: '12 May', task: 'CCTV system upgrade' },
            { date: '1 Jun', task: 'Pre-season training ground refresh' },
            { date: '15 Jun', task: 'Floodlight PAT testing' },
          ].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-4">
              <div className="absolute left-[-18px] w-3.5 h-3.5 rounded-full" style={{ backgroundColor: i === 0 ? C.gold : C.border, border: `2px solid ${C.card}`, top: 2 }} />
              <div>
                <p className="text-xs font-bold" style={{ color: i === 0 ? C.gold : C.text }}>{m.date}</p>
                <p className="text-xs" style={{ color: C.muted }}>{m.task}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Stadium Capacity Utilisation</p>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>This season average</span><span className="text-xs font-bold" style={{ color: C.text }}>71%</span></div>
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Best attended</span><span className="text-xs font-bold" style={{ color: '#22C55E' }}>Derby vs Riverside — 5,980 (99%)</span></div>
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Lowest</span><span className="text-xs font-bold" style={{ color: '#EF4444' }}>LC R1 vs Cliffe Town — 1,240 (21%)</span></div>
        </div>
      </Card>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function BoardSuiteView() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="space-y-5">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <KPI icon={Trophy} label="League Position" value="6th" trend="↑2" trendUp />
        <KPI icon={Crown} label="Points" value="47" trend="+3" trendUp />
        <KPI icon={Users} label="Squad Value" value="£24.3M" trend="↑£1.2M" trendUp />
        <KPI icon={DollarSign} label="Monthly Revenue" value="£380K" trend="+8%" trendUp />
        <KPI icon={TrendingDown} label="Wage Bill" value="£210K/mo" trend="+3%" trendUp={false} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { id: 'overview' as Tab, label: 'Overview' },
          { id: 'finance' as Tab, label: 'Finance' },
          { id: 'squad' as Tab, label: 'Squad & Performance' },
          { id: 'governance' as Tab, label: 'Governance' },
          { id: 'facilities' as Tab, label: 'Facilities' },
        ]).map(t => <TabBtn key={t.id} active={tab === t.id} label={t.label} onClick={() => setTab(t.id)} />)}
      </div>

      {/* Content */}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'finance' && <FinanceTab />}
      {tab === 'squad' && <SquadTab />}
      {tab === 'governance' && <GovernanceTab />}
      {tab === 'facilities' && <FacilitiesTab />}
    </div>
  )
}
