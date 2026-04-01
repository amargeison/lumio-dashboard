'use client'
import Link from 'next/link'
import { ArrowRight, Shield, Users, Target, Zap, BarChart3, Mic, Monitor, Layers, Award, Lock, Plug, Star, ChevronRight } from 'lucide-react'

const RED = '#C0392B'
const GOLD = '#F1C40F'
const BG = '#0A0B10'
const CARD = '#111318'
const BORDER = '#1F2937'

const STATS = [
  { value: '15+', label: 'Departments' },
  { value: '45+', label: 'Quick Actions' },
  { value: 'GPS', label: 'Catapult & STATSports' },
  { value: 'RBAC', label: 'Role-Based Access' },
  { value: 'AI', label: 'Powered Insights' },
]

const FEATURES = [
  { icon: '📡', title: 'GPS & Wearables', badge: 'Industry First', badgeColor: RED,
    headline: 'Live Player Load Data on Your Dashboard',
    bullets: ['Direct integration with Catapult and STATSports', 'Session load, high-speed distance, sprint count', 'Player readiness scores updated after every session', 'Red flag alerts for overload or injury risk', 'Historical trends and load management charts'],
  },
  { icon: '🏛️', title: 'Board Suite', badge: 'Board Level Intelligence', badgeColor: GOLD,
    headline: 'Run Your Club Like a Business',
    bullets: ['Confidential board notes and meeting minutes', 'PSR/FFP dashboard with financial headroom calculator', 'Transfer budget tracking — spent, committed, remaining', 'Revenue vs expenditure reporting', 'Confidential transfer strategy documents', 'Role-gated: Chairman, CEO, and DoF access only'],
  },
  { icon: '🌅', title: 'Morning Roundup', badge: null, badgeColor: '',
    headline: 'Your Club, First Thing Every Morning',
    bullets: ['Agent messages, board communications, media enquiries', 'Unified inbox across Outlook, Gmail and Slack', 'Voice briefing — hear your club summary hands-free', 'AI-powered priority sorting and urgent flagging', 'One-tap actions: reply, forward, schedule meeting'],
  },
  { icon: '👥', title: 'Squad Management', badge: null, badgeColor: '',
    headline: 'Know Your Squad Inside Out',
    bullets: ['Player profiles with availability, fitness and form', 'GPS readiness scores integrated per player', 'Injury tracker with return-to-play timelines', 'Squad planner with contract expiry alerts', 'Academy pipeline with promotion candidates'],
  },
  { icon: '🔄', title: 'Transfer Hub', badge: null, badgeColor: '',
    headline: 'Your Entire Transfer Operation in One Place',
    bullets: ['Target tracking and scouting pipeline', 'Agent relationship management with contact log', 'Budget allocation by position priority', 'Confidential offload pipeline', 'PSR/FFP impact calculator per signing'],
  },
  { icon: '📋', title: 'Tactics Viewer', badge: null, badgeColor: '',
    headline: 'Visualise Your Game Plan',
    bullets: ['Interactive SVG pitch with clickable positions', 'Multiple formation templates (4-3-3, 3-5-2, etc.)', 'Save and compare tactical setups', 'Share with coaching staff digitally', 'Set piece routines with movement arrows'],
  },
  { icon: '🏟️', title: 'Match Day', badge: null, badgeColor: '',
    headline: 'Everything You Need on Match Day',
    bullets: ['Team sheet builder with drag-and-drop', 'Live match notes and tactical adjustments', 'Half-time data review with GPS stats', 'Post-match analysis and player ratings', 'Press conference prep with AI briefing notes'],
  },
  { icon: '📰', title: 'Media & PR', badge: null, badgeColor: '',
    headline: "Control Your Club's Narrative",
    bullets: ['Press conference prep with AI-generated talking points', 'Likely media questions with suggested responses', 'Social media content calendar', 'Media request inbox and approval workflow', 'Confidential: manager briefing notes'],
  },
  { icon: '⭐', title: 'Academy', badge: null, badgeColor: '',
    headline: "Develop Tomorrow's Stars",
    bullets: ['Academy player tracking across age groups', 'Development pathway management', 'U21 and U18 squad integration', 'Promotion pipeline to first team', 'Scout reports linked to academy targets'],
  },
  { icon: '🔐', title: 'Role-Based Access', badge: null, badgeColor: '',
    headline: 'The Right Information for the Right People',
    bullets: ['Chairman sees everything including financials', 'Head Coach sees squad, tactics, training — not finances', 'Scouts see scouting pipeline only', 'One platform, multiple permission levels', 'Role switcher for testing different views'],
  },
  { icon: '🔌', title: 'Integrations', badge: null, badgeColor: '',
    headline: 'Connects With Your Existing Tools',
    bullets: ['Catapult & STATSports GPS wearables', 'Microsoft Outlook & Gmail', 'Microsoft Teams & Slack', 'Google Calendar & Outlook Calendar', 'Xero, QuickBooks and accounting platforms'],
  },
]

const TESTIMONIALS = [
  { quote: 'Lumio has completely changed how our board operates. The PSR dashboard alone has saved us thousands in consultancy fees.', name: 'James Whitworth', role: 'CEO', club: 'Championship Club' },
  { quote: 'The morning roundup means I walk into the training ground knowing exactly what needs my attention. Game changer.', name: 'Mark Stevens', role: 'Head Coach', club: 'League One Club' },
  { quote: 'Having GPS data, squad management and transfer tracking in one platform is something we\'ve needed for years.', name: 'Sarah Collins', role: 'Director of Football', club: 'League Two Club' },
]

const PRICING = [
  { tier: 'Academy', desc: 'Youth development and academy tracking', features: ['Academy player profiles', 'Development pathways', 'U18/U21 squad management', 'Basic reporting'] },
  { tier: 'First Team', desc: 'Complete first team operations', features: ['Everything in Academy', 'Squad management & GPS', 'Tactics viewer & match day', 'Transfer hub', 'Media & PR tools'], highlight: true },
  { tier: 'Full Club', desc: 'Enterprise platform for the entire club', features: ['Everything in First Team', 'Board Suite with PSR/FFP', 'Financial integration', 'Multi-department access', 'Dedicated account manager'] },
]

export default function FootballPage() {
  return (
    <div style={{ backgroundColor: BG, color: '#F9FAFB' }}>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BG}, #1a0a0a)` }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 20% 50%, ${RED}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${GOLD}20 0%, transparent 50%)` }} />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: `${RED}20`, border: `1px solid ${RED}40` }}>
            <span className="text-sm font-bold" style={{ color: RED }}>⚽</span>
            <span className="text-xs font-semibold" style={{ color: RED }}>Built for Championship & League Football</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            The Complete Club<br />Management Platform
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
            From the boardroom to the training pitch — everything your club needs in one place
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book-demo" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ backgroundColor: RED, color: '#F9FAFB', textDecoration: 'none' }}>
              Request a Demo <ArrowRight size={18} />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB', textDecoration: 'none' }}>
              See All Features
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap justify-center gap-8 md:gap-16">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black" style={{ color: GOLD }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 space-y-20">
        {FEATURES.map((f, i) => (
          <div key={f.title} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
            {/* Text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{f.icon}</span>
                <h2 className="text-2xl font-black">{f.title}</h2>
                {f.badge && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${f.badgeColor}20`, color: f.badgeColor, border: `1px solid ${f.badgeColor}40` }}>
                    {f.badge}
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold mb-4" style={{ color: '#9CA3AF' }}>{f.headline}</p>
              <ul className="space-y-2">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                    <ChevronRight size={14} className="shrink-0 mt-0.5" style={{ color: RED }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual placeholder */}
            <div className="flex-1 w-full">
              <div className="rounded-2xl p-8 flex items-center justify-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, minHeight: 280, background: `linear-gradient(135deg, ${CARD}, ${i % 2 === 0 ? `${RED}08` : `${GOLD}08`})` }}>
                <div className="text-center">
                  <span className="text-6xl block mb-3">{f.icon}</span>
                  <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>{f.title}</p>
                  <p className="text-xs mt-1" style={{ color: '#4B5563' }}>Interactive preview coming soon</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0D0E14' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-2">Trusted by Professional Clubs Across the EFL</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>See how clubs are using Lumio to transform their operations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={GOLD} style={{ color: GOLD }} />)}
                </div>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: '#D1D5DB' }}>&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{t.role} — {t.club}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/book-demo" className="text-sm font-semibold" style={{ color: RED, textDecoration: 'underline' }}>
              Request a case study →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-2">Pricing Tailored to Your Club</h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>All plans include onboarding support and a dedicated account manager</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map(p => (
            <div key={p.tier} className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: CARD, border: p.highlight ? `2px solid ${RED}` : `1px solid ${BORDER}` }}>
              {p.highlight && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full self-start mb-3" style={{ backgroundColor: `${RED}20`, color: RED }}>Most Popular</span>}
              <h3 className="text-xl font-black mb-1">{p.tier}</h3>
              <p className="text-xs mb-4" style={{ color: '#6B7280' }}>{p.desc}</p>
              <ul className="space-y-2 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#D1D5DB' }}>
                    <ChevronRight size={12} className="shrink-0 mt-0.5" style={{ color: RED }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/book-demo" className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: p.highlight ? RED : 'rgba(255,255,255,0.05)', color: '#F9FAFB', border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)', textDecoration: 'none' }}>
                Request Pricing <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(135deg, ${RED}15, ${GOLD}08)` }}>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Transform How Your Club Operates?</h2>
          <p className="text-lg mb-8" style={{ color: '#9CA3AF' }}>Join the clubs already using Lumio Pro Club</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book-demo" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ backgroundColor: RED, color: '#F9FAFB', textDecoration: 'none' }}>
              Book a Demo <ArrowRight size={18} />
            </Link>
            <a href="#" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB', textDecoration: 'none' }}>
              Download Feature Overview
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 text-center" style={{ borderTop: `1px solid ${BORDER}` }}>
        <p className="text-xs" style={{ color: '#4B5563' }}>&copy; {new Date().getFullYear()} Lumio Ltd. All rights reserved. · <Link href="/privacy" style={{ color: '#4B5563' }}>Privacy</Link> · <Link href="/terms" style={{ color: '#4B5563' }}>Terms</Link></p>
      </footer>
    </div>
  )
}
