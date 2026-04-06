'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const FEATURES = [
  { icon: '💰', title: 'Purse Simulator', desc: 'See exactly what you take home before you sign. Manager fee, trainer cut, sanctioning fees, camp costs and tax — all deducted in real time.' },
  { icon: '🥊', title: 'Fight Camp Planner', desc: '8-12 week structured camp. Daily briefings, sparring schedule, weight trajectory, and peak readiness projection.' },
  { icon: '🏆', title: 'World Rankings Intelligence', desc: 'Your position across WBC, WBA, WBO, IBF and Zuffa Boxing — mandatory status, purse bid alerts, path to title.' },
  { icon: '📊', title: 'Financial Dashboard', desc: 'Every pound earned, every pound spent. Fight purses, camp costs, sponsorship income and tax across your career.' },
  { icon: '👥', title: 'Team Hub', desc: 'Fighter, trainer, manager, nutritionist, physio and cutman on one platform with role-specific views.' },
  { icon: '🤖', title: 'AI Morning Briefing', desc: 'Your weight, recovery, sparring partners, tactical focus, obligations — delivered before the day begins.' },
]

const WHO = [
  { title: 'World Title Contenders', desc: 'Top 10 in their division, on DAZN, Sky or Paramount+', icon: '🥇' },
  { title: 'British & Commonwealth Champions', desc: 'Domestic title holders with world ambitions', icon: '🇬🇧' },
  { title: 'Fighter Teams', desc: 'Trainers, managers and nutritionists on the same platform', icon: '👥' },
]

const PRICING = [
  { name: 'Contender', price: '£149', period: '/mo', features: ['Camp planner', 'Weight tracker', 'Financial dashboard', 'Team hub', 'Morning briefing', 'Basic rankings'], color: '#EF4444', popular: false },
  { name: 'Champion', price: '£299', period: '/mo', features: ['All Contender features', 'Sanctioning body tracker', 'Purse simulator', 'Opposition video', 'Sponsorship manager', 'Voice briefings'], color: '#B91C1C', popular: true },
  { name: 'Elite', price: '£599', period: '/mo', features: ['All Champion features', 'Mandatory automation', 'Purse bid tracker', 'Health records', 'Contract summary', 'Dedicated account manager'], color: '#7F1D1D', popular: false },
]

export default function BoxingMarketingPage() {
  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(239,68,68,0.08) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <span className="text-sm">🥊</span>
            <span className="text-xs font-semibold" style={{ color: '#F87171' }}>The gap is complete. Nothing like this exists anywhere.</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            The first career OS for<br />
            <span style={{ background: 'linear-gradient(135deg, #EF4444, #B91C1C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>professional boxers</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: '#9CA3AF' }}>
            Purse simulator, sanctioning body rankings, fight camp planner, financial transparency — everything boxing has never had.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/boxing/lumio-demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#EF4444', color: '#fff', textDecoration: 'none' }}>
              Try the demo <ArrowRight size={14} />
            </Link>
            <Link href="/contact" className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid #1F2937', textDecoration: 'none' }}>
              Book a walkthrough
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black mb-8 text-center">Built for the business of boxing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-xl p-5" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
              <span className="text-2xl block mb-3">{f.icon}</span>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black mb-8 text-center">Who it&apos;s for</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WHO.map(w => (
            <div key={w.title} className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-3xl block mb-3">{w.icon}</span>
              <h3 className="text-sm font-bold mb-2">{w.title}</h3>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black mb-8 text-center">Simple, transparent pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map(p => (
            <div key={p.name} className="rounded-2xl p-6 relative flex flex-col" style={{ backgroundColor: '#0D1117', border: `1px solid ${p.popular ? p.color : '#1F2937'}` }}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: p.color, color: '#fff' }}>Most Popular</div>}
              <h3 className="text-sm font-bold mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black">{p.price}</span>
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
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: p.popular ? p.color : 'rgba(255,255,255,0.05)', color: p.popular ? '#fff' : '#9CA3AF', border: p.popular ? 'none' : '1px solid #1F2937' }}>Get Started</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-2xl p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(185,28,28,0.1))', border: '1px solid rgba(239,68,68,0.25)' }}>
          <h2 className="text-2xl md:text-3xl font-black mb-3">Boxing has never had this.</h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Try Lumio Fight — no login required.</p>
          <Link href="/boxing/lumio-demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#EF4444', color: '#fff', textDecoration: 'none' }}>
            Launch demo <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  )
}
