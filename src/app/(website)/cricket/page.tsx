'use client'

import Link from 'next/link'
import SportRoleTabs from '../components/SportRoleTabs'
import { CRICKET_ROLES } from '../components/sportRoles'

const PURPLE = '#8B5CF6'
const PURPLE_LIGHT = '#A78BFA'
const BG = '#07080F'
const CARD = '#0D1117'
const CARD_ALT = '#111827'
const BORDER = '#1E293B'
const BORDER_ALT = '#1F2937'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const STAT_PILLS = ['50+ features', 'Championship · Blast · OD · Hundred', 'AI powered', 'ECB compliant', 'GPS ready']

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '🏏', title: 'Multi-Format Squad Manager', desc: 'One squad across County Championship, Vitality Blast, One-Day Cup and The Hundred. Availability, form and rotation in a single view.' },
  { icon: '📊', title: 'Performance Analytics', desc: 'Batting averages, strike rates, bowling economy, wagon wheels, pitch maps and spell analysis across formats, seasons and opposition.' },
  { icon: '📡', title: 'GPS Vest Integration', desc: 'Live Catapult and STATSports feeds powering bowling load management, ACWR monitoring, high-speed distance and red-flag alerts.' },
  { icon: '🛡️', title: 'ECB Compliance Hub', desc: 'CPA tracker, DBS register, safeguarding logs, concussion protocols and PCA welfare — always inspection-ready.' },
  { icon: '🤖', title: 'AI Morning Briefing', desc: 'Claude-powered daily briefing for Director of Cricket — squad availability, load flags, pitch report, opposition intel and toss advisor.' },
  { icon: '💼', title: 'Commercial & Governance', desc: 'Central contracts, signing pipeline kanban, sponsorship activation, board reporting and finance exports for CEO-level visibility.' },
  { icon: '🎯', title: 'Selection & Opposition Intel', desc: 'Scouting database, opposition tendencies, pitch-type matchups and AI-assisted XI builder for every format.' },
  { icon: '🏥', title: 'Injury & Medical Logs', desc: 'Physio notes, return-to-play protocols, imaging attachments and workload context alongside every injury entry.' },
  { icon: '✈️', title: 'Overseas & Visa Tracking', desc: 'Kolpak, ECB overseas registrations, visa expiry alerts and arrival schedules for international signings.' },
  { icon: '📅', title: 'Fixture & Travel Planner', desc: 'Four-format fixture calendar, away travel logistics, hotel and net booking across the county circuit.' },
  { icon: '🎙️', title: 'Match Report Generator', desc: 'Claude-generated post-match reports with batting, bowling and tactical summaries — exportable to PDF or board pack.' },
  { icon: '💷', title: 'Wage Cap & Finance', desc: 'Real-time wage cap calculator, ECB declaration builder and contract ledger — every pound tracked and auditable.' },
]

const INTEGRATIONS = [
  { icon: '📊', name: 'CricViz', desc: 'Ball-by-ball analytics' },
  { icon: '🎥', name: 'Hawk-Eye', desc: 'Video and tracking data' },
  { icon: '📡', name: 'Catapult GPS', desc: 'Vest load and distance data' },
  { icon: '🤖', name: 'Claude AI', desc: 'Briefings and match reports' },
  { icon: '🎵', name: 'ElevenLabs', desc: 'Voice briefing delivery' },
  { icon: '🏏', name: 'Play-Cricket', desc: 'ECB fixtures and scorecards' },
  { icon: '📱', name: 'STATSports', desc: 'Alternative GPS integration' },
  { icon: '💰', name: 'Xero', desc: 'Finance and wage cap' },
  { icon: '📧', name: 'Microsoft 365', desc: 'Email and calendar' },
  { icon: '🔔', name: 'Slack', desc: 'Team notifications' },
  { icon: '📸', name: 'Instagram', desc: 'Commercial activation' },
  { icon: '🎬', name: 'YouTube', desc: 'Content and highlights' },
]

const TIERS = [
  { name: 'Pro — £249/mo', desc: 'For county clubs running a professional squad. Full squad manager across all four formats, ECB compliance hub, performance analytics, injury logs and AI morning briefing.' },
  { name: 'Pro+ — £449/mo', desc: 'Everything in Pro, plus GPS vest integration, bowling load ACWR monitoring, AI toss advisor, contract renewal AI and match report generator. Dedicated onboarding.' },
  { name: 'Enterprise — Contact us', desc: 'Multi-team deployments, custom integrations, academy and pathway programmes, board-level reporting and dedicated account management.' },
]

// ── Mockup chrome ───────────────────────────────────────────────────────────
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

// ── Mockups ─────────────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <MockupFrame>
      <div style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`, borderRadius: 10, padding: 10, marginBottom: 10, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 900 }}>Yorkshire CCC — Director&apos;s Dashboard</div>
        <div style={{ fontSize: 8, marginTop: 4, opacity: 0.9 }}>Good morning, Ottis. Championship opens in 6 days.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="2nd" label="Div 1" sub="County Champ" color={PURPLE} />
        <KPI value="Fri 11" label="vs Lancs" sub="Apr · Headingley" color={PURPLE_LIGHT} />
        <KPI value="16/18" label="Fit" sub="Squad available" color="#10B981" />
        <KPI value="£3.2m" label="Budget" sub="Wage cap 91%" color="#3B82F6" />
      </div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 800 }}>⚠ Chris Dawson A:C 1.62</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>Cap workload this block — high injury risk</div>
      </div>
      <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#10B981', fontWeight: 800 }}>✓ Nortje visa confirmed</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>Arrives Thursday · available for Blast opener</div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {['Log Injury', 'Team Sheet', 'Opposition Report', 'Wage Cap'].map(a => (
          <span key={a} style={{ fontSize: 8, padding: '4px 8px', borderRadius: 999, backgroundColor: `${PURPLE}22`, color: PURPLE_LIGHT, border: `1px solid ${PURPLE}55` }}>{a}</span>
        ))}
      </div>
    </MockupFrame>
  )
}

function BowlingLoadMockup() {
  const radius = 60
  const circ = Math.PI * radius
  const pct = 72 / 96
  const offset = circ * (1 - pct)
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>Sam Reed — Bowling Load</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 14 }}>Week 14 · Rolling 7-day delivery count</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <svg width={160} height={90} viewBox="0 0 160 90">
          <path d={`M 20 80 A ${radius} ${radius} 0 0 1 140 80`} stroke="#1F2937" strokeWidth={12} fill="none" strokeLinecap="round" />
          <path
            d={`M 20 80 A ${radius} ${radius} 0 0 1 140 80`}
            stroke="#10B981"
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
          <text x="80" y="68" textAnchor="middle" fontSize="20" fontWeight="900" fill="#10B981">72</text>
          <text x="80" y="82" textAnchor="middle" fontSize="9" fill={MUTED}>of 96 deliveries</text>
        </svg>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <Badge color="#10B981" bg="rgba(16,185,129,0.2)">A:C Ratio 0.94 · Safe zone</Badge>
      </div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 10, padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: TEXT }}>Chris Dawson</div>
            <div style={{ fontSize: 9, color: MUTED }}>A:C 1.62 · 128/96 deliveries</div>
          </div>
          <Badge color="#F59E0B" bg="rgba(245,158,11,0.2)">🟡 Manage carefully</Badge>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
        <KPI value="12.4 km" label="Distance" sub="Today" color={PURPLE} />
        <KPI value="87" label="Player Load" sub="Session" color={PURPLE_LIGHT} />
        <KPI value="4" label="Sprints" sub=">7 m/s" color="#3B82F6" />
      </div>
    </MockupFrame>
  )
}

function ComplianceMockup() {
  const sections = [
    { label: 'Player Welfare', done: 7, total: 12, color: '#F59E0B' },
    { label: 'Coaching Standards', done: 10, total: 10, color: '#10B981' },
    { label: 'Financial Reporting', done: 6, total: 8, color: PURPLE_LIGHT },
    { label: 'Facilities', done: 5, total: 6, color: '#3B82F6' },
    { label: 'Safeguarding', done: 9, total: 9, color: '#10B981' },
  ]
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>🛡️ ECB Compliance — CPA 2026</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 12 }}>County Partnership Agreement · Self-assessment</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 10 }}>
        <KPI value="37/45" label="Overall" sub="82% complete" color={PURPLE} />
        <KPI value="14 days" label="Deadline" sub="Wage cap decl." color="#F59E0B" />
      </div>
      {sections.map(s => {
        const pct = (s.done / s.total) * 100
        return (
          <div key={s.label} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3 }}>
              <span style={{ color: TEXT, fontWeight: 700 }}>{s.label}</span>
              <span style={{ color: s.color, fontWeight: 800 }}>{s.done}/{s.total} · {pct.toFixed(0)}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, backgroundColor: '#1F2937' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: s.color }} />
            </div>
          </div>
        )
      })}
      <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.45)', borderRadius: 10, padding: 10, marginTop: 10 }}>
        <div style={{ fontSize: 10, color: '#EF4444', fontWeight: 800 }}>⚠ Phil Grant DBS expired</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>Resolve before academy activity resumes</div>
      </div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: 10, padding: 10, marginTop: 6 }}>
        <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 800 }}>⚠ Wage cap declaration due 30 Apr</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>ECB submission window open · 91% utilised</div>
      </div>
    </MockupFrame>
  )
}

function BriefingMockup() {
  return (
    <MockupFrame>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEXT, marginBottom: 2 }}>🤖 Lumio AI — Director of Cricket Briefing</div>
      <div style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Generated 06:45 · Based on live squad, medical &amp; commercial data</div>
      <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${PURPLE}55`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: TEXT, lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
          &ldquo;Good morning. The Championship opens in 6 days. Brook is cleared. Dawson&apos;s workload needs capping. Nortje arrives Thursday. Noah Patel&apos;s contract decision is overdue. Make it count.&rdquo;
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 10 }}>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#10B981', marginBottom: 3 }}>✓ SQUAD FITNESS</div>
          <div style={{ fontSize: 9, color: MUTED }}>Brook cleared · Dawson manage · 16/18 available</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: PURPLE_LIGHT, marginBottom: 3 }}>✈️ OVERSEAS</div>
          <div style={{ fontSize: 9, color: MUTED }}>Nortje visa confirmed · arrives Thu 10 Apr</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B', marginBottom: 3 }}>📋 ECB &amp; COMMERCIAL</div>
          <div style={{ fontSize: 9, color: MUTED }}>Wage cap due 30 Apr · Nike activation Fri</div>
        </div>
        <div style={{ backgroundColor: '#0A0B10', border: `1px solid ${BORDER_ALT}`, borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', marginBottom: 3 }}>🎯 OPPOSITION</div>
          <div style={{ fontSize: 9, color: MUTED }}>Lancs · pace-heavy attack · left-arm spin gap</div>
        </div>
      </div>
      <button style={{ width: '100%', fontSize: 10, fontWeight: 800, padding: '8px 12px', borderRadius: 8, backgroundColor: PURPLE, color: '#fff', border: 'none' }}>▶ Play voice briefing (2m 14s)</button>
    </MockupFrame>
  )
}

// ── Spotlight wrapper ────────────────────────────────────────────────────────
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CricketLandingPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${PURPLE}33, transparent 50%), radial-gradient(circle at 80% 60%, ${PURPLE_LIGHT}22, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Sports/cricket_logo.png" alt="Lumio Cricket" style={{ height: 80, margin: '0 auto 32px', display: 'block' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: PURPLE_LIGHT, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO TOUR · CRICKET
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
            The cricket operations platform built for professional clubs.
          </h1>
          <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, maxWidth: 860, margin: '0 auto 40px' }}>
            Squad management across all four formats, GPS-integrated bowling load monitoring, ECB compliance, AI-powered match day decisions and commercial governance — the full stack for county and franchise cricket.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/cricket/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PURPLE}66` }}>
              Try the live demo →
            </Link>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Book a walkthrough
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STAT_PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: `${PURPLE}1A`, border: `1px solid ${PURPLE}66`, color: PURPLE_LIGHT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section id="features" style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Everything your club needs.<br />
            <span style={{ color: PURPLE_LIGHT }}>In one place.</span>
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56 }}>
            Built with professional county cricket staff. Not adapted from a general sports app.
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

      <SportRoleTabs sport="cricket" demoHref="/cricket/demo" accentColor="#8B5CF6" accentColorDim="rgba(139,92,246,0.15)" roles={CRICKET_ROLES} />

      {/* ── SPOTLIGHTS ── */}
      <Spotlight
        eyebrow="SPOTLIGHT · DASHBOARD"
        title="Your entire club. One morning view."
        body="The Lumio Cricket dashboard gives your Director of Cricket the squad fitness picture, upcoming fixtures, GPS vest status, and ECB compliance flags — all before the first net session."
        bullets={["Today's training schedule with session types and times", 'Squad availability across all four formats', 'GPS vest status — live bowler load alerts', 'ECB compliance summary with urgent flags']}
        mockup={<DashboardMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · GPS & BOWLING LOAD"
        title="Prevent injury before it happens."
        body="Lumio Vest GPS tracks every player in real time. The cricket-specific bowling load model combines over-count with acute:chronic workload ratio — giving you an injury risk score for every seamer before you name the team."
        bullets={['Real-time distance, speed, sprint count and player load per session', 'Bowling load gauge: deliveries this week vs weekly cap', 'Acute:Chronic ratio with green/amber/red risk zones', '7-day delivery planner with automatic overuse flags']}
        mockup={<BowlingLoadMockup />}
      />

      <Spotlight
        eyebrow="SPOTLIGHT · ECB COMPLIANCE"
        title="Know your compliance status every morning."
        body="The County Partnership Agreement tracker, DBS register, safeguarding log, wage cap calculator, and submission deadline calendar — built in as a first-class feature, not a bolt-on."
        bullets={['CPA self-assessment progress across all 7 sections', 'DBS check register with expiry alerts at 90, 60 and 30 days', 'Wage cap declaration and ECB submission deadlines', 'AI compliance assistant answers CPA questions instantly']}
        mockup={<ComplianceMockup />}
      />

      <Spotlight
        altBg reverse
        eyebrow="SPOTLIGHT · AI MORNING BRIEFING"
        title="Before the first session. Every morning."
        body="Lumio reads your squad data, GPS load scores, ECB flags, overseas visa status, and commercial obligations — then generates a Director of Cricket briefing. Every morning, before you arrive at the ground."
        bullets={['Squad fitness and return-to-play updates', 'Overseas player visa and availability status', 'ECB and commercial obligations due today', 'Opposition intel for the upcoming fixture']}
        mockup={<BriefingMockup />}
      />

      {/* ── INTEGRATIONS ── */}
      <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Lumio Cricket connects to the tools your club already uses.
          </h2>
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

      {/* ── TIERS ── */}
      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Simple pricing for every county club.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 56 }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ backgroundColor: CARD, border: `1px solid ${PURPLE}55`, borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>TIER</div>
                <h3 style={{ fontSize: 26, fontWeight: 900, color: TEXT, marginBottom: 12 }}>{t.name}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS CTA ── */}
      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            Ready to run your club on Lumio?
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            See the full platform in under five minutes. Then set up your club&apos;s portal and invite your coaching, medical and commercial teams.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {['ECB compliant', '6 months free', 'Bring your own data'].map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: `${PURPLE}1A`, border: `1px solid ${PURPLE}66`, color: PURPLE_LIGHT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cricket/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: PURPLE, color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${PURPLE}66` }}>
              Try the live demo →
            </Link>
            <Link href="/cricket/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Set up your portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
