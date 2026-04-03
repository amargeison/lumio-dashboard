'use client'

import { useState } from 'react'

const C = { card: '#0d0f1a', border: '#1F2937', text: '#F9FAFB', muted: '#6B7280', teal: '#0D9488', blue: '#003DA5', yellow: '#F1C40F' } as const

// ─── WYSCOUT / VIDEO ANALYSIS VIEW ───────────────────────────────────────────
export function WyscoutView() {
  const [connected, setConnected] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview'|'players'|'video'|'roadmap'>('overview')

  const recentSearches = [
    { player: 'Marcus Haraldsen', pos: 'CM', club: 'IFK Göteborg', age: 22, market: '€2.1M', wyscoutScore: 7.4, flag: '🇸🇪', status: 'Shortlisted' },
    { player: 'Dani Moreno', pos: 'LW', club: 'Real Valladolid', age: 24, market: '€3.8M', wyscoutScore: 7.9, flag: '🇪🇸', status: 'Under review' },
    { player: 'Kaan Yilmaz', pos: 'CB', club: 'Göztepe', age: 20, market: '€1.4M', wyscoutScore: 7.1, flag: '🇹🇷', status: 'Flagged' },
    { player: 'Luca Ferretti', pos: 'ST', club: 'Spezia', age: 26, market: '€4.2M', wyscoutScore: 8.1, flag: '🇮🇹', status: 'In pipeline' },
  ]
  const recentVideos = [
    { title: 'Opposition — Stockport (A) — Full Match', date: 'Apr 3', analyst: 'Jake Pearson', tags: ['opposition', 'set pieces', 'press triggers'], duration: '95 min' },
    { title: 'Target player — Marcus Haraldsen 5-game reel', date: 'Apr 1', analyst: 'Tom Webb', tags: ['recruitment', 'CM', 'Sweden'], duration: '28 min' },
    { title: 'Set piece review — Last 4 games conceded', date: 'Mar 30', analyst: 'Jake Pearson', tags: ['set pieces', 'defensive', 'review'], duration: '14 min' },
    { title: 'Tactical session — high press from 4-3-3', date: 'Mar 28', analyst: 'Manager', tags: ['tactics', 'training', 'press'], duration: '22 min' },
  ]

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2"><span className="text-xl">🎬</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Wyscout Integration</h2></div>
        <p className="text-sm mt-1 ml-7" style={{ color: C.muted }}>Video analysis, player scouting database, and opposition research — powered by Hudl Wyscout.</p>
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: connected ? 'rgba(0,61,165,0.08)' : C.card, border: `1px solid ${connected ? 'rgba(0,61,165,0.3)' : C.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ border: `2px solid ${connected ? C.blue : '#4B5563'}`, backgroundColor: connected ? 'rgba(0,61,165,0.15)' : '#1F2937' }}>🎬</div>
            <div><div className="font-semibold" style={{ color: C.text }}>Hudl Wyscout</div><div className="text-xs" style={{ color: C.muted }}>600+ competitions · 550,000+ player profiles</div></div>
          </div>
          <button onClick={() => setConnected(!connected)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: connected ? 'rgba(0,61,165,0.15)' : C.blue, color: connected ? C.yellow : C.text, border: connected ? `1px solid rgba(0,61,165,0.3)` : 'none' }}>{connected ? 'Disconnect' : 'Connect Wyscout'}</button>
        </div>
        {connected ? (
          <div className="grid grid-cols-4 gap-3">
            {[{ label: 'Last sync', value: '14 min ago' }, { label: 'Shortlisted', value: '23' }, { label: 'Videos tagged', value: '148' }, { label: 'Analysts', value: '3 active' }].map((s, i) => (
              <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}><div className="text-sm font-bold" style={{ color: C.text }}>{s.value}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>{s.label}</div></div>
            ))}
          </div>
        ) : (
          <div className="text-sm" style={{ color: C.muted }}>Connect your Wyscout account to embed player video clips, pull performance data, and link your scouting shortlist directly into the Lumio transfer pipeline.</div>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {([['overview','What unlocks'],['players','Player data'],['video','Video workflow'],['roadmap','Roadmap']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: activeTab === key ? 'rgba(0,61,165,0.15)' : C.card, color: activeTab === key ? C.yellow : C.muted, border: `1px solid ${activeTab === key ? 'rgba(0,61,165,0.3)' : C.border}` }}>{label}</button>
        ))}
      </div>
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '🔗', title: 'Shortlist sync', desc: 'Players flagged in Wyscout automatically appear in the Lumio transfer pipeline.' },
            { icon: '🎬', title: 'Embedded video clips', desc: 'Wyscout clips embed directly in player profiles. Board presentations include video.' },
            { icon: '📊', title: 'Performance data pull', desc: 'Key Wyscout metrics (xG, xA, progressive passes) surface in Lumio player cards.' },
            { icon: '🆚', title: 'Opposition analysis link', desc: 'Wyscout opposition reports link to match-day planning in Lumio.' },
            { icon: '🏟️', title: 'Competition coverage', desc: '600+ competitions including all EFL, La Liga, Bundesliga, Serie A, and more.' },
            { icon: '👤', title: 'Agent & agency data', desc: 'Representing agency for every shortlisted player appears in the transfer pipeline.' },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <span className="text-xl">{f.icon}</span>
              <div><div className="text-sm font-medium" style={{ color: C.text }}>{f.title}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>{f.desc}</div></div>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'players' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>Wyscout Shortlist → Lumio Transfer Pipeline</div></div>
          {recentSearches.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: i < recentSearches.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <span className="text-xl">{p.flag}</span>
              <div className="flex-1"><div className="text-sm font-semibold" style={{ color: C.text }}>{p.player}</div><div className="text-xs" style={{ color: C.muted }}>{p.pos} · {p.club} · Age {p.age}</div></div>
              <div className="text-sm font-bold" style={{ color: C.text }}>{p.market}</div>
              <div className="text-sm font-bold" style={{ color: p.wyscoutScore >= 8 ? C.teal : C.yellow }}>{p.wyscoutScore}</div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: p.status === 'In pipeline' ? 'rgba(13,148,136,0.15)' : 'rgba(0,61,165,0.15)', color: p.status === 'In pipeline' ? C.teal : C.yellow }}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'video' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>Recent Video Sessions</div></div>
          {recentVideos.map((v, i) => (
            <div key={i} className="p-4" style={{ borderBottom: i < recentVideos.length - 1 ? `1px solid ${C.border}` : undefined }}>
              <div className="flex items-start justify-between mb-1"><div className="text-sm font-medium" style={{ color: C.text }}>{v.title}</div><div className="text-xs" style={{ color: C.muted }}>{v.duration}</div></div>
              <div className="text-xs mb-2" style={{ color: C.muted }}>{v.date} · {v.analyst}</div>
              <div className="flex gap-1 flex-wrap">{v.tags.map((t, j) => <span key={j} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.1)', color: C.yellow }}>#{t}</span>)}</div>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'roadmap' && (
        <div className="space-y-3">
          {[
            { phase: 'Phase 1 — Now', status: 'active', items: ['Wyscout account connection (OAuth)', 'Shortlisted player sync to transfer pipeline', 'Club and player data pull', 'Agent / agency display'] },
            { phase: 'Phase 2 — Q3 2026', status: 'planned', items: ['Embedded video clips in player profiles', 'Opposition report linking to fixture module', 'Performance data in player comparison cards', 'Analyst tagging sync'] },
            { phase: 'Phase 3 — Q1 2027', status: 'future', items: ['Wyscout Talent Centre integration', 'API data export for custom analytics', 'Multi-league performance trendlines', 'Auto-attach reports to DoF review tasks'] },
          ].map((p, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: p.status === 'active' ? 'rgba(13,148,136,0.06)' : C.card, border: `1px solid ${p.status === 'active' ? 'rgba(13,148,136,0.3)' : C.border}` }}>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: p.status === 'active' ? 'rgba(13,148,136,0.15)' : 'rgba(0,61,165,0.15)', color: p.status === 'active' ? C.teal : C.yellow }}>{p.phase}</span>
              <div className="space-y-1.5 mt-3">{p.items.map((item, j) => <div key={j} className="flex items-start gap-2 text-xs" style={{ color: C.muted }}><span style={{ color: p.status === 'active' ? C.teal : C.yellow }}>•</span>{item}</div>)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SCOUTING DATABASE VIEW ──────────────────────────────────────────────────
export function ScoutingDBView() {
  const [searchPos, setSearchPos] = useState('All')
  const positions = ['All','GK','CB','RB','LB','CDM','CM','CAM','RW','LW','ST']
  const database = [
    { name: 'Marcus Haraldsen', flag: '🇸🇪', pos: 'CM', age: 22, club: 'IFK Göteborg', market: '€2.1M', contract: 'Jun 2026', scout: 'Tom Webb', status: 'Shortlisted', xG90: 0.08, xA90: 0.21 },
    { name: 'Dani Moreno', flag: '🇪🇸', pos: 'LW', age: 24, club: 'Real Valladolid', market: '€3.8M', contract: 'Jun 2027', scout: 'Carlos Vega', status: 'Under review', xG90: 0.31, xA90: 0.18 },
    { name: 'Kaan Yilmaz', flag: '🇹🇷', pos: 'CB', age: 20, club: 'Göztepe', market: '€1.4M', contract: 'Jun 2025', scout: 'Tom Webb', status: 'Flagged', xG90: 0.04, xA90: 0.06 },
    { name: 'Luca Ferretti', flag: '🇮🇹', pos: 'ST', age: 26, club: 'Spezia', market: '€4.2M', contract: 'Jun 2026', scout: 'Marco Ricci', status: 'In pipeline', xG90: 0.58, xA90: 0.12 },
    { name: 'Emre Demir', flag: '🇹🇷', pos: 'CAM', age: 21, club: 'Kasımpaşa', market: '€2.8M', contract: 'Jun 2026', scout: 'Tom Webb', status: 'Flagged', xG90: 0.22, xA90: 0.28 },
    { name: 'João Melo', flag: '🇧🇷', pos: 'RB', age: 23, club: 'Santos', market: '€1.9M', contract: 'Dec 2025', scout: 'Carlos Vega', status: 'Under review', xG90: 0.05, xA90: 0.14 },
  ]
  const statusColours: Record<string, string> = { 'In pipeline': 'rgba(13,148,136,0.15):#0D9488', 'Shortlisted': 'rgba(0,61,165,0.15):#F1C40F', 'Under review': 'rgba(245,158,11,0.15):#F59E0B', 'Flagged': 'rgba(107,114,128,0.15):#6B7280' }
  const filtered = database.filter(p => searchPos === 'All' || p.pos === searchPos)

  return (
    <div className="space-y-6">
      <div className="mb-6"><div className="flex items-center gap-2"><span className="text-xl">🔍</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Scouting Database</h2></div><p className="text-sm mt-1 ml-7" style={{ color: C.muted }}>Your club&apos;s internal scouting database — targets, shortlists, and transfer pipeline.</p></div>
      <div className="grid grid-cols-4 gap-4">
        {[{ label: 'Players in DB', value: '284' }, { label: 'Active shortlist', value: '23' }, { label: 'In pipeline', value: '6' }, { label: 'Scout reports', value: '41' }].map((s, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-2xl font-bold" style={{ color: C.text }}>{s.value}</div><div className="text-sm" style={{ color: C.muted }}>{s.label}</div></div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <div className="text-xs" style={{ color: C.muted }}>Position:</div>
        {positions.map(p => <button key={p} onClick={() => setSearchPos(p)} className="px-2.5 py-1 rounded text-xs font-medium" style={{ backgroundColor: searchPos === p ? 'rgba(0,61,165,0.15)' : '#1F2937', color: searchPos === p ? C.yellow : C.muted, border: `1px solid ${searchPos === p ? 'rgba(0,61,165,0.3)' : C.border}` }}>{p}</button>)}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{filtered.length} players</div></div>
        <table className="w-full text-sm">
          <thead><tr className="text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
            <th className="text-left p-3">Player</th><th className="text-left p-3">Pos</th><th className="text-left p-3">Club</th><th className="p-3">Age</th><th className="text-right p-3">Market</th><th className="text-right p-3">xG/90</th><th className="text-right p-3">xA/90</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>{filtered.map((p, i) => {
            const [bg, color] = (statusColours[p.status] || 'rgba(107,114,128,0.15):#6B7280').split(':')
            return (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="p-3"><div className="flex items-center gap-2"><span>{p.flag}</span><span className="font-medium" style={{ color: C.text }}>{p.name}</span></div></td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}>{p.pos}</span></td>
                <td className="p-3 text-xs" style={{ color: C.muted }}>{p.club}</td>
                <td className="p-3" style={{ color: C.muted }}>{p.age}</td>
                <td className="p-3 text-right" style={{ color: '#D1D5DB' }}>{p.market}</td>
                <td className="p-3 text-right font-medium" style={{ color: p.xG90 > 0.3 ? C.teal : C.muted }}>{p.xG90.toFixed(2)}</td>
                <td className="p-3 text-right font-medium" style={{ color: p.xA90 > 0.2 ? C.teal : C.muted }}>{p.xA90.toFixed(2)}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, color }}>{p.status}</span></td>
              </tr>
            )
          })}</tbody>
        </table>
      </div>
    </div>
  )
}

// ─── GPS HARDWARE VIEW ───────────────────────────────────────────────────────
export function GPSHardwareView() {
  const [provider, setProvider] = useState<'catapult' | 'statsports'>('catapult')
  const [catConnected, setCatConnected] = useState(false)
  const [statConnected, setStatConnected] = useState(false)
  const squadLoad = [
    { name: 'M. Browne', pos: 'LW', totalDist: 52.8, hsr: 11.4, accel: 162, acwr: 1.08, readiness: 82, flag: '🟡' },
    { name: 'D. McCoy-Splatt', pos: 'CM', totalDist: 56.1, hsr: 9.8, accel: 148, acwr: 0.94, readiness: 92, flag: '🟢' },
    { name: 'P. Bauer', pos: 'CB', totalDist: 44.0, hsr: 5.2, accel: 98, acwr: 1.38, readiness: 61, flag: '🔴' },
    { name: 'N. Bishop', pos: 'GK', totalDist: 22.4, hsr: 1.2, accel: 44, acwr: 0.88, readiness: 95, flag: '🟢' },
    { name: 'A. Hackford', pos: 'ST', totalDist: 48.2, hsr: 8.4, accel: 124, acwr: 1.12, readiness: 88, flag: '🟡' },
    { name: 'N. Asiimwe', pos: 'RB', totalDist: 31.2, hsr: 6.1, accel: 88, acwr: 0.71, readiness: 74, flag: '🟡' },
  ]
  const providerData = {
    catapult: { name: 'Catapult (Vector T7)', desc: 'Market leader in elite performance tracking.', cost: '£40,000–£120,000/yr', metrics: ['Total distance', 'High-speed running', 'Sprint distance', 'Accelerations', 'Player load', 'ACWR', 'Heart rate zones', 'Positional heatmaps'] },
    statsports: { name: 'STATSports (APEX Pro)', desc: 'Challenger to Catapult — better value at League One level.', cost: '£20,000–£60,000/yr', metrics: ['Total distance', 'High metabolic load', 'Sprint speed (peak)', 'Repeated sprint ability', 'Mechanical load', 'Dynamic stress load', 'Live tablet monitoring', 'OLED display'] },
  }
  const current = providerData[provider]
  const connected = provider === 'catapult' ? catConnected : statConnected
  const setConnected = provider === 'catapult' ? setCatConnected : setStatConnected

  return (
    <div className="space-y-6">
      <div className="mb-6"><div className="flex items-center gap-2"><span className="text-xl">📡</span><h2 className="text-xl font-bold" style={{ color: C.text }}>GPS Hardware Integration</h2></div><p className="text-sm mt-1 ml-7" style={{ color: C.muted }}>Catapult and STATSports wearable data flows into Lumio&apos;s performance and medical modules.</p></div>
      <div className="grid grid-cols-2 gap-3">
        {(['catapult', 'statsports'] as const).map(p => (
          <button key={p} onClick={() => setProvider(p)} className="p-4 rounded-xl text-left" style={{ backgroundColor: provider === p ? 'rgba(0,61,165,0.08)' : C.card, border: `1px solid ${provider === p ? 'rgba(0,61,165,0.3)' : C.border}` }}>
            <div className="font-semibold mb-1" style={{ color: C.text }}>{providerData[p].name}</div>
            <div className="text-xs" style={{ color: C.muted }}>{providerData[p].desc}</div>
            <div className="text-xs mt-2" style={{ color: C.teal }}>{providerData[p].cost}</div>
          </button>
        ))}
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: connected ? 'rgba(13,148,136,0.06)' : C.card, border: `1px solid ${connected ? 'rgba(13,148,136,0.3)' : C.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <div><div className="font-semibold" style={{ color: C.text }}>{current.name}</div></div>
          <button onClick={() => setConnected(!connected)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: connected ? 'rgba(0,61,165,0.15)' : '#10B981', color: connected ? C.yellow : C.text }}>{connected ? 'Disconnect' : 'Connect'}</button>
        </div>
        {connected && (
          <div className="grid grid-cols-4 gap-3">
            {[{ label: 'Squad pods', value: '16' }, { label: 'Last session', value: 'Today 09:30' }, { label: 'Sessions/week', value: '3' }, { label: 'ACWR alerts', value: '2 ⚠️' }].map((s, i) => (
              <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}><div className="text-sm font-bold" style={{ color: C.text }}>{s.value}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>{s.label}</div></div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="text-sm font-semibold mb-4" style={{ color: C.text }}>Metrics from {current.name}</div>
        <div className="grid grid-cols-2 gap-2">
          {current.metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}><span className="text-xs" style={{ color: C.teal }}>✓</span>{m}</div>
          ))}
        </div>
      </div>
      {connected && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>Squad Load — Last 5 Sessions</div></div>
          <table className="w-full text-sm">
            <thead><tr className="text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left p-3">Player</th><th className="text-right p-3">Dist</th><th className="text-right p-3">HSR</th><th className="text-right p-3">Accels</th><th className="text-right p-3">ACWR</th><th className="text-right p-3">Ready</th><th className="p-3">Flag</th>
            </tr></thead>
            <tbody>{squadLoad.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="p-3"><span className="font-medium" style={{ color: C.text }}>{p.name}</span><span className="text-xs ml-1" style={{ color: C.muted }}>{p.pos}</span></td>
                <td className="p-3 text-right" style={{ color: '#D1D5DB' }}>{p.totalDist}km</td>
                <td className="p-3 text-right" style={{ color: '#D1D5DB' }}>{p.hsr}km</td>
                <td className="p-3 text-right" style={{ color: C.muted }}>{p.accel}</td>
                <td className="p-3 text-right font-bold" style={{ color: p.acwr > 1.3 ? '#EF4444' : p.acwr > 1.0 ? '#F59E0B' : C.teal }}>{p.acwr}</td>
                <td className="p-3 text-right font-medium" style={{ color: p.readiness >= 85 ? C.teal : p.readiness >= 70 ? '#F59E0B' : '#EF4444' }}>{p.readiness}%</td>
                <td className="p-3 text-center text-lg">{p.flag}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── OPTA / STATSBOMB VIEW ───────────────────────────────────────────────────
export function OptaStatsBombView() {
  const [dataSource, setDataSource] = useState<'statsbomb' | 'opta'>('statsbomb')
  const [sbConnected, setSbConnected] = useState(false)
  const [optaConnected, setOptaConnected] = useState(false)
  const sampleMetrics = [
    { metric: 'xG (Expected Goals)', desc: 'Probability of a shot resulting in a goal', provider: 'Both', use: 'Match dashboard, opposition analysis' },
    { metric: 'xA (Expected Assists)', desc: 'Probability that a pass leads to a goal', provider: 'Both', use: 'Player evaluation, recruitment' },
    { metric: 'PPDA', desc: 'Passes Per Defensive Action — pressing intensity', provider: 'StatsBomb', use: 'Tactical analysis, press comparison' },
    { metric: 'OBV (On-Ball Value)', desc: 'Impact of each action on scoring probability', provider: 'StatsBomb', use: 'Player comparison in transfers' },
    { metric: 'Progressive passes/carries', desc: 'Actions advancing the ball toward goal', provider: 'Both', use: 'Midfielder evaluation' },
    { metric: 'Pressure events & regains', desc: 'Where and how often pressing actions occur', provider: 'StatsBomb', use: 'Pre-match tactical briefing' },
  ]
  const providers = {
    statsbomb: { name: 'Hudl StatsBomb', desc: 'The most granular event data in football', cost: '£30,000–£80,000/yr' },
    opta: { name: 'Opta (StatsPerform)', desc: 'The original and most widely licensed provider', cost: '£50,000–£200,000+/yr' },
  }
  const current = providers[dataSource]
  const connected = dataSource === 'statsbomb' ? sbConnected : optaConnected
  const setConnected = dataSource === 'statsbomb' ? setSbConnected : setOptaConnected
  const matchXG = [
    { opp: 'Stockport (A)', xgFor: 1.84, xgAg: 0.62, result: 'W 2-0' },
    { opp: 'Huddersfield (H)', xgFor: 0.91, xgAg: 1.42, result: 'L 0-1' },
    { opp: 'Peterborough (A)', xgFor: 2.11, xgAg: 0.88, result: 'W 3-1' },
    { opp: 'Wigan (H)', xgFor: 1.44, xgAg: 1.38, result: 'D 1-1' },
    { opp: 'Barnsley (A)', xgFor: 1.92, xgAg: 0.45, result: 'W 2-0' },
  ]

  return (
    <div className="space-y-6">
      <div className="mb-6"><div className="flex items-center gap-2"><span className="text-xl">📊</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Opta / StatsBomb Event Data</h2></div><p className="text-sm mt-1 ml-7" style={{ color: C.muted }}>Elite event data for tactical analytics — xG, xA, pressure, possession value.</p></div>
      <div className="grid grid-cols-2 gap-3">
        {(['statsbomb', 'opta'] as const).map(p => (
          <button key={p} onClick={() => setDataSource(p)} className="p-4 rounded-xl text-left" style={{ backgroundColor: dataSource === p ? 'rgba(0,61,165,0.08)' : C.card, border: `1px solid ${dataSource === p ? 'rgba(0,61,165,0.3)' : C.border}` }}>
            <div className="font-semibold mb-1" style={{ color: C.text }}>{providers[p].name}</div>
            <div className="text-xs" style={{ color: C.muted }}>{providers[p].desc}</div>
            <div className="text-xs mt-2" style={{ color: C.teal }}>{providers[p].cost}</div>
          </button>
        ))}
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: connected ? 'rgba(13,148,136,0.06)' : C.card, border: `1px solid ${connected ? 'rgba(13,148,136,0.3)' : C.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <div><div className="font-semibold" style={{ color: C.text }}>{current.name}</div><div className="text-xs" style={{ color: C.muted }}>{current.cost}</div></div>
          <button onClick={() => setConnected(!connected)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: connected ? 'rgba(0,61,165,0.15)' : '#10B981', color: connected ? C.yellow : C.text }}>{connected ? 'Disconnect' : 'Connect'}</button>
        </div>
        {connected && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[{ label: 'Last data push', value: 'Today 06:00' }, { label: 'Matches in DB', value: '847' }, { label: 'Competitions', value: '12 active' }].map((s, i) => (
              <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}><div className="text-sm font-bold" style={{ color: C.text }}>{s.value}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>{s.label}</div></div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>Where These Metrics Appear in Lumio</div></div>
        {sampleMetrics.map((m, i) => (
          <div key={i} className="p-4" style={{ borderBottom: i < sampleMetrics.length - 1 ? `1px solid ${C.border}` : undefined }}>
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-sm font-medium" style={{ color: C.text }}>{m.metric}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>{m.desc}</div></div>
              <span className="text-xs px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: m.provider === 'Both' ? 'rgba(13,148,136,0.15)' : 'rgba(0,61,165,0.15)', color: m.provider === 'Both' ? C.teal : C.yellow }}>{m.provider}</span>
            </div>
            <div className="mt-2 text-xs" style={{ color: C.yellow }}>→ Used in: {m.use}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="text-sm font-semibold mb-4" style={{ color: C.text }}>xG Timeline — Last 5 Matches</div>
        <div className="space-y-3">
          {matchXG.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-xs w-32 shrink-0" style={{ color: C.muted }}>{r.opp}</div>
              <div className="flex-1"><div className="h-5 rounded flex items-center px-2" style={{ width: `${(r.xgFor / 2.5) * 100}%`, backgroundColor: 'rgba(13,148,136,0.5)' }}><span className="text-[10px] font-medium" style={{ color: C.text }}>{r.xgFor} xGF</span></div></div>
              <div className="w-20"><div className="h-5 rounded flex items-center justify-end px-2 ml-auto" style={{ width: `${(r.xgAg / 2.5) * 100}%`, backgroundColor: 'rgba(239,68,68,0.35)' }}><span className="text-[10px]" style={{ color: C.text }}>{r.xgAg}</span></div></div>
              <span className="text-xs font-semibold w-14 text-right" style={{ color: r.result.startsWith('W') ? C.teal : r.result.startsWith('L') ? '#EF4444' : '#F59E0B' }}>{r.result}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── FIND CLUB VIEW ──────────────────────────────────────────────────────────
export function FindClubView() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const recentSearches = ['Charlton Athletic', 'Wrexham', 'Barnsley', 'Bolton Wanderers', 'Reading']

  async function searchClub(clubName: string) {
    if (!clubName.trim()) return
    setLoading(true); setResult(null); setError('')
    try {
      const res = await fetch('/api/ai/football-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'club', query: clubName }) })
      const data = await res.json()
      if (data.result) setResult(data.result)
      else setError('Could not retrieve club data.')
    } catch { setError('Search failed. Please try again.') }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6"><div className="flex items-center gap-2"><span className="text-xl">🏟️</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Find Club</h2></div><p className="text-sm mt-1 ml-7" style={{ color: C.muted }}>AI-powered club intelligence — league position, financials, key personnel, and Lumio fit assessment.</p></div>
      <div className="flex gap-3">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchClub(query)} placeholder="Search any football club..." className="flex-1 rounded-xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: `1px solid ${C.border}`, color: C.text }} />
        <button onClick={() => searchClub(query)} disabled={loading} className="px-6 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: C.blue, color: C.yellow, opacity: loading ? 0.6 : 1 }}>{loading ? 'Searching...' : '🔍 Find Club'}</button>
      </div>
      {!result && !loading && (<div><div className="text-xs mb-2" style={{ color: C.muted }}>Recent searches</div><div className="flex gap-2 flex-wrap">{recentSearches.map(s => (<button key={s} onClick={() => { setQuery(s); searchClub(s) }} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#1F2937', color: C.muted, border: `1px solid ${C.border}` }}>{s}</button>))}</div></div>)}
      {error && <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>{error}</div>}
      {loading && <div className="rounded-xl p-12 flex flex-col items-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="w-8 h-8 border-2 rounded-full animate-spin mb-4" style={{ borderColor: C.border, borderTopColor: C.blue }} /><div className="text-sm" style={{ color: C.muted }}>Researching club data...</div></div>}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.15), rgba(0,0,0,0.1))', border: '1px solid rgba(0,61,165,0.3)' }}>
            <div className="flex items-start justify-between mb-3"><div><h3 className="text-2xl font-black" style={{ color: C.text }}>{result.name}</h3><div className="text-sm mt-0.5" style={{ color: C.muted }}>{result.league} · {result.country} · Founded {result.founded}</div></div><div className="text-right"><div className="text-lg font-bold" style={{ color: C.yellow }}>{result.leaguePos}</div><div className="text-xs" style={{ color: C.muted }}>in league</div></div></div>
            <p className="text-sm" style={{ color: '#D1D5DB' }}>{result.summary}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{ l: 'Manager', v: result.manager }, { l: 'Stadium', v: result.stadium }, { l: 'Capacity', v: result.capacity }, { l: 'Avg Attendance', v: result.avgAttendance }, { l: 'Owner Type', v: result.ownerType }, { l: 'Revenue', v: result.revenue }, { l: 'Wage Bill', v: result.wageBill }, { l: 'Transfer Budget', v: result.transferBudget }].map((s, i) => (<div key={i} className="rounded-xl p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-xs" style={{ color: C.muted }}>{s.l}</div><div className="text-sm font-medium" style={{ color: C.text }}>{s.v}</div></div>))}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-xs mb-2" style={{ color: C.muted }}>Recent Form</div><div className="flex gap-1.5">{(result.recentForm || '').split('-').map((r: string, i: number) => (<div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: r === 'W' ? 'rgba(13,148,136,0.2)' : r === 'D' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: r === 'W' ? C.teal : r === 'D' ? '#F59E0B' : '#EF4444' }}>{r}</div>))}</div></div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-xs mb-2" style={{ color: C.muted }}>PSR Status</div><div className="text-sm font-semibold" style={{ color: (result.psr || '').toLowerCase().includes('compliant') ? C.teal : '#F59E0B' }}>{result.psr}</div></div>
          </div>
          {result.keyPlayers && <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-xs mb-3" style={{ color: C.muted }}>Key Players</div><div className="flex gap-2 flex-wrap">{result.keyPlayers.map((p: string, i: number) => (<div key={i} className="rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: '#1F2937', color: '#D1D5DB' }}>{p}</div>))}</div></div>}
          <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.06), rgba(0,0,0,0.02))', border: '1px solid rgba(0,61,165,0.2)' }}><div className="text-xs font-semibold uppercase mb-2" style={{ color: C.yellow }}>Lumio Pro Club Fit</div><p className="text-sm" style={{ color: '#D1D5DB' }}>{result.lumioFit}</p><div className="mt-3 text-xs" style={{ color: C.muted }}>Contact route: <span style={{ color: '#D1D5DB' }}>{result.contactRoute}</span></div></div>
          <button onClick={() => { setResult(null); setQuery('') }} className="text-xs" style={{ color: C.muted }}>← Search another club</button>
        </div>
      )}
    </div>
  )
}

// ─── FIND PLAYER VIEW ────────────────────────────────────────────────────────
export function FindPlayerView() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const recentSearches = ['Marcus Browne', 'Mathew Stevens', 'Omar Bugiel', 'Harvey Knibbs', 'Aaron Collins']

  async function searchPlayer(playerName: string) {
    if (!playerName.trim()) return
    setLoading(true); setResult(null); setError('')
    try {
      const res = await fetch('/api/ai/football-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'player', query: playerName }) })
      const data = await res.json()
      if (data.result) setResult(data.result)
      else setError('Could not retrieve player data.')
    } catch { setError('Search failed. Please try again.') }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6"><div className="flex items-center gap-2"><span className="text-xl">⚽</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Find Player</h2></div><p className="text-sm mt-1 ml-7" style={{ color: C.muted }}>AI-powered player intelligence — stats, contract, market value, agent details, and AFC Wimbledon fit.</p></div>
      <div className="flex gap-3">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchPlayer(query)} placeholder="Search any professional player..." className="flex-1 rounded-xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: `1px solid ${C.border}`, color: C.text }} />
        <button onClick={() => searchPlayer(query)} disabled={loading} className="px-6 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: C.blue, color: C.yellow, opacity: loading ? 0.6 : 1 }}>{loading ? 'Searching...' : '🔍 Find Player'}</button>
      </div>
      {!result && !loading && (<div><div className="text-xs mb-2" style={{ color: C.muted }}>Quick search</div><div className="flex gap-2 flex-wrap">{recentSearches.map(s => (<button key={s} onClick={() => { setQuery(s); searchPlayer(s) }} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: '#1F2937', color: C.muted, border: `1px solid ${C.border}` }}>{s}</button>))}</div></div>)}
      {error && <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>{error}</div>}
      {loading && <div className="rounded-xl p-12 flex flex-col items-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="w-8 h-8 border-2 rounded-full animate-spin mb-4" style={{ borderColor: C.border, borderTopColor: C.blue }} /><div className="text-sm" style={{ color: C.muted }}>Researching player data...</div></div>}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.15), rgba(0,0,0,0.1))', border: '1px solid rgba(0,61,165,0.3)' }}>
            <div className="flex items-start justify-between mb-3"><div><h3 className="text-2xl font-black" style={{ color: C.text }}>{result.name}</h3><div className="text-sm mt-0.5" style={{ color: C.muted }}>{result.position} · {result.nationality} · Age {result.age}</div><div className="text-sm mt-0.5" style={{ color: C.muted }}>{result.currentClub} · {result.league}</div></div><div className="text-right"><div className="text-xl font-bold" style={{ color: C.text }}>{result.marketValue}</div><div className="text-xs" style={{ color: C.muted }}>Market value</div><div className="text-xs mt-1 font-semibold" style={{ color: C.teal }}>⭐ {result.rating} rating</div></div></div>
            <p className="text-sm" style={{ color: '#D1D5DB' }}>{result.summary}</p>
          </div>
          <div className="grid grid-cols-4 gap-3">{[{ l: 'Appearances', v: result.apps }, { l: 'Goals', v: result.goals }, { l: 'Assists', v: result.assists }, { l: 'Avg Rating', v: result.rating }].map((s, i) => (<div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-2xl font-bold" style={{ color: C.text }}>{s.v}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>{s.l}</div></div>))}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-xs mb-2" style={{ color: C.muted }}>Contract & Transfer</div><div className="space-y-1.5 text-sm">{[['Expires', result.contractUntil], ['Status', result.transferStatus], ['Asking price', result.askingPrice], ['Int. caps', result.internationalCaps]].map(([l, v]) => (<div key={l} className="flex justify-between"><span style={{ color: C.muted }}>{l}</span><span style={{ color: C.text }}>{v}</span></div>))}</div></div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-xs mb-2" style={{ color: C.muted }}>Agent</div><div className="text-sm font-medium" style={{ color: C.text }}>{result.agent}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>{result.agencyName}</div>{result.previousClubs && <div className="mt-3"><div className="text-xs" style={{ color: C.muted }}>Previous clubs</div><div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{result.previousClubs.join(' · ')}</div></div>}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-xs font-semibold mb-2" style={{ color: C.teal }}>✓ Strengths</div><div className="space-y-1">{(result.strengths || []).map((s: string, i: number) => <div key={i} className="text-xs" style={{ color: '#D1D5DB' }}>• {s}</div>)}</div></div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-xs font-semibold mb-2" style={{ color: '#EF4444' }}>✗ Weaknesses</div><div className="space-y-1">{(result.weaknesses || []).map((w: string, i: number) => <div key={i} className="text-xs" style={{ color: '#D1D5DB' }}>• {w}</div>)}</div></div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.06), rgba(0,0,0,0.02))', border: '1px solid rgba(0,61,165,0.2)' }}><div className="text-xs font-semibold uppercase mb-2" style={{ color: C.yellow }}>AFC Wimbledon Fit Assessment</div><p className="text-sm mb-3" style={{ color: '#D1D5DB' }}>{result.fitForWimbledon}</p><div className="grid grid-cols-2 gap-3 text-xs"><div><span style={{ color: C.muted }}>Approach: </span><span style={{ color: '#D1D5DB' }}>{result.approachRoute}</span></div><div><span style={{ color: C.muted }}>PSR impact: </span><span style={{ color: '#D1D5DB' }}>{result.psrImpact}</span></div></div></div>
          <div className="flex gap-3"><button onClick={() => { setResult(null); setQuery('') }} className="text-xs" style={{ color: C.muted }}>← Search another player</button><button className="text-xs px-3 py-1 rounded-lg" style={{ color: C.yellow, border: '1px solid rgba(0,61,165,0.3)' }}>+ Add to transfer pipeline</button></div>
        </div>
      )}
    </div>
  )
}
