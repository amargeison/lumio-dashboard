'use client'

// The bookshelf — real published books, with a line on who each is for and the
// coach's reason for handing it over.
//
// Deliberately not a resource list. A book is not a PDF you open in the browser;
// it is something you tell a player to go and read, so the only action here is
// "recommend to player" — which puts it on that player's own page rather than
// broadcasting it to everyone on a colour. Lumio's own written material lives
// under Guides, where it belongs.

import { useEffect, useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbRemove, sb, currentIdentity } from '../_lib/coach-db'
import { BOOKS, BOOK_TOPICS, type Book } from '@/lib/coach/books'
import { useAskBeforeClose } from '../_lib/ask-before-close'

type Player = { id: string; name: string; age?: number | null; parent_name?: string | null; staff_id?: string | null }
export type Rec = { id: string; player_id: string; ref_id: string; kind: string; note?: string | null }
// What is being put in a player's hands: a book off the shelf, or one of the
// academy's own resources. Same table (coach_player_resources), same dialog.
export type RecItem = { kind: 'book' | 'resource'; refId: string; title: string; author?: string | null; why: string }

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

              {/* The same button adds, changes and takes back: a recommendation
                  made by mistake used to be there for good. */}
              <button onClick={() => setPicking(b)}
                style={{ marginTop: 12, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                {given.length > 0 ? 'Change who it’s recommended to' : '+ Recommend to player'}
              </button>
            </div>
          )
        })}
      </div>

      {picking && (
        <RecommendModal T={T} accent={accent} players={players}
          item={{ kind: 'book', refId: picking.id, title: picking.title, author: picking.author, why: picking.why }}
          existing={recs.rows.filter(r => r.kind === 'book' && r.ref_id === picking.id)}
          onClose={() => setPicking(null)}
          onDone={() => { setPicking(null); recs.reload() }} />
      )}
    </div>
  )
}

// Who an item is recommended to — add players, take them off, or change the
// note. Opens with the players who already have it ticked, so what is on screen
// is the current state and saving makes the database match it.
//
// `everyone` is for a resource that is ALSO on other players' pages because of
// its level ("All levels", or a racket colour). Giving it to Ben used to leave
// it on everybody's page, and taking it back did not take it off Ben's. The
// dialog now asks: `who` names the other players ("every player"), `on` is
// whether they see it today, `set` saves the answer.
export function RecommendModal({ T, accent, item, players, existing, everyone, onClose, onDone }: {
  T: ThemeTokens; accent: AccentTokens; item: RecItem; players: Player[]; existing: Rec[]
  everyone?: { who: string; on: boolean; start: boolean; set: (on: boolean) => Promise<void> }
  onClose: () => void; onDone: () => void
}) {
  const already = existing.map(r => r.player_id)
  // One note for everyone ticked. If the players who have it were each given a
  // different note, start from the item's own text rather than pick one of theirs.
  const notes = [...new Set(existing.map(r => (r.note || '').trim()))]
  const startNote = existing.length && notes.length === 1 ? notes[0] : item.why
  const [picked, setPicked] = useState<string[]>(already)
  const [note, setNote] = useState(startNote)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [alsoAll, setAlsoAll] = useState(everyone ? everyone.start : false)
  const closeOutside = useAskBeforeClose(JSON.stringify([picked, note, alsoAll]), onClose)

  // An invited coach recommends to their OWN players — the database refuses
  // anybody else's, so only theirs are offered.
  const [mine, setMine] = useState<string | null | undefined>(undefined)
  useEffect(() => { let on = true; void currentIdentity().then(me => { if (on) setMine(me && !me.isHead ? me.staffId : null) }); return () => { on = false } }, [])
  const offered = mine ? players.filter(p => p.staff_id === mine || already.includes(p.id)) : players
  // Two players can share a name; say which is which.
  const shared = new Set(offered.map(p => p.name.trim().toLowerCase()).filter((n, i, all) => all.indexOf(n) !== i))
  const label = (p: Player) => shared.has(p.name.trim().toLowerCase())
    ? `${p.name} (${p.age != null ? `age ${p.age}` : p.parent_name ? `parent: ${p.parent_name}` : 'same name'})` : p.name

  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const adding = picked.filter(id => !already.includes(id))
  const removing = existing.filter(r => !picked.includes(r.player_id))
  const keeping = existing.filter(r => picked.includes(r.player_id))
  const noteChanged = note.trim() !== startNote.trim()
  // Only the head coach can change who else sees a resource (it is the
  // academy's); an invited coach is told how it stands instead.
  const canShare = !!everyone && mine === null
  const shareChanged = canShare && alsoAll !== everyone!.on && (picked.length > 0 || existing.length > 0)
  const changed = adding.length > 0 || removing.length > 0 || (noteChanged && keeping.length > 0) || shareChanged

  const save = async () => {
    if (!changed || busy) return
    setBusy(true); setErr('')
    try {
      // One row per player. The title and author are copied in so the
      // recommendation still reads correctly if the shelf ever changes.
      for (const id of adding) {
        await dbInsert('coach_player_resources', {
          player_id: id, kind: item.kind, ref_id: item.refId,
          title: item.title, author: item.author || null, note: note.trim() || null,
        })
      }
      for (const r of removing) await dbRemove('coach_player_resources', r.id)
      if (shareChanged) await everyone!.set(alsoAll)
      // The note is rewritten for players who keep it only when the coach
      // actually edited it — opening and saving must not flatten notes that
      // were written one player at a time.
      if (noteChanged) {
        for (const r of keeping) {
          const { error } = await sb().from('coach_player_resources').update({ note: note.trim() || null }).eq('id', r.id)
          if (error) throw new Error(error.message)
        }
      }
      onDone()
    } catch {
      setErr('That was not saved. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto', fontFamily: FONT }}>
      <div style={{ width: '100%', maxWidth: 520, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{item.kind === 'book' ? 'Recommend' : 'Give'} {item.title}</div>
          <button onClick={onClose} aria-label="Close" style={{ flexShrink: 0, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 8, width: 30, height: 30, fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ fontSize: 11.5, color: T.text3, margin: '4px 0 14px' }}>
          {item.kind === 'book'
            ? 'It appears on their own page under “your coach recommends”. No email, no notification — it is there when they look.'
            : 'It goes to the top of the resources on their own page, with your note. No email, no notification — it is there when they look.'}
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Who is it for?</div>
        {offered.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text3 }}>{mine ? 'You have no players of your own yet.' : 'No players on the roster yet.'}</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {offered.map(p => {
              const on = picked.includes(p.id)
              const had = already.includes(p.id)
              return (
                <button key={p.id} onClick={() => toggle(p.id)} aria-pressed={on}
                  title={had ? (on ? 'Has it now — tap to take it back' : 'Will be taken back when you save') : undefined}
                  style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent',
                    color: on ? accent.hex : had ? T.text3 : T.text2, borderRadius: 999, padding: '6px 12px',
                    textDecoration: had && !on ? 'line-through' : 'none' }}>
                  {on ? '✓ ' : ''}{label(p)}
                </button>
              )
            })}
          </div>
        )}
        {existing.length > 0 && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 8 }}>Ticked players have it now. Untick one to take it back.</div>}
        {everyone && (canShare ? (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, fontSize: 12, color: T.text2, lineHeight: 1.5, cursor: 'pointer' }}>
            <input type="checkbox" checked={alsoAll} onChange={e => setAlsoAll(e.target.checked)} style={{ marginTop: 3 }} />
            <span>Also show it to {everyone.who}
              <span style={{ display: 'block', fontSize: 10.5, color: T.text3 }}>{alsoAll
                ? `It is on the page of ${everyone.who} as well as the players ticked above.`
                : `Only the players ticked above see it${everyone.on ? ` — it comes off the page of ${everyone.who} when you save` : ''}. Take it back from a player and it leaves their page.`}</span>
            </span>
          </label>
        ) : mine && everyone.on ? (
          <div style={{ fontSize: 10.5, color: T.text3, marginTop: 10, lineHeight: 1.5 }}>This one is already on the page of {everyone.who}. Giving it puts it first, with your note.</div>
        ) : null)}

        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 6px' }}>Why this one</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={600}
          style={{ width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, padding: '9px 11px', fontSize: 12.5, lineHeight: 1.55, resize: 'vertical', boxSizing: 'border-box', fontFamily: FONT, outline: 'none' }} />
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 4 }}>They see this in your words — edit it for the player if you like.</div>

        {!!err && <div role="alert" style={{ fontSize: 12, color: T.bad, marginTop: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 10, padding: '9px 15px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={busy || !changed}
            style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: busy || !changed ? 'not-allowed' : 'pointer', opacity: busy || !changed ? 0.5 : 1, fontFamily: FONT }}>
            {busy ? 'Saving…' : existing.length === 0 ? `${item.kind === 'book' ? 'Recommend' : 'Give'}${adding.length ? ` to ${adding.length}` : ''}` : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
