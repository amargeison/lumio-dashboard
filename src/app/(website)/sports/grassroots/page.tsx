'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const FEATURES = [
  { icon: '📋', title: 'Availability Tracker', desc: 'One tap to confirm or decline. See exactly who\u2019s in, who\u2019s maybe, who\u2019s not responded. No more chasing 18 WhatsApp messages the night before.' },
  { icon: '💰', title: 'Subs & Expenses', desc: 'Track match fees, outstanding payments, kit costs, and pitch hire in one place. Export for the treasurer at the end of the season.' },
  { icon: '🌦️', title: 'Weather & Pitch Alerts', desc: 'Match week weather forecast linked to your pitch. Get a flag when rain risk is high and a pitch inspection is needed.' },
  { icon: '🏥', title: 'DBS & Compliance', desc: 'Automatic DBS expiry alerts for all coaches and committee members. Never miss a renewal or get caught out by a league check.' },
  { icon: '📢', title: 'Team Announcements', desc: 'Push announcements to the whole squad. Training changes, kit days, end-of-season events \u2014 everyone gets it instantly.' },
  { icon: '🤖', title: 'AI Morning Briefing', desc: 'Your manager gets a daily briefing: who\u2019s confirmed, weather outlook, next match details, any outstanding issues. No more morning scramble.' },
  { icon: '📅', title: 'Training Scheduler', desc: 'Plan sessions, assign pitches, set weather-check flags. Players see the week at a glance and confirm attendance.' },
  { icon: '⚽', title: 'Results & League Table', desc: 'Log match results, track your league position, see your form across the season.' },
]

const STEPS = [
  { num: '01', title: 'Set up your club', desc: 'Add your squad, set your training days, connect your league.' },
  { num: '02', title: 'Players confirm in one tap', desc: 'Availability, attendance, and payments all tracked automatically.' },
  { num: '03', title: 'You focus on the football', desc: 'The app handles the admin.' },
]

const PRICING = [
  {
    name: 'Free',
    price: '£0',
    period: '/mo',
    features: ['Up to 20 players', 'Availability tracking', 'Results logging', 'Announcements'],
    color: '#d97706',
    popular: false,
  },
  {
    name: 'Pro',
    price: '£9',
    period: '/mo',
    features: ['Unlimited players', 'Subs tracking', 'DBS alerts', 'Weather integration', 'AI briefing', 'Pitch booking'],
    color: '#d97706',
    popular: true,
  },
]

export default function GrassrootsPage() {
  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(217,119,6,0.1) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ backgroundColor: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)' }}>
            <span className="text-sm">🟡</span>
            <span className="text-xs font-semibold" style={{ color: '#FBBF24' }}>Lumio Grassroots</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Lumio Grassroots
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: '#9CA3AF' }}>
            The smart club app for Sunday league, veterans, and amateur football.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/football/grassroots/sunday-rovers-fc" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#d97706', color: '#fff', textDecoration: 'none' }}>
              See the demo <ArrowRight size={14} />
            </Link>
            <Link href="/schools/register" className="px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid #1F2937', textDecoration: 'none' }}>
              Start free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#d97706' }}>Features</p>
            <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Everything Your Club Needs. Nothing It Doesn&apos;t.</h2>
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#d97706' }}>How It Works</p>
            <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>Up and running in three steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-black mb-4" style={{ backgroundColor: 'rgba(217,119,6,0.15)', color: '#FBBF24' }}>
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
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#d97706' }}>Pricing</p>
            <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>Simple pricing. Cancel anytime.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </section>

      {/* CTA Banner */}
      <section
        className="py-24"
        style={{
          background: 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(251,191,36,0.1))',
          borderTop: '1px solid rgba(217,119,6,0.2)',
          borderBottom: '1px solid rgba(217,119,6,0.2)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-5" style={{ color: '#F9FAFB' }}>
            Stop managing your club on WhatsApp.
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
            Join the grassroots clubs already using Lumio to get organised, save time, and focus on the football.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/football/grassroots/sunday-rovers-fc"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
              style={{ backgroundColor: '#F9FAFB', color: '#07080F' }}
            >
              See the demo <ArrowRight size={16} />
            </Link>
            <Link
              href="/schools/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
              style={{ border: '1px solid #d97706', color: '#d97706' }}
            >
              Start free
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
