'use client'

import { useState, useEffect } from 'react'

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token') || ''
    fetch(`/api/activity/log?page=${page}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(d => { setLogs(d.logs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Activity Log</h1>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid #1F2937' }}>
            {['Timestamp', 'Account', 'Type', 'Action', 'Department', 'User'].map(c => (
              <th key={c} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{c}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>Loading...</td></tr>
            : logs.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>No activity yet</td></tr>
            : logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #1F2937' }}>
                <td className="px-5 py-2.5 text-xs" style={{ color: '#6B7280' }}>{new Date(log.created_at).toLocaleString('en-GB')}</td>
                <td className="px-5 py-2.5 font-medium text-xs" style={{ color: '#F9FAFB' }}>{log.account_slug}</td>
                <td className="px-5 py-2.5 text-xs capitalize" style={{ color: '#9CA3AF' }}>{log.account_type}</td>
                <td className="px-5 py-2.5 text-xs" style={{ color: '#F5A623' }}>{log.action}</td>
                <td className="px-5 py-2.5 text-xs" style={{ color: '#9CA3AF' }}>{log.department || '—'}</td>
                <td className="px-5 py-2.5 text-xs" style={{ color: '#6B7280' }}>{log.user_email || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>Previous</button>
        <span className="text-xs" style={{ color: '#6B7280' }}>Page {page + 1}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 50} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>Next</button>
      </div>
    </div>
  )
}
