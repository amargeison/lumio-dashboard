'use client'

import Link from 'next/link'
import Image from 'next/image'

const ACCENT = '#EF4444'
const BG = '#0A0B10'
const CARD = '#111318'
const BORDER = '#1F2937'

const FEATURES = [
  { icon: '📊', title: 'Order of Merit & Race', desc: 'Rolling 2-year prize money tracker, points expiry calendar, race standings and tour card security indicator.' },
  { icon: '🎯', title: 'Three-Dart Average Dashboard', desc: 'Career and tournament averages, first-9 analysis, 180s per leg, checkout % and darts at double — all in one view.' },
  { icon: '✅', title: 'Checkout Analysis', desc: 'Favourite doubles hit rates, common checkout routes, under-pressure finishing stats and double practice target setting.' },
  { icon: '🎪', title: 'Exhibition Manager', desc: 'Book, track and manage your exhibition calendar — the biggest revenue stream for PDC pros, finally organised.' },
  { icon: '🔍', title: 'Opponent Intel', desc: 'H2H records, preferred doubles, scoring patterns, pressure stats and tactical briefing notes before every match.' },
  { icon: '🏛️', title: 'Tour Card & Q-School', desc: 'Track PDC card status, Challenge Tour points, European Tour ranking and Q-School preparation timeline.' },
]

const AUDIENCE = [
  { title: 'PDC Tour Card Holders', desc: 'Professionals managing a full PDC schedule' },
  { title: 'Challenge Tour Players', desc: 'Developing players building their Order of Merit' },
  { title: 'Player Management Teams', desc: 'Managers and agents coordinating the full career' },
]

const PRICING = [
  { tier: 'Lumio Darts Pro', price: '£199/mo', features: ['Order of Merit tracker', 'Average dashboard', 'Exhibition manager', 'Opponent intel', 'AI morning briefing'] },
  { tier: 'Lumio Darts Pro+', price: '£349/mo', highlight: true, features: ['Everything in Pro', 'Team access', 'Financial dashboard', 'Media & content hub', 'Full commercial suite'] },
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
          The first career OS built for professional darts players.
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-4" style={{ color: '#9CA3AF' }}>
          PDC Order of Merit tracker, exhibition manager, checkout analysis, opponent intel, sponsorship dashboard and AI morning briefing.
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
        <p className="text-sm text-center mb-12" style={{ color: '#9CA3AF' }}>Six core modules built specifically for professional darts.</p>
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
          <h2 className="text-2xl font-black mb-3" style={{ color: '#F9FAFB' }}>The first platform built for darts professionals</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Try it free.</p>
          <Link href="/darts/darts-demo" className="inline-block px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#FFFFFF' }}>
            Launch demo →
          </Link>
        </div>
      </section>
    </div>
  )
}
