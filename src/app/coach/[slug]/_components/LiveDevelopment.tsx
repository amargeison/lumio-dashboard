'use client'

// Live (founder portal) Player Development — and the source of truth for every
// player's level.
//
// THE SPLIT. Grading happens here and only here: this screen writes
// coach_player_skills and coach_players.racket_stage, and Racket Progression
// reads them. That is the whole relationship — one place where a coach says how
// a player is doing, one place where that turns into a keyring and a
// certificate.
//
// Which is why this screen talks in COLOURS, not rackets. Every academy has
// players to develop; only the ones running Lumio's reward ladder have rackets
// to award. A coach who has never bought a keyring should not be reading
// "current racket" on a page about a fifteen-year-old's backhand. The colours
// are the LTA-mapped stages either way, so nothing about the data changes — only
// what we call it. Where the reward language genuinely belongs (the certificate,
// "ready to award"), it appears only when the Racket Progression module is on.

import { useState, useEffect, useMemo, type ReactNode, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import {
  useCoachTable, useCoachProfile, setSkillScore, RACKET_STAGES, RACKET_SKILLS,
  SKILL_LEVELS, skillLevelColour, dbUpdate,
} from '../_lib/coach-db'
import { goalPresets } from '@/lib/coach/colour-ladder'
import { printRacketCertificate, certOrg } from './LiveRacketProgression'
import { getSettings } from '../_lib/settings-store'
import { getFlags, subscribe as subscribeFlags } from '../_lib/feature-flags'
import { avatarSrc } from '@/lib/avatar'
import { ColourLadder } from './ColourLadder'

type Target = { target: string; why?: string; measure?: string; by?: string }
type Player = {
  id: string; name: string; age?: number | null; level?: string | null; category?: string | null
  parent_name?: string | null; goal?: string | null; racket_stage?: string | null; avatar_url?: string | null
  // Set by Lumio Coach, persisted so they are still there next week.
  targets?: Target[] | null; targets_note?: string | null; targets_by?: string | null; targets_set_at?: string | null
}
// Is the reward ladder switched on for this academy? It is what decides whether
// a colour is also a racket you can award, and nothing else on this screen.
function useRacketModule(): boolean {
  const [on, setOn] = useState(() => getFlags().racket)
  useEffect(() => { const r = () => setOn(getFlags().racket); r(); return subscribeFlags(r) }, [])
  return on
}

const THEME: Record<string, string> = { white: 'Foundations', yellow: 'Rallying', orange: 'Net & Touch', green: 'The Serve', blue: 'Spin & Shape', purple: 'Specialty Shots', brown: 'Weapons', red: 'Tactics', black: 'Mastery' }
const TOTAL_SKILLS = RACKET_STAGES.reduce((n, s) => n + (RACKET_SKILLS[s.id]?.length || 0), 0)
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

export function LiveDevelopment({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const { rows: players, reload: reloadPlayers } = useCoachTable<Player>('coach_players')
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
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>Add players in the Player Roster, then grade their skills and track where they are here.</div>
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
                    <span style={{ fontSize: 10.5, color: T.text3 }}>{st ? st.name : 'Not started'}{p.category || p.level ? ` · ${p.category || p.level}` : ''}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {sel && <Detail T={T} accent={accent} p={sel} onSaved={reloadPlayers}
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
      <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Every player’s journey — the colour they’re on, skill mastery, goals and trajectory.</p>
    </div>
  )
}

function Detail({ T, accent, p, skillScores, attRows, lessons, gps, onGrade, onSaved }: {
  T: ThemeTokens; accent: AccentTokens; p: Player
  onSaved?: () => void
  skillScores: Record<string, number>
  attRows: { present: boolean }[]
  lessons: { session_date: string | null; focus: string | null; summary: string | null }[]
  gps: { distance_m: number | null; top_speed_kmh: number | null; avg_hr: number | null }[]
  onGrade: (skill: string, score: number) => void
}) {
  // Same coach identity as the Racket Progression tab — an identical
  // certificate must not be signed differently depending on which tab printed it.
  const profile = useCoachProfile()
  const racketOn = useRacketModule()
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

  // ── Moving a player up ────────────────────────────────────────────────────
  // One function behind both the tile and the journey, so they cannot disagree,
  // and it writes to coach_players — which is what Racket Progression, the
  // roster, the certificate and the player's own app all read.
  const setColour = async (stageId: string) => {
    try { await dbUpdate('coach_players', p.id, { racket_stage: stageId || null }); onSaved?.() } catch { /* surfaced in console */ }
  }
  /** Ticking a colour means "they have finished this one" — so they move to the
      next one, which is what a coach means when they tick it off. */
  const completeColour = (i: number) => {
    const next = RACKET_STAGES[Math.min(i + 1, RACKET_STAGES.length - 1)]
    void setColour(next.id)
  }

  const nextStage = hasStage && cur < RACKET_STAGES.length - 1 ? RACKET_STAGES[cur + 1] : null
  const tiles: { label: string; value: ReactNode; sub?: string; colour?: string }[] = [
    // Live, because this is the ONE place a colour is decided and the coach was
    // being sent to the roster to change it. Setting it here updates the player
    // record, so Racket Progression, the roster card, the certificate and the
    // family's own app all move with it.
    { label: 'Current colour', value: <ColourPicker T={T} accent={accent} stageId={hasStage ? curStage.id : ''} onPick={setColour} /> },
    { label: 'Colour progress', value: `${progress}%`, sub: nextStage ? `to ${nextStage.name}` : 'top colour', colour: accent.hex },
    { label: 'Attendance', value: attPct === null ? '—' : `${attPct}%`, sub: attPct === null ? 'no data' : `${attRows.length} logged`, colour: attPct === null ? T.text3 : attPct >= 90 ? T.good : attPct >= 80 ? T.warn : T.bad },
    { label: 'Skills mastered', value: `${skillsEarned}/${TOTAL_SKILLS}`, sub: 'all colours' },
    { label: 'Lessons', value: String(lessons.length), sub: 'logged' },
    { label: 'Distance', value: distanceKm === null ? '—' : `${distanceKm.toFixed(1)} km`, sub: 'GPS · all sessions' },
    { label: 'Effort (avg HR)', value: avgHr ? `${avgHr} bpm` : '—', sub: 'GPS watch' },
    { label: 'Top speed', value: topSpeed ? `${topSpeed.toFixed(1)} km/h` : '—', sub: 'GPS watch' },
  ]
  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
  const sectOff = getSettings().sectionsOff?.development || []
  const showSec = (k: string) => !sectOff.includes(k)


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
          {/* A certificate is a reward, and rewards belong to the racket ladder.
              An academy that does not run it has nothing to print here. */}
          {racketOn && (
            <button onClick={() => hasStage && printRacketCertificate(p.name, curStage, curSkills.map(s => s.name), certOrg(profile))}
              disabled={!hasStage}
              style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: hasStage ? 'pointer' : 'not-allowed', opacity: hasStage ? 1 : 0.5, fontFamily: FONT }}>🏆 Racket certificate</button>
          )}
        </div>
        <PlayerTargets T={T} accent={accent} p={p} onSaved={onSaved} />

        {/* Goal */}
        {showSec('goal') && <GoalBox T={T} accent={accent} p={p} stageId={hasStage ? curStage.id : ''} onSaved={onSaved} />}
        {/* Stats */}
        <div style={{ display: showSec('stats') ? 'grid' : 'none', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginTop: 14 }}>
          {tiles.map(t => (
            <div key={t.label} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
              <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.colour ?? T.text, marginTop: 3 }}>{t.value}</div>
              {t.sub && <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>{t.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* The colour they are working on — live grading, and the source of
          truth for Racket Progression. */}
      <div style={{ ...card, display: showSec('racket') ? undefined : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: curStage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Working on · {curStage.name} — {THEME[curStage.id]}</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: accent.hex, fontWeight: 700 }}>{progress}% {racketOn ? 'to award' : 'mastered'}</div>
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
        <p style={{ fontSize: 10.5, color: T.text3, marginTop: 4, lineHeight: 1.55 }}>
          Tap a bar to set mastery. Four bars (Consistent) = mastered.
          {racketOn ? ' Once all four skills are mastered the racket is ready to award in Racket Progression.' : ''}
          {!hasStage ? ' This player has no colour set yet — grade the foundation skills here, or set their colour when you edit them in the Roster.' : ''}
        </p>
      </div>

      {/* What the colours actually mean. A coach who does not run the reward
          ladder has never seen it explained anywhere, and neither has the
          assistant they just hired — so the key lives on this page too. */}
      <ColourLadder T={T} accent={accent} currentStageId={hasStage ? curStage.id : null} />

      {/* Colour journey + recent lessons */}
      <div style={{ display: showSec('journey') ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Colour journey</div>
            {/* The colour is set HERE (or on the roster) — Racket Progression only
                turns a colour that has been reached into a physical reward. Saying
                "awarded in Racket Progression" sent coaches looking for a button
                on another page to do something they had already done on this one. */}
            <div style={{ fontSize: 10.5, color: T.text3 }}>tap a colour to set it · tick to complete it</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {RACKET_STAGES.map((st, i) => {
              const state = !hasStage ? 'locked' : i < cur ? 'done' : i === cur ? 'current' : 'locked'
              return (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: state === 'locked' ? 0.55 : 1, borderRadius: 8, padding: '3px 4px', background: state === 'current' ? accent.dim : 'transparent' }}>
                  <button onClick={() => void setColour(st.id)} title={`Put ${p.name} on the ${st.name} colour`}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, textAlign: 'left', appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', fontFamily: FONT, padding: '3px 2px' }}>
                    <span style={{ width: 20, height: 12, borderRadius: 3, background: st.colour, border: '1px solid rgba(128,128,128,0.4)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.text, fontWeight: state === 'current' ? 700 : 500 }}>{st.name} · {THEME[st.id]}</span>
                  </button>
                  {state === 'current' && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: T.panel, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>now</span>}
                  {/* The tick is the action a coach actually wants here: "done
                      that one". Completing a colour moves them to the next. */}
                  <button onClick={() => completeColour(i)}
                    title={state === 'done' ? `${st.name} is complete` : `Mark ${st.name} complete and move ${p.name} to ${RACKET_STAGES[Math.min(i + 1, RACKET_STAGES.length - 1)].name}`}
                    style={{ appearance: 'none', cursor: 'pointer', width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, fontFamily: FONT, border: `1px solid ${state === 'done' ? T.good : T.border}`, background: state === 'done' ? `${T.good}1f` : 'transparent', color: state === 'done' ? T.good : T.text4 }}>
                    ✓
                  </button>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 10.5, color: T.text3, marginTop: 9, lineHeight: 1.5 }}>
            This is the colour everything else reads — the roster, the player&rsquo;s own app{racketOn ? ', and Racket Progression' : ''}.
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


// ── Setting the colour ──────────────────────────────────────────────────────
// A dropdown rather than a modal: choosing a colour is a one-second decision a
// coach makes at the end of a lesson, and it is the value everything else in
// the portal reads. "Not started" is a real option — a player who has not been
// graded yet should not be quietly put on White.
function ColourPicker({ T, accent, stageId, onPick }: {
  T: ThemeTokens; accent: AccentTokens; stageId: string; onPick: (id: string) => void
}) {
  const st = RACKET_STAGES.find(x => x.id === stageId) || null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, position: 'relative' }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: st ? st.colour : 'transparent', border: `1px solid ${st ? 'rgba(128,128,128,0.4)' : T.border}`, flexShrink: 0 }} />
      <select value={stageId} onChange={e => onPick(e.target.value)}
        title="Set this player's colour"
        style={{ appearance: 'none', background: 'transparent', border: 0, color: T.text, fontSize: 15, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', outline: 'none', padding: '0 14px 0 0', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(accent.hex)}' stroke-width='3'><polyline points='6 9 12 15 18 9'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}>
        <option value="">Not started</option>
        {RACKET_STAGES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
    </span>
  )
}

// ── The goal ────────────────────────────────────────────────────────────────
// It used to say "No goal set yet — add one when you edit this player in the
// Roster", which is an instruction to go somewhere else and type a sentence. So
// most players never had one. The colour the coach has already chosen says most
// of what the goal should be, so the three that fit this rung are offered right
// here, one tap each — with their own words still a click away for the player
// that none of them describes.
function GoalBox({ T, accent, p, stageId, onSaved }: {
  T: ThemeTokens; accent: AccentTokens; p: Player; stageId: string; onSaved?: () => void
}) {
  // Everything here is keyed to the player rather than reset by an effect, so
  // switching player can never leave the last one's goal (or a half-typed one)
  // on screen — and the freshly saved goal survives the roster refresh that
  // follows it, instead of flickering back to the stale row.
  const [ownFor, setOwnFor] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<{ id: string; goal: string } | null>(null)
  const own = ownFor === p.id
  const goal = (saved && saved.id === p.id ? saved.goal : p.goal) || ''

  const save = async (v: string) => {
    const clean = v.trim()
    if (!clean || busy) return
    setBusy(true)
    try { await dbUpdate('coach_players', p.id, { goal: clean }); setSaved({ id: p.id, goal: clean }); setOwnFor(null); onSaved?.() } catch { /* surfaced in console */ }
    setBusy(false)
  }

  const presets = goalPresets(stageId)

  return (
    <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '10px 12px', marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>⚑ Goal</span>
        <span style={{ fontSize: 12.5, color: T.text, fontWeight: goal ? 600 : 400 }}>{goal || 'Nothing set yet — pick one below, or write your own.'}</span>
        {!!goal && (
          <button onClick={() => { setOwnFor(p.id); setText(goal) }}
            style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Change</button>
        )}
      </div>

      {(!goal || own) && (
        <div style={{ marginTop: 9 }}>
          {!own && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {presets.map(g => (
                <button key={g} onClick={() => void save(g)} disabled={busy}
                  style={{ appearance: 'none', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 999, padding: '5px 12px', fontSize: 11.5, color: T.text2, cursor: busy ? 'wait' : 'pointer', fontFamily: FONT }}>
                  {g}
                </button>
              ))}
              <button onClick={() => { setOwnFor(p.id); setText('') }}
                style={{ appearance: 'none', background: 'transparent', border: `1px dashed ${accent.border}`, borderRadius: 999, padding: '5px 12px', fontSize: 11.5, color: accent.hex, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                ✎ Write your own
              </button>
            </div>
          )}
          {own && (
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <input value={text} onChange={e => setText(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key === 'Enter') void save(text) }}
                placeholder={`What is ${(p.name || 'this player').split(/\s+/)[0]} working towards?`}
                style={{ flex: 1, minWidth: 220, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 11px', fontSize: 12.5, color: T.text, fontFamily: FONT, outline: 'none' }} />
              <button onClick={() => void save(text)} disabled={!text.trim() || busy}
                style={{ appearance: 'none', border: 0, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, background: text.trim() ? accent.hex : T.border, color: text.trim() ? T.btnText : T.text3, cursor: text.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT }}>Save</button>
              <button onClick={() => setOwnFor(null)}
                style={{ appearance: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: 'transparent', color: T.text3, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Development targets ──────────────────────────────────────────────────────
// The goal says where a player wants to get to. This says what the next block of
// sessions is actually for — the piece that was missing, so a skills matrix and
// a pile of lesson summaries never added up to a plan.
function PlayerTargets({ T, accent, p, onSaved }: { T: ThemeTokens; accent: AccentTokens; p: Player; onSaved?: () => void }) {
  const [targets, setTargets] = useState<Target[]>(Array.isArray(p.targets) ? p.targets : [])
  const [note, setNote] = useState(p.targets_note || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Switching player must not leave the previous player's targets on screen —
  // but this must key on the PLAYER, not on the player's targets. It used to run
  // whenever `p.targets` changed identity, and the cached roster row still said
  // null, so the targets Lumio Coach had just written were wiped off the screen
  // the moment React re-rendered. The coach saw "done" and then nothing, and only
  // found them by navigating away and back, which re-read the row from the
  // database. Reset on p.id; after a write, refresh the roster so the row
  // underneath agrees with what is on screen.
  useEffect(() => {
    setTargets(Array.isArray(p.targets) ? p.targets : [])
    setNote(p.targets_note || ''); setErr('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id])

  const set = async () => {
    if (busy) return
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/coach/player-targets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: p.id }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Lumio Coach could not set targets')
      setTargets(d.targets || []); setNote(d.note || '')
      onSaved?.()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Lumio Coach could not set targets') }
    setBusy(false)
  }

  const when = p.targets_set_at ? new Date(p.targets_set_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''

  return (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>◎ Development targets</span>
        {targets.length > 0 && when && <span style={{ fontSize: 10.5, color: T.text3 }}>set {when}{p.targets_by === 'lumio-coach' ? ' by Lumio Coach' : ''}</span>}
        <button onClick={set} disabled={busy} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: targets.length ? 'transparent' : accent.hex, color: targets.length ? accent.hex : T.btnText, borderRadius: 8, padding: targets.length ? '4px 8px' : '7px 13px', fontSize: 11.5, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', fontFamily: FONT }}>
          {busy ? 'Lumio Coach is thinking…' : targets.length ? '↻ Re-set' : '✦ Set targets'}
        </button>
      </div>

      {err && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 8 }}>{err}</div>}

      {targets.length === 0 && !busy && !err && (
        <div style={{ fontSize: 12, color: T.text3, marginTop: 8, lineHeight: 1.55 }}>
          Nothing set yet. Lumio Coach reads {(p.name || 'this player').split(' ')[0]}&rsquo;s skills, their record and their own goal, and picks the three things worth working on next.
        </div>
      )}

      {targets.map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: i ? `1px solid ${T.border}` : `1px solid ${T.border}`, marginTop: i ? 0 : 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: accent.hex, width: 16, flexShrink: 0, paddingTop: 1 }}>{i + 1}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{t.target}</div>
            {t.why && <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5, marginTop: 2 }}>{t.why}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              {t.measure && <span style={{ fontSize: 10.5, color: T.text3 }}>✓ {t.measure}</span>}
              {t.by && <span style={{ fontSize: 10.5, color: T.text3 }}>· {t.by}</span>}
            </div>
          </div>
        </div>
      ))}

      {note && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 10, lineHeight: 1.55, fontStyle: 'italic' }}>&ldquo;{note}&rdquo;</div>}
    </div>
  )
}
