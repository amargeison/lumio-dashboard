'use client'

// NOTE: The (website)/layout.tsx renders a site-wide footer. This page also
// renders a schools-specific footer as the final section, as requested.

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, Users, Heart, DollarSign, BookOpen, Wrench, UserPlus,
  Shield, Check, AlertTriangle, Sparkles, FileText, CheckCircle,
  ChevronDown, Twitter, Linkedin, ArrowRight,
} from 'lucide-react'

// ─── Department Data ──────────────────────────────────────────────────────────

const DEPARTMENTS = [
  {
    name: 'School Office',
    icon: Building2,
    tagline: 'Admissions, letters, trips, absence logging — automated.',
    description:
      'The school office handles a huge volume of daily admin. Lumio automates the repetitive tasks so your office manager can focus on the things that actually need a human.',
    workflows: ['New pupil admission', 'Parent communication blast', 'Trip permission tracker'],
  },
  {
    name: 'HR & Staff',
    icon: Users,
    tagline: "Cover booking, DBS tracking, onboarding — done before you've had your coffee.",
    description:
      'From the moment a staff member is absent to the moment their replacement is confirmed, Lumio handles it. DBS renewals are tracked and flagged automatically.',
    workflows: ['Supply cover booking', 'DBS renewal tracker', 'New staff onboarding'],
  },
  {
    name: 'SEND & DSL',
    icon: Heart,
    tagline: 'Concern logs, EHCP reviews, safeguarding referrals — timestamped and audit-ready.',
    description:
      'Every safeguarding concern logged through Lumio is timestamped, routed to the DSL, and stored in a fully auditable trail. EHCP annual reviews are tracked automatically.',
    workflows: ['Safeguarding concern logger', 'EHCP annual review', 'Persistent absence escalation'],
  },
  {
    name: 'Finance',
    icon: DollarSign,
    tagline: 'Budget monitoring, invoice approval, grant tracking — no more spreadsheet hell.',
    description:
      'Lumio keeps your budget in check without you needing to dig through spreadsheets. Invoice approvals flow to the right people automatically, and grants are tracked end-to-end.',
    workflows: ['Budget monitoring report', 'Invoice approval flow', 'Grant tracking'],
  },
  {
    name: 'Curriculum',
    icon: BookOpen,
    tagline: 'Cover work, parents\' evenings, progress alerts — less admin, more teaching.',
    description:
      'When cover is needed, Lumio generates appropriate cover work using AI. Parents\' evening booking is automated, and pupil progress alerts go out without staff lifting a finger.',
    workflows: ['AI cover work generator', 'Parent consultation booking', 'Pupil progress alert'],
  },
  {
    name: 'Facilities',
    icon: Wrench,
    tagline: 'Maintenance requests, compliance certs, room bookings — nothing falls through the cracks.',
    description:
      'Maintenance requests are logged, assigned and tracked from submission to resolution. Compliance certificates are monitored and renewals flagged well in advance.',
    workflows: ['Maintenance request tracker', 'Compliance certificate tracker', 'H&S inspection'],
  },
  {
    name: 'Admissions & Marketing',
    icon: UserPlus,
    tagline: 'Prospective parent journey, open days, waiting list — all automated.',
    description:
      'From first enquiry to first day, Lumio automates the entire prospective parent journey. Open day bookings, follow-ups, and waiting list management run without manual input.',
    workflows: ['Prospective parent journey', 'Open day coordinator', 'Waiting list manager'],
  },
  {
    name: 'Safeguarding',
    icon: Shield,
    tagline: 'KCSIE compliance, concern tracking, Ofsted readiness — always inspection-ready.',
    description:
      'Lumio monitors your safeguarding compliance against KCSIE daily. When Ofsted calls, your evidence is already organised. DSL review schedules run automatically.',
    workflows: ['KCSIE compliance checker', 'Ofsted readiness checker', 'DSL review tracker'],
  },
]

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section style={{ backgroundColor: '#07080F' }} className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div style={{ flex: '0 0 55%' }}>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}
            >
              <Building2 size={15} />
              Lumio for Schools
            </div>

            {/* Headline */}
            <h1
              className="font-black leading-tight mb-5"
              style={{ color: '#F9FAFB', fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}
            >
              Your school, fully connected.
            </h1>

            {/* Subheadline */}
            <p className="text-xl leading-relaxed mb-8" style={{ color: '#9CA3AF' }}>
              Lumio automates the admin that's eating your staff's time — from absence
              alerts and cover booking to safeguarding logs and governor reports. All in
              one dashboard.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-4 flex-wrap mb-5">
              <Link
                href="/schools/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{
                  background: 'linear-gradient(135deg,#0D9488,#0F766E)',
                  color: '#F9FAFB',
                }}
              >
                Start free trial <ArrowRight size={15} />
              </Link>
              <Link
                href="/schools/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}
              >
                See it in action
              </Link>
            </div>

            {/* Trust bar */}
            <p className="text-sm" style={{ color: '#6B7280' }}>
              ✓ 14-day free trial &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ GDPR compliant &nbsp;·&nbsp; ✓ UK data centres
            </p>
          </div>

          {/* Right — mock dashboard */}
          <div style={{ flex: '0 0 45%' }}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: '1px solid #1F2937',
                boxShadow: '0 0 80px rgba(13,148,136,0.15)',
                backgroundColor: '#111318',
              }}
            >
              {/* Portal header */}
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0D1117' }}
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg"
                  style={{ backgroundColor: 'rgba(13,148,136,0.2)' }}
                >
                  <Building2 size={14} style={{ color: '#0D9488' }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
                  Oakridge Primary
                </span>
                <span
                  className="ml-auto text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}
                >
                  Live
                </span>
              </div>

              <div className="flex">
                {/* Mini sidebar */}
                <div
                  className="flex flex-col gap-3 px-3 py-5"
                  style={{ borderRight: '1px solid #1F2937', minWidth: 44 }}
                >
                  {[0, 1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: i === 0 ? '#0D9488' : '#1F2937' }}
                    />
                  ))}
                </div>

                {/* Main dashboard area */}
                <div className="flex-1 p-5 flex flex-col gap-4">
                  {/* Stat cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Absences', value: '14' },
                      { label: 'DBS due', value: '3' },
                      { label: 'Workflows', value: '6' },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="rounded-xl p-3"
                        style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}
                      >
                        <p
                          className="text-xl font-black leading-none mb-1"
                          style={{ color: '#0D9488' }}
                        >
                          {stat.value}
                        </p>
                        <p className="text-xs" style={{ color: '#6B7280' }}>
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Alert strip */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
                  >
                    <span>⚠</span>
                    <span>SG-2026-047 · DSL review overdue</span>
                  </div>

                  {/* Mini activity rows */}
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Cover booked — Y4 Maths', time: '08:14' },
                      { label: 'DBS renewal sent — J. Martin', time: '07:52' },
                      { label: 'Parent letter dispatched', time: '07:30' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          {item.label}
                        </span>
                        <span className="text-xs" style={{ color: '#4B5563' }}>
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12"
          style={{ borderTop: '1px solid #1F2937' }}
        >
          {[
            { number: '75+', label: 'pre-built workflows' },
            { number: '10', label: 'departments covered' },
            { number: 'Days', label: 'to get up and running' },
            { number: 'UK', label: 'data centres' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p
                className="text-4xl font-black leading-none mb-2"
                style={{ color: '#0D9488' }}
              >
                {stat.number}
              </p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Problem Section ──────────────────────────────────────────────────────────

function ProblemSection() {
  const cards = [
    {
      heading: 'Your admin team is drowning',
      body: 'One person managing absences, letters, admissions, trips and cover — all on disconnected systems.',
    },
    {
      heading: 'Safeguarding paperwork takes hours',
      body: 'Logging concerns, chasing DSL sign-offs, maintaining audit trails — all manual, all time-consuming.',
    },
    {
      heading: "You're still chasing DBS renewals by email",
      body: 'Staff certificates expiring without warning. Ofsted could walk in tomorrow.',
    },
    {
      heading: 'Governor reports take a whole weekend',
      body: 'Pulling data from five different places, formatting it yourself, every single term.',
    },
  ]

  return (
    <section style={{ backgroundColor: '#07080F' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#0D9488' }}
          >
            The Problem
          </p>
          <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>
            Sound familiar?
          </h2>
          <p className="text-lg" style={{ color: '#9CA3AF' }}>
            You didn't become a headteacher to spend half your week on admin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map(card => (
            <div
              key={card.heading}
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
            >
              <div
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-4"
                style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
              >
                <AlertTriangle size={18} style={{ color: '#EF4444' }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>
                {card.heading}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Departments Section ──────────────────────────────────────────────────────

function DepartmentsSection() {
  const [activeDept, setActiveDept] = useState(0)
  const dept = DEPARTMENTS[activeDept]
  const DeptIcon = dept.icon

  return (
    <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#0D9488' }}
          >
            What Lumio Does
          </p>
          <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>
            Every department, automated.
          </h2>
          <p style={{ color: '#9CA3AF' }}>
            Click a department to see what Lumio automates for it.
          </p>
        </div>

        {/* Department tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
          {DEPARTMENTS.map((d, i) => {
            const Icon = d.icon
            const isActive = activeDept === i
            return (
              <button
                key={d.name}
                onClick={() => setActiveDept(i)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? '#0D9488' : '#111318',
                  color: isActive ? '#F9FAFB' : '#9CA3AF',
                  border: isActive ? '1px solid #0D9488' : '1px solid #1F2937',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={20} />
                <span>{d.name}</span>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <div
          className="rounded-2xl p-8 mt-4"
          style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.3)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}
                >
                  <DeptIcon size={20} style={{ color: '#0D9488' }} />
                </div>
                <p className="text-lg font-bold" style={{ color: '#0D9488' }}>
                  {dept.name}
                </p>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#F9FAFB' }}>
                {dept.tagline}
              </h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>
                {dept.description}
              </p>
              <Link
                href="/schools/register"
                className="inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: '#0D9488' }}
              >
                Explore this department <ArrowRight size={14} />
              </Link>
            </div>

            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: '#4B5563' }}
              >
                Key Workflows
              </p>
              <div className="flex flex-col gap-3">
                {dept.workflows.map(wf => (
                  <div
                    key={wf}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)', color: '#0D9488' }}
                  >
                    <Check size={14} />
                    {wf}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── AI Features Section ──────────────────────────────────────────────────────

function AISection() {
  const features = [
    {
      icon: Sparkles,
      name: 'Morning briefing',
      description:
        "Every morning, Lumio reads out your attendance figures, safeguarding flags, staff cover needs and urgent actions — before you've reached your desk.",
    },
    {
      icon: FileText,
      name: 'Governor report generator',
      description:
        'One click. Lumio pulls your data, writes your report in the correct format, and emails it to your clerk. Done.',
    },
    {
      icon: CheckCircle,
      name: 'Ofsted readiness checker',
      description:
        'Always know where you stand. Lumio monitors your compliance daily and tells you exactly what needs fixing before inspection day.',
    },
  ]

  return (
    <section style={{ backgroundColor: '#07080F' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#0D9488' }}
          >
            AI-Powered
          </p>
          <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>
            AI built for school leaders.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div
                key={f.name}
                className="rounded-2xl p-7"
                style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5"
                  style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}
                >
                  <Icon size={20} style={{ color: '#0D9488' }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#F9FAFB' }}>
                  {f.name}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  {f.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials Section ─────────────────────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Lumio has saved our office manager at least a day a week. The absence automation alone was worth it.",
      name: 'Sarah Henderson',
      title: 'Headteacher',
      school: 'Oakridge Primary School, Milton Keynes',
      initials: 'SH',
    },
    {
      quote:
        "Governor reports used to take me most of Sunday. Now Lumio generates them in minutes. I can't imagine going back.",
      name: 'James Whitfield',
      title: 'Business Manager',
      school: 'The Alliance Schools Trust',
      initials: 'JW',
    },
    {
      quote:
        'The safeguarding concern logger is outstanding. Timestamped, auditable, DSL-notified instantly. Ofsted loved it.',
      name: 'Priya Sharma',
      title: 'SENCO',
      school: 'Redwood Academy',
      initials: 'PS',
    },
  ]

  return (
    <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#0D9488' }}
          >
            Social Proof
          </p>
          <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>
            Trusted by UK schools.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div
              key={t.name}
              className="rounded-2xl p-7 flex flex-col"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
            >
              <p className="text-xl mb-3" style={{ color: '#F59E0B' }}>★★★★★</p>
              <p className="text-sm leading-relaxed italic mb-6 flex-1" style={{ color: '#D1D5DB' }}>
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center h-10 w-10 rounded-full font-bold text-sm shrink-0"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    {t.title} · {t.school}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '£299',
      badge: null,
      featured: false,
      features: [
        '1 school',
        '3 departments',
        '20 pre-built workflows',
        'Email support',
      ],
      cta: 'Start free trial →',
    },
    {
      name: 'School',
      price: '£599',
      badge: 'Most popular',
      featured: true,
      features: [
        '1 school',
        'All 8 departments',
        '75 pre-built workflows',
        'AI morning briefing',
        'Governor report generator',
        'Priority support',
      ],
      cta: 'Start free trial →',
    },
    {
      name: 'Trust',
      price: '£1,499',
      badge: null,
      featured: false,
      features: [
        'Up to 10 schools',
        'All departments — all schools',
        'Cross-trust dashboard',
        'MAT reporting',
        'Dedicated onboarding',
      ],
      cta: 'Talk to us →',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      badge: null,
      featured: false,
      features: [
        '10+ schools',
        'White label option',
        'Custom workflows',
        'SLA guarantee',
        'Dedicated CSM',
      ],
      cta: 'Contact us →',
    },
  ]

  return (
    <section style={{ backgroundColor: '#07080F' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#0D9488' }}
          >
            Pricing
          </p>
          <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ color: '#9CA3AF' }}>
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className="rounded-2xl p-7 flex flex-col"
              style={{
                backgroundColor: '#111318',
                border: plan.featured ? '1px solid #0D9488' : '1px solid #1F2937',
                boxShadow: plan.featured ? '0 0 30px rgba(13,148,136,0.1)' : 'none',
                position: 'relative',
              }}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
                >
                  {plan.badge}
                </div>
              )}

              <p className="text-sm font-semibold mb-4" style={{ color: '#9CA3AF' }}>
                {plan.name}
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span
                  className="font-black leading-none"
                  style={{
                    color: '#F9FAFB',
                    fontSize: plan.price === 'Custom' ? '1.875rem' : '2.25rem',
                  }}
                >
                  {plan.price}
                </span>
                {plan.price !== 'Custom' && (
                  <span className="text-sm" style={{ color: '#6B7280' }}>
                    /month
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                    <Check size={14} style={{ color: '#0D9488', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/schools/register"
                className="block text-center px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                style={
                  plan.featured
                    ? { backgroundColor: '#0D9488', color: '#F9FAFB' }
                    : { border: '1px solid #1F2937', color: '#9CA3AF' }
                }
                onMouseEnter={e => {
                  if (!plan.featured) {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB'
                  } else {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E'
                  }
                }}
                onMouseLeave={e => {
                  if (!plan.featured) {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF'
                  } else {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488'
                  }
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────

function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: 'Does Lumio replace our MIS (SIMS/Arbor/Bromcom)?',
      a: 'No — Lumio sits alongside your MIS as the workflow and automation layer. It automates the processes around your data, not the data itself.',
    },
    {
      q: 'Is Lumio GDPR compliant?',
      a: 'Yes. All data is stored in UK data centres, processed under GDPR, and we never share your data with third parties.',
    },
    {
      q: 'How long does setup take?',
      a: 'Most schools are up and running within a week. We provide guided onboarding and all workflows are pre-built — no technical knowledge needed.',
    },
    {
      q: 'Can we add more staff users?',
      a: 'Yes — add as many staff as you need. Lumio is priced per school, not per user.',
    },
    {
      q: 'What happens after the free trial?',
      a: "We'll remind you 3 days before your trial ends. You can upgrade, downgrade or cancel at any time.",
    },
  ]

  return (
    <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>
            Common questions.
          </h2>
        </div>

        <div className="max-w-3xl">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl mb-3 overflow-hidden"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                style={{ cursor: 'pointer' }}
              >
                <span className="text-sm font-semibold pr-4" style={{ color: '#F9FAFB' }}>
                  {faq.q}
                </span>
                <span className="text-lg shrink-0" style={{ color: '#0D9488' }}>
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA Section ────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section
      className="py-24"
      style={{
        background: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(15,118,110,0.1))',
        borderTop: '1px solid rgba(13,148,136,0.2)',
        borderBottom: '1px solid rgba(13,148,136,0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-black mb-5" style={{ color: '#F9FAFB' }}>
          Ready to give your staff their time back?
        </h2>
        <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
          Join schools across the UK running on Lumio. 14-day free trial, no credit card needed.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/schools/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
            style={{ backgroundColor: '#F9FAFB', color: '#07080F' }}
          >
            Start free trial <ArrowRight size={16} />
          </Link>
          <Link
            href="/schools/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
            style={{ border: '1px solid #0D9488', color: '#0D9488' }}
          >
            Book a demo
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Schools Footer ───────────────────────────────────────────────────────────

function SchoolsFooter() {
  const productLinks = [
    { label: 'Features', href: '#' },
    { label: 'Departments', href: '#' },
    { label: 'Workflows', href: '#' },
    { label: 'Pricing', href: '#' },
  ]
  const schoolLinks = [
    { label: 'Primary Schools', href: '#' },
    { label: 'Secondary Schools', href: '#' },
    { label: 'MAT & Trusts', href: '#' },
    { label: 'SEND', href: '#' },
  ]
  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'GDPR Statement', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
  ]

  return (
    <footer style={{ backgroundColor: '#07080F', borderTop: '1px solid #1F2937' }} className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}
              >
                <Building2 size={16} style={{ color: '#0D9488' }} />
              </div>
              <span className="font-bold text-base" style={{ color: '#F9FAFB' }}>
                Lumio for Schools
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6B7280' }}>
              Empowering school teams across the UK.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: '#111318', color: '#6B7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: '#4B5563' }}
            >
              Product
            </p>
            {productLinks.map(l => (
              <Link
                key={l.label}
                href={l.href}
                className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Schools */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: '#4B5563' }}
            >
              Schools
            </p>
            {schoolLinks.map(l => (
              <Link
                key={l.label}
                href={l.href}
                className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: '#4B5563' }}
            >
              Legal
            </p>
            {legalLinks.map(l => (
              <Link
                key={l.label}
                href={l.href}
                className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-3 pt-8"
          style={{ borderTop: '1px solid #1F2937' }}
        >
          <p className="text-xs" style={{ color: '#4B5563' }}>
            © Lumio Ltd 2026. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: '#4B5563' }}>
            Powered by Lumio · UK data centres · GDPR compliant
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolsLandingPage() {
  return (
    <div style={{ backgroundColor: '#07080F' }}>
      <HeroSection />
      <ProblemSection />
      <DepartmentsSection />
      <AISection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <SchoolsFooter />
    </div>
  )
}
