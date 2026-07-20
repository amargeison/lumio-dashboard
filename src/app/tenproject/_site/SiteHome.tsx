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

// ─── Palette tokens ─────────────────────────────────────────────────────────
// Brand: black background, red + white. Sections alternate dark / light down
// the page. Dark sections reuse these tokens; light sections use CREAM/#fff.
const INK = TP_DARK          // near-black section background
const PANEL = '#22222A'      // lifted dark for cards on a dark section
const CREAM = TP_PAPER       // light section / card background
const LINE = '#E7E2DC'       // border on light
const LINE_DK = '#33333B'    // border on dark
const MUTE = '#6B6560'       // muted text on light
const MUTE_DK = '#C9C4BE'    // muted text on dark

const NAV = [
  { id: 'what', label: 'What is Ten Project' },
  { id: 'sessions', label: 'Find a session' },
  { id: 'parents', label: 'Parents' },
  { id: 'schools', label: 'Schools' },
  { id: 'results', label: 'Results' },
  { id: 'contact', label: 'Contact' },
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
    <div style={{ background: CREAM, color: TP_DARK, fontFamily: "'Poppins', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
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
      <div style={{ background: PANEL, color: MUTE_DK, fontSize: 11.5, textAlign: 'center', padding: '7px 12px', fontWeight: 600 }}>
        NEW WEBSITE — PREVIEW · replaces the current Wix site · demo data where marked
      </div>

      {/* Nav — light, sticky */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#ffffffF2', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${LINE}` }}>
        <div className="tp-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 88 }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tenproject_logo.png" alt="Ten Project" style={{ height: 68, width: 'auto', display: 'block' }} />
          </a>
          <nav className="tp-navlinks">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} style={{ fontSize: 13, fontWeight: 700, color: TP_DARK, textDecoration: 'none' }}>{n.label}</a>
            ))}
            <Link href="/tenproject/demo" style={{ fontSize: 13, fontWeight: 700, color: TP_DARK, textDecoration: 'none', border: `1.5px solid ${LINE}`, borderRadius: 9, padding: '8px 14px' }}>
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
          <nav style={{ borderTop: `1px solid ${LINE}`, background: '#fff', padding: '10px 22px 16px', display: 'grid', gap: 4 }}>
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} onClick={() => setMenuOpen(false)} style={{ fontSize: 14, fontWeight: 700, color: TP_DARK, textDecoration: 'none', padding: '9px 0' }}>{n.label}</a>
            ))}
            <Link href="/tenproject/demo" style={{ fontSize: 14, fontWeight: 700, color: TP_DARK, textDecoration: 'none', padding: '9px 0' }}>Portal login</Link>
            <a href="#sessions" onClick={() => setMenuOpen(false)} style={{ fontSize: 14, fontWeight: 800, color: '#fff', background: TP_RED, borderRadius: 9, padding: '11px 16px', textDecoration: 'none', textAlign: 'center', marginTop: 6 }}>Find a free session</a>
          </nav>
        )}
      </header>

      {/* Hero — BLACK banner, photo showing through on the right */}
      <section id="top" style={{ backgroundImage: 'linear-gradient(90deg, rgba(20,20,24,0.95) 0%, rgba(20,20,24,0.86) 45%, rgba(20,20,24,0.45) 100%), url(/tenproject_banner.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 30%', color: '#fff', padding: '40px 0 46px' }}>
        <div className="tp-container">
          <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: 1.5, color: TP_RED }}>FREE SCHOOL & COMMUNITY TENNIS · AGES 4–10</div>
          <h1 className="tp-hero-h1" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, margin: '10px 0 14px', maxWidth: 760, color: '#fff' }}>
            LEARN. <span style={{ color: TP_RED }}>PLAY.</span> TOGETHER.
          </h1>
          <p style={{ fontSize: 17, color: '#E7E2DC', maxWidth: 620, lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
            Ten weeks of free, fun, game-based tennis in your child’s school — plus free weekend
            family sessions on your local community courts. Every child gets a T-shirt, a ball and
            their own Activity Booklet.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            <a href="#sessions" style={{ background: TP_RED, color: '#fff', borderRadius: 10, padding: '13px 22px', fontSize: 14.5, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Find a session near me <ArrowRight size={16} />
            </a>
            <a href="#schools" style={{ background: 'transparent', color: '#fff', border: '1.5px solid #ffffff66', borderRadius: 10, padding: '13px 22px', fontSize: 14.5, fontWeight: 800, textDecoration: 'none' }}>
              Bring it to my school
            </a>
            <a href="#parents" style={{ background: 'transparent', color: MUTE_DK, border: '1.5px solid #ffffff33', borderRadius: 10, padding: '13px 22px', fontSize: 14.5, fontWeight: 800, textDecoration: 'none' }}>
              Volunteer as a TENOR
            </a>
          </div>

          {/* Live impact counters */}
          <div className="tp-counters" style={{ marginTop: 28 }}>
            {[
              ['13,000+', 'families active since we began'],
              ['6,800+', 'children through the 10 weeks'],
              ['7,000+', 'families at weekend sessions'],
              ['100%', 'of families would recommend us'],
            ].map(([n, l]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '13px 17px', minWidth: 150 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: TP_RED }}>{n}</div>
                <div style={{ fontSize: 11.5, color: MUTE_DK, marginTop: 2, fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: '#9C968F', marginTop: 8 }}>
            Counters go live from portal registers — self-updating, funder-ready.
          </div>
        </div>
      </section>

      {/* What is Ten Project — WHITE */}
      <section id="what" style={{ background: '#fff', padding: '64px 0' }}>
        <div className="tp-container">
          <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>What is Ten Project?</h2>
          <p style={{ fontSize: 15, color: MUTE, maxWidth: 680, lineHeight: 1.6, marginTop: 0 }}>
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
                <div key={c.t} style={{ background: CREAM, borderRadius: 16, padding: 22, border: `1px solid ${LINE}` }}>
                  <Icon size={26} style={{ color: TP_RED }} />
                  <div style={{ fontSize: 17, fontWeight: 900, marginTop: 10 }}>{c.t}</div>
                  <div style={{ fontSize: 13.5, color: MUTE, marginTop: 6, lineHeight: 1.55 }}>{c.d}</div>
                </div>
              )
            })}
          </div>

          {/* 10-week journey */}
          <div style={{ marginTop: 34, background: CREAM, borderRadius: 16, border: `1px solid ${LINE}`, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>Your child’s 10 weeks</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {CURRICULUM.map(b => (
                <div key={b.skill} style={{ minWidth: 150, background: '#fff', borderRadius: 12, padding: '12px 14px', flexShrink: 0, border: `1px solid ${LINE}` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: TP_RED, letterSpacing: 0.8 }}>WEEKS {b.weeks}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 900, marginTop: 3 }}>{b.skill}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: MUTE, marginTop: 10 }}>
              Week 10 is the Ten Project Festival — the celebration where every child receives their certificate.
            </div>
          </div>
        </div>
      </section>

      {/* The Challenge + Our Outcomes — BLACK */}
      <section id="challenge" style={{ background: INK, color: '#fff', padding: '56px 0' }}>
        <div className="tp-container">
          <div className="tp-grid2">
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: TP_RED }}>THE CHALLENGE</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: '8px 0 12px' }}>Too many children aren’t active — and families even less so</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  ['1 in 5', 'children aged 5–17 meet the Chief Medical Officer’s guideline of 60 active minutes a day'],
                  ['72%', 'of children are not active enough during the school day'],
                  ['10% vs 17%', 'of girls aged 13–17 are active, compared to boys — and children from less affluent or minority-ethnic backgrounds are less likely still'],
                ].map(([n, l]) => (
                  <div key={l} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: TP_RED, minWidth: 110 }}>{n}</div>
                    <div style={{ fontSize: 13, color: MUTE_DK, lineHeight: 1.5 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: '#8A847E', marginTop: 12 }}>Sources: Sport England Active People / Active Lives surveys; DCMS Taking Part child survey.</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: TP_RED }}>OUR OUTCOMES</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: '8px 0 12px' }}>Build a sporting habit for life — as a family</h2>
              <p style={{ fontSize: 13.5, color: MUTE_DK, lineHeight: 1.6, marginTop: 0 }}>
                Attitudes to activity are shaped in childhood. Engaging children and parents as early as
                possible — and involving the whole family — is how the habit sticks. Everything we do serves
                three outcomes: <strong style={{ color: '#fff' }}>LEARN</strong> (physical literacy and the life
                skills that support achievement in school), <strong style={{ color: '#fff' }}>PLAY</strong> (more
                opportunities to play, especially for the under-represented — building confidence, self-esteem
                and belonging), and <strong style={{ color: '#fff' }}>TOGETHER</strong> (parents part of their
                child’s learning, and the school as the hub of its community).
              </p>
              <div style={{ fontSize: 12.5, color: '#8A847E', lineHeight: 1.7, marginTop: 8, fontStyle: 'italic' }}>
                Have fun · laugh · build confidence · get active · make friends · be an active role model ·
                jump, hop, skip, run, throw, catch, hit · play fair · focus · bond · belong · volunteer ·
                create quality family moments
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find a session — WHITE */}
      <section id="sessions" style={{ background: '#fff', padding: '64px 0' }}>
        <div className="tp-container">
          <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>Free Community Family Sessions</h2>
          <p style={{ fontSize: 15, color: MUTE, maxWidth: 680, lineHeight: 1.6, marginTop: 0 }}>
            Register once, then check in with a QR scan at the gate every week — it even works with no
            phone signal. All equipment provided; every family welcome.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, maxWidth: 420 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: CREAM, borderRadius: 10, padding: '0 14px', border: `1px solid ${LINE}` }}>
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
              <div key={v.id} style={{ background: CREAM, borderRadius: 14, padding: 18, border: `1px solid ${LINE}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <MapPin size={15} style={{ color: TP_RED }} />
                  <div style={{ fontSize: 14.5, fontWeight: 900 }}>{v.name}</div>
                </div>
                <div style={{ fontSize: 12.5, color: MUTE, marginTop: 5 }}>{v.day} · {v.time} · free</div>
                {v.external ? (
                  <a href="#" style={{ display: 'inline-block', marginTop: 12, fontSize: 12.5, fontWeight: 800, color: TP_DARK, textDecoration: 'none', border: '1.5px solid #D9D3CC', borderRadius: 8, padding: '8px 13px' }}>
                    Book via partner site ↗
                  </a>
                ) : (
                  <a href="https://www.tenproject.org.uk/book" style={{ display: 'inline-block', marginTop: 12, fontSize: 12.5, fontWeight: 800, color: '#fff', background: TP_RED, borderRadius: 8, padding: '8px 13px', textDecoration: 'none' }}>
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

      {/* Parents / TENOR — BLACK */}
      <section id="parents" style={{ background: INK, color: '#fff', padding: '64px 0' }}>
        <div className="tp-container">
          <div className="tp-grid2">
            <div>
              <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>Parents — this is for you too</h2>
              <p style={{ fontSize: 15, color: MUTE_DK, lineHeight: 1.6, marginTop: 0 }}>
                Ten Project is perfect for parents. For at least an hour a week, get involved, get active
                and play tennis with your child — free. Lend us your voice and enthusiasm and become a
                Ten Project <strong style={{ color: TP_RED }}>TENOR</strong>: help run your local weekend
                session, with videos, session cards and coach guidance all provided.
              </p>
              <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
                {['Have fun and engage with your child', 'Further your child’s learning at home', 'Become physically active as a family', 'Meet other families in your community'].map(t => (
                  <div key={t} style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 13.5, color: '#EDEAE5' }}>
                    <CheckCircle size={15} style={{ color: TP_RED, flexShrink: 0 }} /> {t}
                  </div>
                ))}
              </div>
              <a href="https://www.tenproject.org.uk/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: TP_RED, color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}>
                <Users size={15} /> Sign up as a TENOR
              </a>
            </div>
            <div style={{ background: PANEL, borderRadius: 18, padding: 26, color: '#fff', border: `1px solid ${LINE_DK}` }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: TP_RED }}>THE PARENT APP</div>
              <div style={{ fontSize: 21, fontWeight: 900, marginTop: 8, lineHeight: 1.25 }}>
                Everything about your child’s 10 weeks, in one place
              </div>
              <div style={{ fontSize: 13.5, color: MUTE_DK, marginTop: 10, lineHeight: 1.6 }}>
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

      {/* Schools + fundraising — WHITE (with dark feature cards) */}
      <section id="schools" style={{ background: '#fff', padding: '64px 0' }}>
        <div className="tp-container">
          <div className="tp-grid2">
            <div>
              <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>Schools</h2>
              <p style={{ fontSize: 15, color: MUTE, lineHeight: 1.6, marginTop: 0 }}>
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
              <a href="https://www.tenproject.org.uk/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: TP_DARK, color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}>
                <School size={15} /> Book Ten Project for your school
              </a>
              <div style={{ background: INK, borderRadius: 12, padding: '14px 16px', marginTop: 18 }}>
                <div style={{ fontSize: 12.5, fontStyle: 'italic', color: MUTE_DK, lineHeight: 1.6 }}>
                  “The Ten Project seems to fit the aims of Sports Premium perfectly — promoting sport in
                  school and encouraging families to get active in the community. I will certainly be
                  planning to use the Ten Project again next academic year.”
                </div>
                <div style={{ fontSize: 11, color: TP_RED, fontWeight: 800, marginTop: 6 }}>— Mark Clutterbuck, Headteacher, Coombe Hill Junior School</div>
              </div>
            </div>
            <div style={{ background: INK, borderRadius: 18, padding: 26, color: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: TP_RED }}>NO BUDGET? WE’LL HELP YOU RAISE IT</div>
              <div style={{ fontSize: 19, fontWeight: 900, marginTop: 8, lineHeight: 1.3 }}>
                School fundraising, built in
              </div>
              <div style={{ fontSize: 13, color: MUTE_DK, marginTop: 8, lineHeight: 1.55 }}>
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

      {/* Impact — BLACK */}
      <section id="impact" style={{ background: INK, color: '#fff', padding: '64px 0' }}>
        <div className="tp-container">
          <h2 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 10px' }}>The difference families tell us it makes</h2>
          <div className="tp-grid3" style={{ marginTop: 22 }}>
            {QUOTES.map((q, i) => (
              <div key={i} style={{ background: '#fff', color: TP_DARK, borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>“{q.q}”</div>
                <div style={{ fontSize: 12, color: '#8A847E', marginTop: 10, fontWeight: 700 }}>— {q.who}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 22 }}>
            {IMPACT_AREAS.map(a => (
              <span key={a} style={{ background: 'rgba(255,255,255,0.10)', color: MUTE_DK, borderRadius: 999, padding: '5px 13px', fontSize: 12, fontWeight: 700 }}>{a}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#8A847E', marginTop: 10 }}>
            The areas families say Ten Project has helped — captured and reported to our partners and funders through the portal.
          </div>
        </div>
      </section>

      {/* Results / case study — WHITE */}
      <section id="results" style={{ background: '#fff', padding: '56px 0' }}>
        <div className="tp-container">
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: TP_RED }}>THE RESULTS SO FAR</div>
          <h2 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 18px' }}>From school hall to community court — the numbers</h2>
          <div className="tp-grid3">
            {[
              ['13,000+', 'families — over 26,000 children and parents — active weekly through our initiatives since we began'],
              ['6,800+', 'children have completed 10 weeks of Ten Project in school'],
              ['4,000+', 'families registered, with 3,100+ choosing to stay connected by newsletter'],
              ['2×', 'families attending regularly at least doubled their weekly physical activity together'],
              ['50+', 'children and adults joined their local tennis club from one borough alone — worth £3,500+ to that club'],
              ['50+', 'schools delivered — from Kingston and Brighton to Leeds, Oxford, Eastbourne and Ilford'],
            ].map(([n, l]) => (
              <div key={l} style={{ background: CREAM, borderRadius: 14, padding: '16px 18px', border: `1px solid ${LINE}` }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: TP_RED }}>{n}</div>
                <div style={{ fontSize: 12.5, color: '#5B554F', marginTop: 4, lineHeight: 1.5 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: '#8A847E', marginTop: 12 }}>
            Figures to 31 Dec 2025, from Ten Project registers and the Coombe Hill case study. Full case study and testimonials available on request — and live from the portal for partners.
          </div>
        </div>
      </section>

      {/* Videos — BLACK */}
      <section id="videos" style={{ background: INK, color: '#fff', padding: '56px 0' }}>
        <div className="tp-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px' }}>Videos — every shot, every warm-up</h2>
            <div style={{ fontSize: 14, color: MUTE_DK, lineHeight: 1.6 }}>
              Instruction videos for every skill in the Activity Booklet — the forehand, backhand, volley,
              serve, ABC warm-ups and games. Take it to your court, try it at home, try it in the park —
              but most of all, try it as a family.
            </div>
          </div>
          <a href="https://www.youtube.com/channel/UC3-1ehFIPwAKgH98SXfLf1w" target="_blank" rel="noreferrer" style={{ background: TP_RED, color: '#fff', borderRadius: 10, padding: '13px 22px', fontSize: 14, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <PlayCircle size={17} /> Watch on YouTube
          </a>
        </div>
      </section>

      {/* Coaches — WHITE */}
      <section id="coaches" style={{ background: '#fff', padding: '56px 0' }}>
        <div className="tp-container">
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px' }}>Our coaches</h2>
          <p style={{ fontSize: 14, color: MUTE, maxWidth: 640, lineHeight: 1.6, marginTop: 0 }}>
            Fully qualified, experienced, and chosen through a bespoke interview process. Every Ten Project coach holds, as a minimum:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {['LTA accredited Level 2 / 3 (or equivalent)', 'First Aid certificate', 'Enhanced DBS check (via the LTA)', 'LTA Safeguarding & Protection training', 'Insured to £5 million'].map(t => (
              <span key={t} style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 999, padding: '8px 16px', fontSize: 12.5, fontWeight: 700, color: TP_DARK }}>✓ {t}</span>
            ))}
          </div>
          {/* Where we run */}
          <div style={{ marginTop: 26, background: CREAM, borderRadius: 14, border: `1px solid ${LINE}`, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: TP_DARK, letterSpacing: 0.5, marginBottom: 8 }}>CURRENT TEN PROJECTS — IN YOUR AREA</div>
            <div style={{ fontSize: 13, color: '#5B554F', lineHeight: 1.7 }}>
              Kingston · Chessington · Sutton · Wallington · Brighton · Eastbourne · Leeds · Oxford ·
              Bracknell · Tonbridge · Hemel Hempstead · Ilford — with 50+ partner schools and new venues coming soon.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <a href="#sessions" style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: TP_RED, borderRadius: 8, padding: '9px 15px', textDecoration: 'none' }}>Find your session</a>
              <a href="https://www.tenproject.org.uk/bring-to-your-area" style={{ fontSize: 12.5, fontWeight: 800, color: TP_DARK, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 8, padding: '9px 15px', textDecoration: 'none' }}>Bring Ten Project to your area</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact — BLACK */}
      <section id="contact" style={{ background: INK, color: '#fff', padding: '56px 0' }}>
        <div className="tp-container" style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 10px' }}>Contact</h2>
            <div style={{ fontSize: 14, color: MUTE_DK, lineHeight: 1.9 }}>
              <strong style={{ color: '#fff' }}>Email:</strong> <a href="mailto:info@tenproject.org.uk" style={{ color: TP_RED, fontWeight: 800, textDecoration: 'none' }}>info@tenproject.org.uk</a><br />
              <strong style={{ color: '#fff' }}>Phone:</strong> +44 (0)7786 913 182<br />
              <strong style={{ color: '#fff' }}>Address:</strong> Ten Project Ltd, 7 Cranmer Close, Morden, London, SM4 4SU
            </div>
          </div>
          <div style={{ background: PANEL, borderRadius: 14, padding: '18px 22px', color: '#fff', maxWidth: 360, border: `1px solid ${LINE_DK}` }}>
            <div style={{ fontSize: 13.5, fontWeight: 900 }}>Free school & parent resources</div>
            <div style={{ fontSize: 12.5, color: MUTE_DK, marginTop: 5, lineHeight: 1.55 }}>Warm-ups, games and activity ideas to use at school, at home or in the park.</div>
            <a href="https://www.tenproject.org.uk/_files/ugd/afd262_2e51f30c2efb4fecb6823866bd010491.pdf" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, background: TP_RED, color: '#fff', borderRadius: 8, padding: '9px 15px', fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>Download the pack (PDF)</a>
          </div>
        </div>
      </section>

      {/* Talent pathways strip — light (paper) */}
      <section style={{ background: CREAM, borderTop: `1px solid ${LINE}`, padding: '40px 0' }}>
        <div className="tp-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Loved it? Keep going.</div>
            <div style={{ fontSize: 13.5, color: MUTE, marginTop: 4 }}>
              Talent pathways into local clubs, community court schemes and junior competitions — we’ll point you the right way after week 10.
            </div>
          </div>
          <a href="#" style={{ background: TP_RED, color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 13.5, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
            Explore pathways
          </a>
        </div>
      </section>

      {/* Partners — white (logos need a light ground) */}
      <section id="partners" style={{ background: '#fff', borderTop: `1px solid ${LINE}`, padding: '44px 0' }}>
        <div className="tp-container">
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 900, letterSpacing: 3, color: TP_DARK, marginBottom: 24 }}>PARTNERS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px 44px', alignItems: 'center', justifyContent: 'center' }}>
            {[
              ['bift.png', 'Bright Ideas for Tennis'],
              ['zsig.png', 'Zsig'],
              ['park-tennis.png', 'Park Tennis Kingston'],
              ['rbk.png', 'Royal Borough of Kingston upon Thames'],
              ['leeds-council.png', 'Leeds City Council'],
              ['active-leeds.png', 'Active Leeds'],
              ['fred-perry.png', 'The Fred Perry Tennis Trust'],
              ['as-colour.png', 'AS Colour'],
            ].map(([f, alt]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={f} src={`/partners/tp/${f}`} alt={alt} style={{ height: 52, width: 'auto', display: 'block' }} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer — BLACK */}
      <footer style={{ background: INK, color: MUTE_DK, padding: '44px 0 30px' }}>
        <div className="tp-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 300 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tenproject_logo_dark.png" alt="Ten Project" style={{ height: 44, width: 'auto', display: 'block' }} />
              <div style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
                Free school & community tennis for children aged 4–10.<br />LEARN. PLAY. TOGETHER.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', fontSize: 12.5 }}>
              <div style={{ display: 'grid', gap: 7, alignContent: 'start' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>PROGRAMME</div>
                <a href="#what" style={{ color: MUTE_DK, textDecoration: 'none' }}>What is Ten Project</a>
                <a href="#challenge" style={{ color: MUTE_DK, textDecoration: 'none' }}>The Challenge & Outcomes</a>
                <a href="#sessions" style={{ color: MUTE_DK, textDecoration: 'none' }}>Find a session</a>
                <a href="#coaches" style={{ color: MUTE_DK, textDecoration: 'none' }}>Coaches & where we run</a>
                <a href="#videos" style={{ color: MUTE_DK, textDecoration: 'none' }}>Videos</a>
              </div>
              <div style={{ display: 'grid', gap: 7, alignContent: 'start' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>SCHOOLS & IMPACT</div>
                <a href="#schools" style={{ color: MUTE_DK, textDecoration: 'none' }}>Schools</a>
                <a href="#schools" style={{ color: MUTE_DK, textDecoration: 'none' }}>School fundraising</a>
                <a href="#results" style={{ color: MUTE_DK, textDecoration: 'none' }}>Results & case study</a>
                <a href="#impact" style={{ color: MUTE_DK, textDecoration: 'none' }}>Testimonials</a>
                <a href="https://www.tenproject.org.uk/blog" style={{ color: MUTE_DK, textDecoration: 'none' }}>News</a>
              </div>
              <div style={{ display: 'grid', gap: 7, alignContent: 'start' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>POLICIES</div>
                <a href="https://www.tenproject.org.uk/safeguarding-policy" style={{ color: MUTE_DK, textDecoration: 'none' }}>Safeguarding</a>
                <a href="https://www.tenproject.org.uk/photography-and-filming-policy" style={{ color: MUTE_DK, textDecoration: 'none' }}>Photography & Filming</a>
                <a href="https://www.tenproject.org.uk/privacy-policy" style={{ color: MUTE_DK, textDecoration: 'none' }}>Privacy</a>
                <a href="https://www.tenproject.org.uk/terms-and-conditions" style={{ color: MUTE_DK, textDecoration: 'none' }}>Terms</a>
              </div>
              <div style={{ display: 'grid', gap: 7, alignContent: 'start' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>PORTAL & SOCIAL</div>
                <Link href="/tenproject/demo" style={{ color: MUTE_DK, textDecoration: 'none' }}>Portal login</Link>
                <a href="https://www.facebook.com/tenprojectuk/" style={{ color: MUTE_DK, textDecoration: 'none' }}>Facebook</a>
                <a href="https://twitter.com/tenprojectuk" style={{ color: MUTE_DK, textDecoration: 'none' }}>X / Twitter</a>
                <a href="https://www.instagram.com/tenprojectuk/" style={{ color: MUTE_DK, textDecoration: 'none' }}>Instagram</a>
                <a href="https://www.youtube.com/channel/UC3-1ehFIPwAKgH98SXfLf1w" style={{ color: MUTE_DK, textDecoration: 'none' }}>YouTube</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${LINE_DK}`, marginTop: 28, paddingTop: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 11.5 }}>
            <span>© 2026 Ten Project Ltd · Morden, London</span>
            <a href="#partners" style={{ color: MUTE_DK, textDecoration: 'none' }}>Our partners</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
