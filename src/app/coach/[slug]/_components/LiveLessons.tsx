'use client'

// Live (founder portal) Lesson Summaries — the rich master–detail view that
// matches the demo: a left list of summaries (with This week / Last week / This
// month / All filters) and a detailed right pane (session focus, what we covered,
// drills, skills, homework, next focus, coach note + share/export actions).
//
// Reads real coach_sessions rows. AI-built summaries (from a recording) carry the
// full structured `review_json`, so they render every block. Manually-typed
// summaries simply show the coach notes / AI review text. "Add audio/video" and
// "New summary" both create real rows; recordings are transcribed + summarised
// server-side, then we reload.

import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { MediaCaptureModal } from './MediaCaptureModal'
import { useCoachTable, dbInsert } from '../_lib/coach-db'

type Review = {
  focus?: string; covered?: string[]; takeaways?: string[]; drills?: string[]
  homework?: string; nextFocus?: string; coachNote?: string; rating?: number
}
type Session = {
  id: string; player_name: string | null; session_date: string | null
  focus: string | null; rating: number | null; summary: string | null
  ai_review: string | null; review_json: Review | null; created_at?: string
}

const DAY_MS = 86400000
const daysAgo = (d: string | null) => { const t = d ? new Date(d).getTime() : NaN; return isNaN(t) ? Infinity : (Date.now() - t) / DAY_MS }
const fmtDate = (d: string | null) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }
const initials = (name: string | null) => (name || 'Recorded session').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'R'

export function LiveLessons({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const { rows, add, edit, remove, reload } = useCoachTable<Session>('coach_sessions')
  const { rows: playerRows } = useCoachTable<{ id: string; name: string }>('coach_players')
  const players = playerRows.map(p => ({ id: p.id, name: p.name }))

  const [selId, setSelId] = useState<string | null>(null)
  const [range, setRange] = useState<'week' | 'lastweek' | 'month' | 'all'>('all')
  const [mediaKind, setMediaKind] = useState<false | 'audio' | 'video'>(false)
  const [editing, setEditing] = useState<Session | 'new' | null>(null)
  const [copied, setCopied] = useState(false)

  const inRange = (s: Session) => range === 'all' ? true
    : range === 'week' ? daysAgo(s.session_date) <= 7
    : range === 'lastweek' ? (daysAgo(s.session_date) > 7 && daysAgo(s.session_date) <= 14)
    : daysAgo(s.session_date) <= 31
  const list = [...rows].filter(inRange).sort((a, b) => daysAgo(a.session_date) - daysAgo(b.session_date))
  const sel = rows.find(s => s.id === selId) ?? list[0] ?? rows[0]

  // Keep a valid selection as rows load / filters change.
  useEffect(() => { if (rows.length && !rows.some(s => s.id === selId)) setSelId(rows[0].id) }, [rows, selId])

  const RANGE_TABS: { id: typeof range; label: string }[] = [
    { id: 'week', label: 'This week' }, { id: 'lastweek', label: 'Last week' },
    { id: 'month', label: 'This month' }, { id: 'all', label: 'All' },
  ]

  const onShare = (s: Session) => {
    const txt = shareText(s)
    navigator.clipboard?.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }).catch(() => {})
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text, fontFamily: FONT }}>Lesson Summaries</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3, fontFamily: FONT }}>What you covered, the key takeaways and the homework — ready to share with players and parents.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setMediaKind('audio')} title="Record or upload a session — the AI writes the summary"
          style={{ appearance: 'none', border: `1px solid ${accent.border}`, padding: '9px 15px', borderRadius: 10, background: accent.dim, color: accent.hex, fontSize: 13, fontWeight: 700, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>🎙️ Add audio/video → AI summary</button>
        <button onClick={() => setEditing('new')}
          style={{ appearance: 'none', border: 0, padding: '9px 15px', borderRadius: 10, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>＋ New summary</button>
      </div>
    </div>
  )

  const tabs = (
    <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8, marginBottom: 8, width: 'fit-content' }}>
      {RANGE_TABS.map(rt => (
        <button key={rt.id} onClick={() => setRange(rt.id)}
          style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT, background: range === rt.id ? T.panel : 'transparent', color: range === rt.id ? T.text : T.text2, fontWeight: range === rt.id ? 600 : 400, boxShadow: range === rt.id ? `0 0 0 1px ${T.border}` : 'none' }}>{rt.label}</button>
      ))}
    </div>
  )

  const modals = (
    <>
      {mediaKind && (
        <MediaCaptureModal T={T} accent={accent} defaultKind={mediaKind} players={players}
          onClose={() => setMediaKind(false)}
          onSummary={() => { setMediaKind(false); setSelId(null); reload() }} />
      )}
      {editing && (
        <SummaryFormModal T={T} accent={accent} players={players}
          session={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (vals, newPlayer) => {
            if (newPlayer) await dbInsert('coach_players', { name: newPlayer }).catch(() => {})
            if (editing === 'new') { await add(vals); setSelId(null) }  // null → effect selects the newest
            else await edit(editing.id, vals)
            setEditing(null)
          }} />
      )}
    </>
  )

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!rows.length) {
    return (
      <div style={{ fontFamily: FONT }}>
        {header}{tabs}
        <div style={{ textAlign: 'center', padding: '48px 20px', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 26 }}>📝</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10 }}>No lesson summaries yet</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>Record or upload a lesson for an instant AI summary, or add one with “New summary”.</div>
        </div>
        {modals}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {header}{tabs}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, alignItems: 'start' }}>
        {/* List */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, alignSelf: 'start' }}>
          {list.length === 0 ? (
            <div style={{ fontSize: 11.5, color: T.text3, padding: '14px 8px', textAlign: 'center' }}>No summaries in this period.</div>
          ) : list.map(s => {
            const active = s.id === sel?.id
            return (
              <div key={s.id} onClick={() => setSelId(s.id)} style={{ padding: '10px', borderRadius: 8, cursor: 'pointer', background: active ? accent.dim : 'transparent', border: `1px solid ${active ? accent.border : 'transparent'}`, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar T={T} accent={accent} text={initials(s.player_name)} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.player_name || 'Recorded session'}</div>
                    <div style={{ fontSize: 10.5, color: T.text3 }}>{fmtDate(s.session_date)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: active ? T.text : T.text2, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.focus || '—'}</div>
              </div>
            )
          })}
        </div>

        {/* Detail */}
        {sel && <DetailPane T={T} accent={accent} s={sel}
          onShare={() => onShare(sel)} copied={copied}
          onExport={() => printSession(sel)}
          onEdit={() => setEditing(sel)}
          onDelete={async () => { if (confirm('Delete this lesson summary?')) { await remove(sel.id); setSelId(null) } }} />}
      </div>
      {modals}
    </div>
  )
}

// ── Detail pane ───────────────────────────────────────────────────────────────
function DetailPane({ T, accent, s, onShare, copied, onExport, onEdit, onDelete }: {
  T: ThemeTokens; accent: AccentTokens; s: Session
  onShare: () => void; copied: boolean; onExport: () => void; onEdit: () => void; onDelete: () => void
}) {
  const r = s.review_json || {}
  const rating = s.rating ?? r.rating ?? 0
  const hasStructured = !!(r.covered?.length || r.takeaways?.length || r.drills?.length || r.homework || r.nextFocus)
  const card: CSSProperties = { background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar T={T} accent={accent} text={initials(s.player_name)} size={36} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{s.player_name || 'Recorded session'}</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{fmtDate(s.session_date)}</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {rating > 0 && <span style={{ display: 'flex', gap: 1 }}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: i < rating ? accent.hex : T.text4, fontSize: 14 }}>★</span>)}</span>}
        </div>
      </div>

      <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Session focus</div>
        <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginTop: 2 }}>{s.focus || r.focus || 'Lesson summary'}</div>
      </div>

      {hasStructured ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              {!!r.covered?.length && <>
                <SubHead T={T} accent={accent}>✓ What we covered</SubHead>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{r.covered.map((c, i) => <li key={i} style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>{c}</li>)}</ul>
              </>}
              {!!r.takeaways?.length && <>
                <SubHead T={T} accent={accent} mt>✦ Key takeaways</SubHead>
                {r.takeaways.map((t, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: T.text, padding: '4px 0' }}><span style={{ color: accent.hex }}>›</span>{t}</div>)}
              </>}
            </div>
            <div>
              {!!r.drills?.length && <>
                <SubHead T={T} accent={accent}>⚑ Drills used</SubHead>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{r.drills.map((d, i) => <span key={i} style={{ fontSize: 11.5, color: T.text2, padding: '4px 8px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}` }}>{d}</span>)}</div>
              </>}
              {!!r.homework && <>
                <SubHead T={T} accent={accent} mt>⌂ Homework</SubHead>
                <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>{r.homework}</div>
              </>}
            </div>
          </div>

          {(r.nextFocus || r.coachNote) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              {r.nextFocus && <div style={card}>
                <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next session focus</div>
                <div style={{ fontSize: 12.5, color: T.text, marginTop: 3 }}>{r.nextFocus}</div>
              </div>}
              {r.coachNote && <div style={card}>
                <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coach note (private)</div>
                <div style={{ fontSize: 12.5, color: T.text2, marginTop: 3, fontStyle: 'italic' }}>{r.coachNote}</div>
              </div>}
            </div>
          )}
        </>
      ) : (
        // Manually-typed summary — no structured blocks; show the notes / AI review.
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {s.summary && <div style={card}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coach notes</div>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.summary}</div>
          </div>}
          {s.ai_review && <div style={{ ...card, background: accent.dim, borderColor: accent.border }}>
            <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>✦ AI review</div>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.ai_review}</div>
          </div>}
          {!s.summary && !s.ai_review && <div style={{ fontSize: 12.5, color: T.text3 }}>No detail recorded for this summary yet — use Edit to add notes.</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={onShare} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>📣 {copied ? 'Copied to clipboard' : 'Share with parent'}</button>
        <button onClick={onExport} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Export PDF</button>
        <button onClick={onEdit} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Edit</button>
        <button onClick={onDelete} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Delete</button>
      </div>
    </div>
  )
}

function SubHead({ T, accent, children, mt }: { T: ThemeTokens; accent: AccentTokens; children: ReactNode; mt?: boolean }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: mt ? '16px 0 8px' : '0 0 8px' }}>{children}</div>
}

function Avatar({ T, accent, text, size }: { T: ThemeTokens; accent: AccentTokens; text: string; size: number }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, border: `1px solid ${accent.border}`, flexShrink: 0 }}>{text}</div>
}

// ── New / Edit summary modal ──────────────────────────────────────────────────
function SummaryFormModal({ T, accent, players, session, onClose, onSave }: {
  T: ThemeTokens; accent: AccentTokens; players: { id: string; name: string }[]
  session: Session | null
  onClose: () => void
  onSave: (vals: Record<string, any>, newPlayer: string | null) => Promise<void>
}) {
  const known = players.some(p => p.name === session?.player_name)
  const [playerSel, setPlayerSel] = useState(session ? (known ? session.player_name || '' : '__new__') : '')
  const [newPlayer, setNewPlayer] = useState(session && !known ? session.player_name || '' : '')
  const [date, setDate] = useState(session?.session_date || new Date().toISOString().slice(0, 10))
  const [focus, setFocus] = useState(session?.focus || '')
  const [rating, setRating] = useState(String(session?.rating ?? 4))
  const [summary, setSummary] = useState(session?.summary || '')
  const [saving, setSaving] = useState(false)

  const who = (playerSel === '__new__' ? newPlayer : playerSel).trim()
  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' }
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 6px' }

  const save = async () => {
    if (!who || saving) return
    setSaving(true)
    const isNew = playerSel === '__new__' && !players.some(p => p.name.toLowerCase() === who.toLowerCase())
    try {
      await onSave({ player_name: who, session_date: date, focus, rating: Number(rating) || null, summary }, isNew ? who : null)
    } finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, width: 440, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{session ? 'Edit lesson summary' : 'New lesson summary'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbl}>Player *</label>
            <select value={playerSel} onChange={e => setPlayerSel(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
              <option value="">Choose a player…</option>
              {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              <option value="__new__">+ New player…</option>
            </select>
            {playerSel === '__new__' && <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="New player's name" style={{ ...field, marginTop: 8 }} />}
          </div>
          <div><label style={lbl}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={field} /></div>
          <div><label style={lbl}>Focus</label><input value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Second serve — kick & reliability" style={field} /></div>
          <div><label style={lbl}>Rating (1–5)</label><input type="number" min={1} max={5} value={rating} onChange={e => setRating(e.target.value)} style={field} /></div>
          <div><label style={lbl}>Coach notes</label><textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4} style={{ ...field, resize: 'vertical' }} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!who || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: who && !saving ? 'pointer' : 'not-allowed', opacity: who && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Share / export helpers ────────────────────────────────────────────────────
function shareText(s: Session): string {
  const r = s.review_json || {}
  const out: string[] = [`Lesson summary — ${s.player_name || 'Recorded session'} (${fmtDate(s.session_date)})`, '']
  if (s.focus || r.focus) out.push(`Focus: ${s.focus || r.focus}`, '')
  if (r.covered?.length) out.push('What we covered:', ...r.covered.map(c => `• ${c}`), '')
  if (r.takeaways?.length) out.push('Key takeaways:', ...r.takeaways.map(t => `• ${t}`), '')
  if (r.drills?.length) out.push(`Drills: ${r.drills.join(', ')}`, '')
  if (r.homework) out.push(`Homework: ${r.homework}`, '')
  if (r.nextFocus) out.push(`Next session: ${r.nextFocus}`, '')
  if (!r.covered?.length && s.summary) out.push(s.summary)
  return out.join('\n').trim()
}

function printSession(s: Session) {
  const r = s.review_json || {}
  const esc = (x: string) => x.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  const block = (title: string, items: string[]) => items.length ? `<h3>${esc(title)}</h3><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''
  const stars = s.rating ?? r.rating ?? 0
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lesson summary — ${esc(s.player_name || 'Recorded session')}</title>
<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:700px;margin:40px auto;color:#111;padding:0 20px}h1{font-size:22px;margin:0}h2{font-size:15px;color:#444;font-weight:600;margin:2px 0 18px}h3{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#666;margin:18px 0 6px}ul{margin:0;padding-left:20px}li{margin:3px 0}.focus{background:#f3f4f6;border-radius:8px;padding:12px 14px;margin:14px 0;font-weight:600}</style>
</head><body>
<h1>${esc(s.player_name || 'Recorded session')}</h1><h2>${esc(fmtDate(s.session_date))}${stars ? ` · ${'★'.repeat(stars)}` : ''}</h2>
<div class="focus">${esc(s.focus || r.focus || 'Lesson summary')}</div>
${block('What we covered', r.covered || [])}
${block('Key takeaways', r.takeaways || [])}
${r.drills && r.drills.length ? `<h3>Drills used</h3><p>${esc(r.drills.join(', '))}</p>` : ''}
${r.homework ? `<h3>Homework</h3><p>${esc(r.homework)}</p>` : ''}
${r.nextFocus ? `<h3>Next session focus</h3><p>${esc(r.nextFocus)}</p>` : ''}
${!r.covered?.length && s.summary ? `<h3>Coach notes</h3><p>${esc(s.summary)}</p>` : ''}
</body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 250) }
}
