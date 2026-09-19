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

import { useState } from 'react'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { RACKET_STAGES, SKILLS_BY_STAGE, SKILL_LEVELS } from '@/app/coach/[slug]/_lib/coach-db'
import { avatarSrc } from '@/lib/avatar'
import {
  studentFraming, latestGuidance, activeCamps, daysUntil, asStringList,
  type StudentBundle, type StudentCamp, type StudentClip, type StudentWatchSession,
} from '@/lib/student/bundle'
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

export function LiveStudentView({ T, bundle, footnote }: { T: StudentTheme; bundle: StudentBundle; footnote?: string }) {
  const [playing, setPlaying] = useState<StudentClip | null>(null)
  const { player, skills, lessons, clips, voiceNotes, watch, resources, sectionsOff, awardThreshold } = bundle

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

  // ── effort & session report ───────────────────────────────────────────────
  const latestWatch = watch.filter(w => !!w.started_at)[0] || null
  const xpTotal = player.xp_total ?? watch.reduce((a, w) => a + (w.xp_awarded || 0), 0)

  // ── homework / next focus ─────────────────────────────────────────────────
  const guidance = latestGuidance(lessons)

  // ── camp ──────────────────────────────────────────────────────────────────
  const camps = activeCamps(bundle.camps || [])

  // ── what is actually on ───────────────────────────────────────────────────
  const show = {
    camp: studentSectionOn('camp', off, camps.length > 0),
    highlights: studentSectionOn('highlights', off, clips.length > 0 || voiceNotes.length > 0),
    report: studentSectionOn('report', off, !!latestWatch),
    rewards: studentSectionOn('rewards', off, watch.length > 0 && xpTotal > 0),
    racket: studentSectionOn('racket', off, hasRacket),
    homework: studentSectionOn('homework', off, !!(guidance.homework || guidance.nextFocus)),
    lessons: studentSectionOn('lessons', off, lessons.length > 0),
    resources: studentSectionOn('resources', off, resources.length > 0),
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
                  {stage.name} racket
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

      {/* ── CAMP — on from the moment they are booked, off when it ends ────── */}
      {show.camp && camps.map(c => <CampCard key={c.id} T={T} camp={c} first={f.first} />)}

      {/* ── SESSION HIGHLIGHTS ─────────────────────────────────────────────── */}
      {show.highlights && (
        <Card T={T}>
          <Head T={T} icon="play" title={`${f.possessive} session highlights`} sub="Clips your coach saved from recent sessions" lead />
          {clips.length > 0 && (
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
          {voiceNotes.length > 0 && (
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
            From {f.possessiveLower} own watch or a logged session — it never tracks court position, and it is separate from racket progression.
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

      {/* ── RECENT LESSONS ─────────────────────────────────────────────────── */}
      {show.lessons && (
        <Card T={T}>
          <Head T={T} icon="note" title="Recent lessons" sub="What you worked on, and your coach’s notes" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lessons.slice(0, 12).map(l => {
              const r = l.review_json || {}
              const take = (r.takeaways || [])[0] || (l.summary || '').trim()
              return (
                <div key={l.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.focus || l.focus || 'Lesson'}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: MONO }}>{prettyDate(l.session_date)}{r.type ? ` · ${r.type}` : ''}</span>
                    {!!l.rating && <span style={{ display: 'flex', gap: 1 }}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: i < (l.rating || 0) ? T.accent : T.text4, fontSize: 12 }}>★</span>)}</span>}
                  </div>
                  {!!take && <div style={{ fontSize: 12, color: T.text2, marginTop: 6, lineHeight: 1.5 }}>“{take}”</div>}
                  {!!r.coachNote && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 6, fontStyle: 'italic', display: 'flex', gap: 6 }}>
                    <Icon name="megaphone" size={12} stroke={1.7} style={{ color: T.accent, flexShrink: 0, marginTop: 2 }} />Coach: {r.coachNote}
                  </div>}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── RECOMMENDED RESOURCES ──────────────────────────────────────────── */}
      {show.resources && (
        <Card T={T}>
          <Head T={T} icon="newspaper" title={`Recommended for ${f.possessiveLower} level`} sub={hasRacket ? `Drills & guides matched to the ${stage.name} racket` : 'Drills and guides from your coach'} />
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

// ── The camp module ─────────────────────────────────────────────────────────
// Booked, not browsing: this only ever renders for a camp the player has a place
// on, so it answers the questions a family actually has once the place is taken —
// when, where, what to bring, what the days look like — rather than selling it.
function CampCard({ T, camp, first }: { T: StudentTheme; camp: StudentCamp; first: string }) {
  const days = daysUntil(camp.start_date)
  const started = days !== null && days <= 0
  const kit = asStringList(camp.equipment)
  const rhythm = asStringList(camp.daily_rhythm)
  const brief = asStringList(camp.parent_brief)
  const itinerary = asStringList(camp.itinerary)
  const adultCamp = (camp.audience || '').toLowerCase() === 'adult'

  const countdown = days === null ? 'Booked'
    : days > 1 ? `In ${days} days`
    : days === 1 ? 'Tomorrow'
    : days === 0 ? 'Today'
    : 'On now'

  return (
    <Card T={T} style={{ borderColor: T.accentBorder }}>
      <Head T={T} icon="calendar" title={camp.name}
        sub={[camp.location, camp.region].filter(Boolean).join(' · ') || (camp.overseas ? 'Overseas camp' : 'Camp')} lead />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 14, background: T.accentDim, border: `1px solid ${T.accentBorder}`, marginBottom: 14 }}>
        <span style={{ fontSize: 26 }}>{started ? '🎾' : '📅'}</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>
            {countdown}
            {camp.start_date ? ` · ${prettyDate(camp.start_date)}${camp.end_date && camp.end_date !== camp.start_date ? ` – ${prettyDate(camp.end_date)}` : ''}` : ''}
          </div>
          <div style={{ fontSize: 11.5, color: T.text2, marginTop: 2 }}>
            {adultCamp ? 'Your place is booked.' : `${first}’s place is booked.`}
            {camp.status === 'pending' ? ' Balance outstanding — your coach will be in touch.' : ''}
            {camp.board ? ` ${camp.board}.` : ''}
          </div>
        </div>
        {camp.status === 'pending' && !!camp.balance_link && (
          <a href={camp.balance_link} target="_blank" rel="noopener noreferrer"
            style={{ background: T.accent, color: T.btnText, borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
            Pay the balance →
          </a>
        )}
      </div>

      {!!(camp.description || '').trim() && (
        <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, margin: '0 0 14px' }}>{camp.description}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: T.gap }}>
        {kit.length > 0 && (
          <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>What to bring</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: T.text2, lineHeight: 1.7 }}>
              {kit.slice(0, 12).map((k, i) => <li key={i}>{k}</li>)}
            </ul>
          </div>
        )}
        {(rhythm.length > 0 || itinerary.length > 0) && (
          <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>How the days run</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: T.text2, lineHeight: 1.7 }}>
              {(rhythm.length ? rhythm : itinerary).slice(0, 12).map((k, i) => <li key={i}>{k}</li>)}
            </ul>
          </div>
        )}
        {brief.length > 0 && (
          <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>
              {adultCamp ? 'Before you come' : 'For parents'}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: T.text2, lineHeight: 1.7 }}>
              {brief.slice(0, 12).map((k, i) => <li key={i}>{k}</li>)}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}
