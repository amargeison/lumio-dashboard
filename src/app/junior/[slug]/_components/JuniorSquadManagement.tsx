'use client'

// Junior Football — Squad Management (staff view).
//
// Replaces the inline placeholder that the staff-side dispatch of
// activeSection === 'squad' previously rendered. Parent / Guardian
// branch is unchanged and continues to render JuniorParentApp.
//
// Demo data is canned. Real data layer is Workstream B.

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import JuniorAddTeamModal from './JuniorAddTeamModal'
import JuniorAddPlayerModal from './JuniorAddPlayerModal'

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
  accentDeep: '#166534',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  blue:       '#3B82F6',
} as const

type Availability = 'available' | 'doubt' | 'out' | 'unavailable'

export interface SquadPlayer {
  id: string
  shirt: number | null
  name: string
  position: string
  availability: Availability
  attendancePct: number
  faRegistered: boolean
  restricted?: boolean
  note?: string
}

interface SquadTeam {
  id: string
  name: string
  ageBand: string
  coach: string
  manager: string
  capacity: number
  players: SquadPlayer[]
}

// Seeded teams. The component holds these in local state so Add Team
// can append at runtime (demo-state, vanishes on refresh). Squad size
// is computed from players.length at render time — no separate field.
const SEED_TEAMS: SquadTeam[] = [
  {
    id: 'u11-lions',
    name: 'U11 Lions',
    ageBand: 'U11',
    coach: 'Mark Hutchings',
    manager: 'Greta Yardley',
    capacity: 14,
    players: [
      { id: 'u11-theo-renshaw',    shirt: 1,  name: 'Theo Renshaw',    position: 'GK',  availability: 'available', attendancePct: 96, faRegistered: true },
      { id: 'u11-oscar-mbeki',     shirt: 2,  name: 'Oscar Mbeki',     position: 'DEF', availability: 'available', attendancePct: 92, faRegistered: true },
      { id: 'u11-reuben-hart',     shirt: 3,  name: 'Reuben Hart',     position: 'DEF', availability: 'doubt',     attendancePct: 88, faRegistered: true, note: 'Tight calf — reassess Thu' },
      { id: 'u11-sami-iqbal',      shirt: 4,  name: 'Sami Iqbal',      position: 'DEF', availability: 'available', attendancePct: 94, faRegistered: true },
      { id: 'u11-felix-yarrow',    shirt: 5,  name: 'Felix Yarrow',    position: 'MID', availability: 'available', attendancePct: 90, faRegistered: true },
      { id: 'u11-jack-carter',     shirt: 6,  name: 'Jack Carter',     position: 'MID', availability: 'available', attendancePct: 98, faRegistered: true },
      { id: 'u11-marco-pereira',   shirt: 7,  name: 'Marco Pereira',   position: 'MID', availability: 'available', attendancePct: 86, faRegistered: true },
      { id: 'u11-daniel-ohara',    shirt: 8,  name: 'Daniel O’Hara', position: 'MID', availability: 'available', attendancePct: 91, faRegistered: true },
      { id: 'u11-kai-linton',      shirt: 9,  name: 'Kai Linton',      position: 'FWD', availability: 'out',       attendancePct: 82, faRegistered: true, note: 'School fixture clash this Sat' },
      { id: 'u11-adam-sefer',      shirt: 10, name: 'Adam Sefer',      position: 'FWD', availability: 'available', attendancePct: 95, faRegistered: true },
      { id: 'u11-henry-brindle',   shirt: 11, name: 'Henry Brindle',   position: 'FWD', availability: 'available', attendancePct: 93, faRegistered: true },
      { id: 'u11-joel-tate',       shirt: null, name: 'Joel Tate',     position: 'MID', availability: 'unavailable', attendancePct: 64, faRegistered: false, note: 'FA registration pending — paperwork with County' },
    ],
  },
  {
    id: 'u13-falcons',
    name: 'U13 Falcons',
    ageBand: 'U13',
    coach: 'Greta Yardley',
    manager: 'Saoirse Lynch',
    capacity: 16,
    players: [
      { id: 'u13-amira-wells',       shirt: 1,  name: 'Amira Wells',     position: 'GK',  availability: 'available', attendancePct: 97, faRegistered: true },
      { id: 'u13-imogen-holt',       shirt: 2,  name: 'Imogen Holt',     position: 'DEF', availability: 'available', attendancePct: 90, faRegistered: true },
      { id: 'u13-bea-aldridge',      shirt: 3,  name: 'Bea Aldridge',    position: 'DEF', availability: 'available', attendancePct: 89, faRegistered: true },
      { id: 'u13-phoebe-carrick',    shirt: 4,  name: 'Phoebe Carrick',  position: 'DEF', availability: 'doubt',     attendancePct: 91, faRegistered: true, note: 'Mild ankle — light week, no Sat' },
      { id: 'u13-sophie-mahan',      shirt: 5,  name: 'Sophie Mahan',    position: 'MID', availability: 'available', attendancePct: 93, faRegistered: true },
      { id: 'u13-mia-carter',        shirt: 6,  name: 'Mia Carter',      position: 'MID', availability: 'available', attendancePct: 95, faRegistered: true },
      { id: 'u13-esme-penrose',      shirt: 7,  name: 'Esme Penrose',    position: 'MID', availability: 'available', attendancePct: 88, faRegistered: true },
      { id: 'u13-layla-quintero',    shirt: 8,  name: 'Layla Quintero',  position: 'MID', availability: 'available', attendancePct: 92, faRegistered: true },
      { id: 'u13-ruby-sanderson',    shirt: 9,  name: 'Ruby Sanderson',  position: 'FWD', availability: 'available', attendancePct: 94, faRegistered: true },
      { id: 'u13-tilly-brackenhall', shirt: 10, name: 'Tilly Brackenhall', position: 'FWD', availability: 'available', attendancePct: 96, faRegistered: true },
      { id: 'u13-nia-okonkwo',       shirt: 11, name: 'Nia Okonkwo',     position: 'FWD', availability: 'out',       attendancePct: 84, faRegistered: true, note: 'Family week — return Tue' },
    ],
  },
  {
    id: 'u14-eagles',
    name: 'U14 Eagles',
    ageBand: 'U14',
    coach: 'Dev Patel',
    manager: 'Kim Atherton',
    capacity: 16,
    players: [
      { id: 'u14-caleb-frazier',   shirt: 1, name: 'Caleb Frazier',  position: 'GK',  availability: 'available', attendancePct: 91, faRegistered: true },
      { id: 'u14-noah-baxter',     shirt: 4, name: 'Noah Baxter',    position: 'DEF', availability: 'available', attendancePct: 89, faRegistered: true, restricted: true, note: 'Imagery exclusion enforced across all surfaces.' },
      { id: 'u14-idris-khan',      shirt: 5, name: 'Idris Khan',     position: 'DEF', availability: 'available', attendancePct: 88, faRegistered: true },
      { id: 'u14-sebastian-cole',  shirt: 6, name: 'Sebastian Cole', position: 'MID', availability: 'available', attendancePct: 92, faRegistered: true },
      { id: 'u14-ben-morley',      shirt: 8, name: 'Ben Morley',     position: 'MID', availability: 'doubt',     attendancePct: 85, faRegistered: true, note: 'Growth-spurt monitor — coach + parent flagged' },
      { id: 'u14-toby-lockhart',   shirt: 9, name: 'Toby Lockhart',  position: 'FWD', availability: 'available', attendancePct: 90, faRegistered: true },
      { id: 'u14-arjun-mehta',     shirt: 10, name: 'Arjun Mehta',   position: 'FWD', availability: 'available', attendancePct: 93, faRegistered: true },
      { id: 'u14-riley-vasilakis', shirt: 11, name: 'Riley Vasilakis', position: 'FWD', availability: 'available', attendancePct: 87, faRegistered: true },
    ],
  },
]

const AVAIL_TONE: Record<Availability, { bg: string; fg: string; label: string }> = {
  available:   { bg: 'rgba(34,197,94,0.18)',  fg: T.good, label: 'Available' },
  doubt:       { bg: 'rgba(245,158,11,0.18)', fg: T.warn, label: 'Doubt' },
  out:         { bg: 'rgba(239,68,68,0.18)',  fg: T.bad,  label: 'Out' },
  unavailable: { bg: 'rgba(107,114,128,0.18)',fg: T.text4,label: 'Unavailable' },
}

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorSquadManagement({ session }: Props) {
  // Teams held in local state so Add Team can append at runtime. State
  // is component-local and vanishes on refresh (c.ii demo-state).
  const [teams, setTeams] = useState<SquadTeam[]>(SEED_TEAMS)
  const [teamId, setTeamId] = useState<string>(SEED_TEAMS[0].id)
  const [addTeamOpen, setAddTeamOpen] = useState(false)
  const [addPlayerOpen, setAddPlayerOpen] = useState(false)

  const team = teams.find(t => t.id === teamId) ?? teams[0]
  const squadSize = team.players.length

  const totals = team.players.reduce(
    (acc, p) => {
      acc[p.availability] += 1
      acc.faRegistered += p.faRegistered ? 1 : 0
      return acc
    },
    { available: 0, doubt: 0, out: 0, unavailable: 0, faRegistered: 0 },
  )

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
          Squad Management · Staff view
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {team.name} · {team.ageBand} · {squadSize} of {team.capacity} registered
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Roster, FA registration status and matchday availability. Coach
          {' '}<span style={{ color: T.text }}>{team.coach}</span> · Manager
          {' '}<span style={{ color: T.text }}>{team.manager}</span>.
          Signed in as <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {teams.map(t => {
          const active = t.id === teamId
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTeamId(t.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {t.name}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setAddTeamOpen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{
            backgroundColor: 'transparent',
            border: `1px dashed ${T.border}`,
            color: T.text3,
          }}
        >
          + Add team
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiTile label="Available" value={totals.available} tone="good" />
        <KpiTile label="Doubt" value={totals.doubt} tone="warn" />
        <KpiTile label="Out / unavailable" value={totals.out + totals.unavailable} tone="bad" />
        <KpiTile label="FA registered" value={`${totals.faRegistered}/${squadSize}`} tone="neutral" />
        <KpiTile label="Squad capacity" value={`${squadSize}/${team.capacity}`} tone="neutral" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.text3 }}>
          Roster · {team.name}
        </p>
        <button
          type="button"
          onClick={() => setAddPlayerOpen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          style={{
            backgroundColor: T.accentDeep,
            color: '#fff',
          }}
        >
          + Add player
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <table className="w-full text-xs">
          <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 font-semibold">Pos</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Attend.</th>
              <th className="px-3 py-2 font-semibold">FA</th>
              <th className="px-3 py-2 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {team.players.map((p) => {
              const tone = AVAIL_TONE[p.availability]
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <td className="px-3 py-2 font-mono" style={{ color: T.text4 }}>{p.shirt ?? '—'}</td>
                  <td className="px-3 py-2" style={{ color: T.text }}>
                    <span>{p.name}</span>
                    {p.restricted && (
                      <span
                        className="ml-2 text-[9px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: T.bad, border: `1px solid ${T.bad}55` }}
                      >
                        Restricted
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2" style={{ color: T.text3 }}>{p.position}</td>
                  <td className="px-3 py-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{ backgroundColor: tone.bg, color: tone.fg }}
                    >
                      {tone.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: p.attendancePct >= 90 ? T.good : p.attendancePct >= 80 ? T.warn : T.bad }}>
                    {p.attendancePct}%
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: p.faRegistered ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.18)',
                        color: p.faRegistered ? T.good : T.warn,
                      }}
                    >
                      {p.faRegistered ? 'Registered' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-3 py-2" style={{ color: T.text3 }}>{p.note ?? ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Saturday matchday selection · demo</p>
        <p className="text-xs leading-relaxed" style={{ color: T.text2 }}>
          Coaches confirm 9v9 or 11v11 selection from the available list above.
          Doubts re-screened on the Friday coach call. Players flagged{' '}
          <span style={{ color: T.bad, fontWeight: 600 }}>Restricted</span> appear
          on the team sheet but are excluded from any imagery surface — see
          Safeguarding for the audit log.
        </p>
      </div>

      {addTeamOpen && (
        <JuniorAddTeamModal
          existingAgeBands={teams.map(t => t.ageBand)}
          onClose={() => setAddTeamOpen(false)}
          onSubmit={(t) => {
            const newTeam: SquadTeam = {
              id: `team-${Date.now()}`,
              name: t.name,
              ageBand: t.ageBand,
              coach: t.coach,
              manager: t.manager,
              capacity: t.capacity,
              players: [],
            }
            setTeams(prev => [...prev, newTeam])
            setTeamId(newTeam.id)
          }}
        />
      )}

      {addPlayerOpen && (
        <JuniorAddPlayerModal
          teamName={team.name}
          onClose={() => setAddPlayerOpen(false)}
          onSubmit={(player) => {
            const newPlayer: SquadPlayer = {
              id: `player-${Date.now()}`,
              ...player,
            }
            setTeams(prev => prev.map(t =>
              t.id === teamId
                ? { ...t, players: [...t.players, newPlayer] }
                : t,
            ))
          }}
        />
      )}
    </div>
  )
}

function KpiTile({ label, value, tone }: { label: string; value: string | number; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colorMap: Record<typeof tone, string> = {
    good:    T.good,
    warn:    T.warn,
    bad:     T.bad,
    neutral: T.text,
  }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="text-2xl font-bold" style={{ color: colorMap[tone] }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{label}</div>
    </div>
  )
}
