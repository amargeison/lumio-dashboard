'use client';

import { useState } from 'react';
import { SportsDemoGate, RoleSwitcher } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'

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

// ─── RUGBY ROLES ──────────────────────────────────────────────────────────────
const RUGBY_ROLES = [
  { id: 'ceo',        label: 'CEO / Chairman',      icon: '🏛️' },
  { id: 'dor',        label: 'Director of Rugby',   icon: '🏉' },
  { id: 'coach',      label: 'Head Coach',           icon: '🎽' },
  { id: 'medical',    label: 'Head of Medical',      icon: '🏥' },
  { id: 'commercial', label: 'Commercial Director',  icon: '💼' },
  { id: 'academy',    label: 'Academy Director',     icon: '🎓' },
]

// ─── SIDEBAR ITEMS ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard',       label: 'Club Dashboard',        icon: '🏠', group: 'CLUB OVERVIEW' },
  { id: 'dorbriefing',     label: 'DoR Briefing',          icon: '🌅', group: 'CLUB OVERVIEW' },
  { id: 'insights',        label: 'Insights',              icon: '📊', group: 'CLUB OVERVIEW' },
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
  { id: 'playerprofile',   label: 'Player Profiles',       icon: '👤', group: 'SQUAD' },
  { id: 'international',   label: 'International Duty',    icon: '🌍', group: 'SQUAD' },
  { id: 'loans',           label: 'Loan Management',       icon: '🔄', group: 'SQUAD' },
  { id: 'gps-load',        label: 'GPS & Load',            icon: '📡', group: 'PERFORMANCE' },
  { id: 'heatmap',         label: 'Player Heatmap',        icon: '🗺️', group: 'PERFORMANCE' },
  { id: 'video-analysis',  label: 'Video Analysis',        icon: '🎬', group: 'PERFORMANCE' },
  { id: 'match-stats',     label: 'Match Stats',           icon: '📊', group: 'PERFORMANCE' },
  { id: 'setpiece',        label: 'Set Piece Analytics',   icon: '📐', group: 'PERFORMANCE' },
  { id: 'carryanalytics', label: 'Carry Analytics',        icon: '⚡', group: 'PERFORMANCE' },
  { id: 'training-planner',label: 'Training Planner',      icon: '📋', group: 'PERFORMANCE' },
  { id: 'periodisation',  label: 'Periodisation',          icon: '📈', group: 'PERFORMANCE' },
  { id: 'scouting',        label: 'Scouting Pipeline',     icon: '🔍', group: 'RECRUITMENT' },
  { id: 'capimpact',       label: 'Cap Impact Modeller',   icon: '💷', group: 'RECRUITMENT' },
  { id: 'agents',          label: 'Agent Contacts',        icon: '📞', group: 'RECRUITMENT' },
  { id: 'targets',         label: 'Targets Shortlist',     icon: '🎯', group: 'RECRUITMENT' },
  { id: 'concussion',      label: 'Concussion & HIA',      icon: '🧠', group: 'WELFARE' },
  { id: 'rtp',             label: 'Return to Play',        icon: '🏥', group: 'WELFARE' },
  { id: 'medical',         label: 'Medical Records',       icon: '📂', group: 'WELFARE' },
  { id: 'welfareaudit',    label: 'Welfare Audit',         icon: '🛡️', group: 'WELFARE' },
  { id: 'mentalperformance',label:'Mental Performance',    icon: '🧠', group: 'WELFARE' },
  { id: 'sponsorship',     label: 'Sponsorship Pipeline',  icon: '🤝', group: 'COMMERCIAL' },
  { id: 'matchdayrev',     label: 'Matchday Revenue',      icon: '💰', group: 'COMMERCIAL' },
  { id: 'stadium',         label: 'Stadium & Venue',       icon: '🏟️', group: 'COMMERCIAL' },
  { id: 'activation',      label: 'Partnership Activation',icon: '🎯', group: 'COMMERCIAL' },
  { id: 'mediahr',         label: 'Media & PR',            icon: '📣', group: 'COMMERCIAL' },
  { id: 'fanhub',          label: 'Fan Hub',               icon: '💜', group: 'COMMERCIAL' },
  { id: 'womenssquad',     label: "Women's Squad",         icon: '⭐', group: "WOMEN'S RUGBY" },
  { id: 'pwrcompliance',   label: 'PWR Compliance',        icon: '📋', group: "WOMEN'S RUGBY" },
  { id: 'sharedfacilities',label: 'Shared Facilities',     icon: '🏢', group: "WOMEN'S RUGBY" },
  { id: 'womenscommercial',label: "Women's Commercial",    icon: '💼', group: "WOMEN'S RUGBY" },
  { id: 'aibriefing',      label: 'AI Morning Briefing',   icon: '🤖', group: 'INTELLIGENCE' },
  { id: 'halftime',        label: 'AI Halftime Brief',     icon: '🤖', group: 'INTELLIGENCE' },
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

// ─── INSIGHTS VIEW ──────────────────────────────────────────────────────────
function InsightsView({club, activeRole: activeRoleProp = 'dor'}:{club:RugbyClub; activeRole?: string}) {
  const [localRole, setLocalRole] = useState(activeRoleProp);
  const activeRole = localRole;
  const setActiveRole = setLocalRole;
  const roles = [{id:'dor',label:'Director of Rugby',icon:'🏉'},{id:'coach',label:'Head Coach',icon:'🎽'},{id:'medical',label:'Head of Medical',icon:'🏥'},{id:'recruitment',label:'Recruitment',icon:'🔍'},{id:'academy',label:'Academy',icon:'🎓'},{id:'analysis',label:'Analysis',icon:'🎬'},{id:'commercial',label:'Commercial',icon:'💼'},{id:'ceo',label:'CEO / Chairman',icon:'🏛️'}];
  const headroom = club.capCeiling - club.currentSpend;
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="📊" title="Insights" subtitle="Role-specific dashboards — 8 views"/>
      <div className="overflow-x-auto flex gap-1 border-b border-gray-800 pb-0">{roles.map(r=><button key={r.id} onClick={()=>setActiveRole(r.id)} className={`px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeRole===r.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{r.icon}</span>{r.label}</button>)}</div>
      {activeRole==='dor'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Cap Headroom" value={fmt(headroom)} sub="Compliant" color="green"/><StatCard label="Franchise" value={`${club.franchiseScore}%`} sub="2 RED criteria" color="orange"/><StatCard label="Targets" value="6" sub="2 priority" color="purple"/><StatCard label="Contract Exp" value="7" sub="Before Jun 2026" color="red"/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Card><div className="text-sm font-semibold text-white mb-3">Priority Actions</div>{[{a:'Confirm No.8 — Foster HIA Day 8',u:'red'},{a:'LHP contract — external interest',u:'red'},{a:"Women's Game plan — submit by 30 Apr",u:'amber'},{a:'Investment Capacity pack — CEO sign-off',u:'amber'},{a:'Salary cap return — due 10 May',u:'blue'}].map((a,i)=><div key={i} className="flex gap-2 py-2 border-b border-gray-800/50 last:border-0"><span className={`text-xs mt-0.5 flex-shrink-0 ${a.u==='red'?'text-red-400':a.u==='amber'?'text-amber-400':'text-blue-400'}`}>{a.u==='red'?'🔴':a.u==='amber'?'🟡':'🔵'}</span><span className="text-xs text-gray-300">{a.a}</span></div>)}</Card><Card><div className="text-sm font-semibold text-white mb-3">Franchise Gap — 30-Day Sprint</div>{[{c:"Women's Game (42%)",a:'Submit PWR reg',d:'30 Apr',p:'CRITICAL'},{c:'Investment (48%)',a:'Complete investor pack',d:'15 May',p:'HIGH'},{c:'Operating (65%)',a:'Book matchday assessment',d:'30 Jun',p:'MEDIUM'}].map((g,i)=><div key={i} className={`p-3 rounded-lg border mb-2 ${g.p==='CRITICAL'?'border-red-600/30 bg-red-600/5':g.p==='HIGH'?'border-amber-600/30 bg-amber-600/5':'border-gray-800'}`}><div className="flex justify-between mb-1"><span className="text-xs font-bold text-white">{g.c}</span><span className={`text-[10px] px-1.5 py-0.5 rounded ${g.p==='CRITICAL'?'bg-red-600/20 text-red-400':g.p==='HIGH'?'bg-amber-600/20 text-amber-400':'bg-gray-800 text-gray-500'}`}>{g.p}</span></div><div className="text-[10px] text-gray-400">{g.a} · {g.d}</div></div>)}</Card></div></div>}
      {activeRole==='coach'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Available" value="28/38" sub="2 HIA · 2 injured" color="teal"/><StatCard label="GPS Overloads" value="2" sub="Barnes · Foster" color="red"/><StatCard label="Team ACWR" value="1.22" sub="Amber" color="orange"/><StatCard label="Next Match" value="Sat" sub="vs Jersey Reds" color="purple"/></div><Card><div className="text-sm font-semibold text-white mb-3">Set Piece + Opposition</div><div className="space-y-2 text-xs"><div className="flex justify-between py-1.5 border-b border-gray-800/50"><span className="text-gray-400">Lineout</span><span className="text-green-400 font-bold">85%</span></div><div className="flex justify-between py-1.5 border-b border-gray-800/50"><span className="text-gray-400">Scrum</span><span className="text-amber-400 font-bold">71% ⚠</span></div><div className="flex justify-between py-1.5"><span className="text-gray-400">Gainline</span><span className="text-white font-bold">61%</span></div></div><div className="mt-3 text-xs text-gray-400"><div>• Jersey scrum weakness — 4 pen last 3</div><div>• Hawkins kicks left 60%</div><div>• Morris (OF) — 9 turnovers last 3</div></div></Card></div>}
      {activeRole==='medical'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="HIA Active" value="1" sub="Danny Foster" color="red"/><StatCard label="Injured" value="2" sub="Briggs · Patel" color="amber"/><StatCard label="Overload" value="2" sub="Barnes · Foster K." color="orange"/><StatCard label="Screenings" value="2" sub="Overdue" color="blue"/></div><Card><div className="text-sm font-semibold text-white mb-3">Medical Register</div><table className="w-full text-xs"><tbody>{[{p:'Danny Foster',i:'HIA Day 8',r:'19 Apr',s:'Active'},{p:'Karl Briggs',i:'Shoulder post-op',r:'2 May',s:'RTP'},{p:'Ryan Patel',i:'Hamstring Gr2',r:'18 Apr',s:'Rehab'},{p:'Luke Barnes',i:'ACWR 1.52',r:'Managed',s:'Load mgmt'}].map((r,i)=><tr key={i} className="border-b border-gray-800/40"><td className="py-2 text-white">{r.p}</td><td className="py-2 text-gray-400">{r.i}</td><td className="py-2 text-gray-300">{r.r}</td><td className="py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded ${r.s==='Active'?'bg-red-600/20 text-red-400':r.s==='RTP'?'bg-blue-600/20 text-blue-400':'bg-gray-800 text-gray-500'}`}>{r.s}</span></td></tr>)}</tbody></table></Card></div>}
      {activeRole==='recruitment'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Cap Headroom" value={fmt(headroom)} sub="For signings" color="green"/><StatCard label="Priority" value="2" sub="LHP + DM" color="red"/><StatCard label="Agents" value="5" sub="3 negotiating" color="purple"/><StatCard label="Window" value="Open" sub="Summer" color="blue"/></div><Card><div className="text-sm font-semibold text-white mb-3">Target Pipeline</div><table className="w-full text-xs"><tbody>{[{n:'Mike Donovan',p:'LHP',c:'Richmond',s:78000,st:'Offer made'},{n:'Jake Morton',p:'DM',c:'Coventry',s:65000,st:'Approach'},{n:'Chris Lawton',p:'CB',c:'Nottingham',s:58000,st:'Scouting'},{n:'Rory Flynn',p:'FH',c:'Free agent',s:72000,st:'Meeting Thu'}].map((t,i)=>{const ca=headroom-t.s;return<tr key={i} className="border-b border-gray-800/40"><td className="py-2 text-white">{t.n}</td><td className="py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{t.p}</span></td><td className="py-2 text-gray-400">{t.c}</td><td className="py-2 text-right text-gray-300">{fmt(t.s)}</td><td className={`py-2 text-right font-bold ${ca>200000?'text-green-400':'text-amber-400'}`}>{fmt(ca)}</td><td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded ${t.st==='Offer made'?'bg-green-600/20 text-green-400':t.st.includes('Meet')?'bg-purple-600/20 text-purple-400':'bg-gray-800 text-gray-500'}`}>{t.st}</span></td></tr>;})}</tbody></table></Card></div>}
      {activeRole==='academy'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Academy" value="28" sub="U18:14 · U21:14" color="purple"/><StatCard label="1st Team Ready" value="3" sub="Dual reg" color="green"/><StatCard label="Franchise pts" value="+12" sub="CoE compliance" color="teal"/><StatCard label="Graduates" value="2" sub="This season" color="blue"/></div><Card><div className="text-sm font-semibold text-white mb-3">U21 First Team Bridge</div>{[{n:'Tom Foley',a:20,p:'No.8',s:'First team debut R14',ss:18},{n:'Ali Rashid',a:19,p:'Wing',s:'Dual reg — Coventry',ss:12},{n:'Sam Clarke',a:21,p:'Hooker',s:'Training with 1st team',ss:8}].map((p,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-xs"><div><div className="text-white font-medium">{p.n}</div><div className="text-[10px] text-gray-500">{p.p} · {p.a} · {p.s}</div></div><div className="text-right"><div className="text-purple-400 font-bold">{p.ss}</div><div className="text-[10px] text-gray-600">1st team sessions</div></div></div>)}</Card></div>}
      {activeRole==='analysis'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Clips" value="128" sub="5 categories" color="purple"/><StatCard label="Set Piece" value="85%/71%" sub="LO / Scrum" color="teal"/><StatCard label="Gainline" value="61%" sub="vs 56% bench ↑" color="green"/><StatCard label="Tackle Miss" value="10%" sub="Target <12% ✓" color="green"/></div><Card><div className="text-sm font-semibold text-white mb-3">Analysis Queue</div>{[{t:'Jersey Reds opp report',d:'Thu AM',s:'In progress'},{t:'Own lineout call review',d:'Thu AM',s:'Complete ✓'},{t:'Bath tackle patterns (18 events)',d:'Wed',s:'Complete ✓'},{t:'Foster HIA video — contact events',d:'Tue',s:'Complete ✓'}].map((t,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-xs"><div className="flex-1 text-gray-300 mr-4">{t.t}</div><div className="flex items-center gap-3 flex-shrink-0"><span className="text-gray-500">{t.d}</span><span className={`px-2 py-0.5 rounded text-[10px] ${t.s.includes('✓')?'bg-green-600/20 text-green-400':'bg-amber-600/20 text-amber-400'}`}>{t.s}</span></div></div>)}</Card></div>}
      {activeRole==='commercial'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Sponsors" value="£172k" sub="5 active" color="green"/><StatCard label="Pipeline" value="£43k" sub="2 prospects" color="orange"/><StatCard label="Matchday Rev" value="£374k" sub="vs £400k (94%)" color="teal"/><StatCard label="Renewals" value="2" sub="Jun 2026" color="red"/></div><Card><div className="text-sm font-semibold text-white mb-3">Sponsor Actions</div>{[{s:'Hartfield Building Society',a:'Renewal — prepare for May',v:'£85k',u:'amber'},{s:'West Country Energy',a:'Meeting follow-up — proposal due',v:'£28k est.',u:'red'},{s:"Smith & Sons",a:'Activate obligation review',v:'£35k',u:'blue'}].map((s,i)=><div key={i} className={`p-3 rounded-lg border mb-2 ${s.u==='red'?'border-red-600/30 bg-red-600/5':s.u==='amber'?'border-amber-600/30 bg-amber-600/5':'border-gray-800'}`}><div className="flex justify-between mb-1 text-xs"><span className="font-bold text-white">{s.s}</span><span className="text-purple-400">{s.v}</span></div><div className="text-[10px] text-gray-400">{s.a}</div></div>)}</Card></div>}
      {activeRole==='ceo'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Franchise" value={`${club.franchiseScore}%`} sub="Target: 85%" color="orange"/><StatCard label="Cap" value="SAFE" sub={fmt(headroom)} color="green"/><StatCard label="Revenue" value="£1.84M" sub="Projected" color="purple"/><StatCard label="Operating" value="-£180k" sub="On plan" color="teal"/></div><Card><div className="text-sm font-semibold text-white mb-3">Board Actions</div>{[{a:"Women's Game — PWR registration budget (£180k/yr)",u:'red',d:'30 Apr'},{a:'Investment pack — legal due diligence',u:'amber',d:'15 May'},{a:'Stadium feasibility — East Stand (4,800→6,500)',u:'blue',d:'30 Jun'}].map((a,i)=><div key={i} className={`flex gap-3 p-3 rounded-lg border mb-2 ${a.u==='red'?'border-red-600/30 bg-red-600/5':a.u==='amber'?'border-amber-600/30 bg-amber-600/5':'border-gray-800'}`}><span className="text-lg flex-shrink-0">{a.u==='red'?'🔴':a.u==='amber'?'🟡':'🔵'}</span><div><div className="text-xs text-gray-300">{a.a}</div><div className="text-[10px] text-gray-600 mt-1">Deadline: {a.d}</div></div></div>)}</Card></div>}
    </div>
  );
}

// ─── DIRECTOR OF RUGBY BRIEFING VIEW ──────────────────────────────────────────
function DoRBriefingView({club}:{club:RugbyClub}) {
  const [brief,setBrief]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [autoMode,setAutoMode]=useState(false);
  const CONTEXT={date:'Thursday 9 April 2026',matchWeek:`vs Jersey Reds — Saturday 11 April — Home`,cap:{headroom:club.capCeiling-club.currentSpend,spend:club.currentSpend,ceiling:club.capCeiling},franchise:{score:club.franchiseScore,criticalGaps:['Investment Capacity (48%)',"Women's Game (42%)"]},gps:{avgACWR:1.22,overloaded:['Luke Barnes (1.52)','Danny Foster (1.38)'],managing:['Karl Foster (1.44)']},welfare:{hiaActive:'Danny Foster — Day 8',doubtful:['Danny Cole (hamstring)','Ryan Patel (hamstring)']},recruitment:{targets:6,priorityAction:'LHP closing — Championship clubs circling',capImpact:'Signing at £95k → headroom: £365k'},commercial:{nextMeeting:'Hartfield Building Society — 3 May',renewalDue:'Local Energy Co — May 2026'}};
  const generate = async () => {
    setLoading(true);setBrief(null);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`You are the Club Intelligence AI for ${club.name}. Generate a 400-word DoR morning briefing for ${club.dor}. Today: ${CONTEXT.date} — ${CONTEXT.matchWeek}. Cap: ceiling £${(CONTEXT.cap.ceiling/1e6).toFixed(2)}M, spend £${(CONTEXT.cap.spend/1e6).toFixed(2)}M, headroom £${(CONTEXT.cap.headroom/1000).toFixed(0)}k. Franchise: ${CONTEXT.franchise.score}% (target 85%), gaps: ${CONTEXT.franchise.criticalGaps.join(', ')}. GPS: avg ACWR ${CONTEXT.gps.avgACWR}, overload: ${CONTEXT.gps.overloaded.join(', ')}, manage: ${CONTEXT.gps.managing.join(', ')}. Welfare: HIA ${CONTEXT.welfare.hiaActive}, doubtful: ${CONTEXT.welfare.doubtful.join(', ')}. Recruitment: ${CONTEXT.recruitment.targets} targets, priority: ${CONTEXT.recruitment.priorityAction}. Commercial: next event ${CONTEXT.commercial.nextMeeting}, renewal ${CONTEXT.commercial.renewalDue}. Format: ## Good morning, ${club.dor} | ## 🏟️ MATCH WEEK | ## 📡 SQUAD HEALTH | ## ⚖️ CAP | ## 🏆 FRANCHISE | ## 💼 COMMERCIAL | ## ✅ YOUR 3 PRIORITIES TODAY. Under 400 words.`}]})});
      const data=await res.json();setBrief(data.content?.map((b:{type:string;text?:string})=>b.type==='text'?b.text:'').join('')||'Error.');
    } catch { setBrief('Connection error.'); }
    setLoading(false);
  };
  const renderBrief=(text:string)=>text.split('\n').map((line,i)=>{if(line.startsWith('## Good morning'))return<h2 key={i} className="text-base font-bold text-white mb-4">{line.replace('## ','')}</h2>;if(line.startsWith('## '))return<h3 key={i} className="text-sm font-bold text-white mt-5 mb-2">{line.replace('## ','')}</h3>;if(line.match(/^\d\./))return<div key={i} className="flex gap-2 text-xs text-gray-300 mb-1.5 ml-2"><span className="text-purple-400 font-bold flex-shrink-0">{line[0]}.</span><span>{line.slice(2)}</span></div>;if(line.startsWith('- '))return<div key={i} className="flex gap-2 text-xs text-gray-300 mb-1 ml-2"><span className="text-purple-500 flex-shrink-0 mt-0.5">•</span><span>{line.slice(2)}</span></div>;if(line.trim()==='')return<div key={i} className="h-1.5"/>;return<p key={i} className="text-xs text-gray-300 mb-1.5 leading-relaxed">{line}</p>;});
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="🌅" title="DoR Morning Briefing" subtitle={`${club.dor} · ${CONTEXT.date} · ${CONTEXT.matchWeek}`}/>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3"><StatCard label="Cap Headroom" value={`£${(CONTEXT.cap.headroom/1000).toFixed(0)}k`} sub="Compliant" color="green"/><StatCard label="Franchise" value={`${CONTEXT.franchise.score}%`} sub="Target: 85%" color="orange"/><StatCard label="Squad ACWR" value={CONTEXT.gps.avgACWR} sub="2 overloaded" color={CONTEXT.gps.avgACWR>1.3?'red':'green'}/><StatCard label="HIA Active" value="1" sub={CONTEXT.welfare.hiaActive} color="red"/><StatCard label="Recruits" value={CONTEXT.recruitment.targets} sub="6 targets" color="purple"/></div>
      <div className="flex items-center gap-4"><button onClick={generate} disabled={loading} className="px-6 py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/40 disabled:text-purple-800 text-white transition-all flex items-center gap-2">{loading?<><span className="animate-spin inline-block">⟳</span> Generating...</>:<><span>🤖</span> Generate Today&apos;s Brief</>}</button><div className="flex items-center gap-2"><button onClick={()=>setAutoMode(!autoMode)} className={`w-10 h-5 rounded-full relative transition-colors ${autoMode?'bg-purple-600':'bg-gray-700'}`}><div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${autoMode?'right-0.5':'left-0.5'}`}/></button><span className="text-xs text-gray-400">Auto 07:30</span></div></div>
      {brief&&<Card className="border-purple-600/30"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span className="text-purple-400 font-bold text-sm">🤖 Lumio AI · DoR Brief</span><span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">CONFIDENTIAL</span></div><button onClick={generate} className="text-xs text-gray-500 hover:text-gray-300">↺ Regenerate</button></div><div className="divide-y divide-gray-800/30">{renderBrief(brief)}</div><div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between"><span className="text-[10px] text-gray-600">Powered by Claude · {CONTEXT.date}</span><button className="text-xs text-purple-400 hover:text-purple-300">Forward to Head Coach →</button></div></Card>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{source:'Kitman Labs',status:'Live · 07:24',dot:'green'},{source:'Catapult GPS',status:'Live · last session',dot:'green'},{source:'Cap system',status:'Live',dot:'green'},{source:'Franchise tracker',status:'Updated 8 Apr',dot:'amber'}].map((s,i)=><div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="flex items-center gap-1.5 mb-1"><div className={`w-1.5 h-1.5 rounded-full ${s.dot==='green'?'bg-green-400':'bg-amber-400'}`}/><span className="text-xs text-white font-medium">{s.source}</span></div><div className="text-[10px] text-gray-500">{s.status}</div></div>)}</div>
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

// ─── MENTAL PERFORMANCE VIEW ─────────────────────────────────────────────────
function MentalPerformanceView() {
  const [mpTab, setMpTab] = useState<'squad'|'individual'|'support'|'checkin'>('squad');
  const SQUAD_MOOD=[{player:'Tom Harrison',score:8.2,trend:'stable',flag:false,note:''},{player:'James Briggs',score:7.8,trend:'up',flag:false,note:''},{player:'Danny Foster',score:6.1,trend:'down',flag:true,note:'HIA + match unavailability impacting confidence. Psych session Fri.'},{player:'Karl Foster',score:7.4,trend:'stable',flag:false,note:''},{player:'Danny Cole',score:5.8,trend:'down',flag:true,note:'Form + contract anxiety. Weekly 1:1 with Dr Reid.'},{player:'Marcus Webb',score:8.6,trend:'up',flag:false,note:''},{player:'Ryan Patel',score:6.4,trend:'down',flag:true,note:'Hamstring frustration. Second opinion requested.'},{player:'Matt Jones',score:7.9,trend:'stable',flag:false,note:''},{player:'Luke Barnes',score:8.1,trend:'stable',flag:false,note:''},{player:'Sam Ellis',score:7.2,trend:'up',flag:false,note:''},{player:'Oliver Grant',score:7.6,trend:'stable',flag:false,note:''},{player:'David Obi',score:8.0,trend:'stable',flag:false,note:''}];
  const flagged=SQUAD_MOOD.filter(p=>p.flag);const avgScore=(SQUAD_MOOD.reduce((s,p)=>s+p.score,0)/SQUAD_MOOD.length).toFixed(1);
  const MONTHLY=[7.8,7.6,7.2,7.4,7.1,7.3,7.0,6.9],MONTHS=['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
  const mW=480,mH=120,mpL=32,mpR=12,mpT=16,mpB=28,miW=mW-mpL-mpR,miH=mH-mpT-mpB,mMin=5,mMax=10,msX=miW/(MONTHLY.length-1);
  const moodPath=MONTHLY.map((v,i)=>`${i===0?'M':'L'} ${mpL+i*msX} ${mpT+miH-((v-mMin)/(mMax-mMin))*miH}`).join(' ');
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="🧠" title="Mental Performance" subtitle="Squad mood · Individual flags · Support log · Check-in"/>
      <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-3 text-xs text-red-400">🔒 Restricted to Head of Medical and Welfare Lead only.</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Squad Avg" value={`${avgScore}/10`} sub="Down from 7.4" color={Number(avgScore)>=7?'green':'orange'}/><StatCard label="Active Flags" value={flagged.length} sub="Need attention" color="red"/><StatCard label="Check-ins" value="24/38" sub="14 outstanding" color="amber"/><StatCard label="Psych sessions" value="3" sub="Foster·Cole·Patel" color="blue"/></div>
      <div className="flex gap-1 border-b border-gray-800">{([{id:'squad',label:'Squad',icon:'👥'},{id:'individual',label:'Flagged',icon:'🚩'},{id:'support',label:'Support Log',icon:'❤️'},{id:'checkin',label:'Check-in',icon:'📝'}] as const).map(t=><button key={t.id} onClick={()=>setMpTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${mpTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}{t.id==='individual'&&flagged.length>0&&<span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-600/20 text-red-400">{flagged.length}</span>}</button>)}</div>
      {mpTab==='squad'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-3">Mood Trend</div><svg viewBox={`0 0 ${mW} ${mH}`} width="100%">{[0,0.5,1].map((t,i)=><line key={i} x1={mpL} x2={mW-mpR} y1={mpT+miH-t*miH} y2={mpT+miH-t*miH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}<line x1={mpL} x2={mW-mpR} y1={mpT+miH-((7.5-mMin)/(mMax-mMin))*miH} y2={mpT+miH-((7.5-mMin)/(mMax-mMin))*miH} stroke="#22C55E" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/><path d={moodPath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{MONTHLY.map((v,i)=><g key={i}><circle cx={mpL+i*msX} cy={mpT+miH-((v-mMin)/(mMax-mMin))*miH} r="3.5" fill="#8B5CF6"/><text x={mpL+i*msX} y={mH-4} fontSize="9" fill="#6B7280" textAnchor="middle">{MONTHS[i]}</text></g>)}</svg><p className="text-[10px] text-gray-600 mt-2">Downward trend since Jan — correlates with injury run and contract uncertainty.</p></Card><Card><div className="text-sm font-semibold text-white mb-3">Check-In Scores</div><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider"><th className="text-left py-2">Player</th><th className="text-center py-2">Score</th><th className="text-center py-2">Trend</th><th className="text-center py-2">Flag</th></tr></thead><tbody>{SQUAD_MOOD.map((p,i)=><tr key={i} className={`border-b border-gray-800/40 ${p.flag?'bg-red-600/5':''}`}><td className="py-2 text-white">{p.player}</td><td className="py-2 text-center"><span className={`font-bold text-sm ${p.score>=7.5?'text-green-400':p.score>=6.5?'text-amber-400':'text-red-400'}`}>{p.score}</span></td><td className="py-2 text-center text-sm">{p.trend==='up'?'↑':p.trend==='down'?'↓':'→'}</td><td className="py-2 text-center">{p.flag&&<span className="text-red-400">🚩</span>}</td></tr>)}</tbody></table></Card></div>}
      {mpTab==='individual'&&<div className="space-y-4">{flagged.map((p,i)=><Card key={i} className="border-red-600/30"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="text-red-400 font-bold text-sm">🚩</span><span className="text-sm font-bold text-white">{p.player}</span><span className={`text-lg font-bold ${p.score<6?'text-red-400':p.score<7?'text-amber-400':'text-green-400'}`}>{p.score}/10</span></div><span className="text-xs text-gray-500">Trend: {p.trend==='down'?'↓ Declining':'→ Stable'}</span></div><p className="text-xs text-gray-300 leading-relaxed mb-3">{p.note}</p><div className="flex gap-2"><button className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 hover:text-white">Log update</button><button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-purple-600/30">Schedule session →</button></div></Card>)}</div>}
      {mpTab==='support'&&<div className="space-y-4"><Card><div className="text-sm font-semibold text-white mb-3">Support Services</div><div className="grid grid-cols-2 gap-3">{[{name:'Dr Anna Reid',role:'Performance Psychologist',type:'In-house',sessions:'3/wk'},{name:'PFA Wellbeing Service',role:'Player support',type:'External',sessions:'On demand'},{name:'Mind Charity',role:'Referral pathway',type:'External',sessions:'On referral'},{name:'RFU HeadSmart',role:'Concussion MH support',type:'RFU',sessions:'HIA players'}].map((s,i)=><div key={i} className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-xs text-white font-medium">{s.name}</div><div className="text-[10px] text-gray-500">{s.role} · {s.type}</div><div className="text-[10px] text-purple-400 mt-1">{s.sessions}</div></div>)}</div></Card><Card><div className="text-sm font-semibold text-white mb-3">Session Log — April 2026</div>{[{date:'Fri 11 Apr',player:'Danny Foster',type:'Performance psych',provider:'Dr Reid',note:'HIA confidence + return'},{date:'Thu 10 Apr',player:'Danny Cole',type:'Performance psych',provider:'Dr Reid',note:'Form + contract anxiety'},{date:'Wed 9 Apr',player:'Ryan Patel',type:'Performance psych',provider:'Dr Reid',note:'Injury frustration + RTP'},{date:'Tue 8 Apr',player:'Group',type:'Team session',provider:'Dr Reid',note:'Pre-match resilience'}].map((s,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0 text-xs"><div><span className="text-white font-medium">{s.player}</span><span className="text-gray-500 ml-2">{s.type} · {s.provider}</span><div className="text-[10px] text-gray-600 mt-0.5">{s.note}</div></div><span className="text-gray-500 flex-shrink-0 ml-4">{s.date}</span></div>)}</Card></div>}
      {mpTab==='checkin'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-3">Monthly Status</div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"><StatCard label="Completed" value="24" sub="Of 38" color="green"/><StatCard label="Outstanding" value="14" sub="Reminder sent Mon" color="amber"/><StatCard label="Flagged" value="3" sub="Below 6.5" color="red"/><StatCard label="Avg response" value="8 min" sub="Kitman Labs app" color="blue"/></div><div className="text-xs text-gray-400">Check-ins via Kitman Labs app. 6 areas (Energy, Mood, Sleep, Motivation, Soreness, Wellbeing). Below 6.5 triggers auto welfare flag.</div></Card><Card><div className="text-sm font-semibold text-white mb-3">Outstanding — Action Required</div>{['Danny Foster','Ryan Patel','Phil Dowd','Karl Briggs','Jake Rawlings','Connor Walsh','Ben Taylor','Callum Reeves'].map((name,i)=><div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0 text-xs"><span className="text-amber-400">{name}</span><button className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-500 hover:text-gray-300">Send reminder</button></div>)}</Card></div>}
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
function MediaPRRugbyView({club:_club}:{club:RugbyClub}){const[activeTab,setActiveTab]=useState<'requests'|'calendar'|'coverage'|'guidelines'>('requests');const REQUESTS=[{id:1,outlet:'Rugby World',type:'Feature',contact:'Dan Carter (ed.)',subject:'Championship clubs and franchise pathway — Hartfield RFC case study',deadline:'18 Apr 2026',urgency:'high',status:'Pending approval',notes:'National rugby magazine. Franchise readiness story is well-timed.',recommended:'Accept — franchise exposure before assessments.'},{id:2,outlet:'BBC Sport Rugby',type:'Interview',contact:'Sian Hughes',subject:'Danny Foster HIA — concussion protocol best practice',deadline:'15 Apr 2026',urgency:'urgent',status:'Handle with care',notes:'Sensitive. Do NOT discuss medical details. Welfare Lead must approve.',recommended:'Decline medical specifics. Offer welfare statement.'},{id:3,outlet:'Champ Rugby Podcast',type:'Podcast',contact:'Mike Selby',subject:'DoR Steve Whitfield — season review and promotion push',deadline:'22 Apr 2026',urgency:'medium',status:'Pending approval',notes:'Championship-specific audience. Good DoR platform.',recommended:'Accept — strong fit for DoR profile.'},{id:4,outlet:'Local Gazette',type:'Preview',contact:'Rachel Moore',subject:'vs Jersey Reds Saturday — preview and ticket info',deadline:'Thu 10 Apr',urgency:'low',status:'Approved',notes:'Standard pre-match local press.',recommended:'Already approved.'}];const COVERAGE=[{date:'5 Apr',outlet:'Rugby World',headline:'Hartfield RFC among Champ clubs closest to franchise criteria',reach:'48k',sentiment:'positive'},{date:'2 Apr',outlet:'BBC Sport Rugby',headline:'Championship Round 17 — Hartfield lose to Bath 18–24',reach:'180k',sentiment:'neutral'},{date:'29 Mar',outlet:'Champ Rugby Podcast',headline:'Episode 112 — Hartfield RFC season deep dive',reach:'22k',sentiment:'positive'},{date:'22 Mar',outlet:'Local Gazette',headline:'Hartfield RFC win at Doncaster — season back on track',reach:'8k',sentiment:'positive'},{date:'15 Mar',outlet:'Rugby Pass',headline:'Championship salary cap — which clubs are closest to ceiling?',reach:'31k',sentiment:'neutral'}];const urgencyStyle=(u:string)=>u==='urgent'?'bg-red-600/20 text-red-400 border border-red-600/30':u==='high'?'bg-amber-600/20 text-amber-400':u==='medium'?'bg-blue-600/20 text-blue-400':'bg-gray-800 text-gray-500';return(<div className="space-y-6"><QuickActionsBar/><SectionHeader icon="📣" title="Media & PR" subtitle="Requests · Calendar · Coverage log · Guidelines"/><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Open Requests" value="3" sub="1 urgent · 2 pending" color="amber"/><StatCard label="Coverage (month)" value="5" sub="4 positive · 1 neutral" color="green"/><StatCard label="Total Reach" value="289k" sub="Cumulative this month" color="purple"/><StatCard label="Next Press Day" value="Sat" sub="vs Jersey Reds matchday" color="blue"/></div><div className="flex gap-1 border-b border-gray-800">{([{id:'requests' as const,label:'Requests',icon:'📬'},{id:'calendar' as const,label:'PR Calendar',icon:'📅'},{id:'coverage' as const,label:'Coverage',icon:'📰'},{id:'guidelines' as const,label:'Guidelines',icon:'📋'}]).map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>{activeTab==='requests'&&<div className="space-y-4">{REQUESTS.map(r=><Card key={r.id} className={r.urgency==='urgent'?'border-red-600/40':r.urgency==='high'?'border-amber-600/30':''}><div className="flex items-start justify-between mb-2"><div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white">{r.outlet}</span><span className={`text-[10px] px-2 py-0.5 rounded ${urgencyStyle(r.urgency)}`}>{r.urgency==='urgent'?'🔴 URGENT':r.urgency==='high'?'🟡 High':r.urgency==='medium'?'Medium':'Low'}</span><span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400">{r.type}</span></div><p className="text-xs text-gray-300 font-medium">{r.subject}</p><p className="text-[10px] text-gray-600">Contact: {r.contact} · Deadline: {r.deadline}</p></div><span className={`text-[10px] px-2 py-1 rounded font-medium flex-shrink-0 ml-4 ${r.status==='Approved'?'bg-green-600/20 text-green-400':r.status==='Handle with care'?'bg-red-600/20 text-red-400':'bg-amber-600/20 text-amber-400'}`}>{r.status}</span></div><p className="text-xs text-gray-400 mb-2">{r.notes}</p><div className="flex items-center justify-between pt-2 border-t border-gray-800"><p className="text-[10px] text-purple-400">💡 {r.recommended}</p>{r.status!=='Approved'&&r.status!=='Handle with care'&&<div className="flex gap-2"><button className="px-3 py-1 rounded text-[10px] bg-gray-800 text-gray-400 hover:text-white">Decline</button><button className="px-3 py-1 rounded text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white">Accept →</button></div>}</div></Card>)}</div>}{activeTab==='coverage'&&<div className="space-y-4"><div className="grid grid-cols-3 gap-4"><StatCard label="Positive" value="4/5" sub="This month" color="green"/><StatCard label="Reach" value="289k" sub="Cumulative" color="purple"/><StatCard label="Top outlet" value="BBC" sub="180k reach" color="blue"/></div><Card><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider"><th className="text-left py-2">Date</th><th className="text-left py-2">Outlet</th><th className="text-left py-2">Headline</th><th className="text-center py-2">Reach</th><th className="text-center py-2">Sentiment</th></tr></thead><tbody>{COVERAGE.map((c,i)=><tr key={i} className="border-b border-gray-800/40"><td className="py-2 text-gray-500">{c.date}</td><td className="py-2 text-gray-300 font-medium">{c.outlet}</td><td className="py-2 text-gray-400">{c.headline}</td><td className="py-2 text-center text-purple-400 font-bold">{c.reach}</td><td className="py-2 text-center"><span className={`text-xs font-medium ${c.sentiment==='positive'?'text-green-400':'text-gray-400'}`}>{c.sentiment==='positive'?'↑ Positive':'→ Neutral'}</span></td></tr>)}</tbody></table></div></Card></div>}{activeTab==='calendar'&&<Card><div className="text-sm font-semibold text-white mb-4">PR & Media Calendar — April / May 2026</div><div className="divide-y divide-gray-800">{[{date:'Thu 10 Apr',items:[{time:'11:00',type:'Press conf',label:'Pre-match presser — Jersey Reds'},{time:'14:00',type:'Deadline',label:'Local Gazette preview copy'}]},{date:'Sat 12 Apr',items:[{time:'12:30',type:'Matchday',label:'Media accreditation — The Grange'},{time:'15:00',type:'Matchday',label:'KO vs Jersey Reds'},{time:'17:00',type:'Post-match',label:'Mixed zone + Head Coach interview'}]},{date:'Wed 16 Apr',items:[{time:'—',type:'Deadline',label:'Rugby World feature submission'}]},{date:'22 Apr',items:[{time:'TBC',type:'Podcast',label:'Champ Rugby Podcast — DoR'}]}].map((day,i)=><div key={i} className="flex gap-4 py-3"><div className="w-20 flex-shrink-0"><div className="text-xs font-bold text-white">{day.date}</div></div><div className="flex-1 space-y-1.5">{day.items.map((item,j)=><div key={j} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-gray-900/30 border border-gray-800/30"><span className="text-[10px] text-gray-600 w-10 flex-shrink-0">{item.time}</span><span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${item.type==='Matchday'?'bg-purple-600/20 text-purple-400':item.type==='Press conf'?'bg-blue-600/20 text-blue-400':item.type==='Deadline'?'bg-red-600/20 text-red-400':item.type==='Podcast'?'bg-amber-600/20 text-amber-400':'bg-gray-800 text-gray-500'}`}>{item.type}</span><span className="text-xs text-gray-300">{item.label}</span></div>)}</div></div>)}</div></Card>}{activeTab==='guidelines'&&<div className="space-y-4"><div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4"><p className="text-xs text-amber-300">All media requests must be approved by Communications lead. Restricted topics require additional department head sign-off.</p></div><Card><div className="text-sm font-semibold text-white mb-3">Media Response Guidelines</div><div className="divide-y divide-gray-800">{[{topic:'Player medical / HIA',rule:'NO comment. Refer to club medical statement template.',restricted:true},{topic:'Salary cap details',rule:'No specific figures. "We are compliant with all Championship Rugby regulations."',restricted:true},{topic:'Transfer speculation',rule:'"Hartfield RFC does not comment on player movements."',restricted:true},{topic:'Franchise readiness',rule:'CEO or DoR only. Positive messaging.',restricted:false},{topic:'Match results',rule:'Head Coach or DoR only post-match.',restricted:false},{topic:'Academy players (U21)',rule:'Parental consent required. Academy Director approves.',restricted:true}].map((g,i)=><div key={i} className={`py-3 ${g.restricted?'bg-red-600/5 px-2 -mx-2 rounded':''}`}><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-white">{g.topic}</span>{g.restricted&&<span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/20 text-red-400">🔒 Restricted</span>}</div><p className="text-xs text-gray-400">{g.rule}</p></div>)}</div></Card></div>}</div>)}

function FanHubRugbyView({club:_club}:{club:RugbyClub}){const[activeTab,setActiveTab]=useState<'overview'|'forum'|'events'|'memberships'>('overview');const FORUM_TOPICS=[{id:1,cat:'Match Discussion',title:'Jersey Reds (H) — Match thread 🏉',posts:62,views:940,hot:true,last:'1h ago'},{id:2,cat:'Franchise',title:'Franchise readiness — how close are we really?',posts:88,views:1480,hot:true,last:'3h ago'},{id:3,cat:'Recruitment',title:'Summer window wishlist — who do we need?',posts:104,views:1820,hot:true,last:'45m ago'},{id:4,cat:'Match Discussion',title:'Bath away post-match — disappointing 2nd half',posts:44,views:680,hot:false,last:'8h ago'},{id:5,cat:'General',title:'Season tickets 2026/27 — pricing thoughts?',posts:38,views:560,hot:false,last:'1d ago'},{id:6,cat:'Academy',title:'Tom Foley — ready for first team start?',posts:31,views:490,hot:false,last:'2d ago'},{id:7,cat:'Commercial',title:'New kit launch reaction — love/hate thread',posts:72,views:1120,hot:true,last:'2h ago'}];const MEMBERS=[{name:'Supporter',price:'£20/yr',count:488,features:['Forum access','Match notifications','Monthly newsletter','Early ticket access (24h)'],color:'border-gray-700',badge:'bg-gray-800 text-gray-400'},{name:'Club Member',price:'£45/yr',count:214,features:['Everything in Supporter','Annual meet-the-players','Training ground access (1/yr)','Member kit discount (10%)','Monthly DoR Q&A'],color:'border-purple-600/40',badge:'bg-purple-600/20 text-purple-400'},{name:'Franchise',price:'£120/yr',count:48,features:['Everything in Club Member','Board room matchday hospitality','Named in franchise EOI document','Franchise progress briefing (quarterly)','Signed squad photo'],color:'border-amber-600/40',badge:'bg-amber-600/20 text-amber-400'}];const EVENTS=[{date:'Sat 11 Apr',event:'Fan Zone — Jersey Reds (H)',type:'Matchday',tickets:'Free entry'},{date:'Sun 19 Apr',event:'Club Member Q&A — DoR Steve Whitfield',type:'Members',tickets:'Members only'},{date:'Sat 26 Apr',event:'Open training — fan day',type:'All fans',tickets:'RSVP required'},{date:'Sat 3 May',event:'Hartfield Building Society hospitality',type:'Sponsor',tickets:'Invite only'},{date:'Sat 10 May',event:'Season finale — fan day vs Saracens',type:'All fans',tickets:'Free entry'},{date:'Sun 25 May',event:'End of season awards night',type:'Members',tickets:'Club Members+'},{date:'Sat 20 Jun',event:'New kit launch — Fan Hub members first',type:'All fans',tickets:'Free entry'}];const catColor=(c:string)=>c==='Match Discussion'?'bg-purple-600/20 text-purple-400':c==='Franchise'?'bg-amber-600/20 text-amber-400':c==='Recruitment'?'bg-blue-600/20 text-blue-400':c==='Academy'?'bg-teal-600/20 text-teal-400':c==='Commercial'?'bg-green-600/20 text-green-400':'bg-gray-800 text-gray-500';const GROWTH=[620,740,820,910,1010,1120,1240,1520,1820,2140];const G_LABELS=['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];const GW=500,GH=130,gPL=36,gPR=12,gPT=16,gPB=28;const gIW=GW-gPL-gPR,gIH=GH-gPT-gPB;const gMin=500,gMax=2500,gStepX=gIW/(GROWTH.length-1);const gPath=GROWTH.map((v,i)=>`${i===0?'M':'L'} ${gPL+i*gStepX} ${gPT+gIH-((v-gMin)/(gMax-gMin))*gIH}`).join(' ');const gArea=`${gPath} L ${gPL+(GROWTH.length-1)*gStepX} ${gPT+gIH} L ${gPL} ${gPT+gIH} Z`;const totalMembers=MEMBERS.reduce((s,m)=>s+m.count,0);return(<div className="space-y-6"><QuickActionsBar/><SectionHeader icon="💜" title="Fan Hub" subtitle={`${totalMembers.toLocaleString()} members · Forum · Events · Memberships`}/><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Members" value={totalMembers.toLocaleString()} sub="+380 this season" color="purple"/><StatCard label="Forum Posts" value="359" sub="This month" color="blue"/><StatCard label="Events" value="7" sub="Apr–Jun 2026" color="teal"/><StatCard label="Membership rev" value="£28.3k" sub="YTD" color="green"/></div><div className="flex gap-1 border-b border-gray-800">{([{id:'overview' as const,label:'Overview',icon:'📊'},{id:'forum' as const,label:'Forum',icon:'💬'},{id:'events' as const,label:'Events',icon:'🎟️'},{id:'memberships' as const,label:'Memberships',icon:'🏅'}]).map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>{activeTab==='overview'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-1">Member Growth — Season</div><p className="text-xs text-gray-500 mb-4">620 → {totalMembers.toLocaleString()} (+245%)</p><svg viewBox={`0 0 ${GW} ${GH}`} width="100%">{[0,0.5,1].map((t,i)=><line key={i} x1={gPL} x2={GW-gPR} y1={gPT+gIH-t*gIH} y2={gPT+gIH-t*gIH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}<path d={gArea} fill="#8B5CF6" opacity="0.08"/><path d={gPath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{GROWTH.map((v,i)=><g key={i}><circle cx={gPL+i*gStepX} cy={gPT+gIH-((v-gMin)/(gMax-gMin))*gIH} r="3.5" fill="#8B5CF6"/><text x={gPL+i*gStepX} y={GH-4} fontSize="9" fill="#6B7280" textAnchor="middle">{G_LABELS[i]}</text></g>)}</svg></Card><Card><div className="text-sm font-semibold text-white mb-3">Trending Topics</div><div className="space-y-2">{FORUM_TOPICS.filter(t=>t.hot).map((t,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"><div className="flex items-center gap-3"><span className="text-orange-400 text-xs">🔥</span><div><div className="text-xs text-gray-200">{t.title}</div><div className="flex items-center gap-2 mt-0.5"><span className={`text-[9px] px-1.5 py-0.5 rounded ${catColor(t.cat)}`}>{t.cat}</span><span className="text-[10px] text-gray-600">{t.last}</span></div></div></div><div className="text-right flex-shrink-0 ml-4"><div className="text-xs text-purple-400 font-bold">{t.posts} posts</div><div className="text-[10px] text-gray-600">{t.views.toLocaleString()} views</div></div></div>)}</div></Card></div>}{activeTab==='forum'&&<Card><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider"><th className="text-left py-2">Topic</th><th className="text-left py-2">Category</th><th className="text-center py-2">Posts</th><th className="text-center py-2">Views</th><th className="text-center py-2">Last</th></tr></thead><tbody>{FORUM_TOPICS.map((t,i)=><tr key={i} className="border-b border-gray-800/40 hover:bg-white/[0.01]"><td className="py-2"><div className="flex items-center gap-2">{t.hot&&<span className="text-orange-400">🔥</span>}<span className="text-gray-200">{t.title}</span></div></td><td className="py-2"><span className={`text-[10px] px-2 py-0.5 rounded ${catColor(t.cat)}`}>{t.cat}</span></td><td className="py-2 text-center text-purple-400 font-bold">{t.posts}</td><td className="py-2 text-center text-gray-400">{t.views.toLocaleString()}</td><td className="py-2 text-center text-gray-500 text-[10px]">{t.last}</td></tr>)}</tbody></table></Card>}{activeTab==='events'&&<div className="space-y-3">{EVENTS.map((e,i)=><Card key={i}><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white">{e.event}</span><span className={`text-[10px] px-2 py-0.5 rounded ${e.type==='Matchday'?'bg-purple-600/20 text-purple-400':e.type==='Members'?'bg-blue-600/20 text-blue-400':e.type==='Sponsor'?'bg-amber-600/20 text-amber-400':'bg-green-600/20 text-green-400'}`}>{e.type}</span></div><div className="flex items-center gap-3 text-[10px] text-gray-500"><span>📅 {e.date}</span><span>🎟️ {e.tickets}</span></div></div></div></Card>)}</div>}{activeTab==='memberships'&&<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-3 gap-5">{MEMBERS.map((m,i)=><div key={i} className={`bg-[#0D1117] border-2 rounded-xl p-5 ${m.color}`}><div className="flex items-center justify-between mb-3"><div><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${m.badge}`}>{m.name}</span><div className="text-xl font-bold text-white mt-2">{m.price}</div></div><div className="text-right"><div className="text-lg font-bold text-purple-400">{m.count}</div><div className="text-[10px] text-gray-600">members</div></div></div><div className="space-y-1.5">{m.features.map((f,j)=><div key={j} className="flex items-start gap-1.5 text-xs text-gray-300"><span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>{f}</div>)}</div></div>)}</div><Card><div className="text-sm font-semibold text-white mb-4">Revenue — YTD</div><div className="space-y-3">{[{tier:'Supporter',count:488,annual:20,color:'#6B7280'},{tier:'Club Member',count:214,annual:45,color:'#8B5CF6'},{tier:'Franchise',count:48,annual:120,color:'#F59E0B'}].map((r,i)=>{const rev=r.count*r.annual;return(<div key={i}><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{r.tier} ({r.count} × £{r.annual})</span><span className="text-white font-bold">£{rev.toLocaleString()}</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${(rev/9630)*100}%`,backgroundColor:r.color}}/></div></div>)})}<div className="pt-3 border-t border-gray-800 flex justify-between text-sm"><span className="text-gray-400 font-medium">Total YTD</span><span className="text-purple-400 font-bold">£{(488*20+214*45+48*120).toLocaleString()}</span></div></div></Card></div>}</div>)}

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

function SetPieceAnalyticsView() {
  const [spTab, setSpTab] = useState<'lineout'|'scrum'|'restart'|'goalkicking'>('lineout');
  const LINEOUT={season:{won:68,lost:12,stolen:4,total:80,successPct:85,oppWon:72,oppStolen:8},byZone:[{zone:'Own 22',won:18,lost:2,pct:90,note:'Strong — reliable ball'},{zone:'Midfield',won:28,lost:6,pct:82,note:'Occasional steal risk'},{zone:'Opp 22',won:22,lost:4,pct:85,note:'Good — clean platform'}],calls:[{call:'Front ball (#2)',used:28,success:25,pct:89,note:'Most reliable'},{call:'Middle lift (#4)',used:22,success:18,pct:82,note:'Good in midfield'},{call:'Back peel (#6)',used:18,success:14,pct:78,note:'Opposition learning'},{call:'Dummy front',used:12,success:11,pct:92,note:'Use more — highest %'}],weeklyWon:[82,79,88,85,90,83,85,87],weeklyLabels:['W8','W9','W10','W11','W12','W13','W14','W15']};
  const SCRUM={season:{won:44,lost:18,penFor:12,penAgainst:8,total:62,successPct:71},byOutcome:[{outcome:'Clean ball',n:36,pct:58},{outcome:'Pen won',n:12,pct:19},{outcome:'Reset',n:6,pct:10},{outcome:'Pen conceded',n:8,pct:13}],weeklyPct:[68,72,65,74,71,69,73,71],weeklyLabels:['W8','W9','W10','W11','W12','W13','W14','W15']};
  const RESTART={kickoffs:{retained:14,total:18,retentionPct:78},dropouts:{retained:6,total:8,retentionPct:75},opposition:{ourSteal:32}};
  const KICKING={season:{attempts:42,converted:34,successPct:81},byZone:[{zone:'Central (<25m)',attempts:8,converted:8,pct:100},{zone:'Central (25–40m)',attempts:14,converted:13,pct:93},{zone:'Left angle',attempts:10,converted:7,pct:70},{zone:'Right angle',attempts:10,converted:6,pct:60}],kicker:'Danny Cole',pressureConversion:72};
  const spBar = (data:number[],labels:string[],color:string,max=100) => {const W=520,H=120,pL=24,pR=8,pT=12,pB=28,iW=W-pL-pR,iH=H-pT-pB,bw=(iW/data.length)*0.55,bg=iW/data.length;return<svg viewBox={`0 0 ${W} ${H}`} width="100%">{[0,0.5,1].map((t,i)=><line key={i} x1={pL} x2={W-pR} y1={pT+iH-t*iH} y2={pT+iH-t*iH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}{data.map((v,i)=>{const bh=(v/max)*iH;const x=pL+i*bg+(bg-bw)/2;const bc=v>=85?'#22C55E':v>=75?color:v>=65?'#F59E0B':'#EF4444';return<g key={i}><rect x={x} y={pT+iH-bh} width={bw} height={bh} fill={bc} opacity="0.8" rx="2"/><text x={x+bw/2} y={pT+iH-bh-3} fontSize="8" fill={bc} textAnchor="middle" fontWeight="bold">{v}%</text><text x={x+bw/2} y={H-4} fontSize="8" fill="#6B7280" textAnchor="middle">{labels[i]}</text></g>;})}</svg>;};
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="📐" title="Set Piece Analytics" subtitle="FrameSports auto-tagged · Lineout · Scrum · Restarts · Goal-kicking"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Lineout Win%" value={`${LINEOUT.season.successPct}%`} sub={`${LINEOUT.season.won}/${LINEOUT.season.total}`} color="green"/><StatCard label="Scrum Win%" value={`${SCRUM.season.successPct}%`} sub={`${SCRUM.season.won}/${SCRUM.season.total}`} color="orange"/><StatCard label="Restart Retention" value={`${RESTART.kickoffs.retentionPct}%`} sub={`${RESTART.kickoffs.retained}/${RESTART.kickoffs.total}`} color="purple"/><StatCard label="Goal Kicking" value={`${KICKING.season.successPct}%`} sub={`${KICKING.season.converted}/${KICKING.season.attempts}`} color="green"/></div>
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">{([{id:'lineout',label:'Lineout',icon:'🤲'},{id:'scrum',label:'Scrum',icon:'💪'},{id:'restart',label:'Restarts',icon:'🏉'},{id:'goalkicking',label:'Goal-Kicking',icon:'🎯'}] as const).map(t=><button key={t.id} onClick={()=>setSpTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${spTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>
      {spTab==='lineout'&&<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Card><div className="text-sm font-semibold text-white mb-3">Win % by Zone</div>{LINEOUT.byZone.map((z,i)=><div key={i} className="mb-3"><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{z.zone}</span><span className={`font-bold ${z.pct>=85?'text-green-400':'text-amber-400'}`}>{z.pct}%</span></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full bg-purple-500" style={{width:`${z.pct}%`}}/></div><div className="text-[10px] text-gray-600 mt-0.5">{z.note}</div></div>)}</Card><Card><div className="text-sm font-semibold text-white mb-3">Call Success</div>{LINEOUT.calls.map((c,i)=><div key={i} className="py-2 border-b border-gray-800/50 last:border-0"><div className="flex justify-between text-xs mb-1"><span className="text-gray-300">{c.call}</span><span className={`font-bold ${c.pct>=88?'text-green-400':c.pct>=80?'text-amber-400':'text-red-400'}`}>{c.pct}%</span></div><div className="flex items-center gap-3"><div className="flex-1 bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-purple-500" style={{width:`${c.pct}%`}}/></div><span className="text-[10px] text-gray-500">{c.used} used</span></div><div className="text-[10px] text-gray-600 mt-0.5">{c.note}</div></div>)}</Card></div><Card><div className="text-sm font-semibold text-white mb-3">Last 8 Matches</div>{spBar(LINEOUT.weeklyWon,LINEOUT.weeklyLabels,'#8B5CF6')}</Card><Card><div className="text-sm font-semibold text-white mb-3">Opposition Lineout</div><div className="grid grid-cols-3 gap-4 text-center text-xs"><div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-2xl font-bold text-red-400">{LINEOUT.season.oppWon}</div><div className="text-gray-500 mt-1">Opp won</div></div><div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-2xl font-bold text-green-400">{LINEOUT.season.oppStolen}</div><div className="text-gray-500 mt-1">We stole</div></div><div className="bg-[#0a0c14] border border-gray-800 rounded-lg p-3"><div className="text-2xl font-bold text-amber-400">{Math.round((LINEOUT.season.oppStolen/(LINEOUT.season.oppWon+LINEOUT.season.oppStolen))*100)}%</div><div className="text-gray-500 mt-1">Steal rate</div></div></div></Card></div>}
      {spTab==='scrum'&&<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Card><div className="text-sm font-semibold text-white mb-3">Outcomes (Season)</div>{SCRUM.byOutcome.map((o,i)=><div key={i} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{o.outcome}</span><span className="text-white">{o.n} ({o.pct}%)</span></div><div className="w-full bg-gray-800 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${o.pct}%`,backgroundColor:i===0?'#22C55E':i===1?'#8B5CF6':i===2?'#F59E0B':'#EF4444'}}/></div></div>)}<div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-3 text-xs text-center"><div className="bg-green-600/10 rounded-lg p-2"><div className="text-green-400 font-bold text-lg">{SCRUM.season.penFor}</div><div className="text-gray-500">Pen won</div></div><div className="bg-red-600/10 rounded-lg p-2"><div className="text-red-400 font-bold text-lg">{SCRUM.season.penAgainst}</div><div className="text-gray-500">Pen against</div></div></div></Card><Card><div className="text-sm font-semibold text-white mb-3">Last 8 Matches</div>{spBar(SCRUM.weeklyPct,SCRUM.weeklyLabels,'#8B5CF6')}<div className="mt-3 text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 rounded-lg p-2">⚠ 71% — below 75% target. Jersey concede 38% scrum pen rate.</div></Card></div></div>}
      {spTab==='restart'&&<div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Kickoff Ret." value={`${RESTART.kickoffs.retentionPct}%`} sub={`${RESTART.kickoffs.retained}/${RESTART.kickoffs.total}`} color="green"/><StatCard label="Dropout Ret." value={`${RESTART.dropouts.retentionPct}%`} sub={`${RESTART.dropouts.retained}/${RESTART.dropouts.total}`} color="teal"/><StatCard label="Opp Stolen" value={`${RESTART.opposition.ourSteal}%`} sub="Of opp kickoffs" color="purple"/><StatCard label="Chase Success" value="82%" sub="Kick to challenge" color="orange"/></div><Card><div className="text-sm font-semibold text-white mb-3">Restart Patterns</div>{[{l:'Short kick (chase)',u:9,r:8,n:'Most effective'},{l:'Long to 10 channel',u:6,r:4,n:'Contested'},{l:'Long to 15',u:3,r:2,n:'Avoid until Barnes fit'}].map((r,i)=><div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-xs"><div><div className="text-gray-300 font-medium">{r.l}</div><div className="text-[10px] text-gray-600">{r.n}</div></div><div className="text-right"><div className={`text-sm font-bold ${(r.r/r.u)>=0.8?'text-green-400':'text-amber-400'}`}>{Math.round((r.r/r.u)*100)}%</div><div className="text-[10px] text-gray-600">{r.r}/{r.u}</div></div></div>)}</Card></div>}
      {spTab==='goalkicking'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-3">By Zone — {KICKING.kicker}</div>{KICKING.byZone.map((z,i)=><div key={i} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{z.zone}</span><span className={`font-bold ${z.pct>=85?'text-green-400':z.pct>=70?'text-amber-400':'text-red-400'}`}>{z.pct}% ({z.converted}/{z.attempts})</span></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="h-2 rounded-full" style={{width:`${z.pct}%`,backgroundColor:z.pct>=85?'#22C55E':z.pct>=70?'#F59E0B':'#EF4444'}}/></div></div>)}<div className="mt-4 pt-3 border-t border-gray-800 text-xs text-amber-400">⚠ Right-angle at 60% — focus Thursday.</div></Card><div className="grid grid-cols-3 gap-4"><StatCard label="Season" value={`${KICKING.season.successPct}%`} sub={`${KICKING.season.converted}/${KICKING.season.attempts}`} color="green"/><StatCard label="Pressure" value={`${KICKING.pressureConversion}%`} sub="Close games" color="amber"/><StatCard label="Points" value="102" sub="From boot" color="purple"/></div></div>}
      <div className="text-[10px] text-gray-700">FrameSports auto-tagging · Pay-per-game · Uploaded within 2h</div>
    </div>
  );
}

function CarryAnalyticsView() {
  const [caTab, setCaTab] = useState<'gainline'|'topcarriers'|'patterns'|'trends'>('gainline');
  const SEASON={totalCarries:648,gainlineWon:398,gainlineLost:186,gainlineContested:64,gainlinePct:61,defendersBeaten:184,lineBreaks:28,offloads:112,aveMetresPerCarry:4.2,bench:{gainline:56,defendersBeaten:14,lineBreaks:2.1}};
  const CARRIERS=[{name:'Danny Foster',pos:'No.8',carries:128,glWon:84,lb:8,db:32,offloads:18,avg:4.9,acwr:1.38},{name:'Luke Barnes',pos:'FB',carries:142,glWon:92,lb:7,db:28,offloads:8,avg:5.4,acwr:1.52},{name:'Matt Jones',pos:'Centre',carries:98,glWon:61,lb:5,db:24,offloads:14,avg:3.8,acwr:1.12},{name:'Marcus Webb',pos:'Lock',carries:88,glWon:52,lb:4,db:18,offloads:22,avg:3.2,acwr:1.12},{name:'Karl Foster',pos:'Flanker',carries:94,glWon:56,lb:2,db:14,offloads:28,avg:2.9,acwr:1.44},{name:'David Obi',pos:'Centre',carries:98,glWon:53,lb:2,db:22,offloads:12,avg:3.4,acwr:1.08}];
  const MATCH_TREND=[{m:'W8',g:58},{m:'W9',g:64},{m:'W10',g:55},{m:'W11',g:68},{m:'W12',g:62},{m:'W13',g:59},{m:'W14',g:66},{m:'W15',g:61}];
  const PATTERNS=[{p:'First-phase (0–2)',n:214,g:68,note:'Most effective — exploit early'},{p:'Third-phase+',n:186,g:54,note:'Defence organised — consider kick'},{p:'Short-side (blind)',n:98,g:72,note:'High success — underused'},{p:'Pick-and-go',n:112,g:58,note:'Standard — manage prop ACWR'},{p:'Ball from hands (wide)',n:38,g:61,note:'Growing — Barnes effective'}];
  const W2=560,H2=160,pL2=36,pR2=12,pT2=16,pB2=32,iW2=W2-pL2-pR2,iH2=H2-pT2-pB2;
  const glPath=MATCH_TREND.map((d,i)=>`${i===0?'M':'L'} ${pL2+(i/(MATCH_TREND.length-1))*iW2} ${pT2+iH2-((d.g-40)/40)*iH2}`).join(' ');
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="⚡" title="Carry Analytics" subtitle="Gainline · Defenders beaten · Line breaks · Offloads — FrameSports"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Gainline Win%" value={`${SEASON.gainlinePct}%`} sub={`Bench: ${SEASON.bench.gainline}%`} color="green"/><StatCard label="Def Beaten" value={SEASON.defendersBeaten} sub={`${(SEASON.defendersBeaten/16).toFixed(1)}/match`} color="purple"/><StatCard label="Line Breaks" value={SEASON.lineBreaks} sub={`${(SEASON.lineBreaks/16).toFixed(1)}/match`} color="teal"/><StatCard label="Offloads" value={SEASON.offloads} sub={`${SEASON.aveMetresPerCarry}m/carry`} color="orange"/></div>
      <div className="flex gap-1 border-b border-gray-800">{([{id:'gainline',label:'Gainline',icon:'📈'},{id:'topcarriers',label:'Top Carriers',icon:'🏉'},{id:'patterns',label:'Patterns',icon:'🗺️'},{id:'trends',label:'Trend',icon:'📉'}] as const).map(t=><button key={t.id} onClick={()=>setCaTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px whitespace-nowrap ${caTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>
      {caTab==='gainline'&&<div className="space-y-5"><Card><div className="text-sm font-semibold text-white mb-4">Gainline Breakdown ({SEASON.totalCarries} carries)</div><div className="grid grid-cols-3 gap-4 text-center mb-4"><div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4"><div className="text-3xl font-bold text-green-400">{SEASON.gainlineWon}</div><div className="text-xs text-gray-400 mt-1">Won ({SEASON.gainlinePct}%)</div></div><div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4"><div className="text-3xl font-bold text-red-400">{SEASON.gainlineLost}</div><div className="text-xs text-gray-400 mt-1">Lost ({Math.round(SEASON.gainlineLost/SEASON.totalCarries*100)}%)</div></div><div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4"><div className="text-3xl font-bold text-amber-400">{SEASON.gainlineContested}</div><div className="text-xs text-gray-400 mt-1">Contested</div></div></div><div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex"><div className="h-full bg-green-500" style={{width:`${SEASON.gainlinePct}%`}}/><div className="h-full bg-amber-500" style={{width:`${Math.round(SEASON.gainlineContested/SEASON.totalCarries*100)}%`}}/><div className="h-full bg-red-500" style={{width:`${Math.round(SEASON.gainlineLost/SEASON.totalCarries*100)}%`}}/></div></Card></div>}
      {caTab==='topcarriers'&&<Card><div className="text-sm font-semibold text-white mb-3">Top Carriers — Season</div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider"><th className="text-left py-2">Player</th><th className="text-right py-2">Carries</th><th className="text-right py-2">GL%</th><th className="text-right py-2">LB</th><th className="text-right py-2">DB</th><th className="text-right py-2">Off</th><th className="text-right py-2">Avg m</th><th className="text-right py-2">ACWR</th></tr></thead><tbody>{CARRIERS.map((c,i)=>{const glP=Math.round((c.glWon/c.carries)*100);return<tr key={i} className="border-b border-gray-800/40"><td className="py-2"><div className="text-white font-medium">{c.name}</div><div className="text-gray-500 text-[10px]">{c.pos}</div></td><td className="py-2 text-right text-gray-200">{c.carries}</td><td className="py-2 text-right"><span className={`font-bold ${glP>=60?'text-green-400':'text-amber-400'}`}>{glP}%</span></td><td className="py-2 text-right text-purple-400 font-bold">{c.lb}</td><td className="py-2 text-right text-gray-200">{c.db}</td><td className="py-2 text-right text-teal-400">{c.offloads}</td><td className="py-2 text-right text-gray-200">{c.avg}m</td><td className={`py-2 text-right font-bold ${c.acwr>1.5?'text-red-400':c.acwr>1.3?'text-amber-400':'text-green-400'}`}>{c.acwr}</td></tr>;})}</tbody></table></div><div className="mt-3 p-3 bg-purple-600/10 border border-purple-600/20 rounded-lg text-xs text-purple-300">💡 Foster and Barnes lead line breaks but both carry elevated ACWR. Monitor load.</div></Card>}
      {caTab==='patterns'&&<Card><div className="text-sm font-semibold text-white mb-3">Carry Patterns — Gainline by Phase/Channel</div>{PATTERNS.map((p,i)=><div key={i} className="py-2 border-b border-gray-800/50 last:border-0"><div className="flex justify-between text-xs mb-1"><span className="text-gray-300">{p.p}</span><div className="flex gap-3"><span className="text-gray-500">{p.n} carries</span><span className={`font-bold ${p.g>=65?'text-green-400':p.g>=58?'text-amber-400':'text-red-400'}`}>{p.g}%</span></div></div><div className="w-full bg-gray-800 rounded-full h-1.5 mb-1"><div className="h-1.5 rounded-full bg-purple-500" style={{width:`${p.g}%`}}/></div><div className="text-[10px] text-gray-600">{p.note}</div></div>)}<div className="mt-4 bg-green-600/10 border border-green-600/20 rounded-lg p-3 text-xs text-green-400">✓ Short-side carries win gainline at 72% — highest — but only 15% of carries. Increase vs Jersey.</div></Card>}
      {caTab==='trends'&&<Card><div className="text-sm font-semibold text-white mb-3">Gainline % — Last 8</div><svg viewBox={`0 0 ${W2} ${H2}`} width="100%">{[0,0.25,0.5,0.75,1].map((t,i)=><line key={i} x1={pL2} x2={W2-pR2} y1={pT2+iH2-t*iH2} y2={pT2+iH2-t*iH2} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}<line x1={pL2} x2={W2-pR2} y1={pT2+iH2-0.5*iH2} y2={pT2+iH2-0.5*iH2} stroke="#22C55E" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/><path d={glPath} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{MATCH_TREND.map((d,i)=><g key={i}><circle cx={pL2+(i/(MATCH_TREND.length-1))*iW2} cy={pT2+iH2-((d.g-40)/40)*iH2} r="3.5" fill="#8B5CF6"/><text x={pL2+(i/(MATCH_TREND.length-1))*iW2} y={H2-4} fontSize="9" fill="#6B7280" textAnchor="middle">{d.m}</text></g>)}</svg></Card>}
    </div>
  );
}

// ─── PERIODISATION VIEW ──────────────────────────────────────────────────────
const DEMO_CLUB_FIXTURES=[{date:'11 Apr',opponent:'Jersey Reds',venue:'H',importance:'High'},{date:'18 Apr',opponent:'Bath RFC',venue:'A',importance:'Very High'},{date:'25 Apr',opponent:'Coventry',venue:'H',importance:'Medium'},{date:'2 May',opponent:'Doncaster',venue:'A',importance:'Medium'},{date:'9 May',opponent:'Saracens',venue:'H',importance:'Very High'},{date:'16 May',opponent:'Bedford',venue:'A',importance:'High'}];
const SEASON_WEEKS=[{week:1,label:'W1',phase:'Pre',planned:3200,actual:3050,match:false},{week:2,label:'W2',phase:'Pre',planned:3600,actual:3580,match:false},{week:3,label:'W3',phase:'Pre',planned:4000,actual:4120,match:false},{week:4,label:'W4',phase:'Pre',planned:3200,actual:3180,match:true},{week:5,label:'W5',phase:'Champ',planned:4400,actual:4380,match:true},{week:6,label:'W6',phase:'Champ',planned:4200,actual:4310,match:true},{week:7,label:'W7',phase:'Champ',planned:4600,actual:4480,match:true},{week:8,label:'W8',phase:'Champ',planned:4200,actual:4190,match:true},{week:9,label:'W9',phase:'Champ',planned:4800,actual:4920,match:true},{week:10,label:'W10',phase:'Champ',planned:4200,actual:4080,match:true},{week:11,label:'W11',phase:'Champ',planned:4600,actual:4750,match:true},{week:12,label:'W12',phase:'Champ',planned:3800,actual:3820,match:true},{week:13,label:'W13',phase:'Intl',planned:3000,actual:2980,match:false},{week:14,label:'W14',phase:'Champ',planned:4800,actual:4860,match:true},{week:15,label:'W15',phase:'Champ',planned:4600,actual:4780,match:true},{week:16,label:'W16',phase:'Champ',planned:4800,actual:0,match:true},{week:17,label:'W17',phase:'Champ',planned:4600,actual:0,match:true},{week:18,label:'W18',phase:'Champ',planned:5000,actual:0,match:true},{week:19,label:'W19',phase:'Play',planned:4200,actual:0,match:true},{week:20,label:'W20',phase:'Play',planned:5200,actual:0,match:true}];

function PeriodisationView() {
  const [perTab, setPerTab] = useState<'load'|'rotation'>('load');
  const [rotation, setRotation] = useState<string|null>(null);
  const [perLoading, setPerLoading] = useState(false);
  const generateRotation = async () => {
    setPerLoading(true);setRotation(null);
    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`You are S&C coordinator for Hartfield RFC (Championship Rugby). Generate a 6-week squad rotation plan. Fixtures: ${DEMO_CLUB_FIXTURES.map(f=>`${f.date} vs ${f.opponent} (${f.venue}) — ${f.importance}`).join('; ')}. GPS flags: Barnes ACWR 1.52 (overload), Foster 1.38, K.Foster 1.44. Injured: Briggs (shoulder, returns ~2 May), Patel (hamstring, ~18 Apr), D.Foster (HIA clears ~19 Apr). Bath (18 Apr) and Saracens (9 May) are priority matches. Format: ## 6-WEEK ROTATION PLAN (per fixture: selection note, load mgmt, target ACWR, academy opportunity) | ## PEAK WEEK MANAGEMENT | ## ACWR TARGETS — 6-WEEK. Under 500 words.`}]})});
      const data=await res.json();setRotation(data.content?.map((b:{type:string;text?:string})=>b.type==='text'?b.text:'').join('')||'Error.');
    } catch { setRotation('Connection error.'); }
    setPerLoading(false);
  };
  const renderMd=(text:string)=>text.split('\n').map((line,i)=>{if(line.startsWith('## '))return<h3 key={i} className="text-sm font-bold text-white mt-5 mb-2">{line.replace('## ','')}</h3>;if(line.startsWith('**')&&line.endsWith('**'))return<p key={i} className="text-sm font-bold text-purple-400 mt-4 mb-1">{line.replace(/\*\*/g,'')}</p>;if(line.startsWith('- '))return<div key={i} className="flex gap-2 text-xs text-gray-300 mb-1 ml-2"><span className="text-purple-500 flex-shrink-0">•</span><span>{line.slice(2)}</span></div>;if(line.trim()==='')return<div key={i} className="h-1"/>;return<p key={i} className="text-xs text-gray-300 mb-1.5 leading-relaxed">{line}</p>;});
  const pW=620,pH=180,ppL=36,ppR=12,ppT=20,ppB=36,piW=pW-ppL-ppR,piH=pH-ppT-ppB,pMax=5500,pSX=piW/(SEASON_WEEKS.length-1);
  const plannedPath=SEASON_WEEKS.map((d,i)=>`${i===0?'M':'L'} ${ppL+i*pSX} ${ppT+piH-(d.planned/pMax)*piH}`).join(' ');
  const actualSegs:string[]=[];let seg='';
  SEASON_WEEKS.forEach((d,i)=>{if(d.actual>0){seg+=`${seg===''?'M':'L'} ${ppL+i*pSX} ${ppT+piH-(d.actual/pMax)*piH} `;}else{if(seg){actualSegs.push(seg);seg='';}}});
  if(seg)actualSegs.push(seg);
  return (
    <div className="space-y-6">
      <QuickActionsBar/><SectionHeader icon="📈" title="Periodisation" subtitle="40-week season load · Planned vs actual AU · AI squad rotation"/>
      <div className="flex gap-1 border-b border-gray-800">{([{id:'load',label:'Season Load',icon:'📊'},{id:'rotation',label:'AI Rotation',icon:'🤖'}] as const).map(t=><button key={t.id} onClick={()=>setPerTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all -mb-px ${perTab===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500 hover:text-gray-300'}`}><span>{t.icon}</span>{t.label}</button>)}</div>
      {perTab==='load'&&<div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><StatCard label="Season avg" value="4,380 AU" sub="Per week" color="purple"/><StatCard label="vs plan" value="+180 AU" sub="Slightly above" color="amber"/><StatCard label="Peak week" value="W9" sub="4,920 AU" color="orange"/><StatCard label="Intl window" value="W13" sub="Load dip" color="blue"/></div>
        <Card><div className="flex items-center justify-between mb-3"><div className="text-sm font-semibold text-white">Team Load — Season (AU/week)</div><div className="flex items-center gap-4 text-[10px]"><span className="flex items-center gap-1.5"><span className="w-3 h-px inline-block border-t border-dashed border-purple-400"/>Planned</span><span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block bg-teal-400"/>Actual</span></div></div>
          <svg viewBox={`0 0 ${pW} ${pH}`} width="100%">
            {[0,0.25,0.5,0.75,1].map((t,i)=><line key={i} x1={ppL} x2={pW-ppR} y1={ppT+piH-t*piH} y2={ppT+piH-t*piH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}
            {[0,1500,3000,4500].map((v,i)=><text key={i} x={ppL-4} y={ppT+piH-(v/pMax)*piH+3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
            {SEASON_WEEKS.map((d,i)=>d.match?<rect key={i} x={ppL+i*pSX-pSX*0.3} y={ppT} width={pSX*0.6} height={piH} fill="#8B5CF6" opacity="0.06" rx="1"/>:null)}
            <path d={plannedPath} fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round"/>
            {actualSegs.map((s,i)=><path key={i} d={s} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>)}
            {SEASON_WEEKS.filter(d=>d.actual>0).map((d)=>{const idx=SEASON_WEEKS.findIndex(w=>w.week===d.week);return<circle key={d.week} cx={ppL+idx*pSX} cy={ppT+piH-(d.actual/pMax)*piH} r="2.5" fill="#0D9488"/>;})}
            {SEASON_WEEKS.filter((_,i)=>i%2===0).map(d=><text key={d.label} x={ppL+SEASON_WEEKS.indexOf(d)*pSX} y={pH-4} fontSize="8" fill="#6B7280" textAnchor="middle">{d.label}</text>)}
            <line x1={ppL+15*pSX} x2={ppL+15*pSX} y1={ppT} y2={ppT+piH} stroke="#EC4899" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8"/><text x={ppL+15*pSX+3} y={ppT+14} fontSize="8" fill="#EC4899">NOW</text>
          </svg>
          <p className="text-[10px] text-gray-600 mt-2">Shaded = match weeks. Dashed = planned. Solid = actual. W16+ = projected.</p>
        </Card>
        <Card><div className="text-sm font-semibold text-white mb-3">Fixture Load Targets</div>{DEMO_CLUB_FIXTURES.map((f,i)=>{const tACWR=f.importance==='Very High'?'0.90–1.05':f.importance==='High'?'1.05–1.15':'1.10–1.20';const tLoad=f.importance==='Very High'?4200:f.importance==='High'?4600:4800;return<div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg border mb-2 ${f.importance==='Very High'?'border-purple-600/30 bg-purple-600/5':f.importance==='High'?'border-blue-600/20 bg-blue-600/5':'border-gray-800'}`}><div><span className="text-xs font-bold text-white">vs {f.opponent}</span><span className="text-[10px] text-gray-500 ml-2">{f.date} · {f.venue}</span></div><div className="flex items-center gap-4 text-[10px]"><span className={`font-bold ${f.importance==='Very High'?'text-purple-400':f.importance==='High'?'text-blue-400':'text-gray-500'}`}>{f.importance}</span><span className="text-gray-400">{tLoad} AU</span><span className="text-teal-400">ACWR: {tACWR}</span></div></div>;})}</Card>
      </div>}
      {perTab==='rotation'&&<div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4"><Card className="border-red-600/30"><div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">⚠ Overloads</div><div className="space-y-1 text-xs text-gray-400"><div className="text-red-400">Barnes — ACWR 1.52</div><div className="text-amber-400">D.Foster — 1.38</div><div className="text-amber-400">K.Foster — 1.44</div></div></Card><Card><div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Priority Matches</div><div className="space-y-1 text-xs"><div className="text-purple-400 font-bold">18 Apr — Bath (A)</div><div className="text-purple-400 font-bold">9 May — Saracens (H)</div></div></Card><Card><div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Academy Available</div><div className="space-y-1 text-xs text-gray-400"><div>Tom Foley (No.8)</div><div>Ali Rashid (Wing)</div><div>Jack Summers (Centre)</div></div></Card></div>
        <div><button onClick={generateRotation} disabled={perLoading} className="px-6 py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/40 disabled:text-purple-800 text-white transition-all flex items-center gap-2">{perLoading?<><span className="animate-spin inline-block">⟳</span> Generating...</>:<><span>🤖</span> Generate 6-Week Rotation Plan</>}</button>{!rotation&&!perLoading&&<p className="text-xs text-gray-600 mt-2">GPS ACWR + fixtures + availability → optimal rotation to peak for Bath and Saracens.</p>}</div>
        {rotation&&<Card className="border-purple-600/30"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span className="text-purple-400 font-bold text-sm">🤖 AI Rotation Model</span><span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">S&C ONLY</span></div><button onClick={generateRotation} className="text-xs text-gray-500 hover:text-gray-300">↺ Regenerate</button></div><div>{renderMd(rotation)}</div><div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between"><span className="text-[10px] text-gray-600">Powered by Claude · Hartfield RFC S&C</span><button className="text-xs text-purple-400 hover:text-purple-300">Share with Head Coach →</button></div></Card>}
      </div>}
    </div>
  );
}

function GPSLoadView() {
  const [filterStatus, setFilterStatus] = useState<'all'|'optimal'|'manage'|'overload'|'underload'>('all')

  const FULL_SQUAD_LOAD = [
    { name:'Tom Harrison',   pos:'Prop',       chronic:4820, acute:1340, todayAU:380, status:'optimal'   as const },
    { name:'James Briggs',   pos:'Hooker',     chronic:4910, acute:1380, todayAU:410, status:'optimal'   as const },
    { name:'Phil Dowd',      pos:'Prop',       chronic:4200, acute:1050, todayAU:320, status:'underload' as const },
    { name:'Marcus Webb',    pos:'Lock',       chronic:5100, acute:1450, todayAU:420, status:'optimal'   as const },
    { name:'Chris Palmer',   pos:'Lock',       chronic:4780, acute:1320, todayAU:390, status:'optimal'   as const },
    { name:'Danny Foster',   pos:'No.8',       chronic:5240, acute:1820, todayAU:0,   status:'overload'  as const },
    { name:'Karl Foster',    pos:'Flanker',    chronic:5080, acute:1620, todayAU:440, status:'manage'    as const },
    { name:'Sam Ellis',      pos:'Scrum Half', chronic:4640, acute:1280, todayAU:360, status:'optimal'   as const },
    { name:'Danny Cole',     pos:'Fly Half',   chronic:4380, acute:980,  todayAU:290, status:'underload' as const },
    { name:'Ryan Patel',     pos:'Wing',       chronic:4120, acute:820,  todayAU:0,   status:'underload' as const },
    { name:'Jake Rawlings',  pos:'Prop',       chronic:4560, acute:1240, todayAU:360, status:'optimal'   as const },
    { name:'Connor Walsh',   pos:'Fly Half',   chronic:4280, acute:1180, todayAU:340, status:'optimal'   as const },
    { name:'Ben Taylor',     pos:'Wing',       chronic:4450, acute:1210, todayAU:350, status:'optimal'   as const },
    { name:'Matt Jones',     pos:'Centre',     chronic:4820, acute:1340, todayAU:390, status:'optimal'   as const },
    { name:'Luke Barnes',    pos:'Fullback',   chronic:5160, acute:1680, todayAU:460, status:'overload'  as const },
    { name:'Josh White',     pos:'Flanker',    chronic:4740, acute:1300, todayAU:380, status:'optimal'   as const },
    { name:'David Obi',      pos:'Centre',     chronic:4680, acute:1290, todayAU:370, status:'optimal'   as const },
    { name:'Callum Reeves',  pos:'Wing',       chronic:4510, acute:1240, todayAU:360, status:'optimal'   as const },
    { name:'Oliver Grant',   pos:'Scrum Half', chronic:4600, acute:1270, todayAU:370, status:'optimal'   as const },
  ]

  const acwr = (p: typeof FULL_SQUAD_LOAD[0]) => p.chronic === 0 ? 0 : (p.acute / (p.chronic / 4))
  const statusColor = (s: string) => s === 'optimal' ? 'text-green-400' : s === 'manage' ? 'text-amber-400' : s === 'overload' ? 'text-red-400' : s === 'underload' ? 'text-blue-400' : 'text-gray-600'
  const statusBg = (s: string) => s === 'optimal' ? 'bg-green-600/10 border-green-600/30' : s === 'manage' ? 'bg-amber-600/10 border-amber-600/30' : s === 'overload' ? 'bg-red-600/10 border-red-600/30' : s === 'underload' ? 'bg-blue-600/10 border-blue-600/30' : 'bg-gray-800/30 border-gray-800'
  const statusLabel = (s: string) => s === 'optimal' ? 'Ready' : s === 'manage' ? 'Manage' : s === 'overload' ? 'Rest' : s === 'underload' ? 'Build' : 'Unavail'

  const filtered = filterStatus === 'all' ? FULL_SQUAD_LOAD : FULL_SQUAD_LOAD.filter(p => p.status === filterStatus)
  const counts = { optimal: FULL_SQUAD_LOAD.filter(p=>p.status==='optimal').length, manage: FULL_SQUAD_LOAD.filter(p=>p.status==='manage').length, overload: FULL_SQUAD_LOAD.filter(p=>p.status==='overload').length, underload: FULL_SQUAD_LOAD.filter(p=>p.status==='underload').length }

  const WEEKLY_LOAD = [
    { week: 'W-4', planned: 4200, actual: 3980 },
    { week: 'W-3', planned: 4600, actual: 4720 },
    { week: 'W-2', planned: 4400, actual: 4380 },
    { week: 'W-1', planned: 4800, actual: 5040 },
    { week: 'Now', planned: 4600, actual: 4280 },
  ]
  const maxLoad = 5500, W = 560, H = 160, padL = 36, padR = 12, padT = 16, padB = 32
  const innerW = W - padL - padR, innerH = H - padT - padB
  const stepX = innerW / (WEEKLY_LOAD.length - 1)
  const plannedPath = WEEKLY_LOAD.map((d, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (d.planned / maxLoad) * innerH}`).join(' ')
  const actualPath = WEEKLY_LOAD.map((d, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX} ${padT + innerH - (d.actual / maxLoad) * innerH}`).join(' ')

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="📡" title="GPS & Load — Squad Dashboard" subtitle="28-day rolling ACWR · All players · Catapult OpenField + STATSports" />

      {counts.overload > 0 && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-sm text-red-300">
          ⚠ <strong>{counts.overload} player{counts.overload > 1 ? 's' : ''} in overload zone</strong> — {FULL_SQUAD_LOAD.filter(p => p.status === 'overload').map(p => p.name).join(', ')}. Recommend rest or minimal load today.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ready', count: counts.optimal, color: 'green', status: 'optimal' as const },
          { label: 'Manage', count: counts.manage, color: 'amber', status: 'manage' as const },
          { label: 'Rest', count: counts.overload, color: 'red', status: 'overload' as const },
          { label: 'Build', count: counts.underload, color: 'blue', status: 'underload' as const },
        ].map(z => (
          <button key={z.status} onClick={() => setFilterStatus(filterStatus === z.status ? 'all' : z.status)}
            className={`rounded-xl p-4 border text-left transition-all bg-${z.color}-600/10 border-${z.color}-600/30 hover:border-${z.color}-500/40`}>
            <div className={`text-3xl font-bold text-${z.color}-400`}>{z.count}</div>
            <div className="text-xs text-gray-400 mt-1">{z.label}</div>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white">Team Load — 28-Day Rolling (AU)</div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block bg-purple-400" />Planned</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block bg-teal-400" />Actual</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%">
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => <line key={i} x1={padL} x2={W - padR} y1={padT + innerH - t * innerH} y2={padT + innerH - t * innerH} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
          {[0, 1500, 3000, 4500].map((v, i) => <text key={i} x={padL - 4} y={padT + innerH - (v / maxLoad) * innerH + 3} fontSize="9" fill="#6B7280" textAnchor="end">{v}</text>)}
          <path d={plannedPath} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" />
          <path d={actualPath} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {WEEKLY_LOAD.map((d, i) => (
            <g key={i}>
              <circle cx={padL + i * stepX} cy={padT + innerH - (d.actual / maxLoad) * innerH} r="3.5" fill="#0D9488" />
              <text x={padL + i * stepX} y={H - 4} fontSize="9" fill="#6B7280" textAnchor="middle">{d.week}</text>
            </g>
          ))}
        </svg>
        <p className="text-[10px] text-gray-600 mt-2">W-1 overshot planned load by 240 AU — contributing to current overload flags.</p>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white">Full Squad ACWR — {filtered.length} players{filterStatus !== 'all' ? ` (${filterStatus})` : ''}</div>
          <div className="flex gap-1">
            {(['all', 'optimal', 'manage', 'overload', 'underload'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-2 py-1 rounded text-[10px] font-medium capitalize transition-all ${filterStatus === s ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase tracking-wider">
                <th className="text-left py-2 px-2">Player</th><th className="text-left py-2">Pos</th>
                <th className="text-right py-2">Chronic (28d)</th><th className="text-right py-2">Acute (7d)</th>
                <th className="text-right py-2">ACWR</th><th className="text-right py-2">Today AU</th>
                <th className="text-center py-2">Status</th><th className="text-right py-2">ACWR bar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const ratio = acwr(p)
                const barPct = Math.min((ratio / 2) * 100, 100)
                const barCol = ratio > 1.5 ? '#EF4444' : ratio > 1.3 ? '#F59E0B' : ratio < 0.8 ? '#3B82F6' : '#22C55E'
                return (
                  <tr key={i} className="border-b border-gray-800/40 hover:bg-white/[0.01]">
                    <td className="py-2 px-2 text-white font-medium">{p.name}</td>
                    <td className="py-2 text-gray-400">{p.pos}</td>
                    <td className="py-2 text-right text-gray-300">{p.chronic > 0 ? p.chronic.toLocaleString() : '—'}</td>
                    <td className="py-2 text-right text-gray-300">{p.acute > 0 ? p.acute.toLocaleString() : '—'}</td>
                    <td className={`py-2 text-right font-bold ${statusColor(p.status)}`}>{ratio > 0 ? ratio.toFixed(2) : '—'}</td>
                    <td className="py-2 text-right text-gray-300">{p.todayAU > 0 ? p.todayAU : '—'}</td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusBg(p.status)} ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                    </td>
                    <td className="py-2 pl-4 pr-2">
                      <div className="w-20 bg-gray-800 rounded-full h-1.5 ml-auto">
                        <div className="h-1.5 rounded-full" style={{ width: `${barPct}%`, backgroundColor: barCol }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-800 text-[10px] text-gray-600">
          ACWR zones: &lt;0.8 Underload (blue) · 0.8–1.3 Optimal (green) · 1.3–1.5 Manage (amber) · &gt;1.5 Overload (red)
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Kitman Labs</div>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-white">Player readiness feed</span><span className="text-green-400 text-xs font-bold">● Live</span></div>
          <div className="text-[10px] text-gray-500">Last sync: today 07:24 · 20/38 players logged</div>
        </Card>
        <Card>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Catapult OpenField</div>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-white">GPS vest sync</span><span className="text-green-400 text-xs font-bold">● Connected</span></div>
          <div className="text-[10px] text-gray-500">Last session: Tue 8 Apr · 29 vests active</div>
        </Card>
        <Card>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">S&C Alerts</div>
          <div className="space-y-1 text-[10px]">
            <div className="text-red-400">🔴 Danny Foster — Rest today (ACWR 1.38)</div>
            <div className="text-red-400">🔴 Luke Barnes — Rest today (ACWR 1.52)</div>
            <div className="text-amber-400">🟡 Karl Foster — Manage (ACWR 1.44)</div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── PLAYER HEATMAP VIEW ─────────────────────────────────────────────────────
function PlayerHeatmapView() {
  const [selectedPlayer, setSelectedPlayer] = useState('All')
  const [selectedSession, setSelectedSession] = useState('Match vs Jersey Reds (11 Apr)')
  const [selectedView, setSelectedView] = useState<'heatmap' | 'zones' | 'lines'>('heatmap')

  const sessions = [
    'Match vs Jersey Reds (11 Apr)',
    "Training — Tue 8 Apr (Tactical)",
    "Training — Mon 7 Apr (S&C)",
    'Match vs Bath RFC (5 Apr)',
    "Training — Thu 3 Apr (Captain's Run)",
  ]

  const players = ['All', 'Tom Harrison', 'Marcus Webb', 'Karl Foster', 'Sam Ellis', 'Danny Cole', 'Matt Jones', 'Luke Barnes', 'David Obi']

  const HEATMAP_ZONES: Record<string, Array<[number, number, number]>> = {
    'All': [
      [15,20,0.9],[20,35,0.8],[18,50,0.7],[22,65,0.6],[25,80,0.5],
      [50,20,0.6],[50,40,0.9],[50,60,0.8],[50,75,0.6],[50,90,0.4],
      [80,25,0.7],[75,45,0.8],[78,60,0.7],[82,75,0.5],[85,85,0.4],
      [35,30,0.8],[40,50,0.9],[38,70,0.7],[45,85,0.5],
      [60,35,0.7],[65,55,0.8],[62,70,0.6],[70,80,0.4],
      [30,15,0.5],[70,15,0.5],[50,10,0.6],[50,95,0.3],
    ],
    'Tom Harrison': [
      [30,20,0.9],[28,35,0.8],[32,45,0.7],[25,55,0.6],[30,65,0.5],
      [35,30,0.8],[40,40,0.7],[38,50,0.6],[35,60,0.5],
      [20,25,0.6],[22,40,0.7],[18,55,0.5],
    ],
    'Luke Barnes': [
      [50,85,0.9],[45,80,0.8],[55,80,0.8],[50,90,0.7],[48,75,0.6],
      [30,70,0.6],[70,70,0.6],[50,65,0.5],[40,60,0.4],[60,60,0.4],
      [20,50,0.3],[80,50,0.3],[50,55,0.5],
    ],
    'Karl Foster': [
      [40,45,0.9],[45,55,0.8],[50,50,0.9],[55,45,0.8],[50,40,0.7],
      [35,40,0.7],[60,40,0.7],[45,35,0.6],[55,35,0.6],
      [40,60,0.6],[60,60,0.5],[50,65,0.4],
    ],
    'Sam Ellis': [
      [48,30,0.7],[50,35,0.9],[52,30,0.7],[50,40,0.8],[48,45,0.6],
      [50,50,0.9],[50,55,0.8],[50,60,0.7],[50,65,0.6],
      [45,25,0.5],[55,25,0.5],[50,20,0.4],
    ],
  }

  const zoneData = HEATMAP_ZONES[selectedPlayer] ?? HEATMAP_ZONES['All']

  const ZONE_STATS: Record<string, { ownHalf: number; midfield: number; oppHalf: number; opp22: number }> = {
    'All':          { ownHalf: 28, midfield: 34, oppHalf: 26, opp22: 12 },
    'Tom Harrison': { ownHalf: 52, midfield: 31, oppHalf: 14, opp22: 3 },
    'Luke Barnes':  { ownHalf: 8,  midfield: 22, oppHalf: 42, opp22: 28 },
    'Karl Foster':  { ownHalf: 18, midfield: 48, oppHalf: 26, opp22: 8 },
    'Sam Ellis':    { ownHalf: 24, midfield: 44, oppHalf: 24, opp22: 8 },
  }
  const zones = ZONE_STATS[selectedPlayer] ?? ZONE_STATS['All']

  const PW = 600, PH = 400
  const lineCol = 'rgba(255,255,255,0.18)'
  const cx = (xPct: number) => (xPct / 100) * PW
  const cy2 = (yPct: number) => PH - (yPct / 100) * PH

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🗺️" title="Player Heatmap" subtitle="GPS x/y position density — match and training sessions" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Session</label>
          <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500">
            {sessions.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Player</label>
          <div className="flex flex-wrap gap-1">
            {players.map(p => (
              <button key={p} onClick={() => setSelectedPlayer(p)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${selectedPlayer === p ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{p}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">View</label>
          <div className="flex gap-2">
            {(['heatmap', 'zones', 'lines'] as const).map(v => (
              <button key={v} onClick={() => setSelectedView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all ${selectedView === v ? 'border-purple-500 bg-purple-600/20 text-purple-300' : 'border-gray-800 text-gray-500 hover:text-gray-300'}`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white">{selectedPlayer === 'All' ? 'Full squad' : selectedPlayer} — {selectedSession}</div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-purple-500 opacity-90" />High density</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-blue-500 opacity-60" />Medium</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-teal-500 opacity-40" />Low</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${PW} ${PH}`} width="100%" style={{ maxHeight: 360 }}>
          <rect width={PW} height={PH} fill="#0a1a0a" rx="4" />
          <rect x={0} y={0} width={PW} height={PH} fill="none" stroke={lineCol} strokeWidth="2" />
          <line x1={0} y1={PH/2} x2={PW} y2={PH/2} stroke={lineCol} strokeWidth="1.5" />
          <circle cx={PW/2} cy={PH/2} r={PH*0.12} fill="none" stroke={lineCol} strokeWidth="1" />
          <circle cx={PW/2} cy={PH/2} r="3" fill={lineCol} />
          <line x1={0} y1={PH*0.22} x2={PW} y2={PH*0.22} stroke={lineCol} strokeWidth="1" strokeDasharray="6 4" />
          <line x1={0} y1={PH*0.78} x2={PW} y2={PH*0.78} stroke={lineCol} strokeWidth="1" strokeDasharray="6 4" />
          <line x1={0} y1={PH*0.04} x2={PW} y2={PH*0.04} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
          <line x1={0} y1={PH*0.96} x2={PW} y2={PH*0.96} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
          <rect x={PW*0.42} y={0} width={PW*0.16} height={PH*0.04} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <rect x={PW*0.42} y={PH*0.96} width={PW*0.16} height={PH*0.04} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
          <text x="8" y="16" fontSize="9" fill="rgba(255,255,255,0.3)">Own try line</text>
          <text x="8" y={PH*0.22 - 4} fontSize="9" fill="rgba(255,255,255,0.3)">Own 22</text>
          <text x="8" y={PH/2 - 4} fontSize="9" fill="rgba(255,255,255,0.3)">Halfway</text>
          <text x="8" y={PH*0.78 - 4} fontSize="9" fill="rgba(255,255,255,0.3)">Opp 22</text>
          <text x="8" y={PH - 6} fontSize="9" fill="rgba(255,255,255,0.3)">Opp try line</text>

          {selectedView === 'heatmap' && zoneData.map(([x, y, intensity], i) => (
            <circle key={i} cx={cx(x)} cy={cy2(y)} r={intensity * 55}
              fill={intensity > 0.75 ? '#8B5CF6' : intensity > 0.5 ? '#3B82F6' : '#0D9488'}
              opacity={intensity * 0.45} />
          ))}

          {selectedView === 'zones' && (
            <g>
              <rect x={0} y={PH*0.78} width={PW} height={PH*0.18} fill="#8B5CF6" opacity={zones.opp22 / 200} rx="2" />
              <rect x={0} y={PH*0.22} width={PW} height={PH*0.56} fill="#3B82F6" opacity={zones.midfield / 200} rx="2" />
              <rect x={0} y={0} width={PW} height={PH*0.22} fill="#0D9488" opacity={zones.ownHalf / 200} rx="2" />
              <text x={PW/2} y={PH*0.88} fontSize="20" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.8">{zones.opp22}%</text>
              <text x={PW/2} y={PH*0.52} fontSize="20" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.8">{zones.midfield}%</text>
              <text x={PW/2} y={PH*0.14} fontSize="20" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.8">{zones.ownHalf}%</text>
            </g>
          )}

          {selectedView === 'lines' && zoneData.slice(0, -1).map(([x, y], i) => {
            const next = zoneData[i + 1]
            if (!next) return null
            return <line key={i} x1={cx(x)} y1={cy2(y)} x2={cx(next[0])} y2={cy2(next[1])} stroke="#8B5CF6" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          })}
        </svg>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Own Half" value={`${zones.ownHalf}%`} sub="Time in own half" color="teal" />
        <StatCard label="Midfield" value={`${zones.midfield}%`} sub="22–22 zone" color="blue" />
        <StatCard label="Opp Half" value={`${zones.oppHalf}%`} sub="Opposition territory" color="purple" />
        <StatCard label="Opp 22" value={`${zones.opp22}%`} sub="Attacking 22" color="orange" />
      </div>

      <Card>
        <div className="text-sm font-semibold text-white mb-3">Championship Position Benchmarks — {selectedPlayer}</div>
        <div className="space-y-2 text-xs text-gray-400">
          {selectedPlayer === 'Luke Barnes' && (
            <>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Time in opp 22</span><span className="text-purple-400 font-bold">28% <span className="text-green-400 ml-1">↑ bench: 18%</span></span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Carrying distance</span><span className="text-white">2.4km</span></div>
              <div className="flex justify-between py-1.5"><span>High-speed runs in opp half</span><span className="text-white">14</span></div>
            </>
          )}
          {selectedPlayer === 'Tom Harrison' && (
            <>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Time in own half</span><span className="text-purple-400 font-bold">52% <span className="text-gray-400 ml-1">— typical for Prop</span></span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Scrummaging zone entries</span><span className="text-white">18</span></div>
              <div className="flex justify-between py-1.5"><span>Carrying distance</span><span className="text-white">0.9km</span></div>
            </>
          )}
          {(selectedPlayer === 'All' || !['Luke Barnes', 'Tom Harrison'].includes(selectedPlayer)) && (
            <>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Opp 22 entries</span><span className="text-purple-400 font-bold">{zones.opp22}% <span className="text-gray-400 ml-1">(bench: 14%)</span></span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-800/50"><span>Midfield density</span><span className="text-white">{zones.midfield}%</span></div>
              <div className="flex justify-between py-1.5"><span>Own half defensive coverage</span><span className="text-white">{zones.ownHalf}%</span></div>
            </>
          )}
        </div>
      </Card>

      <div className="text-[10px] text-gray-700 text-center">
        GPS position data: Catapult OpenField · 10Hz sampling · Updated after each session sync
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

function PlayerProfileView(){const[sid,setSid]=useState(1);const[pt,setPt]=useState<'overview'|'contract'|'medical'|'value'>('overview');const PL=[{id:1,name:'Tom Harrison',pos:'Prop',age:28,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',w:1800,end:'Jun 2027',intl:false,rd:94,gps:{d:10.8,hi:720,spr:14,ms:27.8,ac:0.94},st:{ap:16,tr:1,tk:82,mi:4,ca:94,me:312},inj:[{i:'Calf strain',d:'Oct 2025',o:10,ok:true}],val:{mv:'£85–95k/yr',sc:'High',rec:'Renew'}},{id:4,name:'Marcus Webb',pos:'Lock',age:26,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',w:2500,end:'Jun 2028',intl:true,rd:87,gps:{d:11.6,hi:880,spr:18,ms:29.2,ac:1.12},st:{ap:14,tr:2,tk:104,mi:6,ca:88,me:264},inj:[],val:{mv:'£120–140k/yr',sc:'Medium',rec:'Central contract'}},{id:6,name:'Danny Foster',pos:'No.8',age:24,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',w:2200,end:'Jun 2028',intl:true,rd:0,gps:{d:12.4,hi:1240,spr:28,ms:32.1,ac:1.38},st:{ap:15,tr:4,tk:112,mi:8,ca:128,me:498},inj:[{i:'HIA Protocol',d:'5 Apr 2026',o:null,ok:false}],val:{mv:'£110–130k/yr',sc:'High',rec:'Protect from Prem'}},{id:16,name:'Luke Barnes',pos:'Fullback',age:23,nat:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',w:2000,end:'Jun 2027',intl:false,rd:95,gps:{d:12.3,hi:1120,spr:26,ms:31.9,ac:1.52},st:{ap:16,tr:6,tk:88,mi:4,ca:142,me:562},inj:[],val:{mv:'£100–120k/yr',sc:'Rising star',rec:'Extend now'}}];const p=PL.find(x=>x.id===sid)??PL[0];return(<div className="space-y-6"><QuickActionsBar/><SectionHeader icon="👤" title="Player Profiles" subtitle="GPS · Stats · Contract · Medical · Value"/><div className="flex gap-6"><div className="w-44 flex-shrink-0 space-y-1">{PL.map(pl=><button key={pl.id} onClick={()=>{setSid(pl.id);setPt('overview')}} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs ${sid===pl.id?'bg-purple-600/20 text-purple-300 border border-purple-600/30':'text-gray-400 hover:bg-gray-800/50'}`}><div className="font-medium truncate">{pl.name}</div><div className="text-[10px] text-gray-500 mt-0.5">{pl.pos}</div></button>)}</div><div className="flex-1 min-w-0 space-y-5"><div className="bg-gradient-to-r from-purple-900/30 to-gray-900/20 border border-purple-600/30 rounded-xl p-5"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 mb-1"><span className="text-2xl">{p.nat}</span><h3 className="text-xl font-bold text-white">{p.name}</h3>{p.intl&&<span className="text-[10px] px-2 py-0.5 rounded bg-amber-600/20 text-amber-400">Intl</span>}</div><p className="text-sm text-gray-400">{p.pos} · Age {p.age} · {p.end}</p></div><div className="text-right"><div className={`text-3xl font-bold ${p.rd>=80?'text-green-400':p.rd===0?'text-red-400':'text-amber-400'}`}>{p.rd>0?`${p.rd}%`:'N/A'}</div><div className="text-xs text-gray-500">Readiness</div></div></div><div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-800/50">{[{l:'Apps',v:p.st.ap},{l:'Tries',v:p.st.tr},{l:'Tackles',v:p.st.tk},{l:'Metres',v:p.st.me}].map((s,i)=><div key={i} className="text-center"><div className="text-lg font-bold text-white">{s.v}</div><div className="text-[10px] text-gray-500">{s.l}</div></div>)}</div></div><div className="flex gap-1 border-b border-gray-800">{([{id:'overview' as const,l:'Overview',ic:'📋'},{id:'contract' as const,l:'Contract',ic:'📄'},{id:'medical' as const,l:'Medical',ic:'🏥'},{id:'value' as const,l:'Value',ic:'💷'}]).map(t=><button key={t.id} onClick={()=>setPt(t.id)} className={`px-3 py-2 text-xs font-semibold flex items-center gap-1 border-b-2 -mb-px ${pt===t.id?'border-purple-500 text-purple-400':'border-transparent text-gray-500'}`}><span>{t.ic}</span>{t.l}</button>)}</div>{pt==='overview'&&<div className="grid grid-cols-2 gap-4"><Card><div className="text-xs font-bold text-gray-400 uppercase mb-3">GPS</div>{[{l:'Dist',v:`${p.gps.d}km`},{l:'HI',v:`${p.gps.hi}m`},{l:'Sprints',v:p.gps.spr},{l:'Max',v:`${p.gps.ms}km/h`},{l:'ACWR',v:p.gps.ac}].map((r,i)=><div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.l}</span><span className="text-white">{r.v}</span></div>)}</Card><Card><div className="text-xs font-bold text-gray-400 uppercase mb-3">Stats</div>{[{l:'Apps',v:p.st.ap},{l:'Tries',v:p.st.tr},{l:'Tackles',v:p.st.tk},{l:'Missed',v:p.st.mi},{l:'Carries',v:p.st.ca},{l:'Metres',v:`${p.st.me}m`}].map((r,i)=><div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.l}</span><span className="text-white">{r.v}</span></div>)}</Card></div>}{pt==='contract'&&<Card><div className="text-sm font-semibold text-white mb-3">Contract</div>{[{l:'Weekly',v:fmt(p.w)},{l:'Annual',v:fmt(p.w*52)},{l:'End',v:p.end},{l:'Intl',v:p.intl?'Yes':'No'},{l:'Cap %',v:`${((p.w*52/2800000)*100).toFixed(1)}%`}].map((r,i)=><div key={i} className="flex justify-between py-2 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.l}</span><span className="text-white">{r.v}</span></div>)}</Card>}{pt==='medical'&&<Card><div className="text-sm font-semibold text-white mb-3">Injury Log</div>{p.inj.length===0?<div className="text-xs text-green-400 bg-green-600/10 border border-green-600/20 rounded-lg p-3">✓ No injuries.</div>:p.inj.map((inj,i)=><div key={i} className={`rounded-lg p-3 border mb-2 ${inj.ok?'border-gray-800':'border-amber-600/30 bg-amber-600/5'}`}><div className="flex justify-between mb-1"><span className="text-sm font-semibold text-white">{inj.i}</span><span className={`text-[10px] px-2 py-0.5 rounded font-bold ${inj.ok?'bg-green-600/20 text-green-400':'bg-amber-600/20 text-amber-400'}`}>{inj.ok?'Resolved':'Active'}</span></div><div className="text-xs text-gray-400">{inj.d}{inj.o?` · ${inj.o}d`:''}</div></div>)}</Card>}{pt==='value'&&<Card><div className="text-sm font-semibold text-white mb-4">Market Value</div><div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4 mb-3"><div className="text-purple-400 font-bold text-lg">{p.val.mv}</div></div>{[{l:'Scarcity',v:p.val.sc},{l:'Rec',v:p.val.rec}].map((r,i)=><div key={i} className="flex justify-between py-2 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.l}</span><span className="text-white text-right ml-4">{r.v}</span></div>)}</Card>}</div></div></div>)}

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

// ─── AI HALFTIME BRIEF VIEW ──────────────────────────────────────────────────
function AIHalftimeBriefView({ club }: { club: RugbyClub }) {
  const [brief, setBrief] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const MATCH = { opponent: 'Jersey Reds', score: '7–10', venue: 'Home', minute: 40 };
  const GPS_HT = {
    distanceKm: 52.4, hiRunningM: 4820, sprints: 94, avgACWR: 1.22,
    flagged: [
      { name: 'Danny Foley', issue: 'ACWR 1.38 — pre-overload', action: 'Reduce contact minutes 2nd half' },
      { name: 'Luke Barnes', issue: 'ACWR 1.52 — overload zone', action: 'Priority sub candidate 55–60 min' },
      { name: 'Karl Foster', issue: 'ACWR 1.44 — manage zone', action: 'Monitor — limit breakdown work' },
    ],
  };
  const FS = {
    scrums:{won:3,lost:2,penAgainst:2},lineouts:{won:7,lost:1,successPct:87},
    rucks:{won:38,lost:6,slowBall:9},tackles:{made:84,missed:12,missRate:12.5},
    territory:{oppHalf:62},carries:{gainLine:22,lostGainLine:11,lineBreaks:3},
  };

  const generate = async () => {
    setLoading(true); setBrief(null);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `You are the AI performance analyst for ${club.name}, a Championship Rugby club.
Generate a structured AI Halftime Brief for the Head Coach's iPad. Match: ${club.name} ${MATCH.score} ${MATCH.opponent} (HT).

GPS DATA (first 40 minutes):
- Team distance: ${GPS_HT.distanceKm}km | HI running: ${GPS_HT.hiRunningM}m | Sprints: ${GPS_HT.sprints}
- Team avg ACWR: ${GPS_HT.avgACWR} (amber)
- Load flags: ${GPS_HT.flagged.map(f=>`${f.name} (${f.issue})`).join(', ')}

FRAMESPORTS VIDEO TAGS:
- Scrums: ${FS.scrums.won}W/${FS.scrums.lost}L | ${FS.scrums.penAgainst} pen against
- Lineouts: ${FS.lineouts.successPct}% (${FS.lineouts.won}/${FS.lineouts.won+FS.lineouts.lost})
- Rucks: ${FS.rucks.won}W/${FS.rucks.lost}L | ${FS.rucks.slowBall} slow ball
- Tackles: ${FS.tackles.made} made / ${FS.tackles.missed} missed (${FS.tackles.missRate}% miss rate)
- Territory: ${FS.territory.oppHalf}% in opposition half
- Carries: ${FS.carries.gainLine}W gainline / ${FS.carries.lostGainLine}L / ${FS.carries.lineBreaks} line breaks

Generate brief in exactly this format:
## 🔴 SCOREBOARD
One sentence on match state and urgency.
## 📡 PHYSICAL (GPS)
3–4 bullet points on load data. Name flagged players and actions.
## 🏉 SET PIECE
Bullet points on scrum and lineout. What works, what must change.
## ⚔️ CONTACT & BREAKDOWN
Tackle miss rate, ruck speed, gainline — tactical meaning.
## 🎯 3 HALF-TIME ADJUSTMENTS
Numbered list. Specific, actionable. 90 seconds to read.
## 🔄 SUBSTITUTION CALL
1–2 subs with exact reasoning — GPS load + position + game state.
## 💬 TEAM TALK (30 seconds)
One short paragraph. Direct. No clichés.
Keep under 400 words.` }]
        })
      });
      const data = await res.json();
      setBrief(data.content?.map((b:{type:string;text?:string})=>b.type==='text'?b.text:'').join('')||'Error generating brief.');
    } catch { setBrief('Connection error. Check API.'); }
    setLoading(false);
  };

  const renderBrief = (text: string) => text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-white mt-5 mb-2">{line.replace('## ','')}</h3>;
    if (line.match(/^\d\./)) return <div key={i} className="flex gap-2 text-xs text-gray-300 mb-1.5"><span className="text-purple-400 flex-shrink-0 font-bold">{line[0]}.</span><span>{line.slice(2)}</span></div>;
    if (line.startsWith('- ')) return <div key={i} className="flex gap-2 text-xs text-gray-300 mb-1"><span className="text-purple-500 flex-shrink-0 mt-0.5">•</span><span>{line.slice(2)}</span></div>;
    if (line.trim()==='') return <div key={i} className="h-1"/>;
    return <p key={i} className="text-xs text-gray-300 mb-1.5 leading-relaxed">{line}</p>;
  });

  return (
    <div className="space-y-6">
      <QuickActionsBar />
      <SectionHeader icon="🤖" title="AI Halftime Brief" subtitle="GPS + FrameSports video tags + Claude API → Head Coach iPad in under 4 minutes"/>
      <div className="bg-gradient-to-r from-purple-900/30 to-gray-900/20 border border-purple-600/30 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[{l:'Score',v:`${club.name} ${MATCH.score} ${MATCH.opponent}`},{l:'Venue',v:MATCH.venue},{l:'Minute',v:`${MATCH.minute}' (HT)`},{l:'Team ACWR',v:`${GPS_HT.avgACWR} — Amber`}].map((d,i)=>(
            <div key={i}><div className="text-gray-500">{d.l}</div><div className="text-white font-semibold mt-0.5">{d.v}</div></div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📡 GPS — First Half</div>
          {[{label:'Distance',us:`${GPS_HT.distanceKm}km`,bench:'54km bench'},{label:'HI Running',us:`${GPS_HT.hiRunningM}m`,bench:'5,100m bench'},{label:'Sprints',us:`${GPS_HT.sprints}`,bench:'105 bench'}].map((r,i)=>(
            <div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.label}</span><div className="text-right"><span className="text-white font-medium">{r.us}</span><span className="text-gray-600 ml-2">{r.bench}</span></div></div>
          ))}
        </Card>
        <Card>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🎬 FrameSports Tags</div>
          {[{label:'Scrum',v:`${FS.scrums.won}W ${FS.scrums.lost}L — ${FS.scrums.penAgainst} pen`,color:'text-red-400'},{label:'Lineout',v:`${FS.lineouts.successPct}% (${FS.lineouts.won}/${FS.lineouts.won+FS.lineouts.lost})`,color:'text-green-400'},{label:'Tackles missed',v:`${FS.tackles.missed} (${FS.tackles.missRate}%)`,color:'text-amber-400'},{label:'Gainline',v:`${FS.carries.gainLine}W / ${FS.carries.lostGainLine}L`,color:'text-purple-400'}].map((r,i)=>(
            <div key={i} className="flex justify-between py-1.5 border-b border-gray-800/50 text-xs"><span className="text-gray-400">{r.label}</span><span className={`font-medium ${r.color}`}>{r.v}</span></div>
          ))}
        </Card>
        <Card className="border-amber-600/30">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">⚠ Load Flags</div>
          <div className="space-y-2">{GPS_HT.flagged.map((f,i)=>(
            <div key={i} className="bg-[#0a0c14] border border-amber-600/20 rounded-lg p-2.5">
              <div className="text-xs font-bold text-white">{f.name}</div>
              <div className="text-[10px] text-amber-400 mt-0.5">{f.issue}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">→ {f.action}</div>
            </div>
          ))}</div>
        </Card>
      </div>
      <div>
        <button onClick={generate} disabled={loading} className="px-6 py-3 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/40 disabled:text-purple-800 text-white transition-all flex items-center gap-2">
          {loading?<><span className="animate-spin inline-block">⟳</span> Generating brief...</>:<><span>🤖</span> Generate AI Halftime Brief</>}
        </button>
        {!brief&&!loading&&<p className="text-xs text-gray-600 mt-2">Combines GPS load + FrameSports video tags → structured coach brief in under 4 minutes.</p>}
      </div>
      {brief&&(
        <Card className="border-purple-600/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><span className="text-purple-400 font-bold text-sm">🤖 Lumio AI Brief</span><span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">COACHING STAFF ONLY</span></div>
            <button onClick={generate} className="text-xs text-gray-500 hover:text-gray-300">↺ Regenerate</button>
          </div>
          <div className="divide-y divide-gray-800/40">{renderBrief(brief)}</div>
          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-[10px] text-gray-600">Powered by Claude · Lumio Rugby · HT {MATCH.minute}&apos;</span>
            <button className="text-xs text-purple-400 hover:text-purple-300">Print for dressing room →</button>
          </div>
        </Card>
      )}
      <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4">
        <p className="text-xs text-purple-300"><strong>Why this is world-leading:</strong> No Championship Rugby club has a system that combines live GPS load data, FrameSports auto-tagged video (scrums, lineouts, rucks), and AI narrative into a single coaching brief delivered within 4 minutes of the halftime whistle. Lumio Rugby does this first.</p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function RugbyPortalPage() {
  return (
    <SportsDemoGate
      sport="rugby"
      accentColor="#7C3AED"
      sportLabel="Rugby"
      defaultClubName="Hartfield RFC"
      roles={RUGBY_ROLES}
    >
      {(session) => <RugbyPortalInner session={session} />}
    </SportsDemoGate>
  )
}

function RugbyPortalInner({ session }: { session: SportsDemoSession }) {
  const [activeSection,setActiveSection]=useState('dashboard');
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const club = DEMO_CLUB;
  const activeRole = session.role;
  const groups = ['CLUB OVERVIEW','SALARY CAP','FRANCHISE','SQUAD','PERFORMANCE','RECRUITMENT','WELFARE','COMMERCIAL',"WOMEN'S RUGBY",'INTELLIGENCE'];

  const renderView = () => {
    switch(activeSection) {
      case 'dashboard':       return <ClubDashboardView club={club}/>;
      case 'dorbriefing':     return <DoRBriefingView club={club}/>;
      case 'insights':        return <InsightsView club={club} activeRole={activeRole}/>;
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
      case 'playerprofile':   return <PlayerProfileView/>;
      case 'international':   return <InternationalDutyView/>;
      case 'loans':           return <LoanManagementView/>;
      case 'gps-load':        return <GPSLoadView/>;
      case 'heatmap':         return <PlayerHeatmapView/>;
      case 'video-analysis':  return <VideoAnalysisView/>;
      case 'match-stats':     return <MatchStatsView/>;
      case 'setpiece':        return <SetPieceAnalyticsView/>;
      case 'carryanalytics':  return <CarryAnalyticsView/>;
      case 'training-planner':return <TrainingPlannerView/>;
      case 'periodisation':  return <PeriodisationView/>;
      case 'scouting':        return <ScoutingPipelineView/>;
      case 'capimpact':       return <CapImpactModellerView club={club}/>;
      case 'agents':          return <AgentContactsView/>;
      case 'targets':         return <TargetsShortlistView/>;
      case 'concussion':      return <ConcussionHIAView/>;
      case 'rtp':             return <ReturnToPlayView/>;
      case 'medical':         return <MedicalRecordsView/>;
      case 'welfareaudit':    return <WelfareAuditView/>;
      case 'mentalperformance':return <MentalPerformanceView/>;
      case 'sponsorship':     return <SponsorshipPipelineView/>;
      case 'matchdayrev':     return <MatchdayRevenueView/>;
      case 'stadium':         return <StadiumVenueView club={club}/>;
      case 'activation':      return <PartnershipActivationView/>;
      case 'mediahr':         return <MediaPRRugbyView club={club}/>;
      case 'fanhub':          return <FanHubRugbyView club={club}/>;
      case 'womenssquad':     return <WomensSquadView/>;
      case 'pwrcompliance':   return <PWRComplianceView/>;
      case 'sharedfacilities':return <SharedFacilitiesView/>;
      case 'womenscommercial':return <WomensCommercialView/>;
      case 'aibriefing':      return <AIBriefingView club={club}/>;
      case 'halftime':        return <AIHalftimeBriefView club={club}/>;
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
              <div><div className="text-xs font-semibold text-white">{session.clubName || club.name}</div><div className="text-[10px] text-gray-500">{club.league} · #{club.leaguePosition}</div></div>
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

        <RoleSwitcher
          session={session}
          roles={RUGBY_ROLES}
          accentColor="#7C3AED"
          onRoleChange={(role) => {
            const key = 'lumio_rugby_demo_session'
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              localStorage.setItem(key, JSON.stringify({ ...parsed, role }))
            }
            setActiveSection(activeSection)
          }}
          sidebarCollapsed={sidebarCollapsed}
        />

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
              {session.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.logoDataUrl} alt="" className="w-10 h-10 rounded-full mx-auto mb-2 object-cover" />
              ) : (
                <div className="text-3xl mb-2">🏉</div>
              )}
              <div className="text-sm font-bold text-white">{session.clubName || club.name}</div>
              <div className="text-[10px] text-gray-500">{club.league}</div>
              <div className="text-xs text-purple-400 font-medium mt-1">#{club.leaguePosition} in league</div>
              <div className="text-xs text-gray-400 mt-1">{club.stadium}</div>
              {session.userName && <div className="text-[10px] text-gray-500 mt-2 border-t border-gray-800 pt-2">{session.userName}</div>}
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
