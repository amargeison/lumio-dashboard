'use client';

import { useState } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface RugbyClub {
  name: string;
  league: string;
  stadium: string;
  capacity: number;
  headCoach: string;
  dor: string;
  ceo: string;
  headMedical: string;
  headWomens: string;
  squadSize: number;
  leaguePosition: number;
  capCeiling: number;
  capFloor: number;
  currentSpend: number;
  franchiseScore: number;
  nextFixture: string;
  nextFixtureDate: string;
  plan: string;
}

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',       label: 'Club Dashboard',        icon: '🏠', group: 'CLUB OVERVIEW' },
  { id: 'dorbriefing',     label: 'DoR Briefing',          icon: '🌅', group: 'CLUB OVERVIEW' },
  { id: 'matchday',        label: 'Match Day Centre',      icon: '🏟️', group: 'CLUB OVERVIEW' },
  { id: 'calendar',        label: 'Club Calendar',         icon: '📅', group: 'CLUB OVERVIEW' },
  { id: 'capdashboard',    label: 'Cap Dashboard',         icon: '⚖️', group: 'SALARY CAP' },
  { id: 'contracts',       label: 'Player Contracts',      icon: '📋', group: 'SALARY CAP' },
  { id: 'scenario',        label: 'Scenario Modeller',     icon: '🧮', group: 'SALARY CAP' },
  { id: 'audittrail',      label: 'Audit Trail',           icon: '📜', group: 'SALARY CAP' },
  { id: 'readiness',       label: 'Readiness Score',       icon: '🏆', group: 'FRANCHISE' },
  { id: 'criteria',        label: 'Criteria Tracker',      icon: '✅', group: 'FRANCHISE' },
  { id: 'eoi',             label: 'Expression of Interest',icon: '📄', group: 'FRANCHISE' },
  { id: 'gapanalysis',     label: 'Gap Analysis',          icon: '📊', group: 'FRANCHISE' },
  { id: 'availability',    label: 'Squad Availability',    icon: '👥', group: 'SQUAD' },
  { id: 'selection',       label: 'Selection Planner',     icon: '📝', group: 'SQUAD' },
  { id: 'international',   label: 'International Duty',    icon: '🌍', group: 'SQUAD' },
  { id: 'loans',           label: 'Loan Management',       icon: '🔄', group: 'SQUAD' },
  { id: 'gps-load',        label: 'GPS & Load',            icon: '📡', group: 'PERFORMANCE' },
  { id: 'video-analysis',  label: 'Video Analysis',        icon: '🎬', group: 'PERFORMANCE' },
  { id: 'match-stats',     label: 'Match Stats',           icon: '📊', group: 'PERFORMANCE' },
  { id: 'training-planner',label: 'Training Planner',      icon: '📋', group: 'PERFORMANCE' },
  { id: 'scouting',        label: 'Scouting Pipeline',     icon: '🔍', group: 'RECRUITMENT' },
  { id: 'capimpact',       label: 'Cap Impact Modeller',   icon: '💷', group: 'RECRUITMENT' },
  { id: 'agents',          label: 'Agent Contacts',        icon: '📞', group: 'RECRUITMENT' },
  { id: 'targets',         label: 'Targets Shortlist',     icon: '🎯', group: 'RECRUITMENT' },
  { id: 'concussion',      label: 'Concussion & HIA',      icon: '🧠', group: 'WELFARE' },
  { id: 'rtp',             label: 'Return to Play',        icon: '🏥', group: 'WELFARE' },
  { id: 'medical',         label: 'Medical Records',       icon: '📂', group: 'WELFARE' },
  { id: 'welfareaudit',    label: 'Welfare Audit',         icon: '🛡️', group: 'WELFARE' },
  { id: 'sponsorship',     label: 'Sponsorship Pipeline',  icon: '🤝', group: 'COMMERCIAL' },
  { id: 'matchdayrev',     label: 'Matchday Revenue',      icon: '💰', group: 'COMMERCIAL' },
  { id: 'stadium',         label: 'Stadium & Venue',       icon: '🏟️', group: 'COMMERCIAL' },
  { id: 'activation',      label: 'Partnership Activation',icon: '🎯', group: 'COMMERCIAL' },
  { id: 'womenssquad',     label: "Women's Squad",         icon: '⭐', group: "WOMEN'S RUGBY" },
  { id: 'pwrcompliance',   label: 'PWR Compliance',        icon: '📋', group: "WOMEN'S RUGBY" },
  { id: 'sharedfacilities',label: 'Shared Facilities',     icon: '🏢', group: "WOMEN'S RUGBY" },
  { id: 'womenscommercial',label: "Women's Commercial",    icon: '💼', group: "WOMEN'S RUGBY" },
  { id: 'aibriefing',      label: 'AI Morning Briefing',   icon: '🤖', group: 'INTELLIGENCE' },
  { id: 'clubtocountry',   label: 'Club-to-Country',       icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'INTELLIGENCE' },
  { id: 'opposition',      label: 'Opposition Analysis',   icon: '🔎', group: 'INTELLIGENCE' },
  { id: 'industrynews',    label: 'Industry News',         icon: '📰', group: 'INTELLIGENCE' },
];

// ─── DEMO CLUB ────────────────────────────────────────────────────────────────
const DEMO_CLUB: RugbyClub = {
  name: 'Hartfield RFC',
  league: 'Champ Rugby',
  stadium: 'The Grange',
  capacity: 4800,
  headCoach: 'Mark Ellison',
  dor: 'Steve Whitfield',
  ceo: 'Caroline Hughes',
  headMedical: 'Dr. James Marsh',
  headWomens: 'Rachel Turner',
  squadSize: 38,
  leaguePosition: 4,
  capCeiling: 2800000,
  capFloor: 1900000,
  currentSpend: 2340000,
  franchiseScore: 71,
  nextFixture: 'vs Jersey Reds (Home)',
  nextFixtureDate: 'Saturday 11 April',
  plan: 'Club Pro+ · £599/mo',
};

// ─── SQUAD DATA ───────────────────────────────────────────────────────────────
const SQUAD: Array<{id:number;name:string;pos:string;status:'available'|'doubtful'|'unavailable';reason:string;readiness:number;returnDate:string;weeklyWage:number;contractEnd:string;intl:boolean;loan:string}> = [
  {id:1,name:'Tom Harrison',pos:'Prop',status:'available',reason:'',readiness:94,returnDate:'',weeklyWage:1800,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:2,name:'James Briggs',pos:'Hooker',status:'available',reason:'',readiness:100,returnDate:'',weeklyWage:2100,contractEnd:'Jun 2028',intl:false,loan:''},
  {id:3,name:'Phil Dowd',pos:'Prop',status:'available',reason:'',readiness:88,returnDate:'',weeklyWage:1200,contractEnd:'Jun 2026',intl:false,loan:'out-Coventry'},
  {id:4,name:'Marcus Webb',pos:'Lock',status:'available',reason:'',readiness:87,returnDate:'',weeklyWage:2500,contractEnd:'Jun 2028',intl:true,loan:''},
  {id:5,name:'Chris Palmer',pos:'Lock',status:'available',reason:'',readiness:91,returnDate:'',weeklyWage:1600,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:6,name:'Danny Foster',pos:'No.8',status:'unavailable',reason:'HIA Protocol — Day 8',readiness:0,returnDate:'19 Apr',weeklyWage:2200,contractEnd:'Jun 2028',intl:true,loan:''},
  {id:7,name:'Karl Foster',pos:'Flanker',status:'available',reason:'',readiness:82,returnDate:'',weeklyWage:1900,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:8,name:'Sam Ellis',pos:'Scrum Half',status:'available',reason:'',readiness:90,returnDate:'',weeklyWage:1400,contractEnd:'Jun 2026',intl:false,loan:'out-Doncaster'},
  {id:9,name:'Danny Cole',pos:'Fly Half',status:'doubtful',reason:'71% readiness — monitoring',readiness:71,returnDate:'',weeklyWage:2300,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:10,name:'Ryan Patel',pos:'Wing',status:'doubtful',reason:'Hamstring Grade 2',readiness:45,returnDate:'18 Apr',weeklyWage:1700,contractEnd:'Jun 2026',intl:false,loan:''},
  {id:11,name:'Jake Rawlings',pos:'Prop',status:'available',reason:'',readiness:86,returnDate:'',weeklyWage:1200,contractEnd:'30 Apr (loan)',intl:false,loan:'in-Bath'},
  {id:12,name:'Connor Walsh',pos:'Fly Half',status:'available',reason:'',readiness:92,returnDate:'',weeklyWage:900,contractEnd:'Season end (loan)',intl:false,loan:'in-Bristol'},
  {id:13,name:'Ben Taylor',pos:'Wing',status:'available',reason:'',readiness:89,returnDate:'',weeklyWage:800,contractEnd:'Season end (loan)',intl:false,loan:'in-Exeter'},
  {id:14,name:'Karl Briggs',pos:'Hooker',status:'unavailable',reason:'Shoulder — post-op',readiness:0,returnDate:'2 May',weeklyWage:1500,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:15,name:'Matt Jones',pos:'Centre',status:'available',reason:'',readiness:93,returnDate:'',weeklyWage:1800,contractEnd:'Jun 2028',intl:false,loan:''},
  {id:16,name:'Luke Barnes',pos:'Fullback',status:'available',reason:'',readiness:95,returnDate:'',weeklyWage:2000,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:17,name:'Josh White',pos:'Flanker',status:'available',reason:'',readiness:88,returnDate:'',weeklyWage:1600,contractEnd:'Jun 2026',intl:false,loan:''},
  {id:18,name:'David Obi',pos:'Centre',status:'available',reason:'',readiness:91,returnDate:'',weeklyWage:1700,contractEnd:'Jun 2028',intl:false,loan:''},
  {id:19,name:'Callum Reeves',pos:'Wing',status:'available',reason:'',readiness:87,returnDate:'',weeklyWage:1300,contractEnd:'Jun 2027',intl:false,loan:''},
  {id:20,name:'Oliver Grant',pos:'Scrum Half',status:'available',reason:'',readiness:90,returnDate:'',weeklyWage:1500,contractEnd:'Jun 2027',intl:false,loan:''},
];

const FRANCHISE_CRITERIA = [
  {name:'Rugby Excellence',score:88,status:'GREEN' as const,details:'League position: 4th ✓ | International players: 3 ✓ | Academy graduates: 4 ✓ | Quality index: 81 ✓'},
  {name:'Operating Standards',score:65,status:'AMBER' as const,details:'Compliance: ✓ | Stadium: ✓ (4,800) | Matchday assessment: ⚠ Due Jun 2026 | Digital: ⚠ Refresh needed'},
  {name:'Financial Sustainability',score:82,status:'GREEN' as const,details:'Break-even ✓ | Wage ratio: 71% (below 75%) ✓ | 3-year projection ✓ | Revenue diversified ✓'},
  {name:'Investment Capacity',score:48,status:'RED' as const,details:'Investment evidence: ✗ Incomplete | Due diligence pack: ✗ Not prepared | Board governance: ✓'},
  {name:'Community Impact',score:79,status:'GREEN' as const,details:'Grassroots: £28k (25.4%) ✓ | Schools: 12 (840 participants) ✓ | Events: 8 ✓'},
  {name:'Women\'s Game',score:42,status:'RED' as const,details:'PWR team: ✗ Not registered | Regional plan: ✗ Not submitted | Community women\'s: ✓'},
];

const SPONSORS = [
  {name:'Hartfield Building Society',type:'Shirt sponsor',value:85000,renewal:'June 2026',status:'active' as const,obligations:'Logo on shirt, 4 hospitality boxes, monthly newsletter'},
  {name:'Hartfield Motors',type:'Training kit',value:22000,renewal:'December 2026',status:'active' as const,obligations:'Logo on training kit, 1 player appearance/month'},
  {name:'County Council',type:'Community sponsor',value:18000,renewal:'March 2027',status:'active' as const,obligations:'Community match programme, annual report'},
  {name:'Smith & Sons Construction',type:'Ground naming',value:35000,renewal:'Year 2 of 3',status:'active' as const,obligations:'"The Grange — Smith & Sons Arena"'},
  {name:'Regional Law',type:'Stand naming',value:12000,renewal:'Year 2 of 3',status:'active' as const,obligations:'Stand naming rights'},
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const fmt = (n: number): string => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);

const StatCard = ({label,value,sub,color='purple'}:{label:string;value:string|number;sub?:string;color?:string}) => {
  const colorMap: Record<string,string> = {
    purple:'from-purple-600/20 to-purple-900/10 border-purple-600/20',
    teal:'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    orange:'from-orange-600/20 to-orange-900/10 border-orange-600/20',
    blue:'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    green:'from-green-600/20 to-green-900/10 border-green-600/20',
    red:'from-red-600/20 to-red-900/10 border-red-600/20',
    yellow:'from-yellow-600/20 to-yellow-900/10 border-yellow-600/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]||colorMap.purple} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub&&<div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
};

const SectionHeader = ({title,subtitle,icon}:{title:string;subtitle?:string;icon?:string}) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon&&<span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white" style={{fontFamily:'Syne, sans-serif'}}>{title}</h2>
    </div>
    {subtitle&&<p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
);

const StatusPill = ({status}:{status:'GREEN'|'AMBER'|'RED'|string}) => {
  const c = status==='GREEN'?'bg-green-600/20 text-green-400 border-green-600/30':status==='AMBER'?'bg-amber-600/20 text-amber-400 border-amber-600/30':'bg-red-600/20 text-red-400 border-red-600/30';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${c}`}>{status}</span>;
};

const Card = ({children,className=''}:{children:React.ReactNode;className?:string}) => (
  <div className={`bg-[#0d1117] border border-gray-800 rounded-xl p-5 ${className}`}>{children}</div>
);

const QuickActionsBar = () => {
  const actions = ['Log Training','Match Report','Cap Check','Medical Review','Sponsor Post','Selection','Scouting','Travel','AI Briefing','Compliance'];
  return (
    <div className="mb-6 overflow-x-auto pb-2 -mx-1">
      <div className="flex gap-2 px-1 min-w-max">
        {actions.map((a:string,i:number)=>(
          <button key={i} className="bg-[#0d1117] border border-gray-800 hover:border-purple-500/50 rounded-full px-4 py-2 text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">{a}</button>
        ))}
      </div>
    </div>
  );
};

// ─── CLUB DASHBOARD VIEW ──────────────────────────────────────────────────────
function ClubDashboardView({club}:{club:RugbyClub}) {
  const available = SQUAD.filter((p:{status:string})=>p.status==='available').length;
  const headroom = club.capCeiling - club.currentSpend;
  const floorBuffer = club.currentSpend - club.capFloor;
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      {/* Alert Banner */}
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4 text-sm text-amber-400">
        <span className="font-bold">FRANCHISE READINESS: {club.franchiseScore}%</span> — 2 criteria require attention. Cap audit window: 34 days. Next fixture: {club.nextFixture} {club.nextFixtureDate}.
      </div>

      <SectionHeader icon="🏠" title={`${club.name} — Club Dashboard`} subtitle={`${club.league} · ${club.stadium} · Capacity ${club.capacity.toLocaleString()}`} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Cap Headroom" value={fmt(headroom)} sub="To ceiling — compliant" color="green" />
        <StatCard label="Floor Buffer" value={`+${fmt(floorBuffer)}`} sub="Above minimum" color="green" />
        <StatCard label="Franchise Score" value={`${club.franchiseScore}%`} sub="Target: 85%" color="orange" />
        <StatCard label="Squad Available" value={`${available}/${club.squadSize}`} sub={`${club.squadSize - available} unavailable`} color={available >= 30 ? 'teal' : 'orange'} />
        <StatCard label="Next Fixture" value="4 days" sub={club.nextFixture} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Weekly Schedule */}
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Match Week Schedule</div>
            <div className="space-y-2">
              {[
                {day:'Mon',items:'Squad training 10am (29 players), Medical reviews 2pm'},
                {day:'Tue',items:'Team run 10am, Analysis session 2pm'},
                {day:'Wed',items:'REST (home fixture)'},
                {day:'Thu',items:'Pre-match walkthrough 11am'},
                {day:'Sat',items:'KO 3pm vs Jersey Reds, The Grange'},
              ].map((d:{day:string;items:string},i:number)=>(
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
                  <span className="text-xs text-purple-400 font-bold w-10">{d.day}</span>
                  <span className="text-sm text-gray-300">{d.items}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Kitman Labs Readiness */}
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Kitman Labs — Player Readiness</div>
            <div className="space-y-2">
              {SQUAD.slice(0,6).map((p:{name:string;pos:string;readiness:number;status:string},i:number)=>(
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[10px] font-bold text-purple-400">{p.name.split(' ').map((w:string)=>w[0]).join('')}</div>
                    <div><div className="text-sm text-white">{p.name}</div><div className="text-xs text-gray-500">{p.pos}</div></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 bg-gray-800 rounded-full h-2"><div className={`h-2 rounded-full ${p.readiness>=80?'bg-green-500':p.readiness>=60?'bg-amber-500':'bg-red-500'}`} style={{width:`${p.readiness}%`}}></div></div>
                    <span className={`text-xs font-bold w-10 text-right ${p.readiness>=80?'text-green-400':p.readiness>=60?'text-amber-400':'text-red-400'}`}>{p.readiness}%</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${p.readiness>=80?'bg-green-600/20 text-green-400':p.readiness>=60?'bg-amber-600/20 text-amber-400':'bg-red-600/20 text-red-400'}`}>
                      {p.readiness>=80?'READY':p.readiness>=60?'AMBER':'RED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Salary Cap Meter */}
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Salary Cap — Live</div>
            <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden mb-2">
              <div className="absolute inset-0 flex">
                <div style={{width:`${((club.capFloor)/club.capCeiling)*100}%`}} className="bg-gray-700/50"></div>
                <div style={{width:`${((club.currentSpend - club.capFloor)/club.capCeiling)*100}%`}} className="bg-green-600/40"></div>
                <div style={{width:`${((club.capCeiling - club.currentSpend)/club.capCeiling)*100}%`}} className="bg-green-600/10"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">{fmt(club.currentSpend)}</div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Floor: {fmt(club.capFloor)}</span>
              <span className="text-green-400 font-medium">{fmt(headroom)} headroom</span>
              <span>Ceiling: {fmt(club.capCeiling)}</span>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Franchise Readiness */}
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Franchise Readiness</div>
            <div className="flex items-center justify-center mb-4">
              <svg viewBox="0 0 120 120" className="w-28 h-28">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1f2937" strokeWidth="8"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#8B5CF6" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(club.franchiseScore/100)*314} 314`} transform="rotate(-90 60 60)"/>
                <text x="60" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">{club.franchiseScore}</text>
                <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="10">/ 100</text>
              </svg>
            </div>
            <div className="space-y-2">
              {FRANCHISE_CRITERIA.map((c:{name:string;score:number;status:string},i:number)=>(
                <div key={i} className="flex items-center justify-between py-1 border-b border-gray-800/50">
                  <span className="text-xs text-gray-300">{c.name}</span>
                  <StatusPill status={c.status}/>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-red-400">→ Complete investor documentation — Caroline Hughes</div>
              <div className="text-xs text-red-400">→ Register Women&apos;s PWR team by 30 April</div>
            </div>
          </Card>

          {/* Bottom Alerts */}
          <Card>
            <div className="text-sm font-semibold text-white mb-3">Alerts</div>
            <div className="space-y-2">
              {[
                {icon:'🧠',text:'1 active HIA: Danny Foster (Day 8 of protocol)',color:'text-red-400'},
                {icon:'🤝',text:'2 sponsorship renewals due within 30 days',color:'text-amber-400'},
                {icon:'📋',text:'Salary cap return due in 34 days',color:'text-amber-400'},
              ].map((a:{icon:string;text:string;color:string},i:number)=>(
                <div key={i} className={`flex items-center gap-2 text-xs ${a.color} py-1.5 border-b border-gray-800/50`}>
                  <span>{a.icon}</span><span>{a.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── DIRECTOR OF RUGBY BRIEFING VIEW ──────────────────────────────────────────
function DoRBriefingView({club}:{club:RugbyClub}) {
  const [briefing,setBriefing]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  const generateBriefing = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY||'','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Generate a Director of Rugby morning briefing for ${club.name} (${club.league}). Include sections: 🏉 SQUAD & SELECTION (31/38 available, Danny Foster on HIA protocol day 8, Ryan Patel doubtful hamstring, next match vs Jersey Reds Saturday), 💰 SALARY CAP STATUS (spend £2.34M of £2.8M ceiling, compliant, 34 days to next return), 🏆 FRANCHISE READINESS (71%, investment docs and women's registration outstanding), 🔍 RECRUITMENT (Marcus Jennings openside target in talks, Connor Walsh loan expiring Apr 30), ⚠ COMPLIANCE & WELFARE (1 active HIA, welfare audit 2 screenings outstanding), 📋 TODAY'S PRIORITIES. Tone: direct, professional, factual.`}]}),
      });
      const data = await res.json();
      setBriefing(data.content?.[0]?.text||'Briefing generation failed.');
    } catch { setBriefing('Error connecting to AI service. Check API key configuration.'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🌅" title="Director of Rugby Briefing" subtitle={`${club.dor} — ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} — Match Week`} />

      <div className="flex items-center gap-3 mb-4">
        <button onClick={generateBriefing} disabled={loading} className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 transition-colors disabled:opacity-50">
          {loading?'Generating...':'Generate AI Briefing'}
        </button>
        <span className="text-xs text-gray-500">Delivery: 7:30am on training days</span>
      </div>

      {loading && (
        <Card><div className="flex items-center gap-2 text-xs text-purple-400"><div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>Generating Director of Rugby briefing...</div></Card>
      )}

      {briefing && !loading && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><div className="text-sm font-semibold text-white">AI Briefing</div><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">Generated by Claude</span></div>
            <button onClick={()=>navigator.clipboard.writeText(briefing)} className="text-xs text-gray-500 hover:text-gray-300">Copy</button>
          </div>
          <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{briefing}</div>
        </Card>
      )}

      {!briefing && !loading && (
        <div className="space-y-4">
          {[
            {icon:'🏉',title:'SQUAD & SELECTION',items:['31 of 38 players available','Danny Foster — HIA protocol Day 8 (unavailable)','Ryan Patel — hamstring, doubtful Saturday','Danny Cole — 71% readiness, monitoring','Jersey Reds preparation on track']},
            {icon:'💰',title:'SALARY CAP STATUS',items:['Current spend: £2,340,000 of £2,800,000 ceiling','Headroom: £460,000 — COMPLIANT','Floor buffer: +£440,000 above minimum','Next return due: May 10 (34 days)']},
            {icon:'🏆',title:'FRANCHISE READINESS',items:['Score: 71% (target 85%)','RED: Investment documentation incomplete','RED: Women\'s PWR registration outstanding','Next action: investor pack — Caroline Hughes']},
            {icon:'🔍',title:'RECRUITMENT',items:['Marcus Jennings (openside) — in talks with agent','Connor Walsh loan expires April 30 — extend or release?','Tom Clarke (fly-half) — approached, exploring options']},
            {icon:'⚠',title:'COMPLIANCE & WELFARE',items:['1 active HIA — Danny Foster, Day 8 of 21-day protocol','2 annual medical screenings outstanding (deferred — injury)','DBS checks: 47/47 current ✓']},
            {icon:'📋',title:'TODAY\'S PRIORITIES',items:['Review Jersey Reds analysis with coaching team','Chase investor documentation from Caroline Hughes','Confirm Marcus Jennings meeting with Dan Hooper (agent)','Medical review: Danny Cole readiness assessment']},
          ].map((s:{icon:string;title:string;items:string[]},i:number)=>(
            <Card key={i}>
              <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-2">{s.icon} {s.title}</div>
              <div className="space-y-1">
                {s.items.map((item:string,j:number)=>(
                  <div key={j} className="text-sm text-gray-300 py-0.5">• {item}</div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MATCH DAY CENTRE VIEW ────────────────────────────────────────────────────
function MatchDayCentreView({club}:{club:RugbyClub}) {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏟️" title="Match Day Centre" subtitle={`${club.name} vs Jersey Reds — ${club.nextFixtureDate} — KO 3:00pm — The Grange`} />

      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/20 border border-purple-600/30 rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[{l:'Competition',v:'Champ Rugby — Round 18'},{l:'Referee',v:'Martin Walsh (RFU ✓)'},{l:'Commissioner',v:'TBC'},{l:'Venue',v:'The Grange, Hartfield'}].map((d:{l:string;v:string},i:number)=>(
            <div key={i}><div className="text-gray-500">{d.l}</div><div className="text-white font-medium mt-0.5">{d.v}</div></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Starting XV */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Starting XV</div>
          <div className="space-y-1">
            {[{n:1,name:'Tom Harrison',pos:'Loosehead Prop',r:94},{n:2,name:'James Briggs',pos:'Hooker',r:100},{n:3,name:'Jake Rawlings',pos:'Tighthead Prop',r:86},
              {n:4,name:'Marcus Webb',pos:'Lock',r:87},{n:5,name:'Chris Palmer',pos:'Lock',r:91},{n:6,name:'Josh White',pos:'Blindside',r:88},
              {n:7,name:'Karl Foster',pos:'Openside',r:82},{n:8,name:'TBC',pos:'No.8 (Foster HIA)',r:0},
              {n:9,name:'Oliver Grant',pos:'Scrum Half',r:90},{n:10,name:'Danny Cole',pos:'Fly Half',r:71},
              {n:11,name:'Ryan Patel',pos:'Left Wing',r:45},{n:12,name:'Matt Jones',pos:'Inside Centre',r:93},
              {n:13,name:'David Obi',pos:'Outside Centre',r:91},{n:14,name:'Ben Taylor',pos:'Right Wing',r:89},{n:15,name:'Luke Barnes',pos:'Fullback',r:95},
            ].map((p:{n:number;name:string;pos:string;r:number},i:number)=>(
              <div key={i} className={`flex items-center gap-3 py-1.5 border-b border-gray-800/50 ${p.r<60&&p.r>0?'opacity-60':''}`}>
                <span className="text-xs text-purple-400 font-bold w-6 text-right">{p.n}</span>
                <span className={`text-sm flex-1 ${p.r===0?'text-red-400 italic':'text-white'}`}>{p.name}</span>
                <span className="text-xs text-gray-500">{p.pos}</span>
                {p.r>0&&<span className={`text-xs font-medium ${p.r>=80?'text-green-400':p.r>=60?'text-amber-400':'text-red-400'}`}>{p.r}%</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* Match Week Timeline */}
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Match Week Timeline</div>
          <div className="space-y-3">
            {[
              {day:'Mon',items:['Analysis of Jersey Reds — set piece review ✓']},
              {day:'Tue',items:['Team run — 29 players ✓']},
              {day:'Wed',items:['Media — post-training press call 1pm']},
              {day:'Thu',items:['Team meeting 10am — game plan finalised']},
              {day:'Fri',items:['Captain\'s Run 11am','Pre-match dinner 7pm']},
              {day:'Sat',items:['Arrive The Grange 12pm','KO 3pm','Post-match function 5:30pm']},
            ].map((d:{day:string;items:string[]},i:number)=>(
              <div key={i} className="py-1.5 border-b border-gray-800/50">
                <span className="text-xs text-purple-400 font-bold">{d.day}</span>
                {d.items.map((item:string,j:number)=>(<div key={j} className="text-sm text-gray-300 ml-8">{item}</div>))}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Opposition Intel */}
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Opposition Intel — Jersey Reds</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[{l:'Position',v:'6th'},{l:'Form (L5)',v:'W L W W L'},{l:'Lineout',v:'88% retention'},{l:'Scrum',v:'62% success'}].map((s:{l:string;v:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center"><div className="text-white font-bold text-sm">{s.v}</div><div className="text-xs text-gray-500 mt-0.5">{s.l}</div></div>
          ))}
        </div>
        <div className="text-xs text-gray-400 leading-relaxed">
          <span className="text-amber-400 font-medium">Coach note:</span> &quot;Attack their scrum early — 4 scrum penalties in last 3 games. Wingers compete for high ball — Hawkins kicks long to left channel 60% of the time. Neutralise Charlie Morris at breakdown.&quot;
        </div>
      </Card>
    </div>
  );
}

// ─── CLUB CALENDAR VIEW ──────────────────────────────────────────────────────
function ClubCalendarView() {
  const events: Array<{date:string;event:string;type:string}> = [
    {date:'11 Apr',event:'vs Jersey Reds (Home) KO 3pm',type:'fixture'},
    {date:'15 Apr',event:'Corporate conference — 80 delegates',type:'commercial'},
    {date:'18 Apr',event:'School rugby festival — 240 children',type:'community'},
    {date:'25 Apr',event:'Business networking evening',type:'commercial'},
    {date:'27 Apr–10 May',event:'International window (6 players)',type:'intl'},
    {date:'30 Apr',event:'Women\'s PWR registration deadline',type:'compliance'},
    {date:'3 May',event:'Hartfield Building Society hospitality',type:'commercial'},
    {date:'10 May',event:'Salary cap return deadline',type:'compliance'},
  ];
  const typeColors: Record<string,string> = {fixture:'text-purple-400',commercial:'text-blue-400',community:'text-green-400',intl:'text-amber-400',compliance:'text-red-400'};
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📅" title="Club Calendar" subtitle="Fixtures, training, commercial events, and compliance deadlines." />
      <Card>
        <div className="space-y-2">
          {events.map((e:{date:string;event:string;type:string},i:number)=>(
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800/50">
              <span className="text-xs text-gray-500 w-28 flex-shrink-0">{e.date}</span>
              <span className={`text-sm ${typeColors[e.type]||'text-gray-300'}`}>{e.event}</span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded ml-auto">{e.type}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex gap-4">
        {Object.entries(typeColors).map(([type,color]:[string,string],i:number)=>(
          <div key={i} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${color.replace('text-','bg-')}`}></div><span className="text-[10px] text-gray-500 capitalize">{type}</span></div>
        ))}
      </div>
    </div>
  );
}

// ─── CAP DASHBOARD VIEW ──────────────────────────────────────────────────────
function CapDashboardView({club}:{club:RugbyClub}) {
  const headroom = club.capCeiling - club.currentSpend;
  const academyCredits = 48000;
  const centralDiscounts = 35000;
  const effectiveCharge = club.currentSpend - academyCredits - centralDiscounts;
  const effectiveHeadroom = club.capCeiling - effectiveCharge;

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="⚖️" title="Salary Cap Dashboard" subtitle="Live salary cap management — Champ Rugby 2025/26 season." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Cap Ceiling" value={fmt(club.capCeiling)} color="purple" />
        <StatCard label="Current Spend" value={fmt(club.currentSpend)} color="teal" />
        <StatCard label="Headroom" value={fmt(headroom)} sub="GREEN — Compliant" color="green" />
        <StatCard label="Effective Charge" value={fmt(effectiveCharge)} sub="After credits" color="blue" />
      </div>

      {/* Cap Bar */}
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Three-Zone Cap Indicator</div>
        <div className="relative h-10 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div className="absolute inset-0 flex">
            <div style={{width:`${(club.capFloor/club.capCeiling)*100}%`}} className="bg-red-600/20 border-r border-red-500/50"></div>
            <div style={{width:`${((club.currentSpend-club.capFloor)/club.capCeiling)*100}%`}} className="bg-green-600/30"></div>
            <div style={{width:`${((club.capCeiling-club.currentSpend)/club.capCeiling)*100}%`}} className="bg-green-600/10"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">{fmt(club.currentSpend)} — COMPLIANT</div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Floor: {fmt(club.capFloor)}</span><span>Ceiling: {fmt(club.capCeiling)}</span>
        </div>
      </Card>

      {/* Squad Cap Breakdown */}
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Squad Cap Breakdown (Top 20 by charge)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-left p-3">Contract</th><th className="text-left p-3">Weekly</th><th className="text-left p-3">Annual Cap</th><th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {[...SQUAD].sort((a:{weeklyWage:number},b:{weeklyWage:number})=>b.weeklyWage-a.weeklyWage).slice(0,20).map((p:{name:string;pos:string;contractEnd:string;weeklyWage:number;loan:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200">{p.name}</td>
                  <td className="p-3 text-gray-400">{p.pos}</td>
                  <td className="p-3 text-gray-400 text-xs">{p.contractEnd}</td>
                  <td className="p-3 text-gray-300">{fmt(p.weeklyWage)}</td>
                  <td className="p-3 text-purple-400 font-medium">{fmt(p.weeklyWage*52)}</td>
                  <td className="p-3">{p.loan?<span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">Loan</span>:<span className="text-xs text-gray-500">Club</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Exclusions & Credits</div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Academy credits (4 players)</span><span className="text-teal-400">−{fmt(academyCredits)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Central contract discounts (2 England)</span><span className="text-teal-400">−{fmt(centralDiscounts)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Excluded players (1): Marcus Webb</span><span className="text-gray-500">Designated</span></div>
            <div className="flex justify-between py-2 text-white font-bold"><span>Effective Cap Charge</span><span className="text-purple-400">{fmt(effectiveCharge)}</span></div>
            <div className="flex justify-between py-1"><span className="text-white font-bold">Effective Headroom</span><span className="text-green-400 font-bold">{fmt(effectiveHeadroom)}</span></div>
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Audit Status</div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="py-1.5 border-b border-gray-800/50">Last return submitted: January 2026 ✓</div>
            <div className="py-1.5 border-b border-gray-800/50 text-amber-400">Next return due: May 10, 2026 (34 days)</div>
            <div className="py-1.5 border-b border-gray-800/50">Annual Salary Cap Director audit: July 2026</div>
            <div className="py-1.5 text-green-400 font-medium">Status: NO BREACHES IDENTIFIED</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PLAYER CONTRACTS VIEW ────────────────────────────────────────────────────
function PlayerContractsView() {
  const expiring = SQUAD.filter((p:{contractEnd:string})=>p.contractEnd.includes('2026'));
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📋" title="Player Contracts" subtitle="Full contract database — 38 contracted players." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Expiring This Season" value={expiring.length} sub="Before June 2026" color="red" />
        <StatCard label="Loan Players" value="5" sub="3 in, 2 out" color="blue" />
        <StatCard label="2+ Years Remaining" value="12" color="green" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Player</th><th className="text-left p-3">Position</th><th className="text-left p-3">Contract End</th><th className="text-left p-3">Weekly</th><th className="text-left p-3">Annual</th><th className="text-left p-3">Type</th><th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {SQUAD.map((p:{id:number;name:string;pos:string;contractEnd:string;weeklyWage:number;loan:string;intl:boolean},i:number)=>(
                <tr key={p.id} className={`border-b border-gray-800/50 ${p.contractEnd.includes('2026')?'bg-red-600/5':''}`}>
                  <td className="p-3 text-gray-200 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-400">{p.pos}</td>
                  <td className={`p-3 text-xs ${p.contractEnd.includes('2026')?'text-red-400 font-medium':'text-gray-400'}`}>{p.contractEnd}</td>
                  <td className="p-3 text-gray-300">{fmt(p.weeklyWage)}</td>
                  <td className="p-3 text-gray-300">{fmt(p.weeklyWage*52)}</td>
                  <td className="p-3">{p.loan?<span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">{p.loan.startsWith('in')?'Loan In':'Loan Out'}</span>:p.intl?<span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">Dual</span>:<span className="text-xs text-gray-500">Club</span>}</td>
                  <td className="p-3">{p.contractEnd.includes('2026')?<span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400">Expiring</span>:<span className="text-xs text-green-400">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── SCENARIO MODELLER VIEW ───────────────────────────────────────────────────
function ScenarioModellerView({club}:{club:RugbyClub}) {
  const [wage,setWage]=useState(1500);
  const [signingOn,setSigningOn]=useState(0);
  const [contractYears,setContractYears]=useState(2);
  const annualCharge = (wage*52) + (signingOn/contractYears);
  const newTotal = club.currentSpend + annualCharge;
  const newHeadroom = club.capCeiling - newTotal;
  const newFloorBuffer = newTotal - club.capFloor;

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🧮" title="Scenario Modeller" subtitle="Interactive salary cap scenario planning." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm font-semibold text-white mb-4">Add a Signing</div>
          <div className="space-y-4">
            <div><label className="text-xs text-gray-500 block mb-1">Weekly Wage</label>
              <input type="range" min={500} max={3000} step={50} value={wage} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setWage(Number(e.target.value))} className="w-full" />
              <div className="text-sm text-purple-400 font-bold mt-1">{fmt(wage)}/week</div>
            </div>
            <div><label className="text-xs text-gray-500 block mb-1">Signing On Fee</label>
              <input type="number" value={signingOn} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setSigningOn(Number(e.target.value))} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none" />
            </div>
            <div><label className="text-xs text-gray-500 block mb-1">Contract Length: {contractYears} years</label>
              <input type="range" min={1} max={3} value={contractYears} onChange={(e:React.ChangeEvent<HTMLInputElement>)=>setContractYears(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-sm font-semibold text-white mb-4">Impact Analysis</div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-800/50 text-sm"><span className="text-gray-400">Annual cap charge</span><span className="text-white font-bold">{fmt(annualCharge)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New total spend</span><span className="text-white font-bold">{fmt(newTotal)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New headroom to ceiling</span><span className={`font-bold ${newHeadroom>=0?'text-green-400':'text-red-400'}`}>{fmt(newHeadroom)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New buffer above floor</span><span className={`font-bold ${newFloorBuffer>=0?'text-green-400':'text-red-400'}`}>{fmt(newFloorBuffer)}</span></div>
            <div className="flex justify-between py-2 text-sm"><span className="text-gray-400">Status</span><span className={`font-bold ${newHeadroom>=0&&newFloorBuffer>=0?'text-green-400':'text-red-400'}`}>{newHeadroom>=0&&newFloorBuffer>=0?'COMPLIANT':'BREACH'}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── AUDIT TRAIL VIEW ─────────────────────────────────────────────────────────
function AuditTrailView() {
  const entries: Array<{date:string;type:string;player:string;detail:string;before:string;after:string;by:string}> = [
    {date:'2 Apr',type:'Contract amended',player:'Danny Cole',detail:'Bonus clause added',before:'£2,300/wk',after:'£2,300/wk + £200/win',by:'Caroline Hughes'},
    {date:'28 Mar',type:'Loan in',player:'Jake Rawlings',detail:'Bath Rugby, until 30 Apr',before:'—',after:'£1,200/wk',by:'Steve Whitfield'},
    {date:'15 Mar',type:'New contract',player:'David Obi',detail:'2-year extension',before:'£1,400/wk',after:'£1,700/wk',by:'Steve Whitfield'},
    {date:'1 Mar',type:'Academy credit',player:'Josh White',detail:'U23 academy designation',before:'Full charge',after:'−£12,000 credit',by:'Mark Ellison'},
    {date:'15 Feb',type:'Exclusion applied',player:'Marcus Webb',detail:'Excluded player designation',before:'Full charge',after:'Excluded',by:'RFU Salary Cap Director'},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📜" title="Audit Trail" subtitle="Complete salary cap change log for RFU compliance." />
      <div className="flex justify-end"><button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">Export CSV (RFU format)</button></div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Player</th><th className="text-left p-3">Detail</th><th className="text-left p-3">Before</th><th className="text-left p-3">After</th><th className="text-left p-3">Approved by</th>
            </tr></thead>
            <tbody>
              {entries.map((e:{date:string;type:string;player:string;detail:string;before:string;after:string;by:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-400 text-xs">{e.date}</td><td className="p-3 text-gray-300">{e.type}</td><td className="p-3 text-gray-200">{e.player}</td>
                  <td className="p-3 text-gray-400 text-xs">{e.detail}</td><td className="p-3 text-gray-500 text-xs">{e.before}</td><td className="p-3 text-purple-400 text-xs">{e.after}</td><td className="p-3 text-gray-500 text-xs">{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="text-xs text-gray-600">This export is formatted for submission to the RFU Salary Cap Director annual review. Last exported: January 2026.</div>
    </div>
  );
}

// ─── READINESS SCORE VIEW ─────────────────────────────────────────────────────
function ReadinessScoreView({club}:{club:RugbyClub}) {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏆" title="Franchise Readiness Score" subtitle="Target: 85% by December 2026 to support 2029/30 Expression of Interest." />

      <div className="flex justify-center mb-6">
        <svg viewBox="0 0 160 160" className="w-40 h-40">
          <circle cx="80" cy="80" r="65" fill="none" stroke="#1f2937" strokeWidth="10"/>
          <circle cx="80" cy="80" r="65" fill="none" stroke="#8B5CF6" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(club.franchiseScore/100)*408} 408`} transform="rotate(-90 80 80)"/>
          <text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">{club.franchiseScore}%</text>
          <text x="80" y="92" textAnchor="middle" fill="#6b7280" fontSize="10">Franchise Score</text>
        </svg>
      </div>

      <div className="space-y-4">
        {FRANCHISE_CRITERIA.map((c:{name:string;score:number;status:string;details:string},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3"><div className="text-sm text-white font-semibold">{i+1}. {c.name}</div><StatusPill status={c.status}/></div>
              <div className="text-sm text-purple-400 font-bold">{c.score}%</div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2"><div className={`h-2 rounded-full ${c.status==='GREEN'?'bg-green-500':c.status==='AMBER'?'bg-amber-500':'bg-red-500'}`} style={{width:`${c.score}%`}}></div></div>
            <div className="text-xs text-gray-400">{c.details}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Progress Tracker</div>
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div><div className="text-gray-500">6 months ago</div><div className="text-lg font-bold text-gray-400">61%</div></div>
          <div><div className="text-gray-500">Today</div><div className="text-lg font-bold text-purple-400">{club.franchiseScore}%</div></div>
          <div><div className="text-gray-500">Target (Dec 2026)</div><div className="text-lg font-bold text-teal-400">85%</div></div>
        </div>
      </Card>
    </div>
  );
}

// ─── CRITERIA TRACKER VIEW ────────────────────────────────────────────────────
function CriteriaTrackerView() {
  const actions: Array<{action:string;criterion:string;owner:string;due:string;status:string}> = [
    {action:'Complete investor documentation pack',criterion:'Investment Capacity',owner:'Caroline Hughes',due:'15 May',status:'IN PROGRESS'},
    {action:'Register Women\'s PWR team',criterion:'Women\'s Game',owner:'Rachel Turner',due:'30 April',status:'NOT STARTED — URGENT'},
    {action:'Commission matchday experience assessment',criterion:'Operating Standards',owner:'Steve Whitfield',due:'30 June',status:'NOT STARTED'},
    {action:'Refresh club website to modern standard',criterion:'Operating Standards',owner:'Commercial team',due:'30 June',status:'PLANNED'},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="✅" title="Criteria Tracker" subtitle="Detailed task tracker for each franchise readiness criterion." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Outstanding Actions</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Action</th><th className="text-left p-3">Criterion</th><th className="text-left p-3">Owner</th><th className="text-left p-3">Due</th><th className="text-left p-3">Status</th>
            </tr></thead>
            <tbody>
              {actions.map((a:{action:string;criterion:string;owner:string;due:string;status:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200">{a.action}</td><td className="p-3 text-gray-400 text-xs">{a.criterion}</td><td className="p-3 text-gray-400 text-xs">{a.owner}</td>
                  <td className={`p-3 text-xs ${a.status.includes('URGENT')?'text-red-400 font-medium':'text-gray-400'}`}>{a.due}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${a.status.includes('URGENT')?'bg-red-600/20 text-red-400':a.status==='IN PROGRESS'?'bg-amber-600/20 text-amber-400':'bg-gray-600/20 text-gray-400'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Evidence Vault</div>
        <div className="text-xs text-gray-400">Documents uploaded: 12 | Documents outstanding: 4</div>
      </Card>
    </div>
  );
}

// ─── EXPRESSION OF INTEREST VIEW ──────────────────────────────────────────────
function ExpressionOfInterestView() {
  const sections = ['Club overview and history','Rugby excellence','Operating standards','Financial sustainability','Investment capacity','Community impact','Women\'s game'];
  const complete = [true,true,true,true,false,true,false];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📄" title="Expression of Interest" subtitle="RFU Expansion Review Group — document builder." />
      <Card>
        <div className="text-xs text-gray-400 mb-4">The RFU&apos;s Expansion Review Group will assess clubs against mandatory criteria when expansion to 12 Premiership teams opens in 2029/30. Lumio Rugby builds your Expression of Interest document automatically from your club data.</div>
        <div className="text-sm text-purple-400 font-bold mb-4">{complete.filter(Boolean).length} of {sections.length} sections complete ({Math.round((complete.filter(Boolean).length/sections.length)*100)}%)</div>
        <div className="space-y-2">
          {sections.map((s:string,i:number)=>(
            <div key={i} className={`flex items-center gap-3 py-2 border-b border-gray-800/50 ${!complete[i]?'opacity-60':''}`}>
              <span className={`text-xs ${complete[i]?'text-green-400':'text-red-400'}`}>{complete[i]?'✓':'✗'}</span>
              <span className="text-sm text-gray-300">{i+1}. {s}</span>
              {!complete[i]&&<span className="text-[10px] px-2 py-0.5 rounded bg-red-600/20 text-red-400 ml-auto">Incomplete</span>}
            </div>
          ))}
        </div>
      </Card>
      <button className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30">Generate Draft Document</button>
      <div className="text-xs text-gray-600">Last generated: 3 March 2026</div>
    </div>
  );
}

// ─── GAP ANALYSIS VIEW ────────────────────────────────────────────────────────
function GapAnalysisView() {
  const gaps: Array<{criterion:string;requirement:string;current:string;gap:string;priority:string}> = [
    {criterion:'Rugby Excellence',requirement:'Top 6 + academy output',current:'4th, 4 graduates',gap:'None',priority:'LOW'},
    {criterion:'Operating Standards',requirement:'Full compliance + assessment',current:'Compliant, assessment due',gap:'Matchday assessment',priority:'MEDIUM'},
    {criterion:'Financial Sustainability',requirement:'Break-even + projections',current:'Break-even, 3yr submitted',gap:'None',priority:'LOW'},
    {criterion:'Investment Capacity',requirement:'Full documentation',current:'Incomplete',gap:'Investor pack + due diligence',priority:'HIGH'},
    {criterion:'Community Impact',requirement:'25%+ to grassroots',current:'25.4%',gap:'None',priority:'LOW'},
    {criterion:'Women\'s Game',requirement:'PWR team OR regional plan',current:'Neither submitted',gap:'Registration or plan',priority:'CRITICAL'},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📊" title="Gap Analysis" subtitle="Hartfield RFC today vs RFU threshold requirements." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-3">Criterion</th><th className="text-left p-3">RFU Requirement</th><th className="text-left p-3">Hartfield Today</th><th className="text-left p-3">Gap</th><th className="text-left p-3">Priority</th>
            </tr></thead>
            <tbody>
              {gaps.map((g:{criterion:string;requirement:string;current:string;gap:string;priority:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-3 text-gray-200">{g.criterion}</td><td className="p-3 text-gray-400 text-xs">{g.requirement}</td><td className="p-3 text-gray-300 text-xs">{g.current}</td><td className="p-3 text-gray-400 text-xs">{g.gap}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${g.priority==='CRITICAL'?'bg-red-600/20 text-red-400':g.priority==='HIGH'?'bg-amber-600/20 text-amber-400':g.priority==='MEDIUM'?'bg-blue-600/20 text-blue-400':'bg-green-600/20 text-green-400'}`}>{g.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── SQUAD AVAILABILITY VIEW ──────────────────────────────────────────────────
function SquadAvailabilityView() {
  const avail = SQUAD.filter((p:{status:string})=>p.status==='available');
  const doubt = SQUAD.filter((p:{status:string})=>p.status==='doubtful');
  const unavail = SQUAD.filter((p:{status:string})=>p.status==='unavailable');
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="👥" title="Squad Availability" subtitle={`${avail.length} available, ${doubt.length} doubtful, ${unavail.length} unavailable`} />

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        Next international window: April 27 – May 10. 6 players eligible for call-up.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{title:'Available',players:avail,color:'green'},{title:'Doubtful',players:doubt,color:'amber'},{title:'Unavailable',players:unavail,color:'red'}].map((col:{title:string;players:typeof SQUAD;color:string},ci:number)=>(
          <Card key={ci}>
            <div className={`text-sm font-semibold mb-3 text-${col.color}-400`}>{col.title} ({col.players.length})</div>
            <div className="space-y-2">
              {col.players.map((p:{id:number;name:string;pos:string;reason:string;readiness:number;returnDate:string},i:number)=>(
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
                  <div><div className="text-sm text-white">{p.name}</div><div className="text-xs text-gray-500">{p.pos}{p.reason?` — ${p.reason}`:''}</div></div>
                  <div className="text-right">
                    {p.readiness>0&&<div className={`text-xs font-medium ${p.readiness>=80?'text-green-400':p.readiness>=60?'text-amber-400':'text-red-400'}`}>{p.readiness}%</div>}
                    {p.returnDate&&<div className="text-[10px] text-gray-500">Return: {p.returnDate}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── SELECTION PLANNER VIEW ───────────────────────────────────────────────────
function SelectionPlannerView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📝" title="Selection Planner" subtitle="Visual 15-man selection tool with bench." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Starting XV — vs Jersey Reds (Saturday)</div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[{n:1,name:'Harrison',pos:'LH'},{n:2,name:'Briggs',pos:'HK'},{n:3,name:'Rawlings',pos:'TH'},{n:4,name:'Webb',pos:'LK'},{n:5,name:'Palmer',pos:'LK'},
            {n:6,name:'White',pos:'BF'},{n:7,name:'Foster K.',pos:'OF'},{n:8,name:'TBC',pos:'N8'},{n:9,name:'Grant',pos:'SH'},{n:10,name:'Cole',pos:'FH'},
            {n:11,name:'Patel',pos:'LW'},{n:12,name:'Jones',pos:'IC'},{n:13,name:'Obi',pos:'OC'},{n:14,name:'Taylor',pos:'RW'},{n:15,name:'Barnes',pos:'FB'},
          ].map((p:{n:number;name:string;pos:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3 text-center">
              <div className="text-xs text-purple-400 font-bold">{p.n}</div>
              <div className="text-sm text-white font-medium">{p.name}</div>
              <div className="text-[10px] text-gray-500">{p.pos}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Replacements (16-23)</div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {[{n:16,name:'Sub HK'},{n:17,name:'Sub LH'},{n:18,name:'Sub TH'},{n:19,name:'Sub LK'},{n:20,name:'Sub BF'},{n:21,name:'Sub SH'},{n:22,name:'Sub FH'},{n:23,name:'Sub BK'}].map((p:{n:number;name:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center"><div className="text-xs text-purple-400 font-bold">{p.n}</div><div className="text-[10px] text-gray-400">{p.name}</div></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── INTERNATIONAL DUTY VIEW ──────────────────────────────────────────────────
function InternationalDutyView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🌍" title="International Duty" subtitle="Club-to-country data handoff and return protocols." />
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">Next international window: April 27 – May 10 — 6 players eligible</div>

      <div className="space-y-3">
        {[
          {name:'Danny Foster',team:'England A',status:'Called up ✓',capDiscount:'£17,500',dataSent:true,medicalShared:true},
          {name:'Marcus Webb',team:'England (Senior)',status:'Called up ✓',capDiscount:'£17,500',dataSent:true,medicalShared:true},
          {name:'Tom Harrison',team:'England U23',status:'Standby',capDiscount:'—',dataSent:false,medicalShared:false},
        ].map((p:{name:string;team:string;status:string;capDiscount:string;dataSent:boolean;medicalShared:boolean},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm text-white font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.team}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded ${p.status.includes('✓')?'bg-green-600/20 text-green-400':'bg-amber-600/20 text-amber-400'}`}>{p.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-gray-500">Cap discount: <span className="text-teal-400">{p.capDiscount}</span></div>
              <div className="text-gray-500">Data sent: <span className={p.dataSent?'text-green-400':'text-red-400'}>{p.dataSent?'✓':'✗'}</span></div>
              <div className="text-gray-500">Medical shared: <span className={p.medicalShared?'text-green-400':'text-red-400'}>{p.medicalShared?'✓':'✗'}</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Return Protocol</div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Expected return: May 10</div>
          <div>Post-camp load data requested: ✓</div>
          <div>Post-camp medical clearance required: ✓</div>
          <div className="text-amber-400">Reintegration plan: Not yet drafted — flag to Head Coach</div>
        </div>
      </Card>
    </div>
  );
}

// ─── LOAN MANAGEMENT VIEW ─────────────────────────────────────────────────────
function LoanManagementView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔄" title="Loan Management" subtitle="Incoming and outgoing loan players." />

      <div className="text-sm font-semibold text-white mb-2">Incoming Loans (3)</div>
      <div className="space-y-3">
        {[
          {name:'Jake Rawlings',pos:'Prop',parent:'Bath Rugby',until:'30 April',cap:'£1,200/wk',recall:'7 days notice'},
          {name:'Connor Walsh',pos:'Fly Half',parent:'Bristol Bears',until:'Season end',cap:'£900/wk',recall:'No recall'},
          {name:'Ben Taylor',pos:'Wing',parent:'Exeter Chiefs',until:'Season end',cap:'£800/wk',recall:'No recall'},
        ].map((p:{name:string;pos:string;parent:string;until:string;cap:string;recall:string},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div><div className="text-sm text-white font-medium">{p.name} — {p.pos}</div><div className="text-xs text-gray-500">From: {p.parent} | Until: {p.until} | Cap: {p.cap}</div></div>
              <span className="text-xs text-gray-500">{p.recall}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-sm font-semibold text-white mb-2 mt-6">Outgoing Loans (2)</div>
      <div className="space-y-3">
        {[
          {name:'Phil Dowd',pos:'Prop',to:'Coventry RFC',league:'National League 1',cap:'Retained by Hartfield'},
          {name:'Sam Ellis',pos:'Scrum Half',to:'Doncaster Knights',league:'Champ Rugby',cap:'Split 50/50'},
        ].map((p:{name:string;pos:string;to:string;league:string;cap:string},i:number)=>(
          <Card key={i}>
            <div className="text-sm text-white font-medium">{p.name} — {p.pos}</div>
            <div className="text-xs text-gray-500">To: {p.to} ({p.league}) | Cap charge: {p.cap}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Recall Tracker</div>
        <div className="text-xs text-amber-400">Jake Rawlings — Bath have option to recall with 7 days notice. Last recall threat: January (not exercised). Risk: MEDIUM — Bath injury-hit at prop.</div>
      </Card>
    </div>
  );
}

// ─── SCOUTING PIPELINE VIEW ──────────────────────────────────────────────────
function ScoutingPipelineView() {
  const targets: Array<{name:string;club:string;pos:string;age:number;contractEnds:string;estCap:string;stage:string;agent:string}> = [
    {name:'Marcus Jennings',club:'Jersey Reds',pos:'Openside',age:26,contractEnds:'June 2026',estCap:'£65,000/yr',stage:'In Talks',agent:'Dan Hooper, DHR Sports'},
    {name:'Tom Clarke',club:'Doncaster Knights',pos:'Fly Half',age:24,contractEnds:'June 2026',estCap:'£48,000/yr',stage:'Approached',agent:'Mike Carroll'},
    {name:'Jake Forster',club:'Sale Sharks',pos:'Prop',age:22,contractEnds:'Dual reg available',estCap:'£25,000/yr',stage:'Watching',agent:'—'},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔍" title="Scouting Pipeline" subtitle="Full recruitment pipeline with cap integration." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pipeline Total" value="12" sub="Across all stages" color="purple" />
        <StatCard label="In Talks" value="1" sub="Marcus Jennings" color="orange" />
        <StatCard label="Position Gaps" value="2" sub="Openside, Cover FH" color="red" />
      </div>

      <div className="space-y-3">
        {targets.map((t:{name:string;club:string;pos:string;age:number;contractEnds:string;estCap:string;stage:string;agent:string},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm text-white font-medium">{t.name}</div><div className="text-xs text-gray-500">{t.club} | {t.pos} | Age {t.age} | Contract: {t.contractEnds}</div></div>
              <span className={`text-xs px-2 py-0.5 rounded ${t.stage==='In Talks'?'bg-green-600/20 text-green-400':t.stage==='Approached'?'bg-amber-600/20 text-amber-400':'bg-gray-600/20 text-gray-400'}`}>{t.stage}</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>Est. cap: {t.estCap}</span><span>Agent: {t.agent}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── CAP IMPACT MODELLER VIEW ─────────────────────────────────────────────────
function CapImpactModellerView({club}:{club:RugbyClub}) {
  const [selectedTarget]=useState('Marcus Jennings');
  const proposedCap = 71500;
  const newSpend = club.currentSpend + proposedCap;
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💷" title="Cap Impact Modeller" subtitle="Sign a candidate and see cap impact immediately." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Modelling: {selectedTarget}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className="text-gray-500">Weekly wage</div><div className="text-white font-bold">£1,250</div></div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className="text-gray-500">Contract</div><div className="text-white font-bold">2 years</div></div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className="text-gray-500">Signing on</div><div className="text-white font-bold">£5,000</div></div>
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className="text-gray-500">Est. bonuses</div><div className="text-white font-bold">£4,000/yr</div></div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between py-1.5 border-b border-gray-800/50 text-sm"><span className="text-gray-400">Annual cap charge</span><span className="text-white font-bold">{fmt(proposedCap)}</span></div>
          <div className="flex justify-between py-1.5 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New total spend</span><span className="text-white font-bold">{fmt(newSpend)}</span></div>
          <div className="flex justify-between py-1.5 border-b border-gray-800/50 text-sm"><span className="text-gray-400">New headroom</span><span className="text-green-400 font-bold">{fmt(club.capCeiling - newSpend)}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-gray-400">Status</span><span className="text-green-400 font-bold">COMPLIANT — GREEN</span></div>
        </div>
      </Card>
    </div>
  );
}

// ─── AGENT CONTACTS VIEW ──────────────────────────────────────────────────────
function AgentContactsView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📞" title="Agent Contacts" subtitle="Agent database and active negotiations." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Active Negotiations</div>
        <div className="space-y-3">
          {[
            {agent:'Dan Hooper',agency:'DHR Sports',player:'Marcus Jennings',lastContact:'2 April',note:'Jennings interested, wants contract offer by April 15'},
            {agent:'Mike Carroll',agency:'Carroll Sports',player:'Tom Clarke',lastContact:'28 March',note:'Exploring options, not committed'},
          ].map((a:{agent:string;agency:string;player:string;lastContact:string;note:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1"><div className="text-sm text-white font-medium">{a.agent} — {a.agency}</div><span className="text-xs text-gray-500">Last: {a.lastContact}</span></div>
              <div className="text-xs text-gray-400">Player: {a.player} — &quot;{a.note}&quot;</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── TARGETS SHORTLIST VIEW ───────────────────────────────────────────────────
function TargetsShortlistView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🎯" title="Targets Shortlist" subtitle="Director of Rugby priority target board." />
      {[
        {pos:'Openside Flanker',priority:'URGENT',reason:'Only 1 specialist in squad',targets:['Marcus Jennings (Jersey Reds, in talks)','Jake Forster (Sale, watching)']},
        {pos:'Cover Fly Half',priority:'MEDIUM',reason:'Connor Walsh loan ends April 30',targets:['Tom Clarke (Doncaster, approached)']},
      ].map((g:{pos:string;priority:string;reason:string;targets:string[]},i:number)=>(
        <Card key={i}>
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-white font-semibold">{g.pos}</div><span className={`text-xs px-2 py-0.5 rounded ${g.priority==='URGENT'?'bg-red-600/20 text-red-400':'bg-amber-600/20 text-amber-400'}`}>{g.priority}</span></div>
          <div className="text-xs text-gray-400 mb-2">{g.reason}</div>
          <div className="space-y-1">{g.targets.map((t:string,j:number)=>(<div key={j} className="text-xs text-gray-300">• {t}</div>))}</div>
        </Card>
      ))}
    </div>
  );
}

// ─── CONCUSSION & HIA TRACKER VIEW ───────────────────────────────────────────
function ConcussionHIAView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🧠" title="Concussion & HIA Tracker" subtitle="Head Injury Assessment protocol management." />

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        This module is a documentation and compliance tool. It records protocols followed, not medical advice. All return-to-play decisions are made by qualified medical professionals. Lumio Rugby accepts no medical liability.
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Active Cases (1)</div>
        <div className="bg-red-600/5 border border-red-600/30 rounded-lg p-4">
          <div className="text-sm text-white font-medium mb-1">Danny Foster — HIA initiated 29 March vs Ealing (Round 15)</div>
          <div className="text-xs text-gray-400 mb-3">Stage: HIA2 — Day 8 of 21-day minimum protocol</div>
          <div className="space-y-1.5">
            {[
              {step:'HIA1 (match day assessment)',status:'COMPLETE',date:'29 March'},
              {step:'HIA2 (48-hour follow up)',status:'COMPLETE',date:'31 March'},
              {step:'Rest and symptom monitoring',status:'IN PROGRESS',date:'Day 8'},
              {step:'Light exercise introduction',status:'PENDING',date:'From Day 14'},
              {step:'Full non-contact training',status:'PENDING',date:'From Day 18'},
              {step:'Return to full contact',status:'PENDING',date:'Requires medical clearance'},
              {step:'Independent doctor clearance',status:'PENDING',date:'Required'},
            ].map((s:{step:string;status:string;date:string},i:number)=>(
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status==='COMPLETE'?'bg-green-500':s.status==='IN PROGRESS'?'bg-amber-500':'bg-gray-600'}`}></span>
                <span className={`flex-1 ${s.status==='COMPLETE'?'text-gray-500 line-through':'text-gray-300'}`}>{s.step}</span>
                <span className="text-gray-500">{s.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">Last assessment: 3 April — Dr. Marsh — &quot;progressing within protocol&quot;</div>
          <div className="text-xs text-gray-500">Next assessment: 7 April — baseline cognitive test</div>
          <div className="text-xs text-amber-400 mt-1">Estimated return: 19 April (subject to clearance)</div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Cumulative Threshold Tracker</div>
        <div className="text-xs text-green-400">Players approaching 3+ HIAs in rolling 12 months: 0</div>
      </Card>
    </div>
  );
}

// ─── RETURN TO PLAY VIEW ──────────────────────────────────────────────────────
function ReturnToPlayView() {
  const rtpPlayers: Array<{name:string;injury:string;week:string;expected:string;phase:string;cleared:boolean}> = [
    {name:'Danny Foster',injury:'Concussion protocol',week:'Day 8 of 21+',expected:'19 April',phase:'Rest and symptom monitoring',cleared:false},
    {name:'Ryan Patel',injury:'Hamstring (Grade 2)',week:'Week 3 of 5',expected:'18 April',phase:'Pool running and progressive loading',cleared:false},
    {name:'Karl Briggs',injury:'Shoulder (post-op)',week:'Week 8 of 12',expected:'2 May',phase:'Full gym, non-contact skills',cleared:false},
  ];
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏥" title="Return to Play" subtitle="All players on return-to-play protocols." />
      <div className="space-y-3">
        {rtpPlayers.map((p:{name:string;injury:string;week:string;expected:string;phase:string;cleared:boolean},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm text-white font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.injury}</div></div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">{p.week}</span>
            </div>
            <div className="text-xs text-gray-400">Phase: {p.phase}</div>
            <div className="text-xs text-gray-500 mt-1">Expected return: {p.expected}</div>
            <div className="text-xs mt-1">{p.cleared?<span className="text-green-400">✓ Cleared for selection</span>:<span className="text-red-400">✗ Not cleared</span>}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── MEDICAL RECORDS VIEW ─────────────────────────────────────────────────────
function MedicalRecordsView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📂" title="Medical Records" subtitle="Role-gated — Director of Rugby and Head of Medical only." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Player Medical History</div>
        <div className="text-xs text-gray-400 mb-4">Select a player to view full career medical log, HIA history, pre-season clearance, and baseline assessments.</div>
        <select className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-purple-500 focus:outline-none">
          <option>Select player...</option>
          {SQUAD.map((p:{id:number;name:string})=>(<option key={p.id}>{p.name}</option>))}
        </select>
      </Card>
      <div className="flex justify-end"><button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">Export for RFU regulatory review</button></div>
    </div>
  );
}

// ─── WELFARE AUDIT VIEW ───────────────────────────────────────────────────────
function WelfareAuditView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🛡️" title="Welfare Audit" subtitle="Annual welfare compliance checklist for RFU requirements." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Champ Rugby Welfare Requirements</div>
        <div className="space-y-2">
          {[
            {item:'DBS checks — all staff and volunteers: 47/47',done:true},
            {item:'Welfare officer appointed and DBS cleared',done:true},
            {item:'Safeguarding policy published (Updated March 2026)',done:true},
            {item:'Concussion education programme: 38/38 players',done:true},
            {item:'Annual medical screenings: 36/38',done:false},
            {item:'Player welfare questionnaires current (Kitman Labs)',done:true},
            {item:'Mental health first aider on staff',done:true},
          ].map((c:{item:string;done:boolean},i:number)=>(
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-sm">
              <span className={`text-xs ${c.done?'text-green-400':'text-amber-400'}`}>{c.done?'✓':'⚠'}</span>
              <span className={c.done?'text-gray-400':'text-amber-400'}>{c.item}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Outstanding (2)</div>
        <div className="text-xs text-amber-400">Annual medical screening outstanding for: Danny Foster, Ryan Patel (deferred — current injury). Schedule on return to full training.</div>
      </Card>
      <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">Download welfare audit summary (RFU)</button>
    </div>
  );
}

// ─── SPONSORSHIP PIPELINE VIEW ────────────────────────────────────────────────
function SponsorshipPipelineView() {
  const totalActive = SPONSORS.reduce((a:number,s:{value:number})=>a+s.value,0);
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤝" title="Sponsorship Pipeline" subtitle="Commercial CRM — Director of Commercial." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Secured" value={fmt(totalActive)} sub={`${SPONSORS.length} active sponsors`} color="green" />
        <StatCard label="Pipeline" value="£43,000" sub="2 prospects" color="orange" />
        <StatCard label="Target" value="£225,000" color="purple" />
        <StatCard label="Gap" value="£10,000" sub="5% remaining" color="red" />
      </div>

      <div className="space-y-3">
        {SPONSORS.map((s:{name:string;type:string;value:number;renewal:string;status:string;obligations:string},i:number)=>(
          <Card key={i}>
            <div className="flex items-center justify-between mb-2">
              <div><div className="text-sm text-white font-medium">{s.name}</div><div className="text-xs text-gray-500">{s.type} — {fmt(s.value)}/yr</div></div>
              <span className="text-xs text-gray-500">Renewal: {s.renewal}</span>
            </div>
            <div className="text-xs text-gray-400">{s.obligations}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Pipeline — Prospects</div>
        <div className="space-y-2">
          {[{name:'West Country Energy',type:'Kit sleeve',est:'£28,000',stage:'Meeting scheduled'},{name:'Hatton Recruitment',type:'Community',est:'£15,000',stage:'Proposal sent'}].map((p:{name:string;type:string;est:string;stage:string},i:number)=>(
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-sm">
              <div><span className="text-gray-200">{p.name}</span> <span className="text-xs text-gray-500">— {p.type} — est. {p.est}</span></div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">{p.stage}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── MATCHDAY REVENUE VIEW ────────────────────────────────────────────────────
function MatchdayRevenueView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💰" title="Matchday Revenue" subtitle="Revenue tracking per fixture — 2025/26 season." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Gate Receipts" value="£142,000" sub="17 home games" color="purple" />
        <StatCard label="Bar & Catering" value="£89,000" color="teal" />
        <StatCard label="Hospitality" value="£68,000" sub="12 boxes" color="orange" />
        <StatCard label="Total Matchday" value="£374,000" sub="Target: £400k" color="green" />
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Jersey Reds (Next Home) — Projected</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[{l:'Attendance',v:'2,800'},{l:'Gate',v:'£8,400'},{l:'Bar',v:'£4,200'},{l:'Hospitality',v:'£12,000'}].map((s:{l:string;v:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center"><div className="text-white font-bold">{s.v}</div><div className="text-gray-500 mt-0.5">{s.l}</div></div>
          ))}
        </div>
        <div className="text-xs text-purple-400 font-medium mt-3">Projected total: £24,600</div>
      </Card>
    </div>
  );
}

// ─── STADIUM & VENUE VIEW ─────────────────────────────────────────────────────
function StadiumVenueView({club}:{club:RugbyClub}) {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏟️" title="Stadium & Venue" subtitle={`${club.stadium} — Capacity ${club.capacity.toLocaleString()}`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Standing" value="1,800" color="purple" />
        <StatCard label="Seated" value="3,000" color="teal" />
        <StatCard label="Hospitality Boxes" value="12" color="orange" />
        <StatCard label="Conference" value="150" sub="Function room" color="blue" />
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Events — Next 30 Days</div>
        <div className="space-y-2">
          {[
            {date:'11 Apr',event:'Champ Rugby vs Jersey Reds',type:'Fixture'},
            {date:'15 Apr',event:'Corporate conference — 80 delegates — £4,500',type:'Commercial'},
            {date:'18 Apr',event:'School rugby festival — 240 children',type:'Community'},
            {date:'25 Apr',event:'Business networking — 60 guests — £1,800',type:'Commercial'},
            {date:'3 May',event:'Hartfield Building Society hospitality — 40 guests',type:'Sponsor'},
          ].map((e:{date:string;event:string;type:string},i:number)=>(
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <span className="text-xs text-purple-400 font-medium w-14">{e.date}</span>
              <span className="text-sm text-gray-300 flex-1">{e.event}</span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{e.type}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Ground Grading</div>
        <div className="text-xs text-green-400">Step 2 compliant ✓ — Last inspection: Sep 2025 — Next: Sep 2026</div>
      </Card>
    </div>
  );
}

// ─── PARTNERSHIP ACTIVATION VIEW ──────────────────────────────────────────────
function PartnershipActivationView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🎯" title="Partnership Activation" subtitle="Tracking sponsor obligation fulfilment." />
      <Card className="border-red-600/30">
        <div className="text-sm font-semibold text-red-400 mb-2">Overdue (1)</div>
        <div className="text-xs text-gray-300">Hartfield Building Society — Monthly player video (March) — Due: 31 March — <span className="text-red-400 font-medium">OVERDUE</span></div>
        <div className="text-xs text-gray-500 mt-1">Action: Arrange with Danny Cole this week</div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Upcoming This Month</div>
        <div className="space-y-2">
          {[
            {sponsor:'Hartfield Motors',obligation:'Player appearance (Karl Foster)',due:'20 April'},
            {sponsor:'County Council',obligation:'Community match programme Q4 report',due:'30 April'},
            {sponsor:'Smith & Sons',obligation:'Social media mention for new development',due:'15 April'},
          ].map((o:{sponsor:string;obligation:string;due:string},i:number)=>(
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
              <div><span className="text-gray-200">{o.sponsor}</span> — <span className="text-gray-400">{o.obligation}</span></div>
              <span className="text-gray-500">{o.due}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Partnership Health</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-center">
          {[{l:'Met (season)',v:'34',c:'text-green-400'},{l:'Late (resolved)',v:'3',c:'text-amber-400'},{l:'Overdue',v:'1',c:'text-red-400'},{l:'Renewals initiated',v:'1/3',c:'text-purple-400'}].map((s:{l:string;v:string;c:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2"><div className={`font-bold text-lg ${s.c}`}>{s.v}</div><div className="text-gray-500 mt-0.5">{s.l}</div></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── WOMEN'S SQUAD VIEW ───────────────────────────────────────────────────────
function WomensSquadView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="⭐" title="Women's Squad" subtitle="Women's programme management — Rachel Turner." />
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-sm text-red-400">
        <span className="font-bold">PWR REGISTRATION OUTSTANDING</span> — Required for franchise readiness. Alternative: regional development plan must be submitted by 30 April.
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Current Women&apos;s Programme</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[{l:'Players',v:'28'},{l:'League',v:'South West'},{l:'Record',v:'7W 3L (4th)'},{l:'Training',v:'Tue & Thu'}].map((s:{l:string;v:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2 text-center"><div className="text-white font-bold">{s.v}</div><div className="text-gray-500 mt-0.5">{s.l}</div></div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">PWR Registration Options</div>
        <div className="space-y-3">
          <div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3">
            <div className="text-sm text-white font-medium">Option A: Register for PWR</div>
            <div className="text-xs text-gray-400">Est. cost £120,000/yr — requires full-time head coach, physio, enhanced facilities</div>
          </div>
          <div className="bg-[#0a0c14] border border-purple-600/30 rounded-lg p-3">
            <div className="text-sm text-purple-400 font-medium">Option B: Regional Development Plan ← Being pursued</div>
            <div className="text-xs text-gray-400">Min investment £30,000, programme targets, report schedule. Plan being drafted — Rachel Turner.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── PWR COMPLIANCE VIEW ──────────────────────────────────────────────────────
function PWRComplianceView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📋" title="PWR Compliance" subtitle="Regional Development Plan — Option B." />
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 text-xs text-red-400 font-medium">Deadline: 30 April 2026 (24 days)</div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Plan Requirements (RFU Checklist)</div>
        <div className="space-y-2">
          {[
            {item:'Written plan submitted to RFU Women\'s Game department',status:'NOT SUBMITTED'},
            {item:'Minimum investment commitment documented',status:'IN PROGRESS'},
            {item:'Annual programme targets defined',status:'IN PROGRESS'},
            {item:'Reporting schedule confirmed',status:'NOT STARTED'},
            {item:'Named lead contact at club',status:'COMPLETE'},
          ].map((c:{item:string;status:string},i:number)=>(
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-sm">
              <span className={`text-xs ${c.status==='COMPLETE'?'text-green-400':c.status.includes('PROGRESS')?'text-amber-400':'text-red-400'}`}>{c.status==='COMPLETE'?'✓':c.status.includes('PROGRESS')?'◐':'☐'}</span>
              <span className="text-gray-300 flex-1">{c.item}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded ${c.status==='COMPLETE'?'bg-green-600/20 text-green-400':c.status.includes('PROGRESS')?'bg-amber-600/20 text-amber-400':'bg-red-600/20 text-red-400'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-white mb-2">Actions</div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Rachel Turner to complete development plan draft by 15 April</div>
          <div>Caroline Hughes to review and approve budget commitment by 18 April</div>
          <div>Submit to RFU Women&apos;s Game by 30 April</div>
        </div>
      </Card>
    </div>
  );
}

// ─── SHARED FACILITIES VIEW ───────────────────────────────────────────────────
function SharedFacilitiesView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏢" title="Shared Facilities" subtitle="Men's and women's programme facility schedule." />
      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-400">
        Conflict detected: Thursday 9 April — Women&apos;s training (6pm) and Men&apos;s pre-match walkthrough (6pm) — BOTH on Pitch 1 — RESOLVE
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Weekly Facility Timetable</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-gray-500 border-b border-gray-800 bg-gray-900/30">
              <th className="text-left p-2">Time</th><th className="p-2">Mon</th><th className="p-2">Tue</th><th className="p-2">Wed</th><th className="p-2">Thu</th><th className="p-2">Fri</th><th className="p-2">Sat</th>
            </tr></thead>
            <tbody>
              {[
                {time:'9am–12pm',mon:'Men\'s 1st XV',tue:'Men\'s 1st XV',wed:'REST',thu:'Men\'s walkthrough',fri:'Captain\'s Run',sat:'MATCH DAY'},
                {time:'2pm–4pm',mon:'Academy',tue:'Academy',wed:'—',thu:'Academy',fri:'—',sat:'—'},
                {time:'6pm–8pm',mon:'Women\'s',tue:'Women\'s',wed:'—',thu:'Women\'s ⚠',fri:'—',sat:'—'},
              ].map((r:{time:string;mon:string;tue:string;wed:string;thu:string;fri:string;sat:string},i:number)=>(
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="p-2 text-gray-400 font-medium">{r.time}</td>
                  <td className="p-2 text-purple-400">{r.mon}</td><td className="p-2 text-purple-400">{r.tue}</td><td className="p-2 text-gray-600">{r.wed}</td>
                  <td className={`p-2 ${r.thu.includes('⚠')?'text-amber-400':'text-purple-400'}`}>{r.thu}</td>
                  <td className="p-2 text-purple-400">{r.fri}</td><td className="p-2 text-purple-400">{r.sat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── WOMEN'S COMMERCIAL VIEW ──────────────────────────────────────────────────
function WomensCommercialView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="💼" title="Women's Commercial" subtitle="Target: build to self-sustaining by Year 2." />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Current Income" value="£0" sub="Costs shared with men's" color="red" />
        <StatCard label="Budget Allocation" value="£30,000" sub="Board approved" color="purple" />
        <StatCard label="Pipeline" value="£10,000" sub="2 prospects" color="orange" />
      </div>
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Pipeline</div>
        <div className="space-y-2">
          {[{name:'West Country Energy',type:'Women\'s shirt sponsor',est:'£8,000',stage:'Meeting arranged'},{name:'Local solicitor',type:'Matchday programme',est:'£2,000',stage:'Approached'}].map((p:{name:string;type:string;est:string;stage:string},i:number)=>(
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 text-xs">
              <div><span className="text-gray-200">{p.name}</span> — <span className="text-gray-400">{p.type} — est. {p.est}</span></div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">{p.stage}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── AI MORNING BRIEFING VIEW ─────────────────────────────────────────────────
function AIBriefingView({club}:{club:RugbyClub}) {
  const [briefing,setBriefing]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [role,setRole]=useState<'dor'|'coach'|'ceo'|'medical'>('dor');

  const generate = async () => {
    setLoading(true);
    const rolePrompts: Record<string,string> = {
      dor:'Director of Rugby briefing — full overview including squad, cap, franchise, recruitment, compliance',
      coach:'Head Coach briefing — squad readiness focus, no commercial or financial detail',
      ceo:'CEO briefing — financial, franchise readiness, commercial obligations only',
      medical:'Head of Medical briefing — welfare, HIA, RTP, medical screening focus',
    };
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY||'','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,messages:[{role:'user',content:`Generate a ${rolePrompts[role]} for ${club.name} (${club.league}). Squad: 31/38 available, 1 HIA active, next match vs Jersey Reds Saturday. Cap: £2.34M of £2.8M. Franchise: 71%. Be concise and professional.`}]}),
      });
      const data = await res.json();
      setBriefing(data.content?.[0]?.text||'Generation failed.');
    } catch { setBriefing('Error connecting to AI service.'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤖" title="AI Morning Briefing" subtitle="Role-specific daily intelligence." />
      <div className="flex gap-1 bg-[#0d1117] border border-gray-800 rounded-lg p-1 w-fit">
        {([['dor','Director of Rugby'],['coach','Head Coach'],['ceo','CEO'],['medical','Head of Medical']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>{setRole(id as typeof role);setBriefing(null);}} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${role===id?'bg-purple-600/20 text-purple-400 border border-purple-600/30':'text-gray-500 hover:text-gray-300'}`}>{label}</button>
        ))}
      </div>
      <button onClick={generate} disabled={loading} className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30 disabled:opacity-50">
        {loading?'Generating...':'Generate Briefing'}
      </button>
      {loading&&<Card><div className="flex items-center gap-2 text-xs text-purple-400"><div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>Generating...</div></Card>}
      {briefing&&!loading&&<Card><div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{briefing}</div></Card>}
    </div>
  );
}

// ─── CLUB-TO-COUNTRY VIEW ─────────────────────────────────────────────────────
function ClubToCountryView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🏴󠁧󠁢󠁥󠁮󠁧󠁿" title="Club-to-Country" subtitle="International data interface and return protocols." />
      <Card>
        <div className="text-sm font-semibold text-white mb-3">Current Call-Ups</div>
        <div className="space-y-3">
          {[
            {name:'Danny Foster',team:'England Saxons',dataSent:true,medicalSent:true,returnExp:'May 11',capDiscount:'£17,500'},
            {name:'Marcus Webb',team:'England (Senior)',dataSent:true,medicalSent:true,returnExp:'May 10',capDiscount:'£17,500'},
          ].map((p:{name:string;team:string;dataSent:boolean;medicalSent:boolean;returnExp:string;capDiscount:string},i:number)=>(
            <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2"><div className="text-sm text-white font-medium">{p.name} — {p.team}</div><span className="text-xs text-teal-400">Cap discount: {p.capDiscount}</span></div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div>Data sent: <span className="text-green-400">✓ AUTO-SYNC</span></div>
                <div>Medical shared: <span className="text-green-400">✓</span></div>
                <div>Return expected: {p.returnExp}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── OPPOSITION ANALYSIS VIEW ─────────────────────────────────────────────────
function OppositionAnalysisView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🔎" title="Opposition Analysis" subtitle="Jersey Reds — Champ Rugby — Position: 6th." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pts Scored (avg)" value="22.4" sub="League avg: 26.1" color="orange" />
        <StatCard label="Pts Conceded" value="19.6" color="teal" />
        <StatCard label="Lineout" value="88%" sub="Strong" color="green" />
        <StatCard label="Scrum" value="62%" sub="Weak" color="red" />
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Key Threats</div>
        <div className="space-y-2">
          {[
            {name:'Charlie Morris',pos:'Openside',stat:'9 turnovers last 3 games, 8.2km/game'},
            {name:'Ben Hawkins',pos:'Fly Half',stat:'81% territory exit success, kicking game'},
            {name:'Josh Fairley',pos:'Hooker',stat:'95% lineout accuracy from his throws'},
          ].map((p:{name:string;pos:string;stat:string},i:number)=>(
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[10px] font-bold text-purple-400">{p.name.split(' ').map((w:string)=>w[0]).join('')}</div>
              <div><div className="text-sm text-white">{p.name} — {p.pos}</div><div className="text-xs text-gray-400">{p.stat}</div></div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-white mb-2">Tactical Notes (Head Coach)</div>
        <div className="text-xs text-gray-400 leading-relaxed">
          &quot;Attack their scrum early — 4 scrum penalties in last 3 games. Wingers compete for high ball — Hawkins kicks long to left channel 60% of the time. Charlie Morris must be neutralised at breakdown — Danny Cole to direct traffic away from his side.&quot;
        </div>
      </Card>
    </div>
  );
}

// ─── INDUSTRY NEWS VIEW ───────────────────────────────────────────────────────
function IndustryNewsView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📰" title="Industry News" subtitle="Rugby news relevant to Hartfield RFC." />
      <div className="space-y-3">
        {[
          {headline:'Premiership franchise readiness criteria published in full',body:'The RFU\'s Expansion Review Group has released the formal assessment framework for the 2029/30 expansion to 12 Premiership teams.',note:'Franchise readiness tracker showing 71% — action needed'},
          {headline:'Salary cap floor enforced from 2026/27 — two clubs warned',body:'Premiership Rugby has formally notified two clubs that their current squad spend is below the new £5.4M minimum spend floor.',note:'Cap floor indicator: Hartfield £440,000 above floor — compliant'},
          {headline:'Kitman Labs expands Championship partnership',body:'Kitman Labs has confirmed its expansion of the RFU partnership to include all Championship clubs from 2025/26.',note:'Lumio Rugby integration: Kitman Labs data feed active ✓'},
          {headline:'World Rugby updates HIA protocol for 2026/27',body:'World Rugby has announced updates to the Head Injury Assessment protocol effective from July 2026.',note:'HIA tracker: 1 active case — Danny Foster, Day 8 of protocol'},
        ].map((n:{headline:string;body:string;note:string},i:number)=>(
          <Card key={i}>
            <div className="text-sm text-white font-semibold mb-1">{n.headline}</div>
            <div className="text-xs text-gray-400 mb-2">{n.body}</div>
            <div className="text-xs text-purple-400 bg-purple-600/10 border border-purple-600/20 rounded-lg p-2">{n.note}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── GPS & LOAD VIEW ──────────────────────────────────────────────────────────
const GPS_DATA = [
  { name: 'Danny Foley',  pos: 'No.8',       dist: 12.4, hi: 1240, sprints: 28, maxSpeed: 32.1, acwr: 1.38, status: 'overload' as const },
  { name: 'Tom Harrison', pos: 'Prop',       dist: 10.8, hi:  720, sprints: 14, maxSpeed: 27.8, acwr: 0.94, status: 'optimal'  as const },
  { name: 'Marcus Webb',  pos: 'Lock',       dist: 11.6, hi:  880, sprints: 18, maxSpeed: 29.2, acwr: 1.12, status: 'optimal'  as const },
  { name: 'Karl Foster',  pos: 'Flanker',    dist: 12.1, hi: 1080, sprints: 24, maxSpeed: 30.5, acwr: 1.44, status: 'manage'   as const },
  { name: 'Sam Ellis',    pos: 'Scrum Half', dist: 11.2, hi:  940, sprints: 22, maxSpeed: 31.4, acwr: 1.08, status: 'optimal'  as const },
  { name: 'Danny Cole',   pos: 'Fly Half',   dist:  9.8, hi:  680, sprints: 16, maxSpeed: 29.6, acwr: 0.78, status: 'underload' as const },
  { name: 'Matt Jones',   pos: 'Centre',     dist: 11.9, hi:  960, sprints: 21, maxSpeed: 30.8, acwr: 1.16, status: 'optimal'  as const },
  { name: 'Luke Barnes',  pos: 'Fullback',   dist: 12.3, hi: 1120, sprints: 26, maxSpeed: 31.9, acwr: 1.52, status: 'overload' as const },
]

function GPSLoadView() {
  const ready    = GPS_DATA.filter(p => p.status === 'optimal').length
  const manage   = GPS_DATA.filter(p => p.status === 'manage').length
  const rest     = GPS_DATA.filter(p => p.status === 'overload').length
  const underlod = GPS_DATA.filter(p => p.status === 'underload').length
  const flagged  = GPS_DATA.filter(p => p.acwr > 1.5)
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📡" title="GPS & Load" subtitle="Catapult + STATSports feeds — team ACWR readiness this week" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-400">{ready}</div>
          <div className="text-xs text-gray-400 mt-1">Ready (optimal)</div>
        </div>
        <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-400">{manage}</div>
          <div className="text-xs text-gray-400 mt-1">Manage</div>
        </div>
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-red-400">{rest}</div>
          <div className="text-xs text-gray-400 mt-1">Rest (overload)</div>
        </div>
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">{underlod}</div>
          <div className="text-xs text-gray-400 mt-1">Underload</div>
        </div>
      </div>

      {flagged.length > 0 && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-sm text-red-300">
          ⚠ Injury risk — {flagged.length} player{flagged.length > 1 ? 's' : ''} with ACWR &gt; 1.5: {flagged.map(p => p.name).join(', ')}. Recommend reduced loading Tuesday–Wednesday.
        </div>
      )}

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Per-player GPS (this week)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 font-medium">Player</th>
                <th className="text-left py-2 font-medium">Position</th>
                <th className="text-right py-2 font-medium">Distance (km)</th>
                <th className="text-right py-2 font-medium">HI Running (m)</th>
                <th className="text-right py-2 font-medium">Sprints</th>
                <th className="text-right py-2 font-medium">Max Speed (km/h)</th>
                <th className="text-right py-2 font-medium">ACWR</th>
                <th className="text-right py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {GPS_DATA.map((p, i) => {
                const colour = p.status === 'optimal' ? 'text-green-400' : p.status === 'manage' ? 'text-amber-400' : p.status === 'overload' ? 'text-red-400' : 'text-blue-400'
                const label  = p.status === 'optimal' ? 'Ready' : p.status === 'manage' ? 'Manage' : p.status === 'overload' ? 'Rest' : 'Underload'
                return (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-2 text-white">{p.name}</td>
                    <td className="py-2 text-gray-400">{p.pos}</td>
                    <td className="py-2 text-right text-gray-200">{p.dist.toFixed(1)}</td>
                    <td className="py-2 text-right text-gray-200">{p.hi}</td>
                    <td className="py-2 text-right text-gray-200">{p.sprints}</td>
                    <td className="py-2 text-right text-gray-200">{p.maxSpeed.toFixed(1)}</td>
                    <td className={`py-2 text-right font-semibold ${p.acwr > 1.5 ? 'text-red-400' : p.acwr > 1.3 ? 'text-amber-400' : p.acwr < 0.8 ? 'text-blue-400' : 'text-green-400'}`}>{p.acwr.toFixed(2)}</td>
                    <td className={`py-2 text-right font-semibold ${colour}`}>{label}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Session comparison — team avg</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Distance / player</span>
              <span className="text-white font-medium">11.5 km <span className="text-green-400 ml-2">+4% vs last week</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">HI running / player</span>
              <span className="text-white font-medium">953 m <span className="text-green-400 ml-2">+7%</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Sprints / player</span>
              <span className="text-white font-medium">21 <span className="text-amber-400 ml-2">+12%</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-gray-400">Team ACWR</span>
              <span className="text-white font-medium">1.18 <span className="text-amber-400 ml-2">trending up</span></span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold text-white mb-3">Integrations</div>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs hover:border-purple-500/50">
              <span className="text-white">Catapult OpenField</span>
              <span className="text-green-400">● Connected</span>
            </button>
            <button className="w-full flex items-center justify-between bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs hover:border-purple-500/50">
              <span className="text-white">STATSports Sonra</span>
              <span className="text-gray-500">Connect</span>
            </button>
            <button className="w-full flex items-center justify-between bg-[#0a0c14] border border-gray-800 rounded-lg px-3 py-2 text-xs hover:border-purple-500/50">
              <span className="text-white">Polar Team Pro</span>
              <span className="text-gray-500">Connect</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── VIDEO ANALYSIS VIEW ──────────────────────────────────────────────────────
const VIDEO_CLIPS = [
  { id: 1, title: 'Opposition — Bath RFC (attack shapes)', category: 'Opposition',  duration: '18:42', date: '8 Apr',  tags: ['Bath', 'Attack', 'Phase play'], notes: 'Look for their 10-12 loop after 3 phases — key attacking shape.' },
  { id: 2, title: 'Training — Lineout patterns session',    category: 'Training',    duration: '24:10', date: '7 Apr',  tags: ['Lineout', 'Set piece'],        notes: 'New front-ball option for #2 — discuss Friday.' },
  { id: 3, title: 'Match review — Saracens (full)',         category: 'Match',       duration: '1:14:30', date: '5 Apr', tags: ['Saracens', 'Full match'],     notes: 'Second-half defence let us down between 60–70.' },
  { id: 4, title: 'Set piece — attacking maul drive',       category: 'Training',    duration: '11:05', date: '4 Apr',  tags: ['Maul', 'Attack'],              notes: 'Foley cleanout technique — teach to the front row.' },
  { id: 5, title: 'Individual — Foley breakdown technique', category: 'Individual',  duration: '9:22',  date: '3 Apr',  tags: ['Foley', 'Breakdown'],          notes: 'Body height is excellent — share as coaching clip.' },
]

function VideoAnalysisView() {
  const [filter, setFilter] = useState<string>('All')
  const categories = ['All', 'Match', 'Training', 'Opposition', 'Individual']
  const filtered = filter === 'All' ? VIDEO_CLIPS : VIDEO_CLIPS.filter(c => c.category === filter)
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🎬" title="Video Analysis" subtitle={`${VIDEO_CLIPS.length} clips in library — match footage, training, opposition & individual breakdowns`} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filter === c ? 'border-purple-500 bg-purple-600/20 text-purple-300' : 'border-gray-800 bg-[#0a0c14] text-gray-400 hover:border-gray-700'}`}>
              {c}
            </button>
          ))}
        </div>
        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500">+ Upload new clip</button>
      </div>

      <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-3 text-xs text-purple-300">
        🤖 AI tagging coming soon — automatic breakdown by player and phase.
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-36 h-20 rounded-lg bg-gradient-to-br from-purple-900/40 to-gray-900 border border-gray-800 flex items-center justify-center text-3xl">▶</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-white truncate">{c.title}</div>
                  <div className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{c.duration} · {c.date}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className="text-[10px] font-semibold text-purple-300 bg-purple-600/20 border border-purple-600/30 rounded px-1.5 py-0.5">{c.category}</span>
                  {c.tags.map(t => (
                    <span key={t} className="text-[10px] text-gray-400 bg-gray-800/60 rounded px-1.5 py-0.5">#{t}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 italic">&ldquo;{c.notes}&rdquo;</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── MATCH STATS VIEW ─────────────────────────────────────────────────────────
const MATCH_RESULTS = [
  { date: '5 Apr',  opp: 'Saracens',      ha: 'A' as const, score: '21-27', result: 'L' as const, poss: 48, tackles: 89, lineout: 78, scrum: 75 },
  { date: '29 Mar', opp: 'Bristol',       ha: 'H' as const, score: '34-18', result: 'W' as const, poss: 58, tackles: 91, lineout: 85, scrum: 82 },
  { date: '22 Mar', opp: 'Worcester',     ha: 'A' as const, score: '17-17', result: 'D' as const, poss: 51, tackles: 84, lineout: 80, scrum: 77 },
  { date: '15 Mar', opp: 'Ealing',        ha: 'H' as const, score: '29-12', result: 'W' as const, poss: 61, tackles: 92, lineout: 88, scrum: 81 },
  { date: '8 Mar',  opp: 'Doncaster',     ha: 'A' as const, score: '24-22', result: 'W' as const, poss: 54, tackles: 86, lineout: 81, scrum: 79 },
]

function MatchStatsView() {
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📊" title="Match Stats" subtitle="Last 5 results and season aggregates" />

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Last 5 results</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 font-medium">Date</th>
                <th className="text-left py-2 font-medium">Opposition</th>
                <th className="text-center py-2 font-medium">H/A</th>
                <th className="text-center py-2 font-medium">Score</th>
                <th className="text-center py-2 font-medium">Result</th>
                <th className="text-right py-2 font-medium">Possession</th>
                <th className="text-right py-2 font-medium">Tackles</th>
                <th className="text-right py-2 font-medium">Lineout %</th>
                <th className="text-right py-2 font-medium">Scrum %</th>
              </tr>
            </thead>
            <tbody>
              {MATCH_RESULTS.map((m, i) => {
                const resClass = m.result === 'W' ? 'text-green-400' : m.result === 'L' ? 'text-red-400' : 'text-amber-400'
                return (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-2 text-gray-400">{m.date}</td>
                    <td className="py-2 text-white">{m.opp}</td>
                    <td className="py-2 text-center text-gray-400">{m.ha}</td>
                    <td className="py-2 text-center text-white font-medium">{m.score}</td>
                    <td className={`py-2 text-center font-bold ${resClass}`}>{m.result}</td>
                    <td className="py-2 text-right text-gray-200">{m.poss}%</td>
                    <td className="py-2 text-right text-gray-200">{m.tackles}</td>
                    <td className="py-2 text-right text-gray-200">{m.lineout}%</td>
                    <td className="py-2 text-right text-gray-200">{m.scrum}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-300">54%</div>
          <div className="text-xs text-gray-400 mt-1">Avg possession</div>
        </div>
        <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">87%</div>
          <div className="text-xs text-gray-400 mt-1">Tackle success</div>
        </div>
        <div className="bg-teal-600/10 border border-teal-600/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-teal-400">82%</div>
          <div className="text-xs text-gray-400 mt-1">Lineout success</div>
        </div>
        <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-400">79%</div>
          <div className="text-xs text-gray-400 mt-1">Scrum win %</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm font-semibold text-white mb-3">Top performers</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Most tackles / game</span>
              <span className="text-white">Danny Foley <span className="text-purple-300 ml-2">14.0</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Line breaks / game</span>
              <span className="text-white">Tom Harrison <span className="text-purple-300 ml-2">3.0</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Metres made / game</span>
              <span className="text-white">Luke Barnes <span className="text-purple-300 ml-2">108</span></span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-gray-400">Turnovers won / game</span>
              <span className="text-white">Karl Foster <span className="text-purple-300 ml-2">2.4</span></span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold text-white mb-3">Discipline</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Yellow cards</span>
              <span className="text-amber-400 font-semibold">3</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
              <span className="text-gray-400">Red cards</span>
              <span className="text-green-400 font-semibold">0</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-gray-400">Penalties conceded / game</span>
              <span className="text-white font-semibold">9.2</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Set piece heat map — lineouts won / lost by zone</div>
        <div className="text-[10px] text-gray-500 mb-2">Green = won · red = lost · size = count</div>
        <svg viewBox="0 0 600 260" className="w-full" style={{ maxHeight: 220 }}>
          {/* pitch */}
          <rect x="10" y="10" width="580" height="240" fill="#0f3d24" stroke="rgba(255,255,255,0.3)" strokeWidth="2" rx="4" />
          <line x1="300" y1="10" x2="300" y2="250" stroke="rgba(255,255,255,0.25)" />
          <line x1="100" y1="10" x2="100" y2="250" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <line x1="500" y1="10" x2="500" y2="250" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          {/* Own 22 */}
          <text x="55" y="20" fill="rgba(255,255,255,0.4)" fontSize="9">Own 22</text>
          <text x="200" y="20" fill="rgba(255,255,255,0.4)" fontSize="9">Own half</text>
          <text x="380" y="20" fill="rgba(255,255,255,0.4)" fontSize="9">Opp half</text>
          <text x="540" y="20" fill="rgba(255,255,255,0.4)" fontSize="9">Opp 22</text>
          {/* Won markers */}
          <circle cx="60" cy="80" r="14" fill="#10B981" opacity="0.7" />
          <text x="60" y="84" fontSize="10" textAnchor="middle" fill="white" fontWeight="700">8</text>
          <circle cx="200" cy="120" r="18" fill="#10B981" opacity="0.7" />
          <text x="200" y="124" fontSize="10" textAnchor="middle" fill="white" fontWeight="700">14</text>
          <circle cx="380" cy="80" r="16" fill="#10B981" opacity="0.7" />
          <text x="380" y="84" fontSize="10" textAnchor="middle" fill="white" fontWeight="700">11</text>
          <circle cx="540" cy="160" r="12" fill="#10B981" opacity="0.7" />
          <text x="540" y="164" fontSize="10" textAnchor="middle" fill="white" fontWeight="700">6</text>
          {/* Lost markers */}
          <circle cx="150" cy="180" r="9"  fill="#EF4444" opacity="0.7" />
          <text x="150" y="183" fontSize="9" textAnchor="middle" fill="white" fontWeight="700">3</text>
          <circle cx="250" cy="60"  r="7"  fill="#EF4444" opacity="0.7" />
          <text x="250" y="63" fontSize="9" textAnchor="middle" fill="white" fontWeight="700">2</text>
          <circle cx="430" cy="200" r="10" fill="#EF4444" opacity="0.7" />
          <text x="430" y="203" fontSize="9" textAnchor="middle" fill="white" fontWeight="700">4</text>
        </svg>
      </Card>
    </div>
  )
}

// ─── TRAINING PLANNER VIEW ────────────────────────────────────────────────────
type TrainingSession = { time: string; title: string; group: string; note?: string }
const WEEK_PLAN: { day: string; label: string; sessions: TrainingSession[]; accent: string }[] = [
  { day: 'Mon', label: 'Monday',   accent: 'purple', sessions: [{ time: '09:00', title: 'Gym & S&C', group: 'Full squad' }] },
  { day: 'Tue', label: 'Tuesday',  accent: 'purple', sessions: [
    { time: '10:00', title: 'Tactical — attack patterns', group: 'Full squad' },
    { time: '13:00', title: 'Set piece', group: 'Forwards', note: 'ACWR flag — see alert' },
  ] },
  { day: 'Wed', label: 'Wednesday', accent: 'blue',   sessions: [{ time: '—', title: 'Recovery & analysis only', group: 'Full squad' }] },
  { day: 'Thu', label: 'Thursday',  accent: 'purple', sessions: [{ time: '11:00', title: "Captain's run", group: 'Full squad' }] },
  { day: 'Fri', label: 'Friday',    accent: 'amber',  sessions: [{ time: 'AM',     title: 'Travel + pre-match prep', group: 'Matchday 23' }] },
  { day: 'Sat', label: 'Saturday',  accent: 'red',    sessions: [{ time: '15:00', title: 'MATCH DAY — Bath RFC (A)', group: 'Matchday 23' }] },
  { day: 'Sun', label: 'Sunday',    accent: 'green',  sessions: [{ time: '—', title: 'Rest / recovery', group: 'Full squad' }] },
]

function TrainingPlannerView() {
  const [groupFilter, setGroupFilter] = useState<'All' | 'Forwards' | 'Backs'>('All')
  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📋" title="Training Planner" subtitle="Weekly schedule — Mon–Sun with position group splits" />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {(['All', 'Forwards', 'Backs'] as const).map(g => (
            <button key={g} onClick={() => setGroupFilter(g)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${groupFilter === g ? 'border-purple-500 bg-purple-600/20 text-purple-300' : 'border-gray-800 bg-[#0a0c14] text-gray-400 hover:border-gray-700'}`}>
              {g}
            </button>
          ))}
        </div>
        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500">+ Add Session</button>
      </div>

      <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-xs text-amber-300">
        ⚠ Load monitoring alert — Tuesday double session may spike ACWR for front row. Consider splitting the tactical block.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {WEEK_PLAN.map(d => (
          <Card key={d.day}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 text-${d.accent}-400`}>{d.label}</div>
            <div className="space-y-2">
              {d.sessions.map((s, i) => (
                <div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-2">
                  <div className="text-[10px] text-gray-500">{s.time}</div>
                  <div className="text-xs text-white font-medium leading-tight">{s.title}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{s.group}</div>
                  {s.note && <div className="text-[10px] text-amber-400 mt-1">⚠ {s.note}</div>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function RugbyPortalPage() {
  const [activeSection,setActiveSection]=useState('dashboard');
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const club = DEMO_CLUB;
  const groups = ['CLUB OVERVIEW','SALARY CAP','FRANCHISE','SQUAD','PERFORMANCE','RECRUITMENT','WELFARE','COMMERCIAL',"WOMEN'S RUGBY",'INTELLIGENCE'];

  const renderView = () => {
    switch(activeSection) {
      case 'dashboard':       return <ClubDashboardView club={club}/>;
      case 'dorbriefing':     return <DoRBriefingView club={club}/>;
      case 'matchday':        return <MatchDayCentreView club={club}/>;
      case 'calendar':        return <ClubCalendarView/>;
      case 'capdashboard':    return <CapDashboardView club={club}/>;
      case 'contracts':       return <PlayerContractsView/>;
      case 'scenario':        return <ScenarioModellerView club={club}/>;
      case 'audittrail':      return <AuditTrailView/>;
      case 'readiness':       return <ReadinessScoreView club={club}/>;
      case 'criteria':        return <CriteriaTrackerView/>;
      case 'eoi':             return <ExpressionOfInterestView/>;
      case 'gapanalysis':     return <GapAnalysisView/>;
      case 'availability':    return <SquadAvailabilityView/>;
      case 'selection':       return <SelectionPlannerView/>;
      case 'international':   return <InternationalDutyView/>;
      case 'loans':           return <LoanManagementView/>;
      case 'gps-load':        return <GPSLoadView/>;
      case 'video-analysis':  return <VideoAnalysisView/>;
      case 'match-stats':     return <MatchStatsView/>;
      case 'training-planner':return <TrainingPlannerView/>;
      case 'scouting':        return <ScoutingPipelineView/>;
      case 'capimpact':       return <CapImpactModellerView club={club}/>;
      case 'agents':          return <AgentContactsView/>;
      case 'targets':         return <TargetsShortlistView/>;
      case 'concussion':      return <ConcussionHIAView/>;
      case 'rtp':             return <ReturnToPlayView/>;
      case 'medical':         return <MedicalRecordsView/>;
      case 'welfareaudit':    return <WelfareAuditView/>;
      case 'sponsorship':     return <SponsorshipPipelineView/>;
      case 'matchdayrev':     return <MatchdayRevenueView/>;
      case 'stadium':         return <StadiumVenueView club={club}/>;
      case 'activation':      return <PartnershipActivationView/>;
      case 'womenssquad':     return <WomensSquadView/>;
      case 'pwrcompliance':   return <PWRComplianceView/>;
      case 'sharedfacilities':return <SharedFacilitiesView/>;
      case 'womenscommercial':return <WomensCommercialView/>;
      case 'aibriefing':      return <AIBriefingView club={club}/>;
      case 'clubtocountry':   return <ClubToCountryView/>;
      case 'opposition':      return <OppositionAnalysisView/>;
      case 'industrynews':    return <IndustryNewsView/>;
      default:                return <ClubDashboardView club={club}/>;
    }
  };

  return (
    <div className="min-h-screen flex" style={{background:'#07080F',fontFamily:'DM Sans, sans-serif',color:'#e5e7eb'}}>
      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-200 flex flex-col border-r border-gray-800 ${sidebarCollapsed?'w-14':'w-56'}`} style={{background:'#0a0c14'}}>
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed&&(<div><div className="text-xs font-bold uppercase tracking-widest" style={{background:'linear-gradient(90deg, #8B5CF6, #7C3AED)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>LUMIO RUGBY</div><div className="text-[10px] text-gray-600">Club OS</div></div>)}
          {sidebarCollapsed&&<span className="text-lg mx-auto">🏉</span>}
          <button onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-600 hover:text-gray-400 text-xs ml-auto flex-shrink-0">{sidebarCollapsed?'>':'<'}</button>
        </div>

        {!sidebarCollapsed&&(
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-purple-500/40" style={{background:'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(124,58,237,0.3))'}}>{club.leaguePosition}</div>
              <div><div className="text-xs font-semibold text-white">{club.name}</div><div className="text-[10px] text-gray-500">{club.league} · #{club.leaguePosition}</div></div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {groups.map((group:string)=>{
            const items=SIDEBAR_ITEMS.filter((i:{group:string})=>i.group===group);
            return (
              <div key={group} className="mb-3">
                {!sidebarCollapsed&&<div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group}</div>}
                {items.map((item:{id:string;label:string;icon:string})=>(
                  <button key={item.id} onClick={()=>setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg mb-0.5 transition-all text-left ${activeSection===item.id?'bg-purple-600/20 text-purple-300 border border-purple-600/30':'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
                    title={sidebarCollapsed?item.label:undefined}>
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed&&<span className="text-xs font-medium truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {!sidebarCollapsed&&(
          <div className="p-3 border-t border-gray-800">
            <div className="text-[9px] text-gray-700 uppercase tracking-wider font-medium">Plan</div>
            <div className="text-xs text-purple-400 font-semibold mt-0.5">{club.plan}</div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 border-b border-gray-800 px-6 py-3 flex items-center justify-between" style={{background:'#0a0c14'}}>
          <div className="text-xs text-gray-500 font-medium capitalize">
            {SIDEBAR_ITEMS.find((i:{id:string})=>i.id===activeSection)?.icon} {SIDEBAR_ITEMS.find((i:{id:string})=>i.id===activeSection)?.label}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600">{club.league} · Round 18</div>
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            <div className="text-xs text-gray-500">Match Week</div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">{renderView()}</div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex flex-col items-center gap-4 p-4 border-l border-gray-800 flex-shrink-0" style={{width:'220px'}}>
            <div className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🏉</div>
              <div className="text-sm font-bold text-white">{club.name}</div>
              <div className="text-[10px] text-gray-500">{club.league}</div>
              <div className="text-xs text-purple-400 font-medium mt-1">#{club.leaguePosition} in league</div>
              <div className="text-xs text-gray-400 mt-1">{club.stadium}</div>
            </div>
            <div className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Next Match</div>
              <div className="text-xs text-purple-400 font-medium">{club.nextFixture}</div>
              <div className="text-xs text-gray-300 mt-1">{club.nextFixtureDate}</div>
              <div className="text-xs text-gray-500">KO 3:00pm · The Grange</div>
            </div>
            <div className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Cap Status</div>
              <div className="text-xs text-green-400 font-medium">COMPLIANT</div>
              <div className="text-xs text-gray-400 mt-1">{fmt(club.capCeiling - club.currentSpend)} headroom</div>
            </div>
            <div className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Franchise</div>
              <div className="text-xs text-amber-400 font-medium">{club.franchiseScore}%</div>
              <div className="text-xs text-gray-400 mt-1">2 criteria RED</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
