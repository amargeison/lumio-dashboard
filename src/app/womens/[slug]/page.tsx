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

// ─── PLACEHOLDER VIEW ─────────────────────────────────────────────────────────
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

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':   return <DashboardView club={club} />
      case 'fsr':         return <FSRDashboardView club={club} />
      case 'welfare':     return <WelfareView />
      case 'briefing':    return <MorningBriefingView club={club} />
      case 'salary':      return <PlaceholderView title="Salary Compliance" icon="💰" />
      case 'revenue':     return <PlaceholderView title="Revenue Attribution" icon="📈" />
      case 'acl':         return <ACLRiskMonitorView />
      case 'maternity':   return <MaternityTrackerView />
      case 'mental':      return <MentalHealthView />
      case 'squad':       return <PlaceholderView title="Squad Management" icon="👥" />
      case 'dualreg':     return <PlaceholderView title="Dual Registration" icon="🔄" />
      case 'tactics':     return <PlaceholderView title="Tactics & Set Pieces" icon="🎯" />
      case 'match':       return <PlaceholderView title="Match Preparation" icon="⚽" />
      case 'sponsorship': return <PlaceholderView title="Sponsorship Pipeline" icon="🤝" />
      case 'standalone':  return <PlaceholderView title="Standalone Tracker" icon="🏗️" />
      case 'board':       return <PlaceholderView title="Board Suite" icon="🏛️" />
      case 'financial':   return <PlaceholderView title="Financial Planning" icon="💷" />
      case 'team':        return <PlaceholderView title="Staff Directory" icon="📋" />
      case 'gps':         return <PlaceholderView title="GPS & PlayerData" icon="📡" />
      case 'medical':     return <MedicalRecordsView />
      case 'settings':    return <PlaceholderView title="Settings" icon="⚙️" />
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
          {groups.map(group => (
            <div key={group}>
              {!sidebarCollapsed && <div className="text-[10px] text-gray-600 font-semibold tracking-wider px-4 pt-3 pb-1">{group}</div>}
              {SIDEBAR_ITEMS.filter(i => i.group === group).map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-all ${
                    activeSection === item.id ? 'bg-pink-600/10 text-pink-400 font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  <span className="text-sm">{item.icon}</span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
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
              <p className="text-[10px] text-gray-500">{club.league} · FSR Compliant · Karen Carney Review Standards</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400 border border-green-600/30">FSR: SAFE</span>
            <span className="text-xs px-2 py-1 rounded bg-pink-600/20 text-pink-400 border border-pink-600/30">{club.league}</span>
          </div>
        </div>
        <div className="p-6 max-w-6xl">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
