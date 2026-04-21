import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Lumio — building the AI operating system for sport, business and education',
  description:
    'Lumio is a UK-based company building AI-native operating systems for sport, business and education. Founded in 2023.',
}

const VALUES = [
  {
    emoji: '🎯',
    title: 'Built for the 99 percent',
    desc: 'Top-of-market organisations have bespoke IT. Everyone else runs on spreadsheets and group chats. Lumio is built for the teams, clubs, schools and businesses that have always deserved better infrastructure.',
  },
  {
    emoji: '🤖',
    title: 'AI-native, not AI-bolted-on',
    desc: 'Every surface is designed around Claude, not around a legacy record system with a chat widget glued on top. Morning briefings, compliance assistants, forecast models — AI is the operating layer.',
  },
  {
    emoji: '🔒',
    title: 'Privacy by design',
    desc: 'GDPR compliance is architected in from the ground up. UK data hosting, least-privilege integrations, role-based access. Every feature is shaped by who should and should not see the data.',
  },
  {
    emoji: '📖',
    title: 'Transparent by default',
    desc: 'Clear pricing, honest roadmaps, and a product that shows you its working. If we cannot explain a number, we do not ship it.',
  },
]

const TIMELINE = [
  {
    year: '2023',
    title: 'Lumio is founded in the UK',
    detail:
      'Founded in 2023 out of years of consulting inside UK sports organisations and growing businesses. Every engagement surfaced the same pattern: huge operational complexity managed through spreadsheets, group chats and email chains.',
  },
  {
    year: '2024',
    title: 'Lumio Sports ships',
    detail:
      'First sport portals go live — built from scratch for the realities of professional sport. AI morning briefings powered by Claude. The platform grows to cover football, rugby, cricket, tennis, golf, darts, boxing and women\'s football.',
  },
  {
    year: '2025',
    title: 'Ten sport portals, one platform',
    detail:
      'Lumio Sports covers the full breadth of UK professional sport — Pro Club, Non-League and Grassroots football, rugby salary cap and franchise readiness, women\'s football FSR, boxing purse simulation, tennis career OS, golf strokes-gained and darts PDC tracking.',
  },
  {
    year: '2026',
    title: 'Lumio Business and Lumio Schools waitlists open',
    detail:
      'Waitlists open for founding customers in late 2026. Lumio Business: CRM, Director Suite, department workflows, AI morning briefing. Lumio Schools: MIS sync, SSO, SEND, safeguarding and parent engagement.',
  },
]

const NEXT_PRODUCTS = [
  {
    tag: 'Late 2026',
    accent: '#0D9488',
    accentBg: 'rgba(13,148,136,0.08)',
    title: 'Lumio Business',
    desc: 'The AI operating system for how modern businesses actually run — CRM, team intelligence, board reporting and department workflows in one platform.',
    href: '/coming-soon/business',
    cta: 'Join the Business waitlist',
  },
  {
    tag: 'Late 2026',
    accent: '#22D3EE',
    accentBg: 'rgba(34,211,238,0.08)',
    title: 'Lumio Schools',
    desc: 'The UK-first all-in-one platform for schools — MIS sync, SSO, SEND, safeguarding, parent engagement and staff ops, built for UK realities.',
    href: '/coming-soon/schools',
    cta: 'Join the Schools waitlist',
  },
]

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#07080F', color: '#F9FAFB', paddingTop: 120, paddingBottom: 96 }}>
      {/* Hero */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', textAlign: 'center', marginBottom: 96 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#0D9488',
            backgroundColor: 'rgba(13,148,136,0.08)',
            border: '1px solid rgba(13,148,136,0.35)',
            marginBottom: 20,
          }}
        >
          ABOUT LUMIO
        </span>
        <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, marginBottom: 22 }}>
          Lumio — building the AI operating system for sport, business and education.
        </h1>
        <p style={{ fontSize: 18, color: '#9CA3AF', lineHeight: 1.65, maxWidth: 720, margin: '0 auto' }}>
          Founded in 2023 in the UK. We build AI-native platforms for the organisations that run on spreadsheets
          and group chats today — professional sport, growing businesses, and UK schools.
        </p>
      </section>

      {/* Current focus: Lumio Sports */}
      <section style={{ maxWidth: 960, margin: '0 auto 96px', padding: '0 24px' }}>
        <div style={{ padding: 32, backgroundColor: '#0D1117', border: '1px solid #1F2937', borderRadius: 18 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: '#8B5CF6',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Our current focus
          </p>
          <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 14 }}>Lumio Sports</h2>
          <p style={{ fontSize: 15, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 18, maxWidth: 760 }}>
            Ten sport portals serving professional clubs, players and coaches — football (Pro Club, Non-League,
            Grassroots), women&apos;s football, rugby, cricket, tennis, golf, darts and boxing. AI morning briefings
            powered by Claude. Compliance built in for each sport&apos;s governing body — FA, PSR, FSR, HIA, PDC,
            ECB and more.
          </p>
          <a
            href="https://lumiosports.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 18px',
              backgroundColor: '#8B5CF6',
              color: '#F9FAFB',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Visit lumiosports.com <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* What's next */}
      <section style={{ maxWidth: 960, margin: '0 auto 96px', padding: '0 24px' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.15em',
            color: '#6B7280',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          What&apos;s next
        </p>
        <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 28 }}>Lumio Business + Lumio Schools</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {NEXT_PRODUCTS.map(p => (
            <Link
              key={p.title}
              href={p.href}
              style={{
                display: 'block',
                padding: 28,
                backgroundColor: '#0D1117',
                border: `1px solid ${p.accent}40`,
                borderRadius: 18,
                textDecoration: 'none',
                color: '#F9FAFB',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  color: p.accent,
                  backgroundColor: p.accentBg,
                  border: `1px solid ${p.accent}55`,
                  marginBottom: 12,
                }}
              >
                {p.tag.toUpperCase()}
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.65, marginBottom: 16 }}>{p.desc}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: p.accent }}>
                {p.cta} <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section style={{ maxWidth: 960, margin: '0 auto 96px', padding: '0 24px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 28 }}>The story so far</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {TIMELINE.map(t => (
            <div
              key={t.year}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: 20,
                padding: 22,
                backgroundColor: '#0D1117',
                border: '1px solid #1F2937',
                borderRadius: 14,
                alignItems: 'start',
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0D9488' }}>{t.year}</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{t.title}</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.65, margin: 0 }}>{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section style={{ maxWidth: 960, margin: '0 auto 96px', padding: '0 24px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 28 }}>What we believe</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {VALUES.map(v => (
            <div
              key={v.title}
              style={{
                padding: 24,
                backgroundColor: '#0D1117',
                border: '1px solid #1F2937',
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{v.emoji}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{v.title}</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.65, margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <div
          style={{
            padding: 36,
            backgroundColor: '#0D1117',
            border: '1px solid #1F2937',
            borderRadius: 18,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>Want to talk?</h2>
          <p style={{ fontSize: 15, color: '#9CA3AF', lineHeight: 1.65, marginBottom: 20 }}>
            Press, partnerships, founding-customer conversations, or anything else.
          </p>
          <a
            href="mailto:hello@lumiocms.com?subject=Hello%20Lumio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              backgroundColor: '#0D9488',
              color: '#F9FAFB',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            hello@lumiocms.com <ArrowRight size={16} />
          </a>
          <p style={{ marginTop: 14, fontSize: 12, color: '#6B7280' }}>
            AI briefings across all Lumio products are powered by Claude from Anthropic.
          </p>
        </div>
      </section>
    </div>
  )
}
