'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, Download, Search, Trash2, ExternalLink, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

interface Trial {
  id: string
  company_name?: string
  name?: string
  slug: string
  owner_email?: string
  email?: string
  created_at: string
  expires_at: string | null
  status?: string
  converted_at?: string | null
  business_id?: string | null
}

function statusLabel(t: Trial): { text: string; color: string; bg: string } {
  if (t.business_id || t.converted_at || t.status === 'converted') return { text: 'Converted', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' }
  if (t.expires_at && new Date(t.expires_at) < new Date()) return { text: 'Expired', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
  return { text: 'Active', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
}

function daysAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminTrialsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'business' | 'school'>('business')
  const [businessTrials, setBusinessTrials] = useState<Trial[]>([])
  const [schoolTrials, setSchoolTrials] = useState<Trial[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ active: 0, thisWeek: 0, converted: 0, rate: 0 })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : ''

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabase()
        const now = new Date().toISOString()
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

        // Business trials
        const { data: demos } = await supabase.from('demo_tenants').select('*').order('created_at', { ascending: false })
        const biz = (demos || []).map((d: any) => ({
          id: d.id, company_name: d.company_name, slug: d.slug,
          owner_email: d.owner_email, created_at: d.created_at,
          expires_at: d.expires_at, status: d.status,
          converted_at: d.converted_at, business_id: d.business_id,
        }))
        setBusinessTrials(biz)

        // School trials
        const { data: schools } = await supabase.from('schools').select('*').order('created_at', { ascending: false })
        const sch = (schools || []).map((s: any) => ({
          id: s.id, name: s.name, slug: s.slug,
          email: s.email, created_at: s.created_at,
          expires_at: s.trial_ends_at, status: s.active ? 'active' : 'expired',
        }))
        setSchoolTrials(sch)

        // Stats
        const allTrials = [...biz, ...sch]
        const active = allTrials.filter(t => {
          const s = statusLabel(t)
          return s.text === 'Active'
        }).length
        const thisWeek = allTrials.filter(t => t.created_at > weekAgo).length
        const converted = allTrials.filter(t => statusLabel(t).text === 'Converted').length
        const total = allTrials.length
        setStats({ active, thisWeek, converted, rate: total > 0 ? Math.round((converted / total) * 100) : 0 })
      } catch (e) {
        console.error('Failed to load trials:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleExtend(trial: Trial, type: 'business' | 'school') {
    const supabase = getSupabase()
    const newExpiry = new Date((trial.expires_at ? new Date(trial.expires_at) : new Date()).getTime() + 14 * 86400000).toISOString()
    if (type === 'business') {
      await supabase.from('demo_tenants').update({ expires_at: newExpiry }).eq('id', trial.id)
      setBusinessTrials(prev => prev.map(t => t.id === trial.id ? { ...t, expires_at: newExpiry } : t))
    } else {
      await supabase.from('schools').update({ trial_ends_at: newExpiry }).eq('id', trial.id)
      setSchoolTrials(prev => prev.map(t => t.id === trial.id ? { ...t, expires_at: newExpiry } : t))
    }
  }

  async function handleDelete(id: string, type: 'business' | 'school') {
    const supabase = getSupabase()
    if (type === 'business') {
      await supabase.from('demo_sessions').delete().eq('tenant_id', id)
      await supabase.from('demo_tenants').delete().eq('id', id)
      setBusinessTrials(prev => prev.filter(t => t.id !== id))
    } else {
      await supabase.from('school_users').delete().eq('school_id', id)
      await supabase.from('schools').delete().eq('id', id)
      setSchoolTrials(prev => prev.filter(t => t.id !== id))
    }
    setConfirmDelete(null)
  }

  const trials = tab === 'business' ? businessTrials : schoolTrials
  const filtered = search
    ? trials.filter(t => {
        const name = (t.company_name || t.name || '').toLowerCase()
        const email = (t.owner_email || t.email || '').toLowerCase()
        const slug = t.slug.toLowerCase()
        const q = search.toLowerCase()
        return name.includes(q) || email.includes(q) || slug.includes(q)
      })
    : trials

  const STAT_CARDS = [
    { label: 'Active Trials', value: stats.active, color: '#F59E0B' },
    { label: 'Started This Week', value: stats.thisWeek, color: '#22D3EE' },
    { label: 'Converted to Paid', value: stats.converted, color: '#22C55E' },
    { label: 'Conversion Rate', value: `${stats.rate}%`, color: '#8B5CF6' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: '#F5A623' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(245,166,35,0.15)' }}>
            <FlaskConical size={18} style={{ color: '#F5A623' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Trials</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>{stats.active} active · {stats.converted} converted</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['business', 'school'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: tab === t ? '#F5A623' : '#111318', color: tab === t ? '#0A0B10' : '#9CA3AF', border: tab === t ? 'none' : '1px solid #1F2937' }}>
              {t === 'business' ? 'Business Trials' : 'School Trials'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trials..."
            className="rounded-lg pl-9 pr-4 py-2 text-sm outline-none" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB', width: 240 }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{tab === 'business' ? 'Company' : 'School'}</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>Slug</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>Email</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>Created</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>Expires</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>Status</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const s = statusLabel(t)
              const name = t.company_name || t.name || t.slug
              const email = t.owner_email || t.email || '—'
              const impersonateUrl = tab === 'business' ? `/demo/${t.slug}` : `/demo/schools/${t.slug}`
              return (
                <tr key={t.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{name}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs" style={{ color: '#9CA3AF' }}>{t.slug}</span></td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{email}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{daysAgo(t.created_at)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{formatDate(t.expires_at)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.text}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => router.push(impersonateUrl)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" title="Impersonate" style={{ color: '#9CA3AF' }}>
                        <ExternalLink size={13} />
                      </button>
                      <button onClick={() => handleExtend(t, tab)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" title="Extend 14 days" style={{ color: '#F59E0B' }}>
                        <Clock size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete(t.id)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" title="Delete" style={{ color: '#EF4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: '#6B7280' }}>No trials found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', maxWidth: 380 }}>
            <Trash2 size={24} style={{ color: '#EF4444', margin: '0 auto 12px' }} />
            <p className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>Delete this trial?</p>
            <p className="text-xs mb-6" style={{ color: '#6B7280' }}>This will permanently remove the trial workspace and all associated data.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#9CA3AF', border: '1px solid #1F2937' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete, tab)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
