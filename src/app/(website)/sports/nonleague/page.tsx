'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const FEATURES = [
  { icon: '👥', title: 'Squad & Contract Management', desc: 'Full first-team squad with positions, contract status, availability, and fitness tracking. Know your 23 at a glance.' },
  { icon: '🤕', title: 'Injury & Suspension Tracker', desc: 'Real-time injury log, suspension countdowns, return-to-training dates. Never pick an ineligible player again.' },
  { icon: '🔄', title: 'Loan Player Administration', desc: 'Track loan windows, parent club permissions, eligibility dates, and recall clauses. Manage temporary signings without the paperwork chaos.' },
  { icon: '🏟️', title: 'Ground Grading Compliance', desc: 'Monitor your ground grading requirements against the FA and league standards. Automated alerts for inspections, outstanding items, and deadline dates.' },
  { icon: '🤝', title: 'Sponsorship Manager', desc: 'Track all your commercial partnerships, renewal dates, logo placement obligations, and sponsor communications in one place.' },
  { icon: '💳', title: 'Match Fees & Payments', desc: 'Player payments, boot money, appearance fees, and expenses \u2014 logged per match and exportable for your club accountant.' },
  { icon: '📊', title: 'Live League Table', desc: 'Your league table updated in real time. Click any club to see their form, results, and upcoming fixtures.' },
  { icon: '🤖', title: 'AI Morning Briefing', desc: 'Manager gets a daily briefing: fitness updates, upcoming fixtures, ground grading alerts, sponsorship deadlines. Everything before training.' },
]

const STEPS = [
  { num: '01', title: 'Set up your club', desc: 'Squad, staff, ground details, league connections.' },
  { num: '02', title: 'Manage your season', desc: 'Fixtures, training, injuries, compliance all in one dashboard.' },
  { num: '03', title: 'Focus on winning', desc: 'The platform handles the admin; you handle the football.' },
]

const PRICING = [
  {
    name: 'Starter',
    price: '£49',
    period: '/mo',
    features: ['Squad management', 'Fixtures', 'Results', 'Training planner', 'Basic reporting'],
    color: '#475569',
    popular: false,
  },
  {
    name: 'Pro',
    price: '£99',
    period: '/mo',
    features: ['All Starter features', 'Injury tracker', 'Loan management', 'Ground grading alerts', 'Sponsorship manager', 'AI briefing'],
    color: '#475569',
    popular: true,
  },
  {
    name: 'Club',
    price: '£199',
    period: '/mo',
    features: ['All Pro features', 'Multi-team management', 'Accounts export', 'Board reporting', 'Custom integrations'],
    color: '#475569',
    popular: false,
  },
]

export default function NonLeaguePage() {
  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(71,85,105,0.12) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ backgroundColor: 'rgba(71,85,105,0.15)', border: '1px solid rgba(71,85,105,0.35)' }}>
            <span className="text-sm">🏟️</span>
            <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Lumio Non-League</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Lumio Non-League
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: '#9CA3AF' }}>
            The operating platform for semi-professional football clubs.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/nonleague/harfield-fc" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#475569', color: '#fff', textDecoration: 'none' }}>
              See the demo <ArrowRight size={14} />
            </Link>
            <Link href="/contact" className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid #1F2937', textDecoration: 'none' }}>
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Features</p>
            <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Built for the Reality of Semi-Professional Football</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl p-5" style={{ backgroundColor: '#0D1017', border: '1px solid #1F2937' }}>
                <span className="text-2xl block mb-3">{f.icon}</span>
                <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ backgroundColor: '#07080F' }} className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>How It Works</p>
            <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>From spreadsheets to a proper system in three steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-black mb-4" style={{ backgroundColor: 'rgba(71,85,105,0.2)', color: '#94A3B8' }}>
                  {s.num}
                </div>
                <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Pricing</p>
            <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>Pricing that makes sense for non-league budgets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map(p => (
              <div key={p.name} className="rounded-2xl p-6 relative flex flex-col" style={{ backgroundColor: '#0D1017', border: `1px solid ${p.popular ? '#94A3B8' : '#1F2937'}` }}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#475569', color: '#fff' }}>Most Popular</div>
                )}
                <h3 className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black" style={{ color: '#F9FAFB' }}>{p.price}</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>{p.period}</span>
                </div>
                <div className="space-y-2 flex-1 mb-6">
                  {p.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={14} style={{ color: '#94A3B8' }} />
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: p.popular ? '#475569' : 'rgba(255,255,255,0.05)', color: p.popular ? '#fff' : '#9CA3AF', border: p.popular ? 'none' : '1px solid #1F2937' }}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="py-24"
        style={{
          background: 'linear-gradient(135deg, rgba(71,85,105,0.15), rgba(148,163,184,0.1))',
          borderTop: '1px solid rgba(71,85,105,0.2)',
          borderBottom: '1px solid rgba(71,85,105,0.2)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-5" style={{ color: '#F9FAFB' }}>
            Run your club like a professional operation.
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
            Join the non-league clubs already using Lumio to replace the spreadsheet chaos and focus on results.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/nonleague/harfield-fc"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
              style={{ backgroundColor: '#F9FAFB', color: '#07080F' }}
            >
              See the demo <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
              style={{ border: '1px solid #475569', color: '#94A3B8' }}
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
