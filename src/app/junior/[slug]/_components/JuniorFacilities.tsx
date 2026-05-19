'use client'

// Junior Football — Facilities.
//
// Pitch-access picture for a grassroots club that mostly doesn't own
// its pitches: training + matchday bookings, slot status, weather
// cancellations, and a basic equipment inventory. Practical, not a
// facility-management suite.
//
// Demo data is canned.

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

const T = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  blue:       '#3B82F6',
} as const

type BookingType = 'training' | 'match' | 'tournament' | 'camp'
type BookingStatus = 'confirmed' | 'tentative' | 'cancelled'

interface Booking {
  id: string
  date: string
  time: string
  team: string
  type: BookingType
  venue: string
  pitch: string
  surface: 'Grass' | '3G' | 'Astro'
  ownedByClub: boolean
  costGbp: number
  status: BookingStatus
  note?: string
}

const BOOKINGS: Booking[] = [
  { id: 'b-001', date: 'Mon 19 May', time: '17:30–18:30', team: 'U7 Cubs',     type: 'training', venue: 'Oakridge Community Pitches', pitch: 'Pitch 3 (5v5)',   surface: 'Grass', ownedByClub: false, costGbp: 18, status: 'confirmed' },
  { id: 'b-002', date: 'Mon 19 May', time: '18:30–19:30', team: 'U9 Tigers',   type: 'training', venue: 'Oakridge Community Pitches', pitch: 'Pitch 3 (7v7)',   surface: 'Grass', ownedByClub: false, costGbp: 22, status: 'confirmed' },
  { id: 'b-003', date: 'Tue 20 May', time: '18:00–19:30', team: 'U11 Lions',   type: 'training', venue: 'Hartwell College 3G',         pitch: 'Quarter pitch B', surface: '3G',    ownedByClub: false, costGbp: 65, status: 'confirmed', note: 'Late kick-off due to college fixture — confirmed Monday.' },
  { id: 'b-004', date: 'Wed 21 May', time: '17:30–18:30', team: 'U10 Hawks',   type: 'training', venue: 'Oakridge Community Pitches', pitch: 'Pitch 2 (7v7)',   surface: 'Grass', ownedByClub: false, costGbp: 22, status: 'confirmed' },
  { id: 'b-005', date: 'Wed 21 May', time: '19:00–20:30', team: 'U13 Falcons', type: 'training', venue: 'Hartwell College 3G',         pitch: 'Quarter pitch A', surface: '3G',    ownedByClub: false, costGbp: 65, status: 'confirmed' },
  { id: 'b-006', date: 'Thu 22 May', time: '18:30–20:00', team: 'U14 Eagles',  type: 'training', venue: 'Riverside Park',              pitch: 'Pitch 1 (9v9)',   surface: 'Grass', ownedByClub: false, costGbp: 28, status: 'tentative', note: 'Council booking — confirms 48 hr in advance.' },
  { id: 'b-007', date: 'Thu 22 May', time: '19:30–21:00', team: 'U16 Saints',  type: 'training', venue: 'Hartwell College 3G',         pitch: 'Half pitch',      surface: '3G',    ownedByClub: false, costGbp: 110, status: 'confirmed' },
  { id: 'b-008', date: 'Sat 24 May', time: '09:30 KO',    team: 'U11 Lions',   type: 'match',    venue: 'Oakridge Community Pitches', pitch: 'Pitch 2 (9v9)',   surface: 'Grass', ownedByClub: false, costGbp: 35, status: 'confirmed' },
  { id: 'b-009', date: 'Sat 24 May', time: '13:00 KO',    team: 'U14 Eagles',  type: 'match',    venue: 'Oakridge Community Pitches', pitch: 'Pitch 1 (11v11)', surface: 'Grass', ownedByClub: false, costGbp: 45, status: 'confirmed' },
  { id: 'b-010', date: 'Sat 17 May', time: '09:30 KO',    team: 'U9 Tigers',   type: 'match',    venue: 'Oakridge Community Pitches', pitch: 'Pitch 3 (7v7)',   surface: 'Grass', ownedByClub: false, costGbp: 30, status: 'cancelled', note: 'Pitch unplayable — waterlogged after Friday rain. Council confirmed Saturday 07:30.' },
]

const TYPE_LABEL: Record<BookingType, string> = { training: 'Training', match: 'Match', tournament: 'Tournament', camp: 'Camp' }

const STATUS_TONE: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
  confirmed: { label: 'Confirmed', bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  tentative: { label: 'Tentative', bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.18)',  fg: T.bad },
}

interface EquipmentItem {
  category: string
  item: string
  quantity: number
  condition: 'new' | 'good' | 'fair' | 'replace'
  location: string
  note?: string
}

const EQUIPMENT: EquipmentItem[] = [
  { category: 'Goals',     item: '5-a-side goals (mini)',       quantity: 4, condition: 'good',    location: 'Container · Pitch 3 corner' },
  { category: 'Goals',     item: '7v7 goals (folding)',         quantity: 4, condition: 'good',    location: 'Container · Pitch 3 corner' },
  { category: 'Goals',     item: '9v9 goals (alloy)',           quantity: 2, condition: 'fair',    location: 'Container · Pitch 3 corner', note: 'One frame bowed — replacement in the kit-fund campaign.' },
  { category: 'Goals',     item: '11v11 goals (full-size)',     quantity: 2, condition: 'good',    location: 'Pitch 1 (left in situ)' },
  { category: 'Nets',      item: 'Goal nets · 5v5',             quantity: 4, condition: 'good',    location: 'Container' },
  { category: 'Nets',      item: 'Goal nets · 7v7',             quantity: 4, condition: 'good',    location: 'Container' },
  { category: 'Nets',      item: 'Goal nets · 9v9 / 11v11',     quantity: 4, condition: 'fair',    location: 'Container', note: 'Two with patched repairs — still match-legal.' },
  { category: 'Match day', item: 'Corner flags · sets of 4',    quantity: 3, condition: 'fair',    location: 'Container', note: 'One flag broken last Saturday — replacement ordered Tue.' },
  { category: 'Match day', item: 'Respect barriers (rope)',     quantity: 2, condition: 'good',    location: 'Container' },
  { category: 'Match day', item: 'First-aid kits (full-spec)',  quantity: 9, condition: 'good',    location: 'One per age-band team', note: 'Each team manager checks monthly; restock from central store.' },
  { category: 'Balls',     item: 'Match balls · size 3',        quantity: 8, condition: 'good',    location: 'Container — Cubs/Pumas/Tigers' },
  { category: 'Balls',     item: 'Match balls · size 4',        quantity: 12, condition: 'good',   location: 'Container — Hawks/Lions/Wolves/Falcons' },
  { category: 'Balls',     item: 'Match balls · size 5',        quantity: 8, condition: 'good',    location: 'Container — Eagles/Saints' },
  { category: 'Training',  item: 'Training bibs (sets of 14)',  quantity: 6, condition: 'good',    location: 'Container — colour-sorted' },
  { category: 'Training',  item: 'Cones (small, mixed colour)', quantity: 200, condition: 'good',  location: 'Container · cone bags ×4' },
  { category: 'Training',  item: 'Flat markers',                quantity: 80, condition: 'good',   location: 'Container' },
  { category: 'Training',  item: 'Speed ladder',                quantity: 2, condition: 'fair',    location: 'Container', note: 'Replacement on the to-buy list.' },
]

const CONDITION_TONE: Record<EquipmentItem['condition'], { label: string; bg: string; fg: string }> = {
  new:     { label: 'New',         bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  good:    { label: 'Good',        bg: 'rgba(34,197,94,0.12)',  fg: T.good },
  fair:    { label: 'Fair',        bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  replace: { label: 'Replace',     bg: 'rgba(239,68,68,0.18)',  fg: T.bad },
}

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorFacilities({ session }: Props) {
  const [tab, setTab] = useState<'bookings' | 'equipment'>('bookings')

  const weeklySpend = BOOKINGS.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.costGbp, 0)
  const cancellations = BOOKINGS.filter(b => b.status === 'cancelled').length
  const tentative = BOOKINGS.filter(b => b.status === 'tentative').length

  const equipmentByCategory = EQUIPMENT.reduce<Record<string, EquipmentItem[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = []
    acc[e.category].push(e)
    return acc
  }, {})
  const replaceCount = EQUIPMENT.filter(e => e.condition === 'replace' || e.condition === 'fair').length

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
          Facilities
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {BOOKINGS.length} bookings this week · £{weeklySpend} pitch hire · {cancellations} cancelled
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          The pitch-access picture for a club that doesn&rsquo;t own its
          pitches — training + matchday bookings, surface mix, costs, and
          the equipment store in the container. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Bookings this week"   value={BOOKINGS.length}   tone="neutral" />
        <Kpi label="Pitch hire spend"      value={`£${weeklySpend}`} tone="neutral" />
        <Kpi label="Tentative bookings"    value={tentative}         tone={tentative === 0 ? 'good' : 'warn'} />
        <Kpi label="Cancellations"         value={cancellations}     tone={cancellations === 0 ? 'good' : 'warn'} />
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: T.border }}>
        {([
          { id: 'bookings'  as const, label: 'Pitch bookings',    icon: '🌱' },
          { id: 'equipment' as const, label: 'Equipment store',   icon: '📦', sub: replaceCount > 0 ? `${replaceCount} to review` : 'All in good order' },
        ]).map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold"
              style={{
                color: active ? T.good : T.text4,
                borderBottom: active ? `2px solid ${T.good}` : '2px solid transparent',
              }}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
              {'sub' in t && t.sub && <span className="ml-2 text-[10px]" style={{ color: T.text4 }}>· {t.sub}</span>}
            </button>
          )
        })}
      </div>

      {tab === 'bookings' && (
        <>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
                <tr className="text-left">
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Team</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Venue / Pitch</th>
                  <th className="px-3 py-2 font-semibold">Surface</th>
                  <th className="px-3 py-2 font-semibold">Cost</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {BOOKINGS.map(b => {
                  const s = STATUS_TONE[b.status]
                  return (
                    <tr key={b.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      <td className="px-3 py-2" style={{ color: T.text }}>
                        <div>{b.date}</div>
                        <div className="text-[10px] mt-0.5 font-mono" style={{ color: T.text4 }}>{b.time}</div>
                      </td>
                      <td className="px-3 py-2" style={{ color: T.text2 }}>{b.team}</td>
                      <td className="px-3 py-2" style={{ color: T.text3 }}>{TYPE_LABEL[b.type]}</td>
                      <td className="px-3 py-2" style={{ color: T.text2 }}>
                        <div>{b.venue}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: T.text4 }}>{b.pitch}</div>
                      </td>
                      <td className="px-3 py-2" style={{ color: T.text3 }}>{b.surface}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: T.text2 }}>£{b.costGbp}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
                        {b.note && <div className="text-[10px] mt-1 leading-relaxed" style={{ color: T.text3 }}>{b.note}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
            <p className="text-sm font-bold mb-1" style={{ color: T.text }}>Pitch inspections · before kick-off</p>
            <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>
              For weather-doubt fixtures, the FA&rsquo;s free <span style={{ color: T.text, fontWeight: 600 }}>PitchPower</span> app
              walks you through the official pitch-inspection checklist on your
              phone — referee, coach or volunteer can do it. Lumio doesn&rsquo;t
              duplicate that today; use PitchPower for the inspection itself and
              log the outcome (cancelled / playable) back here.
            </p>
          </div>
        </>
      )}

      {tab === 'equipment' && (
        <>
          {Object.entries(equipmentByCategory).map(([cat, items]) => (
            <div key={cat} className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <p className="text-sm font-bold" style={{ color: T.text }}>{cat}</p>
              </div>
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold">Item</th>
                    <th className="px-3 py-2 font-semibold">Qty</th>
                    <th className="px-3 py-2 font-semibold">Condition</th>
                    <th className="px-3 py-2 font-semibold">Location / note</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e, i) => {
                    const c = CONDITION_TONE[e.condition]
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                        <td className="px-3 py-2" style={{ color: T.text }}>{e.item}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: T.text2 }}>{e.quantity}</td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.fg }}>{c.label}</span>
                        </td>
                        <td className="px-3 py-2" style={{ color: T.text3 }}>
                          {e.location}
                          {e.note && <div className="text-[10px] mt-0.5" style={{ color: T.text4 }}>{e.note}</div>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colorMap: Record<typeof tone, string> = { good: T.good, warn: T.warn, bad: T.bad, neutral: T.text }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="text-2xl font-bold" style={{ color: colorMap[tone] }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{label}</div>
    </div>
  )
}
