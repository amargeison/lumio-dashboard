'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, GraduationCap, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react'
import RagBadge from '@/components/admin/RagBadge'
import { calculateRag } from '@/lib/rag-score'

type Tab = 'business' | 'schools'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{value}</p>
    </div>
  )
}

function HealthBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444'
  const bg = score >= 80 ? 'rgba(34,197,94,0.1)' : score >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, color }}>{score}%</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    trial: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
    suspended: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
  }
  const s = map[status] || map.trial
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.color }}>{status}</span>
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('business')
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem('admin_session_token') || ''
    fetch(`/api/admin/accounts?type=${tab === 'schools' ? 'schools' : 'business'}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { accounts: [] })
      .then(d => { setAccounts(d.accounts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  const active = accounts.filter(a => (a.status === 'active') || (a.active === true && a.workspace_type === 'live')).length
  const trial = accounts.filter(a => (a.status !== 'active' && a.status !== 'suspended') || (a.workspace_type === 'trial')).length
  const suspended = accounts.filter(a => a.status === 'suspended' || a.active === false).length

  function getHealth(a: any): number {
    let score = 0
    if (a.onboarding_complete || a.onboarded) score += 40
    if (a.created_at && (Date.now() - new Date(a.created_at).getTime()) < 14 * 86400000) score += 30
    if (a.status === 'active' || a.active) score += 30
    return Math.min(score, 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          <button onClick={() => setTab('business')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            style={{ backgroundColor: tab === 'business' ? '#F5A623' : '#111318', color: tab === 'business' ? '#0A0B10' : '#6B7280' }}>
            <Building2 size={13} /> Businesses
          </button>
          <button onClick={() => setTab('schools')} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            style={{ backgroundColor: tab === 'schools' ? '#F5A623' : '#111318', color: tab === 'schools' ? '#0A0B10' : '#6B7280' }}>
            <GraduationCap size={13} /> Schools
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard label="Total Accounts" value={accounts.length} icon={Users} color="#6C3FC5" />
        <StatCard label="Active" value={active} icon={TrendingUp} color="#22C55E" />
        <StatCard label="Trial" value={trial} icon={Clock} color="#F59E0B" />
        <StatCard label="Suspended" value={suspended} icon={AlertTriangle} color="#EF4444" />
        <StatCard label="MRR" value={`£${(active * 49).toLocaleString()}`} icon={TrendingUp} color="#0D9488" />
        <StatCard label="New This Month" value={accounts.filter(a => new Date(a.created_at) > new Date(Date.now() - 30 * 86400000)).length} icon={Users} color="#6C3FC5" />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Name', 'Plan', 'Status', 'Created', 'Health'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>Loading...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-xs" style={{ color: '#6B7280' }}>No accounts found</td></tr>
              ) : accounts.map(a => {
                const name = a.company_name || a.name || a.slug
                const plan = a.plan || 'trial'
                const status = a.status || (a.active ? 'active' : 'trial')
                const slug = a.slug
                const href = tab === 'schools' ? `/admin/schools/${slug}` : `/admin/businesses/${slug}`
                return (
                  <tr key={a.id} className="cursor-pointer transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid #1F2937' }}
                    onClick={() => window.location.href = href}>
                    <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{name}</td>
                    <td className="px-5 py-3 capitalize" style={{ color: '#9CA3AF' }}>{plan}</td>
                    <td className="px-5 py-3"><StatusBadge status={status} /></td>
                    <td className="px-5 py-3" style={{ color: '#6B7280' }}>{new Date(a.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-5 py-3"><RagBadge rag={calculateRag({ lastLogin: a.created_at, onboardingComplete: a.onboarding_complete || a.onboarded, integrationsCount: 0 })} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
