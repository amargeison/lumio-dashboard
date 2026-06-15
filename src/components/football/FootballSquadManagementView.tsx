'use client'

import { useState } from 'react'

// Men's Pro — Squad Management. Mirrors the women's rich squad view (KPI strip,
// filter pills, 8-column registration table) with men's EFL Championship squad
// data, blue accent. Demo only.

type Employment = 'Full-time' | 'Part-time'
type DualReg = 'None' | 'On loan' | 'Hosting'
type Welfare = 'Available' | 'Injured' | 'RTP' | 'ITC Pending'
type P = { name: string; pos: string; employment: Employment; dualReg: DualReg; dualRegNote?: string; ageBand: string; nationality: string; international: boolean; contract: string; welfare: Welfare }

const PLAYERS: P[] = [
  { name: 'Jordan Hayes',    pos: 'GK',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2027', welfare: 'Available' },
  { name: 'Joe McDonnell',   pos: 'GK',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Daniel Webb (C)', pos: 'CB',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2027', welfare: 'Available' },
  { name: 'Marcus Reid',     pos: 'CB',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Isaac Kemp',      pos: 'CB',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇬🇧 England',  international: false, contract: 'Jun 2027', welfare: 'RTP' },
  { name: 'Brodi Chen',      pos: 'CB',  employment: 'Full-time', dualReg: 'On loan', dualRegNote: 'Harfield Town', ageBand: 'U24',          nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Tom Fletcher',    pos: 'LB',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇮🇪 Ireland',  international: true,  contract: 'Jun 2027', welfare: 'Available' },
  { name: 'Kyle Osei',       pos: 'RB',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Joe Lewis',       pos: 'CB',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Liam Barker',     pos: 'CM',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2027', welfare: 'Available' },
  { name: 'Ryan Cole',       pos: 'CM',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇬🇧 England',  international: false, contract: 'Jun 2027', welfare: 'Available' },
  { name: 'Connor Walsh',    pos: 'CM',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Paul Granger',    pos: 'CDM', employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales',   international: true,  contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Lucas Vidal',     pos: 'CM',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇪🇸 Spain',    international: true,  contract: 'Jun 2029', welfare: 'ITC Pending' },
  { name: 'Kwame Boateng',   pos: 'CM',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇬🇭 Ghana',    international: true,  contract: 'Jun 2028', welfare: 'Available' },
  { name: 'Delano Ashton',   pos: 'CM',  employment: 'Full-time', dualReg: 'On loan', dualRegNote: 'Marlow Bridge', ageBand: 'U24',          nationality: '🇬🇧 England',  international: false, contract: 'Jun 2027', welfare: 'Available' },
  { name: 'Dean Morris',     pos: 'LW',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2028', welfare: 'Available' },
  { name: 'Sam Porter',      pos: 'ST',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Chris Nwosu',     pos: 'ST',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇳🇬 Nigeria',  international: true,  contract: 'Jun 2027', welfare: 'Injured' },
  { name: 'Diego Santos',    pos: 'ST',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'Senior (24+)', nationality: '🇧🇷 Brazil',   international: true,  contract: 'Jun 2030', welfare: 'Available' },
  { name: 'Myles Okafor',    pos: 'LW',  employment: 'Full-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'James Tilley',    pos: 'RW',  employment: 'Part-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
  { name: 'Antwoine Rowe',   pos: 'CF',  employment: 'Part-time', dualReg: 'None',                                  ageBand: 'U24',          nationality: '🇬🇧 England',  international: false, contract: 'Jun 2026', welfare: 'Available' },
]

type Filter = 'all' | 'fulltime' | 'parttime' | 'dualreg' | 'injured' | 'international'

const STAT = ({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: '#0D1117', border: `1px solid ${color}55`, background: `linear-gradient(135deg, ${color}14, #0D1117)` }}>
    <div className="text-2xl font-black" style={{ color: '#F9FAFB' }}>{value}</div>
    <div className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</div>
    <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{sub}</div>
  </div>
)

export default function FootballSquadManagementView() {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = PLAYERS.filter(p => {
    if (filter === 'all') return true
    if (filter === 'fulltime') return p.employment === 'Full-time'
    if (filter === 'parttime') return p.employment === 'Part-time'
    if (filter === 'dualreg') return p.dualReg !== 'None'
    if (filter === 'injured') return p.welfare === 'Injured' || p.welfare === 'RTP'
    if (filter === 'international') return p.international
    return true
  })
  const total = PLAYERS.length
  const ft = PLAYERS.filter(p => p.employment === 'Full-time').length
  const pt = PLAYERS.filter(p => p.employment === 'Part-time').length
  const dr = PLAYERS.filter(p => p.dualReg !== 'None').length
  const inj = PLAYERS.filter(p => p.welfare === 'Injured' || p.welfare === 'RTP').length

  const welfareBadge = (w: Welfare): { label: string; cls: string } => {
    if (w === 'Available') return { label: 'Available', cls: 'bg-green-600/20 text-green-400' }
    if (w === 'Injured')   return { label: 'Injured',   cls: 'bg-red-600/20 text-red-400' }
    if (w === 'RTP')       return { label: 'RTP',       cls: 'bg-amber-600/20 text-amber-400' }
    return { label: 'ITC Pending', cls: 'bg-amber-600/20 text-amber-400' }
  }
  const filters: Array<{ id: Filter; label: string }> = [
    { id: 'all', label: 'All' }, { id: 'fulltime', label: 'Full-time' }, { id: 'parttime', label: 'Part-time' },
    { id: 'dualreg', label: 'Loans' }, { id: 'injured', label: 'Injured' }, { id: 'international', label: 'International' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#F9FAFB' }}>👥 Squad Management — Oakridge FC</h2>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>EFL Championship registered squad — 2025/26 season</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <STAT label="Total" value={total} sub="Registered players" color="#60A5FA" />
        <STAT label="Full-Time" value={ft} sub="Full contracts" color="#22C55E" />
        <STAT label="Part-Time" value={pt} sub="Part-time / scholar" color="#3B82F6" />
        <STAT label="Dual Registered" value={dr} sub="Out on loan" color="#8B5CF6" />
        <STAT label="Injured / RTP" value={inj} sub="Unavailable" color="#F59E0B" />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40' : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:text-white'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">+ Add Player</button>
          <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed">⬇ Export</button>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
            {['Player', 'Position', 'Employment', 'Loans', 'Age Band', 'Nationality', 'Contract End', 'Welfare'].map(h => <th key={h} className="text-left p-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(p => {
              const wb = welfareBadge(p.welfare)
              return (
                <tr key={p.name} className="border-b border-gray-800/50 hover:bg-blue-600/5 transition-colors">
                  <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-400">{p.pos}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${p.employment === 'Full-time' ? 'bg-teal-600/20 text-teal-400' : 'bg-blue-600/20 text-blue-400'}`}>{p.employment}</span></td>
                  <td className="p-3 text-xs">{p.dualReg === 'None' ? <span className="text-gray-600">—</span> : (<div className="flex flex-col"><span className="text-purple-400 font-semibold">{p.dualReg}</span>{p.dualRegNote && <span className="text-[10px] text-gray-500">{p.dualRegNote}</span>}</div>)}</td>
                  <td className="p-3 text-gray-400 text-xs">{p.ageBand}</td>
                  <td className="p-3 text-gray-300 text-xs">{p.nationality}</td>
                  <td className="p-3 text-gray-400 text-xs">{p.contract}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${wb.cls}`}>{wb.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        ⚠ Lucas Vidal — ITC (International Transfer Certificate) pending. Cannot be registered until clearance is received via FIFA TMS.
      </div>
      <p className="text-[11px] text-gray-600 mt-2">Demo — squad, contracts and statuses are invented demo values.</p>
    </div>
  )
}
