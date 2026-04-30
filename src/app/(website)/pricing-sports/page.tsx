'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

interface Tier {
  name: string
  price: string
  period: string
  bestFor: string
  features: string[]
  recommended?: boolean
  ctaLabel: string
  ctaHref: string
}

interface SportPricing {
  id: string
  icon: string
  label: string
  color: string
  subtitle: string
  desc: string
  tiers: Tier[]
  included: string[]
  addon?: { name: string; price: string; features: string[] }
}

const SPORTS: SportPricing[] = [
  {
    id: 'football-pro', icon: '⚽', label: 'Football Pro', color: '#10B981',
    subtitle: 'Pro Club · National League System',
    desc: 'Built for clubs from National League to League Two and beyond.',
    tiers: [
      { name: 'Starter', price: '£299', period: '/mo', bestFor: 'Step 3-4 clubs, part-time professional squads', features: ['Club dashboard and AI morning briefing', 'Squad management — register, availability, form', 'GPS performance (Lumio GPS)', 'Fixture calendar and match day centre', 'Basic financial dashboard', 'Up to 3 board user accounts'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Pro Club', price: '£799', period: '/mo', bestFor: 'National League, League Two and League One clubs', recommended: true, features: ['All Starter features, plus:', 'Full PSR/FSR compliance — live headroom', 'FIFA-style pitch view with set pieces (90+ routines)', 'Transfer pipeline and agent contacts', 'Full Board Suite — chairman, DoF, commercial views', 'Scouting reports and opposition analysis', 'AI team selection and tactical briefings', 'Unlimited user accounts'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Elite', price: '£1,800', period: '/mo', bestFor: 'League One, Championship and full professional clubs', features: ['All Pro Club features, plus:', 'Advanced PSR modelling and multi-season projections', 'Full commercial pipeline and partner activation', 'Custom board reporting and investor narrative', 'Priority account manager and quarterly review', 'White-label option for multi-club groups', 'API access for custom integrations'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['Lumio GPS integration', 'AI morning briefing — voice and text', 'FA compliance calendar and deadline alerts', 'Demo pre-seeded with Oakridge FC data', '14-day free trial on Starter and Pro Club', 'UK data hosting · GDPR compliant'],
  },
  {
    id: 'nonleague', icon: '🏟️', label: 'Non-League', color: '#F59E0B',
    subtitle: 'Steps 3-7 · National League System',
    desc: 'Built for the complexity of the non-league club.',
    tiers: [
      { name: 'Essential', price: '£99', period: '/mo', bestFor: 'Steps 6-7, volunteer-run clubs', features: ['Club dashboard and AI briefing', 'Squad register and availability tracker', 'Fixture calendar and match results', 'FA compliance calendar', 'Basic financial dashboard'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Club Pro', price: '£299', period: '/mo', bestFor: 'Steps 3-5 — NPL, Isthmian, Southern League', recommended: true, features: ['All Essential features, plus:', 'Player contract and wage bill tracker', 'FA Ground Grading compliance tracker', 'Whole Game System registration management', 'Sponsor pipeline — up to 20 active deals', 'Match day revenue per fixture', 'Board portal — chairman, treasurer, secretary', 'AI morning briefing with voice commands'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'League', price: '£499', period: '/mo', bestFor: 'National League North/South and ambitious Step 3', features: ['All Club Pro features, plus:', 'Scouting module and opposition analysis', 'Full commercial pipeline with activation', 'Lumio GPS integration', 'Dedicated account manager', 'FA Ground Grading gap analysis'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['Demo pre-seeded with Harfield FC data', 'FA compliance for your step level', 'UK data hosting · GDPR compliant', 'No per-player or per-user pricing'],
  },
  {
    id: 'grassroots', icon: '🟡', label: 'Grassroots', color: '#F97316',
    subtitle: '45,000 UK clubs · Sunday league to Step 7',
    desc: 'Flat per-club pricing. No per-player fees.',
    tiers: [
      { name: 'Free', price: '£0', period: '/mo', bestFor: 'Clubs wanting to try before committing', features: ['1 team, up to 16 players', 'Fixture calendar and availability requests', 'Basic squad communications', 'Match results entry'], ctaLabel: 'Start free', ctaHref: '/contact' },
      { name: 'Club', price: '£29', period: '/mo', bestFor: 'Most Sunday league and amateur clubs', recommended: true, features: ['All Free features, plus:', 'AI voice morning briefing', 'Unlimited teams and players', 'Player welfare — injury log, DBS tracker', 'Safeguarding compliance and concern log', 'Subs collection via Stripe', 'AI team selection', 'Parent portal — notifications, consent forms'], ctaLabel: 'Start free trial', ctaHref: '/contact' },
      { name: 'Pro', price: '£59', period: '/mo', bestFor: 'Larger clubs, youth academies', features: ['All Club features, plus:', 'Performance tracking — stats, form, MOTMs', 'Full safeguarding dashboard', 'Multi-team management across age groups', 'FA compliance — DBS expiry for all volunteers', 'Advanced parent portal with messaging'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
    ],
    included: ['No per-player or per-user pricing', 'Voice commands', 'WhatsApp Business integration', 'Demo pre-seeded with Sunday Rovers FC', 'UK data hosting · GDPR compliant (including minors)'],
  },
  {
    id: 'womensfootball', icon: '⚽', label: "Women's FC", color: '#EC4899',
    subtitle: 'WSL · WSL2 · Standalone clubs',
    desc: "The first platform priced for the professional women's game.",
    tiers: [
      { name: 'Grassroots Lite', price: '£199', period: '/mo', bestFor: "Semi-professional women's clubs below Tier 3", features: ['Player registry and dual registration', 'Basic welfare log — injury and return to play', 'Training scheduling and comms', 'Team sheet and pitch view', 'Match results and season record'], ctaLabel: 'Start free trial', ctaHref: '/contact' },
      { name: 'WSL2 Club', price: '£1,200', period: '/mo', bestFor: 'WSL2 (formerly Championship) clubs', features: ['All Lite features, plus:', 'FSR Compliance Dashboard — 80% cap tracking', 'Player Welfare Hub — maternity, ACL monitor', 'Dual registration management and alerts', 'Standalone sponsorship pipeline', 'Morning briefing — Director, coach, welfare', 'Board reporting dashboard'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'WSL Non-Big Four', price: '£2,500', period: '/mo', bestFor: 'Non-Big Four WSL clubs', recommended: true, features: ['All WSL2 features, plus:', 'Full sponsorship pipeline with FSR attribution', 'Bundled sponsorship attribution tool', 'Board Suite with investor tools', 'Club Planner — 1/3/5/10yr FSR models', 'Athlete Content and Social Suite', 'Set pieces library', 'Dedicated account manager'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Standalone', price: '£3,500', period: '/mo', bestFor: 'Clubs decoupling from parent structures', features: ['All WSL features, plus:', 'Demerger Readiness Tracker', 'Standalone valuation model', 'Multi-club ownership dashboard', 'White-label option', 'Quarterly business review'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['FSR compliance tracking', 'Karen Carney Review welfare standards', 'Lumio Health integration', 'Demo pre-seeded with WSL club data', 'UK data hosting · GDPR compliant'],
  },
  {
    id: 'rugby', icon: '🏉', label: 'Rugby', color: '#8B5CF6',
    subtitle: 'NL1 · Champ Rugby · Premiership',
    desc: 'Annual contracts aligned to the RFU salary cap year.',
    tiers: [
      { name: 'National League 1', price: '£800', period: '/mo', bestFor: '16 National League 1 clubs', features: ['Salary cap manager (ceiling + floor)', 'Squad availability tracker', 'Basic commercial pipeline', 'Morning briefing — DoR', 'Franchise readiness dashboard', 'Concussion & HIA tracker'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Champ Rugby', price: '£2,500', period: '/mo', bestFor: '14 Champ Rugby clubs', recommended: true, features: ['All NL1 features, plus:', 'Full salary cap suite — scenario modeller, audit', 'Franchise readiness — all 6 criteria + EOI builder', 'Recruitment pipeline with cap impact modeller', 'Lumio Health integration', 'Club-to-country data interface (MPGP)', "Women's rugby — PWR compliance", 'Commercial OS — sponsorship, matchday, stadium', 'Dedicated account manager'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Premiership', price: '£4,000', period: '/mo', bestFor: 'Gallagher Premiership clubs', features: ['All Champ features, plus:', 'Legal-grade concussion audit trail', 'Full RFU salary cap audit export', 'Premiership-specific franchise modules', 'Advanced club-to-country interface', 'Quarterly strategic review'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['Annual contracts — aligned to RFU cap year', 'Lumio Health data integration', 'Franchise readiness criteria mapping', 'Demo pre-seeded with Hartfield RFC data', 'UK data hosting · GDPR compliant'],
    addon: { name: "Women's PWR Add-On", price: '£600/mo', features: ["Women's squad management", 'PWR compliance tracking', 'Shared facility scheduling', "Women's commercial pipeline"] },
  },
  {
    id: 'tennis', icon: '🎾', label: 'Tennis', color: '#A3E635',
    subtitle: 'ATP · WTA · Touring professionals',
    desc: 'Per-player pricing covering the full touring team.',
    tiers: [
      { name: 'Tour', price: '£299', period: '/mo', bestFor: 'ATP/WTA ranked players, full team', recommended: true, features: ['ATP/WTA ranking — points expiry calendar', 'Race to Turin/Fort Worth tracker', 'Surface win rate breakdown', 'H2H records and opponent scouting', 'Sponsorship manager', 'Prize money ledger and tax tracker', 'AI morning briefing — 4 role views', 'Physio and recovery dashboard', 'Up to 6 team accounts'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Elite', price: '£599', period: '/mo', bestFor: 'Top 100 players with full management', features: ['All Tour features, plus:', 'Advanced opposition analysis packs', 'Full financial planning — career projection', 'Athlete content and social suite', 'Priority account manager', 'Custom integrations'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['Demo pre-seeded with ATP #67 Alex Rivera', 'Role-specific briefings per team member', 'UK data hosting · GDPR compliant'],
  },
  {
    id: 'golf', icon: '⛳', label: 'Golf', color: '#38BDF8',
    subtitle: 'DP World Tour · PGA Tour · OWGR',
    desc: 'Per-player pricing for the touring professional and team.',
    tiers: [
      { name: 'Tour', price: '£299', period: '/mo', bestFor: 'DP World and PGA Tour professionals', recommended: true, features: ['OWGR tracker with points forecaster', 'Race to Dubai and FedExCup standings', 'Strokes Gained deep-dive (4 categories)', 'Course fit AI across 47+ venues', 'Caddie workflow dashboard', 'Sponsorship manager', 'Prize money ledger and tax tracker', 'AI morning briefing — 4 role views', 'Up to 6 team accounts'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Elite', price: '£599', period: '/mo', bestFor: 'Top 50 OWGR with full management', features: ['All Tour features, plus:', 'Advanced tournament prep packs', 'Full career financial planning', 'Athlete content tracker', 'Priority account manager', 'Custom integrations (Lumio Range, ShotLink)'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['Demo pre-seeded with OWGR #87 James Halton', 'Caddie view included in all tiers', 'UK data hosting · GDPR compliant'],
  },
  {
    id: 'darts', icon: '🎯', label: 'Darts', color: '#EF4444',
    subtitle: 'PDC Tour · Challenge Tour · Q-School',
    desc: 'Per-player pricing for PDC tour card holders. 51 portal features.',
    tiers: [
      { name: 'Tour', price: '£149', period: '/mo', bestFor: 'PDC tour card holders and Challenge Tour', recommended: true, features: ['Order of Merit + Tour Card Monitor', 'Merit Forecaster (round-by-round simulator)', 'Performance Rating + dartboard heatmap', 'Pressure Analysis (deciding-leg gap)', 'Equipment Setup tracker (Supabase backed)', 'Match Prep + AI tactical briefing', 'Practice Games (8 tracked games)', 'Player Onboarding wizard', 'Up to 3 team accounts'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Elite', price: '£299', period: '/mo', bestFor: 'Top 16 PDC players', features: ['All Tour features, plus:', 'Lumio Live Scoring, PDC Live Data and Scolia integrations', 'Premier League + World Series trackers', 'Fan Engagement hub across 4 social platforms', 'Threaded Team Comms with full team', 'Sponsorship pipeline + Exhibition Manager', 'Priority account manager'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['Demo pre-seeded with PDC #19 Jake Morrison', '5-step onboarding wizard at /darts/onboarding', 'UK data hosting · GDPR compliant'],
  },
  {
    id: 'boxing', icon: '🥊', label: 'Boxing', color: '#DC2626',
    subtitle: 'Professional boxing · All sanctioning bodies',
    desc: 'Per-fighter pricing for the professional boxer and corner team.',
    tiers: [
      { name: 'Pro', price: '£199', period: '/mo', bestFor: 'British/European champions and world contenders', recommended: true, features: ['Purse simulator — exact take-home before signing', 'World rankings — WBC, WBA, WBO, IBF, Zuffa', 'Multi-jurisdiction tax — UK, USA, Saudi, UAE, Germany', 'Fight camp planner — 8-12 week structured', 'Weight and cut tracker — daily log', 'Recovery and HRV monitoring', 'Contract intelligence — Zuffa vs Matchroom', 'Medical record and injury log', 'AI morning briefing — 4 role views', 'Up to 6 team accounts'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'Elite', price: '£399', period: '/mo', bestFor: 'World champions and top 5 contenders', features: ['All Pro features, plus:', 'Full promotional pipeline', 'Mandatory challenger pathway tracking', 'Athlete content and media suite', 'Full commercial pipeline', 'Priority account manager'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['Demo pre-seeded with Marcus Cole (heavyweight)', 'All 5 sanctioning body rankings', 'Saudi, UAE and Germany tax modes', 'UK data hosting · GDPR compliant'],
  },
  {
    id: 'cricket', icon: '🏏', label: 'Cricket', color: '#FBBF24',
    subtitle: 'County · International · IPL · The Hundred · BBL',
    desc: 'Per-player pricing across multiple formats and competitions.',
    tiers: [
      { name: 'County/Franchise', price: '£199', period: '/mo', bestFor: 'County professionals, franchise players', recommended: true, features: ['Contract tracker — county, central, franchise', 'Franchise schedule — IPL, Hundred, BBL, SA20', 'Batting and bowling analytics — format splits', 'Injury and fitness management', 'Sponsorship and commercial pipeline', 'AI morning briefing — 3 role views', 'Up to 4 team accounts'], ctaLabel: 'Book a demo', ctaHref: '/contact' },
      { name: 'International', price: '£399', period: '/mo', bestFor: 'England-contracted and international players', features: ['All County features, plus:', 'ECB central contract management', 'International scheduling conflict detection', 'Full financial planning — career earnings', 'Media and content calendar', 'Priority account manager'], ctaLabel: 'Talk to us', ctaHref: '/contact' },
    ],
    included: ['Covers all major T20 franchise competitions', 'Demo pre-seeded with realistic data', 'UK data hosting · GDPR compliant'],
  },
]

// ─── Tier Card ────────────────────────────────────────────────────────────────

function TierCard({ tier, color }: { tier: Tier; color: string }) {
  return (
    <div
      className="relative flex flex-col rounded-xl p-6"
      style={{
        backgroundColor: '#0D1117',
        border: `1px solid ${tier.recommended ? color : '#1E293B'}`,
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      {tier.recommended && (
        <div
          className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: color, color: '#07080F' }}
        >
          Recommended
        </div>
      )}

      {/* Name */}
      <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>
        {tier.name}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-4xl font-bold tracking-tight" style={{ color: '#F9FAFB' }}>
          {tier.price}
        </span>
        <span className="text-sm" style={{ color: '#6B7280' }}>
          {tier.period}
        </span>
      </div>

      {/* Best for */}
      <p className="text-xs italic mb-5" style={{ color: '#6B7280' }}>
        {tier.bestFor}
      </p>

      {/* Divider */}
      <div className="mb-5" style={{ height: 1, backgroundColor: '#1E293B' }} />

      {/* Features */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {tier.features.map((f: string) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check
              size={14}
              className="mt-0.5 shrink-0"
              style={{ color: color }}
            />
            <span className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={tier.ctaHref}
        className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        style={
          tier.recommended
            ? { backgroundColor: color, color: '#07080F' }
            : { backgroundColor: '#111827', color: '#F9FAFB', border: '1px solid #1E293B' }
        }
      >
        {tier.ctaLabel}
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}

// ─── Sport Panel ──────────────────────────────────────────────────────────────

function SportPanel({ sport }: { sport: SportPricing }) {
  return (
    <div>
      {/* Sport header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl shrink-0"
          style={{ backgroundColor: `${sport.color}20` }}
        >
          {sport.icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>
            {sport.label}
          </h2>
          <p className="text-sm font-medium mt-0.5" style={{ color: sport.color }}>
            {sport.subtitle}
          </p>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {sport.desc}
          </p>
        </div>
      </div>

      {/* Tier cards */}
      <div className="flex gap-4 mb-8 flex-wrap lg:flex-nowrap">
        {sport.tiers.map((tier: Tier) => (
          <TierCard key={tier.name} tier={tier} color={sport.color} />
        ))}
      </div>

      {/* What's included + addon row */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        {/* What's included */}
        <div
          className="rounded-xl p-6 flex-1"
          style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
            What&apos;s included in every plan
          </p>
          <ul className="space-y-2.5">
            {sport.included.map((item: string) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: sport.color }}
                />
                <span className="text-sm" style={{ color: '#9CA3AF' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Addon card */}
        {sport.addon && (
          <div
            className="rounded-xl p-6 lg:w-72 shrink-0"
            style={{
              backgroundColor: '#0D1117',
              border: `1px solid ${sport.color}44`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#4B5563' }}>
              Add-on
            </p>
            <p className="text-base font-bold mb-1" style={{ color: '#F9FAFB' }}>
              {sport.addon.name}
            </p>
            <p className="text-sm font-semibold mb-4" style={{ color: sport.color }}>
              {sport.addon.price}
            </p>
            <ul className="space-y-2">
              {sport.addon.features.map((f: string) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={14} className="mt-0.5 shrink-0" style={{ color: sport.color }} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingSportsPage() {
  const [activeTab, setActiveTab] = useState<number>(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeSport: SportPricing = SPORTS[activeTab]

  return (
    <main style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-6 pt-24 pb-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
          Pricing
        </p>
        <h1 className="text-4xl font-bold leading-tight mb-4 lg:text-5xl" style={{ color: '#F9FAFB' }}>
          Transparent pricing for every sport.
        </h1>
        <p className="text-base max-w-xl mx-auto mb-12" style={{ color: '#6B7280' }}>
          No per-player fees. No hidden seats. One flat monthly price — and everything your sport needs, out of the box.
        </p>

        {/* Principle cards */}
        <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
          {[
            { title: 'Simple', body: 'One flat price per tier. No per-player or per-user charges.' },
            { title: 'Transparent', body: 'Every feature listed up front — no feature gates after purchase.' },
            { title: 'Sport-specific', body: 'Each sport has its own pricing, built around its real costs.' },
          ].map((card: { title: string; body: string }) => (
            <div
              key={card.title}
              className="rounded-xl px-6 py-5 text-left flex-1"
              style={{
                backgroundColor: '#0D1117',
                border: '1px solid #1E293B',
                minWidth: 200,
              }}
            >
              <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>
                {card.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main pricing section ──────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">

          {/* Tab bar */}
          <div className="flex justify-center mb-10">
            <div
              ref={scrollRef}
              className="flex gap-1.5 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none' }}
            >
              {SPORTS.map((s: SportPricing, i: number) => {
                const isActive = i === activeTab
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveTab(i)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: isActive ? s.color : '#111318',
                      color: isActive ? '#F9FAFB' : '#6B7280',
                      border: `1px solid ${isActive ? s.color : '#1F2937'}`,
                    }}
                  >
                    <span role="img" aria-label={s.label} style={{ fontSize: 12 }}>
                      {s.icon}
                    </span>
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active sport panel */}
          <SportPanel sport={activeSport} />

        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="rounded-2xl px-8 py-12"
            style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>
              Need help choosing?
            </p>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#F9FAFB' }}>
              Not sure which tier fits?
            </h2>
            <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: '#6B7280' }}>
              Book a 30-minute call and we will map your club or athlete setup to the right tier — no sales pressure.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#10B981', color: '#07080F' }}
              >
                Book a free call
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/demo"
                className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#111827', color: '#F9FAFB', border: '1px solid #1E293B' }}
              >
                Explore a live demo
                <ArrowRight size={14} />
              </Link>
            </div>

            <p className="text-xs" style={{ color: '#374151' }}>
              All plans include a 14-day free trial where applicable. No credit card required to start. Cancel any time.
            </p>
          </div>
        </div>
      </section>

    </main>
  )
}
