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

import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { MediaCaptureModal } from './MediaCaptureModal'
import { useCoachTable, dbInsert, dbUpdate, SKILLS_BY_STAGE, logSessionAttendance } from '../_lib/coach-db'

type Review = {
  focus?: string; covered?: string[]; takeaways?: string[]; drills?: string[]
  homework?: string; nextFocus?: string; coachNote?: string; rating?: number
  skillsWorked?: string[]; time?: string; court?: string; type?: string; duration?: number
}
type PlayerLite = { id: string; name: string; racket_stage?: string | null }
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
  const { rows: playerRows, reload: reloadPlayers } = useCoachTable<PlayerLite>('coach_players')
  const players: PlayerLite[] = playerRows.map(p => ({ id: p.id, name: p.name, racket_stage: p.racket_stage }))

  // Auto-set a development goal once a player has a summary, so the coach doesn't
  // have to: derive it from their latest summary (the AI brief's next-focus when it's
  // an AI summary, otherwise the session focus). Only fills an EMPTY goal — never
  // overwrites one the coach has set. Tracked per-player so it runs at most once each.
  const goalAttempted = useRef<Set<string>>(new Set())
  useEffect(() => {
    let changed = false
    ;(async () => {
      for (const p of playerRows as any[]) {
        if ((p.goal || '').trim() || goalAttempted.current.has(p.id)) continue
        const mine = rows
          .filter(s => (s.player_name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase())
          .sort((a, b) => String(b.session_date || '').localeCompare(String(a.session_date || '')))
        const latest = mine[0]
        if (!latest) continue
        const goal = String(latest.review_json?.nextFocus || latest.focus || '').trim().slice(0, 160)
        if (!goal) continue
        goalAttempted.current.add(p.id)
        try { await dbUpdate('coach_players', p.id, { goal }); changed = true } catch { /* ignore */ }
      }
      if (changed) reloadPlayers()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, playerRows])

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

  // Closing the recording modal mid-processing leaves the summary building
  // server-side; poll-reload over the next few minutes so it appears when ready.
  const bgReload = () => [4, 10, 20, 40, 70, 110, 160].forEach(secs => setTimeout(() => reload(), secs * 1000))

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
          onClose={() => { setMediaKind(false); bgReload() }}
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
            // Session happened → auto-log attendance (present) for that day.
            logSessionAttendance(vals.player_name, vals.session_date)
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
          onExport={() => printSession(sel)}
          onEdit={() => setEditing(sel)}
          onDuplicate={async () => { await add({ player_name: sel.player_name, session_date: new Date().toISOString().slice(0, 10), focus: sel.focus, rating: sel.rating, summary: sel.summary, ai_review: sel.ai_review, review_json: sel.review_json }); setSelId(null) }}
          onDelete={async () => { if (confirm('Delete this lesson summary?')) { await remove(sel.id); setSelId(null) } }} />}
      </div>
      {modals}
    </div>
  )
}

// ── Detail pane ───────────────────────────────────────────────────────────────
function DetailPane({ T, accent, s, onExport, onEdit, onDuplicate, onDelete }: {
  T: ThemeTokens; accent: AccentTokens; s: Session
  onExport: () => void; onEdit: () => void; onDuplicate: () => void; onDelete: () => void
}) {
  const [shareOpen, setShareOpen] = useState(false)
  const r = s.review_json || {}
  const rating = s.rating ?? r.rating ?? 0
  const hasStructured = !!(r.covered?.length || r.takeaways?.length || r.drills?.length || r.skillsWorked?.length || r.homework || r.nextFocus)
  const card: CSSProperties = { background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }
  const meta = [r.time, r.duration ? `${r.duration} min` : '', r.court, r.type].filter(Boolean).join(' · ')

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar T={T} accent={accent} text={initials(s.player_name)} size={36} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{s.player_name || 'Recorded session'}</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{fmtDate(s.session_date)}{meta ? ` · ${meta}` : ''}</div>
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
              {!!r.skillsWorked?.length && <>
                <SubHead T={T} accent={accent} mt>🏆 Skills worked</SubHead>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{r.skillsWorked.map((sk, i) => <span key={i} style={{ fontSize: 11, color: accent.hex, padding: '3px 9px', borderRadius: 999, background: accent.dim, border: `1px solid ${accent.border}` }}>{sk}</span>)}</div>
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
        <button onClick={() => setShareOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>📣 Share with parent</button>
        <button onClick={onDuplicate} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Duplicate</button>
        <button onClick={onExport} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Export PDF</button>
        <button onClick={onEdit} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Edit</button>
        <button onClick={onDelete} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Delete</button>
      </div>

      {hasStructured && <CoachAiBrief T={T} accent={accent} s={s} />}
      {shareOpen && <ShareMenu T={T} accent={accent} s={s} onClose={() => setShareOpen(false)} />}
    </div>
  )
}

// ── Coach AI brief — what to work on next + a suggested next-session plan,
// derived from this lesson (mirrors the demo). "Add to next session plan"
// writes a real coach_session_plans row, so it shows up in the Session Planner.
function buildBrief(s: Session) {
  const r = s.review_json || {}
  const focus = (s.focus || r.focus || 'the focus').trim()
  const fl = focus.toLowerCase()
  const next = (r.nextFocus || 'take it into live points').trim()
  const drills = r.drills || []
  const issue = r.takeaways?.length ? r.takeaways[r.takeaways.length - 1] : focus
  const workOn = [
    `Lock in the next step — ${next}`,
    `Tidy the loose end from today: ${issue.toLowerCase()}`,
    r.skillsWorked?.length ? `Keep reinforcing ${r.skillsWorked.join(', ').toLowerCase()}` : `Keep grooving ${fl}`,
  ]
  const plan = [
    { phase: 'Warm-up & movement', mins: 8, detail: 'Dynamic prep, split-step reactions, easy mini-tennis to find the timing.' },
    { phase: 'Technical', mins: 15, detail: `Re-groove ${fl}${drills[0] ? ` — ${drills[0]}` : ' with controlled feeds and a clear cue'}.` },
    { phase: 'Constraint drill', mins: 12, detail: `${drills[1] ?? 'Target drill'} with a success target before progressing.` },
    { phase: 'Tactical / live', mins: 15, detail: `Carry "${next.toLowerCase()}" into live points and patterns.` },
    { phase: 'Match-play & review', mins: 10, detail: 'Score-based games, then a short video review and set the next homework.' },
  ]
  const planDrills = [...drills.slice(0, 2), `Pressure rep: ${next.toLowerCase()} on every 3rd ball`]
  const parentTip = r.homework ? `Encourage 10 minutes a day at home: ${r.homework}` : `Encourage a little daily practice on ${fl}.`
  return { workOn, plan, planDrills, parentTip }
}

function CoachAiBrief({ T, accent, s }: { T: ThemeTokens; accent: AccentTokens; s: Session }) {
  const brief = buildBrief(s)
  const totalMins = brief.plan.reduce((sum, p) => sum + p.mins, 0)
  const bookings = useCoachTable<any>('coach_bookings')
  const plans = useCoachTable<any>('coach_session_plans')
  const [added, setAdded] = useState<'idle' | 'saving' | 'done' | 'unbooked'>('idle')
  const planFocus = s.review_json?.nextFocus || s.focus || 'Follow-up session'
  const nameKey = (s.player_name || '').trim().toLowerCase()
  const matchPlan = (pl: any) => (pl.group_name || '').trim().toLowerCase() === nameKey && (pl.focus || '') === planFocus
  // If this session's plan was already added, reflect that on the button (so it
  // can't be added twice from a revisit).
  useEffect(() => {
    if (added === 'saving') return
    const dupe = plans.rows.find(matchPlan)
    setAdded(dupe ? (dupe.session_date ? 'done' : 'unbooked') : 'idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.rows])
  const addToPlanner = async () => {
    if (added === 'saving' || added === 'done' || added === 'unbooked') return
    setAdded('saving')
    try {
      // Don't create a duplicate — if a plan for this player + focus already exists,
      // just reflect its state.
      const existing = plans.rows.find(matchPlan)
      if (existing) { setAdded(existing.session_date ? 'done' : 'unbooked'); return }
      const name = (s.player_name || '').trim()
      const today = new Date().toISOString().slice(0, 10)
      // Find this player's next upcoming booking → link the plan to it; else leave
      // it unbooked so it shows under "Needs a booking" in the Session Planner.
      const bk = bookings.rows
        .filter((b: any) => (b.player_name || '').trim().toLowerCase() === name.toLowerCase() && (b.booking_date || '') >= today && b.status !== 'cancelled')
        .sort((a: any, b: any) => (a.booking_date || '').localeCompare(b.booking_date || ''))[0]
      await dbInsert('coach_session_plans', {
        title: bk ? `${name || 'Player'} — ${new Date(bk.booking_date).toLocaleDateString('en-GB')}` : `Next session — ${name || 'player'}`,
        session_date: bk?.booking_date || null,
        start_time: bk?.start_time || null,
        court: bk?.court || null,
        session_type: bk?.type || 'Private',
        group_name: name || null,
        focus: planFocus,
        duration_min: totalMins,
        drills: brief.planDrills.join('\n'),
        notes: brief.plan.map(p => `${p.mins}m · ${p.phase}: ${p.detail}`).join('\n'),
      })
      plans.reload()
      setAdded(bk ? 'done' : 'unbooked')
    } catch { setAdded('idle') }
  }
  return (
    <div style={{ marginTop: 16, border: `1px solid ${accent.border}`, borderRadius: 12, padding: 16, background: `linear-gradient(180deg, ${accent.dim}, transparent 60%)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span style={{ color: accent.hex }}>✦</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Coach AI brief</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>from this session</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>What to work on next</div>
          {brief.workOn.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', fontSize: 12.5, color: T.text, lineHeight: 1.45 }}><span style={{ color: accent.hex, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>{w}</div>
          ))}
          <div style={{ marginTop: 12, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Parent tip</div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 3 }}>{brief.parentTip}</div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Suggested next session</div>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{totalMins} min</span>
          </div>
          {brief.plan.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 10.5, color: accent.hex, fontWeight: 700, width: 34, flexShrink: 0, paddingTop: 1 }}>{p.mins}m</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{p.phase}</div>
                <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.4 }}>{p.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 10.5, color: T.text3, marginRight: 4 }}>Suggested drills:</span>
        {brief.planDrills.map((d, i) => <span key={i} style={{ fontSize: 11, color: T.text2, padding: '4px 8px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}` }}>{d}</span>)}
        <button onClick={addToPlanner} disabled={added !== 'idle'} title={added === 'unbooked' ? 'Saved to the planner — book a session and assign it under “Needs a booking”.' : ''} style={{ marginLeft: 'auto', appearance: 'none', border: (added === 'done' || added === 'unbooked') ? `1px solid ${T.good}` : 0, padding: '8px 14px', borderRadius: 9, background: (added === 'done' || added === 'unbooked') ? 'transparent' : accent.hex, color: (added === 'done' || added === 'unbooked') ? T.good : T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: added === 'idle' ? 'pointer' : 'default' }}>
          {added === 'done' ? '✓ Added to their booking' : added === 'unbooked' ? '✓ Saved — needs a booking' : added === 'saving' ? 'Adding…' : '📅 Add to next session plan'}
        </button>
      </div>
    </div>
  )
}

// ── Share menu — copy / email / WhatsApp the summary to a parent.
function ShareMenu({ T, accent, s, onClose }: { T: ThemeTokens; accent: AccentTokens; s: Session; onClose: () => void }) {
  const text = shareText(s)
  const subject = `Lesson summary — ${s.player_name || 'your player'}`
  const [copied, setCopied] = useState(false)
  const opts: { label: string; icon: string; run: () => void }[] = [
    { label: copied ? 'Copied to clipboard ✓' : 'Copy summary', icon: '📋', run: () => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }).catch(() => {}) },
    { label: 'Email to parent', icon: '✉️', run: () => { window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`); onClose() } },
    { label: 'Share on WhatsApp', icon: '🟢', run: () => { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); onClose() } },
  ]
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, fontFamily: FONT, padding: 16 }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, width: 340, maxWidth: '100%' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Share with parent</div>
        <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 12 }}>The coach note stays private — only the lesson detail is shared.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {opts.map(o => (
            <button key={o.label} onClick={o.run} style={{ appearance: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 10, background: T.panel2, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, textAlign: 'left' }}><span style={{ fontSize: 16 }}>{o.icon}</span>{o.label}</button>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 12, width: '100%', appearance: 'none', padding: '9px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Close</button>
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
const splitLines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// AI assist — turn the coach's quick note + focus into structured sections.
// Local heuristic (mirrors the demo): instant, offline, fully editable after.
function draftSections(focus: string, note: string) {
  const fl = (focus.trim() || 'the focus').toLowerCase()
  const ls = note.split(/[\n.;]+/).map(s => s.trim()).filter(Boolean)
  const covered = (ls.length ? ls.slice(0, 3) : [`Technical work on ${fl}`, 'Controlled feeds, then progressing to live']).concat([`Live points starting from ${fl}`]).slice(0, 4)
  const takeaways = [`Clear progress on ${fl} — more consistent and confident`, ls.length > 1 ? `Watch: ${ls[ls.length - 1].toLowerCase()}` : 'Reverts to the old habit when rushed']
  const drills = [`${cap(fl)} ladder — 10 in a row`, 'Target cones with a success rate before progressing', `Pressure points from ${fl}`]
  return { covered, takeaways, drills, homework: `10 minutes a day on ${fl}; film one set to review.`, nextFocus: `Take ${fl} into match-play patterns and live points.` }
}

// Flatten a structured review to the shareable ai_review text (matches the
// recording flow's formatter, so manual and AI-built summaries read alike).
function formatReviewText(r: Review): string {
  const out: string[] = []
  if (r.focus) out.push(`Focus: ${r.focus}`)
  if (r.covered?.length) out.push('\nWhat we covered:\n' + r.covered.map(x => `• ${x}`).join('\n'))
  if (r.takeaways?.length) out.push('\nKey takeaways:\n' + r.takeaways.map(x => `• ${x}`).join('\n'))
  if (r.drills?.length) out.push('\nDrills: ' + r.drills.join(', '))
  if (r.homework) out.push('\nHomework: ' + r.homework)
  if (r.nextFocus) out.push('\nNext session focus: ' + r.nextFocus)
  if (r.coachNote) out.push('\n' + r.coachNote)
  return out.join('\n')
}

// Rich New / Edit lesson summary — matches the demo form: who & when, AI assist,
// the structured sections, racket-system skill tags and a star rating. Saves the
// full structured review_json (so the detail view + player card render in full),
// plus the flat columns the rest of the app reads.
function SummaryFormModal({ T, accent, players, session, onClose, onSave }: {
  T: ThemeTokens; accent: AccentTokens; players: PlayerLite[]
  session: Session | null
  onClose: () => void
  onSave: (vals: Record<string, any>, newPlayer: string | null) => Promise<void>
}) {
  const r0 = session?.review_json || {}
  const known = players.some(p => p.name === session?.player_name)
  const [playerSel, setPlayerSel] = useState(session ? (known ? session.player_name || '' : '__new__') : '')
  const [newPlayer, setNewPlayer] = useState(session && !known ? session.player_name || '' : '')
  const [type, setType] = useState(r0.type || 'Private')
  const [date, setDate] = useState(session?.session_date || new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(r0.time || '12:00')
  const [court, setCourt] = useState(r0.court || '')
  const [dur, setDur] = useState(String(r0.duration ?? 60))
  const [focus, setFocus] = useState(session?.focus || r0.focus || '')
  const [note, setNote] = useState('')
  const [covered, setCovered] = useState((r0.covered || []).join('\n'))
  const [takeaways, setTakeaways] = useState((r0.takeaways || []).join('\n'))
  const [drills, setDrills] = useState((r0.drills || []).join('\n'))
  const [skills, setSkills] = useState<Set<string>>(new Set(r0.skillsWorked || []))
  const [homework, setHomework] = useState(r0.homework || '')
  const [nextFocus, setNextFocus] = useState(r0.nextFocus || '')
  const [coachNote, setCoachNote] = useState(r0.coachNote || (session?.summary && !r0.coachNote ? session.summary : '') || '')
  const [rating, setRating] = useState(session?.rating ?? r0.rating ?? 4)
  const [drafted, setDrafted] = useState(false)
  const [saving, setSaving] = useState(false)

  const who = (playerSel === '__new__' ? newPlayer : playerSel).trim()
  const selPlayer = players.find(p => p.name === playerSel)
  const stageSkills = selPlayer?.racket_stage ? (SKILLS_BY_STAGE[selPlayer.racket_stage] || []) : []
  const canSave = !!who && focus.trim().length > 0 && !saving

  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
    <div style={{ marginBottom: 12 }}><label style={lbl}>{label}</label>{children}{hint && <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>{hint}</div>}</div>
  )

  const runDraft = () => {
    const d = draftSections(focus, note)
    setCovered(d.covered.join('\n')); setTakeaways(d.takeaways.join('\n')); setDrills(d.drills.join('\n'))
    setHomework(d.homework); setNextFocus(d.nextFocus); setDrafted(true)
  }

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    const isNew = playerSel === '__new__' && !players.some(p => p.name.toLowerCase() === who.toLowerCase())
    const review: Review = {
      focus: focus.trim(), covered: splitLines(covered), takeaways: splitLines(takeaways), drills: splitLines(drills),
      skillsWorked: [...skills], homework: homework.trim(), nextFocus: nextFocus.trim(), coachNote: coachNote.trim(),
      rating, time, court: court.trim(), type, duration: Number(dur) || 60,
    }
    const publicSummary = coachNote.trim() || review.takeaways?.[0] || focus.trim()
    try {
      await onSave({
        player_name: who, session_date: date, focus: focus.trim(), rating,
        summary: publicSummary, ai_review: formatReviewText(review), review_json: review,
      }, isNew ? who : null)
    } finally { setSaving(false) }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 620, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 20px', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.panel, borderRadius: '16px 16px 0 0', zIndex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex }}>📝</div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>{session ? 'Edit lesson summary' : 'New lesson summary'}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 15 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Player *">
              <select value={playerSel} onChange={e => setPlayerSel(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                <option value="">Choose a player…</option>
                {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                <option value="__new__">+ New player…</option>
              </select>
              {playerSel === '__new__' && <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="New player's name" style={{ ...field, marginTop: 8 }} />}
            </Field>
            <Field label="Type">
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                {['Private', 'Group', 'Cardio', 'Match play'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', gap: 12 }}>
            <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={field} /></Field>
            <Field label="Time"><input type="time" value={time} onChange={e => setTime(e.target.value)} style={field} /></Field>
            <Field label="Court"><input value={court} onChange={e => setCourt(e.target.value)} placeholder="Court 1" style={field} /></Field>
            <Field label="Mins"><input inputMode="numeric" value={dur} onChange={e => setDur(e.target.value.replace(/\D/g, ''))} style={field} /></Field>
          </div>

          <Field label="Session focus *"><input value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Second serve — kick & reliability" style={field} /></Field>

          {/* AI assist */}
          <div style={{ background: `linear-gradient(120deg, ${accent.dim}, transparent)`, border: `1px solid ${accent.border}`, borderRadius: 11, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <span style={{ color: accent.hex }}>✦</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>AI assist</span>
              <span style={{ fontSize: 10.5, color: T.text3 }}>jot a quick note, draft the sections</span>
            </div>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Worked the kick serve, better net margin, toss drifts forward when rushed" style={{ ...field, resize: 'none', lineHeight: 1.5 }} />
            <button onClick={runDraft} disabled={!focus.trim()} style={{ marginTop: 8, appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: focus.trim() ? accent.hex : T.hover, color: focus.trim() ? T.btnText : T.text3, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: focus.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 7 }}>✦ {drafted ? 'Re-draft sections' : 'Draft sections with AI'}</button>
            {drafted && <span style={{ fontSize: 10.5, color: accent.hex, marginLeft: 10 }}>✓ drafted below — edit anything</span>}
          </div>

          <Field label="What we covered" hint="One point per line"><textarea rows={4} value={covered} onChange={e => setCovered(e.target.value)} style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>
          <Field label="Key takeaways" hint="One per line"><textarea rows={3} value={takeaways} onChange={e => setTakeaways(e.target.value)} style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>
          <Field label="Drills used" hint="One per line"><textarea rows={3} value={drills} onChange={e => setDrills(e.target.value)} style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>

          {stageSkills.length > 0 && (
            <Field label="Skills worked (racket system)" hint="Tap to tag">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {stageSkills.map(s => {
                  const on = skills.has(s)
                  return <button key={s} onClick={() => setSkills(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })}
                    style={{ appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{s}</button>
                })}
              </div>
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Homework"><input value={homework} onChange={e => setHomework(e.target.value)} style={field} /></Field>
            <Field label="Next session focus"><input value={nextFocus} onChange={e => setNextFocus(e.target.value)} style={field} /></Field>
          </div>
          <Field label="Coach note (private)"><textarea rows={2} value={coachNote} onChange={e => setCoachNote(e.target.value)} placeholder="For your eyes only — not shared" style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>

          <Field label="Session rating">
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setRating(n)} style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: n <= rating ? accent.hex : T.text4, padding: 0 }}>★</button>)}
            </div>
          </Field>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button onClick={save} disabled={!canSave} style={{ flex: 1, appearance: 'none', border: 0, padding: '11px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed' }}>{saving ? 'Saving…' : '✓ Save summary'}</button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '11px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          </div>
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
