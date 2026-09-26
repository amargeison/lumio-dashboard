'use client'

// ─── THE STUDENT APP ─────────────────────────────────────────────────────────
//
// One view, two readers. The coach sees it through the role switcher, scoped to
// whichever player they pick; the player or parent sees exactly the same page at
// /portal, scoped by their membership to one child. Nothing about the rendering
// differs — which is the point. What a coach previews before inviting a family
// is what that family gets, and there is one implementation to keep honest
// instead of a demo and a live version drifting apart.
//
// It renders ONLY what exists. A section with nothing in it is not an empty
// shell with hopeful copy, it is absent: a brand-new academy's first parent
// should see a short, complete page rather than a long, broken-looking one. The
// coach can also switch any section off in Settings, which wins over the data.
//
// Nothing here fetches. Both callers hand it a finished bundle, because the two
// of them get their data by entirely different routes — the coach's own access
// on one side, a service-role query fenced to one player on the other — and the
// view has no business knowing which.

import { useEffect, useState } from 'react'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { RACKET_STAGES, SKILLS_BY_STAGE, SKILL_LEVELS } from '@/app/coach/[slug]/_lib/coach-db'
import { avatarSrc } from '@/lib/avatar'
import {
  studentFraming, latestGuidance, activeCamps, daysUntil, asStringList,
  type StudentBundle, type StudentCamp, type StudentClip, type StudentWatchSession,
  type StudentNextSession,
} from '@/lib/student/bundle'
import { venueMapUrl } from '@/lib/coach/booking-venue'
import { lessonRecap } from '@/lib/coach/lesson-recap'
import { studentSectionOn } from '@/lib/student/sections'

export type StudentTheme = {
  text: string; text2: string; text3: string; text4: string
  panel: string; panel2: string; border: string
  good: string; warn: string; bad: string; hover: string
  accent: string; accentDim: string; accentBorder: string
  btnText: string
  gap: number; pad: number; radius: number
}

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

// ── primitives (soft and roomy — the parent's page, not the coach's console) ──
function Card({ T, children, style }: { T: StudentTheme; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: Math.max(T.radius, 16), padding: T.pad + 4, ...style }}>{children}</div>
}

function Head({ T, icon, title, sub, lead }: { T: StudentTheme; icon: string; title: string; sub?: string; lead?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: T.accentDim, border: `1px solid ${T.accentBorder}`, flexShrink: 0 }}>
        <Icon name={icon} size={16} stroke={1.8} style={{ color: T.accent }} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontFamily: FONT, fontSize: lead ? 18 : 16, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>{title}</h2>
          {lead && <span style={{ fontSize: 8.5, fontWeight: 700, color: T.accent, background: T.accentDim, padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Highlight</span>}
        </div>
        {sub && <div style={{ fontSize: 12, color: T.text3, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

function Tile({ T, label, value, sub, color }: { T: StudentTheme; label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div className="lsv-num" style={{ fontSize: 22, fontWeight: 800, color: color ?? T.text, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

const initialsOf = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const prettyDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime()) ? String(iso).slice(0, 10) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const bandLabel = (n: number) => (n >= 70 ? 'High' : n >= 40 ? 'Medium' : 'Low')

export function LiveStudentView({ T, bundle, footnote, onSendMessage, onReact }: {
  T: StudentTheme; bundle: StudentBundle; footnote?: string
  /** Supplied by the portal only — the coach's preview is read-only. */
  onSendMessage?: (body: string, opts?: { toName?: string; replyTo?: string; campId?: string; channel?: string }) => Promise<void>
  /** Reacting is the family's, for the same reason. */
  onReact?: (id: string, reaction: string | null) => Promise<void>
}) {
  const [playing, setPlaying] = useState<StudentClip | null>(null)
  const { player, skills, lessons, clips, voiceNotes, watch, resources, sectionsOff, awardThreshold } = bundle
  const books = bundle.books || []
  const messages = bundle.messages || []

  const f = studentFraming(player)
  const off = sectionsOff || []

  // ── racket progression ────────────────────────────────────────────────────
  const foundIdx = RACKET_STAGES.findIndex(s => s.id === (player.racket_stage || ''))
  const stageIdx = foundIdx < 0 ? 0 : foundIdx
  const stage = RACKET_STAGES[stageIdx]
  const isTop = stageIdx >= RACKET_STAGES.length - 1
  const nextStage = RACKET_STAGES[Math.min(stageIdx + 1, RACKET_STAGES.length - 1)]
  const stageSkills = SKILLS_BY_STAGE[stage?.id || ''] || []
  const scoreOf = (name: string) => skills.find(s => s.skill === name)?.score ?? 0
  const remaining = stageSkills.filter(s => scoreOf(s) < awardThreshold).length
  const pct = stageSkills.length ? Math.round(((stageSkills.length - remaining) / stageSkills.length) * 100) : 0
  const hasRacket = !!player.racket_stage && stageSkills.length > 0
  const racketModule = !bundle.features || bundle.features.racket !== false

  // ── effort & session report ───────────────────────────────────────────────
  const latestWatch = watch.filter(w => !!w.started_at)[0] || null
  const xpTotal = player.xp_total ?? watch.reduce((a, w) => a + (w.xp_awarded || 0), 0)

  // ── homework / next focus ─────────────────────────────────────────────────
  const guidance = latestGuidance(lessons)

  // ── which modules this academy actually has ───────────────────────────────
  // Video and audio are one section on the page but two products, so they are
  // filtered here rather than left to the section gate: an academy with video
  // and no audio shows its clips and no voice notes.
  const feat = bundle.features || null
  const clipsOn = !feat || feat.video !== false
  const notesOn = !feat || feat.audio !== false

  // ── camp ──────────────────────────────────────────────────────────────────
  const camps = activeCamps(bundle.camps || [])

  // ── the next session ──────────────────────────────────────────────────────
  // Server-built: the booking, its venue and its plan, already resolved.
  const nextSession = bundle.nextSession || null

  // ── what is actually on ───────────────────────────────────────────────────
  const show = {
    nextsession: studentSectionOn('nextsession', off, !!nextSession, feat),
    camp: studentSectionOn('camp', off, camps.length > 0, feat),
    highlights: studentSectionOn('highlights', off, (clipsOn && clips.length > 0) || (notesOn && voiceNotes.length > 0), feat),
    report: studentSectionOn('report', off, !!latestWatch, feat),
    rewards: studentSectionOn('rewards', off, watch.length > 0 && xpTotal > 0, feat),
    racket: studentSectionOn('racket', off, hasRacket, feat),
    homework: studentSectionOn('homework', off, !!(guidance.homework || guidance.nextFocus), feat),
    lessons: studentSectionOn('lessons', off, lessons.length > 0, feat),
    resources: studentSectionOn('resources', off, resources.length > 0 || books.length > 0, feat),
    messages: studentSectionOn('messages', off, messages.length > 0 || !!onSendMessage, feat),
  }
  const anyBelowHeader = Object.values(show).some(Boolean)

  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: T.gap }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap, fontFamily: FONT }}>
      <style>{`.lsv-num{font-variant-numeric:tabular-nums}`}</style>

      {/* ── PROGRESS HEADER — always on, it is the page ───────────────────── */}
      <Card T={T} style={{ background: `linear-gradient(135deg, ${T.accentDim}, ${T.panel})`, borderColor: T.accentBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {player.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarSrc(player.avatar_url)} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', background: T.accentDim, color: T.accent, fontSize: 20, fontWeight: 800, fontFamily: MONO, flexShrink: 0 }}>{initialsOf(player.name)}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: T.text3 }}>{f.audience === 'junior' ? '👋 ' : ''}{f.greeting}</div>
            <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{f.possessive} progress</h1>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {!!(player.category || player.level) && <span>{[player.category, player.level].filter(Boolean).join(' · ')}</span>}
              {typeof player.age === 'number' && player.age > 0 && <span>Age {player.age}</span>}
              {hasRacket && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 18, height: 11, borderRadius: 3, background: stage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                  {/* "Blue racket" only means something at an academy that awards
                      rackets. Everywhere else it is simply the colour they are on. */}
                  {stage.name}{racketModule ? ' racket' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        {!!(player.goal || '').trim() && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, background: T.panel, border: `1px solid ${T.accentBorder}`, borderRadius: 14, padding: '10px 14px' }}>
            <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, flexShrink: 0 }}>Goal</span>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>🎯 {player.goal}</span>
          </div>
        )}
      </Card>

      {/* ── CAMP — first under the header. A booked camp is the biggest thing
           in a player's year; nothing else on the page outranks it. On from the
           moment they are booked, off when it finishes. ─────────────────── */}
      {show.camp && camps.map(c => <CampCard key={c.id} T={T} camp={c} first={f.first} />)}

      {/* ── NEXT SESSION — the thing they opened the app to check ──────────── */}
      {show.nextsession && nextSession && (
        <NextSessionCard T={T} next={nextSession} first={f.first} adult={f.audience === 'adult'} />
      )}

      {/* ── RECENT LESSONS — straight after the next session, because the two
           are one thought: what we just did, what we do next. ───────────── */}
      {show.lessons && (
        <Card T={T}>
          <Head T={T} icon="note" title="Recent lessons" sub="What you worked on, and your coach’s notes" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lessons.slice(0, 12).map(l => {
              const r = l.review_json || {}
              // The summary leads. It is the paragraph that actually gets read —
              // burying it under a takeaway quote made the page look like notes
              // rather than an answer to "how did it go?".
              const recap = lessonRecap({ ...l, player_name: player.name })
              const take = (r.takeaways || [])[0] || (l.summary || '').trim()
              return (
                <div key={l.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.focus || l.focus || 'Lesson'}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: MONO }}>{prettyDate(l.session_date)}{r.type ? ` · ${r.type}` : ''}</span>
                    {!!l.rating && <span style={{ display: 'flex', gap: 1 }}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: i < (l.rating || 0) ? T.accent : T.text4, fontSize: 12 }}>★</span>)}</span>}
                  </div>
                  {recap.source !== 'none' && (
                    <div style={{ fontSize: 12.5, color: T.text, marginTop: 8, lineHeight: 1.65 }}>{recap.text}</div>
                  )}
                  {!!take && take !== recap.text && <div style={{ fontSize: 12, color: T.text2, marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>“{take}”</div>}
                  {!!r.coachNote && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 6, fontStyle: 'italic', display: 'flex', gap: 6 }}>
                    <Icon name="megaphone" size={12} stroke={1.7} style={{ color: T.accent, flexShrink: 0, marginTop: 2 }} />Coach: {r.coachNote}
                  </div>}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── SESSION HIGHLIGHTS ─────────────────────────────────────────────── */}
      {show.highlights && (
        <Card T={T}>
          <Head T={T} icon="play" title={`${f.possessive} session highlights`} sub="Clips your coach saved from recent sessions" lead />
          {clipsOn && clips.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: T.gap }}>
              {clips.map(v => (
                <button key={v.id} onClick={() => setPlaying(v)} style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', padding: 0, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', background: T.panel, fontFamily: FONT }}>
                  <div style={{ position: 'relative', aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${T.accent}66, ${T.accent}18)` }}>
                    <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center' }}><Icon name="play" size={18} stroke={1.9} style={{ color: '#fff' }} /></span>
                    {!!v.duration_seconds && <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontFamily: MONO, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>{Math.round(v.duration_seconds)}s</span>}
                  </div>
                  <div style={{ padding: '9px 11px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title || v.shot_type || 'Highlight'}</div>
                    <div style={{ fontSize: 10.5, color: T.text3, marginTop: 1 }}>{prettyDate(v.created_at)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {notesOn && voiceNotes.length > 0 && (
            <div style={{ marginTop: clips.length ? T.gap : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Coach voice notes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {voiceNotes.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: T.accentDim, flexShrink: 0 }}><Icon name="mic" size={15} stroke={1.7} style={{ color: T.accent }} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{a.title || 'Voice note'}</div>
                      <div style={{ fontSize: 10.5, color: T.text3 }}>{prettyDate(a.created_at)}{a.duration_seconds ? ` · ${Math.round(a.duration_seconds / 60)} min` : ''}</div>
                    </div>
                    {!!a.url && <audio controls src={a.url} style={{ height: 30, maxWidth: 190 }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── SESSION REPORT ─────────────────────────────────────────────────── */}
      {show.report && !!latestWatch && (
        <Card T={T}>
          <Head T={T} icon="flame" title={`${f.possessive} session report`}
            sub={`Latest session · ${prettyDate(latestWatch.started_at)}${latestWatch.duration_min ? ` · ${latestWatch.duration_min} min` : ''}`} lead />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {typeof latestWatch.distance_m === 'number' && latestWatch.distance_m > 0 &&
              <Tile T={T} label="Distance" value={`${(latestWatch.distance_m / 1000).toFixed(1)} km`} sub="covered in session" color={T.accent} />}
            {!!latestWatch.duration_min && <Tile T={T} label="Time on court" value={latestWatch.duration_min} sub="minutes" />}
            {!!latestWatch.avg_hr && <Tile T={T} label="Avg heart rate" value={latestWatch.avg_hr} sub={latestWatch.max_hr ? `peak ${latestWatch.max_hr} bpm` : 'bpm'} />}
            {typeof latestWatch.effort_score === 'number' &&
              <Tile T={T} label="Effort" value={latestWatch.effort_score} sub={bandLabel(latestWatch.effort_score)}
                color={latestWatch.effort_score >= 70 ? T.good : latestWatch.effort_score >= 40 ? T.warn : T.bad} />}
          </div>
          <p style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, margin: '12px 0 0' }}>
            From {f.possessiveLower} own watch or a logged session — it never tracks court position{racketModule ? ', and it is separate from racket progression' : ''}.
          </p>
        </Card>
      )}

      {/* ── EFFORT & REWARDS ───────────────────────────────────────────────── */}
      {show.rewards && (
        <Card T={T}>
          <Head T={T} icon="trophy" title={`${f.possessive} effort rewards`} sub="XP earned from sessions" lead />
          <RewardsBlock T={T} xpTotal={xpTotal} sessions={watch.length} latest={latestWatch} />
        </Card>
      )}

      {/* ── RACKET PROGRESSION ─────────────────────────────────────────────── */}
      {show.racket && (
        <Card T={T}>
          <Head T={T} icon="trophy" title="Racket progression" sub="Earn the next racket by mastering every skill" />
          {!isTop ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: T.accentDim, border: `1px solid ${T.accentBorder}`, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 30 }}>🏆</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                  {remaining === 0
                    ? `${f.audience === 'adult' ? 'You are' : `${f.first} is`} ready for the ${nextStage.name} racket!`
                    : `${f.audience === 'adult' ? 'You are' : `${f.first} is`} ${remaining} skill${remaining === 1 ? '' : 's'} from the ${nextStage.name} racket`}
                </div>
                <div style={{ fontSize: 11.5, color: T.text2, marginTop: 2 }}>Master every {stage.name} skill to earn the next racket — and a certificate to keep.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 26, height: 16, borderRadius: 4, background: stage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                <Icon name="chevron-right" size={16} stroke={2} style={{ color: T.text3 }} />
                <span style={{ width: 26, height: 16, borderRadius: 4, background: nextStage.colour, border: '1px solid rgba(128,128,128,0.4)', opacity: 0.85 }} />
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', borderRadius: 14, background: T.accentDim, border: `1px solid ${T.accentBorder}`, fontSize: 14, fontWeight: 700, color: T.text }}>
              🏆 {f.audience === 'adult' ? 'You have' : `${f.first} has`} reached {stage.name} — the top racket.
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: T.text2, fontWeight: 600 }}>{stage.name} racket</span>
              <span className="lsv-num" style={{ fontSize: 11.5, color: T.accent, fontFamily: MONO, fontWeight: 700 }}>{pct}% mastered</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: T.hover, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: T.accent }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 5, marginTop: 14, flexWrap: 'wrap' }}>
            {RACKET_STAGES.map((b, bi) => {
              const state = bi < stageIdx ? 'done' : bi === stageIdx ? 'now' : 'next'
              return (
                <div key={b.id} style={{ flex: '1 1 64px', textAlign: 'center', opacity: state === 'next' ? 0.5 : 1 }}>
                  <div style={{ height: 16, borderRadius: 4, background: b.colour, border: `1px solid ${state === 'now' ? T.accent : 'rgba(128,128,128,0.4)'}`, boxShadow: state === 'now' ? `0 0 0 2px ${T.accentDim}` : 'none' }} />
                  <div style={{ fontSize: 9, color: state === 'now' ? T.accent : T.text3, fontWeight: state === 'now' ? 700 : 500, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                  {state === 'now' && <span style={{ fontSize: 8, fontWeight: 700, color: T.accent }}>NOW</span>}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {stageSkills.map(name => {
              const score = scoreOf(name)
              const done = score >= awardThreshold
              return (
                <div key={name}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{done ? '✅ ' : ''}{name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: done ? T.good : T.text3, fontFamily: MONO, fontWeight: 600 }}>{SKILL_LEVELS[score] || SKILL_LEVELS[0]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4].map(lv => <div key={lv} style={{ flex: 1, height: 5, borderRadius: 3, background: lv <= score ? (done ? T.good : T.accent) : T.hover }} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── HOMEWORK & WHAT'S NEXT ─────────────────────────────────────────── */}
      {show.homework && (
        <Card T={T}>
          <Head T={T} icon="home" title="Homework &amp; what’s next" sub="What to practise before the next session" />
          <div style={grid2}>
            {!!guidance.homework && (
              <div style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Practice at home</div>
                <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{guidance.homework}</div>
              </div>
            )}
            {!!guidance.nextFocus && (
              <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Next session focus</div>
                <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{guidance.nextFocus}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── RECOMMENDED RESOURCES ──────────────────────────────────────────── */}
      {show.resources && (
        <Card T={T}>
          <Head T={T} icon="newspaper" title={`Recommended for ${f.possessiveLower} level`} sub={hasRacket ? `Drills & guides matched to the ${stage.name} racket` : 'Drills and guides from your coach'} />

          {/* Books the coach chose for THIS player, not for everyone on this
              colour. They lead, because somebody picked them on purpose. */}
          {books.length > 0 && (
            <div style={{ marginBottom: resources.length ? T.gap + 4 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                {f.audience === 'adult' ? 'Your coach recommends you read' : `Your coach recommends for ${f.first}`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: T.gap }}>
                {books.map(b => (
                  <div key={b.id} style={{ display: 'flex', gap: 12, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ width: 42, height: 58, borderRadius: 3, flexShrink: 0, background: b.spine || T.accent, boxShadow: 'inset -6px 0 10px -8px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', padding: '5px 4px' }}>
                      <span style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.15 }}>{b.title}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{b.title}</div>
                      <div style={{ fontSize: 10.5, color: T.text3, marginTop: 1 }}>{[b.author, b.topic].filter(Boolean).join(' · ')}</div>
                      {!!b.note && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>“{b.note}”</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: T.gap }}>
            {resources.slice(0, 9).map(r => (
              <div key={r.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: T.accentDim, flexShrink: 0 }}>
                    <Icon name={r.format === 'Video' ? 'play' : 'note'} size={15} stroke={1.7} style={{ color: T.accent }} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{r.title}</div>
                    <div style={{ fontSize: 10, color: T.text3 }}>{[r.category, r.format].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
                {!!r.notes && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8, lineHeight: 1.45 }}>{r.notes}</div>}
                {!!r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11.5, fontWeight: 600, color: T.accent, textDecoration: 'none' }}>
                  {r.format === 'Video' ? 'Watch video →' : 'Open →'}
                </a>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── MESSAGES ──────────────────────────────────────────────────────── */}
      {/* A real conversation, not a notice board. The whole point of this
          section is that a parent messages their coach HERE rather than on
          WhatsApp at 10pm — so it has to feel like the thing they would
          otherwise open: the thread, oldest at the top, newest at the bottom,
          and the box to type in right under it. */}
      {show.messages && (
        <Card T={T}>
          <Head T={T} icon="megaphone" title={onSendMessage ? 'Messages' : 'Messages'}
            sub={onSendMessage ? 'Your conversation with the coaching team' : 'What has been said between you'} />
          <MessageThread T={T} messages={messages} adult={f.audience === 'adult'}
            coaches={bundle.coaches} campThreads={bundle.campThreads}
            onSend={onSendMessage} onReact={onReact} />
        </Card>
      )}

      {/* A page with a header and nothing under it needs to say why, or it reads
          as broken. This is the honest version of an empty state: one line, and
          only when there is genuinely nothing else. */}
      {!anyBelowHeader && (
        <Card T={T}>
          <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>
            {f.audience === 'adult'
              ? 'Your page fills up as the coaching starts — lesson summaries, what to practise, and racket progress all appear here after your next session.'
              : `${f.first}’s page fills up as the coaching starts — lesson summaries, what to practise at home, and racket progress all appear here after the next session.`}
          </div>
        </Card>
      )}

      {!!footnote && <div style={{ textAlign: 'center', fontSize: 10.5, color: T.text4, padding: '4px 0 8px' }}>{footnote}</div>}

      {/* ── clip player ────────────────────────────────────────────────────── */}
      {playing && (
        <div onClick={e => { if (e.target === e.currentTarget) setPlaying(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 16px' }}>
          <div style={{ width: '100%', maxWidth: 640, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
            {playing.url
              ? <video src={playing.url} controls autoPlay playsInline style={{ width: '100%', display: 'block', background: '#000' }} />
              : <div style={{ aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${T.accent}66, ${T.accent}18)`, color: T.text2, fontSize: 12.5 }}>
                  This clip is still being prepared.
                </div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>{playing.title || playing.shot_type || 'Highlight'}</div>
                <div style={{ fontSize: 11.5, color: T.text3 }}>{prettyDate(playing.created_at)}</div>
              </div>
              <button onClick={() => setPlaying(null)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 32, height: 32, fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── The conversation ────────────────────────────────────────────────────────
// A thread, in the order a thread runs: oldest at the top, newest at the bottom,
// composer underneath. It replaces a "latest 10, newest first" list, which read
// backwards and quietly hid everything older with no way to see it.
//
// The bleeding-text bug lived here. Message bodies carry calendar links, and a
// Google Calendar URL is roughly four hundred characters with no spaces in it.
// `white-space: pre-wrap` will not break a word that has nowhere to break, so
// the bubble grew past the card and off the screen. Two fixes, both needed:
// links are now rendered as short labels rather than raw addresses (see
// booking-notify.ts), and every text node below hard-wraps mid-word as a
// backstop — because the next long thing a coach pastes will not be a link.

const WRAP: React.CSSProperties = { overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g

/** Renders message text with links as short, tappable labels. A bare URL is
    shortened to its host so a pasted address can never dominate the bubble. */
function MessageBody({ T, text }: { T: StudentTheme; text: string }) {
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(LINK_RE.source, 'g')
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const label = m[1]
    const href = m[2] || m[3] || ''
    let shown = label
    if (!shown) {
      try { shown = new URL(href).hostname.replace(/^www\./, '') } catch { shown = 'Open link' }
    }
    out.push(
      <a key={`l${i++}`} href={href} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: '100%', color: T.accent, fontWeight: 700, textDecoration: 'none', borderBottom: `1px solid ${T.accentBorder}`, ...WRAP }}>
        {shown} ↗
      </a>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <span style={{ whiteSpace: 'pre-wrap', ...WRAP }}>{out}</span>
}

// ── The conversation ────────────────────────────────────────────────────────
// A player app that can only receive is a noticeboard. This is the part that
// decides whether a parent messages their coach HERE or on WhatsApp at ten at
// night, so it has to do what a messaging app does: answer a particular message,
// react to one, pick who you are writing to, and — on a camp — talk to everyone
// at once rather than to eight separate people.
//
// The three audiences are real, not cosmetic. "The academy" is the shared inbox
// whoever picks it up answers; a named coach routes to that coach; a camp thread
// is the families booked on and the coaches travelling. The server re-checks all
// three, so choosing one here is a statement of intent, never a permission.

const REACTIONS = ['👍', '❤️', '😄', '✅', '🎾', '🙌']

type SendOpts = { toName?: string; replyTo?: string; campId?: string; channel?: string }

// The sync writes "📎 filename" into the body so a photo-only message is not
// blank. Once the photo is on screen that line is noise, so the ones being
// rendered are dropped from the text.
function bodyWithoutPhotos(m: { body?: string | null; photos?: { name: string; url: string }[] }): string {
  const shown = new Set((m.photos ?? []).map(p => p.name))
  return String(m.body || '').split('\n')
    .filter(line => !(line.startsWith('\u{1F4CE} ') && shown.has(line.slice(2).trim())))
    .join('\n').trim()
}

function MessageThread({ T, messages, adult, coaches, campThreads, onSend, onReact }: {
  T: StudentTheme
  messages: StudentBundle['messages']
  adult: boolean
  coaches?: StudentBundle['coaches']
  campThreads?: StudentBundle['campThreads']
  onSend?: (body: string, opts?: SendOpts) => Promise<void>
  onReact?: (id: string, reaction: string | null) => Promise<void>
}) {
  const camps = campThreads || []
  const team = coaches || []
  // 'academy' | 'coach:<name>' | 'camp:<id>'
  const [audience, setAudience] = useState<string>('academy')
  const [showAll, setShowAll] = useState(false)
  const [reacting, setReacting] = useState<string | null>(null)
  const [reply, setReply] = useState<StudentBundle['messages'][number] | null>(null)
  const [draft, setDraft] = useState('')

  // Which Discord channel is showing inside a camp thread. null = all of them.
  // A camp server is several rooms — #general, #faqs, #important-info — and
  // running them together reads like a crossed line.
  const [chan, setChan] = useState<string | null>(null)
  const campId = audience.startsWith('camp:') ? audience.slice(5) : null
  const camp = campId ? camps.find(c => c.campId === campId) || null : null
  const toName = audience.startsWith('coach:') ? audience.slice(6) : undefined

  // Which messages belong to the tab you are looking at. The academy tab shows
  // the whole one-to-one thread — a family does not think of their coach and
  // "the academy" as two conversations, and splitting them would hide half the
  // history behind a name they did not pick.
  const source = camp ? camp.messages : (messages || []).filter(m => !m.camp_id)
  const campChannels = camp
    ? Array.from(new Set(camp.messages.map(m => m.channel).filter(Boolean) as string[])).sort()
    : []
  const inChannel = chan ? source.filter(m => m.channel === chan) : source
  const ordered = [...inChannel].sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')))
  const byId = new Map(ordered.map(m => [m.id, m]))
  const hidden = Math.max(0, ordered.length - 12)
  const shown = showAll ? ordered : ordered.slice(-12)

  const tabs: { id: string; label: string; sub?: string }[] = [
    { id: 'academy', label: 'Your coach' },
    ...team.slice(0, 6).map(c => ({ id: `coach:${c.name}`, label: c.name.split(/\s+/)[0], sub: c.role || 'Coach' })),
    ...camps.map(c => ({ id: `camp:${c.campId}`, label: c.name.length > 18 ? `${c.name.slice(0, 18)}…` : c.name, sub: c.people ? `${c.people} people` : 'Camp' })),
  ]

  const send = async () => {
    if (!onSend || !draft.trim()) return
    // The channel they are reading is the channel they are answering — a reply
    // typed under #faqs belongs in #faqs, not wherever the coach ticked first.
    await onSend(draft.trim(), { toName, replyTo: reply?.id, campId: campId || undefined, channel: (campId && chan) || undefined })
    setDraft(''); setReply(null)
  }

  const quote = (m: StudentBundle['messages'][number]) =>
    `> ${String(m.body || '').split('\n').slice(0, 3).join('\n> ').slice(0, 240)}\n\n`

  return (
    <>
      {/* Who you are writing to. Only shown when there is a choice to make. */}
      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
          {tabs.map(t => {
            const on = audience === t.id
            return (
              <button key={t.id} onClick={() => { setAudience(t.id); setReply(null); setShowAll(false); setChan(null) }}
                style={{ flex: '0 0 auto', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  background: on ? T.accentDim : T.panel2, border: `1px solid ${on ? T.accentBorder : T.border}`,
                  color: on ? T.accent : T.text2, borderRadius: 999, padding: '6px 13px' }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: on ? 700 : 500 }}>
                  {t.id.startsWith('camp:') ? '🎾 ' : ''}{t.label}
                </span>
                {!!t.sub && <span style={{ display: 'block', fontSize: 9.5, color: T.text3 }}>{t.sub}</span>}
              </button>
            )
          })}
        </div>
      )}

      {!!camp && (
        <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, marginBottom: 10 }}>
          Everyone on {camp.name} sees this — the players going and the coaches with them.
        </div>
      )}

      {campChannels.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}>
          {[null, ...campChannels].map(c => {
            const on = chan === c
            return (
              <button key={c ?? 'all'} onClick={() => { setChan(c); setShowAll(false) }}
                style={{ flex: '0 0 auto', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5,
                  fontWeight: on ? 700 : 500, borderRadius: 999, padding: '5px 12px',
                  background: on ? T.accentDim : T.panel2, border: `1px solid ${on ? T.accentBorder : T.border}`,
                  color: on ? T.accent : T.text2 }}>{c ? `#${c}` : 'All'}</button>
            )
          })}
        </div>
      )}

      {hidden > 0 && !showAll && (
        <button onClick={() => setShowAll(true)}
          style={{ appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, color: T.text2, borderRadius: 999, padding: '6px 14px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', alignSelf: 'center', margin: '0 auto 12px', display: 'block', fontFamily: 'inherit' }}>
          Show {hidden} earlier message{hidden === 1 ? '' : 's'}
        </button>
      )}

      {ordered.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.6, marginBottom: onSend ? 14 : 0 }}>
          {camp
            ? 'Nothing here yet. Say hello to everyone going — a question about kit, flights, or who is on which flight.'
            : onSend
              ? 'Nothing here yet. Anything at all — a question, an absence, a well done — send it below and it goes straight to your coach.'
              : 'No messages yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: onSend ? 14 : 0, maxHeight: showAll ? 'none' : 560, overflowY: showAll ? 'visible' : 'auto' }}>
          {shown.map(m => {
            const mine = m.direction === 'in'
            const parent = m.reply_to ? byId.get(m.reply_to) : null
            const open = reacting === m.id
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                <div onClick={() => setReacting(open ? null : m.id)}
                  style={{
                    maxWidth: '86%', boxSizing: 'border-box', cursor: 'pointer',
                    background: mine ? T.accentDim : T.panel2,
                    border: `1px solid ${mine ? T.accentBorder : T.border}`,
                    borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
                    padding: '10px 13px', ...WRAP,
                  }}>
                  {/* What this answers, so a reply still makes sense a week later. */}
                  {!!parent && (
                    <div style={{ borderLeft: `2px solid ${T.accentBorder}`, paddingLeft: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: T.accent, fontWeight: 700 }}>{parent.direction === 'in' ? 'You' : (parent.from_name || 'Coach')}</div>
                      <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.45, ...WRAP }}>
                        {String(parent.body || '').slice(0, 120)}{String(parent.body || '').length > 120 ? '…' : ''}
                      </div>
                    </div>
                  )}
                  {!!m.subject && <div style={{ fontSize: 11, fontWeight: 700, color: T.text2, marginBottom: 4, ...WRAP }}>{m.subject}</div>}
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, ...WRAP }}>
                    <MessageBody T={T} text={bodyWithoutPhotos(m)} />
                  </div>
                  {!!m.photos?.length && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {m.photos.map(ph => (
                        <a key={ph.url} href={ph.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ph.url} alt={ph.name}
                            style={{ maxWidth: 220, maxHeight: 200, borderRadius: 10, border: `1px solid ${T.border}`, display: 'block', objectFit: 'cover' }} />
                        </a>
                      ))}
                    </div>
                  )}
                  {!!m.channel && <div style={{ fontSize: 9.5, color: T.text3, marginTop: 6 }}>#{m.channel}</div>}
                  {!!m.reaction && (
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1 }}>{m.reaction}</div>
                  )}
                </div>

                {/* Tap a message to react, reply or pass it on. Hidden until then,
                    because a row of icons under every bubble is noise. */}
                {open && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', margin: '6px 2px 0', justifyContent: mine ? 'flex-end' : 'flex-start', opacity: onSend ? 1 : 0.55, pointerEvents: onSend ? 'auto' : 'none' }}>
                    {REACTIONS.map(e => (
                      <button key={e} onClick={() => { onReact?.(m.id, m.reaction === e ? null : e); setReacting(null) }}
                        style={{ appearance: 'none', cursor: 'pointer', border: `1px solid ${m.reaction === e ? T.accent : 'transparent'}`, background: m.reaction === e ? T.accentDim : T.panel2, borderRadius: 8, padding: '3px 6px', fontSize: 14, lineHeight: 1 }}>
                        {e}
                      </button>
                    ))}
                    <button onClick={() => { setReply(m); setReacting(null) }}
                      style={{ appearance: 'none', cursor: 'pointer', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                      ↩ Reply
                    </button>
                    <button onClick={() => { setDraft(quote(m)); setReacting(null); if (tabs.length > 1) setAudience(camps.length ? `camp:${camps[0].campId}` : 'academy') }}
                      style={{ appearance: 'none', cursor: 'pointer', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                      ↪ Forward
                    </button>
                  </div>
                )}

                <div style={{ fontSize: 9.5, color: T.text3, margin: '4px 4px 0' }}>
                  {mine ? 'You' : (m.from_name || 'Coach')}
                  {!!m.to_name && mine ? ` → ${m.to_name}` : ''} · {prettyDate(m.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!!onSend && (
        <MessageComposer
          T={T} value={draft} onChange={setDraft} onSend={send}
          reply={reply} onCancelReply={() => setReply(null)}
          to={camp ? `everyone on ${camp.name}` : toName ? toName : 'your coach'} />
      )}

      {/* ── The coach's preview ──────────────────────────────────────────────
          A preview that hides the box, the emoji button and the send button
          does not show the coach what the player can do — which is the only
          reason to look at this page. So the whole composer is drawn, and it is
          dead on purpose: sending from here would post a message AS the player,
          and a coach writing to themselves in a parent's name is not a feature.
          Reply, forward and reactions work the same way — visible, inert. */}
      {!onSend && (
        <>
          <div style={{ opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }} aria-hidden>
            <textarea readOnly value="" rows={3}
              placeholder={camp ? `Message everyone on ${camp.name}…` : 'Message your coach…'}
              style={{ width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, padding: '10px 12px', fontSize: 13, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 11px', fontSize: 15, lineHeight: 1 }}>🙂</span>
              <span style={{ background: T.accent, color: T.btnText, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700 }}>Send</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.text3, marginTop: 10, lineHeight: 1.55 }}>
            This is their side of it. {adult ? 'They' : 'The parent'} can type here, tap a message to react, reply or forward it, and pick which coach — or the camp — they are writing to.
            You can&rsquo;t send from the preview, because it would go out in their name; reply from your own Messages page instead.
          </div>
        </>
      )}
    </>
  )
}

function MessageComposer({ T, value, onChange, onSend, reply, onCancelReply, to }: {
  T: StudentTheme
  value: string
  onChange: (v: string) => void
  onSend: () => Promise<void>
  reply: StudentBundle['messages'][number] | null
  onCancelReply: () => void
  to: string
}) {
  const [state, setState] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const send = async () => {
    if (!value.trim()) return
    setState('Sending…')
    try { await onSend(); setState('✓ Sent') } catch { setState('Could not send') }
  }
  return (
    <>
      {!!reply && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.panel2, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.accent}`, borderRadius: 10, padding: '8px 11px', marginBottom: 8 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 10, color: T.accent, fontWeight: 700 }}>Replying to {reply.direction === 'in' ? 'yourself' : (reply.from_name || 'your coach')}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(reply.body || '').slice(0, 90)}</span>
          </span>
          <button onClick={onCancelReply} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 15 }}>×</button>
        </div>
      )}
      <textarea value={value} onChange={e => { onChange(e.target.value); setState('') }} rows={3}
        placeholder={`Message ${to}…`}
        style={{ width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
      {emojiOpen && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {['👍', '❤️', '😄', '🎾', '🙌', '💪', '🔥', '😅', '🙏', '👏', '⏰', '🚗'].map(e => (
            <button key={e} onClick={() => onChange(value + e)}
              style={{ appearance: 'none', cursor: 'pointer', border: `1px solid ${T.border}`, background: T.panel2, borderRadius: 8, padding: '4px 7px', fontSize: 15, lineHeight: 1 }}>{e}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <button onClick={() => setEmojiOpen(o => !o)} title="Add an emoji"
          style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', borderRadius: 10, padding: '8px 11px', fontSize: 15, cursor: 'pointer', lineHeight: 1 }}>🙂</button>
        <button onClick={send} disabled={!value.trim()}
          style={{ appearance: 'none', border: 0, background: T.accent, color: T.btnText, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: value.trim() ? 'pointer' : 'not-allowed', opacity: value.trim() ? 1 : 0.5, fontFamily: 'inherit' }}>Send</button>
        {!!state && <span style={{ fontSize: 11.5, color: state.startsWith('✓') ? T.good : T.text3 }}>{state}</span>}
      </div>
    </>
  )
}

// ── Effort & rewards ────────────────────────────────────────────────────────
// Levels are derived here rather than imported so this file stays usable from
// the parent portal without pulling the coach portal's data layer in behind it.
const LEVELS = [
  { name: 'Rookie', min: 0 }, { name: 'Mover', min: 500 }, { name: 'Grinder', min: 1500 },
  { name: 'Athlete', min: 3500 }, { name: 'Machine', min: 7000 },
]

function RewardsBlock({ T, xpTotal, sessions, latest }: {
  T: StudentTheme; xpTotal: number; sessions: number; latest: StudentWatchSession | null
}) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (xpTotal >= LEVELS[i].min) idx = i
  const cur = LEVELS[idx], next = LEVELS[idx + 1]
  const span = next ? next.min - cur.min : 1
  const pct = next ? Math.min(100, Math.round(((xpTotal - cur.min) / span) * 100)) : 100
  const tone = (n: number) => (n >= 70 ? T.good : n >= 40 ? T.warn : T.bad)
  const scores: [string, number | null | undefined][] = [
    ['Effort', latest?.effort_score], ['Movement', latest?.movement_score], ['Consistency', latest?.consistency_score],
  ]
  const shown = scores.filter(([, n]) => typeof n === 'number') as [string, number][]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: shown.length ? 14 : 0 }}>
        <div style={{ minWidth: 110 }}>
          <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total XP</div>
          <div className="lsv-num" style={{ fontSize: 32, fontWeight: 800, color: T.accent, lineHeight: 1.1 }}>{xpTotal.toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: T.text2, fontWeight: 700 }}>🏅 Level {idx + 1} · {cur.name}</span>
            <span style={{ color: T.text3 }}>{next ? `Next: ${next.name}` : 'Max level'}</span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: T.hover, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            <div style={{ width: `${pct}%`, height: '100%', background: T.accent }} />
          </div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 5 }}>
            {next ? `${(next.min - xpTotal).toLocaleString()} XP to ${next.name}` : 'Top level reached'} · {sessions} session{sessions === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      {shown.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
          {shown.map(([l, n]) => (
            <div key={l} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '11px 13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: tone(n) }}>{bandLabel(n)}</span>
              </div>
              <div className="lsv-num" style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 2 }}>{n}<span style={{ fontSize: 11, color: T.text3 }}>/100</span></div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── The next session ────────────────────────────────────────────────────────
// Directly under the header, because on a Tuesday night this is the only thing
// anybody opens the app for: when is it, where is it, what are we doing.
//
// The confirmation email said all of this once. This is the copy that stays —
// with a map link, because "Court 3" has never got anyone to a tennis club, and
// with the coach's plan, so a player turns up knowing what the session is for
// rather than finding out in the first ten minutes.
function NextSessionCard({ T, next, first, adult }: {
  T: StudentTheme; next: StudentNextSession; first: string; adult: boolean
}) {
  const days = daysUntil(next.date)
  const when = days === null ? ''
    : days > 6 ? `In ${days} days`
    : days > 1 ? `In ${days} days`
    : days === 1 ? 'Tomorrow'
    : days === 0 ? 'Today'
    : ''
  const soon = days !== null && days <= 1

  const dayName = (() => {
    if (!next.date) return ''
    const d = new Date(`${next.date}T00:00:00`)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { weekday: 'long' })
  })()

  const ends = (() => {
    if (!next.start_time || !next.duration_min) return ''
    const [h, m] = next.start_time.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return ''
    const t = h * 60 + m + next.duration_min
    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  })()

  const map = venueMapUrl(next.venue)
  const where = [next.venue?.name, next.court].filter(Boolean).join(' · ')
  const plan = next.plan
  const pending = (next.status || '').toLowerCase() === 'pending'

  return (
    <Card T={T} style={{ borderColor: T.accentBorder }}>
      <Head T={T} icon="calendar" title={adult ? 'Your next session' : `${first}’s next session`}
        sub={pending ? 'Awaiting confirmation from your coach' : 'Booked in'} lead />

      {/* When */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 16px', borderRadius: 14, background: `linear-gradient(135deg, ${T.accentDim}, ${T.panel2})`, border: `1px solid ${T.accentBorder}`, marginBottom: T.gap }}>
        <div style={{ minWidth: 0 }}>
          {!!when && (
            <div style={{ fontSize: 10, fontWeight: 700, color: soon ? T.good : T.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{when}</div>
          )}
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginTop: 3, lineHeight: 1.2 }}>
            {[dayName, prettyDate(next.date)].filter(Boolean).join(' ')}
          </div>
          <div style={{ fontSize: 13.5, color: T.text2, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {!!next.start_time && (
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: T.text }}>
                {next.start_time}{ends ? `–${ends}` : ''}
              </span>
            )}
            {!!next.duration_min && <span style={{ fontSize: 12, color: T.text3 }}>{next.duration_min} min</span>}
            {!!next.type && (
              <span style={{ fontSize: 10.5, fontWeight: 700, color: T.accent, background: T.accentDim, border: `1px solid ${T.accentBorder}`, padding: '2px 8px', borderRadius: 999 }}>{next.type}</span>
            )}
          </div>
        </div>
        {!!next.coach && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>With</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{next.coach}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: T.gap }}>
        {/* Where */}
        {(!!where || !!next.venue?.address) && (
          <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>Where</div>
            {!!where && <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{where}</div>}
            {!!next.venue?.address && <div style={{ fontSize: 12.5, color: T.text2, marginTop: 3, lineHeight: 1.55 }}>{next.venue.address}</div>}
            {!!next.venue?.access_note && (
              <div style={{ fontSize: 12, color: T.text2, marginTop: 8, lineHeight: 1.55, borderLeft: `2px solid ${T.accentBorder}`, paddingLeft: 9 }}>
                {next.venue.access_note}
              </div>
            )}
            {map && (
              <a href={map} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: T.accent, color: T.btnText, borderRadius: 10, padding: '8px 13px', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                📍 Open in Maps
              </a>
            )}
          </div>
        )}

        {/* What we'll cover — the headline, and nothing else.
            A player wants to know what the session is FOR. The phase-by-phase
            run-sheet is the coach's working document; printing it here turned a
            one-line answer into a wall of text nobody read. */}
        {!!plan && !!(plan.focus || plan.title) && (
          <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>
              {adult ? 'What you\u2019ll cover' : 'What you\u2019ll be working on'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{plan.focus || plan.title}</div>
          </div>
        )}
      </div>

      {!plan && (
        <div style={{ fontSize: 12, color: T.text3, marginTop: T.gap, lineHeight: 1.55 }}>
          Your coach hasn&rsquo;t published the plan for this one yet — it&rsquo;ll appear here once they do.
        </div>
      )}
    </Card>
  )
}

// ── The camp module ─────────────────────────────────────────────────────────
// Booked, not browsing: this only ever renders for a camp the player has a place
// on, so it answers the questions a family actually has once the place is taken.
//
// It used to answer them in three grey boxes. But a camp is the thing a child
// counts down to — the one part of this app they will open for no reason, just
// to look at it again — and a folded list of bullet points is not what that
// feels like. So: a live countdown to the minute, and the rest of the week
// behind tabs, so the page is short until they choose to dig.
//
// Everything here is still only what the coach actually filled in. A tab with
// nothing behind it does not appear — an empty "Where you're staying" heading
// tells a parent their coach has not sorted the hotel, which may be true and is
// not this page's job to imply.

type TripLike = {
  intro?: string
  stay?: Record<string, string | undefined>
  venue?: Record<string, string | undefined>
  travel?: Record<string, string | undefined>
  practical?: Record<string, string | undefined>
  transport?: { name?: string; kind?: string; address?: string; phone?: string; url?: string; note?: string }[]
  eating?: { name?: string; kind?: string; address?: string; phone?: string; url?: string; note?: string }[]
  contacts?: { name?: string; role?: string; phone?: string; note?: string }[]
  bring?: string[]
  sections?: { title?: string; body?: string; items?: string[] }[]
}

/** A day of the camp, however the coach's itinerary happens to be shaped. */
type CampDayRow = { label: string; date?: string; focus?: string; detail?: string }

function campDays(v: unknown): CampDayRow[] {
  if (!Array.isArray(v)) return []
  return v.map((x, i) => {
    if (typeof x === 'string') return { label: `Day ${i + 1}`, focus: x }
    if (!x || typeof x !== 'object') return null
    const o = x as Record<string, unknown>
    const str = (k: string) => { const s = String(o[k] ?? '').trim(); return s || undefined }
    const label = str('day') || str('title') || `Day ${i + 1}`
    const focus = str('focus') || str('theme') || str('label') || str('name')
    const detail = [str('did'), str('detail'), str('description'), str('nextAction')].filter(Boolean).join(' ')
    if (!focus && !detail && !str('date')) return null
    return { label: /^\d+$/.test(label) ? `Day ${label}` : label, date: str('date'), focus, detail: detail || undefined }
  }).filter(Boolean) as CampDayRow[]
}

/** This player's own targets for the week, already filtered to them by the API. */
function campTargets(v: unknown): { goals: string[]; measure?: string; stage?: string } {
  const row = Array.isArray(v) ? (v[0] as Record<string, unknown> | undefined) : undefined
  if (!row) return { goals: [] }
  return {
    goals: asStringList(row.goals),
    measure: String(row.measure ?? '').trim() || undefined,
    stage: String(row.stage ?? '').trim() || undefined,
  }
}

const mapsUrl = (q?: string) => q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
const telUrl = (p?: string) => p ? `tel:${p.replace(/[^\d+]/g, '')}` : null
const webUrl = (u?: string) => !u ? null : /^https?:\/\//i.test(u) ? u : `https://${u}`

/** Fields → visible rows, dropping the empty ones, in the coach's own words. */
const rowsOf = (o: Record<string, string | undefined> | undefined, map: [string, string][]) =>
  (map.map(([k, label]) => { const v = String(o?.[k] ?? '').trim(); return v ? { label, value: v } : null }).filter(Boolean) as { label: string; value: string }[])

function CampCard({ T, camp, first }: { T: StudentTheme; camp: StudentCamp; first: string }) {
  const days = daysUntil(camp.start_date)
  const started = days !== null && days <= 0
  const adultCamp = (camp.audience || '').toLowerCase() === 'adult'
  const you = adultCamp ? 'you' : first

  // camp.equipment is the COACH's kit list — 360 balls, ball baskets, a first
  // aid kit, the stringing machine. It is what the academy packs, not what a
  // family packs, and merging the two produced a "what to bring" telling a
  // parent to bring twelve ball baskets. The family's list is the trip hub's
  // own "What to bring" and nothing else.
  const rhythm = asStringList(camp.daily_rhythm)
  const brief = asStringList(camp.parent_brief)
  const itinerary = campDays(camp.itinerary)
  const objectives = asStringList(camp.objectives)
  const targets = campTargets(camp.player_targets)
  const trip = (camp.trip && typeof camp.trip === 'object' ? camp.trip : {}) as TripLike

  const stay = rowsOf(trip.stay, [['checkIn', 'Check-in'], ['rooms', 'Rooms'], ['meals', 'Meals'], ['wifi', 'Wi-Fi'], ['notes', 'Also']])
  const venue = rowsOf(trip.venue, [['courts', 'Courts'], ['facilities', 'Facilities'], ['notes', 'Also']])
  const travel = rowsOf(trip.travel, [['airport', 'Airport'], ['flights', 'Flights'], ['transfers', 'Transfers'], ['arrival', 'Getting there'], ['departure', 'Coming home'], ['notes', 'Also']])
  const practical = rowsOf(trip.practical, [['weather', 'Weather'], ['currency', 'Currency'], ['timeDifference', 'Time difference'], ['plugs', 'Plugs'], ['health', 'Health'], ['notes', 'Also']])
  const eating = (trip.eating || []).filter(p => String(p?.name || '').trim())
  const transport = (trip.transport || []).filter(p => String(p?.name || '').trim())
  const contacts = (trip.contacts || []).filter(c => String(c?.name || '').trim())
  const bring = asStringList(trip.bring)
  // "Shape of the week" is the same subject as the itinerary and the daily
  // rhythm: how the days run. As its own tab it split one answer across two
  // places and left the main tab reading like a bare timetable — so its copy is
  // folded into The week, where somebody looking for it actually is, and it
  // stops being a tab of its own.
  const allSections = (trip.sections || []).filter(s => String(s?.title || '').trim())
  const isShape = (t: unknown) => /shape of (the )?week|how the (week|days) (run|work)/i.test(String(t || ''))
  const shape = allSections.find(s => isShape(s.title)) || null
  const extras = allSections.filter(s => !isShape(s.title))
  const shapeBody = String(shape?.body || '').trim()
  const shapeItems = asStringList(shape?.items)

  // The rhythm lines and the shape paragraph are usually the SAME sentences —
  // the coach writes "mornings on court, lunch, back out at four" once and both
  // fields end up holding it. Printing both produced three boxes that repeated
  // the paragraph above them, cut mid-sentence. So a line only earns a box if it
  // reads like a timetable entry (it names a time or a part of the day) and is
  // not already sitting in the paragraph.
  const inBody = (x: string) => {
    const a = x.trim().toLowerCase().replace(/[.,;:]+$/, '')
    return a.length > 12 && shapeBody.toLowerCase().includes(a.slice(0, Math.min(40, a.length)))
  }
  const looksLikeTime = (x: string) =>
    /^\s*(\d{1,2}[:.]\d{2}|\d{1,2}\s*(am|pm)|morning|afternoon|evening|night|breakfast|lunch|dinner|day\s*\d)/i.test(x)
  const timetable = [...shapeItems, ...rhythm]
    .map(x => String(x).trim())
    .filter(Boolean)
    .filter(x => looksLikeTime(x) && !inBody(x))
    .filter((x, i, all) => all.findIndex(y => y.toLowerCase() === x.toLowerCase()) === i)
    .slice(0, 12)

  const goalsTab = targets.goals.length > 0 || !!camp.camp_goal || objectives.length > 0
  const weekTab = itinerary.length > 0 || rhythm.length > 0 || !!shapeBody || shapeItems.length > 0
  const stayTab = stay.length > 0 || venue.length > 0 || !!trip.stay?.name || !!trip.venue?.name || !!camp.room
  const travelTab = travel.length > 0 || !!camp.arrival
  const aboutTab = eating.length > 0 || transport.length > 0 || practical.length > 0
  const bringTab = bring.length > 0 || brief.length > 0
  const callTab = contacts.length > 0

  const TABS: { id: string; label: string; icon: string; on: boolean }[] = [
    { id: 'week', label: 'The week', icon: 'calendar', on: weekTab },
    { id: 'goals', label: adultCamp ? 'Your goals' : 'Goals', icon: 'flag', on: goalsTab },
    { id: 'bring', label: 'What to bring', icon: 'check', on: bringTab },
    { id: 'travel', label: 'Getting there', icon: 'plane', on: travelTab },
    { id: 'stay', label: 'Where you stay', icon: 'pin', on: stayTab },
    { id: 'about', label: 'Out & about', icon: 'globe', on: aboutTab },
    { id: 'call', label: 'Who to ring', icon: 'people', on: callTab },
    ...extras.map((s, i) => ({ id: `x${i}`, label: String(s.title).slice(0, 22), icon: 'note', on: true })),
  ].filter(t => t.on)

  const [tab, setTab] = useState(TABS[0]?.id || '')
  const active = TABS.some(t => t.id === tab) ? tab : (TABS[0]?.id || '')

  return (
    <Card T={T} style={{ borderColor: T.accentBorder, overflow: 'hidden' }}>
      <Head T={T} icon="sun" title={camp.name}
        sub={[camp.location, camp.region].filter(Boolean).join(' · ') || (camp.overseas ? 'Overseas camp' : 'Camp')} lead />

      <Countdown T={T} camp={camp} started={started} days={days} you={you} />

      {!!(camp.intent || camp.description || '').trim() && (
        <p style={{ fontSize: 13.5, color: T.text2, lineHeight: 1.65, margin: '0 0 14px' }}>{camp.intent || camp.description}</p>
      )}
      {!!(trip.intro || '').trim() && (
        <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.65, margin: '0 0 14px' }}>{trip.intro}</p>
      )}

      {camp.status === 'pending' && !!camp.balance_link && (
        <a href={camp.balance_link} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', background: T.accent, color: T.btnText, borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', marginBottom: 14 }}>
          Pay the balance →
        </a>
      )}

      {TABS.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, WebkitOverflowScrolling: 'touch' }}>
            {TABS.map(t => {
              const on = active === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '8px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: on ? 700 : 600, color: on ? T.btnText : T.text2, background: on ? T.accent : T.panel2, border: `1px solid ${on ? T.accent : T.border}` }}>
                  <Icon name={t.icon} size={13} stroke={1.8} style={{ color: on ? T.btnText : T.text3 }} />
                  {t.label}
                </button>
              )
            })}
          </div>

          {active === 'week' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* How the days run, first — the question everyone asks before
                  they read a single day: what is a day here actually like? */}
              {(!!shapeBody || timetable.length > 0) && (
                <div style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, borderLeft: `3px solid ${T.accent}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 800, marginBottom: 7 }}>How the days run</div>
                  {!!shapeBody && (
                    <p style={{ fontSize: 13.5, color: T.text, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{shapeBody}</p>
                  )}
                  {timetable.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: shapeBody ? 12 : 0 }}>
                      {timetable.map((x, i) => {
                        // "09:30 Morning session — groups on court 3" splits into a
                        // time and the thing itself, which is how a timetable should
                        // read. Anything without a time is simply a line.
                        const m = String(x).match(/^\s*([0-9]{1,2}[:.][0-9]{2}\s*(?:–|-|to)?\s*(?:[0-9]{1,2}[:.][0-9]{2})?|morning|afternoon|evening|night)\b[\s—–:-]*(.*)$/i)
                        const when = m?.[1] ? m[1].trim() : ''
                        const what = m?.[2]?.trim() || String(x).trim()
                        return (
                          <div key={i} style={{ display: 'flex', gap: 10, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 11px' }}>
                            {!!when && (
                              <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: T.accent, textTransform: 'capitalize', minWidth: 46 }}>{when}</span>
                            )}
                            <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>{what}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {itinerary.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 800, marginBottom: 9 }}>Day by day</div>
                  {itinerary.map((d, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: i === itinerary.length - 1 ? 0 : 14 }}>
                      {/* A week is a sequence, so it is drawn as one. */}
                      {i < itinerary.length - 1 && (
                        <span style={{ position: 'absolute', left: 17, top: 34, bottom: 0, width: 2, background: T.border }} />
                      )}
                      <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: T.accentDim, border: `1px solid ${T.accentBorder}`, color: T.accent, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, zIndex: 1 }}>
                        {String(d.label || '').replace(/[^0-9]/g, '') || i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                          {d.focus && <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>{d.focus}</div>}
                          {d.date && <div style={{ fontSize: 10.5, color: T.text3, marginLeft: 'auto' }}>{prettyDate(d.date).replace(/ \d{4}$/, '')}</div>}
                        </div>
                        {d.detail && <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.65, marginTop: 4 }}>{d.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === 'goals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!!camp.camp_goal && (
                <div style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, borderRadius: 12, padding: '13px 15px' }}>
                  <div style={{ fontSize: 10, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>
                    {adultCamp ? 'Your week, in one line' : `${first}’s week, in one line`}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text, lineHeight: 1.45 }}>{camp.camp_goal}</div>
                </div>
              )}
              {targets.goals.length > 0 && (
                <Box T={T} icon="🎯" tone="accent" title={adultCamp ? 'What you’re working on' : `What ${first} is working on`}>
                  <Bullets T={T} items={targets.goals} marker="number" />
                  {targets.measure && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 11, paddingTop: 10, borderTop: `1px solid ${T.accentBorder}` }}>
                      <span style={{ fontSize: 12, flexShrink: 0 }}>✅</span>
                      <span style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.55 }}>
                        <strong style={{ color: T.text }}>How we&rsquo;ll know:</strong> {targets.measure}
                      </span>
                    </div>
                  )}
                </Box>
              )}
              {objectives.length > 0 && (
                <Box T={T} icon="🏅" tone="good" title="What everyone leaves with">
                  <Bullets T={T} items={objectives} marker="tick" tone="good" />
                </Box>
              )}
            </div>
          )}

          {active === 'bring' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: T.gap }}>
              {bring.length > 0 && (
                <Box T={T} icon="🎒" tone="accent" title="In the bag">
                  <Bullets T={T} items={bring} marker="tick" />
                  <div style={{ fontSize: 11, color: T.text3, marginTop: 10, lineHeight: 1.5 }}>
                    Your coach&rsquo;s own kit — balls, first aid, everything for the courts — is packed separately. This is just yours.
                  </div>
                </Box>
              )}
              {brief.length > 0 && (
                <Box T={T} icon="📋" tone="warn" title={adultCamp ? 'Before you come' : 'For parents'}>
                  <Bullets T={T} items={brief} tone="warn" />
                </Box>
              )}
            </div>
          )}

          {active === 'travel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!!camp.arrival && (
                <div style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 3 }}>Your arrival</div>
                  <div style={{ fontSize: 13.5, color: T.text, fontWeight: 600 }}>{camp.arrival}</div>
                </div>
              )}
              {travel.length > 0 && <Box T={T} icon="✈️" title="Flights & transfers"><Facts T={T} rows={travel} /></Box>}
              {!!trip.travel?.airport && (
                <MapLink T={T} label={`Map — ${trip.travel.airport} to ${trip.stay?.name || camp.location || 'the hotel'}`}
                  href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.travel.airport)}&destination=${encodeURIComponent(trip.stay?.address || trip.stay?.name || [camp.location, camp.region].filter(Boolean).join(', '))}`} />
              )}
            </div>
          )}

          {active === 'stay' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!!camp.room && (
                <div style={{ background: T.accentDim, border: `1px solid ${T.accentBorder}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 3 }}>Your room</div>
                  <div style={{ fontSize: 13.5, color: T.text, fontWeight: 600 }}>{camp.room}</div>
                </div>
              )}
              {(!!trip.stay?.name || stay.length > 0) && (
                <Box T={T} icon="🏨" tone="accent" title={trip.stay?.name || 'Where you’re staying'}>
                  {!!trip.stay?.address && <div style={{ fontSize: 12.5, color: T.text2, marginBottom: 8 }}>{trip.stay.address}</div>}
                  <Facts T={T} rows={stay} />
                  <Links T={T} map={mapsUrl(trip.stay?.address || trip.stay?.name)} web={webUrl(trip.stay?.url)} />
                </Box>
              )}
              {(!!trip.venue?.name || venue.length > 0) && (
                <Box T={T} icon="🎾" title={trip.venue?.name || 'Where you play'}>
                  {!!trip.venue?.address && <div style={{ fontSize: 12.5, color: T.text2, marginBottom: 8 }}>{trip.venue.address}</div>}
                  <Facts T={T} rows={venue} />
                  <Links T={T} map={mapsUrl(trip.venue?.address || trip.venue?.name)} web={webUrl(trip.venue?.url)} />
                </Box>
              )}
            </div>
          )}

          {active === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eating.length > 0 && (
                <Box T={T} icon="🍽️" title="Where we eat">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                    {eating.map((p, i) => <PlaceCard key={i} T={T} p={p} />)}
                  </div>
                </Box>
              )}
              {transport.length > 0 && (
                <Box T={T} icon="🚕" title="Taxis & getting about">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                    {transport.map((p, i) => <PlaceCard key={i} T={T} p={p} />)}
                  </div>
                </Box>
              )}
              {practical.length > 0 && <Box T={T} icon="💡" title="Good to know"><Facts T={T} rows={practical} /></Box>}
            </div>
          )}

          {active === 'call' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{c.name}</div>
                  {!!c.role && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 1 }}>{c.role}</div>}
                  {!!c.note && <div style={{ fontSize: 12, color: T.text2, marginTop: 6, lineHeight: 1.55 }}>{c.note}</div>}
                  {!!c.phone && (
                    <a href={telUrl(c.phone) || '#'} style={{ display: 'inline-block', marginTop: 9, fontSize: 12.5, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>
                      📞 {c.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {extras.map((s, i) => active === `x${i}` && (
            <div key={i}>
              {!!s.body && <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.65, margin: '0 0 8px' }}>{s.body}</p>}
              {!!(s.items || []).length && <Box T={T} icon="📌" title={String(s.title)}><Bullets T={T} items={asStringList(s.items)} /></Box>}
            </div>
          ))}
        </>
      )}
    </Card>
  )
}

// The countdown. Ticking, because a number that moves while you look at it is
// the entire point — a static "in 34 days" is a fact, a clock is anticipation.
// It stops counting the moment the camp starts and switches to which day of it
// today is, which is the only thing anyone wants from it once they are there.
function Countdown({ T, camp, started, days, you }: {
  T: StudentTheme; camp: StudentCamp; started: boolean; days: number | null; you: string
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (started || days === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [started, days])

  const startMs = camp.start_date ? new Date(`${String(camp.start_date).slice(0, 10)}T09:00:00`).getTime() : NaN
  const left = Math.max(0, Math.floor((startMs - now) / 1000))
  const dd = Math.floor(left / 86400), hh = Math.floor((left % 86400) / 3600)
  const mm = Math.floor((left % 3600) / 60), ss = left % 60

  // How far through the camp today is, once it has started.
  const total = (() => {
    if (!camp.start_date || !camp.end_date) return 1
    const a = new Date(`${String(camp.start_date).slice(0, 10)}T00:00:00`).getTime()
    const b = new Date(`${String(camp.end_date).slice(0, 10)}T00:00:00`).getTime()
    return Math.max(1, Math.round((b - a) / 86400000) + 1)
  })()
  const dayNo = days === null ? 1 : Math.min(total, Math.max(1, 1 - days))

  const dates = camp.start_date
    ? `${prettyDate(camp.start_date)}${camp.end_date && camp.end_date !== camp.start_date ? ` – ${prettyDate(camp.end_date)}` : ''}`
    : ''

  const unit = (n: number, label: string) => (
    <div style={{ textAlign: 'center', minWidth: 54 }}>
      <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: T.text, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{String(n).padStart(2, '0')}</div>
      <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>{label}</div>
    </div>
  )

  return (
    <div style={{ borderRadius: 16, border: `1px solid ${T.accentBorder}`, background: `linear-gradient(135deg, ${T.accentDim}, ${T.panel2})`, padding: '16px 18px', marginBottom: 14 }}>
      {started ? (
        <>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>🎾 Day {dayNo} of {total}</div>
          <div style={{ fontSize: 12.5, color: T.text2, marginTop: 3 }}>You&rsquo;re on camp. {dates}</div>
          <div style={{ height: 7, borderRadius: 999, background: T.hover, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(dayNo / total * 100)}%`, height: '100%', background: T.accent, borderRadius: 999 }} />
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 10, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {camp.status === 'pending' ? 'Place held' : 'Place booked'} · counting down
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
            {unit(dd, dd === 1 ? 'day' : 'days')}
            <Colon T={T} />{unit(hh, 'hrs')}
            <Colon T={T} />{unit(mm, 'min')}
            <Colon T={T} />{unit(ss, 'sec')}
          </div>
          <div style={{ fontSize: 12.5, color: T.text2, marginTop: 11, lineHeight: 1.55 }}>
            {dates ? `${dates}. ` : ''}{you === 'you' ? 'Your place is booked.' : `${you}’s place is booked.`}
            {camp.board ? ` ${camp.board}.` : ''}
          </div>
        </>
      )}
    </div>
  )
}

const Colon = ({ T }: { T: StudentTheme }) => (
  <div style={{ fontFamily: MONO, fontSize: 24, color: T.text4, paddingBottom: 16 }}>:</div>
)

// ── The camp panels ─────────────────────────────────────────────────────────
// Everything under a camp's tabs is built from these three, so they are where
// "very bland, lots of text" is either fixed or not. A grey label over a grey
// bulleted list is a document; a family reading about a week in Spain on a phone
// should get something with a bit of life in it. Each box therefore carries an
// icon and a tone, and a list is rows with a real marker rather than browser
// bullets — same information, findable at a glance.
type BoxTone = 'plain' | 'accent' | 'good' | 'warn'

function Box({ T, title, icon, tone = 'plain', children }: {
  T: StudentTheme; title: string; icon?: string; tone?: BoxTone; children: React.ReactNode
}) {
  const hue = tone === 'accent' ? T.accent : tone === 'good' ? T.good : tone === 'warn' ? T.warn : T.text3
  const bg = tone === 'accent' ? T.accentDim : T.panel2
  const edge = tone === 'accent' ? T.accentBorder : T.border
  return (
    <div style={{ background: bg, border: `1px solid ${edge}`, borderLeft: tone === 'plain' ? `1px solid ${edge}` : `3px solid ${hue}`, borderRadius: 12, padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        {!!icon && <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>}
        <span style={{ fontSize: 10.5, color: hue, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 800 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

const Bullets = ({ T, items, marker = 'dot', tone }: {
  T: StudentTheme; items: string[]; marker?: 'dot' | 'tick' | 'number'; tone?: BoxTone
}) => {
  const hue = tone === 'good' ? T.good : tone === 'warn' ? T.warn : T.accent
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.slice(0, 20).map((k, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {marker === 'number' ? (
            <span style={{ flexShrink: 0, width: 19, height: 19, borderRadius: 6, background: `${hue}22`, color: hue, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, marginTop: 1 }}>{i + 1}</span>
          ) : marker === 'tick' ? (
            <span style={{ flexShrink: 0, width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${hue}66`, color: hue, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, marginTop: 2 }}>✓</span>
          ) : (
            <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: hue, marginTop: 7 }} />
          )}
          <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>{k}</span>
        </div>
      ))}
    </div>
  )
}

const Facts = ({ T, rows }: { T: StudentTheme; rows: { label: string; value: string }[] }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {rows.map((r, i) => (
      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', width: 96, flexShrink: 0, paddingTop: 2 }}>{r.label}</span>
        <span style={{ fontSize: 12.5, color: T.text, lineHeight: 1.6, fontWeight: 500 }}>{r.value}</span>
      </div>
    ))}
  </div>
)

const MapLink = ({ T, label, href }: { T: StudentTheme; label: string; href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '9px 13px', fontSize: 12.5, fontWeight: 600, color: T.accent, textDecoration: 'none' }}>
    📍 {label}
  </a>
)

const Links = ({ T, map, web }: { T: StudentTheme; map: string | null; web: string | null }) => (
  (map || web) ? (
    <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
      {map && <a href={map} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>📍 Open in Maps</a>}
      {web && <a href={web} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>🔗 Website</a>}
    </div>
  ) : null
)

function PlaceCard({ T, p }: { T: StudentTheme; p: { name?: string; kind?: string; address?: string; phone?: string; url?: string; note?: string } }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 11, padding: '11px 13px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.name}</div>
      {!!p.kind && <div style={{ fontSize: 10.5, color: T.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{p.kind}</div>}
      {!!p.note && <div style={{ fontSize: 12, color: T.text2, marginTop: 6, lineHeight: 1.55 }}>{p.note}</div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
        {!!p.address && <a href={mapsUrl(p.address) || '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>📍 Map</a>}
        {!!p.phone && <a href={telUrl(p.phone) || '#'} style={{ fontSize: 11.5, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>📞 {p.phone}</a>}
        {!!p.url && <a href={webUrl(p.url) || '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, fontWeight: 700, color: T.accent, textDecoration: 'none' }}>🔗 Site</a>}
      </div>
    </div>
  )
}
