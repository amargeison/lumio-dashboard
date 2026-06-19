'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Trash2, Save, Send, CheckCircle2, XCircle, Pause, Play } from 'lucide-react'
import SportsIntelligencePanel from '@/components/admin/SportsIntelligencePanel'
import { calculateRag } from '@/lib/rag-score'
import { portalUrlFor, slugify, impersonateUrl } from '@/lib/sports-admin/portal-url'

const SE: Record<string, string> = { tennis:'🎾', coach:'🎾', golf:'⛳', darts:'🎯', boxing:'🥊', cricket:'🏏', rugby:'🏉', football:'⚽', nonleague:'⚽', grassroots:'⚽', womens:'⚽' }
const SLABEL: Record<string, string> = { coach: 'Tennis Coach' }
// Features shown in the Integration Status grid (parity with CMS integrations).
const FEATURE_LIST = ['gps', 'video', 'audio', 'racket']
const FEATURE_LABEL: Record<string, string> = { gps: 'Lumio GPS', video: 'Lumio Vision', audio: 'Voice Notes', racket: 'Racket Progression' }

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('sports_admin_token') || '' : '' }
const portalUrl = portalUrlFor

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    live: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    active: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    suspended: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  }
  const s = map[status] || map.pending
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>
}

export default function SportsAccountDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const token = getToken()
  const [account, setAccount] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')

  useEffect(() => {
    fetch('/api/sports-admin/users', { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => { const a = (d.users || []).find((x: any) => x.id === id) || null; setAccount(a); if (a) { setNotes(a.admin_notes || ''); setSlug(a.portal_slug || slugify(a.brand_name) || '') } })
      .catch(() => {})
    fetch(`/api/sports-admin/activity/${id}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { activity: [] })
      .then(d => setActivity(d.activity || []))
      .catch(() => {})
  }, [id, token])

  async function patch(updates: any) {
    await fetch('/api/sports-admin/update-player', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ id, updates }) })
  }
  async function saveNotes() {
    setSaving(true); await patch({ admin_notes: notes }); setSaving(false); setMsg('Notes saved ✓'); setTimeout(() => setMsg(''), 3000)
  }
  async function saveSlug() {
    const clean = slugify(slug)
    setSlug(clean); await patch({ portal_slug: clean }); setAccount((a: any) => ({ ...a, portal_slug: clean })); setMsg('Portal slug saved ✓'); setTimeout(() => setMsg(''), 3000)
  }
  async function markReady() {
    const res = await fetch('/api/sports-admin/complete-setup', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ userId: id }) })
    if (res.ok) { setAccount((a: any) => ({ ...a, setup_complete: true })); setMsg('Marked ready ✓'); setTimeout(() => setMsg(''), 3000) }
  }
  async function sendLink() {
    const res = await fetch('/api/sports-admin/send-portal-ready', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ id, email: account.email, display_name: account.display_name, sport: account.sport, portal_slug: account.portal_slug }) })
    if (res.ok) { setMsg('Portal-ready email sent ✓'); setTimeout(() => setMsg(''), 3000) }
  }
  async function toggleSuspend() {
    const next = account.status === 'suspended' ? 'active' : 'suspended'
    await patch({ status: next }); setAccount((a: any) => ({ ...a, status: next }))
  }
  async function deleteAccount() {
    const name = (account?.display_name || account?.brand_name || '').trim()
    if (!name || confirmDelete.trim() !== name) return
    const res = await fetch('/api/sports-admin/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ userId: id }) })
    if (res.ok) router.replace('/sports-admin/users'); else alert('Delete failed')
  }

  if (!account) return <div className="py-12 text-center text-sm" style={{ color: '#6B7280' }}>Loading...</div>

  const status = account.status === 'suspended' ? 'suspended' : account.setup_complete ? 'live' : account.onboarding_complete ? 'active' : 'pending'
  const features: string[] = account.enabled_features || []
  const deleteName = (account.display_name || account.brand_name || '').trim()

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.push('/sports-admin/users')} className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
        <ArrowLeft size={12} /> Back to Sports
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{account.brand_name || account.display_name || 'Unnamed'}</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{SE[account.sport]} {SLABEL[account.sport] || account.sport} · {account.portal_slug ? `/${account.portal_slug} · ` : ''}{account.plan} plan · Created {new Date(account.created_at).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={status} />
          <button onClick={() => window.open(impersonateUrl(id, token), '_blank')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
            <Eye size={12} /> Impersonate
          </button>
        </div>
      </div>

      {/* Customer Intelligence (5 tabs) */}
      <SportsIntelligencePanel
        id={id}
        account={account}
        activity={activity}
        rag={calculateRag({ lastLogin: account.last_login || account.created_at, onboardingComplete: account.onboarding_complete, integrationsCount: features.length })}
      />

      {/* Account Info */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Account Info</p></div>
        <div className="grid grid-cols-2 gap-0">
          {[
            ['Owner email', account.email],
            ['Club / brand', account.brand_name],
            ['Slug', account.portal_slug],
            ['Sport', `${SE[account.sport] || ''} ${SLABEL[account.sport] || account.sport}`],
            ['Plan', account.plan],
            ['Onboarding', account.onboarding_complete ? 'Complete' : 'Incomplete'],
            ['Setup', account.setup_complete ? 'Live' : account.setup_type || 'Not set'],
            ['Status', status],
          ].map(([label, value]) => (
            <div key={label as string} className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
              <p className="text-sm font-medium capitalize" style={{ color: '#F9FAFB' }}>{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Integration / Features Status */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Integration Status</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
          {FEATURE_LIST.map(name => {
            const on = features.includes(name)
            return (
              <div key={name} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
                {on ? <CheckCircle2 size={14} style={{ color: '#22C55E' }} /> : <XCircle size={14} style={{ color: '#4B5563' }} />}
                <span className="text-xs" style={{ color: on ? '#F9FAFB' : '#6B7280' }}>{FEATURE_LABEL[name]}</span>
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
            {activity.slice(0, 20).map((log, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5">
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
          <div className="flex items-center gap-3">
            <button onClick={saveNotes} disabled={saving} className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
              <Save size={12} /> {saving ? 'Saving...' : 'Save Notes'}
            </button>
            {msg && <span className="text-xs" style={{ color: '#22C55E' }}>{msg}</span>}
          </div>
        </div>
      </div>

      {/* Portal link */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Portal link</p></div>
        <div className="p-5 space-y-3">
          <p className="text-xs" style={{ color: '#6B7280' }}>The slug that resolves this account&apos;s live portal. Set it to match the URL the {account.sport === 'coach' ? 'coach' : 'account'} uses, then Impersonate opens the real portal instead of the demo.</p>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs font-mono" style={{ color: '#6B7280' }}>{account.sport === 'coach' ? '/tennis/coach/' : account.sport === 'womens' ? '/womens/' : `/${account.sport}/`}</span>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="club-slug"
              className="flex-1 min-w-[160px] rounded-lg px-3 py-2 text-sm font-mono" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
            <button onClick={saveSlug} className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}><Save size={12} /> Save slug</button>
          </div>
          <p className="text-xs" style={{ color: '#6B7280' }}>Opens: <span className="font-mono" style={{ color: '#9CA3AF' }}>{portalUrl({ ...account, portal_slug: slugify(slug) })}</span></p>
        </div>
      </div>

      {/* Onboarding actions */}
      {(!account.setup_complete || (account.onboarding_complete && account.portal_slug)) && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Onboarding</p></div>
          <div className="p-5 flex flex-wrap gap-2 items-center">
            {!account.setup_complete && account.setup_type === 'lumio' && (
              <button onClick={markReady} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}><CheckCircle2 size={13} /> Mark ready</button>
            )}
            {account.onboarding_complete && account.portal_slug && (
              <button onClick={sendLink} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}><Send size={13} /> Send portal-ready email</button>
            )}
            <a href="/sports-admin/onboarding" className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>Open Onboarding →</a>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.2)' }}><p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Danger Zone</p></div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{account.status === 'suspended' ? 'Unsuspend account' : 'Suspend account'}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{account.status === 'suspended' ? 'Re-activate this account' : 'Temporarily disable this account'}</p>
            </div>
            <button onClick={toggleSuspend} className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: account.status === 'suspended' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: account.status === 'suspended' ? '#22C55E' : '#F59E0B', border: `1px solid ${account.status === 'suspended' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
              {account.status === 'suspended' ? <><Play size={12} /> Unsuspend</> : <><Pause size={12} /> Suspend</>}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1F2937', paddingTop: 16 }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#EF4444' }}>Delete account permanently</p>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Type &quot;{deleteName}&quot; to confirm</p>
            <div className="flex gap-2">
              <input value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder={deleteName}
                className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#0A0B10', border: '1px solid #374151', color: '#F9FAFB' }} />
              <button onClick={deleteAccount} disabled={confirmDelete.trim() !== deleteName}
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
