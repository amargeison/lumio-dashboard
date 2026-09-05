'use client'

// OxEd & Assessment — new website concept. See ../page.tsx.
// All copy, figures and testimonials are from oxedandassessment.com/uk (public).
// Photography is placeholder stock (Unsplash) — swap for OxEd's own imagery.

import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, Menu, X, Check, Play, Globe, ChevronDown,
  Ear, MessageCircle, BookOpen, Calculator, Users, Sparkles, Award, ShieldCheck, Quote,
} from 'lucide-react'

// ─── Brand tokens ───────────────────────────────────────────────────────────
const GREEN = '#1E6B2E'        // deep brand green (logo wordmark)
const GREEN_DK = '#124A20'
const LIME = '#5CA131'         // bright brand green (logo head)
const LIME_LT = '#DDF0CF'
const INK = '#0E1A12'          // near-black with a green cast
const PAPER = '#F7F6F1'        // warm off-white page ground
const CARD = '#FFFFFF'
const LINE = '#E4E3DC'
const MUTE = '#5D6660'
const GOLD = '#E9B949'

const NAV = [
  { label: 'Assessments', items: ['LanguageScreen', 'ReadingScreen', 'MathsScreen'], href: '#assessments' },
  { label: 'Programmes', items: ['NELI Intervention', 'OxEd Whole Class', 'NELI Preschool'], href: '#programmes' },
  { label: 'Evidence', items: ['Evidence summary', 'Research papers & trials', 'Whole Class research trial', 'Success stories'], href: '#evidence' },
  { label: 'Resources', items: ['News and insights', 'National Year of Reading', 'Support hub'], href: '#news' },
  { label: 'About', items: ['Who we are', 'Events and webinars', 'Awards', 'Partners'], href: '#about' },
]

const STATS = [
  { n: 11000, suffix: '', label: 'schools', sub: 'using OxEd assessments and early language programmes' },
  { n: 600000, suffix: '', label: 'pupils', sub: 'assessed with LanguageScreen, ReadingScreen and MathsScreen' },
  { n: 27000, suffix: '', label: 'teachers & TAs', sub: 'trained in the fundamentals of language' },
]

const ASSESSMENTS = [
  { id: 'ls', name: 'LanguageScreen', tag: 'Oral language · ages 3½–11', color: '#2F6FD1', soft: '#E4EDFB', Icon: Ear,
    blurb: 'A ten-minute, app-based screener of speaking and listening — expressive and receptive vocabulary, sentence repetition and listening comprehension — with age-standardised scores and traffic-light flags for every child.',
    points: ['Under 10 minutes per child', 'Adapts to age and ability', 'Class and pupil reports instantly'] },
  { id: 'rs', name: 'ReadingScreen', tag: 'Reading · primary', color: '#8E4BBF', soft: '#F0E6F8', Icon: BookOpen,
    blurb: 'Quick, reliable measures of word reading and comprehension, standardised against a national sample so leaders can see who is on track and who needs support.',
    points: ['Decoding and comprehension', 'National standardisation', 'Tracks progress term on term'] },
  { id: 'ms', name: 'MathsScreen', tag: 'Early number · primary', color: '#E0842B', soft: '#FBEBDD', Icon: Calculator,
    blurb: 'Identifies early number difficulties before they compound, giving teachers a clear picture of foundational maths skills across the class.',
    points: ['Foundational number sense', 'Same app, same reports', 'Built on Oxford research'] },
]

const PROGRAMMES = [
  { id: 'neli', name: 'NELI Intervention', who: 'Ages 4–6 · targeted small groups', featured: true,
    blurb: 'The Nuffield Early Language Intervention: a 20-week programme of small-group and individual sessions targeting vocabulary, listening and narrative skills — delivered by teaching assistants after CPD-certified online training.',
    proof: ['3–5 months’ additional progress in six months', '7 months for children from disadvantaged backgrounds', 'EEF 5/5 for evidence security — the only early years language intervention to achieve it'],
    includes: ['LanguageScreen assessment', '10–12 hours online training with mentoring', '20 weeks of structured sessions and Special Words', 'Ongoing support from speech and language professionals'] },
  { id: 'wc', name: 'OxEd Whole Class', who: 'Reception · every child',
    blurb: 'Universal oral language enrichment designed as NELI’s companion: three 20-minute sessions a week across six topics, so the whole class shares the vocabulary and narrative skills the intervention builds.',
    proof: ['Handbook, slides, sequencing cards, songs and audio stories', '8–10 hours CPD-certified training', 'Delivery Support Hub'] },
  { id: 'pre', name: 'NELI Preschool', who: 'Nursery · ages 3–4',
    blurb: 'Brings NELI’s approach into nursery settings, supporting oracy before children start school. An EEF-funded trial found around two additional months’ progress in oral language at scale.',
    proof: ['EEF trial 2023–24: c. 2 months’ additional progress', 'Built for early years practitioners', 'Supports the proposed SEND reforms’ focus on early identification'] },
]

const STORIES = [
  { q: 'The use of LanguageScreen provides us with a standardised and valid assessment of children’s starting points.', who: 'Director of Education', org: 'Multi-academy trust, North East' },
  { q: 'For our pupils, the impact of NELI has been absolutely amazing. It’s a high-quality intervention.', who: 'Communication Lead', org: 'Special school, South West' },
  { q: 'Language impacts everything for a child. It creates opportunities and opens doorways to learning.', who: 'Communication Lead', org: 'Special school, South West' },
]

const NEWS = [
  { kicker: 'Research', title: 'New EEF trial confirms the effectiveness of NELI Preschool', body: 'Children achieved around two additional months’ progress in oral language when the programme was delivered at scale.', cta: 'Read the findings', img: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=80' },
  { kicker: 'Webinar', title: 'How NELI Preschool can support oracy in nursery', body: 'The proposed SEND reforms call for early identification of need. See how settings are giving children the best start.', cta: 'Watch the recording', img: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=900&q=80' },
  { kicker: 'National Year of Reading', title: 'Discover the connection between oracy and reading', body: 'We’re bringing together research and insight that highlight the role of spoken language in learning to read.', cta: 'Explore the hub', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80' },
]

// ─── Small helpers ──────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target) } })
    }, { threshold: 0.12 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [])
}

function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    const el = ref.current; if (!el) return
    let started = false
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || started) return
      started = true
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setV(Math.round(to * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return <span ref={ref}>{v.toLocaleString('en-GB')}</span>
}

function Eyebrow({ children, color = GREEN }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color, margin: '0 0 14px' }}>{children}</p>
}

function H2({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <h2 className="ox-serif" style={{ fontSize: 'clamp(30px, 4vw, 46px)', lineHeight: 1.08, letterSpacing: '-0.015em', color: light ? '#fff' : INK, margin: '0 0 18px', fontWeight: 500 }}>{children}</h2>
}

function Btn({ children, href = '#', kind = 'primary', Icon = ArrowRight }: { children: React.ReactNode; href?: string; kind?: 'primary' | 'ghost' | 'light'; Icon?: React.ComponentType<any> }) {
  const s: React.CSSProperties = kind === 'primary'
    ? { background: GREEN, color: '#fff', border: `1.5px solid ${GREEN}` }
    : kind === 'light'
      ? { background: '#fff', color: GREEN_DK, border: '1.5px solid #fff' }
      : { background: 'transparent', color: INK, border: `1.5px solid ${INK}33` }
  return (
    <a href={href} className="ox-btn" style={{ ...s, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
      {children} <Icon size={16} />
    </a>
  )
}

// Profile-head mark used for the three assessment cards (echoes the logo silhouette)
function HeadMark({ color, Icon }: { color: string; Icon: React.ComponentType<any> }) {
  return (
    <div style={{ position: 'relative', width: 84, height: 84 }}>
      <svg viewBox="0 0 100 100" width="84" height="84" aria-hidden>
        <path d="M58 6c-19 0-34 14-34 33 0 7 2 13 6 19L18 74c-2 3 0 6 3 6h9v6c0 4 3 8 8 8h20c4 0 8-3 8-8v-8c9-6 16-17 16-30C82 24 71 6 58 6z" fill={color} />
        <circle cx="60" cy="38" r="16" fill="#fff" opacity=".18" />
      </svg>
      <div style={{ position: 'absolute', top: 24, left: 42, color: '#fff' }}><Icon size={22} strokeWidth={2.4} /></div>
    </div>
  )
}

export default function OxEdSite() {
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openNav, setOpenNav] = useState<string | null>(null)
  useReveal()
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8)
    f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <div id="top" style={{ background: PAPER, color: INK, fontFamily: "'Manrope', system-ui, -apple-system, sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        .ox-serif { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 144; }
        .ox-wrap { max-width: 1180px; margin: 0 auto; padding: 0 28px; }
        .ox-btn { transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
        .ox-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(30,107,46,.22); }
        [data-reveal] { opacity: 0; transform: translateY(22px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
        [data-reveal].is-in { opacity: 1; transform: none; }
        [data-reveal][data-delay="1"] { transition-delay: .1s } [data-reveal][data-delay="2"] { transition-delay: .2s } [data-reveal][data-delay="3"] { transition-delay: .3s }
        .ox-card { background: ${CARD}; border: 1px solid ${LINE}; border-radius: 20px; transition: transform .25s ease, box-shadow .25s ease; }
        .ox-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(14,26,18,.08); }
        .ox-nav-links { display: flex; gap: 4px; align-items: center; }
        .ox-menu-btn { display: none; }
        .ox-hero { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; }
        .ox-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
        .ox-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        .ox-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
        .ox-prog { display: grid; grid-template-columns: 1.25fr 1fr; gap: 22px; }
        .ox-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .ox-float { animation: oxfloat 6s ease-in-out infinite; }
        @keyframes oxfloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        .ox-dd { position: absolute; top: 100%; left: 0; padding-top: 10px; display: none; }
        .ox-navitem:hover .ox-dd, .ox-navitem:focus-within .ox-dd { display: block; }
        @media (max-width: 900px) {
          .ox-nav-links { display: none; } .ox-menu-btn { display: inline-flex; }
          .ox-hero, .ox-grid3, .ox-grid2, .ox-steps, .ox-prog, .ox-stats { grid-template-columns: 1fr; }
          .ox-hero-h1 { font-size: 42px !important; }
          .ox-hide-m { display: none !important; }
          .ox-hero-stats { grid-template-columns: 1fr 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) { [data-reveal] { transition: none; opacity: 1; transform: none } .ox-float { animation: none } }
      `}</style>

      {/* Preview ribbon */}
      <div style={{ background: INK, color: '#B8C4BB', fontSize: 11.5, textAlign: 'center', padding: '7px 12px', fontWeight: 600, letterSpacing: '0.04em' }}>
        NEW WEBSITE — DESIGN PREVIEW · concept for oxedandassessment.com · placeholder photography
      </div>

      {/* Announcement bar */}
      <div style={{ background: LIME_LT, borderBottom: `1px solid ${LINE}` }}>
        <div className="ox-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, height: 40, fontSize: 13, color: GREEN_DK }}>
          <span className="ox-hide-m" style={{ fontWeight: 600 }}>What do the Schools White Paper and SEND reforms mean for your school?</span>
          <a href="#news" style={{ color: GREEN_DK, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Read our response <ArrowRight size={14} /></a>
        </div>
      </div>

      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: scrolled ? 'rgba(247,246,241,.86)' : PAPER, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${scrolled ? LINE : 'transparent'}`, transition: 'all .25s' }}>
        <div className="ox-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 84 }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/oxed-site-logo.png" alt="OxEd & Assessment" style={{ height: 58, width: 'auto', display: 'block' }} />
          </a>
          <nav className="ox-nav-links">
            {NAV.map(n => (
              <div key={n.label} className="ox-navitem" style={{ position: 'relative' }} onMouseEnter={() => setOpenNav(n.label)} onMouseLeave={() => setOpenNav(null)}>
                <a href={n.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '10px 14px', borderRadius: 999, fontSize: 14.5, fontWeight: 600, color: INK, textDecoration: 'none', background: openNav === n.label ? '#fff' : 'transparent' }}>
                  {n.label} <ChevronDown size={14} style={{ opacity: .6 }} />
                </a>
                <div className="ox-dd">
                  <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 8, minWidth: 240, boxShadow: '0 18px 40px rgba(14,26,18,.12)' }}>
                    {n.items.map(it => (
                      <a key={it} href={n.href} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: INK, textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = PAPER)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{it}</a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <span style={{ width: 1, height: 22, background: LINE, margin: '0 10px' }} />
            <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: MUTE, textDecoration: 'none', padding: '8px 10px' }}><Globe size={15} /> UK</a>
            <a href="https://resources.oxedandassessment.com" className="ox-btn" style={{ background: GREEN, color: '#fff', padding: '11px 18px', borderRadius: 999, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginLeft: 6 }}>My portal</a>
          </nav>
          <button className="ox-menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 999, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menu && (
          <div style={{ background: '#fff', borderTop: `1px solid ${LINE}`, padding: '12px 28px 20px' }}>
            {NAV.map(n => <a key={n.label} href={n.href} onClick={() => setMenu(false)} style={{ display: 'block', padding: '12px 0', fontSize: 17, fontWeight: 700, color: INK, textDecoration: 'none', borderBottom: `1px solid ${LINE}` }}>{n.label}</a>)}
            <a href="https://resources.oxedandassessment.com" style={{ display: 'inline-block', marginTop: 16, background: GREEN, color: '#fff', padding: '12px 20px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>My portal</a>
          </div>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '56px 0 40px' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(900px 500px at 85% 10%, ${LIME_LT} 0%, transparent 60%), radial-gradient(600px 400px at 5% 90%, #EAF2E4 0%, transparent 60%)` }} />
        <div className="ox-wrap ox-hero" style={{ position: 'relative' }}>
          <div>
            <div data-reveal>
              <Eyebrow>A University of Oxford spinout</Eyebrow>
              <h1 className="ox-serif ox-hero-h1" style={{ fontSize: 'clamp(44px, 5.6vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.02em', margin: '0 0 22px', fontWeight: 500 }}>
                Give every child the <em style={{ fontStyle: 'italic', color: GREEN }}>oral language</em> skills to succeed
              </h1>
              <p style={{ fontSize: 19, lineHeight: 1.55, color: MUTE, margin: '0 0 30px', maxWidth: 560 }}>
                Two million children struggle with spoken language. We turn world-leading research into practical tools that help schools identify need early, deliver interventions that work and enrich every classroom.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <Btn href="#assessments">Explore LanguageScreen</Btn>
                <Btn href="#programmes" kind="ghost">Find out about NELI</Btn>
              </div>
            </div>
            <div data-reveal data-delay="2" className="ox-hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 24, marginTop: 44, justifyContent: 'start' }}>
              {[['5/5', 'EEF evidence security for NELI'], ['<10 min', 'LanguageScreen per child'], ['DfE', 'funded national NELI Programme']].map(([a, b]) => (
                <div key={b} style={{ borderLeft: `2px solid ${LIME}`, paddingLeft: 14 }}>
                  <div className="ox-serif" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1 }}>{a}</div>
                  <div style={{ fontSize: 13, color: MUTE, marginTop: 4 }}>{b}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div data-reveal data-delay="1" style={{ position: 'relative', minHeight: 520 }}>
            <div style={{ position: 'absolute', inset: '0 0 0 8%', borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 70px rgba(14,26,18,.18)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&q=80" alt="Teacher and child reading together" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(14,26,18,.45))' }} />
            </div>
            {/* Floating result card */}
            <div className="ox-float" style={{ position: 'absolute', left: -6, bottom: 44, width: 290, background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 20px 50px rgba(14,26,18,.18)', border: `1px solid ${LINE}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#2F6FD1' }}>LANGUAGESCREEN</span>
                <span style={{ fontSize: 11, color: MUTE }}>Reception · today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="ox-serif" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1 }}>104</span>
                <span style={{ fontSize: 13, color: MUTE }}>standard score · 61st percentile</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                {[['Expressive', 96, '#5CA131'], ['Receptive', 84, '#5CA131'], ['Sentences', 62, GOLD], ['Listening', 91, '#5CA131']].map(([l, v, c]) => (
                  <div key={l as string} style={{ flex: 1 }}>
                    <div style={{ height: 6, borderRadius: 3, background: '#EEF0EA', overflow: 'hidden' }}><div style={{ width: `${v}%`, height: '100%', background: c as string }} /></div>
                    <div style={{ fontSize: 10, color: MUTE, marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: GREEN, background: LIME_LT, padding: '5px 10px', borderRadius: 999 }}><Check size={13} /> On track — whole class enrichment</div>
            </div>
            {/* Floating badge */}
            <div style={{ position: 'absolute', right: -4, top: 26, background: INK, color: '#fff', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 16px 40px rgba(14,26,18,.25)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: LIME, display: 'grid', placeItems: 'center' }}><Award size={18} /></div>
              <div><div style={{ fontSize: 13, fontWeight: 800 }}>BETT Awards 2023</div><div style={{ fontSize: 11.5, opacity: .7 }}>Winner · Assessment</div></div>
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="ox-wrap" style={{ marginTop: 64 }}>
          <div className="ox-stats" data-reveal>
            {STATS.map(s => (
              <div key={s.label} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 20, padding: '26px 28px' }}>
                <div className="ox-serif" style={{ fontSize: 46, fontWeight: 600, lineHeight: 1, color: GREEN }}><CountUp to={s.n} />{s.suffix}</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>{s.label}</div>
                <div style={{ fontSize: 13.5, color: MUTE, marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div data-reveal style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 34, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTE }}>
            <span>University of Oxford</span><span style={{ opacity: .3 }}>·</span><span>Oxford University Innovation</span><span style={{ opacity: .3 }}>·</span><span>Nuffield Foundation</span><span style={{ opacity: .3 }}>·</span><span>Education Endowment Foundation</span><span style={{ opacity: .3 }}>·</span><span>Department for Education</span>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="ox-wrap">
          <div data-reveal style={{ maxWidth: 680 }}>
            <Eyebrow>One joined-up approach</Eyebrow>
            <H2>Identify early. Intervene with evidence. Enrich every classroom.</H2>
            <p style={{ fontSize: 17, color: MUTE, lineHeight: 1.6, margin: 0 }}>Assessment, targeted intervention and whole-class teaching that share the same vocabulary, the same research base and the same portal — so nothing falls between the cracks.</p>
          </div>
          <div className="ox-steps" style={{ marginTop: 44, borderTop: `1px solid ${LINE}` }}>
            {[
              { n: '01', t: 'Identify', d: 'Screen every child in under ten minutes with LanguageScreen. Age-standardised scores and traffic lights show exactly who needs support.', Icon: Ear },
              { n: '02', t: 'Intervene', d: 'Deliver NELI to the children who need it most — 20 weeks of small-group and 1:1 sessions led by trained teaching assistants.', Icon: Users },
              { n: '03', t: 'Enrich', d: 'Run OxEd Whole Class alongside, so every child shares the Special Words and stories and intervention children get extra practice.', Icon: Sparkles },
            ].map((s, i) => (
              <div key={s.n} data-reveal data-delay={String(i)} style={{ padding: '32px 28px 32px 0', borderRight: i < 2 ? `1px solid ${LINE}` : 'none', paddingLeft: i ? 28 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="ox-serif" style={{ fontSize: 15, color: LIME, fontWeight: 600 }}>{s.n}</span>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: LIME_LT, color: GREEN, display: 'grid', placeItems: 'center' }}><s.Icon size={20} /></div>
                </div>
                <h3 className="ox-serif" style={{ fontSize: 28, margin: '18px 0 10px', fontWeight: 500 }}>{s.t}</h3>
                <p style={{ fontSize: 15, color: MUTE, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Assessments ──────────────────────────────────────────────────── */}
      <section id="assessments" style={{ padding: '80px 0', background: '#fff', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
        <div className="ox-wrap">
          <div data-reveal style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 620 }}>
              <Eyebrow>Assessments</Eyebrow>
              <H2>Accurate, reliable screening — in the time it takes to read a story.</H2>
              <p style={{ fontSize: 17, color: MUTE, lineHeight: 1.6, margin: 0 }}>App-based, adult-administered and adaptive. Each screener gives you standardised results for individual pupils and whole classes the moment you finish.</p>
            </div>
            <Btn href="#contact" kind="ghost">Talk to the partnerships team</Btn>
          </div>
          <div className="ox-grid3" style={{ marginTop: 44 }}>
            {ASSESSMENTS.map((a, i) => (
              <div key={a.id} className="ox-card" data-reveal data-delay={String(i)} style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
                <HeadMark color={a.color} Icon={a.Icon} />
                <div style={{ fontSize: 12, fontWeight: 700, color: a.color, letterSpacing: '0.06em', marginTop: 18 }}>{a.tag.toUpperCase()}</div>
                <h3 className="ox-serif" style={{ fontSize: 30, margin: '6px 0 12px', fontWeight: 500 }}>{a.name}</h3>
                <p style={{ fontSize: 15, color: MUTE, lineHeight: 1.6, margin: '0 0 18px', flex: 1 }}>{a.blurb}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'grid', gap: 8 }}>
                  {a.points.map(p => <li key={p} style={{ display: 'flex', gap: 10, fontSize: 14, fontWeight: 600 }}><span style={{ width: 20, height: 20, borderRadius: 999, background: a.soft, color: a.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Check size={12} strokeWidth={3} /></span>{p}</li>)}
                </ul>
                <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: a.color, textDecoration: 'none' }}>Explore {a.name} <ArrowRight size={16} /></a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programmes ───────────────────────────────────────────────────── */}
      <section id="programmes" style={{ padding: '80px 0' }}>
        <div className="ox-wrap">
          <div data-reveal style={{ maxWidth: 640 }}>
            <Eyebrow>Early language programmes</Eyebrow>
            <H2>The Nuffield Early Language Intervention — and everything built around it.</H2>
            <p style={{ fontSize: 17, color: MUTE, lineHeight: 1.6, margin: 0 }}>A complete package of assessment, training, targeted intervention and whole-class enrichment for the early years.</p>
          </div>
          <div className="ox-prog" style={{ marginTop: 44 }}>
            {/* Featured NELI */}
            <div data-reveal style={{ background: INK, color: '#fff', borderRadius: 28, padding: 36, position: 'relative', overflow: 'hidden' }}>
              <div aria-hidden style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${LIME}55, transparent 65%)` }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: LIME, color: INK, fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 999, letterSpacing: '0.06em' }}><ShieldCheck size={14} /> EEF 5/5 EVIDENCE SECURITY</div>
                <h3 className="ox-serif" style={{ fontSize: 40, margin: '20px 0 6px', fontWeight: 500, lineHeight: 1.05 }}>{PROGRAMMES[0].name}</h3>
                <div style={{ fontSize: 13.5, color: '#B8C4BB', fontWeight: 600 }}>{PROGRAMMES[0].who}</div>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: '#D9E0DA', margin: '18px 0 24px' }}>{PROGRAMMES[0].blurb}</p>
                <div className="ox-grid3" style={{ gap: 12 }}>
                  {[['+3–5', 'months’ progress in six months'], ['+7', 'months for disadvantaged pupils'], ['20', 'weeks · TA-led sessions']].map(([a, b]) => (
                    <div key={b} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: '16px 16px' }}>
                      <div className="ox-serif" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, color: '#fff' }}>{a}</div>
                      <div style={{ fontSize: 12.5, color: '#B8C4BB', marginTop: 6 }}>{b}</div>
                    </div>
                  ))}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 26px', display: 'grid', gap: 9 }}>
                  {PROGRAMMES[0].includes!.map(p => <li key={p} style={{ display: 'flex', gap: 10, fontSize: 14.5, color: '#E8EDE8' }}><Check size={16} color={LIME} style={{ flexShrink: 0, marginTop: 2 }} />{p}</li>)}
                </ul>
                <Btn href="#contact" kind="light">Find out about NELI</Btn>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 22 }}>
              {PROGRAMMES.slice(1).map((p, i) => (
                <div key={p.id} className="ox-card" data-reveal data-delay={String(i + 1)} style={{ padding: 28 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: GREEN, letterSpacing: '0.06em' }}>{p.who.toUpperCase()}</div>
                  <h3 className="ox-serif" style={{ fontSize: 30, margin: '6px 0 10px', fontWeight: 500 }}>{p.name}</h3>
                  <p style={{ fontSize: 15, color: MUTE, lineHeight: 1.6, margin: '0 0 14px' }}>{p.blurb}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'grid', gap: 7 }}>
                    {p.proof.map(x => <li key={x} style={{ display: 'flex', gap: 10, fontSize: 14, fontWeight: 600 }}><Check size={15} color={LIME} style={{ flexShrink: 0, marginTop: 2 }} />{x}</li>)}
                  </ul>
                  <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: GREEN, textDecoration: 'none' }}>Learn more <ArrowRight size={16} /></a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Evidence ─────────────────────────────────────────────────────── */}
      <section id="evidence" style={{ padding: '80px 0', background: GREEN_DK, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(700px 400px at 90% 100%, ${GREEN} 0%, transparent 60%)` }} />
        <div className="ox-wrap ox-grid2" style={{ position: 'relative', alignItems: 'center' }}>
          <div data-reveal>
            <Eyebrow color={LIME}>Research & evidence</Eyebrow>
            <H2 light>Built in Oxford. Proven in randomised controlled trials. Used in 11,000 schools.</H2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: '#CFE0D2', margin: '0 0 28px' }}>Our tools grow out of the research of Professor Charles Hulme and his team — the creators of NELI — and every claim we make is backed by independent evaluation.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['5/5', 'EEF evidence security rating for NELI'], ['RCTs', 'randomised controlled trials behind every claim'], ['+2 mo', 'NELI Preschool, EEF trial 2023–24'], ['Long-term', 'gains sustained after the programme ends']].map(([a, b]) => (
                <div key={b} style={{ borderTop: `1px solid rgba(255,255,255,.2)`, paddingTop: 14 }}>
                  <div className="ox-serif" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1 }}>{a}</div>
                  <div style={{ fontSize: 13.5, color: '#B9D0BE', marginTop: 6 }}>{b}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 30 }}><Btn href="#" kind="light">Read the evidence summary</Btn></div>
          </div>
          <div data-reveal data-delay="1" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 28, padding: 36, backdropFilter: 'blur(6px)' }}>
            <Quote size={36} color={LIME} />
            <p className="ox-serif" style={{ fontSize: 'clamp(24px, 2.6vw, 32px)', lineHeight: 1.25, margin: '18px 0 22px', fontWeight: 400 }}>
              “NELI is the closest an intervention has got to being an ‘education silver bullet’.”
            </p>
            <div style={{ fontWeight: 800 }}>Prof Becky Francis</div>
            <div style={{ fontSize: 13.5, color: '#B9D0BE' }}>Chair of the Government’s Curriculum Review</div>
          </div>
        </div>
      </section>

      {/* ── Success stories ──────────────────────────────────────────────── */}
      <section id="stories" style={{ padding: '80px 0' }}>
        <div className="ox-wrap">
          <div data-reveal style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 560 }}>
              <Eyebrow>Success stories</Eyebrow>
              <H2>What schools tell us.</H2>
            </div>
            <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: GREEN, textDecoration: 'none' }}>All success stories <ArrowUpRight size={16} /></a>
          </div>
          <div className="ox-grid3" style={{ marginTop: 40 }}>
            {STORIES.map((s, i) => (
              <div key={i} className="ox-card" data-reveal data-delay={String(i)} style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: LIME }}>{'★★★★★'}</div>
                <p className="ox-serif" style={{ fontSize: 21, lineHeight: 1.35, margin: '14px 0 22px', flex: 1, fontWeight: 400 }}>“{s.q}”</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: LIME_LT, color: GREEN, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{s.who.split(' ').filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 2).join('')}</div>
                  <div><div style={{ fontWeight: 800, fontSize: 14 }}>{s.who}</div><div style={{ fontSize: 12.5, color: MUTE }}>{s.org}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News ─────────────────────────────────────────────────────────── */}
      <section id="news" style={{ padding: '80px 0', background: '#fff', borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
        <div className="ox-wrap">
          <div data-reveal style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
            <div><Eyebrow>News & insights</Eyebrow><H2>Latest from OxEd.</H2></div>
            <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: GREEN, textDecoration: 'none' }}>All news <ArrowUpRight size={16} /></a>
          </div>
          <div className="ox-grid3" style={{ marginTop: 40 }}>
            {NEWS.map((n, i) => (
              <a key={n.title} href="#" className="ox-card" data-reveal data-delay={String(i)} style={{ overflow: 'hidden', textDecoration: 'none', color: INK, display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <span style={{ position: 'absolute', top: 14, left: 14, background: '#fff', color: GREEN, fontSize: 11.5, fontWeight: 800, padding: '5px 10px', borderRadius: 999, letterSpacing: '0.06em' }}>{n.kicker.toUpperCase()}</span>
                  {n.kicker === 'Webinar' && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><span style={{ width: 52, height: 52, borderRadius: 999, background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', color: GREEN }}><Play size={20} fill={GREEN} /></span></span>}
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 className="ox-serif" style={{ fontSize: 23, lineHeight: 1.2, margin: '0 0 10px', fontWeight: 500 }}>{n.title}</h3>
                  <p style={{ fontSize: 14.5, color: MUTE, lineHeight: 1.6, margin: '0 0 16px', flex: 1 }}>{n.body}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: GREEN }}>{n.cta} <ArrowRight size={15} /></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" style={{ padding: '80px 0' }}>
        <div className="ox-wrap ox-grid2" style={{ alignItems: 'center' }}>
          <div data-reveal style={{ position: 'relative' }}>
            <div style={{ borderRadius: 28, overflow: 'hidden', aspectRatio: '4/3', boxShadow: '0 24px 60px rgba(14,26,18,.14)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80" alt="Oxford" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ position: 'absolute', right: -10, bottom: -18, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18, padding: '14px 18px', boxShadow: '0 16px 40px rgba(14,26,18,.12)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: LIME_LT, color: GREEN, display: 'grid', placeItems: 'center' }}><Award size={20} /></div>
              <div><div style={{ fontWeight: 800, fontSize: 14 }}>Vice-Chancellor’s Innovation Awards</div><div style={{ fontSize: 12, color: MUTE }}>Highly Commended · University of Oxford</div></div>
            </div>
          </div>
          <div data-reveal data-delay="1">
            <Eyebrow>Who we are</Eyebrow>
            <H2>From Oxford research to every classroom.</H2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: MUTE, margin: '0 0 16px' }}>OxEd is a University of Oxford spinout launched to take the research of Professor Charles Hulme and his team — creators of the Nuffield Early Language Intervention — through to practical application in schools.</p>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: MUTE, margin: '0 0 28px' }}>We are proud to be affiliated with the University of Oxford and Oxford University Innovation, sharing the benefits of Oxford’s academic excellence with children everywhere.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Btn href="#" kind="ghost">Meet the team</Btn>
              <Btn href="#" kind="ghost" Icon={ArrowUpRight}>Awards & partners</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '0 0 80px' }}>
        <div className="ox-wrap">
          <div data-reveal style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${LIME} 100%)`, borderRadius: 32, padding: 'clamp(32px, 5vw, 64px)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '60px solid rgba(255,255,255,.08)' }} />
            <div className="ox-grid2" style={{ alignItems: 'center', position: 'relative' }}>
              <div>
                <H2 light>Ready to give your children the words they need?</H2>
                <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,.85)', margin: 0 }}>Talk to our partnerships team about LanguageScreen and NELI for your school, trust or local authority — or join a live webinar to see it in action.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Btn href="#" kind="light" Icon={MessageCircle}>Book a conversation</Btn>
                <a href="#" className="ox-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 22px', borderRadius: 999, fontSize: 15, fontWeight: 600, textDecoration: 'none', color: '#fff', border: '1.5px solid rgba(255,255,255,.6)' }}>Join a webinar <Play size={15} /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: INK, color: '#B8C4BB', padding: '56px 0 28px' }}>
        <div className="ox-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 28 }} className="ox-foot">
            <div>
              <div style={{ background: '#fff', display: 'inline-block', padding: '8px 12px', borderRadius: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/oxed-site-logo.png" alt="OxEd & Assessment" style={{ height: 44, width: 'auto', display: 'block' }} />
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '16px 0 0', maxWidth: 300 }}>A University of Oxford spinout developing assessments and interventions shown to improve educational outcomes for children.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                {['CPD Member', 'Cyber Essentials Plus', 'Oxford University Innovation'].map(b => <span key={b} style={{ fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,.18)', padding: '5px 9px', borderRadius: 999 }}>{b}</span>)}
              </div>
            </div>
            {[
              ['Products', ['LanguageScreen', 'ReadingScreen', 'MathsScreen', 'NELI Intervention', 'OxEd Whole Class', 'NELI Preschool']],
              ['Evidence', ['Evidence summary', 'Research papers & trials', 'Whole Class research trial', 'Success stories', 'Awards']],
              ['Company', ['Who we are', 'Events and webinars', 'In the news', 'Partners', 'Contact us', 'Support hub']],
            ].map(([h, items]) => (
              <div key={h as string}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>{h as string}</div>
                {(items as string[]).map(it => <a key={it} href="#" style={{ display: 'block', fontSize: 14, color: '#B8C4BB', textDecoration: 'none', padding: '5px 0' }}>{it}</a>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', marginTop: 40, paddingTop: 20, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
            <span>© {new Date().getFullYear()} OxEd & Assessment UK · Terms and policies · Privacy · Cookies</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Globe size={13} /> United Kingdom · United States · Australia</span>
          </div>
        </div>
        <style>{`@media (max-width: 900px) { .ox-foot { grid-template-columns: 1fr 1fr !important } }`}</style>
      </footer>
    </div>
  )
}
