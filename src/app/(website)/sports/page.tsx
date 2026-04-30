'use client'

import { useRef } from 'react'
import Link from 'next/link'

// ─── Portal Data ──────────────────────────────────────────────────────────────
const PORTALS: Array<{emoji:string;name:string;pill:string;accent:string;features:string[];hook:string;url:string;href:string}> = [
  {emoji:'⚽',name:'Football Pro Club',pill:'Pro · National League System',accent:'#10B981',
    features:['Squad management with GPS load data — Lumio GPS integrated','PSR financial compliance — live headroom tracking to the pound','FIFA-style pitch view — starting XI, bench, click-to-swap','Set pieces library — 90+ routines across all categories','Transfer pipeline, agent contacts, scouting reports','AI Manager Briefing — GPS readiness, compliance, selection in one view'],
    hook:'The first platform where the manager\'s morning briefing includes GPS readiness scores, transfer headroom and compliance status — before the first training session of the day.',
    url:'lumiosports.com/football/pro',href:'/football/pro'},
  {emoji:'⚽',name:'Non-League Football',pill:'Steps 3–7 · National League System',accent:'#F59E0B',
    features:['FA Ground Grading compliance tracker — every inspection criterion','Player contracts and wage bill — live vs budget, to the pound','Sponsorship pipeline — 8–20 active deals managed properly','Match day revenue per fixture — gate, bar, programme, hospitality','FA registration tracking and deadline management','Board portal — chairman, treasurer, secretary, commercial views'],
    hook:'1,800+ clubs across Steps 3–7 of the English football pyramid. Zero dedicated platforms existed for them before this one.',
    url:'lumiosports.com/football/non-league',href:'/football/non-league'},
  {emoji:'⚽',name:'Grassroots Football',pill:'45,000 UK clubs · AI-native',accent:'#F97316',
    features:['AI voice briefing — training tonight, subs outstanding, safeguarding','Player welfare dashboard — injury log, DBS tracker, medical conditions','Subs collection via Stripe direct debit — automated reminders','AI team selection — suggests XI based on availability and form','Safeguarding compliance log — DBS expiry, concern reporting','Parent portal — notifications, consent forms, match day updates'],
    hook:'89% of UK grassroots clubs currently use no software at all. The voice briefing alone — "Training tonight, 3 players unavailable, subs outstanding for 6" — changes how Sunday football is run.',
    url:'lumiosports.com/football/grassroots',href:'/football/grassroots'},
  {emoji:'⚽',name:"Women's Football",pill:'WSL · WSL2 · Standalone clubs',accent:'#EC4899',
    features:['FSR Compliance Dashboard — real-time 80% salary cap vs Relevant Revenue','Player Welfare Hub — maternity tracker, ACL risk monitor, mental health','Standalone sponsorship pipeline with FSR revenue attribution','Dual registration management — expiry alerts, window tracking','Demerger Readiness Tracker — for clubs going standalone','AI Club Director morning briefing — FSR, welfare, commercial, squad'],
    hook:'The first operating system built specifically for professional women\'s football. FSR compliance, maternity welfare, standalone commercial — none of it existed in any platform before this.',
    url:'lumiosports.com/womens-football',href:'/womens-football'},
  {emoji:'🏉',name:'Rugby',pill:'Champ Rugby · Premiership · NL1',accent:'#8B5CF6',
    features:['Salary Cap Manager — ceiling AND floor, live to the pound','Franchise Readiness Tracker — all 6 RFU criteria, RAG status','Concussion & HIA Compliance — 21-day protocol, legal audit trail','Club-to-Country interface — MPGP-aligned data handoff','Women\'s rugby integration — PWR compliance tracking','AI Director of Rugby briefing — 4 role variants (DoR, coach, CEO, medical)'],
    hook:'On 27 February 2026, promotion and relegation ended. The franchise readiness race started. Lumio Rugby is the only platform built for the new landscape.',
    url:'lumiosports.com/rugby',href:'/rugby'},
  {emoji:'🎾',name:'Tennis',pill:'ATP · WTA · Touring professionals',accent:'#A3E635',
    features:['ATP/WTA ranking tracker with points expiry calendar','Race to Turin/Fort Worth standings — live and projected','Surface win percentage breakdown — clay, grass, hard, indoor','Sponsorship manager — deals, obligations, renewal alerts','Physio & recovery — H2H records, opponent scouting','AI briefing for player, coach, agent and physio — different content each'],
    hook:'H2H records, points expiry, surface win rates, and opponent tactical notes — everything for match week delivered in one morning briefing to four different people on the player\'s team.',
    url:'lumiosports.com/tennis',href:'/tennis'},
  {emoji:'⛳',name:'Golf',pill:'DP World Tour · PGA Tour · OWGR',accent:'#38BDF8',
    features:['OWGR tracker with ranking points expiry forecaster','Race to Dubai and FedExCup standings — live','Strokes Gained deep-dive — OTT, Approach, ATG, Putting','Course fit AI scoring — historical data across 47+ venues','Caddie workflow — yardage, weather adjustment, club recommendations','Multi-jurisdiction prize money and tax modeller'],
    hook:'Strokes Gained alerts when a category needs attention. Course fit score before you decide whether to enter. AI caddie briefing before the first tee. Golf finally has a platform that thinks like a touring professional.',
    url:'lumiosports.com/golf',href:'/golf'},
  {emoji:'🎯',name:'Darts',pill:'PDC Tour · Challenge Tour · Q-School',accent:'#EF4444',
    features:['Order of Merit + Tour Card Monitor — drop-off table, buffer above #64 cut','Performance Rating composite score · dartboard heatmap · pressure analysis','Equipment Setup tracker — barrel/shaft/flight/point specs and change log','Match Prep + AI tactical briefings · Nine-Dart Tracker · Premier League pathway','Lumio Live Scoring — tablet scoring, no manual entry','51 portal features across performance, team, commercial, ops and integrations'],
    hook:'The PDC Order of Merit determines your tour card. Your checkout percentage on D16 determines your biggest stages. Your equipment, your team, your income, your fan reach — everything that matters to a professional darts career, finally in one platform.',
    url:'lumiosports.com/darts',href:'/darts'},
  {emoji:'🥊',name:'Boxing',pill:'Professional boxing · All sanctioning bodies · 🛰️ World First: GPS Ring Tracking',accent:'#DC2626',
    features:['🛰️ GPS Ring Heatmap — world\'s first UWB ring positioning. Centre control, ropes time and footwork per round','⚡ AI ring footwork analyst — 3 targeted drills generated from your heatmap data','📊 ACWR load monitor — 28-day rolling camp load chart with safe zone band','Purse Simulator — exact take-home before you sign, every deduction','World Rankings — WBC, WBA, WBO, IBF and Zuffa Boxing in one view','Fight Camp Planner — 8–12 week structure, weight trajectory, readiness','Weight & cut tracker — daily weigh-in log, cut projection to fight night'],
    hook:'World first: GPS ring movement data fused with punch analytics. Track centre control, ropes time and footwork per round — no other platform has built this. Plus the purse simulator that shows your exact take-home before you sign.',
    url:'lumiosports.com/boxing',href:'/boxing'},
  {emoji:'🏏',name:'Cricket',pill:'County · International · IPL · The Hundred',accent:'#FBBF24',
    features:['Contract and central contract tracker across all formats','Batting and bowling analytics — trends, career vs recent form','Franchise schedule — IPL, The Hundred, BBL, SA20 in one calendar','Injury and fitness management with return-to-play protocols','Sponsorship and commercial pipeline — appearances, endorsements','AI morning briefing — county, international and franchise format'],
    hook:'Three formats. Four franchise competitions. Central contracts, county deals, IPL retentions and The Hundred drafts. One career. Lumio Cricket puts it all in a single view for the first time.',
    url:'lumiosports.com/cricket',href:'/cricket'},
]

const PROBLEMS: Array<{accent:string;category:string;emoji:string;quote:string;fact:string;statNum:string;statLabel:string}> = [
  {accent:'#EF4444',category:'THE ATHLETE',emoji:'🥊',
    quote:'A world title contender signs a fight contract without knowing what they\'ll take home after manager fees, trainer cut, sanction fees, camp costs and tax across three jurisdictions.',
    fact:'Most professional fighters have never seen a full purse breakdown before signing a major contract.',
    statNum:'£0',statLabel:'Financial transparency tools built for athletes'},
  {accent:'#8B5CF6',category:'THE CLUB',emoji:'🏉',
    quote:'A Champ Rugby club tracks salary cap headroom in Excel — one formula error from a breach that cost Saracens their league title, 35 points and relegation.',
    fact:'56 pages of Premiership salary cap regulations. Zero dedicated tools to track compliance in real time.',
    statNum:'3',statLabel:'Clubs collapsed in 3 years: Wasps, Worcester, London Irish'},
  {accent:'#EC4899',category:'THE WOMEN\'S GAME',emoji:'⚽',
    quote:'A WSL club\'s finance director tracks FSR compliance in a spreadsheet — regulations introduced this season, with points deduction penalties for breach.',
    fact:'75% of women\'s football clubs globally still don\'t have a kit sponsor. The commercial infrastructure of women\'s sport is being built right now.',
    statNum:'0',statLabel:'Purpose-built women\'s football platforms anywhere in the world'},
]

const HERO_CARDS: Array<{border:string;label:string;value:string;pill:string;pillColor:string}> = [
  {border:'#8B5CF6',label:'Cap Headroom',value:'£460,000',pill:'COMPLIANT',pillColor:'#10B981'},
  {border:'#EC4899',label:'FSR Status',value:'74%',pill:'REVIEW',pillColor:'#F59E0B'},
  {border:'#A3E635',label:'ATP Ranking',value:'#67',pill:'+3 this week',pillColor:'#6B7280'},
  {border:'#EF4444',label:'Fight Camp',value:'Day 14/56',pill:'Weight on track',pillColor:'#10B981'},
  {border:'#38BDF8',label:'OWGR',value:'#87',pill:'Race to Dubai: 12th',pillColor:'#6B7280'},
]

const PILLARS: Array<{icon:string;accent:string;heading:string;body:string;extra?:string;tags?:string[]}> = [
  {icon:'⚡',accent:'linear-gradient(135deg, #8B5CF6, #06B6D4)',heading:'The briefing that changes how professionals start their day',
    body:'Delivered at the time you set. Voice or text. Every relevant metric, every compliance deadline, every commercial obligation, every selection decision — synthesised before the first training session, meeting or call of the day. Different content for each role on the same team.',
    tags:['Football','Rugby','Tennis','Boxing','Golf','Darts','Cricket',"Women's FC"]},
  {icon:'📡',accent:'#06B6D4',heading:'GPS that syncs itself.',
    body:'Lumio GPS units sync session load, ACWR readiness scores, sprint counts, heat maps and fatigue flags directly into your portal — automatically, after every session. No export. No copy-paste. No manual entry.'},
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
            🏆 Ten portals. One platform. Built for sport.
          </div>

          {/* Headline */}
          <h1 className="font-black leading-[1.1] mb-6" style={{fontSize:'clamp(2.2rem, 5vw, 4rem)'}}>
            The operating system<br/>
            <span style={{background:'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #EC4899 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
              professional sport
            </span><br/>
            has been waiting for.
          </h1>

          {/* Subheadline */}
          <p className="text-lg leading-relaxed mb-10 mx-auto" style={{color:'#94A3B8',maxWidth:680}}>
            From the Champ Rugby salary cap to the PDC Order of Merit. From WSL FSR compliance to ATP ranking points expiry. From Premiership transfer deadlines to OWGR exemptions. Every sport. Every regulation. Every decision — one platform.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[
              {n:'10',l:'Portals live'},{n:'0',l:'Dedicated sport OS platforms that existed before this'},{n:'£500m',l:"Women's football global revenue with zero dedicated software"},{n:'56',l:'Pages of Premiership salary cap regulations tracked in Excel'},
            ].map((s:{n:string;l:string},i:number)=>(
              <div key={i} className="text-center">
                <div className="font-black text-3xl md:text-4xl" style={{background:'linear-gradient(135deg, #8B5CF6, #06B6D4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s.n}</div>
                <div className="text-xs mt-1 max-w-[160px]" style={{color:'#64748B'}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-14">
            <Link href="/sports-signup" className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{background:'linear-gradient(135deg, #8B5CF6, #06B6D4)',color:'white',textDecoration:'none'}}>
              Apply for founding access →
            </Link>
            <Link href="/sports/try-demo" className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{border:'1px solid rgba(255,255,255,0.2)',color:'white',textDecoration:'none'}}>
              Try a demo
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

      {/* ═══ SECTION 2: THE PROBLEM ═══ */}
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

      {/* ═══ SECTION 3: PORTAL GRID ═══ */}
      <section ref={portalRef} className="px-6 py-24" style={{borderTop:'1px solid #1E293B'}}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-3" style={{color:'#64748B'}}>THE PORTALS</p>
          <h2 className="text-3xl md:text-5xl font-black text-center mb-3">Ten portals. Every sport covered.</h2>
          <p className="text-center text-sm mb-14 mx-auto" style={{color:'#94A3B8',maxWidth:560}}>Each portal is a complete operating system for that sport — not a generic admin tool with a sports logo.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PORTALS.map((p:{emoji:string;name:string;pill:string;accent:string;features:string[];hook:string;url:string;href:string},i:number)=>(
              <div key={i} className="rounded-2xl p-8 flex flex-col" style={{background:'#0D1117',border:'1px solid #1E293B',borderTop:`4px solid ${p.accent}`,minHeight:380}}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.emoji}</span>
                    <span className="text-2xl font-bold text-white">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap" style={{background:`${p.accent}15`,color:p.accent}}>{p.pill}</span>
                </div>
                <div className="my-4" style={{height:1,background:'#1E293B'}}/>
                <div className="space-y-2 mb-4 flex-1">
                  {p.features.map((f:string,j:number)=>(
                    <div key={j} className="flex items-start gap-2 text-sm" style={{color:'#CBD5E1'}}>
                      <span className="flex-shrink-0 mt-0.5" style={{color:p.accent}}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <div className="text-sm italic pl-4 mb-6" style={{color:p.accent,borderLeft:`2px solid ${p.accent}`}}>{p.hook}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{color:'#475569'}}>{p.url}</span>
                  <Link href={p.href} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={{background:p.accent,color:p.accent==='#A3E635'||p.accent==='#FBBF24'||p.accent==='#F59E0B'||p.accent==='#F97316'?'#0A0B10':'#FFFFFF'}}>Explore →</Link>
                </div>
              </div>
            ))}
          </div>
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

      {/* ═══ SECTION 5: CREDIBILITY ═══ */}
      <section className="px-6 py-24" style={{borderTop:'1px solid #1E293B'}}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-center mb-10" style={{color:'#64748B'}}>BUILT ON REAL INTELLIGENCE</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {QUOTES.map((q:{border:string;text:string;label:string},i:number)=>(
              <div key={i} className="rounded-xl p-6" style={{background:'#0D1117',borderLeft:`4px solid ${q.border}`}}>
                <span className="text-6xl font-serif leading-none block mb-2" style={{color:q.border,opacity:0.3}}>&ldquo;</span>
                <p className="text-sm leading-relaxed mb-4" style={{color:'#CBD5E1'}}>{q.text}</p>
                <p className="text-[10px]" style={{color:'#64748B'}}>{q.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDING MEMBER PROGRAMME ═══ */}
      <section style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.08))' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#F9FAFB', marginBottom: 8 }}>Founding Member Programme</h2>
        <p style={{ fontSize: 16, color: '#9CA3AF', maxWidth: 500, margin: '0 auto 24px' }}>
          We&apos;re onboarding our first 20 athletes completely free. No card, no trial timer — just feedback.
        </p>
        <Link href="/sports-signup" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: 12, backgroundColor: '#7C3AED', color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none' }}>
          Apply for Free Founding Access →
        </Link>
        <p style={{ fontSize: 12, color: '#4B5563', marginTop: 12 }}>Available for Tennis, Golf, Darts, Boxing, Rugby, Cricket</p>
      </section>

      {/* ═══ SECTION 6: FINAL CTA ═══ */}
      <section className="relative overflow-hidden px-6 py-32" style={{borderTop:'1px solid #1E293B'}}>
        <div className="absolute top-[-80px] left-[-60px] w-[500px] h-[500px] rounded-full" style={{background:'radial-gradient(circle, #8B5CF6, transparent 70%)',filter:'blur(120px)',animation:'pulse-orb 8s ease-in-out infinite'}}/>
        <div className="absolute bottom-[-60px] right-[-60px] w-[400px] h-[400px] rounded-full" style={{background:'radial-gradient(circle, #06B6D4, transparent 70%)',filter:'blur(120px)',animation:'pulse-orb 8s ease-in-out infinite 4s'}}/>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-black leading-tight mb-4" style={{fontSize:'clamp(2.5rem, 6vw, 5rem)'}}>
            Ten portals.<br/>One platform.
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
            <Link href="/contact" className="px-8 py-4 rounded-full text-sm font-bold transition-all hover:opacity-90" style={{border:'1px solid rgba(255,255,255,0.2)',color:'white'}}>
              Book a walkthrough →
            </Link>
          </div>
          <p className="text-xs" style={{color:'#475569'}}>lumiosports.com · Built by Lumio Ltd · UK · Data hosted in EU</p>
        </div>
      </section>
    </div>
  )
}
