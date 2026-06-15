'use client'

import { useState } from 'react'
import { Calendar, Trophy, MapPin, Flag, Filter } from 'lucide-react'

// Men's Pro — Fixtures & Results. EFL Championship + FA Cup + EFL Cup.
// Blue-themed, demo data inline. Mirrors the women's Fixtures view structure.

const C = {
  card: '#0D1017', cardAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', textSec: '#9CA3AF', muted: '#6B7280',
  primary: '#003DA5', accent: '#60A5FA', gold: '#2563EB',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', purple: '#8B5CF6',
} as const

type Result = 'W' | 'L' | 'D'
type Upcoming = { day: string; date: string; opp: string; comp: string; venue: string; time: string; competitionTone: 'league' | 'cup' }
type Played = { date: string; opp: string; comp: string; ha: 'H' | 'A'; result: Result; score: string; scorers: string; motm: string }

const UPCOMING: Upcoming[] = [
  { day: 'Sat', date: '17 May', opp: 'Thornvale United',     comp: 'Championship',       venue: 'Home · Oakridge Stadium',   time: '15:00', competitionTone: 'league' },
  { day: 'Tue', date: '20 May', opp: 'Kingsmere City',       comp: 'Championship',       venue: 'Away · Kingsmere Stadium',  time: '19:45', competitionTone: 'league' },
  { day: 'Sat', date: '24 May', opp: 'Hartwell Athletic',    comp: 'Championship',       venue: 'Away · Hartwell Ground',    time: '15:00', competitionTone: 'league' },
  { day: 'Sat', date: '31 May', opp: 'Penmarric Rovers',     comp: 'Championship',       venue: 'Home · Oakridge Stadium',   time: '15:00', competitionTone: 'league' },
  { day: 'Wed', date: '07 Jun', opp: 'Calderbrook Town',     comp: 'Championship',       venue: 'Away · Calder Park',        time: '19:45', competitionTone: 'league' },
]

const RECENT: Played[] = [
  { date: 'Sat 10 May', opp: 'Northgate City',      comp: 'Championship', ha: 'H', result: 'L', score: '1-2', scorers: 'Morris (61)',               motm: 'D. Morris' },
  { date: 'Sat 03 May', opp: 'Fernbrook Athletic',  comp: 'Championship', ha: 'A', result: 'L', score: '1-2', scorers: 'Porter (44)',               motm: 'J. Hayes' },
  { date: 'Sat 26 Apr', opp: 'Castleton Rovers',    comp: 'Championship', ha: 'H', result: 'D', score: '1-1', scorers: 'Barker (78)',               motm: 'L. Barker' },
  { date: 'Sat 19 Apr', opp: 'Redmill United',      comp: 'Championship', ha: 'A', result: 'W', score: '2-0', scorers: 'Morris (32), Porter (71)',  motm: 'D. Morris' },
  { date: 'Sat 12 Apr', opp: 'Glenmoor Wanderers',  comp: 'Championship', ha: 'H', result: 'D', score: '2-2', scorers: 'Morris (18), Rowe (55)',    motm: 'A. Rowe' },
  { date: 'Sat 05 Apr', opp: 'Brookvale Town',      comp: 'FA Cup R5',    ha: 'A', result: 'W', score: '3-1', scorers: 'Nwosu 2, Morris',           motm: 'C. Nwosu' },
  { date: 'Sat 29 Mar', opp: 'Ashbourne FC',        comp: 'Championship', ha: 'H', result: 'L', score: '0-1', scorers: '—',                          motm: 'D. Webb' },
  { date: 'Sat 22 Mar', opp: 'Ridgefield Athletic', comp: 'Championship', ha: 'A', result: 'W', score: '2-1', scorers: 'Porter, Nwosu',             motm: 'S. Porter' },
]

const SEASON_FORM: Result[] = ['L','L','D','W','D','W','L','W','D','L','W','D','L','W','L','D','W','L']

type TableRow = { pos: number; club: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; form: Result[]; me?: boolean }
const LEAGUE_TABLE: TableRow[] = [
  { pos: 1,  club: 'Kingsmere City',      p: 37, w: 24, d: 7, l: 6,  gf: 71, ga: 34, pts: 79, form: ['W','W','D','W','W'] },
  { pos: 2,  club: 'Thornvale United',    p: 37, w: 22, d: 8, l: 7,  gf: 66, ga: 38, pts: 74, form: ['W','D','W','W','L'] },
  { pos: 3,  club: 'Hartwell Athletic',   p: 37, w: 21, d: 7, l: 9,  gf: 63, ga: 41, pts: 70, form: ['W','W','L','W','D'] },
  { pos: 6,  club: 'Penmarric Rovers',    p: 37, w: 18, d: 9, l: 10, gf: 58, ga: 44, pts: 63, form: ['D','W','W','L','W'] },
  { pos: 10, club: 'Northgate City',      p: 37, w: 14, d: 11, l: 12, gf: 49, ga: 47, pts: 53, form: ['W','D','L','W','D'] },
  { pos: 11, club: 'Calderbrook Town',    p: 37, w: 13, d: 11, l: 13, gf: 47, ga: 49, pts: 50, form: ['L','D','W','D','L'] },
  { pos: 12, club: 'Fernbrook Athletic',  p: 37, w: 12, d: 12, l: 13, gf: 45, ga: 50, pts: 48, form: ['W','L','D','L','W'] },
  { pos: 13, club: 'Redmill United',      p: 37, w: 11, d: 12, l: 14, gf: 44, ga: 53, pts: 45, form: ['L','W','D','L','D'] },
  { pos: 14, club: 'Oakridge FC',         p: 37, w: 11, d: 8, l: 18, gf: 48, ga: 56, pts: 41, form: ['L','L','D','W','D'], me: true },
  { pos: 15, club: 'Ridgefield Athletic', p: 37, w: 10, d: 10, l: 17, gf: 42, ga: 57, pts: 40, form: ['D','L','W','L','L'] },
  { pos: 22, club: 'Ashbourne FC',        p: 37, w: 8,  d: 9, l: 20, gf: 36, ga: 62, pts: 33, form: ['L','L','D','L','W'] },
  { pos: 23, club: 'Glenmoor Wanderers',  p: 37, w: 6,  d: 10, l: 21, gf: 33, ga: 68, pts: 28, form: ['L','D','L','L','D'] },
]

export default function FootballFixturesView() {
  const [filterComp, setFilterComp] = useState<'all' | 'league' | 'cup'>('all')
  const filteredUpcoming = filterComp === 'all' ? UPCOMING : UPCOMING.filter(u => u.competitionTone === filterComp)
  const wins = SEASON_FORM.filter(r => r === 'W').length
  const draws = SEASON_FORM.filter(r => r === 'D').length
  const losses = SEASON_FORM.filter(r => r === 'L').length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Fixtures & Results</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>EFL Championship · FA Cup · EFL Cup — full season schedule and form.</p>
      </div>

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
              return (<span key={i} className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold" style={{ backgroundColor: `${colour}22`, color: colour, border: `1px solid ${colour}` }}>{r}</span>)
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2"><Trophy size={14} style={{ color: C.gold }} /><p className="text-sm font-semibold" style={{ color: C.text }}>EFL Championship — League Table</p></div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: C.good }}><span style={{ width: 6, height: 6, borderRadius: 9, background: C.good, display: 'inline-block' }} /> LIVE · updated 10:42</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['#', 'Club', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts', 'Form'].map((h, i) => (<th key={h} className={`px-3 py-3 font-semibold ${i === 1 ? 'text-left' : 'text-center'}`} style={{ color: C.muted }}>{h}</th>))}</tr></thead>
            <tbody>
              {LEAGUE_TABLE.map((r, i) => {
                const zone = r.pos <= 2 ? C.good : r.pos <= 6 ? C.accent : r.pos >= 22 ? C.bad : 'transparent'
                const gd = r.gf - r.ga
                return (
                  <tr key={r.club} style={{ borderBottom: i < LEAGUE_TABLE.length - 1 ? `1px solid ${C.border}` : undefined, backgroundColor: r.me ? `${C.accent}14` : undefined }}>
                    <td className="px-3 py-2.5 text-center font-bold" style={{ color: C.text, borderLeft: `3px solid ${zone}` }}>{r.pos}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: r.me ? C.accent : C.text }}>{r.club}</td>
                    <td className="px-3 py-2.5 text-center" style={{ color: C.textSec }}>{r.p}</td>
                    <td className="px-3 py-2.5 text-center" style={{ color: C.textSec }}>{r.w}</td>
                    <td className="px-3 py-2.5 text-center" style={{ color: C.textSec }}>{r.d}</td>
                    <td className="px-3 py-2.5 text-center" style={{ color: C.textSec }}>{r.l}</td>
                    <td className="px-3 py-2.5 text-center" style={{ color: C.muted }}>{r.gf}</td>
                    <td className="px-3 py-2.5 text-center" style={{ color: C.muted }}>{r.ga}</td>
                    <td className="px-3 py-2.5 text-center font-mono" style={{ color: gd > 0 ? C.good : gd < 0 ? C.bad : C.muted }}>{gd > 0 ? '+' : ''}{gd}</td>
                    <td className="px-3 py-2.5 text-center font-bold" style={{ color: C.text }}>{r.pts}</td>
                    <td className="px-3 py-2.5"><div className="flex items-center justify-center gap-0.5">{r.form.map((f, j) => { const fc = f === 'W' ? C.good : f === 'D' ? C.warn : C.bad; return <span key={j} className="flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold" style={{ backgroundColor: `${fc}22`, color: fc }}>{f}</span> })}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 flex items-center gap-4 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}>
          <span className="flex items-center gap-1.5"><span style={{ width: 8, height: 8, background: C.good, borderRadius: 2, display: 'inline-block' }} /> Automatic promotion</span>
          <span className="flex items-center gap-1.5"><span style={{ width: 8, height: 8, background: C.accent, borderRadius: 2, display: 'inline-block' }} /> Play-offs</span>
          <span className="flex items-center gap-1.5"><span style={{ width: 8, height: 8, background: C.bad, borderRadius: 2, display: 'inline-block' }} /> Relegation</span>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.muted }}><Filter size={12} /> Competition</span>
          <div className="flex gap-1.5">{(['all', 'league', 'cup'] as const).map(t => (<button key={t} onClick={() => setFilterComp(t)} className="px-3 py-1 rounded-md text-[11px] font-semibold capitalize" style={{ backgroundColor: filterComp === t ? C.primary : '#111318', color: filterComp === t ? '#fff' : C.muted, border: `1px solid ${filterComp === t ? C.primary : C.border}` }}>{t}</button>))}</div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><div className="flex items-center gap-2"><Calendar size={14} style={{ color: C.accent }} /><p className="text-sm font-semibold" style={{ color: C.text }}>Upcoming Fixtures</p></div><span className="text-xs" style={{ color: C.muted }}>{filteredUpcoming.length} fixtures</span></div>
        <div className="divide-y" style={{ borderColor: C.border }}>
          {filteredUpcoming.length === 0 ? (<div className="px-5 py-8 text-center"><p className="text-sm" style={{ color: C.muted }}>No upcoming fixtures match the current filter.</p></div>) : (
            filteredUpcoming.map((u, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="text-center w-12 shrink-0"><p className="text-[10px] uppercase font-semibold" style={{ color: C.muted }}>{u.day}</p><p className="text-sm font-bold" style={{ color: C.text }}>{u.date}</p></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold" style={{ color: C.text }}>vs {u.opp}</p><p className="text-[11px]" style={{ color: C.textSec }}>{u.venue} · {u.time}</p></div>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{ backgroundColor: u.competitionTone === 'cup' ? `${C.purple}22` : `${C.accent}22`, color: u.competitionTone === 'cup' ? C.purple : C.accent }}>{u.competitionTone === 'cup' ? <Trophy size={10} /> : <Flag size={10} />}{u.comp}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><div className="flex items-center gap-2"><MapPin size={14} style={{ color: C.gold }} /><p className="text-sm font-semibold" style={{ color: C.text }}>Recent Results</p></div><span className="text-xs" style={{ color: C.muted }}>{RECENT.length} most recent</span></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Date', 'Opponent', 'Comp', 'H/A', 'Score', 'Scorers', 'MOTM'].map(h => (<th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.muted }}>{h}</th>))}</tr></thead>
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
