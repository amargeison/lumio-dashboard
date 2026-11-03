'use client'

// An adult's pathway on Player Development — the same shape as a junior's
// colour pathway, on the academy's own adult levels instead (see AdultLevels.tsx
// and lib/coach/adult-levels.ts):
//
//   AdultLevelPicker  the "Adult level" tile, like the junior "Current colour"
//   AdultWorkingOn    the level they are on: its checklist, ticked here with
//                     the day each item was passed, and "Move up" once complete
//   AdultJourney      every level as a coloured ladder: tap one to put them on
//                     it, tick the current one to move them up, with Undo
//
// useAdultMove is the one place the level is changed from this screen, so the
// tile, the checklist and the journey cannot disagree. Moving up one level
// happens at once with an Undo (asked first if the checklist is not complete);
// moving down or skipping levels is asked about. Ticks are never deleted by a
// move, so moving back restores them.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { dbInsert, dbRemove, dbUpdate } from '../_lib/coach-db'
import { adultColour, videoEmbed, type AdultLevel, type AdultPass, type AdultStanding } from '@/lib/coach/adult-levels'
import { ukDate } from '@/lib/coach/uk-date'
import { askConfirm } from '../_lib/ask'
import { LevelSwatch } from './AdultLevels'

type Who = { id: string; name: string; adult_level_id?: string | null; staff_id?: string | null }
type Passes = (AdultPass & { id: string })[]
const shortDay = (d?: string | null) => d ? new Date(`${String(d).slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : ''

export function useAdultMove(p: Who, levels: AdultLevel[], a: AdultStanding | null, onSaved?: () => void) {
  const [moved, setMoved] = useState<{ player: string; from: string | null; to: string | null } | null>(null)
  const [err, setErr] = useState('')
  const nameOf = (id: string | null) => { const i = levels.findIndex(l => l.id === id); return i < 0 ? 'no level' : `${i + 1}. ${levels[i].name}` }
  const write = async (to: string | null, undoing = false) => {
    const from = p.adult_level_id || null
    setErr('')
    try {
      await dbUpdate('coach_players', p.id, { adult_level_id: to })
      setMoved(undoing ? null : { player: p.id, from, to })
      onSaved?.()
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : 'That was not saved.') }
  }
  const set = async (levelId: string | null) => {
    const from = levels.findIndex(l => l.id === p.adult_level_id)
    const to = levels.findIndex(l => l.id === levelId)
    if (to === from) return
    const first = (p.name || '').trim().split(/\s+/)[0] || p.name
    if (to < from) {
      const what = to < 0 ? `Take ${p.name} off ${levels[from].name}, with no level?` : `Move ${p.name} back down from ${levels[from].name} to ${levels[to].name}?`
      if (!(await askConfirm(`${what}\n\nTheir ticks are kept.`, { yes: 'Move down' }))) return
    } else if (from >= 0 && to > from + 1) {
      if (!(await askConfirm(`Move ${p.name} from ${levels[from].name} straight to ${levels[to].name}, skipping ${levels.slice(from + 1, to).map(l => l.name).join(', ')}?`, { yes: 'Move' }))) return
    } else if (from >= 0 && a && a.total > 0 && a.done < a.total) {
      if (!(await askConfirm(`${first} has passed ${a.done} of the ${a.total} on ${levels[from].name}.\n\nMove them up to ${levels[to].name} anyway?`, { yes: 'Move up' }))) return
    }
    await write(levelId)
  }
  const undo = () => { if (moved) void write(moved.from, true) }
  return { set, moved: moved && moved.player === p.id ? moved : null, undo, nameOf, err }
}

/** The "Adult level" tile: a level picker drawn like the junior colour picker. */
export function AdultLevelPicker({ T, accent, levels, levelId, onPick }: { T: ThemeTokens; accent: AccentTokens; levels: AdultLevel[]; levelId: string | null; onPick: (id: string | null) => void }) {
  const i = levels.findIndex(l => l.id === levelId)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, maxWidth: '100%' }}>
      <LevelSwatch colour={i >= 0 ? adultColour(i) : null} w={14} h={14} T={T} />
      <select value={i >= 0 ? levelId || '' : ''} onChange={e => onPick(e.target.value || null)} title="Set this player's adult level" aria-label="Adult level"
        style={{ appearance: 'none', background: 'transparent', border: 0, color: i >= 0 ? T.text : T.text3, fontSize: 15, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', outline: 'none', padding: '0 14px 0 0', minWidth: 0, maxWidth: '100%', textOverflow: 'ellipsis', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(accent.hex)}' stroke-width='3'><polyline points='6 9 12 15 18 9'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}>
        <option value="">No level yet</option>
        {levels.map((l, n) => <option key={l.id} value={l.id}>{n + 1}. {l.name}</option>)}
      </select>
    </span>
  )
}

/** The level they are on, with its checklist ticked here. */
export function AdultWorkingOn({ T, accent, p, a, levels, passes, onSet, style }: {
  T: ThemeTokens; accent: AccentTokens; p: Who; a: AdultStanding; levels: AdultLevel[]; passes: Passes
  onSet: (id: string | null) => void; style?: CSSProperties
}) {
  const [err, setErr] = useState('')
  const [watching, setWatching] = useState(false)
  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, ...style }
  const level = a.level ? levels.find(l => l.id === a.level!.id) || null : null
  const next = a.number ? levels[a.number] || null : null
  const vid = level ? videoEmbed(level.video_url) : null
  const ready = a.total > 0 && a.done === a.total
  const toggle = async (itemId: string, on: boolean) => {
    if (!level) return
    setErr('')
    try {
      if (on) await dbInsert('coach_adult_passes', { player_id: p.id, level_id: level.id, item_id: itemId, passed_on: ukDate(), ...(p.staff_id ? { staff_id: p.staff_id } : {}) })
      else for (const x of passes.filter(r => r.player_id === p.id && r.level_id === level.id && r.item_id === itemId)) await dbRemove('coach_adult_passes', x.id)
    } catch (e) { setErr(e instanceof Error && e.message ? e.message : 'That was not saved.') }
  }

  if (!level) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <LevelSwatch colour={null} w={14} h={14} T={T} />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>No adult level yet</div>
        </div>
        {levels.length === 0 ? (
          <p style={{ fontSize: 12, color: T.text3, margin: 0, lineHeight: 1.55 }}>Your academy has no adult levels yet. Set them up under Racket Progression → Adult levels.</p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: T.text3, margin: '0 0 10px', lineHeight: 1.55 }}>{p.name.split(/\s+/)[0]} is an adult, so they go on your adult levels rather than the junior colours. Pick the level that fits them in the journey below, or start at the first.</p>
            <button onClick={() => onSet(levels[0].id)} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>▶ Start on 1. {levels[0].name}</button>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ alignSelf: 'center', display: 'inline-flex' }}><LevelSwatch colour={a.colour} w={14} h={14} T={T} /></span>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, minWidth: 0, overflowWrap: 'anywhere' }}>Working on · {a.short}{level.summary ? <span style={{ fontWeight: 500, color: T.text3 }}> — {level.summary}</span> : null}</div>
        {a.total > 0 && <div style={{ marginLeft: 'auto', fontSize: 11, color: ready ? T.good : accent.hex, fontWeight: 700, fontFamily: FONT_MONO }}>{a.done}/{a.total} passed</div>}
      </div>
      {a.total > 0 && (
        <div style={{ height: 6, borderRadius: 3, background: T.hover, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${(a.done / a.total) * 100}%`, background: ready ? T.good : (a.colour || accent.hex), transition: 'width .2s' }} />
        </div>
      )}
      {err && <div role="alert" style={{ fontSize: 12, color: T.bad, marginBottom: 8 }}>{err}</div>}
      {level.checklist.length === 0 && <p style={{ fontSize: 12, color: T.text3 }}>This level has no checklist yet. Add one under Racket Progression → Adult levels.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {level.checklist.map(item => {
          const on = a.passed.has(item.id)
          const when = passes.find(r => r.player_id === p.id && r.level_id === level.id && r.item_id === item.id)?.passed_on
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.panel2, border: `1px solid ${on ? `${T.good}55` : T.border}`, borderRadius: 8, padding: '8px 10px' }}>
              <button onClick={() => void toggle(item.id, !on)} aria-pressed={on} aria-label={on ? `Untick: ${item.text}` : `Tick: ${item.text}`} title={on ? 'Passed — tap to untick' : 'Tap when they have shown it'}
                style={{ appearance: 'none', cursor: 'pointer', width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, fontFamily: FONT, border: `1px solid ${on ? T.good : T.border}`, background: on ? `${T.good}1f` : 'transparent', color: on ? T.good : T.text4 }}>✓</button>
              <span style={{ flex: 1, fontSize: 12.5, color: on ? T.text : T.text2, fontWeight: on ? 600 : 400 }}>{item.text}</span>
              {on && when && <span style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap' }}>{shortDay(when)}</span>}
            </div>
          )
        })}
      </div>
      {ready && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: T.good, fontWeight: 700 }}>✓ {level.name} passed</span>
          {next
            ? <button onClick={() => onSet(next.id)} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Move up to {a.number + 1}. {next.name}</button>
            : <span style={{ fontSize: 12, color: T.text3 }}>That is the top level.</span>}
        </div>
      )}
      {vid && (
        <div style={{ marginTop: 12 }}>
          {watching ? (
            <div style={{ maxWidth: 520 }}>
              <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 9, overflow: 'hidden', background: '#000' }}>
                <iframe src={vid.embed} title={`${level.name} video`} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
              </div>
              <button onClick={() => setWatching(false)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '5px 11px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, marginTop: 6 }}>Close video</button>
            </div>
          ) : <button onClick={() => setWatching(true)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '5px 11px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>▶ Watch the {level.name} video</button>}
        </div>
      )}
      <p style={{ fontSize: 10.5, color: T.text3, marginTop: 10, marginBottom: 0, lineHeight: 1.55 }}>Tick an item when they show it — the day is kept. {p.name.split(/\s+/)[0]} sees this checklist on their own page.</p>
    </div>
  )
}

/** Every level as a coloured ladder, like the junior colour journey. */
export function AdultJourney({ T, accent, p, a, levels, move }: {
  T: ThemeTokens; accent: AccentTokens; p: Who; a: AdultStanding; levels: AdultLevel[]
  move: ReturnType<typeof useAdultMove>
}) {
  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }
  const cur = a.number - 1
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Level journey</div>
        <div style={{ fontSize: 10.5, color: T.text3 }}>tap a level to set it · tick the current one to move up</div>
      </div>
      {levels.length === 0 ? <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>No adult levels set up yet.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {levels.map((l, i) => {
            const state = cur < 0 ? 'locked' : i < cur ? 'done' : i === cur ? 'current' : 'locked'
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: state === 'locked' ? 0.55 : 1, borderRadius: 8, padding: '3px 4px', background: state === 'current' ? accent.dim : 'transparent' }}>
                <button onClick={() => void move.set(l.id)} title={`Put ${p.name} on ${l.name}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, textAlign: 'left', appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', fontFamily: FONT, padding: '3px 2px' }}>
                  <LevelSwatch colour={adultColour(i)} T={T} />
                  <span style={{ fontSize: 12, color: T.text, fontWeight: state === 'current' ? 700 : 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {l.name}{l.summary ? <span style={{ color: T.text3, fontWeight: 400 }}> · {l.summary}</span> : null}</span>
                </button>
                {state === 'current' && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: T.panel, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>now</span>}
                {state === 'done' && (
                  <span title={`${l.name} is passed`} style={{ width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, border: `1px solid ${T.good}`, background: `${T.good}1f`, color: T.good }}>✓</span>
                )}
                {state === 'current' && i < levels.length - 1 && (
                  <button onClick={() => void move.set(levels[i + 1].id)} title={`Mark ${l.name} passed and move ${p.name} up to ${levels[i + 1].name}`} aria-label={`Mark ${l.name} passed`}
                    style={{ appearance: 'none', cursor: 'pointer', width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, fontFamily: FONT, border: `1px solid ${a.total > 0 && a.done === a.total ? accent.hex : T.border}`, background: 'transparent', color: a.total > 0 && a.done === a.total ? accent.hex : T.text4 }}>✓</button>
                )}
              </div>
            )
          })}
        </div>
      )}
      {move.err && <div role="alert" style={{ fontSize: 11.5, color: T.bad, marginTop: 8 }}>{move.err}</div>}
      {move.moved && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, padding: '6px 9px', borderRadius: 8, background: T.panel2, border: `1px solid ${T.border}`, fontSize: 11.5, color: T.text2 }}>
          <span style={{ flex: 1 }}>Moved from {move.nameOf(move.moved.from)} to {move.nameOf(move.moved.to)}.</span>
          <button onClick={move.undo} style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Undo</button>
        </div>
      )}
      <div style={{ fontSize: 10.5, color: T.text3, marginTop: 9, lineHeight: 1.5 }}>
        Your academy&rsquo;s adult levels — set up and changed under Racket Progression → Adult levels. This is the level the roster, the player&rsquo;s own page and the iPhone app read.
      </div>
    </div>
  )
}
