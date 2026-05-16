'use client'

import {
  Clipboard, BarChart3, Heart, Clock, Activity,
} from 'lucide-react'

// Women's Training — session planning, weekly schedule, GPS load monitoring.
// Pink-themed. Demo data inline, Women's-specific (Oakridge Women FC,
// Hartwell Women opponent, WSL Championship cadence).

const C = {
  bg: '#0F172A',
  card: '#0D1017',
  cardAlt: '#111318',
  border: '#1F2937',
  text: '#F9FAFB',
  textSec: '#9CA3AF',
  muted: '#6B7280',
  primary: '#EC4899',
  gold: '#BE185D',
  good: '#22C55E',
  warn: '#F59E0B',
  bad: '#EF4444',
  blue: '#3B82F6',
} as const

type WeekDay = { day: string; am: string; pm: string; intensity: 'High' | 'Medium' | 'Low' | '—'; focus: string }
type GpsRow  = { player: string; distance: number; hiSpeed: number; sprints: number; maxSpeed: number; load: 'optimal' | 'high' | 'overload' }

const WEEKLY_PLAN: WeekDay[] = [
  { day: 'Mon', am: 'Recovery + Pool',      pm: 'Video Review',       intensity: 'Low',    focus: 'Recovery' },
  { day: 'Tue', am: 'Tactical Pressing',     pm: 'Set Pieces',         intensity: 'High',   focus: 'Tactical' },
  { day: 'Wed', am: 'Possession Patterns',   pm: 'Gym',                intensity: 'Medium', focus: 'Technical' },
  { day: 'Thu', am: 'Match Simulation',      pm: 'Rest',               intensity: 'High',   focus: 'Match Prep' },
  { day: 'Fri', am: 'Light Walk-through',    pm: 'Pre-match Talk',     intensity: 'Low',    focus: 'Recovery' },
  { day: 'Sat', am: 'Travel',                pm: 'Team Meeting',       intensity: 'Low',    focus: 'Travel' },
  { day: 'Sun', am: 'MATCHDAY',              pm: '—',                  intensity: '—',      focus: 'Hartwell Women' },
]

const GPS_DATA: GpsRow[] = [
  { player: 'L. Barker',     distance: 10.4, hiSpeed: 880,  sprints: 24, maxSpeed: 28.8, load: 'optimal' },
  { player: 'D. Morris',     distance: 10.2, hiSpeed: 820,  sprints: 28, maxSpeed: 30.2, load: 'optimal' },
  { player: 'Z. Williams',   distance: 9.8,  hiSpeed: 760,  sprints: 26, maxSpeed: 29.8, load: 'optimal' },
  { player: 'J. Tilley',     distance: 10.6, hiSpeed: 940,  sprints: 32, maxSpeed: 30.6, load: 'high' },
  { player: 'P. Granger',    distance: 10.4, hiSpeed: 700,  sprints: 20, maxSpeed: 28.0, load: 'optimal' },
  { player: 'N. Carter',     distance: 10.5, hiSpeed: 840,  sprints: 28, maxSpeed: 30.0, load: 'high' },
  { player: 'C. Porter',     distance: 9.4,  hiSpeed: 620,  sprints: 22, maxSpeed: 28.8, load: 'optimal' },
  { player: 'K. Okonkwo',    distance: 10.4, hiSpeed: 820,  sprints: 28, maxSpeed: 30.4, load: 'optimal' },
]

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
    </div>
  )
}

export default function WomensTrainingView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Training</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>Session planning, weekly schedule, GPS load monitoring, and recovery management.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Session Plan',       icon: Clipboard },
          { label: 'Load Report',        icon: BarChart3 },
          { label: 'Recovery Schedule',  icon: Heart },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: C.primary, color: '#fff' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Today's Session"   value="10:00"     icon={Clock}      color={C.primary} />
        <StatCard label="Session Type"      value="Tactical"  icon={Clipboard}  color={C.blue} />
        <StatCard label="Avg Load (7d)"     value="68%"       icon={Activity}   color={C.good} />
        <StatCard label="Recovery Group"    value="3"         icon={Heart}      color={C.warn} />
      </div>

      {/* Weekly Plan */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-sm font-semibold" style={{ color: C.text }}>Weekly Training Plan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Day', 'AM Session', 'PM Session', 'Intensity', 'Focus'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKLY_PLAN.map((d, i) => {
                const intColor = d.intensity === 'High' ? C.bad : d.intensity === 'Medium' ? C.warn : d.intensity === 'Low' ? C.good : C.muted
                const isMatchday = d.day === 'Sun'
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: isMatchday ? `${C.primary}0F` : undefined }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-bold" style={{ color: isMatchday ? C.primary : C.text }}>{d.day}</td>
                    <td className="px-4 py-3" style={{ color: isMatchday ? C.primary : C.textSec }}>{d.am}</td>
                    <td className="px-4 py-3" style={{ color: C.textSec }}>{d.pm}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: `${intColor}1a`, color: intColor }}>{d.intensity}</span></td>
                    <td className="px-4 py-3" style={{ color: C.muted }}>{d.focus}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Load */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-sm font-semibold" style={{ color: C.text }}>GPS Training Load (Yesterday)</p>
          <span className="text-xs" style={{ color: C.muted }}>{GPS_DATA.length} players tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Player', 'Distance', 'Hi-Speed', 'Sprints', 'Max Speed', 'Load'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GPS_DATA.map((g, i) => {
                const loadColor = g.load === 'optimal' ? C.good : g.load === 'high' ? C.warn : C.bad
                return (
                  <tr key={i} style={{ borderBottom: i < GPS_DATA.length - 1 ? `1px solid ${C.border}` : undefined }}>
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{g.player}</td>
                    <td className="px-4 py-3" style={{ color: C.textSec }}>{g.distance.toFixed(1)} km</td>
                    <td className="px-4 py-3" style={{ color: C.textSec }}>{g.hiSpeed.toLocaleString()} m</td>
                    <td className="px-4 py-3" style={{ color: C.textSec }}>{g.sprints}</td>
                    <td className="px-4 py-3" style={{ color: C.textSec }}>{g.maxSpeed.toFixed(1)} km/h</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg font-semibold uppercase" style={{ backgroundColor: `${loadColor}1a`, color: loadColor }}>{g.load}</span></td>
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
