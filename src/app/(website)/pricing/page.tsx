'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Sparkles, Zap } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: 'Starter',
    monthlyPrice: 599,
    tagline: 'For small teams getting started with automation.',
    highlight: false,
    badge: null,
    features: [
      { text: 'Up to 3 departments', included: true },
      { text: '20 active workflows', included: true },
      { text: '5 integrations', included: true },
      { text: 'Read-only dashboard', included: true },
      { text: '2,000 workflow runs/mo', included: true },
      { text: 'Email support (2-day SLA)', included: true },
      { text: 'CSV exports', included: true },
      { text: 'AI-powered steps (Claude)', included: false },
      { text: 'API access', included: false },
      { text: 'Custom branding', included: false },
      { text: 'SSO & SCIM', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    name: 'Growth',
    monthlyPrice: 1199,
    tagline: 'The complete platform for scaling businesses.',
    highlight: true,
    badge: 'Most popular',
    features: [
      { text: '6 departments', included: true },
      { text: '35 active workflows', included: true },
      { text: '40+ integrations', included: true },
      { text: 'Read-only dashboard', included: true },
      { text: 'Dashboard Pro add-on (£199/mo)', included: true },
      { text: '25,000 workflow runs/mo', included: true },
      { text: 'Priority support (8h SLA)', included: true },
      { text: 'CSV & API exports', included: true },
      { text: 'AI-powered steps (Claude)', included: true },
      { text: 'API access', included: true },
      { text: 'Custom branding', included: true },
      { text: 'SSO & SCIM', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: 2499,
    tagline: 'For multi-product organisations with complex data and compliance needs.',
    highlight: false,
    badge: null,
    features: [
      { text: 'All 150 workflows, all 14 departments', included: true },
      { text: 'Full interactive dashboard (included)', included: true },
      { text: 'Multi-organisation view', included: true },
      { text: 'Unlimited workflow runs', included: true },
      { text: '40+ integrations + custom', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: '4h SLA guarantee (contractual)', included: true },
      { text: 'SSO & SCIM provisioning', included: true },
      { text: 'Data residency options', included: true },
      { text: 'Full audit logs', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Onboarding & training sessions', included: true },
      { text: 'Security questionnaire & DPA', included: true },
    ],
  },
]

const COMPARE = [
  { section: 'Platform' },
  { feature: 'Departments',                  starter: '3',           growth: '6',             enterprise: 'All 14 + multi-org' },
  { feature: 'Active workflows',             starter: '20',          growth: '35',             enterprise: 'All 150' },
  { feature: 'Workflow runs/month',          starter: '2,000',       growth: '25,000',         enterprise: 'Unlimited' },
  { feature: 'Integrations',                starter: '5',           growth: '40+',            enterprise: '40+ + custom' },
  { feature: 'Dashboard',                   starter: 'Read-only',   growth: 'Read-only + Pro add-on (£199/mo)', enterprise: 'Full interactive (included)' },
  { feature: 'Workflow Library',            starter: true,          growth: true,             enterprise: true },
  { section: 'AI & Intelligence' },
  { feature: 'AI-powered steps (Claude)',   starter: false,         growth: true,             enterprise: true },
  { feature: 'Lead scoring',               starter: false,         growth: true,             enterprise: true },
  { feature: 'AI Insights panel',          starter: false,         growth: true,             enterprise: true },
  { feature: 'AI-generated reports',       starter: false,         growth: true,             enterprise: true },
  { section: 'Data & Exports' },
  { feature: 'CSV exports',                starter: true,          growth: true,             enterprise: true },
  { feature: 'API access',                 starter: false,         growth: true,             enterprise: true },
  { feature: 'Full audit logs',            starter: false,         growth: false,            enterprise: true },
  { feature: 'Data residency options',     starter: false,         growth: false,            enterprise: true },
  { section: 'Security & Compliance' },
  { feature: 'SSO (Microsoft / Google)',   starter: false,         growth: false,            enterprise: true },
  { feature: 'SCIM provisioning',          starter: false,         growth: false,            enterprise: true },
  { feature: 'Data Processing Agreement',  starter: 'Standard',    growth: 'Standard',       enterprise: 'Custom' },
  { feature: 'Security questionnaire',     starter: false,         growth: false,            enterprise: true },
  { section: 'Support' },
  { feature: 'Support SLA',               starter: '2 business days', growth: '8 hours',    enterprise: '4 hours (contractual)' },
  { feature: 'Onboarding sessions',        starter: false,         growth: '1 session',      enterprise: 'Unlimited' },
  { feature: 'Dedicated account manager',  starter: false,         growth: false,            enterprise: true },
  { feature: 'Custom branding',            starter: false,         growth: true,             enterprise: true },
]

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — every plan starts with a 14-day free trial. No credit card required. You get full access to your plan\'s features from day one. If you decide it\'s not for you, just cancel and you won\'t be charged.',
  },
  {
    q: 'What counts as a "workflow run"?',
    a: 'A workflow run is one execution of an automation — for example, one invoice chase email being sent, or one new hire being onboarded. Paused and draft workflows don\'t consume runs. Starter includes 2,000 runs/month, Growth 25,000, and Enterprise is unlimited.',
  },
  {
    q: 'Can I change plans at any time?',
    a: 'Yes. Upgrade instantly, downgrade at the end of your billing cycle. If you upgrade mid-month, you\'ll be charged a prorated amount for the remainder of the month. No awkward conversations — it\'s all self-serve from your account settings.',
  },
  {
    q: 'How does the annual billing discount work?',
    a: 'Switching to annual billing saves you 20% — equivalent to getting over 2 months free. You\'re billed upfront for the full year. If you need to cancel, we\'ll refund the unused months on a pro-rata basis.',
  },
  {
    q: 'Do you offer discounts for charities or non-profits?',
    a: 'Yes. We offer 30% off all plans for registered charities, CICs, and non-profit organisations. Email us with proof of status and we\'ll apply the discount immediately.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'You can export all your data via CSV or API before cancelling. After cancellation, your data is retained for 30 days (in case you change your mind), then permanently deleted. We never sell your data.',
  },
  {
    q: 'Do I need technical skills to set up Lumio?',
    a: 'No. Lumio is built for operations and business teams, not developers. Connecting integrations takes a few clicks via OAuth. Workflows are configured in a visual interface. We also offer onboarding sessions (Growth and above) to get you set up quickly.',
  },
  {
    q: 'What integrations are available on Starter?',
    a: 'Starter plans get access to 5 integrations. You choose which 5 from the full library. Most teams start with HubSpot, Xero, Slack, Microsoft 365, and Resend. You can swap integrations at any time.',
  },
  {
    q: 'Is Lumio GDPR compliant?',
    a: 'Yes. Data is processed and stored in the UK and EU. We provide a standard Data Processing Agreement (DPA) to all customers. Enterprise customers can request a custom DPA and negotiate specific data residency requirements.',
  },
  {
    q: 'Can I get a custom quote for a large team?',
    a: 'Absolutely. Enterprise pricing is flexible for large organisations, multi-brand groups, or businesses with unusual requirements. Book a demo and we\'ll put together a tailored proposal.',
  },
]

type CellVal = boolean | string

function Cell({ val }: { val: CellVal }) {
  if (typeof val === 'boolean') {
    return val
      ? <div className="flex justify-center"><Check size={15} style={{ color: '#0D9488' }} /></div>
      : <div className="flex justify-center"><X size={15} style={{ color: '#374151' }} /></div>
  }
  return <span style={{ color: '#D1D5DB' }}>{val}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ color: '#F9FAFB' }} className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Pricing</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, honest pricing</h1>
          <p className="text-lg" style={{ color: '#6B7280', maxWidth: 520, margin: '0 auto 32px' }}>
            No hidden fees. No per-seat surprises. Pay for the platform, not the headcount.
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <button onClick={() => setAnnual(false)}
              className="px-5 py-2 rounded-md text-sm font-medium transition-all"
              style={{ backgroundColor: !annual ? '#1F2937' : 'transparent', color: !annual ? '#F9FAFB' : '#6B7280' }}>
              Monthly
            </button>
            <button onClick={() => setAnnual(true)}
              className="px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2"
              style={{ backgroundColor: annual ? '#1F2937' : 'transparent', color: annual ? '#F9FAFB' : '#6B7280' }}>
              Annual
              <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-20">
          {TIERS.map(tier => {
            const price = annual ? Math.round(tier.monthlyPrice * 0.8) : tier.monthlyPrice
            return (
              <div key={tier.name} className="rounded-xl p-8 flex flex-col relative"
                style={{
                  backgroundColor: tier.highlight ? 'rgba(13,148,136,0.07)' : '#0D0E16',
                  border: tier.highlight ? '1px solid rgba(13,148,136,0.4)' : '1px solid #1F2937',
                }}>
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full"
                    style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                    {tier.badge}
                  </div>
                )}
                <h2 className="text-xl font-bold mb-1">{tier.name}</h2>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6B7280' }}>{tier.tagline}</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold">£{price}</span>
                  <span className="text-sm ml-1" style={{ color: '#6B7280' }}>
                    /mo{annual ? <> · <span style={{ color: '#0D9488' }}>billed annually</span></> : ''}
                  </span>
                  {annual && (
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                      Was £{tier.monthlyPrice}/mo — you save £{(tier.monthlyPrice - price) * 12}/yr
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map(f => (
                    <li key={f.text} className="flex items-center gap-3 text-sm"
                      style={{ color: f.included ? '#D1D5DB' : '#4B5563' }}>
                      {f.included
                        ? <Check size={14} style={{ color: '#0D9488', flexShrink: 0 }} />
                        : <X size={14} style={{ color: '#374151', flexShrink: 0 }} />}
                      {f.text}
                    </li>
                  ))}
                </ul>
                <Link href="/demo"
                  className="text-center py-3.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: tier.highlight ? '#0D9488' : 'transparent',
                    color: tier.highlight ? '#F9FAFB' : '#9CA3AF',
                    border: tier.highlight ? 'none' : '1px solid #1F2937',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    if (tier.highlight) el.style.backgroundColor = '#0F766E'
                    else { el.style.color = '#F9FAFB'; el.style.borderColor = '#374151' }
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    if (tier.highlight) el.style.backgroundColor = '#0D9488'
                    else { el.style.color = '#9CA3AF'; el.style.borderColor = '#1F2937' }
                  }}>
                  {tier.name === 'Enterprise' ? 'Talk to sales' : 'Start free trial'}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap justify-center items-center gap-8 mb-20 py-8"
          style={{ borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
          {[
            '14-day free trial',
            'No credit card required',
            'Cancel any time',
            'GDPR compliant',
            'UK & EU data storage',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
              <Check size={14} style={{ color: '#0D9488' }} />
              {item}
            </div>
          ))}
        </div>

        {/* AI callout */}
        <div className="rounded-2xl p-8 mb-20 flex flex-col md:flex-row items-start md:items-center gap-6"
          style={{ backgroundColor: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.25)' }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(108,63,197,0.2)' }}>
            <Sparkles size={22} style={{ color: '#A78BFA' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1" style={{ color: '#A78BFA' }}>
              AI-powered steps included in Growth & Enterprise
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
              Every workflow that touches communication — proposals, invoice chasers, follow-ups, summaries, lead scoring — runs on Claude. Not templates. Actual intelligence, built into the platform.
            </p>
          </div>
          <Link href="/product"
            className="text-sm font-medium shrink-0"
            style={{ color: '#A78BFA' }}>
            Learn more →
          </Link>
        </div>

        {/* Comparison table */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Full plan comparison</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#0D0E16', borderBottom: '1px solid #1F2937' }}>
                  <th className="text-left px-6 py-4 font-medium" style={{ color: '#6B7280' }}>Feature</th>
                  <th className="px-6 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Starter</th>
                  <th className="px-6 py-4 font-semibold text-center" style={{ color: '#0D9488' }}>Growth</th>
                  <th className="px-6 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => {
                  if ('section' in row) {
                    return (
                      <tr key={row.section} style={{ backgroundColor: '#0D0E16', borderBottom: '1px solid #1F2937' }}>
                        <td colSpan={4} className="px-6 py-2.5">
                          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4B5563' }}>{row.section}</p>
                        </td>
                      </tr>
                    )
                  }
                  const r = row as { feature: string; starter: CellVal; growth: CellVal; enterprise: CellVal }
                  return (
                    <tr key={r.feature}
                      style={{ borderBottom: '1px solid #111318', backgroundColor: i % 2 === 0 ? '#07080F' : '#0A0B12' }}>
                      <td className="px-6 py-3" style={{ color: '#D1D5DB' }}>{r.feature}</td>
                      <td className="px-6 py-3 text-center text-sm"><Cell val={r.starter} /></td>
                      <td className="px-6 py-3 text-center text-sm"><Cell val={r.growth} /></td>
                      <td className="px-6 py-3 text-center text-sm"><Cell val={r.enterprise} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium"
                  style={{ backgroundColor: '#0D0E16', color: '#F9FAFB' }}>
                  {faq.q}
                  <span style={{ color: openFaq === i ? '#0D9488' : '#4B5563', fontSize: 20, lineHeight: 1, flexShrink: 0, marginLeft: 12 }}>
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 py-4 text-sm leading-relaxed" style={{ backgroundColor: '#0A0B12', color: '#9CA3AF' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
          <Zap size={28} style={{ color: '#0D9488', margin: '0 auto 16px' }} />
          <h2 className="text-2xl font-bold mb-3">Not sure which plan is right for you?</h2>
          <p className="text-sm mb-8" style={{ color: '#6B7280', maxWidth: 400, margin: '0 auto 32px' }}>
            Book a 30-minute demo. We'll walk you through the platform and help you work out exactly what you need.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demo"
              className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}>
              Book a Demo →
            </Link>
            <a href="mailto:hello@lumiocms.com"
              className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium"
              style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>
              Email us instead
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
