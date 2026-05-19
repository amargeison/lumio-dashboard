'use client'

// Junior Football — Fixtures & Results.
//
// Coaches, parents and welfare officers see fixtures, results and the
// league table without leaving Lumio. The data source is pluggable —
// FA Full-Time embed feed, a league-website link, or coach manual
// entry. This canned demo shows what each source looks like and what
// the table / fixtures / results surface looks like once data is in.

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

type Source = 'fa_full_time' | 'league_website' | 'manual'

const SOURCE_LABEL: Record<Source, string> = {
  fa_full_time:   'FA Full-Time feed',
  league_website: 'League website link',
  manual:         'Coach manual entry',
}

const SOURCE_HINT: Record<Source, string> = {
  fa_full_time:   'Live feed from the FA Full-Time system. Best for affiliated leagues — fixtures + results sync automatically.',
  league_website: 'A link to the league\'s own results page. Use when the league publishes fixtures there and not on Full-Time.',
  manual:         'Coach or team manager enters fixtures, results and the table by hand. Use for friendlies, tournaments or leagues without an online presence.',
}

interface Fixture {
  date: string
  kickoff: string
  team: string
  opponent: string
  comp: string
  venue: 'H' | 'A' | 'N'
  ground: string
  status: 'scheduled' | 'confirmed' | 'tbc'
}

interface Result {
  date: string
  team: string
  opponent: string
  comp: string
  venue: 'H' | 'A' | 'N'
  homeFor: number
  homeAgainst: number
  outcome: 'W' | 'D' | 'L'
}

interface TableRow {
  pos: number
  team: string
  p: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  pts: number
}

const FIXTURES: Fixture[] = [
  { date: 'Sat 24 May', kickoff: '09:30', team: 'U11 Lions',   opponent: 'Harfield Juniors',     comp: 'Surrey Youth League', venue: 'H', ground: 'Oakridge Community Pitches', status: 'confirmed' },
  { date: 'Sat 24 May', kickoff: '11:00', team: 'U13 Falcons', opponent: 'Thornvale Ladies U13', comp: 'Surrey Youth League', venue: 'A', ground: 'Thornvale Park',              status: 'confirmed' },
  { date: 'Sat 24 May', kickoff: '13:00', team: 'U14 Eagles',  opponent: 'Ridgefield Athletic',  comp: 'Surrey Youth League', venue: 'H', ground: 'Oakridge Community Pitches', status: 'confirmed' },
  { date: 'Sun 25 May', kickoff: '10:00', team: 'U9 Tigers',   opponent: 'Mini-tournament (5 teams)', comp: 'Festival',          venue: 'A', ground: 'Hartwell Recreation',         status: 'tbc' },
  { date: 'Sat 31 May', kickoff: '09:30', team: 'U11 Lions',   opponent: 'Kingsmere City',       comp: 'Surrey Youth League', venue: 'A', ground: 'Kingsmere Park',              status: 'scheduled' },
  { date: 'Sat 31 May', kickoff: '11:00', team: 'U13 Falcons', opponent: 'Ashbourne Juniors',    comp: 'Surrey Youth League', venue: 'H', ground: 'Oakridge Community Pitches', status: 'scheduled' },
  { date: 'Sat 07 Jun', kickoff: '13:00', team: 'U14 Eagles',  opponent: 'Glenmoor Wanderers',   comp: 'Surrey Youth League', venue: 'A', ground: 'Glenmoor Athletic Ground',    status: 'scheduled' },
]

const RESULTS: Result[] = [
  { date: 'Sat 17 May', team: 'U11 Lions',   opponent: 'Castleton Juniors',    comp: 'Surrey Youth League', venue: 'H', homeFor: 3, homeAgainst: 1, outcome: 'W' },
  { date: 'Sat 17 May', team: 'U13 Falcons', opponent: 'Northgate Eagles',     comp: 'Surrey Youth League', venue: 'A', homeFor: 1, homeAgainst: 2, outcome: 'W' },
  { date: 'Sat 17 May', team: 'U14 Eagles',  opponent: 'Plymouth Marine Boys', comp: 'Surrey Youth League', venue: 'H', homeFor: 2, homeAgainst: 2, outcome: 'D' },
  { date: 'Sat 10 May', team: 'U11 Lions',   opponent: 'Fernbrook Rangers',    comp: 'Surrey Youth League', venue: 'A', homeFor: 1, homeAgainst: 0, outcome: 'L' },
  { date: 'Sat 10 May', team: 'U13 Falcons', opponent: 'Riverside Stars',      comp: 'Surrey Youth League', venue: 'H', homeFor: 4, homeAgainst: 1, outcome: 'W' },
  { date: 'Sat 03 May', team: 'U11 Lions',   opponent: 'Northgate Juniors',    comp: 'Surrey Youth League', venue: 'H', homeFor: 2, homeAgainst: 0, outcome: 'W' },
]

const TABLE: TableRow[] = [
  { pos: 1,  team: 'Kingsmere City U11',       p: 14, w: 11, d: 2, l: 1, gf: 38, ga: 12, pts: 35 },
  { pos: 2,  team: 'Oakridge U11 Lions',       p: 14, w: 10, d: 2, l: 2, gf: 34, ga: 14, pts: 32 },
  { pos: 3,  team: 'Harfield Juniors U11',     p: 14, w:  9, d: 2, l: 3, gf: 30, ga: 16, pts: 29 },
  { pos: 4,  team: 'Ridgefield Athletic U11',  p: 14, w:  8, d: 2, l: 4, gf: 28, ga: 18, pts: 26 },
  { pos: 5,  team: 'Castleton Juniors U11',    p: 14, w:  7, d: 2, l: 5, gf: 25, ga: 22, pts: 23 },
  { pos: 6,  team: 'Northgate Juniors U11',    p: 14, w:  6, d: 3, l: 5, gf: 22, ga: 21, pts: 21 },
  { pos: 7,  team: 'Fernbrook Rangers U11',    p: 14, w:  5, d: 3, l: 6, gf: 20, ga: 24, pts: 18 },
  { pos: 8,  team: 'Riverside Stars U11',      p: 14, w:  4, d: 2, l: 8, gf: 17, ga: 28, pts: 14 },
  { pos: 9,  team: 'Glenmoor Wanderers U11',   p: 14, w:  3, d: 2, l: 9, gf: 14, ga: 32, pts: 11 },
  { pos: 10, team: 'Hartwell Athletic U11',    p: 14, w:  1, d: 2, l:11, gf:  9, ga: 40, pts:  5 },
]

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorFixtures({ session }: Props) {
  const [source, setSource] = useState<Source>('fa_full_time')
  const [teamFilter, setTeamFilter] = useState<'all' | string>('all')
  const teams = Array.from(new Set([...FIXTURES.map(f => f.team), ...RESULTS.map(r => r.team)]))

  const filteredFixtures = teamFilter === 'all' ? FIXTURES : FIXTURES.filter(f => f.team === teamFilter)
  const filteredResults = teamFilter === 'all' ? RESULTS : RESULTS.filter(r => r.team === teamFilter)

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
          Fixtures &amp; Results
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {FIXTURES.length} upcoming · {RESULTS.length} recent · Surrey Youth League
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Fixtures, results and the league table — without leaving Lumio.
          Source is pluggable: FA Full-Time, the league&rsquo;s own site, or coach
          manual entry. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="rounded-xl p-3 flex flex-wrap items-center gap-2" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-[10px] uppercase tracking-wider mr-2" style={{ color: T.text4 }}>Data source</p>
        {(Object.keys(SOURCE_LABEL) as Source[]).map(s => {
          const active = source === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {SOURCE_LABEL[s]}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] leading-relaxed -mt-2 px-1" style={{ color: T.text3 }}>{SOURCE_HINT[source]}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTeamFilter('all')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{
            backgroundColor: teamFilter === 'all' ? T.accentDim : 'transparent',
            border: `1px solid ${teamFilter === 'all' ? T.accent : T.border}`,
            color: teamFilter === 'all' ? T.good : T.text3,
          }}
        >
          All teams
        </button>
        {teams.map(t => {
          const active = teamFilter === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTeamFilter(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <p className="text-sm font-bold" style={{ color: T.text }}>Upcoming fixtures</p>
          </div>
          <ul>
            {filteredFixtures.map((f, i) => (
              <li key={i} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-xs font-bold" style={{ color: T.text }}>{f.team}<span style={{ color: T.text3 }}> vs </span>{f.opponent}</p>
                    <p className="text-[10px]" style={{ color: T.text4 }}>{f.comp} · {f.ground} ({f.venue})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono" style={{ color: T.text2 }}>{f.date} · {f.kickoff}</p>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded inline-block mt-0.5"
                      style={{
                        backgroundColor: f.status === 'confirmed' ? 'rgba(34,197,94,0.18)' : f.status === 'tbc' ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.18)',
                        color: f.status === 'confirmed' ? T.good : f.status === 'tbc' ? T.warn : T.blue,
                      }}
                    >
                      {f.status === 'tbc' ? 'TBC' : f.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
            {filteredFixtures.length === 0 && (
              <li className="px-4 py-3 text-xs" style={{ color: T.text4 }}>No upcoming fixtures for this filter.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <p className="text-sm font-bold" style={{ color: T.text }}>Recent results</p>
          </div>
          <ul>
            {filteredResults.map((r, i) => (
              <li key={i} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-xs font-bold" style={{ color: T.text }}>{r.team}<span style={{ color: T.text3 }}> vs </span>{r.opponent}</p>
                    <p className="text-[10px]" style={{ color: T.text4 }}>{r.comp} · {r.venue === 'H' ? 'Home' : 'Away'}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-xs font-mono px-2 py-1 rounded"
                      style={{
                        backgroundColor: r.outcome === 'W' ? 'rgba(34,197,94,0.18)' : r.outcome === 'D' ? 'rgba(245,158,11,0.18)' : 'rgba(239,68,68,0.18)',
                        color: r.outcome === 'W' ? T.good : r.outcome === 'D' ? T.warn : T.bad,
                      }}
                    >
                      {r.outcome} {r.homeFor} – {r.homeAgainst}
                    </span>
                    <p className="text-[10px] mt-1" style={{ color: T.text4 }}>{r.date}</p>
                  </div>
                </div>
              </li>
            ))}
            {filteredResults.length === 0 && (
              <li className="px-4 py-3 text-xs" style={{ color: T.text4 }}>No recent results for this filter.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>U11 league table · Surrey Youth League</p>
        </div>
        <table className="w-full text-xs">
          <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Team</th>
              <th className="px-3 py-2 font-semibold text-center">P</th>
              <th className="px-3 py-2 font-semibold text-center">W</th>
              <th className="px-3 py-2 font-semibold text-center">D</th>
              <th className="px-3 py-2 font-semibold text-center">L</th>
              <th className="px-3 py-2 font-semibold text-center">GF</th>
              <th className="px-3 py-2 font-semibold text-center">GA</th>
              <th className="px-3 py-2 font-semibold text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {TABLE.map(r => {
              const isUs = r.team.startsWith('Oakridge')
              return (
                <tr
                  key={r.team}
                  style={{
                    borderTop: `1px solid ${T.borderSoft}`,
                    backgroundColor: isUs ? T.accentDim : 'transparent',
                  }}
                >
                  <td className="px-3 py-2 font-mono" style={{ color: T.text4 }}>{r.pos}</td>
                  <td className="px-3 py-2" style={{ color: isUs ? T.good : T.text }}>
                    {r.team}{isUs && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: T.accent, color: '#fff' }}>US</span>}
                  </td>
                  <td className="px-3 py-2 text-center font-mono" style={{ color: T.text2 }}>{r.p}</td>
                  <td className="px-3 py-2 text-center font-mono" style={{ color: T.text2 }}>{r.w}</td>
                  <td className="px-3 py-2 text-center font-mono" style={{ color: T.text2 }}>{r.d}</td>
                  <td className="px-3 py-2 text-center font-mono" style={{ color: T.text2 }}>{r.l}</td>
                  <td className="px-3 py-2 text-center font-mono" style={{ color: T.text2 }}>{r.gf}</td>
                  <td className="px-3 py-2 text-center font-mono" style={{ color: T.text2 }}>{r.ga}</td>
                  <td className="px-3 py-2 text-center font-mono font-bold" style={{ color: isUs ? T.good : T.text }}>{r.pts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
