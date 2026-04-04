'use client'

import Link from 'next/link'
import { Check, X, ArrowRight, Shield, Users, RefreshCw, Globe, Building2, Lock } from 'lucide-react'

const INTEGRATIONS = ['G Google Workspace', '⊞ Microsoft 365', 'Arbor', 'SIMS', 'Bromcom', 'OneRoster ✓']

const FEATURES = [
  { emoji: '🔐', title: 'Single Sign-On', desc: 'Staff sign in with Google or Microsoft. Works with personal and Workspace for Education accounts.' },
  { emoji: '🔄', title: 'Live MIS Sync', desc: 'Arbor, SIMS and Bromcom. Pupil data, class lists, year groups and staff roles sync daily — or on demand.' },
  { emoji: '📋', title: 'OneRoster Certified', desc: 'Industry-standard data exchange. Compatible with any OneRoster-compliant platform.' },
  { emoji: '🇬🇧', title: 'GDPR First', desc: 'All data stays in UK data centres. No US data transfers. Full audit trail.' },
  { emoji: '👥', title: 'Auto-Provisioning', desc: 'New staff get access automatically. Leavers are deprovisioned. No manual user management.' },
  { emoji: '🏫', title: 'MAT Ready', desc: 'Manage SSO and rostering across your entire trust from one dashboard.' },
]

const COMPARISON = [
  { feature: 'UK MIS Support (Arbor/SIMS/Bromcom)', lumio: true, wonde: true, clever: false, classlink: false, manual: true },
  { feature: 'Google Workspace SSO', lumio: true, wonde: false, clever: true, classlink: true, manual: false },
  { feature: 'Microsoft 365 SSO', lumio: true, wonde: false, clever: true, classlink: true, manual: false },
  { feature: 'SEND & Safeguarding', lumio: true, wonde: false, clever: false, classlink: false, manual: false },
  { feature: 'Ofsted Readiness', lumio: true, wonde: false, clever: false, classlink: false, manual: false },
  { feature: 'School Management Portal', lumio: true, wonde: false, clever: false, classlink: false, manual: false },
  { feature: 'UK GDPR Compliant', lumio: true, wonde: true, clever: false, classlink: false, manual: true },
  { feature: 'Extra Cost', lumio: '£0', wonde: '£1,200/yr', clever: '£1,800/yr', classlink: '£1,500/yr', manual: 'Staff time' },
]

const TESTIMONIALS = [
  { quote: "We cancelled our Wonde subscription the day we switched to Lumio. The MIS sync just works, and our staff haven't had a single login issue since.", name: 'Sarah Mitchell', role: 'Head of Digital', school: 'Oakridge Academy' },
  { quote: "Setting up Google SSO took 10 minutes. Our whole school was signed in by break time. I genuinely can't believe we used to pay extra for this.", name: 'James Harlow', role: 'IT Manager', school: 'Wimbledon High' },
  { quote: "As a MAT, managing logins across 8 schools was a nightmare. Lumio solved it in an afternoon.", name: 'Rachel Davies', role: 'CEO', school: 'Meridian Trust' },
]

function Tick() { return <Check size={14} style={{ color: '#0D9488' }} /> }
function Cross() { return <X size={14} style={{ color: '#EF4444' }} /> }

export default function SSOPage() {
  return (
    <div style={{ backgroundColor: '#07080F' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1040 40%, #0d2a2a 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #6C3FC5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0D9488 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-8" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            🇬🇧 UK-First · OneRoster Certified
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6" style={{ color: '#F9FAFB', lineHeight: 1.1 }}>
            Your School. Your Tools.<br />
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Zero Friction.</span>
          </h1>
          <p className="text-lg md:text-xl mx-auto mb-10" style={{ color: '#9CA3AF', maxWidth: 680, lineHeight: 1.7 }}>
            Lumio connects directly to Google Workspace, Microsoft 365, Arbor, SIMS and Bromcom. Staff sign in with one click. Pupil data syncs automatically. No middleware. No extra cost.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link href="/signup?portal=schools" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Start Free Trial <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all" style={{ color: '#F9FAFB', border: '1px solid #374151' }}>
              See it in action
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {INTEGRATIONS.map(name => (
              <span key={name} className="rounded-full px-4 py-1.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#D1D5DB', border: '1px solid rgba(255,255,255,0.1)' }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── COST SAVINGS ─────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>
            Schools Are Wasting Thousands on Middleware They Don&apos;t Need
          </h2>
          <p className="text-center text-base mb-14 mx-auto" style={{ color: '#9CA3AF', maxWidth: 600 }}>
            See what UK schools actually spend just to move data between systems.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Card 1 — Middleware cost */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#EF4444' }}>Typical MIS Middleware Cost</p>
              <p className="text-4xl font-black mb-6" style={{ color: '#EF4444' }}>£4,200<span className="text-lg">/year</span></p>
              <div className="space-y-3 mb-6">
                {[['Wonde connector', '£1,200/yr'], ['Clever alternative', '£1,800/yr'], ['Manual data entry (staff time)', '£1,200/yr']].map(([label, cost]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span style={{ color: '#9CA3AF' }}>{label}</span>
                    <span className="font-semibold" style={{ color: '#D1D5DB' }}>{cost}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: '#4B5563' }}>Per school. Every year. Just to move data around.</p>
            </div>

            {/* Card 2 — Lumio (highlighted) */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '2px solid #0D9488' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#0D9488' }}>Lumio SSO & Rostering</p>
              <p className="text-4xl font-black mb-6" style={{ color: '#0D9488' }}>£0<span className="text-lg"> extra</span></p>
              <div className="space-y-3 mb-6">
                {['Google Workspace SSO included', 'Microsoft 365 SSO included', 'Arbor/SIMS/Bromcom sync included', 'OneRoster certified included'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check size={14} style={{ color: '#0D9488', flexShrink: 0 }} />
                    <span style={{ color: '#D1D5DB' }}>{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold" style={{ color: '#0D9488' }}>All included in your Lumio subscription.</p>
            </div>

            {/* Card 3 — Time saved */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#22C55E' }}>Staff Hours Recovered</p>
              <p className="text-4xl font-black mb-6" style={{ color: '#22C55E' }}>3 hrs<span className="text-lg">/week</span></p>
              <div className="space-y-3 mb-6">
                {['No manual CSV imports', 'No duplicate data entry', 'No login helpdesk tickets', 'No MIS export schedules'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                    <span style={{ color: '#D1D5DB' }}>{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: '#4B5563' }}>Per school. That&apos;s 150+ hours per year back.</p>
            </div>
          </div>

          {/* Stat bar */}
          <div className="rounded-2xl px-8 py-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.1) 0%, rgba(108,63,197,0.1) 100%)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <p className="text-lg md:text-xl font-bold" style={{ color: '#F9FAFB' }}>
              Schools switching to Lumio save an average of <span style={{ color: '#0D9488' }}>£4,200/year</span> and <span style={{ color: '#0D9488' }}>156 staff hours</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Set Up in 15 Minutes. Works Forever After.</h2>
          <p className="text-center text-base mb-16 mx-auto" style={{ color: '#9CA3AF', maxWidth: 500 }}>Three steps. No IT consultants. No middleware subscriptions.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Connect your MIS', desc: 'Link your Arbor, SIMS or Bromcom account. Lumio pulls your pupil rolls, class lists, year groups and staff records automatically.', icon: RefreshCw },
              { num: '2', title: 'Enable SSO', desc: 'Turn on Google Workspace or Microsoft 365 sign-in. Staff use their existing school email. No new passwords. No helpdesk calls.', icon: Lock },
              { num: '3', title: "You're done", desc: 'Pupil data stays in sync daily. New starters appear automatically. Leavers are removed. Your dashboard is always current.', icon: Check },
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
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Everything Included. Nothing Extra.</h2>
          <p className="text-center text-base mb-14 mx-auto" style={{ color: '#9CA3AF', maxWidth: 500 }}>Every feature ships with every plan. No premium tiers for basic integrations.</p>

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

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-14" style={{ color: '#F9FAFB' }}>How Lumio Compares</h2>

          <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid #1F2937' }}>
            <table className="w-full text-sm" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: '#9CA3AF', backgroundColor: '#111318' }}>Feature</th>
                  <th className="px-4 py-3 font-bold text-center" style={{ color: '#0D9488', backgroundColor: 'rgba(13,148,136,0.08)' }}>Lumio</th>
                  <th className="px-4 py-3 font-semibold text-center" style={{ color: '#6B7280', backgroundColor: '#111318' }}>Wonde</th>
                  <th className="px-4 py-3 font-semibold text-center" style={{ color: '#6B7280', backgroundColor: '#111318' }}>Clever</th>
                  <th className="px-4 py-3 font-semibold text-center" style={{ color: '#6B7280', backgroundColor: '#111318' }}>ClassLink</th>
                  <th className="px-4 py-3 font-semibold text-center" style={{ color: '#6B7280', backgroundColor: '#111318' }}>Manual</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => {
                  const isLast = row.feature === 'Extra Cost'
                  return (
                    <tr key={i} style={{ borderBottom: i < COMPARISON.length - 1 ? '1px solid #1F2937' : 'none' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: '#D1D5DB' }}>{row.feature}</td>
                      <td className="px-4 py-3 text-center font-bold" style={{ backgroundColor: 'rgba(13,148,136,0.04)' }}>
                        {isLast ? <span style={{ color: '#0D9488' }}>{row.lumio}</span> : typeof row.lumio === 'boolean' ? (row.lumio ? <Tick /> : <Cross />) : row.lumio}
                      </td>
                      {['wonde', 'clever', 'classlink', 'manual'].map(col => {
                        const val = (row as any)[col]
                        return (
                          <td key={col} className="px-4 py-3 text-center">
                            {isLast ? <span style={{ color: '#6B7280' }}>{val}</span> : typeof val === 'boolean' ? (val ? <Tick /> : <Cross />) : <span style={{ color: '#6B7280' }}>{val}</span>}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-14" style={{ color: '#F9FAFB' }}>What School Leaders Are Saying</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-sm flex-1 mb-6" style={{ color: '#D1D5DB', lineHeight: 1.8 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{t.role}, {t.school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ borderTop: '1px solid #1F2937' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(13,148,136,0.08) 0%, transparent 70%)' }} />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Ready to Stop Paying for Middleware?</h2>
          <p className="text-base mb-10 mx-auto" style={{ color: '#9CA3AF', maxWidth: 520, lineHeight: 1.7 }}>
            Join schools across the UK who&apos;ve switched to Lumio and reclaimed their budget — and their time.
          </p>
          <Link href="/signup?portal=schools" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all hover:opacity-90" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Start Your Free 14-Day Trial <ArrowRight size={18} />
          </Link>
          <p className="text-xs mt-6" style={{ color: '#4B5563' }}>No credit card. No middleware fees. No faff.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Google Workspace', 'Microsoft 365', 'Arbor', 'SIMS', 'Bromcom'].map(name => (
              <span key={name} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid #1F2937' }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
