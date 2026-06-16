'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  BELTS, LTA_MAP, STANDARDS, FOCUS_CATALOGUE, focusForBelt, beltIndexOf,
  ONBOARDING_LEVELS, mapOnboardingToBelt, TODAY, type Player, type TodaySession, type Booking,
} from '../_lib/coach-data'
import { mapBookingType } from '../_lib/schedule'
import { addSession } from '../_lib/sessions-store'
import { addPlayer } from '../_lib/roster-store'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
function computeEnd(time: string, mins: number) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!m) return time
  let total = parseInt(m[1]) * 60 + parseInt(m[2]) + (mins || 0)
  total = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
function minsBetween(start: string, end: string) {
  const at = (t: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim()); return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0 }
  return Math.max(at(end) - at(start), 0)
}
function draftFocus(focus: string, note: string) {
  const fl = (focus.trim() || 'the focus').toLowerCase()
  const lines = note.split(/[\n.;]+/).map(s => s.trim()).filter(Boolean)
  const focusPoints = [
    `Build ${fl} — clear cue, controlled feeds first`,
    lines[0] ? `From your note: ${lines[0].toLowerCase()}` : 'Keep margin and consistency over pace',
    `Take ${fl} into live points and patterns`,
  ]
  const drills = [`${cap(fl)} ladder — 10 in a row`, 'Target cones with a success rate', `Pressure points from ${fl}`]
  return { focusPoints, drills }
}

type SessType = TodaySession['type']

export function NewSessionModal({ T, accent, players, seedBooking, onClose, onCreated }: { T: ThemeTokens; accent: AccentTokens; density: Density; players: Player[]; seedBooking?: Booking; onClose: () => void; onCreated: (id: string) => void }) {
  // When launched from a confirmed booking, pre-fill from it. A roster match wires
  // racket/focus; a squad/cardio booking with no roster player falls back to a
  // free-text name (the coach fills focus manually) — never crashes on no player.
  const seedPlayer = seedBooking ? players.find(p => p.name === seedBooking.player) : undefined
  const seedType = seedBooking ? (mapBookingType(seedBooking.type) ?? 'Private') : undefined

  const [source, setSource] = useState<'roster' | 'new'>(seedBooking && !seedPlayer ? 'new' : 'roster')
  const [playerId, setPlayerId] = useState(seedPlayer?.id ?? players[0]?.id ?? '')
  const [customName, setCustomName] = useState(seedBooking && !seedPlayer ? seedBooking.player : '')

  // Onboarding intake (new player)
  const [obLevel, setObLevel] = useState(ONBOARDING_LEVELS[0].id)
  const [obYears, setObYears] = useState('')
  const [obAge, setObAge] = useState('')
  const [mapped, setMapped] = useState(false)

  // Session detail
  const [time, setTime] = useState(seedBooking?.start ?? '14:00')
  const [mins, setMins] = useState(seedBooking ? String(minsBetween(seedBooking.start, seedBooking.end)) : '60')
  const [type, setType] = useState<SessType>(seedType ?? 'Private')
  const [court, setCourt] = useState(seedBooking && seedBooking.court !== '—' ? seedBooking.court : 'Court 1')

  // Belt ⇄ standard (1:1) + matched focus
  const rosterPlayer0 = players.find(p => p.id === playerId)
  const initialBelt = BELTS[rosterPlayer0?.beltIndex ?? 0]?.id ?? BELTS[0].id
  const [beltId, setBeltId] = useState(initialBelt)
  const [focus, setFocus] = useState(focusForBelt(initialBelt))

  const [note, setNote] = useState('')
  const [focusPoints, setFocusPoints] = useState('')
  const [drills, setDrills] = useState('')
  const [drafted, setDrafted] = useState(false)

  const input: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }
  const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div style={{ marginBottom: 12 }}><label style={labelStyle}>{label}</label>{children}</div>
  )

  const rosterPlayer = players.find(p => p.id === playerId)
  const belt = BELTS[beltIndexOf(beltId)]
  const standard = LTA_MAP[beltId]
  const focusBelt = FOCUS_CATALOGUE.flatMap(g => g.options).find(o => o.label === focus)?.belt
  const focusMatches = focusBelt === beltId

  const playerName = source === 'roster' ? (rosterPlayer?.name ?? '') : customName.trim()
  const canSave = playerName.length > 0 && focus.trim().length > 0
  const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)

  // Selecting a belt (or standard) snaps the other and matches the focus.
  const pickBelt = (id: string) => { setBeltId(id); setFocus(focusForBelt(id)) }

  // Read the onboarding answers → place at a belt → draft the plan.
  const mapFromOnboarding = () => {
    const idx = mapOnboardingToBelt(obLevel, Number(obYears) || 0, Number(obAge) || 0)
    const id = BELTS[idx].id
    setBeltId(id)
    const f = focusForBelt(id)
    setFocus(f)
    const d = draftFocus(f, note)
    setFocusPoints(d.focusPoints.join('\n')); setDrills(d.drills.join('\n')); setDrafted(true)
    setMapped(true)
  }

  const runDraft = () => {
    const d = draftFocus(focus, note)
    setFocusPoints(d.focusPoints.join('\n')); setDrills(d.drills.join('\n')); setDrafted(true)
  }

  const save = () => {
    if (!canSave) return
    let linkedId = source === 'roster' ? rosterPlayer?.id : undefined

    // New player → add them to the roster at the mapped belt so it persists.
    if (source === 'new') {
      const age = Number(obAge) || (beltIndexOf(beltId) >= 6 ? 16 : 11)
      const group: Player['group'] = age >= 18 ? 'Adult' : beltIndexOf(beltId) >= 6 ? 'Performance' : 'Junior'
      const initials = customName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'P'
      const np: Player = {
        id: `new-${Date.now()}`, name: customName.trim(), initials, age, group,
        beltIndex: beltIndexOf(beltId), seed: Date.now() % 100,
        goal: focus.trim(), attendance: 100, nextSession: `${time.trim()} today`,
        parent: undefined, status: 'green', trend: 'flat',
      }
      addPlayer(np)
      linkedId = np.id
    }

    const session: TodaySession = {
      id: `new-sess-${Date.now()}`,
      time: time.trim(), end: computeEnd(time, Number(mins) || 60),
      player: playerName, playerId: linkedId,
      type, court: court.trim() || 'Court 1', mins: Number(mins) || 60,
      focus: focus.trim(), status: 'upcoming',
      date: seedBooking?.date ?? TODAY, bookingId: seedBooking?.id,
      focusPoints: lines(focusPoints).length ? lines(focusPoints) : undefined,
      drills: lines(drills).length ? lines(drills) : undefined,
    }
    addSession(session); onCreated(session.id); onClose()
  }

  const Seg = ({ v, label }: { v: 'roster' | 'new'; label: string }) => (
    <button onClick={() => { setSource(v); setMapped(false) }} style={{ appearance: 'none', border: 0, padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: source === v ? accent.hex : 'transparent', color: source === v ? T.btnText : T.text2, fontWeight: source === v ? 600 : 400 }}>{label}</button>
  )

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="flag" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>New session</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <Field label="Player">
            <div style={{ display: 'inline-flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, marginBottom: 8 }}>
              <Seg v="roster" label="From roster" /><Seg v="new" label="New player" />
            </div>
            {source === 'roster'
              ? <select style={input} value={playerId} onChange={e => { setPlayerId(e.target.value); const b = BELTS[players.find(p => p.id === e.target.value)?.beltIndex ?? 0]?.id ?? BELTS[0].id; pickBelt(b) }}>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              : <input style={input} value={customName} onChange={e => setCustomName(e.target.value)} placeholder="New player's name" autoFocus />}
          </Field>

          {/* Onboarding intake — only for a brand-new player */}
          {source === 'new' && (
            <div style={{ background: `linear-gradient(120deg, ${accent.dim}, transparent)`, border: `1px solid ${accent.border}`, borderRadius: 11, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <Icon name="note" size={14} stroke={1.6} style={{ color: accent.hex }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>From their onboarding</span>
                <span style={{ fontSize: 10.5, color: T.text3 }}>place them at the right racket</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.8fr', gap: 10, marginTop: 8 }}>
                <div><label style={labelStyle}>Experience</label><select style={input} value={obLevel} onChange={e => { setObLevel(e.target.value); setMapped(false) }}>{ONBOARDING_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select></div>
                <div><label style={labelStyle}>Yrs playing</label><input style={input} inputMode="numeric" value={obYears} onChange={e => { setObYears(e.target.value.replace(/\D/g, '')); setMapped(false) }} placeholder="0" /></div>
                <div><label style={labelStyle}>Age</label><input style={input} inputMode="numeric" value={obAge} onChange={e => { setObAge(e.target.value.replace(/\D/g, '')); setMapped(false) }} placeholder="10" /></div>
              </div>
              <button onClick={mapFromOnboarding} style={{ marginTop: 10, appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name="sparkles" size={13} stroke={1.7} /> {mapped ? 'Re-map from onboarding' : 'Map to racket & draft plan'}
              </button>
              {mapped && <div style={{ marginTop: 8, fontSize: 11, color: T.text2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: belt.colour, border: '1px solid rgba(0,0,0,.25)', display: 'inline-block' }} />
                Placed at <strong style={{ color: T.text }}>{belt.name} — {belt.theme}</strong> · {standard.stage}. Plan drafted below.
              </div>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Type"><select style={input} value={type} onChange={e => setType(e.target.value as SessType)}><option>Private</option><option>Group</option><option>Cardio</option><option>Match play</option><option>Mini / red ball</option></select></Field>
            <Field label="Court"><input style={input} value={court} onChange={e => setCourt(e.target.value)} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Start time"><input style={input} value={time} onChange={e => setTime(e.target.value)} placeholder="14:00" /></Field>
            <Field label="Duration (mins)"><input style={input} inputMode="numeric" value={mins} onChange={e => setMins(e.target.value.replace(/\D/g, ''))} /></Field>
          </div>

          {/* Belt ⇄ standard — linked */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Racket">
              <select style={input} value={beltId} onChange={e => pickBelt(e.target.value)}>
                {BELTS.map(b => <option key={b.id} value={b.id}>{b.name} — {b.theme}</option>)}
              </select>
            </Field>
            <Field label="Standard">
              <select style={input} value={beltId} onChange={e => pickBelt(e.target.value)}>
                {STANDARDS.map(s => <option key={s.id} value={s.belt}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Session focus *">
            <select style={input} value={focus} onChange={e => setFocus(e.target.value)}>
              {FOCUS_CATALOGUE.map(g => (
                <optgroup key={g.category} label={g.category}>
                  {g.options.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
            <div style={{ marginTop: 5, fontSize: 10.5, color: focusMatches ? accent.hex : T.text3 }}>
              {focusMatches
                ? `✓ Matches ${belt.name} racket · ${standard.stage}`
                : `Note: this focus aligns to the ${cap(focusBelt ?? belt.id)} racket — fine to mix, or pick one from ${belt.name}.`}
            </div>
          </Field>

          {/* AI assist */}
          <div style={{ background: `linear-gradient(120deg, ${accent.dim}, transparent)`, border: `1px solid ${accent.border}`, borderRadius: 11, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Icon name="sparkles" size={14} stroke={1.6} style={{ color: accent.hex }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>AI assist</span>
              <span style={{ fontSize: 10.5, color: T.text3 }}>draft the focus points &amp; drills</span>
            </div>
            <textarea style={{ ...input, resize: 'none', lineHeight: 1.5 }} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note — what do you want from this session?" />
            <button onClick={runDraft} disabled={!focus.trim()} style={{ marginTop: 8, appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: focus.trim() ? accent.hex : T.hover, color: focus.trim() ? T.btnText : T.text3, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: focus.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="sparkles" size={13} stroke={1.7} /> {drafted ? 'Re-draft' : 'Draft with AI'}
            </button>
            {drafted && <span style={{ fontSize: 10.5, color: accent.hex, marginLeft: 10 }}>✓ drafted below — edit anything</span>}
          </div>

          <Field label="Focus points (one per line)"><textarea style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} rows={3} value={focusPoints} onChange={e => setFocusPoints(e.target.value)} /></Field>
          <Field label="Drills (one per line)"><textarea style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} rows={3} value={drills} onChange={e => setDrills(e.target.value)} /></Field>

          <div style={{ fontSize: 10.5, color: T.text3, marginBottom: 12 }}>A timed run-sheet and the kit list are generated automatically for the session type.{source === 'new' && ' This player is added to your roster at the mapped racket.'}</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={!canSave} style={{ flex: 1, appearance: 'none', border: 0, padding: '11px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="check" size={14} stroke={2} /> Add session
            </button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '11px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
