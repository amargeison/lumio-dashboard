'use client'

import { useState, useEffect } from 'react'
import { Building2, TrendingUp, Clock, Trophy, Eye } from 'lucide-react'
import RagBadge from '@/components/admin/RagBadge'
import { calculateRag } from '@/lib/rag-score'

const SE: Record<string, string> = { football:'⚽', cricket:'🏏', rugby:'🏉', nonleague:'⚽', grassroots:'⚽', womens:'⚽' }
const CLUB_SPORTS = new Set(['football','cricket','rugby','nonleague','grassroots','womens'])
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('sports_admin_token') || '' : '' }

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-2xl font-bold capitalize" style={{ color: '#F9FAFB' }}>{value}</p>
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

export default function SportsAdminClubs() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sports-admin/users', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => { setUsers((d.users || []).filter((u: any) => CLUB_SPORTS.has(u.sport))); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const live = users.filter(u => u.setup_complete).length
  const thisMonth = users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 86400000)).length
  const topSport = users.length ? Object.entries(users.reduce((a: Record<string, number>, u) => { a[u.sport] = (a[u.sport] || 0) + 1; return a }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '—' : '—'
  const status = (u: any) => u.setup_complete ? 'live' : u.onboarding_complete ? 'active' : 'pending'
  const impersonate = (u: any) => window.open(`/${u.sport}/${u.portal_slug || 'demo'}`, '_blank')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clubs</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Team-sport accounts — football, rugby, cricket and women&apos;s.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Clubs" value={loading ? '—' : users.length} icon={Building2} color="#3B82F6" />
        <StatCard label="Portals Live" value={loading ? '—' : live} icon={TrendingUp} color="#22C55E" />
        <StatCard label="New This Month" value={loading ? '—' : thisMonth} icon={Clock} color="#F59E0B" />
        <StatCard label="Top Sport" value={loading ? '—' : topSport} icon={Trophy} color="#0EA5E9" />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Club', 'Sport', 'Slug', 'Plan', 'Status', 'Created', 'Health', ''].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>No clubs yet</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{u.brand_name || u.display_name || '—'}</td>
                  <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{SE[u.sport] || ''} {u.sport}</td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#6B7280' }}>{u.portal_slug || '—'}</td>
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
