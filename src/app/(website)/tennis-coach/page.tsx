'use client'

import Link from 'next/link'

// "Ocean" accent — matches the coach portal's blue accent preset (#3A8EE0).
const PURPLE = '#1F6FCC'        // primary (buttons, shadows) — deep ocean
const PURPLE_LIGHT = '#3A8EE0'  // accent (text, highlights) — Ocean
const BG = '#07080F'
const CARD = '#0D1117'
const CARD_ALT = '#111827'
const BORDER = '#1E293B'
const BORDER_ALT = '#1F2937'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const STAT_PILLS = ['9 coach modules', 'AI powered', 'Effort & rewards', 'LTA racket pathway', 'Mobile app']

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '📋', title: 'Session Planner', desc: 'Plan every session in minutes. Overview, Today, This week and This month views over one dated schedule synced from your booking calendar — a confirmed booking becomes a ready-to-build session in two clicks, with a timed run-sheet and kit list generated for you.' },
  { icon: '🤖', title: 'AI Session Review', desc: 'Turn a finished lesson into a structured review. The AI reads the session and returns what went well, what to work on next, and the drills to get there — saved straight to the player’s plan so the next session writes itself.' },
  { icon: '🎾', title: 'Racket Progression reward system', desc: 'The reward system at the heart of Lumio Coach. A clear nine-stage racket pathway — White to Black — tracked against its criteria with progress bars and award thresholds. At every level players earn a coloured racket keyring, a matching dampener and a certificate — with a full trophy at Black — and parents fund the journey: your second revenue stream, built in.' },
  { icon: '⌚', title: 'Effort & Rewards', desc: 'Players track sessions on the smartwatch they already own — no hardware to buy. Effort, movement and consistency scores become XP and effort levels: a motivation layer that keeps them training, kept separate from the technical racket pathway.' },
  { icon: '🎬', title: 'Video & clips', desc: 'Match and training footage with coach annotations via Lumio Vision — saved to each player, by session, so you can review technique together without a third-party analysis stack.' },
  { icon: '👥', title: 'Staff / Coaches', desc: 'Run a club of coaches, not just yourself. A directory with each coach’s calendar, accreditations, specialisms, assigned players and utilisation — the head-coach view of the whole team’s week.' },
  { icon: '🏕️', title: 'Training Camps', desc: 'Build day camps and residential tours: itineraries, attendees, targets and finances, with a one-click AI draft and a per-player camp log that captures progress day by day.' },
  { icon: '🗓️', title: 'Booking Calendar', desc: 'Your whole week across every court — private, group, cardio and match play. The single source of truth that feeds the Session Planner, so the schedule and the plans never drift apart.' },
  { icon: '📱', title: 'Mobile App', desc: 'An app-like experience on the phone — a bottom tab bar, your day at a glance, and the tools you actually reach for on court — wherever you’re coaching that day.' },
]

const INTEGRATIONS = [
  { icon: '⌚', name: 'Apple Watch & Wear OS', desc: 'Effort & XP from the player’s own watch' },
  { icon: '🎬', name: 'Lumio Vision', desc: 'Video clips and annotations' },
  { icon: '🤖', name: 'Claude AI', desc: 'Session reviews and camp drafts' },
  { icon: '🏛️', name: 'LTA Youth Pathway', desc: 'Racket stage mapping' },
  { icon: '💳', name: 'Stripe', desc: 'Bookings and subscriptions' },
  { icon: '💰', name: 'Xero', desc: 'Academy finances' },
  { icon: '📧', name: 'Microsoft 365', desc: 'Email and calendar' },
  { icon: '🔔', name: 'Slack', desc: 'Team and parent updates' },
  { icon: '📱', name: 'Mobile PWA', desc: 'Install on any phone' },
]

const TIERS = [
  { name: 'Head Coach', desc: 'Your whole week and your whole team in one place — Session Planner, the coaches directory, the booking calendar and racket pathways across every player you oversee. The view that runs the club.' },
  { name: 'Coach', desc: 'Plan, run and review your sessions — AI session reviews, video, effort rewards and racket progression for the players you coach. Everything you need on court, on your phone.' },
  { name: 'Academy Manager', desc: 'Run the academy end-to-end — staff, camps, bookings and player development across the club, with utilisation, accreditations and progress at a glance.' },
]

const COACH_PLAN_FEATURES = [
  'Session Planner & AI session reviews',
  'Effort & Rewards + video',
  'Racket Progression pathway',
  'Staff directory & training camps',
  'Booking calendar & payments',
  'Mobile coach app',
]
const PARENT_FEATURES = [
  'Player highlights & clips',
  'Effort rewards & XP',
  'Progress & racket journey',
  'Homework & lesson summaries',
]
// Reward + capture kit. Tracking now uses the player's own smartwatch, so there
// is no GPS hardware — the bundle is the reward keyrings/dampeners/trophy plus
// the video capture stand and mic, framed as a one-off £85 bundle.
const KIT_PARTS = [
  { name: 'Capture stand', note: 'Court stand for phone or tablet' },
  { name: 'Microphone', note: 'Spec under field test' },
  { name: 'Reward keyrings & dampeners — set of 9', note: 'A coloured keyring + matching dampener per level' },
  { name: 'Black-stage trophy', note: 'A full trophy for reaching the top level' },
]

// The real nine-stage racket pathway from the coach portal (coach-data.ts BELTS).
const RACKET_STAGES: Array<{ name: string; theme: string; colour: string }> = [
  { name: 'White', theme: 'Foundations', colour: '#E8EAEE' },
  { name: 'Yellow', theme: 'Rallying', colour: '#E5C76B' },
  { name: 'Orange', theme: 'Net & Touch', colour: '#E08A3C' },
  { name: 'Green', theme: 'The Serve', colour: '#4FAE72' },
  { name: 'Blue', theme: 'Spin & Shape', colour: '#3A8EE0' },
  { name: 'Purple', theme: 'Specialty Shots', colour: '#7c5cbf' },
  { name: 'Brown', theme: 'Weapons', colour: '#9A6B4F' },
  { name: 'Red', theme: 'Tactics', colour: '#C75A5A' },
  { name: 'Black', theme: 'Mastery', colour: '#2A3142' },
]

// ── Mockup chrome ────────────────────────────────────────────────────────────
function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: CARD_ALT, border: `1px solid ${BORDER_ALT}`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 30px 80px ${PURPLE}22` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${BORDER_ALT}`, backgroundColor: '#0B1020' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981' }} />
        </div>
        <div style={{ flex: 1, height: 18, borderRadius: 5, backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}` }} />
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, color, backgroundColor: bg, border: `1px solid ${color}55`, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

function KPI({ value, label, sub, color }: { value: string; label: string; sub?: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${color}55`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: TEXT, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Mockups ──────────────────────────────────────────────────────────────────
function SessionPlannerMockup() {
  const runsheet = [
    { t: '16:00', block: 'Warm-up & movement', kit: '4 cones · ladder' },
    { t: '16:15', block: 'Cross-court rally — depth', kit: 'basket · targets' },
    { t: '16:40', block: 'Serve +1 patterns', kit: 'tube · markers' },
    { t: '17:05', block: 'Match-play points', kit: 'scoreboard' },
  ]
  return (
    <MockupFrame>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {['Overview', 'Today', 'This week', 'This month'].map((t, i) => (
          <span key={t} style={{ fontSize: 9, fontWeight: 800, padding: '5px 10px', borderRadius: 999, backgroundColor: i === 1 ? PURPLE : '#0A0B10', color: i === 1 ? '#fff' : MUTED, border: `1px solid ${i === 1 ? PURPLE : BORDER_ALT}` }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="6" label="Sessions today" color={PURPLE} />
        <KPI value="2 left" label="To build" color="#F59E0B" />
        <KPI value="14" label="Players" color="#10B981" />
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${PURPLE}55`, borderRadius: 10, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>U14 Squad — Court 2</div>
            <div style={{ fontSize: 9, color: MUTED }}>16:00–17:30 · from booking #2381</div>
          </div>
          <Badge color={PURPLE_LIGHT} bg="rgba(58,142,224,0.15)">Run-sheet ready</Badge>
        </div>
        {runsheet.map(r => (
          <div key={r.t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: `1px solid ${BORDER_ALT}` }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: PURPLE_LIGHT, width: 34 }}>{r.t}</span>
            <span style={{ fontSize: 10, color: TEXT, flex: 1 }}>{r.block}</span>
            <span style={{ fontSize: 8, color: MUTED }}>{r.kit}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

function SessionReviewMockup() {
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>🤖 AI Session Review</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Mia Chen · U12 private · Wed 16:00 · Green stage</div>
      <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#10B981', marginBottom: 4 }}>✓ WHAT WENT WELL</div>
        <div style={{ fontSize: 9.5, color: MUTED, lineHeight: 1.5 }}>Consistent toss height on the serve; first-serve contact point much improved over last two sessions.</div>
      </div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B', marginBottom: 4 }}>◎ WORK ON NEXT</div>
        <div style={{ fontSize: 9.5, color: MUTED, lineHeight: 1.5 }}>Racket-drop on the second serve; tends to rush under pressure at deuce.</div>
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${PURPLE}55`, borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: PURPLE_LIGHT, marginBottom: 6 }}>🎯 DRILLS FOR NEXT SESSION</div>
        {['Shadow serve — slow racket drop ×20', 'Second-serve targets, deuce court', 'Pressure points: 30-40 serve game'].map(d => (
          <div key={d} style={{ display: 'flex', gap: 6, fontSize: 9.5, color: TEXT, padding: '3px 0' }}>
            <span style={{ color: PURPLE_LIGHT, fontWeight: 900 }}>›</span>{d}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 8.5, color: MUTED, marginTop: 8, fontStyle: 'italic' }}>Saved to Mia’s plan — auto-loaded into next week’s session.</div>
    </MockupFrame>
  )
}

function RacketProgressionMockup() {
  // current player sits at Green (index 3): first four awarded, Green in progress.
  const current = 3
  return (
    <MockupFrame>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>🎾🏆 Racket Progression</div>
        <Badge color={PURPLE_LIGHT} bg="rgba(58,142,224,0.15)">4 of 9 awarded</Badge>
      </div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>Mia Chen · pathway White → Black</div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
        {RACKET_STAGES.map((s, i) => (
          <div key={s.name} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 26, borderRadius: 5, backgroundColor: s.colour, opacity: i <= current ? 1 : 0.28, border: i === current ? `2px solid ${PURPLE_LIGHT}` : '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: i <= 1 ? '#1a1d29' : '#fff', fontWeight: 900 }}>
              {i < current ? '✓' : i === current ? '★' : ''}
            </div>
            <div style={{ fontSize: 6.5, color: i === current ? PURPLE_LIGHT : MUTED, marginTop: 3, fontWeight: i === current ? 800 : 600 }}>{s.name}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${PURPLE}55`, borderRadius: 10, padding: 10, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>Green Racket · The Serve</span>
          <span style={{ fontSize: 9, color: '#10B981', fontWeight: 800 }}>78% to award</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, backgroundColor: '#1F2937', marginBottom: 8 }}>
          <div style={{ width: '78%', height: '100%', borderRadius: 3, backgroundColor: '#4FAE72' }} />
        </div>
        {[['Flat & slice serve', 'Mastered'], ['Serve placement — wide/T', 'Consistent'], ['Second-serve spin', 'Developing']].map(([skill, lvl]) => (
          <div key={skill} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, padding: '3px 0' }}>
            <span style={{ color: MUTED }}>{skill}</span>
            <span style={{ color: lvl === 'Mastered' ? '#10B981' : lvl === 'Consistent' ? PURPLE_LIGHT : '#F59E0B', fontWeight: 700 }}>{lvl}</span>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: 'rgba(31,111,204,0.12)', border: `1px solid ${PURPLE}55`, borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: TEXT, fontWeight: 700 }}>🏆 Award keyring + dampener + certificate</span>
        <span style={{ fontSize: 8.5, color: MUTED }}>parents fund the journey</span>
      </div>
    </MockupFrame>
  )
}

function EffortRewardsMockup() {
  const scores = [{ l: 'Effort', v: 82, c: '#10B981' }, { l: 'Movement', v: 64, c: '#F59E0B' }, { l: 'Consistency', v: 91, c: PURPLE }]
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>⌚ Effort &amp; Rewards</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Mia Chen · last session · Apple Watch</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, background: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: '9px 11px' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total XP</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: PURPLE_LIGHT, lineHeight: 1 }}>1,840</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: MUTED, marginBottom: 3 }}>
            <span style={{ color: TEXT, fontWeight: 800 }}>🏅 Competitor</span><span>Next: Athlete</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#1F2937' }}><div style={{ width: '68%', height: '100%', borderRadius: 3, background: PURPLE }} /></div>
        </div>
      </div>
      {scores.map(s => (
        <div key={s.l} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: MUTED }}>
            <span>{s.l}</span><span style={{ color: s.c, fontWeight: 800 }}>{s.v}/100</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, backgroundColor: '#1F2937', marginTop: 2 }}>
            <div style={{ width: `${s.v}%`, height: '100%', borderRadius: 3, backgroundColor: s.c }} />
          </div>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 6 }}>
        <KPI value="52 min" label="Duration" color={PURPLE} />
        <KPI value="+72" label="XP earned" color={PURPLE_LIGHT} />
      </div>
    </MockupFrame>
  )
}

function StaffMockup() {
  const coaches = [
    { name: 'Dave Askew', role: 'Head Coach', util: 92, c: '#EF4444', spec: 'Performance · LTA Accredited+' },
    { name: 'Elena Russo', role: 'Coach', util: 74, c: '#F59E0B', spec: 'Mini tennis · serve' },
    { name: 'James Okafor', role: 'Coach', util: 61, c: '#10B981', spec: 'Cardio · groups' },
    { name: 'Priya Sharma', role: 'Assistant', util: 48, c: '#10B981', spec: 'Foundations · U10' },
  ]
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 10 }}>👥 Coaches Directory</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        <KPI value="4" label="Coaches" color={PURPLE} />
        <KPI value="69%" label="Avg utilisation" color="#F59E0B" />
        <KPI value="2" label="Certs expiring" sub="next 90 days" color="#EF4444" />
      </div>
      {coaches.map(c => (
        <div key={c.name} style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10, marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>{c.name}</div>
              <div style={{ fontSize: 8.5, color: PURPLE_LIGHT }}>{c.role} · {c.spec}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 900, color: c.c }}>{c.util}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, backgroundColor: '#1F2937' }}>
            <div style={{ width: `${c.util}%`, height: '100%', borderRadius: 2, backgroundColor: c.c }} />
          </div>
        </div>
      ))}
    </MockupFrame>
  )
}

function CampMockup() {
  return (
    <MockupFrame>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>🏕️ Easter Performance Camp</div>
        <Badge color="#10B981" bg="rgba(16,185,129,0.15)">AI draft ready</Badge>
      </div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>4 days · 24 players · 3 courts</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="24" label="Attendees" color={PURPLE} />
        <KPI value="£4,320" label="Revenue" color="#10B981" />
        <KPI value="£1,180" label="Margin" color={PURPLE_LIGHT} />
      </div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Day 1 itinerary</div>
        {[['09:00', 'Warm-up & movement screen'], ['10:00', 'Serve clinic — by stage'], ['12:00', 'Lunch & video review'], ['14:00', 'Match-play ladder']].map(([t, b]) => (
          <div key={t} style={{ display: 'flex', gap: 8, padding: '3px 0', borderTop: `1px solid ${BORDER_ALT}` }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: PURPLE_LIGHT, width: 32 }}>{t}</span>
            <span style={{ fontSize: 9.5, color: MUTED }}>{b}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

// ── Spotlight wrapper ─────────────────────────────────────────────────────────
function Spotlight({ eyebrow, title, body, bullets, mockup, reverse, altBg }: {
  eyebrow: string; title: string; body: string; bullets: string[]; mockup: React.ReactNode; reverse?: boolean; altBg?: boolean
}) {
  return (
    <section style={{ padding: '96px 24px', backgroundColor: altBg ? '#0A0C14' : BG }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div style={{ order: reverse ? 2 : 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, marginBottom: 16, lineHeight: 1.1 }}>{title}</h2>
          <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>{body}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map(b => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: TEXT }}>
                <span style={{ color: PURPLE_LIGHT, fontWeight: 900, flexShrink: 0 }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ order: reverse ? 1 : 2 }}>{mockup}</div>
      </div>
    </section>
  )
}

export default function TennisCoachPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <section style={{ padding: '128px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${PURPLE}33, transparent 50%), radial-gradient(circle at 80% 60%, ${PURPLE_LIGHT}22, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: PURPLE_LIGHT, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO TENNIS COACH
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
            One platform.<br />
            <span style={{ color: PURPLE_LIGHT }}>Two revenue streams.</span>
          </h1>
          <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, maxWidth: 840, margin: '0 auto 32px' }}>
            The all-in-one platform that runs your whole tennis academy — session planning, AI reviews, video and smartwatch effort rewards — and pays you back through <strong style={{ color: TEXT }}>the Racket Progression reward system</strong>: a nine-stage pathway where players collect a coloured racket keyring and dampener at each level — a full trophy at Black — and parents fund the journey.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0 32px' }}>
            <span style={{ background: '#1f6fcc18', border: `1px solid ${PURPLE}`, color: PURPLE_LIGHT, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>🎾🏆 Racket Progression reward system</span>
            <span style={{ background: '#06b6d418', border: '1px solid #06b6d4', color: '#06b6d4', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>🤖 AI Session Review</span>
            <span style={{ background: '#10b98118', border: '1px solid #10b981', color: '#10b981', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>⌚ Effort &amp; Rewards</span>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/sports-signup?sport=tennis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PURPLE}66` }}>
              Apply for free founding access →
            </Link>
            <Link href="/tennis/coach/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Try the demo →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STAT_PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(31,111,204,0.12)', border: `1px solid ${PURPLE}66`, color: PURPLE_LIGHT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVENUE HIGHLIGHT PANEL ── */}
      <section style={{ padding: '0 24px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #0a1628 50%, #061020 100%)', border: `1px solid ${PURPLE}30`, borderRadius: 24, padding: '64px 48px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: `radial-gradient(circle, ${PURPLE}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ marginBottom: 24 }}>
                <span style={{ background: PURPLE, color: '#fff', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>💸 One platform. Two revenue streams.</span>
              </div>
              <h2 style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 16, maxWidth: 760, lineHeight: 1.2 }}>The software runs your academy.<br /><span style={{ color: PURPLE_LIGHT }}>The Racket Progression reward system pays you back.</span></h2>
              <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 720, lineHeight: 1.7, marginBottom: 48 }}>One simple subscription runs every part of your week. Then it earns its keep twice over — you award a coloured racket keyring and matching dampener (and a trophy at Black) as players climb the nine-stage pathway and parents fund the journey, and you resell the Student app to your families as recurring margin. You set the prices; you keep the upside.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
                {[
                  { icon: '🎾🏆', title: 'Stream 1 — Racket rewards', color: PURPLE_LIGHT, desc: 'Award a coloured racket keyring + matching dampener + certificate at each of the 9 stages — and a full trophy at Black. Players collect the set; parents pay for the journey. Reorder sets as you award them.', price: 'Reorder set of 9 · £50 (~£5.50 each)' },
                  { icon: '📱', title: 'Stream 2 — Student app resale', color: '#06b6d4', desc: 'Give families the player & parent view of everything you capture. Resell it or bundle it into a package — you keep the margin, not Lumio.', price: 'Suggested £9.99/family · you set it' },
                  { icon: '🧩', title: 'One subscription', color: '#10b981', desc: 'Pick the tier that fits — Essential to Elite — adding video, audio, effort rewards and the racket pathway as you grow. The platform that makes both revenue streams possible.', price: 'From £19/month · 4 tiers' },
                ].map((f, i) => (
                  <div key={i} style={{ background: `${f.color}10`, border: `1px solid ${f.color}30`, borderRadius: 16, padding: 28 }}>
                    <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                    <h3 style={{ color: f.color, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
                    <div style={{ marginTop: 16, color: f.color, fontSize: 13, fontWeight: 600 }}>{f.price}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link href="/sports-signup?sport=tennis" style={{ background: PURPLE, color: '#fff', padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>Apply for founding access →</Link>
                <a href="#pricing" style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: PURPLE_LIGHT, padding: '14px 32px', borderRadius: 999, fontWeight: 700, fontSize: 15, border: `1px solid ${PURPLE}`, textDecoration: 'none' }}>See the numbers →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Built for tennis coaches and academies.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Nine modules that take you from the booking to the lesson to the review — and from a single coach to a whole academy. One platform, two revenue streams, with the Racket Progression reward system at its heart.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(f => {
              const featured = f.title === 'Racket Progression reward system'
              return (
                <div key={f.title} style={{ backgroundColor: CARD, border: `1px solid ${featured ? PURPLE : BORDER}`, borderRadius: 16, padding: 24, boxShadow: featured ? `0 0 0 1px ${PURPLE}55, 0 20px 50px ${PURPLE}22` : undefined }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHTS ── */}
      <Spotlight
        eyebrow="SPOTLIGHT · SESSION PLANNER"
        title="Plan your whole week in minutes."
        body="Overview, Today, This week and This month views sit over one dated schedule synced from your booking calendar. A confirmed booking becomes a ready-to-build session in two clicks — with a timed run-sheet and kit list generated for you."
        bullets={['One schedule fed straight from your bookings', 'Booking → ready-to-build session in two clicks', 'Timed run-sheet and kit list auto-generated', 'Today / week / month views over the same data']}
        mockup={<SessionPlannerMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · AI SESSION REVIEW"
        title="The next session writes itself."
        body="Turn a finished lesson into a structured review. The AI reads the session and returns what went well, what to work on next, and the drills to get there — saved straight to the player's plan so you walk on court next week already prepared."
        bullets={["What went well · work on next · drills to get there", "Saved straight to the player's development plan", 'Auto-loaded into next week’s session', 'Written in an LTA coaching tone']}
        mockup={<SessionReviewMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · RACKET PROGRESSION REWARD SYSTEM"
        title="A reward system that pays you back."
        body="A clear nine-stage racket pathway — White to Black — tracked against its criteria with progress bars and award thresholds, so players and parents always know exactly what's next. As students pass each level, you award a coloured racket keyring, a matching dampener and a certificate — and a full trophy when they reach Black: your second revenue stream, built right into the product."
        bullets={['Nine stages — White, Yellow, Orange … to Black', 'Skills tracked: Learning → Developing → Consistent → Mastered', 'Award thresholds and progress bars per player', 'Trophy racket + certificate at each level — parents fund the journey']}
        mockup={<RacketProgressionMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · EFFORT & REWARDS"
        title="Turn every session into XP — no hardware to buy."
        body="Players track sessions on the smartwatch they already own. Effort, movement and consistency become scores, XP and effort levels, with a squad leaderboard to keep them coming back. It's estimated effort — a motivation layer that sits alongside the technical racket pathway, never replacing it, and it never tracks a player's position on court."
        bullets={['Effort, movement & consistency scores from the player’s own watch', 'XP, effort levels and a squad leaderboard', 'No GPS units or hardware — uses Apple Watch or Wear OS', 'Kept separate from the LTA-mapped Racket Progression pathway']}
        mockup={<EffortRewardsMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · STAFF & COACHES"
        title="Run a club of coaches, not just yourself."
        body="A directory with each coach's calendar, accreditations, specialisms, assigned players and utilisation — the head-coach view of the whole team's week. See who's busy, who has room, and which certifications are about to expire."
        bullets={['Per-coach calendar, specialisms and assigned players', 'Utilisation across the whole team at a glance', 'Accreditation and certification expiry alerts', 'The head-coach view of the academy week']}
        mockup={<StaffMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · TRAINING CAMPS"
        title="Day camps and tours, drafted by AI."
        body="Build day camps and residential tours: itineraries, attendees, targets and finances, with a one-click AI draft to get you started and a per-player camp log that captures progress day by day — and shows you the margin before you publish."
        bullets={['Itineraries, attendees, targets and finances in one place', 'One-click AI draft for the whole camp', 'Per-player camp log captures progress day by day', 'Revenue and margin visible before you publish']}
        mockup={<CampMockup />}
      />

      {/* ── WHO IT'S FOR ── */}
      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Who it&apos;s for.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ backgroundColor: CARD, border: `1px solid ${PURPLE}`, borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>ROLE</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: TEXT, marginBottom: 12 }}>{t.name}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Lumio Tennis Coach — built-in and connected.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 8, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
            The capture, intelligence and admin you need — already wired into the portal.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 48 }}>
            {INTEGRATIONS.map(i => (
              <div key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 26 }}>{i.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{i.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '96px 24px', backgroundColor: BG, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: PURPLE_LIGHT, textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>PRICING</div>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            One platform. Two revenue streams.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', maxWidth: 780, margin: '0 auto 56px', lineHeight: 1.6 }}>
            A simple subscription runs your whole academy. The kit gets you capturing from day one — and the Racket Progression reward system turns player progress into recurring income you control.
          </p>

          {/* Plan tiers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 20 }}>
            {[
              { name: 'Essential', price: 19, popular: false, available: true, tag: 'Subscription only · no kit', feats: ['Session Planner & bookings', 'Player roster & lesson summaries', 'Staff & training camps', 'Mobile coach app'], off: ['No video, audio or effort rewards', 'No Racket Progression'] },
              { name: 'Pro Lite', price: 29, popular: false, available: false, tag: 'Adds the reward system', feats: ['Everything in Essential', 'Racket Progression reward system', 'Trophy keyrings, dampeners & certificates'], off: ['No video, audio or effort rewards'] },
              { name: 'Pro', price: 39, popular: true, available: false, tag: 'Most popular', feats: ['Everything in Pro Lite', 'Video & audio + AI session reviews', 'Effort & Rewards (smartwatch, no hardware)'], off: [] },
              { name: 'Elite', price: 59, popular: false, available: false, tag: 'The full system', feats: ['Everything in Pro', 'Squad effort leaderboard & XP analytics', 'Priority onboarding & support'], off: [] },
            ].map(t => (
              <div key={t.name} style={{ backgroundColor: CARD, border: `${t.popular ? 2 : 1}px solid ${t.popular ? PURPLE : BORDER}`, borderRadius: 16, padding: 24, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {t.popular && <div style={{ position: 'absolute', top: -11, left: 24, background: PURPLE, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most popular</div>}
                <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, margin: '8px 0 2px' }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: TEXT, lineHeight: 1 }}>£{t.price}</span>
                  <span style={{ fontSize: 14, color: MUTED, fontWeight: 600 }}>/month</span>
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>{t.tag}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {t.feats.map(f => <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXT }}><span style={{ color: PURPLE_LIGHT, fontWeight: 900, flexShrink: 0 }}>✓</span>{f}</li>)}
                  {t.off.map(f => <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: MUTED }}><span style={{ color: MUTED, fontWeight: 900, flexShrink: 0 }}>—</span>{f}</li>)}
                </ul>
                {t.available ? (
                  <Link href="/sports-signup?sport=tenniscoach" style={{ marginTop: 'auto', display: 'block', textAlign: 'center', padding: '11px 18px', borderRadius: 11, backgroundColor: PURPLE, color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>Choose {t.name} →</Link>
                ) : (
                  <div style={{ marginTop: 'auto', display: 'block', textAlign: 'center', padding: '11px 18px', borderRadius: 11, backgroundColor: 'transparent', color: MUTED, border: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 800, cursor: 'default' }}>Coming soon</div>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: MUTED, textAlign: 'center', margin: '0 0 40px' }}>Founding access — free for 3 months on any tier. Kit sold separately; Essential needs no kit.</p>

          {/* A — Student add-on (second revenue stream) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
            {/* Parent / Student access — coach-resold add-on */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 32 }}>
              <div style={{ marginBottom: 14 }}><span style={{ display: 'inline-block', background: '#ffffff12', border: `1px solid ${BORDER}`, color: MUTED, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>⏳ Coming soon</span></div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#06b6d4', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Suggested add-on</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: TEXT, lineHeight: 1 }}>£9.99</span>
                <span style={{ fontSize: 15, color: MUTED, fontWeight: 600 }}>/month per family</span>
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16, fontStyle: 'italic' }}>suggested price — you set it</div>
              <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.6, marginBottom: 20 }}>
                Give your families the Student app — the player &amp; parent view of everything you capture. Resell it or bundle it into a package: <strong style={{ color: TEXT }}>you keep the margin.</strong>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                {PARENT_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: TEXT, padding: '6px 0' }}>
                    <span style={{ color: '#06b6d4', fontWeight: 900 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <div style={{ background: '#06b6d410', border: '1px solid #06b6d433', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
                A revenue stream <strong style={{ color: TEXT }}>for you</strong> — not a Lumio charge to your parents. Give your families the journey; keep the recurring margin.
              </div>
            </div>
          </div>

          {/* B — Lumio Coach Kit */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}><span style={{ display: 'inline-block', background: '#ffffff12', border: `1px solid ${BORDER}`, color: MUTED, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>⏳ Coming soon</span></div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div style={{ maxWidth: 560 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Lumio Coach Kit</div>
                <h3 style={{ fontSize: 26, fontWeight: 900, color: TEXT, marginBottom: 8, lineHeight: 1.15 }}>Everything you need to start capturing.</h3>
                <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.6 }}>The capture stand, microphone, your first set of reward keyrings &amp; dampeners and the Black-stage trophy — one bundle, out of the box and onto the court. Effort tracking uses the player’s own smartwatch, so there’s no tracker to buy.</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: TEXT, lineHeight: 1 }}>£85</span>
                </div>
                <div style={{ fontSize: 12.5, color: MUTED }}>full kit · one-off</div>
              </div>
            </div>
            <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '8px 18px', marginBottom: 16 }}>
              {KIT_PARTS.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: PURPLE_LIGHT, fontWeight: 900, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: TEXT, flexShrink: 0 }}>{p.name}</span>
                  <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>{p.note}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0 4px' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full kit total</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: PURPLE_LIGHT }}>£85</span>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: MUTED, fontStyle: 'italic' }}>
              Kit pricing is indicative while we field-test the capture stand and microphone — final spec and price may change.
            </div>
          </div>

          {/* B2 — Trophy racket reorder / reward system */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${PURPLE}`, borderRadius: 16, padding: 32, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 44 }}>🎾🏆</div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ marginBottom: 10 }}><span style={{ display: 'inline-block', background: '#ffffff12', border: `1px solid ${BORDER}`, color: MUTED, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>⏳ Coming soon</span></div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 8 }}>The Racket Progression reward system</h3>
              <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.6 }}>
                As students pass each level, you award a coloured <strong style={{ color: TEXT }}>racket keyring + matching dampener + certificate</strong> — with a full trophy at Black. Players collect the set; parents pay for the journey. Reorder sets as you award them — a consumable reward that keeps families invested.
              </p>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 34, fontWeight: 900, color: TEXT, lineHeight: 1 }}>£50</div>
              <div style={{ fontSize: 12.5, color: MUTED }}>reorder set of 9 · ~£5.50 each</div>
            </div>
          </div>

          {/* C — Commercial story */}
          <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
            <h3 style={{ fontSize: 26, fontWeight: 900, color: TEXT, marginBottom: 12 }}>Two revenue streams the coach drives.</h3>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 28 }}>
              The platform runs your academy and the kit gets you started. Then it pays you back twice over: <strong style={{ color: TEXT }}>award racket keyrings &amp; dampeners</strong> (and a trophy at Black) as players progress and parents fund the journey, and <strong style={{ color: TEXT }}>resell the Student app</strong> to your families as recurring margin. You set the prices; you keep the upside.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/sports-signup?sport=tennis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 30px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: `0 16px 40px ${PURPLE}55` }}>
                Apply for founding access →
              </Link>
              <Link href="/tennis/coach/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 30px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 15, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
                Try the demo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            Everything a tennis coach needs. One portal.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            Explore the live demo — no signup, no account needed. Plan a session, run an AI review, and see the Racket Progression reward system for yourself.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <Link href="/sports-signup?sport=tennis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PURPLE}66` }}>
              Apply for free founding access →
            </Link>
            <Link href="/tennis/coach/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Try the demo →
            </Link>
          </div>
          <p style={{ fontSize: 12, color: MUTED, opacity: 0.7 }}>Demo academy · All player data is illustrative · Effort rewards via the player’s own smartwatch · video via Lumio Vision</p>
        </div>
      </section>
    </div>
  )
}
