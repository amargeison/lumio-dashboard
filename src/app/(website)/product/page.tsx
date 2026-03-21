'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Users, TrendingUp, Megaphone, Headphones,
  Activity, Sparkles, GitBranch, Server, DollarSign,
  Check, ChevronRight, Zap, LayoutDashboard, FileDown,
  Shield, Sliders,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  {
    icon: Users,
    label: 'HR & People',
    color: '#0D9488',
    desc: 'From offer accepted to day one — and everything after. Lumio makes sure nothing gets missed, no matter how busy the team is.',
    workflows: [
      { name: 'New Joiner Onboarding', detail: 'Name entered once → M365, Teams, payroll, training all provisioned automatically.' },
      { name: 'Leave Management',      detail: 'Request → Slack approval → calendar blocked → payroll notified. All in one flow.' },
      { name: 'Offboarding',           detail: 'Last day set → accounts deactivated, equipment flagged, payroll end date set, exit survey sent.' },
      { name: 'Headcount Reporting',   detail: 'Live headcount dashboard updated automatically from your HR system.' },
      { name: 'Contract Sync',         detail: 'DocuSign completions sync to HR record and payroll instantly.' },
    ],
    integrations: ['Microsoft 365', 'Xero', 'Slack', 'DocuSign', 'Google Workspace'],
  },
  {
    icon: TrendingUp,
    label: 'Sales & CRM',
    color: '#6C3FC5',
    desc: 'From first touch to renewal. Lumio automates the admin so your reps can focus on selling.',
    workflows: [
      { name: 'New Customer Onboarding',   detail: 'Deal Won → portal, LMS, invoice, welcome email — all in 90 seconds.' },
      { name: 'Lead Qualification',        detail: 'Claude scores every lead hot / warm / cold and routes them to the right rep.' },
      { name: 'Proposal Generation',       detail: 'Call notes → Claude drafts a tailored proposal → sent for one-click approval.' },
      { name: 'Renewal Workflow',          detail: '90-day trigger → health score → personalised renewal email drafted by Claude.' },
      { name: 'Demo Follow-Up',            detail: 'Call ends → Claude summarises → follow-up email sent within 30 minutes.' },
      { name: 'Lost Deal Re-engagement',   detail: '90-day re-engagement sequence, personalised by Claude to their original objections.' },
    ],
    integrations: ['HubSpot', 'Salesforce', 'Xero', 'DocuSign', 'FutureLearn', 'Resend'],
  },
  {
    icon: Headphones,
    label: 'Support',
    color: '#3B82F6',
    desc: 'Faster resolution times, fewer escalations, and proactive SLA management — without growing the team.',
    workflows: [
      { name: 'Ticket Triage',   detail: 'Claude categorises, prioritises, and routes every ticket automatically.' },
      { name: 'AI Auto-Reply',   detail: 'Common questions answered instantly from your knowledge base. 40%+ resolved without agent.' },
      { name: 'SLA Escalation',  detail: 'Breach risk detected → agent alerted → customer updated proactively by Claude.' },
      { name: 'CSAT Survey',     detail: 'Ticket closed → survey sent → scores tracked and fed into your dashboard.' },
      { name: 'Weekly Report',   detail: 'Support metrics sent to leadership every Monday. Automatically.' },
    ],
    integrations: ['Intercom', 'Zendesk', 'Slack', 'Resend', 'HubSpot'],
  },
  {
    icon: Activity,
    label: 'Customer Success',
    color: '#EC4899',
    desc: 'Spot churn early. Intervene before it\'s too late. Automate the touchpoints that keep customers happy.',
    workflows: [
      { name: 'RAG Health Scoring',   detail: 'Usage + support + NPS data combined daily. Red accounts flagged in Slack instantly.' },
      { name: 'Recovery Sequence',    detail: 'Account turns Red → Claude drafts personalised recovery email → CS lead alerted.' },
      { name: 'QBR Preparation',      detail: 'QBR due → account data compiled → agenda drafted by Claude → calendar invite sent.' },
      { name: 'Check-In Emails',      detail: 'Regular touchpoints automated without losing the personal feel.' },
      { name: 'NPS Tracking',         detail: 'Scores tracked per account, per cohort, and over time.' },
    ],
    integrations: ['HubSpot', 'Intercom', 'Slack', 'Resend', 'Google Workspace'],
  },
  {
    icon: DollarSign,
    label: 'Accounts',
    color: '#F59E0B',
    desc: 'Get paid faster. Know exactly what\'s outstanding. Automate the chasing without damaging relationships.',
    workflows: [
      { name: 'Invoice Chasing',          detail: 'Overdue in Xero → Claude drafts personalised chase → sent on schedule every 10 days.' },
      { name: 'Payment Reconciliation',   detail: 'Payment received → matched to invoice → CRM updated → CS team notified.' },
      { name: 'Weekly Finance Report',    detail: 'Every Monday: revenue, outstanding, overdue — sent to leadership in Slack.' },
      { name: 'New Customer Invoice',     detail: 'Deal Won → Xero invoice raised automatically with correct line items.' },
      { name: 'Subscription Renewals',    detail: 'Subscription invoices raised automatically on renewal date.' },
    ],
    integrations: ['Xero', 'QuickBooks', 'HubSpot', 'Slack', 'Resend'],
  },
  {
    icon: Server,
    label: 'IT & Systems',
    color: '#22C55E',
    desc: 'Zero-ticket IT. Everything provisioned, deprovisioned, and audited without a request form in sight.',
    workflows: [
      { name: 'Equipment Provisioning',    detail: 'New hire confirmed → order placed → delivery tracked → asset registered.' },
      { name: 'Access Management',         detail: 'Role change → M365 permissions updated → old access revoked → audit log created.' },
      { name: 'Software Licence Renewal',  detail: '60 days out → usage checked → cost pulled → approved or cancelled automatically.' },
      { name: 'Offboarding Access Revoke', detail: 'Last day → accounts deactivated at 17:00. Timestamped for compliance.' },
      { name: 'IT Asset Register',         detail: 'Every device tracked from provisioning to return.' },
    ],
    integrations: ['Microsoft 365', 'Google Workspace', 'Slack', 'Xero'],
  },
  {
    icon: Megaphone,
    label: 'Marketing',
    color: '#F97316',
    desc: 'More pipeline from the same spend. MQLs handed to sales before they go cold. ROI reported automatically.',
    workflows: [
      { name: 'MQL Handoff',           detail: 'Score threshold hit → enriched → Claude writes sales brief → rep alerted in Slack.' },
      { name: 'Campaign Report',        detail: 'End of campaign → data pulled → Claude writes narrative → sent to team in Slack.' },
      { name: 'Event Follow-Up',        detail: 'Event ends → attendees matched to CRM → personalised follow-up sent within 2 hours.' },
      { name: 'Lead Nurture Sequences', detail: 'Cold leads enrolled in long-form sequences. Claude personalises each touchpoint.' },
      { name: 'Attribution Reporting',  detail: 'First-touch and multi-touch attribution calculated automatically.' },
    ],
    integrations: ['HubSpot', 'Mailchimp', 'Resend', 'Typeform', 'Slack'],
  },
]

const INTEGRATIONS = [
  { name: 'HubSpot',           category: 'CRM' },
  { name: 'Salesforce',        category: 'CRM' },
  { name: 'Xero',              category: 'Finance' },
  { name: 'QuickBooks',        category: 'Finance' },
  { name: 'Microsoft 365',     category: 'Productivity' },
  { name: 'Google Workspace',  category: 'Productivity' },
  { name: 'Slack',             category: 'Comms' },
  { name: 'Resend',            category: 'Email' },
  { name: 'FutureLearn',       category: 'Learning' },
  { name: 'DocuSign',          category: 'Legal' },
  { name: 'Typeform',          category: 'Forms' },
  { name: 'Intercom',          category: 'Support' },
  { name: 'Zendesk',           category: 'Support' },
  { name: 'Mailchimp',         category: 'Marketing' },
  { name: 'Zapier',            category: 'Automation' },
  { name: 'Make',              category: 'Automation' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect your tools',
    desc: 'Authorise your existing apps in a few clicks. OAuth connections — no API keys to manage, no developer needed.',
  },
  {
    step: '02',
    title: 'Pick your workflows',
    desc: 'Browse 47+ pre-built SMB workflows or build your own in the drag-and-drop editor. Each one shows exactly what it does before you activate it.',
  },
  {
    step: '03',
    title: 'Go live in 30 minutes',
    desc: 'Lumio starts running immediately. Your dashboard goes live. Your team stops doing things manually.',
  },
]

const AI_FEATURES = [
  { label: 'Lead scoring',        desc: 'Hot / warm / cold classification based on your ICP criteria, updated as new signals arrive.' },
  { label: 'Proposal drafting',   desc: 'Tailored proposals generated from your CRM notes. Not templates — actual context.' },
  { label: 'Invoice chasing',     desc: 'Personalised chase emails that sound human, with tone adjusted by payment history and days overdue.' },
  { label: 'Health scoring',      desc: 'RAG status calculated daily from usage, support, NPS, and engagement signals.' },
  { label: 'Weekly summaries',    desc: 'Plain-English reports generated for finance, support, and pipeline — every Monday, automatically.' },
  { label: 'Recovery planning',   desc: 'When an account turns Red, Claude drafts a personalised recovery plan from account data.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductPage() {
  const [activeDept, setActiveDept] = useState(0)
  const dept = DEPARTMENTS[activeDept]

  return (
    <div style={{ color: '#F9FAFB' }} className="pt-28 pb-20">

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 text-center mb-24">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>The platform</p>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Built for every team{' '}
          <span style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            in your business
          </span>
        </h1>
        <p className="text-lg leading-relaxed mb-4" style={{ color: '#9CA3AF', maxWidth: 580, margin: '0 auto' }}>
          Lumio connects your departments, automates the admin that's eating your team's time, and surfaces the insights that actually matter — without any code.
        </p>
        <p className="text-sm mb-10" style={{ color: '#6B7280', maxWidth: 560, margin: '0 auto 40px' }}>
          Built for growing businesses across <span style={{ color: '#9CA3AF' }}>Professional Services, Education, Healthcare, Recruitment, SaaS</span>, and more. 10 to 500 people.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Book a Demo <ArrowRight size={16} />
          </Link>
          <Link href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>
            See pricing
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>How it works</p>
            <h2 className="text-3xl font-bold">Up and running in under 30 minutes</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-bold mb-4"
                  style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Department breakdown — tabbed */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Departments</p>
          <h2 className="text-3xl font-bold">Purpose-built for every team</h2>
          <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
            Whether you're in professional services, education, healthcare, recruitment, or SaaS — every department works the same way in Lumio.
          </p>
        </div>

        {/* Department tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {DEPARTMENTS.map((d, i) => {
            const Icon = d.icon
            const isActive = i === activeDept
            return (
              <button key={d.label} onClick={() => setActiveDept(i)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? d.color : '#111318',
                  color: isActive ? '#F9FAFB' : '#6B7280',
                  border: `1px solid ${isActive ? d.color : '#1F2937'}`,
                }}>
                <Icon size={14} strokeWidth={1.75} />
                {d.label}
              </button>
            )
          })}
        </div>

        {/* Department content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: description + workflows */}
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: `1px solid ${dept.color}33` }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${dept.color}20` }}>
                <dept.icon size={20} style={{ color: dept.color }} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{dept.label}</h3>
                <p className="text-xs" style={{ color: dept.color }}>
                  {dept.workflows.length} workflows included
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-7" style={{ color: '#9CA3AF' }}>{dept.desc}</p>
            <div className="space-y-3">
              {dept.workflows.map(wf => (
                <div key={wf.name} className="rounded-lg px-4 py-3.5"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch size={13} style={{ color: dept.color, flexShrink: 0 }} />
                    <span className="text-sm font-medium" style={{ color: '#E5E7EB' }}>{wf.name}</span>
                  </div>
                  <p className="text-xs leading-relaxed pl-5" style={{ color: '#6B7280' }}>{wf.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: integrations + metrics */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
                Key integrations for {dept.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {dept.integrations.map(int => (
                  <span key={int} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                    style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
                    {int}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>What you get</p>
              <ul className="space-y-3">
                {[
                  'Live dashboard updated in real time',
                  'Workflows run in the background automatically',
                  'Alerts sent to Slack when action needed',
                  'Full audit trail of every automation',
                  'AI-generated summaries and reports',
                ].map(point => (
                  <li key={point} className="flex items-center gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                    <Check size={14} style={{ color: dept.color, flexShrink: 0 }} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/demo"
              className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: dept.color, color: '#F9FAFB' }}>
              See {dept.label} live in a demo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Partner & Third-Party Dashboards ────────────────────────────────── */}
      <section style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-28">

          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: 'rgba(108,63,197,0.1)', border: '1px solid rgba(108,63,197,0.35)', color: '#A78BFA' }}>
              <LayoutDashboard size={12} strokeWidth={2.5} />
              Partner Dashboards
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
              Beautiful, live dashboards.<br />
              <span style={{ color: '#0D9488' }}>Built for your partners and suppliers.</span>
            </h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: '#9CA3AF', maxWidth: 640, margin: '0 auto' }}>
              Give your partners, funders, and suppliers their own real-time window into the data that matters to them — without a single manual report ever again.
            </p>
            <p className="text-base leading-relaxed" style={{ color: '#6B7280', maxWidth: 660, margin: '0 auto' }}>
              Lumio builds fully custom dashboards for any third-party relationship — government funders, reseller partners, suppliers, investors, or clients. Each dashboard is live, branded, role-gated, and exportable. What used to take your team a week to pull together every month is now available 24/7 at the click of a button.
            </p>
          </div>

          {/* Feature highlights — 2×2 grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-16">
            {[
              {
                icon: Activity,
                color: '#0D9488',
                title: 'Real-time API connection',
                desc: 'Your dashboard pulls live data directly from your systems — HubSpot, Xero, your portal, Snowflake, wherever your data lives. No exports. No manual updates. Always current.',
              },
              {
                icon: FileDown,
                color: '#6C3FC5',
                title: 'One-click PDF reports',
                desc: 'Every dashboard has a built-in Export PDF button. Monthly reports that used to take a week to compile are generated in seconds — perfectly formatted, fully branded.',
              },
              {
                icon: Shield,
                color: '#0D9488',
                title: 'Secure, gated access',
                desc: 'Each partner gets their own login. They only see their data. Fully isolated, fully secure — powered by Supabase Auth with role-based permissions.',
              },
              {
                icon: Sliders,
                color: '#6C3FC5',
                title: 'Built to your exact spec',
                desc: 'Every dashboard is built from scratch for your specific relationship — your metrics, your layout, your branding. Tabbed navigation, charts, trend lines, monthly comparisons, AI highlights — whatever you need.',
              },
            ].map(card => {
              const Icon = card.icon
              return (
                <div key={card.title}
                  className="rounded-xl p-7 transition-all duration-300"
                  style={{ backgroundColor: '#0D0E16', border: `1px solid ${card.color}33` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 32px -8px ${card.color}44`; (e.currentTarget as HTMLDivElement).style.borderColor = `${card.color}66` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.borderColor = `${card.color}33` }}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4"
                    style={{ backgroundColor: `${card.color}18`, border: `1px solid ${card.color}33` }}>
                    <Icon size={20} style={{ color: card.color }} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{card.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Case study callout */}
          <div className="rounded-2xl p-8 md:p-10 mb-16"
            style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937', borderLeft: '4px solid #0D9488' }}>
            <div className="flex items-start gap-3 mb-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
                <LayoutDashboard size={17} style={{ color: '#0D9488' }} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#0D9488' }}>Real example</p>
                <h3 className="text-xl font-black" style={{ color: '#F9FAFB' }}>DfE NELI Programme Dashboard</h3>
              </div>
            </div>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#9CA3AF' }}>
              OxEd &amp; Assessment reports to the Department for Education on the NELI programme — 10,973 registered schools, 50,052 pupils assessed, 76,567 course completions across Academic Year 2025/26. Previously this report took the team one week every month to compile manually. The Lumio DfE dashboard makes every metric available live, 24/7, with monthly trend charts, AI-generated highlights, a full data table, and one-click PDF export. The DfE can log in any time and see exactly where the programme stands — without a single email or spreadsheet.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { val: '10,973',   label: 'Schools' },
                { val: '50,052',   label: 'Pupils Assessed' },
                { val: '76,567',   label: 'Course Completions' },
                { val: '1 wk/mo', label: 'Previously to report' },
                { val: 'Live 24/7', label: 'Now' },
              ].map(s => (
                <div key={s.label} className="rounded-lg px-4 py-4 text-center"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <p className="text-xl font-black mb-0.5" style={{ color: s.label === 'Now' ? '#0D9488' : '#F9FAFB' }}>{s.val}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What's included */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 mb-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#4B5563' }}>What's included</p>
              <ul className="space-y-3">
                {[
                  'Custom design matched to your brand or your partner\'s brand',
                  'Live API data connections — HubSpot, Xero, Snowflake, custom APIs',
                  'Tabbed navigation — Programme Overview, Delivery, Engagement, Trends, Full Data Table',
                  'Interactive charts — bar, line, area, pie — switchable per section',
                  'Month-by-month trend tables with colour-coded changes',
                  'AI-generated key highlights updated each reporting period',
                  'One-click PDF export — boardroom-ready in seconds',
                  'Role-gated secure login — each partner sees only their data',
                  'Mobile responsive — works perfectly on any device',
                  'Hosted on your Lumio platform — no extra infrastructure needed',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
                      <Check size={11} style={{ color: '#0D9488' }} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm leading-snug" style={{ color: '#D1D5DB' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dashboard types */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#4B5563' }}>We build dashboards for every kind of third-party relationship</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { label: 'Government & Funders',  desc: 'Programme performance, spend reporting, KPI tracking for grant-funded programmes', color: '#0D9488' },
                  { label: 'Reseller Partners',      desc: 'Customer health, MRR, commission tracking, referral pipeline', color: '#6C3FC5' },
                  { label: 'Suppliers',              desc: 'Order status, delivery tracking, invoice reconciliation, stock levels', color: '#0D9488' },
                  { label: 'Investors',              desc: 'MRR, ARR, churn, headcount, runway — all live, all accurate', color: '#6C3FC5' },
                  { label: 'Enterprise Clients',     desc: 'Usage reports, SLA compliance, support metrics, ROI tracking', color: '#0D9488' },
                  { label: 'Internal Divisions',     desc: 'Cross-department performance for multi-site or multi-brand businesses', color: '#6C3FC5' },
                ].map(type => (
                  <div key={type.label} className="rounded-lg p-4"
                    style={{ backgroundColor: '#0D0E16', border: `1px solid ${type.color}22` }}>
                    <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{type.label}</p>
                    <p className="text-xs leading-snug" style={{ color: '#6B7280' }}>{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl px-8 py-10 text-center md:text-left md:flex md:items-center md:justify-between gap-8"
            style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(108,63,197,0.12) 100%)', border: '1px solid rgba(13,148,136,0.3)' }}>
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-black mb-2" style={{ color: '#F9FAFB' }}>
                Need a custom dashboard for a partner or funder?
              </h3>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                Tell us what you need — we'll scope it and have a prototype in front of you within 5 working days.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                Request a Dashboard <ArrowRight size={15} />
              </Link>
              <Link href="/dfe"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium whitespace-nowrap"
                style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>
                See the DfE example <ArrowRight size={15} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* AI section */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-start">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(108,63,197,0.15)' }}>
                  <Sparkles size={18} style={{ color: '#A78BFA' }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6C3FC5' }}>
                  Powered by Claude
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-5">
                AI that actually understands context
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: '#9CA3AF' }}>
                Most automation tools just move data from A to B. Lumio uses Claude to understand what the data means — and act on it intelligently. Every AI-powered step is configurable, reviewable, and logged.
              </p>
              <div className="space-y-4">
                {AI_FEATURES.map(f => (
                  <div key={f.label} className="flex gap-4">
                    <ChevronRight size={16} style={{ color: '#6C3FC5', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: '#E5E7EB' }}>{f.label}</p>
                      <p className="text-sm" style={{ color: '#6B7280' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Mock AI insight panel */}
            <div>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(108,63,197,0.3)' }}>
                <div className="px-5 py-3 flex items-center justify-between"
                  style={{ backgroundColor: 'rgba(108,63,197,0.12)', borderBottom: '1px solid rgba(108,63,197,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} style={{ color: '#A78BFA' }} />
                    <span className="text-xs font-semibold" style={{ color: '#A78BFA' }}>AI Insights — this week</span>
                  </div>
                  <span className="text-xs" style={{ color: '#4B5563' }}>Updated 06:00 today</span>
                </div>
                <div className="p-5 space-y-3" style={{ backgroundColor: '#09090F' }}>
                  {[
                    { label: 'Churn risk', color: '#EF4444', text: '3 accounts showing reduced login activity in the last 14 days. Renewal within 60 days. Recommend proactive outreach this week.' },
                    { label: 'Pipeline gap', color: '#F59E0B', text: 'Q4 pipeline is 23% below target. October MQL volume was down — check campaign spend and MQL handoff speed.' },
                    { label: 'Quick win', color: '#0D9488', text: '2 invoices overdue by 30+ days totalling £8,400. Auto-chase sent. Recommend a personal call to both contacts.' },
                    { label: 'HR flag', color: '#6C3FC5', text: '1 new joiner starting Monday. M365 account provisioned. Equipment delivery confirmed for Friday.' },
                  ].map(insight => (
                    <div key={insight.label} className="rounded-lg p-4" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${insight.color}18`, color: insight.color }}>
                          {insight.label}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Library */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Workflow Library</p>
            <h2 className="text-3xl font-bold mb-5">47+ workflows, ready to run</h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#6B7280' }}>
              Every workflow is pre-built for growing businesses. Pick one, connect your tools, and it's live. No developer. No Zapier expert. No waiting.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
              Or build your own in the visual editor. Workflows are version-controlled, testable in staging, and fully audited in production.
            </p>
          </div>
          <div className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#4B5563' }}>Sample from the library</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                'New hire onboarding', 'Deal Won → invoice', 'Invoice chasing', 'Lead scoring',
                'SLA escalation', 'Proposal generation', 'RAG health score', 'QBR prep',
                'MQL handoff', 'Offboarding', 'Equipment order', 'Event follow-up',
                'Renewal alert', 'Lost deal re-engage', 'CSAT survey', 'Weekly report',
              ].map(wf => (
                <div key={wf} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                  style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#0D9488', flexShrink: 0, display: 'inline-block' }} />
                  {wf}
                </div>
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: '#4B5563' }}>+ 31 more in the full library</p>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Integrations</p>
            <h2 className="text-3xl font-bold">Works with the tools you already use</h2>
            <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>
              Native integrations that connect in minutes. No webhook configuration. No API docs to read.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
            {INTEGRATIONS.map(int => (
              <div key={int.name} className="rounded-xl px-3 py-4 text-center"
                style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <p className="text-sm font-medium mb-1" style={{ color: '#D1D5DB' }}>{int.name}</p>
                <p className="text-xs" style={{ color: '#4B5563' }}>{int.category}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-6" style={{ color: '#4B5563' }}>+ 24 more coming in 2025–26</p>
        </div>
      </section>

      {/* Security & compliance */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Security</p>
          <h2 className="text-3xl font-bold">Built with your data in mind</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { emoji: '🔒', title: 'GDPR compliant', desc: 'Data processed and stored in the UK and EU. Data processing agreements available for all customers.' },
            { emoji: '🛡️', title: 'SOC 2 alignment', desc: 'Infrastructure designed to meet SOC 2 Type II requirements. Security questionnaire available on request.' },
            { emoji: '🔑', title: 'SSO & SCIM', desc: 'Microsoft and Google SSO included on Enterprise plans. SCIM provisioning available for large orgs.' },
            { emoji: '📋', title: 'Full audit logs', desc: 'Every workflow run, every AI action, every data access — logged and searchable. Forever.' },
            { emoji: '🏢', title: 'Business data expertise', desc: 'We understand your operational data, compliance requirements, and the regulatory landscape. Built for real business processes, not generic assumptions.' },
            { emoji: '⚡', title: '99.9% uptime SLA', desc: 'Enterprise plans include a contractual SLA. Status page publicly available at all times.' },
          ].map(item => (
            <div key={item.title} className="rounded-xl p-6" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="text-2xl mb-3">{item.emoji}</div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-5">See it in action</h2>
          <p className="text-base mb-8" style={{ color: '#6B7280' }}>
            30-minute demo. We'll walk you through the platform with workflows relevant to your team.
          </p>
          <Link href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Book a Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  )
}
