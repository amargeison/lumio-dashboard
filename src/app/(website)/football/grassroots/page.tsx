'use client'

import Link from 'next/link'
import { CrossDiscoveryStrip } from '../components/CrossDiscoveryStrip'

const GREEN = '#22C55E'
const GREEN_DARK = '#15803D'
const GOLD = '#F1C40F'
const BG = '#07080F'
const CARD = '#0D1117'
const BORDER = '#1E293B'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const PILLS = ['Amateur', 'Youth & Academy', 'Sunday League', 'Parent-friendly', 'Free tier']

const FEATURES = [
  { icon: '📱', title: 'Team Chat Replacement', desc: 'One place for parents, coaches, and players. Announcements, match reminders, pitch changes, match-day roll call — without the endless WhatsApp scroll of missed messages.' },
  { icon: '⚽', title: 'Simple Fixture Tracker', desc: 'League fixtures pulled from your county FA or entered manually. RSVPs from players/parents, automatic reminders the night before, and the match-day line-up ready on your phone.' },
  { icon: '💰', title: 'Subs & Fees', desc: 'Monthly subs, match fees, kit fees, tournament entries. See who has paid, who hasn\'t, and send a gentle nudge — all from the club admin view.' },
  { icon: '🗓️', title: 'Training Attendance', desc: 'Register attendance in 10 seconds. See who\'s turning up, who\'s not, and which players are consistent. Essential for team selection conversations with 10-year-olds and their parents.' },
  { icon: '📸', title: 'Match Day Sharing', desc: 'Upload the team photo, the final score, and a "player of the match" shout. Lumio drafts the post for the club socials — parents can re-share with one tap.' },
  { icon: '🏆', title: 'Tournament & Trophy Day', desc: 'Run a 5-a-side or age-group tournament without three spreadsheets. Fixture generator, live scores on a shared link, and a final standings PDF at full time.' },
]

const PRICING = [
  { name: 'Club Free', price: 'Free', features: ['Team chat & announcements', 'Fixture tracker + RSVPs', 'Training attendance', 'Subs & fees (manual reconcile)', '1 team, unlimited players'] },
  { name: 'Club Plus', price: '£9/mo', highlight: true, features: ['Everything in Free', 'Multi-team (up to 5 teams)', 'Auto-payment via Stripe', 'Tournament generator', 'AI social post drafts', 'Branded club page'] },
  { name: 'Academy', price: '£29/mo', features: ['Everything in Plus', 'Unlimited teams', 'Academy reports (parent-friendly)', 'Player development notes', 'Coach roster + qualifications', 'Dedicated WhatsApp support'] },
]

export default function FootballGrassrootsPage() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: '100vh' }}>
      <section style={{ padding: '96px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 20% 10%, ${GREEN}33, transparent 50%), radial-gradient(circle at 80% 60%, ${GREEN_DARK}55, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, textTransform: 'uppercase', marginBottom: 24 }}>
            LUMIO FOOTBALL · GRASSROOTS
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 76px)', fontWeight: 900, lineHeight: 1.05, color: TEXT, marginBottom: 24, maxWidth: 980, marginLeft: 'auto', marginRight: 'auto' }}>
            One app. Whole club. No more WhatsApp chaos.
          </h1>
          <p style={{ fontSize: 19, color: MUTED, lineHeight: 1.6, maxWidth: 820, margin: '0 auto 40px' }}>
            For grassroots clubs, Sunday League sides, and youth / academy setups. Fixtures, RSVPs, subs, attendance, match-day sharing, tournaments — all in a phone-first app your coaches and parents actually open. Free for every club, forever.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/grassroots/sunday-rovers-fc" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: GREEN, color: '#000', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${GREEN}55` }}>
              See live demo →
            </Link>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Book a walkthrough
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PILLS.map(p => (
              <span key={p} style={{ padding: '10px 18px', borderRadius: 999, backgroundColor: 'rgba(34,197,94,0.18)', border: `1px solid ${GREEN}55`, color: GOLD, fontSize: 13, fontWeight: 700 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 24px', backgroundColor: '#0A0C14' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            What every grassroots club wastes the most time on.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 56, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Six features that replace the spreadsheet, the WhatsApp scroll, and the "did you pay this month?" chase. Everything a volunteer coach actually needs — nothing a pro club would use.
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

      <section style={{ padding: '96px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>
            Free for every grassroots club.
          </h2>
          <p style={{ fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 48 }}>
            Paid tiers only if you run multiple teams or want Stripe subs collection.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {PRICING.map(p => (
              <div key={p.name} style={{ backgroundColor: CARD, border: p.highlight ? `2px solid ${GREEN}` : `1px solid ${BORDER}`, borderRadius: 16, padding: 26, position: 'relative' }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 12px', borderRadius: 999, backgroundColor: GREEN, color: '#000', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Most popular</div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 900, color: TEXT, marginBottom: 6 }}>{p.name}</h3>
                <div style={{ fontSize: 26, fontWeight: 900, color: GOLD, marginBottom: 18 }}>{p.price}</div>
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
        </div>
      </section>

      <section style={{ padding: '120px 24px', backgroundColor: '#0A0C14', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.1 }}>
            Give your Sunday coach their weekends back.
          </h2>
          <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            Try the Sunday Rovers FC live demo — a fictional U14s club running a full season on Lumio. Or sign up your own club and run it all day one, free.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/grassroots/sunday-rovers-fc" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: GREEN, color: '#000', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: `0 20px 50px ${GREEN}55` }}>
              See live demo →
            </Link>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '18px 32px', borderRadius: 12, backgroundColor: 'transparent', color: TEXT, fontSize: 16, fontWeight: 800, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Book a walkthrough →
            </Link>
          </div>
        </div>
      </section>

      <CrossDiscoveryStrip tier="grassroots" />
    </div>
  )
}
