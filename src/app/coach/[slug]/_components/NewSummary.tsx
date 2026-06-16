'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { BELTS, type Player, type Lesson } from '../_lib/coach-data'
import { addLesson } from '../_lib/lessons-store'

const todayStr = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// AI-style draft: turn the coach's quick note + focus into structured sections.
function draftSections(focus: string, note: string) {
  const fl = (focus.trim() || 'the focus').toLowerCase()
  const lines = note.split(/[\n.;]+/).map(s => s.trim()).filter(Boolean)
  const covered = (lines.length ? lines.slice(0, 3) : [`Technical work on ${fl}`, 'Controlled feeds, then progressing to live']).concat([`Live points starting from ${fl}`]).slice(0, 4)
  const takeaways = [
    `Clear progress on ${fl} — more consistent and confident`,
    lines.length > 1 ? `Watch: ${lines[lines.length - 1].toLowerCase()}` : 'Reverts to the old habit when rushed',
  ]
  const drills = [`${cap(fl)} ladder — 10 in a row`, 'Target cones with a success rate before progressing', `Pressure points from ${fl}`]
  return { covered, takeaways, drills, homework: `10 minutes a day on ${fl}; film one set to review.`, nextFocus: `Take ${fl} into match-play patterns and live points.` }
}

export function NewSummaryModal({ T, accent, players, onClose, onCreated }: { T: ThemeTokens; accent: AccentTokens; density: Density; players: Player[]; onClose: () => void; onCreated: (id: string) => void }) {
  const [playerId, setPlayerId] = useState(players[0]?.id ?? '')
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState('12:00')
  const [type, setType] = useState<'Private' | 'Group' | 'Cardio' | 'Match play'>('Private')
  const [court, setCourt] = useState('Court 1')
  const [duration, setDuration] = useState('60')
  const [focus, setFocus] = useState('')
  const [note, setNote] = useState('')
  const [covered, setCovered] = useState('')
  const [takeaways, setTakeaways] = useState('')
  const [drills, setDrills] = useState('')
  const [skills, setSkills] = useState<Set<string>>(new Set())
  const [homework, setHomework] = useState('')
  const [nextFocus, setNextFocus] = useState('')
  const [coachNote, setCoachNote] = useState('')
  const [rating, setRating] = useState(4)
  const [drafted, setDrafted] = useState(false)

  const player = players.find(p => p.id === playerId)
  const beltSkills = player ? BELTS[player.beltIndex].skills : []

  const input: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }
  const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
    <div style={{ marginBottom: 12 }}><label style={labelStyle}>{label}</label>{children}{hint && <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>{hint}</div>}</div>
  )

  const runDraft = () => {
    const d = draftSections(focus, note)
    setCovered(d.covered.join('\n')); setTakeaways(d.takeaways.join('\n')); setDrills(d.drills.join('\n'))
    setHomework(d.homework); setNextFocus(d.nextFocus); setDrafted(true)
  }

  const canSave = !!player && focus.trim().length > 0
  const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
  const save = () => {
    if (!canSave || !player) return
    const lesson: Lesson = {
      id: `new-lesson-${Date.now()}`,
      playerId: player.id, player: player.name,
      date, time, duration: Number(duration) || 60, type, court,
      focus: focus.trim(),
      covered: lines(covered), takeaways: lines(takeaways), drills: lines(drills),
      skillsWorked: [...skills],
      homework: homework.trim() || '—', nextFocus: nextFocus.trim() || '—',
      coachNote: coachNote.trim() || '—', rating,
    }
    addLesson(lesson); onCreated(lesson.id); onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 620, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.panel, borderRadius: '16px 16px 0 0', zIndex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="note" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>New lesson summary</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* who & when */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Player"><select style={input} value={playerId} onChange={e => setPlayerId(e.target.value)}>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Type"><select style={input} value={type} onChange={e => setType(e.target.value as typeof type)}><option>Private</option><option>Group</option><option>Cardio</option><option>Match play</option></select></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', gap: 12 }}>
            <Field label="Date"><input style={input} value={date} onChange={e => setDate(e.target.value)} /></Field>
            <Field label="Time"><input style={input} value={time} onChange={e => setTime(e.target.value)} /></Field>
            <Field label="Court"><input style={input} value={court} onChange={e => setCourt(e.target.value)} /></Field>
            <Field label="Mins"><input style={input} inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value.replace(/\D/g, ''))} /></Field>
          </div>

          <Field label="Session focus *"><input style={input} value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Second serve — kick & reliability" /></Field>

          {/* AI assist */}
          <div style={{ background: `linear-gradient(120deg, ${accent.dim}, transparent)`, border: `1px solid ${accent.border}`, borderRadius: 11, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Icon name="sparkles" size={14} stroke={1.6} style={{ color: accent.hex }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>AI assist</span>
              <span style={{ fontSize: 10.5, color: T.text3 }}>jot a quick note, draft the sections</span>
            </div>
            <textarea style={{ ...input, resize: 'none', lineHeight: 1.5 }} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Worked Tom's kick serve, better net margin, toss drifts forward when rushed" />
            <button onClick={runDraft} disabled={!focus.trim()} style={{ marginTop: 8, appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: focus.trim() ? accent.hex : T.hover, color: focus.trim() ? T.btnText : T.text3, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: focus.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="sparkles" size={13} stroke={1.7} /> {drafted ? 'Re-draft sections' : 'Draft sections with AI'}
            </button>
            {drafted && <span style={{ fontSize: 10.5, color: accent.hex, marginLeft: 10 }}>✓ drafted below — edit anything</span>}
          </div>

          <Field label="What we covered" hint="One point per line"><textarea style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} rows={4} value={covered} onChange={e => setCovered(e.target.value)} /></Field>
          <Field label="Key takeaways" hint="One per line"><textarea style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} rows={3} value={takeaways} onChange={e => setTakeaways(e.target.value)} /></Field>
          <Field label="Drills used" hint="One per line"><textarea style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} rows={3} value={drills} onChange={e => setDrills(e.target.value)} /></Field>

          {beltSkills.length > 0 && (
            <Field label="Skills worked (racket system)" hint="Tap to tag">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {beltSkills.map(s => {
                  const on = skills.has(s.id)
                  return <button key={s.id} onClick={() => setSkills(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n })}
                    style={{ appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{s.name}</button>
                })}
              </div>
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Homework"><input style={input} value={homework} onChange={e => setHomework(e.target.value)} /></Field>
            <Field label="Next session focus"><input style={input} value={nextFocus} onChange={e => setNextFocus(e.target.value)} /></Field>
          </div>
          <Field label="Coach note (private)"><textarea style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} rows={2} value={coachNote} onChange={e => setCoachNote(e.target.value)} placeholder="For your eyes only — not shared" /></Field>

          <Field label="Session rating">
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setRating(n)} style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: n <= rating ? accent.hex : T.text4, padding: 0 }}>★</button>)}
            </div>
          </Field>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button onClick={save} disabled={!canSave} style={{ flex: 1, appearance: 'none', border: 0, padding: '11px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="check" size={14} stroke={2} /> Save summary
            </button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '11px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
