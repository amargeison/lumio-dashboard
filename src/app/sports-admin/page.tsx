'use client'
import { useState, useEffect, useRef } from 'react'

const SC: Record<string, string> = { tennis:'#a855f7', golf:'#16a34a', darts:'#22c55e', boxing:'#ef4444', cricket:'#10b981', rugby:'#f97316', football:'#3b82f6', nonleague:'#f59e0b', grassroots:'#10b981', womens:'#be185d' }
const SE: Record<string, string> = { tennis:'🎾', golf:'⛳', darts:'🎯', boxing:'🥊', cricket:'🏏', rugby:'🏉', football:'⚽', nonleague:'⚽', grassroots:'⚽', womens:'⚽' }
const ATHLETE_SPORTS = new Set(['tennis','golf','darts','boxing'])
const CLUB_SPORTS = new Set(['football','cricket','rugby','nonleague','grassroots','womens'])
const SPORT_ACCENT: Record<string, string> = { darts:'#22c55e', golf:'#3b82f6', tennis:'#F59E0B', boxing:'#dc2626' }
const getAccent = (sport: string) => SPORT_ACCENT[sport] || '#6B7280'

type FoundingPlayer = {
  id: string; sport: string; display_name: string | null; nickname: string | null
  avatar_url: string | null; brand_name: string | null; brand_logo_url: string | null
  portal_slug: string | null; slug_confirmed: boolean | null; enabled_features: string[] | null
  onboarding_complete: boolean | null; setup_type: string | null; setup_complete: boolean | null
  plan: string | null; email: string | null; created_at: string; updated_at: string
}

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('sports_admin_token') || '' : '' }
function getStatus(p: FoundingPlayer) {
  if (p.setup_complete) return 'live'
  if (p.onboarding_complete && p.setup_type && !p.setup_complete) return 'ready'
  return 'pending'
}

// ━━━ MAIN PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function SportsAdminDashboard() {
  const [tab, setTab] = useState<'dashboard'|'onboarding'>('dashboard')
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {([{ id: 'dashboard' as const, label: '📊 Dashboard' }, { id: 'onboarding' as const, label: '🚀 Onboarding' }]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === t.id ? '#6C3FC5' : '#1F2937', color: tab === t.id ? '#fff' : '#94a3b8' }}>{t.label}</button>
        ))}
      </div>
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'onboarding' && <OnboardingCentre />}
    </div>
  )
}

// ━━━ DASHBOARD TAB (existing) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DashboardTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<'all'|'athletes'|'clubs'>('all')

  useEffect(() => {
    fetch('/api/sports-admin/users', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => { setUsers(d.users || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = viewType === 'athletes' ? users.filter(u => ATHLETE_SPORTS.has(u.sport)) : viewType === 'clubs' ? users.filter(u => CLUB_SPORTS.has(u.sport)) : users
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
        <div><h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: 0 }}>Dashboard</h1><p style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>Lumio Sports overview</p></div>
        <div style={{ display: 'flex', gap: 4 }}>{(['all','athletes','clubs'] as const).map(t => (<button key={t} onClick={() => setViewType(t)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: viewType === t ? '#6C3FC5' : '#1F2937', color: viewType === t ? '#fff' : '#94a3b8', textTransform: 'capitalize' }}>{t}</button>))}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 32 }}>{STATS.map(s => (<div key={s.label} style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, padding: 16 }}><p style={{ color: '#6B7280', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p><p style={{ color: s.color, fontSize: 28, fontWeight: 800, margin: 0 }}>{loading ? '—' : s.value}</p></div>))}</div>
      <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ flex: 1 }}><h2 style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏅 Athletes</h2><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{athleteSports.map(([sport, count]) => (<div key={sport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${SC[sport]}15`, border: `1px solid ${SC[sport]}40`, borderRadius: 8, padding: '6px 12px' }}><span>{SE[sport]}</span><span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{sport}</span><span style={{ color: SC[sport], fontSize: 12, fontWeight: 700 }}>{String(count)}</span></div>))}{athleteSports.length === 0 && !loading && <span style={{ color: '#475569', fontSize: 12 }}>None yet</span>}</div></div>
          <div style={{ width: 1, background: '#1F2937' }} />
          <div style={{ flex: 1 }}><h2 style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏟️ Clubs</h2><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{clubSports.map(([sport, count]) => (<div key={sport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${SC[sport]}15`, border: `1px solid ${SC[sport]}40`, borderRadius: 8, padding: '6px 12px' }}><span>{SE[sport]}</span><span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{sport}</span><span style={{ color: SC[sport], fontSize: 12, fontWeight: 700 }}>{String(count)}</span></div>))}{clubSports.length === 0 && !loading && <span style={{ color: '#475569', fontSize: 12 }}>None yet</span>}</div></div>
        </div>
      </div>
      <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1F2937' }}><h2 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Signups</h2></div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid #1F2937' }}>{[nameLabel,'Sport','Email','Plan','Onboarding','Setup','Signed Up','Logins','AI Calls'].map(c => (<th key={c} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c}</th>))}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>No {isClubView ? 'clubs' : 'athletes'} yet</td></tr>
            : filtered.slice(0, 20).map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #0d1117' }} onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)' }} onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
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

// ━━━ ONBOARDING CENTRE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function OnboardingCentre() {
  const [players, setPlayers] = useState<FoundingPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FoundingPlayer | null>(null)
  const [filter, setFilter] = useState<'all'|'pending'|'ready'|'live'>('all')
  const [sportFilter, setSportFilter] = useState('all')

  useEffect(() => {
    fetch('/api/sports-admin/users', { headers: { 'x-admin-token': getToken() } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => { setPlayers((d.users || []).filter((u: any) => u.plan === 'founding').sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = players.filter(p => {
    if (filter !== 'all' && getStatus(p) !== filter) return false
    if (sportFilter !== 'all' && p.sport !== sportFilter) return false
    return true
  })

  const pending = players.filter(p => getStatus(p) === 'pending').length
  const ready = players.filter(p => getStatus(p) === 'ready').length
  const live = players.filter(p => getStatus(p) === 'live').length
  const topSport = players.length > 0 ? Object.entries(players.reduce((a, p) => { a[p.sport] = (a[p.sport] || 0) + 1; return a }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0] || '—' : '—'

  const handleSendPortalLink = async (p: FoundingPlayer) => {
    if (!p.email || !p.portal_slug) return
    const res = await fetch('/api/sports-admin/send-portal-ready', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() }, body: JSON.stringify({ id: p.id, email: p.email, display_name: p.display_name, sport: p.sport, portal_slug: p.portal_slug }) })
    if (res.ok) setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, setup_complete: true } : x))
  }

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div><h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>Founding Members</h2><p style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>{players.length} total</p></div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {(['all','pending','ready','live'] as const).map(f => (<button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f ? '#6C3FC5' : '#1F2937', color: filter === f ? '#fff' : '#94a3b8', textTransform: 'capitalize' }}>{f}</button>))}
            <select value={sportFilter} onChange={e => setSportFilter(e.target.value)} style={{ marginLeft: 8, padding: '5px 10px', borderRadius: 6, fontSize: 11, background: '#1F2937', border: 'none', color: '#94a3b8' }}>
              <option value="all">All Sports</option>
              {['darts','golf','tennis','boxing'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[{ label: 'Total', value: players.length, color: '#6C3FC5' }, { label: 'Pending', value: pending, color: '#f59e0b' }, { label: 'Portal Live', value: live, color: '#22c55e' }, { label: 'Top Sport', value: topSport, color: '#0ea5e9' }].map(s => (
            <div key={s.label} style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, padding: 14 }}>
              <p style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>{loading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#0d1117', border: '1px solid #1F2937', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #1F2937' }}>{['Player','Sport','Slug','Features','Setup','Status','Actions'].map(c => (<th key={c} style={{ padding: '10px 14px', textAlign: 'left', color: '#6B7280', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c}</th>))}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>No members match</td></tr>
              : filtered.map(p => {
                const status = getStatus(p)
                const accent = getAccent(p.sport)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(31,41,55,0.5)', background: selected?.id === p.id ? 'rgba(108,63,197,0.06)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: 12, fontWeight: 700 }}>{(p.display_name || '?')[0].toUpperCase()}</div>}
                        <div><div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{p.display_name || '—'}</div>{p.nickname && <div style={{ color: '#6B7280', fontSize: 11, fontStyle: 'italic' }}>&quot;{p.nickname}&quot;</div>}<div style={{ color: '#4B5563', fontSize: 10 }}>{new Date(p.created_at).toLocaleDateString('en-GB')}</div></div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}><span style={{ background: accent + '22', border: `1px solid ${accent}`, color: accent, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{p.sport}</span></td>
                    <td style={{ padding: '10px 14px' }}><span style={{ color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace' }}>{p.portal_slug || '—'}</span>{p.slug_confirmed && <span style={{ color: '#22c55e', marginLeft: 4, fontSize: 10 }}>✓</span>}</td>
                    <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: 12 }}>{p.enabled_features?.length || 0} features</td>
                    <td style={{ padding: '10px 14px' }}>{p.setup_type === 'lumio' ? <span style={{ background: '#22c55e22', color: '#22c55e', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>We set up</span> : p.setup_type === 'self' ? <span style={{ background: '#3b82f622', color: '#3b82f6', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>Self setup</span> : <span style={{ color: '#6B7280', fontSize: 11 }}>—</span>}</td>
                    <td style={{ padding: '10px 14px' }}>{status === 'live' ? <span style={{ background: '#22c55e22', color: '#22c55e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>Live ✓</span> : status === 'ready' ? <span style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>Ready to send</span> : <span style={{ background: '#37415122', color: '#6B7280', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>Pending</span>}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSelected(p)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid #374151', background: 'none', color: '#9CA3AF' }}>Configure →</button>
                        {status === 'ready' && <button onClick={() => handleSendPortalLink(p)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#22c55e', color: '#000' }}>Send link →</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Panel */}
      {selected && <ConfigurePanel player={selected} onClose={() => setSelected(null)} onUpdate={(updated) => { setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p)); setSelected(updated) }} onSendLink={handleSendPortalLink} />}
    </div>
  )
}

// ━━━ CONFIGURE PANEL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ConfigurePanel({ player, onClose, onUpdate, onSendLink }: { player: FoundingPlayer; onClose: () => void; onUpdate: (p: FoundingPlayer) => void; onSendLink: (p: FoundingPlayer) => void }) {
  const [edits, setEdits] = useState<Partial<FoundingPlayer>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [sendingLink, setSendingLink] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setEdits({}); setMsg('') }, [player.id])

  const val = (field: keyof FoundingPlayer) => (edits[field] !== undefined ? edits[field] : player[field]) as string || ''
  const set = (field: string, value: string) => setEdits(prev => ({ ...prev, [field]: value }))
  const accent = getAccent(player.sport)
  const status = getStatus(player)

  const compressAndSet = (file: File, field: 'avatar_url' | 'brand_logo_url') => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = 400; c.height = 400
        c.getContext('2d')!.drawImage(img, 0, 0, 400, 400)
        const dataUrl = c.toDataURL('image/jpeg', 0.7)
        setEdits(prev => ({ ...prev, [field]: dataUrl }))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (Object.keys(edits).length === 0) { setMsg('No changes'); return }
    setSaving(true)
    const res = await fetch('/api/sports-admin/update-player', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() }, body: JSON.stringify({ id: player.id, updates: edits }) })
    if (res.ok) { const updated = { ...player, ...edits } as FoundingPlayer; onUpdate(updated); setMsg('Saved ✓'); setEdits({}); setTimeout(() => setMsg(''), 3000) }
    else setMsg('Error saving — try again')
    setSaving(false)
  }

  const handleSendLink = async () => {
    setSendingLink(true)
    await onSendLink({ ...player, ...edits } as FoundingPlayer)
    setSendingLink(false)
  }

  const InputRow = ({ label, field, mono }: { label: string; field: string; mono?: boolean }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>{label}</label>
      <input value={val(field as keyof FoundingPlayer)} onChange={e => set(field, e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: '#111318', border: '1px solid #374151', color: '#fff', fontSize: 13, fontFamily: mono ? 'monospace' : 'inherit', boxSizing: 'border-box' }} />
    </div>
  )

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, height: '100vh', width: 480, background: '#0d1117', borderLeft: '1px solid #1F2937', zIndex: 50, overflowY: 'auto', padding: 28 }}>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', padding: 0 }}>← Back</button>
      <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginTop: 16, marginBottom: 4 }}>{player.display_name || 'Unnamed'}</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
        <span style={{ background: accent + '22', border: `1px solid ${accent}`, color: accent, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize' }}>{player.sport}</span>
        {status === 'live' ? <span style={{ background: '#22c55e22', color: '#22c55e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>Live ✓</span> : status === 'ready' ? <span style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>Ready</span> : <span style={{ background: '#37415122', color: '#6B7280', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>Pending</span>}
      </div>
      <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>{player.email || 'No email'}</p>

      {/* Profile */}
      <div style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Profile</div>
      <InputRow label="Display name" field="display_name" />
      <InputRow label="Nickname" field="nickname" />
      <InputRow label="Brand / club name" field="brand_name" />
      <InputRow label="Portal slug" field="portal_slug" mono />
      <p style={{ color: '#4B5563', fontSize: 11, marginTop: -8, marginBottom: 16 }}>lumiosports.com/{player.sport}/{val('portal_slug' as keyof FoundingPlayer) || '...'}</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Photo</label>
          {(edits.avatar_url || player.avatar_url) ? <img src={(edits.avatar_url || player.avatar_url)!} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }} onClick={() => photoRef.current?.click()} /> : <div onClick={() => photoRef.current?.click()} style={{ width: 48, height: 48, borderRadius: 8, background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', fontSize: 10, cursor: 'pointer' }}>Upload</div>}
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && compressAndSet(e.target.files[0], 'avatar_url')} />
        </div>
        <div>
          <label style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Logo</label>
          {(edits.brand_logo_url || player.brand_logo_url) ? <img src={(edits.brand_logo_url || player.brand_logo_url)!} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain', cursor: 'pointer', background: '#111318' }} onClick={() => logoRef.current?.click()} /> : <div onClick={() => logoRef.current?.click()} style={{ width: 48, height: 48, borderRadius: 8, background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', fontSize: 10, cursor: 'pointer' }}>Upload</div>}
          <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && compressAndSet(e.target.files[0], 'brand_logo_url')} />
        </div>
      </div>

      {/* Features */}
      <div style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Features</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
        {player.enabled_features && player.enabled_features.length > 0 ? player.enabled_features.map(f => (<span key={f} style={{ background: '#22c55e22', color: '#22c55e', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{f}</span>)) : <span style={{ color: '#4B5563', fontSize: 12 }}>No features enabled</span>}
      </div>
      <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 20 }}>{player.enabled_features?.length || 0} features enabled</p>

      {/* Setup status */}
      <div style={{ color: '#4B5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Setup status</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9CA3AF', fontSize: 13 }}><input type="checkbox" checked={!!(edits.onboarding_complete !== undefined ? edits.onboarding_complete : player.onboarding_complete)} onChange={e => setEdits(prev => ({ ...prev, onboarding_complete: e.target.checked }))} /> Onboarding complete</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9CA3AF', fontSize: 13 }}><input type="checkbox" checked={!!(edits.setup_complete !== undefined ? edits.setup_complete : player.setup_complete)} onChange={e => setEdits(prev => ({ ...prev, setup_complete: e.target.checked }))} /> Portal live / setup complete</label>
        <div style={{ color: '#6B7280', fontSize: 12 }}>Setup type: {player.setup_type || 'not set'}</div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#22c55e', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, marginBottom: 8 }}>{saving ? 'Saving...' : 'Save changes'}</button>
      {msg && <p style={{ color: msg.includes('Error') ? '#ef4444' : '#22c55e', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{msg}</p>}

      {/* Send portal link */}
      {player.onboarding_complete && player.portal_slug && player.email && (
        <button onClick={handleSendLink} disabled={sendingLink} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#f59e0b', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: sendingLink ? 0.6 : 1 }}>{sendingLink ? 'Sending...' : 'Send portal ready email →'}</button>
      )}
    </div>
  )
}
