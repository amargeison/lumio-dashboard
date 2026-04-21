'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// ─── Sports Data ──────────────────────────────────────────────────────────────

const SPORTS_VALUES = [
  { emoji: '🏟️', title: 'Sport-specific, not sport-adjacent',
    desc: 'Every feature in every portal was designed for the realities of that sport — its regulations, its rhythms, its people. We don\'t adapt business software. We build for sport.' },
  { emoji: '💪', title: 'The 99 percent',
    desc: 'The Premier League has bespoke IT. The Champ Rugby club, the WSL non-Big Four club, the PDC tour card holder — they don\'t. Lumio Sports is built for the clubs and athletes who have always deserved better infrastructure.' },
  { emoji: '📖', title: 'Transparent by design',
    desc: 'The purse simulator shows a boxer exactly what they take home before they sign. The FSR dashboard shows a women\'s club exactly where they stand. Financial transparency is not a feature — it is the point.' },
]

const SPORTS_PORTALS = [
  { emoji: '⚽', title: 'Football Pro Club', accent: '#10B981', href: '/football',
    desc: 'Pro Club portal for National League System clubs. Squad management, GPS performance (Lumio GPS), PSR compliance, FIFA-style pitch view, set pieces library and AI manager briefing.' },
  { emoji: '⚽', title: 'Non-League Football', accent: '#F59E0B', href: '/football',
    desc: 'Steps 3–7 of the English football pyramid. FA Ground Grading compliance, player contracts, wage bill tracker, sponsor pipeline, match day revenue and board portal.' },
  { emoji: '⚽', title: 'Grassroots Football', accent: '#F97316', href: '/football',
    desc: 'AI voice briefing, player welfare, safeguarding compliance, subs collection via Stripe, AI team selection and parent portal. Built for the 45,000 clubs running on WhatsApp.' },
  { emoji: '⚽', title: "Women's Football", accent: '#EC4899', href: '/contact',
    desc: 'The first operating system built specifically for professional women\'s football. FSR compliance, player welfare (maternity, ACL, mental health), standalone sponsorship pipeline and board suite.' },
  { emoji: '🏉', title: 'Rugby', accent: '#8B5CF6', href: '/rugby',
    desc: 'Champ Rugby and Premiership operating system. Salary cap manager (ceiling + floor), franchise readiness tracker, concussion & HIA compliance and club-to-country data interface.' },
  { emoji: '🎾', title: 'Tennis', accent: '#A3E635', href: '/tennis',
    desc: 'Career OS for ATP and WTA touring professionals. Ranking tracker, points expiry calendar, surface win rates, sponsorship manager, physio dashboard and AI morning briefing for the full team.' },
  { emoji: '⛳', title: 'Golf', accent: '#38BDF8', href: '/golf',
    desc: 'OWGR tracker, Race to Dubai, strokes gained deep-dive, course fit AI scoring, caddie workflow dashboard and multi-jurisdiction prize money and tax modelling.' },
  { emoji: '🎯', title: 'Darts', accent: '#EF4444', href: '/darts',
    desc: 'PDC Order of Merit tracker, three-dart average dashboard, exhibition manager, opponent intel, tour card security indicator and Q-School preparation timeline.' },
  { emoji: '🥊', title: 'Boxing', accent: '#DC2626', href: '/boxing',
    desc: 'Purse simulator, world rankings across all five sanctioning bodies, fight camp planner, weight tracker, multi-jurisdiction tax modelling and contract intelligence.' },
  { emoji: '🏏', title: 'Cricket', accent: '#FBBF24', href: '/cricket',
    desc: 'Contract and central contract tracker, batting and bowling analytics, franchise schedule (IPL, The Hundred, BBL), injury management and AI morning briefing.' },
]

const SPORTS_TIMELINE = [
  { year: '2022', title: 'The problem becomes visible',
    detail: 'Consulting across UK sports organisations. Every club, every athlete, every agent had the same operational chaos underneath — spreadsheets, WhatsApp groups, and no single source of truth.' },
  { year: '2023', title: 'First prototype — Football',
    detail: 'Built the first Pro Club portal for a League Two club. GPS integration, squad management, transfer hub and PSR dashboard. The response was immediate: "Nothing like this exists."' },
  { year: '2024', title: 'Lumio Sports is born',
    detail: 'Platform expands to Non-League, Grassroots, Women\'s Football, Tennis, Golf and Darts. AI morning briefings powered by Claude. Lumio GPS integration goes live.' },
  { year: '2025', title: 'Ten portals. One platform.',
    detail: 'Boxing, Rugby, Cricket portals launched. Franchise readiness tracker and salary cap manager for Champ Rugby. FSR compliance for Women\'s Football. Purse simulator for Boxing. The operating system for professional sport.' },
]

const SPORTS_TEAM = [
  { name: 'Arron Margeison', role: 'Founder & CEO', bg: '#8B5CF6', initials: 'AM',
    bio: 'Former operations consultant. Spent years working inside sports organisations and growing businesses. Built Lumio Sports to fix the infrastructure gap in professional sport.',
    tags: ['Oxford', 'Sport', 'B2B SaaS', 'Operations'],
    quote: 'A world title contender signs a fight contract without knowing what they\'ll take home. A Champ Rugby club tracks salary cap headroom in Excel. This has to change.' },
  { name: 'TBA', role: 'Head of Engineering', bg: '#0D9488', initials: '?',
    bio: 'We\'re hiring. If you love building complex, regulation-aware platforms and care about sport, we want to hear from you.',
    tags: ['Backend', 'TypeScript', 'Next.js', 'Sport Tech'], quote: null },
  { name: 'TBA', role: 'Head of Sport', bg: '#F59E0B', initials: '?',
    bio: 'We\'re hiring. If you\'ve worked in professional sport operations and know what "good" looks like for clubs and athletes, let\'s talk.',
    tags: ['Sport Ops', 'Rugby', 'Football', 'Cricket'], quote: null },
]

// ─── Business Data ────────────────────────────────────────────────────────────

const BUSINESS_VALUES = [
  { emoji: '🎓', title: 'SMBs first, always',
    desc: 'We build for growing businesses. That focus means every workflow, every integration, every design decision is shaped by the specific problems SMBs face — not generic SaaS assumptions.' },
  { emoji: '🔒', title: 'Privacy by design',
    desc: 'GDPR compliance isn\'t bolted on. We architect data handling from the ground up — for school data, customer data, and staff data alike. Every integration is scoped to the minimum necessary access.' },
  { emoji: '⚡', title: 'Speed to value',
    desc: 'You should see ROI in your first week. We measure our own success by how quickly customers connect their first workflow and how many manual hours it saves by the end of month one.' },
]

const BUSINESS_PRODUCTS = [
  { emoji: '🏢', title: 'Lumio Business OS', accent: '#0D9488', href: '/product',
    desc: 'The connected operating system for growing UK businesses. CRM, HR, finance, projects, partners, support and operations — all in one platform with AI workflows and unified inbox.' },
  { emoji: '🎓', title: 'Lumio Schools', accent: '#22D3EE', href: '/schools',
    desc: 'A complete school management OS — admissions, attendance, communications, safeguarding, governor reporting, Ofsted prep and parent portals. Built for UK primary and secondary schools.' },
  { emoji: '🤝', title: 'Lumio CRM', accent: '#6C3FC5', href: '/lumio-crm',
    desc: 'AI-powered CRM with deal scoring, contact intelligence, scheduled outreach, smart pipeline workflows and integrations with Microsoft 365, Gmail, Slack and 40+ other tools.' },
  { emoji: '⚡', title: 'Workflows', accent: '#F59E0B', href: '/product#workflows',
    desc: '150+ pre-built workflows across 14 departments. Invoice chasing, lead scoring, onboarding automation, renewal reminders, weekly board reports — all running in the background.' },
  { emoji: '🔌', title: 'Integrations', accent: '#3B82F6', href: '/product#integrations',
    desc: '40+ integrations with Microsoft 365, Google Workspace, Xero, QuickBooks, HubSpot, Stripe, Slack, Teams and more. Connect your existing tools — Lumio orchestrates the rest.' },
  { emoji: '🧠', title: 'AI by Claude', accent: '#EC4899', href: '/product',
    desc: 'Claude-powered AI assists across the entire platform — drafting emails, summarising calls, scoring leads, generating reports and surfacing the insights that matter most.' },
]

const BUSINESS_TIMELINE = [
  { year: '2022', title: 'The problem becomes undeniable',
    detail: 'Consulting for three UK publishers and platforms simultaneously. Every company had brilliant products — and the same mess underneath. Different CRMs, different billing tools, different support platforms, all disconnected.' },
  { year: '2023', title: 'First prototype, Oxford',
    detail: 'Built the first version as an internal tool to fix the problem we kept seeing. Piloted with two growing businesses. The feedback was immediate: "We\'ve been waiting for this." Realised it was a product, not just a script.' },
  { year: '2024', title: 'Lumio is incorporated',
    detail: 'Seed round closed. Team grows to six. First paying customers go live. The core dashboard and workflow engine are built from scratch for growing SMBs — not adapted from a generic tool. First integrations with Xero, HubSpot, and Microsoft 365.' },
  { year: '2025', title: 'Platform opens to all sectors',
    detail: '150 workflows live across 14 departments. AI-powered steps powered by Claude added to the platform. Now serving growing businesses of 10–500 people across professional services, recruitment, healthcare, SaaS, education, and beyond.' },
]

const BUSINESS_TEAM = [
  { name: 'Arron Margeison', role: 'Founder & CEO', bg: '#0D9488', initials: 'AM',
    bio: 'Former operations consultant. Spent years watching brilliant companies struggle with the same operational problems. Built Lumio to fix that.',
    tags: ['Oxford', 'SMBs', 'Ops & Automation', 'B2B SaaS'],
    quote: 'I\'ve sat in enough Monday morning meetings watching people copy-paste from four different tabs. Lumio is the tool I wished existed every single time.' },
  { name: 'TBA', role: 'Head of Engineering', bg: '#6C3FC5', initials: '?',
    bio: 'We\'re hiring. If you love building reliable, high-volume automation infrastructure and care about SMB automation, we want to hear from you.',
    tags: ['Backend', 'Infrastructure', 'TypeScript', 'Node'], quote: null },
  { name: 'TBA', role: 'Head of Customer Success', bg: '#F59E0B', initials: '?',
    bio: 'We\'re hiring. If you\'ve worked in growing businesses and know what "good" looks like for onboarding and retention, let\'s talk.',
    tags: ['CS', 'SMBs', 'SaaS', 'Retention'], quote: null },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [isSports, setIsSports] = useState(false)
  useEffect(() => {
    setIsSports(window.location.hostname.includes('lumiosports'))
  }, [])

  if (isSports) return <SportsAbout />
  return <BusinessAbout />
}

// ─── Sports About ─────────────────────────────────────────────────────────────

function SportsAbout() {
  return (
    <div style={{ color: '#F9FAFB' }} className="pt-28 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 text-center mb-24">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>About Lumio Sports</p>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          The operating system for{' '}
          <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            professional sport
          </span>
        </h1>
        <p className="text-base font-medium mb-4" style={{ color: '#8B5CF6', maxWidth: 640, margin: '0 auto' }}>
          Built from scratch for sport — not adapted from business software.
        </p>
        <p className="text-lg leading-relaxed" style={{ color: '#9CA3AF', maxWidth: 640, margin: '0 auto' }}>
          Lumio Sports is the career and club intelligence platform for professional athletes and sports organisations. Ten portals, one platform, zero compromises.
        </p>
      </section>

      {/* Why */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Why we built this</p>
              <h2 className="text-3xl font-bold mb-6">The infrastructure gap in professional sport</h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
                <p>Professional sport creates more financial complexity, regulatory obligation, and operational pressure than almost any other industry — and manages it with WhatsApp groups and spreadsheets.</p>
                <p>A world title contender signs a fight contract without knowing what they&apos;ll take home. A Champ Rugby club tracks salary cap headroom in Excel, one formula error from a regulatory breach. A women&apos;s football club has FSR compliance rules with zero dedicated software to track them.</p>
                <p>Lumio Sports exists because the people who make sport what it is — the players, the coaches, the directors, the clubs — deserve infrastructure that understands the game they&apos;re in.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl p-6" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>What we kept seeing</p>
                <ul className="space-y-3">
                  {['Salary cap headroom tracked in a spreadsheet — one formula from a breach','Concussion protocols managed on paper with no audit trail','Fight purses agreed with no transparent take-home calculation','Women\'s football FSR obligations tracked manually across departments','Franchise readiness assessed without a single digital score','International data handoff done by email attachment','Non-league ground grading evidence scattered across folders','Player contracts and renewal dates tracked in someone\'s head'].map((item: string) => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                      <span style={{ color: '#EF4444', flexShrink: 0 }}>→</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#8B5CF6' }}>What Lumio Sports does instead</p>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  Builds the entire operational, financial and compliance infrastructure each sport actually needs — with regulation-aware dashboards, AI-powered briefings, and integrations with the data systems sport already uses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ten portals */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>What we build</p>
          <h2 className="text-3xl font-bold">Ten portals. One platform.</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SPORTS_PORTALS.map((p: { emoji: string; title: string; accent: string; href: string; desc: string }) => (
            <div key={p.title} className="rounded-xl p-7 flex flex-col" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937', borderTop: `4px solid ${p.accent}` }}>
              <div className="text-3xl mb-4">{p.emoji}</div>
              <h3 className="text-base font-semibold mb-3" style={{ color: '#F9FAFB' }}>{p.title}</h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: '#6B7280' }}>{p.desc}</p>
              <Link href={p.href} className="text-sm font-medium mt-4 inline-block" style={{ color: p.accent }}>Explore →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>How we work</p>
          <h2 className="text-3xl font-bold">Our values</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {SPORTS_VALUES.map((v: { emoji: string; title: string; desc: string }) => (
            <div key={v.title} className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="text-3xl mb-4">{v.emoji}</div>
              <h3 className="text-base font-semibold mb-3" style={{ color: '#F9FAFB' }}>{v.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>History</p>
            <h2 className="text-3xl font-bold">How we got here</h2>
          </div>
          <div className="space-y-0">
            {SPORTS_TIMELINE.map((item: { year: string; title: string; detail: string }, i: number) => (
              <div key={item.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shrink-0" style={{ backgroundColor: '#8B5CF6', color: '#F9FAFB' }}>
                    {item.year}
                  </div>
                  {i < SPORTS_TIMELINE.length - 1 && <div className="w-px flex-1 my-2" style={{ backgroundColor: '#1F2937' }} />}
                </div>
                <div className="pb-12">
                  <p className="text-base font-semibold mb-2" style={{ color: '#F9FAFB' }}>{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>The team</p>
          <h2 className="text-3xl font-bold">Who&apos;s building Lumio Sports</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {SPORTS_TEAM.map((member: { name: string; role: string; bg: string; initials: string; bio: string; tags: string[]; quote: string | null }) => (
            <div key={member.name} className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold shrink-0" style={{ backgroundColor: member.bg, color: '#F9FAFB' }}>{member.initials}</div>
                <div><p className="font-semibold">{member.name}</p><p className="text-sm" style={{ color: '#6B7280' }}>{member.role}</p></div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#9CA3AF' }}>{member.bio}</p>
              {member.quote && <blockquote className="text-xs leading-relaxed italic mb-4" style={{ color: '#6B7280', borderLeft: `2px solid ${member.bg}`, paddingLeft: 12 }}>&quot;{member.quote}&quot;</blockquote>}
              <div className="flex flex-wrap gap-1.5">
                {member.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#111318', color: '#6B7280', border: '1px solid #1F2937' }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact + CTA */}
      <section className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B7280' }}>
          Lumio Sports is built by Lumio Ltd, based in the UK. We are a small team with an outsized ambition: to become the operating system of choice for professional sport globally.
        </p>
        <p className="text-sm" style={{ color: '#6B7280' }}>Get in touch: hello@lumiosports.com</p>
      </section>
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-5">See it for yourself</h2>
          <p className="text-base mb-8" style={{ color: '#6B7280' }}>Every portal has a live demo. No login required, no sales pitch — just the platform.</p>
          <Link href="/sports-product" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#8B5CF6', color: '#F9FAFB' }}>
            Explore all portals <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}

// ─── Business About ───────────────────────────────────────────────────────────

function BusinessAbout() {
  return (
    <div style={{ color: '#F9FAFB' }} className="pt-28 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 text-center mb-24">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>About Lumio</p>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          The operating system for{' '}
          <span style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            growing UK businesses
          </span>
        </h1>
        <p className="text-base font-medium mb-4" style={{ color: '#0D9488', maxWidth: 640, margin: '0 auto' }}>
          Your business, fully connected.
        </p>
        <p className="text-lg leading-relaxed" style={{ color: '#9CA3AF', maxWidth: 640, margin: '0 auto' }}>
          Lumio is the connected operating system for growing businesses — workflows, CRM, HR, finance and AI in one platform. Today it powers teams across professional services, healthcare, recruitment, SaaS, education and beyond.
        </p>
      </section>

      {/* Why */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Why we exist</p>
              <h2 className="text-3xl font-bold mb-6">The problem that wouldn&apos;t go away</h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
                <p>Before founding Lumio, our team spent years consulting for and working inside growing businesses — publishers, professional services firms, SaaS companies and schools. The companies were different. The operational reality was always the same.</p>
                <p>Every Monday morning, someone was copy-pasting from four tabs. The CRM didn&apos;t talk to accounting. The HR system was a spreadsheet. Support data lived in one place, customer health in another. New customers got onboarded three different ways depending on who was available.</p>
                <p>The market had Zapier, Make and a hundred generic tools. None came with workflows pre-built for real business problems. None had a dashboard that showed the whole business. None were built for teams of 20–500 who didn&apos;t have a RevOps function or a dev team to wire things together.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl p-6" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>What we kept seeing</p>
                <ul className="space-y-3">
                  {['New customers onboarded manually across 5–7 systems','Invoice chasing done by hand every 10 days','New joiner provisioning split across IT, HR and payroll emails','Renewal dates tracked in a spreadsheet column','Churn noticed only when it was already too late','Weekly reports taking 3 hours to compile','Support tickets triaged manually with no prioritisation','Lead follow-up happening days after the demo, not hours'].map((item: string) => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                      <span style={{ color: '#EF4444', flexShrink: 0 }}>→</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#0D9488' }}>What Lumio does instead</p>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  Automates every one of those things. With pre-built workflows, 40+ integrations, and AI-powered steps powered by Claude — so your team can focus on growth, not admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>What we build</p>
          <h2 className="text-3xl font-bold">One platform. Every department.</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_PRODUCTS.map((p: { emoji: string; title: string; accent: string; href: string; desc: string }) => (
            <div key={p.title} className="rounded-xl p-7 flex flex-col" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937', borderTop: `4px solid ${p.accent}` }}>
              <div className="text-3xl mb-4">{p.emoji}</div>
              <h3 className="text-base font-semibold mb-3" style={{ color: '#F9FAFB' }}>{p.title}</h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: '#6B7280' }}>{p.desc}</p>
              <Link href={p.href} className="text-sm font-medium mt-4 inline-block" style={{ color: p.accent }}>Explore →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>How we work</p>
          <h2 className="text-3xl font-bold">Our values</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BUSINESS_VALUES.map((v: { emoji: string; title: string; desc: string }) => (
            <div key={v.title} className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="text-3xl mb-4">{v.emoji}</div>
              <h3 className="text-base font-semibold mb-3" style={{ color: '#F9FAFB' }}>{v.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>History</p>
            <h2 className="text-3xl font-bold">How we got here</h2>
          </div>
          <div className="space-y-0">
            {BUSINESS_TIMELINE.map((item: { year: string; title: string; detail: string }, i: number) => (
              <div key={item.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shrink-0" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>{item.year}</div>
                  {i < BUSINESS_TIMELINE.length - 1 && <div className="w-px flex-1 my-2" style={{ backgroundColor: '#1F2937' }} />}
                </div>
                <div className="pb-12">
                  <p className="text-base font-semibold mb-2" style={{ color: '#F9FAFB' }}>{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>The team</p>
          <h2 className="text-3xl font-bold">Who&apos;s building Lumio</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {BUSINESS_TEAM.map((member: { name: string; role: string; bg: string; initials: string; bio: string; tags: string[]; quote: string | null }) => (
            <div key={member.name} className="rounded-xl p-7" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold shrink-0" style={{ backgroundColor: member.bg, color: '#F9FAFB' }}>{member.initials}</div>
                <div><p className="font-semibold">{member.name}</p><p className="text-sm" style={{ color: '#6B7280' }}>{member.role}</p></div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#9CA3AF' }}>{member.bio}</p>
              {member.quote && <blockquote className="text-xs leading-relaxed italic mb-4" style={{ color: '#6B7280', borderLeft: `2px solid ${member.bg}`, paddingLeft: 12 }}>&quot;{member.quote}&quot;</blockquote>}
              <div className="flex flex-wrap gap-1.5">
                {member.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#111318', color: '#6B7280', border: '1px solid #1F2937' }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-5">Come and meet us</h2>
          <p className="text-base mb-8" style={{ color: '#6B7280' }}>
            We&apos;d love to show you what Lumio can do for your business. Book a call — no sales pitch, just a real conversation about whether it&apos;s a fit.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            Book a conversation <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
