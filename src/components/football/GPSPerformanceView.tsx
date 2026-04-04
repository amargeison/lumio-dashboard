'use client'

import { useState } from 'react'
import { Activity, Users, Zap, TrendingUp, Upload, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react'

const RED = '#C0392B'
const GOLD = '#F1C40F'
const CARD = '#111318'
const BORDER = '#1F2937'

type Tab = 'session' | 'readiness' | 'trends' | 'compare' | 'connect'

// Demo data for when no GPS is connected
const DEMO_PLAYERS = [
  { name: 'Lucas Santos', distance: 10.8, hsr: 1420, sprints: 18, maxSpeed: 33.2, load: 842, acwr: 1.1 },
  { name: 'Marcus Cole', distance: 11.2, hsr: 1680, sprints: 22, maxSpeed: 34.1, load: 910, acwr: 1.4 },
  { name: 'Josh Henderson', distance: 9.6, hsr: 980, sprints: 12, maxSpeed: 30.8, load: 720, acwr: 0.9 },
  { name: 'Kai Nakamura', distance: 10.1, hsr: 1290, sprints: 15, maxSpeed: 31.5, load: 790, acwr: 1.2 },
  { name: 'Tom Phillips', distance: 10.5, hsr: 1380, sprints: 16, maxSpeed: 32.0, load: 815, acwr: 0.7 },
  { name: 'Ben Campbell', distance: 9.2, hsr: 850, sprints: 8, maxSpeed: 29.4, load: 650, acwr: 1.6 },
  { name: 'Ryan Correia', distance: 10.9, hsr: 1520, sprints: 20, maxSpeed: 33.8, load: 870, acwr: 1.0 },
  { name: 'Jack Williams', distance: 9.8, hsr: 1100, sprints: 14, maxSpeed: 31.0, load: 750, acwr: 0.85 },
]

function acwrColor(v: number) { return v > 1.5 ? '#EF4444' : v > 1.3 ? '#F59E0B' : v < 0.8 ? '#3B82F6' : '#22C55E' }
function acwrLabel(v: number) { return v > 1.5 ? 'High Risk' : v > 1.3 ? 'Caution' : v < 0.8 ? 'Under-trained' : 'Optimal' }
function acwrStatus(v: number) { return v > 1.5 ? 'Rest recommended' : v > 1.3 ? 'Manage load' : 'Ready to play' }
function loadColor(v: number) { return v > 900 ? '#EF4444' : v > 800 ? '#F59E0B' : '#22C55E' }

export default function GPSPerformanceView() {
  const [tab, setTab] = useState<Tab>('session')
  const [connectToken, setConnectToken] = useState('')
  const [connectProvider, setConnectProvider] = useState<'catapult' | 'statsports'>('catapult')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'session', label: 'Session Overview', icon: Activity },
    { id: 'readiness', label: 'Player Readiness', icon: Users },
    { id: 'trends', label: 'Load Trends', icon: TrendingUp },
    { id: 'compare', label: 'Match vs Training', icon: Zap },
    { id: 'connect', label: 'Connect GPS', icon: Settings },
  ]

  const sorted = [...DEMO_PLAYERS].sort((a, b) => b.load - a.load)
  const avgLoad = Math.round(sorted.reduce((s, p) => s + p.load, 0) / sorted.length)
  const avgDist = (sorted.reduce((s, p) => s + p.distance, 0) / sorted.length).toFixed(1)
  const avgHSR = Math.round(sorted.reduce((s, p) => s + p.hsr, 0) / sorted.length)
  const maxSpeed = Math.max(...sorted.map(p => p.maxSpeed))

  async function handleConnect() {
    if (!connectToken.trim()) return
    setSaving(true)
    const token = localStorage.getItem('workspace_session_token') || ''
    await fetch(`/api/integrations/${connectProvider}`, {
      method: 'POST', headers: { 'x-workspace-token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: connectToken }),
    }).catch(() => {})
    localStorage.setItem(`lumio_integration_${connectProvider}`, 'true')
    setSaving(false); setSaved(true); setConnectToken('')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>Performance & GPS</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Player load, readiness and GPS tracking data</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{
            backgroundColor: tab === t.id ? `${RED}20` : 'transparent', color: tab === t.id ? RED : '#6B7280',
            border: tab === t.id ? `1px solid ${RED}40` : '1px solid #1F2937',
          }}><t.icon size={12} />{t.label}</button>
        ))}
      </div>

      {/* Session Overview */}
      {tab === 'session' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3 mb-4">
              <Activity size={18} style={{ color: GOLD }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Training Session — Today</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Full squad training · 90 min · Demo data</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}` }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Avg Player Load</p>
                <p className="text-xl font-black" style={{ color: GOLD }}>{avgLoad}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}` }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Avg Distance (km)</p>
                <p className="text-xl font-black" style={{ color: '#22C55E' }}>{avgDist}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}` }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Avg HSR (m)</p>
                <p className="text-xl font-black" style={{ color: '#3B82F6' }}>{avgHSR}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}` }}>
                <p className="text-xs" style={{ color: '#6B7280' }}>Max Speed (km/h)</p>
                <p className="text-xl font-black" style={{ color: RED }}>{maxSpeed}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Player Breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Player', 'Distance', 'HSR', 'Sprints', 'Max Speed', 'Load', 'ACWR'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{sorted.map(p => (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                    <td className="px-4 py-2.5" style={{ color: '#D1D5DB' }}>{p.distance} km</td>
                    <td className="px-4 py-2.5" style={{ color: '#D1D5DB' }}>{p.hsr} m</td>
                    <td className="px-4 py-2.5" style={{ color: '#D1D5DB' }}>{p.sprints}</td>
                    <td className="px-4 py-2.5" style={{ color: '#D1D5DB' }}>{p.maxSpeed} km/h</td>
                    <td className="px-4 py-2.5"><span className="font-bold" style={{ color: loadColor(p.load) }}>{p.load}</span></td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${acwrColor(p.acwr)}20`, color: acwrColor(p.acwr) }}>{p.acwr.toFixed(2)} {acwrLabel(p.acwr)}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Player Readiness */}
      {tab === 'readiness' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-2xl font-black" style={{ color: '#22C55E' }}>{sorted.filter(p => p.acwr >= 0.8 && p.acwr <= 1.3).length}</p>
              <p className="text-xs font-semibold" style={{ color: '#22C55E' }}>Ready to Play</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>{sorted.filter(p => p.acwr > 1.3 && p.acwr <= 1.5).length}</p>
              <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Manage Load</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-2xl font-black" style={{ color: '#EF4444' }}>{sorted.filter(p => p.acwr > 1.5).length}</p>
              <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>Rest Recommended</p>
            </div>
          </div>
          <div className="space-y-2">
            {sorted.map(p => (
              <div key={p.name} className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div className="rounded-full shrink-0" style={{ width: 12, height: 12, backgroundColor: acwrColor(p.acwr) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>ACWR: {p.acwr.toFixed(2)} · Load: {p.load}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{ color: acwrColor(p.acwr) }}>{acwrStatus(p.acwr)}</p>
                  {p.acwr > 1.5 && <p className="text-[10px] inline-flex items-center gap-1" style={{ color: '#EF4444' }}><AlertTriangle size={10} /> Injury risk</p>}
                  {p.acwr >= 0.8 && p.acwr <= 1.3 && <p className="text-[10px] inline-flex items-center gap-1" style={{ color: '#22C55E' }}><CheckCircle2 size={10} /> Optimal</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load Trends placeholder */}
      {tab === 'trends' && (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <TrendingUp size={32} style={{ color: GOLD, margin: '0 auto 12px', opacity: 0.5 }} />
          <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Load Trends</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>Connect Catapult or STATSports to see weekly load trends with charts.</p>
          <p className="text-xs mt-3" style={{ color: GOLD }}>Connect your GPS provider in the Connect tab</p>
        </div>
      )}

      {/* Match vs Training placeholder */}
      {tab === 'compare' && (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <Zap size={32} style={{ color: GOLD, margin: '0 auto 12px', opacity: 0.5 }} />
          <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Match vs Training</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>Compare player output between match days and training sessions.</p>
          <p className="text-xs mt-3" style={{ color: GOLD }}>Requires 3+ sessions of GPS data</p>
        </div>
      )}

      {/* Connect GPS */}
      {tab === 'connect' && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#F9FAFB' }}>Connect GPS Provider</p>
            <div className="flex gap-2 mb-4">
              {(['catapult', 'statsports'] as const).map(p => (
                <button key={p} onClick={() => setConnectProvider(p)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{
                  backgroundColor: connectProvider === p ? `${RED}20` : 'transparent', color: connectProvider === p ? RED : '#6B7280',
                  border: connectProvider === p ? `1px solid ${RED}40` : `1px solid ${BORDER}`,
                }}>{p === 'catapult' ? 'Catapult OpenField' : 'STATSports Apex'}</button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>{connectProvider === 'catapult' ? 'Catapult API Token' : 'STATSports API Key'}</label>
                <input value={connectToken} onChange={e => setConnectToken(e.target.value)} placeholder={connectProvider === 'catapult' ? 'Enter your Catapult OpenField API token' : 'Enter your STATSports API key'} className="w-full text-sm rounded-lg px-3 py-2.5 outline-none" style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER}`, color: '#F9FAFB' }} />
              </div>
              <button onClick={handleConnect} disabled={saving || !connectToken.trim()} className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: saved ? '#22C55E' : RED, color: '#F9FAFB', opacity: saving || !connectToken.trim() ? 0.5 : 1 }}>
                {saving ? 'Connecting...' : saved ? 'Connected!' : 'Connect'}
              </button>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Or Upload CSV</p>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Export from Catapult or STATSports and upload here</p>
            <div className="rounded-xl p-6 text-center cursor-pointer" style={{ backgroundColor: '#0A0B10', border: `2px dashed ${BORDER}` }}>
              <Upload size={24} style={{ color: GOLD, margin: '0 auto 8px' }} />
              <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>Drop GPS export file here</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>CSV format from Catapult or STATSports</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
