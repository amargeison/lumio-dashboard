'use client'

// Junior Football — Tours & Camps.
//
// Half-term + summer holiday camps and end-of-season tours/festivals.
// For grassroots: also a club revenue line, so a small "income to
// date" figure per camp is appropriate, kept light.
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

type Kind = 'camp' | 'tour'
type Status = 'upcoming' | 'open' | 'filling' | 'full' | 'closed'

interface CampOrTour {
  id: string
  kind: Kind
  name: string
  blurb: string
  dates: string
  duration: string
  ageGroups: string
  venue: string
  costPerChild: number
  /** Includes travel + accommodation for tours; sessions + tuck shop for camps. */
  costNote: string
  booked: number
  capacity: number
  incomeToDate: number
  status: Status
  organiser: string
}

const ITEMS: CampOrTour[] = [
  {
    id: 'feb-half-term',
    kind: 'camp',
    name: 'February half-term camp',
    blurb: 'Three days at the pitches over half-term — small-sided games, skills, a bit of fun. Open to children of any club ability; ours and non-members welcome.',
    dates: 'Mon 16 – Wed 18 Feb',
    duration: '3 days · 9:30–15:30',
    ageGroups: 'U7 · U8 · U9 · U10 · U11 · U12',
    venue: 'Oakridge Community Pitches',
    costPerChild: 45,
    costNote: 'Includes daily tuck shop + camp T-shirt.',
    booked: 32, capacity: 50, incomeToDate: 1440,
    status: 'filling',
    organiser: 'Greta Yardley · Mark Hutchings',
  },
  {
    id: 'easter-skills',
    kind: 'camp',
    name: 'Easter skills camp',
    blurb: 'Two-day technical camp focused on first touch, 1v1 attacking and shooting. Smaller numbers, more coach contact time.',
    dates: 'Mon 06 – Tue 07 Apr',
    duration: '2 days · 10:00–15:00',
    ageGroups: 'U7 · U8 · U9 · U10',
    venue: 'Oakridge Community Pitches',
    costPerChild: 35,
    costNote: 'Includes lunch + drink each day.',
    booked: 18, capacity: 40, incomeToDate: 630,
    status: 'open',
    organiser: 'Mark Hutchings',
  },
  {
    id: 'summer-club',
    kind: 'camp',
    name: 'Summer holiday club',
    blurb: 'Full five-day summer week. Mornings on technique, afternoons tournaments and games. Lunch included. Sells out every year — book early.',
    dates: 'Mon 27 – Fri 31 Jul',
    duration: '5 days · 9:00–16:00',
    ageGroups: 'U7 · U8 · U9 · U10 · U11 · U12 · U13 · U14',
    venue: 'Oakridge Community Pitches',
    costPerChild: 80,
    costNote: 'Includes lunch, snacks, end-of-week trophy.',
    booked: 0, capacity: 60, incomeToDate: 0,
    status: 'upcoming',
    organiser: 'Greta Yardley',
  },
  {
    id: 'cornwall-tour',
    kind: 'tour',
    name: 'Cornwall end-of-season tour',
    blurb: 'Weekend trip to the Cornwall Coast Festival. Two-night stay, six games each across Saturday + Sunday, beach session Saturday afternoon. The trip the older kids talk about all season.',
    dates: 'Fri 19 – Sun 21 Jun',
    duration: '3 days · 2 nights',
    ageGroups: 'U11 · U12 · U13 · U14',
    venue: 'Cornwall Coast Festival · Newquay',
    costPerChild: 180,
    costNote: 'Includes coach travel, 2 nights B&amp;B (parents add own room), festival entry, club polo shirt.',
    booked: 24, capacity: 30, incomeToDate: 4320,
    status: 'filling',
    organiser: 'Kim Atherton · Dev Patel',
  },
]

const STATUS_TONE: Record<Status, { label: string; bg: string; fg: string }> = {
  upcoming: { label: 'Booking opens soon', bg: 'rgba(59,130,246,0.18)', fg: T.blue },
  open:     { label: 'Open',                bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  filling:  { label: 'Filling',             bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  full:     { label: 'Full',                bg: 'rgba(239,68,68,0.18)',  fg: T.bad },
  closed:   { label: 'Closed',              bg: 'rgba(107,114,128,0.18)',fg: T.text4 },
}

const KIND_LABEL: Record<Kind, string> = { camp: 'Camp', tour: 'Tour' }

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorToursCamps({ session }: Props) {
  const [filter, setFilter] = useState<'all' | Kind>('all')
  const filtered = filter === 'all' ? ITEMS : ITEMS.filter(i => i.kind === filter)

  const totals = ITEMS.reduce(
    (acc, i) => {
      acc.income += i.incomeToDate
      acc.booked += i.booked
      acc.capacity += i.capacity
      return acc
    },
    { income: 0, booked: 0, capacity: 0 },
  )

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
          Tours &amp; Camps
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {ITEMS.length} on the calendar · {totals.booked}/{totals.capacity} places booked · £{totals.income.toLocaleString()} income to date
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Holiday camps and end-of-season tours. Camps double as a club
          revenue line; tours are the trip the older squads remember.
          Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'camp', 'tour'] as const).map(f => {
          const active = filter === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {f === 'all' ? 'All' : f === 'camp' ? 'Camps' : 'Tours'}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(i => {
          const pct = i.capacity === 0 ? 0 : Math.round((i.booked / i.capacity) * 100)
          const s = STATUS_TONE[i.status]
          return (
            <div key={i.id} className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <p className="text-sm font-bold" style={{ color: T.text }}>{i.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.fg }}>
                  {s.label}
                </span>
              </div>
              <p className="text-[11px] mb-2" style={{ color: T.text4 }}>
                {KIND_LABEL[i.kind]} · {i.dates} · {i.duration}
              </p>
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: T.text2 }}>{i.blurb}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                <div><span style={{ color: T.text4 }}>Venue:</span> <span style={{ color: T.text2 }}>{i.venue}</span></div>
                <div><span style={{ color: T.text4 }}>Age groups:</span> <span style={{ color: T.text2 }}>{i.ageGroups}</span></div>
                <div><span style={{ color: T.text4 }}>Cost per child:</span> <span style={{ color: T.text2 }}>£{i.costPerChild}</span></div>
                <div><span style={{ color: T.text4 }}>Organiser:</span> <span style={{ color: T.text2 }}>{i.organiser}</span></div>
              </div>
              <p className="text-[10px] italic mb-3" style={{ color: T.text3 }}>{i.costNote}</p>

              <div className="flex items-center justify-between text-[11px] mb-1">
                <span style={{ color: T.text3 }}>Places: {i.booked}/{i.capacity}</span>
                <span style={{ color: T.good }}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: T.borderSoft }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: T.good }} />
              </div>

              {!isParent && (
                <p className="text-[10px]" style={{ color: T.text4 }}>
                  Income to date: <span style={{ color: T.text2, fontWeight: 600 }}>£{i.incomeToDate.toLocaleString()}</span>
                </p>
              )}

              {isParent && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={i.status === 'closed' || i.status === 'full' || i.status === 'upcoming'}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                    style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
                  >
                    {i.status === 'upcoming' ? 'Booking opens soon' : i.status === 'full' ? 'Full' : 'Book your child in'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-bold mb-1" style={{ color: T.text }}>About camps and tours</p>
        <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>
          Camps are open to children outside the club too — pass the link to school
          friends, neighbours, scout groups. The end-of-season tour is members-only;
          age-group teams travel together. All staff working on a camp or tour
          hold a current DBS and FA Safeguarding qualification; first-aid cover is
          on-site for every session.
        </p>
      </div>
    </div>
  )
}
