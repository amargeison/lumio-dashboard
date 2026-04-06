'use client'

import Link from 'next/link'
import { ArrowRight, AlertTriangle, Check } from 'lucide-react'

const PAIN_POINTS = [
  "You're paying for 4 systems that don't talk to each other",
  "Your MIS, HR, comms and safeguarding tools all need separate logins",
  "Every 3 years the contract ends and you start again from scratch",
  "You raised a support ticket. It's been 'on the roadmap' for 2 years.",
  "You asked for one small change. They blamed the dev team.",
  "Your staff spend more time on admin than on teaching",
]

const PROMISES = [
  "We actually listen — if something doesn't work, we fix it. Not 'roadmap it'.",
  "One login. Everything in one place — MIS sync, HR, safeguarding, communications, SEND, curriculum, finance, governors.",
  "No rip-off pricing — transparent, flat fee, no per-pupil charges that punish you for growing",
  "Built with teachers and school leaders, not just for them",
  "If you don't like something, tell us. We'll change it. That's a promise.",
]

const FEATURES = [
  { icon: '👥', title: 'Staff HR & Onboarding',            desc: 'Contracts, DBS, induction, leave, payroll — all in one place.' },
  { icon: '🛡️', title: 'Safeguarding & SEND',               desc: 'Live safeguarding log, SEND provision mapping, DSL escalation.' },
  { icon: '📣', title: 'Parent & Governor Comms',          desc: 'Bulk messaging, newsletters, governor reports — done in minutes.' },
  { icon: '📚', title: 'Curriculum Planning',              desc: 'Long-term, medium-term and weekly planning, linked to assessment.' },
  { icon: '💷', title: 'Finance & Budgeting',              desc: 'Budget tracking, invoices, supplier payments, GAG reconciliation.' },
  { icon: '🔄', title: 'MIS Integration',                   desc: 'Two-way sync with Arbor, SIMS and Bromcom. No double-entry.' },
  { icon: '✅', title: 'Ofsted Readiness',                  desc: 'Live self-evaluation, evidence locker, deep-dive prep in one click.' },
  { icon: '🎙️', title: 'AI Morning Briefing',               desc: 'Voice-powered morning roundup for headteachers — 60 seconds flat.' },
]

const PLANS = [
  { name: 'Primary',   price: '£299',  per: '/mo', desc: 'Everything included. No per-pupil charge.' },
  { name: 'Secondary', price: '£499',  per: '/mo', desc: 'Everything included. No per-pupil charge.', featured: true },
  { name: 'MAT',       price: 'Call us', per: '',  desc: 'Multi-academy trusts — tailored to your size.' },
]

export default function SchoolsAboutPage() {
  return (
    <div style={{ backgroundColor: '#07080F' }}>
      {/* Hero */}
      <section className="pt-28 pb-20" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0d2a2a 50%, #0f172a 100%)' }}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-8 uppercase tracking-widest" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            Lumio for Schools
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6" style={{ color: '#F9FAFB', lineHeight: 1.05 }}>
            One platform. Every tool your school actually needs.
          </h1>
          <p className="text-lg md:text-xl mx-auto max-w-2xl" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>
            We built Lumio for Schools because we got fed up watching schools pay through the nose for six different portals — then being told to wait 18 months for a fix that never comes.
          </p>
        </div>
      </section>

      {/* Problem: Sound familiar? */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold mb-4 uppercase tracking-widest" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={12} /> The reality
            </div>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#F9FAFB' }}>Sound familiar?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAIN_POINTS.map(p => (
              <div key={p} className="rounded-2xl p-6 flex items-start gap-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <span className="text-xl shrink-0" style={{ color: '#F87171' }}>✕</span>
                <p className="text-base" style={{ color: '#E5E7EB', lineHeight: 1.6 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution: We do things differently */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold mb-4 uppercase tracking-widest" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
              Our promise
            </div>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#F9FAFB' }}>We do things differently</h2>
          </div>
          <div className="space-y-4">
            {PROMISES.map(p => (
              <div key={p} className="rounded-2xl p-6 flex items-start gap-4" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.2)' }}>
                <div className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 28, height: 28, backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>
                  <Check size={16} strokeWidth={3} />
                </div>
                <p className="text-base" style={{ color: '#E5E7EB', lineHeight: 1.6 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid: Everything in one place */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: '#F9FAFB' }}>Everything. In one place.</h2>
            <p className="text-base" style={{ color: '#9CA3AF' }}>No more tab-juggling. No more six different logins. Just one platform.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <span className="text-3xl block mb-4">{f.icon}</span>
                <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.title}</h3>
                <p className="text-sm" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-8" style={{ color: '#6B7280' }}>MIS integrations: Arbor · SIMS · Bromcom</p>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color: '#F9FAFB' }}>Flat fee. No surprises. No per-pupil charges.</h2>
            <p className="text-base" style={{ color: '#9CA3AF' }}>One price. Every feature. No upsells.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className="rounded-2xl p-8"
                style={{
                  backgroundColor: '#111318',
                  border: plan.featured ? '1px solid rgba(108,63,197,0.6)' : '1px solid #1F2937',
                  position: 'relative',
                }}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
                    Most popular
                  </div>
                )}
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: plan.featured ? '#A78BFA' : '#9CA3AF' }}>{plan.name}</h3>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black" style={{ color: '#F9FAFB' }}>{plan.price}</span>
                  {plan.per && <span className="text-sm" style={{ color: '#9CA3AF' }}>{plan.per}</span>}
                </div>
                <p className="text-sm" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>{plan.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-10 font-semibold" style={{ color: '#0D9488' }}>
            Cancel anytime. No 3-year lock-in. No exit fees.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>
            Book a free 30-minute demo
          </h2>
          <p className="text-base md:text-lg mb-10" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>
            We&apos;ll show you everything — no sales pitch, no pressure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/demo/schools/oakridge-primary"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold transition-colors"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            >
              Book my demo <ArrowRight size={16} />
            </Link>
            <Link
              href="/signup?portal=schools"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold transition-colors"
              style={{ color: '#F9FAFB', border: '1px solid #374151' }}
            >
              Or start a free trial — no card required
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
