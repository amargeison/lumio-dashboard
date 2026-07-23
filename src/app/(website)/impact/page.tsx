import Link from 'next/link'
import type { Metadata } from 'next'

// Lumio Impact — marketing page for the schools-and-community programmes
// platform (the white-labelled Ten Project build → a product for every
// organisation exposed to the 2026/27 school-sport funding change).
// Lives under (website) so it inherits the lumiosports.com chrome.
// Not yet linked from the main nav.

export const metadata: Metadata = {
  title: 'Lumio Impact — run the programme, prove the impact, unlock the funding',
  description:
    'The platform for organisations delivering sport and activity into schools and communities. Digital registers become funder-grade impact evidence, a built-in fundraising engine keeps unfunded schools in, and a parent app ties it all together.',
}

const PURPLE = '#7C3AED'
const PURPLE_LIGHT = '#A78BFA'
const BG = '#07080F'
const CARD = '#0D1117'
const CARD_ALT = '#111827'
const BORDER = '#1E293B'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'

const PILLS = ['Digital registers', 'Funder reporting', 'Fundraising engine', 'Parent app', 'Safeguarding', 'On your domain']

const FEATURES: { icon: string; title: string; desc: string }[] = [
  { icon: '🏫', title: 'Programmes & schools', desc: 'The organising backbone: schools, 10-week programme instances, cohorts and rosters, with status from enquiry to renewal. The structure a spreadsheet can’t hold once you’re running more than a handful of schools.' },
  { icon: '📲', title: 'Digital registers + QR check-in', desc: 'One-tap attendance in school; a gate QR that lets families check themselves in at community sessions — offline-first, because courts and parks have no signal. The same scan that takes the register is the data your funders want.' },
  { icon: '📊', title: 'Impact & funder reporting', desc: 'Participation, conversion, demographics, wellbeing and social value — one click from a branded PDF for any school, borough or trust. The evidence that now decides who keeps their funding, produced automatically.' },
  { icon: '💷', title: 'School fundraising engine', desc: 'When a school has no budget, it raises its own: live thermometer, event builder with AI packs, sponsored-ball-hit pledges, match funding and a public donate page. The route back in, not a dead end.' },
  { icon: '📱', title: 'Family app', desc: 'Everything a parent needs in one installable app — progress, this week’s activity and videos, their venue with map and QR check-in, and every message. Replaces the weekly-email patchwork.' },
  { icon: '📣', title: 'Communications suite', desc: 'One inbox across email, SMS, app and WhatsApp; branded newsletters with real open/click analytics; audience segments and automation journeys. Retire Mailchimp — and scope every send per venue, per family.' },
  { icon: '🛡️', title: 'Safeguarding & compliance', desc: 'DBS, safeguarding training, First Aid and insurance tracked with expiry alerts; layered consent and audit trails built for the ICO Children’s Code. The safeguarding you can prove to a funder.' },
  { icon: '👥', title: 'Coaches & volunteers', desc: 'Recruit, onboard and assign coaches and volunteers to schools and venues; session run-sheets, resources and a “can this session run?” readiness view. Your whole delivery team in one place.' },
  { icon: '🌐', title: 'Your website, built in', desc: 'A fast, accessible marketing site on your own domain with the portal logins, a live venue finder and self-updating impact counters — every enquiry and registration becoming a real record, not a lost form.' },
]

const AUDIENCES: { icon: string; label: string; desc: string }[] = [
  { icon: '🎾', label: 'Sport charities & foundations', desc: 'Delivering into schools and communities — tennis, cricket, football community trusts and beyond. The programme, the evidence and the income in one platform.' },
  { icon: '☀️', label: 'Holiday activity (HAF) providers', desc: 'Council-funded holiday clubs with statutory per-child, per-session attendance and demographic reporting every holiday. That return, done by QR check-in — not spreadsheets.' },
  { icon: '🏟️', label: 'Club community organisations', desc: 'Club charities running schools and health programmes, each independently funded and reporting social value. One platform, one standard across the network.' },
  { icon: '🏫', label: 'Multi-sport school providers', desc: 'PE, PPA cover, after-school clubs and camps paid from the ending Premium. Give every school digital registers, impact reporting and a new income stream.' },
]

export default function ImpactPage() {
  return (
    <main style={{ background: BG, color: TEXT, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        .li-wrap { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .li-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .li-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        @media (max-width: 820px) { .li-grid3, .li-grid2 { grid-template-columns: 1fr; } .li-h1 { font-size: 40px !important; } }
      `}</style>

      {/* Hero — centred, matching the other lumiosports.com product pages */}
      <section style={{ padding: '70px 0 66px', borderBottom: `1px solid ${BORDER}`, background: '#121C34' }}>
        <div className="li-wrap" style={{ textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lumio-impact-logo-web.png" alt="Lumio Impact" style={{ width: 'min(560px, 90%)', height: 'auto', display: 'block', margin: '0 auto 28px' }} />
          <h1 className="li-h1" style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.06, margin: '0 auto 18px', maxWidth: 860 }}>
            Run the programme. Prove the impact. <span style={{ color: PURPLE_LIGHT }}>Unlock the funding.</span>
          </h1>
          <p style={{ fontSize: 18, color: MUTED, maxWidth: 680, lineHeight: 1.6, margin: '0 auto' }}>
            The platform for organisations delivering sport and activity into schools and communities. Your registers become funder-grade impact evidence, a built-in fundraising engine keeps unfunded schools in the game, and a parent app ties it all together — on your own brand.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/tenproject/demo" style={{ background: PURPLE, color: '#fff', borderRadius: 10, padding: '14px 24px', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
              See it live in a demo →
            </Link>
            <a href="mailto:hello@lumiosports.com?subject=Lumio%20Impact" style={{ background: 'transparent', color: TEXT, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '14px 24px', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
              Talk to us
            </a>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 34, justifyContent: 'center' }}>
            {PILLS.map(p => (
              <span key={p} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '7px 15px', fontSize: 12.5, color: MUTED, fontWeight: 600 }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* The shift — funding change */}
      <section style={{ padding: '64px 0', background: CARD }}>
        <div className="li-wrap">
          <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 2, color: PURPLE_LIGHT }}>WHY NOW</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: '10px 0 14px', maxWidth: 760 }}>The funding just changed under everyone’s feet</h2>
          <p style={{ fontSize: 16, color: MUTED, maxWidth: 720, lineHeight: 1.65 }}>
            The Primary PE &amp; Sport Premium — £320m a year paid straight to 16,000 schools — is being scrapped. From 2026/27 it’s replaced by a centrally-commissioned network with less money, spread across more schools, routed through providers who can <strong style={{ color: TEXT }}>prove participation and impact</strong>. Overnight, every organisation delivering sport into schools needs two things: evidence for funders, and a way to replace the income a school’s direct budget used to provide.
          </p>
          <div className="li-grid3" style={{ marginTop: 26 }}>
            {[
              ['16,000', 'primary schools lose direct Premium funding'],
              ['£580m', 'new network — ~22% lower, over 7 terms'],
              ['Prove it', 'or lose it — funding now follows evidence'],
            ].map(([n, l]) => (
              <div key={l as string} style={{ background: CARD_ALT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: PURPLE_LIGHT }}>{n}</div>
                <div style={{ fontSize: 13.5, color: MUTED, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The loop */}
      <section style={{ padding: '64px 0' }}>
        <div className="li-wrap">
          <div style={{ background: `linear-gradient(135deg, ${PURPLE}22, transparent)`, border: `1px solid ${PURPLE}44`, borderRadius: 18, padding: '30px 32px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 2, color: PURPLE_LIGHT }}>THE IDEA</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, margin: '10px 0 12px' }}>The delivery-to-funder loop</h2>
            <p style={{ fontSize: 16, color: MUTED, maxWidth: 760, lineHeight: 1.65 }}>
              Every other tool sits in one silo: club admin does bookings, school platforms take the payment, reporting tools prove outcomes — none of them joined up. Lumio Impact closes the loop. The QR check-in that takes your register <em style={{ color: TEXT, fontStyle: 'normal', fontWeight: 700 }}>is</em> your impact data; the impact data is your funder report; the funder report is what keeps the money coming — and when a school has none, the fundraising engine raises it. One platform, one dataset, from the gate to the grant.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '20px 0 64px' }}>
        <div className="li-wrap">
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 8px' }}>Everything a programme needs, in one place</h2>
          <p style={{ fontSize: 15.5, color: MUTED, maxWidth: 680, marginTop: 0 }}>Delivery, engagement, evidence and income — no stitching together five tools that don’t talk to each other.</p>
          <div className="li-grid3" style={{ marginTop: 26 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ fontSize: 24 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: MUTED, marginTop: 7, lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ padding: '64px 0', background: CARD }}>
        <div className="li-wrap">
          <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 2, color: PURPLE_LIGHT }}>WHO IT’S FOR</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: '10px 0 8px' }}>Built for organisations that deliver at scale</h2>
          <p style={{ fontSize: 15.5, color: MUTED, maxWidth: 700, marginTop: 0 }}>If you run programmes across many schools or sites, depend on grants and school budgets, and have to prove your impact — this is for you.</p>
          <div className="li-grid2" style={{ marginTop: 26 }}>
            {AUDIENCES.map(a => (
              <div key={a.label} style={{ background: CARD_ALT, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px 24px' }}>
                <div style={{ fontSize: 26 }}>{a.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 8 }}>{a.label}</div>
                <div style={{ fontSize: 13.5, color: MUTED, marginTop: 7, lineHeight: 1.55 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '70px 0 90px', background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div className="li-wrap" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 14px' }}>Turn your delivery into funding</h2>
          <p style={{ fontSize: 16.5, color: MUTED, maxWidth: 620, margin: '0 auto 28px', lineHeight: 1.6 }}>
            We white-label it to your brand, run it on your domain, and get you from paper and inboxes to funder-ready in a term.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tenproject/demo" style={{ background: PURPLE, color: '#fff', borderRadius: 10, padding: '15px 28px', fontSize: 15.5, fontWeight: 800, textDecoration: 'none' }}>
              See it live in a demo →
            </Link>
            <a href="mailto:hello@lumiosports.com?subject=Lumio%20Impact" style={{ background: 'transparent', color: TEXT, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '15px 28px', fontSize: 15.5, fontWeight: 800, textDecoration: 'none' }}>
              Talk to us
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
