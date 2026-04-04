'use client'

import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'

const CATEGORIES = [
  {
    emoji: '🎙️', title: 'AI & Voice', features: [
      { name: 'Morning Briefing', desc: 'Every morning, Lumio reads your school day aloud. Attendance alerts, safeguarding flags, staff absences, today\'s schedule — delivered by voice before you\'ve had your first coffee.' },
      { name: 'Voice Commands', desc: 'Say "Hi Lumio" to get started. Cancel meetings, log concerns, check attendance, send staff alerts — all hands-free.' },
      { name: 'AI Morning Summary', desc: 'A daily written briefing with the 5 things you need to know right now — pulled from live school data.' },
      { name: 'Smart Opening & Closing Lines', desc: 'Start and end every briefing on a positive note. 60 rotating messages to keep your team motivated.' },
    ],
  },
  {
    emoji: '📊', title: 'School Management', features: [
      { name: 'Attendance Tracking', desc: 'Real-time attendance across all year groups. Persistent absence alerts. Automated parent notifications. Year group comparisons at a glance.' },
      { name: 'Safeguarding & DSL', desc: 'Log concerns, track DSL reviews, manage referrals. Every record timestamped and audit-ready. Red alerts surface immediately on your dashboard.' },
      { name: 'SEND & EHCP', desc: 'Full SEND register. EHCP review scheduling. Provision mapping. Deadline alerts. Built around the SEND Code of Practice.' },
      { name: 'Classes & Timetabling', desc: 'Full weekly timetable grid. Teacher, room and class views. Clash detection. Cover lesson booking. AI timetable builder.' },
      { name: 'Behaviour Log', desc: 'Incident logging with full detail. Parent notification. Exclusion tracking. Ofsted-ready behaviour data.' },
    ],
  },
  {
    emoji: '👨‍🏫', title: 'Staff & HR', features: [
      { name: 'Staff Management', desc: 'Headcount, absence tracking, DBS expiry alerts, CPD completion, contract management — all in one place.' },
      { name: 'Staff Absence', desc: 'Log absences instantly. Cover arrangements triggered automatically. Return to work workflows built in.' },
      { name: 'Team Overview', desc: 'See who\'s in today, who\'s on cover, who\'s absent — at a glance every morning.' },
      { name: 'Book Contractor', desc: 'Need a plumber, electrician or IT contractor? Lumio finds available, accredited contractors and handles the booking.' },
    ],
  },
  {
    emoji: '🏫', title: 'School Operations', features: [
      { name: 'School Office', desc: 'Admissions, parent contact logs, trip management, room bookings — the daily flow of school life, organised.' },
      { name: 'Finance', desc: 'Budget tracking, cost per pupil, Pupil Premium spend, invoice management. No more spreadsheets.' },
      { name: 'Facilities', desc: 'Maintenance requests, room bookings, compliance checks — all logged and tracked.' },
      { name: 'Pre & After School', desc: 'Breakfast and after school club registers, payment tracking, staff ratios, incident logging.' },
    ],
  },
  {
    emoji: '📋', title: 'Ofsted Readiness', features: [
      { name: 'Ofsted Inspection Mode', desc: 'The UK\'s only AI-powered Ofsted preparation tool. Activate inspection mode and Lumio surfaces every piece of evidence inspectors will ask for — attendance data, safeguarding records, curriculum intent, SEND provision — instantly. Readiness score, talking points generator, live observation log.' },
      { name: 'Evidence Pack', desc: 'One-click generation of attendance reports, safeguarding summaries, curriculum overviews, SEND reports and behaviour logs — all formatted for inspection.' },
      { name: 'Readiness Score', desc: 'Know your inspection readiness before the call comes. Real-time scoring across all 5 Ofsted judgement areas.' },
    ],
  },
  {
    emoji: '🏛️', title: 'Multi-Academy Trust', features: [
      { name: 'MAT Dashboard', desc: 'See all your schools in one place. Attendance, safeguarding, staff, finance and Ofsted readiness — compared side by side across your entire trust.' },
      { name: 'Cross-Trust Analytics', desc: 'Attendance trends, behaviour comparisons, outcome data and staffing levels — trust-wide, in real time.' },
      { name: 'Trust Reporting', desc: 'Generate cross-trust reports for governors and trustees in seconds. No more chasing data from individual schools.' },
    ],
  },
  {
    emoji: '👨‍👩‍👧', title: 'Parent Portal', features: [
      { name: 'Parent Dashboard', desc: 'Parents see their child\'s attendance, timetable, progress reports and school messages — all in one place.' },
      { name: 'Absence Reporting', desc: 'Parents report absences directly through the portal — no more phone calls, no more admin.' },
      { name: 'Consent & Payments', desc: 'Trip permission slips, consent forms and ParentPay integration — all in the parent portal.' },
      { name: 'Two-Way Messaging', desc: 'Direct, auditable messaging between parents and school staff.' },
    ],
  },
  {
    emoji: '🔐', title: 'SSO & Data', features: [
      { name: 'Google Workspace SSO', desc: 'Sign in with Google — no new passwords for staff.' },
      { name: 'Microsoft 365 SSO', desc: 'Sign in with Microsoft — works with every school\'s existing setup.' },
      { name: 'MIS Sync', desc: 'Syncs with Arbor, SIMS and Bromcom — your existing data, no re-entry.' },
      { name: 'UK Data Sovereignty', desc: 'All data stored in AWS eu-west-1 (London). GDPR compliant. DPA ready.' },
    ],
  },
]

const COMPARISON = [
  { feature: 'AI Voice Briefing', lumio: true, arbor: false, sims: false, bromcom: false },
  { feature: 'Voice Commands', lumio: true, arbor: false, sims: false, bromcom: false },
  { feature: 'Ofsted Inspection Mode', lumio: true, arbor: false, sims: false, bromcom: false },
  { feature: 'SEND & EHCP Management', lumio: true, arbor: true, sims: true, bromcom: true },
  { feature: 'Safeguarding & DSL', lumio: true, arbor: true, sims: true, bromcom: true },
  { feature: 'Attendance Tracking', lumio: true, arbor: true, sims: true, bromcom: true },
  { feature: 'Timetabling', lumio: true, arbor: 'partial', sims: true, bromcom: true },
  { feature: 'Parent Portal', lumio: true, arbor: true, sims: true, bromcom: true },
  { feature: 'MAT Dashboard', lumio: true, arbor: true, sims: false, bromcom: true },
  { feature: 'Staff HR Management', lumio: true, arbor: false, sims: false, bromcom: false },
  { feature: 'Finance Management', lumio: true, arbor: true, sims: false, bromcom: true },
  { feature: 'MIS Sync', lumio: true, arbor: 'n/a', sims: 'n/a', bromcom: 'n/a' },
  { feature: 'UK Data Sovereignty', lumio: true, arbor: true, sims: true, bromcom: true },
  { feature: 'Flat pricing (not per user)', lumio: true, arbor: false, sims: false, bromcom: false },
  { feature: '14-day free trial', lumio: true, arbor: false, sims: false, bromcom: false },
]

const TESTIMONIALS = [
  { quote: 'Finally, a platform that actually understands how schools work. The Ofsted mode alone is worth it.', name: 'Deputy Head', school: 'Oakridge Primary' },
  { quote: 'The morning voice briefing has transformed how our leadership team starts the day. We haven\'t missed an alert since.', name: 'Headteacher', school: 'St Mary\'s CE' },
  { quote: 'We moved from SIMS six months ago. The safeguarding tracking is streets ahead of anything we\'ve used before.', name: 'DSL', school: 'Crestview Academy' },
]

const PLANS = [
  { name: 'Starter', price: '299', period: '/mo', desc: 'Up to 500 pupils', color: '#0D9488' },
  { name: 'Growth', price: '599', period: '/mo', desc: 'Up to 1,500 pupils', color: '#8B5CF6', featured: true },
  { name: 'Enterprise', price: '1,499', period: '/mo', desc: 'Unlimited pupils + MAT dashboard', color: '#F59E0B' },
]

function CellIcon({ val }: { val: boolean | string }) {
  if (val === true) return <Check size={14} style={{ color: '#0D9488' }} />
  if (val === false) return <X size={14} style={{ color: '#EF4444' }} />
  if (val === 'partial') return <span className="text-xs" style={{ color: '#F59E0B' }}>✱</span>
  return <span className="text-xs" style={{ color: '#6B7280' }}>N/A</span>
}

export default function SchoolsFeaturesPage() {
  return (
    <div style={{ backgroundColor: '#07080F' }}>
      {/* Hero */}
      <section className="py-24 text-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0d2a2a 50%, #0f172a 100%)' }}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-8" style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.3)' }}>
            🇬🇧 Built exclusively for UK schools
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6" style={{ color: '#F9FAFB', lineHeight: 1.1 }}>
            Everything your school needs.<br />
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nothing it doesn&apos;t.</span>
          </h1>
          <p className="text-lg mx-auto mb-10" style={{ color: '#9CA3AF', maxWidth: 640, lineHeight: 1.7 }}>
            Lumio Schools replaces your MIS middleware, staff management tools, and morning admin — with one AI-powered platform built for UK schools.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup?portal=schools" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Start free trial <ArrowRight size={16} /></Link>
            <Link href="/demo/schools/oakridge-primary" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ color: '#F9FAFB', border: '1px solid #374151' }}>See the demo</Link>
          </div>
        </div>
      </section>

      {/* Features by Category */}
      {CATEGORIES.map((cat, ci) => (
        <section key={cat.title} style={{ backgroundColor: ci % 2 === 0 ? '#07080F' : '#0A0B12', borderTop: '1px solid #1F2937' }}>
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex items-center gap-3 mb-10">
              <span className="text-3xl">{cat.emoji}</span>
              <h2 className="text-2xl font-black" style={{ color: '#F9FAFB' }}>{cat.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.features.map(f => (
                <div key={f.name} className="rounded-2xl p-6" style={{ backgroundColor: ci % 2 === 0 ? '#111318' : '#07080F', border: '1px solid #1F2937' }}>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>{f.name}</h3>
                  <p className="text-sm" style={{ color: '#9CA3AF', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Comparison Table */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>How Lumio Compares</h2>
          <p className="text-center text-base mb-12 mx-auto" style={{ color: '#9CA3AF', maxWidth: 500 }}>See how we stack up against the UK&apos;s most used school platforms.</p>
          <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid #1F2937' }}>
            <table className="w-full text-sm" style={{ minWidth: 600 }}>
              <thead><tr style={{ borderBottom: '1px solid #1F2937' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#9CA3AF', backgroundColor: '#111318' }}>Feature</th>
                <th className="px-4 py-3 font-bold text-center" style={{ color: '#0D9488', backgroundColor: 'rgba(13,148,136,0.08)' }}>Lumio</th>
                <th className="px-4 py-3 font-semibold text-center" style={{ color: '#6B7280', backgroundColor: '#111318' }}>Arbor</th>
                <th className="px-4 py-3 font-semibold text-center" style={{ color: '#6B7280', backgroundColor: '#111318' }}>SIMS</th>
                <th className="px-4 py-3 font-semibold text-center" style={{ color: '#6B7280', backgroundColor: '#111318' }}>Bromcom</th>
              </tr></thead>
              <tbody>
                {COMPARISON.map((r, i) => (
                  <tr key={i} style={{ borderBottom: i < COMPARISON.length - 1 ? '1px solid #1F2937' : 'none' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#D1D5DB' }}>{r.feature}</td>
                    <td className="px-4 py-3 text-center" style={{ backgroundColor: 'rgba(13,148,136,0.04)' }}><CellIcon val={r.lumio} /></td>
                    <td className="px-4 py-3 text-center"><CellIcon val={r.arbor} /></td>
                    <td className="px-4 py-3 text-center"><CellIcon val={r.sims} /></td>
                    <td className="px-4 py-3 text-center"><CellIcon val={r.bromcom} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: '#4B5563' }}>✱ Arbor timetabling requires TimeTabler add-on (third party)</p>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-3xl font-black text-center mb-4" style={{ color: '#F9FAFB' }}>Simple, transparent pricing.</h2>
          <p className="text-center text-base mb-12" style={{ color: '#9CA3AF' }}>No per-user fees. All features included. 14-day free trial.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#111318', border: p.featured ? `2px solid ${p.color}` : '1px solid #1F2937' }}>
                {p.featured && <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: p.color, color: '#F9FAFB' }}>Most Popular</span>}
                <h3 className="text-lg font-bold mb-1" style={{ color: '#F9FAFB' }}>{p.name}</h3>
                <p className="mb-4" style={{ color: '#6B7280', fontSize: 13 }}>{p.desc}</p>
                <p className="mb-6"><span className="text-3xl font-black" style={{ color: p.color }}>£{p.price}</span><span className="text-sm" style={{ color: '#6B7280' }}>{p.period}</span></p>
                <Link href="/signup?portal=schools" className="block w-full py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: p.color, color: '#F9FAFB' }}>Start Free Trial</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-2xl font-black text-center mb-12" style={{ color: '#F9FAFB' }}>Built for UK schools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.school} className="rounded-2xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <p className="text-sm mb-4" style={{ color: '#D1D5DB', lineHeight: 1.8 }}>&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{t.name}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{t.school}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-black mb-4" style={{ color: '#F9FAFB' }}>Ready to see Lumio in action?</h2>
          <p className="text-base mb-10" style={{ color: '#9CA3AF' }}>Join schools across the UK who&apos;ve switched to Lumio.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup?portal=schools" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>Start free trial <ArrowRight size={18} /></Link>
            <Link href="https://calendly.com/lumiocms/lumio-schools" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold" style={{ color: '#F9FAFB', border: '1px solid #374151' }}>Book a demo</Link>
          </div>
          <p className="text-xs mt-6" style={{ color: '#4B5563' }}>14 days free. No credit card. Cancel any time. UK data storage.</p>
        </div>
      </section>
    </div>
  )
}
