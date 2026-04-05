'use client'

import Link from 'next/link'
import Image from 'next/image'

const ACCENT = '#A3E635'
const BG = '#0A0B10'
const CARD = '#111318'
const BORDER = '#1F2937'

const FEATURES = [
  { icon: '📊', title: 'Rankings & Race', desc: 'Track your ATP/WTA ranking, Race to Turin standings, points expiry calendar and ranking forecaster in real time.' },
  { icon: '🗓️', title: 'Tournament Schedule', desc: 'Full tournament calendar with entry deadlines, withdrawal windows, prize money and points breakdown per round.' },
  { icon: '🎯', title: 'Match Analysis & Scouting', desc: 'Performance stats, surface breakdowns, H2H records, opponent scouting and tactical notes before every match.' },
  { icon: '👥', title: 'Team Hub', desc: 'Coach, physio, agent and stringer — all with role-specific views working from the same data on one platform.' },
  { icon: '🤝', title: 'Sponsorship & Commercial', desc: 'Track deals, renewal dates, obligations, content calendars, prize money ledger and agent pipeline.' },
  { icon: '🌅', title: 'AI Morning Briefing', desc: 'Personalised daily intelligence delivered before the day begins — for player, coach, agent and physio.' },
]

const AUDIENCE = [
  { title: 'ATP/WTA Tour Players', desc: 'Ranked professionals managing a full tour schedule' },
  { title: 'Challengers & ITF Players', desc: 'Rising talent building their ranking and team' },
  { title: 'Player Teams', desc: 'Coaches, agents, physios working together in one platform' },
]

const PRICING = [
  { tier: 'Lumio Tour Pro', price: '£199/mo', features: ['Individual dashboard', 'Rankings tracker', 'Tournament schedule', 'Sponsorship manager', 'AI morning briefing'] },
  { tier: 'Lumio Tour Pro+', price: '£349/mo', highlight: true, features: ['Everything in Pro', 'Full team access', 'Coach/agent/physio views', 'Video library', 'Financial dashboard', 'Tax tracker'] },
]

export default function TennisPage() {
  return (
    <div style={{ backgroundColor: BG, color: '#E5E7EB' }}>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <Image src="/Sports/tennis_logo.png" alt="Lumio Tennis" width={120} height={120} className="mx-auto mb-6" />
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          Lumio Tour · Tennis
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#F9FAFB' }}>
          The career OS for professional tennis players.
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: '#9CA3AF' }}>
          ATP/WTA ranking tracker, tournament planner, match prep, sponsorship manager, AI morning briefing — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/tennis/tennis-demo" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#0A0B10' }}>
            Try the demo →
          </Link>
          <Link href="/contact" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ border: `1px solid ${BORDER}`, color: '#D1D5DB' }}>
            Book a walkthrough
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Everything a touring pro needs</h2>
        <p className="text-sm text-center mb-12" style={{ color: '#9CA3AF' }}>Six core modules built specifically for professional tennis.</p>
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
          <h2 className="text-2xl font-black mb-3" style={{ color: '#F9FAFB' }}>See it in action</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Try the Lumio Tennis demo — no login required.</p>
          <Link href="/tennis/tennis-demo" className="inline-block px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#0A0B10' }}>
            Launch demo →
          </Link>
        </div>
      </section>
    </div>
  )
}
