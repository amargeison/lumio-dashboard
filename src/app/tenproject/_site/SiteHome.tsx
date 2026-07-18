'use client'

// New-website preview — see ../page.tsx. All venues/schools/quotes below are
// demo/fictional (Pattern 1). Headline participation numbers are Ten Project's
// own published figures. No real third-party partner brands (brand rules).

import React, { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, Search, Heart, School, PlayCircle, ArrowRight, CheckCircle,
  Users, Award, QrCode, Menu, X,
} from 'lucide-react'
import { TP_RED, TP_DARK, TP_PAPER, CURRICULUM, VENUES, IMPACT_AREAS, CAMPAIGN } from '@/data/tenproject/demo-data'

const NAV = [
  { id: 'what', label: 'What is Ten Project' },
  { id: 'sessions', label: 'Find a session' },
  { id: 'parents', label: 'Parents' },
  { id: 'schools', label: 'Schools' },
  { id: 'impact', label: 'Impact' },
]

const QUOTES = [
  { q: 'The sessions are incredible. Thank you for the unwavering support and passion you show our children.', who: 'Parent, school programme' },
  { q: 'You can see how much the children’s confidence has improved week after week!', who: 'Family, weekend sessions' },
  { q: 'It’s a lovely community and the boys love coming. It’s great watching them progress in such a lovely inclusive environment.', who: 'Parent, community sessions' },
]

export default function SiteHome() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [postcode, setPostcode] = useState('')

  return (
    <div style={{ background: TP_PAPER, color: TP_DARK, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        .tp-container { max-width: 1080px; margin: 0 auto; padding: 0 22px; }
        .tp-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .tp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
        .tp-navlinks { display: flex; gap: 22px; align-items: center; }
        .tp-counters { display: flex; gap: 14px; flex-wrap: wrap; }
        .tp-menu-btn { display: none; }
        @media (max-width: 820px) {
          .tp-grid3, .tp-grid2 { grid-template-columns: 1fr; }
          .tp-navlinks { display: none; }
          .tp-menu-btn { display: block; }
          .tp-hero-h1 { font-size: 34px !important; }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Preview ribbon */}
      <div style={{ background: '#22222A', color: '#C9C4BE', fontSize: 11.5, textAlign: 'center', padding: '7px 12px', fontWeight: 600 }}>
        NEW WEBSITE — PREVIEW · replaces the current Wix site · demo data where marked
      </div>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#ffffffF2', backdropFilter: 'blur(8px)', borderBottom: '1px solid #E7E2DC' }}>
        <div className="tp-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 88 }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tenproject_logo.png" alt="Ten Project" style={{ height: 68, width: 'auto', display: 'block' }} />
          </a>
          <nav className="tp-navlinks">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} style={{ fontSize: 13, fontWeight: 700, color: TP_DARK, textDecoration: 'none' }}>{n.label}</a>
            ))}
            <Link href="/tenproject/demo" style={{ fontSize: 13, fontWeight: 700, color: TP_DARK, textDecoration: 'none', border: '1.5px solid #E7E2DC', borderRadius: 9, padding: '8px 14px' }}>
              Portal login
            </Link>
            <a href="#sessions" style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: TP_RED, borderRadius: 9, padding: '9px 16px', textDecoration: 'none' }}>
              Find a free session
            </a>
          </nav>
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} className="tp-menu-btn" aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <nav style={{ borderTop: '1px solid #E7E2DC', background: '#fff', padding: '10px 22px 16px', display: 'grid', gap: 4 }}>
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} onClick={() => setMenuOpen(false)} style={{ fontSize: 14, fontWeight: 700, color: TP_DARK, textDecoration: 'none', padding: '9px 0' }}>{n.label}</a>
            ))}
            <Link href="/tenproject/demo" style={{ fontSize: 14, fontWeight: 700, color: TP_DARK, textDecoration: 'none', padding: '9px 0' }}>Portal login</Link>
            <a href="#sessions" onClick={() => setMenuOpen(false)} style={{ fontSize: 14, fontWeight: 800, color: '#fff', background: TP_RED, borderRadius: 9, padding: '11px 16px', textDecoration: 'none', textAlign: 'center', marginTop: 6 }}>Find a free session</a>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section id="top" style={{ background: TP_DARK, color: '#fff', padding: '72px 0 56px' }}>
        <div className="tp-container">
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: TP_RED }}>FREE SCHOOL & COMMUNITY TENNIS · AGES 4–10</div>
          <h1 className="tp-hero-h1" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, margin: '14px 0 16px', maxWidth: 760 }}>
            LEARN. <span style={{ color: TP_RED }}>PLAY.</span> TOGETHER.
          </h1>
          <p style={{ fontSize: 17, color: '#C9C4BE', maxWidth: 640, lineHeight: 1.55, margin: 0 }}>
            Ten weeks of free, fun, game-based tennis in your child’s school — plus free weekend
            family sessions on your local community courts. Every child gets a T-shirt, a ball and
            their own Activity Booklet.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
            <a href="#sessions" style={{ background: TP_RED, color: '#fff', borderRadius: 10, padding: '13px 22px', fontSize: 14.5, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Find a session near me <ArrowRight size={16} />
            </a>
            <a href="#schools" style={{ background: '#fff', color: TP_DARK, borderRadius: 10, padding: '13px 22px', fontSize: 14.5, fontWeight: 800, textDecoration: 'none' }}>
              Bring it to my school
            </a>
            <a href="#parents" style={{ background: 'none', color: '#fff', border: '1.5px solid #3A3A42', borderRadius: 10, padding: '13px 22px', fontSize: 14.5, fontWeight: 800, textDecoration: 'none' }}>
              Volunteer as a TENOR
            </a>
          </div>

          {/* Live impact counters */}
          <div className="tp-counters" style={{ marginTop: 40 }}>
            {[
              ['2,000+', 'children a week in school'],
              ['950+', 'family visits last summer'],
              ['10 weeks', 'completely free'],
              ['100%', 'of families would recommend us'],
            ].map(([n, l]) => (
              <div key={l} style={{ background: '#22222A', borderRadius: 12, padding: '14px 18px', minWidth: 150 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: TP_RED }}>{n}</div>
                <div style={{ fontSize: 11.5, color: '#C9C4BE', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: '#6B6560', marginTop: 8 }}>
            Counters go live from portal registers — self-updating, funder-ready.
          </div>
        </div>
      </section>

      {/* What is Ten Project */}
      <section id="what" style={{ padding: '64px 0' }}>
        <div className="tp-container">
          <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>What is Ten Project?</h2>
          <p style={{ fontSize: 15, color: '#6B6560', maxWidth: 680, lineHeight: 1.6, marginTop: 0 }}>
            A 10-week programme that gets families active together. Using modified equipment and balls,
            your child learns to hit, move, rally and score — collecting a Success Sticker in their
            Activity Booklet for every skill they master.
          </p>
          <div className="tp-grid3" style={{ marginTop: 26 }}>
            {[
              { icon: Award, t: 'LEARN', d: 'Physical literacy in line with the PE National Curriculum — agility, balance, coordination, and all four shots.' },
              { icon: PlayCircle, t: 'PLAY', d: 'Fun, game-based coaching from LTA-accredited, DBS-checked coaches. Games first, always.' },
              { icon: Heart, t: 'TOGETHER', d: 'Free weekend family sessions — mums and dads on court, meeting other families, being active together.' },
            ].map(c => {
              const Icon = c.icon
              return (
                <div key={c.t} style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #E7E2DC' }}>
                  <Icon size={26} style={{ color: TP_RED }} />
                  <div style={{ fontSize: 17, fontWeight: 900, marginTop: 10 }}>{c.t}</div>
                  <div style={{ fontSize: 13.5, color: '#6B6560', marginTop: 6, lineHeight: 1.55 }}>{c.d}</div>
                </div>
              )
            })}
          </div>

          {/* 10-week journey */}
          <div style={{ marginTop: 34, background: '#fff', borderRadius: 16, border: '1px solid #E7E2DC', padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>Your child’s 10 weeks</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {CURRICULUM.map(b => (
                <div key={b.skill} style={{ minWidth: 150, background: TP_PAPER, borderRadius: 12, padding: '12px 14px', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: TP_RED, letterSpacing: 0.8 }}>WEEKS {b.weeks}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 900, marginTop: 3 }}>{b.skill}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#6B6560', marginTop: 10 }}>
              Week 10 is the Ten Project Festival — the celebration where every child receives their certificate.
            </div>
          </div>
        </div>
      </section>

      {/* Find a session */}
      <section id="sessions" style={{ background: '#fff', padding: '64px 0', borderTop: '1px solid #E7E2DC', borderBottom: '1px solid #E7E2DC' }}>
        <div className="tp-container">
          <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>Free Community Family Sessions</h2>
          <p style={{ fontSize: 15, color: '#6B6560', maxWidth: 680, lineHeight: 1.6, marginTop: 0 }}>
            Register once, then check in with a QR scan at the gate every week — it even works with no
            phone signal. All equipment provided; every family welcome.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, maxWidth: 420 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: TP_PAPER, borderRadius: 10, padding: '0 14px', border: '1px solid #E7E2DC' }}>
              <Search size={16} style={{ color: '#8A847E' }} />
              <input
                value={postcode}
                onChange={e => setPostcode(e.target.value)}
                placeholder="Your postcode (demo)"
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13.5, padding: '12px 0', width: '100%' }}
              />
            </div>
            <button style={{ background: TP_DARK, color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>Search</button>
          </div>

          <div className="tp-grid3" style={{ marginTop: 22 }}>
            {VENUES.map(v => (
              <div key={v.id} style={{ background: TP_PAPER, borderRadius: 14, padding: 18, border: '1px solid #E7E2DC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <MapPin size={15} style={{ color: TP_RED }} />
                  <div style={{ fontSize: 14.5, fontWeight: 900 }}>{v.name}</div>
                </div>
                <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 5 }}>{v.day} · {v.time} · free</div>
                {v.external ? (
                  <a href="#" style={{ display: 'inline-block', marginTop: 12, fontSize: 12.5, fontWeight: 800, color: TP_DARK, textDecoration: 'none', border: '1.5px solid #D9D3CC', borderRadius: 8, padding: '8px 13px' }}>
                    Book via partner site ↗
                  </a>
                ) : (
                  <a href="#" style={{ display: 'inline-block', marginTop: 12, fontSize: 12.5, fontWeight: 800, color: '#fff', background: TP_RED, borderRadius: 8, padding: '8px 13px', textDecoration: 'none' }}>
                    Register — it’s free
                  </a>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: '#8A847E', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <QrCode size={13} /> Demo venues shown — the live site lists every venue with real-time availability from the portal.
          </div>
        </div>
      </section>

      {/* Parents / TENOR */}
      <section id="parents" style={{ padding: '64px 0' }}>
        <div className="tp-container">
          <div className="tp-grid2">
            <div>
              <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>Parents — this is for you too</h2>
              <p style={{ fontSize: 15, color: '#6B6560', lineHeight: 1.6, marginTop: 0 }}>
                Ten Project is perfect for parents. For at least an hour a week, get involved, get active
                and play tennis with your child — free. Lend us your voice and enthusiasm and become a
                Ten Project <strong style={{ color: TP_RED }}>TENOR</strong>: help run your local weekend
                session, with videos, session cards and coach guidance all provided.
              </p>
              <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
                {['Have fun and engage with your child', 'Further your child’s learning at home', 'Become physically active as a family', 'Meet other families in your community'].map(t => (
                  <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 13.5 }}>
                    <CheckCircle size={15} style={{ color: TP_RED, flexShrink: 0 }} /> {t}
                  </div>
                ))}
              </div>
              <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: TP_DARK, color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}>
                <Users size={15} /> Sign up as a TENOR
              </a>
            </div>
            <div style={{ background: TP_DARK, borderRadius: 18, padding: 26, color: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: TP_RED }}>THE PARENT APP</div>
              <div style={{ fontSize: 21, fontWeight: 900, marginTop: 8, lineHeight: 1.25 }}>
                Everything about your child’s 10 weeks, in one place
              </div>
              <div style={{ fontSize: 13.5, color: '#C9C4BE', marginTop: 10, lineHeight: 1.6 }}>
                This week’s skill and videos · your child’s Success Stickers as they’re earned · your
                weekend venue with one-tap confirm and QR check-in · all messages from your coach.
                No app store needed — it installs from your browser.
              </div>
              <Link href="/tenproject/demo?role=parent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18, background: TP_RED, color: '#fff', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                See the app demo <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Schools + fundraising */}
      <section id="schools" style={{ background: TP_DARK, color: '#fff', padding: '64px 0' }}>
        <div className="tp-container">
          <div className="tp-grid2">
            <div>
              <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>Schools</h2>
              <p style={{ fontSize: 15, color: '#C9C4BE', lineHeight: 1.6, marginTop: 0 }}>
                Ten free one-hour sessions in curriculum time, delivered by LTA-accredited coaches with
                your teachers trained alongside — physical literacy aligned to the PE National
                Curriculum, and a full participation report at the end of term.
              </p>
              <div style={{ display: 'grid', gap: 9, marginTop: 16, fontSize: 13.5 }}>
                {['LTA Level 2/3 coaches · First Aid · DBS · safeguarding trained · insured', 'Welcome pack for every child: T-shirt, ball, Activity Booklet', 'Teachers upskilled to sustain delivery after week 10', 'Attendance and progress evidence for your governors and funders'].map(t => (
                  <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <CheckCircle size={15} style={{ color: TP_RED, flexShrink: 0, marginTop: 2 }} /> {t}
                  </div>
                ))}
              </div>
              <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: '#fff', color: TP_DARK, borderRadius: 10, padding: '12px 20px', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}>
                <School size={15} /> Book Ten Project for your school
              </a>
            </div>
            <div style={{ background: '#22222A', borderRadius: 18, padding: 26 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: TP_RED }}>NO BUDGET? WE’LL HELP YOU RAISE IT</div>
              <div style={{ fontSize: 19, fontWeight: 900, marginTop: 8, lineHeight: 1.3 }}>
                School fundraising, built in
              </div>
              <div style={{ fontSize: 13, color: '#C9C4BE', marginTop: 8, lineHeight: 1.55 }}>
                Funding changed for 2026/27 — so we built a way through. Run a sponsored ball hit, a
                fair stall or a cake sale; your school gets its own fundraising page with a live
                thermometer, and when you hit the target, your 10 weeks are confirmed.
              </div>
              {/* Mini thermometer (demo) */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 800, color: TP_DARK, marginBottom: 6 }}>
                  <span>St Clement’s Primary (demo)</span>
                  <span>£{CAMPAIGN.raised.toLocaleString()} of £{CAMPAIGN.target.toLocaleString()}</span>
                </div>
                <div style={{ background: '#EFEBE6', borderRadius: 999, height: 12 }}>
                  <div style={{ width: `${Math.round((CAMPAIGN.raised / CAMPAIGN.target) * 100)}%`, height: '100%', background: TP_RED, borderRadius: 999 }} />
                </div>
              </div>
              <a href="/fundraise/st-clements-demo" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 800, color: '#fff', textDecoration: 'underline' }}>
                See a live campaign page →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" style={{ padding: '64px 0' }}>
        <div className="tp-container">
          <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>The difference families tell us it makes</h2>
          <div className="tp-grid3" style={{ marginTop: 22 }}>
            {QUOTES.map((q, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #E7E2DC' }}>
                <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>“{q.q}”</div>
                <div style={{ fontSize: 12, color: '#8A847E', marginTop: 10, fontWeight: 700 }}>— {q.who}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 22 }}>
            {IMPACT_AREAS.map(a => (
              <span key={a} style={{ background: '#EFEBE6', color: '#5B554F', borderRadius: 999, padding: '5px 13px', fontSize: 12, fontWeight: 700 }}>{a}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#8A847E', marginTop: 10 }}>
            The areas families say Ten Project has helped — captured and reported to our partners and funders through the portal.
          </div>
        </div>
      </section>

      {/* Talent pathways strip */}
      <section style={{ background: '#fff', borderTop: '1px solid #E7E2DC', padding: '40px 0' }}>
        <div className="tp-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Loved it? Keep going.</div>
            <div style={{ fontSize: 13.5, color: '#6B6560', marginTop: 4 }}>
              Talent pathways into local clubs, community court schemes and junior competitions — we’ll point you the right way after week 10.
            </div>
          </div>
          <a href="#" style={{ background: TP_RED, color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13.5, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
            Explore pathways
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: TP_DARK, color: '#C9C4BE', padding: '44px 0 30px' }}>
        <div className="tp-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 300 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tenproject_logo_dark.png" alt="Ten Project" style={{ height: 44, width: 'auto', display: 'block' }} />
              <div style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
                Free school & community tennis for children aged 4–10.<br />LEARN. PLAY. TOGETHER.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 44, flexWrap: 'wrap', fontSize: 12.5 }}>
              <div style={{ display: 'grid', gap: 7, alignContent: 'start' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>PROGRAMME</div>
                <a href="#what" style={{ color: '#C9C4BE', textDecoration: 'none' }}>What is Ten Project</a>
                <a href="#sessions" style={{ color: '#C9C4BE', textDecoration: 'none' }}>Find a session</a>
                <a href="#schools" style={{ color: '#C9C4BE', textDecoration: 'none' }}>Schools</a>
                <a href="#schools" style={{ color: '#C9C4BE', textDecoration: 'none' }}>School fundraising</a>
              </div>
              <div style={{ display: 'grid', gap: 7, alignContent: 'start' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>POLICIES</div>
                <a href="#" style={{ color: '#C9C4BE', textDecoration: 'none' }}>Safeguarding</a>
                <a href="#" style={{ color: '#C9C4BE', textDecoration: 'none' }}>Photography & Filming</a>
                <a href="#" style={{ color: '#C9C4BE', textDecoration: 'none' }}>Privacy</a>
                <a href="#" style={{ color: '#C9C4BE', textDecoration: 'none' }}>Terms</a>
              </div>
              <div style={{ display: 'grid', gap: 7, alignContent: 'start' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>PORTAL</div>
                <Link href="/tenproject/demo" style={{ color: '#C9C4BE', textDecoration: 'none' }}>Portal login</Link>
                <a href="#" style={{ color: '#C9C4BE', textDecoration: 'none' }}>Coach access</a>
                <a href="#" style={{ color: '#C9C4BE', textDecoration: 'none' }}>TENOR access</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #33333B', marginTop: 28, paddingTop: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 11.5 }}>
            <span>© 2026 Ten Project Ltd · Morden, London</span>
            <span>Partner & funder logos sit here on the live site</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
