'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight, Sparkles, Database, Users, Shield, Zap } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SAVINGS_ROWS = [
  { from: 'HubSpot Professional',       current: '£13,668', lumio: '£1,788', saving: '£11,880', pct: '87%', highlight: false },
  { from: 'HubSpot Enterprise',         current: '£49,080', lumio: '£1,788', saving: '£47,292', pct: '96%', highlight: false },
  { from: 'Salesforce Professional',    current: '£7,200',  lumio: '£1,788', saving: '£5,412',  pct: '75%', highlight: false },
  { from: 'Salesforce Enterprise',      current: '£14,400', lumio: '£1,788', saving: '£12,612', pct: '88%', highlight: false },
  { from: 'Pipedrive Professional',     current: '£5,880',  lumio: '£1,188', saving: '£4,692',  pct: '80%', highlight: false },
  { from: 'Zendesk Sell Professional',  current: '£17,880', lumio: '£1,788', saving: '£16,092', pct: '90%', highlight: true  },
  { from: 'Zoho CRM Professional',      current: '£1,680',  lumio: '£1,188', saving: '£492',    pct: '29%', highlight: false },
]

const FEATURES_INCLUDED = [
  'Full contact and company management with activity timeline',
  'Deal pipelines — kanban and table views — fully customisable stages',
  'Custom objects — build any data structure your business needs',
  'Custom fields — unlimited on any object',
  'Email sync — Gmail and Outlook — all emails logged automatically',
  'Full REST API and GraphQL API — Lumio connects natively',
  'Webhooks — real-time triggers on deals, contacts, pipeline stage changes',
  'All 47 Lumio automation workflows connected natively from day one',
  'Self-hosted — your data on your server — Lumio manages infrastructure',
]

type CellVal = string | boolean

const COMPARE_ROWS: { feature: string; lumio: CellVal; hubspot: CellVal; salesforce: CellVal; pipedrive: CellVal; zendesk: CellVal }[] = [
  { feature: 'Contact & company management', lumio: '✓ Full',       hubspot: true,             salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Custom objects',              lumio: '✓ Unlimited',  hubspot: 'Enterprise+ only', salesforce: true,    pipedrive: false,   zendesk: false    },
  { feature: 'No seat fees — unlimited users', lumio: true,        hubspot: false,            salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Self-hosted / data ownership', lumio: true,          hubspot: false,            salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'REST API + webhooks',         lumio: '✓ Full',       hubspot: '✓ rate limited', salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Workflow automation',         lumio: '✓ via Lumio',  hubspot: 'Pro+',           salesforce: 'Enterprise+', pipedrive: 'Growth+', zendesk: 'Limited' },
  { feature: 'Email sync — Gmail + Outlook', lumio: true,          hubspot: true,             salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Send emails from CRM',        lumio: 'Q4 2025',      hubspot: true,             salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Mobile app',                  lumio: 'In development', hubspot: true,           salesforce: true,      pipedrive: true,    zendesk: true     },
]

const PRICING_TIERS = [
  {
    name: 'CRM Starter',
    price: 199,
    setup: 499,
    highlight: false,
    tagline: 'For small teams moving off spreadsheets.',
    features: [
      'Up to 10 users',
      '50,000 contacts',
      '3 custom objects',
      'Gmail or Outlook sync',
      'Core Lumio workflow integration',
      'Email support — 48h SLA',
    ],
  },
  {
    name: 'CRM Professional',
    price: 499,
    setup: 999,
    highlight: true,
    tagline: 'For growing teams replacing HubSpot or Salesforce.',
    features: [
      'Unlimited users — no seat fees',
      'Unlimited contacts',
      '10 custom objects',
      'Gmail + Outlook + shared inbox',
      'All 47 Lumio workflows connected',
      'Assisted migration included',
      'Priority support — 24h SLA',
    ],
  },
  {
    name: 'CRM Enterprise',
    price: 999,
    setup: 1999,
    highlight: false,
    tagline: 'For complex orgs needing full control and customisation.',
    features: [
      'Unlimited users + SSO',
      'Unlimited contacts + storage',
      'Unlimited custom objects',
      'Full email stack',
      'Custom workflow builds',
      'Full managed migration',
      'Dedicated support — 4h SLA',
    ],
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function CompareCell({ val, lumio = false }: { val: CellVal; lumio?: boolean }) {
  if (typeof val === 'boolean') {
    return (
      <div className="flex justify-center">
        {val
          ? <Check size={15} style={{ color: lumio ? '#0D9488' : '#374151' }} />
          : <X size={15} style={{ color: '#374151' }} />}
      </div>
    )
  }
  return <span style={{ color: lumio ? '#0D9488' : '#9CA3AF', fontWeight: lumio ? 500 : 400 }}>{val}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', backgroundColor: '#0D0E16', border: '1px solid rgba(108,63,197,0.3)',
    borderRadius: 8, padding: '10px 14px', color: '#F9FAFB', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ color: '#F9FAFB' }} className="pt-28 pb-20">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-4xl px-6 text-center mb-24 overflow-hidden">
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 600,
          background: 'radial-gradient(ellipse at center, rgba(108,63,197,0.18) 0%, rgba(13,148,136,0.08) 50%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
          style={{ backgroundColor: 'rgba(108,63,197,0.15)', border: '1px solid rgba(108,63,197,0.4)', color: '#A78BFA' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#A78BFA', display: 'inline-block' }} />
          Coming Soon — Join the waitlist
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Your data. Your platform.{' '}
          <span style={{ background: 'linear-gradient(135deg, #A78BFA, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Zero licence fees.
          </span>
        </h1>
        <p className="text-lg leading-relaxed mb-10" style={{ color: '#9CA3AF', maxWidth: 580, margin: '0 auto 40px' }}>
          Lumio CRM is a fully-featured CRM — managed by Lumio — at a fraction of the cost of HubSpot or Salesforce. No per-seat pricing. No data lock-in. No compromise.
        </p>

        {/* 4 stat badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { icon: Zap,      label: '£0 Licence Fee' },
            { icon: Database, label: '100% Data Ownership' },
            { icon: Users,    label: 'No Per-User Fees' },
            { icon: Shield,   label: '5-Day Migration' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
                style={{ backgroundColor: 'rgba(108,63,197,0.12)', border: '1px solid rgba(108,63,197,0.25)', color: '#C4B5FD' }}>
                <Icon size={14} />
                {stat.label}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#waitlist"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#5B35A5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6C3FC5' }}>
            Join the waitlist <ArrowRight size={16} />
          </a>
          <a href="#savings"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid rgba(108,63,197,0.35)', color: '#A78BFA' }}>
            See the savings →
          </a>
        </div>
      </section>

      {/* ── Problem section ───────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>The problem with CRMs today</p>
            <h2 className="text-3xl font-bold">You're paying for problems, not solutions</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                emoji: '💸',
                title: 'Extortionate pricing',
                desc: 'HubSpot Professional: £1,139/month. Salesforce Enterprise: £1,200/month for 10 users. That\'s £14,400/year — before you add any integrations, support, or onboarding.',
                sub: 'And it goes up every year.',
              },
              {
                emoji: '👤',
                title: 'Per-seat price gouging',
                desc: 'Every new team member costs £40–£149/month extra. The more your business grows, the more you pay — for the exact same platform you already bought.',
                sub: 'Growth shouldn\'t be a penalty.',
              },
              {
                emoji: '🔒',
                title: 'You don\'t own your data',
                desc: 'Stop paying and your contacts, deal history, email threads, and entire customer relationship record walk out the door with your cancellation email.',
                sub: 'Your data is their leverage.',
              },
            ].map(card => (
              <div key={card.title} className="rounded-xl p-8"
                style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <div className="text-4xl mb-5">{card.emoji}</div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#F9FAFB' }}>{card.title}</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#6B7280' }}>{card.desc}</p>
                <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Savings table ─────────────────────────────────────────────────────── */}
      <section id="savings" className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>The savings</p>
          <h2 className="text-3xl font-bold">How much will you save?</h2>
          <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
            Based on Lumio CRM Professional (£499/mo) or Starter (£199/mo). 10 users, annual billing.
          </p>
        </div>

        <div className="rounded-xl overflow-hidden mb-8" style={{ border: '1px solid #1F2937' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0D0E16', borderBottom: '1px solid #1F2937' }}>
                <th className="text-left px-6 py-4 font-medium" style={{ color: '#6B7280' }}>Migrating from</th>
                <th className="px-5 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Current / year</th>
                <th className="px-5 py-4 font-semibold text-center" style={{ color: '#0D9488' }}>Lumio CRM / year</th>
                <th className="px-5 py-4 font-semibold text-center" style={{ color: '#A78BFA' }}>Annual saving</th>
                <th className="px-5 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Reduction</th>
              </tr>
            </thead>
            <tbody>
              {SAVINGS_ROWS.map((row, i) => (
                <tr key={row.from}
                  style={{
                    borderBottom: '1px solid #111318',
                    backgroundColor: row.highlight ? 'rgba(108,63,197,0.06)' : i % 2 === 0 ? '#07080F' : '#0A0B12',
                  }}>
                  <td className="px-6 py-3.5 font-medium" style={{ color: row.highlight ? '#C4B5FD' : '#D1D5DB' }}>
                    {row.from}
                    {row.highlight && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
                        Biggest saving
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center" style={{ color: '#EF4444' }}>{row.current}</td>
                  <td className="px-5 py-3.5 text-center font-semibold" style={{ color: '#0D9488' }}>{row.lumio}</td>
                  <td className="px-5 py-3.5 text-center font-bold" style={{ color: '#A78BFA' }}>{row.saving}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>
                      {row.pct}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Highlight box */}
        <div className="rounded-xl p-7"
          style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.12), rgba(13,148,136,0.08))', border: '1px solid rgba(108,63,197,0.3)' }}>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(108,63,197,0.2)' }}>
              <Sparkles size={18} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: '#A78BFA' }}>The Lumio stack — a better comparison</p>
              <p className="text-base leading-relaxed mb-1" style={{ color: '#E5E7EB' }}>
                <strong>Lumio Growth (£1,199/mo) + Lumio CRM Professional (£499/mo) = £1,698/month total.</strong>
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                This replaces HubSpot Professional at £1,139/month — which includes the CRM <em>and</em> automation, but with per-seat pricing, no data ownership, and no AI layer.
                Net saving: <span style={{ color: '#0D9488', fontWeight: 600 }}>£391/month from day one.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's included ───────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>What's included</p>
              <h2 className="text-3xl font-bold mb-6">Everything you need. Nothing you don't.</h2>
              <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
                Lumio CRM isn't a stripped-back tool with features gated behind higher tiers. Every core CRM capability is included — and connected to your Lumio workflows from day one.
              </p>
            </div>
            <div className="space-y-3">
              {FEATURES_INCLUDED.map(f => (
                <div key={f} className="flex items-start gap-3 rounded-lg px-4 py-3"
                  style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                  <Check size={15} style={{ color: '#0D9488', flexShrink: 0, marginTop: 1 }} />
                  <span className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── About Twenty ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-2xl p-10 text-center"
          style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
            style={{ backgroundColor: 'rgba(108,63,197,0.12)', border: '1px solid rgba(108,63,197,0.3)', color: '#A78BFA' }}>
            <Sparkles size={11} />
            Powered by Twenty
          </div>
          <h2 className="text-2xl font-bold mb-4">Built on the world's leading open-source CRM</h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#9CA3AF', maxWidth: 600, margin: '0 auto 24px' }}>
            Lumio CRM is powered by <strong style={{ color: '#E5E7EB' }}>Twenty</strong> — the world's leading open-source CRM, backed by <strong style={{ color: '#E5E7EB' }}>Y Combinator</strong>, with 1,000+ active contributors, and released as v1.0 in 2025. The GPL licence means the platform itself is free forever. Lumio deploys it, manages the infrastructure, migrates your data, and wires it into every Lumio workflow — so you get enterprise-grade CRM without the enterprise price tag.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'Y Combinator backed' },
              { label: '1,000+ contributors' },
              { label: 'v1.0 released 2025' },
              { label: 'GPL licence — free forever' },
              { label: 'Full REST & GraphQL API' },
            ].map(tag => (
              <span key={tag.label} className="text-sm px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature comparison table ──────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Full comparison</p>
            <h2 className="text-3xl font-bold">Feature for feature</h2>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#0D0E16', borderBottom: '1px solid #1F2937' }}>
                  <th className="text-left px-6 py-4 font-medium" style={{ color: '#6B7280' }}>Feature</th>
                  <th className="px-4 py-4 font-bold text-center" style={{ color: '#0D9488' }}>Lumio CRM</th>
                  <th className="px-4 py-4 font-medium text-center" style={{ color: '#6B7280' }}>HubSpot Pro</th>
                  <th className="px-4 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Salesforce Pro</th>
                  <th className="px-4 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Pipedrive Pro</th>
                  <th className="px-4 py-4 font-medium text-center" style={{ color: '#6B7280' }}>Zendesk Sell</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.feature}
                    style={{ borderBottom: '1px solid #111318', backgroundColor: i % 2 === 0 ? '#07080F' : '#0A0B12' }}>
                    <td className="px-6 py-3.5" style={{ color: '#D1D5DB' }}>{row.feature}</td>
                    <td className="px-4 py-3.5 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.04)' }}>
                      <CompareCell val={row.lumio} lumio />
                    </td>
                    <td className="px-4 py-3.5 text-center"><CompareCell val={row.hubspot} /></td>
                    <td className="px-4 py-3.5 text-center"><CompareCell val={row.salesforce} /></td>
                    <td className="px-4 py-3.5 text-center"><CompareCell val={row.pipedrive} /></td>
                    <td className="px-4 py-3.5 text-center"><CompareCell val={row.zendesk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs mt-4" style={{ color: '#4B5563' }}>
            All comparisons based on Professional tier. Pricing as of March 2025.
          </p>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Pricing</p>
          <h2 className="text-3xl font-bold">Simple pricing. No seats. No surprises.</h2>
          <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
            Add Lumio CRM to any Lumio plan. One-time setup fee covers migration, configuration, and launch.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING_TIERS.map(tier => (
            <div key={tier.name} className="rounded-xl p-8 flex flex-col relative"
              style={{
                backgroundColor: tier.highlight ? 'rgba(108,63,197,0.08)' : '#0D0E16',
                border: tier.highlight ? '1px solid rgba(108,63,197,0.4)' : '1px solid #1F2937',
              }}>
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full"
                  style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
                  Most popular
                </div>
              )}
              <h2 className="text-lg font-bold mb-1">{tier.name}</h2>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6B7280' }}>{tier.tagline}</p>
              <div className="mb-2">
                <span className="text-4xl font-bold">£{tier.price}</span>
                <span className="text-sm ml-1" style={{ color: '#6B7280' }}>/mo</span>
              </div>
              <p className="text-xs mb-7" style={{ color: '#4B5563' }}>
                + £{tier.setup} one-time setup & migration
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                    <Check size={14} style={{ color: tier.highlight ? '#A78BFA' : '#0D9488', flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#waitlist"
                className="text-center py-3.5 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: tier.highlight ? '#6C3FC5' : 'transparent',
                  color: tier.highlight ? '#F9FAFB' : '#9CA3AF',
                  border: tier.highlight ? 'none' : '1px solid #1F2937',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  if (tier.highlight) el.style.backgroundColor = '#5B35A5'
                  else { el.style.color = '#F9FAFB'; el.style.borderColor = '#374151' }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  if (tier.highlight) el.style.backgroundColor = '#6C3FC5'
                  else { el.style.color = '#9CA3AF'; el.style.borderColor = '#1F2937' }
                }}>
                Join waitlist
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-sm mt-8" style={{ color: '#6B7280' }}>
          Lumio CRM is an add-on to any Lumio plan. Already on Lumio Growth? Add CRM Professional for £499/mo.
        </p>
      </section>

      {/* ── Waitlist ──────────────────────────────────────────────────────────── */}
      <section id="waitlist">
        <div className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.25) 0%, rgba(13,148,136,0.15) 100%)', borderTop: '1px solid rgba(108,63,197,0.3)' }}>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(108,63,197,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="relative mx-auto max-w-2xl px-6 py-24 text-center">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
              style={{ backgroundColor: 'rgba(108,63,197,0.2)', border: '1px solid rgba(108,63,197,0.4)', color: '#C4B5FD' }}>
              <Sparkles size={11} />
              Expected launch: Q3 2025
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Be first to get Lumio CRM.</h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#C4B5FD', maxWidth: 480, margin: '0 auto 40px' }}>
              Join the waitlist for early access, launch pricing, and priority migration support. We'll let you know the moment it's ready.
            </p>

            {submitted ? (
              <div className="rounded-xl p-10 text-center"
                style={{ backgroundColor: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)' }}>
                <Check size={36} style={{ color: '#0D9488', margin: '0 auto 16px' }} />
                <p className="text-lg font-semibold mb-2">You're on the list!</p>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>
                  We'll reach out as soon as Lumio CRM is ready for early access.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-xl p-8 text-left"
                style={{ backgroundColor: 'rgba(7,8,15,0.7)', border: '1px solid rgba(108,63,197,0.25)' }}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Full name *</label>
                    <input type="text" name="name" required value={form.name} onChange={handleChange}
                      placeholder="Jane Smith"
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(108,63,197,0.6)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(108,63,197,0.3)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Work email *</label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange}
                      placeholder="jane@company.com"
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(108,63,197,0.6)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(108,63,197,0.3)' }}
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Company</label>
                  <input type="text" name="company" value={form.company} onChange={handleChange}
                    placeholder="Acme Ltd"
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(108,63,197,0.6)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(108,63,197,0.3)' }}
                  />
                </div>
                <button type="submit"
                  className="w-full py-3.5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5B35A5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C3FC5' }}>
                  Join the Waitlist →
                </button>
                <p className="text-xs text-center mt-3" style={{ color: '#6B7280' }}>
                  No spam. We'll only email you about Lumio CRM.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
