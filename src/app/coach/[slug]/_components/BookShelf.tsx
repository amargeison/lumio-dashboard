'use client'

// The bookshelf — real published books, with a line on who each is for and the
// coach's reason for handing it over.
//
// Deliberately not a resource list. A book is not a PDF you open in the browser;
// it is something you tell a player to go and read, so the only action here is
// "recommend to player" — which puts it on that player's own page rather than
// broadcasting it to everyone on a colour. Lumio's own written material lives
// under Guides, where it belongs.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert } from '../_lib/coach-db'
import { BOOKS, BOOK_TOPICS, type Book } from '@/lib/coach/books'

type Player = { id: string; name: string }
type Rec = { id: string; player_id: string; ref_id: string; kind: string }

export function BookShelf({ T, accent, density }: { T: ThemeTokens; accent: AccentTokens; density: Density }) {
  const { rows: players } = useCoachTable<Player>('coach_players')
  const recs = useCoachTable<Rec>('coach_player_resources')
  const [topic, setTopic] = useState('all')
  const [picking, setPicking] = useState<Book | null>(null)

  const shown = topic === 'all' ? BOOKS : BOOKS.filter(b => b.topic === topic)
  const recipients = (book: Book) =>
    recs.rows.filter(r => r.kind === 'book' && r.ref_id === book.id)
      .map(r => players.find(p => p.id === r.player_id)?.name)
      .filter(Boolean) as string[]

  const chip = (on: boolean): CSSProperties => ({
    appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`,
    background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2,
    borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: on ? 600 : 400,
    cursor: 'pointer', fontFamily: FONT,
  })

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: T.text2 }}>Recommended reading for players &amp; parents</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setTopic('all')} style={chip(topic === 'all')}>All</button>
          {BOOK_TOPICS.map(t => <button key={t} onClick={() => setTopic(t)} style={chip(topic === t)}>{t}</button>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: density.gap }}>
        {shown.map(b => {
          const given = recipients(b)
          return (
            <div key={b.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 14 }}>
                {/* A cover, drawn rather than fetched — no third-party images, no
                    broken jacket art when a URL rots. */}
                <div style={{ width: 64, height: 92, borderRadius: 3, flexShrink: 0, background: b.spine, boxShadow: 'inset -8px 0 14px -10px rgba(0,0,0,0.85)', padding: '8px 7px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.2 }}>{b.title}</span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.75)' }}>{b.author.split(/\s+/).slice(-1)[0]}</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text, lineHeight: 1.25 }}>{b.title}</div>
                  <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>{b.author} · {b.year}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 4, padding: '2px 6px' }}>{b.topic}</span>
                    <span style={{ fontSize: 11, color: T.text3 }}>{b.audience}</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6, margin: '12px 0 0', fontStyle: 'italic' }}>“{b.why}”</p>

              {given.length > 0 && (
                <div style={{ fontSize: 11, color: T.good, marginTop: 10 }}>
                  ✓ Recommended to {given.slice(0, 3).join(', ')}{given.length > 3 ? ` +${given.length - 3}` : ''}
                </div>
              )}

              <button onClick={() => setPicking(b)}
                style={{ marginTop: 12, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                + Recommend to player
              </button>
            </div>
          )
        })}
      </div>

      {picking && (
        <RecommendModal T={T} accent={accent} book={picking} players={players}
          already={recs.rows.filter(r => r.kind === 'book' && r.ref_id === picking.id).map(r => r.player_id)}
          onClose={() => setPicking(null)}
          onDone={() => { setPicking(null); recs.reload() }} />
      )}
    </div>
  )
}

function RecommendModal({ T, accent, book, players, already, onClose, onDone }: {
  T: ThemeTokens; accent: AccentTokens; book: Book; players: Player[]; already: string[]
  onClose: () => void; onDone: () => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const [note, setNote] = useState(book.why)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const save = async () => {
    if (!picked.length) return
    setBusy(true); setErr('')
    try {
      // One row per player. The title and author are copied in so the
      // recommendation still reads correctly if the shelf ever changes.
      for (const id of picked) {
        await dbInsert('coach_player_resources', {
          player_id: id, kind: 'book', ref_id: book.id,
          title: book.title, author: book.author, note: note.trim() || null,
        })
      }
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save that')
      setBusy(false)
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div style={{ width: '100%', maxWidth: 520, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1 }}>Recommend {book.title}</div>
          <button onClick={onClose} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 8, width: 30, height: 30, fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ fontSize: 11.5, color: T.text3, margin: '4px 0 14px' }}>
          It appears on their own page under “your coach recommends”. No email, no notification — it is there when they look.
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Who is it for?</div>
        {players.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text3 }}>No players on the roster yet.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {players.map(p => {
              const has = already.includes(p.id)
              const on = picked.includes(p.id)
              return (
                <button key={p.id} onClick={() => !has && toggle(p.id)} disabled={has}
                  title={has ? 'Already recommended' : undefined}
                  style={{ appearance: 'none', cursor: has ? 'default' : 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent',
                    color: has ? T.text3 : on ? accent.hex : T.text2, borderRadius: 999, padding: '6px 12px', opacity: has ? 0.55 : 1 }}>
                  {has ? '✓ ' : on ? '✓ ' : ''}{p.name}
                </button>
              )
            })}
          </div>
        )}

        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 6px' }}>Why this one</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          style={{ width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, padding: '9px 11px', fontSize: 12.5, lineHeight: 1.55, resize: 'vertical', boxSizing: 'border-box', fontFamily: FONT, outline: 'none' }} />
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 4 }}>They see this in your words — edit it for the player if you like.</div>

        {!!err && <div style={{ fontSize: 12, color: T.bad, marginTop: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 10, padding: '9px 15px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={busy || !picked.length}
            style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: busy || !picked.length ? 'not-allowed' : 'pointer', opacity: busy || !picked.length ? 0.5 : 1, fontFamily: FONT }}>
            {busy ? 'Saving…' : `Recommend${picked.length ? ` to ${picked.length}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
