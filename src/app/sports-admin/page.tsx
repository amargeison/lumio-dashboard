'use client'
import { useState, useEffect } from 'react'

const SC: Record<string, string> = { tennis:'#a855f7', golf:'#16a34a', darts:'#22c55e', boxing:'#ef4444', cricket:'#10b981', rugby:'#f97316', football:'#3b82f6', nonleague:'#f59e0b', grassroots:'#10b981', womens:'#be185d' }
const SE: Record<string, string> = { tennis:'🎾', golf:'⛳', darts:'🎯', boxing:'🥊', cricket:'🏏', rugby:'🏉', football:'⚽', nonleague:'⚽', grassroots:'⚽', womens:'⚽' }
const ATHLETE_SPORTS = new Set(['tennis','golf','darts','boxing'])
const CLUB_SPORTS = new Set(['football','cricket','rugby','nonleague','grassroots','womens'])

export default function SportsAdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<'all'|'athletes'|'clubs'>('all')

  useEffect(() => {
    const token = localStorage.getItem('sports_admin_token') || ''
    fetch('/api/sports-admin/users', { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => { setUsers(d.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = viewType === 'athletes' ? users.filter(u => ATHLETE_SPORTS.has(u.sport))
    : viewType === 'clubs' ? users.filter(u => CLUB_SPORTS.has(u.sport))
    : users

  const totalAthletes = users.filter(u => ATHLETE_SPORTS.has(u.sport)).length
  const totalClubs = users.filter(u => CLUB_SPORTS.has(u.sport)).length
  const thisMonth = filtered.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 86400000)).length
  const withLogins = filtered.filter(u => u.login_count > 0).length
  const totalAiCalls = filtered.reduce((s, u) => s + (u.ai_calls || 0), 0)
  const sportCounts = users.reduce((acc, u) => { acc[u.sport] = (acc[u.sport] || 0) + 1; return acc }, {} as Record<string, number>)
  const isClubView = viewType === 'clubs'
  const nameLabel = isClubView ? 'Club' : 'Athlete'

  const STATS = [
    { label: 'Total Athletes', value: totalAthletes, color: '#6C3FC5' },
    { label: 'Total Clubs', value: totalClubs, color: '#3b82f6' },
    { label: 'New This Month', value: thisMonth, color: '#22c55e' },
    { label: 'Have Logged In', value: withLogins, color: '#0ea5e9' },
    { label: 'AI Calls Made', value: totalAiCalls, color: '#f59e0b' },
    { label: 'Awaiting Setup', value: filtered.filter(u => u.setup_type === 'lumio' && !u.setup_complete).length, color: '#f59e0b' },
  ]

  const athleteSports = (Object.entries(sportCounts) as [string, number][]).filter(([s]) => ATHLETE_SPORTS.has(s)).sort((a, b) => b[1] - a[1])
  const clubSports = (Object.entries(sportCounts) as [string, number][]).filter(([s]) => CLUB_SPORTS.has(s)).sort((a, b) => b[1] - a[1])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>Lumio Sports overview</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all','athletes','clubs'] as const).map(t => (
            <button key={t} onClick={() => setViewType(t)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: viewType === t ? '#6C3FC5' : '#1F2937', color: viewType === t ? '#fff' : '#94a3b8', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 32 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}>
            <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            <p style={{ color: s.color, fontSize: 28, fontWeight: 800, margin: 0 }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏅 Athletes</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {athleteSports.map(([sport, count]) => (
                <div key={sport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${SC[sport]}15`, border: `1px solid ${SC[sport]}40`, borderRadius: 8, padding: '6px 12px' }}>
                  <span>{SE[sport]}</span><span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{sport}</span><span style={{ color: SC[sport], fontSize: 12, fontWeight: 700 }}>{String(count)}</span>
                </div>
              ))}
              {athleteSports.length === 0 && !loading && <span style={{ color: '#475569', fontSize: 12 }}>None yet</span>}
            </div>
          </div>
          <div style={{ width: 1, background: '#1F2937' }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏟️ Clubs</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {clubSports.map(([sport, count]) => (
                <div key={sport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${SC[sport]}15`, border: `1px solid ${SC[sport]}40`, borderRadius: 8, padding: '6px 12px' }}>
                  <span>{SE[sport]}</span><span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{sport}</span><span style={{ color: SC[sport], fontSize: 12, fontWeight: 700 }}>{String(count)}</span>
                </div>
              ))}
              {clubSports.length === 0 && !loading && <span style={{ color: '#475569', fontSize: 12 }}>None yet</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F2937' }}>
          <h2 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Signups</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {[nameLabel,'Sport','Email','Plan','Onboarding','Setup','Signed Up','Logins','AI Calls'].map(c => (
                <th key={c} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>No {isClubView ? 'clubs' : 'athletes'} yet</td></tr>
            ) : filtered.slice(0, 20).map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #0d1117' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                <td style={{ padding: '12px 16px' }}><div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{u.display_name}</div>{u.nickname && <div style={{ color: '#475569', fontSize: 11 }}>&quot;{u.nickname}&quot;</div>}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ color: SC[u.sport] || '#94a3b8', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{SE[u.sport]} {u.sport}</span></td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ background: '#a855f720', color: '#a855f7', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{u.plan}</span></td>
                <td style={{ padding: '12px 16px', fontSize: 12 }}>{u.onboarding_complete ? <span style={{ color: '#22c55e' }}>✅ Complete</span> : <span style={{ color: '#f59e0b' }}>⏳ Pending</span>}</td>
                <td style={{ padding: '12px 16px', fontSize: 12 }}>{u.setup_complete ? <span style={{ color: '#22c55e' }}>✅ Live</span> : u.setup_type === 'lumio' ? <span style={{ color: '#a855f7' }}>⚙️ Lumio</span> : u.setup_type === 'self' ? <span style={{ color: '#0ea5e9' }}>🔧 Self</span> : <span style={{ color: '#6B7280' }}>—</span>}</td>
                <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '12px 16px', color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{u.login_count}</td>
                <td style={{ padding: '12px 16px', color: '#f59e0b', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{u.ai_calls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
