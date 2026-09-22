'use client'

// The colour ladder, as a reference key on Player Development.
//
// A coach who runs the reward system reads this ladder on the Racket
// Progression screen. A coach who does not has never seen it — and "Sven is on
// Blue" means nothing to them, nor to the assistant they just hired. So the
// same ladder lives here too, in the language this screen uses: colours, what
// each one is for, the ball a player is on, the LTA stage it lines up with, and
// the four skills that have to be consistent before the next colour.
//
// Collapsed by default. It is a key, not the page.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { RACKET_STAGES, RACKET_SKILLS } from '../_lib/coach-db'
import { STAGE_META, LTA_MAP, BALL_COLOUR, ltaShort } from '@/lib/coach/colour-ladder'

export function ColourLadder({ T, accent, currentStageId }: {
  T: ThemeTokens; accent: AccentTokens
  /** The colour the player being viewed is on — opened first, so the key
      answers "what is this player working on" before anything else. */
  currentStageId?: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState<string>(currentStageId || RACKET_STAGES[0].id)

  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
  const stage = RACKET_STAGES.find(s => s.id === open) || RACKET_STAGES[0]
  const meta = STAGE_META[stage.id]
  const lta = LTA_MAP[stage.id]
  const skills = RACKET_SKILLS[stage.id] || []

  return (
    <div style={{ ...card, fontFamily: FONT }}>
      <button onClick={() => setExpanded(v => !v)}
        style={{ appearance: 'none', border: 0, background: 'transparent', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {RACKET_STAGES.map(s => (
            <span key={s.id} style={{ width: 16, height: 10, borderRadius: 2, background: s.colour, border: '1px solid rgba(128,128,128,0.4)', opacity: currentStageId && s.id === currentStageId ? 1 : 0.75, outline: currentStageId && s.id === currentStageId ? `2px solid ${accent.hex}` : 'none', outlineOffset: 1 }} />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>The colour ladder</div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>
            Nine colours, four skills each · mapped to the LTA Youth pathway
          </div>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: accent.hex }}>{expanded ? 'Hide' : 'What do the colours mean?'}</span>
      </button>

      {expanded && (
        <>
          <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.6, margin: '12px 0 12px', maxWidth: 760 }}>
            Each colour maps to a stage of the LTA Youth programme — the five ball-colour stages
            <span style={{ color: '#3A8EE0' }}> Blue</span> →<span style={{ color: '#C75A5A' }}> Red</span> →
            <span style={{ color: '#E08A3C' }}> Orange</span> →<span style={{ color: '#4FAE72' }}> Green</span> →
            <span style={{ color: '#E5C76B' }}> Yellow</span>, then the Compete grades and the performance pathway.
            The colour is your academy&rsquo;s ladder; the LTA stage is the national-framework equivalent.
            <div style={{ fontSize: 10.5, color: T.text4, marginTop: 6, fontStyle: 'italic' }}>
              Lumio is independent and is not affiliated with, endorsed by, or approved by the LTA. &ldquo;LTA Youth&rdquo; is a
              trademark of the Lawn Tennis Association, used here only to describe the equivalent national stage.
            </div>
          </div>

          {/* The ladder */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RACKET_STAGES.map((s, i) => {
              const m = STAGE_META[s.id]
              const on = open === s.id
              const isCurrent = currentStageId === s.id
              return (
                <button key={s.id} onClick={() => setOpen(s.id)}
                  style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, flex: '1 1 90px', padding: '10px 8px', borderRadius: 8, background: on ? accent.dim : T.panel2, border: `1px solid ${on ? accent.border : T.border}`, textAlign: 'center' }}>
                  <div style={{ height: 20, borderRadius: 4, background: s.colour, border: '1px solid rgba(128,128,128,0.4)', marginBottom: 6 }} />
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.text }}>{i + 1}. {s.name}</div>
                  <div style={{ fontSize: 9.5, color: T.text3 }}>{m?.theme}</div>
                  <div style={{ marginTop: 4, display: 'inline-block', fontSize: 9, fontWeight: 700, color: BALL_COLOUR[m?.ball], background: `${BALL_COLOUR[m?.ball]}1f`, padding: '2px 7px', borderRadius: 999 }}>{m?.ball} ball</div>
                  <div style={{ fontSize: 8.5, color: LTA_MAP[s.id]?.colour ?? T.text3, marginTop: 4, fontWeight: 600 }}>{ltaShort(s.id)}</div>
                  {isCurrent && <div style={{ fontSize: 8, fontWeight: 700, color: accent.hex, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>on this now</div>}
                </button>
              )
            })}
          </div>

          {/* What the open colour asks for */}
          <div style={{ marginTop: 14, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ width: 38, height: 24, borderRadius: 5, background: stage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{stage.name} — {meta?.theme}</div>
                <div style={{ fontSize: 11.5, color: T.text3 }}>{meta?.age} · {meta?.ball} ball stage</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 999, padding: '4px 10px' }}>
                {skills.length} skills to master
              </div>
            </div>

            {lta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.panel, border: `1px solid ${T.border}`, borderLeft: `3px solid ${lta.colour}`, borderRadius: 8, padding: '9px 12px', margin: '12px 0', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: lta.colour, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LTA equivalent</span>
                <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{lta.stage}</span>
                <span style={{ fontSize: 11, color: T.text3 }}>· ages {lta.ages}</span>
                <div style={{ flexBasis: '100%', fontSize: 11.5, color: T.text2, marginTop: 2 }}>{lta.focus}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
              {skills.map(sk => (
                <div key={sk.name} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{sk.name}</div>
                  <div style={{ fontSize: 11, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>{sk.note}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginTop: 12, lineHeight: 1.5 }}>
              A colour is finished when all {skills.length || 4} skills are graded Consistent. Grade them on the player above.
            </div>
          </div>
        </>
      )}
    </div>
  )
}
