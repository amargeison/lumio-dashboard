'use client'

import { useState } from 'react'
import { Check, CalendarDays, Clock, Users, MessageSquare, Sparkles, Zap, Shield } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const WHAT_TO_EXPECT = [
  { icon: Clock,         title: '30 minutes. No fluff.', desc: 'We respect your time. You\'ll see the platform live, not a slide deck.' },
  { icon: Users,         title: 'Your use case, not ours.', desc: 'Tell us your departments and pain points. We\'ll walk through workflows relevant to your team.' },
  { icon: MessageSquare, title: 'An honest conversation.', desc: 'If Lumio isn\'t right for you, we\'ll tell you. We\'re not here to close a deal — we\'re here to solve a problem.' },
  { icon: CalendarDays,  title: 'Quick follow-up.', desc: 'Summary email sent within 24 hours with everything we discussed and clear next steps.' },
]

const USE_CASES = [
  'New customer onboarding automation',
  'HR & people operations',
  'Invoice chasing & accounts',
  'Sales pipeline & CRM automation',
  'Customer success & churn prevention',
  'Support ticket triage & SLA management',
  'Marketing & MQL handoff',
  'IT provisioning & access management',
  'General platform overview',
  'Something else',
]

const WHAT_YOU_LL_SEE = [
  { emoji: '⚡', text: 'Live workflow run: new customer onboarded in 90 seconds' },
  { emoji: '🧠', text: 'Claude scoring a lead and drafting a personalised follow-up' },
  { emoji: '📊', text: 'The unified department dashboard — real data, not mockups' },
  { emoji: '🔌', text: 'How integrations connect in a few clicks, no developer needed' },
  { emoji: '🚨', text: 'RAG health scoring and churn alerts in action' },
  { emoji: '📋', text: 'The workflow library — 47+ ready to activate' },
]

const TESTIMONIAL_STYLE_QUOTES = [
  {
    quote: 'We\'d been building the same Zapier workflows over and over for three years. Lumio replaced all of them in a single afternoon.',
    role: 'Head of Operations, UK Publishing Group',
  },
  {
    quote: 'The invoice chasing alone has saved us four hours a week. And it doesn\'t feel robotic — customers have actually said our follow-ups sound more personal than before.',
    role: 'Finance Director, SaaS Platform',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [form, setForm] = useState({
    name: '', email: '', company: '', role: '', teamSize: '', useCase: '', message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0D0E16',
    border: '1px solid #1F2937',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#F9FAFB',
    fontSize: 14,
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#9CA3AF',
    marginBottom: 6,
  }

  function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement> & { name: string }) {
    return (
      <input
        {...props}
        style={inputBase}
        onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }}
        onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
      />
    )
  }

  return (
    <div style={{ color: '#F9FAFB' }} className="pt-28 pb-20">

      {/* Header */}
      <section className="mx-auto max-w-4xl px-6 text-center mb-16">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Book a demo</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">See Lumio live. In 30 minutes.</h1>
        <p className="text-lg" style={{ color: '#9CA3AF', maxWidth: 560, margin: '0 auto' }}>
          No slide decks. No generic tour. We'll walk you through the platform with workflows relevant to your team — live, with real data.
        </p>
      </section>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

          {/* ── Left column ── */}
          <div className="space-y-6">

            {/* What to expect */}
            <div className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <h2 className="text-base font-semibold mb-6" style={{ color: '#F9FAFB' }}>What to expect</h2>
              <div className="space-y-5">
                {WHAT_TO_EXPECT.map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
                        <Icon size={16} style={{ color: '#0D9488' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-0.5" style={{ color: '#E5E7EB' }}>{item.title}</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* What you'll see */}
            <div className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <h2 className="text-base font-semibold mb-5" style={{ color: '#F9FAFB' }}>What you'll see in the demo</h2>
              <div className="space-y-3">
                {WHAT_YOU_LL_SEE.map(item => (
                  <div key={item.emoji} className="flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5">{item.emoji}</span>
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Social proof quotes */}
            <div className="space-y-4">
              {TESTIMONIAL_STYLE_QUOTES.map((q, i) => (
                <div key={i} className="rounded-xl p-6" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                  <blockquote className="text-sm leading-relaxed italic mb-3"
                    style={{ color: '#9CA3AF', borderLeft: '3px solid #0D9488', paddingLeft: 14 }}>
                    "{q.quote}"
                  </blockquote>
                  <p className="text-xs" style={{ color: '#4B5563' }}>{q.role}</p>
                </div>
              ))}
            </div>

            {/* Trust signals */}
            <div className="rounded-xl p-6" style={{ backgroundColor: '#0A0B12', border: '1px solid #1F2937' }}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: Shield,   text: 'GDPR compliant' },
                  { icon: Zap,      text: 'Live in 30 minutes' },
                  { icon: Sparkles, text: 'AI-powered' },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.text} className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
                      <Icon size={14} style={{ color: '#0D9488' }} />
                      {item.text}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Calendly placeholder */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
              <div className="px-5 py-3.5 flex items-center gap-2"
                style={{ backgroundColor: '#0D0E16', borderBottom: '1px solid #1F2937' }}>
                <CalendarDays size={15} style={{ color: '#0D9488' }} />
                <span className="text-sm font-medium">Pick a time</span>
                <span className="ml-auto text-xs" style={{ color: '#4B5563' }}>Alternatively, fill in the form →</span>
              </div>
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center"
                style={{ backgroundColor: '#09090F', minHeight: 220 }}>
                <CalendarDays size={36} style={{ color: '#1F2937', marginBottom: 14 }} />
                <p className="text-sm font-medium mb-2" style={{ color: '#4B5563' }}>Calendar integration coming soon</p>
                <p className="text-xs leading-relaxed" style={{ color: '#374151', maxWidth: 300 }}>
                  Fill in the form on the right and we'll respond within one business day to confirm a slot that works for you.
                </p>
              </div>
            </div>

          </div>

          {/* ── Right column — form ── */}
          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center rounded-xl p-16 h-full"
                style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)' }}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full mb-6"
                  style={{ backgroundColor: 'rgba(13,148,136,0.2)' }}>
                  <Check size={32} style={{ color: '#0D9488' }} />
                </div>
                <h2 className="text-2xl font-bold mb-3">You're in the queue!</h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#9CA3AF', maxWidth: 360 }}>
                  We've received your request and will reply within one business day to confirm a time that works.
                </p>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  In the meantime, explore the{' '}
                  <a href="/product" style={{ color: '#0D9488' }}>product page</a>{' '}
                  to see what you'll be walking through.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-xl p-8"
                style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <h2 className="text-lg font-semibold mb-2">Request your demo</h2>
                <p className="text-sm mb-7" style={{ color: '#6B7280' }}>
                  Tell us a bit about you and your team. We'll tailor the demo accordingly.
                </p>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label style={labelStyle}>Full name *</label>
                    <input type="text" name="name" required value={form.name}
                      onChange={handleChange} placeholder="Jane Smith"
                      style={inputBase}
                      onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Work email *</label>
                    <input type="email" name="email" required value={form.email}
                      onChange={handleChange} placeholder="jane@company.com"
                      style={inputBase}
                      onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Company *</label>
                    <input type="text" name="company" required value={form.company}
                      onChange={handleChange} placeholder="Acme Consulting Ltd"
                      style={inputBase}
                      onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Your role *</label>
                    <input type="text" name="role" required value={form.role}
                      onChange={handleChange} placeholder="Head of Operations"
                      style={inputBase}
                      onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label style={labelStyle}>Team size</label>
                  <select name="teamSize" value={form.teamSize} onChange={handleChange}
                    style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select team size...</option>
                    <option>1–10 people</option>
                    <option>11–50 people</option>
                    <option>51–200 people</option>
                    <option>201–500 people</option>
                    <option>500+ people</option>
                  </select>
                </div>

                <div className="mt-5">
                  <label style={labelStyle}>What are you most interested in? *</label>
                  <select name="useCase" required value={form.useCase} onChange={handleChange}
                    style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select a focus area...</option>
                    {USE_CASES.map(uc => (
                      <option key={uc} value={uc}>{uc}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-5">
                  <label style={labelStyle}>Anything else you'd like us to know?</label>
                  <textarea name="message" rows={4} value={form.message}
                    onChange={handleChange}
                    placeholder="e.g. We use HubSpot and Xero and want to automate our customer onboarding. We're a team of 25."
                    style={{ ...inputBase, resize: 'vertical' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#0D9488' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#1F2937' }}
                  />
                </div>

                {/* Current manual pain — extra context */}
                <div className="mt-5 rounded-lg p-4"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>
                    Help us tailor your demo
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                    The more context you give us about your current tools (HubSpot, Xero, Slack, etc.) and biggest pain points, the more useful we can make the 30 minutes.
                  </p>
                </div>

                <button type="submit"
                  className="w-full mt-6 py-4 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}>
                  Request a Demo →
                </button>

                <p className="text-xs text-center mt-4" style={{ color: '#4B5563' }}>
                  We'll reply within one business day. No spam, ever. No pushy follow-ups.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
