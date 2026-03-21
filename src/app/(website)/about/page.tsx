import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const VALUES = [
  {
    emoji: '🎓',
    title: 'SMBs first, always',
    desc: 'We build for growing businesses. That focus means every workflow, every integration, every design decision is shaped by the specific problems SMBs face — not generic SaaS assumptions.',
  },
  {
    emoji: '🔒',
    title: 'Privacy by design',
    desc: 'GDPR compliance isn\'t bolted on. We architect data handling from the ground up with school data, pupil data, and staff data in mind. Every integration is scoped to the minimum necessary access.',
  },
  {
    emoji: '⚡',
    title: 'Speed to value',
    desc: 'You should see ROI in your first week. We measure our own success by how quickly customers connect their first workflow and how many manual hours it saves by the end of month one.',
  },
  {
    emoji: '🤝',
    title: 'Genuinely customer-obsessed',
    desc: 'Our founders still take every sales call. We know our customers by name. When something breaks or a workflow misfires, we\'re the ones picking up the phone — not passing it to a ticket queue.',
  },
  {
    emoji: '🧠',
    title: 'AI as a tool, not a gimmick',
    desc: 'We use Claude where it genuinely improves an outcome — drafting proposals, chasing invoices, scoring leads, summarising calls. Not to add an "AI" badge to a feature that doesn\'t need it.',
  },
  {
    emoji: '📖',
    title: 'Transparent by default',
    desc: 'No dark patterns. No hidden fees. No confusing pricing tiers designed to upsell. You always know what Lumio is doing, why, and what it costs. Our audit log exists for you, not us.',
  },
]

const TIMELINE = [
  {
    year: '2022',
    title: 'The problem becomes undeniable',
    detail: 'Consulting for three UK publishers and platforms simultaneously. Every company had brilliant products — and the same mess underneath. Different CRMs, different billing tools, different support platforms, all disconnected. Every Monday morning started with three hours of copy-pasting before the actual work could begin.',
  },
  {
    year: '2023',
    title: 'First prototype, Oxford',
    detail: 'Built the first version as an internal tool to fix the problem we kept seeing. Piloted with two growing businesses. The feedback was immediate: "We\'ve been waiting for this." Realised it was a product, not just a script.',
  },
  {
    year: '2024',
    title: 'Lumio is incorporated',
    detail: 'Seed round closed. Team grows to six. First paying customers go live. The core dashboard and workflow engine are built from scratch for growing SMBs — not adapted from a generic tool. First integrations with Xero, HubSpot, and Microsoft 365.',
  },
  {
    year: '2025',
    title: 'Platform opens to all sectors',
    detail: '47+ workflows live. AI-powered steps powered by Claude added to the platform. Growth and Enterprise plans launched. Now serving growing businesses of 10–500 people across professional services, recruitment, healthcare, SaaS, and beyond — across the UK and internationally.',
  },
]

const TEAM = [
  {
    name: 'Arron Margeison',
    role: 'Founder & CEO',
    bg: '#0D9488',
    initials: 'AM',
    bio: 'Former operations consultant. Spent years watching brilliant companies struggle with the same operational problems. Built Lumio to fix that.',
    tags: ['Oxford', 'SMBs', 'Ops & Automation', 'B2B SaaS'],
    quote: 'I\'ve sat in enough Monday morning meetings watching people copy-paste from four different tabs. Lumio is the tool I wished existed every single time.',
  },
  {
    name: 'TBA',
    role: 'Head of Engineering',
    bg: '#6C3FC5',
    initials: '?',
    bio: 'We\'re hiring. If you love building reliable, high-volume automation infrastructure and care about SMB automation, we want to hear from you.',
    tags: ['Backend', 'Infrastructure', 'Typescript', 'Node'],
    quote: null,
  },
  {
    name: 'TBA',
    role: 'Head of Customer Success',
    bg: '#F59E0B',
    initials: '?',
    bio: 'We\'re hiring. If you\'ve worked in growing businesses and know what "good" looks like for onboarding and retention, let\'s talk.',
    tags: ['CS', 'SMBs', 'SaaS', 'Retention'],
    quote: null,
  },
]

const BACKED_BY = [
  'Built by practitioners who\'ve worked inside growing businesses',
  'Funded by people who understand the SMB market',
  'Advised by former operators from across professional services, SaaS, and publishing',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div style={{ color: '#F9FAFB' }} className="pt-28 pb-20">

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 text-center mb-24">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>About Lumio</p>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Built by operators,{' '}
          <span style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            for growing businesses
          </span>
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: '#9CA3AF', maxWidth: 640, margin: '0 auto' }}>
          Lumio was built to fix the operational chaos inside growing businesses. Today it powers teams across professional services, healthcare, recruitment, SaaS, education, and beyond.
        </p>
      </section>

      {/* The problem we exist to solve */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Why we exist</p>
              <h2 className="text-3xl font-bold mb-6">The problem that wouldn't go away</h2>
              <div className="space-y-4 text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
                <p>
                  Before founding Lumio, our team spent years consulting for and working inside growing businesses — publishers, platforms, professional services firms, and SaaS companies across the UK. The companies were different. The operational reality was always the same.
                </p>
                <p>
                  Every Monday morning, someone was copy-pasting from four tabs. HubSpot didn't talk to Xero. The HR system was a spreadsheet. Support data lived in one place, CSAT scores in another. New customers got onboarded three different ways depending on who was available.
                </p>
                <p>
                  The market had Zapier, Make, and a hundred generic tools. None came with workflows pre-built for real business problems. None had a dashboard that showed the whole business. None were built for teams of 20–200 who didn't have a RevOps function or a dev team to wire things together.
                </p>
                <p>
                  We started in education because that's where we lived. But the same problems exist in recruitment, professional services, healthcare, SaaS — anywhere a growing team is scaling faster than their tooling. Lumio now serves all of them.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl p-6" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>What we kept seeing</p>
                <ul className="space-y-3">
                  {[
                    'New customers onboarded manually across 5–7 systems',
                    'Invoice chasing done by hand every 10 days',
                    'New joiner provisioning split across IT, HR, and payroll emails',
                    'Renewal dates tracked in a spreadsheet column',
                    'Churn noticed only when it was already too late',
                    'Weekly reports taking 3 hours to compile',
                    'Support tickets triaged manually with no prioritisation',
                    'Lead follow-up happening days after the demo, not hours',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                      <span style={{ color: '#EF4444', flexShrink: 0 }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl p-6"
                style={{ backgroundColor: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#0D9488' }}>What Lumio does instead</p>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  Automates every one of those things. With pre-built workflows, 40+ integrations, and AI-powered steps that handle the nuance — so your team can focus on growth, not admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold"
                style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                AM
              </div>
              <div>
                <p className="font-semibold text-base">Arron Margeison</p>
                <p className="text-sm" style={{ color: '#6B7280' }}>Founder & CEO</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Oxford', 'SMBs', 'B2B SaaS'].map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: '#111318', color: '#6B7280', border: '1px solid #1F2937' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <blockquote className="text-sm leading-relaxed italic mb-4"
              style={{ color: '#9CA3AF', borderLeft: '3px solid #0D9488', paddingLeft: 16 }}>
              "I've sat in enough Monday morning meetings watching people copy-paste from four different tabs before the actual work could start. Every growing business I worked with had the same problem. Lumio is the tool I wished existed every time."
            </blockquote>
            <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
              Before Lumio, Arron spent years consulting for publishers, platforms, and professional services firms across the UK — working across HR, sales operations, customer success, and finance. The pattern was always the same: brilliant products, passionate people, and a mess of disconnected tools underneath.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>The founding story</p>
            <h2 className="text-3xl font-bold mb-5">Practitioners, not just founders</h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: '#9CA3AF' }}>
              Lumio was built by people who lived these problems — in Oxford-based businesses first, then across the broader landscape of growing UK companies. Every workflow in the platform reflects a real situation we saw play out: a new customer onboarded across seven systems by hand, a deal lost because follow-up took three days, a churn signal spotted only after the cancellation email arrived.
            </p>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#9CA3AF' }}>
              We started in education. We've expanded into professional services, recruitment, healthcare, and SaaS because the operational problems are identical — only the terminology changes. The same invoice chase logic works for a publisher and a consulting firm. The same lead scoring works for a curriculum platform and a B2B SaaS.
            </p>
            <ul className="space-y-3">
              {BACKED_BY.map(point => (
                <li key={point} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                  <Check size={15} style={{ color: '#0D9488', flexShrink: 0, marginTop: 1 }} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ backgroundColor: '#0A0B12', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4B5563' }}>Our mission</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The operating system for{' '}
            <span style={{ background: 'linear-gradient(135deg, #0D9488, #6C3FC5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              modern growing businesses
            </span>
          </h2>
          <p className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: '#4B5563' }}>Our vision</p>
          <p className="text-lg leading-relaxed mb-8" style={{ color: '#9CA3AF' }}>
            We believe the best businesses of the next decade won't be the ones with the most headcount. They'll be the ones that operate with the most leverage — where every person is focused on high-value work, and the admin runs itself.
          </p>
          <p className="text-base leading-relaxed" style={{ color: '#6B7280' }}>
            Lumio is the platform that makes that possible. One connected system across every department. Workflows that run in the background. Insights that surface without a request. Built for growing businesses of 10 to 500 people — across any sector, any country, any structure.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4B5563' }}>How we work</p>
          <h2 className="text-3xl font-bold">Our values</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(v => (
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
            {TIMELINE.map((item, i) => (
              <div key={item.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shrink-0"
                    style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
                    {item.year}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px flex-1 my-2" style={{ backgroundColor: '#1F2937' }} />
                  )}
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
          <h2 className="text-3xl font-bold">Who's building Lumio</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TEAM.map(member => (
            <div key={member.name} className="rounded-xl p-7"
              style={{ backgroundColor: '#0D0E16', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold shrink-0"
                  style={{ backgroundColor: member.bg, color: '#F9FAFB' }}>
                  {member.initials}
                </div>
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm" style={{ color: '#6B7280' }}>{member.role}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#9CA3AF' }}>{member.bio}</p>
              {member.quote && (
                <blockquote className="text-xs leading-relaxed italic mb-4"
                  style={{ color: '#6B7280', borderLeft: `2px solid ${member.bg}`, paddingLeft: 12 }}>
                  "{member.quote}"
                </blockquote>
              )}
              <div className="flex flex-wrap gap-1.5">
                {member.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: '#111318', color: '#6B7280', border: '1px solid #1F2937' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-xl p-7 text-center"
          style={{ backgroundColor: '#0D0E16', border: '1px solid rgba(13,148,136,0.25)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#0D9488' }}>We're growing</p>
          <p className="text-sm mb-5" style={{ color: '#6B7280', maxWidth: 500, margin: '0 auto 20px' }}>
            If you're passionate about SMB automation, care about clean automation engineering, or have worked in business operations and want to fix the problems from the inside — we'd love to hear from you.
          </p>
          <Link href="/demo" style={{ color: '#0D9488', fontSize: 14, fontWeight: 500 }}>
            Reach out →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid #1F2937' }}>
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-5">Come and meet us</h2>
          <p className="text-base mb-8" style={{ color: '#6B7280' }}>
            We'd love to show you what Lumio can do for your business. Book a call — no sales pitch, just a real conversation about whether it's a fit.
          </p>
          <Link href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={undefined}
            onMouseLeave={undefined}>
            Book a conversation <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  )
}
