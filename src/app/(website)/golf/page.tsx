'use client'

import Link from 'next/link'
import SportRoleTabs from '../components/SportRoleTabs'
import { GOLF_ROLES } from '../components/sportRoles'

const ACCENT = '#2DD4BF' // teal-400
const ACCENT_DEEP = '#0D9488' // teal-600
const BG = '#07080F'
const CARD = '#0D0F1A'
const BORDER = '#1F2937'
const MUTED = '#9CA3AF'

const FEATURES = [
  { icon: '📊', title: 'OWGR & Race to Dubai', desc: "Rolling 104-week ranking tracker, Race to Dubai standings, weekly movement and a scenario modeller that shows your new OWGR for every finish bracket." },
  { icon: '📅', title: 'Points Expiry Calendar', desc: "Visual 12-month calendar showing exactly when each OWGR result expires — colour-coded by urgency. Plan your schedule around protecting your peak points." },
  { icon: '📈', title: 'Strokes Gained Analytics', desc: 'Full SG breakdown: Off the Tee, Approach, Around the Green, Putting. Spider chart, round-by-round log, and an AI alert on your weakest category.' },
  { icon: '🗺️', title: 'Course Fit & Strategy', desc: "Your SG profile scored against every course's historical demands. Know your best-fit events before the season starts." },
  { icon: '🌅', title: 'AI Morning Briefing', desc: 'Role-specific daily briefings for player, coach, caddie and agent. Voice-delivered via ElevenLabs. Knows your tee time, your SG weakness, and your sponsor obligations.' },
  { icon: '💰', title: 'Financial Dashboard', desc: 'Prize money ledger in EUR and GBP, expense tracker, multi-jurisdiction tax dashboard. Exportable for your accountant.' },
  { icon: '🤝', title: 'Sponsorship Manager', desc: "Every deal, every obligation, every deadline — tracked automatically. Renewal alerts before it's too late. Performance bonus triggers tracked live." },
  { icon: '🏌️', title: 'Caddie Workflow', desc: 'Digital yardage book, hole strategy notes, wind-adjusted club recommendations, and a one-click printable caddie sheet.' },
  { icon: '👥', title: 'Team Hub', desc: 'Coach, physio, agent, fitness trainer, mental coach, accountant — role-specific feeds and shared data for your full team of 8.' },
  { icon: '🏛️', title: 'Exemptions & Tour Status', desc: 'Tour card, Major qualification, Ryder Cup points — every exemption tracked with status and condition in one place.' },
  { icon: '⭐', title: 'Pro-Am & Appearances', desc: "Pro-am partner briefing packs, appearance fee tracker, commercial event calendar. Everything your agent needs." },
  { icon: '🚀', title: 'Career Planning', desc: 'OWGR goal ladder: from current rank to Top 50 (Major invitations) to Top 25. Ryder Cup 2028 points accumulation built in.' },
]

const STAT_PILLS = ['30+ features', 'DP World Tour & PGA Tour', 'AI powered', 'ElevenLabs voice', 'DataGolf ready']

const INTEGRATIONS = [
  { icon: '⛳', name: 'DataGolf',       desc: 'Ranking and SG data' },
  { icon: '📡', name: 'Arccos',         desc: 'Shot tracking and club data' },
  { icon: '🎯', name: 'TrackMan',       desc: 'Launch monitor and fitting' },
  { icon: '🔗', name: 'ShotLink',       desc: 'PGA Tour shot data (Phase 3)' },
  { icon: '🏆', name: 'DP World Tour',  desc: 'Race to Dubai live feed' },
  { icon: '🌍', name: 'R&A',            desc: 'Schedule and exemptions' },
  { icon: '🎵', name: 'ElevenLabs',     desc: 'Voice briefing delivery' },
  { icon: '🤖', name: 'Claude AI',      desc: 'Intelligence and briefings' },
  { icon: '💰', name: 'Xero',           desc: 'Financial management' },
  { icon: '✈️', name: 'Google Flights', desc: 'Travel search' },
  { icon: '🏨', name: 'Booking.com',    desc: 'Hotel management' },
  { icon: '📧', name: 'Microsoft 365',  desc: 'Email and calendar' },
]

const TIERS = [
  { name: 'Challenge Tour / Korn Ferry', desc: 'Rankings intelligence, tournament schedule, entry management, financial tracking. Everything you need to pursue your tour card.' },
  { name: 'DP World Tour / PGA Tour',    desc: 'Full team hub, AI briefings, sponsorship management, caddie workflow, travel logistics. The complete professional toolkit.' },
  { name: 'Top 50 / Ryder Cup',          desc: 'Advanced SG analytics, exemption tracking, career planning, Major preparation, tax-ready financials. Trusted by players at the highest level.' },
]

const PRICING = [
  { tier: 'Lumio Tour Pro',  price: '£199/mo', features: ['Individual dashboard', 'OWGR + Race to Dubai tracker', 'Strokes Gained analytics', 'Tournament schedule', 'Sponsorship manager', 'AI morning briefing'] },
  { tier: 'Lumio Tour Pro+', price: '£349/mo', highlight: true, features: ['Everything in Pro', 'Full team access (8 roles)', 'Caddie workflow + printable sheet', 'Financial dashboard + tax tracker', 'Course fit AI + scenario modeller', 'Priority account manager'] },
]

// ── Spotlight wrapper ────────────────────────────────────────────────────────
function Spotlight({ eyebrow, title, bullets, mockup, reverse }: {
  eyebrow: string
  title: string
  bullets: string[]
  mockup: React.ReactNode
  reverse?: boolean
}) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className={reverse ? 'lg:order-2' : ''}>
          <div className="inline-block text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: ACCENT }}>{eyebrow}</div>
          <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight" style={{ color: '#F9FAFB' }}>{title}</h2>
          <ul className="space-y-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
                <span className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }}>✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={reverse ? 'lg:order-1' : ''}>{mockup}</div>
      </div>
    </section>
  )
}

// ── Mockups ──────────────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, boxShadow: `0 30px 80px rgba(13,148,136,0.15)` }}>
      <div className="text-lg font-bold mb-4" style={{ color: '#F9FAFB' }}>Good morning, James.</div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { val: '#87', lbl: 'OWGR ▲3', color: ACCENT },
          { val: '#43', lbl: 'Race to Dubai', color: '#A78BFA' },
          { val: '4.82', lbl: 'Pts Avg', color: '#60A5FA' },
          { val: '#61', lbl: 'Career High', color: '#FB923C' },
        ].map((k, i) => (
          <div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#0A0B12', border: `1px solid ${BORDER}` }}>
            <div className="text-sm font-black" style={{ color: k.color }}>{k.val}</div>
            <div className="text-[9px] mt-0.5" style={{ color: MUTED }}>{k.lbl}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg px-3 py-2 mb-2 text-xs flex items-start gap-2" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <span className="text-yellow-400">⚠️</span>
        <span className="text-yellow-300"><strong>330 pts expiring Jul 12</strong> — need T10 or better this week</span>
      </div>
      <div className="rounded-lg px-3 py-2 mb-3 text-xs flex items-start gap-2" style={{ backgroundColor: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.3)' }}>
        <span style={{ color: ACCENT }}>🎯</span>
        <span className="text-teal-300"><strong>SG Putting: -1.18 from 8-15ft</strong> · Practice focus: today 08:30 with Pete</span>
      </div>
      <div className="flex gap-2 mb-3">
        {['Caddie Sheet', 'SG Analysis', 'Sponsor Check'].map(b => (
          <button key={b} className="flex-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg" style={{ backgroundColor: ACCENT_DEEP, color: '#F9FAFB' }}>{b}</button>
        ))}
      </div>
      <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#0A0B12', border: `1px solid ${BORDER}` }}>
        <div className="font-semibold" style={{ color: '#F9FAFB' }}>R1 · Thu 09:42 · Hole 1</div>
        <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>BMW International Open · Course fit 8.1/10</div>
      </div>
    </div>
  )
}

function OWGRMockup() {
  const rows = [
    { result: 'Win',      new: '#71', pts: '+16', color: '#F1C40F' },
    { result: 'T2–T5',    new: '#79', pts: '+8',  color: ACCENT },
    { result: 'T6–T10',   new: '#83', pts: '+4',  color: ACCENT },
    { result: 'T21–T40',  new: '#88', pts: '+1',  color: MUTED },
    { result: 'MC',       new: '#92', pts: '-5',  color: '#F87171' },
  ]
  return (
    <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, boxShadow: `0 30px 80px rgba(13,148,136,0.15)` }}>
      <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>BMW International — Scenarios</div>
      <div className="space-y-1.5 mb-4">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 rounded px-3 py-2 text-xs" style={{ backgroundColor: '#0A0B12', border: `1px solid ${BORDER}` }}>
            <span className="w-14 font-semibold" style={{ color: r.color }}>{r.result}</span>
            <span className="flex-1" style={{ color: '#D1D5DB' }}>New OWGR <strong className="text-white">{r.new}</strong></span>
            <span className="text-[10px] font-bold" style={{ color: r.color }}>{r.pts}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>Upcoming Expiries</div>
      <div className="flex gap-2 mb-4">
        {[
          { pts: '330', month: 'Jul', urgent: true },
          { pts: '480', month: 'Jun', urgent: true },
          { pts: '88',  month: 'Sep', urgent: false },
        ].map((e, i) => (
          <div key={i} className="flex-1 rounded-lg px-2 py-2 text-center text-[10px]" style={{ backgroundColor: e.urgent ? 'rgba(239,68,68,0.08)' : '#0A0B12', border: `1px solid ${e.urgent ? 'rgba(239,68,68,0.4)' : BORDER}` }}>
            <div className={`font-black ${e.urgent ? 'text-red-400' : 'text-gray-300'}`}>{e.pts} pts</div>
            <div style={{ color: MUTED }}>{e.month}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.3)' }}>
        <div className="flex items-center justify-between">
          <span className="text-teal-300 font-semibold">Top 50 cut</span>
          <span className="text-[10px]" style={{ color: MUTED }}>980 pts</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white font-bold">You: 1,240 pts</span>
          <span className="text-[10px] text-teal-400 font-semibold">Buffer: +260 pts</span>
        </div>
      </div>
    </div>
  )
}

function StrokesGainedMockup() {
  const bars = [
    { label: 'Off the Tee',   val: 0.41 },
    { label: 'Approach',      val: -0.28 },
    { label: 'Around Green',  val: 0.15 },
    { label: 'Putting',       val: -1.18 },
    { label: 'Total',         val: -0.90 },
  ]
  const max = 1.5
  return (
    <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, boxShadow: `0 30px 80px rgba(13,148,136,0.15)` }}>
      <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: ACCENT }}>SG Breakdown vs Field</div>
      <div className="space-y-3 mb-4">
        {bars.map((b, i) => {
          const w = Math.min(100, (Math.abs(b.val) / max) * 50)
          const positive = b.val >= 0
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span style={{ color: '#D1D5DB' }}>{b.label}</span>
                <span className={`font-bold ${positive ? 'text-teal-400' : 'text-red-400'}`}>{positive ? '+' : ''}{b.val.toFixed(2)}</span>
              </div>
              <div className="relative h-2 rounded-full" style={{ backgroundColor: '#0A0B12', border: `1px solid ${BORDER}` }}>
                <div className="absolute top-0 bottom-0 w-px" style={{ left: '50%', backgroundColor: BORDER }} />
                <div className="absolute top-0 bottom-0 rounded-full" style={{
                  [positive ? 'left' : 'right']: '50%',
                  width: `${w}%`,
                  backgroundColor: positive ? ACCENT : '#EF4444',
                }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <span className="text-red-300">🔴 </span>
        <span className="text-red-200"><strong>Putting is the clear weakness.</strong> -1.18 from 8-15ft over last 6 events.</span>
      </div>
    </div>
  )
}

function SponsorshipMockup() {
  const deals = [
    { brand: 'TaylorMade',  cat: 'Clubs',          value: '£80k/yr + bonuses', status: 'Active',         statusColor: ACCENT, expiry: 'Dec 2026', note: 'Use TaylorMade driver, woods, irons' },
    { brand: 'Callaway',    cat: 'Wedges + Ball',  value: '£55k/yr',           status: 'Renewal due 🔴', statusColor: '#F87171', expiry: '18 days', note: 'Chrome Tour X ball mandatory · Post due today' },
    { brand: 'Rolex',       cat: 'Watch',          value: '£45k/yr',           status: 'Active',         statusColor: ACCENT, expiry: 'Jan 2027', note: 'Wear at all press conferences' },
  ]
  return (
    <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, boxShadow: `0 30px 80px rgba(13,148,136,0.15)` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: ACCENT }}>Sponsorship Manager</div>
        <div className="text-xs font-black text-white">£250k+ /yr</div>
      </div>
      <div className="space-y-2">
        {deals.map((d, i) => (
          <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B12', border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-bold text-white">{d.brand}</div>
              <div className="text-[10px] font-semibold" style={{ color: d.statusColor }}>{d.status}</div>
            </div>
            <div className="flex items-center gap-2 text-[10px] mb-1" style={{ color: MUTED }}>
              <span>{d.cat}</span><span>·</span><span>{d.value}</span><span>·</span><span>{d.expiry}</span>
            </div>
            <div className="text-[10px]" style={{ color: '#D1D5DB' }}>{d.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamHubMockup() {
  const team = [
    { name: 'Pete Larsen',       role: 'Lead Coach',   status: 'On-site Munich',       statusColor: ACCENT,     note: 'Practice session notes uploaded · 08:30' },
    { name: "Mick O'Brien",      role: 'Caddie',       status: 'On-site Munich',       statusColor: ACCENT,     note: 'Strategy notes updated · 07:45' },
    { name: 'Sarah Mitchell',    role: 'Agent',        status: 'TaylorMade renewal!',  statusColor: '#F87171',  note: 'Callaway caption drafted — awaiting approval' },
    { name: 'Dr. Alison Reed',   role: 'Mental Coach', status: 'Video call 20:00',     statusColor: '#A78BFA',  note: 'Pre-round routine shared · 09:00' },
  ]
  return (
    <div className="rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, boxShadow: `0 30px 80px rgba(13,148,136,0.15)` }}>
      <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: ACCENT }}>Team Hub · 8 Roles</div>
      <div className="grid grid-cols-2 gap-2">
        {team.map((m, i) => (
          <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B12', border: `1px solid ${BORDER}` }}>
            <div className="text-xs font-bold text-white truncate">{m.name}</div>
            <div className="text-[10px]" style={{ color: MUTED }}>{m.role}</div>
            <div className="mt-2 text-[10px] font-semibold" style={{ color: m.statusColor }}>{m.status}</div>
            <div className="mt-1 text-[10px] leading-relaxed" style={{ color: '#D1D5DB' }}>{m.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function GolfPage() {
  return (
    <div style={{ backgroundColor: BG, color: '#E5E7EB' }}>
      {/* Hero */}
      <section style={{ minHeight: '100vh', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${ACCENT}33, transparent 50%), radial-gradient(circle at 80% 60%, ${ACCENT_DEEP}22, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Sports/golf_logo.png" alt="Lumio Golf" style={{ height: 80, margin: '0 auto 32px', display: 'block' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO TOUR · GOLF
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, color: '#F9FAFB', marginBottom: 24, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
            The career OS for touring golf professionals.
          </h1>
          <p style={{ fontSize: 20, color: MUTED, lineHeight: 1.6, maxWidth: 820, margin: '0 auto 40px' }}>
            OWGR tracker, Race to Dubai, strokes gained, caddie workflow, course fit, sponsorship manager — and an AI morning briefing that knows your week before you do.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/golf/golf-demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: ACCENT, color: '#07080F', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${ACCENT}66` }}>
              Try the demo →
            </Link>
            <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: '#F9FAFB', fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              See all features ↓
            </a>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {STAT_PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: `${ACCENT}1A`, border: `1px solid ${ACCENT}66`, color: ACCENT, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Founding Member Banner */}
      <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(90deg, rgba(139,92,246,0.1), rgba(0,0,0,0))', borderTop: '1px solid rgba(139,92,246,0.2)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
        <span style={{ color: '#a855f7', fontSize: 13, fontWeight: 700 }}>🎯 Founding member spots: 20 available · Free for 3 months · No card needed</span>
      </div>

      {/* Powered by Claude AI */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', margin: '24px 0' }}>
        <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600 }}>Powered by Claude AI · Built by Anthropic</span>
      </div>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-3" style={{ color: '#F9FAFB' }}>Everything a touring pro needs. In one place.</h2>
        <p className="text-sm text-center mb-12 max-w-2xl mx-auto" style={{ color: MUTED }}>Built with DP World Tour and PGA Tour professionals. Not adapted from a general sports app.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: '#F9FAFB' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SportRoleTabs sport="golf" demoHref="/golf/golf-demo" accentColor="#0D9488" accentColorDim="rgba(13,148,136,0.15)" roles={GOLF_ROLES} />

      {/* Spotlights */}
      <Spotlight
        eyebrow="Spotlight · Dashboard"
        title="Your entire week. One screen."
        bullets={[
          "Today's tee time, course fit score, and prize fund at a glance",
          "Dynamic points expiry strip — colour-coded by urgency, days counted down live",
          "SG Alert banner — AI identifies your weakest category and sets the practice agenda",
          "Sponsor obligation toast — notifies you at 09:00 when content is due",
        ]}
        mockup={<DashboardMockup />}
      />

      <Spotlight
        reverse
        eyebrow="Spotlight · OWGR & Points Forecaster"
        title="Know your ranking before the round ends."
        bullets={[
          "Live OWGR with weekly movement and 12-month trajectory chart",
          "Scenario modeller: pick your finish, see your exact new OWGR and Race to Dubai position",
          "Rolling 104-week expiry calendar — see which months your points drop off",
          "Race to Dubai standings showing your position relative to the top 50 cut",
        ]}
        mockup={<OWGRMockup />}
      />

      <Spotlight
        eyebrow="Spotlight · Strokes Gained"
        title="See exactly where you're losing shots."
        bullets={[
          "SG breakdown vs DP World Tour field average: OTT, Approach, ARG, Putting",
          "Spider chart showing your SG profile at a glance",
          "Round-by-round SG log for last 5 rounds",
          "AI-generated insight: \u201cFixing putting from 8-15ft alone could add 1+ shot per round\u201d",
        ]}
        mockup={<StrokesGainedMockup />}
      />

      <Spotlight
        reverse
        eyebrow="Spotlight · Sponsorship Manager"
        title="Every obligation. Every deadline. Tracked."
        bullets={[
          "£250k+ total annual value tracked",
          "Performance bonus triggers logged live (win bonus, ranking bonus)",
          "Renewal alerts — red when under 30 days",
          "Obligation reminder fires at 09:00 on content due days",
        ]}
        mockup={<SponsorshipMockup />}
      />

      <Spotlight
        eyebrow="Spotlight · Team Hub"
        title="Your team. In sync. Wherever they are."
        bullets={[
          "8 team roles, each with their own role-specific feed",
          "Status: on-site tournament, remote, treatment, cleared to play",
          "Latest activity visible to all — coach notes, caddie strategy, agent updates",
          "Morning briefing routed to each role separately",
        ]}
        mockup={<TeamHubMockup />}
      />

      {/* Integrations */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-3" style={{ color: '#F9FAFB' }}>Lumio Golf connects to the tools you already use.</h2>
        <p className="text-sm text-center mb-12" style={{ color: MUTED }}>DataGolf, Arccos, TrackMan and everything in between — your existing stack just works.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {INTEGRATIONS.map((it, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="text-2xl mb-2">{it.icon}</div>
              <div className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{it.name}</div>
              <div className="text-xs" style={{ color: MUTED }}>{it.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-12" style={{ color: '#F9FAFB' }}>Built for every professional golfer.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((t, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: ACCENT }}>Tier {i + 1}</div>
              <h3 className="text-base font-bold mb-3" style={{ color: '#F9FAFB' }}>{t.name}</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-12" style={{ color: '#F9FAFB' }}>Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRICING.map((p, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: CARD, border: p.highlight ? `2px solid ${ACCENT}` : `1px solid ${BORDER}` }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>{p.tier}</h3>
              <div className="text-2xl font-black mb-4" style={{ color: ACCENT }}>{p.price}</div>
              <ul className="space-y-2">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                    <span className="mt-0.5" style={{ color: ACCENT }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Founding Member CTA */}
      <section style={{ textAlign: 'center', padding: '80px 24px', background: '#07080F' }}>
        <div style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>FOUNDING MEMBER · 20 SPOTS</div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#F9FAFB', marginBottom: 12 }}>Want to be one of our first 20 golf athletes?</h2>
        <p style={{ fontSize: 16, color: '#9CA3AF', maxWidth: 500, margin: '0 auto 32px' }}>
          3 months free. No card. No commitment. All we ask is honest feedback.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/sports-signup?sport=golf" style={{ display: 'inline-flex', padding: '16px 32px', borderRadius: 12, backgroundColor: '#15803D', color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none' }}>
            Apply for founding access →
          </a>
          <a href="/golf/golf-demo" style={{ display: 'inline-flex', padding: '16px 32px', borderRadius: 12, backgroundColor: 'transparent', color: '#F9FAFB', fontSize: 16, fontWeight: 800, textDecoration: 'none', border: '1px solid #374151' }}>
            Or try the demo →
          </a>
        </div>
      </section>
    </div>
  )
}
