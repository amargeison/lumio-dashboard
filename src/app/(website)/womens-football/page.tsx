'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const ACCENT = '#EC4899'
const BG = '#07080F'
const CARD = '#111318'
const BORDER = '#1F2937'

// ─── Data ─────────────────────────────────────────────────────────────────────

const DIFFERENCES = [
  {
    icon: '📋',
    title: 'FSR, Not PSR',
    subtitle: 'A different rulebook entirely',
    body: `Women's clubs operate under Football Sustainability Regulations — not the men's Profit and Sustainability Rules. The FSR imposes an 80% cap on wage spend as a proportion of Relevant Revenue, with strict definitions of what counts as revenue when a parent club shares commercial deals. Bundled sponsorship agreements must be attributed fairly. Age-band salary caps apply across the squad. This is not a simplified version of PSR — it is a distinct regulatory framework that requires its own compliance engine.`,
  },
  {
    icon: '🩺',
    title: 'Welfare Obligations',
    subtitle: 'ACL, maternity, mental health — all mandatory',
    body: `Professional women's football carries specific welfare obligations that have no direct equivalent in the men's game. ACL injury rates in women's football run at four to six times the male rate — clubs must track training loads, pitch conditions, and return-to-play protocols accordingly. Maternity rights for professional players require specific contract provisions and return-to-play planning. The Karen Carney Review placed mental health support at the centre of the duty of care framework. Lumio Women's Football logs all of it in one place.`,
  },
  {
    icon: '🏢',
    title: 'The Standalone Shift',
    subtitle: 'The Karen Carney Review changed everything',
    body: `The Karen Carney Review recommended that WSL clubs demerge from their parent clubs and operate as standalone commercial entities. This shift is already underway — Chelsea Women, Manchester City Women, and others have begun the transition. Standalone clubs need their own commercial pipeline, their own board suite, their own investor tools, and their own valuation model. Lumio Women's Football includes a Demerger Readiness Tracker and a standalone commercial CRM that understands bundled sponsorship attribution for FSR purposes.`,
  },
]

const FEATURES = [
  {
    icon: '📊',
    title: 'FSR Compliance Dashboard',
    body: 'Real-time salary spend tracked against the 80% Relevant Revenue cap. Bundled sponsorship attribution modelling for shared parent club deals. Age-band salary compliance view. What-if simulator for new contracts. Board-ready FSR compliance report at one click.',
  },
  {
    icon: '🩺',
    title: 'Player Welfare Hub',
    body: 'ACL risk monitor using GPS load data and training surface tracking. Maternity tracker with return-to-play planning and contract status. Mental health log with PFA referral workflow. Karen Carney Review compliant across all welfare categories.',
  },
  {
    icon: '💼',
    title: 'Standalone Sponsorship Pipeline',
    body: 'FSR-aware commercial CRM. Log every sponsor deal, apply bundled attribution rules for shared parent club sponsors, and see the FSR-compliant revenue figure in real time. Renewal alerts at 90, 60, and 30 days. Commercial income vs season target dashboard.',
  },
  {
    icon: '🏛️',
    title: 'Board Suite & Financial Planning',
    body: 'FSR-constrained Club Planner with 1, 3, and 5-year strategic horizons. Investor toolkit with standalone valuation model. Demerger Readiness Tracker — legal, commercial, operational, governance. One-click board financial report with FSR headroom summary.',
  },
  {
    icon: '⚽',
    title: 'Squad Pitch & Match Prep',
    body: 'FIFA-style interactive pitch view with player cards and formation switcher. Dual registration management with expiry alerts for players registered across WSL and parent club academy. Set pieces library with SVG diagrams. Team talks builder for match day.',
  },
  {
    icon: '🤖',
    title: 'AI Club Director Morning Briefing',
    body: 'Delivered before training — FSR headroom update, welfare flags, commercial pipeline status, squad availability and injury log, dual registration expiry alerts, and one key action for the day. Voice-powered. Built specifically for the women\'s game.',
  },
]

const WHO_ITS_FOR = [
  {
    icon: '🏆',
    title: 'WSL Non-Big Four',
    subtitle: 'Bristol City, Leicester City, Crystal Palace, Everton and more',
    points: [
      'FSR compliance without a dedicated finance team',
      'Commercial pipeline competing against Big Four budgets',
      'Welfare obligations met — ACL, maternity, mental health',
      'Board suite for investor conversations and standalone readiness',
      'AI Club Director briefing every morning',
    ],
  },
  {
    icon: '🥈',
    title: 'WSL2 Clubs',
    subtitle: 'Championship Women\'s clubs building toward promotion',
    points: [
      'FSR headroom tracked from day one of the season',
      'Dual registration management across parent club squads',
      'Sponsorship pipeline with bundled deal attribution',
      'Player welfare log ahead of top-flight duty of care standards',
      'Promotion planning with FSR scenario modelling',
    ],
  },
  {
    icon: '🏢',
    title: 'Standalone Women\'s Clubs',
    subtitle: 'Operating or transitioning to full independence',
    points: [
      'Demerger Readiness Tracker — legal, commercial, governance',
      'Standalone valuation model for investor conversations',
      'Full commercial CRM with no bundling assumptions',
      'Independent board suite — separate from parent club reporting',
      'FSR compliance as a fully autonomous entity',
    ],
  },
]

const PRICING = [
  {
    tier: "Grassroots Women's Lite",
    price: '£199',
    period: '/mo',
    desc: 'For women\'s clubs at Steps 4 and below',
    features: ['Squad management', 'Player welfare log', 'Match day tools', 'Basic AI briefing'],
    highlight: false,
  },
  {
    tier: "WSL2 Club",
    price: '£1,200',
    period: '/mo',
    desc: 'Championship Women\'s football — full platform',
    features: ['FSR compliance dashboard', 'Player welfare hub', 'Dual registration management', 'Sponsorship pipeline', 'Board suite', 'AI Club Director briefing'],
    highlight: false,
  },
  {
    tier: "WSL Non-Big Four",
    price: '£2,500',
    period: '/mo',
    desc: 'The full Lumio Women\'s Football operating system',
    features: ['Everything in WSL2', 'Full standalone sponsorship CRM', 'Investor toolkit', 'Demerger readiness tracker', 'Standalone valuation model', 'Dedicated onboarding'],
    highlight: true,
  },
  {
    tier: 'Standalone',
    price: '£3,500',
    period: '/mo',
    desc: 'For clubs operating as fully independent entities',
    features: ['Everything in WSL Non-Big Four', 'Full standalone board suite', 'Independent financial planning', 'Commercial director view', 'Priority support', 'Quarterly strategy review'],
    highlight: false,
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WomensFootballPage() {
  const [_open, _setOpen] = useState(false)

  return (
    <div style={{ backgroundColor: BG, color: '#F9FAFB' }} className="pt-28 pb-20">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.12) 0%, transparent 65%)` }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 md:py-32 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)' }}>
            <span className="text-xs font-semibold" style={{ color: ACCENT }}>Lumio Women&apos;s Football</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            The first operating system built for{' '}
            <span style={{ background: 'linear-gradient(135deg, #EC4899, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              professional women&apos;s football.
            </span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed mb-3 mx-auto" style={{ color: '#9CA3AF', maxWidth: 620 }}>
            FSR compliance, player welfare management, and standalone commercial tools — built for the women&apos;s game, not adapted from the men&apos;s.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap justify-center gap-3 my-8">
            {[
              { value: '£500m', label: 'WSL commercial revenue target' },
              { value: '75%', label: 'of WSL clubs without a kit sponsor' },
              { value: '0', label: 'platforms built specifically for this' },
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', color: '#F9FAFB' }}>
                <span className="font-black" style={{ color: ACCENT }}>{s.value}</span>
                <span style={{ color: '#9CA3AF' }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold"
              style={{ backgroundColor: ACCENT, color: '#F9FAFB' }}>
              Book a Women&apos;s Football demo <ArrowRight size={16} />
            </Link>
            <Link
              href="/sports-product"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-medium"
              style={{ border: `1px solid ${BORDER}`, color: '#9CA3AF' }}>
              See all sport portals
            </Link>
          </div>
        </div>
      </section>

      {/* ── What Makes Women's Football Different ─────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>
              Why it matters
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">What makes women&apos;s football different</h2>
            <p className="mt-4 text-base mx-auto" style={{ color: '#6B7280', maxWidth: 520 }}>
              The women&apos;s game operates under different regulations, different welfare obligations, and a fundamentally different commercial structure. Generic club software ignores all three.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {DIFFERENCES.map(d => (
              <div
                key={d.title}
                className="rounded-2xl p-8"
                style={{ backgroundColor: CARD, border: `1px solid rgba(236,72,153,0.2)` }}>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl mb-6"
                  style={{ backgroundColor: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)' }}>
                  {d.icon}
                </div>
                <h3 className="text-xl font-black mb-1" style={{ color: '#F9FAFB' }}>{d.title}</h3>
                <p className="text-xs font-semibold mb-4" style={{ color: ACCENT }}>{d.subtitle}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>The platform</p>
          <h2 className="text-3xl md:text-4xl font-bold">Built module by module for the women&apos;s game</h2>
          <p className="mt-4 text-base mx-auto" style={{ color: '#6B7280', maxWidth: 520 }}>
            Six purpose-built modules that cover every operational challenge a professional women&apos;s club faces today.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="rounded-2xl p-7"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-5"
                style={{ backgroundColor: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)' }}>
                {f.icon}
              </div>
              <h3 className="text-base font-black mb-3" style={{ color: '#F9FAFB' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who It's For ──────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Who it&apos;s for</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built for every level of professional women&apos;s football</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {WHO_ITS_FOR.map(w => (
              <div
                key={w.title}
                className="rounded-2xl p-8"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{w.icon}</span>
                  <div>
                    <h3 className="text-lg font-black" style={{ color: '#F9FAFB' }}>{w.title}</h3>
                    <p className="text-xs" style={{ color: ACCENT }}>{w.subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {w.points.map(pt => (
                    <li key={pt} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                      <Check size={14} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Pricing</p>
          <h2 className="text-3xl font-bold">Priced for the women&apos;s game</h2>
          <p className="mt-4 text-base mx-auto" style={{ color: '#6B7280', maxWidth: 480 }}>
            Four tiers — from grassroots to standalone. No men&apos;s football pricing applied.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING.map(p => (
            <div
              key={p.tier}
              className="relative rounded-2xl p-7 flex flex-col"
              style={{
                backgroundColor: p.highlight ? 'rgba(236,72,153,0.07)' : CARD,
                border: `1px solid ${p.highlight ? ACCENT : BORDER}`,
              }}>
              {p.highlight && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full"
                  style={{ backgroundColor: ACCENT, color: '#F9FAFB' }}>
                  Most Popular
                </div>
              )}
              <h3 className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{p.tier}</h3>
              <p className="text-xs mb-4" style={{ color: '#6B7280' }}>{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black" style={{ color: '#F9FAFB' }}>{p.price}</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>{p.period}</span>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                    <Check size={13} style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: p.highlight ? ACCENT : 'rgba(255,255,255,0.05)',
                  color: p.highlight ? '#F9FAFB' : '#9CA3AF',
                  border: p.highlight ? 'none' : `1px solid ${BORDER}`,
                }}>
                Book a demo <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div
          className="rounded-2xl px-8 py-16 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(244,114,182,0.06) 100%)',
            border: '1px solid rgba(236,72,153,0.25)',
          }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
            The time is now
          </p>
          <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
            The FSR just landed.{' '}
            <span style={{ background: 'linear-gradient(135deg, #EC4899, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Are you compliant?
            </span>
          </h2>
          <p className="text-lg leading-relaxed mb-10 mx-auto" style={{ color: '#9CA3AF', maxWidth: 560 }}>
            The Football Sustainability Regulations are live. Clubs operating without an FSR compliance dashboard are navigating blind. Lumio Women&apos;s Football gives you full visibility — in real time, before every board meeting, and before every signing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold"
              style={{ backgroundColor: ACCENT, color: '#F9FAFB' }}>
              Book a Women&apos;s Football demo <ArrowRight size={16} />
            </Link>
            <Link
              href="/sports"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-medium"
              style={{ border: `1px solid ${BORDER}`, color: '#9CA3AF' }}>
              Explore all sport portals <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
