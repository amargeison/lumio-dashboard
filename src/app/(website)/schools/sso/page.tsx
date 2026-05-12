'use client'

import Link from 'next/link'
import { ArrowRight, Check, RefreshCw, Lock } from 'lucide-react'

const ROADMAP_INTEGRATIONS = ['Google Workspace', 'Microsoft 365', 'Arbor', 'SIMS', 'Bromcom']

const FEATURES = [
  { emoji: '🔐', title: 'Single Sign-On (roadmap)', desc: 'Sign in with Google or Microsoft accounts. On the roadmap for the first founding schools — talk to us about your SSO setup.' },
  { emoji: '🔄', title: 'MIS Sync (roadmap)', desc: 'Arbor, SIMS and Bromcom rostering — planned for the first founding schools. We will scope each provider with whichever schools join us first.' },
  { emoji: '🇬🇧', title: 'UK-First', desc: 'Built for UK schools, primary and secondary, with statutory guidance (KCSiE, SEND White Paper, Ofsted 2025) as the design baseline.' },
  { emoji: '👥', title: 'Auto-Provisioning (roadmap)', desc: 'New staff get access automatically, leavers are deprovisioned. Part of the first SSO release.' },
  { emoji: '🏫', title: 'MAT Ready (roadmap)', desc: 'Manage SSO and rostering across a multi-academy trust from one dashboard.' },
]

export default function SSOPage() {
  return (
    <div style={{ backgroundColor: '#07080F' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1040 40%, #0d2a2a 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #6C3FC5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0D9488 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-8" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            🇬🇧 UK-First · Pre-launch — built for British schools
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6" style={{ color: '#F9FAFB', lineHeight: 1.1 }}>
            SSO &amp; MIS rostering,<br />
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>on the roadmap from day one.</span>
          </h1>
          <p className="text-lg md:text-xl mx-auto mb-10" style={{ color: '#9CA3AF', maxWidth: 680, lineHeight: 1.7 }}>
            Lumio Schools is pre-launch. Google Workspace, Microsoft 365, Arbor, SIMS and Bromcom are on our integration roadmap. We will build them with — and for — the first schools who join us as founding partners.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link href="/signup?portal=schools" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Talk to us about founding access <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all" style={{ color: '#F9FAFB', border: '1px solid #374151' }}>
              How we plan to build it
            </a>
          </div>
          <p className="text-xs mb-4" style={{ color: '#6B7280' }}>On our roadmap</p>
          <div className="flex flex-wrap justify-center gap-3">
            {ROADMAP_INTEGRATIONS.map(name => (
              <span key={name} className="rounded-full px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#D1D5DB', border: '1px solid rgba(255,255,255,0.1)' }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW WE PLAN TO BUILD IT ──────────────────────────────────────── */}
      <section id="how-it-works" style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>How we plan to build it.</h2>
          <p className="text-center text-base mb-16 mx-auto" style={{ color: '#9CA3AF', maxWidth: 540 }}>Three stages. Scoped and built with the first founding schools who sign up.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Pick your MIS', desc: 'Tell us whether you use Arbor, SIMS, Bromcom or something else. We will scope and build the MIS sync that fits your school first.', icon: RefreshCw },
              { num: '2', title: 'SSO with your existing accounts', desc: 'Google Workspace or Microsoft 365 — whichever your staff already use. No new passwords, no separate helpdesk.', icon: Lock },
              { num: '3', title: 'Keep it in sync', desc: 'Once live, pupil rolls and staff records stay in sync daily. New starters added, leavers removed, dashboard always current.', icon: Check },
            ].map((step, i) => (
              <div key={step.num} className="relative">
                {i < 2 && <div className="hidden md:block absolute top-8 -right-4 w-8" style={{ borderTop: '2px dashed #374151' }} />}
                <div className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>
                      {step.num}
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{step.title}</h3>
                  </div>
                  <p className="text-sm" style={{ color: '#9CA3AF', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>What we are building.</h2>
          <p className="text-center text-base mb-14 mx-auto" style={{ color: '#9CA3AF', maxWidth: 540 }}>Everything below is on the roadmap. We will build the parts that matter most to the first founding schools first.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <span className="text-3xl block mb-4">{f.emoji}</span>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.title}</h3>
                <p className="text-sm" style={{ color: '#9CA3AF', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ borderTop: '1px solid #1F2937' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(13,148,136,0.08) 0%, transparent 70%)' }} />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Help us build it with your school.</h2>
          <p className="text-base mb-10 mx-auto" style={{ color: '#9CA3AF', maxWidth: 520, lineHeight: 1.7 }}>
            We are building Lumio Schools with a small number of founding schools. The integrations on the roadmap are the ones we believe matter most — your priorities will shape the order they ship.
          </p>
          <Link href="/signup?portal=schools" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all hover:opacity-90" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Talk to us <ArrowRight size={18} />
          </Link>
          <p className="text-xs mt-6" style={{ color: '#4B5563' }}>Pre-launch. No commitment. We will be honest about what is built and what is on the roadmap.</p>
        </div>
      </section>
    </div>
  )
}
