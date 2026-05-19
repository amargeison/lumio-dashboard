'use client'

// Junior Football — Volunteer Roles.
//
// The differentiator. A real under-12 team runs on 11+ volunteer jobs;
// this module makes that web visible. Per-team list of roles, who
// holds each, visible gaps, and a simple per-fixture rota view.
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

interface RoleSlot {
  role: string
  /** null = unfilled. */
  holder: string | null
  /** Brief job description shown on hover/expand. */
  blurb: string
}

interface TeamRoles {
  id: string
  team: string
  roles: RoleSlot[]
}

const TEAMS: TeamRoles[] = [
  {
    id: 'u11-lions',
    team: 'U11 Lions',
    roles: [
      { role: 'Lead Coach',            holder: 'Mark Hutchings',  blurb: 'Plans sessions, runs the squad, manages matchday selection.' },
      { role: 'Assistant Coach',       holder: 'Tom Brindle',     blurb: 'Supports sessions and matchday, takes over when the lead is away.' },
      { role: 'Team Manager',          holder: 'Greta Yardley',   blurb: 'Comms with parents, fixture admin, kit and matchday logistics.' },
      { role: 'Welfare Officer',       holder: 'Jenna Holroyd',   blurb: 'Club-wide role; visible here per team for awareness.' },
      { role: 'Fixtures Secretary',    holder: 'Pete Connolly',   blurb: 'Liaises with the league, confirms pitches, books referees.' },
      { role: 'Referee Secretary',     holder: 'Pete Connolly',   blurb: 'Confirms a qualified referee for every home fixture.' },
      { role: 'Treasurer',             holder: 'Jo Sefer',        blurb: 'Subs, kit, tournament-entry fees, fundraising banking.' },
      { role: 'Statistician',          holder: null,               blurb: 'Records goals, assists, attendance — feeds the development tracker.' },
      { role: 'Kit Organiser',         holder: 'Lou Carter',      blurb: 'Match kit washed and ready, replaces lost socks, sources new sizes.' },
      { role: 'Net / Pitch team',      holder: 'Rotation (3 dads)', blurb: 'Puts up goals, nets, corner flags before kick-off; takes down after.' },
      { role: 'Tournament Organiser',  holder: 'Greta Yardley',   blurb: 'Enters summer tournaments, manages travel and gazebos.' },
      { role: 'Presentation Organiser',holder: 'Lou Carter',      blurb: 'End-of-season awards: trophies, certificates, venue.' },
    ],
  },
  {
    id: 'u13-falcons',
    team: 'U13 Falcons',
    roles: [
      { role: 'Lead Coach',            holder: 'Greta Yardley',   blurb: 'Plans sessions, runs the squad, manages matchday selection.' },
      { role: 'Assistant Coach',       holder: 'Saoirse Lynch',   blurb: 'Supports sessions and matchday, takes over when the lead is away.' },
      { role: 'Team Manager',          holder: 'Saoirse Lynch',   blurb: 'Comms with parents, fixture admin, kit and matchday logistics.' },
      { role: 'Welfare Officer',       holder: 'Jenna Holroyd',   blurb: 'Club-wide role; visible here per team for awareness.' },
      { role: 'Fixtures Secretary',    holder: 'Pete Connolly',   blurb: 'Liaises with the league, confirms pitches, books referees.' },
      { role: 'Referee Secretary',     holder: 'Pete Connolly',   blurb: 'Confirms a qualified referee for every home fixture.' },
      { role: 'Treasurer',             holder: 'Helena Mahan',    blurb: 'Subs, kit, tournament-entry fees, fundraising banking.' },
      { role: 'Statistician',          holder: 'Helena Mahan',    blurb: 'Records goals, assists, attendance — feeds the development tracker.' },
      { role: 'Kit Organiser',         holder: 'Anna Penrose',    blurb: 'Match kit washed and ready, replaces lost socks, sources new sizes.' },
      { role: 'Net / Pitch team',      holder: null,               blurb: 'Puts up goals, nets, corner flags before kick-off; takes down after.' },
      { role: 'Tournament Organiser',  holder: 'Anna Penrose',    blurb: 'Enters summer tournaments, manages travel and gazebos.' },
      { role: 'Presentation Organiser',holder: null,               blurb: 'End-of-season awards: trophies, certificates, venue.' },
    ],
  },
  {
    id: 'u14-eagles',
    team: 'U14 Eagles',
    roles: [
      { role: 'Lead Coach',            holder: 'Dev Patel',       blurb: 'Plans sessions, runs the squad, manages matchday selection.' },
      { role: 'Assistant Coach',       holder: 'Idris Khan Snr',  blurb: 'Supports sessions and matchday, takes over when the lead is away.' },
      { role: 'Team Manager',          holder: 'Kim Atherton',    blurb: 'Comms with parents, fixture admin, kit and matchday logistics.' },
      { role: 'Welfare Officer',       holder: 'Jenna Holroyd',   blurb: 'Club-wide role; visible here per team for awareness.' },
      { role: 'Fixtures Secretary',    holder: 'Pete Connolly',   blurb: 'Liaises with the league, confirms pitches, books referees.' },
      { role: 'Referee Secretary',     holder: 'Pete Connolly',   blurb: 'Confirms a qualified referee for every home fixture.' },
      { role: 'Treasurer',             holder: 'Kim Atherton',    blurb: 'Subs, kit, tournament-entry fees, fundraising banking.' },
      { role: 'Statistician',          holder: 'Arjun Mehta Snr', blurb: 'Records goals, assists, attendance — feeds the development tracker.' },
      { role: 'Kit Organiser',         holder: 'Kim Atherton',    blurb: 'Match kit washed and ready, replaces lost socks, sources new sizes.' },
      { role: 'Net / Pitch team',      holder: 'Rotation (4 parents)', blurb: 'Puts up goals, nets, corner flags before kick-off; takes down after.' },
      { role: 'Tournament Organiser',  holder: 'Kim Atherton',    blurb: 'Enters summer tournaments, manages travel and gazebos.' },
      { role: 'Presentation Organiser',holder: 'Idris Khan Snr',  blurb: 'End-of-season awards: trophies, certificates, venue.' },
    ],
  },
]

interface RotaSlot {
  date: string
  fixture: string
  team: string
  refConfirmed: boolean
  netsAndPitch: string | null
  firstAid: string
  notes: string
}

const ROTA: RotaSlot[] = [
  { date: 'Sat 24 May · 09:30 (H)', fixture: 'U11 Lions vs Harfield Juniors', team: 'U11 Lions',   refConfirmed: true,  netsAndPitch: 'Sefer + Brindle + Pereira',  firstAid: 'M. Hutchings (FA Level 1)', notes: 'Coach is rostered first-aider as Welfare not on site.' },
  { date: 'Sat 24 May · 11:00 (A)', fixture: 'U13 Falcons vs Thornvale Ladies U13', team: 'U13 Falcons', refConfirmed: true,  netsAndPitch: null,                          firstAid: 'G. Yardley (FA Level 1)',    notes: 'Away — pitch handled by host.' },
  { date: 'Sat 24 May · 13:00 (H)', fixture: 'U14 Eagles vs Ridgefield Athletic',   team: 'U14 Eagles',  refConfirmed: false, netsAndPitch: 'Khan Snr + Mehta Snr',         firstAid: 'D. Patel (FA Level 2)',      notes: 'Referee booking pending — chase Wed.' },
  { date: 'Sun 25 May · 10:00 (A)', fixture: 'U9 Tigers · 5-team festival',         team: 'U9 Tigers',   refConfirmed: true,  netsAndPitch: null,                          firstAid: 'S. Mills + 1 parent',        notes: 'Festival — host runs everything; we bring the squad.' },
]

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorVolunteerRoles({ session }: Props) {
  const [teamId, setTeamId] = useState(TEAMS[0].id)
  const [tab, setTab] = useState<'roles' | 'rota'>('roles')
  const team = TEAMS.find(t => t.id === teamId) ?? TEAMS[0]

  const filled = team.roles.filter(r => r.holder !== null).length
  const gaps = team.roles.length - filled

  const allGaps = TEAMS.flatMap(t => t.roles.filter(r => r.holder === null).map(r => ({ team: t.team, role: r.role })))

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
          Volunteer Roles
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {team.team} · {filled}/{team.roles.length} roles filled · {gaps} gap{gaps === 1 ? '' : 's'}
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          A real junior team takes 10–12 people to run. This is the map of
          who&rsquo;s on each job, which jobs are open, and who&rsquo;s on this
          weekend&rsquo;s rota. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TEAMS.map(t => {
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
              {t.team}
            </button>
          )
        })}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: T.border }}>
        {([
          { id: 'roles' as const, label: 'Role assignments', icon: '🤝' },
          { id: 'rota' as const,  label: 'This weekend\'s rota', icon: '📋' },
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
            </button>
          )
        })}
      </div>

      {tab === 'roles' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {team.roles.map((r, i) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{
                  backgroundColor: T.panel,
                  border: `1px solid ${r.holder === null ? T.bad + '88' : T.border}`,
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-bold" style={{ color: T.text }}>{r.role}</p>
                  {r.holder === null ? (
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: T.bad }}>
                      Gap
                    </span>
                  ) : (
                    <span className="text-[10px]" style={{ color: T.good }}>✓ Filled</span>
                  )}
                </div>
                <p className="text-xs mb-1" style={{ color: T.text2 }}>
                  {r.holder ?? <span style={{ color: T.bad, fontStyle: 'italic' }}>Open — message the parent group</span>}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: T.text3 }}>{r.blurb}</p>
              </div>
            ))}
          </div>

          {allGaps.length > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Club-wide gaps · {allGaps.length}</p>
              <ul className="space-y-1.5">
                {allGaps.map((g, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-xs" style={{ color: T.text2 }}>
                    <span>{g.team} · <span style={{ color: T.bad }}>{g.role}</span></span>
                    <span className="text-[10px]" style={{ color: T.text4 }}>open</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {tab === 'rota' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <table className="w-full text-xs">
            <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold">Fixture</th>
                <th className="px-3 py-2 font-semibold">Referee</th>
                <th className="px-3 py-2 font-semibold">Nets &amp; Pitch</th>
                <th className="px-3 py-2 font-semibold">First aid</th>
                <th className="px-3 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ROTA.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <td className="px-3 py-2" style={{ color: T.text }}>
                    <div>{r.fixture}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: T.text4 }}>{r.date}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: r.refConfirmed ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.18)',
                        color: r.refConfirmed ? T.good : T.warn,
                      }}
                    >
                      {r.refConfirmed ? 'Confirmed' : 'Chase'}
                    </span>
                  </td>
                  <td className="px-3 py-2" style={{ color: T.text2 }}>{r.netsAndPitch ?? <span style={{ color: T.text4 }}>—</span>}</td>
                  <td className="px-3 py-2" style={{ color: T.text2 }}>{r.firstAid}</td>
                  <td className="px-3 py-2" style={{ color: T.text3 }}>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
