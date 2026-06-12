'use client'

// AI Session Review — DEMO ONLY. No recording, no transcription, no AI calls.
// Walks a canned flow (idle → recording → processing → report) and surfaces a
// hand-authored review for the selected session, then lets the coach draft the
// next session straight into the Saved Plans store. Themed to match
// SessionPlanner.tsx (T / accent / density tokens, inline styles, <Icon/>).

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import type { TodaySession } from '../_lib/coach-data'
import { addPlan } from '../_lib/session-plan'
import { DEMO_REVIEWS, REVIEW_STAGES, type DemoReview, type FocusStatus, type Airtime } from '../_lib/session-review-data'
import { getReview, saveReview } from '../_lib/session-review'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
type Stage = 'idle' | 'recording' | 'processing' | 'report'

const pad = (n: number) => String(n).padStart(2, '0')
const mmss = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`

// Near-full timer the "skip ahead" control jumps to, by session length.
function skipTarget(mins: number): number {
  if (mins === 45) return 43 * 60 + 10   // 43:10
  if (mins === 60) return 58 * 60 + 42   // 58:42
  if (mins === 75) return 73 * 60 + 5    // 73:05
  return Math.max(0, mins * 60 - 78)
}

export function SessionReviewPanel({ T, accent, density, session }: Common & { session: TodaySession }) {
  const review: DemoReview | undefined = DEMO_REVIEWS[session.id]
  const already = typeof window !== 'undefined' ? !!getReview(session.id) : false

  const [stage, setStage] = useState<Stage>(already && review ? 'report' : 'idle')
  const [seconds, setSeconds] = useState(0)
  const [stageIdx, setStageIdx] = useState(0)
  const [planSaved, setPlanSaved] = useState(false)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset to the right starting point whenever the selected session changes.
  useEffect(() => {
    setStage(getReview(session.id) && DEMO_REVIEWS[session.id] ? 'report' : 'idle')
    setSeconds(0); setStageIdx(0); setPlanSaved(false)
  }, [session.id])

  // Recording timer.
  useEffect(() => {
    if (stage !== 'recording') return
    tick.current = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => { if (tick.current) clearInterval(tick.current) }
  }, [stage])

  // Fake processing pipeline — step through the stages with timed delays.
  useEffect(() => {
    if (stage !== 'processing') return
    setStageIdx(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    let elapsed = 0
    REVIEW_STAGES.forEach((st, i) => {
      elapsed += st.ms
      timers.push(setTimeout(() => {
        if (i < REVIEW_STAGES.length - 1) setStageIdx(i + 1)
        else setStage('report')
      }, elapsed))
    })
    return () => timers.forEach(clearTimeout)
  }, [stage])

  // Persist the completed review so the planner shows "Reviewed" on reopen/reload.
  useEffect(() => {
    if (stage !== 'report' || !review) return
    saveReview({ id: `review-${session.id}`, sessionId: session.id, player: session.player, createdAt: Date.now(), review })
  }, [stage, session.id, session.player, review])

  // ── graceful fallback ──────────────────────────────────────────────────────
  if (!review) {
    return (
      <div style={{ marginTop: 14, padding: '14px 16px', background: T.panel2, border: `1px dashed ${T.border}`, borderRadius: 10, fontSize: 12, color: T.text3, lineHeight: 1.5 }}>
        No AI review is available for this session yet. Run a session and record it to generate one.
      </div>
    )
  }

  const wrap: CSSProperties = { marginTop: 14, background: T.panel2, border: `1px solid ${accent.border}`, borderRadius: 12, padding: 16 }

  return (
    <div style={wrap}>
      <style>{`
        @keyframes srpPulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .35; transform: scale(.78) } }
        @keyframes srpWave { 0%,100% { transform: scaleY(0.25) } 50% { transform: scaleY(1) } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: accent.dim, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="sparkles" size={14} stroke={1.8} style={{ color: accent.hex }} />
        </span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>AI Session Review</div>
          <div style={{ fontSize: 10.5, color: T.text3 }}>Demo · {session.player} · {session.type} · {session.mins} min</div>
        </div>
        {stage === 'report' && (
          <span style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, color: T.good, background: 'rgba(111,168,138,0.16)', padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviewed</span>
        )}
      </div>

      {stage === 'idle' && <IdleView T={T} accent={accent} onRecord={() => { setSeconds(0); setStage('recording') }} onUpload={() => setStage('processing')} />}
      {stage === 'recording' && (
        <RecordingView T={T} accent={accent} seconds={seconds}
          onSkip={() => setSeconds(skipTarget(session.mins))}
          onStop={() => setStage('processing')} />
      )}
      {stage === 'processing' && <ProcessingView T={T} accent={accent} idx={stageIdx} />}
      {stage === 'report' && (
        <ReportView T={T} accent={accent} density={density} session={session} review={review}
          planSaved={planSaved}
          onCreatePlan={() => {
            const d = review.nextPlanDraft
            addPlan({ id: `review-${session.id}`, player: session.player, focus: d.focus, source: 'AI session review', createdAt: Date.now(), workOn: d.workOn, plan: d.plan, drills: d.drills })
            setPlanSaved(true)
          }} />
      )}
    </div>
  )
}

// ── idle ──────────────────────────────────────────────────────────────────────
function IdleView({ T, accent, onRecord, onUpload }: { T: ThemeTokens; accent: AccentTokens; onRecord: () => void; onUpload: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '18px 12px', gap: 12 }}>
      <span style={{ width: 54, height: 54, borderRadius: '50%', background: accent.dim, display: 'grid', placeItems: 'center' }}>
        <Icon name="mic" size={24} stroke={1.7} style={{ color: accent.hex }} />
      </span>
      <div style={{ fontSize: 13, color: T.text2, maxWidth: 320, lineHeight: 1.5 }}>
        Record the session audio and Lumio will transcribe it, compare it against your plan, and draft the next session.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onRecord} style={{ appearance: 'none', border: 0, padding: '9px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="mic" size={14} stroke={2} /> Record session audio
        </button>
        <button onClick={onUpload} style={{ appearance: 'none', padding: '9px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="cloud" size={14} stroke={1.8} /> Upload recording
        </button>
      </div>
    </div>
  )
}

// ── recording ───────────────────────────────────────────────────────────────
function RecordingView({ T, accent, seconds, onSkip, onStop }: { T: ThemeTokens; accent: AccentTokens; seconds: number; onSkip: () => void; onStop: () => void }) {
  const bars = [0.6, 1, 0.4, 0.85, 0.5, 1, 0.7, 0.35, 0.9, 0.55, 0.75, 0.45, 1, 0.6, 0.8]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 12px', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0464a', animation: 'srpPulse 1.1s ease-in-out infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#e0464a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recording</span>
      </div>
      <div className="tnum" style={{ fontSize: 30, fontWeight: 700, color: T.text, fontFamily: FONT_MONO, letterSpacing: '0.02em' }}>{mmss(seconds)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 34 }}>
        {bars.map((h, i) => (
          <span key={i} style={{ width: 3, height: 30, borderRadius: 2, background: accent.hex, transformOrigin: 'center', transform: `scaleY(${h})`, animation: `srpWave ${0.7 + (i % 5) * 0.13}s ease-in-out ${i * 0.06}s infinite` }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onStop} style={{ appearance: 'none', border: 0, padding: '9px 18px', borderRadius: 9, background: '#e0464a', color: '#fff', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#fff' }} /> Stop &amp; analyse
        </button>
      </div>
      <button onClick={onSkip} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 10.5, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
        skip ahead to end of session
      </button>
    </div>
  )
}

// ── processing ──────────────────────────────────────────────────────────────
function ProcessingView({ T, accent, idx }: { T: ThemeTokens; accent: AccentTokens; idx: number }) {
  return (
    <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {REVIEW_STAGES.map((st, i) => {
        const done = i < idx, active = i === idx
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: done || active ? 1 : 0.4 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: done ? T.good : active ? accent.dim : 'transparent', border: done ? 'none' : `1.5px solid ${active ? accent.hex : T.border}` }}>
              {done
                ? <Icon name="check" size={12} stroke={2.4} style={{ color: '#fff' }} />
                : <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? accent.hex : T.border, animation: active ? 'srpPulse 1s ease-in-out infinite' : 'none' }} />}
            </span>
            <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: done ? T.text2 : active ? T.text : T.text3 }}>{st.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── report ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<FocusStatus, { label: string; key: 'good' | 'warn' | 'bad' }> = {
  covered: { label: 'Covered', key: 'good' },
  partial: { label: 'Partial', key: 'warn' },
  missed:  { label: 'Missed', key: 'bad' },
}
const AIR_META: Record<Airtime, { label: string; pct: number; key: 'good' | 'warn' | 'bad' }> = {
  full:  { label: 'Full', pct: 100, key: 'good' },
  light: { label: 'Light', pct: 45, key: 'warn' },
  none:  { label: 'None', pct: 8, key: 'bad' },
}

function MiniHead({ T, children }: { T: ThemeTokens; children: ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 8px' }}>{children}</div>
}

function ReportView({ T, accent, density, session, review, planSaved, onCreatePlan }: Common & { session: TodaySession; review: DemoReview; planSaved: boolean; onCreatePlan: () => void }) {
  const c = (k: 'good' | 'warn' | 'bad') => (k === 'good' ? T.good : k === 'warn' ? T.warn : T.bad)
  const tint = (k: 'good' | 'warn' | 'bad') => (k === 'good' ? 'rgba(111,168,138,0.15)' : k === 'warn' ? 'rgba(201,160,107,0.15)' : 'rgba(199,120,120,0.15)')
  const n = review.coachingNotes

  return (
    <div>
      {/* focus point results */}
      <MiniHead T={T}>Plan vs delivery · focus points</MiniHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {review.focusPointResults.map((f, i) => {
          const m = STATUS_META[f.status]
          return (
            <div key={i} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600, flex: 1, minWidth: 0 }}>{f.point}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: c(m.key), background: tint(m.key), padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{m.label}</span>
              </div>
              {f.evidence && <div style={{ fontSize: 11.5, color: T.text2, fontStyle: 'italic', margin: '6px 0 0', paddingLeft: 27, lineHeight: 1.45 }}>{f.evidence}</div>}
              <div style={{ fontSize: 11, color: T.text3, marginTop: 4, paddingLeft: 27, lineHeight: 1.45 }}>{f.note}</div>
            </div>
          )
        })}
      </div>

      {/* drills */}
      <MiniHead T={T}>Drills run</MiniHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {review.drillResults.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, color: T.text2 }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'grid', placeItems: 'center', background: d.ran ? 'rgba(111,168,138,0.16)' : 'rgba(199,120,120,0.14)' }}>
              {d.ran ? <Icon name="check" size={11} stroke={2.4} style={{ color: T.good }} /> : <span style={{ fontSize: 11, lineHeight: 1, color: T.bad }}>✕</span>}
            </span>
            <span style={{ color: d.ran ? T.text : T.text3, textDecoration: d.ran ? 'none' : 'line-through' }}>{d.drill}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, textAlign: 'right', maxWidth: '52%' }}>{d.note}</span>
          </div>
        ))}
      </div>

      {/* run-sheet coverage as slim bars */}
      <MiniHead T={T}>Run-sheet coverage</MiniHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {review.runSheetCoverage.map((p, i) => {
          const a = AIR_META[p.airtime]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 150, fontSize: 11.5, color: T.text2, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.phase}</span>
              <span className="tnum" style={{ width: 34, fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, flexShrink: 0 }}>{p.plannedMins}m</span>
              <span style={{ flex: 1, height: 7, borderRadius: 4, background: T.hover, overflow: 'hidden' }}>
                <span style={{ display: 'block', width: `${a.pct}%`, height: '100%', background: c(a.key) }} />
              </span>
              <span style={{ width: 38, fontSize: 9.5, fontWeight: 700, color: c(a.key), textAlign: 'right', flexShrink: 0, textTransform: 'uppercase' }}>{a.label}</span>
            </div>
          )
        })}
      </div>

      {/* coaching notes */}
      <MiniHead T={T}>Coaching notes</MiniHead>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 9, padding: '11px 13px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
          {n.cuesUsed.map((cue, i) => (
            <span key={i} style={{ fontSize: 10.5, color: T.text2, padding: '3px 8px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}` }}>&ldquo;{cue}&rdquo;</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, marginBottom: 9 }}>
          <span style={{ color: T.text3 }}>Positive : corrective &nbsp;<span style={{ color: T.text2, fontWeight: 600, fontFamily: FONT_MONO }}>{n.positiveToCorrectiveRatio}</span></span>
          <span style={{ color: T.text3, display: 'flex', alignItems: 'center', gap: 5 }}>
            Homework
            <span style={{ fontWeight: 700, color: n.homeworkSet ? T.good : T.bad }}>{n.homeworkSet ? 'set ✓' : 'not set ✕'}</span>
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>{n.summary}</div>
      </div>

      {/* next plan draft */}
      <MiniHead T={T}>Drafted next session</MiniHead>
      <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '11px 13px' }}>
        <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Next focus</div>
        <div style={{ fontSize: 13.5, color: T.text, fontWeight: 600, marginTop: 2, marginBottom: 8 }}>{review.nextPlanDraft.focus}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 5 }}>
          {review.nextPlanDraft.workOn.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: T.text2, lineHeight: 1.4 }}>
              <span style={{ color: accent.hex, fontWeight: 700 }}>{i + 1}</span>{w}
            </div>
          ))}
        </div>
      </div>

      {planSaved ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, padding: '10px 13px', background: 'rgba(111,168,138,0.12)', border: `1px solid ${T.good}`, borderRadius: 9 }}>
          <Icon name="check" size={15} stroke={2.2} style={{ color: T.good }} />
          <span style={{ fontSize: 12, color: T.text2 }}>Added to <strong style={{ color: T.text }}>Saved plans for {session.player}</strong> — scroll down to the saved plans below this card.</span>
        </div>
      ) : (
        <button onClick={onCreatePlan} style={{ appearance: 'none', border: 0, marginTop: 12, padding: '10px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="plus" size={14} stroke={2} /> Create next plan from this review
        </button>
      )}
    </div>
  )
}
