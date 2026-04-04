'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Users, Shield, Activity, TrendingUp,
  Server, Calendar, Check, ChevronRight, GitBranch,
  Sparkles, Zap, LayoutDashboard, FileDown, Sliders,
} from 'lucide-react'

const MODULES = [
  {
    icon: Users,
    label: 'Attendance',
    color: '#0D9488',
    desc: 'From the morning register to persistent absence — every step automated. Parents notified in 60 seconds. DSL alerted if no response. Weekly and termly reports generated without anyone touching a spreadsheet.',
    workflows: [
      { name: 'Morning Register Trigger',   detail: 'Absence marked → parent SMS and email sent within 60 seconds, school-branded.' },
      { name: 'No-Response Escalation',     detail: "Parent doesn't reply by 9:30am → DSL automatically alerted." },
      { name: 'Persistent Absence Flag',    detail: 'Pupil hits 90% threshold → HoY and SENCO notified automatically.' },
      { name: 'Weekly Attendance Report',   detail: 'Auto-generated every Monday at 7am, ready for SLT.' },
      { name: 'Governor Attendance Digest', detail: 'Termly summary formatted for governors — no manual compilation.' },
      { name: 'Year Group Trend Report',    detail: 'Monthly breakdown by year group with traffic light indicators.' },
    ],
    integrations: ['SIMS', 'Arbor', 'Bromcom', 'iSAMS', 'ParentMail', 'Weduc'],
  },
  {
    icon: Shield,
    label: 'Safeguarding',
    color: '#6C3FC5',
    desc: 'Log concerns in 45 seconds. DSL notified instantly. EHCP review dates never missed. Ofsted evidence generated in 30 seconds. Every action timestamped, every pattern detected automatically.',
    workflows: [
      { name: 'Concern Log Submission',          detail: '45-second logging from any device, structured and timestamped.' },
      { name: 'DSL Instant Notification',        detail: 'Push, email and in-app alert on every concern logged.' },
      { name: 'Multi-Agency Referral Tracker',   detail: 'Log and track all external referrals with status updates.' },
      { name: 'EHCP Review Reminder',            detail: 'Automated reminder 6 weeks before review date, with draft agenda.' },
      { name: 'Ofsted Export Generator',         detail: 'Filtered audit trail in 30 seconds — ready for inspection.' },
      { name: 'Pattern Detection Alert',         detail: 'Flags repeated concern patterns for a pupil automatically.' },
    ],
    integrations: ['MyConcern', 'CPOMS', 'Edukey', 'EHM / LCS', 'Microsoft 365', 'Google Workspace'],
  },
  {
    icon: Activity,
    label: 'SEND & Inclusion',
    color: '#3B82F6',
    desc: 'Centralised SEND records, EHCP tracking, and graduated approach monitoring — all in one place. Annual reviews auto-scheduled. External agency contacts logged. Intervention impact measured.',
    workflows: [
      { name: 'SEND Pupil Profile',           detail: 'Centralised record for each SEND pupil — needs, strategies, contacts.' },
      { name: 'Graduated Approach Tracker',   detail: 'Assess, Plan, Do, Review cycle tracked and documented automatically.' },
      { name: 'EHCP Milestone Tracker',       detail: 'Tracks all actions and deadlines, alerts when behind.' },
      { name: 'Annual Review Scheduler',      detail: 'Auto-schedules reviews, sends invites, and chases responses.' },
      { name: 'Intervention Tracking',        detail: 'Logs and measures impact of every intervention.' },
      { name: 'SEN Register Summary',         detail: 'Live count and category breakdown, always up to date.' },
    ],
    integrations: ['Provision Map', 'SIMS SEN', 'Arbor SEND', 'Edukey', 'EHM / LCS'],
  },
  {
    icon: TrendingUp,
    label: 'Reporting',
    color: '#F59E0B',
    desc: 'AI-generated governor reports. Ofsted self-evaluation data pulled automatically. Weekly headteacher digest delivered every Monday. LA submission packs produced on demand. No more Friday afternoon spreadsheets.',
    workflows: [
      { name: 'AI Morning Briefing',          detail: 'Daily school summary at 7:00am — attendance, safeguarding, cover, and open actions.' },
      { name: 'Weekly Headteacher Digest',    detail: 'Key metrics every Monday. Automatically generated and formatted.' },
      { name: 'Governor Termly Report',       detail: 'Auto-formatted, KCSiE-aligned, ready to share with the governing body.' },
      { name: 'LA Submission Pack',           detail: 'Generates required local authority reports from live data.' },
      { name: 'Ofsted Self-Evaluation Data',  detail: 'Pulls key data for SEF completion — attendance, outcomes, SEND, exclusions.' },
      { name: 'Pupil Premium Tracker',        detail: 'Monitors outcomes for PP cohort against non-PP peers.' },
    ],
    integrations: ['FFT Aspire', 'SISRA', 'Target Tracker', 'SIMS Assessment', 'Microsoft 365'],
  },
  {
    icon: Server,
    label: 'Operations',
    color: '#22C55E',
    desc: 'DBS renewals flagged 3 months ahead. Policy reviews never missed. Staff CPD tracked with expiry reminders. Budget thresholds alerted automatically. The operational admin that used to live in someone\'s head, now fully automated.',
    workflows: [
      { name: 'DBS Renewal Tracker',       detail: 'Flags staff DBS renewals 3 months ahead — never on the wrong side of compliance.' },
      { name: 'Policy Review Reminder',    detail: 'Alerts when a school policy is due for review, with owner assigned.' },
      { name: 'Staff CPD Tracker',         detail: 'Logs all training with automatic expiry reminders.' },
      { name: 'Budget Alert',              detail: 'Notifies SBM when spend exceeds threshold.' },
      { name: 'Term Dates Calendar Sync',  detail: 'Auto-syncs key dates across all staff systems.' },
      { name: 'Premises Maintenance Log',  detail: 'Log and track facilities issues with escalation workflow.' },
    ],
    integrations: ['Microsoft 365', 'Google Workspace', 'IRIS', 'PS Financials', 'Every'],
  },
  {
    icon: Calendar,
    label: 'Supply Cover',
    color: '#EC4899',
    desc: 'Staff absence triggers the cover process automatically. Preferred agencies contacted in order. Uncovered lessons flagged to the headteacher by 8am. Cover spend tracked by agency, by term.',
    workflows: [
      { name: 'Staff Absence Trigger',     detail: 'Cover process starts the moment absence is logged — no calls needed.' },
      { name: 'Agency Contact Sequence',   detail: 'Contacts preferred agencies in order until cover is confirmed.' },
      { name: 'Uncovered Lesson Alert',    detail: "Headteacher notified if cover isn't confirmed by 8am." },
      { name: 'Cover Confirmation Log',    detail: 'Logs confirmation automatically — who, when, which class.' },
      { name: 'Cover Spend Tracker',       detail: 'Running cost per agency, per term — SBM always has the number.' },
      { name: 'Agency Reliability Report', detail: 'Rates agencies by response time and fill rate over the year.' },
    ],
    integrations: ['Supply Desk', 'Microsoft 365', 'SIMS', 'Every', 'Google Workspace'],
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect your MIS',
    desc: 'Authorise SIMS, Arbor, Bromcom, or iSAMS in a few clicks. Live two-way sync from day one. No developer, no spreadsheet export.',
  },
  {
    step: '02',
    title: 'Activate your workflows',
    desc: 'Browse 12 pre-built school workflows — from absence alerts to governor reports. Each one shows exactly what it does before you switch it on.',
  },
  {
    step: '03',
    title: 'Save hours every week',
    desc: 'Lumio runs in the background. Your team stops chasing, compiling, and re-entering. You get the time back.',
  },
]

const AI_FEATURES = [
  { label: 'Morning briefing',        desc: 'Headteacher receives a plain-English summary every morning at 7am — attendance, safeguarding, cover gaps, open actions.' },
  { label: 'Concern pattern detection', desc: 'Repeated concerns logged for a pupil are automatically flagged, with a summary of the pattern sent to the DSL.' },
  { label: 'Governor report drafting', desc: 'Termly governor report drafted from live data — attendance trends, SEND update, exclusions, compliance checklist.' },
  { label: 'Absence parent messaging', desc: 'School-branded parent messages personalised per pupil. Not a generic template — actual context from the register.' },
  { label: 'SEN progress summaries',   desc: 'Intervention impact summarised automatically from tracking data, ready for annual reviews and parent meetings.' },
  { label: 'Ofsted preparation',       desc: 'Pulls the data Ofsted typically requests — safeguarding audit trail, attendance by cohort, EHCP compliance — in seconds.' },
  { label: 'Insights always-on',      desc: 'Attendance trend chart, pupil progress by year group, Ofsted readiness gauge, SEND by need type donut, budget utilisation bars — no demo gate, always available.' },
  { label: 'Google Workspace + Microsoft 365 SSO', desc: 'Staff sign in with existing school accounts. No separate passwords. Phase 1 with full provider configuration.' },
  { label: '8 role-based views',       desc: 'Headteacher, Trust Lead, Head of Year, Teacher, SEN/SENCO, Safeguarding, Pupil Premium, Inspections — each with tailored KPIs and AI highlights.' },
  { label: 'AI-powered overview tabs', desc: 'Quick Wins, Daily Tasks, Don\'t Miss — AI-generated from your school data, always showing, with personalised greeting using authenticated user name.' },
  { label: 'SLT Suite',               desc: 'Executive dashboard with attendance, safeguarding, SEND, staff, finance, school improvement, and governance — all in 8 tabs.' },
]

const MIS_INTEGRATIONS = [
  { name: 'SIMS',             category: 'MIS' },
  { name: 'Arbor',            category: 'MIS' },
  { name: 'Bromcom',          category: 'MIS' },
  { name: 'iSAMS',            category: 'MIS' },
  { name: 'ScholarPack',      category: 'MIS' },
  { name: 'MyConcern',        category: 'Safeguarding' },
  { name: 'CPOMS',            category: 'Safeguarding' },
  { name: 'ParentMail',       category: 'Comms' },
  { name: 'Weduc',            category: 'Comms' },
  { name: 'Microsoft 365',    category: 'Productivity' },
  { name: 'Google Workspace', category: 'Productivity' },
  { name: 'IRIS',             category: 'HR / Finance' },
  { name: 'PS Financials',    category: 'Finance' },
  { name: 'Supply Desk',      category: 'Cover' },
  { name: 'FFT Aspire',       category: 'Assessment' },
  { name: 'SISRA',            category: 'Assessment' },
]

export default function SchoolsProductPage() {
  const [activeMod, setActiveMod] = useState(0)
  const mod = MODULES[activeMod]

  return (
    <div style={{ color: '#F9FAFB' }} className="pt-28 pb-20">

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 text-center mb-24">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Lumio for Schools</p>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Built for every team{' '}
          <span style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            in your school
          </span>
        </h1>
        <p className="text-base font-medium mb-6" style={{ color: '#0D9488', maxWidth: 580, margin: '0 auto' }}>
          Your school, fully connected.
        </p>
        <p className="text-xl leading-relaxed mb-4" style={{ color: '#9CA3AF', maxWidth: 580, margin: '0 auto' }}>
          Lumio connects your MIS, safeguarding tools, and communication platforms — automating the admin that eats your team&apos;s time and surfacing the data that matters.
        </p>
        <p className="text-xl mb-10" style={{ color: '#9CA3AF', maxWidth: 560, margin: '0 auto 40px' }}>
          Built for primary, secondary, and MAT leadership. From 200 to 2,000 pupils.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/signup?portal=schools"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)', color: '#F9FAFB' }}>
            Start Free Trial <ArrowRight size={16} />
          </Link>
          <Link href="https://calendly.com/lumiocms/lumio-schools"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>
            Book a Demo
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
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-bold mb-4"
                  style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-base leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module breakdown — tabbed */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Modules</p>
          <h2 className="text-3xl font-bold">Purpose-built for every school team</h2>
          <p className="mt-4 text-base" style={{ color: '#6B7280' }}>
            Whether you&apos;re in attendance, safeguarding, SEND, or SLT — every module works together in Lumio.
          </p>
        </div>

        {/* Module tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {MODULES.map((m, i) => {
            const Icon = m.icon
            const isActive = i === activeMod
            return (
              <button key={m.label} onClick={() => setActiveMod(i)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? m.color : '#111318',
                  color: isActive ? '#F9FAFB' : '#6B7280',
                  border: `1px solid ${isActive ? m.color : '#1F2937'}`,
                }}>
                <Icon size={14} strokeWidth={1.75} />
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Module content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: description + workflows */}
          <div className="rounded-xl p-8" style={{ backgroundColor: '#0D0E16', border: `1px solid ${mod.color}33` }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${mod.color}20` }}>
                <mod.icon size={20} style={{ color: mod.color }} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{mod.label}</h3>
                <p className="text-xs" style={{ color: mod.color }}>
                  {mod.workflows.length} workflows included
                </p>
              </div>
            </div>
            <p className="text-base leading-relaxed mb-7" style={{ color: '#9CA3AF' }}>{mod.desc}</p>
            <div className="space-y-3">
              {mod.workflows.map(wf => (
                <div key={wf.name} className="rounded-lg px-4 py-3.5"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch size={13} style={{ color: mod.color, flexShrink: 0 }} />
                    <span className="text-sm font-medium" style={{ color: '#E5E7EB' }}>{wf.name}</span>
                  </div>
                  <p className="text-sm leading-relaxed pl-5" style={{ color: '#6B7280' }}>{wf.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: integrations + what you get */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>
                Key integrations for {mod.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {mod.integrations.map(int => (
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
                  'Workflows run automatically — no one needs to trigger them',
                  'Alerts sent to the right person instantly',
                  'Full audit trail of every action — Ofsted-ready',
                  'AI-generated summaries, reports, and communications',
                ].map(point => (
                  <li key={point} className="flex items-center gap-3 text-base" style={{ color: '#D1D5DB' }}>
                    <Check size={14} style={{ color: mod.color, flexShrink: 0 }} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/signup?portal=schools"
              className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: mod.color, color: '#F9FAFB' }}>
              Start your free trial <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Ofsted Dashboards */}
      <section style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-28">

          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.35)', color: '#0D9488' }}>
              <LayoutDashboard size={12} strokeWidth={2.5} />
              Trust &amp; Governor Dashboards
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight">
              Live dashboards for governors,<br />
              <span style={{ color: '#0D9488' }}>trusts, and the LA.</span>
            </h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: '#9CA3AF', maxWidth: 640, margin: '0 auto' }}>
              Give your governors, trust leadership, and local authority their own real-time window into school performance — without a single manual report ever again.
            </p>
            <p className="text-base leading-relaxed" style={{ color: '#6B7280', maxWidth: 660, margin: '0 auto' }}>
              Lumio builds fully custom dashboards for MAT executive teams, governing bodies, and LA reporting — pulling live data from your MIS, safeguarding tools, and finance systems. What used to take your SBM two days to compile is now available 24/7 at the click of a button.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-16">
            {[
              {
                icon: Activity,
                color: '#0D9488',
                title: 'Real-time MIS connection',
                desc: 'Your dashboard pulls live data from SIMS, Arbor, or Bromcom — attendance, SEND register, exclusions, staffing. No exports. No manual updates. Always current.',
              },
              {
                icon: FileDown,
                color: '#6C3FC5',
                title: 'One-click Ofsted packs',
                desc: 'Every dashboard has a built-in Export PDF button. The evidence pack that used to take three days to compile is generated in seconds — Ofsted-formatted, fully up to date.',
              },
              {
                icon: Shield,
                color: '#0D9488',
                title: 'Role-gated secure access',
                desc: 'Governors see governance data. Trust executives see the MAT view. LA contacts see only what they need. Fully isolated, fully GDPR-compliant.',
              },
              {
                icon: Sliders,
                color: '#6C3FC5',
                title: 'Built for your exact reporting needs',
                desc: 'MAT benchmarking, governor committee packs, Ofsted self-evaluation, LA returns — every dashboard is built to your spec, with your data, in your format.',
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
                  <p className="text-base leading-relaxed" style={{ color: '#9CA3AF' }}>{card.desc}</p>
                </div>
              )
            })}
          </div>

          {/* What's included + dashboard types */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 mb-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#4B5563' }}>What&apos;s included</p>
              <ul className="space-y-3">
                {[
                  'Custom design matched to your school or trust brand',
                  'Live MIS data connections — SIMS, Arbor, Bromcom, iSAMS',
                  'Tabbed navigation — Attendance, Safeguarding, SEND, Finance, Staffing',
                  'Interactive charts — attendance trends, cohort comparisons, term-by-term',
                  'AI-generated key highlights updated each reporting period',
                  'One-click PDF export — governor-pack ready in seconds',
                  'Role-gated secure login — governors see only their school\'s data',
                  'Ofsted evidence trail — filtered, sorted, and formatted on demand',
                  'Mobile responsive — works perfectly on any device',
                  'Hosted on your Lumio platform — no extra infrastructure needed',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
                      <Check size={11} style={{ color: '#0D9488' }} strokeWidth={2.5} />
                    </div>
                    <span className="text-base leading-snug" style={{ color: '#D1D5DB' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#4B5563' }}>We build dashboards for every audience</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { label: 'Governing Bodies',    desc: 'Attendance, safeguarding compliance, budget summary, exclusions — formatted for committee meetings', color: '#0D9488' },
                  { label: 'MAT Executive Teams', desc: 'Cross-school benchmarking, trust-wide attendance, SEND register totals, staffing overview', color: '#6C3FC5' },
                  { label: 'Local Authorities',   desc: 'SEND returns, attendance summaries, exclusion data — in the format they require', color: '#0D9488' },
                  { label: 'Ofsted Preparation',  desc: 'Self-evaluation evidence, safeguarding audit trail, pupil outcomes — ready in minutes', color: '#6C3FC5' },
                  { label: 'SLT Weekly Reviews',  desc: 'Headteacher, deputy, SENCO, SBM — each gets the view relevant to their role', color: '#0D9488' },
                  { label: 'External Funders',    desc: 'Pupil premium outcomes, SEND intervention impact, programme data — live and exportable', color: '#6C3FC5' },
                ].map(type => (
                  <div key={type.label} className="rounded-lg p-4"
                    style={{ backgroundColor: '#0D0E16', border: `1px solid ${type.color}22` }}>
                    <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{type.label}</p>
                    <p className="text-sm leading-snug" style={{ color: '#6B7280' }}>{type.desc}</p>
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
                Need a custom dashboard for your governors or trust?
              </h3>
              <p className="text-base" style={{ color: '#9CA3AF' }}>
                Tell us what you need — we&apos;ll scope it and have a prototype in front of you within 5 working days.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link href="https://calendly.com/lumiocms/lumio-schools"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold whitespace-nowrap"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                Request a Dashboard <ArrowRight size={15} />
              </Link>
              <Link href="/schools/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium whitespace-nowrap"
                style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>
                See pricing <ArrowRight size={15} />
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
                AI that understands your school
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: '#9CA3AF' }}>
                Lumio uses Claude to understand your school&apos;s data — not just move it. Every morning briefing, concern summary, and governor report is generated from your actual data, not a template.
              </p>
              <div className="space-y-4">
                {AI_FEATURES.map(f => (
                  <div key={f.label} className="flex gap-4">
                    <ChevronRight size={16} style={{ color: '#6C3FC5', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: '#E5E7EB' }}>{f.label}</p>
                      <p className="text-base" style={{ color: '#6B7280' }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock AI morning briefing panel */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.3)' }}>
              <div className="px-5 py-3 flex items-center justify-between"
                style={{ backgroundColor: 'rgba(13,148,136,0.12)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles size={13} style={{ color: '#0D9488' }} />
                  <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>AI Morning Briefing — today</span>
                </div>
                <span className="text-xs" style={{ color: '#4B5563' }}>Generated 07:00</span>
              </div>
              <div className="p-5 space-y-3" style={{ backgroundColor: '#09090F' }}>
                {[
                  { label: 'Attendance',   color: '#F59E0B', text: 'Overall attendance today is 94.2% — below the 96% target. Year 4 has 3 unexplained absences with no parent response. DSL has been notified.' },
                  { label: 'Safeguarding', color: '#EF4444', text: '1 new concern logged yesterday by Year 6 class teacher. Categorised as emotional wellbeing. DSL reviewed at 08:15. No further action required today.' },
                  { label: 'Supply Cover', color: '#6C3FC5', text: '2 staff absent today. Cover confirmed for both classes. Supply from Premier Education confirmed at 07:45. Cover spend this term: £1,840.' },
                  { label: 'Actions',      color: '#0D9488', text: '3 open actions: EHCP review for Thomas B. overdue by 4 days. Online safety policy review due Friday. DBS renewal for M. Patel — 8 days remaining.' },
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
      </section>

      {/* Workflow Library */}
      <section id="workflows" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Workflow Library</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-5">
            12 workflows. 6 modules.<br />
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Every part of your school, automated.
            </span>
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: '#6B7280', maxWidth: 620, margin: '0 auto 40px' }}>
            From the morning register to the termly governor report — Lumio has a workflow for it. Built for schools, activated in minutes, running every day.
          </p>
          <div className="inline-grid grid-cols-3 gap-px rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(13,148,136,0.3)', backgroundColor: 'rgba(13,148,136,0.15)' }}>
            {[
              { value: '12', label: 'Workflows' },
              { value: '6',  label: 'Modules' },
              { value: '∞',  label: 'Custom workflows' },
            ].map(s => (
              <div key={s.label} className="px-10 py-6 text-center" style={{ backgroundColor: '#0D0E16' }}>
                <div className="text-4xl font-black mb-1"
                  style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.value}
                </div>
                <div className="text-xs font-medium" style={{ color: '#6B7280' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-6 text-center" style={{ color: '#4B5563' }}>Every team covered</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {[
              { emoji: '📵', name: 'Attendance',       count: 9, color: '#0D9488' },
              { emoji: '🛡',  name: 'Safeguarding',    count: 9, color: '#6C3FC5' },
              { emoji: '🎓', name: 'SEND & Inclusion', count: 6, color: '#3B82F6' },
              { emoji: '📊', name: 'Reporting',        count: 9, color: '#F59E0B' },
              { emoji: '🏫', name: 'Operations',       count: 6, color: '#22C55E' },
              { emoji: '📋', name: 'Supply Cover',     count: 6, color: '#EC4899' },
            ].map(d => (
              <div key={d.name} className="rounded-xl p-4 flex flex-col items-center text-center"
                style={{ backgroundColor: '#0D0E16', border: `1px solid ${d.color}33` }}>
                <div className="text-2xl mb-1.5">{d.emoji}</div>
                <div className="text-xs font-semibold leading-snug mb-1" style={{ color: '#D1D5DB' }}>{d.name}</div>
                <div className="text-xs font-bold" style={{ color: d.color }}>{d.count} workflows</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-7 mb-10" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#0D9488' }}>How it works</p>
          <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
            Each workflow is engineered, tested, and maintained for you. Activate in your dashboard. That&apos;s it. No code. No setup calls. No spreadsheets.
          </p>
        </div>

        <div className="text-center">
          <Link href="/schools/workflows"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            See all 12 workflows <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Integrations</p>
            <h2 className="text-3xl font-bold">Works with the tools your school already uses</h2>
            <p className="mt-4 text-base" style={{ color: '#6B7280' }}>
              Native integrations with every major MIS, safeguarding platform, and comms tool. Connects in minutes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
            {MIS_INTEGRATIONS.map(int => (
              <div key={int.name} className="rounded-xl px-3 py-4 text-center"
                style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <p className="text-sm font-medium mb-1" style={{ color: '#D1D5DB' }}>{int.name}</p>
                <p className="text-xs" style={{ color: '#4B5563' }}>{int.category}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-6" style={{ color: '#4B5563' }}>+ more MIS and edtech integrations added monthly</p>
        </div>
      </section>

      {/* Data & Compliance */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>Data &amp; Compliance</p>
          <h2 className="text-3xl font-bold">Built for UK schools</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { emoji: '🔒', title: 'UK data centres',      desc: 'All pupil and staff data is processed and stored in the UK. GDPR-compliant by design. Data processing agreements provided.' },
            { emoji: '🛡️', title: 'KCSiE aligned',        desc: 'Safeguarding workflows are built to align with Keeping Children Safe in Education. Updated annually with statutory guidance.' },
            { emoji: '🏫', title: 'School data expertise', desc: 'We understand SIMS exports, SEND registers, safeguarding records, and governor reporting — built for schools, not adapted from business software.' },
            { emoji: '📋', title: 'Full audit trail',      desc: 'Every workflow run, every AI action, every data access — logged and searchable. Ofsted-ready evidence at any time.' },
            { emoji: '🔑', title: 'Role-based access',     desc: 'SENCO sees SEND data. DSL sees safeguarding. SBM sees finance. Every user sees only what they need.' },
            { emoji: '⚡', title: '99.9% uptime SLA',      desc: 'School-hours reliability guaranteed. Status page publicly available. Critical workflows are monitored 24/7.' },
          ].map(item => (
            <div key={item.title} className="rounded-xl p-6" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="text-2xl mb-3">{item.emoji}</div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>{item.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: '#6B7280' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-5">See it in action</h2>
          <p className="text-lg mb-8" style={{ color: '#6B7280' }}>
            30-minute demo. We&apos;ll walk you through the platform with workflows relevant to your school.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup?portal=schools"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #0D9488, #0F766E)', color: '#F9FAFB' }}>
              Start Free Trial <ArrowRight size={16} />
            </Link>
            <Link href="https://calendly.com/lumiocms/lumio-schools"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium"
              style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}>
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
