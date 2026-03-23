'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Check, X, Play, Zap, Shield, Clock,
  Users, GitBranch, Star, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── BookTrialModal ────────────────────────────────────────────────────────────

function BookTrialModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]         = useState<'form' | 'sent'>('form')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState({ name: '', email: '', company: '', gdpr: false })

  function set(k: keyof typeof form, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.gdpr) { setError('Please accept the terms to continue.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/demo/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Something went wrong. Please try again.')
      }
      setStep('sent')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: '1px solid #1F2937' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>
              {step === 'form' ? 'Start your free trial' : 'Check your email'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
              {step === 'form' ? '14 days free. No credit card. Auto-deleted after.' : `We've sent a link to ${form.email}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors"
            style={{ color: '#6B7280' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
            <X size={18} />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={submit} className="p-6 space-y-4">
            {/* Fields */}
            {([
              { name: 'name',    label: 'Your name',    type: 'text',  placeholder: 'Sarah Chen'          },
              { name: 'email',   label: 'Work email',   type: 'email', placeholder: 'sarah@acmecorp.com'   },
              { name: 'company', label: 'Company name', type: 'text',  placeholder: 'Acme Corp'            },
            ] as const).map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>{f.label}</label>
                <input
                  type={f.type}
                  required
                  value={form[f.name]}
                  onChange={e => set(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-sm transition-colors"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')}
                />
              </div>
            ))}

            {/* GDPR consent */}
            <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" className="sr-only"
                    checked={form.gdpr} onChange={e => set('gdpr', e.target.checked)} />
                  <div className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: form.gdpr ? '#0D9488' : 'transparent',
                      borderColor: form.gdpr ? '#0D9488' : '#374151',
                    }}>
                    {form.gdpr && <Check size={10} style={{ color: '#fff' }} />}
                  </div>
                </div>
                <span className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                  I agree to Lumio&apos;s{' '}
                  <Link href="/terms" className="underline" style={{ color: '#0D9488' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="underline" style={{ color: '#0D9488' }}>Privacy Policy</Link>.
                </span>
              </label>

              <div className="text-xs space-y-1.5" style={{ color: '#6B7280' }}>
                <p>
                  <span style={{ color: '#9CA3AF' }}>14-day trial:</span>{' '}
                  Your demo workspace and all data will be permanently deleted 14 days after creation. You&apos;ll receive a warning email on day 12.
                </p>
                <p>
                  <span style={{ color: '#9CA3AF' }}>AI processing:</span>{' '}
                  This product uses Claude by Anthropic to power automation features. By continuing, you acknowledge that demo content may be processed by Anthropic in accordance with their{' '}
                  <a href="https://www.anthropic.com/policies/usage" target="_blank" rel="noreferrer"
                    className="underline" style={{ color: '#0D9488' }}>usage policies</a>.
                </p>
                <p>
                  <span style={{ color: '#9CA3AF' }}>Data location:</span>{' '}
                  All data is stored in EU data centres (AWS eu-west-1) and processed under GDPR.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sending magic link…' : 'Start free trial →'}
            </button>
          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
              <Check size={24} style={{ color: '#0D9488' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#F9FAFB' }}>Magic link sent</p>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                Click the link in your email to open your trial workspace. It expires in 1 hour.
              </p>
            </div>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Can&apos;t see it? Check your spam folder or{' '}
              <button onClick={() => setStep('form')} className="underline" style={{ color: '#0D9488' }}>
                try again
              </button>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TellMeMoreModal ───────────────────────────────────────────────────────────

function TellMeMoreModal({ onClose, onStartTrial }: { onClose: () => void; onStartTrial: () => void }) {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/demo/tell-me-more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch { /* silent */ }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* Left — info + email capture */}
          <div className="p-8 flex flex-col gap-5">
            <button onClick={onClose} className="self-end p-1 -mt-2 -mr-2"
              style={{ color: '#6B7280' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
              <X size={18} />
            </button>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>See it in action</h2>
              <p className="text-sm mt-1.5" style={{ color: '#9CA3AF' }}>
                3-minute walkthrough of Lumio running for a real SMB — new customer onboarded, invoice chased, support ticket routed, all automatically.
              </p>
            </div>
            <ul className="space-y-2.5">
              {[
                'New customer → every system updated in 90 seconds',
                'Invoice overdue → Claude drafts the chase email automatically',
                'New hire → IT, HR, and payroll all provisioned before day one',
                '150 workflows shown, any one activatable in 5 minutes',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: '#9CA3AF' }}>
                  <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#0D9488' }} />
                  {item}
                </li>
              ))}
            </ul>
            {!sent ? (
              <form onSubmit={submit} className="space-y-3">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{ backgroundColor: '#07080F', border: '1px solid #1F2937', color: '#F9FAFB' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#0D9488')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1F2937')} />
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB', opacity: loading ? 0.7 : 1 }}>
                  Send me the link
                </button>
              </form>
            ) : (
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <p className="text-sm font-medium" style={{ color: '#0D9488' }}>Video link sent ✓</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Check your inbox</p>
              </div>
            )}
            <button onClick={onStartTrial} className="text-sm font-medium" style={{ color: '#0D9488' }}>
              Skip the video — start your trial now →
            </button>
          </div>

          {/* Right — video embed */}
          <div className="flex items-center justify-center" style={{ backgroundColor: '#07080F', borderLeft: '1px solid #1F2937' }}>
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-3"
              style={{ color: '#6B7280' }}>
              {/* Replace this div with an <iframe> when your Loom/Vimeo is ready */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}>
                <Play size={24} style={{ color: '#0D9488' }} />
              </div>
              <p className="text-sm">Video walkthrough</p>
              <p className="text-xs">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
