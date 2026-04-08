'use client'

import Link from 'next/link'

const ACCENT = '#8B5CF6'
const ACCENT_DARK = '#7C3AED'
const BG = '#07080F'
const CARD = '#0D1117'
const BORDER = '#1E293B'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const STAT_PILLS = ['50+ features', 'Championship · Blast · OD · Hundred', 'AI powered', 'ECB compliant', 'GPS ready']

const FEATURES = [
  {
    icon: '🏏',
    title: 'Multi-Format Squad Manager',
    desc: 'One squad, four formats. Track availability, form and selection across County Championship, Vitality Blast, One-Day Cup and The Hundred with format-specific KPIs and rotation planning.',
  },
  {
    icon: '📊',
    title: 'Performance Analytics',
    desc: 'Batting averages, strike rates, bowling economy, wagon wheels, pitch maps and spell analysis. Compare players across formats, seasons and opposition with the depth head coaches actually need.',
  },
  {
    icon: '📡',
    title: 'GPS Vest Integration',
    desc: 'Live Catapult and STATSports feeds into bowling load management. ACWR monitoring, high-speed distance, player load and red-flag alerts before injuries happen.',
  },
  {
    icon: '🛡️',
    title: 'ECB Compliance Hub',
    desc: 'Registration, anti-doping, safeguarding, concussion protocols, DBS tracking and PCA welfare logs. Everything the ECB audits in one place, always ready for inspection.',
  },
  {
    icon: '🤖',
    title: 'AI Morning Briefing',
    desc: 'Claude-powered daily briefing for director of cricket and head coach — squad availability, load flags, pitch report, opposition intel and AI toss decision advisor on match day.',
  },
  {
    icon: '💼',
    title: 'Commercial & Governance',
    desc: 'Central contracts, signing pipeline kanban, sponsorship activation tracker, board reporting dashboards and finance exports. Built for CEOs and directors of cricket, not just coaches.',
  },
]

const AUDIENCE = [
  {
    title: 'Director of Cricket',
    desc: 'Squad depth, signing pipeline, contract renewals, performance vs budget and selection intelligence across all four formats.',
  },
  {
    title: 'Club CEO',
    desc: 'Commercial dashboard, board packs, ECB compliance status, membership and match-day revenue — the whole club on one screen.',
  },
  {
    title: 'Player Welfare Lead',
    desc: 'Bowling load ACWR monitoring, injury logs, PCA welfare flags, mental health check-ins and concussion tracking with audit trail.',
  },
]

const PRICING = [
  {
    tier: 'Pro',
    price: '£249',
    period: '/mo',
    blurb: 'For county clubs running a professional squad.',
    features: [
      'Full squad manager (all 4 formats)',
      'Performance analytics & scouting',
      'ECB compliance hub',
      'Injury & medical logs',
      'AI morning briefing',
      'Board reporting exports',
    ],
  },
  {
    tier: 'Pro+',
    price: '£449',
    period: '/mo',
    highlight: true,
    blurb: 'Everything in Pro, plus AI and GPS integrations.',
    features: [
      'Everything in Pro',
      'GPS vest live integration',
      'Bowling load ACWR monitoring',
      'AI toss decision advisor',
      'AI contract renewal summaries',
      'AI match report generator',
      'Dedicated onboarding & support',
    ],
  },
]

export default function CricketPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT }}>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <img
          src="/Sports/cricket_logo.png"
          alt="Lumio Cricket"
          className="w-24 h-24 mx-auto mb-6 rounded-2xl object-contain"
          style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, padding: 12 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          Lumio Tour · Cricket
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-5 leading-tight" style={{ color: TEXT }}>
          The cricket operations platform<br />built for professional clubs.
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8" style={{ color: MUTED }}>
          Squad management across all four formats, GPS-integrated bowling load monitoring, ECB compliance, AI-powered match day decisions and commercial governance — the full stack for county and franchise cricket.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {STAT_PILLS.map((p, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
              {p}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/cricket/demo" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#07080F' }}>
            Try the live demo →
          </Link>
          <Link href="/contact" className="px-6 py-3 rounded-xl text-sm font-bold transition-all" style={{ backgroundColor: 'transparent', color: TEXT, border: `1px solid ${BORDER}` }}>
            Book a walkthrough
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: TEXT }}>Built for professional cricket</h2>
        <p className="text-base text-center mb-12 max-w-2xl mx-auto" style={{ color: MUTED }}>
          Six core pillars, fifty-plus modules. Everything a modern county or franchise club needs to run on match day and between seasons.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl p-6 transition-all hover:-translate-y-0.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>{f.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: TEXT }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: TEXT }}>Who it&apos;s for</h2>
        <p className="text-base text-center mb-12" style={{ color: MUTED }}>One platform, three decision-makers — all looking at the same source of truth.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AUDIENCE.map((a, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-sm font-black" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>{String(i + 1).padStart(2, '0')}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: TEXT }}>{a.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: TEXT }}>Simple pricing</h2>
        <p className="text-base text-center mb-12" style={{ color: MUTED }}>Pick the tier that fits your club. Upgrade any time.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRICING.map((p, i) => (
            <div key={i} className="rounded-2xl p-8 relative" style={{ backgroundColor: CARD, border: p.highlight ? `2px solid ${ACCENT}` : `1px solid ${BORDER}` }}>
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: ACCENT, color: '#07080F' }}>
                  Most popular
                </div>
              )}
              <h3 className="text-xl font-black mb-1" style={{ color: TEXT }}>{p.tier}</h3>
              <p className="text-sm mb-4" style={{ color: MUTED }}>{p.blurb}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black" style={{ color: ACCENT }}>{p.price}</span>
                <span className="text-sm font-semibold" style={{ color: MUTED }}>{p.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                    <span className="mt-0.5" style={{ color: ACCENT }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/cricket/onboarding" className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: p.highlight ? ACCENT : 'transparent', color: p.highlight ? '#07080F' : TEXT, border: p.highlight ? 'none' : `1px solid ${BORDER}` }}>
                Set up your portal →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at top, ${ACCENT}, transparent 60%)` }} />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: TEXT }}>Ready to run your club on Lumio?</h2>
            <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto" style={{ color: MUTED }}>
              See the full platform in under five minutes. Then set up your club&apos;s portal and invite your coaching, medical and commercial teams.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/cricket/demo" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#07080F' }}>
                Try the live demo →
              </Link>
              <Link href="/cricket/onboarding" className="px-6 py-3 rounded-xl text-sm font-bold transition-all" style={{ backgroundColor: 'transparent', color: TEXT, border: `1px solid ${BORDER}` }}>
                Set up your portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
