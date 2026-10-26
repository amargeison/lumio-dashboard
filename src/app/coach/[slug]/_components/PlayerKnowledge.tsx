'use client'

// What a client told the coach in their welcome questionnaire, and what their
// lessons have and have not covered lately — one card, used in the session
// planner, the lesson log and the client's profile. See lib/coach/coverage.ts.

import { useMemo, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'
import { coverage, nextUp, whatTheySaid, whenWords, RECENT_DAYS, type AreaStat } from '@/lib/coach/coverage'
import type { Answers } from '@/lib/coach/questionnaire'
import { ukDate } from '@/lib/coach/uk-date'
import { sortNotes, kindLabel, type PlayerNote } from '@/lib/coach/player-notes'

type Qn = { id: string; player_id?: string | null; answers?: Answers | null; submitted_at?: string | null }
type Lesson = { id: string; player_id?: string | null; session_date?: string | null; focus?: string | null; review_json?: Record<string, unknown> | null }

const SHORT = new Set(['Wants', 'In 3 months', 'Likes in lessons', 'Likes to be coached', 'Frustrates them'])

export function PlayerKnowledge({ T, accent, playerId, firstName, compact = false, onPick }: {
  T: ThemeTokens; accent: AccentTokens; playerId: string | null | undefined; firstName?: string
  /** The planner's version: fewer lines, and "next up" can be used as the session focus. */
  compact?: boolean
  onPick?: (area: string) => void
}) {
  const qns = useCoachTable<Qn>('coach_questionnaires')
  const lessons = useCoachTable<Lesson>('coach_sessions')
  // The coach's own notes about them (private — this card is only ever on coach screens).
  const notes = useCoachTable<PlayerNote>('coach_player_notes')
  const id = playerId ? String(playerId) : ''
  const answers = useMemo(() => {
    const mine = qns.rows.filter(q => String(q.player_id || '') === id).sort((a, b) => String(b.submitted_at || '').localeCompare(String(a.submitted_at || '')))
    return (mine[0]?.answers || null) as Answers | null
  }, [qns.rows, id])
  const stats = useMemo(() => coverage(lessons.rows.filter(l => String(l.player_id || '') === id), answers, ukDate()), [lessons.rows, answers, id])
  if (!id) return null
  const theirNotes = sortNotes(notes.rows.filter(n => String(n.player_id) === id))
  const remember = (theirNotes.some(n => n.pinned) ? theirNotes.filter(n => n.pinned) : theirNotes).slice(0, compact ? 2 : 3)

  const said = whatTheySaid(answers).filter(s => !compact || SHORT.has(s.label))
  const up = nextUp(stats)
  const anyLesson = stats.some(s => s.last)
  const who = firstName || 'They'
  const tone = (s: AreaStat) => (s.state === 'recent' ? T.good : s.state === 'while' ? T.warn : T.text3)
  const lbl: CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.text3 }

  return (
    <div data-testid="player-knowledge" style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: compact ? '10px 12px' : '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={lbl}>What {who === 'They' ? 'they' : who} told you</div>
        {said.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {said.map(s => (
              <div key={s.label} style={{ fontSize: 12, color: T.text2, lineHeight: 1.45 }}><span style={{ color: T.text3 }}>{s.label}:</span> {s.text}</div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: T.text3, marginTop: 5, lineHeight: 1.45 }}>No welcome questionnaire yet. You can send their welcome link from their profile.</div>
        )}
      </div>

      <div>
        <div style={lbl}>Covered in the last {RECENT_DAYS / 7} weeks</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
          {stats.map(s => (
            <span key={s.id} title={[s.last ? `Last worked on ${whenWords(s)}` : 'Not in any recorded lesson', s.lessons ? `${s.lessons} lesson${s.lessons === 1 ? '' : 's'} in ${RECENT_DAYS / 7} weeks` : '', s.wants.length ? `Matters to them: ${s.wants.join(', ')}` : ''].filter(Boolean).join(' · ')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 8px', borderRadius: 999, border: `1px solid ${s.state === 'gap' ? T.border : tone(s) + '55'}`, background: s.state === 'gap' ? 'transparent' : tone(s) + '14', color: s.state === 'gap' ? T.text3 : T.text2 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: s.state === 'gap' ? 'transparent' : tone(s), border: s.state === 'gap' ? `1px solid ${T.text3}` : 'none' }} />
              {s.name}
              <span style={{ color: T.text3 }}>{s.last ? whenWords(s) : 'not yet'}</span>
              {s.rating != null && <span style={{ color: s.rating <= 2 ? T.warn : T.text3, fontWeight: 600 }}>{s.rating}/5</span>}
              {s.wants.length > 0 && <span aria-label="matters to them" style={{ color: accent.hex }}>★</span>}
            </span>
          ))}
        </div>
        {!anyLesson && <div style={{ fontSize: 11, color: T.text3, marginTop: 5 }}>No lessons written up for them yet.</div>}
      </div>

      {remember.length > 0 && (
        <div>
          <div style={lbl}>Remember · your private notes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
            {remember.map(n => <div key={n.id} style={{ fontSize: 12, color: T.text2, lineHeight: 1.45 }}><span style={{ color: T.text3 }}>{kindLabel(n.kind)}:</span> {n.text}</div>)}
          </div>
        </div>
      )}

      {up.length > 0 && (
        <div>
          <div style={lbl}>Worth bringing in soon</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {up.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: T.text2 }}>
                <b style={{ color: T.text }}>{s.name}</b>
                <span style={{ color: T.text3 }}>{s.wants.join(', ')} · last {whenWords(s)}</span>
                {onPick && <button onClick={() => onPick(s.name)} style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${accent.hex}66`, background: accent.dim, color: accent.hex, borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Use as focus</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
