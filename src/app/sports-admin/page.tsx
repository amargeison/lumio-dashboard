'use client'

import { useState, useEffect } from 'react'
import { Users2, Building2, TrendingUp, Clock, Sparkles, Activity, Eye } from 'lucide-react'
import RagBadge from '@/components/admin/RagBadge'
import { calculateRag } from '@/lib/rag-score'
import { impersonateUrl } from '@/lib/sports-admin/portal-url'

const SE: Record<string, string> = { tennis:'🎾', golf:'⛳', darts:'🎯', boxing:'🥊', cricket:'🏏', rugby:'🏉', football:'⚽', nonleague:'⚽', grassroots:'⚽', womens:'⚽', coach:'🎾' }
const ATHLETE_SPORTS = new Set(['tennis','golf','darts','boxing','coach'])
const CLUB_SPORTS = new Set(['football','cricket','rugby','nonleague','grassroots','womens'])

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('sports_admin_token') || '' : '' }

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    live: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    active: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  }
  const s = map[status] || map.pending
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>
}

// AI spend tile — live from the global daily spend counter.
function AiSpendTile() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    const load = () => fetch('/api/sports-admin/ai-spend', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.ok ? r.json() : null).then(setData).catch(() => {})
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [])

  const spend = data?.spendUsd ?? 0
  const cap = data?.capUsd ?? 5
  const pct = Math.min(100, Math.round((data?.utilisation ?? 0) * 100))
  const calls = data?.calls ?? 0
  const color = pct >= 90 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#22C55E'

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color }}><Sparkles size={12} /> AI SPEND TODAY</p>
        <span className="text-[10px]" style={{ color: '#6B7280' }}>resets 00:00 UTC</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>${spend.toFixed(2)}</span>
        <span className="text-xs" style={{ color: '#6B7280' }}>/ ${cap.toFixed(2)}</span>
        <span className="ml-auto text-xs font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-[10px] mt-2" style={{ color: '#6B7280' }}>{data ? `${calls} calls today · ${data.storage || 'in-memory'}` : 'Loading…'}</p>
    </div>
  )
}

export default function SportsAdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'athletes' | 'clubs'>('athletes')

  useEffect(() => {
    fetch('/api/sports-admin/users', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => { setUsers(d.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const rows = users.filter(u => (view === 'clubs' ? CLUB_SPORTS : ATHLETE_SPORTS).has(u.sport))
  const totalAthletes = users.filter(u => ATHLETE_SPORTS.has(u.sport)).length
  const totalClubs = users.filter(u => CLUB_SPORTS.has(u.sport)).length
  const live = rows.filter(u => u.setup_complete).length
  const thisMonth = rows.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 86400000)).length
  const withLogins = rows.filter(u => (u.login_count || 0) > 0).length
  const aiCalls = rows.reduce((s, u) => s + (u.ai_calls || 0), 0)

  const impersonate = (u: any) => window.open(impersonateUrl(u.id, getToken()), '_blank')
  const status = (u: any) => u.setup_complete ? 'live' : u.onboarding_complete ? 'active' : 'pending'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sports Admin Dashboard</h1>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <button onClick={() => setView('athletes')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            style={{ backgroundColor: view === 'athletes' ? '#F5A623' : '#111318', color: view === 'athletes' ? '#0A0B10' : '#6B7280' }}>
            <Users2 size={13} /> Sports
          </button>
          <button onClick={() => setView('clubs')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            style={{ backgroundColor: view === 'clubs' ? '#F5A623' : '#111318', color: view === 'clubs' ? '#0A0B10' : '#6B7280' }}>
            <Building2 size={13} /> Clubs
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard label="Total Athletes" value={loading ? '—' : totalAthletes} icon={Users2} color="#6C3FC5" />
        <StatCard label="Total Clubs" value={loading ? '—' : totalClubs} icon={Building2} color="#3B82F6" />
        <StatCard label="Portals Live" value={loading ? '—' : live} icon={TrendingUp} color="#22C55E" />
        <StatCard label="New This Month" value={loading ? '—' : thisMonth} icon={Clock} color="#F59E0B" />
        <StatCard label="Have Logged In" value={loading ? '—' : withLogins} icon={Activity} color="#0EA5E9" />
        <StatCard label="AI Calls" value={loading ? '—' : aiCalls} icon={Sparkles} color="#F59E0B" />
      </div>

      {/* Platform ops */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <AiSpendTile />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {[view === 'clubs' ? 'Club' : 'Athlete', 'Sport', 'Plan', 'Status', 'Created', 'Health', ''].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>No {view} yet</td></tr>
              ) : rows.slice(0, 30).map(u => (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{u.display_name || u.brand_name || '—'}{u.nickname && <span className="ml-1 text-xs" style={{ color: '#6B7280' }}>&quot;{u.nickname}&quot;</span>}</td>
                  <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{SE[u.sport] || ''} {u.sport}</td>
                  <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{u.plan || 'trial'}</td>
                  <td className="px-5 py-3"><StatusBadge status={status(u)} /></td>
                  <td className="px-5 py-3" style={{ color: '#6B7280' }}>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3"><RagBadge rag={calculateRag({ lastLogin: u.created_at, onboardingComplete: u.onboarding_complete, integrationsCount: u.enabled_features?.length || 0 })} /></td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => impersonate(u)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
                      <Eye size={12} /> Impersonate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
