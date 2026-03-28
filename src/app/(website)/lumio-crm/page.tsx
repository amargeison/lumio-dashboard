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
  'ARIA Intelligence Layer — natural language queries, morning brief, pattern matching',
  'Auto-enrichment on every contact — LinkedIn, email verify, company data, news, social',
  'Ghost deal detection — stale alerts, bounce monitoring, job change tracking',
  'Buying signal radar — LinkedIn activity, job postings, funding news, engagement patterns',
  'Deal DNA scoring — 47-signal AI score per deal, updated in real time',
  'Zero data entry — ARIA auto-logs calls, emails, and meetings',
  'Lumio Hosted option — managed cloud, no servers needed, live in 48 hours',
  'Self-Hosted option — your infrastructure, full data sovereignty, Lumio-managed deployment',
  'Full contact and company management with activity timeline',
  'Deal pipelines — kanban and table views — fully customisable stages',
  'Custom objects — build any data structure your business needs',
  'Custom fields — unlimited on any object',
  'Email sync — Gmail and Outlook — all emails logged automatically',
  'Full REST API and GraphQL API — Lumio connects natively',
  'Webhooks — real-time triggers on deals, contacts, pipeline stage changes',
  'All 150 Lumio automation workflows connected natively from day one',
  'Self-hosted — your data on your server — Lumio manages infrastructure',
]

type CellVal = string | boolean

const COMPARE_ROWS: { feature: string; lumio: CellVal; hubspot: CellVal; salesforce: CellVal; pipedrive: CellVal; zendesk: CellVal }[] = [
  { feature: 'ARIA intelligence layer',          lumio: '✓ Full',          hubspot: false,              salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Auto-contact enrichment',          lumio: '✓ 6 sources',    hubspot: 'Add-on only',      salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Ghost deal detection',             lumio: '✓ Automatic',    hubspot: false,              salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Buying signal radar',              lumio: '✓ Real-time',    hubspot: false,              salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Zero data entry (AI logging)',     lumio: '✓ Full',         hubspot: 'Partial',          salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Unlimited users — no seat fees',   lumio: true,             hubspot: false,              salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Hosted option (no servers)',        lumio: '✓ Lumio Hosted', hubspot: true,               salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Self-hosted / data ownership',     lumio: '✓ Self-Hosted',  hubspot: false,              salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Contact & company management',     lumio: '✓ Full',         hubspot: true,               salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Custom objects',                   lumio: '✓ Unlimited',    hubspot: 'Enterprise+ only', salesforce: true,      pipedrive: false,   zendesk: false    },
  { feature: 'No seat fees — unlimited users',   lumio: true,             hubspot: false,              salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'Self-hosted / data ownership',     lumio: true,             hubspot: false,              salesforce: false,     pipedrive: false,   zendesk: false    },
  { feature: 'REST API + webhooks',              lumio: '✓ Full',         hubspot: '✓ rate limited',   salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Workflow automation',              lumio: '✓ via Lumio',    hubspot: 'Pro+',             salesforce: 'Enterprise+', pipedrive: 'Growth+', zendesk: 'Limited' },
  { feature: 'Email sync — Gmail + Outlook',     lumio: true,             hubspot: true,               salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Send emails from CRM',             lumio: 'Q4 2025',        hubspot: true,               salesforce: true,      pipedrive: true,    zendesk: true     },
  { feature: 'Mobile app',                       lumio: 'In development', hubspot: true,               salesforce: true,      pipedrive: true,    zendesk: true     },
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
      'ARIA Intelligence Layer',
      'Contact auto-enrichment',
      'Ghost deal detection',
      'Choice of deployment',
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
      'All 150 Lumio workflows connected',
      'Assisted migration included',
      'Priority support — 24h SLA',
      'ARIA Intelligence Layer',
      'Contact auto-enrichment',
      'Ghost deal detection',
      'Choice of deployment',
      'Buying signal radar',
      'Deal DNA 47-signal scoring',
      'ARIA morning brief',
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
      'ARIA Intelligence Layer',
      'Contact auto-enrichment',
      'Ghost deal detection',
      'Choice of deployment',
      'Custom ARIA signal rules',
      'Dedicated enrichment API quota',
      'ARIA white-labelling',
      'Dedicated hosted environment',
    ],
  },
]

const ARIA_FEATURES = [
  {
    emoji: '⚡',
    title: 'ARIA Intelligence Layer',
    desc: 'Ask ARIA anything in natural language. "Show me all deals over £10k that haven\'t had activity in 14 days." Get answers in seconds — not reports.',
  },
  {
    emoji: '🔍',
    title: 'Auto-Enrichment on Every Contact',
    desc: 'Add a name and email. ARIA fills in LinkedIn, company data, job title, social profiles, news mentions, and email verification — automatically.',
  },
  {
    emoji: '📡',
    title: 'Buying Signal Radar',
    desc: 'ARIA monitors LinkedIn activity, job postings, funding rounds, and engagement patterns to surface the contacts most likely to buy — right now.',
  },
  {
    emoji: '⚠️',
    title: 'Ghost Deal Detection',
    desc: 'Deals go quiet. ARIA catches it. Stale pipeline alerts, email bounce detection, and job change monitoring — so you never lose a deal you could have saved.',
  },
  {
    emoji: '🤖',
    title: 'Zero Data Entry',
    desc: 'ARIA auto-logs calls, emails, and meetings. Your reps sell. ARIA does the admin. Every interaction is captured without anyone typing a single note.',
  },
  {
    emoji: '🚀',
    title: 'Live in 48 Hours',
    desc: 'Choose Lumio Hosted and your CRM is live in 48 hours. No servers, no DevOps, no infrastructure. Self-Hosted takes 5 days with full Lumio-managed deployment.',
  },
]

const ENRICHMENT_STEPS = [
  { num: 1, label: 'You add a name and email' },
  { num: 2, label: 'ARIA verifies the email address' },
  { num: 3, label: 'Pulls LinkedIn profile — title, company, location' },
  { num: 4, label: 'Enriches company data — size, industry, revenue range' },
  { num: 5, label: 'Scans recent news mentions and funding rounds' },
  { num: 6, label: 'Checks social profiles and engagement patterns' },
  { num: 7, label: 'Builds a complete intelligence profile in < 30 seconds' },
]

const GHOST_CARDS = [
  {
    emoji: '⏰',
    title: 'Stale deal alert',
    desc: 'ARIA flags any deal with no activity in 14+ days. You get a notification with the last touchpoint, suggested next action, and risk score.',
  },
  {
    emoji: '📧',
    title: 'Email bounce detection',
    desc: 'When a contact\'s email bounces, ARIA alerts you immediately and searches for an updated address — before the deal goes cold.',
  },
  {
    emoji: '💼',
    title: 'Job change monitoring',
    desc: 'ARIA detects when a champion changes roles or leaves the company. You get an alert with their new position and a suggested re-engagement path.',
  },
]

const DEPLOYMENT_SELF_HOSTED_CHECKS = [
  'Runs on your infrastructure — AWS, GCP, Azure, or bare metal',
  'You own every byte of data — full sovereignty',
  'Lumio manages deployment, updates, and monitoring',
  'Same ARIA intelligence layer as Hosted',
  'Same monthly price — no premium for self-hosting',
  'Full REST API and GraphQL API access',
  'All 150 Lumio automation workflows connected',
]

const DEPLOYMENT_LUMIO_HOSTED_CHECKS = [
  'Managed cloud — no servers, no DevOps, no infrastructure',
  'Live in 48 hours from signup',
  'Dedicated isolated environment — your data is never shared',
  'Automatic backups, updates, and security patches',
  'Same ARIA intelligence layer as Self-Hosted',
  'Export your data any time — no lock-in',
  'Same monthly price — no premium for hosting',
  'Full REST API and GraphQL API access',
  'All 150 Lumio automation workflows connected',
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
  const [form, setForm] = useState({ name: '', email: '', company: '', deployment: '' })
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

      {/* ── 1. Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-4xl px-6 text-center mb-24 overflow-hidden">
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 600,
          background: 'radial-gradient(ellipse at center, rgba(108,63,197,0.18) 0%, rgba(13,148,136,0.08) 50%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
          style={{ backgroundColor: 'rgba(108,63,197,0.15)', border: '1px solid rgba(108,63,197,0.4)', color: '#A78BFA' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
          Now with ARIA Intelligence · Join the waitlist
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Your data. Your platform.<br />
          <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Zero licence fees.
          </span>
        </h1>
        <p className="text-lg leading-relaxed mb-10" style={{ color: '#9CA3AF', maxWidth: 620, margin: '0 auto 40px' }}>
          Lumio CRM is the world&apos;s first AI-native CRM built for teams who are done paying Salesforce £200/month for a glorified spreadsheet. ARIA enriches every contact automatically, detects ghost deals before you lose them, and tells you exactly who to call today. Choose how you run it — hosted by us, or on your own infrastructure.
        </p>

        {/* 4 check-pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { icon: '⚡', label: '£0 Licence Fee' },
            { icon: '🔍', label: 'ARIA Auto-Enrichment' },
            { icon: '📡', label: 'Buying Signal Detection' },
            { icon: '🚀', label: 'Live in 48 Hours' },
          ].map(stat => (
            <div key={stat.label} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: 'rgba(108,63,197,0.12)', border: '1px solid rgba(108,63,197,0.25)', color: '#C4B5FD' }}>
              <span>{stat.icon}</span>
              {stat.label}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#waitlist"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}>
            Join the waitlist <ArrowRight size={16} />
          </a>
          <a href="#savings"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid rgba(108,63,197,0.35)', color: '#A78BFA' }}>
            See the savings →
          </a>
        </div>
      </section>

      {/* ── 2. Problem (before/after) ──────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>THE PROBLEM WITH CRMS TODAY</p>
            <h2 className="text-3xl font-bold">You&apos;re paying for problems, not solutions</h2>
            <p className="mt-4 text-sm" style={{ color: '#6B7280', maxWidth: 600, margin: '16px auto 0' }}>
              Every sales team we&apos;ve spoken to is doing the same things manually — or being held hostage by their CRM vendor. Here&apos;s what Lumio CRM does instead.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="text-4xl mb-5">💸</div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#F9FAFB' }}>Extortionate pricing</h3>
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <X size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-xs font-semibold uppercase" style={{ color: '#EF4444' }}>Before</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  HubSpot Professional: £1,139/month. Salesforce Enterprise: £1,200/month for 10 users. That&apos;s £14,400/year — before integrations, support, or onboarding. And it goes up every year.
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-xs font-semibold uppercase" style={{ color: '#0D9488' }}>After — Lumio CRM</span>
                </div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#E5E7EB' }}>£199–£499/month. Fixed. Forever.</p>
                <ul className="space-y-1.5">
                  {['£0 licence fee on CRM engine', 'No per-seat pricing', 'One-time migration fee then flat monthly', 'Price never increases on existing plan'].map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                      <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 1 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="text-4xl mb-5">👤</div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#F9FAFB' }}>Per-seat price gouging</h3>
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <X size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-xs font-semibold uppercase" style={{ color: '#EF4444' }}>Before</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  Every new team member costs £40–£149/month extra. The more your business grows, the more you pay — for the exact same platform. Growth shouldn&apos;t be a penalty.
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-xs font-semibold uppercase" style={{ color: '#0D9488' }}>After — Lumio CRM</span>
                </div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#E5E7EB' }}>Unlimited users. Same price.</p>
                <ul className="space-y-1.5">
                  {['Hire 10th or 100th rep — zero extra cost', 'No user tiers no licence upgrades', 'CRM cost stays flat as you scale', 'Available on both Hosted and Self-Hosted'].map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                      <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 1 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="text-4xl mb-5">🔒</div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#F9FAFB' }}>Data lock-in</h3>
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <X size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-xs font-semibold uppercase" style={{ color: '#EF4444' }}>Before</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  Stop paying and your contacts, deal history, email threads, and entire customer record walk out the door. Your data is their leverage.
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-xs font-semibold uppercase" style={{ color: '#0D9488' }}>After — Lumio CRM</span>
                </div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#E5E7EB' }}>Your data. Always.</p>
                <ul className="space-y-1.5">
                  {['Self-Hosted your infrastructure you own everything', 'Lumio Hosted dedicated isolated environment export any time', 'No data lock-in on either plan', 'Cancel and keep every byte guaranteed'].map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                      <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 1 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Deployment Options ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>HOW YOU RUN IT</p>
          <h2 className="text-3xl font-bold">Your CRM. Your choice of deployment.</h2>
          <p className="mt-4 text-sm" style={{ color: '#6B7280', maxWidth: 620, margin: '16px auto 0' }}>
            Some teams want full infrastructure control. Others just want it to work without a server in sight. Lumio CRM works both ways — same product, same ARIA intelligence, same price.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Self-Hosted */}
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: 'rgba(108,63,197,0.12)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
              Full control
            </span>
            <h3 className="text-xl font-bold mb-2">Self-Hosted</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              Run Lumio CRM on your own infrastructure. AWS, GCP, Azure, or bare metal. Lumio handles the deployment, updates, and monitoring — you own the server and every byte of data.
            </p>
            <ul className="space-y-2.5 mb-8">
              {DEPLOYMENT_SELF_HOSTED_CHECKS.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                  <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 2 }} />
                  {item}
                </li>
              ))}
            </ul>
            <a href="#waitlist"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
              style={{ border: '1px solid rgba(108,63,197,0.35)', color: '#A78BFA' }}>
              Learn more about Self-Hosted
            </a>
          </div>

          {/* Lumio Hosted */}
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '2px solid transparent', backgroundClip: 'padding-box', boxShadow: '0 0 0 2px rgba(108,63,197,0.4)' }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#14B8A6', border: '1px solid rgba(13,148,136,0.3)' }}>
                Recommended · No servers needed
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2">Lumio Hosted</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              We run everything. Your CRM is live in 48 hours — managed cloud, automatic backups, security patches, and zero DevOps. Same ARIA intelligence, same features, same price.
            </p>
            <ul className="space-y-2.5 mb-8">
              {DEPLOYMENT_LUMIO_HOSTED_CHECKS.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                  <Check size={14} style={{ color: '#0D9488', flexShrink: 0, marginTop: 2 }} />
                  {item}
                </li>
              ))}
            </ul>
            <a href="#waitlist"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}>
              Join the waitlist <ArrowRight size={16} />
            </a>
          </div>
        </div>
        <p className="text-center text-sm mt-8" style={{ color: '#6B7280' }}>
          Both options include the same ARIA intelligence, the same features, and the same monthly price. Switch between them at any time.
        </p>
      </section>

      {/* ── 4. ARIA Differentiators ────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>THE LUMIO DIFFERENCE</p>
            <h2 className="text-3xl font-bold">Not a CRM with AI bolted on.</h2>
            <p className="mt-4 text-sm" style={{ color: '#6B7280', maxWidth: 600, margin: '16px auto 0' }}>
              AI-native from day one. Every other CRM treats AI as a premium add-on. In Lumio CRM, ARIA is the core — available on both Hosted and Self-Hosted plans.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ARIA_FEATURES.map(f => (
              <div key={f.title} className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <div className="text-3xl mb-4">{f.emoji}</div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#F9FAFB' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Enrichment Showcase ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>ARIA ENRICHMENT ENGINE</p>
          <h2 className="text-3xl font-bold">Add a name. Get a complete intelligence profile.</h2>
          <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
            Works identically on Lumio Hosted and Self-Hosted.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
          {/* Left — steps */}
          <div className="space-y-4">
            {ENRICHMENT_STEPS.map(step => (
              <div key={step.num} className="flex items-start gap-4 rounded-lg px-5 py-4"
                style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
                  {step.num}
                </div>
                <span className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>{step.label}</span>
              </div>
            ))}
          </div>

          {/* Right — enriched profile card */}
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={14} style={{ color: '#A78BFA' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A78BFA' }}>ARIA Enriched Profile</span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-1">Sarah Chen</h3>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>VP of Sales · Nexus Technologies</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Email', value: 'sarah.chen@nexustech.io', verified: true },
                { label: 'LinkedIn', value: 'linkedin.com/in/sarahchen' },
                { label: 'Company Size', value: '250–500 employees' },
                { label: 'Industry', value: 'B2B SaaS · Series C' },
                { label: 'Revenue Range', value: '£20M–£50M' },
                { label: 'Recent News', value: 'Raised £18M Series C — 3 days ago' },
                { label: 'Buying Signal', value: 'Hiring 4 SDRs + posted CRM RFP' },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-2"
                  style={{ borderBottom: '1px solid #1F2937' }}>
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{row.label}</span>
                  <span className="text-sm text-right" style={{ color: '#E5E7EB' }}>
                    {row.value}
                    {row.verified && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>
                        Verified
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#0D9488' }}>ARIA Recommendation</p>
              <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
                High-intent lead. Recent funding + active CRM search. Recommend immediate outreach — reference Series C and SDR hiring as conversation hooks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Ghost Deal Detection ────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>GHOST DEAL DETECTION</p>
            <h2 className="text-3xl font-bold">ARIA sees the deals you&apos;re about to lose.</h2>
            <p className="mt-4 text-sm" style={{ color: '#6B7280', maxWidth: 600, margin: '16px auto 0' }}>
              Deals don&apos;t die in one dramatic moment. They go quiet. ARIA monitors every signal — activity gaps, email bounces, job changes — and alerts you before it&apos;s too late.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-12">
            {GHOST_CARDS.map(card => (
              <div key={card.title} className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <div className="text-3xl mb-4">{card.emoji}</div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#F9FAFB' }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{card.desc}</p>
              </div>
            ))}
          </div>
          {/* Stat row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { stat: '£381k', label: 'Average pipeline value saved per quarter by early Ghost Deal alerts' },
              { stat: '31 days', label: 'Average time to detect a ghost deal without ARIA — too late for most' },
              { stat: '3×', label: 'Higher win rate on deals flagged and re-engaged by ARIA within 48 hours' },
            ].map(item => (
              <div key={item.stat} className="text-center rounded-xl p-6"
                style={{ backgroundColor: 'rgba(108,63,197,0.06)', border: '1px solid rgba(108,63,197,0.2)' }}>
                <p className="text-3xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #A78BFA, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {item.stat}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Savings table ────────────────────────────────────────────────────── */}
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

      {/* ── 8. What's included ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>What&apos;s included</p>
              <h2 className="text-3xl font-bold mb-6">Everything you need. Nothing you don&apos;t.</h2>
              <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
                Lumio CRM isn&apos;t a stripped-back tool with features gated behind higher tiers. Every core CRM capability is included — and connected to your Lumio workflows from day one.
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

      {/* ── 9. Powered by Claude ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>AI INTELLIGENCE</p>
            <h2 className="text-3xl font-bold mb-6">Intelligence powered by Claude</h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              ARIA is powered by Claude — Anthropic&apos;s AI. Every enrichment profile, ghost deal alert, morning brief, and natural language pipeline query runs through Claude&apos;s API — on both Lumio Hosted and Self-Hosted deployments.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: 'rgba(108,63,197,0.15)', border: '1px solid rgba(108,63,197,0.4)', color: '#A78BFA' }}>
              <Sparkles size={11} />
              Powered by Anthropic&apos;s Claude
            </div>
          </div>
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
            <ul className="space-y-4">
              {[
                'Enrichment profiles built from 6+ data sources via Claude reasoning',
                'Natural language CRM queries — "show me stale deals over £10k"',
                'Ghost deal pattern matching across your entire pipeline',
                'Morning briefs generated per rep — personalised priorities and actions',
                'Buying signal scoring calibrated to your historical win data',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
                  <span style={{ color: '#A78BFA', flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 10. Feature comparison table ────────────────────────────────────────── */}
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
                  <th className="px-4 py-4 font-medium text-center" style={{ color: '#6B7280' }}>
                    <div>Zendesk Sell</div>
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded mt-1"
                      style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                      Retiring Aug 2027
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={`${row.feature}-${i}`}
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

      {/* ── 11. Pricing ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Pricing</p>
          <h2 className="text-3xl font-bold">Simple pricing. No seats. No surprises.</h2>
          <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
            Add Lumio CRM to any Lumio plan. One-time setup fee covers migration, configuration, and launch.
          </p>
        </div>

        {/* Callout box */}
        <div className="rounded-xl p-5 mb-8 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.08), rgba(13,148,136,0.06))', border: '1px solid rgba(108,63,197,0.25)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#D1D5DB' }}>
            ☁️ All plans available as <strong style={{ color: '#A78BFA' }}>Lumio Hosted</strong> or <strong style={{ color: '#A78BFA' }}>Self-Hosted</strong>. Same monthly price. Same features. Same ARIA intelligence.
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
          Lumio CRM is an add-on to any Lumio plan. Already on Lumio Growth? Add CRM Professional for £499/mo. All tiers include ARIA intelligence and your choice of deployment.
        </p>
      </section>

      {/* ── 12. Hosting Explainer ───────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>LUMIO HOSTED</p>
            <h2 className="text-3xl font-bold">No servers? No problem.</h2>
            <p className="mt-4 text-sm" style={{ color: '#6B7280', maxWidth: 600, margin: '16px auto 0' }}>
              Lumio Hosted is the fastest way to get a full AI-native CRM running. No infrastructure, no DevOps hire, no server maintenance. We handle everything — you just sell.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
            {[
              {
                emoji: '🚀',
                title: 'Up and running in 48 hours',
                desc: 'From signup to live CRM in two days. We configure your pipelines, import your data, connect your email, and activate ARIA — ready for your team on day three.',
              },
              {
                emoji: '🔐',
                title: 'Your data isolated safe',
                desc: 'Every Lumio Hosted environment is fully isolated. Your data is never shared, never co-mingled, and encrypted at rest and in transit. Export any time — no lock-in.',
              },
              {
                emoji: '🛠️',
                title: 'We handle everything',
                desc: 'Automatic backups, security patches, version updates, uptime monitoring, and scaling. Your team focuses on selling — we focus on keeping the CRM running perfectly.',
              },
            ].map(card => (
              <div key={card.title} className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <div className="text-3xl mb-4">{card.emoji}</div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#F9FAFB' }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{card.desc}</p>
              </div>
            ))}
          </div>
          {/* Self-Hosted callout */}
          <div className="rounded-xl p-6"
            style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.08), rgba(13,148,136,0.06))', border: '1px solid rgba(108,63,197,0.25)' }}>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)' }}>
                <Shield size={18} style={{ color: '#A78BFA' }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#A78BFA' }}>Prefer full infrastructure control?</p>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  Self-Hosted gives you the same CRM and ARIA intelligence on your own servers. Lumio manages the deployment, updates, and monitoring — you own the infrastructure and every byte of data. Same monthly price, same features. <a href="#waitlist" style={{ color: '#A78BFA', textDecoration: 'underline' }}>Join the waitlist</a> and tell us your preference.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 13. Waitlist ────────────────────────────────────────────────────────── */}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Be first to get Lumio CRM + ARIA</h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#C4B5FD', maxWidth: 480, margin: '0 auto 32px' }}>
              Join the waitlist for early access, launch pricing, and priority migration support. Choose your deployment preference and we&apos;ll have everything ready when you are.
            </p>

            {/* Benefit pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[
                'Early access + launch pricing',
                'Priority migration support',
                'ARIA intelligence from day one',
              ].map(pill => (
                <span key={pill} className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)', color: '#14B8A6' }}>
                  <Check size={12} />
                  {pill}
                </span>
              ))}
            </div>

            {submitted ? (
              <div className="rounded-xl p-10 text-center"
                style={{ backgroundColor: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.3)' }}>
                <Check size={36} style={{ color: '#0D9488', margin: '0 auto 16px' }} />
                <p className="text-lg font-semibold mb-2">You&apos;re on the list!</p>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>
                  We&apos;ll reach out as soon as Lumio CRM is ready for early access.
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
                <div className="mb-4">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Company</label>
                  <input type="text" name="company" value={form.company} onChange={handleChange}
                    placeholder="Acme Ltd"
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(108,63,197,0.6)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(108,63,197,0.3)' }}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>Deployment preference</label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: 'lumio-hosted', label: 'Lumio Hosted' },
                      { value: 'self-hosted', label: 'Self-Hosted' },
                      { value: 'not-sure', label: 'Not sure yet' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#D1D5DB' }}>
                        <input
                          type="radio"
                          name="deployment"
                          value={opt.value}
                          checked={form.deployment === opt.value}
                          onChange={handleChange}
                          style={{ accentColor: '#6C3FC5' }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit"
                  className="w-full py-3.5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5B35A5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C3FC5' }}>
                  Join the Waitlist →
                </button>
                <p className="text-xs text-center mt-3" style={{ color: '#6B7280' }}>
                  No spam. We&apos;ll only email you about Lumio CRM.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
