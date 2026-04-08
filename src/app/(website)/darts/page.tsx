'use client'

import Link from 'next/link'
import Image from 'next/image'

const ACCENT = '#EF4444'
const BG = '#0A0B10'
const CARD = '#111318'
const BORDER = '#1F2937'

const FEATURES = [
  { icon: '📊', title: 'Order of Merit & Tour Card Monitor', desc: 'Rolling 2-year OoM tracker, weekly drop-off table, buffer above the #64 cut and a Merit Forecaster that simulates prize money outcomes by round.' },
  { icon: '🎯', title: 'Performance Suite', desc: 'Three-dart average, first 9, dartboard heatmap by segment, checkout analysis, pressure analysis, opponent intel and a composite Performance Rating out of 100.' },
  { icon: '🎽', title: 'Equipment Setup', desc: 'Structured barrel / shaft / flight / point specs across multiple setups. Performance per setup, change log, side-by-side compare. Backed by Supabase.' },
  { icon: '⚡', title: 'Match Prep & AI Briefings', desc: "Opponent dossier, game plan, tactical AI briefing for tonight's match, Nine-Dart Tracker, Premier League pathway and World Series invitation status." },
  { icon: '🤝', title: 'Team & Brand', desc: 'Team Hub, threaded Team Comms, Mental Performance log, Walk-on Music tracker, Fan Engagement across 4 platforms, Sponsorship pipeline and Exhibition Manager.' },
  { icon: '🔌', title: 'Live Data Integrations', desc: 'DartConnect for session averages and 180 counts, PDC Live Data for real-time scores and OoM updates, Scolia for camera-tracked dartboard heatmaps.' },
]

const AUDIENCE = [
  { title: 'PDC Tour Card Holders', desc: 'Professionals managing a full PDC schedule, Euro Tour and Players Championships' },
  { title: 'Challenge Tour Players', desc: 'Developing players building their Order of Merit and chasing a tour card' },
  { title: 'Player Management Teams', desc: 'Coaches, agents, physios and mental coaches with their own role views' },
]

const PRICING = [
  { tier: 'Lumio Darts Pro', price: '£149/mo', features: ['51 portal features across 6 sections', 'Order of Merit + Tour Card Monitor', 'Performance Rating + dartboard heatmap', 'Equipment setup tracker', 'Match Prep + AI briefings', 'Up to 3 team accounts'] },
  { tier: 'Lumio Darts Pro+', price: '£299/mo', highlight: true, features: ['Everything in Pro', 'DartConnect + PDC Live + Scolia integrations', 'Sponsorship pipeline + Fan Engagement hub', 'Premier League + World Series trackers', 'Threaded Team Comms across full team', 'Priority account manager'] },
]

export default function DartsPage() {
  return (
    <div style={{ backgroundColor: BG, color: '#E5E7EB' }}>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <Image src="/Sports/darts_logo.png" alt="Lumio Darts" width={120} height={120} className="mx-auto mb-6" />
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          Lumio Tour · Darts
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#F9FAFB' }}>
          The complete platform for professional darts players.
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-4" style={{ color: '#9CA3AF' }}>
          Built for PDC Tour Card holders. Every tool you need to manage your performance, your tour, your brand, and your career — in one place. 51 features. Live data. Real player profiles.
        </p>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-8" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          No tool like this exists anywhere else.
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/darts/darts-demo" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#FFFFFF' }}>
            Try the demo →
          </Link>
          <Link href="/contact" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ border: `1px solid ${BORDER}`, color: '#D1D5DB' }}>
            Book a walkthrough
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Everything a PDC pro needs</h2>
        <p className="text-sm text-center mb-12" style={{ color: '#9CA3AF' }}>51 portal features across 6 sections — performance, team, commercial, operations, integrations and AI tools.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-12" style={{ color: '#F9FAFB' }}>Who it&apos;s for</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AUDIENCE.map((a, i) => (
            <div key={i} className="rounded-2xl p-6 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>{a.title}</h3>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-12" style={{ color: '#F9FAFB' }}>Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRICING.map((p, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: CARD, border: p.highlight ? `2px solid ${ACCENT}` : `1px solid ${BORDER}` }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>{p.tier}</h3>
              <div className="text-2xl font-black mb-4" style={{ color: ACCENT }}>{p.price}</div>
              <ul className="space-y-2">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                    <span style={{ color: ACCENT }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-2xl p-8 md:p-12 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <h2 className="text-2xl font-black mb-3" style={{ color: '#F9FAFB' }}>The complete platform for darts professionals</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Try the demo with the Jake Morrison sample profile, or set up your own portal in 5 steps.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/darts/darts-demo" className="inline-block px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#FFFFFF' }}>
              Try the demo →
            </Link>
            <Link href="/darts/onboarding" className="inline-block px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ border: `1px solid ${BORDER}`, color: '#D1D5DB' }}>
              Set up your portal →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
