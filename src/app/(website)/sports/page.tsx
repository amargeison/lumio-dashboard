'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const PORTALS = [
  {
    icon: '⚽', title: 'Football', subtitle: 'Lumio Pro Club', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)',
    desc: 'From League Two to the Premier League — squad management, GPS performance (PlayerData), PSR compliance, scouting pipeline, transfer tracking, board reporting, and AI match intelligence. Built for Directors of Football, managers, and club owners.',
    cta: 'Explore Pro Club', href: '/football/lumio-dev',
  },
  {
    icon: '🎾', title: 'Tennis', subtitle: 'Lumio Tour (Tennis)', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)',
    desc: 'ATP/WTA ranking tracker, tournament schedule planner, match prep tools, sponsorship manager, physio & recovery dashboard, agent pipeline, financial dashboard, and AI morning briefing. Built for touring professionals and their teams.',
    cta: 'Explore Tennis Tour', href: '/tennis/tennis-demo',
  },
  {
    icon: '⛳', title: 'Golf', subtitle: 'Lumio Tour (Golf)', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.25)',
    desc: "OWGR & Race to Dubai tracker, strokes gained analysis, caddie workflow, course fit scoring, sponsorship manager, prize money ledger, multi-jurisdiction tax tracker, and AI morning briefing for player and full team. Built for DP World Tour and PGA Tour professionals.",
    cta: 'Explore Golf Tour', href: '/golf/golf-demo',
  },
  {
    icon: '🟡', title: 'Grassroots', subtitle: 'Lumio Grassroots', color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)',
    desc: 'Availability tracking, squad management, pitch booking, subs collection, DBS monitoring, weather alerts, training schedules, match results, and an AI morning briefing for your manager — all in one place. Built for Sunday league, veterans, youth clubs, and amateur football at every level.',
    cta: 'Explore Grassroots', href: '/football/grassroots/sunday-rovers-fc',
  },
  {
    icon: '🏟️', title: 'Non-League', subtitle: 'Lumio Non-League', color: '#475569', bg: 'rgba(71,85,105,0.08)', border: 'rgba(71,85,105,0.25)',
    desc: 'Squad management, injury tracking, loan player administration, ground grading compliance, sponsorship management, match fees, training planning, and live league tables. Built for National League, Northern Premier League, Southern League, and Isthmian League clubs.',
    cta: 'Explore Non-League', href: '/football/nonleague/harfield-fc',
  },
  {
    icon: '🎯', title: 'Darts', subtitle: 'Lumio Tour (Darts)', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
    desc: 'PDC Order of Merit tracker, exhibition manager, checkout analysis, opponent intel, three-dart average dashboard, tour card & Q-School tracker, sponsorship manager and AI morning briefing. Built for PDC tour card holders and Challenge Tour players.',
    cta: 'Explore Darts Tour', href: '/darts',
  },
  {
    icon: '🥊', title: 'Boxing', subtitle: 'Lumio Fight', color: '#B91C1C', bg: 'rgba(185,28,28,0.08)', border: 'rgba(185,28,28,0.25)',
    desc: 'Fight camp planner, weight & cut tracker, world rankings across all four sanctioning bodies, purse breakdown simulator, multi-jurisdiction tax tracker, promoter pipeline and AI morning briefing. Built for world title contenders and British champions.',
    cta: 'Explore Lumio Fight', href: '/boxing',
  },
  {
    icon: '⚽', title: "Women's Football", subtitle: "Lumio Women's Football", color: '#EC4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)',
    desc: "The first operating system built specifically for professional women's football clubs. FSR compliance tracking, player welfare management (maternity, ACL, mental health), standalone sponsorship pipeline, board suite and AI Club Director morning briefing — built for the women's game, not the men's.",
    cta: "Explore Women's Football", href: '/womens-football',
  },
  {
    icon: '🏉', title: 'Rugby', subtitle: 'Lumio Tour (Rugby)', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)',
    desc: 'Contract & career management, performance analytics, injury & recovery tracking, GPS load data (PlayerData), match prep & opposition analysis, sponsorship manager and AI morning briefing. Built for Premiership, Top 14 and international players.',
    cta: 'See Lumio Rugby →', href: '/rugby',
  },
  {
    icon: '🏏', title: 'Cricket', subtitle: 'Lumio Tour (Cricket)', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)',
    desc: 'Contract & central contract tracker, batting & bowling analytics, tour & franchise schedule planner (IPL, The Hundred, BBL), injury & fitness management, sponsorship & commercial pipeline and AI morning briefing. Built for county, international and franchise players.',
    cta: 'See Lumio Cricket →', href: '/cricket',
  },
]

const FEATURES = [
  { icon: '🤖', title: 'AI Morning Briefing', desc: 'Personalised daily intelligence delivered to player, manager, coaching staff, and agents before the day begins.' },
  { icon: '📊', title: 'Performance Analytics', desc: 'Strokes gained, GPS load (PlayerData), match ratings, xG, OWGR — every sport\'s key metrics in one dashboard.' },
  { icon: '💰', title: 'Commercial Manager', desc: 'Sponsorship tracking, deal renewals, financial dashboard, multi-jurisdiction tax, prize money ledger.' },
  { icon: '👥', title: 'Team Hub', desc: 'Coach, caddie, physio, agent, DoF — all working from the same data in role-specific views.' },
  { icon: '🎯', title: 'Career Planning', desc: '1, 3, 5 and 10-year goal setting with financial targets and milestone tracking.' },
  { icon: '📡', title: 'Live Data Integrations', desc: 'Arccos, PlayerData, DataGolf, TrackMan, Wyscout, API-Football — all connected.' },
]

const PRICING = [
  { name: 'Lumio Tour Pro', price: '£199', period: '/mo', features: ['Individual player dashboard', 'Performance analytics', 'Ranking tracker', 'Sponsorship manager', 'AI morning briefing'], color: '#7c3aed', popular: false },
  { name: 'Lumio Tour Pro+', price: '£349', period: '/mo', features: ['Full team access', 'Caddie/coach/agent views', 'Video library', 'Voice briefing', 'Financial dashboard', 'Tax tracker'], color: '#0D9488', popular: true },
  { name: 'Lumio Pro Club', price: 'From £500', period: '/mo', features: ['Full club OS', 'Squad management', 'Board suite', 'PSR compliance', 'Scouting pipeline', 'Transfer tracking'], color: '#dc2626', popular: false },
]

export default function SportsPage() {
  // Redirect lumiocms.com/sports to lumiosports.com
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.host.includes('lumiocms.com')) {
      window.location.replace('https://www.lumiosports.com')
    }
  }, [])

  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(13,148,136,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-6xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ backgroundColor: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)' }}>
            <span className="text-sm">🏆</span>
            <span className="text-xs font-semibold" style={{ color: '#2DD4BF' }}>Ten portals. One platform.</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            The operating system for<br />
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>professional sport</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: '#9CA3AF' }}>
            AI-powered career intelligence for football clubs, tennis players, golfers, darts players, boxers and more. Every metric, every deal, every decision — in one place.
          </p>
        </div>
      </section>

      {/* Portal cards — top 3 in 3-col, next 4 in 2-col, last 2 in 2-col */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PORTALS.slice(0, 3).map((p: any) => (
            <div key={p.title} className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: p.bg, border: `1px solid ${p.border}` }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h3 className="text-lg font-black" style={{ color: '#F9FAFB' }}>{p.title}</h3>
                  <p className="text-xs font-semibold" style={{ color: p.color }}>{p.subtitle}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: '#9CA3AF' }}>{p.desc}</p>
              {p.badge && <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.3)' }}>{p.badge}</span>}
              <Link href={p.href} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold justify-center mt-auto" style={{ backgroundColor: p.color, color: '#fff', textDecoration: 'none' }}>
                {p.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {PORTALS.slice(3, 7).map((p: any) => (
            <div key={p.title} className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: p.bg, border: `1px solid ${p.border}` }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h3 className="text-lg font-black" style={{ color: '#F9FAFB' }}>{p.title}</h3>
                  <p className="text-xs font-semibold" style={{ color: p.color }}>{p.subtitle}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: '#9CA3AF' }}>{p.desc}</p>
              {p.badge && <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.3)' }}>{p.badge}</span>}
              <Link href={p.href} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold justify-center mt-auto" style={{ backgroundColor: p.color, color: '#fff', textDecoration: 'none' }}>
                {p.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {PORTALS.slice(7).map((p: any) => (
            <div key={p.title} className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: p.bg, border: `1px solid ${p.border}` }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{p.icon}</span>
                <div>
                  <h3 className="text-lg font-black" style={{ color: '#F9FAFB' }}>{p.title}</h3>
                  <p className="text-xs font-semibold" style={{ color: p.color }}>{p.subtitle}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: '#9CA3AF' }}>{p.desc}</p>
              {p.badge && <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.3)' }}>{p.badge}</span>}
              <Link href={p.href} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold justify-center mt-auto" style={{ backgroundColor: p.color, color: '#fff', textDecoration: 'none' }}>
                {p.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* One platform section */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-2xl md:text-3xl font-black mb-4">One platform. Ten portals. Every career stage.</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
          Lumio Tour, Lumio Pro Club and Lumio Fight share the same AI infrastructure, the same morning briefing system, the same team hub architecture — just adapted for each sport&apos;s unique needs. Whether you&apos;re a club owner managing a 25-man squad, a touring tennis professional tracking rankings, a golfer optimising strokes gained, a darts player on the PDC circuit, or a boxer preparing for a world title shot — the platform speaks your language, uses your metrics, and fits your workflow.
        </p>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black mb-8 text-center">Built for every role in professional sport</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-xl p-5" style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937' }}>
              <span className="text-2xl block mb-3">{f.icon}</span>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black mb-8 text-center">Simple, transparent pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map(p => (
            <div key={p.name} className="rounded-2xl p-6 relative flex flex-col" style={{ backgroundColor: '#0D1017', border: `1px solid ${p.popular ? p.color : '#1F2937'}` }}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: p.color, color: '#fff' }}>Most Popular</div>
              )}
              <h3 className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black" style={{ color: '#F9FAFB' }}>{p.price}</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>{p.period}</span>
              </div>
              <div className="space-y-2 flex-1 mb-6">
                {p.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={14} style={{ color: p.color }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: p.popular ? p.color : 'rgba(255,255,255,0.05)', color: p.popular ? '#fff' : '#9CA3AF', border: p.popular ? 'none' : '1px solid #1F2937' }}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-2xl p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.1), rgba(124,58,237,0.1))', border: '1px solid rgba(13,148,136,0.25)' }}>
          <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to run your career like a business?</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Join the athletes, clubs, and teams already using Lumio to make better decisions, faster.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contact" className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', textDecoration: 'none' }}>Book a Demo</Link>
            <Link href="/pricing" className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid #1F2937', textDecoration: 'none' }}>Start Free Trial</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
