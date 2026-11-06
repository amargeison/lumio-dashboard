'use client'

// The parent app's Booklet tab: the whole booklet, the family's notes and the Festival
// scorecard. Notes and the scorecard save for a signed-in family and stay on the page in
// the demo. HQ's preview of a family shows the booklet without them.

import React, { useState } from 'react'
import { ExternalLink, PlayCircle } from 'lucide-react'
import { TP_RED, TP_DARK, TP_PAPER } from '@/data/tenproject/demo-data'
import type { ParentContext } from './ImpactDataContext'
import { openBookletPdf } from './BookletPdfCard'
import { scorecardOn, scorecardTotal, videoLink, type ScorecardGame } from '@/lib/impact/parent-view'
import type { Booklet, BookletWeek } from '@/lib/impact/packs'

interface Child { id?: string; name: string; stickers: number }
interface Sticker { id: string; label: string; desc: string }

const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 14 }
const heading: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, color: TP_RED, letterSpacing: 0.6 }
const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #E7E2DC', borderRadius: 8, padding: '8px 10px', fontSize: 16, fontFamily: 'inherit', color: TP_DARK, background: '#fff' }
const smallButton: React.CSSProperties = { background: TP_DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }

export function WeekFacts({ week, booklet }: { week: BookletWeek; booklet: Booklet }) {
  const video = videoLink(booklet, week.video)
  return (<>
    {week.top_tip && <div style={{ marginTop: 8 }}><div style={heading}>TOP TIP</div><div style={{ fontSize: 12.5, color: TP_DARK, marginTop: 2 }}>{week.top_tip}</div></div>}
    {week.did_you_know && <div style={{ marginTop: 8 }}><div style={heading}>DID YOU KNOW?</div><div style={{ fontSize: 12.5, color: TP_DARK, marginTop: 2 }}>{week.did_you_know}</div></div>}
    {week.home_task && <div style={{ marginTop: 8 }}><div style={heading}>TRY AT HOME</div><div style={{ fontSize: 12.5, color: TP_DARK, marginTop: 2 }}>{week.home_task}</div></div>}
    {video && <a href={video} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12.5, fontWeight: 800, color: TP_RED }}><PlayCircle size={15} /> Watch the {week.video} video</a>}
  </>)
}

function NoteBox({ label, value, placeholder, onSave }: { label: string | null; value: string; placeholder: string; onSave: (text: string) => Promise<void> }) {
  const [text, setText] = useState(value)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  async function save() {
    setBusy(true); setNote('')
    try { await onSave(text); setNote('Saved.') }
    catch (e) { setNote(e instanceof Error ? e.message : 'Your note could not be saved.') }
    setBusy(false)
  }
  return (
    <label style={{ display: 'grid', gap: 5, marginTop: 8 }}>
      {label && <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6560' }}>{label}</span>}
      <textarea value={text} onChange={e => { setText(e.target.value); setNote('') }} rows={2} maxLength={2000} placeholder={placeholder} style={field} />
      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={save} disabled={busy} style={smallButton}>{busy ? 'Saving…' : 'Save note'}</button>
        {note && <span role="status" style={{ fontSize: 11.5, color: note === 'Saved.' ? '#187A3C' : TP_RED }}>{note}</span>}
      </span>
    </label>
  )
}

function WeekNotes({ week, kids, parent, prompt }: { week: number; kids: Child[]; parent?: ParentContext; prompt: string }) {
  return (
    <div style={{ borderTop: '1px solid #F0EBE5', marginTop: 10, paddingTop: 8 }}>
      <div style={heading}>YOUR NOTES</div>
      {kids.map(c => (
        <NoteBox key={c.id ?? c.name} label={kids.length > 1 ? c.name : null} placeholder={prompt}
          value={parent?.notes.find(n => n.child_id === c.id && n.week === week)?.text ?? ''}
          onSave={async text => { if (parent && c.id) await parent.saveNote(c.id, week, text) }} />
      ))}
      <div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 6 }}>Your coach can see that you&apos;ve practised; your organisation can read your notes.</div>
    </div>
  )
}

function FestivalScorecard({ parent }: { parent?: ParentContext }) {
  const saved = parent?.scorecard
  const [a, setA] = useState(saved?.player_a ?? '')
  const [b, setB] = useState(saved?.player_b ?? '')
  const [games, setGames] = useState<ScorecardGame[]>(saved?.games.length ? saved.games : [{ a: null, b: null }])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const points = (v: string) => { const n = Number(v); return v === '' || !Number.isFinite(n) ? null : Math.max(0, Math.min(999, Math.round(n))) }
  const setGame = (i: number, side: 'a' | 'b', v: string) => { setGames(g => g.map((x, n) => n === i ? { ...x, [side]: points(v) } : x)); setNote('') }
  async function save() {
    setBusy(true); setNote('')
    try { await parent?.saveScorecard({ player_a: a, player_b: b, games }); setNote('Saved.') }
    catch (e) { setNote(e instanceof Error ? e.message : 'Your scorecard could not be saved.') }
    setBusy(false)
  }
  const box: React.CSSProperties = { ...field, textAlign: 'center', padding: '6px 4px' }
  return (
    <div style={{ borderTop: '1px solid #F0EBE5', marginTop: 10, paddingTop: 8 }}>
      <div style={heading}>FESTIVAL SCORECARD</div>
      <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr 1fr', gap: 6, alignItems: 'center', marginTop: 6 }}>
        <span />
        <input aria-label="First player" value={a} maxLength={80} onChange={e => { setA(e.target.value); setNote('') }} placeholder="Name" style={field} />
        <input aria-label="Second player" value={b} maxLength={80} onChange={e => { setB(e.target.value); setNote('') }} placeholder="Name" style={field} />
        {games.map((g, i) => (
          <React.Fragment key={i}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6B6560' }}>Game {i + 1}</span>
            <input aria-label={`Game ${i + 1} points, first player`} inputMode="numeric" value={g.a ?? ''} onChange={e => setGame(i, 'a', e.target.value)} style={box} />
            <input aria-label={`Game ${i + 1} points, second player`} inputMode="numeric" value={g.b ?? ''} onChange={e => setGame(i, 'b', e.target.value)} style={box} />
          </React.Fragment>
        ))}
        <span style={{ fontSize: 11.5, fontWeight: 900, color: TP_DARK }}>Total</span>
        <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 900, color: TP_DARK }}>{scorecardTotal(games, 'a')}</span>
        <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 900, color: TP_DARK }}>{scorecardTotal(games, 'b')}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        {games.length < 20 && <button type="button" onClick={() => setGames(g => [...g, { a: null, b: null }])} style={{ ...smallButton, background: TP_PAPER, color: TP_DARK }}>Add a game</button>}
        <button type="button" onClick={save} disabled={busy} style={smallButton}>{busy ? 'Saving…' : 'Save scorecard'}</button>
        {note && <span role="status" style={{ fontSize: 11.5, color: note === 'Saved.' ? '#187A3C' : TP_RED }}>{note}</span>}
      </div>
    </div>
  )
}

export default function ParentBooklet({ booklet, stickers, kids, parent, canWrite }: { booklet: Booklet; stickers: readonly Sticker[]; kids: Child[]; parent?: ParentContext; canWrite: boolean }) {
  const [pdfError, setPdfError] = useState('')
  const warm = booklet.warm_up
  const weeks = booklet.weeks.filter(w => w.title || w.focus || w.home_task || w.top_tip)
  const prompt = booklet.notes_prompt || 'What did you practise this week?'
  const hq = parent?.home.hq_id
  async function openPdf() {
    setPdfError('')
    try { if (hq) await openBookletPdf(hq) }
    catch (e) { setPdfError(e instanceof Error ? e.message : 'The booklet couldn’t be opened.') }
  }
  return (<>
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 900, color: TP_DARK }}>{booklet.title || 'Activity Booklet'}</div>
      {booklet.motto && <div style={{ fontSize: 12.5, fontWeight: 800, color: TP_RED, marginTop: 2 }}>{booklet.motto}</div>}
      {booklet.values && <div style={{ fontSize: 12, color: '#6B6560', marginTop: 2 }}>{booklet.values}</div>}
      {booklet.intro && <div style={{ fontSize: 12.5, color: '#5B554F', marginTop: 6, lineHeight: 1.5 }}>{booklet.intro}</div>}
      {booklet.pdf_path && hq && <button onClick={openPdf} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: TP_RED, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><ExternalLink size={13} /> Open the printed booklet (PDF)</button>}
      {pdfError && <div role="alert" style={{ fontSize: 11.5, color: TP_RED, marginTop: 6 }}>{pdfError}</div>}
    </div>
    {warm && (warm.title || warm.text) && (
      <div style={card}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK }}>{warm.title || 'Warm up'}</div>
        {warm.text && <div style={{ fontSize: 12.5, color: '#5B554F', marginTop: 4, lineHeight: 1.5 }}>{warm.text}</div>}
        {!!warm.did_you_know?.length && <div style={{ marginTop: 8 }}><div style={heading}>DID YOU KNOW?</div>{warm.did_you_know.map(f => <div key={f} style={{ fontSize: 12.5, color: TP_DARK, marginTop: 3 }}>{f}</div>)}</div>}
      </div>
    )}
    {weeks.map(w => (
      <div key={w.week} style={card}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK }}>Week {w.week}{w.title ? ` · ${w.title}` : ''}</div>
        {w.focus && <div style={{ fontSize: 12.5, color: '#5B554F', marginTop: 4, lineHeight: 1.5 }}>{w.focus}</div>}
        <WeekFacts week={w} booklet={booklet} />
        {w.week === 10 && scorecardOn(booklet) && canWrite && <FestivalScorecard parent={parent} />}
        {canWrite && <WeekNotes week={w.week} kids={kids} parent={parent} prompt={prompt} />}
      </div>
    ))}
    {stickers.length > 0 && kids.map(c => (
      <div key={c.id ?? c.name} style={card}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK, marginBottom: 8 }}>{kids.length > 1 ? `${c.name}’s stickers` : 'Your stickers'}</div>
        <div style={{ display: 'grid', gap: 5 }}>
          {stickers.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
              <span style={{ fontWeight: 800, color: i < c.stickers ? TP_RED : '#8A847E' }}>{i < c.stickers ? '★ ' : ''}{s.label}</span>
              <span style={{ color: '#6B6560' }}>{i < c.stickers ? 'Earned' : 'Not yet'}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
    {booklet.completion && <div style={card}><div style={heading}>WHEN YOU FINISH</div><div style={{ fontSize: 12.5, color: TP_DARK, marginTop: 4, lineHeight: 1.5 }}>{booklet.completion}</div></div>}
    {booklet.tenors && <div style={{ ...card, background: TP_DARK, color: '#fff' }}><div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{booklet.tenors}</div></div>}
    {(booklet.website || booklet.hashtag) && <div style={{ fontSize: 11, color: '#8A847E', textAlign: 'center' }}>{[booklet.website, booklet.hashtag].filter(Boolean).join(' · ')}</div>}
  </>)
}
