'use client'

// Junior Football — Matchday Operations.
//
// Grassroots-flavoured: per-fixture kit & equipment checklist, referee
// and pitch confirmation, "who's bringing what". NOT the WSL/Pro
// version of the same concept.
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

interface ChecklistItem {
  label: string
  responsible: string | null
  done: boolean
  note?: string
}

interface MatchdayFixture {
  id: string
  date: string
  kickoff: string
  team: string
  opponent: string
  venue: 'H' | 'A'
  ground: string
  refConfirmed: boolean
  refName: string | null
  pitchConfirmed: boolean
  pitchNote: string
  kit: ChecklistItem[]
  equipment: ChecklistItem[]
  ops: ChecklistItem[]
}

const FIXTURES: MatchdayFixture[] = [
  {
    id: 'sat-24-may-u11',
    date: 'Sat 24 May', kickoff: '09:30', team: 'U11 Lions', opponent: 'Harfield Juniors',
    venue: 'H', ground: 'Oakridge Community Pitches · Pitch 2',
    refConfirmed: true, refName: 'C. Whitfield (FA Level 5)',
    pitchConfirmed: true, pitchNote: 'Booked + paid · marked Friday',
    kit: [
      { label: 'Home shirts × 14',         responsible: 'L. Carter',  done: true },
      { label: 'GK shirt + alternative',   responsible: 'L. Carter',  done: true },
      { label: 'Black shorts × 14',        responsible: 'L. Carter',  done: true },
      { label: 'Green socks × 14',         responsible: 'L. Carter',  done: true },
      { label: 'Captain\'s armband',       responsible: 'M. Hutchings', done: true },
    ],
    equipment: [
      { label: 'Match balls (size 4) × 3',  responsible: 'M. Hutchings', done: true },
      { label: 'Bibs × 14 (mixed colour)',  responsible: 'M. Hutchings', done: true },
      { label: 'Cones (10) + flat markers', responsible: 'M. Hutchings', done: true },
      { label: 'Goalposts + nets',          responsible: 'Net team (Sefer)',   done: true,  note: 'In place from Friday session — confirm tight before kick-off.' },
      { label: 'Corner flags × 4',          responsible: 'Net team (Sefer)',   done: false, note: 'One flag broken last week — replacement ordered, due Thu.' },
      { label: 'Respect barrier rope',      responsible: 'Net team (Sefer)',   done: true },
      { label: 'First-aid kit + concussion card', responsible: 'M. Hutchings', done: true },
      { label: 'Water bottles × 14',        responsible: 'Parents (rotation)', done: true },
    ],
    ops: [
      { label: 'Squad WhatsApp sent (Fri 17:00)',     responsible: 'G. Yardley', done: true },
      { label: 'Team sheet printed × 2',               responsible: 'G. Yardley', done: false, note: 'Print Friday evening once availability locked.' },
      { label: 'Photography opt-outs confirmed',       responsible: 'G. Yardley', done: true, note: '0 opt-outs this fixture — all clips and photos approved.' },
      { label: 'Welfare Officer on site or contactable', responsible: 'J. Holroyd', done: true, note: 'On site from 09:00.' },
      { label: 'Refreshments / matchday tuck shop',    responsible: 'Parent rotation', done: true },
    ],
  },
  {
    id: 'sat-24-may-u13',
    date: 'Sat 24 May', kickoff: '11:00', team: 'U13 Falcons', opponent: 'Thornvale Ladies U13',
    venue: 'A', ground: 'Thornvale Park · 3G all-weather',
    refConfirmed: true, refName: 'M. Singh (FA Level 6)',
    pitchConfirmed: true, pitchNote: 'Away — confirmed by hosts Wednesday',
    kit: [
      { label: 'Away shirts (white) × 14',  responsible: 'A. Penrose', done: true },
      { label: 'GK shirt + alternative',    responsible: 'A. Penrose', done: true },
      { label: 'White shorts × 14',         responsible: 'A. Penrose', done: true },
      { label: 'White socks × 14',          responsible: 'A. Penrose', done: false, note: 'Three pairs missing — Mia and Sophie M. have spares.' },
    ],
    equipment: [
      { label: 'Match balls × 2 (warm-up)', responsible: 'G. Yardley', done: true },
      { label: 'Bibs × 14',                 responsible: 'G. Yardley', done: true },
      { label: 'First-aid kit',             responsible: 'G. Yardley', done: true },
      { label: 'Water (no fountain on site)', responsible: 'Parents (rotation)', done: true },
    ],
    ops: [
      { label: 'Car-share confirmed (Travel)', responsible: 'S. Lynch',  done: true,  note: '5 drivers, 14 seats, 12 needed — covered.' },
      { label: 'Squad WhatsApp sent',          responsible: 'S. Lynch',  done: true },
      { label: 'Team sheet printed × 2',       responsible: 'G. Yardley', done: false, note: 'Print Friday evening.' },
      { label: 'Photography opt-outs confirmed', responsible: 'G. Yardley', done: true, note: '1 opt-out (B. Aldridge) — coach + parent groups notified.' },
    ],
  },
  {
    id: 'sat-24-may-u14',
    date: 'Sat 24 May', kickoff: '13:00', team: 'U14 Eagles', opponent: 'Ridgefield Athletic',
    venue: 'H', ground: 'Oakridge Community Pitches · Pitch 1',
    refConfirmed: false, refName: null,
    pitchConfirmed: true, pitchNote: 'Booked · marked Friday',
    kit: [
      { label: 'Home shirts × 13',          responsible: 'K. Atherton', done: true },
      { label: 'GK shirt + alternative',    responsible: 'K. Atherton', done: true },
      { label: 'Black shorts × 13',         responsible: 'K. Atherton', done: true },
      { label: 'Green socks × 13',          responsible: 'K. Atherton', done: true },
    ],
    equipment: [
      { label: 'Match balls (size 5) × 3',  responsible: 'D. Patel',    done: true },
      { label: 'Bibs × 13',                 responsible: 'D. Patel',    done: true },
      { label: 'Goalposts + nets (full-size)', responsible: 'Net team (Khan + Mehta)', done: true },
      { label: 'Corner flags × 4',          responsible: 'Net team',    done: true },
      { label: 'First-aid kit + concussion card', responsible: 'D. Patel', done: true },
      { label: 'Restricted-imagery awareness', responsible: 'J. Holroyd', done: true, note: '1 restricted player (N. Baxter) in matchday squad — no club photographer.' },
    ],
    ops: [
      { label: 'REFEREE — chase booking',     responsible: 'P. Connolly', done: false, note: 'URGENT — booking pending since Mon. Chase Wed AM or arrange standby parent referee.' },
      { label: 'Squad WhatsApp sent',         responsible: 'K. Atherton', done: false, note: 'Send Friday once availability locked.' },
      { label: 'Team sheet printed × 2',      responsible: 'K. Atherton', done: false },
      { label: 'Welfare Officer on site',     responsible: 'J. Holroyd',  done: true, note: 'On site for the U14 kick-off given the restricted-player presence.' },
    ],
  },
]

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorMatchdayOps({ session }: Props) {
  const [id, setId] = useState(FIXTURES[0].id)
  const fixture = FIXTURES.find(f => f.id === id) ?? FIXTURES[0]

  const allItems = [...fixture.kit, ...fixture.equipment, ...fixture.ops]
  const done = allItems.filter(i => i.done).length
  const pct = allItems.length === 0 ? 0 : Math.round((done / allItems.length) * 100)

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
          Matchday Operations
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {fixture.team} vs {fixture.opponent} · {fixture.date} {fixture.kickoff}
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          The Saturday-morning checklist that stops bibs being left in the
          shed and the referee being a no-show. Signed in as{' '}
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
              {f.team} · {f.kickoff} ({f.venue})
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Checklist complete" value={`${done}/${allItems.length}`} tone={pct === 100 ? 'good' : pct >= 80 ? 'warn' : 'bad'} />
        <Kpi label="Referee" value={fixture.refConfirmed ? 'Confirmed' : 'Pending'} tone={fixture.refConfirmed ? 'good' : 'bad'} sub={fixture.refName ?? '—'} />
        <Kpi label="Pitch" value={fixture.pitchConfirmed ? 'Confirmed' : 'Pending'} tone={fixture.pitchConfirmed ? 'good' : 'bad'} sub={fixture.pitchNote} />
        <Kpi label="Venue" value={fixture.venue === 'H' ? 'Home' : 'Away'} tone="neutral" sub={fixture.ground} />
      </div>

      <ChecklistBlock title="Kit" items={fixture.kit} />
      <ChecklistBlock title="Equipment" items={fixture.equipment} />
      <ChecklistBlock title="Operations" items={fixture.ops} />
    </div>
  )
}

function ChecklistBlock({ title, items }: { title: string; items: ChecklistItem[] }) {
  const done = items.filter(i => i.done).length
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
        <p className="text-sm font-bold" style={{ color: T.text }}>{title}</p>
        <span className="text-[10px] font-mono" style={{ color: done === items.length ? T.good : T.warn }}>
          {done}/{items.length}
        </span>
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={i} className="px-4 py-2.5 flex items-start gap-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
            <span
              className="shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: it.done ? 'rgba(34,197,94,0.18)' : 'rgba(107,114,128,0.18)',
                color: it.done ? T.good : T.text4,
                border: `1px solid ${it.done ? T.good : T.borderSoft}`,
              }}
            >
              {it.done ? '✓' : ''}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs font-medium" style={{ color: it.done ? T.text2 : T.text }}>{it.label}</p>
                {it.responsible && (
                  <span className="text-[10px]" style={{ color: T.text4 }}>{it.responsible}</span>
                )}
              </div>
              {it.note && <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: T.text3 }}>{it.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colorMap: Record<typeof tone, string> = { good: T.good, warn: T.warn, bad: T.bad, neutral: T.text }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="text-lg font-bold" style={{ color: colorMap[tone] }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{label}</div>
      {sub && <div className="text-[10px] mt-1 leading-relaxed" style={{ color: T.text4 }}>{sub}</div>}
    </div>
  )
}
