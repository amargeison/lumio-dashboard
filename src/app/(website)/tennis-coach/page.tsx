'use client'

import Link from 'next/link'

const PURPLE = '#7C3AED'
const PURPLE_LIGHT = '#A855F7'
const BG = '#07080F'
const CARD = '#0D1117'
const BORDER = '#1E293B'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const STAT_PILLS = ['9 coach modules', 'AI powered', 'GPS + Vision', 'LTA racket pathway', 'Mobile app']

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '📋', title: 'Session Planner', desc: 'Plan every session in minutes. Overview, Today, This week and This month views over one dated schedule synced from your booking calendar — a confirmed booking becomes a ready-to-build session in two clicks, with a timed run-sheet and kit list generated for you.' },
  { icon: '🤖', title: 'AI Session Review', desc: 'Turn a finished lesson into a structured review. The AI reads the session and returns what went well, what to work on next, and the drills to get there — saved straight to the player’s plan so the next session writes itself.' },
  { icon: '🎾', title: 'Racket Progression', desc: 'A clear skill pathway for every player. Track each racket stage against its criteria with progress bars and award thresholds — so players and parents always know exactly what’s next.' },
  { icon: '🛰️', title: 'GPS & Video', desc: 'Player movement and match or training footage in one place. Lumio GPS Tracker and Lumio Vision give you load, court coverage and clips with coach annotations — no third-party analysis stack to wire up.' },
  { icon: '🔥', title: 'Heatmaps', desc: 'Court coverage, serve placement, returns and rally, winners and errors, sprint and speed, and weekly load — paginated into clean tabs per player, by session and by surface.' },
  { icon: '👥', title: 'Staff / Coaches', desc: 'Run a club of coaches, not just yourself. A directory with each coach’s calendar, accreditations, specialisms, assigned players and utilisation — the head-coach view of the whole team’s week.' },
  { icon: '🏕️', title: 'Training Camps', desc: 'Build day camps and residential tours: itineraries, attendees, targets and finances, with a one-click AI draft and a per-player camp log that captures progress day by day.' },
  { icon: '🗓️', title: 'Booking Calendar', desc: 'Your whole week across every court — private, group, cardio and match play. The single source of truth that feeds the Session Planner, so the schedule and the plans never drift apart.' },
  { icon: '📱', title: 'Mobile App', desc: 'An app-like experience on the phone — a bottom tab bar, your day at a glance, and the tools you actually reach for on court — wherever you’re coaching that day.' },
]

const TIERS = [
  { name: 'Head Coach', desc: 'Your whole week and your whole team in one place — Session Planner, the coaches directory, the booking calendar and racket pathways across every player you oversee. The view that runs the club.' },
  { name: 'Coach', desc: 'Plan, run and review your sessions — AI session reviews, GPS & video, heatmaps and racket progression for the players you coach. Everything you need on court, on your phone.' },
  { name: 'Academy Manager', desc: 'Run the academy end-to-end — staff, camps, bookings and player development across the club, with utilisation, accreditations and progress at a glance.' },
]

export default function TennisCoachPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <section style={{ padding: '128px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${PURPLE}33, transparent 50%), radial-gradient(circle at 80% 60%, ${PURPLE_LIGHT}22, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tennis_coach_logo.png" alt="Lumio Coach — Tennis" style={{ height: 72, width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 24px' }} />
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: PURPLE_LIGHT, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO COACH · TENNIS
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
            The all-in-one platform<br />
            <span style={{ color: PURPLE_LIGHT }}>for tennis coaches.</span>
          </h1>
          <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, maxWidth: 820, margin: '0 auto 32px' }}>
            Session planning, AI session reviews, GPS &amp; video, racket progression and a full coaches directory — everything a coach or academy needs to run their week, in one portal.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0 32px' }}>
            <span style={{ background: '#7c3aed18', border: `1px solid ${PURPLE}`, color: PURPLE_LIGHT, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>🤖 AI Session Review</span>
            <span style={{ background: '#06b6d418', border: '1px solid #06b6d4', color: '#06b6d4', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>🛰️ Lumio GPS + Vision</span>
            <span style={{ background: '#10b98118', border: '1px solid #10b981', color: '#10b981', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>🔥 Heatmaps</span>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/sports-signup?sport=tennis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PURPLE}66` }}>
              Apply for free founding access →
            </Link>
            <Link href="/coach/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Try the demo →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STAT_PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(124,58,237,0.1)', border: `1px solid ${PURPLE}66`, color: PURPLE_LIGHT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
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
            Nine modules that take you from the booking to the lesson to the review — and from a single coach to a whole academy. Everything in one place.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            Everything a tennis coach needs. One portal.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            Explore the live demo — no signup, no account needed. Plan a session, run an AI review, and see the coaches directory for yourself.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <Link href="/sports-signup?sport=tennis" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PURPLE}66` }}>
              Apply for free founding access →
            </Link>
            <Link href="/coach/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Try the demo →
            </Link>
          </div>
          <p style={{ fontSize: 12, color: MUTED, opacity: 0.7 }}>Demo academy · All player data is illustrative · GPS &amp; video integration via Lumio GPS Tracker + Lumio Vision</p>
        </div>
      </section>
    </div>
  )
}
