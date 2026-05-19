'use client'

import Link from 'next/link'
import { CrossDiscoveryStrip } from '../components/CrossDiscoveryStrip'

const GREEN = '#16A34A'
const GREEN_DARK = '#166534'
const GREEN_LIGHT = '#22C55E'
const GOLD = '#F1C40F'
const BG = '#07080F'
const CARD = '#0D1117'
const BORDER = '#1E293B'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const PILLS = [
  'Parent-funded',
  'FA-safeguarding native',
  'Per-child highlights',
  'Video + GPS + development',
  'U7–U16',
]

const FEATURES = [
  {
    icon: '👨‍👧',
    title: 'Parent App + AI Match Recap',
    desc: "Sunday afternoon, kettle on, your child's morning is waiting. Highlights, GPS headline, coach note, minutes played and position — in plain English. The flagship of the platform.",
  },
  {
    icon: '🎬',
    title: 'Match Video & Highlights',
    desc: "Full-match library for coaches; per-child auto-clipped highlight reel for parents. Clips filtered by player and consent — your child's reel, never the rest of the squad's.",
  },
  {
    icon: '📡',
    title: 'Junior GPS & Performance',
    desc: 'Distance, sprints, top speed and a position heatmap from every match. Plain-English explanations on every tile — designed for parents and volunteer coaches, not sports scientists.',
  },
  {
    icon: '📈',
    title: 'Player Development Tracker',
    desc: 'The FA four-corner model — technical, physical, social, psychological — authored by the coach, signed off by the Academy Lead, surfaced parent-friendly. Termly reviews, milestone badges, growth-aware load.',
  },
  {
    icon: '🛡️',
    title: 'Safeguarding & Consent Hub',
    desc: 'FA Charter Standard compliance flagship. Per-child photography / filming / data-sharing consent, DBS register, incident log, automatic imagery exclusion for restricted children. Built first, not bolted on.',
  },
  {
    icon: '🎽',
    title: 'Coach Toolkit',
    desc: 'Light-touch by design. Volunteer-friendly session brief, drill library by age band, drag-and-drop team selection, FIFA-style player cards reading the same four-corner data as the tracker.',
  },
]

interface PricingTier {
  name: string
  price: string
  priceSub?: string
  features: string[]
  highlight?: boolean
}

const CLUB_PRICING: PricingTier[] = [
  {
    name: 'Junior Club — Starter',
    price: 'Free',
    priceSub: 'up to 3 teams',
    features: [
      'Safeguarding & Consent Hub',
      'Fixtures, training, RSVPs',
      'Squad lists & registration',
      'GDPR-bounded parent comms',
      'FA Charter Standard evidence pack',
    ],
  },
  {
    name: 'Junior Club — Pro',
    price: '£49',
    priceSub: '/month',
    highlight: true,
    features: [
      'Everything in Starter',
      'Unlimited teams across all age bands',
      'Coach Toolkit — session planner, drills, selection',
      'Match Video library + auto-tagging',
      'Player Development Tracker (FA four-corner)',
      'Junior GPS & Performance dashboards',
    ],
  },
  {
    name: 'Junior Academy',
    price: '£149',
    priceSub: '/month',
    features: [
      'Everything in Pro',
      'Academy Lead role with termly review sign-off',
      'Cross-age-band development pathway view',
      'AI Match Recap — Half-Time / Full-Time / Training briefs',
      'Revenue & Funding dashboard with revenue share',
      'Dedicated onboarding + WhatsApp support',
    ],
  },
]

const PARENT_TIER = {
  name: 'Parent App',
  price: '£8.99',
  priceSub: '/month per child',
  features: [
    'Per-child match recap, every Sunday',
    'Your own child\'s highlight reel + GPS',
    'Season timeline and keepsake archive',
    'Fixtures, RSVPs, fees in one place',
  ],
}

export default function FootballJuniorPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '128px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 20% 10%, ${GREEN}33, transparent 50%), radial-gradient(circle at 80% 60%, ${GREEN_DARK}55, transparent 55%)`,
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.2em',
              color: GOLD,
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            LUMIO FOOTBALL · JUNIOR
          </div>
          <h1
            style={{
              fontSize: 'clamp(44px, 7vw, 76px)',
              fontWeight: 900,
              lineHeight: 1.05,
              color: TEXT,
              marginBottom: 24,
              maxWidth: 980,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Give every parent a front-row seat.
          </h1>
          <p
            style={{
              fontSize: 19,
              color: MUTED,
              lineHeight: 1.6,
              maxWidth: 820,
              margin: '0 auto 40px',
            }}
          >
            Log in on a Sunday afternoon and watch your child&apos;s highlights from that morning&apos;s match — their stats, their heatmap, their season. Junior football&apos;s first platform built for the club, the coach and the parent.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link
              href="/sports-signup?sport=junior"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 32px',
                borderRadius: 12,
                backgroundColor: GREEN,
                color: '#000',
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: `0 20px 50px ${GREEN}55`,
              }}
            >
              Apply for founding access →
            </Link>
            <Link
              href="/junior/oakridge-juniors"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 32px',
                borderRadius: 12,
                backgroundColor: 'transparent',
                color: TEXT,
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                border: `1px solid ${BORDER}`,
              }}
            >
              Try the demo
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PILLS.map(p => (
              <span
                key={p}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(22,163,74,0.18)',
                  border: `1px solid ${GREEN}55`,
                  color: GOLD,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            What every junior club, coach and parent gets.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Six surfaces, designed for the realities of grassroots junior football — volunteer-led, safeguarding-first, and built so a parent on a Sunday afternoon sees the same data the coach used to pick the team.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────── */}
      {/* Junior has FOUR tiers: three club tiers + a parent-funded tier. The
          parent strip below the three club cards is the commercial
          differentiator — the platform is funded by parents, not billed to
          the club. */}
      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Free for the club. Funded by the parents.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 48 }}>
            Junior club tiers are optional upgrades for clubs that want the full toolkit. The flagship Parent App is billed per child to the parent — not to the club — so volunteer-run clubs pay nothing and parents get the experience they care about.
          </p>

          {/* Three club tiers — standard 3-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 32 }}>
            {CLUB_PRICING.map(p => (
              <div
                key={p.name}
                style={{
                  backgroundColor: CARD,
                  border: p.highlight ? `2px solid ${GREEN}` : `1px solid ${BORDER}`,
                  borderRadius: 16,
                  padding: 26,
                  position: 'relative',
                }}
              >
                {p.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '4px 12px',
                      borderRadius: 999,
                      backgroundColor: GREEN,
                      color: '#000',
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Most popular
                  </div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 900, color: TEXT, marginBottom: 6 }}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 18 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: GOLD }}>{p.price}</span>
                  {p.priceSub && <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>{p.priceSub}</span>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                      <span style={{ color: GOLD, fontWeight: 900, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Parent App strip — visually distinct, full-width, parent-funded tier */}
          <div
            style={{
              position: 'relative',
              borderRadius: 18,
              padding: 28,
              background: `linear-gradient(135deg, rgba(22,101,52,0.22) 0%, rgba(22,163,74,0.10) 60%, transparent 100%)`,
              border: `2px solid ${GREEN_LIGHT}`,
              boxShadow: `0 20px 50px rgba(22,163,74,0.18)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -12,
                left: 24,
                padding: '4px 12px',
                borderRadius: 999,
                backgroundColor: GREEN_LIGHT,
                color: '#0A0C14',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Parent-funded · the commercial model
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
                gap: 28,
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 6 }}>{PARENT_TIER.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: GOLD }}>{PARENT_TIER.price}</span>
                  <span style={{ fontSize: 14, color: MUTED, fontWeight: 600 }}>{PARENT_TIER.priceSub}</span>
                </div>
                <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.5, marginBottom: 0 }}>
                  The platform is funded by parents, not billed to the club. Volunteer-run clubs on the Starter tier give every parent the Parent App without paying a penny themselves — Lumio bills the parents who opt in, the club gets the toolkit at no cost.
                </p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PARENT_TIER.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                    <span style={{ color: GREEN_LIGHT, fontWeight: 900, flexShrink: 0 }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Big CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            The platform youth football has been waiting for.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            Try the Oakridge Juniors FC live demo — a Charter Standard development club running a full season on Lumio Junior, including the U11 Lions and the canonical Parent App view. Or apply for founding access to bring your own club on.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/sports-signup?sport=junior"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 32px',
                borderRadius: 12,
                backgroundColor: GREEN,
                color: '#000',
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: `0 20px 50px ${GREEN}55`,
              }}
            >
              Apply for founding access →
            </Link>
            <Link
              href="/junior/oakridge-juniors"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '18px 32px',
                borderRadius: 12,
                backgroundColor: 'transparent',
                color: TEXT,
                fontSize: 16,
                fontWeight: 800,
                textDecoration: 'none',
                border: `1px solid ${BORDER}`,
              }}
            >
              Try the demo →
            </Link>
          </div>
        </div>
      </section>

      <CrossDiscoveryStrip tier="junior" />
    </div>
  )
}
