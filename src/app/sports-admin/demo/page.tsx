'use client'

import { useState, useEffect } from 'react'
import { FlaskConical, Clock, Trophy, Layers, Eye } from 'lucide-react'

const SE: Record<string, string> = { tennis:'🎾', golf:'⛳', darts:'🎯', boxing:'🥊', cricket:'🏏', rugby:'🏉', football:'⚽', nonleague:'⚽', grassroots:'⚽', womens:'⚽', coach:'🎾' }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('sports_admin_token') || '' : '' }
function demoUrl(sport: string) { return sport === 'coach' ? '/tennis/coach/demo' : `/${sport}/demo` }

type Lead = { email: string; sport: string; club_name: string | null; user_name: string | null; nickname: string | null; role: string | null; first_seen: string; last_seen: string }

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

export default function SportsAdminDemo() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState('all')

  useEffect(() => {
    fetch('/api/sports-admin/demo-leads', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.ok ? r.json() : { leads: [] })
      .then(d => { setLeads(d.leads || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sports = Array.from(new Set(leads.map(l => l.sport)))
  const rows = sport === 'all' ? leads : leads.filter(l => l.sport === sport)
  const thisWeek = leads.filter(l => new Date(l.last_seen) > new Date(Date.now() - 7 * 86400000)).length
  const topSport = leads.length ? Object.entries(leads.reduce((a: Record<string, number>, l) => { a[l.sport] = (a[l.sport] || 0) + 1; return a }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '—' : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Demo Signups</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Everyone who&apos;s tried a live demo — captured before they sign up.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Demo Leads" value={loading ? '—' : leads.length} icon={FlaskConical} color="#A855F7" />
        <StatCard label="Active This Week" value={loading ? '—' : thisWeek} icon={Clock} color="#F59E0B" />
        <StatCard label="Sports Tried" value={loading ? '—' : sports.length} icon={Layers} color="#0EA5E9" />
        <StatCard label="Top Sport" value={loading ? '—' : topSport} icon={Trophy} color="#22C55E" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSport('all')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: sport === 'all' ? '#F5A623' : '#111318', color: sport === 'all' ? '#0A0B10' : '#9CA3AF', border: '1px solid #1F2937' }}>All</button>
        {sports.map(s => (
          <button key={s} onClick={() => setSport(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize" style={{ background: sport === s ? '#F5A623' : '#111318', color: sport === s ? '#0A0B10' : '#9CA3AF', border: '1px solid #1F2937' }}>{SE[s] || ''} {s}</button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Name', 'Sport', 'Club', 'Email', 'First Seen', 'Last Seen', ''].map(c => (
                  <th key={c} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>No demo signups yet</td></tr>
              ) : rows.map((l, i) => (
                <tr key={l.email + l.sport + i} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{l.user_name || '—'}{l.nickname && <span className="ml-1 text-xs" style={{ color: '#6B7280' }}>&quot;{l.nickname}&quot;</span>}</td>
                  <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{SE[l.sport] || ''} {l.sport}</td>
                  <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{l.club_name || '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: '#9CA3AF' }}>{l.email}</td>
                  <td className="px-5 py-3" style={{ color: '#6B7280' }}>{new Date(l.first_seen).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3" style={{ color: '#6B7280' }}>{new Date(l.last_seen).toLocaleDateString('en-GB')}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => window.open(demoUrl(l.sport), '_blank')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
                      <Eye size={12} /> View demo
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
