'use client'

import { useRef } from 'react'
import Link from 'next/link'

const HERO_CARDS: { border: string; label: string; value: string; pill: string; pillColor: string }[] = [
  { border: '#8B5CF6', label: 'Cap Headroom', value: '£460,000', pill: 'COMPLIANT', pillColor: '#10B981' },
  { border: '#EC4899', label: 'FSR Status', value: '74%', pill: 'REVIEW', pillColor: '#F59E0B' },
  { border: '#A3E635', label: 'ATP Ranking', value: '#67', pill: '+3 this week', pillColor: '#6B7280' },
  { border: '#EF4444', label: 'Fight Camp', value: 'Day 14/56', pill: 'Weight on track', pillColor: '#10B981' },
  { border: '#38BDF8', label: 'OWGR', value: '#87', pill: 'Race to Dubai: 12th', pillColor: '#6B7280' },
]

export default function SportsHubPage() {
  const portalRef = useRef<HTMLDivElement>(null)
  const scrollToPortals = () => portalRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ background: '#07080F', color: '#F9FAFB' }}>
      <style>{`
        @keyframes pulse-orb{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.25;transform:scale(1.1)}}
        @keyframes fade-up{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ═══ SECTION 1: HERO (original) ═══ */}
      <section className="relative overflow-hidden pt-32 pb-20 px-6">
        <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)', filter: 'blur(120px)', animation: 'pulse-orb 8s ease-in-out infinite' }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, #06B6D4, transparent 70%)', filter: 'blur(120px)', animation: 'pulse-orb 8s ease-in-out infinite 4s' }} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-sm font-medium" style={{ border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)', color: '#D1D5DB' }}>
            🏆 Ten portals. One platform. Built for sport.
          </div>

          <h1 className="font-black leading-[1.05] mb-6" style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}>
            The operating system<br />
            <span style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              professional sport
            </span><br />
            has been waiting for.
          </h1>

          <p className="text-lg leading-relaxed mb-10 mx-auto" style={{ color: '#94A3B8', maxWidth: 680 }}>
            From the Champ Rugby salary cap to the PDC Order of Merit. From WSL FSR compliance to ATP ranking points expiry. From Premiership transfer deadlines to OWGR exemptions. Every sport. Every regulation. Every decision — one platform.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[
              { n: '10', l: 'Portals live' },
              { n: '0', l: 'Dedicated sport OS platforms that existed before this' },
              { n: '£500m', l: "Women's football global revenue with zero dedicated software" },
              { n: '56', l: 'Pages of Premiership salary cap regulations tracked in Excel' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-black text-3xl md:text-4xl" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</div>
                <div className="text-xs mt-1 max-w-[160px]" style={{ color: '#64748B' }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-14">
            <button onClick={scrollToPortals} className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', color: 'white' }}>
              Explore all portals →
            </button>
            <Link href="/ai" className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{ border: '1px solid rgba(139,92,246,0.4)', color: 'white', background: 'rgba(139,92,246,0.08)' }}>
              See our AI features ✨
            </Link>
            <Link href="/sports-signup" className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
              Apply for founding access →
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {HERO_CARDS.map((c, i) => (
              <div key={i} className="rounded-xl p-4 text-left" style={{ background: '#0D1117', border: `1px solid ${c.border}33`, minWidth: 170, animation: `fade-up 0.6s ease-out ${i * 0.15}s both` }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>{c.label}</div>
                <div className="text-lg font-bold text-white mb-1">{c.value}</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${c.pillColor}20`, color: c.pillColor }}>{c.pill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: THE PROBLEM ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, textAlign: 'center', color: '#F9FAFB', marginBottom: 48 }}>
            Professional athletes shouldn&apos;t spend half their time on admin.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { emoji: '\u{1F4CB}', text: 'Managing your career in WhatsApp groups and spreadsheets' },
              { emoji: '\u23F0', text: 'Hours lost to admin that should take seconds' },
              { emoji: '\u{1F4B8}', text: 'Missed deadlines, overpriced flights, no time to prepare' },
            ].map((card, i) => (
              <div key={i} style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{card.emoji}</div>
                <p style={{ fontSize: 16, color: '#9CA3AF', lineHeight: 1.6 }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: AI FEATURES ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, textAlign: 'center', color: '#F9FAFB', marginBottom: 12 }}>
            Meet your AI chief of staff
          </h2>
          <p style={{ fontSize: 16, color: '#9CA3AF', textAlign: 'center', marginBottom: 48 }}>
            10 AI features built into every Lumio portal — not bolted on.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {[
              { emoji: '\u{1F916}', title: 'AI Morning Briefing', desc: 'Your entire day read back to you in 60 seconds.' },
              { emoji: '\u2708\uFE0F', title: 'Smart Flights AI', desc: 'Finds the best flights to your next tournament.' },
              { emoji: '\u26BD', title: 'Match Prep AI', desc: 'Tactical brief on your next opponent.' },
              { emoji: '\u{1F4F1}', title: 'Social Media AI', desc: 'Writes sponsor content in one click.' },
              { emoji: '\u{1F50D}', title: 'Coach & Player Finder AI', desc: 'Searches for the right coach or partner.' },
              { emoji: '\u{1F4F0}', title: 'Press Statement AI', desc: 'Media-ready statements in your voice.' },
            ].map((f, i) => (
              <div key={i} style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: POWERED BY CLAUDE AI ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', backgroundColor: '#0d1117', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: 48 }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#8B5CF6', marginBottom: 16, textTransform: 'uppercase' }}>
            Powered by Claude AI &middot; Built by Anthropic
          </p>
          <p style={{ fontSize: 16, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 16 }}>
            Lumio is built on Claude — Anthropic&apos;s frontier AI model. It reasons, plans, and writes like the best executive assistant you&apos;ve ever worked with. Except it never sleeps, never forgets, and scales to every athlete on the platform.
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>
            Enterprise-grade AI. Athlete-grade simplicity.
          </p>
        </div>
      </section>

      {/* ═══ SECTION 5: SPORT PORTALS GRID ═══ */}
      <section ref={portalRef} id="portals" style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, textAlign: 'center', color: '#F9FAFB', marginBottom: 48 }}>
            Built for your sport
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {([
              { emoji: '\u{1F3BE}', name: 'Tennis', accent: '#8B5CF6', features: ['AI Morning Briefing', 'Match Prep AI', 'Smart Flights AI'], href: '/tennis/tennis-demo' },
              { emoji: '\u26F3', name: 'Golf', accent: '#15803D', features: ['Course Fit AI', 'Strokes Gained Alerts', 'Caddie Briefing'], href: '/golf/golf-demo' },
              { emoji: '\u{1F3AF}', name: 'Darts', accent: '#dc2626', features: ['Order of Merit Tracker', 'Match Prep AI', 'Equipment Log'], href: '/darts/darts-demo' },
              { emoji: '\u{1F94A}', name: 'Boxing', accent: '#dc2626', features: ['Purse Simulator', 'Fight Camp Planner', 'Weight Tracker'], href: '/boxing/lumio-demo' },
              { emoji: '\u{1F3CF}', name: 'Cricket', accent: '#FBBF24', features: ['Multi-format Calendar', 'Batting Analytics', 'Franchise Tracker'], href: '/cricket/cricket-demo' },
              { emoji: '\u{1F3C9}', name: 'Rugby', accent: '#7C3AED', features: ['Salary Cap Manager', 'Concussion Protocol', 'Franchise Readiness'], href: '/rugby/rugby-demo' },
              { emoji: '\u26BD', name: 'Football Pro', accent: '#003DA5', features: ['Squad GPS Data', 'PSR Compliance', 'Transfer Pipeline'], href: '/football/lumio-dev' },
              { emoji: '\u26BD', name: 'Non-League', accent: '#F59E0B', features: ['Ground Grading', 'Sponsorship Pipeline', 'Match Day Revenue'], href: '/nonleague/harfield-fc' },
              { emoji: '\u26BD', name: 'Grassroots', accent: '#F97316', features: ['Subs Collection', 'AI Team Selection', 'Parent Portal'], href: '/grassroots/sunday-rovers-fc' },
              { emoji: '\u26BD', name: "Women's FC", accent: '#DB2777', features: ['FSR Compliance', 'Player Welfare Hub', 'Demerger Tracker'], href: '/womens/oakridge-women-fc' },
            ] as const).map((sport, i) => (
              <div key={i} style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 28, borderTop: `3px solid ${sport.accent}` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{sport.emoji}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', marginBottom: 12 }}>{sport.name}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                  {sport.features.map((f, j) => (
                    <li key={j} style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>&#10003; {f}</li>
                  ))}
                </ul>
                <Link href={sport.href} style={{ fontSize: 13, fontWeight: 700, color: sport.accent, textDecoration: 'none' }}>
                  Try demo &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6: HOW IT WORKS ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, textAlign: 'center', color: '#F9FAFB', marginBottom: 48 }}>
            Up and running in 2 minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { emoji: '\u{1F3AF}', title: 'Sign up', desc: 'Tell us your sport, upload photo and logo' },
              { emoji: '\u{1F916}', title: 'AI connects', desc: 'Links to rankings, calendar and team' },
              { emoji: '\u26A1', title: 'Chief of staff activates', desc: 'Briefings, prep, admin handled' },
              { emoji: '\u{1F3C6}', title: 'Focus on performing', desc: 'Lumio runs in the background' },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{step.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6', marginBottom: 8 }}>Step {i + 1}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7: FOUNDING MEMBER CTA ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937', background: 'linear-gradient(180deg, transparent, rgba(139,92,246,0.06))' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: 24, textTransform: 'uppercase' }}>
            FOUNDING MEMBER &middot; 20 SPOTS
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#F9FAFB', marginBottom: 16 }}>
            We&apos;re onboarding our first 20 athletes completely free.
          </h2>
          <p style={{ fontSize: 16, color: '#9CA3AF', marginBottom: 24, lineHeight: 1.7 }}>
            No card. No commitment. Honest feedback and a case study.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            {['3 months free', 'We build what you ask for', 'No lock-in'].map(pill => (
              <span key={pill} style={{ fontSize: 12, fontWeight: 600, color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 999, padding: '6px 14px' }}>
                {pill}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            <Link href="/sports-signup" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: 12, backgroundColor: '#8B5CF6', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Apply for founding access &rarr;
            </Link>
            <Link href="/tennis/tennis-demo" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', color: '#F9FAFB', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Or try a demo first &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 8: FOOTER ═══ */}
      <footer style={{ padding: '60px 24px 40px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 60, margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>The AI brain behind your career</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Tennis', href: '/tennis' },
              { label: 'Golf', href: '/golf' },
              { label: 'Darts', href: '/darts' },
              { label: 'Boxing', href: '/boxing' },
              { label: 'Cricket', href: '/cricket' },
              { label: 'Rugby', href: '/rugby' },
              { label: 'Football', href: '/football' },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <Link href="/privacy" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>Terms</Link>
          </div>
          <p style={{ fontSize: 11, color: '#4B5563' }}>
            Powered by Claude AI &middot; Built by Lumio Ltd &middot; &copy; 2026
          </p>
        </div>
      </footer>
    </div>
  )
}
