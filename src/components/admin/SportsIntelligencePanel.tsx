'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, Sparkles, RefreshCw, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react'
import RagBadge from './RagBadge'
import { type RagBreakdown, ragColor } from '@/lib/rag-score'

interface Props {
  id: string
  account: any
  activity: any[]
  rag: RagBreakdown
}

type Tab = 'overview' | 'research' | 'usage' | 'sales' | 'insights'

const SE: Record<string, string> = { tennis:'🎾', coach:'🎾', golf:'⛳', darts:'🎯', boxing:'🥊', cricket:'🏏', rugby:'🏉', football:'⚽', nonleague:'⚽', grassroots:'⚽', womens:'⚽' }
const SLABEL: Record<string, string> = { coach: 'Tennis Coach' }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('sports_admin_token') || '' : '' }

export default function SportsIntelligencePanel({ id, account, activity, rag }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const token = getToken()
  const isActive = account.setup_complete || account.onboarding_complete

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Company Overview' },
    { id: 'research', label: 'Research & Background' },
    { id: 'usage', label: 'Usage & Behaviour' },
    { id: 'sales', label: isActive ? 'Account Health' : 'Sales Intelligence' },
    { id: 'insights', label: 'AI Insights' },
  ]

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid #1F2937' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all"
            style={{ borderBottomColor: tab === t.id ? '#F5A623' : 'transparent', color: tab === t.id ? '#F5A623' : '#6B7280', backgroundColor: tab === t.id ? 'rgba(245,166,35,0.05)' : 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'overview' && <OverviewTab account={account} rag={rag} />}
        {tab === 'research' && <ResearchTab id={id} token={token} />}
        {tab === 'usage' && <UsageTab activity={activity} />}
        {tab === 'sales' && <SalesTab account={account} rag={rag} activity={activity} />}
        {tab === 'insights' && <InsightsTab id={id} token={token} />}
      </div>
    </div>
  )
}

// ─── Tab 1: Overview ─────────────────────────────────────────────────────────

function OverviewTab({ account, rag }: { account: any; rag: RagBreakdown }) {
  const name = account.brand_name || account.display_name || '—'
  const email = account.email || '—'
  const domain = email.includes('@') ? email.split('@')[1] : '—'
  const age = account.created_at ? Math.floor((Date.now() - new Date(account.created_at).getTime()) / 86400000) : 0
  const status = account.setup_complete ? 'live' : account.onboarding_complete ? 'active' : 'pending'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Account Age', value: `${age} days` },
          { label: 'Plan', value: account.plan || 'trial' },
          { label: 'Logins', value: account.login_count ?? 0 },
          { label: 'AI Calls', value: account.ai_calls ?? 0 },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="text-sm font-bold capitalize" style={{ color: '#F9FAFB' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Sport', value: `${SE[account.sport] || ''} ${SLABEL[account.sport] || account.sport}` },
          { label: 'Club / brand', value: name },
          { label: 'Owner', value: account.display_name || '—' },
          { label: 'Email', value: email },
          { label: 'Status', value: status },
          { label: 'Onboarding', value: account.onboarding_complete ? 'Complete' : 'Incomplete' },
        ].map(f => (
          <div key={f.label} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>{f.label}</p>
            <p className="text-sm font-medium capitalize" style={{ color: '#F9FAFB' }}>{f.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: '#6B7280' }}>RAG Score:</span>
        <RagBadge rag={rag} />
      </div>
    </div>
  )
}

// ─── Tab 2: Research ─────────────────────────────────────────────────────────

function ResearchTab({ id, token }: { id: string; token: string }) {
  const [research, setResearch] = useState<any>(null)
  const [researchedAt, setResearchedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/sports-admin/research/${id}`, { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : { research: null })
      .then(d => { setResearch(d.research); setResearchedAt(d.researched_at); setFetching(false) })
      .catch(() => setFetching(false))
  }, [id, token])

  async function doResearch() {
    setLoading(true)
    const res = await fetch(`/api/sports-admin/research/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token } })
    if (res.ok) { const d = await res.json(); setResearch(d.research); setResearchedAt(d.researched_at) }
    setLoading(false)
  }

  if (fetching) return <p className="text-xs py-8 text-center" style={{ color: '#6B7280' }}>Loading...</p>

  if (!research) return (
    <div className="py-12 text-center">
      <Search size={32} style={{ color: '#F5A623', margin: '0 auto 12px' }} />
      <p className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>No research yet</p>
      <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Click below to run AI-powered research on this account</p>
      <button onClick={doResearch} disabled={loading} className="px-6 py-2.5 rounded-lg text-xs font-bold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>
        {loading ? <><Loader2 size={12} className="inline animate-spin mr-1" /> Researching...</> : 'Research This Account'}
      </button>
    </div>
  )

  const r = research
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: '#6B7280' }}>Last researched: {researchedAt ? new Date(researchedAt).toLocaleString('en-GB') : '—'}</p>
        <button onClick={doResearch} disabled={loading} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623' }}>
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Re-research
        </button>
      </div>

      {r.company_overview && (
        <div className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#F5A623' }}>Company Overview</p>
          <p className="text-sm mb-2" style={{ color: '#D1D5DB' }}>{r.company_overview.description || '—'}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(r.company_overview).filter(([k]) => k !== 'description').map(([k, v]) => (
              <div key={k}><span style={{ color: '#6B7280' }}>{k.replace(/_/g, ' ')}:</span> <span style={{ color: '#F9FAFB' }}>{String(v || '—')}</span></div>
            ))}
          </div>
        </div>
      )}

      {r.lumio_fit_score && (
        <div className="rounded-lg p-4 flex items-center gap-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <div className="text-3xl font-black" style={{ color: r.lumio_fit_score >= 7 ? '#22C55E' : r.lumio_fit_score >= 4 ? '#F59E0B' : '#EF4444' }}>{r.lumio_fit_score}/10</div>
          <div><p className="text-xs font-bold" style={{ color: '#F5A623' }}>Lumio Fit Score</p><p className="text-xs" style={{ color: '#6B7280' }}>How well suited for Lumio</p></div>
        </div>
      )}

      {r.key_people?.length > 0 && (
        <div className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#F5A623' }}>Key People</p>
          <div className="space-y-2">{r.key_people.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{(p.name || '?')[0]}</div>
              <div><p className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{p.name}</p><p className="text-xs" style={{ color: '#6B7280' }}>{p.role}</p></div>
            </div>
          ))}</div>
        </div>
      )}

      {r.sales_talking_points?.length > 0 && (
        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#F5A623' }}>Sales Talking Points</p>
          <ol className="space-y-1.5">{r.sales_talking_points.map((p: string, i: number) => (
            <li key={i} className="flex gap-2 text-xs"><span className="font-bold" style={{ color: '#F5A623' }}>{i + 1}.</span><span style={{ color: '#D1D5DB' }}>{p}</span></li>
          ))}</ol>
        </div>
      )}

      {r.risk_factors?.length > 0 && (
        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#EF4444' }}>Risk Factors</p>
          <ul className="space-y-1">{r.risk_factors.map((f: string, i: number) => (
            <li key={i} className="flex gap-2 text-xs"><AlertTriangle size={10} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} /><span style={{ color: '#FCA5A5' }}>{f}</span></li>
          ))}</ul>
        </div>
      )}

      {['competitors', 'products_and_services', 'tech_stack_hints', 'pain_points'].map(key => {
        const items = r[key]
        if (!items?.length) return null
        return (
          <div key={key} className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <p className="text-xs font-bold mb-2 capitalize" style={{ color: '#F5A623' }}>{key.replace(/_/g, ' ')}</p>
            <div className="flex flex-wrap gap-1.5">{items.map((item: any, i: number) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}>
                {typeof item === 'string' ? item : item.name || item.headline || JSON.stringify(item)}
              </span>
            ))}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab 3: Usage ────────────────────────────────────────────────────────────

function UsageTab({ activity }: { activity: any[] }) {
  const totalSessions = activity.filter(a => a.action === 'login').length
  const totalViews = activity.filter(a => a.action === 'page_view').length
  const lastActive = activity[0]?.created_at ? new Date(activity[0].created_at).toLocaleString('en-GB') : 'Never'

  const deptCounts: Record<string, number> = {}
  activity.filter(a => a.department).forEach(a => { deptCounts[a.department] = (deptCounts[a.department] || 0) + 1 })
  const deptSorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])
  const maxDept = deptSorted[0]?.[1] || 1

  const thisMonth = new Date().getMonth()
  const activeDays = new Set(activity.filter(a => new Date(a.created_at).getMonth() === thisMonth).map(a => new Date(a.created_at).toDateString())).size

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions', value: totalSessions },
          { label: 'Total Page Views', value: totalViews },
          { label: 'Active Days (Month)', value: activeDays },
          { label: 'Last Active', value: lastActive },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {deptSorted.length > 0 && (
        <div className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
          <p className="text-xs font-bold mb-3" style={{ color: '#F5A623' }}>Most Visited Areas</p>
          <div className="space-y-2">{deptSorted.slice(0, 8).map(([dept, count]) => (
            <div key={dept} className="flex items-center gap-3">
              <span className="text-xs w-24 truncate" style={{ color: '#9CA3AF' }}>{dept}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                <div className="h-full rounded-full" style={{ width: `${(count / maxDept) * 100}%`, backgroundColor: '#F5A623' }} />
              </div>
              <span className="text-xs w-8 text-right" style={{ color: '#F9FAFB' }}>{count}</span>
            </div>
          ))}</div>
        </div>
      )}

      <div className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}>
        <p className="text-xs font-bold mb-3" style={{ color: '#F5A623' }}>Activity Timeline</p>
        {activity.length === 0 ? <p className="text-xs text-center py-4" style={{ color: '#6B7280' }}>No activity yet</p> : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">{activity.slice(0, 20).map((log, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #1F2937' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623' }}>{log.action}</span>
                {log.department && <span className="text-xs" style={{ color: '#9CA3AF' }}>{log.department}</span>}
              </div>
              <span className="text-xs" style={{ color: '#4B5563' }}>{new Date(log.created_at).toLocaleString('en-GB')}</span>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  )
}

// ─── Tab 4: Account Health / Sales ───────────────────────────────────────────

function SalesTab({ account, rag, activity }: { account: any; rag: RagBreakdown; activity: any[] }) {
  const isActive = account.setup_complete || account.onboarding_complete
  const loginCount = activity.filter(a => a.action === 'login').length
  const deptCount = new Set(activity.filter(a => a.department).map(a => a.department)).size
  const featureCount = (account.enabled_features?.length) || new Set(activity.map(a => a.action)).size

  if (isActive) {
    const featureList: string[] = account.enabled_features || []
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}><p className="text-xs" style={{ color: '#6B7280' }}>Logins</p><p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{loginCount}</p></div>
          <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}><p className="text-xs" style={{ color: '#6B7280' }}>Features Enabled</p><p className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{featureList.length}</p></div>
          <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937' }}><p className="text-xs" style={{ color: '#6B7280' }}>Churn Risk</p><p className="text-lg font-bold" style={{ color: ragColor(rag.band) }}>{rag.band === 'green' ? 'Low' : rag.band === 'amber' ? 'Medium' : 'High'}</p></div>
        </div>
        {featureList.length < 4 && (
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(108,63,197,0.06)', border: '1px solid rgba(108,63,197,0.2)' }}>
            <p className="text-xs font-bold mb-1" style={{ color: '#A78BFA' }}>Expansion Opportunity</p>
            <p className="text-xs" style={{ color: '#D1D5DB' }}>Only {featureList.length} feature{featureList.length === 1 ? '' : 's'} enabled — upsell GPS, Video or the Racket reward system.</p>
          </div>
        )}
      </div>
    )
  }

  const buyingSignals: string[] = []
  if (loginCount >= 5) buyingSignals.push(`Logged in ${loginCount} times — strong engagement`)
  if (deptCount >= 3) buyingSignals.push(`Explored ${deptCount} areas`)
  if (featureCount >= 3) buyingSignals.push(`Used ${featureCount} different features`)
  if (account.onboarding_complete) buyingSignals.push('Completed onboarding')

  const riskSignals: string[] = []
  if (loginCount < 3) riskSignals.push('Low login count — may not be engaged')
  if (deptCount < 2) riskSignals.push('Only explored 1 area')
  if (!account.onboarding_complete) riskSignals.push('Never completed onboarding')

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: '#D1D5DB' }}>This account has logged in {loginCount} times, visited {deptCount} areas, and used {featureCount} features.</p>

      {buyingSignals.length > 0 && (
        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#22C55E' }}>Buying Signals</p>
          <ul className="space-y-1">{buyingSignals.map((s, i) => <li key={i} className="flex gap-2 text-xs"><CheckCircle2 size={10} style={{ color: '#22C55E', flexShrink: 0, marginTop: 2 }} /><span style={{ color: '#BBF7D0' }}>{s}</span></li>)}</ul>
        </div>
      )}

      {riskSignals.length > 0 && (
        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#EF4444' }}>Risk Signals</p>
          <ul className="space-y-1">{riskSignals.map((s, i) => <li key={i} className="flex gap-2 text-xs"><AlertTriangle size={10} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} /><span style={{ color: '#FCA5A5' }}>{s}</span></li>)}</ul>
        </div>
      )}
    </div>
  )
}

// ─── Tab 5: AI Insights ──────────────────────────────────────────────────────

function InsightsTab({ id, token }: { id: string; token: string }) {
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const res = await fetch(`/api/sports-admin/insights/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token } })
    if (res.ok) { const d = await res.json(); setReport(d.report) }
    setLoading(false)
  }

  if (!report && !loading) return (
    <div className="py-12 text-center">
      <Sparkles size={32} style={{ color: '#F5A623', margin: '0 auto 12px' }} />
      <p className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>AI Customer Success Report</p>
      <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Generate a comprehensive analysis of this account</p>
      <button onClick={generate} className="px-6 py-2.5 rounded-lg text-xs font-bold" style={{ backgroundColor: '#F5A623', color: '#0A0B10' }}>Generate Insights</button>
    </div>
  )

  if (loading) return (
    <div className="py-12 text-center">
      <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: '#F5A623' }} />
      <p className="text-sm" style={{ color: '#6B7280' }}>Generating AI insights...</p>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold" style={{ color: '#F5A623' }}>AI Insights Report</p>
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(report || '')} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}><Copy size={10} /> Copy</button>
          <button onClick={generate} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(245,166,35,0.1)', color: '#F5A623' }}><RefreshCw size={10} /> Regenerate</button>
        </div>
      </div>
      <div className="rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', color: '#D1D5DB' }}>
        {report}
      </div>
    </div>
  )
}
