'use client'

// "About them" — the coach's private log on a client: family, work, holidays,
// what they enjoy. Only the academy's coaches see it. It is never shown to the
// client or their family and never sent to Lumio Coach. See lib/coach/player-notes.ts.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbUpdate, dbRemove } from '../_lib/coach-db'
import { NOTE_KINDS, kindLabel, sortNotes, noteProblem, type PlayerNote, type NoteKind } from '@/lib/coach/player-notes'
import { ukDate } from '@/lib/coach/uk-date'

type P = { id: string; name: string; staff_id?: string | null; consent_medical?: boolean | null }
const fmt = (d: string) => { const t = new Date(`${d}T12:00:00Z`); return isNaN(t.getTime()) ? d : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) }

export function CoachNotes({ T, accent, player }: { T: ThemeTokens; accent: AccentTokens; player: P }) {
  const notes = useCoachTable<PlayerNote>('coach_player_notes')
  const mine = sortNotes(notes.rows.filter(n => n.player_id === player.id))
  const consent = !!player.consent_medical
  const first = (player.name || '').trim().split(/\s+/)[0] || 'them'
  const [kind, setKind] = useState<NoteKind>('family')
  const [text, setText] = useState('')
  const [date, setDate] = useState(ukDate())
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<{ id: string; text: string; kind: NoteKind } | null>(null)
  const [only, setOnly] = useState<NoteKind | ''>('')

  // Filed under the player's coach, so an assistant sees what is written about their own players.
  const owner = player.staff_id ? { staff_id: player.staff_id } : {}
  const add = async () => {
    const bad = noteProblem(kind, text, consent)
    if (bad) { setErr(bad); return }
    setBusy(true); setErr('')
    try {
      await dbInsert('coach_player_notes', { player_id: player.id, kind, text: text.trim(), noted_on: date || ukDate(), ...owner })
      setText(''); setDate(ukDate())
    } catch (e) { setErr(e instanceof Error ? e.message : 'That note was not saved.') }
    setBusy(false)
  }
  const saveEdit = async () => {
    if (!editing) return
    const bad = noteProblem(editing.kind, editing.text, consent)
    if (bad) { setErr(bad); return }
    try { await dbUpdate('coach_player_notes', editing.id, { text: editing.text.trim(), kind: editing.kind }); setEditing(null); setErr('') }
    catch (e) { setErr(e instanceof Error ? e.message : 'That change was not saved.') }
  }
  const remove = async (n: PlayerNote) => {
    if (!confirm('Delete this note? It cannot be brought back.')) return
    try { await dbRemove('coach_player_notes', n.id) } catch (e) { setErr(e instanceof Error ? e.message : 'That note was not deleted.') }
  }
  const pin = async (n: PlayerNote) => { try { await dbUpdate('coach_player_notes', n.id, { pinned: !n.pinned }) } catch { /* the list stays as it was */ } }

  const input: CSSProperties = { background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12.5, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const small: CSSProperties = { appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 11.5, cursor: 'pointer', padding: '2px 4px', fontFamily: FONT }
  const shown = only ? mine.filter(n => n.kind === only) : mine
  const kindsUsed = NOTE_KINDS.filter(k => mine.some(n => n.kind === k.id))

  return (
    <div data-testid="coach-notes" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, color: T.text3, lineHeight: 1.5 }}>
        The personal side: family, work, holidays, what {first} enjoys. Private to you and your coaches. It is never shown to {first} or their family, and never sent to Lumio Coach.
      </div>

      <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {NOTE_KINDS.map(k => {
            const off = k.id === 'health' && !consent
            const on = kind === k.id
            return (
              <button key={k.id} onClick={() => { if (off) { setErr(noteProblem('health', 'x', false) || ''); return } setKind(k.id); setErr('') }} title={k.hint} aria-pressed={on}
                style={{ appearance: 'none', border: `1px solid ${on ? accent.hex : T.border}`, background: on ? accent.dim : 'transparent', color: off ? T.text3 : on ? accent.hex : T.text2, borderRadius: 999, padding: '4px 11px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', opacity: off ? 0.55 : 1, fontFamily: FONT }}>
                {k.label}{off ? ' · needs consent' : ''}
              </button>
            )
          })}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={1000} placeholder={NOTE_KINDS.find(k => k.id === kind)?.hint} aria-label="Note" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Date of the note" style={{ ...input, width: 'auto' }} />
          <button onClick={add} disabled={busy || !text.trim()} style={{ appearance: 'none', border: 0, background: text.trim() ? accent.hex : T.hover, color: text.trim() ? T.btnText : T.text3, borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', fontFamily: FONT }}>{busy ? 'Saving…' : 'Add note'}</button>
        </div>
        {err && <div role="alert" style={{ fontSize: 12, color: T.bad, lineHeight: 1.45 }}>{err}</div>}
      </div>

      {kindsUsed.length > 1 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[{ id: '' as const, label: 'All' }, ...kindsUsed].map(k => (
            <button key={k.id || 'all'} onClick={() => setOnly(k.id)} style={{ appearance: 'none', border: `1px solid ${only === k.id ? accent.hex : T.border}`, background: only === k.id ? accent.dim : 'transparent', color: only === k.id ? accent.hex : T.text3, borderRadius: 999, padding: '2px 9px', fontSize: 11, cursor: 'pointer', fontFamily: FONT }}>{k.label}</button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.text3 }}>{mine.length ? 'No notes of that kind.' : `Nothing noted about ${first} yet.`}</div>
      ) : shown.map(n => (
        <div key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderTop: `1px solid ${T.border}` }}>
          <div style={{ width: 82, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: n.kind === 'health' ? T.warn : accent.hex }}>{kindLabel(n.kind)}</div>
            <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2 }}>{fmt(n.noted_on)}</div>
          </div>
          {editing?.id === n.id ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea value={editing.text} onChange={e => setEditing({ ...editing, text: e.target.value })} rows={2} maxLength={1000} style={{ ...input, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={saveEdit} style={{ ...small, color: accent.hex, fontWeight: 700 }}>Save</button>
                <button onClick={() => setEditing(null)} style={small}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{n.pinned ? <span title="Pinned" style={{ color: accent.hex }}>📌 </span> : null}{n.text}</div>
          )}
          {editing?.id !== n.id && (
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <button onClick={() => pin(n)} style={small}>{n.pinned ? 'Unpin' : 'Pin'}</button>
              <button onClick={() => setEditing({ id: n.id, text: n.text, kind: n.kind })} style={small}>Edit</button>
              <button onClick={() => remove(n)} style={{ ...small, color: T.bad }}>Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
