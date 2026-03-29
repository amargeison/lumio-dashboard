'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'

function StatusBadge({ active }: { active: boolean }) {
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: active ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: active ? '#22C55E' : '#F59E0B' }}>{active ? 'Active' : 'Trial'}</span>
}

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#0A0B10',
  border: '1px solid #374151',
  color: '#F9FAFB',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

export default function SchoolsListPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    name: '',
    type: 'primary',
    plan: 'starter',
    adminName: '',
    adminEmail: '',
    adminRole: 'headteacher',
  })

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : ''

  function fetchAccounts() {
    fetch(`/api/admin/accounts?type=schools&search=${search}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { accounts: [] })
      .then(d => { setAccounts(d.accounts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchAccounts() }, [search])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const res = await fetch('/api/admin/accounts?type=schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create school')
        return
      }
      setShowCreate(false)
      setForm({ name: '', type: 'primary', plan: 'starter', adminName: '', adminEmail: '', adminRole: 'headteacher' })
      fetchAccounts()
    } catch {
      setCreateError('Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Schools</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          >
            <Plus size={14} /> Add School
          </button>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <Search size={14} style={{ color: '#6B7280' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="text-sm bg-transparent outline-none" style={{ color: '#F9FAFB' }} />
          </div>
        </div>
      </div>

      {/* Create School Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full rounded-2xl p-6" style={{ maxWidth: 480, backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Add School</h2>
              <button onClick={() => { setShowCreate(false); setCreateError('') }} style={{ color: '#6B7280' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>School name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={INPUT_STYLE} placeholder="Oakridge Primary School" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>School type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={INPUT_STYLE}>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="all-through">All-through</option>
                    <option value="special">Special</option>
                    <option value="academy">Academy</option>
                    <option value="MAT">MAT</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Plan</label>
                  <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} style={INPUT_STYLE}>
                    <option value="trial">Trial</option>
                    <option value="starter">Starter</option>
                    <option value="school">School</option>
                    <option value="trust">Trust</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1F2937', paddingTop: 16 }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>ADMIN USER</p>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Admin name</label>
                <input value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} style={INPUT_STYLE} placeholder="Jane Smith" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Admin email *</label>
                  <input type="email" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} required style={INPUT_STYLE} placeholder="head@school.sch.uk" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>Role</label>
                  <select value={form.adminRole} onChange={e => setForm(f => ({ ...f, adminRole: e.target.value }))} style={INPUT_STYLE}>
                    <option value="headteacher">Headteacher</option>
                    <option value="deputy">Deputy Head</option>
                    <option value="senco">SENCO</option>
                    <option value="business_manager">Business Manager</option>
                    <option value="office">Office</option>
                    <option value="teacher">Teacher</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>

              {createError && (
                <p className="text-xs" style={{ color: '#EF4444' }}>{createError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setCreateError('') }} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: '#9CA3AF' }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-5 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Creating…' : 'Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid #1F2937' }}>
            {['School Name', 'Slug', 'Plan', 'Status', 'Type', 'Created'].map(c => (
              <th key={c} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{c}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>Loading...</td></tr>
            : accounts.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>No schools found</td></tr>
            : accounts.map(a => (
              <tr key={a.id} className="cursor-pointer hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }}
                onClick={() => window.location.href = `/admin/schools/${a.slug}`}>
                <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{a.name}</td>
                <td className="px-5 py-3 font-mono text-xs" style={{ color: '#6B7280' }}>{a.slug}</td>
                <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{a.plan}</td>
                <td className="px-5 py-3"><StatusBadge active={a.active} /></td>
                <td className="px-5 py-3 capitalize" style={{ color: '#6B7280' }}>{a.workspace_type}</td>
                <td className="px-5 py-3" style={{ color: '#6B7280' }}>{new Date(a.created_at).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
