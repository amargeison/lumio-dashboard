'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Shield, Users, Heart, TrendingUp, Scale, BarChart2, Target, Zap, Calendar, FileText, DollarSign, Award } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface WomensClub {
  name: string
  slug: string
  league: 'WSL' | 'WSL2' | 'National League'
  tier: 'pro' | 'championship' | 'grassroots'
  accent: string
  stadium: string
  capacity: number
  manager: string
  director: string
  fsrHeadroom: number | null
  salarySpend: number | null
  relevantRevenue: number
  kitSponsor: string | null
  founded: number
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',           icon: '🏠', group: 'OVERVIEW' },
  { id: 'briefing',     label: 'Morning Briefing',    icon: '🌅', group: 'OVERVIEW' },
  { id: 'fsr',          label: 'FSR Dashboard',       icon: '📊', group: 'COMPLIANCE' },
  { id: 'salary',       label: 'Salary Compliance',   icon: '💰', group: 'COMPLIANCE' },
  { id: 'revenue',      label: 'Revenue Attribution', icon: '📈', group: 'COMPLIANCE' },
  { id: 'welfare',      label: 'Player Welfare',      icon: '❤️', group: 'WELFARE' },
  { id: 'acl',          label: 'ACL Risk Monitor',    icon: '🦵', group: 'WELFARE' },
  { id: 'maternity',    label: 'Maternity Tracker',   icon: '👶', group: 'WELFARE' },
  { id: 'mental',       label: 'Mental Health',       icon: '🧠', group: 'WELFARE' },
  { id: 'squad',        label: 'Squad Management',    icon: '👥', group: 'FOOTBALL' },
  { id: 'dualreg',      label: 'Dual Registration',   icon: '🔄', group: 'FOOTBALL' },
  { id: 'tactics',      label: 'Tactics & Set Pieces', icon: '🎯', group: 'FOOTBALL' },
  { id: 'match',        label: 'Match Preparation',   icon: '⚽', group: 'FOOTBALL' },
  { id: 'sponsorship',  label: 'Sponsorship Pipeline',icon: '🤝', group: 'COMMERCIAL' },
  { id: 'standalone',   label: 'Standalone Tracker',  icon: '🏗️', group: 'COMMERCIAL' },
  { id: 'board',        label: 'Board Suite',         icon: '🏛️', group: 'COMMERCIAL' },
  { id: 'financial',    label: 'Financial Planning',  icon: '💷', group: 'COMMERCIAL' },
  { id: 'team',         label: 'Staff Directory',     icon: '📋', group: 'OPERATIONS' },
  { id: 'gps',          label: 'GPS & PlayerData',    icon: '📡', group: 'OPERATIONS' },
  { id: 'medical',      label: 'Medical Records',     icon: '🏥', group: 'OPERATIONS' },
  { id: 'settings',     label: 'Settings',            icon: '⚙️', group: 'OPERATIONS' },
]

// ─── DEMO CLUBS ───────────────────────────────────────────────────────────────
const DEMO_CLUBS: Record<string, WomensClub> = {
  'oakridge-women': {
    name: 'Oakridge Women FC', slug: 'oakridge-women', league: 'WSL',
    tier: 'pro', accent: '#EC4899', stadium: 'Oakridge Stadium', capacity: 6500,
    manager: 'Sarah Frost', director: 'Kate Brennan',
    fsrHeadroom: 180000, salarySpend: 74, relevantRevenue: 2800000,
    kitSponsor: 'Kestrel Finance', founded: 1989,
  },
  'harfield-women': {
    name: 'Harfield FC Women', slug: 'harfield-women', league: 'WSL2',
    tier: 'championship', accent: '#F59E0B', stadium: 'Harfield Community Ground', capacity: 1800,
    manager: 'Claire Dobson', director: 'Rachel Parr',
    fsrHeadroom: 42000, salarySpend: 68, relevantRevenue: 680000,
    kitSponsor: null, founded: 2003,
  },
  'sunday-rovers-women': {
    name: 'Sunday Rovers FC Women', slug: 'sunday-rovers-women', league: 'National League',
    tier: 'grassroots', accent: '#22C55E', stadium: 'Rovers Park', capacity: 400,
    manager: 'Bev Hartley', director: 'Bev Hartley',
    fsrHeadroom: null, salarySpend: null, relevantRevenue: 85000,
    kitSponsor: null, founded: 2011,
  },
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'pink' }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colorMap: Record<string, string> = {
    pink: 'from-pink-600/20 to-pink-900/10 border-pink-600/20',
    teal: 'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    green: 'from-green-600/20 to-green-900/10 border-green-600/20',
    red: 'from-red-600/20 to-red-900/10 border-red-600/20',
    amber: 'from-amber-600/20 to-amber-900/10 border-amber-600/20',
    blue: 'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-600/20',
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.pink} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
)

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
const DashboardView = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title={`${club.name} — Club Dashboard`} subtitle="FSR compliant · Karen Carney Review standards" icon="🏠" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="FSR Status" value="SAFE" sub="Salary 68% of Relevant Revenue" color="green" />
      <StatCard label="Squad" value="24" sub={`${club.league} registered`} color="pink" />
      <StatCard label="Welfare Flags" value="2" sub="1 ACL monitoring, 1 mental health" color="amber" />
      <StatCard label="Next Match" value="Sat 12 Apr" sub="vs Brighton Women (H)" color="blue" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">FSR Compliance Summary</h3>
        <div className="space-y-2">
          {[
            { label: 'Relevant Revenue (women-only)', value: '£3.2M', status: 'green' },
            { label: 'Total salary spend', value: '£2.18M', status: 'green' },
            { label: 'Salary % of revenue', value: '68%', status: 'green' },
            { label: 'FSR cap (80%)', value: '£2.56M', status: 'green' },
            { label: 'Headroom', value: '£380k', status: 'green' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-xs text-gray-400">{r.label}</span>
              <span className={`text-sm font-semibold ${r.status === 'green' ? 'text-green-400' : r.status === 'amber' ? 'text-amber-400' : 'text-red-400'}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Player Welfare Dashboard</h3>
        <div className="space-y-3">
          {[
            { player: 'Emily Zhang', flag: 'ACL', detail: 'Previous ACL — 6-month screening due', severity: 'amber' },
            { player: 'Charlotte Reed', flag: 'Mental Health', detail: 'Weekly check-in with performance psychologist', severity: 'amber' },
            { player: 'Ava Mitchell', flag: 'Maternity', detail: 'Leave starts May 2026 — return plan logged', severity: 'blue' },
          ].map(w => (
            <div key={w.player} className={`rounded-lg p-3 border ${w.severity === 'amber' ? 'border-amber-600/30 bg-amber-600/5' : 'border-blue-600/30 bg-blue-600/5'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">{w.player}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${w.severity === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/20 text-blue-400'}`}>{w.flag}</span>
              </div>
              <p className="text-xs text-gray-400">{w.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Sponsorship Pipeline</h3>
        <div className="space-y-2">
          {[
            { name: 'Nike (Kit)', value: '£420k/yr', status: 'Active' },
            { name: 'Barclays (WSL)', value: '£85k/yr', status: 'Active' },
            { name: 'Local Energy Co', value: '£35k/yr', status: 'Renewal due' },
          ].map(s => (
            <div key={s.name} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-xs text-gray-300">{s.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{s.value}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.status === 'Active' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Dual Registration</h3>
        <div className="space-y-2">
          {[
            { player: 'Lucy Whitmore', from: 'Oakridge W', to: 'Bristol City W', expires: '30 Apr' },
            { player: 'Jade Hopkins', from: 'Oakridge W', to: 'Crystal Palace W', expires: '15 May' },
          ].map(d => (
            <div key={d.player} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <div><span className="text-xs text-white">{d.player}</span><span className="text-[10px] text-gray-500 ml-2">→ {d.to}</span></div>
              <span className="text-xs text-amber-400">Expires {d.expires}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Upcoming</h3>
        <div className="space-y-2">
          {[
            { item: 'Brighton Women (H)', date: 'Sat 12 Apr', type: 'WSL' },
            { item: 'Board meeting', date: 'Mon 14 Apr', type: 'Internal' },
            { item: 'Nike kit review', date: 'Wed 16 Apr', type: 'Commercial' },
            { item: 'Registration window closes', date: '30 Apr', type: 'FA' },
          ].map(u => (
            <div key={u.item} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-xs text-gray-300">{u.item}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">{u.date}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{u.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// ─── FSR VIEW ─────────────────────────────────────────────────────────────────
const FSRDashboardView = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title="FSR Compliance Dashboard" subtitle="Financial Sustainability Regulations — 2025/26 Season" icon="📊" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="FSR Status" value="SAFE" sub="Within 80% cap" color="green" />
      <StatCard label="Relevant Revenue" value="£3.2M" sub="Women-only revenue" color="pink" />
      <StatCard label="Salary Spend" value="£2.18M" sub="68% of revenue" color="blue" />
      <StatCard label="Headroom" value="£380k" sub="Before cap breach" color="teal" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-4">Revenue Attribution — Relevant Revenue Breakdown</h3>
      <div className="space-y-2">
        {[
          { category: 'Matchday revenue (women-only)', value: '£680k', pct: 21 },
          { category: 'Commercial (women-attributed)', value: '£1.42M', pct: 44 },
          { category: 'Broadcast (WSL allocation)', value: '£820k', pct: 26 },
          { category: 'Prize money & FA distributions', value: '£280k', pct: 9 },
        ].map(r => (
          <div key={r.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{r.category}</span>
              <span className="text-sm font-semibold text-white">{r.value}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="h-1.5 rounded-full" style={{ width: `${r.pct}%`, backgroundColor: '#EC4899' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-4">Bundled Sponsorship Attribution</h3>
      <p className="text-xs text-gray-400 mb-3">Sponsors shared with men's parent club must be correctly attributed. FSR counts only the women's share.</p>
      <div className="space-y-2">
        {[
          { sponsor: 'Emirates (Shared — parent club)', total: '£12M', womens: '£180k', pct: '1.5%', flag: false },
          { sponsor: 'Nike (Kit — standalone women\'s deal)', total: '£420k', womens: '£420k', pct: '100%', flag: false },
          { sponsor: 'Local Energy Co (Women-only)', total: '£35k', womens: '£35k', pct: '100%', flag: false },
        ].map(s => (
          <div key={s.sponsor} className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-xs text-gray-300">{s.sponsor}</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">Total: {s.total}</span>
              <span className="text-xs text-pink-400 font-semibold">Women&apos;s: {s.womens} ({s.pct})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
      <p className="text-sm text-amber-300"><strong>FSR Rule:</strong> Total salary spend must not exceed 80% of Relevant Revenue. Relevant Revenue = only revenue directly attributable to women&apos;s football activities.</p>
    </div>
  </div>
)

// ─── WELFARE VIEW ─────────────────────────────────────────────────────────────
const WelfareView = () => (
  <div>
    <SectionHeader title="Player Welfare Hub" subtitle="Karen Carney Review — mandatory welfare standards" icon="❤️" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Active Flags" value="3" sub="2 monitoring, 1 leave" color="amber" />
      <StatCard label="ACL History" value="4 players" sub="Screening programme active" color="red" />
      <StatCard label="Maternity" value="1 active" sub="Ava Mitchell — May 2026" color="blue" />
      <StatCard label="PFA Referrals" value="0" sub="This season" color="green" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-4">Active Welfare Cases</h3>
      <div className="space-y-3">
        {[
          { player: 'Emily Zhang', category: 'ACL Risk', detail: 'Previous bilateral ACL (2023, 2024). 6-month screening protocol active. Next screening: 18 Apr.', severity: 'High', actions: 'Kitman Labs monitoring, reduced sprint load, quarterly MRI' },
          { player: 'Charlotte Reed', category: 'Mental Health', detail: 'Weekly sessions with Dr. Alison Carey (performance psychologist). Progress positive.', severity: 'Medium', actions: 'Weekly check-in, welfare lead notified, PFA support offered' },
          { player: 'Ava Mitchell', category: 'Maternity', detail: 'Maternity leave commencing May 2026. Return plan: January 2027. Contract protected.', severity: 'Info', actions: 'Leave plan filed, salary protected, return-to-play programme scheduled' },
          { player: 'Sophie Turner', category: 'ACL Risk', detail: 'ACL reconstruction Dec 2024. Currently in final return-to-play phase.', severity: 'Medium', actions: 'Graduated return protocol, no competitive match until medical clearance' },
        ].map(c => (
          <div key={c.player} className={`rounded-lg p-4 border ${c.severity === 'High' ? 'border-red-600/30 bg-red-600/5' : c.severity === 'Medium' ? 'border-amber-600/30 bg-amber-600/5' : 'border-blue-600/30 bg-blue-600/5'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{c.player}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${c.severity === 'High' ? 'bg-red-600/20 text-red-400' : c.severity === 'Medium' ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/20 text-blue-400'}`}>{c.category}</span>
              </div>
              <span className={`text-xs font-semibold ${c.severity === 'High' ? 'text-red-400' : c.severity === 'Medium' ? 'text-amber-400' : 'text-blue-400'}`}>{c.severity}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">{c.detail}</p>
            <p className="text-xs text-gray-500">Actions: {c.actions}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ─── MORNING BRIEFING VIEW ────────────────────────────────────────────────────
const MorningBriefingView = ({ club }: { club: WomensClub }) => {
  const fmt = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const fsrStatus = club.salarySpend === null ? null : club.salarySpend > 80 ? 'At Risk' : club.salarySpend > 70 ? 'Review' : 'Safe'
  const fsrColor = fsrStatus === 'Safe' ? 'green' : fsrStatus === 'Review' ? 'amber' : fsrStatus === 'At Risk' ? 'red' : 'green'

  if (club.tier === 'grassroots') {
    return (
      <div>
        <SectionHeader title={`Good morning, ${club.director}`} subtitle={today} icon="🌅" />
        <div className="bg-gradient-to-r from-green-900/30 to-teal-900/20 border border-green-600/30 rounded-xl p-5 mb-6">
          <div className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-2">TODAY&apos;S BRIEFING — {club.name}</div>
          <div className="text-sm text-gray-300">Grassroots programme overview for {today}.</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Training Tonight" value="7:00pm" sub="Rovers Park — 16 confirmed" color="green" />
          <StatCard label="Next Fixture" value="Sun 13 Apr" sub="vs Riverside Women (A)" color="blue" />
          <StatCard label="Welfare" value="0 flags" sub="All players cleared" color="green" />
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Today&apos;s Priorities</h3>
          <div className="space-y-2">
            {['Confirm training numbers — 3 players haven\'t responded', 'DBS renewal due: coach volunteer (expires 20 Apr)', 'Kit wash from Sunday\'s match — confirm collection', 'Outstanding subs: 4 players — automated reminders sent'].map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-400 mt-0.5">●</span>{item}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title={`Good morning, ${club.director}`} subtitle={today} icon="🌅" />

      {/* Gradient Banner */}
      <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/20 border border-pink-600/30 rounded-xl p-5 mb-6">
        <div className="text-xs text-pink-400 font-semibold uppercase tracking-wider mb-2">MORNING BRIEFING — {club.name}</div>
        <div className="text-sm text-gray-300">{club.league} · Match Week · {today}</div>
      </div>

      {/* FSR Status Card */}
      {fsrStatus && (
        <div className="mb-6">
          <div className={`bg-gradient-to-br ${fsrColor === 'green' ? 'from-green-600/20 to-green-900/10 border-green-600/20' : fsrColor === 'amber' ? 'from-amber-600/20 to-amber-900/10 border-amber-600/20' : 'from-red-600/20 to-red-900/10 border-red-600/20'} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-white">FSR Compliance</div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${fsrColor === 'green' ? 'bg-green-600/20 text-green-400' : fsrColor === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-red-600/20 text-red-400'}`}>{fsrStatus}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{club.salarySpend}% <span className="text-sm font-normal text-gray-400">of permitted cap</span></div>
            {club.fsrHeadroom !== null && <div className="text-xs text-gray-400">{fmt(club.fsrHeadroom)} headroom remaining</div>}
          </div>
        </div>
      )}

      {/* Three Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm">❤️</span><span className="text-xs font-semibold text-white">Squad Welfare</span></div>
          <p className="text-xs text-gray-400">1 player on maternity leave · 1 in return-to-play protocol · ACL screening overdue for 3 players</p>
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm">🤝</span><span className="text-xs font-semibold text-white">Sponsorship</span></div>
          <p className="text-xs text-gray-400">2 renewals due this month: {club.kitSponsor || 'Kit sponsor'} (kit, £85k) · NovaTech UK (sleeve, £40k)</p>
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-sm">📋</span><span className="text-xs font-semibold text-white">Compliance</span></div>
          <p className="text-xs text-gray-400">Dual registration: 1 temporary transfer expires Friday · Registration window closes in 8 days</p>
        </div>
      </div>

      {/* Board Pack Countdown */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">Board Pack Deadline</span>
          <span className="text-xs text-pink-400 font-semibold">11 days</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="h-2 rounded-full" style={{ width: '65%', backgroundColor: '#EC4899' }} />
        </div>
        <div className="text-xs text-gray-500 mt-1">65% complete — financials and welfare sections outstanding</div>
      </div>

      {/* Today's Priorities */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Today&apos;s Priorities</h3>
        <div className="space-y-2">
          {[
            'FSR bundled attribution review — Meridian Insurance deal requires women\'s share confirmation',
            `Chase ${club.kitSponsor || 'kit sponsor'} renewal — kit deal expires 30 days`,
            'ACL screening overdue — 3 high-risk players flagged to welfare lead',
            'Dual reg expiry — Emma Clarke temporary transfer to Harfield ends Friday',
            'Transfer window modelling — confirm budget impact of new signing on FSR headroom',
          ].map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-pink-400 mt-0.5">●</span>{item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── ACL RISK MONITOR VIEW ────────────────────────────────────────────────────
const ACLRiskMonitorView = () => {
  const aclPlayers: Array<{name:string;pos:string;history:string;lastScreening:string;nextDue:string;risk:'High'|'Medium'|'Low'}> = [
    {name:'Emma Clarke',pos:'CB',history:'Previous ACL (right, 2022)',lastScreening:'Oct 2024',nextDue:'OVERDUE',risk:'High'},
    {name:'Priya Nair',pos:'CM',history:'None',lastScreening:'Jan 2025',nextDue:'Apr 2025',risk:'Medium'},
    {name:'Jade Osei',pos:'ST',history:'None',lastScreening:'Feb 2025',nextDue:'May 2025',risk:'Medium'},
    {name:'Abbi Walsh',pos:'RW',history:'Previous ACL (left, 2021)',lastScreening:'Nov 2024',nextDue:'Feb 2025',risk:'High'},
  ]
  return (
    <div>
      <SectionHeader title="ACL Risk Monitor" subtitle="Women players face ACL injury rates 3–6× higher than men. Active monitoring is mandated under Karen Carney Review standards." icon="🦵" />
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 mb-6 text-xs text-red-400 font-medium">⚠ 4 players have overdue ACL screenings — welfare lead notified</div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-left p-3">ACL History</th><th className="text-left p-3">Last Screening</th><th className="text-left p-3">Next Due</th><th className="text-left p-3">Risk</th>
          </tr></thead>
          <tbody>
            {aclPlayers.map((p: typeof aclPlayers[0], i: number) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                <td className="p-3 text-gray-400">{p.pos}</td>
                <td className="p-3 text-gray-400 text-xs">{p.history}</td>
                <td className="p-3 text-gray-400 text-xs">{p.lastScreening}</td>
                <td className={`p-3 text-xs font-medium ${p.nextDue === 'OVERDUE' ? 'text-red-400' : 'text-gray-400'}`}>{p.nextDue}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${p.risk === 'High' ? 'bg-red-600/20 text-red-400' : p.risk === 'Medium' ? 'bg-amber-600/20 text-amber-400' : 'bg-green-600/20 text-green-400'}`}>{p.risk}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Return-to-Play Tracker</h3>
        <div className="space-y-2">
          {[{phase:'1. Rest',done:true},{phase:'2. Rehab',done:true},{phase:'3. Non-contact',done:true},{phase:'4. Contact',done:false},{phase:'5. Match cleared',done:false}].map((s: {phase:string;done:boolean}, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs"><span className={s.done ? 'text-green-400' : 'text-gray-600'}>{s.done ? '✓' : '○'}</span><span className={s.done ? 'text-gray-400 line-through' : 'text-gray-300'}>{s.phase}</span></div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">Sophie Turner — ACL reconstruction Dec 2024 — Phase 3 (non-contact)</div>
      </div>
      <div className="text-xs text-gray-500">→ Link to Medical Records for full player history</div>
    </div>
  )
}

// ─── MATERNITY TRACKER VIEW ───────────────────────────────────────────────────
const MaternityTrackerView = () => (
  <div>
    <SectionHeader title="Maternity Tracker" subtitle="Karen Carney Review Compliance" icon="👶" />
    <div className="bg-pink-600/10 border border-pink-600/30 rounded-xl p-4 mb-6">
      <p className="text-xs text-pink-300"><strong>WSL Policy:</strong> 26 weeks full pay, statutory rights protected, dedicated return-to-play programme, no selection pressure during recovery.</p>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Player</th><th className="text-left p-3">Leave Start</th><th className="text-left p-3">Expected Return</th><th className="text-left p-3">Weeks Remaining</th><th className="text-left p-3">Status</th>
        </tr></thead>
        <tbody>
          <tr className="border-b border-gray-800/50">
            <td className="p-3 text-gray-200 font-medium">Sophie Lawson</td>
            <td className="p-3 text-gray-400 text-xs">14 Jan 2025</td>
            <td className="p-3 text-gray-400 text-xs">Sep 2025</td>
            <td className="p-3 text-gray-400 text-xs">22</td>
            <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-pink-600/20 text-pink-400">On Leave</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Return-to-Play Protocol (Post-Maternity)</h3>
      <div className="space-y-2">
        {['1. Medical clearance','2. Fitness baseline assessment','3. Light training (non-contact)','4. Full training','5. Match selection available','6. Fully returned'].map((phase: string, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs"><span className="text-gray-600">○</span><span className="text-gray-300">{phase}</span></div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">Sophie Lawson — not yet started (on leave)</div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Contractual Rights Log</h3>
      <div className="space-y-2">
        {[{right:'Full pay maintained (26 weeks)',actioned:true},{right:'Role protection on return',actioned:true},{right:'Training access on return',actioned:true},{right:'No selection pressure during recovery',actioned:true},{right:'PFA support offered',actioned:true}].map((r: {right:string;actioned:boolean}, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs"><span className={r.actioned ? 'text-green-400' : 'text-red-400'}>{r.actioned ? '✓' : '✗'}</span><span className="text-gray-300">{r.right}</span></div>
        ))}
      </div>
    </div>
    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 mb-4 text-xs text-amber-400">🔒 This record is restricted to Welfare Lead, Club Doctor, and Club Director only.</div>
    <button className="px-4 py-2 rounded-lg text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30">PFA Referral Workflow →</button>
  </div>
)

// ─── MENTAL HEALTH VIEW ───────────────────────────────────────────────────────
const MentalHealthView = () => (
  <div>
    <SectionHeader title="Mental Health & Wellbeing" subtitle="Karen Carney Review Standards" icon="🧠" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Squad Size" value="24" color="pink" />
      <StatCard label="Check-ins (month)" value="18" sub="Of 24 players" color="teal" />
      <StatCard label="Flags Raised" value="1" sub="Performance anxiety" color="amber" />
      <StatCard label="Referrals Made" value="0" sub="This season" color="green" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-800"><h3 className="text-sm font-bold text-white">Monthly Check-In Log</h3></div>
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Player</th><th className="text-left p-3">Date</th><th className="text-left p-3">Score</th><th className="text-left p-3">Flags</th><th className="text-left p-3">Follow-up</th>
        </tr></thead>
        <tbody>
          {[
            {player:'Emma Clarke',date:'2 Apr',score:8,flag:'—',followup:'No'},
            {player:'Priya Nair',date:'2 Apr',score:7,flag:'—',followup:'No'},
            {player:'Charlotte Reed',date:'1 Apr',score:6,flag:'Performance anxiety — pre-match',followup:'Yes'},
            {player:'Jade Osei',date:'28 Mar',score:9,flag:'—',followup:'No'},
            {player:'Abbi Walsh',date:'28 Mar',score:7,flag:'—',followup:'No'},
          ].map((r: {player:string;date:string;score:number;flag:string;followup:string}, i: number) => (
            <tr key={i} className="border-b border-gray-800/50">
              <td className="p-3 text-gray-200">{r.player}</td>
              <td className="p-3 text-gray-400 text-xs">{r.date}</td>
              <td className="p-3"><span className={`text-sm font-bold ${r.score >= 7 ? 'text-green-400' : r.score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{r.score}/10</span></td>
              <td className={`p-3 text-xs ${r.flag !== '—' ? 'text-amber-400' : 'text-gray-500'}`}>{r.flag}</td>
              <td className="p-3"><span className={`text-xs ${r.followup === 'Yes' ? 'text-amber-400 font-medium' : 'text-gray-500'}`}>{r.followup}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Support Services</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          {name:'Dr Anna Reid',role:'Performance Psychologist',type:'In-house'},
          {name:'PFA Wellbeing Service',role:'Player support',type:'External'},
          {name:'Mind Charity',role:'Referral pathway',type:'External'},
          {name:'EFL Heads Up',role:'Mental health programme',type:'External'},
        ].map((s: {name:string;role:string;type:string}, i: number) => (
          <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-white font-medium">{s.name}</div>
            <div className="text-[10px] text-gray-500">{s.role} · {s.type}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 mb-4 text-xs text-amber-400">🔒 Mental health records are strictly confidential — role-based access only.</div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-3">WSL Minimum Standards (Karen Carney Review)</h3>
      <div className="space-y-2">
        {['Licensed performance psychologist available to squad','Monthly wellbeing check-ins for all players','Confidential reporting pathway documented','PFA referral process in place','Mental health first aider on staff','Pre-match anxiety support protocol'].map((item: string, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs"><span className="text-green-400">✓</span><span className="text-gray-300">{item}</span></div>
        ))}
      </div>
    </div>
  </div>
)

// ─── MEDICAL RECORDS VIEW ─────────────────────────────────────────────────────
const MedicalRecordsView = () => (
  <div>
    <SectionHeader title="Medical Records" subtitle="Role-gated access — Club Doctor and Welfare Lead only" icon="🏥" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-[#0D1117] border border-pink-600/30 rounded-xl p-4 cursor-pointer hover:border-pink-500/50 transition-colors">
        <div className="text-sm font-bold text-white mb-1">🦵 ACL Risk Monitor</div>
        <div className="text-xs text-gray-400">4 players with overdue screenings</div>
      </div>
      <div className="bg-[#0D1117] border border-pink-600/30 rounded-xl p-4 cursor-pointer hover:border-pink-500/50 transition-colors">
        <div className="text-sm font-bold text-white mb-1">👶 Maternity Tracker</div>
        <div className="text-xs text-gray-400">1 player on maternity leave</div>
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-800"><h3 className="text-sm font-bold text-white">Squad Medical Summary</h3></div>
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Player</th><th className="text-left p-3">Injuries (Season)</th><th className="text-left p-3">Status</th><th className="text-left p-3">Physio Notes</th>
        </tr></thead>
        <tbody>
          {[
            {player:'Emma Clarke',injuries:0,status:'Fit',notes:'ACL screening overdue — schedule this week'},
            {player:'Sophie Turner',injuries:1,status:'RTP Phase 3',notes:'ACL reconstruction Dec 2024 — progressing well'},
            {player:'Ava Mitchell',injuries:0,status:'Fit (maternity May)',notes:'Pre-leave medical complete'},
            {player:'Charlotte Reed',injuries:0,status:'Fit',notes:'Mental health support active — no physical concerns'},
            {player:'Priya Nair',injuries:1,status:'Fit',notes:'Minor ankle — resolved. ACL screening due.'},
          ].map((r: {player:string;injuries:number;status:string;notes:string}, i: number) => (
            <tr key={i} className="border-b border-gray-800/50">
              <td className="p-3 text-gray-200">{r.player}</td>
              <td className="p-3 text-gray-400">{r.injuries}</td>
              <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${r.status === 'Fit' || r.status.includes('Fit') ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>{r.status}</span></td>
              <td className="p-3 text-gray-400 text-xs">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 mb-4 text-xs text-amber-400">🔒 GDPR: Medical records are strictly role-gated. Access restricted to Club Doctor, Welfare Lead, and Club Director.</div>
    <button disabled className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">Export for WSL Football & Insurance — Phase 2</button>
  </div>
)

// ─── SALARY COMPLIANCE VIEW ──────────────────────────────────────────────────
const SalaryComplianceView = () => {
  const [newSalary, setNewSalary] = useState(0)
  const players: Array<{name:string;pos:string;salary:number;flag:boolean}> = [
    {name:'Emma Clarke',pos:'CB',salary:62000,flag:false},
    {name:'Priya Nair',pos:'CM',salary:58000,flag:false},
    {name:'Jade Osei',pos:'ST',salary:71000,flag:false},
    {name:'Abbi Walsh',pos:'RW',salary:54000,flag:false},
    {name:'Charlotte Reed',pos:'GK',salary:48000,flag:false},
    {name:'Sophie Turner',pos:'LB',salary:45000,flag:false},
    {name:'Fatima Al-Said',pos:'AM',salary:67000,flag:false},
    {name:'Megan Hughes',pos:'DM',salary:52000,flag:false},
    {name:'Sophie Lawson',pos:'RB',salary:46000,flag:false},
    {name:'Tilly Brooks',pos:'LW',salary:35000,flag:true},
  ]
  const totalSalary = players.reduce((sum: number, p: typeof players[0]) => sum + p.salary, 0)
  const cap = 2560000
  const headroom = cap - totalSalary - newSalary
  const fmt = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <SectionHeader title="Salary Compliance" subtitle="FSR salary cap monitoring — 80% of Relevant Revenue" icon="💰" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Salary Spend" value={fmt(totalSalary)} sub="10 registered players" color="pink" />
        <StatCard label="FSR Cap (80%)" value={fmt(cap)} sub="Of £3.2M relevant revenue" color="blue" />
        <StatCard label="Headroom" value={fmt(headroom)} sub={newSalary > 0 ? 'After modelled signing' : 'Before new signings'} color={headroom > 100000 ? 'green' : headroom > 0 ? 'amber' : 'red'} />
        <StatCard label="Flags" value="1" sub="Tilly Brooks below £40k min" color="red" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-right p-3">Annual Salary</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {players.map((p: typeof players[0], i: number) => (
              <tr key={i} className={`border-b border-gray-800/50 ${p.flag ? 'bg-red-600/5' : ''}`}>
                <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                <td className="p-3 text-gray-400">{p.pos}</td>
                <td className="p-3 text-right text-gray-200">{fmt(p.salary)}</td>
                <td className="p-3">
                  {p.flag
                    ? <span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400">Below £40k minimum</span>
                    : <span className="text-xs px-2 py-0.5 rounded bg-green-600/20 text-green-400">Compliant</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">New Signing Salary Modeller</h3>
        <p className="text-xs text-gray-400 mb-3">Enter a proposed salary to see the impact on FSR headroom.</p>
        <div className="flex items-center gap-4 mb-3">
          <input
            type="number"
            value={newSalary || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSalary(Number(e.target.value))}
            placeholder="e.g. 55000"
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-48 focus:outline-none focus:border-pink-500"
          />
          <span className="text-xs text-gray-400">Annual salary (£)</span>
        </div>
        {newSalary > 0 && (
          <div className={`rounded-lg p-3 border ${headroom > 0 ? 'border-green-600/30 bg-green-600/5' : 'border-red-600/30 bg-red-600/5'}`}>
            <div className="text-sm font-semibold text-white mb-1">Updated headroom: {fmt(headroom)}</div>
            <div className={`text-xs ${headroom > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {headroom > 0 ? 'Signing is within FSR cap.' : 'WARNING: This signing would breach the FSR salary cap.'}
            </div>
          </div>
        )}
      </div>
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        ⚠ Tilly Brooks (£35,000) is below the recommended £40,000 WSL minimum salary. Review required.
      </div>
    </div>
  )
}

// ─── REVENUE ATTRIBUTION VIEW ────────────────────────────────────────────────
const RevenueAttributionView = () => {
  const categories: Array<{name:string;value:number;pct:number;color:string}> = [
    {name:'Matchday Revenue',value:420000,pct:18,color:'#EC4899'},
    {name:'Commercial (Women-attributed)',value:680000,pct:30,color:'#8B5CF6'},
    {name:'Broadcast (WSL Allocation)',value:520000,pct:23,color:'#3B82F6'},
    {name:'Prize Money & FA Distributions',value:280000,pct:12,color:'#22C55E'},
    {name:'Sponsorship (Standalone)',value:310000,pct:13,color:'#F59E0B'},
    {name:'Other Income',value:90000,pct:4,color:'#6B7280'},
  ]
  const totalRevenue = 2300000
  const fmt = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      <SectionHeader title="Revenue Attribution" subtitle="Women-only Relevant Revenue for FSR compliance" icon="📈" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Relevant Revenue" value="£2.3M" sub="6 categories" color="pink" />
        <StatCard label="YoY Growth" value="+12%" sub="vs 2024/25 season" color="green" />
        <StatCard label="Permitted Spend (80%)" value="£1.84M" sub="FSR salary cap" color="blue" />
        <StatCard label="Bundled Flags" value="1" sub="Meridian Insurance" color="amber" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-4">Revenue Breakdown</h3>
        <div className="space-y-3">
          {categories.map((c: typeof categories[0]) => (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{c.name}</span>
                <span className="text-sm font-semibold text-white">{fmt(c.value)}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-sm font-bold text-white">Total</span>
          <span className="text-sm font-bold text-pink-400">{fmt(totalRevenue)}</span>
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Bundled Deal Attribution</h3>
        <p className="text-xs text-gray-400 mb-3">Sponsors shared with men&apos;s parent club must show women&apos;s share separately.</p>
        <div className="space-y-2">
          {[
            {sponsor:'Kestrel Finance (Kit)',total:'£420k',womens:'£420k',pct:'100%',flag:false},
            {sponsor:'Meridian Insurance (Shared)',total:'£800k',womens:'£95k',pct:'11.9%',flag:true},
            {sponsor:'NovaTech UK (Sleeve)',total:'£40k',womens:'£40k',pct:'100%',flag:false},
          ].map((s: {sponsor:string;total:string;womens:string;pct:string;flag:boolean}) => (
            <div key={s.sponsor} className={`flex items-center justify-between py-2 border-b border-gray-800 ${s.flag ? 'bg-amber-600/5 rounded px-2' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-300">{s.sponsor}</span>
                {s.flag && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600/20 text-amber-400">Review</span>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">Total: {s.total}</span>
                <span className="text-xs text-pink-400 font-semibold">Women&apos;s: {s.womens} ({s.pct})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Season Comparison</h3>
        <div className="space-y-3">
          {[
            {season:'2024/25',value:2050000,bar:89},
            {season:'2025/26',value:2300000,bar:100},
          ].map((s: {season:string;value:number;bar:number}) => (
            <div key={s.season}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{s.season}</span>
                <span className="text-sm font-semibold text-white">{fmt(s.value)}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="h-2 rounded-full bg-pink-500" style={{ width: `${s.bar}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Permitted Spend Calculation</h3>
        <div className="space-y-2">
          {[
            {label:'Total Relevant Revenue',value:'£2,300,000'},
            {label:'FSR Cap (80%)',value:'£1,840,000'},
            {label:'Current Salary Spend',value:'£1,538,000'},
            {label:'Remaining Headroom',value:'£302,000'},
          ].map((r: {label:string;value:string}) => (
            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className="text-xs text-gray-400">{r.label}</span>
              <span className="text-sm font-semibold text-white">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SQUAD MANAGEMENT VIEW ───────────────────────────────────────────────────
const SquadManagementView = () => {
  const [filter, setFilter] = useState<string>('all')
  const players: Array<{name:string;pos:string;age:number;contract:string;status:string;statusType:string}> = [
    {name:'Emma Clarke',pos:'CB',age:27,contract:'Jun 2027',status:'Dual-reg (Harfield)',statusType:'info'},
    {name:'Priya Nair',pos:'CM',age:24,contract:'Jun 2026',status:'Available',statusType:'ok'},
    {name:'Jade Osei',pos:'ST',age:22,contract:'Jun 2028',status:'Available',statusType:'ok'},
    {name:'Abbi Walsh',pos:'RW',age:25,contract:'Jun 2026',status:'Available',statusType:'ok'},
    {name:'Charlotte Reed',pos:'GK',age:29,contract:'Jun 2027',status:'Available',statusType:'ok'},
    {name:'Sophie Turner',pos:'LB',age:23,contract:'Jun 2027',status:'RTP Phase 3',statusType:'warn'},
    {name:'Fatima Al-Said',pos:'AM',age:21,contract:'Jun 2028',status:'ITC Pending',statusType:'warn'},
    {name:'Megan Hughes',pos:'DM',age:26,contract:'Jun 2026',status:'Available',statusType:'ok'},
    {name:'Sophie Lawson',pos:'RB',age:28,contract:'Jun 2027',status:'Maternity Leave',statusType:'info'},
    {name:'Tilly Brooks',pos:'LW',age:20,contract:'Jun 2028',status:'Part-time contract',statusType:'warn'},
  ]

  const filtered = filter === 'all' ? players
    : filter === 'available' ? players.filter((p: typeof players[0]) => p.statusType === 'ok')
    : filter === 'flagged' ? players.filter((p: typeof players[0]) => p.statusType !== 'ok')
    : players

  return (
    <div>
      <SectionHeader title="Squad Management" subtitle="WSL registered squad — 2025/26 season" icon="👥" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Squad Size" value={players.length} sub="Registered players" color="pink" />
        <StatCard label="Available" value={players.filter((p: typeof players[0]) => p.statusType === 'ok').length} sub="Match ready" color="green" />
        <StatCard label="Flags" value={players.filter((p: typeof players[0]) => p.statusType !== 'ok').length} sub="Require attention" color="amber" />
        <StatCard label="Avg Age" value="24.5" sub="Squad average" color="blue" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        {['all','available','flagged'].map((f: string) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-pink-600/20 text-pink-400 border border-pink-600/30' : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:text-white'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-left p-3">Age</th><th className="text-left p-3">Contract</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map((p: typeof players[0], i: number) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                <td className="p-3 text-gray-400">{p.pos}</td>
                <td className="p-3 text-gray-400">{p.age}</td>
                <td className="p-3 text-gray-400 text-xs">{p.contract}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    p.statusType === 'ok' ? 'bg-green-600/20 text-green-400'
                    : p.statusType === 'warn' ? 'bg-amber-600/20 text-amber-400'
                    : 'bg-blue-600/20 text-blue-400'
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        ⚠ Fatima Al-Said — ITC (International Transfer Certificate) pending. Cannot be registered until clearance received from FIFA TMS.
      </div>
    </div>
  )
}

// ─── DUAL REGISTRATION VIEW ─────────────────────────────────────────────────
const DualRegistrationView = () => {
  const registrations: Array<{player:string;pos:string;parentClub:string;loanClub:string;start:string;end:string;daysLeft:number}> = [
    {player:'Emma Clarke',pos:'CB',parentClub:'Oakridge Women',loanClub:'Harfield FC Women',start:'1 Jan 2026',end:'8 Apr 2026',daysLeft:4},
    {player:'Lucy Whitmore',pos:'LW',parentClub:'Oakridge Women',loanClub:'Bristol City Women',start:'1 Feb 2026',end:'30 Apr 2026',daysLeft:26},
  ]

  return (
    <div>
      <SectionHeader title="Dual Registration Tracker" subtitle="FA Women's dual registration agreements" icon="🔄" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Dual-Regs" value="2" sub="Players currently loaned" color="pink" />
        <StatCard label="Expiring Soon" value="1" sub="Emma Clarke — 4 days" color="red" />
        <StatCard label="Window Status" value="Open" sub="Closes 30 Apr 2026" color="green" />
        <StatCard label="Max Permitted" value="4" sub="WSL dual-reg limit" color="blue" />
      </div>
      {registrations.map((r: typeof registrations[0]) => (
        <div key={r.player} className={`bg-[#0D1117] border rounded-xl p-5 mb-4 ${r.daysLeft <= 7 ? 'border-red-600/30' : 'border-gray-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">{r.player}</span>
              <span className="text-xs text-gray-500">{r.pos}</span>
            </div>
            {r.daysLeft <= 7 && <span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-semibold animate-pulse">Expires in {r.daysLeft} days</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><div className="text-[10px] text-gray-500 uppercase">Parent Club</div><div className="text-xs text-gray-300">{r.parentClub}</div></div>
            <div><div className="text-[10px] text-gray-500 uppercase">Loan Club</div><div className="text-xs text-gray-300">{r.loanClub}</div></div>
            <div><div className="text-[10px] text-gray-500 uppercase">Start Date</div><div className="text-xs text-gray-300">{r.start}</div></div>
            <div><div className="text-[10px] text-gray-500 uppercase">End Date</div><div className="text-xs text-gray-300">{r.end}</div></div>
          </div>
          {r.daysLeft <= 7 && (
            <div className="mt-3 bg-red-600/10 border border-red-600/20 rounded-lg p-2 text-xs text-red-400">
              Action required: Decide whether to extend, recall, or let this agreement expire by {r.end}.
            </div>
          )}
        </div>
      ))}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Registration Window Calendar</h3>
        <div className="space-y-2">
          {[
            {event:'WSL Winter Window Opened',date:'1 Jan 2026',status:'past'},
            {event:'Emma Clarke dual-reg expires',date:'8 Apr 2026',status:'urgent'},
            {event:'Lucy Whitmore dual-reg expires',date:'30 Apr 2026',status:'upcoming'},
            {event:'WSL Registration Window Closes',date:'30 Apr 2026',status:'upcoming'},
            {event:'Summer Window Opens',date:'1 Jun 2026',status:'future'},
          ].map((e: {event:string;date:string;status:string}) => (
            <div key={e.event} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <span className={`text-xs ${e.status === 'urgent' ? 'text-red-400 font-semibold' : e.status === 'past' ? 'text-gray-600' : 'text-gray-300'}`}>{e.event}</span>
              <span className={`text-xs ${e.status === 'urgent' ? 'text-red-400' : 'text-gray-500'}`}>{e.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TACTICS & SET PIECES VIEW ───────────────────────────────────────────────
const TacticsSetPiecesView = () => (
  <div>
    <SectionHeader title="Tactics & Set Pieces" subtitle="Match preparation — tactical overview" icon="🎯" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Formation" value="4-3-3" sub="Primary system" color="pink" />
      <StatCard label="Set Pieces" value="4" sub="Trained routines" color="blue" />
      <StatCard label="Possession %" value="58%" sub="Season average" color="teal" />
      <StatCard label="Goals from Set Pieces" value="7" sub="28% of total goals" color="green" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-4">Formation — 4-3-3</h3>
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex gap-8">
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-pink-600/30 border border-pink-500/50 flex items-center justify-center text-[10px] text-white font-bold">LW</div><div className="text-[10px] text-gray-500 mt-1">Brooks</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-pink-600/30 border border-pink-500/50 flex items-center justify-center text-[10px] text-white font-bold">ST</div><div className="text-[10px] text-gray-500 mt-1">Osei</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-pink-600/30 border border-pink-500/50 flex items-center justify-center text-[10px] text-white font-bold">RW</div><div className="text-[10px] text-gray-500 mt-1">Walsh</div></div>
        </div>
        <div className="flex gap-6">
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-[10px] text-white font-bold">CM</div><div className="text-[10px] text-gray-500 mt-1">Nair</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-[10px] text-white font-bold">DM</div><div className="text-[10px] text-gray-500 mt-1">Hughes</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-[10px] text-white font-bold">AM</div><div className="text-[10px] text-gray-500 mt-1">Al-Said</div></div>
        </div>
        <div className="flex gap-4">
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-white font-bold">LB</div><div className="text-[10px] text-gray-500 mt-1">Turner</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-white font-bold">CB</div><div className="text-[10px] text-gray-500 mt-1">Clarke</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-white font-bold">CB</div><div className="text-[10px] text-gray-500 mt-1">TBC</div></div>
          <div className="text-center"><div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-white font-bold">RB</div><div className="text-[10px] text-gray-500 mt-1">Lawson</div></div>
        </div>
        <div className="text-center"><div className="w-8 h-8 rounded-full bg-green-600/30 border border-green-500/50 flex items-center justify-center text-[10px] text-white font-bold">GK</div><div className="text-[10px] text-gray-500 mt-1">Reed</div></div>
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Set Piece Routines</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          {name:'Corner — Near Post Flick',type:'Attacking',success:'42%',description:'Short corner to Nair, flick-on by Osei at near post. Clarke/Hughes as secondary targets.'},
          {name:'Free Kick — Direct Strike',type:'Attacking',success:'18%',description:'Direct attempt from Walsh when within 25 yards. Decoy run from Brooks.'},
          {name:'Corner — Defensive Zonal',type:'Defensive',success:'78% clearance',description:'Zonal marking at 6-yard box. Hughes marks zone 1, Clarke zone 2. Reed commands box.'},
          {name:'Throw-in — Long to Target',type:'Attacking',success:'35%',description:'Long throw from Turner to Osei in channel. Second ball runners: Walsh, Brooks.'},
        ].map((r: {name:string;type:string;success:string;description:string}) => (
          <div key={r.name} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">{r.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${r.type === 'Attacking' ? 'bg-pink-600/20 text-pink-400' : 'bg-blue-600/20 text-blue-400'}`}>{r.type}</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-1">{r.description}</p>
            <span className="text-[10px] text-gray-500">Success rate: {r.success}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-3">Team Talk — Coach Notes</h3>
      <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-300 italic">&ldquo;We press high from the front three. Nair dictates tempo. Full-backs push up — we want width. Set pieces are our edge — we&apos;ve drilled them all week. Trust the system, trust each other.&rdquo;</p>
        <p className="text-xs text-gray-500 mt-2">— Sarah Frost, Head Coach</p>
      </div>
    </div>
  </div>
)

// ─── MATCH PREPARATION VIEW ─────────────────────────────────────────────────
const MatchPreparationView = () => {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    teamSheet: false,
    kitConfirmed: false,
    travelBooked: false,
    medicalBag: false,
    gpsDevices: false,
    matchBalls: false,
  })

  const toggleItem = (key: string): void => {
    setChecklist((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div>
      <SectionHeader title="Match Preparation" subtitle="Next fixture planning and readiness" icon="⚽" />
      <div className="bg-gradient-to-br from-pink-600/20 to-purple-900/10 border border-pink-600/20 rounded-xl p-5 mb-6">
        <div className="text-xs text-pink-400 font-semibold uppercase tracking-wider mb-2">Next Match</div>
        <div className="text-2xl font-bold text-white mb-1">Oakridge Women vs Brighton Women</div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Saturday 12 April 2026</span>
          <span>KO 14:00</span>
          <span>Oakridge Stadium (H)</span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">WSL</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Available" value="8" sub="Of 10 squad players" color="green" />
        <StatCard label="Injured" value="1" sub="Sophie Turner (RTP)" color="red" />
        <StatCard label="Unavailable" value="1" sub="Sophie Lawson (maternity)" color="amber" />
        <StatCard label="Days Until Match" value="8" sub="Saturday 12 Apr" color="blue" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Availability Summary</h3>
          <div className="space-y-2">
            {[
              {player:'Emma Clarke',status:'Available',note:'Dual-reg recalled for this match'},
              {player:'Priya Nair',status:'Available',note:''},
              {player:'Jade Osei',status:'Available',note:''},
              {player:'Abbi Walsh',status:'Available',note:''},
              {player:'Charlotte Reed',status:'Available',note:''},
              {player:'Sophie Turner',status:'Injured',note:'RTP Phase 3 — no match clearance'},
              {player:'Fatima Al-Said',status:'Available',note:'ITC cleared — eligible'},
              {player:'Megan Hughes',status:'Available',note:''},
              {player:'Sophie Lawson',status:'Unavailable',note:'Maternity leave'},
              {player:'Tilly Brooks',status:'Available',note:'Part-time — confirmed available'},
            ].map((p: {player:string;status:string;note:string}) => (
              <div key={p.player} className="flex items-center justify-between py-1.5 border-b border-gray-800">
                <span className="text-xs text-gray-300">{p.player}</span>
                <div className="flex items-center gap-2">
                  {p.note && <span className="text-[10px] text-gray-500">{p.note}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    p.status === 'Available' ? 'bg-green-600/20 text-green-400'
                    : p.status === 'Injured' ? 'bg-red-600/20 text-red-400'
                    : 'bg-amber-600/20 text-amber-400'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Opposition Notes — Brighton Women</h3>
          <div className="space-y-3">
            {[
              {label:'Formation',value:'3-5-2'},
              {label:'Style',value:'High press, quick transitions'},
              {label:'Danger Player',value:'#9 Katie Robinson — 8 goals this season'},
              {label:'Weakness',value:'Vulnerable to wide overloads on left side'},
              {label:'Last Meeting',value:'1-1 draw (Nov 2025)'},
              {label:'League Position',value:'5th (W42 D8 L6)'},
            ].map((n: {label:string;value:string}) => (
              <div key={n.label}>
                <div className="text-[10px] text-gray-500 uppercase">{n.label}</div>
                <div className="text-xs text-gray-300">{n.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Pre-Match Checklist</h3>
        <div className="space-y-2">
          {[
            {key:'teamSheet',label:'Team sheet submitted to FA'},
            {key:'kitConfirmed',label:'Kit confirmed (home pink)'},
            {key:'travelBooked',label:'Travel arrangements confirmed'},
            {key:'medicalBag',label:'Medical bag packed and checked'},
            {key:'gpsDevices',label:'GPS devices charged and allocated'},
            {key:'matchBalls',label:'Match balls and equipment ready'},
          ].map((item: {key:string;label:string}) => (
            <button key={item.key} onClick={() => toggleItem(item.key)}
              className="flex items-center gap-2 text-xs w-full text-left py-1.5">
              <span className={checklist[item.key] ? 'text-green-400' : 'text-gray-600'}>{checklist[item.key] ? '✓' : '○'}</span>
              <span className={checklist[item.key] ? 'text-gray-400 line-through' : 'text-gray-300'}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── GPS & PLAYER DATA VIEW ─────────────────────────────────────────────────
const GPSPlayerDataView = () => {
  const players: Array<{name:string;pos:string;distance:number;topSpeed:number;sprints:number;hsr:number;load:string;loadColor:string}> = [
    {name:'Emma Clarke',pos:'CB',distance:9.2,topSpeed:28.1,sprints:14,hsr:620,load:'Optimal',loadColor:'green'},
    {name:'Priya Nair',pos:'CM',distance:11.4,topSpeed:29.3,sprints:22,hsr:890,load:'Optimal',loadColor:'green'},
    {name:'Jade Osei',pos:'ST',distance:10.1,topSpeed:31.2,sprints:26,hsr:780,load:'Optimal',loadColor:'green'},
    {name:'Abbi Walsh',pos:'RW',distance:10.8,topSpeed:30.5,sprints:28,hsr:850,load:'High',loadColor:'amber'},
    {name:'Charlotte Reed',pos:'GK',distance:5.4,topSpeed:18.2,sprints:4,hsr:120,load:'Optimal',loadColor:'green'},
    {name:'Sophie Turner',pos:'LB',distance:7.1,topSpeed:24.0,sprints:8,hsr:340,load:'Restricted',loadColor:'red'},
    {name:'Fatima Al-Said',pos:'AM',distance:10.6,topSpeed:29.8,sprints:20,hsr:810,load:'Optimal',loadColor:'green'},
    {name:'Megan Hughes',pos:'DM',distance:10.9,topSpeed:27.6,sprints:18,hsr:720,load:'Optimal',loadColor:'green'},
    {name:'Sophie Lawson',pos:'RB',distance:0,topSpeed:0,sprints:0,hsr:0,load:'On Leave',loadColor:'blue'},
    {name:'Tilly Brooks',pos:'LW',distance:9.8,topSpeed:30.1,sprints:24,hsr:760,load:'High',loadColor:'amber'},
  ]

  return (
    <div>
      <SectionHeader title="GPS & Player Data" subtitle="Training and match load monitoring" icon="📡" />
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-3 mb-6 text-xs text-blue-400">
        📡 GPS data synced via Catapult integration — last sync: today 09:14. 9 of 10 devices active.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Avg Distance" value="9.5 km" sub="Per session (outfield)" color="pink" />
        <StatCard label="Avg Top Speed" value="28.9 km/h" sub="Squad outfield avg" color="blue" />
        <StatCard label="High Load" value="2" sub="Walsh, Brooks" color="amber" />
        <StatCard label="Restricted" value="1" sub="Turner (RTP)" color="red" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Player</th><th className="text-left p-3">Pos</th><th className="text-right p-3">Distance (km)</th><th className="text-right p-3">Top Speed (km/h)</th><th className="text-right p-3">Sprints</th><th className="text-right p-3">HSR (m)</th><th className="text-left p-3">Load Status</th>
          </tr></thead>
          <tbody>
            {players.map((p: typeof players[0], i: number) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                <td className="p-3 text-gray-400">{p.pos}</td>
                <td className="p-3 text-right text-gray-300">{p.distance > 0 ? p.distance.toFixed(1) : '—'}</td>
                <td className="p-3 text-right text-gray-300">{p.topSpeed > 0 ? p.topSpeed.toFixed(1) : '—'}</td>
                <td className="p-3 text-right text-gray-300">{p.sprints > 0 ? p.sprints : '—'}</td>
                <td className="p-3 text-right text-gray-300">{p.hsr > 0 ? p.hsr : '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    p.loadColor === 'green' ? 'bg-green-600/20 text-green-400'
                    : p.loadColor === 'amber' ? 'bg-amber-600/20 text-amber-400'
                    : p.loadColor === 'red' ? 'bg-red-600/20 text-red-400'
                    : 'bg-blue-600/20 text-blue-400'
                  }`}>{p.load}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Integration Status</h3>
        <div className="space-y-2">
          {[
            {system:'Catapult GPS',status:'Connected',detail:'10 devices allocated, 9 active'},
            {system:'Kitman Labs',status:'Connected',detail:'ACL risk model synced'},
            {system:'Second Spectrum',status:'Pending',detail:'Video analysis integration — Phase 2'},
            {system:'FA Player Registration',status:'Connected',detail:'Squad list synced daily'},
          ].map((s: {system:string;status:string;detail:string}) => (
            <div key={s.system} className="flex items-center justify-between py-1.5 border-b border-gray-800">
              <div>
                <span className="text-xs text-gray-300">{s.system}</span>
                <span className="text-[10px] text-gray-500 ml-2">{s.detail}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'Connected' ? 'bg-green-600/20 text-green-400' : 'bg-amber-600/20 text-amber-400'}`}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PLACEHOLDER VIEW ─────────────────────────────────────────────────────────

// ─── SPONSORSHIP PIPELINE VIEW ─────────────────────────────────────────────────
const SponsorshipPipelineView = ({ club }: { club: WomensClub }) => {
  const fmt = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
  const deals: Array<{partner:string;type:string;value:number;attribution:string;end:string;status:string;flag:string}> = [
    {partner:'Kestrel Finance',type:'Kit',value:85000,attribution:'Standalone (100%)',end:'30 Apr 2025',status:'RENEWAL DUE',flag:''},
    {partner:'NovaTech UK',type:'Sleeve',value:40000,attribution:'Standalone (100%)',end:'30 Apr 2025',status:'RENEWAL DUE',flag:''},
    {partner:'Meridian Insurance',type:'Back of shirt',value:95000,attribution:'Bundled (64%)',end:'Dec 2025',status:'Active',flag:'FSR REVIEW'},
    {partner:'Lumio Tech',type:'Training kit',value:18000,attribution:'Standalone',end:'Mar 2026',status:'Active',flag:''},
  ]
  return (
    <div>
      <SectionHeader title="Sponsorship Pipeline — Standalone Commercial" subtitle="FSR-aware commercial CRM with bundled deal attribution" icon="🤝" />
      {!club.kitSponsor && <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 mb-6 text-xs text-amber-400">⚠ No kit sponsor active — flagged in FSR revenue dashboard.</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Deals" value="4" color="pink" />
        <StatCard label="Annual Value" value={fmt(238000)} color="teal" />
        <StatCard label="In Negotiation" value="2" color="amber" />
        <StatCard label="Renewals (30d)" value="2" sub="Kestrel + NovaTech" color="red" />
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            <th className="text-left p-3">Partner</th><th className="text-left p-3">Type</th><th className="text-left p-3">Value</th><th className="text-left p-3">FSR Attribution</th><th className="text-left p-3">End</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {deals.map((d: typeof deals[0], i: number) => (
              <tr key={i} className={`border-b border-gray-800/50 ${d.flag === 'FSR REVIEW' ? 'bg-red-600/5' : ''}`}>
                <td className="p-3 text-gray-200 font-medium">{d.partner}</td>
                <td className="p-3 text-gray-400 text-xs">{d.type}</td>
                <td className="p-3 text-gray-300">{fmt(d.value)}</td>
                <td className="p-3 text-xs">{d.attribution.includes('Bundled') ? <span className="text-red-400 font-medium">{d.attribution}</span> : <span className="text-green-400">{d.attribution}</span>}</td>
                <td className="p-3 text-gray-400 text-xs">{d.end}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${d.status === 'RENEWAL DUE' ? 'bg-amber-600/20 text-amber-400' : 'bg-green-600/20 text-green-400'}`}>{d.status}</span>{d.flag && <span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400 ml-1">{d.flag}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-red-600/5 border border-red-600/30 rounded-xl p-4 mb-6">
        <div className="text-xs text-red-400 font-medium mb-1">⚠ Bundled Attribution Review Required</div>
        <div className="text-xs text-gray-400">Meridian Insurance — bundled attribution 64% of £450k group deal. Women&apos;s share: £95k. Review recommended.</div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Brand Values Alignment</h3>
        <div className="space-y-2">
          {deals.map((d: typeof deals[0], i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-gray-300">{d.partner}</span>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>Empowerment {'★'.repeat(4)}{'☆'.repeat(1)}</span>
                <span>Equality {'★'.repeat(i < 2 ? 5 : 3)}{'☆'.repeat(i < 2 ? 0 : 2)}</span>
                <span>Community {'★'.repeat(i < 3 ? 4 : 3)}{'☆'.repeat(i < 3 ? 1 : 2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Prospect Pipeline</h3>
        <div className="space-y-2">
          {['Aurora Fitness (sleeve — est. £30k)','West Country Energy (stand naming — £15k)','Hartfield Building Society (community — £12k)','TechNow Digital (back of shirt — £45k)','GreenLeaf Nutrition (training kit — £20k)'].map((p: string, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{p}</span><span className="text-gray-600">Prospect</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── STANDALONE TRACKER VIEW ──────────────────────────────────────────────────
const StandaloneTrackerView = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title="Standalone Identity Tracker" subtitle="Building standalone commercial identity — FSR incentivised" icon="🏗️" />
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <p className="text-xs text-gray-400 mb-4">Revenue attributed directly to women&apos;s football increases your permitted salary cap under FSR.</p>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="#EC4899" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${0.68 * 314} 314`} transform="rotate(-90 60 60)" />
          <text x="60" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">68%</text>
          <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="9">Standalone</text>
        </svg>
        <div className="text-xs text-gray-400 space-y-1">
          <div><span className="text-pink-400 font-medium">68%</span> standalone revenue</div>
          <div><span className="text-gray-500">32%</span> affiliated/bundled</div>
        </div>
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Demerger Readiness Checklist</h3>
      <div className="space-y-2">
        {[{item:'Separate legal entity registered',done:true},{item:'Brand assets independently owned',done:true},{item:'Stadium/facility agreement',done:false,note:'In progress'},{item:'TUPE staff transfers',done:false,note:'Not started'},{item:'Bank account separation',done:true},{item:'Independent commercial deals',done:false,note:'2 bundled'}].map((c: {item:string;done:boolean;note?:string}, i: number) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-sm">
            <span className={c.done ? 'text-green-400' : 'text-red-400'}>{c.done ? '✓' : '✗'}</span>
            <span className={c.done ? 'text-gray-400' : 'text-gray-300'}>{c.item}</span>
            {c.note && <span className="text-xs text-amber-400 ml-auto">{c.note}</span>}
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard label="Indicative Valuation" value={new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(club.relevantRevenue * 2.5)} sub="Revenue × 2.5x" color="pink" />
      <StatCard label="Dependency Score" value="32%" sub="Lower is better ↓" color="amber" />
      <StatCard label="Standalone Readiness" value="58%" sub="Target: 85%" color="blue" />
    </div>
    <div className="w-full bg-gray-800 rounded-full h-3"><div className="h-3 rounded-full" style={{width:'58%',backgroundColor:'#EC4899'}} /></div>
    <div className="text-xs text-gray-500 mt-1">Standalone readiness: 58%</div>
  </div>
)

// ─── BOARD SUITE VIEW ─────────────────────────────────────────────────────────
const BoardSuiteView = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title={`Board Suite — ${club.name}`} subtitle="Executive dashboard for board and investors" icon="🏛️" />
    <div className="bg-pink-600/10 border border-pink-600/30 rounded-xl p-4 mb-6 flex items-center justify-between">
      <div><div className="text-sm text-pink-300 font-medium">Next board meeting: 15 Apr 2025</div><div className="text-xs text-gray-400">Pack due in 11 days</div></div>
      <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">Generate Pack — Phase 2</button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="FSR Status" value={`Safe (${club.salarySpend ?? 0}%)`} color="green" />
      <StatCard label="Headroom" value={club.fsrHeadroom ? `£${(club.fsrHeadroom/1000).toFixed(0)}k` : 'N/A'} color="teal" />
      <StatCard label="Revenue vs Budget" value="87%" color="blue" />
      <StatCard label="Pipeline" value="£238k" color="pink" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Squad" value="20" color="purple" />
      <StatCard label="Welfare Flags" value="2" color="amber" />
      <StatCard label="Attendance" value="2,847" color="blue" />
      <StatCard label="Points" value="34" color="green" />
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Commercial Growth (Season-on-Season)</h3>
      <svg viewBox="0 0 400 140" className="w-full">
        {[{year:'22-23',md:180,com:120,bc:80},{year:'23-24',md:220,com:180,bc:120},{year:'24-25',md:280,com:240,bc:160},{year:'25-26',md:320,com:310,bc:200}].map((y: {year:string;md:number;com:number;bc:number}, i: number) => {
          const x = 40 + i * 90; const scale = 100 / 350;
          return (<g key={i}><rect x={x} y={120 - y.md * scale} width={20} height={y.md * scale} rx={2} fill="#EC4899" opacity={0.7} /><rect x={x + 22} y={120 - y.com * scale} width={20} height={y.com * scale} rx={2} fill="#8B5CF6" opacity={0.7} /><rect x={x + 44} y={120 - y.bc * scale} width={20} height={y.bc * scale} rx={2} fill="#38BDF8" opacity={0.7} /><text x={x + 32} y={135} textAnchor="middle" fill="#6b7280" fontSize="9">{y.year}</text></g>)
        })}
      </svg>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-bold text-white mb-3">WSL Compliance</h3>
      <div className="space-y-2">
        {[{item:'FSR salary cap',ok:true},{item:'Age-band minimums',ok:false,note:'1 player'},{item:'Welfare standards',ok:true},{item:'Registration',ok:true},{item:'Dual reg records',ok:true}].map((c: {item:string;ok:boolean;note?:string}, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-gray-800/50"><span className={c.ok ? 'text-green-400' : 'text-red-400'}>{c.ok ? '✓' : '✗'}</span><span className="text-gray-300">{c.item}</span>{c.note && <span className="text-amber-400 ml-auto">{c.note}</span>}</div>
        ))}
      </div>
    </div>
  </div>
)

// ─── FINANCIAL PLANNING VIEW ──────────────────────────────────────────────────
const FinancialPlanningView = ({ club }: { club: WomensClub }) => {
  const [planTab, setPlanTab] = useState<'1yr'|'3yr'|'5yr'|'10yr'>('1yr')
  const fmtC = (n: number): string => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)
  const permitted = club.relevantRevenue * 0.8
  const headroom = club.fsrHeadroom ?? 0
  return (
    <div>
      <SectionHeader title="Club Planner — FSR-Constrained" subtitle="Multi-horizon planning with FSR compliance modelling" icon="💷" />
      <div className="flex gap-1 bg-[#0D1117] border border-gray-800 rounded-lg p-1 w-fit mb-6">
        {(['1yr','3yr','5yr','10yr'] as const).map((t: typeof planTab) => (
          <button key={t} onClick={() => setPlanTab(t)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${planTab === t ? 'bg-pink-600/20 text-pink-400 border border-pink-600/30' : 'text-gray-500 hover:text-gray-300'}`}>{t === '1yr' ? '1 Year' : t === '3yr' ? '3 Year' : t === '5yr' ? '5 Year' : '10 Year'}</button>
        ))}
      </div>
      {planTab === '1yr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Revenue" value={fmtC(club.relevantRevenue)} color="pink" />
            <StatCard label="Permitted (80%)" value={fmtC(permitted)} color="teal" />
            <StatCard label="Current Spend" value={fmtC(permitted - headroom)} color="blue" />
            <StatCard label="Headroom" value={fmtC(headroom)} color="green" />
          </div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-2">Matchday Target</h3><div className="text-xs text-gray-400">2,847 avg × 22 games × £18 ticket = <span className="text-pink-400 font-bold">£1.13M</span></div></div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-2">Transfer Budget</h3><div className="text-xs text-gray-400">{fmtC(headroom)} FSR headroom for signings</div></div>
          <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5"><h3 className="text-sm font-bold text-white mb-2">Cash Funding</h3><div className="text-xs text-gray-400">Owner contribution max: <span className="text-pink-400 font-bold">£500k</span>/season</div></div>
        </div>
      )}
      {planTab === '3yr' && (<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 space-y-2">{['+12% attendance growth/yr','2 new commercial deals/yr','Broadcast renegotiation 2027','Revenue target Y3: £3.2M → spend £2.56M','WSL 14-club expansion: extra broadcast'].map((s: string, i: number) => (<div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50">→ {s}</div>))}</div>)}
      {planTab === '5yr' && (<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 space-y-2">{['Stadium: 6,500 → 9,000 by Y4','Eliminate bundled deals by Y3','Full portfolio: kit + title + 6 partners','Self-sustaining model'].map((s: string, i: number) => (<div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50">→ {s}</div>))}</div>)}
      {planTab === '10yr' && (<div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 space-y-2">{['Full commercial independence','UWCL revenue modelling','Academy ROI over decade','Decade P&L with FSR at each milestone'].map((s: string, i: number) => (<div key={i} className="text-xs text-gray-400 py-1 border-b border-gray-800/50">→ {s}</div>))}</div>)}
    </div>
  )
}

// ─── STAFF DIRECTORY VIEW ─────────────────────────────────────────────────────
const StaffDirectoryView = () => (
  <div>
    <SectionHeader title="Staff Directory" subtitle="Club personnel and contacts" icon="📋" />
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
          <th className="text-left p-3">Name</th><th className="text-left p-3">Role</th><th className="text-left p-3">Dept</th><th className="text-left p-3">Email</th><th className="text-left p-3">Start</th>
        </tr></thead>
        <tbody>
          {[{n:'Sarah Frost',r:'Head Coach',d:'Football',e:'s.frost@oakridge.com',s:'Aug 2022'},{n:'Kate Brennan',r:'Club Director',d:'Executive',e:'k.brennan@oakridge.com',s:'Jan 2020'},{n:'Dr Anna Reid',r:'Psychologist',d:'Welfare',e:'a.reid@oakridge.com',s:'Sep 2023'},{n:'Mel Hooper',r:'Head Physio',d:'Medical',e:'m.hooper@oakridge.com',s:'Mar 2021'},{n:'Jordan Clarke',r:'Commercial Dir',d:'Commercial',e:'j.clarke@oakridge.com',s:'Jun 2023'},{n:'Nina Walsh',r:'Welfare Coord',d:'Welfare',e:'n.walsh@oakridge.com',s:'Jan 2024'},{n:'Tom Reed',r:'Analyst',d:'Football',e:'t.reed@oakridge.com',s:'Aug 2024'}].map((s: {n:string;r:string;d:string;e:string;s:string}, i: number) => (
            <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{s.n}</td><td className="p-3 text-gray-400 text-xs">{s.r}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">{s.d}</span></td><td className="p-3 text-gray-500 text-xs">{s.e}</td><td className="p-3 text-gray-500 text-xs">{s.s}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
const SettingsViewFull = ({ club }: { club: WomensClub }) => (
  <div>
    <SectionHeader title="Settings" subtitle="Club profile, notifications, integrations" icon="⚙️" />
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Club Profile</h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {[{l:'Club',v:club.name},{l:'League',v:club.league},{l:'Stadium',v:club.stadium},{l:'Accent',v:club.accent},{l:'Founded',v:String(club.founded)},{l:'Director',v:club.director}].map((f: {l:string;v:string}, i: number) => (
          <div key={i} className="py-2 border-b border-gray-800/50"><div className="text-gray-500 text-[10px] uppercase">{f.l}</div><div className="text-gray-200 mt-0.5">{f.v}</div></div>
        ))}
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Notifications</h3>
      <div className="space-y-3">
        {['FSR compliance alerts','Welfare flags','Sponsorship renewals','Dual reg expiries','Board meetings'].map((n: string, i: number) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50"><span className="text-sm text-gray-300">{n}</span><div className="w-10 h-5 bg-pink-600/30 rounded-full relative"><div className="w-4 h-4 bg-pink-400 rounded-full absolute top-0.5 right-0.5" /></div></div>
        ))}
      </div>
    </div>
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-white mb-3">Integrations</h3>
      {['Kitman Labs','FA Registration System'].map((ig: string, i: number) => (
        <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50"><span className="text-sm text-gray-300">{ig}</span><button className="px-3 py-1 rounded-lg text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30">Connect</button></div>
      ))}
    </div>
    <div className="flex gap-3">
      <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">Roles & Permissions — Demo</button>
      <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-600/20 text-pink-400 border border-pink-600/30">Export Data (GDPR)</button>
    </div>
  </div>
)

const PlaceholderView = ({ title, icon }: { title: string; icon: string }) => (
  <div>
    <SectionHeader title={title} icon={icon} />
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-8 text-center">
      <p className="text-gray-500 text-sm">This module is being built. Full content coming soon.</p>
    </div>
  </div>
)

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function WomensFootballPortal({ params }: { params: { slug: string } }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const club = DEMO_CLUBS[params.slug] ?? DEMO_CLUBS['oakridge-women']

  const groups = ['OVERVIEW', 'COMPLIANCE', 'WELFARE', 'FOOTBALL', 'COMMERCIAL', 'OPERATIONS']

  // Grassroots tier: hide FSR, salary, revenue, standalone, board, financial
  const hiddenForGrassroots = new Set(['fsr', 'salary', 'revenue', 'standalone', 'board', 'financial', 'dualreg', 'sponsorship', 'gps'])
  const filteredItems = club.tier === 'grassroots'
    ? SIDEBAR_ITEMS.filter((i: { id: string }) => !hiddenForGrassroots.has(i.id))
    : SIDEBAR_ITEMS

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':   return <DashboardView club={club} />
      case 'fsr':         return <FSRDashboardView club={club} />
      case 'welfare':     return <WelfareView />
      case 'briefing':    return <MorningBriefingView club={club} />
      case 'salary':      return <SalaryComplianceView />
      case 'revenue':     return <RevenueAttributionView />
      case 'acl':         return <ACLRiskMonitorView />
      case 'maternity':   return <MaternityTrackerView />
      case 'mental':      return <MentalHealthView />
      case 'squad':       return <SquadManagementView />
      case 'dualreg':     return <DualRegistrationView />
      case 'tactics':     return <TacticsSetPiecesView />
      case 'match':       return <MatchPreparationView />
      case 'sponsorship': return <SponsorshipPipelineView club={club} />
      case 'standalone':  return <StandaloneTrackerView club={club} />
      case 'board':       return <BoardSuiteView club={club} />
      case 'financial':   return <FinancialPlanningView club={club} />
      case 'team':        return <StaffDirectoryView />
      case 'gps':         return <GPSPlayerDataView />
      case 'medical':     return <MedicalRecordsView />
      case 'settings':    return <SettingsViewFull club={club} />
      default:            return <DashboardView club={club} />
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#07080F', fontFamily: 'DM Sans, sans-serif', color: '#e5e7eb' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-r border-gray-800 shrink-0 transition-all" style={{ width: sidebarCollapsed ? 64 : 220, background: '#0A0B12' }}>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
          <span className="text-xl">⚽</span>
          {!sidebarCollapsed && <span className="text-sm font-bold text-white truncate">{club.name}</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map((group: string) => {
            const items = filteredItems.filter((i: { group: string }) => i.group === group)
            if (items.length === 0) return null
            return (
            <div key={group}>
              {!sidebarCollapsed && <div className="text-[10px] text-gray-600 font-semibold tracking-wider px-4 pt-3 pb-1">{group}</div>}
              {items.map((item: { id: string; label: string; icon: string }) => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-all ${
                    activeSection === item.id ? 'bg-pink-600/10 text-pink-400 font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <span className="text-sm">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
            )
          })}
        </nav>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-3 text-gray-600 hover:text-gray-400 border-t border-gray-800 text-xs">
          {sidebarCollapsed ? '→' : '← Collapse'}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between" style={{ background: '#0A0B12' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">⚽</span>
            <div>
              <h1 className="text-sm font-bold text-white">{club.name}</h1>
              <p className="text-[10px] text-gray-500">
                {club.tier === 'grassroots' ? `${club.league} Women's Football` : `${club.league} · FSR Compliant · Karen Carney Review Standards`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {club.tier !== 'grassroots' && (
              <span className={`text-xs px-2 py-1 rounded ${
                club.salarySpend !== null && club.salarySpend > 80 ? 'bg-red-600/20 text-red-400 border border-red-600/30' :
                club.salarySpend !== null && club.salarySpend > 70 ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' :
                'bg-green-600/20 text-green-400 border border-green-600/30'
              }`}>
                FSR: {club.salarySpend !== null && club.salarySpend > 80 ? 'AT RISK' : club.salarySpend !== null && club.salarySpend > 70 ? 'REVIEW' : 'SAFE'}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded ${
              club.tier === 'pro' ? 'bg-pink-600/20 text-pink-400 border border-pink-600/30' :
              club.tier === 'championship' ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' :
              'bg-green-600/20 text-green-400 border border-green-600/30'
            }`}>{club.league}</span>
          </div>
        </div>
        <div className="p-6 max-w-6xl">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
