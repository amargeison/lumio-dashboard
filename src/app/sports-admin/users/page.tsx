'use client'
import { useState, useEffect } from 'react'

const SC: Record<string, string> = { tennis:'#a855f7', golf:'#16a34a', darts:'#22c55e', boxing:'#ef4444', cricket:'#10b981', rugby:'#f97316', football:'#3b82f6', nonleague:'#f59e0b', grassroots:'#10b981', womens:'#be185d' }
const SE: Record<string, string> = { tennis:'🎾', golf:'⛳', darts:'🎯', boxing:'🥊', cricket:'🏏', rugby:'🏉', football:'⚽', nonleague:'⚽', grassroots:'⚽', womens:'⚽' }
const ALL_SPORTS = ['tennis','golf','darts','boxing','cricket','rugby','football','nonleague','grassroots','womens']

export default function SportsAdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState('all')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t) }, [search])

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem('sports_admin_token') || ''
    const params = new URLSearchParams()
    if (sport !== 'all') params.set('sport', sport)
    if (debounced) params.set('search', debounced)
    fetch(`/api/sports-admin/users?${params}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => { setUsers(d.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sport, debounced])

  const exportCSV = () => {
    const headers = ['Name','Nickname','Email','Sport','Plan','Signed Up','Last Login','Login Count','AI Calls','Quick Actions']
    const rows = users.map(u => [
      u.display_name, u.nickname || '', u.email, u.sport, u.plan,
      new Date(u.created_at).toLocaleDateString('en-GB'),
      u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB') : 'Never',
      u.login_count, u.ai_calls, u.quick_actions
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `lumio-sports-athletes-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div><h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Athletes</h1><p style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>{loading ? '...' : `${users.length} athletes`}</p></div>
        <button onClick={exportCSV} style={{ background: '#6C3FC5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, background: '#0d1117', border: '1px solid #1F2937', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: 14 }} />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setSport('all')} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: sport === 'all' ? '#6C3FC5' : '#1F2937', color: sport === 'all' ? '#fff' : '#94a3b8' }}>All</button>
          {ALL_SPORTS.map(s => (
            <button key={s} onClick={() => setSport(s)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: sport === s ? (SC[s] || '#6C3FC5') : '#1F2937', color: sport === s ? '#fff' : '#94a3b8', textTransform: 'capitalize' }}>
              {SE[s]} {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Athlete','Sport','Email','Plan','Signed Up','Last Login','Logins','AI Calls','Actions'].map(c => (
                <th key={c} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>No athletes found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(31,41,55,0.5)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                <td style={{ padding: '12px 16px' }}><div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{u.display_name}</div>{u.nickname && <div style={{ color: '#475569', fontSize: 11 }}>&quot;{u.nickname}&quot;</div>}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ color: SC[u.sport] || '#94a3b8', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{SE[u.sport]} {u.sport}</span></td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ background: '#a855f720', color: '#a855f7', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{u.plan}</span></td>
                <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '12px 16px', color: u.last_login ? '#22c55e' : '#475569', fontSize: 12 }}>{u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB') : 'Never'}</td>
                <td style={{ padding: '12px 16px', color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{u.login_count}</td>
                <td style={{ padding: '12px 16px', color: '#f59e0b', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{u.ai_calls}</td>
                <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 13, textAlign: 'center' }}>{u.quick_actions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
