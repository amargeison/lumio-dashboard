'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Trash2, Shield } from 'lucide-react'

export default function AdminSettingsPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : ''
  const myRole = typeof window !== 'undefined' ? localStorage.getItem('admin_role') || '' : ''
  const isSuperAdmin = myRole === 'super_admin'

  const [admins, setAdmins] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAdmins() }, [])

  async function loadAdmins() {
    setLoading(true)
    const res = await fetch('/api/admin/session', { headers: { 'x-admin-token': token } })
    // For now, fetch admin list via a direct Supabase query through a helper
    // We'll use the accounts endpoint pattern
    setLoading(false)
    // Note: we'd need an admin users list endpoint. For now show current admin.
    const me = await res.json()
    if (me) setAdmins([me])
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Admin Users */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Admin Users</p>
          <Shield size={14} style={{ color: '#F5A623' }} />
        </div>
        <div className="divide-y" style={{ borderColor: '#1F2937' }}>
          {admins.map(a => (
            <div key={a.id || a.email} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{a.name || a.email}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{a.email} · {a.role?.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>

        {isSuperAdmin && (
          <div className="p-5" style={{ borderTop: '1px solid #1F2937' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>Add admin user</p>
            <div className="flex gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name"
                className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email"
                className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }}>
                <option value="admin">Admin</option>
                <option value="support">Support</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
                <UserPlus size={12} /> Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Your Profile</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Name</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{typeof window !== 'undefined' ? localStorage.getItem('admin_name') : ''}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Email</span>
            <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{typeof window !== 'undefined' ? localStorage.getItem('admin_email') : ''}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#9CA3AF' }}>Role</span>
            <span className="text-sm font-medium capitalize" style={{ color: '#F5A623' }}>{myRole.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
