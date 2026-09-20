'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { SPORTS } from '@/lib/sports/marketing-sports'

// ─── Portal Data ──────────────────────────────────────────────────────────────
// The demo gallery reads from marketing-sports.ts rather than a local copy.
// The local PORTALS array had drifted: no Impact, a different order, and
// accents that disagreed with the cards on /sports/try-demo (Tennis #A3E635
// vs #14B8A6, Football #10B981 vs #3b82f6, Cricket #FBBF24 vs #10b981).
const DEMO_PORTALS = SPORTS.filter(sp => sp.id !== 'impact' && sp.id !== 'tenniscoach')

// The two products that are actually live. Kept here rather than pulled from
// marketing-sports because these carry a logo and a longer line than the demo
// gallery cards below.
const LIVE_PRODUCTS: Array<{name:string;href:string;logo:string;accent:string;line:string}> = [
  {name:'Tennis Coach', href:'/tennis-coach', logo:'/tennis_coach_logo.png', accent:'#3A8EE0',
   line:'Session planner, AI reviews, Racket Progression, GPS heatmaps.'},
  {name:'Impact', href:'/impact', logo:'/impact_logo.png', accent:'#a855f7',
   line:'Digital registers, funder reporting, fundraising, parent app.'},
]

const PROBLEMS: Array<{accent:string;category:string;emoji:string;quote:string;fact:string;statNum:string;statLabel:string}> = [
  {accent:'#3A8EE0',category:'THE COACH',emoji:'🎾',
    quote:'A tennis coach runs a 60-player academy from a notebook and three WhatsApp groups — chasing lesson payments, remembering who is due to progress, with nothing a parent can actually see.',
    fact:'Most academy and grassroots coaches run on no software at all. The work that builds loyalty — progress, reviews, rewards — stays invisible and unbilled.',
    statNum:'£0',statLabel:'Dedicated platforms built for the working coach'},
  {accent:'#10B981',category:'THE CLUB',emoji:'⚽',
    quote:'A Championship club models PSR headroom by hand in Excel across a rolling three-year window — one formula error from the points deduction that can undo a whole season on the pitch.',
    fact:'Profit & Sustainability Rules are enforced across three seasons of accounts, yet most clubs still track compliance in spreadsheets.',
    statNum:'0',statLabel:'Real-time PSR compliance tools built for football clubs'},
  {accent:'#EC4899',category:'THE WOMEN\'S GAME',emoji:'⚽',
    quote:'A WSL club\'s finance director tracks FSR compliance in a spreadsheet — regulations introduced this season, with points deduction penalties for breach.',
    fact:'75% of women\'s football clubs globally still don\'t have a kit sponsor. The commercial infrastructure of women\'s sport is being built right now.',
    statNum:'0',statLabel:'Purpose-built women\'s football platforms anywhere in the world'},
]

const HERO_CARDS: Array<{border:string;label:string;value:string;pill:string;pillColor:string}> = [
  {border:'#8B5CF6',label:'Cap Headroom',value:'£460,000',pill:'COMPLIANT',pillColor:'#10B981'},
  {border:'#EC4899',label:'FSR Status',value:'74%',pill:'REVIEW',pillColor:'#F59E0B'},
  {border:'#10B981',label:'Squad Available',value:'21/24',pill:'GPS green',pillColor:'#10B981'},
  {border:'#3A8EE0',label:'Racket Progression',value:'3 awarded',pill:'This week',pillColor:'#3A8EE0'},
  {border:'#16A34A',label:'Lessons / week',value:'42',pill:'Academy live',pillColor:'#6B7280'},
]

const PILLARS: Array<{icon:string;accent:string;heading:string;body:string;extra?:string;tags?:string[]}> = [
  {icon:'⚡',accent:'linear-gradient(135deg, #8B5CF6, #06B6D4)',heading:'AI that does the write-up — not just the data.',
    body:'Log a session, a match or a contract and Lumio turns it into a finished, shareable write-up. AI session reviews for coaches, match recaps for parents, board-ready summaries for clubs — written in your voice, from your real data. The reporting that used to eat your evening, done in seconds.',
    tags:['Football','Rugby','Cricket',"Women's FC",'Tennis Coach','Junior']},
  {icon:'📡',accent:'#06B6D4',heading:'GPS that syncs itself.',
    body:'GPS units sync session load, ACWR readiness scores, sprint counts, heat maps and fatigue flags directly into your portal — automatically, after every session. No export. No copy-paste. No manual entry.'},
  {icon:'💰',accent:'#10B981',heading:'Every pound. Every contract. Every clause.',
    body:'The purse simulator that shows a boxer their exact take-home. The FSR dashboard that shows a women\'s club where they stand. The salary cap meter that tracks a rugby club to the pound. Financial transparency is not a feature. It is the foundation every portal is built on.'},
  {icon:'👥',accent:'#8B5CF6',heading:'Every role sees exactly what they need.',
    body:'The Director of Rugby sees cap headroom and franchise readiness. The Head Coach sees squad readiness and opposition analysis. The CEO sees financial sustainability. The agent sees earnings and contract timelines. Same platform. Same data. Completely different views — role-gated, permission-controlled, purpose-built.'},
]

const QUOTES: Array<{border:string;text:string;label:string}> = [
  {border:'#8B5CF6',text:'The salary cap manager is the only tool in rugby that tracks both the ceiling and the new £5.4M salary floor introduced from 2026/27 — the compliant zone narrows to just £1 million. One formula error in Excel costs you points. Lumio tracks it to the pound.',label:'Lumio Rugby · Champ Rugby tier'},
  {border:'#EC4899',text:'The FSR Compliance Dashboard is the first platform to make Financial Sustainability Regulation compliance real-time for WSL and WSL2 clubs. Relevant Revenue, bundled sponsorship attribution, age-band salary minimums — all tracked in one view, updated as contracts change.',label:'Lumio Women\'s Football · WSL tier'},
  {border:'#DC2626',text:'The Purse Simulator models UK, USA, Saudi Arabia, Germany and UAE tax and deduction implications on any fight purse. Same £5M headline. Dramatically different take-home depending on where you fight. Know before you sign.',label:'Lumio Boxing · Professional tier'},
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function SportsLandingPage() {
  const portalRef = useRef<HTMLDivElement>(null)
  const scrollToPortals = () => portalRef.current?.scrollIntoView({behavior:'smooth'})

  return (
    <div style={{background:'#07080F',color:'#F9FAFB'}}>
      <style>{`
        @keyframes pulse-orb{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.25;transform:scale(1.1)}}
        @keyframes fade-up{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="relative overflow-hidden pt-32 pb-20 px-6">
        <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full" style={{background:'radial-gradient(circle, #8B5CF6, transparent 70%)',filter:'blur(120px)',animation:'pulse-orb 8s ease-in-out infinite'}}/>
        <div className="absolute bottom-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full" style={{background:'radial-gradient(circle, #06B6D4, transparent 70%)',filter:'blur(120px)',animation:'pulse-orb 8s ease-in-out infinite 4s'}}/>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-sm font-medium" style={{border:'1px solid rgba(139,92,246,0.3)',background:'rgba(139,92,246,0.08)',color:'#D1D5DB'}}>
            🏆 Two products live. Eleven more in development.
          </div>

          {/* Headline */}
          <h1 className="font-black leading-[1.1] mb-6" style={{fontSize:'clamp(2.2rem, 5vw, 4rem)'}}>
            The club management platform<br/>
            <span style={{background:'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #EC4899 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              professional sport
            </span><br/>
            has been waiting for.
          </h1>

          {/* Subheadline */}
          <p className="text-lg leading-relaxed mb-10 mx-auto" style={{color:'#94A3B8',maxWidth:680}}>
            From the Premiership salary cap to grassroots Sunday football. From WSL financial-sustainability compliance to the coaching academy court. Football clubs at every level, the rugby, cricket and women&apos;s teams around them, and the academies developing the next generation. Every club, every team, every coach — one platform.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[
              {n:'2',l:'Products live — Tennis Coach and Impact'},{n:'13',l:'Portals built across eleven sports'},{n:'56',l:'Pages of Premiership salary cap regulations tracked in Excel'},
            ].map((s:{n:string;l:string},i:number)=>(
              <div key={i} className="text-center">
                <div className="font-black text-3xl md:text-4xl" style={{background:'linear-gradient(135deg, #8B5CF6, #06B6D4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s.n}</div>
                <div className="text-xs mt-1 max-w-[160px]" style={{color:'#64748B'}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-14">
            <Link href="/sports/try-demo" className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{background:'linear-gradient(135deg, #8B5CF6, #06B6D4)',color:'white',textDecoration:'none'}}>
              Try a demo &rarr;
            </Link>
            <Link href="mailto:hello@lumiosports.com?subject=Lumio%20Sports" className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{border:'1px solid rgba(255,255,255,0.2)',color:'white',textDecoration:'none'}}>
              Talk to us
            </Link>
          </div>

          {/* Dashboard Strip */}
          <div className="flex flex-wrap justify-center gap-3">
            {HERO_CARDS.map((c:{border:string;label:string;value:string;pill:string;pillColor:string},i:number)=>(
              <div key={i} className="rounded-xl p-4 text-left" style={{background:'#0D1117',border:`1px solid ${c.border}33`,minWidth:170,animation:`fade-up 0.6s ease-out ${i*0.15}s both`}}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{color:'#64748B'}}>{c.label}</div>
                <div className="text-lg font-bold text-white mb-1">{c.value}</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{background:`${c.pillColor}20`,color:c.pillColor}}>{c.pill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: LIVE PRODUCTS ═══ */}
      {/* The conversion path. Everything below this is either the problem
          framing or a demo of something not yet purchasable, so the two
          products anyone can actually buy lead the page. */}
      <section className="px-6 py-24" style={{borderTop:'1px solid #1E293B'}}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-3" style={{color:'#64748B'}}>LIVE NOW</p>
          <h2 className="text-3xl md:text-5xl font-black text-center mb-3">Two products you can use today.</h2>
          <p className="text-center text-sm mb-12 mx-auto" style={{color:'#94A3B8',maxWidth:520}}>Built, running and taking customers. Everything further down this page is a working demo of something still in development.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LIVE_PRODUCTS.map((pr:{name:string;href:string;logo:string;accent:string;line:string},i:number)=>(
              <Link key={i} href={pr.href} className="rounded-2xl p-8 flex flex-col items-start transition-all hover:opacity-90"
                style={{background:'#0D1117',border:'1px solid #1E293B',borderTop:`4px solid ${pr.accent}`,textDecoration:'none'}}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pr.logo} alt={pr.name} style={{width:64,height:64,objectFit:'contain',marginBottom:18}}/>
                <div className="text-2xl font-bold text-white mb-2">{pr.name}</div>
                <div className="text-sm leading-relaxed mb-6 flex-1" style={{color:'#94A3B8'}}>{pr.line}</div>
                <span className="px-5 py-2.5 rounded-lg text-sm font-bold" style={{background:pr.accent,color:'#fff'}}>Explore {pr.name} &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: THE PROBLEM ═══ */}
      <section className="px-6 py-24" style={{borderTop:'1px solid #1E293B'}}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-3" style={{color:'#64748B'}}>THE PROBLEM</p>
          <h2 className="text-3xl md:text-5xl font-black text-center mb-14">Professional sport is run on WhatsApp and spreadsheets.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {PROBLEMS.map((p:{accent:string;category:string;emoji:string;quote:string;fact:string;statNum:string;statLabel:string},i:number)=>(
              <div key={i} className="rounded-2xl p-8 flex flex-col" style={{background:'#0D1117',border:'1px solid #1E293B',borderTop:`4px solid ${p.accent}`,minHeight:380}}>
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 self-start" style={{background:`${p.accent}15`,color:p.accent}}>{p.category}</span>
                <p className="text-base leading-relaxed italic mb-4 flex-1" style={{color:'#E2E8F0'}}>&ldquo;{p.quote}&rdquo;</p>
                <p className="text-xs leading-relaxed mb-4" style={{color:'#F59E0B'}}>{p.fact}</p>
                <div><span className="text-3xl font-black" style={{color:'#8B5CF6'}}>{p.statNum}</span><span className="text-xs ml-2" style={{color:'#64748B'}}>{p.statLabel}</span></div>
              </div>
            ))}
          </div>

          <p className="text-2xl md:text-3xl font-black text-center leading-snug">
            Lumio Sports was built to fix this.<br/>
            <span style={{color:'#94A3B8'}}>For every sport. For every level. Starting now.</span>
          </p>
        </div>
      </section>

      {/* ═══ SECTION 4: PLATFORM PILLARS ═══ */}
      <section className="px-6 py-24" style={{borderTop:'1px solid #1E293B'}}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-3" style={{color:'#64748B'}}>THE PLATFORM</p>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-3">Built on one intelligence layer. Shared across every sport.</h2>
          <p className="text-center text-sm mb-14 mx-auto" style={{color:'#94A3B8',maxWidth:520}}>Every portal runs on the same AI infrastructure, data architecture and performance backbone.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PILLARS.map((b:{icon:string;accent:string;heading:string;body:string;extra?:string;tags?:string[]},i:number)=>(
              <div key={i} className="rounded-2xl p-8" style={{background:'#0D1117',border:'1px solid #1E293B',minHeight:280}}>
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{b.heading}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{color:'#94A3B8'}}>{b.body}</p>
                {b.tags&&<div className="flex flex-wrap gap-1.5">{b.tags.map((t:string,j:number)=><span key={j} className="text-[10px] px-2 py-0.5 rounded-full" style={{background:'rgba(139,92,246,0.1)',color:'#A78BFA',border:'1px solid rgba(139,92,246,0.2)'}}>{t}</span>)}</div>}
                {b.extra&&<p className="text-xs mt-3" style={{color:'#F59E0B'}}>{b.extra}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5: DEMO GALLERY ═══ */}
      {/* Sourced from marketing-sports.ts, the single source the try-demo grid
          and the nav already use, so this list cannot drift again. Impact and
          Tennis Coach are excluded — they are the live products, above. */}
      <section ref={portalRef} className="px-6 py-24" style={{borderTop:'1px solid #1E293B'}}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-3" style={{color:'#64748B'}}>IN DEVELOPMENT</p>
          <h2 className="text-3xl md:text-5xl font-black text-center mb-3">Eleven more portals you can explore today.</h2>
          <p className="text-center text-sm mb-12 mx-auto" style={{color:'#94A3B8',maxWidth:560}}>Each one is a working demo with sample data seeded in — not yet a product you can buy. Tennis Coach and Impact, above, are the two that are.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_PORTALS.map(d=>(
              <Link key={d.id} href={d.href} className="rounded-xl p-5 flex flex-col transition-all hover:opacity-90"
                style={{background:'#0D1117',border:'1px solid #1E293B',borderLeft:`3px solid ${d.accent}`,textDecoration:'none'}}>
                <div className="text-base font-bold text-white mb-1">{d.label}</div>
                <div className="text-xs leading-relaxed mb-4 flex-1" style={{color:'#94A3B8'}}>{d.desc}</div>
                <span className="text-xs font-bold" style={{color:d.accent}}>Try the demo &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6: CREDIBILITY ═══ */}
      <section className="px-6 py-24" style={{borderTop:'1px solid #1E293B'}}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-3" style={{color:'#64748B'}}>WHAT THE COMPLIANCE TOOLING DOES</p>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Three of the hardest problems, handled.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {QUOTES.map((q:{border:string;text:string;label:string},i:number)=>(
              <div key={i} className="rounded-xl p-6" style={{background:'#0D1117',borderLeft:`4px solid ${q.border}`}}>
                {/* Feature statements, not endorsements. These were previously
                    rendered with a 6xl serif quotation mark under a "BUILT ON
                    REAL INTELLIGENCE" heading, which read as third-party
                    testimony — nobody said any of it. Same copy, presented as
                    what it is: a labelled description of what the tool does. */}
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{color:q.border}}>{q.label}</p>
                <p className="text-sm leading-relaxed" style={{color:'#CBD5E1'}}>{q.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7: FINAL CTA ═══ */}
      <section className="relative overflow-hidden px-6 py-32" style={{borderTop:'1px solid #1E293B'}}>
        <div className="absolute top-[-80px] left-[-60px] w-[500px] h-[500px] rounded-full" style={{background:'radial-gradient(circle, #8B5CF6, transparent 70%)',filter:'blur(120px)',animation:'pulse-orb 8s ease-in-out infinite'}}/>
        <div className="absolute bottom-[-60px] right-[-60px] w-[400px] h-[400px] rounded-full" style={{background:'radial-gradient(circle, #06B6D4, transparent 70%)',filter:'blur(120px)',animation:'pulse-orb 8s ease-in-out infinite 4s'}}/>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-black leading-tight mb-4" style={{fontSize:'clamp(2.5rem, 6vw, 5rem)'}}>
            Thirteen portals.<br/>One platform.
          </h2>
          <p className="text-2xl md:text-3xl font-bold mb-6" style={{background:'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #EC4899 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Professional sport finally has infrastructure.
          </p>
          <p className="text-sm leading-relaxed mb-10 mx-auto" style={{color:'#94A3B8',maxWidth:560}}>
            Every demo is live. Every portal has real data seeded in. No sales call required to see it working — just click any portal above and explore.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <button onClick={scrollToPortals} className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{background:'linear-gradient(135deg, #8B5CF6, #06B6D4)',color:'white'}}>
              Explore all portals ↑
            </button>
            <Link href="mailto:hello@lumiosports.com?subject=Lumio%20Sports" className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{border:'1px solid rgba(255,255,255,0.2)',color:'white'}}>
              Book a walkthrough →
            </Link>
          </div>
          <p className="text-xs" style={{color:'#475569'}}>lumiosports.com · Built by Lumio Ltd · UK · Data hosted in EU</p>
        </div>
      </section>
    </div>
  )
}
