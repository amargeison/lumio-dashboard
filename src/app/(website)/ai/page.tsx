'use client'

import Link from 'next/link'

export default function AIFeaturesPage() {
  return (
    <div style={{ background: '#07080F', color: '#F9FAFB' }}>

      {/* ═══ HERO ═══ */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ position: 'absolute', top: -150, left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#9CA3AF', marginBottom: 24, textTransform: 'uppercase' }}>
            LUMIO SPORTS &middot; POWERED BY CLAUDE AI
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, color: '#F9FAFB', marginBottom: 24 }}>
            The AI brain behind your career.
          </h1>
          <p style={{ fontSize: 18, color: '#9CA3AF', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Your personal AI chief of staff — match prep, sponsorship, travel, media. All handled. So you can focus on performing.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            <Link href="/sports-signup" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: 12, backgroundColor: '#8B5CF6', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Apply for free founding access &rarr;
            </Link>
            <a href="#ai-features" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', color: '#F9FAFB', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              See it in action &darr;
            </a>
          </div>
        </div>
      </section>

      {/* ═══ THE PROBLEM ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, textAlign: 'center', color: '#F9FAFB', marginBottom: 48 }}>
            Professional athletes shouldn&apos;t spend half their time on admin.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { emoji: '\u{1F4CB}', title: 'No single source of truth', text: 'Career decisions made across WhatsApp, spreadsheets, email, and guesswork. No system. No structure. No visibility.' },
              { emoji: '\u23F0', title: 'Hours lost to admin', text: 'Booking flights, chasing sponsors, preparing for opponents, tracking rankings — time that should be spent training or competing.' },
              { emoji: '\u{1F4B8}', title: 'Money left on the table', text: 'Missed sponsorship deadlines, overpriced travel, unsigned contracts, tax inefficiencies across jurisdictions. No athlete should be surprised by their own pay cheque.' },
            ].map((card, i) => (
              <div key={i} style={{ backgroundColor: '#0d1117', border: '1px solid #1F2937', borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{card.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.6 }}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI FEATURES GRID ═══ */}
      <section id="ai-features" style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, textAlign: 'center', color: '#F9FAFB', marginBottom: 12 }}>
            Meet your AI chief of staff
          </h2>
          <p style={{ fontSize: 16, color: '#9CA3AF', textAlign: 'center', marginBottom: 48 }}>
            10 AI features built into every Lumio portal — not bolted on.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {[
              { emoji: '🤖', title: 'AI Morning Briefing', desc: 'Your entire day — schedule, opponents, obligations, travel — read back to you in 60 seconds. Different content for every role on the team.' },
              { emoji: '✈️', title: 'Smart Flights AI', desc: 'Finds the cheapest flights to your next tournament, fight, or fixture. Compares dates, routes, and baggage — so you never overpay again.' },
              { emoji: '⚔️', title: 'Match Prep AI', desc: 'Tactical brief on your next opponent. H2H records, weaknesses, preferred patterns, and a game plan — generated in seconds.' },
              { emoji: '📱', title: 'Social Media AI', desc: 'Writes sponsor-compliant content in your voice. One click. Handles tone, hashtags, and brand guidelines automatically.' },
              { emoji: '🔍', title: 'Coach & Player Finder AI', desc: 'Searches for the right coach, physio, sparring partner, or caddie based on location, availability, and specialism.' },
              { emoji: '📰', title: 'Press Statement AI', desc: 'Media-ready statements in your voice — win, loss, injury update, or transfer. Reviewed and posted in under a minute.' },
              { emoji: '🏨', title: 'Smart Hotel Finder AI', desc: 'Finds accommodation near your next venue. Filters by distance, budget, gym access, and dietary requirements.' },
              { emoji: '📊', title: 'Performance Intelligence AI', desc: 'Analyses trends in your stats — strokes gained, checkout %, ACWR, xG — and flags when something needs attention before you notice.' },
              { emoji: '💰', title: 'Sponsorship AI', desc: 'Drafts outreach, tracks obligations, flags renewal deadlines, and models deal value across jurisdictions.' },
              { emoji: '🗣️', title: 'Voice Briefing', desc: 'Every AI briefing can be read aloud. Pick your voice — Sarah, James, or your own custom setting. Hands-free, eyes-free.' },
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

      {/* ═══ POWERED BY CLAUDE AI ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', backgroundColor: '#0d1117', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: 48 }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#8B5CF6', marginBottom: 16, textTransform: 'uppercase' }}>
            Powered by Claude AI &middot; Built by Anthropic
          </p>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#F9FAFB', marginBottom: 16 }}>
            Not a chatbot. Not a gimmick. A genuine AI engine.
          </h2>
          <p style={{ fontSize: 16, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 16 }}>
            Lumio is built on Claude — Anthropic&apos;s frontier AI model. It reasons, plans, and writes like the best executive assistant you&apos;ve ever worked with. Except it never sleeps, never forgets, and scales to every athlete on the platform.
          </p>
          <p style={{ fontSize: 16, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 16 }}>
            Every AI feature uses live web search — real rankings, real flight prices, real opponent data. Not a language model guessing from old training data.
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>
            Enterprise-grade AI. Athlete-grade simplicity.
          </p>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, textAlign: 'center', color: '#F9FAFB', marginBottom: 48 }}>
            How the AI works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { emoji: '🎯', step: 'Step 1', title: 'You open your portal', desc: 'Tennis, golf, boxing, darts, cricket, rugby, football — pick your sport.' },
              { emoji: '🤖', step: 'Step 2', title: 'AI reads the landscape', desc: 'Rankings, fixtures, weather, opponents, travel, obligations — all pulled in live.' },
              { emoji: '⚡', step: 'Step 3', title: 'Briefing delivered', desc: 'Your Morning Roundup lands. Text or voice. Tailored to your role — player, coach, agent, or physio.' },
              { emoji: '🏆', step: 'Step 4', title: 'You focus on performing', desc: 'Admin handled. Flights booked. Sponsors chased. Match prep ready. Lumio runs in the background.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{s.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6', marginBottom: 8 }}>{s.step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SPORT-SPECIFIC AI EXAMPLES ═══ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, textAlign: 'center', color: '#F9FAFB', marginBottom: 12 }}>
            AI that speaks your sport
          </h2>
          <p style={{ fontSize: 16, color: '#9CA3AF', textAlign: 'center', marginBottom: 48, maxWidth: 640, margin: '0 auto 48px' }}>
            Every portal&apos;s AI is tuned to the regulations, metrics, and language of that sport.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { border: '#8B5CF6', sport: 'Tennis', example: '"You have 280 ranking points expiring in 3 weeks. If you enter Stuttgart qualifying and win 2 rounds, you net +45 and hold position. Skip it and you drop to #74."' },
              { border: '#DC2626', sport: 'Boxing', example: '"Same £5M purse. Fight in Riyadh: take-home £4.1M. Fight in London: £2.8M after tax, manager, trainer, and sanction fees. The AI models every deduction before you sign."' },
              { border: '#EC4899', sport: "Women's FC", example: '"FSR headroom is £142k. If the Apex Performance renewal lands at the proposed £220k bundled figure, your Relevant Revenue adjusts and headroom rises to £284k — but only if you attribute correctly."' },
              { border: '#7C3AED', sport: 'Rugby', example: '"Salary cap: £5.92M ceiling, £5.4M floor from next season. You have £460k headroom above the ceiling but you are £180k below the floor minimum. Two signings needed before deadline."' },
              { border: '#EF4444', sport: 'Darts', example: '"Order of Merit: £312,400 (PDC #19). Tour card safe by £87k. But if you lose before the quarter-final tonight, Van den Bergh overtakes you and your seeding drops for the World Championship."' },
              { border: '#38BDF8', sport: 'Golf', example: '"OWGR #87. Course fit score for Wentworth: 78/100 — your approach play from 150-175 yards is top-20 on tour but your sand save % is a weakness on this layout."' },
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: '#0d1117', borderLeft: `4px solid ${item.border}`, borderRadius: 12, padding: 24, border: `1px solid #1F2937`, borderLeftColor: item.border, borderLeftWidth: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.border, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.sport}</div>
                <p style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.7, fontStyle: 'italic' }}>{item.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDING MEMBER CTA ═══ */}
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

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: '60px 24px 40px', borderTop: '1px solid #1F2937' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lumio_logo_ultra_clean.png" alt="Lumio Sports" style={{ height: 60, margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>The AI brain behind your career</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Home', href: '/sports' },
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
