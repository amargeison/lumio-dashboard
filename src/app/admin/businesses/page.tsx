'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const color = status === 'active' ? '#22C55E' : status === 'suspended' ? '#EF4444' : '#F59E0B'
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${color}18`, color }}>{status}</span>
}

export default function BusinessesPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token') || ''
    fetch(`/api/admin/accounts?type=business&search=${search}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { accounts: [] })
      .then(d => { setAccounts(d.accounts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Businesses</h1>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <Search size={14} style={{ color: '#6B7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="text-sm bg-transparent outline-none" style={{ color: '#F9FAFB' }} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid #1F2937' }}>
            {['Company', 'Slug', 'Plan', 'Status', 'Owner', 'Created'].map(c => (
              <th key={c} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{c}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>Loading...</td></tr>
            : accounts.map(a => (
              <tr key={a.id} className="cursor-pointer hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }}
                onClick={() => window.location.href = `/admin/businesses/${a.slug}`}>
                <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{a.company_name}</td>
                <td className="px-5 py-3 font-mono text-xs" style={{ color: '#6B7280' }}>{a.slug}</td>
                <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{a.plan}</td>
                <td className="px-5 py-3"><StatusBadge status={a.status || 'active'} /></td>
                <td className="px-5 py-3" style={{ color: '#6B7280' }}>{a.owner_email}</td>
                <td className="px-5 py-3" style={{ color: '#6B7280' }}>{new Date(a.created_at).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
