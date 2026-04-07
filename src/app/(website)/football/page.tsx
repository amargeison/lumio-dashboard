'use client'

import Link from 'next/link'
import { useRef } from 'react'

const BG = '#07080F'
const CARD_BG = '#0D1117'
const BORDER = '#1E293B'
const ACCENT = '#10B981'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'
const MOCK_BG = '#111827'
const MOCK_BORDER = '#1F2937'

function BrowserFrame({ children, height }: { children: React.ReactNode; height?: number }) {
  return (
    <div
      style={{
        background: MOCK_BG,
        border: `1px solid ${MOCK_BORDER}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderBottom: `1px solid ${MOCK_BORDER}`,
          background: '#0B1220',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
        <div
          style={{
            marginLeft: 10,
            flex: 1,
            height: 18,
            borderRadius: 4,
            background: '#0F172A',
            border: `1px solid ${MOCK_BORDER}`,
          }}
        />
      </div>
      <div style={{ padding: 16, minHeight: height || 280 }}>{children}</div>
    </div>
  )
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: 24,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ color: TEXT, fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.55, margin: 0 }}>{body}</p>
    </div>
  )
}

function Tick() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)',
        border: `1px solid ${ACCENT}`,
        color: ACCENT,
        fontSize: 12,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      ✓
    </span>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map(it => (
        <li key={it} style={{ display: 'flex', alignItems: 'center', gap: 12, color: TEXT, fontSize: 15 }}>
          <Tick />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function SpotlightSection({
  flip,
  background,
  text,
  mockup,
}: {
  flip?: boolean
  background: string
  text: React.ReactNode
  mockup: React.ReactNode
}) {
  return (
    <section style={{ background, padding: '120px 24px' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}
      >
        <div style={{ order: flip ? 2 : 1 }}>{text}</div>
        <div style={{ order: flip ? 1 : 2 }}>{mockup}</div>
      </div>
    </section>
  )
}

export default function FootballLanding() {
  const featuresRef = useRef<HTMLDivElement>(null)

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const features = [
    { icon: '⚽', title: 'Squad Management', body: 'FIFA-style player cards, fitness tracking, contract status, injury log. Your entire squad at a glance.' },
    { icon: '📊', title: 'Club Intelligence Insights', body: 'Role-specific dashboards for Director of Football, Head Coach, Commercial Director. Everyone sees what matters to them.' },
    { icon: '🏦', title: 'Board Suite', body: 'League position, squad value, revenue breakdown, wage bill. Board-ready reports generated automatically.' },
    { icon: '💰', title: 'Finance & PSR', body: 'Real-time PSR compliance tracking. 3-year rolling loss calculation, what-if transfer calculator. Never get caught out.' },
    { icon: '🎯', title: 'Set Pieces', body: '90+ attacking and defending routines. Interactive pitch diagrams. Share with coaching staff instantly.' },
    { icon: '📡', title: 'GPS & Performance', body: 'Catapult and STATSports integration. Load monitoring, ACWR injury risk scoring, recovery tracking.' },
    { icon: '🎙️', title: 'Media & PR', body: 'Press conference scheduler, media request management, social media analytics. All coordinated in one place.' },
    { icon: '🔍', title: 'Scouting & Transfers', body: 'Wyscout integration, opposition analysis, recruitment pipeline, agent contacts. Find your next signing faster.' },
    { icon: '🤖', title: 'AI Morning Briefing', body: 'Every morning, Lumio reads your data and briefs your Club Director in plain English. Injuries, fixtures, financials, transfer targets.' },
  ]

  const integrations: Array<[string, string, string]> = [
    ['⚡', 'StatsBomb', 'Match data and open data'],
    ['📹', 'Wyscout', 'Video and scouting database'],
    ['📡', 'Catapult', 'GPS and athlete tracking'],
    ['📊', 'Opta', 'Live statistics feed'],
    ['🏃', 'STATSports', 'Player load monitoring'],
    ['📋', 'The FA', 'Registration and compliance'],
    ['🎥', 'Hudl', 'Video analysis'],
    ['💰', 'Xero', 'Financial management'],
    ['📱', 'WhatsApp Business', 'Team communications'],
    ['🔔', 'Slack', 'Staff notifications'],
    ['📧', 'Microsoft 365', 'Email and calendar'],
    ['🤖', 'Claude AI', 'Intelligence and briefings'],
  ]

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          padding: '80px 24px 60px',
          background: `radial-gradient(circle at 20% 10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(circle at 80% 30%, rgba(16,185,129,0.10), transparent 55%), ${BG}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/football_logo.png" alt="Lumio Football" style={{ width: 80, height: 80, marginBottom: 24 }} />
        <div style={{ color: ACCENT, fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
          Lumio Football Portal
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 7vw, 84px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0, maxWidth: 1100 }}>
          The operating system for{' '}
          <span style={{ color: ACCENT }}>professional football clubs.</span>
        </h1>
        <p style={{ color: MUTED, fontSize: 20, lineHeight: 1.6, maxWidth: 760, marginTop: 28 }}>
          From League Two to the Championship. PSR compliance, squad intelligence, board reporting, set pieces, GPS tracking — one platform, built for football people.
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/football/afc-wimbledon"
            style={{ background: ACCENT, color: '#04140C', fontWeight: 800, fontSize: 17, padding: '18px 36px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 14px 40px rgba(16,185,129,0.35)' }}
          >
            Try the demo →
          </Link>
          <button
            onClick={scrollToFeatures}
            style={{ background: 'transparent', color: TEXT, fontWeight: 700, fontSize: 17, padding: '18px 32px', borderRadius: 12, border: `1px solid ${BORDER}`, cursor: 'pointer' }}
          >
            See all features ↓
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 56, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['300+ features', 'PSR compliant', 'AI powered', 'GPS integrated', 'StatsBomb ready'].map(p => (
            <span key={p} style={{ padding: '10px 18px', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 999, fontSize: 13, fontWeight: 600, color: TEXT }}>
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────── */}
      <section ref={featuresRef} style={{ padding: '120px 24px', background: BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, textAlign: 'center', margin: 0, letterSpacing: '-0.02em' }}>
            Everything your club needs. <span style={{ color: ACCENT }}>In one place.</span>
          </h2>
          <p style={{ color: MUTED, fontSize: 18, textAlign: 'center', maxWidth: 720, margin: '20px auto 60px' }}>
            Nine connected modules. One source of truth. Built specifically for the people who run football clubs.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT 1 — Club Intelligence ────────────────── */}
      <SpotlightSection
        background="#0A0C12"
        text={
          <div>
            <div style={{ color: ACCENT, fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Club Intelligence
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Every role. <span style={{ color: ACCENT }}>One platform.</span>
            </h2>
            <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.7, marginTop: 20 }}>
              The Director of Football sees PSR headroom and transfer budget. The Head Coach sees fitness and set pieces. The Commercial Director sees revenue and sponsorship. Same data. Different views.
            </p>
            <BulletList items={['8 role-specific dashboard views', 'Real-time data across all departments', 'AI-generated morning briefing per role', 'Board pack generator']} />
          </div>
        }
        mockup={
          <BrowserFrame>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {['Director of Football', 'Chairman/CEO', 'Head Coach', 'Head of Medical', 'Head of Recruitment'].map((t, i) => (
                <span key={t} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: i === 0 ? 'rgba(16,185,129,0.15)' : '#0F172A', border: `1px solid ${i === 0 ? ACCENT : MOCK_BORDER}`, color: i === 0 ? ACCENT : MUTED }}>
                  {t}
                </span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[['League Position', '8th'], ['Squad Value', '£34.2m'], ['PSR Headroom', '-£2.1m'], ['Days to Window', '11d']].map(([label, val]) => (
                <div key={label} style={{ background: '#0B1220', border: `1px solid ${MOCK_BORDER}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  <div style={{ color: TEXT, fontSize: 22, fontWeight: 800, marginTop: 6 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: 14, background: '#0B1220', borderRadius: 10, border: `1px solid ${MOCK_BORDER}` }}>
              <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, marginBottom: 6 }}>🤖 MORNING BRIEFING</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                Two players returning to training today. PSR window narrowing — recommend deferring the Watson approach. Saturday opponent has conceded 6 set-piece goals.
              </div>
            </div>
          </BrowserFrame>
        }
      />

      {/* ── SPOTLIGHT 2 — Finance & PSR ────────────────────── */}
      <SpotlightSection
        background={BG}
        flip
        text={
          <div>
            <div style={{ color: ACCENT, fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Finance & PSR
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              PSR compliance. <span style={{ color: ACCENT }}>In real time.</span>
            </h2>
            <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.7, marginTop: 20 }}>
              One formula error in a spreadsheet could cost your club points. Lumio tracks your 3-year rolling loss automatically, flags risk the moment it appears, and models the impact of every transfer before you make it.
            </p>
            <BulletList items={['Live PSR status: Safe / Monitor / At Risk', 'What-If transfer calculator', 'Revenue attribution by category', 'Export-ready board financial pack']} />
          </div>
        }
        mockup={
          <BrowserFrame>
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.5)', color: '#F59E0B', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 14 }}>
              ⚠ PSR STATUS: MONITOR
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: MUTED, fontSize: 12 }}>3-Year Rolling Loss</span>
              <span style={{ color: TEXT, fontSize: 14, fontWeight: 700 }}>£20.7m / £105m</span>
            </div>
            <div style={{ height: 10, background: '#0B1220', borderRadius: 999, overflow: 'hidden', border: `1px solid ${MOCK_BORDER}` }}>
              <div style={{ width: '20%', height: '100%', background: '#F59E0B' }} />
            </div>
            <div style={{ marginTop: 10, color: ACCENT, fontSize: 12, fontWeight: 700 }}>£18.3m headroom remaining</div>
            <div style={{ marginTop: 18, border: `1px solid ${MOCK_BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
              {[['2023/24', '£6.8m loss'], ['2024/25', '£8.1m loss'], ['2025/26', '£5.8m loss (forecast)']].map(([yr, val], i) => (
                <div key={yr} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: i % 2 === 0 ? '#0B1220' : '#0E1626', fontSize: 13 }}>
                  <span style={{ color: MUTED }}>{yr}</span>
                  <span style={{ color: TEXT, fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
          </BrowserFrame>
        }
      />

      {/* ── SPOTLIGHT 3 — Set Pieces ───────────────────────── */}
      <SpotlightSection
        background="#0A0C12"
        text={
          <div>
            <div style={{ color: ACCENT, fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Set Pieces
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              90+ routines. <span style={{ color: ACCENT }}>Interactive. Shareable.</span>
            </h2>
            <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.7, marginTop: 20 }}>
              Build your corner, free kick and throw-in library with interactive pitch diagrams. Assign takers, add coaching notes, share with your staff instantly. No more whiteboards.
            </p>
            <BulletList items={['Corners, free kicks, throw-ins, penalties', 'Attacking and defending routines', 'Taker and delivery type assignment', 'Instant share with coaching staff']} />
          </div>
        }
        mockup={
          <BrowserFrame height={520}>
            {/* Club header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>AFC Wimbledon</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tactics</div>
              </div>
            </div>
            {/* Tab nav */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {['Formation Builder', 'Opposition Report', 'Set Piece Planner', 'Video Analysis', 'Dept Insights'].map((t, i) => (
                <span key={t} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: i === 4 ? 'rgba(16,185,129,0.18)' : '#0F172A', border: `1px solid ${i === 4 ? ACCENT : MOCK_BORDER}`, color: i === 4 ? ACCENT : MUTED }}>
                  {t}
                </span>
              ))}
            </div>
            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
              {[['Formation', '4-2-3-1'], ['Win Rate', '62%'], ['Goals Scored', '48'], ['Clean Sheets', '11']].map(([label, val]) => (
                <div key={label} style={{ background: '#0B1220', border: `1px solid ${MOCK_BORDER}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ color: MUTED, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  <div style={{ color: TEXT, fontSize: 16, fontWeight: 800, marginTop: 4 }}>{val}</div>
                </div>
              ))}
            </div>
            {/* Recent Formations table */}
            <div style={{ border: `1px solid ${MOCK_BORDER}`, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ padding: '8px 12px', background: '#0B1220', fontSize: 10, fontWeight: 800, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `1px solid ${MOCK_BORDER}` }}>
                Recent Formations Used
              </div>
              {[
                ['4-2-3-1', '14 matches', 9, 3, 2],
                ['4-3-3', '8 matches', 4, 2, 2],
                ['3-5-2', '4 matches', 3, 0, 1],
                ['4-4-2', '2 matches', 1, 1, 0],
              ].map(([form, matches, w, d, l], i) => (
                <div key={form as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: i % 2 === 0 ? '#0B1220' : '#0E1626', fontSize: 11 }}>
                  <span style={{ color: TEXT, fontWeight: 700 }}>{form}</span>
                  <span style={{ color: MUTED }}>{matches}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ padding: '2px 7px', borderRadius: 4, background: 'rgba(16,185,129,0.18)', color: ACCENT, fontSize: 10, fontWeight: 800 }}>W{w as number}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 4, background: 'rgba(245,158,11,0.18)', color: '#F59E0B', fontSize: 10, fontWeight: 800 }}>D{d as number}</span>
                    <span style={{ padding: '2px 7px', borderRadius: 4, background: 'rgba(239,68,68,0.18)', color: '#EF4444', fontSize: 10, fontWeight: 800 }}>L{l as number}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Set piece pitch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Near Post Flick-On</div>
              <span style={{ padding: '3px 9px', background: 'rgba(16,185,129,0.15)', border: `1px solid ${ACCENT}`, borderRadius: 999, fontSize: 9, fontWeight: 800, color: ACCENT, letterSpacing: '0.08em' }}>
                INSWINGER
              </span>
            </div>
            <div style={{ position: 'relative', height: 150, borderRadius: 10, background: 'linear-gradient(180deg, #0F4C2F 0%, #0B3A23 100%)', border: '2px solid rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(255,255,255,0.25)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)', width: '52%', height: 50, border: '2px solid rgba(255,255,255,0.3)', borderTop: 'none' }} />
              <div style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)', width: '24%', height: 22, border: '2px solid rgba(255,255,255,0.35)', borderTop: 'none' }} />
              {[['10%', '60%', '7'], ['38%', '40%', '9'], ['48%', '30%', '10'], ['58%', '50%', '5'], ['68%', '35%', '4'], ['78%', '60%', '11']].map(([left, top, num]) => (
                <div key={num} style={{ position: 'absolute', left, top, width: 20, height: 20, borderRadius: '50%', background: ACCENT, color: '#04140C', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.7)', transform: 'translate(-50%, -50%)' }}>
                  {num}
                </div>
              ))}
            </div>
          </BrowserFrame>
        }
      />

      {/* ── SPOTLIGHT 4 — Tactics AI Department Intelligence ── */}
      <SpotlightSection
        background={BG}
        flip
        text={
          <div>
            <div style={{ color: ACCENT, fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Department Intelligence
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              AI that thinks like <span style={{ color: ACCENT }}>a football person.</span>
            </h2>
            <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.7, marginTop: 20 }}>
              Every department in Lumio has its own AI intelligence layer. The Tactics module reads your formation data, opposition reports and set piece stats — then surfaces the insights that matter, before you even ask.
            </p>
            <BulletList items={['AI Summary per department, generated fresh daily', 'Formation performance analysis', 'Opposition vulnerability detection', 'Watch-out flags and coaching recommendations']} />
          </div>
        }
        mockup={
          <BrowserFrame height={620}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>📊</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>Tactics — Insights Report</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>AI-generated department analysis</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: '#0B1220', border: `1px solid ${MOCK_BORDER}`, color: MUTED, fontSize: 10, fontWeight: 700 }}>Export PDF</span>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', border: `1px solid ${ACCENT}`, color: ACCENT, fontSize: 10, fontWeight: 700 }}>Share</span>
              </div>
            </div>
            {/* Time tabs */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
              {['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'].map((t, i) => (
                <span key={t} style={{ padding: '4px 9px', borderRadius: 5, fontSize: 9, fontWeight: 700, background: i === 2 ? 'rgba(16,185,129,0.18)' : '#0B1220', border: `1px solid ${i === 2 ? ACCENT : MOCK_BORDER}`, color: i === 2 ? ACCENT : MUTED }}>
                  {t}
                </span>
              ))}
            </div>
            {/* Executive Summary */}
            <div style={{ borderLeft: '3px solid #F59E0B', background: '#0B1220', padding: '10px 12px', borderRadius: 6, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Executive Summary</div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
                The tactics department has delivered strong performance this month with the 4-2-3-1 formation achieving a 68% win rate. Set piece conversion remains a weakness at 14%…
              </div>
            </div>
            {/* Key metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
              {[
                ['Headcount', '192'],
                ['Attrition Rate', '4.2%'],
                ['Time to Hire', '23 days'],
                ['Training', '87%'],
                ['eNPS Score', '42'],
                ['Leave Util.', '62%'],
              ].map(([label, val]) => (
                <div key={label} style={{ background: '#0B1220', border: `1px solid ${MOCK_BORDER}`, borderRadius: 6, padding: 8 }}>
                  <div style={{ color: MUTED, fontSize: 9 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ color: TEXT, fontSize: 13, fontWeight: 800 }}>{val}</span>
                    <span style={{ color: ACCENT, fontSize: 9, fontWeight: 700 }}>↑</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Top achievements */}
            <div style={{ background: 'rgba(16,185,129,0.08)', border: `1px solid ${ACCENT}`, borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Top Achievements</div>
              {[
                '4-2-3-1 formation delivering 68% win rate',
                'Identified Riverside vulnerability — 34% turnover',
                'Tactical consistency maintained across squad',
              ].map(a => (
                <div key={a} style={{ fontSize: 10, color: TEXT, marginTop: 4, display: 'flex', gap: 6 }}>
                  <span style={{ color: ACCENT }}>✅</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
            {/* AI Summary + Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#0B1220', border: `1px solid ${MOCK_BORDER}`, borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>🤖 AI Summary</div>
                {[
                  '4-2-3-1 outperforming alternatives',
                  'Set piece conversion below par',
                  'High press effective vs back-three',
                  'Opposition weak on right channel',
                ].map(s => (
                  <div key={s} style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>• {s}</div>
                ))}
                <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 4, fontSize: 9, color: '#F59E0B', fontWeight: 700 }}>
                  ⚠ Don&apos;t abandon 4-2-3-1 structure
                </div>
              </div>
              <div style={{ background: '#0B1220', border: `1px solid ${MOCK_BORDER}`, borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>✨ Key Highlights</div>
                {[
                  'Win rate up 12% vs last month',
                  'Clean sheets doubled vs Q3',
                  'Set piece routines: 90+ live',
                  'Opposition reports auto-tagged',
                  'Squad rotation balanced',
                ].map((h, i) => (
                  <div key={h} style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>{i + 1}. {h}</div>
                ))}
              </div>
            </div>
          </BrowserFrame>
        }
      />

      {/* ── SPOTLIGHT 4 — Performance Analytics ────────────── */}
      <SpotlightSection
        background={BG}
        flip
        text={
          <div>
            <div style={{ color: ACCENT, fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Performance Analytics
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              xG, formations, GPS. <span style={{ color: ACCENT }}>All connected.</span>
            </h2>
            <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.7, marginTop: 20 }}>
              StatsBomb and Opta data live inside your portal. Formation analysis, xG timeline, shot maps, passing networks. GPS load data from Catapult and STATSports sitting alongside your match analysis.
            </p>
            <BulletList items={['StatsBomb Open Data integration', 'xG timeline and shot maps', 'GPS load monitoring and ACWR', 'Injury risk scoring']} />
          </div>
        }
        mockup={
          <BrowserFrame height={320}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[['xG', '42.6'], ['xGA', '28.3'], ['Possession', '58%']].map(([label, val]) => (
                <div key={label} style={{ background: '#0B1220', border: `1px solid ${MOCK_BORDER}`, borderRadius: 10, padding: 10, textAlign: 'center' }}>
                  <div style={{ color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  <div style={{ color: ACCENT, fontSize: 22, fontWeight: 800, marginTop: 4 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', height: 220, borderRadius: 10, background: 'linear-gradient(180deg, #0F4C2F 0%, #0B3A23 100%)', border: '2px solid rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              {[
                ['50%', '90%'],
                ['15%', '72%'], ['38%', '72%'], ['62%', '72%'], ['85%', '72%'],
                ['25%', '50%'], ['50%', '50%'], ['75%', '50%'],
                ['20%', '25%'], ['50%', '20%'], ['80%', '25%'],
              ].map(([left, top], i) => (
                <div key={i} style={{ position: 'absolute', left, top, width: 22, height: 22, borderRadius: '50%', background: ACCENT, border: '2px solid rgba(255,255,255,0.7)', transform: 'translate(-50%, -50%)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }} />
              ))}
              <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em' }}>
                4-3-3 · AVG POSITIONS
              </div>
            </div>
          </BrowserFrame>
        }
      />

      {/* ── INTEGRATIONS ───────────────────────────────────── */}
      <section style={{ background: '#0A0C12', padding: '120px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Lumio connects to <span style={{ color: ACCENT }}>the tools you already use.</span>
          </h2>
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {integrations.map(([icon, name, desc]) => (
              <div key={name} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                <div style={{ fontSize: 24 }}>{icon}</div>
                <div>
                  <div style={{ color: TEXT, fontWeight: 700, fontSize: 15 }}>{name}</div>
                  <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLUB TIERS ─────────────────────────────────────── */}
      <section style={{ background: BG, padding: '120px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', textAlign: 'center' }}>
            Built for <span style={{ color: ACCENT }}>every level</span> of the professional game.
          </h2>
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              { tier: 'League One / Two', body: 'PSR-compliant from day one. Squad management, finance tracking, board reporting.' },
              { tier: 'Championship', body: 'Full commercial intelligence. Transfer market tools, media management, advanced analytics.' },
              { tier: 'Non-League', body: 'Everything a growing club needs. Affordable, scalable, built for football people.' },
            ].map(t => (
              <div key={t.tier} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28 }}>
                <div style={{ color: ACCENT, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t.tier}</div>
                <p style={{ color: TEXT, fontSize: 16, lineHeight: 1.6, marginTop: 14, marginBottom: 0 }}>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS CTA ───────────────────────────────── */}
      <section style={{ background: `radial-gradient(circle at 50% 0%, rgba(16,185,129,0.18), transparent 60%), #06070C`, padding: '120px 24px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Be one of the first clubs on <span style={{ color: ACCENT }}>Lumio Football.</span>
          </h2>
          <p style={{ color: MUTED, fontSize: 18, lineHeight: 1.6, marginTop: 24 }}>
            We&apos;re looking for a small number of clubs to help us build this properly. 6 months free. No commitment. At the end, all we ask is an honest case study.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 36 }}>
            {['6 months free', 'We build what you ask for', 'No lock-in'].map(p => (
              <span key={p} style={{ padding: '10px 20px', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 999, fontSize: 14, fontWeight: 700, color: TEXT }}>
                {p}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 44 }}>
            <a
              href="mailto:hello@lumiosports.com?subject=Football%20Early%20Access"
              style={{ background: ACCENT, color: '#04140C', fontWeight: 800, fontSize: 17, padding: '18px 36px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 14px 40px rgba(16,185,129,0.35)' }}
            >
              Apply for early access →
            </a>
            <Link
              href="/football/afc-wimbledon"
              style={{ background: 'transparent', color: TEXT, fontWeight: 700, fontSize: 17, padding: '18px 32px', borderRadius: 12, border: `1px solid ${BORDER}`, textDecoration: 'none' }}
            >
              Or try the demo →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
