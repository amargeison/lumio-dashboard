'use client'

import { useState } from 'react'
import {
  Heart, CheckCircle2, BarChart3, Eye, Shield, Activity, AlertCircle,
} from 'lucide-react'

// Women's Medical Hub — clinical injury management, GPS load monitoring,
// return-to-play pipeline. Pink-themed. Demo data sourced from
// WOMENS_INJURIES in womens-dashboard-data.ts pattern (replicated inline
// to keep this view self-contained — no Pro file imports).

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
  cyan: '#06B6D4',
  blue: '#3B82F6',
} as const

type InjuryRow = { player: string; type: string; phase: string; expectedReturn: string }
type GpsRow = { player: string; distance: number; hiSpeed: number; sprints: number; maxSpeed: number; load: 'optimal' | 'high' | 'overload' }
type RiskRow = { player: string; acwr: number; load: number; note: string }

// Demo: Oakridge Women FC injury data — mirrors womens-dashboard-data.ts WOMENS_INJURIES
// but expanded for the Medical Hub UI which needs treatment phase + expected return strings.
const INJURIES: InjuryRow[] = [
  { player: 'S. Davies',  type: 'MCL Grade 1',               phase: 'Rehab Phase 2',  expectedReturn: '18 May 2026' },
  { player: 'R. Okafor',  type: 'Concussion (Day 3)',         phase: 'GRTP Step 2',    expectedReturn: '22 May 2026' },
  { player: 'J. Morgan',  type: 'ACL Reconstruction',         phase: 'Late stage',     expectedReturn: '15 Sep 2026' },
  { player: 'B. Chen',    type: 'Calf strain (Grade 1)',      phase: 'Modified',       expectedReturn: '12 May 2026' },
]

const GPS_DATA: GpsRow[] = [
  { player: 'L. Barker',     distance: 11.2, hiSpeed: 920,  sprints: 26, maxSpeed: 29.4, load: 'high' },
  { player: 'D. Morris',     distance: 10.6, hiSpeed: 880,  sprints: 32, maxSpeed: 30.6, load: 'optimal' },
  { player: 'Z. Williams',   distance: 10.4, hiSpeed: 810,  sprints: 28, maxSpeed: 30.2, load: 'optimal' },
  { player: 'J. Tilley',     distance: 10.8, hiSpeed: 1020, sprints: 35, maxSpeed: 30.8, load: 'overload' },
  { player: 'P. Granger',    distance: 10.8, hiSpeed: 740,  sprints: 22, maxSpeed: 28.4, load: 'optimal' },
  { player: 'K. Okonkwo',    distance: 10.6, hiSpeed: 860,  sprints: 30, maxSpeed: 30.6, load: 'high' },
  { player: 'C. Porter',     distance: 9.6,  hiSpeed: 680,  sprints: 22, maxSpeed: 29.0, load: 'optimal' },
  { player: 'M. Reid',       distance: 9.4,  hiSpeed: 580,  sprints: 18, maxSpeed: 27.6, load: 'optimal' },
]

const RISK_ALERTS: RiskRow[] = [
  { player: 'J. Tilley',     acwr: 1.42, load: 510, note: 'Three consecutive match starts + Wednesday cup tie. Reduce intensity Thu; manage match-load Sun.' },
  { player: 'L. Barker',     acwr: 1.21, load: 458, note: 'Returning from heel issue — monitor carefully. One training day modified this week.' },
  { player: 'K. Okonkwo',    acwr: 1.18, load: 442, note: 'Stable. Continue current load plan.' },
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

export default function WomensMedicalHubView() {
  const [medToast, setMedToast] = useState<string | null>(null)
  function medAction(l: string) { setMedToast(`${l} — opening workflow...`); setTimeout(() => setMedToast(null), 2500) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Medical Hub</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>Clinical injury management, rehab phases, GPS load monitoring, and return-to-play pipeline.</p>
      </div>

      {medToast && (
        <div className="rounded-lg p-3" style={{ backgroundColor: `${C.primary}1A`, border: `1px solid ${C.primary}` }}>
          <p className="text-xs font-semibold" style={{ color: C.primary }}>{medToast}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { l: 'Log Injury',          i: Heart },
          { l: 'Return to Play',      i: CheckCircle2 },
          { l: 'Load Report',         i: BarChart3 },
          { l: 'Screen Player',       i: Eye },
          { l: 'Medical Clearance',   i: Shield },
          { l: 'GPS Report',          i: Activity },
        ].map(a => (
          <button key={a.l} onClick={() => medAction(a.l)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: C.primary, color: '#fff' }}>
            <a.i size={12} />{a.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Currently Injured"   value={String(INJURIES.length)} icon={Heart}          color={C.bad} />
        <StatCard label="Modified Training"   value="2"                       icon={Activity}       color={C.cyan} />
        <StatCard label="Full Recovery (7d)"  value="1"                       icon={CheckCircle2}   color={C.good} />
        <StatCard label="Season Injuries"     value="11"                      icon={AlertCircle}    color={C.warn} />
      </div>

      {/* Injury Tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-sm font-semibold" style={{ color: C.text }}>Injury Tracker</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Player', 'Injury', 'Treatment Phase', 'Expected Return', 'Days Out'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INJURIES.map((inj, i) => {
                const returnDate = new Date(inj.expectedReturn.replace(/(\d+) (\w+) (\d+)/, '$2 $1, $3'))
                const daysOut = Math.max(0, Math.ceil((returnDate.getTime() - Date.now()) / 86400000))
                return (
                  <tr key={i} style={{ borderBottom: i < INJURIES.length - 1 ? `1px solid ${C.border}` : undefined }}>
                    <td className="px-5 py-3 font-medium" style={{ color: C.text }}>{inj.player}</td>
                    <td className="px-5 py-3" style={{ color: C.bad }}>{inj.type}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-lg text-xs" style={{ backgroundColor: `${C.cyan}1F`, color: C.cyan }}>{inj.phase}</span></td>
                    <td className="px-5 py-3" style={{ color: C.warn }}>{inj.expectedReturn}</td>
                    <td className="px-5 py-3 font-bold" style={{ color: daysOut <= 7 ? C.good : daysOut <= 14 ? C.warn : C.bad }}>{daysOut}d</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Training Load */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-sm font-semibold" style={{ color: C.text }}>GPS Training Load (Yesterday)</p>
          <span className="text-xs" style={{ color: C.muted }}>{GPS_DATA.length} players tracked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Player', 'Distance (km)', 'Hi-Speed (m)', 'Sprints', 'Max Speed (km/h)', 'Load'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GPS_DATA.map((g, i) => {
                const loadColor = g.load === 'optimal' ? C.good : g.load === 'high' ? C.warn : C.bad
                return (
                  <tr key={i} style={{ borderBottom: i < GPS_DATA.length - 1 ? `1px solid ${C.border}` : undefined }}>
                    <td className="px-5 py-3 font-medium" style={{ color: C.text }}>{g.player}</td>
                    <td className="px-5 py-3" style={{ color: C.textSec }}>{g.distance.toFixed(1)}</td>
                    <td className="px-5 py-3" style={{ color: C.textSec }}>{g.hiSpeed.toLocaleString()}</td>
                    <td className="px-5 py-3" style={{ color: C.textSec }}>{g.sprints}</td>
                    <td className="px-5 py-3" style={{ color: C.textSec }}>{g.maxSpeed.toFixed(1)}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-semibold uppercase" style={{ backgroundColor: `${loadColor}1A`, color: loadColor }}>{g.load}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACWR Risk Alerts */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.bad}66` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: `${C.bad}0A` }}>
          <div className="flex items-center gap-2">
            <Activity size={14} style={{ color: C.bad }} />
            <p className="text-sm font-semibold" style={{ color: C.text }}>GPS Injury Risk — ACWR Monitoring</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase" style={{ backgroundColor: `${C.bad}26`, color: C.bad }}>Live GPS Data</span>
        </div>
        <div className="p-5 space-y-3">
          {RISK_ALERTS.map((p, i) => {
            const color = p.acwr > 1.3 ? C.bad : C.warn
            const label = p.acwr > 1.3 ? 'HIGH RISK' : 'CAUTION'
            return (
              <div key={i} className="rounded-lg p-4" style={{ backgroundColor: '#0A0B10', border: `1px solid ${color}33` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{p.acwr > 1.3 ? '🔴' : '🟡'}</span>
                    <p className="text-sm font-bold" style={{ color: C.text }}>{p.player}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${color}1A`, color }}>{label}</span>
                    <span className="text-xs font-mono" style={{ color }}>ACWR {p.acwr.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: C.textSec }}>{p.note}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: C.muted }}>Load: {p.load}</span>
                  <button onClick={() => medAction('Add medical note')} className="text-xs font-semibold" style={{ color: C.primary }}>+ Add Note</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
