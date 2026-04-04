'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Plus } from 'lucide-react'

export default function AdminFootballPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : ''

  useEffect(() => {
    fetch('/api/admin/football', { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { clubs: [] })
      .then(d => { setClubs(d.clubs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const filtered = search ? clubs.filter(c => c.club_name?.toLowerCase().includes(search.toLowerCase()) || c.slug?.toLowerCase().includes(search.toLowerCase())) : clubs
  const active = clubs.filter(c => c.status === 'active').length
  const trial = clubs.filter(c => c.status === 'trial').length
  const mrr = clubs.reduce((s, c) => s + (c.status === 'active' ? (c.monthly_price || 5000) : 0), 0)

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: '#F5A623' }} /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Football Clubs</h1><p className="text-xs" style={{ color: '#6B7280' }}>{clubs.length} total · {active} active · {trial} trial</p></div>
        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs..." className="rounded-lg pl-9 pr-4 py-2 text-sm outline-none" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB', width: 240 }} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ l: 'Total Clubs', v: String(clubs.length), c: '#F5A623' }, { l: 'Active', v: String(active), c: '#22C55E' }, { l: 'Trial', v: String(trial), c: '#F59E0B' }, { l: 'MRR', v: `£${mrr.toLocaleString()}`, c: '#0D9488' }].map(s => (
          <div key={s.l} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{s.l}</p>
            <p className="text-2xl font-black" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead><tr style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
            {['Club', 'Tier', 'Plan', 'Status', 'Created', 'Health'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(c => (
            <tr key={c.id} className="cursor-pointer hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }} onClick={() => router.push(`/admin/football/${c.slug}`)}>
              <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{c.club_name}</td>
              <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{c.tier || 'Championship'}</td>
              <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{c.plan || 'pro-club'}</td>
              <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: c.status === 'active' ? '#22C55E' : '#F59E0B' }}>{c.status}</span></td>
              <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '—'}</td>
              <td className="px-4 py-3 text-xs font-bold" style={{ color: (c.health_score || 60) >= 70 ? '#22C55E' : (c.health_score || 60) >= 50 ? '#F59E0B' : '#EF4444' }}>{c.health_score || 60}/100</td>
            </tr>
          ))}{filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: '#6B7280' }}>No football clubs found</td></tr>}</tbody>
        </table>
      </div>
    </div>
  )
}
