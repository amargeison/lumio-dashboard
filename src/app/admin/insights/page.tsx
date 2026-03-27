'use client'

import { useState, useEffect } from 'react'
import { Building2, GraduationCap, Sparkles, TrendingUp, Users, AlertTriangle } from 'lucide-react'
import RagBadge from '@/components/admin/RagBadge'
import { calculateRag, ragColor, ragBg, type RagBreakdown } from '@/lib/rag-score'

type Tab = 'business' | 'schools' | 'demos'

export default function InsightsPage() {
  const [tab, setTab] = useState<Tab>('business')
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem('admin_session_token') || ''
    const apiType = tab === 'demos' ? 'business' : tab === 'schools' ? 'schools' : 'business'
    fetch(`/api/admin/accounts?type=${apiType}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { accounts: [] })
      .then(d => { setAccounts(d.accounts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  // Calculate RAG for each account
  const withRag = accounts.map(a => ({
    ...a,
    rag: calculateRag({ lastLogin: a.created_at, onboardingComplete: a.onboarding_complete || a.onboarded, integrationsCount: 0 }),
  }))

  const green = withRag.filter(a => a.rag.band === 'green').length
  const amber = withRag.filter(a => a.rag.band === 'amber').length
  const red = withRag.filter(a => a.rag.band === 'red').length
  const avgScore = withRag.length ? Math.round(withRag.reduce((s, a) => s + a.rag.total, 0) / withRag.length) : 0
  const total = withRag.length

  const atRisk = withRag.filter(a => a.rag.band === 'red' || a.rag.band === 'amber').sort((a, b) => a.rag.total - b.rag.total)
  const leaderboard = [...withRag].sort((a, b) => b.rag.total - a.rag.total).slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Insights</h1>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Customer intelligence across all accounts</p>
        </div>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1F2937' }}>
          {[
            { id: 'business' as Tab, label: 'Businesses', icon: Building2 },
            { id: 'schools' as Tab, label: 'Schools', icon: GraduationCap },
            { id: 'demos' as Tab, label: 'Demos', icon: Sparkles },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
              style={{ backgroundColor: tab === t.id ? '#F5A623' : '#111318', color: tab === t.id ? '#0A0B10' : '#6B7280' }}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-xs py-12 text-center" style={{ color: '#6B7280' }}>Loading...</p> : (
        <>
          {/* Overview metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Accounts', value: total, color: '#6C3FC5' },
              { label: 'Avg RAG Score', value: `${avgScore}%`, color: avgScore >= 70 ? '#22C55E' : avgScore >= 40 ? '#F59E0B' : '#EF4444' },
              { label: 'Green', value: green, color: '#22C55E' },
              { label: 'Amber', value: amber, color: '#F59E0B' },
              { label: 'Red', value: red, color: '#EF4444' },
              { label: 'Total MRR', value: `£${(withRag.filter(a => a.status === 'active' || a.active).length * 49).toLocaleString()}`, color: '#0D9488' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* RAG distribution bar */}
          <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <p className="text-xs font-bold mb-3" style={{ color: '#F9FAFB' }}>RAG Distribution</p>
            <div className="flex h-6 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
              {total > 0 && <>
                <div style={{ width: `${(green / total) * 100}%`, backgroundColor: '#22C55E' }} />
                <div style={{ width: `${(amber / total) * 100}%`, backgroundColor: '#F59E0B' }} />
                <div style={{ width: `${(red / total) * 100}%`, backgroundColor: '#EF4444' }} />
              </>}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs" style={{ color: '#22C55E' }}>🟢 {green} Green</span>
              <span className="text-xs" style={{ color: '#F59E0B' }}>🟡 {amber} Amber</span>
              <span className="text-xs" style={{ color: '#EF4444' }}>🔴 {red} Red</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Engagement leaderboard */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Engagement Leaderboard</p>
              </div>
              <div className="divide-y" style={{ borderColor: '#1F2937' }}>
                {leaderboard.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-white/[0.02]"
                    onClick={() => window.location.href = `/admin/${tab === 'schools' ? 'schools' : 'businesses'}/${a.slug}`}>
                    <span className="text-xs font-bold w-5" style={{ color: '#F5A623' }}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#F9FAFB' }}>{a.company_name || a.name}</p>
                    </div>
                    <RagBadge rag={a.rag} />
                  </div>
                ))}
              </div>
            </div>

            {/* At-risk accounts */}
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937' }}>
                <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>At-Risk Accounts</p>
              </div>
              {atRisk.length === 0 ? (
                <p className="px-5 py-6 text-xs text-center" style={{ color: '#6B7280' }}>No at-risk accounts</p>
              ) : (
                <div className="divide-y" style={{ borderColor: '#1F2937' }}>
                  {atRisk.slice(0, 10).map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-white/[0.02]"
                      onClick={() => window.location.href = `/admin/${tab === 'schools' ? 'schools' : 'businesses'}/${a.slug}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#F9FAFB' }}>{a.company_name || a.name}</p>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{a.slug}</p>
                      </div>
                      <RagBadge rag={a.rag} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
