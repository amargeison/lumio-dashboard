'use client'

// Junior Football — AI Match Recap + AI Performance Brief.
//
// Ported from the Women's AIPerformanceBriefView pattern in
// src/app/womens/[slug]/page.tsx. Same shape: a single component with
// per-mode canned briefs, a mode tab bar, an 800ms artificial latency
// for tactile feel, and a commented-out LIVE API PATH for non-demo
// deployments.
//
// Four modes — three coach-facing inherited from the women's pattern,
// one parent-facing NEW for the junior portal:
//
//   - half_time     (coach)  : first-half → second-half adjustments, junior-tuned
//   - full_time     (coach)  : full match → recovery + next session, junior-tuned
//   - training      (coach)  : session load → next session, junior-tuned
//   - match_recap   (parent) : parent-facing, plain English, welfare-positive
//                              ("volunteer AI tone"). The flagship demo brief.
//
// DEMO RULE: every brief is fully canned. There are NO real Claude API
// calls on demo interactions. The /api/ai/junior dev route (added in
// Commit 5 as devApiRouteOptions) stays dev-only — generateBrief()
// below returns the canned brief and never fetches. Switching to live
// calls is a one-place change: delete the canned return and uncomment
// the LIVE API PATH block at the end of generateBrief().

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

// ─── Theme ───────────────────────────────────────────────────────────────────

const T = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentDeep: '#166534',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
} as const

// ─── Types ───────────────────────────────────────────────────────────────────

export type BriefMode = 'match_recap' | 'half_time' | 'full_time' | 'training'

interface WelfareFlag {
  player: string
  flag: string
  recommendation: string
}

/** Parent-facing recap — written for the parent of one child. Plain English. */
interface MatchRecap {
  /** Friendly opening line. The canned demo starts "Sunday, 2:45pm…" */
  greeting: string
  /** One-paragraph headline summary of the child's match. */
  headline: string
  /** Two or three highlight clip tiles (no actual video files — demo). */
  highlights: { id: string; label: string; durationSec: number; tag: string }[]
  /** GPS headline numbers, plain English. */
  gps: { distanceKm: number; sprints: number; topSpeedKmh: number; effortDescriptor: string }
  /** Short coach note — first-person, supportive, age-appropriate. */
  coachNote: string
  /** Minutes played + position context. */
  minutes: { played: number; outOf: number; position: string }
  /** Welfare-positive closing line — what to do next, gently framed. */
  next: string
}

interface HalfTimeBrief {
  headline: string
  welfare_flags: WelfareFlag[]
  matchday_notes: string
  age_appropriate_message: string
  fa_respect_reminder: string
}

interface FullTimeBrief {
  headline: string
  welfare_flags: WelfareFlag[]
  squad_summary: string
  next_session_focus: string
  parent_comms_note: string
}

interface TrainingBrief {
  headline: string
  development_observations: { player: string; observation: string; suggested_focus: string }[]
  group_focus_next_session: string
  session_target_assessment: string
}

// ─── Canned demo content ─────────────────────────────────────────────────────
//
// CANNED_MATCH_RECAP is the flagship parent-facing brief. The "Sunday,
// 2:45pm…" framing comes from the action plan — this is the demo's
// emotional centrepiece, intentionally written in plain-English,
// welfare-positive language (the "volunteer AI tone"). Adapted to demo
// child Jack Carter, Oakridge U11 Lions.

const CANNED_MATCH_RECAP: MatchRecap = {
  greeting: "Sunday, 2:45 pm — kettle's on, here's Jack's morning.",
  headline:
    "Jack played the full 60 minutes at right-mid for the U11 Lions today, in a 3–2 win " +
    "over Hartwell U11. Two goal-involvements: he created Oakridge's first goal with a " +
    "ball over the top, and his press won the ball back for the equaliser just before " +
    "half-time. Big mood from him on the walk back to the car — he'll have stories.",
  highlights: [
    { id: 'h-001', label: 'The pass for the first goal',  durationSec: 18, tag: 'assist' },
    { id: 'h-002', label: 'Press → turnover → equaliser', durationSec: 22, tag: 'pressure' },
    { id: 'h-003', label: 'First-touch in his own half',  durationSec: 11, tag: 'composure' },
  ],
  gps: {
    distanceKm: 4.6,
    sprints: 14,
    topSpeedKmh: 19.2,
    effortDescriptor: 'A really busy game — more sprints than his last three matches combined.',
  },
  coachNote:
    "Jack was excellent today — vocal in the press, calm when we had the ball. He's " +
    "starting to read the game one pass ahead, which is exactly where U11s should be " +
    "by now. Quietly proud of him. — Coach Mark",
  minutes: { played: 60, outOf: 60, position: 'Right midfield' },
  next:
    "Light dinner, plenty of water, early bath. Training is Tuesday 6 pm — Coach has " +
    "asked the team to bring water bottles and a piece of fruit. No homework from the " +
    "pitch tonight; let him tell you about the game on his own terms.",
}

const CANNED_HALF_TIME: HalfTimeBrief = {
  headline:
    "0–1 at the break against Hartwell U11. Squad's on top of the ball but two players are " +
    "tiring — manage their second-half minutes rather than risk a 60-minute slog.",
  welfare_flags: [
    { player: 'Zac Daley',     flag: 'Returning from a knock — light first half',                                            recommendation: 'Cap at 40 mins total; pull at the 50-minute mark if score allows.' },
    { player: 'Beth Halpern',  flag: 'Asthma — windy conditions worsening',                                                    recommendation: 'Inhaler check at half-time; rotate to bench if breathing flagged.' },
  ],
  matchday_notes:
    "Press is working, finishing isn't. One clear-cut chance missed in the first half " +
    "(Ravi, 18'). Consider a 4-2-3-1 second half to free Aria higher up the pitch.",
  age_appropriate_message:
    "Keep the team-talk positive and short — two minutes, one tactical point, one " +
    "encouragement. U11s tune out anything longer than that and we still want them on " +
    "the front foot.",
  fa_respect_reminder:
    "Sideline noise from the opposition parents has picked up — politely flag with the " +
    "opposing manager at the break if it continues. FA Respect codes apply to spectators " +
    "as well as coaches.",
}

const CANNED_FULL_TIME: FullTimeBrief = {
  headline:
    "3–2 win over Hartwell U11. Strong second half — three goals in 25 minutes after a " +
    "tactical tweak. No injuries, two minor welfare items handled at the break.",
  welfare_flags: [
    { player: 'Zac Daley',    flag: 'Knock-related minutes managed to 35 today',         recommendation: 'Full rest Monday; pool / cycle option only Tuesday.' },
    { player: 'Beth Halpern', flag: 'Asthma — inhaler used twice today',                  recommendation: 'Note in welfare log; check with parent about pollen levels this week.' },
  ],
  squad_summary:
    "13 of 16 played at least 20 minutes. Jack Carter the standout — full 60, two " +
    "goal-involvements. Aria's switch to a free-8 role made the difference in the " +
    "second half. Confidence is high; Tuesday will be a recovery + reflection session.",
  next_session_focus:
    "Tuesday — passing patterns under pressure, building on what worked second-half. " +
    "Short tactical block on the press triggers we used to turn the ball over.",
  parent_comms_note:
    "Send the parents a short team-level update tonight (highlights + 'next training: " +
    "Tuesday 6 pm'). Individual parent recaps generated automatically via Lumio Junior.",
}

const CANNED_TRAINING: TrainingBrief = {
  headline:
    "Tuesday session hit the planned 75-minute load. Good engagement across the squad. " +
    "Two development pointers to feed back individually.",
  development_observations: [
    { player: 'Jack Carter', observation: 'Starting to scan before receiving — big upgrade from last month.',      suggested_focus: 'Pair him with a less-confident receiver in next rondo; let him model it.' },
    { player: 'Zac Daley',   observation: 'Drove the ball forward well; first-touch under pressure still rushed.', suggested_focus: 'Two-minute first-touch ladder in Thursday warm-up.' },
    { player: 'Aria Khoury', observation: 'Vocal leader in the conditioned game.',                                  suggested_focus: 'Give her the captain-for-a-week role on Saturday.' },
  ],
  group_focus_next_session:
    "Thursday — build-from-the-back phase. Keep it 8v6 to give the back line a numerical " +
    "advantage; mistakes are part of the learning.",
  session_target_assessment:
    "Anaerobic capacity + decision-making under fatigue both hit. The rondo block ran " +
    "long; trim by 5 minutes next time and use that for the cool-down reflection.",
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

function HeadlineCard({ headline, accent = T.accent }: { headline: string; accent?: string }) {
  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: T.panel, border: `1px solid ${accent}55` }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Headline</p>
      <p className="text-sm leading-relaxed" style={{ color: T.text }}>{headline}</p>
    </div>
  )
}

function SubCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: T.text4 }}>{title}</p>
      <p className="text-xs leading-relaxed" style={{ color: T.text2 }}>{body}</p>
    </div>
  )
}

function WelfareFlagsCard({ flags }: { flags: WelfareFlag[] }) {
  if (flags.length === 0) return null
  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.accent}55` }}>
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: T.good }}>
        🌱 Welfare notes
      </h3>
      <div className="space-y-2">
        {flags.map((f, i) => (
          <div key={i} className="rounded p-3" style={{ backgroundColor: T.accentDim, border: `1px solid ${T.accent}33` }}>
            <p className="text-xs font-bold" style={{ color: T.text }}>{f.player}</p>
            <p className="text-[11px] mt-0.5" style={{ color: T.good }}>{f.flag}</p>
            <p className="text-[11px] mt-1" style={{ color: T.text2 }}>
              <span style={{ color: T.text4 }}>→</span> {f.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Renderers ──────────────────────────────────────────────────────────────

function renderMatchRecap(b: MatchRecap) {
  return (
    <>
      {/* The greeting line — opens like a text message from the AI, soft entry. */}
      <div className="rounded-xl p-4 mb-4" style={{ background: `linear-gradient(135deg, ${T.accentDim} 0%, transparent 60%)`, border: `1px solid ${T.accent}55` }}>
        <p className="text-sm leading-relaxed" style={{ color: T.text }}>{b.greeting}</p>
      </div>
      <HeadlineCard headline={b.headline} />

      {/* Highlights — three clips, no video yet (demo). */}
      <Card className="mb-4">
        <p className="text-sm font-bold mb-3" style={{ color: T.text }}>🎬 Highlights</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {b.highlights.map(h => (
            <div key={h.id} className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
              <div
                className="aspect-video rounded mb-2 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${T.accentDim}, ${T.panel})`, border: `1px solid ${T.accent}33` }}
              >
                <span className="text-2xl" aria-hidden>▶</span>
              </div>
              <p className="text-xs font-semibold" style={{ color: T.text }}>{h.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>{h.durationSec}s · {h.tag}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
          Clips respect club consent settings — restricted children are never named or shown.
        </p>
      </Card>

      {/* GPS headline — four big numbers, plain English. */}
      <Card className="mb-4">
        <p className="text-sm font-bold mb-3" style={{ color: T.text }}>📡 Today on the pitch</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
            <p className="text-2xl font-bold tnum" style={{ color: T.good }}>{b.gps.distanceKm.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: T.text4 }}>km covered</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
            <p className="text-2xl font-bold tnum" style={{ color: T.good }}>{b.gps.sprints}</p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: T.text4 }}>sprints</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
            <p className="text-2xl font-bold tnum" style={{ color: T.good }}>{b.gps.topSpeedKmh.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: T.text4 }}>km/h top</p>
          </div>
        </div>
        <p className="text-[11px]" style={{ color: T.text2 }}>{b.gps.effortDescriptor}</p>
      </Card>

      {/* Coach note — first-person, supportive. */}
      <Card className="mb-4">
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>👨‍🏫 Coach's note</p>
        <p className="text-xs italic leading-relaxed" style={{ color: T.text2 }}>{b.coachNote}</p>
      </Card>

      {/* Minutes + position — small factual tile. */}
      <Card className="mb-4">
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>⏱ Minutes &amp; position</p>
        <p className="text-xs" style={{ color: T.text2 }}>
          <strong style={{ color: T.good }}>{b.minutes.played}'</strong> of {b.minutes.outOf}' · {b.minutes.position}
        </p>
      </Card>

      {/* Closing — welfare-positive, gentle. */}
      <SubCard title="What's next" body={b.next} />
    </>
  )
}

function renderHalfTime(b: HalfTimeBrief) {
  return (
    <>
      <HeadlineCard headline={b.headline} />
      <WelfareFlagsCard flags={b.welfare_flags} />
      <SubCard title="🎯 Matchday notes"        body={b.matchday_notes} />
      <SubCard title="🧒 Age-appropriate message" body={b.age_appropriate_message} />
      <SubCard title="🤝 FA Respect reminder"     body={b.fa_respect_reminder} />
    </>
  )
}

function renderFullTime(b: FullTimeBrief) {
  return (
    <>
      <HeadlineCard headline={b.headline} />
      <WelfareFlagsCard flags={b.welfare_flags} />
      <SubCard title="👥 Squad summary"          body={b.squad_summary} />
      <SubCard title="📋 Next session focus"     body={b.next_session_focus} />
      <SubCard title="✉️ Parent comms note"      body={b.parent_comms_note} />
    </>
  )
}

function renderTraining(b: TrainingBrief) {
  return (
    <>
      <HeadlineCard headline={b.headline} />
      <Card className="mb-4">
        <p className="text-sm font-bold mb-3" style={{ color: T.text }}>📈 Development observations</p>
        <div className="space-y-2">
          {b.development_observations.map((o, i) => (
            <div key={i} className="rounded p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
              <p className="text-xs font-bold" style={{ color: T.text }}>{o.player}</p>
              <p className="text-[11px] mt-0.5" style={{ color: T.text2 }}>{o.observation}</p>
              <p className="text-[11px] mt-1" style={{ color: T.text3 }}>
                <span style={{ color: T.text4 }}>→</span> {o.suggested_focus}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <SubCard title="🎯 Group focus next session"   body={b.group_focus_next_session} />
      <SubCard title="✅ Session target assessment"  body={b.session_target_assessment} />
    </>
  )
}

// ─── Compact preview (for the Today banner) ─────────────────────────────────
// Renders the recap's greeting + headline only, with an "Open full recap"
// callback. Used in the Today AI-summary banner for parent_guardian.

export function JuniorAIMatchRecapPreview({ onOpen, childName }: { onOpen?: () => void; childName?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.good }}>AI Match Recap · today</p>
        <h3 className="text-base font-bold" style={{ color: T.text }}>{CANNED_MATCH_RECAP.greeting}</h3>
        <p className="text-sm mt-1 leading-relaxed line-clamp-3" style={{ color: T.text2 }}>
          {CANNED_MATCH_RECAP.headline}
        </p>
        <p className="text-[10px] mt-2" style={{ color: T.text4 }}>
          Fully canned demo brief · no live AI call · {childName ?? 'Your child'} · Oakridge U11 Lions
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <span className="text-3xl" aria-hidden>🤖</span>
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="text-[11px] px-3 py-1.5 rounded-lg font-medium whitespace-nowrap"
            style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
          >
            Open full recap →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

interface Props {
  session: SportsDemoSession
  /** Initial mode — defaults to 'match_recap' for parents, 'full_time' for staff. */
  initialMode?: BriefMode
}

export default function JuniorAIMatchRecap({ session, initialMode }: Props) {
  const isParent = session.role === 'parent_guardian'
  const defaultMode: BriefMode = initialMode ?? (isParent ? 'match_recap' : 'full_time')
  const [mode, setMode] = useState<BriefMode>(defaultMode)
  const [loading, setLoading] = useState(false)
  const [briefs, setBriefs] = useState<{
    match_recap?: MatchRecap
    half_time?:   HalfTimeBrief
    full_time?:   FullTimeBrief
    training?:    TrainingBrief
  }>({})

  const generateBrief = async () => {
    setLoading(true)
    // Demo: canned response with ~800ms artificial latency for tactile feel.
    // No fetch to /api/ai/junior happens on demo. The route exists (dev
    // option) but is not called from this code path. To enable live
    // Claude API calls in a signed-client (non-demo) portal, delete the
    // four lines below and uncomment the LIVE API PATH block.
    await new Promise(r => setTimeout(r, 800))
    if (mode === 'match_recap')      setBriefs(b => ({ ...b, match_recap: CANNED_MATCH_RECAP }))
    else if (mode === 'half_time')   setBriefs(b => ({ ...b, half_time:   CANNED_HALF_TIME }))
    else if (mode === 'full_time')   setBriefs(b => ({ ...b, full_time:   CANNED_FULL_TIME }))
    else                             setBriefs(b => ({ ...b, training:    CANNED_TRAINING }))
    setLoading(false)
    return

    /* LIVE API PATH — uncomment for non-demo deployments:
    try {
      const prompt = buildPromptForMode(mode)
      const response = await fetch('/api/ai/junior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await response.json()
      // ... parse + setBriefs ...
    } catch {
      // surface error in UI here
    } finally { setLoading(false) }
    */
  }

  // Mode tabs. Parents only see Match Recap; staff see all four with
  // Match Recap last (it's their "what the parent sees" view, useful
  // for coaches to preview parent-facing language before publish).
  const modeTabs: { id: BriefMode; label: string; sub: string }[] = isParent
    ? [
        { id: 'match_recap', label: 'Match Recap', sub: 'Plain-English recap for your child' },
      ]
    : [
        { id: 'half_time',   label: 'Half-Time',   sub: 'First-half → 2nd-half adjustments' },
        { id: 'full_time',   label: 'Full-Time',   sub: 'Full match → recovery + next session' },
        { id: 'training',    label: 'Training',    sub: 'Session load → next session' },
        { id: 'match_recap', label: 'Parent view', sub: 'Preview the parent-facing recap' },
      ]

  const activeBrief =
    mode === 'match_recap' ? briefs.match_recap :
    mode === 'half_time'   ? briefs.half_time   :
    mode === 'full_time'   ? briefs.full_time   :
                             briefs.training

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
              AI Brief · {isParent ? 'Parent view' : 'Coaching staff'}
            </p>
            <h2 className="text-lg font-bold" style={{ color: T.text }}>
              {isParent ? 'Your child\'s match — plain English' : 'AI-assisted brief — junior-tuned'}
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
              {isParent
                ? "Soft, welfare-positive recap of today's match. Tap into the highlights, GPS, coach note and what's next."
                : "Same shape as the senior portals; junior-tuned language. Welfare flags are first-class in every mode."}
            </p>
          </div>
          <button
            type="button"
            onClick={generateBrief}
            disabled={loading}
            className="text-xs px-4 py-2 rounded-lg font-semibold whitespace-nowrap"
            style={{
              backgroundColor: loading ? T.borderSoft : T.accent,
              color: loading ? T.text4 : T.text,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Generating…' : activeBrief ? 'Refresh brief' : 'Generate brief'}
          </button>
        </div>
        <p className="text-[10px] mt-2 italic" style={{ color: T.text4 }}>
          Demo mode — fully canned response · no Claude API call. The /api/ai/junior route is
          development-only and is not invoked from this component on demo interactions.
        </p>
      </div>

      <div className="flex gap-1 border-b flex-wrap" style={{ borderColor: T.border }}>
        {modeTabs.map(t => {
          const active = mode === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className="px-4 py-2.5 text-xs font-semibold transition-all relative text-left"
              style={{
                color: active ? T.good : T.text4,
                borderBottom: active ? `2px solid ${T.good}` : '2px solid transparent',
              }}
            >
              <div>{t.label}</div>
              <div className="text-[9px] font-normal" style={{ color: active ? T.text3 : T.text4 }}>{t.sub}</div>
            </button>
          )
        })}
      </div>

      {!activeBrief && !loading && (
        <Card>
          <p className="text-sm" style={{ color: T.text2 }}>
            Press <strong style={{ color: T.good }}>Generate brief</strong> to load the {mode === 'match_recap' ? 'Match Recap' : mode === 'half_time' ? 'Half-Time' : mode === 'full_time' ? 'Full-Time' : 'Training'} brief for today.
          </p>
          <p className="text-[11px] mt-2" style={{ color: T.text4 }}>
            Demo: response is canned and arrives after a short artificial delay.
          </p>
        </Card>
      )}

      {loading && (
        <Card>
          <p className="text-sm" style={{ color: T.text2 }}>
            <span className="inline-block animate-pulse" style={{ color: T.good }}>●</span>{' '}
            Composing brief… (demo · canned response)
          </p>
        </Card>
      )}

      {!loading && mode === 'match_recap' && briefs.match_recap && renderMatchRecap(briefs.match_recap)}
      {!loading && mode === 'half_time'   && briefs.half_time   && renderHalfTime(briefs.half_time)}
      {!loading && mode === 'full_time'   && briefs.full_time   && renderFullTime(briefs.full_time)}
      {!loading && mode === 'training'    && briefs.training    && renderTraining(briefs.training)}
    </div>
  )
}
