'use client'

import Link from 'next/link'

const ACCENT = '#8B5CF6'
const BG = '#0A0B10'
const CARD = '#111318'
const BORDER = '#1F2937'

const FEATURES = [
  { icon: '📋', title: 'Contract & Career Management', desc: 'Track contract status, renewal dates, release clauses and agent pipeline in one secure place.' },
  { icon: '📈', title: 'Performance Analytics', desc: 'Match ratings, carries, tackles, lineouts, set piece stats and GPS load data from training and match days.' },
  { icon: '🏥', title: 'Injury & Recovery', desc: 'Injury log, physio notes, return-to-play timelines and load management tools integrated with your medical team.' },
  { icon: '🎯', title: 'Match Prep & Opposition Analysis', desc: 'Opponent tendencies, set piece analysis, tactical notes and pre-match briefing packs.' },
  { icon: '🤝', title: 'Sponsorship & Appearances', desc: 'Endorsement deals, social obligations, appearance fees and renewal calendars — all in one commercial hub.' },
  { icon: '👥', title: 'Team Hub', desc: 'Coach, physio, agent, S&C — role-specific views on one platform.' },
]

const AUDIENCE = [
  { title: 'Premiership & Top 14 Players', desc: "Elite club players across Europe's top leagues" },
  { title: 'International Players', desc: 'Test players managing club and international schedules' },
  { title: 'Academy Players', desc: 'Emerging talent building their professional career' },
]

const PRICING = [
  { tier: 'Single Player', price: 'from £199/mo', features: ['Individual dashboard', 'Contract tracker', 'Performance analytics', 'Injury management', 'AI morning briefing'] },
  { tier: 'Player + Team', price: 'from £349/mo', highlight: true, features: ['Everything in Single', 'Full team access', 'Coach/agent/physio views', 'Financial dashboard', 'Commercial suite'] },
  { tier: 'Club Licensing', price: 'Contact us', features: ['Multi-player deployment', 'Club-wide analytics', 'Custom integrations', 'Dedicated account manager'] },
]

export default function RugbyPage() {
  return (
    <div style={{ backgroundColor: BG, color: '#E5E7EB' }}>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center text-5xl" style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>🏉</div>
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          Lumio Tour · Rugby
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#F9FAFB' }}>
          The performance OS for professional rugby players.
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-4" style={{ color: '#9CA3AF' }}>
          Contract tracker, performance analytics, injury management, match prep, sponsorship dashboard and AI morning briefing.
        </p>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-8" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          Coming soon — join the waitlist
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/contact" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#FFFFFF' }}>
            Request early access →
          </Link>
          <a href="#features" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ border: `1px solid ${BORDER}`, color: '#D1D5DB' }}>
            Learn more
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Built for professional rugby</h2>
        <p className="text-sm text-center mb-12" style={{ color: '#9CA3AF' }}>Six core modules designed for the modern rugby professional.</p>
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
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Early access pricing</h2>
        <p className="text-sm text-center mb-12" style={{ color: '#9CA3AF' }}>Lock in your rate before launch.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-2xl p-8 md:p-12 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <h2 className="text-2xl font-black mb-3" style={{ color: '#F9FAFB' }}>Rugby is next</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Get early access before we launch.</p>
          <Link href="/contact" className="inline-block px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#FFFFFF' }}>
            Join the waitlist →
          </Link>
        </div>
      </section>
    </div>
  )
}
