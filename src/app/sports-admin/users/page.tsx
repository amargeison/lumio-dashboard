'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, Trash2, Download } from 'lucide-react'
import RagBadge from '@/components/admin/RagBadge'
import { calculateRag } from '@/lib/rag-score'
import { portalUrlFor } from '@/lib/sports-admin/portal-url'

const SE: Record<string, string> = { tennis:'🎾', coach:'🎾', golf:'⛳', darts:'🎯', boxing:'🥊', cricket:'🏏', rugby:'🏉', football:'⚽', nonleague:'⚽', grassroots:'⚽', womens:'⚽' }
const SLABEL: Record<string, string> = { coach: 'Tennis Coach' }
const ATHLETE_SPORTS = ['tennis','coach','golf','darts','boxing']
const CLUB_SPORTS = ['football','cricket','rugby','nonleague','grassroots','womens']

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('sports_admin_token') || '' : '' }
const portalUrl = portalUrlFor
const sportLabel = (s: string) => SLABEL[s] || s

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    live: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    active: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  }
  const s = map[status] || map.pending
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>
}

export default function SportsAdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState('all')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [viewType, setViewType] = useState<'athletes'|'clubs'>('athletes')

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t) }, [search])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (sport !== 'all') params.set('sport', sport)
    if (debounced) params.set('search', debounced)
    fetch(`/api/sports-admin/users?${params}`, { headers: { 'x-admin-token': getToken() } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => { setUsers(d.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sport, debounced])

  const sportSet = new Set(viewType === 'athletes' ? ATHLETE_SPORTS : CLUB_SPORTS)
  const filtered = sport === 'all' ? users.filter(u => sportSet.has(u.sport)) : users
  const visibleSports = viewType === 'athletes' ? ATHLETE_SPORTS : CLUB_SPORTS
  const isClub = viewType === 'clubs'
  const status = (u: any) => u.setup_complete ? 'live' : u.onboarding_complete ? 'active' : 'pending'

  const exportCSV = () => {
    const headers = [isClub ? 'Club' : 'Athlete','Club / brand','Slug','Email','Sport','Plan','Status','Signed Up','Logins','AI Calls']
    const rows = filtered.map(u => [u.display_name, u.brand_name || '', u.portal_slug || '', u.email, u.sport, u.plan, status(u), new Date(u.created_at).toLocaleDateString('en-GB'), u.login_count, u.ai_calls])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `lumio-sports-${viewType}-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  const handleDelete = async (e: React.MouseEvent, userId: string, email: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`Delete ${email}? This removes them from Supabase auth and sports_profiles.`)) return
    const res = await fetch('/api/sports-admin/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() }, body: JSON.stringify({ userId }) })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId)); else alert('Delete failed — check console')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{isClub ? 'Clubs' : 'Sports'}</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{loading ? '…' : `${filtered.length} ${isClub ? 'clubs' : 'athletes & coaches'}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1F2937' }}>
            <button onClick={() => { setViewType('athletes'); setSport('all') }} className="px-4 py-2 text-xs font-semibold" style={{ background: viewType === 'athletes' ? '#F5A623' : '#111318', color: viewType === 'athletes' ? '#0A0B10' : '#6B7280' }}>Athletes</button>
            <button onClick={() => { setViewType('clubs'); setSport('all') }} className="px-4 py-2 text-xs font-semibold" style={{ background: viewType === 'clubs' ? '#F5A623' : '#111318', color: viewType === 'clubs' ? '#0A0B10' : '#6B7280' }}>Clubs</button>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: '#1F2937', color: '#F9FAFB' }}><Download size={13} /> Export CSV</button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input placeholder={`Search by ${isClub ? 'club' : 'name'}…`} value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg px-3 py-2 text-sm" style={{ background: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }} />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSport('all')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: sport === 'all' ? '#F5A623' : '#111318', color: sport === 'all' ? '#0A0B10' : '#9CA3AF', border: '1px solid #1F2937' }}>All</button>
          {visibleSports.map(s => (
            <button key={s} onClick={() => setSport(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize" style={{ background: sport === s ? '#F5A623' : '#111318', color: sport === s ? '#0A0B10' : '#9CA3AF', border: '1px solid #1F2937' }}>{SE[s]} {sportLabel(s)}</button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {[isClub ? 'Club' : 'Athlete', 'Club / brand', 'Sport', 'Slug', 'Plan', 'Status', 'Created', 'Health', ''].map(c => (
                  <th key={c} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>No {isClub ? 'clubs' : 'athletes'} found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/sports-admin/users/${u.id}`} className="hover:underline" style={{ color: '#F9FAFB' }}>{u.display_name || '—'}</Link>
                    {u.nickname && <span className="ml-1 text-xs" style={{ color: '#6B7280' }}>&quot;{u.nickname}&quot;</span>}
                  </td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{u.brand_name || '—'}</td>
                  <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{SE[u.sport] || ''} {sportLabel(u.sport)}</td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#6B7280' }}>{u.portal_slug || '—'}</td>
                  <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{u.plan || 'trial'}</td>
                  <td className="px-5 py-3"><StatusBadge status={status(u)} /></td>
                  <td className="px-5 py-3" style={{ color: '#6B7280' }}>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3"><RagBadge rag={calculateRag({ lastLogin: u.last_login || u.created_at, onboardingComplete: u.onboarding_complete, integrationsCount: u.enabled_features?.length || 0 })} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => window.open(portalUrl(u), '_blank')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
                        <Eye size={12} /> Impersonate
                      </button>
                      <button onClick={e => handleDelete(e, u.id, u.email)} title="Delete" className="inline-flex items-center px-2 py-1.5 rounded-lg" style={{ border: '1px solid #374151', color: '#6B7280' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
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
