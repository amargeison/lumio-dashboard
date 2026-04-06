'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronRight } from 'lucide-react'

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface Portal {
  id: string; icon: string; label: string; color: string; desc: string;
  modules: Array<{ name: string; detail: string }>;
  integrations: string[]; checks: string[];
  cta: string; href: string; comingSoon?: boolean;
}

const PORTALS: Portal[] = [
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
  const tabsRef = useRef<HTMLElement>(null)

  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>

      {/* ══ SECTION 1: HERO ══ */}
      <section style={{ paddingTop: 140, paddingBottom: 80 }} className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.06) 0%, transparent 60%)' }} />
        <div className="mx-auto max-w-3xl px-6 text-center relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#6B7280' }}>THE PLATFORM</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-4">
            Built for every role<br />in professional sport.
          </h1>
          <p className="text-lg md:text-xl font-bold mb-6" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your sport. Fully connected.
          </p>
          <p className="text-base leading-relaxed mb-10 mx-auto" style={{ color: '#9CA3AF', maxWidth: 640 }}>
            Lumio Sports connects your squad data, your compliance obligations, your commercial pipeline, and your financial planning — and surfaces the intelligence that actually moves careers and clubs forward. Built for sport. Not adapted from business software.
          </p>
          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[
              { value: '10', label: 'Portals across professional sport' },
              { value: '300+', label: 'Modules and features' },
              { value: '0', label: 'Generic business tools used' },
              { value: '24h', label: 'Onboarding to first insight' },
            ].map((s: { value: string; label: string }) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: '#6B7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', color: '#fff', textDecoration: 'none' }}>
              Book a demo <ArrowRight size={14} />
            </Link>
            <button onClick={() => tabsRef.current?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid #1F2937' }}>
              Explore all portals
            </button>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2: HOW IT WORKS ══ */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1E293B', borderBottom: '1px solid #1E293B' }} className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#6B7280' }}>HOW IT WORKS</p>
            <h2 className="text-3xl font-bold">Up and running in 48 hours.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Connect your sport', body: 'Select your portal — Pro Club, Non-League, WSL, Championship Rugby, ATP/WTA, PGA/DP World Tour, PDC, professional boxing, cricket or women\'s football. Your demo environment is pre-seeded with realistic data. No setup. No configuration.' },
              { num: '02', title: 'Add your data', body: 'Import your squad, contracts, fixture list, sponsor deals and financial data. Or start with demo data and layer in your own. Kitman Labs GPS data syncs automatically. Player registrations connect to the Whole Game System.' },
              { num: '03', title: 'Intelligence from day one', body: 'Your AI morning briefing goes live on day one. Your compliance dashboard is live. Your commercial pipeline is live. Your board reporting is live. From onboarding to first insight in under 24 hours.' },
            ].map((step: { num: string; title: string; body: string }) => (
              <div key={step.num} className="rounded-xl p-6" style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}>
                <div className="text-2xl font-black mb-3" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{step.num}</div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 3: PORTAL TABS ══ */}
      <section ref={tabsRef} className="mx-auto max-w-7xl px-6 py-24">
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
            {PORTALS.map((p: Portal, i: number) => {
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
                  {portal.comingSoon && (
                    <span className="ml-2 font-semibold" style={{ color: '#A78BFA' }}>· Coming soon</span>
                  )}
                </p>
              </div>
            </div>
            <p className="text-base leading-relaxed mb-7" style={{ color: '#9CA3AF' }}>{portal.desc}</p>
            <div className="space-y-3">
              {portal.modules.map((mod: { name: string; detail: string }) => (
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
                {portal.integrations.map((int: string) => (
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
                  {portal.checks.map((point: string) => (
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

      {/* ══ SECTION 4: INTELLIGENCE DASHBOARDS ══ */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1E293B', borderBottom: '1px solid #1E293B' }} className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#6B7280' }}>INTELLIGENCE</p>
            <h2 className="text-3xl font-bold">Dashboards that think for you.</h2>
            <p className="mt-4 text-base mx-auto" style={{ color: '#6B7280', maxWidth: 560 }}>
              Every portal ships with intelligence dashboards that surface the data points that matter — before you ask for them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {[
              { title: 'Compliance Radar', desc: 'Every deadline, every filing, every obligation — tracked, colour-coded and flagged before it becomes a problem. PSR, FSR, salary caps, ground grading, safeguarding.', tag: 'LIVE IN ALL PORTALS' },
              { title: 'Financial Health', desc: 'Wage bill vs budget, earnings vs deductions, sponsor revenue vs target. One view that tells the chairman, the agent and the athlete exactly where they stand.', tag: 'REAL-TIME' },
              { title: 'Performance Pulse', desc: 'GPS load, session readiness, injury risk, form trajectory — pulled from PlayerData, Kitman Labs, WHOOP and Garmin into a single readiness score per athlete.', tag: 'AUTO-SYNCED' },
              { title: 'Commercial Pipeline', desc: 'Every sponsor deal, every renewal date, every obligation. Pipeline value, conversion rate and revenue attribution — whether you manage one deal or fifty.', tag: 'CRM BUILT-IN' },
            ].map((d: { title: string; desc: string; tag: string }) => (
              <div key={d.title} className="rounded-xl p-7" style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>{d.tag}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{d.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{d.desc}</p>
              </div>
            ))}
          </div>

          {/* Real example card */}
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>EXAMPLE: FOOTBALL PRO MORNING BRIEFING</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { heading: 'Squad Status', items: ['3 players flagged high ACWR — recommend reduced load', 'James Walker: hamstring — day 8 of 14-day protocol', 'Contract expiry: 2 players inside 6-month window'] },
                { heading: 'Compliance', items: ['PSR headroom: £1.2M — within safe zone', 'FA registration: 3 forms awaiting counter-signature', 'Next board report due: 12 days'] },
                { heading: 'Commercial', items: ['Sponsor renewal: Apex Kit Deal — 34 days to deadline', 'New inbound lead: Regional energy brand, £40K est.', 'Matchday revenue vs target: +8% after 18 fixtures'] },
              ].map((col: { heading: string; items: string[] }) => (
                <div key={col.heading}>
                  <h4 className="text-sm font-bold mb-3" style={{ color: '#A78BFA' }}>{col.heading}</h4>
                  <ul className="space-y-2">
                    {col.items.map((item: string) => (
                      <li key={item} className="flex items-start gap-2 text-sm" style={{ color: '#9CA3AF' }}>
                        <ChevronRight size={12} style={{ color: '#8B5CF6', flexShrink: 0, marginTop: 3 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 5: AI — POWERED BY CLAUDE ══ */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#6B7280' }}>ARTIFICIAL INTELLIGENCE</p>
            <h2 className="text-3xl font-bold mb-3">AI that understands sport.</h2>
            <p className="text-base mx-auto" style={{ color: '#6B7280', maxWidth: 560 }}>
              Powered by Claude. Trained on the rules, regulations and rhythms of every sport we cover. Not a chatbot — an intelligence layer woven into every dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { title: 'Morning Briefing', desc: 'Personalised daily intelligence delivered before the day begins. Different content for the manager, the physio, the agent and the chairman — same platform.' },
              { title: 'Opponent Analysis', desc: 'Pre-match tactical briefing generated from historical data, formation tendencies, set piece patterns and key player threats. Available 48 hours before kick-off.' },
              { title: 'Contract Intelligence', desc: 'AI reads contract terms, flags unusual clauses, models financial scenarios and compares deal structures across the market. Built for agents and clubs.' },
              { title: 'Compliance Forecasting', desc: 'Predicts PSR, FSR and salary cap headroom 3, 6 and 12 months forward based on current commitments, pipeline deals and projected revenue.' },
              { title: 'Injury Risk Modelling', desc: 'Combines GPS load data, training frequency, match minutes and historical injury patterns to flag athletes at elevated risk before symptoms appear.' },
              { title: 'Voice Commands', desc: 'Log an injury, check availability, pull up a compliance report or cancel a training session — all by voice. Built for managers who are on the training pitch, not at a desk.' },
            ].map((ai: { title: string; desc: string }) => (
              <div key={ai.title} className="rounded-xl p-6" style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#8B5CF6' }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{ai.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{ai.desc}</p>
              </div>
            ))}
          </div>

          {/* Example insight cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { sport: 'Boxing', insight: '"Your purse for the July 19 fight in Riyadh nets £1.14M after all deductions. That is 23% less than the headline figure. The largest single deduction is the 15% Saudi withholding tax — which is not reclaimable under current HMRC treaty terms."', source: 'Lumio Fight AI — Purse Simulator' },
              { sport: 'Non-League Football', insight: '"Your wage bill is at 78% of the season budget with 14 fixtures remaining. If the two trialists sign on current terms, you will exceed budget by matchday 38. Recommend capping any new signing-on fee at £500 to maintain headroom."', source: 'Lumio Non-League AI — Financial Forecast' },
            ].map((ex: { sport: string; insight: string; source: string }) => (
              <div key={ex.sport} className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(6,182,212,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#A78BFA' }}>{ex.sport}</p>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: '#D1D5DB' }}>{ex.insight}</p>
                <p className="text-xs" style={{ color: '#4B5563' }}>{ex.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 6: MODULE LIBRARY ══ */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1E293B', borderBottom: '1px solid #1E293B' }} className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#6B7280' }}>MODULE LIBRARY</p>
            <h2 className="text-3xl font-bold mb-3">300+ modules. Zero generic software.</h2>
            <p className="text-base mx-auto" style={{ color: '#6B7280', maxWidth: 560 }}>
              Every module is purpose-built for sport. Nothing has been borrowed from CRM software, HR platforms or project management tools.
            </p>
          </div>

          {/* 3 stats */}
          <div className="flex flex-wrap justify-center gap-10 mb-14">
            {[
              { value: '300+', label: 'Total modules across all portals' },
              { value: '50+', label: 'Compliance-specific modules' },
              { value: '10', label: 'Sport-specific portal configurations' },
            ].map((stat: { value: string; label: string }) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: '#6B7280' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 10 sport module counts */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-14">
            {[
              { sport: 'Football Pro', count: '42', icon: '⚽' },
              { sport: 'Non-League', count: '38', icon: '🏟️' },
              { sport: 'Grassroots', count: '24', icon: '🟡' },
              { sport: 'Tennis', count: '31', icon: '🎾' },
              { sport: 'Golf', count: '34', icon: '⛳' },
              { sport: 'Darts', count: '27', icon: '🎯' },
              { sport: 'Boxing', count: '36', icon: '🥊' },
              { sport: "Women's FC", count: '40', icon: '⚽' },
              { sport: 'Rugby', count: '39', icon: '🏉' },
              { sport: 'Cricket', count: '33', icon: '🏏' },
            ].map((s: { sport: string; count: string; icon: string }) => (
              <div key={s.sport} className="rounded-lg p-4 text-center" style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}>
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-lg font-black text-white">{s.count}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{s.sport}</div>
              </div>
            ))}
          </div>

          {/* 6 featured modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Salary Cap Engine', desc: 'Ceiling, floor, exclusions, academy credits — calculated automatically for rugby and football. Real-time headroom indicator with scenario modelling.', sports: 'Rugby, Football Pro, Women\'s FC' },
              { name: 'Purse Simulator', desc: 'Input the headline figure, apply every deduction layer by layer — manager, trainer, sanctioning body, camp costs, tax — and see exactly what lands in the account.', sports: 'Boxing' },
              { name: 'GPS Performance Suite', desc: 'PlayerData EDGE integration. Session load, ACWR, readiness scores, heat maps, high-speed distance and mechanical load — synced automatically after every session.', sports: 'Football Pro, Non-League, Rugby' },
              { name: 'Franchise Readiness Tracker', desc: 'Six-criteria RAG assessment mapped to RFU expansion requirements. Expression of Interest document builder with evidence uploads.', sports: 'Rugby' },
              { name: 'Exhibition Manager', desc: 'The largest revenue stream for PDC professionals — managed properly for the first time. Booking, fees, travel, obligations and tax implications per event.', sports: 'Darts' },
              { name: 'FSR Compliance Dashboard', desc: 'Real-time salary spend vs 80% Relevant Revenue cap. Bundled sponsorship attribution. Age-band compliance. Demerger readiness scoring.', sports: 'Women\'s FC' },
            ].map((m: { name: string; desc: string; sports: string }) => (
              <div key={m.name} className="rounded-xl p-6" style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}>
                <h3 className="text-sm font-bold text-white mb-2">{m.name}</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>{m.desc}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>{m.sports}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 7: INTEGRATIONS ══ */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#6B7280' }}>INTEGRATIONS</p>
            <h2 className="text-3xl font-bold mb-3">Connected to the tools sport already uses.</h2>
            <p className="text-base mx-auto" style={{ color: '#6B7280', maxWidth: 560 }}>
              Lumio connects to the data sources, governing bodies and financial tools that professional sport runs on. No CSV exports. No manual syncs.
            </p>
          </div>

          <div className="space-y-8">
            {[
              { category: 'Performance & GPS', items: ['PlayerData EDGE', 'Kitman Labs', 'WHOOP', 'Garmin', 'TrackMan', 'Arccos', 'ShotLink'] },
              { category: 'Video & Scouting', items: ['Hudl', 'Wyscout', 'Dartfish', 'DataGolf'] },
              { category: 'Governing Bodies', items: ['FA Whole Game System', 'RFU', 'World Rugby', 'ATP/WTA APIs', 'PGA Tour API', 'PDC Rankings', 'ECB', 'ICC', 'BoxRec'] },
              { category: 'Finance & Payments', items: ['Xero', 'Stripe', 'QuickBooks'] },
              { category: 'Communication', items: ['WhatsApp Business', 'Google Calendar', 'Slack', 'Microsoft Teams'] },
              { category: 'Welfare & Medical', items: ['PFA', 'WSL Football', 'Club medical systems'] },
            ].map((group: { category: string; items: string[] }) => (
              <div key={group.category}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#A78BFA' }}>{group.category}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item: string) => (
                    <span key={item} className="text-sm px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#0D1117', color: '#9CA3AF', border: '1px solid #1E293B' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 8: SECURITY ══ */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1E293B', borderBottom: '1px solid #1E293B' }} className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#6B7280' }}>SECURITY & COMPLIANCE</p>
            <h2 className="text-3xl font-bold mb-3">Enterprise-grade. Sport-specific.</h2>
            <p className="text-base mx-auto" style={{ color: '#6B7280', maxWidth: 560 }}>
              Player data is the most sensitive data in sport. We treat it that way.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Role-Based Access', desc: 'Manager, coach, physio, agent, chairman, treasurer — each role sees only what they need. No data leaks between departments. Configurable per portal.' },
              { title: 'End-to-End Encryption', desc: 'All data encrypted in transit and at rest. Player medical records, contract terms and financial data protected to the highest standard.' },
              { title: 'GDPR Compliant', desc: 'Full GDPR compliance including right to erasure, data portability, consent management and processing records. Built for UK and EU regulations.' },
              { title: 'Audit Trail', desc: 'Every action logged. Every access recorded. Every change timestamped. Full audit trail for compliance reviews, governing body inspections and internal governance.' },
              { title: 'SOC 2 Type II', desc: 'Infrastructure hosted on SOC 2 Type II certified providers. Annual penetration testing. Vulnerability scanning. Incident response plan documented and tested.' },
              { title: 'Data Residency', desc: 'UK data stays in UK data centres. No cross-border transfer of player data without explicit consent. Compliant with FA, RFU and governing body data requirements.' },
            ].map((sec: { title: string; desc: string }) => (
              <div key={sec.title} className="rounded-xl p-6" style={{ backgroundColor: '#0D1117', border: '1px solid #1E293B' }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Check size={14} style={{ color: '#8B5CF6' }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{sec.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{sec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 9: FINAL CTA ══ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />
        <div className="mx-auto max-w-3xl px-6 text-center relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#6B7280' }}>LUMIO SPORTS</p>
          <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4">
            Ten portals.{' '}
            <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              One platform.
            </span>
          </h2>
          <p className="text-lg leading-relaxed mb-10 mx-auto" style={{ color: '#9CA3AF', maxWidth: 560 }}>
            Whether you are a Premier League club, a Championship rugby franchise, a PDC professional or a Sunday morning manager — Lumio gives you the same intelligence advantage that was previously only available to elite organisations with six-figure tech budgets.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', color: '#fff', textDecoration: 'none' }}>
              Book a demo <ArrowRight size={16} />
            </Link>
            <button onClick={() => tabsRef.current?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold" style={{ border: '1px solid #1F2937', color: '#9CA3AF', backgroundColor: 'transparent' }}>
              Explore all portals <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}
