'use client'

// NOTE: The (website)/layout.tsx renders a site-wide nav + footer.
// This page also renders a schools-specific footer as the final section.

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, Users, Heart, Shield, BookOpen, GraduationCap,
  Sunrise, BarChart2, Check, AlertTriangle, Sparkles, FileText,
  ArrowRight, Twitter, Linkedin, Network,
} from 'lucide-react'

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section style={{ backgroundColor: '#07080F' }} className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
              style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}
            >
              <Building2 size={15} />
              Lumio for Schools
            </div>

            <h1
              className="font-black leading-tight mb-5"
              style={{ color: '#F9FAFB', fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}
            >
              The School Platform Built for Every Role
            </h1>

            <p className="text-xl leading-relaxed mb-8" style={{ color: '#9CA3AF' }}>
              From the headteacher&apos;s office to the SENCO&apos;s desk — Lumio gives every member of your team the data, tools and time-saving workflows they need. All in one place.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-5">
              <Link
                href="/schools/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', color: '#F9FAFB' }}
              >
                Start Free 14-Day Trial <ArrowRight size={15} />
              </Link>
              <a
                href="https://calendly.com/lumiocms"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ border: '1px solid #1F2937', color: '#9CA3AF' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}
              >
                Book a Demo
              </a>
            </div>

            <p className="text-sm" style={{ color: '#6B7280' }}>
              ✓ 14-day free trial &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ GDPR compliant &nbsp;·&nbsp; ✓ UK data centres
            </p>
          </div>

          {/* Right — mock dashboard */}
          <div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: '1px solid #1F2937',
                boxShadow: '0 0 80px rgba(13,148,136,0.15)',
                backgroundColor: '#111318',
              }}
            >
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: '1px solid #1F2937', backgroundColor: '#0D1117' }}
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.2)' }}>
                  <Building2 size={14} style={{ color: '#0D9488' }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Oakridge Primary · Insights</span>
                <span className="ml-auto text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>Live</span>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Role switcher */}
                <div className="flex gap-2 flex-wrap">
                  {['Headteacher', 'SENCO', 'DSL', 'Teacher'].map((role, i) => (
                    <span key={role} className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ backgroundColor: i === 0 ? '#0D9488' : '#1F2937', color: i === 0 ? '#F9FAFB' : '#6B7280' }}>
                      {role}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Attendance', value: '93.9%', color: '#0D9488' },
                    { label: 'Open concerns', value: '1', color: '#EF4444' },
                    { label: 'PP gap', value: '−3.2', color: '#F59E0B' },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl p-3" style={{ backgroundColor: '#0D1117', border: '1px solid #1F2937' }}>
                      <p className="text-xl font-black leading-none mb-1" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                  <span>⚠</span>
                  <span>SG-2026-047 · DSL review overdue 2 days</span>
                </div>

                <div className="flex flex-col gap-2">
                  {[
                    { label: 'EHCP annual review — T. Morris due 15 Apr', dot: '#F59E0B' },
                    { label: 'Year 6 SATs readiness: 82% on track', dot: '#22C55E' },
                    { label: 'Breakfast club — 47 booked tomorrow', dot: '#0D9488' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.dot }} />
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12" style={{ borderTop: '1px solid #1F2937' }}>
          {[
            { number: '8+ Hours', label: 'Saved per staff member, per week' },
            { number: '20 Roles', label: 'From admin to trust CEO, all covered' },
            { number: '2026 Ready', label: 'SEND White Paper & Ofsted 2025 compliant' },
            { number: '8am–6pm', label: 'Full wraparound childcare management' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black leading-none mb-2" style={{ color: '#0D9488' }}>{stat.number}</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features Section ─────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#0D9488' }}>What Lumio Does</p>
          <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Everything Your School Needs. Nothing You Don&apos;t.</h2>
        </div>

        {/* Feature 1 — Insights (Hero — full width) */}
        <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: '#111318', border: '1px solid rgba(13,148,136,0.4)', boxShadow: '0 0 40px rgba(13,148,136,0.08)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
              <Sparkles size={20} style={{ color: '#0D9488' }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#0D9488' }}>Headline Feature</span>
          </div>
          <h3 className="text-2xl font-black mb-3" style={{ color: '#F9FAFB' }}>Role-Based Insights — One Dashboard, Every Perspective</h3>
          <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: '#9CA3AF' }}>
            Stop building spreadsheets. Lumio&apos;s Insights page gives every role in your school a tailored, live view of what matters to them — at the click of a button. No more chasing data. No more out-of-date reports. Just the right information, for the right person, right now.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { emoji: '🏛️', role: 'Trust Lead', detail: 'Cross-school performance table, flagged schools, SEND strategy compliance' },
              { emoji: '👩‍💼', role: 'Headteacher', detail: 'Attendance by year group, KS2 vs national, safeguarding cases, behaviour trends, budget status' },
              { emoji: '📚', role: 'Head of Year', detail: 'Year group attendance, at-risk pupils, intervention tracker, parent contact log' },
              { emoji: '🧑‍🏫', role: 'Teacher', detail: 'Class progress, SEND pupil strategies, assessment data, weekly task list' },
              { emoji: '🧩', role: 'SENCO', detail: 'EHCP pipeline with 20-week statutory countdown, ISP tracker, three-tier model, external agencies, White Paper compliance' },
              { emoji: '🛡️', role: 'DSL', detail: 'CP/CiN/LAC case management, KCSIE 2024 compliance, online safety audit, training matrix' },
              { emoji: '⭐', role: 'Pupil Premium', detail: 'Attainment gap trend, intervention impact, budget tracker' },
              { emoji: '🔍', role: 'Inspections', detail: 'Ofsted 2025 report card readiness across all 6 evaluation areas' },
            ].map(item => (
              <div key={item.role} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.15)' }}>
                <p className="text-lg mb-1">{item.emoji}</p>
                <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>{item.role}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm italic" style={{ color: '#6B7280' }}>
              &ldquo;Headteachers report saving 3–4 hours per week on data gathering and report preparation alone.&rdquo;
            </p>
            <Link href="/demo/schools/oakridge-primary/insights"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              See it live <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Features 2–6 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Feature 2 — SEND & DSL */}
          <div className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
              <Heart size={20} style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>The Most Comprehensive SEND & Safeguarding Tool in Schools</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              Built around the 2026 SEND White Paper and KCSIE 2024 — Lumio is the only schools platform that turns the most complex compliance obligations into simple, actionable dashboards. From the 20-week EHCP statutory deadline to online safety filtering compliance — nothing falls through the cracks.
            </p>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {[
                '📄 EHCP Pipeline — 20-week statutory countdown per pupil, annual review scheduler',
                '🗂 ISP Tracker — Individual Support Plans, tier classification, parent sign-off (statutory Sept 2029)',
                '🏗️ Three-Tier Model — Universal, Targeted and Specialist aligned to the 2026 White Paper',
                '🔗 External Agencies — CAMHS, EP, SALT, OT referral tracker with wait times',
                '🛡️ DSL Case Management — CP, CiN, LAC, Early Help with social worker contacts',
                '💻 Online Safety — KCSIE 2024 filtering/monitoring review, incident log, curriculum tracker',
                '🎓 Training Matrix — whole-school safeguarding training with renewal alerts',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 mt-auto" style={{ backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>
                <span className="font-bold">1 in 5 pupils in England has SEND.</span> 74% of SENCOs say they don&apos;t have enough time. Lumio gives it back.
              </p>
            </div>
          </div>

          {/* Feature 3 — Students */}
          <div className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(108,63,197,0.15)' }}>
              <GraduationCap size={20} style={{ color: '#A78BFA' }} />
            </div>
            <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>Every Pupil. Every Detail. Every Role Can See What They Need.</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              Lumio&apos;s Students page is the single source of truth for every child in your school. From the pupil passport a supply teacher needs in 30 seconds, to the safeguarding chronology only the DSL can access — the right information reaches the right person, with the right permissions.
            </p>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {[
                '👤 Pupil Passport — strengths, support strategies, de-escalation notes in one shareable profile',
                '📊 Role-Based Table Views — switch between Teacher, SENCO, DSL, Pastoral and Admin instantly',
                '📈 Academic Tracking — reading age, book band, attainment by subject, assessment history',
                '🛡️ Safeguarding Flags — CP/CiN/LAC status visible to authorised staff only',
                '❤️ Medical & Dietary — medication schedules, allergies (EpiPen alerts), dietary requirements',
                '🏷️ Smart Flags — PP, SEND, LAC, FSM, EAL, Young Carer — filter and search instantly',
                '📅 Attendance — monthly bar chart, persistent absentee flag, authorised vs unauthorised split',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs italic mt-auto" style={{ color: '#6B7280' }}>
              &ldquo;No more emailing the SENCO for a pupil&apos;s strategies before a lesson. No more searching three systems for emergency contacts.&rdquo;
            </p>
          </div>

          {/* Feature 4 — Pre & After School */}
          <div className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
              <Sunrise size={20} style={{ color: '#F59E0B' }} />
            </div>
            <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>Wraparound Childcare Management — From Breakfast Register to HAF Holiday Club</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              Free breakfast clubs are now statutory for every primary school from April 2026 (Children&apos;s Wellbeing &amp; Schools Bill). Lumio makes you ready — with DfE grant tracking, live registers, staff:child ratio compliance, payment management and HAF programme tools all in one place.
            </p>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {[
                '🥣 Breakfast Club Register — live daily register, FSM tracking, DfE data return preparation',
                '🌅 After School Register — live collection log, who is in club, who has been collected and by whom',
                '💰 Payment Management — Tax-Free Childcare, Universal Credit, childcare vouchers, ParentPay',
                '📅 Bookings — regular and ad-hoc bookings, waiting list with SEND/FSM priority',
                '👥 Staff & Ratios — Ofsted compliance dashboard, 1:8 ratio checker, DBS tracking',
                '📋 DfE Grant Tracker — breakfast club grant allocation, termly data return checklist',
                '🏖️ Holiday Club & HAF — Easter and summer sessions, FSM-eligible pupils, LA HAF referrals',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 mt-auto" style={{ backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs leading-relaxed" style={{ color: '#FCD34D' }}>
                <span className="font-bold">The national rollout of free breakfast clubs begins April 2026.</span> Every primary school needs to be ready. Lumio makes it simple.
              </p>
            </div>
          </div>

          {/* Feature 5 — School Office */}
          <div className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
              <Building2 size={20} style={{ color: '#0D9488' }} />
            </div>
            <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>Cut Admin Time in Half. Give Your Office Team Their Day Back.</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              The average school office team spends 40% of their day on tasks that could be automated. Lumio handles the follow-up, the chasing, the letters and the data — so your team can focus on the people in front of them.
            </p>
            <div className="flex flex-col gap-2 flex-1">
              {[
                { text: 'Automated first-day absence alerts — texts triggered at 9:15am, no manual chasing' },
                { text: 'Bulk communications with read receipts — newsletters, letters, trip forms in one place' },
                { text: 'School census preparation — data validation, anomaly flagging, submission tracking' },
                { text: 'GDPR compliance — processing register, data requests, breach log' },
                { text: 'Governor meeting management — agendas, minutes, action tracker' },
                { text: 'Policy register with automated review reminders' },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <Check size={13} style={{ color: '#0D9488', flexShrink: 0, marginTop: 2 }} />
                  <span className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Feature 6 — Trust — full width */}
        <div className="rounded-2xl p-8 mt-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-5" style={{ backgroundColor: 'rgba(96,165,250,0.12)' }}>
                <Network size={20} style={{ color: '#60A5FA' }} />
              </div>
              <h3 className="text-xl font-black mb-3" style={{ color: '#F9FAFB' }}>Multi-Academy Trust? See Every School in One View.</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#9CA3AF' }}>
                Trust leads and CEOs get a cross-school dashboard showing attendance, attainment, SEND, safeguarding and budget — for every academy in the trust, side by side. Spot the school that needs support before it becomes a crisis.
              </p>
              <Link href="/schools/register" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#60A5FA' }}>
                Talk to us about trusts <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: BarChart2, color: '#60A5FA', text: 'Cross-school performance table with RAG flags' },
                { icon: Heart, color: '#EF4444', text: 'Trust-wide SEND compliance — White Paper Phase 1/2/3 readiness across all schools' },
                { icon: Shield, color: '#F59E0B', text: 'Ofsted readiness per school — mapped to the 2025 framework' },
                { icon: FileText, color: '#22C55E', text: 'Trust finance overview — budget vs actuals, overspend alerts' },
                { icon: Users, color: '#A78BFA', text: 'HR dashboard — vacancies, absence, SCR compliance across all schools' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div key={item.text} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937' }}>
                    <Icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: '#D1D5DB' }}>{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── Social Proof Section ─────────────────────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Lumio has transformed how our SENCO works. The EHCP tracker alone saves her 4 hours a week — and we're actually confident we won't miss an annual review deadline.",
      title: 'Headteacher',
      school: 'Milton Keynes',
      initials: 'SH',
    },
    {
      quote: "The insights page is the first thing I open every morning. My attendance data, safeguarding cases and Pupil Premium gap — all on one screen. I used to spend an hour pulling this together.",
      title: 'Deputy Headteacher',
      school: 'Northamptonshire',
      initials: 'JW',
    },
    {
      quote: "The wraparound management tools are incredible. Our breakfast club register, DfE grant tracker and after school payments — all automated. Our admin team can't believe how much time it saves.",
      title: 'School Business Manager',
      school: 'Bedfordshire',
      initials: 'PS',
    },
  ]

  return (
    <section style={{ backgroundColor: '#07080F' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#0D9488' }}>Social Proof</p>
          <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>Trusted by Schools and Trusts Across England</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.initials} className="rounded-2xl p-7 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <p className="text-xl mb-3" style={{ color: '#F59E0B' }}>★★★★★</p>
              <p className="text-sm leading-relaxed italic mb-6 flex-1" style={{ color: '#D1D5DB' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full font-bold text-sm shrink-0"
                  style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{t.title}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{t.school}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Compliance Section ───────────────────────────────────────────────────────

function ComplianceSection() {
  const cards = [
    {
      title: 'Ofsted 2025',
      color: '#60A5FA',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.2)',
      points: ['New report card framework', '6 evaluation areas', '5-point scale', 'Evidence portfolio builder'],
    },
    {
      title: 'SEND White Paper 2026',
      color: '#A78BFA',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.2)',
      points: ['ISP templates', 'Three-tier model', 'Phase 1/2/3 checklists', 'Inclusion Strategy builder'],
    },
    {
      title: 'KCSIE 2024',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
      points: ['Online safety compliance', 'Filtering & monitoring', 'Training matrix', 'Records transfer tracker'],
    },
    {
      title: 'Free Breakfast Clubs',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
      points: ["Children's Wellbeing Bill", 'DfE grant tracker', 'Ofsted childcare register', 'HAF programme'],
    },
  ]

  return (
    <section style={{ backgroundColor: 'rgba(255,255,255,0.01)' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#0D9488' }}>Compliance</p>
          <h2 className="text-4xl font-black mb-4" style={{ color: '#F9FAFB' }}>Built for 2025 and 2026 Compliance</h2>
          <p style={{ color: '#9CA3AF' }}>Every major framework change in the next two years. Already in Lumio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map(card => (
            <div key={card.title} className="rounded-2xl p-7"
              style={{ backgroundColor: card.bg, border: `1px solid ${card.border}` }}>
              <p className="text-base font-black mb-5" style={{ color: card.color }}>{card.title}</p>
              <ul className="flex flex-col gap-3">
                {card.points.map(pt => (
                  <li key={pt} className="flex items-center gap-2 text-sm" style={{ color: '#D1D5DB' }}>
                    <Check size={13} style={{ color: card.color, flexShrink: 0 }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

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
      q: 'How quickly are you updating for SEND White Paper and Ofsted 2025?',
      a: 'We track every consultation and statutory change in real time. SEND White Paper Phase 1 features are already live. Ofsted 2025 report card readiness tools are in the app now.',
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
      a: "We'll remind you 3 days before your trial ends. You can upgrade, downgrade or cancel at any time. No contracts, no lock-in.",
    },
  ]

  return (
    <section style={{ backgroundColor: '#07080F' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl font-black" style={{ color: '#F9FAFB' }}>Common questions.</h2>
        </div>

        <div className="max-w-3xl">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl mb-3 overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                style={{ cursor: 'pointer' }}
              >
                <span className="text-sm font-semibold pr-4" style={{ color: '#F9FAFB' }}>{faq.q}</span>
                <span className="text-lg shrink-0" style={{ color: '#0D9488' }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{faq.a}</div>
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
          Ready to See What Lumio Can Do for Your School?
        </h2>
        <p className="text-lg mb-4 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
          Join schools across England using Lumio to save time, improve outcomes and stay ahead of compliance. Free 14-day trial. No credit card. Full demo data included — see every feature before you commit.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
          <Link
            href="/schools/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
            style={{ backgroundColor: '#F9FAFB', color: '#07080F' }}
          >
            Start Free Trial <ArrowRight size={16} />
          </Link>
          <a
            href="https://calendly.com/lumiocms"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
            style={{ border: '1px solid #0D9488', color: '#0D9488' }}
          >
            Book a Demo
          </a>
        </div>
        <p className="text-xs" style={{ color: '#4B5563' }}>
          Used by primary schools, secondary schools and multi-academy trusts · GDPR compliant · UK-based support
        </p>
      </div>
    </section>
  )
}

// ─── Schools Footer ───────────────────────────────────────────────────────────

function SchoolsFooter() {
  const productLinks = [
    { label: 'Features', href: '#' },
    { label: 'Insights', href: '#' },
    { label: 'SEND & DSL', href: '#' },
    { label: 'Pricing', href: '/pricing' },
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

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }}>
                <Building2 size={16} style={{ color: '#0D9488' }} />
              </div>
              <span className="font-bold text-base" style={{ color: '#F9FAFB' }}>Lumio for Schools</span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#6B7280' }}>
              Empowering school teams across England.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: '#111318', color: '#6B7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Product</p>
            {productLinks.map(l => (
              <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Schools</p>
            {schoolLinks.map(l => (
              <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Legal</p>
            {legalLinks.map(l => (
              <Link key={l.label} href={l.href} className="block mb-3 text-sm transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280' }}>
                {l.label}
              </Link>
            ))}
          </div>

        </div>

        <div className="pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" style={{ borderTop: '1px solid #1F2937' }}>
          <p className="text-xs" style={{ color: '#4B5563' }}>© Lumio 2025. All rights reserved. Lumio for Schools is a product of Lumio CMS Ltd.</p>
          <p className="text-xs" style={{ color: '#4B5563' }}>UK data centres · GDPR compliant · ICO registered</p>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <ComplianceSection />
      <FAQSection />
      <FinalCTASection />
      <SchoolsFooter />
    </>
  )
}
