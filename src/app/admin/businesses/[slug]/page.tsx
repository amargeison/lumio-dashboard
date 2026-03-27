'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Eye, Pause, Trash2, Play, Save,
  CheckCircle2, XCircle, AlertTriangle, Sparkles,
} from 'lucide-react'
import RagBadge from '@/components/admin/RagBadge'
import CustomerIntelligencePanel from '@/components/admin/CustomerIntelligencePanel'
import { calculateRag } from '@/lib/rag-score'

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    suspended: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
    trial: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  }
  const s = map[status] || map.trial
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>
}

export default function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : ''
  const [account, setAccount] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/accounts/${slug}?type=business`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.account) { setAccount(d.account); setNotes(d.account.admin_notes || '') }
        if (d?.activity) setActivity(d.activity)
      })
      .catch(() => {})
  }, [slug, token])

  async function saveNotes() {
    setSaving(true)
    await fetch(`/api/admin/accounts/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ admin_notes: notes }) })
    setSaving(false)
  }

  async function suspendAccount() {
    await fetch(`/api/admin/accounts/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ status: 'suspended' }) })
    setAccount((a: any) => a ? { ...a, status: 'suspended' } : a)
  }

  async function unsuspendAccount() {
    await fetch(`/api/admin/accounts/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ status: 'active' }) })
    setAccount((a: any) => a ? { ...a, status: 'active' } : a)
  }

  async function deleteAccount() {
    const name = (account?.company_name || '').trim()
    if (!name || confirmDelete.trim() !== name) return
    const res = await fetch(`/api/admin/accounts/${slug}?type=business`, { method: 'DELETE', headers: { 'x-admin-token': token } })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Delete failed' }))
      alert(`Delete failed: ${err.error || 'Unknown error'}`)
      return
    }
    router.replace('/admin/businesses')
  }

  function impersonate() {
    localStorage.setItem('lumio_impersonating', JSON.stringify({ slug, type: 'business', adminEmail: localStorage.getItem('admin_email') }))
    window.open(`/${slug}`, '_blank')
  }

  if (!account) return <div className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>Loading...</div>

  const integrations = account.integrations || {}
  const INTEG_LIST = ['Email', 'Slack', 'Teams', 'Xero', 'QuickBooks', 'Google Calendar', 'Outlook Calendar', 'HR System']

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.push('/admin/businesses')} className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
        <ArrowLeft size={12} /> Back to Businesses
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{account.company_name}</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>/{account.slug} · {account.plan} plan · Created {new Date(account.created_at).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={account.status || 'active'} />
          <button onClick={impersonate} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
            <Eye size={12} /> Impersonate
          </button>
        </div>
      </div>

      {/* Customer Intelligence */}
      <CustomerIntelligencePanel
        slug={slug}
        type="business"
        account={account}
        activity={activity}
        rag={calculateRag({ lastLogin: account.created_at, onboardingComplete: account.onboarding_complete, integrationsCount: 0 })}
      />

      {/* Account Info */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Account Info</p></div>
        <div className="grid grid-cols-2 gap-0">
          {[
            ['Owner email', account.owner_email],
            ['Company', account.company_name],
            ['Slug', account.slug],
            ['Plan', account.plan],
            ['Billing', account.billing_type || 'monthly'],
            ['Onboarding', account.onboarding_complete ? 'Complete' : 'Incomplete'],
            ['Demo data', account.demo_data_active ? 'Active' : 'Off'],
            ['Status', account.status || 'active'],
          ].map(([label, value]) => (
            <div key={label as string} className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
              <p className="text-sm font-medium capitalize" style={{ color: '#F9FAFB' }}>{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Integration Status</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
          {INTEG_LIST.map(name => {
            const connected = !!integrations[name.toLowerCase().replace(/\s/g, '_')]
            return (
              <div key={name} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                {connected ? <CheckCircle2 size={14} style={{ color: '#22C55E' }} /> : <XCircle size={14} style={{ color: '#4B5563' }} />}
                <span className="text-xs" style={{ color: connected ? '#F9FAFB' : '#6B7280' }}>{name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity Log */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Activity Log</p></div>
        {activity.length === 0 ? (
          <p className="px-5 py-6 text-xs text-center" style={{ color: '#6B7280' }}>No activity recorded yet</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1F2937' }}>
            {activity.slice(0, 20).map(log => (
              <div key={log.id} className="flex items-center justify-between px-5 py-2.5">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{log.action}</p>
                  {log.department && <p className="text-xs" style={{ color: '#6B7280' }}>{log.department}</p>}
                </div>
                <p className="text-xs" style={{ color: '#4B5563' }}>{new Date(log.created_at).toLocaleString('en-GB')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Notes */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Admin Notes</p></div>
        <div className="p-5 space-y-3">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }}
            placeholder="Add internal notes about this account..." />
          <button onClick={saveNotes} disabled={saving} className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
            <Save size={12} /> {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Danger Zone</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{account.status === 'suspended' ? 'Unsuspend account' : 'Suspend account'}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{account.status === 'suspended' ? 'Re-activate this account' : 'Temporarily disable this account'}</p>
            </div>
            <button onClick={account.status === 'suspended' ? unsuspendAccount : suspendAccount}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: account.status === 'suspended' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: account.status === 'suspended' ? '#22C55E' : '#F59E0B', border: `1px solid ${account.status === 'suspended' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
              {account.status === 'suspended' ? <><Play size={12} /> Unsuspend</> : <><Pause size={12} /> Suspend</>}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1F2937', paddingTop: 16 }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#EF4444' }}>Delete account permanently</p>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Type &quot;{(account.company_name || '').trim()}&quot; to confirm</p>
            <div className="flex gap-2">
              <input value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder={(account.company_name || '').trim()}
                className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
              <button onClick={deleteAccount} disabled={confirmDelete.trim() !== (account.company_name || '').trim()}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-30"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
