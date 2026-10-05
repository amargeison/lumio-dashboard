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
import { useCoachTable, dbInsert, dbUpdate, ensureRosterPlayer, SKILLS_BY_STAGE, logSessionAttendance } from '../_lib/coach-db'
import { playerLabels } from '../_lib/tell-apart'
import { pollMedia, processStageShort } from '../_lib/media-upload'
import { avatarSrc } from '@/lib/avatar'
import { lessonRecap, sharedLessonText } from '@/lib/coach/lesson-recap'
import { ukDate } from '@/lib/coach/uk-date'
import { useAskBeforeClose } from '../_lib/ask-before-close'
import { getFlags, subscribe as subscribeFeatures, NEW_ACCOUNT_TIER } from '../_lib/feature-flags'

type Review = {
  focus?: string; covered?: string[]; takeaways?: string[]; drills?: string[]
  homework?: string; nextFocus?: string; rating?: number
  // Two notes, kept apart. `coachNote` is the coach's own — "for your eyes
  // only" — and never leaves the coach portal. `playerNote` is written TO the
  // player and is the only note the family's page is given.
  coachNote?: string; playerNote?: string
  skillsWorked?: string[]; time?: string; court?: string; type?: string; duration?: number
  // Diagnostic layer (AI summaries from a recording). `assessment` is the coach's
  // judgement — the one highest-leverage priority, why it matters and what it is
  // costing — and leads the whole summary. `technique` is HOW the coach taught it.
  // `recap` is the short plain-language headline behind the "Summary" button.
  assessment?: string; technique?: string[]; recap?: string
}
type PlayerLite = { id: string; name: string; racket_stage?: string | null; label?: string }
type Session = {
  id: string; player_name: string | null; player_id?: string | null; session_date: string | null
  focus: string | null; rating: number | null; summary: string | null
  ai_review: string | null; review_json: Review | null; created_at?: string
}

const DAY_MS = 86400000
const daysAgo = (d: string | null) => { const t = d ? new Date(d).getTime() : NaN; return isNaN(t) ? Infinity : (Date.now() - t) / DAY_MS }
const fmtDate = (d: string | null) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }
// First LETTER of each word, by character rather than by UTF-16 unit — "w[0]" of
// a name that starts with an emoji is half a character and prints as "\uFFFD".
const initials = (name: string | null) => (name || 'Session').split(/\s+/).filter(Boolean).slice(0, 2).map(w => Array.from(w)[0]?.toUpperCase()).join('') || 'S'
// Who a summary is for. A group session has no player, and a session finished
// from the planner was never "recorded" — so say what it was instead.
const whoLabel = (s: { player_name: string | null; review_json?: Review | null }) =>
  (s.player_name || '').trim() || (s.review_json?.type ? `${s.review_json.type} session` : 'Session')
const flat = (x?: string | null) => String(x || '').replace(/\s+/g, ' ').trim().toLowerCase()
// `summary` is the line shared with the player. Summaries saved before the two
// notes were separated hold the PRIVATE note there, so anything that is (or
// contains) the private note is not treated as shareable.
const sharedSummary = (s: Session): string => {
  const sum = (s.summary || '').trim(), priv = flat(s.review_json?.coachNote)
  return sum && !(priv && flat(sum).includes(priv)) ? sum : ''
}

export function LiveLessons({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const { rows, add, edit, remove, reload } = useCoachTable<Session>('coach_sessions')
  const { rows: playerRows, reload: reloadPlayers } = useCoachTable<PlayerLite>('coach_players')
  // Two players with the same name are told apart in the picker ("Jack Taylor (age 10, parent Sam)").
  const labelOf = playerLabels(playerRows as any[])
  const players: PlayerLite[] = playerRows.map(p => ({ id: p.id, name: p.name, racket_stage: p.racket_stage, label: labelOf.get(p.id) || p.name }))
  // The player a summary belongs to: by id where the row has one. A name is only
  // the fallback for older rows, and only when one player has it — two can share one.
  const playerOf = (s: { player_id?: string | null; player_name?: string | null }) => {
    if (s.player_id) { const byId = (playerRows as any[]).find(p => String(p.id) === String(s.player_id)); if (byId) return byId }
    const named = (playerRows as any[]).filter(p => (p.name || '').trim().toLowerCase() === (s.player_name || '').trim().toLowerCase())
    return named.length === 1 ? named[0] : undefined
  }
  const picFor = (s: { player_id?: string | null; player_name?: string | null }) => playerOf(s)?.avatar_url as string | undefined

  // ── Where and when the lesson actually was ──────────────────────────────────
  // A summary carried a date and nothing else, because the time, court and
  // session type live on the BOOKING, not on the write-up. A coach reading back
  // through three lessons in a week cannot tell them apart by date alone, and a
  // parent certainly cannot. So the booking is matched back on (player, date)
  // and its details fill in whatever the summary itself does not carry.
  const { rows: bookingRows } = useCoachTable<{ player_id?: string | null; player_name?: string | null; booking_date?: string | null; start_time?: string | null; court?: string | null; type?: string | null; duration_min?: number | null }>('coach_bookings')
  const whenWhere = (sess: { player_id?: string | null; player_name: string | null; session_date: string | null }) => {
    const day = String(sess.session_date || '').slice(0, 10)
    const who = String(sess.player_name || '').trim().toLowerCase()
    if (!day) return null
    const sameDay = bookingRows.filter(b => String(b.booking_date || '').slice(0, 10) === day)
    // The player's id where both rows carry one; the name only for older rows.
    return (sess.player_id && sameDay.find(b => b.player_id && String(b.player_id) === String(sess.player_id)))
      || (who ? sameDay.find(b => !(b.player_id && sess.player_id) && String(b.player_name || '').trim().toLowerCase() === who) : null)
      || null
  }

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
        // THEIR summaries: the ones written for this player id, plus the older
        // rows that carry a name and no id. Matching on name alone wrote the
        // same goal onto every profile that happened to share a name — which is
        // how three empty duplicates of one player all ended up "working on" a
        // lesson that belonged to the fourth.
        const mine = rows
          .filter(s => {
            const sid = (s as any).player_id
            if (sid) return String(sid) === String(p.id)
            return (s.player_name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase()
          })
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
  // Recording is part of the Video / Audio features. With both switched off in
  // Settings → Plan & features the Video & Audio page leaves the menu, and the
  // way in to recording from this page goes with it.
  const [feat, setFeat] = useState(() => getFlags(NEW_ACCOUNT_TIER))
  useEffect(() => { const r = () => setFeat(getFlags(NEW_ACCOUNT_TIER)); r(); return subscribeFeatures(r) }, [])
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
  // server-side. We keep watching that media row here — outside the modal — so the
  // finished summary drops into the list on its own. No navigating away and back.
  const [building, setBuilding] = useState<{ id: string; stage: string } | null>(null)
  const aliveRef = useRef(true)
  useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false } }, [])

  const watchProcessing = (mediaId: string) => {
    setBuilding({ id: mediaId, stage: 'processing' })
    pollMedia(mediaId, {
      isAlive: () => aliveRef.current,
      onStatus: s => { if (aliveRef.current) setBuilding(b => (b && b.id === mediaId ? { ...b, stage: s } : b)) },
    })
      // Reload FIRST, then clear the selection — the effect below then lands on
      // the freshly-arrived summary rather than re-picking the previous newest.
      .then(async () => { if (aliveRef.current) { await reload(); setSelId(null) } })
      .catch(() => { /* the modal/Video & Audio page surfaces the error */ })
      .finally(() => { if (aliveRef.current) setBuilding(b => (b?.id === mediaId ? null : b)) })
  }

  const onShare = (s: Session) => {
    const txt = shareText(s)
    navigator.clipboard?.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }).catch(() => {})
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text, fontFamily: FONT }}>Lesson Summaries</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3, fontFamily: FONT }}>What you covered, the key takeaways and the homework — ready to share with the player, or a junior&rsquo;s parent.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(feat.audio || feat.video) && <button onClick={() => setMediaKind(feat.audio ? 'audio' : 'video')} title="Record or upload a session — the AI writes the summary"
          style={{ appearance: 'none', border: `1px solid ${accent.border}`, padding: '9px 15px', borderRadius: 10, background: accent.dim, color: accent.hex, fontSize: 13, fontWeight: 700, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>{feat.audio ? '🎙️' : '🎬'} Add {feat.audio && feat.video ? 'audio/video' : feat.audio ? 'audio' : 'video'} → AI summary</button>}
        <button onClick={() => setEditing('new')}
          style={{ appearance: 'none', border: 0, padding: '9px 15px', borderRadius: 10, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>＋ New summary</button>
      </div>
    </div>
  )

  const tabs = (
    <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8, marginBottom: 8, width: 'fit-content', maxWidth: '100%', flexWrap: 'wrap' }}>
      {RANGE_TABS.map(rt => (
        <button key={rt.id} onClick={() => setRange(rt.id)}
          style={{ appearance: 'none', border: 0, padding: '0 12px', minHeight: 38, borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT, background: range === rt.id ? T.panel : 'transparent', color: range === rt.id ? T.text : T.text2, fontWeight: range === rt.id ? 600 : 400, boxShadow: range === rt.id ? `0 0 0 1px ${T.border}` : 'none' }}>{rt.label}</button>
      ))}
    </div>
  )

  // Visible proof the AI review is still running after the modal is closed — with
  // the live stage, so the page never looks like it has stalled.
  const buildingBanner = building && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
      <style>{`@keyframes llSpin { to { transform: rotate(360deg) } }`}</style>
      <span style={{ width: 15, height: 15, borderRadius: '50%', border: `2px solid ${accent.hex}33`, borderTopColor: accent.hex, display: 'inline-block', animation: 'llSpin 0.9s linear infinite', flexShrink: 0 }} />
      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{processStageShort(building.stage)}</div>
      <div style={{ fontSize: 11.5, color: T.text3 }}>Your summary will appear here automatically — no need to refresh.</div>
    </div>
  )

  const modals = (
    <>
      {mediaKind && (
        <MediaCaptureModal T={T} accent={accent} defaultKind={mediaKind} players={players}
          onClose={() => setMediaKind(false)}
          onProcessing={watchProcessing}
          onSummary={async () => { setMediaKind(false); await reload(); setSelId(null) }}
          onDiscarded={async () => { setMediaKind(false); await reload(); setSelId(null) }} />
      )}
      {editing && (
        <SummaryFormModal T={T} accent={accent} players={players}
          session={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (vals, newPlayer) => {
            // Reuses the roster row when the name is already there — see ensureRosterPlayer.
            // The summary carries the player's id, not only their name — a name
            // stops matching the day the player is renamed.
            if (newPlayer) {
              const id = await ensureRosterPlayer(newPlayer)
              if (id) vals = { ...vals, player_id: id }
            }
            if (editing === 'new') { await add(vals); setSelId(null) }  // null → effect selects the newest
            else await edit(editing.id, vals)
            // Session happened → auto-log attendance (present) for that day.
            // For the player the summary is FILED on (their id) — never by name.
            logSessionAttendance(vals.player_id, vals.session_date)
            setEditing(null)
          }} />
      )}
    </>
  )

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!rows.length) {
    return (
      <div style={{ fontFamily: FONT }}>
        {header}{tabs}{buildingBanner}
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
      {header}{tabs}{buildingBanner}
      {/* cm-2 stacks the two panes on a phone (list, then the open summary).
          minmax(0, 1fr) so a long line in the detail cannot widen the page. */}
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
        {/* List */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, alignSelf: 'start' }}>
          {list.length === 0 ? (
            <div style={{ fontSize: 11.5, color: T.text3, padding: '14px 8px', textAlign: 'center' }}>No summaries in this period.</div>
          ) : list.map(s => {
            const active = s.id === sel?.id
            return (
              <div key={s.id} onClick={() => setSelId(s.id)} style={{ padding: '10px', borderRadius: 8, cursor: 'pointer', background: active ? accent.dim : 'transparent', border: `1px solid ${active ? accent.border : 'transparent'}`, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar T={T} accent={accent} text={initials(whoLabel(s))} size={26} url={picFor(s)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{whoLabel(s)}</div>
                    <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {[fmtDate(s.session_date), s.review_json?.time || whenWhere(s)?.start_time || '', s.review_json?.court || whenWhere(s)?.court || ''].filter(Boolean).join(' \u00b7 ')}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: active ? T.text : T.text2, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.focus || '—'}</div>
              </div>
            )
          })}
        </div>

        {/* Detail */}
        {sel && <DetailPane T={T} accent={accent} s={sel} avatarUrl={picFor(sel)} booking={whenWhere(sel)}
          onExport={() => printSession(sel)}
          onEdit={() => setEditing(sel)}
          onDuplicate={async () => { await add({ player_name: sel.player_name, player_id: sel.player_id ?? null, session_date: ukDate(), focus: sel.focus, rating: sel.rating, summary: sharedLessonText(sel).summary, ai_review: sharedLessonText(sel).aiReview, review_json: sel.review_json }); setSelId(null) }}
          onDelete={async () => { if (confirm('Delete this lesson summary?')) { await remove(sel.id); setSelId(null) } }} />}
      </div>
      {modals}
    </div>
  )
}

// ── Detail pane ───────────────────────────────────────────────────────────────
function DetailPane({ T, accent, s, avatarUrl, booking, onExport, onEdit, onDuplicate, onDelete }: {
  T: ThemeTokens; accent: AccentTokens; s: Session; avatarUrl?: string | null
  /** The booking this lesson came from, when one matches — supplies the time,
      court and session type the write-up itself never stored. */
  booking?: { start_time?: string | null; court?: string | null; type?: string | null; duration_min?: number | null } | null
  onExport: () => void; onEdit: () => void; onDuplicate: () => void; onDelete: () => void
}) {
  const [shareOpen, setShareOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  // "What we covered" is the longest, least-read block on the page: a coach
  // scanning between sessions wants the headline, the takeaways and what is
  // next. The blow-by-blow is still here — one click away, not in the way.
  const [fullOpen, setFullOpen] = useState(false)
  const recap = shortRecap(s)
  const r = s.review_json || {}
  const rating = s.rating ?? r.rating ?? 0
  const hasStructured = !!(r.assessment || r.covered?.length || r.takeaways?.length || r.drills?.length || r.skillsWorked?.length || r.homework || r.nextFocus)
  const card: CSSProperties = { background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }
  const dur = r.duration || booking?.duration_min
  const meta = [r.time || booking?.start_time || '', dur ? `${dur} min` : '', r.court || booking?.court || '', r.type || booking?.type || ''].filter(Boolean).join(' · ')

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar T={T} accent={accent} text={initials(whoLabel(s))} size={36} url={avatarUrl} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{whoLabel(s)}</div>
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

      {/* THE SHORT VERSION, first. It is the paragraph a parent actually reads
          and the one a coach re-reads before the next lesson, so it sits at the
          top — under the focus, above every detail block. */}
      {!!recap.text && (
        <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderLeft: `3px solid ${accent.hex}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>✦ Summary</div>
            <div style={{ fontSize: 10.5, color: T.text3 }}>the short version</div>
            <button onClick={() => setRecapOpen(true)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Copy →</button>
          </div>
          <div style={{ fontSize: 13.5, color: T.text, marginTop: 6, lineHeight: 1.65, fontWeight: 500 }}>{recap.text}</div>
        </div>
      )}

      {/* The coach's diagnosis leads the summary — the one highest-leverage
          priority, why it matters and what it is costing — before the
          chronological "what we covered". */}
      {r.assessment && (
        <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderLeft: `3px solid ${accent.hex}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 5 }}>
            {s.player_name ? `Where ${s.player_name.split(/\s+/)[0]} is right now` : 'Assessment'}
          </div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{r.assessment}</div>
        </div>
      )}

      {hasStructured ? (
        <>
          {/* The scannable half: what mattered, what they practised, what is
              next. Everything here is a box or a chip on purpose — this pane
              is read standing on a court with a bag over one shoulder. */}
          {!!r.takeaways?.length && (
            <div style={{ marginBottom: 14 }}>
              <SubHead T={T} accent={accent}>✦ Key takeaways</SubHead>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 8 }}>
                {r.takeaways.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 12.5, color: T.text, lineHeight: 1.5, fontWeight: 500 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!!r.skillsWorked?.length || !!r.drills?.length) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginBottom: 14 }}>
              {!!r.skillsWorked?.length && (
                <div style={card}>
                  <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 7 }}>🏆 Skills worked</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{r.skillsWorked.map((sk, i) => <span key={i} style={{ fontSize: 11, color: accent.hex, padding: '3px 9px', borderRadius: 999, background: accent.dim, border: `1px solid ${accent.border}` }}>{sk}</span>)}</div>
                </div>
              )}
              {!!r.drills?.length && (
                <div style={card}>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 7 }}>⚑ Drills used</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{r.drills.map((dl, i) => <span key={i} style={{ fontSize: 11.5, color: T.text2, padding: '4px 9px', borderRadius: 6, background: T.panel, border: `1px solid ${T.border}` }}>{dl}</span>)}</div>
                </div>
              )}
            </div>
          )}

          {(r.nextFocus || r.homework || r.playerNote || r.coachNote) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 14 }}>
              {r.nextFocus && <div style={{ ...card, borderLeft: `3px solid ${accent.hex}` }}>
                <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>→ Next session focus</div>
                <div style={{ fontSize: 12.5, color: T.text, marginTop: 4, lineHeight: 1.5, fontWeight: 600 }}>{r.nextFocus}</div>
              </div>}
              {r.homework && <div style={{ ...card, borderLeft: `3px solid ${T.good}` }}>
                <div style={{ fontSize: 10, color: T.good, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>⌂ Homework</div>
                <div style={{ fontSize: 12.5, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{r.homework}</div>
              </div>}
              {r.playerNote && <div style={{ ...card, borderLeft: `3px solid ${accent.hex}` }}>
                <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Note to the player · shared</div>
                <div style={{ fontSize: 12.5, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{r.playerNote}</div>
              </div>}
              {r.coachNote && <div style={{ ...card, borderLeft: `3px solid ${T.border}` }}>
                <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Coach note (private) · not shared</div>
                <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>{r.coachNote}</div>
              </div>}
            </div>
          )}

          {/* The long version, folded away. */}
          {(!!r.covered?.length || !!r.technique?.length) && (
            <>
              <button onClick={() => setFullOpen(o => !o)}
                style={{ appearance: 'none', width: '100%', textAlign: 'left', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', fontSize: 12.5, fontWeight: 700, color: T.text2, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: accent.hex }}>{fullOpen ? '▾' : '▸'}</span>
                {fullOpen ? 'Hide the full session detail' : 'Full session detail'}
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: T.text3 }}>
                  {[r.covered?.length ? `${r.covered.length} things covered` : '', r.technique?.length ? 'how we worked on it' : ''].filter(Boolean).join(' \u00b7 ')}
                </span>
              </button>
              {fullOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18, marginTop: 14 }}>
                  {!!r.covered?.length && (
                    <div>
                      <SubHead T={T} accent={accent}>✓ What we covered</SubHead>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>{r.covered.map((c, i) => <li key={i} style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.7 }}>{c}</li>)}</ul>
                    </div>
                  )}
                  {!!r.technique?.length && (
                    <div>
                      <SubHead T={T} accent={accent}>◈ How we worked on it</SubHead>
                      {r.technique.map((t, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: T.text2, padding: '4px 0', lineHeight: 1.5 }}><span style={{ color: accent.hex, flexShrink: 0 }}>·</span>{t}</div>)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        // Manually-typed summary — no structured blocks; show the notes / AI review.
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* The typed notes of an older summary. Not repeated when it is only the
              focus or one of the two notes shown under their own labels below. */}
          {s.summary && ![r.playerNote, r.coachNote, s.focus].some(x => flat(x) === flat(s.summary)) && <div style={card}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coach notes</div>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.summary}</div>
          </div>}
          {r.playerNote && <div style={{ ...card, borderLeft: `3px solid ${accent.hex}` }}>
            <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Note to the player · shared</div>
            <div style={{ fontSize: 12.5, color: T.text, marginTop: 4, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.playerNote}</div>
          </div>}
          {r.coachNote && <div style={card}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Coach note (private) · not shared</div>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4, lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{r.coachNote}</div>
          </div>}
          {s.ai_review && <div style={{ ...card, background: accent.dim, borderColor: accent.border }}>
            <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>✦ AI review</div>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.ai_review}</div>
          </div>}
          {!s.summary && !s.ai_review && !r.playerNote && !r.coachNote && <div style={{ fontSize: 12.5, color: T.text3 }}>No detail recorded for this summary yet — use Edit to add notes.</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setShareOpen(true)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>📣 Share it</button>
        <button onClick={onDuplicate} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Duplicate</button>
        <button onClick={() => setRecapOpen(true)} title="The short version — a 2-3 sentence recap of the session" style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Summary</button>
        <button onClick={onExport} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Export PDF</button>
        <button onClick={onEdit} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Edit</button>
        <button onClick={onDelete} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer' }}>Delete</button>
      </div>

      {hasStructured && <CoachAiBrief key={s.id} T={T} accent={accent} s={s} />}
      {shareOpen && <ShareMenu T={T} accent={accent} s={s} onClose={() => setShareOpen(false)} />}
      {recapOpen && <RecapModal T={T} accent={accent} s={s} onClose={() => setRecapOpen(false)} />}
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

// Lumio Coach is asked for a lesson's next session ONCE. The answer is kept in
// this browser, so opening Lesson Summaries again shows it without asking (and
// paying) again; a request that failed is not repeated until the page is reloaded.
const briefAsked = new Map<string, Promise<KeptBrief | null>>()
const briefKey = (id: string, focus: string) => `lumio-coach:next-session:${id}:${focus.trim().toLowerCase()}`
type KeptBrief = { brief: ReturnType<typeof buildBrief>; kit: string[] }
const readBrief = (k: string): KeptBrief | null => {
  try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v?.brief?.plan?.length ? v : null } catch { return null }
}

function CoachAiBrief({ T, accent, s }: { T: ThemeTokens; accent: AccentTokens; s: Session }) {
  // The template brief is the starting frame; Lumio Coach replaces it as soon as
  // he answers. Same route the Session Planner uses, so a plan created here and
  // a plan created there are the same artefact — timed run-sheet, kit and all.
  const fallback = buildBrief(s)
  const [brief, setBrief] = useState(fallback)
  const [kit, setKit] = useState<string[]>([])
  const [byBoris, setByBoris] = useState(false)
  const [briefErr, setBriefErr] = useState('')
  const totalMins = brief.plan.reduce((sum, p) => sum + p.mins, 0)

  useEffect(() => {
    let cancelled = false
    const nextFocus = s.review_json?.nextFocus || s.focus || ''
    if (!nextFocus.trim()) return
    const key = briefKey(s.id, nextFocus)
    const kept = readBrief(key)
    if (kept) { setBrief(kept.brief); setKit(kept.kit || []); setByBoris(true); setBriefErr(''); return }
    // One request per lesson, shared by everything that asks while it is on its
    // way or after it has answered (null = no usable plan came back).
    let asking = briefAsked.get(key)
    if (!asking) {
      asking = fetch('/api/coach/session-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Private', focus: nextFocus, duration: 60,
          player: s.player_name, playerId: s.player_id ?? undefined, note: 'This plan follows straight on from the lesson just reviewed.',
        }),
      })
        .then(r => r.json().then(d => ({ ok: r.ok, d })))
        .then(({ ok, d }): KeptBrief | null => {
          // An answer with no run-sheet is not a plan.
          if (!ok || !d.run_sheet?.length) return null
          const built: KeptBrief = {
            brief: {
              workOn: d.focus_points?.length ? d.focus_points : fallback.workOn,
              plan: d.run_sheet.map((ph: { phase: string; mins: number; detail: string }) => ({ phase: ph.phase, mins: ph.mins, detail: ph.detail })),
              planDrills: d.drills?.length ? d.drills : fallback.planDrills,
              parentTip: d.coach_note || fallback.parentTip,
            },
            kit: d.kit || [],
          }
          try { localStorage.setItem(key, JSON.stringify(built)) } catch { /* private mode: it is simply asked again next time */ }
          return built
        })
        .catch(() => null)
      briefAsked.set(key, asking)
    }
    asking.then(built => {
      if (cancelled) return
      // Say so, rather than leaving the panel on "building…" for ever.
      if (!built) { setBriefErr('Lumio Coach could not build the next session, so this is a general plan.'); return }
      setBrief(built.brief)
      setKit(built.kit)
      setByBoris(true)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id])
  const bookings = useCoachTable<any>('coach_bookings')
  const plans = useCoachTable<any>('coach_session_plans')
  const [added, setAdded] = useState<'idle' | 'saving' | 'done' | 'unbooked'>('idle')
  const [addErr, setAddErr] = useState('')
  const planFocus = s.review_json?.nextFocus || s.focus || 'Follow-up session'
  const nameKey = (s.player_name || '').trim().toLowerCase()
  const matchPlan = (pl: any) => (pl.group_name || '').trim().toLowerCase() === nameKey && (pl.focus || '') === planFocus
  // If this session's plan was already added, reflect that on the button (so it
  // can't be added twice from a revisit).
  useEffect(() => {
    if (added === 'saving') return
    const dupe = plans.rows.find(matchPlan)
    setAdded(dupe ? (dupe.booking_id ? 'done' : 'unbooked') : 'idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.rows])
  const addToPlanner = async () => {
    if (added === 'saving' || added === 'done' || added === 'unbooked') return
    setAdded('saving'); setAddErr('')
    try {
      // Don't create a duplicate — if a plan for this player + focus already exists,
      // just reflect its state.
      const existing = plans.rows.find(matchPlan)
      if (existing) { setAdded(existing.booking_id ? 'done' : 'unbooked'); return }
      const name = (s.player_name || '').trim()
      const today = ukDate()
      // Find this player's next upcoming booking → the plan is written FOR that
      // booking (booking_id), so it moves when the lesson is moved. A booking
      // that already has a plan is not offered: one plan per lesson. With no
      // free booking the plan waits under "Needs a booking" in the Session Planner.
      const planned = new Set(plans.rows.map((pl: any) => pl.booking_id).filter(Boolean).map(String))
      const theirs = (b: any) => s.player_id && b.player_id
        ? String(b.player_id) === String(s.player_id)
        : !!name && (b.player_name || '').trim().toLowerCase() === name.toLowerCase()
      const bk = bookings.rows
        .filter((b: any) => theirs(b) && (b.booking_date || '') >= today && b.status !== 'cancelled' && b.type !== 'Block' && !planned.has(String(b.id)))
        .sort((a: any, b: any) => (a.booking_date || '').localeCompare(b.booking_date || '') || String(a.start_time || '').localeCompare(String(b.start_time || '')))[0]
      await dbInsert('coach_session_plans', {
        title: bk ? `${name || 'Player'} — ${new Date(bk.booking_date).toLocaleDateString('en-GB')}` : `Next session — ${name || 'player'}`,
        booking_id: bk?.id || null,
        session_date: bk?.booking_date || null,
        start_time: bk?.start_time || null,
        court: bk?.court || null,
        session_type: bk?.type || 'Private',
        group_name: name || null,
        player_id: s.player_id || null,   // who it is for, by id (migration 208)
        focus: planFocus,
        duration_min: totalMins,
        drills: brief.planDrills.join('\n'),
        focus_points: brief.workOn.join('\n'),
        notes: brief.plan.map(p => `${p.mins}m · ${p.phase}: ${p.detail}`).join('\n'),
        run_sheet: byBoris ? brief.plan : null,
        kit: kit.length ? kit : null,
        built_by: byBoris ? 'lumio-coach' : 'coach',
        designed_at: new Date().toISOString(),
        source: 'lesson-review',
      })
      plans.reload()
      setAdded(bk ? 'done' : 'unbooked')
    } catch { setAdded('idle'); setAddErr('That plan could not be saved. Please try again.') }
  }
  return (
    <div style={{ marginTop: 16, border: `1px solid ${accent.border}`, borderRadius: 12, padding: 16, background: `linear-gradient(180deg, ${accent.dim}, transparent 60%)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span style={{ color: accent.hex }}>✦</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{byBoris ? 'Lumio Coach’s next session' : 'Suggested next session'}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{byBoris ? 'built from this lesson' : (briefErr || !(s.review_json?.nextFocus || s.focus || '').trim()) ? 'general plan' : 'building…'}</span>
      </div>
      {briefErr && <div style={{ fontSize: 11, color: T.text3, marginBottom: 8 }}>{briefErr}</div>}
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>What to work on next</div>
          {brief.workOn.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', fontSize: 12.5, color: T.text, lineHeight: 1.45 }}><span style={{ color: accent.hex, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>{w}</div>
          ))}
          <div style={{ marginTop: 12, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tip to pass on</div>
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
      {addErr && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 8, textAlign: 'right' }}>{addErr}</div>}
    </div>
  )
}

// ── Share menu — copy / email / WhatsApp the summary to a parent.
function ShareMenu({ T, accent, s, onClose }: { T: ThemeTokens; accent: AccentTokens; s: Session; onClose: () => void }) {
  const text = shareText(s)
  const subject = `Lesson summary — ${s.player_name || 'your session'}`
  const [copied, setCopied] = useState(false)
  const opts: { label: string; icon: string; run: () => void }[] = [
    { label: copied ? 'Copied to clipboard ✓' : 'Copy summary', icon: '📋', run: () => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }).catch(() => {}) },
    { label: 'Email it', icon: '✉️', run: () => { window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`); onClose() } },
    { label: 'Share on WhatsApp', icon: '🟢', run: () => { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); onClose() } },
  ]
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, fontFamily: FONT, padding: 16 }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, width: 340, maxWidth: '100%' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Share this summary</div>
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

function Avatar({ T, accent, text, size, url }: { T: ThemeTokens; accent: AccentTokens; text: string; size: number; url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarSrc(url)} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
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
  if (r.assessment) out.push('\nAssessment:\n' + r.assessment)
  if (r.covered?.length) out.push('\nWhat we covered:\n' + r.covered.map(x => `• ${x}`).join('\n'))
  if (r.technique?.length) out.push('\nHow we worked on it:\n' + r.technique.map(x => `• ${x}`).join('\n'))
  if (r.takeaways?.length) out.push('\nKey takeaways:\n' + r.takeaways.map(x => `• ${x}`).join('\n'))
  if (r.drills?.length) out.push('\nDrills: ' + r.drills.join(', '))
  if (r.homework) out.push('\nHomework: ' + r.homework)
  if (r.nextFocus) out.push('\nNext session focus: ' + r.nextFocus)
  // The note TO the player. The coach's private note (coachNote) is never part
  // of this text: ai_review is the shareable version of the summary.
  if (r.playerNote) out.push('\n' + r.playerNote)
  return out.join('\n')
}

// Declared out here, not inside the form. A component created during another
// component's render is a NEW component type on every render, so React threw
// away and rebuilt every input on each keystroke — the box lost focus after one
// character.
function Field({ T, label, hint, children }: { T: ThemeTokens; label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 12, minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>{hint}</div>}
    </div>
  )
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
  // The dropdown holds the player's ID. It used to hold their name, which cannot
  // tell two players with the same name apart and saved the summary with no
  // link to the player at all.
  const namesakes = (n?: string | null) => players.filter(p => p.name.trim().toLowerCase() === String(n || '').trim().toLowerCase())
  const known = (session?.player_id && players.find(p => String(p.id) === String(session.player_id)))
    || (namesakes(session?.player_name).length === 1 ? namesakes(session?.player_name)[0] : null)
    || null
  const [playerSel, setPlayerSel] = useState(session ? (known ? known.id : (session.player_name ? '__new__' : '')) : '')
  const [newPlayer, setNewPlayer] = useState(session && !known ? session.player_name || '' : '')
  const [type, setType] = useState(r0.type || 'Private')
  // Today in the UK. toISOString() is the UTC date, which between midnight and
  // 1am in summer is still yesterday.
  const [date, setDate] = useState(session?.session_date || ukDate())
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
  // Two notes. The private one is the coach's alone. A summary from before the
  // structured form existed has only its typed notes, and those open in the
  // PRIVATE box — the coach can move them across, but nothing is shared by default.
  const [coachNote, setCoachNote] = useState(r0.coachNote || (!session?.review_json ? session?.summary || '' : ''))
  const [playerNote, setPlayerNote] = useState(r0.playerNote || '')
  const [rating, setRating] = useState(session?.rating ?? r0.rating ?? 4)
  const [drafted, setDrafted] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [draftErr, setDraftErr] = useState('')
  // Written by Lumio Coach and carried through save. The form doesn't show them:
  // `assessment` is the diagnostic layer, and `recap` is the one-liner the Summary
  // modal displays — a field that existed with nothing ever writing to it.
  const [aiAssessment, setAiAssessment] = useState('')
  const [aiRecap, setAiRecap] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const selPlayer = players.find(p => p.id === playerSel)
  const who = (playerSel === '__new__' ? newPlayer : selPlayer?.name || '').trim()
  const stageSkills = selPlayer?.racket_stage ? (SKILLS_BY_STAGE[selPlayer.racket_stage] || []) : []
  // A group session finished from the planner has no player, and must still be
  // editable — so a player is only required where there was one to begin with.
  const noPlayerOk = !!session && !(session.player_name || '').trim()
  const canSave = (!!who || noPlayerOk) && focus.trim().length > 0 && !saving

  const closeOutside = useAskBeforeClose(JSON.stringify([playerSel, newPlayer, type, date, time, court, dur, focus, note, covered, takeaways, drills, [...skills], homework, nextFocus, coachNote, playerNote, rating]), onClose)

  // minWidth 0 so a date or time box can shrink inside a narrow grid column
  // instead of pushing the form wider than a phone screen.
  const field: CSSProperties = { width: '100%', minWidth: 0, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }

  const runDraft = async () => {
    if (drafting) return
    setDrafting(true); setDraftErr('')
    try {
      const res = await fetch('/api/coach/lesson-summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: who, playerId: playerSel === '__new__' ? undefined : selPlayer?.id, focus, note, rating, date }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Lumio Coach could not write that summary')
      setCovered((d.covered || []).join('\n'))
      setTakeaways((d.takeaways || []).join('\n'))
      setDrills((d.drills || []).join('\n'))
      setHomework(d.homework || ''); setNextFocus(d.nextFocus || '')
      setAiAssessment(d.assessment || ''); setAiRecap(d.recap || '')
      setDrafted(true)
    } catch (e) {
      // No silent fall-back to a template. If the button says Lumio Coach wrote
      // it, he did — and this summary gets shared with a parent.
      setDraftErr(e instanceof Error ? e.message : 'Lumio Coach could not write that summary')
    }
    setDrafting(false)
  }

  const save = async () => {
    if (!canSave) return
    setSaveErr('')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setSaveErr('Choose the date of the lesson.'); return }
    const mins = Number(dur)
    if (!Number.isInteger(mins) || mins < 5 || mins > 600) { setSaveErr('Enter the length of the lesson in minutes, between 5 and 600.'); return }
    // A typed name that is already on the roster (in any case) is that player —
    // unless two players have it, when only the list can say which one is meant.
    const typed = playerSel === '__new__'
    if (typed && namesakes(who).length > 1) { setSaveErr('More than one player is called that. Choose the player from the list.'); return }
    setSaving(true)
    const match = typed ? namesakes(who)[0] : selPlayer
    const isNew = typed && !!who && !match
    const review: Review = {
      // The form doesn't expose the AI diagnostic layer, so rebuilding the review
      // from the fields alone would silently drop it on any edit. Carry it over.
      ...((aiAssessment || r0.assessment) ? { assessment: aiAssessment || r0.assessment } : {}),
      ...(r0.technique?.length ? { technique: r0.technique } : {}),
      ...((aiRecap || r0.recap) ? { recap: aiRecap || r0.recap } : {}),
      focus: focus.trim(), covered: splitLines(covered), takeaways: splitLines(takeaways), drills: splitLines(drills),
      skillsWorked: [...skills], homework: homework.trim(), nextFocus: nextFocus.trim(),
      coachNote: coachNote.trim(), playerNote: playerNote.trim(),
      rating, time, court: court.trim(), type, duration: mins,
    }
    // `summary` and `ai_review` are the SHARED columns — the player's page and
    // anything sent to a parent read them. The private note goes in neither. It
    // lives only in review_json.coachNote, which the family's copy leaves out.
    // An existing summary line that was written on its own — the "how did it
    // go?" note from Finish session, say — is kept through an edit. One that was
    // only ever derived (the note, the first takeaway, the focus) is re-derived,
    // and a summary with no structured review opened in the private box above,
    // so it is not kept as shared.
    const kept = session?.review_json ? sharedSummary(session) : ''
    const derived = [r0.playerNote, r0.takeaways?.[0], session?.focus, r0.focus].map(flat)
    const publicSummary = (kept && !derived.includes(flat(kept)) ? kept : '')
      || playerNote.trim() || review.takeaways?.[0] || focus.trim()
    try {
      await onSave({
        player_name: who || null, player_id: match?.id ?? null, session_date: date, focus: focus.trim(), rating,
        summary: publicSummary, ai_review: formatReviewText(review), review_json: review,
      }, isNew ? who : null)
    } catch (e) {
      console.error('[lessons] save', e)
      setSaveErr('The summary could not be saved. Check your connection and try again.')
    } finally { setSaving(false) }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 620, minWidth: 0, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 20px', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.panel, borderRadius: '16px 16px 0 0', zIndex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex }}>📝</div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>{session ? 'Edit lesson summary' : 'New lesson summary'}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 40, height: 40, fontSize: 15, flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <Field T={T} label={noPlayerOk ? 'Player' : 'Player *'}>
              <select value={playerSel} onChange={e => setPlayerSel(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                <option value="">{noPlayerOk ? 'No player (group session)' : 'Choose a player…'}</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.label || p.name}</option>)}
                <option value="__new__">+ New player…</option>
              </select>
              {playerSel === '__new__' && <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="New player's name" style={{ ...field, marginTop: 8 }} />}
            </Field>
            <Field T={T} label="Type">
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                {['Private', 'Group', 'Cardio', 'Match play'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 12 }}>
            <Field T={T} label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={field} /></Field>
            <Field T={T} label="Time"><input type="time" value={time} onChange={e => setTime(e.target.value)} style={field} /></Field>
            <Field T={T} label="Court"><input value={court} onChange={e => setCourt(e.target.value)} placeholder="Court 1" style={field} /></Field>
            <Field T={T} label="Mins"><input inputMode="numeric" value={dur} onChange={e => setDur(e.target.value.replace(/\D/g, ''))} style={field} /></Field>
          </div>

          <Field T={T} label="Session focus *"><input value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Second serve — kick & reliability" style={field} /></Field>

          {/* AI assist */}
          <div style={{ background: `linear-gradient(120deg, ${accent.dim}, transparent)`, border: `1px solid ${accent.border}`, borderRadius: 11, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <span style={{ color: accent.hex }}>✦</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>AI assist</span>
              <span style={{ fontSize: 10.5, color: T.text3 }}>jot a quick note, draft the sections</span>
            </div>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Worked the kick serve, better net margin, toss drifts forward when rushed" style={{ ...field, resize: 'none', lineHeight: 1.5 }} />
            <>
              <button onClick={runDraft} disabled={!focus.trim() || drafting} style={{ marginTop: 8, appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: focus.trim() ? accent.hex : T.hover, color: focus.trim() ? T.btnText : T.text3, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: focus.trim() && !drafting ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 7 }}>✦ {drafting ? 'Lumio Coach is writing…' : drafted ? 'Re-write with Lumio Coach' : 'Write it with Lumio Coach'}</button>
              {draftErr && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 6 }}>{draftErr}</div>}
            </>
            {drafted && <span style={{ fontSize: 10.5, color: accent.hex, marginLeft: 10 }}>✓ drafted below — edit anything</span>}
          </div>

          <Field T={T} label="What we covered" hint="One point per line"><textarea rows={4} value={covered} onChange={e => setCovered(e.target.value)} style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>
          <Field T={T} label="Key takeaways" hint="One per line"><textarea rows={3} value={takeaways} onChange={e => setTakeaways(e.target.value)} style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>
          <Field T={T} label="Drills used" hint="One per line"><textarea rows={3} value={drills} onChange={e => setDrills(e.target.value)} style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>

          {stageSkills.length > 0 && (
            <Field T={T} label="Skills worked" hint="Tap to tag">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {stageSkills.map(s => {
                  const on = skills.has(s)
                  return <button key={s} onClick={() => setSkills(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })}
                    style={{ appearance: 'none', border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2, borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{s}</button>
                })}
              </div>
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <Field T={T} label="Homework"><input value={homework} onChange={e => setHomework(e.target.value)} style={field} /></Field>
            <Field T={T} label="Next session focus"><input value={nextFocus} onChange={e => setNextFocus(e.target.value)} style={field} /></Field>
          </div>
          <Field T={T} label="Note to the player (shared)" hint="Shown to the player, or a junior’s parent, with this lesson."><textarea rows={2} value={playerNote} onChange={e => setPlayerNote(e.target.value)} placeholder="e.g. Great effort today — keep the shadow swings going" style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>
          <Field T={T} label="Coach note (private)" hint="Stays in the coach portal. It is never shown to the player or parent."><textarea rows={2} value={coachNote} onChange={e => setCoachNote(e.target.value)} placeholder="For your eyes only — not shared" style={{ ...field, resize: 'vertical', lineHeight: 1.5 }} /></Field>

          <Field T={T} label="Session rating">
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setRating(n)} aria-label={`${n} out of 5`} style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 24, lineHeight: 1, color: n <= rating ? accent.hex : T.text4, padding: 0, width: 40, height: 40 }}>★</button>)}
            </div>
          </Field>

          {saveErr && <div role="alert" style={{ fontSize: 12, color: T.bad, marginBottom: 8 }}>{saveErr}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button onClick={save} disabled={!canSave} style={{ flex: 1, appearance: 'none', border: 0, padding: '11px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed' }}>{saving ? 'Saving…' : '✓ Save summary'}</button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '11px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Short recap ───────────────────────────────────────────────────────────────
// The "Summary" button shows the headline of the session in 2-3 plain sentences,
// distinct from the full detailed summary. AI summaries written since the
// diagnostic tuning carry a proper "recap" field; for everything before that
// (and for manually-typed summaries) we derive one locally from what the summary
// already holds — no per-click API call, so the button is instant and free.
function shortRecap(s: Session): { text: string; source: 'ai' | 'derived' } {
  const r = lessonRecap(s)
  return {
    text: r.source === 'none' ? 'No detail recorded for this summary yet — use Edit to add notes.' : r.text,
    source: r.source === 'ai' ? 'ai' : 'derived',
  }
}

function RecapModal({ T, accent, s, onClose }: { T: ThemeTokens; accent: AccentTokens; s: Session; onClose: () => void }) {
  const { text, source } = shortRecap(s)
  const [copied, setCopied] = useState(false)
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, fontFamily: FONT, padding: 16 }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, width: 440, maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Summary</div>
          <div style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{whoLabel(s)} · {fmtDate(s.session_date)}</div>
        </div>
        <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 12 }}>The short version — {source === 'ai' ? 'the headline of the session.' : 'drawn from the full summary below it.'}</div>
        <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '13px 15px', fontSize: 13.5, color: T.text, lineHeight: 1.65 }}>{text}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={() => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }).catch(() => {})}
            style={{ flex: 1, appearance: 'none', border: 0, padding: '9px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{copied ? 'Copied ✓' : '📋 Copy'}</button>
          <button onClick={onClose} style={{ flex: 1, appearance: 'none', padding: '9px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Share / export helpers ────────────────────────────────────────────────────
function shareText(s: Session): string {
  const r = s.review_json || {}
  const out: string[] = [`Lesson summary — ${whoLabel(s)} (${fmtDate(s.session_date)})`, '']
  if (s.focus || r.focus) out.push(`Focus: ${s.focus || r.focus}`, '')
  if (r.assessment) out.push('Assessment:', r.assessment, '')
  if (r.covered?.length) out.push('What we covered:', ...r.covered.map(c => `• ${c}`), '')
  if (r.technique?.length) out.push('How we worked on it:', ...r.technique.map(t => `• ${t}`), '')
  if (r.takeaways?.length) out.push('Key takeaways:', ...r.takeaways.map(t => `• ${t}`), '')
  if (r.drills?.length) out.push(`Drills: ${r.drills.join(', ')}`, '')
  if (r.homework) out.push(`Homework: ${r.homework}`, '')
  if (r.nextFocus) out.push(`Next session: ${r.nextFocus}`, '')
  if (r.playerNote) out.push(r.playerNote, '')
  // Never the private note: sharedSummary() leaves out a summary line that is one.
  const sum = sharedSummary(s)
  if (!r.covered?.length && sum && flat(sum) !== flat(r.playerNote)) out.push(sum)
  return out.join('\n').trim()
}

function printSession(s: Session) {
  const r = s.review_json || {}
  const esc = (x: string) => x.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  const block = (title: string, items: string[]) => items.length ? `<h3>${esc(title)}</h3><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''
  const stars = s.rating ?? r.rating ?? 0
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lesson summary — ${esc(whoLabel(s))}</title>
<style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:700px;margin:40px auto;color:#111;padding:0 20px}h1{font-size:22px;margin:0}h2{font-size:15px;color:#444;font-weight:600;margin:2px 0 18px}h3{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#666;margin:18px 0 6px}ul{margin:0;padding-left:20px}li{margin:3px 0}.focus{background:#f3f4f6;border-radius:8px;padding:12px 14px;margin:14px 0;font-weight:600}</style>
</head><body>
<h1>${esc(whoLabel(s))}</h1><h2>${esc(fmtDate(s.session_date))}${stars ? ` · ${'★'.repeat(stars)}` : ''}</h2>
<div class="focus">${esc(s.focus || r.focus || 'Lesson summary')}</div>
${r.assessment ? `<h3>Assessment</h3><p>${esc(r.assessment)}</p>` : ''}
${block('What we covered', r.covered || [])}
${block('How we worked on it', r.technique || [])}
${block('Key takeaways', r.takeaways || [])}
${r.drills && r.drills.length ? `<h3>Drills used</h3><p>${esc(r.drills.join(', '))}</p>` : ''}
${r.homework ? `<h3>Homework</h3><p>${esc(r.homework)}</p>` : ''}
${r.nextFocus ? `<h3>Next session focus</h3><p>${esc(r.nextFocus)}</p>` : ''}
${r.playerNote ? `<h3>From your coach</h3><p>${esc(r.playerNote)}</p>` : ''}
${!r.covered?.length && sharedSummary(s) && flat(sharedSummary(s)) !== flat(r.playerNote) ? `<h3>Coach notes</h3><p>${esc(sharedSummary(s))}</p>` : ''}
</body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 250) }
}
