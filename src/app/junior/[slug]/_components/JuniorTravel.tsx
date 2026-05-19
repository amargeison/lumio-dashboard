'use client'

// Junior Football — Travel & Car-Share.
//
// Per away-fixture car-share wizard. Pure volunteer-web glue: who can
// drive, how many seats, who needs a lift, and the simplest possible
// matched view so a team manager can have it sorted in five minutes.
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

interface Driver {
  parent: string
  car: string
  seats: number
  rider: string
  passengers: string[]
  collectFrom: string
  status: 'confirmed' | 'pending'
}

interface Need {
  player: string
  preferredCollect: string
  note?: string
}

interface AwayFixture {
  id: string
  date: string
  team: string
  opponent: string
  ground: string
  miles: number
  needed: number
  drivers: Driver[]
  needs: Need[]
}

const FIXTURES: AwayFixture[] = [
  {
    id: 'away-thornvale',
    date: 'Sat 24 May · KO 11:00',
    team: 'U13 Falcons',
    opponent: 'Thornvale Ladies U13',
    ground: 'Thornvale Park · 11 miles',
    miles: 11,
    needed: 12,
    drivers: [
      { parent: 'Saoirse Lynch',  car: 'Volvo XC60', seats: 4, rider: 'Esme Penrose',  passengers: ['Bea Aldridge', 'Phoebe Carrick', 'Tilly Brackenhall'], collectFrom: 'Oakridge Pitches · 09:45', status: 'confirmed' },
      { parent: 'Helena Mahan',   car: 'VW Touran',  seats: 5, rider: 'Sophie Mahan',  passengers: ['Mia Carter', 'Layla Quintero', 'Imogen Holt', 'Ruby Sanderson'], collectFrom: 'Oakridge Pitches · 09:45', status: 'confirmed' },
      { parent: 'Anna Penrose',   car: 'Ford Focus', seats: 3, rider: 'Esme (back-up)', passengers: ['Nia Okonkwo (subject to availability)'],                 collectFrom: 'Hartwell roundabout · 09:55', status: 'pending' },
    ],
    needs: [
      { player: 'Amira Wells',     preferredCollect: 'Oakridge Pitches', note: 'Parent working — needs full lift both ways.' },
    ],
  },
  {
    id: 'away-glenmoor',
    date: 'Sat 07 Jun · KO 13:00',
    team: 'U14 Eagles',
    opponent: 'Glenmoor Wanderers',
    ground: 'Glenmoor Athletic Ground · 22 miles',
    miles: 22,
    needed: 13,
    drivers: [
      { parent: 'Kim Atherton',  car: 'Skoda Kodiaq',  seats: 5, rider: 'Sebastian Cole', passengers: ['Toby Lockhart', 'Arjun Mehta', 'Caleb Frazier', 'Idris Khan'], collectFrom: 'Oakridge Pitches · 11:30', status: 'confirmed' },
      { parent: 'Idris Khan Snr',car: 'Nissan Qashqai',seats: 4, rider: '(driver)',       passengers: ['Riley Vasilakis', 'Ben Morley', 'Noah Baxter'],               collectFrom: 'Oakridge Pitches · 11:30', status: 'confirmed' },
      { parent: 'Arjun Mehta Snr',car: 'Tesla Model Y',seats: 4, rider: '(driver)',       passengers: ['Squad spares as needed'],                                    collectFrom: 'Oakridge Pitches · 11:45', status: 'pending' },
    ],
    needs: [
      { player: 'Two squad spares', preferredCollect: 'Oakridge Pitches', note: 'Manager confirms numbers Friday — flex with Mehta\'s spare seats.' },
    ],
  },
  {
    id: 'away-kingsmere',
    date: 'Sat 31 May · KO 09:30',
    team: 'U11 Lions',
    opponent: 'Kingsmere City',
    ground: 'Kingsmere Park · 8 miles',
    miles: 8,
    needed: 12,
    drivers: [
      { parent: 'Mark Hutchings', car: 'Land Rover Discovery', seats: 6, rider: '(coach + kit)', passengers: ['Theo Renshaw', 'Oscar Mbeki', 'Sami Iqbal', 'Felix Yarrow', 'Henry Brindle'], collectFrom: 'Oakridge Pitches · 08:30', status: 'confirmed' },
      { parent: 'Lou Carter',     car: 'Honda Civic', seats: 3, rider: 'Jack Carter', passengers: ['Marco Pereira', 'Daniel O\'Hara', 'Adam Sefer'],          collectFrom: 'Oakridge Pitches · 08:30', status: 'confirmed' },
    ],
    needs: [
      { player: 'Reuben Hart', preferredCollect: 'Oakridge Pitches' },
      { player: 'Kai Linton',  preferredCollect: 'Hartwell Recreation' },
    ],
  },
]

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorTravel({ session }: Props) {
  const [id, setId] = useState(FIXTURES[0].id)
  const fixture = FIXTURES.find(f => f.id === id) ?? FIXTURES[0]

  const totalSeats = fixture.drivers.reduce((s, d) => s + d.seats, 0)
  const totalPassengers = fixture.drivers.reduce((s, d) => s + d.passengers.length, 0)
  const stillNeeded = Math.max(0, fixture.needed - totalPassengers)
  const isParent = session.role === 'parent_guardian'

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
          Travel &amp; Car-Share
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {fixture.team} away · {fixture.opponent} · {fixture.miles} miles
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          The five-minute version of the car-share group chat. Who can
          drive, who needs a lift, who&rsquo;s in which car. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FIXTURES.map(f => {
          const active = f.id === id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setId(f.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {f.team} · {f.date.split(' · ')[0]}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Players to transport" value={`${totalPassengers}/${fixture.needed}`} tone={stillNeeded === 0 ? 'good' : 'warn'} />
        <Kpi label="Drivers" value={fixture.drivers.length} tone="neutral" />
        <Kpi label="Total seats" value={totalSeats} tone="neutral" />
        <Kpi label="Still needing a lift" value={stillNeeded} tone={stillNeeded === 0 ? 'good' : 'warn'} />
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Where + when</p>
        <p className="text-xs" style={{ color: T.text2 }}>
          {fixture.date} · {fixture.ground}
        </p>
      </div>

      <div>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Drivers · {fixture.drivers.length}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fixture.drivers.map((d, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <p className="text-sm font-bold" style={{ color: T.text }}>{d.parent}</p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: d.status === 'confirmed' ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.18)',
                    color: d.status === 'confirmed' ? T.good : T.warn,
                  }}
                >
                  {d.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </span>
              </div>
              <p className="text-[11px] mb-2" style={{ color: T.text4 }}>{d.car} · {d.seats} seats · collect at {d.collectFrom}</p>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.text4 }}>In the car</p>
              <ul className="space-y-0.5 text-[11px]" style={{ color: T.text2 }}>
                <li><span style={{ color: T.good }}>•</span> {d.rider} <span style={{ color: T.text4 }}>(own child)</span></li>
                {d.passengers.map((p, j) => (
                  <li key={j}><span style={{ color: T.good }}>•</span> {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {fixture.needs.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.bad}55` }}>
          <p className="text-sm font-bold mb-2" style={{ color: T.bad }}>Still need a lift</p>
          <ul className="space-y-1.5">
            {fixture.needs.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: T.text2 }}>
                <span className="mt-0.5" style={{ color: T.bad }}>•</span>
                <span>
                  <span style={{ color: T.text, fontWeight: 600 }}>{n.player}</span> — collect from {n.preferredCollect}
                  {n.note && <span style={{ color: T.text4 }}> · {n.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isParent && (
        <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.accent}55` }}>
          <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Offer a lift / ask for one</p>
          <p className="text-[11px] leading-relaxed mb-3" style={{ color: T.text2 }}>
            Two buttons, demo-safe. In live use these post into the team manager&rsquo;s inbox
            with the fixture pre-filled.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
            >
              I can drive · offer seats
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: T.panelAlt, color: T.text2, border: `1px solid ${T.borderSoft}` }}
            >
              I need a lift for my child
            </button>
          </div>
        </div>
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
