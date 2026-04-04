'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRight, Check, Play, Zap, Shield, Clock,
  Users, GitBranch, Star, ChevronDown, ChevronUp,
} from 'lucide-react'
import BookTrialModal from '@/app/(website)/components/BookTrialModal'
import TellMeMoreModal from '@/app/(website)/components/TellMeMoreModal'

/** Reads ?signup=true and auto-opens the trial modal */
function AutoOpenSignup({ onOpen }: { onOpen: () => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('signup') === 'true') onOpen()
  }, [searchParams, onOpen])
  return null
}

// ─── FAQ items ─────────────────────────────────────────────────────────────────

const FAQS = [
  { q: 'Is it really free for 14 days?', a: 'Yes. No credit card required. Your workspace is fully functional for 14 days. On day 12 we\'ll email you to let you know it\'s expiring. On day 14, everything is permanently deleted.' },
  { q: 'What happens to my data after 14 days?', a: 'It\'s permanently and automatically deleted from all our systems. No manual action needed on your part. This is handled by an automated nightly cleanup process.' },
  { q: 'Do I need to connect my real tools?', a: 'No. Your trial workspace comes pre-loaded with realistic demo data for all the departments you select. You can connect real tools if you want to, but it\'s entirely optional.' },
  { q: 'How does the AI part work?', a: 'Lumio uses Claude by Anthropic to power the AI steps inside workflows — writing emails, scoring leads, generating content. In the trial, this runs on demo data only. See our privacy notice for data processing details.' },
  { q: 'Can I invite my team?', a: 'Yes — you can invite up to 5 team members during the onboarding step. They\'ll each get a magic link to join your trial workspace.' },
  { q: 'What happens if I want to keep going after 14 days?', a: 'Upgrade before day 14 and your workspace, workflows, and data all carry over. No need to start again.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoLandingPage() {
  const [showTrial, setShowTrial]       = useState(false)
  const [showTellMore, setShowTellMore] = useState(false)
  const [openFaq, setOpenFaq]           = useState<number | null>(null)

  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB', minHeight: '100vh' }}>
      {/* Auto-open signup from ?signup=true */}
      <Suspense fallback={null}>
        <AutoOpenSignup onOpen={() => setShowTrial(true)} />
      </Suspense>
      {/* Modals */}
      {showTrial   && <BookTrialModal onClose={() => setShowTrial(false)} />}
      {showTellMore && (
        <TellMeMoreModal
          onClose={() => setShowTellMore(false)}
          onStartTrial={() => { setShowTellMore(false); setShowTrial(true) }}
        />
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: 'rgba(7,8,15,0.95)', borderBottom: '1px solid #1F2937', backdropFilter: 'blur(12px)' }}>
        <Link href="/home" className="text-lg font-black tracking-tight" style={{ color: '#F9FAFB' }}>
          Lumio
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm" style={{ color: '#9CA3AF' }}>Pricing</Link>
          <button onClick={() => setShowTrial(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Start free trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8"
          style={{ backgroundColor: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.3)', color: '#0D9488' }}>
          <Zap size={12} /> 14-day free trial · No credit card · Auto-deleted after
        </div>
        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
          See Lumio running<br />
          <span style={{ color: '#0D9488' }}>for your business</span><br />
          in 5 minutes.
        </h1>
        <p className="text-lg mb-10 mx-auto max-w-xl" style={{ color: '#9CA3AF' }}>
          Pick your departments. We&apos;ll build your personalised demo workspace — 150 workflows, real AI, realistic data.
          Try it yourself before you talk to anyone.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => setShowTrial(true)}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Start free trial <ArrowRight size={16} />
          </button>
          <button onClick={() => setShowTellMore(true)}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: 'transparent', border: '1px solid #1F2937', color: '#9CA3AF' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#374151'; (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1F2937'; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}>
            <Play size={14} /> See how it works
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill="#F59E0B" style={{ color: '#F59E0B' }} />
          ))}
          <span className="text-sm ml-1.5" style={{ color: '#9CA3AF' }}>
            Trusted by 200+ UK businesses
          </span>
        </div>
      </section>

      {/* What's included */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-12" style={{ color: '#4B5563' }}>
            What&apos;s in your free trial
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: GitBranch,
                title: '150 workflows, all active',
                desc: 'Every workflow in your trial is pre-configured and ready. See them run, not just read about them.',
              },
              {
                icon: Users,
                title: 'Your departments, your data',
                desc: 'Pick the departments that matter to your team. Your workspace is seeded with realistic data for each one.',
              },
              {
                icon: Zap,
                title: 'Real AI, real outputs',
                desc: 'Claude runs inside every AI workflow — generating emails, scoring leads, summarising tickets. All on your demo data.',
              },
              {
                icon: Shield,
                title: 'GDPR-safe and auto-deleted',
                desc: 'All data is stored in EU data centres. Your workspace is automatically deleted after 14 days — no manual cleanup needed.',
              },
              {
                icon: Clock,
                title: 'Set up in 5 minutes',
                desc: 'Logo, departments, integrations, team invites — the onboarding wizard takes 5 minutes. Then you\'re in.',
              },
              {
                icon: Users,
                title: 'Invite up to 5 teammates',
                desc: 'Your whole leadership team can explore the same workspace. Everyone gets a magic link, no password needed.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(13,148,136,0.1)' }}>
                  <Icon size={16} style={{ color: '#0D9488' }} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: '#F9FAFB' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-center mb-12" style={{ color: '#4B5563' }}>
          How it works
        </p>
        <div className="space-y-0">
          {[
            { n: '01', title: 'Fill in the form', desc: 'Name, email, company name. That\'s it. Takes 30 seconds.' },
            { n: '02', title: 'Click the magic link', desc: 'We email you a secure link. No password to create or remember.' },
            { n: '03', title: 'Pick your departments', desc: 'Select the parts of your business you want to see automated. HR, Sales, Operations, Finance — whatever\'s relevant.' },
            { n: '04', title: 'Explore your workspace', desc: 'Your personalised dashboard is ready. Real workflows, real AI, your company\'s name at the top.' },
          ].map(({ n, title, desc }, i) => (
            <div key={n} className="flex gap-5 pb-8">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}>
                  {n}
                </div>
                {i < 3 && <div className="flex-1 w-px mt-2" style={{ backgroundColor: '#1F2937' }} />}
              </div>
              <div className="pb-2">
                <h3 className="font-semibold mb-1" style={{ color: '#F9FAFB' }}>{title}</h3>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              { quote: 'We\'d been building the same Zapier workflows over and over for three years. Lumio replaced all of them in a single afternoon.', role: 'Head of Operations, UK Publishing Group' },
              { quote: 'The invoice chasing alone has saved us four hours a week. And it doesn\'t feel robotic — customers have actually said our follow-ups sound more personal than before.', role: 'Finance Director, SaaS Platform' },
            ].map(t => (
              <div key={t.role} className="rounded-xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#F59E0B" style={{ color: '#F59E0B' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#D1D5DB' }}>&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-center mb-10" style={{ color: '#4B5563' }}>
          Common questions
        </p>
        <div className="space-y-0">
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid #1F2937' }}>
              <button
                className="w-full flex items-center justify-between py-4 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span className="text-sm font-medium pr-4" style={{ color: '#F9FAFB' }}>{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp size={16} style={{ color: '#6B7280', flexShrink: 0 }} />
                  : <ChevronDown size={16} style={{ color: '#6B7280', flexShrink: 0 }} />}
              </button>
              {openFaq === i && (
                <p className="pb-4 text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to see it for yourself?</h2>
          <p className="text-base mb-8" style={{ color: '#9CA3AF' }}>
            14 days free. No credit card. Auto-deleted after. No sales call required.
          </p>
          <button onClick={() => setShowTrial(true)}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Start free trial <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs" style={{ borderTop: '1px solid #1F2937', color: '#6B7280' }}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy" style={{ color: '#6B7280' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: '#6B7280' }}>Terms of Service</Link>
          <span>© 2026 Lumio. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
