'use client'

// Live (founder portal) Player Development — the demo DevelopmentView over real
// data. Master-detail: pick a player, see their current racket, the live 1–4
// skill grading for that racket (which writes coach_player_skills and therefore
// drives the Racket Progression % + Squad matrix + Dashboard), the racket
// journey, GPS-watch effort stats and their recent lessons. Stats are limited to
// what we can actually measure today — no fabricated 1st-serve %/win-rate.

import { useState, useMemo, type ReactNode, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import {
  useCoachTable, setSkillScore, RACKET_STAGES, RACKET_SKILLS,
  SKILL_LEVELS, skillLevelColour,
} from '../_lib/coach-db'
import { printRacketCertificate } from './LiveRacketProgression'
import { avatarSrc } from '@/lib/avatar'

type Player = { id: string; name: string; age?: number | null; level?: string | null; category?: string | null; parent_name?: string | null; goal?: string | null; racket_stage?: string | null; avatar_url?: string | null }
const THEME: Record<string, string> = { white: 'Foundations', yellow: 'Rallying', orange: 'Net & Touch', green: 'The Serve', blue: 'Spin & Shape', purple: 'Specialty Shots', brown: 'Weapons', red: 'Tactics', black: 'Mastery' }
const TOTAL_SKILLS = RACKET_STAGES.reduce((n, s) => n + (RACKET_SKILLS[s.id]?.length || 0), 0)
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

export function LiveDevelopment({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const { rows: players } = useCoachTable<Player>('coach_players')
  const { rows: skillRows, reload: reloadSkills } = useCoachTable<{ player_id: string; skill: string; score: number }>('coach_player_skills')
  const { rows: attRows } = useCoachTable<{ player_id: string; present: boolean }>('coach_attendance')
  const { rows: sessionRows } = useCoachTable<{ player_name: string | null; session_date: string | null; focus: string | null; summary: string | null }>('coach_sessions')
  const { rows: gpsRows } = useCoachTable<{ player_name: string | null; distance_m: number | null; top_speed_kmh: number | null; avg_hr: number | null }>('coach_gps_sessions')

  const [selId, setSelId] = useState<string | null>(null)
  const sel = players.find(p => p.id === selId) ?? players[0]

  const skillMap = useMemo(() => {
    const m: Record<string, Record<string, number>> = {}
    for (const r of skillRows) { (m[r.player_id] ||= {})[r.skill] = r.score }
    return m
  }, [skillRows])

  const grade = async (playerId: string, skill: string, score: number) => {
    try { await setSkillScore(playerId, skill, score); reloadSkills() } catch { /* surfaced in console */ }
  }

  if (players.length === 0) {
    return (
      <div style={{ fontFamily: FONT }}>
        <Head T={T} />
        <div style={{ textAlign: 'center', padding: '48px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>No players yet</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>Add players in the Player Roster, then track their racket journey and grade skills here.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <Head T={T} />
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, alignItems: 'start' }}>
        {/* Player list */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, alignSelf: 'start' }}>
          {players.map(p => {
            const active = p.id === sel?.id
            const st = RACKET_STAGES.find(s => s.id === p.racket_stage)
            return (
              <div key={p.id} onClick={() => setSelId(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', background: active ? accent.dim : 'transparent', border: `1px solid ${active ? accent.border : 'transparent'}`, marginBottom: 4 }}>
                {p.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarSrc(p.avatar_url)} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <span style={{ width: 28, height: 28, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700, border: `1px solid ${accent.border}`, flexShrink: 0 }}>{initials(p.name)}</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: st?.colour ?? T.border, border: '1px solid rgba(128,128,128,0.4)' }} />
                    <span style={{ fontSize: 10.5, color: T.text3 }}>{st ? st.name : 'No racket'}{p.category || p.level ? ` · ${p.category || p.level}` : ''}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {sel && <Detail T={T} accent={accent} p={sel}
          skillScores={skillMap[sel.id] || {}}
          attRows={attRows.filter(a => a.player_id === sel.id)}
          lessons={sessionRows.filter(s => (s.player_name || '').trim().toLowerCase() === sel.name.trim().toLowerCase())}
          gps={gpsRows.filter(g => (g.player_name || '').trim().toLowerCase() === sel.name.trim().toLowerCase())}
          onGrade={(skill, score) => grade(sel.id, skill, score)} />}
      </div>
    </div>
  )
}

function Head({ T }: { T: ThemeTokens }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Player Development</h1>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Track every player’s journey — current racket, skill mastery, goals and trajectory.</p>
    </div>
  )
}

function Detail({ T, accent, p, skillScores, attRows, lessons, gps, onGrade }: {
  T: ThemeTokens; accent: AccentTokens; p: Player
  skillScores: Record<string, number>
  attRows: { present: boolean }[]
  lessons: { session_date: string | null; focus: string | null; summary: string | null }[]
  gps: { distance_m: number | null; top_speed_kmh: number | null; avg_hr: number | null }[]
  onGrade: (skill: string, score: number) => void
}) {
  const rawIdx = RACKET_STAGES.findIndex(s => s.id === p.racket_stage)
  const hasStage = rawIdx >= 0
  const cur = hasStage ? rawIdx : 0
  const curStage = RACKET_STAGES[cur]
  const curSkills = RACKET_SKILLS[curStage.id] || []
  const mastered = (skill: string) => (skillScores[skill] || 0) >= 4
  const progress = curSkills.length ? Math.round(curSkills.filter(s => mastered(s.name)).length / curSkills.length * 100) : 0
  const skillsEarned = RACKET_STAGES.reduce((n, st) => n + (RACKET_SKILLS[st.id] || []).filter(s => mastered(s.name)).length, 0)
  const attPct = attRows.length ? Math.round(attRows.filter(a => a.present).length / attRows.length * 100) : null

  // GPS-watch derived stats (real, from coach_gps_sessions). "—" until data exists.
  const distanceKm = gps.length ? (gps.reduce((s, g) => s + (g.distance_m || 0), 0) / 1000) : null
  const topSpeed = gps.length ? Math.max(...gps.map(g => g.top_speed_kmh || 0)) : null
  const avgHr = gps.length ? Math.round(gps.reduce((s, g) => s + (g.avg_hr || 0), 0) / gps.filter(g => g.avg_hr).length) : null

  const nextStage = hasStage && cur < RACKET_STAGES.length - 1 ? RACKET_STAGES[cur + 1] : null
  const tiles: { label: string; value: ReactNode; sub?: string; colour?: string }[] = [
    { label: 'Current racket', value: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: curStage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />{hasStage ? curStage.name : '—'}</span> },
    { label: 'Racket progress', value: `${progress}%`, sub: nextStage ? `to ${nextStage.name}` : 'top racket', colour: accent.hex },
    { label: 'Attendance', value: attPct === null ? '—' : `${attPct}%`, sub: attPct === null ? 'no data' : `${attRows.length} logged`, colour: attPct === null ? T.text3 : attPct >= 90 ? T.good : attPct >= 80 ? T.warn : T.bad },
    { label: 'Skills earned', value: `${skillsEarned}/${TOTAL_SKILLS}`, sub: 'all rackets' },
    { label: 'Lessons', value: String(lessons.length), sub: 'logged' },
    { label: 'Distance', value: distanceKm === null ? '—' : `${distanceKm.toFixed(1)} km`, sub: 'GPS · all sessions' },
    { label: 'Effort (avg HR)', value: avgHr ? `${avgHr} bpm` : '—', sub: 'GPS watch' },
    { label: 'Top speed', value: topSpeed ? `${topSpeed.toFixed(1)} km/h` : '—', sub: 'GPS watch' },
  ]
  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {p.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarSrc(p.avatar_url)} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <span style={{ width: 44, height: 44, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700, border: `1px solid ${accent.border}` }}>{initials(p.name)}</span>}
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.text }}>{p.name}</div>
            <div style={{ fontSize: 12, color: T.text3 }}>{p.category || p.level || 'Player'}{p.age ? ` · Age ${p.age}` : ''}{p.parent_name ? ` · Parent: ${p.parent_name}` : ''}</div>
          </div>
          <button onClick={() => hasStage && printRacketCertificate(p.name, curStage, curSkills.map(s => s.name))}
            disabled={!hasStage}
            style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: hasStage ? 'pointer' : 'not-allowed', opacity: hasStage ? 1 : 0.5, fontFamily: FONT }}>🏆 Racket certificate</button>
        </div>
        {/* Goal */}
        <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>⚑ Goal</span>
          <span style={{ fontSize: 12.5, color: T.text }}>{p.goal || 'No goal set yet — add one when you edit this player in the Roster.'}</span>
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginTop: 14 }}>
          {tiles.map(t => (
            <div key={t.label} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
              <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.colour ?? T.text, marginTop: 3 }}>{t.value}</div>
              {t.sub && <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>{t.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Working racket — live grading */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: curStage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Working racket · {curStage.name} — {THEME[curStage.id]}</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: accent.hex, fontWeight: 700 }}>{progress}% to award</div>
        </div>
        {curSkills.map(s => {
          const score = skillScores[s.name] || 0
          return (
            <div key={s.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: T.text3 }}>· {s.note}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10.5, color: skillLevelColour(score), fontWeight: 700 }}>{SKILL_LEVELS[score]}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4].map(lv => (
                  <button key={lv} title={SKILL_LEVELS[lv]} onClick={() => onGrade(s.name, score === lv ? lv - 1 : lv)}
                    style={{ flex: 1, height: 10, borderRadius: 3, border: 0, padding: 0, cursor: 'pointer', background: lv <= score ? skillLevelColour(score) : T.hover }} />
                ))}
              </div>
            </div>
          )
        })}
        <p style={{ fontSize: 10.5, color: T.text3, marginTop: 4 }}>Tap a bar to set mastery. Four bars (Consistent) = mastered — when all four skills are mastered the racket is ready to award in Racket Progression.</p>
      </div>

      {/* Racket journey + recent lessons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Racket journey</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RACKET_STAGES.map((st, i) => {
              const state = !hasStage ? 'locked' : i < cur ? 'done' : i === cur ? 'current' : 'locked'
              return (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: state === 'locked' ? 0.4 : 1 }}>
                  <span style={{ width: 20, height: 12, borderRadius: 3, background: st.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                  <span style={{ fontSize: 12, color: T.text, fontWeight: state === 'current' ? 700 : 500, flex: 1 }}>{st.name} · {THEME[st.id]}</span>
                  {state === 'done' && <span style={{ color: T.good, fontWeight: 800, fontSize: 12 }}>✓</span>}
                  {state === 'current' && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>now</span>}
                </div>
              )
            })}
          </div>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Recent lessons</div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{lessons.length}</div>
          </div>
          {lessons.length === 0 ? (
            <p style={{ fontSize: 12, color: T.text3 }}>No lessons logged for this player yet.</p>
          ) : [...lessons].sort((a, b) => String(b.session_date ?? '').localeCompare(String(a.session_date ?? ''))).slice(0, 6).map((l, i) => (
            <div key={i} style={{ padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{l.focus || 'Session'}</div>
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 1 }}>{l.session_date ? new Date(l.session_date).toLocaleDateString('en-GB') : '—'}</div>
              {l.summary && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 3, lineHeight: 1.45 }}>{l.summary}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
