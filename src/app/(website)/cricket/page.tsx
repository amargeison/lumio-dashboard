'use client'

import Link from 'next/link'

const ACCENT = '#F59E0B'
const BG = '#0A0B10'
const CARD = '#111318'
const BORDER = '#1F2937'

const FEATURES = [
  { icon: '📋', title: 'Contract & Central Contract Tracker', desc: 'County, franchise and central contract status, release windows, renewal dates and earnings.' },
  { icon: '📈', title: 'Performance Analytics', desc: 'Batting averages, strike rates, bowling economy, wickets, format breakdowns (Test/ODI/T20) and form charts.' },
  { icon: '🗓️', title: 'Tour & Schedule Planner', desc: 'International tour calendar, franchise schedule (IPL/The Hundred/BBL) and availability tracker.' },
  { icon: '🏥', title: 'Injury & Fitness Management', desc: 'Injury log, physio notes, fitness testing, return-to-play protocols and workload management.' },
  { icon: '🤝', title: 'Sponsorship & Commercial', desc: 'Bat sponsorships, endorsements, appearance fees, social obligations and commercial pipeline.' },
  { icon: '🏛️', title: 'Agent & Federation Hub', desc: 'ECB/ICC registration, NOC management, agent pipeline and accreditation tracking.' },
]

const AUDIENCE = [
  { title: 'County & State Players', desc: 'Domestic professionals on the county/state circuit' },
  { title: 'International Players', desc: 'Test and white-ball internationals on central contracts' },
  { title: 'Franchise Players', desc: 'IPL, The Hundred, BBL and global T20 franchise players' },
]

const PRICING = [
  { tier: 'Single Player', price: 'from £199/mo', features: ['Individual dashboard', 'Contract tracker', 'Performance analytics', 'Injury management', 'AI morning briefing'] },
  { tier: 'Player + Team', price: 'from £349/mo', highlight: true, features: ['Everything in Single', 'Full team access', 'Coach/agent/physio views', 'Financial dashboard', 'Commercial suite'] },
  { tier: 'Club Licensing', price: 'Contact us', features: ['Multi-player deployment', 'Club-wide analytics', 'Custom integrations', 'Dedicated account manager'] },
]

export default function CricketPage() {
  return (
    <div style={{ backgroundColor: BG, color: '#E5E7EB' }}>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center text-5xl" style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>🏏</div>
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          Lumio Tour · Cricket
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#F9FAFB' }}>
          The career OS for professional cricketers.
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-4" style={{ color: '#9CA3AF' }}>
          Contract tracker, batting &amp; bowling analytics, tour schedule, sponsorship manager, injury log and AI morning briefing.
        </p>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-8" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          Coming soon — join the waitlist
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/contact" className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#0A0B10' }}>
            Request early access →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Built for professional cricket</h2>
        <p className="text-sm text-center mb-12" style={{ color: '#9CA3AF' }}>Six core modules designed for the modern cricketer.</p>
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
          <h2 className="text-2xl font-black mb-3" style={{ color: '#F9FAFB' }}>Cricket is coming</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Get early access to Lumio Cricket.</p>
          <Link href="/contact" className="inline-block px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: ACCENT, color: '#0A0B10' }}>
            Join the waitlist →
          </Link>
        </div>
      </section>
    </div>
  )
}
