'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const VALUES = [
  { emoji: '🇬🇧', title: 'UK-First', desc: 'Built around Ofsted, the SEND Code of Practice and DfE requirements. Not adapted from a US product.' },
  { emoji: '🔒', title: 'Your Data Stays in the UK', desc: 'All data stored in AWS eu-west-1 London. GDPR compliant. DPA ready.' },
  { emoji: '💷', title: 'No Per-Pupil Fees', desc: 'One flat monthly fee per school. No surprises. No per-user or per-pupil charges.' },
  { emoji: '🎙️', title: 'AI That Actually Helps', desc: 'Not a chatbot bolted on. Voice-powered briefings, Ofsted mode and smart workflows built into every part of the platform.' },
]

const STATS = [
  { value: '23', label: 'Schools' },
  { value: '94%', label: 'Avg attendance tracked' },
  { value: '0', label: 'Data breaches' },
  { value: '14-day', label: 'Free trial' },
]

export default function SchoolsAboutPage() {
  return (
    <div style={{ backgroundColor: '#07080F' }}>
      {/* Hero */}
      <section className="pt-28 pb-20 text-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0d2a2a 50%, #0f172a 100%)' }}>
        <div className="mx-auto max-w-3xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-8" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            About Lumio Schools
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6" style={{ color: '#F9FAFB', lineHeight: 1.1 }}>
            Built for schools that deserve better tools
          </h1>
        </div>
      </section>

      {/* Mission */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-lg leading-relaxed" style={{ color: '#D1D5DB', lineHeight: 1.8 }}>
            We built Lumio Schools because we saw how much time school leaders were spending on admin instead of pupils. SIMS was built in the 80s. Arbor is better but still not built around how schools actually work. We started from scratch — with safeguarding, SEND and Ofsted baked in from day one.
          </p>
          <p className="text-lg leading-relaxed mt-6" style={{ color: '#D1D5DB', lineHeight: 1.8 }}>
            Every feature in Lumio Schools was designed by talking to headteachers, SENCOs, office managers and DSLs. We didn&apos;t guess what schools need — we asked. And then we built it.
          </p>
        </div>
      </section>

      {/* Values */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-2xl font-black text-center mb-12" style={{ color: '#F9FAFB' }}>What we stand for</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <span className="text-3xl block mb-4">{v.emoji}</span>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#F9FAFB' }}>{v.title}</h3>
                <p className="text-sm" style={{ color: '#9CA3AF', lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black" style={{ color: '#0D9488' }}>{s.value}</p>
                <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-black mb-6" style={{ color: '#F9FAFB' }}>Built by people who understand schools</h2>
          <p className="text-base" style={{ color: '#9CA3AF', lineHeight: 1.8 }}>
            Lumio was founded with a simple belief: schools deserve software that works as hard as their staff do. Our team combines education technology expertise with real-world experience in UK schools — from safeguarding compliance to SEND provision mapping. We&apos;re a small, focused team building the platform we wish existed when we were working in schools ourselves.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-black mb-4" style={{ color: '#F9FAFB' }}>See Lumio Schools in action</h2>
          <p className="text-base mb-8" style={{ color: '#9CA3AF' }}>Try the full platform — no credit card, no sales call, no commitment.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demo/schools/oakridge-primary" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              Try the demo <ArrowRight size={16} />
            </Link>
            <Link href="/signup?portal=schools" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ color: '#F9FAFB', border: '1px solid #374151' }}>
              Start free trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
