'use client'

import { useState } from 'react'
import {
  Calendar, Trophy, MapPin, Flag, Filter,
} from 'lucide-react'

// Women's Fixtures & Results — WSL Championship + cup competitions.
// Pink-themed, demo data inline. Mirrors WOMENS_FIXTURES / WOMENS_RECENTS
// shape from womens-dashboard-data.ts but extended for the dedicated
// Fixtures view (next 5 + last 8).

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
  purple: '#8B5CF6',
} as const

type Result = 'W' | 'L' | 'D'
type Upcoming = { day: string; date: string; opp: string; comp: string; venue: string; time: string; competitionTone: 'league' | 'cup' }
type Played   = { date: string; opp: string; comp: string; ha: 'H' | 'A'; result: Result; score: string; scorers: string; motm: string }

const UPCOMING: Upcoming[] = [
  { day: 'Sun', date: '17 May', opp: 'Hartwell Women',          comp: 'WSL Championship',   venue: 'Home · Oakridge Stadium',     time: '14:00', competitionTone: 'league' },
  { day: 'Wed', date: '20 May', opp: 'Ridgefield Athletic Women', comp: 'WSL Cup Semi-final', venue: 'Neutral · The Hive',          time: '19:45', competitionTone: 'cup' },
  { day: 'Sun', date: '24 May', opp: 'Thornvale Ladies',         comp: 'WSL Championship',   venue: 'Away · Thornvale Stadium',    time: '14:00', competitionTone: 'league' },
  { day: 'Sun', date: '31 May', opp: 'Kingsmere City Women',     comp: 'WSL Championship',   venue: 'Home · Oakridge Stadium',     time: '14:00', competitionTone: 'league' },
  { day: 'Sun', date: '07 Jun', opp: 'Ashbourne Women FC',       comp: 'WSL Championship',   venue: 'Away · Riverside Park',       time: '14:00', competitionTone: 'league' },
]

const RECENT: Played[] = [
  { date: 'Sun 10 May', opp: 'Hartwell Women',         comp: 'WSL Championship',     ha: 'H', result: 'D', score: '1-1', scorers: 'Morris (58)',                 motm: 'L. Barker' },
  { date: 'Sun 03 May', opp: 'Hartwell Women',         comp: 'WSL Championship',     ha: 'A', result: 'W', score: '2-1', scorers: 'Williams (41), Morris (78)',  motm: 'D. Morris' },
  { date: 'Sun 26 Apr', opp: 'Northgate Women',        comp: 'WSL Championship',     ha: 'A', result: 'W', score: '3-0', scorers: 'Williams, Morris, Porter',    motm: 'Z. Williams' },
  { date: 'Sun 19 Apr', opp: 'Plymouth Marine Women',  comp: 'WSL Championship',     ha: 'H', result: 'W', score: '2-1', scorers: 'Carter, Barker',              motm: 'N. Carter' },
  { date: 'Sun 12 Apr', opp: 'Fernbrook Women',        comp: 'WSL Championship',     ha: 'A', result: 'D', score: '0-0', scorers: '—',                            motm: 'L. Brennan' },
  { date: 'Sun 05 Apr', opp: 'Castleton Women',        comp: "Women's FA Cup R2",    ha: 'A', result: 'W', score: '4-1', scorers: 'Williams 2, Morris, Porter',  motm: 'Z. Williams' },
  { date: 'Sun 29 Mar', opp: 'Glenmoor Wanderers W',   comp: 'WSL Championship',     ha: 'H', result: 'L', score: '1-2', scorers: 'Carter',                       motm: 'E. Hayes' },
  { date: 'Sun 22 Mar', opp: 'Kingsmere City Women',   comp: 'WSL Championship',     ha: 'A', result: 'W', score: '2-0', scorers: 'Morris, Tilley',               motm: 'D. Morris' },
]

const SEASON_FORM: Result[] = ['W','D','W','W','L','W','D','W','W','L','D','W','W','L','W','W','D','W']

export default function WomensFixturesView() {
  const [filterComp, setFilterComp] = useState<'all' | 'league' | 'cup'>('all')
  const filteredUpcoming = filterComp === 'all' ? UPCOMING : UPCOMING.filter(u => u.competitionTone === filterComp)

  const wins = SEASON_FORM.filter(r => r === 'W').length
  const draws = SEASON_FORM.filter(r => r === 'D').length
  const losses = SEASON_FORM.filter(r => r === 'L').length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Fixtures & Results</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>WSL Championship · Women&apos;s FA Cup · WSL Cup — full season schedule and form.</p>
      </div>

      {/* Season form summary */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold uppercase" style={{ color: C.muted }}>Season Form (last 18)</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span style={{ color: C.good }} className="font-bold">{wins}W</span>
              <span style={{ color: C.warn }} className="font-bold">{draws}D</span>
              <span style={{ color: C.bad }} className="font-bold">{losses}L</span>
              <span style={{ color: C.textSec }}>·</span>
              <span style={{ color: C.text }} className="font-mono text-xs">{wins * 3 + draws} pts</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {SEASON_FORM.map((r, i) => {
              const colour = r === 'W' ? C.good : r === 'D' ? C.warn : C.bad
              return (
                <span key={i} className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
                  style={{ backgroundColor: `${colour}22`, color: colour, border: `1px solid ${colour}` }}>
                  {r}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.muted }}>
            <Filter size={12} /> Competition
          </span>
          <div className="flex gap-1.5">
            {(['all', 'league', 'cup'] as const).map(t => (
              <button key={t} onClick={() => setFilterComp(t)} className="px-3 py-1 rounded-md text-[11px] font-semibold capitalize"
                style={{ backgroundColor: filterComp === t ? C.primary : '#111318', color: filterComp === t ? '#fff' : C.muted, border: `1px solid ${filterComp === t ? C.primary : C.border}` }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Fixtures */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: C.primary }} />
            <p className="text-sm font-semibold" style={{ color: C.text }}>Upcoming Fixtures</p>
          </div>
          <span className="text-xs" style={{ color: C.muted }}>{filteredUpcoming.length} fixtures</span>
        </div>
        <div className="divide-y" style={{ borderColor: C.border }}>
          {filteredUpcoming.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: C.muted }}>No upcoming fixtures match the current filter.</p>
            </div>
          ) : (
            filteredUpcoming.map((u, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="text-center w-12 shrink-0">
                  <p className="text-[10px] uppercase font-semibold" style={{ color: C.muted }}>{u.day}</p>
                  <p className="text-sm font-bold" style={{ color: C.text }}>{u.date}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: C.text }}>vs {u.opp}</p>
                  <p className="text-[11px]" style={{ color: C.textSec }}>{u.venue} · {u.time}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{
                  backgroundColor: u.competitionTone === 'cup' ? `${C.purple}22` : `${C.primary}22`,
                  color: u.competitionTone === 'cup' ? C.purple : C.primary,
                }}>
                  {u.competitionTone === 'cup' ? <Trophy size={10} /> : <Flag size={10} />}
                  {u.comp}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Results */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <MapPin size={14} style={{ color: C.gold }} />
            <p className="text-sm font-semibold" style={{ color: C.text }}>Recent Results</p>
          </div>
          <span className="text-xs" style={{ color: C.muted }}>{RECENT.length} most recent</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Date', 'Opponent', 'Comp', 'H/A', 'Score', 'Scorers', 'MOTM'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT.map((r, i) => {
                const resColor = r.result === 'W' ? C.good : r.result === 'D' ? C.warn : C.bad
                return (
                  <tr key={i} style={{ borderBottom: i < RECENT.length - 1 ? `1px solid ${C.border}` : undefined }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3" style={{ color: C.textSec }}>{r.date}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{r.opp}</td>
                    <td className="px-4 py-3" style={{ color: C.muted }}>{r.comp}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: C.muted }}>{r.ha}</td>
                    <td className="px-4 py-3"><span className="font-bold" style={{ color: resColor }}>{r.result} {r.score}</span></td>
                    <td className="px-4 py-3" style={{ color: C.textSec }}>{r.scorers}</td>
                    <td className="px-4 py-3" style={{ color: C.gold }}>{r.motm}</td>
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
