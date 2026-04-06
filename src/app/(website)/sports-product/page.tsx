'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronRight, Target, Activity, Trophy, Users, DollarSign, Zap, Shield, BarChart2 } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const PORTALS = [
  {
    id: 'football', icon: '⚽', label: 'Football Pro', color: '#10B981',
    desc: 'From League Two to the Premier League — squad management, GPS performance tracking (PlayerData), PSR compliance, scouting pipeline, transfer tracking, board reporting and AI match intelligence.',
    modules: [
      { name: 'Squad Management', detail: 'Full player register, contracts, availability, injury log and form guide in one view.' },
      { name: 'GPS Performance', detail: 'PlayerData EDGE integration. Session load, ACWR, readiness scores and heat maps pulled automatically.' },
      { name: 'PSR & Financial Compliance', detail: 'Wage bill vs budget, profit and sustainability rules tracker, board financial reporting.' },
      { name: 'Transfer Intelligence', detail: 'Pipeline tracking, agent contacts, scouting reports and transfer window deadlines.' },
      { name: 'AI Match Intelligence', detail: 'Opponent analysis, set piece prep, tactical briefings and post-match performance review.' },
    ],
    integrations: ['PlayerData', 'Hudl', 'Wyscout', 'FA Whole Game System', 'Xero'],
    checks: ['Live squad dashboard updated in real time', 'GPS session data synced automatically from PlayerData', 'AI morning briefing for manager and coaching staff', 'FA compliance alerts and registration deadlines', 'Board financial report — one click, monthly'],
    cta: 'See Football Pro live in a demo', href: '/football/lumio-dev',
  },
  {
    id: 'nonleague', icon: '🏟️', label: 'Non-League', color: '#F59E0B',
    desc: 'The first club management OS built for Steps 3-7 of the National League System. Player contracts, wage bill tracking, FA Ground Grading compliance, sponsor pipeline, match day revenue and AI manager briefing.',
    modules: [
      { name: 'Contract & Wage Management', detail: 'Player register, weekly wages, signing-on fees, contract expiry alerts and wage bill vs budget.' },
      { name: 'FA Compliance', detail: 'Registration deadlines, Ground Grading checklist, DBS tracker, safeguarding log and Whole Game System sync.' },
      { name: 'Commercial Pipeline', detail: 'Sponsor deals, obligations, renewal alerts and commercial income vs season target.' },
      { name: 'Match Day Revenue', detail: 'Gate receipts, bar, programme sales and season ticket tracker per fixture.' },
      { name: 'Board Portal', detail: 'Chairman, treasurer, secretary and commercial director each with role-specific views.' },
    ],
    integrations: ['PlayerData', 'FA Whole Game System', 'Stripe', 'Xero'],
    checks: ['Wage bill vs budget — live view for chairman', 'FA Ground Grading compliance tracker with inspection dates', 'AI morning briefing for manager on training days', 'Sponsor renewal alerts — 90, 60, 30 days out', 'Monthly board report — one-click PDF export'],
    cta: 'See Non-League live in a demo', href: '/football/nonleague/harfield-fc',
  },
  {
    id: 'grassroots', icon: '🟡', label: 'Grassroots', color: '#F97316',
    desc: 'Where Sunday legends are made. AI voice briefings, player welfare dashboards, safeguarding compliance, subs collection and AI team selection — for the 45,000 clubs that currently run on WhatsApp and spreadsheets.',
    modules: [
      { name: 'AI Manager Briefing', detail: 'Voice-powered morning briefing. Training tonight, availability, subs outstanding, safeguarding alerts.' },
      { name: 'Player Welfare', detail: 'Injury log, medical conditions, DBS expiry, safeguarding concern log and return-to-play workflow.' },
      { name: 'Subs & Finance', detail: 'Stripe direct debit, match fees, outstanding payments dashboard and automated reminders.' },
      { name: 'AI Team Selection', detail: 'Suggests XI based on availability, form and fitness. Formation builder. Suspension aware.' },
      { name: 'Squad Management', detail: 'Player register, availability requests, season stats and form guide.' },
    ],
    integrations: ['Stripe', 'WhatsApp Business', 'Google Calendar'],
    checks: ['Voice commands — log injury, check availability, cancel training', 'Subs collection via Stripe direct debit', 'Safeguarding compliance dashboard', 'AI team selection based on availability and form', 'Parent portal — notifications, stats, consent forms'],
    cta: 'See Grassroots live in a demo', href: '/football/grassroots/sunday-rovers-fc',
  },
  {
    id: 'tennis', icon: '🎾', label: 'Tennis', color: '#A3E635',
    desc: 'ATP/WTA ranking tracker, tournament schedule planner, match prep tools, sponsorship manager, physio & recovery dashboard, agent financial pipeline and AI morning briefing.',
    modules: [
      { name: 'Rankings & Race', detail: 'ATP/WTA ranking, Race to Turin standings, points expiry calendar and ranking forecaster.' },
      { name: 'Tournament Schedule', detail: 'Entry deadlines, withdrawal windows, prize money and points breakdown per round.' },
      { name: 'Team Hub', detail: 'Coach, physio, agent and stringer — role-specific views on one platform.' },
      { name: 'Sponsorship & Commercial', detail: 'Deals, renewal dates, obligations and prize money ledger.' },
      { name: 'AI Morning Briefing', detail: 'Personalised daily intelligence for player, coach, agent and physio.' },
    ],
    integrations: ['WHOOP', 'Garmin', 'Dartfish', 'ATP/WTA APIs'],
    checks: ['All 4 Grand Slam entry and withdrawal deadlines tracked', 'Surface breakdown — win rates on clay, grass, hard', 'H2H records and opponent scouting notes', 'Multi-jurisdiction prize money and tax tracker', 'Team briefings at different times for each role'],
    cta: 'See Tennis Tour live in a demo', href: '/tennis/tennis-demo',
  },
  {
    id: 'golf', icon: '⛳', label: 'Golf', color: '#38BDF8',
    desc: 'OWGR tracker, Race to Dubai, strokes gained analytics, caddie workflow, course fit scoring, exemptions tracker, sponsorship manager and AI morning briefing for the full team.',
    modules: [
      { name: 'OWGR & Race to Dubai', detail: 'Real-time world ranking, FedExCup standings, points expiry and ranking forecaster.' },
      { name: 'Strokes Gained Analytics', detail: 'Full SG breakdown: Off the Tee, Approach, Around the Green, Putting.' },
      { name: 'Course Fit & Strategy', detail: 'AI course fit scoring, historical data and pre-round strategic notes per venue.' },
      { name: 'Caddie Workflow', detail: 'Yardage notes, weather adjustments, club recommendations and round prep tools.' },
      { name: 'Commercial Dashboard', detail: 'Sponsorship, Pro-Am appearances, prize money ledger and tax tracker.' },
    ],
    integrations: ['DataGolf', 'Arccos', 'TrackMan', 'ShotLink', 'PGA Tour API'],
    checks: ['DP World Tour and PGA Tour schedule in one calendar', 'Strokes gained alerts when a category needs attention', 'Tour card status and exemption categories tracked', 'Caddie has their own dedicated dashboard view', 'Multi-jurisdiction tax modelling for Saudi, US, UK'],
    cta: 'See Golf Tour live in a demo', href: '/golf/golf-demo',
  },
  {
    id: 'darts', icon: '🎯', label: 'Darts', color: '#EF4444',
    desc: 'PDC Order of Merit tracker, exhibition manager, checkout analysis, opponent intel, three-dart average dashboard, tour card & Q-School tracker and AI morning briefing.',
    modules: [
      { name: 'Order of Merit & Race', detail: 'Rolling 2-year prize money tracker, points expiry calendar and tour card security indicator.' },
      { name: 'Three-Dart Average Dashboard', detail: 'Career and tournament averages, first-9 analysis, 180s per leg and checkout percentage.' },
      { name: 'Exhibition Manager', detail: 'Book, track and manage your exhibition calendar — the biggest revenue stream for PDC pros.' },
      { name: 'Opponent Intel', detail: 'H2H records, preferred doubles, scoring patterns and pre-match tactical briefing.' },
      { name: 'Tour Card & Q-School', detail: 'PDC card status, Challenge Tour points and Q-School preparation timeline.' },
    ],
    integrations: ['PDC rankings data'],
    checks: ['Order of Merit updated after every event', 'Checkout percentage by double — know your best and worst', 'Exhibition calendar with fees, travel and obligations', 'AI briefing: today\'s averages target, doubles to practice', 'No tool like this has ever existed for darts professionals'],
    cta: 'See Darts Tour live in a demo', href: '/darts/darts-demo',
  },
  {
    id: 'boxing', icon: '🥊', label: 'Boxing', color: '#DC2626',
    desc: 'Fight camp planner, weight & cut tracker, world rankings across all four sanctioning bodies plus Zuffa, purse breakdown simulator, multi-jurisdiction tax tracker, promoter pipeline and AI morning briefing.',
    modules: [
      { name: 'Fight Camp Planner', detail: '8-12 week structured camp. Daily briefings, sparring schedule, weight trajectory and peak readiness projection.' },
      { name: 'Purse Simulator', detail: 'Input headline purse, apply all deductions (manager, trainer, sanctions, camp costs, tax) and see exactly what lands in your account.' },
      { name: 'World Rankings', detail: 'WBC, WBA, WBO, IBF and Zuffa Boxing — all five in one view. Mandatory challenger status and path to title.' },
      { name: 'Financial Dashboard', detail: 'Every pound earned, every pound spent. Fight earnings, camp costs and tax across jurisdictions.' },
      { name: 'Contract Intelligence', detail: 'Multi-fight exclusive vs one-fight Zuffa deals — understand exactly what each contract type means.' },
    ],
    integrations: ['BoxRec', 'WHOOP', 'Garmin', 'Dartfish'],
    checks: ['Purse simulator shows real take-home before you sign', 'Saudi Arabia, USA and UK tax modes — know the difference', 'Weight trajectory projected from day 1 of camp', 'Zuffa Boxing fifth column — understand the new landscape', 'First financial transparency tool ever built for boxing'],
    cta: 'See Lumio Fight live in a demo', href: '/boxing/lumio-demo',
  },
  {
    id: 'womensfootball', icon: '⚽', label: "Women's FC", color: '#EC4899',
    desc: "FSR compliance tracking, player welfare management (maternity, ACL, mental health), standalone sponsorship pipeline with FSR revenue attribution, board suite, dual registration management and AI Club Director morning briefing — built specifically for the women's game.",
    modules: [
      { name: 'FSR Compliance Dashboard', detail: 'Real-time salary spend vs. 80% Relevant Revenue cap. Bundled sponsorship attribution. Age-band salary compliance.' },
      { name: 'Player Welfare Hub', detail: 'ACL risk monitor, maternity tracker, mental health log, PFA referral workflow. Karen Carney Review compliant.' },
      { name: 'Standalone Sponsorship Pipeline', detail: 'FSR-aware commercial CRM with bundled deal attribution for parent club shared sponsors.' },
      { name: 'Board Suite & Demerger Tracker', detail: 'FSR-constrained Club Planner, investor tools, standalone valuation model, Demerger Readiness Tracker.' },
      { name: 'Squad, Pitch & Set Pieces', detail: 'FIFA-style pitch view, dual registration management, set pieces library, team talks builder.' },
    ],
    integrations: ['Kitman Labs', 'WSL Football', 'FA Whole Game System', 'PFA', 'Stripe', 'Xero'],
    checks: ['FSR headroom tracked in real time', 'Maternity and ACL welfare log — Karen Carney compliant', 'Bundled sponsorship attribution for FSR revenue', 'Dual registration expiry alerts', 'AI morning briefing — FSR, welfare, commercial, squad'],
    cta: "Book a Women's Football demo", href: '/contact',
  },
  {
    id: 'rugby', icon: '🏉', label: 'Rugby', color: '#8B5CF6',
    desc: 'Salary cap management (ceiling + floor), franchise readiness tracker, concussion & HIA compliance, club-to-country data interface, GPS performance (PlayerData), sponsorship pipeline and AI morning briefing.',
    modules: [
      { name: 'Salary Cap Dashboard', detail: 'Three-zone cap indicator with floor, spend and ceiling. Exclusions, academy credits and central contract discounts calculated automatically.' },
      { name: 'Franchise Readiness', detail: 'Six-criteria RAG tracker with Expression of Interest document builder for RFU Expansion Review Group.' },
      { name: 'Concussion & HIA Tracker', detail: '21-day protocol management with independent doctor clearance workflow and cumulative threshold monitoring.' },
      { name: 'Club-to-Country Data Interface', detail: 'Automated Kitman Labs data handoff to RFU, return-to-play protocol tracking and international window calendar.' },
      { name: 'Sponsorship & Commercial', detail: 'Partnership pipeline, matchday revenue tracker, stadium venue management and sponsor obligation fulfilment dashboard.' },
    ],
    integrations: ['Kitman Labs', 'PlayerData', 'RFU', 'World Rugby'],
    checks: ['Salary cap headroom tracked in real time — ceiling and floor', 'Franchise readiness score with RFU criteria mapping', 'HIA protocol tracker with 21-day minimum enforcement', 'Club-to-country data handoff — Kitman Labs auto-sync', 'Women\'s programme compliance (PWR or regional development plan)'],
    cta: 'See Lumio Rugby live in a demo', href: '/rugby/rugby-demo',
  },
  {
    id: 'cricket', icon: '🏏', label: 'Cricket', color: '#F59E0B',
    desc: 'Contract & central contract tracker, batting & bowling analytics, tour & franchise schedule planner (IPL, The Hundred, BBL), injury & fitness management, sponsorship pipeline and AI morning briefing.',
    modules: [
      { name: 'Contract & Central Contract Tracker', detail: 'County, franchise and central contract status with release windows, renewal dates and earnings breakdown by format.' },
      { name: 'Performance Analytics', detail: 'Batting averages, strike rates, bowling economy, wickets and form charts with Test/ODI/T20 format breakdowns.' },
      { name: 'Tour & Franchise Schedule', detail: 'International tour calendar, IPL/Hundred/BBL franchise schedule and multi-format availability tracker.' },
      { name: 'Injury & Fitness Management', detail: 'Injury log, physio notes, fitness testing, return-to-play protocols and workload management across formats.' },
      { name: 'Commercial Pipeline', detail: 'Bat sponsorships, endorsements, appearance fees, social obligations and agent pipeline management.' },
    ],
    integrations: ['ECB', 'ICC', 'Kitman Labs'],
    checks: ['Multi-format contract tracker — county, franchise and central', 'Format-specific analytics — Test, ODI, T20', 'Franchise schedule planner — IPL, Hundred, BBL, PSL', 'Workload management across all competitions', 'NOC and federation accreditation tracking'],
    cta: 'See Lumio Cricket live in a demo', href: '/cricket/cricket-demo',
  },
]

const STATS = [
  { value: '10', label: 'Sports portals' },
  { value: '50,000+', label: 'Athletes on GPS partner' },
  { value: '0', label: 'Platforms that existed before us' },
  { value: '£0', label: 'Cost of a demo' },
]

const FEATURES = [
  { icon: '🤖', title: 'AI morning briefing', desc: 'Delivered before the day begins — for the player, coach, agent, manager and physio. Every relevant data point, every obligation, every flag — in one voice-powered briefing.' },
  { icon: '📡', title: 'GPS performance — powered by PlayerData', desc: 'FIFA Quality Certified. World Rugby Approved. Session load, ACWR, readiness scores and heat maps synced automatically from PlayerData EDGE units into your portal dashboard.' },
  { icon: '💰', title: 'Financial transparency', desc: "The purse simulator, the wage bill tracker, the earnings ledger — built so athletes understand exactly where their money goes, before they sign anything." },
  { icon: '👥', title: 'Team hub', desc: 'Coach, physio, agent, manager, nutritionist, cutman — each with a role-specific view on the same platform. No WhatsApp threads. No spreadsheets. One system.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SportsProductPage() {
  const [activeTab, setActiveTab] = useState(0)
  const portal = PORTALS[activeTab]

  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB' }} className="pt-28 pb-20">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 text-center mb-24">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
          THE PLATFORM
        </p>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Built for every athlete{' '}
          <span style={{ background: 'linear-gradient(135deg, #10B981, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            in professional sport.
          </span>
        </h1>
        <p className="text-base font-medium mb-6" style={{ color: '#10B981', maxWidth: 580, margin: '0 auto' }}>
          Your career, fully connected.
        </p>
        <p className="text-xl leading-relaxed mb-4" style={{ color: '#9CA3AF', maxWidth: 580, margin: '0 auto' }}>
          Lumio connects athletes, coaches, agents and clubs — automating the admin, tracking the data that matters, and delivering AI intelligence that gives you an edge before anyone else wakes up.
        </p>
        <p className="text-xl mb-10" style={{ color: '#9CA3AF', maxWidth: 560, margin: '0 auto 40px' }}>
          Built for football, tennis, golf, boxing, darts, rugby, cricket and more. From the Premier League to the Sunday league.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#10B981', color: '#F9FAFB' }}>
            Book a Demo <ArrowRight size={16} />
          </Link>
          <Link
            href="/sports"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>
            Explore all sports
          </Link>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div
                  className="text-4xl md:text-5xl font-black mb-2"
                  style={{ background: 'linear-gradient(135deg, #10B981, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.value}
                </div>
                <div className="text-sm font-medium" style={{ color: '#6B7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal tabs ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Sport Portals</p>
          <h2 className="text-3xl font-bold">Purpose-built for every sport</h2>
          <p className="mt-4 text-base" style={{ color: '#6B7280' }}>
            Whether you play in a stadium or on a Sunday pitch — every portal gives you the same unfair advantage.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex justify-center mb-10">
          <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {PORTALS.map((p, i) => {
              const isActive = i === activeTab
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(i)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: isActive ? p.color : '#111318',
                    color: isActive ? '#F9FAFB' : '#6B7280',
                    border: `1px solid ${isActive ? p.color : '#1F2937'}`,
                  }}>
                  <span role="img" aria-label={p.label} style={{ fontSize: 12 }}>{p.icon}</span>
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* Left: description + modules */}
          <div
            className="rounded-xl p-8"
            style={{ backgroundColor: '#0D0E16', border: `1px solid ${portal.color}33` }}>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: `${portal.color}20` }}>
                {portal.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold">{portal.label}</h3>
                <p className="text-xs" style={{ color: portal.color }}>
                  {portal.modules.length} modules included
                  {(portal as { comingSoon?: boolean }).comingSoon && (
                    <span className="ml-2 font-semibold" style={{ color: '#A78BFA' }}>· Coming soon</span>
                  )}
                </p>
              </div>
            </div>
            <p className="text-base leading-relaxed mb-7" style={{ color: '#9CA3AF' }}>{portal.desc}</p>
            <div className="space-y-3">
              {portal.modules.map(mod => (
                <div
                  key={mod.name}
                  className="rounded-lg px-4 py-3.5"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <ChevronRight size={13} style={{ color: portal.color, flexShrink: 0 }} />
                    <span className="text-sm font-medium" style={{ color: '#E5E7EB' }}>{mod.name}</span>
                  </div>
                  <p className="text-sm leading-relaxed pl-5" style={{ color: '#6B7280' }}>{mod.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: integrations + checks + CTA */}
          <div className="flex flex-col gap-6">

            {/* Integrations */}
            <div className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
                Key integrations for {portal.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {portal.integrations.map(int => (
                  <span
                    key={int}
                    className="text-sm px-3 py-1.5 rounded-lg font-medium"
                    style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
                    {int}
                  </span>
                ))}
              </div>
            </div>

            {/* Checks */}
            <div className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>What you get</p>
              {portal.checks.length > 0 ? (
                <ul className="space-y-3">
                  {portal.checks.map(point => (
                    <li key={point} className="flex items-start gap-3 text-base" style={{ color: '#D1D5DB' }}>
                      <Check size={14} style={{ color: portal.color, flexShrink: 0, marginTop: 3 }} />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base" style={{ color: '#6B7280' }}>
                  Full feature list coming soon. Join the waitlist to be first.
                </p>
              )}
            </div>

            {/* CTA button */}
            <Link
              href={portal.href}
              className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: portal.color, color: '#F9FAFB' }}>
              {portal.cta} <ArrowRight size={16} />
            </Link>

          </div>
        </div>
      </section>

      {/* ── Features section ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Platform features</p>
            <h2 className="text-3xl font-bold">What every portal is built on</h2>
            <p className="mt-4 text-base" style={{ color: '#6B7280' }}>
              Every sport. Every level. The same core engine underneath.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-xl p-7 transition-all duration-300"
                style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = '#10B98133'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 32px -8px #10B98122'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = '#1F2937'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
                }}>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-5"
                  style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.title}</h3>
                <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div
          className="rounded-2xl px-8 py-14 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(56,189,248,0.1) 100%)',
            border: '1px solid rgba(16,185,129,0.25)',
          }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
            Lumio Sport
          </p>
          <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
            Ten portals.{' '}
            <span style={{ background: 'linear-gradient(135deg, #10B981, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              One platform.
            </span>
          </h2>
          <p className="text-lg leading-relaxed mb-10 mx-auto" style={{ color: '#9CA3AF', maxWidth: 560 }}>
            Whether you're a Premier League club or a Sunday morning manager — Lumio gives you the same intelligence advantage that was previously only available to elite organisations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold"
              style={{ backgroundColor: '#10B981', color: '#F9FAFB' }}>
              Book a demo <ArrowRight size={16} />
            </Link>
            <Link
              href="/sports"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-medium"
              style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>
              Explore all sports <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
